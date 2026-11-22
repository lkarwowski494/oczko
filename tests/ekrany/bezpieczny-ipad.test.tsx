// Kolumna treści na iPadzie (design-spec G1, P-220: maks. 640 pt na środku; szerokość compact = układ telefonu; ADR-0026) — wspólna dla ekranów
// przez `Bezpieczny`; przeglądarka wzoru z `pelnaSzerokosc` (W4b: wzór i kolumna licznika obok siebie).
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

const wymiary = { width: 390, height: 844 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ ...wymiary, scale: 2, fontScale: 1 }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
import { Bezpieczny } from '../../src/kompozycja/Bezpieczny';

const szerokosc = () => {
  const k = screen.getByTestId('kolumna-tresci');
  return (Array.isArray(k.props.style) ? Object.assign({}, ...k.props.style) : k.props.style).maxWidth;
};
test.each([
  [390, 844, 390], [820, 1180, 640], [1180, 820, 640], [375, 1180, 375],
])('PU-146 · okno %i × %i → kolumna treści %i pt (iPad: kolumna maks. 640 pt; compact: układ telefonu)', (w, h, oczekiwana) => {
  Object.assign(wymiary, { width: w, height: h });
  render(<Bezpieczny><Text>x</Text></Bezpieczny>);
  expect(szerokosc()).toBe(oczekiwana);
});
test('pełna szerokość (przeglądarka wzoru) na iPadzie poziomo', () => {
  Object.assign(wymiary, { width: 1180, height: 820 });
  render(<Bezpieczny pelnaSzerokosc><Text>x</Text></Bezpieczny>);
  expect(szerokosc()).toBe(1180);
});
