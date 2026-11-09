// M3-IPAD-01 (P-605): pasek wzoru −1 / liczba / +1 na iPadzie (przebieg 2 iOS, scenariusz 44, zrzut ipad-wzor-pasek.png).
// Przyczyna: grupa `przyciski` (−1 / liczba / +1) leży w pasku-wierszu z zawijaniem i nie ma szerokości: zwija się do zawartości, więc blok liczby (flexBasis 0) ma 0 pt,
// „+1” tylko minWidth 64 pt, a liczba nachodzi na przyciski. Układ Yoga odtworzony poza urządzeniem (`yoga-layout` 3.1.0, poza repo): z `width: 100%` na grupie
// blok liczby ma 424/107/72 pt przy oknie 1024/390/320 pt (bez poprawki 0 pt przy każdej szerokości). Jest nie układa elementów, więc test sprawdza styl, który to gwarantuje.
// Zachowanie, testID i układ od AX1 (04-003) bez zmian.
import React from 'react';
import * as RN from 'react-native';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { LicznikWzoru } from '../../src/ekrany/WzorLicznik';
import { PROG_KATEGORII_DOSTEPNOSCI } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let mockSzerokosc = 1024;
let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: mockSzerokosc, height: 1366, scale: 2, fontScale: mockSkala }) }));
beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark'); });
afterEach(() => { mockSzerokosc = 1024; mockSkala = 1; jest.restoreAllMocks(); });
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const plaski = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;
const pasek = (obok = false) => render(
  <LicznikWzoru t={t} licznik={{ liczba: 43, dziergany: 44, znaczenie: 'skonczone' }} obok={obok} blad={false} naPlus={jest.fn()} naMinus={jest.fn()} />,
);

// 1366 i 1024: iPad 13" i 11" (pionowo i poziomo okno pełne), 390: iPhone, 320: wąskie okno (Split View).
describe('pasek wzoru: grupa −1 / liczba / +1 ma pełną szerokość paska (M3-IPAD-01)', () => {
  test.each([1366, 1024, 390, 320])('okno %s pt: grupa przycisków na całą szerokość paska (width 100%) — nie zwija się do zawartości', (szerokosc) => {
    mockSzerokosc = szerokosc;
    pasek();
    expect(plaski('wzor-pasek-przyciski')).toMatchObject({ flexDirection: 'row', width: '100%' });
  });
  test.each([1366, 320])('okno %s pt, od AX1 (kolumna: liczba nad przyciskami): ta sama pełna szerokość', (szerokosc) => {
    mockSzerokosc = szerokosc;
    mockSkala = PROG_KATEGORII_DOSTEPNOSCI;
    pasek();
    expect(plaski('wzor-pasek-licznika')).toMatchObject({ flexDirection: 'column' });
    expect(plaski('wzor-pasek-przyciski')).toMatchObject({ flexDirection: 'row', width: '100%' });
  });
  test.each([1366, 390, 320])('okno %s pt: liczba i „+1” dzielą wolne miejsce (blok i „+1” rosną od podstawy 0), „−1” ma stałą szerokość', (szerokosc) => {
    mockSzerokosc = szerokosc;
    pasek();
    expect(plaski('wzor-liczba-blok')).toMatchObject({ flexGrow: 1, flexBasis: 0 });
    expect(plaski('licznik-plus')).toMatchObject({ flexGrow: 1, flexBasis: 0 });
    expect(plaski('licznik-minus').flexGrow ?? 0).toBe(0);
    expect(plaski('licznik-minus').minWidth).toBeGreaterThanOrEqual(64);
    expect(plaski('licznik-plus').minWidth).toBeGreaterThanOrEqual(64);
  });
  test('kolumna obok wzoru (W3, W4b) bez zmian: szerokość z układu okna, nie 100%', () => {
    pasek(true);
    expect(plaski('wzor-kolumna-licznika').width).toBeUndefined();
  });
});
