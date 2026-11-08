// M3 p4b (kawałek C, zadanie 4) — biegnący stoper w rzędzie akcji licznika (makieta `licznik-stoper`, token `stoper.biegnie`, M3-MAK-03, P-586 (2a)):
// komórka biegnąca = tło `powierzchnia`, rama 2 pt `akcentTekst`, czas 700 `tekst` z cyframi tabelarycznymi, symbol `akcentTekst` — zamiast wypełnienia `akcent`.
// Wstrzymany i nieczynny stoper oraz zachowanie (menu, etykiety VoiceOver, testID) bez zmian: stoper.test.tsx, stoper-kapsula-rozmiar.test.tsx.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Stoper, type PropsStopera } from '../../src/ekrany/Stoper';
import { kolorJasny } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());
const T = 1_000_000_000_000;
const UKRYTE = { includeHiddenElements: true } as const;
const b = tokeny.stoper.biegnie;

function pokaz(stan: PropsStopera['stan']) {
  render(<Stoper stan={stan} inny={null} t={t} teraz={() => T + 65_000} naStart={jest.fn()} naWstrzymaj={jest.fn()} naWznow={jest.fn()} naZatrzymaj={jest.fn()} naInnyPotwierdz={jest.fn()} naInnyAnuluj={jest.fn()} />);
}
const styl = (el: { props: { style?: unknown } }) => (RN.StyleSheet.flatten(el.props.style as RN.StyleProp<RN.ViewStyle & RN.TextStyle>) ?? {}) as RN.ViewStyle & RN.TextStyle;

describe.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s', (motyw, schemat) => {
  const paleta = motyw === 'jasny' ? tokeny.kolory.jasny : tokeny.kolory.ciemny;
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  test('token stoper.biegnie wskazuje role kolorów, które test sprawdza', () => {
    expect(b).toMatchObject({ tlo: 'powierzchnia', rama: 'akcentTekst', gruboscRamy: 2, ikona: 'akcentTekst', czas: 'tekst', wagaCzasu: 700, cyfry: 'tabular-nums' });
  });

  test('biegnie: komórka ma tło powierzchnia i ramę 2 pt akcentTekst (nie wypełnienie akcent)', () => {
    pokaz({ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' });
    const s = styl(screen.getByTestId('licznik-stoper'));
    expect({ tlo: s.backgroundColor, rama: s.borderWidth, kolor: s.borderColor }).toEqual({ tlo: paleta.powierzchnia, rama: b.gruboscRamy, kolor: paleta.akcentTekst });
    expect(s.backgroundColor).not.toBe(paleta.akcent);
  });

  test('biegnie: czas 700 w kolorze tekst z cyframi tabelarycznymi, symbol stopwatch w akcentTekst', () => {
    pokaz({ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' });
    const czas = styl(screen.getByText('1:05', UKRYTE));
    expect({ waga: czas.fontWeight, kolor: czas.color, cyfry: czas.fontVariant }).toEqual({ waga: String(b.wagaCzasu), kolor: paleta.tekst, cyfry: [b.cyfry] });
    expect(screen.getByTestId('symbol-stopwatch', UKRYTE).props.tintColor).toBe(paleta.akcentTekst);
  });

  test('wstrzymana: komórka zwykła, bez ramy (stan stoi), czas tekst 600, symbol pauzy w ikona', () => {
    pokaz({ rodzaj: 'wstrzymana', czasMs: 600_000, startGodzina: '19:52' });
    const s = styl(screen.getByTestId('licznik-stoper'));
    expect({ tlo: s.backgroundColor, rama: s.borderWidth }).toEqual({ tlo: paleta.powierzchnia, rama: undefined });
    expect(styl(screen.getByText('10:00', UKRYTE)).fontWeight).toBe('600');
    expect(screen.getByTestId('symbol-pause.fill', UKRYTE).props.tintColor).toBe(paleta.ikona);
  });

  test('bez sesji: zwykła komórka (powierzchnia, bez ramy), symbol w ikona', () => {
    pokaz({ rodzaj: 'brak' });
    const s = styl(screen.getByTestId('licznik-stoper'));
    expect({ tlo: s.backgroundColor, rama: s.borderWidth }).toEqual({ tlo: paleta.powierzchnia, rama: undefined });
    expect(screen.getByTestId('symbol-stopwatch', UKRYTE).props.tintColor).toBe(paleta.ikona);
  });
});

test('kolorJasny.akcentTekst i powierzchnia istnieją w palecie (nazwy z tokenu)', () => {
  expect(kolorJasny[b.rama as 'akcentTekst']).toBe(tokeny.kolory.jasny.akcentTekst);
  expect(kolorJasny[b.tlo as 'powierzchnia']).toBe(tokeny.kolory.jasny.powierzchnia);
});
