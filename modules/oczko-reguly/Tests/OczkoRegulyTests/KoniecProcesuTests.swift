// KO-241 (P-1130): koniec Live Activity przy zamknięciu z przełącznika aplikacji — logika czekania i obserwator powiadomienia (atrapa pracy zamiast ActivityKit).
// Sam `willTerminateNotification` i `Activity.end` sprawdza test fizyczny PU-348 (F): na Linuksie i macOS bez urządzenia ich nie ma.
import Foundation
import OczkoReguly
import XCTest

final class KoniecProcesuTests: XCTestCase {
  /// Licznik wywołań bezpieczny między wątkami (praca idzie w Task).
  final class Licznik: @unchecked Sendable {
    private let blokada = NSLock()
    private var n = 0
    func dodaj() { blokada.lock(); n += 1; blokada.unlock() }
    var wartosc: Int { blokada.lock(); defer { blokada.unlock() }; return n }
  }

  private func czas(_ blok: () -> Void) -> Double {
    let start = Date()
    blok()
    return Date().timeIntervalSince(start)
  }

  /// Praca szybka: `poczekaj` wraca true, praca wykonana przed powrotem (synchronicznie względem końca procesu).
  func testPracaSzybkaKonczySieWLimicie() {
    let licznik = Licznik()
    var wynik = false
    let t = czas { wynik = KoniecProcesu.poczekaj(limitSekund: 1.5) { licznik.dodaj() } }
    XCTAssertTrue(wynik)
    XCTAssertEqual(licznik.wartosc, 1)
    XCTAssertLessThan(t, 1.0)
  }

  /// Brak aktywności = pusta praca: nie blokuje (powrót natychmiast, bez czekania do limitu).
  func testBrakAktywnosciNieBlokuje() {
    var wynik = false
    let t = czas { wynik = KoniecProcesu.poczekaj(limitSekund: 1.5) {} }
    XCTAssertTrue(wynik)
    XCTAssertLessThan(t, 0.5)
  }

  /// Praca zawieszona: powrót po limicie (nie wcześniej, nie dużo później), wynik false — proces nie wisi.
  func testPracaZawieszonaWracaPoLimicie() {
    var wynik = true
    let t = czas { wynik = KoniecProcesu.poczekaj(limitSekund: 0.3) { try? await Task.sleep(nanoseconds: 3_000_000_000) } }
    XCTAssertFalse(wynik)
    XCTAssertGreaterThanOrEqual(t, 0.25)
    XCTAssertLessThan(t, 1.5)
  }

  /// Powiadomienie → praca wykonana synchronicznie w obsłudze (przed wyjściem z `post`); to samo na prywatnym centrum, więc test nie dotyka globalnego.
  func testPowiadomienieWolaPrace() {
    let centrum = NotificationCenter()
    let nazwa = Notification.Name("OczkoTestWillTerminate")
    let licznik = Licznik()
    let token = KoniecProcesu.obserwuj(nazwa: nazwa, centrum: centrum, limitSekund: 1.5) { licznik.dodaj() }
    centrum.post(name: nazwa, object: nil)
    XCTAssertEqual(licznik.wartosc, 1)
    centrum.removeObserver(token)
  }

  /// Inna nazwa powiadomienia (np. didEnterBackground = minimalizacja, blokada ekranu) nie kończy pracy: aktywność zostaje.
  func testInnePowiadomienieNieWolaPracy() {
    let centrum = NotificationCenter()
    let licznik = Licznik()
    let token = KoniecProcesu.obserwuj(nazwa: Notification.Name("OczkoTestWillTerminate"), centrum: centrum) { licznik.dodaj() }
    centrum.post(name: Notification.Name("OczkoTestDidEnterBackground"), object: nil)
    XCTAssertEqual(licznik.wartosc, 0)
    centrum.removeObserver(token)
  }

  /// Po `removeObserver` powiadomienie nie woła pracy (moduł sprząta w `willDestroy`).
  func testPoUsunieciuObserwatoraBezPracy() {
    let centrum = NotificationCenter()
    let nazwa = Notification.Name("OczkoTestWillTerminate")
    let licznik = Licznik()
    let token = KoniecProcesu.obserwuj(nazwa: nazwa, centrum: centrum) { licznik.dodaj() }
    centrum.removeObserver(token)
    centrum.post(name: nazwa, object: nil)
    XCTAssertEqual(licznik.wartosc, 0)
  }

  /// Praca zawieszona w obserwatorze: `post` wraca po limicie (nie wisi do końca pracy).
  func testPowiadomieniePracaZawieszonaWracaPoLimicie() {
    let centrum = NotificationCenter()
    let nazwa = Notification.Name("OczkoTestWillTerminate")
    let token = KoniecProcesu.obserwuj(nazwa: nazwa, centrum: centrum, limitSekund: 0.3) { try? await Task.sleep(nanoseconds: 3_000_000_000) }
    let t = czas { centrum.post(name: nazwa, object: nil) }
    XCTAssertGreaterThanOrEqual(t, 0.25)
    XCTAssertLessThan(t, 1.5)
    centrum.removeObserver(token)
  }
}
