// P-585 (M3 p3a): „Dziś” trzyma ekran włączony na tych samych warunkach co licznik — ustawienie „Keep screen on while counting” (F-10) i karta z „+1” na wierzchu.
// Osobny tag `oczko-dzis` (port EkranAktywny, rejestr Expo 7: każdy włączony tag wyłączany); licznik i wzór dalej `oczko-licznik`, nigdy oba naraz.
// Wyrocznia: decyzja P-585 i tekst opcji `ustawienia.ekran_nie_gasnie_opis`; trasa prawdziwa na prawdziwej bazie, atrapy tylko na granicy platformy (jak ekran-nie-gasnie-trasa.test.tsx).
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { EkranAktywny, LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { kartaZPlusem } from '../../src/przypadki-uzycia/ekran-aktywny';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki } from './pomoc';

jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn(), navigate: jest.fn() };
const mockSciezka = { v: '/' };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useFocusEffect: () => undefined, usePathname: () => mockSciezka.v }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  const c = p.atrapaCyklu();
  return { cyklAplikacji: c.cykl, przejdzCykl: c.przejdz, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
const przejdzCykl = (s: 'background' | 'active') =>
  (jest.requireMock('../../src/kompozycja/system') as { przejdzCykl: (s: 'background' | 'active') => void }).przejdzCykl(s);
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
const mockApp: { biezaca: unknown } = { biezaca: null };
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockApp.biezaca }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Dzis = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;

const TAG_DZIS = 'oczko-dzis';
const TAG_LICZNIK = 'oczko-licznik';
const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

async function trasa(opcja: { v: boolean }) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true },
    { wibracje: () => true, aplikacjaAktywna: () => true, ekranWlaczony: () => opcja.v });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  const ekran: jest.Mocked<EkranAktywny> = { wlacz: jest.fn(), wylacz: jest.fn() };
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, porty: { sklep, ekranAktywny: ekran, haptyka: atrapaHaptyki() } }, licznik: k, preferencje: {} };
  const r = render(<Dzis />);
  await screen.findByTestId('dzis-plus');
  await act(async () => { await new Promise((w) => setTimeout(w, 20)); });
  const idz = async (sciezka: string) => {
    mockSciezka.v = sciezka;
    r.rerender(<Dzis />);
    await act(async () => { await new Promise((w) => setTimeout(w, 20)); });
  };
  const wlaczony = (tag: string) => ekran.wlacz.mock.calls.filter(([x]) => x === tag).length - ekran.wylacz.mock.calls.filter(([x]) => x === tag).length;
  const tlo = async (c: 'background' | 'active') => { act(() => przejdzCykl(c)); await act(async () => { await new Promise((w) => setTimeout(w, 20)); }); };
  return { ekran, idz, wlaczony, tlo };
}
beforeEach(() => { mockSciezka.v = '/'; mockRouter.push.mockClear(); });

describe('P-585: „Dziś” z kartą „+1” na wierzchu trzyma ekran włączony (osobny tag)', () => {
  test('opcja włączona, „Dziś” na wierzchu: tag oczko-dzis włączony, oczko-licznik nie', async () => {
    const u = await trasa({ v: true });
    await waitFor(() => expect(u.wlaczony(TAG_DZIS)).toBe(1));
    expect(u.wlaczony(TAG_LICZNIK)).toBe(0);
  });

  test('opcja wyłączona w Ustawieniach: „Dziś” gaśnie jak zwykle (żaden tag)', async () => {
    const u = await trasa({ v: false });
    expect(u.ekran.wlacz).not.toHaveBeenCalled();
  });

  test('inna zakładka nad „Dziś”: tag wyłączony; powrót na „Dziś”: włączony ponownie', async () => {
    const u = await trasa({ v: true });
    await waitFor(() => expect(u.wlaczony(TAG_DZIS)).toBe(1));
    await u.idz('/projekty');
    expect(u.wlaczony(TAG_DZIS)).toBe(0);
    await u.idz('/');
    expect(u.wlaczony(TAG_DZIS)).toBe(1);
  });

  test('„Dziś” → licznik: jeden tag naraz (dzis wyłączony, licznik włączony), z powrotem odwrotnie', async () => {
    const u = await trasa({ v: true });
    await u.idz('/licznik');
    expect(u.wlaczony(TAG_DZIS)).toBe(0);
    expect(u.wlaczony(TAG_LICZNIK)).toBe(1);
    await u.idz('/');
    expect(u.wlaczony(TAG_LICZNIK)).toBe(0);
    expect(u.wlaczony(TAG_DZIS)).toBe(1);
  });

  test('tło → pierwszy plan: tag wyłączony w tle i włączony po powrocie na „Dziś”', async () => {
    const u = await trasa({ v: true });
    await waitFor(() => expect(u.wlaczony(TAG_DZIS)).toBe(1));
    await u.tlo('background');
    expect(u.wlaczony(TAG_DZIS)).toBe(0);
    await u.tlo('active');
    expect(u.wlaczony(TAG_DZIS)).toBe(1);
  });
});

describe('P-585: warunek „karta z +1” (czysta funkcja)', () => {
  const stan = (limit: 'brak' | 'zawczasu') => ({ limit: { rodzaj: limit } });
  test('karta z „+1”: limit nie zablokował +1 i jest miejsce pracy', () => {
    expect(kartaZPlusem(stan('brak'), { miejsce: 'licznik' })).toBe(true);
    expect(kartaZPlusem(stan('brak'), { miejsce: 'wzor' })).toBe(true);
    expect(kartaZPlusem(stan('brak'), null)).toBe(true); // przed odczytem danych karta ma „+1” ze stanu licznika
  });
  test('bez „+1”: karta „bez miejsca” (Wybierz projekt) i komunikat limitu zamiast „+1”', () => {
    expect(kartaZPlusem(stan('brak'), { miejsce: 'lista' })).toBe(false);
    expect(kartaZPlusem(stan('zawczasu'), { miejsce: 'licznik' })).toBe(false);
  });
});
