// Stan Live Activity i zegarka, wersja 3 (moduly.md „Stan Live Activity i zegarka”, ADR-0009; X-ST-01–06): jeden dekoder dla intencji
// i zegarka. Bez wartości domyślnych — brak pola albo zły typ = błąd dekodowania (X-ST-01, R-027); ładunek z wersją nowszą niż znana jest
// odrzucany, a cel zostaje przy ostatnim poprawnym stanie. Nieznane pola pomijane (wersja N czyta N+1).
import Foundation

public let wersjaStanu = 3

public struct DzienStanu: Codable, Hashable {
  public let dzien: String
  public let pro: Bool
  public init(dzien: String, pro: Bool) { self.dzien = dzien; self.pro = pro }
}
public struct PrzypomnienieStanu: Codable, Hashable {
  public let od: Int
  public let co: Int
  public let razy: Int
  public let tekst: String
  public init(od: Int, co: Int, razy: Int, tekst: String) { self.od = od; self.co = co; self.razy = razy; self.tekst = tekst }
}
public struct StanEkranuBlokady: Codable, Hashable { // Hashable: ContentState Live Activity (ActivityKit)
  public enum Znaczenie: String, Codable { case skonczone, w_trakcie }
  public let wersja: Int
  public let licznikId: String
  public let nazwa: String
  public let wartosc: Int
  public let znaczenie: Znaczenie
  public let glowa: String?
  public let ostatniPlusMs: Int64?
  public let dzien: String
  public let dzienDozwolony: Bool
  public let sesjaStartMs: Int64?
  public let pro: Bool
  public let proWaznoscDo: Int64?
  public let dniWMiesiacu: [DzienStanu]
  public let przypomnienia: [PrzypomnienieStanu]
  /// Blokada licznika (F-03, N1, wersja 3); stan wersji 2 bez pola = odblokowany.
  public let zablokowany: Bool

  enum CodingKeys: String, CodingKey {
    case wersja, licznikId, nazwa, wartosc, znaczenie, glowa, ostatniPlusMs, dzien, dzienDozwolony, sesjaStartMs, pro, proWaznoscDo, dniWMiesiacu, przypomnienia, zablokowany
  }

  /// Pola opcjonalne w typie TS (`T | null`) muszą być obecne: `decodeNil` odróżnia `null` od braku klucza (brak = błąd, X-ST-01).
  public init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    func zNull<T: Decodable>(_ t: T.Type, _ k: CodingKeys) throws -> T? {
      guard c.contains(k) else { throw DecodingError.keyNotFound(k, .init(codingPath: c.codingPath, debugDescription: "brak pola \(k.rawValue)")) }
      return try c.decodeNil(forKey: k) ? nil : c.decode(t, forKey: k)
    }
    wersja = try c.decode(Int.self, forKey: .wersja)
    guard wersja <= wersjaStanu else {
      throw DecodingError.dataCorruptedError(forKey: .wersja, in: c, debugDescription: "wersja \(wersja) nowsza niż znana \(wersjaStanu)")
    }
    licznikId = try c.decode(String.self, forKey: .licznikId)
    nazwa = try c.decode(String.self, forKey: .nazwa)
    wartosc = try c.decode(Int.self, forKey: .wartosc)
    znaczenie = try c.decode(Znaczenie.self, forKey: .znaczenie)
    glowa = try zNull(String.self, .glowa)
    ostatniPlusMs = try zNull(Int64.self, .ostatniPlusMs)
    dzien = try c.decode(String.self, forKey: .dzien)
    dzienDozwolony = try c.decode(Bool.self, forKey: .dzienDozwolony)
    sesjaStartMs = try zNull(Int64.self, .sesjaStartMs)
    pro = try c.decode(Bool.self, forKey: .pro)
    proWaznoscDo = try zNull(Int64.self, .proWaznoscDo)
    dniWMiesiacu = try c.decode([DzienStanu].self, forKey: .dniWMiesiacu)
    przypomnienia = try c.decode([PrzypomnienieStanu].self, forKey: .przypomnienia)
    // Wersja 2 (Live Activity i kontekst zegarka sprzed aktualizacji) nie zna pola: odblokowany; od wersji 3 pole obowiązkowe (X-ST-07).
    zablokowany = wersja >= 3 ? try c.decode(Bool.self, forKey: .zablokowany) : false
  }

  /// Kodowanie z `null` dla pustych pól (ten sam zbiór kluczy co TS, X-ST-02).
  public func encode(to encoder: Encoder) throws {
    var c = encoder.container(keyedBy: CodingKeys.self)
    try c.encode(wersja, forKey: .wersja); try c.encode(licznikId, forKey: .licznikId); try c.encode(nazwa, forKey: .nazwa)
    try c.encode(wartosc, forKey: .wartosc); try c.encode(znaczenie, forKey: .znaczenie); try c.encode(glowa, forKey: .glowa)
    try c.encode(ostatniPlusMs, forKey: .ostatniPlusMs); try c.encode(dzien, forKey: .dzien); try c.encode(dzienDozwolony, forKey: .dzienDozwolony)
    try c.encode(sesjaStartMs, forKey: .sesjaStartMs); try c.encode(pro, forKey: .pro); try c.encode(proWaznoscDo, forKey: .proWaznoscDo)
    try c.encode(dniWMiesiacu, forKey: .dniWMiesiacu); try c.encode(przypomnienia, forKey: .przypomnienia); try c.encode(zablokowany, forKey: .zablokowany)
  }

  /// Stan po zapisanym stuknięciu (ADR-0008 (1)): wartość ± 1, `glowa` = nowe zdarzenie, dzień i dni limitu; `ostatniPlusMs` = czas zdarzenia
  /// tylko po +1 (wejście przerwy nowego dnia = ostatnie +1, jak TS `ostatniPlus`; P-132 (2c), P-138).
  public func po(_ wartoscZmiana: Int, glowa: String, czasMs: Int64, dzien: String, dni: [DzienStanu]) -> StanEkranuBlokady {
    StanEkranuBlokady(wersja: wersja, licznikId: licznikId, nazwa: nazwa, wartosc: max(0, wartosc + wartoscZmiana), znaczenie: znaczenie, glowa: glowa,
                      ostatniPlusMs: wartoscZmiana > 0 ? czasMs : ostatniPlusMs, dzien: dzien, dzienDozwolony: true, sesjaStartMs: sesjaStartMs, pro: pro, proWaznoscDo: proWaznoscDo,
                      dniWMiesiacu: dni, przypomnienia: przypomnienia, zablokowany: zablokowany)
  }

  public init(wersja: Int, licznikId: String, nazwa: String, wartosc: Int, znaczenie: Znaczenie, glowa: String?, ostatniPlusMs: Int64?, dzien: String,
              dzienDozwolony: Bool, sesjaStartMs: Int64?, pro: Bool, proWaznoscDo: Int64?, dniWMiesiacu: [DzienStanu], przypomnienia: [PrzypomnienieStanu],
              zablokowany: Bool) {
    self.wersja = wersja; self.licznikId = licznikId; self.nazwa = nazwa; self.wartosc = wartosc; self.znaczenie = znaczenie; self.glowa = glowa
    self.ostatniPlusMs = ostatniPlusMs; self.dzien = dzien; self.dzienDozwolony = dzienDozwolony; self.sesjaStartMs = sesjaStartMs; self.pro = pro
    self.proWaznoscDo = proWaznoscDo; self.dniWMiesiacu = dniWMiesiacu; self.przypomnienia = przypomnienia; self.zablokowany = zablokowany
  }

  public static func dekoduj(_ dane: Data) throws -> StanEkranuBlokady { try JSONDecoder().decode(StanEkranuBlokady.self, from: dane) }

  /// Pro według stanu (KP-17): kontekst telefonu oceniany jak pamięć uprawnień, z oknem offline.
  public func maPro(teraz: Int64) -> Bool { proZegarka([.telefon(pro: pro, wygasa: proWaznoscDo)], teraz: teraz) }
}
