// PU-050 (katalog przypadków użycia, „Uprawnienia i zdjęcia”): projekt → „Add photo” → „Take photo” przy odmowie dostępu do aparatu → alert „Oczko can’t use the camera”
// z opisem i przyciskiem „Open Settings”, który otwiera ustawienia aplikacji; zdjęcie się nie zapisuje. Prawdziwy ekran projektu i adapter wyboru zdjęcia, atrapa tylko modułu systemowego.
import React from 'react';
import { Alert, Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mock: { kontener?: unknown; dodajZdjecie: jest.Mock; router: Record<string, jest.Mock> } = {
  dodajZdjecie: jest.fn(), router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn() },
};
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: false })),
  launchCameraAsync: jest.fn(), launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mock.router, useLocalSearchParams: () => ({ id: 'p1' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener, licznik: { biezacy: () => null, otworz: async () => undefined, poZmianie: async () => undefined, poUsunieciu: async () => undefined } }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: { otworzAdres: jest.fn() } }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/kompozycja/obrazy-aplikacji', () => ({ zaleznosciObrazu: () => ({}) }));
jest.mock('../../src/przypadki-uzycia/zdjecia', () => ({ ...jest.requireActual<object>('../../src/przypadki-uzycia/zdjecia'), dodajZdjecie: (...a: unknown[]) => mock.dodajZdjecie(...a) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Picker = require('expo-image-picker') as { launchCameraAsync: jest.Mock };

test('PU-050: odmowa dostępu do aparatu → alert „Oczko can’t use the camera” z opisem i „Open Settings” (otwiera ustawienia aplikacji), bez aparatu i bez zapisu zdjęcia', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const ustawienia = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)]);
  s.zegar.ustaw(T0);
  const t = await tEn();
  mock.kontener = { z: s.z, j: { t, jezyk: () => 'en-US', zegar24h: () => false } satisfies Jezyk, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
    wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } };
  render(<EkranProjektu />);
  await waitFor(() => screen.getByTestId('zdjecia-dodaj'));

  fireEvent.press(screen.getByTestId('zdjecia-dodaj'));
  fireEvent.press(screen.getByText('Take photo'));

  await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
  const [tytul, opis, przyciski] = alert.mock.calls[0];
  expect(tytul).toBe('Oczko can’t use the camera');
  expect(opis).toBe(t('zdjecia.brak_aparatu_opis'));
  expect(opis).toMatch(/allow camera access in Settings/);
  const otworz = przyciski?.find((p) => p.text === 'Open Settings');
  expect(otworz).toBeDefined();
  expect(ustawienia).not.toHaveBeenCalled();
  otworz?.onPress?.();
  expect(ustawienia).toHaveBeenCalledTimes(1);
  expect(Picker.launchCameraAsync).not.toHaveBeenCalled();
  expect(mock.dodajZdjecie).not.toHaveBeenCalled();
  alert.mockRestore(); ustawienia.mockRestore();
});
