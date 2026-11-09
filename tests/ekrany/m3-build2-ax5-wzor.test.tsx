// AX5-wzór (P-630; decyzja właściciela 2026-11-09: opcja A): na iPhonie przy AX5 podpis źródła `wzor-zrodlo` („PDF · 2 pages” łamany na 4 linie,
// ściśnięty między tytułem a ikonami) i karta wskazówki `wzor-wskazowka-znacznika` zajmowały całą wysokość nad paskiem licznika — `wzor-widok` miał
// 0 pt (przebieg 5, run 42601620032, scen. 30, zrzut ax5-wzor-WADA-brak-wzoru). Opcja A: oba teksty z limitem skali tytułów paska
// (MAX_SKALA_TYTULOWA 1,8 — jak tytuł wzoru i symbole paska), podpis źródła w jednej linii pod tytułem. Jest nie liczy układu Yoga: test sprawdza limity
// i strukturę przy fontScale AX5 (3,571); wysokość `wzor-widok` > 0 nad paskiem potwierdza E2E 30 na urządzeniu.
import React from 'react';
import { Text } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import { ukladOkna } from '../../src/domena/uklad';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import { MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 3.571 }) }));
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const stan = (z: Partial<StanPrzegladarki> = {}): StanPrzegladarki => ({
  nazwa: 'Test pattern', opis: 'PDF · 2 pages', czesc: null, wzory: [{ wzorId: 'w1', nazwa: 'Test pattern' }], wzorId: 'w1',
  strona: { n: 1, razem: 2 }, zakreslenia: 0, narzedzie: 'brak', word: false, wskazowka: true,
  licznik: { liczba: 12345, dziergany: 12346, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 402, wysokosc: 874 }), ...z,
});
const nic = jest.fn();
const pokaz = (z: Partial<StanPrzegladarki> = {}) => render(<PrzegladarkaWzoru stan={stan(z)} t={t} widok={<Text testID="slot-widoku">PDF</Text>}
  naWstecz={nic} naPrzelacz={nic} naNarzedzie={nic} naCofnij={nic} naZaznaczRzad={nic} naObroc={nic} naZmienNazwe={nic} naUsun={nic} potwierdz={nic}
  naPlus={async () => ({ ok: true as const, wartosc: undefined })} naMinus={async () => ({ ok: true as const, wartosc: undefined })} />);

test.each([
  ['jeden wzór (tytuł-nagłówek)', [{ wzorId: 'w1', nazwa: 'Test pattern' }]],
  ['dwa wzory (tytuł-przełącznik ▾)', [{ wzorId: 'w1', nazwa: 'Test pattern' }, { wzorId: 'w2', nazwa: 'Chart' }]],
])('AX5, %s: podpis źródła z limitem skali tytułów i w jednej linii', (_n, wzory) => {
  pokaz({ wzory });
  const zrodlo = screen.getByTestId('wzor-zrodlo');
  expect(zrodlo.props.children).toBe('PDF · 2 pages');
  expect(zrodlo.props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  expect(zrodlo.props.numberOfLines).toBe(1);
});

test('AX5: karta wskazówki „Tap a row to place your marker.” z limitem skali tytułów; wzór i pasek licznika na ekranie', () => {
  pokaz();
  const wsk = screen.getByTestId('wzor-wskazowka-znacznika', { includeHiddenElements: true }); // ukryta dla VoiceOver (M1-131)
  expect(wsk.props.children).toBe('Tap a row to place your marker.');
  expect(wsk.props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  expect(within(screen.getByTestId('wzor-widok')).getByTestId('slot-widoku')).toBeTruthy();
  expect(screen.getByTestId('wzor-pasek-licznika')).toBeTruthy();
});
