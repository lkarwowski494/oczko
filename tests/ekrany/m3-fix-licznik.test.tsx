// M3 fix-licznik (P-607): M3-LIC-01 etykieta „−1” z tokenu `tekst` w obu motywach (makieta `.minus`: color var(--tekst)),
// M3-LIC-02 rząd akcji pod liczbą bez nachodzenia przy 320 / 390 / 440 pt (makieta `.akcje`: grid auto-fit minmax(64px, 1fr), gap 8, padding 16),
// M3-LIC-03 rząd akcji poza przewijaną treścią (nad stałą strefą „−1 / +1”), więc długi tytuł go nie przycina; od AX1 lista w przewijanej treści (makieta `.duzy`).
// Jest nie układa elementów: test sprawdza style gwarantujące układ (jak wzor-pasek-ipad.test.tsx); sam układ potwierdza skrypt Yoga (docs/programista/m3-fix-licznik-stan.md).
import React from 'react';
import * as RN from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import { Stoper, type PropsStopera } from '../../src/ekrany/Stoper';
import type { StanEkranuLicznika } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { odstep } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => { mockSkala = 1; mockSzerokosc = 390; jest.restoreAllMocks(); });
let mockSkala = 1;
let mockSzerokosc = 390;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: mockSzerokosc, height: 874, scale: 3, fontScale: mockSkala }) }));

const T = 1_000_000_000_000;
const DLUGI_TYTUL = 'Counter from Nov 10 at 7:30 PM, long project name that wraps to two rows';
const plasko = (s: unknown) => (RN.StyleSheet.flatten(s as RN.StyleProp<RN.ViewStyle & RN.TextStyle>) ?? {}) as RN.ViewStyle & RN.TextStyle;
const stylu = (id: string) => plasko(screen.getByTestId(id).props.style);
const stoperProps = (stan: PropsStopera['stan']): PropsStopera => ({ stan, inny: null, t, teraz: () => T + 65_000, naStart: jest.fn(), naWstrzymaj: jest.fn(), naWznow: jest.fn(), naZatrzymaj: jest.fn(), naInnyPotwierdz: jest.fn(), naInnyAnuluj: jest.fn() });

const rysuj = (stan: Partial<StanEkranuLicznika> = {}, stoper: PropsStopera['stan'] = { rodzaj: 'brak' }) => {
  const w = wywolaniaLicznika();
  return render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone: 2, dziergany: 3, ...stan })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...w}
    stoper={<Stoper {...stoperProps(stoper)} />} />);
};
/** Styl najbliższego przodka elementu o danym testID, który nie jest tym samym węzłem (RNTL: `parent` zaczyna od kompozytu o tych samych propsach). */
const stylRodzica = (id: string) => {
  let n = screen.getByTestId(id).parent;
  while (n && (n.props.testID === id || n.props.style === undefined)) n = n.parent;
  return plasko(n?.props.style);
};
const przodkowie = (id: string): unknown[] => { const o: unknown[] = []; for (let n = screen.getByTestId(id).parent; n; n = n.parent) o.push(n.type); return o; };
const wScrollView = (id: string) => przodkowie(id).some((typ) => typ === RN.ScrollView || (typeof typ === 'string' && typ === 'RCTScrollView'));

describe.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s', (motyw, schemat) => {
  const paleta = tokeny.kolory[motyw];
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  test('M3-LIC-01: etykieta „−1” ma kolor tokenu `tekst` (makieta `.minus`)', () => {
    rysuj();
    expect(plasko(screen.getByText('−1').props.style).color).toBe(paleta.tekst);
  });

  test('M3-LIC-01 (AX5): etykieta „−1” z tokenu `tekst` także w układzie pionowym', () => {
    mockSkala = 3.571;
    rysuj();
    expect(plasko(screen.getByText('−1').props.style).color).toBe(paleta.tekst);
  });
});

describe('M3-LIC-02: rząd akcji — równe kolumny z zawijaniem (makieta `.akcje`)', () => {
  const ID = ['licznik-akcja-notatka', 'licznik-wzor', 'licznik-cel', 'licznik-historia'];
  const min = tokeny.cele.paskaWzoru.minSzerokosc;

  test('rząd zawija się (nie przewija i nie nachodzi), odstęp 8 pt, boczny margines 16 pt jak w makiecie', () => {
    rysuj();
    const rzad = stylu('licznik-akcje');
    expect(rzad.flexDirection).toBe('row');
    expect(rzad.flexWrap).toBe('wrap');
    expect(rzad.gap).toBe(odstep.s);
    expect(stylRodzica('licznik-akcje').paddingHorizontal).toBe(odstep.l);
  });

  test.each([320, 390, 440])('przy %i pt każda komórka rzędu ma podstawę min. 64 pt i rośnie po równo (kolumna > 0, bez wąskiej komórki obok szerokiej)', (w) => {
    mockSzerokosc = w;
    rysuj({}, { rodzaj: 'brak' });
    for (const id of ID) {
      const s = stylu(id);
      expect({ id, grow: s.flexGrow, basis: s.flexBasis }).toEqual({ id, grow: 1, basis: min });
      expect(s.minWidth ?? 0).toBeLessThanOrEqual(min);
    }
    // „Stoper” to osobny komponent z korzeniem: korzeń komórki ma ten sam wzór wielkości, więc nie zwija się do 0 i ikona ma miejsce.
    const korzen = stylRodzica('licznik-stoper');
    expect({ grow: korzen.flexGrow, basis: korzen.flexBasis }).toEqual({ grow: 1, basis: min });
    expect(screen.getByTestId('symbol-stopwatch', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('Timer')).toBeTruthy();
  });

  test('liczba kolumn jak w makiecie: 5 × 64 + 4 × 8 = 352 mieści się w 358 pt (390 − 2 × 16), a przy 320 pt (288) wchodzą 4 i piąta zawija', () => {
    const kolumn = (w: number) => Math.max(1, Math.min(5, Math.floor((w - 2 * odstep.l + odstep.s) / (tokeny.cele.paskaWzoru.minSzerokosc + odstep.s))));
    expect([320, 390, 440].map(kolumn)).toEqual([4, 5, 5]);
  });

  test.each([['trwa', { rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' }], ['wstrzymana', { rodzaj: 'wstrzymana', czasMs: 65_000, startGodzina: '19:52' }]] as const)(
    'stoper %s nie zmienia szerokości kolumny: korzeń i komórka te same co bez sesji, rama 2 pt wewnątrz komórki (odstęp + rama bez zmian)', (_n, stan) => {
      rysuj({}, { rodzaj: 'brak' });
      const bez = { kor: stylRodzica('licznik-stoper'), kom: stylu('licznik-stoper') };
      screen.unmount();
      rysuj({}, stan as PropsStopera['stan']);
      const z = { kor: stylRodzica('licznik-stoper'), kom: stylu('licznik-stoper') };
      for (const k of ['flexGrow', 'flexBasis', 'minWidth', 'width'] as const) {
        expect({ k, v: z.kor[k] }).toEqual({ k, v: bez.kor[k] });
        expect({ k, v: z.kom[k] }).toEqual({ k, v: bez.kom[k] });
      }
      const wnetrze = (s: RN.ViewStyle) => ({ poziomo: Number(s.paddingHorizontal) + Number(s.borderWidth ?? 0), pionowo: Number(s.paddingVertical) + Number(s.borderWidth ?? 0) });
      expect(wnetrze(z.kom)).toEqual(wnetrze(bez.kom));
    });
});

describe('M3-LIC-03 (stuknięcia): akcje reagują na stuknięcie', () => {
  test('stuknięcie w „Wzór” i „Historia” wywołuje wywołania zwrotne (rząd poza przewijaną treścią)', () => {
    const w = wywolaniaLicznika();
    const naWzor = jest.fn();
    render(<Licznik stan={stanLicznika({ projekt: DLUGI_TYTUL, czesc: 'Left sleeve', skonczone: 2, dziergany: 3 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...w} naWzor={naWzor} />);
    fireEvent.press(screen.getByTestId('licznik-wzor'));
    fireEvent.press(screen.getByTestId('licznik-historia'));
    expect([naWzor.mock.calls.length, w.naHistorie.mock.calls.length]).toEqual([1, 1]);
  });
});

describe('M3-LIC-03: rząd akcji nie jest przycinany przez stałą strefę „−1 / +1”', () => {
  test('zwykły rozmiar: rząd stoi nad strefą poza przewijaną treścią — także przy tytule w 2 wierszach', () => {
    rysuj({ projekt: DLUGI_TYTUL });
    expect(screen.getByText(DLUGI_TYTUL)).toBeTruthy();
    expect(wScrollView('licznik-akcje')).toBe(false);
    expect(wScrollView('licznik-przyciski')).toBe(false);
    // Stuknięcie trafia w akcję: żaden z celów nie leży w przewijanej treści (jej dolna krawędź przycinała rząd i środek komórki trafiał w strefę „−1 / +1”).
    for (const id of ['licznik-akcja-notatka', 'licznik-wzor', 'licznik-cel', 'licznik-stoper', 'licznik-historia']) expect({ id, wScrollView: wScrollView(id) }).toEqual({ id, wScrollView: false });
    const wszystkie = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
    expect(wszystkie.indexOf('licznik-akcje')).toBeGreaterThan(wszystkie.indexOf('licznik-wartosc'));
    expect(wszystkie.indexOf('licznik-akcje')).toBeLessThan(wszystkie.indexOf('licznik-przyciski'));
        expect(stylRodzica('licznik-akcje').zIndex).toBeGreaterThan(0); // menu stopera nad strefą
  });

  test('AX5: lista akcji w przewijanej treści pod notatką (makieta `.duzy`), strefa „+1 / −1” poza nią', () => {
    mockSkala = 3.571;
    rysuj({ projekt: DLUGI_TYTUL });
    expect(wScrollView('licznik-akcje')).toBe(true);
    expect(wScrollView('licznik-przyciski')).toBe(false);
  });
});
