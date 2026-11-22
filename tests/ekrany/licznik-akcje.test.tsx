// M3 p3a (ZM-04, P-580, P-581, P-583, P-586): licznik TO BE — „Projekt ›” nad nazwą, dzianina przy liczbie, rząd podpisanych akcji pod liczbą
// (Notatka, Wzór, Cel, Stoper, Historia), AX5: akcje jako lista, „+1” nad „−1” na pełną szerokość. Wyrocznia: docs/design/testid.md M3-TESTID-02
// i makieta dzianina/ekrany.html `licznik` (+ zrzuty licznik-390-*-ax5); testID i kolejność akcji sprawdza też tests/akceptacja/ekrany/licznik-to-be.test.tsx.
import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { StanEkranuLicznika } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, przycisk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => { mockSkala = 1; });
let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: mockSkala }) }));

const rysuj = (stan: Partial<StanEkranuLicznika> = {}, props: Record<string, unknown> = {}) => {
  const w = wywolaniaLicznika();
  const naNotatka = jest.fn(), naCel = jest.fn(), naWzor = jest.fn(), naProjekt = jest.fn(), naWstecz = jest.fn();
  const r = render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone: 1, dziergany: 2, ...stan })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()}
    {...w} naNotatka={naNotatka} naCel={naCel} naWzor={naWzor} naProjekt={naProjekt} naWstecz={naWstecz} {...props} />);
  return { ...r, w, naNotatka, naCel, naWzor, naProjekt, naWstecz };
};
const stylu = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style) as Record<string, unknown>;
const kolejnosc = (ids: string[]) => {
  const wszystkie = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
  return ids.map((id) => wszystkie.indexOf(id));
};

describe('akcje pod liczbą: podpis widoczny i nazwa dla VoiceOver', () => {
  test('pięć akcji z podpisami (Note, Pattern, Goal, Timer, History) — nazwy VoiceOver z testid.md', () => {
    rysuj();
    for (const podpis of ['Note', 'Pattern', 'Goal', 'Timer', 'History']) expect(screen.getByText(podpis)).toBeTruthy();
    przycisk('Note');
    przycisk('Pattern');
    przycisk('Goal, reminder, repeat'); // P-581 (a): „Cel” otwiera cel, przypomnienie i powtórzenie
    przycisk('History');
  });

  test('stuknięcie: Notatka → arkusz notatki, Wzór → wzór (także bez wzoru), Cel → arkusz Cel, Historia → historia zmian', () => {
    const u = rysuj();
    fireEvent.press(screen.getByTestId('licznik-akcja-notatka'));
    fireEvent.press(screen.getByTestId('licznik-wzor'));
    fireEvent.press(screen.getByTestId('licznik-cel'));
    fireEvent.press(screen.getByTestId('licznik-historia'));
    expect([u.naNotatka, u.naWzor, u.naCel, u.w.naHistorie].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1]);
  });

  test('„Wzór” jest zawsze: także bez wzoru akcja jest w rzędzie (dziś bez wzoru: dotychczasowe dodanie wzoru, menu źródeł to p3b)', () => {
    rysuj({}, { naWzor: undefined });
    expect(screen.getByTestId('licznik-wzor')).toBeTruthy();
  });

  test('stoper: bez usługi stopera (brak projektu) akcja jest, ale nieaktywna; z usługą — węzeł z kompozycji w tym samym miejscu rzędu', () => {
    rysuj();
    expect(screen.getByTestId('licznik-stoper')).toBeDisabled();
    screen.unmount();
    rysuj({}, { stoper: <></> });
    expect(screen.queryByTestId('licznik-stoper')).toBeNull(); // slot oddaje komponent kompozycji (Stoper) — tu pusty
  });

  test('licznik oczek (BR-LIC-006): bez akcji „Cel” (cel dotyczy rzędów), pozostałe cztery są', () => {
    rysuj({ rodzaj: 'oczka' });
    expect(screen.queryByTestId('licznik-cel')).toBeNull();
    for (const id of ['licznik-akcja-notatka', 'licznik-wzor', 'licznik-stoper', 'licznik-historia']) expect(screen.getByTestId(id)).toBeTruthy();
  });
});

describe('nagłówek: „Projekt ›”, nazwa, część, powrót', () => {
  test('„Projekt ›” (VoiceOver „Project: Harbor”) otwiera ekran projektu; nazwa to nagłówek `licznik-projekt`', () => {
    const u = rysuj();
    fireEvent.press(przycisk('Project: Harbor'));
    expect(u.naProjekt).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Project ›')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Harbor' })).toBe(screen.getByTestId('licznik-projekt'));
    expect(screen.getByText('Left sleeve')).toBeTruthy(); // nazwa części pod nazwą projektu
  });

  test('pierwszy licznik bez nazwy: bez „Projekt ›” i bez `licznik-projekt`, tytuł roboczy jako nagłówek', () => {
    rysuj({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 });
    expect(screen.queryByTestId('licznik-projekt-wejscie')).toBeNull();
    expect(screen.queryByTestId('licznik-projekt')).toBeNull();
    expect(screen.getByRole('header', { name: 'Counter' })).toBeTruthy();
  });

  test('wstecz `nav-wstecz` woła naWstecz; ••• tylko z projektem', () => {
    const u = rysuj();
    fireEvent.press(screen.getByTestId('nav-wstecz'));
    expect(u.naWstecz).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('licznik-menu')).toBeTruthy();
    expect(przycisk('Counter options: name, row number, lock, finish')).toBe(screen.getByTestId('licznik-menu'));
  });

  test('dzianina przy liczbie z etykietą dla VoiceOver; wskazówka z celem w jednym zdaniu', () => {
    rysuj({ skonczone: 42, dziergany: 43, cel: 96, sesja: { rzedy: 14, od: '9:00 AM' } });
    expect(screen.getByTestId('licznik-dzianina')).toHaveAccessibleName('Left sleeve: 42 of 96 rows done, 14 this session');
  });
});

describe('układ: zwykły i AX5', () => {
  test('zwykły: akcje w rzędzie, −1 przed +1 w jednym rzędzie, dzianina obok liczby, notatka nad akcjami', () => {
    rysuj({ notatka: 'Sleeve 2 cm shorter' });
    expect(stylu('licznik-akcje').flexDirection).toBe('row');
    expect(stylu('licznik-przyciski').flexDirection).toBe('row');
    const [minus, plus] = kolejnosc(['licznik-minus', 'licznik-plus']);
    expect(minus < plus).toBe(true);
    const [notatka, akcje] = kolejnosc(['licznik-notatka', 'licznik-akcje']);
    expect(notatka < akcje).toBe(true);
    expect(screen.getByTestId('licznik-notatka')).toHaveTextContent('Sleeve 2 cm shorter');
  });

  // Zastąpiony jawnie (fix E5, 016, P-613; docs/programista/m3-fix-e5-zastapione-testy.md): od AX3 liczba pierwsza w treści, bez dzianiny (`licznik.ax3ax5`).
  test('AX5: akcje jako lista pod notatką, „+1” nad „−1” na pełną szerokość, liczba nad nazwą, bez dzianiny', () => {
    mockSkala = 3.571;
    rysuj({ notatka: 'Sleeve 2 cm shorter' });
    expect(stylu('licznik-akcje').flexDirection).toBe('column');
    expect(stylu('licznik-przyciski').flexDirection).toBe('column');
    const [plus, minus] = kolejnosc(['licznik-plus', 'licznik-minus']);
    expect(plus < minus).toBe(true);
    const [projekt, liczba, notatka, akcje] = kolejnosc(['licznik-projekt', 'licznik-wartosc', 'licznik-notatka', 'licznik-akcje']);
    expect(liczba < projekt && projekt < notatka && notatka < akcje).toBe(true);
    expect(screen.queryByTestId('licznik-dzianina')).toBeNull();
    expect(screen.getByRole('button', { name: '+1 row, when row 2 is done' })).toBeTruthy(); // podpis +1 tylko w etykiecie (P-275)
  });
});
