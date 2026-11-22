// M3 p3b, ZM-06 (P-563, P-580, P-588): „Wzór” bez wzoru nie ma pośredniego kroku z przyciskiem „Add pattern” — trasa „/wzor” otwiera menu źródeł od razu
// (plik, skan, zdjęcia, adres). Kafel „Dodaj wzór” na „Dziś” prowadzi do tego samego menu bieżącego projektu (parametr `zrodla`), także gdy projekt ma już wzór.
// Przed kodem: czerwone, bo menu otwierał dopiero `wzor-dodaj` (Grupa wzorów miała menu zamknięte).
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
const ZRODLA = [['Choose file (PDF or Word)', 'plik'], ['Choose photos', 'zdjecia'], ['Web page link…', 'link']] as const;

test('ZM-06: bez wzoru menu źródeł jest otwarte od razu — bez stuknięcia w „Add pattern” (plik, zdjęcia, adres; skan tylko z aparatem)', async () => {
  mockParametry = {};
  await start({ zWzorem: false, skaner: true });
  for (const [tekst] of ZRODLA) expect(await screen.findByRole('menuitem', { name: tekst })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'Scan pages' })).toBeTruthy();
});

test('ZM-06: źródło „Web page link…” z menu otwartego od razu otwiera arkusz adresu', async () => {
  mockParametry = {};
  await start({ zWzorem: false });
  fireEvent.press(await screen.findByRole('menuitem', { name: 'Web page link…' }));
  expect(await screen.findByTestId('wzor-link-pole')).toBeTruthy();
});

test('P-588: kafel „Dodaj wzór” (parametr `zrodla`) otwiera menu źródeł bieżącego projektu także wtedy, gdy projekt ma już wzór — bez przeglądarki wzoru', async () => {
  mockParametry = { zrodla: '1' };
  await start({ zWzorem: true });
  expect(await screen.findByRole('menuitem', { name: 'Choose file (PDF or Word)' })).toBeTruthy();
  await waitFor(() => expect(screen.queryByTestId('wzor-widok')).toBeNull());
});

test('kontrola: bez parametru `zrodla` projekt z wzorem otwiera przeglądarkę wzoru, nie menu źródeł', async () => {
  mockParametry = {};
  await start({ zWzorem: true });
  expect(await screen.findByTestId('wzor-widok')).toBeTruthy();
  expect(screen.queryByRole('menuitem', { name: 'Choose file (PDF or Word)' })).toBeNull();
});

test('GrupaWzorow: `menuOtwarte` otwiera menu źródeł od razu, bez niego (ekran projektu) menu jest zamknięte do stuknięcia „Add pattern”', async () => {
  const t = await tEn();
  const w = { naOtworz: jest.fn(), naDodaj: jest.fn(), naUsunOczekujacy: jest.fn() };
  const r = render(<GrupaWzorow wzory={[]} oczekujace={[]} skaner t={t} {...w} />);
  expect(screen.queryByRole('menuitem', { name: 'Choose photos' })).toBeNull();
  r.unmount();
  render(<GrupaWzorow wzory={[]} oczekujace={[]} skaner menuOtwarte t={t} {...w} />);
  expect(screen.getByRole('menuitem', { name: 'Choose photos' })).toBeTruthy();
});
