// BX-002 (PU-067): po „Add note” → „Save” chip notatki pojawia się na otwartym wzorze od razu (wcześniej dopiero po ponownym otwarciu wzoru:
// `naNotatka` w `src/ekrany/WzorAkcje.ts` zapisywało, ale nie wczytywało widoku). Trasa „/wzor” na prawdziwej bazie, widok PDF to atrapa na granicy platformy
// (jak `wzor-trasa-notatki.test.tsx`).
import React from 'react';
import { View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
type PropsWidoku = { notatki?: { id: string; strona: number; y: number; wysokosc: number; etykieta: string; a11y: string }[]; onNotatka?: (e: { nativeEvent: { id: string } }) => void };
let mockWidok: PropsWidoku = {};
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
// Licznik 45 (rząd w robocie 46), znacznik ustawiony po raz pierwszy: rząd schematu = rząd w robocie (`domyslnyRzadBazowy`, RD-21), strona 1, y 0,4, w górę.
// (Znacznik przeniesiony na inny rząd schematu niż licznik+1: osobna wada — notatka dostaje rząd schematu, zob. `bx-stan.md` „FX”, BX-011.)
const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 46, wartosc_przy_ustawieniu: 45, kierunek: -1 });

async function start() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 45), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, ZNACZNIK)]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  return { s, k };
}

test('BX-002 / PU-067: wzór ze znacznikiem, „Add note” → „k2tog here” → „Save” → chip „Row …: k2tog here” jest na wzorze od razu, a notatka w bazie', async () => {
  const { s } = await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toBeDefined());
  expect(mockWidok.notatki ?? []).toHaveLength(0);
  fireEvent.press(screen.getByRole('button', { name: 'Add note' }));
  fireEvent.changeText(await screen.findByTestId('wzor-notatka-pole'), 'k2tog here');
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  expect(mockWidok.notatki?.[0]?.etykieta).toBe('Row 46: k2tog here');
  const wDanych = await widokWzoru(s.z, { wzorId: 'w1' }); // ten sam chip niesie widok danych, który trasa wczytuje po zapisie
  expect(wDanych.ok && wDanych.wartosc.notatki.map((c) => c.notatki.map((n) => n.tekst))).toEqual([['k2tog here']]);
  expect((await s.baza.all('SELECT tekst FROM notatka_rzedu')).map((r) => (r as { tekst: string }).tekst)).toEqual(['k2tog here']);
});
