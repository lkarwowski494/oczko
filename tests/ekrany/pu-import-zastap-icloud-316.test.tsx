// PU-316 („Dane i ustawienia”): „Replace” przy włączonym iCloud → najpierw alert „Turn off iCloud sync first”, dane bez zmian, „Go to Data and sync” prowadzi na ekran danych;
// po wyłączeniu synchronizacji „Replace” działa. Poziom: komponentowy — trasa „/ustawienia” na prawdziwej bazie i prawdziwym imporcie (harness jak ustawienia-import-wyjatek.test.tsx).
import React from 'react';
import { Alert } from 'react-native';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react-native';
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

// PU-316: iCloud włączony → „Replace” = alert „Turn off iCloud sync first” bez zmiany danych; „Go to Data and sync” → /stan-danych; po wyłączeniu iCloud „Replace” podmienia dane („dane-zastapiono”).
test('PU-316: „Replace” przy włączonym iCloud → alert „Turn off iCloud sync first”, dane bez zmian; po wyłączeniu „Replace” działa', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('stary', 'Stary sweter')]);
  await s.baza.run('UPDATE synchronizacja SET wlaczona = 1 WHERE id = 1');
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  mockAplikacja = {
    kontener: { z: { ...s.z, archiwum, czasWTle }, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: {}, katalogDanych: s.katalog, dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined } },
    licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };
  const projekty = async () => (await s.baza.all<{ nazwa: string }>('SELECT nazwa FROM projekt')).map((p) => p.nazwa);
  mockParametry.import = archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka')]);

  const pierwszy = render(<EkranUstawien />);
  await waitFor(() => expect(screen.getByTestId('import-zastap')).toBeTruthy());
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); }); // odczyt stanu synchronizacji kończy się przed stuknięciem
  fireEvent.press(screen.getByTestId('import-zastap'));
  expect(alert).toHaveBeenCalledTimes(1);
  const [tytul, , przyciski] = alert.mock.calls[0]!;
  expect(tytul).toBe('Turn off iCloud sync first');
  expect(await projekty()).toEqual(['Stary sweter']); // dane bez zmian
  expect(screen.queryByTestId('dane-zastapiono')).toBeNull();
  await act(async () => { przyciski?.find((p) => p.text === 'Go to Data and sync')?.onPress?.(); });
  expect(mockRouter.push).toHaveBeenCalledWith('/stan-danych');
  expect(screen.queryByTestId('import-zastap')).toBeNull(); // arkusz importu zamknięty
  pierwszy.unmount();

  // użytkownik wyłączył synchronizację na ekranie danych i importuje ponownie
  await s.baza.run('UPDATE synchronizacja SET wlaczona = 0 WHERE id = 1');
  alert.mockClear();
  s.zegar.przesun(1000); // katalog rozpakowania „import-<ms>” po „anuluj” zostaje do sprzątania: drugi import musi mieć inny znacznik czasu
  mockParametry.import = archiwumWzorcowe(s.katalog, 'czapka-2', [projekt('cz', 'Czapka')]);
  render(<EkranUstawien />);
  await waitFor(() => expect(screen.getByTestId('import-zastap')).toBeTruthy());
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  fireEvent.press(screen.getByTestId('import-zastap'));
  await waitFor(() => expect(screen.getByTestId('dane-zastapiono')).toBeTruthy());
  expect(alert).not.toHaveBeenCalled();
  expect(await projekty()).toEqual(['Czapka']);
  alert.mockRestore();
});
