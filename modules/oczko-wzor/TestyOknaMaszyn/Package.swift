// swift-tools-version:5.9
import PackageDescription

// Eksperymenty W1–W3 (moduly.md „Kontrakt partii 6”; P-261: bez Maca właściciela → CI macOS, krok informacyjny `eksperymenty-wzoru`
// w .github/workflows/jakosc-ios.yml, wynik w artefakcie, bez wpływu na bramkę). Źródła modułu bez Expo (konwersja, sprawdzenie PDF, logika
// Pakiet/) dołączone dowiązaniami z `Zrodla/` — te same pliki co w podzie OczkoWzor, bez kopii. Widok z PencilKit (ExpoView) poza pakietem:
// W2 mierzy sam PDFKit, W3 politykę płótna; dotyk palcem po rysiku = lista „tylko urządzenie” (P-226, docs/programista/partia-6-natywne.md).
// Uruchomienie (macOS): cd modules/oczko-wzor/TestyOknaMaszyn && xcodebuild test -scheme WzorNatywny -destination 'platform=iOS Simulator,name=iPhone 17'
let package = Package(
  name: "OczkoWzorEksperymenty",
  platforms: [.iOS("18.0")], // `.v18` dopiero od PackageDescription 6.0 — przy 5.9 manifest nieważny (przebiegi 121, 123: `xcodebuild -list` bez wyjścia)
  products: [.library(name: "WzorNatywny", targets: ["WzorNatywny"])],
  targets: [
    .target(name: "WzorNatywny", path: "Zrodla"),
    .testTarget(
      name: "OczkoWzorEksperymenty",
      dependencies: ["WzorNatywny"],
      path: "Testy",
      exclude: ["korpus/generuj-korpus.mjs"],
      resources: [.copy("korpus/tekst.docx"), .copy("korpus/tabela.docx"), .copy("korpus/obraz.docx")]
    ),
  ]
)
