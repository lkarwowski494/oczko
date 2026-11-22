// Nazwy własne 35 lokalizacji na liście języków (design-spec „Ustawienia › Język”: nazwa we własnym języku i piśmie, nie klucz t()).
// Wyrocznia: CLDR przez Intl.DisplayNames w Node (ICU), pierwsza litera wielka w danym języku — inne narzędzie niż stała w aplikacji
// (Hermes nie gwarantuje Intl.DisplayNames).
import { JEZYKI, NAZWY_JEZYKOW } from '../../src/i18n/jezyki';

describe('NAZWY_JEZYKOW', () => {
  test('klucze = JEZYKI (35)', () => {
    expect(Object.keys(NAZWY_JEZYKOW).sort()).toEqual([...JEZYKI].sort());
  });
  test.each([...JEZYKI])('%s: nazwa własna jak w CLDR', (j) => {
    const n = new Intl.DisplayNames([j], { type: 'language' }).of(j) ?? '';
    expect(NAZWY_JEZYKOW[j]).toBe(n.charAt(0).toLocaleUpperCase(j) + n.slice(1));
  });
});
