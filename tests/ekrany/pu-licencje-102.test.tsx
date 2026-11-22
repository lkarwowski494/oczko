// PU-102 („Licencje open source”): „Fonts” jako pierwsza grupa, Bree Serif z OFL, tekst licencji się otwiera, pozycja z „npm packages” jest na liście.
// Poziom: komponentowy na prawdziwych danych `src/domena/licencje.generated.ts`; bez symulatora.
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Licencje } from '../../src/ekrany/Licencje';
import { PAKIETY_NPM } from '../../src/domena/licencje.generated';
import { tEn } from './pomoc';

// PU-102: nagłówki grup w kolejności (Fonts pierwszy, npm packages ostatni), Bree Serif z „OFL-1.1”, stuknięcie otwiera tekst OFL, pierwsza pozycja npm widoczna z nazwą, wersją i licencją.
test('PU-102: „Fonts” na górze, Bree Serif z OFL otwiera tekst licencji, na liście jest pozycja z „npm packages”', async () => {
  const t = await tEn();
  render(<Licencje t={t} naWstecz={jest.fn()} />);
  const naglowki = screen.getAllByRole('header').map((h) => (h.children as string[]).join(''));
  expect(naglowki).toEqual(['Open source licenses', 'Fonts', 'License texts', 'iOS libraries outside npm', 'npm packages']);
  const kroj = screen.getByTestId('licencje-kroj-bree-serif');
  expect(within(kroj).getByText('Bree Serif')).toBeTruthy();
  expect(within(kroj).getByText('OFL-1.1')).toBeTruthy();
  expect(screen.queryByTestId('licencje-tekst')).toBeNull();
  fireEvent.press(kroj);
  expect(screen.getByTestId('licencje-tekst').children.join('')).toContain('SIL OPEN FONT LICENSE Version 1.1');
  const [nazwa, wersja, spdx] = PAKIETY_NPM[0]!;
  expect(screen.getByText(`${nazwa} ${wersja}`)).toBeTruthy();
  expect(screen.getAllByText(spdx).length).toBeGreaterThan(0);
});
