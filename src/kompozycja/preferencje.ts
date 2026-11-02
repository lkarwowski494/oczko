// Preferencje urządzenia (ADR-0029): migawka synchroniczna dla haptyki, licznika i narzędzi; źródło prawdy to tabela `ustawienie`.
// Odczyt raz po migracji (`wczytaj`), zapis przez kolejkę portu (`zapisz`): migawka zmienia się dopiero po COMMIT.
import type { Wynik } from '../domena/bledy';
import type { Preferencje } from '../domena/preferencje';
import { PREFERENCJE_DOMYSLNE } from '../konfiguracja';
import { wczytajPreferencje } from '../dane/repozytoria/ustawienia';
import { wKolejce } from '../przypadki-uzycia/kolejka';
import { ustawPreferencje } from '../przypadki-uzycia/preferencje';
import type { Zaleznosci } from '../przypadki-uzycia/zaleznosci';

export type { Preferencje };
export function preferencje(): { stan(): Preferencje; wczytaj(z: Zaleznosci): Promise<void>; zapisz(z: Zaleznosci, zmiana: Partial<Preferencje>): Promise<Wynik<void>> } {
  let p: Preferencje = { ...PREFERENCJE_DOMYSLNE };
  return {
    stan: () => p,
    /** Odczyt po migracji i po „Usuń wszystkie dane” (reset = ustawienia domyślne); błąd odczytu zostawia bieżącą migawkę. */
    async wczytaj(z) {
      try { p = await wKolejce(z.baza, () => wczytajPreferencje(z.baza)); } catch { /* migawka bez zmiany: preferencje interfejsu, start nie może przez nie paść */ }
    },
    async zapisz(z, zmiana) {
      const w = await ustawPreferencje(z, zmiana);
      if (!w.ok) return w;
      p = w.wartosc;
      return { ok: true, wartosc: undefined };
    },
  };
}
