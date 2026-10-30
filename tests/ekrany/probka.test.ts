// Kalkulator „Swatch” (BR-KAL-001, BR-KAL-003, RD-01, RD-04, RD-10; design-spec „Kalkulator Swatch”): stan ekranu z pól (08 partia 5, grupa D).
import { stanProbki, type WejscieProbki } from '../../src/kompozycja/probka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const licz = (w: Partial<WejscieProbki>, jezyk = 'en-US') =>
  stanProbki({ oczka: '', na: '10cm', szerokosc: '', jednostka: 'cm', ...w }, { t, jezyk: () => jezyk });

describe('BR-KAL-001 (RD-01)', () => {
  test('S1: 22 o./10 cm, 50 cm → 110 oczek z danymi wejściowymi i uwagą o blokowaniu', () => {
    const s = licz({ oczka: '22', szerokosc: '50' });
    expect(s.wynik).toEqual({ liczba: '110 stitches', zDanych: 'From 22 stitches per 10 cm and 50 cm.', uwaga: t('probka.uwaga_oczka') });
    expect(s.bladOczka).toBeNull();
  });
  test('S2 (RD-01-W5): brak próbki przy szerokości 50 cm → prośba o próbkę, bez wyniku', () => {
    const s = licz({ szerokosc: '50' });
    expect(s.bladOczka).toBe('Enter the stitches in your swatch first.');
    expect([s.wynik, s.grubosc]).toEqual([null, null]);
  });
  test('S3 (RD-01-W2): szerokość 0 → błąd danych, bez wyniku; kategoria i tak się liczy', () => {
    const s = licz({ oczka: '22', szerokosc: '0' });
    expect(s.bladSzerokosci).toBe('Enter a number above 0.');
    expect(s.wynik).toBeNull();
    expect(s.grubosc).not.toBeNull();
  });
  test('ER-43: 21,5 w pl-PL → 107,5 oczka w zapisie regionu', () => {
    expect(licz({ oczka: '21,5', szerokosc: '50' }, 'pl-PL').wynik?.liczba).toBe('107,5 stitches');
  });
  test('ER-43: 21.5 w de-DE → bez wyniku, przykład zapisu 21,5', () => {
    const s = licz({ oczka: '21.5', szerokosc: '50' }, 'de-DE');
    expect(s.bladOczka).toBe('Write it as 21,5.');
    expect([s.wynik, s.grubosc]).toEqual([null, null]);
  });
  test('bez szerokości: bez bloku wyniku i bez błędu; puste pola — nic', () => {
    expect(licz({ oczka: '22' }).wynik).toBeNull();
    expect(licz({ oczka: '22' }).bladSzerokosci).toBeNull();
    expect(licz({})).toEqual({ bladOczka: null, przeliczona: null, uwaga4in: null, bladSzerokosci: null, wynik: null, grubosc: null });
  });
  test('1 oczko → liczba pojedyncza', () => {
    expect(licz({ oczka: '2', szerokosc: '5' }).wynik?.liczba).toBe('1 stitch');
  });
});

describe('BR-KAL-003 (RD-04) i grubość (RD-10)', () => {
  test('S1: 20 o./4 in → „= 19.685 stitches per 10 cm” + uwaga 4 in; 10 in → 50 oczek', () => {
    const s = licz({ oczka: '20', na: '4in', szerokosc: '10', jednostka: 'in' });
    expect(s.przeliczona).toBe('= 19.685 stitches per 10 cm');
    expect(s.uwaga4in).toBe(t('probka.uwaga_4in'));
    expect(s.wynik?.liczba).toBe('50 stitches');
    expect(s.wynik?.zDanych).toBe('From 20 stitches per 4 in and 10 in.');
  });
  test('22 o./10 cm → kategoria 3 z dokładną wartością na 4 in i uwagą o zaokrągleniu', () => {
    const g = licz({ oczka: '22' }).grubosc;
    expect(g?.linie).toEqual(['Category 3, light: 21–24 stitches per 4 in, knitted in stockinette stitch.']);
    expect(g?.dokladnie).toBe('22.352 stitches per 4 in.');
    expect(g?.uwagi).toEqual([t('probka.uwaga_zaokraglenie'), t('probka.uwaga_kategoria')]);
  });
  test('23 o./4 in → obie kategorie 2 i 3, bez wartości dokładnej i bez uwagi o zaokrągleniu', () => {
    const g = licz({ oczka: '23', na: '4in' }).grubosc;
    expect(g?.linie).toEqual([
      'This gauge fits both category 2 and category 3.',
      'Category 2, fine: 23–26 stitches per 4 in, knitted in stockinette stitch.',
      'Category 3, light: 21–24 stitches per 4 in, knitted in stockinette stitch.',
    ]);
    expect(g?.dokladnie).toBeNull();
    expect(g?.uwagi).toEqual([t('probka.uwaga_kategoria')]);
  });
  test('połówka 20.5 o./4 in bez części wspólnej → między kategoriami 3 i 4', () => {
    expect(licz({ oczka: '20.5', na: '4in' }).grubosc?.linie).toEqual(['This gauge falls between categories 3 and 4.']);
  });
  test('45 o./4 in → powyżej tabeli z uwagą o koronce; 35 → kategoria 0 też z uwagą o koronce', () => {
    const g = licz({ oczka: '45', na: '4in' }).grubosc;
    expect(g?.linie).toEqual(['This gauge is above category 0, which goes up to 40 stitches per 4 in.']);
    expect(g?.uwagi).toEqual([t('probka.uwaga_koronka'), t('probka.uwaga_kategoria')]);
    expect(licz({ oczka: '35', na: '4in' }).grubosc?.uwagi).toEqual([t('probka.uwaga_koronka'), t('probka.uwaga_kategoria')]);
  });
  test('5 o./4 in → kategoria 7 bez dolnej granicy (wariant otwarty)', () => {
    expect(licz({ oczka: '5', na: '4in' }).grubosc?.linie).toEqual(['Category 7, jumbo: at most 6 stitches per 4 in, knitted in stockinette stitch.']);
  });
  test('próbka 0 → błąd wartości, bez kategorii', () => {
    const s = licz({ oczka: '0' });
    expect(s.bladOczka).toBe('Enter a number above 0.');
    expect(s.grubosc).toBeNull();
  });
});

describe('P-304 (e): kategoria grubości tylko dla drutów (CYC ma osobne zakresy dla szydełka: kat. 4 = 16–20 vs 11–14 o./4 in)', () => {
  test('projekt szydełkowy: próbka 18 o./4 in → bez kategorii, wynik szerokości nadal się liczy', () => {
    const s = licz({ oczka: '18', na: '4in', szerokosc: '50', narzedzie: 'szydelko' });
    expect(s.grubosc).toBeNull();
    expect(s.wynik).not.toBeNull();
  });
  test('projekt z drutami: ta sama próbka → kategoria 4 (16–20)', () => {
    const s = licz({ oczka: '18', na: '4in', narzedzie: 'druty' });
    expect(s.grubosc?.linie.join(' ')).toContain('4');
  });
  test('bez projektu (kalkulator samodzielny): kategoria jak dotąd', () => {
    expect(licz({ oczka: '18', na: '4in' }).grubosc).not.toBeNull();
  });
});

describe('P-307: liczba przy „stitches” w kluczach liczby mnogiej (forma wybierana przez count, nie sklejana)', () => {
  test('1 oczko na 10 cm → „From 1 stitch per 10 cm and 50 cm.”; 4 in z wynikiem dokładnie 1 → „= 1 stitch per 10 cm”', () => {
    expect(licz({ oczka: '1', szerokosc: '50' }).wynik?.zDanych).toBe('From 1 stitch per 10 cm and 50 cm.');
    expect(licz({ oczka: '1.016', na: '4in' }).przeliczona).toBe('= 1 stitch per 10 cm');
    expect(licz({ oczka: '22', szerokosc: '50' }).wynik?.zDanych).toBe('From 22 stitches per 10 cm and 50 cm.');
  });
  test('ułamek (21,5) i zero używają formy _other: „21.5 stitches”', () => {
    expect(licz({ oczka: '21.5', szerokosc: '50' }).wynik?.zDanych).toBe('From 21.5 stitches per 10 cm and 50 cm.');
  });
  test('4 in = dokładnie 1 o./4 in → „1 stitch per 4 in.” (linia dokładnie); kategoria powyżej tabeli bez zmian', () => {
    expect(licz({ oczka: '0.984', na: '10cm' }).grubosc?.dokladnie).toBe('1 stitch per 4 in.');
  });
});

