// Zastępnik `expo-sqlite` w Jest (P-120 Q1a, jak Trening `tests/db-real-sqlite.test.ts`): ten sam podzbiór API, którego używa
// src/dane/baza/adapter-expo.ts, na prawdziwym SQLite (node:sqlite). Kod testu, nie aplikacji; rozbieżność z urządzeniem łapie partia 3 (CI macOS).
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

type Parametry = SQLInputValue[];
class BazaNode {
  private readonly db: DatabaseSync;
  constructor(sciezka: string) {
    this.db = new DatabaseSync(sciezka, { enableForeignKeyConstraints: false }); // jak SQLite w aplikacji
  }
  execSync(sql: string): void { this.db.exec(sql); }
  async execAsync(sql: string): Promise<void> { this.db.exec(sql); }
  async runAsync(sql: string, params: Parametry = []): Promise<{ changes: number; lastInsertRowId: number }> {
    const r = this.db.prepare(sql).run(...params);
    return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
  }
  async getAllAsync<T>(sql: string, params: Parametry = []): Promise<T[]> { return this.db.prepare(sql).all(...params) as T[]; }
  async closeAsync(): Promise<void> { this.db.close(); }
  async isInTransactionAsync(): Promise<boolean> { return this.db.isTransaction; }
  closeSync(): void { this.db.close(); }
}

/**
 * Ścieżka jak w module natywnym (expo-sqlite/ios/URL+FilePath.swift): URI `file://` → ścieżka pliku; adres bez schematu → `absoluteString`,
 * czyli znaki spoza URL zakodowane procentowo (spacja → %20). Dzięki temu test widzi, gdy aplikacja poda katalog bez `file://`.
 */
function sciezkaNatywna(katalog: string, nazwa: string): string {
  if (katalog.startsWith('file://')) return `${fileURLToPath(katalog).replace(/\/+$/, '')}/${nazwa}`;
  return `${encodeURI(katalog)}/${nazwa}`;
}
export function openDatabaseSync(nazwa: string, _opcje?: unknown, katalog?: string): BazaNode {
  if (!katalog) throw new Error('zastępnik expo-sqlite: wymagany katalog (aplikacja zawsze podaje ścieżkę bazy)');
  return new BazaNode(sciezkaNatywna(katalog, nazwa));
}
export async function openDatabaseAsync(nazwa: string, opcje?: unknown, katalog?: string): Promise<BazaNode> {
  return openDatabaseSync(nazwa, opcje, katalog);
}
