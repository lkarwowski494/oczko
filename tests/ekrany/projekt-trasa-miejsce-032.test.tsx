// 07-jakosc-032 (JAK-04), luka 07-jakosc-010 (F-18, BR-PRJ-005/S1): TRASA „/projekt/[id]” (app/projekt/[id].tsx) na prawdziwej bazie pokazuje miejsce we wzorze
// („Pattern: Page 3, row 48”) z prawdziwego znacznika i wartości licznika. Dotąd test szedł przez `stanProjektu` do komponentu `Projekt` (tests/ekrany/projekt-miejsce-wzoru.test.tsx),
// więc nie wykrywał, że trasa nie podaje miejsca ekranowi. Oczekiwana liczba: strona znacznika 2 (od 0) → „Page 3”; rząd bazowy 48 (znacznik ustawiony przy liczniku 47, licznik 47 → rząd 48).
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mock: { kontener?: unknown; router: { push: jest.Mock; back: jest.Mock; replace: jest.Mock; navigate: jest.Mock; canGoBack: () => boolean } } =
  { router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => true } };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mock.router, useLocalSearchParams: () => ({ id: 'p1' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener, licznik: { biezacy: () => null, otworz: async () => undefined, poZmianie: async () => undefined, poUsunieciu: async () => undefined } }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;

const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 2, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 48, wartosc_przy_ustawieniu: 47, kierunek: 1 });

async function otworz(znacznik: string) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 47), plik('a'.repeat(64), 'pdf', 10), wzor('w1', 'p1', 'a'.repeat(64), znacznik)]);
  s.zegar.ustaw(T0);
  mock.kontener = { z: s.z, j: { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false } satisfies Jezyk, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } }, wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } };
  render(<EkranProjektu />);
  await screen.findByText('Sweter');
}

test('032-010 (F-18, BR-PRJ-005/S1): trasa projektu — znacznik na stronie 3, licznik 47 → „Pattern: Page 3, row 48”', async () => {
  await otworz(ZNACZNIK);
  await waitFor(() => expect(screen.getByText('Pattern: Page 3, row 48')).toBeTruthy());
});
