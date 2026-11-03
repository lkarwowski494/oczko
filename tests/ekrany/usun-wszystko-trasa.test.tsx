// Trasa „/usun-wszystko” (app/usun-wszystko.tsx) przez ekran, nie sam komponent (07-jakosc-032).
// 07-jakosc-012 (KP-05) i N-05-1 (P-328, ADR-0028): usunięcie zawsze po kopii w Plikach; nieudana kopia = alert i dane nietknięte. 
import React from 'react';
import { Alert } from 'react-native';
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { preferencje } from '../../src/kompozycja/preferencje';
import { projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { licznosci, przygotuj, wykonaj, zArchiwum } from '../dane/pomocnicze/srodowisko';
import { przycisk, tEn } from './pomoc';

const mockRouter = { back: jest.fn(), dismissTo: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUsunWszystko = (require('../../app/usun-wszystko') as { default: React.ComponentType }).default;

async function aplikacja(zablokowanaKopia = false) {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('stary', 'Stary sweter')]);
  if (zablokowanaKopia) { const plik = join(s.katalog, 'plik-zamiast-katalogu'); writeFileSync(plik, 'x'); s.z.katalogi.kopiePrzed = join(plik, 'Backup'); }
  const licznik = { zresetuj: jest.fn() };
  const z = zArchiwum(s.z);
  const pref = preferencje();
  mockAplikacja = { kontener: { z, j: { t }, icloud: null }, licznik, preferencje: { ...pref, wczytaj: () => pref.wczytaj(z) } };
  return { s, licznik, pref, z };
}

beforeEach(() => { jest.clearAllMocks(); });

test('07-jakosc-012 (KP-05): potwierdzenie usunięcia mówi, że zakup Oczko Pro nie jest usuwany i jak go przywrócić', async () => {
  await aplikacja();
  render(<EkranUsunWszystko />);
  expect(screen.getByText('Oczko Pro isn’t deleted. If it’s off afterwards, choose Restore purchases in Oczko Pro.')).toBeTruthy();
});

test('N-05-1: arkusz mówi o kopii w Plikach; potwierdzenie → kopia w Documents/Backup, dane usunięte, powrót do listy', async () => {
  const { s, licznik } = await aplikacja();
  render(<EkranUsunWszystko />);
  expect(screen.getByText('This removes all projects, counters, history, patterns and photos from Oczko. Copies Oczko saved for safety stay on this device, and Oczko deletes them after 30 days.')).toBeTruthy(); // M1-130 (P-427 a)
  expect(screen.getByText('Oczko first saves a copy in the Files app, in Oczko › Backup. Importing that file brings everything back.')).toBeTruthy();
  await userEvent.press(przycisk('Delete all data'));
  await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/projekty'));
  expect(readdirSync(s.z.katalogi.kopiePrzed)).toEqual(['oczko-przed-usunieciem-2026-10-22.oczko']);
  expect((await licznosci(s.baza)).projekt).toBe(0);
  expect(licznik.zresetuj).toHaveBeenCalledTimes(1);
});

test('N-05-1: nie da się zapisać kopii → alert „couldn’t save a copy”, nic nie usunięto, bez powrotu do listy', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { s, licznik } = await aplikacja(true);
  const przed = await licznosci(s.baza);
  render(<EkranUsunWszystko />);
  await userEvent.press(przycisk('Delete all data'));
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(alert.mock.calls[0][1]).toBe('Oczko couldn’t save a copy, so nothing was deleted. Free some space and try again.');
  expect(await licznosci(s.baza)).toEqual(przed);
  expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  expect(licznik.zresetuj).not.toHaveBeenCalled();
});

test('07-jakosc-004 (ADR-0029 pkt 4, K-04g): po „Delete all data” migawka preferencji wraca do wartości domyślnych, a wiersze usunięte z bazy', async () => {
  const { pref, z } = await aplikacja();
  await pref.zapisz(z, { wibracje: false, ekranNieGasnie: false, ukladMiar: 'imperial' });
  render(<EkranUsunWszystko />);
  await userEvent.press(przycisk('Delete all data'));
  await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/projekty'));
  expect(pref.stan()).toEqual({ wibracje: true, ekranNieGasnie: true, ukladMiar: 'auto' });
  expect(await z.baza.all('SELECT klucz FROM ustawienie WHERE klucz IN (\'wibracje\', \'ekran_nie_gasnie\', \'uklad_miar\')')).toEqual([]);
});
