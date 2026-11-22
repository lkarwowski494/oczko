// E2-137-A3/A4: panel buildu E2E `e2e-pomiar-operacji` — ms ostatnich operacji (import do „import-gotowy”, dodanie zdjęcia, wczytanie projektu po nim)
// albo „running”, gdy operacja trwa i nie skończyła się. Zielone przebiegi też go pokazują, więc „maszyna wolna” i „aplikacja wisi” da się rozdzielić liczbą (bez t(), e2e/README.md).
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { koniecOperacji, PanelPomiaruOperacji, poczatekOperacji, zerujPomiarOperacji, zmierzOperacje } from '../../src/kompozycja/e2e/pomiar-operacji';

let teraz = 1000;
beforeEach(() => { teraz = 1000; zerujPomiarOperacji(); jest.spyOn(performance, 'now').mockImplementation(() => teraz); });
afterEach(() => jest.restoreAllMocks());
const tekst = () => screen.getByTestId('e2e-pomiar-operacji').props.children;

test('bez żadnej operacji panelu nie ma', () => {
  render(<PanelPomiaruOperacji />);
  expect(screen.queryByTestId('e2e-pomiar-operacji')).toBeNull();
});
test('zakończona operacja: „import 120 ms”; kolejne w stałej kolejności import · photo · project', () => {
  render(<PanelPomiaruOperacji />);
  act(() => { poczatekOperacji('zdjecie'); teraz += 45.4; koniecOperacji('zdjecie', true); });
  act(() => { poczatekOperacji('import'); teraz += 120; koniecOperacji('import', true); });
  act(() => { poczatekOperacji('projekt'); teraz += 8; koniecOperacji('projekt', true); });
  expect(tekst()).toBe('import 120 ms · photo 45 ms · project 8 ms');
});
test('operacja w toku: „photo running” (rozróżnia zawieszenie od wolnej maszyny); błąd: „(error)”', () => {
  render(<PanelPomiaruOperacji />);
  act(() => { poczatekOperacji('zdjecie'); });
  expect(tekst()).toBe('photo running');
  act(() => { teraz += 30; koniecOperacji('zdjecie', false); });
  expect(tekst()).toBe('photo 30 ms (error)');
});
test('koniec bez początku nic nie zapisuje; drugi koniec nie nadpisuje pierwszego (import: „gotowy” i późniejszy powrót)', () => {
  render(<PanelPomiaruOperacji />);
  act(() => { koniecOperacji('import', true); });
  expect(screen.queryByTestId('e2e-pomiar-operacji')).toBeNull();
  act(() => { poczatekOperacji('import'); teraz += 10; koniecOperacji('import', true); teraz += 5000; koniecOperacji('import', false); });
  expect(tekst()).toBe('import 10 ms');
});
test('zmierzOperacje: mierzy obietnicę, oddaje wynik, błąd rzuca dalej i zapisuje „(error)”', async () => {
  render(<PanelPomiaruOperacji />);
  await act(async () => { await expect(zmierzOperacje('projekt', async () => { teraz += 7; return 42; })).resolves.toBe(42); });
  expect(tekst()).toBe('project 7 ms');
  await act(async () => { await expect(zmierzOperacje('projekt', async () => { teraz += 3; throw new Error('x'); })).rejects.toThrow('x'); });
  expect(tekst()).toBe('project 3 ms (error)');
});
