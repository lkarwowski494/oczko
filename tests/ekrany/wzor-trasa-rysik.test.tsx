// Trasa „/wzor” (app/wzor.tsx), rysik (07-jakosc-026, F-28; P-327 (a); BR-WZR-004 S2): pierwsze dotknięcie rysikiem, gdy po otwarciu wzoru nie wybrano narzędzia, wybiera Pen
// i włącza pencilOnly; wybrane narzędzie zostaje. Widok PDF to atrapa modułu natywnego (Swift); brak testu z prawdziwym rysikiem — ryzyko szczątkowe P-226.
import React from 'react';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { politykaPlotna } from '../../src/domena/rysik';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
type PropsWidoku = { strona?: number; narzedzie?: string; polityka?: string; onPierwszyRysik?: (e: { nativeEvent: Record<string, never> }) => void };
let mockWidok: PropsWidoku = {};
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');

async function start() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 4), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.strona).toBeDefined());
}
const rysik = () => act(() => mockWidok.onPierwszyRysik?.({ nativeEvent: {} }));

test('P-327 (a): po otwarciu bez narzędzia płótno wyłączone; pierwszy rysik wybiera Pen i włącza pencilOnly — rysik pisze od razu', async () => {
  await start();
  expect([mockWidok.narzedzie, mockWidok.polityka]).toEqual(['brak', 'wylaczone']);
  rysik();
  await waitFor(() => expect([mockWidok.narzedzie, mockWidok.polityka]).toEqual(['pioro', 'tylkoRysik']));
  expect(mockWidok.polityka).toBe(politykaPlotna({ narzedzie: 'pioro', tylkoRysik: true })); // ta sama polityka, którą liczy czysta funkcja
});
test('wybrany wcześniej zakreślacz zostaje po pierwszym rysiku, polityka pencilOnly', async () => {
  await start();
  fireEvent.press(await screen.findByTestId('wzor-zakreslacz'));
  await waitFor(() => expect(mockWidok.narzedzie).toBe('zakreslacz'));
  rysik();
  await waitFor(() => expect([mockWidok.narzedzie, mockWidok.polityka]).toEqual(['zakreslacz', 'tylkoRysik']));
});
