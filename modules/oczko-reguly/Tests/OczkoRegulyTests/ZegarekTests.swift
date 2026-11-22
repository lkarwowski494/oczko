// Skrzynka zegarka (ADR-0009 uzupełnienie, NFR-ZEG-001, P-039): stuknięcia bez telefonu, potwierdzenie przez `glowa` kontekstu, Pro ze StoreKit
// zegarka (KP-17, OR źródeł) na złotych plikach stanu. 08 partia 4: skrzynka z magazynem (plik w katalogu tymczasowym, ADR-0009 2026-10-26 pkt 1).
import Foundation
import OczkoDziennik
import OczkoReguly
import XCTest

/// Pusta skrzynka na nowym pliku w katalogu tymczasowym (08 partia 4: skrzynka wymaga magazynu).
func nowaSkrzynka(_ magazyn: MagazynSkrzynki = PlikSkrzynki(sciezka: FileManager.default.temporaryDirectory.appendingPathComponent("oczko-skrzynka-\(UUID().uuidString).jsonl").path)) throws -> SkrzynkaZegarka {
  try SkrzynkaZegarka(magazyn: magazyn)
}

final class ZegarekTests: XCTestCase {
  func stan(_ plik: String) throws -> StanEkranuBlokady { try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/\(plik)")) }
  let wieczor: Int64 = 1_794_340_800_000 // 2026-11-10 21:00 Europe/Warsaw

  func testBezTelefonuIPotwierdzenie() throws {
    var s = try nowaSkrzynka()
    XCTAssertEqual(try s.stuknijNaZegarku(.plus, teraz: wieczor, strefa: "Europe/Warsaw", id: "z0", urzadzenie: "zegarek"), .bezZmiany, "przed pierwszym kontekstem")
    let k = try stan("stan-zegarka-typowy.json")
    s.przyjmij(k)
    for (i, id) in ["z1", "z2", "z3"].enumerated() {
      guard case let .zapisz(z, _) = try s.stuknijNaZegarku(.plus, teraz: wieczor + Int64(i) * 60_000, strefa: "Europe/Warsaw", id: id, urzadzenie: "zegarek") else { return XCTFail() }
      XCTAssertEqual(z.zrodlo, .zegarek)
    }
    XCTAssertEqual(s.pokazywany?.wartosc, k.wartosc + 3)
    XCTAssertEqual(s.oczekujace.map(\.rodzice), [[k.glowa!], ["z1"], ["z2"]])
    // Telefon scalił z1 i z2 (glowa = z2): z3 dalej oczekuje i jest nałożone na nowy kontekst.
    let poScaleniu = k.po(2, glowa: "z2", czasMs: wieczor + 60_000, dzien: k.dzien, dni: k.dniWMiesiacu)
    s.przyjmij(poScaleniu)
    XCTAssertEqual(s.oczekujace.map(\.id), ["z3"])
    XCTAssertEqual([s.pokazywany?.wartosc, s.pokazywany.map { $0.glowa == "z3" ? 1 : 0 }], [k.wartosc + 3, 1])
  }

  /// P-039, ADR-0009 D: limit na zegarku bez telefonu; Pro ze StoreKit zegarka zdejmuje limit (OR źródeł).
  func testLimitIProZeSklepu() throws {
    var s = try nowaSkrzynka()
    let limit = try stan("stan-ekranu-blokady-limit.json") // 2026-11-07, 5 darmowych dni użytych
    s.przyjmij(limit)
    let rano: Int64 = 1794124800000 // 2026-11-08 09:00 Europe/Warsaw (nowy dzień)
    XCTAssertEqual(try s.stuknijNaZegarku(.plus, teraz: rano, strefa: "Europe/Warsaw", id: "x", urzadzenie: "zegarek"), .limit)
    let dozywotni = [Uprawnienie(produkt: "oczko.pro.lifetime", wygasa: nil, odebrane: false)]
    guard case let .zapisz(z, nowy) = try s.stuknijNaZegarku(.plus, teraz: rano, strefa: "Europe/Warsaw", id: "y", urzadzenie: "zegarek", sklep: dozywotni) else { return XCTFail("Pro ze sklepu zegarka nie zdjęło limitu") }
    XCTAssertEqual([String(z.pro), z.dzien], ["true", "2026-11-08"])
    XCTAssertTrue(nowy.dniWMiesiacu.contains(DzienStanu(dzien: "2026-11-08", pro: true)))
  }

  /// P-199 Q6a (ADR-0009 uzupełnienie fix-6): linia „iPhone not nearby. N changes…” dopiero, gdy najstarsza pozycja kolejki czeka
  /// ≥ `Stale.zegarekPonowienieMs` (15 min) od stuknięcia; N = cała kolejka; po potwierdzeniu znika. 14:59 → brak, 15:00 → 2.
  func testLiniaNiewyslanychPoProgu() throws {
    var s = try nowaSkrzynka()
    let k = try stan("stan-zegarka-typowy.json")
    s.przyjmij(k)
    XCTAssertNil(s.niewyslane(teraz: wieczor), "pusta kolejka")
    _ = try s.stuknijNaZegarku(.plus, teraz: wieczor, strefa: "Europe/Warsaw", id: "z1", urzadzenie: "zegarek")
    _ = try s.stuknijNaZegarku(.plus, teraz: wieczor + 10 * 60_000, strefa: "Europe/Warsaw", id: "z2", urzadzenie: "zegarek")
    XCTAssertEqual(Stale.zegarekPonowienieMs, 900_000)
    XCTAssertNil(s.niewyslane(teraz: wieczor + 14 * 60_000 + 59_000), "14:59 — jeszcze bez linii (bez migotania po każdym stuknięciu)")
    XCTAssertEqual(s.niewyslane(teraz: wieczor + 15 * 60_000), 2, "15:00 — linia z liczbą całej kolejki")
    s.przyjmij(k.po(2, glowa: "z2", czasMs: wieczor + 10 * 60_000, dzien: k.dzien, dni: k.dniWMiesiacu))
    XCTAssertNil(s.niewyslane(teraz: wieczor + 20 * 60_000), "po potwierdzeniu kolejka pusta")
  }

  /// Kontekst innego licznika: oczekujące poprzedniego licznika nie giną, wartość pokazywana = nowy kontekst.
  func testZmianaLicznika() throws {
    var s = try nowaSkrzynka()
    let k = try stan("stan-zegarka-typowy.json")
    s.przyjmij(k)
    _ = try s.stuknijNaZegarku(.plus, teraz: wieczor, strefa: "Europe/Warsaw", id: "a", urzadzenie: "zegarek")
    let inny = try StanEkranuBlokady.dekoduj(Data(try Repo.tekst("tests/wspolne/stan-zegarka-typowy.json").replacingOccurrences(of: k.licznikId, with: "11111111-2222-4333-8444-555555555555").utf8))
    s.przyjmij(inny)
    XCTAssertEqual([s.oczekujace.map(\.id), [String(s.pokazywany?.wartosc ?? -1)]], [["a"], [String(inny.wartosc)]])
  }

  /// NZ-08-P3-05 (e3), P-135, X-ZG-03 (wektor ZG-03): głowa kontekstu licznika B nie usuwa niepotwierdzonego zdarzenia licznika A.
  /// Test oczekujący roli 05 (fix-4), zazieleniony przez 08 (partia 4): reguła głowy w obrębie licznika (ADR-0009, 2026-10-26 pkt 4).
  func testGlowaInnegoLicznikaNieUsuwa() throws {
    var s = try nowaSkrzynka()
    let a = try stan("stan-zegarka-typowy.json")
    s.przyjmij(a)
    _ = try s.stuknijNaZegarku(.plus, teraz: wieczor, strefa: "Europe/Warsaw", id: "a1", urzadzenie: "zegarek")
    let tekstB = try Repo.tekst("tests/wspolne/stan-zegarka-typowy.json").replacingOccurrences(of: a.licznikId, with: "11111111-2222-4333-8444-555555555555")
    let b = try StanEkranuBlokady.dekoduj(Data(tekstB.utf8))
    s.przyjmij(b.po(5 - b.wartosc, glowa: "b0", czasMs: wieczor, dzien: b.dzien, dni: b.dniWMiesiacu))
    _ = try s.stuknijNaZegarku(.plus, teraz: wieczor + 60_000, strefa: "Europe/Warsaw", id: "b1", urzadzenie: "zegarek")
    s.przyjmij(b.po(6 - b.wartosc, glowa: "b1", czasMs: wieczor + 60_000, dzien: b.dzien, dni: b.dniWMiesiacu))
    XCTAssertEqual(s.oczekujace.map(\.id), ["a1"], "zdarzenie licznika A zniknęło z kolejki po głowie licznika B (utrata stuknięcia)")
    XCTAssertEqual(s.pokazywany?.wartosc, 6)
  }
}

final class ZegarekTrwaloscTests: XCTestCase {
  /// Trwały zapis zegarka: kontekst i linie oczekujących → po odtworzeniu ten sam stan pokazywany (zegarek uruchomiony ponownie bez telefonu).
  /// 08 partia 4: kolejka z pliku magazynu (nie z pamięci ustawień, ADR-0009 2026-10-26 pkt 1), kontekst z utrwalonego JSON.
  func testOdtworzenie() throws {
    let magazyn = PlikSkrzynki(sciezka: FileManager.default.temporaryDirectory.appendingPathComponent("oczko-skrzynka-\(UUID().uuidString).jsonl").path)
    var s = try nowaSkrzynka(magazyn)
    let k = try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-zegarka-typowy.json"))
    s.przyjmij(k)
    _ = try s.stuknijNaZegarku(.plus, teraz: 1_794_340_800_000, strefa: "Europe/Warsaw", id: "a", urzadzenie: "zegarek")
    let odtworzona = try SkrzynkaZegarka(magazyn: magazyn, kontekst: try JSONDecoder().decode(StanEkranuBlokady.self, from: JSONEncoder().encode(k)))
    XCTAssertEqual(odtworzona, s)
  }
}
