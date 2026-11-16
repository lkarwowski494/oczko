// BX11 zad. 2 / CH-01 (P1, `docs/jakosc/ch-recenzja-bx9.md`): scenariusz 105 (PU-071: poza wzorem obrót poziomo zostaje w pionie) nie mógł paść, bo Maestro nie czyta wymiarów okna,
// a asercje `below` są prawdziwe w obu orientacjach. Build E2E (`EXPO_PUBLIC_E2E=1`) ma w korzeniu nawigacji panel `e2e-okno` z proporcją okna z `useWindowDimensions`
// („window: portrait (szer. x wys.)” albo „window: landscape (…)”); poza buildem E2E go nie ma (test obok: e2e-okno-stan-wydanie.test.tsx). Panel tylko pokazuje — zachowanie aplikacji bez zmian.
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie (require niżej, po ustawieniu)
import React from 'react';
import { AppState, Dimensions } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { opisOkna } from '../../src/kompozycja/e2e/okno-stan';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
jest.mock('expo-router', () => {
  const Stack = ({ children }: { children: React.ReactNode }) => mockReact.createElement(mockRn.View, { testID: 'stos' }, children);
  Stack.Screen = () => null;
  return { Stack };
});
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined,
}));
jest.mock('../../src/kompozycja/kontener', () => ({
  utworzKontener: async () => ({
    ok: true,
    wartosc: {
      dostep: { nasluchuj: () => () => undefined, odswiez: async () => undefined, stan: () => ({ pro: false }), naZmiane: () => () => undefined },
      z: {}, j: {}, icloud: null, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
    },
  }),
}));
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
jest.mock('../../src/kompozycja/Kontekst', () => ({ DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/licznik', () => ({ kompozycjaLicznika: () => ({ zamknij: jest.fn(), poZmianie: jest.fn(async () => undefined) }) }));
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const chwila = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const okno = (width: number, height: number) => act(() => { Dimensions.set({ window: { width, height, scale: 3, fontScale: 1 }, screen: { width, height, scale: 3, fontScale: 1 } }); });
const tekst = () => String(screen.getByTestId('e2e-okno').props.children);

beforeEach(() => {
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true }); // start na pierwszym planie (ADR-0019)
});

describe('CH-01: opis okna (czysta funkcja panelu `e2e-okno`)', () => {
  test.each([[390, 844, 'window: portrait (390 x 844)'], [844, 390, 'window: landscape (844 x 390)'], [600, 600, 'window: portrait (600 x 600)'], [390.4, 843.6, 'window: portrait (390 x 844)']])(
    '%d x %d → „%s”', (w, h, oczekiwany) => { expect(opisOkna(w, h)).toBe(oczekiwany); });
});

describe('CH-01: panel `e2e-okno` w korzeniu nawigacji (build E2E)', () => {
  test('okno pionowe: „window: portrait (390 x 844)”', async () => {
    okno(390, 844);
    render(<Korzen />);
    await chwila(50);
    expect(screen.getByTestId('stos')).toBeTruthy();
    expect(tekst()).toBe('window: portrait (390 x 844)');
  });
  test('obrót okna poziomo zmienia tekst na „window: landscape (844 x 390)” i z powrotem', async () => {
    okno(390, 844);
    render(<Korzen />);
    await chwila(50);
    okno(844, 390);
    expect(tekst()).toBe('window: landscape (844 x 390)');
    okno(390, 844);
    expect(tekst()).toBe('window: portrait (390 x 844)');
  });
  test('okno kwadratowe liczy się jak pionowe (wysokość >= szerokość)', async () => {
    okno(600, 600);
    render(<Korzen />);
    await chwila(50);
    expect(tekst()).toBe('window: portrait (600 x 600)');
  });
  test('panel nie przechwytuje stuknięć: `pointerEvents="none"`', async () => {
    okno(390, 844);
    render(<Korzen />);
    await chwila(50);
    expect(screen.getByTestId('e2e-okno').props.pointerEvents).toBe('none');
  });
});
