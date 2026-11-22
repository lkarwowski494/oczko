// PU-172 (katalog przypadków użycia, „Języki”): język pl → „Ustawienia” → wiersz „Zgłoś problem z tłumaczeniem” → otwiera się arkusz zgłoszenia (trasa „/zglos”, `arkusz-zamknij` widoczny) → zamknięcie wraca.
// Poziom: trasy `app/ustawienia` i `app/zglos` na prawdziwej bazie i prawdziwym i18n pl; router to atrapa, więc „otwarcie” to `push` na ścieżkę, pod którą stoi ta sama trasa `app/zglos`.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { przygotuj } from '../dane/pomocnicze/srodowisko';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }) }));
const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []), useLocalSearchParams: () => ({}) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: { udostepnij: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0', ios: { buildNumber: '2001' } }, platform: { ios: { model: 'iPhone17,3' } }, deviceName: 'x' } }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;
const EkranZgloszenia = (require('../../app/zglos') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

// PU-172: pl → wiersz „Zgłoś problem z tłumaczeniem” kieruje na „/zglos”; ta trasa pokazuje arkusz zgłoszenia z `arkusz-zamknij`, który wraca.
test('PU-172: język pl → „Zgłoś problem z tłumaczeniem” otwiera „/zglos” z arkuszem zgłoszenia, „Anuluj” zamyka', async () => {
  const i = await utworzI18n({ magazyn: { odczytaj: async () => 'pl', zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const s = await przygotuj();
  const j = { t: i.t, preferencja: i.preferencja, jezyk: i.jezyk };
  mockAplikacja = {
    kontener: { z: s.z, j, icloud: null, katalogDanych: s.katalog, dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined } },
    licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };
  const ust = render(<EkranUstawien />);
  expect(screen.getByTestId('ustawienia-jakosc-tlumaczenia')).toBeTruthy();
  fireEvent.press(screen.getByRole('link', { name: 'Zgłoś problem z tłumaczeniem' }));
  expect(mockRouter.push).toHaveBeenCalledWith('/zglos');
  ust.unmount();
  render(<EkranZgloszenia />);
  const zamknij = await screen.findByTestId('arkusz-zamknij');
  expect(screen.getByTestId('arkusz-zamknij')).toBeTruthy();
  fireEvent.press(zamknij);
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
});
