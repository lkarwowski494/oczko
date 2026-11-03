// M1-audytor-generalny-059 (GEN-02, DEV-15; F-10, BR-LIC-013; P-284 (2), U11): ekran nie gaśnie tylko z licznikiem albo wzorem na wierzchu.
// Trasa „/” (app/index.tsx) zostaje zamontowana pod listą projektów, Ustawieniami i Narzędziami (`router.push`), więc blokada wygaszania
// włączona przy zamontowaniu trwała na tych ekranach, a opcję „Keep screen on while counting” czytano raz przy starcie.
// Wyrocznia: tekst opcji `ustawienia.ekran_nie_gasnie_opis` („The screen stays on while the counter is open”), U11 („Na wzorze ekran nie gaśnie;
// poza wzorem i licznikiem gaśnie normalnie”), design-spec W1a („Ekran nie gaśnie, jak licznik”). Trasa prawdziwa na prawdziwej bazie;
// atrapy tylko na granicy platformy: router i ścieżka (expo-router), port EkranAktywny, preferencja z kompozycji (`ekranWlaczony`).
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { EkranAktywny, LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki } from './pomoc';

jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn() };
const mockSciezka = { v: '/' };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useFocusEffect: () => undefined, usePathname: () => mockSciezka.v }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  const c = p.atrapaCyklu();
  return { cyklAplikacji: c.cykl, przejdzCykl: c.przejdz, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
/** Przejście aplikacji w tło i z powrotem (AppState z kompozycji systemu; M1-audytor-generalny-139). */
const przejdzCykl = (s: 'background' | 'active') =>
  (jest.requireMock('../../src/kompozycja/system') as { przejdzCykl: (s: 'background' | 'active') => void }).przejdzCykl(s);
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
const mockApp: { biezaca: unknown } = { biezaca: null };
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockApp.biezaca }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranLicznika = (require('../../app/index') as { default: React.ComponentType }).default;

const TAG = 'oczko-licznik';
const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

/** Trasa „/” z opcją F-10 (preferencja w pamięci, jak `p.stan().ekranNieGasnie` w app/_layout.tsx). */
async function trasa(opcja: { v: boolean }) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true },
    { wibracje: () => true, aplikacjaAktywna: () => true, ekranWlaczony: () => opcja.v });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  const ekran: jest.Mocked<EkranAktywny> = { wlacz: jest.fn(), wylacz: jest.fn() };
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t }, porty: { sklep, ekranAktywny: ekran, haptyka: atrapaHaptyki() } }, licznik: k, preferencje: {} };
  const r = render(<EkranLicznika />);
  await screen.findByTestId('licznik-plus');
  await waitFor(() => expect(ekran.wlacz).toHaveBeenCalledWith(TAG));
  /** Nawigacja: inna trasa na wierzchu stosu, licznik zostaje zamontowany pod spodem (jak `router.push`). */
  const idz = async (sciezka: string) => {
    mockSciezka.v = sciezka;
    r.rerender(<EkranLicznika />);
    await act(async () => { await new Promise((w) => setTimeout(w, 20)); });
  };
  const wlaczony = () => ekran.wlacz.mock.calls.filter(([t]) => t === TAG).length - ekran.wylacz.mock.calls.filter(([t]) => t === TAG).length;
  /** Przejście w tło (inna aplikacja, telefon) i powrót na pierwszy plan. */
  const tlo = async (s: 'background' | 'active') => {
    act(() => przejdzCykl(s));
    await act(async () => { await new Promise((w) => setTimeout(w, 20)); });
  };
  return { ekran, idz, wlaczony, tlo };
}
beforeEach(() => { mockSciezka.v = '/'; mockRouter.push.mockClear(); });

describe('M1-059: blokada wygaszania tylko z licznikiem albo wzorem na wierzchu', () => {
  test('licznik → lista projektów: tag oczko-licznik wyłączony; powrót na licznik: włączony ponownie', async () => {
    const u = await trasa({ v: true });
    expect(u.wlaczony()).toBe(1);
    await u.idz('/projekty');
    expect(u.ekran.wylacz).toHaveBeenCalledWith(TAG);
    expect(u.wlaczony()).toBe(0);
    await u.idz('/');
    expect(u.ekran.wlacz).toHaveBeenCalledTimes(2);
    expect(u.wlaczony()).toBe(1);
  });

  test('Ustawienia i Narzędzia nad licznikiem: ekran gaśnie normalnie (tag wyłączony)', async () => {
    const u = await trasa({ v: true });
    await u.idz('/ustawienia');
    expect(u.wlaczony()).toBe(0);
    await u.idz('/');
    await u.idz('/narzedzia');
    expect(u.wlaczony()).toBe(0);
  });

  test('wzór nad licznikiem (także otwarty z listy projektów): tag zostaje włączony', async () => {
    const u = await trasa({ v: true });
    await u.idz('/wzor');
    expect(u.ekran.wylacz).not.toHaveBeenCalled();
    expect(u.wlaczony()).toBe(1);
    await u.idz('/projekty');
    expect(u.wlaczony()).toBe(0);
    await u.idz('/wzor');
    expect(u.wlaczony()).toBe(1);
  });

  test('opcja wyłączona w Ustawieniach → po powrocie na licznik bez włączenia, bez ponownego uruchomienia; włączona z powrotem → włącza', async () => {
    const opcja = { v: true };
    const u = await trasa(opcja);
    await u.idz('/ustawienia');
    opcja.v = false; // przełącznik „Keep screen on while counting” zapisuje preferencję (ADR-0029)
    await u.idz('/');
    expect(u.ekran.wlacz).toHaveBeenCalledTimes(1); // tylko wejście przy starcie
    expect(u.wlaczony()).toBe(0);
    await u.idz('/ustawienia');
    opcja.v = true;
    await u.idz('/');
    expect(u.wlaczony()).toBe(1);
  });

  // M1-audytor-generalny-139 (07-jakosc-521; F-10, BR-LIC-013, U11): po powrocie z tła blokada wraca tylko z licznikiem na wierzchu.
  test('tło → pierwszy plan z licznikiem na wierzchu: tag wyłączony w tle i włączony ponownie po powrocie', async () => {
    const u = await trasa({ v: true });
    await u.tlo('background');
    expect(u.ekran.wylacz).toHaveBeenCalledWith(TAG);
    expect(u.wlaczony()).toBe(0);
    await u.tlo('active');
    expect(u.ekran.wlacz).toHaveBeenCalledTimes(2);
    expect(u.wlaczony()).toBe(1);
  });

  test('tło → pierwszy plan z listą projektów na wierzchu: tag nie wraca; powrót na licznik: włączony', async () => {
    const u = await trasa({ v: true });
    await u.idz('/projekty');
    expect(u.wlaczony()).toBe(0);
    await u.tlo('background');
    await u.tlo('active');
    expect(u.ekran.wlacz).toHaveBeenCalledTimes(1); // tylko wejście przy starcie
    expect(u.wlaczony()).toBe(0);
    await u.idz('/');
    expect(u.wlaczony()).toBe(1);
  });
});
