// PU-012 (katalog przypadków użycia, „iPad”; KO-105): zakreślanie na iPadzie (okno regular) tak samo jak na iPhonie — na prawdziwym `ukladOkna` i prawdziwym ekranie
// `PrzegladarkaWzoru` (widok strony PDF to slot — moduł natywny `oczko-wzor` poza Jest). Wzór: tests/ekrany/wzor-przegladarka.test.tsx (scenariusz 47).
// Poza Jest (częściowo): kreska palcem w widoku natywnym PencilKit, faktyczne zdjęcie ostatniego pasa, szybka para i odtworzenie po restarcie — scenariusz 110 (oczekujący).
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ukladOkna } from '../../src/domena/uklad';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const stan = (z: Partial<StanPrzegladarki> = {}): StanPrzegladarki => ({
  nazwa: 'Highlight test', projekt: 'Highlight test', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Highlight test' }], wzorId: 'w1',
  strona: { n: 1, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false,
  licznik: { liczba: 0, dziergany: 1, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 1024, wysokosc: 1366 }), ...z,
});
const wywolania = () => ({
  naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(), naZmienNazwe: jest.fn(), naUsun: jest.fn(),
  potwierdz: jest.fn((_t: string, _o: string, _p: string, f: () => void) => f()),
  naPlus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })),
});
const widok = <Text testID="slot-widoku">PDF</Text>;

describe('PU-012 · iPad (regular): zakreślacz jak na iPhonie — licznik pasów rośnie od razu, „Cofnij” zgłasza zdjęcie jednej kreski', () => {
  test('PU-012 · okno 1024 × 1366: zakreślacz włącza tryb, kolejne pasy 0 → 1 → 2 widoczne w liczniku, cofnięcie zgłasza jedno wywołanie, po zdjęciu pasa licznik wraca do 1', () => {
    const w = wywolania();
    const r = render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} />);
    expect(ukladOkna({ szerokosc: 1024, wysokosc: 1366 }).klasa).toBe('regular');
    expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('0 highlights');
    fireEvent.press(screen.getByTestId('wzor-zakreslacz'));
    expect(w.naNarzedzie).toHaveBeenLastCalledWith('zakreslacz');
    r.rerender(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz', zakreslenia: 1 })} t={t} widok={widok} {...w} />);
    expect(screen.getByTestId('wzor-zakreslacz').props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('1 highlight'); // nowy pas od razu
    r.rerender(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz', zakreslenia: 2 })} t={t} widok={widok} {...w} />);
    expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('2 highlights'); // szybka para = +2
    expect(w.naCofnij).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('wzor-cofnij-rysunek'));
    expect(w.naCofnij).toHaveBeenCalledTimes(1); // jedno naciśnięcie = jedna kreska
    r.rerender(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz', zakreslenia: 1 })} t={t} widok={widok} {...w} />);
    expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('1 highlight');
  });
});
