// BX-008 (PU-234): po wyborze „Imperial” w /miary i powrocie do Ustawień wiersz „Units” pokazuje nową wartość, nie starą migawkę z pierwszego renderu.
// Trasa `app/ustawienia.tsx` trzymała `pref` w `useState(preferencje.stan())`; `useFocusEffect` nie odświeżał go po powrocie (zapis w bazie się udawał).
// Test: ekran Ustawień z prawdziwą bazą; „powrót” = ponowne wywołanie zapamiętanych funkcji ostrości (jak react-navigation po `router.back()`).
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { preferencje } from '../../src/kompozycja/preferencje';
import { przygotuj, zArchiwum } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const ostrosc: Array<() => void | (() => void)> = [];
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useFocusEffect: (f: () => void | (() => void)) => R.useEffect(() => { ostrosc.push(f); return f(); }, []), // eslint-disable-line react-hooks/exhaustive-deps
    useLocalSearchParams: () => ({}),
  };
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: {} }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;

test('BX-008 / PU-234: powrót z /miary po wyborze „Imperial” → wiersz „Units” pokazuje „Imperial” (wcześniej zostawało „Automatic”)', async () => {
  const t = await tEn();
  const s = await przygotuj();
  const p = preferencje(); // prawdziwy magazyn: migawka zmienia się po COMMIT zapisu w bazie (ADR-0029), jak po wyborze w /miary
  const z = zArchiwum(s.z);
  const kontener = {
    z, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog,
    dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined },
  };
  mockAplikacja = { kontener, licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: p.stan, wczytaj: () => p.wczytaj(z), zapisz: (_z: unknown, zmiana: Parameters<typeof p.zapisz>[1]) => p.zapisz(z, zmiana) } };
  render(<EkranUstawien />);
  expect(await screen.findByTestId('ustawienia-miary')).toBeTruthy();
  expect(screen.getByText('Automatic')).toBeTruthy();

  expect((await p.zapisz(z, { ukladMiar: 'imperial' })).ok).toBe(true); // trasa /miary zapisała wybór i zrobiła `router.back()`
  await act(async () => { for (const f of ostrosc) f(); }); // ekran Ustawień znów w ostrości

  expect(screen.getByText('Imperial')).toBeTruthy();
  expect(screen.queryByText('Automatic')).toBeNull();
});
