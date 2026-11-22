// Eksperymenty okna maszyn W1–W3 (moduly.md „Kontrakt partii 6”, P-187; P-261: CI macOS, krok informacyjny; opis: docs/programista/partia-6-natywne.md).
// Wiersze „W1 …”, „W2 …”, „W3 …” w logu trafiają do podsumowania przebiegu (jakosc-ios.yml, zadanie `eksperymenty-wzoru`).
// W1: .docx z korpusu (tekst, tabela, obraz) → PDF: plik się otwiera, ≥ 1 strona, tekst obecny (obraz: strona nie jest pusta). Porażka W1 = Word
//     w podglądzie zastępczym 5a (`wzor.pdf_sha256 = NULL`) — decyzja koordynatora po wyniku.
// W2: PDF ≈ 100 MB / 300 stron w PDFView: czas otwarcia i przejścia na ostatnią stronę, przyrost pamięci procesu (phys_footprint) [POMIAR na
//     symulatorze; płynność przewijania na iPadzie — lista „tylko urządzenie”].
// W3: `pencilOnly` — XCTest nie wytwarza syntetycznego dotyku palcem w PKCanvasView (brak publicznego API UITouch), więc test sprawdza politykę
//     płótna po pierwszym rysiku (drawingPolicy == .pencilOnly); przeciągnięcie palcem bez zmiany `drawing.strokes.count` — lista urządzenia (P-226).
import Darwin
import PDFKit
import PencilKit
import XCTest
@testable import WzorNatywny

private func pamiecMB() -> Double {
  var info = task_vm_info_data_t()
  var n = mach_msg_type_number_t(MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<integer_t>.size)
  let kr = withUnsafeMutablePointer(to: &info) { $0.withMemoryRebound(to: integer_t.self, capacity: Int(n)) { task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &n) } }
  return kr == KERN_SUCCESS ? Double(info.phys_footprint) / 1_048_576 : -1
}

final class EksperymentyTests: XCTestCase {
  private func zasob(_ nazwa: String) throws -> URL {
    try XCTUnwrap(Bundle.module.url(forResource: nazwa, withExtension: "docx"), "korpus: node Testy/korpus/generuj-korpus.mjs")
  }
  private func wynik(_ json: String) throws -> [String: Any] {
    try XCTUnwrap(JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
  }

  @MainActor func testW1WordNaPdf() async throws {
    for nazwa in ["tekst", "tabela", "obraz"] {
      let w = try wynik(await Konwersja.naPdf(.word(try zasob(nazwa))))
      print("W1 \(nazwa): wynik \(w)")
      XCTAssertEqual(w["ok"] as? Bool, true, "\(nazwa): \(w)")
      guard let s = w["sciezka"] as? String, let d = PDFDocument(url: URL(fileURLWithPath: s)) else { XCTFail("\(nazwa): brak PDF"); continue }
      XCTAssertGreaterThanOrEqual(d.pageCount, 1, nazwa)
      if nazwa != "obraz" { XCTAssertFalse((d.string ?? "").isEmpty, "\(nazwa): brak tekstu") }
      print("W1 \(nazwa): strony \(d.pageCount), znaki \(d.string?.count ?? 0)")
    }
  }

  @MainActor func testW1StronaBezSieciToBrakSieci() async throws {
    let w = try wynik(await Konwersja.naPdf(.adres(URL(string: "https://nie-istnieje.invalid/wzor")!)))
    print("W1 adres bez sieci: \(w)")
    XCTAssertEqual(w["powod"] as? String, "brak_sieci")
  }

  @MainActor func testW2DuzyPdf() throws {
    let cel = FileManager.default.temporaryDirectory.appendingPathComponent("w2-300.pdf")
    let r = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 612, height: 792))
    try r.writePDF(to: cel) { ctx in
      for i in 0..<300 {
        ctx.beginPage()
        ("Row \(i + 1)" as NSString).draw(at: CGPoint(x: 72, y: 72), withAttributes: [.font: UIFont.systemFont(ofSize: 24)])
        // szum 290 × 290 RGBA (ok. 330 KB, nie do skompresowania) na stronę ≈ 100 MB pliku: obraz jak skan
        var szum = (0..<(290 * 290 * 4)).map { _ in UInt8.random(in: 0...255) }
        let b = CGContext(data: &szum, width: 290, height: 290, bitsPerComponent: 8, bytesPerRow: 290 * 4, space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
        if let o = b?.makeImage() { UIImage(cgImage: o).draw(in: CGRect(x: 72, y: 120, width: 468, height: 468)) }
      }
    }
    let rozmiar = (try FileManager.default.attributesOfItem(atPath: cel.path)[.size] as? NSNumber)?.intValue ?? 0
    XCTAssertEqual(SprawdzeniePdf.sprawdz(cel), .success(300))
    let przed = pamiecMB(), t0 = Date()
    let okno = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
    let pdf = PDFView(frame: okno.bounds)
    okno.addSubview(pdf); okno.isHidden = false
    pdf.autoScales = true
    pdf.document = try XCTUnwrap(PDFDocument(url: cel))
    pdf.layoutIfNeeded()
    let otwarcie = Date().timeIntervalSince(t0)
    pdf.go(to: try XCTUnwrap(pdf.document?.page(at: 299)))
    pdf.layoutIfNeeded()
    RunLoop.main.run(until: Date().addingTimeInterval(1)) // rysowanie kafelków strony
    let razem = Date().timeIntervalSince(t0)
    XCTAssertEqual(pdf.currentPage?.pageRef?.pageNumber, 300)
    print(String(format: "W2: plik %.1f MB, otwarcie %.2f s, do strony 300 %.2f s, pamięć +%.1f MB (przed %.1f MB)",
                 Double(rozmiar) / 1_048_576, otwarcie, razem, pamiecMB() - przed, przed))
  }

  @MainActor func testW3PolitykaPoPierwszymRysiku() {
    let c = PKCanvasView()
    let u = ustawieniePlotna(.tylkoRysik)
    c.isUserInteractionEnabled = u.interakcja
    c.drawingPolicy = u.tylkoRysik ? .pencilOnly : .anyInput
    XCTAssertEqual(c.drawingPolicy, .pencilOnly)
    XCTAssertEqual(c.drawing.strokes.count, 0)
    let wyl = ustawieniePlotna(.wylaczone)
    c.isUserInteractionEnabled = wyl.interakcja
    XCTAssertFalse(c.isUserInteractionEnabled) // bez narzędzia palec przewija PDF (BR-WZR-008 S3)
    print("W3: tylkoRysik → .pencilOnly, wylaczone → bez interakcji; dotyk palcem po rysiku: lista „tylko urządzenie”")
  }

  /// Pusta strona 2 po wydruku (przebiegi 121/123, scen. 25: „2 pages” przy 3 wierszach) — wariant (a): końcowe jednolicie białe strony przycięte,
  /// nigdy do zera stron; strona z treścią na końcu zostaje. Bez WebKit (sam PDFKit), więc działa w xctest pakietu.
  func testW1PustaStronaNaKoncu() throws {
    // E2-A5 (P-282 wariant A): przycinanie włączone w `Konwersja.naPdf` dla Worda, więc oczekiwana porażka zdjęta.
    func pdf(_ strony: [Bool]) throws -> URL { // true = z tekstem
      let cel = FileManager.default.temporaryDirectory.appendingPathComponent("w1-pusta-\(UUID().uuidString).pdf")
      try UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 612, height: 792)).writePDF(to: cel) { ctx in
        for zTekstem in strony {
          ctx.beginPage()
          if zTekstem { ("Row 1: knit across." as NSString).draw(at: CGPoint(x: 72, y: 72), withAttributes: [.font: UIFont.systemFont(ofSize: 12)]) }
        }
      }
      return cel
    }
    XCTAssertEqual(SprawdzeniePdf.bezPustychStronNaKoncu(try pdf([true, false])), 1)
    XCTAssertEqual(SprawdzeniePdf.bezPustychStronNaKoncu(try pdf([true, false, false])), 1)
    XCTAssertEqual(SprawdzeniePdf.bezPustychStronNaKoncu(try pdf([true, false, true])), 3) // pusta w środku zostaje (treść bez zmian, P-218 (2))
    XCTAssertEqual(SprawdzeniePdf.bezPustychStronNaKoncu(try pdf([false])), 1)            // nigdy zero stron
    let u = try pdf([true, false])
    _ = SprawdzeniePdf.bezPustychStronNaKoncu(u)
    XCTAssertEqual(PDFDocument(url: u)?.pageCount, 1) // plik zapisany po przycięciu
    print("W1 pusta strona: przycięcie końcowych pustych stron sprawdzone")
  }

  /// Plan 1.1 pkt 7: miniatura pierwszej strony — PNG o szerokości 96 pt × 2, proporcje strony; uszkodzony plik → .uszkodzony.
  func testMiniaturaPierwszejStrony() throws {
    let pdf = FileManager.default.temporaryDirectory.appendingPathComponent("mini-\(UUID().uuidString).pdf")
    try UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 612, height: 792)).writePDF(to: pdf) { ctx in
      ctx.beginPage(); ("Row 1" as NSString).draw(at: CGPoint(x: 72, y: 72), withAttributes: [.font: UIFont.systemFont(ofSize: 24)])
    }
    let cel = FileManager.default.temporaryDirectory.appendingPathComponent("miniatury/\(UUID().uuidString).png")
    if case let .failure(p) = Miniatura.zapisz(pdf: pdf, cel: cel, szerokoscPt: 96) { XCTFail("miniatura: \(p)") }
    let obraz = try XCTUnwrap(UIImage(contentsOfFile: cel.path))
    XCTAssertEqual(obraz.size.width * obraz.scale, 192, accuracy: 2)
    XCTAssertEqual(obraz.size.height / obraz.size.width, 792.0 / 612.0, accuracy: 0.02)
    let zly = FileManager.default.temporaryDirectory.appendingPathComponent("zly.pdf")
    try Data("nie pdf".utf8).write(to: zly)
    guard case .failure(.uszkodzony) = Miniatura.zapisz(pdf: zly, cel: cel, szerokoscPt: 96) else { return XCTFail("zły plik nie dał .uszkodzony") }
    print("Miniatura: \(Int(obraz.size.width * obraz.scale)) × \(Int(obraz.size.height * obraz.scale)) px")
  }
}
