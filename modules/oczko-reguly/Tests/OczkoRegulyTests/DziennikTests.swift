// X-DZ-01–06, X-DZ-11–13 (xctest-specyfikacja.md §1; ADR-0008 (8A/8S/8R)): złote pliki tests/wspolne/dziennik-plus-*.jsonl i wektory
// `dopisanie`, `sklejenie`, `skrocenie` z tests/wspolne/wzorce.json — te same, które czyta Jest (tests/dane/dziennik-sklejenie.test.ts).
// X-DZ-07–10 (intencja, stan Live Activity, łańcuch rodziców, migawka nazw) — w celu widget (3C) i E2E partii 4 (P-129 Q2a).
import Foundation
import OczkoDziennik
import OczkoReguly
import XCTest

final class DziennikTests: XCTestCase {
  var katalog: URL!
  override func setUpWithError() throws {
    katalog = FileManager.default.temporaryDirectory.appendingPathComponent("oczko-dziennik-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: katalog, withIntermediateDirectories: true)
  }
  override func tearDownWithError() throws { try? FileManager.default.removeItem(at: katalog) }

  func plik(_ nazwa: String = "dziennik-plus.jsonl", tresc: String? = nil) -> String {
    let p = katalog.appendingPathComponent(nazwa).path
    if let tresc { FileManager.default.createFile(atPath: p, contents: Data(tresc.utf8)) }
    return p
  }
  func tresc(_ p: String) -> String { String(decoding: FileManager.default.contents(atPath: p) ?? Data(), as: UTF8.self) }
  var wzorce: Json { get throws { try Repo.json("tests/wspolne/wzorce.json") } }

  /// X-DZ-01, X-DZ-11: odczyt złotych plików = przyjęte id, odrzucone linie i ucięta ostatnia z manifestu.
  func testZloteplikiOdczyt() throws {
    let lista = try wzorce["dziennik"]?.tablica ?? []
    let w = Wykonane("dziennik (złote pliki)")
    for v in lista {
      let nazwa = try XCTUnwrap(v["plik"]?.tekst)
      w.dodaj(nazwa)
      let t = try Repo.tekst("tests/wspolne/\(nazwa)")
      let r = parsujDziennik(t)
      XCTAssertEqual(r.zdarzenia.map(\.id), v["przyjete_id"]?.tablica?.compactMap(\.tekst), nazwa)
      XCTAssertEqual(r.uszkodzone.map { Int64($0.linia) }, v["odrzucone_linie"]?.tablica?.compactMap(\.calkowita), nazwa)
      XCTAssertEqual(!t.isEmpty && !t.hasSuffix("\n"), v["ostatnia_ucieta"]?.logiczna, nazwa)
    }
    w.sprawdz(oczekiwane: lista.compactMap { $0["plik"]?.tekst }, minimum: 3)
  }

  /// X-DZ-02: zdekodowane i zakodowane ponownie zdarzenia dają te same bajty linii (także `pro: true` w linii 3, P-127).
  func testKoderTeSameBajty() throws {
    let linie = try Repo.tekst("tests/wspolne/dziennik-plus-poprawny.jsonl").split(separator: "\n")
    XCTAssertGreaterThanOrEqual(linie.count, 4)
    for l in linie { XCTAssertEqual(try XCTUnwrap(ZdarzenieWejsciowe.zLinii(l)).linia, String(l)) }
    XCTAssertTrue(linie.contains { $0.contains("\"pro\":true") }, "złoty plik bez pro: true (F07-12)")
  }

  /// X-DZ-03: zdarzenia dopisane przez DziennikPlus do pustego pliku = bajty złotego pliku (TS czyta to, co Swift pisze).
  func testZapisZIntencjiTeSameBajtyCoPlik() throws {
    let wzor = try Repo.tekst("tests/wspolne/dziennik-plus-poprawny.jsonl")
    let p = plik()
    let d = DziennikPlus(sciezka: p)
    for l in wzor.split(separator: "\n") { try d.dopisz(XCTUnwrap(ZdarzenieWejsciowe.zLinii(l))) }
    XCTAssertEqual(tresc(p), wzor)
  }

  /// X-DZ-04: 1000 równoległych dopisań z dwóch wątków → 1000 poprawnych linii, 1000 różnych id.
  func testRownolegleDopisania() throws {
    let p = plik()
    let d = DziennikPlus(sciezka: p)
    let wzor = try XCTUnwrap(ZdarzenieWejsciowe.zLinii(Repo.tekst("tests/wspolne/dziennik-plus-poprawny.jsonl").split(separator: "\n")[0]))
    let bledy = NSLock()
    var nieudane = 0
    DispatchQueue.concurrentPerform(iterations: 1000) { i in
      let z = ZdarzenieWejsciowe(id: "id-\(i)", licznikId: wzor.licznikId, rodzaj: .plus, rodzice: [], czasMs: wzor.czasMs + Int64(i), strefa: wzor.strefa,
                                 dzien: wzor.dzien, zrodlo: .ekran_blokady, urzadzenie: wzor.urzadzenie, pro: i % 2 == 0)
      do { try d.dopisz(z) } catch { bledy.lock(); nieudane += 1; bledy.unlock() }
    }
    XCTAssertEqual(nieudane, 0)
    let r = try d.odczytaj()
    XCTAssertEqual(r.zdarzenia.count, 1000)
    XCTAssertEqual(Set(r.zdarzenia.map(\.id)).count, 1000)
    XCTAssertEqual(r.uszkodzone, [])
  }

  /// X-DZ-05 (8A): plik `przed` + dopisanie `linia` = dokładnie bajty `po`.
  func testDopisanieWektory() throws {
    let lista = try wzorce["dopisanie"]?.tablica ?? []
    let w = Wykonane("dopisanie")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let p = plik("\(id).jsonl", tresc: try XCTUnwrap(v["przed"]?.tekst, id))
      try DziennikPlus(sciezka: p).dopisz(XCTUnwrap(ZdarzenieWejsciowe.zLinii(Substring(XCTUnwrap(v["linia"]?.tekst))), id))
      XCTAssertEqual(tresc(p), v["po"]?.tekst, id)
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 3)
  }

  /// X-DZ-12 (8R): wektory `sklejenie` — przyjęte id, zgłoszone linie.
  func testSklejenieWektory() throws {
    let lista = try wzorce["sklejenie"]?.tablica ?? []
    let w = Wykonane("sklejenie")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let r = parsujDziennik(try XCTUnwrap(v["tekst"]?.tekst, id))
      XCTAssertEqual(r.zdarzenia.map(\.id), v["przyjete_id"]?.tablica?.compactMap(\.tekst), id)
      XCTAssertEqual(r.uszkodzone.map { Int64($0.linia) }, v["odrzucone_linie"]?.tablica?.compactMap(\.calkowita), id)
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 3)
  }

  /// X-DZ-12 (8S): wektory `skrocenie` — bajty pliku po skroc(do_id), `do_id` także w linii sklejonej.
  func testSkrocenieWektory() throws {
    let lista = try wzorce["skrocenie"]?.tablica ?? []
    let w = Wykonane("skrocenie")
    for v in lista {
      let id = v["id"]?.tekst ?? "?"
      w.dodaj(id)
      let p = plik("\(id).jsonl", tresc: try XCTUnwrap(v["tekst"]?.tekst, id))
      try DziennikPlus(sciezka: p).skroc(doId: XCTUnwrap(v["do_id"]?.tekst, id))
      XCTAssertEqual(tresc(p), v["po"]?.tekst, id)
    }
    w.sprawdz(oczekiwane: idWektorow(lista), minimum: 4)
  }

  /// X-DZ-06 (R-022): linia dopisana między odczytaj() a skroc() zostaje; skrócenie do nieznanego id niczego nie zmienia (R-024).
  func testSkrocenieZostawiaPozniejsze() throws {
    let wzor = try Repo.tekst("tests/wspolne/dziennik-plus-poprawny.jsonl").split(separator: "\n").map { try XCTUnwrap(ZdarzenieWejsciowe.zLinii($0)) }
    let p = plik()
    let d = DziennikPlus(sciezka: p)
    try d.dopisz(wzor[0]); try d.dopisz(wzor[1])
    let doId = try XCTUnwrap(d.odczytaj().zdarzenia.last?.id)
    try d.dopisz(wzor[2])
    try d.skroc(doId: doId)
    XCTAssertEqual(try d.odczytaj().zdarzenia.map(\.id), [wzor[2].id])
    try d.skroc(doId: "nie-ma-takiego")
    XCTAssertEqual(tresc(p), wzor[2].linia + "\n")
  }

  /// M1-audytor-generalny-024 (05-architekt-002/505, ARCH-22): nieudany zapis pliku tymczasowego przy `skroc` (krótki zapis, błąd fsync)
  /// → błąd, a plik dziennika bajt w bajt bez zmian (linie zostają do następnego scalenia).
  func testSkrocenieNieudanyZapisZostawiaPlik() throws {
    let wzor = try Repo.tekst("tests/wspolne/dziennik-plus-poprawny.jsonl").split(separator: "\n").map { try XCTUnwrap(ZdarzenieWejsciowe.zLinii($0)) }
    for awaria in [Atrapa.Awaria.krotki, .fsync] {
      let p = plik("skroc-\(awaria).jsonl")
      try DziennikPlus(sciezka: p).dopisz(wzor[0])
      try DziennikPlus(sciezka: p).dopisz(wzor[1])
      let przed = tresc(p)
      let d = DziennikPlus(sciezka: p) { try Atrapa(sciezka: $0, awaria: awaria) }
      XCTAssertThrowsError(try d.skroc(doId: wzor[0].id), "\(awaria)")
      XCTAssertEqual(tresc(p), przed, "\(awaria): skrócenie podmieniło dziennik mimo nieudanego zapisu")
    }
  }

  /// X-DZ-13 (8A): krótki zapis albo błąd fsync → plik obcięty do rozmiaru sprzed zapisu, dopisz zgłasza błąd.
  func testKrotkiZapisIBladFsync() throws {
    let wzor = try XCTUnwrap(ZdarzenieWejsciowe.zLinii(Repo.tekst("tests/wspolne/dziennik-plus-poprawny.jsonl").split(separator: "\n")[0]))
    for awaria in [Atrapa.Awaria.krotki, .fsync] {
      let p = plik("awaria.jsonl", tresc: "{\"ogon\"") // ucięty ogon: zapis zaczyna się od \n
      let d = DziennikPlus(sciezka: p) { try Atrapa(sciezka: $0, awaria: awaria) }
      XCTAssertThrowsError(try d.dopisz(wzor), "\(awaria)")
      XCTAssertEqual(tresc(p), "{\"ogon\"", "\(awaria): plik nie wrócił do stanu sprzed zapisu")
    }
  }
}

/// Atrapa uchwytu na prawdziwym pliku: zapisuje połowę bajtów (krótki zapis) albo zapisuje całość i pada na fsync.
final class Atrapa: UchwytDziennika {
  enum Awaria { case krotki, fsync }
  let prawdziwy: UchwytPosix
  let awaria: Awaria
  var zapisano = false
  init(sciezka: String, awaria: Awaria) throws { prawdziwy = try UchwytPosix(sciezka: sciezka); self.awaria = awaria }
  func rozmiar() throws -> Int64 { try prawdziwy.rozmiar() }
  func bajt(na pozycja: Int64) throws -> UInt8 { try prawdziwy.bajt(na: pozycja) }
  func dopisz(_ bajty: [UInt8]) throws -> Int {
    zapisano = true
    return try prawdziwy.dopisz(awaria == .krotki ? Array(bajty.prefix(bajty.count / 2)) : bajty)
  }
  func synchronizuj() throws { if awaria == .fsync && zapisano { zapisano = false; throw BladDziennika.system(operacja: "fsync", errno: 5) }; try prawdziwy.synchronizuj() }
  func obetnij(do rozmiar: Int64) throws { try prawdziwy.obetnij(do: rozmiar) }
  func zamknij() { prawdziwy.zamknij() }
}
