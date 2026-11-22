// Czas w tle z sygnałem wygaśnięcia (ADR-0002 (7), rejestr Apple 2b, 2c, 17): JS sprawdza `czyWygaslo(id)` przed każdą instrukcją długiej
// transakcji; po wygaśnięciu rzuca → ROLLBACK w adapterze bazy → `koniec(id)`. Obsługa wygaśnięcia nie wykonuje SQL: ustawia flagę i czeka
// najwyżej CZEKAJ_NA_JS_S na `koniec` z JS (zwolnienie blokady bazy przed zawieszeniem, 0xdead10cc), potem kończy zadanie sama.
import ExpoModulesCore
import UIKit

public class OczkoCzasWTleModule: Module {
  static let CZEKAJ_NA_JS_S = 2.0
  private let lock = NSLock()
  private var zadania: [String: (task: UIBackgroundTaskIdentifier, wygaslo: Bool, koniec: DispatchSemaphore)] = [:]

  public func definition() -> ModuleDefinition {
    Name("OczkoCzasWTle")

    AsyncFunction("start") { (nazwa: String) -> String in
      let id = UUID().uuidString
      let koniec = DispatchSemaphore(value: 0)
      let zadanie = await MainActor.run {
        UIApplication.shared.beginBackgroundTask(withName: nazwa) { [weak self] in self?.wygasniecie(id) }
      }
      self.lock.withLock { self.zadania[id] = (zadanie, false, koniec) }
      return id
    }
    // Synchronicznie (JSI): wołane przed każdą instrukcją transakcji.
    Function("czyWygaslo") { (id: String) -> Bool in self.lock.withLock { self.zadania[id]?.wygaslo ?? true } }
    AsyncFunction("koniec") { (id: String) in
      guard let z = self.lock.withLock({ self.zadania.removeValue(forKey: id) }) else { return }
      z.koniec.signal()
      if !z.wygaslo { await MainActor.run { UIApplication.shared.endBackgroundTask(z.task) } }
    }
  }

  /// Wywoływane przez system na głównym wątku tuż przed końcem czasu w tle.
  private func wygasniecie(_ id: String) {
    guard let z = lock.withLock({ () -> (task: UIBackgroundTaskIdentifier, wygaslo: Bool, koniec: DispatchSemaphore)? in
      zadania[id]?.wygaslo = true
      return zadania[id]
    }) else { return }
    _ = z.koniec.wait(timeout: .now() + Self.CZEKAJ_NA_JS_S) // JS wycofuje transakcję na następnej instrukcji i woła koniec
    UIApplication.shared.endBackgroundTask(z.task)
  }
}
