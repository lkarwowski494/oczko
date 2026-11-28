// Prototyp B (docs/architektura/1-0-2.md „Prototyp B — zadanie dla 08”, PB1): czy Live Activity przy zakończonym procesie aplikacji
// (a) przerysowuje licznik czasu od `ostatniPlusMs` i (b) zmienia wygląd po `staleDate` (`context.isStale`).
// Cały plik istnieje tylko w buildzie z flagą kompilacji OCZKO_PROTOTYP_B (SWIFT_ACTIVE_COMPILATION_CONDITIONS w .github/workflows/prototyp-b.yml);
// w buildzie wydania i w e2e plik jest pusty. Włączenie w uruchomieniu: zmienna OCZKO_PROTOTYP_B=1 (simctl launch z SIMCTL_CHILD_OCZKO_PROTOTYP_B).
#if OCZKO_PROTOTYP_B
import ActivityKit
import Foundation

public enum PrototypB {
  public static let progStaleSekundy: Double = 60 // staleDate = start + 60 s (PB1, zadanie 1)
  private static var wystartowano = false
  private static let blokada = NSLock()

  public static var aktywny: Bool { ProcessInfo.processInfo.environment["OCZKO_PROTOTYP_B"] == "1" }

  /// Start Live Activity ze stanem sztucznym i `staleDate`; zapis `Documents/prototyp-b.json` (startMs, staleMs, pid) dla skryptu przebiegu.
  public static func start() {
    guard aktywny else { return }
    blokada.lock(); defer { blokada.unlock() }
    guard !wystartowano else { return }
    wystartowano = true
    Task {
      try? await Task.sleep(nanoseconds: 4_000_000_000) // aplikacja na pierwszym planie
      let startMs = Int64((Date().timeIntervalSince1970 * 1000).rounded(.down))
      let staleMs = startMs + Int64(progStaleSekundy * 1000)
      let stan = StanEkranuBlokady(wersja: 3, licznikId: "prototyp-b", nazwa: "Prototyp B", wartosc: 5, znaczenie: .skonczone, glowa: nil,
                                   ostatniPlusMs: startMs, dzien: "2026-11-28", dzienDozwolony: true, sesjaStartMs: nil, pro: false, proWaznoscDo: nil,
                                   dniWMiesiacu: [], przypomnienia: [], zablokowany: false)
      var wynik = "{\"startMs\":\(startMs),\"staleMs\":\(staleMs),\"pid\":\(ProcessInfo.processInfo.processIdentifier)"
      do {
        for a in Activity<OczkoAtrybuty>.activities { await a.end(nil, dismissalPolicy: .immediate) }
        let tresc = ActivityContent(state: StanAktywnosci(stan: stan, uwaga: nil, jezyk: "en"), staleDate: Date(timeIntervalSince1970: Double(staleMs) / 1000))
        let a = try Activity<OczkoAtrybuty>.request(attributes: OczkoAtrybuty(urzadzenie: "prototyp-b"), content: tresc, pushType: nil)
        wynik += ",\"id\":\"\(a.id)\",\"blad\":null}"
      } catch {
        wynik += ",\"id\":null,\"blad\":\"\(String(describing: error).replacingOccurrences(of: "\"", with: "'"))\"}"
      }
      let katalog = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      try? wynik.write(to: katalog.appendingPathComponent("prototyp-b.json"), atomically: true, encoding: .utf8)
    }
  }
}
#endif
