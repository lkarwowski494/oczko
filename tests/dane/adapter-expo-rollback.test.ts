// M1-audytor-generalny-025 (05-architekt-504, 08-programista-005): przy SQLITE_FULL SQLite sam wycofuje transakcję (sqlite.org/lang_transaction.html §3),
// a adapter expo wołał `ROLLBACK` bezwarunkowo — „cannot rollback - no transaction is active” podmieniało pierwotny błąd i `powodBledu` dawał `zapis`
// zamiast `brak_miejsca`. Adapter Node robi to warunkowo (`isTransaction`); adapter expo ma robić tak samo (`isInTransactionAsync`, expo-sqlite 57).
import type { SQLiteDatabase } from 'expo-sqlite';
import { portNaPolaczeniu } from '../../src/dane/baza/adapter-expo';
import { powodBledu } from '../../src/dane/baza/bledy-sqlite';

const PELNY = 'Calling the \'execAsync\' function has failed\n→ Caused by: database or disk is full (code 13, SQLITE_FULL)';
function atrapa(o: { padaCommit?: boolean; padaInstrukcja?: string; samWycofuje: boolean }) {
  const wywolania: string[] = [];
  let trwa = false;
  const db = {
    async execAsync(sql: string) {
      wywolania.push(sql);
      if (sql === 'BEGIN IMMEDIATE') { trwa = true; return; }
      if (sql === 'COMMIT') { if (o.padaCommit) { if (o.samWycofuje) trwa = false; throw new Error(PELNY); } trwa = false; return; }
      if (sql === 'ROLLBACK') { if (!trwa) throw new Error('cannot rollback - no transaction is active'); trwa = false; }
    },
    async runAsync(sql: string) {
      wywolania.push(sql);
      if (o.padaInstrukcja) { if (o.samWycofuje) trwa = false; throw new Error(o.padaInstrukcja); }
      return { changes: 1, lastInsertRowId: 1 };
    },
    async getAllAsync() { return []; },
    async closeAsync() { /* atrapa */ },
    async isInTransactionAsync() { return trwa; },
    isInTransactionSync() { return trwa; },
  };
  return { db: db as unknown as SQLiteDatabase, wywolania, trwa: () => trwa };
}
async function blad(p: Promise<unknown>): Promise<unknown> {
  try { await p; } catch (e) { return e; }
  throw new Error('oczekiwano wyjątku');
}

test('M1-025: COMMIT rzuca SQLITE_FULL i SQLite sam wycofał transakcję → wyjątek z portu ma komunikat SQLITE_FULL, powód „brak_miejsca”', async () => {
  const a = atrapa({ padaCommit: true, samWycofuje: true });
  const e = await blad(portNaPolaczeniu(a.db).transakcja(async (tx) => tx.run('INSERT INTO projekt (id) VALUES (1)')));
  expect(e instanceof Error ? e.message : String(e)).toContain('SQLITE_FULL');
  expect(powodBledu(e)).toBe('brak_miejsca');
  expect(a.trwa()).toBe(false);
});

test('M1-025: instrukcja w transakcji rzuca SQLITE_FULL z automatycznym wycofaniem → „brak_miejsca”, bez ROLLBACK na zamkniętej transakcji', async () => {
  const a = atrapa({ padaInstrukcja: PELNY, samWycofuje: true });
  const e = await blad(portNaPolaczeniu(a.db).transakcja(async (tx) => tx.run('INSERT INTO projekt (id) VALUES (1)')));
  expect(powodBledu(e)).toBe('brak_miejsca');
  expect(a.wywolania).not.toContain('ROLLBACK');
});

test('M1-025: zwykły błąd w trwającej transakcji → ROLLBACK wykonany, pierwotny wyjątek przekazany (bez regresji)', async () => {
  const a = atrapa({ padaInstrukcja: 'UNIQUE constraint failed: projekt.id', samWycofuje: false });
  const e = await blad(portNaPolaczeniu(a.db).transakcja(async (tx) => tx.run('INSERT INTO projekt (id) VALUES (1)')));
  expect(e instanceof Error ? e.message : '').toBe('UNIQUE constraint failed: projekt.id');
  expect(a.wywolania).toContain('ROLLBACK');
  expect(a.trwa()).toBe(false);
});
