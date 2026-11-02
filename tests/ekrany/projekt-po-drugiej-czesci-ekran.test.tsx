// E2-A2 (scen. 34), strażnik: trasa „/projekt/[id]” (app/projekt/[id].tsx) na bazie po „Next part → A second Back” rysuje treść. Pustego ekranu z przebiegu #135 nie odtworzono na poziomie RNTL (zob. docs/programista/poprawki-e2-b.md).
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { nastepnaCzesc } from '../../src/przypadki-uzycia/czesc';
import { dodajCzescPara } from '../../src/przypadki-uzycia/projekt';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const mock: { kontener?: unknown; router: Record<string, jest.Mock> } = { router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: jest.fn(() => true) } };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mock.router, useLocalSearchParams: () => ({ id: 'p1' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener, licznik: { widok: async () => null, biezacy: () => null, poZmianie: async () => undefined, otworz: async () => undefined } }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;

test('scen. 34: po „A second Back” ekran projektu rysuje części „Back” i „Pair of Back”, a nie pusty widok', async () => {
  const s = await przygotuj();
  const j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false };
  await wykonaj(s.baza, [projekt('p1', 'Sweater', T0), czesc('c1', 'p1', 'Back', 1, { cel: 40 }), ...licznik('l1', 'c1', 39)]);
  expect((await dodajRzad(s.z, { licznikId: 'l1' })).ok).toBe(true);
  const n = await nastepnaCzesc(s.z, { licznikId: 'l1' });
  if (!n.ok || n.wartosc.rodzaj !== 'koniec') throw new Error('oczekiwano koniec');
  expect((await dodajCzescPara(s.z, { czescId: n.wartosc.czescId, nazwa: n.wartosc.czesc })).ok).toBe(true);
  const wzorK = { naZmiane: () => () => undefined, stan: () => ({ czekaSiec: [] }) };
  mock.kontener = {
    z: s.z, j, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
    wzor: { k: wzorK, platforma: { miniatura: async () => null, skanerDostepny: () => false } },
  };
  render(<EkranProjektu />);
  expect(await screen.findByText('Pair of Back', undefined, { timeout: 3000 })).toBeTruthy();
});
