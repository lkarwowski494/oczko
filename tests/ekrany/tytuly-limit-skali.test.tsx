// H-2 (P-361, znalezisko sesji B przy E2-A1): tytuły poza arkuszami (Libre Franklin) nie miały `maxFontSizeMultiplier`, więc przy AX5 rosły ×3,571 zamiast najwyżej ×1,8
// (P-277/P-287, `MAX_SKALA_TYTULOWA`; tokeny.json typografia._zasada: „tytuły ×1,8”). Najgorszy przypadek: `Projekt.tsx` pokazuje nazwę wpisaną przez użytkownika.
// Test 1: ekrany wskazane w zgłoszeniu (nazwa projektu, arkusz limitu, listy). Test 2: trwała kontrola klasy — każdy tytuł ekranu w `src/ekrany` ma limit.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Projekt } from '../../src/ekrany/Projekt';
import { ListaProjektow } from '../../src/ekrany/ListaProjektow';
import { Kosz } from '../../src/ekrany/Kosz';
import { ArkuszLimitu } from '../../src/ekrany/LicznikArkuszLimitu';
import { style as stylLicznika } from '../../src/ekrany/LicznikStyl';
import { MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { stanLicznika, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const limit = (nazwa: string) => screen.getByRole('header', { name: nazwa }).props.maxFontSizeMultiplier;

test('limit skali tytułów to 1,8 z tokenów (jedno źródło dla wszystkich ekranów)', () => {
  expect(MAX_SKALA_TYTULOWA).toBe(1.8);
  expect(tokeny.typografia._zasada).toContain('tytuły ×1,8');
});

test('nazwa projektu użytkownika (Projekt.tsx) ma limit skali tytułu', () => {
  render(<Projekt stan={{ nazwa: 'Counter from Nov 10 at 7:30 PM', czesci: [], notatka: null, miejsceWzoru: null, ostatniaZmiana: 'Nov 10', postep: { rodzaj: 'brak-celow' } }} t={t} naOtworzCzesc={jest.fn()} />);
  expect(limit('Counter from Nov 10 at 7:30 PM')).toBe(MAX_SKALA_TYTULOWA);
});

test('arkusz „Nie dodano rzędu” przy limicie dni (LicznikArkuszLimitu.tsx) ma limit skali tytułu', () => {
  const s = stanLicznika({ cel: 96, skonczone: 61, dziergany: 62, miesiac: { nazwa: 'November', wznowienie: 'December 1', rzedyDanych: 61 }, limit: { rodzaj: 'zawczasu' } });
  render(<ArkuszLimitu n={62} s={s} t={t} st={stylLicznika({ ...tokeny.kolor.jasny })} naOferty={jest.fn()} naZamknij={jest.fn()} />);
  expect(screen.getByRole('header').props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
});

test('tytuły listy projektów i kosza mają limit skali tytułu', () => {
  const r = render(<ListaProjektow stan={{ wToku: [], ukonczone: [], zapytanie: '', dni: null }} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
  expect(limit('Projects')).toBe(MAX_SKALA_TYTULOWA);
  r.unmount();
  render(<Kosz stan={{ dni: 30, pozycje: [] }} t={t} naPrzywroc={jest.fn()} />);
  expect(limit('Recently deleted')).toBe(MAX_SKALA_TYTULOWA);
});

// Trwała kontrola klasy (zasada roli „Powraca”): tytuł ekranu = Text z `accessibilityRole="header"` i krojem tytułowym (`st.tytul` z `typografia.tytul`/`instrukcja`
// albo `typografia.tytul|instrukcja` wprost). Nagłówki sekcji (krój systemowy, Dynamic Type pełny) i tytuły z lokalnym stylem bez kroju tytułowego są poza kontrolą.
test('każdy tytuł ekranu w src/ekrany z krojem tytułowym ma maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}', () => {
  const katalog = path.join(__dirname, '../../src/ekrany');
  const bez: string[] = [];
  for (const plik of fs.readdirSync(katalog).filter((f) => f.endsWith('.tsx'))) {
    const zrodlo = fs.readFileSync(path.join(katalog, plik), 'utf8');
    const lokalnyTytul = /^\s*tytul: \{/m.test(zrodlo);
    const tytulowy = /^\s*tytul: \{ \.\.\.typografia\.(tytul|instrukcja)/m.test(zrodlo);
    zrodlo.split('\n').forEach((linia, i) => {
      if (!linia.includes('accessibilityRole="header"')) return;
      const krojTytulowy = /typografia\.(tytul|instrukcja)\b/.test(linia) || (/\bst\.tytul\b/.test(linia) && (tytulowy || !lokalnyTytul));
      if (krojTytulowy && !linia.includes('maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}')) bez.push(`${plik}:${i + 1}`);
    });
  }
  expect(bez).toEqual([]);
});
