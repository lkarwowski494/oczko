/* Scenariusze E2E nieaktualne wobec zamierzonych zmian partii 8 (raport E2, przebieg 136, SHA fcbeef4, 2026-11-02).
 * Każda reguła ma w nazwie ID porażki (E2-136-Sn = scenariusz n) i decyzję/BR, która zmianę uzasadnia. Wyrocznia: wymaganie i kod aplikacji, nie zapis w scenariuszu.
 *  - E2-136-S1 (21, 22, 24, 25, 26): start otwiera ekran wzoru (BR-PRJ-011/S1, 07-jakosc-006 e1c533a, F-49) — po restarcie nie ma licznika do stuknięcia.
 *  - E2-136-S2 (05, 20, 36): okno „Uczciwe zasady” otwiera się na liście projektów, nigdy na liczniku (BR-ZAK-006/S9, ER-46, 07-jakosc-022 3cc9dcb, app/projekty.tsx:27-31) — kolejność kroków poprawiona w E2-137-S1.
 *  - E2-136-S3 (08): wynik eksportu i importu leży poniżej ekranu, bo Ustawienia mają nowe wiersze Keep screen on i Units (ADR-0029, 07-jakosc-004 8511e0b).
 *  - E2-136-S4 (30): akcje arkusza menu przy AX5 przewija się (ArkuszDecyzji = ScrollView, src/ekrany/Arkusz.tsx), tytuł ma limit skali (E2-A1 79b2ffe).
 *  - E2-136-S5 (17): panel E2E „Test photo” leży pod arkuszem „Add photo” przy układzie sprzed przewinięcia (zrzut kroku 48). */
import * as path from 'path';
import { kroki, wczytaj, type Polecenie } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const lista = (plik: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik)).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idKroku = (k: Krok): string | undefined =>
  typeof k.arg === 'object' && k.arg ? (k.arg.id ?? k.arg.element?.id ?? k.arg.visible?.id) : undefined;
const jestRestartem = (k: Krok) => k.nazwa === 'runFlow' && String(k.arg?.file ?? '').endsWith('restart.yaml');
const plik = (n: string) => require('fs').readdirSync(KAT).find((f: string) => f.startsWith(`${n}-`)) as string;

describe('E2-136-S1 · po restarcie start na ekranie wzoru (BR-PRJ-011/S1)', () => {
  for (const n of ['21', '22', '24', '25', '26']) {
    test(`scenariusz ${n}: po restarcie czeka na wzor-widok bez menu licznika`, () => {
      const l = lista(plik(n));
      const r = l.findIndex(jestRestartem);
      expect(r).toBeGreaterThan(-1);
      const po = l.slice(r + 1);
      const wWidok = po.findIndex((k) => idKroku(k) === 'wzor-widok');
      expect(wWidok).toBeGreaterThan(-1);
      expect(po.slice(0, wWidok).some((k) => k.nazwa === 'tapOn' && ['licznik-menu', 'menu-wzor'].includes(idKroku(k) ?? ''))).toBe(false);
    });
  }
});

// E2-136-S2 zastąpiony przez E2-137-S1 (tests/jakosc/e2e-kruchosc-137.test.ts): poprawka #136 zakładała listę widoczną przed zamknięciem okna, a okno jest modalem nad listą (przebieg #137, zrzuty kroków 54/63/75).

describe('E2-136-S3 · wynik eksportu i importu po przewinięciu Ustawień (ADR-0029)', () => {
  const l = lista('08-br-dan-006-s1-eksport-import.yaml');
  const poprzedza = (id: string) => {
    const a = l.findIndex((k) => k.nazwa === 'assertVisible' && idKroku(k) === id);
    expect(a).toBeGreaterThan(-1);
    return l.slice(0, a).some((k) => k.nazwa === 'scrollUntilVisible' && k.arg?.element?.id === id);
  };
  test.each(['eksport-licznosci', 'import-licznosci'])('%s: scrollUntilVisible przed asercją', (id) => { expect(poprzedza(id)).toBe(true); });
  test('po przewinięciu w dół scenariusz wraca do przycisków na górze (e2e-pliki-zachowaj-eksport)', () => {
    const s = l.findIndex((k) => k.nazwa === 'scrollUntilVisible' && k.arg?.element?.id === 'eksport-licznosci');
    const t = l.findIndex((k) => k.nazwa === 'tapOn' && idKroku(k) === 'e2e-pliki-zachowaj-eksport');
    expect(s).toBeGreaterThan(-1);
    const miedzy = l.slice(s + 1, t);
    expect(miedzy.some((k) => k.nazwa === 'scrollUntilVisible' && k.arg?.element?.id === 'e2e-pliki-zachowaj-eksport' && k.arg?.direction === 'UP')).toBe(true);
  });
});

describe('E2-136-S4 · menu licznika przy AX5 (arkusz się przewija)', () => {
  test('scenariusz 30: scrollUntilVisible menu-wpisz-wartosc przed asercją', () => {
    const l = lista(plik('30'));
    const a = l.findIndex((k) => k.nazwa === 'assertVisible' && idKroku(k) === 'menu-wpisz-wartosc');
    expect(a).toBeGreaterThan(-1);
    expect(l.slice(0, a).some((k) => k.nazwa === 'scrollUntilVisible' && k.arg?.element?.id === 'menu-wpisz-wartosc')).toBe(true);
  });
});

describe('E2-136-S5 · przycisk „Test photo” nad arkuszem „Add photo”', () => {
  test('scenariusz 17: zdjecia-dodaj wyśrodkowane przed stuknięciem (przycisk E2E nad arkuszem)', () => {
    const l = lista(plik('17'));
    const t = l.findIndex((k) => k.nazwa === 'tapOn' && idKroku(k) === 'zdjecia-dodaj');
    const s = l.findIndex((k) => k.nazwa === 'scrollUntilVisible' && k.arg?.element?.id === 'zdjecia-dodaj');
    expect(s).toBeGreaterThan(-1);
    expect(s).toBeLessThan(t);
    expect(l[s].arg.centerElement).toBe(true);
  });
});

/** Zapobiega nieużywanemu importowi typu przy zmianie wersji pliku pomocniczego. */
export type _P = Polecenie;
