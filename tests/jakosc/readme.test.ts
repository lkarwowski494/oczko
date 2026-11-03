/* README.md (P-425, wariant a): opis, funkcje MVP z kontraktu zakresu, platformy, linki do polityki i wsparcia, komendy dla deweloperów.
 * Dlaczego te kontrole: lista funkcji w README ma być tą z `docs/scope-contract.md` (parsowaną tutaj, nie wpisaną w test), bo ręcznie utrzymywana lista
 * rozjeżdża się z kontraktem; w repo publicznym nie ma znaków towarowych osób trzecich poza nazwami platform Apple użytymi opisowo; odznaki i liczby testów
 * są poza README (decyzja P-425), bo szybko się starzeją i pokazują stan, którego README nie utrzymuje.
 *
 * Zasada znaków Apple (Guidelines for Using Apple Trademarks and Copyrights, apple.com/legal/intellectual-property/guidelinesfor3rdparties.html, odczyt 2026-11-03):
 * „The Apple word mark is used in a referential phrase such as “runs on,” “for use with,” “for,” or “compatible with.”” oraz
 * „As adjectives, trademarks may not be used in the plural or possessive form.” Stąd w README: „dla iPhone, iPad i Apple Watch” (bez odmiany), znak nie jest
 * częścią nazwy produktu, a stopka nazywa właściciela znaków.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ADRESY } from '../../src/kompozycja/adresy';

const root = join(__dirname, '../..');
const czytaj = (p: string) => readFileSync(join(root, p), 'utf8');
const README = czytaj('README.md');
const KONTRAKT = czytaj('docs/scope-contract.md');

/** Wiersze tabeli „Zakres” kontraktu: ID, nazwa funkcji, decyzja. Ta sama tabela co w `zakres-oczko.mjs` (nagłówek ID, Decyzja, Wymagania). */
function funkcje(): { id: string; nazwa: string; decyzja: string }[] {
  const wyj: { id: string; nazwa: string; decyzja: string }[] = [];
  let kolumny: string[] | null = null;
  for (const l of KONTRAKT.split('\n')) {
    if (!l.trim().startsWith('|')) { kolumny = null; continue; }
    const k = l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (k[0] === 'ID' && k.includes('Decyzja') && k.includes('Wymagania')) { kolumny = k; continue; }
    if (!kolumny || /^[:\s-]+$/.test(k[0])) continue;
    if (/^F-\d{2}$/.test(k[0])) wyj.push({ id: k[0], nazwa: k[kolumny.indexOf('Funkcja')], decyzja: k[kolumny.indexOf('Decyzja')] });
  }
  return wyj;
}
const MVP = funkcje().filter((f) => f.decyzja === 'MVP');

/** Wiersze listy funkcji w README: „- F-nn · nazwa”. */
const wReadme = [...README.matchAll(/^- (F-\d{2}) · (.+)$/gm)].map((m) => ({ id: m[1], nazwa: m[2].trim() }));

describe('README.md: lista funkcji = zakres 1.0 z kontraktu', () => {
  test('kontrakt daje 51 funkcji MVP (parsowanie tabeli „Zakres”), każda z nazwą', () => {
    expect(MVP).toHaveLength(51);
    for (const f of MVP) expect(f.nazwa.length).toBeGreaterThan(3);
  });

  test('lista w README ma dokładnie te F-ID i te nazwy co MVP w kontrakcie, w tej samej kolejności', () => {
    expect(wReadme).toEqual(MVP.map(({ id, nazwa }) => ({ id, nazwa })));
  });

  test('liczba funkcji podana w README jest liczbą MVP z kontraktu', () => {
    const podana = README.match(/(\d+) funkcji/);
    expect(podana).not.toBeNull();
    expect(Number(podana![1])).toBe(MVP.length);
  });

  test('README nie wymienia funkcji spoza zakresu 1.0 (PÓŹNIEJ, NIE, TEST) po identyfikatorze', () => {
    const poza = funkcje().filter((f) => f.decyzja !== 'MVP').map((f) => f.id);
    expect(poza.length).toBeGreaterThan(0);
    for (const id of poza) expect(README).not.toMatch(new RegExp(`\\b${id}\\b`));
  });
});

describe('README.md: platformy, linki, komendy', () => {
  test('platformy: iPhone, iPad, Apple Watch zgodnie z konfiguracją (supportsTablet, cel zegarka), wersje systemów z konfiguracji', () => {
    const app = JSON.parse(czytaj('app.json')).expo;
    expect(app.ios.supportsTablet).toBe(true);
    const zegarek = czytaj('targets/watch/expo-target.config.js');
    expect(zegarek).toMatch(/type: 'watch'/);
    const ios = app.ios.deploymentTarget as string;
    const watchos = zegarek.match(/deploymentTarget: '([\d.]+)'/)![1];
    expect(README).toMatch(/dla iPhone, iPad i Apple Watch/);
    expect(README).toContain(`iOS ${ios}`);
    expect(README).toContain(`watchOS ${watchos}`);
    expect(README).not.toMatch(/\bAndroid\b/i);
  });

  test('linki do polityki prywatności i wsparcia: adresy z adres-strony.json i z aplikacji', () => {
    const strona = JSON.parse(czytaj('docs/wydanie/adres-strony.json'));
    expect(ADRESY.polityka).toBe(strona.baza + strona.polityka);
    expect(README).toContain(`(${strona.baza}${strona.polityka})`);
    expect(README).toContain(`(${strona.baza}${strona.wsparcie})`);
  });

  test('sekcja dla deweloperów: komendy z CLAUDE.md istnieją w package.json i są w README; odsyłacze do docs/ prowadzą do istniejących plików', () => {
    const skrypty = JSON.parse(czytaj('package.json')).scripts as Record<string, string>;
    const komendy = ['npm ci', 'npm test', 'npm run verify', 'npm run typecheck', 'npm run lint', 'npm run jakosc:kontrole'];
    for (const k of komendy) {
      expect(README).toContain(`\`${k}\``);
      if (k.startsWith('npm run ')) expect(skrypty[k.slice('npm run '.length)]).toBeDefined();
      expect(czytaj('CLAUDE.md')).toContain(k);
    }
    const odsylacze = [...README.matchAll(/\]\((docs\/[^)#\s]+)/g)].map((m) => m[1]);
    expect(odsylacze.length).toBeGreaterThan(2);
    for (const o of odsylacze) expect({ o, istnieje: (() => { try { readFileSync(join(root, o)); return true; } catch { return false; } })() }).toEqual({ o, istnieje: true });
  });
});

describe('README.md: bez odznak, bez liczb testów, bez znaków towarowych osób trzecich', () => {
  test('bez odznak i obrazów z zewnątrz', () => {
    expect(README).not.toMatch(/!\[/);
    expect(README).not.toMatch(/shields\.io|badge\.svg|badgen|<img\b/i);
  });

  test('bez liczb testów, pokrycia i scenariuszy', () => {
    expect(README).not.toMatch(/\d[\d\s.,]*\s*(testów|testy|test\b|przypadków|scenariuszy|asercji)/i);
    expect(README).not.toMatch(/pokrycie|coverage/i);
  });

  test('bez nazw konkurentów i serwisów osób trzecich (nazwy aplikacji i serwisów niszy: skróty marki-skroty.json, P-107; w teście jawnie tylko platformy i serwisy ogólne)', () => {
    const jawne = ['Garmin', 'Android', 'Google', 'Facebook', 'Instagram', 'Pinterest', 'YouTube', 'Etsy', 'Samsung', 'Strava', 'Fitbit', 'Amazon', 'TikTok', 'WhatsApp'];
    for (const n of jawne) expect({ n, trafienie: new RegExp(`\\b${n}\\b`, 'i').test(README) }).toEqual({ n, trafienie: false });
    const kod = `import { wczytajSkroty, trafienia } from ${JSON.stringify(join(root, 'scripts/jakosc/marki.mjs'))};
      import { readFileSync } from 'node:fs';
      console.log(trafienia(readFileSync(${JSON.stringify(join(root, 'README.md'))}, 'utf8'), wczytajSkroty(${JSON.stringify(root)})));`;
    const wyn = spawnSync(process.execPath, ['--input-type=module', '-e', kod], { encoding: 'utf8' });
    expect(wyn.status).toBe(0);
    expect(wyn.stdout.trim()).toBe('0');
  });

  test('znaki Apple tylko opisowo: bez odmiany i liczby mnogiej, nie jako część nazwy produktu; stopka nazywa właściciela znaków', () => {
    const znaki = ['iPhone', 'iPad', 'Apple Watch', 'Apple Pencil', 'iCloud', 'App Store'];
    for (const z of znaki) {
      // Znak bezpośrednio przed końcówką fleksyjną albo apostrofem (np. „iPhone’a”, „iPadem”) to odmiana zakazana przez wytyczne Apple.
      expect({ z, odmiana: new RegExp(`${z}(?=[’'a-ząćęłńóśźż])`).test(README) }).toEqual({ z, odmiana: false });
      expect({ z, mnoga: new RegExp(`${z}s\\b`).test(README) }).toEqual({ z, mnoga: false });
    }
    expect(README).toMatch(/^# Oczko$/m);
    expect(README).toMatch(/znakami towarowymi Apple Inc\./);
  });

  test('bez superlatyw i wykrzykników (ton: opis, nie reklama)', () => {
    expect(README).not.toMatch(/!(?!\[)/);
    expect(README).not.toMatch(/\b(najlepsz\w*|rewolucyjn\w*|niesamowit\w*|idealn\w*|wyjątkow\w*|najprostsz\w*)\b/i);
  });
});
