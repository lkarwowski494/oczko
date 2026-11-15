// PU-320 („Dane i ustawienia”): ekran awaryjny — „Report a problem” otwiera raport, „Cancel” wraca na ekran awaryjny; dane z nowszej wersji mają własny tytuł;
// brak miejsca przy kopii → alert „Couldn’t save a copy”. Poziom: komponentowy — prawdziwy `EkranAwaryjny` (kompozycja) z atrapą stanu startu, bez symulatora.
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

const mockA = { zapiszKopie: jest.fn(), zipSurowej: jest.fn(), kopia: Promise.resolve(), sha: jest.fn(), nieudaneStarty: async () => 0, etapPoprzedniegoStartu: null, bledyZKopii: async () => [] as string[] };
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual('../../src/kompozycja/start-aplikacji'),
  trybAwaryjny: () => mockA,
  sprobujNormalnieTeraz: jest.fn(async () => undefined),
}));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(async () => undefined) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EkranAwaryjny } = require('../../src/kompozycja/EkranAwaryjny') as typeof import('../../src/kompozycja/EkranAwaryjny');

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());

// PU-320: „Your data is from a newer Oczko” → „Report a problem” pokazuje raport (ekran awaryjny znika) → „Cancel” przywraca ekran awaryjny; przy braku miejsca kopia → alert „Couldn’t save a copy… out of space”.
test('PU-320: raport z ekranu awaryjnego i „Cancel” wraca; nowsza wersja ma własny tytuł; brak miejsca przy kopii daje alert „Couldn’t save a copy”', async () => {
  const nowsza = render(<EkranAwaryjny powod="wersja_nowsza" t={t} naNormalnie={jest.fn()} />);
  expect(screen.getByRole('header', { name: 'Your data is from a newer Oczko' })).toBeTruthy();
  fireEvent.press(screen.getByTestId('awaryjny-zglos-problem'));
  await screen.findByTestId('zglos-kontakt');
  expect(screen.queryByTestId('tryb-awaryjny')).toBeNull();
  fireEvent.press(screen.getByTestId('arkusz-zamknij'));
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Your data is from a newer Oczko' })).toBeTruthy();
  expect(screen.queryByTestId('zglos-kontakt')).toBeNull();
  nowsza.unmount();

  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mockA.zapiszKopie.mockResolvedValue('brak_miejsca');
  mockA.zipSurowej.mockResolvedValue(null);
  render(<EkranAwaryjny powod="brak_miejsca" t={t} naNormalnie={jest.fn()} />);
  expect(screen.getByTestId('awaryjny-brak-miejsca')).toBeTruthy();
  fireEvent.press(screen.getByTestId('awaryjny-zapisz-kopie'));
  await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
  expect(alert.mock.calls[0]?.[0]).toBe('Couldn’t save a copy');
  expect(alert.mock.calls[0]?.[1]).toMatch(/^Your device may be out of space\./);
});
