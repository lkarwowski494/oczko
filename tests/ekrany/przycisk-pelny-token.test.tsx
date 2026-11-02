// P2-2 (04, Aneks P2, poz. 1): przyciski pełnej szerokości w arkuszu (główny, niszczący) biorą promień z tokenu `promien.przyciskPelny`, nie z `przyciskDrugi`
// (token „drugi” znaczy przycisk z obrysem w rzędzie wyboru). Wartość równa (14), więc wygląd bez zmian — dowodzi tego `przycisk-pelny-promien.test.tsx`.
// Tu: podmieniamy wartości tokenów na różne i sprawdzamy, który token czyta kod; przycisk „drugi” zostaje przy `przyciskDrugi`.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';

jest.mock('../../docs/design/tokeny.json', () => {
  const rzeczywiste = jest.requireActual('../../docs/design/tokeny.json');
  return { __esModule: true, default: { ...rzeczywiste, promien: { ...rzeczywiste.promien, przyciskPelny: 31, przyciskDrugi: 17 } } };
});

import { Przycisk } from '../../src/ekrany/Arkusz';
import tokeny from '../../docs/design/tokeny.json';

const promien = (testID: string) => RN.StyleSheet.flatten(screen.getByTestId(testID).props.style).borderRadius;

test('token przyciskPelny = 14 = przyciskDrugi w tokenach rzeczywistych (zero zmiany wyglądu)', () => {
  const rzeczywiste = jest.requireActual('../../docs/design/tokeny.json');
  expect([rzeczywiste.promien.przyciskPelny, rzeczywiste.promien.przyciskDrugi]).toEqual([14, 14]);
  expect(tokeny.promien.przyciskPelny).toBe(31); // podmiana działa
});

test('przycisk główny i niszczący (pełna szerokość) czytają promien.przyciskPelny; drugi zostaje przy przyciskDrugi', () => {
  render(<>
    <Przycisk tekst="Keep counting" onPress={() => undefined} rodzaj="glowny" testID="g" />
    <Przycisk tekst="Delete all data" onPress={() => undefined} rodzaj="niszczacy" testID="n" />
    <Przycisk tekst="Not now" onPress={() => undefined} rodzaj="drugi" testID="d" />
  </>);
  expect([promien('g'), promien('n'), promien('d')]).toEqual([31, 31, 17]);
});
