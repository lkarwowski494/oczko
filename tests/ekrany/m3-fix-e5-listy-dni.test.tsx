// M3 fix E5: 010 (P-614 (5)) — nagłówek grupy Projektów `lista.naglowekGrupy` (17 pt / 700 / `tekst`) nad grupą, poza kontenerem;
// 13 (P-590, P-614 (6)) — dzień dziergany w tygodniu „Dziś”: `akcent` + obwódka `akcentTekst` (makieta `.tydz i.z`), bez faktury.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ListaProjektow, type StanListyProjektow } from '../../src/ekrany/ListaProjektow';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue('light'); });
afterEach(() => jest.restoreAllMocks());
const plasko = (s: unknown) => (RN.StyleSheet.flatten(s as never) ?? {}) as Record<string, unknown>;

test('010: nagłówek grupy „In progress” 17/700/tekst, poza kontenerem grupy (przodek bez tła grupy)', () => {
  const s: StanListyProjektow = { wToku: [{ id: 'p1', nazwa: 'Harbor Sweater', opis: 'Left sleeve · row 47 of 96 · today' }], ukonczone: [], zapytanie: '', dni: { zostalo: 3, limit: 5, miesiac: 'November' } };
  render(<ListaProjektow stan={s} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
  const naglowek = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'header' && n.props.children === t('projekty.w_toku'))[0];
  expect(naglowek).toBeTruthy();
  const st = plasko(naglowek?.props.style);
  const ng = tokeny.lista.naglowekGrupy;
  expect([st.fontSize, st.fontWeight, st.color]).toEqual([ng.pt, String(ng.waga), tokeny.kolory.jasny[ng.kolor as 'tekst']]);
  for (let n = naglowek?.parent ?? null; n; n = n.parent) expect(plasko(n.props.style).backgroundColor).not.toBe(tokeny.kolory.jasny.powierzchnia);
});

test('13 (P-590): dzień dziergany w tygodniu „Dziś” — tło akcent, obwódka akcentTekst, bez faktury (Pattern)', () => {
  const dane: DaneDzis = { data: 'Thursday, November 5', pustyTydzien: false, dni: null, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null,
    tydzien: [{ dzien: '2026-11-02', skrot: 'M', dziergany: true, dzis: false, a11y: 'Monday, knitted' }, { dzien: '2026-11-03', skrot: 'T', dziergany: false, dzis: false, a11y: 'Tuesday' }] };
  render(<Dzis stan={stanLicznika({ projekt: 'Harbor', skonczone: 42, dziergany: 43 })} dane={dane} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(43))} naCofnijSerie={jest.fn()} naOferty={jest.fn()}
    naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} />);
  const dzien = screen.getByLabelText('Monday, knitted');
  const kwadrat = dzien.findAll((n) => typeof n.type === 'string' && plasko(n.props.style).backgroundColor === tokeny.kolory.jasny.akcent)[0];
  expect(kwadrat).toBeTruthy();
  const s = plasko(kwadrat?.props.style);
  expect(s.borderColor).toBe(tokeny.kolory.jasny.akcentTekst);
  expect(Number(s.borderWidth)).toBe(2);
  expect(dzien.findAll((n) => String(n.type).includes('Pattern')).length).toBe(0);
});
