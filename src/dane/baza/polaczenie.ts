// Otwarcie bazy aplikacji (ADR-0019: bez cichego zastępstwa bazą w pamięci; Z07-21: plik niedostępny przed odblokowaniem ≠ uszkodzenie).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Fabryka połączenia wstrzykiwana (aplikacja: otworzPortExpo z adapter-expo.ts), żeby test szedł na node:sqlite.
import type { Wynik } from '../../domena/bledy';
import type { PortBazy } from '../../domena/porty';
import { powodBledu } from './bledy-sqlite';

/** SQLITE_CORRUPT / SQLITE_NOTADB → `uszkodzony`; SQLITE_FULL / ENOSPC → `brak_miejsca` (ADR-0020 (4), M1-100); SQLITE_CANTOPEN / IOERR → `zapis` (osobny powód „plik niedostępny”: [DO USTALENIA] Z07-21). */
export async function otworzBaze(sciezka: string, fabryka: (sciezka: string) => PortBazy): Promise<Wynik<PortBazy>> {
  try {
    const baza = fabryka(sciezka);
    await baza.all('SELECT count(*) AS n FROM sqlite_schema'); // pierwszy odczyt: plik obcy albo uszkodzony ujawnia się tu, nie przy pierwszym +1
    return { ok: true, wartosc: baza };
  } catch (e) {
    const powod = powodBledu(e);
    return { ok: false, powod: powod === 'uszkodzony' || powod === 'brak_miejsca' ? powod : 'zapis' };
  }
}
