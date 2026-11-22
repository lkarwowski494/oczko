// Dane testowe z wycinków prawdziwych plików (strategia §4, zasada roli 07 nr 7): każdy plik ma opis pochodzenia, PDF bez metadanych osobowych.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const KAT = join(__dirname, '../dane');
const pliki: string[] = [];
// Kod testów warstwy danych (DS-02, strategia §10) to nie dane (P-122 (a)): tylko *.test.ts i tests/dane/pomocnicze/;
// każdy inny plik, także .ts z danymi (np. ślad, wycinek importu), wymaga opisu pochodzenia (F07-13, P-125 Q3a).
const kodTestow = (p: string) => p.endsWith('.test.ts') || p.startsWith(join(KAT, 'pomocnicze') + '/');
const skan = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) skan(p); else if (!n.endsWith('.opis.md') && !kodTestow(p)) pliki.push(p); } };
skan(KAT);

/** M1-audytor-generalny-164 (07-jakosc-541): kod bez komentarzy liniowych i blokowych (napisy i literały szablonu zostają), żeby sama wzmianka nazwy pliku
 *  w komentarzu nagłówka nie zaliczała odczytu. Prosty skaner znaków: komentarz zaczyna się tylko poza napisem. */
export function bezKomentarzy(kod: string): string {
  let w = '';
  for (let i = 0; i < kod.length; i++) {
    const c = kod[i];
    if (c === '/' && kod[i + 1] === '/') { while (i < kod.length && kod[i] !== '\n') i++; w += '\n'; continue; }
    if (c === '/' && kod[i + 1] === '*') { const k = kod.indexOf('*/', i + 2); i = k < 0 ? kod.length : k + 1; w += ' '; continue; }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < kod.length && kod[j] !== c && !(c !== '`' && kod[j] === '\n')) j += kod[j] === '\\' ? 2 : 1;
      w += kod.slice(i, j + 1); i = j; continue;
    }
    w += c;
  }
  return w;
}
/** Pliki danych, których nazwy nie ma w kodzie żadnego testu (po usunięciu komentarzy). */
export const nieczytane = (pliki: string[], kod: string[]): string[] => {
  const bez = kod.map(bezKomentarzy);
  return pliki.filter((p) => !bez.some((k) => k.includes(p.slice(p.lastIndexOf('/') + 1))));
};

describe('tests/dane (strategia §4)', () => {
  test('R-171 katalog danych testowych nie jest pusty (pusty zbiór to nie zaliczenie)', () => {
    expect(pliki.length).toBeGreaterThan(0);
  });
  test.each(pliki.map((p) => [p.replace(KAT + '/', ''), p]))('BR-WZR-001 %s ma opis pochodzenia ze źródłem, licencją i oczekiwanym wynikiem', (_n, p) => {
    expect(existsSync(`${p}.opis.md`)).toBe(true);
    const opis = readFileSync(`${p}.opis.md`, 'utf8');
    for (const pole of ['**Źródło:**', '**Licencja', '**Oczekiwany wynik']) expect(opis).toContain(pole);
  });
  // 07-jakosc-002 (M1-audytor-generalny-067): plik danych z opisem, którego nie czyta żaden test, to deklaracja bez pokrycia (strategia §4).
  test('BR-WZR-001 każdy plik danych testowych czyta co najmniej jeden test (nazwa pliku w kodzie testów poza tym plikiem)', () => {
    const kod: string[] = [];
    const zbierz = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (n !== 'node_modules') zbierz(p); } else if (/\.test\.tsx?$/.test(n) && p !== __filename) kod.push(readFileSync(p, 'utf8')); } };
    zbierz(join(__dirname, '..'));
    expect(pliki.length).toBeGreaterThan(0);
    expect(nieczytane(pliki, kod).map((p) => p.replace(KAT + '/', ''))).toEqual([]);
  });
  test('M1-164 pułapki: nazwa pliku tylko w komentarzu (// i /* */) nie zalicza odczytu; nazwa w napisie zalicza, także obok „//” w adresie', () => {
    const p = ['/x/tests/dane/wzory/a.pdf'];
    expect(nieczytane(p, ["// czyta tests/dane/wzory/a.pdf\nconst x = 1;"])).toEqual(p);
    expect(nieczytane(p, ["/* wycinek a.pdf\n * opis */ test('x', () => {});"])).toEqual(p);
    expect(nieczytane(p, ["const u = 'https://example.org'; const f = 'tests/dane/wzory/a.pdf';"])).toEqual([]);
    expect(nieczytane(p, ['readFileSync(`tests/dane/wzory/${"a.pdf"}`) // komentarz'])).toEqual([]);
  });
  test.each(pliki.filter((p) => p.endsWith('.pdf')).map((p) => [p.replace(KAT + '/', ''), p]))('NFR-PRY-001 %s bez słownika Info z autorem i bez strumienia XMP', (_n, p) => {
    const tekst = readFileSync(p).toString('latin1');
    expect(tekst).not.toMatch(/\/Author\s*\(/);
    expect(tekst).not.toMatch(/\/Creator\s*\(/);
    expect(tekst).not.toMatch(/\/Type\s*\/Metadata/);
  });
});
