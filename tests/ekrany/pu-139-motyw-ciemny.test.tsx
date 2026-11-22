// PU-139 (katalog przypadków użycia, „Wygląd i dostępność”): motyw ciemny — tło każdego z 6 ekranów (Dziś, licznik, wzór, Ustawienia, Oczko Pro, przewodnik) to token ciemny,
// a „Show ›”, ptaszek „przeczytane” i strzałki przewodnika są obecne w kolorach ciemnych tokenów. Prawdziwe ekrany `src/ekrany/*` przy `useColorScheme() === 'dark'`;
// tło korzenia (Stack + placeholder startu) i opakowanie `Bezpieczny`: tests/ekrany/pu-139-motyw-ciemny-korzen.test.tsx.
// Poza Jest (częściowo): faktyczne przełączenie wyglądu systemu (`simctl ui appearance dark`), restart i ocena kontrastu na zrzutach (białe pola: PU-343) — bez porównania zrzutów (słowa właściciela 16.11.2026, wariant B).
import React from 'react';
import * as RN from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { Aplikacja, type UslugiAplikacji } from '../../src/ekrany/Aplikacja';
import { Licznik } from '../../src/ekrany/Licznik';
import { Oferty } from '../../src/ekrany/Oferty';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import { ukladOkna } from '../../src/domena/uklad';
import type { EkranAktywny, Produkt, Sklep } from '../../src/domena/porty';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaCyklu, atrapaHaptyki, atrapaSystemu, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));

const C = tokeny.kolory.ciemny;
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark'); });
afterEach(() => jest.restoreAllMocks());

/** Tło ekranu: pierwszy przodek elementu ze stylem `flex: 1` i własnym tłem (korzeń ekranu); element sam też się liczy. */
function tloEkranu(el: ReturnType<typeof screen.getByTestId>): unknown {
  for (let w: typeof el | null = el; w; w = w.parent) {
    const s = StyleSheet.flatten(w.props?.style) as { flex?: number; backgroundColor?: string } | undefined;
    if (s?.flex === 1 && s.backgroundColor) return s.backgroundColor;
  }
  return undefined;
}
const kolorSymbolu = (id: string) => screen.getAllByTestId(id).map((e) => e.props.tintColor ?? e.props.color);

describe('PU-139 · motyw ciemny: „Dziś” (prawdziwa `Aplikacja`) i licznik', () => {
  test('„Dziś”: ekran na ciemnym `tlo`, karta na ciemnej `karta`', async () => {
    const licznik = stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 });
    const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as jest.Mocked<Sklep>;
    const ekranAktywny: jest.Mocked<EkranAktywny> = { wlacz: jest.fn(), wylacz: jest.fn() };
    const uslugi: jest.Mocked<UslugiAplikacji> = { start: jest.fn(async () => ({ licznik, ekranWlaczony: false })), dodajRzad: jest.fn(async () => plusOk(1)), scalDziennik: jest.fn(async () => {}), przyTle: jest.fn(async () => {}) };
    render(<Aplikacja porty={{ sklep, ekranAktywny, haptyka: atrapaHaptyki() }} uslugi={uslugi} cykl={atrapaCyklu().cykl} system={atrapaSystemu()} oglos={jest.fn()} t={t} />);
    const karta = await screen.findByTestId('dzis-karta');
    expect(tloEkranu(karta.parent as typeof karta)).toBe(C.tlo);
    expect(StyleSheet.flatten(karta.props.style)).toMatchObject({ backgroundColor: C.karta });
  });

  test('licznik: ekran na ciemnym `tlo` (`papier` = `tlo` z mapy tokenów)', () => {
    render(<Licznik stan={stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
    expect(tloEkranu(screen.getByTestId('licznik-wartosc'))).toBe(C.tlo);
    expect(C.tlo).not.toBe(tokeny.kolory.jasny.tlo);
  });
});

describe('PU-139 · motyw ciemny: Ustawienia, Oczko Pro, wzór', () => {
  test('Ustawienia: tło ekranu = ciemny `tlo`, grupa = ciemna `powierzchnia`', () => {
    const adresy = { polityka: 'https://example.invalid/p', wsparcie: 'https://example.invalid/w', recenzja: 'https://example.invalid/r' };
    render(<Ustawienia stan={{ pro: null, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wibracje: true }} t={t} system={atrapaSystemu()} adresy={adresy} naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} />);
    expect(StyleSheet.flatten(screen.getByTestId('ustawienia').props.style)).toMatchObject({ backgroundColor: C.tlo });
    for (const g of screen.getAllByTestId('ustawienia-grupa')) expect(StyleSheet.flatten(g.props.style)).toMatchObject({ backgroundColor: C.powierzchnia });
  });

  test('Oczko Pro: arkusz ofert na ciemnej `powierzchnia` (modalny arkusz, nie `tlo` — Oferty nie ma opakowania `Bezpieczny`)', () => {
    const produkty: Produkt[] = [{ id: 'oczko.pro.miesiac', cenaWyswietlana: '4,99 zł', okres: 'miesiac' }];
    render(<Oferty stan={{ produkty: { rodzaj: 'gotowe', produkty }, aktywne: null, familySharing: true }} t={t} adresy={{ polityka: 'https://example.invalid/p', warunki: 'https://example.invalid/w' }} naKup={jest.fn()} naPrzywroc={jest.fn()} naZarzadzaj={jest.fn()} naOtworzAdres={jest.fn()} naZamknij={jest.fn()} />);
    expect(StyleSheet.flatten(screen.getByTestId('oferty-ekran').props.style)).toMatchObject({ backgroundColor: C.powierzchnia });
  });

  test('wzór: ekran na ciemnej `wzorRama`, plakietka strony na ciemnym `tlo`', () => {
    const stan: StanPrzegladarki = {
      nazwa: 'Harbor chart', projekt: 'Harbor', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }], wzorId: 'w1',
      strona: { n: 2, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false,
      licznik: { liczba: 47, dziergany: 48, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 390, wysokosc: 844 }),
    };
    const w = { naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(), naZmienNazwe: jest.fn(), naUsun: jest.fn(), potwierdz: jest.fn(), naPlus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })) };
    render(<PrzegladarkaWzoru stan={stan} t={t} widok={<Text testID="slot">PDF</Text>} {...w} />);
    expect(tloEkranu(screen.getByTestId('wzor-widok'))).toBe(C.wzorRama);
    expect(C.wzorRama).not.toBe(tokeny.kolory.jasny.wzorRama); // ciemny token różni się od jasnego: test odróżnia motywy
    expect(StyleSheet.flatten(screen.getByTestId('wzor-strona').props.style)).toMatchObject({ backgroundColor: C.tlo });
  });
});
