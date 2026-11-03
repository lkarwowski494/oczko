// M2-koordynator-napraw-036 (SP-10, rola 04; decyzja koordynatora P-461 = (a), design-spec „Kalkulator Swatch” N1): przy „Hook” bez szerokości
// kalkulator nie ma kategorii ani wyniku oczek, więc pod polem szerokości stoi zaproszenie „Enter a width to get the number of stitches.”.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Probka } from '../../src/ekrany/Narzedzia';
import { stanProbki, type WejscieProbki } from '../../src/kompozycja/probka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const ZAPROSZENIE = 'Enter a width to get the number of stitches.';
const licz = (w: Partial<WejscieProbki>) => stanProbki({ oczka: '', na: '10cm', szerokosc: '', jednostka: 'cm', ...w }, { t, jezyk: () => 'en-US' });

test.each([
  [{ oczka: '22', narzedzie: 'szydelko' }, ZAPROSZENIE],
  [{ oczka: '22', na: '4in', jednostka: 'in', narzedzie: 'szydelko' }, ZAPROSZENIE],
  [{ oczka: '22', szerokosc: '50', narzedzie: 'szydelko' }, null],
  [{ oczka: '22', narzedzie: 'druty' }, null],
  [{ oczka: '', narzedzie: 'szydelko' }, null],
  [{ oczka: 'abc', narzedzie: 'szydelko' }, null],
  [{ oczka: '22', szerokosc: 'x', narzedzie: 'szydelko' }, null],
] as const)('stan %j → zaproszenie %p', (w, oczekiwane) => {
  expect(licz(w as Partial<WejscieProbki>).zaproszenie).toBe(oczekiwane);
});

test('ekran: Hook, wpisane tylko oczka → zaproszenie pod polem szerokości; po wpisaniu szerokości wynik zamiast zaproszenia', () => {
  render(<Probka t={t} jednostka="cm" poczatek={{ oczka: '', na: '10cm' }} licz={(w) => stanProbki({ ...w, narzedzie: 'szydelko' }, { t, jezyk: () => 'en-US' })} />);
  fireEvent.changeText(screen.getByTestId('probka-oczka'), '22');
  expect(screen.getByTestId('probka-zaproszenie-szerokosc')).toHaveTextContent(ZAPROSZENIE);
  fireEvent.changeText(screen.getByTestId('probka-szerokosc'), '50');
  expect(screen.queryByTestId('probka-zaproszenie-szerokosc')).toBeNull();
  expect(screen.getByTestId('probka-wynik-oczka')).toHaveTextContent('110 stitches');
});
