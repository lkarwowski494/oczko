// PU-036 (katalog przypadków użycia, „Projekt i części”): cel części 10 → +1 do 10 → „Goal reached” i „Next part” w strefie licznika → stuknięcie otwiera licznik kolejnej części (Front).
// Trasa app/licznik na prawdziwej bazie i kompozycji licznika (atrapy tylko na granicy platformy: router, haptyka).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import type { PortBazy } from '../../src/domena/porty';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
jest.mock('expo-router', () => ({
  usePathname: () => '/', useRouter: () => mockRouter,
  useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); }, // eslint-disable-line @typescript-eslint/no-require-imports
}));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;

test('PU-036: przy celu części 10 licznik pokazuje „Goal reached” i „Next part”; stuknięcie otwiera licznik części „Front” z wartością 0', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Sleeve', 1, { cel: 10 }), czesc('c2', 'p1', 'Front', 2), ...licznik('l1', 'c1', 9), ...licznik('l2', 'c2', 0)]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() }, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  render(<EkranLicznika />);
  const wartosc = () => screen.getByTestId('licznik-wartosc').props.accessibilityLabel as string;
  await waitFor(() => expect(wartosc()).toBe('9'));
  expect(screen.queryByTestId('licznik-nastepna-czesc')).toBeNull(); // cel jeszcze nieosiągnięty
  expect(screen.queryByText('Goal reached')).toBeNull();

  fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(wartosc()).toBe('10'));
  expect(await screen.findByText('Goal reached')).toBeTruthy();
  expect(screen.getByText('Sleeve')).toBeTruthy(); // do tej pory licznik części „Sleeve”
  const wStrefie = screen.getByTestId('licznik-strefa').findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string').map((n) => n.props.testID as string);
  expect(wStrefie.filter((x) => x !== 'licznik-strefa')[0]).toBe('licznik-nastepna-czesc'); // „Next part” jako pierwszy element strefy licznika
  fireEvent.press(await screen.findByTestId('licznik-nastepna-czesc'));

  await waitFor(() => expect(wartosc()).toBe('0'));
  expect(screen.getByTestId('licznik-projekt')).toHaveTextContent('Sweter');
  expect(screen.getByText('Front')).toBeTruthy();
  expect(screen.queryByText('Sleeve')).toBeNull();
  expect(screen.queryByTestId('licznik-nastepna-czesc')).toBeNull();
});
