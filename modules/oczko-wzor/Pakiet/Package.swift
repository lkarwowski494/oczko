// swift-tools-version:5.9
import PackageDescription

// Logika czysta modułu `oczko-wzor` i celu `targets/share` (moduly.md „Kontrakt partii 6”; P-218 Q2a, P-220 R1a, P-243): polityka płótna,
// papier wydruku, źródło konwersji, wynik JSON dla JS, migawka projektów, zlecenie skrzynki importu. Bez UIKit/PDFKit/PencilKit — `swift test`
// na macOS i Linuksie. Moduł Expo kompiluje te źródła wprost (podspec `source_files`); cel share dostaje kopie (scripts/natywne/kopie.json).
// Uruchomienie: cd modules/oczko-wzor/Pakiet && swift test
let package = Package(
  name: "OczkoWzorLogika",
  platforms: [.macOS(.v14)],
  products: [.library(name: "OczkoWzorLogika", targets: ["OczkoWzorLogika"])],
  targets: [
    .target(name: "OczkoWzorLogika", path: "Sources/OczkoWzorLogika"),
    .testTarget(name: "OczkoWzorLogikaTests", dependencies: ["OczkoWzorLogika"], path: "Tests/OczkoWzorLogikaTests"),
  ]
)
