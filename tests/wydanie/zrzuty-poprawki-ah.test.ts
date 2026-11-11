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
    // 018: forma ISO w UTC zbudowana ze stałej (bez strefy odrzucona: run 43017044972; z +00:00 odrzucona: job 130695677975, code=22)
    expect(sh).toMatch(/iso="\$\{ZRZUTY_TERAZ\}Z"/);
    expect(sh).toMatch(/status_bar "\$UDID" override --time "\$iso"/);
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

describe('10-wydanie-013: dane w kadrze w języku zestawu (dane per język, jak trening:scripts/ci/store-screenshots.sh:17,60)', () => {
  const KAT = 'e2e/zrzuty-sklepu';
  const dane = (k: string) => JSON.parse(czytaj(`${KAT}/dane/${k}.json`)) as Record<string, string | boolean>;
  const FRAZY_EN = [/knit across/i, /Test pattern/i, /then cable/i, /\bPM\b/, /\bAM\b/];
  test('dane en i pl mają te same klucze; pl bez fraz angielskich z listy (knit across, Test pattern, then cable, PM, AM) i bez nazw z zestawu en', () => {
    const en = dane('en'); const pl = dane('pl');
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
    const tekst = JSON.stringify(pl);
    for (const f of FRAZY_EN) expect([String(f), f.test(tekst)]).toEqual([String(f), false]);
    for (const nazwa of ['Harbor', 'Moss Socks', 'Cable Hat', 'Baby Blanket']) expect(tekst).not.toContain(nazwa);
    expect(pl.godziny24).toBe(true); expect(en.godziny24).toBe(false);
    expect(String(pl.region)).toMatch(/^pl_PL$/); expect(String(en.region)).toMatch(/^en_US$/);
  });
  test('pola wpisywane w aplikacji są ASCII bez znaków wyrażeń regularnych (Maestro dopasowuje tekst jako regex; inputText znaków spoza ASCII na iOS niesprawdzony)', () => {
    for (const k of ['en', 'pl']) for (const [nazwa, w] of Object.entries(dane(k))) {
      if (!/^(PROJ_|NOTATKA)/.test(nazwa)) continue;
      expect([k, nazwa, /^[\x20-\x7e]+$/.test(String(w))]).toEqual([k, nazwa, true]);
      expect([k, nazwa, /[.*+?^${}()|[\]\\]/.test(String(w))]).toEqual([k, nazwa, false]);
    }
  });
  test('sceny i fikstura nie mają wpisanych na sztywno angielskich danych: biorą je ze zmiennych (${PROJ_GLOWNY}, ${NOTATKA}, …)', () => {
    for (const f of fs.readdirSync(path.join(korzen, KAT)).filter((x) => x.endsWith('.yaml'))) {
      const kod = czytaj(`${KAT}/${f}`).split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
      for (const s of ['Harbor Sweater', 'Moss Socks', 'Cable Hat', 'Baby Blanket', 'next: 3 knit', 'e2e-wzor-pdf"']) expect([f, kod.includes(s)]).toEqual([f, false]);
    }
    expect(czytaj(`${KAT}/00-przygotuj.yaml`)).toMatch(/\$\{PROJ_GLOWNY\}[\s\S]*\$\{NOTATKA\}/);
    expect(czytaj(`${KAT}/02-licznik.yaml`)).toContain('${NOTATKA}');
    expect(czytaj(`${KAT}/01-dzis.yaml`)).toContain('${PROJ_GLOWNY}');
  });
  test('zrzuty-dane.mjs: klucz danych języka; brak danych = jawny powrót do en (kod 3 i komunikat), nie ciche', () => {
    const k = (j: string) => spawnSync('node', ['scripts/ci/zrzuty-dane.mjs', 'klucz', j], { encoding: 'utf8', cwd: korzen });
    expect(k('pl').stdout.trim()).toBe('pl'); expect(k('pl').status).toBe(0);
    expect(k('en').stdout.trim()).toBe('en'); expect(k('en').status).toBe(0);
    const de = k('de-DE'); expect(de.stdout.trim()).toBe('en'); expect(de.status).toBe(3); expect(de.stderr).toMatch(/brak danych języka de-DE/);
    const env = spawnSync('node', ['scripts/ci/zrzuty-dane.mjs', 'env', 'pl'], { encoding: 'utf8', cwd: korzen }).stdout;
    expect(env).toMatch(/^PROJ_GLOWNY=Czapka z warkoczem$/m); expect(env).toMatch(/^DANE_KLUCZ=pl$/m);
  });
  test('skrypt: dane per język (re-przygotowanie przy zmianie klucza), jawny powrót do en, 24 h i region z danych, brak zapisu stałych angielskich', () => {
    const sh = czytaj('scripts/ci/zrzuty-sklepu.sh');
    expect(sh).toContain('zrzuty-dane.mjs'); expect(sh).toMatch(/brak danych języka|zrzuty-dane\.mjs" klucz/);
    expect(sh).toMatch(/AppleICUForce24HourTime/); expect(sh).toMatch(/AppleLocale/); expect(sh).toMatch(/DANE_AKTUALNE/);
  });
});

describe('10-wydanie-014: kadry 03 i 04 — wzór z treścią, 04 różny od 03', () => {
  const KAT = 'e2e/zrzuty-sklepu';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { pdfWzoruSklepu, WZORY_SKLEPU } = require('../../src/kompozycja/e2e/wzor-sklepu') as typeof import('../../src/kompozycja/e2e/wzor-sklepu');
  test.each(['en', 'pl'] as const)('PDF wzoru (%s): poprawna struktura (xref), bez „Test pattern”, tytuł i ≥ 12 wierszy tekstu', (k) => {
    const pdf = pdfWzoruSklepu(k);
    expect(pdf.startsWith('%PDF-')).toBe(true); expect(pdf).not.toMatch(/Test pattern/i); expect(WZORY_SKLEPU[k].nazwa).not.toMatch(/Test pattern/i);
    expect((pdf.match(/ Tj ET/g) ?? []).length).toBeGreaterThanOrEqual(13);
    const xref = Number(/startxref\n(\d+)/.exec(pdf)?.[1]); expect(pdf.slice(xref, xref + 4)).toBe('xref');
    for (const m of pdf.matchAll(/(\d{10}) 00000 n/g)) expect(pdf.slice(Number(m[1]), Number(m[1]) + 12)).toMatch(/^\d+ 0 obj/);
    expect(/[^\x00-\x7f]/.test(pdf)).toBe(false); // czysty ASCII: polskie litery tylko jako kody z /Differences
  });
  test('wzór pl ma polskie litery (kody z Differences), wzór en nie ma polskich fraz', () => {
    expect(pdfWzoruSklepu('pl')).toMatch(/\/Differences \[128 \/Aogonek/); expect(pdfWzoruSklepu('pl')).toMatch(/\\2\d\d/);
    expect(JSON.stringify(WZORY_SKLEPU.pl)).toMatch(/oczka prawe/); expect(JSON.stringify(WZORY_SKLEPU.en)).not.toMatch(/oczk|rząd/i);
  });
  test('panel E2E ma przyciski e2e-wzor-sklep-<język>, a fikstura używa ich zamiast e2e-wzor-pdf', () => {
    const panele = czytaj('src/kompozycja/e2e/panele.tsx');
    expect(panele).toContain('e2e-wzor-sklep-${k}'); expect(panele).toContain("['en', 'pl'] as const");
    expect(czytaj(`${KAT}/00-przygotuj.yaml`)).toContain('e2e-wzor-sklep-${DANE_KLUCZ}');
  });
  test('scena 04 różni się od 03: drugie zakreślenie na wzorze (licznik zakreśleń ≥ 2) przy aktywnym zakreślaczu', () => {
    const s04 = czytaj(`${KAT}/04-zakreslenie.yaml`); const s03 = czytaj(`${KAT}/03-wzor.yaml`);
    expect(s04).toMatch(/swipe:/); expect(s04).toMatch(/wzor-zakreslenia", text: '\^\\D\*2\\D\*\$'/); expect(s03).not.toMatch(/swipe:/);
  });
});
