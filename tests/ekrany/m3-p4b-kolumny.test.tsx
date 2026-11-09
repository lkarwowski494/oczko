// M3 p4b (kawałek C, zadanie 5) — kolumny dzianiny z tokenów `dzianina.kolumnaKarty` (karta „Dziś”: 112 × min. 216, AX5 min. 120, promień 12) i `dzianina.kolumnaLicznika`
// (licznik: 64 × 260, AX5 96, promień 12) zamiast iloczynów `cele.*` (1,5 × „+1” karty, 72 × 252 licznika). Makieta `dzis`, `licznik`; zachowanie bez zmian (dzis-*.test, licznik-*.test).
import React from 'react';
import * as RN from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis, type PropsDzis } from '../../src/ekrany/Dzis';
import { Licznik } from '../../src/ekrany/Licznik';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const AX5 = 3.571;
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { mockSkala = 1; });
const styl = (el: { props: { style?: unknown } }) => (RN.StyleSheet.flatten(el.props.style as RN.StyleProp<RN.ViewStyle>) ?? {}) as RN.ViewStyle;
const kk = tokeny.dzianina.kolumnaKarty, kl = tokeny.dzianina.kolumnaLicznika;

const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: null, wToku: 1, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
function pokazDzis() {
  const p: PropsDzis = {
    stan: stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }), dane: DANE, t, oglos: jest.fn(), haptyka: atrapaHaptyki(),
    naPlus: jest.fn(async () => plusOk(43)), naCofnijSerie: jest.fn(), naOferty: jest.fn(), naKontynuuj: jest.fn(), naWybierzProjekt: jest.fn(),
  };
  render(<Dzis {...p} />);
  // Kolumna to pierwsze dziecko karty; rysunek dzianiny pojawia się po pomiarze (onLayout).
  const kolumna = screen.getByTestId('dzis-karta').children[0] as unknown as { props: { style?: unknown; onLayout(e: unknown): void } };
  return kolumna;
}

describe('„Dziś”: kolumna karty z dzianina.kolumnaKarty', () => {
  test('tokeny: karta 112 × min. 216, AX5 min. 120, promień 12', () => {
    expect(kk).toMatchObject({ szerokosc: 112, minWysokosc: 216, ax5MinWysokosc: 120, promien: 12 });
  });

  test('zwykły rozmiar: szerokość 112, min. wysokość 216, promień 12', () => {
    const kolumna = pokazDzis();
    expect(styl(kolumna)).toMatchObject({ width: kk.szerokosc, minHeight: kk.minWysokosc, borderRadius: kk.promien });
  });

  test('AX5: karta w kolumnie, kolumna dzianiny min. 120, promień 12 (bez stałej szerokości, na pełną szerokość)', () => {
    mockSkala = AX5;
    const kolumna = pokazDzis();
    const s = styl(kolumna);
    expect({ minHeight: s.minHeight, borderRadius: s.borderRadius, alignSelf: s.alignSelf }).toEqual({ minHeight: kk.ax5MinWysokosc, borderRadius: kk.promien, alignSelf: 'stretch' });
    expect(s.width).toBeUndefined();
  });

  test('dzianina dostaje wymiar zmierzony z kolumny (112 × 216), nie iloczyn cele.plus', () => {
    const kolumna = pokazDzis();
    fireEvent(kolumna as never, 'layout', { nativeEvent: { layout: { width: kk.szerokosc, height: kk.minWysokosc } } });
    const d = styl(screen.getByTestId('dzis-dzianina'));
    expect({ width: d.width, height: d.height }).toEqual({ width: kk.szerokosc, height: kk.minWysokosc });
  });
});

function pokazLicznik() {
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  const d = screen.getByTestId('licznik-dzianina');
  // Kolumna = najbliższy przodek z promieniem (wrapper `st.dzianina`/`st.dzianinaAx`); sama dzianina nie ma promienia.
  let w = d.parent as unknown as { props: { style?: unknown }; parent: unknown } | null;
  while (w && styl(w).borderRadius === undefined) w = w.parent as typeof w;
  return { dzianina: styl(d), kolumna: w ? styl(w) : ({} as RN.ViewStyle) };
}

describe('Licznik: kolumna z dzianina.kolumnaLicznika', () => {
  test('tokeny: licznik 64 × 260, AX5 96, promień 12', () => {
    expect(kl).toMatchObject({ szerokosc: 64, wysokosc: 260, ax5Wysokosc: 96, promien: 12 });
  });

  test('zwykły rozmiar: dzianina 64 × 260, kolumna z promieniem 12', () => {
    const { dzianina, kolumna } = pokazLicznik();
    expect({ width: dzianina.width, height: dzianina.height }).toEqual({ width: kl.szerokosc, height: kl.wysokosc });
    expect(kolumna.borderRadius).toBe(kl.promien);
  });

  // Zastąpiony jawnie (fix E5, 016, P-613; docs/programista/m3-fix-e5-zastapione-testy.md): pas 96 zostaje dla AX1–AX2, od AX3 kolumna dzianiny ukryta (`licznik.ax3ax5`).
  test('AX1: dzianina jako pas na pełną szerokość o wysokości 96, promień 12; od AX3 (AX5) bez dzianiny', () => {
    mockSkala = AX5;
    render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
    expect(screen.queryByTestId('licznik-dzianina')).toBeNull();
    screen.unmount();
    mockSkala = 1.786;
    const { dzianina, kolumna } = pokazLicznik();
    expect(dzianina.height).toBe(kl.ax5Wysokosc);
    expect(dzianina.width).toBeGreaterThan(kl.szerokosc);
    expect(kolumna.borderRadius).toBe(kl.promien);
  });
});
