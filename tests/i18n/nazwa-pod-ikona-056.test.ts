// M1-audytor-generalny-056 (09-lokalizacja-011, LOK-02; DEC-14 a, P-157, P-174): nazwa pod ikoną (CFBundleDisplayName w locales/systemowe/<język>.json)
// to słowo marki z pola Name w sklepie (część przed „:”, docs/wydanie/metadane/nazwy.store.json). Języki bez strony w App Store Connect (bg, et, lt, lv, sr)
// nie mają pola Name, więc ich słowo marki stoi w tabeli poniżej (docs/wzrost.md „Nazwa w sklepie”, stan końcowy P-174).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const json = (p: string) => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const jezyki = readdirSync(join(KORZEN, 'locales', 'systemowe')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
const nazwy = json('docs/wydanie/metadane/nazwy.store.json').apple.info as Record<string, { title: string }>;

// Kod języka interfejsu → kod lokalizacji w App Store Connect (jak w tests/wydanie/asc-metadane.test.ts); tylko tam, gdzie się różnią.
const ASC: Record<string, string> = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', 'es-419': 'es-MX', pt: 'pt-PT', nl: 'nl-NL', nb: 'no' };
const BEZ_STRONY_SKLEPU: Record<string, string> = { bg: 'Oczko', et: 'Silmus', lt: 'Oczko', lv: 'Oczko', sr: 'Oczko' }; // P-174
const przedDwukropkiem = (tytul: string) => tytul.split(':')[0]!.trim();

describe('nazwa pod ikoną = słowo marki w sklepie (P-157, DEC-14 a)', () => {
  test('35 języków; każdy ma nazwę w sklepie albo wpis w tabeli języków bez strony sklepu', () => {
    expect(jezyki).toHaveLength(35);
    for (const j of jezyki) expect([j, (ASC[j] ?? j) in nazwy || j in BEZ_STRONY_SKLEPU]).toEqual([j, true]);
  });
  test.each(jezyki)('%s: CFBundleDisplayName = część nazwy w sklepie przed „:”', (j) => {
    const ikona = json(`locales/systemowe/${j}.json`).ios.CFBundleDisplayName as string;
    const oczekiwana = j in BEZ_STRONY_SKLEPU ? BEZ_STRONY_SKLEPU[j]! : przedDwukropkiem(nazwy[ASC[j] ?? j]!.title);
    expect([j, ikona]).toEqual([j, oczekiwana]);
  });
  test('lokalne słowo marki w 14 językach (z pl), „Oczko” w pozostałych 21 (P-174)', () => {
    const slowa = jezyki.map((j) => json(`locales/systemowe/${j}.json`).ios.CFBundleDisplayName as string);
    expect(slowa.filter((s) => s !== 'Oczko')).toHaveLength(13);
    expect(jezyki.filter((j) => j !== 'pl' && json(`locales/systemowe/${j}.json`).ios.CFBundleDisplayName !== 'Oczko').sort())
      .toEqual(['de', 'et', 'fi', 'hr', 'hu', 'ja', 'ms', 'pt', 'ro', 'ru', 'sv', 'uk', 'zh-Hant']);
  });
  test('słowo pod ikoną ma najwyżej 30 znaków (pole Name w sklepie: limit Apple)', () => {
    for (const j of jezyki) expect([j, [...(json(`locales/systemowe/${j}.json`).ios.CFBundleDisplayName as string)].length <= 30]).toEqual([j, true]);
  });
});
