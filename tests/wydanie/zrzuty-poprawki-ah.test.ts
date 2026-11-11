/* Poprawki zrzutów sklepu po odbiorze C1 (10-wydanie-012…017; sesja AH, 2026-11-11, KO-036).
 * Test uruchamia skrypty naprawdę (ImageMagick `convert` do przygotowania wejścia; bez niego części z obrazami są pominięte głośno, jak w ramki-sklepu.test.ts).
 * Dlaczego: zrzuty wychodzą z macierzy macOS po godzinach, a błąd widać dopiero w artefakcie. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(korzen, p), 'utf8');
const uruchom = (cmd: string, args: string[]) => spawnSync(cmd, args, { encoding: 'utf8', cwd: korzen });
const maConvert = uruchom('convert', ['-version']).status === 0;
const ZMIENNA = 'OCZKO_WYMAGAJ_IMAGEMAGICK';
const wymagaConvert = !['', '0', 'false'].includes((process.env[ZMIENNA] ?? '').toLowerCase());
const opisObrazy = maConvert ? describe : (() => { if (wymagaConvert) throw new Error(`brak ImageMagick przy ${ZMIENNA}`); console.warn('POMINIĘTE: testy AH na obrazach (brak ImageMagick)'); return describe.skip; })();

opisObrazy('10-wydanie-017: spłaszczenie kanału alfa i kontrola pliku zakupu', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ah017-'));
  const rgba = path.join(tmp, '99-zakup-ceny.png');
  beforeAll(() => { expect(uruchom('convert', ['-size', '1320x2868', 'gradient:#E6E1DA-#C08425', '-alpha', 'on', '-depth', '8', '-define', 'png:color-type=6', rgba]).status).toBe(0); });
  test('wejście testowe ma kanał alfa (RGBA), więc kontrola pliku go wykrywa (kod 1)', () => {
    expect(uruchom('identify', ['-format', '%[channels]', rgba]).stdout).toMatch(/rgba/i);
    const r = uruchom('node', ['scripts/ci/wymiary-asc.mjs', '--plik', rgba]);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/alfa/);
  });
  test('splaszcz-png.mjs: wynik RGB bez alfy, te same wymiary i piksele; kontrola pliku daje kod 0', () => {
    const wy = path.join(tmp, 'rgb.png');
    const s = uruchom('node', ['scripts/ci/splaszcz-png.mjs', rgba, wy]);
    expect(s.status).toBe(0);
    expect(uruchom('identify', ['-format', '%wx%h %[channels]', wy]).stdout).toMatch(/^1320x2868 srgb$/i);
    const a = uruchom('convert', [rgba, '-alpha', 'off', '-format', '%#', 'info:']).stdout;
    const b = uruchom('convert', [wy, '-format', '%#', 'info:']).stdout;
    expect(b).toBe(a);
    expect(uruchom('node', ['scripts/ci/wymiary-asc.mjs', '--plik', wy]).status).toBe(0);
  });
  test('kontrola pliku: zły wymiar → kod 1', () => {
    const maly = path.join(tmp, 'maly.png');
    uruchom('convert', ['-size', '100x100', 'xc:white', '-alpha', 'off', '-define', 'png:color-type=2', maly]);
    const r = uruchom('node', ['scripts/ci/wymiary-asc.mjs', '--plik', maly]);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/wymiar 100×100/);
  });
  test('zrzuty-sklepu.sh spłaszcza i kontroluje zrzut zakupu przed zapisem (jeden raz, w skrypcie wywoływanym przez workflow)', () => {
    const sh = czytaj('scripts/ci/zrzuty-sklepu.sh');
    expect(sh).toMatch(/\$SKRYPTY\/splaszcz-png\.mjs/);
    expect(sh).toMatch(/wymiary-asc\.mjs" --plik/);
    expect(sh).toMatch(/SKRYPTY=.*scripts\/ci|SKRYPTY="\$\(cd "\$\(dirname "\$0"\)"/);
  });
});

opisObrazy('10-wydanie-012: ramka iPada nie ucina paska stanu w narożnikach', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ah012-'));
  const we = path.join(tmp, 'we'); const wy = path.join(tmp, 'wy');
  // Pasek stanu iPada (pionowo i poziomo): czas z lewej i bateria z prawej zaczynają się ok. 40 px od krawędzi i 14 px od góry zrzutu (wymiary z run 42992359897: „9” przy ramce w pionie, w poziomie widać tylko „41 AM”).
  // Biały znacznik 6×6 px w tym miejscu na czarnym zrzucie: po nałożeniu ramki ma zostać biały (a nie kolor obwódki albo tła).
  const ZNACZNIKI: Array<[number, number]> = [[40, 14], [-41, 14]]; // ujemne x liczone od prawej krawędzi
  const KLASY: Array<[string, number, number]> = [['ipad-13/en/01-dzis.png', 2064, 2752], ['ipad-13/en/03-wzor.png', 2752, 2064]];
  beforeAll(() => {
    for (const [rel, w, h] of KLASY) {
      const p = path.join(we, rel); fs.mkdirSync(path.dirname(p), { recursive: true });
      const rys = ZNACZNIKI.map(([x, y]) => { const x0 = x < 0 ? w + x : x; return `rectangle ${x0},${y} ${x0 + 5},${y + 5}`; }).join(' ');
      expect(uruchom('convert', ['-size', `${w}x${h}`, 'xc:black', '-fill', 'white', '-draw', rys, '-alpha', 'off', p]).status).toBe(0);
    }
    expect(uruchom('bash', ['scripts/ci/ramki-sklepu.sh', we, wy]).status).toBe(0);
  });
  test.each(KLASY)('%s: znaczniki paska stanu zostają w kadrze (biały piksel po ramce)', (rel, w, h) => {
    const SW = Math.floor(w * 78 / 100); const SH = Math.floor(h * 78 / 100); const X = Math.floor((w - SW) / 2); const TOP = Math.floor(h * 19 / 100);
    for (const [x, y] of ZNACZNIKI) {
      const x0 = x < 0 ? w + x : x;
      const ox = X + Math.floor((x0 + 3) * SW / w); const oy = TOP + Math.floor((y + 3) * SH / h);
      const kolor = uruchom('convert', [path.join(wy, rel), '-format', `%[pixel:p{${ox},${oy}}]`, 'info:']).stdout.trim();
      expect([rel, x, kolor]).toEqual([rel, x, expect.stringMatching(/^(white|srgb\((2[45]\d|25[0-5]),(2[45]\d|25[0-5]),(2[45]\d|25[0-5])\)|#F[0-9A-F]{5})$/i)]);
    }
  });
});

describe('10-wydanie-016: spójna data i godzina w kadrze (jedna stała: zegar fikstury = pasek stanu)', () => {
  const sh = czytaj('scripts/ci/zrzuty-sklepu.sh');
  const KAT = 'e2e/zrzuty-sklepu';
  const sceny = fs.readdirSync(path.join(korzen, KAT)).filter((f) => f.endsWith('.yaml'));
  test('stała ZRZUTY_TERAZ (ISO) jest zdefiniowana raz w skrypcie, trafia do pasku stanu simctl i do scenariuszy przez -e', () => {
    expect(sh.match(/^ZRZUTY_TERAZ="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"/gm)).toHaveLength(1);
    expect(sh).toMatch(/status_bar "\$UDID" override --time "\$ZRZUTY_TERAZ"/);
    expect(sh).toMatch(/-e "ZRZUTY_TERAZ=\$ZRZUTY_TERAZ"/);
    expect(sh).not.toMatch(/--time "9:41"/);
  });
  test('scenariusze nie mają wpisanej na sztywno daty „dziś”: używają ${ZRZUTY_TERAZ}', () => {
    for (const f of sceny) {
      const t = czytaj(`${KAT}/${f}`);
      const kod = t.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
      expect([f, /2026-11-10T09:41/.test(kod)]).toEqual([f, false]);
      if (f !== '00-przygotuj.yaml' && f !== '99-zakup.yaml' && f !== '00-jezyk.yaml') expect([f, kod]).toEqual([f, expect.stringContaining('${ZRZUTY_TERAZ}')]);
    }
  });
  test('fikstura: godziny sesji rosną razem z datą (Historia czyta się chronologicznie), a 9 XI jest dniem pracy (+1), więc „This week” nie jest pusty', () => {
    const t = czytaj(`${KAT}/00-przygotuj.yaml`);
    const czasy = [...t.matchAll(/TERAZ: "(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})"/g)].map((m) => `${m[1]}T${m[2]}`);
    expect(czasy.length).toBeGreaterThanOrEqual(3);
    const dzienna = (z: string) => z.slice(11);
    for (let i = 1; i < czasy.length; i++) { expect(czasy[i] > czasy[i - 1]).toBe(true); expect(dzienna(czasy[i]) > dzienna(czasy[i - 1])).toBe(true); }
    const od9 = t.slice(t.indexOf('2026-11-09T'));
    expect(od9.slice(0, od9.indexOf('licznik-akcja-notatka'))).toMatch(/tapOn: \{ id: "licznik-plus" \}/);
  });
});
