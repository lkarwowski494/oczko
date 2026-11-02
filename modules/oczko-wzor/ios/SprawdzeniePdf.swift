// Pełne otwarcie PDF przed zapisem wzoru (moduly.md „Kontrakt partii 6”, `sprawdzPdf`; BR-WZR-001 S2, BR-WZR-007 S3): zastępuje kontrolę nagłówka
// i `%%EOF` z TS. Nie otwiera się albo zaszyfrowany bez hasła → `uszkodzony`; 0 stron albo bez tekstu i obrazu → `pusty`.
import Foundation
import PDFKit
import UIKit

enum SprawdzeniePdf {
  static func sprawdz(_ url: URL) -> Result<Int, PowodWzoru> {
    guard let d = PDFDocument(url: url) else { return .failure(.uszkodzony) }
    if d.isLocked { return .failure(.uszkodzony) }
    guard d.pageCount > 0 else { return .failure(.pusty) }
    for i in 0..<d.pageCount {
      guard let s = d.page(at: i) else { continue }
      if let t = s.string, !t.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return .success(d.pageCount) }
    }
    // Bez tekstu (skan, zdjęcie): strona nie jest jednolicie biała w miniaturze — uproszczenie [OCENA 08] zamiast analizy obiektów XObject.
    for i in 0..<min(d.pageCount, 5) {
      if let s = d.page(at: i), !jednolicieBiala(s.thumbnail(of: CGSize(width: 48, height: 48), for: .mediaBox)) { return .success(d.pageCount) }
    }
    return .failure(.pusty)
  }

  static func jednolicieBiala(_ obraz: UIImage) -> Bool {
    guard let cg = obraz.cgImage else { return true }
    let w = cg.width, h = cg.height
    var piksele = [UInt8](repeating: 0, count: w * h * 4)
    guard let ctx = CGContext(data: &piksele, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                              space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return true }
    ctx.setFillColor(UIColor.white.cgColor)
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
    for i in stride(from: 0, to: piksele.count, by: 4) where piksele[i] < 240 || piksele[i + 1] < 240 || piksele[i + 2] < 240 { return false }
    return true
  }
}

extension SprawdzeniePdf {
  /// E2-A5 (W1-A, P-282 wariant A; zrzut 53 z E2 #135 potwierdził pustą stronę 2 po wydruku WKWebView): przycina końcowe strony bez tekstu i jednolicie białe,
  /// nigdy do zera stron; pusta strona w środku i strona z treścią na końcu zostają (treść bez zmian, P-218 (2)). Plik jest nadpisywany przyciętą kopią
  /// (zapis obok i podmiana, bo dokument otwarty z tego pliku nie nadaje się do zapisu w to samo miejsce). Zwraca liczbę stron pliku po operacji;
  /// przy błędzie zapisu plik zostaje bez zmian i wynik to liczba stron sprzed przycięcia. Test: TestyOknaMaszyn `testW1PustaStronaNaKoncu`.
  @discardableResult
  static func bezPustychStronNaKoncu(_ url: URL) -> Int {
    guard let d = PDFDocument(url: url) else { return 0 }
    let przed = d.pageCount
    if d.isLocked { return przed }
    var zostaje = przed
    while zostaje > 1, let s = d.page(at: zostaje - 1), stronaPusta(s) { zostaje -= 1 }
    guard zostaje < przed else { return przed }
    for i in stride(from: przed - 1, through: zostaje, by: -1) { d.removePage(at: i) }
    let obok = url.deletingLastPathComponent().appendingPathComponent(".przyciete-\(UUID().uuidString).pdf")
    guard d.write(to: obok) else { return przed }
    do { _ = try FileManager.default.replaceItemAt(url, withItemAt: obok) } catch {
      try? FileManager.default.removeItem(at: obok)
      return przed
    }
    return zostaje
  }

  /// Bez tekstu i z jednolicie białą miniaturą (jak w `sprawdz`); strona z samym obrazem nie jest pusta.
  static func stronaPusta(_ s: PDFPage) -> Bool {
    if let t = s.string, !t.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return false }
    return jednolicieBiala(s.thumbnail(of: CGSize(width: 96, height: 96), for: .mediaBox))
  }
}

/// Miniatura pierwszej strony do wiersza wzoru (design-spec W8; plan 1.1 pkt 7): PNG o szerokości `szerokoscPt` × skala, proporcje strony
/// (z obrotem zapisanym w PDF; obrót użytkownika `wzor.obroty` nie — nazwane w partia-6.md). Plik pochodny (pamięć podręczna), nie dane wzoru.
enum Miniatura {
  static func zapisz(pdf: URL, cel: URL, szerokoscPt: CGFloat, skala: CGFloat = 2) -> Result<Void, PowodWzoru> {
    guard let d = PDFDocument(url: pdf), !d.isLocked, let s = d.page(at: 0) else { return .failure(.uszkodzony) }
    let r = s.bounds(for: .mediaBox)
    let obrocona = s.rotation % 180 != 0
    let (w, h) = obrocona ? (r.height, r.width) : (r.width, r.height)
    guard w > 0, h > 0 else { return .failure(.uszkodzony) }
    let szer = szerokoscPt * skala
    guard let png = s.thumbnail(of: CGSize(width: szer, height: szer * h / w), for: .mediaBox).pngData() else { return .failure(.zapis) }
    do {
      try FileManager.default.createDirectory(at: cel.deletingLastPathComponent(), withIntermediateDirectories: true)
      try png.write(to: cel, options: .atomic)
      return .success(())
    } catch { return .failure(.zapis) }
  }
}
