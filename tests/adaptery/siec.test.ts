// Adapter portu Siec (ADR-0031, 07-jakosc-017, F-55): stan ścieżki sieciowej z modułu Swift `oczko-wzor` (NWPathMonitor) — 'jest' | 'brak' | 'nieznany'.
// Moduł jest atrapą tylko na granicy platformy (Swift nie kompiluje się w Linuksie). Build E2E z `oczkoE2eSiec=brak` zwraca stałe 'brak' (adapter E2E).
// K-17i: stan sieci czyta się tylko przez port — `siecWylaczona` poza tryb-e2e.ts i adapterem nie występuje.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { StanSieci } from '../../src/domena/porty';
import { siecPlatformy } from '../../src/platforma/siec';

type Zdarzenie = (e: { stan: string }) => void;
function modul(poczatkowy: string | (() => string)) {
  const sluchacze = new Set<Zdarzenie>();
  const remove = jest.fn();
  const addListener = jest.fn((_n: 'siecZmiana', fn: Zdarzenie) => { sluchacze.add(fn); return { remove: () => { sluchacze.delete(fn); remove(); } }; });
  return { siecStan: () => (typeof poczatkowy === 'function' ? poczatkowy() : poczatkowy), addListener, emit: (stan: string) => { for (const f of sluchacze) f({ stan }); }, remove, sluchacze };
}

test.each<[string, StanSieci]>([['jest', 'jest'], ['brak', 'brak'], ['nieznany', 'nieznany']])('stan() oddaje stan z modułu: %s', (z, oczekiwany) => {
  expect(siecPlatformy(modul(z)).stan()).toBe(oczekiwany);
});
test.each(['', 'online', 'JEST', 'undefined'])('stan() z nieznanym napisem %j z modułu → „nieznany” (nie zgadujemy)', (z) => {
  expect(siecPlatformy(modul(z)).stan()).toBe('nieznany');
});
test('stan() gdy moduł rzuca wyjątek albo go nie ma → „nieznany” (próbujemy, jak przy „jest”)', () => {
  expect(siecPlatformy(modul(() => { throw new Error('moduł'); })).stan()).toBe('nieznany');
  const bez = siecPlatformy(null);
  expect(bez.stan()).toBe('nieznany');
  expect(() => bez.obserwuj(jest.fn())()).not.toThrow();
});
test('obserwuj: zdarzenie siecZmiana trafia do odbiorcy jako StanSieci, zły napis → „nieznany”; odpięcie zwalnia nasłuch (remove)', () => {
  const m = modul('nieznany');
  const fn = jest.fn();
  const odepnij = siecPlatformy(m).obserwuj(fn);
  m.emit('jest'); m.emit('brak'); m.emit('cos');
  expect(fn.mock.calls.map((c) => c[0])).toEqual(['jest', 'brak', 'nieznany']);
  odepnij();
  expect(m.remove).toHaveBeenCalledTimes(1);
  m.emit('jest');
  expect(fn).toHaveBeenCalledTimes(3);
});

// Build E2E: `oczkoE2eSiec=brak` (NFR-OFF-001) → adapter E2E daje „brak” bez pytania modułu; bez argumentu (albo poza E2E) działa adapter produkcyjny.
function siecE2e(e2e: boolean, argumenty: Record<string, string>, m: ReturnType<typeof modul>) {
  let wynik: ReturnType<typeof import('../../src/platforma/siec').siecAplikacji> | undefined;
  const przed = process.env.EXPO_PUBLIC_E2E;
  if (e2e) process.env.EXPO_PUBLIC_E2E = '1'; else delete process.env.EXPO_PUBLIC_E2E;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'ios' }, Settings: { get: (k: string) => argumenty[k] } }));
    jest.doMock('../../src/kompozycja/e2e/panele', () => ({}));
    jest.doMock('../../src/kompozycja/e2e/skrzynka', () => ({}));
    jest.doMock('../../modules/oczko-wzor', () => ({ natywny: () => m }));
    wynik = (require('../../src/platforma/siec') as typeof import('../../src/platforma/siec')).siecAplikacji();
  });
  if (przed === undefined) delete process.env.EXPO_PUBLIC_E2E; else process.env.EXPO_PUBLIC_E2E = przed;
  if (!wynik) throw new Error('adapter nie załadowany');
  return wynik;
}
test('adapter E2E: oczkoE2eSiec=brak → stan „brak” (moduł nie pytany), obserwuj bez nasłuchu', () => {
  const m = modul('jest');
  const s = siecE2e(true, { oczkoE2eSiec: 'brak' }, m);
  expect(s.stan()).toBe('brak');
  s.obserwuj(jest.fn())();
  expect(m.addListener).not.toHaveBeenCalled();
});
test('bez argumentu E2E albo poza buildem E2E: adapter produkcyjny z modułu', () => {
  expect(siecE2e(true, {}, modul('jest')).stan()).toBe('jest');
  expect(siecE2e(false, { oczkoE2eSiec: 'brak' }, modul('jest')).stan()).toBe('jest');
});

// K-17i: stan sieci tylko przez port.
const KORZEN = join(__dirname, '../..');
function pliki(d: string, wynik: string[] = []): string[] {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) pliki(p, wynik); else if (/\.tsx?$/.test(n)) wynik.push(p);
  }
  return wynik;
}
test('K-17i: `siecWylaczona` występuje tylko w tryb-e2e.ts (definicja) i w adapterze src/platforma/siec.ts', () => {
  const trafienia = [...pliki(join(KORZEN, 'src')), ...pliki(join(KORZEN, 'app'))]
    .filter((p) => readFileSync(p, 'utf8').includes('siecWylaczona')).map((p) => relative(KORZEN, p)).sort();
  expect(trafienia).toEqual(['src/platforma/siec.ts', 'src/platforma/tryb-e2e.ts']);
});
