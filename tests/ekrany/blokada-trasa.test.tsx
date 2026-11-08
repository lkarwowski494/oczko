// 07-jakosc-009 / M1-audytor-generalny-048 (F-03, BR-LIC-004/S3; JAK-03): blokada licznika przez trasy — „/” (app/index.tsx) z menu ••• (app/menu.tsx)
// otwartym nad licznikiem, na prawdziwej bazie (node:sqlite). Włączenie blokady w menu → stuknięcie +1 i −1 nie zmienia wartości (ekran i baza),
// komunikat mówi, jak odblokować; „Unlock” na pasku przywraca liczenie. Atrapy tylko na granicy platformy (router, haptyka, zegarek, Live Activity, sklep).
// Dowód mutacji (warunek blokady usunięty w kopii kodu → czerwony): oczko-warsztat audit/M1-2026-11-02/dowody/M2/048-*.txt.
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { ile, jeden, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, zagrane } from './pomoc';

jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
// useFocusEffect jak w expo-router: przy montowaniu i przy każdym powrocie trasy na wierzch (`mockFokus` = powrót z „/menu” przez router.back()).
const mockFokus = new Set<() => void>();
jest.mock('expo-router', () => ({
  usePathname: () => '/', useRouter: () => mockRouter, useLocalSearchParams: () => ({}),
  useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(() => { mockFokus.add(f); f(); return () => { mockFokus.delete(f); }; }, [f]); }, // eslint-disable-line @typescript-eslint/no-require-imports
}));
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
const EkranMenu = (require('../../app/menu') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

async function trasa() {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const haptyka = atrapaHaptyki();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5)]);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka } }, licznik: k, preferencje: {} };
  return { s, haptyka };
}
const ustabilizuj = () => act(async () => { await new Promise((r) => setTimeout(r, 40)); });
const wartoscWBazie = async (s: Awaited<ReturnType<typeof przygotuj>>) => (await jeden<{ wartosc: number }>(s.baza, 'SELECT wartosc FROM licznik WHERE id = ?', ['l1'])).wartosc;

beforeEach(() => { Object.values(mockRouter).forEach((f) => f.mockReset()); });

describe('048 · F-03 blokada przez trasy „/” i „/menu” (BR-LIC-004/S3)', () => {
  test('menu ••• → Lock: +1 i −1 nie zmieniają wartości (ekran i baza), komunikat odblokowania; Unlock przywraca +1', async () => {
    const { s, haptyka } = await trasa();
    // Stos nawigacji: „/” zostaje zamontowany, „/menu” otwiera się nad nim (router.push) i zamyka (router.back) — wtedy „/” wraca na wierzch.
    let ustawMenu: (v: boolean) => void = () => undefined;
    function Stos(): React.ReactElement {
      const [menu, ustaw] = React.useState(false);
      ustawMenu = ustaw;
      return <><EkranLicznika />{menu && <EkranMenu />}</>;
    }
    mockRouter.push.mockImplementation((p: unknown) => { if (p === '/menu') ustawMenu(true); });
    mockRouter.back.mockImplementation(() => { ustawMenu(false); mockFokus.forEach((f) => f()); });
    const ekran = render(<Stos />);
    const liczba = () => ekran.getByTestId('licznik-wartosc').props.accessibilityLabel as string;
    const czekajNa = async (n: string) => { await waitFor(() => expect(liczba()).toBe(n), { timeout: 10_000 }); await ustabilizuj(); };
    await czekajNa('5');
    fireEvent.press(ekran.getByTestId('licznik-menu'));
    expect(mockRouter.push).toHaveBeenCalledWith('/menu');
    fireEvent.press(await ekran.findByTestId('menu-zablokuj'));
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    await waitFor(() => expect(ekran.queryByTestId('menu-zablokuj')).toBeNull());
    expect(await jeden<{ zablokowany: number }>(s.baza, 'SELECT zablokowany FROM licznik WHERE id = ?', ['l1'])).toEqual({ zablokowany: 1 });

    expect(await ekran.findByText('Counter locked', {}, { timeout: 10_000 })).toBeTruthy();
    await czekajNa('5');
    const zdarzeniaPrzed = await ile(s.baza, 'zdarzenie', 'licznik_id = ?', ['l1']);

    fireEvent.press(ekran.getByTestId('licznik-plus'));
    expect(await ekran.findByText('Counter is locked. Unlock it at the top.')).toBeTruthy();
    await ustabilizuj();
    fireEvent.press(ekran.getByTestId('licznik-minus'));
    await ustabilizuj();
    expect(liczba()).toBe('5');
    expect(await wartoscWBazie(s)).toBe(5);
    expect(await ile(s.baza, 'zdarzenie', 'licznik_id = ?', ['l1'])).toBe(zdarzeniaPrzed);
    expect(zagrane(haptyka, 'blokadaStukniecie')).toBe(2); // stan znany z góry: ekran nie próbuje zapisu (Licznik.tsx, BR-LIC-004/S3)
    expect(zagrane(haptyka, 'plus')).toBe(0);

    fireEvent.press(ekran.getByRole('button', { name: 'Unlock' }));
    await waitFor(() => expect(ekran.queryByText('Counter locked')).toBeNull(), { timeout: 10_000 });
    fireEvent.press(ekran.getByTestId('licznik-plus'));
    await czekajNa('6');
    expect(await wartoscWBazie(s)).toBe(6);
  });
});
