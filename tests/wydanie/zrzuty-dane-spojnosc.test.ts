/* 10-wydanie-020 (sesja AL, 2026-11-11, KO-041): dane fikcyjne zrzutów sklepu są spójne dla każdego języka danych.
 * Kadry 03 i 04 pokazują wzór PDF otwarty z projektu głównego; nazwa wzoru (src/kompozycja/e2e/wzor-sklepu.ts) ma być nazwą tego projektu,
 * a pozostałe projekty z kadru 05 mają inne nazwy (przebieg 43035080611: en miał „Harbor Sweater” z wzorem „Cable Hat”, a „Cable Hat” jako trzeci projekt).
 * Dlaczego: dane fikcyjne mają być wiarygodne (App Review 2.3.9), a błąd widać dopiero w artefakcie z macierzy macOS. */
import * as fs from 'fs';
import * as path from 'path';
import { WZORY_SKLEPU, type KluczWzoru } from '../../src/kompozycja/e2e/wzor-sklepu';

const katalog = path.join(__dirname, '..', '..', 'e2e', 'zrzuty-sklepu', 'dane');
const klucze = fs.readdirSync(katalog).filter((p) => p.endsWith('.json')).map((p) => p.replace(/\.json$/, '')).sort();
const dane = (k: string): Record<string, unknown> => JSON.parse(fs.readFileSync(path.join(katalog, `${k}.json`), 'utf8')) as Record<string, unknown>;

test('są dane co najmniej dla en i pl', () => { expect(klucze).toEqual(expect.arrayContaining(['en', 'pl'])); });

describe.each(klucze)('10-wydanie-020: dane zrzutów %s', (k) => {
  test('wzór sklepu istnieje dla klucza danych', () => { expect(Object.keys(WZORY_SKLEPU)).toContain(k); });
  test('projekt główny nazywa się tak jak wzór (kadry 03 i 04)', () => {
    expect(dane(k).PROJ_GLOWNY).toBe(WZORY_SKLEPU[k as KluczWzoru].nazwa);
  });
  test('pozostałe projekty mają różne nazwy, inne niż projekt główny i wzór', () => {
    const d = dane(k);
    const nazwy = [d.PROJ_GLOWNY, d.PROJ_2, d.PROJ_3, d.PROJ_4];
    nazwy.forEach((n) => expect(typeof n === 'string' && n.length > 0).toBe(true));
    expect(new Set(nazwy).size).toBe(4);
    expect([d.PROJ_2, d.PROJ_3, d.PROJ_4]).not.toContain(WZORY_SKLEPU[k as KluczWzoru].nazwa);
  });
});
