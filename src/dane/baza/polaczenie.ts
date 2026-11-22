// Otwarcie bazy aplikacji (ADR-0019: bez cichego zastępstwa bazą w pamięci; Z07-21: plik niedostępny przed odblokowaniem ≠ uszkodzenie).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Fabryka połączenia wstrzykiwana (aplikacja: otworzPortExpo z adapter-expo.ts), żeby test szedł na node:sqlite.
import type { Wynik } from '../../domena/bledy';
import type { PortBazy } from '../../domena/porty';
import { PROG_BRAK_MIEJSCA_OTWARCIA_B } from '../../konfiguracja';
import { powodBledu } from './bledy-sqlite';

/** Wolne miejsce w bajtach albo `null` (nie wiadomo); wyjątek odczytu = nie wiadomo. */
function znaneWolne(wolne: () => number | null): number | null {
  try {
    return wolne();
  } catch {
    return null; // nieznane miejsce nie jest brakiem miejsca (celowe, jak `wolneMiejsce`)
  }
}

/**
 * SQLITE_CORRUPT / SQLITE_NOTADB → `uszkodzony`; SQLITE_FULL / ENOSPC → `brak_miejsca` (ADR-0020 (4), M1-100); SQLITE_CANTOPEN / IOERR → `zapis` (osobny powód „plik niedostępny”: [DO USTALENIA] Z07-21).
 * M1-157 (12-niezawodnosc-505): brak miejsca przy powiększaniu `-shm` SQLite zgłasza jako SQLITE_IOERR, więc przy `zapis` i znanym wolnym miejscu
 * poniżej `PROG_BRAK_MIEJSCA_OTWARCIA_B` powód to `brak_miejsca`; `wolne` → `null` (wartość domyślna) zostawia `zapis`.
 */
export async function otworzBaze(sciezka: string, fabryka: (sciezka: string) => PortBazy, wolne: () => number | null = () => null): Promise<Wynik<PortBazy>> {
  try {
    const baza = fabryka(sciezka);
    await baza.all('SELECT count(*) AS n FROM sqlite_schema'); // pierwszy odczyt: plik obcy albo uszkodzony ujawnia się tu, nie przy pierwszym +1
    return { ok: true, wartosc: baza };
  } catch (e) {
    const powod = powodBledu(e);
    if (powod === 'uszkodzony' || powod === 'brak_miejsca') return { ok: false, powod };
    const w = znaneWolne(wolne);
    return { ok: false, powod: w !== null && w < PROG_BRAK_MIEJSCA_OTWARCIA_B ? 'brak_miejsca' : 'zapis' };
  }
}
