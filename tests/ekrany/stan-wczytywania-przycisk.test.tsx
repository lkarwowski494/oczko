// M1-audytor-generalny-119 (źródło 04-studio-projektowe-516; regresja od M1-089): „Try again” w `StanWczytywania` ma jedną formę we wszystkich trzech
// tłach i jest zgodny ze spec (design-spec, aneks M2 partia 2, tabela „Tło `StanWczytywania`”, kolumna „Przycisk »Try again«”):
// `papier` i `arkusz` — `przyciskTlo` / `przyciskObrys` / `przyciskTekst` motywu (przycisk wypełniony), `czarne` — te same tokeny z `systemCzarny`
// (makieta 04 `fix-2026-11-02-p2/zrzuty/503-tlo-stanu-wczytywania.html`: tło #2E3136, obrys 2 pt #8C9098). Test czyta tokeny z wiersza tabeli spec,
// więc rozjazd spec i kodu (np. obrys bez wypełnienia na papierze, wypełnienie tylko na czerni) daje czerwony wynik.
// Druga część (wariant „Zwiększ kontrast”): `drugiPrzyciskObrys` jest w obu paletach kontrastu, a w `ciemnyKontrast` jest mocniejszy niż w `ciemny`.
// P-553 (Dzianina): tabela „Tło StanWczytywania” jest w archiwalnym design-spec (`docs/design/archiwum/2026-11-08-kreski/`, treść bez zmian); nazwy ról ze spec tłumaczy
// `NA_DZIANINE` według `docs/design/dzianina/mapa-tokenow.md` (papier → tlo, arkusz → powierzchnia, przyciskTlo → przycisk, przyciskTekst bez zmiany, przyciskObrys → przycisk:
// obrys usunięty, przycisk główny jest wypełniony i rama ma ten sam kolor; drugiPrzyciskObrys → tekst2 z wariantem zwiększonym).
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import { tEn } from './pomoc';

afterEach(() => jest.restoreAllMocks());

const SPEC = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'design', 'archiwum', '2026-11-08-kreski', 'design-spec.md'), 'utf8');
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
const PALETY: Record<'light' | 'dark', Paleta> = { light: tokeny.kolory.jasny, dark: tokeny.kolory.ciemny };
const CZ: Paleta = tokeny.kolory.systemCzarny;
/** Stara nazwa roli (tabela spec) → token Dzianiny (mapa-tokenow.md). */
const NA_DZIANINE: Record<string, string> = { papier: 'tlo', arkusz: 'powierzchnia', olowek: 'tekst2', przyciskTlo: 'przycisk', przyciskObrys: 'przycisk', przyciskTekst: 'przyciskTekst', drugiPrzyciskObrys: 'tekst2' };

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
    expect(kolory).toEqual({ tlo: p[NA_DZIANINE[spec.tlo]], obrys: p[NA_DZIANINE[spec.obrys]], tekst: p[NA_DZIANINE[spec.tekst]] });
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

describe('M1-119: obrys przycisku drugiego (dawniej `drugiPrzyciskObrys`, teraz `tekst2`) w obu wariantach „Zwiększ kontrast” (tokeny.json: `jasnyZwiekszony`, `ciemnyZwiekszony`)', () => {
  const lin = (c: number) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const kontrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const K = tokeny.kolory as unknown as Record<string, Paleta>;

  test.each(['jasnyZwiekszony', 'ciemnyZwiekszony'])('%s ma własny `tekst2` (obrys przycisku drugiego)', (w) => {
    expect(K[w].tekst2).toMatch(/^#[0-9A-F]{6}$/i);
  });
  test('ciemnyZwiekszony: obrys przycisku drugiego mocniejszy niż w `ciemny` (do tła i powierzchni; dawniej papier i arkusz)', () => {
    const c = K.ciemny, ck = { ...K.ciemny, ...K.ciemnyZwiekszony };
    for (const tlo of ['tlo', 'powierzchnia']) expect(kontrast(ck.tekst2, ck[tlo])).toBeGreaterThan(kontrast(c.tekst2, c[tlo]));
  });
  test('jasnyZwiekszony: obrys przycisku drugiego nie słabszy niż w `jasny`', () => {
    const j = K.jasny, jk = { ...K.jasny, ...K.jasnyZwiekszony };
    expect(kontrast(jk.tekst2, jk.tlo)).toBeGreaterThanOrEqual(kontrast(j.tekst2, j.tlo));
  });
});
