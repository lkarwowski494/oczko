/* 10-wydanie-019 (sesja AN, 2026-11-11, KO-043; recenzja AM): kadr 04 miał licznik „2” przy jednym widocznym zakreśleniu, a nic w jobie „komplet” tego nie wychwyciło
 * (licznik z interfejsu nie mówi o widoczności pociągnięcia). Stała kontrola pikseli: w każdym zestawie klasa/język kadr 04 ma więcej żółtych pasów zakreślenia niż kadr 03.
 * Logika (scripts/ci/kontrola-zakreslen.mjs) jest czystą funkcją na buforze RGB; test na sztucznych buforach biegnie zawsze, a na plikach PNG — z ImageMagickiem
 * (jak ramki-sklepu.test.ts: bez `convert` pominięcie GŁOŚNE, a przy OCZKO_WYMAGAJ_IMAGEMAGICK=1 brak = porażka). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const SKRYPT = path.join(korzen, 'scripts/ci/kontrola-zakreslen.mjs');
const maConvert = spawnSync('convert', ['-version']).status === 0;
const wymagaConvert = !['', '0', 'false'].includes((process.env.OCZKO_WYMAGAJ_IMAGEMAGICK ?? '').toLowerCase());

// Skrypty ESM (.mjs) działają w tym repo w procesie potomnym (jak scripts/asc/*.mjs w asc-metadane.test.ts): Jest tu nie ma modułów ESM.
const POTOMNY = `import { readFileSync } from 'node:fs'; const m = await import(process.env.SKRYPT_PATH); // ścieżka w env, nie w argv[1]: moduł rozpoznałby się jako uruchomiony z linii poleceń
try { process.stdout.write(String(m.liczPasy(readFileSync(0), Number(process.argv[1]), Number(process.argv[2])))); } catch (e) { process.stderr.write(e instanceof Error ? e.message : String(e)); process.exit(3); }`;
function liczPasy(rgb: Buffer, w: number, h: number): number {
  const r = spawnSync('node', ['--input-type=module', '-e', POTOMNY, String(w), String(h)], { input: rgb, encoding: 'utf8', cwd: korzen, env: { ...process.env, SKRYPT_PATH: SKRYPT } });
  if (r.status !== 0) throw new Error(r.stderr);
  return Number(r.stdout);
}
const wczytaj = async (): Promise<{ liczPasy: typeof liczPasy }> => ({ liczPasy });

const W = 200; const H = 300;
const ZOLTY: [number, number, number] = [248, 232, 123]; // zakreślacz na białym (zmierzone w przebiegu 43070136577: 248,232,123 i 250,237,152)
function obraz(rysuj: (ustaw: (x: number, y: number, k: [number, number, number]) => void) => void, tlo: [number, number, number] = [255, 255, 255]): Buffer {
  const b = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) { b[i * 3] = tlo[0]; b[i * 3 + 1] = tlo[1]; b[i * 3 + 2] = tlo[2]; }
  rysuj((x, y, k) => { const i = (y * W + x) * 3; b[i] = k[0]; b[i + 1] = k[1]; b[i + 2] = k[2]; });
  return b;
}
const pas = (ustaw: (x: number, y: number, k: [number, number, number]) => void, y0: number, y1: number, x0 = 40, x1 = 160) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) ustaw(x, y, ZOLTY);
};

describe('10-wydanie-019: liczPasy — żółte pasy zakreślenia w obrazie RGB', () => {
  test('pusta strona = 0, jeden pas = 1, dwa pasy rozdzielone białym wierszem = 2, trzy = 3', async () => {
    const { liczPasy } = await wczytaj();
    expect(liczPasy(obraz(() => undefined), W, H)).toBe(0);
    expect(liczPasy(obraz((u) => pas(u, 50, 62)), W, H)).toBe(1);
    expect(liczPasy(obraz((u) => { pas(u, 50, 62); pas(u, 120, 132); }), W, H)).toBe(2);
    expect(liczPasy(obraz((u) => { pas(u, 50, 62); pas(u, 120, 132); pas(u, 200, 212); }), W, H)).toBe(3);
  });
  test('pas z tekstem (czarne piksele w co trzecim wierszu pasa) nadal jest jednym pasem', async () => {
    const { liczPasy } = await wczytaj();
    const rys = obraz((u) => { pas(u, 50, 64); for (let y = 52; y < 64; y += 3) for (let x = 45; x < 150; x += 2) u(x, y, [0, 0, 0]); });
    expect(liczPasy(rys, W, H)).toBe(1);
  });
  test('nie liczy: beżowe tło interfejsu, pomarańczowy przycisk, cienką linię (1 wiersz) i wąską plamkę (< 20% szerokości)', async () => {
    const { liczPasy } = await wczytaj();
    expect(liczPasy(obraz(() => undefined, [238, 235, 230]), W, H)).toBe(0);
    expect(liczPasy(obraz((u) => { for (let y = 50; y < 70; y++) for (let x = 40; x < 160; x++) u(x, y, [192, 132, 37]); }), W, H)).toBe(0);
    expect(liczPasy(obraz((u) => pas(u, 50, 51)), W, H)).toBe(0);
    expect(liczPasy(obraz((u) => pas(u, 50, 62, 40, 60)), W, H)).toBe(0);
  });
  test('rozmiar bufora niezgodny z wymiarami = błąd, nie zgadnięty wynik', async () => {
    const { liczPasy } = await wczytaj();
    expect(() => liczPasy(Buffer.alloc(10), W, H)).toThrow(/rozmiar/i);
  });
});

if (!maConvert && wymagaConvert) {
  describe('kontrola-zakreslen.mjs: ImageMagick wymagany', () => {
    test('`convert` jest dostępny', () => { throw new Error('brak ImageMagick (`convert`) przy OCZKO_WYMAGAJ_IMAGEMAGICK: kontrola na plikach PNG nie biegnie'); });
  });
}
if (!maConvert && !wymagaConvert) {
  test('kontrola-zakreslen.mjs na plikach PNG POMINIĘTA: brak ImageMagick (`convert`); biegnie w zadaniu „komplet” zrzuty-sklepu.yml', () => {
    process.stderr.write('::warning::kontrola-zakreslen: część na plikach PNG pominięta, brak convert\n');
  });
}
(maConvert ? describe : describe.skip)('kontrola-zakreslen.mjs na plikach PNG (ImageMagick)', () => {
  let kat = '';
  beforeEach(() => { kat = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-zakr-')); });
  afterEach(() => { fs.rmSync(kat, { recursive: true, force: true }); });
  /** Sztuczny „zrzut” 600×900 z `n` żółtymi pasami (RGB, bez alfy). */
  function zrzut(rel: string, n: number): string {
    const p = path.join(kat, rel); fs.mkdirSync(path.dirname(p), { recursive: true });
    const draw = Array.from({ length: n }, (_, i) => `rectangle 120,${200 + i * 160} 480,${230 + i * 160}`).join(' ');
    const args = ['-size', '600x900', 'xc:white', '-fill', 'rgb(248,232,123)', ...(n ? ['-draw', draw] : []), '-alpha', 'off', '-depth', '8', '-define', 'png:color-type=2', p];
    expect(spawnSync('convert', args).status).toBe(0);
    return p;
  }
  const uruchom = () => spawnSync('node', [SKRYPT, kat], { encoding: 'utf8', cwd: korzen });

  test('04 ma więcej pasów niż 03 (iPad i iPhone, en i pl, układ warunek-og07 i bezpośredni) → OK, kod 0', () => {
    for (const [k, j] of [['ipad-13', 'en'], ['ipad-13', 'pl'], ['6.9', 'en']] as const) { zrzut(`warunek-og07/${k}/${j}/03-wzor.png`, 1); zrzut(`warunek-og07/${k}/${j}/04-zakreslenie.png`, 2); }
    zrzut('6.9/pl/03-wzor.png', 1); zrzut('6.9/pl/04-zakreslenie.png', 3);
    const r = uruchom();
    expect(r.stdout).toContain('OK ipad-13/en: 03=1, 04=2');
    expect(r.stdout).toContain('OK 6.9/pl: 03=1, 04=3');
    expect(r.status).toBe(0);
  });
  test('04 tak samo jak 03 (jedno zakreślenie widoczne przy liczniku 2) → BŁĄD z nazwą pliku 04, kod 1; pozostałe pary nadal sprawdzone', () => {
    zrzut('warunek-og07/ipad-13/en/03-wzor.png', 1); zrzut('warunek-og07/ipad-13/en/04-zakreslenie.png', 1);
    zrzut('warunek-og07/6.9/en/03-wzor.png', 1); zrzut('warunek-og07/6.9/en/04-zakreslenie.png', 2);
    const r = uruchom();
    expect(r.stdout).toMatch(/BŁĄD [^\n]*warunek-og07\/ipad-13\/en\/04-zakreslenie\.png[^\n]*04=1[^\n]*03=1/);
    expect(r.stdout).toContain('OK 6.9/en: 03=1, 04=2');
    expect(r.status).toBe(1);
  });
  test('04 z mniejszą liczbą pasów niż 03 → BŁĄD; plik nie-PNG → BŁĄD z nazwą pliku (nie ciche pominięcie)', () => {
    zrzut('ipad-13/en/03-wzor.png', 2); zrzut('ipad-13/en/04-zakreslenie.png', 1);
    fs.mkdirSync(path.join(kat, '6.9/en'), { recursive: true });
    zrzut('6.9/en/03-wzor.png', 1); fs.writeFileSync(path.join(kat, '6.9/en/04-zakreslenie.png'), 'to nie jest obraz');
    const r = uruchom();
    expect(r.stdout).toMatch(/BŁĄD [^\n]*ipad-13\/en\/04-zakreslenie\.png/);
    expect(r.stdout).toMatch(/BŁĄD [^\n]*6\.9\/en\/04-zakreslenie\.png/);
    expect(r.status).toBe(1);
  });
  test('brak jednej ze scen pary (komplet-zrzutow.mjs zgłasza to osobno) → pominięcie z komunikatem, bez błędu tej kontroli; brak par w ogóle → kod 0 z notatką', () => {
    zrzut('ipad-13/en/03-wzor.png', 1);
    let r = uruchom();
    expect(r.stdout).toMatch(/POMINIĘTO ipad-13\/en/);
    expect(r.status).toBe(0);
    r = spawnSync('node', [SKRYPT, path.join(kat, 'nie-ma')], { encoding: 'utf8', cwd: korzen });
    expect(r.stdout).toMatch(/brak par/i);
    expect(r.status).toBe(0);
  });
});

describe('10-wydanie-019: kontrola w jobie „komplet” zrzuty-sklepu.yml', () => {
  const yml = fs.readFileSync(path.join(korzen, '.github/workflows/zrzuty-sklepu.yml'), 'utf8');
  test('krok „Komplet zrzutów i wymiary” woła kontrola-zakreslen.mjs na katalogu surowych, a porażka ustawia bledy=1 (czerwony job)', () => {
    expect(yml).toMatch(/node scripts\/ci\/kontrola-zakreslen\.mjs sklep-zrzuty-surowe \| tee -a "\$GITHUB_STEP_SUMMARY" \|\| bledy=1/);
  });
  test('kontrola biegnie po instalacji ImageMagicka i test jej logiki biegnie z OCZKO_WYMAGAJ_IMAGEMAGICK=1 w kroku testów ramek', () => {
    expect(yml.indexOf('zainstaluj-narzedzia-zrzutow.sh')).toBeLessThan(yml.indexOf('kontrola-zakreslen.mjs sklep-zrzuty-surowe'));
    expect(yml).toMatch(/npx jest tests\/wydanie\/ramki-sklepu\.test\.ts tests\/wydanie\/kontrola-zakreslen\.test\.ts --ci --runInBand/);
  });
});
