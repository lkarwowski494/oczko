// M3 p7 — Ustawienia jako lista grupowana z ikonami (ZM-07, design-spec Dzianiny wiersz `ustawienia`): ikona w kolorze, podpis od lewej,
// strzałka przy przejściu na inny ekran aplikacji, działania (eksport, import, usunięcie, odnośniki na zewnątrz, przełączniki) bez strzałki.
// Zachowanie wierszy, testID i etykiety VoiceOver bez zmian (ustawienia.test.tsx, scenariusze 06, 08, 12, 51, 66).
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import { Ustawienia, type PropsUstawien } from '../../src/ekrany/Ustawienia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const ADRESY = { polityka: 'https://example.invalid/p', wsparcie: 'https://example.invalid/s', recenzja: 'https://example.invalid/r' };
const UKRYTE = { includeHiddenElements: true } as const;
function pokaz(stan: Partial<PropsUstawien['stan']> = {}, dodatki: Partial<PropsUstawien> = {}) {
  render(<Ustawienia stan={{ pro: null, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wibracje: true, ...stan }} t={t} system={atrapaSystemu()} adresy={ADRESY}
    naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()}
    dane={{ naEksport: jest.fn(), naImport: jest.fn(), naUsunWszystko: jest.fn() }}
    preferencje={{ ekranNieGasnie: true, ukladMiar: 'auto', naEkranNieGasnie: jest.fn(), naMiary: jest.fn() }}
    jezyk={{ stan: { wartosc: 'auto', jezyk: 'en' }, naJezyk: jest.fn(), naZglosTlumaczenie: jest.fn() }}
    naZrodla={jest.fn()} {...dodatki} />);
}
// Przełączniki: testID niesie sam przełącznik (jak dotąd), wiersz z ikoną ma `-wiersz`.
const PRZELACZNIKI = ['ustawienia-wibracje', 'ustawienia-ekran-nie-gasnie'];
const wiersz = (id: string) => screen.getByTestId(id);
const symbole = (id: string) => within(wiersz(PRZELACZNIKI.includes(id) ? `${id}-wiersz` : id)).queryAllByTestId(/^symbol-/, UKRYTE).map((x) => String(x.props.testID));

// Wiersze przechodzące na inny ekran aplikacji (strzałka) i działania (bez strzałki).
const PRZEJSCIA = ['ustawienia-oczko-pro', 'ustawienia-miary', 'ustawienia-stan-danych', 'ustawienia-zglos', 'ustawienia-zrodla', 'ustawienia-jezyk'];
const DZIALANIA = ['ustawienia-eksport', 'ustawienia-import', 'ustawienia-usun-wszystko', 'ustawienia-pomoc', 'ustawienia-ocen', 'ustawienia-polityka'];

describe('ZM-07: Ustawienia z ikonami', () => {
  test('każdy wiersz (przejścia, działania, przełączniki) ma dokładnie jedną ikonę wiersza (oprócz strzałki)', () => {
    pokaz();
    for (const id of [...PRZEJSCIA, ...DZIALANIA, ...PRZELACZNIKI]) {
      const ikony = symbole(id).filter((x) => x !== 'symbol-chevron.forward');
      expect([id, ikony.length]).toEqual([id, 1]);
    }
  });

  test('ikony wierszy są różne (jeden symbol = jedno znaczenie)', () => {
    pokaz({ pro: { rodzaj: 'subskrypcja', produkt: 'oczko.pro.rok' } });
    const wszystkie = [...PRZEJSCIA, ...DZIALANIA, ...PRZELACZNIKI, 'ustawienia-subskrypcja'].map((id) => symbole(id).find((x) => x !== 'symbol-chevron.forward'));
    expect(new Set(wszystkie).size).toBe(wszystkie.length);
  });

  test('strzałka tylko przy przejściu na inny ekran aplikacji; działania i przełączniki bez strzałki', () => {
    pokaz();
    for (const id of PRZEJSCIA) expect([id, symbole(id).includes('symbol-chevron.forward')]).toEqual([id, true]);
    for (const id of [...DZIALANIA, ...PRZELACZNIKI]) expect([id, symbole(id).includes('symbol-chevron.forward')]).toEqual([id, false]);
  });

  test('wiersze są pogrupowane (lista grupowana): Pro, liczenie, dane, informacje, język', () => {
    pokaz();
    expect(screen.getAllByTestId('ustawienia-grupa')).toHaveLength(5);
  });

  test('podpis od lewej, wartość po prawej: „Language” z wartością „Same as phone”, „Units” z „Automatic”', () => {
    pokaz();
    expect(wiersz('ustawienia-jezyk').props.accessibilityValue).toEqual({ text: 'Same as phone' });
    expect(within(wiersz('ustawienia-jezyk')).getByText('Same as phone')).toBeTruthy();
    expect(within(wiersz('ustawienia-miary')).getByText('Automatic')).toBeTruthy();
  });

  test('stan Pro: wartość „On” w wierszu Oczko Pro, etykieta VoiceOver „Oczko Pro, On”; wiersz „Manage subscription” bez strzałki', () => {
    pokaz({ pro: { rodzaj: 'subskrypcja', produkt: 'oczko.pro.rok' }, dni: null });
    expect(wiersz('ustawienia-oczko-pro').props.accessibilityLabel).toBe('Oczko Pro, On');
    expect(screen.getByTestId('ustawienia-pro').props.children).toBe('On');
    expect(screen.getByRole('switch', { name: 'Vibration' })).toBeTruthy();
    expect(symbole('ustawienia-subskrypcja')).not.toContain('symbol-chevron.forward');
  });

  test('tytuł „Settings” jest nagłówkiem (role=header)', () => {
    pokaz();
    expect(screen.getByRole('header', { name: 'Settings' })).toBeTruthy();
  });
});
