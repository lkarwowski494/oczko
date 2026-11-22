// BR-ZAK-001, BR-ZAK-003, BR-ZAK-007, KP-02, KP-05, KP-06, KP-08 (poziom domena-Node): wszystkie wektory W i P roli 02
// (docs/monetyzacja/wektory-dostepu.json; model V4, P-057, P-038, P-089 (2)). Ryzyko R-109.
// Lista produktów odblokowujących: src/konfiguracja.ts PRODUKTY_PRO, ta sama co `odblokowuja` w pliku wektorów.
import { decyzja, odczytajPamiec } from '../../../src/domena/dostep';
import { PRODUKTY_PRO } from '../../../src/konfiguracja';
import { WEKTORY_DOSTEPU, kryteria, licznikWektorow } from './pomocnicze';

const { teraz, odblokowuja } = WEKTORY_DOSTEPU;

describe('KP-06 decyzja: wektory W (BR-ZAK-001)', () => {
  const wektory = WEKTORY_DOSTEPU.decyzja;
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${kryteria(w.id)} ${w.id} ${w.scenariusz}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => expect(decyzja(w.odczyt, w.pamiec, teraz, odblokowuja)).toEqual(w.oczekiwane));
  });
  test(`KP-06 R-109 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów decyzja (pusty plik = porażka)`, () => {
    licznik.wynik(wektory.length);
  });
  test('KP-06 W-01 z listą produktów z konfiguracji (PRODUKTY_PRO = odblokowuja z wektorów, P-038)', () => {
    // Zbiory porównane jako zbiory (§3.3), potem decyzja z listą aplikacji, nie z listy pliku wektorów.
    expect([...PRODUKTY_PRO].sort()).toEqual([...odblokowuja].sort());
    const w = wektory.find((x) => x.id === 'W-01');
    expect(w).toBeDefined();
    expect(decyzja(w!.odczyt, w!.pamiec, teraz, PRODUKTY_PRO)).toEqual(w!.oczekiwane);
  });
});

describe('KP-06 odczytajPamiec: wektory P (pamięć podręczna uprawnień)', () => {
  const wektory = WEKTORY_DOSTEPU.odczytajPamiec;
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${kryteria(w.id)} ${w.id} ${w.scenariusz}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => expect(odczytajPamiec(w.wejscie)).toEqual(w.oczekiwane));
  });
  test(`KP-06 BR-ZAK-001 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów odczytajPamiec (pusty plik = porażka)`, () => {
    licznik.wynik(wektory.length);
  });
});
