// Przypadki użycia licznika (moduly.md „Ścieżka zapisu +1”, ADR-0002, ADR-0005, P-067, P-091 (3a)).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Jedna transakcja w kolejce, bez czekania na nic poza bazą: odczyt → strażnik limitu → zdarzenie + wartość + dzień limitu + ostatnia praca → COMMIT;
// haptyka, ekran, Live Activity i zegarek dopiero po wyniku (wołający). Błąd zapisu → ROLLBACK, `powod: 'zapis'`, wpis w `blad`.
import type { Powod, Wynik } from '../domena/bledy';
import { celCofnieciaIndeks } from '../domena/cofniecie';
import { KROK_MAKS, celCofnieciaStukniecia, stukniecia, type ZdarzenieStukniecia } from '../domena/stukniecia';
import { cofniecieSerii, rodzajStraznika, startDnia, wolaStraznika, type DzienLimitu, type ZrodloCofniecia } from '../domena/limit';
import type { PortBazy } from '../domena/porty';
import { ZNACZENIE_NOWEGO_LICZNIKA } from '../konfiguracja';
import type { RodzajZdarzenia, STANY } from '../domena/stany';
import { kodBledu } from '../dane/baza/bledy-sqlite';
import { zapiszBlad } from '../dane/repozytoria/bledy';
import {
  dniLimituMiesiaca, dopiszZdarzenie, ostatniPlus, seriaOdKonca, stanLicznika, ustawStan, zapiszDzienLimitu, zapiszOstatniaPrace, zdarzenie, type StanLicznika,
  znaczenieNowegoLicznika,
} from '../dane/repozytoria/liczniki';
import { liczba, liczbaLubNull, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { dodajDni } from './daty';
import { wKolejce } from './kolejka';
import type { Zaleznosci } from './zaleznosci';

export type RodzajLicznika = (typeof STANY)['licznik.rodzaj'][number];
export type WynikZmiany = { wartosc: number; zdarzenieId: string };
/** −1 przy 0 (BR-LIC-002 „Granica zera”): wartość bez zmiany i bez zdarzenia, więc `zdarzenieId` = null. */
export type WynikOdjecia = { wartosc: number; zdarzenieId: string | null };

/** `powtorz` (ZM-24): ile zdarzeń `plus` zapisuje zmiana w jednej transakcji (krok licznika); `wartoscPo` to wartość po ostatnim. */
type Zmiana = { rodzaj: RodzajZdarzenia; wartosc: number | null; wartoscPo: number; rodzice: string[]; cofa: string[]; powtorz?: number };
const blad = (powod: Powod): { ok: false; powod: Powod } => ({ ok: false, powod });
const czyBladDanych = (e: unknown): boolean => typeof e === 'object' && e !== null && 'kod' in e && e.kod === 'BLAD_DANYCH';

/** Wspólna ścieżka każdej zmiany licznika; `okresl` liczy zmianę ze stanu odczytanego w tej samej transakcji. */
function zmien(z: Zaleznosci, licznikId: string, operacja: string, okresl: (s: StanLicznika, tx: PortBazy) => Promise<Wynik<Zmiana>>): Promise<Wynik<WynikZmiany>>;
function zmien(z: Zaleznosci, licznikId: string, operacja: string, okresl: (s: StanLicznika, tx: PortBazy) => Promise<Wynik<Zmiana | null>>): Promise<Wynik<WynikOdjecia>>;
function zmien(z: Zaleznosci, licznikId: string, operacja: string, okresl: (s: StanLicznika, tx: PortBazy) => Promise<Wynik<Zmiana | null>>): Promise<Wynik<WynikOdjecia>> {
  return wKolejce(z.baza, async () => {
    const teraz = z.zegar.teraz();
    try {
      return await z.baza.transakcja(async (tx): Promise<Wynik<WynikOdjecia>> => {
        const s = await stanLicznika(tx, licznikId);
        if (!s) return blad('bledne_dane');
        if (s.usuniety) return blad('niedozwolone_przejscie'); // zmiana licznika w koszu (moduly.md, maszyna projektu)
        if (s.zablokowany) return blad('zablokowany'); // F-03
        const zm = await okresl(s, tx);
        if (!zm.ok) return zm;
        if (zm.wartosc === null) return { ok: true, wartosc: { wartosc: s.wartosc, zdarzenieId: null } }; // bez zmiany: nic nie zapisujemy
        let dzien: DzienLimitu | null = null;
        if (wolaStraznika({ rodzaj: rodzajStraznika(zm.wartosc.rodzaj) })) {
          const start = startDnia({
            dni: await dniLimituMiesiaca(tx, teraz.dzien.slice(0, 7)), dzis: teraz.dzien, teraz: teraz.ms,
            ostatniPlus: await ostatniPlus(tx, dodajDni(teraz.dzien, -2)), pro: z.pro(),
          });
          if (!start.dozwolone) return blad('limit'); // ekran pokazuje limit zawczasu; tu wyścig o północy (L-04)
          dzien = start.zapis;
        }
        const { powtorz = 1, ...zapis } = zm.wartosc;
        // Krok „+2” (ADR-0036): łańcuch `powtorz` zdarzeń `plus` o tym samym czasie, jedna decyzja limitu (dla pierwszego), jedna transakcja.
        const ids: string[] = [];
        for (let i = 0; i < powtorz; i += 1) {
          const id = z.id.nowy();
          const poprzedni = ids[ids.length - 1];
          await dopiszZdarzenie(tx, {
            id, licznikId, ...zapis, wartoscPo: zapis.wartoscPo - (powtorz - 1 - i), rodzice: poprzedni ? [poprzedni] : zapis.rodzice,
            zrodlo: 'aplikacja', urzadzenie: z.urzadzenie, urzadzenieRodzaj: z.rodzajUrzadzenia, czasMs: teraz.ms, strefa: teraz.strefa, dzien: teraz.dzien,
          });
          ids.push(id);
        }
        const [pierwszy, ostatni] = [ids[0], ids[ids.length - 1]];
        if (pierwszy === undefined || ostatni === undefined) return blad('bledne_dane'); // powtorz < 1: stan niemożliwy
        await ustawStan(tx, licznikId, { wartosc: zapis.wartoscPo, glowa: ostatni });
        if (dzien) await zapiszDzienLimitu(tx, { dzien: dzien.data, pro: dzien.pro, zaczetoMs: teraz.ms, zdarzenieId: pierwszy });
        await zapiszOstatniaPrace(tx, s.projektId, teraz.ms);
        return { ok: true, wartosc: { wartosc: zapis.wartoscPo, zdarzenieId: ostatni } };
      });
    } catch (e) {
      await zapiszBlad(z.baza, { czasMs: teraz.ms, kod: 'zapis_licznika', szczegoly: { operacja, sqlite: kodBledu(e) } });
      return blad(czyBladDanych(e) ? 'bledne_dane' : 'zapis');
    }
  });
}

const rodzic = (s: StanLicznika): string[] => (s.glowa ? [s.glowa] : []);
const wynik = (w: Zmiana): Wynik<Zmiana> => ({ ok: true, wartosc: w });

/** +1: jedna transakcja w kolejce; błąd kroku 3 → ROLLBACK i `powod: 'zapis'` (moduly.md:69–76). */
export function dodajRzad(z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<WynikZmiany>> {
  return zmien(z, w.licznikId, 'dodajRzad', async (s) => wynik({ rodzaj: 'plus', wartosc: null, wartoscPo: s.wartosc + s.krok, rodzice: rodzic(s), cofa: [], powtorz: s.krok }));
}
export function odejmijRzad(z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<WynikOdjecia>> {
  return zmien(z, w.licznikId, 'odejmijRzad', async (s): Promise<Wynik<Zmiana | null>> => s.wartosc === 0 ? { ok: true, wartosc: null } : wynik({ rodzaj: 'minus', wartosc: null, wartoscPo: s.wartosc - 1, rodzice: rodzic(s), cofa: [] }));
}
/** Wartość sprzed zdarzenia = wartość po jego rodzicu (historia liniowa w aplikacji; brak rodzica = 0). */
async function wartoscPrzed(tx: PortBazy, rodzicId: string | undefined): Promise<number> {
  if (!rodzicId) return 0;
  const r = await zdarzenie(tx, rodzicId);
  return r ? r.wartoscPo : 0;
}
/**
 * Cofnięcie ostatniej zmiany, która nie jest już cofnięta (P-091 (3a), BR-LIC-003, 07-jakosc-021): `cofa = [cel]`, wartość sprzed celu.
 * Głowa-cofnięcie i zmiany przez nie cofnięte są pomijane, więc drugie „Undo” cofa poprzednią zmianę, a nie ponawia cofniętej.
 */
export function cofnijOstatnie(z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<WynikZmiany>> {
  return zmien(z, w.licznikId, 'cofnijOstatnie', async (s, tx) => {
    if (!s.glowa) return blad('niedozwolone_przejscie'); // nic do cofnięcia
    const lancuch: ZdarzenieStukniecia[] = [];
    let doczytaj = -1; // −1: szukamy celu; ≥ 0: ile rodziców po celu jeszcze doczytać (stuknięcie „+2” ma dwa zdarzenia, ADR-0036)
    for (let id: string | undefined = s.glowa; id; id = lancuch[lancuch.length - 1]?.rodzice[0]) {
      const e = await zdarzenie(tx, id);
      if (!e) return blad('bledne_dane');
      lancuch.push({ id: e.id, rodzaj: e.rodzaj, czasMs: e.czasMs, rodzice: e.rodzice, zrodlo: e.zrodlo, urzadzenie: e.urzadzenie, cofa: e.cofa });
      if (doczytaj < 0) {
        if (celCofnieciaIndeks(lancuch.map((x) => ({ id: x.id, rodzaj: x.rodzaj, cofa: x.cofa ?? [] }))) === null) continue; // cel jeszcze nie znaleziony
        doczytaj = KROK_MAKS - 1;
      } else doczytaj -= 1;
      if (doczytaj <= 0) break;
    }
    const cel = celCofnieciaStukniecia(lancuch, stukniecia(lancuch));
    if (!cel) return blad('niedozwolone_przejscie'); // wszystkie zmiany już cofnięte
    const pierwszy = lancuch.find((e) => e.id === cel.przedId);
    const v = await wartoscPrzed(tx, pierwszy?.rodzice[0]);
    return wynik({ rodzaj: 'cofniecie', wartosc: v, wartoscPo: v, rodzice: [s.glowa], cofa: cel.cofa });
  });
}
/**
 * Cofnięcie serii na końcu historii, od zdarzenia `odZdarzeniaId` do głowy (F-02, F-47, P-091 (3a)).
 * `zrodlo`: „pytanie-serii” (baner strażnika) zwraca dzień limitu, gdy seria zaczęła dzień i nie było w nim innych dodań ani wpisań (L-19, BR-LIC-019 S7);
 * „historia” dnia nie zwraca (L-06). Zwrot w tej samej transakcji co cofnięcie.
 */
export function cofnijSerie(z: Zaleznosci, w: { licznikId: string; odZdarzeniaId: string; zrodlo: ZrodloCofniecia }): Promise<Wynik<WynikZmiany>> {
  return zmien(z, w.licznikId, 'cofnijSerie', async (s, tx) => {
    if (!s.glowa) return blad('niedozwolone_przejscie');
    const seria = await seriaOdKonca(tx, s.glowa, w.odZdarzeniaId);
    if (!seria) return blad('niedozwolone_przejscie'); // pomyłkę ze środka historii poprawia wpisanie wartości (M-08b)
    const v = await wartoscPrzed(tx, seria.rodzicPoczatku ?? undefined);
    if (w.zrodlo === 'pytanie-serii') await zwrocDzienLimitu(tx, seria.ids);
    return wynik({ rodzaj: 'cofniecie', wartosc: v, wartoscPo: v, rodzice: [s.glowa], cofa: seria.ids });
  });
}
/** Dzień limitu wraca z pytania o serię (L-19): reguła w domenie (`cofniecieSerii`), dane dnia z bazy; „inne dodania” = +1 i wpisania dnia poza serią (także cofnięte, L-19b). */
async function zwrocDzienLimitu(tx: PortBazy, idSerii: readonly string[]): Promise<void> {
  const pierwszy = idSerii[idSerii.length - 1]; // seriaOdKonca: od głowy wstecz, więc ostatni = pierwsze zdarzenie serii
  if (pierwszy === undefined) return;
  const [d] = await wiersze(tx.all('SELECT dzien FROM zdarzenie WHERE id = ?', [pierwszy]), 'zwrocDzienLimitu');
  if (!d) return;
  const dzien = tekst(d, 'dzien');
  const [start] = await wiersze(tx.all('SELECT zdarzenie_id FROM dzien_limitu WHERE dzien = ?', [dzien]), 'zwrocDzienLimitu');
  const ph = idSerii.map(() => '?').join(', ');
  const [inne] = await wiersze(tx.all(`SELECT count(*) AS n FROM zdarzenie WHERE dzien = ? AND rodzaj IN ('plus', 'wpisanie') AND id NOT IN (${ph})`, [dzien, ...idSerii]), 'zwrocDzienLimitu');
  const r = cofniecieSerii({
    dni: await dniLimituMiesiaca(tx, dzien.slice(0, 7)), dzienSerii: dzien, seriaZaczelaDzien: !!start && idSerii.includes(tekst(start, 'zdarzenie_id')),
    inneDodaniaDnia: inne ? liczba(inne, 'n') : 0, zrodlo: 'pytanie-serii',
  });
  if (r.zwrocono) await tx.run('DELETE FROM dzien_limitu WHERE dzien = ?', [dzien]);
}
export function wpiszWartosc(z: Zaleznosci, w: { licznikId: string; wartosc: number }): Promise<Wynik<WynikZmiany>> {
  return zmien(z, w.licznikId, 'wpiszWartosc', async (s) => {
    if (!Number.isInteger(w.wartosc) || w.wartosc < 0) return blad('bledne_dane'); // wpis użytkowniczki (P-118 Q1a)
    return wynik({ rodzaj: 'wpisanie', wartosc: w.wartosc, wartoscPo: w.wartosc, rodzice: rodzic(s), cofa: [] });
  });
}
export function wyzeruj(z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<WynikZmiany>> {
  return zmien(z, w.licznikId, 'wyzeruj', async (s) => wynik({ rodzaj: 'zerowanie', wartosc: null, wartoscPo: 0, rodzice: rodzic(s), cofa: [] }));
}

const RODZAJE_LICZNIKA: readonly string[] = ['rzedy', 'oczka'];
export function dodajLicznik(z: Zaleznosci, w: { czescId: string; rodzaj: RodzajLicznika; nazwa?: string }): Promise<Wynik<{ licznikId: string }>> {
  return wKolejce(z.baza, async () => {
    if (!RODZAJE_LICZNIKA.includes(w.rodzaj)) return blad('bledne_dane');
    const teraz = z.zegar.teraz();
    try {
      return await z.baza.transakcja(async (tx): Promise<Wynik<{ licznikId: string }>> => {
        const [c] = await wiersze(tx.all('SELECT usunieto_ms, projekt_id FROM czesc WHERE id = ?', [w.czescId]), 'dodajLicznik');
        if (!c) return blad('bledne_dane');
        if (liczbaLubNull(c, 'usunieto_ms') !== null) return blad('niedozwolone_przejscie');
        const licznikId = z.id.nowy();
        const znaczenie = await znaczenieNowegoLicznika(tx, tekst(c, 'projekt_id')); // ZM-21: znaczenie jawnie, nie z DEFAULT
        await tx.run(
          `INSERT INTO licznik (id, czesc_id, nazwa, rodzaj, znaczenie, kolejnosc, zmieniono_ms)
           VALUES (?, ?, ?, ?, ?, (SELECT coalesce(max(kolejnosc), 0) + 1 FROM licznik WHERE czesc_id = ?), ?)`,
          [licznikId, w.czescId, w.nazwa ?? '', w.rodzaj, znaczenie, w.czescId, teraz.ms],
        );
        return { ok: true, wartosc: { licznikId } };
      });
    } catch (e) {
      await zapiszBlad(z.baza, { czasMs: teraz.ms, kod: 'zapis_licznika', szczegoly: { operacja: 'dodajLicznik', sqlite: kodBledu(e) } });
      return blad('zapis');
    }
  });
}
/**
 * Licznik od pierwszego uruchomienia bez nazwy (BR-LIC-001, NFR-PIE-001): projekt roboczy z jedną częścią.
 * `nienazwany = 1`, nazwa zapasowa = data startu (RD-16); etykieta w bieżącym języku liczona przy wyświetlaniu (dane.md „Projekt roboczy bez nazwy”, P-126 (1b)).
 */
export function utworzSzybkiLicznik(z: Zaleznosci): Promise<Wynik<{ projektId: string; czescId: string; licznikId: string }>> {
  return wKolejce(z.baza, async () => {
    const teraz = z.zegar.teraz();
    const projektId = z.id.nowy(), czescId = z.id.nowy(), licznikId = z.id.nowy();
    try {
      await z.baza.transakcja(async (tx) => {
        await tx.run('INSERT INTO projekt (id, nazwa, nienazwany, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES (?, ?, 1, ?, ?, ?)', [projektId, teraz.dzien, teraz.ms, teraz.ms, teraz.ms]);
        await tx.run('INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, 1, ?)', [czescId, projektId, teraz.dzien, teraz.ms]);
        await tx.run('INSERT INTO licznik (id, czesc_id, znaczenie, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, 1, ?)', [licznikId, czescId, ZNACZENIE_NOWEGO_LICZNIKA, teraz.ms]); // ZM-21: pierwszy licznik = „Rząd, nad którym pracuję”
      });
      return { ok: true, wartosc: { projektId, czescId, licznikId } };
    } catch (e) {
      await zapiszBlad(z.baza, { czasMs: teraz.ms, kod: 'zapis_licznika', szczegoly: { operacja: 'utworzSzybkiLicznik', sqlite: kodBledu(e) } });
      return blad('zapis');
    }
  });
}

/** Blokada licznika (F-03, BR-LIC-004): stan licznika, nie zdarzenie historii; licznik w koszu → `niedozwolone_przejscie`. */
export function ustawBlokade(z: Zaleznosci, w: { licznikId: string; zablokowany: boolean }): Promise<Wynik<void>> {
  return wKolejce(z.baza, async () => {
    const teraz = z.zegar.teraz();
    try {
      return await z.baza.transakcja(async (tx): Promise<Wynik<void>> => {
        const s = await stanLicznika(tx, w.licznikId);
        if (!s) return blad('bledne_dane');
        if (s.usuniety) return blad('niedozwolone_przejscie');
        await tx.run('UPDATE licznik SET zablokowany = ?, zmieniono_ms = ? WHERE id = ?', [w.zablokowany ? 1 : 0, teraz.ms, w.licznikId]);
        return { ok: true, wartosc: undefined };
      });
    } catch (e) {
      await zapiszBlad(z.baza, { czasMs: teraz.ms, kod: 'zapis_licznika', szczegoly: { operacja: 'ustawBlokade', sqlite: kodBledu(e) } });
      return blad('zapis');
    }
  });
}
