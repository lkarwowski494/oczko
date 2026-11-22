// X-DZ-08, X-DZ-09 (xctest-specyfikacja.md §1) i reguły ADR-0008 (1), (6) dla decyzji intencji na złotych plikach stanu v2.
import Foundation
import OczkoDziennik
import OczkoReguly
import XCTest

final class IntencjaTests: XCTestCase {
  func stan(_ plik: String) throws -> StanEkranuBlokady { try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/\(plik)")) }
  /// Chwila UTC dla czasu lokalnego Europe/Warsaw w listopadzie 2026 (CET, UTC+1).
  func waw(_ dzien: Int, _ h: Int, _ m: Int = 0) -> Int64 { Int64((Date(timeIntervalSince1970: 1_793_491_200).timeIntervalSince1970 + Double((dzien - 1) * 86_400 + (h - 1) * 3600 + m * 60)) * 1000) }

  /// X-DZ-08: dzień niedozwolony w stanie (stan-ekranu-blokady-limit.json) → bez linii, komunikat limitu.
  func testLimitBezLinii() throws {
    let s = try stan("stan-ekranu-blokady-limit.json")
    XCTAssertEqual(try stuknij(.plus, stan: s, teraz: waw(7, 9), strefa: "Europe/Warsaw", id: "x", urzadzenie: "u"), .limit)
    // Reguły na samym stanie pozwoliłyby (3 dni), ale aplikacja policzyła dziś niedozwolone (dni z innych urządzeń): intencja jej nie podważa.
    let tekst = try Repo.tekst("tests/wspolne/stan-ekranu-blokady-typowy.json").replacingOccurrences(of: "\"dzienDozwolony\": true", with: "\"dzienDozwolony\": false")
    let typowyNiedozwolony = try StanEkranuBlokady.dekoduj(Data(tekst.utf8))
    XCTAssertEqual(try stuknij(.plus, stan: typowyNiedozwolony, teraz: waw(10, 21), strefa: "Europe/Warsaw", id: "x", urzadzenie: "u"), .limit)
  }

  /// X-DZ-09 (Z07-11 (1), M-10): kolejne stuknięcia łańcuchują rodziców — pierwszy = `glowa` ze stanu, potem poprzednie własne id; wartość + k.
  func testLancuchRodzicow() throws {
    var s = try stan("stan-ekranu-blokady-typowy.json")
    let glowa = try XCTUnwrap(s.glowa)
    var rodzice: [[String]] = []
    for (i, id) in ["a1", "a2", "a3"].enumerated() {
      guard case let .zapisz(z, nowy) = try stuknij(.plus, stan: s, teraz: waw(10, 20, i), strefa: "Europe/Warsaw", id: id, urzadzenie: "u") else { return XCTFail("bez zapisu") }
      rodzice.append(z.rodzice)
      XCTAssertEqual([nowy.glowa, String(nowy.wartosc)], [id, String(s.wartosc + 1)])
      s = nowy
    }
    XCTAssertEqual(rodzice, [[glowa], ["a1"], ["a2"]])
  }

  /// ADR-0008 (6), L-04: po północy bez przerwy praca w toku (bez nowego dnia limitu); po przerwie ≥ 60 min nowy dzień zaczęty w stanie.
  func testPolnocIPrzerwa() throws {
    let s0 = try stan("stan-ekranu-blokady-typowy.json") // 2026-11-10, 3 dni w miesiącu
    guard case let .zapisz(_, wieczor) = try stuknij(.plus, stan: s0, teraz: waw(10, 23, 50), strefa: "Europe/Warsaw", id: "w", urzadzenie: "u") else { return XCTFail() }
    guard case let .zapisz(z1, poPolnocy) = try stuknij(.plus, stan: wieczor, teraz: waw(11, 0, 20), strefa: "Europe/Warsaw", id: "p", urzadzenie: "u") else { return XCTFail() }
    XCTAssertEqual(z1.dzien, "2026-11-11")
    XCTAssertFalse(poPolnocy.dniWMiesiacu.contains { $0.dzien == "2026-11-11" }, "praca w toku po północy nie zaczyna dnia (L-04)")
    guard case let .zapisz(_, rano) = try stuknij(.plus, stan: poPolnocy, teraz: waw(11, 9), strefa: "Europe/Warsaw", id: "r", urzadzenie: "u") else { return XCTFail() }
    XCTAssertTrue(rano.dniWMiesiacu.contains(DzienStanu(dzien: "2026-11-11", pro: false)))
  }

  /// Nowy dzień ponad limit po zmianie daty: aplikacja nie przeliczyła stanu (dzień w stanie = wczoraj), intencja liczy sama (ADR-0008 (6)).
  func testNowyDzienPonadLimitBezAplikacji() throws {
    let s = try stan("stan-ekranu-blokady-limit.json") // 2026-11-07, 5 dni (1–5) bez Pro
    XCTAssertEqual(try stuknij(.plus, stan: s, teraz: waw(8, 10), strefa: "Europe/Warsaw", id: "x", urzadzenie: "u"), .limit)
  }

  /// −1 przy zerze bez linii; −1 nie woła strażnika (KP-02) — dozwolone także na limicie; `pro` linii = Pro ze stanu w chwili stuknięcia.
  func testMinusIPro() throws {
    let limit = try stan("stan-ekranu-blokady-limit.json")
    XCTAssertEqual(try stuknij(.minus, stan: limit, teraz: waw(7, 9), strefa: "Europe/Warsaw", id: "m", urzadzenie: "u"), .bezZmiany)
    let pro = try stan("stan-zegarka-pro-dozywotni.json")
    guard case let .zapisz(z, _) = try stuknij(.minus, stan: pro, teraz: waw(10, 21), strefa: "Europe/Warsaw", id: "m2", urzadzenie: "u") else { return XCTFail() }
    XCTAssertEqual([z.rodzaj.rawValue, String(z.pro), z.zrodlo.rawValue], ["minus", "true", "ekran_blokady"])
  }

  /// Stan z podmienioną blokadą (pole `zablokowany`, stan v3).
  func zablokowany(_ s: StanEkranuBlokady, _ z: Bool = true) -> StanEkranuBlokady {
    StanEkranuBlokady(wersja: s.wersja, licznikId: s.licznikId, nazwa: s.nazwa, wartosc: s.wartosc, znaczenie: s.znaczenie, glowa: s.glowa, ostatniPlusMs: s.ostatniPlusMs,
                      dzien: s.dzien, dzienDozwolony: s.dzienDozwolony, sesjaStartMs: s.sesjaStartMs, pro: s.pro, proWaznoscDo: s.proWaznoscDo,
                      dniWMiesiacu: s.dniWMiesiacu, przypomnienia: s.przypomnienia, zablokowany: z)
  }

  /// X-DZ-15 (N1, P-135 Q7a): `zablokowany: true` → `.zablokowany`, bez linii; przed limitem (zablokowany i `dzienDozwolony: false` → zablokowany); −1 też.
  func testZablokowanyPrzedLimitem() throws {
    XCTAssertEqual(try stuknij(.plus, stan: zablokowany(try stan("stan-ekranu-blokady-typowy.json")), teraz: waw(10, 21), strefa: "Europe/Warsaw", id: "x", urzadzenie: "u"), .zablokowany)
    XCTAssertEqual(try stuknij(.plus, stan: zablokowany(try stan("stan-ekranu-blokady-limit.json")), teraz: waw(7, 9), strefa: "Europe/Warsaw", id: "x", urzadzenie: "u"), .zablokowany)
    XCTAssertEqual(try stuknij(.minus, stan: zablokowany(try stan("stan-ekranu-blokady-typowy.json")), teraz: waw(10, 21), strefa: "Europe/Warsaw", id: "x", urzadzenie: "u"), .zablokowany)
    guard case .zapisz = try stuknij(.plus, stan: zablokowany(try stan("stan-ekranu-blokady-typowy.json"), false), teraz: waw(10, 21), strefa: "Europe/Warsaw", id: "x", urzadzenie: "u") else { return XCTFail("odblokowany licznik ma liczyć") }
  }

  /// P-138, P-132 (2c): `ostatniPlusMs` = ostatnie +1 (wejście przerwy nowego dnia) — −1 go nie zmienia, +1 ustawia na czas stuknięcia (jak TS `ostatniPlus`).
  func testOstatniPlusTylkoPoPlus() throws {
    let s = try stan("stan-ekranu-blokady-typowy.json")
    guard case let .zapisz(_, poMinus) = try stuknij(.minus, stan: s, teraz: waw(10, 21, 30), strefa: "Europe/Warsaw", id: "m", urzadzenie: "u") else { return XCTFail() }
    XCTAssertEqual(poMinus.ostatniPlusMs, s.ostatniPlusMs, "−1 nie przesuwa ostatniego +1")
    guard case let .zapisz(_, poPlus) = try stuknij(.plus, stan: poMinus, teraz: waw(10, 21, 31), strefa: "Europe/Warsaw", id: "p", urzadzenie: "u") else { return XCTFail() }
    XCTAssertEqual(poPlus.ostatniPlusMs, waw(10, 21, 31))
  }
}
