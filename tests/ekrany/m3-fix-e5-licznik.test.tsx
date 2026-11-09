// M3 fix E5 (P-614, P-615, P-613): 016 + LIC-04 — stała strefa licznika nałożona na przewijaną treść (tokeny `licznik.strefa`):
// dolny odstęp treści = zmierzona wysokość strefy + odstepy.l, więc „Następna część”, podpis sesji, „Choose” konfliktu i notatka
// przewijają się nad rząd akcji (E2E 03, 34, 49, 57). Od AX3 (`licznik.ax3ax5`): liczba pierwsza w treści, tytuł najwyżej 2 wiersze
// (pełny w etykiecie nagłówka), kolumna dzianiny ukryta. Jest nie układa elementów: test sprawdza style i kolejność gwarantujące układ;
// sam układ potwierdzi przebieg 4 iOS.
import React from 'react';
import * as RN from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { StanEkranuLicznika } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { odstep, PROG_AX3 } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => { mockSkala = 1; });
let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));

const DLUGI = 'Counter from Nov 10 at 7:30 PM, long project name that wraps to three rows at large text sizes';
const plasko = (s: unknown) => (RN.StyleSheet.flatten(s as RN.StyleProp<RN.ViewStyle & RN.TextStyle>) ?? {}) as RN.ViewStyle & RN.TextStyle;
const rysuj = (stan: Partial<StanEkranuLicznika> = {}) =>
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone: 2, dziergany: 3, ...stan })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
/** Najbliższy przodek `licznik-przyciski` z onLayout = strefa. */
const strefa = () => {
  let n = screen.getByTestId('licznik-przyciski').parent;
  while (n && typeof n.props.onLayout !== 'function') n = n.parent;
  if (!n) throw new Error('brak strefy z onLayout');
  return n;
};
const przewijana = () => screen.UNSAFE_getByType(RN.ScrollView);

test('016/LIC-04: strefa (rząd akcji + −1/+1) leży na treści: position absolute u dołu, tło `tlo`; zawiera licznik-akcje', () => {
  rysuj();
  const s = strefa();
  const st = plasko(s.props.style);
  expect(st.position).toBe('absolute');
  expect(st.bottom).toBe(0);
  expect(st.left).toBe(0);
  expect(st.right).toBe(0);
  expect(st.backgroundColor).toBe(tokeny.kolory.jasny.tlo);
  expect(s.findAll((n) => n.props.testID === 'licznik-akcje').length).toBeGreaterThan(0);
});

test('016/LIC-04: dolny odstęp treści = zmierzona wysokość strefy + odstepy.l (licznik.strefa.dolnyOdstepTresci)', () => {
  rysuj({ cel: 40 });
  act(() => { fireEvent(strefa(), 'layout', { nativeEvent: { layout: { x: 0, y: 600, width: 390, height: 236 } } }); });
  expect(plasko(przewijana().props.contentContainerStyle).paddingBottom).toBe(236 + odstep.l);
  act(() => { fireEvent(strefa(), 'layout', { nativeEvent: { layout: { x: 0, y: 560, width: 390, height: 276 } } }); });
  expect(plasko(przewijana().props.contentContainerStyle).paddingBottom).toBe(276 + odstep.l);
});

test('016: ScrollView treści wypełnia ekran do dołu (flex 1), żeby strefa leżała na niej, a nie pod nią', () => {
  rysuj();
  expect(plasko(przewijana().props.style).flex).toBe(1);
});

test('016/LIC-04 od AX3: strefa nadal nałożona i mierzona (tylko −1/+1, akcje jako lista w treści)', () => {
  mockSkala = PROG_AX3;
  rysuj();
  const s = strefa();
  expect(plasko(s.props.style).position).toBe('absolute');
  expect(s.findAll((n) => n.props.testID === 'licznik-akcje').length).toBe(0);
  act(() => { fireEvent(s, 'layout', { nativeEvent: { layout: { x: 0, y: 500, width: 390, height: 300 } } }); });
  expect(plasko(przewijana().props.contentContainerStyle).paddingBottom).toBe(300 + odstep.l);
});

const idsWTresci = () => przewijana().findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);

test('016 od AX3 (licznik.ax3ax5): pierwszy element treści = licznik-wartosc-wiersz, potem „Projekt ›” i tytuł; dzianina nie renderowana', () => {
  mockSkala = PROG_AX3;
  rysuj({ projekt: DLUGI });
  const ids = idsWTresci();
  expect(ids[0]).toBe('licznik-wartosc-wiersz');
  expect(ids.indexOf('licznik-projekt-wejscie')).toBeGreaterThan(ids.indexOf('licznik-wartosc-wiersz'));
  expect(ids.indexOf('licznik-projekt')).toBeGreaterThan(ids.indexOf('licznik-projekt-wejscie'));
  expect(screen.queryByTestId('licznik-dzianina')).toBeNull();
});

test('016 od AX3: tytuł najwyżej 2 wiersze (tytulMaxWierszy), pełny tytuł w etykiecie nagłówka', () => {
  mockSkala = 3.571;
  rysuj({ projekt: DLUGI });
  const tytul = screen.getByTestId('licznik-projekt');
  expect(tytul.props.numberOfLines).toBe(tokeny.licznik.ax3ax5.tytulMaxWierszy);
  expect(tytul.props.accessibilityLabel).toBe(DLUGI);
});

test('016 poniżej AX3 (AX1, AX2): układ bez zmian — dzianina jest, tytuł bez limitu wierszy', () => {
  for (const skala of [1.786, 2.143]) {
    mockSkala = skala;
    const r = rysuj({ projekt: DLUGI });
    expect(screen.getByTestId('licznik-dzianina')).toBeTruthy();
    expect(screen.getByTestId('licznik-projekt').props.numberOfLines).toBeUndefined();
    r.unmount();
  }
});

// 07-p3 (a11y, kontrakt docs/design/testid.md `licznik-notatka`): notatka to jeden element VoiceOver z etykietą = treść notatki.
test('07-p3: licznik-notatka jest elementem dostępności z etykietą = treść notatki', () => {
  rysuj({ notatka: 'Sleeve 2 cm shorter' });
  const n = screen.getByTestId('licznik-notatka');
  expect(n.props.accessible).toBe(true);
  expect(n.props.accessibilityLabel).toBe('Sleeve 2 cm shorter');
});
