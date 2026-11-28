// BX-019 (FX4, KO-084 B): w buildzie E2E (`EXPO_PUBLIC_E2E=1`) ekran licznika ma panel `e2e-nawigacje`: ile razy naciśnięto akcję „Wzór” i ile razy ekran licznika
// zamontował się od nowa (`key={wersja}` w app/licznik.tsx). Następna czerwień scenariusza 22 odróżni dzięki niemu „onPress nie zadziałał” (stuknięcie pochłonięte albo
// ekran przemontowany w trakcie) od „push wywołany, ekran nie powstał”. Zachowanie aplikacji bez zmian: panel tylko liczy i przepuszcza wywołanie. Poza buildem E2E panelu nie ma (P-238, test obok).
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie (require niżej, po ustawieniu)
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

// BX16: app/licznik.tsx czyta argument `oczkoE2eBezDiagnostykiLicznika` (Settings.get) przy renderze w buildzie E2E; w Jest nie ma natywnego SettingsManager — atrapa bez argumentów (zmiana tylko środowiska testu, asercje bez zmian).
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({ __esModule: true, default: { getConstants: () => ({ settings: {} }), setValues: () => undefined, deleteValues: () => undefined } }));
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
const { PanelNawigacji, zerujNawigacje } = require('../../src/kompozycja/e2e/nawigacje-stan') as typeof import('../../src/kompozycja/e2e/nawigacje-stan');
/* eslint-enable @typescript-eslint/no-require-imports */

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined, aktywna: () => false };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

async function trasa() {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 17)]);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki() } }, licznik: k, preferencje: {} };
  render(<EkranLicznika />);
}
const tekst = () => screen.getByTestId('e2e-nawigacje').props.children;

beforeEach(() => { zerujNawigacje(); mockRouter.push.mockClear(); });

describe('BX-019: panel `e2e-nawigacje` na ekranie licznika (build E2E)', () => {
  test('po otwarciu: 0 naciśnięć „Wzór”, 1 montaż ekranu licznika', async () => {
    await trasa();
    expect(await screen.findByTestId('e2e-nawigacje')).toBeTruthy();
    expect(tekst()).toBe('pattern presses: 0 (last: none); counter screen mounts: 1');
  });
  test('stuknięcie „Wzór”: licznik rośnie do 1, a push(\'/wzor\') leci jak dotąd (zachowanie bez zmian)', async () => {
    await trasa();
    fireEvent.press(await screen.findByTestId('licznik-wzor'));
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/wzor');
    expect(tekst()).toBe('pattern presses: 1 (last: /wzor); counter screen mounts: 1');
  });
  test('przemontowanie panelu (jak `key={wersja}` ekranu licznika) zwiększa „mounts”, a naciśnięcia zostają', () => {
    const { unmount } = render(<PanelNawigacji />);
    expect(tekst()).toBe('pattern presses: 0 (last: none); counter screen mounts: 1');
    unmount();
    render(<PanelNawigacji />);
    expect(tekst()).toBe('pattern presses: 0 (last: none); counter screen mounts: 2');
  });
  test('zerujNawigacje (tylko dla testów) przywraca stan wyjściowy', () => {
    render(<PanelNawigacji />);
    act(() => { zerujNawigacje(); });
    expect(tekst()).toBe('pattern presses: 0 (last: none); counter screen mounts: 0');
  });
});
