// Skrzynka zegarka (ADR-0009, uzupełnienie 2026-10-26 pkt 1–5; NZ-08-P3-05 (e), P-135): kolejka niepotwierdzonych stuknięć w trwałym
// magazynie (`skrzynka-zegarka.jsonl`, rdzeń `DziennikPlus`), potwierdzenie przez `glowa` i `potwierdzone` kontekstu telefonu w obrębie
// licznika, ponowienie wysyłki po `Stale.zegarekPonowienieMs`. Czysta logika i plik; transport (WatchConnectivity) w celu watch.
import Foundation
#if canImport(OczkoReguly)
import OczkoReguly
#endif

/// Trwała kolejka zegarka (ADR-0009, 2026-10-26 pkt 2): `dopisz` z `fsync` przed zmianą stanu; `zastap` = przepisanie atomowe.
public protocol MagazynSkrzynki: AnyObject {
  func odczytaj() throws -> [String]
  func dopisz(_ linia: String) throws
  func zastap(_ linie: [String]) throws
}

/// Plik `skrzynka-zegarka.jsonl` rdzeniem dziennika (8A: `O_APPEND`, jeden `write`, `fsync`, `ftruncate` przy błędzie; odczyt 8R).
public final class PlikSkrzynki: MagazynSkrzynki {
  public let dziennik: DziennikPlus
  public init(sciezka: String) { dziennik = DziennikPlus(sciezka: sciezka) }
  /// Zdarzenia z pliku (linie uszkodzone pomijane, sklejone odzyskane — 8R); najpierw sprzątanie przerwanego przepisania (X-ZG-10).
  public func odczytaj() throws -> [String] {
    dziennik.sprzatnijTymczasowy()
    return try dziennik.odczytaj().zdarzenia.map(\.linia)
  }
  public func dopisz(_ linia: String) throws {
    guard let z = ZdarzenieWejsciowe.zLinii(Substring(linia)) else { throw BladDanych("skrzynka zegarka: linia nie jest zdarzeniem") }
    try dziennik.dopisz(z)
  }
  public func zastap(_ linie: [String]) throws { try dziennik.zastap(linie) }
}

public struct SkrzynkaZegarka: Equatable {
  /// Ostatni stan od telefonu (updateApplicationContext, klucz `stan`).
  public private(set) var kontekst: StanEkranuBlokady?
  /// Ostatnia lista `potwierdzone` z kontekstu (utrwalana obok kontekstu; po restarcie usuwa z kolejki to, co plik jeszcze ma).
  public private(set) var potwierdzone: [String] = []
  /// Zdarzenia zapisane na zegarku, których telefon jeszcze nie potwierdził, w kolejności stuknięć.
  public private(set) var oczekujace: [ZdarzenieWejsciowe] = []
  /// Stan po ostatnim stuknięciu na zegarku (rodzic następnego zdarzenia, wartość pokazywana).
  public private(set) var pokazywany: StanEkranuBlokady?
  private let magazyn: MagazynSkrzynki
  /// Czas ostatniej wysyłki linii (tylko pamięć: po restarcie wszystkie niepotwierdzone są do wysłania, pkt 5).
  private var wyslano: [String: Int64] = [:]

  /// Odtworzenie z magazynu (kolejka) i ostatniego kontekstu z listą potwierdzonych.
  public init(magazyn: MagazynSkrzynki, kontekst: StanEkranuBlokady? = nil, potwierdzone: [String] = []) throws {
    self.magazyn = magazyn
    oczekujace = try magazyn.odczytaj().compactMap { ZdarzenieWejsciowe.zLinii(Substring($0)) }
    if let kontekst { przyjmij(kontekst, potwierdzone: potwierdzone) }
  }

  public static func == (a: SkrzynkaZegarka, b: SkrzynkaZegarka) -> Bool {
    a.kontekst == b.kontekst && a.potwierdzone == b.potwierdzone && a.oczekujace == b.oczekujace && a.pokazywany == b.pokazywany
  }

  /// Nowy kontekst z telefonu (pkt 4): zdarzenie licznika L wymienione w `potwierdzone` albo równe `glowa` kontekstu licznika L usuwa z kolejki
  /// siebie i wcześniejsze zdarzenia tego samego licznika (zdarzenie w bazie ⇒ jego przodkowie w bazie); innych liczników nie rusza (e3).
  /// Pokazywane = kontekst + pozostałe zdarzenia jego licznika (e5). Nieudane przepisanie pliku nie cofa usunięcia w pamięci: po restarcie
  /// utrwalony kontekst z tą samą listą usuwa je ponownie (duplikat wysyłki nieszkodliwy, M-02).
  public mutating func przyjmij(_ k: StanEkranuBlokady, potwierdzone: [String] = []) {
    kontekst = k
    self.potwierdzone = potwierdzone
    let ids = Set(potwierdzone)
    var usun = Set<String>()
    for licznik in Set(oczekujace.map(\.licznikId)) {
      let wlasne = oczekujace.filter { $0.licznikId == licznik }
      if let i = wlasne.lastIndex(where: { ids.contains($0.id) || (licznik == k.licznikId && $0.id == k.glowa) }) {
        usun.formUnion(wlasne[...i].map(\.id))
      }
    }
    if !usun.isEmpty {
      oczekujace.removeAll { usun.contains($0.id) }
      for id in usun { wyslano[id] = nil }
      try? magazyn.zastap(oczekujace.map(\.linia))
    }
    pokazywany = oczekujace.filter { $0.licznikId == k.licznikId }.reduce(k) { s, z in s.po(z, dni: s.dniWMiesiacu) }
  }

  /// Stuknięcie na zegarku (pkt 2): reguły z pakietu (blokada, limit) na stanie pokazywanym → `dopisz` z `fsync` → dopiero potem kolejka
  /// i stan pokazywany. Błąd zapisu rzuca (stan i kolejka bez zmian; wołający: komunikat „nie zapisano”, bez haptyki potwierdzenia).
  public mutating func stuknijNaZegarku(_ rodzaj: ZdarzenieWejsciowe.Rodzaj, teraz: Int64, strefa: String, id: String, urzadzenie: String, sklep: [Uprawnienie] = []) throws -> WynikIntencji {
    guard let s = pokazywany else { return .bezZmiany } // przed pierwszym kontaktem z telefonem zegarek nie zna licznika
    let w = try stuknij(rodzaj, stan: s, teraz: teraz, strefa: strefa, id: id, urzadzenie: urzadzenie, zrodlo: .zegarek, proZegarkaSklep: sklep)
    if case let .zapisz(z, nowy) = w {
      try magazyn.dopisz(z.linia)
      oczekujace.append(z)
      pokazywany = nowy
    }
    return w
  }

  /// Linia „iPhone not nearby. N changes are saved on this watch.” (P-199 Q6a): N = liczba linii w kolejce, gdy najstarsza czeka
  /// ≥ `Stale.zegarekPonowienieMs` od stuknięcia; inaczej nil (bez progu linia zapalałaby się po każdym stuknięciu do potwierdzenia).
  public func niewyslane(teraz: Int64) -> Int? {
    guard let najstarsza = oczekujace.map(\.czasMs).min(), teraz - najstarsza >= Stale.zegarekPonowienieMs else { return nil }
    return oczekujace.count
  }

  /// Linie do `transferUserInfo` (pkt 5): bez tych w toku (`outstandingUserInfoTransfers`), niewysłane w tym uruchomieniu albo wysłane
  /// co najmniej `Stale.zegarekPonowienieMs` temu; zwrócone dostają czas wysyłki `teraz`.
  public mutating func doWyslania(teraz: Int64, wToku: Set<String>) -> [ZdarzenieWejsciowe] {
    let lista = oczekujace.filter { z in !wToku.contains(z.id) && (wyslano[z.id].map { teraz - $0 >= Stale.zegarekPonowienieMs } ?? true) }
    for z in lista { wyslano[z.id] = teraz }
    return lista
  }
}
