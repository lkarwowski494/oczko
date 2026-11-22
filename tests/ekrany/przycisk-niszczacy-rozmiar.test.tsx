// P-553 (Dzianina): zamiast „Libre Franklin 700 17 pt” — krój systemowy (bez `fontFamily`), waga 700, rozmiar `typografia.tresc.pt`; „nie 28 pt” → nie `typografia.przyciskPlus.pt` (+1).
// H-1a (P-361, znalezisko sesji E 04-008): etykieta przycisku niszczącego („Delete all data”) miała 28 pt (`typografia.przycisk`), a wzorzec ma 17 pt:
// `docs/design/fix8-2026-10-27/fix8.html:186` `.przycisk-niszczacy` (font: 700 17px Libre Franklin), design-spec.md:47 („wymiary jak przycisk pełny”).
// Ta sama etykieta co w przycisku głównym arkusza (`typografia.przyciskPelny`, 04-studio-projektowe-008).
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Przycisk } from '../../src/ekrany/Arkusz';
import tokeny from '../../docs/design/tokeny.json';

afterEach(() => jest.restoreAllMocks());

const etykieta = (tekst: string) => {
  const s = RN.StyleSheet.flatten(screen.getByText(tekst).props.style);
  return { fontFamily: s.fontFamily, fontWeight: s.fontWeight, fontSize: s.fontSize };
};

test.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s: etykieta przycisku niszczącego ma krój systemowy 700 w rozmiarze treści 17 pt (Dzianina: bez Libre Franklin), nie rozmiar „+1” z tokenów', (_m, schemat) => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
  render(<Przycisk tekst="Delete all data" onPress={() => undefined} rodzaj="niszczacy" />);
  expect(etykieta('Delete all data')).toEqual({ fontFamily: undefined, fontWeight: '700', fontSize: tokeny.typografia.tresc.pt });
  expect(etykieta('Delete all data').fontSize).not.toBe(tokeny.typografia.przyciskPlus.pt);
});

test('etykieta przycisku niszczącego ma ten sam rozmiar co etykieta przycisku głównego (oba „przycisk pełny” wzorca)', () => {
  render(<><Przycisk tekst="Główny" onPress={() => undefined} rodzaj="glowny" /><Przycisk tekst="Niszczący" onPress={() => undefined} rodzaj="niszczacy" /></>);
  expect(etykieta('Niszczący').fontSize).toBe(etykieta('Główny').fontSize);
});
