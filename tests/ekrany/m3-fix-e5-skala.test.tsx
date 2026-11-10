// M3 fix E5, 005 (P-614): limit Dynamic Type liczby i „+1” z tokenów `typografia.<rola>.maxSkala` — liczba karty „Dziś” `liczbaKarty` (1,6),
// „+1” karty, licznika i paska wzoru `przyciskPlus` (1,4). Zastępuje wspólne ×1,8 (`MAX_SKALA_TYTULOWA`) przy tych elementach.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import { Licznik } from '../../src/ekrany/Licznik';
import { LicznikWzoru } from '../../src/ekrany/WzorLicznik';
import { Liczba } from '../../src/ekrany/Liczba';
import { szerokoscKomorki } from '../../src/ekrany/liczbaKomorki';
import { typografiaDzianiny } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const ty = tokeny.typografia;
let mockSkala = 1;
afterEach(() => { mockSkala = 1; });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
/** maxFontSizeMultiplier najbliższego Text w poddrzewie elementu o testID (albo samego elementu). */
const skalaTekstu = (id: string): unknown => {
  const n = screen.getByTestId(id);
  if (n.props.maxFontSizeMultiplier !== undefined) return n.props.maxFontSizeMultiplier;
  const tekst = n.findAll((x) => x.props.maxFontSizeMultiplier !== undefined)[0];
  return tekst?.props.maxFontSizeMultiplier;
};

test('005: karta „Dziś” — liczba ×liczbaKarty.maxSkala (1,6), „+1” ×przyciskPlus.maxSkala (1,4)', () => {
  render(<Dzis stan={stanLicznika({ projekt: 'Harbor', skonczone: 42, dziergany: 43 })} dane={DANE} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(43))} naCofnijSerie={jest.fn()} naOferty={jest.fn()}
    naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} />);
  expect(skalaTekstu('dzis-wartosc')).toBe(ty.liczbaKarty.maxSkala);
  expect(skalaTekstu('dzis-plus')).toBe(ty.przyciskPlus.maxSkala);
});

test('005: licznik — „+1” ×przyciskPlus.maxSkala (1,4)', () => {
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', skonczone: 2, dziergany: 3 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.getByText(t('licznik.plus')).props.maxFontSizeMultiplier).toBe(ty.przyciskPlus.maxSkala);
});

test('005: pasek licznika pod wzorem — „+1” ×przyciskPlus.maxSkala (1,4)', () => {
  render(<LicznikWzoru t={t} licznik={{ liczba: 5, dziergany: 6, znaczenie: 'skonczone' }} obok={false} blad={false} naPlus={jest.fn()} naMinus={jest.fn()} />);
  expect(screen.getByText(t('licznik.plus')).props.maxFontSizeMultiplier).toBe(ty.przyciskPlus.maxSkala);
});

// 003 (P-614): komórka cyfry rośnie z Dynamic Type jak sam krój — komorkaEm × pt × min(skala systemu, maxSkala roli); inaczej przy dużym tekście cyfry nachodzą na siebie.
test('003: szerokoscKomorki przy skali 1,4 = 1,4 × bazowa; przy AX5 obcięta do maxSkala roli', () => {
  const pt = ty.liczbaKarty.pt;
  const baza = ty.cyfry.komorkaEm * pt;
  expect(szerokoscKomorki(pt, 1.4, ty.liczbaKarty.maxSkala)).toBeCloseTo(1.4 * baza, 6);
  expect(szerokoscKomorki(pt, 3.571, ty.liczbaKarty.maxSkala)).toBeCloseTo(ty.liczbaKarty.maxSkala * baza, 6);
  expect(szerokoscKomorki(pt, 1, ty.liczbaKarty.maxSkala)).toBeCloseTo(baza, 6);
});

test('003: komponent Liczba bierze skalę systemu (fontScale 1,4) i limit roli do szerokości komórki', () => {
  mockSkala = 1.4;
  render(<Liczba wartosc="42" styl={typografiaDzianiny.liczbaKarty} pt={ty.liczbaKarty.pt} maxFontSizeMultiplier={ty.liczbaKarty.maxSkala} testID="liczba" />);
  for (const k of screen.getAllByTestId(/^liczba-cyfra-/)) {
    expect(k.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: 1.4 * ty.cyfry.komorkaEm * ty.liczbaKarty.pt })]));
  }
});
