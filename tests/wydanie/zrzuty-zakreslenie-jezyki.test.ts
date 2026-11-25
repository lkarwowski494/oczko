/* ZR7 (rola 10 fix, KO-195, P-1016; fakt WR4, P-1014/P-1015): drugi swipe sceny 04 (zakreślenie 2 = „Row 13”) stał na stałej wysokości ekranu (46%), a strona PDF przesuwa się w kadrze
 * zależnie od liczby linii podpowiedzi nad nią: w de, el, fr, ja, nl, ro, ru, uk (podpowiedź w 2 liniach, strona o 45 px niżej w kadrze 1320×2868) pas trafiał w „Rows 10-12”,
 * w id, ms (strona o 30 px wyżej) wisiał między wierszami 13 a 14. Poprawka: współrzędne drugiego swipe'a per grupa języków (`when: true:` z `.includes(JEZYK)`; Maestro waliduje `start`/`end` przy parsowaniu,
 * więc muszą być dosłowne — ZR4, P-1000).
 * Model (z pomiarów, nie z założeń): dane/zakreslenie-zr7/pomiary-surowe-1320x2868.json — dla 27 języków z przebiegu 45021511463 i en, pl z 44758366101: wiersz 13 [od, do] w pikselach kadru 1320×2868
 * (iPhone 6.9″; kadr surowy = piksele ekranu). Środek pasa zakreślenia leży przy y = wysokość swipe'a w pikselach − PRZESUNIECIE_PASA (zmierzone: swipe 46% = 1319,3 px → pas 1301–1331, środek 1316,5 w 29 kadrach;
 * kadry z cienkim pasem 1311–1322 mają ten sam środek). Kryterium jak w kontroli kadrów (scripts/ci/kontrola-zakreslen.mjs, ODCHYLENIE_MAX): środek pasa nie dalej niż 0,9 wysokości wiersza od środka wiersza 13.
 * Granica modelu: współrzędne w procentach są całkowite (Maestro), więc krok to 1% = 28,7 px; pomiar z przebiegu ma ostatnie słowo (kontrola kadrów w jobie „komplet”). */
import * as fs from 'fs';
import * as path from 'path';
import { ORIENTACJA_URZADZENIA, wariantyPliku } from './pomoc-swipe';

const KADR_WYS = 2868;
const PRZESUNIECIE_PASA = 2.8; // 46% · 2868 = 1319,28; środek zmierzonego pasa 1316,5
const ODCHYLENIE_MAX = 0.9;
const pomiary = JSON.parse(fs.readFileSync(path.join(__dirname, 'dane', 'zakreslenie-zr7', 'pomiary-surowe-1320x2868.json'), 'utf8')) as Record<string, { wiersz13: [number, number]; pas1: [number, number]; pas2: [number, number] }>;
const JEZYKI = Object.keys(pomiary).sort();

/** Wariant swipe'a sceny 04, którego warunek jest prawdziwy dla (orientacja, język aplikacji); klucz danych: pl → „pl”, reszta „en” (zrzuty-dane.mjs). Dokładnie jeden. */
function swipeDla(orientacja: string, jezyk: string) {
  const klucz = jezyk === 'pl' ? 'pl' : 'en';
  const prawdziwe = wariantyPliku('04-zakreslenie.yaml').filter((w) => {
    const wyrazenie = w.warunek.replace(/^\$\{/, '').replace(/\}$/, '');
    // eslint-disable-next-line no-new-func
    return new Function('ORIENT_WZOR', 'DANE_KLUCZ', 'JEZYK', `return (${wyrazenie});`)(orientacja, klucz, jezyk) === true;
  });
  expect([orientacja, jezyk, prawdziwe.length]).toEqual([orientacja, jezyk, 1]);
  return prawdziwe[0];
}
const y = (s: string) => Number(/,\s*(\d+)%$/.exec(s.trim())![1]);

describe('ZR7 (P-1016): drugi swipe sceny 04 trafia w wiersz 13 w każdym języku (model z pomiarów 29 kadrów)', () => {
  test('pomiary obejmują 27 języków z 45021511463 i en, pl z 44758366101', () => {
    expect(JEZYKI).toHaveLength(29);
    expect(JEZYKI.filter((j) => (pomiary as Record<string, { przebieg?: string }>)[j].przebieg === '44758366101').sort()).toEqual(['en', 'pl']);
  });

  test.each(JEZYKI)('%s (iPhone): środek pasa z swipe\'a leży ≤ 0,9 wysokości wiersza od środka wiersza 13', (j) => {
    const w = swipeDla(ORIENTACJA_URZADZENIA.iphone, j);
    const srodekPasa = (y(w.start) / 100) * KADR_WYS - PRZESUNIECIE_PASA;
    const [a, b] = pomiary[j].wiersz13;
    const wysokosc = b - a + 1; const srodek = (a + b) / 2;
    const odchylenie = Math.abs(srodekPasa - srodek) / wysokosc;
    expect([j, y(w.start), Number(odchylenie.toFixed(2)), odchylenie <= ODCHYLENIE_MAX]).toEqual([j, y(w.start), Number(odchylenie.toFixed(2)), true]);
  });

  test.each(JEZYKI)('%s: pas z swipe\'a (zakreślenie 2) nie zlewa się z pasem 1 z fikstury (środki ≥ 100 px, pas ma ≈ 30 px)', (j) => {
    const w = swipeDla(ORIENTACJA_URZADZENIA.iphone, j);
    const srodekPasa = (y(w.start) / 100) * KADR_WYS - PRZESUNIECIE_PASA;
    const [a, b] = pomiary[j].pas1;
    expect(srodekPasa - (a + b) / 2).toBeGreaterThanOrEqual(100);
  });

  test('swipe jest poziomy (start i end na tej samej wysokości), a koniec poziomy jak dla en/pl: 69% (dane en) i 92% (pl) — zmienia się tylko wysokość', () => {
    for (const j of JEZYKI) {
      const w = swipeDla(ORIENTACJA_URZADZENIA.iphone, j);
      expect([j, y(w.start)]).toEqual([j, y(w.end)]);
      expect([j, w.start.split('%')[0], w.end.split('%')[0]]).toEqual([j, '10', j === 'pl' ? '92' : '69']);
    }
  });

  test('pierwszy pas (Row 9, fikstura) i swipe iPada (en, pl) bez zmian względem WR3: 46%, 69% — zmiana dotyczy tylko iPhone\'a w 10 językach', () => {
    expect(y(swipeDla('PORTRAIT', 'en').start)).toBe(46);
    expect(y(swipeDla('PORTRAIT', 'pl').start)).toBe(46);
    expect(y(swipeDla('LANDSCAPE_LEFT', 'en').start)).toBe(69);
    expect(y(swipeDla('LANDSCAPE_LEFT', 'pl').start)).toBe(69);
    const przyg = wariantyPliku('00-przygotuj.yaml').map((x) => [x.orientacja, x.jezyk, x.start, x.end]);
    expect(przyg).toEqual([['PORTRAIT', 'en', '10%, 40%', '68%, 40%'], ['LANDSCAPE_LEFT', 'en', '9%, 55%', '54%, 55%'], ['PORTRAIT', 'pl', '10%, 40%', '91%, 40%'], ['LANDSCAPE_LEFT', 'pl', '9%, 55%', '73%, 55%']]);
  });

  test('języki bez przesunięcia (17 + en, pl) zostają na 46% — poprawka nie rusza kadrów, które są poprawne', () => {
    const przesuniete = ['de', 'el', 'fr', 'id', 'ja', 'ms', 'nl', 'ro', 'ru', 'uk'];
    for (const j of JEZYKI.filter((x) => !przesuniete.includes(x))) expect([j, y(swipeDla('PORTRAIT', j).start)]).toEqual([j, 46]);
    for (const j of przesuniete) expect([j, y(swipeDla('PORTRAIT', j).start)]).not.toEqual([j, 46]);
  });
});
