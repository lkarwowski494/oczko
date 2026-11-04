/* Luki zestawu wydania względem Treningu (P-349; rola 10, 2026-11-02): Content Rights, lista wytycznych w sklep.md §5a, link EULA odłożony.
 * Test pilnuje formy dowodu (zasada wspólna 2 i 4): każda wytyczna ma adres, cytat, datę odczytu, stan z trzech dozwolonych i dowód,
 * a każdy dowód `plik:linia` wskazuje istniejący plik i istniejącą linię. Dlaczego: Content Rights zablokowało w Treningu „Add for Review”
 * (Trening docs/40-lekcje.md, L-028), a numery i brzmienie wytycznych z pamięci modelu bywają błędne (poprzednia wersja: 2.3.8 zamiast 2.3.7).
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sklep = czytaj('docs/wydanie/sklep.md');
const kroki = czytaj('docs/wydanie/kroki-wlasciciela-testflight.md');
const WYTYCZNE = 'https://developer.apple.com/app-store/review/guidelines/';
const DATA = '2026-11-02';

/** Sekcja od nagłówka `## <prefiks>` do następnego `## `. */
const sekcja = (tekst: string, prefiks: string): string => {
  const i = tekst.search(new RegExp(`^## ${prefiks}`, 'm'));
  if (i < 0) return '';
  const reszta = tekst.slice(i + 3);
  const k = reszta.search(/^## /m);
  return k < 0 ? reszta : reszta.slice(0, k);
};

describe('Content Rights (P-349 (1))', () => {
  const wiersz = sklep.split('\n').find((l) => /^\|\s*\d+\s*\|\s*\*\*Content Rights/.test(l)) ?? '';
  test('krok w tabeli ASC §3: adres strony Apple z datą odczytu, odpowiedź Yes z uzasadnieniem (czcionka OFL, wzory importowane przez użytkownika), analogia z Treningiem', () => {
    expect(wiersz).not.toBe('');
    expect(wiersz).toContain('https://developer.apple.com/help/app-store-connect/reference/app-information/');
    expect(wiersz).toContain(DATA);
    expect(wiersz).toMatch(/Apps that contain, show, or access third-party content must have all the necessary rights/);
    expect(wiersz).toMatch(/\*\*Yes\*\*/);
    expect(wiersz).toMatch(/Libre Franklin/);
    expect(wiersz).toMatch(/OFL/);
    expect(wiersz).toMatch(/importowan/);
    expect(wiersz).toMatch(/docs\/48-zgloszenie-1-0\.md/); // Trening: gdzie szukano (P-315)
    expect(wiersz).toMatch(/Add for Review/);
  });
  test('licencja czcionki, na którą powołuje się odpowiedź, istnieje w repo', () => {
    expect(fs.existsSync(path.join(ROOT, 'assets/fonts/librefranklin-OFL.txt'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'assets/fonts/LibreFranklin-Bold.ttf'))).toBe(true);
  });
  test('kategoria podatkowa (ta sama blokada „Add for Review” w Treningu): krok z adresem i datą odczytu', () => {
    const w = sklep.split('\n').find((l) => /^\|\s*\d+\s*\|\s*\*\*Kategoria podatkowa/.test(l)) ?? '';
    expect(w).toContain('https://developer.apple.com/help/app-store-connect/manage-app-information/set-a-tax-category/');
    expect(w).toContain(DATA);
    expect(w).toMatch(/App Store software/);
  });
  test('instrukcja właściciela ma krok C1 z adresem Apple, datą odczytu i stanem „po audycie”', () => {
    const s = sekcja(kroki, 'C1');
    expect(s).toMatch(/Content Rights/);
    expect(s).toContain('https://developer.apple.com/help/app-store-connect/reference/app-information/');
    expect(s).toContain(DATA);
    expect(kroki).toMatch(/^\| C1 \|.*po audycie/m);
  });
});

describe('Lista wytycznych w sklep.md §5a (P-349 (4))', () => {
  const s = sekcja(sklep, '5a');
  const wiersze = s.split('\n').filter((l) => /^\|\s*\d\.\d/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const WYMAGANE = ['1.4.1', '2.1', '2.3.3', '2.3.7', '2.5.1', '3.1.1', '3.1.2', '5.1.3'];
  const STANY = /(spełnione|do sprawdzenia przy buildzie kandydata|\[DO USTALENIA\])/;

  test('sekcja istnieje, ma adres wytycznych i datę odczytu', () => {
    expect(s).not.toBe('');
    expect(s).toContain(WYTYCZNE);
    expect(s).toContain(DATA);
    expect(s).toContain('October 16, 2026'); // „Last Updated” ze strony
  });
  test('osiem wytycznych w kolejności; każdy wiersz ma 4 kolumny: wytyczna, cytat, stan, dowód', () => {
    expect(wiersze.map((w) => w[0].split(' ')[0])).toEqual(WYMAGANE);
    for (const w of wiersze) expect(w).toHaveLength(4);
  });
  test.each(WYMAGANE)('%s: cytat w cudzysłowie, stan z dozwolonych, niepusty dowód', (nr) => {
    const w = wiersze.find((x) => x[0].startsWith(nr + ' '))!;
    expect(w[1]).toMatch(/„[^”]{20,}”/);
    expect(w[2]).toMatch(STANY);
    expect(w[3].length).toBeGreaterThan(20);
    expect(w[3]).toMatch(/`[^`]+`|krok/);
  });
  test('każdy dowód plik:linia wskazuje istniejący plik i istniejącą linię (stan na 2026-11-02, nie z pamięci)', () => {
    const dowody = [...s.matchAll(/`((?:docs|src|tests|e2e|scripts|assets|app)\/[^`\s:]+):(\d+)(?:[–-](\d+))?`/g)];
    expect(dowody.length).toBeGreaterThanOrEqual(10);
    for (const [, plik, od, do_] of dowody) {
      const p = path.join(ROOT, plik);
      expect(fs.existsSync(p)).toBe(true);
      expect(fs.readFileSync(p, 'utf8').split('\n').length).toBeGreaterThanOrEqual(Number(do_ ?? od));
    }
  });
  test('cytaty wytycznych zgadzają się z tekstem z dnia odczytu (kopia fragmentów w tym teście)', () => {
    const CYTATY: Record<string, string> = {
      '1.4.1': 'Medical apps that could provide inaccurate data or information',
      '2.1': 'make sure they are complete, up-to-date, visible to the reviewer and functional',
      '2.3.3': 'Screenshots should show the app in use',
      '2.3.7': 'App names must be limited to 30 characters',
      '2.5.1': 'Apps may only use public APIs and must run on the currently shipping OS',
      '3.1.1': 'you must use in-app purchase',
      '3.1.2': 'you must provide ongoing value to the customer',
      '5.1.3': 'may not store personal health information in iCloud',
    };
    for (const [nr, fraza] of Object.entries(CYTATY)) {
      const w = wiersze.find((x) => x[0].startsWith(nr + ' '))!;
      expect(w[1]).toContain(fraza);
    }
  });
  test('3.1.2: wymaganie linków w aplikacji ma źródło w umowie (DPLA, Schedule 2 §3.8(b)) i dowód w ekranie ofert', () => {
    const w = wiersze.find((x) => x[0].startsWith('3.1.2 '))!;
    expect(w[1] + w[3]).toMatch(/Schedule 2/);
    expect(w[1] + w[3]).toMatch(/Links to Your Privacy Policy and Terms of Use must be accessible within Your Licensed Application/);
    expect(w[3]).toContain('src/ekrany/Oferty.tsx');
  });
  test('wytyczne bez dowodu w kodzie nie są oznaczone „spełnione”: 2.1, 2.3.3, 2.5.1 czekają na build kandydata', () => {
    for (const nr of ['2.1', '2.3.3', '2.5.1']) expect(wiersze.find((x) => x[0].startsWith(nr + ' '))![2]).toMatch(/do sprawdzenia przy buildzie kandydata/);
  });
});

describe('Link EULA w opisie sklepu (P-349 (2)) — pozycja wdrożona (10-wydanie-002)', () => {
  test('sklep.md opisuje wdrożony link (P-349 (2), po audycie P-320); en.store.json ma go na końcu opisu (szczegóły: eula-w-opisie.test.ts)', () => {
    const s = sekcja(sklep, '5b');
    expect(s).toMatch(/Terms of Use/);
    expect(s).toMatch(/P-349 \(2\)/);
    expect(s).toMatch(/P-320/);
    expect(s).toMatch(/po audycie/);
    expect(s).toContain('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
    expect(s).toMatch(/10-wydanie-002/);
    expect(czytaj('docs/wydanie/metadane/en.store.json')).toMatch(/stdeula/);
  });
});
