// M1-audytor-generalny-081 (źródło 08-programista-007, DEV-09; zasady programisty 9–10, wzorce roli „Parsowanie: brak zostaje brakiem”):
// `PortBazy.all<T>` zwraca `T[]` bez sprawdzenia (src/domena/porty.ts), więc generyk z kształtem wiersza (`all<{ n: number }>`) to rzutowanie
// danych z bazy. Odczyt idzie przez `wiersze`/`tekst`/`liczba` (src/dane/repozytoria/wiersze.ts) albo z `unknown`; trwała kontrola: 0 trafień.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const KORZEN = join(__dirname, '../..');
function pliki(katalog: string): string[] {
  const w: string[] = [];
  for (const n of readdirSync(join(KORZEN, katalog))) {
    const p = join(KORZEN, katalog, n);
    if (statSync(p).isDirectory()) w.push(...pliki(relative(KORZEN, p)));
    else if (/\.tsx?$/.test(n) && !/\.(test|spec)\.tsx?$/.test(n)) w.push(relative(KORZEN, p));
  }
  return w;
}
/** Wywołanie `.all<…>` z typem innym niż `unknown` (także rozbite na linie: `baza\n  .all<{ … }>`). */
const GENERYK_WIERSZA = /\.all\s*<(?!\s*unknown\s*>)/g;

function trafienia(): string[] {
  const w: string[] = [];
  for (const p of [...pliki('src'), ...pliki('app')]) {
    if (p === 'src/dane/repozytoria/wiersze.ts') continue;
    const zrodlo = readFileSync(join(KORZEN, p), 'utf8');
    for (const m of zrodlo.matchAll(GENERYK_WIERSZA)) w.push(`${p}:${zrodlo.slice(0, m.index).split('\n').length}`);
  }
  return w.sort();
}

test('kontrola łapie generyk wiersza, a przepuszcza unknown i wywołanie bez generyku', () => {
  const ile = (s: string) => [...s.matchAll(GENERYK_WIERSZA)].length;
  expect(ile("await z.baza.all<{ n: number }>('SELECT 1')")).toBe(1);
  expect(ile("await baza.all<WierszIcloud>('SELECT *')")).toBe(1);
  expect(ile("await port.all<unknown>('PRAGMA user_version')")).toBe(0);
  expect(ile("await wiersze(tx.all('SELECT 1'), 'x')")).toBe(0);
});

test('src i app: odczyty z bazy bez generyku typu wiersza (0 trafień)', () => {
  expect(trafienia()).toEqual([]);
});
