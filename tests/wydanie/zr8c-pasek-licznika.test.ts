/* ZR8c (rola 10 fix, KO-205, P-1042): kontrola linii znacznika (`liniaZnacznika` w scripts/ci/kontrola-zakreslen.mjs) brała dolny pasek licznika aplikacji za „linię znacznika na tekście”.
 * Pasek ma złoty przycisk „+1” (ok. 192,132,37; średnia RGB 120 < PROG_CIEMNY 140) i ciemny tekst; razem w en 62,6% szerokości kadru (iPhone 6.9″, wiersz 1002 z 1086) ≥ PROG_LINII 0,6, w pl 54,8% (max) / 46,4% (wiersz 1002) — stąd 13 z 29 języków
 * (cs, da, en, es, hr, id, it, ms, nb, pt, pt-BR, sk, tr) z alarmem „linia znacznika leży na tekście wiersza 963–1032” w przebiegach 45564086208 i 45564082350, choć znacznik stał w przerwie (odstęp 22+ px kadru 500 px = 23–27 pkt PDF).
 * Poprawka: do decyzji „to jest linia” liczą się tylko ciemne piksele NEUTRALNE (nasycenie ≤ NASYCENIE_MAX); progi bez zmian.
 *
 * Materiał (dane/zr8c-pasek-licznika/, opis i zmierzone liczby w pomiary.json): PRAWDZIWE kadry z artefaktów `sklep-zrzuty-surowe` — run-45564086208 (commit 4eea5b1d, all × iPhone 6.9″: en 03/04, pl 03, hr 03, it 03)
 * oraz run-45564082350 (iPad 13″ en 03), zmniejszone do 500 px szerokości (tak analizuje je kontrola), całe, z paskiem licznika (kadry w dane/zakreslenie-zr7 są uciętymi wycinkami bez paska, dlatego ZR8 go nie widział).
 * Dowód czerwony: ten plik uruchomiony na kontroli z 4eea5b1d → docs/jakosc/zr8c-dowod-czerwony.txt. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const SKRYPT = path.join(korzen, 'scripts/ci/kontrola-zakreslen.mjs');
const DANE = path.join(__dirname, 'dane', 'zr8c-pasek-licznika');
const maConvert = spawnSync('convert', ['-version']).status === 0;
const wymagaConvert = !['', '0', 'false'].includes((process.env.OCZKO_WYMAGAJ_IMAGEMAGICK ?? '').toLowerCase());

if (!maConvert && wymagaConvert) {
  describe('ZR8c: ImageMagick wymagany', () => {
    test('`convert` jest dostępny', () => { throw new Error('brak ImageMagick (`convert`) przy OCZKO_WYMAGAJ_IMAGEMAGICK: kontrola paska licznika na kadrach nie biegnie'); });
  });
}
if (!maConvert && !wymagaConvert) {
  test('ZR8c: kontrola paska licznika na kadrach POMINIĘTA: brak ImageMagick (`convert`); biegnie w zadaniu „komplet” zrzuty-sklepu.yml', () => {
    process.stderr.write('::warning::zr8c-pasek-licznika: pominięte, brak convert\n');
  });
}

type Udzial = { ciemne: number; neutralne: number };
type Kadr = { opis: string; wymiar: string; wierszPaskaLicznika: number; pasek: Udzial; liniaZnacznika: Record<string, Udzial> };
const pomiary: { kadry: Record<string, Kadr> } = JSON.parse(fs.readFileSync(path.join(DANE, 'pomiary.json'), 'utf8'));
const EN_03 = 'run-45564086208/6.9/en/03-wzor.png';
const EN_04 = 'run-45564086208/6.9/en/04-zakreslenie.png';
const IPAD_EN_03 = 'run-45564082350/ipad-13/en/03-wzor.png';
const IPHONE = Object.keys(pomiary.kadry).filter((k) => k.includes('/6.9/'));
const PROG_LINII = 0.6; // jak w kontroli (PROG_LINII); test nie zmienia progu, tylko sprawdza zmierzone liczby względem niego

type Z = { linie: number[]; przecina: number[]; ok: boolean; brak: boolean; powod: string };
/** Jest ESM (.mjs), więc jak w pozostałych testach kontroli uruchamiamy ją w procesie `node`: zwraca liniaZnacznika i udziały ciemnych/neutralnych pikseli w podanych wierszach. */
const KOD = `
import { wczytajRgb, liniaZnacznika } from ${JSON.stringify(SKRYPT)};
const [plik, ysJson] = process.argv.slice(1);
const { rgb, w, h } = wczytajRgb(plik);
const z = liniaZnacznika(rgb, w, h);
const udzial = (y, n) => { let c = 0; for (let x = 0, i = y * w * 3; x < w; x++, i += 3) { const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2]; if ((r + g + b) / 3 < 140 && (!n || Math.max(r, g, b) - Math.min(r, g, b) <= 30)) c++; } return c / w; };
const u = {}; for (const y of JSON.parse(ysJson)) u[y] = { ciemne: udzial(y, false), neutralne: udzial(y, true) };
process.stdout.write(JSON.stringify({ z: { linie: z.linie, przecina: z.przecina, ok: z.ok, brak: z.brak, powod: z.powod }, u }));
`;
const kadr = (plik: string, ys: number[] = []): { z: Z; u: Record<string, Udzial> } => {
  const r = spawnSync('node', ['--input-type=module', '-e', KOD, plik, JSON.stringify(ys)], { encoding: 'utf8', cwd: korzen });
  if (r.status !== 0) throw new Error(`analiza kadru ${plik}: ${r.stderr}`);
  return JSON.parse(r.stdout);
};
const analiza = (plik: string) => kadr(plik).z;

(maConvert ? describe : describe.skip)('ZR8c (P-1042): pasek licznika nie jest linią znacznika — prawdziwe kadry 4eea5b1d', () => {
  test.each(Object.keys(pomiary.kadry))('%s: zapisane pomiary zgadzają się z kadrem w repo (±0,002)', (rel) => {
    const k = pomiary.kadry[rel];
    const { u } = kadr(path.join(DANE, rel), [k.wierszPaskaLicznika, ...Object.keys(k.liniaZnacznika).map(Number)]);
    expect(u[k.wierszPaskaLicznika].ciemne).toBeCloseTo(k.pasek.ciemne, 2);
    expect(u[k.wierszPaskaLicznika].neutralne).toBeCloseTo(k.pasek.neutralne, 2);
    for (const [y, z] of Object.entries(k.liniaZnacznika)) {
      expect(u[y].ciemne).toBeCloseTo(z.ciemne, 2);
      expect(u[y].neutralne).toBeCloseTo(z.neutralne, 2);
    }
  });

  test('przyczyna: pasek licznika en ma 62,6% ciemnych (≥ progu linii 60%), ale tylko 27,2% neutralnych', () => {
    const k = pomiary.kadry[EN_03];
    expect(k.pasek.ciemne).toBeGreaterThanOrEqual(PROG_LINII);
    expect(k.pasek.neutralne).toBeLessThan(PROG_LINII);
  });

  test.each(IPHONE)('%s: linie znacznika to dokładnie zmierzone wiersze znacznika, bez wiersza paska licznika; brak alarmu', (rel) => {
    const k = pomiary.kadry[rel]; const z = analiza(path.join(DANE, rel));
    expect(z.linie).toEqual(Object.keys(k.liniaZnacznika).map(Number));
    expect(z.linie).not.toContain(k.wierszPaskaLicznika);
    expect(z.przecina).toEqual([]);
    expect(z.ok).toBe(true);
    expect(z.brak).toBe(false);
  });

  test('iPad 13″ en: znacznik wykryty jak dotąd (nie zepsuty), brak alarmu', () => {
    const z = analiza(path.join(DANE, IPAD_EN_03));
    expect(z.linie).toEqual(Object.keys(pomiary.kadry[IPAD_EN_03].liniaZnacznika).map(Number));
    expect(z.ok).toBe(true);
  });

  test('czułość: prawdziwy znacznik ma ≥ 96% neutralnych ciemnych na iPhonie i ≥ 75% na iPadzie (resztę iPada zajmuje złota kolumna licznika), z zapasem nad progiem 60%', () => {
    for (const rel of IPHONE) for (const u of Object.values(pomiary.kadry[rel].liniaZnacznika)) expect(u.neutralne).toBeGreaterThanOrEqual(0.95);
    for (const u of Object.values(pomiary.kadry[IPAD_EN_03].liniaZnacznika)) expect(u.neutralne).toBeGreaterThanOrEqual(0.75);
  });

  test('znacznik na tekście nadal daje alarm: kadr en 03 z dorysowaną neutralną linią na wierszu „Row 21” → przecina', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-zr8c-'));
    try {
      const wyj = path.join(tmp, 'na-tekscie.png');
      // wiersz tekstu „Row 21” zaczyna się w y=573 (kadr 500 px), znacznik stoi 540/551; linia czarna na całej szerokości w y=578–579 leży na literach
      const r = spawnSync('convert', [path.join(DANE, EN_03), '-fill', 'black', '-draw', 'rectangle 0,578 499,579', '-alpha', 'off', '-depth', '8', '-strip', wyj], { encoding: 'utf8' });
      expect(r.status).toBe(0);
      const z = analiza(wyj);
      expect(z.ok).toBe(false);
      expect(z.przecina).toContain(578);
      expect(z.powod).toMatch(/leży na tekście wiersza/);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('pełna kontrola na katalogu z kadrem en 03/04 → ZNACZNIK OK, bez BŁĘDU znacznika (kod wyjścia nie z powodu znacznika)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-zr8c-pelna-'));
    try {
      const kat = path.join(tmp, '6.9', 'en'); fs.mkdirSync(kat, { recursive: true });
      fs.copyFileSync(path.join(DANE, EN_03), path.join(kat, '03-wzor.png')); fs.copyFileSync(path.join(DANE, EN_04), path.join(kat, '04-zakreslenie.png'));
      const r = spawnSync('node', [SKRYPT, tmp], { encoding: 'utf8', cwd: korzen });
      expect(r.stdout).toMatch(/ZNACZNIK OK 6\.9\/en\/03-wzor\.png: linie 540,551 poza tekstem wierszy/);
      expect(r.stdout).toMatch(/ZNACZNIK OK 6\.9\/en\/04-zakreslenie\.png: linie 551,562 poza tekstem wierszy/);
      expect(r.stdout).not.toMatch(/linia znacznika/);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
});
