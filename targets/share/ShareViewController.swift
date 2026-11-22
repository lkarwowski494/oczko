// Rozszerzenie „Udostępnij do Oczka” (ADR-0011 uzupełnienie fix-7; moduly.md „Kontrakt partii 6”, cel targets/share; P-220 R1a, P-243; design-spec
// „Arkusz rozszerzenia (R1a)”). Czyta załączniki (NSItemProvider), migawkę projektów z App Group i zapisuje zlecenie do skrzynki
// (`zapiszZlecenie`, Wspolne/Skrzynka.swift — kopia pakietu modules/oczko-wzor/Pakiet). Nie otwiera bazy (granice: SWIFT), nie dekoduje pliku.
import SwiftUI
import UIKit
import UniformTypeIdentifiers

let GRUPA_APLIKACJI = "group.com.apps4brew.knitting"

/// Załącznik gotowy do zapisu: plik skopiowany do katalogu tymczasowego rozszerzenia (URL od systemu jest ważny tylko w wywołaniu zwrotnym).
struct Zalacznik {
  let rodzaj: RodzajZalacznika
  let plik: URL?
  let adres: URL?
  let typ: String
  let nazwa: String
}

final class ShareViewController: UIViewController {
  private let model = ModelArkusza()

  override func viewDidLoad() {
    super.viewDidLoad()
    let grupa = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: GRUPA_APLIKACJI)
    let migawka = grupa.flatMap { try? Data(contentsOf: $0.appendingPathComponent(PLIK_MIGAWKI)) }
    model.projekty = odczytajMigawke(migawka)
    JEZYK = jezykArkusza(jezykMigawki(migawka)) // P-248 D2a: język aplikacji z migawki, inaczej systemu
    model.wybrany = model.projekty?.first?.id
    model.naAnuluj = { [weak self] in self?.zakoncz(NSError(domain: NSCocoaErrorDomain, code: NSUserCancelledError)) }
    model.naZapisz = { [weak self] in self?.zapisz(grupa) }
    let h = UIHostingController(rootView: ArkuszUdostepnij(model: model))
    addChild(h)
    h.view.frame = view.bounds
    h.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(h.view)
    h.didMove(toParent: self)
    Task { await wczytajZalaczniki() }
  }

  private func dostawcy() -> [NSItemProvider] {
    (extensionContext?.inputItems as? [NSExtensionItem] ?? []).flatMap { $0.attachments ?? [] }
  }

  /// Plik > WZOR_MAKS_MB → stan „za duży” bez kopii; typ spoza reguły → „nieobsługiwany”; nic nie trafia do skrzynki.
  @MainActor private func wczytajZalaczniki() async {
    var wynik: [Zalacznik] = []
    for d in dostawcy() {
      guard let rodzaj = rodzajZalacznika(d.registeredTypeIdentifiers) else { continue }
      if rodzaj == .adres {
        guard let u = try? await d.loadItem(forTypeIdentifier: UTType.url.identifier) as? URL, !u.isFileURL else { continue }
        wynik.append(Zalacznik(rodzaj: .adres, plik: nil, adres: u, typ: UTType.url.identifier, nazwa: u.host ?? u.absoluteString))
        continue
      }
      let typ = d.registeredTypeIdentifiers.first { rodzajZalacznika([$0]) == rodzaj } ?? d.registeredTypeIdentifiers.first ?? ""
      switch await kopiaTymczasowa(d, typ: typ) {
      case let .success(u): wynik.append(Zalacznik(rodzaj: rodzaj, plik: u, adres: nil, typ: typ, nazwa: d.suggestedName.map { nazwaZRozszerzeniem($0, u) } ?? u.lastPathComponent))
      case .failure(BladZlecenia.zaDuzy): model.stan = .zaDuzy; return
      case .failure: continue
      }
    }
    model.zalaczniki = wynik
    model.stan = wynik.isEmpty ? .nieobslugiwany : .gotowy
  }

  private func nazwaZRozszerzeniem(_ n: String, _ u: URL) -> String {
    (n as NSString).pathExtension.isEmpty && !u.pathExtension.isEmpty ? "\(n).\(u.pathExtension)" : n
  }

  /// `loadFileRepresentation` daje plik ważny tylko w wywołaniu zwrotnym: rozmiar sprawdzany przed kopią, kopia `copyItem` (bez pamięci).
  private func kopiaTymczasowa(_ d: NSItemProvider, typ: String) async -> Result<URL, BladZlecenia> {
    await withCheckedContinuation { c in
      _ = d.loadFileRepresentation(forTypeIdentifier: typ) { url, _ in
        guard let url else { c.resume(returning: .failure(.brakPliku)); return }
        let bajty = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? NSNumber)?.int64Value ?? 0
        if bajty > Int64(StaleWzoru.wzorMaksMb) * 1024 * 1024 { c.resume(returning: .failure(.zaDuzy)); return }
        let k = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let cel = k.appendingPathComponent(bezpiecznaNazwa(url.lastPathComponent))
        do {
          try FileManager.default.createDirectory(at: k, withIntermediateDirectories: true)
          try FileManager.default.copyItem(at: url, to: cel)
          c.resume(returning: .success(cel))
        } catch { c.resume(returning: .failure(.brakPliku)) }
      }
    }
  }

  /// Zdjęcia jednego udostępnienia = jedno zlecenie (P-248 D1a, P-218 (1)); PDF, Word i adres — każdy osobno; manifest zapisany na końcu.
  private func zapisz(_ grupa: URL?) {
    guard let grupa else { zakoncz(NSError(domain: "Oczko", code: 1)); return }
    let teraz = Int64(Date().timeIntervalSince1970 * 1000)
    var zapisane: [String] = [] // przy błędzie kolejnego zlecenia wcześniejsze z tego udostępnienia są cofane (bez duplikatu po ponowieniu)
    do {
      let zdjecia = model.zalaczniki.filter { $0.rodzaj == .obraz && $0.plik != nil }
      if let pierwsze = zdjecia.first {
        zapisane.append(try zapiszZlecenie(grupa: grupa, wejscie: .pliki(zdjecia.compactMap(\.plik), typ: pierwsze.typ), projektId: model.wybrany, terazMs: teraz).id)
      }
      for z in model.zalaczniki where z.rodzaj != .obraz {
        if let u = z.adres {
          zapisane.append(try zapiszZlecenie(grupa: grupa, wejscie: .adres(u, film: model.jakoFilm), projektId: model.wybrany, terazMs: teraz).id)
        } else if let p = z.plik {
          zapisane.append(try zapiszZlecenie(grupa: grupa, wejscie: .pliki([p], typ: z.typ), projektId: model.wybrany, terazMs: teraz).id)
        }
      }
      for z in model.zalaczniki { if let p = z.plik { try? FileManager.default.removeItem(at: p.deletingLastPathComponent()) } }
      zakoncz(nil)
    } catch {
      for id in zapisane { try? FileManager.default.removeItem(at: grupa.appendingPathComponent("skrzynka/\(id)", isDirectory: true)) }
      zakoncz(error)
    }
  }

  private func zakoncz(_ e: Error?) {
    if let e { extensionContext?.cancelRequest(withError: e) } else { extensionContext?.completeRequest(returningItems: nil) }
  }
}
