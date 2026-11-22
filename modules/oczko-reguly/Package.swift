// swift-tools-version:5.9
import PackageDescription

// Reguły wspólne dla intencji ekranu blokady i zegarka (ADR-0007 uzupełnienie, Z07-12) oraz rdzeń pliku dziennika +1 (ADR-0008 (8A/8S/8R)),
// bez UIKit, ActivityKit i WatchConnectivity — testowane `swift test` na macOS bez symulatora (P-129 Q2a, jak Trening `targets/Package.swift`)
// na tych samych plikach JSON co Node. Cele natywne (3C) dostają kopie tych źródeł z kontrolą identyczności (scripts/natywne/kontrola-swift.mjs).
// Uruchomienie: cd modules/oczko-reguly && swift test
let package = Package(
  name: "OczkoReguly",
  platforms: [.macOS(.v14)], // testy na macOS; iOS 18 / watchOS 10 (zegarek, od 2026-11-15) ustawiają cele Xcode (ADR-0006)
  products: [
    .library(name: "OczkoReguly", targets: ["OczkoReguly"]),
    .library(name: "OczkoDziennik", targets: ["OczkoDziennik"]),
  ],
  targets: [
    .target(name: "OczkoReguly", path: "Sources/OczkoReguly"),
    .target(name: "OczkoDziennik", dependencies: ["OczkoReguly"], path: "Sources/OczkoDziennik"),
    .testTarget(name: "OczkoRegulyTests", dependencies: ["OczkoReguly", "OczkoDziennik"], path: "Tests/OczkoRegulyTests"),
  ]
)
