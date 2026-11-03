// Rola 04, fix M2 partia 3c1 (P-441; design-spec „Aneks M2 partia 3c1”): teksty en i wyrocznie dla 08.
// Wyrocznia: docs/design/fix15-2026-11-03/klucze.json. Nowe i zmienione klucze en są na liście „oczekujące na falę” (P-357); pl po akceptacji
// właściciela (P-422), przekład w fali 09 (P-320).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
type Aneks = { grupy: Record<string, string[]>; en: Record<string, string>; kontekst: Record<string, string> };
const ANEKS = czytaj('docs/design/fix15-2026-11-03/klucze.json') as Aneks;
const EN = czytaj('src/i18n/slowniki/en.json') as Record<string, Record<string, string>>;
const KONTEKST = czytaj('src/i18n/slowniki/en.kontekst.json') as Record<string, Record<string, string>>;
const PSEUDO = czytaj('src/i18n/pseudo/en-XA.json') as Record<string, string>;
const OCZEKUJACE = (czytaj('docs/lokalizacja/oczekujace.json') as { klucze: string[] }).klucze;
const SLOWNIKI = readdirSync(join(KORZEN, 'src/i18n/slowniki')).filter((f) => /^[a-z]{2}(-[A-Za-z0-9]+)?\.json$/.test(f) && f !== 'en.json');
const wartosc = (s: Record<string, Record<string, string>>, klucz: string) => { const [sekcja, nazwa] = klucz.split('.'); return s[sekcja]?.[nazwa]; };

/** Wspólny kontrakt grupy: wartość i kontekst z wyroczni, klucz na liście oczekujących, wpis pseudo, brak (starych) przekładów do fali 09. */
function kontraktGrupy(id: string): void {
  const klucze = ANEKS.grupy[id] ?? [];
  test(`${id}: grupa w wyroczni niepusta`, () => expect(klucze.length).toBeGreaterThan(0));
  test(`${id}: en.json = wyrocznia`, () => { for (const k of klucze) expect([k, wartosc(EN, k)]).toEqual([k, ANEKS.en[k]]); });
  test(`${id}: en.kontekst.json = wyrocznia`, () => { for (const k of klucze) expect([k, wartosc(KONTEKST, k)]).toEqual([k, ANEKS.kontekst[k]]); });
  test(`${id}: klucze na liście oczekujących (P-357)`, () => { for (const k of klucze) expect(OCZEKUJACE).toContain(k); });
  test(`${id}: pseudolokalizacja en-XA ma klucz`, () => { for (const k of klucze) expect([k, typeof PSEUDO[k]]).toEqual([k, 'string']); });
  test(`${id}: brak przekładów w ${SLOWNIKI.length} słownikach do fali 09 (pl też, P-422)`, () => {
    expect(SLOWNIKI.length).toBe(34);
    for (const f of SLOWNIKI) {
      const s = czytaj(`src/i18n/slowniki/${f}`) as Record<string, Record<string, string>>;
      for (const k of klucze) expect([f, k, wartosc(s, k)]).toEqual([f, k, undefined]);
    }
  });
}

// M1-audytor-generalny-131 (04-studio-projektowe-521; DEC-33 b, P-432): jednorazowa wskazówka gestu przy pierwszym otwarciu wzoru.
describe('M1-audytor-generalny-131: wskazówka „stuknij w rząd”', () => {
  kontraktGrupy('M1-audytor-generalny-131');
  test('tekst mówi o geście z kontraktu F-26 („stuknięcie w rząd”) i nazywa znacznik jak reszta wzoru („marker”)', () => {
    const w = wartosc(EN, 'wzor.wskazowka_znacznika') ?? '';
    expect(w).toMatch(/^Tap a row\b/);
    expect(w).toContain('marker');
    expect(wartosc(EN, 'wzor.przestaw')).toContain('marker');
  });
});
