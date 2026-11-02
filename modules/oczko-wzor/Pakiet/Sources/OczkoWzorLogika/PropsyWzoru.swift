// Nakładanie propsów widoku wzoru a zapis kolejki rysunków (M1-audytor-generalny-109, DEC-32 a). Expo nakłada propsy w kolejności słownika
// (expo-modules-core 57.0.23 `ios/Fabric/ExpoFabricView.swift:88`, losowej na instancję), więc `katalogRysunkow` bywa przed `dokument`.
// Reguła: kolejkę wolno opróżnić (plik oczekujący → `onRysunek` → zapis całej strony w bazie) dopiero po nałożeniu obu propsów, a widok bierze
// rysunki wzoru z kolejki, zanim ją opróżni. Inaczej ekran startuje ze starszych `dokument.rysunki` z JS, a następna kreska nadpisuje stronę
// bez kresek odzyskanych z kolejki (zasada wspólna 10, ADR-0012). Bez UIKit — `swift test` na macOS i Linuksie.
import Foundation

public struct PropsyWzoru: Equatable, Sendable {
  public private(set) var wzorId = ""
  public private(set) var katalog: URL?
  public init() {}

  /// Oba propsy nałożone (wzór i katalog plików oczekujących): wolno zapisać kolejkę.
  public var moznaOproznicKolejke: Bool { !wzorId.isEmpty && katalog != nil }

  /// Prop `katalogRysunkow` (pusty = brak). `true`: opróżnij kolejkę teraz (wzór ustawiony wcześniej).
  public mutating func ustawKatalog(_ sciezka: String) -> Bool {
    katalog = sciezka.isEmpty ? nil : URL(fileURLWithPath: sciezka, isDirectory: true)
    return moznaOproznicKolejke
  }

  /// Nowy wzór z propu `dokument`. `zKolejki`: rysunki tego wzoru czekające w kolejce, odczytane przed jej opróżnieniem — nowsze niż pliki z JS,
  /// więc widok nakłada je na rysunki z JS. `oproznij`: katalog był ustawiony wcześniej, więc widok opróżnia kolejkę po wczytaniu rysunków.
  public mutating func otworzWzor(_ id: String, kolejka: KolejkaRysunkow) -> (zKolejki: [Int: Data], oproznij: Bool) {
    let zKolejki = kolejka.dane(wzorId: id)
    wzorId = id
    return (zKolejki, moznaOproznicKolejke)
  }
}
