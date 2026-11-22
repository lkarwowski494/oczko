// PU-310 („Historia”, poprzedni miesiąc): trasa „/dni” na prawdziwej bazie z danymi z dwóch miesięcy.
// Poziom: komponentowy (trasa + prawdziwe zapytania), bez symulatora; wzór: tests/ekrany/historia-ukonczenia.test.tsx.
import React from 'react';
import * as RN from 'react-native';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { GODZ, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { kolorJasny } from '../../src/ekrany/motyw';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mockAplikacja: { kontener?: unknown } = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => ({ push: jest.fn(), back: jest.fn() }), useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranDni = (require('../../app/(zakladki)/dni') as { default: React.ComponentType }).default;

const tlo = (dzien: string) => RN.StyleSheet.flatten(screen.getByTestId(`historia-dzien-${dzien}`).findAll((n) => typeof n.type === 'string' && n.props.style && RN.StyleSheet.flatten(n.props.style as RN.ViewStyle).borderWidth !== undefined)[0]!.props.style as RN.ViewStyle).backgroundColor;
const WRZESIEN = Date.UTC(2026, 8, 10, 10); // 2026-09-10 12:00 Europe/Warsaw

// PU-310: „Previous month” pokazuje wrzesień (nagłówek, dzień z pracą 10.09, kafle 5 rzędów / 1 dzień), „Next month” wraca do października (2 rzędy).
test('PU-310: „Previous month” → wrzesień z oznaczonym dniem pracy i kaflami za wrzesień; „Next month” wraca do października', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [
    projekt('p1', 'Sweter', WRZESIEN), czesc('c1', 'p1', 'Back', 1),
    ...licznik('wrz', 'c1', 5, { t: WRZESIEN }), ...licznik('paz', 'c1', 2, { t: T0, kolejnosc: 2 }),
  ]);
  s.zegar.ustaw(T0 + GODZ);
  const j: Jezyk = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false };
  mockAplikacja.kontener = { z: s.z, j };
  render(<EkranDni />);
  await screen.findByText('October 2026');
  const rzedyPaz = within(screen.getByTestId('historia-kafel-rzedy')).getByText('2');
  expect(rzedyPaz).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
  await screen.findByText('September 2026');
  expect(screen.queryByText('October 2026')).toBeNull();
  expect(tlo('2026-09-10')).toBe(kolorJasny.akcent); // dzień z pracą jest oznaczony
  expect(tlo('2026-09-11')).toBe(kolorJasny.dzienPusty);
  expect(screen.getByTestId('historia-kafel-dni').props.accessibilityLabel).toBe('1 crafting day');
  expect(screen.getByTestId('historia-kafel-rzedy').props.accessibilityLabel).toBe('5 rows');

  fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
  await screen.findByText('October 2026');
  await waitFor(() => expect(screen.getByTestId('historia-kafel-rzedy').props.accessibilityLabel).toBe('2 rows'));
  expect(tlo('2026-10-22')).toBe(kolorJasny.akcent);
});
