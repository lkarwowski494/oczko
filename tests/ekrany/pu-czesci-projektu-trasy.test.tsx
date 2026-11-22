// PU-281 i PU-282 (katalog przypadków użycia, „Projekt i części”): dodanie części z celem i +1 w niej; usunięcie części z licznikami i przywrócenie z kosza.
// Trasy app/formularz/[rodzaj], app/licznik, app/projekt/[id] i app/kosz na prawdziwej bazie i kompozycji licznika (atrapy tylko na granicy platformy).
import React from 'react';
import { Alert } from 'react-native';
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
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
const EkranKosza = (require('../../app/kosz') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const czekaj = (ms = 120) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
async function start(instrukcje: Parameters<typeof wykonaj>[1], otworzLicznik: string) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj((s.baza satisfies PortBazy), instrukcje);
  s.zegar.ustaw(T0);
  await k.otworz(otworzLicznik);
  mockAplikacja = {
    kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() }, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } },
    licznik: k, preferencje: {},
  };
  Object.values(mockRouter).forEach((f) => typeof f === 'function' && 'mockClear' in f && (f as jest.Mock).mockClear());
  return { s, k };
}
const wiersze = () => screen.getAllByTestId('projekt-czesc').map((w) => tekst(w));

test('PU-281: część „Sleeve” z celem 40 → w „Parts” nowy wiersz; po +1 w niej „1 of 40 rows”, a „Back” bez zmian', async () => {
  const { s } = await start([projekt('p1', 'Sweater'), czesc('c1', 'p1', 'Back'), ...licznik('l1', 'c1', 3)], 'l1');
  mockParams = { rodzaj: 'czesc', projekt: 'p1' };
  render(<EkranFormularza />);
  await czekaj();
  fireEvent.changeText(screen.getByTestId('formularz-nazwa-czesci'), 'Sleeve');
  fireEvent.changeText(screen.getByTestId('formularz-cel-czesci'), '40');
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 150)); });
  expect(mockRouter.back).toHaveBeenCalled();
  expect(await s.baza.all('SELECT nazwa, cel_rzedow FROM czesc WHERE nazwa = ?', ['Sleeve'])).toEqual([{ nazwa: 'Sleeve', cel_rzedow: 40 }]);
  screen.unmount();

  mockParams = { id: 'p1' };
  const przed = render(<EkranProjektu />);
  await waitFor(() => expect(wiersze()).toHaveLength(2));
  expect(wiersze().find((w) => w.includes('Sleeve'))).toBeTruthy(); // nowy wiersz w „Parts”
  expect(screen.getByTestId('projekt-postep')).toHaveTextContent('0% done'); // postęp liczy cel „Sleeve” (Back bez celu), RD-14
  const wierszBack = wiersze().find((w) => w.includes('Back'));
  const sleeve = screen.getAllByTestId('projekt-czesc').find((w) => tekst(w).includes('Sleeve'))!;
  fireEvent.press(sleeve); // jedyny licznik części: stuknięcie otwiera licznik „Sleeve”
  await czekaj();
  przed.unmount();

  render(<EkranLicznika />);
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('0'));
  expect(screen.getAllByText('Sleeve').length).toBeGreaterThan(0);
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('1'));
  screen.unmount();

  render(<EkranProjektu />);
  await waitFor(() => expect(wiersze().find((w) => w.includes('Sleeve'))).toMatch(/1 of 40 rows/));
  expect(wiersze().find((w) => w.includes('Back'))).toBe(wierszBack); // „Back” bez zmian
  expect(screen.getByTestId('projekt-postep')).toHaveTextContent('2% done'); // ⌊100 × 1 / 40⌋
});

test('PU-282: „Edit parts and counters” → usunięcie części „Front” (2 liczniki) z alertem; w koszu „Part of … · until …”; „Restore” przywraca „Front” z oboma licznikami i wartościami', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { s } = await start([
    projekt('p1', 'Sweater'), czesc('c1', 'p1', 'Front', 1), ...licznik('l1', 'c1', 5, { kolejnosc: 1 }), ...licznik('l2', 'c1', 3, { kolejnosc: 2, prefiks: 'l2-z' }),
    czesc('c2', 'p1', 'Back', 2), ...licznik('l3', 'c2', 7, { prefiks: 'l3-z' }),
  ], 'l3');
  mockParams = { id: 'p1' };
  render(<EkranProjektu />);
  await waitFor(() => expect(screen.getAllByTestId('projekt-czesc')).toHaveLength(2));
  fireEvent.press(screen.getByTestId('projekt-menu'));
  fireEvent.press(await screen.findByTestId('projekt-edytuj'));
  fireEvent.press(screen.getAllByTestId('projekt-usun-czesc')[0]); // „Front” (pierwsza część)
  expect(alert).toHaveBeenCalledTimes(1);
  expect(alert.mock.calls[0]?.[0]).toBe('Delete “Front”?');
  expect(alert.mock.calls[0]?.[1]).toBe('Its 2 counters go with it. You can restore it from Recently deleted on the Projects list until Nov 21.');
  const usun = alert.mock.calls[0]?.[2]?.find((p) => p.style === 'destructive');
  expect(usun?.text).toBe('Delete part');
  await act(async () => { usun?.onPress?.(); await new Promise((r) => setTimeout(r, 150)); });
  expect(await s.baza.all('SELECT id FROM czesc WHERE usunieto_ms IS NOT NULL')).toEqual([{ id: 'c1' }]);
  fireEvent.press(screen.getByTestId('projekt-gotowe'));
  screen.unmount();

  mockParams = {};
  render(<EkranKosza />);
  await czekaj();
  expect(screen.getByText('Part of Sweater · until Nov 21')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByTestId('kosz-przywroc')); await new Promise((r) => setTimeout(r, 150)); });
  expect(await s.baza.all('SELECT id FROM czesc WHERE usunieto_ms IS NOT NULL')).toEqual([]);
  screen.unmount();

  mockParams = { id: 'p1' };
  render(<EkranProjektu />);
  await waitFor(() => expect(screen.getAllByTestId('projekt-czesc')).toHaveLength(2));
  const front = screen.getAllByTestId('projekt-czesc').map((w) => tekst(w)).find((w) => w.includes('Front'));
  expect(front).toBeTruthy();
  const wierszeLicznikow = screen.getAllByTestId('projekt-licznik-wiersz').map((w) => tekst(w));
  expect(wierszeLicznikow).toHaveLength(2); // część z dwoma licznikami pokazuje oba (Back ma jeden)
  expect(wierszeLicznikow[0]).toMatch(/5/);
  expect(wierszeLicznikow[1]).toMatch(/3/);
  const liczby = await s.baza.all<{ id: string; wartosc: number }>("SELECT id, wartosc FROM licznik WHERE czesc_id = 'c1' AND usunieto_ms IS NULL ORDER BY id");
  expect(liczby).toEqual([{ id: 'l1', wartosc: 5 }, { id: 'l2', wartosc: 3 }]);
  alert.mockRestore();
});
