// M3 fix E5, 001 (P-619): przy 0 rzędach karta „Dziś” pokazuje dzianinę — pas nabranych oczek (8 jedn., `akcent` z fakturą) i igłę z główką; tło kolumny na karcie
// to nakładka z tokenu `dzianina.tloKolumnyKarty` (makieta `docs/design/dzianina/ekrany.html:38` `.dz`), nie `karta` (na karcie niewidoczne). Marginesy boczne 6 jedn.
import React from 'react';
import { processColor } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import type { StanEkranuLicznika } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { useKolory } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

const H = { includeHiddenElements: true };
/** react-native-svg zapisuje kolor jako { type: 0, payload: processColor(kolor) }. */
const svgKolor = (c: string | undefined) => ({ type: 0, payload: c === undefined ? undefined : processColor(c) });
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 1, miejsce: 'licznik', rzedyDzis: 0, coDalej: null };
let kolory: ReturnType<typeof useKolory> | null = null;
function Kolory(): null { kolory = useKolory(); return null; }
const pokaz = (z: Partial<StanEkranuLicznika> = {}) => {
  render(<><Kolory /><Dzis stan={stanLicznika({ projekt: 'First counter', czesc: 'First counter', skonczone: 0, dziergany: 1, cel: null, ...z })} dane={DANE} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(1))}
    naCofnijSerie={jest.fn()} naOferty={jest.fn()} naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} /></>);
  const karta = screen.getByTestId('dzis-karta');
  const pomiar = karta.findAll((n) => typeof n.props.onLayout === 'function')[0];
  if (pomiar) act(() => { fireEvent(pomiar, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 112, height: 216 } } }); });
};

test('001 token: dzianina.tloKolumnyKarty = #00000026 (makieta .dz) w obu plikach tokenów', () => {
  const t1: unknown = tokeny.dzianina;
  const t2: unknown = require('../../docs/design/dzianina/tokeny.json').dzianina;
  for (const d of [t1, t2]) expect(d).toMatchObject({ tloKolumnyKarty: '#00000026' });
});

test('001 przy 0 rzędach: pas nabrania istnieje, w barwie akcent, 8 jedn. wysokości, marginesy 6', () => {
  pokaz();
  const nabranie = screen.getByTestId('dzis-dzianina-nabranie', H);
  expect(nabranie.props.fill).toEqual(svgKolor(kolory?.akcent));
  expect(Number(nabranie.props.height)).toBe(8);
  expect(Number(nabranie.props.x)).toBe(6);
  expect(Number(nabranie.props.width)).toBe(112 - 12);
  expect(screen.getByTestId('dzis-dzianina-nabranie-oczka', H)).toBeTruthy();
});

test('001 tło kolumny na karcie = token tloKolumnyKarty, ≠ karta', () => {
  pokaz();
  const tlo = screen.getByTestId('dzis-dzianina-tlo', H);
  expect(tlo.props.fill).toEqual(svgKolor(tokeny.dzianina.tloKolumnyKarty));
  expect(tlo.props.fill).not.toEqual(svgKolor(kolory?.karta));
});

test('001 igła z główką (przy 0 rzędach tuż nad nabraniem)', () => {
  pokaz();
  const glowka = screen.getByTestId('dzis-dzianina-igla-glowka', H);
  const igla = screen.getByTestId('dzis-dzianina-igla', H);
  const nabranie = screen.getByTestId('dzis-dzianina-nabranie', H);
  expect(Number(glowka.props.cy)).toBe(Number(igla.props.y1));
  expect(Number(igla.props.y1)).toBeLessThanOrEqual(Number(nabranie.props.y));
});

test('001 przy rzędach > 0: bez pasa nabrania, dzianina od dołu', () => {
  pokaz({ skonczone: 42, dziergany: 43, cel: 96 });
  expect(screen.queryByTestId('dzis-dzianina-nabranie', H)).toBeNull();
  expect(screen.getByTestId('dzis-dzianina-dzianina', H)).toBeTruthy();
});
