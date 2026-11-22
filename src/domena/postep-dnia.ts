// Wykonanie dnia i cel stały w ciągu dnia (RD-15, BR-DNI-005, P-047, P-048 (3)).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22). Ciała: zaślepki roli 07 (E3).
import type { Wynik } from './bledy';
import { celDzienny, type CelDnia } from './postep';
import type { RodzajZdarzenia, STANY } from './stany';

export type ZmianaDnia = { id: string; rodzaj: RodzajZdarzenia; dzien: string; rodzajLicznika: (typeof STANY)['licznik.rodzaj'][number]; cofa: readonly string[] };
/** RD-15: Σ(+1) − Σ(−1) liczników rzędów z dniem = `dzis`, bez zmian cofniętych z historii i bez wpisań/zerowań. */
export function wykonanieDnia(zmiany: readonly ZmianaDnia[], dzis: string): number {
  const cofniete = new Set(zmiany.flatMap((z) => z.cofa)); // BR-LIC-003: zmiany cofnięte z historii nie liczą się do dnia
  let suma = 0;
  for (const z of zmiany) {
    if (z.dzien !== dzis || z.rodzajLicznika !== 'rzedy' || cofniete.has(z.id)) continue;
    if (z.rodzaj === 'plus') suma += 1;
    else if (z.rodzaj === 'minus') suma -= 1; // prucie zmniejsza wykonanie; wpisanie i zerowanie to nie praca (BR-LIC-017)
  }
  return suma;
}
/** Cel na dziś z `przedDzis` (koniec wczoraj) — nie zależy od dzisiejszych zmian; wykonanie „w z g”. */
export function stanDnia(w: { suma: number; przedDzis: number; zrobioneTeraz: number; termin: string; dzis: string; zmiany: readonly ZmianaDnia[] }): Wynik<{ cel: CelDnia; wykonanie: number }> {
  const cel = celDzienny(w); // z `przedDzis`: dzisiejsza praca nie zmienia celu (P-047); po terminie „zostało” z `zrobioneTeraz` (P-134 Q1a)
  if (!cel.ok) return cel;
  return { ok: true, wartosc: { cel: cel.wartosc, wykonanie: wykonanieDnia(w.zmiany, w.dzis) } };
}
