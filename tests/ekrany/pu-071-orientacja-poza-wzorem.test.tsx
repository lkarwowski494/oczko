// PU-071 (katalog przypadków użycia, „Duży tekst, ciemny motyw, obrót”): „ekrany poza wzorem nie obracają się na iPhonie” — na prawdziwym korzeniu nawigacji `app/_layout.tsx`
// (harness jak pu-139-motyw-ciemny-korzen.test.tsx: Stack i Stack.Screen zbierają opcje) sprawdzamy ORIENTACJĘ każdego ekranu iPhone'a: domyślnie `portrait_up`, wyjątek tylko trasa `wzor` (`all`).
// Poza Jest: faktyczny obrót urządzenia i zachowanie systemu iOS (scenariusz 105, oczekujący; przy przebiegu na symulatorze sprawdza tylko proporcję okna panelem `e2e-okno`).
import React from 'react';
import * as RN from 'react-native';
import { AppState } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import type * as StartAplikacji from '../../src/kompozycja/start-aplikacji';

type Opcje = { orientation?: string };
const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
const mockStos: { domyslne: Opcje | null; ekrany: { name: string; options?: Opcje }[] } = { domyslne: null, ekrany: [] };
jest.mock('expo-router', () => {
  const Stack = (p: { children: React.ReactNode; screenOptions?: Opcje }) => { mockStos.domyslne = p.screenOptions ?? null; return mockReact.createElement(mockRn.View, { testID: 'stos' }, p.children); };
  Stack.Screen = (p: { name: string; options?: Opcje }) => { mockStos.ekrany.push({ name: p.name, options: p.options }); return null; };
  return { Stack };
});
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<typeof StartAplikacji>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined,
}));
jest.mock('../../src/kompozycja/kontener', () => ({
  utworzKontener: async () => ({
    ok: true,
    wartosc: {
      dostep: { nasluchuj: () => () => undefined, odswiez: async () => undefined, stan: () => ({ pro: false }), naZmiane: () => () => undefined },
      z: {}, j: {}, icloud: null, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
      zamknij: async () => undefined,
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
beforeEach(() => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  mockStos.domyslne = null; mockStos.ekrany = [];
});
afterEach(() => jest.restoreAllMocks());

describe('PU-071 · iPhone: ekrany poza wzorem zostają w pionie', () => {
  test('PU-071: stos domyślnie `portrait_up` (Licznik, Dziś, Ustawienia, Projekty, Historia, Narzędzia), żaden ekran poza `wzor` tego nie zmienia, a `wzor` obraca się (`all`)', async () => {
    expect((RN.Platform as { isPad?: boolean }).isPad).toBeFalsy(); // iPhone
    render(<Korzen />);
    await chwila(50);
    expect(screen.getByTestId('stos')).toBeTruthy();
    expect(mockStos.domyslne?.orientation).toBe('portrait_up');
    const nazwy = mockStos.ekrany.map((e) => e.name);
    expect(nazwy).toEqual(expect.arrayContaining(['(zakladki)', 'licznik', 'wzor']));
    for (const e of mockStos.ekrany) {
      const skuteczna = e.options?.orientation ?? mockStos.domyslne?.orientation;
      expect([e.name, skuteczna]).toEqual([e.name, e.name === 'wzor' ? 'all' : 'portrait_up']);
    }
  });
});
