// 07-jakosc NOC-4 (wyjątek P-404: wdrożenie przez 07; do commitu wdrożenia test był czerwony w tests/akceptacja/ekrany): testID pojedynczych opcji radia `Wybor` (src/ekrany/Arkusz.tsx:134).
// Dziś scenariusze Maestro stukają opcje po tekście („Needles”, „Stitches”, „The row I’m on”), który powtarza się na ekranie i zmienia z językiem.
// Kontrakt dla 08 (e2e/README.md, wiersze `wybor-*`): `opcje[].testID?` przekazane do `Pressable` opcji; wywołania w FormularzeProjektu.tsx podają
// `wybor-rodzaj-rzedy|oczka`, `wybor-znaczenie-skonczone|w-trakcie`, `wybor-narzedzie-druty|szydelko` (id tylko [a-z0-9-], README zasada 2: bez `_` z wartości `w_trakcie`).
// Wyrocznia: decyzja koordynatora (P-087) o kontrakcie id + istniejąca semantyka radia (`accessibilityRole radio`, `selected`), nie wynik testowanego kodu.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormularzLicznika, FormularzNarzedzia, FormularzZnaczenia } from '../../src/ekrany/FormularzeProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const ok = () => jest.fn(async () => ({ ok: true as const }));

const opcja = (id: string) => screen.getByTestId(id);
const zaznaczona = (id: string) => opcja(id).props.accessibilityState?.selected === true;

describe('NOC-4 · testID opcji radia Wybor', () => {
  test('BR-LIC-012/S1 (F-09) znaczenie: wybor-znaczenie-skonczone i wybor-znaczenie-w-trakcie są radiami; stuknięcie przenosi zaznaczenie', () => {
    render(<FormularzZnaczenia t={t} wartosc={12} znaczenie="skonczone" naZapisz={ok() as any} naAnuluj={jest.fn()} />);
    expect(opcja('wybor-znaczenie-skonczone').props.accessibilityRole).toBe('radio');
    expect(zaznaczona('wybor-znaczenie-skonczone')).toBe(true);
    expect(zaznaczona('wybor-znaczenie-w-trakcie')).toBe(false);
    fireEvent.press(opcja('wybor-znaczenie-w-trakcie'));
    expect(zaznaczona('wybor-znaczenie-w-trakcie')).toBe(true);
    expect(zaznaczona('wybor-znaczenie-skonczone')).toBe(false);
  });
  test('BR-LIC-006/S1 (F-04) rodzaj licznika: wybor-rodzaj-rzedy (domyślnie) i wybor-rodzaj-oczka', () => {
    render(<FormularzLicznika t={t} czesci={[{ id: 'c1', nazwa: 'Back' }]} domyslnaCzesc="c1" naZapisz={ok() as any} naAnuluj={jest.fn()} />);
    expect(zaznaczona('wybor-rodzaj-rzedy')).toBe(true);
    fireEvent.press(opcja('wybor-rodzaj-oczka'));
    expect(zaznaczona('wybor-rodzaj-oczka')).toBe(true);
    expect(zaznaczona('wybor-rodzaj-rzedy')).toBe(false);
  });
  test('BR-PRJ-004/S1 (F-17) narzędzie: wybor-narzedzie-druty i wybor-narzedzie-szydelko', () => {
    render(<FormularzNarzedzia t={t} jezyk="en" narzedzie="druty" mm={null} podglad={() => ''} naZapisz={ok() as any} naAnuluj={jest.fn()} />);
    expect(zaznaczona('wybor-narzedzie-druty')).toBe(true);
    fireEvent.press(opcja('wybor-narzedzie-szydelko'));
    expect(zaznaczona('wybor-narzedzie-szydelko')).toBe(true);
    expect(zaznaczona('wybor-narzedzie-druty')).toBe(false);
  });
});
