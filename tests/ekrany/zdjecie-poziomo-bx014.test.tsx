// BX-014 (KO-079; recenzja niezależna FX): w poziomie na iPhonie z wycięciem strony podglądu zdjęć przesuwały się. `NaCzerni` (`app/zdjecie.tsx`) miał `edges` z left/right,
// więc ScrollView był węższy od okna o wcięcia boczne, a `PodgladZdjec` liczy szerokość strony z `useWindowDimensions().width` (strona > widoczny obszar; indeks
// z `contentOffset.x / width` przestawał się zgadzać z paginacją). Jest nie liczy wcięć natywnie: `SafeAreaView` ma wierną atrapę (jak w BX-009) z wcięciami poziomu.
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { PodgladZdjec } from '../../src/ekrany/Zdjecia';
import { tEn } from './pomoc';

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native') as typeof import('react-native');
  const wciecia = { top: 0, bottom: 21, left: 59, right: 59 } as const; // iPhone z wycięciem, poziomo
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

/** Suma wcięć bocznych (`paddingLeft` + `paddingRight`) przodków węzła, tylko węzły natywne (kompozyt przekazuje ten sam styl dalej) — o tyle ScrollView jest węższy od okna. */
function wcieciaBoczneNad(w: ReactTestInstance): number {
  let suma = 0;
  for (let n: ReactTestInstance | null = w.parent; n; n = n.parent) {
    if (typeof n.type !== 'string') continue;
    const s = StyleSheet.flatten(n.props.style as never) as Record<string, number> | undefined;
    suma += (s?.paddingLeft ?? 0) + (s?.paddingRight ?? 0);
  }
  return suma;
}

beforeEach(async () => {
  jest.clearAllMocks();
  const t = await tEn();
  mockAplikacja = { kontener: { z: { magazyn: { sciezka: (sha: string) => `/m/${sha}` }, id: { nowy: () => 'x' }, katalogi: { tymczasowy: '/tmp' } }, j: { t } } };
});

test('BX-014: poziomo z wcięciami bocznymi — szerokość strony zdjęcia = szerokość ScrollView (okno bez wcięć bocznych przodków), więc paginacja się zgadza', async () => {
  mockZdjecia.mockResolvedValue({ ok: true, wartosc: [{ id: 'a', sha256: 'aa' }, { id: 'b', sha256: 'bb' }] });
  render(<EkranZdjecia />);
  const strony = await screen.findAllByRole('image');
  expect(strony).toHaveLength(2);
  const okno = Dimensions.get('window').width;
  for (const s of strony) {
    const szerStrony = (StyleSheet.flatten(s.props.style as never) as { width: number }).width;
    expect({ szerStrony, szerScrollView: okno - wcieciaBoczneNad(s) }).toEqual({ szerStrony, szerScrollView: szerStrony });
  }
});

test('BX-014: kontrakt komponentu — `PodgladZdjec` liczy szerokość strony z szerokości okna (dlatego trasa nie może zwężać ScrollView wcięciami bocznymi)', async () => {
  const t = await tEn();
  render(<PodgladZdjec t={t} zdjecia={[{ id: 'a', uri: 'file:///a.jpg' }, { id: 'b', uri: 'file:///b.jpg' }]} poczatek={0} naZamknij={jest.fn()} naUsun={jest.fn()} naUdostepnij={jest.fn()} potwierdz={jest.fn()} />);
  for (const s of screen.getAllByRole('image')) expect((StyleSheet.flatten(s.props.style as never) as { width: number }).width).toBe(Dimensions.get('window').width);
});
