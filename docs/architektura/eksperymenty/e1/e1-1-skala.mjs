// E1-1 (ADR-0001): SQLite a plik JSON przy 150 000 zdarzeń (szacunek 3-letni, profil intensywny, E0 §3).
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, renameSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
const dir = mkdtempSync(join(tmpdir(), 'e1-'));
const N = 150_000, LICZNIKI = 180, t0 = Date.UTC(2026, 0, 1);
const db = new DatabaseSync(join(dir, 'b.db'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE licznik(id TEXT PRIMARY KEY, wartosc INTEGER NOT NULL) STRICT;
CREATE TABLE zdarzenie(id TEXT PRIMARY KEY, licznik_id TEXT NOT NULL REFERENCES licznik(id) ON DELETE CASCADE, czas_ms INTEGER NOT NULL, dzien TEXT NOT NULL, rodzaj TEXT NOT NULL CHECK(rodzaj IN ('plus','minus','wpisanie','zerowanie')), wartosc_po INTEGER NOT NULL) STRICT;
CREATE INDEX zdarzenie_licznik_czas ON zdarzenie(licznik_id, czas_ms);
CREATE INDEX zdarzenie_dzien ON zdarzenie(dzien);
CREATE TABLE dzien_limitu(dzien TEXT PRIMARY KEY, pro INTEGER NOT NULL) STRICT;`);
const insL = db.prepare('INSERT INTO licznik VALUES (?,0)');
const insZ = db.prepare('INSERT INTO zdarzenie VALUES (?,?,?,?,?,?)');
db.exec('BEGIN'); for (let i = 0; i < LICZNIKI; i++) insL.run('L' + i);
const zdarzenia = [];
for (let i = 0; i < N; i++) { const czas = t0 + Math.floor(i / 200) * 86400e3 * 1.4 + (i % 200) * 60e3; const z = { id: 'Z' + i, l: 'L' + (Math.floor(i / 830) % LICZNIKI), czas, dzien: new Date(czas).toISOString().slice(0, 10), r: 'plus', po: i % 200 };
  zdarzenia.push(z); insZ.run(z.id, z.l, z.czas, z.dzien, z.r, z.po); }
db.exec('COMMIT');
// Jedno +1: zdarzenie + licznik + dzień limitu w jednej transakcji (UPSERT), 20 powtórzeń, p50/p95.
const upd = db.prepare('UPDATE licznik SET wartosc = wartosc + 1 WHERE id = ?');
const dz = db.prepare("INSERT INTO dzien_limitu VALUES (?,0) ON CONFLICT(dzien) DO NOTHING");
const czasy = [];
for (let k = 0; k < 20; k++) { const s = performance.now(); db.exec('BEGIN'); insZ.run('N' + k, 'L1', Date.now(), '2026-10-22', 'plus', k); upd.run('L1'); dz.run('2026-10-22'); db.exec('COMMIT'); czasy.push(performance.now() - s); }
const pc = (a, p) => [...a].sort((x, y) => x - y)[Math.ceil(p * a.length) - 1].toFixed(3);
console.log(`SQLite +1 (transakcja 3 zapisów) na ${N} zdarzeniach: p50 ${pc(czasy, .5)} ms, p95 ${pc(czasy, .95)} ms (Linux, Node ${process.version}, SQLite ${db.prepare('select sqlite_version() v').get().v}; nie iPhone)`);
const plan = (q) => db.prepare('EXPLAIN QUERY PLAN ' + q).all().map((r) => r.detail).join(' | ');
const qHist = "SELECT * FROM zdarzenie WHERE licznik_id='L1' ORDER BY czas_ms DESC LIMIT 50";
const qKal = "SELECT dzien, count(*) n FROM zdarzenie WHERE dzien BETWEEN '2026-10-01' AND '2026-10-31' GROUP BY dzien";
for (const [n, q] of [['historia licznika', qHist], ['kalendarz miesiąca', qKal]]) { const t = []; for (let k = 0; k < 20; k++) { const s = performance.now(); db.prepare(q).all(); t.push(performance.now() - s); } console.log(`${n}: plan [${plan(q)}]; p95 ${pc(t, .95)} ms`); }
console.log('rozmiar bazy po checkpoint:', (db.exec('PRAGMA wal_checkpoint(TRUNCATE)'), (statSync(join(dir, 'b.db')).size / 1e6).toFixed(1)), 'MB; integrity_check:', db.prepare('PRAGMA integrity_check').get().integrity_check);
// Wariant JSON: każde +1 przepisuje cały plik atomowo (zapis tymczasowy + rename).
const tj = []; let rozmiar = 0;
for (let k = 0; k < 20; k++) { const s = performance.now(); zdarzenia.push({ id: 'J' + k, l: 'L1', czas: Date.now(), dzien: '2026-10-22', r: 'plus', po: k }); const txt = JSON.stringify({ wersja: 1, zdarzenia }); writeFileSync(join(dir, 'd.tmp'), txt); renameSync(join(dir, 'd.tmp'), join(dir, 'd.json')); rozmiar = txt.length; tj.push(performance.now() - s); }
console.log(`JSON +1 (przepisanie pliku ${(rozmiar / 1e6).toFixed(1)} MB): p50 ${pc(tj, .5)} ms, p95 ${pc(tj, .95)} ms`);
