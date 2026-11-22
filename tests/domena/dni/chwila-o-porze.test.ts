// Test 08 (partia 4, P-137, aneks 05 fix-4): chwilaOPorze — pora podwójna (zmiana czasu jesienią) → wcześniejsza chwila; złe dane → bledne_dane.
// Wyrocznia: rachunek dat Europe/Warsaw (2026-10-25 03:00 CEST → 02:00 CET, więc 02:00–02:59 występuje dwa razy) i America/New_York.
import { chwilaOPorze } from '../../../src/domena/postep';

describe('P-137 chwilaOPorze', () => {
  test('pora podwójna: 02:30 → 2026-10-25 = 02:30 CEST (00:30 UTC), nie 02:30 CET (01:30 UTC)', () => {
    expect(chwilaOPorze({ dzien: '2026-10-25', wzorMs: Date.UTC(2026, 9, 20, 0, 30), strefa: 'Europe/Warsaw' })).toEqual({ ok: true, wartosc: Date.UTC(2026, 9, 25, 0, 30) });
  });
  test('pora z sekundami i ms zostaje; inna strefa (New York, EDT −4)', () => {
    expect(chwilaOPorze({ dzien: '2026-07-04', wzorMs: Date.UTC(2026, 6, 1, 23, 59, 58, 123), strefa: 'America/New_York' })).toEqual({ ok: true, wartosc: Date.UTC(2026, 6, 4, 23, 59, 58, 123) });
  });
  test('zły dzień, zła strefa, brak chwili → bledne_dane', () => {
    const w = { dzien: '2026-10-25', wzorMs: Date.UTC(2026, 9, 20), strefa: 'Europe/Warsaw' };
    for (const zle of [{ ...w, dzien: '2026-02-30' }, { ...w, strefa: 'Nie/Istnieje' }, { ...w, wzorMs: Number.NaN }]) expect(chwilaOPorze(zle)).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});
