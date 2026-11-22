// Trasa „/historia” (app/historia.tsx) przez ekran na prawdziwej bazie (07-jakosc-021, 07-jakosc-032; BR-LIC-003 S2–S4):
// drugie „Undo” cofa poprzednią zmianę, cofnięty wpis ma znacznik, starsza pomyłka prowadzi do wpisania wartości, seria to jeden wpis.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { WpisHistorii } from '../../src/ekrany/Historia';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranHistorii = (require('../../app/historia') as { default: React.ComponentType }).default;

async function start(n: number) {
  const { s, k, j } = await kompozycjaTestowa();
  s.pro.wartosc = true;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', n, { t: Date.UTC(2026, 9, 22, 8) })]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k };
  s.zegar.ustaw(Date.UTC(2026, 9, 22, 12)); // nowe +1 po godzinach wpisów początkowych: nie tworzą serii z nimi
  return { s, k };
}
const wpisyNaEkranie = (): Pick<WpisHistorii, 'mozeCofnac'>[] => screen.queryAllByTestId('historia-cofnij-ostatnia').map(() => ({ mozeCofnac: true }));
const wartosc = async (k: Awaited<ReturnType<typeof start>>['k']) => (await k.widok())?.wartosc;

test('021: dwa „Undo” pod rząd z ekranu historii → licznik 1, nie 3; cofnięty wpis ma „Undone”, a „Undo” zostaje przy jednym wpisie', async () => {
  const { s, k } = await start(0);
  for (const dt of [0, 600_000, 1_200_000]) { s.zegar.ustaw(Date.UTC(2026, 9, 22, 12) + dt); await k.uslugi.dodajRzad(); }
  render(<EkranHistorii />);
  fireEvent.press(await screen.findByTestId('historia-cofnij-ostatnia'));
  await waitFor(() => expect(screen.getAllByText(/Undone/).length).toBe(1));
  expect(await wartosc(k)).toBe(2);
  expect(wpisyNaEkranie()).toHaveLength(1);
  fireEvent.press(screen.getByTestId('historia-cofnij-ostatnia'));
  await waitFor(() => expect(screen.getAllByText(/Undone/).length).toBe(2));
  expect(await wartosc(k)).toBe(1);
});
test('021 (BR-LIC-003/S4): stuknięcie starszego wpisu rozwija wyjaśnienie i „Enter the right number”, które otwiera wpisanie wartości', async () => {
  const { s, k } = await start(0);
  for (const dt of [0, 600_000]) { s.zegar.ustaw(Date.UTC(2026, 9, 22, 12) + dt); await k.uslugi.dodajRzad(); }
  render(<EkranHistorii />);
  await screen.findByTestId('historia-cofnij-ostatnia');
  expect(screen.queryByText(/Only the latest change can be undone/)).toBeNull();
  fireEvent.press(screen.getAllByTestId(/^historia-rozwin-/)[0]);
  expect(screen.getByText(/Only the latest change can be undone/)).toBeTruthy();
  fireEvent.press(screen.getByText('Enter the right number'));
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'wpisz' } });
});
test('021 (BR-LIC-003/S2): seria 5 stuknięć w 1 s to jeden wpis z „Undo 5 rows”, który wraca do wartości sprzed serii', async () => {
  const { k } = await start(30);
  for (let i = 0; i < 5; i++) await k.uslugi.dodajRzad(); // zegar stały: wszystkie w tej samej sekundzie
  render(<EkranHistorii />);
  fireEvent.press(await screen.findByText('Undo 5 rows'));
  await waitFor(async () => expect(await wartosc(k)).toBe(30));
});
