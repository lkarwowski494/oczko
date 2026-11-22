// Test roli 08 (partia 1, mutant przeżywający w scal.ts): `id` w wyniku `blad` = najmniejsze winne zdarzenie, niezależnie od kolejności
// wejścia (wyrocznia: docs/architektura/moduly.md „Scalanie”: „zawsze ten sam wynik dla każdej kolejności wejścia, `id` = najmniejsze winne”).
import { scal } from '../../../src/domena/scal';
import type { ZdarzenieLicznika } from '../../../src/domena/scal';

const L = 'licznik-1';
const permutacje = <T>(x: T[]): T[][] => (x.length <= 1 ? [x] : x.flatMap((e, i) => permutacje([...x.slice(0, i), ...x.slice(i + 1)]).map((r) => [e, ...r])));

describe('Z07-13 moduly.md „Scalanie”: id błędu = najmniejsze winne, w każdej kolejności', () => {
  test.each([
    ['kolizja_id: „c” i „b” z inną treścią', 'kolizja_id', 'b', [
      { id: 'a', licznik: L, rodzaj: 'plus', rodzice: [] },
      { id: 'c', licznik: L, rodzaj: 'plus', rodzice: ['a'] }, { id: 'c', licznik: L, rodzaj: 'minus', rodzice: ['a'] },
      { id: 'b', licznik: L, rodzaj: 'plus', rodzice: ['a'] }, { id: 'b', licznik: L, rodzaj: 'minus', rodzice: ['a'] },
    ]],
    ['wiele_rodzicow: „z” i „y”', 'wiele_rodzicow', 'y', [
      { id: 'a', licznik: L, rodzaj: 'plus', rodzice: [] }, { id: 'b', licznik: L, rodzaj: 'plus', rodzice: ['a'] },
      { id: 'z', licznik: L, rodzaj: 'plus', rodzice: ['a', 'b'] }, { id: 'y', licznik: L, rodzaj: 'minus', rodzice: ['a', 'b'] },
    ]],
    ['cykl c → b → c przy korzeniu a', 'cykl', 'b', [
      { id: 'a', licznik: L, rodzaj: 'plus', rodzice: [] },
      { id: 'c', licznik: L, rodzaj: 'plus', rodzice: ['b'] }, { id: 'b', licznik: L, rodzaj: 'plus', rodzice: ['c'] },
    ]],
  ] as [string, string, string, ZdarzenieLicznika[]][])('NFR-DAN-003 R-038 %s → %s z id %s', (_n, powod, id, z) => {
    for (const wejscie of permutacje(z)) expect(scal(wejscie)).toEqual({ stan: 'blad', powod, id });
  });
});
