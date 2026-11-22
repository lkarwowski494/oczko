// chwilaLokalna: argument startu oczkoE2eTeraz (czas lokalny bez strefy, e2e/README.md) → chwila w strefie symulatora; luka i pora podwójna jak chwilaOPorze (P-137).
import { chwilaLokalna } from '../../../src/domena/postep';

const ok = (lokalnie: string, strefa: string) => {
  const w = chwilaLokalna({ lokalnie, strefa });
  return w.ok ? new Date(w.wartosc).toISOString() : w.powod;
};

describe('chwilaLokalna', () => {
  test('zwykła pora: 2026-11-01T00:05:00 w Warszawie (CET, UTC+1) → 2026-10-31T23:05Z; bez sekund też', () => {
    expect(ok('2026-11-01T00:05:00', 'Europe/Warsaw')).toBe('2026-10-31T23:05:00.000Z');
    expect(ok('2026-11-30T23:55', 'America/New_York')).toBe('2026-12-01T04:55:00.000Z');
    expect(ok('2028-02-29T21:00:00', 'UTC')).toBe('2028-02-29T21:00:00.000Z');
  });
  test('luka zmiany czasu (2026-03-29 02:30 Warszawa) → 03:30 CEST; pora podwójna (2026-10-25 02:30) → wcześniejsza (CEST)', () => {
    expect(ok('2026-03-29T02:30:00', 'Europe/Warsaw')).toBe('2026-03-29T01:30:00.000Z');
    expect(ok('2026-10-25T02:30:00', 'Europe/Warsaw')).toBe('2026-10-25T00:30:00.000Z');
  });
  test('zły zapis albo nieznana strefa → bledne_dane', () => {
    for (const z of ['2026-11-01', '2026-13-01T00:00', '2026-11-01T24:00', '2026-11-01 00:05', '']) expect(ok(z, 'Europe/Warsaw')).toBe('bledne_dane');
    expect(ok('2026-11-01T00:05', 'Mars/Olympus')).toBe('bledne_dane');
  });
});
