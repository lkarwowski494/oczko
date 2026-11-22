// Dostęp do Pro w Swift (ADR-0009 D, KP-17, P-103 (4a)): port docs/monetyzacja/dostep.mjs — decyzja, odczytajPamiec, proZegarka;
// wyrocznia: docs/monetyzacja/wektory-dostepu.json (X-RG-05, X-ST-05/06). Okno offline = Stale.oknoOfflineProMs.
import Foundation

public struct Uprawnienie: Equatable {
  public let produkt: String
  public let wygasa: Int64? // nil = bez końca (dożywotni)
  public let odebrane: Bool
  public let karencjaDo: Int64?
  public init(produkt: String, wygasa: Int64?, odebrane: Bool, karencjaDo: Int64? = nil) {
    self.produkt = produkt; self.wygasa = wygasa; self.odebrane = odebrane; self.karencjaDo = karencjaDo
  }
}
public enum Odczyt: Equatable { case sklep([Uprawnienie]); case blad }
public struct Pamiec: Equatable {
  public let produkty: [String]
  public let wygasa: Int64?
  public init(produkty: [String], wygasa: Int64?) { self.produkty = produkty; self.wygasa = wygasa }
}
public enum PowodDostepu: String { case sklep, pamiec, brak }
public struct Decyzja: Equatable {
  public let dostep: Bool
  public let powod: PowodDostepu
  public let pamiec: Pamiec?
}

/// Koniec uprawnienia: późniejsza z dat `wygasa` i `karencjaDo` (P-103 (2a)); dożywotni (nil) bez zmian.
func koniec(_ u: Uprawnienie) -> Int64? { u.wygasa.map { max($0, u.karencjaDo ?? Int64.min) } }
func pamiecWazna(_ wygasa: Int64?, _ teraz: Int64) -> Bool { wygasa.map { teraz < $0 + Stale.oknoOfflineProMs } ?? true }

public func decyzja(_ odczyt: Odczyt, _ pamiec: Pamiec?, teraz: Int64, odblokowuja: [String] = Stale.produktyPro) -> Decyzja {
  switch odczyt {
  case let .sklep(uprawnienia):
    let wazne = uprawnienia.filter { u in !u.odebrane && odblokowuja.contains(u.produkt) && (koniec(u).map { $0 > teraz } ?? true) }
    let nowa: Pamiec? = wazne.isEmpty ? nil : Pamiec(
      produkty: wazne.map(\.produkt),
      wygasa: wazne.contains { koniec($0) == nil } ? nil : wazne.compactMap(koniec).max())
    return Decyzja(dostep: nowa != nil, powod: nowa != nil ? .sklep : .brak, pamiec: nowa)
  case .blad:
    let ok = pamiec.map { !$0.produkty.isEmpty && pamiecWazna($0.wygasa, teraz) } ?? false
    return Decyzja(dostep: ok, powod: ok ? .pamiec : .brak, pamiec: pamiec)
  }
}

/// Pamięć uprawnień z pliku (może być uszkodzona): nil = brak ważnej pamięci (zasada błędów moduly.md).
public func odczytajPamiec(_ tekst: String?) -> Pamiec? {
  guard let tekst, let dane = tekst.data(using: .utf8), let j = try? Json.z(dane), case .obiekt = j,
        let produkty = j["produkty"]?.tablica, let w = j["wygasa"] else { return nil }
  let lista = produkty.compactMap(\.tekst)
  guard lista.count == produkty.count else { return nil }
  if w.jestNull { return Pamiec(produkty: lista, wygasa: nil) }
  guard let v = w.calkowita else { return nil }
  return Pamiec(produkty: lista, wygasa: v)
}

public enum ZrodloPro: Equatable {
  case telefon(pro: Bool, wygasa: Int64?)
  case zegarek([Uprawnienie])
}
/// KP-17: Pro, gdy którekolwiek źródło je potwierdza; kontekst telefonu jak pamięć (okno offline), StoreKit zegarka jak odczyt sklepu.
public func proZegarka(_ zrodla: [ZrodloPro], teraz: Int64) -> Bool {
  zrodla.contains { z in
    switch z {
    case let .telefon(pro, wygasa): return pro && pamiecWazna(wygasa, teraz)
    case let .zegarek(u): return decyzja(.sklep(u), nil, teraz: teraz).dostep
    }
  }
}

extension Uprawnienie {
  public static func z(_ j: Json) throws -> Uprawnienie {
    guard let produkt = j["produkt"]?.tekst, let w = j["wygasa"], let odebrane = j["odebrane"]?.logiczna else { throw BladDanych("uprawnienie: złe dane") }
    let wygasa: Int64?
    if w.jestNull { wygasa = nil } else if let v = w.calkowita { wygasa = v } else { throw BladDanych("uprawnienie: złe wygasa") }
    var karencja: Int64? = nil
    if let k = j["karencjaDo"], let v = k.calkowita { karencja = v } // brak albo nie liczba = bez karencji (ADR-0010)
    return Uprawnienie(produkt: produkt, wygasa: wygasa, odebrane: odebrane, karencjaDo: karencja)
  }
}
extension ZrodloPro {
  public static func z(_ j: Json) throws -> ZrodloPro {
    switch j["zrodlo"]?.tekst {
    case "telefon":
      guard let pro = j["pro"]?.logiczna, let w = j["wygasa"] else { throw BladDanych("proZegarka: zły kontekst telefonu") }
      if w.jestNull { return .telefon(pro: pro, wygasa: nil) }
      guard let v = w.calkowita else { throw BladDanych("proZegarka: zły kontekst telefonu") }
      return .telefon(pro: pro, wygasa: v)
    case "zegarek":
      guard let u = j["uprawnienia"]?.tablica else { throw BladDanych("proZegarka: nieznane źródło") }
      return .zegarek(try u.map(Uprawnienie.z))
    default: throw BladDanych("proZegarka: nieznane źródło")
    }
  }
}
