// PU-046 (katalog przypadków użycia, „Projekt i części”): „Sessions” → sesja → koniec o 10 min wcześniej → „Save”: podgląd „Project time after saving: …” skraca czas projektu o 10 min,
// a po zapisie sesja jest oznaczona „Edited”. Trasy app/sesja-korekta i app/sesje na prawdziwej bazie.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { GODZ, MIN, T0, wykonaj } from '../dane/pomocnicze/srodowisko';
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
const EkranKorekty = (require('../../app/sesja-korekta') as { default: React.ComponentType }).default;
const EkranSesji = (require('../../app/sesje') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */


const START = T0 - 6 * GODZ;

test('PU-046: koniec sesji o 10 min wcześniej → „Project time after saving” z 1 h 30 min na 1 h 20 min, po „Save” sesja jest „Edited”, a koniec w bazie przesunięty o 10 min', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweater'), czesc('c1', 'p1', 'Back'), ...licznik('l1', 'c1', 3),
    ...[['s1', START, 60 * MIN], ['s2', START - 3 * GODZ, 30 * MIN]].map(([id, start, ms]): [string, unknown[]] =>
      ["INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, strefa, dzien) VALUES (?, 'p1', 'zakonczona', ?, ?, 'Europe/Warsaw', '2026-10-22')", [id, start, (start as number) + (ms as number)]])]);
  s.zegar.ustaw(T0);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  Object.values(mockRouter).forEach((f) => typeof f === 'function' && 'mockClear' in f && (f as jest.Mock).mockClear());

  mockParams = { projekt: 'p1' };
  const sesje = render(<EkranSesji />);
  await waitFor(() => screen.getByTestId('sesje-lista'));
  expect(screen.queryByText('Edited')).toBeNull();
  sesje.unmount();

  mockParams = { sesja: 's1', projekt: 'p1' };
  render(<EkranKorekty />);
  await waitFor(() => screen.getByTestId('formularz-sesja-koniec'));
  expect(screen.getByText('Project time after saving: 1 h 30 min.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('formularz-sesja-koniec'));
  fireEvent(screen.getByTestId('formularz-sesja-koniec-wybor'), 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(START + 50 * MIN));
  expect(screen.getByText('Project time after saving: 1 h 20 min.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Save')); await new Promise((r) => setTimeout(r, 150)); });
  expect(mockRouter.back).toHaveBeenCalled();
  expect(await s.baza.all('SELECT koniec_ms - start_ms AS ms FROM sesja WHERE id = ?', ['s1'])).toEqual([{ ms: 50 * MIN }]);
  screen.unmount();

  mockParams = { projekt: 'p1' };
  render(<EkranSesji />);
  await waitFor(() => expect(screen.getAllByText('Edited')).toHaveLength(1));
  expect(tekst(screen.getByTestId('sesje-lista'))).toContain('Edited');
});
