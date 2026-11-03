// Trasa „/wzor” (app/wzor.tsx), znacznik rzędu (07-jakosc-023, F-26; BR-WZR-003 S2–S4; design-spec „Znacznik rzędu na wzorze”):
// przytrzymanie na stronie stawia pas (także pierwszy raz, z pytaniem o kierunek) i przestawia go bez zmiany rzędu, krokowiec ustawia rząd schematu,
// przed początkiem schematu pasek to mówi, a koniec strony ma komunikat i przejście na następną stronę. Widok strony PDF to atrapa modułu natywnego (Swift).
import React from 'react';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { znacznikWzoru } from '../../src/dane/repozytoria/wzory';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
type Zd<T> = (e: { nativeEvent: T }) => void;
type PropsWidoku = { strona?: number; znacznik?: { strona: number; y: number; wysokosc: number; pozaStrona: boolean; przedSchematem: boolean; kierunek: number; etykieta: string; napis: string; akcjaNastepnaStrona: string } | null;
  onZnacznik?: Zd<{ wzorId: string; strona: number; y: number; wysokosc: number }>; onZnacznikKrok?: Zd<{ wzorId: string; delta: 1 | -1 }>; onNastepnaStrona?: Zd<Record<string, never>>;
  onStukniecie?: Zd<{ wzorId: string; strona: number; y: number }>; onStrona?: Zd<{ strona: number; stron: number }> };
let mockWidok: PropsWidoku = {};
let mockZ: Parameters<typeof widokWzoru>[0];
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
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
  mockZ = s.z;
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.strona).toBeDefined());
  return s;
}
const zapisany = async (s: Awaited<ReturnType<typeof start>>) => znacznikWzoru(s.baza, 'w1');
const przytrzymaj = (strona: number, y: number) => act(() => mockWidok.onStukniecie?.({ nativeEvent: { wzorId: 'w1', strona, y } }));
const naStronach = (strona: number, stron: number) => act(() => mockWidok.onStrona?.({ nativeEvent: { strona, stron } }));

test('S2: przytrzymanie na wzorze bez znacznika pyta o kierunek i stawia pas w tym miejscu (pas wyśrodkowany na palcu), rząd = rząd w robocie', async () => {
  const s = await start(45);
  przytrzymaj(2, 0.6);
  fireEvent.press(await screen.findByText('↑ Up, like a chart'));
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ strona: 2, kierunek: -1, rzadBazowy: 46, wartoscPrzyUstawieniu: 45 }));
  expect((await zapisany(s))?.y).toBeCloseTo(0.59, 9);
});
test('S3: przeniesienie pasa przytrzymaniem zachowuje rząd znacznika (nie wraca do rzędu w robocie)', async () => {
  const s = await start(45, znacznik({}));
  przytrzymaj(3, 0.2);
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ strona: 3, rzadBazowy: 6, wartoscPrzyUstawieniu: 45 }));
  const w = await widokWzoru(mockZ, { wzorId: 'w1' });
  expect(w.ok && w.wartosc.znacznik?.rzad).toBe(6);
});
test('S3: „Mark row” otwiera pasek z krokowcem; po cofnięciu rzędu znacznika do 1 i dodaniu 2 rzędów znacznik stoi na rzędzie 3', async () => {
  const s = await start(3);
  fireEvent.press(screen.getByLabelText('Mark row'));
  fireEvent.press(await screen.findByText('↑ Up, like a chart'));
  expect(await screen.findByTestId('wzor-znacznik-rzad')).toHaveTextContent('4');
  expect(screen.getByText('Rows go up, like a chart')).toBeTruthy();
  for (let i = 0; i < 3; i++) fireEvent.press(screen.getByTestId('wzor-znacznik-rzad-minus'));
  await waitFor(() => expect(screen.getByTestId('wzor-znacznik-rzad')).toHaveTextContent('1'));
  expect(await zapisany(s)).toMatchObject({ rzadBazowy: 1, wartoscPrzyUstawieniu: 3 });
  fireEvent.press(screen.getByTestId('wzor-znacznik-gotowe'));
  expect(screen.queryByTestId('wzor-znacznik-rzad')).toBeNull();
  for (let i = 0; i < 2; i++) fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(mockWidok.znacznik?.etykieta).toBe('Row marker, row 3, rows go up'));
});
test('S4: prucie przed początek schematu: znacznik zostaje na rzędzie 1 z oznaczeniem „Before the pattern”, po powrocie oznaczenie znika', async () => {
  await start(2, znacznik({ rzad_bazowy: 1, wartosc_przy_ustawieniu: 2, y: 0.3 }));
  for (let i = 0; i < 2; i++) fireEvent.press(screen.getByTestId('licznik-minus'));
  expect(await screen.findByText('Before the pattern')).toBeTruthy();
  expect(mockWidok.znacznik).toMatchObject({ przedSchematem: true, etykieta: 'Row marker, row 1, rows go up' });
  for (let i = 0; i < 2; i++) fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc')).toHaveTextContent('2'));
  await waitFor(() => expect(screen.queryByText('Before the pattern')).toBeNull());
});
test('koniec strony (rzędy w dół): komunikat z numerem strony i rzędu, „Place on page 3” stawia pas na górze następnej strony z tym samym rzędem i przewija', async () => {
  const s = await start(10, znacznik({ strona: 1, y: 0.97, rzad_bazowy: 10, wartosc_przy_ustawieniu: 10, kierunek: 1 }));
  naStronach(1, 6);
  fireEvent.press(screen.getByTestId('licznik-plus'));
  expect(await screen.findByText('Row 11 is past the bottom of page 2')).toBeTruthy();
  expect(screen.getByText('Move the marker to row 11 on the next page.')).toBeTruthy();
  fireEvent.press(screen.getByText('Place on page 3'));
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ strona: 2, y: 0, rzadBazowy: 11, kierunek: 1 }));
  await waitFor(() => expect(mockWidok.strona).toBe(2));
});
test('koniec strony (rzędy w górę) na ostatniej stronie: „past the end of the pattern” i „Move marker” zamiast przejścia', async () => {
  await start(10, znacznik({ strona: 1, y: 0.01, rzad_bazowy: 10, wartosc_przy_ustawieniu: 10, kierunek: -1 }));
  naStronach(1, 2);
  fireEvent.press(screen.getByTestId('licznik-plus'));
  expect(await screen.findByText('Row 11 is past the end of the pattern.')).toBeTruthy();
  expect(screen.queryByText(/Place on page/)).toBeNull();
  fireEvent.press(screen.getByText('Move marker'));
  expect(await screen.findByTestId('wzor-znacznik-rzad')).toHaveTextContent('11');
});

test('widok natywny dostaje napis zakładki „Row 6 ↑” i brak akcji „następna strona”, gdy pas jest na stronie', async () => {
  await start(45, znacznik({}));
  naStronach(1, 6);
  await waitFor(() => expect(mockWidok.znacznik).toMatchObject({ napis: 'Row 6 ↑', akcjaNastepnaStrona: '', pozaStrona: false }));
});
test('na końcu strony napis to „Row 11 · page end”, a akcja VoiceOver „Move to next page” jest, dopóki jest następna strona', async () => {
  await start(10, znacznik({ strona: 1, y: 0.97, rzad_bazowy: 10, wartosc_przy_ustawieniu: 10, kierunek: 1 }));
  naStronach(1, 6);
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(mockWidok.znacznik).toMatchObject({ napis: 'Row 11 · page end', akcjaNastepnaStrona: 'Move to next page', pozaStrona: true }));
  naStronach(5, 6); // zgłoszona strona widoku nie zmienia tego, czy za stroną znacznika (1) jest następna
  expect(mockWidok.znacznik?.akcjaNastepnaStrona).toBe('Move to next page');
});
test('przeciągnięcie pasa i uchwytu (zdarzenie widoku): zapis nowego miejsca i wysokości rzędu, rząd bez zmiany', async () => {
  const s = await start(45, znacznik({}));
  act(() => mockWidok.onZnacznik?.({ nativeEvent: { wzorId: 'w1', strona: 1, y: 0.55, wysokosc: 0.05 } }));
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ strona: 1, y: 0.55, wysokoscRzedu: 0.05, rzadBazowy: 6 }));
});
test('VoiceOver: zwiększ/zmniejsz przesuwa pas o rząd (rząd ±1), a na krawędzi strony nic się nie dzieje', async () => {
  const s = await start(45, znacznik({}));
  act(() => mockWidok.onZnacznikKrok?.({ nativeEvent: { wzorId: 'w1', delta: 1 } }));
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ rzadBazowy: 7 }));
  expect((await zapisany(s))?.y).toBeCloseTo(0.38, 9);
  act(() => mockWidok.onZnacznikKrok?.({ nativeEvent: { wzorId: 'w1', delta: -1 } }));
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ rzadBazowy: 6 }));
});
test('VoiceOver „Move to next page” robi to samo co przycisk „Place on page 3”', async () => {
  const s = await start(10, znacznik({ strona: 1, y: 0.97, rzad_bazowy: 10, wartosc_przy_ustawieniu: 10, kierunek: 1 }));
  naStronach(1, 6);
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await screen.findByText('Place on page 3');
  act(() => mockWidok.onNastepnaStrona?.({ nativeEvent: {} }));
  await waitFor(async () => expect(await zapisany(s)).toMatchObject({ strona: 2, y: 0, rzadBazowy: 11 }));
});

test('033-T1 (lista dla 08 #2, scenariusz 62): ikona „Mark row” ma testID `wzor-zaznacz` i etykietę „Mark row”; stuknięcie przy pierwszym znaczniku pyta o kierunek', async () => {
  await start(45);
  const ikona = await screen.findByTestId('wzor-zaznacz');
  expect(ikona.props.accessibilityLabel).toBe('Mark row');
  fireEvent.press(ikona);
  expect(await screen.findByText('↑ Up, like a chart')).toBeTruthy();
});
