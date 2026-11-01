// Trasa „/stan-danych” (app/stan-danych.tsx) przez ekran (07-jakosc-032). 07-jakosc-019 (BR-DAN-002, P-220 I1a): wiersz „N counters have two versions”
// prowadzi do wyboru wersji — otwiera licznik w konflikcie i przechodzi na /konflikt (ekran wyboru działa na bieżącym liczniku).
import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { licznikiWKonflikcie } from '../../src/dane/repozytoria/icloud';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
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

async function aplikacja() {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p', 'Czapka'), czesc('c', 'p', 'Główka'), ...licznik('l-ok', 'c', 2), ['UPDATE synchronizacja SET wlaczona = 1 WHERE id = 1', []]]);
  await wykonaj(s.baza, [['INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, 2, 1)', ['c2', 'p', 'Rondo']],
    ['INSERT INTO licznik (id, czesc_id, kolejnosc, zmieniono_ms, konflikt) VALUES (?, ?, 1, 1, 1)', ['l-konflikt', 'c2']]]);
  const otworz = jest.fn(async () => undefined);
  const sterownik = { widok: () => ({ stan: 'aktywna', przyczyna: null, status: null }), obserwuj: () => () => undefined };
  mockAplikacja = {
    kontener: { z: s.z, j: { t, jezyk: () => 'en', zegar24h: () => true }, icloud: { sterownik, widoczny: true, e2e: null, naPartie: () => () => undefined } },
    licznik: { otworz }, preferencje: {},
  };
  return { s, otworz };
}

test('019: „1 counter has two versions” prowadzi do wyboru — otwiera licznik w konflikcie i przechodzi na /konflikt', async () => {
  const { s, otworz } = await aplikacja();
  expect(await licznikiWKonflikcie(s.baza)).toBe(1);
  render(<EkranStanuDanych />);
  const wiersz = await screen.findByRole('button', { name: /two versions/ });
  await userEvent.press(wiersz);
  await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/konflikt'));
  expect(otworz).toHaveBeenCalledWith('l-konflikt');
});
