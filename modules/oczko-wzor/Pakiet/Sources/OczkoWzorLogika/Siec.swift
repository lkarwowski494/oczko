// Stan sieci dla JS (ADR-0031 pkt 1, 07-jakosc-017, K-17f): mapowanie statusu ścieżki (`NWPath.Status`, Apple: satisfied — „The path is available to establish
// connections and send data.”; unsatisfied — „The path is not available for use.”; requiresConnection — „The path is not currently available, but
// establishing a new connection may activate the path.”, odczyt 2026-11-01) na napis portu `Siec` w TS. To podpowiedź o ścieżce, nie gwarancja osiągalności serwera.
// Pakiet nie importuje `Network` (testy także na Linuksie): moduł Expo mapuje `NWPath.Status` na `StatusSciezki` (ios/SiecMonitor.swift).
public enum StatusSciezki: Sendable { case satisfied, unsatisfied, requiresConnection }

/// `nil` = monitor jeszcze nie odpowiedział albo przyszły, nieznany status → „nieznany” (JS próbuje jak przy „jest”).
public func stanSieci(_ status: StatusSciezki?) -> String {
  switch status {
  case .satisfied: return "jest"
  case .unsatisfied, .requiresConnection: return "brak"
  case nil: return "nieznany"
  }
}
