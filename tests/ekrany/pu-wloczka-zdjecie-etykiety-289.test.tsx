// PU-289 (katalog przypadków użycia, „Uprawnienia i zdjęcia”): arkusz włóczki „/wloczka?id=…” → „Label photo” → „Choose from library” → miniatura etykiety w arkuszu także po
// ponownym otwarciu; wariant „Take photo” przy odmowie aparatu → alert „Oczko can’t use the camera” z „Open Settings” i „Cancel”, bez zapisu zdjęcia.
// Prawdziwa trasa, prawdziwy adapter wyboru zdjęcia (wybieraczZdjec) i prawdziwy dodajZdjecie na bazie node:sqlite; atrapa tylko modułu systemowego wyboru
// (expo-image-picker) i przekodowania obrazu bez metadanych (natywne, zwraca ten sam plik).
import React from 'react';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Alert, Linking } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { preferencje } from '../../src/kompozycja/preferencje';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { ile, wykonaj } from '../dane/pomocnicze/srodowisko';

const mock: { tmp?: string; aparat: boolean } = { aparat: false };
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: mock.aparat })),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: `file://${mock.tmp}` }] })),
}));
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn() }; // stabilny obiekt: trasa ma go w zależnościach efektu
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({ id: 'y1' }) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/obrazy-aplikacji', () => ({ zaleznosciObrazu: () => ({}) }));
jest.mock('../../src/kompozycja/zdjecie-bez-metadanych', () => ({ zdjecieBezMetadanych: async (sciezka: string) => ({ sciezka, rozszerzenie: 'jpg' }) }));
jest.mock('../../src/dane/pliki/system', () => ({ ...jest.requireActual<object>('../../src/dane/pliki/system'), usunPlik: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWloczki = (require('../../app/wloczka') as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Picker = require('expo-image-picker') as { launchCameraAsync: jest.Mock };

test('PU-289: „Choose from library” → miniatura etykiety w arkuszu i po ponownym otwarciu; „Take photo” bez zgody → „Oczko can’t use the camera”, „Open Settings”, brak zapisu', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const ustawienia = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [['INSERT INTO wloczka (id, nazwa, motki, zmieniono_ms) VALUES (?, ?, ?, ?)', ['y1', 'Merino', 3, 1]]]);
  mock.tmp = join(s.katalog, 'tmp', 'etykieta.jpg');
  writeFileSync(mock.tmp, 'ETYKIETA-JPG');
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k, preferencje: preferencje() };
  const r = render(<EkranWloczki />);
  fireEvent.press(await screen.findByTestId('zdjecia-dodaj'));
  await act(async () => { fireEvent.press(screen.getByText('Choose from library')); await new Promise((x) => setTimeout(x, 150)); });
  await waitFor(() => expect(within(screen.getByTestId('wloczka-zdjecia')).getByTestId('zdjecia-miniatura')).toBeTruthy());
  expect(await ile(s.baza, 'zdjecie', 'wloczka_id = ?', ['y1'])).toBe(1);
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  r.unmount();
  render(<EkranWloczki />); // ponowne otwarcie arkusza
  expect(await within(await screen.findByTestId('wloczka-zdjecia')).findByTestId('zdjecia-miniatura')).toBeTruthy();
  fireEvent.press(screen.getByTestId('zdjecia-dodaj'));
  fireEvent.press(screen.getByText('Take photo'));
  await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
  const [tytul, opis, przyciski] = alert.mock.calls[0];
  expect(tytul).toBe('Oczko can’t use the camera');
  expect(opis).toBe(j.t('zdjecia.brak_aparatu_opis'));
  expect(przyciski?.map((p) => p.text)).toEqual(['Cancel', 'Open Settings']);
  przyciski?.find((p) => p.text === 'Open Settings')?.onPress?.();
  expect(ustawienia).toHaveBeenCalledTimes(1);
  expect(Picker.launchCameraAsync).not.toHaveBeenCalled();
  expect(await ile(s.baza, 'zdjecie', 'wloczka_id = ?', ['y1'])).toBe(1);
  alert.mockRestore(); ustawienia.mockRestore();
});
