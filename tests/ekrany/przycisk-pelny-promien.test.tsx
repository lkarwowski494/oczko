// H-1d (P-361, znalezisko sesji E): przyciski pełnej szerokości w arkuszu (główny i niszczący) miały promień 20 (`promien.przyciskGlowny`), a wzorzec ma 14:
// `docs/design/fix10-2026-11-01/partia8.html:70` `.przycisk-pelny` (border-radius: 14px), `docs/design/fix8-2026-10-27/fix8.html:186` `.przycisk-niszczacy` (14px),
// design-spec.md:47 („wymiary jak przycisk pełny (≥ 52 pt, promień 14)”). Promień 20 zostaje tylko strefie +1 (`.plus`, partia8.html:56).
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Przycisk } from '../../src/ekrany/Arkusz';

afterEach(() => jest.restoreAllMocks());

const promien = (testID: string) => RN.StyleSheet.flatten(screen.getByTestId(testID).props.style).borderRadius;

test.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s: przycisk główny i niszczący w arkuszu mają promień 14 (wzorzec)', (_m, schemat) => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
  render(<><Przycisk tekst="Keep counting" onPress={() => undefined} rodzaj="glowny" testID="g" /><Przycisk tekst="Delete all data" onPress={() => undefined} rodzaj="niszczacy" testID="n" /></>);
  expect([promien('g'), promien('n')]).toEqual([14, 14]);
});

test('przycisk nieaktywny (główny, wyłączony) też ma promień 14', () => {
  render(<Przycisk tekst="Keep counting" onPress={() => undefined} rodzaj="glowny" wylaczony testID="g" />);
  expect(promien('g')).toBe(14);
});
