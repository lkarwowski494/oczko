// H-1c (P-361, znalezisko sesji E): nagłówki sekcji ekranu projektu miały `typografia.podpis` (15 pt), a wzorzec `.naglowek-grupy` ma 13 pt w kolorze `olowek`:
// `docs/design/fix10-2026-11-01/partia8.html:76` i `docs/design/fix11-2026-11-02/aneks8.html:75` (font-size: 13px), rola `drobny` w `tokeny.json` (13 pt, „footnote”).
// Dotyczy wszystkich sześciu nagłówków ekranu: Parts, Time, Note, Photos, Pattern, Details (Photos i Pattern mają własne komponenty).
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Projekt } from '../../src/ekrany/Projekt';
import { GrupaZdjec } from '../../src/ekrany/Zdjecia';
import { GrupaWzorow } from '../../src/ekrany/WzorGrupa';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());

const NAGLOWKI = ['Parts', 'Time', 'Note', 'Photos', 'Pattern', 'Details'] as const;

function pokaz() {
  render(<Projekt
    stan={{
      nazwa: 'Sweater', czesci: [{ id: 'c1', nazwa: 'Back', rzedy: 3, cel: 5, paraZ: null }], notatka: 'Cast on loosely', miejsceWzoru: null,
      ostatniaZmiana: 'Nov 1', postep: { rodzaj: 'procent', wartosc: 60 },
      szczegoly: { narzedzie: null, rozmiar: null, termin: null }, czas: { suma: '1h 5m', sesje: 2, doSprawdzenia: 0 },
    }}
    t={t} naOtworzCzesc={jest.fn()} naNotatka={jest.fn()}
    zdjecia={<GrupaZdjec t={t} miniatury={[]} naWybierz={jest.fn()} naOtworz={jest.fn()} />}
    wzory={<GrupaWzorow t={t} wzory={[]} oczekujace={[]} skaner={false} naOtworz={jest.fn()} naDodaj={jest.fn()} naUsunOczekujacy={jest.fn()} />} />);
}
const styl = (nazwa: string) => {
  const s = RN.StyleSheet.flatten(screen.getByRole('header', { name: nazwa }).props.style);
  return { fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color };
};

test.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s: wszystkie nagłówki sekcji projektu mają 13 pt (wzorzec), kolor olowek, bez pogrubienia', (_m, schemat) => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
  pokaz();
  const olowek = tokeny.kolor[schemat === 'dark' ? 'ciemny' : 'jasny'].olowek;
  for (const n of NAGLOWKI) expect({ n, ...styl(n) }).toEqual({ n, fontSize: 13, fontWeight: undefined, color: olowek });
});
