// PU-193 (katalog przypadków użycia, „Kopia, usunięcie, import”): po wygaśnięciu Pro w „Settings” wiersz „Oczko Pro” nie jest „On”, wraca limit dni z liczbą „4 of 5 …” (dni z Pro się nie liczą),
// dane (baza) bez zmian, „Export” nadal jest. Poziom: trasa `/ustawienia` na prawdziwej bazie z dniami limitu (3 z Pro, 1 bez), prawdziwy `dostepPro` na sztucznym sklepie (`wygas` = „expire access” z buildu E2E).
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { dostepPro } from '../../src/kompozycja/dostep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { czesc, dzienLimitu, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { migawka, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
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

// PU-193: Pro „On” → wygaśnięcie → brak „On”, „4 of 5 free crafting days left in October” (3 dni z Pro nie liczą się), baza bez zmian, „Export” jest.
test('PU-193: po wygaśnięciu Pro: brak „On”, limit wraca z „4 of 5 …” (dni z Pro się nie liczą), dane bez zmian, „Export” dostępny', async () => {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3),
    dzienLimitu('2026-10-01', 'za', 0), dzienLimitu('2026-10-02', 'zb', 1), dzienLimitu('2026-10-03', 'zc', 1), dzienLimitu('2026-10-04', 'zd', 1)]);
  const sklep = sklepSztuczny(() => Date.UTC(2026, 9, 22));
  const d = dostepPro(sklep, { czytaj: async () => null, zapisz: async () => undefined }, () => Date.UTC(2026, 9, 22));
  await sklep.kup('oczko.pro.yearly');
  await d.odswiez();
  mockAplikacja = {
    kontener: { z: s.z, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog, dostep: d },
    licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };
  render(<EkranUstawien />);
  await waitFor(() => expect(screen.getByTestId('ustawienia-pro')).toHaveTextContent('On'));
  expect(screen.queryByTestId('ustawienia-dni-darmowe')).toBeNull(); // z Pro bez limitu
  const przed = await migawka(s.baza);
  sklep.wygas();
  await act(async () => { await d.odswiez(); });
  await waitFor(() => expect(screen.getByTestId('ustawienia-dni-darmowe')).toHaveTextContent('4 of 5 free crafting days left in October'));
  expect(screen.queryByTestId('ustawienia-pro')).toBeNull(); // wartość „On” zniknęła
  expect(screen.getByTestId('ustawienia-eksport')).toBeTruthy();
  expect(await migawka(s.baza)).toBe(przed);
});
