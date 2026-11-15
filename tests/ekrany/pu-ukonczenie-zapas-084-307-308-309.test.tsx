// PU-084, PU-307, PU-308, PU-309 (katalog przypadków użycia, „Ukończenie, historia, kosz”): karta ukończenia przez trasę „/ukonczenie” (app/ukonczenie.tsx)
// na prawdziwej bazie i prawdziwym t() z en.json; atrapy tylko na granicy platformy (router, zrzut, udostępnianie). Zapas czytamy tak jak ekran „Yarn”
// (zapasZDetalami + stanZapasu). Powrót z arkusza włóczki symulujemy prawdziwymi przypadkami użycia (zapiszWloczke, przypiszWloczki) i ponownym „focusem” trasy.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt, projektWloczka, wloczka } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { stanZapasu } from '../../src/kompozycja/zapas';
import { przypiszWloczki, zapasZDetalami, zapiszWloczke } from '../../src/przypadki-uzycia/zapas';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mock: { kontener?: unknown; router: { push: jest.Mock; dismissTo: jest.Mock; back: jest.Mock } } = { router: { push: jest.fn(), dismissTo: jest.fn(), back: jest.fn() } };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mock.router, useLocalSearchParams: () => ({ projekt: 'p1' }), useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener }) }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), portOceny: {}, systemAplikacji: {} }));
jest.mock('../../src/przypadki-uzycia/ocena', () => ({ prosbaPoUkonczeniu: jest.fn(async () => undefined) }));
jest.mock('../../src/platforma/zrzut', () => ({ zrzutKarty: jest.fn() }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUkonczenia = (require('../../app/ukonczenie') as { default: React.ComponentType }).default;

let j: Jezyk;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
beforeEach(() => { Object.values(mock.router).forEach((f) => f.mockClear()); });
const baza = [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)];
async function otworz(instrukcje: Parameters<typeof wykonaj>[1]) {
  const s = await przygotuj();
  await wykonaj(s.baza, [...baza, ...instrukcje]);
  s.zegar.ustaw(T0 + 3_600_000);
  mock.kontener = { z: s.z, j };
  const r = render(<EkranUkonczenia />);
  await waitFor(() => expect(screen.getByTestId('ukonczenie-karta')).toBeTruthy());
  const ponownyFocus = async () => { mock.kontener = { z: s.z, j }; r.rerender(<EkranUkonczenia />); await waitFor(() => expect(screen.getByTestId('ukonczenie-karta')).toBeTruthy()); };
  return { s, ponownyFocus };
}
const motkiWBazie = async (s: Awaited<ReturnType<typeof przygotuj>>) => (await s.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id = ?', ['y1']))[0]?.motki;
/** Wiersz zapasu tak, jak go pokazuje ekran „Yarn”: nazwa i linia z liczbą motków. */
async function wierszZapasu(s: Awaited<ReturnType<typeof przygotuj>>) {
  const z = await zapasZDetalami(s.z);
  if (!z.ok) throw new Error(z.powod);
  return stanZapasu(z.wartosc, { zapytanie: '', filtr: 'wszystkie', imperialny: false, j }).wiersze[0];
}
const jedenMotekWiecej = (ile: number) => { for (let i = 0; i < ile; i++) fireEvent.press(screen.getByRole('button', { name: 'One skein more', hidden: true })); };

// PU-084: zużycie 1 z 3 motków → po „Done” zapas pokazuje „2 skeins”; stopka karty „Counted in Oczko” jest na karcie.
test('PU-084: projekt z włóczką 3 motki, zużycie 1 → „Done” → zapas „2 skeins”; karta ma stopkę „Counted in Oczko”', async () => {
  const { s } = await otworz([wloczka('y1', 'Merino', 3), projektWloczka('p1', 'y1')]);
  expect(screen.getByText('Counted in Oczko', { hidden: true })).toBeTruthy();
  jedenMotekWiecej(2); // krok 0,5 → 1 motek
  fireEvent.press(screen.getByTestId('ukonczenie-gotowe'));
  await waitFor(() => expect(mock.router.dismissTo).toHaveBeenCalledWith('/projekty'));
  expect(await wierszZapasu(s)).toMatchObject({ nazwa: 'Merino', linia: expect.stringContaining('2 skeins') });
});

// PU-307: zużycie 3 przy zapasie 2 → ostrzeżenie z „Your stash will show 0.”; po „Done” zapas to 0 (nigdy ujemny).
test('PU-307: zużycie 3 przy zapasie 2 → ostrzeżenie; „Done” → w zapasie „0 skeins”, w bazie 0', async () => {
  const { s } = await otworz([wloczka('y1', 'Merino', 2), projektWloczka('p1', 'y1')]);
  jedenMotekWiecej(6);
  expect(screen.getByText('That’s more than the 2 skeins in your stash. Your stash will show 0.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('ukonczenie-gotowe'));
  await waitFor(() => expect(mock.router.dismissTo).toHaveBeenCalledWith('/projekty'));
  expect(await motkiWBazie(s)).toBe(0);
  expect(await wierszZapasu(s)).toMatchObject({ linia: expect.stringContaining('0 skeins') });
});

// PU-308: „Edit stash” (widoczny po przekroczeniu zapasu) z podpowiedzią o powrocie → po zapisie włóczki (5 motków) karta pokazuje „5 skeins in your stash”, a zużycie odejmuje się od 5.
test('PU-308: „Edit stash” → zapas 5 → karta „5 skeins in your stash”, bez ostrzeżenia; „Done” z zużyciem 3 zostawia 2', async () => {
  const { s, ponownyFocus } = await otworz([wloczka('y1', 'Merino', 2), projektWloczka('p1', 'y1')]);
  jedenMotekWiecej(6); // zużycie 3 > zapas 2 → pojawia się „Edit stash”
  const edytuj = screen.getByTestId('ukonczenie-edytuj-zapas-y1');
  expect(edytuj.props.accessibilityHint).toBe('After you save, you come back to this card with the new number.');
  fireEvent.press(edytuj);
  expect(mock.router.push).toHaveBeenCalledWith({ pathname: '/wloczka', params: { id: 'y1' } });
  const zapis = await zapiszWloczke(s.z, { id: 'y1', nazwa: 'Merino', producent: '', sklad: '', kolor: '', kategoria: null, motki: 5, dlugoscMotkaM: null, wagaMotkaG: null, pielegnacja: '', notatka: '' });
  expect(zapis.ok).toBe(true);
  await ponownyFocus();
  expect(await screen.findByText('5 skeins in your stash')).toBeTruthy();
  expect(screen.queryByText(/Your stash will show 0/)).toBeNull();
  fireEvent.press(screen.getByTestId('ukonczenie-gotowe'));
  await waitFor(() => expect(mock.router.dismissTo).toHaveBeenCalledWith('/projekty'));
  expect(await motkiWBazie(s)).toBe(2);
});

// PU-309: projekt bez włóczki → linia „No yarn is chosen…”; po wyborze włóczki z zapasu karta ma wiersz zużycia, a 1 motek zmniejsza zapas.
test('PU-309: bez włóczki → „Choose yarn” → wybrana Merino → wiersz „Skeins of Merino used” → zużycie 1 → zapas −1', async () => {
  const { s, ponownyFocus } = await otworz([wloczka('y1', 'Merino', 3)]);
  expect(screen.getByText('No yarn is chosen for this project, so your stash stays as it is.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('ukonczenie-wybierz-wloczke'));
  expect(mock.router.push).toHaveBeenCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'wloczki', projekt: 'p1' } });
  expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: ['y1'] })).ok).toBe(true); // „Save” w arkuszu „Yarn for this project”
  await ponownyFocus();
  expect(await screen.findByRole('adjustable', { name: 'Skeins of Merino used' })).toBeTruthy();
  expect(screen.queryByText(/No yarn is chosen/)).toBeNull();
  jedenMotekWiecej(2);
  fireEvent.press(screen.getByTestId('ukonczenie-gotowe'));
  await waitFor(() => expect(mock.router.dismissTo).toHaveBeenCalledWith('/projekty'));
  expect(await motkiWBazie(s)).toBe(2);
});
