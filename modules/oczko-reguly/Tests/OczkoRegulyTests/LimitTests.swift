// X-RG-01–X-RG-03 (xctest-specyfikacja.md §3): wektory limitu z docs/monetyzacja/wektory-limitu.json, stałe z pliku, siła testu (mutant).
import OczkoReguly
import XCTest

final class LimitTests: XCTestCase {
  let plik = "docs/monetyzacja/wektory-limitu.json"

  func oczekiwanyStart(_ o: Json) -> WynikStartu? {
    guard let dozwolone = o["dozwolone"]?.logiczna, let zostalo = o["zostalo"]?.calkowita, let z = o["zapis"] else { return nil }
    let zapis = z.jestNull ? nil : DzienLimitu(data: z["data"]?.tekst ?? "?", pro: z["pro"]?.logiczna ?? false)
    return WynikStartu(dozwolone: dozwolone, zapis: zapis, zostalo: Int(zostalo))
  }
  func jestBlad(_ o: Json?) -> Bool { o?["blad"]?.tekst == "BLAD_DANYCH" }

  /// Liczba wektorów startDnia, dla których reguła z danym porównaniem przerwy daje wynik z pliku inny niż oczekiwany.
  func rozbiezne(_ przerwaKrotsza: @escaping (Int64, Int64) -> Bool) throws -> [String] {
    try (Repo.json(plik)["startDnia"]?.tablica ?? []).compactMap { w in
      guard let id = w["id"]?.tekst, let we = w["wejscie"], let o = w["oczekiwane"], !jestBlad(o) else { return nil }
      let r = try startDnia(WejscieDnia.z(we), przerwaKrotsza: przerwaKrotsza)
      return r == oczekiwanyStart(o) ? nil : id
    }
  }

  func testStartDnia() throws {
    let lista = try Repo.json(plik)["startDnia"]?.tablica ?? []
    let w = Wykonane("startDnia")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let o = try XCTUnwrap(v["oczekiwane"], id)
      if jestBlad(o) {
        XCTAssertThrowsError(try startDnia(WejscieDnia.z(XCTUnwrap(v["wejscie"]))), id) { XCTAssertTrue($0 is BladDanych, id) }
      } else {
        XCTAssertEqual(try startDnia(WejscieDnia.z(XCTUnwrap(v["wejscie"]))), oczekiwanyStart(o), id)
      }
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 17)
  }

  func testWolaStraznika() throws {
    let lista = try Repo.json(plik)["wolaStraznika"]?.tablica ?? []
    let w = Wykonane("wolaStraznika")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let rodzaj = try XCTUnwrap(v["wejscie"]?["rodzaj"]?.tekst, id)
      if jestBlad(v["oczekiwane"]) {
        XCTAssertThrowsError(try wolaStraznika(rodzaj: rodzaj), id)
      } else {
        XCTAssertEqual(try wolaStraznika(rodzaj: rodzaj), v["oczekiwane"]?.logiczna, id)
      }
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 10)
  }

  func testMozeZaczacDzien() throws {
    let lista = try Repo.json(plik)["mozeZaczacDzien"]?.tablica ?? []
    let w = Wykonane("mozeZaczacDzien")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let o = try XCTUnwrap(v["oczekiwane"], id)
      if jestBlad(o) {
        XCTAssertThrowsError(try mozeZaczacDzien(WejscieDnia.z(XCTUnwrap(v["wejscie"]))), id)
      } else {
        let oczekiwany = StanZawczasu(limitZawczasu: o["limitZawczasu"]?.logiczna ?? !true, ostatniDarmowy: o["ostatniDarmowy"]?.logiczna ?? !true,
                                      zostalo: Int(o["zostalo"]?.calkowita ?? -1))
        XCTAssertEqual(try mozeZaczacDzien(WejscieDnia.z(XCTUnwrap(v["wejscie"]))), oczekiwany, id)
      }
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 8)
  }

  /// X-RG-02: stałe Swift = stałe pliku wektorów (nie wpisane na sztywno) i = stale.json z generatora (ręczna zmiana Stale.swift = czerwone).
  func testStale() throws {
    let wektory = try Repo.json(plik)
    XCTAssertEqual(Int64(Stale.limitDniWMiesiacu), wektory["limit"]?.calkowita)
    XCTAssertEqual(Stale.przerwaNowegoDniaMs, wektory["przerwa_ms"]?.calkowita)
    let dostep = try Repo.json("docs/monetyzacja/wektory-dostepu.json")
    XCTAssertEqual(Stale.oknoOfflineProMs, dostep["laska_offline_ms"]?.calkowita)
    XCTAssertEqual(Stale.produktyPro, dostep["odblokowuja"]?.tablica?.compactMap(\.tekst))
    let stale = try Repo.json("modules/oczko-reguly/stale.json")
    XCTAssertEqual(Int64(Stale.limitDniWMiesiacu), stale["limitDniWMiesiacu"]?.calkowita)
    XCTAssertEqual(Stale.przerwaNowegoDniaMs, stale["przerwaNowegoDniaMs"]?.calkowita)
    XCTAssertEqual(Stale.oknoOfflineProMs, stale["oknoOfflineProMs"]?.calkowita)
    XCTAssertEqual(Stale.produktyPro, stale["produktyPro"]?.tablica?.compactMap(\.tekst))
    // Kolejka zegarka (ADR-0009, 2026-10-26; fix-4 05): ta sama liczba w stałych i w wektorach skrzynki (ZG-06).
    XCTAssertEqual(Stale.zegarekPonowienieMs, stale["zegarekPonowienieMs"]?.calkowita)
    XCTAssertEqual(Stale.zegarekPonowienieMs, try Repo.json("tests/wspolne/wzorce.json")["zegarek_skrzynka"]?["ponowienie_ms"]?.calkowita)
  }

  /// X-RG-03: mutant `<` → `<=` w porównaniu przerwy czerwieni wektor graniczny L-04c (60 min); poprawna reguła — żadnego.
  func testSilaMutantPrzerwy() throws {
    XCTAssertEqual(try rozbiezne(<), [])
    XCTAssertTrue(try rozbiezne(<=).contains("L-04c"), "mutant <= przeżył wektory")
  }
}
