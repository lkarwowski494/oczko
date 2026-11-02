// E2-A2 (scen. 34), strażnik: nie odtworzono pustego ekranu na poziomie RNTL (dane, trasa formularza, licznik.widok i trasa projektu zielone) — zob. docs/programista/poprawki-e2-b.md. Ścieżka: „/formularz/co-dalej” → „A second Back” → licznik drugiej części → `licznik.widok()` (id dla „/projekt/[id]”).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, wykonaj } from '../dane/pomocnicze/srodowisko';

const mock: { kontener?: unknown; licznik?: unknown; router: { back: jest.Mock; push: jest.Mock; replace: jest.Mock; dismissTo: jest.Mock } } = { router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() } };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mock.router, useLocalSearchParams: () => ({ rodzaj: 'co-dalej', czesc: 'c1' }), useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener, licznik: mock.licznik }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;

test('scen. 34: „A second Back” → licznik nowej części należy do tego samego projektu i widok licznika daje id projektu', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweater', T0), czesc('c1', 'p1', 'Back', 1, { cel: 40 }), ...licznik('l1', 'c1', 39)]);
  await k.otworz('l1');
  expect((await dodajRzad(s.z, { licznikId: 'l1' })).ok).toBe(true);
  await k.poZmianie();
  mock.kontener = { z: s.z, j };
  mock.licznik = k;
  render(<EkranFormularza />);
  fireEvent.press(await screen.findByTestId('co-dalej-druga'));
  await waitFor(() => expect(mock.router.dismissTo).toHaveBeenCalledWith('/'));
  const w = await k.widok();
  expect(w).not.toBeNull();
  expect(w?.projektId).toBe('p1');
  expect(k.biezacy()).not.toBe('l1');
});
