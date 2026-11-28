// KO-234 (ZM-27, ADR-0037, P-1099): decyzja o Live Activity po zdarzeniu w aplikacji i data nieaktualności (`staleDate`).
// Czyste funkcje; czas i stan natywny (`aktywna`) są argumentami. Wyrocznia: wektory AK-01…AK-11, SD-01…SD-04.

export type ZdarzenieAktywnosci = 'liczenie' | 'odswiezenie' | 'menu_zakoncz' | 'reset';
export type DecyzjaAktywnosci = 'start' | 'aktualizuj' | 'zakoncz' | 'nic';

/**
 * `aktywna` = stan natywny (Activity.activities niepuste), nie flaga w pamięci. Start tylko przy liczeniu: odświeżenie
 * (start, powrót, scalenie, data, Pro, język, inny licznik) nigdy nie uruchamia aktywności, inaczej otwarcie aplikacji cofałoby koniec.
 */
export function decyzjaAktywnosci(w: {
  zdarzenie: ZdarzenieAktywnosci;
  aktywna: boolean;
  systemWlaczone: boolean;
  ostatniaZmianaMs: number | null;
  teraz: number;
  koniecPoMs: number;
}): DecyzjaAktywnosci {
  if (w.zdarzenie === 'reset' || w.zdarzenie === 'menu_zakoncz') return w.aktywna ? 'zakoncz' : 'nic';
  if (w.zdarzenie === 'liczenie') return w.aktywna ? 'aktualizuj' : w.systemWlaczone ? 'start' : 'nic';
  if (!w.aktywna) return 'nic';
  return w.ostatniaZmianaMs === null || w.teraz - w.ostatniaZmianaMs >= w.koniecPoMs ? 'zakoncz' : 'aktualizuj';
}

/** Jedna `staleDate` na treść: ostatnia zmiana + wcześniejszy z progów (przypominacz włączony < koniec); null przy braku zmian. */
export function dataNieaktualnosci(w: { ostatniaZmianaMs: number | null; przypominaczMs: number | null; koniecPoMs: number }): number | null {
  if (w.ostatniaZmianaMs === null) return null;
  return w.ostatniaZmianaMs + (w.przypominaczMs === null ? w.koniecPoMs : Math.min(w.przypominaczMs, w.koniecPoMs));
}
