// E2-137-A3 (scen. 08): po „Delete all data” import nie dawał `import-gotowy` w 30 s i nie zgłaszał błędu. Przyczyna nieustalona (kolejka bazy po kopii i usunięciu
// nie wisi na Linuksie: tests/dane/usun-wszystko-import-kolejka.test.ts), więc zmiana tylko tyle, ile dowodzi objaw „bez żadnego stanu”:
// (1) wyjątek spoza `Wynik` w imporcie daje komunikat „That didn’t work”, nie odrzuconą obietnicę i ekran bez stanu;
// (2) panel `e2e-pomiar-operacji` pokazuje „import N ms” do chwili `import-gotowy` albo „import running”, gdy nic nie wraca.
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie ekranu (require niżej, po ustawieniu)
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { archiwumWzorcowe, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { czasWTle, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { zerujPomiarOperacji } = require('../../src/kompozycja/e2e/pomiar-operacji') as typeof import('../../src/kompozycja/e2e/pomiar-operacji');

async function aplikacja(sprawdz?: () => Promise<never>) {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('stary', 'Stary sweter')]);
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  const kontener = {
    z: { ...s.z, archiwum: sprawdz ? { ...archiwum, sprawdz } : archiwum, czasWTle }, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog,
    dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined },
  };
  mockAplikacja = { kontener, licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() } };
  mockParametry.import = archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka')]);
}
const panel = () => screen.queryByTestId('e2e-pomiar-operacji')?.props.children as string | undefined;
beforeEach(() => zerujPomiarOperacji());

test('A3: wyjątek w sprawdzaniu archiwum (nie `Wynik`) → komunikat „That didn’t work. Your data is unchanged.”, panel „import N ms (error)”', async () => {
  await aplikacja(async () => { throw new Error('czas w tle: natywny start nie odpowiedział'); });
  render(<EkranUstawien />);
  expect(await screen.findByText('That didn’t work. Your data is unchanged.')).toBeTruthy();
  expect(screen.queryByTestId('import-gotowy')).toBeNull();
  expect(panel()).toMatch(/^import \d+ ms \(error\)$/);
});
test('A3: zwykły import → `import-gotowy` i panel „import N ms” (czas do wyboru, nie do końca importu)', async () => {
  await aplikacja();
  render(<EkranUstawien />);
  await waitFor(() => expect(screen.getByTestId('import-gotowy')).toBeTruthy());
  expect(panel()).toMatch(/^import \d+ ms$/);
});
test('A3: sprawdzanie wisi (odpowiedź nie wraca) → panel „import running”, bez komunikatu i bez `import-gotowy` — odróżnialne od wolnej maszyny', async () => {
  await aplikacja(() => new Promise<never>(() => undefined));
  render(<EkranUstawien />);
  await waitFor(() => expect(panel()).toBe('import running'));
  expect(screen.queryByTestId('import-gotowy')).toBeNull();
  expect(screen.queryByText('That didn’t work. Your data is unchanged.')).toBeNull();
});
