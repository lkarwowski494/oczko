// PU-293, PU-294, PU-295 (katalog przypadków użycia, „Wzory”): trasa „/wzor” (app/wzor.tsx) na prawdziwej bazie, prawdziwym t() z en.json i prawdziwych
// przypadkach użycia. Widok strony PDF to moduł natywny (Swift): jego atrapa na granicy platformy zapisuje propsy i oddaje zdarzenia (stuknięcie, strona, chip).
// Harness jak w wzor-trasa-znacznik.test.tsx i wzor-trasa-notatki.test.tsx.
import React from 'react';
import { Alert, View, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { znacznikWzoru } from '../../src/dane/repozytoria/wzory';
import { czesc, licznik, notatkaRzedu, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
type Zd<T> = (e: { nativeEvent: T }) => void;
type PropsWidoku = { znacznik?: { etykieta: string } | null; notatki?: { id: string; strona: number; etykieta: string }[];
  onStukniecie?: Zd<{ wzorId: string; strona: number; y: number }>; onStrona?: Zd<{ strona: number; stron: number }>; onNotatka?: Zd<{ id: string }> };
let mockWidok: PropsWidoku = {};
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const znacznik = (o: Record<string, unknown>) => JSON.stringify({ licznik_id: 'l1', strona: 0, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 6, wartosc_przy_ustawieniu: 45, kierunek: -1, ...o });
async function start(wartosc: number, zn = '{}', dodatkowe: ReturnType<typeof notatkaRzedu>[] = []) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', wartosc), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, zn), ...dodatkowe]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k, preferencje: { stan: () => ({ wibracje: false }) } };
  mockWidok = {};
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.znacznik).toBeDefined());
  return s;
}
const zapisany = (s: Awaited<ReturnType<typeof start>>) => znacznikWzoru(s.baza, 'w1');
const przytrzymaj = (strona: number, y: number) => act(() => mockWidok.onStukniecie?.({ nativeEvent: { wzorId: 'w1', strona, y } }));
const naStronach = (strona: number, stron: number) => act(() => mockWidok.onStrona?.({ nativeEvent: { strona, stron } }));
const przyciskAlertu = (spy: jest.SpyInstance, nazwa: string): AlertButton => (spy.mock.calls.at(-1)?.[2] as AlertButton[]).find((b) => b.text === nazwa) as AlertButton;

// PU-293: schemat czytany od dołu: „Up” → stan „Rows go up…”; „Marker row” +; „Done”; +1 przesuwa znacznik o rząd; „Change” → „Down”; „Not now” zamyka pytanie bez znacznika.
test('PU-293: „Up” → „Rows go up, like a chart”; „Marker row” +1; po „Done” i +1 znacznik o rząd wyżej; „Change” → „Rows go down…”; „Not now” bez znacznika', async () => {
  const s = await start(3);
  fireEvent.press(screen.getByLabelText('Mark row'));
  fireEvent.press(await screen.findByText('↑ Up, like a chart'));
  expect(await screen.findByText('Rows go up, like a chart')).toBeTruthy();
  expect(screen.getByTestId('wzor-znacznik-rzad')).toHaveTextContent('4');
  fireEvent.press(screen.getByTestId('wzor-znacznik-rzad-plus'));
  await waitFor(() => expect(screen.getByTestId('wzor-znacznik-rzad')).toHaveTextContent('5'));
  fireEvent.press(screen.getByTestId('wzor-znacznik-gotowe'));
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(mockWidok.znacznik?.etykieta).toBe('Row marker, row 6, rows go up'));
  fireEvent.press(screen.getByLabelText('Mark row'));
  fireEvent.press(screen.getByRole('button', { name: 'Change' }));
  fireEvent.press(await screen.findByText('↓ Down, like written steps'));
  expect(await screen.findByText('Rows go down, like written steps')).toBeTruthy();
  expect(await zapisany(s)).toMatchObject({ kierunek: 1 });
  screen.unmount();
  const bez = await start(45); // wariant: „Not now”
  przytrzymaj(2, 0.6);
  fireEvent.press(await screen.findByRole('button', { name: 'Not now' }));
  await waitFor(() => expect(screen.queryByTestId('wzor-kierunek')).toBeNull());
  expect(screen.queryByTestId('wzor-znacznik-pasek')).toBeNull();
  expect(await zapisany(bez)).toBeNull();
});

// PU-294: komunikaty, gdy rząd wychodzi poza stronę (dolna krawędź, koniec wzoru) albo przed początek wzoru (licznik 0, kierunek w górę).
test('PU-294: „Row 11 is past the bottom of page 1” z „Move the marker…”; na ostatniej stronie „past the end of the pattern.”; przy 0 „Before the pattern”', async () => {
  await start(10, znacznik({ strona: 0, y: 0.97, rzad_bazowy: 10, wartosc_przy_ustawieniu: 10, kierunek: 1 }));
  naStronach(1, 6);
  fireEvent.press(screen.getByTestId('licznik-plus'));
  expect(await screen.findByText('Row 11 is past the bottom of page 1')).toBeTruthy();
  expect(screen.getByText('Move the marker to row 11 on the next page.')).toBeTruthy();
  screen.unmount();
  await start(10, znacznik({ strona: 0, y: 0.97, rzad_bazowy: 10, wartosc_przy_ustawieniu: 10, kierunek: 1 }));
  naStronach(1, 1); // wzór jednostronicowy
  fireEvent.press(screen.getByTestId('licznik-plus'));
  expect(await screen.findByText('Row 11 is past the end of the pattern.')).toBeTruthy();
  expect(screen.queryByText(/Move the marker to row 11 on the next page/)).toBeNull();
  screen.unmount();
  await start(1, znacznik({ strona: 0, y: 0.3, rzad_bazowy: 1, wartosc_przy_ustawieniu: 1, kierunek: -1 }));
  fireEvent.press(screen.getByTestId('licznik-minus'));
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc')).toHaveTextContent('0'));
  expect(await screen.findByText('Before the pattern')).toBeTruthy();
});

// PU-295: poprawa i usunięcie notatki rzędu 12 na wzorze; bez znacznika „Add note” pyta najpierw o znacznik.
test('PU-295: notatka rzędu 12 → „Edit” „k2tog twice” → „Save” (chip); „Delete note” → alert z „row 12” → chip znika; bez znacznika „Mark the row on the pattern first…”', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await start(11, znacznik({ strona: 1, rzad_bazowy: 12, wartosc_przy_ustawieniu: 11, kierunek: 1 }), [notatkaRzedu('n1', 'l1', 12, 'k2tog here')]);
  await waitFor(() => expect(mockWidok.notatki).toMatchObject([{ etykieta: 'Row 12: k2tog here' }]));
  act(() => mockWidok.onNotatka?.({ nativeEvent: { id: '12' } }));
  fireEvent.press(await screen.findByText('Edit'));
  fireEvent.changeText(screen.getByTestId('wzor-notatka-edycja'), 'k2tog twice');
  fireEvent.press(screen.getByText('Save'));
  await waitFor(() => expect(mockWidok.notatki).toMatchObject([{ etykieta: 'Row 12: k2tog twice' }]));
  expect(screen.getByTestId('wzor-notatka-tresc')).toHaveTextContent('k2tog twice');
  fireEvent.press(screen.getByTestId('wzor-notatka-usun'));
  expect(alert.mock.calls.at(-1)?.[0]).toBe('Delete this note?');
  expect(alert.mock.calls.at(-1)?.[1]).toBe('It’s removed from the pattern and from row 12.');
  await act(async () => { przyciskAlertu(alert, 'Delete note').onPress?.(); });
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(0));
  expect(screen.queryByTestId('wzor-notatka-tresc')).toBeNull();
  screen.unmount();
  await start(45); // wariant: wzór bez znacznika
  fireEvent.press(screen.getByRole('button', { name: 'Add note' }));
  expect(screen.getByText('Mark the row on the pattern first, then write the note.')).toBeTruthy();
  alert.mockRestore();
});
