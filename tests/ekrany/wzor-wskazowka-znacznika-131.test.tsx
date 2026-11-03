// M1-audytor-generalny-131 (04-studio-projektowe-521; DEC-33 b, P-447 wariant a): wskazówka pierwszego otwarcia wzoru `wzor.wskazowka_znacznika`
// (design-spec „Aneks M2 partia 3c1”, „Znacznik: stuknięcie w rząd…”, pkt 3 i „Dla 08” (4)). Linia nad stroną, testID `wzor-wskazowka-znacznika`; raz:
// flaga `wskazowka_znacznika_widziana` w tabeli `ustawienie` zapisuje się, gdy wskazówka się pokaże (jedzie z kopią, dane.md). Brak przy Wordzie,
// przy włączonym VoiceOver (flaga pusta w obu) i przy wzorze ze znacznikiem; znika, gdy zaczyna się ustawianie znacznika; ukryta w trybie rysowania.
import React from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { odczytajUstawienie, type KluczUstawienia } from '../../src/dane/repozytoria/ustawienia';
import { czesc, licznik, plik, projekt, wzor, type Instr } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

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

const TEKST = 'Tap a row to place your marker.';
const FLAGA = 'wskazowka_znacznika_widziana' as KluczUstawienia; // P-447: klucz `ustawienie` (dane.md „Klucze tabeli ustawienie”)
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 6, wartosc_przy_ustawieniu: 45, kierunek: -1 });
const czytnik = jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled');
beforeEach(() => { czytnik.mockResolvedValue(false); mockWidok = {}; });

async function przygotuj(o: { znacznik?: string; word?: boolean } = {}) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, o.word ? 'docx' : 'pdf');
  const w: Instr = o.word
    ? ["INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, oryginal_sha256, zmieniono_ms) VALUES ('w1', 'p1', 'Wzór', 'word', NULL, ?, ?)", [h, T0]]
    : wzor('w1', 'p1', h, o.znacznik ?? '{}');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 45), plik(h, o.word ? 'docx' : 'pdf', PDF.length), w]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  return s;
}
async function otworz(word = false) {
  const r = render(<EkranWzoru />);
  if (word) await screen.findByText(/^Word documents open as they are/);
  else await waitFor(() => expect(mockWidok.strona).toBeDefined());
  await chwila();
  return r;
}
const chwila = () => act(async () => { await new Promise((r) => setTimeout(r, 50)); });
const wskazowka = () => screen.queryByTestId('wzor-wskazowka-znacznika', { includeHiddenElements: true });
const flaga = (s: Awaited<ReturnType<typeof przygotuj>>) => odczytajUstawienie(s.baza, FLAGA);

test('131 (4): pierwsze otwarcie wzoru bez znacznika — linia `wzor-wskazowka-znacznika` z tekstem klucza, ukryta dla VoiceOver; flaga w `ustawienie` = true', async () => {
  const s = await przygotuj();
  await otworz();
  const w = await waitFor(() => { const e = wskazowka(); expect(e).not.toBeNull(); return e!; });
  expect(w.props.children).toBe(TEKST);
  expect(w.props.accessibilityElementsHidden).toBe(true);
  expect(w.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(await flaga(s)).toBe(true);
});
test('131 (4): drugie otwarcie (flaga zapisana przy pierwszym) — bez wskazówki', async () => {
  const s = await przygotuj();
  const r = await otworz();
  await waitFor(() => expect(wskazowka()).not.toBeNull());
  r.unmount();
  await otworz();
  expect(wskazowka()).toBeNull();
  expect(await flaga(s)).toBe(true);
});
test('131 (4): po stuknięciu (zaczyna się ustawianie) linia znika i nie wraca po postawieniu znacznika', async () => {
  await przygotuj();
  await otworz();
  await waitFor(() => expect(wskazowka()).not.toBeNull());
  act(() => mockWidok.onStukniecie?.({ nativeEvent: { wzorId: 'w1', strona: 1, y: 0.5, rodzaj: 'stukniecie' } }));
  await waitFor(() => expect(wskazowka()).toBeNull());
  fireEvent.press(await screen.findByText('↑ Up, like a chart'));
  expect(await screen.findByTestId('wzor-znacznik-gotowe')).toBeTruthy();
  fireEvent.press(screen.getByTestId('wzor-znacznik-gotowe'));
  await chwila();
  expect(wskazowka()).toBeNull();
});
test('131 (4): „Mark row” w pasku też zaczyna ustawianie — linia znika', async () => {
  await przygotuj();
  await otworz();
  await waitFor(() => expect(wskazowka()).not.toBeNull());
  fireEvent.press(screen.getByTestId('wzor-zaznacz'));
  await waitFor(() => expect(wskazowka()).toBeNull());
});
test('131 (4): tryb rysowania ukrywa linię, wyjście z niego (okno testu = iPad: ponowne stuknięcie narzędzia, jak „Done”) przywraca ją, gdy znacznika dalej nie ma', async () => {
  await przygotuj();
  await otworz();
  await waitFor(() => expect(wskazowka()).not.toBeNull());
  fireEvent.press(screen.getByTestId('wzor-zakreslacz'));
  await waitFor(() => expect(wskazowka()).toBeNull());
  await waitFor(() => expect(mockWidok.polityka).toBe('dowolne'));
  fireEvent.press(screen.getByTestId('wzor-zakreslacz'));
  await waitFor(() => expect(wskazowka()).not.toBeNull());
});
test('131 (4): wzór ze znacznikiem — bez wskazówki i bez zapisu flagi', async () => {
  const s = await przygotuj({ znacznik: ZNACZNIK });
  await otworz();
  expect(wskazowka()).toBeNull();
  expect(await flaga(s)).toBeUndefined();
});
test('131 (4): Word w podglądzie zastępczym — bez wskazówki i bez zapisu flagi', async () => {
  const s = await przygotuj({ word: true });
  await otworz(true);
  expect(wskazowka()).toBeNull();
  expect(await flaga(s)).toBeUndefined();
});
test('131 (4): VoiceOver włączony — bez wskazówki i bez zapisu flagi (do ustawienia służy „Mark row”)', async () => {
  czytnik.mockResolvedValue(true);
  const s = await przygotuj();
  await otworz();
  expect(wskazowka()).toBeNull();
  expect(await flaga(s)).toBeUndefined();
});
