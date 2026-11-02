// 033-T1 (07-jakosc-033 A, lista dla 08 #1): `testID="powtorzenie-dlugosc-pole"` na polu długości powtórzenia, TRASA „/formularz/[rodzaj]” (rodzaj `powtorzenie`), prawdziwa baza.
// Scenariusze E2E 55 i 56 wpisują długość przez `retry` jak w pozostałych formularzach (zasada 6 README) i sprawdzają wartość pola. Zachowanie bez zmian (klawiatura liczbowa, ta sama etykieta). P-377.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({ rodzaj: 'powtorzenie' }), useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); } }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;

test('033-T1: pole długości powtórzenia ma testID `powtorzenie-dlugosc-pole`, etykietę „Rows in one repeat” i klawiaturę liczbową', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 17), ['UPDATE licznik SET dlugosc_powtorzenia = 8 WHERE id = ?', ['l1']]]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  render(<EkranFormularza />);
  await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
  const pole = screen.getByTestId('powtorzenie-dlugosc-pole');
  expect(pole.props.accessibilityLabel).toMatch(/^Rows in one repeat/);
  expect(pole.props.keyboardType).toBe('number-pad');
  expect(pole.props.value).toBe('8');
  // wpis przez testID i zapis przyciskiem arkusza (jak scenariusze 55 i 56): długość 10 trafia do licznika, a zachowanie formularza się nie zmieniło
  fireEvent.changeText(pole, '10');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(async () => expect(await widokLicznika(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { powtorzenie: { numer: 2, rzadW: 7, dlugosc: 10 } } }));
});
