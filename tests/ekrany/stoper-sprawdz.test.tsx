// P-191 P5a (design-spec „Zapomniany stoper”): linia informacji na liczniku (znak „i” + tekst, nie kolor błędu) i odnośnik do korekty
// (`stoper-sprawdz`, e2e/README.md:93).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { LiniaSprawdzenia } from '../../src/ekrany/Stoper';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('8 godzin → „The timer ran for 8 hours, so Oczko stopped it.” i odnośnik „Check the end time” do korekty', () => {
  const naSprawdz = jest.fn();
  render(<LiniaSprawdzenia t={t} godziny={8} naSprawdz={naSprawdz} />);
  expect(screen.getByText('The timer ran for 8 hours, so Oczko stopped it.')).toBeTruthy();
  const link = screen.getByTestId('stoper-sprawdz');
  expect(link.props.accessibilityRole).toBe('link');
  fireEvent.press(link);
  expect(naSprawdz).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('alert')).toBeNull(); // informacja, nie błąd
});
