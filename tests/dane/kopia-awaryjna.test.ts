// P-203 (07 fix-3 Q6a, N12-11): „Zapisz kopię” w trybie awaryjnym nie zmienia oryginału także przy niepustym WAL (ADR-0019 „oryginał bez zmian”).
// Baza pisana przez proces zabity SIGKILL (jak awaria w trakcie pracy) zostawia niepusty `-wal`; po zapisie kopii `.db` ma ten sam SHA-256,
// a `-wal` zostaje. Wyrocznia: eksperyment 07 `docs/jakosc/narzedzia/n12-11-wal-checkpoint.mjs` (zamknięcie połączenia robi checkpoint).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kopiaAwaryjna } from '../../src/kompozycja/kopia-awaryjna';
import { sha256Pliku, zegarTestowy } from './pomocnicze/srodowisko';

const PISARZ = `
const { DatabaseSync } = require('node:sqlite'); const fs = require('node:fs');
const db = new DatabaseSync(process.argv[1]);
db.exec(fs.readFileSync(process.argv[2], 'utf8'));
db.exec("PRAGMA journal_mode = WAL; PRAGMA wal_autocheckpoint = 0;");
db.exec("INSERT INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES ('p1', 'Sweter', 1, 1, 1)");
process.kill(process.pid, 'SIGKILL');`;

test('niepusty WAL: kopia powstaje z wierszem z WAL, `.db` bez zmian (SHA), `-wal` zostaje', async () => {
  const k = mkdtempSync(join(tmpdir(), 'awaryjna-'));
  const baza = join(k, 'oczko.db');
  spawnSync(process.execPath, ['-e', PISARZ, baza, join(__dirname, '../../src/dane/migracje/0001.sql')]);
  expect(statSync(`${baza}-wal`).size).toBeGreaterThan(0);
  const przed = sha256Pliku(baza);
  const katalogi = { kopie: join(k, 'kopie'), kopiePrzed: join(k, 'Documents', 'Backup'), tymczasowy: join(k, 'tmp') };
  for (const d of [katalogi.kopie, katalogi.tymczasowy, join(k, 'pliki')]) mkdirSync(d, { recursive: true });
  const w = await kopiaAwaryjna({ sciezkaBazy: baza, pliki: join(k, 'pliki'), zegar: zegarTestowy(), katalogi }).zapisz();
  expect(w?.licznosci.projekt).toBe(1);
  expect(sha256Pliku(baza)).toBe(przed);
  expect(existsSync(`${baza}-wal`) && statSync(`${baza}-wal`).size > 0).toBe(true);
});
