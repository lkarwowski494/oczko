// Skrypt scripts/sprawdz-i18n.mjs: słowniki i18next v4 + skan kodu. Kod wyjścia: 0 / 1 błędy / 2 konfiguracja.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const skrypt = join(__dirname, '..', '..', 'scripts', 'sprawdz-i18n.mjs');
const uruchom = (args: string[], cwd: string) => {
  const r = spawnSync(process.execPath, [skrypt, ...args], { cwd, encoding: 'utf8' });
  return { kod: r.status, wyjscie: r.stdout + r.stderr };
};
const projekt = (slowniki: Record<string, unknown>, kod: Record<string, string> = {}) => {
  const d = mkdtempSync(join(tmpdir(), 'i18n-'));
  mkdirSync(join(d, 'locales'));
  for (const [j, s] of Object.entries(slowniki)) writeFileSync(join(d, 'locales', `${j}.json`), JSON.stringify(s));
  mkdirSync(join(d, 'src'));
  for (const [n, t] of Object.entries(kod)) writeFileSync(join(d, 'src', n), t);
  writeFileSync(join(d, 'package.json'), '{}');
  return d;
};
const EN = { a: { b: 'Hello', n_one: '{{count}} row', n_other: '{{count}} rows' } };
const PL = { a: { b: 'Cześć', n_one: '{{count}} rząd', n_few: '{{count}} rzędy', n_many: '{{count}} rzędów', n_other: '{{count}} rzędu' } };

describe('sprawdz-i18n.mjs', () => {
  it('poprawne słowniki en + pl: kod 0', () => {
    const r = uruchom(['locales', '--zrodlo', 'en'], projekt({ en: EN, pl: PL }));
    expect(r.wyjscie).toMatch(/błędy: 0/);
    expect(r.kod).toBe(0);
  });
  it('polski bez formy _few: błąd z nazwą kategorii, kod 1', () => {
    const { n_few, ...bezFew } = PL.a;
    void n_few;
    const r = uruchom(['locales', '--zrodlo', 'en'], projekt({ en: EN, pl: { a: bezFew } }));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.n: brak formy _few/);
    expect(r.kod).toBe(1);
  });
  it('brak tłumaczenia klucza: błąd, kod 1', () => {
    const r = uruchom(['locales', '--zrodlo', 'en'], projekt({ en: EN, pl: { a: { n_one: 'x', n_few: 'x', n_many: 'x', n_other: 'x' } } }));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.b: brak tłumaczenia/);
    expect(r.kod).toBe(1);
  });
  it('zgubiony parametr {{count}}: błąd, kod 1', () => {
    const r = uruchom(['locales', '--zrodlo', 'en'], projekt({ en: EN, pl: { a: { ...PL.a, b: 'Cześć {{imie}}' } } }));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.b: parametry/);
    expect(r.kod).toBe(1);
  });
  it('tekst na sztywno w JSX i klucz bez wpisu w kodzie: błędy, kod 1', () => {
    const kod = {
      'e.tsx': "import React from 'react';\nexport const E = () => <Text>Add row</Text>;\nexport const F = () => <Text>{t('a.nie_ma')}</Text>;\n",
    };
    const r = uruchom(['locales', '--zrodlo', 'en', '--kod', 'src'], projekt({ en: EN }, kod));
    expect(r.wyjscie).toMatch(/tekst na sztywno „Add row”/);
    expect(r.wyjscie).toMatch(/klucza „a\.nie_ma” nie ma w en\.json/);
    expect(r.kod).toBe(1);
  });
  it('kod z kluczami ze słownika: kod 0', () => {
    const kod = { 'e.tsx': "export const E = () => <Text>{t('a.b')}</Text>;\nexport const N = (c: number) => t('a.n', { count: c });\n" };
    const r = uruchom(['locales', '--zrodlo', 'en', '--kod', 'src'], projekt({ en: EN }, kod));
    expect(r.wyjscie).toMatch(/błędy: 0/);
    expect(r.kod).toBe(0);
  });
  it('brak katalogu kodu: kod 2 (skan niewykonany, nie „w porządku”)', () => {
    const r = uruchom(['locales', '--zrodlo', 'en', '--kod', 'nie-ma'], projekt({ en: EN }));
    expect(r.wyjscie).toMatch(/skan kodu niewykonany/);
    expect(r.kod).toBe(2);
  });
  it('--wyjatki z „pliki” (ścieżka → powód): pliki pod ścieżką poza skanem kodu, reszta skanowana (M1-051)', () => {
    const d = projekt({ en: EN }, { 'e.tsx': 'export const E = () => <Text>Add row</Text>;\n', 'e2e-ekran.tsx': 'export const S = () => <Text>Next row</Text>;\n' });
    mkdirSync(join(d, 'src', 'e2e'));
    writeFileSync(join(d, 'src', 'e2e', 'panel.tsx'), 'export const P = () => <Text>Test panel</Text>;\n');
    writeFileSync(join(d, 'w.json'), JSON.stringify({ pliki: { 'src/e2e': 'panel buildu E2E' } }));
    const r = uruchom(['locales', '--zrodlo', 'en', '--kod', 'src', '--wyjatki', 'w.json'], d);
    expect(r.wyjscie).not.toMatch(/Test panel/);
    expect(r.wyjscie).toMatch(/tekst na sztywno „Add row”/);
    expect(r.wyjscie).toMatch(/tekst na sztywno „Next row”/); // prefiks src/e2e nie obejmuje src/e2e-ekran.tsx
    expect(r.kod).toBe(1);
  });
  it('wyjątek „pliki” na nieistniejącą ścieżkę: kod 2 (przeterminowany wyjątek nie przechodzi po cichu)', () => {
    const d = projekt({ en: EN }, { 'e.tsx': "export const E = () => <Text>{t('a.b')}</Text>;\n" });
    writeFileSync(join(d, 'w.json'), JSON.stringify({ pliki: { 'src/nie-ma': 'usunięty panel' } }));
    const r = uruchom(['locales', '--zrodlo', 'en', '--kod', 'src', '--wyjatki', 'w.json'], d);
    expect(r.wyjscie).toMatch(/src\/nie-ma/);
    expect(r.wyjscie).toMatch(/skan kodu niewykonany/);
    expect(r.kod).toBe(2);
  });
  it('brak źródła: kod 2', () => {
    const r = uruchom(['locales', '--zrodlo', 'xx'], projekt({ en: EN }));
    expect(r.kod).toBe(2);
  });
  it('--pseudo: wydłuża, dodaje akcenty i nawiasy, parametry nietknięte', () => {
    const d = projekt({ en: EN });
    const out = join(d, 'pseudo.json');
    const r = uruchom(['locales', '--zrodlo', 'en', '--pseudo', out], d);
    expect(r.kod).toBe(0);
    const xa = JSON.parse(readFileSync(out, 'utf8'));
    expect(xa['a.b']).toMatch(/^⟦.*⟧$/); // plik płaski: klucz z kropkami
    expect(xa['a.n_other']).toContain('{{count}}');
  });
});
