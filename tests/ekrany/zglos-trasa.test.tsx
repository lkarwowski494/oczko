// Trasa „/zglos” (app/zglos.tsx) przez ekran (07-jakosc-032). 07-jakosc-013 (BR-DAN-010/S1, BR-DAN-011): diagnostyka pokazuje stan zegarka —
// czas ostatniego kontaktu (`zegarek_ostatnia_partia_ms`, UTC) albo „brak”, gdy zegarek nigdy nie przysłał partii.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { zegarekOstatniaPartiaMs } from '../../src/dane/repozytoria/ustawienia';
import { przygotuj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const mockRouter = { back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: { udostepnij: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0', ios: { buildNumber: '2001' } }, platform: { ios: { model: 'iPhone17,3' } }, deviceName: 'x' } }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranZgloszenia = (require('../../app/zglos') as { default: React.ComponentType }).default;

async function aplikacja(ostatniaPartiaMs?: number, synchronizacja?: string) {
  const t = await tEn();
  const s = await przygotuj();
  if (ostatniaPartiaMs !== undefined) await s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('zegarek_ostatnia_partia_ms', ?, 1)", [String(ostatniaPartiaMs)]);
  expect(await zegarekOstatniaPartiaMs(s.baza)).toBe(ostatniaPartiaMs ?? null); // dane wejściowe testu są w bazie tak, jak czyta je kod
  mockAplikacja = { kontener: { z: synchronizacja ? { ...s.z, synchronizacja: { stan: () => synchronizacja } } : s.z, j: { t, jezyk: () => 'en' } }, licznik: {}, preferencje: {} };
}
const wiersz = async () => (await screen.findByText(/Watch/i, { exact: false }));

test('013: zegarek z kontaktem → w diagnostyce znacznik czasu ostatniej partii (ISO, UTC)', async () => {
  await aplikacja(Date.UTC(2026, 10, 1, 10, 30));
  render(<EkranZgloszenia />);
  await wiersz();
  expect(screen.getByText('Watch: last contact 2026-11-01T10:30:00Z')).toBeTruthy(); // 033-T2: znacznik techniczny po angielsku, ten sam w podglądzie i w wysyłanym pliku
});
test('013 / 033-T2 (P-383 B): zegarek bez kontaktu → w diagnostyce znacznik „none”, a nie myślnik ani polskie „brak”', async () => {
  await aplikacja();
  render(<EkranZgloszenia />);
  await wiersz();
  expect(screen.queryByText(/Watch\W+—/)).toBeNull();
  expect(screen.getAllByText(/Watch/i).some((e) => /Watch: none$/.test(String(e.props.children)))).toBe(true);
  expect(screen.queryByText(/brak/)).toBeNull();
});

test('033-T2 (P-383 B): synchronizacja — brak silnika → „off”, stany domeny → znaczniki angielskie (bez polskiego „wylaczona”)', async () => {
  await aplikacja();
  render(<EkranZgloszenia />);
  expect(await screen.findByText('Sync: off')).toBeTruthy();
  expect(screen.queryByText(/wylaczona/)).toBeNull();
});
test.each([['aktywna', 'on'], ['blad', 'error'], ['brak_konta', 'no_account'], ['konto_zmienione', 'account_changed'], ['wylaczona', 'off']])('033-T2: stan synchronizacji %s → „Sync: %s”', async (stan, znacznik) => {
  await aplikacja(undefined, stan);
  render(<EkranZgloszenia />);
  expect(await screen.findByText(`Sync: ${znacznik}`)).toBeTruthy();
});
