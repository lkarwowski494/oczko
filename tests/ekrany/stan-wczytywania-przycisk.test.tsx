// M1-audytor-generalny-119 (źródło 04-studio-projektowe-516; regresja od M1-089): „Try again” w `StanWczytywania` ma jedną formę we wszystkich trzech
// tłach i jest zgodny ze spec (design-spec, aneks M2 partia 2, tabela „Tło `StanWczytywania`”, kolumna „Przycisk »Try again«”):
// `papier` i `arkusz` — `przyciskTlo` / `przyciskObrys` / `przyciskTekst` motywu (przycisk wypełniony), `czarne` — te same tokeny z `systemCzarny`
// (makieta 04 `fix-2026-11-02-p2/zrzuty/503-tlo-stanu-wczytywania.html`: tło #2E3136, obrys 2 pt #8C9098). Test czyta tokeny z wiersza tabeli spec,
// więc rozjazd spec i kodu (np. obrys bez wypełnienia na papierze, wypełnienie tylko na czerni) daje czerwony wynik.
// Druga część (wariant „Zwiększ kontrast”): `drugiPrzyciskObrys` jest w obu paletach kontrastu, a w `ciemnyKontrast` jest mocniejszy niż w `ciemny`.
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import { tEn } from './pomoc';

afterEach(() => jest.restoreAllMocks());

const SPEC = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'design', 'design-spec.md'), 'utf8');
/** Kolumna „Przycisk »Try again«” wiersza `tlo` w tabeli spec: nazwy tokenów w kolejności tło / obrys / tekst (bez przedrostka palety). */
function tokenyPrzyciskuZeSpec(tlo: 'papier' | 'arkusz' | 'czarne'): { paleta: 'motyw' | 'systemCzarny'; tlo: string; obrys: string; tekst: string } {
  const wiersz = SPEC.split('\n').find((l) => l.startsWith(`| \`${tlo}\``));
  if (!wiersz) throw new Error(`brak wiersza ${tlo} w tabeli „Tło StanWczytywania”`);
  const kolumna = wiersz.split('|')[4];
  if (/jak wyżej/.test(kolumna)) return tokenyPrzyciskuZeSpec('papier');
  const nazwy = [...kolumna.matchAll(/`([A-Za-z.]+)`/g)].map((m) => m[1]);
  const paleta = nazwy[0].startsWith('systemCzarny.') ? 'systemCzarny' : 'motyw';
  const [t, o, x] = nazwy.map((n) => n.replace(/^systemCzarny\./, ''));
  return { paleta, tlo: t, obrys: o, tekst: x };
}

type Paleta = Record<string, string>;
const PALETY: Record<'light' | 'dark', Paleta> = { light: tokeny.kolor.jasny, dark: tokeny.kolor.ciemny };
const CZ: Paleta = tokeny.kolor.systemCzarny;

async function przycisk(schemat: 'light' | 'dark', tlo: 'papier' | 'arkusz' | 'czarne') {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
  const t = await tEn();
  render(<StanWczytywania stan="blad" t={t} przedrostek="x" naPonow={() => undefined} tlo={tlo} />);
  const s = RN.StyleSheet.flatten(screen.getByTestId('x-ponow').props.style);
  const e = RN.StyleSheet.flatten(screen.getByText('Try again').props.style);
  return {
    kolory: { tlo: s.backgroundColor, obrys: s.borderColor, tekst: e.color },
    forma: { borderWidth: s.borderWidth, borderRadius: s.borderRadius, minHeight: s.minHeight, fontFamily: e.fontFamily, fontWeight: e.fontWeight, fontSize: e.fontSize },
  };
}

describe('M1-119: „Try again” w StanWczytywania — kolory z kolumny przycisku w tabeli spec', () => {
  test.each([
    ['jasny', 'light', 'papier'], ['jasny', 'light', 'arkusz'], ['jasny', 'light', 'czarne'],
    ['ciemny', 'dark', 'papier'], ['ciemny', 'dark', 'arkusz'], ['ciemny', 'dark', 'czarne'],
  ] as const)('motyw %s (%s), tlo=%s: tło, obrys i tekst przycisku = tokeny spec', async (_m, schemat, tlo) => {
    const spec = tokenyPrzyciskuZeSpec(tlo);
    const p = spec.paleta === 'systemCzarny' ? CZ : PALETY[schemat];
    const { kolory } = await przycisk(schemat, tlo);
    expect(kolory).toEqual({ tlo: p[spec.tlo], obrys: p[spec.obrys], tekst: p[spec.tekst] });
  });

  test.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s: jedna forma przycisku na papierze, arkuszu i czerni (obrys, promień, krój)', async (_m, schemat) => {
    // Każde tło w osobnym render() (po unmount), żeby getByTestId nie znalazł dwóch przycisków.
    const papier = (await przycisk(schemat, 'papier')).forma;
    screen.unmount();
    const arkusz = (await przycisk(schemat, 'arkusz')).forma;
    screen.unmount();
    const czarne = (await przycisk(schemat, 'czarne')).forma;
    expect(arkusz).toEqual(papier);
    expect(czarne).toEqual(papier);
  });
});

describe('M1-119: `drugiPrzyciskObrys` w obu wariantach „Zwiększ kontrast” (tokeny.json)', () => {
  const lin = (c: number) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const kontrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const K = tokeny.kolor as unknown as Record<string, Paleta>;

  test.each(['jasnyKontrast', 'ciemnyKontrast'])('%s ma własny `drugiPrzyciskObrys`', (w) => {
    expect(K[w].drugiPrzyciskObrys).toMatch(/^#[0-9A-F]{6}$/i);
  });
  test('ciemnyKontrast: obrys przycisku drugiego mocniejszy niż w `ciemny` (do papieru i arkusza)', () => {
    const c = K.ciemny, ck = { ...K.ciemny, ...K.ciemnyKontrast };
    for (const tlo of ['papier', 'arkusz']) expect(kontrast(ck.drugiPrzyciskObrys, ck[tlo])).toBeGreaterThan(kontrast(c.drugiPrzyciskObrys, c[tlo]));
  });
  test('jasnyKontrast: obrys przycisku drugiego nie słabszy niż w `jasny`', () => {
    const j = K.jasny, jk = { ...K.jasny, ...K.jasnyKontrast };
    expect(kontrast(jk.drugiPrzyciskObrys, jk.papier)).toBeGreaterThanOrEqual(kontrast(j.drugiPrzyciskObrys, j.papier));
  });
});
