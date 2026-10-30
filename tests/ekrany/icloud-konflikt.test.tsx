// Arkusz wyboru wersji licznika w konflikcie (design-spec „Konflikt na liczniku (I1a)”: `dane.konflikt_tytul`, `icloud.konflikt_wybor_opis`,
// dwa wybory `dane.konflikt_wybor` z etykietą `dane.konflikt_a11y`, `wspolne.nie_teraz`; scenariusz 49).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { IcloudKonflikt } from '../../src/ekrany/IcloudKonflikt';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('tytuł z nazwą licznika, opis, dwa wybory (etykiety VoiceOver), „Not now”', () => {
  const naWybor = jest.fn();
  const naZamknij = jest.fn();
  render(<IcloudKonflikt t={t} licznik="Left sleeve" wybory={[
    { glowa: 'g6', wartosc: 6, tekst: '6 rows · iPad (test) · 19:39', etykieta: 'Keep 6 rows from iPad (test), 19:39' },
    { glowa: 'g1', wartosc: 1, tekst: '1 rows · iPhone · 19:30', etykieta: 'Keep 1 rows from iPhone, 19:30' },
  ]} naWybor={naWybor} naZamknij={naZamknij} />);
  expect(screen.getByText('Two versions of Left sleeve')).toBeTruthy();
  expect(screen.getByText('Pick the one that matches your work. The other stays in the history.')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Keep 6 rows from iPad (test), 19:39'));
  expect(naWybor).toHaveBeenCalledWith('g6');
  expect(screen.getByText('1 rows · iPhone · 19:30')).toBeTruthy();
  fireEvent.press(screen.getByText('Not now'));
  expect(naZamknij).toHaveBeenCalled();
});
