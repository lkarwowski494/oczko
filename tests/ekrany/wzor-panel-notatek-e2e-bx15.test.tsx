// BX15 (KO-121 b, BX-051): panel `e2e-wzor-notatki` na trasie „/wzor” pokazuje ZAPISANE notatki rzędów jako tekst, bo chip rysuje nakładka PDFKit niewidoczna dla XCUI (scenariusze 102, 104).
// Build E2E: panel jest i niesie treść notatki (te same dane co chip); build wydania (`paneleE2e` = null, P-238): panelu nie ma. Reszta jak `wzor-trasa-notatki.test.tsx` (prawdziwa baza i trasa, atrapa widoku natywnego).

import React from 'react';
import { Alert, View, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { czesc, licznik, notatkaRzedu, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));

type PropsWidoku = { notatki?: { id: string; strona: number; y: number; wysokosc: number; etykieta: string; a11y: string }[]; onNotatka?: (e: { nativeEvent: { id: string } }) => void };
let mockWidok: PropsWidoku = {};
let mockZ: Parameters<typeof widokWzoru>[0];
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
const mockTryb: { paneleE2e: unknown; szerokoscOknaE2e: () => number | null } = { paneleE2e: null, szerokoscOknaE2e: () => null };
jest.mock('../../src/platforma/tryb-e2e', () => mockTryb);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
// Licznik 45 (rząd w robocie 46), znacznik na rzędzie 6 schematu, strona 1 (druga), y 0,4, w górę (BR-WZR-003 S5).
const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 6, wartosc_przy_ustawieniu: 45, kierunek: -1 });

async function start(dodatkowe: ReturnType<typeof notatkaRzedu>[] = []) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 45), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, ZNACZNIK),
    notatkaRzedu('n1', 'l1', 46, 'ujmowanie co 4 rzędy'), ...dodatkowe]);
  await k.otworz('l1');
  mockZ = s.z;
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  return { s, k };
}
test('build E2E: panel `e2e-wzor-notatki` niesie zapisaną notatkę rzędu („notes: row 6: …”), a chip dla widoku natywnego jest ten sam', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mockTryb.paneleE2e = { PanelNotatekWzoru: (require('../../src/kompozycja/e2e/notatki-wzoru-stan') as typeof import('../../src/kompozycja/e2e/notatki-wzoru-stan')).PanelNotatekWzoru };
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  expect(mockWidok.notatki?.[0]?.etykieta).toBe('Row 6: ujmowanie co 4 rzędy');
  expect((await screen.findByTestId('e2e-wzor-notatki')).props.children).toBe('notes: row 6: ujmowanie co 4 rzędy');
});
test('opis panelu: bez notatek „notes: none”, kilka notatek po „ | ”', () => {
  const { opisNotatekWzoru } = jest.requireActual<typeof import('../../src/kompozycja/e2e/notatki-wzoru-stan')>('../../src/kompozycja/e2e/notatki-wzoru-stan');
  expect(opisNotatekWzoru([])).toBe('notes: none');
  expect(opisNotatekWzoru([{ rzadWzoru: 1, notatki: [{ id: 'a', rzad: 1, tekst: 'k2tog here' }, { id: 'b', rzad: 1, tekst: 'ssk' }] as never }])).toBe('notes: row 1: k2tog here | row 1: ssk');
});
test('build wydania (`paneleE2e` = null): panelu `e2e-wzor-notatki` nie ma, chip dla widoku natywnego jest', async () => {
  mockTryb.paneleE2e = null;
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  expect(screen.queryByTestId('e2e-wzor-notatki')).toBeNull();
});
