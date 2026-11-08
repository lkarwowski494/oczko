// M3 p5 (P-563, design-spec „Układ”: dni kalendarza ≥ 44 pt także przy 320 pt, siatka na pełną szerokość; makieta `historia-390-*-ax5`: przy AX5 siatka zostaje).
// Deklaracja stylu komórki dnia: szerokość (liczba) i minHeight ≥ `cel.minimum`, siedem kolumn w szerokości ekranu (nie pomniejszonej o marginesy).
// To nie dowód celu dotyku (JAK-13: ten sprawdza audyt na urządzeniu), tylko strażnik, że siatka nie wraca do szerokości w procentach wewnątrz karty.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { HistoriaDni } from '../../src/ekrany/HistoriaDni';
import { stanHistorii } from '../../src/kompozycja/historia';
import type { WidokHistorii } from '../../src/przypadki-uzycia/historia';
import { cel } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let mockSzerokosc = 320;
let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: mockSzerokosc, height: 568, scale: 2, fontScale: mockSkala }) }));

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const W: WidokHistorii = {
  dniRobotki: ['2026-10-22', '2026-10-23'], ukonczoneDnia: [],
  dzien: [{ projektId: 'p1', nazwa: 'Sweater', rzedy: 5, czasMs: null }],
  tydzien: { od: '2026-10-19', do: '2026-10-25', rzedy: 5, czasMs: null, ukonczone: 0, poprzednie: { rzedy: 0 } },
  miesiac: { rzedy: 5, czasMs: null, ukonczone: 0, dni: 2 }, pierwsze: false,
};
function pokaz() {
  const j = { t, jezyk: () => 'en', zegar24h: () => true };
  render(<HistoriaDni stan={stanHistorii(W, { j, miesiac: '2026-10', wybrany: '2026-10-22', dzis: '2026-10-26' })} t={t}
    naWybierz={jest.fn()} naPoprzedni={jest.fn()} naNastepny={jest.fn()} naProjekt={jest.fn()} />);
}
const styl = (id: string) => RN.StyleSheet.flatten(screen.getByTestId(id).props.style) as { width?: unknown; height?: unknown; minHeight?: number };

describe.each([[320, 1, '320 pt'], [320, 3.1, '320 pt, AX5'], [390, 1, '390 pt']])('komórka dnia kalendarza: szerokość %i, skala %f (%s)', (szerokosc, skala) => {
  beforeEach(() => { mockSzerokosc = szerokosc; mockSkala = skala; });

  test('styl komórki: width liczbowy ≥ cel.minimum (deklaracja), siedem komórek wypełnia szerokość ekranu', () => {
    pokaz();
    const s = styl('historia-dzien-2026-10-22');
    expect(typeof s.width).toBe('number');
    expect(s.width as number).toBeGreaterThanOrEqual(cel.minimum);
    expect((s.width as number) * 7).toBeLessThanOrEqual(szerokosc);
    expect((s.width as number) * 7).toBeGreaterThan(szerokosc - 7); // siatka na pełną szerokość, nie wąska karta
  });

  test('styl komórki: minHeight ≥ cel.minimum (deklaracja), komórka pusta przed 1. dniem ma tę samą szerokość', () => {
    pokaz();
    expect(styl('historia-dzien-2026-10-22').minHeight).toBeGreaterThanOrEqual(cel.minimum);
    const puste = screen.getAllByTestId('historia-pusta-komorka', { includeHiddenElements: true });
    expect(RN.StyleSheet.flatten(puste[0]!.props.style)).toMatchObject({ width: styl('historia-dzien-2026-10-22').width });
  });
});
