// H-2 (polecenie I, P-361 nowe znalezisko H-2): nagłówki sekcji poza ekranem projektu miały `typografia.podpis` (15 pt), a wzorzec
// `.naglowek-grupy` ma 13 pt w kolorze `olowek`: `docs/design/ekrany.html` (projekty: „In progress”, „Finished”), `fix6-2026-10-26/sesje-historia.html`
// (sesje: nagłówki dni), `fix6-2026-10-26/narzedzia-zdjecia.html` (narzedzia: „Stash”, „Calculations”), `fix10-2026-11-01/partia8.html:373` (Ustawienia: „Counting”),
// rola `drobny` w `tokeny.json` (13 pt). Wyjątek wzorca: ArkuszSkrzynki „Add to” to `.etyk` (15 pt, udostepnij-icloud.html) — zostaje przy 15 (strażnik niżej).
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ListaProjektow } from '../../src/ekrany/ListaProjektow';
import { Sesje } from '../../src/ekrany/Sesje';
import { Narzedzia } from '../../src/ekrany/Narzedzia';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import { ArkuszSkrzynki } from '../../src/ekrany/WzorSkrzynka';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());

const rozmiar = (nazwa: string) => RN.StyleSheet.flatten(screen.getByRole('header', { name: nazwa }).props.style).fontSize;
const olowek = (schemat: 'light' | 'dark') => (schemat === 'dark' ? tokeny.kolor.ciemny : tokeny.kolor.jasny).olowek;
const kolor = (nazwa: string) => RN.StyleSheet.flatten(screen.getByRole('header', { name: nazwa }).props.style).color;

test('wzorzec ma 13 pt (rola drobny w tokenach), a podpis 15 pt', () => {
  expect([tokeny.typografia.drobny.rozmiar, tokeny.typografia.podpis.rozmiar]).toEqual([13, 15]);
});

describe.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s', (_m, schemat) => {
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  test('ListaProjektow: „In progress” i „Finished” — 13 pt, kolor olowek', () => {
    const wiersz = { id: 'p1', nazwa: 'Harbor Sweater', opis: 'Left sleeve · row 47 of 96 · today' };
    render(<ListaProjektow stan={{ wToku: [wiersz], ukonczone: [{ ...wiersz, id: 'p2', nazwa: 'Scarf' }], zapytanie: '', dni: { zostalo: 3, limit: 5, miesiac: 'November' } }} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
    expect([rozmiar('In progress'), rozmiar('Finished')]).toEqual([13, 13]);
    expect(kolor('In progress')).toBe(olowek(schemat));
  });

  test('Sesje: nagłówki dni — 13 pt', () => {
    const druga = { rodzaj: 'skorygowana' as const };
    render(<Sesje stan={{ podsumowanie: { czas: '60 min', liczba: 1 }, sesje: [{ id: 's2', dzien: 'Oct 22', wiersz: '20:00–21:00', czas: '60 min', a11y: 'Oct 22, 20:00 to 21:00, 60 min. Edit', druga, edytowalna: true }] }} t={t} naKorekta={jest.fn()} />);
    expect(rozmiar('Oct 22')).toBe(13);
    expect(kolor('Oct 22')).toBe(olowek(schemat));
  });

  test('Narzedzia: „Stash” i „Calculations” — 13 pt', () => {
    render(<Narzedzia stan={{ wloczki: 7, druty: 9 }} t={t} naWloczki={jest.fn()} naDruty={jest.fn()} naProbke={jest.fn()} />);
    expect([rozmiar('Stash'), rozmiar('Calculations')]).toEqual([13, 13]);
    expect(kolor('Stash')).toBe(olowek(schemat));
  });

  test('Ustawienia: grupa „Counting” — 13 pt', () => {
    render(<Ustawienia stan={{ pro: null, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wibracje: true }} t={t} system={atrapaSystemu()}
      adresy={{ polityka: 'https://example.invalid/privacy', recenzja: 'https://example.invalid/review' }}
      naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()}
      preferencje={{ ekranNieGasnie: true, ukladMiar: 'auto', naEkranNieGasnie: jest.fn(), naMiary: jest.fn() }} />);
    expect(rozmiar('Counting')).toBe(13);
    expect(kolor('Counting')).toBe(olowek(schemat));
  });
});

test('strażnik wzorca: „Add to” w arkuszu skrzynki to `.etyk` (15 pt), zostaje przy 15', () => {
  render(<ArkuszSkrzynki t={t} pozycje={[{ id: 'z1', nazwa: 'Harbor test pattern.pdf' }]} projekty={[{ id: 'p1', nazwa: 'Harbor Sweater' }]} naWybierz={jest.fn()} naNieTeraz={jest.fn()} />);
  expect(rozmiar('Add to')).toBe(15);
});
