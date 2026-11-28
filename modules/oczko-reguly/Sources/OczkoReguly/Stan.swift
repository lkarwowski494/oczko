// Stan Live Activity i zegarka, wersja 3 (moduly.md „Stan Live Activity i zegarka”, ADR-0009; X-ST-01–06): jeden dekoder dla intencji
// i zegarka. Bez wartości domyślnych — brak pola albo zły typ = błąd dekodowania (X-ST-01, R-027); ładunek z wersją nowszą niż znana jest
// odrzucany, a cel zostaje przy ostatnim poprawnym stanie. Nieznane pola pomijane (wersja N czyta N+1).
import Foundation

public let wersjaStanu = 3
/// Największy krok licznika (`licznik.krok` CHECK 1…2, ADR-0036). Źródło: `KROK_MAKS` z src/domena/stukniecia.ts przez generator Stale.swift (P-1124, MS1).
public let krokMaks = Stale.krokMaks

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
  /// Krok licznika (ADR-0036, U6): ile rzędów dodaje jedno „+”. Wyjątek nazwany od X-ST-01 (jak `uwaga`): brak klucza = 1 (Live Activity z 1.0.1 żyje do 8 h bez pola).
  public let krok: Int

  enum CodingKeys: String, CodingKey {
    case wersja, licznikId, nazwa, wartosc, znaczenie, glowa, ostatniPlusMs, dzien, dzienDozwolony, sesjaStartMs, pro, proWaznoscDo, dniWMiesiacu, przypomnienia, zablokowany, krok
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
    // `krok`: brak klucza (stan sprzed 1.0.2) = 1; wartość spoza 1…krokMaks = błąd dekodowania, nie zgadnięta liczba (zasada 9 roli).
    let k = try c.decodeIfPresent(Int.self, forKey: .krok) ?? 1
    guard (1...krokMaks).contains(k) else {
      throw DecodingError.dataCorruptedError(forKey: .krok, in: c, debugDescription: "krok \(k) spoza 1…\(krokMaks)")
    }
    krok = k
  }

  /// Kodowanie z `null` dla pustych pól (ten sam zbiór kluczy co TS, X-ST-02).
  public func encode(to encoder: Encoder) throws {
    var c = encoder.container(keyedBy: CodingKeys.self)
    try c.encode(wersja, forKey: .wersja); try c.encode(licznikId, forKey: .licznikId); try c.encode(nazwa, forKey: .nazwa)
    try c.encode(wartosc, forKey: .wartosc); try c.encode(znaczenie, forKey: .znaczenie); try c.encode(glowa, forKey: .glowa)
    try c.encode(ostatniPlusMs, forKey: .ostatniPlusMs); try c.encode(dzien, forKey: .dzien); try c.encode(dzienDozwolony, forKey: .dzienDozwolony)
    try c.encode(sesjaStartMs, forKey: .sesjaStartMs); try c.encode(pro, forKey: .pro); try c.encode(proWaznoscDo, forKey: .proWaznoscDo)
    try c.encode(dniWMiesiacu, forKey: .dniWMiesiacu); try c.encode(przypomnienia, forKey: .przypomnienia); try c.encode(zablokowany, forKey: .zablokowany)
    if krok != 1 { try c.encode(krok, forKey: .krok) } // krok 1 = brak klucza (jak w złotych plikach sprzed 1.0.2; dekoder czyta oba)
  }

  /// Stan po zapisanym stuknięciu (ADR-0008 (1)): wartość ± k, `glowa` = ostatnie nowe zdarzenie, dzień i dni limitu; `ostatniPlusMs` = czas zdarzenia
  /// tylko po +k (wejście przerwy nowego dnia = ostatnie +1, jak TS `ostatniPlus`; P-132 (2c), P-138). −1 jest korektą: nie zmienia `dzien`, `dzienDozwolony`
  /// ani dni limitu (ADR-0035 § U4, IN-08, IN-09) — dawniej przywracał w stanie limitu przycisk „+1”.
  public func po(_ wartoscZmiana: Int, glowa: String, czasMs: Int64, dzien: String, dni: [DzienStanu]) -> StanEkranuBlokady {
    let plus = wartoscZmiana > 0
    return StanEkranuBlokady(wersja: wersja, licznikId: licznikId, nazwa: nazwa, wartosc: max(0, wartosc + wartoscZmiana), znaczenie: znaczenie, glowa: glowa,
                             ostatniPlusMs: plus ? czasMs : ostatniPlusMs, dzien: plus ? dzien : self.dzien, dzienDozwolony: plus ? true : dzienDozwolony,
                             sesjaStartMs: sesjaStartMs, pro: pro, proWaznoscDo: proWaznoscDo, dniWMiesiacu: plus ? dni : dniWMiesiacu,
                             przypomnienia: przypomnienia, zablokowany: zablokowany, krok: krok)
  }

  public init(wersja: Int, licznikId: String, nazwa: String, wartosc: Int, znaczenie: Znaczenie, glowa: String?, ostatniPlusMs: Int64?, dzien: String,
              dzienDozwolony: Bool, sesjaStartMs: Int64?, pro: Bool, proWaznoscDo: Int64?, dniWMiesiacu: [DzienStanu], przypomnienia: [PrzypomnienieStanu],
              zablokowany: Bool, krok: Int = 1) {
    self.wersja = wersja; self.licznikId = licznikId; self.nazwa = nazwa; self.wartosc = wartosc; self.znaczenie = znaczenie; self.glowa = glowa
    self.ostatniPlusMs = ostatniPlusMs; self.dzien = dzien; self.dzienDozwolony = dzienDozwolony; self.sesjaStartMs = sesjaStartMs; self.pro = pro
    self.proWaznoscDo = proWaznoscDo; self.dniWMiesiacu = dniWMiesiacu; self.przypomnienia = przypomnienia; self.zablokowany = zablokowany
    self.krok = krok // bez sprawdzenia zakresu: zakres sprawdza dekoder (granica) i `stuknij` (reguła)
  }

  public static func dekoduj(_ dane: Data) throws -> StanEkranuBlokady { try JSONDecoder().decode(StanEkranuBlokady.self, from: dane) }

  /// Pro według stanu (KP-17): kontekst telefonu oceniany jak pamięć uprawnień, z oknem offline.
  public func maPro(teraz: Int64) -> Bool { proZegarka([.telefon(pro: pro, wygasa: proWaznoscDo)], teraz: teraz) }
}
