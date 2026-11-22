// M1-audytor-generalny-066 (06-tresci-003, DEC-06 a; P-304 (3)): kalkulator „Swatch” bez projektu klasyfikował każdą próbkę zakresami drutowymi CYC
// („Knit Gauge Range … in Stockinette Stitch”), także zrobioną szydełkiem — CYC ma dla szydełka osobne zakresy (kat. 4: 11–14 zamiast 16–20 o./4 in).
// Wybór „Needles / Hook” w kalkulatorze samodzielnym; przy szydełku bez kategorii (jak w projekcie szydełkowym), przy drutach jak dotąd.
// Trasa z `app/` na prawdziwej bazie (node:sqlite) i prawdziwym t() en; atrapa tylko routera i opakowań platformy (jak M1-016).
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProbki = (require('../../app/probka') as { default: React.ComponentType }).default;

async function zamontuj(params: Record<string, string>): Promise<void> {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5)]);
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k, preferencje: preferencje() };
  mockParams = params;
  render(<EkranProbki />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}
const wpiszProbke = (o: string) => fireEvent.changeText(screen.getByTestId('probka-oczka'), o);

describe('066: kalkulator samodzielny — druty albo szydełko', () => {
  test('domyślnie druty (jak dotąd): 14 o./4 in → kategoria 5 z zakresu drutowego', async () => {
    await zamontuj({});
    expect(screen.getByRole('radio', { name: 'Needles' }).props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByRole('radio', { name: 'per 4 in' }));
    wpiszProbke('14');
    expect(screen.getByTestId('probka-wynik-grubosc')).toBeTruthy();
    expect(screen.getByText('Category 5, bulky: 12–15 stitches per 4 in, knitted in stockinette stitch.')).toBeTruthy();
  });
  test('szydełko: bez kategorii (zakresy drutowe nie pasują do szydełka); wynik szerokości i przeliczenie zostają', async () => {
    await zamontuj({});
    fireEvent.press(screen.getByRole('radio', { name: 'Hook' }));
    expect(screen.getByRole('radio', { name: 'Hook' }).props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByRole('radio', { name: 'per 4 in' }));
    wpiszProbke('14');
    fireEvent.changeText(screen.getByTestId('probka-szerokosc'), '10');
    expect(screen.queryByTestId('probka-wynik-grubosc')).toBeNull();
    expect(screen.queryByText(/Category \d/)).toBeNull();
    expect(screen.getByTestId('probka-wynik-oczka')).toBeTruthy();
    expect(screen.getByText('= 13.8 stitches per 10 cm')).toBeTruthy();
  });
  test('powrót do drutów przywraca kategorię', async () => {
    await zamontuj({});
    fireEvent.press(screen.getByRole('radio', { name: 'Hook' }));
    fireEvent.press(screen.getByRole('radio', { name: 'per 4 in' }));
    wpiszProbke('14');
    expect(screen.queryByTestId('probka-wynik-grubosc')).toBeNull();
    fireEvent.press(screen.getByRole('radio', { name: 'Needles' }));
    expect(screen.getByTestId('probka-wynik-grubosc')).toBeTruthy();
  });
  test('z projektu: narzędzie z projektu, bez wyboru w kalkulatorze', async () => {
    await zamontuj({ projekt: 'p1' });
    expect(screen.getByTestId('probka-oczka')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Hook' })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Needles' })).toBeNull();
  });
});
