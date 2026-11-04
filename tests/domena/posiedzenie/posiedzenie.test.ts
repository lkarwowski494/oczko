// Posiedzenie dla kresek i podpisu „Marks this session: {n} rows since {godzina}” (design-spec „Kreski sesji przez północ”, :242–:244;
// P-126 (6a), N2): zaczyna je pierwsze +1 po przerwie ≥ PRZERWA_NOWEGO_DNIA_MS albo start stopera (wtedy posiedzenie = sesja stopera);
// kończy je taka przerwa (kreski widać do następnego +1) albo zatrzymanie stopera. Północ go nie przerywa.
import { dodaniaPosiedzenia, posiedzenie } from '../../../src/domena/posiedzenie';
import { PRZERWA_NOWEGO_DNIA_MS as P } from '../../../src/konfiguracja';

const M = 60_000;
const T = 1_000_000_000_000;
const plusy = (...min: number[]) => min.map((m) => T + m * M).sort((a, b) => b - a); // od najnowszego

describe('posiedzenie', () => {
  test('bez +1 i bez stopera → null', () => {
    expect(posiedzenie({ dodaniaMs: [], stoper: null })).toBeNull();
  });
  test('trzy +1 co minutę → 3 od pierwszego', () => {
    expect(posiedzenie({ dodaniaMs: plusy(0, 1, 2), stoper: null })).toEqual({ rzedy: 3, odMs: T });
  });
  test('N2: przerwa ≥ 60 min po ostatnim +1 — kreski zostają do następnego +1', () => {
    expect(posiedzenie({ dodaniaMs: plusy(0, 1, 2), stoper: null })).toEqual({ rzedy: 3, odMs: T });
  });
  test('następne +1 po przerwie ≥ 60 min zaczyna nowe posiedzenie od jednej kreski', () => {
    expect(posiedzenie({ dodaniaMs: plusy(0, 1, 2 + P / M), stoper: null })).toEqual({ rzedy: 1, odMs: T + 2 * M + P });
  });
  test('stoper trwa: posiedzenie = sesja stopera — od startu, także bez +1 (0 rzędów) i mimo przerwy ≥ 60 min w środku', () => {
    expect(posiedzenie({ dodaniaMs: plusy(-5), stoper: { startMs: T, koniecMs: null } })).toEqual({ rzedy: 0, odMs: T });
    expect(posiedzenie({ dodaniaMs: plusy(-5, 1, 2 + P / M), stoper: { startMs: T, koniecMs: null } })).toEqual({ rzedy: 2, odMs: T });
  });
  test('stoper zatrzymany: +1 do zatrzymania nie należą do następnego posiedzenia; bez +1 po zatrzymaniu → null', () => {
    expect(posiedzenie({ dodaniaMs: plusy(1, 2), stoper: { startMs: T, koniecMs: T + 3 * M } })).toBeNull();
    expect(posiedzenie({ dodaniaMs: plusy(1, 2, 4, 5), stoper: { startMs: T, koniecMs: T + 3 * M } })).toEqual({ rzedy: 2, odMs: T + 4 * M });
  });
});

// [04-studio-projektowe-571] design-spec:250–256: „−1 zdejmuje ostatnią kreskę”; rzędy posiedzenia = zdarzenia +1/−1 projektu.
describe('dodaniaPosiedzenia: −1 zdejmuje ostatnią kreskę', () => {
  const z = (...r: Array<[number, 'plus' | 'minus']>) => r.map(([m, rodzaj]) => ({ rodzaj, czasMs: T + m * M })).sort((a, b) => b.czasMs - a.czasMs); // od najnowszego
  const ms = (...min: number[]) => min.map((m) => T + m * M).sort((a, b) => b - a);
  test('+1, −1, +1, +1 → dwie kreski (najnowsze) i posiedzenie z 2 rzędami', () => {
    const d = dodaniaPosiedzenia(z([1, 'plus'], [2, 'minus'], [3, 'plus'], [4, 'plus']));
    expect(d).toEqual(ms(3, 4));
    expect(posiedzenie({ dodaniaMs: d, stoper: null })).toEqual({ rzedy: 2, odMs: T + 3 * M });
  });
  test('−1 przy 0 kresek nie daje wartości ujemnej i nie zdejmuje kolejnego +1', () => {
    expect(dodaniaPosiedzenia(z([1, 'minus'], [2, 'minus']))).toEqual([]);
    expect(dodaniaPosiedzenia(z([1, 'minus'], [2, 'plus']))).toEqual(ms(2));
  });
  test('+1, +1, −1 → jedna kreska (ostatnia zdjęta); same +1 bez zmian', () => {
    expect(dodaniaPosiedzenia(z([1, 'plus'], [2, 'plus'], [3, 'minus']))).toEqual(ms(1));
    expect(dodaniaPosiedzenia(z([1, 'plus'], [2, 'plus']))).toEqual(ms(1, 2));
  });
  test('posiedzenie zaczęte przed −1: granica 60 min bez zmian, −1 po przerwie zdejmuje kreskę poprzedniego posiedzenia', () => {
    const d = dodaniaPosiedzenia(z([0, 'plus'], [1, 'plus'], [2 + P / M, 'plus'], [3 + P / M, 'plus'], [4 + P / M, 'minus']));
    expect(posiedzenie({ dodaniaMs: d, stoper: null })).toEqual({ rzedy: 1, odMs: T + (2 + P / M) * M });
    const e = dodaniaPosiedzenia(z([0, 'plus'], [1, 'plus'], [2 + P / M, 'minus']));
    expect(posiedzenie({ dodaniaMs: e, stoper: null })).toEqual({ rzedy: 1, odMs: T });
  });
});
