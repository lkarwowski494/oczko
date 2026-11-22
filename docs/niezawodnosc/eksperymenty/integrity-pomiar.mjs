// Pomiar kosztu PRAGMA integrity_check / quick_check na bazie wielkości „3 lata” (ADR-0019 „Sprawdzenie integralności przy starcie” [DO USTALENIA E2],
// ADR-0020: ok. 18 MB). Rola 12 E3, 2026-10-26. Linux/Node — rząd wielkości, nie czas na telefonie (ten mierzy przebieg na symulatorze/urządzeniu).
// Użycie: node --no-warnings docs/niezawodnosc/eksperymenty/integrity-pomiar.mjs <katalog-roboczy> [MB=18]
import { readFileSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const [katalog, mb = '18'] = process.argv.slice(2);
if (!katalog) { console.error('podaj katalog roboczy'); process.exit(2); }
mkdirSync(katalog, { recursive: true });
const plik = join(katalog, `pomiar-${Date.now()}.db`);
const db = new DatabaseSync(plik);
db.exec('PRAGMA foreign_keys = ON');
db.exec(readFileSync(new URL('../../architektura/schemat.sql', import.meta.url), 'utf8'));
const T0 = Date.UTC(2023, 9, 26);
db.exec('BEGIN');
const ins = db.prepare('INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc, wartosc_po, rodzice, cofa, zrodlo, urzadzenie, czas_ms, strefa, dzien) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)');
let n = 0, p = 0;
const cel = Number(mb) * 1024 * 1024;
while (true) {
  p++;
  db.prepare("INSERT INTO projekt (id, nazwa, stan, notatka, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES (?, ?, 'w_toku', '', ?, ?, ?)").run(`p${p}`, `Projekt ${p}`, T0, T0, T0);
  db.prepare('INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, 1, ?)').run(`c${p}`, `p${p}`, 'Przód', T0);
  db.prepare("INSERT INTO licznik (id, czesc_id, rodzaj, zablokowany, wartosc, glowa, kolejnosc, zmieniono_ms) VALUES (?, ?, 'rzedy', 0, 0, NULL, 1, ?)").run(`l${p}`, `c${p}`, T0);
  for (let i = 1; i <= 2000; i++) {
    n++;
    const t = T0 + n * 60_000;
    ins.run(`l${p}-z${i}`, `l${p}`, 'plus', i, JSON.stringify(i > 1 ? [`l${p}-z${i - 1}`] : []), '[]', 'aplikacja', '3f2b8c1e-0000-4000-8000-000000000000', t, 'Europe/Warsaw', new Date(t).toISOString().slice(0, 10));
  }
  if (p % 5 === 0) { db.exec('COMMIT'); db.exec('PRAGMA wal_checkpoint'); if (statSync(plik).size >= cel) break; db.exec('BEGIN'); }
}
const czas = (sql) => { const w = []; let r; for (let i = 0; i < 3; i++) { const t = process.hrtime.bigint(); r = db.prepare(sql).all(); w.push(Number(process.hrtime.bigint() - t) / 1e6); } return { ms: w.sort((a, b) => a - b)[1], wynik: JSON.stringify(r) }; };
const ic = czas('PRAGMA integrity_check');
const qc = czas('PRAGMA quick_check');
const sqlite = db.prepare('SELECT sqlite_version() AS v').get().v;
console.log(JSON.stringify({ data: new Date().toISOString().slice(0, 10), node: process.version, sqlite, bajty: statSync(plik).size, projekty: p, zdarzenia: n, integrity_check_ms_mediana: Math.round(ic.ms), integrity: ic.wynik, quick_check_ms_mediana: Math.round(qc.ms), quick: qc.wynik }));
db.close();
