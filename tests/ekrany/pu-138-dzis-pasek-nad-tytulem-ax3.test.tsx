// PU-138 („Przewodnik” i zębatka przy dużym tekście), część „Od AX3 »Przewodnik« i zębatka w osobnym wierszu nad tytułem »Dziś«”: prawdziwy ekran `Dzis` przy fontScale AX3 (2,643)
// i AX5 (3,571) — pasek z „Guide” i „Settings” NIE jest w wierszu nagłówka z tytułem „Today” i stoi przed nim w drzewie; poniżej AX3 (AX1 1,786, domyślny 1) pasek dzieli wiersz z tytułem.
// Jest nie układa (Yoga): sprawdzamy strukturę drzewa i próg `PROG_AX3`. Poza Jest: nieucięcie napisów w przewodniku, „Pokaż ›” pod zdaniem, wartość „… z 42” — scenariusz 111 (oczekujący).
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
let mockSkala = 1;
afterEach(() => { mockSkala = 1; });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };

function pokaz() {
  render(<Dzis stan={stanLicznika({ projekt: 'Harbor Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43 })} dane={DANE} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(43))}
    naCofnijSerie={jest.fn()} naOferty={jest.fn()} naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naPrzewodnik={jest.fn()} naKafel={jest.fn()} />);
  const tytul = screen.getByRole('header', { name: 'Today' });
  let wiersz = tytul.parent; // wiersz nagłówka: pierwszy przodek ułożony w rząd (tytuł z podpisem daty + ewentualnie pasek)
  while (wiersz && (wiersz.props.style === undefined || (Array.isArray(wiersz.props.style) ? false : (wiersz.props.style as { flexDirection?: string }).flexDirection !== 'row'))) wiersz = wiersz.parent;
  const drzewo = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string').map((n) => n.props.testID as string);
  return { wiersz, drzewo };
}
const wWierszuNaglowka = (w: ReturnType<typeof pokaz>['wiersz'], id: string) => w !== null && within(w).queryByTestId(id) !== null;

const AX3 = 2.643; // wartość z design-spec (kategoria dostępności 3), nie import z kodu — inaczej zmiana progu przesunęłaby też test
test.each([[AX3], [3.571]])('PU-138: przy fontScale %p „Guide” i „Settings” są poza wierszem nagłówka z tytułem „Today” i przed nim', (skala) => {
  mockSkala = skala;
  const { wiersz, drzewo } = pokaz();
  expect(wiersz).not.toBeNull();
  expect(wWierszuNaglowka(wiersz, 'nav-przewodnik')).toBe(false);
  expect(wWierszuNaglowka(wiersz, 'nav-ustawienia')).toBe(false);
  expect(screen.getByTestId('nav-przewodnik').props.accessibilityLabel).toBe('Guide');
  expect(screen.getByTestId('nav-ustawienia').props.accessibilityLabel).toBe('Settings');
  expect(drzewo.indexOf('nav-przewodnik')).toBeGreaterThanOrEqual(0);
  expect(drzewo.indexOf('nav-przewodnik')).toBeLessThan(drzewo.indexOf('dzis-karta'));
});

test.each([[1], [1.786], [2.6]])('PU-138: poniżej AX3 (fontScale %p) pasek zostaje w wierszu nagłówka obok tytułu', (skala) => {
  mockSkala = skala;
  const { wiersz } = pokaz();
  expect(wWierszuNaglowka(wiersz, 'nav-przewodnik')).toBe(true);
  expect(wWierszuNaglowka(wiersz, 'nav-ustawienia')).toBe(true);
});
