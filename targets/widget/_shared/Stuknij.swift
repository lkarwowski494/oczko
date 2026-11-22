// Intencja +1/−1 z Live Activity (ADR-0008, uzupełnienie (4)): kompilowana do aplikacji i do widżetu (`_shared`, apple-targets); `perform()`
// działa w procesie aplikacji („in the app's process”, rejestr Apple 1e) i woła moduł OczkoDziennikPlus. W widżecie modułu nie ma —
// tam intencja służy tylko przyciskowi. NAZWA TYPU I PARAMETRU ZAMROŻONE (Live Activity starszej wersji woła je po aktualizacji;
// migawka: tests/adaptery/intencja-migawka.test.ts, X-DZ-10).
import AppIntents
import Foundation
#if canImport(OczkoDziennikPlus)
internal import OczkoDziennikPlus // jak ExpoModulesProvider.swift w aplikacji (inny poziom = „ambiguous implicit access level”, przebieg 40261573589)
#endif

struct OczkoStuknij: LiveActivityIntent {
  static var title: LocalizedStringResource = "Count a row"
  static var isDiscoverable: Bool = false

  @Parameter(title: "Kind")
  var rodzaj: String

  init() { rodzaj = "plus" }
  init(rodzaj: String) { self.rodzaj = rodzaj }

  func perform() async throws -> some IntentResult {
    #if canImport(OczkoDziennikPlus)
    try await IntencjaEkranuBlokady.wykonaj(rodzaj: rodzaj)
    #endif
    return .result()
  }
}
