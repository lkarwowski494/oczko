// BX22 / KO-143, strona negatywna: zbijanie powiadomień panelu wejść (opcja A dla scen. 31) istnieje tylko w buildzie E2E (P-238). W buildzie wydania `paneleE2e` = null: stuknięcie „+1” w trasie
// licznika działa jak dotąd (wartość rośnie, zapis jest), bez panelu `e2e-licznik-wejscia` i bez panelu pomiaru `e2e-pomiar-plus` (brak próbek, brak wstrzymywania i zwalniania).
delete process.env.EXPO_PUBLIC_E2E;
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
const Tryb = require('../../src/platforma/tryb-e2e') as typeof import('../../src/platforma/tryb-e2e');
/* eslint-enable @typescript-eslint/no-require-imports */

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

test('wydanie bez paneli: „+1” zwiększa liczbę, nie ma paneli `e2e-` ani pomiaru, nic nie jest wstrzymane', async () => {
  expect(Tryb.paneleE2e).toBeNull();
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 17)]);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki() } }, licznik: k, preferencje: {} };
  render(<EkranLicznika />);
  const plus = await screen.findByTestId('licznik-plus');
  await act(async () => { fireEvent.press(plus); });
  expect(String(screen.getByTestId('licznik-wartosc').props.accessibilityLabel)).toBe('18');
  for (const id of ['e2e-licznik-wejscia', 'e2e-pomiar-plus', 'e2e-nawigacje']) expect(screen.queryByTestId(id)).toBeNull();
});
