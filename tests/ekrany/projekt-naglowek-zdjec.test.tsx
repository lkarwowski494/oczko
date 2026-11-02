// 04-studio-projektowe-012 (P2, aneks 2026-11-02): nagłówek sekcji „Photos” był półgruby (fontWeight 700), a „Parts”, „Time”, „Note” i „Pattern” nie.
// Wzorzec `docs/design/fix10-2026-11-01/partia8.html:75` (`.naglowek-grupy`: 13 pt, kolor `olowek`, bez pogrubienia): jeden styl nagłówka sekcji ekranu projektu.
// Dane z prawdziwej bazy (node:sqlite) przez model odczytu i kompozycję, ekran z prawdziwego t() en, w obu motywach.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Projekt } from '../../src/ekrany/Projekt';
import { GrupaZdjec } from '../../src/ekrany/Zdjecia';
import { stanProjektu } from '../../src/kompozycja/projekt';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

let j: Jezyk;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
afterEach(() => jest.restoreAllMocks());

const stylTekstu = (tekst: string) => {
  const s = RN.StyleSheet.flatten(screen.getByText(tekst).props.style);
  return { fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, color: s.color, marginTop: s.marginTop };
};

test.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s: „Photos” ma ten sam krój, rozmiar, wagę i kolor co „Parts”', async (_m, schemat) => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweater'), czesc('c1', 'p1', 'Back', 1, { cel: 5 }), ...licznik('l1', 'c1', 3)]);
  const w = await widokProjektu(s.z, { projektId: 'p1' });
  if (!w.ok) throw new Error(w.powod);
  render(<Projekt stan={stanProjektu(w.wartosc, { j, terazMs: T0 + 2 * DOBA, strefa: 'Europe/Warsaw' })} t={j.t} naOtworzCzesc={jest.fn()}
    zdjecia={<GrupaZdjec t={j.t} miniatury={[]} naWybierz={jest.fn()} naOtworz={jest.fn()} />} />);
  const czesci = stylTekstu('Parts');
  const zdjecia = stylTekstu('Photos');
  expect(czesci.fontWeight).toBeUndefined(); // wzorzec: bez pogrubienia (zabezpieczenie przed zmianą punktu odniesienia)
  expect({ ...zdjecia, marginTop: undefined }).toEqual({ ...czesci, marginTop: undefined });
});
