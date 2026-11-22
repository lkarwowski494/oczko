// Wartość JSON z rozróżnieniem logicznej i liczby (granica z zewnętrzem: wektory, kontekst zegarka, stan Live Activity).
// Dane z zewnątrz parsowane z tej wartości do typów reguł; zły typ = BladDanych (jak `BladDanych` w docs/monetyzacja/limit.mjs).
import Foundation

public struct BladDanych: Error, Equatable {
  public let komunikat: String
  public init(_ komunikat: String) { self.komunikat = komunikat }
}

public enum Json: Decodable, Equatable {
  case null
  case logiczna(Bool)
  case liczba(Double)
  case tekst(String)
  case tablica([Json])
  case obiekt([String: Json])

  public init(from decoder: Decoder) throws {
    let c = try decoder.singleValueContainer()
    if c.decodeNil() { self = .null; return }
    if let b = try? c.decode(Bool.self) { self = .logiczna(b); return }
    if let d = try? c.decode(Double.self) { self = .liczba(d); return }
    if let s = try? c.decode(String.self) { self = .tekst(s); return }
    if let a = try? c.decode([Json].self) { self = .tablica(a); return }
    self = .obiekt(try c.decode([String: Json].self))
  }

  public static func z(_ dane: Data) throws -> Json { try JSONDecoder().decode(Json.self, from: dane) }

  public subscript(_ klucz: String) -> Json? {
    if case let .obiekt(o) = self { return o[klucz] }
    return nil
  }
  public var tekst: String? { if case let .tekst(s) = self { return s }; return nil }
  public var logiczna: Bool? { if case let .logiczna(b) = self { return b }; return nil }
  public var tablica: [Json]? { if case let .tablica(a) = self { return a }; return nil }
  /// Liczba całkowita (ms, dni) zapisana dokładnie; ułamek albo poza Int64 = nil.
  public var calkowita: Int64? {
    if case let .liczba(d) = self, d.isFinite, d == d.rounded(), abs(d) < 9_007_199_254_740_992 { return Int64(d) }
    return nil
  }
  public var jestNull: Bool { self == .null }
}
