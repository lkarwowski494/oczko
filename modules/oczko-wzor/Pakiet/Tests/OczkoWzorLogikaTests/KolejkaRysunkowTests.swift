// M1-audytor-generalny-084 (DEC-31 a): kolejka zapisu rysunków wzoru. Wyrocznia: test akceptacyjny 084 w planie napraw M1 — „błąd zapisu pliku
// w WidokWzoru → zdarzenie do JS; strona zostaje w kolejce przy zmianie wzoru” — i ADR-0012 (kreski giną najwyżej z ostatniej sekundy).
import Foundation
import XCTest
@testable import OczkoWzorLogika

private struct PelnyDysk: Error {}

final class KolejkaRysunkowTests: XCTestCase {
  private let a = Data("rysunek-a".utf8)
  private let b = Data("rysunek-b".utf8)

  func testUdanyZapisZdejmujeZKolejki() {
    let k = KolejkaRysunkow()
    k.dodaj(wzorId: "w1", strona: 0, dane: a)
    var zapisane: [Data] = []
    let w = k.zapisz { klucz, d in zapisane.append(d); return "/tmp/\(klucz.wzorId)__\(klucz.strona)__x.pkdrawing" }
    XCTAssertEqual(w.zapisane, [ZapisanyRysunek(wzorId: "w1", strona: 0, sciezka: "/tmp/w1__0__x.pkdrawing")])
    XCTAssertEqual(w.nieudane, [])
    XCTAssertEqual(w.oczekujace, 0)
    XCTAssertEqual(zapisane, [a])
    XCTAssertEqual(k.liczba, 0)
  }

  // 084 (i): nieudany zapis nie gubi strony — zostaje do następnej próby, wynik zgłasza porażkę (widok: onBladZapisu).
  func testNieudanyZapisZostawiaDaneDoPonowienia() {
    let k = KolejkaRysunkow()
    k.dodaj(wzorId: "w1", strona: 2, dane: a)
    let w1 = k.zapisz { _, _ in throw PelnyDysk() }
    XCTAssertEqual(w1.nieudane, [KluczRysunku(wzorId: "w1", strona: 2)])
    XCTAssertEqual(w1.zapisane, [])
    XCTAssertEqual(w1.oczekujace, 1)
    XCTAssertEqual(k.liczba, 1)
    var ponowione: [Data] = []
    let w2 = k.zapisz { _, d in ponowione.append(d); return "/tmp/p" }
    XCTAssertEqual(ponowione, [a])
    XCTAssertEqual(w2.zapisane.map(\.strona), [2])
    XCTAssertEqual(w2.oczekujace, 0)
  }

  // Dalsze rysowanie po porażce: kolejka trzyma najnowszy rysunek strony (całość), zapisuje go raz.
  func testNowszyRysunekStronyZastepujePoprzedni() {
    let k = KolejkaRysunkow()
    k.dodaj(wzorId: "w1", strona: 0, dane: a)
    _ = k.zapisz { _, _ in throw PelnyDysk() }
    k.dodaj(wzorId: "w1", strona: 0, dane: b)
    var zapisane: [Data] = []
    _ = k.zapisz { _, d in zapisane.append(d); return "/tmp/p" }
    XCTAssertEqual(zapisane, [b])
  }

  // 084 (ii): zmiana wzoru — dane starego wzoru zostają w kolejce pod jego identyfikatorem; częściowa porażka zapisuje to, co się da.
  func testZmianaWzoruNieCzysciKolejki() {
    let k = KolejkaRysunkow()
    k.dodaj(wzorId: "w1", strona: 0, dane: a)
    k.dodaj(wzorId: "w1", strona: 1, dane: b)
    let w = k.zapisz { klucz, _ in if klucz.strona == 1 { throw PelnyDysk() }; return "/tmp/w1-0" }
    XCTAssertEqual(w.zapisane.map(\.strona), [0])
    XCTAssertEqual(w.nieudane, [KluczRysunku(wzorId: "w1", strona: 1)])
    k.dodaj(wzorId: "w2", strona: 0, dane: a) // nowy wzór rysuje dalej
    XCTAssertEqual(k.dane(wzorId: "w1"), [1: b])
    XCTAssertEqual(k.dane(wzorId: "w2"), [0: a])
    var kolejnosc: [KluczRysunku] = []
    let w2 = k.zapisz { klucz, _ in kolejnosc.append(klucz); return "/tmp/p" }
    XCTAssertEqual(kolejnosc, [KluczRysunku(wzorId: "w1", strona: 1), KluczRysunku(wzorId: "w2", strona: 0)])
    XCTAssertEqual(w2.zapisane.map(\.wzorId), ["w1", "w2"])
    XCTAssertEqual(w2.oczekujace, 0)
  }

  // 084 (iii): zamknięcie ekranu przy pełnym dysku — każda kolejna próba zgłasza porażkę, dopóki dane czekają (JS ostrzega przed wyjściem).
  func testKazdaPorazkaZglaszanaDopokiDaneCzekaja() {
    let k = KolejkaRysunkow()
    k.dodaj(wzorId: "w1", strona: 0, dane: a)
    for _ in 0..<3 {
      let w = k.zapisz { _, _ in throw PelnyDysk() }
      XCTAssertEqual(w.nieudane.count, 1)
      XCTAssertEqual(w.oczekujace, 1)
    }
    XCTAssertEqual(k.dane(wzorId: "w1"), [0: a])
  }

  func testPustaKolejkaNicNieZapisuje() {
    let k = KolejkaRysunkow()
    var wywolania = 0
    let w = k.zapisz { _, _ in wywolania += 1; return "" }
    XCTAssertEqual(wywolania, 0)
    XCTAssertEqual(w, WynikZapisuRysunkow())
  }
}
