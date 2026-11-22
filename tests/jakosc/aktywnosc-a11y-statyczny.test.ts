// 07-jakosc-030 (design-spec „Ekran blokady i zegarek”, VoiceOver): etykiety VoiceOver Live Activity używają kluczy z generatora tekstów (Teksty.swift).
// Test statyczny: Swift nie uruchamia się w Linuksie (bez Xcode); sprawdzenie na urządzeniu to krok właściciela (VoiceOver na ekranie blokady, Smart Stack).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const swift = (p: string) => readFileSync(join(KORZEN, 'targets/widget', p), 'utf8');
const AKTYWNOSC = swift('Aktywnosc.swift');
const TEKSTY = swift('Teksty.swift');
/** Wartość klucza angielskiego w słowniku Swift (`"klucz": "tekst"` w bloku "en"). */
const en = (klucz: string): string | undefined => new RegExp(`"${klucz}": "([^"]*)"`).exec(TEKSTY)?.[1];
const wywolania = [...AKTYWNOSC.matchAll(/Teksty\.(t|tl)\("(\w+)"[^\n]*/g)].map((m) => ({ fn: m[1], klucz: m[2] ?? '', wiersz: m[0] }));

test('030: etykiety VoiceOver karty i przycisku +1 z kluczy karta_a11y, zablokowany_a11y i plus_a11y_przypomnienie', () => {
  const uzyte = new Set(wywolania.map((w) => w.klucz));
  for (const k of ['karta_a11y', 'zablokowany_a11y', 'plus_a11y_przypomnienie', 'plus_a11y', 'przypomnienie_a11y']) expect([k, uzyte.has(k)]).toEqual([k, true]);
});
test('030: każdy klucz użyty w Aktywnosc.swift istnieje w Teksty.swift, a wywołanie podaje wszystkie parametry tekstu', () => {
  expect(wywolania.length).toBeGreaterThan(10);
  for (const w of wywolania) {
    const tekst = en(w.klucz) ?? en(`${w.klucz}_other`);
    expect([w.klucz, tekst !== undefined]).toEqual([w.klucz, true]);
    const potrzebne = [...(tekst ?? '').matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1] ?? '').filter((p) => !(w.fn === 'tl' && p === 'count'));
    if (!w.wiersz.includes('["')) continue; // parametry podane zmienną (np. `p` w Pas) — statycznie nie do odczytania; klucz sprawdzony wyżej
    const podane = new Set([...w.wiersz.matchAll(/"(\w+)":/g)].map((m) => m[1]));
    for (const p of potrzebne) expect([w.klucz, p, podane.has(p)]).toEqual([w.klucz, p, true]);
  }
});
