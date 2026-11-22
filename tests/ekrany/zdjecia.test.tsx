// Zdjęcia projektu (P-191 P9a, BR-PRJ-003; makiety fix6 `projekt-zdjecia`, `zdjecie-zrodlo`, `zdjecie-podglad`, `zdjecie-usun`; scenariusze 17, 42).
// „Share” podglądu: od P-219 (2A) aktywne — plik bez metadanych przygotowuje kompozycja (zmiana testu z powodem: wcześniej nieaktywne, Q-D1).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GrupaZdjec, PodgladZdjec } from '../../src/ekrany/Zdjecia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const DWA = [{ id: 'a', uri: 'file:///a.jpg' }, { id: 'b', uri: 'file:///b.jpg' }];

describe('grupa „Photos”', () => {
  test('nagłówek, miniatury z etykietą „Photo n of N” (scenariusz 17), kafel „Add photo”; miniatura otwiera podgląd', () => {
    const naOtworz = jest.fn();
    render(<GrupaZdjec t={t} miniatury={DWA} naWybierz={jest.fn()} naOtworz={naOtworz} />);
    expect(screen.getByTestId('projekt-zdjecia')).toBeTruthy();
    expect(screen.getByText('Photos')).toBeTruthy();
    const m = screen.getAllByTestId('zdjecia-miniatura');
    expect(m.map((x) => x.props.accessibilityLabel)).toEqual(['Photo 1 of 2', 'Photo 2 of 2']);
    fireEvent.press(m[1]!);
    expect(naOtworz).toHaveBeenCalledWith(1);
  });
  test('„Add photo” → wybór źródła: Take photo / Choose from library / Cancel; panel E2E obok', () => {
    const naWybierz = jest.fn();
    render(<GrupaZdjec t={t} miniatury={[]} naWybierz={naWybierz} naOtworz={jest.fn()} panelE2e={<Text testID="e2e-zdjecie-testowe">Test photo</Text>} />);
    expect(screen.queryByText('Take photo')).toBeNull();
    fireEvent.press(screen.getByTestId('zdjecia-dodaj'));
    expect(screen.getByTestId('e2e-zdjecie-testowe')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));
    expect(naWybierz).toHaveBeenCalledWith('biblioteka');
    expect(screen.queryByText('Take photo')).toBeNull();
    fireEvent.press(screen.getByTestId('zdjecia-dodaj'));
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(naWybierz).toHaveBeenCalledTimes(1);
  });
});

describe('podgląd', () => {
  test('Close, Share bieżącego zdjęcia, „Photo 2 of 2”, Delete photo z potwierdzeniem (tytuł, opis, przycisk destrukcyjny)', () => {
    const naUsun = jest.fn(), naZamknij = jest.fn(), naUdostepnij = jest.fn();
    const potwierdz = jest.fn((_tytul: string, _opis: string, _przycisk: string, f: () => void) => f());
    render(<PodgladZdjec t={t} zdjecia={DWA} poczatek={1} naZamknij={naZamknij} naUsun={naUsun} naUdostepnij={naUdostepnij} potwierdz={potwierdz} />);
    expect(screen.getByText('Photo 2 of 2')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Share' }));
    expect(naUdostepnij).toHaveBeenCalledWith('b');
    fireEvent.press(screen.getByTestId('zdjecie-usun'));
    expect(potwierdz).toHaveBeenCalledWith('Delete this photo?', t('zdjecia.usun_opis'), 'Delete photo', expect.any(Function));
    expect(naUsun).toHaveBeenCalledWith('b');
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(naZamknij).toHaveBeenCalled();
  });
});
