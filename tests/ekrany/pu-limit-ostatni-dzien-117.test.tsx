// PU-117 („Limit i zakup”): piąty dzień robótkowy → cicha linia „1 free crafting day left in …” na liczniku; przy limicie eksport w Ustawieniach działa.
// Poziom: komponentowy — prawdziwa baza (dni limitu), kompozycja licznika i ekran licznika; eksport przez prawdziwą trasę „/ustawienia” i archiwum.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { Licznik } from '../../src/ekrany/Licznik';
import { dzienLimitu, licznik, czesc, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { DOBA, czasWTle, T0, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, wywolaniaLicznika } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []), useLocalSearchParams: () => ({}) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: {} }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(async () => undefined), wybierzArchiwum: jest.fn() }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;

// PU-117: 4 użyte dni limitu → na liczniku „1 free crafting day left in October”; po piątym (limit) „Export all data” w Ustawieniach pokazuje liczności eksportu.
test('PU-117: piąty dzień → „1 free crafting day left in October” na liczniku; przy limicie eksport w Ustawieniach działa', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  const dni = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((d, i) => dzienLimitu(d, `l1-z${i + 1}`));
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5, { t: T0 - 3 * DOBA }), ...dni]);
  await k.otworz('l1');
  const start = await k.uslugi.start();
  expect(start.licznik.limit).toEqual({ rodzaj: 'ostatni-darmowy' });
  const r = render(<Licznik stan={start.licznik} t={j.t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.getByText('1 free crafting day left in October')).toBeTruthy();
  expect(screen.getByRole('button', { name: /^\+1 row/ })).toBeTruthy();
  r.unmount();

  await wykonaj(s.baza, [dzienLimitu('2026-10-05', 'l1-z5')]); // piąty dzień użyty: limit
  expect((await k.uslugi.start()).licznik.limit).toEqual({ rodzaj: 'zawczasu' });
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  mockAplikacja = {
    kontener: { z: { ...s.z, archiwum, czasWTle }, j: { ...j, preferencja: () => 'auto' as const }, icloud: null, katalogDanych: s.katalog, dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined } },
    licznik: k, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };
  render(<EkranUstawien />);
  fireEvent.press(await screen.findByTestId('ustawienia-eksport'));
  await waitFor(() => expect(screen.getByTestId('eksport-licznosci')).toBeTruthy());
  expect(screen.getByTestId('eksport-licznosci')).toHaveTextContent(/1 project/);
});
