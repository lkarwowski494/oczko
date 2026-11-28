// Live Activity sesji (F-11, F-21; ADR-0008): nazwa, liczba, tylko +1 przez intencję (P-133 (1.1a)), stoper od `sesjaStartMs` rysowany przez
// system (bez odliczania w kodzie). Stany według pierwszeństwa design-spec „Ekran blokady i zegarek”: zablokowany → limit → `uwaga` → typowy
// (P-142). Wygląd z tokenów 04 (kolory celu), teksty z tabeli generowanej z t() w języku aplikacji ze stanu (Teksty.swift, ADR-0017, P-139).
import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

struct OczkoAktywnosc: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: OczkoAtrybuty.self) { kontekst in
      WidokAktywnosci(a: kontekst.state)
        .activityBackgroundTint(Color("tlo"))
        .activitySystemActionForegroundColor(Color("tekst"))
    } dynamicIsland: { kontekst in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) { Text(kontekst.state.stan.nazwa).font(.headline).lineLimit(1) }
        DynamicIslandExpandedRegion(.trailing) { Liczba(stan: kontekst.state.stan).font(.title2.monospacedDigit()) }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 4) {
            HStack { PrzyciskMinus(a: kontekst.state); Opis(a: kontekst.state, zPodpisem: false); Spacer(); Przycisk(a: kontekst.state) }
            if let pas = pasTypowy(kontekst.state) { Pas(pas: pas, jezyk: kontekst.state.jezyk, wyspa: true) }
          }
        }
      } compactLeading: {
        Image(systemName: "number") // znak kresek z ikony: zasób dla celu widżetu — zgłoszenie (partia 4, raport)
      } compactTrailing: {
        Liczba(stan: kontekst.state.stan).monospacedDigit()
      } minimal: {
        Liczba(stan: kontekst.state.stan).monospacedDigit()
      }
    }
    // Smart Stack zegarka i CarPlay (P-158, design-spec „Smart Stack”): własny widok małego rozmiaru zamiast złożenia z compact.
    .supplementalActivityFamilies([.small])
  }
}

/// Ekran blokady (`.medium`) albo Smart Stack / CarPlay (`.small`) według `activityFamily` (iOS 18).
struct WidokAktywnosci: View {
  let a: StanAktywnosci
  @Environment(\.activityFamily) private var rodzina
  var body: some View {
    switch rodzina {
    case .small: SmartStack(a: a)
    default: EkranBlokady(a: a)
    }
  }
}

/// Etykieta VoiceOver karty (design-spec „VoiceOver”, 07-jakosc-030): `karta_a11y`, przy blokadzie `zablokowany_a11y`; stan limitu dopisany jako część karty.
/// Czas sesji nie wchodzi do etykiety: rysuje go system (`timerInterval`), a statyczna etykieta by się starzała między odświeżeniami.
func etykietaKarty(_ a: StanAktywnosci) -> String {
  let s = a.stan, j = a.jezyk
  let zrobione = Teksty.tl("zrobione", s.wartosc, j)
  if s.zablokowany { return Teksty.t("zablokowany_a11y", j, ["nazwa": s.nazwa, "zrobione": zrobione]) }
  let karta = Teksty.t("karta_a11y", j, ["nazwa": s.nazwa, "zrobione": zrobione, "n": String(rzadWRobocie(s))])
  if !s.dzienDozwolony { return karta + ". " + Teksty.t("wstrzymane", j) }
  if let pas = pasPrzypomnienia(s) {
    return karta + ". " + Teksty.t("przypomnienie_a11y", j, ["n": String(pas.rzad), "tekst": pas.tekst, "k": String(pas.k), "razy": String(pas.razy)])
  }
  return karta
}

/// „Teraz rząd N” albo, przy kroku 2, „Teraz rzędy N–M” (ADR-0036, U6; klucz `teraz_dwa`).
func tekstTeraz(_ s: StanEkranuBlokady, _ j: String?) -> String {
  s.krok > 1
    ? Teksty.t("teraz_dwa", j, ["od": String(rzadWRobocie(s)), "do": String(rzadWRobocie(s) + s.krok - 1)])
    : Teksty.t("teraz", j, ["n": String(rzadWRobocie(s))])
}

/// Etykieta przycisku +1: przy rzędzie z przypomnieniem pełna `plus_a11y_przypomnienie` (nie sklejanie „Add row. ” z pasem), inaczej `plus_a11y`.
func etykietaPlus(_ a: StanAktywnosci) -> String {
  if a.stan.krok > 1 { return Teksty.t("plus2", a.jezyk) + ". " + tekstTeraz(a.stan, a.jezyk) } // „+2 rows. Now rows 43–44”
  if let pas = pasPrzypomnienia(a.stan) {
    return Teksty.t("plus_a11y_przypomnienie", a.jezyk, ["n": String(pas.rzad), "tekst": pas.tekst, "k": String(pas.k), "razy": String(pas.razy)])
  }
  return Teksty.t("plus_a11y", a.jezyk, ["n": String(rzadWRobocie(a.stan))])
}

/// Smart Stack i CarPlay (P-158; design-spec „Smart Stack (Live Activity na zegarku) i CarPlay”): bez przycisków (CarPlay wyłącza elementy
/// interaktywne; liczenie na zegarku w jego aplikacji), `uwaga` pomijana (3.1a). Wiersz 1: znak, liczba, nazwa, czas sesji; wiersz 2: linia stanu
/// według pierwszeństwa zablokowany → limit → przypomnienie (pas, tylko pierwsze, wersja krótka) → typowy. Ustępowanie przy dużym tekście:
/// czas sesji, potem nazwa; linia stanu ucina się ostatnia.
struct SmartStack: View {
  let a: StanAktywnosci
  var body: some View {
    let s = a.stan, j = a.jezyk, n = String(rzadWRobocie(s))
    VStack(alignment: .leading, spacing: 4) {
      HStack(alignment: .firstTextBaseline, spacing: 4) {
        Image(systemName: "number").font(.system(size: 13)).foregroundStyle(Color("tekst")).accessibilityHidden(true) // znak kresek: zasób jak w compact (zgłoszenie partii 4)
        Liczba(stan: s).font(.system(size: 30, weight: .bold).monospacedDigit()).foregroundStyle(Color("tekst")).fixedSize().layoutPriority(3)
        Text(s.nazwa).font(.system(size: 13)).foregroundStyle(Color("tekst2")).lineLimit(1).truncationMode(.tail).layoutPriority(1)
        Spacer(minLength: 0)
        if let start = s.sesjaStartMs {
          Text(timerInterval: Date(timeIntervalSince1970: TimeInterval(start) / 1000)...Date.distantFuture, countsDown: false)
            .font(.system(size: 13).monospacedDigit()).foregroundStyle(Color("tekst2")).lineLimit(1).layoutPriority(0)
        }
      }
      Group {
        if s.zablokowany {
          Text(Teksty.t("zablokowany", j))
        } else if !s.dzienDozwolony {
          Text(Teksty.t("wstrzymane", j))
        } else if let pas = pasPrzypomnienia(s) {
          Text(Teksty.t("przypomnienie_krotkie", j, ["n": String(pas.rzad), "tekst": pas.tekst]))
            .foregroundStyle(Color("tekst"))
            .padding(.horizontal, 4)
            .background(RoundedRectangle(cornerRadius: 3).fill(Color("powierzchnia")))
            .accessibilityLabel(Teksty.t("przypomnienie_a11y", j, ["n": String(pas.rzad), "tekst": pas.tekst, "k": String(pas.k), "razy": String(pas.razy)]))
        } else {
          Text(tekstTeraz(s, j))
        }
      }
      .font(.system(size: 15, weight: .semibold)).foregroundStyle(Color("tekst")).lineLimit(1).truncationMode(.tail).layoutPriority(4)
    }
    .padding(.horizontal, 8)
    .accessibilityElement(children: .ignore) // karta jako jeden element (design-spec „VoiceOver”); brak przycisków w Smart Stack
    .accessibilityLabel(etykietaKarty(a))
  }
}

/// Pas przypomnienia pod liczbą (RD-13, P-158, P-161): zakreślacz = rząd z instrukcją; najwyżej 2 wiersze, dalej wielokropek.
/// `rzadWRobocie` i `pasPrzypomnienia` z pakietu reguł (Wspolne/Przypomnienia.swift) — ta sama reguła co pas w aplikacji.
struct Pas: View {
  let pas: PasPrzypomnienia
  let jezyk: String?
  let wyspa: Bool // rozwinięta Dynamic Island: barwy wyspa* (systemCzarny, tło wyspy zawsze czarne)
  var body: some View {
    let p: [String: String] = ["n": String(pas.rzad), "tekst": pas.tekst, "k": String(pas.k), "razy": String(pas.razy)]
    Text(Teksty.t("przypomnienie", jezyk, p))
      .font(.footnote.weight(.semibold)).lineLimit(2).truncationMode(.tail)
      .foregroundStyle(Color(wyspa ? "wyspaTekst" : "tekst"))
      .padding(.horizontal, 6).padding(.vertical, 2)
      .background(RoundedRectangle(cornerRadius: 4).fill(Color(wyspa ? "wyspaPowierzchnia" : "powierzchnia")))
      .overlay(alignment: .leading) { Rectangle().fill(Color(wyspa ? "wyspaAkcent" : "akcent")).frame(width: 2) }
      .accessibilityLabel(Teksty.t("przypomnienie_a11y", jezyk, p))
  }
}

/// Pas tylko w stanie typowym (pierwszeństwo: zablokowany → limit → `uwaga` → typowy, design-spec „Ekran blokady i zegarek”).
func pasTypowy(_ a: StanAktywnosci) -> PasPrzypomnienia? {
  a.stan.zablokowany || !a.stan.dzienDozwolony || a.uwaga != nil ? nil : pasPrzypomnienia(a.stan)
}

/// Duża liczba: skończone rzędy albo rząd w trakcie (BR-LIC-012), jak na ekranie licznika.
struct Liczba: View {
  let stan: StanEkranuBlokady
  var body: some View { Text(String(stan.znaczenie == .w_trakcie ? stan.wartosc + 1 : stan.wartosc)) }
}

/// Nazwa miesiąca i dzień wznowienia limitu (pierwszy dzień następnego miesiąca, `wznowienieLimitu` R-105) w języku aplikacji.
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

/// Opis obok liczby według pierwszeństwa stanów; przy blokadzie i limicie bez przycisku (Przycisk).
struct Opis: View {
  enum Czesc { case calosc, pierwszy, reszta }
  let a: StanAktywnosci
  let zPodpisem: Bool
  /// U4 (opcja A, P-1100): przy widocznych przyciskach pierwszy wiersz stoi między „−1” i „+1”, drugi wiersz zajmuje pełną szerokość pod nimi.
  var czesc: Czesc = .calosc
  var body: some View {
    let s = a.stan, j = a.jezyk, n = String(rzadWRobocie(s))
    VStack(alignment: .leading, spacing: 2) {
      if s.zablokowany {
        Text(Teksty.t("zablokowany", j)).font(.subheadline.weight(.semibold)).foregroundStyle(Color("tekst"))
        Text(Teksty.t("zablokowany_jak", j)).font(.footnote).foregroundStyle(Color("tekst2"))
      } else if !s.dzienDozwolony {
        let l = tekstyLimitu(s, j)
        Text(Teksty.t("wstrzymane", j)).font(.subheadline.weight(.semibold)).foregroundStyle(Color("tekst"))
        Text(Teksty.t("zachowane", j)).font(.footnote).foregroundStyle(Color("tekst2"))
        Label(Teksty.t("limit", j, ["miesiac": l.miesiac]) + " " + Teksty.t("limit_wznowienie", j, ["data": l.data]), systemImage: "info.circle")
          .font(.footnote).foregroundStyle(Color("tekst2"))
      } else if let u = a.uwaga {
        if czesc != .reszta { Text(Teksty.t("nie_dodano", j, ["n": n])).font(.subheadline.weight(.semibold)).foregroundStyle(Color("tekst")) }
        if czesc != .pierwszy { Text(Teksty.t(u == .odblokuj ? "odblokuj" : "blad_zapisu", j)).font(.footnote).foregroundStyle(Color("tekst2")) }
      } else {
        if czesc != .reszta { Text(tekstTeraz(s, j)).font(.subheadline).foregroundStyle(Color("tekst")) }
        // Kilka przypomnień w rzędzie: cicha linia „+N more” w miejscu podpisu (P-158 (1.1a)); w wyspie pod „Now row”.
        if czesc != .pierwszy {
          if let pas = pasPrzypomnienia(s), pas.wiecej > 0 {
            Text(Teksty.tl("przypomnienie_wiecej", pas.wiecej, j)).font(.footnote).foregroundStyle(Color("tekst2"))
          } else if zPodpisem {
            Text(s.krok > 1 ? Teksty.t("stuknij_dwa", j) : Teksty.t("podpis_plus", j, ["n": n])).font(.footnote).foregroundStyle(Color("tekst2"))
          }
        }
      }
    }
    .accessibilityElement(children: .combine)
  }
}

/// Przyciski liczenia są widoczne poza blokadą i limitem (stan znany z góry, P-142 (2a)); −1 przy limicie i blokadzie też znika (P-1100, P-1111 (2)).
func przyciskiWidoczne(_ a: StanAktywnosci) -> Bool { !a.stan.zablokowany && a.stan.dzienDozwolony }

/// „−1” (U4, ZM-22, opcja A): 44 × 44 pt z obrysem, przy lewym brzegu karty i rozwiniętej wyspy; ta sama intencja co „+1” (reguły w `stuknij`: nie zaczyna dnia,
/// przy 0 bez zmiany). Znak „−1” to znak, nie klucz (jak „+1”); etykieta VoiceOver `minus_a11y` istnieje.
struct PrzyciskMinus: View {
  let a: StanAktywnosci
  var body: some View {
    if przyciskiWidoczne(a) {
      Button(intent: OczkoStuknij(rodzaj: "minus")) {
        Text("\u{2212}1").font(.headline).foregroundStyle(Color("tekst")).frame(minWidth: 44, minHeight: 44)
          .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color("tekst2"), lineWidth: 2))
      }
      .buttonStyle(.plain)
      .accessibilityLabel(Teksty.t("minus_a11y", a.jezyk))
    }
  }
}

/// „+1” albo „+2” (krok licznika, ADR-0036): ta sama intencja `plus`; liczbę linii wyznacza `krok` ze stanu.
struct Przycisk: View {
  let a: StanAktywnosci
  var body: some View {
    if przyciskiWidoczne(a) {
      Button(intent: OczkoStuknij(rodzaj: "plus")) { Text(a.stan.krok > 1 ? Teksty.t("plus2", a.jezyk) : Teksty.t("plus", a.jezyk)).font(.headline).frame(minWidth: 96, minHeight: 60) }
        .accessibilityLabel(etykietaPlus(a))
        .buttonStyle(.borderedProminent)
        .tint(Color("przycisk"))
        .foregroundStyle(Color("przyciskTekst"))
    }
  }
}

struct EkranBlokady: View {
  let a: StanAktywnosci
  var body: some View {
    let s = a.stan
    VStack(alignment: .leading, spacing: 8) {
      HStack(alignment: .firstTextBaseline) {
        Text(s.nazwa).font(.headline).foregroundStyle(Color("tekst")).lineLimit(1)
        Spacer()
        if let start = s.sesjaStartMs {
          Text(timerInterval: Date(timeIntervalSince1970: TimeInterval(start) / 1000)...Date.distantFuture, countsDown: false)
            .font(.subheadline.monospacedDigit()).foregroundStyle(Color("tekst2")).multilineTextAlignment(.trailing)
        }
      }
      HStack(alignment: .center, spacing: 12) {
        PrzyciskMinus(a: a)
        Liczba(stan: s).font(.system(size: 48, weight: .semibold).monospacedDigit()).foregroundStyle(Color("tekst"))
        Opis(a: a, zPodpisem: true, czesc: przyciskiWidoczne(a) ? .pierwszy : .calosc)
        Spacer(minLength: 0)
        Przycisk(a: a)
      }
      if przyciskiWidoczne(a) { Opis(a: a, zPodpisem: true, czesc: .reszta) } // drugi wiersz opisu pod przyciskami, na pełną szerokość (P-1100)
      if let pas = pasTypowy(a) { Pas(pas: pas, jezyk: a.jezyk, wyspa: false) }
    }
    .padding(14)
  }
}
