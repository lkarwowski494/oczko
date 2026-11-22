// Łatka kluczy 04 fix-8 (P-275 (1); P-243 S2a, P-209): teksty ostateczne kosza i usunięcia wzoru w en.json i en.kontekst.json.
// Wyrocznia: docs/design/fix8-2026-10-27/klucze.json. Roboczy klucz 08 `usun.wzor_opis` zastąpiony kluczem 04 `wzor.usun_opis` (z {{data}}).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const LATKA = czytaj('docs/design/fix8-2026-10-27/klucze.json') as { en: Record<string, string>; kontekst: Record<string, string> };
const EN = czytaj('src/i18n/slowniki/en.json') as Record<string, Record<string, string>>;
const KONTEKST = czytaj('src/i18n/slowniki/en.kontekst.json') as Record<string, Record<string, string>>;
// Klucze kosza i usunięcia wzoru (P-275 (1)); klucze filmu dołączone do łatki w P-276 (wzor.film_zmien, udostepnij.*) nakłada partia 6 z kodem.
const MOJE = (k: string) => k.startsWith('kosz.') || k === 'wzor.usun_opis';
const wartosc = (s: Record<string, Record<string, string>>, klucz: string) => {
  const [sekcja, nazwa] = klucz.split('.');
  return s[sekcja]?.[nazwa];
};

test('każda wartość en kosza i usunięcia wzoru z łatki fix-8 jest w en.json bez zmian (8)', () => {
  for (const [k, v] of Object.entries(LATKA.en).filter(([k]) => MOJE(k))) expect([k, wartosc(EN, k)]).toEqual([k, v]);
});

test('każdy wpis kontekstu kosza i usunięcia wzoru z łatki fix-8 jest w en.kontekst.json bez zmian (6)', () => {
  for (const [k, v] of Object.entries(LATKA.kontekst).filter(([k]) => MOJE(k))) expect([k, wartosc(KONTEKST, k)]).toEqual([k, v]);
});

test('roboczy klucz usun.wzor_opis usunięty (tekst usunięcia wzoru = wzor.usun_opis z {{data}})', () => {
  expect([wartosc(EN, 'usun.wzor_opis'), wartosc(KONTEKST, 'usun.wzor_opis')]).toEqual([undefined, undefined]);
  expect(wartosc(EN, 'wzor.usun_opis')).toContain('{{data}}');
});

test('zakres łatki P-275 (1): 8 wartości i 6 kontekstów', () => {
  expect([Object.keys(LATKA.en).filter(MOJE).length, Object.keys(LATKA.kontekst).filter(MOJE).length]).toEqual([8, 6]);
});
