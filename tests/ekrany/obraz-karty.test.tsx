// Obraz karty ukończenia (P-191 P10a, BR-PRJ-015, P-219 2A; design-spec „Obraz karty ukończenia”, makieta fix6 `karta-obraz`, `-bez-stopera`):
// PNG 1080 × 1350 (4:5) w kolorach motywu jasnego; bez stopera bez kolumny czasu (S3); stopka „Counted in Oczko”.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ObrazKarty, rozmiarZrzutu } from '../../src/ekrany/ObrazKarty';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { Ukonczenie } from '../../src/ekrany/Ukonczenie';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const STAN = { nazwa: 'Harbor Sweater', okres: 'Oct 1 – Oct 21, 2026', rzedy: 640, dni: 21, czas: '18 h', czesci: 4, wloczka: ['Harbor merino, navy'], zdjecie: null };

test('rozmiar zrzutu w punktach tak, żeby plik miał 1080 × 1350 px przy skali ekranu 3, 2 i 1', () => {
  expect([3, 2, 1].map(rozmiarZrzutu)).toEqual([{ width: 360, height: 450 }, { width: 540, height: 675 }, { width: 1080, height: 1350 }]);
});

test('karta-obraz: okres, nazwa, trzy liczby z podpisami, włóczka i części, stopka; tło papier motywu jasnego', () => {
  render(<ObrazKarty stan={STAN} t={t} />);
  for (const x of ['Finished · Oct 1 – Oct 21, 2026', 'Harbor Sweater', '640', 'rows', '21', 'crafting days', '18 h', 'crafting time', 'Harbor merino, navy · 4 parts', 'Counted in Oczko']) {
    expect(screen.getByText(x)).toBeTruthy();
  }
  expect(StyleSheet.flatten(screen.getByTestId('karta-obraz').props.style)).toMatchObject({ backgroundColor: tokeny.kolor.jasny.papier, width: 360, height: 450 });
});

test('karta-obraz-bez-stopera: bez kolumny czasu (BR-PRJ-015 S3)', () => {
  render(<ObrazKarty stan={{ ...STAN, czas: null, wloczka: [] }} t={t} />);
  expect(screen.queryByText('crafting time')).toBeNull();
  expect(screen.getByText('4 parts')).toBeTruthy();
});

test('karta ukończenia: „Share” (`karta-udostepnij`) woła udostępnienie; obraz poza ekranem ukryty dla VoiceOver', () => {
  const naUdostepnij = jest.fn();
  render(<Ukonczenie stan={{ nazwa: 'Harbor', okres: 'Oct 1 – Oct 21', dni: 21, rzedy: 640, czas: null, czesci: 1, wloczka: [], zdjecie: null }} t={t} oglos={jest.fn()}
    system={atrapaSystemu()} liczby={{ formatuj: String, parsuj: () => null }} naUdostepnij={naUdostepnij} naGotowe={jest.fn()}
    obrazKarty={<ObrazKarty stan={STAN} t={t} />} />);
  fireEvent.press(screen.getByTestId('karta-udostepnij'));
  expect(naUdostepnij).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('karta-obraz', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.queryByTestId('karta-obraz')).toBeNull(); // ukryty przed czytnikiem ekranu
});
