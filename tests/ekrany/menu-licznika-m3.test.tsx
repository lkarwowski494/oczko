// M3 p3a (ZM-05, P-581 (a), P-586 (1a)): menu ••• licznika to własny arkusz z 6 pozycjami w 2 grupach bez nagłówków; „Cel” (akcja pod liczbą) otwiera osobny arkusz
// z celem, przypomnieniem i powtórzeniem. Wyrocznia: docs/design/testid.md M3-TESTID-02 (tabela „Menu •••”, STOP-1 a): korekta — nazwa, numer rzędu, znaczenie liczby,
// zerowanie (ostatnie, destrukcyjne, z potwierdzeniem); stan — blokada/odblokowanie, ukończenie; `menu-grupa-*` i `menu-wzor` nie istnieją.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MenuCel, MenuProjektu, type PropsMenuProjektu } from '../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const akcje = () => ({ naNazwa: jest.fn(), naWpisz: jest.fn(), naZnaczenie: jest.fn(), naZeruj: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naUkoncz: jest.fn(), naZamknij: jest.fn() });
const menu = (stan: Partial<PropsMenuProjektu['stan']> = {}) => {
  const a = akcje();
  render(<MenuProjektu stan={{ projekt: 'Harbor', zablokowany: false, wartosc: 23, ...stan }} t={t} {...a} />);
  return a;
};
const kolejnosc = (ids: string[]) => {
  const wszystkie = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
  return ids.map((id) => wszystkie.indexOf(id));
};
/** Przodkowie elementu od korzenia w dół (węzły drzewa testowego). */
const przodkowie = (id: string) => { const l: unknown[] = []; for (let n = screen.getByTestId(id) as { parent: unknown }; n; n = n.parent as { parent: unknown }) l.unshift(n); return l; };
/** Głębokość najniższego wspólnego przodka dwóch pozycji: im głębiej, tym bliżej siebie (ta sama grupa). */
const wspolny = (a: string, b: string) => { const x = przodkowie(a), y = przodkowie(b); let i = 0; while (i < x.length && i < y.length && x[i] === y[i]) i++; return i; };

describe('menu •••: 6 pozycji w 3 grupach', () => {
  // Zastąpiony jawnie (009, P-614 (4), zadania-08 poz. 9; `docs/programista/m3-fix-e5-zastapione-testy.md`): zerowanie we własnej, trzeciej grupie na końcu.
  test('korekta (nazwa, numer rzędu, znaczenie liczby), potem stan (blokada, ukończenie), na końcu zerowanie', () => {
    menu();
    const poz = kolejnosc(['menu-nazwa', 'menu-wpisz-wartosc', 'menu-znaczenie', 'menu-zablokuj', 'menu-ukoncz', 'menu-zeruj']);
    expect(poz.every((p) => p >= 0)).toBe(true);
    expect([...poz].sort((a, b) => a - b)).toEqual(poz);
  });

  // Zastąpiony jawnie (009, P-614 (4)): trzy grupy zamiast dwóch; testID grup kontraktu (`menu-grupa-liczenie`, `menu-grupa-projekt`) nadal nie istnieją.
  test('trzy grupy: korekta, stan, zerowanie (wspólny przodek wewnątrz grupy głębszy niż między grupami); bez testID grup kontraktu', () => {
    menu();
    const wGrupie = [wspolny('menu-nazwa', 'menu-znaczenie'), wspolny('menu-zablokuj', 'menu-ukoncz')];
    expect(wGrupie[0]).toBeGreaterThan(wspolny('menu-nazwa', 'menu-zablokuj'));
    expect(wGrupie[1]).toBeGreaterThan(wspolny('menu-ukoncz', 'menu-zeruj'));
    expect(screen.queryByTestId('menu-grupa-liczenie')).toBeNull();
    expect(screen.queryByTestId('menu-grupa-projekt')).toBeNull();
  });

  test('przeniesione i wycofane: `menu-wzor` (akcja „Wzór”), `menu-cel`, `menu-przypomnienie(a)`, `menu-powtorzenie` (arkusz „Cel”) nie są w •••', () => {
    menu();
    for (const id of ['menu-wzor', 'menu-cel', 'menu-przypomnienie', 'menu-przypomnienia', 'menu-powtorzenie']) expect(screen.queryByTestId(id)).toBeNull();
  });

  test('pozycje wołają swoje działania', () => {
    const a = menu();
    for (const id of ['menu-nazwa', 'menu-wpisz-wartosc', 'menu-znaczenie', 'menu-zablokuj', 'menu-ukoncz']) fireEvent.press(screen.getByTestId(id));
    expect([a.naNazwa, a.naWpisz, a.naZnaczenie, a.naZablokuj, a.naUkoncz].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1, 1]);
  });

  test('zerowanie dopiero po potwierdzeniu w arkuszu (BR-LIC-017/S6)', () => {
    const a = menu();
    fireEvent.press(screen.getByTestId('menu-zeruj'));
    expect(a.naZeruj).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText(t('menu.zeruj_potwierdz')));
    expect(a.naZeruj).toHaveBeenCalledTimes(1);
  });

  test('licznik zablokowany: „Unlock” zamiast „Lock”, zerowanie wyłączone', () => {
    menu({ zablokowany: true });
    expect(screen.getByTestId('menu-odblokuj')).toBeTruthy();
    expect(screen.queryByTestId('menu-zablokuj')).toBeNull();
    expect(screen.getByTestId('menu-zeruj')).toBeDisabled();
  });

  test('licznik oczek: bez „znaczenie liczby”, reszta jest (zerowanie, blokada, ukończenie, nazwa, numer)', () => {
    menu({ oczka: true });
    expect(screen.queryByTestId('menu-znaczenie')).toBeNull();
    for (const id of ['menu-nazwa', 'menu-wpisz-wartosc', 'menu-zeruj', 'menu-zablokuj', 'menu-ukoncz']) expect(screen.getByTestId(id)).toBeTruthy();
  });
});

describe('arkusz „Cel”: cel, przypomnienie, powtórzenie', () => {
  const cel = (stan: { projekt?: string; przypomnienia?: number } = {}) => {
    const a = { naCel: jest.fn(), naPrzypomnienie: jest.fn(), naPrzypomnienia: jest.fn(), naPowtorzenie: jest.fn(), naZamknij: jest.fn() };
    render(<MenuCel stan={{ projekt: 'Harbor', przypomnienia: 0, ...stan }} t={t} {...a} />);
    return a;
  };
  test('trzy pozycje w kolejności: cel części, przypomnienie, długość powtórzenia; stuknięcia wołają działania', () => {
    const a = cel();
    const poz = kolejnosc(['menu-cel', 'menu-przypomnienie', 'menu-powtorzenie']);
    expect(poz.every((p) => p >= 0)).toBe(true);
    expect([...poz].sort((x, y) => x - y)).toEqual(poz);
    for (const id of ['menu-cel', 'menu-przypomnienie', 'menu-powtorzenie']) fireEvent.press(screen.getByTestId(id));
    expect([a.naCel, a.naPrzypomnienie, a.naPowtorzenie].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  });
  test('są plany przypomnień: zamiast „Dodaj” wiersz z listą i liczbą (`menu-przypomnienia`)', () => {
    const a = cel({ przypomnienia: 2 });
    expect(screen.queryByTestId('menu-przypomnienie')).toBeNull();
    fireEvent.press(screen.getByTestId('menu-przypomnienia'));
    expect(a.naPrzypomnienia).toHaveBeenCalledTimes(1);
  });
  test('arkusz nie ma pozycji z •••: nazwa, numer rzędu, zerowanie, blokada, ukończenie', () => {
    cel();
    for (const id of ['menu-nazwa', 'menu-wpisz-wartosc', 'menu-zeruj', 'menu-zablokuj', 'menu-ukoncz', 'menu-wzor']) expect(screen.queryByTestId(id)).toBeNull();
  });
  test('zamknięcie: „Cancel” (`arkusz-zamknij`) woła naZamknij', () => {
    const a = cel();
    fireEvent.press(screen.getByTestId('arkusz-zamknij'));
    expect(a.naZamknij).toHaveBeenCalledTimes(1);
  });
});
