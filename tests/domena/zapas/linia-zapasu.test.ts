// Linia informacji pod „Yarn used” na karcie ukończenia (BR-ZAP-002, U-9, P-126 (2a); design-spec „Zużycie włóczki przy ukończeniu”):
// wartość ponad zapas jest przyjmowana; zapas po zapisie = max(0, zapas − zmiana zużycia). Zmiana liczona względem poprzedniego potwierdzenia
// (potwierdzZuzycie: ponowne potwierdzenie tej samej liczby nic nie odejmuje).
import { liniaZapasu, krokMotkow } from '../../../src/domena/zapas';

describe('liniaZapasu', () => {
  test.each([
    ['w zapasie: 1 z 3', { zapas: 3, zuzycie: 1, poprzednie: null }, { rodzaj: 'brak' }],
    ['równo zapasowi: bez linii', { zapas: 2, zuzycie: 2, poprzednie: null }, { rodzaj: 'brak' }],
    ['ponad zapas: 2,5 przy 2', { zapas: 2, zuzycie: 2.5, poprzednie: null }, { rodzaj: 'ponad', zapas: 2 }],
    ['zapas już 0 i nowe zużycie', { zapas: 0, zuzycie: 1, poprzednie: null }, { rodzaj: 'juz_zero' }],
    ['zapas 0, zużycie 0: bez linii', { zapas: 0, zuzycie: 0, poprzednie: null }, { rodzaj: 'brak' }],
    ['ponowne potwierdzenie tej samej liczby: bez linii', { zapas: 0, zuzycie: 3, poprzednie: 3 }, { rodzaj: 'brak' }],
    ['zwiększenie względem poprzedniego ponad zapas', { zapas: 1, zuzycie: 4, poprzednie: 2 }, { rodzaj: 'ponad', zapas: 1 }],
    ['brak wpisu: bez linii', { zapas: 1, zuzycie: null, poprzednie: null }, { rodzaj: 'brak' }],
  ] as const)('%s', (_n, wejscie, oczekiwane) => {
    expect(liniaZapasu(wejscie)).toEqual(oczekiwane);
  });
});

describe('krokMotkow (krokowiec − / +, krok 0,5, nie poniżej 0)', () => {
  test.each([
    [null, 1, 0.5], [0.5, 1, 1], [1, -1, 0.5], [0.5, -1, 0], [0, -1, 0], [null, -1, 0], [1.2, 1, 1.5], [1.2, -1, 1],
  ] as const)('%p %p → %p', (od, kierunek, wynik) => {
    expect(krokMotkow(od, kierunek)).toBe(wynik);
  });
});
