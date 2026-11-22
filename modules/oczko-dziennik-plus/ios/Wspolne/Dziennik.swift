// Rdzeń pliku dziennika +1 (ADR-0008 (8A), (8S), (8R), (3′)): jedyny pisarz z kolejką szeregową (intencja ekranu blokady i skrzynka zegarka,
// P-110 Q8a), odczyt dla JS i skracanie po COMMIT scalenia. Bez SQLite (ADR-0008) i bez UIKit — testowany `swift test` (P-129 Q2a).
import Foundation
#if canImport(Darwin)
import Darwin
#else
import Glibc
#endif

/// Operacje na pliku potrzebne zapisowi (8A); atrapa w teście symuluje krótki zapis i błąd `fsync` (X-DZ-13).
public protocol UchwytDziennika: AnyObject {
  func rozmiar() throws -> Int64
  func bajt(na pozycja: Int64) throws -> UInt8
  /// Jeden `write` na deskryptorze z O_APPEND; zwraca liczbę zapisanych bajtów (może być mniejsza niż długość).
  func dopisz(_ bajty: [UInt8]) throws -> Int
  func synchronizuj() throws
  func obetnij(do rozmiar: Int64) throws
  func zamknij()
}

public enum BladDziennika: Error, Equatable {
  case system(operacja: String, errno: Int32)
  case krotkiZapis(zapisano: Int, oczekiwano: Int)
}

/// Uchwyt POSIX: `open(O_WRONLY | O_CREAT | O_APPEND)`, `fstat`, `pread`, `write`, `fsync`, `ftruncate`.
public final class UchwytPosix: UchwytDziennika {
  let fd: Int32
  public init(sciezka: String) throws {
    fd = open(sciezka, O_RDWR | O_CREAT | O_APPEND, 0o600)
    if fd < 0 { throw BladDziennika.system(operacja: "open", errno: errno) }
  }
  public func rozmiar() throws -> Int64 {
    var s = stat()
    if fstat(fd, &s) != 0 { throw BladDziennika.system(operacja: "fstat", errno: errno) }
    return Int64(s.st_size)
  }
  public func bajt(na pozycja: Int64) throws -> UInt8 {
    var b: UInt8 = 0
    if pread(fd, &b, 1, off_t(pozycja)) != 1 { throw BladDziennika.system(operacja: "pread", errno: errno) }
    return b
  }
  public func dopisz(_ bajty: [UInt8]) throws -> Int {
    let n = bajty.withUnsafeBytes { write(fd, $0.baseAddress, $0.count) }
    if n < 0 { throw BladDziennika.system(operacja: "write", errno: errno) }
    return n
  }
  public func synchronizuj() throws { if fsync(fd) != 0 { throw BladDziennika.system(operacja: "fsync", errno: errno) } }
  public func obetnij(do rozmiar: Int64) throws { if ftruncate(fd, off_t(rozmiar)) != 0 { throw BladDziennika.system(operacja: "ftruncate", errno: errno) } }
  public func zamknij() { close(fd) }
}

public struct OdczytDziennika: Equatable {
  public let zdarzenia: [ZdarzenieWejsciowe]
  /// Linie, które nie są poprawnym zdarzeniem (także sklejone z odzyskanym zdarzeniem): numer od 1 i cała treść (ADR-0008 (3′)).
  public let uszkodzone: [Uszkodzona]
  public struct Uszkodzona: Equatable { public let linia: Int; public let tekst: String }
}

/// (8R): zdarzenie z linii albo — gdy linia nim nie jest — z reszty od najmniejszego `{` na pozycji k > 0, przy którym reszta jest zdarzeniem.
func odczytajLinie(_ linia: Substring) -> (zdarzenie: ZdarzenieWejsciowe?, cala: Bool) {
  if let z = ZdarzenieWejsciowe.zLinii(linia) { return (z, true) }
  guard !linia.isEmpty else { return (nil, false) }
  var i = linia.index(after: linia.startIndex)
  while let k = linia[i...].firstIndex(of: "{") {
    if let z = ZdarzenieWejsciowe.zLinii(linia[k...]) { return (z, false) }
    i = linia.index(after: k)
  }
  return (nil, false)
}

public func parsujDziennik(_ tekst: String) -> OdczytDziennika {
  var zdarzenia: [ZdarzenieWejsciowe] = []
  var uszkodzone: [OdczytDziennika.Uszkodzona] = []
  for (i, linia) in tekst.split(separator: "\n", omittingEmptySubsequences: false).enumerated() {
    if linia.allSatisfy(\.isWhitespace) { continue } // pusty plik albo `\n` na końcu
    let (z, cala) = odczytajLinie(linia)
    if let z { zdarzenia.append(z) }
    if !cala { uszkodzone.append(.init(linia: i + 1, tekst: String(linia))) }
  }
  return OdczytDziennika(zdarzenia: zdarzenia, uszkodzone: uszkodzone)
}

/// (8S): bajty pliku po `skroc(doId)` — usunięte linie do `doId` włącznie (także w linii sklejonej) i ucięty ogon za nim; nil = brak `doId` (bez zmian).
public func poSkroceniu(_ tekst: String, doId: String) -> String? {
  let linie = tekst.split(separator: "\n", omittingEmptySubsequences: false)
  guard let i = linie.firstIndex(where: { odczytajLinie($0).zdarzenie?.id == doId }) else { return nil }
  var reszta = linie[(i + 1)...].map(String.init)
  if !reszta.isEmpty { reszta[reszta.count - 1] = "" } // bajty po ostatnim `\n` (ucięty ogon albo pusto)
  return reszta.joined(separator: "\n")
}

public final class DziennikPlus {
  let sciezka: String
  let otworz: (String) throws -> UchwytDziennika
  let kolejka = DispatchQueue(label: "oczko.dziennik-plus") // jedyny pisarz w procesie (ADR-0008 (8A))
  /// Tylko test (X-ZG-10): wołane w `zastap` i `skroc` po zapisie pliku tymczasowego, przed `rename` — błąd symuluje przerwanie procesu.
  public var przedPodmiana: (() throws -> Void)?

  public init(sciezka: String, otworz: @escaping (String) throws -> UchwytDziennika = { try UchwytPosix(sciezka: $0) }) {
    self.sciezka = sciezka
    self.otworz = otworz
  }

  /// (8A): `\n` + linia + `\n`, gdy plik niepusty nie kończy się `\n`, inaczej linia + `\n`; jeden `write`, potem `fsync`.
  /// Krótki zapis albo błąd: `ftruncate` do rozmiaru sprzed zapisu i błąd (wołający nie zmienia stanu Live Activity).
  public func dopisz(_ z: ZdarzenieWejsciowe) throws {
    try kolejka.sync {
      let u = try otworz(sciezka)
      defer { u.zamknij() }
      let przed = try u.rozmiar()
      let poczatek: [UInt8] = try przed > 0 && u.bajt(na: przed - 1) != 0x0A ? [0x0A] : []
      let bajty = poczatek + Array(z.linia.utf8) + [0x0A]
      do {
        let n = try u.dopisz(bajty)
        if n != bajty.count { throw BladDziennika.krotkiZapis(zapisano: n, oczekiwano: bajty.count) }
        try u.synchronizuj()
      } catch {
        try? u.obetnij(do: przed)
        try? u.synchronizuj()
        throw error
      }
    }
  }

  /// Surowa treść pliku przez kolejkę pisarza (most dla JS: parsowanie i diagnostyka w TS, src/dane/dziennik.ts).
  public func tekst() throws -> String { try kolejka.sync { try tekstPliku() } }

  public func odczytaj() throws -> OdczytDziennika {
    try kolejka.sync { parsujDziennik(try tekstPliku()) }
  }

  /// (8S) po COMMIT scalenia, w tej samej kolejce co dopisywanie; przepisanie atomowe jak `zastap` (M1-024: nieudany zapis pliku
  /// tymczasowego → błąd, dziennik bez zmian).
  public func skroc(doId: String) throws {
    try kolejka.sync {
      guard let nowy = poSkroceniu(try tekstPliku(), doId: doId) else { return }
      try przepisz(nowy)
    }
  }

  /// Przepisanie atomowe (ADR-0009, 2026-10-26 pkt 1): linie do pliku tymczasowego w tym samym katalogu, `fsync`, `rename` — przerwane
  /// w połowie zostawia stary albo nowy plik, nigdy pusty ani częściowy. Pozostały plik tymczasowy usuwa `sprzatnijTymczasowy`.
  public func zastap(_ linie: [String]) throws {
    try kolejka.sync { try przepisz(linie.map { $0 + "\n" }.joined()) }
  }

  /// Wspólne dla `zastap` i `skroc` (wołane w kolejce): plik tymczasowy przez uchwyt (`otworz`, w teście atrapa) obcięty do zera, cała
  /// treść jednym zapisem sprawdzonym co do długości, `fsync`, dopiero potem `rename`. Krótki zapis albo błąd → błąd przed podmianą.
  private func przepisz(_ tresc: String) throws {
    let tymczasowy = sciezka + ".zastap"
    let u = try otworz(tymczasowy)
    defer { u.zamknij() }
    try u.obetnij(do: 0)
    let bajty = Array(tresc.utf8)
    if !bajty.isEmpty {
      let n = try u.dopisz(bajty)
      if n != bajty.count { throw BladDziennika.krotkiZapis(zapisano: n, oczekiwano: bajty.count) }
    }
    try u.synchronizuj()
    try przedPodmiana?()
    if rename(tymczasowy, sciezka) != 0 { throw BladDziennika.system(operacja: "rename", errno: errno) }
  }

  /// Plik tymczasowy przerwanego `zastap` (przy starcie, przed odczytem).
  public func sprzatnijTymczasowy() {
    kolejka.sync { try? FileManager.default.removeItem(atPath: sciezka + ".zastap") }
  }

  func tekstPliku() throws -> String {
    guard FileManager.default.fileExists(atPath: sciezka) else { return "" }
    guard let d = FileManager.default.contents(atPath: sciezka) else { throw BladDziennika.system(operacja: "read", errno: errno) }
    return String(decoding: d, as: UTF8.self)
  }
}
