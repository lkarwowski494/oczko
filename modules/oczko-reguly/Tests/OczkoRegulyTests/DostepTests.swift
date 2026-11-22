// X-RG-05, X-ST-05/06 (Pro na zegarku, KP-17): wektory decyzja, odczytajPamiec, proZegarka z docs/monetyzacja/wektory-dostepu.json.
import OczkoReguly
import XCTest

final class DostepTests: XCTestCase {
  let plik = "docs/monetyzacja/wektory-dostepu.json"

  func pamiec(_ j: Json?) -> Pamiec? {
    guard let j, !j.jestNull, let p = j["produkty"]?.tablica else { return nil }
    return Pamiec(produkty: p.compactMap(\.tekst), wygasa: j["wygasa"]?.calkowita)
  }

  func testDecyzja() throws {
    let d = try Repo.json(plik)
    let teraz = try XCTUnwrap(d["teraz"]?.calkowita)
    let odblokowuja = (d["odblokowuja"]?.tablica ?? []).compactMap(\.tekst)
    let lista = d["decyzja"]?.tablica ?? []
    let w = Wykonane("decyzja")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let o = try XCTUnwrap(v["odczyt"], id)
      let odczyt: Odczyt = o["zrodlo"]?.tekst == "sklep" ? .sklep(try (o["uprawnienia"]?.tablica ?? []).map(Uprawnienie.z)) : .blad
      let t = v["teraz"]?.calkowita ?? teraz
      let r = decyzja(odczyt, pamiec(v["pamiec"]), teraz: t, odblokowuja: odblokowuja)
      let ocz = try XCTUnwrap(v["oczekiwane"], id)
      XCTAssertEqual(r.dostep, ocz["dostep"]?.logiczna, id)
      XCTAssertEqual(r.powod.rawValue, ocz["powod"]?.tekst, id)
      XCTAssertEqual(r.pamiec, pamiec(ocz["pamiec"]), id)
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 18)
  }

  func testOdczytajPamiec() throws {
    let lista = try Repo.json(plik)["odczytajPamiec"]?.tablica ?? []
    let w = Wykonane("odczytajPamiec")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      XCTAssertEqual(odczytajPamiec(v["wejscie"]?.tekst), pamiec(v["oczekiwane"]), id)
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 6)
  }

  func testProZegarka() throws {
    let d = try Repo.json(plik)
    let teraz = try XCTUnwrap(d["teraz"]?.calkowita)
    let lista = d["proZegarka"]?.tablica ?? []
    let w = Wykonane("proZegarka")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let zrodla = v["zrodla"]?.tablica ?? []
      if v["oczekiwane"]?["blad"]?.tekst == "BLAD_DANYCH" {
        XCTAssertThrowsError(try zrodla.map(ZrodloPro.z), id)
      } else {
        XCTAssertEqual(proZegarka(try zrodla.map(ZrodloPro.z), teraz: v["teraz"]?.calkowita ?? teraz), v["oczekiwane"]?.logiczna, id)
      }
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 11)
  }
}
