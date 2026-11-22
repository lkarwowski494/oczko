// Zamiana źródła wzoru na PDF na urządzeniu (moduly.md „Kontrakt partii 6”, KonwersjaWzoru; P-221 Q2a; P-218 (2): zmiana formatu, bez edycji treści).
// Strona WWW i Word: WKWebView poza ekranem → po `didFinish` renderer stron druku (`UIPrintPageRenderer` z `viewPrintFormatter()`), papier Letter
// dla regionu US i CA, A4 dla pozostałych. Word dopiero po eksperymencie W1 (okno maszyn); porażka W1 = podgląd zastępczy 5a w aplikacji.
// Obrazy i skan: jedna strona PDF na obraz, orientacja z EXIF (UIImage.imageOrientation). Wynik zawsze sprawdzany jak `sprawdzPdf`.
import Foundation
import UIKit
import WebKit

enum Konwersja {
  static let limitCzasuS: TimeInterval = 60 // [OCENA 08]: strona, która nie skończy się ładować, = brak sieci (zlecenie czeka w skrzynce); plik Word: osobny powód (E2-A3)

  @MainActor static func naPdf(_ z: ZrodloKonwersji) async -> String {
    let wynik: Result<URL, PowodWzoru>
    switch z {
    case let .adres(u): wynik = await KonwerterStrony().konwertuj(.adres(u))
    case let .word(u):
      wynik = await KonwerterStrony().konwertuj(.plik(u))
      // E2-A5 (P-282 wariant A): wydruk Worda przez WKWebView dokłada pustą ostatnią stronę; liczba stron w wyniku jest już z przyciętego pliku.
      if case let .success(plik) = wynik { SprawdzeniePdf.bezPustychStronNaKoncu(plik) }
    case let .obrazy(u): wynik = obrazyNaPdf(u)
    }
    switch wynik {
    case let .failure(p): return wynikBlad(p)
    case let .success(plik):
      switch SprawdzeniePdf.sprawdz(plik) {
      case let .success(strony): return wynikOk(["sciezka": plik.path, "strony": strony])
      case let .failure(p): try? FileManager.default.removeItem(at: plik); return wynikBlad(p)
      }
    }
  }

  static func plikTymczasowy() -> URL {
    FileManager.default.temporaryDirectory.appendingPathComponent("wzor-\(UUID().uuidString).pdf")
  }
  static var rozmiarPapieru: CGSize {
    let p = papier(region: Locale.current.region?.identifier).rozmiarPt
    return CGSize(width: p.szerokosc, height: p.wysokosc)
  }

  /// Strona na obraz: szerokość papieru, wysokość z proporcji zdjęcia; `draw(in:)` uwzględnia orientację EXIF.
  @MainActor static func obrazyNaPdf(_ pliki: [URL]) -> Result<URL, PowodWzoru> {
    let obrazy = pliki.compactMap { UIImage(contentsOfFile: $0.path) }
    guard obrazy.count == pliki.count, !obrazy.isEmpty else { return .failure(.uszkodzony) }
    let szer = rozmiarPapieru.width
    let cel = plikTymczasowy()
    let r = UIGraphicsPDFRenderer(bounds: CGRect(origin: .zero, size: rozmiarPapieru))
    do {
      try r.writePDF(to: cel) { ctx in
        for o in obrazy {
          let wys = o.size.width > 0 ? szer * o.size.height / o.size.width : rozmiarPapieru.height
          let strona = CGRect(x: 0, y: 0, width: szer, height: wys)
          ctx.beginPage(withBounds: strona, pageInfo: [:])
          o.draw(in: strona)
        }
      }
      return .success(cel)
    } catch { return .failure(.zapis) }
  }
}

enum WejscieStrony {
  case adres(URL), plik(URL)
  var lokalny: Bool { if case .plik = self { return true } else { return false } }
}

@MainActor final class KonwerterStrony: NSObject, WKNavigationDelegate {
  private let web: WKWebView
  private var ciag: CheckedContinuation<Result<URL, PowodWzoru>, Never>?
  private var kodHttp: Int?
  private var zegar: Timer?

  override init() {
    let k = WKWebViewConfiguration()
    k.websiteDataStore = .nonPersistent() // bez ciasteczek użytkownika: strona z logowaniem → odmowa/pusty (BR-WZR-007 S3)
    web = WKWebView(frame: CGRect(origin: .zero, size: Konwersja.rozmiarPapieru), configuration: k)
    super.init()
    web.navigationDelegate = self
  }

  func konwertuj(_ w: WejscieStrony) async -> Result<URL, PowodWzoru> {
    await withCheckedContinuation { c in
      ciag = c
      let powodCzasu = powodPrzekroczeniaCzasu(plikLokalny: w.lokalny) // E2-A3: Word ≠ brak sieci
      zegar = Timer.scheduledTimer(withTimeInterval: Konwersja.limitCzasuS, repeats: false) { [weak self] _ in
        Task { @MainActor in self?.zakoncz(.failure(powodCzasu)) }
      }
      switch w {
      case let .adres(u): web.load(URLRequest(url: u))
      case let .plik(u): web.loadFileURL(u, allowingReadAccessTo: u.deletingLastPathComponent())
      }
    }
  }

  private func zakoncz(_ r: Result<URL, PowodWzoru>) {
    zegar?.invalidate()
    zegar = nil
    web.stopLoading()
    ciag?.resume(returning: r)
    ciag = nil
  }

  func webView(_ w: WKWebView, decidePolicyFor r: WKNavigationResponse, decisionHandler: @escaping @MainActor @Sendable (WKNavigationResponsePolicy) -> Void) {
    if r.isForMainFrame, let h = r.response as? HTTPURLResponse { kodHttp = h.statusCode }
    decisionHandler(.allow)
  }
  func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
    if let p = powodHttp(kodHttp) { zakoncz(.failure(p)); return }
    zakoncz(drukuj())
  }
  func webView(_ w: WKWebView, didFail n: WKNavigation!, withError e: Error) { zakoncz(.failure(powodBledu(e))) }
  func webView(_ w: WKWebView, didFailProvisionalNavigation n: WKNavigation!, withError e: Error) { zakoncz(.failure(powodBledu(e))) }

  private func powodBledu(_ e: Error) -> PowodWzoru {
    let siec: Set<Int> = [NSURLErrorNotConnectedToInternet, NSURLErrorNetworkConnectionLost, NSURLErrorCannotFindHost, NSURLErrorCannotConnectToHost,
                          NSURLErrorTimedOut, NSURLErrorDNSLookupFailed, NSURLErrorInternationalRoamingOff, NSURLErrorDataNotAllowed]
    let n = e as NSError
    return n.domain == NSURLErrorDomain && siec.contains(n.code) ? .brakSieci : .pusty
  }

  /// Renderer stron druku: marginesy 36 pt, strony do pliku tymczasowego (plik wzoru = wynik, treść bez zmian).
  private func drukuj() -> Result<URL, PowodWzoru> {
    let papier = CGRect(origin: .zero, size: Konwersja.rozmiarPapieru)
    let r = UIPrintPageRenderer()
    r.addPrintFormatter(web.viewPrintFormatter(), startingAtPageAt: 0)
    r.setValue(papier, forKey: "paperRect")
    r.setValue(papier.insetBy(dx: 36, dy: 36), forKey: "printableRect")
    let dane = NSMutableData()
    UIGraphicsBeginPDFContextToData(dane, papier, nil)
    r.prepare(forDrawingPages: NSRange(location: 0, length: r.numberOfPages))
    for i in 0..<r.numberOfPages {
      UIGraphicsBeginPDFPage()
      r.drawPage(at: i, in: UIGraphicsGetPDFContextBounds())
    }
    UIGraphicsEndPDFContext()
    guard r.numberOfPages > 0 else { return .failure(.pusty) }
    let cel = Konwersja.plikTymczasowy()
    do { try dane.write(to: cel, options: .atomic) } catch { return .failure(.zapis) }
    return .success(cel)
  }
}
