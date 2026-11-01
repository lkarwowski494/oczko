// Adapter portu Siec (ADR-0031 pkt 1, 07-jakosc-017, F-55): stan ścieżki sieciowej z modułu Swift `oczko-wzor` (NWPathMonitor; Apple: „An observer that you use
// to monitor and react to network changes.”). To podpowiedź, nie gwarancja osiągalności serwera: „nieznany” (monitor jeszcze nie odpowiedział, błąd modułu,
// build bez modułu, niezrozumiały napis) znaczy „próbujemy”, jak „jest”. Build E2E z `oczkoE2eSiec=brak` (NFR-OFF-001) to adapter z stałym „brak”
// — jedyne miejsce poza tryb-e2e.ts, które czyta ten argument (kontrola K-17i).
import type { Siec, StanSieci } from '../domena/porty';
import { natywny as modul, type OczkoWzorNatywny } from '../../modules/oczko-wzor';
import { siecWylaczona } from './tryb-e2e';

type Natywny = Pick<OczkoWzorNatywny, 'siecStan' | 'addListener'>;

const stanZNapisu = (v: unknown): StanSieci => (v === 'jest' || v === 'brak' ? v : 'nieznany');

export function siecPlatformy(n: Natywny | null = modul()): Siec {
  return {
    stan() {
      if (!n) return 'nieznany';
      try { return stanZNapisu(n.siecStan()); } catch { return 'nieznany'; } // błąd modułu nie blokuje użytkownika: próbujemy jak przy „jest”
    },
    obserwuj(fn) {
      if (!n) return () => undefined;
      const sub = n.addListener('siecZmiana', (e) => fn(stanZNapisu(e.stan)));
      return () => sub.remove();
    },
  };
}
/** Adapter E2E (`oczkoE2eSiec=brak`): stała „brak”, bez pytania modułu. */
export const siecWylaczonaE2e = (): Siec => ({ stan: () => 'brak', obserwuj: () => () => undefined });

/** Port aplikacji: adapter E2E przy `oczkoE2eSiec=brak`, inaczej moduł Swift. */
export function siecAplikacji(): Siec {
  return siecWylaczona() ? siecWylaczonaE2e() : siecPlatformy();
}
