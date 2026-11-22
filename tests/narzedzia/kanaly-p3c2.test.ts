// Rola 11, fix M2 partia 3c2: odczyt reguł kanałów przed punktem kontrolnym 2027-01-09 (DEC-16 b; docs/wzrost.md, „Kanały”).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const czytaj = (p: string): string => readFileSync(join(__dirname, '../..', p), 'utf8');

describe('073 (DEC-16 b): tabela „Kanały” w docs/wzrost.md — odczyt reguł 2–3 miejsc', () => {
  const tekst = czytaj('docs/wzrost.md');
  const sekcja = tekst.split(/^## /m).find((s) => s.startsWith('Kanały')) ?? '';
  const wiersze = sekcja.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Kanał') && !l.startsWith('|---'));
  const kolumny = (l: string) => l.split('|').slice(1, -1).map((c) => c.trim());

  test('co najmniej 2 miejsca mają adres, cytat reguły autopromocji z datą odczytu 2026-11-03 i formę dozwoloną albo „nic”', () => {
    const pelne = wiersze.map(kolumny).filter((c) => /https:\/\//.test(c[0]) && /„[^”]{12,}”/.test(c[2]) && !/nie sprawdzono/.test(c[2]) && c[2].includes('2026-11-03') && c[3].length > 0);
    expect(pelne.length).toBeGreaterThanOrEqual(3);
  });

  test('Reddit po odczycie właściciela (P-470): cytaty reguł autopromocji r/knitting (Rule 6) i r/crochet (Rule 4) z datą 2026-11-03, bez „nie sprawdzono”', () => {
    const reddit = wiersze.map(kolumny).find((c) => /reddit\.com\/r\/knitting/.test(c[0]));
    expect(reddit).toBeDefined();
    expect(reddit?.[1]).toMatch(/przeczytane/);
    expect(reddit?.[2]).not.toMatch(/nie sprawdzono/);
    expect(reddit?.[2]).toMatch(/Rule 6 „No spam, no self-promotion”: „Promotional content is not allowed/);
    expect(reddit?.[2]).toMatch(/Rule 4: „No self-promotion/);
    expect(reddit?.[2]).toContain('2026-11-03');
  });
});
