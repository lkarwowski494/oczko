// PU-360 (R4, TQ1): odliczanie podpowiedzi formy A bez zegara systemowego — `terminPodpowiedzi` to czysta funkcja czasu z argumentów.
import { terminPodpowiedzi } from '../../src/domena/podpowiedz';

const MIN = 60_000, T = 1_800_000_000_000;
describe('ZM-25 terminPodpowiedzi (forma A, P-1103)', () => {
  test('ZM-25 PU-360: po N min od ostatniej zmiany (zmiana późniejsza niż otwarcie)', () => {
    expect(terminPodpowiedzi({ progMin: 10, ostatniaZmianaMs: T, otwartoMs: T - 30 * MIN, blokada: false })).toBe(T + 10 * MIN);
  });
  test('ZM-25 PU-360: po N min od otwarcia licznika, gdy otwarcie jest późniejsze niż ostatnia zmiana; bez zdarzeń — od otwarcia', () => {
    expect(terminPodpowiedzi({ progMin: 5, ostatniaZmianaMs: T - 60 * MIN, otwartoMs: T, blokada: false })).toBe(T + 5 * MIN);
    expect(terminPodpowiedzi({ progMin: 15, ostatniaZmianaMs: null, otwartoMs: T, blokada: false })).toBe(T + 15 * MIN);
  });
  test('ZM-25 PU-360: wyłączona (null) albo blokada (licznik zablokowany, limit, pauza stopera) → brak terminu', () => {
    expect(terminPodpowiedzi({ progMin: null, ostatniaZmianaMs: T, otwartoMs: T, blokada: false })).toBeNull();
    expect(terminPodpowiedzi({ progMin: 10, ostatniaZmianaMs: T, otwartoMs: T, blokada: true })).toBeNull();
  });
  test('ZM-25 PU-360: próg 30 min — równo na granicy: termin = zmiana + 30 min, bez zaokrągleń', () => {
    expect(terminPodpowiedzi({ progMin: 30, ostatniaZmianaMs: T + 1, otwartoMs: T, blokada: false })).toBe(T + 1 + 30 * MIN);
  });
});
