/* E2-136-A1 (raport 07 E2 #136, sekcja 04; P-366): pierwszy +1 po „−1” bez projektu w scenariuszu 04 nie dał efektu w E2E (stuknięcie 14,7 s), a test aplikacji
 * na prawdziwej bazie jest zielony (tests/ekrany/licznik-minus-plus-bez-projektu.test.tsx). Przebieg 3 ma rozróżnić aplikację od maszyny, więc po tym stuknięciu
 * scenariusz robi zrzut stanu PRZED asercją (porażka asercji zostawia inaczej tylko zrzut awarii po 17 s), pierwszą asercją zostaje wartość licznika „1”
 * (P-091 9a: zrzut jest przezroczysty dla reguły) i zaraz po niej asercja panelu pomiaru E2E (`e2e-pomiar-plus`, „n = 1”: pojawia się dopiero, gdy aplikacja
 * przetworzyła +1). Wzór: e2e-kruchosc-136.test.ts. */
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const plik = path.join(__dirname, '..', '..', 'e2e/scenariusze/04-br-lic-002-s1-plus-minus-cofnij.yaml');
type Krok = { nazwa: string; arg: any }; // eslint-disable-line @typescript-eslint/no-explicit-any -- struktura YAML scenariusza
const l: Krok[] = [...kroki(wczytaj(plik).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idKroku = (k: Krok | undefined): string | undefined => (typeof k?.arg === 'object' && k.arg ? k.arg.id : undefined);
/** Pierwsze stuknięcie „+1” po „−1” przy braku projektu (krok 13 w #136). */
const iPlus = (() => {
  const minus = l.findIndex((k) => k.nazwa === 'tapOn' && idKroku(k) === 'licznik-minus');
  return l.findIndex((k, i) => i > minus && k.nazwa === 'tapOn' && idKroku(k) === 'licznik-plus');
})();

describe('E2-136-A1 · krok kontrolny po pierwszym +1 po −1 (scenariusz 04)', () => {
  test('pierwsze „+1” po „−1” istnieje w scenariuszu', () => {
    expect(l.findIndex((k) => k.nazwa === 'tapOn' && idKroku(k) === 'licznik-minus')).toBeGreaterThan(-1);
    expect(iPlus).toBeGreaterThan(-1);
  });
  test('zaraz po stuknięciu zrzut stanu, przed jakąkolwiek asercją', () => {
    expect(l[iPlus + 1]?.nazwa).toBe('takeScreenshot');
    expect(String(l[iPlus + 1].arg)).toBe('04-po-plus-po-minus');
  });
  test('pierwsza asercja po zrzucie to wartość licznika „1” (P-091 9a, bez zmiany oczekiwania)', () => {
    const a = l[iPlus + 2];
    expect(a?.nazwa).toBe('assertVisible');
    expect(a.arg).toEqual({ id: 'licznik-wartosc', text: '1' });
  });
  test('zaraz po niej opcjonalna asercja panelu pomiaru E2E „n = 1” (P-367: diagnoza bez nowego źródła porażki bramki)', () => {
    const a = l[iPlus + 3];
    expect(a?.nazwa).toBe('assertVisible');
    expect(a.arg.id).toBe('e2e-pomiar-plus');
    expect(a.arg.optional).toBe(true);
    expect(new RegExp(`^${a.arg.text}$`).test('p95 18 ms, n = 1')).toBe(true);
    expect(new RegExp(`^${a.arg.text}$`).test('p95 18 ms, n = 2')).toBe(false);
  });
  test('zrzut i asercja wartości nie są opcjonalne (porażka kroku kontrolnego ma być widoczna)', () => {
    for (const k of [l[iPlus + 1], l[iPlus + 2]]) expect(typeof k.arg === 'object' && k.arg ? k.arg.optional : undefined).not.toBe(true);
  });
});
