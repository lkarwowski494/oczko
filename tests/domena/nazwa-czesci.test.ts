// BY-002 (04-studio-projektowe-002, P2): nazwa zapasowa części roboczej = dzień utworzenia RRRR-MM-DD (src/przypadki-uzycia/licznik.ts `utworzSzybkiLicznik`, RD-16).
// Ekran nie pokazuje jej jako nazwy części (design-spec „Projekt roboczy”) — także po nazwaniu projektu; nazwa wpisana przez użytkowniczkę zawsze jest widoczna.
import { czescNaLiczniku, jestNazwaZapasowaCzesci } from '../../src/domena/nazwa-czesci';

test('nazwa zapasowa to poprawny dzień RRRR-MM-DD, nic więcej', () => {
  expect(['2026-11-10', '2026-02-28', '1999-12-31'].map(jestNazwaZapasowaCzesci)).toEqual([true, true, true]);
  expect(['', 'Sleeve', '2026-13-10', '2026-11-32', '2026-00-10', '2026-11-10 sleeve', ' 2026-11-10', '26-11-10', '2026-1-1'].map(jestNazwaZapasowaCzesci)).toEqual(Array(9).fill(false));
});
test('czescNaLiczniku: nazwa zapasowa → null (nie pokazujemy), nazwa użytkowniczki bez zmian', () => {
  expect(czescNaLiczniku('2026-11-10')).toBeNull();
  expect(czescNaLiczniku('Sleeve')).toBe('Sleeve');
});
