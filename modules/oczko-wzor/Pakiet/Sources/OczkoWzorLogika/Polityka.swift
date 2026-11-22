// Polityka płótna PencilKit na stronie wzoru (ADR-0012; P-218 Q2a; P-220 W5a). Wynik liczy JS (`politykaPlotna`, src/domena/rysik.ts);
// widok tylko go stosuje: `wylaczone` = płótno bez interakcji (palec przewija PDF), `dowolne` = `.anyInput`, `tylkoRysik` = `.pencilOnly`.
public enum PolitykaPlotna: String, Sendable {
  case wylaczone, dowolne, tylkoRysik
}
public enum NarzedzieWzoru: String, Sendable {
  case brak, zakreslacz, pioro, gumka
}
public struct UstawieniePlotna: Equatable, Sendable {
  public let interakcja: Bool
  public let tylkoRysik: Bool
  public init(interakcja: Bool, tylkoRysik: Bool) { self.interakcja = interakcja; self.tylkoRysik = tylkoRysik }
}
public func ustawieniePlotna(_ p: PolitykaPlotna) -> UstawieniePlotna {
  switch p {
  case .wylaczone: return UstawieniePlotna(interakcja: false, tylkoRysik: false)
  case .dowolne: return UstawieniePlotna(interakcja: true, tylkoRysik: false)
  case .tylkoRysik: return UstawieniePlotna(interakcja: true, tylkoRysik: true)
  }
}
