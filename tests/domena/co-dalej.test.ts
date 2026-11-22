// M3 p2 (ZM-01, wiersz „co dalej” na „Dziś”; dzianina/wzorce-zrzuty/dzis-390-jasny: „Za 4 rzędy: ujmowanie (5 z 8)” przy rzędzie 43).
// Wyrocznia: RD-13 (rząd r wyzwala, gdy r ≥ s, (r − s) mod N = 0 i (r − s) / N < M) — rachunek ręczny w komentarzach, nie kod.
import { coDalej } from '../../src/domena/co-dalej';

const ujmowanie = { id: 'a', tekst: 'ujmowanie', od: 11, co: 9, razy: 8 }; // rzędy 11, 20, 29, 38, 47, 56, 65, 74

describe('coDalej: najbliższe przypomnienie od rzędu w robocie (RD-13)', () => {
  test('makieta: rząd w robocie 43 → za 4 rzędy (47) ujmowanie, 5 z 8', () => {
    expect(coDalej(43, [ujmowanie])).toEqual({ za: 4, rzad: 47, tekst: 'ujmowanie', ktory: 5, razy: 8 });
  });
  test('przypomnienie w rzędzie w robocie → za 0', () => {
    expect(coDalej(47, [ujmowanie])).toEqual({ za: 0, rzad: 47, tekst: 'ujmowanie', ktory: 5, razy: 8 });
  });
  test('po ostatnim powtórzeniu (rząd 75) → brak', () => {
    expect(coDalej(75, [ujmowanie])).toBeNull();
  });
  test('dwa plany: wygrywa bliższy rząd; przy równym rzędzie pierwszy plan', () => {
    const dodawanie = { id: 'b', tekst: 'dodawanie', od: 44, co: 2, razy: 3 }; // 44, 46, 48
    expect(coDalej(43, [ujmowanie, dodawanie])).toEqual({ za: 1, rzad: 44, tekst: 'dodawanie', ktory: 1, razy: 3 });
    const teSame = { id: 'c', tekst: 'dziurka', od: 47, co: 1, razy: 1 };
    expect(coDalej(43, [ujmowanie, teSame])?.tekst).toBe('ujmowanie');
  });
  test('bez planów albo z błędnym planem (N < 1, RD-13-W5) → brak, bez wyjątku', () => {
    expect(coDalej(1, [])).toBeNull();
    expect(coDalej(1, [{ tekst: 'zły', od: 1, co: 0, razy: 3 }])).toBeNull();
  });
});
