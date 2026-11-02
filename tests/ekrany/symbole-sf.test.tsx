// P2-3 (Aneks P2 poz. 2 i N1, design-spec „Symbole SF”; P-374): glify ⏱ ⏸ 🖍 ✎ ⌫ ↶ zastąpione symbolami SF o nazwach ze spec; etykiety VoiceOver bez zmian.
import React from 'react';
import { Text } from 'react-native';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react-native';
import { ukladOkna } from '../../src/domena/uklad';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import { Stoper } from '../../src/ekrany/Stoper';
import { ROZMIAR_SYMBOLU, ROZMIAR_SYMBOLU_KAPSULY } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
afterEach(() => { jest.restoreAllMocks(); mockSkala = 1; });
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const stan = (z: Partial<StanPrzegladarki> = {}): StanPrzegladarki => ({
  nazwa: 'Harbor chart', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Harbor chart' }], wzorId: 'w1',
  strona: { n: 2, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false,
  licznik: { liczba: 47, dziergany: 48, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 390, wysokosc: 844 }), ...z,
});
const w = () => ({
  naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(),
  naZmienNazwe: jest.fn(), naUsun: jest.fn(), naNotatka: jest.fn(), potwierdz: jest.fn((_t: string, _o: string, _p: string, f: () => void) => f()),
  naPlus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })),
});
const widok = <Text>PDF</Text>;
// Symbol jest ukryty przed czytnikiem (dekoracyjny), więc RNTL szuka go z includeHiddenElements.
const UKRYTE = { includeHiddenElements: true };
const symbol = (przycisk: ReturnType<typeof screen.getByTestId>) => within(przycisk).getByTestId(/^symbol-/, UKRYTE).props.name;

describe('przeglądarka wzoru: symbole SF w pasku', () => {
  test('iPhone, pasek nawigacji: „Add note” = note.text.badge.plus, zakreślacz = highlighter', () => {
    render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...w()} />);
    expect(symbol(screen.getByRole('button', { name: t('wzor.dodaj_notatke') }))).toBe('note.text.badge.plus');
    expect(symbol(screen.getByTestId('wzor-zakreslacz'))).toBe('highlighter');
  });
  test('iPhone, tryb rysowania: zakreślacz = highlighter, gumka = eraser, cofnij = arrow.uturn.backward', () => {
    render(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz' })} t={t} widok={widok} {...w()} />);
    expect(symbol(screen.getByTestId('wzor-zakreslacz'))).toBe('highlighter');
    expect(symbol(screen.getByTestId('wzor-gumka'))).toBe('eraser');
    expect(symbol(screen.getByTestId('wzor-cofnij-rysunek'))).toBe('arrow.uturn.backward');
  });
  test('iPad regular: pasek narzędzi — highlighter, Pen = pencil.tip, eraser, cofnij; „Add note” inny symbol niż Pen', () => {
    render(<PrzegladarkaWzoru stan={stan({ uklad: ukladOkna({ szerokosc: 1180, wysokosc: 820 }) })} t={t} widok={widok} {...w()} />);
    expect(symbol(screen.getByTestId('wzor-zakreslacz'))).toBe('highlighter');
    expect(symbol(screen.getByTestId('wzor-pioro'))).toBe('pencil.tip');
    expect(symbol(screen.getByTestId('wzor-gumka'))).toBe('eraser');
    expect(symbol(screen.getByTestId('wzor-cofnij-rysunek'))).toBe('arrow.uturn.backward');
    expect(symbol(screen.getByRole('button', { name: t('wzor.dodaj_notatke') }))).toBe('note.text.badge.plus');
  });
  test('etykiety VoiceOver przycisków bez zmian, a symbol jest ukryty przed czytnikiem', () => {
    render(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz' })} t={t} widok={widok} {...w()} />);
    expect(screen.getByRole('button', { name: t('wzor.gumka') })).toBe(screen.getByTestId('wzor-gumka'));
    expect(screen.getByRole('button', { name: t('wzor.cofnij_rysunek') })).toBe(screen.getByTestId('wzor-cofnij-rysunek'));
    expect(screen.getByTestId('symbol-eraser', UKRYTE).props.accessible).toBe(false);
  });
});

describe('stoper: symbole SF', () => {
  const T = 1_000_000_000_000;
  const pokaz = (s: React.ComponentProps<typeof Stoper>['stan']) =>
    render(<Stoper stan={s} inny={null} t={t} teraz={() => T + 65_000} naStart={jest.fn()} naWstrzymaj={jest.fn()} naWznow={jest.fn()} naZatrzymaj={jest.fn()} naInnyPotwierdz={jest.fn()} naInnyAnuluj={jest.fn()} />);
  test('ikona bez sesji i kapsuła trwa = stopwatch; wstrzymana = pause.fill (inny kształt niż stoper)', () => {
    pokaz({ rodzaj: 'brak' });
    expect(symbol(screen.getByTestId('licznik-stoper'))).toBe('stopwatch');
    screen.unmount();
    pokaz({ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' });
    expect(symbol(screen.getByTestId('licznik-stoper'))).toBe('stopwatch');
    screen.unmount();
    pokaz({ rodzaj: 'wstrzymana', czasMs: 600_000, startGodzina: '19:52' });
    expect(symbol(screen.getByTestId('licznik-stoper'))).toBe('pause.fill');
  });
  test('skala symbolu: ikona w pasku najwyżej ×1,8, kapsuła ×1,6; bez powiększenia — rozmiar bazowy z tokenów', () => {
    const symbolSize = () => screen.getByTestId('symbol-stopwatch', UKRYTE).props.size;
    mockSkala = 3;
    pokaz({ rodzaj: 'brak' });
    expect(symbolSize()).toBe(Math.round(ROZMIAR_SYMBOLU * 1.8));
    screen.unmount();
    pokaz({ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' });
    expect(symbolSize()).toBe(Math.round(ROZMIAR_SYMBOLU_KAPSULY * 1.6));
    screen.unmount();
    mockSkala = 1;
    pokaz({ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' });
    expect(symbolSize()).toBe(17);
  });
});

// Trwała kontrola (zasada 21): w kodzie aplikacji nie wracają glify zastąpione symbolami (także w komentarzach — grep jest prostym sprawdzeniem).
test('brak glifów ⏱ ⏸ 🖍 ✎ ⌫ ↶ w src/, app/ i modules/ (ts, tsx, swift)', () => {
  const korzen = join(__dirname, '../..');
  const trafienia: string[] = [];
  const idz = (d: string) => {
    for (const n of readdirSync(d)) {
      if (n === 'node_modules' || n === 'Pods') continue;
      const p = join(d, n);
      if (statSync(p).isDirectory()) { idz(p); continue; }
      if (!/\.(tsx?|swift)$/.test(n)) continue;
      readFileSync(p, 'utf8').split('\n').forEach((l, i) => { if (/[⏱⏸🖍✎⌫↶]/u.test(l)) trafienia.push(`${p.slice(korzen.length + 1)}:${i + 1}`); });
    }
  };
  for (const d of ['src', 'app', 'modules']) idz(join(korzen, d));
  expect(trafienia).toEqual([]);
});
