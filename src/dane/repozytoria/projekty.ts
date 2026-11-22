// Repozytorium projektów: lista „W toku” / „Ukończone”, wyszukiwanie (F-50, F-54; indeks projekt_lista).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
import type { PortBazy } from '../../domena/porty';
import type { StanProjektu } from '../../domena/stany';
import { liczba, liczbaLubNull, tekst, wiersze } from './wiersze';

export type ProjektNaLiscie = { id: string; nazwa: string; stan: StanProjektu; ostatniaPracaMs: number; ukonczonoMs: number | null; czasPracyMs: number };
/** Bez projektów w koszu; „W toku” według ostatniej pracy malejąco (BR-PRJ-012), „Ukończone” według daty ukończenia malejąco. */
export async function listaProjektow(baza: PortBazy, w: { szukaj?: string } = {}): Promise<{ wToku: ProjektNaLiscie[]; ukonczone: ProjektNaLiscie[] }> {
  const r = await wiersze(baza.all(
    `SELECT p.id, p.nazwa, p.stan, p.ostatnia_praca_ms, p.ukonczono_ms,
            (SELECT coalesce(sum(max(0, s.koniec_ms - s.start_ms - s.przerwy_ms)), 0) FROM sesja s WHERE s.projekt_id = p.id AND s.stan = 'zakonczona') AS czas
       FROM projekt p WHERE p.usunieto_ms IS NULL ORDER BY p.stan, p.ostatnia_praca_ms DESC`), 'listaProjektow');
  // Wyszukiwanie bez rozróżniania wielkości liter także dla liter spoza ASCII (LIKE w SQLite rozróżnia je tylko w ASCII).
  const szukaj = w.szukaj?.trim().toLocaleLowerCase();
  const lista: ProjektNaLiscie[] = r
    .map((x) => ({
      id: tekst(x, 'id'), nazwa: tekst(x, 'nazwa'), stan: tekst(x, 'stan') === 'ukonczony' ? ('ukonczony' as const) : ('w_toku' as const),
      ostatniaPracaMs: liczba(x, 'ostatnia_praca_ms'), ukonczonoMs: liczbaLubNull(x, 'ukonczono_ms'), czasPracyMs: liczba(x, 'czas'),
    }))
    .filter((p) => !szukaj || p.nazwa.toLocaleLowerCase().includes(szukaj));
  return {
    wToku: lista.filter((p) => p.stan === 'w_toku'),
    ukonczone: lista.filter((p) => p.stan === 'ukonczony').sort((a, b) => (b.ukonczonoMs ?? 0) - (a.ukonczonoMs ?? 0)),
  };
}
