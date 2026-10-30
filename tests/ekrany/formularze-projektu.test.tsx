// Arkusze partii 5 (design-spec „Arkusze”, makiety fix5 `nowy-projekt`, `dodaj-czesc`, `dodaj-licznik`, `notatka`, `znaczenie`, `narzedzie`, `co-dalej`).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CoDalej, FormularzCzesci, FormularzLicznika, FormularzNarzedzia, FormularzNotatki, FormularzNowegoProjektu, FormularzZnaczenia } from '../../src/ekrany/FormularzeProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const ok = () => jest.fn(async () => ({ ok: true as const, wartosc: undefined }));

test('nowy projekt: nazwa i części (dodawane odnośnikiem); pusta nazwa nic nie blokuje (projekt roboczy, P-126 (1b))', async () => {
  const naZapisz = ok();
  render(<FormularzNowegoProjektu t={t} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  expect(screen.getByText('Add parts now or later. Without parts, the project has one counter.')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Project'), ' Harbor ');
  fireEvent.press(przycisk('Add part', 'button'));
  fireEvent.changeText(screen.getByLabelText('Part 1'), 'Back'); // 04-studio-projektowe-005: etykieta z numerem
  fireEvent.press(przycisk('Add part', 'button'));
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith({ nazwa: 'Harbor', czesci: ['Back'] }));
  naZapisz.mockClear();
  render(<FormularzNowegoProjektu t={t} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith({ nazwa: '', czesci: [] }));
});

test('04-studio-projektowe-005: kilka pól części w nowym projekcie ma różne etykiety („Part 1”, „Part 2”), VoiceOver je rozróżnia', () => {
  render(<FormularzNowegoProjektu t={t} naZapisz={ok()} naAnuluj={jest.fn()} />);
  fireEvent.press(przycisk('Add part', 'button'));
  fireEvent.press(przycisk('Add part', 'button'));
  fireEvent.press(przycisk('Add part', 'button'));
  expect(screen.getAllByTestId('formularz-nazwa-czesci').map((x) => x.props.accessibilityLabel ?? x.props['aria-label'])).toEqual(['Part 1', 'Part 2', 'Part 3']);
  expect(screen.queryByLabelText('Part')).toBeNull();
});

test('część: pusta nazwa — „Add” nieaktywny; cel opcjonalny ≥ 1; 0 → komunikat bez zapisu', async () => {
  const naZapisz = ok();
  render(<FormularzCzesci t={t} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  expect(screen.getByTestId('formularz-zapisz').props.accessibilityState).toMatchObject({ disabled: true });
  fireEvent.changeText(screen.getByTestId('formularz-nazwa-czesci'), 'Sleeve');
  fireEvent.changeText(screen.getByTestId('formularz-cel-czesci'), '0');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  expect(screen.getByText('Fill in every number: 1 or more.')).toBeTruthy();
  expect(naZapisz).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByTestId('formularz-cel-czesci'), '96');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith({ nazwa: 'Sleeve', cel: 96 }));
});

test('licznik: część do wyboru (domyślnie podana), rodzaj Rows / Stitches jako radio; pusta nazwa dozwolona', async () => {
  const naZapisz = ok();
  render(<FormularzLicznika t={t} czesci={[{ id: 'c1', nazwa: 'Back' }, { id: 'c2', nazwa: 'Sleeve' }]} domyslnaCzesc="c2" naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  expect(screen.getByText('Row counters in one part add up to a whole-piece total.')).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: 'Stitches' }));
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith({ czescId: 'c2', rodzaj: 'oczka', nazwa: '' }));
  fireEvent.press(screen.getByRole('radio', { name: 'Back' }));
  fireEvent.changeText(screen.getByTestId('formularz-nazwa-licznika'), 'Cable');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenLastCalledWith({ czescId: 'c1', rodzaj: 'oczka', nazwa: 'Cable' }));
});

test('notatka: pole wielowierszowe z etykietą „Note for {projekt}”, zapis treści bez limitu', async () => {
  const naZapisz = ok();
  render(<FormularzNotatki t={t} projekt="Harbor" tekst="Old" naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  const pole = screen.getByLabelText('Note for Harbor');
  expect(pole.props.multiline).toBe(true);
  fireEvent.changeText(pole, 'x'.repeat(2000));
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith('x'.repeat(2000)));
});

test('znaczenie: dwa wybory radio z przykładami na bieżącej wartości; zapis wybranego', async () => {
  const naZapisz = ok();
  render(<FormularzZnaczenia t={t} wartosc={47} znaczenie="skonczone" naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  expect(screen.getByText('47 means 47 rows are done.')).toBeTruthy();
  expect(screen.getByText('48 means you’re working on row 48.')).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Rows finished' }).props.accessibilityState).toMatchObject({ selected: true });
  fireEvent.press(screen.getByRole('radio', { name: 'The row I’m on' }));
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith('w_trakcie'));
});

test('narzędzie: podgląd na żywo z numerem US (RD-11/RD-19), błąd przy 0, „Clear” zapisuje brak', async () => {
  const naZapisz = ok();
  const podglad = (mm: number, n: 'druty' | 'szydelko') => (n === 'druty' && mm === 4 ? '4 mm (US 6)' : n === 'szydelko' && mm === 6.5 ? '6.5 mm (US K-10 ½)' : `${mm} mm`);
  render(<FormularzNarzedzia t={t} narzedzie="druty" mm={null} podglad={podglad} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  fireEvent.changeText(screen.getByTestId('formularz-rozmiar-mm'), '4');
  expect(screen.getByText('Shows as: 4 mm (US 6)')).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: 'Hook' }));
  fireEvent.changeText(screen.getByTestId('formularz-rozmiar-mm'), '6,5');
  expect(screen.getByText('Shows as: 6.5 mm (US K-10 ½)')).toBeTruthy();
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith({ narzedzie: 'szydelko', mm: 6.5 }));
  fireEvent.changeText(screen.getByTestId('formularz-rozmiar-mm'), '0');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  expect(screen.getByText('Enter a size above 0, for example 4 or 3.25.')).toBeTruthy();
  fireEvent.press(przycisk('Clear', 'button'));
  await waitFor(() => expect(naZapisz).toHaveBeenLastCalledWith({ narzedzie: 'szydelko', mm: null }));
});

test('What’s next? (BR-LIC-011/S1): druga taka sama z celem albo bez, nowa część, „Not now”', () => {
  const w = { naDruga: jest.fn(), naNowa: jest.fn(), naNieTeraz: jest.fn() };
  const r = render(<CoDalej t={t} czesc="Left sleeve" projekt="Harbor" celDrugiej={96} {...w} />);
  expect(screen.getByText('Left sleeve is done. It’s the last part in Harbor.')).toBeTruthy();
  expect(screen.getByText('Same goal, 96 rows. Shows what you noted on each row of the first one.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('co-dalej-druga'));
  fireEvent.press(screen.getByTestId('co-dalej-nowa'));
  fireEvent.press(przycisk('Not now', 'button'));
  expect([w.naDruga.mock.calls.length, w.naNowa.mock.calls.length, w.naNieTeraz.mock.calls.length]).toEqual([1, 1, 1]);
  r.rerender(<CoDalej t={t} czesc="Left sleeve" projekt="Harbor" celDrugiej={null} {...w} />);
  expect(screen.getByText('The goal comes once the first one has rows.')).toBeTruthy();
});

import { MenuProjektu } from '../../src/ekrany/MenuProjektu';
test('menu ••• licznika: „What the number shows” (F-09: zmiana w ustawieniach licznika, bez pytania na starcie)', () => {
  const naZnaczenie = jest.fn();
  const w = { naNazwa: jest.fn(), naCel: jest.fn(), naPrzypomnienie: jest.fn(), naPowtorzenie: jest.fn(), naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naZamknij: jest.fn() };
  render(<MenuProjektu stan={{ projekt: 'Harbor', zablokowany: false, wartosc: 3 }} t={t} {...w} naZnaczenie={naZnaczenie} />);
  fireEvent.press(screen.getByTestId('menu-znaczenie'));
  expect(naZnaczenie).toHaveBeenCalledTimes(1);
});

import { FormularzTerminu } from '../../src/ekrany/FormularzeProjektu';
test('termin „Done by” (F-61): systemowy wybór daty inline od dziś, podgląd celu na dziś, „No date” zapisuje brak', async () => {
  const naZapisz = ok();
  const podglad = jest.fn(async (d: string) => (d === '2026-10-31' ? 10 : null));
  render(<FormularzTerminu t={t} dzis="2026-10-22" termin={null} jezyk="en-US" podglad={podglad} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  const wybor = screen.getByTestId('formularz-termin-data');
  expect(wybor.props.display ?? 'inline').toBe('inline');
  fireEvent(wybor, 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(2026, 9, 31, 12));
  expect(await screen.findByText('Today’s goal: 10 rows. It stays the same all day.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith('2026-10-31'));
  fireEvent(wybor, 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(2026, 10, 2, 12));
  expect(await screen.findByText('Set a goal for a part to get a daily goal.')).toBeTruthy();
  fireEvent.press(przycisk('No date', 'button'));
  await waitFor(() => expect(naZapisz).toHaveBeenLastCalledWith(null));
});
