// M1-245 (P-661, fix11): ekran „Open source licenses” i wiersz w Ustawieniach (kryteria akceptacji 1, 2, 6 z docs/design/fix11-2026-11-10.md).
// Jest nie liczy układu: sprawdzamy strukturę, kolejność, stan rozwinięcia i atrybuty dostępności; wygląd potwierdza E2E na macOS i recenzja.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { Licencje } from '../../src/ekrany/Licencje';
import { Ustawienia, type PropsUstawien } from '../../src/ekrany/Ustawienia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
let mockSkala = 1;
afterEach(() => { mockSkala = 1; });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const UKRYTE = { includeHiddenElements: true } as const;
const normalizuj = (s: string) => s.replace(/\s+/g, ' ').trim();
const tekstWezla = (n: ReactTestInstance): string => n.children.map((c) => (typeof c === 'string' ? c : tekstWezla(c))).join('');
const OFL = readFileSync(join(__dirname, '../../assets/fonts/breeserif-OFL.txt'), 'utf8');

const ADRESY = { polityka: 'https://example.invalid/p', wsparcie: 'https://example.invalid/s', recenzja: 'https://example.invalid/r' };
function ustawienia(dodatki: Partial<PropsUstawien> = {}) {
  render(<Ustawienia stan={{ pro: null, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wibracje: true }} t={t} system={atrapaSystemu()} adresy={ADRESY}
    naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()}
    dane={{ naEksport: jest.fn(), naImport: jest.fn(), naUsunWszystko: jest.fn() }}
    preferencje={{ ekranNieGasnie: true, ukladMiar: 'auto', naEkranNieGasnie: jest.fn(), naMiary: jest.fn() }}
    jezyk={{ stan: { wartosc: 'auto', jezyk: 'en' }, naJezyk: jest.fn(), naZglosTlumaczenie: jest.fn() }}
    naZrodla={jest.fn()} {...dodatki} />);
}

describe('kryterium 1: wiersz „Open source licenses” w Ustawieniach', () => {
  test('bezpośrednio po „About our content”, w tej samej grupie, symbol c.circle, tekst t(ustawienia.licencje); stuknięcie otwiera ekran', () => {
    const naLicencje = jest.fn();
    ustawienia({ naLicencje });
    const wiersz = screen.getByTestId('ustawienia-licencje');
    const grupaWiersza = (n: ReactTestInstance) => { let r: ReactTestInstance | null = n.parent; while (r && r.props.testID !== 'ustawienia-grupa') r = r.parent; return r; };
    const grupa = grupaWiersza(wiersz);
    expect(grupa).not.toBeNull();
    expect(grupaWiersza(screen.getByTestId('ustawienia-zrodla'))).toBe(grupa);
    const ids = (grupa?.findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string' && /^ustawienia-(?!grupa)/.test(n.props.testID)) ?? []).map((n) => n.props.testID as string);
    expect(ids.indexOf('ustawienia-licencje')).toBe(ids.indexOf('ustawienia-zrodla') + 1);
    expect(within(wiersz).getByText('Open source licenses')).toBeTruthy();
    expect(t('ustawienia.licencje')).toBe('Open source licenses');
    expect(within(wiersz).queryAllByTestId('symbol-c.circle', UKRYTE)).toHaveLength(1);
    expect(wiersz.props.accessibilityRole).toBe('button');
    expect(wiersz.props.accessibilityLabel).toBe('Open source licenses');
    fireEvent.press(wiersz);
    expect(naLicencje).toHaveBeenCalledTimes(1);
  });
  test('bez dostawcy przejścia wiersza nie ma (jak „About our content”)', () => {
    ustawienia();
    expect(screen.queryByTestId('ustawienia-licencje')).toBeNull();
  });
});

describe('kryterium 2: ekran licencji', () => {
  const pokaz = () => render(<Licencje t={t} naWstecz={jest.fn()} />);
  const wszystkieId = () => screen.getByTestId('licencje-lista').findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);

  test('tytuł, wstęp i nagłówki grup z kluczy en; krój Bree Serif przed grupą licencji', () => {
    pokaz();
    expect(screen.getByRole('header', { name: 'Open source licenses' })).toBeTruthy();
    expect(screen.getByText('Oczko is built with open source software. Tap a license to read its full text.')).toBeTruthy();
    for (const naglowek of ['Fonts', 'License texts', 'iOS libraries outside npm', 'npm packages']) expect(screen.getByRole('header', { name: naglowek })).toBeTruthy();
    const ids = wszystkieId();
    expect(ids.indexOf('licencje-kroj-bree-serif')).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf('licencje-licencja-MIT')).toBeGreaterThan(ids.indexOf('licencje-kroj-bree-serif'));
  });
  test('wiersz kroju: nazwa, SPDX i nota (pierwszy wiersz pliku licencji) w stanie zwiniętym', () => {
    pokaz();
    const kroj = screen.getByTestId('licencje-kroj-bree-serif');
    expect(within(kroj).getByText('Bree Serif')).toBeTruthy();
    expect(within(kroj).getByText('OFL-1.1')).toBeTruthy();
    expect(within(kroj).getByText(/^Copyright \(c\) 2011, TypeTogether/)).toBeTruthy();
    expect(screen.queryByTestId('licencje-tekst')).toBeNull();
  });
  test('stuknięcie rozwija pełny tekst OFL z pliku (po normalizacji białych znaków); ponowne stuknięcie zwija', () => {
    pokaz();
    fireEvent.press(screen.getByTestId('licencje-kroj-bree-serif'));
    const tekst = screen.getByTestId('licencje-tekst');
    expect(normalizuj(tekstWezla(tekst))).toBe(normalizuj(OFL));
    expect(normalizuj(tekstWezla(tekst))).toMatch(/^Copyright \(c\) 2011, TypeTogether/);
    expect(tekst.props.selectable).toBe(true);
    fireEvent.press(screen.getByTestId('licencje-kroj-bree-serif'));
    expect(screen.queryByTestId('licencje-tekst')).toBeNull();
  });
  test('rozwinięcie innej licencji zwija poprzednią (jedna otwarta naraz)', () => {
    pokaz();
    fireEvent.press(screen.getByTestId('licencje-kroj-bree-serif'));
    fireEvent.press(screen.getByTestId('licencje-licencja-MIT'));
    expect(screen.getAllByTestId('licencje-tekst')).toHaveLength(1);
    expect(tekstWezla(screen.getByTestId('licencje-tekst'))).toContain('Permission is hereby granted, free of charge');
    expect(screen.getByTestId('licencje-kroj-bree-serif').props.accessibilityState).toEqual(expect.objectContaining({ expanded: false }));
    expect(screen.getByTestId('licencje-licencja-MIT').props.accessibilityState).toEqual(expect.objectContaining({ expanded: true }));
  });
  test('lista wirtualizowana z pakietami npm i bibliotekami natywnymi (folly, boost)', () => {
    pokaz();
    expect(screen.getByTestId('licencje-lista')).toBeTruthy();
    expect(screen.getAllByText(/^folly /).length).toBeGreaterThan(0);
  });
});

describe('kryterium 6: dostępność', () => {
  test('wiersze rozwijane: rola button i accessibilityState.expanded zgodny ze stanem; krój z etykietą „Bree Serif, OFL-1.1”', () => {
    render(<Licencje t={t} naWstecz={jest.fn()} />);
    const kroj = screen.getByTestId('licencje-kroj-bree-serif');
    expect(kroj.props.accessibilityRole).toBe('button');
    expect(kroj.props.accessibilityLabel).toBe('Bree Serif, OFL-1.1');
    expect(kroj.props.accessibilityState).toEqual(expect.objectContaining({ expanded: false }));
    fireEvent.press(kroj);
    expect(screen.getByTestId('licencje-kroj-bree-serif').props.accessibilityState).toEqual(expect.objectContaining({ expanded: true }));
    const mit = screen.getByTestId('licencje-licencja-MIT');
    expect(mit.props.accessibilityRole).toBe('button');
    expect(mit.props.accessibilityLabel).toBe('MIT');
  });
  test('fontScale 3,571 (AX5): teksty licencji bez maxFontSizeMultiplier (treść prawna skaluje się bez limitu)', () => {
    mockSkala = 3.571;
    render(<Licencje t={t} naWstecz={jest.fn()} />);
    fireEvent.press(screen.getByTestId('licencje-kroj-bree-serif'));
    expect(screen.getByTestId('licencje-tekst').props.maxFontSizeMultiplier).toBeUndefined();
    expect(screen.getByText('Oczko is built with open source software. Tap a license to read its full text.').props.maxFontSizeMultiplier).toBeUndefined();
    expect(screen.getByText('Bree Serif').props.maxFontSizeMultiplier).toBeUndefined();
  });
});
