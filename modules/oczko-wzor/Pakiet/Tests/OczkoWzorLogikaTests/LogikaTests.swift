// Testy logiki czystej partii 6 (moduly.md „Kontrakt partii 6”). Wyrocznie: src/domena/rysik.ts (polityka), kontrakt (papier Letter dla US i CA,
// A4 dla pozostałych; ZrodloWzoru; koperta migawki P-243; manifest zlecenia zapisany na końcu, plik > WZOR_MAKS_MB bez kopii), src/platforma/skrzynka.ts
// (format manifestu: `sciezka` względna), src/konfiguracja.ts (stałe przez generuj-stale.mjs).
import Foundation
import XCTest
@testable import OczkoWzorLogika

final class PolitykaTests: XCTestCase {
  func testPolitykaNaPlotno() {
    XCTAssertEqual(ustawieniePlotna(.wylaczone), UstawieniePlotna(interakcja: false, tylkoRysik: false))
    XCTAssertEqual(ustawieniePlotna(.dowolne), UstawieniePlotna(interakcja: true, tylkoRysik: false))
    XCTAssertEqual(ustawieniePlotna(.tylkoRysik), UstawieniePlotna(interakcja: true, tylkoRysik: true))
    XCTAssertNil(PolitykaPlotna(rawValue: "inna"))
    XCTAssertEqual(NarzedzieWzoru(rawValue: "zakreslacz"), .zakreslacz)
  }
}

final class PapierTests: XCTestCase {
  func testLetterDlaUsICa() {
    for r in ["US", "CA", "us"] { XCTAssertEqual(papier(region: r), .letter, r) }
    for r in ["PL", "DE", "GB", "MX", nil] { XCTAssertEqual(papier(region: r), .a4, r ?? "nil") }
    XCTAssertEqual(Papier.letter.rozmiarPt.szerokosc, 612)
    XCTAssertEqual(Papier.a4.rozmiarPt.wysokosc, 841.89, accuracy: 0.01)
  }
}

final class ZrodloTests: XCTestCase {
  func testParsowanie() throws {
    XCTAssertEqual(try zrodloKonwersji(#"{"rodzaj":"adres","adres":"https://example.org/a"}"#), .adres(URL(string: "https://example.org/a")!))
    XCTAssertEqual(try zrodloKonwersji(#"{"rodzaj":"word","sciezka":"/tmp/a.docx"}"#), .word(URL(fileURLWithPath: "/tmp/a.docx")))
    XCTAssertEqual(try zrodloKonwersji(#"{"rodzaj":"obrazy","sciezki":["/tmp/a.jpg","/tmp/b.jpg"]}"#),
                   .obrazy([URL(fileURLWithPath: "/tmp/a.jpg"), URL(fileURLWithPath: "/tmp/b.jpg")]))
  }
  func testBledneDane() {
    for j in [#"{"rodzaj":"adres","adres":"file:///etc/passwd"}"#, #"{"rodzaj":"adres","adres":"javascript:alert(1)"}"#,
              #"{"rodzaj":"obrazy","sciezki":[]}"#, #"{"rodzaj":"inne"}"#, "nie json"] {
      XCTAssertThrowsError(try zrodloKonwersji(j), j)
    }
  }
  func testWynikJson() throws {
    let ok = try JSONSerialization.jsonObject(with: Data(wynikOk(["sciezka": "/tmp/a.pdf", "strony": 2]).utf8)) as? [String: Any]
    XCTAssertEqual(ok?["ok"] as? Bool, true)
    XCTAssertEqual(ok?["strony"] as? Int, 2)
    let b = try JSONSerialization.jsonObject(with: Data(wynikBlad(.brakSieci).utf8)) as? [String: Any]
    XCTAssertEqual(b?["ok"] as? Bool, false)
    XCTAssertEqual(b?["powod"] as? String, "brak_sieci")
    XCTAssertEqual(Set(PowodWzoru.allCases.map(\.rawValue)), ["brak_sieci", "odmowa", "pusty", "anulowano", "uszkodzony", "za_duze", "bledne_dane", "zapis"])
  }
  func testKodHttp() {
    XCTAssertEqual(powodHttp(401), .odmowa)
    XCTAssertEqual(powodHttp(403), .odmowa)
    XCTAssertEqual(powodHttp(404), .pusty)
    XCTAssertEqual(powodHttp(500), .pusty)
    XCTAssertNil(powodHttp(200))
    XCTAssertNil(powodHttp(nil))
  }
}

final class MigawkaTests: XCTestCase {
  func testKoperta() {
    let j = #"{"format":"oczko-migawka","wersja":1,"utworzono":1,"projekty":[{"id":"p1","nazwa":"Harbor","nienazwany":false,"utworzonoMs":1,"ostatniaPracaMs":2,"wzory":1,"film":true},{"id":"p2","nazwa":"2026-10-20","nienazwany":true,"utworzonoMs":3,"ostatniaPracaMs":null,"wzory":0,"film":false}]}"#
    let p = odczytajMigawke(Data(j.utf8))
    XCTAssertEqual(p?.map(\.id), ["p1", "p2"])
    XCTAssertNil(p?.last?.ostatniaPracaMs ?? nil)
    XCTAssertEqual(p?.first?.wzory, 1)
    XCTAssertEqual(p?.map(\.film), [true, false]) // P-276: projekt ma już link do filmu → linia udostepnij.film_zastapi
  }
  func testStanZastepczy() {
    XCTAssertNil(odczytajMigawke(nil))
    XCTAssertNil(odczytajMigawke(Data("{".utf8)))
    XCTAssertNil(odczytajMigawke(Data(#"{"format":"oczko-migawka","wersja":2,"utworzono":1,"projekty":[]}"#.utf8)))
    XCTAssertNil(odczytajMigawke(Data(#"{"format":"inny","wersja":1,"utworzono":1,"projekty":[]}"#.utf8)))
  }
  func testDniOdPracy() {
    let strefa = TimeZone(identifier: "Europe/Warsaw")!
    let teraz: Int64 = 1_793_000_000_000
    XCTAssertEqual(dniOdPracy(ostatniaMs: teraz - 60_000, terazMs: teraz, strefa: strefa), 0)
    XCTAssertEqual(dniOdPracy(ostatniaMs: teraz - 86_400_000, terazMs: teraz, strefa: strefa), 1)
    XCTAssertEqual(dniOdPracy(ostatniaMs: teraz - 41 * 86_400_000, terazMs: teraz, strefa: strefa), 41)
    XCTAssertNil(dniOdPracy(ostatniaMs: nil, terazMs: teraz, strefa: strefa))
  }
}

final class StaleTests: XCTestCase {
  /// Stałe z src/konfiguracja.ts (generuj-stale.mjs → stale.json obok pakietu); ten sam plik czyta `--check` w jakosc:kontrole.
  func testStaleZgodneZJson() throws {
    let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("../../stale.json").standardizedFileURL
    let j = try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any]
    XCTAssertEqual(j?["wzorMaksMb"] as? Int, StaleWzoru.wzorMaksMb)
    XCTAssertEqual(j?["rysunekZapisMs"] as? Int, StaleWzoru.rysunekZapisMs)
    XCTAssertEqual(j?["migawkaWersja"] as? Int, StaleWzoru.migawkaWersja)
  }
}

final class ZlecenieTests: XCTestCase {
  var grupa: URL!
  override func setUpWithError() throws {
    grupa = FileManager.default.temporaryDirectory.appendingPathComponent("oczko-grupa-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: grupa, withIntermediateDirectories: true)
  }
  override func tearDownWithError() throws { try? FileManager.default.removeItem(at: grupa) }

  func testRodzajZUti() {
    XCTAssertEqual(rodzajZalacznika(["com.adobe.pdf"]), .pdf)
    XCTAssertEqual(rodzajZalacznika(["public.jpeg", "public.image"]), .obraz)
    XCTAssertEqual(rodzajZalacznika(["org.openxmlformats.wordprocessingml.document"]), .word)
    XCTAssertNil(rodzajZalacznika(["com.microsoft.word.doc"])) // 07-jakosc-017 (K-17h, ADR-0031 pkt 5): Word tylko .docx
    XCTAssertEqual(rodzajZalacznika(["public.url"]), .adres)
    XCTAssertEqual(rodzajZalacznika(["public.file-url", "com.adobe.pdf"]), .pdf) // plik z Plików: PDF ma pierwszeństwo przed URL
    XCTAssertNil(rodzajZalacznika(["public.zip-archive"]))
  }

  func testPlikKopiowanyManifestNaKoncu() throws {
    let zrodlo = grupa.appendingPathComponent("Harbor.pdf")
    try Data("%PDF-1.4\n%%EOF\n".utf8).write(to: zrodlo)
    let z = try zapiszZlecenie(grupa: grupa, wejscie: .pliki([zrodlo], typ: "com.adobe.pdf"), projektId: "p1", terazMs: 5, id: "z1")
    XCTAssertEqual(z.sciezki, ["Harbor.pdf"])
    let k = grupa.appendingPathComponent("skrzynka/z1")
    XCTAssertTrue(FileManager.default.fileExists(atPath: k.appendingPathComponent("Harbor.pdf").path))
    let m = try JSONSerialization.jsonObject(with: Data(contentsOf: k.appendingPathComponent("zlecenie.json"))) as? [String: Any]
    XCTAssertEqual(m?["id"] as? String, "z1")
    XCTAssertEqual(m?["rodzaj"] as? String, "plik")
    XCTAssertEqual(m?["nazwa"] as? String, "Harbor.pdf")
    XCTAssertEqual(m?["sciezki"] as? [String], ["Harbor.pdf"])
    XCTAssertEqual(m?["projektId"] as? String, "p1")
    XCTAssertEqual(m?["utworzonoMs"] as? Int, 5)
    XCTAssertTrue(m?["adres"] is NSNull) // null zapisany jawnie
    XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: k.path).sorted(), ["Harbor.pdf", "zlecenie.json"]) // bez pliku tymczasowego
  }

  func testKilkaZdjecJednoZlecenie() throws { // P-248 D1a: jedno udostępnienie kilku zdjęć = jedno zlecenie = jeden wzór
    let a = grupa.appendingPathComponent("a/IMG.jpeg"), b = grupa.appendingPathComponent("b/IMG.jpeg")
    for u in [a, b] { try FileManager.default.createDirectory(at: u.deletingLastPathComponent(), withIntermediateDirectories: true); try Data("j".utf8).write(to: u) }
    let z = try zapiszZlecenie(grupa: grupa, wejscie: .pliki([a, b], typ: "public.jpeg"), projektId: nil, terazMs: 1, id: "z5")
    XCTAssertEqual(z.sciezki, ["IMG.jpeg", "2-IMG.jpeg"]) // ta sama nazwa dwóch zdjęć: druga z numerem, bez nadpisania
    XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: grupa.appendingPathComponent("skrzynka/z5").path).sorted(), ["2-IMG.jpeg", "IMG.jpeg", "zlecenie.json"])
  }
  func testJezykMigawki() { // P-248 D2a: arkusz mówi językiem aplikacji
    XCTAssertEqual(jezykMigawki(Data(#"{"format":"oczko-migawka","wersja":1,"utworzono":1,"jezyk":"pl","projekty":[]}"#.utf8)), "pl")
    XCTAssertNil(jezykMigawki(Data(#"{"format":"oczko-migawka","wersja":1,"utworzono":1,"projekty":[]}"#.utf8)))
    XCTAssertNil(jezykMigawki(nil))
  }
  func testAdresBezPlikuIProjektuNull() throws {
    let z = try zapiszZlecenie(grupa: grupa, wejscie: .adres(URL(string: "https://example.org/czapka")!, film: false), projektId: nil, terazMs: 1, id: "z2")
    XCTAssertEqual(z.sciezki, [])
    XCTAssertEqual(z.typ, "public.url")
    let m = try JSONSerialization.jsonObject(with: Data(contentsOf: grupa.appendingPathComponent("skrzynka/z2/zlecenie.json"))) as? [String: Any]
    XCTAssertTrue(m?["projektId"] is NSNull)
    XCTAssertEqual(m?["adres"] as? String, "https://example.org/czapka")
    XCTAssertEqual(m?["rodzaj"] as? String, "adres")
    let f = try zapiszZlecenie(grupa: grupa, wejscie: .adres(URL(string: "https://example.org/v")!, film: true), projektId: nil, terazMs: 1, id: "z3")
    XCTAssertEqual(f.rodzaj, "film") // P-246 S4a: „Video link” = rodzaj film (film projektu, nie wzór)
    XCTAssertEqual(f.typ, "public.url")
  }

  func testZaDuzyBezKopii() throws {
    let zrodlo = grupa.appendingPathComponent("duzy.pdf")
    FileManager.default.createFile(atPath: zrodlo.path, contents: nil)
    let h = try FileHandle(forWritingTo: zrodlo)
    try h.truncate(atOffset: UInt64(StaleWzoru.wzorMaksMb) * 1024 * 1024 + 1) // plik rzadki
    try h.close()
    XCTAssertThrowsError(try zapiszZlecenie(grupa: grupa, wejscie: .pliki([zrodlo], typ: "com.adobe.pdf"), projektId: nil, terazMs: 1, id: "z4")) { e in
      XCTAssertEqual(e as? BladZlecenia, .zaDuzy)
    }
    XCTAssertFalse(FileManager.default.fileExists(atPath: grupa.appendingPathComponent("skrzynka/z4").path))
  }

  func testNazwaPlikuBezUkosnikow() {
    XCTAssertEqual(bezpiecznaNazwa("../../a/b.pdf"), "b.pdf")
    XCTAssertEqual(bezpiecznaNazwa(""), "plik")
    XCTAssertEqual(bezpiecznaNazwa(".."), "plik")
    XCTAssertEqual(bezpiecznaNazwa("zlecenie.json"), "plik-zlecenie.json") // nie zasłania manifestu
  }
}

/// P-276 (04 fix-8, makieta film.html): teksty listy projektów arkusza „Add to Oczko” zależnie od „Pattern / Video link” i flagi `film`.
final class PodpisListyTests: XCTestCase {
  private func projekt(wzory: Int, film: Bool) -> ProjektMigawki {
    let j = #"{"format":"oczko-migawka","wersja":1,"utworzono":1,"projekty":[{"id":"p1","nazwa":"Harbor","nienazwany":false,"utworzonoMs":1,"ostatniaPracaMs":2,"wzory":\#(wzory),"film":\#(film)}]}"#
    return odczytajMigawke(Data(j.utf8))!.first!
  }
  func testNaglowek() {
    XCTAssertEqual(kluczNaglowkaListy(jakoFilm: false), "udostepnij.do_projektu")
    XCTAssertEqual(kluczNaglowkaListy(jakoFilm: true), "udostepnij.do_projektu_film")
  }
  func testPodpisWzoru() {
    XCTAssertEqual(kluczPodpisuListy(wybrany: nil, jakoFilm: false), "udostepnij.gotowe_nowy")
    XCTAssertEqual(kluczPodpisuListy(wybrany: projekt(wzory: 0, film: true), jakoFilm: false), "udostepnij.gotowe")
    XCTAssertEqual(kluczPodpisuListy(wybrany: projekt(wzory: 2, film: false), jakoFilm: false), "udostepnij.kolejny")
  }
  func testPodpisFilmu() { // jeden film na projekt (P-218 (4)): zastąpienie jawne; liczba wzorów nie ma znaczenia
    XCTAssertEqual(kluczPodpisuListy(wybrany: projekt(wzory: 2, film: true), jakoFilm: true), "udostepnij.film_zastapi")
    XCTAssertEqual(kluczPodpisuListy(wybrany: projekt(wzory: 2, film: false), jakoFilm: true), "udostepnij.gotowe")
    XCTAssertEqual(kluczPodpisuListy(wybrany: nil, jakoFilm: true), "udostepnij.gotowe_nowy")
  }
}
