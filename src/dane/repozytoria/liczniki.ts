// Repozytorium licznika i jego zdarzeń (moduly.md „Ścieżka zapisu +1”, ADR-0002, ADR-0005): odczyt stanu, dopisanie zdarzenia
// (historia tylko dopisywana), pamięć podręczna wartości, dni limitu (`zapis-dnia-limitu.sql`, dane.md) i ostatnia praca projektu.
import type { DzienLimitu } from '../../domena/limit';
import type { ZdarzenieLicznika } from '../../domena/scal';
import type { PortBazy } from '../../domena/porty';
import { BladDanych } from '../../domena/bledy';
import { celZPary } from '../../domena/cel-pary';
import { licznikCalosci } from '../../domena/licznik-calosci';
import { STANY, type RodzajUrzadzenia, type RodzajZdarzenia, type ZrodloZdarzenia } from '../../domena/stany';
import { liczba, liczbaLubNull, listaTekstow, tekst, tekstLubNull, wiersze } from './wiersze';

export type StanLicznika = {
  id: string; projektId: string; wartosc: number; glowa: string | null; zablokowany: boolean; konflikt: boolean;
  rodzaj: 'rzedy' | 'oczka'; usuniety: boolean; // usunięty licznik, część albo projekt (kosz, P-026)
};
export type NoweZdarzenie = {
  id: string; licznikId: string; rodzaj: RodzajZdarzenia; wartosc: number | null; wartoscPo: number; rodzice: string[]; cofa: string[];
  zrodlo: ZrodloZdarzenia; urzadzenie: string; czasMs: number; strefa: string; dzien: string;
  urzadzenieRodzaj?: RodzajUrzadzenia | null; // P-247 U6a: „iPhone” / „iPad” w wyborze wersji; brak = NULL
};

export async function stanLicznika(tx: PortBazy, licznikId: string): Promise<StanLicznika | null> {
  const [w] = await wiersze(tx.all(
    `SELECT l.id, c.projekt_id, l.wartosc, l.glowa, l.zablokowany, l.konflikt, l.rodzaj,
            (l.usunieto_ms IS NOT NULL OR c.usunieto_ms IS NOT NULL OR p.usunieto_ms IS NOT NULL) AS usuniety
       FROM licznik l JOIN czesc c ON c.id = l.czesc_id JOIN projekt p ON p.id = c.projekt_id WHERE l.id = ?`, [licznikId]), 'stanLicznika');
  if (!w) return null;
  const rodzaj = tekst(w, 'rodzaj');
  return {
    id: tekst(w, 'id'), projektId: tekst(w, 'projekt_id'), wartosc: liczba(w, 'wartosc'), glowa: tekstLubNull(w, 'glowa'),
    zablokowany: liczba(w, 'zablokowany') === 1, konflikt: liczba(w, 'konflikt') === 1, rodzaj: rodzaj === 'oczka' ? 'oczka' : 'rzedy',
    usuniety: liczba(w, 'usuniety') === 1,
  };
}

export async function dopiszZdarzenie(tx: PortBazy, z: NoweZdarzenie): Promise<void> {
  await tx.run(
    `INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc, wartosc_po, rodzice, cofa, zrodlo, urzadzenie, urzadzenie_rodzaj, czas_ms, strefa, dzien)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [z.id, z.licznikId, z.rodzaj, z.wartosc, z.wartoscPo, JSON.stringify(z.rodzice), JSON.stringify(z.cofa), z.zrodlo, z.urzadzenie, z.urzadzenieRodzaj ?? null, z.czasMs, z.strefa, z.dzien],
  );
}
/** Pamięć podręczna wyniku `scal` w tej samej transakcji co zdarzenie (schemat.sql, `licznik.wartosc`). */
export async function ustawStan(tx: PortBazy, licznikId: string, s: { wartosc: number; glowa: string | null; konflikt?: boolean }): Promise<void> {
  if (s.konflikt === undefined) await tx.run('UPDATE licznik SET wartosc = ?, glowa = ? WHERE id = ?', [s.wartosc, s.glowa, licznikId]);
  else await tx.run('UPDATE licznik SET wartosc = ?, glowa = ?, konflikt = ? WHERE id = ?', [s.wartosc, s.glowa, s.konflikt ? 1 : 0, licznikId]);
}
export async function zapiszOstatniaPrace(tx: PortBazy, projektId: string, czasMs: number): Promise<void> {
  await tx.run('UPDATE projekt SET ostatnia_praca_ms = max(ostatnia_praca_ms, ?) WHERE id = ?', [czasMs, projektId]);
}

export type ZdarzenieZapisane = { id: string; rodzaj: RodzajZdarzenia; wartoscPo: number; rodzice: string[]; cofa: string[]; dzien: string };
export async function zdarzenie(tx: PortBazy, id: string): Promise<ZdarzenieZapisane | null> {
  const [w] = await wiersze(tx.all('SELECT id, rodzaj, wartosc_po, rodzice, cofa, dzien FROM zdarzenie WHERE id = ?', [id]), 'zdarzenie');
  if (!w) return null;
  const rodzaj = tekst(w, 'rodzaj');
  const r = STANY['zdarzenie.rodzaj'].find((x) => x === rodzaj);
  if (r === undefined) throw new BladDanych(`zdarzenie ${id}: nieznany rodzaj`); // CHECK w schemacie, więc stan niemożliwy
  return { id: tekst(w, 'id'), rodzaj: r, wartoscPo: liczba(w, 'wartosc_po'), rodzice: listaTekstow(w, 'rodzice'), cofa: listaTekstow(w, 'cofa'), dzien: tekst(w, 'dzien') };
}

/** Dni limitu miesiąca `RRRR-MM` (wejście `dni` funkcji limitu). */
export async function dniLimituMiesiaca(tx: PortBazy, miesiac: string): Promise<DzienLimitu[]> {
  const w = await wiersze(tx.all('SELECT dzien, pro FROM dzien_limitu WHERE dzien >= ? AND dzien < ? ORDER BY dzien', [`${miesiac}-01`, `${miesiac}-32`]), 'dniLimitu');
  return w.map((r) => ({ data: tekst(r, 'dzien'), pro: liczba(r, 'pro') === 1 }));
}
/** Czas poprzedniego +1 w dowolnym projekcie (limit.mjs: `ostatniPlus`); przerwa nowego dnia to godzina, więc wystarczą dni od `odDnia` (indeks zdarzenie_dzien). */
export async function ostatniPlus(tx: PortBazy, odDnia: string): Promise<number | null> {
  const [w] = await wiersze(tx.all("SELECT max(czas_ms) AS m FROM zdarzenie WHERE dzien >= ? AND rodzaj = 'plus'", [odDnia]), 'ostatniPlus');
  return w ? liczbaLubNull(w, 'm') : null;
}
/** dane.md „Dni limitu: zapis i scalenie”: jedna data = jeden wiersz, `pro` = OR, najwcześniejszy start; wiersza nigdy nie usuwa (L-16). */
export async function zapiszDzienLimitu(tx: PortBazy, d: { dzien: string; pro: boolean; zaczetoMs: number; zdarzenieId: string }): Promise<void> {
  await tx.run(
    `INSERT INTO dzien_limitu (dzien, pro, zaczeto_ms, zdarzenie_id) VALUES (?, ?, ?, ?)
     ON CONFLICT (dzien) DO UPDATE SET
       pro = max(pro, excluded.pro),
       zdarzenie_id = CASE WHEN excluded.zaczeto_ms < zaczeto_ms THEN excluded.zdarzenie_id ELSE zdarzenie_id END,
       zaczeto_ms = min(zaczeto_ms, excluded.zaczeto_ms)`,
    [d.dzien, d.pro ? 1 : 0, d.zaczetoMs, d.zdarzenieId],
  );
}
/** Łańcuch od głowy wstecz po pierwszym rodzicu, aż do `doId` włącznie; null, gdy `doId` nie leży na łańcuchu (cofnięcie serii z końca, P-091 (3a)). */
export async function seriaOdKonca(tx: PortBazy, glowa: string, doId: string): Promise<{ ids: string[]; rodzicPoczatku: string | null } | null> {
  const w = await wiersze(tx.all(
    `WITH RECURSIVE lancuch(id, rodzic, n) AS (
       SELECT id, json_extract(rodzice, '$[0]'), 0 FROM zdarzenie WHERE id = ?
       UNION ALL
       SELECT z.id, json_extract(z.rodzice, '$[0]'), l.n + 1 FROM zdarzenie z JOIN lancuch l ON z.id = l.rodzic WHERE l.id <> ?
     ) SELECT id, rodzic FROM lancuch ORDER BY n`, [glowa, doId]), 'seriaOdKonca');
  const ostatni = w[w.length - 1];
  if (!ostatni || tekst(ostatni, 'id') !== doId) return null;
  return { ids: w.map((r) => tekst(r, 'id')), rodzicPoczatku: tekstLubNull(ostatni, 'rodzic') };
}

/** Wszystkie zdarzenia licznika w postaci wejścia `scal` (ADR-0005); wartości ustawień z kolumny `wartosc`. */
export async function zdarzeniaDoScalenia(tx: PortBazy, licznikId: string): Promise<ZdarzenieLicznika[]> {
  const w = await wiersze(tx.all('SELECT id, rodzaj, wartosc, rodzice, cofa FROM zdarzenie WHERE licznik_id = ?', [licznikId]), 'zdarzeniaDoScalenia');
  return w.map((r) => {
    const rodzaj = tekst(r, 'rodzaj');
    const rz = STANY['zdarzenie.rodzaj'].find((x) => x === rodzaj);
    if (rz === undefined) throw new BladDanych(`zdarzenie ${tekst(r, 'id')}: nieznany rodzaj`);
    const wartosc = liczbaLubNull(r, 'wartosc');
    return { id: tekst(r, 'id'), licznik: licznikId, rodzaj: rz, ...(wartosc === null ? {} : { wartosc }), rodzice: listaTekstow(r, 'rodzice'), cofa: listaTekstow(r, 'cofa') };
  });
}
/** Treść zapisanego zdarzenia do porównania przy ponownym dostarczeniu (idempotencja po UUID, M-02; inna treść = kolizja, M-14). */
export async function trescZdarzenia(tx: PortBazy, id: string): Promise<{ licznikId: string; rodzaj: string; rodzice: string[] } | null> {
  const [w] = await wiersze(tx.all('SELECT licznik_id, rodzaj, rodzice FROM zdarzenie WHERE id = ?', [id]), 'trescZdarzenia');
  return w ? { licznikId: tekst(w, 'licznik_id'), rodzaj: tekst(w, 'rodzaj'), rodzice: listaTekstow(w, 'rodzice') } : null;
}
/** Poprzednie +1 przed chwilą `przedMs` (wejście `ostatniPlus` przy scaleniu zdarzeń z opóźnieniem, ADR-0008 (6)). */
export async function ostatniPlusPrzed(tx: PortBazy, odDnia: string, przedMs: number): Promise<number | null> {
  const [w] = await wiersze(tx.all("SELECT max(czas_ms) AS m FROM zdarzenie WHERE dzien >= ? AND rodzaj = 'plus' AND czas_ms < ?", [odDnia, przedMs]), 'ostatniPlusPrzed');
  return w ? liczbaLubNull(w, 'm') : null;
}
export async function poczekalnia(tx: PortBazy, r: { id: string; dane: string; powod: 'brak_rodzica' | 'brak_encji'; zrodlo: 'ekran_blokady' | 'zegarek' | 'synchronizacja' | 'import'; terazMs: number }): Promise<void> {
  await tx.run(
    `INSERT INTO poczekalnia (id, rodzaj_rekordu, dane, powod, zrodlo, przyszlo_ms) VALUES (?, 'zdarzenie', ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET proby = proby + 1`, [r.id, r.dane, r.powod, r.zrodlo, r.terazMs]);
}

/** Rzędy części: suma nieusuniętych liczników rzędów (jak r_i w RD-14/RD-15); cel drugiej części pary bez celu (BR-PRJ-014 S1, S3). */
export async function rzedyCzesci(baza: PortBazy, czescId: string): Promise<number> {
  const [r] = await wiersze(baza.all("SELECT coalesce(sum(wartosc), 0) AS n FROM licznik WHERE czesc_id = ? AND rodzaj = 'rzedy' AND usunieto_ms IS NULL", [czescId]), 'rzedyCzesci');
  return r ? liczba(r, 'n') : 0;
}
/** Cel części: własny albo — w części pary bez celu — rzędy pierwszej (`celZPary`, BR-PRJ-014 S1, S3; P-199 Q2a). */
export async function celCzesci(baza: PortBazy, w: { cel: number | null; paraZ: string | null }): Promise<number | null> {
  return celZPary({ ...w, rzedyPary: w.cel === null && w.paraZ !== null ? await rzedyCzesci(baza, w.paraZ) : 0 });
}
/** Licznik całości części na ekranie licznika (BR-LIC-018/S1): `licznikCalosci` z domeny na nieusuniętych licznikach części (P-199 Q1a). */
export async function caloscCzesci(baza: PortBazy, czescId: string): Promise<number | null> {
  const w = await wiersze(baza.all('SELECT id, rodzaj, wartosc FROM licznik WHERE czesc_id = ? AND usunieto_ms IS NULL', [czescId]), 'caloscCzesci');
  return licznikCalosci(w.map((r) => ({ id: tekst(r, 'id'), czescId, rodzaj: tekst(r, 'rodzaj') === 'oczka' ? 'oczka' : 'rzedy', wartosc: liczba(r, 'wartosc') })), czescId);
}
