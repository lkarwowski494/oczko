// Ekrany „Tools” i „Swatch” (P-191 P7a; BR-KAL-001, BR-KAL-003; design-spec „Narzędzia, zapas, zdjęcia”; makieta fix6 `narzedzia`, `probka`).
import React from 'react';
import { ScrollView } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Narzedzia, Probka } from '../../src/ekrany/Narzedzia';
import { stanProbki } from '../../src/kompozycja/probka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('Tools: zapas (Yarn 7, Needles and hooks 9) i kalkulator z opisem; wiersze otwierają ekrany', () => {
  const na = { naWloczki: jest.fn(), naDruty: jest.fn(), naProbke: jest.fn() };
  render(<Narzedzia stan={{ wloczki: 7, druty: 9 }} t={t} {...na} />);
  expect(screen.getByText('Tools')).toBeTruthy();
  expect(screen.getByText('Stash')).toBeTruthy();
  expect(screen.getByText(t('narzedzia.probka_opis'))).toBeTruthy();
  fireEvent.press(screen.getByTestId('narzedzia-wloczki'));
  fireEvent.press(screen.getByTestId('narzedzia-druty'));
  fireEvent.press(screen.getByTestId('narzedzia-probka'));
  expect([na.naWloczki, na.naDruty, na.naProbke].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  expect(screen.getByTestId('narzedzia-wloczki')).toHaveProperty('props.accessibilityLabel', 'Yarn, 7');
});

describe('Swatch', () => {
  const ekran = (uklad: 'cm' | 'in', zProjektu?: string) => render(
    <Probka t={t} jednostka={uklad} poczatek={{ oczka: '', na: uklad === 'cm' ? '10cm' : '4in' }} zProjektu={zProjektu}
      licz={(w) => stanProbki(w, { t, jezyk: () => 'en-US' })} />,
  );
  test('R-131 / BR-KAL-003: jednostka z ustawień przy polu szerokości (P-075 (4a)); domyślna podstawa próbki', () => {
    const r = ekran('cm');
    expect(screen.getByLabelText('Width you want, cm')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'per 10 cm' }).props.accessibilityState).toMatchObject({ selected: true });
    r.unmount();
    ekran('in');
    expect(screen.getByLabelText('Width you want, in')).toBeTruthy();
    expect(screen.queryByLabelText('Width you want, cm')).toBeNull();
    expect(screen.getByRole('radio', { name: 'per 4 in' }).props.accessibilityState).toMatchObject({ selected: true });
  });
  test('BR-KAL-003/S1 + BR-KAL-001/S1 na żywo (scenariusz 41): 20 na 4 in, 10 in → 19.7 na 10 cm (ER-62) i 50 oczek, blok grubości', () => {
    ekran('in');
    fireEvent.changeText(screen.getByTestId('probka-oczka'), '20');
    expect(screen.getByText('= 19.7 stitches per 10 cm')).toBeTruthy();
    expect(screen.queryByTestId('probka-wynik-oczka')).toBeNull();
    fireEvent.changeText(screen.getByTestId('probka-szerokosc'), '10');
    expect(screen.getByTestId('probka-wynik-oczka')).toHaveProperty('props.children', '50 stitches');
    expect(screen.getByTestId('probka-wynik-grubosc')).toBeTruthy();
  });
  test('przełączenie na 10 cm liczy od nowa; brak próbki przy szerokości → komunikat ze znakiem, bez wyniku (RD-01-W5)', () => {
    ekran('cm', 'Swatch of Harbor Sweater · saved with the project');
    expect(screen.getByText('Swatch of Harbor Sweater · saved with the project')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('probka-szerokosc'), '50');
    expect(screen.getByRole('alert')).toHaveProperty('props.accessibilityLabel', 'Enter the stitches in your swatch first.'); // M3 p4b: znak „!” w kółku (ukryty przed VoiceOver), zdanie osobno
    expect(screen.getByText('Enter the stitches in your swatch first.')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('probka-oczka'), '22');
    expect(screen.getByTestId('probka-wynik-oczka')).toHaveProperty('props.children', '110 stitches');
    fireEvent.press(screen.getByRole('radio', { name: 'per 4 in' }));
    expect(screen.getByTestId('probka-wynik-oczka')).toHaveProperty('props.children', '108.3 stitches'); // DEC-34 a (ER-62): wyliczona z 1 miejscem (pełna 108,268)
  });
  // M1-133 (04-studio-projektowe-523, opcja b — bez nowego elementu): klawiatura dziesiętna nie ma Return, a wynik chował się pod nią.
  // Ekran odsuwa treść nad klawiaturę, przy wpisywaniu szerokości przewija pole na górę (wynik tuż pod nim), a klawiaturę chowa gest w dół.
  test('M1-133: przy wpisywaniu szerokości wynik nad klawiaturą — wcięcie od klawiatury, przewinięcie do pola szerokości, chowanie gestem', () => {
    ekran('in');
    const przewijanie = screen.UNSAFE_getByType(ScrollView);
    expect(przewijanie.props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(przewijanie.props.keyboardDismissMode).toBe('interactive');
    fireEvent(screen.getByTestId('probka-szerokosc-pole'), 'layout', { nativeEvent: { layout: { x: 16, y: 212, width: 370, height: 70 } } });
    fireEvent(screen.getByTestId('probka-szerokosc'), 'focus');
    expect(przewijanie.instance.scrollTo).toHaveBeenCalledWith({ y: 212, animated: true });
  });
});
