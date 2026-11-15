// PU-171 (katalog przypadków użycia, „Języki”): wybór „Polski” → „Dziś”, licznik („+1 rząd”), „Ustawienia”, „Oczko Pro” i wiersz „Licencje open source” po polsku, a wybór zostaje po restarcie.
// Poziom: prawdziwy i18n z magazynem `magazynJezyka` w bazie (node:sqlite) i prawdziwe ekrany z `src/ekrany` renderowane z `t` takiego i18n po „restarcie”.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Dzis } from '../../src/ekrany/Dzis';
import { Licznik } from '../../src/ekrany/Licznik';
import { Oferty } from '../../src/ekrany/Oferty';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { magazynJezyka } from '../../src/przypadki-uzycia/jezyk';
import { przygotuj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, atrapaSystemu, plusOk, stanLicznika, wywolaniaLicznika } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));

// PU-171: po wyborze „Polski” i restarcie ekrany Dziś, Licznik, Ustawienia, Oferty i wiersz licencji mają polskie teksty.
test('PU-171: „Polski” zapisany → po restarcie „Dziś”, „+1 rząd”, „Ustawienia”, „Oczko Pro” i „Licencje open source” po polsku', async () => {
  const s = await przygotuj();
  const start = () => utworzI18n({ magazyn: magazynJezyka(s.z), systemowe: () => ['en-US'], zasoby: ZASOBY });
  await (await start()).ustawJezyk('pl');
  const i = await start(); // restart: język z bazy, nie z systemu
  expect(i.jezyk()).toBe('pl');
  const t = i.t;

  const r1 = render(<Dzis stan={stanLicznika()} dane={null} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(48))} naCofnijSerie={jest.fn()} naOferty={jest.fn()}
    naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naPrzewodnik={jest.fn()} />);
  expect(screen.getByText('Dziś')).toBeTruthy();
  r1.unmount();
  const r2 = render(<Licznik stan={stanLicznika()} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.getByText('+1 rząd')).toBeTruthy();
  r2.unmount();
  const r3 = render(<Ustawienia stan={{ pro: null, dni: null, wibracje: true }} t={t} system={atrapaSystemu()}
    adresy={{ polityka: 'https://example.invalid/p', wsparcie: 'https://example.invalid/s', recenzja: 'https://example.invalid/r' }}
    naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} naLicencje={jest.fn()} />);
  expect(screen.getByText('Ustawienia')).toBeTruthy();
  expect(screen.getByTestId('ustawienia-licencje')).toHaveTextContent('Licencje open source');
  r3.unmount();
  render(<Oferty stan={{ produkty: { rodzaj: 'gotowe', produkty: [] }, aktywne: null, familySharing: true }} t={t}
    adresy={{ polityka: 'https://example.invalid/p', warunki: 'https://example.invalid/w' }} naKup={jest.fn()} naPrzywroc={jest.fn()} naZarzadzaj={jest.fn()} naOtworzAdres={jest.fn()} naZamknij={jest.fn()} />);
  expect(screen.getAllByText('Oczko Pro').length).toBeGreaterThan(0);
});
