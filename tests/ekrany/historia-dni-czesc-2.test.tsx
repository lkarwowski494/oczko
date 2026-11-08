// M3 p5 cz. 2 (decyzja koordynatora P-590 (a); makieta dzianina/ekrany.html `historia`): (1) kafelki podsumowania miesiąca z istniejącego odczytu `miesiac`
// (dni z robótką, rzędy, czas; bez sesji brak kafelka czasu, nie zero), (2) strzałki z nazwami sąsiednich miesięcy z Intl, (3) dni przyszłe wyszarzone.
import React from 'react';
import * as RN from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { HistoriaDni } from '../../src/ekrany/HistoriaDni';
import { stanHistorii } from '../../src/kompozycja/historia';
import type { WidokHistorii } from '../../src/przypadki-uzycia/historia';
import { kolorJasny } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const W: WidokHistorii = {
  dniRobotki: ['2026-10-22', '2026-10-23'], ukonczoneDnia: [],
  dzien: [{ projektId: 'p1', nazwa: 'Sweater', rzedy: 5, czasMs: null }],
  tydzien: { od: '2026-10-19', do: '2026-10-25', rzedy: 5, czasMs: null, ukonczone: 0, poprzednie: { rzedy: 0 } },
  miesiac: { rzedy: 38, czasMs: null, ukonczone: 0, dni: 3 }, pierwsze: false,
};
const j = (jezyk = 'en') => ({ t, jezyk: () => jezyk, zegar24h: () => true });
function pokaz(w: WidokHistorii = W, o: { miesiac?: string; dzis?: string; jezyk?: string } = {}) {
  const f = { naWybierz: jest.fn(), naPoprzedni: jest.fn(), naNastepny: jest.fn(), naProjekt: jest.fn() };
  render(<HistoriaDni stan={stanHistorii(w, { j: j(o.jezyk), miesiac: o.miesiac ?? '2026-10', wybrany: '2026-10-22', dzis: o.dzis ?? '2026-10-26' })} t={t} {...f} />);
  return f;
}
const plaski = (el: { props: { style?: unknown } }) => RN.StyleSheet.flatten(el.props.style as RN.ViewStyle & RN.TextStyle);

describe('(1) kafelki podsumowania miesiąca', () => {
  test('dni z robótką, rzędy i czas (gdy są sesje) jako liczba nad etykietą; VoiceOver czyta wartość i etykietę', () => {
    pokaz({ ...W, miesiac: { rzedy: 38, czasMs: 160 * 60_000, ukonczone: 0, dni: 3 } });
    const dni = screen.getByTestId('historia-kafel-dni');
    expect(within(dni).getByText('3')).toBeTruthy();
    expect(within(dni).getByText('crafting days')).toBeTruthy();
    expect(dni.props.accessibilityLabel).toBe('3 crafting days');
    const rzedy = screen.getByTestId('historia-kafel-rzedy');
    expect(within(rzedy).getByText('38')).toBeTruthy();
    expect(within(rzedy).getByText('rows')).toBeTruthy();
    expect(rzedy.props.accessibilityLabel).toBe('38 rows');
    const czas = screen.getByTestId('historia-kafel-czas');
    expect(within(czas).getByText('2 h 40 min')).toBeTruthy();
    expect(within(czas).getByText('session time')).toBeTruthy();
    expect(czas.props.accessibilityLabel).toBe('2 h 40 min session time');
  });

  test('liczba mnoga etykiety: 1 dzień → „crafting day”, 1 rząd → „row”', () => {
    pokaz({ ...W, miesiac: { rzedy: 1, czasMs: null, ukonczone: 0, dni: 1 } });
    expect(within(screen.getByTestId('historia-kafel-dni')).getByText('crafting day')).toBeTruthy();
    expect(within(screen.getByTestId('historia-kafel-rzedy')).getByText('row')).toBeTruthy();
  });

  test('bez sesji: brak kafelka czasu (brak zostaje brakiem), pod kafelkami nota o stoperze', () => {
    pokaz();
    expect(screen.queryByTestId('historia-kafel-czas')).toBeNull();
    expect(within(screen.getByTestId('historia-miesiac')).getByText('Time shows here when you use the stopwatch.')).toBeTruthy();
  });

  test('miesiąc bez robótki: kafelki „0” (zero jest wartością, nie brakiem)', () => {
    pokaz({ ...W, dniRobotki: [], miesiac: { rzedy: 0, czasMs: null, ukonczone: 0, dni: 0 } });
    expect(within(screen.getByTestId('historia-kafel-dni')).getByText('0')).toBeTruthy();
    expect(within(screen.getByTestId('historia-kafel-rzedy')).getByText('0')).toBeTruthy();
  });
});

describe('(2) strzałki z nazwami sąsiednich miesięcy', () => {
  test('en: „September” i „November” przy październiku; etykiety VoiceOver i wywołania bez zmian', () => {
    const f = pokaz();
    const poprzedni = screen.getByRole('button', { name: 'Previous month' });
    const nastepny = screen.getByRole('button', { name: 'Next month' });
    expect(within(poprzedni).getByText('September')).toBeTruthy();
    expect(within(nastepny).getByText('November')).toBeTruthy();
    fireEvent.press(poprzedni); fireEvent.press(nastepny);
    expect([f.naPoprzedni.mock.calls.length, f.naNastepny.mock.calls.length]).toEqual([1, 1]);
  });

  test('pl: nazwy z Intl w mianowniku („wrzesień”, „listopad”)', () => {
    pokaz(W, { jezyk: 'pl' });
    expect(within(screen.getByRole('button', { name: 'Previous month' })).getByText('wrzesień')).toBeTruthy();
    expect(within(screen.getByRole('button', { name: 'Next month' })).getByText('listopad')).toBeTruthy();
  });

  test('przełom roku: styczeń 2027 → poprzedni „December”, następny „February”', () => {
    pokaz({ ...W, dniRobotki: [] }, { miesiac: '2027-01', dzis: '2027-01-15' });
    expect(within(screen.getByRole('button', { name: 'Previous month' })).getByText('December')).toBeTruthy();
    expect(within(screen.getByRole('button', { name: 'Next month' })).getByText('February')).toBeTruthy();
  });
});

describe('(3) dni przyszłe wyszarzone', () => {
  const tlo = (id: string) => plaski(screen.getByTestId(id).findAll((n) => typeof n.type === 'string' && n.props.style && plaski(n).borderWidth !== undefined)[0]!);

  test('dzień po dzisiejszym: bez tła, tekst `tekst2`; dziś i dni minione bez zmian', () => {
    pokaz(); // dziś 26.10
    expect(tlo('historia-dzien-2026-10-27')).toMatchObject({ backgroundColor: 'transparent', borderColor: 'transparent' });
    expect(tlo('historia-dzien-2026-10-26')).toMatchObject({ backgroundColor: kolorJasny.dzienPusty });
    expect(tlo('historia-dzien-2026-10-25')).toMatchObject({ backgroundColor: kolorJasny.dzienPusty });
    const numer = within(screen.getByTestId('historia-dzien-2026-10-27')).getByText('27');
    expect(plaski(numer).color).toBe(kolorJasny.tekst2);
  });

  test('dzień przyszły nadal da się wybrać (kalendarz przyszłego miesiąca jest pusty, ale nie zablokowany)', () => {
    const f = pokaz();
    fireEvent.press(screen.getByTestId('historia-dzien-2026-10-30'));
    expect(f.naWybierz).toHaveBeenCalledWith('2026-10-30');
  });

  test('cały miesiąc w przyszłości: wszystkie dni wyszarzone', () => {
    pokaz({ ...W, dniRobotki: [] }, { miesiac: '2026-12', dzis: '2026-10-26' });
    expect(tlo('historia-dzien-2026-12-01')).toMatchObject({ backgroundColor: 'transparent' });
    expect(tlo('historia-dzien-2026-12-31')).toMatchObject({ backgroundColor: 'transparent' });
  });
});
