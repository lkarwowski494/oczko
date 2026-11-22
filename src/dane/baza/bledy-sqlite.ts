// Wyjątki SQLite i systemu plików → powód `Wynik` (P-118 Q1a, polityka błędów e3 §2): ekran mówi, co się stało, nic nie znika po cichu.
import type { Powod } from '../../domena/bledy';

const tekst = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export function powodBledu(e: unknown): Powod {
  const t = tekst(e);
  if (/SQLITE_FULL|database or disk is full|ENOSPC|no space left/i.test(t)) return 'brak_miejsca';
  if (/SQLITE_CORRUPT|SQLITE_NOTADB|malformed|file is not a database/i.test(t)) return 'uszkodzony';
  return 'zapis';
}
/** Treść błędu do tabeli `blad` (F-57): kod SQLite albo nazwa wyjątku, bez danych użytkownika (NFR-PRY-001). */
export function kodBledu(e: unknown): string {
  const t = tekst(e);
  const kod = /SQLITE_[A-Z_]+/.exec(t);
  if (kod) return kod[0];
  return e instanceof Error ? e.name : 'nieznany';
}
