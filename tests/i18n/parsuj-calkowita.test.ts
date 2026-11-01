// 07-jakosc-024 / BR-LIC-017 „Wpisanie w zapisie regionu” i „Zapis niezgodny z regionem” (ER-43, S-40): liczba całkowita ≥ 0 z separatorem tysięcy i cyframi regionu.
import { parsujCalkowita } from '../../src/i18n/format';

describe('parsujCalkowita (BR-LIC-017, ER-43)', () => {
  test.each([
    ['pl-PL', '1 000', 1000], ['pl-PL', '1\u00a0000', 1000], ['pl-PL', '1\u202f000', 1000], ['de-DE', '1.000', 1000], ['en-US', '1,000', 1000],
    ['ar-EG', '٥٧', 57], ['ar-EG', '57', 57], ['en', '42', 42], ['en', ' 0 ', 0], ['pl', '1\u00a0234\u00a0567', 1234567],
  ] as const)('%s „%s” → %p', (j, t, w) => {
    expect(parsujCalkowita(t, j)).toBe(w);
  });
  test.each([
    ['pl-PL', '1,000'], ['pl-PL', '1.000'], ['de-DE', '1,000'], ['en-US', '1.5'], ['en', '1,5'], ['en', '-3'], ['en', 'abc'], ['en', ''], ['en', '1,,000'], ['en', ',000'],
  ] as const)('%s „%s” → null (bez zgadywania)', (j, t) => {
    expect(parsujCalkowita(t, j)).toBeNull();
  });
});
