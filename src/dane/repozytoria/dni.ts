// Repozytorium dni z robótką (F-59, RD-15, RD-16): wykonanie dnia bez wpisań i bez cofniętych zmian.
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
import type { PortBazy } from '../../domena/porty';
import { liczbaLubNull, wiersze } from './wiersze';

/**
 * Zdarzenia cofnięte z historii (`cofa` zdarzeń `cofniecie`) liczników zmienianych w dniu `dzien` — cofnięcie bywa później niż zmiana.
 * Wspólne dla wykonania dnia i kalendarza (RD-15: „bez zmian cofniętych z historii”).
 */
export const COFNIETE_LICZNIKOW_DNIA = `SELECT j.value FROM zdarzenie c, json_each(c.cofa) j
  WHERE c.rodzaj = 'cofniecie' AND c.licznik_id IN (SELECT licznik_id FROM zdarzenie WHERE dzien = ?)`;

/** RD-15: suma +1 i −1 liczników rzędów z dniem zmiany = `dzien` (RD-16), bez wpisań, zerowań i zmian cofniętych; prucie zmniejsza wynik. */
export async function wykonanieDnia(baza: PortBazy, dzien: string): Promise<{ rzedy: number }> {
  const [w] = await wiersze(baza.all(
    `SELECT sum(CASE z.rodzaj WHEN 'plus' THEN 1 ELSE -1 END) AS n
       FROM zdarzenie z JOIN licznik l ON l.id = z.licznik_id
      WHERE z.dzien = ? AND l.rodzaj = 'rzedy' AND z.rodzaj IN ('plus', 'minus')
        AND z.id NOT IN (${COFNIETE_LICZNIKOW_DNIA})`, [dzien, dzien]), 'wykonanieDnia');
  return { rzedy: (w ? liczbaLubNull(w, 'n') : null) ?? 0 }; // brak zmian = 0 rzędów zrobionych, nie „brak danych”
}
