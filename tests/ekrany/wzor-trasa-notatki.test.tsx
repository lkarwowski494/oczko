// Trasa „/wzor” (app/wzor.tsx) przez ekran na prawdziwej bazie (07-jakosc-007, 07-jakosc-032; F-56, BR-WZR-008 S2, P-330 2A):
// notatka dodana na wzorze jest na nim widoczna jako chip przy swoim rzędzie, stuknięcie otwiera arkusz notatki, „Delete note” pyta o potwierdzenie.
// Widok strony PDF to moduł natywny (Swift): tu jego atrapa na granicy platformy zapisuje propsy i oddaje zdarzenia; reszta (dane, trasa) jest prawdziwa.
import React from 'react';
import { Alert, View, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { czesc, licznik, notatkaRzedu, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
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
const przyciskAlertu = (spy: jest.SpyInstance, nazwa: string): AlertButton => (spy.mock.calls.at(-1)?.[2] as AlertButton[]).find((b) => b.text === nazwa) as AlertButton;

test('F-56 (BR-WZR-008 S2): notatka rzędu 46 to chip „Row 6: ujmowanie…” na wysokości znacznika strony 2, widok natywny dostaje go jako prop', async () => {
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  expect(mockWidok.notatki?.[0]).toMatchObject({ id: '46', strona: 1, wysokosc: 0.02, etykieta: 'Row 6: ujmowanie co 4 rzędy', a11y: 'Note on row 6: ujmowanie co 4 rzędy. Open' });
  expect(mockWidok.notatki?.[0]?.y).toBeCloseTo(0.4, 9);
  const wDanych = await widokWzoru(mockZ, { wzorId: 'w1' }); // ten sam chip, który widok danych niesie do trasy
  expect(wDanych.ok && wDanych.wartosc.notatki.map((c) => [String(c.rzad), c.strona])).toEqual([['46', 1]]);
});
test('stuknięcie chipu otwiera arkusz „Note for row 6” z pełną treścią; Close go zamyka', async () => {
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  act(() => mockWidok.onNotatka?.({ nativeEvent: { id: '46' } }));
  expect(await screen.findByText('Note for row 6')).toBeTruthy();
  expect(screen.getByText('ujmowanie co 4 rzędy')).toBeTruthy();
  fireEvent.press(screen.getByText('Close'));
  expect(screen.queryByText('Note for row 6')).toBeNull();
});
test('Edit → Save zapisuje nową treść: chip na wzorze ma nowy tekst', async () => {
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  act(() => mockWidok.onNotatka?.({ nativeEvent: { id: '46' } }));
  fireEvent.press(await screen.findByText('Edit'));
  fireEvent.changeText(screen.getByTestId('wzor-notatka-edycja'), 'ujmowanie co 6 rzędów');
  fireEvent.press(screen.getByText('Save'));
  await waitFor(() => expect(mockWidok.notatki?.[0]?.etykieta).toBe('Row 6: ujmowanie co 6 rzędów'));
});
test('„Delete note” pyta o potwierdzenie; po potwierdzeniu chip znika z wzoru, a anulowanie nic nie usuwa', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  act(() => mockWidok.onNotatka?.({ nativeEvent: { id: '46' } }));
  fireEvent.press(await screen.findByText('Delete note'));
  expect(alert.mock.calls.at(-1)?.[0]).toBe('Delete this note?');
  expect(alert.mock.calls.at(-1)?.[1]).toBe('It’s removed from the pattern and from row 6.');
  act(() => { przyciskAlertu(alert, 'Cancel').onPress?.(); });
  expect(mockWidok.notatki).toHaveLength(1);
  fireEvent.press(screen.getByText('Delete note'));
  await act(async () => { przyciskAlertu(alert, 'Delete note').onPress?.(); });
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(0));
  expect(screen.queryByText('Note for row 6')).toBeNull();
  alert.mockRestore();
});
test('dwie notatki jednego rzędu to chip zbiorczy „2 notes”; jego stuknięcie pokazuje listę „Notes on page 2”, wiersz otwiera notatkę', async () => {
  await start([notatkaRzedu('n2', 'l1', 46, 'zmiana igieł')]);
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  expect(mockWidok.notatki?.[0]?.etykieta).toBe('2 notes');
  act(() => mockWidok.onNotatka?.({ nativeEvent: { id: '46' } }));
  expect(await screen.findByText('Notes on page 2')).toBeTruthy();
  fireEvent.press(screen.getByText('Row 6: zmiana igieł'));
  expect(await screen.findByText('Note for row 6')).toBeTruthy();
  expect(screen.getByText('zmiana igieł')).toBeTruthy();
});
