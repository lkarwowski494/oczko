// X-RG-06 (RD-16, R-133, R-134): dzień lokalny w Swift = wektory RD-16 z tests/wektory/brd.json; kalendarz gregoriański i cyfry ASCII.
import Foundation
import OczkoReguly
import XCTest

final class DzienTests: XCTestCase {
  func testWektoryRD16() throws {
    let lista = (try Repo.json("tests/wektory/brd.json").tablica ?? []).filter { $0["regula"]?.tekst == "RD-16" }
    let w = Wykonane("RD-16")
    let iso = ISO8601DateFormatter()
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let we = try XCTUnwrap(v["wejscie"], id)
      let chwila = we["chwila [UTC]"]?.tekst ?? ""
      let strefa = try XCTUnwrap(we["strefa [IANA]"]?.tekst, id)
      let oczekiwany = try XCTUnwrap(v["oczekiwane"]?["dzień [data]"]?.tekst, id)
      guard let data = iso.date(from: chwila) else {
        XCTAssertEqual(oczekiwany, "błąd danych", "\(id): chwila \(chwila) nieczytelna, a wektor nie oczekuje błędu")
        continue
      }
      XCTAssertEqual(try dzienLokalny(ms: Int64((data.timeIntervalSince1970 * 1000).rounded()), strefa: strefa), oczekiwany, id)
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 20)
  }

  /// Ten sam dzień niezależnie od kalendarza urządzenia: w kalendarzu japońskim rok 2026 to inny numer ery, a wynik zostaje gregoriański.
  func testKalendarzUrzadzeniaBezWplywu() throws {
    let ms: Int64 = 1_793_559_600_000 // 2026-11-01 Europe/Warsaw
    var japonski = Calendar(identifier: .japanese)
    japonski.timeZone = TimeZone(identifier: "Europe/Warsaw")!
    XCTAssertNotEqual(japonski.component(.year, from: Date(timeIntervalSince1970: TimeInterval(ms / 1000))), 2026)
    let d = try dzienLokalny(ms: ms, strefa: "Europe/Warsaw")
    XCTAssertEqual(d, "2026-11-01")
    XCTAssertTrue(d.unicodeScalars.allSatisfy { $0.isASCII })
    XCTAssertThrowsError(try dzienLokalny(ms: ms, strefa: "Nie/Istnieje"))
  }
}
