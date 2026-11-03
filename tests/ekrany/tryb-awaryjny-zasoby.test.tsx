// M1-audytor-generalny-151 (08-programista-520, DEV-15 — zasoby zwalniane; ADR-0019): błąd startu na odczycie bieżącego licznika (`biezacyLicznik`
// po `uruchomDane`, np. brak miejsca) → `naAwarie` → ekran awaryjny korzenia. Przed ekranem kontener zdążył otworzyć połączenie z bazą i uruchomić
// sterownik iCloud (słuchacz partii w module natywnym). `naAwarie` kończy sterownik od razu, a port bazy zostaje otwarty do „Try starting normally”
// (ADR-0019, P-211: zamknięcie ostatniego połączenia robi checkpoint WAL do oryginału) i zamyka się dopiero po kopii surowej, tuż przed ponownym
// otwarciem — dalej dokładnie jedno nowe połączenie z jednym słuchaczem partii (przegląd ścieżki wrażliwej edab691, D-043). Korzeń `app/_layout.tsx` i trasa `app/index.tsx` prawdziwe, sterownik iCloud prawdziwy
// (`sterownikSynchronizacji`) na atrapie modułu iCloud (zbiór słuchaczy wspólny dla procesu, jak moduł natywny); port bazy to atrapa z licznikiem połączeń.
import React from 'react';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
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
  sprobujNormalnieTeraz: async () => undefined, trybAwaryjny: () => mockTrybAwaryjny(),
}));
/** Kolejność zdarzeń na plikach bazy: koniec kopii surowej, zamknięcie portu kontenera, otwarcie portu kolejnego kontenera. */
const mockZdarzenia: string[] = [];
let mockTrybAwaryjny: () => { kopia: Promise<unknown> } = () => ({ kopia: Promise.resolve(null) });
/** Prawdziwa baza (node:sqlite) pod portem kontenera: ścieżka `oczko.db` w katalogu tymczasowym albo null (sama atrapa portu). */
let mockPlikBazy: string | null = null;
let mockPrzedAwaria: ((port: import('../../src/dane/baza/adapter-expo').PortExpo) => Promise<void>) | null = null;
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
    mockZdarzenia.push(`otworz-${mockPolaczenia.length}`);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const prawdziwy = mockPlikBazy ? (require('../../src/dane/baza/adapter-expo') as typeof import('../../src/dane/baza/adapter-expo')).otworzPortExpo(mockPlikBazy) : null;
    if (prawdziwy && mockPrzedAwaria) await mockPrzedAwaria(prawdziwy);
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
        z, zamknij: async () => { mockZdarzenia.push(`zamknij-${mockPolaczenia.indexOf(p) + 1}`); p.otwarte = false; await prawdziwy?.zamknij(); },
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
  mockZdarzenia.length = 0;
  mockTrybAwaryjny = () => ({ kopia: Promise.resolve(null) });
  mockPlikBazy = null; mockPrzedAwaria = null;
  mockSluchaczePartii.clear();
  mockBiezacy.mockClear();
  mockOdswiez.mockReset(); mockOdswiez.mockImplementation(async () => undefined);
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true }); // start na pierwszym planie (ADR-0019)
});

test('błąd `biezacyLicznik` → ekran awaryjny: port bazy otwarty do „Try starting normally” (ADR-0019, P-211) i 0 słuchaczy partii iCloud', async () => {
  render(<Korzen />);
  await chwila();
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy();
  expect(mockBiezacy).toHaveBeenCalledTimes(1);
  expect(mockPolaczenia).toHaveLength(1);
  expect(otwarte()).toBe(1);
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
test('wyjątek startu po utworzeniu kontenera (odczyt dostępu, M1-007) → ekran awaryjny: port bazy otwarty, 0 słuchaczy partii; ponowny start — 1 otwarte połączenie', async () => {
  mockOdswiez.mockImplementationOnce(async () => { throw new Error('sklep'); });
  mockBiezacy.mockImplementation(() => new Promise(() => undefined));
  render(<Korzen />);
  await chwila();
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy();
  expect(otwarte()).toBe(1);
  expect(mockSluchaczePartii.size).toBe(0);
  fireEvent.press(screen.getByTestId('awaryjny-sprobuj-normalnie'));
  await chwila();
  expect(mockPolaczenia).toHaveLength(2);
  expect(otwarte()).toBe(1);
  expect(mockSluchaczePartii.size).toBe(1);
});

// Przegląd ścieżki wrażliwej edab691 (D-043): zamknięcie portu przy wejściu w tryb awaryjny robiło checkpoint WAL do oryginału, zanim kopia surowa
// skopiowała `-wal`. Port zamyka się dopiero przy „Try starting normally”, po kopii surowej (także gdy kopia jeszcze trwa w chwili naciśnięcia).
test('kolejność: kopia surowa kończy się przed zamknięciem portu kontenera, a zamknięcie przed otwarciem nowego (naciśnięcie w trakcie kopii)', async () => {
  mockBiezacy.mockImplementationOnce(async () => ({ ok: false, powod: 'brak_miejsca' })).mockImplementation(() => new Promise(() => undefined));
  mockTrybAwaryjny = () => ({ kopia: new Promise((r) => setTimeout(() => { mockZdarzenia.push('kopia'); r(null); }, 300)) });
  render(<Korzen />);
  await chwila();
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy();
  expect(mockZdarzenia).toEqual(['otworz-1']); // kopia trwa, port nadal otwarty
  fireEvent.press(screen.getByTestId('awaryjny-sprobuj-normalnie'));
  await chwila(500);
  expect(mockZdarzenia).toEqual(['otworz-1', 'kopia', 'zamknij-1', 'otworz-2']);
  expect(otwarte()).toBe(1);
  expect(mockSluchaczePartii.size).toBe(1);
});

const sha = (p: string) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : 'BRAK');
test('prawdziwy SQLite, niepusty WAL: po wejściu w tryb awaryjny i kopii surowej SHA-256 oryginału `.db` i `-wal` bez zmian, kopia ma wszystkie wiersze', async () => {
  const kat = mkdtempSync(join(tmpdir(), 'awaryjny-wal-'));
  const plik = join(kat, 'oczko.db');
  const wiersze = 300;
  const przed: { db?: string; wal?: string } = {};
  mockPlikBazy = plik;
  mockPrzedAwaria = async (port) => {
    if (mockPolaczenia.length > 1) return; // drugi start: tylko otwarcie
    await port.run('PRAGMA wal_autocheckpoint = 0');
    await port.run('CREATE TABLE zdarzenie (id INTEGER PRIMARY KEY, x TEXT)');
    await port.run('PRAGMA wal_checkpoint(TRUNCATE)');
    for (let i = 0; i < wiersze; i++) await port.run('INSERT INTO zdarzenie (x) VALUES (?)', ['r'.repeat(50)]); // ostatnie zapisy tylko w -wal
    przed.db = sha(plik); przed.wal = sha(`${plik}-wal`);
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { surowaKopia } = require('../../src/dane/kopia-ratunkowa') as typeof import('../../src/dane/kopia-ratunkowa');
  let kopia: Promise<Awaited<ReturnType<typeof surowaKopia>>> | null = null;
  mockTrybAwaryjny = () => { kopia = surowaKopia(kat, join(kat, 'kopie'), { teraz: () => ({ ms: 1, dzien: '2026-11-03', strefa: 'UTC' }) } as never); return { kopia }; };
  mockBiezacy.mockImplementationOnce(async () => ({ ok: false, powod: 'brak_miejsca' })).mockImplementation(() => new Promise(() => undefined));
  render(<Korzen />);
  await chwila();
  expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy();
  expect(przed.wal).not.toBe('BRAK');
  const k = await (kopia as unknown as Promise<Awaited<ReturnType<typeof surowaKopia>>>);
  expect({ db: sha(plik), wal: sha(`${plik}-wal`) }).toEqual(przed); // oryginał bez zmian (ADR-0019, P-203, P-211)
  if (!k.ok) throw new Error('kopia surowa nieudana');
  expect(k.wartosc.pliki).toContain('oczko.db-wal');
  const c = new DatabaseSync(join(k.wartosc.katalog, 'oczko.db'), { readOnly: true });
  try {
    const pomiar = {
      wierszeOryginalu: wiersze, wierszeKopii: c.prepare('SELECT count(*) AS n FROM zdarzenie').get(), plikiKopii: k.wartosc.pliki,
      integrity: c.prepare('PRAGMA integrity_check').all(), foreignKeys: c.prepare('PRAGMA foreign_key_check').all(),
    };
    console.log(`M1-151 pomiar kopii surowej: ${JSON.stringify(pomiar)}`); // dowód (dane użytkownika): liczności, integrity_check, foreign_key_check
    expect(pomiar.wierszeKopii).toEqual({ n: wiersze });
    expect(pomiar.integrity).toEqual([{ integrity_check: 'ok' }]);
    expect(pomiar.foreignKeys).toEqual([]);
  } finally { c.close(); }
  fireEvent.press(screen.getByTestId('awaryjny-sprobuj-normalnie'));
  await chwila();
  expect(mockZdarzenia).toEqual(['otworz-1', 'zamknij-1', 'otworz-2']);
  expect(otwarte()).toBe(1);
});
