// ZA1 (PU-008, KO-244; P-1138): panel `e2e-wzor-rozjazdy` na trasie „/wzor” pokazuje, ile razy widok natywny wykrył rozjazd płótna z danymi („stroke mismatches: N; last: …”), żeby
// przebieg e2e cz. 4 rozstrzygnął hipotezę (liczba kresek płótna jest niewidoczna dla XCUI). Build E2E: panel jest; build wydania (`diagnostykaE2e` = null, P-238): panelu nie ma.
// Etykieta „N highlights” nadal pochodzi z `liczba` zdarzenia. Reszta jak wzor-panel-notatek-e2e-bx15.test.tsx (prawdziwa baza i trasa, atrapa widoku natywnego).
import React from 'react';
import { View } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { opisRozjazduZakreslen } from '../../src/kompozycja/e2e/rozjazd-zakreslen-stan';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));

type ZdarzenieZakreslen = { nativeEvent: { liczba: number; rozjazdy?: number; ostatni?: string } };
type PropsWidoku = { onZakreslenia?: (e: ZdarzenieZakreslen) => void };
let mockWidok: PropsWidoku = {};
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
const mockTryb: { paneleE2e: unknown; diagnostykaE2e: unknown; szerokoscOknaE2e: () => number | null } = { paneleE2e: null, diagnostykaE2e: null, szerokoscOknaE2e: () => null };
jest.mock('../../src/platforma/tryb-e2e', () => mockTryb);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

async function start() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 45), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
}
const ustal = async () => { for (let i = 0; i < 3; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 20)); }); }; // asynchroniczne odczyty trasy (wskazówka znacznika) kończą się przed zdarzeniem
const zglos = (e: ZdarzenieZakreslen['nativeEvent']) => act(() => { mockWidok.onZakreslenia?.({ nativeEvent: e }); });

test('build E2E: panel `e2e-wzor-rozjazdy` startuje od „stroke mismatches: 0”, po zdarzeniu z rozjazdem niesie licznik i opis ostatniego', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mockTryb.paneleE2e = { PanelRozjazduZakreslen: (require('../../src/kompozycja/e2e/rozjazd-zakreslen-stan') as typeof import('../../src/kompozycja/e2e/rozjazd-zakreslen-stan')).PanelRozjazduZakreslen, PanelNotatekWzoru: () => null };
  mockTryb.diagnostykaE2e = mockTryb.paneleE2e;
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.onZakreslenia).toBeDefined());
  await ustal();
  expect((await screen.findByTestId('e2e-wzor-rozjazdy')).props.children).toBe('stroke mismatches: 0');
  zglos({ liczba: 2, rozjazdy: 0, ostatni: '' });
  expect(screen.getByTestId('e2e-wzor-rozjazdy').props.children).toBe('stroke mismatches: 0');
  zglos({ liczba: 2, rozjazdy: 1, ostatni: 'cofniecie strona=0 platno=2 dane=1' });
  expect(screen.getByTestId('e2e-wzor-rozjazdy').props.children).toBe('stroke mismatches: 1; last: cofniecie strona=0 platno=2 dane=1');
  zglos({ liczba: 2 }); // build natywny bez pól diagnostycznych (sprzed ZA1): bez rozjazdu
  expect(screen.getByTestId('e2e-wzor-rozjazdy').props.children).toBe('stroke mismatches: 0');
});
test('opis panelu: bez rozjazdu „stroke mismatches: 0”, z rozjazdem licznik i ostatnie zdarzenie', () => {
  expect(opisRozjazduZakreslen({ rozjazdy: 0, ostatni: '' })).toBe('stroke mismatches: 0');
  expect(opisRozjazduZakreslen({ rozjazdy: 2, ostatni: 'zmiana strona=1 platno=3 dane=1' })).toBe('stroke mismatches: 2; last: zmiana strona=1 platno=3 dane=1');
});
test('build wydania (`diagnostykaE2e` = null): panelu `e2e-wzor-rozjazdy` nie ma, zdarzenie z rozjazdem niczego nie pokazuje', async () => {
  mockTryb.paneleE2e = null;
  mockTryb.diagnostykaE2e = null;
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.onZakreslenia).toBeDefined());
  await ustal();
  zglos({ liczba: 2, rozjazdy: 1, ostatni: 'cofniecie strona=0 platno=2 dane=1' });
  expect(screen.queryByTestId('e2e-wzor-rozjazdy')).toBeNull();
});
