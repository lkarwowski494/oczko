// M1-audytor-generalny-131 (04-studio-projektowe-521; DEC-33 b; design-spec „Aneks M2 partia 3c1”, „Znacznik: stuknięcie w rząd…”, punkty „Dla 08” 1–3 i 5):
// pojedyncze stuknięcie w stronę (zdarzenie widoku natywnego `onStukniecie` z `rodzaj: 'stukniecie'`) stawia albo przenosi pas tylko wtedy, gdy wzór nie ma
// znacznika albo pasek ustawień jest otwarty; przy ustawionym znaczniku i zamkniętym pasku nic nie rusza (SP-17); w trybie rysowania nie stawia znacznika.
// Przytrzymanie (`rodzaj: 'przytrzymanie'`) działa jak dotąd. Glif „Mark row” = uchwyt pasa z tokenów, nie `bookmark`. Widok strony to atrapa modułu natywnego.
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { znacznikWzoru } from '../../src/dane/repozytoria/wzory';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
type Zd<T> = (e: { nativeEvent: T }) => void;
type PropsWidoku = { strona?: number; polityka?: string; onStukniecie?: Zd<{ wzorId: string; strona: number; y: number; rodzaj: 'stukniecie' | 'przytrzymanie' }> };
let mockWidok: PropsWidoku = {};
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const znacznik = (o: Record<string, unknown>) => JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 6, wartosc_przy_ustawieniu: 45, kierunek: -1, ...o });

async function start(wartosc: number, zn = '{}') {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', wartosc), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, zn)]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.strona).toBeDefined());
  return s;
}
const zapisany = async (s: Awaited<ReturnType<typeof start>>) => znacznikWzoru(s.baza, 'w1');
const stuknij = (strona: number, y: number) => act(() => mockWidok.onStukniecie?.({ nativeEvent: { wzorId: 'w1', strona, y, rodzaj: 'stukniecie' } }));
const przytrzymaj = (strona: number, y: number) => act(() => mockWidok.onStukniecie?.({ nativeEvent: { wzorId: 'w1', strona, y, rodzaj: 'przytrzymanie' } }));
const chwila = () => act(async () => { await new Promise((r) => setTimeout(r, 50)); });

test('131 (1): wzór bez znacznika — stuknięcie pyta o kierunek i stawia pas na wysokości stuknięcia, potem pasek ustawień z „Done”', async () => {
  const s = await start(45);
  stuknij(2, 0.6);
  fireEvent.press(await screen.findByText('↑ Up, like a chart'));
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ strona: 2, kierunek: -1, rzadBazowy: 46 }));
  expect((await zapisany(s))?.y).toBeCloseTo(0.59, 9);
  expect(await screen.findByTestId('wzor-znacznik-gotowe')).toBeTruthy();
});
test('131 (2): znacznik ustawiony, pasek zamknięty — stuknięcie nie rusza znacznika (przypadkowe dotknięcie przy liczeniu, SP-17)', async () => {
  const s = await start(45, znacznik({}));
  expect(screen.queryByTestId('wzor-znacznik-pasek')).toBeNull();
  stuknij(3, 0.2);
  await chwila();
  expect(await zapisany(s)).toMatchObject({ strona: 1, y: 0.4, rzadBazowy: 6 });
  expect(screen.queryByTestId('wzor-kierunek')).toBeNull();
});
test('131 (2): znacznik ustawiony, pasek otwarty („Mark row”) — stuknięcie przenosi pas, rząd zostaje; po „Done” stuknięcie znowu nic nie robi', async () => {
  const s = await start(45, znacznik({}));
  fireEvent.press(screen.getByTestId('wzor-zaznacz'));
  expect(await screen.findByTestId('wzor-znacznik-pasek')).toBeTruthy();
  stuknij(3, 0.2);
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ strona: 3, rzadBazowy: 6 }));
  fireEvent.press(screen.getByTestId('wzor-znacznik-gotowe'));
  await waitFor(() => expect(screen.queryByTestId('wzor-znacznik-pasek')).toBeNull());
  stuknij(4, 0.7);
  await chwila();
  expect(await zapisany(s)).toMatchObject({ strona: 3, rzadBazowy: 6 });
});
test('131 (2): przytrzymanie przy ustawionym znaczniku i zamkniętym pasku przenosi pas jak dotąd', async () => {
  const s = await start(45, znacznik({}));
  przytrzymaj(3, 0.2);
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ strona: 3, rzadBazowy: 6 }));
});
test('131 (3): wybrane narzędzie rysowania — stuknięcie na wzorze bez znacznika nie pyta o kierunek i nie stawia znacznika', async () => {
  const s = await start(45);
  fireEvent.press(screen.getByTestId('wzor-zakreslacz'));
  await waitFor(() => expect(mockWidok.polityka).toBe('dowolne'));
  stuknij(2, 0.6);
  await chwila();
  expect(screen.queryByTestId('wzor-kierunek')).toBeNull();
  expect(await zapisany(s)).toBeNull();
});
test('131 (5): „Mark row” rysuje glif uchwytu znacznika z tokenów (linia 0,1 i okrąg 0,5 pola o rozmiarze symbolu paska 17 pt, środek okręgu na 0,7 szerokości), nie symbol `bookmark`', async () => {
  await start(45);
  const ikona = screen.getByTestId('wzor-zaznacz');
  expect(ikona.props.accessibilityLabel).toBe('Mark row');
  expect(screen.queryByTestId('symbol-bookmark', { includeHiddenElements: true })).toBeNull();
  const k = tokeny.kolory.jasny; // tusz (dawniej grafit) i tło (dawniej papier) motywu jasnego z tokenów Dzianiny
  const P = Math.round(ROZMIAR_SYMBOLU * Math.min(Math.max(Dimensions.get('window').fontScale, 1), MAX_SKALA_TYTULOWA)); // pole skaluje się jak symbole paska (najwyżej ×1,8)
  const pole = StyleSheet.flatten(screen.getByTestId('wzor-zaznacz-glif', { includeHiddenElements: true }).props.style);
  expect(pole).toMatchObject({ width: P, height: P });
  const linia = StyleSheet.flatten(screen.getByTestId('wzor-zaznacz-glif-linia', { includeHiddenElements: true }).props.style);
  expect(linia).toMatchObject({ width: P, height: P * 0.1, backgroundColor: k.tekst });
  expect(linia.top).toBeCloseTo(P * 0.45, 9); // komponent liczy (P − grubość) / 2; różnica tylko w zapisie zmiennoprzecinkowym
  const okrag = StyleSheet.flatten(screen.getByTestId('wzor-zaznacz-glif-okrag', { includeHiddenElements: true }).props.style);
  expect(okrag).toMatchObject({ width: P * 0.5, height: P * 0.5, borderRadius: P * 0.25, borderWidth: P * 0.1, borderColor: k.tekst, backgroundColor: k.tlo });
  expect(okrag.left).toBeCloseTo(P * 0.45, 9);
  expect(okrag.top).toBeCloseTo(P * 0.25, 9);
});
