/* ZR7 (rola 10 fix, KO-195, P-1016): kontrola zakreśleń liczyła pasy, a nie wiersze, więc przebieg 45021511463 przeszedł z „OK (27 par)” mimo drugiego pasa poza wierszem „Row 13”
 * w 10 językach (de, el, fr, ja, nl, ro, ru, uk: strona PDF o 45 px niżej w kadrze 1320×2868; id, ms: o 30 px wyżej). Rozszerzona kontrola (scripts/ci/kontrola-zakreslen.mjs)
 * mierzy położenie pasa 2 względem wiersza 13 tekstu strony.
 * Materiał: PRAWDZIWE kadry 04-zakreslenie.png (iPhone 6.9″): 27 języków z przebiegu 45021511463 (artefakt sklep-zrzuty-surowe 14762785642, SHA 5310ea0b) i en, pl z przebiegu 44758366101
 * (artefakt 14640541865, wzorzec WR3) oraz iPad 13″ en, pl z tego samego przebiegu. Plik w repo = wycinek pełnego kadru pomniejszony do szerokości 500 px (rozmiar, w jakim kontrola i tak analizuje kadr):
 *   convert <kadr>.png -crop 1320x900+0+1000 +repage -resize 500x -alpha off -depth 8 -strip <plik>.png   (iPad: bez -crop)
 * Pełne kadry nie leżą w repo (2,2 MB wycinków zamiast ≈ 10 MB); SHA-256 pełnych kadrów i pomiary w pełnej rozdzielczości: dane/zakreslenie-zr7/pomiary-surowe-1320x2868.json.
 * Wynik oczekiwany: „źle” = 10 języków z WR4 (tabela-pomiarow.md), „dobrze” = 17 pozostałych + en/pl (+ iPad en/pl). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const SKRYPT = path.join(korzen, 'scripts/ci/kontrola-zakreslen.mjs');
const DANE = path.join(__dirname, 'dane', 'zakreslenie-zr7');
const maConvert = spawnSync('convert', ['-version']).status === 0;
const wymagaConvert = !['', '0', 'false'].includes((process.env.OCZKO_WYMAGAJ_IMAGEMAGICK ?? '').toLowerCase());

export const ZLE = ['de', 'el', 'fr', 'id', 'ja', 'ms', 'nl', 'ro', 'ru', 'uk'];
export const DOBRE = ['cs', 'da', 'es', 'es-419', 'fi', 'hr', 'hu', 'it', 'ko', 'nb', 'pt', 'pt-BR', 'sk', 'sv', 'tr', 'vi', 'zh-Hant', 'en', 'pl'];

if (!maConvert && wymagaConvert) {
  describe('ZR7: ImageMagick wymagany', () => {
    test('`convert` jest dostępny', () => { throw new Error('brak ImageMagick (`convert`) przy OCZKO_WYMAGAJ_IMAGEMAGICK: kontrola położenia pasa na kadrach nie biegnie'); });
  });
}
if (!maConvert && !wymagaConvert) {
  test('ZR7: kontrola położenia pasa na kadrach POMINIĘTA: brak ImageMagick (`convert`); biegnie w zadaniu „komplet” zrzuty-sklepu.yml', () => {
    process.stderr.write('::warning::zakreslenie-polozenie: pominięte, brak convert\n');
  });
}

(maConvert ? describe : describe.skip)('ZR7 (P-1016): położenie pasa 2 względem wiersza 13 na prawdziwych kadrach 04', () => {
  let kat = '';
  let stdout = ''; let status: number | null = null;
  beforeAll(() => {
    kat = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-polozenie-'));
    fs.cpSync(DANE, kat, { recursive: true, filter: (z) => !z.endsWith('.json') });
    const r = spawnSync('node', [SKRYPT, kat], { encoding: 'utf8', cwd: korzen });
    stdout = r.stdout; status = r.status;
  });
  afterAll(() => { fs.rmSync(kat, { recursive: true, force: true }); });

  test.each(ZLE)('%s (kadr z 45021511463): pas 2 poza wierszem 13 → BŁĄD z nazwą pliku', (j) => {
    expect(stdout).toMatch(new RegExp(`BŁĄD [^\\n]*6\\.9/${j}/04-zakreslenie\\.png[^\\n]*pas 2 poza wierszem 13`));
    expect(stdout).not.toMatch(new RegExp(`POŁOŻENIE OK 6\\.9/${j}:`));
  });
  test.each(DOBRE)('%s: pas 2 na wierszu 13 → POŁOŻENIE OK, bez błędu', (j) => {
    expect(stdout).toMatch(new RegExp(`POŁOŻENIE OK 6\\.9/${j}: pas 2 na wierszu 13`));
    expect(stdout).not.toMatch(new RegExp(`BŁĄD [^\\n]*6\\.9/${j}/04-zakreslenie`));
  });
  test.each(['en', 'pl'])('iPad 13″ %s (poziomo, przebieg 44758366101): pas 2 na wierszu 13', (j) => {
    expect(stdout).toMatch(new RegExp(`POŁOŻENIE OK ipad-13/${j}: pas 2 na wierszu 13`));
  });
  test('kod wyjścia 1 (są błędy), a błędów jest dokładnie tyle, ile języków z drugim pasem poza wierszem', () => {
    expect(status).toBe(1);
    expect((stdout.match(/^BŁĄD /gm) ?? []).length).toBe(ZLE.length);
  });
  test('zestaw wejściowy ma dokładnie 29 kadrów iPhone (10 + 19) i 2 iPad — test nie jest pusty', () => {
    const jezyki = fs.readdirSync(path.join(DANE, '6.9')).sort();
    expect(jezyki).toEqual([...ZLE, ...DOBRE].sort());
    expect(fs.readdirSync(path.join(DANE, 'ipad-13')).sort()).toEqual(['en', 'pl']);
  });
});
