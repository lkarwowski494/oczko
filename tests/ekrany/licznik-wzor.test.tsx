// P-220 W2a (design-spec „Gdzie jest wzór”), po M3 p3a (P-580): akcja „Pattern” pod liczbą jest ZAWSZE (nie tylko przy wzorze — scenariusz bez wzoru: dotychczasowe dodanie wzoru,
// menu źródeł to p3b); w rzędzie akcji po „Goal”, przed „History”; testID `licznik-wzor` (e2e/README.md, scenariusze 47 i 52), etykieta `licznik.akcja_wzor`.
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('akcja „Pattern” otwiera wzór; kolejność w rzędzie akcji: wzór, stoper (slot kompozycji), Historia', () => {
  const naWzor = jest.fn();
  render(<Licznik stan={stanLicznika()} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naWzor={naWzor} stoper={<Text testID="slot-stopera">S</Text>} />);
  fireEvent.press(screen.getByTestId('licznik-wzor'));
  expect(naWzor).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Pattern' })).toBeTruthy();
  const kolejnosc = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && ['slot-stopera', 'licznik-wzor', 'licznik-historia'].includes(n.props.testID)).map((n) => n.props.testID);
  expect([...new Set(kolejnosc)]).toEqual(['licznik-wzor', 'slot-stopera', 'licznik-historia']);
});

test('projekt bez wzoru: akcja „Pattern” nadal jest (P-580: zawsze widoczna)', () => {
  render(<Licznik stan={stanLicznika()} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.getByTestId('licznik-wzor')).toBeTruthy();
});
