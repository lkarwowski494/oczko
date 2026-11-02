/* Przebieg „Jakość · iOS” #138 (run 41397884216, SHA c9b6f03, 2026-11-02): cztery czerwone scenariusze, z których trzy to błędy scenariuszy, a czwarty (30) pokazuje
 * usterkę aplikacji, której scenariusz nie może ukrywać.
 *  S1 · 08: ostatni krok `nav-wstecz` — po drugim imporcie ekran Ustawień jest przewinięty w dół (zrzut kroku 89: „Merged. 0 new projects…”, bez przycisku „Back” na ekranie),
 *       element poza ekranem nie występuje w hierarchii iOS → „Element not found: nav-wstecz”.
 *  S2 · 28: po „Done” systemowa prośba o ocenę (SKStoreReviewPresentationWindow) przykrywa listę; jej proces (StoreKitUIService) wystartował 21 s po żądaniu
 *       (07:07:41,7 → 07:08:02,9), a opcjonalne „Not Now” czekało ok. 6 s, potem twarda asercja listy 10 s → hierarchia pusta (tylko pasek stanu).
 *  S3 · 47: po restarcie aplikacja otwiera ekran wzoru (BR-PRJ-011/S1, jak w scenariuszu 26, E2-136-S1); `tapOn licznik-wzor` szuka elementu, którego tam nie ma.
 *  S4 · 30: przy AX5 arkusz „Enter value” ma pole liczby poniżej pierwszego ekranu (zrzut kroku 28); scenariusz asertował pole bez przewinięcia i bez zrzutu arkusza.
 *  S5 · 07: po „Not now” z ofert otwartych z okna (A2, `app/oferty.tsx:63` `dismissTo`) scenariusz nie robił zrzutu listy — potwierdzenie tylko z asercji. */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const plik = (n: string) => fs.readdirSync(KAT).find((f) => f.startsWith(`${n}-`)) as string;
const lista = (n: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik(n))).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const a = k.arg;
  const id = typeof a === 'object' && a ? (a.id ?? a.element?.id ?? a.visible?.id ?? a.when?.visible?.id ?? a.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};
const tekst = (k: Krok): string | undefined => (typeof k.arg === 'object' && k.arg ? (k.arg.text ?? k.arg.visible?.text) : undefined);
const ostatni = (l: Krok[], pred: (k: Krok) => boolean) => { for (let i = l.length - 1; i >= 0; i--) if (pred(l[i])) return i; return -1; };

describe('E2-138-S1 · 08: przycisk „Back” po imporcie leży poza ekranem', () => {
  test('przed ostatnim tapOn nav-wstecz jest scrollUntilVisible nav-wstecz w górę', () => {
    const l = lista('08');
    const t = ostatni(l, (k) => k.nazwa === 'tapOn' && idy(k).includes('nav-wstecz'));
    expect(t).toBeGreaterThan(-1);
    const p = l[t - 1];
    expect(p.nazwa).toBe('scrollUntilVisible');
    expect(idy(p)).toContain('nav-wstecz');
    expect(String(p.arg.direction).toUpperCase()).toBe('UP');
  });
});

describe('E2-138-S2 · 28: systemowa prośba o ocenę startuje do ~20 s po żądaniu', () => {
  test('po „Done” scenariusz czeka na „Not Now” do 60 s (opcjonalnie), zamyka prośbę i dopiero wtedy wymaga listy', () => {
    const l = lista('28');
    const gotowe = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('ukonczenie-gotowe'));
    expect(gotowe).toBeGreaterThan(-1);
    const twarda = l.findIndex((k, i) => i > gotowe && ['assertVisible', 'extendedWaitUntil'].includes(k.nazwa) && !k.arg?.optional && idy(k).includes('projekty-lista'));
    expect(twarda).toBeGreaterThan(gotowe);
    const miedzy = l.slice(gotowe + 1, twarda);
    const czekanie = miedzy.findIndex((k) => k.nazwa === 'extendedWaitUntil' && tekst(k) === 'Not Now');
    expect(czekanie).toBeGreaterThan(-1);
    expect(miedzy[czekanie].arg.optional).toBe(true);
    expect(miedzy[czekanie].arg.timeout).toBeGreaterThanOrEqual(45000);
    const stuk = miedzy.findIndex((k, i) => i > czekanie && k.nazwa === 'tapOn' && tekst(k) === 'Not Now' && k.arg.optional === true);
    expect(stuk).toBeGreaterThan(czekanie);
    // czekanie na prośbę jest warunkowe: lista widoczna od razu nie kosztuje 60 s
    expect(miedzy.some((k) => k.nazwa === 'runFlow' && k.arg?.when?.notVisible?.id === 'projekty-lista')).toBe(true);
    // zrzut przed czekaniem: dowód, że prośba się pojawiła (opóźnienie, nie błąd aplikacji)
    expect(miedzy.slice(0, czekanie).some((k) => k.nazwa === 'takeScreenshot')).toBe(true);
  });
});

describe('E2-138-S3 · 47: po restarcie aplikacja otwiera ekran wzoru', () => {
  test('po restart.yaml czekanie na wzor-widok zamiast tapOn licznik-wzor', () => {
    const l = lista('47');
    const r = l.findIndex((k) => k.nazwa === 'runFlow' && String(k.arg?.file ?? '').endsWith('restart.yaml'));
    expect(r).toBeGreaterThan(-1);
    expect(l.slice(r + 1).some((k) => k.nazwa === 'tapOn' && idy(k).includes('licznik-wzor'))).toBe(false);
    const w = l.findIndex((k, i) => i > r && k.nazwa === 'extendedWaitUntil' && idy(k).includes('wzor-widok'));
    expect(w).toBeGreaterThan(r);
    const a = l.findIndex((k, i) => i > w && k.nazwa === 'assertVisible' && idy(k).includes('wzor-zakreslenia'));
    expect(a).toBeGreaterThan(w);
    expect(l[a].arg.text).toBe('1 highlight');
  });
});

describe('E2-138-S4 · 30: arkusz „Enter value” przy AX5', () => {
  test('po stuknięciu „Enter value”: zrzut arkusza, potem przewinięcie do pola, dopiero potem asercja pola', () => {
    const l = lista('30');
    const t = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('menu-wpisz-wartosc'));
    expect(t).toBeGreaterThan(-1);
    const a = l.findIndex((k, i) => i > t && k.nazwa === 'assertVisible' && idy(k).includes('wpisz-wartosc-pole'));
    expect(a).toBeGreaterThan(t);
    const miedzy = l.slice(t + 1, a);
    const zrzut = miedzy.findIndex((k) => k.nazwa === 'takeScreenshot');
    const przew = miedzy.findIndex((k) => k.nazwa === 'scrollUntilVisible' && idy(k).includes('wpisz-wartosc-pole'));
    expect(zrzut).toBeGreaterThan(-1);
    expect(przew).toBeGreaterThan(zrzut);
  });
});

describe('E2-138-S5 · 07: zrzut listy po „Not now” z ofert otwartych z okna (A2)', () => {
  test('po oferty-nie-teraz twarda asercja listy i zrzut', () => {
    const l = lista('07');
    const n = ostatni(l, (k) => k.nazwa === 'tapOn' && idy(k).includes('oferty-nie-teraz'));
    expect(n).toBeGreaterThan(-1);
    const twarda = l.findIndex((k, i) => i > n && k.nazwa === 'assertVisible' && !k.arg?.optional && idy(k).includes('projekty-lista'));
    expect(twarda).toBeGreaterThan(n);
    const z = l.findIndex((k, i) => i > twarda && k.nazwa === 'takeScreenshot');
    expect(z).toBeGreaterThan(twarda);
    expect(String(l[z].arg)).toMatch(/lista-po-ofertach/);
  });
});
