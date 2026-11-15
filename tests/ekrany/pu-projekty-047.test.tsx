// PU-047 (katalog przypadków użycia, „Projekt i części”): trasa „/projekty” (app/(zakladki)/projekty.tsx) na prawdziwej bazie (node:sqlite) i prawdziwym t() en:
// sekcja „In progress” według ostatniej pracy, wyszukiwanie „Sweater” zostawia oba projekty „Sweater…”.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn, tekst } from './pomoc';

const mockAplikacja: { kontener?: unknown; licznik?: unknown } = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => true }) /* navigate: zakładka → /licznik (M3 p2) */, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektow = (require('../../app/(zakladki)/projekty') as { default: React.ComponentType }).default;

async function otworz(instrukcje: Parameters<typeof wykonaj>[1], teraz = T0 + 60 * DOBA) {
  const s = await przygotuj();
  await wykonaj(s.baza, instrukcje);
  s.zegar.ustaw(teraz);
  const t = await tEn();
  const j: Jezyk = { t, jezyk: () => 'en-US', zegar24h: () => false };
  const otworzLicznik = jest.fn(async () => undefined);
  mockAplikacja.kontener = { z: s.z, j, wzor: { k: {} }, dostep: { stan: () => ({ poziom: 'darmowy' }) } }; // dostep: okno „Uczciwe zasady” na liście projektów (07-jakosc-022, partia 8b)
  mockAplikacja.licznik = { otworz: otworzLicznik };
  render(<EkranProjektow />);
  await waitFor(() => expect(screen.getByTestId('projekty-lista')).toBeTruthy());
  return { otworzLicznik };
}


const nazwy = () => screen.getAllByTestId('projekty-wiersz').map((w) => tekst(w));

test('PU-047: sekcja „In progress” w kolejności ostatniej pracy; wyszukiwanie „Sweater” pokazuje oba projekty „Sweater…”, a „Mittens” znika', async () => {
  await otworz([
    projekt('p1', 'Sweater Harbor', T0 - 3 * DOBA), czesc('c1', 'p1', 'Body', 1), ...licznik('l1', 'c1', 3, { t: T0 - 3 * DOBA }), // najdawniej
    projekt('p2', 'Mittens', T0 - 2 * DOBA), czesc('c2', 'p2', 'Cuff', 1), ...licznik('l2', 'c2', 3, { t: T0 - 2 * DOBA }),
    projekt('p3', 'Sweater Cable', T0 - DOBA), czesc('c3', 'p3', 'Body', 1), ...licznik('l3', 'c3', 3, { t: T0 - DOBA }), // najświeżej
  ]);
  expect(screen.getByText('In progress')).toBeTruthy();
  const przed = nazwy();
  expect(przed).toHaveLength(3);
  expect(przed.map((n) => /Sweater Cable|Mittens|Sweater Harbor/.exec(n)?.[0])).toEqual(['Sweater Cable', 'Mittens', 'Sweater Harbor']); // według ostatniej pracy

  fireEvent.changeText(screen.getByPlaceholderText('Search'), 'Sweater');
  await waitFor(() => expect(screen.getAllByTestId('projekty-wiersz')).toHaveLength(2));
  const po = nazwy();
  expect(po.map((n) => /Sweater Cable|Sweater Harbor/.exec(n)?.[0])).toEqual(['Sweater Cable', 'Sweater Harbor']);
  expect(screen.queryByText('Mittens')).toBeNull();
});
