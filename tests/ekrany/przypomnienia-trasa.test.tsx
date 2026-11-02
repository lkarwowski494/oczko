// 07-jakosc-011 (F-06, BR-LIC-009, P-330 wariant A): „Reminders” w menu ••• → lista → edycja i usunięcie. Trasy app/menu i app/formularz/[rodzaj] na prawdziwej bazie.
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt, przypomnienie } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { ile, wykonaj } from '../dane/pomocnicze/srodowisko';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
let mockParams: Record<string, string> = {};
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); } })); // useFocusEffect: odświeżenie zapasu w app/formularz/[rodzaj].tsx (07-jakosc-001, partia 8c)
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranMenu = (require('../../app/menu') as { default: React.ComponentType }).default;
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

async function start(przypomnienia: 0 | 1 | 2, ekran: React.ComponentType, params: Record<string, string> = {}) {
  const { s, k, j } = await kompozycjaTestowa();
  const pr = [przypomnienie('pr1', 'l1'), ['INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES (\'pr2\', \'l1\', 12, 1, 3, \'Check the length\', 1)', []] as [string, unknown[]]].slice(0, przypomnienia);
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), ...pr]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  mockParams = params;
  Object.values(mockRouter).forEach((f) => f.mockClear());
  render(React.createElement(ekran));
  await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
  return { s, k };
}

describe('menu •••: pozycja przypomnień', () => {
  test('bez przypomnień: „Add a reminder…” jak dotąd, bez „Reminders”', async () => {
    await start(0, EkranMenu);
    expect(screen.getByTestId('menu-przypomnienie')).toBeTruthy();
    expect(screen.queryByTestId('menu-przypomnienia')).toBeNull();
  });
  test('z przypomnieniami: „Reminders” z liczbą zastępuje „Add a reminder…” i otwiera listę', async () => {
    await start(2, EkranMenu);
    expect(screen.queryByTestId('menu-przypomnienie')).toBeNull();
    const poz = screen.getByTestId('menu-przypomnienia');
    expect(screen.getByText('Reminders')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    fireEvent.press(poz);
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'przypomnienia' } });
  });
});

describe('lista przypomnień', () => {
  test('wiersz = instrukcja + „From row …, every … rows, …×”; stuknięcie otwiera edycję, „Add” — formularz dodawania', async () => {
    await start(2, EkranFormularza, { rodzaj: 'przypomnienia' });
    expect(screen.getByText('Tap a reminder to change or delete it.')).toBeTruthy();
    expect(screen.getByText('From row 6, every 6 rows, 5×')).toBeTruthy();
    expect(screen.getByText('From row 12, every row, 3×')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Check the length, From row 12, every row, 3×. Edit'));
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'przypomnienie-edycja', przypomnienie: 'pr2' } });
    fireEvent.press(screen.getByText('Add'));
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'przypomnienie' } });
  });
});

describe('edycja i usunięcie przypomnienia', () => {
  test('Edit reminder: pola z bieżącego przypomnienia; Save zmienia ten sam wiersz i zamyka arkusz', async () => {
    const { s } = await start(1, EkranFormularza, { rodzaj: 'przypomnienie-edycja', przypomnienie: 'pr1' });
    expect(screen.getByText('Edit reminder')).toBeTruthy();
    expect(screen.getByTestId('przypomnienie-od-rzedu').props.value).toBe('6');
    fireEvent.changeText(screen.getByTestId('przypomnienie-co-ile'), '4');
    fireEvent.changeText(screen.getByTestId('przypomnienie-co-robic'), 'decrease at both ends');
    await act(async () => { fireEvent.press(screen.getByTestId('przypomnienie-zapisz')); await new Promise((r) => setTimeout(r, 120)); });
    expect(mockRouter.back).toHaveBeenCalled();
    const w = await widokLicznika(s.z, { licznikId: 'l1' });
    expect(w).toMatchObject({ ok: true, wartosc: { plany: [{ id: 'pr1', od: 6, co: 4, razy: 5, tekst: 'decrease at both ends' }] } });
  });
  test('Delete reminder: pytanie z treścią instrukcji, po potwierdzeniu przypomnienia nie ma, licznik zostaje', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { s } = await start(1, EkranFormularza, { rodzaj: 'przypomnienie-edycja', przypomnienie: 'pr1' });
    fireEvent.press(screen.getByText('Delete reminder'));
    expect(alert).toHaveBeenCalledTimes(1);
    const [tytul, opis, przyciski] = alert.mock.calls[0] ?? [];
    expect(tytul).toBe('Delete this reminder?');
    expect(opis).toBe('Oczko stops reminding you about “ujmowanie”. Your count and history stay as they are.');
    const usun = przyciski?.find((p) => p.style === 'destructive');
    expect(usun?.text).toBe('Delete reminder');
    expect(await ile(s.baza, 'przypomnienie')).toBe(1); // jeszcze nic nie usunięto
    await act(async () => { usun?.onPress?.(); await new Promise((r) => setTimeout(r, 120)); });
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(await ile(s.baza, 'przypomnienie')).toBe(0);
    expect(await widokLicznika(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 5, przypomnienie: null } });
    alert.mockRestore();
  });
});
