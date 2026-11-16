// BX-049 / KO-119 (PU-322): zakup na trasie /oferty, gdy Ustawienia są zasłonięte (odsubskrybowane przy utracie ostrości), a po powrocie wiersz „Oczko Pro” ma „On”.
// Regresja: `app/ustawienia.tsx` zapisywał się na `dostep.naZmiane` dopiero przy ostrości i nie czytał bieżącego `dostep.stan()`, więc zmiana z czasu zasłonięcia przepadała.
// Test: prawdziwy `app/ustawienia.tsx`, prawdziwy `dostepPro` i sztuczny sklep; blur = wywołanie zwróconych sprzątaczy ostrości, focus = ponowne wywołanie zapamiętanych funkcji
// (jak react-navigation przy `router.push('/oferty')` i `router.back()`). `pu-zakup-planow-321-323.test.tsx` montuje Ustawienia od nowa, więc tej ścieżki nie widzi.
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { dostepPro } from '../../src/kompozycja/dostep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';

const ostrosc: Array<{ f: () => void | (() => void); koniec: (() => void) | null }> = [];
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useFocusEffect: (f: () => void | (() => void)) => R.useEffect(() => { const w = { f, koniec: null as (() => void) | null }; ostrosc.push(w); const k = f(); w.koniec = typeof k === 'function' ? k : null; return () => w.koniec?.(); }, []), // eslint-disable-line react-hooks/exhaustive-deps
    useLocalSearchParams: () => ({}),
  };
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: { zarzadzajSubskrypcja: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;

const TERAZ = Date.UTC(2026, 10, 10);
const blur = () => { for (const w of ostrosc) { w.koniec?.(); w.koniec = null; } };
const focus = async () => { await act(async () => { for (const w of ostrosc) { const k = w.f(); w.koniec = typeof k === 'function' ? k : null; } }); };

test('BX-049 / PU-322: zakup na /oferty przy zasłoniętych Ustawieniach → po powrocie „Oczko Pro” pokazuje „On” (wcześniej bez „On”)', async () => {
  ostrosc.length = 0;
  const { s, j } = await kompozycjaTestowa();
  const sklep = sklepSztuczny(() => TERAZ, { czytaj: () => null, zapisz: () => undefined });
  const dostep = dostepPro(sklep, { czytaj: async () => null, zapisz: async () => undefined }, () => TERAZ);
  await dostep.odswiez();
  mockAplikacja = {
    kontener: { z: s.z, j: { ...j, preferencja: () => 'auto' as const }, porty: { sklep }, dostep, icloud: null, katalogDanych: s.katalog },
    licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };
  render(<EkranUstawien />);
  expect(await screen.findByTestId('ustawienia-oczko-pro')).toBeTruthy();
  expect(screen.queryByTestId('ustawienia-pro')).toBeNull();

  act(() => blur()); // /oferty na wierzchu: Ustawienia odsubskrybowane
  await act(async () => { await sklep.kup('oczko.pro.yearly'); await dostep.odswiez(); }); // zakup na ofertach
  expect(dostep.stan().pro).toBe(true);
  expect(screen.queryByTestId('ustawienia-pro')).toBeNull(); // ekran zasłonięty, jeszcze nie odświeżony

  await focus(); // `router.back()`
  expect(await screen.findByTestId('ustawienia-pro')).toHaveTextContent('On');
});
