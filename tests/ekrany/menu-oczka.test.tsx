// G-1 (aneks partii 8 poz. 8, reguła 07-jakosc-025; P-360/P-361): menu ••• licznika oczek nie ma Goal, Repeat, trybu rzędu ani Reminders (ani w wersji „dodaj”, ani z liczbą planów);
// licznik rzędów ma je wszystkie. Pozycje wspólne zostają w obu. Sprawdzane po widocznym tekście en i po testID (obie ścieżki, które zna E2E).
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MenuProjektu, type PropsMenuProjektu } from '../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const akcje = () => ({ naNazwa: jest.fn(), naCel: jest.fn(), naPrzypomnienie: jest.fn(), naPrzypomnienia: jest.fn(), naPowtorzenie: jest.fn(), naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naWzor: jest.fn(), naZnaczenie: jest.fn(), naZamknij: jest.fn() });
const menu = (stan: Partial<PropsMenuProjektu['stan']>) => render(<MenuProjektu stan={{ projekt: 'Harbor', zablokowany: false, wartosc: 23, ...stan }} t={t} {...akcje()} />);

// [pozycja, testID, widoczny tekst en, przypomnienia w stanie]
const TYLKO_RZEDY: [string, string, string, number][] = [
  ['Goal', 'menu-cel', 'Set a goal for this part', 0],
  ['Repeat', 'menu-powtorzenie', 'Set a repeat length', 0],
  ['tryb rzędu', 'menu-znaczenie', 'What the number shows', 0],
  ['Reminders (dodaj)', 'menu-przypomnienie', 'Add a reminder (“every N rows”)', 0],
  ['Reminders (lista, 2 plany)', 'menu-przypomnienia', 'Reminders, 2', 2],
];
const WSPOLNE = ['menu-nazwa', 'menu-wpisz-wartosc', 'menu-wzor', 'menu-ukoncz'];

describe.each(TYLKO_RZEDY)('%s', (_nazwa, id, tekst, plany) => {
  test('licznik oczek: pozycji nie ma (testID ani tekst)', () => {
    menu({ oczka: true, przypomnienia: plany });
    expect(screen.queryByTestId(id)).toBeNull();
    expect(screen.queryByText(tekst)).toBeNull();
    expect(screen.queryByLabelText(tekst)).toBeNull();
  });
  test('licznik rzędów: pozycja jest', () => {
    menu({ przypomnienia: plany });
    expect(screen.getByTestId(id)).toBeTruthy();
  });
});

test('licznik oczek zostawia pozycje wspólne i blokadę oraz zerowanie', () => {
  menu({ oczka: true, przypomnienia: 2 });
  for (const id of WSPOLNE) expect(screen.getByTestId(id)).toBeTruthy();
  expect(screen.getByText('Lock counter (ignore taps)')).toBeTruthy();
  expect(screen.getByText('Reset to 0…')).toBeTruthy();
});
test('licznik rzędów ma pozycje wspólne i wszystkie pozycje tylko dla rzędów naraz', () => {
  menu({ przypomnienia: 0 });
  for (const id of [...WSPOLNE, ...TYLKO_RZEDY.filter((x) => x[3] === 0).map((x) => x[1])]) expect(screen.getByTestId(id)).toBeTruthy();
});
