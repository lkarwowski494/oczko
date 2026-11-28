// Wykonanie intencji ekranu blokady w procesie aplikacji (ADR-0008 (1), (8A), uzupełnienie 2026-10-26): stan z bieżącej Live Activity → decyzja
// `stuknij` (reguły z pakietu: blokada, limit) → linia przez jedynego pisarza (`dopisz` z fsync) → dopiero potem nowy stan Live Activity.
// Błąd zapisu: wartość i `glowa` bez zmian, `uwaga` = odblokuj (dane chronione przed pierwszym odblokowaniem) albo blad_zapisu; błąd rzucany dalej.
// Wołane z intencji w targets/widget/_shared/Stuknij.swift (kompilowanej też do aplikacji).
import ActivityKit
import Foundation
import UIKit

public enum IntencjaEkranuBlokady {
  public enum Blad: Error { case brakAktywnosci, zlyRodzaj(String) }

  public static func wykonaj(rodzaj: String) async throws {
    guard let r = ZdarzenieWejsciowe.Rodzaj(rawValue: rodzaj) else { throw Blad.zlyRodzaj(rodzaj) }
    guard let aktywnosc = Activity<OczkoAtrybuty>.activities.first else { throw Blad.brakAktywnosci }
    let obecny = aktywnosc.content.state
    let stan = obecny.stan
    let teraz = Int64((Date().timeIntervalSince1970 * 1000).rounded(.down))
    // „+k” (krok licznika ze stanu, ADR-0036): k identyfikatorów, bo jedno stuknięcie to k linii; −1 użyje pierwszego.
    let ids = (0..<max(1, stan.krok)).map { _ in UUID().uuidString.lowercased() }
    let wynik = try stuknij(r, stan: stan, teraz: teraz, strefa: TimeZone.current.identifier, ids: ids, urzadzenie: aktywnosc.attributes.urzadzenie)
    switch wynik {
    case let .zapisz(linie, nowy):
      do {
        try DziennikPlus.wspolny.dopisz(linie) // wszystkie linie stuknięcia jednym zapisem (ADR-0036 pkt 3); rzuca przy krótkim zapisie albo błędzie fsync — wartość bez zmian (8A)
      } catch {
        // Przy domyślnej klasie ochrony plik jest dostępny po pierwszym odblokowaniu (rejestr Apple 3a); sam sygnał tego nie rozróżnia (3d).
        let chronione = await MainActor.run { !UIApplication.shared.isProtectedDataAvailable }
        let uwaga: StanAktywnosci.Uwaga = chronione ? .odblokuj : .blad_zapisu
        await aktywnosc.update(ActivityContent(state: StanAktywnosci(stan: stan, uwaga: uwaga, jezyk: obecny.jezyk), staleDate: aktywnosc.content.staleDate))
        throw error
      }
      // ADR-0037 reguła 4: po każdym stuknięciu `staleDate` = czas zmiany + koniec (próg przypominacza U7-B jest w stanie dopiero, gdy B wchodzi: tu nil = wyłączony).
      await aktywnosc.update(ActivityContent(state: StanAktywnosci(stan: nowy, uwaga: nil, jezyk: obecny.jezyk), staleDate: dataStaleDate(zmianaMs: teraz)))
    case .limit:
      let dzis = try dzienLokalny(ms: teraz, strefa: TimeZone.current.identifier)
      if stan.dzienDozwolony || stan.dzien != dzis {
        await aktywnosc.update(ActivityContent(state: StanAktywnosci(stan: stan.zLimitem(dzien: dzis), uwaga: nil, jezyk: obecny.jezyk), staleDate: aktywnosc.content.staleDate))
      }
    case .bezZmiany, .zablokowany: // zablokowany: stan już niesie blokadę (widok bez przycisku, P-142 (2a)); wyścig bez komunikatu
      break
    }
  }
}

/// `staleDate` Live Activity z czasu zmiany (ADR-0037 reguła 4; SD-01…SD-04 w pakiecie reguł): `Date` w sekundach z ms UTC; nil, gdy brak zmiany.
func dataStaleDate(zmianaMs: Int64?, przypominaczMs: Int64? = nil) -> Date? {
  dataNieaktualnosci(ostatniaZmianaMs: zmianaMs, przypominaczMs: przypominaczMs, koniecPoMs: liveKoniecPoMs).map { Date(timeIntervalSince1970: Double($0) / 1000) }
}

extension StanEkranuBlokady {
  /// Ten sam stan z dniem `dzien` niedozwolonym (Live Activity pokazuje komunikat limitu zamiast +1, P-065 (1a)).
  func zLimitem(dzien: String) -> StanEkranuBlokady {
    StanEkranuBlokady(wersja: wersja, licznikId: licznikId, nazwa: nazwa, wartosc: wartosc, znaczenie: znaczenie, glowa: glowa, ostatniPlusMs: ostatniPlusMs,
                      dzien: dzien, dzienDozwolony: false, sesjaStartMs: sesjaStartMs, pro: pro, proWaznoscDo: proWaznoscDo, dniWMiesiacu: dniWMiesiacu,
                      przypomnienia: przypomnienia, zablokowany: zablokowany, krok: krok)
  }
}

extension DziennikPlus {
  /// Jedyny pisarz w procesie (ADR-0008 (8A)): Application Support/dziennik-plus.jsonl (kontener aplikacji, bez App Group).
  public static let wspolny: DziennikPlus = {
    let katalog = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    try? FileManager.default.createDirectory(at: katalog, withIntermediateDirectories: true)
    return DziennikPlus(sciezka: katalog.appendingPathComponent("dziennik-plus.jsonl").path)
  }()
}
