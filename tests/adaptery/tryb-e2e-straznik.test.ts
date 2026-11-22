// E2E-A4 (raport E2E #135, P-358 opcja 1): argument startu `oczkoE2eOknoStraznika=<s>` wydłuża okno strażnika serii (RD-17) z 2 s do podanej liczby sekund,
// bo czas trzech stuknięć Maestro zależy od maszyny (#131: 2,45 s, #135: 4,18 s). Czytany tylko w tryb-e2e.ts i tylko przy EXPO_PUBLIC_E2E=1;
// domena z oknem 2 s (STRAZNIK_OKNO_S) ma osobne testy jednostkowe — tu sprawdzamy podłączenie argumentu.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STRAZNIK_OKNO_S } from '../../src/konfiguracja';
import type * as TrybE2e from '../../src/platforma/tryb-e2e';

type Tryb = typeof TrybE2e;

function zaladuj(e2e: boolean, argumenty: Record<string, string>): Tryb {
  let m: Tryb | undefined;
  const przed = process.env.EXPO_PUBLIC_E2E;
  if (e2e) process.env.EXPO_PUBLIC_E2E = '1'; else delete process.env.EXPO_PUBLIC_E2E;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'ios' }, Settings: { get: (k: string) => argumenty[k] } }));
    jest.doMock('../../src/kompozycja/e2e/panele', () => ({}));
    m = require('../../src/platforma/tryb-e2e') as Tryb;
  });
  if (przed === undefined) delete process.env.EXPO_PUBLIC_E2E; else process.env.EXPO_PUBLIC_E2E = przed;
  if (!m) throw new Error('moduł nie załadowany');
  return m;
}

test('okno domenowe zostaje 2 s (argument E2E nie zmienia konfiguracji produktu)', () => {
  expect(STRAZNIK_OKNO_S).toBe(2);
});

test.each([['6', 6], ['10', 10], ['2.5', 2.5]])('oczkoE2eOknoStraznika=%p w E2E → okno %p s', (a, s) => {
  expect(zaladuj(true, { oczkoE2eOknoStraznika: a }).oknoStraznikaS()).toBe(s);
});

test.each([[''], ['abc'], ['0'], ['-6'], ['601'], ['NaN'], ['Infinity']])('zła wartość %p w E2E → okno z konfiguracji', (a) => {
  expect(zaladuj(true, { oczkoE2eOknoStraznika: a }).oknoStraznikaS()).toBe(STRAZNIK_OKNO_S);
});

test('bez argumentu w E2E → okno z konfiguracji', () => {
  expect(zaladuj(true, {}).oknoStraznikaS()).toBe(STRAZNIK_OKNO_S);
});

test('bez EXPO_PUBLIC_E2E=1 argument jest ignorowany (build wydania)', () => {
  expect(zaladuj(false, { oczkoE2eOknoStraznika: '6' }).oknoStraznikaS()).toBe(STRAZNIK_OKNO_S);
});

test('kompozycja podłącza okno do zależności przypadków użycia (kontener.ts) — jedyne miejsce, które czyta argument', () => {
  const kontener = readFileSync(join(__dirname, '../../src/kompozycja/kontener.ts'), 'utf8');
  expect(kontener).toMatch(/straznikOknoS:\s*oknoStraznikaS\(\)/);
});
