// FB1 08-B, U6 (ADR-0036 pkt 1, 3–5; PU-347, PU-350): stan v3 z `krok` (brak = 1), „+2” na zegarku (dwie linie jednym zapisem do skrzynki,
// łańcuch rodziców) i haptyka przypomnienia przy rzędzie przeskoczonym przez „+2” (PS). Stany ze złotych plików z podmienionym tekstem (jak HaptykaZegarkaTests).
import Foundation
import OczkoDziennik
import OczkoReguly
import XCTest

final class KrokZegarekTests: XCTestCase {
  /// Stan zegarka typowy: 47 skończonych, plan „od 12, co 6, 8 razy”; `krok` wstawiony do JSON (nil = bez klucza, jak stan sprzed 1.0.2).
  func tekstStanu(skonczone: Int = 47, krok: Int? = nil) throws -> String {
    var t = try Repo.tekst("tests/wspolne/stan-zegarka-typowy.json").replacingOccurrences(of: "\"wartosc\": 47", with: "\"wartosc\": \(skonczone)")
    if let krok { t = t.replacingOccurrences(of: "\"wersja\": 3,", with: "\"wersja\": 3,\n  \"krok\": \(krok),") }
    return t
  }
  func stan(skonczone: Int = 47, krok: Int? = nil) throws -> StanEkranuBlokady { try StanEkranuBlokady.dekoduj(Data(try tekstStanu(skonczone: skonczone, krok: krok).utf8)) }
  let teraz: Int64 = 1_793_491_200_000 + 9 * 86_400_000 + 20 * 3_600_000 // 2026-11-10 21:00 Europe/Warsaw

  /// ADR-0036 kontrakt Swift pkt 1: brak klucza = 1 (Live Activity z 1.0.1); `krok` 1…2; poza zakresem = błąd dekodowania; kodowanie krok 1 = bez klucza.
  func testKrokWStanie() throws {
    XCTAssertEqual(try stan().krok, 1, "stan sprzed 1.0.2 bez klucza")
    XCTAssertEqual(try stan(krok: 1).krok, 1)
    XCTAssertEqual(try stan(krok: 2).krok, 2)
    for zly in [0, 3, -1] { XCTAssertThrowsError(try stan(krok: zly), "krok \(zly)") }
    // Ponowne kodowanie: ten sam zbiór kluczy co wejście (krok 1 bez klucza — złote pliki sprzed 1.0.2 nie zmieniają się; krok 2 z kluczem).
    let bez = try Json.z(JSONEncoder().encode(stan()))
    XCTAssertNil(bez["krok"])
    let dwa = try Json.z(JSONEncoder().encode(stan(krok: 2)))
    XCTAssertEqual(dwa["krok"]?.calkowita, 2)
    // StanAktywnosci (Live Activity) przenosi krok razem ze stanem.
    let a = try JSONDecoder().decode(StanAktywnosci.self, from: Data(try tekstStanu(krok: 2).utf8))
    XCTAssertEqual(a.stan.krok, 2)
  }

  /// „+2” na zegarku: dwie linie (rodzic łańcuchem, ten sam czas), jeden zapis do skrzynki, stan +2; −1 zostaje −1.
  func testPlusDwaNaZegarku() throws {
    let sciezka = FileManager.default.temporaryDirectory.appendingPathComponent("oczko-krok-\(UUID().uuidString).jsonl").path
    defer { try? FileManager.default.removeItem(atPath: sciezka) }
    var s = try nowaSkrzynka(PlikSkrzynki(sciezka: sciezka))
    let k = try stan(krok: 2)
    s.przyjmij(k)
    guard case let .zapisz(linie, nowy) = try s.stuknijNaZegarku(.plus, teraz: teraz, strefa: "Europe/Warsaw", ids: ["z1", "z2"], urzadzenie: "zegarek") else { return XCTFail("bez zapisu") }
    XCTAssertEqual(linie.map(\.rodzice), [[try XCTUnwrap(k.glowa)], ["z1"]])
    XCTAssertEqual(Set(linie.map(\.czasMs)), [teraz])
    XCTAssertEqual([nowy.wartosc, s.pokazywany?.wartosc], [k.wartosc + 2, k.wartosc + 2])
    XCTAssertEqual(s.oczekujace.map(\.id), ["z1", "z2"])
    XCTAssertEqual(try PlikSkrzynki(sciezka: sciezka).odczytaj(), linie.map(\.linia), "obie linie w pliku skrzynki")
    guard case let .zapisz(minus, po) = try s.stuknijNaZegarku(.minus, teraz: teraz + 1000, strefa: "Europe/Warsaw", ids: ["m1", "m2"], urzadzenie: "zegarek") else { return XCTFail() }
    XCTAssertEqual([minus.count, po.wartosc], [1, k.wartosc + 1], "−1 zostaje −1 przy kroku 2")
  }

  /// PS (ADR-0036 pkt 5): rząd w robocie po stuknięciu, który „przeskoczył” rząd z przypomnieniem, też daje wzorzec przypomnienia.
  func testHaptykaPrzySkoku() throws {
    func wzorzec(_ skonczone: Int, krok: Int) throws -> WzorzecHaptykiZegarka? {
      let w = try stuknij(.plus, stan: try stan(skonczone: skonczone, krok: krok), teraz: teraz, strefa: "Europe/Warsaw", ids: ["h1", "h2"], urzadzenie: "u", zrodlo: .zegarek)
      return wzorzecHaptykiZegarka(.plus, .wynik(w))
    }
    XCTAssertEqual(try wzorzec(46, krok: 2), .przypomnienie, "46 → 48: rząd w robocie 47 → 49 przeskakuje 48 = od 12 + 6 · 6 (PS-01)")
    XCTAssertEqual(try wzorzec(45, krok: 2), .przypomnienie, "45 → 47: rząd w robocie 46 → 48 (PS-03)")
    XCTAssertEqual(try wzorzec(47, krok: 2), .plus, "47 → 49: rząd 48 był już w robocie (PS-02)")
    XCTAssertEqual(try wzorzec(46, krok: 1), .przypomnienie, "krok 1 bez zmian: 46 → 47, rząd 48")
    XCTAssertEqual(try wzorzec(58, krok: 2), .plus, "poza planem (PS-06)")
  }
}
