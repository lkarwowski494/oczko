// 04-studio-projektowe-008 (P1, aneks 2026-11-02): główne przyciski w ciemnym motywie zlewały się z tłem (tło przycisku #2E3136 na arkuszu #2A2C31 = 1,07:1,
// WCAG 2.2 1.4.11 wymaga 3:1). Wzorzec `docs/design/fix10-2026-11-01/partia8.html:56` (`.plus`) i `:70` (`.przycisk-pelny`): obrys 2 pt w tokenie `przyciskObrys`
// (ciemny #8C9098; jasny = kolor tła przycisku, więc bez widocznej zmiany). Etykieta przycisku pełnej szerokości: Libre Franklin 700 17 pt (`:70`), nie 28 pt.
// Test sprawdza prawdziwe komponenty z prawdziwymi tokenami w obu motywach; „+1 row” z licznika i z przeglądarki wzoru, przycisk arkusza, kapsułę stopera i wybrany dzień.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { Przycisk } from '../../src/ekrany/Arkusz';
import { HistoriaDni } from '../../src/ekrany/HistoriaDni';
import { Licznik } from '../../src/ekrany/Licznik';
import { Stoper } from '../../src/ekrany/Stoper';
import { PrzegladarkaWzoru } from '../../src/ekrany/WzorPrzegladarka';
import { ukladOkna } from '../../src/domena/uklad';
import { stanHistorii } from '../../src/kompozycja/historia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());

const MOTYWY = [['jasny', 'light', tokeny.kolor.jasny], ['ciemny', 'dark', tokeny.kolor.ciemny]] as const;
const GRUBOSC_OBRYSU = 2; // jak „−1” i przyciski drugie (pt)
const nieZlewaSie = (el: Parameters<typeof expect>[0], k: typeof tokeny.kolor.jasny) => {
  expect(el).toHaveStyle({ backgroundColor: k.przyciskTlo, borderWidth: GRUBOSC_OBRYSU, borderColor: k.przyciskObrys });
};

test('wartości wzorca: w ciemnym obrys różni się od tła przycisku, w jasnym jest nim (tokeny.json:36 i :15)', () => {
  expect(tokeny.kolor.ciemny.przyciskObrys).toBe('#8C9098');
  expect(tokeny.kolor.ciemny.przyciskObrys).not.toBe(tokeny.kolor.ciemny.przyciskTlo);
  expect(tokeny.kolor.jasny.przyciskObrys).toBe(tokeny.kolor.jasny.przyciskTlo);
});

describe.each(MOTYWY)('motyw %s', (_n, schemat, k) => {
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  test('przycisk główny arkusza („Keep counting”, „Continue with Yearly”, „Save a copy of my data”): obrys i etykieta 17 pt', () => {
    render(<Przycisk tekst="Keep counting" onPress={() => undefined} rodzaj="glowny" testID="p" />);
    nieZlewaSie(screen.getByTestId('p'), k);
    expect(screen.getByText('Keep counting')).toHaveStyle({ fontSize: tokeny.typografia.tresc.rozmiar, color: k.przyciskTekst });
  });

  test('przycisk główny nieaktywny: bez obrysu w kolorze akcentu (design-spec R1, tło i obrys = przyciskNieaktywnyTlo)', () => {
    render(<Przycisk tekst="Keep counting" onPress={() => undefined} rodzaj="glowny" wylaczony testID="p" />);
    expect(screen.getByTestId('p')).toHaveStyle({ backgroundColor: k.przyciskNieaktywnyTlo, borderColor: k.przyciskNieaktywnyTlo });
  });

  test('„+1 row” na liczniku', () => {
    render(<Licznik stan={stanLicznika()} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
    nieZlewaSie(screen.getByTestId('licznik-plus'), k);
  });

  test('„+1 row” w pasku licznika pod wzorem', () => {
    const w = {
      naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(),
      naZmienNazwe: jest.fn(), naUsun: jest.fn(), potwierdz: jest.fn(), naPlus: jest.fn(), naMinus: jest.fn(),
    };
    render(<PrzegladarkaWzoru stan={{
      nazwa: 'Harbor chart', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }], wzorId: 'w1',
      strona: { n: 2, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false,
      licznik: { liczba: 47, dziergany: 48, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 390, wysokosc: 844 }),
    }} t={t} widok={<RN.Text>PDF</RN.Text>} {...w} />);
    nieZlewaSie(screen.getByRole('button', { name: /^\+1 row/ }), k);
  });

  test('kapsuła stopera w trakcie sesji (tokeny przycisku głównego, design-spec)', () => {
    const T = 1_000_000_000_000;
    const f = { naStart: jest.fn(), naWstrzymaj: jest.fn(), naWznow: jest.fn(), naZatrzymaj: jest.fn(), naInnyPotwierdz: jest.fn(), naInnyAnuluj: jest.fn() };
    render(<Stoper stan={{ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' }} inny={null} t={t} teraz={() => T + 65_000} {...f} />);
    nieZlewaSie(screen.getByTestId('licznik-stoper'), k);
  });

  test('wybrany dzień w Historii = przycisk główny (design-spec: „wybrany dzień = przycisk główny”)', () => {
    const widok = {
      dniRobotki: ['2026-10-22'], ukonczoneDnia: [], dzien: [{ projektId: 'p1', nazwa: 'Sweater', rzedy: 5, czasMs: null }],
      tydzien: { od: '2026-10-19', do: '2026-10-25', rzedy: 5, czasMs: null, ukonczone: 0, poprzednie: { rzedy: 0 } },
      miesiac: { rzedy: 5, czasMs: null, ukonczone: 0, dni: 1 }, pierwsze: false,
    };
    const j = { t, jezyk: () => 'en', zegar24h: () => true };
    render(<HistoriaDni stan={stanHistorii(widok, { j, miesiac: '2026-10', wybrany: '2026-10-22', dzis: '2026-10-26' })} t={t}
      naWybierz={jest.fn()} naPoprzedni={jest.fn()} naNastepny={jest.fn()} naProjekt={jest.fn()} />);
    const dzien = screen.getByTestId('historia-dzien-2026-10-22');
    const kolo = dzien.findAll((n) => typeof n.type === 'string' && n.props.style && JSON.stringify(RN.StyleSheet.flatten(n.props.style)).includes(k.przyciskTlo))[0];
    expect(kolo).toBeTruthy();
    expect(RN.StyleSheet.flatten(kolo!.props.style)).toMatchObject({ backgroundColor: k.przyciskTlo, borderWidth: GRUBOSC_OBRYSU, borderColor: k.przyciskObrys });
  });
});
