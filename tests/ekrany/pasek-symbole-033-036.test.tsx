// M1-audytor-generalny-033 (04-studio-projektowe-006) i 036 (04-studio-projektowe-009, DEC-05 a): paski bez glifów Unicode — symbole SF
// z tabeli 04 (design-spec „Aneks M2 partia 3a”), jeden wygląd „wstecz” ze wspólnego komponentu, podpis „Tools” na liście projektów,
// menu ••• licznika w dwóch grupach. Etykiety VoiceOver bez zmian (symbol jest dekoracyjny).
import React from 'react';
import { StyleSheet } from 'react-native';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { render, screen, within } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import { ListaProjektow } from '../../src/ekrany/ListaProjektow';
import { Projekt, type PropsProjektu } from '../../src/ekrany/Projekt';
import { Kosz } from '../../src/ekrany/Kosz';
import { Ukonczenie } from '../../src/ekrany/Ukonczenie';
import { MenuProjektu } from '../../src/ekrany/MenuProjektu';
import { Narzedzia } from '../../src/ekrany/Narzedzia';
import { kolorJasny } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, atrapaSystemu, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const UKRYTE = { includeHiddenElements: true };
const symbol = (id: string) => within(screen.getByTestId(id)).getByTestId(/^symbol-/, UKRYTE).props.name;
const plaski = (s: unknown) => StyleSheet.flatten(s as never) as Record<string, unknown>;

const KATALOG = join(__dirname, '..', '..', 'src', 'ekrany');
const pliki = readdirSync(KATALOG).filter((n) => /\.tsx?$/.test(n)).map((n) => join(KATALOG, n));
const bezKomentarzy = (kod: string) => kod.split('\n').filter((l) => !/^\s*(\/\/|\/?\*)/.test(l)).map((l) => l.replace(/\{\/\*.*?\*\/\}/g, '').replace(/\s\/\/ .*$/, ''));

describe('033: bez glifów Unicode jako ikon', () => {
  test('w src/ekrany żaden element tekstowy ani `tekst` przycisku nie jest glifem ikony (▤ ◷ ⚙ ✂ ⇪ ＋ ✕ ↗ ▭ •••)', () => {
    const glif = /(>\s*(▤|◷|⚙︎?|✂︎?|⇪|＋|✕|↗|▭|•••)\s*<)|(tekst="(▤|◷|⚙︎?|✂︎?|⇪|＋|✕|↗|▭|•••)")/;
    const trafienia = pliki.flatMap((p) => bezKomentarzy(readFileSync(p, 'utf8')).filter((l) => glif.test(l)).map((l) => `${relative(KATALOG, p)}: ${l.trim()}`));
    expect(trafienia).toEqual([]);
  });
  test('„‹” nie występuje w kodzie ekranów — „wstecz” rysuje wyłącznie wspólny komponent (symbol chevron.backward)', () => {
    const trafienia = pliki.flatMap((p) => bezKomentarzy(readFileSync(p, 'utf8')).filter((l) => l.includes('‹')).map((l) => `${relative(KATALOG, p)}: ${l.trim()}`));
    expect(trafienia).toEqual([]);
  });
});

describe('033: symbole SF w paskach', () => {
  test('licznik: wzór = doc.text, historia = clock.arrow.circlepath (inny kształt niż stoper), menu = ellipsis', () => {
    render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naWstecz={jest.fn()} naWzor={jest.fn()} />);
    expect(symbol('licznik-wzor')).toBe('doc.text');
    expect(symbol('licznik-historia')).toBe('clock.arrow.circlepath');
    expect(symbol('licznik-menu')).toBe('ellipsis');
    expect(screen.getByRole('button', { name: t('licznik.akcja_historia') })).toBe(screen.getByTestId('licznik-historia')); // M3 p3a: akcja pod liczbą, podpis „History”
  });
  test('karta ukończenia: „Share” = square.and.arrow.up, etykieta „Share”', () => {
    render(<Ukonczenie stan={{ nazwa: 'Harbor', okres: 'Oct 1 – Oct 21', dni: 21, rzedy: 640, czas: '18 h', czesci: 4, wloczka: [], zdjecie: null }} t={t} oglos={jest.fn()} system={atrapaSystemu()}
      liczby={{ formatuj: String, parsuj: () => null }} naUdostepnij={jest.fn()} naGotowe={jest.fn()} />);
    expect(symbol('karta-udostepnij')).toBe('square.and.arrow.up');
    expect(screen.getByRole('button', { name: 'Share' })).toBe(screen.getByTestId('karta-udostepnij'));
  });
  test('ekran projektu: „+” = plus, ••• = ellipsis', () => {
    const stan: PropsProjektu['stan'] = { nazwa: 'Harbor', notatka: '', miejsceWzoru: null, ostatniaZmiana: 'June 2', czesci: [], postep: { rodzaj: 'brak-celow' } };
    render(<Projekt stan={stan} t={t} naOtworzCzesc={jest.fn()} naWstecz={jest.fn()} naDodajCzesc={jest.fn()} />);
    expect(symbol('projekt-dodaj')).toBe('plus');
    expect(symbol('projekt-menu')).toBe('ellipsis');
  });
});

describe('036 (DEC-05 a): pasek listy projektów — symbole o jednoznacznym kształcie i podpis „Tools”', () => {
  const rysuj = () => render(<ListaProjektow stan={{ wToku: [], ukonczone: [], zapytanie: '', dni: null }} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()}
    naUstawienia={jest.fn()} naHistoria={jest.fn()} naNarzedzia={jest.fn()} />);
  test('Settings = gearshape, History = calendar, Tools = ruler z widocznym podpisem „Tools”, New project = plus', () => {
    rysuj();
    expect(symbol('nav-ustawienia')).toBe('gearshape');
    expect(symbol('nav-historia')).toBe('calendar');
    expect(symbol('nav-narzedzia')).toBe('ruler');
    expect(within(screen.getByTestId('nav-narzedzia')).getByText('Tools')).toBeTruthy();
    expect(symbol('projekty-nowy')).toBe('plus');
  });
  test('etykiety VoiceOver bez zmian', () => {
    rysuj();
    expect(screen.getByRole('button', { name: 'Settings' })).toBe(screen.getByTestId('nav-ustawienia'));
    expect(screen.getByRole('button', { name: 'History' })).toBe(screen.getByTestId('nav-historia'));
    expect(screen.getByRole('button', { name: 'Tools' })).toBe(screen.getByTestId('nav-narzedzia'));
    expect(screen.getByRole('button', { name: 'New project' })).toBe(screen.getByTestId('projekty-nowy'));
  });
});

describe('033: jeden wygląd „wstecz”', () => {
  const tekstWstecz = (id: string) => within(screen.getByTestId(id)).getByText(/^(Back|Projects)$/);
  test('licznik, projekt i kosz („Back”; na liczniku `nav-wstecz` zamiast „Projects”, P-583): symbol chevron.backward i ten sam styl tekstu, bez podkreślenia i bez pogrubienia', () => {
    render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naWstecz={jest.fn()} />);
    expect(symbol('nav-wstecz')).toBe('chevron.backward');
    const licznik = plaski(tekstWstecz('nav-wstecz').props.style);
    screen.unmount();
    render(<Projekt stan={{ nazwa: 'Harbor', notatka: '', miejsceWzoru: null, ostatniaZmiana: 'June 2', czesci: [], postep: { rodzaj: 'brak-celow' } }} t={t} naOtworzCzesc={jest.fn()} naWstecz={jest.fn()} />);
    expect(symbol('nav-wstecz')).toBe('chevron.backward');
    expect(screen.getByRole('button', { name: 'Back' })).toBe(screen.getByTestId('nav-wstecz'));
    const projekt = plaski(tekstWstecz('nav-wstecz').props.style);
    screen.unmount();
    render(<Kosz stan={{ dni: 30, pozycje: [] }} t={t} naPrzywroc={jest.fn()} naWstecz={jest.fn()} />);
    expect(symbol('nav-wstecz')).toBe('chevron.backward');
    const kosz = plaski(tekstWstecz('nav-wstecz').props.style);
    expect(projekt).toEqual(licznik);
    expect(kosz).toEqual(licznik);
    expect(licznik.textDecorationLine).toBeUndefined();
    expect(licznik.fontWeight).toBeUndefined();
  });
});

// M3 p3a (ZM-05, P-581, P-586): grupy •••: korekta (nazwa, numer rzędu, znaczenie, „Reset to 0…” na końcu) i stan (blokada, ukończenie) — bez testID grup (menu-grupa-* nie istnieją);
// cel, przypomnienie i powtórzenie są w arkuszu „Cel”, wzór w akcji pod liczbą. Pełny zestaw: tests/ekrany/menu-licznika-m3.test.tsx.
describe('036 (DEC-05 a → M3 p3a): menu ••• licznika w dwóch grupach (to-be 04, U12)', () => {
  const przodkowie = (id: string) => { const l: unknown[] = []; for (let n = screen.getByTestId(id) as { parent: unknown }; n; n = n.parent as { parent: unknown }) l.unshift(n); return l; };
  const wspolny = (a: string, b: string) => { const x = przodkowie(a), y = przodkowie(b); let i = 0; while (i < x.length && i < y.length && x[i] === y[i]) i++; return i; };
  test('grupa 1: nazwa, numer rzędu, znaczenie; grupa 2: blokada i ukończenie; grupa 3: „Reset to 0…” (009)', () => {
    render(<MenuProjektu stan={{ projekt: 'Harbor', zablokowany: false, wartosc: 3 }} t={t} naNazwa={jest.fn()} naWpisz={jest.fn()} naZablokuj={jest.fn()} naOdblokuj={jest.fn()} naZeruj={jest.fn()} naUkoncz={jest.fn()} naZnaczenie={jest.fn()} naZamknij={jest.fn()} />);
    expect(screen.queryByTestId('menu-grupa-liczenie')).toBeNull();
    expect(screen.queryByTestId('menu-grupa-projekt')).toBeNull();
    // Zastąpione jawnie (009, P-614 (4)): trzy grupy — [nazwa, numer, znaczenie] [blokada, ukończenie] [„Reset to 0…”].
    expect(wspolny('menu-nazwa', 'menu-znaczenie')).toBeGreaterThan(wspolny('menu-nazwa', 'menu-zablokuj'));
    expect(wspolny('menu-wpisz-wartosc', 'menu-znaczenie')).toBe(wspolny('menu-nazwa', 'menu-znaczenie'));
    expect(wspolny('menu-zablokuj', 'menu-ukoncz')).toBeGreaterThan(wspolny('menu-ukoncz', 'menu-zeruj'));
  });
});

// M1-audytor-generalny-146 (04-studio-projektowe-531, opcja a): zdanie spec („żaden ekran nie rysuje ikony glifem Unicode”) było szersze niż wzorzec
// testu 033 — zostały ⊖ (tryb Edit projektu), ▾ (przełącznik wzorów), ▸/▾ (rozwinięcie w historii) i › (wiersze list). Symbole z decyzji 04:
// ⊖ → minus.circle.fill w kolorze `blad`; ▾ → chevron.down; ▸/▾ → chevron.right/chevron.down; › → chevron.forward w `olowek`, ukryty przed VoiceOver.
describe('146: ⊖ ▾ ▸ › nie są glifami ikon', () => {
  /** Wyjątki nazwane (design-spec „Paski i „wstecz””): brak — „›” w tekstach słownika (np. „Oczko › Backup”) to ścieżka w zdaniu, nie ikona, i nie leży w kodzie. */
  const WYJATKI_146: string[] = [];
  test('w src/ekrany i src/kompozycja żadna linia kodu (poza komentarzami) nie zawiera ⊖ ▾ ▸ ›', () => {
    const katalogi = [KATALOG, join(__dirname, '..', '..', 'src', 'kompozycja')];
    const wszystkie = (k: string): string[] => readdirSync(k, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? wszystkie(join(k, d.name)) : /\.tsx?$/.test(d.name) ? [join(k, d.name)] : []);
    const trafienia = katalogi.flatMap(wszystkie).flatMap((p) => bezKomentarzy(readFileSync(p, 'utf8')).filter((l) => /[⊖▾▸›]/u.test(l)).map((l) => `${relative(KATALOG, p)}: ${l.trim()}`));
    expect(trafienia).toEqual(WYJATKI_146);
  });
  test('tryb Edit projektu: usunięcie części = minus.circle.fill w kolorze `blad`, etykieta VoiceOver bez zmian', () => {
    const stan: PropsProjektu['stan'] = { nazwa: 'Harbor', notatka: '', miejsceWzoru: null, ostatniaZmiana: 'June 2', postep: { rodzaj: 'brak-celow' },
      czesci: [{ id: 'c1', nazwa: 'Back', rzedy: 3, cel: null, paraZ: null }, { id: 'c2', nazwa: 'Front', rzedy: 0, cel: null, paraZ: null }] };
    render(<Projekt stan={stan} t={t} naOtworzCzesc={jest.fn()} naWstecz={jest.fn()} edycja naUsunCzesc={jest.fn()} />);
    const pierwszy = screen.getAllByTestId('projekt-usun-czesc')[0];
    const s = within(pierwszy).getByTestId(/^symbol-/, UKRYTE);
    expect(s.props.name).toBe('minus.circle.fill');
    expect(s.props.tintColor).toBe(kolorJasny.blad);
    expect(pierwszy.props.accessibilityLabel).toBe(t('usun.a11y', { nazwa: 'Back' }));
  });
  test('wiersz grupy w Tools: wskaźnik przejścia = chevron.forward w `olowek`, ukryty przed VoiceOver', () => {
    render(<Narzedzia stan={{ wloczki: 7, druty: 9 }} t={t} naWloczki={jest.fn()} naDruty={jest.fn()} naProbke={jest.fn()} />);
    const s = within(screen.getByTestId('narzedzia-wloczki')).getByTestId('symbol-chevron.forward', UKRYTE); // M3 p4b: wiersz ma też kafelek ikony (inny symbol)
    expect(s.props.name).toBe('chevron.forward');
    expect(s.props.tintColor).toBe(kolorJasny.olowek);
    expect(s.props.accessibilityElementsHidden).toBe(true);
  });
});
