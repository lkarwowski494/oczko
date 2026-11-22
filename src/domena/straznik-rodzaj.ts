// Strażnik stuknięć tylko dla liczników rzędów (RD-17 „tylko liczniki rzędów, nie oczek”, ER-24, BR-LIC-019/S3).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22). Ciało: zaślepka roli 07 (E3).
import type { Wynik } from './bledy';
import type { STANY } from './stany';
import { serieDoSprawdzenia, type Dodanie, type Seria } from './straznik-tempa';

/** Licznik oczek → `{ ok: true, wartosc: [] }` bez sprawdzania serii; licznik rzędów → `serieDoSprawdzenia`. */
export function serieLicznika(w: { rodzajLicznika: (typeof STANY)['licznik.rodzaj'][number]; dodania: readonly Dodanie[]; konf: { seria: number; oknoS: number } }): Wynik<Seria[]> {
  if (w.rodzajLicznika === 'oczka') return { ok: true, wartosc: [] };
  return serieDoSprawdzenia([...w.dodania], w.konf);
}
