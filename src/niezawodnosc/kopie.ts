// Kopie ratunkowe roli 12 (ADR-0020 (3), (6), P-080 (3b)): sprzątanie katalogu kopii po KOPIE_RATUNKOWE_DNI i ZIP surowej kopii, gdy baza się nie
// otwiera. Logika wyboru czysta; adaptery tylko przez system plików warstwy danych. Nic tu nie otwiera bazy (działa przy uszkodzonym pliku).
import type { Wynik } from '../domena/bledy';
import { KOPIA_PRZED_IMPORTEM_DNI, KOPIA_PRZED_IMPORTEM_MAKS, KOPIE_RATUNKOWE_DNI } from '../konfiguracja';
import { zapiszZip, type WpisZip } from '../dane/archiwum/zip';
import { powodBledu } from '../dane/baza/bledy-sqlite';
import { sha256PlikuTs } from '../dane/pliki/magazyn';
import { czasZmiany, istniejeKatalog, istniejePlik, lista, otworzDoCzytania, polacz, rozmiar, usunKatalog, usunPlik } from '../dane/pliki/system';

const DOBA_MS = 86_400_000;
export type WpisKopii = { nazwa: string; katalog: boolean };

// Nazwy kopii z czasem utworzenia (ms): surowa kopia to katalog (ADR-0020 (1)), pozostałe to pliki `VACUUM INTO` (dane.md, ADR-0004, ADR-0020 (5)).
const SUROWA = /^ratunkowe-(\d{10,})$/;
const PLIK = /^(?:przed-importem|przed-przywroceniem|przed-migracja-\d+)-(\d{10,})\.db$/;

/**
 * Kopie starsze niż `dni` (ściśle) do usunięcia. Wołający woła tylko przy kamieniu milowym strażnika (ADR-0019), więc kopia nigdy nie znika przed
 * udanym startem nowej wersji. Zostaje: nazwa bez czasu albo obca, czas z przyszłości (cofnięty zegar), wpis innego rodzaju niż oczekiwany.
 */
export function kopieDoUsuniecia(wpisy: readonly WpisKopii[], terazMs: number, dni = KOPIE_RATUNKOWE_DNI): string[] {
  return wpisy
    .filter((w) => {
      const m = (w.katalog ? SUROWA : PLIK).exec(w.nazwa);
      if (!m) return false;
      const ms = Number(m[1]);
      return ms <= terazMs && terazMs - ms > dni * DOBA_MS;
    })
    .map((w) => w.nazwa);
}

/** Kopie z ADR-0028 w Documents/Backup: `oczko-przed-importem-RRRR-MM-DD[-n].oczko` i `oczko-przed-usunieciem-…`; nic innego w tym katalogu nie jest tykane. */
const PLIK_PRZED = /^oczko-przed-(importem|usunieciem)-(\d{4})-(\d{2})-(\d{2})(?:-(\d+))?\.oczko$/;
/**
 * Pula kopii bezpieczeństwa (ADR-0032, zastępuje ADR-0028 pkt 4; DEC-18 a; K-03f), osobno dla każdego rodzaju. Kopie starsze niż `dni` (ściśle, od
 * północy dnia z nazwy, UTC) są usuwane. Z młodszych zostają: pierwsza kopia każdego dnia (najmniejszy przyrostek; seria „Zastąp” jednego dnia zaczyna
 * się od kopii z danymi sprzed serii) niezależnie od `maks`, najnowsza zawsze, a pozostałe od najnowszej, dopóki zostawionych jest mniej niż `maks`.
 * Obca nazwa i dzień z przyszłości (cofnięty zegar; ponad dobę po `terazMs`) zostają i nie liczą się do limitu ani do pierwszej kopii dnia.
 */
export function kopiePrzedDoUsuniecia(nazwy: readonly string[], terazMs: number, maks = KOPIA_PRZED_IMPORTEM_MAKS, dni = KOPIA_PRZED_IMPORTEM_DNI): string[] {
  const usun: string[] = [];
  for (const rodzaj of ['importem', 'usunieciem']) {
    const wpisy = nazwy.flatMap((nazwa) => {
      const m = PLIK_PRZED.exec(nazwa);
      if (!m || m[1] !== rodzaj) return [];
      const dzienMs = Date.UTC(Number(m[2]), Number(m[3]) - 1, Number(m[4]));
      return dzienMs - terazMs > DOBA_MS ? [] : [{ nazwa, dzienMs, n: m[5] === undefined ? 1 : Number(m[5]) }];
    });
    wpisy.sort((a, b) => b.dzienMs - a.dzienMs || b.n - a.n);
    const mlode = wpisy.filter((w) => terazMs - w.dzienMs <= dni * DOBA_MS);
    const pierwszaDnia = new Map<number, string>(); // od najnowszej, więc ostatni zapis dla dnia to najmniejszy przyrostek
    for (const w of mlode) pierwszaDnia.set(w.dzienMs, w.nazwa);
    const zostaja = new Set([...pierwszaDnia.values(), ...mlode.slice(0, 1).map((w) => w.nazwa)]);
    for (const w of mlode) if (zostaja.size < maks) zostaja.add(w.nazwa);
    for (const w of wpisy) if (!zostaja.has(w.nazwa)) usun.push(w.nazwa);
  }
  return usun;
}
/** P-339 (N-05-2): czy wśród nazw jest kopia Oczka z ADR-0028; obce pliki nie liczą się (podpis o kopiach pokazujemy tylko, gdy kopie są). */
export function czySaKopiePrzed(nazwy: readonly string[]): boolean {
  return nazwy.some((n) => PLIK_PRZED.test(n));
}
/** Adapter: czy Documents/Backup zawiera kopie Oczka. Brak katalogu albo błąd odczytu = false (podpisu nie pokazujemy na zgadnięcie). */
export function saKopiePrzed(katalog: string): boolean {
  try {
    return czySaKopiePrzed(lista(katalog));
  } catch {
    return false; // nieczytelny katalog: brak podpisu jest bezpieczniejszy niż podpis o kopiach, których nie widzimy (celowe, jak sprzatnijKopiePrzed)
  }
}
/** Adapter: lista katalogu kopii przed → usunięcie wybranych; brak katalogu = nic do zrobienia, błąd nie blokuje startu (jak `sprzatnijKopie`). */
export function sprzatnijKopiePrzed(katalog: string, terazMs: number): Wynik<string[]> {
  try {
    const usun = kopiePrzedDoUsuniecia(lista(katalog), terazMs).sort();
    for (const n of usun) usunPlik(polacz(katalog, n));
    return { ok: true, wartosc: usun };
  } catch (e) {
    return { ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
  }
}

/** Pamięci podręczne w katalogu tymczasowym (dane odtwarzalne): bez sprzątania przy starcie, czyszczone przy „Delete all data”. */
const PAMIECI_PODRECZNE = ['miniatury', 'rysunki-wzoru'];
/**
 * M1-001 (05-architekt-501): `Application Support/tmp` wchodzi do kopii urządzenia, więc pliki pochodne (eksport, ZIP ratunkowy, katalogi importu
 * i zgłoszeń) nie mogą zostawać. Przy kamieniu milowym usuwane są wpisy zmienione przed początkiem bieżącego startu; nowsze (np. eksport w otwartym
 * arkuszu udostępniania), pamięci podręczne i wpisy bez czasu zostają.
 */
export function tymczasoweDoUsuniecia(wpisy: { nazwa: string; zmianaMs: number | null }[], odMs: number): string[] {
  return wpisy.filter((w) => !PAMIECI_PODRECZNE.includes(w.nazwa) && w.zmianaMs !== null && w.zmianaMs < odMs).map((w) => w.nazwa);
}
/** Adapter: lista katalogu tymczasowego → usunięcie wybranych plików i katalogów; brak katalogu = nic do zrobienia, błąd nie blokuje startu. */
export function sprzatnijTymczasowe(katalog: string, odMs: number): Wynik<string[]> {
  try {
    if (!istniejeKatalog(katalog)) return { ok: true, wartosc: [] };
    const usun = tymczasoweDoUsuniecia(lista(katalog).map((nazwa) => ({ nazwa, zmianaMs: czasZmiany(polacz(katalog, nazwa)) })), odMs).sort();
    for (const n of usun) {
      const p = polacz(katalog, n);
      if (istniejeKatalog(p)) usunKatalog(p);
      else usunPlik(p);
    }
    return { ok: true, wartosc: usun };
  } catch (e) {
    return { ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
  }
}

/** Adapter sprzątania: lista katalogu kopii → usunięcie wybranych. Brak katalogu = nic do zrobienia. */
export function sprzatnijKopie(katalogKopii: string, terazMs: number): Wynik<string[]> {
  try {
    const wpisy = lista(katalogKopii).map((nazwa) => ({ nazwa, katalog: istniejeKatalog(polacz(katalogKopii, nazwa)) }));
    const usun = kopieDoUsuniecia(wpisy, terazMs).sort();
    for (const n of usun) {
      const p = polacz(katalogKopii, n);
      if (istniejeKatalog(p)) usunKatalog(p);
      else usunPlik(p);
    }
    return { ok: true, wartosc: usun };
  } catch (e) {
    return { ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
  }
}

export type ManifestSurowejKopii = {
  format: 'oczko-ratunkowa';
  wersja: 1;
  aplikacja: string;
  build: string;
  utworzono: number;
  user_version: number | null;
  application_id: number | null;
  pliki: { nazwa: string; bajty: number; sha256: string }[];
};

/** Nagłówek pliku SQLite (sqlite.org/fileformat2.html §1.3): sygnatura 16 B, user_version offset 60, application_id offset 68, big-endian. */
function naglowekBazy(sciezka: string): { user_version: number | null; application_id: number | null } {
  const c = otworzDoCzytania(sciezka);
  try {
    if (c.rozmiar < 100) return { user_version: null, application_id: null };
    const b = c.czytaj(0, 100);
    const sygnatura = 'SQLite format 3\0';
    for (let i = 0; i < 16; i++) if (b[i] !== sygnatura.charCodeAt(i)) return { user_version: null, application_id: null };
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { user_version: v.getUint32(60, false), application_id: v.getUint32(68, false) };
  } finally {
    c.zamknij();
  }
}

/**
 * ADR-0020 (3), P-080 (3b): jeden ZIP z plikami surowej kopii (`pliki` z wyniku `surowaKopia`: plik bazy oraz jego -wal i -shm, które są)
 * i `manifest.json` (wersja aplikacji, build, user_version i application_id z nagłówka, SHA-256 plików). Bazy nie otwiera. Nazwy plików bierze
 * od wołającego (jedno źródło nazwy bazy: sciezki.ts, P-180). Cel nie może istnieć; niepełny plik po błędzie jest usuwany.
 */
export async function zipSurowejKopii(katalogSurowej: string, pliki: readonly string[], cel: string, o: { aplikacja: string; build: string; terazMs: number }): Promise<Wynik<ManifestSurowejKopii>> {
  const nazwy = pliki.filter((n) => istniejePlik(polacz(katalogSurowej, n)));
  const glowny = nazwy.find((n) => !/-(wal|shm)$/.test(n));
  if (!glowny) return { ok: false, powod: 'bledne_dane' };
  const baza = polacz(katalogSurowej, glowny);
  if (istniejePlik(cel)) return { ok: false, powod: 'zapis' };
  try {
    const pliki: ManifestSurowejKopii['pliki'] = [];
    for (const n of nazwy) {
      const p = polacz(katalogSurowej, n);
      pliki.push({ nazwa: n, bajty: rozmiar(p), sha256: await sha256PlikuTs(p) });
    }
    const manifest: ManifestSurowejKopii = { format: 'oczko-ratunkowa', wersja: 1, aplikacja: o.aplikacja, build: o.build, utworzono: o.terazMs, ...naglowekBazy(baza), pliki };
    const wpisy: WpisZip[] = [{ nazwa: 'manifest.json', dane: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) }, ...nazwy.map((n) => ({ nazwa: n, plik: polacz(katalogSurowej, n) }))];
    const w = zapiszZip(cel, wpisy);
    return w.ok ? { ok: true, wartosc: manifest } : w;
  } catch (e) {
    usunPlik(cel);
    return { ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
  }
}
