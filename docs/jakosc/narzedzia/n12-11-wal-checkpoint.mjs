// N12-11 v2: proces piszący zabity SIGKILL (jak stopApp/awaria), potem zapiszKopie = nowe połączenie, odczyt, zamknięcie.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdtempSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12);
const wal = (p) => (existsSync(p + '-wal') ? statSync(p + '-wal').size : 'brak');
if (process.argv[2] === 'pisz') {
  const a = new DatabaseSync(process.argv[3]); a.exec("PRAGMA journal_mode=WAL; CREATE TABLE t(x); INSERT INTO t VALUES (1);");
  if (process.argv[4] === 'checkpoint') a.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  process.kill(process.pid, 'SIGKILL');
}
for (const tryb of ['checkpoint', 'bez']) {
  const p = join(mkdtempSync(join(process.argv[2], 'p')), 'oczko.db');
  spawnSync(process.execPath, [process.argv[1], 'pisz', p, tryb]);
  const przed = sha(p), walPrzed = wal(p);
  const b = new DatabaseSync(p); b.prepare('SELECT count(*) c FROM t').get(); b.close();
  console.log(`${tryb === 'checkpoint' ? 'checkpoint przed zabiciem (jak Ustawienia → shaPrzed)' : 'bez checkpointu'}: -wal ${walPrzed} B → ${wal(p)}; .db ${przed} → ${sha(p)}: ${przed === sha(p) ? 'TEN SAM' : 'INNY'}`);
}
