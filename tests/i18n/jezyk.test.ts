import { JEZYKI, ZRODLO, dopasujJezyk, lancuchZastepczy, wybierzJezyk } from '../../src/i18n/jezyki';

describe('zestaw języków (D-026, P-009)', () => {
  it('ma 35 lokalizacji, źródło en, bez duplikatów', () => {
    expect(JEZYKI).toHaveLength(35);
    expect(new Set(JEZYKI).size).toBe(35);
    expect(ZRODLO).toBe('en');
    expect(JEZYKI).toContain('en');
  });
  it('Portugalia to „pt”, Brazylia to „pt-BR” (jak w Treningu)', () => {
    expect(JEZYKI).toContain('pt');
    expect(JEZYKI).toContain('pt-BR');
    expect(JEZYKI).not.toContain('pt-PT');
  });
});

describe('dopasujJezyk: język systemu → słownik', () => {
  const przypadki: Array<[string[], string]> = [
    [['pl-PL'], 'pl'],
    [['en-GB'], 'en'],
    [['de-AT'], 'de'],
    [['zh-Hant-TW'], 'zh-Hant'],
    [['zh-HK'], 'zh-Hant'],
    [['zh-Hans-CN', 'de-DE'], 'de'], // brak zh-Hans: następny język z listy użytkownika
    [['zh-Hans-CN'], 'en'],
    [['es-ES'], 'es'],
    [['es-MX'], 'es-419'],
    [['es-419'], 'es-419'],
    [['es-US'], 'es-419'],
    [['pt-BR'], 'pt-BR'],
    [['pt-PT'], 'pt'],
    [['pt-AO'], 'pt'],
    [['pt-US'], 'pt'],
    [['es-BR'], 'es-419'],
    [['pt'], 'pt-BR'],
    [['no-NO'], 'nb'],
    [['nn-NO'], 'nb'],
    [['nb'], 'nb'],
    [['in-ID'], 'id'], // Android: dawny kod indonezyjskiego
    [['sr-Latn-RS'], 'sr'],
    [['he-IL', 'fr-FR'], 'fr'],
    [['he-IL'], 'en'],
    [[], 'en'],
    [['xx-YY'], 'en'],
    [['PL_pl'], 'en'], // niepoprawny tag nie rzuca wyjątku
  ];
  it.each(przypadki)('%j → %s', (tagi, oczekiwany) => {
    expect(dopasujJezyk(tagi)).toBe(oczekiwany);
  });
});

describe('wybierzJezyk: przełącznik w aplikacji (P-075, 3b)', () => {
  it('"auto" idzie za systemem', () => expect(wybierzJezyk('auto', ['ja-JP'])).toBe('ja'));
  it('jawny wybór wygrywa z systemem', () => expect(wybierzJezyk('de', ['ja-JP'])).toBe('de'));
  it('nieznany zapis w ustawieniach wraca do systemu', () => expect(wybierzJezyk('klingon', ['fr-CA'])).toBe('fr'));
  it('null (brak zapisu) = auto', () => expect(wybierzJezyk(null, ['it-IT'])).toBe('it'));
});

describe('lancuchZastepczy: wariant → język → źródło, nigdy klucz', () => {
  it('es-419 → es → en', () => expect(lancuchZastepczy('es-419')).toEqual(['es-419', 'es', 'en']));
  it('pt-BR → pt → en (nakładka na portugalski)', () => expect(lancuchZastepczy('pt-BR')).toEqual(['pt-BR', 'pt', 'en']));
  it('pt → en (bez przechodzenia przez pt-BR)', () => expect(lancuchZastepczy('pt')).toEqual(['pt', 'en']));
  it('zwykły język → źródło', () => expect(lancuchZastepczy('pl')).toEqual(['pl', 'en']));
  it('źródło → samo', () => expect(lancuchZastepczy('en')).toEqual(['en']));
});
