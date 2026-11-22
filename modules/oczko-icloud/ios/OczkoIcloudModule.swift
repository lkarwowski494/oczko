// Most Expo do silnika iCloud (ADR-0007; adapter portu `Synchronizacja`: src/platforma/icloud.ts `silnikNatywny`). Nazwy funkcji i zdarzeń
// = interfejs `OczkoIcloudNatywny` w icloud.ts. Błąd wysyłki niesie `code` (`brak_miejsca` | `siec`) — sterownik JS mapuje go na przyczynę `blad`.
import ExpoModulesCore

/// Błąd wysyłki z kodem dla JS (`error.code`): inicjalizator `Exception(name:description:code:)` z expo-modules-core 57.0.23 (`customCode`).
func BladWysylki(_ kod: String) -> Exception {
  Exception(name: "BladWysylki", description: "iCloud: \(kod)", code: kod)
}

public final class OczkoIcloudModule: Module {
  private lazy var silnik = Silnik(emituj: { [weak self] nazwa, tresc in self?.sendEvent(nazwa, tresc) })

  public func definition() -> ModuleDefinition {
    Name("OczkoIcloud")
    Events("partia", "wyslane", "konto", "pobranie")

    AsyncFunction("statusKonta") { () async throws -> String in try await self.silnik.statusKonta() }
    AsyncFunction("uruchom") { (stan: String?) in self.silnik.uruchom(stanBase64: stan) }
    AsyncFunction("wyslij") { (zmiany: String) async throws in try await self.silnik.wyslij(zmiany) }
    AsyncFunction("wylacz") { () async in await self.silnik.wylacz() }
    AsyncFunction("usunStrefe") { () async throws in try await self.silnik.usunStrefe() }
    Function("zakonczonoPartie") { (id: String, ok: Bool) in self.silnik.zakonczono(id: id, ok: ok) }
  }
}
