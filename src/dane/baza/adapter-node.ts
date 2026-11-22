// Adapter PortBazy na node:sqlite — tylko dla testów (ADR-0002, strategia §3 „Dane”); wyjątek nazwany kontroli bazy w pamięci (Z07-21).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Kontrakt: jedno połączenie, PRAGMA foreign_keys = ON poza transakcją, journal_mode = WAL (ADR-0001), transakcja = BEGIN IMMEDIATE … COMMIT
// w kolejce; `trybDeweloperski`: transakcja, w której czeka się na coś poza bazą (timer), jest odrzucana z komunikatem „ADR-0002”.
// Nie importować z kodu aplikacji (node:sqlite nie istnieje na urządzeniu); aplikacja: adapter-expo.ts.
import { DatabaseSync } from 'node:sqlite';
import type { PortBazy } from '../../domena/porty';
import { kolejka } from './kolejka';
import { parametrySql } from './parametry';

export interface PortNode extends PortBazy {
  zamknij(): void;
}

export function utworzPortNode(sciezka: string, opcje: { trybDeweloperski?: boolean } = {}): PortNode {
  // Jak SQLite w aplikacji: klucze obce domyślnie wyłączone, włącza je adapter (moduł sqlite-expo; node:sqlite domyślnie je włącza).
  const db = new DatabaseSync(sciezka, { enableForeignKeyConstraints: false });
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');
  const wKolejce = kolejka();
  const run = async (sql: string, params?: unknown[]) => ({ zmiany: Number(db.prepare(sql).run(...parametrySql(params)).changes) });
  // Port zwraca wiersze jako T (sygnatura 05); wołający parsuje je z unknown (wzorce roli, „Parsowanie”) — jedyna asercja typu adaptera.
  const all = async <T>(sql: string, params?: unknown[]): Promise<T[]> => db.prepare(sql).all(...parametrySql(params)) as T[];

  async function transakcja<T>(fn: (tx: PortBazy) => Promise<T>): Promise<T> {
    let otwarta = true;
    let czekala = false;
    const straz = opcje.trybDeweloperski ? setTimeout(() => { if (otwarta) czekala = true; }, 0) : undefined;
    const pilnuj = () => {
      if (czekala) throw new Error('ADR-0002: transakcja czekała na coś poza bazą (await poza portem w transakcji)');
    };
    const tx: PortBazy = {
      run: async (sql, p) => { pilnuj(); return run(sql, p); },
      all: async (sql, p) => { pilnuj(); return all(sql, p); },
      transakcja: (f) => f(tx), // zagnieżdżenie = ta sama transakcja
    };
    db.exec('BEGIN IMMEDIATE');
    try {
      const wynik = await fn(tx);
      pilnuj();
      db.exec('COMMIT');
      return wynik;
    } catch (e) {
      if (db.isTransaction) db.exec('ROLLBACK');
      throw e;
    } finally {
      otwarta = false;
      if (straz !== undefined) clearTimeout(straz);
    }
  }

  return {
    run: (sql, p) => wKolejce(() => run(sql, p)),
    all: (sql, p) => wKolejce(() => all(sql, p)),
    transakcja: (fn) => wKolejce(() => transakcja(fn)),
    zamknij: () => db.close(),
  };
}
