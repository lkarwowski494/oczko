/* Przebieg „Jakość · iOS” #141 (run 41543262518, SHA 7ca8cbc, 2026-11-03) i mapa funkcji MVP → scenariusz → zrzut (zadanie 002, P-419).
 *  S1 · 55: po zmianie pola długości powtórzenia stuknięcie `arkusz-zamknij` pokazuje okno „Discard changes?” (poprawka 020, `src/kompozycja/odrzuc-zmiany.ts`) —
 *       scenariusz czekał na licznik 17 pod oknem (21 s, porażka).
 *  S2 · 61: etykiety listy projektów mają format „<projekt>, <część> · row N of cel” z wartością licznika (hierarchia kroku: „row 0” i „row 2 of 40”), nie „row 1/3 of 40”.
 *  N1 · 42: zrzut z panelu pomiaru po stuknięciu zdjęcia testowego (jak w 17), żeby czerwień niosła liczbę, nie tylko „running”.
 *  Mapa: zrzuty pierwszego użycia F-38 (41), F-18 (20), F-61 (35); F-36 (68: wiersz „Privacy Policy”). */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const plik = (n: string) => fs.readdirSync(KAT).find((f) => f.startsWith(`${n}-`)) as string;
const lista = (n: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik(n))).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const a = k.arg;
  const id = typeof a === 'object' && a ? (a.id ?? a.element?.id ?? a.visible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};
const tekst = (k: Krok): string => (typeof k.arg === 'string' ? k.arg : String(k.arg?.text ?? k.arg?.visible?.text ?? k.arg?.visible ?? ''));
const zrzut = (l: Krok[], nazwa: string) => l.findIndex((k) => k.nazwa === 'takeScreenshot' && String(k.arg) === nazwa);

describe('E2-141-S1 · 55: zmieniony formularz pyta o odrzucenie', () => {
  test('po stuknięciu arkusz-zamknij z wpisanym polem scenariusz potwierdza „Discard changes” przed sprawdzeniem licznika', () => {
    const l = lista('55');
    const zamk = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('arkusz-zamknij'));
    expect(zamk).toBeGreaterThan(-1);
    const pytanie = l.findIndex((k, i) => i > zamk && k.nazwa === 'assertVisible' && tekst(k).startsWith('Discard changes\\?'));
    const odrzuc = l.findIndex((k, i) => i > zamk && k.nazwa === 'tapOn' && tekst(k) === 'Discard changes');
    const licznik = l.findIndex((k, i) => i > zamk && idy(k).includes('licznik-wartosc'));
    expect(pytanie).toBeGreaterThan(zamk);
    expect(odrzuc).toBeGreaterThan(pytanie);
    expect(licznik).toBeGreaterThan(odrzuc);
    expect(zrzut(l, '55-odrzuc-zmiany')).toBeGreaterThan(zamk);
  });
});

describe('E2-141-S2 · 61: etykiety listy projektów z wartością licznika', () => {
  test('lista nie zakłada „row 1 of 40” ani „row 3 of 40”; sprawdza „row 0” (nowy) i „row 2 of 40” (oryginał)', () => {
    const t = fs.readFileSync(path.join(KAT, plik('61')), 'utf8');
    expect(t).not.toMatch(/row 1 of 40/);
    expect(t).not.toMatch(/row 3 of 40/);
    expect(t).toMatch(/row 0, last worked today/);
    expect(t).toMatch(/row 2 of 40/);
  });
});

describe('E2-141-N1 · 42: zrzut pomiaru po zdjęciu testowym', () => {
  test('po stuknięciu e2e-zdjecie-testowe jest takeScreenshot pomiar-zdjecie przed czekaniem na miniaturę', () => {
    const l = lista('42');
    const stuk = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('e2e-zdjecie-testowe'));
    const z = zrzut(l, 'pomiar-zdjecie');
    const mini = l.findIndex((k, i) => i > stuk && k.nazwa === 'extendedWaitUntil' && idy(k).includes('zdjecia-miniatura'));
    const twarda = l.findIndex((k, i) => i > z && k.nazwa === 'assertVisible' && idy(k).includes('zdjecia-miniatura'));
    expect(stuk).toBeGreaterThan(-1);
    expect(mini).toBeGreaterThan(stuk);
    expect(l[mini].arg.optional).toBe(true); // czekanie nie przerywa scenariusza: zrzut powstaje także przy czerwieni
    expect(z).toBeGreaterThan(mini);
    expect(twarda).toBeGreaterThan(z); // twarda asercja po zrzucie
  });
});

describe('Mapa 002 · zrzuty pierwszego użycia', () => {
  test.each([
    ['41', '41-narzedzia-wejscie', 'narzedzia-probka'],
    ['20', '20-projekt-po-powrocie', 'licznik-wartosc'],
    ['35', '35-termin-pole-przed-wpisem', 'projekt-termin'],
  ])('scenariusz %s ma zrzut %s po asercji %s', (n, nazwa, po) => {
    const l = lista(n);
    const z = zrzut(l, nazwa);
    expect(z).toBeGreaterThan(-1);
    const a = l.map((k, i) => ({ k, i })).filter(({ k, i }) => i < z && k.nazwa === 'assertVisible' && idy(k).includes(po));
    expect(a.length).toBeGreaterThan(0);
  });
  test('F-36: scenariusz 68 pokazuje wiersz „Privacy Policy” w Ustawieniach i robi zrzut, bez stukania w link zewnętrzny', () => {
    const l = lista('68');
    expect(l.some((k) => k.nazwa === 'assertVisible' && tekst(k) === 'Privacy Policy')).toBe(true);
    expect(zrzut(l, '68-ustawienia-polityka')).toBeGreaterThan(-1);
    expect(l.some((k) => k.nazwa === 'tapOn' && tekst(k) === 'Privacy Policy')).toBe(false);
    const t = fs.readFileSync(path.join(KAT, plik('68')), 'utf8');
    expect(t).not.toMatch(/^\s*-\s+podstawowy\s*$/m);
  });
});
