// Dzień lokalny RD-16 w Swift (ADR-0007 uzupełnienie, ER-37, R-133, R-134): data RRRR-MM-DD w strefie IANA, zawsze kalendarz gregoriański
// i cyfry ASCII — niezależnie od języka, regionu i kalendarza urządzenia (X-RG-06); wyrocznia: tests/wektory/brd.json RD-16.
import Foundation

public func dzienLokalny(ms: Int64, strefa: String) throws -> String {
  guard let tz = TimeZone(identifier: strefa) else { throw BladDanych("dzienLokalny: nieznana strefa \(strefa)") }
  var kalendarz = Calendar(identifier: .gregorian)
  kalendarz.timeZone = tz
  // Podział ms na sekundy całkowite i resztę: Date z Double bez utraty dokładności dla ms do ±2^53.
  let data = Date(timeIntervalSince1970: TimeInterval(ms / 1000) + TimeInterval(ms % 1000) / 1000)
  let c = kalendarz.dateComponents([.year, .month, .day], from: data)
  guard let r = c.year, let m = c.month, let d = c.day else { throw BladDanych("dzienLokalny: brak składowych daty") }
  return dwie(r, 4) + "-" + dwie(m, 2) + "-" + dwie(d, 2)
}
/// Cyfry ASCII z zerami wiodącymi, bez formatera zależnego od Locale.
func dwie(_ n: Int, _ szerokosc: Int) -> String {
  let s = String(n)
  return String(repeating: "0", count: max(0, szerokosc - s.count)) + s
}
