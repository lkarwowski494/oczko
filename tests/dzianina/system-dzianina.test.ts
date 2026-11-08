// M3 p1 (P-553 wyjątek nazwany, P-554, P-547): system „Dzianina” zastępuje poprzedni w docs/design/ (tokeny, design-spec, ikona); poprzedni leży w archiwum.
// Testy wartości poprzedniego systemu (kolory, obrys przycisku, krój) mają tu odpowiedniki dla Dzianiny: kontrast par, tło ≠ biel/czerń, przycisk wypełniony.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const K = join(__dirname, '../..');
const czytaj = (p: string) => readFileSync(join(K, p), 'utf8');
const json = (p: string) => JSON.parse(czytaj(p)) as Record<string, any>;
const tokeny = json('docs/design/tokeny.json');

const lin = (c: number) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const kontrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const MOTYWY = ['jasny', 'ciemny'] as const;

describe('M3 p1: docs/design/ = system Dzianina, poprzedni w archiwum (P-553)', () => {
  test('docs/design/tokeny.json to tokeny Dzianiny (runo musket, mioget, Bree Serif)', () => {
    expect(tokeny.kolory?.jasny?.tlo).toBe('#E6E1DA');
    expect(tokeny.kolory?.ciemny?.tlo).toBe('#26211E');
    expect(tokeny.kroje?.tytul?.rodzina).toBe('Bree Serif');
  });
  test('docs/design/design-spec.md opisuje Dzianinę, a nie kierunek „Kreski na wzorze”', () => {
    expect(czytaj('docs/design/design-spec.md').split('\n')[0]).toMatch(/Dzianina/);
  });
  test('stary system leży w docs/design/archiwum/2026-11-08-kreski/ (tokeny.json, design-spec.md, ikona/)', () => {
    const a = 'docs/design/archiwum/2026-11-08-kreski';
    expect(json(`${a}/tokeny.json`).kolor?.jasny?.papier).toBe('#FCFCFA');
    expect(czytaj(`${a}/design-spec.md`).length).toBeGreaterThan(50000);
    expect(existsSync(join(K, a, 'ikona/icon.png'))).toBe(true);
  });
  test('docs/design/ikona/ ma pliki ikony Dzianiny (SHA = docs/design/dzianina/ikona/)', () => {
    const { createHash } = require('node:crypto') as typeof import('node:crypto');
    const sha = (p: string) => createHash('sha256').update(readFileSync(join(K, p))).digest('hex');
    for (const f of ['icon.png', 'ios-dark.png', 'ios-tinted.png', 'android-foreground.png', 'android-monochrome.png', 'splash-icon.png', 'splash-icon-dark.png', 'watch.png']) {
      expect(sha(`docs/design/ikona/${f}`)).toBe(sha(`docs/design/dzianina/ikona/${f}`));
    }
  });
});

describe('M3 p1: kontrast par Dzianiny (tokeny w docs/design/tokeny.json, progi WCAG 2.2 jak docs/design/narzedzia/kontrast.mjs)', () => {
  const PARY: [string, string, number][] = [
    ['tekst', 'tlo', 4.5], ['tekst2', 'tlo', 4.5], ['tekst', 'powierzchnia', 4.5], ['tekst2', 'powierzchnia', 4.5],
    ['akcentTekst', 'tlo', 4.5], ['akcentTekst', 'powierzchnia', 4.5], ['kartaTekst', 'karta', 4.5], ['kartaTekst2', 'karta', 4.5],
    ['przyciskTekst', 'przycisk', 4.5], ['niszczacyTekst', 'niszczacy', 4.5], ['przyciskNieaktywnyTekst', 'przyciskNieaktywny', 4.5],
    ['przyciskNieaktywnyRama', 'tlo', 3], ['akcent', 'karta', 3], ['igla', 'karta', 3],
  ];
  test.each(MOTYWY.flatMap((m) => PARY.map(([a, b, min]) => [m, a, b, min] as const)))('%s: %s na %s ≥ %f:1', (m, a, b, min) => {
    const p = tokeny.kolory?.[m];
    expect(p).toBeDefined();
    expect(kontrast(p[a], p[b])).toBeGreaterThanOrEqual(min);
  });
  test.each([['jasnyZwiekszony', 'jasny'], ['ciemnyZwiekszony', 'ciemny']] as const)('%s: tekst2, akcentTekst, zakładka nad progiem (linia jest dekoracyjna: kontrast-tabela.txt, „informacyjnie”)', (z, m) => {
    const w = { ...tokeny.kolory?.[m], ...tokeny.kolory?.[z] };
    expect(kontrast(w.tekst2, w.tlo)).toBeGreaterThanOrEqual(7);
    expect(kontrast(w.akcentTekst, w.tlo)).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(w.zakladka, w.pasek)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('M3 p1: tło żadnego ekranu nie jest czystą bielą ani czernią (P-547)', () => {
  const ZAKAZANE = ['#ffffff', '#000000', '#fff', '#000'];
  test.each(MOTYWY)('%s: tlo, powierzchnia, pasek, ikonaTlo', (m) => {
    const p = tokeny.kolory?.[m];
    expect(p).toBeDefined();
    for (const k of ['tlo', 'powierzchnia', 'pasek', 'ikonaTlo']) expect(ZAKAZANE).not.toContain(String(p[k]).toLowerCase());
  });
  test('przycisk główny jest wypełniony w obu motywach: kolor przycisku ≠ tło ekranu i ≠ powierzchni (nie obrys)', () => {
    for (const m of MOTYWY) {
      const p = tokeny.kolory?.[m];
      expect(p).toBeDefined();
      expect(p.przycisk).not.toBe(p.tlo);
      expect(p.przycisk).not.toBe(p.powierzchnia);
      expect(kontrast(p.przycisk, p.tlo)).toBeGreaterThanOrEqual(3);
    }
  });
});
