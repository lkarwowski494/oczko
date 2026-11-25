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
  // ZR5 (KO-187, P-1004): kalibracja barwy po przebiegu 44722734741 — pas wiersza 9 na iPadzie ma barwę (252,245,194–196), a stara reguła (b ≤ 190, r−b ≥ 50) go odrzucała.
  const pasKolor = (k: [number, number, number], y0 = 50, y1 = 62) => (u: (x: number, y: number, k: [number, number, number]) => void) => {
    for (let y = y0; y < y1; y++) for (let x = 40; x < 160; x++) u(x, y, k);
  };
  test('ZR5: barwa pasa z przebiegu 44722734741 (252,245,195) i jej zmierzone krańce (252,245,194/196) są zakreśleniem', async () => {
    const { liczPasy } = await wczytaj();
    for (const k of [[252, 245, 195], [252, 245, 194], [252, 245, 196]] as [number, number, number][]) expect(liczPasy(obraz(pasKolor(k)), W, H)).toBe(1);
  });
  test('ZR5: dotychczasowe zmierzone barwy pasa (248,232,123; 250,237,152) nadal są zakreśleniem', async () => {
    const { liczPasy } = await wczytaj();
    for (const k of [[248, 232, 123], [250, 237, 152]] as [number, number, number][]) expect(liczPasy(obraz(pasKolor(k)), W, H)).toBe(1);
  });
  test('ZR5: granice reguły — b = 206 albo r−b = 39 nie jest zakreśleniem; r−b = 40 i b = 205 jest', async () => {
    const { liczPasy } = await wczytaj();
    expect(liczPasy(obraz(pasKolor([252, 245, 206])), W, H)).toBe(0); // b > 205
    expect(liczPasy(obraz(pasKolor([240, 230, 201])), W, H)).toBe(0); // r−b = 39, b ≤ 205
    expect(liczPasy(obraz(pasKolor([240, 230, 200])), W, H)).toBe(1); // r−b = 40: granica włączona
    expect(liczPasy(obraz(pasKolor([252, 245, 205])), W, H)).toBe(1); // b = 205: granica włączona
  });
  // P-1005 (KO-188): g ≥ 225. Beż elementu strony Dziś (kadr 01, g 219–224 w przebiegu 44722734741) nie jest zakreśleniem.
  test('P-1005: beż strony Dziś (240,221,182) i jego odcienie z kadru 01 (239,220,181; 239,219,178) nie są zakreśleniem, także jako pełny pas', async () => {
    const { liczPasy } = await wczytaj();
    for (const k of [[240, 221, 182], [239, 220, 181], [239, 219, 178], [239, 219, 177]] as [number, number, number][]) expect(liczPasy(obraz(pasKolor(k)), W, H)).toBe(0);
  });
  test('P-1005: granica g — 224 nie jest zakreśleniem, 225 jest (ryzyko jawne: nominalny #F6E04A ma g = 224; zmierzone pasy mają g ≥ 232)', async () => {
    const { liczPasy } = await wczytaj();
    expect(liczPasy(obraz(pasKolor([246, 224, 74])), W, H)).toBe(0);
    expect(liczPasy(obraz(pasKolor([246, 225, 74])), W, H)).toBe(1);
  });
  // P-1005: próg wiersza 15% szerokości (było 20%). Przy W = 200 próg to ceil(200·0,15) = 30 px; w kadrze ze sklepu pas z tekstem ma w wierszach z tekstem 70–110 z 500 px.
  test('P-1005: próg wiersza — pas szeroki na 30 px z 200 (15%) jest pasem, na 29 px nie; pas z tekstem zabierającym połowę pikseli nadal jest pasem', async () => {
    const { liczPasy } = await wczytaj();
    expect(liczPasy(obraz((u) => pas(u, 50, 62, 40, 70)), W, H)).toBe(1); // 30 px = 15%
    expect(liczPasy(obraz((u) => pas(u, 50, 62, 40, 69)), W, H)).toBe(0); // 29 px < 15%
    const zTekstem = obraz((u) => { pas(u, 50, 62, 40, 160); for (let y = 52; y < 60; y++) for (let x = 40; x < 160; x += 2) u(x, y, [0, 0, 0]); }); // wiersze 52–59: 60 z 200 px = 30%
    expect(liczPasy(zTekstem, W, H)).toBe(1);
  });
  test('ZR5: barwy tła i papieru z design systemu (docs/design/dzianina/design-spec.md, mapa-tokenow.md) i akcentu nie są zakreśleniem (pełnoekranowe wypełnienie)', async () => {
    const { liczPasy } = await wczytaj();
    const hex = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
    const tokeny = {
      'tlo jasne (runo musket)': '#E6E1DA', 'powierzchnia jasna': '#F6F4F1', 'papier jasny (poprzedni system)': '#FCFCFA', 'papierGrupa': '#F2F3F0',
      'tlo ciemne': '#26211E', 'karta/przycisk': '#3A332E', 'tlo ikony ciemne': '#1E1A17', 'tusz': '#221D1A',
      'akcent mioget': '#C08425', 'akcent ciemny': '#CF9636', 'przyciskTekst': '#F3F1EC', 'linia jasna': '#CFC8BF',
    };
    for (const [nazwa, kod] of Object.entries(tokeny)) expect([nazwa, liczPasy(obraz(() => undefined, hex(kod)), W, H)]).toEqual([nazwa, 0]);
  });
  test('ZR5: pas 2-wierszowy w nowej barwie nadal jest poniżej minimum (MIN_WIERSZY_PASA = 3), 3-wierszowy jest pasem', async () => {
    const { liczPasy } = await wczytaj();
    expect(liczPasy(obraz(pasKolor([252, 245, 195], 50, 52)), W, H)).toBe(0);
    expect(liczPasy(obraz(pasKolor([252, 245, 195], 50, 53)), W, H)).toBe(1);
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
  /** Sztuczny „zrzut” 600×900 z `n` żółtymi pasami (RGB, bez alfy). ZR9 (P2-1): pas ma 15 px (≈ 1,1 wysokości wiersza tekstu 13 px, jak pasy prawdziwe 1,0–1,3), nie 31 px (2,4 wiersza) — kontrola ma teraz górną granicę 1,6. ZR7 (P-1016): kontrola mierzy też położenie pasa 2 względem wiersza 13 tekstu strony, więc kadr ma wiersze tekstu:
   * wiersz na każdym pasie (pas i = wiersz „9”, „13”, …) i wiersz między pasami (odpowiednik „Rows 10-12”) — pas 2 leży na wierszu o dwa niżej niż pas 1, jak w kadrze ze sklepu. */
  function zrzut(rel: string, n: number): string {
    const p = path.join(kat, rel); fs.mkdirSync(path.dirname(p), { recursive: true });
    const draw = Array.from({ length: n }, (_, i) => `rectangle 120,${208 + i * 160} 480,${222 + i * 160}`).join(' ');
    // wiersz tekstu = pionowe kreski co 6 px (jak litery: tekst na pasie zostawia ≥ 15% pikseli żółtych w wierszu, więc pas nie dzieli się na kawałki)
    const wiersz = (y0: number) => Array.from({ length: 50 }, (_, k) => `rectangle ${150 + k * 6},${y0} ${151 + k * 6},${y0 + 12}`).join(' ');
    const tekst = Array.from({ length: n }, (_, i) => wiersz(207 + i * 160) + (i < n - 1 ? ` ${wiersz(287 + i * 160)}` : '')).join(' ');
    const args = ['-size', '600x900', 'xc:white', '-fill', 'rgb(248,232,123)', ...(n ? ['-draw', draw] : []), '-fill', 'black', ...(n ? ['-draw', tekst] : []), '-alpha', 'off', '-depth', '8', '-define', 'png:color-type=2', p];
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
  test('brak jednej ze scen pary (komplet-zrzutow.mjs zgłasza to osobno) → pominięcie z komunikatem, bez błędu tej kontroli', () => {
    zrzut('ipad-13/en/03-wzor.png', 1);
    const r = uruchom();
    expect(r.stdout).toMatch(/POMINIĘTO ipad-13\/en/);
    expect(r.status).toBe(0);
  });
  // ZR7 (P-1016): granice kryterium położenia. Kadr 600×900 (analiza po zmniejszeniu do 500 px): wiersze tekstu wysokości 13 px (≈ 11 px po zmniejszeniu) co 80 px — „9” (y 207), „10-12” (287), „13” (367).
  function zrzutPolozenie(rel: string, pas2Od: number, bezTekstu = false): string {
    const p = path.join(kat, rel); fs.mkdirSync(path.dirname(p), { recursive: true });
    const wiersz = (y0: number) => Array.from({ length: 50 }, (_, k) => `rectangle ${150 + k * 6},${y0} ${151 + k * 6},${y0 + 12}`).join(' ');
    const args = ['-size', '600x900', 'xc:white', '-fill', 'rgb(248,232,123)', '-draw', `rectangle 120,208 480,222 rectangle 120,${pas2Od + 8} 480,${pas2Od + 22}`,
      ...(bezTekstu ? [] : ['-fill', 'black', '-draw', [207, 287, 367, 447].map(wiersz).join(' ')]), '-alpha', 'off', '-depth', '8', '-define', 'png:color-type=2', p];
    expect(spawnSync('convert', args).status).toBe(0);
    return p;
  }
  const polozenie = (pas2Od: number, bezTekstu = false) => {
    zrzut('6.9/xx/03-wzor.png', 1); zrzutPolozenie('6.9/xx/04-zakreslenie.png', pas2Od, bezTekstu);
    return uruchom();
  };
  test('ZR7: pas 2 na wierszu 13 (środek pasa w wierszu) → POŁOŻENIE OK; pas przesunięty o 1,3 wysokości wiersza w dół albo w górę → BŁĄD „poza wierszem 13”, kod 1', () => {
    const ok = polozenie(352); // środek pasa y=367 = środek wiersza 13 (367…379 → 373): odchylenie ≈ 0,5
    expect(ok.stdout).toMatch(/POŁOŻENIE OK 6\.9\/xx: pas 2 na wierszu 13/); expect(ok.status).toBe(0);
    for (const od of [375, 341]) { // środek pasa 390 i 356: ±17 px od środka wiersza 13 (373) = ±1,3 wysokości wiersza (13 px)
      const r = polozenie(od);
      expect(r.stdout).toMatch(/BŁĄD [^\n]*6\.9\/xx\/04-zakreslenie\.png: pas 2 poza wierszem 13/); expect(r.status).toBe(1);
    }
  });
  test('ZR7: pas 2 na wierszu 14 (jeden wiersz za nisko, 80 px) i na wierszu „10-12” (jeden za wysoko) → BŁĄD', () => {
    for (const od of [352 + 80, 352 - 80]) { const r = polozenie(od); expect(r.stdout).toMatch(/BŁĄD [^\n]*pas 2 poza wierszem 13/); expect(r.status).toBe(1); }
  });
  test('ZR7: kadr 04 bez wierszy tekstu (analiza położenia niemożliwa) → BŁĄD, nie ciche OK', () => {
    const r = polozenie(352, true);
    expect(r.stdout).toMatch(/BŁĄD [^\n]*pas 2 poza wierszem 13 — w kadrze nie ma wierszy tekstu/); expect(r.status).toBe(1);
  });
  // AQ, P3 (recenzja AP, KO-046): kontrola, która nie znalazła żadnej pary, nic nie sprawdziła — kod 0 z notatką wyglądał jak sukces (zasada 21: kontrola, którą można pominąć po cichu, nie jest kontrolą).
  // Sceny 03/04 powstają w każdym przebiegu (bez OG-07 w `warunek-og07/`, który kontrola też przeszukuje), więc zero par = błąd niezależnie od OG-07.
  test('brak par 03/04 w katalogu (puste, nieistniejące, tylko inne sceny) → BŁĄD i kod 1, nie cichy kod 0', () => {
    for (const katalog of [path.join(kat, 'nie-ma'), kat]) {
      const r = spawnSync('node', [SKRYPT, katalog], { encoding: 'utf8', cwd: korzen });
      expect(r.stdout).toMatch(/BŁĄD[^\n]*brak par 03\/04/);
      expect(r.stdout).not.toMatch(/Kontrola zakreśleń: OK/);
      expect(r.status).toBe(1);
    }
    zrzut('ipad-13/en/01-dzis.png', 0);
    const r = uruchom();
    expect(r.stdout).toMatch(/BŁĄD[^\n]*brak par 03\/04/);
    expect(r.status).toBe(1);
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
