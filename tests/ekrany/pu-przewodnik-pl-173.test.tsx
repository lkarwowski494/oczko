// PU-173 (katalog przypadków użycia, „Języki”): po polsku ekran „/przewodnik” ma nagłówki „Przewodnik”, „Pierwsze kroki”, „Biblioteka funkcji”, „Przeczytane: 0 z 42” i „Pokaż”;
// krok 2 cytuje „Nazwij projekt i część”, a ta sama pozycja jest w menu ••• licznika (`menu-nazwa`). Poziom: trasa na prawdziwej bazie i prawdziwym i18n pl + `MenuProjektu` z `src/ekrany`.
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import { MenuProjektu } from '../../src/ekrany/MenuProjektu';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';

const mockRouter = { back: jest.fn(), push: jest.fn(), navigate: jest.fn(), dismissAll: jest.fn(), dismissTo: jest.fn(), canDismiss: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranPrzewodnika = (require('../../app/przewodnik') as { default: React.ComponentType }).default;

// PU-173: nagłówki i krok 2 przewodnika po polsku, pozycja „Nazwij projekt i część” identyczna w menu •••.
test('PU-173: przewodnik po polsku — nagłówki, „Przeczytane: 0 z 42”, „Pokaż”, krok 2 cytuje „Nazwij projekt i część” jak pozycja menu •••', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => 'pl', zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  expect(i.jezyk()).toBe('pl');
  mockAplikacja = { kontener: { z: s.z, j: { ...j, t: i.t, jezyk: i.jezyk } }, licznik: k };
  render(<EkranPrzewodnika />);
  await screen.findByTestId('przewodnik');
  expect(screen.getAllByRole('header').map((h) => h.props.children)).toEqual(expect.arrayContaining(['Przewodnik', 'Pierwsze kroki', 'Biblioteka funkcji']));
  expect(screen.getByTestId('przewodnik-postep')).toHaveTextContent('Przeczytane: 0 z 42');
  expect(screen.getByTestId('przewodnik-krok-2-pokaz')).toHaveTextContent(/Pokaż/);
  expect(screen.getByTestId('przewodnik-krok-2')).toHaveTextContent(/„Nazwij projekt i część”/);
  screen.unmount();
  render(<MenuProjektu stan={{ projekt: 'Sweter', zablokowany: false, wartosc: 3 }} t={i.t} naNazwa={jest.fn()} naWpisz={jest.fn()} naZablokuj={jest.fn()} naOdblokuj={jest.fn()} naZeruj={jest.fn()} naUkoncz={jest.fn()} naZamknij={jest.fn()} />);
  expect(within(screen.getByTestId('menu-nazwa')).getByText('Nazwij projekt i część')).toBeTruthy();
});
