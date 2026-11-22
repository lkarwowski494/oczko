// M1-audytor-generalny-100 (12-niezawodnosc-502, ADR-0020 (4)): brak miejsca przy OTWARCIU bazy (SQLITE_FULL, np. przy tworzeniu `-shm` po awarii)
// ma dojść do ekranu awaryjnego jako `brak_miejsca`, nie jako „Oczko can’t read your data”. Korzeń `app/_layout.tsx` z prawdziwym `otworzBaze`
// (fabryka połączenia rzuca SQLITE_FULL) i prawdziwym `powodAwaryjny`; ekran awaryjny podmieniony na atrapę zapisującą powód.
import React from 'react';
import { AppState } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import type { PortBazy } from '../../src/domena/porty';

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
const mockBlad: { tekst: string; wolne: number | null } = { tekst: '', wolne: null };
jest.mock('../../src/kompozycja/kontener', () => ({
  utworzKontener: () => jest.requireActual<typeof import('../../src/dane/baza/polaczenie')>('../../src/dane/baza/polaczenie').otworzBaze('/kontener/Library/Application Support/oczko.db', (): PortBazy => { throw new Error(mockBlad.tekst); }, () => mockBlad.wolne),
}));
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
jest.mock('../../src/kompozycja/Kontekst', () => ({ DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/jezyk-awaryjny', () => ({ tAwaryjny: async () => (k: string) => k }));
jest.mock('../../src/kompozycja/EkranAwaryjny', () => ({
  EkranAwaryjny: (p: { powod: string }) => mockReact.createElement(mockRn.Text, { testID: 'ekran-awaryjny' }, p.powod),
}));
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const chwila = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

beforeEach(() => {
  mockBlad.wolne = null; // wolne miejsce nieznane: powód tylko z treści błędu
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true }); // start na pierwszym planie (ADR-0019)
});

test.each([
  ['SQLITE_FULL: database or disk is full', 'brak_miejsca'],
  ['ENOSPC: no space left on device', 'brak_miejsca'],
  ['SQLITE_NOTADB: file is not a database', 'uszkodzony'],
  ['SQLITE_CANTOPEN: unable to open database file', 'uszkodzony'], // „plik niedostępny” osobno: [DO USTALENIA] Z07-21
])('M1-100 ADR-0020 (4): otwarcie bazy rzuca „%s” → ekran awaryjny z powodem „%s”', async (blad, powod) => {
  mockBlad.tekst = blad;
  render(<Korzen />);
  await chwila(50);
  expect(screen.getByTestId('ekran-awaryjny').props.children).toBe(powod);
});

// M1-audytor-generalny-157 (12-niezawodnosc-505, ADR-0020 (4)): SQLite zgłasza brak miejsca przy powiększaniu `-shm` (odbudowa indeksu WAL) jako
// SQLITE_IOERR „disk I/O error”, nie SQLITE_FULL. Przy znanym wolnym miejscu poniżej progu korzeń ma pokazać `brak_miejsca`, nie „can’t read your data”.
test('M1-157 ADR-0020 (4): otwarcie bazy rzuca „disk I/O error” przy wolnym miejscu 0 → ekran awaryjny z powodem „brak_miejsca”', async () => {
  mockBlad.tekst = 'SQLITE_IOERR: disk I/O error';
  mockBlad.wolne = 0;
  render(<Korzen />);
  await chwila(50);
  expect(screen.getByTestId('ekran-awaryjny').props.children).toBe('brak_miejsca');
});
