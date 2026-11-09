// M3-IPAD-01 (P-606, wariant a): koło „+1” na „Dziś” (72 pt, `cel.plus`) pokazuje tylko „+1” — „+1 row” / „+1 stitch” przy 26 pt było szersze niż koło.
// Etykieta VoiceOver bez zmian (ta sama co `licznik-plus`: „+1 row, when row N is done”, „Add stitch”, przy pierwszym liczniku „+1 row”).
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis, type PropsDzis } from '../../src/ekrany/Dzis';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
function pokaz(stan: PropsDzis['stan']) {
  render(<Dzis stan={stan} dane={DANE} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(43))} naCofnijSerie={jest.fn()} naOferty={jest.fn()}
    naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} />);
}
const tekstKola = (): string => {
  const w = screen.getByTestId('dzis-plus');
  return screen.UNSAFE_getAllByType(Text).filter((n) => w.findAll((x) => x === n).length > 0).map((n) => String(n.props.children)).join('');
};

describe('„Dziś”: koło „+1” (P-606)', () => {
  test('rzędy: widoczny tekst tylko „+1”, etykieta VoiceOver „+1 row, when row 43 is done” bez zmian', () => {
    pokaz(stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }));
    expect(tekstKola()).toBe('+1');
    expect(screen.getByTestId('dzis-plus').props.accessibilityLabel).toBe(t('licznik.plus_a11y', { n: 43 }));
  });
  test('oczka: widoczny tekst tylko „+1”, etykieta VoiceOver „Add stitch” bez zmian', () => {
    pokaz(stanLicznika({ rodzaj: 'oczka', projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 5, dziergany: 6, cel: null }));
    expect(tekstKola()).toBe('+1');
    expect(screen.getByTestId('dzis-plus').props.accessibilityLabel).toBe(t('licznik.plus_a11y_oczka'));
  });
  test('pierwszy licznik: widoczny tekst tylko „+1”, etykieta VoiceOver „+1 row” bez zmian', () => {
    pokaz(stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 }));
    expect(tekstKola()).toBe('+1');
    expect(screen.getByTestId('dzis-plus').props.accessibilityLabel).toBe(t('licznik.plus'));
  });
  test('koło bez zmian: 72 × 72 pt (cel.plus)', () => {
    pokaz(stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }));
    expect(StyleSheet.flatten(screen.getByTestId('dzis-plus').props.style)).toMatchObject({ width: 72, height: 72 });
  });
});
