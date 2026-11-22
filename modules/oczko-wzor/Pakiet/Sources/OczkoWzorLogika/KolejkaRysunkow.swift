// Kolejka zapisu rysunków stron wzoru (M1-084, DEC-31 a; ADR-0012 „najwyżej ostatnia sekunda”, zasada wspólna 10). Widok (WidokWzoru.swift)
// wkłada tu dane rysunku zmienionej strony (`PKDrawing.dataRepresentation()`), a zapis do pliku oczekującego robi przekazana funkcja. Nieudany zapis
// (np. pełny dysk) zostawia dane w kolejce do następnej próby i daje `nieudane`, z których widok wysyła `onBladZapisu` do JS. Zmiana wzoru nie czyści
// kolejki: dane starego wzoru czekają pod JEGO identyfikatorem. Bez UIKit/PencilKit — `swift test` na macOS i Linuksie.
import Foundation

public struct KluczRysunku: Hashable, Comparable, Sendable {
  public let wzorId: String
  public let strona: Int
  public init(wzorId: String, strona: Int) { self.wzorId = wzorId; self.strona = strona }
  public static func < (a: KluczRysunku, b: KluczRysunku) -> Bool { (a.wzorId, a.strona) < (b.wzorId, b.strona) }
}

public struct ZapisanyRysunek: Equatable, Sendable {
  public let wzorId: String
  public let strona: Int
  public let sciezka: String
  public init(wzorId: String, strona: Int, sciezka: String) { self.wzorId = wzorId; self.strona = strona; self.sciezka = sciezka }
}

public struct WynikZapisuRysunkow: Equatable, Sendable {
  public var zapisane: [ZapisanyRysunek] = []
  public var nieudane: [KluczRysunku] = []
  /// Pozycje w kolejce po tej próbie (0 = wszystko zapisane do plików oczekujących).
  public var oczekujace = 0
  public init() {}
}

public final class KolejkaRysunkow {
  private var dane: [KluczRysunku: Data] = [:]
  public init() {}

  public var liczba: Int { dane.count }

  /// Najnowszy rysunek strony zastępuje poprzedni (rysunek strony to całość, nie przyrost).
  public func dodaj(wzorId: String, strona: Int, dane d: Data) {
    dane[KluczRysunku(wzorId: wzorId, strona: strona)] = d
  }

  /// Rysunki wzoru czekające w kolejce (strona → dane): widok nakłada je na rysunki z plików przy otwarciu wzoru.
  public func dane(wzorId: String) -> [Int: Data] {
    Dictionary(uniqueKeysWithValues: dane.filter { $0.key.wzorId == wzorId }.map { ($0.key.strona, $0.value) })
  }

  /// Zapis do katalogu plików oczekujących (JS: `rysunki-wzoru`, odzysk przy otwarciu wzoru). Brak katalogu (prop jeszcze nie ustawiony —
  /// kolejność propsów Expo nieokreślona) → bez próby: plik poza tym katalogiem nie wróciłby w odzysku; dane czekają (przegląd ścieżki wrażliwej, P1).
  public func zapisz(do katalog: URL?, _ zapis: (URL, KluczRysunku, Data) throws -> String) -> WynikZapisuRysunkow {
    guard let k = katalog else { var w = WynikZapisuRysunkow(); w.oczekujace = dane.count; return w }
    return zapisz { klucz, d in try zapis(k, klucz, d) }
  }

  /// Zapis po nałożeniu obu propsów widoku (M1-109: wcześniej bez próby, dane czekają). M1-112: wynik niesie `oczekujace` — liczbę pozycji wciąż
  /// tylko w pamięci, którą widok zwraca z zapisu na żądanie (`zapiszRysunki`, „Wstecz” w JS pyta przy > 0).
  public func zapisz(propsy: PropsyWzoru, _ zapis: (URL, KluczRysunku, Data) throws -> String) -> WynikZapisuRysunkow {
    guard propsy.moznaOproznicKolejke else { var w = WynikZapisuRysunkow(); w.oczekujace = dane.count; return w }
    return zapisz(do: propsy.katalog, zapis)
  }

  /// Próba zapisu każdej pozycji (kolejność: wzorId, strona). `zapis` zwraca ścieżkę pliku albo rzuca błąd.
  public func zapisz(_ zapis: (KluczRysunku, Data) throws -> String) -> WynikZapisuRysunkow {
    var w = WynikZapisuRysunkow()
    for k in dane.keys.sorted() {
      guard let d = dane[k] else { continue }
      guard let sciezka = try? zapis(k, d) else { w.nieudane.append(k); continue } // zostaje w kolejce: następna próba
      dane[k] = nil
      w.zapisane.append(ZapisanyRysunek(wzorId: k.wzorId, strona: k.strona, sciezka: sciezka))
    }
    w.oczekujace = dane.count
    return w
  }
}
