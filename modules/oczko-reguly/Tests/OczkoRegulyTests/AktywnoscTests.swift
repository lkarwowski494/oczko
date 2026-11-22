// X-DZ-14 (dekoder) i klucze `StanAktywnosci` (część X-DZ-10; ADR-0008 uzupełnienie 2026-10-26 fix-4; P-135 Q5a, P-139): stan płasko + `uwaga` + `jezyk`.
import Foundation
import OczkoReguly
import XCTest

final class AktywnoscTests: XCTestCase {
  let plik = "tests/wspolne/stan-ekranu-blokady-typowy.json"

  /// Brak `uwaga` i `jezyk` (Live Activity sprzed aktualizacji) → nil; znana wartość → ta wartość; pola stanu jak `StanEkranuBlokady`.
  func testDekoderUwagaIJezyk() throws {
    let tekst = try Repo.tekst(plik)
    let bez = try JSONDecoder().decode(StanAktywnosci.self, from: Data(tekst.utf8))
    XCTAssertEqual([bez.uwaga?.rawValue, bez.jezyk], [nil, nil])
    XCTAssertEqual(bez.stan, try StanEkranuBlokady.dekoduj(Data(tekst.utf8)))
    for u in ["odblokuj", "blad_zapisu"] {
      let z = tekst.replacingOccurrences(of: "\"wersja\": 3,", with: "\"wersja\": 3,\n  \"uwaga\": \"\(u)\",\n  \"jezyk\": \"pl\",")
      let s = try JSONDecoder().decode(StanAktywnosci.self, from: Data(z.utf8))
      XCTAssertEqual([s.uwaga?.rawValue, s.jezyk], [u, "pl"])
    }
    let zla = tekst.replacingOccurrences(of: "\"wersja\": 3,", with: "\"wersja\": 3,\n  \"uwaga\": \"inna\",")
    XCTAssertThrowsError(try JSONDecoder().decode(StanAktywnosci.self, from: Data(zla.utf8)), "nieznana uwaga to błąd, nie nil")
  }

  /// Kodowanie: klucze stanu płasko + `uwaga` i `jezyk` (null, gdy brak); ponowny odczyt = to samo.
  func testKlucze() throws {
    let stan = try StanEkranuBlokady.dekoduj(Repo.dane(plik))
    let a = StanAktywnosci(stan: stan, uwaga: .blad_zapisu, jezyk: "pl")
    let json = try Json.z(JSONEncoder().encode(a))
    guard case let .obiekt(o) = json, case let .obiekt(wzor) = try Repo.json(plik) else { return XCTFail() }
    XCTAssertEqual(Set(o.keys), Set(wzor.keys).union(["uwaga", "jezyk"]))
    XCTAssertEqual(try JSONDecoder().decode(StanAktywnosci.self, from: JSONEncoder().encode(StanAktywnosci(stan: stan, uwaga: nil, jezyk: nil))).stan, stan)
  }
}
