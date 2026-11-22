// PU-318 („Dane i ustawienia”): po „Replace” w imporcie „Data and sync” mówi, gdzie leży kopia sprzed importu („Files app … Oczko › Backup … 30 days”); bez kopii linii nie ma.
// Poziom: komponentowy — prawdziwy import „zastąp” (kopia na dysku) i trasa „/stan-danych” na tej samej bazie.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { importuj } from '../../src/przypadki-uzycia/archiwum';
import { archiwumWzorcowe, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { czasWTle, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
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

// PU-318: przed importem „Data and sync” nie ma linii o kopiach; po „Replace” (prawdziwa kopia przed importem) jest z „Files app”, „Oczko › Backup” i „30 days”.
test('PU-318: przed importem brak linii o kopiach; po „Replace” linia wskazuje Pliki › Oczko › Backup i 30 dni', async () => {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('stary', 'Stary sweter')]);
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  mockAplikacja = { kontener: { z: s.z, j: { t, jezyk: () => 'en', zegar24h: () => true } }, licznik: { otworz: jest.fn() }, preferencje: {} };

  const przed = render(<EkranStanuDanych />);
  await screen.findByText('Everything is saved on this device.');
  expect(screen.queryByTestId('stan-danych-kopie')).toBeNull();
  przed.unmount();

  const sciezka = archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka')]);
  const w = await importuj({ ...s.z, archiwum, czasWTle }, { sciezka, wybierz: async () => 'zastap' });
  expect(w).toMatchObject({ ok: true, wartosc: { tryb: 'zastap' } });

  render(<EkranStanuDanych />);
  const linia = await screen.findByTestId('stan-danych-kopie');
  const tekst = (linia.children as string[]).join('');
  expect(tekst).toContain('Files app');
  expect(tekst).toContain('Oczko › Backup');
  expect(tekst).toContain('30 days');
  expect(tekst).toMatch(/^Copies Oczko saved before importing or deleting/);
});
