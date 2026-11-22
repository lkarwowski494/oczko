// Wpis liczby (P-097 (5a), jak pole liczbowe Treningu): separator dziesiętny według języka (CLDR przez Intl), cyfry ASCII;
// zapis niezgodny = null (pole odrzuca wpis), pusty = null.
import { parsujCalkowita, parsujLiczbe } from '../../src/i18n/format';

describe('parsujLiczbe', () => {
  test.each([
    ['en', '1.5', 1.5], ['en', ' 2 ', 2], ['en', '0', 0], ['pl', '1,5', 1.5], ['de', '2,5', 2.5], ['fr', '0,5', 0.5],
    ['en', 'abc', null], ['en', '', null], ['en', '1.2.3', null], ['en', '-1', null], ['en', '.', null],
  ] as const)('%s „%s” → %p', (j, t, w) => {
    expect(parsujLiczbe(t, j)).toBe(w);
  });
});

// DEC-12 a (M1-audytor-generalny-069; 09-lokalizacja-006): pole bez separatora tysięcy przyjmuje „,” i „.” jako separator dziesiętny, bo zapis
// z grupowaniem jest tu i tak odrzucany; język aplikacji ≠ region telefonu (telefon en, region PL) nie odrzuca „3,5”.
describe('parsujLiczbe: oba separatory dziesiętne (DEC-12 a)', () => {
  test.each([
    ['en', '3,5', 3.5], ['pl', '3.5', 3.5], ['de', '21.5', 21.5], ['de', '21,5', 21.5], ['fr', '0.5', 0.5], ['en', '3.5', 3.5], ['pl', '3,5', 3.5],
    ['en', '1,5', 1.5], ['pl', '1.5', 1.5], ['en', ',5', 0.5], ['pl', '.5', 0.5], ['en', '4,', 4],
    ['en', '1,2.3', null], ['en', '1.2,3', null], ['pl', '1,2,3', null], ['en', ',', null], ['en', '1 000', null], ['en', '-3,5', null], ['en', '3,5a', null],
  ] as const)('%s „%s” → %p', (j, t, w) => {
    expect(parsujLiczbe(t, j)).toBe(w);
  });
  // Pole całkowite licznika bez zmian: grupowanie według języka, separator dziesiętny odrzucony (BR-LIC-017).
  test.each([['pl', '1.000', null], ['pl', '1,5', null], ['en', '1.5', null], ['en', '3,5', null], ['de', '1.000', 1000], ['en', '1,000', 1000]] as const)(
    'parsujCalkowita %s „%s” → %p', (j, t, w) => { expect(parsujCalkowita(t, j)).toBe(w); });
});

// P-255 (b): Hermes na iOS nie ma Intl.NumberFormat.prototype.formatToParts (doc/IntlAPIs.md „Supported on Android only”;
// lib/Platform/Intl/PlatformIntlApple.mm: „formatToParts is unimplemented on Apple platforms”) — wyjątek „undefined is not a function” w scen. 40, 41.
describe('parsujLiczbe bez Intl.NumberFormat.prototype.formatToParts (Hermes iOS)', () => {
  const oryginal = Intl.NumberFormat.prototype.formatToParts;
  beforeAll(() => { Reflect.deleteProperty(Intl.NumberFormat.prototype, 'formatToParts'); });
  afterAll(() => { Object.defineProperty(Intl.NumberFormat.prototype, 'formatToParts', { value: oryginal, writable: true, configurable: true }); });
  test.each([['en', '12.5', 12.5], ['pl', '12,5', 12.5], ['de', '0,25', 0.25], ['pl', '12.5', 12.5], ['en', '12,5', 12.5], ['en', '7', 7]])('%s „%s” → %p', (jezyk, tekst, wynik) => {
    expect(Intl.NumberFormat.prototype.formatToParts).toBeUndefined();
    expect(parsujLiczbe(tekst, jezyk)).toBe(wynik);
  });
});
