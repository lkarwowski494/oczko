/* Przebieg „Jakość · iOS” #145 (raport 07-e2-145, P-489, punkty 3a–3c). Trzy przyczyny w scenariuszach (nie w aplikacji):
 *  3a · 10 (NFR-DAN-002) i 29 (NFR-DOS-001): seria `tapOn licznik-plus repeat 3 delay 150` + baner serii trwała 7 s na wolnej maszynie, a okno strażnika (RD-17)
 *      ma 2 s (`STRAZNIK_OKNO_S`) → baner nie powstaje. Wzór jak w 04 i 12 (E2E-A4, P-358): argument `oczkoE2eOknoStraznika`. `subflows/restart.yaml` przekazuje go z parametru
 *      `OKNO` (brak → 2 s, jak okno z konfiguracji, więc pozostałe scenariusze bez zmian); 10 i 29 podają 15. W 29 restart zastępuje odstęp: nowy proces nie pamięta
 *      wcześniejszego +1, więc pierwsze +1 nie wchodzi do serii bez 15 s czekania.
 *  3b · 42 (P-191): `extendedWaitUntil zdjecia-miniatura` 20 s optional → `runFlow when notVisible` → 60 s, asercja końcowa twarda — jak w 17 (E2-137-S3).
 *  3c · 41 (BR-KAL-003/S1): `tapOn probka-szerokosc` trafiał w pole zasłonięte klawiaturą po polu `probka-oczka`. `hideKeyboard` odpada: klawiatura dziesiętna iOS nie ma akcji
 *      schowania (kontrola maestro-scenariusze: „hideKeyboard po polu liczbowym”), więc `scrollUntilVisible … centerElement` przed stuknięciem (ScrollView z `automaticallyAdjustKeyboardInsets`). */
import * as fs from 'fs';
import * as path from 'path';
import { STRAZNIK_OKNO_S } from '../../src/konfiguracja';
import { kroki, wczytaj, wyrazenie } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any }; // eslint-disable-line @typescript-eslint/no-explicit-any -- struktura YAML scenariusza
const plik = (n: string) => fs.readdirSync(KAT).find((f) => f.startsWith(`${n}-`)) as string;
const lista = (n: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik(n))).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const a = k.arg;
  const id = typeof a === 'object' && a ? (a.id ?? a.element?.id ?? a.visible?.id ?? a.when?.visible?.id ?? a.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};
const jestRestartem = (k: Krok) => k.nazwa === 'runFlow' && String(k.arg?.file ?? '').endsWith('restart.yaml');
const jestSeria = (k: Krok) => k.nazwa === 'tapOn' && idy(k).includes('licznik-plus') && k.arg.repeat === 3;
const OKNO_E2E = '15';

describe('E2-145-3a · restart.yaml przekazuje okno strażnika z parametru OKNO', () => {
  // 07-e2e (ZM-18, 2026-11-08): launchApp restartu leży w restart-dzis.yaml (zimny start na „Dziś”); restart.yaml przekazuje mu OKNO i TERAZ.
  const restart = wczytaj(path.join(KAT, 'subflows/restart.yaml'));
  const restartDzis = wczytaj(path.join(KAT, 'subflows/restart-dzis.yaml'));
  const start = [...kroki(restartDzis.polecenia)].find((k) => k.nazwa === 'launchApp');
  const doDzis = [...kroki(restart.polecenia)].find((k) => k.nazwa === 'runFlow' && String(k.arg?.file ?? '').endsWith('restart-dzis.yaml'));
  const env = doDzis?.arg?.env as Record<string, string> | undefined;
  const ocenWyr = (w: string | undefined, e: Record<string, string>): unknown => {
    const m = /^\$\{(.*)\}$/s.exec(String(w));
    expect(m).not.toBeNull();
    return wyrazenie(m![1], { env: e, output: {}, maestro: {} });
  };
  test('restart.yaml woła restart-dzis.yaml z TERAZ i OKNO (brak OKNO → okno z konfiguracji, z OKNO → jego wartość)', () => {
    expect(env?.TERAZ).toBe('${TERAZ}');
    expect(Number(ocenWyr(env?.OKNO, { TERAZ: 'x' }))).toBe(STRAZNIK_OKNO_S);
    expect(String(ocenWyr(env?.OKNO, { TERAZ: 'x', OKNO: OKNO_E2E }))).toBe(OKNO_E2E);
  });
  const wartosc = start?.arg?.arguments?.oczkoE2eOknoStraznika as string | undefined;
  const ocen = (env: Record<string, string>): unknown => {
    const m = /^\$\{(.*)\}$/s.exec(String(wartosc));
    expect(m).not.toBeNull();
    return wyrazenie(m![1], { env, output: {}, maestro: {} });
  };

  test('launchApp restartu ma argument oczkoE2eOknoStraznika jako wyrażenie z parametru OKNO', () => {
    expect(wartosc).toBeDefined();
    expect(String(wartosc)).toContain('OKNO');
  });
  test('bez parametru OKNO okno = okno z konfiguracji (2 s) — scenariusze bez parametru zachowują się jak dotąd; Maestro nie dostaje nieznanej zmiennej', () => {
    expect(() => ocen({ TERAZ: '2026-11-10T19:31:00' })).not.toThrow();
    expect(Number(ocen({ TERAZ: '2026-11-10T19:31:00' }))).toBe(STRAZNIK_OKNO_S);
  });
  test('z parametrem OKNO przekazuje jego wartość', () => {
    expect(String(ocen({ TERAZ: '2026-11-10T19:31:00', OKNO: OKNO_E2E }))).toBe(OKNO_E2E);
  });
  test('zegar i brak sieci zostają (oczkoE2eTeraz, oczkoE2eSiec)', () => {
    expect(start?.arg?.arguments).toMatchObject({ oczkoE2eTeraz: '${TERAZ}', oczkoE2eSiec: 'brak' });
    expect(start?.arg?.clearState).toBe(false);
  });
});

describe.each(['10', '29'])('E2-145-3a · %s: okno strażnika 15 s przy serii 3 stuknięć', (n) => {
  test('każdy restart.yaml przed serią dostaje OKNO 15 (okno aplikacji > 7 s serii z #145)', () => {
    const l = lista(n);
    const seria = l.findIndex(jestSeria);
    expect(seria).toBeGreaterThan(-1);
    const restarty = l.slice(0, seria).filter(jestRestartem);
    expect(restarty.length).toBeGreaterThan(0);
    for (const r of restarty) expect(String(r.arg.env?.OKNO)).toBe(OKNO_E2E);
  });
  test('ostatni restart przed serią jest po ostatnim zwykłym +1 (inaczej wcześniejsze +1 wchodzi do serii: „Undo 4 rows”)', () => {
    const l = lista(n);
    const seria = l.findIndex(jestSeria);
    const restart = l.map((k, i) => (jestRestartem(k) ? i : -1)).filter((i) => i >= 0 && i < seria).pop() as number;
    const plusy = l.map((k, i) => (k.nazwa === 'tapOn' && idy(k).includes('licznik-plus') && !jestSeria(k) ? i : -1)).filter((i) => i >= 0 && i < seria);
    expect(restart).toBeGreaterThan(-1);
    for (const i of plusy) expect(i).toBeLessThan(restart);
  });
});

describe('E2-145-3a · 29: zachowane asercje serii', () => {
  test('„Undo 3 rows” widoczne, stuknięte, licznik wraca do 1', () => {
    const l = lista('29');
    const seria = l.findIndex(jestSeria);
    expect(l[seria + 1]).toEqual({ nazwa: 'assertVisible', arg: { id: 'licznik-wartosc', text: '4' } });
    expect(l[seria + 2]).toEqual({ nazwa: 'assertVisible', arg: 'Undo 3 rows' });
    expect(l[seria + 3]).toEqual({ nazwa: 'tapOn', arg: 'Undo 3 rows' });
    expect(l[seria + 4]).toEqual({ nazwa: 'assertVisible', arg: { id: 'licznik-wartosc', text: '1' } });
  });
});

describe('E2-145-3b · 42: czekanie na miniaturę jak w 17', () => {
  const l = lista('42');
  const test1 = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('e2e-zdjecie-testowe'));
  test('20 s optional → runFlow when notVisible → 60 s bez optional → asercja końcowa twarda', () => {
    expect(test1).toBeGreaterThan(-1);
    const czekanie = l[test1 + 1];
    expect(czekanie.nazwa).toBe('extendedWaitUntil');
    expect(czekanie.arg).toMatchObject({ visible: { id: 'zdjecia-miniatura' }, timeout: 20000, optional: true });
    const gdy = l[test1 + 2];
    expect(gdy.nazwa).toBe('runFlow');
    expect(gdy.arg.when).toEqual({ notVisible: { id: 'zdjecia-miniatura' } });
    const dlugie = (gdy.arg.commands as Array<Record<string, any>>).find((c) => c.extendedWaitUntil); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(dlugie?.extendedWaitUntil).toMatchObject({ visible: { id: 'zdjecia-miniatura' }, timeout: 60000 });
    expect(dlugie?.extendedWaitUntil.optional).not.toBe(true);
    const koncowa = l.slice(test1 + 3).find((k) => k.nazwa === 'assertVisible' && idy(k).includes('zdjecia-miniatura'));
    expect(koncowa).toBeDefined();
    expect(koncowa!.arg.optional).not.toBe(true);
  });
  test('dowód opóźnienia (zrzut) w gałęzi „when notVisible”', () => {
    const gdy = l[test1 + 2].arg.commands as Array<Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(gdy.some((c) => c.takeScreenshot)).toBe(true);
  });
  test('usunięcie po podglądzie: asercje końcowe bez zmian', () => {
    expect(l.some((k) => k.nazwa === 'assertNotVisible' && idy(k).includes('zdjecia-miniatura'))).toBe(true);
    expect(l.some((k) => k.nazwa === 'assertVisible' && idy(k).includes('zdjecia-dodaj'))).toBe(true);
  });
});

describe('E2-145-3c · 41: pole szerokości poza klawiaturą przed stuknięciem', () => {
  const l = lista('41');
  const stuk = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('probka-szerokosc'));
  test('tuż przed tapOn probka-szerokosc jest scrollUntilVisible z centerElement (nie hideKeyboard)', () => {
    expect(stuk).toBeGreaterThan(-1);
    const przed = l.slice(0, stuk);
    const scroll = przed.map((k, i) => (k.nazwa === 'scrollUntilVisible' && idy(k).includes('probka-szerokosc') ? i : -1)).filter((i) => i >= 0).pop() as number;
    expect(scroll).toBeGreaterThan(-1);
    expect(l[scroll].arg.centerElement).toBe(true);
    expect(przed.slice(scroll + 1).some((k) => ['tapOn', 'inputText', 'eraseText'].includes(k.nazwa))).toBe(false);
    expect(l.some((k) => k.nazwa === 'hideKeyboard')).toBe(false);
  });
  test('asercje wyniku bez zmian', () => {
    expect(l.some((k) => k.nazwa === 'assertVisible' && k.arg?.id === 'probka-wynik-oczka' && k.arg.text === '.*50 stitches.*')).toBe(true);
    expect(l.some((k) => k.nazwa === 'assertVisible' && k.arg === '= 19.7 stitches per 10 cm')).toBe(true);
    expect(l.some((k) => k.nazwa === 'assertVisible' && k.arg?.id === 'probka-szerokosc' && k.arg.text === '10')).toBe(true);
  });
});
