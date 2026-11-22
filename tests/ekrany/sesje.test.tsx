// Korekta sesji i lista sesji (F-51, BR-PRJ-013; P-191 P4a–P5a, P-195 Q2a; makiety sesje-historia `sesja-korekta*`, `sesje`, `projekt-czas`).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { KorektaSesji } from '../../src/ekrany/Formularze';
import { Sesje } from '../../src/ekrany/Sesje';
import type { Tlumacz, WynikEkranu } from '../../src/ekrany/wspolne';
import { przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const d = (h: number, m: number) => new Date(2026, 9, 22, h, m).getTime();
const F = { dataGodzina: (ms: number) => `${new Date(ms).getHours()}:${String(new Date(ms).getMinutes()).padStart(2, '0')}`, czas: (ms: number) => `${ms / 60_000} min` };
const ok = async (): Promise<WynikEkranu<void>> => ({ ok: true, wartosc: undefined });

describe('KorektaSesji', () => {
  test('podgląd na żywo: „Lasts …” i czas projektu po zapisie; Save zapisuje wybrane chwile', async () => {
    const naZapisz = jest.fn(ok);
    render(<KorektaSesji stan={{ startMs: d(20, 0), koniecMs: d(21, 0), terazMs: d(23, 0), przerwyMs: 0, doSprawdzenia: null, czasInnychMs: 30 * 60_000 }} t={t} formatuj={F} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    expect(screen.getByText('Lasts 60 min.')).toBeTruthy();
    expect(screen.getByText('Project time after saving: 90 min.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('formularz-sesja-koniec'));
    fireEvent(screen.getByTestId('formularz-sesja-koniec-wybor'), 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(d(21, 30)));
    expect(screen.getByText('Lasts 90 min.')).toBeTruthy();
    fireEvent.press(przycisk('Save', 'button'));
    await waitFor(() => expect(naZapisz).toHaveBeenCalledWith({ startMs: d(20, 0), koniecMs: d(21, 30) }));
  });

  test('P-195 Q2a: przy przerwach arkusz mówi przed zapisem, że czas liczy się od startu do końca; sesja do sprawdzenia — linia na górze', () => {
    render(<KorektaSesji stan={{ startMs: d(10, 0), koniecMs: d(18, 0), terazMs: d(23, 0), przerwyMs: 30 * 60_000, doSprawdzenia: 8, czasInnychMs: 0 }} t={t} formatuj={F} naZapisz={jest.fn(ok)} naAnuluj={jest.fn()} />);
    expect(screen.getByText('This session had 30 min of pauses. After you change the times, it counts from start to end.')).toBeTruthy();
    expect(screen.getByText('Oczko stopped this timer after 8 hours. Set when you really stopped.')).toBeTruthy();
  });

  test('BR-PRJ-013/S4 (07, p202): sesja bez pauz → bez informacji o przerwach', () => {
    render(<KorektaSesji stan={{ startMs: d(20, 0), koniecMs: d(21, 0), terazMs: d(23, 0), przerwyMs: 0, doSprawdzenia: null, czasInnychMs: 0 }} t={t} formatuj={F} naZapisz={jest.fn(ok)} naAnuluj={jest.fn()} />);
    expect(screen.queryByText(/of pauses/)).toBeNull();
  });

  test('wybór końca: najpóźniej teraz (maximumDate)', () => {
    render(<KorektaSesji stan={{ startMs: d(20, 0), koniecMs: d(21, 0), terazMs: d(23, 0), przerwyMs: 0, doSprawdzenia: null, czasInnychMs: 0 }} t={t} formatuj={F} naZapisz={jest.fn(ok)} naAnuluj={jest.fn()} />);
    fireEvent.press(screen.getByTestId('formularz-sesja-koniec'));
    expect(new Date(screen.getByTestId('formularz-sesja-koniec-wybor').props.maximumDate).getHours()).toBe(23);
  });
});

describe('Sesje', () => {
  const sesje = [
    { id: 's2', dzien: 'Oct 22', wiersz: '20:00–21:00', czas: '60 min', a11y: 'Oct 22, 20:00 to 21:00, 60 min. Edit', druga: { rodzaj: 'skorygowana' as const }, edytowalna: true },
    { id: 's1', dzien: 'Oct 21', wiersz: '10:00–18:00', czas: '8 h', a11y: 'Oct 21, 10:00 to 18:00, 8 h. Edit', druga: { rodzaj: 'do_sprawdzenia' as const, godziny: 8 }, edytowalna: true },
    { id: 's0', dzien: 'Oct 21', wiersz: '08:00–', czas: '5 min', a11y: 'Oct 21, 08:00, 5 min', druga: { rodzaj: 'trwa' as const }, edytowalna: false },
  ];
  test('tytuł, podsumowanie, grupy dniami, druga linia; stuknięcie otwiera korektę, trwająca nie', () => {
    const naKorekta = jest.fn();
    render(<Sesje stan={{ podsumowanie: { czas: '9 h 5 min', liczba: 3 }, sesje }} t={t} naKorekta={naKorekta} />);
    expect(screen.getByRole('header', { name: 'Sessions' })).toBeTruthy();
    expect(screen.getByText('9 h 5 min in 3 sessions')).toBeTruthy();
    expect(screen.getAllByText('Oct 21')).toHaveLength(1);
    expect(screen.getByText('Stopped after 8 hours. Check the end time.')).toBeTruthy();
    expect(screen.getByText('Edited')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Oct 21, 10:00 to 18:00, 8 h. Edit Stopped after 8 hours. Check the end time.' }));
    expect(naKorekta).toHaveBeenCalledWith('s1');
    expect(screen.queryByRole('button', { name: /08:00/ })).toBeNull();
  });
});
