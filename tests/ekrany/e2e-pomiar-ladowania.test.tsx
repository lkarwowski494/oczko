// E2-137-A1 (scenariusz 34): panel buildu E2E `e2e-pomiar-ladowania` na ekranie projektu — „first data N ms”, czas od zamontowania ekranu do pierwszych danych
// (bez t(), jak `e2e-pomiar-plus`). Pojawia się dopiero po danych; zielone przebiegi też go pokażą, więc „maszyna wolna” kontra „aplikacja zawiesza” będzie liczbą.
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { odroczona, tEn } from './pomoc';

const mock: { kontener?: unknown; widokProjektu?: (...a: unknown[]) => Promise<unknown> } = {};
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => ({ id: 'p1' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/platforma/tryb-e2e', () => ({
  ...jest.requireActual<object>('../../src/platforma/tryb-e2e'),
  paneleE2e: jest.requireActual<object>('../../src/kompozycja/e2e/panele'), // build E2E: panele są
}));
jest.mock('../../src/kompozycja/Kontekst', () => ({
  useAplikacja: () => ({ kontener: mock.kontener, licznik: { biezacy: () => null, otworz: async () => undefined, poZmianie: async () => undefined, poUsunieciu: async () => undefined } }),
}));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/przypadki-uzycia/widok-projektu', () => ({
  ...jest.requireActual<object>('../../src/przypadki-uzycia/widok-projektu'),
  widokProjektu: (...a: unknown[]) => (mock.widokProjektu as (...a: unknown[]) => Promise<unknown>)(...a),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
const prawdziwy = jest.requireActual<typeof import('../../src/przypadki-uzycia/widok-projektu')>('../../src/przypadki-uzycia/widok-projektu').widokProjektu;

test('panel „first data N ms”: brak w czasie ładowania, po danych liczba nie mniejsza niż opóźnienie odczytu', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)]);
  s.zegar.ustaw(T0);
  const j: Jezyk = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false };
  mock.kontener = {
    z: s.z, j, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
    wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } },
  };
  const o = odroczona<void>();
  mock.widokProjektu = async (...a) => { await o.obietnica; return prawdziwy(...(a as Parameters<typeof prawdziwy>)); };
  render(<EkranProjektu />);
  expect(screen.getByTestId('projekt-ladowanie')).toBeTruthy();
  expect(screen.queryByTestId('e2e-pomiar-ladowania')).toBeNull();
  await act(async () => { await new Promise((r) => setTimeout(r, 150)); o.rozwiaz(); });
  const panel = await waitFor(() => screen.getByTestId('e2e-pomiar-ladowania'));
  const m = /^first data (\d+) ms$/.exec(String(panel.props.children));
  expect(m).not.toBeNull();
  expect(Number(m?.[1])).toBeGreaterThanOrEqual(140); // opóźnienie odczytu 150 ms (z marginesem na zegar)
});
