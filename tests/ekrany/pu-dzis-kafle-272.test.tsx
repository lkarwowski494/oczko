// PU-272 (katalog przypadków użycia, „Zakreślanie na wzorze i przyciski na „Dziś””): kafle „Dziś” — „New project” (nazwa „Shawl” → licznik 0), „Yarn and needles” (zakładka Tools),
// „Swatch” (20 oczek, 50 cm → 100 oczek). Trasy „/” (prawdziwy ekran Aplikacja), app/formularz/[rodzaj], app/licznik i app/probka na prawdziwej bazie.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0 } from '../dane/pomocnicze/srodowisko';
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
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
const EkranProbki = (require('../../app/probka') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */



test('PU-272: kafle „Dziś”: „New project” → „Shawl” otwiera licznik 0, „Yarn and needles” → Tools, „Swatch” → 20 oczek na 50 cm daje 100 oczek', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  s.zegar.ustaw(T0);
  expect(await k.przygotuj()).toMatchObject({ ok: true });
  const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) };
  mockAplikacja = { kontener: { z: s.z, j, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki(), siec: { stan: () => 'jest', obserwuj: () => () => undefined } }, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: { stan: () => ({ wibracje: false, ukladMiar: 'metric' }) } };
  const czekaj = (ms = 150) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

  // kafle prowadzą tam, dokąd mają (trasy), a trasy robią swoje
  const dzis = render(<Start />);
  await czekaj();
  fireEvent.press(await screen.findByTestId('dzis-kafel-nowy-projekt'));
  expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'nowy-projekt' } });
  fireEvent.press(screen.getByTestId('dzis-kafel-wloczka'));
  expect(mockRouter.navigate).toHaveBeenLastCalledWith('/narzedzia'); // zakładka „Tools”
  fireEvent.press(screen.getByTestId('dzis-kafel-probka'));
  expect(mockRouter.push).toHaveBeenLastCalledWith('/probka');
  dzis.unmount();

  mockParams = { rodzaj: 'nowy-projekt' };
  render(<EkranFormularza />);
  await czekaj();
  fireEvent.changeText(screen.getByTestId('formularz-nazwa-projektu'), 'Shawl');
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 200)); });
  screen.unmount();
  render(<EkranLicznika />);
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('0'));
  expect(screen.getByTestId('licznik-projekt')).toHaveTextContent('Shawl');
  screen.unmount();

  mockParams = {};
  render(<EkranProbki />);
  fireEvent.changeText(await screen.findByTestId('probka-oczka'), '20');
  fireEvent.changeText(screen.getByTestId('probka-szerokosc'), '50');
  await waitFor(() => expect(screen.getByTestId('probka-wynik-oczka')).toHaveTextContent('100 stitches'));
  expect(await (s.baza satisfies PortBazy).all('SELECT count(*) AS n FROM projekt', [])).toEqual([{ n: 1 }]); // jeden projekt „Shawl” z kafla „New project”
});
