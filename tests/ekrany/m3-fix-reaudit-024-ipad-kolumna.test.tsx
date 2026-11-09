// 04-studio-projektowe-024 (P1, regresja 015; przebieg 4 attempt 2, scen. 44 iPad poziomo): kolumna wzoru pokazywała liczbę bez −1/+1 (hierarchia bez `licznik-plus`).
// Makieta `docs/design/dzianina/fix-e5-2026-11-09/ipad.html:21–25`: kolumna 280 bez tła (rama wzoru), karta liczby `.nr` (tło `pasek`, promień 22, wyśrodkowana),
// wypełniacz, para −1 / „+1” u dołu. Jest nie liczy układu: test sprawdza strukturę i jawne rozmiary, od których para nie zależy od rozciągania
// („+1” wysokość `plusWysokosc` 200 w granicach 168–240, para się nie kurczy). Widoczność na urządzeniu potwierdzi E2E 44 (07).
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import { LicznikWzoru } from '../../src/ekrany/WzorLicznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { tEn } from './pomoc';

const PW = tokeny.cele.paskaWzoru;
const K = tokeny.kolory.jasny;
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
let mockOkno = { width: 1194, height: 834 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ ...mockOkno, scale: 2, fontScale: 1 }) }));
const plasko = (s: unknown) => (StyleSheet.flatten(s as never) ?? {}) as Record<string, unknown>;
const pokaz = () => render(<LicznikWzoru t={t} licznik={{ liczba: 0, dziergany: 1, znaczenie: 'skonczone', cel: null }} obok
  szerokoscKolumny={PW.kolumna.szerokosc} blad={false} naPlus={jest.fn()} naMinus={jest.fn()} />);

test.each([[1194, 834], [1366, 1024]])('024: okno %i × %i — para −1/„+1” w wzor-kolumna-przyciski, „+1” wysokość jawna 168–240, para się nie kurczy', (width, height) => {
  mockOkno = { width, height };
  pokaz();
  const para = screen.getByTestId('wzor-kolumna-przyciski');
  expect(within(para).getByTestId('licznik-minus')).toBeTruthy();
  expect(within(para).getByTestId('licznik-plus')).toBeTruthy();
  const plus = plasko(screen.getByTestId('licznik-plus').props.style);
  expect(plus.height).toBe(PW.kolumna.plusWysokosc);
  expect(Number(plus.height)).toBeGreaterThanOrEqual(PW.kolumna.plusMinWysokosc);
  expect(Number(plus.height)).toBeLessThanOrEqual(PW.kolumna.plusMaxWysokosc);
  expect(plasko(para.props.style).flexShrink).toBe(0);
});

test('024: karta liczby jak `.nr` — tło pasek, promień karta 22, wyśrodkowana; kolumna bez tła pasek (rama wzoru)', () => {
  mockOkno = { width: 1194, height: 834 };
  pokaz();
  const blok = plasko(screen.getByTestId('wzor-liczba-blok').props.style);
  expect(blok).toMatchObject({ backgroundColor: K.pasek, borderRadius: tokeny.promienie.karta, alignItems: 'center' });
  expect(plasko(screen.getByTestId('wzor-kolumna-licznika').props.style).backgroundColor).toBe(K.wzorRama);
});

test('024 diagnoza poza buildem E2E (P-238): brak tekstu e2e-ramki-kolumny i brak onLayout na kolumnie (przypadek E2E: e2e-ramki-kolumny.test.tsx)', () => {
  mockOkno = { width: 1194, height: 834 };
  pokaz();
  expect(screen.queryByTestId('e2e-ramki-kolumny')).toBeNull();
  expect(screen.getByTestId('wzor-kolumna-licznika').props.onLayout).toBeUndefined();
});
