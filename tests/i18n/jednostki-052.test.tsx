// M1-audytor-generalny-052 (09-lokalizacja-005, LOK-07): symbol jednostki nie jest doklejany do liczby w kodzie, tylko pochodzi ze słownika
// (klucze jednostka.m/g/yd/oz z parametrem {{wartosc}}), a przełącznik jednostki ma pełną nazwę dla VoiceOver (jednostka.*_nazwa), nie „m”/„oz”.
import React from 'react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import { FormularzWloczki } from '../../src/ekrany/Zapas';
import { bazowa, przeliczenie, stanZapasu } from '../../src/kompozycja/zapas';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from '../ekrany/pomoc';

const KORZEN = join(__dirname, '..', '..');
const pliki = (k: string, w: string[] = []): string[] => {
  for (const f of readdirSync(k)) { const p = join(k, f); statSync(p).isDirectory() ? pliki(p, w) : /\.tsx?$/.test(f) && w.push(p); }
  return w;
};
// Mechanizm z 09-lokalizacja-005: `${…} m` / `${…}m` w szablonie (także `${jednostka}` doklejane do liczby).
const DOKLEJONY = /\} ?(m|g|yd|oz|cm|in|mm)`|\$\{f\([^`]*\} \$\{jednostka\}/;

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('w src i app nie ma symbolu jednostki doklejonego do liczby w szablonie', () => {
  const trafienia = ['src', 'app'].flatMap((k) => pliki(join(KORZEN, k)))
    .flatMap((p) => readFileSync(p, 'utf8').split('\n').map((l, i) => [p.slice(KORZEN.length + 1), i + 1, l] as const))
    .filter(([, , l]) => DOKLEJONY.test(l)).map(([p, n]) => `${p}:${n}`);
  expect(trafienia).toEqual([]);
});

test('symbole jednostek w zapasie idą przez słownik (jednostka.m/g/yd/oz), wynik en bez zmian', () => {
  const klucze: string[] = [];
  const tSpy: Tlumacz = ((k: string, o?: Record<string, unknown>) => { klucze.push(k); return t(k as never, o as never); }) as Tlumacz;
  const j = { t: tSpy, jezyk: () => 'en-US' };
  expect(przeliczenie('437', 'yd', j)).toBe('= 399.59 m');
  expect(przeliczenie('100', 'g', j)).toBe('= 3.53 oz');
  const s = stanZapasu([{ id: 'a', nazwa: 'Fjord', kategoria: 4, motki: 5, dlugoscMotkaM: 399.5928, wagaMotkaG: 100, zdjecieSha: null }],
    { zapytanie: '', filtr: 'wszystkie', imperialny: true, j });
  expect(s.wiersze[0]?.motek).toBe('437 yd (399.59 m) · 3.53 oz (100 g) per skein');
  for (const k of ['jednostka.m', 'jednostka.yd', 'jednostka.g', 'jednostka.oz']) expect(klucze).toContain(k);
});

test('przełącznik jednostki: etykieta VoiceOver to pełna nazwa ze słownika, nie symbol', () => {
  render(<FormularzWloczki t={t} poczatek={null} jednostki="metryczne" przelicz={(x, u) => przeliczenie(x, u, { t, jezyk: () => 'en-US' })}
    bazowa={(x, u) => bazowa(x, u, 'en-US')} formatuj={String} naZapisz={jest.fn()} naAnuluj={jest.fn()} />);
  for (const u of ['m', 'yd', 'g', 'oz'] as const) {
    const etykieta = screen.getByTestId(`zapas-jednostka-${u}`).props.accessibilityLabel as string;
    expect(etykieta).not.toBe(u);
    expect(etykieta).toBe(t(`jednostka.${u}_nazwa` as never));
  }
});
