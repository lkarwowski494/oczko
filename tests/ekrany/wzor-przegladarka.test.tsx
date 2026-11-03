// Przeglądarka wzoru (design-spec „Wzór, rysik i iPad”; P-220 W1a, W3, W4b, W5a, W9b; P-218 (3); BR-WZR-005, BR-WZR-008; testID z e2e/README.md
// i scenariuszy 44–47, 52). Widok strony PDF to moduł natywny `oczko-wzor` — tu slot (`widok`), więc ekran jest testowalny bez urządzenia.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as RN from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { RYSIK_PODPOWIEDZ_MS } from '../../src/konfiguracja';
import { ukladOkna } from '../../src/domena/uklad';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { tEn } from './pomoc';

afterEach(() => jest.restoreAllMocks());

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const stan = (z: Partial<StanPrzegladarki> = {}): StanPrzegladarki => ({
  nazwa: 'Harbor chart', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }], wzorId: 'w1',
  strona: { n: 2, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false,
  licznik: { liczba: 47, dziergany: 48, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 390, wysokosc: 844 }), ...z,
});
function wywolania() {
  return {
    naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(),
    naZmienNazwe: jest.fn(), naUsun: jest.fn(), potwierdz: jest.fn((_t: string, _o: string, _p: string, f: () => void) => f()),
    naPlus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })),
  };
}
const widok = <Text testID="slot-widoku">PDF</Text>;

test('iPhone pionowo (W1a): wzór, plakietka strony, opis źródła i pasek licznika z tymi samymi id co licznik', () => {
  const w = wywolania();
  render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} />);
  expect(screen.getByTestId('wzor-widok')).toBeTruthy();
  expect(screen.getByTestId('slot-widoku')).toBeTruthy();
  expect(screen.getByTestId('wzor-strona').props.children).toBe('Page 2 of 6');
  expect(screen.getByTestId('wzor-zrodlo').props.children).toBe('PDF · 6 pages');
  expect(screen.getByTestId('licznik-wartosc').props.children).toBe('47');
  expect(screen.getByTestId('licznik-teraz-rzad').props.children).toBe('Now working row 48');
  fireEvent.press(screen.getByTestId('licznik-plus'));
  fireEvent.press(screen.getByTestId('licznik-minus'));
  expect([w.naPlus.mock.calls.length, w.naMinus.mock.calls.length]).toEqual([1, 1]);
  fireEvent.press(screen.getByTestId('nav-wstecz'));
  expect(w.naWstecz).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Back to Back' })).toBeTruthy();
});

// P2-5 (Aneks P2 poz. 8, F-09 design-spec.md:905): tryb „rząd w trakcie” — liczba jest rzędem, więc pasek pod wzorem i kolumna obok (iPad/poziomo)
// nie pokazują linii „Now working row n”; tryb „skończone” ją zachowuje.
describe('P2-5 / F-09 / BR-LIC-012: linia „Now working row n” w liczniku przeglądarki wzoru', () => {
  const wTrakcie = { liczba: 48, dziergany: 48, znaczenie: 'w_trakcie' as const };
  test.each([
    ['pasek pod wzorem (iPhone pionowo)', ukladOkna({ szerokosc: 390, wysokosc: 844 }), 'wzor-pasek-licznika'],
    ['kolumna obok (iPad poziomo)', ukladOkna({ szerokosc: 1180, wysokosc: 820 }), 'wzor-kolumna-licznika'],
  ])('%s: „rząd w trakcie” bez linii, liczba i przyciski zostają', (_nazwa, uklad, kontener) => {
    render(<PrzegladarkaWzoru stan={stan({ licznik: wTrakcie, uklad })} t={t} widok={widok} {...wywolania()} />);
    expect(screen.getByTestId(kontener)).toBeTruthy();
    expect(screen.queryByTestId('licznik-teraz-rzad')).toBeNull();
    expect(screen.queryByText(/Now working row/)).toBeNull();
    expect(screen.getByTestId('licznik-wartosc').props.children).toBe('48');
    expect(screen.getByTestId('licznik-plus')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^\+1 row/ })).toBeTruthy();
  });
  // P2-5b (P-373, wariant B; F-09 design-spec.md:905): w trybie „rząd w trakcie” (bez celu) pod liczbą stoi podpis `licznik.jednostka_w_trakcie`
  // „current row”, jak na ekranie licznika (Licznik.tsx:100) — VoiceOver czyta „48, current row”.
  test.each([
    ['pasek pod wzorem', ukladOkna({ szerokosc: 390, wysokosc: 844 }), 'wzor-pasek-licznika'],
    ['kolumna obok', ukladOkna({ szerokosc: 1180, wysokosc: 820 }), 'wzor-kolumna-licznika'],
  ])('P2-5b %s: „rząd w trakcie” podpisuje liczbę „current row”, w bloku liczby', (_nazwa, uklad, kontener) => {
    render(<PrzegladarkaWzoru stan={stan({ licznik: wTrakcie, uklad })} t={t} widok={widok} {...wywolania()} />);
    const podpis = screen.getByTestId('licznik-podpis');
    expect(podpis.props.children).toBe('current row');
    expect(screen.getByTestId('wzor-liczba-blok')).toContainElement(podpis);
    expect(screen.getByTestId(kontener)).toContainElement(podpis);
    expect(screen.queryByText(/Now working row/)).toBeNull();
  });
  test('P2-5b: tryb „skończone” nie dostaje podpisu „current row”', () => {
    render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...wywolania()} />);
    expect(screen.queryByTestId('licznik-podpis')).toBeNull();
    expect(screen.queryByText('current row')).toBeNull();
  });
  test('tryb „skończone” zachowuje linię „Now working row n”', () => {
    render(<PrzegladarkaWzoru stan={stan({ licznik: { liczba: 47, dziergany: 48, znaczenie: 'skonczone' } })} t={t} widok={widok} {...wywolania()} />);
    expect(screen.getByTestId('licznik-teraz-rzad').props.children).toBe('Now working row 48');
  });
});

test('układ „obok” (telefon poziomo W3, iPad poziomo W4b): kolumna licznika o szerokości z ukladOkna, wzór nadal widoczny', () => {
  render(<PrzegladarkaWzoru stan={stan({ uklad: ukladOkna({ szerokosc: 1180, wysokosc: 820 }) })} t={t} widok={widok} {...wywolania()} />);
  const kolumna = screen.getByTestId('wzor-kolumna-licznika');
  expect(kolumna.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: 340 })]));
  expect(screen.getByTestId('wzor-widok')).toBeTruthy();
});

test('P-262 (b), design-spec W3: w kolumnie liczba 64 pt, blok liczby się nie kurczy; kurczy się tylko +1 (jawna podstawa 0 — przebieg 119: blok 0 pt)', () => {
  render(<PrzegladarkaWzoru stan={stan({ uklad: ukladOkna({ szerokosc: 874, wysokosc: 402 }) })} t={t} widok={widok} {...wywolania()} />);
  const plaski = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style);
  expect(plaski('licznik-wartosc')).toMatchObject({ fontSize: 64, lineHeight: 64 });
  expect(plaski('licznik-wartosc').flexShrink ?? 0).toBe(0);
  expect(plaski('wzor-liczba-blok')).toMatchObject({ flexShrink: 0 });
  expect(plaski('licznik-plus')).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0 });
});

test('pasek licznika (pionowo) bez zmian: liczba 40 pt (W1a)', () => {
  render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...wywolania()} />);
  expect(StyleSheet.flatten(screen.getByTestId('licznik-wartosc').props.style)).toMatchObject({ fontSize: 40 });
});

test('iPhone: zakreślacz włącza tryb (selected), pasek narzędzi: gumka, cofnij, Done; liczba zakreśleń jako tekst (scenariusz 47)', () => {
  const w = wywolania();
  const r = render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} />);
  expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('0 highlights');
  expect(screen.getByTestId('wzor-zakreslacz').props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
  fireEvent.press(screen.getByTestId('wzor-zakreslacz'));
  expect(w.naNarzedzie).toHaveBeenLastCalledWith('zakreslacz');
  r.rerender(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz', zakreslenia: 1 })} t={t} widok={widok} {...w} />);
  expect(screen.getByTestId('wzor-zakreslacz').props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
  expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('1 highlight');
  fireEvent.press(screen.getByTestId('wzor-gumka'));
  expect(w.naNarzedzie).toHaveBeenLastCalledWith('gumka');
  fireEvent.press(screen.getByTestId('wzor-cofnij-rysunek'));
  expect(w.naCofnij).toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(w.naNarzedzie).toHaveBeenLastCalledWith('brak');
  expect(screen.queryByTestId('wzor-pioro')).toBeNull(); // pióro tylko na iPadzie
});

// P2-9 (Aneks P2 poz. 3, pozycja 10 C): wybrane narzędzie w pasku compact — kształt niesie stan: obrys 2 pt `przyciskObrys`, promień 10 (`promien.pole`),
// tło `papierGrupa`, obszar dotyku 44 × 44 pt; VoiceOver: przycisk „Highlighter”, stan selected. Niewybrane: bez obrysu i bez tła.
describe('P2-9 / 10 C: stan wybrany zakreślacza w pasku', () => {
  const compact = ukladOkna({ szerokosc: 390, wysokosc: 844 });
  test.each([['jasny', 'light', tokeny.kolor.jasny], ['ciemny', 'dark', tokeny.kolor.ciemny]] as const)('motyw %s: wybrany Highlighter ma obrys, promień 10, tło papierGrupa, styl minWidth/minHeight 44 (deklaracja stylu)', (_n, schemat, k) => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
    render(<PrzegladarkaWzoru stan={stan({ uklad: compact, narzedzie: 'zakreslacz' })} t={t} widok={widok} {...wywolania()} />);
    const plaski = StyleSheet.flatten(screen.getByTestId('wzor-zakreslacz').props.style);
    expect(plaski).toMatchObject({ borderWidth: 2, borderColor: k.przyciskObrys, borderRadius: tokeny.promien.pole, backgroundColor: k.papierGrupa, minWidth: 44, minHeight: 44 });
    expect(screen.getByRole('button', { name: 'Highlighter', selected: true })).toBe(screen.getByTestId('wzor-zakreslacz'));
  });
  test('niewybrany Highlighter: bez obrysu i bez tła (stan nie jest kolorem)', () => {
    render(<PrzegladarkaWzoru stan={stan({ uklad: compact })} t={t} widok={widok} {...wywolania()} />);
    const plaski = StyleSheet.flatten(screen.getByTestId('wzor-zakreslacz').props.style);
    expect(plaski.borderWidth ?? 0).toBe(0);
    expect(plaski.backgroundColor).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Highlighter', selected: false })).toBeTruthy();
  });
  test('iPad regular: wybrany Pen ma ten sam stan co Highlighter (jak poz. 10 C)', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
    render(<PrzegladarkaWzoru stan={stan({ uklad: ukladOkna({ szerokosc: 820, wysokosc: 1180 }), narzedzie: 'pioro' })} t={t} widok={widok} {...wywolania()} />);
    expect(StyleSheet.flatten(screen.getByTestId('wzor-pioro').props.style)).toMatchObject({ borderWidth: 2, borderRadius: tokeny.promien.pole, backgroundColor: tokeny.kolor.jasny.papierGrupa });
  });
});

test('iPad (regular): stały pasek z piórem; zaznaczenie pióra', () => {
  const w = wywolania();
  render(<PrzegladarkaWzoru stan={stan({ uklad: ukladOkna({ szerokosc: 820, wysokosc: 1180 }) })} t={t} widok={widok} {...w} />);
  fireEvent.press(screen.getByTestId('wzor-pioro'));
  expect(w.naNarzedzie).toHaveBeenLastCalledWith('pioro');
  expect(screen.getByTestId('wzor-gumka')).toBeTruthy();
});

test('07-jakosc-026 (F-28): iPad — stuknięcie wybranego narzędzia je odznacza (palec znów tylko przewija), inne narzędzie przełącza', () => {
  const w = wywolania();
  render(<PrzegladarkaWzoru stan={stan({ uklad: ukladOkna({ szerokosc: 820, wysokosc: 1180 }), narzedzie: 'pioro' })} t={t} widok={widok} {...w} />);
  fireEvent.press(screen.getByTestId('wzor-pioro'));
  expect(w.naNarzedzie).toHaveBeenLastCalledWith('brak');
  fireEvent.press(screen.getByTestId('wzor-gumka'));
  expect(w.naNarzedzie).toHaveBeenLastCalledWith('gumka');
});

test('W9b, P-218 (3): przy ≥ 2 wzorach tytuł przełącza (menu z ✓ przy bieżącym); jeden wzór → bez przełącznika', () => {
  const w = wywolania();
  const r = render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} />);
  expect(screen.queryByTestId('wzor-przelacz')).toBeNull();
  r.rerender(<PrzegladarkaWzoru stan={stan({ wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }, { wzorId: 'w2', nazwa: 'Edging' }] })} t={t} widok={widok} {...w} />);
  fireEvent.press(screen.getByRole('button', { name: 'Pattern: Harbor chart. Switch pattern' }));
  expect(screen.getByRole('menuitem', { name: 'Harbor chart', selected: true })).toBeTruthy();
  fireEvent.press(screen.getByRole('menuitem', { name: 'Edging' }));
  expect(w.naPrzelacz).toHaveBeenCalledWith('w2');
});

// M1-audytor-generalny-175 (04-studio-projektowe-560, SP-06): przełącznik wzorów w tytule paska ma cel dotyku cel.minimum w pionie, także przy nazwie
// w jednym wierszu (tytuł 20/24 pt nie rozciąga Pressable); przełącznik jest na liście ręcznego przejścia TT-16 (docs/jakosc/strategia.md §8).
test('M1-175: przełącznik wzorów ma styl minHeight = cel.minimum (deklaracja stylu); wzor-przelacz na liście TT-16', () => {
  const dwa = [{ wzorId: 'w1', nazwa: 'Harbor chart' }, { wzorId: 'w2', nazwa: 'Edging' }];
  render(<PrzegladarkaWzoru stan={stan({ wzory: dwa })} t={t} widok={widok} {...wywolania()} />);
  const plaski = StyleSheet.flatten(screen.getByTestId('wzor-przelacz').props.style);
  expect(plaski?.minHeight).toBe(tokeny.cel.minimum);
  expect(plaski?.justifyContent).toBe('center');
  const strategia = readFileSync(join(__dirname, '../../docs/jakosc/strategia.md'), 'utf8');
  const tt16 = strategia.split('\n').find((l) => l.startsWith('| TT-16 |')) ?? '';
  expect(tt16).toContain('`wzor-przelacz`');
});

// Aneks partii 8, poz. 12 (wariant C, P-353 (d), P-360/P-361; design-spec.md:936, makieta `aneks8.html` `wzor-przelacznik-czeka`): wiersz „czeka na sieć” w liście
// wzorów ▾ z ✕ (`wzor.czeka_siec`, `wzor.usun_oczekujacy_a11y`); ▾ jest też przy jednym wzorze, gdy coś czeka.
test('poz. 12 C: jeden wzór i strona czekająca na sieć → ▾ jest, lista pokazuje wiersz „Waiting for the internet…” z ✕, ✕ usuwa oczekującego', () => {
  const w = { ...wywolania(), naUsunOczekujacy: jest.fn() };
  render(<PrzegladarkaWzoru stan={stan({ oczekujace: [{ id: 'z1', nazwa: 'Web page' }] })} t={t} widok={widok} {...w} />);
  fireEvent.press(screen.getByRole('button', { name: 'Pattern: Harbor chart. Switch pattern' }));
  expect(screen.getByText('Waiting for the internet to save the web page.')).toBeTruthy();
  expect(screen.getByText('Web page')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Remove Web page from the list' }));
  expect(w.naUsunOczekujacy).toHaveBeenCalledWith('z1');
});
test('poz. 12 C: wiersz oczekującego jest obok wzorów (≥ 2), nie przełącza i nie jest zaznaczony; bez oczekujących lista bez wiersza', () => {
  const w = { ...wywolania(), naUsunOczekujacy: jest.fn() };
  const dwa = [{ wzorId: 'w1', nazwa: 'Harbor chart' }, { wzorId: 'w2', nazwa: 'Edging' }];
  const r = render(<PrzegladarkaWzoru stan={stan({ wzory: dwa, oczekujace: [{ id: 'z1', nazwa: 'Web page' }] })} t={t} widok={widok} {...w} />);
  fireEvent.press(screen.getByTestId('wzor-przelacz'));
  expect(screen.getByRole('menuitem', { name: 'Harbor chart', selected: true })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'Edging' })).toBeTruthy();
  fireEvent.press(screen.getByText('Waiting for the internet to save the web page.'));
  expect(w.naPrzelacz).not.toHaveBeenCalled();
  r.rerender(<PrzegladarkaWzoru stan={stan({ wzory: dwa, oczekujace: [] })} t={t} widok={widok} {...w} />);
  expect(screen.queryByText('Waiting for the internet to save the web page.')).toBeNull();
});
test('M1-146: przełącznik wzorów w tytule paska ma symbol chevron.down zamiast glifu ▾; tytuł bez glifu, etykieta VoiceOver bez zmian', () => {
  render(<PrzegladarkaWzoru stan={stan({ wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }, { wzorId: 'w2', nazwa: 'Edging' }] })} t={t} widok={widok} {...wywolania()} />);
  const przelacz = screen.getByTestId('wzor-przelacz');
  expect(within(przelacz).getByTestId(/^symbol-/, { includeHiddenElements: true }).props.name).toBe('chevron.down');
  expect(within(przelacz).getByText('Harbor chart')).toBeTruthy();
  expect(przelacz.props.accessibilityLabel).toBe('Pattern: Harbor chart. Switch pattern');
});
test('poz. 12 C (strażnik): bez oczekujących jeden wzór nie ma ▾, jak dotąd', () => {
  render(<PrzegladarkaWzoru stan={stan({ oczekujace: [] })} t={t} widok={widok} {...wywolania()} />);
  expect(screen.queryByTestId('wzor-przelacz')).toBeNull();
});

test('menu •••: obrót strony, usunięcie do kosza po potwierdzeniu (P-229, P-275: tekst 04 wzor.usun_opis z terminem)', () => {
  const w = wywolania();
  render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} terminKosza="Nov 25" />);
  fireEvent.press(screen.getByTestId('wzor-menu'));
  fireEvent.press(screen.getByTestId('wzor-obroc'));
  expect(w.naObroc).toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('wzor-menu'));
  fireEvent.press(screen.getByTestId('wzor-usun'));
  expect(w.potwierdz).toHaveBeenCalledWith('Delete “Harbor chart”?', 'You can restore it with its highlights and drawings from Recently deleted on the Projects list until Nov 25. Row notes and counters stay.', 'Delete pattern', expect.any(Function));
  expect(w.naUsun).toHaveBeenCalled();
});

test('Word w podglądzie zastępczym: linia informacji, bez „Mark row” i zakreślacza (design-spec W11)', () => {
  render(<PrzegladarkaWzoru stan={stan({ word: true })} t={t} widok={widok} {...wywolania()} />);
  expect(screen.getByText(/Word documents open as they are/)).toBeTruthy();
  expect(screen.queryByTestId('wzor-zakreslacz')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Mark row' })).toBeNull();
});

test('P-126 (3a): pierwszy znacznik we wzorze pyta o kierunek (bez wartości domyślnej); „Up” → kierunek −1; znany kierunek → bez pytania', () => {
  const w = wywolania();
  const r = render(<PrzegladarkaWzoru stan={stan({ kierunek: null })} t={t} widok={widok} {...w} />);
  fireEvent.press(screen.getByRole('button', { name: 'Mark row' }));
  expect(w.naZaznaczRzad).not.toHaveBeenCalled();
  expect(screen.getByText('Which way do rows go on this page?')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Up, like a chart' }));
  expect(w.naZaznaczRzad).toHaveBeenLastCalledWith(-1);
  r.rerender(<PrzegladarkaWzoru stan={stan({ kierunek: 1 })} t={t} widok={widok} {...w} />);
  fireEvent.press(screen.getByRole('button', { name: 'Mark row' }));
  expect(w.naZaznaczRzad).toHaveBeenLastCalledWith(1);
});

describe('notatka wzoru (design-spec „Notatka wzoru bez znacznika”, P-124 Q6a)', () => {
  test('bez znacznika: „Add note” pokazuje pasek z „Mark row” i „Cancel” (bez błędu); „Mark row” → pytanie o kierunek → po wyborze arkusz notatki', () => {
    const w = { ...wywolania(), naNotatka: jest.fn() };
    render(<PrzegladarkaWzoru stan={stan({ kierunek: null })} t={t} widok={widok} {...w} />);
    fireEvent.press(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByText('A note sits next to a row.')).toBeTruthy();
    expect(screen.getByText('Mark the row on the pattern first, then write the note.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('wzor-notatka-zaznacz'));
    fireEvent.press(screen.getByRole('button', { name: 'Down, like written steps' }));
    expect(w.naZaznaczRzad).toHaveBeenLastCalledWith(1);
    fireEvent.changeText(screen.getByTestId('wzor-notatka-pole'), 'decrease every 4 rows');
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(w.naNotatka).toHaveBeenCalledWith('decrease every 4 rows');
  });
  test('ze znacznikiem: „Add note” otwiera arkusz od razu; „Cancel” na pasku bez znacznika nic nie zmienia', () => {
    const w = { ...wywolania(), naNotatka: jest.fn() };
    const r = render(<PrzegladarkaWzoru stan={stan({ kierunek: -1 })} t={t} widok={widok} {...w} />);
    fireEvent.press(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByTestId('wzor-notatka-pole')).toBeTruthy();
    r.rerender(<PrzegladarkaWzoru stan={stan({ kierunek: null })} t={t} widok={widok} {...w} />);
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.press(screen.getByRole('button', { name: 'Add note' }));
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('A note sits next to a row.')).toBeNull();
    expect(w.naZaznaczRzad).not.toHaveBeenCalled();
  });
});

test('menu ••• (design-spec W1a): „Rename” między obrotem a usunięciem → naZmienNazwe', () => {
  const w = wywolania();
  render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} />);
  fireEvent.press(screen.getByTestId('wzor-menu'));
  expect(screen.getAllByRole('menuitem').map((x) => x.props.accessibilityLabel)).toEqual(['Rotate page', 'Rename', 'Delete pattern…']);
  fireEvent.press(screen.getByTestId('wzor-zmien-nazwe'));
  expect(w.naZmienNazwe).toHaveBeenCalledTimes(1);
});

test('VoiceOver Magic Tap = +1 na ekranie wzoru (design-spec W1a :668, jak licznik :88)', async () => {
  const w = wywolania();
  const { toJSON } = render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} />);
  const korzen = toJSON() as { props: { onMagicTap?: () => void } };
  expect(typeof korzen.props.onMagicTap).toBe('function');
  korzen.props.onMagicTap?.();
  await new Promise((r) => setTimeout(r, 0));
  expect(w.naPlus).toHaveBeenCalledTimes(1);
});

// P-284 (1) A (design-spec W5a :676): po pierwszym rysiku podpowiedź `wzor.rysik_podpowiedz` (role=status) raz na otwarcie wzoru, znika po RYSIK_PODPOWIEDZ_MS.
test('podpowiedź rysika: pojawia się po pierwszym rysiku, znika po czasie i nie wraca w tym otwarciu', () => {
  jest.useFakeTimers();
  const w = wywolania();
  const r = render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} tylkoRysik={false} />);
  expect(screen.queryByText('The pencil writes. Your finger scrolls.')).toBeNull();
  r.rerender(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} tylkoRysik />);
  expect(screen.getByRole('status')).toBeTruthy();
  expect(screen.getByText('The pencil writes. Your finger scrolls.')).toBeTruthy();
  act(() => { jest.advanceTimersByTime(RYSIK_PODPOWIEDZ_MS); });
  expect(screen.queryByText('The pencil writes. Your finger scrolls.')).toBeNull();
  r.rerender(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w} tylkoRysik />);
  expect(screen.queryByText('The pencil writes. Your finger scrolls.')).toBeNull();
  jest.useRealTimers();
});
