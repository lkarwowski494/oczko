// PU-022, PU-024, PU-276, PU-277 (katalog przypadków użycia, „Licznik”): historia licznika — cofnięcie ostatniej zmiany, zerowanie z cofnięciem, cofnięcie serii,
// poprawa starszego wpisu przez „Enter the right number”. Trasy app/historia, app/menu i app/formularz/[rodzaj] na prawdziwej bazie i kompozycji licznika (atrapy tylko na granicy platformy).
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import { tekst } from './pomoc';
import type { PortBazy } from '../../src/domena/porty';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(),
  useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, usePathname: () => '/',
  useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); }, // eslint-disable-line @typescript-eslint/no-require-imports
}));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranHistorii = (require('../../app/historia') as { default: React.ComponentType }).default;
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
const EkranMenu = (require('../../app/menu') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const GODZ_WPISOW = Date.UTC(2026, 9, 22, 8);
async function start(n: number) {
  const { s, k, j } = await kompozycjaTestowa();
  s.pro.wartosc = true;
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', n, { t: GODZ_WPISOW })]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  Object.values(mockRouter).forEach((f) => f.mockClear());
  s.zegar.ustaw(Date.UTC(2026, 9, 22, 12)); // nowe +1 po godzinach wpisów początkowych: nie tworzą serii z nimi
  return { s, k };
}
const wartosc = async (k: Awaited<ReturnType<typeof start>>['k']) => (await k.widok())?.wartosc;
const wpisyTekst = () => screen.queryAllByText(/→/).map((e) => tekst(e));

// PU-022: lista z „z → na”, najnowszy u góry; „Undo” przy najnowszym → licznik wraca do 3, wpis oznaczony „Undone”, a cofnięcie jest nowym wpisem „(undone)”.
test('PU-022: po +1 z 3 do 4 historia ma najnowszy wpis „3 → 4” u góry; „Undo” przywraca licznik 3 i oznacza wpis „Undone” z nowym wpisem „(undone)”', async () => {
  const { k } = await start(3);
  await k.uslugi.dodajRzad();
  expect(await wartosc(k)).toBe(4);
  render(<EkranHistorii />);
  const wpisy = await screen.findAllByText(/→/);
  expect(tekst(wpisy[0])).toMatch(/^\d{1,2}:\d{2}.* · 3 → 4$/); // godzina i „z → na”, najnowszy pierwszy
  expect(tekst(wpisy[1])).toMatch(/ · 2 → 3$/);
  fireEvent.press(screen.getByTestId('historia-cofnij-ostatnia'));
  await waitFor(() => expect(screen.getAllByText(/Undone/).length).toBe(1));
  expect(await wartosc(k)).toBe(3);
  expect(wpisyTekst().slice(0, 2)).toEqual([expect.stringMatching(/ · 4 → 3 \(undone\)$/), expect.stringMatching(/ · 3 → 4$/)]); // cofnięcie to nowy wpis na górze
  expect(screen.getAllByText(/· Undone/)).toHaveLength(1); // oryginalny wpis „3 → 4” oznaczony
});

// PU-024: 10 rzędów, w tym seria z banerem → „Reset to 0…” → pytanie z historią → po potwierdzeniu 0 i bez banera → „Undo” przy zerowaniu przywraca 10.
test('PU-024: „Reset to 0…” pyta „Reset Sweter to 0? The history keeps every change.”; po potwierdzeniu licznik 0 bez banera serii, a „Undo” przy zerowaniu przywraca 10', async () => {
  const { k } = await start(7);
  const ekranLicznika = render(<EkranLicznika />);
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('7'));
  for (let i = 8; i <= 10; i++) { fireEvent.press(screen.getByTestId('licznik-plus')); await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe(String(i))); }
  expect(await screen.findByTestId('baner-serii')).toBeTruthy(); // seria 3 stuknięć w oknie strażnika: baner jest, więc jego brak po zerowaniu coś znaczy
  ekranLicznika.unmount();

  mockParams = {};
  const menu = render(<EkranMenu />);
  fireEvent.press(await screen.findByTestId('menu-zeruj'));
  expect(screen.getByText('Reset Sweter to 0? The history keeps every change.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Reset to 0')); await new Promise((r) => setTimeout(r, 120)); });
  expect(await wartosc(k)).toBe(0);
  menu.unmount();
  render(<EkranLicznika />);
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('0'));
  expect(screen.queryByTestId('baner-serii')).toBeNull();
  screen.unmount();

  render(<EkranHistorii />);
  expect(tekst(await screen.findByText(/→ 0 \(reset\)/))).toMatch(/ · 10 → 0 \(reset\)$/);
  fireEvent.press(screen.getByTestId('historia-cofnij-ostatnia'));
  await waitFor(async () => expect(await wartosc(k)).toBe(10));
});

// PU-276: seria 3 stuknięć → w historii wpis „3 rows in …” z przyciskiem „Undo 3 rows”; po cofnięciu wartość sprzed serii, wpis „Undone”.
test('PU-276: seria 3 × +1 z 6 → historia „3 rows in …” z „Undo 3 rows”; po stuknięciu licznik wraca do 6, a wpis serii jest oznaczony „Undone”', async () => {
  const { k } = await start(6);
  for (let i = 0; i < 3; i++) await k.uslugi.dodajRzad(); // zegar stały: jedna seria w oknie strażnika
  expect(await wartosc(k)).toBe(9);
  render(<EkranHistorii />);
  expect(await screen.findByText(/· 3 rows in .*· 6 → 9$/)).toBeTruthy();
  expect(screen.queryByText('Undone')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Undo 3 rows' }));
  await waitFor(async () => expect(await wartosc(k)).toBe(6));
  await waitFor(() => expect(screen.getAllByText(/Undone/).length).toBeGreaterThan(0));
  expect(screen.queryByTestId('historia-cofnij-serie')).toBeNull();
});

// PU-277: starszy wpis nie ma „Undo”; „More about …” → wyjaśnienie → „Enter the right number” → „Enter the row number”, 5 → licznik 5 i nowy wpis „(entered)”.
test('PU-277: starszy wpis → rozwinięcie „Only the latest change can be undone…” → „Enter the right number” → formularz „Enter the row number”, 5 → licznik 5 i wpis „(entered)”', async () => {
  const { s, k } = await start(0);
  for (const dt of [0, 600_000, 1_200_000]) { s.zegar.ustaw(Date.UTC(2026, 9, 22, 12) + dt); await k.uslugi.dodajRzad(); } // odstępy większe niż okno strażnika
  expect(await wartosc(k)).toBe(3);
  const historia = render(<EkranHistorii />);
  await screen.findByTestId('historia-cofnij-ostatnia');
  fireEvent.press(screen.getAllByTestId(/^historia-rozwin-/)[0]); // drugi od góry wpis, czyli pierwszy starszy
  expect(screen.getByText('Only the latest change can be undone. To fix this one, enter the right number.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('historia-wpisz'));
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'wpisz' } });
  historia.unmount();

  mockParams = { rodzaj: 'wpisz' };
  render(<EkranFormularza />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  expect(screen.getByText('Enter the row number')).toBeTruthy();
  fireEvent.changeText(screen.getByTestId('wpisz-wartosc-pole'), '5');
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 120)); });
  expect(mockRouter.back).toHaveBeenCalled();
  expect(await wartosc(k)).toBe(5);
  screen.unmount();
  render(<EkranHistorii />);
  expect(tekst(await screen.findByText(/→ 5 \(entered\)/))).toMatch(/ · 3 → 5 \(entered\)$/);
});

// PU-275: „Lock counter” → w menu „Reset to 0…” wyłączone z linią „Unlock the counter to reset it.”, wartość bez zmian → „Unlock counter” → pasek blokady znika i +1 działa.
test('PU-275: zablokowany licznik: „Reset to 0…” wyłączone z linią „Unlock the counter to reset it.” i wartość stała; po „Unlock counter” pasek znika, a +1 dodaje rząd', async () => {
  const { k } = await start(5);
  mockParams = {};
  const przejdz = () => act(async () => { await new Promise((r) => setTimeout(r, 120)); });
  render(<EkranMenu />);
  fireEvent.press(await screen.findByTestId('menu-zablokuj'));
  await przejdz();
  screen.unmount();

  render(<EkranMenu />);
  const zeruj = await screen.findByTestId('menu-zeruj');
  expect(zeruj.props.accessibilityState).toMatchObject({ disabled: true });
  expect(screen.getAllByText('Unlock the counter to reset it.').length).toBeGreaterThan(0);
  fireEvent.press(zeruj);
  expect(screen.queryByText('Reset to 0')).toBeNull(); // pytanie o zerowanie się nie otwiera
  expect(await wartosc(k)).toBe(5);
  screen.unmount();

  const licznikZablokowany = render(<EkranLicznika />);
  await screen.findByTestId('pasek-blokady-odblokuj');
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await przejdz();
  expect(await wartosc(k)).toBe(5); // stuknięcia ignorowane
  licznikZablokowany.unmount();

  render(<EkranMenu />);
  fireEvent.press(await screen.findByTestId('menu-odblokuj'));
  await przejdz();
  screen.unmount();

  render(<EkranLicznika />);
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('5'));
  expect(screen.queryByTestId('pasek-blokady-odblokuj')).toBeNull();
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('6'));
});

// PU-026: „What the number shows” → „The row I’m on” → Save: przy 10 skończonych liczba 11 z opisem, historia bez nowego wpisu; powrót do „Rows finished” → znów 10.
test('PU-026: znaczenie „The row I’m on” przy 10 pokazuje 11 z opisem „11 means you’re working on row 11.”, bez nowego wpisu historii; powrót do „Rows finished” → znów 10', async () => {
  const { s, k } = await start(10);
  const przejdz = () => act(async () => { await new Promise((r) => setTimeout(r, 120)); });
  const liczbaNaEkranie = () => screen.getByTestId('licznik-wartosc').props.accessibilityLabel as string;
  const wpisow = async () => (await s.baza.all<{ n: number }>('SELECT count(*) n FROM zdarzenie'))[0].n;
  const zdarzenPrzed = await wpisow();
  mockParams = { rodzaj: 'znaczenie' };
  render(<EkranFormularza />);
  await przejdz();
  expect(screen.getByText('10 means 10 rows are done.')).toBeTruthy(); // opis stanu wyjściowego (skończone)
  fireEvent.press(screen.getByTestId('wybor-znaczenie-w-trakcie'));
  expect(screen.getByText('11 means you’re working on row 11.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 120)); });
  expect(mockRouter.back).toHaveBeenCalled();
  screen.unmount();

  render(<EkranLicznika />);
  await waitFor(() => expect(liczbaNaEkranie()).toBe('11'));
  expect(await wpisow()).toBe(zdarzenPrzed); // zmiana znaczenia nie jest wpisem historii
  screen.unmount();

  render(<EkranFormularza />);
  await przejdz();
  fireEvent.press(screen.getByTestId('wybor-znaczenie-skonczone'));
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 120)); });
  screen.unmount();
  render(<EkranLicznika />);
  await waitFor(() => expect(liczbaNaEkranie()).toBe('10'));
  expect(await wpisow()).toBe(zdarzenPrzed);
  expect((await k.widok())?.wartosc).toBe(10);
});
