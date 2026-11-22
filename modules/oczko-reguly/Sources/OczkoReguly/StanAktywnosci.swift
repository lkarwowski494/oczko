// Stan treści Live Activity (ADR-0008, uzupełnienie 2026-10-26 fix-4; P-135 Q5a, P-139): pola `StanEkranuBlokady` płasko (te same klucze JSON)
// + `uwaga` (komunikat po nieudanym stuknięciu) + `jezyk` (język aplikacji dla tekstów). Oba pola tylko w Live Activity, poza ładunkiem zegarka
// i złotymi plikami `stan-*.json`. Brak klucza = `nil` (wyjątek nazwany od X-ST-01: Live Activity sprzed aktualizacji żyje do 8 h bez tych pól).
import Foundation

public struct StanAktywnosci: Codable, Hashable {
  public enum Uwaga: String, Codable, Hashable { case odblokuj, blad_zapisu }
  public let stan: StanEkranuBlokady
  public let uwaga: Uwaga?
  public let jezyk: String?

  public init(stan: StanEkranuBlokady, uwaga: Uwaga?, jezyk: String?) { self.stan = stan; self.uwaga = uwaga; self.jezyk = jezyk }

  enum CodingKeys: String, CodingKey { case uwaga, jezyk }

  public init(from decoder: Decoder) throws {
    stan = try StanEkranuBlokady(from: decoder)
    let c = try decoder.container(keyedBy: CodingKeys.self)
    uwaga = try c.decodeIfPresent(Uwaga.self, forKey: .uwaga) // brak klucza albo null = nil; nieznana wartość = błąd
    jezyk = try c.decodeIfPresent(String.self, forKey: .jezyk)
  }

  public func encode(to encoder: Encoder) throws {
    try stan.encode(to: encoder)
    var c = encoder.container(keyedBy: CodingKeys.self)
    try c.encode(uwaga, forKey: .uwaga)
    try c.encode(jezyk, forKey: .jezyk)
  }
}
