// Rola 12 E2, P-177: okno przed zapisem „start w toku” (rozpocznijStart). Awaria w tym oknie nie liczy się jako nieudany start. Tańsza kontrola
// zamiast znacznika natywnego (zasada wspólna 7): kod JS wykonywany przy imporcie modułów (przed pierwszym efektem korzenia) nie dotyka plików,
// bazy ani argumentów startu — wtedy awaria w oknie nie zależy od danych użytkownika i powtarza się w każdym buildzie, więc łapie ją CI i TestFlight.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const KORZEN = join(__dirname, '../..');
const pliki = (k: string): string[] => readdirSync(join(KORZEN, k)).flatMap((n) => {
  const p = join(k, n);
  return statSync(join(KORZEN, p)).isDirectory() ? pliki(p) : /\.tsx?$/.test(n) && !/\.d\.ts$/.test(n) ? [p] : [];
});
// I/O plików i bazy (src/dane/pliki/system.ts, adapter expo-sqlite, expo-file-system), argumenty startu (Settings.get) i kontener.
const IO = new Set(['istniejePlik', 'istniejeKatalog', 'rozmiar', 'utworzKatalog', 'lista', 'usunPlik', 'usunKatalog', 'kopiuj', 'przenies', 'wolneMiejsce',
  'czytajTekst', 'zapiszTekst', 'otworzDoCzytania', 'otworzDoZapisu', 'katalogBiblioteki', 'otworzPortExpo', 'openDatabaseSync', 'openDatabaseAsync',
  'utworzKontener', 'rozpocznijStart', 'trybAwaryjny', 'zegarAplikacji', 'awariaStartu', 'siecWylaczona', 'get']);

/** Wywołania wykonywane przy imporcie: w instrukcjach najwyższego poziomu, z pominięciem ciał funkcji, metod i klas. */
function wywolaniaPrzyImporcie(plik: string): string[] {
  const tekst = readFileSync(join(KORZEN, plik), 'utf8');
  const sf = ts.createSourceFile(plik, tekst, ts.ScriptTarget.Latest, true, plik.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: string[] = [];
  const odwiedz = (w: ts.Node): void => {
    if (ts.isFunctionLike(w) || ts.isClassLike(w)) return;
    if (ts.isCallExpression(w) || ts.isNewExpression(w)) {
      const c = w.expression;
      const nazwa = ts.isIdentifier(c) ? c.text : ts.isPropertyAccessExpression(c) ? c.name.text : '';
      if (IO.has(nazwa) || (ts.isNewExpression(w) && /^(File|Directory)$/.test(nazwa))) {
        out.push(`${plik}:${sf.getLineAndCharacterOfPosition(w.getStart()).line + 1} ${w.getText().slice(0, 60)}`);
      }
    }
    ts.forEachChild(w, odwiedz);
  };
  for (const s of sf.statements) if (!ts.isImportDeclaration(s)) odwiedz(s);
  return out;
}

test('P-177 ADR-0019: żaden moduł app/ ani src/ nie wykonuje I/O plików, bazy ani odczytu argumentów startu przy imporcie', () => {
  const zrodla = [...pliki('app'), ...pliki('src')];
  expect(zrodla.length).toBeGreaterThan(100);
  expect(zrodla.flatMap(wywolaniaPrzyImporcie)).toEqual([]);
});

test('P-177: kontrola wykrywa I/O przy imporcie (próbka negatywna)', () => {
  const sf = 'const s = czytajTekst("/x"); export const E = Settings.get("a"); const f = new File("u"); function ok() { return czytajTekst("/y"); }';
  const plik = join('tests', 'niezawodnosc', '__probka__.ts');
  const odczyt = jest.spyOn(require('node:fs'), 'readFileSync').mockReturnValueOnce(sf);
  const w = wywolaniaPrzyImporcie(plik);
  odczyt.mockRestore();
  expect(w.map((x) => relative('', x).split(' ')[1])).toEqual(['czytajTekst("/x")', 'Settings.get("a")', 'new']);
});
