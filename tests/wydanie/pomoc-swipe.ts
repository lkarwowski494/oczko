/* ZR4 (P-1000, KO-185): odczyt swipe'ów ze scen zrzutów sklepu (e2e/zrzuty-sklepu/*.yaml) dla testów.
 * Maestro 2.12.1 waliduje `start`/`end` swipe'a przy PARSOWANIU pliku (przed wyliczeniem JS): wyrażenie `${…}` — nawet sama zmienna — daje „Parsing Failed” (run 44697325331).
 * Dlatego współrzędne w scenach są dosłowne „N%, M%”, a wariant (orientacja × język) wybiera `runFlow` z `when: { true: "${ORIENT_WZOR == '…' && DANE_KLUCZ == '…'}" }`.
 * Ten plik nie jest testem (nazwa bez .test.) — używają go zrzuty-zakreslenia.test.ts i zrzuty-zakreslenia-geometria.test.ts. */
import * as fs from 'fs';
import * as path from 'path';
import { YAML } from '../jakosc/maestro-runner';

export const KATALOG_SCEN = path.join(__dirname, '..', '..', 'e2e', 'zrzuty-sklepu');
export const plikiScen = (): string[] => fs.readdirSync(KATALOG_SCEN).filter((f) => f.endsWith('.yaml')).sort();

export type SwipeSceny = { plik: string; warunek: string | null; start: unknown; end: unknown };
export type WariantSwipe = { plik: string; orientacja: string; jezyk: string; grupa: string | null; warunek: string; start: string; end: string };

const komendy = (plik: string): unknown[] => {
  const dok = YAML.parseAllDocuments(fs.readFileSync(path.join(KATALOG_SCEN, plik), 'utf8'));
  expect([plik, dok.map((d: { errors: unknown[] }) => d.errors.length)]).toEqual([plik, dok.map(() => 0)]);
  const lista = dok[dok.length - 1].toJS() as unknown;
  return Array.isArray(lista) ? lista : [];
};

/** Wszystkie komendy `swipe` pliku (także zagnieżdżone w runFlow/retry/repeat) z warunkiem `true:` najbliższego runFlow (albo null). */
export const swipyPliku = (plik: string): SwipeSceny[] => {
  const wynik: SwipeSceny[] = [];
  const idz = (wezel: unknown, warunek: string | null): void => {
    if (Array.isArray(wezel)) { for (const w of wezel) idz(w, warunek); return; }
    if (wezel === null || typeof wezel !== 'object') return;
    const o = wezel as Record<string, unknown>;
    // ZR8 (P-1036): swipe kierunkowy (`{ direction: RIGHT }`, bez start/end) nie ma współrzędnych do sprawdzenia — pomijany; każdy swipe ze start/end nadal podlega regułom ZR4/ZR7
    if ('swipe' in o && o.swipe !== null && typeof o.swipe === 'object' && ('start' in (o.swipe as object) || 'end' in (o.swipe as object))) { const s = o.swipe as Record<string, unknown>; wynik.push({ plik, warunek, start: s.start, end: s.end }); }
    for (const [k, v] of Object.entries(o)) {
      if (k === 'swipe') continue;
      let w = warunek;
      if (k === 'runFlow' && v !== null && typeof v === 'object') { const kw = (v as Record<string, unknown>).when as Record<string, unknown> | undefined; w = typeof kw?.true === 'string' ? kw.true : null; }
      idz(v, w);
    }
  };
  idz(komendy(plik), null);
  return wynik;
};

// ZR7 (P-1016): do orientacji i klucza danych może dojść JEDEN warunek grupy języków aplikacji — `[...].includes(JEZYK)` albo `![...].includes(JEZYK)` (JEZYK = język aplikacji, `-e JEZYK` w zrzuty-sklepu.sh):
// strona PDF przesuwa się w kadrze zależnie od liczby linii podpowiedzi w danym języku, więc współrzędne drugiego zakreślenia są per grupa języków.
export const WARUNEK = /^\$\{ORIENT_WZOR == '(PORTRAIT|LANDSCAPE_LEFT)' && DANE_KLUCZ == '([a-z]+)'(?: && (!?\[(?:'[A-Za-z-]+'(?:, ?)?)+\]\.includes\(JEZYK\)))?\}$/;

/** Swipe'y wybierane warunkiem (orientacja × język) z jednego pliku sceny; test sprawdza, że każdy ma warunek w tym kształcie. */
export const wariantyPliku = (plik: string): WariantSwipe[] => swipyPliku(plik).map((s) => {
  const m = typeof s.warunek === 'string' ? WARUNEK.exec(s.warunek) : null;
  expect([plik, s.warunek, m !== null]).toEqual([plik, s.warunek, true]);
  return { plik, orientacja: m![1], jezyk: m![2], grupa: m![3] ?? null, warunek: s.warunek as string, start: String(s.start), end: String(s.end) };
});

export const ORIENTACJA_URZADZENIA = { iphone: 'PORTRAIT', ipad: 'LANDSCAPE_LEFT' } as const;
