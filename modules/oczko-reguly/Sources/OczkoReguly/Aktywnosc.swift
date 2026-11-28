// Koniec Live Activity po czasie (ADR-0037, KO-234): `staleDate` treści Live Activity — czysta funkcja (wektory SD-01…SD-04 w docs/architektura/wektory-1-0-2.json).
// Stała `liveKoniecPoMs` pochodzi z `LIVE_KONIEC_PO_MS` (src/konfiguracja.ts) przez generator Stale.swift (P-1127, MS1).
import Foundation

/// Czas bez liczenia, po którym Live Activity jest „nieaktualna” (ADR-0037: 2 h [OCENA]).
public let liveKoniecPoMs: Int64 = Stale.liveKoniecPoMs

/// `staleDate` w ms UTC: ostatnia zmiana licznika + min(próg przypominacza U7-B, koniec); przypominacz wyłączony (`nil`) = + koniec; brak zmian = nil (SD-01…SD-04).
public func dataNieaktualnosci(ostatniaZmianaMs: Int64?, przypominaczMs: Int64?, koniecPoMs: Int64) -> Int64? {
  guard let zmiana = ostatniaZmianaMs else { return nil }
  return zmiana + min(przypominaczMs ?? koniecPoMs, koniecPoMs)
}
