// M1-audytor-generalny-323 (10-wydanie-501, M2-koordynator-napraw-001; DEC-03 b): nazwy w notatce dla App Review
// to nazwy z interfejsu tej wersji, nie ze słownika. Każda nazwa w cudzysłowie jest wartością klucza en, którego
// nazwa występuje w kodzie app/ albo src/ (poza słownikami), albo literałem w kodzie ekranu (np. „+1” na karcie „Dziś”).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const NOTATKA = readFileSync(join(KORZEN, 'docs/wydanie/metadane/notatka-recenzja.txt'), 'utf8');

function pliki(k: string): string[] {
  return readdirSync(k).flatMap((n) => {
    const p = join(k, n);
    if (statSync(p).isDirectory()) return /i18n/.test(p) ? [] : pliki(p);
    return /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}
const KOD = ['app', 'src'].flatMap((k) => pliki(join(KORZEN, k))).map((p) => readFileSync(p, 'utf8')).join('\n');

const plaski = (o: Record<string, unknown>, przed = ''): [string, string][] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? plaski(v as Record<string, unknown>, `${przed}${k}.`) : [[`${przed}${k}`, String(v)]]));
const EN = plaski(JSON.parse(readFileSync(join(KORZEN, 'src/i18n/slowniki/en.json'), 'utf8')));

/** Klucze en o tej wartości, których nazwa jest literałem w kodzie, i czy sama nazwa jest literałem w kodzie. */
function zrodlo(nazwa: string): { klucze: string[]; literal: boolean } {
  const klucze = EN.filter(([k, v]) => v === nazwa && (KOD.includes(`'${k}'`) || KOD.includes(`"${k}"`))).map(([k]) => k);
  return { klucze, literal: KOD.includes(`'${nazwa}'`) };
}

const cytowane = NOTATKA.split('\n').flatMap((l, i) => [...l.matchAll(/"([^"]+)"/g)].map((m) => ({ linia: i + 1, nazwa: m[1] })));

describe('M1-323: nazwy w notatce dla App Review pochodzą z interfejsu', () => {
  test('notatka cytuje nazwy (test nie jest pusty)', () => {
    expect(cytowane.length).toBeGreaterThan(10);
  });

  test.each(cytowane.map((c) => [c.linia, c.nazwa]))('linia %i: "%s" jest w interfejsie', (_linia, nazwa) => {
    const z = zrodlo(nazwa as string);
    expect({ nazwa, wInterfejsie: z.klucze.length > 0 || z.literal }).toEqual({ nazwa, wInterfejsie: true });
  });

  test('wzór dodaje się wierszem „Add pattern” projektu albo kaflem na „Dziś”, nie z menu •••', () => {
    const dodaj = EN.find(([k]) => k === 'wzor.dodaj')?.[1];
    expect(dodaj).toBe('Add pattern');
    expect(readFileSync(join(KORZEN, 'src/ekrany/WzorGrupa.tsx'), 'utf8')).toContain("t('wzor.dodaj')");
    expect(readFileSync(join(KORZEN, 'src/ekrany/Dzis.tsx'), 'utf8')).toContain("klucz: 'wzor.dodaj'");
    const krok2 = NOTATKA.split('\n').find((l) => /^2\. /.test(l)) ?? '';
    expect(krok2).toContain(`"${dodaj}"`);
    expect(krok2).not.toMatch(/menu|•••/i);
    expect(NOTATKA).not.toContain('•••');
  });

  test('notatka ≤ 4000 bajtów', () => {
    expect(Buffer.byteLength(NOTATKA, 'utf8')).toBeLessThanOrEqual(4000);
  });
});
