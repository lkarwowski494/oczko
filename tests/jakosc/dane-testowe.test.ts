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
    expect(pliki.filter((p) => !kod.some((k) => k.includes(p.slice(p.lastIndexOf('/') + 1)))).map((p) => p.replace(KAT + '/', ''))).toEqual([]);
  });
  test.each(pliki.filter((p) => p.endsWith('.pdf')).map((p) => [p.replace(KAT + '/', ''), p]))('NFR-PRY-001 %s bez słownika Info z autorem i bez strumienia XMP', (_n, p) => {
    const tekst = readFileSync(p).toString('latin1');
    expect(tekst).not.toMatch(/\/Author\s*\(/);
    expect(tekst).not.toMatch(/\/Creator\s*\(/);
    expect(tekst).not.toMatch(/\/Type\s*\/Metadata/);
  });
});
