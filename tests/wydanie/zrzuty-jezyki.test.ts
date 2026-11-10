/* Plan zrzutów na wiele lokalizacji (scripts/ci/zrzuty-jezyki.mjs) i kontrola kompletu (scripts/ci/komplet-zrzutow.mjs); rola 10-wydanie, KO-032, 2026-11-10.
 * Dlaczego: lista języków i podział na zadania macOS rozstrzygają o godzinach przebiegu; błąd (np. język bez lokalizacji sklepu) ma wyjść w zadaniu „plan”, nie po 2 godzinach zrzutów. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const modul = (n: string) => path.join(korzen, 'scripts/ci', n);
const node = (args: string[]) => spawnSync(process.execPath, args, { encoding: 'utf8', cwd: korzen });
const plan = (jez: string, zadan: string, urz?: string) => node([modul('zrzuty-jezyki.mjs'), jez, zadan, ...(urz ? [urz] : [])]);

describe('zrzuty-jezyki.mjs', () => {
  test('domyślnie en i pl, 2 zadania iPhone + 2 iPad; zakup tylko w pierwszym zadaniu iPhone’a', () => {
    const r = plan('en,pl', '6');
    expect(r.status).toBe(0);
    const p = JSON.parse(r.stdout);
    expect(p.jezyki).toEqual(['en', 'pl']);
    expect(p.matrix).toEqual([
      { urzadzenie: 'iphone', jezyki: 'en', nr: 1, zakup: true }, { urzadzenie: 'iphone', jezyki: 'pl', nr: 2, zakup: false },
      { urzadzenie: 'ipad', jezyki: 'en', nr: 1, zakup: false }, { urzadzenie: 'ipad', jezyki: 'pl', nr: 2, zakup: false },
    ]);
  });
  test('all = 29 języków z lokalizacją sklepu (bez bg, sl, sr, lt, lv, et), każdy dokładnie raz w każdym urządzeniu, zadań nie więcej niż 8', () => {
    const p = JSON.parse(plan('all', '99').stdout);
    expect(p.jezyki).toHaveLength(29);
    for (const x of ['bg', 'sl', 'sr', 'lt', 'lv', 'et']) expect(p.jezyki).not.toContain(x);
    expect(p.jezyki.slice(0, 2)).toEqual(['en', 'pl']);
    for (const u of ['iphone', 'ipad']) {
      const zad = p.matrix.filter((m: any) => m.urzadzenie === u); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(zad.length).toBe(8);
      expect(zad.flatMap((m: any) => m.jezyki.split(',')).sort()).toEqual([...p.jezyki].sort()); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(Math.max(...zad.map((m: any) => m.jezyki.split(',').length)) - Math.min(...zad.map((m: any) => m.jezyki.split(',').length))).toBeLessThanOrEqual(1); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    expect(p.matrix.filter((m: any) => m.zakup)).toHaveLength(1); // eslint-disable-line @typescript-eslint/no-explicit-any
  });
  // 10-wydanie-006 (recenzja AB): `all` w jednym zadaniu = 29 języków ≈ 878 min przy limicie zadania 330 min (timeout-minutes w workflowie); dokumenty obiecują „≤ 5 języków na zadanie” (P-718).
  test('limit 5 języków na zadanie: `all` w 1–5 zadaniach = kod 2 z komunikatem (zasada 21: głośno, bez cichej zmiany wejścia), w 6 i więcej zadaniach plan przechodzi', () => {
    for (const z of ['1', '2', '5']) { const r = plan('all', z); expect({ z, kod: r.status }).toEqual({ z, kod: 2 }); expect(r.stderr).toMatch(/BŁĄD.*> 5.*zadan/); }
    for (const z of ['6', '7', '8', '99']) {
      const p = JSON.parse(plan('all', z, 'iphone').stdout);
      expect(Math.max(...p.matrix.map((m: any) => m.jezyki.split(',').length))).toBeLessThanOrEqual(5); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    expect(plan('en,pl,de,fr,it', '1', 'iphone').status).toBe(0); // dokładnie 5 w jednym zadaniu
    expect(plan('en,pl,de,fr,it,es', '1', 'iphone').status).toBe(2);
  });
  test('tylko iPhone; błędne wejście = kod 2 z komunikatem (język bez lokalizacji sklepu, nieznany język, nieznane urządzenie)', () => {
    expect(JSON.parse(plan('en', '1', 'iphone').stdout).matrix).toHaveLength(1);
    for (const [j, u] of [['bg', 'iphone'], ['xx', 'iphone'], ['en', 'watch'], ['en;rm -rf', 'iphone']]) {
      const r = plan(j, '1', u); expect({ j, u, kod: r.status }).toEqual({ j, u, kod: 2 }); expect(r.stderr).toMatch(/BŁĄD/);
    }
  });
});

describe('komplet-zrzutow.mjs', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'komplet-'));
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const pliki = (rel: string, nazwy: string[]) => nazwy.forEach((n) => { const p = path.join(tmp, rel, `${n}.png`); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, 'x'); });
  const ZAW = ['01-dzis', '02-licznik', '05-projekty', '06-historia', '07-kalendarz'];
  test('komplet: sceny zawsze + wzór w katalogu głównym albo w warunek-og07 → kod 0; brak sceny → kod 1 z nazwą', () => {
    pliki('6.9/en', [...ZAW, '03-wzor']); pliki('warunek-og07/6.9/en', ['04-zakreslenie']);
    expect(node([modul('komplet-zrzutow.mjs'), tmp, 'en', 'iphone']).status).toBe(0);
    const r = node([modul('komplet-zrzutow.mjs'), tmp, 'en,pl', 'iphone']);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('brak 6.9/pl/01-dzis.png');
    expect(node([modul('komplet-zrzutow.mjs'), tmp, 'en', 'iphone,ipad']).stdout).toContain('ipad-13/en/');
  });
});
