// Źródło konwersji na PDF i wynik dla JS (moduly.md „Kontrakt partii 6”, `naPdf`, `sprawdzPdf`; P-221 Q2a). Port KonwersjaWzoru (src/domena/porty.ts):
// `ZrodloWzoru` = { rodzaj: 'adres', adres } | { rodzaj: 'word', sciezka } | { rodzaj: 'obrazy', sciezki }. Wynik = JSON `{ ok: true, … }`
// albo `{ ok: false, powod }` z powodem z `Powod` (src/domena/bledy.ts).
import Foundation

public enum PowodWzoru: String, CaseIterable, Error, Sendable {
  case brakSieci = "brak_sieci", przekroczonoCzas = "przekroczono_czas", odmowa, pusty, anulowano, uszkodzony, zaDuze = "za_duze", bledneDane = "bledne_dane", zapis
}

public enum ZrodloKonwersji: Equatable, Sendable {
  case adres(URL)
  case word(URL)
  case obrazy([URL])
}

/// Tylko http(s) z hostem (jak `adresStrony` w src/przypadki-uzycia/wzor.ts); `file:`/`javascript:` → `bledne_dane`.
public func adresStrony(_ tekst: String) -> URL? {
  guard let u = URL(string: tekst.trimmingCharacters(in: .whitespaces)), let s = u.scheme?.lowercased(), s == "http" || s == "https",
        let h = u.host, !h.isEmpty else { return nil }
  return u
}

public func zrodloKonwersji(_ json: String) throws -> ZrodloKonwersji {
  guard let o = (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any], let rodzaj = o["rodzaj"] as? String else {
    throw PowodWzoru.bledneDane
  }
  switch rodzaj {
  case "adres":
    guard let a = o["adres"] as? String, let u = adresStrony(a) else { throw PowodWzoru.bledneDane }
    return .adres(u)
  case "word":
    guard let s = o["sciezka"] as? String, !s.isEmpty else { throw PowodWzoru.bledneDane }
    return .word(URL(fileURLWithPath: s))
  case "obrazy":
    guard let s = o["sciezki"] as? [String], !s.isEmpty, s.allSatisfy({ !$0.isEmpty }) else { throw PowodWzoru.bledneDane }
    return .obrazy(s.map { URL(fileURLWithPath: $0) })
  default:
    throw PowodWzoru.bledneDane
  }
}

/// Powód, gdy konwersja nie skończyła się w limicie czasu (E2-A3): strona WWW, która się nie ładuje, = brak sieci (zlecenie czeka w skrzynce);
/// plik lokalny (Word) nie zależy od sieci, więc dostaje własny powód i komunikat o czasie, nie o sieci.
public func powodPrzekroczeniaCzasu(plikLokalny: Bool) -> PowodWzoru {
  plikLokalny ? .przekroczonoCzas : .brakSieci
}

/// Kod HTTP strony po załadowaniu: 401/403 → `odmowa` (logowanie), inne ≥ 400 → `pusty` (BR-WZR-007 S3), 2xx/3xx i brak kodu → nil.
public func powodHttp(_ kod: Int?) -> PowodWzoru? {
  guard let k = kod else { return nil }
  if k == 401 || k == 403 { return .odmowa }
  return k >= 400 ? .pusty : nil
}

public func wynikOk(_ pola: [String: Any]) -> String {
  var o = pola
  o["ok"] = true
  return json(o)
}
public func wynikBlad(_ p: PowodWzoru) -> String { json(["ok": false, "powod": p.rawValue]) }

private func json(_ o: [String: Any]) -> String {
  guard let d = try? JSONSerialization.data(withJSONObject: o, options: [.sortedKeys]), let s = String(data: d, encoding: .utf8) else {
    return #"{"ok":false,"powod":"zapis"}"#
  }
  return s
}

/// Papier wydruku strony WWW i Worda (kontrakt: Letter dla regionu US i CA, A4 dla pozostałych [OCENA 05]).
public enum Papier: Equatable, Sendable {
  case letter, a4
  public var rozmiarPt: (szerokosc: Double, wysokosc: Double) {
    switch self {
    case .letter: return (612, 792)
    case .a4: return (595.28, 841.89)
    }
  }
}
public func papier(region: String?) -> Papier {
  guard let r = region?.uppercased() else { return .a4 }
  return r == "US" || r == "CA" ? .letter : .a4
}
