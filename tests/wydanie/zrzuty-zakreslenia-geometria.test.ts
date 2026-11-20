/* ZR3 (rola 10 fix, KO-184, P-998; werdykt WR2 „Zrzuty sklepu — ponowny przegląd”, Z1 i Z2):
 *  Z1 (P2) etykieta znacznika „Row 21 ↓” ma stać na wierszu wzoru o tym samym numerze: licznik fikstury = 20, więc rząd w robocie = 21 (RD-21: licznik + 1),
 *      a wzór sklepu (src/kompozycja/e2e/wzor-sklepu.ts) ma wiersz „Row 21”/„Rząd 21”. Położenie znacznika nie zależy od numeru, więc wariant (a) z polecenia (licznik) wystarcza.
 *  Z2 (P3) zakreślenia mają iść od początku tekstu do końca JEDNEGO wiersza (nie od połowy wiersza, nie do środka słowa, nie między wierszami), na iPhonie i iPadzie, en i pl.
 * Co ten test sprawdza, a czego nie: liczy z danych (szerokość wierszy w Helvetice 15 pt z wzor-sklepu.ts, układ strony w kadrze) gdzie powinno leżeć zakreślenie i porównuje z współrzędnymi z dane/<klucz>.json.
 * Stałe układu (UKLAD) są ZMIERZONE na kadrach z przebiegu 44677685872 (docs/jakosc/werdykt-1221/wr2-ramki-03-04-*.jpg): na nich pas z 40% wysokości leżał na „Row 9” (iPhone) i o ok. 1 pkt % nad „Cast on” (iPad),
 * więc dokładność to ±1 pkt % wysokości (iPad ±4 px kadru, iPhone ±8 px). Ten test pilnuje spójności danych i wyliczeń; trafienie w wiersz na symulatorze potwierdza dopiero przebieg zrzutów i przegląd wzrokowy 07 (macOS). */
import * as fs from 'fs';
import * as path from 'path';
import { WZORY_SKLEPU, type KluczWzoru } from '../../src/kompozycja/e2e/wzor-sklepu';

const korzen = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(korzen, p), 'utf8');
const kod = (p: string) => czytaj(p).split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
const dane = (k: string) => JSON.parse(czytaj(`e2e/zrzuty-sklepu/dane/${k}.json`)) as Record<string, string>;

// Helvetica (AFM, jednostki 1/1000 em); polskie litery z /Differences mają szerokość litery bazowej (Aogonek = A itd.).
const SZER: Record<string, number> = {
  ' ': 278, ',': 278, '-': 333, '.': 278, ':': 278, '=': 584, '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556, '8': 556, '9': 556,
  B: 667, C: 722, E: 667, F: 611, G: 778, H: 722, K: 667, M: 833, N: 722, P: 667, R: 722, S: 667, T: 611, U: 722, Z: 611,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
};
const BAZA: Record<string, string> = { Ą: 'A', ą: 'a', Ć: 'C', ć: 'c', Ę: 'E', ę: 'e', Ł: 'L', ł: 'l', Ń: 'N', ń: 'n', Ó: 'O', ó: 'o', Ś: 'S', ś: 's', Ź: 'Z', ź: 'z', Ż: 'Z', ż: 'z' };
SZER.L = 556; SZER.A = 667; SZER.O = 778; SZER.W = 944; SZER.D = 722; SZER.I = 278; SZER.J = 500; SZER.Q = 778; SZER.V = 667; SZER.X = 667; SZER.Y = 667;
const szerokoscPt = (t: string, pt = 15): number => [...t].reduce((s, z) => { const w = SZER[BAZA[z] ?? z]; if (w === undefined) throw new Error(`brak szerokości znaku ${z}`); return s + w; }, 0) * pt / 1000;

const STRONA_PT = 612; const MARGINES_PT = 72; // wzor-sklepu.ts: MediaBox 612 pt, tekst od x = 72
// Układ kadru (zmierzony na kadrach WR2, patrz nagłówek): lewa krawędź strony i jej szerokość jako % szerokości ekranu; środek wiersza o indeksie i (0 = „Gauge”) jako % wysokości ekranu.
const UKLAD = {
  ipad: { lewo: 0.3, szer: 79.3, srodekWiersza: (i: number) => 41.0 + (i - 1) * 6.9 },
  iphone: { lewo: 0.4, szer: 99.2, srodekWiersza: (i: number) => 40.0 + (i - 3) * 3.0 },
} as const;
type Urzadzenie = keyof typeof UKLAD;
const IDX_ZAKRESLEN: Record<'1' | '2', RegExp> = { '1': /^(Row|Rząd) 9:/, '2': /^(Row|Rząd) 13:/ }; // dwa wiersze z warkoczem

const para = (s: string): [number, number] => { const m = /^(\d+)%,\s*(\d+)%$/.exec(s.trim()); expect([s, m !== null]).toEqual([s, true]); return [Number(m![1]), Number(m![2])]; };

describe('ZR3 Z1: etykieta znacznika rzędu stoi na wierszu wzoru o tym samym numerze', () => {
  const przyg = kod('e2e/zrzuty-sklepu/00-przygotuj.yaml');
  const sesja3 = przyg.slice(przyg.indexOf('${ZRZUTY_SESJA_3}'));

  test('licznik po sesji 3 (wpis + dwa stuknięcia) = N, etykieta znacznika = N + 1 (RD-21), a każda scena sprawdza ten sam licznik N', () => {
    const wpis = Number(/WARTOSC: "(\d+)"/.exec(sesja3)![1]);
    const plusy = sesja3.slice(0, sesja3.indexOf('licznik-akcja-notatka')).split('\n').filter((l) => /tapOn:\s*\{\s*id:\s*"licznik-plus"/.test(l)).length;
    const n = wpis + plusy;
    const asercje = [...sesja3.matchAll(/id: "licznik-wartosc", text: "(\d+)"/g)].map((m) => Number(m[1]));
    expect(asercje).toEqual([wpis + 1, n, n]); // po 1. stuknięciu, po 2. i po powrocie z wzoru
    expect(Number(/id: "wzor-znacznik-rzad", text: "(\d+)"/.exec(sesja3)![1])).toBe(n + 1);
    for (const f of ['01-dzis', '02-licznik', '03-wzor', '04-zakreslenie', '06-historia']) {
      const t = kod(`e2e/zrzuty-sklepu/${f}.yaml`);
      const liczby = [...t.matchAll(/id: "(?:licznik|dzis)-wartosc", text: "(\d+)"/g)].map((m) => Number(m[1]));
      expect([f, liczby.length > 0, liczby.every((x) => x === n)]).toEqual([f, true, true]);
    }
  });

  test.each(Object.keys(WZORY_SKLEPU) as KluczWzoru[])('wzór sklepu (%s) ma wiersz o numerze etykiety znacznika, a „Row/Rząd N” w nim to rząd w robocie (jedyny wiersz z tym numerem)', (k) => {
    const etykieta = Number(/id: "wzor-znacznik-rzad", text: "(\d+)"/.exec(sesja3)![1]);
    const wiersze = WZORY_SKLEPU[k].wiersze;
    const pasujace = wiersze.filter((w) => new RegExp(`^(Row|Rząd) ${etykieta}:`).test(w));
    expect(pasujace).toHaveLength(1);
    // wiersz o numerze etykiety nie może być pierwszym ani ostatnim wierszem instrukcji (znacznik ma stać wśród wierszy, nie na tytule czy na końcu)
    const i = wiersze.indexOf(pasujace[0]); expect(i).toBeGreaterThan(0); expect(i).toBeLessThan(wiersze.length - 1);
  });
});

describe('ZR3 Z2: zakreślenia od początku tekstu do końca jednego wiersza (iPhone, iPad × en, pl)', () => {
  const przyg = kod('e2e/zrzuty-sklepu/00-przygotuj.yaml');
  const s04 = kod('e2e/zrzuty-sklepu/04-zakreslenie.yaml');

  test('oba swipe\'y czytają współrzędne ze zmiennych ZAKR_1_* (fikstura) i ZAKR_2_* (scena 04) wybieranych po ORIENT_WZOR; en i pl mają komplet 8 kluczy', () => {
    const wyr = (t: string, n: string) => new RegExp(`swipe:\\s*\\{\\s*start:\\s*"\\$\\{ORIENT_WZOR == 'PORTRAIT' \\? ZAKR_${n}_OD_IPHONE : ZAKR_${n}_OD_IPAD\\}",\\s*end:\\s*"\\$\\{ORIENT_WZOR == 'PORTRAIT' \\? ZAKR_${n}_DO_IPHONE : ZAKR_${n}_DO_IPAD\\}"`).test(t);
    expect(wyr(przyg, '1')).toBe(true); expect(wyr(s04, '2')).toBe(true);
    for (const k of ['en', 'pl']) for (const n of ['1', '2']) for (const o of ['OD', 'DO']) for (const u of ['IPHONE', 'IPAD']) expect([k, `ZAKR_${n}_${o}_${u}`, typeof dane(k)[`ZAKR_${n}_${o}_${u}`]]).toEqual([k, `ZAKR_${n}_${o}_${u}`, 'string']);
    expect(Object.keys(dane('pl')).sort()).toEqual(Object.keys(dane('en')).sort());
  });

  const przypadki = (['iphone', 'ipad'] as Urzadzenie[]).flatMap((u) => (['en', 'pl'] as KluczWzoru[]).flatMap((k) => (['1', '2'] as const).map((n) => [u, k, n] as const)));
  test.each(przypadki)('%s · %s · zakreślenie %s: poziomo, w jednym wierszu (±1 pkt % wysokości), od początku tekstu, do końca wiersza (≤ 3 pkt % za nim), bez wyjścia poza stronę', (u, k, n) => {
    const d = dane(k); const U = UKLAD[u]; const S = u.toUpperCase();
    const [x1, y1] = para(d[`ZAKR_${n}_OD_${S}`]); const [x2, y2] = para(d[`ZAKR_${n}_DO_${S}`]);
    expect(y1).toBe(y2); // pociągnięcie poziome: jeden wiersz
    const wiersze = WZORY_SKLEPU[k].wiersze;
    const idx = wiersze.findIndex((w) => IDX_ZAKRESLEN[n].test(w)); expect(idx).toBeGreaterThan(-1);
    expect(Math.abs(y1 - U.srodekWiersza(idx))).toBeLessThanOrEqual(1.0); // indeks w wiersze[] = indeks w układzie kadru (0 = „Gauge”, tytuł jest nad nim)
    const naEkran = (ptNaStronie: number) => U.lewo + (ptNaStronie / STRONA_PT) * U.szer;
    const poczatekTekstu = naEkran(MARGINES_PT); const koniecTekstu = naEkran(MARGINES_PT + szerokoscPt(wiersze[idx]));
    expect(x1).toBeGreaterThanOrEqual(8); expect(x1).toBeLessThanOrEqual(10); // „ok. 8–10% szerokości”
    expect(x1).toBeLessThanOrEqual(poczatekTekstu + 0.5); // nie od połowy wiersza: początek ruchu przy początku tekstu
    expect(poczatekTekstu - x1).toBeLessThanOrEqual(4);
    expect(x2).toBeGreaterThanOrEqual(koniecTekstu); // nie kończy się w środku słowa
    expect(x2 - koniecTekstu).toBeLessThanOrEqual(3);
    expect(x2).toBeLessThanOrEqual(U.lewo + U.szer); // nie wychodzi poza stronę
  });

  test.each(['en', 'pl'] as const)('%s: oba zakreślenia na obu urządzeniach dzielą ≥ 6 pkt % wysokości (pasy nie zlewają się) i leżą nad wierszem znacznika', (k) => {
    for (const S of ['IPHONE', 'IPAD']) {
      const y = (n: string) => para(dane(k)[`ZAKR_${n}_OD_${S}`])[1];
      expect(Math.abs(y('1') - y('2'))).toBeGreaterThanOrEqual(6);
      const u = S.toLowerCase() as Urzadzenie; const iZnacznika = WZORY_SKLEPU[k].wiersze.findIndex((w) => /^(Row|Rząd) 21:/.test(w));
      expect(Math.max(y('1'), y('2'))).toBeLessThan(UKLAD[u].srodekWiersza(iZnacznika) - 2);
    }
  });
});
