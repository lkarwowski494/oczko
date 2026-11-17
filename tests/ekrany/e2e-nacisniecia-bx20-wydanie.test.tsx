// BX20 (KO-136, wariant A, P-951), strona negatywna: bez `EXPO_PUBLIC_E2E=1` (build wydania, P-238) nie ma paneli liczenia naciśnięć (`e2e-nacisniecia`), moduł paneli
// nie jest ładowany, a „Dziś” i „wstecz” działają jak dotąd (bez haka: onPress dostaje to samo wywołanie, nic się nie liczy).
delete process.env.EXPO_PUBLIC_E2E;
import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import { Wstecz } from '../../src/ekrany/Pasek';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import type { PaneleE2e } from '../../src/platforma/tryb-e2e';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
const mockWstecz = jest.fn();
jest.mock('expo-router', () => {
  const { Wstecz: W } = jest.requireActual<typeof import('../../src/ekrany/Pasek')>('../../src/ekrany/Pasek');
  const Stack = ({ children }: { children: React.ReactNode }) => mockReact.createElement(mockRn.View, { testID: 'stos' }, children, mockReact.createElement(W, { tekst: 'Back', onPress: () => mockWstecz() }));
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
jest.mock('../../src/kompozycja/wstecz-trasa', () => ({ useTytulPoprzedniego: () => null })); // etykieta „wstecz” bez stosu expo-router
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
jest.mock('../../src/kompozycja/Kontekst', () => ({ DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/licznik', () => ({ kompozycjaLicznika: () => ({ zamknij: jest.fn(), poZmianie: jest.fn(async () => undefined) }) }));
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { mockWstecz.mockClear(); });

test('moduł paneli E2E (z panelami naciśnięć) nie jest ładowany poza buildem E2E (`paneleE2e` = null)', () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { paneleE2e } = require('../../src/platforma/tryb-e2e') as { paneleE2e: PaneleE2e | null };
    expect(paneleE2e).toBeNull();
  });
});
test('poza buildem E2E: korzeń nie ma panelu `e2e-nacisniecia`, a „wstecz” w stosie działa', async () => {
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  render(<Korzen />);
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  expect(screen.getByTestId('stos')).toBeTruthy();
  fireEvent.press(screen.getByTestId('nav-wstecz'));
  expect(mockWstecz).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('e2e-nacisniecia')).toBeNull();
  expect(screen.queryByTestId('e2e-dotyk')).toBeNull(); // BX21 (P-954): panelu cyklu dotyku też nie ma
});
test('bez haka: „Wstecz” wywołuje onPress', () => {
  const wstecz = jest.fn();
  render(<Wstecz tekst="Back" onPress={wstecz} />);
  fireEvent.press(screen.getByTestId('nav-wstecz'));
  expect(wstecz).toHaveBeenCalledTimes(1);
  // BX21 (P-954): bez haka `Pressable` nie dostaje obserwatorów dotyku (żadne handlery nie są dokładane)
  const props = screen.getByTestId('nav-wstecz').props as Record<string, unknown>;
  for (const h of ['onTouchStart', 'onTouchEnd', 'onTouchCancel', 'onPressIn', 'onPressOut']) expect(props[h]).toBeUndefined();
});
test('bez haka: „Dziś” — „+1” i „Kontynuuj” działają, panelu naciśnięć nie ma', async () => {
  const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
  const naPlus = jest.fn(async () => plusOk(43));
  const naKontynuuj = jest.fn();
  render(<Dzis stan={stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 })} dane={DANE} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()}
    naPlus={naPlus} naCofnijSerie={jest.fn()} naOferty={jest.fn()} naKontynuuj={naKontynuuj} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} />);
  await act(async () => { fireEvent.press(screen.getByTestId('dzis-plus')); });
  fireEvent.press(screen.getByTestId('dzis-kontynuuj'));
  expect(naPlus).toHaveBeenCalledTimes(1);
  expect(naKontynuuj).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('e2e-nacisniecia')).toBeNull();
  for (const id of ['dzis-plus', 'dzis-kontynuuj']) { // BX21 (P-954): bez haka brak obserwatorów dotyku na celach „Dziś”
    const props = screen.getByTestId(id).props as Record<string, unknown>;
    for (const h of ['onTouchStart', 'onTouchEnd', 'onTouchCancel', 'onPressIn', 'onPressOut']) expect(props[h]).toBeUndefined();
  }
});
