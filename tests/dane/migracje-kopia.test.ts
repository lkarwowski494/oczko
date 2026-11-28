// Migracje aplikacji = dokument roli 05 (dane.md „Polityka migracji”: 0001.sql = schemat.sql v1) i kopia TS aktualna (Metro nie importuje .sql).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { MIGRACJE } from '../../src/dane/migracje/sql';
import { KORZEN } from './pomocnicze/dane-wejsciowe';

// Wydana migracja 0001 (1.0.0 i 1.0.1; tag v1.0.1-b1241 @ 585ccf3b) nie zmienia się nigdy (dane.md „Polityka migracji”); od 1.0.2 docs/architektura/schemat.sql
// opisuje stan wersji 2, więc dawna równość bajtów 0001.sql = schemat.sql zastąpiona sumą kontrolną wydanego pliku; zgodność kolumn: schemat-migracje.test.ts. P-1122.
test('NFR-DAN-001 dane.md: src/dane/migracje/0001.sql jest bajt w bajt taki jak w wydanej 1.0.1 (SHA-256)', () => {
  expect(createHash('sha256').update(readFileSync(join(KORZEN, 'src/dane/migracje/0001.sql'))).digest('hex')).toBe('b8206b173178b26ac7ad49808302b58528ffc59258560ae34c30f9961db48b19');
});
test('NFR-DAN-001: sql.ts zgodny z plikami .sql (generuj-migracje --check), wersje 1..N bez luk', () => {
  const w = spawnSync(process.execPath, [join(KORZEN, 'scripts/dane/generuj-migracje.mjs'), '--check'], { encoding: 'utf8' });
  expect({ kod: w.status, blad: w.stderr }).toEqual({ kod: 0, blad: '' });
  expect(MIGRACJE.map((m) => m.wersja)).toEqual(MIGRACJE.map((_, i) => i + 1));
});
