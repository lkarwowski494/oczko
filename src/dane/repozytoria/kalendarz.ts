// Repozytorium kalendarza dni z robótką, dnia, podsumowania okresu i kolejności „który projekt dziś” (F-59, F-61; RD-15, RD-16;
// P-046, P-048 (3), (4), (6); P-059 (2a): dzień z robótką ≠ dzień limitu).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Praca dnia = zmiany +1/−1 liczników rzędów z dniem zdarzenia (RD-16), bez wpisań, zerowań i zmian cofniętych z historii (RD-15, P-048 (3)).
import { celDzienny, type CelDnia } from '../../domena/postep';
import type { PortBazy } from '../../domena/porty';
import { SESJA_DNIA_MIN_MS } from '../../konfiguracja';
import { liczba, liczbaLubNull, tekst, tekstLubNull, wiersze } from './wiersze';

const nastepnyDzien = (dzien: string, dni: number): string => {
  const [r, m, d] = dzien.split('-').map(Number);
  return new Date(Date.UTC(r, m - 1, d + dni)).toISOString().slice(0, 10);
};
/** Zmiany pracy (wiersze `zdarzenie`) w dniach [od, doWylacznie): +1/−1 liczników rzędów, bez cofniętych z historii. */
const PRACA = `FROM zdarzenie z JOIN licznik l ON l.id = z.licznik_id
  WHERE z.dzien >= ? AND z.dzien < ? AND l.rodzaj = 'rzedy' AND z.rodzaj IN ('plus', 'minus')
    AND z.id NOT IN (SELECT j.value FROM zdarzenie c, json_each(c.cofa) j
                      WHERE c.rodzaj = 'cofniecie' AND c.licznik_id IN (SELECT licznik_id FROM zdarzenie WHERE dzien >= ? AND dzien < ?))`;
const ZMIANA = "CASE z.rodzaj WHEN 'plus' THEN 1 ELSE -1 END";
const zakres = (od: string, doWyl: string): string[] => [od, doWyl, od, doWyl];

/**
 * Dni miesiąca `RRRR-MM` z robótką (wymagania-dni.md „Dzień z robótką”, P-195 Q3b): zmiana +1/−1 licznika rzędów (dzień ze zdarzenia, RD-16),
 * bez wpisań, zerowań i zmian cofniętych, albo zakończona sesja stopera ≥ SESJA_DNIA_MIN_MS po korekcie, w dniu startu sesji. Rosnąco.
 */
export async function dniZRobotka(baza: PortBazy, miesiac: string): Promise<string[]> {
  const [od, doWyl] = [`${miesiac}-01`, `${miesiac}-32`];
  const w = await wiersze(baza.all(
    `SELECT z.dzien AS dzien ${PRACA}
     UNION SELECT s.dzien FROM sesja s WHERE s.dzien >= ? AND s.dzien < ? AND s.stan = 'zakonczona' AND s.koniec_ms - s.start_ms - s.przerwy_ms >= ?
     ORDER BY dzien`, [...zakres(od, doWyl), od, doWyl, SESJA_DNIA_MIN_MS]), 'dniZRobotka');
  return w.map((r) => tekst(r, 'dzien'));
}

/** `czasMs` = suma sesji stopera projektu z dniem `dzien`; null, gdy sesji nie było (P-048 (6)). */
export type ProjektDnia = { projektId: string; nazwa: string; rzedy: number; czasMs: number | null };
const CZAS_SESJI = "CASE WHEN s.stan = 'zakonczona' THEN max(0, s.koniec_ms - s.start_ms - s.przerwy_ms) ELSE 0 END";
export async function szczegolyDnia(baza: PortBazy, dzien: string): Promise<ProjektDnia[]> {
  const doWyl = nastepnyDzien(dzien, 1);
  const praca = await wiersze(baza.all(
    `SELECT c.projekt_id AS projekt, sum(${ZMIANA}) AS n ${PRACA.replace('JOIN licznik l ON l.id = z.licznik_id', 'JOIN licznik l ON l.id = z.licznik_id JOIN czesc c ON c.id = l.czesc_id')} GROUP BY c.projekt_id`,
    zakres(dzien, doWyl)), 'szczegolyDnia');
  const sesje = await wiersze(baza.all(`SELECT s.projekt_id AS projekt, sum(${CZAS_SESJI}) AS ms FROM sesja s WHERE s.dzien = ? GROUP BY s.projekt_id`, [dzien]), 'szczegolyDnia');
  const ids = [...new Set([...praca.map((r) => tekst(r, 'projekt')), ...sesje.map((r) => tekst(r, 'projekt'))])];
  const wynik: ProjektDnia[] = [];
  for (const id of ids) {
    const [p] = await wiersze(baza.all('SELECT nazwa FROM projekt WHERE id = ?', [id]), 'szczegolyDnia');
    const r = praca.find((x) => tekst(x, 'projekt') === id);
    const s = sesje.find((x) => tekst(x, 'projekt') === id);
    wynik.push({ projektId: id, nazwa: p ? tekst(p, 'nazwa') : '', rzedy: r ? liczba(r, 'n') : 0, czasMs: s ? liczba(s, 'ms') : null });
  }
  return wynik;
}

/** Projekty ukończone w danym dniu lokalnym (`ukonczono_dzien`, BR-PRJ-013: zmiana daty przenosi ukończenie); kolejność: chwila ukończenia. */
export type UkonczonyDnia = { projektId: string; nazwa: string; nienazwany: boolean; utworzonoMs: number };
export async function ukonczoneDnia(baza: PortBazy, dzien: string): Promise<UkonczonyDnia[]> {
  const r = await wiersze(baza.all('SELECT id, nazwa, nienazwany, utworzono_ms FROM projekt WHERE ukonczono_dzien = ? AND usunieto_ms IS NULL ORDER BY ukonczono_ms, id', [dzien]), 'ukonczoneDnia');
  return r.map((x) => ({ projektId: tekst(x, 'id'), nazwa: tekst(x, 'nazwa'), nienazwany: liczba(x, 'nienazwany') === 1, utworzonoMs: liczba(x, 'utworzono_ms') }));
}

/** `pierwszyDzienTygodnia`: 1 = poniedziałek … 7 = niedziela; w aplikacji zawsze `PIERWSZY_DZIEN_TYGODNIA` = 1 (P-110 Q7, moduly.md „Czas w przypadkach użycia”). */
export type Podsumowanie = { od: string; do: string; rzedy: number; czasMs: number | null; ukonczone: number; poprzednie: { rzedy: number } };
async function rzedyOkresu(baza: PortBazy, od: string, doWyl: string): Promise<number> {
  const [w] = await wiersze(baza.all(`SELECT sum(${ZMIANA}) AS n ${PRACA}`, zakres(od, doWyl)), 'podsumowanie');
  return (w ? liczbaLubNull(w, 'n') : null) ?? 0;
}
/** Ukończone w tygodniu po dniu lokalnym zapisanym przy ukończeniu (`ukonczono_dzien`, moduly.md „Ukończone w tygodniu…”, fix-3 05). */
export async function podsumowanieTygodnia(baza: PortBazy, w: { dzis: string; pierwszyDzienTygodnia: 1 | 2 | 3 | 4 | 5 | 6 | 7 }): Promise<Podsumowanie> {
  const [r, m, d] = w.dzis.split('-').map(Number);
  const iso = ((new Date(Date.UTC(r, m - 1, d)).getUTCDay() + 6) % 7) + 1; // 1 = pon … 7 = nd
  const od = nastepnyDzien(w.dzis, -((iso - w.pierwszyDzienTygodnia + 7) % 7));
  const doWyl = nastepnyDzien(od, 7);
  const [s] = await wiersze(baza.all(`SELECT count(*) AS k, sum(${CZAS_SESJI}) AS ms FROM sesja s WHERE s.dzien >= ? AND s.dzien < ?`, [od, doWyl]), 'podsumowanie');
  const [u] = await wiersze(baza.all("SELECT count(*) AS n FROM projekt WHERE stan = 'ukonczony' AND usunieto_ms IS NULL AND ukonczono_dzien >= ? AND ukonczono_dzien < ?",
    [od, doWyl]), 'podsumowanie');
  return {
    od, do: nastepnyDzien(od, 6), rzedy: await rzedyOkresu(baza, od, doWyl),
    czasMs: s && liczba(s, 'k') > 0 ? liczba(s, 'ms') : null, ukonczone: u ? liczba(u, 'n') : 0,
    poprzednie: { rzedy: await rzedyOkresu(baza, nastepnyDzien(od, -7), od) },
  };
}

/** Projekty w toku (bez kosza) w kolejności P-048 (4): po terminie, potem cel na dziś malejąco, potem bez terminu według ostatniej pracy. */
export type ProjektDzis = { id: string; nazwa: string; cel: CelDnia | null };
/** Z_przed = Σ min(r_i, c_i) części z celem, r_i = wartość liczników rzędów części na koniec wczoraj (RD-15 jak RD-14); Z_teraz z bieżącej wartości licznika (`licznik.wartosc` = scal, P-134 Q1a). */
export async function celProjektu(baza: PortBazy, projektId: string, termin: string, dzis: string): Promise<CelDnia | null> {
  return (await dzienProjektu(baza, projektId, termin, dzis)).cel;
}
/** Cel na dziś (RD-15) i rzędy zrobione dziś na częściach z celem: Z_teraz − Z_przed (do „today {{zrobione}} of {{count}}”, 04 fix-5). */
export async function dzienProjektu(baza: PortBazy, projektId: string, termin: string, dzis: string): Promise<{ cel: CelDnia | null; zrobioneDzis: number }> {
  const czesci = await wiersze(baza.all('SELECT id, cel_rzedow FROM czesc WHERE projekt_id = ? AND usunieto_ms IS NULL AND cel_rzedow IS NOT NULL', [projektId]), 'kolejnosc');
  let suma = 0, przed = 0, teraz = 0;
  for (const c of czesci) {
    const cel = liczba(c, 'cel_rzedow');
    const [r] = await wiersze(baza.all(
      `SELECT coalesce(sum((SELECT z.wartosc_po FROM zdarzenie z WHERE z.licznik_id = l.id AND z.dzien < ? ORDER BY z.czas_ms DESC, z.rowid DESC LIMIT 1)), 0) AS r,
              coalesce(sum(l.wartosc), 0) AS t
         FROM licznik l WHERE l.czesc_id = ? AND l.rodzaj = 'rzedy' AND l.usunieto_ms IS NULL`, [dzis, tekst(c, 'id')]), 'kolejnosc');
    suma += cel;
    przed += Math.min(r ? liczba(r, 'r') : 0, cel);
    teraz += Math.min(r ? liczba(r, 't') : 0, cel);
  }
  const w = celDzienny({ suma, przedDzis: przed, zrobioneTeraz: teraz, termin, dzis });
  return { cel: w.ok ? w.wartosc : null, zrobioneDzis: Math.max(0, teraz - przed) }; // termin bez celów części (C = 0): brak celu dnia, nie zgadywany cel
}
const ranga = (c: CelDnia | null): number => (c === null ? 3 : c.rodzaj === 'po_terminie' ? 0 : c.rodzaj === 'cel' ? 1 : 2);
export async function kolejnoscProjektow(baza: PortBazy, dzis: string): Promise<ProjektDzis[]> {
  const p = await wiersze(baza.all("SELECT id, nazwa, termin_dzien, ostatnia_praca_ms FROM projekt WHERE stan = 'w_toku' AND usunieto_ms IS NULL"), 'kolejnosc');
  const lista: (ProjektDzis & { praca: number })[] = [];
  for (const r of p) {
    const termin = tekstLubNull(r, 'termin_dzien');
    lista.push({ id: tekst(r, 'id'), nazwa: tekst(r, 'nazwa'), cel: termin ? await celProjektu(baza, tekst(r, 'id'), termin, dzis) : null, praca: liczba(r, 'ostatnia_praca_ms') });
  }
  lista.sort((a, b) => ranga(a.cel) - ranga(b.cel)
    || (a.cel?.rodzaj === 'cel' && b.cel?.rodzaj === 'cel' ? b.cel.rzedy - a.cel.rzedy : 0)
    || b.praca - a.praca);
  return lista.map(({ id, nazwa, cel }) => ({ id, nazwa, cel }));
}

/** Miesiąc z kalendarza (P-191 P6a, BR-DNI-003 S3): rzędy (RD-15), czas zakończonych sesji z dniem w miesiącu (null bez sesji),
 *  ukończone po `ukonczono_dzien`, liczba dni z robótką (wymagania-dni.md, P-195 Q3b). */
export async function podsumowanieMiesiaca(baza: PortBazy, miesiac: string): Promise<{ rzedy: number; czasMs: number | null; ukonczone: number; dni: number }> {
  const od = `${miesiac}-01`, doWyl = `${miesiac}-32`;
  const [s] = await wiersze(baza.all(`SELECT count(*) AS k, sum(${CZAS_SESJI}) AS ms FROM sesja s WHERE s.dzien >= ? AND s.dzien < ? AND s.stan = 'zakonczona'`, [od, doWyl]), 'podsumowanieMiesiaca');
  const [u] = await wiersze(baza.all("SELECT count(*) AS n FROM projekt WHERE stan = 'ukonczony' AND usunieto_ms IS NULL AND ukonczono_dzien >= ? AND ukonczono_dzien < ?", [od, doWyl]), 'podsumowanieMiesiaca');
  return { rzedy: await rzedyOkresu(baza, od, doWyl), czasMs: s && liczba(s, 'k') > 0 ? liczba(s, 'ms') : null, ukonczone: u ? liczba(u, 'n') : 0, dni: (await dniZRobotka(baza, miesiac)).length };
}
