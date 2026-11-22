// M1-audytor-generalny-240 (02-monetyzacja-701, P-627): dane „Dziś” spoza stanu licznika (pas „dziś” `rzedyDzis`, „Ten tydzień”) po powrocie z licznika.
// +1 na ekranie licznika nie podnosi `wersja` i nie przechodzi przez „+1” karty, więc trasa „/” musi przeczytać dane ponownie przy fokusie (`useFocusEffect`).
// Trasa app/(zakladki)/index.tsx na prawdziwej bazie (node:sqlite); `Aplikacja` zastąpiona sondą, która zapisuje ostatnie `dane`.
// `useFocusEffect` z atrapy zapamiętuje wywołanie zwrotne — test woła je jak nawigacja przy powrocie na zakładkę.
import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import type { DaneDzis } from '../../src/ekrany/Dzis';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => false, back: jest.fn() };
const mockFokus: { f: (() => void) | null } = { f: null };
jest.mock('expo-router', () => ({
  usePathname: () => '/', useRouter: () => mockRouter,
  useIsFocused: () => true,
  useFocusEffect: (f: () => void) => { // eslint-disable-next-line @typescript-eslint/no-require-imports
    const R = require('react') as typeof React;
    mockFokus.f = f;
    R.useEffect(f, []); // eslint-disable-line react-hooks/exhaustive-deps
  },
}));
const mockDane: { v: DaneDzis | null | undefined } = { v: undefined };
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: (p: { dane?: DaneDzis | null }) => { mockDane.v = p.dane; return null; } }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Dzis = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;

test('240: +1 na liczniku, potem powrót na „Dziś” (fokus) → rzedyDzis i dzień dzisiejszy w „Ten tydzień” odświeżone', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 0)]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, naAwarie: jest.fn() };
  render(<Dzis />);
  await waitFor(() => expect(mockDane.v?.rzedyDzis).toBe(0));
  expect(mockDane.v?.tydzien.find((d) => d.dzis)?.dziergany).toBe(false);
  await act(async () => { expect((await k.uslugi.dodajRzad()).ok).toBe(true); }); // +1 na ekranie licznika („Dziś” pod spodem w stosie)
  await act(async () => { mockFokus.f?.(); }); // powrót: „Dziś” znów w fokusie
  await waitFor(() => expect(mockDane.v?.rzedyDzis).toBe(1), { timeout: 3000 });
  expect(mockDane.v?.tydzien.find((d) => d.dzis)?.dziergany).toBe(true);
});
