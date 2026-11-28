// Koniec procesu aplikacji (KO-241, P-1130): przy `UIApplication.willTerminateNotification` kończymy Live Activity krótko i synchronicznie względem końca procesu.
// Czysta część (Foundation): obserwator powiadomienia o podanej nazwie + czekanie z limitem na pracę async; ActivityKit i UIKit dokłada moduł (modules/oczko-dziennik-plus).
import Foundation

public enum KoniecProcesu {
  /// Limit czekania w module: Apple daje „approximately five seconds” na `applicationWillTerminate` (P-1130), tu 1,5 s — krótko, bez ryzyka przekroczenia.
  public static let limitSekund: Double = 1.5

  /// Uruchamia `praca` i czeka synchronicznie najwyżej `limitSekund`. true = praca skończona w limicie; false = limit (praca idzie dalej w tle, proces i tak się kończy).
  @discardableResult
  public static func poczekaj(limitSekund: Double, praca: @escaping @Sendable () async -> Void) -> Bool {
    let semafor = DispatchSemaphore(value: 0)
    Task.detached { await praca(); semafor.signal() }
    return semafor.wait(timeout: .now() + limitSekund) == .success
  }

  /// Rejestruje obserwatora `nazwa` w `centrum`: po powiadomieniu woła `poczekaj(limitSekund:praca:)`. Zwraca token do `usun`.
  public static func obserwuj(nazwa: Notification.Name, centrum: NotificationCenter = .default, limitSekund: Double = KoniecProcesu.limitSekund, praca: @escaping @Sendable () async -> Void) -> NSObjectProtocol {
    // `queue: nil`: obsługa w wątku, który wysyła powiadomienie (UIKit: główny) — praca ma skończyć się przed powrotem z `post`.
    return centrum.addObserver(forName: nazwa, object: nil, queue: nil) { _ in poczekaj(limitSekund: limitSekund, praca: praca) }
  }
}
