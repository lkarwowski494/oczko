// PU-093 („Dane i ustawienia”): ekran projektu (trasa „/projekt/[id]”, prawdziwa baza) pokazuje liczniki, notatkę, wzór (z miniaturą) i datę ostatniej pracy.
// Poziom: komponentowy, bez symulatora; harness jak projekt-trasa-miejsce-032.test.tsx.
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
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
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({ w1: 'file:///tmp/m/a.png' }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;


// PU-093: projekt z notatką, wzorem (miniatura) i częścią z dwoma licznikami → ekran pokazuje wiersze liczników, notatkę, wzór i „Last change Oct 22”.
test('PU-093: ekran projektu pokazuje liczniki, notatkę, wzór z miniaturą i datę „Last change”', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [
    projekt('p1', 'Sweter', T0, { notatka: 'Switch to 4 mm for the cuff' }), czesc('c1', 'p1', 'Blanket', 1),
    ...licznik('l1', 'c1', 12, { kolejnosc: 1 }), ...licznik('l2', 'c1', 8, { kolejnosc: 2 }),
    plik('a'.repeat(64), 'pdf', 10), wzor('w1', 'p1', 'a'.repeat(64)),
  ]);
  s.zegar.ustaw(T0);
  mock.kontener = { z: s.z, j: { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false } satisfies Jezyk, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } }, wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } };
  render(<EkranProjektu />);
  await screen.findByText('Sweter');
  expect(screen.getAllByTestId('projekt-licznik-wiersz')).toHaveLength(2);
  expect(screen.getByText('12 rows')).toBeTruthy();
  expect(screen.getByText('8 rows')).toBeTruthy();
  expect(screen.getByText('Whole piece: 20 rows')).toBeTruthy();
  expect(within(screen.getByTestId('projekt-notatka')).getByText('Switch to 4 mm for the cuff')).toBeTruthy();
  const miniatura = await screen.findByTestId('wzor-miniatura', { includeHiddenElements: true });
  expect(miniatura.props.source).toEqual({ uri: 'file:///tmp/m/a.png' });
  expect(screen.getByText('Last change Oct 22')).toBeTruthy();
});
