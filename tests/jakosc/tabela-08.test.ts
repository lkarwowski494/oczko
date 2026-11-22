// tabela-08.mjs (F07-04, F07-10, P-125 Q1a): pliki warstwy 2 w tests/dane są w tabeli jako „zielony (główny zestaw)”,
// a plik testów importujący src spoza katalogów tabeli (np. po przeniesieniu do nowego katalogu) daje kod 1, zamiast zniknąć z tabeli.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const NARZEDZIE = join(__dirname, '../../docs/jakosc/narzedzia/tabela-08.mjs');
function drzewo(pliki: Record<string, string>) {
  const k = mkdtempSync(join(tmpdir(), 'tabela-08-'));
  for (const [p, t] of Object.entries({ 'src/dane/a.ts': 'export const a = 1;\n', ...pliki })) { mkdirSync(dirname(join(k, p)), { recursive: true }); writeFileSync(join(k, p), t); }
  return k;
}
const uruchom = (k: string) => {
  const w = spawnSync(process.execPath, [NARZEDZIE, '--korzen', k, '--wynik', join(k, 'tabela.md')], { encoding: 'utf8' });
  return { kod: w.status, wyjscie: w.stdout };
};
const IMPORT = (glebokosc: number) => `import { a } from '${'../'.repeat(glebokosc)}src/dane/a';\ntest('BR-DAN-001 x', () => expect(a).toBe(1));\n`;

test('F07-10 plik w tests/dane → wiersz „2 dane”, stan „zielony (główny zestaw)”, kod 0', () => {
  const k = drzewo({ 'tests/dane/x.test.ts': IMPORT(2), 'tests/i18n/j.test.ts': IMPORT(2) });
  expect(uruchom(k).kod).toBe(0);
  const tabela = readFileSync(join(k, 'tabela.md'), 'utf8');
  expect(tabela).toContain('| 2 dane: port bazy, migracje, repozytoria, archiwum, kopie | `tests/dane/x.test.ts` | zielony (główny zestaw) | 1 | BR-DAN-001 | `src/dane/a` | — |');
  expect(tabela).not.toContain('tests/i18n'); // rola 09, poza przekazaniem (WYLACZONE)
});

test('F07-10 pułapka: plik testów z importem src w katalogu spoza tabeli → kod 1 z nazwą pliku', () => {
  const k = drzewo({ 'tests/dane/x.test.ts': IMPORT(2), 'tests/platforma/y.test.ts': IMPORT(2) });
  const w = uruchom(k);
  expect(w.kod).toBe(1);
  expect(w.wyjscie).toContain('BŁĄD tests/platforma/y.test.ts: importuje src');
});

test('M1-127 (07-jakosc-519): test.each z nawiasem w danych, z typem <…> i z tablicą `…` to po jednej deklaracji; `/re/.test(s)` to nie test', () => {
  const x = `${IMPORT(2)}test.each([['a (b)', 1], ['c', 2]])('%s', (_n, n) => expect(n).toBeGreaterThan(0));\n`
    + `test.each<[string, number]>([['d (e)', 3]])('%s', (_n, n) => expect(n).toBe(3));\nit.each\`\n  a\n  ${'${1}'}\n\`('t $a', ({ a }) => expect(a).toBe(1));\n`;
  const y = `${IMPORT(2)}const r = /a/.test('a');\n`;
  const k = drzewo({ 'tests/dane/x.test.ts': x, 'tests/dane/y.test.ts': y });
  expect(uruchom(k).kod).toBe(0);
  const tabela = readFileSync(join(k, 'tabela.md'), 'utf8');
  expect(tabela).toContain('| `tests/dane/x.test.ts` | zielony (główny zestaw) | 4 | BR-DAN-001 |');
  expect(tabela).toContain('| `tests/dane/y.test.ts` | zielony (główny zestaw) | 1 | BR-DAN-001 |');
});
