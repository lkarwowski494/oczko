// M1-audytor-generalny-109 (źródło 08-programista-514, DEC-32 a): kolejność propsów `katalogRysunkow` i `dokument` nie może zgubić kresek z kolejki.
// Wyrocznia: test akceptacyjny 109 w planie napraw M1 — „kolejka z rysunkiem strony wzoru X, katalog dostępny; obie kolejności (katalog → dokument,
// dokument → katalog) dają w widoku rysunek z kolejki i jeden zapis pliku; mutant »opróżnienie przy ustawieniu katalogu bez wzorId« czerwony”.
import Foundation
import XCTest
@testable import OczkoWzorLogika

/// Model widoku: kolejność wywołań jak w `ios/WidokWzoru.swift` (`ustawKatalogRysunkow`, `ustawDokument`, `oproznijKolejke`) na prawdziwych
/// `PropsyWzoru` i `KolejkaRysunkow`. „JS” zapisuje plik oczekujący do bazy jako całą stronę (UPSERT, `src/przypadki-uzycia/wzor.ts`).
/// Rysunek strony to napis z kresek („A+B”), nowsza kreska dopisuje „+C”.
private final class ModelWidoku {
  var propsy = PropsyWzoru()
  let kolejka: KolejkaRysunkow
  var ekran: [Int: String] = [:]
  var baza: [String: [Int: String]]
  var zapisyPlikow = 0

  init(kolejka: KolejkaRysunkow, baza: [String: [Int: String]]) { self.kolejka = kolejka; self.baza = baza }

  func katalog(_ k: String) { if propsy.ustawKatalog(k) { oproznij() } }
  func dokument(_ id: String, rysunkiZJs: [Int: String]) {
    let (zKolejki, oproznijPo) = propsy.otworzWzor(id, kolejka: kolejka)
    ekran = rysunkiZJs
    for (s, d) in zKolejki { ekran[s] = String(decoding: d, as: UTF8.self) }
    if oproznijPo { oproznij() }
  }
  func kreska(strona s: Int, _ k: String) {
    let r = (ekran[s] ?? "") + k
    ekran[s] = r
    kolejka.dodaj(wzorId: propsy.wzorId, strona: s, dane: Data(r.utf8))
    oproznij()
  }
  func oproznij() {
    guard kolejka.liczba > 0, propsy.moznaOproznicKolejke else { return }
    _ = kolejka.zapisz(do: propsy.katalog) { _, klucz, d in
      zapisyPlikow += 1
      baza[klucz.wzorId, default: [:]][klucz.strona] = String(decoding: d, as: UTF8.self)
      return "/dane/tmp/rysunki-wzoru/\(klucz.wzorId)__\(klucz.strona)__x.pkdrawing"
    }
  }
}

final class PropsyWzoruTests: XCTestCase {
  private let katalog = "/dane/tmp/rysunki-wzoru"

  /// Stan po pełnym dysku i „Back”: w bazie strona 0 wzoru w1 ma „A”, kolejka (wspólna dla widoków) trzyma nowszy rysunek „A+B”.
  /// JS policzył `dokument.rysunki` z bazy przed zapisem pliku oczekującego, więc podaje starsze „A”.
  private func model() -> ModelWidoku {
    let k = KolejkaRysunkow()
    k.dodaj(wzorId: "w1", strona: 0, dane: Data("A+B".utf8))
    return ModelWidoku(kolejka: k, baza: ["w1": [0: "A"]])
  }

  private func sprawdzOdzysk(_ m: ModelWidoku, _ kolejnosc: String, file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertEqual(m.ekran[0], "A+B", "\(kolejnosc): widok pokazuje rysunek z kolejki", file: file, line: line)
    XCTAssertEqual(m.zapisyPlikow, 1, "\(kolejnosc): jeden zapis pliku", file: file, line: line)
    XCTAssertEqual(m.baza["w1"]?[0], "A+B", "\(kolejnosc): baza ma odzyskane kreski", file: file, line: line)
    XCTAssertEqual(m.kolejka.liczba, 0, file: file, line: line)
    m.kreska(strona: 0, "+C")
    XCTAssertEqual(m.baza["w1"]?[0], "A+B+C", "\(kolejnosc): następna kreska nie nadpisuje odzyskanych", file: file, line: line)
  }

  func testKatalogPrzedDokumentem() {
    let m = model()
    m.katalog(katalog)
    m.dokument("w1", rysunkiZJs: [0: "A"])
    sprawdzOdzysk(m, "katalog → dokument")
  }

  func testDokumentPrzedKatalogiem() {
    let m = model()
    m.dokument("w1", rysunkiZJs: [0: "A"])
    m.katalog(katalog)
    sprawdzOdzysk(m, "dokument → katalog")
  }

  /// Reguła wprost (mutant „opróżnienie przy ustawieniu katalogu bez wzorId”): sam katalog nie pozwala na zapis, sam wzór też nie.
  func testKolejkaCzekaNaObaPropsy() {
    var p = PropsyWzoru()
    XCTAssertFalse(p.ustawKatalog(katalog))
    XCTAssertFalse(p.moznaOproznicKolejke)
    let (zKolejki, oproznij) = p.otworzWzor("w1", kolejka: KolejkaRysunkow())
    XCTAssertEqual(zKolejki, [:])
    XCTAssertTrue(oproznij)
    XCTAssertTrue(p.ustawKatalog(katalog))
    XCTAssertFalse(p.ustawKatalog(""))

    var q = PropsyWzoru()
    XCTAssertFalse(q.otworzWzor("w1", kolejka: KolejkaRysunkow()).oproznij)
    XCTAssertFalse(q.otworzWzor("", kolejka: KolejkaRysunkow()).oproznij)
  }
}
