// Maszyna stanów projektu (moduly.md, „Projekt (F-19, F-33)”; ADR-0013).
import type { Wynik } from '../bledy';
import type { StanProjektu } from '../stany';

export type Projekt = { stan: StanProjektu; ukonczonoMs: number | null; usunietoMs: number | null };
export type ZdarzenieProjektu = 'ukoncz' | 'wznow' | 'usun' | 'przywroc';
const NIEDOZWOLONE = { ok: false, powod: 'niedozwolone_przejscie' } as const;

export function przejdzProjekt(p: Projekt, z: ZdarzenieProjektu, terazMs: number): Wynik<Projekt> {
  const usuniety = p.usunietoMs !== null;
  switch (z) {
    case 'ukoncz': // w_toku → ukonczony; w koszu żadnej zmiany poza przywróceniem
      return p.stan === 'w_toku' && !usuniety ? { ok: true, wartosc: { ...p, stan: 'ukonczony', ukonczonoMs: terazMs } } : NIEDOZWOLONE;
    case 'wznow':
      return p.stan === 'ukonczony' && !usuniety ? { ok: true, wartosc: { ...p, stan: 'w_toku', ukonczonoMs: null } } : NIEDOZWOLONE;
    case 'usun': // „dowolny” w tabeli; ponowne usunięcie z kosza nie zmienia terminu (bez przesunięcia usunieto_ms)
      return usuniety ? NIEDOZWOLONE : { ok: true, wartosc: { ...p, usunietoMs: terazMs } };
    case 'przywroc':
      return usuniety ? { ok: true, wartosc: { ...p, usunietoMs: null } } : NIEDOZWOLONE;
  }
}
/**
 * Sprzątanie przy starcie (P-118 W2, P-110 Q5a): true tylko, gdy projekt usunięty, `usunietoMs ≤ ostatniStartMs ≤ terazMs` i od usunięcia minęło
 * co najmniej `koszDni` dni zarówno teraz, jak i przy poprzednim starcie — jednorazowy skok zegara w przód nie kasuje, zegar cofnięty nie kasuje,
 * brak poprzedniego startu (`null`) czeka na następny. Wyrocznia: tabela „Funkcja sprzątania kosza” w moduly.md.
 */
export function doSprzatniecia(p: Projekt, terazMs: number, ostatniStartMs: number | null, koszDni: number): boolean {
  const u = p.usunietoMs;
  if (u === null || ostatniStartMs === null) return false;
  const d = koszDni * 86_400_000;
  return u <= ostatniStartMs && ostatniStartMs <= terazMs && terazMs - u >= d && ostatniStartMs - u >= d;
}
