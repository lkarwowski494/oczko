// Test roli 08 (P-163, P-161): RD-13-W11–W19 (pas rzędu w robocie: skończone + tryb → liczba na liczniku, rząd pasa, k) i W20–W25 (sygnał przy
// zmianie skończonych). Wyrocznia: tests/wektory/brd.json (łatka 01 fix-4 NZ-RD13-CHWILA) i wzór RD-13 (docs/brd/reguly.md).
import { przypomnienieChwili, sygnalZmiany, type TrybLicznika } from '../../../src/domena/przypomnienia';
import { wektoryReguly, liczba, licznikWektorow, BLAD_DANYCH, type WartoscBrd } from '../../narzedzia/akceptacja';

const plan = (w: Record<string, WartoscBrd>) => ({ od: liczba(w['s [rz.]']), co: liczba(w['N [rz.]']), razy: liczba(w['M [-]']) });
const TRYB: Record<string, TrybLicznika> = { 'skończone rzędy': 'skonczone', 'rząd w trakcie': 'w_trakcie' };

describe('RD-13 przypomnienieChwili: wektory BRD W11–W19 (P-161)', () => {
  const wektory = wektoryReguly('RD-13').filter((w) => 'skończone [rz.]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-LIC-009 ${w.id} (${w.rodzaj}) skończone=${w.wejscie['skończone [rz.]']} tryb=${w.wejscie['tryb [-]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const tryb = TRYB[String(w.wejscie['tryb [-]'])];
      expect(tryb).toBeDefined(); // nieznany tryb w wektorze = błąd wektora, nie domyślny tryb
      const wynik = przypomnienieChwili(liczba(w.wejscie['skończone [rz.]']), tryb, plan(w.wejscie));
      const o = w.oczekiwane;
      if (o['rząd pasa [rz.]'] === BLAD_DANYCH) expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      else expect(wynik).toEqual({ ok: true, wartosc: { licznik: o['liczba na liczniku [rz.]'], rzadPasa: o['rząd pasa [rz.]'], k: o['k [-]'] } });
    });
  });
  test(`RD-13 liczność: wykonano ${wektory.length} z 9 wektorów chwili (pusty zbiór = porażka)`, () => {
    expect(wektory.map((w) => w.id)).toEqual(Array.from({ length: 9 }, (_, i) => `RD-13-W${11 + i}`));
    licznik.wynik(wektory.length);
  });
  test('RD-13 tryb spoza listy → błąd danych (nie zgadywany tryb)', () => {
    expect(przypomnienieChwili(5, 'inny' as TrybLicznika, { od: 6, co: 6, razy: 5 })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
  test('RD-13 skończone niecałkowite → błąd danych', () => {
    expect(przypomnienieChwili(5.5, 'skonczone', { od: 6, co: 6, razy: 5 })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});

describe('RD-13 sygnalZmiany: wektory BRD W20–W25 (P-161 Q2a)', () => {
  const wektory = wektoryReguly('RD-13').filter((w) => 'skończone przed [rz.]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-LIC-009 ${w.id} (${w.rodzaj}) ${w.wejscie['skończone przed [rz.]']} → ${w.wejscie['skończone po [rz.]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const wynik = sygnalZmiany(liczba(w.wejscie['skończone przed [rz.]']), liczba(w.wejscie['skończone po [rz.]']), plan(w.wejscie));
      expect(wynik).toEqual({ ok: true, wartosc: { rzadSygnalu: w.oczekiwane['rząd sygnału [rz.]'], rzadPasa: w.oczekiwane['rząd pasa po zmianie [rz.]'] } });
    });
  });
  test(`RD-13 liczność: wykonano ${wektory.length} z 6 wektorów zmiany (pusty zbiór = porażka)`, () => {
    expect(wektory.map((w) => w.id)).toEqual(Array.from({ length: 6 }, (_, i) => `RD-13-W${20 + i}`));
    licznik.wynik(wektory.length);
  });
  test('RD-13 bez zmiany (47 → 47, pas na 48) → bez sygnału, pas zostaje', () => {
    expect(sygnalZmiany(47, 47, { od: 6, co: 6, razy: 10 })).toEqual({ ok: true, wartosc: { rzadSygnalu: null, rzadPasa: 48 } });
  });
  test('RD-13 przed < 0 albo N = 0 → błąd danych', () => {
    expect(sygnalZmiany(-1, 3, { od: 6, co: 6, razy: 5 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(sygnalZmiany(1, 3, { od: 6, co: 0, razy: 5 })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});
