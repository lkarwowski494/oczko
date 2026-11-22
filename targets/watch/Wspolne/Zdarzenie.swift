// Linia dziennika +1 = `ZdarzenieWejsciowe` (moduly.md „Porty domeny”, ADR-0008 (4)); kontrakt bajtów ze złotymi plikami tests/wspolne/
// (X-DZ-01–03, X-DZ-11): dekoder pomija nieznane pola i nie zna wartości domyślnych, koder pisze pola w kolejności typu, jak JSON.stringify w TS.
import Foundation

public struct ZdarzenieWejsciowe: Equatable, Decodable {
  public enum Rodzaj: String, Decodable { case plus, minus }
  public enum Zrodlo: String, Decodable { case ekran_blokady, zegarek }
  public let id: String
  public let licznikId: String
  public let rodzaj: Rodzaj
  public let rodzice: [String]
  public let czasMs: Int64
  public let strefa: String
  public let dzien: String
  public let zrodlo: Zrodlo
  public let urzadzenie: String
  public let pro: Bool // uprawnienie Pro urządzenia w chwili stuknięcia (P-111 (2), ADR-0008 (6))

  public init(id: String, licznikId: String, rodzaj: Rodzaj, rodzice: [String], czasMs: Int64, strefa: String, dzien: String, zrodlo: Zrodlo, urzadzenie: String, pro: Bool) {
    self.id = id; self.licznikId = licznikId; self.rodzaj = rodzaj; self.rodzice = rodzice; self.czasMs = czasMs
    self.strefa = strefa; self.dzien = dzien; self.zrodlo = zrodlo; self.urzadzenie = urzadzenie; self.pro = pro
  }

  /// Linia → zdarzenie albo nil (zły JSON, brak pola, zły typ, pusty id/licznik/strefa, dzień spoza RRRR-MM-DD) — jak `zdarzenieZLinii` w TS.
  public static func zLinii(_ linia: Substring) -> ZdarzenieWejsciowe? {
    guard let z = try? JSONDecoder().decode(ZdarzenieWejsciowe.self, from: Data(linia.utf8)) else { return nil }
    guard !z.id.isEmpty, !z.licznikId.isEmpty, !z.strefa.isEmpty, jestDzien(z.dzien) else { return nil }
    return z
  }

  /// Linia bez `\n`: pola w kolejności typu, `czasMs` jako liczba całkowita, bez `\/` (X-DZ-02).
  public var linia: String {
    "{\"id\":\(json(id)),\"licznikId\":\(json(licznikId)),\"rodzaj\":\(json(rodzaj.rawValue)),\"rodzice\":[\(rodzice.map(json).joined(separator: ","))],"
      + "\"czasMs\":\(czasMs),\"strefa\":\(json(strefa)),\"dzien\":\(json(dzien)),\"zrodlo\":\(json(zrodlo.rawValue)),\"urzadzenie\":\(json(urzadzenie)),\"pro\":\(pro)}"
  }
}

func jestDzien(_ s: String) -> Bool {
  let b = Array(s.utf8)
  guard b.count == 10, b[4] == 0x2D, b[7] == 0x2D else { return false }
  return b.enumerated().allSatisfy { i, c in i == 4 || i == 7 || (0x30...0x39).contains(c) }
}

/// Napis JSON jak JSON.stringify (ECMA-262 QuoteJSONString): `"` `\` i znaki < U+0020 ucieczką, `/` i znaki spoza ASCII bez zmian.
func json(_ s: String) -> String {
  var w = "\""
  for u in s.unicodeScalars {
    switch u {
    case "\"": w += "\\\""
    case "\\": w += "\\\\"
    case "\u{08}": w += "\\b"
    case "\u{0C}": w += "\\f"
    case "\n": w += "\\n"
    case "\r": w += "\\r"
    case "\t": w += "\\t"
    default:
      if u.value < 0x20 {
        let h = String(u.value, radix: 16)
        w += "\\u" + String(repeating: "0", count: 4 - h.count) + h
      } else { w.unicodeScalars.append(u) }
    }
  }
  return w + "\""
}
