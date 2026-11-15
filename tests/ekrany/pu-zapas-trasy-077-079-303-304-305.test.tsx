// PU-077, PU-079, PU-303, PU-304, PU-305 (katalog przypadków użycia, „Narzędzia”): trasy z `app/` (zapas, wloczka, druty, drut, kosz) na prawdziwej bazie
// (node:sqlite), prawdziwych przypadkach użycia i prawdziwym t() z en.json; atrapa tylko routera i opakowań platformy (jak drut-rozmiar-3125-trasa).
// Przejście między ekranami robi test (router jest atrapą): montuje następną trasę po zapisie/usunięciu, tak jak zrobiłby to nawigator.
import React from 'react';
import { Alert, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor, type RenderResult } from '@testing-library/react-native';
import { czesc, licznik, projekt, projektWloczka, wloczka } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';
import { wyborWloczek, zapasZDetalami } from '../../src/przypadki-uzycia/zapas';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
const Zapas = trasa('../../app/zapas'), Wloczka = trasa('../../app/wloczka'), Druty = trasa('../../app/druty'), Drut = trasa('../../app/drut'), Kosz = trasa('../../app/kosz');
/* eslint-enable @typescript-eslint/no-require-imports */

let alert: jest.SpyInstance;
let wyrenderowany: RenderResult | undefined;
beforeEach(() => { Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); }); alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); });
afterEach(() => alert.mockRestore());
async function start(dane: Parameters<typeof wykonaj>[1] = [], imperialne = false) {
  const { s, k, j } = await kompozycjaTestowa();
  const pref = preferencje();
  await wykonaj(s.baza, dane);
  if (imperialne) expect((await pref.zapisz(s.z, { ukladMiar: 'imperial' })).ok).toBe(true);
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k, preferencje: pref };
  return s;
}
/** Montuje trasę (poprzednią odmontowuje) z parametrami i czeka na wczytanie danych. */
async function pokaz(Ekran: React.ComponentType, params: Record<string, string> = {}) {
  wyrenderowany?.unmount();
  mockParams = params;
  wyrenderowany = render(<Ekran />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}
/** Przycisk destrukcyjny ostatniego alertu (potwierdzenie usunięcia). */
const potwierdz = () => act(async () => { ((alert.mock.calls.at(-1)?.[2] as AlertButton[]).find((b) => b.style === 'destructive') as AlertButton).onPress?.(); await new Promise((r) => setTimeout(r, 100)); });
const FORM = { producent: '', sklad: '', kolor: '', kategoria: null, dlugoscMotkaM: null, wagaMotkaG: null, pielegnacja: '', notatka: '' };

// PU-077: włóczka z etykiety w jardach: podgląd „= 399.59 m”; w zapasie „3 skeins” i „437 yd (399.59 m)”.
test('PU-077: „Add yarn” z 3 motkami i 437 yd → podgląd „= 399.59 m”; wiersz zapasu „3 skeins” i „437 yd (399.59 m)”', async () => {
  await start([], true);
  await pokaz(Wloczka);
  fireEvent.changeText(screen.getByTestId('zapas-nazwa'), 'Fjord');
  fireEvent.press(screen.getByTestId('zapas-jednostka-yd'));
  fireEvent.changeText(screen.getByTestId('zapas-dlugosc'), '437');
  expect(screen.getByTestId('zapas-przeliczone')).toHaveTextContent('= 399.59 m');
  for (let i = 0; i < 6; i++) fireEvent.press(screen.getByRole('button', { name: 'One skein more' })); // krok 0,5 → 3 motki
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  await pokaz(Zapas);
  const wiersz = screen.getByTestId('zapas-wynik');
  expect(wiersz).toHaveTextContent(/Fjord/);
  expect(wiersz).toHaveTextContent(/3 skeins/);
  expect(wiersz).toHaveTextContent(/437 yd \(399\.59 m\)/);
});

// PU-303: poprawa wagi motka w uncjach: podgląd „= 99.22 g”, wiersz zapasu „3.5 oz (99.22 g)”, kategoria 4 w filtrze.
test('PU-303: edycja włóczki: kategoria 4, waga 3.5 oz → podgląd „= 99.22 g”; wiersz „3.5 oz (99.22 g)” i chip „Weight 4”', async () => {
  await start([['INSERT INTO wloczka (id, nazwa, motki, zmieniono_ms) VALUES (?, ?, ?, ?)', ['y1', 'Fjord', 3, 1]]], true);
  await pokaz(Wloczka, { id: 'y1' });
  fireEvent.changeText(screen.getByLabelText('Brand'), 'Harbor');
  fireEvent.press(screen.getByRole('button', { name: /^Weight category/ }));
  fireEvent.press(screen.getByRole('radio', { name: /^4 · / }));
  fireEvent.press(screen.getByTestId('zapas-jednostka-oz'));
  fireEvent.changeText(screen.getByTestId('zapas-waga'), '3.5');
  expect(screen.getByText('= 99.22 g')).toBeTruthy();
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  await pokaz(Zapas);
  expect(screen.getByTestId('zapas-wynik')).toHaveTextContent(/3\.5 oz \(99\.22 g\)/);
  expect(screen.getByRole('radio', { name: 'Weight 4' })).toBeTruthy();
});

// PU-079: nowe druty 4 mm → na liście „Needles” pozycja „4 mm (US 6)”.
test('PU-079: „Add needles or hook” 4 mm → zapis → lista „Needles” z pozycją „4 mm (US 6)”', async () => {
  await start();
  await pokaz(Druty);
  fireEvent.press(screen.getByTestId('druty-dodaj'));
  expect(mockRouter.push).toHaveBeenCalledWith('/drut');
  await pokaz(Drut);
  fireEvent.changeText(screen.getByTestId('formularz-rozmiar-mm'), '4');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  await pokaz(Druty);
  expect(screen.getByText('Needles')).toBeTruthy();
  expect(screen.getByText('4 mm (US 6)')).toBeTruthy();
});

// PU-304: usunięcie przypisanej włóczki: znika z zapasu i z „Yarn for this project”, jest w koszu z terminem; „Restore” przywraca 3 motki i przypisanie.
test('PU-304: „Delete yarn” → brak w zapasie i w wyborze projektu; kosz „Yarn · until …”; „Restore” → znów 3 skeins i przypisanie do projektu', async () => {
  const s = await start([projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5), wloczka('y1', 'Merino', 3), projektWloczka('p1', 'y1')]);
  await pokaz(Wloczka, { id: 'y1' });
  fireEvent.press(screen.getByTestId('zapas-usun'));
  await potwierdz();
  expect(mockRouter.back).toHaveBeenCalled();
  const wybor = await wyborWloczek(s.z, { projektId: 'p1' });
  expect(wybor.ok && wybor.wartosc.zapas).toEqual([]); // „Yarn for this project” nie ma z czego wybierać (usunięta nie jest w zapasie)
  await pokaz(Zapas);
  expect(screen.queryByTestId('zapas-wynik')).toBeNull();
  await pokaz(Kosz);
  expect(screen.getByText('Merino')).toBeTruthy();
  expect(screen.getByText('Yarn · until Nov 21')).toBeTruthy();
  fireEvent.press(screen.getByTestId('kosz-przywroc'));
  await waitFor(() => expect(screen.queryByTestId('kosz-przywroc')).toBeNull());
  await pokaz(Zapas);
  expect(screen.getByTestId('zapas-wynik')).toHaveTextContent(/3 skeins/);
  const po = await wyborWloczek(s.z, { projektId: 'p1' });
  expect(po.ok && po.wartosc.wybrane).toEqual(['y1']);
  const z = await zapasZDetalami(s.z);
  expect(z.ok && z.wartosc.map((x) => x.motki)).toEqual([3]);
});

// PU-305: druty zmienione na szydełko 3.5 mm (grupa „Hooks”), potem usunięte (kosz „Needles or hook · until …”) i przywrócone.
test('PU-305: druty → „Hook” 3.5 → grupa „Hooks” z „3.5 mm”; „Delete needles or hook” → pusto, kosz „Needles or hook · until …”; „Restore” → wraca', async () => {
  const s = await start([['INSERT INTO narzedzie (id, rodzaj, rozmiar_mm, opis, zmieniono_ms) VALUES (?, ?, ?, ?, ?)', ['n1', 'druty', 4, '', 1]]]);
  await pokaz(Drut, { id: 'n1' });
  fireEvent.press(screen.getByRole('radio', { name: 'Hook' }));
  fireEvent.changeText(screen.getByTestId('formularz-rozmiar-mm'), '3.5');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  await pokaz(Druty);
  expect(screen.getByText('Hooks')).toBeTruthy();
  expect(screen.getByText(/^3\.5 mm/)).toBeTruthy();
  await pokaz(Drut, { id: 'n1' });
  fireEvent.press(screen.getByTestId('drut-usun'));
  await potwierdz();
  await pokaz(Druty);
  expect(screen.getByText('No needles or hooks yet.')).toBeTruthy();
  await pokaz(Kosz);
  expect(screen.getByText('Needles or hook · until Nov 21')).toBeTruthy();
  fireEvent.press(screen.getByTestId('kosz-przywroc'));
  await waitFor(() => expect(screen.queryByTestId('kosz-przywroc')).toBeNull());
  await pokaz(Druty);
  expect(screen.getByText('Hooks')).toBeTruthy();
  expect(await s.baza.all('SELECT rodzaj, rozmiar_mm FROM narzedzie WHERE usunieto_ms IS NULL')).toEqual([{ rodzaj: 'szydelko', rozmiar_mm: 3.5 }]);
});
