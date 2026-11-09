// M3 fix E5: 007 — „wstecz” paska wzoru w projekcie roboczym: „Back to counter” (`wzor.wstecz_licznik`), nie nazwa z datą;
// 008 — etykieta VoiceOver dzianiny niesie przypomnienie: „…, next {przypomnienie} at row {n}” (`*_przyp`), licznik i karta „Dziś”.
import React from 'react';
import * as RN from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import { Licznik } from '../../src/ekrany/Licznik';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import { ukladOkna } from '../../src/domena/uklad';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const wywolania = () => ({ naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(), naZmienNazwe: jest.fn(), naUsun: jest.fn(), naNotatka: jest.fn(),
  potwierdz: jest.fn(), naPlus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })) });
const stanWzoru = (czesc: string | null): StanPrzegladarki => ({ nazwa: 'Harbor chart', opis: 'PDF · 6 pages', czesc, wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }], wzorId: 'w1',
  strona: { n: 2, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false, licznik: { liczba: 47, dziergany: 48, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 390, wysokosc: 844 }) });

test('007: projekt roboczy (czesc = null) → „wstecz” wzoru „Back to counter”, bez cyfr daty', () => {
  render(<PrzegladarkaWzoru stan={stanWzoru(null)} t={t} widok={<RN.Text>PDF</RN.Text>} {...wywolania()} />);
  const etykieta = String(screen.getByTestId('nav-wstecz').props.accessibilityLabel);
  expect(etykieta).toBe(t('wzor.wstecz_licznik'));
  expect(etykieta).toBe('Back to counter');
  expect(/\d/.test(etykieta)).toBe(false);
});

test('007: nazwany projekt → „Back to {część}” bez zmian', () => {
  render(<PrzegladarkaWzoru stan={stanWzoru('Back')} t={t} widok={<RN.Text>PDF</RN.Text>} {...wywolania()} />);
  expect(screen.getByTestId('nav-wstecz').props.accessibilityLabel).toBe('Back to Back');
});

test('008: licznik z przypomnieniem — etykieta dzianiny zawiera przypomnienie i numer rzędu', () => {
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 11, dziergany: 12, cel: 40, przypomnienie: { tekst: 'decrease', ktory: 1, razy: 4, nastepny: 18 } })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  const e = String(screen.getByTestId('licznik-dzianina').props.accessibilityLabel);
  expect(e).toContain('decrease');
  expect(e).toContain('row 12');
});

test('008: karta „Dziś” z „co dalej” — etykieta dzianiny zawiera przypomnienie i numer rzędu', () => {
  const dane: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: null, wToku: 1, miejsce: 'licznik', rzedyDzis: 4, coDalej: { za: 2, tekst: 'decrease', ktory: 1, razy: 4 } };
  render(<Dzis stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 42, dziergany: 43, cel: 96 })} dane={dane} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(43))}
    naCofnijSerie={jest.fn()} naOferty={jest.fn()} naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} />);
  const kolumna = screen.getByTestId('dzis-karta').findAll((n) => typeof n.props.onLayout === 'function')[0];
  if (kolumna) act(() => { fireEvent(kolumna, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 112, height: 216 } } }); });
  const e = String(screen.getByTestId('dzis-dzianina').props.accessibilityLabel);
  expect(e).toContain('decrease');
  expect(e).toContain('row 45');
});
