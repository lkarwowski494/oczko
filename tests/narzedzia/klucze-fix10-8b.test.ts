// Łatka kluczy 04 partii 8 (P-326, P-330) dla grupy 8b (licznik): historia (021), przypomnienia (011), baner źródła serii (014), licznik oczek (025).
// Wyrocznia: docs/design/fix10-2026-11-01/klucze.json. Kontekst liczby mnogiej leży na nazwie bazowej (konwencja projektu, bez _one/_other).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const LATKA = czytaj('docs/design/fix10-2026-11-01/klucze.json') as { en: Record<string, string>; kontekst: Record<string, string> };
const EN = czytaj('src/i18n/slowniki/en.json') as Record<string, Record<string, string>>;
const KONTEKST = czytaj('src/i18n/slowniki/en.kontekst.json') as Record<string, Record<string, string>>;
const MOJE = (k: string) => k.startsWith('historia.');
const baza = (nazwa: string) => nazwa.replace(/_(zero|one|two|few|many|other)$/, '');
const wartosc = (s: Record<string, Record<string, string>>, klucz: string) => { const [sekcja, ...n] = klucz.split('.'); return s[sekcja]?.[n.join('.')]; };

test('każda wartość en grupy 8b z łatki fix10 jest w en.json bez zmian', () => {
  const klucze = Object.entries(LATKA.en).filter(([k]) => MOJE(k));
  expect(klucze.length).toBeGreaterThan(0);
  for (const [k, v] of klucze) expect([k, wartosc(EN, k)]).toEqual([k, v]);
});
test('każdy kontekst grupy 8b jest w en.kontekst.json (na nazwie bazowej) bez zmian', () => {
  const klucze = Object.entries(LATKA.kontekst).filter(([k]) => MOJE(k) && !k.endsWith('_other')); // _other ma ten sam kontekst co _one
  expect(klucze.length).toBeGreaterThan(0);
  for (const [k, v] of klucze) expect([k, wartosc(KONTEKST, baza(k))]).toEqual([k, v]);
});
