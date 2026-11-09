// M3 fix E5: 010 (P-614 (5)) — nagłówek grupy Projektów `lista.naglowekGrupy` (17 pt / 700 / `tekst`) nad grupą, poza kontenerem;
// 13 (P-590, P-614 (6)) — dzień dziergany w tygodniu „Dziś”: `akcent` + obwódka `akcentTekst` (makieta `.tydz i.z`), bez faktury.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue('light'); });
afterEach(() => jest.restoreAllMocks());
const plasko = (s: unknown) => (RN.StyleSheet.flatten(s as never) ?? {}) as Record<string, unknown>;

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
