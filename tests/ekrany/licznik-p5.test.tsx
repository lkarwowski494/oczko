// Licznik, partia 5: nazwa projektu otwiera ekran projektu (design-spec „Ekran projektu”: wejście `licznik-projekt`), „Next part” przy celu
// (BR-LIC-011/S1, P-182 Q4a) i linia „{część} in total” licznika sekcji (BR-LIC-018/S1).
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, przycisk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

// M3 p3a (P-580 a): wejściem do ekranu projektu jest „Projekt ›” (`licznik-projekt-wejscie`, VoiceOver „Project: {nazwa}”); `licznik-projekt` to nazwa (nagłówek).
test('stuknięcie w „Projekt ›” (licznik-projekt-wejscie) otwiera ekran projektu; etykieta niesie nazwę, nazwa to licznik-projekt', () => {
  const w = { ...wywolaniaLicznika(), naProjekt: jest.fn() };
  render(<Licznik stan={stanLicznika()} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...w} />);
  fireEvent.press(przycisk('Project: Harbor Sweater', 'button'));
  expect(w.naProjekt).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('licznik-projekt-wejscie')).toBeTruthy();
  expect(screen.getByTestId('licznik-projekt').props.children).toBe('Harbor Sweater');
});

test('BR-LIC-018/S1: licznik sekcji pokazuje „Blanket in total: 20 rows”', () => {
  render(<Licznik stan={stanLicznika({ calosc: { czesc: 'Blanket', rzedy: 20 } })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.getByText('Blanket in total: 20 rows')).toBeTruthy();
});

// P-191 P1a: stoper w pasku nawigacji, pierwszy z prawej grupy (przed Historią i •••) — slot z kompozycji.
test('P1a: slot stopera w pasku przed Historią; także przy blokadzie (P2a)', () => {
  render(<Licznik stan={stanLicznika({ zablokowany: true })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} stoper={<Text testID="slot-stopera">S</Text>} />);
  const kolejnosc = screen.UNSAFE_root.findAll((n) => n.props.testID === 'slot-stopera' || n.props.testID === 'licznik-historia').map((n) => n.props.testID);
  expect(kolejnosc[0]).toBe('slot-stopera');
  expect(kolejnosc).toContain('licznik-historia');
});
