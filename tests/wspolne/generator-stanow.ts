// Generator złotych plików stanu Live Activity i zegarka, wersja 3 (N1, P-135 Q7a: pliki wersji 2 jako *-v2.json; moduly.md „Przełączenie v1 → v2”: od przełączenia pliki tworzy kod TS,
// a test pilnuje zgodności — tests/domena/stan-ekranu.test.ts). Aktualizacja plików: UPDATE_STANY=1 npx jest tests/domena/stan-ekranu.test.ts
// Dane syntetyczne (strategia §4): wymyślone UUID v4, nazwy bez danych osobowych; pliki v1 zostają jako *-v1.json (zgodność, R-024, R-034).
import { stanEkranuBlokady, type WejscieStanuZegarka } from '../../src/domena/zegarek';
import type { StanEkranuBlokady } from '../../src/domena/porty';

const LICZNIK = '6f1c2a7e-3b4d-4e5f-8a9b-0c1d2e3f4a5b';
const GLOWA = '6c5eb071-8d9f-4ea0-b1c2-d3e4f5a6b7c8';
const SESJA = 1794336720000; // 2026-11-10 19:52 Europe/Warsaw
const dni = (n: number, pro: (i: number) => boolean) => Array.from({ length: n }, (_, i) => ({ data: `2026-11-${String(i + 1).padStart(2, '0')}`, pro: pro(i) }));
const baza: WejscieStanuZegarka = {
  licznik: { id: LICZNIK, wartosc: 47, glowa: GLOWA, znaczenie: 'skonczone', zablokowany: false }, nazwa: 'Harbor Sweater · Sleeve', dzis: '2026-11-10', dzienDozwolony: true,
  sesjaStartMs: SESJA, ostatniPlusMs: SESJA + 25 * 60_000, dostep: { pro: false, wygasa: null }, dniLimitu: dni(3, () => false),
  przypomnienia: [{ od: 12, co: 6, razy: 8, tekst: 'Decrease at both ends' }],
};
/** Najgorszy przypadek rozmiaru: nazwa 320 znaków CJK (3 B w UTF-8) przed ucięciem, 3+ przypomnienia z długim tekstem CJK, 30 dni. */
const najwiekszy: WejscieStanuZegarka = {
  ...baza, nazwa: '編み物のセーター'.repeat(40), licznik: { id: LICZNIK, wartosc: 150000, glowa: GLOWA, znaczenie: 'w_trakcie', zablokowany: false },
  dniLimitu: dni(30, (i) => i % 2 === 0),
  przypomnienia: Array.from({ length: 5 }, (_, i) => ({ od: 100 * (i + 1), co: 10, razy: 99, tekst: '袖の減らし目を両端で行う'.repeat(5) })),
};

export const WEJSCIA: Record<string, WejscieStanuZegarka> = {
  'stan-ekranu-blokady-typowy.json': baza,
  'stan-ekranu-blokady-limit.json': {
    ...baza, nazwa: 'Moss blanket', licznik: { id: LICZNIK, wartosc: 0, glowa: null, znaczenie: 'skonczone', zablokowany: false }, dzis: '2026-11-07', dzienDozwolony: false,
    sesjaStartMs: null, ostatniPlusMs: null, dniLimitu: dni(5, () => false), przypomnienia: [],
  },
  'stan-ekranu-blokady-najwiekszy.json': najwiekszy,
  'stan-zegarka-typowy.json': baza,
  'stan-zegarka-pro-dozywotni.json': { ...baza, dostep: { pro: true, wygasa: null }, dniLimitu: dni(5, () => true) },
  'stan-zegarka-pro-subskrypcja.json': { ...baza, dostep: { pro: true, wygasa: 1798761599000 }, dniLimitu: dni(2, (i) => i === 1) }, // 2026-12-31T23:59:59Z
  'stan-zegarka-najwiekszy.json': { ...najwiekszy, przypomnienia: najwiekszy.przypomnienia.slice(0, 3) },
};
export const stany = (): Record<string, StanEkranuBlokady> => Object.fromEntries(Object.entries(WEJSCIA).map(([p, w]) => [p, stanEkranuBlokady(w)]));
export const tresc = (s: StanEkranuBlokady): string => `${JSON.stringify(s, null, 2)}\n`;
