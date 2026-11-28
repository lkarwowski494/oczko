// PU-313 („Dane i ustawienia”): konflikt iCloud rozstrzygany z ekranu „Data and sync”: „1 counter has two versions” → arkusz „Two versions of this counter” → wybór wersji → wiersz znika;
// „Not now” zostawia konflikt i linię na liczniku. Poziom: komponentowy — trasy „/stan-danych” i „/konflikt” na prawdziwej bazie, kompozycji licznika i atrapie iCloud w trybie `konflikt` (jak E2E).
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { atrapaIcloud } from '../../src/platforma/icloud-atrapa';
import { sterownikSynchronizacji } from '../../src/przypadki-uzycia/synchronizacja';
import { MIN, przygotuj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/system', () => ({ otworzUstawieniaSystemu: jest.fn() }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranStanuDanych = (require('../../app/stan-danych') as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranKonfliktu = (require('../../app/konflikt') as { default: React.ComponentType }).default;

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined, aktywna: () => false };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };

// PU-313: wiersz konfliktu na ekranie danych otwiera arkusz z obiema wersjami; „Not now” zostawia konflikt (wiersz i linia na liczniku), wybór wersji ustawia licznik i usuwa wiersz.
test('PU-313: konflikt z ekranu danych — „Not now” zostawia go, wybór wersji ustawia licznik i usuwa wiersz konfliktu', async () => {
  const t = await tEn();
  const s = await przygotuj();
  const plik = { czytaj: () => null, zapisz: () => undefined };
  const j = { t, jezyk: () => 'en', zegar24h: () => true };
  const k1 = kompozycjaLicznika({ ...s.z, rodzajUrzadzenia: 'iphone', migruj: (b) => migruj(b), liveActivity, zegarek }, j);
  await k1.przygotuj();
  await k1.uslugi.dodajRzad();
  const st1 = sterownikSynchronizacji({ ...s.z, synchronizacja: atrapaIcloud({ tryb: 'wlaczony', baza: s.baza, zegar: s.zegar, plik }), magazyn: s.magazyn });
  await st1.start();
  await st1.wlacz();
  s.zegar.przesun(10 * MIN);
  const st2 = sterownikSynchronizacji({ ...s.z, synchronizacja: atrapaIcloud({ tryb: 'konflikt', baza: s.baza, zegar: s.zegar, plik }), magazyn: s.magazyn });
  let startSilnika: Promise<void> = Promise.resolve();
  const k2 = kompozycjaLicznika({ ...s.z, rodzajUrzadzenia: 'iphone', migruj: (b) => migruj(b), liveActivity, zegarek }, j, { wibracje: () => true, icloud: { start: () => (startSilnika = st2.start()) } });
  await k2.przygotuj();
  await startSilnika;
  expect((await k2.uslugi.start()).licznik.konflikt).toMatchObject({ lokalna: 1, zdalna: 6 });
  mockAplikacja = {
    kontener: { z: s.z, j, icloud: { sterownik: st2, widoczny: true, e2e: null, naPartie: () => () => undefined } },
    licznik: k2, preferencje: {},
  };

  // 1. ekran danych: wiersz konfliktu prowadzi do arkusza
  const dane = render(<EkranStanuDanych />);
  fireEvent.press(await within(await screen.findByTestId('icloud-konflikty')).findByText('1 counter has two versions'));
  await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/konflikt'));
  dane.unmount();

  // 2. „Not now”: arkusz zamyka się, konflikt zostaje (wiersz i linia na liczniku)
  const arkusz = render(<EkranKonfliktu />);
  await screen.findByTestId('icloud-konflikt');
  expect(screen.getByText(/^Two versions of /)).toBeTruthy();
  expect(screen.getByTestId('icloud-konflikt-wybor-0')).toBeTruthy();
  expect(screen.getByTestId('icloud-konflikt-wybor-1')).toBeTruthy();
  fireEvent.press(screen.getByTestId('arkusz-zamknij'));
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
  expect((await k2.dzialania.odswiez!()).konflikt).not.toBeNull();
  arkusz.unmount();
  const danePo = render(<EkranStanuDanych />);
  expect(await screen.findByTestId('icloud-konflikty')).toBeTruthy();
  danePo.unmount();

  // 3. wybór pierwszej wersji (6 rzędów z iPada): licznik ma 6, wiersza konfliktu na ekranie danych nie ma
  render(<EkranKonfliktu />);
  await screen.findByTestId('icloud-konflikt');
  mockRouter.back.mockClear();
  await act(async () => { fireEvent.press(screen.getByTestId('icloud-konflikt-wybor-0')); });
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
  const po = await k2.dzialania.odswiez!();
  expect([po.skonczone, po.konflikt]).toEqual([6, null]);
  render(<EkranStanuDanych />);
  await screen.findByTestId('icloud-przelacznik');
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  expect(screen.queryByTestId('icloud-konflikty')).toBeNull();
});
