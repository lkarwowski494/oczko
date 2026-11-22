// Test roli 08 (P-114 Q2a): RD-13-W6–W10 (zmiana wartości z a na b, BR-LIC-017, ER-40, P-097 (3.2a)) i plan rzędów F-06 (U-3).
// Wyrocznia: tests/wektory/brd.json i wzór RD-13 (docs/brd/reguly.md): wyzwala r ≥ s, (r − s) mod N = 0, (r − s) / N < M.
// Plan F-06: rzędy z wzoru RD-13 (s, s + N, …, s + (M − 1)N; RD-13-W1, W2) i N = 0 → błąd danych (RD-13-W5); kod 0.1.0 nie jest wyrocznią (F07-03).
import { przypomnienieWpisania, planPrzypomnien } from '../../../src/domena/przypomnienia';
import { wektoryReguly, liczba, licznikWektorow } from '../../narzedzia/akceptacja';

describe('RD-13 przypomnienieWpisania: wektory BRD W6–W10', () => {
  const wektory = wektoryReguly('RD-13').filter((w) => 'a [rz.]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-LIC-009 ${w.id} (${w.rodzaj}) a=${w.wejscie['a [rz.]']} b=${w.wejscie['b [rz.]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const plan = { od: liczba(w.wejscie['s [rz.]']), co: liczba(w.wejscie['N [rz.]']), razy: liczba(w.wejscie['M [-]']) };
      const wynik = przypomnienieWpisania(liczba(w.wejscie['a [rz.]']), liczba(w.wejscie['b [rz.]']), plan);
      const rzad = w.oczekiwane['przypomnienie [-]'] === true ? w.oczekiwane['rząd przypomnienia [rz.]'] : null;
      expect(wynik).toEqual({ ok: true, wartosc: rzad });
    });
  });
  test(`RD-13 liczność: wykonano ${wektory.length} z 5 wektorów a → b (pusty zbiór = porażka)`, () => {
    expect(wektory.map((w) => w.id)).toEqual(['RD-13-W6', 'RD-13-W7', 'RD-13-W8', 'RD-13-W9', 'RD-13-W10']);
    licznik.wynik(wektory.length);
  });
  // Przedział (a, b] otwarty z lewej (RD-13 „Wzór”): rząd a już był, więc nie wyzwala drugi raz (dopisane po mutantach przeżywających).
  test('RD-13 wpisanie z rzędu wyzwalającego a = 12 na b = 17 → bez przypomnienia (12 ∉ (12, 17], 18 > 17)', () => {
    expect(przypomnienieWpisania(12, 17, { od: 6, co: 6, razy: 5 })).toEqual({ ok: true, wartosc: null });
  });
  test('RD-13 b = a (bez zmiany wartości, a = 12 wyzwalający) → bez przypomnienia', () => {
    expect(przypomnienieWpisania(12, 12, { od: 6, co: 6, razy: 5 })).toEqual({ ok: true, wartosc: null });
  });
  test('RD-13 N = 0 przy wpisaniu → błąd danych (jak RD-13-W5)', () => {
    expect(przypomnienieWpisania(10, 20, { od: 6, co: 0, razy: 5 })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});

describe('F-06 U-3 planPrzypomnien: rzędy z przypomnieniem przed zapisem (wzór RD-13)', () => {
  test('BR-LIC-009 RD-13-W1 parametry s = 6, N = 6, M = 5 → [6, 12, 18, 24, 30] (ostatnie 6 + 4 × 6, RD-13-W2)', () => {
    expect(planPrzypomnien({ od: 6, co: 6, razy: 5 })).toEqual({ ok: true, wartosc: [6, 12, 18, 24, 30] });
  });
  test('BR-LIC-009 RD-13-W5 N = 0 → błąd danych', () => {
    expect(planPrzypomnien({ od: 6, co: 0, razy: 5 })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
  test('BR-LIC-009 M = 1 → jeden rząd s', () => {
    expect(planPrzypomnien({ od: 9, co: 4, razy: 1 })).toEqual({ ok: true, wartosc: [9] });
  });
});
