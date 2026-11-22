// Aplikacja na zegarku (F-12, ADR-0009 z uzupełnieniem 2026-10-26): licznik z kontekstu telefonu, +1/−1 także bez telefonu. Kolejka stuknięć
// w pliku `skrzynka-zegarka.jsonl` (SkrzynkaZegarka + PlikSkrzynki z pakietu, rdzeń dziennika z fsync) — nie w pamięci ustawień (P-135 Q1a,
// odstępstwo od Treningu nazwane). Kolejność stuknięcia: zapis → stan → haptyka → wysyłka (pkt 2); ponowienie wysyłki przy aktywacji, starcie,
// powrocie na pierwszy plan, kontekście, błędzie transferu i po stuknięciu (pkt 5). Teksty w języku aplikacji z kontekstu (P-139).
import StoreKit
import SwiftUI
import WatchConnectivity
import WatchKit

@main
struct OczkoZegarekApp: App {
  @StateObject private var model = ModelZegarka()
  @Environment(\.scenePhase) private var faza
  var body: some Scene {
    WindowGroup { EkranZegarka().environmentObject(model) }
      .onChange(of: faza) { _, f in if f == .active { model.wyslij() } }
  }
}

@MainActor
final class ModelZegarka: NSObject, ObservableObject, WCSessionDelegate {
  @Published private(set) var skrzynka: SkrzynkaZegarka
  @Published private(set) var limit = false
  /// Rodzaj stuknięcia, którego nie udało się zapisać (komunikat „nie zapisano”, P-142 (1b)); znika po udanym stuknięciu i nowym kontekście.
  @Published private(set) var niezapisano: ZdarzenieWejsciowe.Rodzaj?
  @Published private(set) var jezyk: String?
  @Published private(set) var telefonBlisko = false
  private var sklep: [Uprawnienie] = []
  private let zapis = UserDefaults.standard
  // Kontekst i lista potwierdzonych to kopia stanu telefonu (odtwarzana przy kontakcie) — mogą zostać w pamięci ustawień (pkt 1).
  private static let kluczKontekst = "oczko.zegarek.kontekst.v2"
  private static let kluczPotwierdzone = "oczko.zegarek.potwierdzone.v1"
  private static let kluczJezyk = "oczko.zegarek.jezyk.v1"
  /// Kolejka z partii 3 (pamięć ustawień): przenoszona do pliku przy pierwszym starcie, potem usuwana (zero utraty danych).
  private static let kluczStaraKolejka = "oczko.zegarek.oczekujace.v1"
  /// Urządzenie w polu linii dziennika: stały identyfikator instalacji na zegarku (bez danych osobowych).
  private lazy var urzadzenie: String = {
    if let u = zapis.string(forKey: "oczko.zegarek.urzadzenie") { return u }
    let u = "zegarek-" + UUID().uuidString.lowercased()
    zapis.set(u, forKey: "oczko.zegarek.urzadzenie")
    return u
  }()

  override init() {
    let d = UserDefaults.standard
    let katalog = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    try? FileManager.default.createDirectory(at: katalog, withIntermediateDirectories: true)
    let magazyn = PlikSkrzynki(sciezka: katalog.appendingPathComponent("skrzynka-zegarka.jsonl").path)
    if let stare = d.stringArray(forKey: Self.kluczStaraKolejka) {
      var przeniesione = true
      for linia in stare where ZdarzenieWejsciowe.zLinii(Substring(linia)) != nil {
        do { try magazyn.dopisz(linia) } catch { przeniesione = false; break } // klucz zostaje do następnej próby
      }
      if przeniesione { d.removeObject(forKey: Self.kluczStaraKolejka) }
    }
    let kontekst = d.data(forKey: Self.kluczKontekst).flatMap { try? StanEkranuBlokady.dekoduj($0) }
    let potwierdzone = d.stringArray(forKey: Self.kluczPotwierdzone) ?? []
    // Plik nieczytelny (błąd we/wy) nie kasuje kolejki: pusta skrzynka w pamięci, plik zostaje do następnego startu.
    skrzynka = (try? SkrzynkaZegarka(magazyn: magazyn, kontekst: kontekst, potwierdzone: potwierdzone))
      ?? (try! SkrzynkaZegarka(magazyn: PustyMagazyn(), kontekst: kontekst, potwierdzone: potwierdzone))
    jezyk = d.string(forKey: Self.kluczJezyk)
    super.init()
    if WCSession.isSupported() { WCSession.default.delegate = self; WCSession.default.activate() }
    Task { await odswiezSklep() }
  }

  func stuknij(_ rodzaj: ZdarzenieWejsciowe.Rodzaj) {
    let teraz = Int64((Date().timeIntervalSince1970 * 1000).rounded(.down))
    let w: WynikIntencji
    do {
      w = try skrzynka.stuknijNaZegarku(rodzaj, teraz: teraz, strefa: TimeZone.current.identifier, id: UUID().uuidString.lowercased(), urzadzenie: urzadzenie, sklep: sklep)
    } catch {
      // Zapis do skrzynki nieudany (pełna pamięć, błąd we/wy): stan bez zmian, haptyka „ponów” zamiast potwierdzenia (P-142 (1b)).
      niezapisano = rodzaj
      zagraj(rodzaj, .zapisNieudany)
      oglos(tekstNiezapisano(rodzaj))
      return
    }
    switch w {
    case .zapisz:
      niezapisano = nil
      limit = false
      zagraj(rodzaj, .wynik(w)) // dopiero po trwałym zapisie; wzorzec wybiera czysta funkcja (plus albo przypomnienie, K-05g)
      wyslij()
    case .limit: limit = true
    case .zablokowany: stuknietoZablokowany()
    case .bezZmiany: break
    }
  }

  /// Haptyka po stuknięciu: o wzorcu decyduje czysta funkcja z pakietu reguł (`wzorzecHaptykiZegarka`, ADR-0030 pkt 4, K-05g); tu tylko mapowanie
  /// na `WKHapticType` według tokenów `haptykaZegarek` (docs/design/tokeny.json): przypomnienie = notification, bladZapisu = retry, blokadaStukniecie = failure;
  /// zwykły rząd = click (jak dotąd).
  func zagraj(_ rodzaj: ZdarzenieWejsciowe.Rodzaj, _ przebieg: PrzebiegStukniecia) {
    guard let wzorzec = wzorzecHaptykiZegarka(rodzaj, przebieg) else { return }
    let typ: WKHapticType
    switch wzorzec {
    case .plus: typ = .click
    case .przypomnienie: typ = .notification
    case .bladZapisu: typ = .retry
    case .blokadaStukniecie: typ = .failure
    }
    WKInterfaceDevice.current().play(typ)
  }

  /// Stuknięcie w ekran przy zablokowanym liczniku: haptyka „niepowodzenie” i ogłoszenie tekstu blokady (P-142 (2a)).
  func stuknietoZablokowany() {
    zagraj(.plus, .wynik(.zablokowany))
    oglos(Teksty.t("zablokowany", jezyk) + ". " + Teksty.t("zablokowany_jak_zegarek", jezyk))
  }

  func tekstNiezapisano(_ r: ZdarzenieWejsciowe.Rodzaj) -> String {
    guard let s = skrzynka.pokazywany else { return Teksty.t("blad_zapisu_zegarek", jezyk) }
    // +1: rząd, który miał zostać dodany (jak „Now row”); −1: rząd, który miał zostać usunięty (bieżąca liczba skończonych).
    let naglowek = r == .plus ? Teksty.t("nie_dodano", jezyk, ["n": String(rzadWRobocie(s))]) : Teksty.t("nie_usunieto", jezyk, ["n": String(s.wartosc)])
    return naglowek + ". " + Teksty.t("blad_zapisu_zegarek", jezyk)
  }

  private func oglos(_ tekst: String) { AccessibilityNotification.Announcement(tekst).post() }

  /// Wysyłka niepotwierdzonych linii (pkt 5): tylko po zakończonej aktywacji (wcześniej to błąd programisty, rejestr Apple 4f),
  /// bez tych w toku i z ponowieniem po `Stale.zegarekPonowienieMs`.
  func wyslij() {
    let s = WCSession.default
    guard WCSession.isSupported(), s.activationState == .activated else { return }
    let wToku = Set(s.outstandingUserInfoTransfers.compactMap { ($0.userInfo["linia"] as? String).flatMap { ZdarzenieWejsciowe.zLinii(Substring($0))?.id } })
    let teraz = Int64((Date().timeIntervalSince1970 * 1000).rounded(.down))
    for z in skrzynka.doWyslania(teraz: teraz, wToku: wToku) { s.transferUserInfo(["linia": z.linia]) }
  }

  /// StoreKit zegarka (ADR-0009 D): bieżące uprawnienia jako `Uprawnienie` (OR z kontekstem telefonu w proZegarka).
  private func odswiezSklep() async {
    var lista: [Uprawnienie] = []
    for await wynik in Transaction.currentEntitlements {
      guard case let .verified(t) = wynik else { continue }
      lista.append(Uprawnienie(produkt: t.productID, wygasa: t.expirationDate.map { Int64($0.timeIntervalSince1970 * 1000) }, odebrane: t.revocationDate != nil))
    }
    sklep = lista
  }

  nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    let kontekst = session.receivedApplicationContext
    let blisko = session.isReachable
    Task { @MainActor in self.telefonBlisko = blisko; self.przyjmij(kontekst); self.wyslij() }
  }
  nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    Task { @MainActor in self.przyjmij(applicationContext); self.wyslij() }
  }
  nonisolated func session(_ session: WCSession, didFinish userInfoTransfer: WCSessionUserInfoTransfer, error: Error?) {
    guard error != nil else { return } // sukces transferu to nie potwierdzenie: potwierdza kontekst telefonu po COMMIT (pkt 3)
    Task { @MainActor in self.wyslij() }
  }
  nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
    let blisko = session.isReachable
    Task { @MainActor in self.telefonBlisko = blisko; if blisko { self.wyslij() } }
  }

  /// Kontekst `{ "stan": <StanZegarka JSON>, "potwierdzone": [id], "jezyk": tag }`; nowsza wersja albo zły ładunek → zostaje ostatni poprawny stan.
  private func przyjmij(_ kontekst: [String: Any]) {
    guard let tekst = kontekst["stan"] as? String, let s = try? StanEkranuBlokady.dekoduj(Data(tekst.utf8)) else { return }
    let potwierdzone = kontekst["potwierdzone"] as? [String] ?? []
    skrzynka.przyjmij(s, potwierdzone: potwierdzone)
    jezyk = kontekst["jezyk"] as? String
    limit = false
    niezapisano = nil
    zapis.set(Data(tekst.utf8), forKey: Self.kluczKontekst)
    zapis.set(potwierdzone, forKey: Self.kluczPotwierdzone)
    if let jezyk { zapis.set(jezyk, forKey: Self.kluczJezyk) } else { zapis.removeObject(forKey: Self.kluczJezyk) }
  }
}

/// Zapas, gdy pliku kolejki nie da się odczytać przy starcie: zapis rzuca (stuknięcie pokaże „nie zapisano”, plik zostaje nietknięty).
final class PustyMagazyn: MagazynSkrzynki {
  func odczytaj() throws -> [String] { [] }
  func dopisz(_ linia: String) throws { throw BladDanych("skrzynka zegarka nieczytelna przy starcie") }
  func zastap(_ linie: [String]) throws {}
}

// `rzadWRobocie` (skończone + 1 w obu trybach, P-161) i `pasPrzypomnienia` (RD-13): pakiet reguł, kopia Wspolne/Przypomnienia.swift.

/// Pas przypomnienia pod liczbą (P-158): zakreślacz, najwyżej 2 wiersze; kilka przypomnień → cicha linia pod pasem (P-158 (1.1a)).
struct PasZegarka: View {
  let pas: PasPrzypomnienia
  let jezyk: String?
  var body: some View {
    let p: [String: String] = ["n": String(pas.rzad), "tekst": pas.tekst, "k": String(pas.k), "razy": String(pas.razy)]
    VStack(spacing: 2) {
      Text(Teksty.t("przypomnienie", jezyk, p))
        .font(.footnote.weight(.semibold)).lineLimit(2).truncationMode(.tail).multilineTextAlignment(.center)
        .foregroundStyle(Color("tekst"))
        .padding(.horizontal, 6).padding(.vertical, 2)
        .background(RoundedRectangle(cornerRadius: 4).fill(Color("powierzchnia")))
        .overlay(alignment: .leading) { Rectangle().fill(Color("akcent")).frame(width: 2) }
        .accessibilityLabel(Teksty.t("przypomnienie_a11y", jezyk, p))
      if pas.wiecej > 0 { Text(Teksty.tl("przypomnienie_wiecej", pas.wiecej, jezyk)).font(.footnote).foregroundStyle(Color("tekst2")) }
    }
  }
}

/// Nazwa miesiąca i dzień wznowienia limitu (pierwszy dzień następnego miesiąca, R-105) w języku aplikacji.
func tekstyLimitu(_ s: StanEkranuBlokady, _ jezyk: String?) -> (miesiac: String, data: String) {
  let czesci = s.dzien.split(separator: "-").compactMap { Int($0) }
  guard czesci.count == 3 else { return ("", "") }
  var kal = Calendar(identifier: .gregorian)
  kal.timeZone = TimeZone(identifier: "UTC") ?? .current
  let locale = Locale(identifier: jezyk ?? "en")
  let dzis = kal.date(from: DateComponents(year: czesci[0], month: czesci[1], day: 1)) ?? Date()
  let wznowienie = kal.date(byAdding: .month, value: 1, to: dzis) ?? dzis
  let m = DateFormatter(); m.locale = locale; m.timeZone = kal.timeZone; m.setLocalizedDateFormatFromTemplate("LLLL")
  let d = DateFormatter(); d.locale = locale; d.timeZone = kal.timeZone; d.setLocalizedDateFormatFromTemplate("MMMd")
  return (m.string(from: dzis), d.string(from: wznowienie))
}

/// Pierwszeństwo stanów zegarka (design-spec „Ekran blokady i zegarek”): brak stanu → zablokowany → limit → nieudany zapis → typowy.
struct EkranZegarka: View {
  @EnvironmentObject var model: ModelZegarka
  var body: some View {
    let j = model.jezyk
    if let s = model.skrzynka.pokazywany {
      VStack(spacing: 6) {
        Text(s.nazwa).font(.footnote).foregroundStyle(Color("tekst2")).lineLimit(1)
        if s.zablokowany {
          Text(String(s.wartosc)).font(.system(size: 52, weight: .semibold).monospacedDigit()).foregroundStyle(Color("tekst"))
          Text(Teksty.tl("zrobione", s.wartosc, j)).font(.footnote).foregroundStyle(Color("tekst2"))
          Text(Teksty.t("zablokowany", j)).font(.headline).foregroundStyle(Color("tekst"))
          Text(Teksty.t("zablokowany_jak_zegarek", j)).font(.footnote).foregroundStyle(Color("tekst2")).multilineTextAlignment(.center)
        } else if model.limit || !s.dzienDozwolony {
          let l = tekstyLimitu(s, j)
          Text(String(s.wartosc)).font(.system(size: 52, weight: .semibold).monospacedDigit()).foregroundStyle(Color("tekst"))
          Text(Teksty.tl("zrobione", s.wartosc, j)).font(.footnote).foregroundStyle(Color("tekst2"))
          Text(Teksty.t("limit", j, ["miesiac": l.miesiac]) + " " + Teksty.t("limit_wznowienie", j, ["data": l.data]))
            .font(.footnote).foregroundStyle(Color("tekst2")).multilineTextAlignment(.center)
        } else {
          Text(String(s.znaczenie == .w_trakcie ? s.wartosc + 1 : s.wartosc))
            .font(.system(size: model.niezapisano == nil ? 52 : 40, weight: .semibold).monospacedDigit()).foregroundStyle(Color("tekst"))
          if let r = model.niezapisano {
            Text(r == .plus ? Teksty.t("nie_dodano", j, ["n": String(rzadWRobocie(s))]) : Teksty.t("nie_usunieto", j, ["n": String(s.wartosc)]))
              .font(.headline).foregroundStyle(Color("tekst"))
            Text(Teksty.t("blad_zapisu_zegarek", j)).font(.footnote).foregroundStyle(Color("tekst2")).multilineTextAlignment(.center)
          } else {
            if let pas = pasPrzypomnienia(s) { PasZegarka(pas: pas, jezyk: j) }
            Text(Teksty.t("teraz", j, ["n": String(rzadWRobocie(s))])).font(.footnote).foregroundStyle(Color("tekst2"))
            // P-199 Q6a: linia, gdy najstarsza pozycja kolejki czeka ≥ ZEGAREK_PONOWIENIE_MS (nie z zasięgu WCSession — migotałaby);
            // odświeżanie co minutę, bo próg mija bez zdarzenia.
            TimelineView(.periodic(from: .now, by: 60)) { kontekst in
              if let n = model.skrzynka.niewyslane(teraz: Int64((kontekst.date.timeIntervalSince1970 * 1000).rounded(.down))) {
                Text(Teksty.tl("bez_telefonu", n, j)).font(.footnote).foregroundStyle(Color("tekst2")).multilineTextAlignment(.center)
              }
            }
          }
          HStack(spacing: 8) {
            Button { model.stuknij(.minus) } label: { Image(systemName: "minus") }.accessibilityLabel(Teksty.t("minus_a11y", j))
            Button { model.stuknij(.plus) } label: { Text(Teksty.t("plus", j)).lineLimit(1) }
              .accessibilityLabel(Teksty.t("plus_a11y", j, ["n": String(rzadWRobocie(s))])).tint(Color("przycisk"))
          }
        }
      }
      .contentShape(Rectangle())
      .onTapGesture { if s.zablokowany { model.stuknietoZablokowany() } }
    } else {
      Text(Teksty.t("otworz_iphone", j)).font(.footnote).foregroundStyle(Color("tekst2")).multilineTextAlignment(.center)
    }
  }
}
