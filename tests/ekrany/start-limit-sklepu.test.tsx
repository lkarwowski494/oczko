// M1-audytor-generalny-022 (źródło 08-programista-004; P-396): korzeń `app/_layout.tsx` nie czeka na StoreKit bez końca. Sklep wiszący →
// stos ekranów (pierwszy ekran: licznik) po co najwyżej `SKLEP_LIMIT_MS` z dostępem z pamięci offline; sklep zwracający Pro po limicie →
// stan dostępu odświeżony przez nasłuch i licznik przeliczony (`poZmianie`), bez ponownego startu. Strażnik startu, kontener (poza prawdziwym
// `dostepPro` na sztucznym sklepie), licznik i preferencje podmienione — bez dysku i modułów natywnych.
import React from 'react';
import { AppState } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { dostepPro } from '../../src/kompozycja/dostep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { SKLEP_LIMIT_MS } from '../../src/konfiguracja';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
jest.mock('expo-router', () => {
  const Stack = ({ children }: { children: React.ReactNode }) => mockReact.createElement(mockRn.View, { testID: 'stos' }, children);
  Stack.Screen = () => null;
  return { Stack };
});
const mockStart: { kontener: () => Promise<unknown> } = { kontener: async () => ({ ok: false, powod: 'zapis' }) };
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined,
}));
jest.mock('../../src/kompozycja/kontener', () => ({ utworzKontener: () => mockStart.kontener() }));
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
jest.mock('../../src/kompozycja/Kontekst', () => ({ DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children }));
const mockLicznik = { zamknij: jest.fn(), poZmianie: jest.fn(async () => undefined) };
jest.mock('../../src/kompozycja/licznik', () => ({ kompozycjaLicznika: () => mockLicznik }));
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const chwila = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

/** Kontener z prawdziwym dostępem Pro na sztucznym sklepie, którego `transakcje()` wisi do `odpowiedz()`; pamięć Pro pusta. */
async function kontenerZWiszacymSklepem() {
  const teraz = Date.UTC(2026, 10, 10);
  const sklep = sklepSztuczny(() => teraz);
  const prawdziwe = sklep.transakcje.bind(sklep);
  let odpowiedz: () => void = () => undefined;
  sklep.transakcje = () => new Promise((ok, zle) => { odpowiedz = () => { prawdziwe().then(ok, zle); }; });
  const plik = { tekst: null as string | null };
  const dostep = dostepPro(sklep, { czytaj: async () => plik.tekst, zapisz: async (t) => { plik.tekst = t; } }, () => teraz);
  mockStart.kontener = async () => ({
    ok: true,
    wartosc: {
      dostep, z: {}, j: {}, icloud: null, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
    },
  });
  return { sklep, dostep, odpowiedz: () => odpowiedz() };
}

beforeEach(() => {
  mockLicznik.poZmianie.mockClear();
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true }); // start na pierwszym planie (ADR-0019)
});

test('M1-022: sklep wiszący → licznik (stos ekranów) najpóźniej po limicie, dostęp z pamięci offline („niepewny”)', async () => {
  const k = await kontenerZWiszacymSklepem();
  render(<Korzen />);
  await chwila(SKLEP_LIMIT_MS + 300);
  expect(screen.getByTestId('stos')).toBeTruthy();
  expect(k.dostep.stan()).toMatchObject({ pro: false, poziom: 'niepewny' });
});

test('M1-022: Pro ze sklepu po limicie → stan dostępu odświeżony przez nasłuch i licznik przeliczony', async () => {
  const k = await kontenerZWiszacymSklepem();
  await k.sklep.kup('oczko.pro.yearly');
  render(<Korzen />);
  await chwila(SKLEP_LIMIT_MS + 300);
  expect(screen.getByTestId('stos')).toBeTruthy();
  expect(k.dostep.stan().pro).toBe(false);
  k.odpowiedz();
  await chwila(50);
  expect(k.dostep.stan()).toMatchObject({ pro: true, poziom: 'pro' });
  expect(mockLicznik.poZmianie).toHaveBeenCalled();
});
