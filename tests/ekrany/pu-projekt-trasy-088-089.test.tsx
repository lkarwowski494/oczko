// PU-088 i PU-089 (katalog przypadków użycia, „Ukończenie, historia, kosz”): trasy „/projekt/[id]”, „/kosz” i „/projekty” na prawdziwej bazie (node:sqlite),
// prawdziwych przypadkach użycia i prawdziwym t() z en.json; atrapa tylko routera i opakowań platformy (jak blad-zapisu-trasy). Przejście między ekranami
// robi test (router jest atrapą): montuje następną trasę po zapisie, tak jak zrobiłby to nawigator.
import React from 'react';
import { Alert, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within, type RenderResult } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { PortBazy } from '../../src/domena/porty';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
const EkranProjektu = trasa('../../app/projekt/[id]'), EkranKosza = trasa('../../app/kosz'), EkranProjektow = trasa('../../app/(zakladki)/projekty');
const oglos = (require('../../src/kompozycja/system') as { oglos: jest.Mock }).oglos;
/* eslint-enable @typescript-eslint/no-require-imports */

let alert: jest.SpyInstance;
let wyrenderowany: RenderResult | undefined;
beforeEach(() => { oglos.mockClear(); alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); });
afterEach(() => alert.mockRestore());
async function start(dane: Parameters<typeof wykonaj>[1]) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj((s.baza satisfies PortBazy), dane);
  s.zegar.ustaw(T0 + 3_600_000);
  mockAplikacja = {
    kontener: { z: s.z, j, dostep: { stan: () => ({ poziom: 'darmowa' }) }, porty: { haptyka: { zagraj: jest.fn() }, siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { z: s.z, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } },
    licznik: k,
  };
  return s;
}
async function pokaz(Ekran: React.ComponentType, params: Record<string, string> = {}) {
  wyrenderowany?.unmount();
  mockParams = params;
  wyrenderowany = render(<Ekran />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}
const przyciskAlertu = (nazwa: string): AlertButton => (alert.mock.calls.at(-1)?.[2] as AlertButton[]).find((b) => b.text === nazwa) as AlertButton;

// PU-088: usunięcie licznika w trybie edycji: alert z końcem kosza; w koszu „Counter in …, Back · until …”; „Restore” → licznik wraca do części Back.
test('PU-088: tryb edycji → „Delete counter” → alert z „until Nov 21”; kosz „Counter in Sweter, Back · until Nov 21”; „Restore” → licznik znów w części Back', async () => {
  await start([projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5, { kolejnosc: 1 }), ...licznik('l2', 'c1', 7, { rodzaj: 'oczka', kolejnosc: 2 })]);
  await pokaz(EkranProjektu, { id: 'p1' });
  expect(screen.getAllByTestId('projekt-licznik')).toHaveLength(2);
  fireEvent.press(screen.getByTestId('projekt-menu'));
  fireEvent.press(screen.getByTestId('projekt-edytuj'));
  fireEvent.press(screen.getAllByTestId('projekt-usun-licznik')[1]!);
  expect(alert.mock.calls.at(-1)?.[0]).toBe('Delete “Stitches”?');
  expect(alert.mock.calls.at(-1)?.[1]).toBe('You can restore it with its history from Recently deleted on the Projects list until Nov 21.');
  await act(async () => { przyciskAlertu('Delete counter').onPress?.(); await new Promise((r) => setTimeout(r, 100)); });
  await waitFor(() => expect(screen.getAllByTestId('projekt-licznik')).toHaveLength(1));
  await pokaz(EkranKosza);
  expect(screen.getByText('Stitches')).toBeTruthy();
  expect(screen.getByText('Counter in Sweter, Back · until Nov 21')).toBeTruthy();
  fireEvent.press(screen.getByTestId('kosz-przywroc'));
  await waitFor(() => expect(screen.queryByTestId('kosz-przywroc')).toBeNull());
  await pokaz(EkranProjektu, { id: 'p1' });
  expect(screen.getAllByTestId('projekt-czesc')).toHaveLength(1);
  expect(screen.getAllByTestId('projekt-licznik')).toHaveLength(2);
});

// PU-089: „Resume project” z ukończonego projektu → ogłoszenie „… moved to In progress.”; na liście projekt w „In progress”, sekcja „Finished” bez niego.
test('PU-089: ukończony projekt → ••• → „Resume project” → ogłoszenie; lista: „In progress” ma projekt, „Finished” już go nie ma', async () => {
  await start([projekt('p1', 'Sweter', T0, { stan: 'ukonczony', ukonczono: T0 + 3_000_000 }), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)]);
  await pokaz(EkranProjektow);
  expect(within(screen.getByTestId('projekty-ukonczone')).getByText('Sweter')).toBeTruthy();
  await pokaz(EkranProjektu, { id: 'p1' });
  fireEvent.press(screen.getByTestId('projekt-menu'));
  await act(async () => { fireEvent.press(screen.getByTestId('projekt-wznow')); await new Promise((r) => setTimeout(r, 100)); });
  await waitFor(() => expect(oglos).toHaveBeenCalledWith('Sweter moved to In progress.'));
  await pokaz(EkranProjektow);
  expect(screen.getByText('In progress')).toBeTruthy();
  expect(within(screen.getByTestId('projekty-wiersz')).getByText('Sweter')).toBeTruthy();
  expect(screen.queryByTestId('projekty-ukonczone')).toBeNull();
});
