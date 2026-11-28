// FB1 08-B (TQ1 → kod; przeniesione z szkicu 07 tests/akceptacja/swift/IntencjaKrokMinusTests.swift.szkic, P-1114).
// Zakres: ZM-22 (U4, ADR-0035 § U4: IN-04…IN-09 — −1 tą samą drogą co z zegarka, limit nie dotyczy −1, −1 przy 0 bez linii, blokada blokuje,
// −1 NIE zmienia `dzien` ani `dzienDozwolony`) i ZM-24 (U6, ADR-0036 kontrakt Swift pkt 1–2, 5: IN-01…IN-03, IN-10, IN-11 — „+2” = k linii z łańcuchem
// rodziców i tym samym czasem, limit raz, wszystko albo nic; PS-01…PS-07 — haptyka zegarka przy skoku) oraz KO-234 (ADR-0037 reguła 4: SD-01…SD-04, `staleDate`).
// Wyrocznia: docs/architektura/wektory-1-0-2.json („intencja”, „przypomnienie_skoku”, „data_nieaktualnosci”) — wartości z reguł ADR, nie z kodu.
// Wektor podaje czas względny (`teraz` = 5000 ms od początku dnia `opcje.dzis` w Europe/Warsaw); `limitOdmawia` = pięć darmowych dni miesiąca w stanie
// i brak niedawnego +1 (reguła limitu odmawia nowego dnia). Asercje wektorów bez zmian względem szkicu 07.
import Foundation
import OczkoDziennik
import OczkoReguly
import XCTest

final class IntencjaKrokMinusTests: XCTestCase {
  let plik = "docs/architektura/wektory-1-0-2.json"
  let strefa = "Europe/Warsaw"

  /// Początek dnia `dzien` (RRRR-MM-DD) w Europe/Warsaw w ms UTC.
  func poczatekDnia(_ dzien: String) throws -> Int64 {
    let c = dzien.split(separator: "-").compactMap { Int($0) }
    var kal = Calendar(identifier: .gregorian)
    kal.timeZone = try XCTUnwrap(TimeZone(identifier: strefa))
    let d = try XCTUnwrap(kal.date(from: DateComponents(year: c[0], month: c[1], day: c[2])))
    return Int64(d.timeIntervalSince1970 * 1000)
  }

  /// Stan z wektora: złoty plik v3 (typowy) z polami nadpisanymi wartościami wektora; `krok` z wektora (spoza 1…2 tylko przez init: dekoder go odrzuca).
  func stan(_ w: Json, baza: Int64) throws -> StanEkranuBlokady {
    let zloty = try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-ekranu-blokady-typowy.json"))
    let s = try XCTUnwrap(w["stan"], "stan")
    let limit = w["opcje"]?["limitOdmawia"]?.logiczna ?? false
    let ostatni: Int64? = limit ? nil : (s["ostatniPlusMs"]?.calkowita).map { baza + $0 }
    let dni = limit ? (1...5).map { DzienStanu(dzien: "2026-11-0\($0)", pro: false) } : zloty.dniWMiesiacu
    return StanEkranuBlokady(
      wersja: zloty.wersja, licznikId: zloty.licznikId, nazwa: zloty.nazwa, wartosc: Int(try XCTUnwrap(s["wartosc"]?.calkowita)), znaczenie: zloty.znaczenie,
      glowa: s["glowa"]?.tekst, ostatniPlusMs: ostatni, dzien: try XCTUnwrap(s["dzien"]?.tekst), dzienDozwolony: try XCTUnwrap(s["dzienDozwolony"]?.logiczna),
      sesjaStartMs: zloty.sesjaStartMs, pro: false, proWaznoscDo: nil, dniWMiesiacu: dni, przypomnienia: zloty.przypomnienia,
      zablokowany: try XCTUnwrap(s["zablokowany"]?.logiczna), krok: Int(try XCTUnwrap(w["krok"]?.calkowita)))
  }

  /// IN-01…IN-11: wynik, rodzice linii (łańcuch), stan po (wartosc, glowa, ostatniPlusMs, dzien, dzienDozwolony).
  func testWektoryIntencji() throws {
    let wektory = try Repo.json(plik)["intencja"]?.tablica ?? []
    let wykonane = Wykonane("intencja 1.0.2")
    for w in wektory {
      let id = w["id"]?.tekst ?? "?"
      wykonane.dodaj(id)
      let opcje = try XCTUnwrap(w["opcje"], id)
      let baza = try poczatekDnia(try XCTUnwrap(opcje["dzis"]?.tekst, id))
      let teraz = baza + (try XCTUnwrap(opcje["teraz"]?.calkowita, id))
      let ids = (opcje["ids"]?.tablica ?? []).compactMap(\.tekst)
      let rodzaj: ZdarzenieWejsciowe.Rodzaj = w["rodzaj"]?.tekst == "minus" ? .minus : .plus
      let s = try stan(w, baza: baza)
      let oczekiwane = try XCTUnwrap(w["oczekiwane"], id)
      let wynik = oczekiwane["wynik"]?.tekst
      if wynik == "bledne_dane" {
        XCTAssertThrowsError(try stuknij(rodzaj, stan: s, teraz: teraz, strefa: strefa, ids: ids, urzadzenie: "u"), id)
        continue
      }
      let r = try stuknij(rodzaj, stan: s, teraz: teraz, strefa: strefa, ids: ids, urzadzenie: "u")
      let rodzice = (oczekiwane["rodziceLinii"]?.tablica ?? []).map { ($0.tablica ?? []).compactMap(\.tekst) }
      switch (wynik, r) {
      case let ("zapisz", .zapisz(linie, po)):
        XCTAssertEqual(linie.map(\.rodzice), rodzice, id)
        XCTAssertEqual(linie.map(\.id), Array(ids.prefix(rodzice.count)), id)
        XCTAssertEqual(Set(linie.map(\.czasMs)), [teraz], "\(id): jeden czas stuknięcia")
        let o = try XCTUnwrap(oczekiwane["stan"], id)
        if let v = o["wartosc"]?.calkowita { XCTAssertEqual(po.wartosc, Int(v), id) }
        if let v = o["glowa"]?.tekst { XCTAssertEqual(po.glowa, v, id) }
        if let v = o["ostatniPlusMs"]?.calkowita { XCTAssertEqual(po.ostatniPlusMs, baza + v, id) }
        if let v = o["dzienDozwolony"]?.logiczna { XCTAssertEqual(po.dzienDozwolony, v, id) }
        if let v = o["dzien"]?.tekst { XCTAssertEqual(po.dzien, v, id) }
      case ("limit", .limit), ("bezZmiany", .bezZmiany), ("zablokowany", .zablokowany):
        XCTAssertEqual(rodzice, [], id)
      default:
        XCTFail("\(id): oczekiwano \(wynik ?? "?"), jest \(r)")
      }
    }
    wykonane.sprawdz(oczekiwane: idWektorow(wektory), minimum: 11)
  }

  /// PS-01…PS-07: rząd przypomnienia przeskoczony stuknięciem (przed → po skończonych) albo nil; wzorzec haptyki zegarka idzie za tą regułą.
  func testPrzypomnienieSkoku() throws {
    let wektory = try Repo.json(plik)["przypomnienie_skoku"]?.tablica ?? []
    let wykonane = Wykonane("przypomnienie_skoku")
    for w in wektory {
      let id = w["id"]?.tekst ?? "?"
      wykonane.dodaj(id)
      let p = try XCTUnwrap(w["plan"], id)
      let plan = PrzypomnienieStanu(od: Int(try XCTUnwrap(p["od"]?.calkowita)), co: Int(try XCTUnwrap(p["co"]?.calkowita)), razy: Int(try XCTUnwrap(p["razy"]?.calkowita)), tekst: "t")
      let przed = Int(try XCTUnwrap(w["przed"]?.calkowita, id)), po = Int(try XCTUnwrap(w["po"]?.calkowita, id))
      let oczekiwane = w["oczekiwane"]?["rzad"]?.calkowita.map { Int($0) }
      XCTAssertEqual(przypomnienieSkoku(przed: przed, po: po, plan: plan), oczekiwane, id)
    }
    wykonane.sprawdz(oczekiwane: idWektorow(wektory), minimum: 7)
  }

  /// SD-01…SD-04 (ADR-0037 reguła 4): `staleDate` = ostatnia zmiana + min(próg przypominacza, koniec); brak zmian → nil.
  func testDataNieaktualnosci() throws {
    let wektory = try Repo.json(plik)["data_nieaktualnosci"]?.tablica ?? []
    let wykonane = Wykonane("data_nieaktualnosci")
    for w in wektory {
      let id = w["id"]?.tekst ?? "?"
      wykonane.dodaj(id)
      let e = try XCTUnwrap(w["wejscie"], id)
      let wynik = dataNieaktualnosci(ostatniaZmianaMs: e["ostatniaZmianaMs"]?.calkowita, przypominaczMs: e["przypominaczMs"]?.calkowita,
                                     koniecPoMs: try XCTUnwrap(e["koniecPoMs"]?.calkowita, id))
      XCTAssertEqual(wynik, w["oczekiwane"]?.calkowita, id)
    }
    wykonane.sprawdz(oczekiwane: idWektorow(wektory), minimum: 4)
  }
}
