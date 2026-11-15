// PU-290 — CZĘŚCIOWO, nie zamykać wiersza katalogu, dopóki nagłówek listy „Patterns in …” nie jest renderowany (patrz niżej). Katalog „Wzory”: projekt z dwoma wzorami (zdjęcie strony i PDF) → tytuł wzoru z ▾ → lista „Patterns in …” z ✓ przy bieżącym → wybór PDF: widok PDF z jego
// rysunkami (zakreśleniami) → restart: otwiera się ostatnio wybrany wzór → ekran projektu ma grupę „Patterns” z dwoma wierszami.
// Trasy „/wzor” i „/projekt/[id]” na prawdziwej bazie, prawdziwych przypadkach użycia i prawdziwym t() z en.json; widok strony PDF to atrapa modułu natywnego (Swift),
// która zapisuje propsy (dokument z rysunkami). „Restart” to odmontowanie i ponowne zamontowanie trasy na tej samej bazie.
import React from 'react';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, rysunek, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { PortBazy } from '../../src/domena/porty';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), navigate: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => (require('react') as typeof import('react')).useEffect(f, [f]) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
type PropsWidoku = { dokument?: { wzorId: string; rysunki: { strona: number; plik: string }[] } };
let mockWidok: PropsWidoku = {};
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const SKAN = Buffer.from('%PDF-1.4\n% skan strony\n%%EOF\n');
const RYS = Buffer.from('pkdrawing-zakreslenie');

async function zasiej() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf'), hSkan = wlozPlik(s.magazyn, SKAN, 'pdf'), r = wlozPlik(s.magazyn, RYS, 'pkdrawing');
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5), plik(h, 'pdf', PDF.length), plik(hSkan, 'pdf', SKAN.length), plik(r, 'pkdrawing', RYS.length),
    wzor('w1', 'p1', h), ["UPDATE wzor SET nazwa = 'Sleeve chart' WHERE id = 'w1'", []], rysunek('w1', 0, r),
    ["INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, zmieniono_ms) VALUES ('w2', 'p1', 'Page photo', 'obraz', ?, ?)", [hSkan, T0]]]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, dostep: { stan: () => ({ poziom: 'darmowa' }) }, porty: { haptyka: { zagraj: jest.fn() }, siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
    wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null, wklej: async () => null } } }, licznik: k, preferencje: { stan: () => ({ wibracje: false }) } };
}
const otworzWzor = async () => { mockWidok = {}; render(<EkranWzoru />); await waitFor(() => expect(mockWidok.dokument).toBeDefined()); };

test('PU-290 (część): ▾ → lista wzorów z ✓ → wybór „Sleeve chart” (PDF z rysunkiem) → po restarcie ten sam wzór; projekt ma dwa wzory w grupie „Patterns”', async () => {
  await zasiej();
  mockParams = {};

  await otworzWzor(); // bez zapamiętanego wzoru: pierwszy z listy (po nazwie) — zdjęcie strony
  expect(mockWidok.dokument?.wzorId).toBe('w2');
  fireEvent.press(await screen.findByTestId('wzor-przelacz'));
  // UWAGA: nagłówek „Patterns in Sweter” (klucz wzor.przelacz_naglowek) nie jest renderowany nigdzie w kodzie — bez asercji; zob. raport PU-290.
  expect(screen.getByRole('menuitem', { name: 'Page photo' }).props.accessibilityState).toMatchObject({ selected: true }); // ✓ przy bieżącym
  fireEvent.press(screen.getByRole('menuitem', { name: 'Sleeve chart' }));
  await waitFor(() => expect(mockWidok.dokument?.wzorId).toBe('w1'));
  expect(mockWidok.dokument?.rysunki).toHaveLength(1); // widok PDF z jego zakreśleniami
  expect(screen.getByTestId('wzor-zrodlo')).toHaveTextContent(/^PDF/);
  await act(async () => { await new Promise((x) => setTimeout(x, 100)); }); // zapis ostatnio wybranego wzoru

  screen.unmount(); // „zabij aplikację → Kontynuuj”
  await otworzWzor();
  expect(mockWidok.dokument?.wzorId).toBe('w1');
  expect(screen.getByTestId('wzor-zrodlo')).toHaveTextContent(/^PDF/);

  screen.unmount();
  mockParams = { id: 'p1' };
  render(<EkranProjektu />);
  await waitFor(() => expect(screen.getAllByTestId('projekt-wzor')).toHaveLength(2));
  expect(within(screen.getAllByTestId('projekt-wzor')[0]!).getByText('Page photo')).toBeTruthy();
  expect(within(screen.getAllByTestId('projekt-wzor')[1]!).getByText('Sleeve chart')).toBeTruthy();
});

// PU-291 — CZĘŚCIOWO (zob. raport): „Rename” → nowa nazwa: tytuł przełącznika i grupa „Patterns” projektu mają nową nazwę; pusta nazwa nie zmienia nazwy.
// Część „krok Udostępnij (migawka)” nie jest sprawdzana: migawka niesie tylko liczbę wzorów projektu (src/przypadki-uzycia/migawka.ts:17).
test('PU-291 (część): ••• → „Rename” → „Front chart” → tytuł i grupa „Patterns” projektu z nową nazwą; pusta nazwa nie zapisuje', async () => {
  await zasiej();
  mockParams = {};
  await otworzWzor(); // otwiera „Page photo” (pierwszy po nazwie)
  fireEvent.press(screen.getByTestId('wzor-menu'));
  fireEvent.press(screen.getByTestId('wzor-zmien-nazwe'));
  fireEvent.changeText(screen.getByTestId('wzor-nazwa-pole'), '   ');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  expect(screen.getByTestId('wzor-nazwa-pole')).toBeTruthy(); // pusta nazwa: arkusz zostaje, nazwa bez zmiany
  fireEvent.changeText(screen.getByTestId('wzor-nazwa-pole'), 'Front chart');
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((x) => setTimeout(x, 100)); });
  await waitFor(() => expect(screen.getByTestId('wzor-przelacz').props.accessibilityLabel).toBe('Pattern: Front chart. Switch pattern'));
  screen.unmount();
  mockParams = { id: 'p1' };
  render(<EkranProjektu />);
  await waitFor(() => expect(screen.getAllByTestId('projekt-wzor')).toHaveLength(2));
  expect(screen.getByText('Front chart')).toBeTruthy();
  expect(screen.queryByText('Page photo')).toBeNull();
});
