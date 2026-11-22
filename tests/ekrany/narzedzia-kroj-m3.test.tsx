// M3 p6 (M3-S3-04, design-spec „Typografia”): tytuły ekranów zakładki Narzędzia stoją w Bree Serif, a w językach spoza pokrycia pliku (`kroje.tytul.jezykiSystemowe`)
// w kroju systemowym. Jak „Dziś”: ekran dostaje `jezyk`; bez niego krój zostaje Bree (zgodność z istniejącymi wywołaniami).
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Narzedzia, Probka } from '../../src/ekrany/Narzedzia';
import { ListaDrutow, Zapas } from '../../src/ekrany/Zapas';
import { WyborMiar } from '../../src/ekrany/Miary';
import { KROJ_TYTULOWY } from '../../src/ekrany/motyw';
import { stanDrutow, stanZapasu } from '../../src/kompozycja/zapas';
import { stanProbki } from '../../src/kompozycja/probka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const j = () => ({ t, jezyk: () => 'en-US' });
const noop = jest.fn();
const rodzina = (): unknown => (StyleSheet.flatten(screen.getAllByRole('header')[0]!.props.style) as { fontFamily?: string }).fontFamily;

type Rysuj = (jezyk?: string) => React.ReactElement;
const EKRANY: ReadonlyArray<readonly [string, Rysuj]> = [
  ['Narzędzia', (jezyk) => <Narzedzia stan={{ wloczki: 1, druty: 2 }} t={t} naWloczki={noop} naDruty={noop} naProbke={noop} jezyk={jezyk} />],
  ['lista zapasu', (jezyk) => <Zapas t={t} stan={stanZapasu([], { zapytanie: '', filtr: 'wszystkie', imperialny: false, j: j() })} zapytanie="" filtr="wszystkie"
    naSzukaj={noop} naFiltr={noop} naDodaj={noop} naOtworz={noop} jezyk={jezyk} />],
  ['lista drutów', (jezyk) => <ListaDrutow t={t} stan={stanDrutow([], j())} naDodaj={noop} naOtworz={noop} jezyk={jezyk} />],
  ['próbka', (jezyk) => <Probka t={t} jednostka="cm" poczatek={{ oczka: '', na: '10cm' }} licz={(w) => stanProbki(w, j())} jezyk={jezyk} />],
  ['miary', (jezyk) => <WyborMiar t={t} wybrany="auto" naWybierz={noop} jezyk={jezyk} />],
];

describe.each(EKRANY)('M3-S3-04: tytuł ekranu „%s”', (_nazwa, rysuj) => {
  test('język łaciński (en, pl) i brak języka: Bree Serif', () => {
    for (const jezyk of ['en', 'pl-PL', undefined]) {
      const r = render(rysuj(jezyk));
      expect(rodzina()).toBe(KROJ_TYTULOWY);
      r.unmount();
    }
  });
  test('języki z krojem systemowym (ru, ja, vi, uk-UA, zh-Hant-TW): bez Bree', () => {
    for (const jezyk of ['ru', 'ja', 'vi', 'uk-UA', 'zh-Hant-TW']) {
      const r = render(rysuj(jezyk));
      expect(rodzina()).toBeUndefined();
      r.unmount();
    }
  });
});
