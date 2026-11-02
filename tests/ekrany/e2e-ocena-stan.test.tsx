// 033-T1 (07-jakosc-033 B, F-64, lista dla 08 #4): hak E2E `e2e-ocena-stan` — w buildzie `EXPO_PUBLIC_E2E=1` panel w Ustawieniach pokazuje liczbę wywołań prośby o ocenę
// (`portOceny.popros`, tak jak woła ją `app/ukonczenie.tsx`) i ostatni adres otwarty przez `systemAplikacji.otworzAdres` (tak jak wiersz „Rate Oczko”), jak `e2e-pliki-stan`.
// Bez haka scenariusz 65 nie odróżnia „prośby nie było” od „bramka ją zablokowała” ani zaślepki adresu od właściwego. Poza buildem E2E panelu nie ma (P-238).
// Zachowanie wywołań bez zmian: panel tylko liczy i przepuszcza. P-377: panel jest na trasie „/ustawienia” z `app/`; liczenie sprawdza prawdziwy moduł systemu (granica: Linking, StoreReview).
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie (require niżej, po ustawieniu)
import React from 'react';
import { Linking } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { czasWTle, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []), useLocalSearchParams: () => ({}) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('expo-store-review', () => ({ isAvailableAsync: jest.fn(async () => true), requestReview: jest.fn(async () => undefined) }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({
  udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn(),
  portOcenySklepu: { dostepna: async () => true, wersja: () => '1.0.0', popros: async () => undefined },
}));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));

/* eslint-disable @typescript-eslint/no-require-imports */
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;
const { systemAplikacji, portOceny } = require('../../src/kompozycja/system') as typeof import('../../src/kompozycja/system');
/* eslint-enable @typescript-eslint/no-require-imports */

async function ustawienia() {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('stary', 'Stary sweter')]);
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  mockAplikacja = {
    kontener: { z: { ...s.z, archiwum, czasWTle }, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog, dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined } },
    licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };
  render(<EkranUstawien />);
  return screen.findByTestId('e2e-ocena-stan');
}
const tekstPanelu = (el: { props: { children?: unknown } }) => String(el.props.children);

test('033-T1 hak F-64: panel w Ustawieniach zaczyna od „rating requests: 0 · last address: none”', async () => {
  const panel = await ustawienia();
  expect(tekstPanelu(panel)).toBe('rating requests: 0 · last address: none');
});
test('033-T1 hak F-64: wywołanie prośby o ocenę zwiększa licznik, a otwarcie adresu zapisuje ostatni adres; oba wywołania idą dalej do systemu', async () => {
  const otworz = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const panel = await ustawienia();
  await act(async () => { await portOceny.popros(); await portOceny.popros(); });
  expect(tekstPanelu(panel)).toBe('rating requests: 2 · last address: none');
  act(() => { systemAplikacji.otworzAdres('https://apps.apple.com/app/id1234567890?action=write-review'); });
  expect(tekstPanelu(panel)).toBe('rating requests: 2 · last address: https://apps.apple.com/app/id1234567890?action=write-review');
  expect(otworz).toHaveBeenCalledWith('https://apps.apple.com/app/id1234567890?action=write-review');
});
