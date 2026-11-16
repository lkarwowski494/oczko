// PU-143 i PU-144 (katalog przypadków użycia, „iPad”; KO-105): układ przeglądarki wzoru zależny od okna iPada, na prawdziwym `ukladOkna` (src/domena/uklad.ts) i prawdziwym ekranie
// `PrzegladarkaWzoru` (widok strony PDF to slot — moduł natywny `oczko-wzor` poza Jest). Wzór: tests/ekrany/wzor-przegladarka.test.tsx, tests/ekrany/pu-ipad-dzis-142.test.tsx.
// Poza Jest (częściowo): faktyczny obrót okna i działanie „+1” w symulatorze iPada — scenariusze 44 (PU-143) i 46 (PU-144), oczekujące; tu „+1” wywołuje zgłoszenie do usługi (atrapa), wartość z stanu.
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ukladOkna } from '../../src/domena/uklad';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const stan = (szerokosc: number, wysokosc: number, liczba = 47): StanPrzegladarki => ({
  nazwa: 'Harbor chart', projekt: 'Harbor', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }], wzorId: 'w1',
  strona: { n: 2, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false,
  licznik: { liczba, dziergany: liczba + 1, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc, wysokosc }),
});
const wywolania = () => ({
  naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(), naZmienNazwe: jest.fn(), naUsun: jest.fn(),
  potwierdz: jest.fn((_t: string, _o: string, _p: string, f: () => void) => f()),
  naPlus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })),
});
const widok = <Text testID="slot-widoku">PDF</Text>;

describe('PU-143 · iPad (regular): wzór i licznik razem w obu orientacjach', () => {
  test.each([
    ['poziomo 1180 × 820 → kolumna licznika obok wzoru', 1180, 820, 'obok', 'wzor-kolumna-licznika'],
    ['pionowo 820 × 1180 → pasek licznika pod wzorem', 820, 1180, 'pasek', 'wzor-pasek-licznika'],
  ] as const)('PU-143 · %s: `wzor-widok` i `licznik-wartosc` obecne razem, „+1” zgłasza rząd i liczba rośnie po zmianie stanu', (_n, w, h, uklad, kontener) => {
    const wyw = wywolania();
    const r = render(<PrzegladarkaWzoru stan={stan(w, h)} t={t} widok={widok} {...wyw} />);
    expect(ukladOkna({ szerokosc: w, wysokosc: h })).toMatchObject({ klasa: 'regular', wzor: uklad });
    expect(screen.getByTestId('wzor-widok')).toBeTruthy();
    expect(screen.getByTestId(kontener)).toContainElement(screen.getByTestId('licznik-wartosc'));
    expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('47');
    fireEvent.press(screen.getByTestId('licznik-plus'));
    expect(wyw.naPlus).toHaveBeenCalledTimes(1);
    r.rerender(<PrzegladarkaWzoru stan={stan(w, h, 48)} t={t} widok={widok} {...wyw} />);
    expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('48');
    expect(screen.getByTestId('wzor-widok')).toBeTruthy(); // wzór nie znika po +1
  });
});

describe('PU-144 · wąskie okno iPada (compact): układ jak na telefonie', () => {
  test.each([
    ['okno 375 × 1180 (wąskie, wysokie) → pasek jak telefon pionowo', 375, 1180, 'pasek', 'wzor-pasek-licznika'],
    ['okno 1180 × 375 (szerokie, niskie) → kolumna jak telefon poziomo', 1180, 375, 'obok', 'wzor-kolumna-licznika'],
  ] as const)('PU-144 · %s: klasa compact, wzór i licznik widoczne, „+1” działa', (_n, w, h, uklad, kontener) => {
    const wyw = wywolania();
    render(<PrzegladarkaWzoru stan={stan(w, h)} t={t} widok={widok} {...wyw} />);
    const u = ukladOkna({ szerokosc: w, wysokosc: h });
    expect(u).toMatchObject({ klasa: 'compact', wzor: uklad, tresc: w }); // compact: bez kolumny 640 pt iPada, pełna szerokość okna
    expect(screen.getByTestId('wzor-widok')).toBeTruthy();
    expect(screen.getByTestId(kontener)).toContainElement(screen.getByTestId('licznik-wartosc'));
    fireEvent.press(screen.getByTestId('licznik-plus'));
    expect(wyw.naPlus).toHaveBeenCalledTimes(1);
  });
});
