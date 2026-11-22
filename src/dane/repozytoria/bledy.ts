// Diagnostyka lokalna F-57 (tabela `blad`, NFR-PRY-001): kod i identyfikatory, nigdy treść projektów; przycinanie do BLEDY_MAKS_WIERSZY.
import type { PortBazy } from '../../domena/porty';
import { BLEDY_MAKS_WIERSZY } from '../../konfiguracja';

export type Szczegoly = Record<string, string | number | null | readonly (string | number)[]>;

/** Zwraca false, gdy nawet zapis diagnostyki się nie udał (wołający i tak zwraca błąd operacji; diagnostyka nie zmienia jego wyniku). */
export function zapiszBlad(baza: PortBazy, w: { czasMs: number; kod: string; szczegoly?: Szczegoly }): Promise<boolean> {
  return baza
    .transakcja((tx) => zapiszBladW(tx, w))
    .then(() => true, () => false);
}
/** Ten sam zapis w trwającej transakcji (zatruta linia dziennika zapisywana razem z resztą partii, ADR-0008 (3)). */
export async function zapiszBladW(tx: PortBazy, w: { czasMs: number; kod: string; szczegoly?: Szczegoly }): Promise<void> {
  await tx.run('INSERT INTO blad (czas_ms, kod, szczegoly) VALUES (?, ?, ?)', [w.czasMs, w.kod, JSON.stringify(w.szczegoly ?? {})]);
  await przytnijBledy(tx);
}
/** Przycięcie tabeli do BLEDY_MAKS_WIERSZY najnowszych wpisów. */
export async function przytnijBledy(tx: PortBazy): Promise<void> {
  await tx.run('DELETE FROM blad WHERE id <= (SELECT max(id) FROM blad) - ?', [BLEDY_MAKS_WIERSZY]);
}
