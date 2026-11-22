// Liczba mnoga według CLDR (plurals.xml), zapisana ręcznie jak w Treningu (lib/plural.ts): bez Intl.PluralRules w czasie działania,
// więc działa tak samo na Hermes i w Node (ADR-0017). Zgodność z Intl pilnuje tests/i18n/liczba-mnoga.test.ts (35 języków × liczby).
export type KategoriaLiczby = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

interface Operandy { i: number; v: number; f: number; n: number }

function operandy(x: number): Operandy {
  const n = Math.abs(x);
  const [calosc, ulamek = ''] = String(n).split('.');
  return { n, i: Number(calosc), v: ulamek.length, f: Number(ulamek || 0) };
}

// Zakresy CLDR („11..19”) obejmują tylko liczby całkowite: 11,5 do zakresu nie należy.
const wZakresie = (x: number, a: number, b: number) => Number.isInteger(x) && x >= a && x <= b;
// CLDR: „many” dla pełnych milionów (es, fr, it, pt): i != 0, i % 1000000 = 0, v = 0.
const milion = ({ i, v }: Operandy) => v === 0 && i !== 0 && i % 1_000_000 === 0;
const jeden = ({ i, v }: Operandy) => i === 1 && v === 0;
const zeroLubJeden = ({ i }: Operandy) => i === 0 || i === 1;
const koniec1 = (x: number) => x % 10 === 1 && x % 100 !== 11;
const koniec24 = (x: number) => wZakresie(x % 10, 2, 4) && !wZakresie(x % 100, 12, 14);

const REGULY: Record<string, (o: Operandy) => KategoriaLiczby> = {
  bez: () => 'other',
  // one = 1: en, de, nl, sv, fi, et, ca…; hu, tr, bg, el, nb: n = 1
  jeden: (o) => (jeden(o) ? 'one' : 'other'),
  n1: ({ n }) => (n === 1 ? 'one' : 'other'),
  da: ({ n, i, f }) => (n === 1 || (f !== 0 && zeroLubJeden({ i } as Operandy)) ? 'one' : 'other'),
  es: (o) => (o.n === 1 ? 'one' : milion(o) ? 'many' : 'other'),
  it: (o) => (jeden(o) ? 'one' : milion(o) ? 'many' : 'other'),
  fr: (o) => (zeroLubJeden(o) ? 'one' : milion(o) ? 'many' : 'other'), // pt-BR jak fr
  ptPT: (o) => (jeden(o) ? 'one' : milion(o) ? 'many' : 'other'),
  pl: (o) => {
    if (o.v !== 0) return 'other';
    if (o.i === 1) return 'one';
    return koniec24(o.i) ? 'few' : 'many';
  },
  cs: (o) => (o.v !== 0 ? 'many' : o.i === 1 ? 'one' : wZakresie(o.i, 2, 4) ? 'few' : 'other'),
  ru: (o) => {
    if (o.v !== 0) return 'other';
    return koniec1(o.i) ? 'one' : koniec24(o.i) ? 'few' : 'many';
  },
  hr: (o) => {
    if (koniec1(o.v === 0 ? o.i : -1) || (o.v !== 0 && koniec1(o.f))) return 'one';
    return (o.v === 0 && koniec24(o.i)) || (o.v !== 0 && koniec24(o.f)) ? 'few' : 'other';
  },
  sl: (o) => {
    if (o.v === 0 && o.i % 100 === 1) return 'one';
    if (o.v === 0 && o.i % 100 === 2) return 'two';
    return o.v !== 0 || wZakresie(o.i % 100, 3, 4) ? 'few' : 'other';
  },
  lt: (o) => {
    if (o.f !== 0) return 'many';
    const d = o.n % 10, dd = o.n % 100;
    if (d === 1 && !wZakresie(dd, 11, 19)) return 'one';
    return wZakresie(d, 2, 9) && !wZakresie(dd, 11, 19) ? 'few' : 'other';
  },
  lv: (o) => {
    const d = o.n % 10, dd = o.n % 100, f10 = o.f % 10, f100 = o.f % 100;
    if (d === 0 || wZakresie(dd, 11, 19) || (o.v === 2 && wZakresie(f100, 11, 19))) return 'zero';
    return (d === 1 && dd !== 11) || (o.v === 2 && f10 === 1 && f100 !== 11) || (o.v !== 2 && f10 === 1) ? 'one' : 'other';
  },
  ro: (o) => (jeden(o) ? 'one' : o.v !== 0 || o.n === 0 || (o.n !== 1 && wZakresie(o.n % 100, 1, 19)) ? 'few' : 'other'),
  sk: (o) => (o.v !== 0 ? 'many' : o.i === 1 ? 'one' : wZakresie(o.i, 2, 4) ? 'few' : 'other'),
};
REGULY.uk = REGULY.ru;
REGULY.sr = REGULY.hr;

const JEZYK_REGULA: Record<string, string> = {
  id: 'bez', ms: 'bez', vi: 'bez', ja: 'bez', ko: 'bez', 'zh-Hant': 'bez',
  en: 'jeden', de: 'jeden', nl: 'jeden', sv: 'jeden', fi: 'jeden', et: 'jeden',
  hu: 'n1', tr: 'n1', bg: 'n1', el: 'n1', nb: 'n1',
  da: 'da', es: 'es', 'es-419': 'es', it: 'it', fr: 'fr', 'pt-BR': 'fr', pt: 'ptPT',
  pl: 'pl', cs: 'cs', sk: 'sk', ru: 'ru', uk: 'uk', hr: 'hr', sr: 'sr', sl: 'sl', lt: 'lt', lv: 'lv', ro: 'ro',
};

/** Kategoria CLDR dla liczby `n` w języku aplikacji (tag słownika, np. `pt-BR`). Nieznany język = reguła angielska. */
export function kategoriaLiczby(jezyk: string, n: number): KategoriaLiczby {
  return REGULY[JEZYK_REGULA[jezyk] ?? 'jeden'](operandy(n));
}

export const JEZYKI_Z_REGULA = Object.keys(JEZYK_REGULA);
