// Decyzja intencji +1/−1 z ekranu blokady (ADR-0008 (1), (6), uzupełnienie 2026-10-25; X-DZ-08, X-DZ-09): czysta funkcja na stanie
// Live Activity — reguły limitu w chwili stuknięcia, rodzic = `glowa`, nowy stan dopiero po udanym zapisie (wołający: `dopisz`, potem stan).
// W pakiecie OczkoDziennik importuje OczkoReguly; w kopii w module aplikacji i w widżecie wszystkie pliki są w jednym module.
import Foundation
#if canImport(OczkoReguly)
import OczkoReguly
#endif

public enum WynikIntencji: Equatable {
  /// Linia do dopisania i stan do pokazania po udanym `fsync` (ADR-0008 (8A)).
  case zapisz(ZdarzenieWejsciowe, StanEkranuBlokady)
  /// Nowy dzień ponad limit (P-065 (1a)): bez linii, Live Activity pokazuje komunikat limitu.
  case limit
  /// −1 przy wartości 0: bez linii (licznik nie schodzi poniżej zera, CHECK `wartosc >= 0`).
  case bezZmiany
  /// Licznik zablokowany w stanie (F-03, N1, stan v3): bez linii, przed limitem (ADR-0008, 2026-10-26).
  case zablokowany
}

/// Stuknięcie w chwili `teraz` w strefie urządzenia; `id` = nowy UUID, `urzadzenie` = identyfikator urządzenia z aplikacji.
/// `zrodlo`: ekran blokady (intencja) albo zegarek (ta sama reguła na stanie z kontekstu telefonu, ADR-0009).
public func stuknij(_ rodzaj: ZdarzenieWejsciowe.Rodzaj, stan: StanEkranuBlokady, teraz: Int64, strefa: String, id: String, urzadzenie: String,
                    zrodlo: ZdarzenieWejsciowe.Zrodlo = .ekran_blokady, proZegarkaSklep: [Uprawnienie] = []) throws -> WynikIntencji {
  if stan.zablokowany { return .zablokowany } // F-03, N1: przed limitem i przed −1 (ADR-0008, 2026-10-26); bez linii
  let dzis = try dzienLokalny(ms: teraz, strefa: strefa)
  // KP-17: Pro, gdy potwierdza je stan od telefonu albo StoreKit zegarka (OR, proZegarka).
  let pro = proZegarka([.telefon(pro: stan.pro, wygasa: stan.proWaznoscDo)] + (proZegarkaSklep.isEmpty ? [] : [.zegarek(proZegarkaSklep)]), teraz: teraz)
  let miesiac = String(dzis.prefix(7))
  var dni = stan.dniWMiesiacu.filter { $0.dzien.hasPrefix(miesiac) }.map { DzienLimitu(data: $0.dzien, pro: $0.pro) }
  if rodzaj == .minus {
    if stan.wartosc == 0 { return .bezZmiany }
  } else if try wolaStraznika(rodzaj: rodzaj.rawValue) {
    // Aplikacja policzyła dzisiejszy dzień niedozwolony (zna dni z innych urządzeń) — intencja jej nie podważa; po zmianie daty liczy sama (ADR-0008 (6)).
    if dzis == stan.dzien && !stan.dzienDozwolony { return .limit }
    let start = try startDnia(WejscieDnia(dni: dni, dzis: dzis, teraz: teraz, ostatniPlus: stan.ostatniPlusMs, pro: pro))
    if !start.dozwolone { return .limit }
    if let z = start.zapis { dni.append(z) }
  }
  let zdarzenie = ZdarzenieWejsciowe(id: id, licznikId: stan.licznikId, rodzaj: rodzaj, rodzice: stan.glowa.map { [$0] } ?? [], czasMs: teraz,
                                     strefa: strefa, dzien: dzis, zrodlo: zrodlo, urzadzenie: urzadzenie, pro: pro)
  let nowy = stan.po(zdarzenie, dni: dni.map { DzienStanu(dzien: $0.data, pro: $0.pro) })
  return .zapisz(zdarzenie, nowy)
}

extension StanEkranuBlokady {
  func po(_ z: ZdarzenieWejsciowe, dni: [DzienStanu]) -> StanEkranuBlokady {
    po(z.rodzaj == .plus ? 1 : -1, glowa: z.id, czasMs: z.czasMs, dzien: z.dzien, dni: dni)
  }
}
