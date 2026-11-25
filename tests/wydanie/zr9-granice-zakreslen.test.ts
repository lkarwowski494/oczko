/* ZR9 (rola 10 fix, KO-206; recenzja RZ2: docs/jakosc/rz2-recenzja.md, próby docs/jakosc/rz2-proby-czulosci.txt): dwie luki czułości kontroli kadrów 03/04 (scripts/ci/kontrola-zakreslen.mjs).
 *   P2-1: brak GÓRNEJ granicy grubości pasa — pas zakrywający sąsiednie wiersze tekstu przechodził z „GRUBOŚĆ OK” (próby M5, M6 recenzji).
 *   P2-2: „brak linii znacznika” kończył się cichym OK, a znacznik o nasyceniu > NASYCENIE_MAX (np. po zmianie koloru) był dla kontroli niewidoczny (próby M2, M4).
 * Materiał: PRAWDZIWE kadry z dane/zr8c-pasek-licznika (run-45564086208, commit 4eea5b1d, iPhone 6.9″, 500 px szerokości; en 04 ma pasy 428–439 i 493–504, wiersze tekstu 9 i 13 w y 425–433 i 489–497,
 * linie znacznika 03: y 540, 551; 04: y 551, 562) — próby M2/M4/M5/M6 odtwarzają recenzję: ImageMagick rysuje na kopii kadru (pas żółty jako Multiply, więc tekst pod pasem zostaje, jak w prawdziwym zakreśleniu).
 * Dowód czerwony: ten plik na kontroli z f0b28df6 → docs/jakosc/zr9-dowod-czerwony.txt. Prawdziwe kadry (zr8c i zr7) muszą dalej przechodzić — testy „bez fałszywego alarmu” poniżej. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const SKRYPT = path.join(korzen, 'scripts/ci/kontrola-zakreslen.mjs');
const DANE_ZR8C = path.join(__dirname, 'dane', 'zr8c-pasek-licznika');
const DANE_ZR7 = path.join(__dirname, 'dane', 'zakreslenie-zr7');
const EN_03 = path.join(DANE_ZR8C, 'run-45564086208/6.9/en/03-wzor.png');
const EN_04 = path.join(DANE_ZR8C, 'run-45564086208/6.9/en/04-zakreslenie.png');
const maConvert = spawnSync('convert', ['-version']).status === 0;
const wymagaConvert = !['', '0', 'false'].includes((process.env.OCZKO_WYMAGAJ_IMAGEMAGICK ?? '').toLowerCase());

if (!maConvert && wymagaConvert) {
  describe('ZR9: ImageMagick wymagany', () => {
    test('`convert` jest dostępny', () => { throw new Error('brak ImageMagick (`convert`) przy OCZKO_WYMAGAJ_IMAGEMAGICK: granice kontroli zakreśleń nie biegną'); });
  });
}
if (!maConvert && !wymagaConvert) {
  test('ZR9: granice kontroli zakreśleń na kadrach POMINIĘTE: brak ImageMagick (`convert`); biegną w zadaniu „komplet” zrzuty-sklepu.yml', () => {
    process.stderr.write('::warning::zr9-granice-zakreslen: pominięte, brak convert\n');
  });
}

const ZOLTY = 'rgb(248,232,123)';
const uruchom = (kat: string) => { const r = spawnSync('node', [SKRYPT, kat], { encoding: 'utf8', cwd: korzen }); return { stdout: r.stdout, status: r.status }; };

(maConvert ? describe : describe.skip)('ZR9 (P2-1, P2-2): granice kontroli kadrów 03/04 na prawdziwych kadrach en', () => {
  let tmp = '';
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-zr9-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  const konwertuj = (wej: string, wyj: string, args: string[]) => {
    const r = spawnSync('convert', [wej, ...args, '-alpha', 'off', '-depth', '8', '-strip', wyj], { encoding: 'utf8' });
    expect(r.status).toBe(0);
  };
  /** Kopia kadrów en 03/04; `przerob03`/`przerob04` = argumenty `convert` (null = kadr bez zmian). Zwraca katalog do kontroli. */
  const zestaw = (przerob03: string[] | null, przerob04: string[] | null): string => {
    const kat = path.join(tmp, '6.9', 'en'); fs.mkdirSync(kat, { recursive: true });
    konwertuj(EN_03, path.join(kat, '03-wzor.png'), przerob03 ?? []);
    konwertuj(EN_04, path.join(kat, '04-zakreslenie.png'), przerob04 ?? []);
    return tmp;
  };
  /** Pasy żółte (Multiply na białej warstwie: tekst pod pasem zostaje) w podanych zakresach wierszy kadru, na szerokości 60–440. */
  const pasy = (...zakresy: [number, number][]) => ['(', '-size', '500x1086', 'xc:white', '-fill', ZOLTY, '-draw', zakresy.map(([a, b]) => `rectangle 60,${a} 440,${b}`).join(' '), ')', '-compose', 'Multiply', '-composite'];
  const liniaKolor = (kolor: string, ...ys: number[]) => ['-fill', kolor, '-draw', ys.map((y) => `rectangle 0,${y} 499,${y}`).join(' ')];

  test('wyjście: nietknięte kadry en 03/04 → GRUBOŚĆ OK, ZNACZNIK OK, kod 0', () => {
    const r = uruchom(zestaw(null, null));
    expect(r.stdout).toMatch(/GRUBOŚĆ OK 6\.9\/en: pas 2 \/ pas 1 = 12\/12/);
    expect(r.stdout).toMatch(/ZNACZNIK OK 6\.9\/en\/04-zakreslenie\.png/);
    expect(r.stdout).toMatch(/Kontrola zakreśleń: OK/); expect(r.status).toBe(0);
  });

  describe('P2-1: pas za gruby (próby M5, M6 recenzji RZ2)', () => {
    test('M5: pasy 51 i 71 wierszy kadru zakrywają sąsiednie wiersze tekstu (środek pasa 2 nadal na wierszu 13) → BŁĄD „za gruby”, kod 1', () => {
      const r = uruchom(zestaw(null, pasy([395, 445], [458, 528])));
      expect(r.stdout).toMatch(/BŁĄD [^\n]*6\.9\/en\/04-zakreslenie\.png: pas \d \(\d+ wierszy kadru[^\n]*za gruby/);
      expect(r.stdout).not.toMatch(/GRUBOŚĆ OK 6\.9\/en/);
      expect(r.status).toBe(1);
    });
    test('M6: pas 1 = 22, pas 2 = 33 wierszy kadru (1,5× pas 1; ponad dwa wiersze tekstu) → BŁĄD „za gruby”, kod 1', () => {
      const r = uruchom(zestaw(null, pasy([418, 439], [477, 509])));
      expect(r.stdout).toMatch(/BŁĄD [^\n]*6\.9\/en\/04-zakreslenie\.png: pas \d \(\d+ wierszy kadru[^\n]*za gruby/);
      expect(r.status).toBe(1);
    });
    test('granica: pas 2 = 17 wierszy (1,55 wysokości wiersza 11) → GRUBOŚĆ OK; 19 wierszy (1,73) → BŁĄD', () => {
      const ok = uruchom(zestaw(null, pasy([490, 506])));
      expect(ok.stdout).toMatch(/GRUBOŚĆ OK 6\.9\/en: pas 2 \/ pas 1 = 17\/12/); expect(ok.status).toBe(0);
      const zle = uruchom(zestaw(null, pasy([489, 507])));
      expect(zle.stdout).toMatch(/BŁĄD [^\n]*pas 2 \(19 wierszy kadru[^\n]*za gruby/); expect(zle.status).toBe(1);
    });
    test('bez fałszywego alarmu: 31 prawdziwych kadrów 04 (zr7: pasy 1,00–1,33 wysokości wiersza, także cienkie) nie mają błędu „za gruby”', () => {
      const kat = path.join(tmp, 'zr7'); fs.cpSync(DANE_ZR7, kat, { recursive: true, filter: (z) => !z.endsWith('.json') });
      expect(uruchom(kat).stdout).not.toMatch(/za gruby/);
    });
  });
});
