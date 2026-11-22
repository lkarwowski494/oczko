// Atrybuty Live Activity sesji (ADR-0008, moduly.md „Stan Live Activity i zegarka”): stan treści = StanAktywnosci (stan v3 płasko + `uwaga`, `jezyk`).
// Ten sam typ (nazwa i pola) w module aplikacji i w widżecie — kopia targets/widget/Atrybuty.swift (scripts/natywne/kopie.json).
import ActivityKit
import Foundation

public struct OczkoAtrybuty: ActivityAttributes {
  // ADR-0008, uzupełnienie 2026-10-26 (P-135 Q5a, P-139): pola stanu płasko + `uwaga` (odblokuj | blad_zapisu | null) + `jezyk` (język aplikacji).
  public typealias ContentState = StanAktywnosci
  /// Identyfikator urządzenia do pola `urzadzenie` linii dziennika (stały przez całą Live Activity).
  public let urzadzenie: String
  public init(urzadzenie: String) { self.urzadzenie = urzadzenie }
}
