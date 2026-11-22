// P2-2 (04, Aneks P2, poz. 1): przyciski pełnej szerokości w arkuszu (główny, niszczący) biorą promień z tokenu, nie z literału. Przed P-553 były dwa tokeny
// (`promien.przyciskPelny` i `promien.przyciskDrugi`, oba 14); Dzianina ma jeden: `promienie.przycisk` (mapa-tokenow.md: oba stare klucze → `promienie.przycisk`),
// a `motyw.ts` zachowuje oba stare klucze jako aliasy tego samego tokenu. Rozróżnienie „pełny czyta swój token, drugi swój” nie ma już odpowiednika — test sprawdza więc,
// że WSZYSTKIE trzy rodzaje przycisku czytają `promienie.przycisk` (podmiana na 31 zmienia każdy z nich), a wartość rzeczywista to nadal 14 (zero zmiany wyglądu).
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';

jest.mock('../../docs/design/tokeny.json', () => {
  const rzeczywiste = jest.requireActual('../../docs/design/tokeny.json');
  return { __esModule: true, default: { ...rzeczywiste, promienie: { ...rzeczywiste.promienie, przycisk: 31 } } };
});

import { Przycisk } from '../../src/ekrany/Arkusz';
import tokeny from '../../docs/design/tokeny.json';

const promien = (testID: string) => RN.StyleSheet.flatten(screen.getByTestId(testID).props.style).borderRadius;

test('token promienie.przycisk = 14 w tokenach rzeczywistych (zero zmiany wyglądu)', () => {
  const rzeczywiste = jest.requireActual('../../docs/design/tokeny.json');
  expect(rzeczywiste.promienie.przycisk).toBe(14);
  expect(tokeny.promienie.przycisk).toBe(31); // podmiana działa
});

test('przycisk główny, niszczący (pełna szerokość) i drugi czytają promienie.przycisk', () => {
  render(<>
    <Przycisk tekst="Keep counting" onPress={() => undefined} rodzaj="glowny" testID="g" />
    <Przycisk tekst="Delete all data" onPress={() => undefined} rodzaj="niszczacy" testID="n" />
    <Przycisk tekst="Not now" onPress={() => undefined} rodzaj="drugi" testID="d" />
  </>);
  expect([promien('g'), promien('n'), promien('d')]).toEqual([31, 31, 31]);
});
