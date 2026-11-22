// X-ST-01–06 (xctest-specyfikacja.md §2): złote pliki stanu bieżącej wersji (3 od 08 partii 4, N1) z tests/wspolne/wzorce.json (typy StanEkranuBlokady, StanZegarka).
import Foundation
import OczkoReguly
import XCTest

final class StanTests: XCTestCase {
  func plikiV2() throws -> [String] {
    try (Repo.json("tests/wspolne/wzorce.json")["stany"]?.tablica ?? [])
      .filter { ["StanEkranuBlokady", "StanZegarka"].contains($0["typ"]?.tekst ?? "") }.compactMap { $0["plik"]?.tekst }
  }

  /// X-ST-01, X-ST-02, X-ST-03: dekodowanie ścisłe, ponowne kodowanie = ten sam zbiór kluczy i wartości, ładunek < 4096 B.
  func testZloteplikiV2() throws {
    let pliki = try plikiV2()
    let w = Wykonane("stany v2")
    for p in pliki {
      w.dodaj(p)
      let dane = try Repo.dane("tests/wspolne/\(p)")
      let stan = try StanEkranuBlokady.dekoduj(dane)
      XCTAssertEqual(stan.wersja, wersjaStanu, p)
      let ponownie = try JSONEncoder().encode(stan)
      XCTAssertEqual(try Json.z(ponownie), try Json.z(dane), p)
      XCTAssertLessThan(ponownie.count, 4096, p)
    }
    w.sprawdz(oczekiwane: pliki, minimum: 7)
  }

  /// X-ST-01, X-ST-04: brak pola, pole przemianowane (R-027) i wersja nowsza niż znana → błąd dekodowania, nie wartość domyślna.
  func testPulapkiDekodera() throws {
    let wzor = try Repo.tekst("tests/wspolne/stan-ekranu-blokady-limit.json")
    XCTAssertNoThrow(try StanEkranuBlokady.dekoduj(Data(wzor.utf8)))
    for (opis, zly) in [
      ("dzien_dozwolony", wzor.replacingOccurrences(of: "\"dzienDozwolony\"", with: "\"dzien_dozwolony\"")),
      ("brak glowa (null ≠ brak)", wzor.replacingOccurrences(of: "\"glowa\": null,", with: "")),
      ("wersja 4", wzor.replacingOccurrences(of: "\"wersja\": 3", with: "\"wersja\": 4")), // stan v3 (08 partia 4, N1): nowsza = 4
      ("pro jako liczba", wzor.replacingOccurrences(of: "\"pro\": false,\n  \"proWaznoscDo\"", with: "\"pro\": 0,\n  \"proWaznoscDo\"")),
    ] {
      XCTAssertNotEqual(zly, wzor, "\(opis): pułapka niczego nie zmieniła")
      XCTAssertThrowsError(try StanEkranuBlokady.dekoduj(Data(zly.utf8)), opis)
    }
    let nowszePole = wzor.replacingOccurrences(of: "\"wersja\": 3,", with: "\"wersja\": 3,\n  \"nowe\": 1,")
    XCTAssertNoThrow(try StanEkranuBlokady.dekoduj(Data(nowszePole.utf8)), "nieznane pole ma być pominięte")
  }

  /// X-ST-05, X-ST-06: Pro ze stanu — dożywotni (null = bez końca), subskrypcja z granicą jak odczyt pamięci (okno offline, koniec wyłączny).
  func testProZeStanu() throws {
    let dozywotni = try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-zegarka-pro-dozywotni.json"))
    XCTAssertEqual(dozywotni.proWaznoscDo, nil)
    XCTAssertTrue(dozywotni.maPro(teraz: 4_000_000_000_000))
    let sub = try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-zegarka-pro-subskrypcja.json"))
    let koniec = try XCTUnwrap(sub.proWaznoscDo)
    XCTAssertTrue(sub.maPro(teraz: koniec - 1))
    XCTAssertTrue(sub.maPro(teraz: koniec + Stale.oknoOfflineProMs - 1))
    XCTAssertFalse(sub.maPro(teraz: koniec + Stale.oknoOfflineProMs))
    XCTAssertFalse(try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-zegarka-typowy.json")).maPro(teraz: 0))
  }

  /// X-ST-07 (N1, P-135 Q7a): plik v3 z `zablokowany` dekoduje się; plik v2 (`*-v2.json`) bez pola → `false`; v3 bez pola → błąd; wersja 4 → odrzucona.
  func testWersja3Blokada() throws {
    let v3 = try Repo.tekst("tests/wspolne/stan-zegarka-typowy.json")
    XCTAssertEqual(try StanEkranuBlokady.dekoduj(Data(v3.utf8)).zablokowany, false)
    let v3z = v3.replacingOccurrences(of: "\"zablokowany\": false", with: "\"zablokowany\": true")
    XCTAssertNotEqual(v3z, v3)
    XCTAssertEqual(try StanEkranuBlokady.dekoduj(Data(v3z.utf8)).zablokowany, true)
    let pliki = try (Repo.json("tests/wspolne/wzorce.json")["stany"]?.tablica ?? [])
      .filter { ["StanEkranuBlokadyV2", "StanZegarkaV2"].contains($0["typ"]?.tekst ?? "") }.compactMap { $0["plik"]?.tekst }
    let w = Wykonane("stany v2 (zgodność)")
    for p in pliki {
      w.dodaj(p)
      let s = try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/\(p)"))
      XCTAssertEqual([s.wersja, s.zablokowany ? 1 : 0], [2, 0], p)
    }
    w.sprawdz(oczekiwane: pliki, minimum: 7)
    let bezPola = v3.replacingOccurrences(of: ",\n  \"zablokowany\": false", with: "")
    XCTAssertNotEqual(bezPola, v3)
    XCTAssertThrowsError(try StanEkranuBlokady.dekoduj(Data(bezPola.utf8)), "v3 bez pola zablokowany")
    XCTAssertThrowsError(try StanEkranuBlokady.dekoduj(Data(v3.replacingOccurrences(of: "\"wersja\": 3", with: "\"wersja\": 4").utf8)), "wersja 4")
  }
}
