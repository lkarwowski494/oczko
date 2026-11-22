// K-05g (ADR-0030, partia-8-kontrakty.md §3; 07-jakosc-005): funkcja wzorca haptyki zegarka na złotym stanie zegarka z planem przypomnień
// „od 12, co 6, 8 razy” (rzędy 12, 18, …, 54). Stan typowy ma 47 skończonych: rząd w robocie = 48 (z przypomnieniem).
import Foundation
import OczkoDziennik
import OczkoReguly
import XCTest

final class HaptykaZegarkaTests: XCTestCase {
  /// Stan typowy z podmienioną liczbą skończonych i blokadą (reszta ze złotego pliku, jak ZegarekSkrzynkaTests).
  func stan(skonczone: Int = 47, zablokowany: Bool = false) throws -> StanEkranuBlokady {
    let t = try Repo.tekst("tests/wspolne/stan-zegarka-typowy.json")
      .replacingOccurrences(of: "\"wartosc\": 47", with: "\"wartosc\": \(skonczone)")
      .replacingOccurrences(of: "\"zablokowany\": false", with: "\"zablokowany\": \(zablokowany)")
    return try StanEkranuBlokady.dekoduj(Data(t.utf8))
  }
  /// 2026-11-10 21:00 Europe/Warsaw (dzień stanu), jak testMinusIPro.
  let teraz: Int64 = 1_793_491_200_000 + 9 * 86_400_000 + 20 * 3_600_000
  func wzorzec(_ rodzaj: ZdarzenieWejsciowe.Rodzaj, _ s: StanEkranuBlokady) throws -> WzorzecHaptykiZegarka? {
    let w = try stuknij(rodzaj, stan: s, teraz: teraz, strefa: "Europe/Warsaw", id: "h1", urzadzenie: "u", zrodlo: .zegarek)
    return wzorzecHaptykiZegarka(rodzaj, .wynik(w))
  }

  func testWejscieNaRzadZPrzypomnieniem() throws {
    XCTAssertEqual(try wzorzec(.plus, try stan(skonczone: 46)), .przypomnienie, "46 → 47 skończonych: rząd w robocie 48 = od 12 + 6 · 6")
    XCTAssertEqual(try wzorzec(.plus, try stan(skonczone: 10)), .przypomnienie, "10 → 11 skończonych: rząd w robocie 12 = pierwszy rząd planu")
    XCTAssertEqual(try wzorzec(.plus, try stan(skonczone: 52)), .przypomnienie, "52 → 53 skończonych: rząd w robocie 54 = ostatnie powtórzenie (od + 7 · co)")
  }

  func testZwyklyRzadToPlus() throws {
    XCTAssertEqual(try wzorzec(.plus, try stan(skonczone: 47)), .plus, "47 → 48 skończonych: rząd w robocie 49 bez przypomnienia")
    XCTAssertEqual(try wzorzec(.plus, try stan(skonczone: 11)), .plus, "11 → 12 skończonych: rząd w robocie 13 (przypomnienie było przy 12)")
    XCTAssertEqual(try wzorzec(.plus, try stan(skonczone: 58)), .plus, "58 → 59 skończonych: rząd w robocie 60 leży poza planem (razy = 8, RD-13 „Granica”)")
  }

  func testMinusNigdyNieDajePrzypomnienia() throws {
    XCTAssertEqual(try wzorzec(.minus, try stan(skonczone: 48)), .plus, "48 → 47: rząd w robocie 48 ma przypomnienie, ale −1 to spadek (RD-13 W20–W25)")
    XCTAssertEqual(try wzorzec(.minus, try stan(skonczone: 47)), .plus)
  }

  func testNieudanyZapisToBladZapisu() {
    XCTAssertEqual(wzorzecHaptykiZegarka(.plus, .zapisNieudany), .bladZapisu)
    XCTAssertEqual(wzorzecHaptykiZegarka(.minus, .zapisNieudany), .bladZapisu)
  }

  func testZablokowanyLicznikToBlokadaStukniecie() throws {
    XCTAssertEqual(try wzorzec(.plus, try stan(skonczone: 46, zablokowany: true)), .blokadaStukniecie, "blokada przed przypomnieniem")
    XCTAssertEqual(try wzorzec(.minus, try stan(zablokowany: true)), .blokadaStukniecie)
  }

  func testBezHaptykiGdyNicSieNieZapisalo() throws {
    XCTAssertNil(try wzorzec(.minus, try stan(skonczone: 0)), "−1 przy zerze: bezZmiany")
    XCTAssertNil(wzorzecHaptykiZegarka(.plus, .wynik(.limit)))
  }
}
