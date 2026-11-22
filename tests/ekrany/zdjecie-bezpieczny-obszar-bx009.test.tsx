// BX-009 (PU-228): „Close” podglądu zdjęcia nie leży pod paskiem stanu. Trasa „/zdjecie” (fullScreenModal na czerni) rysowała treść od samej krawędzi ekranu.
// Pierwsza poprawka (152fb307) użyła `SafeAreaView` i nie pomogła: w przebiegu iOS 43774048947 (scenariusz 81, krok 48) hierarchia ma `zdjecie-bezpieczny`
// [0,0][402,874], „Close” [341,0][386,44], dolny pasek [830,874] — wcięcia zerowe. Przyczyna (z kodu biblioteki): natywny `SafeAreaView` czyta wcięcia z najbliższego
// natywnego przodka-dostawcy (`ios/Fabric/RNCSafeAreaViewComponentView.mm`, `findNearestProvider`, bez dostawcy zwraca siebie → 0), a ekran `fullScreenModal`
// (react-native-screens) leży poza natywnym drzewem dostawcy z korzenia. Hook `useSafeAreaInsets` czyta kontekst JS korzenia (wcięcia okna), więc działa.
// Atrapa biblioteki modeluje to, co pokazał iOS: `SafeAreaView` na tej trasie daje zero, hook daje wcięcia iPhone'a z Dynamic Island.
// Test sprawdza, że przycisk stoi pod tymi wcięciami, na stanie wczytanym i na błędzie odczytu (czerwony na `SafeAreaView`, zielony na hooku).
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { systemCzarny } from '../../src/ekrany/motyw';
import { tEn } from './pomoc';

const WCIECIA = { top: 59, bottom: 34, left: 0, right: 0 }; // iPhone z Dynamic Island
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native') as typeof import('react-native');
  // `SafeAreaView` w fullScreenModal: bez natywnego dostawcy w drzewie — zero wcięć (zrzut/hierarchia kroku 48), tylko przekazuje dzieci.
  const SafeAreaView = ({ edges: _edges, style, children, ...reszta }: { edges?: string[]; style?: import('react-native').StyleProp<import('react-native').ViewStyle>; children?: React.ReactNode }) =>
    R.createElement(View, { ...reszta, style }, children);
  return { SafeAreaView, useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }) };
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
  expect(screen.getByTestId('zdjecie-bezpieczny')).toHaveStyle({ backgroundColor: systemCzarny.tlo });
});

test('BX-009: błąd odczytu zdjęć — „Close” także pod paskiem stanu', async () => {
  mockZdjecia.mockResolvedValue({ ok: false, powod: 'zapis' });
  render(<EkranZdjecia />);
  await waitFor(() => expect(screen.getByTestId('zdjecie-blad')).toBeTruthy());
  expect(wcieciaNad(screen.getByTestId('zdjecie-zamknij'), 'paddingTop')).toBeGreaterThanOrEqual(WCIECIA.top);
});
