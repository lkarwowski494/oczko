// Pomocnicze rola 12 (E2, E3): awaria procesu z otwartą bazą i uszkodzenie strony — warunki z sqlite.org/howtocorrupt.html i wal.html.
import { spawnSync } from 'node:child_process';
import { closeSync, openSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';

/** M1-audytor-generalny-163 (07-jakosc-540): `node:sqlite` przy odśmiecaniu zamyka porzucone połączenie, a SQLite przy zamknięciu ostatniego
 *  połączenia robi checkpoint i usuwa -wal i -shm. Wymuszone odśmiecanie przed porównaniem oryginałów sprawdza, że test trzyma połączenie
 *  „procesu bez zamknięcia” (silna referencja) aż do jawnego zamknięcia po asercjach, zamiast zależeć od chwili GC pod obciążeniem. */
setFlagsFromString('--expose-gc');
export const odsmiec = runInNewContext('gc') as () => void;

/** Osobny proces pisze do bazy w WAL bez checkpointu i ginie od SIGKILL z otwartym połączeniem (awaria, nie zamknięcie). */
export function procesZabityZOtwartaBaza(katalog: string, wierszy: number): void {
  const skrypt = `
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(${JSON.stringify(join(katalog, 'oczko.db'))});
    db.exec('PRAGMA journal_mode = WAL'); db.exec('PRAGMA wal_autocheckpoint = 0');
    db.exec('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, x TEXT)');
    const s = db.prepare('INSERT INTO t (x) VALUES (?)');
    for (let i = 0; i < ${wierszy}; i++) s.run('wiersz ' + i);
    process.kill(process.pid, 'SIGKILL');`;
  const w = spawnSync(process.execPath, ['--no-warnings', '-e', skrypt]);
  if (w.signal !== 'SIGKILL') throw new Error(`proces nie zginął od SIGKILL: ${String(w.status)} ${w.stderr.toString()}`);
}

/** Nadpisuje stronę `nr` (od 1) bazy bajtami 0xA5 — uszkodzenie danych przy poprawnym nagłówku pliku. */
export function uszkodzStrone(sciezka: string, nr: number): void {
  const db = new DatabaseSync(sciezka, { readOnly: true });
  const { page_size: rozmiar } = db.prepare('PRAGMA page_size').get() as { page_size: number };
  db.close();
  const fd = openSync(sciezka, 'r+');
  try { writeSync(fd, Buffer.alloc(rozmiar, 0xa5), 0, rozmiar, rozmiar * (nr - 1)); } finally { closeSync(fd); }
}
