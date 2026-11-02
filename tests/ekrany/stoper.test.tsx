// Stoper sesji na liczniku (F-21, U-4; design-spec „Stoper, sesje i Historia”, P-191 P1a–P3a; makiety sesje-historia `licznik-stoper*`).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Stoper, czasStopera, type PropsStopera } from '../../src/ekrany/Stoper';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const T = 1_000_000_000_000;
function pokaz(stan: PropsStopera['stan'], inny: PropsStopera['inny'] = null) {
  const w = { naStart: jest.fn(), naWstrzymaj: jest.fn(), naWznow: jest.fn(), naZatrzymaj: jest.fn(), naInnyPotwierdz: jest.fn(), naInnyAnuluj: jest.fn() };
  render(<Stoper stan={stan} inny={inny} t={t} teraz={() => T + 65_000} {...w} />);
  return w;
}

describe('czasStopera', () => {
  test.each([[0, '0:00'], [65_000, '1:05'], [599_999, '9:59'], [3_725_000, '1:02:05'], [-5, '0:00']])('%p ms → %s', (ms, w) => {
    expect(czasStopera(ms)).toBe(w);
  });
});

describe('Stoper', () => {
  test('bez sesji: ikona „Start session timer” (licznik-stoper) startuje jednym stuknięciem', () => {
    const w = pokaz({ rodzaj: 'brak' });
    fireEvent.press(screen.getByRole('button', { name: 'Start session timer' }));
    expect(screen.getByTestId('licznik-stoper')).toBeTruthy();
    expect(w.naStart).toHaveBeenCalledTimes(1);
  });

  test('trwa: kapsuła z czasem od znacznika (1:05), etykieta; stuknięcie → menu z godziną startu, Pause i Stop', () => {
    const w = pokaz({ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' });
    expect(screen.getByText('1:05', { includeHiddenElements: true })).toBeTruthy(); // VoiceOver dostaje czas z etykiety kapsuły
    fireEvent.press(screen.getByRole('button', { name: 'Session timer, 1:05, running. Pause or stop' }));
    expect(screen.getByText('Session started 19:52')).toBeTruthy();
    fireEvent.press(screen.getByTestId('stoper-wstrzymaj'));
    expect(w.naWstrzymaj).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole('button', { name: 'Session timer, 1:05, running. Pause or stop' }));
    fireEvent.press(screen.getByTestId('stoper-zatrzymaj'));
    expect(w.naZatrzymaj).toHaveBeenCalledTimes(1);
  });

  test('wstrzymana: czas stoi, symbol pauzy, menu z „Resume timer”', () => {
    const w = pokaz({ rodzaj: 'wstrzymana', czasMs: 600_000, startGodzina: '19:52' });
    expect(screen.getByText('10:00', { includeHiddenElements: true })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Session timer, 10:00, paused. Resume or stop' }));
    fireEvent.press(screen.getByRole('button', { name: 'Resume timer' }));
    expect(w.naWznow).toHaveBeenCalledTimes(1);
  });

  test('P3a: sesja w innym projekcie — alert z pytaniem, „Stop and start here” albo Cancel', () => {
    const w = pokaz({ rodzaj: 'brak' }, { projekt: 'Harbor Sweater', biezacy: 'Scarf' });
    expect(screen.getByText('The timer is running for Harbor Sweater')).toBeTruthy();
    expect(screen.getByText('One session runs at a time. Stop it there and start one for Scarf?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('stoper-inny-potwierdz'));
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect([w.naInnyPotwierdz.mock.calls.length, w.naInnyAnuluj.mock.calls.length]).toEqual([1, 1]);
  });
});

test('P-287 (30): ikona i kapsuła stopera w pasku najwyżej ×1,8 przy dużym tekście (makieta fix-8 `.nav svg`)', () => {
  pokaz({ rodzaj: 'brak' });
  // P2-3: ikona to symbol SF; limit skali niesie jej rozmiar (symbole-sf.test.tsx „skala symbolu”), tu: symbol jest i jest dekoracyjny.
  expect(screen.getByTestId('symbol-stopwatch', { includeHiddenElements: true }).props.accessible).toBe(false);
});
