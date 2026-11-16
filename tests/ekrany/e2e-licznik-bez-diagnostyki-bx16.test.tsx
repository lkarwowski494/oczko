// BX16 / KO-121 (a), scenariusz 122: z argumentem startu `oczkoE2eBezDiagnostykiLicznika=1` ekran licznika (app/licznik.tsx) nie ma panelu `e2e-licznik-wejscia`
// i nie woła haków diagnostyki na ścieżce „+1” (P-936: 4 zatwierdzenia panelu w oknie pomiaru NFR-WYD-001). Licznik działa tak samo (+1 zapisuje i pokazuje wartość),
// panele pomiaru zostają. Bez argumentu panel jest jak dotąd (e2e-wejscia-stan.test.tsx); poza buildem E2E argument nic nie zmienia (test obok: ...-wydanie).
process.env.EXPO_PUBLIC_E2E = '1';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki } from './pomoc';

// Argumenty startu iOS: `Settings.get` czyta ustawienia z natywnego modułu, którego w Jest nie ma — mutowalna atrapa z kluczami argumentów.
const mockUstawienia: Record<string, string> = {};
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({ __esModule: true, default: { getConstants: () => ({ settings: mockUstawienia }), setValues: () => undefined, deleteValues: () => undefined } }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ usePathname: () => '/', useRouter: () => mockRouter, useFocusEffect: () => undefined }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
const mockApp: { biezaca: unknown } = { biezaca: null };
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockApp.biezaca }));

/* eslint-disable @typescript-eslint/no-require-imports */
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
const W = require('../../src/kompozycja/e2e/wejscia-stan') as typeof import('../../src/kompozycja/e2e/wejscia-stan');
/* eslint-enable @typescript-eslint/no-require-imports */

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

async function trasa(poczatek = 17) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', poczatek)]);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki() } }, licznik: k, preferencje: {} };
  render(<EkranLicznika />);
}
const argument = (wartosc: string | null): void => { if (wartosc === null) delete mockUstawienia.oczkoE2eBezDiagnostykiLicznika; else mockUstawienia.oczkoE2eBezDiagnostykiLicznika = wartosc; };
const wartosc = () => String(screen.getByTestId('licznik-wartosc').props.accessibilityLabel);

beforeEach(() => { W.zerujWejscia(); mockRouter.push.mockClear(); });
afterEach(() => { argument(null); });

test('z argumentem oczkoE2eBezDiagnostykiLicznika=1: brak panelu `e2e-licznik-wejscia`, „+1” działa, haki diagnostyki nie są wołane', async () => {
  argument('1');
  await trasa();
  await screen.findByTestId('licznik-plus');
  expect(screen.queryByTestId('e2e-licznik-wejscia')).toBeNull();
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  expect(wartosc()).toBe('18');
  expect(screen.queryByTestId('e2e-licznik-wejscia')).toBeNull();
  render(<W.PanelLicznika />); // stan współdzielony panelu: gdyby haki zadziałały, „plus 1” byłoby widać
  expect(String(screen.getByTestId('e2e-licznik-wejscia').props.children)).toMatch(/^counter input: plus 0, minus 0; saves ok: plus 0, minus 0; saves failed: 0; state value: none; /);
});

test('z argumentem: panele pomiaru i nawigacji zostają (pomiar 122 nadal czyta `e2e-pomiar-plus`; `e2e-nawigacje` bez zmian)', async () => {
  argument('1');
  await trasa();
  await screen.findByTestId('e2e-nawigacje');
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  expect(screen.getByTestId('e2e-nawigacje')).toBeTruthy();
});

test('bez argumentu (scenariusz 31): panel `e2e-licznik-wejscia` jest i liczy „+1”', async () => {
  argument(null);
  await trasa();
  await screen.findByTestId('e2e-licznik-wejscia');
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  expect(String(screen.getByTestId('e2e-licznik-wejscia').props.children)).toMatch(/^counter input: plus 1, minus 0; saves ok: plus 1, minus 0; saves failed: 0; state value: 18; /);
});
