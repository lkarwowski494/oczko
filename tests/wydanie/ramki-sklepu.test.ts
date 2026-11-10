/* Ramki i podpisy na zrzutach sklepu (scripts/ci/ramki-sklepu.sh, scripts/ci/wymiary-asc.mjs; rola 10-wydanie, KO-032, 2026-11-10).
 * Wzór: trening:scripts/ci/store-frames.sh. Test uruchamia skrypt naprawdę na sztucznych PNG w wymiarach ASC (ImageMagick; bez niego część „działa” jest pominięta lokalnie, w CI brak = porażka). Dlaczego: ramki wychodzą z macierzy macOS po godzinach, a błąd w skrypcie widać dopiero w artefakcie. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const SKRYPT = path.join(korzen, 'scripts/ci/ramki-sklepu.sh');
const WYMIARY = path.join(korzen, 'scripts/ci/wymiary-asc.mjs');
const jest = (cmd: string, args: string[]) => spawnSync(cmd, args, { encoding: 'utf8', cwd: korzen }).status === 0;
const maConvert = jest('convert', ['-version']);

describe('ramki-sklepu.sh: kontrakt (statycznie)', () => {
  const sh = fs.existsSync(SKRYPT) ? fs.readFileSync(SKRYPT, 'utf8') : '';
  test('istnieje i używa planu układu (label + pointsize), nie samodopasowującego się caption:', () => {
    expect(sh).not.toBe('');
    expect(sh).toContain('scripts/ci/uklad-podpisow.mjs');
    expect(sh).toMatch(/-pointsize "\$PT" label:"\$text"/);
    expect(sh).not.toMatch(/caption:"\$text"/);
  });
  test('kolory z docs/design/tokeny.json przez plik podpisów (bez wpisanych na sztywno barw), obraz bez alfy', () => {
    expect(sh).toContain('docs/design/tokeny.json');
    expect(sh).not.toMatch(/#[0-9A-Fa-f]{6}/);
    expect(sh).toMatch(/-alpha off/);
  });
  test('bez obudów urządzeń Apple (ramka własna) i obwódka z tokenu', () => {
    expect(sh).toMatch(/roundrectangle/);
    expect(sh).not.toMatch(/bezel|obudow[ay] Apple\.png/i);
  });
});

// 10-wydanie-003: w CI brak ImageMagicka to porażka z komunikatem, nie ciche pominięcie (zasada wspólna 21); lokalnie pominięcie zostaje (test: ramki-imagemagick-ci.test.ts).
const wCi = !!process.env.CI && !['', '0', 'false'].includes(process.env.CI.toLowerCase());
if (!maConvert && wCi) {
  describe('ramki-sklepu.sh: ImageMagick w CI', () => {
    test('`convert` jest dostępny (bez niego kontrola ramek nie biegnie: zainstaluj imagemagick w kroku CI)', () => {
      throw new Error('brak ImageMagick (`convert`) na maszynie CI: część „działa na PNG w wymiarach App Store Connect” nie zostałaby uruchomiona; zainstaluj pakiet imagemagick w workflow');
    });
  });
}
(maConvert ? describe : describe.skip)('ramki-sklepu.sh: działa na PNG w wymiarach App Store Connect', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ramki-'));
  const we = path.join(tmp, 'we'); const wy = path.join(tmp, 'wy');
  const sztuczny = (rel: string, w: number, h: number) => {
    const p = path.join(we, rel); fs.mkdirSync(path.dirname(p), { recursive: true });
    expect(jest('convert', ['-size', `${w}x${h}`, 'gradient:#E6E1DA-#C08425', '-alpha', 'off', p])).toBe(true);
  };
  const wymiar = (p: string) => spawnSync('identify', ['-format', '%wx%h %[channels]', p], { encoding: 'utf8' }).stdout.trim();
  let wynik: ReturnType<typeof spawnSync>;
  beforeAll(() => {
    sztuczny('6.9/en/01-dzis.png', 1320, 2868);
    sztuczny('6.9/en/02-licznik.png', 1320, 2868);
    sztuczny('6.9/pl/06-historia.png', 1320, 2868);
    sztuczny('6.9/de/01-dzis.png', 1320, 2868); // język bez podpisów → pominięty
    sztuczny('ipad-13/en/05-projekty.png', 2064, 2752);
    sztuczny('warunek-og07/ipad-13/en/03-wzor.png', 2752, 2064); // poziomo, katalog warunkowy
    wynik = spawnSync('bash', [SKRYPT, we, wy], { encoding: 'utf8', cwd: korzen, timeout: 240000 });
  }, 300000);
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  test('kod wyjścia 0; ostrzeżenie o języku bez podpisów', () => {
    expect(wynik.status).toBe(0);
    expect(String(wynik.stdout)).toMatch(/Ramki: 5 plików/);
    expect(String(wynik.stdout)).toMatch(/Brak podpisów dla języka de/);
  });
  test('wymiary wyjścia = wymiary wejścia, RGB bez alfy, układ katalogów zachowany (także warunek-og07)', () => {
    expect(wymiar(path.join(wy, '6.9/en/01-dzis.png'))).toMatch(/^1320x2868 srgb$/);
    expect(wymiar(path.join(wy, 'ipad-13/en/05-projekty.png'))).toMatch(/^2064x2752 srgb$/);
    expect(wymiar(path.join(wy, 'warunek-og07/ipad-13/en/03-wzor.png'))).toMatch(/^2752x2064 srgb$/);
    expect(fs.existsSync(path.join(wy, '6.9/de/01-dzis.png'))).toBe(false);
  });
  test('wymiary-asc.mjs: wynik zgodny z App Store Connect (kod 0); zła klasa i alfa wykrywane (kod 1)', () => {
    expect(jest('node', [WYMIARY, wy])).toBe(true);
    const zly = path.join(tmp, 'zly/6.9/en'); fs.mkdirSync(zly, { recursive: true });
    expect(jest('convert', ['-size', '1000x2000', 'xc:red', path.join(zly, '01-dzis.png')])).toBe(true);
    expect(jest('node', [WYMIARY, path.join(tmp, 'zly')])).toBe(false);
    const alfa = path.join(tmp, 'alfa/6.9/en'); fs.mkdirSync(alfa, { recursive: true });
    expect(jest('convert', ['-size', '1320x2868', 'xc:none', path.join(alfa, '01-dzis.png')])).toBe(true);
    expect(jest('node', [WYMIARY, path.join(tmp, 'alfa')])).toBe(false);
  });
  test('podpis jest narysowany: obraz różni się od surowego zrzutu w pasie podpisu', () => {
    const roznica = spawnSync('compare', ['-metric', 'AE', '-extract', '1000x400+160+80', path.join(we, '6.9/en/01-dzis.png'), path.join(wy, '6.9/en/01-dzis.png'), 'null:'], { encoding: 'utf8' });
    expect(Number(String(roznica.stderr).split(' ')[0])).toBeGreaterThan(1000);
  });
});
