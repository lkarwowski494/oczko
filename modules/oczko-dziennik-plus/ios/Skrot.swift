// SHA-256 pliku strumieniowo w Swift (P-130: natywnie zamiast JS — pomiar referencyjny 400 MB w Node 16–17 s, Hermes bez JIT wolniejszy):
// kawałki 1 MiB przez FileHandle, CryptoKit (systemowa biblioteka kryptograficzna); wynik szesnastkowo małymi literami.
import CryptoKit
import Foundation

enum Skrot {
  static func sha256Pliku(_ sciezka: String) throws -> String {
    guard let h = FileHandle(forReadingAtPath: sciezka) else { throw CocoaError(.fileReadNoSuchFile) }
    defer { try? h.close() }
    var s = SHA256()
    while let kawalek = try h.read(upToCount: 1 << 20), !kawalek.isEmpty { s.update(data: kawalek) }
    return s.finalize().map { String(format: "%02x", $0) }.joined()
  }
}
