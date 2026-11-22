// Łącze z zegarkiem po stronie telefonu (ADR-0009, P-110 Q8a): stan → zegarek przez updateApplicationContext (`{ "stan": <StanZegarka>, "potwierdzone": [id] }`,
// oba klucze zawsze razem — ADR-0009, 2026-10-26 pkt 3);
// zdarzenia z zegarka (transferUserInfo `{ "linia": <ZdarzenieWejsciowe> }`) zapisuje jedyny pisarz dziennika +1 (DziennikPlus.wspolny),
// także gdy JS nie działa (aktywacja przy starcie procesu: ZegarekAppDelegate). Skrzynka nie jest kasowana przed COMMIT scalenia (ADR-0008 (3)).
import ExpoModulesCore
import Foundation
import WatchConnectivity

final class ZegarekHub: NSObject, WCSessionDelegate {
  static let shared = ZegarekHub()
  /// Powiadomienie modułu JS o nowych liniach (scalenie dziennika w kolejce zapisów).
  var poZapisie: (([String]) -> Void)?
  private var sesja: WCSession? { WCSession.isSupported() ? WCSession.default : nil }

  func aktywuj() {
    guard let s = sesja else { return }
    s.delegate = self
    if s.activationState != .activated { s.activate() }
  }

  /// `jezyk`: język aplikacji dla tekstów zegarka (P-139; brak klucza = angielski).
  func wyslijStan(_ json: String, potwierdzone: [String], jezyk: String?) throws {
    guard let s = sesja, s.activationState == .activated, s.isPaired, s.isWatchAppInstalled else { return } // bez zegarka: nic do wysłania
    var kontekst: [String: Any] = ["stan": json, "potwierdzone": potwierdzone]
    if let jezyk { kontekst["jezyk"] = jezyk }
    try s.updateApplicationContext(kontekst)
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    guard let linia = userInfo["linia"] as? String, let z = ZdarzenieWejsciowe.zLinii(Substring(linia)), z.zrodlo == .zegarek else { return }
    do {
      try DziennikPlus.wspolny.dopisz(z)
      poZapisie?([z.linia])
    } catch {
      // Nieudany zapis (ADR-0009, 2026-10-26 pkt 6; e1): bez potwierdzenia i bez poZapisie — zegarek trzyma linię w kolejce i ponawia
      // po ZEGAREK_PONOWIENIE_MS; jedyne źródło ponowienia jest na zegarku, scalenie pominie duplikat (M-02).
      NSLog("OczkoZegarek: zapis linii z zegarka nieudany: %@", String(describing: error))
    }
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) { session.activate() }
}

/// Aktywuje WCSession przy starcie procesu — także przy wybudzeniu w tle przez zegarek, zanim ruszy JavaScript (wzór Treningu).
public class ZegarekAppDelegate: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    ZegarekHub.shared.aktywuj()
    return true
  }
}
