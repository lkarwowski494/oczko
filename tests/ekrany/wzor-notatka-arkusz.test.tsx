// Poprawki 04, D1 (P-360, aneks partii 8, poz. 9; `wzor.notatka_edytuj_a11y`): przycisk „Edit” w nagłówku arkusza notatki wzoru niesie obiekt dla VoiceOver
// („Edit note for row 12”, akcja + obiekt); widoczny napis zostaje „Edit”. W trybie edycji przycisk to „Save” (etykieta bez zmiany).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ArkuszNotatekWzoru } from '../../src/ekrany/WzorNotatki';
import type { ChipNotatki } from '../../src/domena/znacznik-wzoru';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const CHIP: ChipNotatki = { rzad: 40, rzadWzoru: 12, strona: 2, y: 0.4, wysokosc: 0.02, notatki: [{ id: 'n1', rzad: 40, tekst: 'Switch to 4 mm' }] };
const arkusz = () => render(<ArkuszNotatekWzoru t={t} chipy={[CHIP]} otwartyChip={40} naChip={jest.fn()} naZmienNotatke={async () => true} naUsunNotatke={async () => true} potwierdz={jest.fn()} naBlad={jest.fn()} />);

test('„Edit” ma etykietę VoiceOver „Edit note for row 12”, widoczny napis „Edit”', () => {
  arkusz();
  const przycisk = screen.getByTestId('wzor-notatka-edytuj');
  expect(przycisk.props.accessibilityLabel).toBe('Edit note for row 12');
  expect(screen.getByText('Edit')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Edit note for row 12' })).toBeTruthy();
});
test('po stuknięciu „Edit” przycisk to „Save” z własną etykietą, nie „Edit note for row 12”', () => {
  arkusz();
  fireEvent.press(screen.getByTestId('wzor-notatka-edytuj'));
  expect(screen.getByTestId('wzor-notatka-edytuj').props.accessibilityLabel).toBe('Save');
  expect(screen.queryByRole('button', { name: 'Edit note for row 12' })).toBeNull();
});
