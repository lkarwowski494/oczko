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

// 024 runda 2 ramek (run 42686026279, scen. 44, okno 1366×1024): wypełniacz `flex: 1` dostał 992 pt w kolumnie 972 pt, para −1/„+1” od y = 1144 — poza
// ekranem („Element not found: licznik-plus”). Para dociśnięta do dołu automatycznym marginesem (tylko wolne miejsce), bez rosnącego widoku nad nią.
test('024: kolumna iPada bez rosnącego wypełniacza nad parą; para u dołu przez marginTop auto', () => {
  mockOkno = { width: 1366, height: 1024 };
  pokaz();
  expect(screen.queryByTestId('wzor-kolumna-wypelniacz')).toBeNull();
  const kolumna = screen.getByTestId('wzor-kolumna-licznika');
  const dzieci = React.Children.toArray(kolumna.props.children).filter(React.isValidElement) as React.ReactElement<{ style?: unknown; testID?: string }>[];
  for (const d of dzieci) {
    const s = plasko(d.props.style);
    expect([d.props.testID, s.flex ?? 0, s.flexGrow ?? 0]).toEqual([d.props.testID, 0, 0]);
  }
  expect(plasko(screen.getByTestId('wzor-kolumna-przyciski').props.style).marginTop).toBe('auto');
});
