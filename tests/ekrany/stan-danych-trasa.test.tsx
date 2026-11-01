// Trasa „/stan-danych” (app/stan-danych.tsx) przez ekran (07-jakosc-032). 07-jakosc-019 (BR-DAN-002, P-220 I1a): wiersz „N counters have two versions”
// prowadzi do wyboru wersji — otwiera licznik w konflikcie i przechodzi na /konflikt (ekran wyboru działa na bieżącym liczniku).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { licznikiWKonflikcie } from '../../src/dane/repozytoria/icloud';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/system', () => ({ otworzUstawieniaSystemu: jest.fn() }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranStanuDanych = (require('../../app/stan-danych') as { default: React.ComponentType }).default;

async function aplikacja() {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p', 'Czapka'), czesc('c', 'p', 'Główka'), ...licznik('l-ok', 'c', 2), ['UPDATE synchronizacja SET wlaczona = 1 WHERE id = 1', []]]);
  await wykonaj(s.baza, [['INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, 2, 1)', ['c2', 'p', 'Rondo']],
    ['INSERT INTO licznik (id, czesc_id, kolejnosc, zmieniono_ms, konflikt) VALUES (?, ?, 1, 1, 1)', ['l-konflikt', 'c2']]]);
  const otworz = jest.fn(async () => undefined);
  const sterownik = { widok: () => ({ stan: 'aktywna', przyczyna: null, status: null }), obserwuj: () => () => undefined };
  mockAplikacja = {
    kontener: { z: s.z, j: { t, jezyk: () => 'en', zegar24h: () => true }, icloud: { sterownik, widoczny: true, e2e: null, naPartie: () => () => undefined } },
    licznik: { otworz }, preferencje: {},
  };
  return { s, otworz };
}

test('019: „1 counter has two versions” prowadzi do wyboru — otwiera licznik w konflikcie i przechodzi na /konflikt', async () => {
  const { s, otworz } = await aplikacja();
  expect(await licznikiWKonflikcie(s.baza)).toBe(1);
  render(<EkranStanuDanych />);
  const wiersz = await screen.findByRole('button', { name: /two versions/ });
  await userEvent.press(wiersz);
  await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/konflikt'));
  expect(otworz).toHaveBeenCalledWith('l-konflikt');
});

test('015: „Last synced …” pokazuje zapisany czas ostatniej udanej synchronizacji (nie stałą wartość); bez zapisu — bez wiersza', async () => {
  const { s } = await aplikacja();
  const w = render(<EkranStanuDanych />);
  await screen.findByRole('button', { name: /two versions/ });
  expect(screen.queryByText(/Last synced/)).toBeNull();
  w.unmount();
  await s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('icloud_ostatnia_udana_ms', ?, 1)", [String(Date.UTC(2026, 9, 22, 8, 5))]);
  render(<EkranStanuDanych />);
  expect(await screen.findByText('Last synced Oct 22, 10:05')).toBeTruthy(); // Europe/Warsaw, zegar 24 h
});

// P-339 (N-05-2, ADR-0028; design-spec „Kopia w Data and sync”, makieta fix10 `stan-danych-kopie`): cichy podpis `stan_danych.kopie_opis` tylko gdy w Documents/Backup są kopie Oczka.
describe('P-339: podpis o kopiach w „Data and sync”', () => {
  const tekstKopii = async () => (await tEn())('stan_danych.kopie_opis');
  const kopia = (s: Awaited<ReturnType<typeof aplikacja>>['s'], nazwa: string) => writeFileSync(join(s.z.katalogi.kopiePrzed, nazwa), 'x');

  test('bez kopii w Documents/Backup — bez podpisu (zasada 18: żadnego pustego pouczenia)', async () => {
    await aplikacja();
    render(<EkranStanuDanych />);
    await screen.findByRole('button', { name: /two versions/ });
    expect(screen.queryByTestId('stan-danych-kopie')).toBeNull();
    expect(screen.queryByText(await tekstKopii())).toBeNull();
  });
  test('obcy plik w Documents/Backup nie jest kopią Oczka — bez podpisu', async () => {
    const { s } = await aplikacja();
    kopia(s, 'notatki.txt');
    render(<EkranStanuDanych />);
    await screen.findByRole('button', { name: /two versions/ });
    expect(screen.queryByTestId('stan-danych-kopie')).toBeNull();
  });
  test('kopia przed importem w Documents/Backup — podpis z klucza stan_danych.kopie_opis', async () => {
    const { s } = await aplikacja();
    kopia(s, 'oczko-przed-importem-2026-10-30.oczko');
    render(<EkranStanuDanych />);
    expect(await screen.findByText(await tekstKopii())).toBeTruthy();
    expect(screen.getByTestId('stan-danych-kopie')).toBeTruthy();
  });
  test('kopia przed usunięciem, iCloud ukryty (ZM-06) — podpis też jest (kopie są na urządzeniu niezależnie od iCloud)', async () => {
    const { s } = await aplikacja();
    (mockAplikacja as { kontener: { icloud?: unknown } }).kontener.icloud = undefined;
    kopia(s, 'oczko-przed-usunieciem-2026-10-30.oczko');
    render(<EkranStanuDanych />);
    expect(await screen.findByText(await tekstKopii())).toBeTruthy();
  });
});
