// Liczba mnoga: wektory ze wzorców roli 09 oraz strażnik zgodności ręcznych reguł (plural.ts) z CLDR przez Intl.PluralRules w Node (ICU).
import { JEZYKI } from '../../src/i18n/jezyki';
import { kategoriaLiczby, JEZYKI_Z_REGULA } from '../../src/i18n/plural';

const WEKTORY: Record<string, Array<[number, string]>> = {
  pl: [[1, 'one'], [2, 'few'], [5, 'many'], [12, 'many'], [22, 'few'], [25, 'many'], [0, 'many'], [1.5, 'other']],
  ru: [[21, 'one']],
  cs: [[3, 'few'], [22, 'other']],
  lv: [[10, 'zero']],
  sl: [[2, 'two'], [3, 'few']],
  ro: [[2, 'few'], [20, 'other']],
  fr: [[0, 'one']],
  en: [[0, 'other']],
  // Portugalia (tag „pt”, jak w Treningu): 0 → other; Brazylia (pt-BR) jak francuski: 0 i 1 → one
  pt: [[0, 'other'], [1, 'one'], [2, 'other']],
  'pt-BR': [[0, 'one'], [1, 'one'], [2, 'other']],
};

// Tag słownika → tag dla Intl: „pt” w aplikacji to Portugalia, a w CLDR „pt” to Brazylia.
const tagIntl = (j: string) => (j === 'pt' ? 'pt-PT' : j);

describe('wektory liczby mnogiej (CLDR)', () => {
  for (const [jezyk, wektory] of Object.entries(WEKTORY)) {
    for (const [n, kategoria] of wektory) {
      it(`${jezyk}: ${n} → ${kategoria}`, () => expect(kategoriaLiczby(jezyk, n)).toBe(kategoria));
    }
  }
});

describe('strażnik: każdy z 35 języków ma regułę i zgadza się z Intl.PluralRules', () => {
  it('lista języków z regułami = zestaw aplikacji', () => {
    expect([...JEZYKI_Z_REGULA].sort()).toEqual([...JEZYKI].sort());
  });

  const liczby = [
    ...Array.from({ length: 10_001 }, (_, i) => i),
    1_000_000, 2_000_000, 1_500_000, 10_000_000, 1_000_001, 100_000_000,
    0.1, 0.5, 1.1, 1.5, 2.5, 2.01, 3.14, 10.5, 11.5, 12.5, 20.5, 21.5, 22.5, 100.5, 101.5, 111.5, 0.01, 1.01, 12.34, 21.1,
  ];
  it.each([...JEZYKI])('%s: wszystkie kategorie jak w ICU (%#)', (jezyk) => {
    const pr = new Intl.PluralRules(tagIntl(jezyk));
    const roznice = liczby.filter((n) => kategoriaLiczby(jezyk, n) !== pr.select(n)).slice(0, 5).map((n) => `${n}: ${kategoriaLiczby(jezyk, n)} ≠ ${pr.select(n)}`);
    expect(roznice).toEqual([]);
  });
  it.each([...JEZYKI])('%s: ICU zna tag (porównanie nie jest z zapasowym „en”)', (jezyk) => {
    expect(Intl.PluralRules.supportedLocalesOf([tagIntl(jezyk)])).toHaveLength(1);
  });
  it('liczba ujemna jak dodatnia', () => expect(kategoriaLiczby('pl', -2)).toBe('few'));
});
