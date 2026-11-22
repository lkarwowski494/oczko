// PU-285 (katalog przypadków użycia, „Projekt i części”): ukończony projekt → „Finished” → inny dzień (3 dni wcześniej) zapisuje się od razu, z linią o kalendarzu; kalendarz pokazuje
// „Finished: Sweter” w nowym dniu, a w starym nie; lista ukończonych ma nową datę. Trasy app/projekt/[id], app/(zakladki)/dni i app/(zakladki)/projekty na prawdziwej bazie.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { DOBA, GODZ, T0, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tekst } from './pomoc';
import type { PortBazy } from '../../src/domena/porty';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), navigate: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
jest.mock('expo-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(),
  useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, usePathname: () => '/', useIsFocused: () => true,
  useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); }, // eslint-disable-line @typescript-eslint/no-require-imports
}));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranDni = (require('../../app/(zakladki)/dni') as { default: React.ComponentType }).default;
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
const EkranProjektow = (require('../../app/(zakladki)/projekty') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */



test('PU-285: dzień ukończenia 3 dni wcześniej zapisuje się bez „Save”; kalendarz ma „Finished: Sweter” w nowym dniu, nie w starym; lista pokazuje nową datę', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweter', T0 - 5 * DOBA, { stan: 'ukonczony', ukonczono: T0 }), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 3, { t: T0 - 5 * DOBA })]);
  s.zegar.ustaw(T0 + GODZ); // 2026-10-22
  mockAplikacja = {
    kontener: { z: s.z, j, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } }, dostep: { stan: () => ({ poziom: 'darmowa' }) },
      wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } },
    licznik: k, preferencje: { stan: () => ({ ukladMiar: 'metric' }) },
  };
  const dzien = async (d: string) => { fireEvent.press(await screen.findByTestId(`historia-dzien-${d}`)); };

  mockParams = { id: 'p1' };
  const projektEkran = render(<EkranProjektu />);
  const wiersz = await screen.findByTestId('projekt-data-ukonczenia');
  expect(tekst(wiersz)).toContain('Oct 22');
  fireEvent.press(wiersz);
  expect(screen.getByText('The calendar and the weekly summary count the project as finished on this day.')).toBeTruthy();
  await act(async () => { fireEvent(screen.getByTestId('projekt-data-ukonczenia-wybor'), 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(2026, 9, 19, 12)); await new Promise((r) => setTimeout(r, 150)); });
  await waitFor(() => expect(tekst(screen.getByTestId('projekt-data-ukonczenia'))).toContain('Oct 19')); // zapis bez „Save”
  expect(await s.baza.all('SELECT ukonczono_dzien FROM projekt WHERE id = ?', ['p1'])).toEqual([{ ukonczono_dzien: '2026-10-19' }]);
  projektEkran.unmount();

  const dni = render(<EkranDni />);
  await dzien('2026-10-19');
  expect(await screen.findByText('Finished: Sweter')).toBeTruthy();
  await dzien('2026-10-22');
  await waitFor(() => expect(screen.queryByText('Finished: Sweter')).toBeNull());
  dni.unmount();

  render(<EkranProjektow />);
  expect(await screen.findByText(/Finished Oct 19/)).toBeTruthy();
  expect(screen.queryByText(/Finished Oct 22/)).toBeNull();
});
