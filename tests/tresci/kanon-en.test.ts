/* M1-audytor-generalny-037 (06-tresci-002, TRE-13): tekst w produkcie = kanon roli 06. Migawka kanonu en (docs/tresci/kanon-en.json) generuje
 * w oczko-warsztat `narzedzia/kanon-vs-slownik.mjs --zapisz` (rola 06; ten sam skrypt bez --zapisz jest czerwony, gdy kanon zmieniono bez nowej
 * migawki). Tu: każde zdanie bloku kanonu (bez znaczników [T:…]) stoi w kluczach en.json według mapy; {x} i {{x}} porównuje się jako jedno. */
import * as fs from 'fs';
import * as path from 'path';

type Blok = { blok: string; plik: string; klucze: string[]; zdania: string[] };
const KORZEN = path.join(__dirname, '..', '..');
const czytaj = (p: string): unknown => JSON.parse(fs.readFileSync(path.join(KORZEN, p), 'utf8'));
const migawka = czytaj('docs/tresci/kanon-en.json') as { bloki: Blok[]; pominiete: Record<string, string> };
const en = czytaj('src/i18n/slowniki/en.json') as Record<string, unknown>;
const norm = (s: string): string => s.replace(/\{\{?\s*\w+\s*\}\}?/g, '{}').replace(/\s+/g, ' ').trim();
const wartosc = (k: string): unknown => k.split('.').reduce<unknown>((o, c) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[c] : undefined), en);
function brakujace(b: Blok): string[] {
  const teksty = b.klucze.map(wartosc);
  if (teksty.some((t) => typeof t !== 'string')) return [`brak klucza: ${b.klucze.join(', ')}`];
  const tekst = norm(teksty.join(' '));
  return b.zdania.filter((z) => !tekst.includes(norm(z)));
}

test('037: migawka kanonu ma bloki kalkulatora, rozmiarów i ekranu „Źródła wiedzy” (P-112 (2): tylko zdanie ogólne i linia CYC)', () => {
  const nazwy = migawka.bloki.map((b) => b.blok);
  for (const k of ['calc.note.category', 'calc.note.four_inches', 'calc.note.stitches', 'zrodla.zdanie', 'zrodla.linia_standardow']) expect(nazwy).toContain(k);
  expect(nazwy.filter((k) => k.startsWith('settings.sources'))).toEqual([]);
  expect(JSON.stringify(migawka)).not.toMatch(/NIST|TKGA|\[T:/);
});

test.each(migawka.bloki.map((b) => [b.blok, b] as const))('037: zdania kanonu %s stoją w en.json', (_n, b) => {
  expect(brakujace(b)).toEqual([]);
});

test('037: zmienione zdanie kanonu (np. inne słowo w zaleceniu blokowania) daje rozjazd — test jest czerwony, dopóki en.json nie pójdzie za kanonem', () => {
  const b = migawka.bloki.find((x) => x.blok === 'calc.note.category');
  expect(b).toBeDefined();
  const zmieniony = { ...(b as Blok), zdania: (b as Blok).zdania.map((z) => z.replace('Block your swatch', 'Wash your swatch')) };
  expect(brakujace(zmieniony)).toEqual(['Wash your swatch, then compare it with your pattern: patterns give gauge after blocking.']);
});
