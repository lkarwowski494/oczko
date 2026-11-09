/* 07 cz. 2 (2026-11-08): scenariusze E2E na kontrakt licznika TO BE — akcje pod liczbą (ZM-04), menu ••• jako menu systemowe (ZM-05),
 * „Projekt ›” (P-580 a), „Cel” z menu ustawień liczenia (P-581 a), powrót z licznika `nav-wstecz` (P-583). Kontrakt: docs/design/testid.md, M3-TESTID-02.
 * Wyrocznia: kontrakt testID i decyzje, nie kod aplikacji (p3a jeszcze nie istnieje — scenariusze są czerwone na iOS do p3a z właściwego powodu).
 * Każda reguła ma pułapkę: ta sama funkcja na liście kroków AS IS zwraca błąd. */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const pliki = (): string[] => [
  ...fs.readdirSync(KAT).filter((f) => /^\d\d-.*\.yaml$/.test(f)), // jak maestro-scenariusze.test.ts:17 (config.yaml to nie scenariusz)
  ...fs.readdirSync(path.join(KAT, 'subflows')).filter((f) => f.endsWith('.yaml')).map((f) => `subflows/${f}`),
];
const lista = (plik: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik)).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const a = k.arg;
  const id = typeof a === 'object' && a ? (a.id ?? a.element?.id ?? a.visible?.id ?? a.notVisible?.id ?? a.when?.visible?.id ?? a.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};
const stuka = (k: Krok, id: string) => k.nazwa === 'tapOn' && idy(k).includes(id);
const PRZEZROCZYSTE = new Set(['takeScreenshot', 'waitForAnimationToEnd', 'assertVisible']);

/** Akcje pod liczbą (testid.md: Akcje i nagłówek). AX5: lista akcji leży pod notatką i bywa poza ekranem — przed stuknięciem scrollUntilVisible (testid.md:158). */
export const AKCJE = ['licznik-akcja-notatka', 'licznik-wzor', 'licznik-cel', 'licznik-stoper', 'licznik-historia'];
/** Pozycje menu „Cel” (P-581 a) i menu ••• (ZM-05 + `menu-nazwa`, P-581 a). */
export const MENU_CEL = ['menu-cel', 'menu-przypomnienie', 'menu-powtorzenie'];
export const MENU_WIECEJ = ['menu-nazwa', 'menu-wpisz-wartosc', 'menu-znaczenie', 'menu-zeruj', 'menu-zablokuj', 'menu-odblokuj', 'menu-ukoncz'];
/** Wycofane z kontraktu: `menu-wzor` → `licznik-wzor`; `menu-grupa-*` (grupy dzieli menu systemowe). */
const WYCOFANE = /^(menu-wzor|menu-grupa-.*)$/;
/** Kroki, po których scenariusz stoi na liczniku (koniec podprzepływu albo asercja elementu licznika). */
const NA_LICZNIKU = ['licznik-plus', 'licznik-wartosc', 'licznik-minus', 'limit-zawczasu', 'licznik-menu'];
const PODPRZEPLYWY_NA_LICZNIK = /subflows\/(start-czysty|projekt-roboczy|nazwij-projekt|wpisz-wartosc)\.yaml$/;

export function bledyAkcji(l: Krok[]): string[] {
  const out: string[] = [];
  l.forEach((k, i) => {
    const akcja = AKCJE.find((a) => stuka(k, a));
    if (!akcja) return;
    let j = i - 1;
    while (j >= 0 && PRZEZROCZYSTE.has(l[j].nazwa)) j--;
    if (!(j >= 0 && l[j].nazwa === 'scrollUntilVisible' && idy(l[j]).includes(akcja))) out.push(`krok ${i}: tapOn ${akcja} bez scrollUntilVisible tej akcji tuż przed (AX5, testid.md:158)`);
  });
  return out;
}

/** Pozycja menu wymaga właściwego otwierającego: ostatnie stuknięcie w `licznik-menu` albo `licznik-cel` przed nią. */
export function bledyMenu(l: Krok[]): string[] {
  const out: string[] = [];
  let otwarte: string | null = null;
  l.forEach((k, i) => {
    if (stuka(k, 'licznik-menu')) otwarte = 'licznik-menu';
    else if (stuka(k, 'licznik-cel')) otwarte = 'licznik-cel';
    if (!['tapOn', 'assertVisible'].includes(k.nazwa)) return;
    for (const id of idy(k)) {
      if (MENU_CEL.includes(id) && otwarte !== 'licznik-cel') out.push(`krok ${i}: ${id} bez „Cel” (licznik-cel) przed nim — P-581 (a); otwarte: ${otwarte}`);
      if (MENU_WIECEJ.includes(id) && otwarte !== 'licznik-menu') out.push(`krok ${i}: ${id} bez ••• (licznik-menu) przed nim; otwarte: ${otwarte}`);
    }
  });
  return out;
}

/** Jedno miejsce zmiany sposobu zamknięcia menu ••• / „Cel”: po otwarciu pierwsze stuknięcie nie może być wprost `arkusz-zamknij`, tylko `subflows/zamknij-menu.yaml` (od P-586 (a) to on stuka „Cancel” arkusza). */
export function bledyZamkniecia(l: Krok[]): string[] {
  const out: string[] = [];
  l.forEach((k, i) => {
    if (!stuka(k, 'licznik-menu') && !stuka(k, 'licznik-cel')) return;
    const nast = l.slice(i + 1).find((x) => x.nazwa === 'tapOn' || x.nazwa === 'runFlow');
    if (nast && stuka(nast, 'arkusz-zamknij')) out.push(`krok ${i}: menu zamknięte wprost przez arkusz-zamknij zamiast subflows/zamknij-menu.yaml (jedno miejsce zmiany)`);
  });
  return out;
}

/** Na liczniku nie ma `nav-projekty` (P-583): stuknięcie zakładki, gdy ostatni stan to licznik, jest błędem — najpierw `nav-wstecz`. */
export function bledyPowrotu(l: Krok[]): string[] {
  const out: string[] = [];
  l.forEach((k, i) => {
    if (!stuka(k, 'nav-projekty') || k.arg?.optional) return;
    let j = i - 1;
    while (j >= 0 && ['takeScreenshot', 'waitForAnimationToEnd'].includes(l[j].nazwa)) j--;
    const p = l[j];
    if (!p) return;
    const naLiczniku = (['assertVisible', 'extendedWaitUntil'].includes(p.nazwa) && idy(p).some((x) => NA_LICZNIKU.includes(x)))
      || (p.nazwa === 'runFlow' && PODPRZEPLYWY_NA_LICZNIK.test(String(typeof p.arg === 'string' ? p.arg : p.arg?.file ?? '')))
      || (['assertVisible', 'assertNotVisible'].includes(p.nazwa) && typeof p.arg === 'string');
    if (naLiczniku) out.push(`krok ${i}: tapOn nav-projekty z licznika (P-583: najpierw nav-wstecz) — poprzedni krok: ${p.nazwa} ${JSON.stringify(p.arg)}`);
  });
  return out;
}

describe('07 cz. 2 · scenariusze na kontrakt licznika TO BE (M3-TESTID-02)', () => {
  const wszystkie = pliki();
  test('katalog niepusty (pusta lista to błąd testu)', () => { expect(wszystkie.length).toBeGreaterThan(60); });
  test('brak wycofanych id (`menu-wzor`, `menu-grupa-*`) w scenariuszach i podprzepływach', () => {
    const zle = wszystkie.flatMap((f) => lista(f).flatMap((k) => idy(k).filter((id) => WYCOFANE.test(id)).map((id) => `${f}: ${id}`)));
    expect(zle).toEqual([]);
  });
  test('stuknięcie w akcję pod liczbą poprzedza scrollUntilVisible tej akcji (AX5)', () => {
    expect(wszystkie.flatMap((f) => bledyAkcji(lista(f)).map((b) => `${f}: ${b}`))).toEqual([]);
  });
  test('menu „Cel” (`licznik-cel`) przed `menu-cel`/`menu-przypomnienie`/`menu-powtorzenie`; ••• (`licznik-menu`) przed pozycjami korekty i stanu', () => {
    expect(wszystkie.flatMap((f) => bledyMenu(lista(f)).map((b) => `${f}: ${b}`))).toEqual([]);
  });
  test('menu ••• / „Cel” zamyka `subflows/zamknij-menu.yaml`, nie bezpośrednie `arkusz-zamknij`', () => {
    expect(wszystkie.flatMap((f) => bledyZamkniecia(lista(f)).map((b) => `${f}: ${b}`))).toEqual([]);
  });
  test('z licznika do listy: `nav-wstecz`, potem zakładka `nav-projekty` (P-583)', () => {
    expect(wszystkie.flatMap((f) => bledyPowrotu(lista(f)).map((b) => `${f}: ${b}`))).toEqual([]);
  });
  test('„Projekt ›” to `licznik-projekt-wejscie` (P-580 a); w `licznik-projekt` (sama nazwa) nikt nie stuka; menu zamyka „Cancel” arkusza (P-586 a)', () => {
    const stukniecia = wszystkie.flatMap((f) => lista(f).filter((k) => stuka(k, 'licznik-projekt')).map(() => f));
    // Przebieg 3 (run 42556852569), 32 step-029 i 12 step-033: menu to arkusz na cały ekran, `licznik-projekt` pod nim nie istnieje.
    expect(stukniecia).toEqual([]);
    expect(lista('subflows/zamknij-menu.yaml').some((k) => stuka(k, 'arkusz-zamknij'))).toBe(true);
    expect(wszystkie.filter((f) => lista(f).some((k) => stuka(k, 'licznik-projekt-wejscie'))).length).toBeGreaterThan(10);
  });
  test('scenariusz 57 (notatka) otwiera arkusz akcją `licznik-akcja-notatka`, bez ekranu projektu', () => {
    const f = wszystkie.find((x) => x.startsWith('57-')) as string;
    const l = lista(f);
    expect(l.some((k) => stuka(k, 'licznik-akcja-notatka'))).toBe(true);
    expect(l.some((k) => stuka(k, 'licznik-projekt-wejscie') || idy(k).includes('projekt-notatka'))).toBe(false);
    expect(l.some((k) => k.nazwa === 'assertVisible' && idy(k).includes('licznik-notatka'))).toBe(true);
  });
  test('tabela testID w e2e/README.md: nowe wiersze są, `menu-wzor` i `menu-grupa-*` nie ma', () => {
    const readme = fs.readFileSync(path.join(KAT, '..', 'README.md'), 'utf8');
    for (const id of ['licznik-akcja-notatka', 'licznik-cel', 'licznik-projekt-wejscie', 'menu-zeruj', 'menu-zablokuj', 'menu-odblokuj']) expect(readme).toContain(`| \`${id}\` |`);
    expect(readme).not.toMatch(/\| `menu-wzor` \|/);
    expect(readme).not.toMatch(/\| `menu-grupa-[a-z-]*` \|/);
  });
});

describe('pułapki: każda reguła czerwienieje na krokach AS IS', () => {
  const t = (id: string, extra: object = {}): Krok => ({ nazwa: 'tapOn', arg: { id, ...extra } });
  const a = (id: string): Krok => ({ nazwa: 'assertVisible', arg: { id } });
  test('akcja bez przewinięcia (pasek AS IS: stuknięcie w historię wprost)', () => {
    expect(bledyAkcji([a('licznik-plus'), t('licznik-historia'), a('historia-lista')])).toHaveLength(1);
    expect(bledyAkcji([{ nazwa: 'scrollUntilVisible', arg: { element: { id: 'licznik-historia' } } }, a('licznik-historia'), t('licznik-historia')])).toEqual([]);
  });
  test('powtórzenie z ••• (AS IS) i ••• po „Cel”', () => {
    expect(bledyMenu([t('licznik-menu'), a('menu-powtorzenie'), t('menu-powtorzenie')])).toHaveLength(2);
    expect(bledyMenu([t('licznik-cel'), a('menu-wpisz-wartosc')])).toHaveLength(1);
    expect(bledyMenu([t('licznik-cel'), a('menu-przypomnienie'), t('licznik-menu'), a('menu-nazwa')])).toEqual([]);
  });
  test('zamknięcie menu wprost przez arkusz-zamknij, z pominięciem podprzepływu', () => {
    expect(bledyZamkniecia([t('licznik-menu'), a('menu-nazwa'), t('arkusz-zamknij'), a('licznik-plus')])).toHaveLength(1);
    expect(bledyZamkniecia([t('licznik-menu'), a('menu-nazwa'), { nazwa: 'runFlow', arg: 'subflows/zamknij-menu.yaml' }])).toEqual([]);
  });
  test('nav-projekty z licznika (AS IS: 18, 20, 52; po start-czysty: 16, 33, 40, 41)', () => {
    expect(bledyPowrotu([a('licznik-wartosc'), t('nav-projekty')])).toHaveLength(1);
    expect(bledyPowrotu([{ nazwa: 'runFlow', arg: { file: 'subflows/start-czysty.yaml' } }, t('nav-projekty')])).toHaveLength(1);
    expect(bledyPowrotu([a('licznik-wartosc'), t('nav-wstecz'), { nazwa: 'extendedWaitUntil', arg: { visible: { id: 'nav-projekty' } } }, t('nav-projekty')])).toEqual([]);
  });
});
