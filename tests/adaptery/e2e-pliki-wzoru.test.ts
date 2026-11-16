// Pliki testowe buildu E2E dla wzoru (scenariusze 24, 25): .docx to poprawny ZIP z word/document.xml i treścią syntetyczną; adres strony w domenie
// zastrzeżonej do przykładów (RFC 2606) — bez nazw innych firm (P-121 (5)).
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { ADRES_STRONY_TESTOWEJ, pdfSkanuTestowy, wordTestowy } from '../../src/kompozycja/e2e/pliki-wzoru';

test('wordTestowy: ZIP z word/document.xml zawierającym tekst wzoru', () => {
  const b = readFileSync(wordTestowy(mkdtempSync(join(tmpdir(), 'oczko-e2e-'))));
  expect(b.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  let i = 0, xml = '';
  while ((i = b.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), i)) >= 0) {
    const metoda = b.readUInt16LE(i + 8), rozmiar = b.readUInt32LE(i + 18), n = b.readUInt16LE(i + 26), e = b.readUInt16LE(i + 28);
    const nazwa = b.subarray(i + 30, i + 30 + n).toString();
    const dane = b.subarray(i + 30 + n + e, i + 30 + n + e + rozmiar);
    if (nazwa === 'word/document.xml') xml = (metoda === 8 ? inflateRawSync(dane) : dane).toString();
    i += 4;
  }
  expect(xml).toContain('Cast on 20 stitches.');
});
test('adres strony testowej: https w domenie przykładowej', () => {
  expect(ADRES_STRONY_TESTOWEJ).toBe('https://example.org/');
});

// P-282 (W1-A zawężony): tabela i obraz z korpusu W1 w buildzie E2E — bajty identyczne z plikami korpusu (jedno źródło: TestyOknaMaszyn/Testy/korpus).
const KORPUS = 'modules/oczko-wzor/TestyOknaMaszyn/Testy/korpus';
test.each(['tekst', 'tabela', 'obraz', 'strony'] as const)('wordTestowy(%s): bajty = korpus W1', (rodzaj) => {
  const b = readFileSync(wordTestowy(mkdtempSync(join(tmpdir(), 'oczko-e2e-')), rodzaj));
  expect(b.equals(readFileSync(join(KORPUS, `${rodzaj}.docx`)))).toBe(true);
});

// M1-audytor-generalny-067 (07-jakosc-002, P-439 (1a)): prawdziwy wycinek skanu z OCR w buildzie E2E (scenariusz 21) — bajty identyczne z plikiem
// danych testowych (jedno źródło: tests/dane/wzory, opis pochodzenia i wyrocznia w *.opis.md), dwie strony jak w opisie.
const WYCINEK_SKANU = 'tests/dane/wzory/corbould-1879-s16-17.pdf';
test('pdfSkanuTestowy: bajty = wycinek skanu z tests/dane, 2 strony, bez metadanych', () => {
  const b = readFileSync(pdfSkanuTestowy(mkdtempSync(join(tmpdir(), 'oczko-e2e-'))));
  expect(b.equals(readFileSync(WYCINEK_SKANU))).toBe(true);
  const tekst = b.toString('latin1');
  expect(tekst.startsWith('%PDF-')).toBe(true);
  expect(tekst.match(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/)?.[1]).toBe('2');
  expect(tekst).not.toMatch(/\/Author\s*\(/);
});

// PU-057 (KO-092, P-907): oczekiwana liczba stron „Page N of N” wynika z KONSTRUKCJI pliku, nie z wyniku konwersji (JAK-02: wynik liczony przez testowany kod nie może być wzorcem).
// `strony.docx` = 3 akapity z treścią rozdzielone 2 wymuszonymi podziałami strony (`w:br w:type="page"`) → dokładnie 3 strony, żadna pusta; scenariusz 119 oczekuje „Page 3 of 3”.
test('PU-057 · strony.docx: 3 strony z treścią rozdzielone 2 wymuszonymi podziałami (N = 3 z konstrukcji pliku)', () => {
  const b = readFileSync(wordTestowy(mkdtempSync(join(tmpdir(), 'oczko-e2e-')), 'strony'));
  let i = 0, xml = '';
  while ((i = b.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), i)) >= 0) {
    const metoda = b.readUInt16LE(i + 8), rozmiar = b.readUInt32LE(i + 18), n = b.readUInt16LE(i + 26), e = b.readUInt16LE(i + 28);
    const nazwa = b.subarray(i + 30, i + 30 + n).toString();
    const dane = b.subarray(i + 30 + n + e, i + 30 + n + e + rozmiar);
    if (nazwa === 'word/document.xml') xml = (metoda === 8 ? inflateRawSync(dane) : dane).toString();
    i += 4;
  }
  const podzialy = xml.match(/<w:br w:type="page"\/>/g) ?? [];
  expect(podzialy).toHaveLength(2);
  const strony = xml.split('<w:br w:type="page"/>').map((czesc) => [...czesc.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('').trim());
  expect(strony).toHaveLength(3);
  for (const tekst of strony) expect(tekst.length).toBeGreaterThan(10); // każda strona ma treść
});
