// M1-audytor-generalny-074 (12-niezawodnosc-005; ADR-0019 „Tryb awaryjny: … nie zapisuje do bazy”, ADR-0018 fix-6): start danych na trasie „/”
// (`licznik.przygotuj` → `uruchomDane`, np. migracja) kończy się błędem → ekran awaryjny. W tym stanie błąd JS nie trafia do tabeli `blad`
// (niezmigrowana baza; atrapa portu liczy `run`), a „Try normally” naprawdę ponawia start danych (`uruchomDane` wołane ponownie), zamiast
// wracać do zapamiętanego wyniku tego samego procesu. Korzeń `app/_layout.tsx` i trasa `app/index.tsx` prawdziwe; kontener, strażnik startu
// i `uruchomDane` podmienione (bez dysku i modułów natywnych); obsługa błędów JS prawdziwa na atrapie `ErrorUtils`.
import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ObslugaBledowRN } from '../../src/kompozycja/bledy-js';
import { tEn } from './pomoc';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
jest.mock('expo-router', () => {
  // Stos rysuje trasę „/” (pierwszy ekran) — jak expo-router przy starcie.
  const Stack = () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Indeks = (require('../../app/index') as { default: React.ComponentType }).default;
    return mockReact.createElement(mockRn.View, { testID: 'stos' }, mockReact.createElement(Indeks));
  };
  Stack.Screen = () => null;
  return { Stack, useRouter: () => mockRouter, useFocusEffect: () => undefined, usePathname: () => '/' };
});
const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined, zapiszKamien: async () => undefined,
  sprobujNormalnieTeraz: async () => undefined, trybAwaryjny: () => ({ kopia: Promise.resolve(null) }),
}));
/** Atrapa portu bazy: liczy zapisy (`run`, także w transakcji); odczyty puste. */
const mockBaza: { run: jest.Mock; all: jest.Mock; transakcja(f: (tx: unknown) => Promise<unknown>): Promise<unknown> } = {
  run: jest.fn(async () => undefined), all: jest.fn(async () => []), transakcja: (f) => f(mockBaza),
};
const mockUruchomDane = jest.fn(async (): Promise<unknown> => ({ ok: false, powod: 'zapis' }));
jest.mock('../../src/przypadki-uzycia/start', () => ({ ...jest.requireActual<object>('../../src/przypadki-uzycia/start'), uruchomDane: () => mockUruchomDane() }));
let mockT: unknown;
jest.mock('../../src/kompozycja/kontener', () => ({
  utworzKontener: async () => ({
    ok: true,
    wartosc: {
      z: { baza: mockBaza, zegar: { teraz: () => ({ ms: 0, dzien: '2026-11-02', strefa: 'UTC' }) } },
      j: { t: mockT, jezyk: () => 'en-US', zegar24h: () => false, naZmiane: () => () => undefined },
      dostep: { nasluchuj: () => () => undefined, odswiez: async () => undefined, stan: () => ({ pro: false, poziom: 'darmowy' }), naZmiane: () => () => undefined },
      porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } }, icloud: null,
      wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
    },
  }),
}));
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
jest.mock('../../src/kompozycja/jezyk-awaryjny', () => ({ tAwaryjny: async () => mockT }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: { naZmiane: () => () => undefined }, oglos: jest.fn(), systemAplikacji: {} }));
// Globalny handler błędów JS (RN `ErrorUtils`) — atrapa, żeby test mógł zgłosić błąd jak środowisko uruchomieniowe.
const mockErrorUtils: ObslugaBledowRN & { h: (e: unknown, fatal?: boolean) => void } = {
  h: () => undefined,
  getGlobalHandler() { return () => undefined; },
  setGlobalHandler(h) { mockErrorUtils.h = h; },
};
(globalThis as { ErrorUtils?: unknown }).ErrorUtils = mockErrorUtils;
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const chwila = (ms = 100) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

beforeEach(async () => {
  mockT = await tEn();
  mockBaza.run.mockClear();
  mockUruchomDane.mockClear();
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true }); // start na pierwszym planie (ADR-0019)
});

test('M1-074 ADR-0019: start danych na trasie „/” zwraca błąd → ekran awaryjny, a błąd JS w tym stanie nie zapisuje nic do bazy', async () => {
  render(<Korzen />);
  await chwila();
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy();
  expect(mockUruchomDane).toHaveBeenCalledTimes(1);
  mockErrorUtils.h(new TypeError('render ekranu awaryjnego'), true);
  await chwila();
  expect(mockBaza.run).not.toHaveBeenCalled();
});

test('M1-074 ADR-0019: „Try normally” po błędzie startu danych na trasie „/” ponawia start danych (`uruchomDane` drugi raz)', async () => {
  render(<Korzen />);
  await chwila();
  expect(mockUruchomDane).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('awaryjny-sprobuj-normalnie'));
  await chwila();
  expect(mockUruchomDane).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy(); // start znów zawiódł → znów ekran awaryjny, nie pusta plansza
});

test('M1-074 M1-007: start danych na trasie „/” odrzuca obietnicę → ekran awaryjny korzenia z „Try normally”, bez zapisu błędu JS', async () => {
  mockUruchomDane.mockImplementationOnce(async () => { throw new Error('baza zajęta'); });
  render(<Korzen />);
  await chwila();
  expect(screen.getByTestId('awaryjny-sprobuj-normalnie')).toBeTruthy();
  mockErrorUtils.h(new TypeError('render ekranu awaryjnego'), false);
  await chwila();
  expect(mockBaza.run).not.toHaveBeenCalled();
});
