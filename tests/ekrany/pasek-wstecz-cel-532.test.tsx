// 04-studio-projektowe-532 (P-436; regresja z 033 d243a78): „Wstecz” w wariancie `tylkoSymbol` (pasek wzoru) ma cel dotyku co najmniej
// cel.minimum (44 pt) w obu wymiarach — sama strzałka bez tekstu nie może zwęzić przycisku do szerokości symbolu (HIG: 44×44 pt).
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Wstecz } from '../../src/ekrany/Pasek';
import { cel } from '../../src/ekrany/motyw';

const plaski = (s: unknown) => StyleSheet.flatten(s as never) as Record<string, unknown>;

describe('532: cel dotyku „Wstecz” tylko z symbolem', () => {
  test('tylkoSymbol: minWidth i minHeight ≥ cel.minimum, symbol wyśrodkowany', () => {
    render(<Wstecz tylkoSymbol tekst="Back" etykieta="Back to Sleeve" onPress={() => {}} />);
    const s = plaski(screen.getByTestId('nav-wstecz').props.style);
    expect(cel.minimum).toBeGreaterThanOrEqual(44);
    expect(s.minWidth).toBeGreaterThanOrEqual(cel.minimum);
    expect(s.minHeight).toBeGreaterThanOrEqual(cel.minimum);
    expect(s.justifyContent).toBe('center');
  });

  test('z tekstem: wysokość ≥ cel.minimum, szerokość z treści (bez wymuszonego minWidth)', () => {
    render(<Wstecz tekst="Projects" onPress={() => {}} />);
    const s = plaski(screen.getByTestId('nav-wstecz').props.style);
    expect(s.minHeight).toBeGreaterThanOrEqual(cel.minimum);
    expect(s.minWidth).toBeUndefined();
  });
});
