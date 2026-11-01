// 07-jakosc-004 (ADR-0029, K-04b/c/d/g) przez trasy „/ustawienia” i „/miary”: wiersze Vibration, Keep screen on, Units; zapis w bazie przetrwa restart.
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { preferencje } from '../../src/kompozycja/preferencje';
import { przygotuj, zArchiwum } from '../dane/pomocnicze/srodowisko';
import { przycisk, tEn } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []), useLocalSearchParams: () => ({}) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: {} }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranMiar = (require('../../app/miary') as { default: React.ComponentType }).default;

async function aplikacja(zepsutyZapis = false) {
  const t = await tEn();
  const s = await przygotuj();
  const p = preferencje();
  const z = zArchiwum(s.z);
  const zapis = zepsutyZapis ? { ...z, baza: { ...z.baza, transakcja: () => Promise.reject(new Error('SQLITE_FULL')), run: z.baza.run, all: z.baza.all } } : z;
  mockAplikacja = {
    kontener: { z: zapis, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog, dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined } },
    licznik: { zresetuj: jest.fn(), poZmianie: jest.fn() }, preferencje: { stan: p.stan, wczytaj: () => p.wczytaj(z), zapisz: (_z: unknown, zmiana: Parameters<typeof p.zapisz>[1]) => p.zapisz(zapis, zmiana) },
  };
  return { s, z, p };
}
const poRestarcie = async (z: Awaited<ReturnType<typeof aplikacja>>['z']) => { const p = preferencje(); await p.wczytaj(z); return p.stan(); };

beforeEach(() => { jest.clearAllMocks(); });

test('004 (design-spec): wiersze preferencji są pod nagłówkiem grupy „Counting”', async () => {
  await aplikacja();
  render(<EkranUstawien />);
  expect(screen.getByRole('header', { name: 'Counting' })).toBeTruthy();
});
test('K-04b: przełącznik Vibration zapisuje się w bazie i przetrwa restart', async () => {
  const { z } = await aplikacja();
  render(<EkranUstawien />);
  fireEvent(screen.getByRole('switch', { name: 'Vibration' }), 'valueChange', false);
  await waitFor(async () => expect((await poRestarcie(z)).wibracje).toBe(false));
});
test('K-04c: wiersz „Keep screen on while counting” (z opisem) — wyłączenie zapisuje się w bazie i przetrwa restart', async () => {
  const { z } = await aplikacja();
  render(<EkranUstawien />);
  expect(screen.getByText('The screen stays on while the counter is open. Turning it off can save battery.')).toBeTruthy();
  expect(screen.getByRole('switch', { name: 'Keep screen on while counting' }).props.value).toBe(true);
  fireEvent(screen.getByRole('switch', { name: 'Keep screen on while counting' }), 'valueChange', false);
  await waitFor(async () => expect((await poRestarcie(z)).ekranNieGasnie).toBe(false));
});
test('K-04d: wiersz „Units” pokazuje „Automatic” i prowadzi do /miary; wybór „Imperial” zapisuje się, przetrwa restart i wraca', async () => {
  const { z } = await aplikacja();
  const w = render(<EkranUstawien />);
  expect(screen.getByRole('button', { name: 'Units' })).toBeTruthy();
  expect(screen.getByText('Automatic')).toBeTruthy();
  await userEvent.press(screen.getByRole('button', { name: 'Units' }));
  expect(mockRouter.push).toHaveBeenCalledWith('/miary');
  w.unmount();
  render(<EkranMiar />);
  expect(screen.getByText('Changes how sizes and lengths are shown and entered. Your saved data doesn’t change.')).toBeTruthy();
  await userEvent.press(screen.getByRole('radio', { name: /Imperial/ }));
  await waitFor(async () => expect((await poRestarcie(z)).ukladMiar).toBe('imperial'));
  expect(mockRouter.back).toHaveBeenCalled();
});
test('K-04g: błąd zapisu → przełącznik wraca do poprzedniej wartości i jest komunikat „Couldn’t save that row…”', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { z } = await aplikacja(true);
  render(<EkranUstawien />);
  fireEvent(screen.getByRole('switch', { name: 'Vibration' }), 'valueChange', false);
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(alert.mock.calls[0][1]).toBe('Couldn’t save that row. It’s still on screen; try again.');
  expect(screen.getByRole('switch', { name: 'Vibration' }).props.value).toBe(true);
  expect((await poRestarcie(z)).wibracje).toBe(true);
});
void przycisk;
