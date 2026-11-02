// 07-jakosc-024 (F-45, ZM-08, BR-LIC-017 S5 „ponad limit”, ER-43 „zapis regionu”): trasa „/formularz/wpisz” na prawdziwej bazie.
// Wpisanie wartości na limicie dni mówi o limicie (nie „whole number”), nie zapisuje; liczba z separatorem tysięcy regionu jest przyjmowana.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LIMIT_DNI_W_MIESIACU } from '../../src/konfiguracja';
import { czesc, dzienLimitu, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({ rodzaj: 'wpisz' }), useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); } })); // useFocusEffect: patrz przypomnienia-trasa.test.tsx
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;

async function start(dniLimitu: number) {
  const { s, k, j } = await kompozycjaTestowa();
  const dni = Array.from({ length: dniLimitu }, (_, i) => dzienLimitu(`2026-10-${String(i + 1).padStart(2, '0')}`, `zd${i}`));
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), ...dni]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  mockRouter.back.mockClear();
  render(<EkranFormularza />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  return { k };
}
const wpisz = async (tekst: string) => {
  fireEvent.changeText(screen.getByTestId('wpisz-wartosc-pole'), tekst);
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 100)); });
};

test('024/S5: wpisanie w nowym dniu ponad limit mówi o limicie, nie zapisuje i nie zamyka arkusza', async () => {
  const { k } = await start(5);
  await wpisz('10');
  const komunikat = screen.getByRole('alert');
  expect(JSON.stringify(komunikat.props.children)).toContain(`Your ${LIMIT_DNI_W_MIESIACU} free knitting days for October are used`);
  expect(screen.queryByText('Enter a whole number, 0 or more.')).toBeNull();
  expect(mockRouter.back).not.toHaveBeenCalled();
  expect((await k.widok())?.wartosc).toBe(3);
});
test('024/S5: poniżej limitu wpisanie zapisuje wartość i zamyka arkusz (strażnik jak +1)', async () => {
  const { k } = await start(2);
  await wpisz('10');
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  expect((await k.widok())?.wartosc).toBe(10);
});
test('024/ER-43: „1,000” w en-US to 1000', async () => {
  const { k } = await start(2);
  await wpisz('1,000');
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  expect((await k.widok())?.wartosc).toBe(1000);
});
test('024/ER-43: zapis niezgodny z regionem („1.5”) nie zmienia licznika i podaje, jakiej liczby trzeba', async () => {
  const { k } = await start(2);
  await wpisz('1.5');
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Enter a whole number, 0 or more.')).toBeTruthy();
  expect(mockRouter.back).not.toHaveBeenCalled();
  expect((await k.widok())?.wartosc).toBe(3);
});
