// 07-jakosc-017 (F-55, K-17h, ADR-0031 pkt 5): jedna reguła rozszerzeń — Word to wyłącznie .docx; .doc i application/msword → null (alert `wzor.blad_typ`).
// Reguła TS i arkusz udostępniania (targets/share/Info.plist, Swift `rodzajZalacznika`) mówią o Wordzie to samo.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UTI_WORD, rodzajPliku } from '../../src/domena/rodzaj-pliku';

const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const KORZEN = join(__dirname, '../..');

test.each([
  ['wzor.pdf', 'application/pdf', 'pdf'],
  ['Wzor.PDF', '', 'pdf'],
  ['skan', 'com.adobe.pdf', 'pdf'],
  ['wzor.docx', MIME_DOCX, 'word'],
  ['Wzor.DOCX', '', 'word'],
  ['dokument', UTI_WORD, 'word'],
  ['wzor.docx', 'public.data', 'word'],
  ['1.jpg', 'image/jpeg', 'obraz'],
  ['1.heic', 'public.heic', 'obraz'],
  ['1', 'public.image', 'obraz'],
] as const)('rodzajPliku(%j, %j) → %s', (nazwa, typ, oczekiwany) => {
  expect(rodzajPliku(nazwa, typ)).toBe(oczekiwany);
});

test.each([
  ['stary.doc', 'application/msword'],
  ['stary.doc', ''],
  ['stary', 'application/msword'],
  ['stary', 'com.microsoft.word.doc'],
  ['arkusz.xlsx', 'application/vnd.ms-excel'],
  ['notatki.txt', 'public.plain-text'],
  ['', ''],
])('K-17h: rodzajPliku(%j, %j) → null (.doc i inne typy poza regułą)', (nazwa, typ) => {
  expect(rodzajPliku(nazwa, typ)).toBeNull();
});

// Zgodność reguły aktywacji arkusza z regułą TS: Word w `Info.plist` wyłącznie jako .docx, a Swift klasyfikuje Word tym samym UTI.
const utiWZasadzie = (tekst: string): string[] => [...tekst.matchAll(/UTI-CONFORMS-TO &quot;([^&]+?)&quot;|UTI-CONFORMS-TO "([^"]+)"/g)].map((m) => m[1] ?? m[2] ?? '');
test('K-17h: lista UTI w targets/share/Info.plist zawiera Word wyłącznie jako org.openxmlformats…wordprocessingml.document', () => {
  const plist = readFileSync(join(KORZEN, 'targets/share/Info.plist'), 'utf8');
  const uti = utiWZasadzie(plist);
  expect(uti.length).toBeGreaterThan(3);
  const word = uti.filter((u) => /word|msword|doc\b/i.test(u));
  expect(word.length).toBeGreaterThan(0);
  expect([...new Set(word)]).toEqual([UTI_WORD]);
});
test('K-17h: Swift `rodzajZalacznika` (moduł i rozszerzenie) rozpoznaje jako Word tylko UTI .docx', () => {
  for (const plik of ['modules/oczko-wzor/Pakiet/Sources/OczkoWzorLogika/Skrzynka.swift', 'targets/share/Wspolne/Skrzynka.swift']) {
    const swift = readFileSync(join(KORZEN, plik), 'utf8');
    const wiersz = swift.split('\n').find((w) => /return \.word/.test(w)) ?? '';
    expect(wiersz).toContain(UTI_WORD);
    expect(wiersz).not.toMatch(/com\.microsoft\.word\.doc|msword/i);
  }
});
