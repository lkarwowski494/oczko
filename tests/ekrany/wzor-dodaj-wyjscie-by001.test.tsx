// BY-001 (04-studio-projektowe-001, P1) i P3 z docs/programista/bw-recenzja.md: wyjście z trasy „/wzor” przy dodawaniu wzoru.
// (1) Wejście z ekranu projektu („Add pattern”, parametr `dodaj`): anulowany systemowy wybór pliku zostawiał menu źródeł, do którego użytkowniczka nie szła — wraca na projekt
//     (raport audytu 001, wejście 4; rekomendacja „wraca na ekran projektu po anulowaniu wyboru”). Z menu otwartego wprost (kafel „Dziś”, licznik) anulowanie zostaje na menu.
// (2) P3: „Back” (albo gest) w czasie importu zamyka trasę; gdy import kończy się potem „czeka na sieć”, trasa nie robi drugiego `router.back()` (zdjęłoby ekran projektu).
import React from 'react';
import { View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, katalogTymczasowy, wykonaj } from '../dane/pomocnicze/srodowisko';
import { odroczona } from './pomoc';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
let mockParametry: Record<string, string> = {};
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParametry }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
const mockWybierzPlik = jest.fn<Promise<{ sciezka: string; nazwa: string; typ: string } | null>, []>();
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ ...jest.requireActual('../../src/platforma/system-plikow-uzytkownika'), wybierzPlikWzoru: () => mockWybierzPlik() }));
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
const ADRES = 'https://example.org/wzory/czapka';

async function start(naPdf: () => Promise<{ ok: false; powod: 'brak_sieci' }> = async () => ({ ok: false, powod: 'brak_sieci' })) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Czapka'), czesc('c1', 'p1', 'Główka'), ...licznik('l1', 'c1', 5)]);
  await k.otworz('l1');
  const grupa = katalogTymczasowy('oczko-grupa-');
  const skrzynka = skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms);
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(naPdf), sprawdzPdf: jest.fn() }, czasWTle, skrzynka, migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const kw = kompozycjaWzoru(zw, { grupa, zlecenieE2e: null });
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: kw, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  return { kw, render: () => render(<EkranWzoru />) };
}

beforeEach(() => { mockRouter.back.mockClear(); mockWybierzPlik.mockReset(); });

test('BY-001 (wejście 4): z ekranu projektu (`dodaj=plik`) anulowany wybór pliku wraca na projekt (jedno router.back)', async () => {
  mockParametry = { dodaj: 'plik' };
  mockWybierzPlik.mockResolvedValue(null);
  const { render: pokaz } = await start();
  pokaz();
  await waitFor(() => expect(mockWybierzPlik).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
});

test('BY-001: z menu źródeł otwartego wprost (kafel „Dziś”, licznik) anulowany wybór pliku zostaje na menu, z widocznym „Back”', async () => {
  mockParametry = {};
  mockWybierzPlik.mockResolvedValue(null);
  const { render: pokaz } = await start();
  pokaz();
  fireEvent.press(await screen.findByRole('menuitem', { name: 'Choose file (PDF or Word)' }));
  await waitFor(() => expect(mockWybierzPlik).toHaveBeenCalledTimes(1));
  await screen.findByTestId('nav-wstecz');
  expect(mockRouter.back).not.toHaveBeenCalled();
});

test('P3 (bw-recenzja): trasa zamknięta w czasie importu, który kończy się „czeka na sieć”, nie robi drugiego powrotu (nie zdejmuje ekranu projektu)', async () => {
  mockParametry = { dodaj: 'link' };
  const konwersja = odroczona<{ ok: false; powod: 'brak_sieci' }>();
  const { kw, render: pokaz } = await start(() => konwersja.obietnica);
  const { unmount } = pokaz();
  fireEvent.changeText(await screen.findByTestId('wzor-link-pole'), ADRES);
  fireEvent.press(screen.getByText('Save page'));
  await screen.findByTestId('nav-wstecz'); // menu źródeł z wierszem „import w toku”: „Back” aktywny
  unmount(); // „Back” albo gest zamknęły trasę (router.back() zdjął ją ze stosu)
  konwersja.rozwiaz({ ok: false, powod: 'brak_sieci' });
  await waitFor(() => expect(kw.stan().czekaSiec).toHaveLength(1)); // zlecenie zapisane do skrzynki: ścieżka „czeka na sieć” przeszła do końca
  expect(mockRouter.back).not.toHaveBeenCalled();
});

test('kontrola: trasa otwarta do końca importu „czeka na sieć” wraca na projekt raz (K-17b)', async () => {
  mockParametry = { dodaj: 'link' };
  const { render: pokaz } = await start();
  pokaz();
  fireEvent.changeText(await screen.findByTestId('wzor-link-pole'), ADRES);
  fireEvent.press(screen.getByText('Save page'));
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
});
