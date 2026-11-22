// Reguła darmowego limitu dni z robótką w Swift (ADR-0007, ADR-0008 (6), ADR-0009): port 1:1 docs/monetyzacja/limit.mjs (startDnia,
// wolaStraznika, mozeZaczacDzien); wyrocznia: docs/monetyzacja/wektory-limitu.json (X-RG-01). Stałe z Stale.swift (generator z konfiguracja.ts).
import Foundation

public struct DzienLimitu: Equatable {
  public let data: String // RRRR-MM-DD (RD-16)
  public let pro: Bool
  public init(data: String, pro: Bool) { self.data = data; self.pro = pro }
}
public struct WejscieDnia: Equatable {
  public let dni: [DzienLimitu]
  public let dzis: String
  public let teraz: Int64
  public let ostatniPlus: Int64?
  public let pro: Bool
  public var limit: Int = Stale.limitDniWMiesiacu
  public var przerwa: Int64 = Stale.przerwaNowegoDniaMs
  public init(dni: [DzienLimitu], dzis: String, teraz: Int64, ostatniPlus: Int64?, pro: Bool) {
    self.dni = dni; self.dzis = dzis; self.teraz = teraz; self.ostatniPlus = ostatniPlus; self.pro = pro
  }
}
public struct WynikStartu: Equatable {
  public let dozwolone: Bool
  public let zapis: DzienLimitu?
  public let zostalo: Int
  public init(dozwolone: Bool, zapis: DzienLimitu?, zostalo: Int) { self.dozwolone = dozwolone; self.zapis = zapis; self.zostalo = zostalo }
}
public struct StanZawczasu: Equatable {
  public let limitZawczasu: Bool
  public let ostatniDarmowy: Bool
  public let zostalo: Int
  public init(limitZawczasu: Bool, ostatniDarmowy: Bool, zostalo: Int) { self.limitZawczasu = limitZawczasu; self.ostatniDarmowy = ostatniDarmowy; self.zostalo = zostalo }
}

func jestData(_ s: String) -> Bool {
  let b = Array(s.utf8)
  guard b.count == 10, b[4] == 0x2D, b[7] == 0x2D else { return false }
  return b.enumerated().allSatisfy { i, c in i == 4 || i == 7 || (0x30...0x39).contains(c) }
}

/// D5 (P-103 (1a), (6a)): darmowe dni miesiąca po różnych datach; data jest dniem z Pro, gdy którykolwiek jej wpis ma pro.
func darmoweDni(_ lista: [DzienLimitu], _ miesiac: String) -> Int {
  let zPro = Set(lista.filter(\.pro).map(\.data))
  return Set(lista.filter { $0.data.hasPrefix(miesiac) && !zPro.contains($0.data) }.map(\.data)).count
}

/// P-067: które zdarzenia zaczynają dzień (+1 i wpisanie); zerowanie, −1 i edycja historii to korekty.
public func wolaStraznika(rodzaj: String) throws -> Bool {
  switch rodzaj {
  case "plus", "wpisanie": return true
  case "zerowanie", "minus", "edycja-historii": return false
  default: throw BladDanych("wolaStraznika: nieznany rodzaj zdarzenia \(rodzaj)")
  }
}

/// `przerwaKrotsza`: porównanie odstępu z przerwą (domyślnie `<`, L-04); parametr tylko dla testu siły X-RG-03 (mutant `<=`).
public func startDnia(_ w: WejscieDnia, przerwaKrotsza: (Int64, Int64) -> Bool = (<)) throws -> WynikStartu {
  guard jestData(w.dzis) else { throw BladDanych("startDnia: złe dane wejściowe") }
  let miesiac = String(w.dzis.prefix(7))
  func wynik(_ dozwolone: Bool, _ zapis: DzienLimitu?) -> WynikStartu {
    let po = zapis.map { w.dni + [$0] } ?? w.dni
    return WynikStartu(dozwolone: dozwolone, zapis: zapis, zostalo: max(0, w.limit - darmoweDni(po, miesiac)))
  }
  if let o = w.ostatniPlus, w.teraz - o >= 0, przerwaKrotsza(w.teraz - o, w.przerwa) { return wynik(true, nil) } // L-04: praca w toku
  if w.dni.contains(where: { $0.data == w.dzis }) { return wynik(true, nil) } // L-02, L-06, L-12: dzień już policzony
  if w.pro { return wynik(true, DzienLimitu(data: w.dzis, pro: true)) }
  if darmoweDni(w.dni, miesiac) < w.limit { return wynik(true, DzienLimitu(data: w.dzis, pro: false)) }
  return wynik(false, nil) // L-03: na limicie
}

/// P-065 (1a), (2a): stan zawczasu — ta sama reguła co startDnia, bez zapisu.
public func mozeZaczacDzien(_ w: WejscieDnia) throws -> StanZawczasu {
  let start = try startDnia(w)
  let zostalo = max(0, w.limit - darmoweDni(w.dni, String(w.dzis.prefix(7))))
  return StanZawczasu(limitZawczasu: !start.dozwolone, ostatniDarmowy: !w.pro && zostalo == 1, zostalo: zostalo)
}

extension WejscieDnia {
  /// Granica z zewnętrzem: wejście z JSON (wektory, stan Live Activity v2). Zły typ albo brak pola = BladDanych.
  public static func z(_ j: Json) throws -> WejscieDnia {
    guard let dni = j["dni"]?.tablica, let dzis = j["dzis"]?.tekst, let teraz = j["teraz"]?.calkowita, let pro = j["pro"]?.logiczna,
          let o = j["ostatniPlus"] else { throw BladDanych("startDnia: złe dane wejściowe") }
    let ostatni: Int64?
    if o.jestNull { ostatni = nil } else if let v = o.calkowita { ostatni = v } else { throw BladDanych("startDnia: złe ostatniPlus") }
    let lista = try dni.map { d -> DzienLimitu in
      guard let data = d["data"]?.tekst, jestData(data), let p = d["pro"]?.logiczna else { throw BladDanych("startDnia: zła lista dni") }
      return DzienLimitu(data: data, pro: p)
    }
    var w = WejscieDnia(dni: lista, dzis: dzis, teraz: teraz, ostatniPlus: ostatni, pro: pro)
    if let l = j["limit"] { guard let v = l.calkowita else { throw BladDanych("startDnia: zły limit") }; w.limit = Int(v) }
    if let p = j["przerwa"] { guard let v = p.calkowita else { throw BladDanych("startDnia: zła przerwa") }; w.przerwa = v }
    return w
  }
}
