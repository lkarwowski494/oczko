// 04-studio-projektowe-021 (P2, reaudyt 04 9.11, P-627): dzianina na liczniku z marginesem bocznym 6 jedn. jak na karcie „Dziś” (makieta rysuje x = 6 także
// na liczniku); jedna wspólna stała `WCIECIE_DZIANINY` w `Dzianina.tsx` dla obu ekranów.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import * as D from '../../src/ekrany/Dzianina';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

const H = { includeHiddenElements: true };
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
// Zwykły rozmiar tekstu (kolumna 64 × 260 obok liczby); domyślne wymiary Jest dają pas AX na pełną szerokość.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }) }));
const rysuj = (skonczone: number) =>
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone, dziergany: skonczone + 1, cel: 96 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);

test('021: wspólna stała WCIECIE_DZIANINY = 6 eksportowana z Dzianina.tsx', () => {
  expect((D as Record<string, unknown>).WCIECIE_DZIANINY).toBe(6);
});

test('021: licznik przy 0 rzędach — pas nabrania od x = 6, szerokość kolumny − 12', () => {
  rysuj(0);
  const n = screen.getByTestId('licznik-dzianina-nabranie', H);
  expect(Number(n.props.x)).toBe(6);
  expect(Number(n.props.width)).toBe(tokeny.dzianina.kolumnaLicznika.szerokosc - 12);
});

test('021: licznik z rzędami — dzianina od x = 6', () => {
  rysuj(42);
  expect(Number(screen.getByTestId('licznik-dzianina-dzianina', H).props.x)).toBe(6);
});
