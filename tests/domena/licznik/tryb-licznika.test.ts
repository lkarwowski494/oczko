// Test roli 08 (P-114 Q2a): RD-12-W7–W9 (tryb licznika, BR-LIC-012, ER-40) — wektory bez testu 07 po fixie 01 (P-097 (3.1a)).
// Wyrocznia: tests/wektory/brd.json; r = liczba pokazana na liczniku (docs/brd/reguly.md RD-12): w trybie „skończone rzędy” r = skończone,
// w trybie „rząd w trakcie” r = skończone + 1 — wybór r w domenie: powtorzenieLicznika (P-121 (1), fix-3 05; do partii 3 wybierał go test).
import { powtorzenieLicznika, wartoscWyswietlana } from '../../../src/domena/licznik';
import { wektoryReguly, liczba, licznikWektorow } from '../../narzedzia/akceptacja';

describe('RD-12 BR-LIC-012 tryb licznika: wektory BRD W7–W9', () => {
  const wektory = wektoryReguly('RD-12').filter((w) => 'tryb [-]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-LIC-012 ${w.id} (${w.rodzaj}) skończone=${w.wejscie['skończone [rz.]']} tryb=${w.wejscie['tryb [-]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const skonczone = liczba(w.wejscie['skończone [rz.]']);
      const tryb = w.wejscie['tryb [-]'];
      if (tryb !== 'rząd w trakcie' && tryb !== 'skończone rzędy') throw new Error(`Wektor ${w.id}: nieznany tryb ${String(tryb)}`);
      expect(powtorzenieLicznika(skonczone, tryb === 'rząd w trakcie' ? 'w_trakcie' : 'skonczone', liczba(w.wejscie['n [rz.]']))).toEqual({ ok: true, wartosc: { powtorzenie: w.oczekiwane['powtórzenie [-]'], rzadW: w.oczekiwane['rząd_w [rz.]'] } });
    });
  });
  test(`RD-12 liczność: wykonano ${wektory.length} z 3 wektorów trybu (pusty zbiór = porażka)`, () => {
    expect(wektory.map((w) => w.id)).toEqual(['RD-12-W7', 'RD-12-W8', 'RD-12-W9']);
    licznik.wynik(wektory.length);
  });
});

describe('BR-LIC-012 wartoscWyswietlana w trybie „skończone rzędy”', () => {
  test('BR-LIC-012 tryb „skończone”: licznik 12 → skończone 12, dziergany 13 (duża liczba = skończone, design-spec „Now working row N”)', () => {
    expect(wartoscWyswietlana(12, 'skonczone')).toEqual({ skonczone: 12, dziergany: 13 });
  });
});
