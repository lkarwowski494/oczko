// Mechanizm: wybór języka, łańcuch zastępczy, zmiana w trakcie, liczba mnoga przez i18next.
import { utworzI18n, type Zasoby, type MagazynPreferencji } from '../../src/i18n/i18n';

const zasoby: Zasoby = {
  en: { translation: { a: { tylko_en: 'Only English', hello: 'Hello', wiersze_one: '{{count}} row', wiersze_other: '{{count}} rows' } } },
  pl: {
    translation: {
      a: { hello: 'Cześć', wiersze_one: '{{count}} rząd', wiersze_few: '{{count}} rzędy', wiersze_many: '{{count}} rzędów', wiersze_other: '{{count}} rzędu' },
    },
  },
  es: { translation: { a: { hello: 'Hola' } } },
  'es-419': { translation: { a: {} } },
  de: { translation: { a: { hello: 'Hallo' } } },
};

const magazyn = (poczatkowy: string | null): MagazynPreferencji & { zapisane: Array<[string, string]> } => {
  const dane: Record<string, string | null> = { jezyk: poczatkowy };
  const zapisane: Array<[string, string]> = [];
  return {
    zapisane,
    odczytaj: async (k) => dane[k] ?? null,
    zapisz: async (k, v) => {
      dane[k] = v;
      zapisane.push([k, v]);
    },
  };
};

describe('utworzI18n', () => {
  it('start: auto → język systemu', async () => {
    const i = await utworzI18n({ magazyn: magazyn(null), systemowe: () => ['pl-PL'], zasoby });
    expect(i.jezyk()).toBe('pl');
    expect(i.t('a.hello')).toBe('Cześć');
  });
  it('start: zapisany wybór wygrywa z systemem', async () => {
    const i = await utworzI18n({ magazyn: magazyn('de'), systemowe: () => ['pl-PL'], zasoby });
    expect(i.jezyk()).toBe('de');
  });
  it('brak klucza w języku → tekst źródłowy, nigdy klucz ani pusty tekst', async () => {
    const i = await utworzI18n({ magazyn: magazyn(null), systemowe: () => ['de-DE'], zasoby });
    expect(i.t('a.tylko_en')).toBe('Only English');
  });
  it('es-419 bez klucza → es → en', async () => {
    const i = await utworzI18n({ magazyn: magazyn(null), systemowe: () => ['es-MX'], zasoby });
    expect(i.jezyk()).toBe('es-419');
    expect(i.t('a.hello')).toBe('Hola');
    expect(i.t('a.tylko_en')).toBe('Only English');
  });
  it('liczba mnoga pl: 1, 2, 5, 22, 1.5', async () => {
    const i = await utworzI18n({ magazyn: magazyn(null), systemowe: () => ['pl-PL'], zasoby });
    expect([1, 2, 5, 22, 1.5].map((count) => i.t('a.wiersze', { count }))).toEqual([
      '1 rząd', '2 rzędy', '5 rzędów', '22 rzędy', '1.5 rzędu',
    ]);
  });
  it('liczba mnoga en: 0 i 1', async () => {
    const i = await utworzI18n({ magazyn: magazyn(null), systemowe: () => ['en-US'], zasoby });
    expect([0, 1, 2].map((count) => i.t('a.wiersze', { count }))).toEqual(['0 rows', '1 row', '2 rows']);
  });
  it('zmiana języka w trakcie: zapis, powiadomienie, nowy tekst', async () => {
    const m = magazyn(null);
    const i = await utworzI18n({ magazyn: m, systemowe: () => ['en-US'], zasoby });
    const widziane: string[] = [];
    const wypisz = i.naZmiane((j) => widziane.push(j));
    await i.ustawJezyk('pl');
    expect(i.t('a.hello')).toBe('Cześć');
    expect(m.zapisane).toEqual([['jezyk', 'pl']]);
    await i.ustawJezyk('auto');
    expect(i.jezyk()).toBe('en');
    expect(m.zapisane[1]).toEqual(['jezyk', 'auto']);
    wypisz();
    await i.ustawJezyk('de');
    expect(widziane).toEqual(['pl', 'en']);
  });
  it('odświeżenie po zmianie języka systemu (Android: aplikacja nie restartuje się)', async () => {
    let sys = ['en-US'];
    const i = await utworzI18n({ magazyn: magazyn(null), systemowe: () => sys, zasoby });
    sys = ['pl-PL'];
    await i.odswiezJezykSystemowy();
    expect(i.jezyk()).toBe('pl');
  });
  it('odświeżenie nie nadpisuje jawnego wyboru użytkownika', async () => {
    let sys = ['en-US'];
    const i = await utworzI18n({ magazyn: magazyn('de'), systemowe: () => sys, zasoby });
    sys = ['pl-PL'];
    await i.odswiezJezykSystemowy();
    expect(i.jezyk()).toBe('de');
  });
  it('uszkodzony odczyt ustawień nie blokuje startu: auto', async () => {
    const zly: MagazynPreferencji = { odczytaj: async () => { throw new Error('baza'); }, zapisz: async () => {} };
    const i = await utworzI18n({ magazyn: zly, systemowe: () => ['fr-FR'], zasoby: { ...zasoby, fr: { translation: { a: { hello: 'Salut' } } } } });
    expect(i.jezyk()).toBe('fr');
  });
  it('pseudolokalizacja tylko na żądanie (dev) i nigdy jako język wydania', async () => {
    const i = await utworzI18n({ magazyn: magazyn(null), systemowe: () => ['en-US'], zasoby, pseudo: { translation: { a: { hello: '⟦Hèllö~⟧' } } } });
    expect(i.jezyk()).toBe('en-XA');
    expect(i.t('a.hello')).toBe('⟦Hèllö~⟧');
  });
  it('plik pseudo ze skryptu (płaski, klucze z kropkami) działa jak zasób zagnieżdżony', async () => {
    const i = await utworzI18n({ magazyn: magazyn(null), systemowe: () => ['en-US'], zasoby, pseudo: { translation: { 'a.hello': '⟦Hèllö~⟧' } } });
    expect(i.t('a.hello')).toBe('⟦Hèllö~⟧');
  });
});
