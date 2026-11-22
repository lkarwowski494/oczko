const { DatabaseSync } = require('node:sqlite');
const fs = require('fs'); const path = require('path');
const dir = process.argv[2]; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const src = path.join(dir, 'zrodlo.db');
const db = new DatabaseSync(src);
console.log('journal_mode', db.prepare('PRAGMA journal_mode=WAL').get().journal_mode);
db.exec('PRAGMA wal_autocheckpoint=0');
db.exec('CREATE TABLE t(id INTEGER PRIMARY KEY, v TEXT)');
db.exec("PRAGMA wal_checkpoint(TRUNCATE)"); // schemat w pliku glownym
db.exec('BEGIN'); for (let i = 0; i < 100; i++) db.prepare('INSERT INTO t(v) VALUES(?)').run('w' + i); db.exec('COMMIT');
console.log('wiersze w zrodle:', db.prepare('SELECT count(*) c FROM t').get().c, '| rozmiar -wal:', fs.statSync(src + '-wal').size, 'B');
fs.copyFileSync(src, path.join(dir, 'kopia-pliku.db'));
db.exec(`VACUUM INTO '${path.join(dir, 'vacuum-into.db')}'`);
for (const f of ['kopia-pliku.db', 'vacuum-into.db']) {
  const c = new DatabaseSync(path.join(dir, f), { readOnly: false });
  let n; try { n = c.prepare('SELECT count(*) c FROM t').get().c; } catch (e) { n = 'blad: ' + e.message; }
  console.log(f, '-> wiersze:', n, '| integrity_check:', c.prepare('PRAGMA integrity_check').get().integrity_check); c.close();
}
db.close();
