// M1-audytor-generalny-053 (09-lokalizacja-008, LOK-11; DEC-13 a): rejestr docs/lokalizacja/jezyki.md jest jedynym źródłem stanu przekładu na język
// (stan, data, SHA en, drugi przegląd AI, przegląd człowieka, kontrola (a)); stan-przeklad.md to tylko dziennik. Kontrola: każdy język z supportedLocales
// w app.json ma własny wiersz z oznaczeniem tłumaczenia, a liczby kontroli (a) zgadzają się z przeglad-krytyczne.json.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const czytaj = (p: string) => readFileSync(join(KORZEN, p), 'utf8');
const SLOWNIKI = readdirSync(join(KORZEN, 'src/i18n/slowniki')).filter((f) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$/.test(f)).map((f) => f.slice(0, -5)).sort();
const expo = JSON.parse(czytaj('app.json')).expo;
const plugin = (expo.plugins as unknown[]).find((p) => Array.isArray(p) && p[0] === 'expo-localization') as [string, { supportedLocales: { ios: string[] } }];
const KRYTYCZNE = Object.keys(JSON.parse(czytaj('docs/lokalizacja/krytyczne.json')).klucze as object).length;
const PRZEGLAD = JSON.parse(czytaj('docs/lokalizacja/przeglad-krytyczne.json')).jezyki as Record<string, Record<string, { a?: unknown }>>;
const STANY = ['planowany', 'podpięty', 'w wydaniu', 'wycofany'];

function wiersze(): { kolumny: string[]; wiersze: Record<string, string>[] } {
  const linie = czytaj('docs/lokalizacja/jezyki.md').split('\n');
  const start = linie.findIndex((l) => /^\|\s*Język\s*\|/.test(l));
  const komorki = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const kolumny = komorki(linie[start]!);
  const w: Record<string, string>[] = [];
  for (const l of linie.slice(start + 2)) { if (!l.startsWith('|')) break; const k = komorki(l); w.push(Object.fromEntries(kolumny.map((n, i) => [n, k[i] ?? '']))); }
  return { kolumny, wiersze: w };
}

describe('rejestr języków (jezyki.md)', () => {
  const { kolumny, wiersze: w } = wiersze();
  const po = (j: string) => w.find((x) => x['Język'] === j);

  test('kolumny stanu: stan, tłumaczenie z datą i SHA, drugi przegląd AI, przegląd człowieka, treści krytyczne (a), kontrole, zrzuty', () => {
    for (const k of ['Język', 'Stan', 'Tłumaczenie', 'Drugi przegląd AI', 'Przegląd człowieka', 'Treści krytyczne', 'Kontrole (a)–(e)', 'Zrzuty']) expect(kolumny).toContain(k);
  });
  test('jeden wiersz na język: zbiór wierszy = supportedLocales (iOS) = słowniki (35), bez wierszy grupowych', () => {
    expect(plugin[1].supportedLocales.ios.slice().sort()).toEqual(SLOWNIKI);
    expect(w.map((x) => x['Język']).sort()).toEqual(SLOWNIKI);
    expect(SLOWNIKI).toHaveLength(35);
  });
  test('stan z listy; żaden z 35 języków podpiętych w aplikacji nie jest „planowany”', () => {
    for (const x of w) expect([x['Język'], STANY.includes(x['Stan']!), x['Stan'] !== 'planowany']).toEqual([x['Język'], true, true]);
  });
  test('oznaczenie tłumaczenia: en = źródło; pozostałe „maszynowe, <wykonawca>, RRRR-MM-DD, fala N (SHA en <64 znaki>)”', () => {
    expect(po('en')?.['Tłumaczenie']).toMatch(/^źródło\b/);
    for (const x of w.filter((y) => y['Język'] !== 'en')) expect([x['Język'], /^maszynowe, .+, \d{4}-\d{2}-\d{2}, fala \d+ \(SHA en [0-9a-f]{64}\)/.test(x['Tłumaczenie']!)]).toEqual([x['Język'], true]);
  });
  test('drugi przegląd AI z datą (poza en = źródło), przegląd człowieka i zrzuty wypełnione (brak = wpis „brak”, nie pusta komórka)', () => {
    for (const x of w) {
      expect([x['Język'], x['Język'] === 'en' ? /^n\/d/.test(x['Drugi przegląd AI']!) : /^\d{4}-\d{2}-\d{2}, /.test(x['Drugi przegląd AI']!)]).toEqual([x['Język'], true]);
      for (const k of ['Przegląd człowieka', 'Zrzuty', 'Kontrole (a)–(e)']) expect([x['Język'], x[k]!.length > 0]).toEqual([x['Język'], true]);
    }
  });
  test('kontrola (a): liczba kluczy krytycznych z wpisem „a” w przeglad-krytyczne.json = liczba w rejestrze', () => {
    for (const x of w) {
      if (x['Język'] === 'en') { expect(x['Treści krytyczne']).toMatch(/^n\/d/); continue; }
      const ile = Object.values(PRZEGLAD[x['Język']!] ?? {}).filter((v) => v.a).length;
      expect([x['Język'], x['Treści krytyczne']]).toEqual([x['Język'], expect.stringMatching(new RegExp(`^${ile}/${KRYTYCZNE}\\b`))]);
    }
  });
});
