// BX-009 (PU-228): „Close” podglądu zdjęcia nie leży pod paskiem stanu. Trasa „/zdjecie” (fullScreenModal na czerni) rysowała treść od samej krawędzi ekranu
// (`app/zdjecie.tsx` bez bezpiecznego obszaru; zrzut kroku 48 scenariusza 81 nakłada „Close” na baterię). Poprawka: `SafeAreaView` z tej samej biblioteki co `Bezpieczny`,
// ale na czerni z tokenu `systemCzarny.tlo` (bez zmiany wyglądu). Jest nie umie policzyć natywnych wcięć, więc `SafeAreaView` ma tu wierną atrapę:
// dokłada `padding*` z wcięć urządzenia dla krawędzi z `edges` — test sprawdza, że przycisk stoi pod tymi wcięciami, na stanie wczytanym i na błędzie odczytu.
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import tokeny from '../../docs/design/tokeny.json';
import { tEn } from './pomoc';

const WCIECIA = { top: 59, bottom: 34, left: 0, right: 0 }; // iPhone z Dynamic Island
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native') as typeof import('react-native');
  const wciecia = { top: 59, bottom: 34, left: 0, right: 0 } as const;
  const SafeAreaView = ({ edges, style, children, ...reszta }: { edges?: ('top' | 'bottom' | 'left' | 'right')[]; style?: import('react-native').StyleProp<import('react-native').ViewStyle>; children?: React.ReactNode }) =>
    R.createElement(View, { ...reszta, style: [style, ...(edges ?? []).map((e) => ({ ['padding' + e[0]!.toUpperCase() + e.slice(1)]: wciecia[e] }))] }, children);
  return { SafeAreaView };
});

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => ({ projekt: 'p1' }), useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
const mockZdjecia = jest.fn();
jest.mock('../../src/przypadki-uzycia/zdjecia', () => ({ zdjecia: (...a: unknown[]) => mockZdjecia(...a), usunZdjecie: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranZdjecia = (require('../../app/zdjecie') as { default: React.ComponentType }).default;

/** Suma wcięć od góry (`paddingTop`) wszystkich przodków węzła — tyle ekranu zajmuje to, co leży nad nim. */
function wcieciaNad(w: ReactTestInstance, strona: 'paddingTop' | 'paddingBottom'): number {
  let suma = 0;
  for (let n: ReactTestInstance | null = w.parent; n; n = n.parent) {
    const stylNaWezle = StyleSheet.flatten(n.props.style as never) as Record<string, number> | undefined;
    suma += stylNaWezle?.[strona] ?? 0;
  }
  return suma;
}

beforeEach(async () => {
  jest.clearAllMocks();
  const t = await tEn();
  mockAplikacja = { kontener: { z: { magazyn: { sciezka: (sha: string) => `/m/${sha}` }, id: { nowy: () => 'x' }, katalogi: { tymczasowy: '/tmp' } }, j: { t } } };
});

test('BX-009 / PU-228: podgląd zdjęcia — „Close” i „Share” leżą pod paskiem stanu i nad wskaźnikiem Home; tło zostaje czarne', async () => {
  mockZdjecia.mockResolvedValue({ ok: true, wartosc: [{ id: 'a', sha256: 'aa' }] });
  render(<EkranZdjecia />);
  const zamknij = await screen.findByTestId('zdjecie-zamknij');
  expect(wcieciaNad(zamknij, 'paddingTop')).toBeGreaterThanOrEqual(WCIECIA.top);
  expect(wcieciaNad(screen.getByTestId('zdjecie-udostepnij'), 'paddingBottom')).toBeGreaterThanOrEqual(WCIECIA.bottom);
  expect(screen.getByTestId('zdjecie-bezpieczny')).toHaveStyle({ backgroundColor: tokeny.kolory.systemCzarny.tlo });
});

test('BX-009: błąd odczytu zdjęć — „Close” także pod paskiem stanu', async () => {
  mockZdjecia.mockResolvedValue({ ok: false, powod: 'zapis' });
  render(<EkranZdjecia />);
  await waitFor(() => expect(screen.getByTestId('zdjecie-blad')).toBeTruthy());
  expect(wcieciaNad(screen.getByTestId('zdjecie-zamknij'), 'paddingTop')).toBeGreaterThanOrEqual(WCIECIA.top);
});
