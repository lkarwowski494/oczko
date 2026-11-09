// 04-studio-projektowe-011 (P-627: pole wyboru r 10 z własnymi tokenami): `PoleWyboru` czyta `znaczniki.poleWyboru` / `poleWyboruAx5` / `poleWyboruPromien`,
// nie zastępcze `znaczniki.radio` + `promienie.pole` (wartości bez zmian: 28 / 40 / 10). Strażnik: tokeny podmienione na wartości odróżnialne od radia.
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { PoleWyboru } from '../../src/ekrany/ZnacznikRadio';
import { PROG_KATEGORII_DOSTEPNOSCI } from '../../src/ekrany/motyw';

jest.mock('../../docs/design/tokeny.json', () => {
  const a = jest.requireActual('../../docs/design/tokeny.json') as { znaczniki: Record<string, unknown> };
  return { ...a, znaczniki: { ...a.znaczniki, poleWyboru: 31, poleWyboruAx5: 43, poleWyboruPromien: 7 } };
});
let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const styl = () => (StyleSheet.flatten(screen.getByTestId('pole-wyboru', { includeHiddenElements: true }).props.style) ?? {}) as ViewStyle;

test('011: rozmiar i promień z znaczniki.poleWyboru / poleWyboruPromien', () => {
  mockSkala = 1;
  render(<PoleWyboru zaznaczone={false} />);
  expect(styl()).toMatchObject({ width: 31, height: 31, borderRadius: 7 });
});

test('011: od AX1 rozmiar z znaczniki.poleWyboruAx5', () => {
  mockSkala = PROG_KATEGORII_DOSTEPNOSCI;
  render(<PoleWyboru zaznaczone />);
  expect(styl()).toMatchObject({ width: 43, height: 43, borderRadius: 7 });
});
