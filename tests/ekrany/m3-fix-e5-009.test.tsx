// 009 (P-614 (4), zadania-08 poz. 9, design-spec „Fix E5”): menu jako lista bez obrysów przycisków.
// Arkusz menu (••• licznika, „Cel”) = lista grupowana (`menu.arkusz`): grupy [nazwa, wpisz, znaczenie] [zablokuj/odblokuj, ukończ] [wyzeruj…], pozycje 44, podziałka `linia`,
// „Anuluj” w lewym górnym rogu nad przewijaną treścią, tło arkusza `tlo`. Menu pływające („+” i ••• projektu, źródło zdjęcia) = `menu.plywajace` (250, 44, cień). testID bez zmian.
// Wzór: `docs/design/dzianina/ekrany.html` `licznik-menu` (`.ark-m`), `projekt-menu` (`.pr-menu`).
import React from 'react';
import * as RN from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { MenuCel, MenuProjektu, type PropsMenuProjektu } from '../../src/ekrany/MenuProjektu';
import { Projekt, type PropsProjektu } from '../../src/ekrany/Projekt';
import { GrupaZdjec } from '../../src/ekrany/Zdjecia';
import { kolorJasny } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const AX3 = 2.643;
const m = tokeny.menu;
const paleta = kolorJasny;

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { mockSkala = 1; jest.spyOn(RN, 'useColorScheme').mockReturnValue('light'); });
afterEach(() => jest.restoreAllMocks());

const styl = (el: { props: { style?: unknown } }): RN.ViewStyle & RN.TextStyle => (RN.StyleSheet.flatten(el.props.style as RN.StyleProp<RN.ViewStyle & RN.TextStyle>) ?? {}) as RN.ViewStyle & RN.TextStyle;
const akcje = () => ({ naNazwa: jest.fn(), naWpisz: jest.fn(), naZnaczenie: jest.fn(), naZeruj: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naUkoncz: jest.fn(), naZamknij: jest.fn() });
const menu = (stan: Partial<PropsMenuProjektu['stan']> = {}) => render(<MenuProjektu stan={{ projekt: 'Harbor', zablokowany: false, wartosc: 23, ...stan }} t={t} {...akcje()} />);
const kolejnosc = (ids: string[]) => {
  const wszystkie = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
  return ids.map((id) => wszystkie.indexOf(id));
};
const przodkowie = (id: string) => { const l: unknown[] = []; for (let n = screen.getByTestId(id) as { parent: unknown }; n; n = n.parent as { parent: unknown }) l.unshift(n); return l; };
const wspolny = (a: string, b: string) => { const x = przodkowie(a), y = przodkowie(b); let i = 0; while (i < x.length && i < y.length && x[i] === y[i]) i++; return i; };
/** Pozycja menu: bez obrysu (żadnej szerokości ramki), wysokość z tokenu. */
const bezObrysu = (s: RN.ViewStyle) => [s.borderWidth, s.borderTopWidth, s.borderBottomWidth, s.borderLeftWidth, s.borderRightWidth].every((w) => w === undefined || w === 0);
const MENU_LICZNIKA = ['menu-nazwa', 'menu-wpisz-wartosc', 'menu-znaczenie', 'menu-zablokuj', 'menu-ukoncz', 'menu-zeruj'];

describe('009 arkusz menu ••• licznika: lista grupowana', () => {
  test('trzy grupy w kolejności: [nazwa, wpisz, znaczenie] [zablokuj, ukończ] [wyzeruj…]', () => {
    menu();
    const poz = kolejnosc(MENU_LICZNIKA);
    expect(poz.every((p) => p >= 0)).toBe(true);
    expect([...poz].sort((a, b) => a - b)).toEqual(poz);
    const miedzy1 = wspolny('menu-znaczenie', 'menu-zablokuj');
    const miedzy2 = wspolny('menu-ukoncz', 'menu-zeruj');
    expect(wspolny('menu-nazwa', 'menu-znaczenie')).toBeGreaterThan(miedzy1);
    expect(wspolny('menu-zablokuj', 'menu-ukoncz')).toBeGreaterThan(miedzy2);
  });

  test('pozycje: wysokość `menu.arkusz.wysokoscPozycji`, bez obrysu, tekst w `tekst` (nie pogrubiony przycisk)', () => {
    menu();
    for (const id of MENU_LICZNIKA) {
      const s = styl(screen.getByTestId(id));
      expect(s.minHeight).toBe(m.arkusz.wysokoscPozycji);
      expect(bezObrysu(s)).toBe(true);
    }
    expect(styl(screen.getByText(t('menu.nazwa'))).color).toBe(paleta.tekst);
  });

  test('grupa: tło `powierzchnia`, promień `lista`; podziałka `linia` między pozycjami (2 w grupie 1, 1 w grupie 2, 0 w grupie 3)', () => {
    menu();
    const grupy = screen.getAllByTestId('menu-grupa-lista');
    expect(grupy).toHaveLength(3);
    for (const g of grupy) expect({ tlo: styl(g).backgroundColor, promien: styl(g).borderRadius }).toEqual({ tlo: paleta.powierzchnia, promien: tokeny.promienie.lista });
    expect(grupy.map((g) => within(g).queryAllByTestId('menu-podzialka').length)).toEqual([2, 1, 0]);
    expect(styl(within(grupy[0]!).getAllByTestId('menu-podzialka')[0]!).backgroundColor).toBe(paleta.linia);
  });

  test('nagłówek: „Cancel” (akcentTekst, 400) w lewym górnym rogu przed tytułem, poza przewijaną treścią; tło arkusza `tlo`', () => {
    menu();
    const anuluj = screen.getByTestId('arkusz-zamknij');
    const przewijany = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && n.type.includes('ScrollView'))[0]!;
    expect(within(przewijany).queryByTestId('arkusz-zamknij')).toBeNull();
    const naglowek = screen.getByTestId('arkusz-naglowek');
    expect(within(naglowek).getByText('Harbor')).toBeTruthy();
    const kol = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string').map((n) => n.props.testID ?? n.props.children);
    expect(kol.indexOf('arkusz-zamknij')).toBeLessThan(kol.indexOf('Harbor'));
    const tekst = styl(within(anuluj).getByText(t('wspolne.anuluj')));
    expect({ color: tekst.color, fontWeight: tekst.fontWeight }).toEqual({ color: paleta.akcentTekst, fontWeight: '400' });
    expect(styl(screen.getByTestId('arkusz-menu')).backgroundColor).toBe(paleta.tlo);
  });

  test('od AX3 tytuł pod „Cancel” (osobny wiersz, do lewej)', () => {
    mockSkala = AX3;
    menu();
    const naglowek = screen.getByTestId('arkusz-naglowek');
    expect(styl(naglowek).flexDirection ?? 'column').toBe('column');
    expect(styl(within(naglowek).getByText('Harbor')).textAlign).toBe('left');
  });

  test('zablokowany: „Unlock”, zerowanie wyłączone (tekst nieaktywny); potwierdzenie zerowania nadal w arkuszu', () => {
    menu({ zablokowany: true });
    expect(screen.getByTestId('menu-odblokuj')).toBeTruthy();
    expect(screen.getByTestId('menu-zeruj')).toBeDisabled();
    expect(styl(screen.getByText(t('menu.zeruj'))).color).toBe(paleta.przyciskNieaktywnyTekst);
  });

  test('arkusz „Cel”: pozycje 44 bez obrysu w jednej grupie', () => {
    render(<MenuCel stan={{ projekt: 'Harbor' }} t={t} naCel={jest.fn()} naPrzypomnienie={jest.fn()} naPowtorzenie={jest.fn()} naZamknij={jest.fn()} />);
    expect(screen.getAllByTestId('menu-grupa-lista')).toHaveLength(1);
    for (const id of ['menu-cel', 'menu-przypomnienie', 'menu-powtorzenie']) {
      const s = styl(screen.getByTestId(id));
      expect(s.minHeight).toBe(m.arkusz.wysokoscPozycji);
      expect(bezObrysu(s)).toBe(true);
    }
  });
});

const stanProjektu = (): PropsProjektu['stan'] => ({
  nazwa: 'Harbor Sweater', notatka: null, miejsceWzoru: null, ostatniaZmiana: 'Nov 1', postep: { rodzaj: 'procent', wartosc: 44 }, termin: null,
  czesci: [{ id: 'c1', nazwa: 'Left sleeve', rzedy: 42, cel: 96, paraZ: null, liczniki: [{ id: 'l1', nazwa: 'Rows', opis: '42 rows' }], calosc: null }],
  szczegoly: { narzedzie: null, rozmiar: null, termin: null }, czas: { suma: '5h 20m', sesje: 7, doSprawdzenia: 2 },
});
const projekt = () => render(<Projekt stan={stanProjektu()} t={t} naOtworzCzesc={jest.fn()} naDodajCzesc={jest.fn()} naDodajLicznik={jest.fn()} naEdytuj={jest.fn()} naZrobTakaSama={jest.fn()} naUsunProjekt={jest.fn()} naWstecz={jest.fn()} />);

describe('009 menu pływające (`menu.plywajace`)', () => {
  test('••• projektu: szerokość 250, cień z tokenu, odstęp od paska 4; pozycje 44 bez obrysu, podziałka `linia`', () => {
    projekt();
    fireEvent.press(screen.getByTestId('projekt-menu'));
    const lista = screen.getByTestId('projekt-menu-lista');
    const s = styl(lista);
    expect({ width: s.width, marginTop: s.marginTop, position: s.position }).toEqual({ width: m.plywajace.szerokosc, marginTop: m.plywajace.odstepOdPaska, position: 'absolute' });
    expect(s.boxShadow).toBe(`0px ${m.plywajace.cien.przesuniecieY}px ${m.plywajace.cien.rozmycie}px rgba(0, 0, 0, ${m.plywajace.cien.przezroczystosc})`);
    const pozycje = within(lista).getAllByRole('button');
    expect(pozycje.length).toBeGreaterThan(1);
    for (const p of pozycje) { expect(styl(p).minHeight).toBe(m.plywajace.wysokoscPozycji); expect(bezObrysu(styl(p))).toBe(true); }
    expect(within(lista).getAllByTestId('menu-podzialka')).toHaveLength(pozycje.length - 1);
  });

  test('od AX3 menu na całą szerokość z marginesem 12 (bez stałej szerokości)', () => {
    mockSkala = AX3;
    projekt();
    fireEvent.press(screen.getByTestId('projekt-dodaj'));
    const s = styl(screen.getByTestId('projekt-menu-lista'));
    expect({ width: s.width, left: s.left, right: s.right }).toEqual({ width: undefined, left: tokeny.odstepy.m, right: tokeny.odstepy.m });
  });

  test('źródło zdjęcia: ta sama lista pływająca (250, cień), pozycje 44 bez obrysu', () => {
    render(<GrupaZdjec t={t} miniatury={[]} naWybierz={jest.fn()} naOtworz={jest.fn()} />);
    fireEvent.press(screen.getByTestId('zdjecia-dodaj'));
    const lista = screen.getByTestId('zdjecia-zrodlo-lista');
    expect(styl(lista).width).toBe(m.plywajace.szerokosc);
    expect(styl(lista).boxShadow).toBeDefined();
    for (const p of within(lista).getAllByRole('button')) { expect(styl(p).minHeight).toBe(m.plywajace.wysokoscPozycji); expect(bezObrysu(styl(p))).toBe(true); }
  });
});
