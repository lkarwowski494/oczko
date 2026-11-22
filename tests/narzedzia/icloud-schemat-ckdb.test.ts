// cloudkit/schemat.ckdb z generatora (moduly.md „Kontrakt partii 7” → „Schemat CloudKit”): każda kolumna synchronizowanej tabeli poza `pomin`
// = pole typu rekordu z icloud-tabele.json, `plik.dane` = ASSET; plik w repo = wynik generatora (zmiany schematu CloudKit tylko dodające, P-091).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const GEN = join(KORZEN, 'scripts/icloud/generuj-schemat-ckdb.mjs');
const KONTRAKT: { tabele: { tabela: string; typ: string; pomin?: string[] }[] } = JSON.parse(readFileSync(join(KORZEN, 'docs/architektura/icloud-tabele.json'), 'utf8'));
const wynik = () => execFileSync('node', [GEN, '--stdout'], { encoding: 'utf8' });
const blok = (s: string, typ: string) => s.slice(s.indexOf(`RECORD TYPE ${typ} (`), s.indexOf(');', s.indexOf(`RECORD TYPE ${typ} (`)));

test('plik w repo = wynik generatora (--check kod 0)', () => {
  expect(() => execFileSync('node', [GEN, '--check'], { encoding: 'utf8' })).not.toThrow();
  expect(readFileSync(join(KORZEN, 'cloudkit/schemat.ckdb'), 'utf8')).toBe(wynik());
});
test('typ rekordu dla każdej tabeli kontraktu; kolumny pomin nie są polami; plik.dane = ASSET; typy kolumn SQLite → CloudKit', () => {
  const s = wynik();
  expect(s.startsWith('DEFINE SCHEMA\n')).toBe(true);
  for (const t of KONTRAKT.tabele) expect(s).toContain(`RECORD TYPE ${t.typ} (`);
  const licznik = blok(s, 'Licznik');
  for (const k of ['wartosc', 'glowa', 'konflikt']) expect(licznik).not.toMatch(new RegExp(`^\\s+${k} `, 'm'));
  expect(licznik).toMatch(/^\s+czesc_id\s+STRING,$/m);
  expect(licznik).toMatch(/^\s+zmieniono_ms\s+INT64,$/m);
  expect(blok(s, 'Plik')).toMatch(/^\s+dane\s+ASSET,$/m);
  expect(blok(s, 'Zdarzenie')).toMatch(/^\s+urzadzenie_rodzaj\s+STRING,$/m);
  expect(s).not.toContain('RECORD TYPE Poczekalnia');
});
