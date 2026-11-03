// Kopie ratunkowe roli 12 (ADR-0020 (3), (6), P-080 (3b)): sprzątanie katalogu kopii po KOPIE_RATUNKOWE_DNI i ZIP surowej kopii, gdy baza się nie
// otwiera. Logika wyboru czysta; adaptery tylko przez system plików warstwy danych. Nic tu nie otwiera bazy (działa przy uszkodzonym pliku).
import type { Wynik } from '../domena/bledy';
import { KOPIA_PRZED_IMPORTEM_BUDZET_B, KOPIA_PRZED_IMPORTEM_DNI, KOPIA_PRZED_IMPORTEM_MAKS, KOPIE_RATUNKOWE_DNI } from '../konfiguracja';
import { zapiszZip, type WpisZip } from '../dane/archiwum/zip';
import { powodBledu } from '../dane/baza/bledy-sqlite';
import { sha256PlikuTs } from '../dane/pliki/magazyn';
import { czasZmiany, istniejeKatalog, istniejePlik, kopiuj, lista, nazwaPliku, otworzDoCzytania, polacz, rozmiar, usunKatalog, usunPlik } from '../dane/pliki/system';

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

/**
 * M1-087 (05-architekt-507): czas najnowszej kopii bazy w `kopie/` (ms z nazwy), także z przyszłości; brak kopii = null. Kopie `.db` nie mają plików
 * magazynu (ADR-0020), więc plik bez wiersza `plik` nie młodszy niż ta kopia (istniał, gdy powstała) może być jej potrzebny i nie jest sprzątany (sprzatnijSierotyMagazynu).
 */
export function najnowszaKopiaMs(wpisy: readonly WpisKopii[]): number | null {
  let max: number | null = null;
  for (const w of wpisy) {
    const m = (w.katalog ? SUROWA : PLIK).exec(w.nazwa);
    if (m && (max === null || Number(m[1]) > max)) max = Number(m[1]);
  }
  return max;
}

/** Kopie z ADR-0028 w Documents/Backup: `oczko-przed-importem-RRRR-MM-DD[-n].oczko` i `oczko-przed-usunieciem-…`; nic innego w tym katalogu nie jest tykane. */
const PLIK_PRZED = /^oczko-przed-(importem|usunieciem)-(\d{4})-(\d{2})-(\d{2})(?:-(\d+))?\.oczko$/;
/** Rozmiar nieznany (ADR-0033 pkt 5): nie liczba skończona > 0 (archiwum `.oczko` ma zawsze co najmniej 22 B). */
const znanyRozmiar = (bajty: number | null): number | null => (bajty !== null && Number.isFinite(bajty) && bajty > 0 ? bajty : null);
/**
 * Pula kopii bezpieczeństwa (ADR-0032, zastępuje ADR-0028 pkt 4; DEC-18 a; K-03f; ADR-0033 zastępuje ADR-0032 pkt 2, P-437), osobno dla każdego
 * rodzaju. Kopie starsze niż `dni` (ściśle, od północy dnia z nazwy, UTC) są usuwane. Z młodszych zawsze zostają chronione: najnowsza i pierwsza kopia
 * najstarszego dnia (najmniejszy przyrostek; seria „Zastąp” zaczyna się od kopii z danymi sprzed serii). Pozostałe pierwsze kopie dni (kandydaci)
 * zostają niezależnie od `maks`, a inne kopie od najnowszej, dopóki zostawionych jest mniej niż `maks`. Dopóki suma znanych rozmiarów zostawionych
 * przekracza `budzetB`, usuwany jest najstarszy kandydat o znanym rozmiarze (dzień, potem przyrostek rosnąco). Kopia o nieznanym rozmiarze (`null`)
 * nie jest usuwana żadną regułą i nie liczy się do sumy (zasada wspólna 10, P-437). Obca nazwa i dzień z przyszłości (cofnięty zegar; ponad dobę po
 * `terazMs`) zostają i nie liczą się do limitu, budżetu ani do pierwszej kopii dnia.
 */
export function kopiePrzedDoUsuniecia(
  wpisy: readonly { nazwa: string; bajty: number | null }[],
  terazMs: number,
  maks = KOPIA_PRZED_IMPORTEM_MAKS,
  dni = KOPIA_PRZED_IMPORTEM_DNI,
  budzetB = KOPIA_PRZED_IMPORTEM_BUDZET_B,
): string[] {
  const usun: string[] = [];
  for (const rodzaj of ['importem', 'usunieciem']) {
    const kopie = wpisy.flatMap(({ nazwa, bajty }) => {
      const m = PLIK_PRZED.exec(nazwa);
      if (!m || m[1] !== rodzaj) return [];
      const dzienMs = Date.UTC(Number(m[2]), Number(m[3]) - 1, Number(m[4]));
      return dzienMs - terazMs > DOBA_MS ? [] : [{ nazwa, dzienMs, n: m[5] === undefined ? 1 : Number(m[5]), bajty: znanyRozmiar(bajty) }];
    });
    kopie.sort((a, b) => b.dzienMs - a.dzienMs || b.n - a.n);
    const mlode = kopie.filter((w) => terazMs - w.dzienMs <= dni * DOBA_MS);
    const pierwszaDnia = new Map<number, string>(); // od najnowszej, więc ostatni zapis dla dnia to najmniejszy przyrostek
    for (const w of mlode) pierwszaDnia.set(w.dzienMs, w.nazwa);
    // ADR-0033 pkt 2: od najnowszej, więc ostatnia młoda to pierwsza kopia najstarszego dnia
    const chronione = new Set([mlode[0], mlode[mlode.length - 1]].flatMap((w) => (w ? [w.nazwa] : [])));
    const zostaja = new Set([...pierwszaDnia.values(), ...chronione]);
    for (const w of mlode) if (zostaja.size < maks) zostaja.add(w.nazwa);
    let suma = 0;
    for (const w of mlode) if (zostaja.has(w.nazwa) && w.bajty !== null) suma += w.bajty;
    for (const w of [...mlode].reverse()) {
      if (suma <= budzetB) break;
      if (w.bajty === null || chronione.has(w.nazwa) || !zostaja.has(w.nazwa)) continue;
      zostaja.delete(w.nazwa);
      suma -= w.bajty;
    }
    for (const w of kopie) if (!zostaja.has(w.nazwa) && w.bajty !== null) usun.push(w.nazwa);
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
/** ADR-0033 pkt 5 (P-437): odczyt rozmiaru osobno dla każdej nazwy; wyjątek albo wartość spoza liczb skończonych > 0 = null (kopia zostaje). */
function rozmiarKopiiPrzed(sciezka: string): number | null {
  try {
    const bajty: unknown = rozmiar(sciezka);
    return typeof bajty === 'number' ? znanyRozmiar(bajty) : null;
  } catch {
    return null; // nieczytelny rozmiar: kopii ratunkowej nie usuwamy na zgadnięcie (celowe)
  }
}
/** Adapter: lista katalogu kopii przed → usunięcie wybranych; brak katalogu = nic do zrobienia, błąd nie blokuje startu (jak `sprzatnijKopie`). */
export function sprzatnijKopiePrzed(katalog: string, terazMs: number): Wynik<string[]> {
  try {
    const wpisy = lista(katalog).map((nazwa) => ({ nazwa, bajty: PLIK_PRZED.test(nazwa) ? rozmiarKopiiPrzed(polacz(katalog, nazwa)) : null }));
    const usun = kopiePrzedDoUsuniecia(wpisy, terazMs).sort();
    for (const n of usun) usunPlik(polacz(katalog, n));
    return { ok: true, wartosc: usun };
  } catch (e) {
    return { ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
  }
}

/** Dane niezapisane w katalogu tymczasowym, nie pamięć podręczna (M1-095): `rysunki-wzoru` to kreski czekające na zapis w JS, odzyskiwane przy
 *  następnym otwarciu wzoru — nie do `Caches` (system mógłby je usunąć) i bez sprzątania przy starcie; czyszczone przy „Delete all data”.
 *  Miniatury (odtwarzalne) są w `Library/Caches` (Katalogi.podreczny); stary katalog `tmp/miniatury` znika przy pierwszym kamieniu milowym. */
const OCZEKUJACE_NA_ZAPIS = ['rysunki-wzoru'];
/**
 * M1-001 (05-architekt-501): `Application Support/tmp` wchodzi do kopii urządzenia, więc pliki pochodne (eksport, ZIP ratunkowy, katalogi importu
 * i zgłoszeń) nie mogą zostawać. Przy kamieniu milowym usuwane są wpisy zmienione przed początkiem bieżącego startu; nowsze (np. eksport w otwartym
 * arkuszu udostępniania), rysunki czekające na zapis i wpisy bez czasu zostają.
 */
export function tymczasoweDoUsuniecia(wpisy: { nazwa: string; zmianaMs: number | null }[], odMs: number): string[] {
  return wpisy.filter((w) => !OCZEKUJACE_NA_ZAPIS.includes(w.nazwa) && w.zmianaMs !== null && w.zmianaMs < odMs).map((w) => w.nazwa);
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
 * M1-075 (ADR-0008, zasada wspólna 10): `dodatkowe` to pliki danych spoza surowej kopii (dziennik +1 z ekranu blokady i zegarka, którego tryb
 * awaryjny nie scala do bazy); w ZIP pod własną nazwą, w manifeście z SHA-256. Najpierw migawka obok celu (moduł Swift może dopisywać linie),
 * więc bajty i SHA w ZIP pochodzą z tego samego stanu; migawka usuwana na końcu. Brak pliku = brak wpisu.
 */
export async function zipSurowejKopii(katalogSurowej: string, pliki: readonly string[], cel: string, o: { aplikacja: string; build: string; terazMs: number; skrot?: (sciezka: string) => Promise<string>; dodatkowe?: readonly string[] }): Promise<Wynik<ManifestSurowejKopii>> {
  const skrot = o.skrot ?? sha256PlikuTs; // P-130 (M1-017): na urządzeniu natywny; TS w Node i jako wzorzec
  const nazwy = pliki.filter((n) => istniejePlik(polacz(katalogSurowej, n)));
  const glowny = nazwy.find((n) => !/-(wal|shm)$/.test(n));
  if (!glowny) return { ok: false, powod: 'bledne_dane' };
  const baza = polacz(katalogSurowej, glowny);
  if (istniejePlik(cel)) return { ok: false, powod: 'zapis' };
  const migawki: string[] = [];
  try {
    const zrodla = nazwy.map((n) => ({ nazwa: n, plik: polacz(katalogSurowej, n) }));
    for (const d of o.dodatkowe ?? []) {
      if (!istniejePlik(d)) continue;
      const m = `${cel}.${nazwaPliku(d)}`;
      usunPlik(m);
      migawki.push(m);
      kopiuj(d, m);
      zrodla.push({ nazwa: nazwaPliku(d), plik: m });
    }
    const pliki: ManifestSurowejKopii['pliki'] = [];
    for (const z of zrodla) pliki.push({ nazwa: z.nazwa, bajty: rozmiar(z.plik), sha256: await skrot(z.plik) });
    const manifest: ManifestSurowejKopii = { format: 'oczko-ratunkowa', wersja: 1, aplikacja: o.aplikacja, build: o.build, utworzono: o.terazMs, ...naglowekBazy(baza), pliki };
    const wpisy: WpisZip[] = [{ nazwa: 'manifest.json', dane: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) }, ...zrodla];
    const w = zapiszZip(cel, wpisy);
    return w.ok ? { ok: true, wartosc: manifest } : w;
  } catch (e) {
    usunPlik(cel);
    return { ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
  } finally {
    for (const m of migawki) usunPlik(m);
  }
}
