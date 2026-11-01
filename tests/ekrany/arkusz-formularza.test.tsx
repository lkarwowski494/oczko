// P-275 (4), korekta P-271 (2): arkusz formularza (pola, klawiatura) ma Cancel / tytuł / Save w nagłówku u góry (design-spec „Komponenty”,
// makiety od E3 `naglowek-arkusza`; Trening design-spec:66), więc klawiatura go nie zasłania — bez zależności od zdarzeń klawiatury (P-262 (a)).
// Arkusz decyzji bez pól zostaje z przyciskami na dole (`arkusz-przyciski`).
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Arkusz, Pole } from '../../src/ekrany/Arkusz';
import { FormularzWartosci } from '../../src/ekrany/Formularze';
import { FormularzCzesci } from '../../src/ekrany/FormularzeProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const kolejnosc = (testIdy: string[]) => {
  const wszystkie = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
  return testIdy.map((id) => wszystkie.indexOf(id));
};

test('formularz: Cancel i Save w nagłówku nad treścią (przed polem), bez paska na dole; tytuł jako nagłówek między nimi', () => {
  const naZapisz = jest.fn(); const naAnuluj = jest.fn();
  render(<Arkusz tytul="Type a number" formularz={{ t, naZapisz, naAnuluj }}><Pole etykieta="Value" wartosc="" naZmiane={() => undefined} testID="pole" /></Arkusz>);
  const naglowek = screen.getByTestId('arkusz-naglowek');
  expect(within(naglowek).getByRole('header', { name: 'Type a number' })).toBeTruthy();
  const [anuluj, zapisz, pole] = kolejnosc(['arkusz-zamknij', 'formularz-zapisz', 'pole']);
  expect(anuluj).toBeGreaterThanOrEqual(0);
  expect(anuluj < zapisz && zapisz < pole).toBe(true); // Cancel lewy, Save prawy, oba przed treścią
  expect(within(naglowek).getByTestId('formularz-zapisz')).toBeTruthy();
  expect(screen.queryByTestId('arkusz-przyciski')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  expect([naZapisz.mock.calls.length, naAnuluj.mock.calls.length]).toEqual([1, 1]);
});

test('formularz: Save nieaktywny (stan disabled), własny tekst, etykieta i testID', () => {
  const naZapisz = jest.fn();
  render(<Arkusz tytul="T" formularz={{ t, naZapisz, naAnuluj: () => undefined, zapisz: 'Add', zapiszA11y: 'Add part', testZapisz: 'x-zapisz', wylaczony: true }}>{null}</Arkusz>);
  const z = screen.getByTestId('x-zapisz');
  expect(z.props.accessibilityState).toEqual({ disabled: true });
  expect(screen.getByRole('button', { name: 'Add part' })).toBeTruthy();
  expect(screen.getByText('Add')).toBeTruthy();
  fireEvent.press(z);
  expect(naZapisz).not.toHaveBeenCalled();
});

test('arkusz decyzji (przyciski, bez formularza): przyciski na dole jak dotąd, bez nagłówka formularza', () => {
  render(<Arkusz tytul="What’s next?" przyciski={<Text>Not now</Text>}>{null}</Arkusz>);
  expect(screen.getByTestId('arkusz-przyciski')).toBeTruthy();
  expect(screen.queryByTestId('arkusz-naglowek')).toBeNull();
});

test('formularze aplikacji: wpisanie wartości i nowa część mają Save w nagłówku (nie na dole)', () => {
  render(<FormularzWartosci stan={{ obecna: 3 }} t={t} jezyk="en" tekstLimitu="" naZapisz={async () => ({ ok: true, wartosc: undefined })} naAnuluj={() => undefined} />);
  expect(within(screen.getByTestId('arkusz-naglowek')).getByTestId('formularz-zapisz')).toBeTruthy();
  screen.unmount();
  render(<FormularzCzesci t={t} naZapisz={async () => ({ ok: true, wartosc: undefined })} naAnuluj={() => undefined} />);
  expect(within(screen.getByTestId('arkusz-naglowek')).getByTestId('formularz-zapisz')).toBeTruthy();
});
