// Most JS ↔ Swift (Expo Modules API, ADR-0007; moduly.md „Kontrakt partii 6”): konwersja na PDF (`naPdf`), pełne otwarcie PDF (`sprawdzPdf`),
// skaner stron (`skanuj`) i widok wzoru `WidokWzoru` (PDFView + PencilKit na stronach). Wyniki funkcji jako JSON (`wynikOk` / `wynikBlad`,
// Pakiet/Sources/OczkoWzorLogika) — adapter TS: src/platforma/wzor.ts.
import ExpoModulesCore
import Foundation
import UIKit
import VisionKit

struct RysunekStrony: Record {
  @Field var strona: Int = 0
  @Field var plik: String = ""
}
struct ObrotStrony: Record {
  @Field var strona: Int = 0
  @Field var kat: Int = 0
}
/// Dokument wzoru jednym propsem (przegląd 2026-10-26: kolejność propsów nieokreślona; zmiana wzoru najpierw zapisuje stary).
struct DokumentProp: Record {
  @Field var wzorId: String = ""
  @Field var plikPdf: String = ""
  @Field var rysunki: [RysunekStrony] = []
  @Field var obroty: [ObrotStrony] = []
}
struct ZnacznikProp: Record {
  @Field var strona: Int = 0
  @Field var y: Double = 0
  @Field var wysokosc: Double = 0
  @Field var pozaStrona: Bool = false
  @Field var przedSchematem: Bool = false
  @Field var kierunek: Int = 1
  @Field var etykieta: String = ""
  @Field var napis: String = ""
  @Field var akcjaNastepnaStrona: String = ""
}

/// Chip notatki na stronie wzoru (F-56, P-330 2A; `NotatkaNatywna` w index.ts): ✎ + etykieta przy lewej krawędzi, na wysokości rzędu.
struct NotatkaProp: Record {
  @Field var id: String = ""
  @Field var strona: Int = 0
  @Field var y: Double = 0
  @Field var wysokosc: Double = 0
  @Field var etykieta: String = ""
  @Field var a11y: String = ""
}

public class OczkoWzorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OczkoWzor")

    AsyncFunction("naPdf") { (zrodloJson: String) async -> String in
      let zrodlo: ZrodloKonwersji
      do { zrodlo = try zrodloKonwersji(zrodloJson) } catch { return wynikBlad(.bledneDane) }
      return await Konwersja.naPdf(zrodlo)
    }
    AsyncFunction("sprawdzPdf") { (sciezka: String) -> String in
      switch SprawdzeniePdf.sprawdz(URL(fileURLWithPath: sciezka)) {
      case let .success(strony): return wynikOk(["strony": strony])
      case let .failure(p): return wynikBlad(p)
      }
    }
    Function("skanerDostepny") { () -> Bool in VNDocumentCameraViewController.isSupported } // runOnQueue jest tylko dla AsyncFunction; odczyt właściwości urządzenia (CI 2026-10-27)
    AsyncFunction("skanuj") { () async -> String in await Skaner.skanuj() }
    // P-285 (1) B: „Paste” w arkuszu linku — adres albo tekst ze schowka (iOS pokazuje systemową zgodę na wklejenie); pusty = nil.
    AsyncFunction("wklej") { () -> String? in UIPasteboard.general.url?.absoluteString ?? UIPasteboard.general.string }.runOnQueue(.main)
    // Plan 1.1 pkt 7: miniatura pierwszej strony (PNG) do pamięci podręcznej JS.
    AsyncFunction("miniatura") { (pdf: String, cel: String, szerokoscPt: Double) -> String in
      switch Miniatura.zapisz(pdf: URL(fileURLWithPath: pdf), cel: URL(fileURLWithPath: cel), szerokoscPt: CGFloat(szerokoscPt)) {
      case .success: return wynikOk([:])
      case let .failure(p): return wynikBlad(p)
      }
    }

    View(WidokWzoru.self) {
      Events("onRysunek", "onStukniecie", "onStrona", "onPierwszyRysik", "onZakreslenia", "onNotatka", "onZnacznik", "onZnacznikKrok", "onNastepnaStrona")
      Prop("dokument") { (v: WidokWzoru, d: DokumentProp) in
        v.ustawDokument(wzorId: d.wzorId, plikPdf: d.plikPdf, rysunki: d.rysunki.map { ($0.strona, $0.plik) },
                        obroty: Dictionary(d.obroty.map { ($0.strona, $0.kat) }, uniquingKeysWith: { a, _ in a }))
      }
      Prop("katalogRysunkow") { (v: WidokWzoru, k: String) in v.ustawKatalogRysunkow(k) }
      Prop("strona") { (v: WidokWzoru, s: Int) in v.przejdzDoStrony(s) }
      Prop("znacznik") { (v: WidokWzoru, z: ZnacznikProp?) in
        v.ustawZnacznik(z.map { Znacznik(strona: $0.strona, y: $0.y, wysokosc: $0.wysokosc, pozaStrona: $0.pozaStrona, kierunek: $0.kierunek, etykieta: $0.etykieta, napis: $0.napis, przedSchematem: $0.przedSchematem, akcjaNastepnaStrona: $0.akcjaNastepnaStrona) })
      }
      Prop("notatki") { (v: WidokWzoru, n: [NotatkaProp]) in
        v.ustawNotatki(n.map { ChipNotatkiNatywny(id: $0.id, strona: $0.strona, y: $0.y, wysokosc: $0.wysokosc, etykieta: $0.etykieta, a11y: $0.a11y) })
      }
      Prop("narzedzie") { (v: WidokWzoru, n: String) in v.ustawNarzedzie(NarzedzieWzoru(rawValue: n) ?? .brak) }
      Prop("polityka") { (v: WidokWzoru, p: String) in v.ustawPolityke(PolitykaPlotna(rawValue: p) ?? .wylaczone) }
      Prop("cofnij") { (v: WidokWzoru, n: Int) in v.cofnijDo(n) }
    }
  }
}
