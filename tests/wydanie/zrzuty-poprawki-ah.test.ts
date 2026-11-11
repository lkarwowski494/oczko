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
