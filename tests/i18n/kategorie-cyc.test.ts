/* P-303 / P-298 (wariant c): nazwy kategorii grubości CYC 0–7. Źródłem jest sekcja `kategorie_cyc` słownika terminów (06): nazwy en w en.json muszą
 * być identyczne, a kontekst dla tłumaczy mówi, że poza es, es-419 i fr zostaje numer + nazwa en (bez tłumaczenia z głowy). */
import * as fs from 'fs';
import * as path from 'path';

const KORZEN = path.join(__dirname, '..', '..');
const czytaj = (p: string): Record<string, unknown> => JSON.parse(fs.readFileSync(path.join(KORZEN, p), 'utf8')) as Record<string, unknown>;
const sekcja = (o: Record<string, unknown>, k: string): Record<string, unknown> => {
  const s = o[k];
  if (typeof s !== 'object' || s === null || Array.isArray(s)) throw new Error(`brak sekcji ${k}`);
  return s as Record<string, unknown>;
};
const slownik = czytaj('docs/lokalizacja/slownik-terminow.json');
const cyc = sekcja(slownik, 'kategorie_cyc');
const nazwyEn = cyc.nazwy_en as string[];
const jezykiLokalne = Object.keys(sekcja(cyc, 'jezyki_lokalne'));
const kategoria = sekcja(czytaj('src/i18n/slowniki/en.json'), 'kategoria');
const kontekst = sekcja(czytaj('src/i18n/slowniki/en.kontekst.json'), 'kategoria');

test('P-303: osiem nazw en kategorii 0–7 w en.json = nazwy_en ze słownika kategorie_cyc', () => {
  expect(nazwyEn).toHaveLength(8);
  expect([0, 1, 2, 3, 4, 5, 6, 7].map((n) => kategoria[`nazwa_${n}`])).toEqual(nazwyEn);
});

test.each([0, 1, 2, 3, 4, 5, 6, 7])('P-303: kontekst nazwa_%i mówi tłumaczowi, gdzie nazwa lokalna jest dozwolona, a gdzie zostaje en', (n) => {
  const k = String(kontekst[`nazwa_${n}`]);
  expect(jezykiLokalne.length).toBeGreaterThan(0);
  for (const j of jezykiLokalne) expect(k).toContain(j);
  expect(k).toMatch(/numer \+ nazwa en/);
  expect(k).toContain('kategorie_cyc');
});
