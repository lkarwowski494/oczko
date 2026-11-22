import { DatabaseSync } from 'node:sqlite'; import { copyFileSync, existsSync, statSync } from 'node:fs';
const d = process.argv[2]; const db = new DatabaseSync(`${d}/app.db`);
db.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE t(x INTEGER); PRAGMA wal_checkpoint(TRUNCATE);");
const ins = db.prepare('INSERT INTO t VALUES (?)'); for (let i = 0; i < 100; i++) ins.run(i);
console.log('wal bajty', statSync(`${d}/app.db-wal`).size);
copyFileSync(`${d}/app.db`, `${d}/sam-plik.db`);
db.exec(`VACUUM INTO '${d}/vacuum-into.db'`);
for (const f of ['sam-plik.db', 'vacuum-into.db']) {
  const k = new DatabaseSync(`${d}/${f}`);
  const n = k.prepare('SELECT count(*) n FROM t').get().n; const ic = k.prepare('PRAGMA integrity_check').get();
  console.log(f, 'wiersze', n, 'integrity', Object.values(ic)[0], 'wal obok', existsSync(`${d}/${f}-wal`)); k.close();
}
