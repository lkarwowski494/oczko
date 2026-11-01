// Trasa „/wzor” (app/wzor.tsx), pozycja wzoru (07-jakosc-006, F-49; BR-PRJ-011 S1): wzór otwiera się na zapisanej stronie i w zapisanym powiększeniu,
// strona i powiększenie zgłaszane przez widok natywny trafiają do `ostatnie_miejsce`, a wyjście z ekranu odznacza „praca na wzorze”. Widok PDF to atrapa modułu natywnego (Swift).
import React from 'react';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { zapamietajPozycjeWzoru } from '../../src/przypadki-uzycia/wzor-miejsce';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, jeden, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
type Zd<T> = (e: { nativeEvent: T }) => void;
type PropsWidoku = { strona?: number; dokument?: { wzorId: string; startStrona: number; startPowiekszenie: number };
  onStrona?: Zd<{ strona: number; stron: number }>; onPowiekszenie?: Zd<{ wzorId: string; powiekszenie: number }> };
let mockWidok: PropsWidoku = {};
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

async function start(zapisane?: { strona?: number; powiekszenie?: number }) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 4), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  if (zapisane) await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', ...zapisane });
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  const r = render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.strona).toBeDefined());
  return { s, r };
}
const miejsce = async (s: Awaited<ReturnType<typeof start>>['s']) => JSON.parse((await jeden<{ wartosc: string }>(s.baza, "SELECT wartosc FROM ustawienie WHERE klucz = 'ostatnie_miejsce'")).wartosc) as unknown;

test('S1: wzór otwiera się na zapisanej stronie 3 w powiększeniu 2× (pozycja w dokumencie dla widoku natywnego, bez zależności od kolejności propsów)', async () => {
  await start({ strona: 2, powiekszenie: 2 });
  expect(mockWidok.strona).toBe(2);
  expect(mockWidok.dokument).toMatchObject({ wzorId: 'w1', startStrona: 2, startPowiekszenie: 2 });
});
test('bez zapisanej pozycji: pierwsza strona, powiększenie 0 = dopasowany do szerokości', async () => {
  await start();
  expect(mockWidok.strona).toBe(0);
  expect(mockWidok.dokument).toMatchObject({ startStrona: 0, startPowiekszenie: 0 });
});
test('strona i powiększenie z widoku natywnego trafiają do ostatnie_miejsce (ekran wzoru), a +1 nie zeruje pozycji', async () => {
  const { s } = await start();
  act(() => mockWidok.onStrona?.({ nativeEvent: { strona: 3, stron: 6 } }));
  await waitFor(async () => expect(await miejsce(s)).toMatchObject({ ekran: 'wzor', id: 'l1', wzor: 'w1', strona: 3 }));
  act(() => mockWidok.onPowiekszenie?.({ nativeEvent: { wzorId: 'w1', powiekszenie: 2.5 } }));
  await waitFor(async () => expect(await miejsce(s)).toEqual({ ekran: 'wzor', id: 'l1', wzor: 'w1', strona: 3, powiekszenie: 2.5 }));
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(screen.getByTestId('licznik-plus')).toBeTruthy());
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  expect(await miejsce(s)).toEqual({ ekran: 'wzor', id: 'l1', wzor: 'w1', strona: 3, powiekszenie: 2.5 });
});
test('zdarzenie powiększenia innego wzoru jest pomijane', async () => {
  const { s } = await start({ strona: 1, powiekszenie: 2 });
  act(() => mockWidok.onPowiekszenie?.({ nativeEvent: { wzorId: 'inny', powiekszenie: 5 } }));
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  expect(await miejsce(s)).toMatchObject({ strona: 1, powiekszenie: 2 });
});
test('wyjście z ekranu wzoru (zamknięcie trasy) odznacza ekran wzoru: ekran „licznik”, pozycja zostaje', async () => {
  const { s, r } = await start({ strona: 2, powiekszenie: 2 });
  expect(await miejsce(s)).toMatchObject({ ekran: 'wzor' });
  r.unmount();
  await waitFor(async () => expect(await miejsce(s)).toEqual({ ekran: 'licznik', id: 'l1', wzor: 'w1', strona: 2, powiekszenie: 2 }));
});
