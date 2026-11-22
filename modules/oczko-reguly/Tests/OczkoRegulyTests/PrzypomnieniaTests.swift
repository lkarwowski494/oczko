// RD-13 po stronie Swift (P-161, P-180): pas przypomnienia na ekranie blokady i zegarku z tej samej reguły co aplikacja
// (`przypomnienieChwili` w src/domena/przypomnienia.ts) — wektory RD-13-W11–W19 z tests/wektory/brd.json; rząd w robocie = skończone + 1 w obu trybach.
import Foundation
import OczkoReguly
import XCTest

private func liczba(_ j: Json?) -> Int? { j?.calkowita.map { Int($0) } }

final class PrzypomnieniaTests: XCTestCase {
  /// Wektory „chwili” RD-13 (wejście z trybem licznika); W1–W10 to wyzwalanie rzędu, W20–W25 sygnał zmiany (tylko aplikacja, bez pasa natywnego).
  func testWektoryRD13Chwila() throws {
    let lista = (try Repo.json("tests/wektory/brd.json").tablica ?? [])
      .filter { $0["regula"]?.tekst == "RD-13" && $0["wejscie"]?["tryb [-]"] != nil }
    let w = Wykonane("RD-13 chwila")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let we = try XCTUnwrap(v["wejscie"], id), o = try XCTUnwrap(v["oczekiwane"], id)
      let plan = PrzypomnienieStanu(od: try XCTUnwrap(liczba(we["s [rz.]"]), id), co: try XCTUnwrap(liczba(we["N [rz.]"]), id),
                                    razy: try XCTUnwrap(liczba(we["M [-]"]), id), tekst: "")
      let tryb: StanEkranuBlokady.Znaczenie = we["tryb [-]"]?.tekst == "rząd w trakcie" ? .w_trakcie : .skonczone
      let skonczone = try XCTUnwrap(liczba(we["skończone [rz.]"]), id)
      if o["liczba na liczniku [rz.]"]?.tekst == "błąd danych" {
        XCTAssertThrowsError(try przypomnienieChwili(skonczone: skonczone, znaczenie: tryb, plan: plan), id)
        continue
      }
      let c = try przypomnienieChwili(skonczone: skonczone, znaczenie: tryb, plan: plan)
      XCTAssertEqual(c, ChwilaPrzypomnienia(licznik: try XCTUnwrap(liczba(o["liczba na liczniku [rz.]"]), id),
                                            rzadPasa: liczba(o["rząd pasa [rz.]"]), k: liczba(o["k [-]"])), id)
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 9)
  }

  /// Plan z N < 1 to błąd danych (RD-13-W5), nie pas.
  func testZlyPlan() {
    XCTAssertThrowsError(try przypomnienieChwili(skonczone: 3, znaczenie: .skonczone, plan: PrzypomnienieStanu(od: 1, co: 0, razy: 3, tekst: "")))
  }

  private func stan(wartosc: Int, znaczenie: StanEkranuBlokady.Znaczenie, przypomnienia: [PrzypomnienieStanu]) -> StanEkranuBlokady {
    StanEkranuBlokady(wersja: 3, licznikId: "l1", nazwa: "Sweter", wartosc: wartosc, znaczenie: znaczenie, glowa: nil, ostatniPlusMs: nil, dzien: "2026-10-26",
                      dzienDozwolony: true, sesjaStartMs: nil, pro: false, proWaznoscDo: nil, dniWMiesiacu: [], przypomnienia: przypomnienia, zablokowany: false)
  }

  /// „Now row {{n}}” = rząd w robocie, skończone + 1 w obu trybach (P-161, `dziergany` w src/domena/licznik.ts) — RD-13-W11/W12: 47 skończonych → rząd 48.
  func testRzadWRobocieWObuTrybach() {
    XCTAssertEqual(rzadWRobocie(stan(wartosc: 47, znaczenie: .skonczone, przypomnienia: [])), 48)
    XCTAssertEqual(rzadWRobocie(stan(wartosc: 47, znaczenie: .w_trakcie, przypomnienia: [])), 48)
  }

  /// Pas: pierwsze przypomnienie w kolejności stanu z pasem na rzędzie w robocie; „+N more” = pozostałe z pasem w tym rzędzie (P-158 (1.1a)).
  func testPasPierwszeWKolejnosciIWiecej() {
    let p1 = PrzypomnienieStanu(od: 6, co: 6, razy: 10, tekst: "Decrease")  // rzędy 6, 12, …, 48 (k = 8)
    let p2 = PrzypomnienieStanu(od: 8, co: 4, razy: 20, tekst: "Cable")     // rzędy 8, 12, …, 48 (k = 11)
    let p3 = PrzypomnienieStanu(od: 1, co: 5, razy: 3, tekst: "Stripe")     // 1, 6, 11 — nie w 48
    XCTAssertEqual(pasPrzypomnienia(stan(wartosc: 47, znaczenie: .skonczone, przypomnienia: [p1, p2, p3])),
                   PasPrzypomnienia(rzad: 48, tekst: "Decrease", k: 8, razy: 10, wiecej: 1))
    XCTAssertEqual(pasPrzypomnienia(stan(wartosc: 47, znaczenie: .w_trakcie, przypomnienia: [p2, p1])),
                   PasPrzypomnienia(rzad: 48, tekst: "Cable", k: 11, razy: 20, wiecej: 1))
    XCTAssertEqual(pasPrzypomnienia(stan(wartosc: 47, znaczenie: .skonczone, przypomnienia: [p3])), nil)
    XCTAssertEqual(pasPrzypomnienia(stan(wartosc: 48, znaczenie: .skonczone, przypomnienia: [p1, p2])), nil) // RD-13-W13: rząd 48 skończony
  }

  /// Zły plan w stanie (np. N = 0 z uszkodzonego ładunku) jest pomijany, nie zatrzymuje pasa innych przypomnień.
  func testZlyPlanWStaniePominiety() {
    let zly = PrzypomnienieStanu(od: 1, co: 0, razy: 3, tekst: "Bad")
    let dobry = PrzypomnienieStanu(od: 6, co: 6, razy: 10, tekst: "Decrease")
    XCTAssertEqual(pasPrzypomnienia(stan(wartosc: 47, znaczenie: .skonczone, przypomnienia: [zly, dobry])),
                   PasPrzypomnienia(rzad: 48, tekst: "Decrease", k: 8, razy: 10, wiecej: 0))
  }
}
