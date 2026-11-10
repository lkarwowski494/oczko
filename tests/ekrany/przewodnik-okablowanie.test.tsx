// Q-003 (raport 08-recenzja-p-2026-11-10, 08-programista-003): okablowanie postępu przewodnika, którego test komponentu nie widzi —
// (1) trasa „/ustawienia” czyta zapis `ustawienie.przewodnik_przeczytane` z prawdziwej bazy i podaje wierszowi „Guide” liczbę przeczytanych,
// (2) pasek „Dziś” od AX3 (`fontScale` ≥ PROG_AX3) stawia przycisk „Guide” przed tytułem „Today”, poniżej AX3 obok tytułu (po nim w drzewie).
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Dzis, type PropsDzis } from '../../src/ekrany/Dzis';
import { PROG_AX3 } from '../../src/ekrany/motyw';
import { postep } from '../../src/domena/przewodnik';
import { oznaczPrzeczytana } from '../../src/przypadki-uzycia/przewodnik';
import { przygotuj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

let mockSkala = 1;
afterEach(() => { mockSkala = 1; });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []), useLocalSearchParams: () => ({}) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: {} }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;

async function ustawienia(przeczytane: readonly string[]) {
  const t = await tEn();
  const s = await przygotuj();
  for (const id of przeczytane) await oznaczPrzeczytana(s.z, id);
  const kontener = {
    z: s.z, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog,
    dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined },
  };
  mockAplikacja = { kontener, licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() } };
}

describe('Q-003: trasa /ustawienia → wiersz „Guide”', () => {
  test('bez przeczytanych: „0 of 42”', async () => {
    await ustawienia([]);
    render(<EkranUstawien />);
    expect(await screen.findByTestId('ustawienia-przewodnik')).toHaveTextContent(/(^|\D)0 of 42$/);
    expect(postep([]).m).toBe(42); // m liczone z domeny, tekst wiersza z i18n
  });

  test('dwie przeczytane z bazy (cel, kosz): „2 of 42” — liczba pochodzi z zapisu, nie z domyślnej', async () => {
    await ustawienia(['cel', 'kosz']);
    render(<EkranUstawien />);
    await waitFor(() => expect(screen.getByTestId('ustawienia-przewodnik')).toHaveTextContent(/(^|\D)2 of 42$/));
    expect(screen.getByTestId('ustawienia-przewodnik')).not.toHaveTextContent(/(^|\D)0 of 42$/);
  });
});

describe('Q-003: pasek „Dziś” — „Guide” względem tytułu „Today”', () => {
  const props = (t: Awaited<ReturnType<typeof tEn>>): PropsDzis => ({
    stan: stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }), dane: null, t, oglos: jest.fn(), haptyka: atrapaHaptyki(),
    naPlus: jest.fn(async () => plusOk(43)), naCofnijSerie: jest.fn(), naOferty: jest.fn(), naKontynuuj: jest.fn(), naWybierzProjekt: jest.fn(), naUstawienia: jest.fn(), naPrzewodnik: jest.fn(),
  });
  const kolejnosc = (): { przewodnik: number; ustawienia: number; tytul: number } => {
    const drzewo = JSON.stringify(screen.toJSON());
    return {
      przewodnik: drzewo.indexOf('"testID":"nav-przewodnik"'),
      ustawienia: drzewo.indexOf('"testID":"nav-ustawienia"'),
      tytul: drzewo.indexOf('"accessibilityRole":"header"'),
    };
  };

  test('od AX3: pasek (Guide, zębatka) przed tytułem „Today”', async () => {
    const t = await tEn();
    mockSkala = PROG_AX3;
    render(<Dzis {...props(t)} />);
    const k = kolejnosc();
    expect(k.przewodnik).toBeGreaterThan(-1);
    expect(k.tytul).toBeGreaterThan(-1);
    expect(k.przewodnik).toBeLessThan(k.ustawienia);
    expect(k.ustawienia).toBeLessThan(k.tytul);
  });

  test('poniżej AX3: tytuł „Today”, a po nim pasek (Guide, zębatka)', async () => {
    const t = await tEn();
    mockSkala = 1;
    render(<Dzis {...props(t)} />);
    const k = kolejnosc();
    expect(k.tytul).toBeGreaterThan(-1);
    expect(k.tytul).toBeLessThan(k.przewodnik);
    expect(k.przewodnik).toBeLessThan(k.ustawienia);
  });
});
