// G-1 (aneks partii 8 poz. 8, reguła 07-jakosc-025; P-360/P-361), po M3 p3a: licznik oczek nie ma Goal, Repeat, trybu rzędu ani Reminders; licznik rzędów je ma. Pozycje wspólne zostają w obu.
// M3 p3a (ZM-05, P-581 a): Goal, Repeat i Reminders przeszły z menu ••• do arkusza „Cel” (`MenuCel`, akcja `licznik-cel`; licznik oczek tej akcji nie ma — tests/ekrany/licznik-akcje.test.tsx),
// w ••• zostaje „tryb rzędu” (`menu-znaczenie`). Sprawdzane po widocznym tekście en i po testID (obie ścieżki, które zna E2E).
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MenuCel, MenuProjektu, type PropsMenuProjektu } from '../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const akcje = () => ({ naNazwa: jest.fn(), naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naZamknij: jest.fn(), naZnaczenie: jest.fn() });
const menu = (stan: Partial<PropsMenuProjektu['stan']>) => render(<MenuProjektu stan={{ projekt: 'Harbor', zablokowany: false, wartosc: 23, ...stan }} t={t} {...akcje()} />);
const cel = (przypomnienia: number) => render(<MenuCel stan={{ projekt: 'Harbor', przypomnienia }} t={t} naCel={jest.fn()} naPrzypomnienie={jest.fn()} naPrzypomnienia={jest.fn()} naPowtorzenie={jest.fn()} naZamknij={jest.fn()} />);

describe('tryb rzędu (w •••)', () => {
  test('licznik oczek: pozycji nie ma (testID ani tekst)', () => {
    menu({ oczka: true });
    expect(screen.queryByTestId('menu-znaczenie')).toBeNull();
    expect(screen.queryByText('What the number shows')).toBeNull();
    expect(screen.queryByLabelText('What the number shows')).toBeNull();
  });
  test('licznik rzędów: pozycja jest', () => {
    menu({});
    expect(screen.getByTestId('menu-znaczenie')).toBeTruthy();
  });
});

// [pozycja, testID, widoczny tekst en, przypomnienia w stanie] — arkusz „Cel” licznika rzędów
const W_ARKUSZU_CEL: [string, string, string, number][] = [
  ['Goal', 'menu-cel', 'Set a goal for this part', 0],
  ['Repeat', 'menu-powtorzenie', 'Set a repeat length', 0],
  ['Reminders (dodaj)', 'menu-przypomnienie', 'Add a reminder (“every N rows”)', 0],
  ['Reminders (lista, 2 plany)', 'menu-przypomnienia', 'Reminders, 2', 2],
];
describe.each(W_ARKUSZU_CEL)('%s', (_nazwa, id, tekst, plany) => {
  test('licznik rzędów: pozycja jest w arkuszu „Cel”, nie w •••', () => {
    cel(plany);
    expect(screen.getByTestId(id)).toBeTruthy();
    screen.unmount();
    menu({});
    expect(screen.queryByTestId(id)).toBeNull();
    expect(screen.queryByText(tekst)).toBeNull();
  });
});

const WSPOLNE = ['menu-nazwa', 'menu-wpisz-wartosc', 'menu-ukoncz'];
test('licznik oczek zostawia pozycje wspólne i blokadę oraz zerowanie; „Wzór” to akcja pod liczbą, nie pozycja menu', () => {
  menu({ oczka: true });
  for (const id of WSPOLNE) expect(screen.getByTestId(id)).toBeTruthy();
  expect(screen.queryByTestId('menu-wzor')).toBeNull();
  expect(screen.getByText('Lock counter (ignore taps)')).toBeTruthy();
  expect(screen.getByText('Reset to 0…')).toBeTruthy();
});
test('licznik rzędów ma pozycje wspólne i „tryb rzędu” w •••, resztę rzędowych w arkuszu „Cel”', () => {
  menu({});
  for (const id of [...WSPOLNE, 'menu-znaczenie']) expect(screen.getByTestId(id)).toBeTruthy();
  screen.unmount();
  cel(0);
  for (const id of ['menu-cel', 'menu-przypomnienie', 'menu-powtorzenie']) expect(screen.getByTestId(id)).toBeTruthy();
});
