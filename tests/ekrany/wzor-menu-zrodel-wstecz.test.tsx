// BW (WL-1171-01, test buildu 1171 na iPhonie: „po kliknięciu dodaj wzór nie ma przycisku wstecz”): menu źródeł wzoru (trasa `/wzor` bez wzoru albo z kafla „Dodaj wzór”)
// to ekran w stosie, więc ma widoczne „Back” jak inne ekrany push (design-spec „wstecz” 006, Pasek.tsx; analogia Trening docs/22:454 — gest tylko dodatkiem).
// Przed kodem: czerwone, bo gałąź `!widok` w `app/wzor.tsx` rysowała sam ScrollView bez `Wstecz`.
import React from 'react';
import { View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { GrupaWzorow } from '../../src/ekrany/WzorGrupa';
import { tEn } from './pomoc';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
let mockParametry: Record<string, string> = {};
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParametry }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

async function start(o: { zWzorem: boolean; skaner?: boolean }) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), ...(o.zWzorem ? [plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)] : [])]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = {
    kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() } }, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => o.skaner ?? false, wklej: async () => null } } },
    licznik: k, preferencje: { stan: () => ({ wibracje: false }) },
  };
  render(<EkranWzoru />);
}

test('WL-1171-01: menu źródeł bez wzoru ma widoczne „Back” (nav-wstecz), które wraca z ekranu (router.back)', async () => {
  mockParametry = {};
  mockRouter.back.mockClear();
  await start({ zWzorem: false });
  await screen.findByRole('menuitem', { name: 'Choose file (PDF or Word)' });
  const wstecz = screen.getByTestId('nav-wstecz');
  expect(wstecz).toBeTruthy();
  fireEvent.press(wstecz);
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
});

test('WL-1171-01: kafel „Dodaj wzór” (parametr `zrodla`) przy projekcie z wzorem też pokazuje „Back” na menu źródeł', async () => {
  mockParametry = { zrodla: '1' };
  mockRouter.back.mockClear();
  await start({ zWzorem: true });
  await screen.findByRole('menuitem', { name: 'Choose file (PDF or Word)' });
  fireEvent.press(screen.getByTestId('nav-wstecz'));
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
});

test('kontrola: przeglądarka wzoru z wzorem ma jedno „Back” (pasek wzoru), menu źródeł go nie dubluje', async () => {
  mockParametry = {};
  await start({ zWzorem: true });
  await screen.findByTestId('wzor-widok');
  expect(screen.getAllByTestId('nav-wstecz')).toHaveLength(1);
});
