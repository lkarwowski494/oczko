// Łatka kluczy 04 fix-8, część filmu (P-276; klucze dołączone do łatki fix-8, nakłada partia 6 z kodem): en.json i en.kontekst.json.
// Wyrocznia: docs/design/fix8-2026-10-27/klucze.json (część kosza: klucze-fix8.test.ts, partia 7).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const LATKA = czytaj('docs/design/fix8-2026-10-27/klucze.json') as { en: Record<string, string>; kontekst: Record<string, string> };
const FILM = ['wzor.film_zmien', 'udostepnij.film_zastapi', 'udostepnij.do_projektu_film'];
const wartosc = (s: Record<string, Record<string, string>>, k: string) => { const [a, b] = k.split('.'); return s[a]?.[b]; };

test.each(['src/i18n/slowniki/en.json', 'src/i18n/slowniki/en.kontekst.json'])('P-276: klucze filmu z łatki fix-8 w %s bez zmian (3)', (plik) => {
  const zrodlo = plik.includes('kontekst') ? LATKA.kontekst : LATKA.en;
  const s = czytaj(plik) as Record<string, Record<string, string>>;
  expect(FILM.map((k) => [k, wartosc(s, k)])).toEqual(FILM.map((k) => [k, zrodlo[k]]));
});
