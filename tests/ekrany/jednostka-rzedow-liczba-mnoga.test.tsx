// M1-audytor-generalny-018 (09-lokalizacja-001, P-405): podpis pod liczbą rzędów — licznik bez celu (znaczenie „skonczone”), karta ukończenia
// i obraz karty — idzie przez klucz liczby mnogiej z `count` = ta liczba. Wcześniej „1 rows” (en) i „2 rzędów” (pl).
// Prawdziwe t() (utworzI18n + ZASOBY): pl 1 → „rząd”, 2 → „rzędy”, 5 → „rzędów”, 22 → „rzędy” (CLDR one/few/many/few); en 1 → „row”, 2 → „rows”.
// Skaner: w src i app żaden klucz z formami liczby mnogiej w en (ani licznik.jednostka / ukonczenie.jednostka) nie jest wołany przez t() bez `count`.
import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { render, screen, within } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import { Ukonczenie, type StanUkonczenia } from '../../src/ekrany/Ukonczenie';
import { ObrazKarty } from '../../src/ekrany/ObrazKarty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, atrapaSystemu, stanLicznika, wywolaniaLicznika } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));

const tDla = async (jezyk: string): Promise<Tlumacz> =>
  (await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => [jezyk], zasoby: ZASOBY })).t;

const PRZYPADKI: [string, number, string][] = [
  ['pl', 1, 'rząd'], ['pl', 2, 'rzędy'], ['pl', 5, 'rzędów'], ['pl', 22, 'rzędy'],
  ['en', 1, 'row'], ['en', 2, 'rows'],
];
const FORMY = { pl: ['rząd', 'rzędy', 'rzędów', 'rzędu'], en: ['row', 'rows'] } as Record<string, string[]>;
const KARTA = { nazwa: 'Sweter', okres: '1–21.10', dni: 21, czas: null, czesci: 1, zdjecie: null };

describe.each(PRZYPADKI)('M1-018 %s, %i rzędów → „%s”', (jezyk, n, forma) => {
  let t: Tlumacz;
  beforeAll(async () => { t = await tDla(jezyk); });
  const inneFormy = () => FORMY[jezyk].filter((f) => f !== forma);

  test('licznik bez celu, znaczenie „skonczone”: podpis pod liczbą', () => {
    render(<Licznik stan={stanLicznika({ skonczone: n, dziergany: n + 1, znaczenie: 'skonczone', cel: null })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
    const wiersz = within(screen.getByTestId('licznik-wartosc-wiersz'));
    expect(screen.getByTestId('licznik-wartosc').props.children).toBe(String(n));
    expect(wiersz.getByText(forma)).toBeTruthy();
    for (const f of inneFormy()) expect(wiersz.queryByText(f)).toBeNull();
  });

  test('karta ukończenia: podpis obok liczby rzędów', () => {
    const stan: StanUkonczenia = { ...KARTA, rzedy: n, wloczka: [] };
    render(<Ukonczenie stan={stan} t={t} oglos={jest.fn()} system={atrapaSystemu()} liczby={{ formatuj: String, parsuj: () => null }} naUdostepnij={jest.fn()} naGotowe={jest.fn()} />);
    expect(screen.getByText(String(n))).toBeTruthy();
    expect(screen.getByText(forma)).toBeTruthy();
    for (const f of inneFormy()) expect(screen.queryByText(f)).toBeNull();
  });

  test('obraz karty ukończenia: podpis kolumny pod liczbą rzędów', () => {
    render(<ObrazKarty stan={{ ...KARTA, rzedy: n, wloczka: [] }} t={t} formatuj={String} />);
    expect(screen.getByText(forma)).toBeTruthy();
    for (const f of inneFormy()) expect(screen.queryByText(f)).toBeNull();
  });
});

describe('M1-018 skaner: klucz liczby mnogiej przy liczbie zawsze z `count`', () => {
  const KORZEN = path.join(__dirname, '..', '..');
  const FORMA = /_(zero|one|two|few|many|other)$/;
  const plaskie = (o: Record<string, unknown>, p = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? plaskie(v as Record<string, unknown>, `${p}${k}.`) : [p + k]));
  const en = plaskie(JSON.parse(fs.readFileSync(path.join(KORZEN, 'src/i18n/slowniki/en.json'), 'utf8')) as Record<string, unknown>);
  const bazy = new Set([...en.filter((k) => FORMA.test(k)).map((k) => k.replace(FORMA, '')), 'licznik.jednostka', 'ukonczenie.jednostka']);
  const pliki = (d: string): string[] =>
    fs.readdirSync(d).flatMap((f) => { const p = path.join(d, f); return fs.statSync(p).isDirectory() ? pliki(p) : /\.tsx?$/.test(f) ? [p] : []; });

  test('src i app: brak t(<klucz liczby mnogiej>) bez `count` (w tym licznik.jednostka, ukonczenie.jednostka)', () => {
    const zle: string[] = [];
    for (const plik of [...pliki(path.join(KORZEN, 'src')), ...pliki(path.join(KORZEN, 'app'))]) {
      const zr = ts.createSourceFile(plik, fs.readFileSync(plik, 'utf8'), ts.ScriptTarget.Latest, true, plik.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const odwiedz = (n: ts.Node): void => {
        if (ts.isCallExpression(n)) {
          const e = n.expression, a = n.arguments[0], p = n.arguments[1];
          const wT = ts.isIdentifier(e) ? e.text === 't' : ts.isPropertyAccessExpression(e) && e.name.text === 't';
          if (wT && a && ts.isStringLiteral(a) && bazy.has(a.text)) {
            const zCount = !!p && ts.isObjectLiteralExpression(p) && p.properties.some((x) => !!x.name && x.name.getText(zr) === 'count');
            if (!zCount) zle.push(`${path.relative(KORZEN, plik)}:${zr.getLineAndCharacterOfPosition(n.getStart()).line + 1} ${a.text}`);
          }
        }
        ts.forEachChild(n, odwiedz);
      };
      odwiedz(zr);
    }
    expect(zle).toEqual([]);
  });
});
