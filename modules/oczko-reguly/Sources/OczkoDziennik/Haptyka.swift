// Wzorzec haptyki po stuknięciu na zegarku (07-jakosc-005, F-12; ADR-0030 pkt 4, kryterium K-05g; tokeny: docs/design/tokeny.json „haptykaZegarek”).
// Decyzja „jaki wzorzec” to czysta funkcja bez WatchKit; adapter (targets/watch/Aplikacja.swift) tylko mapuje wynik na WKHapticType:
// plus → .click · przypomnienie → .notification · bladZapisu → .retry · blokadaStukniecie → .failure.
// Wejście na rząd z przypomnieniem = ta sama reguła co pas przypomnienia (`pasPrzypomnienia`, RD-13 W11–W19): rząd w robocie po stuknięciu
// ma przypomnienie, a stuknięcie jest +1 (sygnał tylko przy wzroście skończonych, RD-13 W20–W25; −1 to spadek — bez sygnału).
import Foundation
#if canImport(OczkoReguly)
import OczkoReguly
#endif

public enum WzorzecHaptykiZegarka: Equatable {
  case plus, przypomnienie, bladZapisu, blokadaStukniecie
}

/// Co się stało po stuknięciu: decyzja reguł (`WynikIntencji`) albo nieudany zapis do skrzynki zegarka (pełna pamięć, błąd we/wy).
public enum PrzebiegStukniecia {
  case wynik(WynikIntencji)
  case zapisNieudany
}

/// `nil` = bez haptyki (limit dnia i −1 przy zerze nie dają potwierdzenia; stan obecny zegarka). Potwierdzenie (`plus`, `przypomnienie`)
/// tylko po trwałym zapisie — nieudany zapis nigdy nie gra wzorca potwierdzenia (ADR-0009 uzupełnienie pkt 2).
public func wzorzecHaptykiZegarka(_ rodzaj: ZdarzenieWejsciowe.Rodzaj, _ przebieg: PrzebiegStukniecia) -> WzorzecHaptykiZegarka? {
  switch przebieg {
  case .zapisNieudany: return .bladZapisu
  case let .wynik(w):
    switch w {
    case .zablokowany: return .blokadaStukniecie
    case .limit, .bezZmiany: return nil
    case let .zapisz(_, nowy):
      if rodzaj == .plus, pasPrzypomnienia(nowy) != nil { return .przypomnienie }
      return .plus
    }
  }
}
