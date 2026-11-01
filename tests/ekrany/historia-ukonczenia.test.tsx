// 07-jakosc-018 (F-51, F-59; BR-PRJ-013 „lista ukończonych i kalendarz pokazują ukończenie tego dnia”): trasa „/dni” (app/dni.tsx) na prawdziwej bazie —
// dzień, w którym ukończono projekt, pokazuje „Finished: {nazwa}”; dzień bez pracy i bez ukończeń zostaje „pusty”. Zastępuje test martwego komponentu `Dni.tsx`.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { GODZ, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
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
const EkranDni = (require('../../app/dni') as { default: React.ComponentType }).default;

async function otworz(instrukcje: Parameters<typeof wykonaj>[1], teraz: number) {
  const s = await przygotuj();
  await wykonaj(s.baza, instrukcje);
  s.zegar.ustaw(teraz);
  const j: Jezyk = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false };
  mockAplikacja.kontener = { z: s.z, j };
  render(<EkranDni />);
  await waitFor(() => expect(screen.getByTestId('historia-dzien')).toBeTruthy());
}

test('dzień ukończenia projektu bez rzędów tego dnia → „Finished: Sweter”, bez „pustego dnia”', async () => {
  await otworz([projekt('p1', 'Sweter', T0 - 5 * 86_400_000, { stan: 'ukonczony', ukonczono: T0 }), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 3, { t: T0 - 5 * 86_400_000 })], T0 + GODZ);
  expect(screen.getByText('Finished: Sweter')).toBeTruthy();
  expect(screen.queryByText(/No knitting|nothing/i)).toBeNull();
  expect(screen.queryByText(/streak|in a row|don’t break|keep it up|you haven’t knitted|miss/i)).toBeNull(); // BR-DNI-001/S4 (P-043) — przeniesione z testu martwego komponentu
});

test('dzień bez ukończeń → brak linii „Finished:”', async () => {
  await otworz([projekt('p1', 'Sweter', T0, { stan: 'ukonczony', ukonczono: T0 - 3 * 86_400_000 }), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 3, { t: T0 })], T0 + GODZ);
  expect(screen.queryByText(/Finished:/)).toBeNull();
  expect(screen.queryByText(/\b0 h\b|0 hours|0:00/)).toBeNull(); // BR-DNI-003/S2: bez sesji nie ma „0 h” — przeniesione z testu martwego komponentu
});
