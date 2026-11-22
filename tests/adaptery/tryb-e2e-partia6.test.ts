// Argumenty startu buildu E2E partii 6 (e2e/README.md „Argumenty startu”; P-225 Q2a, P-230 Q2a, P-237 (1), P-238): `oczkoE2eSzerokoscOkna`
// i `oczkoE2eSkrzynka` czytane tylko w tryb-e2e.ts i tylko przy EXPO_PUBLIC_E2E=1; poza E2E argumenty są ignorowane.
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

test.each([
  ['375', 375], ['320', 320], ['1024.5', 1024.5],
  ['', null], ['abc', null], ['0', null], ['-375', null], ['99999', null],
])('oczkoE2eSzerokoscOkna=%p w E2E → %p', (a, w) => {
  expect(zaladuj(true, { oczkoE2eSzerokoscOkna: a }).szerokoscOknaE2e()).toBe(w);
});

test('bez EXPO_PUBLIC_E2E=1 oba argumenty ignorowane (build wydania)', () => {
  const m = zaladuj(false, { oczkoE2eSzerokoscOkna: '375', oczkoE2eSkrzynka: 'pdf' });
  expect(m.szerokoscOknaE2e()).toBeNull();
  expect(m.skrzynkaE2e()).toBeNull();
});

test('oczkoE2eSkrzynka: tylko „pdf”', () => {
  expect(zaladuj(true, { oczkoE2eSkrzynka: 'pdf' }).skrzynkaE2e()).toBe('pdf');
  expect(zaladuj(true, { oczkoE2eSkrzynka: 'docx' }).skrzynkaE2e()).toBeNull();
  expect(zaladuj(true, {}).skrzynkaE2e()).toBeNull();
});

// P-266 (przebieg 121, scen. 52): build symulatora bez podpisu nie ma uprawnienia App Group („client is not entitled” w logu urządzenia),
// więc `katalogGrupyAplikacji` = null i zlecenie testowe nie trafia do skrzynki. W E2E z `oczkoE2eSkrzynka=pdf` skrzynka i migawka używają
// katalogu zastępczego w danych aplikacji (nazwany wyjątek: E2E nie sprawdza kontenera App Group — lista urządzenia U5).
test('grupaAplikacjiE2e: prawdziwa grupa ma pierwszeństwo; bez niej katalog zastępczy tylko w E2E z oczkoE2eSkrzynka=pdf', () => {
  expect(zaladuj(true, { oczkoE2eSkrzynka: 'pdf' }).grupaAplikacjiE2e(null, '/dane')).toBe('/dane/e2e-grupa');
  expect(zaladuj(true, { oczkoE2eSkrzynka: 'pdf' }).grupaAplikacjiE2e('/grupa', '/dane')).toBe('/grupa');
  expect(zaladuj(true, {}).grupaAplikacjiE2e(null, '/dane')).toBeNull();
  expect(zaladuj(false, { oczkoE2eSkrzynka: 'pdf' }).grupaAplikacjiE2e(null, '/dane')).toBeNull();
  expect(zaladuj(false, {}).grupaAplikacjiE2e('/grupa', '/dane')).toBe('/grupa');
});
