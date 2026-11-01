// Trasa „/usun-wszystko” (app/usun-wszystko.tsx) przez ekran, nie sam komponent (07-jakosc-032).
// N-05-1 (P-328, ADR-0028): usunięcie zawsze po kopii w Plikach; nieudana kopia = alert i dane nietknięte. 
import React from 'react';
import { Alert } from 'react-native';
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
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
  mockAplikacja = { kontener: { z: zArchiwum(s.z), j: { t }, icloud: null }, licznik, preferencje: {} };
  return { s, licznik };
}

beforeEach(() => { jest.clearAllMocks(); });

test('N-05-1: arkusz mówi o kopii w Plikach; potwierdzenie → kopia w Documents/Backup, dane usunięte, powrót do listy', async () => {
  const { s, licznik } = await aplikacja();
  render(<EkranUsunWszystko />);
  expect(screen.getByText('This removes all projects, counters, history, patterns and photos from this device.')).toBeTruthy();
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
