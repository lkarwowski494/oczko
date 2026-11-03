// DEC-45 a (M1-audytor-generalny-196; 09-lokalizacja-520): w polach długości i wagi motka wpis 1–3 cyfry, separator grupowania języka, 3 cyfry
// („1,094” w en z etykiety motka, „1.000” w de) to zapis tysięcy, nie ułamek — pole go odrzuca z podpowiedzią zapisu bez separatora.
// Reszta według DEC-12 a: „3,5” w en i „3.5” w pl dalej dają 3,5; pole całkowite licznika bez zmian (BR-LIC-017: de „1.000” → 1000).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormularzWloczki } from '../../src/ekrany/Zapas';
import { bazowa, podpowiedzPolaMotka, przeliczenie } from '../../src/kompozycja/zapas';
import { parsujCalkowita } from '../../src/i18n/format';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

describe('bazowa: zapis tysięcy z separatorem grupowania języka odrzucony (DEC-45 a)', () => {
  test.each([
    ['1,094', 'yd', 'en'], ['1.000', 'm', 'de'], ['1,000', 'g', 'en'], ['12,500', 'm', 'en-US'], ['2.500', 'oz', 'de'], [' 1,094 ', 'yd', 'en'],
  ] as const)('„%s” %s w %s → zly', (tekst, jedn, jezyk) => {
    expect(bazowa(tekst, jedn, jezyk)).toBe('zly');
  });
  test.each([
    ['3,5', 'm', 'en', 3.5], ['3.5', 'm', 'pl', 3.5], ['21.5', 'g', 'de', 21.5], ['1.094', 'm', 'en', 1.094], ['1,25', 'm', 'en', 1.25],
    ['1094', 'm', 'en', 1094], ['1000', 'g', 'de', 1000], ['1,0945', 'm', 'en', 1.0945], ['1.000', 'm', 'pl', 1],
  ] as const)('„%s” %s w %s → %p (DEC-12 a bez zmian)', (tekst, jedn, jezyk, wynik) => {
    expect(bazowa(tekst, jedn, jezyk)).toBe(wynik);
  });
  test('pole całkowite licznika bez zmian (BR-LIC-017)', () => {
    expect(parsujCalkowita('1.000', 'de')).toBe(1000);
    expect(parsujCalkowita('1,000', 'en')).toBe(1000);
  });
});

describe('podpowiedź pod polem długości i wagi (DEC-45 a)', () => {
  test('podpowiedzPolaMotka: zapis bez separatora; inny wpis bez podpowiedzi', () => {
    const j = { t, jezyk: () => 'en-US' };
    expect(podpowiedzPolaMotka('1,094', j)).toBe('Write it as 1094.');
    expect(podpowiedzPolaMotka('3,5', j)).toBeNull();
    expect(podpowiedzPolaMotka('abc', j)).toBeNull();
  });
  test('formularz włóczki: „1,094” w długości — podpowiedź „Write it as 1094.”, brak przeliczenia, zapis wyłączony', () => {
    const j = { t, jezyk: () => 'en-US' };
    render(<FormularzWloczki t={t} jednostki="imperialne" poczatek={null} przelicz={(x, u) => przeliczenie(x, u, j)} bazowa={(x, u) => bazowa(x, u, 'en-US')}
      podpowiedz={(x) => podpowiedzPolaMotka(x, j)} formatuj={String} naZapisz={jest.fn()} naAnuluj={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('zapas-nazwa'), 'Fjord');
    fireEvent.changeText(screen.getByTestId('zapas-dlugosc'), '1,094');
    expect(screen.getByRole('alert')).toHaveProperty('props.children', '! Write it as 1094.');
    expect(screen.queryByText(/= .* m$/)).toBeNull();
    expect(screen.getByTestId('formularz-zapisz').props.accessibilityState?.disabled).toBe(true);
  });
});
