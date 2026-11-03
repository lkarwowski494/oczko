// M1-audytor-generalny-082 (08-programista-008, DEV-13; zasada programisty 11: liczby konfiguracyjne w jednym module): liczba ostatnich błędów
// w „Zgłoś problem” — zwykłe zgłoszenie (src/przypadki-uzycia/zgloszenie.ts), zgłoszenie z trybu awaryjnego (src/kompozycja/zgloszenie-awaryjne.ts)
// i odczyt z kopii surowej (src/kompozycja/start-aplikacji.ts) — tylko ze stałej OSTATNIE_BLEDY w src/konfiguracja.ts; zapytania z parametrem.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { OSTATNIE_BLEDY } from '../../src/konfiguracja';

const KORZEN = join(__dirname, '../..');
function pliki(katalog: string): string[] {
  const w: string[] = [];
  for (const n of readdirSync(join(KORZEN, katalog))) {
    const p = join(KORZEN, katalog, n);
    if (statSync(p).isDirectory()) w.push(...pliki(relative(KORZEN, p)));
    else if (/\.tsx?$/.test(n)) w.push(relative(KORZEN, p));
  }
  return w;
}
const TS = [...pliki('src'), ...pliki('app')];
const tekst = (p: string) => readFileSync(join(KORZEN, p), 'utf8');
const gdzie = (re: RegExp) => TS.filter((p) => re.test(tekst(p))).sort();

test('M1-082: definicja OSTATNIE_BLEDY tylko w src/konfiguracja.ts', () => {
  expect(gdzie(/\bOSTATNIE_BLEDY\s*=/)).toEqual(['src/konfiguracja.ts']);
  expect(OSTATNIE_BLEDY).toBe(20); // wartość bez zmian (dziś we wszystkich trzech miejscach 20)
});
test('M1-082: zapytania o ostatnie błędy z tabeli `blad` z parametrem LIMIT ?, bez literału liczby', () => {
  expect(gdzie(/FROM blad[^'"`]*LIMIT \d/)).toEqual([]);
  for (const p of ['src/przypadki-uzycia/zgloszenie.ts', 'src/kompozycja/start-aplikacji.ts']) {
    expect({ p, parametr: /FROM blad ORDER BY id DESC LIMIT \?', \[OSTATNIE_BLEDY\]/.test(tekst(p)) }).toEqual({ p, parametr: true });
  }
  expect(tekst('src/kompozycja/zgloszenie-awaryjne.ts')).toMatch(/import \{[^}]*\bOSTATNIE_BLEDY\b[^}]*\} from '\.\.\/konfiguracja'/);
});
