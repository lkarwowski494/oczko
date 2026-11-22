// Migracje aplikacji = dokument roli 05 (dane.md „Polityka migracji”: 0001.sql = schemat.sql v1) i kopia TS aktualna (Metro nie importuje .sql).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { MIGRACJE } from '../../src/dane/migracje/sql';
import { KORZEN } from './pomocnicze/dane-wejsciowe';

test('NFR-DAN-001 dane.md: src/dane/migracje/0001.sql jest bajt w bajt równy docs/architektura/schemat.sql (schemat v1 niewydany, P-110)', () => {
  expect(readFileSync(join(KORZEN, 'src/dane/migracje/0001.sql'), 'utf8')).toBe(readFileSync(join(KORZEN, 'docs/architektura/schemat.sql'), 'utf8'));
});
test('NFR-DAN-001: sql.ts zgodny z plikami .sql (generuj-migracje --check), wersje 1..N bez luk', () => {
  const w = spawnSync(process.execPath, [join(KORZEN, 'scripts/dane/generuj-migracje.mjs'), '--check'], { encoding: 'utf8' });
  expect({ kod: w.status, blad: w.stderr }).toEqual({ kod: 0, blad: '' });
  expect(MIGRACJE.map((m) => m.wersja)).toEqual(MIGRACJE.map((_, i) => i + 1));
});
