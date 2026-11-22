// Przypomnienie „co N rzędów, M razy, od rzędu s” (RD-13, F-06) po stronie Swift: pas na ekranie blokady, w Dynamic Island i na zegarku
// (P-158, P-161, P-180). Ta sama reguła co `przypomnienieChwili` w src/domena/przypomnienia.ts, testy na wektorach RD-13 z tests/wektory/brd.json.
// Pas to stan, bez sygnału (sygnał przy zmianie liczy tylko aplikacja, `sygnalZmiany`). Kopie w celach: scripts/natywne/kopie.json.
import Foundation

public struct ChwilaPrzypomnienia: Equatable {
  public let licznik: Int; public let rzadPasa: Int?; public let k: Int?
  public init(licznik: Int, rzadPasa: Int?, k: Int?) { self.licznik = licznik; self.rzadPasa = rzadPasa; self.k = k }
}
public struct BladDanychPrzypomnienia: Error, Equatable {}
/// Pas pod liczbą: pierwsze przypomnienie z pasem w kolejności stanu; `wiecej` = pozostałe z pasem w tym samym rzędzie (P-158 (1.1a)).
public struct PasPrzypomnienia: Equatable {
  public let rzad: Int; public let tekst: String; public let k: Int; public let razy: Int; public let wiecej: Int
  public init(rzad: Int, tekst: String, k: Int, razy: Int, wiecej: Int) { self.rzad = rzad; self.tekst = tekst; self.k = k; self.razy = razy; self.wiecej = wiecej }
}

/// Rząd w robocie = skończone + 1 w obu trybach licznika (P-161; `dziergany` w src/domena/licznik.ts) — „Now row {{n}}”, etykiety +1.
public func rzadWRobocie(_ s: StanEkranuBlokady) -> Int { s.wartosc + 1 }

private func wyzwala(_ r: Int, _ p: PrzypomnienieStanu) -> Bool { r >= p.od && (r - p.od) % p.co == 0 && (r - p.od) / p.co < p.razy }

/// RD-13 (W11–W19): pas dotyczy rzędu w robocie w = skończone + 1; liczba na liczniku = skończone albo w (tryb „rząd w trakcie”); k = które powtórzenie.
public func przypomnienieChwili(skonczone: Int, znaczenie: StanEkranuBlokady.Znaczenie, plan: PrzypomnienieStanu) throws -> ChwilaPrzypomnienia {
  guard plan.co >= 1, skonczone >= 0 else { throw BladDanychPrzypomnienia() } // RD-13-W5 (N < 1), RD-13-W19 (skończone < 0)
  let w = skonczone + 1
  let pas = wyzwala(w, plan)
  return ChwilaPrzypomnienia(licznik: znaczenie == .w_trakcie ? w : skonczone, rzadPasa: pas ? w : nil, k: pas ? (w - plan.od) / plan.co + 1 : nil)
}

/// Pas dla stanu ekranu blokady (jak `pas` w src/przypadki-uzycia/widok-licznika.ts); plan z błędem danych jest pomijany.
public func pasPrzypomnienia(_ s: StanEkranuBlokady) -> PasPrzypomnienia? {
  let z = s.przypomnienia.compactMap { p -> (PrzypomnienieStanu, ChwilaPrzypomnienia)? in
    guard let c = try? przypomnienieChwili(skonczone: s.wartosc, znaczenie: s.znaczenie, plan: p), c.k != nil else { return nil }
    return (p, c)
  }
  guard let (p, c) = z.first, let rzad = c.rzadPasa, let k = c.k else { return nil }
  return PasPrzypomnienia(rzad: rzad, tekst: p.tekst, k: k, razy: p.razy, wiecej: z.count - 1)
}
