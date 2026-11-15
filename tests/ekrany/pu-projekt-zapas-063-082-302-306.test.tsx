// PU-063, PU-082, PU-302, PU-306 (katalog przypadków użycia, „Wzory” i „Narzędzia”): trasy z `app/` (projekt, formularz, miary, wloczka, probka) na prawdziwej bazie
// (node:sqlite), prawdziwych przypadkach użycia i prawdziwym t() z en.json; atrapa tylko routera, portu sieci i opakowań platformy (jak blad-zapisu-trasy).
// Przejście między ekranami robi test (router jest atrapą). PU-302: ekran „Yarn” (Zapas) na prawdziwym stanZapasu.
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within, type RenderResult } from '@testing-library/react-native';
import { Zapas } from '../../src/ekrany/Zapas';
import { stanZapasu, type FiltrZapasu } from '../../src/kompozycja/zapas';
import { preferencje } from '../../src/kompozycja/preferencje';
import type { WierszZapasu } from '../../src/przypadki-uzycia/zapas';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { czesc, licznik, projekt, wloczka } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, czasWTle, katalogTymczasowy, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
const mockOtworz = jest.fn();
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: { otworzAdres: (u: string) => mockOtworz(u) } }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
const EkranProjektu = trasa('../../app/projekt/[id]'), Formularz = trasa('../../app/formularz/[rodzaj]'), Miary = trasa('../../app/miary'), Wloczka = trasa('../../app/wloczka'), Probka = trasa('../../app/probka');
/* eslint-enable @typescript-eslint/no-require-imports */

let alert: jest.SpyInstance;
let wyrenderowany: RenderResult | undefined;
beforeEach(() => { mockOtworz.mockClear(); Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); }); alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); });
afterEach(() => alert.mockRestore());
async function start(dane: Parameters<typeof wykonaj>[1], siec: 'jest' | 'brak' = 'jest') {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, dane);
  s.zegar.ustaw(T0 + 3_600_000);
  const pref = preferencje();
  const grupa = katalogTymczasowy('oczko-grupa-');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle, skrzynka: skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms), migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  mockAplikacja = {
    kontener: { z: s.z, j, dostep: { stan: () => ({ poziom: 'darmowa' }) }, porty: { haptyka: { zagraj: jest.fn() }, siec: { stan: () => siec, obserwuj: () => () => undefined } },
      wzor: { z: zw, k: kompozycjaWzoru(zw, { grupa, zlecenieE2e: null }), platforma: { skanerDostepny: () => false, miniatura: async () => null } } },
    licznik: k, preferencje: pref,
  };
  return { s, pref };
}
async function pokaz(Ekran: React.ComponentType, params: Record<string, string> = {}) {
  wyrenderowany?.unmount();
  mockParams = params;
  wyrenderowany = render(<Ekran />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}
const PODSTAWA = [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)];

// PU-063: link do filmu zapisany z arkusza „Add video link”; bez sieci stuknięcie w wiersz „Video” daje komunikat, że Oczko zachowuje tylko link.
test('PU-063: „Add video link” → adres → „Save” → wiersz „Video”; bez sieci stuknięcie → „This video needs an internet connection. Oczko keeps only the link.”', async () => {
  await start(PODSTAWA, 'brak');
  await pokaz(EkranProjektu, { id: 'p1' });
  fireEvent.press(await screen.findByTestId('wzor-dodaj-film'));
  fireEvent.changeText(screen.getByTestId('wzor-film-pole'), 'https://video.example/sleeve-cap');
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Save' })); await new Promise((r) => setTimeout(r, 100)); });
  const wiersz = await screen.findByTestId('wzor-film-wiersz');
  expect(within(wiersz).getByText('https://video.example/sleeve-cap')).toBeTruthy();
  expect(screen.getByLabelText(/^Video, /)).toBeTruthy();
  fireEvent.press(screen.getByRole('link', { name: 'Open video link in browser' }));
  expect(alert).toHaveBeenCalledWith('No internet connection', 'This video needs an internet connection. Oczko keeps only the link.', expect.anything());
  expect(mockOtworz).not.toHaveBeenCalled();
});

// PU-082: włóczka z zapasu przypisana do projektu: po „Save” wiersz „Yarn” w projekcie pokazuje wybraną włóczkę.
test('PU-082: wiersz „Yarn” → „Yarn for this project” → Merino → „Save” → wiersz „Yarn” projektu pokazuje „Merino”', async () => {
  await start([...PODSTAWA, wloczka('y1', 'Merino', 3)]);
  await pokaz(EkranProjektu, { id: 'p1' });
  expect(within(screen.getByTestId('projekt-wloczka')).getByText('None')).toBeTruthy();
  fireEvent.press(screen.getByTestId('projekt-wloczka'));
  expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'wloczki', projekt: 'p1' } });
  await pokaz(Formularz, { rodzaj: 'wloczki', projekt: 'p1' });
  expect(screen.getByText('Yarn for this project')).toBeTruthy();
  fireEvent.press(await screen.findByLabelText('Merino, 3 skeins in your stash'));
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  await pokaz(EkranProjektu, { id: 'p1' });
  expect(within(screen.getByTestId('projekt-wloczka')).getByText('Merino')).toBeTruthy();
});

// PU-302: filtr grubości na ekranie „Yarn”. Chip „Weight 6” jest tylko, gdy w zapasie jest włóczka kat. 6, więc pusty wynik filtra powstaje po jej usunięciu przy wybranym filtrze 6.
test('PU-302: „Weight 4” → tylko włóczka kat. 4; „Weight 6” po usunięciu włóczki kat. 6 → „No yarn in weight 6.”; „Show all” → obie i „All” zaznaczone', async () => {
  const t = await tEn();
  const wiersz = (id: string, nazwa: string, kategoria: number): WierszZapasu => ({ id, nazwa, kategoria, motki: 1, dlugoscMotkaM: null, wagaMotkaG: null, zdjecieSha: null });
  const dwie = [wiersz('a', 'Fjord', 4), wiersz('b', 'Sock', 2)], trzy = [...dwie, wiersz('c', 'Heavy', 6)];
  function Ekran(p: { lista: WierszZapasu[] }) {
    const [filtr, ustawF] = React.useState<FiltrZapasu>('wszystkie');
    return <Zapas t={t} stan={stanZapasu(p.lista, { zapytanie: '', filtr, imperialny: false, j: { t, jezyk: () => 'en-US' } })} zapytanie="" filtr={filtr}
      naSzukaj={jest.fn()} naFiltr={ustawF} naDodaj={jest.fn()} naOtworz={jest.fn()} />;
  }
  const r = render(<Ekran lista={trzy} />);
  fireEvent.press(screen.getByRole('radio', { name: 'Weight 4' }));
  expect(screen.getAllByTestId('zapas-wynik')).toHaveLength(1);
  expect(screen.getByTestId('zapas-wynik')).toHaveTextContent(/Fjord/);
  fireEvent.press(screen.getByRole('radio', { name: 'Weight 6' }));
  r.rerender(<Ekran lista={dwie} />);
  expect(screen.getByTestId('zapas-brak-wynikow')).toHaveTextContent('No yarn in weight 6.');
  expect(screen.queryByTestId('zapas-wynik')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Show all' }));
  expect(screen.getAllByTestId('zapas-wynik')).toHaveLength(2);
  expect(screen.getByRole('radio', { name: 'All' }).props.accessibilityState).toMatchObject({ selected: true });
});

// PU-306: układ imperialny przy telefonie „na metry”: pola włóczki domyślnie w yd/oz, kalkulator „per 4 in” i „Width you want, in”; zapisane dane bez zmiany.
test('PU-306: „Units” → „Imperial”: pola włóczki w yd i oz, kalkulator „per 4 in” i „Width you want, in”; zapisana włóczka nadal w metrach', async () => {
  const { pref } = await start([wloczka('y1', 'Merino', 3), ['UPDATE wloczka SET dlugosc_motka_m = 399.5928 WHERE id = ?', ['y1']]]);
  await pokaz(Miary);
  expect(screen.getByText('Changes how sizes and lengths are shown and entered. Your saved data doesn’t change.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByTestId('miary-imperial')); await new Promise((r) => setTimeout(r, 100)); });
  expect(pref.stan().ukladMiar).toBe('imperial');
  await pokaz(Wloczka);
  expect(screen.getByTestId('zapas-jednostka-yd').props.accessibilityState).toMatchObject({ selected: true });
  expect(screen.getByTestId('zapas-jednostka-oz').props.accessibilityState).toMatchObject({ selected: true });
  await pokaz(Probka);
  expect(screen.getByText('per 4 in')).toBeTruthy();
  expect(screen.getByLabelText('Width you want, in')).toBeTruthy();
  await pokaz(Wloczka, { id: 'y1' });
  expect(screen.getByTestId('zapas-dlugosc').props.value).toBe('399.59');
  expect(screen.getByTestId('zapas-jednostka-m').props.accessibilityState).toMatchObject({ selected: true });
});
