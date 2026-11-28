// Koniec Live Activity po czasie (ADR-0037, KO-234): `staleDate` treści Live Activity — czysta funkcja (wektory SD-01…SD-04 w docs/architektura/wektory-1-0-2.json).
// Stała `liveKoniecPoMs` to ręczna kopia `LIVE_KONIEC_PO_MS` z src/konfiguracja.ts (dopisuje 08-A); po jej dopisaniu przenieść do generatora Stale.swift (P-1127).
import Foundation

/// Czas bez liczenia, po którym Live Activity jest „nieaktualna” (ADR-0037: 2 h [OCENA]).
public let liveKoniecPoMs: Int64 = 7_200_000

/// `staleDate` w ms UTC: ostatnia zmiana licznika + min(próg przypominacza U7-B, koniec); przypominacz wyłączony (`nil`) = + koniec; brak zmian = nil (SD-01…SD-04).
public func dataNieaktualnosci(ostatniaZmianaMs: Int64?, przypominaczMs: Int64?, koniecPoMs: Int64) -> Int64? {
  guard let zmiana = ostatniaZmianaMs else { return nil }
  return zmiana + min(przypominaczMs ?? koniecPoMs, koniecPoMs)
}
