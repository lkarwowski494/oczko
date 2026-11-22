// ADR-0018 „Potwierdzenie” (uzupełnienie fix-6, P-194 Q4a): „Zgłoś problem” w trybie awaryjnym — wersja, system, model, powód wejścia
// w tryb awaryjny i liczba nieudanych startów; wpisy `blad` z kopii tylko do odczytu, a gdy baza się nie otwiera — zamiast nich
// „database=not_opened”. Udostępnienie przekazuje treść z podglądu, także gdy odczyt bazy rzuca wyjątek.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ZglosProblem } from '../../src/ekrany/ZglosProblem';
import { diagnostykaAwaryjna } from '../../src/kompozycja/zgloszenie-awaryjne';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const SR = { wersja: '1.0.0 (7)', system: 'iOS 26.1', model: 'iPhone17,1' };

test('baza czytelna: kody błędów z kopii (bez szczegółów), powód i liczba nieudanych startów', async () => {
  const d = await diagnostykaAwaryjna({ powod: 'uszkodzony', nieudaneStarty: async () => 3, srodowisko: SR,
    bledy: async () => [{ czasMs: Date.UTC(2026, 9, 26, 12), kod: 'js_TypeError' }] });
  expect(d).toEqual([
    { pole: 'wersja', wartosc: '1.0.0 (7)' }, { pole: 'system', wartosc: 'iOS 26.1' }, { pole: 'model', wartosc: 'iPhone17,1' },
    { pole: 'bledy', wartosc: 'safe_mode=uszkodzony failed_starts=3\nerrors:\n2026-10-26T12:00:00.000Z js_TypeError' },
  ]);
});

test('otwarcie bazy rzuca → „database=not_opened”; Share oddaje treść z podglądu arkuszowi udostępniania', async () => {
  const d = await diagnostykaAwaryjna({ powod: 'wersja_nowsza', nieudaneStarty: async () => { throw new Error('plik'); }, srodowisko: SR,
    bledy: async () => { throw new Error('SQLITE_CORRUPT'); } });
  expect(d.find((x) => x.pole === 'bledy')?.wartosc).toBe('safe_mode=wersja_nowsza failed_starts=?\ndatabase=not_opened');
  const system = atrapaSystemu();
  render(<ZglosProblem stan={{ diagnostyka: d }} t={t} system={system} kontakt="support@apps4brew.com" naAnuluj={jest.fn()} />);
  expect(screen.getByText(/database=not_opened/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: t('zglos.udostepnij') }));
  expect(system.udostepnij).toHaveBeenCalledTimes(1);
  expect(system.udostepnij.mock.calls[0][0].tresc).toContain('database=not_opened');
});
