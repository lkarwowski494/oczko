// Linia konfliktu iCloud na liczniku (design-spec „Konflikt na liczniku (I1a)”, nazwany wyjątek od P-046, P-220; testID `licznik-konflikt`,
// scenariusz 49): liczba = wersja tego urządzenia, pod nią linia z opisem i „Choose”; ogłoszenie VoiceOver raz przy pojawieniu się.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

describe('licznik w konflikcie iCloud (P-220 I1a)', () => {
  test('bez konfliktu — brak linii', () => {
    render(<Licznik stan={stanLicznika()} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
    expect(screen.queryByTestId('licznik-konflikt')).toBeNull();
  });
  test('konflikt: linia z nagłówkiem i opisem (1 tutaj, 6 z iPada), „Choose” otwiera wybór; ogłoszenie raz', () => {
    const naKonflikt = jest.fn();
    const oglos = jest.fn();
    const stan = stanLicznika({ skonczone: 1, dziergany: 2, konflikt: { lokalna: 1, zdalna: 6, urzadzenie: 'iPad (test)' } });
    const { rerender } = render(<Licznik stan={stan} t={t} oglos={oglos} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naKonflikt={naKonflikt} />);
    expect(screen.getByTestId('licznik-konflikt')).toBeTruthy();
    expect(screen.getByText('Two versions of this counter')).toBeTruthy();
    expect(screen.getByText('1 row here, 6 rows from iPad (test). Choose the one that matches your work.')).toBeTruthy();
    fireEvent.press(screen.getByText('Choose'));
    expect(naKonflikt).toHaveBeenCalled();
    rerender(<Licznik stan={{ ...stan }} t={t} oglos={oglos} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naKonflikt={naKonflikt} />);
    expect(oglos.mock.calls.filter(([x]) => String(x).startsWith('Two versions of this counter'))).toHaveLength(1);
  });
});
