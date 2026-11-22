// PU-271 (katalog przypadków użycia, „Zakreślanie na wzorze i przyciski na „Dziś””): dwa projekty, brak bieżącego licznika → „Dziś” z kartą „Your projects are here” → „Choose a project” otwiera „Projects”;
// po wyborze projektu i +1 „Dziś” pokazuje ten projekt z „Continue”. Trasy „/” (z prawdziwym ekranem Aplikacja) i app/(zakladki)/projekty na prawdziwej bazie i kompozycji licznika.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { DOBA, T0, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki } from './pomoc';
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
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
/* eslint-disable @typescript-eslint/no-require-imports */
const Start = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;
const EkranProjektow = (require('../../app/(zakladki)/projekty') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */



test('PU-271: bez bieżącego licznika „Dziś” pokazuje „Your projects are here” z „2 projects in progress…”; „Choose a project” → Projects; po wyborze „Sweter” i +1 karta pokazuje „Sweter” z „Continue”', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweter', T0), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 3), projekt('p2', 'Szal', T0 - DOBA), czesc('c2', 'p2', 'Body', 1), ...licznik('l2', 'c2', 4, { t: T0 - DOBA })]);
  s.zegar.ustaw(T0 + 3_600_000);
  expect((await k.przygotuj())).toMatchObject({ ok: true, wartosc: { miejsce: 'lista' } });
  const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) };
  mockAplikacja = { kontener: { z: s.z, j, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki(), siec: { stan: () => 'jest', obserwuj: () => () => undefined } }, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: { stan: () => ({ wibracje: false }) } };
  const czekaj = (ms = 200) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
  const dzis = render(<Start />);
  await czekaj();
  expect(await screen.findByText('Your projects are here')).toBeTruthy();
  expect(screen.getByText('2 projects in progress. Choose one, and Today will open it where you stop.')).toBeTruthy();
  expect(screen.queryByTestId('dzis-wartosc')).toBeNull();
  fireEvent.press(screen.getByTestId('dzis-wybierz-projekt'));
  expect(mockRouter.navigate).toHaveBeenCalledWith('/projekty');
  dzis.unmount();

  const lista = render(<EkranProjektow />);
  await waitFor(() => expect(screen.getAllByTestId('projekty-wiersz')).toHaveLength(2));
  await act(async () => { fireEvent.press(screen.getAllByTestId('projekty-wiersz')[0]); await new Promise((r) => setTimeout(r, 100)); }); // najświeższy: „Sweter”
  expect(k.biezacy()).toBe('l1');
  lista.unmount();
  await k.uslugi.dodajRzad(); // „+1” na liczniku wybranego projektu
  await k.poZmianie();

  render(<Start />);
  await czekaj();
  await waitFor(() => expect(screen.getByTestId('dzis-projekt')).toHaveTextContent('Sweter'));
  expect(screen.getByTestId('dzis-kontynuuj')).toHaveTextContent('Continue');
  expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('4');
  expect(screen.queryByText('Your projects are here')).toBeNull();
});
