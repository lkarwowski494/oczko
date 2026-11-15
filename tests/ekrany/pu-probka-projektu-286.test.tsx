// PU-286 (katalog przypadków użycia, „Projekt i części”): próbka zapisana w projekcie — „Swatch” z projektu → 22 oczka na 10 cm → powrót → w „Details” „22 stitches / 10 cm”;
// ponowne wejście pokazuje 22, zmiana na 20 → „20 stitches / 10 cm”; stan pochodzi z bazy (nowy render = „restart” ekranu). Trasy app/probka i app/projekt/[id] na prawdziwej bazie.
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
const EkranProbki = (require('../../app/probka') as { default: React.ComponentType }).default;
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */


const czekaj = (ms = 120) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

test('PU-286: próbka 22 / 10 cm zapisana w projekcie: „saved with the project”, w „Details” „22 stitches / 10 cm”, po ponownym wejściu pole 22, po zmianie na 20 „20 stitches / 10 cm”', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweater'), czesc('c1', 'p1', 'Back'), ...licznik('l1', 'c1', 3)]);
  s.zegar.ustaw(T0);
  await k.otworz('l1');
  mockAplikacja = {
    kontener: { z: s.z, j, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } }, dostep: { stan: () => ({ poziom: 'darmowa' }) },
      wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } },
    licznik: k, preferencje: { stan: () => ({ ukladMiar: 'metric' }) },
  };
  const wierszProbki = () => tekst(screen.getByTestId('projekt-probka'));
  const wpiszOczka = async (n: string) => { fireEvent.changeText(screen.getByTestId('probka-oczka'), n); await czekaj(150); };

  mockParams = { projekt: 'p1' };
  const probka1 = render(<EkranProbki />);
  await waitFor(() => screen.getByTestId('probka-oczka'));
  expect(screen.getByText('Swatch of Sweater · saved with the project')).toBeTruthy();
  await wpiszOczka('22');
  probka1.unmount();

  mockParams = { id: 'p1' };
  const projekt1 = render(<EkranProjektu />);
  await waitFor(() => expect(wierszProbki()).toContain('22 stitches / 10 cm'));
  projekt1.unmount();

  mockParams = { projekt: 'p1' };
  const probka2 = render(<EkranProbki />);
  await waitFor(() => expect(screen.getByTestId('probka-oczka').props.value).toBe('22')); // ponowne wejście: pole ma 22
  await wpiszOczka('20');
  probka2.unmount();

  mockParams = { id: 'p1' };
  render(<EkranProjektu />);
  await waitFor(() => expect(wierszProbki()).toContain('20 stitches / 10 cm'));
  expect(await s.baza.all('SELECT probka FROM projekt WHERE id = ?', ['p1'])).toEqual([{ probka: expect.stringContaining('20') }]);
});
