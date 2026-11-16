// PU-139 (katalog przypadków użycia, „Wygląd i dostępność”), część korzenia: tło korzenia nawigacji w motywie ciemnym = ciemny `tlo` — placeholder startu (przed kontenerem),
// `contentStyle` stosu ekranów (tło każdej trasy bez własnego) i opakowanie `Bezpieczny` tras „Dziś”, licznika, wzoru, Ustawień i przewodnika.
// Harness korzenia jak tests/ekrany/start-limit-sklepu.test.tsx (strażnik startu, kontener, licznik i preferencje podmienione). Pozostałe ekrany: pu-139-motyw-ciemny*.test.tsx.
// Poza Jest (częściowo): faktyczne przełączenie wyglądu systemu i zrzuty — `simctl ui appearance dark` (scenariusze ciemnego motywu).
import React from 'react';
import * as RN from 'react-native';
import { AppState, StyleSheet, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { Bezpieczny } from '../../src/kompozycja/Bezpieczny';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
const mockStos: { opcje: { contentStyle?: { backgroundColor?: string } } | null } = { opcje: null };
jest.mock('expo-router', () => {
  const Stack = (p: { children: React.ReactNode; screenOptions?: { contentStyle?: { backgroundColor?: string } } }) => { mockStos.opcje = p.screenOptions ?? null; return mockReact.createElement(mockRn.View, { testID: 'stos' }, p.children); };
  Stack.Screen = () => null;
  return { Stack };
});
const mockStart: { kontener: () => Promise<unknown> } = { kontener: () => new Promise(() => undefined) };
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined,
}));
jest.mock('../../src/kompozycja/kontener', () => ({ utworzKontener: () => mockStart.kontener() }));
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
jest.mock('../../src/kompozycja/Kontekst', () => ({ DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/licznik', () => ({ kompozycjaLicznika: () => ({ zamknij: jest.fn(), poZmianie: jest.fn(async () => undefined) }) }));
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const C = tokeny.kolory.ciemny;
const chwila = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
beforeEach(() => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  mockStos.opcje = null;
});
afterEach(() => jest.restoreAllMocks());

describe('PU-139 · tło korzenia w motywie ciemnym', () => {
  test('placeholder startu (przed kontenerem) stoi na ciemnym `tlo`', () => {
    mockStart.kontener = () => new Promise(() => undefined);
    render(<Korzen />);
    const korzen = screen.toJSON() as { props: { style: unknown } };
    expect(StyleSheet.flatten(korzen.props.style as never)).toMatchObject({ flex: 1, backgroundColor: C.tlo });
    expect(C.tlo).not.toBe(tokeny.kolory.jasny.tlo); // ciemny token różni się od jasnego: test odróżnia motywy
  });

  test('stos ekranów: `contentStyle` (tło tras bez własnego) = ciemny `tlo`', async () => {
    mockStart.kontener = async () => ({
      ok: true,
      wartosc: {
        dostep: { nasluchuj: () => () => undefined, odswiez: async () => undefined, stan: () => ({ pro: false }), naZmiane: () => () => undefined },
        z: {}, j: {}, icloud: null, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
        wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
        zamknij: async () => undefined,
      },
    });
    render(<Korzen />);
    await chwila(50);
    expect(screen.getByTestId('stos')).toBeTruthy();
    expect(mockStos.opcje?.contentStyle?.backgroundColor).toBe(C.tlo);
  });

  test('`Bezpieczny` (opakowanie tras Dziś, licznik, wzór, Ustawienia, przewodnik): obszar bezpieczny na ciemnym `tlo`', () => {
    render(<Bezpieczny><Text>treść</Text></Bezpieczny>);
    const korzen = screen.toJSON() as { props: { style: unknown } };
    expect(StyleSheet.flatten(korzen.props.style as never)).toMatchObject({ flex: 1, backgroundColor: C.tlo });
  });
});
