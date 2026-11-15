// PU-033, PU-035 i PU-280 (katalog przypadków użycia, „Projekt i części”): przypomnienie „co N rzędów” — formularz z podglądem, zapis, pas na liczniku; zmiana „Ile razy” zapisanego przypomnienia, usunięcie przypomnienia.
// Trasy app/formularz/[rodzaj] i app/licznik na prawdziwej bazie i kompozycji licznika (atrapy tylko na granicy platformy: router, haptyka).
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { jeden, wykonaj } from '../dane/pomocnicze/srodowisko';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(),
  useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, usePathname: () => '/',
  useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); }, // eslint-disable-line @typescript-eslint/no-require-imports
}));
// Domyślny rozmiar tekstu jak na urządzeniu (fontScale 1); preset jest RN daje 2, czyli układ kategorii dostępności bez widocznego podpisu „tap when row N is done”.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;
const EkranMenu = (require('../../app/menu') as { default: React.ComponentType }).default;
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const czekaj = (ms = 120) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
async function start(skonczone: number, przypomnienia: [string, unknown[]][] = []) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', skonczone), ...przypomnienia]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() }, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  Object.values(mockRouter).forEach((f) => f.mockClear());
  return { s, k };
}
const wpisz = (id: string, tekst: string) => fireEvent.changeText(screen.getByTestId(id), tekst);

// PU-033: podgląd „rzędach: 8, 14, 20” w formularzu → zapis → przy 7 skończonych pas „Row 8: …”, „1 of 3, next on row 14” i podpis „tap when row 8 is done”.
test('PU-033: przypomnienie od rzędu 8 co 6, 3 razy: podgląd 8, 14, 20; po zapisie i +1 do 7 pas „Row 8: decrease at both ends”, „1 of 3, next on row 14”, „tap when row 8 is done”', async () => {
  const { s } = await start(6);
  mockParams = { rodzaj: 'przypomnienie' };
  const formularz = render(<EkranFormularza />);
  await czekaj();
  wpisz('przypomnienie-co-robic', 'decrease at both ends');
  wpisz('przypomnienie-od-rzedu', '8');
  wpisz('przypomnienie-co-ile', '6');
  wpisz('przypomnienie-ile-razy', '3');
  expect(screen.getByTestId('przypomnienie-podglad')).toHaveTextContent('You’ll be reminded on rows: 8, 14, 20');
  await act(async () => { fireEvent.press(screen.getByTestId('przypomnienie-zapisz')); await new Promise((r) => setTimeout(r, 150)); });
  expect(mockRouter.back).toHaveBeenCalled();
  expect(await jeden(s.baza, 'SELECT od_rzedu, co_n, razy, tekst FROM przypomnienie')).toMatchObject({ od_rzedu: 8, co_n: 6, razy: 3, tekst: 'decrease at both ends' });
  formularz.unmount();

  render(<EkranLicznika />);
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('6'));
  expect(screen.queryByText('1 of 3, next on row 14')).toBeNull(); // przy 6 skończonych pasa jeszcze nie ma (rząd 7 to zwykły rząd)
  fireEvent.press(await screen.findByTestId('licznik-plus'));
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('7'));
  expect(await screen.findByText('Row 8: decrease at both ends')).toBeTruthy();
  expect(screen.getByText('1 of 3, next on row 14')).toBeTruthy();
  expect(screen.getByText('tap when row 8 is done')).toBeTruthy();
});

// PU-035: zapisane przypomnienie od 8 co 6 ×3 → „How many times” 4 → podgląd „8, 14, 20, 26”; zapis, a ponowne otwarcie pokazuje 4.
test('PU-035: zmiana „How many times” z 3 na 4 → podgląd „rows: 8, 14, 20, 26”, zapis w bazie i w ponownie otwartym formularzu', async () => {
  const { s } = await start(5, [["INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES ('pr1', 'l1', 8, 6, 3, 'decrease at both ends', 1)", []]]);
  mockParams = { rodzaj: 'przypomnienie-edycja', przypomnienie: 'pr1' };
  const edycja = render(<EkranFormularza />);
  await czekaj();
  expect(screen.getByTestId('przypomnienie-ile-razy').props.value).toBe('3');
  expect(screen.getByTestId('przypomnienie-podglad')).toHaveTextContent('You’ll be reminded on rows: 8, 14, 20');
  wpisz('przypomnienie-ile-razy', '4');
  expect(screen.getByTestId('przypomnienie-podglad')).toHaveTextContent('You’ll be reminded on rows: 8, 14, 20, 26');
  await act(async () => { fireEvent.press(screen.getByTestId('przypomnienie-zapisz')); await new Promise((r) => setTimeout(r, 150)); });
  expect(mockRouter.back).toHaveBeenCalled();
  expect(await widokLicznika(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { plany: [{ id: 'pr1', od: 8, co: 6, razy: 4 }] } });
  edycja.unmount();
  render(<EkranFormularza />); // ponowne otwarcie
  await czekaj();
  expect(screen.getByTestId('przypomnienie-ile-razy').props.value).toBe('4');
  expect(screen.getByTestId('przypomnienie-podglad')).toHaveTextContent('You’ll be reminded on rows: 8, 14, 20, 26');
});

// PU-280: lista przypomnień → edycja → „Delete reminder” → alert → po usunięciu w arkuszu „Goal” wraca „Add a reminder…”, licznik bez pasa przypomnienia (także po +1), wartość bez zmian.
test('PU-280: usunięcie jedynego przypomnienia: po alercie w „Goal” znów „Add a reminder…”, licznik bez pasa „Row N: …” także po +1, a wartość tylko o ten +1', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { s } = await start(5, [["INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES ('pr1', 'l1', 6, 6, 5, 'ujmowanie', 1)", []]]);
  const wartoscNaEkranie = () => screen.getByTestId('licznik-wartosc').props.accessibilityLabel as string;

  const przed = render(<EkranLicznika />);
  await waitFor(() => expect(wartoscNaEkranie()).toBe('5'));
  expect(await screen.findByText('Row 6: ujmowanie')).toBeTruthy(); // przed usunięciem pas jest
  przed.unmount();

  mockParams = { rodzaj: 'przypomnienie-edycja', przypomnienie: 'pr1' };
  render(<EkranFormularza />);
  await czekaj();
  fireEvent.press(screen.getByTestId('przypomnienie-usun'));
  expect(alert).toHaveBeenCalledTimes(1);
  expect(alert.mock.calls[0]?.[0]).toBe('Delete this reminder?');
  expect(alert.mock.calls[0]?.[1]).toBe('Oczko stops reminding you about “ujmowanie”. Your count and history stay as they are.');
  expect(await jeden(s.baza, 'SELECT count(*) AS n FROM przypomnienie')).toEqual({ n: 1 }); // do potwierdzenia nic nie usunięte
  const usun = alert.mock.calls[0]?.[2]?.find((p) => p.style === 'destructive');
  await act(async () => { usun?.onPress?.(); await new Promise((r) => setTimeout(r, 150)); });
  expect(await jeden(s.baza, 'SELECT count(*) AS n FROM przypomnienie')).toEqual({ n: 0 });
  screen.unmount();

  mockParams = { arkusz: 'cel' };
  render(<EkranMenu />);
  await czekaj();
  expect(screen.getByTestId('menu-przypomnienie')).toBeTruthy();
  expect(screen.queryByTestId('menu-przypomnienia')).toBeNull();
  screen.unmount();

  render(<EkranLicznika />);
  await waitFor(() => expect(wartoscNaEkranie()).toBe('5'));
  expect(screen.queryByText(/ujmowanie/)).toBeNull();
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(wartoscNaEkranie()).toBe('6'));
  expect(screen.queryByText(/ujmowanie/)).toBeNull(); // po +1 też bez pasa przypomnienia
  alert.mockRestore();
});
