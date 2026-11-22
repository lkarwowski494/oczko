// Adapter PortBazy na expo-sqlite (ADR-0001, ADR-0002; moduł sqlite-expo): jedno połączenie, klucze obce włączone przed pierwszą transakcją
// i sprawdzone, jedna kolejka zapisów; transakcja = BEGIN IMMEDIATE … COMMIT na tym samym połączeniu (bez transakcji „wyłącznej” expo-sqlite,
// która otwiera nowe połączenie bez kluczy obcych). Jedyne miejsce importu expo-sqlite (granice.mjs, reguła SQLITE).
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import type { PortBazy } from '../../domena/porty';
import { kolejka } from './kolejka';
import { parametrySql } from './parametry';

export interface PortExpo extends PortBazy {
  zamknij(): Promise<void>;
}

function rozdziel(sciezka: string): { nazwa: string; katalog: string } {
  const i = sciezka.lastIndexOf('/');
  return { nazwa: sciezka.slice(i + 1), katalog: i > 0 ? sciezka.slice(0, i) : '/' };
}

/**
 * Katalog dla expo-sqlite jako URI `file://`: natywny moduł robi z ścieżki `URL(string:)`, a adres bez schematu zamienia na `absoluteString`
 * (node_modules/expo-sqlite/ios/URL+FilePath.swift) — „Application Support” stawało się katalogiem „Application%20Support” (E2E 40298771854).
 */
export const katalogJakoUri = (katalog: string): string => `file://${katalog.split('/').map(encodeURIComponent).join('/')}`;

/** `tylkoOdczyt`: kopia sprawdzana przed przywróceniem (ADR-0020 (2)) — bez zmiany trybu dziennika, zapisy odrzucane (`query_only`). */
export function otworzPortExpo(sciezka: string, opcje: { tylkoOdczyt?: boolean } = {}): PortExpo {
  const { nazwa, katalog } = rozdziel(sciezka);
  const db = openDatabaseSync(nazwa, { useNewConnection: true }, katalogJakoUri(katalog));
  db.execSync('PRAGMA foreign_keys = ON'); // poza transakcją: w transakcji pragma nie działa (sqlite.org/foreignkeys.html)
  if (opcje.tylkoOdczyt) db.execSync('PRAGMA query_only = ON');
  else db.execSync('PRAGMA journal_mode = WAL');
  return portNaPolaczeniu(db);
}

export function portNaPolaczeniu(db: SQLiteDatabase): PortExpo {
  const wKolejce = kolejka();
  const run = async (sql: string, params?: unknown[]) => ({ zmiany: (await db.runAsync(sql, parametrySql(params))).changes });
  // Port zwraca wiersze jako T (sygnatura 05); wołający parsuje je z unknown — generyk getAllAsync nie sprawdza danych.
  const all = <T>(sql: string, params?: unknown[]): Promise<T[]> => db.getAllAsync<T>(sql, parametrySql(params));
  const tx: PortBazy = { run, all, transakcja: (f) => f(tx) };
  async function transakcja<T>(fn: (t: PortBazy) => Promise<T>): Promise<T> {
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      const wynik = await fn(tx);
      await db.execAsync('COMMIT');
      return wynik;
    } catch (e) {
      // M1-025: przy SQLITE_FULL/IOERR/NOMEM SQLite może sam wycofać transakcję (sqlite.org/lang_transaction.html §3); jawny ROLLBACK rzuciłby
      // „no transaction is active” i podmienił pierwotny błąd — jak adapter Node (`isTransaction`), tylko przy trwającej transakcji.
      if (await db.isInTransactionAsync()) await db.execAsync('ROLLBACK');
      throw e;
    }
  }
  return {
    run: (sql, p) => wKolejce(() => run(sql, p)),
    all: (sql, p) => wKolejce(() => all(sql, p)),
    transakcja: (fn) => wKolejce(() => transakcja(fn)),
    zamknij: () => wKolejce(() => db.closeAsync()),
  };
}
