/* ZR8 (rola 10 fix, KO-201, P-1036): dwie wady kadrów 03/04 w sklepie (zgłoszenie właściciela: wydanie 1.0, build 1221, kadry pl 03-wzor i 04-zakreslenie),
 * których kontrola kadrów (scripts/ci/kontrola-zakreslen.mjs) nie widziała:
 *   (a) pas zakreślenia 2 (wiersz 13) bywa cienką kreską zamiast pasa jak pas 1 (wiersz 9) — kontrola `grubosciPasow`;
 *   (b) linia znacznika rzędu „Rząd 21 ↓” leży na tekście wiersza 21 i wygląda jak przekreślenie — kontrola `liniaZnacznika`.
 * Materiał: te same PRAWDZIWE kadry 04-zakreslenie.png co w zakreslenie-polozenie.test.ts (wycinki 500 px, dane/zakreslenie-zr7; skąd pochodzą i jak powstały — nagłówek tamtego testu).
 * Dowód czerwony: ten plik uruchomiony na kontroli sprzed ZR8 → docs/jakosc/zr8-dowod-czerwony.txt. „Dobre” kadry:
 *   - grubość: 19 prawdziwych kadrów z pełnym pasem 2 (stosunek 1,00–1,09);
 *   - znacznik: kadry SYNTETYCZNE (poprawionego znacznika w repo jeszcze nie ma — to wynik przebiegu po poprawce scen): prawdziwy kadr hr/it/pt, w którym dwie linie znacznika
 *     zamazano (białe prostokąty tylko na ich wierszach) i narysowano w przerwie między wierszami 14–20 i 21; wariant ujemny z liniami na tekście musi dalej dawać BŁĄD. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const SKRYPT = path.join(korzen, 'scripts/ci/kontrola-zakreslen.mjs');
const DANE = path.join(__dirname, 'dane', 'zakreslenie-zr7');
const maConvert = spawnSync('convert', ['-version']).status === 0;
const wymagaConvert = !['', '0', 'false'].includes((process.env.OCZKO_WYMAGAJ_IMAGEMAGICK ?? '').toLowerCase());

/** Kadry z cienką kreską zamiast pasa 2 (stosunek 0,30–0,36): pierwszy język każdego zadania i dane en/pl (przebiegi 45021511463, 44758366101). */
export const CIENKIE = ['cs', 'da', 'de', 'el', 'es', 'es-419', 'fi', 'fr', 'en', 'pl'];
export const PELNE = ['hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nb', 'nl', 'pt', 'pt-BR', 'ro', 'ru', 'sk', 'sv', 'tr', 'uk', 'vi', 'zh-Hant'];
const WSZYSTKIE_IPHONE = [...CIENKIE, ...PELNE];

if (!maConvert && wymagaConvert) {
  describe('ZR8: ImageMagick wymagany', () => {
    test('`convert` jest dostępny', () => { throw new Error('brak ImageMagick (`convert`) przy OCZKO_WYMAGAJ_IMAGEMAGICK: kontrola grubości pasa i znacznika na kadrach nie biegnie'); });
  });
}
if (!maConvert && !wymagaConvert) {
  test('ZR8: kontrola grubości pasa i znacznika na kadrach POMINIĘTA: brak ImageMagick (`convert`); biegnie w zadaniu „komplet” zrzuty-sklepu.yml', () => {
    process.stderr.write('::warning::zakreslenie-grubosc-znacznik: pominięte, brak convert\n');
  });
}

const uruchom = (kat: string) => { const r = spawnSync('node', [SKRYPT, kat], { encoding: 'utf8', cwd: korzen }); return { stdout: r.stdout, status: r.status }; };

(maConvert ? describe : describe.skip)('ZR8 (P-1036): grubość pasa 2 i linia znacznika na prawdziwych kadrach 04', () => {
  let kat = '';
  let stdout = ''; let status: number | null = null;
  beforeAll(() => {
    kat = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-grubosc-'));
    fs.cpSync(DANE, kat, { recursive: true, filter: (z) => !z.endsWith('.json') });
    ({ stdout, status } = uruchom(kat));
  });
  afterAll(() => { fs.rmSync(kat, { recursive: true, force: true }); });

  test.each(CIENKIE)('%s: pas 2 to cienka kreska → BŁĄD z nazwą pliku', (j) => {
    expect(stdout).toMatch(new RegExp(`BŁĄD [^\\n]*6\\.9/${j}/04-zakreslenie\\.png: pas 2 ma \\d+ wierszy kadru, pas 1 \\d+ \\(0\\.\\d+`));
    expect(stdout).not.toMatch(new RegExp(`GRUBOŚĆ OK 6\\.9/${j}:`));
  });
  test.each(PELNE)('%s: pas 2 pełny jak pas 1 → GRUBOŚĆ OK, bez błędu grubości', (j) => {
    expect(stdout).toMatch(new RegExp(`GRUBOŚĆ OK 6\\.9/${j}: pas 2 / pas 1 = \\d+/\\d+`));
    expect(stdout).not.toMatch(new RegExp(`BŁĄD [^\\n]*6\\.9/${j}/04-zakreslenie\\.png: pas 2 ma `));
  });
  test.each(['en', 'pl'])('iPad 13″ %s: pas 2 to cienka kreska → BŁĄD', (j) => {
    expect(stdout).toMatch(new RegExp(`BŁĄD [^\\n]*ipad-13/${j}/04-zakreslenie\\.png: pas 2 ma `));
  });
  test.each(WSZYSTKIE_IPHONE)('%s: dolna linia znacznika leży na tekście wiersza 21 → BŁĄD z nazwą pliku', (j) => {
    expect(stdout).toMatch(new RegExp(`BŁĄD [^\\n]*6\\.9/${j}/04-zakreslenie\\.png: linia znacznika \\(wiersze kadru [\\d, ]+\\) leży na tekście wiersza`));
    expect(stdout).not.toMatch(new RegExp(`ZNACZNIK OK 6\\.9/${j}/`));
  });
  test('kod wyjścia 1; błędów grubości jest dokładnie tyle, ile kadrów z cienką kreską (10 iPhone + 2 iPad), a błędów znacznika tyle, ile kadrów iPhone (29)', () => {
    expect(status).toBe(1);
    expect((stdout.match(/^BŁĄD [^\n]*: pas 2 ma \d+ wierszy kadru/gm) ?? []).length).toBe(CIENKIE.length + 2);
    expect((stdout.match(/^BŁĄD [^\n]*: linia znacznika /gm) ?? []).length).toBe(WSZYSTKIE_IPHONE.length);
  });
});

/* Kadry syntetyczne: kadr „it” (pas 2 pełny, na wierszu 13; linie znacznika w wierszach 172–173 i 183–184 kadru 500 px; wiersz 14–20 kończy się ok. 153, wiersz 21 zaczyna ok. 175). */
(maConvert ? describe : describe.skip)('ZR8 (P-1036): znacznik w przerwie między wierszami — kadr syntetyczny z prawdziwego', () => {
  let kat = '';
  const zrodlo = path.join(DANE, '6.9', 'it', '04-zakreslenie.png');
  const zrob = (nazwa: string, nowe: [number, number][]) => {
    const wyj = path.join(kat, '6.9', nazwa); fs.mkdirSync(wyj, { recursive: true });
    const arg = [zrodlo, '-fill', 'white', '-stroke', 'none', '-draw', 'rectangle 0,172 499,173', '-draw', 'rectangle 0,183 499,184', '-fill', 'black'];
    for (const [a, b] of nowe) arg.push('-draw', `rectangle 0,${a} 499,${b}`);
    arg.push('-alpha', 'off', '-depth', '8', '-strip', path.join(wyj, '04-zakreslenie.png'));
    const r = spawnSync('convert', arg, { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`convert: ${r.stderr}`);
  };
  beforeAll(() => {
    kat = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-znacznik-'));
    zrob('w-przerwie', [[158, 159], [169, 170]]);   // obie linie w przerwie 154–174 (odstęp 11 wierszy jak w oryginale)
    zrob('na-tekscie', [[178, 179], [189, 190]]);   // linie w wierszu 21 (175–185) i tuż pod nim
    zrob('dolna-na-tekscie', [[158, 159], [180, 181]]); // górna w przerwie, dolna na tekście wiersza 21
  });
  afterAll(() => { fs.rmSync(kat, { recursive: true, force: true }); });

  test('linie w przerwie między wierszami → ZNACZNIK OK, bez BŁĘDU znacznika', () => {
    const { stdout } = uruchom(kat);
    expect(stdout).toMatch(/ZNACZNIK OK 6\.9\/w-przerwie\/04-zakreslenie\.png: linie [\d,]+ poza tekstem wierszy/);
    expect(stdout).not.toMatch(/BŁĄD [^\n]*w-przerwie[^\n]*linia znacznika/);
  });
  test('linia na tekście wiersza → BŁĄD (kontrola nie przepuszcza poprawionego położenia z tekstem pod linią)', () => {
    const { stdout, status } = uruchom(kat);
    expect(status).toBe(1);
    expect(stdout).toMatch(/BŁĄD [^\n]*na-tekscie\/04-zakreslenie\.png: linia znacznika/);
    expect(stdout).toMatch(/BŁĄD [^\n]*dolna-na-tekscie\/04-zakreslenie\.png: linia znacznika/);
  });
  test('kadr poprawiony ma jednocześnie pas 2 pełny i położenie na wierszu 13 (jedyną różnicą względem „it” jest znacznik)', () => {
    const { stdout } = uruchom(kat);
    expect(stdout).toMatch(/GRUBOŚĆ OK 6\.9\/w-przerwie:/);
    expect(stdout).toMatch(/POŁOŻENIE OK 6\.9\/w-przerwie:/);
  });
});
