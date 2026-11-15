// PU-186 (katalog przypadków użycia, „Kopia, usunięcie, import”): stan przeczytania przewodnika nie jest częścią kopii — wiersz „Guide” w „Settings”
// po przeczytaniu „1 of 42”, po „Delete all data” „0 of 42”, po imporcie „Merge” i „Replace” archiwum z obcą listą nadal „0 of 42”.
// Poziom: trasa „/ustawienia” na prawdziwej bazie (jak przewodnik-okablowanie.test.tsx), prawdziwe `usunWszystkieDane` i `importuj`.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { importuj } from '../../src/przypadki-uzycia/archiwum';
import { oznaczPrzeczytana } from '../../src/przypadki-uzycia/przewodnik';
import { usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import { archiwumWzorcowe, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, zArchiwum } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }) }));
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

// PU-186: wiersz „Guide” w „Settings” — 1 of 42 → usunięcie → 0 of 42 → import Merge i Replace z obcą listą → nadal 0 of 42.
test('PU-186: „Guide” 1 of 42 → „Delete all data” → 0 of 42 → import „Merge” i „Replace” (archiwum z listą przewodnika) → nadal 0 of 42', async () => {
  const t = await tEn();
  const s = await przygotuj();
  mockAplikacja = {
    kontener: { z: s.z, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog, dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined } },
    licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };
  const wiersz = async (n: number) => {
    const r = render(<EkranUstawien />);
    await waitFor(() => expect(screen.getByTestId('ustawienia-przewodnik-wartosc')).toHaveTextContent(new RegExp(`^${n} of 42$`)));
    r.unmount();
  };
  await oznaczPrzeczytana(s.z, 'cel');
  await wiersz(1);
  expect(await usunWszystkieDane(zArchiwum(s.z))).toMatchObject({ ok: true });
  await wiersz(0);
  for (const tryb of ['scal', 'zastap'] as const) {
    const sciezka = archiwumWzorcowe(s.katalog, `obce-${tryb}`, [projekt('cz', 'Czapka'),
      ['INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES (?, ?, ?)', ['przewodnik_przeczytane', '["kosz","zegarek","cel"]', 1]]]);
    expect(await importuj(zArchiwum(s.z), { sciezka, wybierz: async () => tryb })).toMatchObject({ ok: true });
    await wiersz(0);
  }
});
