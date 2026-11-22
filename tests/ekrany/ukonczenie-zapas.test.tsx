// Grupa „Yarn used” na karcie ukończenia (F-37, BR-ZAP-002, U-9, P-126 (2a); design-spec „Zużycie włóczki przy ukończeniu”).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Ukonczenie, type StanUkonczenia } from '../../src/ekrany/Ukonczenie';
import { parsujLiczbe, formatujLiczbe } from '../../src/i18n/format';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const STAN: StanUkonczenia = { nazwa: 'Harbor Sweater', okres: 'Oct 1 – Oct 21', dni: 21, rzedy: 640, czas: null, czesci: 4,
  wloczka: [{ id: 'w1', nazwa: 'Fjord Wool, Slate', motki: 2, zuzyto: null }], zdjecie: null };
const LICZBY = { formatuj: (n: number) => formatujLiczbe(n, 'en', { maks: 2 }), parsuj: (x: string) => parsujLiczbe(x, 'en') };
function pokaz(s: Partial<StanUkonczenia> = {}) {
  const w = { naUdostepnij: jest.fn(), naGotowe: jest.fn(), naEdytujZapas: jest.fn() };
  render(<Ukonczenie stan={{ ...STAN, ...s }} t={t} oglos={jest.fn()} system={atrapaSystemu()} liczby={LICZBY} {...w} />);
  return w;
}
const pole = () => screen.getByRole('adjustable', { name: 'Skeins of Fjord Wool, Slate used' });
const wiecej = () => fireEvent.press(screen.getByRole('button', { name: 'One skein more', hidden: true }));

describe('Yarn used', () => {
  test('wiersz: nazwa, „2 skeins in your stash”, pole adjustable z etykietą; bez wpisu „Done” niczego nie zapisuje', () => {
    const w = pokaz();
    expect(screen.getByText('Fjord Wool, Slate')).toBeTruthy();
    expect(screen.getByText('2 skeins in your stash')).toBeTruthy();
    expect(pole()).toBeTruthy();
    fireEvent.press(przycisk('Done', 'button'));
    expect(w.naGotowe).toHaveBeenCalledWith([]);
  });

  test('krokowiec: + co 0,5; akcje VoiceOver zwiększ/zmniejsz; „Done” zapisuje zużyte motki', () => {
    const w = pokaz();
    wiecej(); wiecej();
    expect(pole().props.accessibilityValue).toEqual({ text: '1' });
    fireEvent(pole(), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(pole().props.accessibilityValue).toEqual({ text: '1.5' });
    fireEvent(pole(), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    fireEvent.press(przycisk('Done', 'button'));
    expect(w.naGotowe).toHaveBeenCalledWith([{ wloczkaId: 'w1', motki: 1 }]);
  });

  test('P-126 (2a): ponad zapas przyjęte, jedna linia informacji (status) i „Edit stash”; „Done” działa', () => {
    const w = pokaz();
    for (let i = 0; i < 5; i++) wiecej();
    const linia = screen.getByText('That’s more than the 2 skeins in your stash. Your stash will show 0.');
    expect(linia).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
    fireEvent.press(przycisk('Edit stash', 'link'));
    expect(w.naEdytujZapas).toHaveBeenCalledWith('w1');
    fireEvent.press(przycisk('Done', 'button'));
    expect(w.naGotowe).toHaveBeenCalledWith([{ wloczkaId: 'w1', motki: 2.5 }]);
  });

  test('zapas już 0: „Your stash already shows 0 for this yarn.”', () => {
    pokaz({ wloczka: [{ id: 'w1', nazwa: 'Fjord Wool, Slate', motki: 0, zuzyto: null }] });
    wiecej();
    expect(screen.getByText('Your stash already shows 0 for this yarn.')).toBeTruthy();
  });

  test('wpis z klawiatury według języka; zapis niezgodny odrzucony (wartość bez zmian); poprzednie zużycie w polu', () => {
    const w = pokaz({ wloczka: [{ id: 'w1', nazwa: 'Fjord Wool, Slate', motki: 2, zuzyto: 1 }] });
    const wejscie = screen.getByTestId('ukonczenie-zuzycie-w1');
    expect(wejscie.props.value).toBe('1');
    fireEvent.changeText(wejscie, '1.5');
    fireEvent(wejscie, 'endEditing');
    fireEvent.changeText(wejscie, 'abc');
    fireEvent(wejscie, 'endEditing');
    expect(pole().props.accessibilityValue).toEqual({ text: '1.5' });
    fireEvent.press(przycisk('Done', 'button'));
    expect(w.naGotowe).toHaveBeenCalledWith([{ wloczkaId: 'w1', motki: 1.5 }]);
  });

  test('nieudany zapis: widoczny komunikat, karta zostaje', () => {
    pokaz({ bladZapisu: true });
    expect(screen.getByText('That didn’t work. Your data is unchanged.')).toBeTruthy();
  });
});
