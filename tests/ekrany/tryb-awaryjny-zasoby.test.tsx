// M1-audytor-generalny-151 (08-programista-520, DEV-15 — zasoby zwalniane; ADR-0019): błąd startu na odczycie bieżącego licznika (`biezacyLicznik`
// po `uruchomDane`, np. brak miejsca) → `naAwarie` → ekran awaryjny korzenia. Przed ekranem kontener zdążył otworzyć połączenie z bazą i uruchomić
// sterownik iCloud (słuchacz partii w module natywnym). `naAwarie` zamyka port bazy i kończy sterownik, a „Try starting normally” otwiera dokładnie
// jedno nowe połączenie z jednym słuchaczem partii. Korzeń `app/_layout.tsx` i trasa `app/index.tsx` prawdziwe, sterownik iCloud prawdziwy
// (`sterownikSynchronizacji`) na atrapie modułu iCloud (zbiór słuchaczy wspólny dla procesu, jak moduł natywny); port bazy to atrapa z licznikiem połączeń.
import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ObslugaBledowRN } from '../../src/kompozycja/bledy-js';
import { tEn } from './pomoc';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
jest.mock('expo-router', () => {
  const Stack = () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Indeks = (require('../../app/index') as { default: React.ComponentType }).default;
    return mockReact.createElement(mockRn.View, { testID: 'stos' }, mockReact.createElement(Indeks));
  };
  Stack.Screen = () => null;
  return { Stack, useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), useFocusEffect: () => undefined, usePathname: () => '/' };
});
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined, zapiszKamien: async () => undefined,
  sprobujNormalnieTeraz: async () => undefined, trybAwaryjny: () => ({ kopia: Promise.resolve(null) }),
}));
jest.mock('../../src/przypadki-uzycia/start', () => ({ ...jest.requireActual<object>('../../src/przypadki-uzycia/start'), uruchomDane: async () => ({ ok: true, wartosc: { potwierdzone: [] } }) }));
const mockBiezacy = jest.fn(async (): Promise<unknown> => ({ ok: false, powod: 'brak_miejsca' }));
jest.mock('../../src/przypadki-uzycia/widok-licznika', () => ({ ...jest.requireActual<object>('../../src/przypadki-uzycia/widok-licznika'), biezacyLicznik: () => mockBiezacy() }));
jest.mock('../../src/kompozycja/zegarek-odbior', () => ({ odbiorZZegarka: () => ({ podlacz: () => undefined, zamknij: () => undefined, nasluchuj: () => () => undefined, poScaleniu: () => undefined }) }));

/** Połączenia z bazą otwarte przez kontenery tego procesu; `zamknij` jak adapter expo: dalsze `all`/`run` rzucają. */
type Polaczenie = { otwarte: boolean };
const mockPolaczenia: Polaczenie[] = [];
/** Słuchacze partii w module iCloud — jeden moduł natywny na proces, niezależnie od liczby kontenerów. */
const mockSluchaczePartii = new Set<unknown>();
function mockPort(p: Polaczenie) {
  const sprawdz = () => { if (!p.otwarte) throw new Error('Access to closed resource'); };
  const port = {
    run: jest.fn(async () => { sprawdz(); return { zmiany: 0 }; }),
    all: jest.fn(async () => { sprawdz(); return []; }),
    transakcja: async (f: (tx: unknown) => Promise<unknown>) => { sprawdz(); return f(port); },
  };
  return port;
}
let mockT: unknown;
const mockOdswiez = jest.fn(async (): Promise<void> => undefined);
jest.mock('../../src/kompozycja/kontener', () => ({
  utworzKontener: async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { sterownikSynchronizacji } = require('../../src/przypadki-uzycia/synchronizacja') as typeof import('../../src/przypadki-uzycia/synchronizacja');
    const p: Polaczenie = { otwarte: true };
    mockPolaczenia.push(p);
    const baza = mockPort(p);
    const zegar = { teraz: () => ({ ms: 0, dzien: '2026-11-02', strefa: 'UTC' }) };
    const nasluch = (s: Set<unknown>) => (f: unknown) => { s.add(f); return () => { s.delete(f); }; };
    const silnik = {
      odbieraj: nasluch(mockSluchaczePartii), wyslane: () => () => undefined, zdarzeniaKonta: () => () => undefined,
      statusKonta: async () => 'dostepne', uruchom: async () => undefined, wyslij: async () => undefined, wlacz: async () => ({ ok: true }), wylacz: async () => undefined,
      stan: () => 'wylaczona', usunStrefe: async () => ({ ok: true }),
    };
    const z = { baza, zegar, id: { nowy: () => 'id' }, urzadzenie: 'u1', magazyn: {}, zegarek: {}, liveActivity: {}, pro: () => false };
    return {
      ok: true,
      wartosc: {
        z, zamknij: async () => { p.otwarte = false; },
        j: { t: mockT, jezyk: () => 'en-US', zegar24h: () => false, naZmiane: () => () => undefined },
        dostep: { nasluchuj: () => () => undefined, odswiez: () => mockOdswiez(), stan: () => ({ pro: false, poziom: 'darmowy' }), naZmiane: () => () => undefined },
        porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
        icloud: { sterownik: sterownikSynchronizacji({ ...z, synchronizacja: silnik } as never), widoczny: true, e2e: null, naPartie: () => () => undefined },
        wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
      },
    };
  },
}));
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
jest.mock('../../src/kompozycja/jezyk-awaryjny', () => ({ tAwaryjny: async () => mockT }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: { naZmiane: () => () => undefined }, oglos: jest.fn(), systemAplikacji: {} }));
const mockErrorUtils: ObslugaBledowRN = { getGlobalHandler() { return () => undefined; }, setGlobalHandler() { return undefined; } };
(globalThis as { ErrorUtils?: unknown }).ErrorUtils = mockErrorUtils;
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const chwila = (ms = 100) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const otwarte = () => mockPolaczenia.filter((p) => p.otwarte).length;

beforeEach(async () => {
  mockT = await tEn();
  mockPolaczenia.length = 0;
  mockSluchaczePartii.clear();
  mockBiezacy.mockClear();
  mockOdswiez.mockReset(); mockOdswiez.mockImplementation(async () => undefined);
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true }); // start na pierwszym planie (ADR-0019)
});

test('błąd `biezacyLicznik` → ekran awaryjny: port bazy zamknięty i 0 słuchaczy partii iCloud', async () => {
  render(<Korzen />);
  await chwila();
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy();
  expect(mockBiezacy).toHaveBeenCalledTimes(1);
  expect(mockPolaczenia).toHaveLength(1);
  expect(otwarte()).toBe(0);
  expect(mockSluchaczePartii.size).toBe(0);
});
test('„Try starting normally” po błędzie startu: dokładnie 1 otwarte połączenie i 1 słuchacz partii', async () => {
  // Drugi start czeka na odczyt licznika („Loading…”): dane startu i iCloud już uruchomione, jak w zwykłej pracy po starcie.
  mockBiezacy.mockImplementationOnce(async () => ({ ok: false, powod: 'brak_miejsca' })).mockImplementation(() => new Promise(() => undefined));
  render(<Korzen />);
  await chwila();
  fireEvent.press(screen.getByTestId('awaryjny-sprobuj-normalnie'));
  await chwila();
  expect(screen.queryByTestId('tryb-awaryjny')).toBeNull();
  expect(mockPolaczenia).toHaveLength(2);
  expect(otwarte()).toBe(1);
  expect(mockSluchaczePartii.size).toBe(1);
});
test('wyjątek startu po utworzeniu kontenera (odczyt dostępu, M1-007) → ekran awaryjny: port bazy zamknięty; ponowny start — 1 otwarte połączenie', async () => {
  mockOdswiez.mockImplementationOnce(async () => { throw new Error('sklep'); });
  mockBiezacy.mockImplementation(() => new Promise(() => undefined));
  render(<Korzen />);
  await chwila();
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy();
  expect(otwarte()).toBe(0);
  fireEvent.press(screen.getByTestId('awaryjny-sprobuj-normalnie'));
  await chwila();
  expect(mockPolaczenia).toHaveLength(2);
  expect(otwarte()).toBe(1);
  expect(mockSluchaczePartii.size).toBe(1);
});
