// PU-283 (katalog przypadków użycia, „Projekt i części”): ••• przy wierszu listy → arkusz systemowy „Delete “…”?” z datą kosza; „Cancel” niczego nie zmienia, „Delete project”
// przenosi projekt z „In progress” do kosza (baza: usunięty, drugi projekt nietknięty). Trasa „/projekty” na prawdziwej bazie (node:sqlite).
import React from 'react';
import { ActionSheetIOS } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { przycisk, tEn } from './pomoc';

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const mockAplikacja: { kontener?: unknown; licznik?: unknown; preferencje?: unknown } = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => true }), useIsFocused: () => true, useFocusEffect: (f: () => (() => void) | void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektow = (require('../../app/(zakladki)/projekty') as { default: React.ComponentType }).default;



test('PU-283: „More: Sweter” → arkusz „Delete “Sweter”?” z datą kosza; „Cancel” nic nie zmienia, „Delete project” usuwa projekt z listy do kosza (baza: tylko Sweter usunięty)', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1, { cel: 96 }), ...licznik('l1', 'c1', 3), projekt('p2', 'Szal', T0 - DOBA), czesc('c2', 'p2', 'Body', 1), ...licznik('l2', 'c2', 4, { t: T0 - DOBA })]);
  s.zegar.ustaw(T0 + 60 * DOBA);
  const j: Jezyk = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false };
  const poUsunieciu = jest.fn(async () => undefined);
  mockAplikacja.kontener = { z: s.z, j, wzor: { k: {} }, dostep: { stan: () => ({ poziom: 'darmowy' }) }, porty: { haptyka: { zagraj: jest.fn() } } };
  mockAplikacja.licznik = { otworz: jest.fn(), poUsunieciu };
  mockAplikacja.preferencje = { stan: () => ({ wibracje: false }) };
  render(<EkranProjektow />);
  await waitFor(() => expect(screen.getByTestId('projekty-lista')).toBeTruthy());
  const usuniete = async () => (await s.baza.all<{ id: string }>('SELECT id FROM projekt WHERE usunieto_ms IS NOT NULL ORDER BY id')).map((r) => r.id);
  expect(screen.getAllByTestId('projekty-wiersz')).toHaveLength(2);

  const anuluj = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_o, cb) => cb(1));
  fireEvent.press(przycisk('More: Sweter', 'button'));
  await new Promise((r) => setTimeout(r, 30));
  expect(anuluj).toHaveBeenCalledTimes(1);
  expect(screen.getAllByTestId('projekty-wiersz')).toHaveLength(2); // „Cancel”: nic się nie zmieniło
  expect(await usuniete()).toEqual([]);
  expect(screen.queryByTestId('projekty-kosz')).toBeNull();
  anuluj.mockRestore();

  const usun = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_o, cb) => cb(0));
  fireEvent.press(przycisk('More: Sweter', 'button'));
  const opcje = usun.mock.calls[0]?.[0];
  expect(opcje?.title).toBe('Delete “Sweter”?');
  expect(opcje?.message).toBe('You can restore it from Recently deleted on the Projects list until Jan 20.'); // teraz + 30 dni kosza
  expect(opcje?.options).toEqual(['Delete project', 'Cancel']);
  expect(opcje?.destructiveButtonIndex).toBe(0);
  await waitFor(() => expect(screen.getAllByTestId('projekty-wiersz')).toHaveLength(1));
  expect(screen.queryByText('Sweter')).toBeNull();
  expect(screen.getByText('Szal')).toBeTruthy();
  expect(screen.getByTestId('projekty-kosz')).toBeTruthy();
  expect(await usuniete()).toEqual(['p1']);
});
