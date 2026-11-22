// M1-audytor-generalny-060 (GEN-02, SP-11, LOK-11; design-spec 012 opcja a — jedno słowo neutralne „device”): aplikacja działa na iPadzie (app.json
// `supportsTablet`), więc „Data and sync” i „Report a problem” nie mogą mówić, że dane są „on this iPhone”. Trasy `/stan-danych` i `/zglos` z udawanym iPadem.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { Platform } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { przygotuj } from '../dane/pomocnicze/srodowisko';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/system', () => ({ otworzUstawieniaSystemu: jest.fn(), systemAplikacji: { udostepnij: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0', ios: { buildNumber: '2001' } }, platform: { ios: { model: 'iPad16,3' } }, deviceName: 'x' } }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranStanuDanych = (require('../../app/stan-danych') as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranZgloszenia = (require('../../app/zglos') as { default: React.ComponentType }).default;

const EN = JSON.parse(readFileSync(join(__dirname, '../../src/i18n/slowniki/en.json'), 'utf8')) as Record<string, Record<string, string>>;
const MODEL = /iPhon|iPad/; // M1-audytor-generalny-155: rdzeń „iPhon” łapie odmianę („na tym iPhonie”, „iPhone’a”)

beforeEach(() => {
  jest.spyOn(Platform as { isPad: boolean }, 'isPad', 'get').mockReturnValue(true); // iOS: typ Platform bez isPad w unii
});
afterEach(() => jest.restoreAllMocks());

async function aplikacja(icloud: boolean) {
  const t = await tEn();
  const s = await przygotuj();
  const sterownik = { widok: () => ({ stan: 'aktywna', przyczyna: null, status: null }), obserwuj: () => () => undefined };
  mockAplikacja = {
    kontener: { z: s.z, j: { t, jezyk: () => 'en', zegar24h: () => true }, icloud: { sterownik, widoczny: icloud, e2e: null, naPartie: () => () => undefined } },
    licznik: { otworz: jest.fn() }, preferencje: {},
  };
}

test('słownik en: `stan_danych.zapisane` i `zglos.opis` bez nazwy modelu urządzenia', () => {
  expect(EN.stan_danych?.zapisane).not.toMatch(MODEL);
  expect(EN.zglos?.opis).not.toMatch(MODEL);
  expect(EN.stan_danych?.zapisane).toMatch(/this device/);
  expect(EN.zglos?.opis).toMatch(/your device/);
});
test.each(['pl-PL', 'de-DE', 'ja-JP'])('%s: stary przekład z „iPhone” nie wraca — do fali 09 tekst z en (klucze na liście oczekujących)', async (jezyk) => {
  const { t } = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => [jezyk], zasoby: ZASOBY });
  expect(t('stan_danych.zapisane')).not.toMatch(MODEL);
  expect(t('zglos.opis')).not.toMatch(MODEL);
});
test.each([false, true])('iPad, /stan-danych (iCloud widoczny: %s): zdanie o miejscu zapisu bez „iPhone”', async (icloud) => {
  await aplikacja(icloud);
  render(<EkranStanuDanych />);
  expect(await screen.findByText(/^Everything is saved on this /)).toBeTruthy();
  expect(screen.queryByText(/on this iPhone/)).toBeNull();
});
test('iPad, /zglos: opis zgłoszenia bez „iPhone”', async () => {
  await aplikacja(false);
  render(<EkranZgloszenia />);
  expect(await screen.findByText(/^This is everything the report contains\./)).toBeTruthy();
  expect(screen.queryByText(/leaves your iPhone/)).toBeNull();
});
