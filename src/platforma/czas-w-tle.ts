// Adapter portu CzasWTle (ADR-0002 (7), moduly.md „Porty domeny”): beginBackgroundTask przez moduł Swift; sygnał `wygaslo()` dla transakcji
// sprawdzającej go między instrukcjami (src/dane/baza/przeniesienie.ts). `koniec` zawsze, także po błędzie i po wygaśnięciu.
import type { CzasWTle } from '../domena/porty';
import { natywny as modul, type OczkoCzasWTleNatywny } from '../../modules/oczko-czas-w-tle';

export function czasWTle(natywny: OczkoCzasWTleNatywny = modul()): CzasWTle {
  return {
    async chron(nazwa, fn) {
      const id = await natywny.start(nazwa);
      try {
        return await fn({ wygaslo: () => natywny.czyWygaslo(id) });
      } finally {
        await natywny.koniec(id);
      }
    },
  };
}
