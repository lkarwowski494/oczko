// Wzór na liczniku (design-spec „Gdzie jest wzór”, W2a) po M3 p3a (P-580, P-586): wiersz „Pattern” / „Add pattern…” zniknął z menu •••; wzór otwiera akcja `licznik-wzor` pod liczbą
// (zawsze widoczna, także bez wzoru — dotychczasowe dodanie wzoru; menu źródeł to p3b). subflow otworz-wzor-pdf stuka `licznik-wzor` (testid.md M3-TESTID-02).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import { MenuProjektu } from '../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('menu ••• nie ma wiersza wzoru (testID `menu-wzor` wycofany), „Pattern” ani „Add pattern…”', () => {
  render(<MenuProjektu stan={{ projekt: 'Harbor', zablokowany: false, wartosc: 3 }} t={t} naNazwa={jest.fn()} naWpisz={jest.fn()} naZablokuj={jest.fn()} naOdblokuj={jest.fn()} naZeruj={jest.fn()} naUkoncz={jest.fn()} naZamknij={jest.fn()} />);
  expect(screen.queryByTestId('menu-wzor')).toBeNull();
  expect(screen.queryByText('Pattern')).toBeNull();
  expect(screen.queryByText('Add pattern…')).toBeNull();
});

test('akcja „Pattern” na liczniku otwiera wzór', () => {
  const naWzor = jest.fn();
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor' })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naWzor={naWzor} />);
  fireEvent.press(screen.getByRole('button', { name: 'Pattern' }));
  expect(naWzor).toHaveBeenCalledTimes(1);
});
