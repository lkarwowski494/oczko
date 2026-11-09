// M3 fix E5, 005 (P-614): limit Dynamic Type liczby i „+1” z tokenów `typografia.<rola>.maxSkala` — liczba karty „Dziś” `liczbaKarty` (1,6),
// „+1” karty, licznika i paska wzoru `przyciskPlus` (1,4). Zastępuje wspólne ×1,8 (`MAX_SKALA_TYTULOWA`) przy tych elementach.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import { Licznik } from '../../src/ekrany/Licznik';
import { LicznikWzoru } from '../../src/ekrany/WzorLicznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const ty = tokeny.typografia;
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
