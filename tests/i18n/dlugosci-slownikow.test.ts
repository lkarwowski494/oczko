// Kontrola długości etykiet (scripts/i18n/dlugosci.mjs, orientacyjna; ostateczna ocena na zrzutach 320 pt, rola 04): po fali 2026-11-03 (P-474) mierzy
// bieżące słowniki src/i18n/slowniki (stan prawdy), a nie propozycje fali 1 z docs/lokalizacja/przeklad-api. Raport nie jest bramką (kod 0), ale ma być prawdziwy.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const SKRYPT = join(KORZEN, 'scripts', 'i18n', 'dlugosci.mjs');
const uruchom = (args: string[], cwd = KORZEN) => spawnSync(process.execPath, [SKRYPT, ...args], { cwd, encoding: 'utf8' });

test('domyślnie mierzy bieżące słowniki: 34 języki (poza en), nagłówek wskazuje źródło, kod 0', () => {
  const r = uruchom([]);
  expect(r.status).toBe(0);
  expect(r.stdout).toMatch(/Źródło: src\/i18n\/slowniki/);
  const wiersze = r.stdout.split('\n').filter((l) => /^\| [A-Za-z0-9-]+ \| \d+ \| \d+ \|/.test(l));
  expect(wiersze).toHaveLength(34);
  expect(wiersze.map((l) => l.split('|')[1]!.trim())).not.toContain('en');
});

test('mierzy to, co jest w słowniku: wydłużony tekst z limitem „ok. N znaków” trafia do raportu (próba na kopii katalogu)', () => {
  const d = mkdtempSync(join(tmpdir(), 'dl-'));
  mkdirSync(join(d, 'src/i18n/slowniki'), { recursive: true });
  writeFileSync(join(d, 'src/i18n/slowniki/en.json'), JSON.stringify({ a: { b: 'Save' } }));
  writeFileSync(join(d, 'src/i18n/slowniki/en.kontekst.json'), JSON.stringify({ a: { b: 'Przycisk, ok. 8 znaków.' } }));
  writeFileSync(join(d, 'src/i18n/slowniki/de.json'), JSON.stringify({ a: { b: 'Änderungen speichern jetzt' } }));
  writeFileSync(join(d, 'src/i18n/slowniki/fr.json'), JSON.stringify({ a: { b: 'Enregistrer' } }));
  const r = uruchom([], d);
  expect(r.status).toBe(0);
  expect(r.stdout).toMatch(/\| de \| 1 \| 1 \| a\.b 26\/8 \|/);
  expect(r.stdout).toMatch(/\| fr \| 1 \| 1 \| a\.b 11\/8 \|/);
});

test('--zrodlo propozycje zachowuje stary tryb (docs/lokalizacja/przeklad-api, pole slownik)', () => {
  const r = uruchom(['--zrodlo', 'propozycje']);
  expect(r.status).toBe(0);
  expect(r.stdout).toMatch(/Źródło: docs\/lokalizacja\/przeklad-api/);
});
