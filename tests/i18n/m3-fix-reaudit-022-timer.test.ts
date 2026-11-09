// 04-studio-projektowe-022 (P-627 decyzja 3 A, P-621 A „Timer”): en Historii i projektu mówi „timer”, nie „stopwatch” — jedno pojęcie z przyciskiem stopera.
// Tylko en (krótka fala 09); pozostałe języki bez zmian, jeśli znaczenie się nie zmienia (pojęcie `stoper` w glosariuszu, P-621).
import en from '../../src/i18n/slowniki/en.json';

test('022: dni.czas, dni.bez_stopera, projekt.czas_brak mówią „timer”', () => {
  expect(en.dni.czas).toBe('{{czas}} with the timer');
  expect(en.dni.bez_stopera).toBe('Time shows here when you use the timer.');
  expect(en.projekt.czas_brak).toBe('Time shows here when you use the timer.');
});
