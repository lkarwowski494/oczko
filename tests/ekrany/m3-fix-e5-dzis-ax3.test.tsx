// M3 fix E5, 004 (P-614 (2) A, tokeny `kartaDzis.ax3ax5`, `cele.plusAx5`): od AX3 karta „Dziś” to stos — wiersz liczba + „+1” 100 pt (wyrównanie do góry)
// na górze, tytuł, część, dzianina niskim pasem 48 pt, „Kontynuuj”; przy limicie komunikat stoi na miejscu „+1”. Przy AX5 „+1” mieści się nad paskiem zakładek
// bez przewijania (E2E 30, przebieg 4 iOS) — Jest nie układa: test sprawdza kolejność i wymiary z tokenów.
import React from 'react';
import * as RN from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import type { StanEkranuLicznika } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { PROG_AX3 } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
let mockSkala = 1;
afterEach(() => { mockSkala = 1; });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const plasko = (s: unknown) => (RN.StyleSheet.flatten(s as never) ?? {}) as Record<string, unknown>;
const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
const pokaz = (z: Partial<StanEkranuLicznika> = {}) => {
  render(<Dzis stan={stanLicznika({ projekt: 'Harbor Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, ...z })} dane={DANE} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(43))}
    naCofnijSerie={jest.fn()} naOferty={jest.fn()} naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} />);
  // kolumna dzianiny rysuje się po pomiarze (onLayout) — pierwszy element z onLayout w karcie
  const karta = screen.getByTestId('dzis-karta');
  const pomiar = karta.findAll((n) => typeof n.props.onLayout === 'function')[0];
  if (pomiar) act(() => { fireEvent(pomiar, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 48 } } }); });
};
const kolejnosc = () => screen.getByTestId('dzis-karta').findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string').map((n) => n.props.testID as string);

test('004 od AX3: „+1” = cele.plusAx5 × cele.plusAx5, okrągłe', () => {
  mockSkala = PROG_AX3;
  pokaz();
  const s = plasko(screen.getByTestId('dzis-plus').props.style);
  expect([s.width, s.height, s.borderRadius]).toEqual([tokeny.cele.plusAx5, tokeny.cele.plusAx5, tokeny.cele.plusAx5 / 2]);
});

test('004 od AX3: kolejność liczba i „+1” → tytuł → dzianina → „Kontynuuj”; dzianina pasem 48 pt', () => {
  mockSkala = 3.571;
  pokaz();
  const ids = kolejnosc();
  const i = (id: string) => ids.indexOf(id);
  expect(i('dzis-wartosc')).toBeGreaterThanOrEqual(0);
  expect(i('dzis-wartosc') < i('dzis-projekt') && i('dzis-plus') < i('dzis-projekt')).toBe(true);
  expect(i('dzis-projekt') < i('dzis-dzianina') && i('dzis-dzianina') < i('dzis-kontynuuj')).toBe(true);
  let n = screen.getByTestId('dzis-dzianina').parent;
  while (n && typeof n.props.onLayout !== 'function') n = n.parent;
  expect(plasko(n?.props.style).height).toBe(tokeny.kartaDzis.ax3ax5.dzianinaWysokosc);
});

test('004 od AX3: przy limicie komunikat stoi na miejscu „+1” (przed tytułem)', () => {
  mockSkala = PROG_AX3;
  pokaz({ limit: { rodzaj: 'zawczasu' }, miesiac: { nazwa: 'November', wznowienie: 'December 1', rzedyDanych: 61 } });
  const ids = kolejnosc();
  expect(ids.indexOf('limit-zawczasu')).toBeGreaterThanOrEqual(0);
  expect(ids.indexOf('limit-zawczasu')).toBeLessThan(ids.indexOf('dzis-projekt'));
});

test('004 poniżej AX3 (AX1): układ bez zmian — dzianina przed tytułem, „+1” cele.plus', () => {
  mockSkala = 1.786;
  pokaz();
  const ids = kolejnosc();
  expect(ids.indexOf('dzis-dzianina')).toBeLessThan(ids.indexOf('dzis-projekt'));
  expect(plasko(screen.getByTestId('dzis-plus').props.style).width).toBe(tokeny.cele.plus);
});
