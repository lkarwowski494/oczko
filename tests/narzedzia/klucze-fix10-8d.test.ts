// Łatka kluczy 04 partii 8 (P-326, P-330) dla grupy 8d: notatka na wzorze (007). Wyrocznia: docs/design/fix10-2026-11-01/klucze.json.
// Klucze kolejnych ID grupy 8d dopisuje ich commit. `wzor.notatka_edytuj` to tekst roboczy 08 (brak w łatce 04, do akceptacji).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const LATKA = czytaj('docs/design/fix10-2026-11-01/klucze.json') as { en: Record<string, string>; kontekst: Record<string, string> };
const EN = czytaj('src/i18n/slowniki/en.json') as Record<string, Record<string, string>>;
const KONTEKST = czytaj('src/i18n/slowniki/en.kontekst.json') as Record<string, Record<string, string>>;
const MOJE = ['wzor.notatka_chip', 'wzor.notatka_chip_a11y', 'wzor.notatki_wiele_one', 'wzor.notatki_wiele_other', 'wzor.notatki_tytul', 'wzor.notatka_tytul',
  'wzor.notatka_usun', 'wzor.notatka_usun_tytul', 'wzor.notatka_usun_opis'];
const wartosc = (s: Record<string, Record<string, string>>, klucz: string) => { const [sekcja, nazwa] = klucz.split('.'); return s[sekcja ?? '']?.[nazwa ?? '']; };
// Konteksty kluczy mnogich leżą pod kluczem bazowym (c3f6678).
const kontekstKlucza = (k: string) => k.replace(/_(one|other)$/, '');

test('007: każda wartość en z łatki fix10 dla notatki na wzorze jest w en.json bez zmian', () => {
  for (const k of MOJE) expect([k, wartosc(EN, k)]).toEqual([k, LATKA.en[k]]);
});
test('007: konteksty tych kluczy są w en.kontekst.json bez zmian (mnogie pod kluczem bazowym)', () => {
  for (const k of MOJE) expect([k, wartosc(KONTEKST, kontekstKlucza(k))]).toEqual([k, LATKA.kontekst[k.endsWith('_other') ? k.replace('_other', '_one') : k]]);
});
