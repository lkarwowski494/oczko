// M3 p4b — ekran Projekt w wyglądzie Dzianiny (makiety ekrany.html `projekt`, `projekt-menu`, `projekt-edycja`, `projekt-ukonczony`; tokeny `projekt.*`, `miniatura.dzianina`).
// Zachowanie, etykiety VoiceOver i dotychczasowe testID bez zmian (projekt-p5, projekt-dni, pasek-symbole-033-036, e2e). Kropka włóczki (P-567) czeka na dane (decyzja P-598 (a)).
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as RN from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Projekt, type PropsProjektu } from '../../src/ekrany/Projekt';
import { Dzianina } from '../../src/ekrany/Dzianina';
import { kolorJasny } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let mockSkala = 1; // fontScale: 1 = domyślny, 1.786 = AX1, 3.1 = AX5
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const AX1 = 1.786;
const UKRYTE = { includeHiddenElements: true } as const;

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { mockSkala = 1; jest.spyOn(RN, 'useColorScheme').mockReturnValue('light'); }); // motyw jasny, o ile test nie wybierze inaczej
afterEach(() => jest.restoreAllMocks());

const stan = (z: Partial<PropsProjektu['stan']> = {}): PropsProjektu['stan'] => ({
  nazwa: 'Harbor Sweater', notatka: 'Switch to 4 mm', miejsceWzoru: null, ostatniaZmiana: 'Nov 1', postep: { rodzaj: 'procent', wartosc: 44 }, termin: null,
  czesci: [
    { id: 'c1', nazwa: 'Left sleeve', rzedy: 42, cel: 96, paraZ: null, liczniki: [{ id: 'l1', nazwa: 'Rows', opis: '42 rows' }], calosc: null },
    { id: 'c2', nazwa: 'Front', rzedy: 74, cel: null, paraZ: null, calosc: 74, liczniki: [{ id: 'l2', nazwa: 'Body', opis: '62 rows' }, { id: 'l3', nazwa: 'Cable', opis: '12 rows' }] },
  ],
  szczegoly: { narzedzie: null, rozmiar: null, termin: null }, czas: { suma: '5h 20m', sesje: 7, doSprawdzenia: 2 }, ...z,
});
function pokaz(s = stan(), dodatki: Partial<PropsProjektu> = {}) {
  const w = { naOtworzCzesc: jest.fn(), naOtworzLicznik: jest.fn(), naDodajCzesc: jest.fn(), naDodajLicznik: jest.fn(), naNotatka: jest.fn(), naNarzedzie: jest.fn(), naTermin: jest.fn(),
    naEdytuj: jest.fn(), naKoniecEdycji: jest.fn(), naZrobTakaSama: jest.fn(), naUsunProjekt: jest.fn(), naUsunCzesc: jest.fn(), naUsunLicznik: jest.fn(), naWstecz: jest.fn(), naSesje: jest.fn(),
    naProbka: jest.fn(), naWloczka: jest.fn(), ...dodatki };
  render(<Projekt stan={s} t={t} {...w} />);
  return w;
}
const styl = (el: { props: { style?: unknown } }): RN.ViewStyle & RN.TextStyle => (RN.StyleSheet.flatten(el.props.style as RN.StyleProp<RN.ViewStyle & RN.TextStyle>) ?? {}) as RN.ViewStyle & RN.TextStyle;
const symbol = (id: string, nazwa: string) => within(screen.getByTestId(id)).getByTestId(`symbol-${nazwa}`, UKRYTE);

describe.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s', (nazwaMotywu, schemat) => {
  const paleta = tokeny.kolory[nazwaMotywu];
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  test('nagłówki grup (Parts, Time, Note, Details): 17 pt, 700, tekst (projekt.naglowekGrupy)', () => {
    pokaz();
    for (const n of ['Parts', 'Time', 'Note', 'Details']) {
      const s = styl(screen.getByRole('header', { name: n }));
      expect({ n, fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color }).toEqual({ n, fontSize: tokeny.projekt.naglowekGrupy.pt, fontWeight: String(tokeny.projekt.naglowekGrupy.waga), color: paleta.tekst });
    }
  });

  test('„+” i ••• w akcentTekst', () => {
    pokaz();
    expect(symbol('projekt-dodaj', 'plus').props.tintColor).toBe(paleta.akcentTekst);
    expect(symbol('projekt-menu', 'ellipsis').props.tintColor).toBe(paleta.akcentTekst);
  });

  test('edycja: „Done” w akcentTekst, 700; znak usunięcia minus.circle.fill w niszczacy', () => {
    pokaz(stan(), { edycja: true });
    const s = styl(screen.getByText('Done'));
    expect({ color: s.color, fontWeight: s.fontWeight }).toEqual({ color: paleta.akcentTekst, fontWeight: '700' });
    const usun = screen.getAllByTestId('projekt-usun-czesc')[0];
    expect(within(usun).getByTestId('symbol-minus.circle.fill', UKRYTE).props.tintColor).toBe(paleta.niszczacy);
  });

  test('menu •••: pływająca lista (powierzchnia, promień lista), „Delete project…” w niszczacy, pozostałe w tekst', () => {
    pokaz();
    fireEvent.press(screen.getByTestId('projekt-menu'));
    const lista = styl(screen.getByTestId('projekt-menu-lista'));
    expect({ position: lista.position, backgroundColor: lista.backgroundColor, borderRadius: lista.borderRadius }).toEqual({ position: 'absolute', backgroundColor: paleta.powierzchnia, borderRadius: tokeny.promienie.lista });
    expect(styl(screen.getByText('Delete project…')).color).toBe(paleta.niszczacy);
    expect(styl(screen.getByText('Edit parts and counters')).color).toBe(paleta.tekst);
    expect(styl(screen.getByText('Make another like this')).color).toBe(paleta.tekst);
  });

  test('menu „+”: ta sama pływająca lista', () => {
    pokaz();
    fireEvent.press(screen.getByTestId('projekt-dodaj'));
    const lista = styl(screen.getByTestId('projekt-menu-lista'));
    expect({ position: lista.position, backgroundColor: lista.backgroundColor, borderRadius: lista.borderRadius }).toEqual({ position: 'absolute', backgroundColor: paleta.powierzchnia, borderRadius: tokeny.promienie.lista });
    expect(screen.getByTestId('projekt-dodaj-czesc')).toBeTruthy();
    expect(screen.getByTestId('projekt-dodaj-licznik')).toBeTruthy();
  });

  test('Szczegóły: etykieta po lewej (tekst), wartość po prawej w tekst2, strzałka', () => {
    pokaz(stan({ szczegoly: { narzedzie: 'Needles', rozmiar: '4 mm (US 6)', termin: 'Oct 31' } }));
    const wiersz = screen.getByTestId('projekt-narzedzie');
    expect(styl(wiersz).flexDirection).toBe('row');
    expect(styl(within(wiersz).getByText('Needles')).color).toBe(paleta.tekst);
    expect(styl(within(wiersz).getByText('4 mm (US 6)')).color).toBe(paleta.tekst2);
    expect(within(wiersz).getByTestId('symbol-chevron.forward', UKRYTE)).toBeTruthy();
  });
});

describe('miniatura dzianiny w wierszu części (miniatura.dzianina)', () => {
  test('każda część ma miniaturę ukrytą przed VoiceOver, rozmiar z tokenu; liczniki części jej nie mają', () => {
    pokaz();
    const m = screen.getAllByTestId('projekt-miniatura', UKRYTE);
    expect(m).toHaveLength(2);
    for (const x of m) {
      expect(x.props.accessibilityElementsHidden).toBe(true);
      expect(x.props.importantForAccessibility).toBe('no-hide-descendants');
      const s = styl(x);
      expect({ width: s.width, height: s.height, borderRadius: s.borderRadius }).toEqual({ width: tokeny.miniatura.dzianina.szerokosc, height: tokeny.miniatura.dzianina.wysokosc, borderRadius: tokeny.miniatura.dzianina.promien });
    }
    for (const l of screen.getAllByTestId('projekt-licznik')) expect(within(l).queryByTestId('projekt-miniatura', UKRYTE)).toBeNull();
  });

  test('ta sama dzianina co na liście Projekty; postęp części = rzędy / cel (bez celu: cel null, jak na liście)', () => {
    pokaz();
    const d = screen.UNSAFE_getAllByType(Dzianina).map((x) => ({ gotowe: x.props.gotowe, cel: x.props.cel }));
    expect(d).toEqual([{ gotowe: 42, cel: 96 }, { gotowe: 74, cel: null }]);
  });

  test('od AX1 miniatura ukryta (zostaje wiersz)', () => {
    mockSkala = AX1;
    pokaz();
    expect(screen.queryAllByTestId('projekt-miniatura', UKRYTE)).toHaveLength(0);
    expect(screen.getAllByTestId('projekt-czesc')).toHaveLength(2);
  });

  test('ukończony projekt: miniatura też jest (ten sam wiersz części)', () => {
    pokaz(stan({ ukonczony: true, daty: { start: 'Sep 2, 2026', koniec: 'Oct 12, 2026', startDzien: '2026-09-02', koniecDzien: '2026-10-12', dzis: '2026-11-08' } }));
    expect(screen.getAllByTestId('projekt-miniatura', UKRYTE)).toHaveLength(2);
  });
});

describe('strzałka w wierszach', () => {
  test('wiersze części i liczników mają strzałkę (chevron.forward), ukrytą przed VoiceOver', () => {
    pokaz();
    for (const id of ['projekt-czesc', 'projekt-licznik']) {
      const wiersze = screen.getAllByTestId(id);
      expect([id, wiersze.length > 0]).toEqual([id, true]);
      for (const w of wiersze) {
        const s = within(w).getByTestId('symbol-chevron.forward', UKRYTE);
        expect(s.props.accessibilityElementsHidden).toBe(true);
      }
    }
  });

  test('liczba wierszy: 2 części, 2 liczniki (część z jednym licznikiem nie powtarza wiersza)', () => {
    pokaz();
    expect(screen.getAllByTestId('projekt-czesc')).toHaveLength(2);
    expect(screen.getAllByTestId('projekt-licznik')).toHaveLength(2);
  });

  test('wcięcie wiersza licznika = do tekstu części (lewy margines + miniatura + odstęp); od AX1 i w edycji mniejsze', () => {
    pokaz();
    const wciecie = (w: { props: { style?: unknown } }) => styl(w).paddingLeft;
    const norm = wciecie(screen.getAllByTestId('projekt-licznik-wiersz')[0]);
    expect(norm).toBe(tokeny.odstepy.l + tokeny.miniatura.dzianina.szerokosc + tokeny.odstepy.m);
  });
});

describe('Szczegóły i Czas: etykieta po lewej, wartość po prawej; od AX1 wartość pod etykietą', () => {
  const szczegoly = { narzedzie: 'Needles', rozmiar: '4 mm (US 6)', termin: 'Oct 31', wloczka: 'Mist', probka: '22 stitches / 10 cm' };
  test('wszystkie wiersze Szczegółów: układ w rzędzie, wartość tekst2 (jasny)', () => {
    pokaz(stan({ szczegoly }));
    for (const [id, wartosc] of [['projekt-narzedzie', '4 mm (US 6)'], ['projekt-wloczka', 'Mist'], ['projekt-probka', '22 stitches / 10 cm'], ['projekt-termin', 'Oct 31']] as const) {
      const w = screen.getByTestId(id);
      expect([id, styl(w).flexDirection]).toEqual([id, 'row']);
      expect([id, styl(within(w).getByText(wartosc)).color]).toEqual([id, kolorJasny.tekst2]);
      expect(within(w).getByTestId('symbol-chevron.forward', UKRYTE)).toBeTruthy();
    }
  });
  test('od AX1: wiersz w kolumnie, wartość po etykiecie, strzałka zostaje', () => {
    mockSkala = AX1;
    pokaz(stan({ szczegoly }));
    const w = screen.getByTestId('projekt-wloczka');
    expect(styl(w).flexDirection).toBe('column');
    const teksty = within(w).getAllByText(/./).map((x) => x.props.children);
    expect(teksty).toEqual(['Yarn', 'Mist']);
    expect(within(w).getByTestId('symbol-chevron.forward', UKRYTE)).toBeTruthy();
  });
  test('Czas: suma i liczba sesji w tekst2 po prawej, „Sessions” ze strzałką', () => {
    pokaz();
    expect(styl(screen.getByText('5h 20m')).color).toBe(kolorJasny.tekst2);
    const sesje = screen.getByTestId('projekt-sesje');
    expect(styl(within(sesje).getByText('7')).color).toBe(kolorJasny.tekst2);
    expect(within(sesje).getByTestId('symbol-chevron.forward', UKRYTE)).toBeTruthy();
  });
});

describe('struktura: aliasy ról starego systemu zastąpione tokenami Dzianiny', () => {
  test('Projekt.tsx nie czyta papier / grafit / olowek / papierGrupa / blad / promien.grupa', () => {
    const zrodlo = readFileSync(join(__dirname, '..', '..', 'src', 'ekrany', 'Projekt.tsx'), 'utf8').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
    expect(zrodlo.match(/\bk\.(papier|papierGrupa|grafit|olowek|blad)\b|promien\.grupa/g) ?? []).toEqual([]);
  });
});
