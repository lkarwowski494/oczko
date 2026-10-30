// Ekran „History” (F-59; BR-DNI-001–003; P-191 P6a; makiety sesje-historia `historia*`): kalendarz od poniedziałku z kreską dnia z robótką,
// wybrany dzień z projektami, tydzień wybranego dnia i miesiąc; pierwsze użycie bez ponagleń. Model z kompozycji (stanHistorii).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HistoriaDni } from '../../src/ekrany/HistoriaDni';
import { stanHistorii } from '../../src/kompozycja/historia';
import type { WidokHistorii } from '../../src/przypadki-uzycia/historia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const j = () => ({ t, jezyk: () => 'en', zegar24h: () => true });
const W: WidokHistorii = {
  dniRobotki: ['2026-10-22', '2026-10-23'],
  dzien: [{ projektId: 'p1', nazwa: 'Sweater', rzedy: 5, czasMs: null }, { projektId: 'p2', nazwa: 'Scarf', rzedy: 0, czasMs: 40 * 60_000 }],
  tydzien: { od: '2026-10-19', do: '2026-10-25', rzedy: 5, czasMs: 40 * 60_000, ukonczone: 0, poprzednie: { rzedy: 12 } },
  miesiac: { rzedy: 5, czasMs: null, ukonczone: 1, dni: 2 }, pierwsze: false,
};
function pokaz(w: WidokHistorii = W, wybrany = '2026-10-22') {
  const f = { naWybierz: jest.fn(), naPoprzedni: jest.fn(), naNastepny: jest.fn(), naProjekt: jest.fn() };
  render(<HistoriaDni stan={stanHistorii(w, { j: j(), miesiac: '2026-10', wybrany, dzis: '2026-10-26' })} t={t} {...f} />);
  return f;
}

test('kalendarz: tytuł, miesiąc, strzałki, kolumny od poniedziałku, 1.10 w czwartek, dni z robótką czytane z liczbą rzędów', () => {
  const f = pokaz();
  expect(screen.getByRole('header', { name: 'History' })).toBeTruthy();
  expect(screen.getByText('October 2026')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
  fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
  expect([f.naPoprzedni.mock.calls.length, f.naNastepny.mock.calls.length]).toEqual([1, 1]);
  expect(screen.getByText('Weeks start on Monday.')).toBeTruthy();
  expect(screen.getAllByTestId('historia-pusta-komorka', { includeHiddenElements: true })).toHaveLength(3); // pon–śr przed 1.10
  const d22 = screen.getByTestId('historia-dzien-2026-10-22');
  expect(d22.props.accessibilityState).toEqual({ selected: true });
  fireEvent.press(screen.getByTestId('historia-dzien-2026-10-23'));
  expect(f.naWybierz).toHaveBeenCalledWith('2026-10-23');
});

test('dzień: projekty z rzędami albo samym czasem (ER-55); stuknięcie otwiera projekt; tydzień i miesiąc', () => {
  const f = pokaz();
  expect(screen.getAllByText('5 rows')).toHaveLength(2); // wiersz dnia i miesiąc bez sesji
  expect(screen.getByText('40 min')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: /Scarf/ }));
  expect(f.naProjekt).toHaveBeenCalledWith('p2');
  expect(screen.getByText('Week of Oct 19')).toBeTruthy();
  expect(screen.getByText('5 rows · 40 min')).toBeTruthy();
  expect(screen.getByText('Previous week: 12 rows')).toBeTruthy();
  expect(screen.getByText('October')).toBeTruthy();
  expect(screen.getByText('1 project finished')).toBeTruthy();
  expect(screen.getByText('2 crafting days')).toBeTruthy();
  expect(screen.getAllByText('Time shows here when you use the stopwatch.')).toHaveLength(1); // miesiąc bez sesji (BR-DNI-003 S3)
});

test('dzień bez robótki: „Nothing counted on this day.”; bieżący tydzień: „This week”; pierwsze użycie: zachęta bez ponagleń', () => {
  pokaz({ ...W, dzien: [], tydzien: { ...W.tydzien, od: '2026-10-26', do: '2026-11-01' }, pierwsze: true, dniRobotki: [] }, '2026-10-26');
  expect(screen.getByText('Nothing counted on this day.')).toBeTruthy();
  expect(screen.getByText('This week')).toBeTruthy();
  expect(screen.getByText('Each day you count a row gets a pencil mark here. Count a row to start.')).toBeTruthy();
});

test('wejście z listy projektów: „History” (nav-historia) i „Tools” (nav-narzedzia) w pasku', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ListaProjektow } = require('../../src/ekrany/ListaProjektow') as typeof import('../../src/ekrany/ListaProjektow');
  const naHistoria = jest.fn(), naNarzedzia = jest.fn();
  render(<ListaProjektow stan={{ zapytanie: '', wToku: [], ukonczone: [], dni: null }} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()}
    naHistoria={naHistoria} naNarzedzia={naNarzedzia} />);
  fireEvent.press(screen.getByTestId('nav-historia'));
  fireEvent.press(screen.getByRole('button', { name: 'Tools' }));
  expect([naHistoria.mock.calls.length, naNarzedzia.mock.calls.length]).toEqual([1, 1]);
});
