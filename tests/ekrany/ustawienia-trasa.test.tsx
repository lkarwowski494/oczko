// Trasa „/ustawienia” (app/ustawienia.tsx), nie sam komponent (07-jakosc-032): import z Plików → wybór → wynik na ekranie.
// 07-jakosc-003 (ADR-0028, BR-DAN-006/S3, K-03c, K-03d): po „Replace” ekran mówi, że dane zastąpiono, i podaje nazwę kopii; po „Merge” nadal „Merged”.
import React from 'react';
import { readdirSync, writeFileSync } from 'node:fs';
import { Alert } from 'react-native';
import { join } from 'node:path';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { archiwumWzorcowe, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { czasWTle, licznosci, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { przycisk, tEn } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
const mockParametry: { import?: string } = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []), useLocalSearchParams: () => mockParametry }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: {} }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;

/** Aplikacja z prawdziwą bazą i archiwum (Node SQLite, dysk); `kopiePrzed` pozwala podać katalog kopii, którego nie da się zapisać. */
async function aplikacja(kopiePrzed?: (katalog: string) => string, aktywne: unknown = null) {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('stary', 'Stary sweter')]);
  const katalogi = kopiePrzed ? { ...s.z.katalogi, kopiePrzed: kopiePrzed(s.katalog) } : s.z.katalogi;
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  const licznik = { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) };
  const kontener = {
    z: { ...s.z, katalogi, archiwum, czasWTle }, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog,
    dostep: { stan: () => ({ aktywne, pro: aktywne !== null }), naZmiane: () => () => undefined },
  };
  mockAplikacja = { kontener, licznik, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() } };
  mockParametry.import = archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka')]);
  return { s, licznik };
}
const nazwyProjektow = async (s: Awaited<ReturnType<typeof aplikacja>>['s']) => (await s.baza.all('SELECT nazwa FROM projekt ORDER BY nazwa')).map((r) => (r as { nazwa: string }).nazwa);

test('K-03c: „Replace” przez trasę → ekran „Data replaced” z nazwą kopii oczko-przed-importem-….oczko, bez „Merged”; kopia leży w katalogu kopii przed importem', async () => {
  const { s } = await aplikacja();
  render(<EkranUstawien />);
  await waitFor(() => expect(screen.getByTestId('import-gotowy')).toBeTruthy());
  await userEvent.press(przycisk('Replace what’s here'));
  const wynik = await screen.findByTestId('import-wynik');
  expect(screen.getByText('Data replaced')).toBeTruthy();
  expect(wynik.props.children).toEqual(expect.stringContaining('oczko-przed-importem-2026-10-22.oczko'));
  expect(screen.getByText('To go back, open that file in Oczko and choose Replace.')).toBeTruthy();
  expect(screen.queryByText(/^Merged/)).toBeNull();
  expect(readdirSync(s.z.katalogi.kopiePrzed)).toEqual(['oczko-przed-importem-2026-10-22.oczko']);
  expect(await nazwyProjektow(s)).toEqual(['Czapka']);
});

test('K-03c: „Merge” przez trasę → „Merged…”, bez kopii przed importem', async () => {
  const { s } = await aplikacja();
  render(<EkranUstawien />);
  await waitFor(() => expect(screen.getByTestId('import-gotowy')).toBeTruthy());
  await userEvent.press(przycisk('Merge with what’s here'));
  expect((await screen.findByTestId('import-wynik')).props.children).toEqual(expect.stringMatching(/^Merged\./));
  expect(readdirSync(s.z.katalogi.kopiePrzed)).toEqual([]);
  expect(await nazwyProjektow(s)).toEqual(['Czapka', 'Stary sweter']);
});

test('K-03d: nie da się zapisać kopii → „Replace” przez trasę pokazuje błąd (nie „Merged”, nie „Data replaced”), dane bez zmian', async () => {
  const { s } = await aplikacja((katalog) => { const plik = join(katalog, 'plik-zamiast-katalogu'); writeFileSync(plik, 'x'); return join(plik, 'Backup'); });
  const przed = await licznosci(s.baza);
  render(<EkranUstawien />);
  await waitFor(() => expect(screen.getByTestId('import-gotowy')).toBeTruthy());
  await userEvent.press(przycisk('Replace what’s here'));
  expect(await screen.findByText('That didn’t work. Your data is unchanged.')).toBeTruthy();
  expect(screen.queryByText('Data replaced')).toBeNull();
  expect(screen.queryByText(/^Merged/)).toBeNull();
  expect(await licznosci(s.baza)).toEqual(przed);
  expect(await nazwyProjektow(s)).toEqual(['Stary sweter']);
});

test('07-jakosc-031 F-63: wiersz „Oczko Pro” pokazuje stan „On” przy aktywnym Pro; bez Pro — bez zmian (licznik darmowych dni, bez „On”)', async () => {
  await aplikacja(undefined, { rodzaj: 'dozywotni' });
  mockParametry.import = undefined;
  const w = render(<EkranUstawien />);
  expect(await screen.findByTestId('ustawienia-pro')).toHaveTextContent('On');
  expect(screen.getByRole('button', { name: 'Oczko Pro, On' })).toBeTruthy(); // VoiceOver czyta etykietę i wartość
  w.unmount();
  await aplikacja();
  mockParametry.import = undefined;
  render(<EkranUstawien />);
  expect(await screen.findByTestId('ustawienia-dni-darmowe')).toBeTruthy();
  expect(screen.queryByTestId('ustawienia-pro')).toBeNull();
});

test('07-jakosc-031 F-32: obcy plik zamiast archiwum → alert „not recognized” (nie ogólny błąd), dane nietknięte, bez pytania o tryb', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { s } = await aplikacja();
  const obcy = join(s.katalog, 'zdjecie.oczko');
  writeFileSync(obcy, 'to nie jest archiwum Oczka');
  mockParametry.import = obcy;
  const przed = await licznosci(s.baza);
  render(<EkranUstawien />);
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(alert.mock.calls[0].slice(0, 2)).toEqual(['Oczko doesn’t recognize this file', 'Choose a file exported from Oczko. Nothing was changed.']);
  expect(screen.queryByText('That didn’t work. Your data is unchanged.')).toBeNull();
  expect(screen.queryByTestId('import-gotowy')).toBeNull();
  expect(await licznosci(s.baza)).toEqual(przed);
});
