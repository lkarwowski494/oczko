// M3 p3b, wzór w „Dzianinie” (ekran `wzor` z docs/design/dzianina/ekrany.html; ZM-10, decyzja 8; znaleziska M1 04-001…003 zamknięte w nowym układzie):
// pasek −1 / rząd / +1 (kolejność, kolory z tokenów, liczba w komórkach), granica przy kategoriach dostępności AX1–AX5 (liczba nad przyciskami, ten sam rząd −1 / +1),
// rama strony w barwie motywu (strona zostaje w oryginale), odnośnik limitu z celem ≥ 44 pt. Przed kodem: czerwone na starym pasku (liczba przed przyciskami, kolory papier/linia).
import React from 'react';
import * as RN from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { LicznikWzoru, type BladPaska } from '../../src/ekrany/WzorLicznik';
import { PrzegladarkaWzoru } from '../../src/ekrany/WzorPrzegladarka';
import { PROG_KATEGORII_DOSTEPNOSCI, MAX_SKALA_MINUSA, MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
import { ukladOkna } from '../../src/domena/uklad';
import tokeny from '../../docs/design/dzianina/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: mockSkala }) }));
beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue('light'); }); // jawny motyw jasny: spy z testu ciemnego nie przecieka
afterEach(() => { mockSkala = 1; jest.restoreAllMocks(); });
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const plaski = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;
const pasek = (o: { blad?: BladPaska; obok?: boolean } = {}) => render(
  <LicznikWzoru t={t} licznik={{ liczba: 43, dziergany: 44, znaczenie: 'skonczone' }} obok={o.obok ?? false} blad={o.blad ?? false} naPlus={jest.fn()} naMinus={jest.fn()} naOferty={jest.fn()} />,
);
const kolejnosc = (id: string[]): string[] => {
  const w = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && id.includes(n.props.testID)).map((n) => n.props.testID as string);
  return [...new Set(w)];
};

describe('pasek wzoru: układ Dzianiny, kolejność i kolory', () => {
  test('domyślny rozmiar tekstu: jeden rząd w kolejności −1, rząd (liczba), +1', () => {
    pasek();
    expect(kolejnosc(['licznik-minus', 'wzor-liczba-blok', 'licznik-plus'])).toEqual(['licznik-minus', 'wzor-liczba-blok', 'licznik-plus']);
    expect(plaski('wzor-pasek-licznika').flexDirection).toBe('row');
  });
  test('kolory z tokenów Dzianiny (motyw jasny): tło `pasek`, linia `pasekLinia`, +1 `akcent` z tekstem `naAkcencie`, −1 z obrysem `tekst2`', () => {
    pasek();
    const j = tokeny.kolory.jasny;
    expect(plaski('wzor-pasek-licznika')).toMatchObject({ backgroundColor: j.pasek, borderTopColor: j.pasekLinia });
    expect(plaski('licznik-plus')).toMatchObject({ backgroundColor: j.akcent });
    expect(StyleSheet.flatten(screen.getByText(t('licznik.plus')).props.style)).toMatchObject({ color: j.naAkcencie });
    expect(plaski('licznik-minus')).toMatchObject({ borderColor: j.tekst2 });
  });
  test('kolory z tokenów Dzianiny (motyw ciemny)', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
    pasek();
    const c = tokeny.kolory.ciemny;
    expect(plaski('wzor-pasek-licznika')).toMatchObject({ backgroundColor: c.pasek, borderTopColor: c.pasekLinia });
    expect(plaski('licznik-plus')).toMatchObject({ backgroundColor: c.akcent });
  });
  test('liczba w komórkach stałej szerokości (komponent Liczba, M3-S3-03): cyfry osobno, limit skali z tokenu liczbaPaskaWzoru, jeden element VoiceOver z etykietą liczby', () => {
    pasek();
    const liczba = screen.getByTestId('licznik-wartosc');
    expect(liczba.props.accessibilityLabel).toBe('43');
    expect(screen.getByTestId('licznik-wartosc-cyfra-0').props.maxFontSizeMultiplier).toBe(tokeny.typografia.liczbaPaskaWzoru.maxSkala);
    expect(screen.getByTestId('licznik-wartosc-cyfra-1')).toBeTruthy();
  });
});

describe('pasek wzoru: granica przy AX1–AX5 (04-003)', () => {
  test.each([[PROG_KATEGORII_DOSTEPNOSCI - 0.01, 'row'], [PROG_KATEGORII_DOSTEPNOSCI, 'column'], [2.3, 'column'], [3.571, 'column']])('fontScale %s: pasek w układzie %s', (skala, kierunek) => {
    mockSkala = skala;
    pasek();
    expect(plaski('wzor-pasek-licznika').flexDirection).toBe(kierunek);
  });
  test.each([PROG_KATEGORII_DOSTEPNOSCI, 3.571])('fontScale %s: liczba nad przyciskami, −1 i +1 w jednym rzędzie (−1 przed +1), wysokość minimalna przycisków z tokenów, etykiety z limitem skali ×1,4 i ×1,8', (skala) => {
    mockSkala = skala;
    pasek();
    expect(kolejnosc(['wzor-liczba-blok', 'licznik-minus', 'licznik-plus'])).toEqual(['wzor-liczba-blok', 'licznik-minus', 'licznik-plus']);
    expect(plaski('wzor-pasek-przyciski').flexDirection).toBe('row');
    expect(plaski('licznik-minus').minHeight ?? plaski('licznik-minus').height).toBeGreaterThanOrEqual(tokeny.cele.minimum);
    expect(plaski('licznik-plus').minHeight).toBeGreaterThanOrEqual(tokeny.cele.minimum);
    expect(screen.getByText(t('licznik.minus')).props.maxFontSizeMultiplier).toBe(MAX_SKALA_MINUSA);
    expect(screen.getByText(t('licznik.plus')).props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  });
  test('etykiety VoiceOver przycisków przy AX bez zmian (zachowanie): „−1 row” i „+1 row, when row 44 is done”', () => {
    mockSkala = 3.571;
    pasek();
    expect(screen.getByRole('button', { name: '−1 row' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '+1 row, when row 44 is done' })).toBeTruthy();
  });
  test('kolumna obok wzoru (iPad, telefon poziomo) zostaje kolumną niezależnie od skali', () => {
    pasek({ obok: true });
    expect(screen.getByTestId('wzor-kolumna-licznika')).toBeTruthy();
    expect(screen.queryByTestId('wzor-pasek-licznika')).toBeNull();
  });
});

describe('pasek wzoru: limit i blokada w nowym układzie (04-001)', () => {
  test.each([1, 3.571])('fontScale %s: odnośnik limitu ma wysokość minimalną z tokenów (cele.minimum) i jest nad rzędem przycisków', (skala) => {
    mockSkala = skala;
    pasek({ blad: 'limit' });
    const link = screen.getByTestId('limit-oferta-link');
    expect((StyleSheet.flatten(link.props.style) as { minHeight?: number }).minHeight).toBeGreaterThanOrEqual(tokeny.cele.minimum);
    expect(kolejnosc(['limit-pasek', 'wzor-pasek-przyciski'])).toEqual(['limit-pasek', 'wzor-pasek-przyciski']);
    expect(screen.getByText('Row 44 wasn’t added')).toBeTruthy();
  });
});

describe('ZM-10: rama w barwie motywu, strona w oryginale', () => {
  const widok = <Text testID="slot-widoku">PDF</Text>;
  const przegladarka = () => render(
    <PrzegladarkaWzoru
      stan={{ nazwa: 'Harbor chart', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }], wzorId: 'w1', strona: { n: 2, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false,
        licznik: { liczba: 47, dziergany: 48, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 390, wysokosc: 844 }) }}
      t={t} widok={widok} naWstecz={jest.fn()} naPrzelacz={jest.fn()} naNarzedzie={jest.fn()} naCofnij={jest.fn()} naZaznaczRzad={jest.fn()} naObroc={jest.fn()} naZmienNazwe={jest.fn()} naUsun={jest.fn()}
      potwierdz={jest.fn()} naPlus={jest.fn(async () => ({ ok: true as const, wartosc: undefined }))} naMinus={jest.fn(async () => ({ ok: true as const, wartosc: undefined }))} />,
  );
  test('motyw jasny: tło ekranu i pola wokół strony to `wzorRama` (nie papier ani papierGrupa)', () => {
    const { toJSON } = przegladarka();
    expect(JSON.stringify(toJSON())).toContain(tokeny.kolory.jasny.wzorRama);
    expect(plaski('wzor-widok').backgroundColor).toBe(tokeny.kolory.jasny.wzorRama);
  });
  test('motyw ciemny: rama `wzorRama` ciemnego motywu, bez filtra ani przyciemniania strony (wierność kolorów pliku)', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
    przegladarka();
    expect(plaski('wzor-widok').backgroundColor).toBe(tokeny.kolory.ciemny.wzorRama);
    expect(plaski('wzor-widok').opacity).toBeUndefined();
  });
  test('linia liczby zakreśleń `wzor-zakreslenia` zostaje (kontrakt e2e 26, 27, 47; spec „bez stałej linii” czeka na decyzję — zgłoszenie p3b do 04/07)', () => {
    przegladarka();
    expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('0 highlights');
  });
});
