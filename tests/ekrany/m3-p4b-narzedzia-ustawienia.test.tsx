// M3 p4b (kawałek C, zadania 6 i 7) — kafelek ikony wiersza z tokenów `znaczniki.*` (32 pt, AX5 44, promień 8, tło `ikonaTlo`, symbol `ikona` 20 pt, AX5 30) w Narzędziach i Ustawieniach;
// ikony Narzędzi (Włóczki `scribble.variable`, Druty = rysunek własny `druty`, Próbka `square.grid.3x3`); Oczko Pro = ikona dnia dzierganego, „Keep screen on” = `iphone`;
// wybrana pozycja list Miary i Język = symbol `checkmark` w `akcentTekst` (`znaczniki.wyboruListy`) zamiast glifu „✓”. Zachowanie, etykiety VoiceOver i testID bez zmian.
import React from 'react';
import * as RN from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import { Narzedzia } from '../../src/ekrany/Narzedzia';
import { Ustawienia, type PropsUstawien } from '../../src/ekrany/Ustawienia';
import { WyborMiar } from '../../src/ekrany/Miary';
import { WyborJezyka } from '../../src/ekrany/Jezyk';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const AX1 = 1.786;
const UKRYTE = { includeHiddenElements: true } as const;
const z = tokeny.znaczniki;
const KAFELEK_SYMBOL = 20, KAFELEK_SYMBOL_AX5 = 30; // opis tokenu `znaczniki._kafelek` (symbol 20 pt, AX5 30 pt); pola liczbowego brak — zgłoszenie do 04

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());
beforeEach(() => { mockSkala = 1; });
const styl = (el: { props: { style?: unknown } }) => (RN.StyleSheet.flatten(el.props.style as RN.StyleProp<RN.ViewStyle>) ?? {}) as RN.ViewStyle;
const noop = jest.fn();

function pokazNarzedzia() {
  render(<Narzedzia stan={{ wloczki: 1, druty: 2 }} t={t} naWloczki={noop} naDruty={noop} naProbke={noop} />);
}
const ADRESY = { polityka: 'https://example.invalid/p', wsparcie: 'https://example.invalid/s', recenzja: 'https://example.invalid/r' };
function pokazUstawienia(stan: Partial<PropsUstawien['stan']> = {}) {
  render(<Ustawienia stan={{ pro: null, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wibracje: true, ...stan }} t={t} system={atrapaSystemu()} adresy={ADRESY}
    naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()}
    dane={{ naEksport: jest.fn(), naImport: jest.fn(), naUsunWszystko: jest.fn() }}
    preferencje={{ ekranNieGasnie: true, ukladMiar: 'auto', naEkranNieGasnie: jest.fn(), naMiary: jest.fn() }}
    jezyk={{ stan: { wartosc: 'auto', jezyk: 'en' }, naJezyk: jest.fn(), naZglosTlumaczenie: jest.fn() }}
    naZrodla={jest.fn()} />);
}
const kafelek = (id: string) => within(screen.getByTestId(id)).getByTestId('kafelek-ikony', UKRYTE);

describe.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s', (motyw, schemat) => {
  const paleta = motyw === 'jasny' ? tokeny.kolory.jasny : tokeny.kolory.ciemny;
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  test('Narzędzia: każdy wiersz ma kafelek 32 pt, promień 8, tło ikonaTlo, symbol 20 pt w kolorze ikona', () => {
    pokazNarzedzia();
    for (const id of ['narzedzia-wloczki', 'narzedzia-druty', 'narzedzia-probka']) {
      const k = kafelek(id);
      expect({ id, w: styl(k).width, h: styl(k).height, r: styl(k).borderRadius, tlo: styl(k).backgroundColor })
        .toEqual({ id, w: z.kafelekIkonyWiersza, h: z.kafelekIkonyWiersza, r: z.promienKafelkaWiersza, tlo: paleta.ikonaTlo });
    }
    const symbol = within(kafelek('narzedzia-wloczki')).getByTestId('symbol-scribble.variable', UKRYTE);
    expect({ kolor: symbol.props.tintColor, rozmiar: symbol.props.size }).toEqual({ kolor: paleta.ikona, rozmiar: KAFELEK_SYMBOL });
  });

  test('Narzędzia: Włóczki scribble.variable, Druty rysunek własny „druty” (SVG), Próbka square.grid.3x3; trzy różne ikony', () => {
    pokazNarzedzia();
    expect(within(kafelek('narzedzia-wloczki')).queryByTestId('symbol-scribble.variable', UKRYTE)).not.toBeNull();
    expect(within(kafelek('narzedzia-druty')).queryByTestId('symbol-druty', UKRYTE)).not.toBeNull();
    expect(within(kafelek('narzedzia-probka')).queryByTestId('symbol-square.grid.3x3', UKRYTE)).not.toBeNull();
  });

  test('Ustawienia: kafelek wiersza z tokenów znaczniki (32 pt, promień 8, ikonaTlo), symbol 20 pt', () => {
    pokazUstawienia();
    const k = kafelek('ustawienia-eksport');
    expect({ w: styl(k).width, h: styl(k).height, r: styl(k).borderRadius, tlo: styl(k).backgroundColor })
      .toEqual({ w: z.kafelekIkonyWiersza, h: z.kafelekIkonyWiersza, r: z.promienKafelkaWiersza, tlo: paleta.ikonaTlo });
    expect(within(k).getByTestId('symbol-square.and.arrow.up', UKRYTE).props.size).toBe(KAFELEK_SYMBOL);
  });

  test('Ustawienia: Oczko Pro ma ikonę dnia dzierganego (nie sparkles), „Keep screen on” ma iphone (nie sun.max)', () => {
    pokazUstawienia();
    const pro = within(screen.getByTestId('ustawienia-oczko-pro'));
    expect(pro.queryByTestId('symbol-sparkles', UKRYTE)).toBeNull();
    expect(pro.queryByTestId('symbol-dzien', UKRYTE)).not.toBeNull();
    const ekran = within(screen.getByTestId('ustawienia-ekran-nie-gasnie-wiersz'));
    expect(ekran.queryByTestId('symbol-sun.max', UKRYTE)).toBeNull();
    expect(ekran.getByTestId('symbol-iphone', UKRYTE).props.tintColor).toBe(paleta.ikona);
  });

  test('Miary: wybrana pozycja ma symbol checkmark w akcentTekst (bez glifu ✓), pozostałe bez znaku', () => {
    render(<WyborMiar t={t} wybrany="metric" naWybierz={noop} />);
    expect(screen.queryByText('✓', UKRYTE)).toBeNull();
    const znak = within(screen.getByTestId('miary-metric')).getByTestId('symbol-checkmark', UKRYTE);
    expect(znak.props.tintColor).toBe(paleta.akcentTekst);
    expect(screen.getAllByTestId('symbol-checkmark', UKRYTE)).toHaveLength(1);
    expect(screen.getByTestId('miary-metric').props.accessibilityState).toEqual({ checked: true });
  });

  test('Język: wybrana pozycja ma symbol checkmark w akcentTekst (bez glifu ✓)', () => {
    render(<WyborJezyka t={t} wybrany="de" naWybierz={noop} naUstawieniaIos={noop} />);
    expect(screen.queryByText('✓', UKRYTE)).toBeNull();
    const znak = within(screen.getByTestId('jezyk-de')).getByTestId('symbol-checkmark', UKRYTE);
    expect(znak.props.tintColor).toBe(paleta.akcentTekst);
    expect(screen.getAllByTestId('symbol-checkmark', UKRYTE)).toHaveLength(1);
  });
});

test('token znaczniki.wyboruListy: checkmark w akcentTekst', () => {
  expect(z.wyboruListy).toMatchObject({ symbol: 'checkmark', kolor: 'akcentTekst' });
});

test('AX (od AX1): kafelek i symbol rosną do tokenów kafelekIkonyWierszaAx5 i 30 pt w Narzędziach i Ustawieniach', () => {
  mockSkala = AX1;
  pokazNarzedzia();
  const k = kafelek('narzedzia-wloczki');
  expect({ w: styl(k).width, h: styl(k).height, r: styl(k).borderRadius }).toEqual({ w: z.kafelekIkonyWierszaAx5, h: z.kafelekIkonyWierszaAx5, r: z.promienKafelkaWiersza });
  expect(within(k).getByTestId('symbol-scribble.variable', UKRYTE).props.size).toBe(KAFELEK_SYMBOL_AX5);
  screen.unmount();
  pokazUstawienia();
  const u = kafelek('ustawienia-eksport');
  expect({ w: styl(u).width, h: styl(u).height }).toEqual({ w: z.kafelekIkonyWierszaAx5, h: z.kafelekIkonyWierszaAx5 });
  expect(within(u).getByTestId('symbol-square.and.arrow.up', UKRYTE).props.size).toBe(KAFELEK_SYMBOL_AX5);
});

test('wiersze Narzędzi zachowują etykiety VoiceOver i nie czytają ikon (dekoracyjne)', () => {
  pokazNarzedzia();
  expect(screen.getByTestId('narzedzia-wloczki').props.accessibilityLabel).toBe('Yarn, 1');
  expect(kafelek('narzedzia-druty').props.accessibilityElementsHidden).toBe(true);
});
