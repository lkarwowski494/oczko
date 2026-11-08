// M3 p2: stany ekranu „Dziś” z design-spec „Macierz stanów” (Dziś) i makiet dzianina/wzorce-zrzuty/dzis-*: pierwszy (dzis-pierwszy), typowy (dzis),
// bez ostatniego miejsca (dzis-bez-miejsca, P-564/P-565), zębatka Ustawień tylko tu (P-571), linia wolnych dni bez odnośnika Pro (P-563 (10a), ER-70),
// „co dalej” (ZM-01), tydzień (pusty przy pierwszym użyciu). Testy komponentu z danymi z góry; dane z bazy: tests/dane/dzis-kompozycja.test.ts.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis, type PropsDzis } from '../../src/ekrany/Dzis';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const tydzien = (dziergane: number[]): DaneDzis['tydzien'] => ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']
  .map((dzien, i) => ({ dzien, skrot: dzien.slice(8), dziergany: dziergane.includes(i), dzis: i === 3, a11y: dzien }));
const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: tydzien([0, 1, 3]), pustyTydzien: false, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: { za: 4, tekst: 'decrease', ktory: 5, razy: 8 } };
function pokaz(z: Partial<PropsDzis> = {}) {
  const p: PropsDzis = {
    stan: stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }), dane: DANE, t, oglos: jest.fn(), haptyka: atrapaHaptyki(),
    naPlus: jest.fn(async () => plusOk(43)), naCofnijSerie: jest.fn(), naOferty: jest.fn(), naKontynuuj: jest.fn(), naWybierzProjekt: jest.fn(), naUstawienia: jest.fn(), naKafel: jest.fn(), ...z,
  };
  render(<Dzis {...p} />);
  return p;
}

test('typowy (dzis-390): karta z projektem, częścią, rzędem i celem, „Kontynuuj”, „co dalej”, tydzień, 4 kafle, linia dni bez odnośnika Pro', () => {
  const p = pokaz();
  expect(screen.getByTestId('dzis-projekt')).toHaveTextContent('Mist Sweater');
  expect(screen.getByText('Left sleeve, row 43 of 96')).toBeTruthy();
  expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('42');
  expect(screen.getByTestId('dzis-kontynuuj')).toHaveTextContent('Continue');
  expect(screen.getByTestId('dzis-co-dalej')).toHaveTextContent('In 4 rows: decrease (5 of 8)');
  expect(screen.getByText('This week')).toBeTruthy();
  expect(screen.queryByText('Here you’ll see the days you knit.')).toBeNull();
  expect(screen.getByTestId('dzis-dni-darmowe')).toHaveTextContent('3 of 5 free crafting days left in November');
  expect(screen.queryByText(/Oczko Pro/)).toBeNull(); // P-563 (10a)
  expect(screen.queryByTestId('dzis-wybierz-projekt')).toBeNull();
  for (const k of ['nowy-projekt', 'dodaj-wzor', 'wloczka', 'probka'] as const) { fireEvent.press(screen.getByTestId(`dzis-kafel-${k}`)); expect(p.naKafel).toHaveBeenLastCalledWith(k); }
  fireEvent.press(screen.getByTestId('dzis-kontynuuj'));
  expect(p.naKontynuuj).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('nav-ustawienia')); // P-571: jedyne wejście do Ustawień
  expect(p.naUstawienia).toHaveBeenCalledTimes(1);
});

test('pierwszy (dzis-pierwszy-390): „First counter”, 0, „Open counter”, pusty tydzień z zaproszeniem, bez „co dalej” i bez nazwy projektu', () => {
  pokaz({ stan: stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 }), dane: { ...DANE, tydzien: tydzien([]), pustyTydzien: true, coDalej: null, rzedyDzis: 0 } });
  expect(screen.getByText('First counter')).toBeTruthy();
  expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('0');
  expect(screen.getByTestId('dzis-kontynuuj')).toHaveTextContent('Open counter');
  expect(screen.getByText('Here you’ll see the days you knit.')).toBeTruthy();
  expect(screen.queryByTestId('dzis-projekt')).toBeNull();
  expect(screen.queryByTestId('dzis-co-dalej')).toBeNull();
});

test('bez ostatniego miejsca (dzis-bez-miejsca, P-564/P-565): karta bez licznika, dzianiny i „+1”, zdanie z liczbą projektów, „Choose a project” → Projekty, bez „co dalej”', () => {
  const p = pokaz({ stan: stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 }), dane: { ...DANE, miejsce: 'lista' } });
  expect(screen.getByText('Your projects are here')).toBeTruthy();
  expect(screen.getByText(/^3 projects in progress\./)).toBeTruthy();
  expect(screen.queryByTestId('dzis-plus')).toBeNull();
  expect(screen.queryByTestId('dzis-wartosc')).toBeNull();
  expect(screen.queryByTestId('dzis-kontynuuj')).toBeNull();
  expect(screen.queryByTestId('dzis-co-dalej')).toBeNull();
  fireEvent.press(screen.getByTestId('dzis-wybierz-projekt'));
  expect(p.naWybierzProjekt).toHaveBeenCalledTimes(1);
});

test('Pro: bez linii wolnych dni (design-spec „Limit dni”, P-563 (10a))', () => {
  pokaz({ dane: { ...DANE, dni: null } });
  expect(screen.queryByTestId('dzis-dni-darmowe')).toBeNull();
});

test('część bez celu: podpis bez „of {cel}” (macierz stanów: „bez linii celu i bez »za n rzędów«” dotyczy dzianiny)', () => {
  pokaz({ stan: stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: null }) });
  expect(screen.getByText('Left sleeve, row 43')).toBeTruthy();
});
