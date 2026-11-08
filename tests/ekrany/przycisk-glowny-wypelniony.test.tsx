// M3 p1 (P-547, P-553 wyjątek nazwany; zastępuje przycisk-glowny-obrys.test.tsx kierunku „Kreski”): w Dzianinie przycisk główny jest WYPEŁNIONY w obu motywach
// (jasny: grafit z jasnym tekstem, ciemny: miód z ciemnym tekstem), bez obrysu w innym kolorze (design-spec „Kolory”, token `przycisk`). Przycisk nieaktywny:
// tło powierzchni, tekst drugi i PRZERYWANA rama (nigdy sam kolor). Test sprawdza prawdziwe komponenty z prawdziwymi tokenami w obu motywach; „+1 row” z licznika
// i z przeglądarki wzoru, przycisk arkusza, kapsułę stopera i wybrany dzień (ekrany p2–p8 dostaną własny wygląd w swoich partiach; do tego czasu obrys ma kolor wypełnienia).
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

const MOTYWY = [['jasny', 'light', tokeny.kolory.jasny], ['ciemny', 'dark', tokeny.kolory.ciemny]] as const;
const wypelniony = (el: Parameters<typeof expect>[0], k: typeof tokeny.kolory.jasny) => {
  expect(el).toHaveStyle({ backgroundColor: k.przycisk });
  const st = RN.StyleSheet.flatten((el as { props: { style?: RN.StyleProp<RN.ViewStyle> } }).props.style) ?? {};
  // bez obrysu w innym kolorze niż wypełnienie (obrys, jeśli jest, ma kolor wypełnienia)
  expect(!st.borderWidth || st.borderColor === k.przycisk).toBe(true);
};

test('wartości Dzianiny: przycisk wypełniony miodem (ciemny) i grafitem (jasny), różny od tła; poprzedni „obrys” nie istnieje w tokenach', () => {
  expect(tokeny.kolory.ciemny.przycisk).toBe('#F0CF8A');
  expect(tokeny.kolory.jasny.przycisk).toBe('#3A332E');
  for (const k of [tokeny.kolory.jasny, tokeny.kolory.ciemny]) {
    expect(k.przycisk).not.toBe(k.tlo);
    expect(k).not.toHaveProperty('przyciskObrys');
  }
});

describe.each(MOTYWY)('motyw %s', (_n, schemat, k) => {
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  test('przycisk główny arkusza („Keep counting”, „Continue with Yearly”, „Save a copy of my data”): wypełniony, etykieta 17 pt', () => {
    render(<Przycisk tekst="Keep counting" onPress={() => undefined} rodzaj="glowny" testID="p" />);
    wypelniony(screen.getByTestId('p'), k);
    expect(screen.getByText('Keep counting')).toHaveStyle({ fontSize: tokeny.typografia.tresc.pt, color: k.przyciskTekst });
  });

  test('przycisk główny nieaktywny: tło powierzchni, rama PRZERYWANA w kolorze tekstu drugiego (nie sam kolor; design-spec „Kolory”)', () => {
    render(<Przycisk tekst="Keep counting" onPress={() => undefined} rodzaj="glowny" wylaczony testID="p" />);
    expect(screen.getByTestId('p')).toHaveStyle({ backgroundColor: k.przyciskNieaktywny, borderStyle: 'dashed', borderColor: k.przyciskNieaktywnyRama });
  });

  // M3 p3a (makieta `licznik`, `.wielki`): „+1” licznika to duży przycisk w kolorze `akcent` z tekstem `naAkcencie` (jak okrągłe „+1” karty „Dziś”), nie `przycisk`; bez obrysu.
  test('„+1 row” na liczniku: wypełnienie `akcent`, tekst `naAkcencie`, bez obrysu', () => {
    render(<Licznik stan={stanLicznika()} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
    expect(screen.getByTestId('licznik-plus')).toHaveStyle({ backgroundColor: k.akcent });
    expect(RN.StyleSheet.flatten(screen.getByTestId('licznik-plus').props.style).borderWidth).toBeUndefined();
    expect(screen.getByText('+1 row')).toHaveStyle({ color: k.naAkcencie });
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
    wypelniony(screen.getByRole('button', { name: /^\+1 row/ }), k);
  });

  // M3 p3a (P-586 2a): trwająca sesja stopera to akcja pod liczbą w kolorze `akcent` (stan niesie też symbol i etykieta VoiceOver); wygląd biegnącego stopera [DO USTALENIA 04].
  test('akcja stopera w trakcie sesji: wypełnienie `akcent`', () => {
    const T = 1_000_000_000_000;
    const f = { naStart: jest.fn(), naWstrzymaj: jest.fn(), naWznow: jest.fn(), naZatrzymaj: jest.fn(), naInnyPotwierdz: jest.fn(), naInnyAnuluj: jest.fn() };
    render(<Stoper stan={{ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' }} inny={null} t={t} teraz={() => T + 65_000} {...f} />);
    expect(screen.getByTestId('licznik-stoper')).toHaveStyle({ backgroundColor: k.akcent });
  });

  test('Historia (M3 p5): dzień z robótką = kwadrat `akcent` z obwódką `akcentTekst`, wybrany dzień = obwódka `tekst`', () => {
    const widok = {
      dniRobotki: ['2026-10-22', '2026-10-23'], ukonczoneDnia: [], dzien: [{ projektId: 'p1', nazwa: 'Sweater', rzedy: 5, czasMs: null }],
      tydzien: { od: '2026-10-19', do: '2026-10-25', rzedy: 5, czasMs: null, ukonczone: 0, poprzednie: { rzedy: 0 } },
      miesiac: { rzedy: 5, czasMs: null, ukonczone: 0, dni: 2 }, pierwsze: false,
    };
    const j = { t, jezyk: () => 'en', zegar24h: () => true };
    render(<HistoriaDni stan={stanHistorii(widok, { j, miesiac: '2026-10', wybrany: '2026-10-22', dzis: '2026-10-26' })} t={t}
      naWybierz={jest.fn()} naPoprzedni={jest.fn()} naNastepny={jest.fn()} naProjekt={jest.fn()} />);
    const kwadrat = (id: string) => screen.getByTestId(id).findAll((n) => typeof n.type === 'string' && n.props.style && RN.StyleSheet.flatten(n.props.style).backgroundColor !== undefined && RN.StyleSheet.flatten(n.props.style).borderWidth !== undefined)[0];
    expect(RN.StyleSheet.flatten(kwadrat('historia-dzien-2026-10-22')!.props.style)).toMatchObject({ backgroundColor: k.akcent, borderColor: k.tekst }); // wybrany
    expect(RN.StyleSheet.flatten(kwadrat('historia-dzien-2026-10-23')!.props.style)).toMatchObject({ backgroundColor: k.akcent, borderColor: k.akcentTekst }); // dziergany, niewybrany
    expect(RN.StyleSheet.flatten(kwadrat('historia-dzien-2026-10-24')!.props.style)).toMatchObject({ backgroundColor: k.dzienPusty }); // bez robótki
  });
});
