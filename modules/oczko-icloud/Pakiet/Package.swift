// swift-tools-version:5.9
import PackageDescription

// Logika czysta modułu `oczko-icloud` (moduly.md „Kontrakt partii 7”): odwzorowanie RekordIcloud (JSON z JS) ↔ CKRecord i tabela pól
// z generatora (scripts/icloud/generuj-schemat-ckdb.mjs → Pola.swift). Bez CKSyncEngine i bez konta — `swift test` na macOS (CloudKit tylko
// jako typy rekordu). Moduł Expo kompiluje te źródła wprost (podspec `source_files`), jak Pakiet partii 6 (oczko-wzor).
// Wektory: wektory.json obok pakietu — ten sam plik sprawdza Jest (tests/domena/icloud/wektory-swift.test.ts).
// Uruchomienie: cd modules/oczko-icloud/Pakiet && swift test
let package = Package(
  name: "OczkoIcloudLogika",
  platforms: [.macOS(.v14)],
  products: [.library(name: "OczkoIcloudLogika", targets: ["OczkoIcloudLogika"])],
  targets: [
    .target(name: "OczkoIcloudLogika", path: "Sources/OczkoIcloudLogika"),
    .testTarget(name: "OczkoIcloudLogikaTests", dependencies: ["OczkoIcloudLogika"], path: "Tests/OczkoIcloudLogikaTests"),
  ]
)
