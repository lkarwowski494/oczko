// BX11 zad. 2 / CH-01, strona negatywna: bez `EXPO_PUBLIC_E2E=1` (build wydania, P-238) korzeń nawigacji nie ma panelu `e2e-okno`, a stos ekranów działa jak dotąd.
delete process.env.EXPO_PUBLIC_E2E;
import React from 'react';
import { AppState } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import type { PaneleE2e } from '../../src/platforma/tryb-e2e';

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

test('moduł paneli E2E (z `PanelOkna`) nie jest ładowany poza buildem E2E (`paneleE2e` = null)', () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { paneleE2e } = require('../../src/platforma/tryb-e2e') as { paneleE2e: PaneleE2e | null };
    expect(paneleE2e).toBeNull();
  });
});
test('poza buildem E2E: stos ekranów jest, panelu `e2e-okno` nie ma', async () => {
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  render(<Korzen />);
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  expect(screen.getByTestId('stos')).toBeTruthy();
  expect(screen.queryByTestId('e2e-okno')).toBeNull();
});
