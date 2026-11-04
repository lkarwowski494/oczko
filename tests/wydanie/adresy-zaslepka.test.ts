// 07-jakosc-008 (BR-DAN-012/S3, D4 z P-325): build wydania nie może zawierać adresu „Rate Oczko” z zaślepką identyfikatora App Store (id0000000000).
// Skrypt scripts/wydanie/kontrola-adresow.mjs czyta src/kompozycja/adresy.ts; woła go kontrola-ipa.sh. Prawdziwe Apple ID wpisuje rola 10 po kroku A5 (odczyt z API ASC).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const SKRYPT = join(KORZEN, 'scripts/wydanie/kontrola-adresow.mjs');
const uruchom = (zrodlo: string) => {
  const p = join(mkdtempSync(join(tmpdir(), 'adresy-')), 'adresy.ts');
  writeFileSync(p, zrodlo);
  return spawnSync(process.execPath, [SKRYPT, p], { encoding: 'utf8' });
};
const adresy = (id: string) => `export const ADRESY = {\n  recenzja: 'https://apps.apple.com/app/id${id}?action=write-review',\n} as const;\n`;

test('zaślepka id0000000000 → kod 1 z nazwą problemu', () => {
  const w = uruchom(adresy('0000000000'));
  expect(w.status).toBe(1);
  expect(w.stdout + w.stderr).toMatch(/zaślepk/);
});
test.each(['0', '00000', '000000000000'])('każde id złożone z samych zer (%s) → kod 1', (zera) => {
  expect(uruchom(adresy(zera)).status).toBe(1);
});
test('prawdziwe Apple ID (cyfry, nie same zera) → kod 0', () => {
  const w = uruchom(adresy('6451234567'));
  expect(w.status).toBe(0);
});
test('brak adresu recenzji w pliku → kod 1 (kontrola nie przechodzi po cichu)', () => {
  expect(uruchom('export const ADRESY = {} as const;\n').status).toBe(1);
});
test('kontrola-ipa.sh woła kontrolę adresów jako BŁĄD wydania', () => {
  const sh = readFileSync(join(KORZEN, 'scripts/wydanie/kontrola-ipa.sh'), 'utf8');
  expect(sh).toMatch(/node scripts\/wydanie\/kontrola-adresow\.mjs[^\n]*bledy=\$\(\(bledy \+ 1\)\)/);
});
// M1-audytor-generalny-202 (10-wydanie-001, P-533): prawdziwy plik aplikacji ma Apple ID z App Store Connect (właściciel 2026-11-04), nie zaślepkę.
test('src/kompozycja/adresy.ts: adres „Rate Oczko” z Apple ID 6823678721 → kontrola kod 0', () => {
  const w = spawnSync(process.execPath, [SKRYPT, join(KORZEN, 'src/kompozycja/adresy.ts')], { encoding: 'utf8' });
  expect(w.status).toBe(0);
  expect(readFileSync(join(KORZEN, 'src/kompozycja/adresy.ts'), 'utf8')).toContain("recenzja: 'https://apps.apple.com/app/id6823678721?action=write-review'");
});
