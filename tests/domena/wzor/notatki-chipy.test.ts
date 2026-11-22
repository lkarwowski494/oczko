// Miejsce notatki na stronie wzoru (07-jakosc-007, F-56; BR-WZR-008 S2): notatka należy do rzędu licznika, a chip stoi na wysokości tego rzędu
// w układzie znacznika (RD-21: rząd schematu = rzadBazowy + (s − wartoscPrzyUstawieniu), notatka z licznika w robocie s+1).
import { chipyNotatek, type NotatkaWzoru, type ZnacznikWzoru } from '../../../src/domena/znacznik-wzoru';

// BR-WZR-003 S5: schemat od rzędu 1 po 45 skończonych; znacznik na rzędzie 6 schematu przy 45 → rząd licznika 46 = rząd 6 schematu.
const z = (o: Partial<ZnacznikWzoru> = {}): ZnacznikWzoru => ({ strona: 1, y: 0.4, wysokoscRzedu: 0.02, rzadBazowy: 6, wartoscPrzyUstawieniu: 45, kierunek: -1, ...o });
const n = (id: string, rzad: number, tekst = 'ujmowanie co 4 rzędy'): NotatkaWzoru => ({ id, rzad, tekst });

test('notatka na rzędzie znacznika: chip na wysokości znacznika, numer rzędu schematu', () => {
  expect(chipyNotatek(z(), [n('a', 46)])).toEqual([{ rzad: 46, rzadWzoru: 6, strona: 1, y: 0.4, wysokosc: 0.02, notatki: [n('a', 46)] }]);
});
test('notatka rzędy dalej: przesunięcie o rząd w kierunku znacznika (−1 = w górę, +1 = w dół)', () => {
  const w = chipyNotatek(z({ kierunek: -1 }), [n('a', 49)]);
  expect(w[0]?.rzadWzoru).toBe(9);
  expect(w[0]?.y).toBeCloseTo(0.4 - 3 * 0.02, 9);
  const d = chipyNotatek(z({ kierunek: 1 }), [n('a', 44)]);
  expect(d[0]?.rzadWzoru).toBe(4);
  expect(d[0]?.y).toBeCloseTo(0.4 - 2 * 0.02, 9);
});
test('dwie notatki jednego rzędu to jeden chip zbiorczy, kolejność z wejścia', () => {
  const w = chipyNotatek(z(), [n('a', 46, 'pierwsza'), n('b', 46, 'druga'), n('c', 50)]);
  expect(w.map((c) => [c.rzad, c.notatki.map((x) => x.id)])).toEqual([[46, ['a', 'b']], [50, ['c']]]);
});
test('notatka poza stroną znacznika (powyżej góry albo poniżej dołu strony) i przed schematem nie dostaje chipu', () => {
  expect(chipyNotatek(z({ y: 0.05, kierunek: -1 }), [n('gora', 46 + 5)])).toEqual([]); // 5 rzędów w górę od 0.05 → y < 0
  expect(chipyNotatek(z({ y: 0.95, kierunek: 1 }), [n('dol', 46 + 4)])).toEqual([]);  // y + wysokość > 1
  expect(chipyNotatek(z({ rzadBazowy: 2 }), [n('przed', 46 - 2)])).toEqual([]);          // rząd schematu 0 < 1
});
test('brak notatek → brak chipów', () => { expect(chipyNotatek(z(), [])).toEqual([]); });
