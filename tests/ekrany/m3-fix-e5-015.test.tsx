// M3 fix E5, 015 (P-614 (3) A; tokeny `cele.paskaWzoru`; makieta `docs/design/dzianina/fix-e5-2026-11-09/ipad.html`): iPad (klasa regular) — okno ≥ 1000 pt
// i szersze niż wyższe → kolumna 280 po prawej: liczba w roli `liczbaKarty` z „of {cel}”, na dole −1 (72) obok „+1” (168–240 pt wysokości); węższe okna iPada → pasek,
// „+1” najwyżej 480 pt szerokości, zestaw wyśrodkowany. Telefon poziomo (compact) bez zmian (W3) — zakres 015 to iPad [odczyt 08, zgłoszony koordynatorowi].
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ukladOkna } from '../../src/domena/uklad';
import { LicznikWzoru } from '../../src/ekrany/WzorLicznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { odstep } from '../../src/ekrany/motyw';
import { tEn } from './pomoc';

const PW = tokeny.cele.paskaWzoru;
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
let mockOkno = { width: 1194, height: 834 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ ...mockOkno, scale: 2, fontScale: 1 }) }));
const plasko = (s: unknown) => (StyleSheet.flatten(s as never) ?? {}) as Record<string, unknown>;
const pokaz = (obok: boolean, cel: number | null = 96) => render(<LicznikWzoru t={t} licznik={{ liczba: 43, dziergany: 44, znaczenie: 'skonczone', cel }} obok={obok}
  szerokoscKolumny={obok ? PW.kolumna.szerokosc : null} blad={false} naPlus={jest.fn()} naMinus={jest.fn()} />);

test.each([
  ['iPad 11″ poziomo 1194 × 834', 1194, 834, 'obok', PW.kolumna.szerokosc],
  ['iPad mini poziomo 1133 × 744', 1133, 744, 'obok', PW.kolumna.szerokosc],
  ['iPad pionowo 834 × 1194', 834, 1194, 'pasek', null],
  ['iPad okno regular szersze niż wyższe, < 1000 (Stage Manager 900 × 700)', 900, 700, 'pasek', null],
  ['iPad Split View 2/3 778 × 820', 778, 820, 'pasek', null],
] as const)('015 ukladOkna: %s', (_n, szerokosc, wysokosc, wzor, kolumna) => {
  expect(ukladOkna({ szerokosc, wysokosc })).toMatchObject({ klasa: 'regular', wzor, kolumnaLicznika: kolumna });
});

test('015 kolumna iPada: liczba w roli liczbaKarty, „of {cel}”, −1 72 obok „+1” 168–240 pt', () => {
  mockOkno = { width: 1194, height: 834 };
  pokaz(true);
  expect(plasko(screen.getByTestId('licznik-wartosc-cyfra-0').props.style).fontSize).toBe(tokeny.typografia.liczbaKarty.pt);
  expect(screen.getByTestId('licznik-z-celu').props.children).toBe('of 96');
  const minus = plasko(screen.getByTestId('licznik-minus').props.style);
  const plus = plasko(screen.getByTestId('licznik-plus').props.style);
  expect([minus.width, minus.minHeight]).toEqual([tokeny.cele.minus, tokeny.cele.minus]);
  expect([plus.minHeight, plus.maxHeight]).toEqual([PW.kolumna.plusMinWysokosc, PW.kolumna.plusMaxWysokosc]);
  const para = screen.getByTestId('wzor-kolumna-przyciski');
  expect(plasko(para.props.style).flexDirection).toBe('row');
});

test('015 kolumna iPada bez celu: bez „of {cel}”', () => {
  mockOkno = { width: 1194, height: 834 };
  pokaz(true, null);
  expect(screen.queryByTestId('licznik-z-celu')).toBeNull();
});

test('015 pasek (iPad pionowo): „+1” maxWidth 480, zestaw wyśrodkowany', () => {
  mockOkno = { width: 834, height: 1194 };
  pokaz(false);
  expect(plasko(screen.getByTestId('licznik-plus').props.style).maxWidth).toBe(PW.plusMaxSzerokosc);
  const zestaw = plasko(screen.getByTestId('wzor-pasek-przyciski').props.style);
  expect(zestaw.alignSelf).toBe('center');
  expect(zestaw.maxWidth).toBe(PW.plusMaxSzerokosc + 2 * tokeny.cele.minus + 2 * odstep.s);
  expect(plasko(screen.getByTestId('wzor-pasek-licznika').props.style).justifyContent).toBe('center');
});
