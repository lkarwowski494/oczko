// BX16 / KO-121 (a), scenariusz 122 (kopia pomiaru 31 bez panelu `e2e-licznik-wejscia`): argument startu `oczkoE2eBezDiagnostykiLicznika=1` wyłącza diagnostykę ścieżki „+1”
// tylko w buildzie E2E (EXPO_PUBLIC_E2E=1). Poza nim (build wydania) argument jest ignorowany — jak każdy `oczkoE2e*` (tryb-e2e.ts `argument()`).
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

test('oczkoE2eBezDiagnostykiLicznika=1 w E2E → diagnostyka licznika wyłączona', () => {
  expect(zaladuj(true, { oczkoE2eBezDiagnostykiLicznika: '1' }).bezDiagnostykiLicznika()).toBe(true);
});

test.each([[''], ['0'], ['tak'], ['true'], ['11']])('wartość %p w E2E → diagnostyka zostaje (tylko „1” wyłącza)', (a) => {
  expect(zaladuj(true, { oczkoE2eBezDiagnostykiLicznika: a }).bezDiagnostykiLicznika()).toBe(false);
});

test('bez argumentu w E2E → diagnostyka zostaje (scenariusz 31 bez zmian)', () => {
  expect(zaladuj(true, {}).bezDiagnostykiLicznika()).toBe(false);
});

test('bez EXPO_PUBLIC_E2E=1 argument jest ignorowany (build wydania)', () => {
  expect(zaladuj(false, { oczkoE2eBezDiagnostykiLicznika: '1' }).bezDiagnostykiLicznika()).toBe(false);
});
