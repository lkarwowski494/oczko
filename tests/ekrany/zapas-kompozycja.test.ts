// Kompozycja zapasu i drutów (BR-ZAP-001 S1 / RD-03-W1, BR-ZAP-003, BR-ZAP-004; P-191 P8a; makiety fix6 `zapas`, `wloczka`, `druty-lista`, `drut`).
import { bazowa, podgladRozmiaru, przeliczenie, stanDrutow, stanZapasu } from '../../src/kompozycja/zapas';
import type { WierszZapasu } from '../../src/przypadki-uzycia/zapas';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const j = (jezyk = 'en-US') => ({ t, jezyk: () => jezyk });
const w = (id: string, nazwa: string, x: Partial<WierszZapasu> = {}): WierszZapasu =>
  ({ id, nazwa, kategoria: null, motki: 0, dlugoscMotkaM: null, wagaMotkaG: null, zdjecieSha: null, ...x });
const LISTA = [
  w('a', 'Harbor merino, navy', { kategoria: 4, motki: 5, dlugoscMotkaM: 399.5928, wagaMotkaG: 100 }),
  w('b', 'Sock yarn, rust', { kategoria: 1, motki: 2, dlugoscMotkaM: 400, wagaMotkaG: 100 }),
  w('c', 'Cotton DK, cream', { kategoria: 3, motki: 0 }),
  w('d', 'Mystery', { motki: 1.5 }),
];

describe('lista zapasu', () => {
  test('BR-ZAP-001/S1 (RD-03-W1): układ imperialny — 437 yd (399.59 m); waga 3.53 oz (100 g); kategoria i motki', () => {
    const s = stanZapasu(LISTA, { zapytanie: '', filtr: 'wszystkie', imperialny: true, j: j() });
    expect(s.wiersze[0]).toEqual({ id: 'a', nazwa: 'Harbor merino, navy', linia: 'Weight 4 · 5 skeins', motek: '437 yd (399.59 m) · 3.53 oz (100 g) per skein', zdjecieSha: null });
    expect(s.wiersze[2]).toMatchObject({ linia: 'Weight 3 · 0 skeins', motek: null });
    expect(s.wiersze[3]).toMatchObject({ linia: 'Not set · 1.5 skeins' });
  });
  test('BR-ZAP-001/S1, scen. 40 (P-277 A): sama długość albo sama waga motka też w wierszu (teksty robocze zapas.motek_dlugosc / motek_waga)', () => {
    const l = [w('e', 'Fjord', { dlugoscMotkaM: 399.5928 }), w('f', 'Tweed', { wagaMotkaG: 50 })];
    const imp = stanZapasu(l, { zapytanie: '', filtr: 'wszystkie', imperialny: true, j: j() }).wiersze;
    expect(imp.map((x) => x.motek)).toEqual(['437 yd (399.59 m) per skein', '1.76 oz (50 g) per skein']);
    const met = stanZapasu(l, { zapytanie: '', filtr: 'wszystkie', imperialny: false, j: j() }).wiersze;
    expect(met.map((x) => x.motek)).toEqual(['399.59 m per skein', '50 g per skein']);
  });
  test('układ metryczny: sama jednostka metryczna („400 m · 100 g per skein”)', () => {
    expect(stanZapasu(LISTA, { zapytanie: '', filtr: 'wszystkie', imperialny: false, j: j() }).wiersze[1]?.motek).toBe('400 m · 100 g per skein');
  });
  test('chipy: All + kategorie obecne rosnąco + Not set, gdy jest włóczka bez kategorii', () => {
    const s = stanZapasu(LISTA, { zapytanie: '', filtr: 'wszystkie', imperialny: false, j: j() });
    expect(s.chipy.map((c) => c.tekst)).toEqual(['All', 'Weight 1', 'Weight 3', 'Weight 4', 'Not set']);
    expect(s.chipy.map((c) => c.wartosc)).toEqual(['wszystkie', 1, 3, 4, 'brak']);
  });
  test('BR-ZAP-004/S1: filtr kategorii 4 → tylko kategoria 4; filtr bez wyników → „No yarn in weight 2.”', () => {
    expect(stanZapasu(LISTA, { zapytanie: '', filtr: 4, imperialny: false, j: j() }).wiersze.map((x) => x.id)).toEqual(['a']);
    expect(stanZapasu(LISTA, { zapytanie: '', filtr: 'brak', imperialny: false, j: j() }).wiersze.map((x) => x.id)).toEqual(['d']);
    expect(stanZapasu(LISTA, { zapytanie: '', filtr: 2, imperialny: false, j: j() }).pusto).toEqual({ rodzaj: 'filtr', tekst: 'No yarn in weight 2.' });
  });
  test('BR-ZAP-004/S2: szukanie po nazwie bez wielkości liter; brak wyników → komunikat z zapytaniem', () => {
    expect(stanZapasu(LISTA, { zapytanie: 'SOCK', filtr: 'wszystkie', imperialny: false, j: j() }).wiersze.map((x) => x.id)).toEqual(['b']);
    expect(stanZapasu(LISTA, { zapytanie: 'xyz', filtr: 'wszystkie', imperialny: false, j: j() }).pusto).toEqual({ rodzaj: 'szukaj', tekst: 'No yarn called “xyz”.' });
  });
  test('pusty zapas → zapas.pusto, bez chipów', () => {
    expect(stanZapasu([], { zapytanie: '', filtr: 'wszystkie', imperialny: false, j: j() })).toEqual({ chipy: [], wiersze: [], pusto: { rodzaj: 'zapas', tekst: t('zapas.pusto') } });
  });
});

describe('pola arkusza włóczki (RD-03)', () => {
  test('437 yd → „= 399.59 m” i 399.5928 m w bazie; 3.5 oz → „= 99.22 g”; 400 m → „= 437.45 yd”', () => {
    expect(przeliczenie('437', 'yd', j())).toBe('= 399.59 m');
    expect(bazowa('437', 'yd', 'en-US')).toBeCloseTo(399.5928, 9);
    expect(przeliczenie('3.5', 'oz', j())).toBe('= 99.22 g');
    expect(przeliczenie('400', 'm', j())).toBe('= 437.45 yd');
  });
  test('zapis regionu: 3,5 w pl-PL; pusty → brak; zły → bez przeliczenia', () => {
    expect(przeliczenie('3,5', 'oz', j('pl-PL'))).toBe('= 99,22 g');
    expect([bazowa('', 'm', 'en-US'), przeliczenie('', 'm', j())]).toEqual([null, null]);
    expect([bazowa('4x', 'm', 'en-US'), przeliczenie('4x', 'm', j())]).toEqual(['zly', null]);
    expect(bazowa('0', 'g', 'en-US')).toBe('zly');
  });
});

describe('druty (BR-ZAP-003, RD-11, RD-19)', () => {
  test('grupy Needles / Hooks / Other; rozmiar z US, gdy tabela go ma', () => {
    const s = stanDrutow([
      { id: '1', rodzaj: 'druty', rozmiarMm: 3.25, opis: 'circular, 80 cm' }, { id: '2', rodzaj: 'szydelko', rozmiarMm: 5, opis: '' },
      { id: '3', rodzaj: 'szydelko', rozmiarMm: 2.5, opis: '' }, { id: '4', rodzaj: 'inne', rozmiarMm: null, opis: 'cable needle' },
    ], j());
    expect(s.grupy.map((g) => [g.naglowek, g.wiersze.map((x) => x.rozmiar)])).toEqual([
      ['Needles', ['3.25 mm (US 3)']], ['Hooks', ['5 mm (US H-8)', '2.5 mm']], ['Other', ['']],
    ]);
    expect(s.grupy[2]?.wiersze[0]?.opis).toBe('cable needle');
  });
  test('podgląd: 2.5 mm szydełka → bez US z uwagą; 4 mm drutów → US 6; zły wpis → null', () => {
    expect(podgladRozmiaru('2.5', 'szydelko', j())).toBe('Shows as: 2.5 mm. No US size is listed for this one. Go by millimeters.');
    expect(podgladRozmiaru('4', 'druty', j())).toBe('Shows as: 4 mm (US 6)');
    expect(podgladRozmiaru('x', 'druty', j())).toBeNull();
  });
});
