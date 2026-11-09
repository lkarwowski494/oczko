// M3 fix E5, 014 (P-614 (7)): drobne odstępstwa od makiet — promień „−1” `promienie.minus` (18), ikona kafla „Dziś” `promienie.ikonaKafla` (12),
// linia zakreśleń wzoru w roli `mala`, „Ukończony {data}” pod tytułem projektu (`projekty.ukonczono_bez_czasu`), miniatura zdjęcia z `projekt.zdjecie.miniatura`,
// „Zamknij” notatek wzoru w prawym górnym rogu (słownik).
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import { Projekt, type PropsProjektu } from '../../src/ekrany/Projekt';
import { GrupaZdjec } from '../../src/ekrany/Zdjecia';
import { ArkuszNotatekWzoru } from '../../src/ekrany/WzorNotatki';
import { ukladOkna } from '../../src/domena/uklad';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const plasko = (s: unknown) => (RN.StyleSheet.flatten(s as never) ?? {}) as Record<string, unknown>;

test('014: „−1” licznika ma promień promienie.minus', () => {
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', skonczone: 2, dziergany: 3 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(plasko(screen.getByTestId('licznik-minus').props.style).borderRadius).toBe(tokeny.promienie.minus);
});

test('014: ikony kafli „Dziś” mają promień promienie.ikonaKafla', () => {
  const dane: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: null, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
  render(<Dzis stan={stanLicznika({ projekt: 'Harbor', skonczone: 42, dziergany: 43 })} dane={dane} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(43))} naCofnijSerie={jest.fn()} naOferty={jest.fn()}
    naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} />);
  const tloIkony = tokeny.kolory.jasny.ikonaTlo;
  const ikony = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && plasko(n.props.style).backgroundColor === tloIkony);
  expect(ikony.length).toBeGreaterThan(0);
  for (const i of ikony) expect(plasko(i.props.style).borderRadius).toBe(tokeny.promienie.ikonaKafla);
});

test('014: linia zakreśleń wzoru w roli `mala`', () => {
  const stan: StanPrzegladarki = { nazwa: 'Harbor chart', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }], wzorId: 'w1',
    strona: { n: 2, razem: 6 }, zakreslenia: 3, narzedzie: 'brak', word: false, licznik: { liczba: 47, dziergany: 48, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 390, wysokosc: 844 }) };
  render(<PrzegladarkaWzoru stan={stan} t={t} widok={<RN.Text>PDF</RN.Text>} naWstecz={jest.fn()} naPrzelacz={jest.fn()} naNarzedzie={jest.fn()} naCofnij={jest.fn()} naZaznaczRzad={jest.fn()} naObroc={jest.fn()}
    naZmienNazwe={jest.fn()} naUsun={jest.fn()} naNotatka={jest.fn()} potwierdz={jest.fn()} naPlus={jest.fn(async () => ({ ok: true as const, wartosc: undefined }))} naMinus={jest.fn(async () => ({ ok: true as const, wartosc: undefined }))} />);
  expect(plasko(screen.getByTestId('wzor-zakreslenia').props.style).fontSize).toBe(tokeny.typografia.mala.pt);
});

test('014: projekt ukończony — „Finished {data}” pod tytułem (projekty.ukonczono_bez_czasu)', () => {
  const s: PropsProjektu['stan'] = { nazwa: 'Harbor Sweater', notatka: null, miejsceWzoru: null, ostatniaZmiana: 'Nov 1', postep: { rodzaj: 'procent', wartosc: 100 }, termin: null, czesci: [],
    szczegoly: { narzedzie: null, rozmiar: null, termin: null }, czas: { suma: '5h 20m', sesje: 7, doSprawdzenia: 0 }, ukonczony: true,
    daty: { start: 'Oct 1, 2026', koniec: 'Nov 5, 2026', startDzien: '2026-10-01', koniecDzien: '2026-11-05', dzis: '2026-11-09' } };
  const w = { naOtworzCzesc: jest.fn(), naOtworzLicznik: jest.fn(), naDodajCzesc: jest.fn(), naDodajLicznik: jest.fn(), naNotatka: jest.fn(), naNarzedzie: jest.fn(), naTermin: jest.fn(),
    naEdytuj: jest.fn(), naKoniecEdycji: jest.fn(), naZrobTakaSama: jest.fn(), naUsunProjekt: jest.fn(), naUsunCzesc: jest.fn(), naUsunLicznik: jest.fn(), naWstecz: jest.fn(), naSesje: jest.fn(), naProbka: jest.fn(), naWloczka: jest.fn() };
  render(<Projekt stan={s} t={t} {...w} />);
  const naglowki = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'header');
  const tytul = naglowki.find((n) => n.props.children === 'Harbor Sweater');
  expect(tytul).toBeTruthy();
  const teksty = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && (n.props.children === 'Harbor Sweater' || n.props.children === 'Finished Nov 5, 2026'));
  expect(teksty.map((n) => n.props.children)).toEqual(['Harbor Sweater', 'Finished Nov 5, 2026']);
});

// Wartość stałej (88) = token, więc ten test jest zielony przed i po: zmiana dotyczy źródła liczby (token zamiast stałej w pliku), nie zachowania.
test('014: miniatura zdjęcia ma bok projekt.zdjecie.miniatura', () => {
  render(<GrupaZdjec t={t} miniatury={[{ id: 'a', uri: 'file:///a.jpg' }]} naWybierz={jest.fn()} naOtworz={jest.fn()} />);
  const m = plasko(screen.UNSAFE_getByType(RN.Image).props.style);
  expect(m.width).toBe(tokeny.projekt.zdjecie.miniatura);
});

test('014: „Close” notatek wzoru w prawym górnym rogu (po tytule w nagłówku)', () => {
  render(<ArkuszNotatekWzoru t={t} chipy={[{ rzad: 40, rzadWzoru: 12, strona: 2, y: 0.4, wysokosc: 0.02, notatki: [{ id: 'n1', rzad: 40, tekst: 'Switch to 4 mm' }, { id: 'n2', rzad: 40, tekst: 'Decrease' }] }]} otwartyChip={40}
    naChip={jest.fn()} naZmienNotatke={async () => true} naUsunNotatke={async () => true} potwierdz={jest.fn()} naBlad={jest.fn()} />);
  const ids = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && (n.props.testID === 'wzor-notatka-zamknij' || n.props.accessibilityRole === 'header')).map((n) => n.props.testID ?? 'naglowek');
  expect(ids.indexOf('naglowek')).toBeGreaterThanOrEqual(0);
  expect(ids.indexOf('wzor-notatka-zamknij')).toBeGreaterThan(ids.indexOf('naglowek'));
});
