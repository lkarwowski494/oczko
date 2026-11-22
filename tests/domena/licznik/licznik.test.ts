// RD-12 (powtórzenie i rząd w powtórzeniu), BR-LIC-007, BR-LIC-008, BR-LIC-012 — poziom domena-Node.
// Wyrocznia: tests/wektory/brd.json (RD-12-W1…W5), scenariusze BRD (docs/brd/wymagania-licznik.md) policzone wzorem RD-12.
// RD-12-W4 (r = 0 → błąd danych) zgodnie z BRD; ER-40 proponuje „powtórzenie 1, rząd 0” — otwarte, wektor zmieni rola 01.
import { powtorzenie, wartoscWyswietlana } from '../../../src/domena/licznik';
import { wektoryReguly, liczba, licznikWektorow, BLAD_DANYCH } from '../../narzedzia/akceptacja';

const KRYTERIA_RD12: Record<string, string> = {
  'RD-12-W1': 'BR-LIC-007/S1',
  'RD-12-W2': 'BR-LIC-007/S2',
  'RD-12-W3': 'BR-LIC-007',
  'RD-12-W4': 'BR-LIC-007',
  'RD-12-W5': 'BR-LIC-007/S3',
  'RD-12-W6': 'BR-LIC-007',
};

describe('RD-12 powtorzenie: wektory BRD', () => {
  // 08 (partia 1, NZ-05-01, P-097 1a, P-114 Q2a): pętla obejmuje wektory tego kształtu; wektory nowego kształtu sprawdza test 08 w tests/domena/.
  const wektory = wektoryReguly('RD-12').filter((w) => 'r [rz.]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA_RD12[w.id] ?? 'RD-12'} ${w.id} (${w.rodzaj}) r=${w.wejscie['r [rz.]']} n=${w.wejscie['n [rz.]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const r = liczba(w.wejscie['r [rz.]']);
      const n = liczba(w.wejscie['n [rz.]']);
      const wynik = powtorzenie(r, n);
      if (w.oczekiwane['powtórzenie [-]'] === BLAD_DANYCH) {
        expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      } else {
        expect(wynik).toEqual({ ok: true, wartosc: { powtorzenie: w.oczekiwane['powtórzenie [-]'], rzadW: w.oczekiwane['rząd_w [rz.]'] } });
      }
    });
  });
  test(`RD-12 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(6); // W1–W6 (W6: r < 0, P-097 3.1a); W7–W9 (tryb licznika): tests/domena/licznik/tryb-licznika.test.ts
    // F07-03: oba kształty razem = cała reguła; nowy wektor innego kształtu nie może zostać pominięty po cichu.
    expect(wektoryReguly('RD-12').map((x) => x.id).sort()).toEqual([...wektory.map((x) => x.id), 'RD-12-W7', 'RD-12-W8', 'RD-12-W9'].sort());
    licznik.wynik(wektory.length);
  });
});

describe('BR-LIC-008 zmiana długości powtórzenia w trakcie', () => {
  test('BR-LIC-008/S1 licznik 17, powtórzenie zmienione z 8 na 10 → powtórzenie 2, rząd 7 (rachunek RD-12)', () => {
    // ⌊(17 − 1) / 10⌋ + 1 = 2; ((17 − 1) mod 10) + 1 = 7 (kryteria.json: wektora w brd.json brak, wynik ze wzoru RD-12).
    expect(powtorzenie(17, 8)).toEqual({ ok: true, wartosc: { powtorzenie: 3, rzadW: 1 } });
    expect(powtorzenie(17, 10)).toEqual({ ok: true, wartosc: { powtorzenie: 2, rzadW: 7 } });
  });
});

describe('BR-LIC-012 znaczenie liczby na liczniku (F-09)', () => {
  test('BR-LIC-012/S1 tryb „rząd w trakcie”: 12 skończonych rzędów → licznik pokazuje „rząd 13”', () => {
    expect(wartoscWyswietlana(12, 'w_trakcie')).toEqual({ skonczone: 12, dziergany: 13 });
  });
  test('BR-LIC-012 design-spec:30 „Now working row N”: duża liczba to rzędy skończone, dziergany = skończone + 1 (granica 0)', () => {
    // Z07-04 (czy ustawienie F-09 zostaje) otwarte; tu tylko wspólna część obu odczytów: wartość 0 → „Now working row 1”.
    expect(wartoscWyswietlana(0, 'w_trakcie')).toEqual({ skonczone: 0, dziergany: 1 });
  });
});
