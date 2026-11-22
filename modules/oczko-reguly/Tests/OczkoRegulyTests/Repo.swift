// Pliki czytane wprost z repo (tests/wspolne, docs/monetyzacja, tests/wektory), bez kopii w modules/ (R-032); każdy zestaw wypisuje
// „wykonano N z N” i pada przy N = 0 albo gdy wykonane id ≠ id z pliku (xctest-specyfikacja.md, zasady wspólne).
import Foundation
import OczkoReguly
import XCTest

enum Repo {
  /// Korzeń repo: Tests/OczkoRegulyTests/<plik> → modules/oczko-reguly → repo.
  static let korzen = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    .deletingLastPathComponent().deletingLastPathComponent()
  static func dane(_ sciezka: String) throws -> Data { try Data(contentsOf: korzen.appendingPathComponent(sciezka)) }
  static func json(_ sciezka: String) throws -> Json { try Json.z(dane(sciezka)) }
  static func tekst(_ sciezka: String) throws -> String { String(decoding: try dane(sciezka), as: UTF8.self) }
}

/// Licznik wykonanych przypadków zestawu: id wykonane = id z pliku (zbiór i kolejność), N > 0.
final class Wykonane {
  let zestaw: String
  private(set) var id: [String] = []
  init(_ zestaw: String) { self.zestaw = zestaw }
  func dodaj(_ i: String) { id.append(i) }
  func sprawdz(oczekiwane: [String], minimum: Int = 1, file: StaticString = #filePath, line: UInt = #line) {
    print("\(zestaw): wykonano \(id.count) z \(oczekiwane.count)")
    XCTAssertGreaterThanOrEqual(oczekiwane.count, minimum, "\(zestaw): za mało przypadków w pliku", file: file, line: line)
    XCTAssertEqual(id, oczekiwane, "\(zestaw): wykonane id ≠ id z pliku", file: file, line: line)
  }
}

func idWektorow(_ lista: [Json]) -> [String] { lista.compactMap { $0["id"]?.tekst } }
