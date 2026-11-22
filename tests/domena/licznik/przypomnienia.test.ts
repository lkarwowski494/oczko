// RD-13 przypomnienie „co N rzędów, M razy, od rzędu s” (BR-LIC-009, F-06) — poziom domena-Node.
// Wyrocznia: tests/wektory/brd.json RD-13-W1…W5 + własność ze wzoru RD-13 (rachunek na liczbach całkowitych w teście).
// Przeskok wartości (wpisanie 10 → 20, R-015) nie ma reguły: ER-40 otwarte, poza tym plikiem.
import fc from 'fast-check';
import { czyPrzypomnienie } from '../../../src/domena/przypomnienia';
import { wektoryReguly, liczba, licznikWektorow, BLAD_DANYCH, opcjeWlasnosci } from '../../narzedzia/akceptacja';

const KRYTERIA_RD13: Record<string, string> = {
  'RD-13-W1': 'BR-LIC-009/S1',
  'RD-13-W2': 'BR-LIC-009/S2',
  'RD-13-W3': 'BR-LIC-009/S3',
  'RD-13-W4': 'BR-LIC-009',
  'RD-13-W5': 'BR-LIC-009',
};

describe('RD-13 czyPrzypomnienie: wektory BRD', () => {
  // 08 (partia 1, NZ-05-01, P-097 1a, P-114 Q2a): pętla obejmuje wektory tego kształtu; wektory nowego kształtu sprawdza test 08 w tests/domena/.
  const wektory = wektoryReguly('RD-13').filter((w) => 'r [rz.]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA_RD13[w.id] ?? 'RD-13'} ${w.id} (${w.rodzaj}) r=${w.wejscie['r [rz.]']} s=${w.wejscie['s [rz.]']} N=${w.wejscie['N [rz.]']} M=${w.wejscie['M [-]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const plan = { od: liczba(w.wejscie['s [rz.]']), co: liczba(w.wejscie['N [rz.]']), razy: liczba(w.wejscie['M [-]']) };
      const wynik = czyPrzypomnienie(liczba(w.wejscie['r [rz.]']), plan);
      const o = w.oczekiwane['przypomnienie [-]'];
      if (o === BLAD_DANYCH) expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      else {
        expect(typeof o).toBe('boolean'); // tak/nie → true/false (P-097 1a); inna wartość to błąd wektora, nie „nie” (F07-03)
        expect(wynik).toEqual({ ok: true, wartosc: o });
      }
    });
  });
  test(`RD-13 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(5); // W6–W10 (wpisanie a → b): tests/domena/licznik/przypomnienie-wpisania.test.ts
    // F07-03: wszystkie kształty razem = cała reguła; nowy wektor innego kształtu nie może zostać pominięty po cichu.
    // P-161 (łatka 01 fix-4, P-163): 25 wektorów — W11–W19 (chwila) i W20–W25 (sygnał zmiany) w tests/domena/licznik/przypomnienie-chwili.test.ts.
    const inne = Array.from({ length: 20 }, (_, i) => `RD-13-W${6 + i}`);
    expect(wektoryReguly('RD-13').length).toBe(25);
    expect(wektoryReguly('RD-13').map((x) => x.id).sort()).toEqual([...wektory.map((x) => x.id), ...inne].sort());
    licznik.wynik(wektory.length);
  });
});

describe('RD-13 własność: dokładnie M wyzwoleń w rzędach s, s+N, …, s+(M−1)N', () => {
  test('BR-LIC-009 RD-13 dla dowolnego planu (s ≥ 1, N ≥ 1, M ≥ 1) zbiór rzędów z przypomnieniem = {s + kN : 0 ≤ k < M}', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 60 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 8 }), (s, N, M) => {
        const plan = { od: s, co: N, razy: M };
        const oczekiwane = Array.from({ length: M }, (_, k) => s + k * N);
        const wyzwolone: number[] = [];
        for (let r = 1; r <= s + (M + 1) * N; r += 1) {
          const w = czyPrzypomnienie(r, plan);
          expect(w.ok).toBe(true);
          if (w.ok && w.wartosc) wyzwolone.push(r);
        }
        expect(wyzwolone).toEqual(oczekiwane);
      }),
      opcjeWlasnosci(),
    );
  });
});
