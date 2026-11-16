// X-ZG-01–X-ZG-11 (xctest-specyfikacja.md §4; ADR-0009 uzupełnienie 2026-10-26; NZ-08-P3-05 (e), P-135): scenariusze `zegarek_skrzynka`
// z tests/wspolne/wzorce.json (ZG-01–ZG-10) na prawdziwym pliku `skrzynka-zegarka.jsonl` w katalogu tymczasowym; X-ZG-02 z atrapą błędu zapisu.
import Foundation
import OczkoDziennik
import OczkoReguly
import XCTest

/// Magazyn testowy: prawdziwy plik, a na żądanie błąd `dopisz` (pełny dysk) albo przerwanie przed podmianą pliku.
final class MagazynTestowy: MagazynSkrzynki {
  let plik: PlikSkrzynki
  var bladDopisz = false
  init(_ plik: PlikSkrzynki) { self.plik = plik }
  func odczytaj() throws -> [String] { try plik.odczytaj() }
  func dopisz(_ linia: String) throws {
    if bladDopisz { throw BladDziennika.system(operacja: "write", errno: 28) } // ENOSPC
    try plik.dopisz(linia)
  }
  func zastap(_ linie: [String]) throws { try plik.zastap(linie) }
}

final class ZegarekSkrzynkaTests: XCTestCase {
  var katalog: URL!
  override func setUpWithError() throws {
    katalog = FileManager.default.temporaryDirectory.appendingPathComponent("oczko-skrzynka-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: katalog, withIntermediateDirectories: true)
  }
  override func tearDownWithError() throws { try? FileManager.default.removeItem(at: katalog) }
  var sciezka: String { katalog.appendingPathComponent("skrzynka-zegarka.jsonl").path }

  /// Kontekst ze złotego pliku stanu zegarka z podmienionym licznikiem, wartością, głową i blokadą (opis w wzorce.json).
  func kontekst(_ w: Json, licznikB: String) throws -> (StanEkranuBlokady, [String]) {
    let baza = try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-zegarka-typowy.json"))
    let licznik = w["licznik"]?.tekst == "B" ? licznikB : baza.licznikId
    let s = StanEkranuBlokady(wersja: baza.wersja, licznikId: licznik, nazwa: baza.nazwa, wartosc: Int(try XCTUnwrap(w["wartosc"]?.calkowita)),
                              znaczenie: baza.znaczenie, glowa: w["glowa"]?.tekst, ostatniPlusMs: baza.ostatniPlusMs, dzien: baza.dzien,
                              dzienDozwolony: baza.dzienDozwolony, sesjaStartMs: baza.sesjaStartMs, pro: baza.pro, proWaznoscDo: baza.proWaznoscDo,
                              dniWMiesiacu: baza.dniWMiesiacu, przypomnienia: baza.przypomnienia, zablokowany: w["zablokowany"]?.logiczna ?? false)
    return (s, (w["potwierdzone"]?.tablica ?? []).compactMap(\.tekst))
  }

  /// X-ZG-01–X-ZG-09, X-ZG-11 na scenariuszach ZG-01–ZG-10; „wykonano N z N”.
  func testScenariusze() throws {
    let opis = try Repo.json("tests/wspolne/wzorce.json")["zegarek_skrzynka"]
    let scenariusze = opis?["scenariusze"]?.tablica ?? []
    let licznikB = try XCTUnwrap(opis?["licznik_b"]?.tekst)
    let baza = try XCTUnwrap(opis?["czas_bazowy_ms"]?.calkowita)
    let strefa = try XCTUnwrap(opis?["strefa"]?.tekst)
    XCTAssertEqual(opis?["ponowienie_ms"]?.calkowita, Stale.zegarekPonowienieMs)
    let w = Wykonane("zegarek_skrzynka")
    for sc in scenariusze {
      let id = try XCTUnwrap(sc["id"]?.tekst)
      w.dodaj(id)
      try? FileManager.default.removeItem(atPath: sciezka)
      let magazyn = MagazynTestowy(PlikSkrzynki(sciezka: sciezka))
      var s = try SkrzynkaZegarka(magazyn: magazyn)
      for krok in sc["kroki"]?.tablica ?? [] {
        if let k = krok["kontekst"] {
          let (stan, potw) = try kontekst(k, licznikB: licznikB)
          s.przyjmij(stan, potwierdzone: potw)
        } else if let t = krok["stuknij"] {
          let rodzaj = try XCTUnwrap(ZdarzenieWejsciowe.Rodzaj(rawValue: t["rodzaj"]?.tekst ?? ""))
          magazyn.bladDopisz = t["blad_zapisu"]?.logiczna ?? false
          var wynik: String
          do {
            switch try s.stuknijNaZegarku(rodzaj, teraz: baza + (t["t"]?.calkowita ?? 0), strefa: strefa, id: t["id"]?.tekst ?? "", urzadzenie: "zegarek-test") {
            case .zapisz: wynik = "zapisz"
            case .limit: wynik = "limit"
            case .bezZmiany: wynik = "bez_zmiany"
            case .zablokowany: wynik = "zablokowany"
            }
          } catch { wynik = "blad_zapisu" }
          magazyn.bladDopisz = false
          XCTAssertEqual(wynik, t["wynik"]?.tekst ?? "zapisz", "\(id): wynik stuknięcia")
        } else if krok["restart"]?.logiczna == true {
          s = try SkrzynkaZegarka(magazyn: magazyn, kontekst: s.kontekst, potwierdzone: s.potwierdzone)
        } else if let sp = krok["sprawdz"] {
          XCTAssertEqual(s.oczekujace.map(\.id), (sp["kolejka"]?.tablica ?? []).compactMap(\.tekst), "\(id): kolejka")
          XCTAssertEqual(s.pokazywany?.wartosc, sp["wartosc"]?.calkowita.map { Int($0) }, "\(id): wartość pokazywana")
          // Plik = kolejka w pamięci (odtworzenie daje to samo, X-ZG-01).
          XCTAssertEqual(try magazyn.odczytaj().compactMap { ZdarzenieWejsciowe.zLinii(Substring($0))?.id }, s.oczekujace.map(\.id), "\(id): plik")
        } else if let wy = krok["wyslij"] {
          let wToku = Set((wy["w_toku"]?.tablica ?? []).compactMap(\.tekst))
          XCTAssertEqual(s.doWyslania(teraz: baza + (wy["t"]?.calkowita ?? 0), wToku: wToku).map(\.id), (wy["wyslane"]?.tablica ?? []).compactMap(\.tekst), "\(id): wysyłka")
        } else {
          XCTFail("\(id): nieznany krok \(krok)")
        }
      }
    }
    w.sprawdz(oczekiwane: idWektorow(scenariusze), minimum: 10)
  }

  /// X-ZG-02: błąd `dopisz` — `stuknijNaZegarku` rzuca, plik bez zmian (zero bajtów nowej linii).
  func testBladZapisuPlikBezZmian() throws {
    let magazyn = MagazynTestowy(PlikSkrzynki(sciezka: sciezka))
    var s = try SkrzynkaZegarka(magazyn: magazyn, kontekst: try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-zegarka-typowy.json")))
    _ = try s.stuknijNaZegarku(.plus, teraz: 1_794_340_800_000, strefa: "Europe/Warsaw", id: "z1", urzadzenie: "zegarek-test")
    let przed = FileManager.default.contents(atPath: sciezka)
    magazyn.bladDopisz = true
    XCTAssertThrowsError(try s.stuknijNaZegarku(.plus, teraz: 1_794_340_860_000, strefa: "Europe/Warsaw", id: "z2", urzadzenie: "zegarek-test"))
    XCTAssertEqual(FileManager.default.contents(atPath: sciezka), przed)
    XCTAssertEqual(s.oczekujace.map(\.id), ["z1"])
  }

  /// PU-333 (FX5; X-ZG-02 w ujęciu użytkownika): skrzynka nieczytelna (błąd zapisu) → stuknięcie rzuca, a stan pokazywany, kolejka i plik zostają bez zmian;
  /// przebieg `zapisNieudany` daje haptykę `bladZapisu` (+1 i −1), nigdy potwierdzenia. Po powrocie zapisu następne stuknięcie działa (komunikat znika).
  func testPU333BladZapisuStanBezZmianHaptykaBladZapisu() throws {
    let magazyn = MagazynTestowy(PlikSkrzynki(sciezka: sciezka))
    var s = try SkrzynkaZegarka(magazyn: magazyn, kontekst: try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-zegarka-typowy.json")))
    _ = try s.stuknijNaZegarku(.plus, teraz: 1_794_340_800_000, strefa: "Europe/Warsaw", id: "z1", urzadzenie: "zegarek-test")
    let stanPrzed = try XCTUnwrap(s.pokazywany)
    let plikPrzed = FileManager.default.contents(atPath: sciezka)
    magazyn.bladDopisz = true
    var przebieg: PrzebiegStukniecia?
    do {
      _ = try s.stuknijNaZegarku(.plus, teraz: 1_794_340_860_000, strefa: "Europe/Warsaw", id: "z2", urzadzenie: "zegarek-test")
      XCTFail("stuknięcie przy błędzie zapisu musi rzucić")
    } catch {
      przebieg = .zapisNieudany // model aplikacji zegarka: wyjątek skrzynki = nieudany zapis (komunikat „nie dodano rzędu n”)
    }
    XCTAssertEqual(s.pokazywany, stanPrzed, "liczba na zegarku bez zmian")
    XCTAssertEqual(s.oczekujace.map(\.id), ["z1"])
    XCTAssertEqual(FileManager.default.contents(atPath: sciezka), plikPrzed)
    let nieudany = try XCTUnwrap(przebieg)
    XCTAssertEqual(wzorzecHaptykiZegarka(.plus, nieudany), .bladZapisu)
    XCTAssertEqual(wzorzecHaptykiZegarka(.minus, nieudany), .bladZapisu)
    magazyn.bladDopisz = false
    guard case .zapisz = try s.stuknijNaZegarku(.plus, teraz: 1_794_340_920_000, strefa: "Europe/Warsaw", id: "z3", urzadzenie: "zegarek-test") else {
      return XCTFail("po powrocie zapisu stuknięcie ma się zapisać")
    }
    XCTAssertEqual(s.oczekujace.map(\.id), ["z1", "z3"])
  }

  /// X-ZG-10: przepisanie przerwane przed `rename` — plik = stan sprzed usunięcia, plik tymczasowy sprzątany przy odczycie.
  func testPrzepisaniePrzerwane() throws {
    let plik = PlikSkrzynki(sciezka: sciezka)
    let k = try StanEkranuBlokady.dekoduj(Repo.dane("tests/wspolne/stan-zegarka-typowy.json"))
    var s = try SkrzynkaZegarka(magazyn: plik, kontekst: k)
    _ = try s.stuknijNaZegarku(.plus, teraz: 1_794_340_800_000, strefa: "Europe/Warsaw", id: "z1", urzadzenie: "zegarek-test")
    _ = try s.stuknijNaZegarku(.plus, teraz: 1_794_340_860_000, strefa: "Europe/Warsaw", id: "z2", urzadzenie: "zegarek-test")
    let przed = FileManager.default.contents(atPath: sciezka)
    plik.dziennik.przedPodmiana = { throw BladDziennika.system(operacja: "rename", errno: 5) } // EIO: proces przerwany przed rename
    XCTAssertThrowsError(try plik.zastap([]))
    XCTAssertEqual(FileManager.default.contents(atPath: sciezka), przed, "plik kolejki nie może być pusty ani częściowy")
    XCTAssertTrue(FileManager.default.fileExists(atPath: sciezka + ".zastap"), "atrapa zostawia plik tymczasowy")
    plik.dziennik.przedPodmiana = nil
    XCTAssertEqual(try PlikSkrzynki(sciezka: sciezka).odczytaj().count, 2)
    XCTAssertFalse(FileManager.default.fileExists(atPath: sciezka + ".zastap"), "odczyt przy starcie sprząta plik tymczasowy")
  }
}
