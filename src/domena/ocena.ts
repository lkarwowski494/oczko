// Prośba o ocenę w sklepie (P-150 E2-1a, P-156): bramka `czyProsicOOcene` — czysta funkcja, bez I/O (ARCH-03).
// Kontrakt: docs/architektura/moduly.md „Prośba o ocenę”; wyrocznia: docs/architektura/wektory-prosby-o-ocene.json (PO-01–PO-11).
// Typy: rola 05 (fix-5, P-156 Q2a); funkcja: 08 partia 4 (NZ-05-F5-08, P-160).
// Test (przeniesiony przez 08 w partii 4): tests/domena/prosba-o-ocene.test.ts.
import { ODSTEP_PROSBY_DNI, PROSB_NA_WERSJE } from '../konfiguracja';

/** Chwila, w której przypadek użycia pyta bramkę; `true` możliwe tylko przy 'zamknieto_karte_ukonczenia' (BR-DAN-012, P-150). */
export type ZdarzenieProsby =
  | 'start'
  | 'zamknieto_karte_ukonczenia'
  | 'plus'
  | 'minus'
  | 'komunikat_limitu'
  | 'okno_uczciwe_zasady'
  | 'ekran_zakupu'
  | 'ocen_w_ustawieniach';

/** Wartość klucza `ustawienie` `ostatnia_prosba_o_ocene` (dane.md): wersja aplikacji i dzień lokalny (RD-16) ostatniej prośby. */
export type OstatniaProsba = { wersja: string; dzien: string };

export interface WejscieProsby {
  zdarzenie: ZdarzenieProsby;
  wersja: string;            // wersja aplikacji (CFBundleShortVersionString); pusta = nieznana → false
  ostatniaProsba?: unknown;  // odczyt klucza bez walidacji: brak albo zły kształt = jak brak prośby (PO-11)
  dzis: string;              // Zegar.teraz().dzien, RRRR-MM-DD
  dostepna: boolean;         // StoreReview.isAvailableAsync(); false w TestFlight (PO-08)
}

export type CzyProsicOOcene = (w: WejscieProsby) => boolean;

const czyData = (d: unknown): d is string => {
  if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [r, m, n] = d.split('-').map(Number);
  const t = new Date(Date.UTC(r, m - 1, n));
  return t.getUTCFullYear() === r && t.getUTCMonth() === m - 1 && t.getUTCDate() === n;
};
const numerDnia = (d: string): number => { const [r, m, n] = d.split('-').map(Number); return Date.UTC(r, m - 1, n) / 86_400_000; };
const poprawnaProsba = (p: unknown): p is OstatniaProsba =>
  typeof p === 'object' && p !== null && 'wersja' in p && typeof p.wersja === 'string' && p.wersja.length > 0 && 'dzien' in p && czyData(p.dzien);

/** Bramka (moduly.md „Prośba o ocenę”): tylko po zamknięciu karty ukończenia, raz na wersję, co najmniej ODSTEP_PROSBY_DNI dni; wątpliwość → false. */
export function czyProsicOOcene(w: WejscieProsby): boolean {
  if (w.zdarzenie !== 'zamknieto_karte_ukonczenia' || w.dostepna !== true || typeof w.wersja !== 'string' || w.wersja.length === 0 || !czyData(w.dzis)) return false;
  const p = w.ostatniaProsba;
  if (!poprawnaProsba(p)) return true; // brak, null albo zły kształt = jak brak prośby (PO-02, PO-11)
  if (PROSB_NA_WERSJE <= 1 && p.wersja === w.wersja) return false; // PO-03, PO-10
  const dni = numerDnia(w.dzis) - numerDnia(p.dzien);
  return dni >= 0 && dni >= ODSTEP_PROSBY_DNI; // zegar cofnięty → false (PO-09)
}
