// PU-284 (katalog przypadków użycia, „Projekt i części”): „Done by” → „No date” i „Needles or hook” → „Clear” zostawiają „None” i „Add”; przy terminie sprzed dziś projekt mówi „has passed”,
// a lista „Past the due date · n rows to go”. Trasy app/formularz/[rodzaj], app/projekt/[id] i app/(zakladki)/projekty na prawdziwej bazie.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tekst } from './pomoc';
import type { PortBazy } from '../../src/domena/porty';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), navigate: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
jest.mock('expo-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(),
  useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, usePathname: () => '/', useIsFocused: () => true,
  useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); }, // eslint-disable-line @typescript-eslint/no-require-imports
}));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
const EkranProjektow = (require('../../app/(zakladki)/projekty') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */


const czekaj = (ms = 120) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

test('PU-284: „No date” i „Clear” dają „None” i „Add”; termin sprzed dziś → „The due date … has passed, 15 rows to go” na projekcie i „Past the due date · 15 rows to go” na liście', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweater'), czesc('c1', 'p1', 'Back', 1, { cel: 20 }), ...licznik('l1', 'c1', 5),
    ["UPDATE projekt SET termin_dzien = '2026-10-30', drut_mm = 4, narzedzie = 'druty' WHERE id = 'p1'", []]]);
  s.zegar.ustaw(T0); // 2026-10-22
  await k.otworz('l1');
  mockAplikacja = {
    kontener: { z: s.z, j, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } }, dostep: { stan: () => ({ poziom: 'darmowa' }) },
      wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } },
    licznik: k, preferencje: { stan: () => ({ ukladMiar: 'metric' }) },
  };
  const wartoscWiersza = (id: string) => tekst(screen.getByTestId(id));
  const zFormularza = async (params: Record<string, string>, przycisk: string) => {
    mockParams = params;
    const f = render(<EkranFormularza />);
    await czekaj();
    await act(async () => { fireEvent.press(screen.getByTestId(przycisk)); await new Promise((r) => setTimeout(r, 150)); });
    f.unmount();
  };

  mockParams = { id: 'p1' };
  const przed = render(<EkranProjektu />);
  await waitFor(() => expect(wartoscWiersza('projekt-termin')).toContain('Oct 30'));
  expect(wartoscWiersza('projekt-narzedzie')).not.toContain('Add');
  przed.unmount();

  await zFormularza({ rodzaj: 'termin', projekt: 'p1' }, 'formularz-termin-brak');
  await zFormularza({ rodzaj: 'narzedzie', projekt: 'p1' }, 'formularz-wyczysc');
  mockParams = { id: 'p1' };
  const po = render(<EkranProjektu />);
  await waitFor(() => expect(wartoscWiersza('projekt-termin')).toContain('None'));
  expect(wartoscWiersza('projekt-narzedzie')).toContain('Add');
  expect(await s.baza.all('SELECT termin_dzien, drut_mm FROM projekt WHERE id = ?', ['p1'])).toEqual([{ termin_dzien: null, drut_mm: null }]);
  po.unmount();

  await wykonaj(s.baza, [["UPDATE projekt SET termin_dzien = '2026-10-20' WHERE id = 'p1'", []]]); // termin sprzed „dziś” (22 października)
  mockParams = { id: 'p1' };
  const minal = render(<EkranProjektu />);
  await waitFor(() => expect(screen.getByTestId('projekt-linia-terminu')).toHaveTextContent('The due date Oct 20 has passed, 15 rows to go'));
  minal.unmount();
  render(<EkranProjektow />);
  expect(await screen.findByText('Past the due date · 15 rows to go')).toBeTruthy();
});
