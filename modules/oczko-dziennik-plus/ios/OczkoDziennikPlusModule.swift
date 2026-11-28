// Most JS ↔ Swift (Expo Modules API, ADR-0007): dziennik +1 (odczyt i skrócenie przez kolejkę jedynego pisarza, ADR-0008), Live Activity
// (start, aktualizacja, koniec; stan = StanEkranuBlokady w JSON + język aplikacji → StanAktywnosci, `uwaga` = null), SHA-256 pliku (P-130) i łącze z zegarkiem (ADR-0009). Adaptery TS: src/platforma/.
import ActivityKit
import ExpoModulesCore
import Foundation
import UIKit

public class OczkoDziennikPlusModule: Module {
  // KO-241 (P-1130): token obserwatora `UIApplication.willTerminateNotification`; sprzątany w `OnDestroy`.
  private var obserwatorKonca: NSObjectProtocol?

  // Liczba z JS jest Double (expo-modules-core 57.0.23, `DynamicNumberType.cast`: `jsValue.getDouble()`); `Double?` omija zaokrąglenie i pułapkę `Int64(NaN/∞)`. Wartość nieskończona albo NaN = bez `staleDate` (FB2, P3 recenzji FB1).
  static func data(_ ms: Double?) -> Date? { ms.flatMap { $0.isFinite ? Date(timeIntervalSince1970: $0 / 1000) : nil } }

  public func definition() -> ModuleDefinition {
    Name("OczkoDziennikPlus")

    // KO-241 (P-1130): zamknięcie aplikacji z przełącznika (przeciągnięcie w górę) kończy Live Activity z `.immediate` — karta znika też z ekranu blokady i Dynamic Island.
    // Najwyżej 1,5 s i tylko, gdy aktywność istnieje (brak aktywności = bez blokowania). Minimalizacja i blokada ekranu nie wysyłają tego powiadomienia — aktywność zostaje.
    // Uwaga (Apple, applicationWillTerminate): dla aplikacji z pracą w tle metoda „is generally not called when the user quits the app”; zawieszoną aplikację system kończy bez powiadomienia — zakres sprawdza PU-348 (F).
    OnCreate { [weak self] in
      self?.obserwatorKonca = KoniecProcesu.obserwuj(nazwa: UIApplication.willTerminateNotification) {
        for a in Activity<OczkoAtrybuty>.activities { await a.end(nil, dismissalPolicy: .immediate) }
      }
    }
    OnDestroy { [weak self] in
      if let o = self?.obserwatorKonca { NotificationCenter.default.removeObserver(o) }
      self?.obserwatorKonca = nil
    }

    AsyncFunction("odczytajTekst") { () throws -> String in try DziennikPlus.wspolny.tekst() }
    AsyncFunction("skroc") { (doId: String) throws in try DziennikPlus.wspolny.skroc(doId: doId) }

    // Każda aktualizacja z JS czyści `uwaga` (ADR-0008, 2026-10-26); `jezyk` = język aplikacji (P-139), nil = angielski.
    // `staleDateMs` (ADR-0037 reguła 4): ostatnia zmiana + min(próg przypominacza, koniec), liczy go TS (`dataNieaktualnosci`, SD-01…SD-04); nil = bez `staleDate`.
    // Argument końcowy opcjonalny: wywołanie z 3 argumentami (adapter sprzed 1.0.2) dalej działa (expo-modules-core: trailing optional).
    AsyncFunction("liveStart") { (stanJson: String, urzadzenie: String, jezyk: String?, staleDateMs: Double?) async throws -> String in
      let stan = StanAktywnosci(stan: try StanEkranuBlokady.dekoduj(Data(stanJson.utf8)), uwaga: nil, jezyk: jezyk)
      for a in Activity<OczkoAtrybuty>.activities { await a.end(nil, dismissalPolicy: .immediate) } // jedna sesja na ekranie blokady
      let a = try Activity<OczkoAtrybuty>.request(attributes: OczkoAtrybuty(urzadzenie: urzadzenie), content: ActivityContent(state: stan, staleDate: Self.data(staleDateMs)), pushType: nil)
      return a.id
    }
    AsyncFunction("liveAktualizuj") { (stanJson: String, jezyk: String?, staleDateMs: Double?) async throws in
      let stan = StanAktywnosci(stan: try StanEkranuBlokady.dekoduj(Data(stanJson.utf8)), uwaga: nil, jezyk: jezyk)
      for a in Activity<OczkoAtrybuty>.activities { await a.update(ActivityContent(state: stan, staleDate: Self.data(staleDateMs))) }
    }
    AsyncFunction("liveZakoncz") { () async in
      for a in Activity<OczkoAtrybuty>.activities { await a.end(nil, dismissalPolicy: .immediate) }
    }
    // ADR-0037 reguła 2: „aktywna” czytana z systemu (stan `active` albo `stale`) zamiast flagi w pamięci procesu — naprawia brak powrotu po końcu systemowym (8 h).
    Function("liveAktywna") { () -> Bool in !Activity<OczkoAtrybuty>.activities.isEmpty }
    Function("liveDostepne") { () -> Bool in ActivityAuthorizationInfo().areActivitiesEnabled }

    AsyncFunction("sha256Pliku") { (sciezka: String) throws -> String in try Skrot.sha256Pliku(sciezka) }

    Events("zegarekZdarzenia")
    AsyncFunction("zegarekWyslij") { (stanJson: String, potwierdzone: [String], jezyk: String?) throws in
      _ = try StanEkranuBlokady.dekoduj(Data(stanJson.utf8)) // zegarek dostaje tylko poprawny stan
      try ZegarekHub.shared.wyslijStan(stanJson, potwierdzone: potwierdzone, jezyk: jezyk)
    }
    OnStartObserving { ZegarekHub.shared.poZapisie = { [weak self] linie in self?.sendEvent("zegarekZdarzenia", ["linie": linie]) } }
    OnStopObserving { ZegarekHub.shared.poZapisie = nil }
  }
}
