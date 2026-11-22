// R-092 (rejestr e1-ryzyka.md, „Limit dni”), P-067, KP-12: każdy rodzaj zdarzenia z bazy ma rodzaj strażnika.
// Wyrocznia: docs/architektura/moduly.md:77 „Mapowanie rodzaju zdarzenia na wolaStraznika (P-067): plus → plus;
// wpisanie → wpisanie; minus → minus; zerowanie → zerowanie; cofniecie, rozstrzygniecie → edycja-historii (nie zaczynają dnia)”.
// Czy zaczyna dzień: wektory S-01 (plus), S-06 (wpisanie), S-07 (zerowanie), S-08 (minus), S-09 (edycja-historii).
import { rodzajStraznika, wolaStraznika } from '../../../src/domena/limit';
import type { RodzajStraznika } from '../../../src/domena/limit';
import { STANY } from '../../../src/domena/stany';
import type { RodzajZdarzenia } from '../../../src/domena/stany';

// `satisfies Record<RodzajZdarzenia, …>`: nowy rodzaj w stany.ts bez wiersza tu = błąd `tsc` (kontrola z R-092).
const MAPOWANIE = {
  plus: 'plus',
  wpisanie: 'wpisanie',
  minus: 'minus',
  zerowanie: 'zerowanie',
  cofniecie: 'edycja-historii',
  rozstrzygniecie: 'edycja-historii',
} as const satisfies Record<RodzajZdarzenia, RodzajStraznika>;

const ZACZYNA_DZIEN = {
  plus: true, // S-01
  wpisanie: true, // S-06, P-057 D4
  minus: false, // S-08, P-067 (2a)
  zerowanie: false, // S-07, P-067 (1a)
  cofniecie: false, // S-09, moduly.md:77
  rozstrzygniecie: false, // S-09, moduly.md:77
} as const satisfies Record<RodzajZdarzenia, boolean>;

const RODZAJE = STANY['zdarzenie.rodzaj'];

describe('R-092 / moduly.md:77 rodzajStraznika (P-067)', () => {
  test.each(RODZAJE.map((r) => [r] as const))('R-092 KP-12 rodzajStraznika(%s) według moduly.md:77', (r) => {
    expect(rodzajStraznika(r)).toBe(MAPOWANIE[r]);
  });

  test.each(RODZAJE.map((r) => [r] as const))('R-092 KP-12 wolaStraznika(rodzajStraznika(%s)) daje wartość logiczną bez błędu „nieznany rodzaj”', (r) => {
    expect(wolaStraznika({ rodzaj: rodzajStraznika(r) })).toBe(ZACZYNA_DZIEN[r]);
  });

  test(`R-092 KP-12 pokrycie: wszystkie ${RODZAJE.length} rodzaje ze STANY['zdarzenie.rodzaj'] zmapowane (zbiór, pusty = porażka)`, () => {
    expect(RODZAJE.length).toBeGreaterThan(0);
    expect([...RODZAJE].sort()).toEqual(Object.keys(MAPOWANIE).sort());
    const wynik = Object.fromEntries(RODZAJE.map((r) => [r, wolaStraznika({ rodzaj: rodzajStraznika(r) })]));
    expect(wynik).toEqual(ZACZYNA_DZIEN);
  });
});
