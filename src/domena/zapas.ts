// Zużycie włóczki na karcie ukończenia (BR-ZAP-002, U-9, P-126 (2a); design-spec „Zużycie włóczki przy ukończeniu”).
// Czyste funkcje: linia informacji pod grupą „Yarn used” i krok krokowca. Zapis różnicy względem poprzedniego potwierdzenia: potwierdzZuzycie.
import { KROK_MOTKA } from '../konfiguracja';

export type LiniaZapasu = { rodzaj: 'brak' } | { rodzaj: 'ponad'; zapas: number } | { rodzaj: 'juz_zero' };

/** `zapas` = `wloczka.motki` przed zapisem; `poprzednie` = `projekt_wloczka.zuzyto_motki` (null = nie potwierdzano); `zuzycie` null = brak wpisu. */
export function liniaZapasu(w: { zapas: number; zuzycie: number | null; poprzednie: number | null }): LiniaZapasu {
  if (w.zuzycie === null) return { rodzaj: 'brak' };
  const zmiana = w.zuzycie - (w.poprzednie ?? 0);
  if (zmiana <= 0) return { rodzaj: 'brak' };
  if (w.zapas === 0) return { rodzaj: 'juz_zero' };
  return zmiana > w.zapas ? { rodzaj: 'ponad', zapas: w.zapas } : { rodzaj: 'brak' };
}

/** Krokowiec: następna wielokrotność KROK_MOTKA w danym kierunku; brak wpisu liczy się jak 0; nie poniżej 0. */
export function krokMotkow(od: number | null, kierunek: 1 | -1): number {
  const x = (od ?? 0) / KROK_MOTKA;
  const blisko = Math.round(x);
  const baza = Math.abs(x - blisko) < 1e-9 ? blisko : kierunek > 0 ? Math.floor(x) : Math.ceil(x);
  return Math.max(0, (baza + kierunek) * KROK_MOTKA);
}
