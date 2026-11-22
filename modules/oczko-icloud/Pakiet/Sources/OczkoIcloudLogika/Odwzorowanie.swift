// Odwzorowanie RekordIcloud (JSON z JS, src/domena/porty.ts) ↔ CKRecord (moduly.md „Kontrakt partii 7”): recordName = "<encja>:<klucz>",
// typ rekordu z Pola.typ (generator z icloud-tabele.json), pola = `pola` rekordu, zasób pliku (`encja = 'plik'`) jako CKAsset w polu `dane`.
// Liczby: Double tylko dla kolumn REAL (Pola.double), inne INT64 — typ pola w CloudKit nie może się zmieniać (schemat.ckdb).
import CloudKit
import Foundation

struct RekordJs {
  let encja: String
  let klucz: String
  let pola: [String: Any]   // String, NSNumber albo NSNull
  let plik: String?
}

enum Odwzorowanie {
  static let strefa = CKRecordZone.ID(zoneName: "Oczko", ownerName: CKCurrentUserDefaultName)

  static func idRekordu(encja: String, klucz: String) -> CKRecord.ID {
    CKRecord.ID(recordName: "\(encja):\(klucz)", zoneID: strefa)
  }
  /** "<encja>:<klucz>" → (encja, klucz); encja nie ma dwukropka, klucz złożony (json_array) może mieć. */
  static func rozbierz(_ id: CKRecord.ID) -> (encja: String, klucz: String)? {
    guard let i = id.recordName.firstIndex(of: ":") else { return nil }
    let encja = String(id.recordName[..<i])
    guard Pola.typ[encja] != nil else { return nil }
    return (encja, String(id.recordName[id.recordName.index(after: i)...]))
  }

  static func zJson(_ o: Any) -> RekordJs? {
    guard let d = o as? [String: Any], let encja = d["encja"] as? String, let klucz = d["klucz"] as? String, let pola = d["pola"] as? [String: Any] else { return nil }
    return RekordJs(encja: encja, klucz: klucz, pola: pola, plik: d["plik"] as? String)
  }

  /// Wartości pól na rekordzie (bazowym z pamięci pól systemowych albo nowym). Pole z wartością null → nil (usunięcie wartości w CloudKit).
  static func wypelnij(_ r: CKRecord, z j: RekordJs) {
    let double = Pola.double[j.encja] ?? []
    for (nazwa, v) in j.pola {
      if let s = v as? String { r[nazwa] = s as CKRecordValue }
      else if let n = v as? NSNumber { r[nazwa] = double.contains(nazwa) ? n.doubleValue as CKRecordValue : n.int64Value as CKRecordValue }
      else { r[nazwa] = nil }
    }
    if let p = j.plik { r[Pola.zasob] = CKAsset(fileURL: URL(fileURLWithPath: p)) }
  }

  /// CKRecord z serwera → słownik RekordIcloud dla JS; null dla obcego typu albo nazwy (rekord spoza kontraktu nie wchodzi do bazy).
  static func doJs(_ r: CKRecord) -> [String: Any]? {
    guard let n = rozbierz(r.recordID), Pola.typ[n.encja] == r.recordType else { return nil }
    let (encja, klucz) = (n.encja, n.klucz)
    var pola: [String: Any] = [:]
    var plik: Any = NSNull()
    for nazwa in r.allKeys() {
      let v = r[nazwa]
      if nazwa == Pola.zasob, let a = v as? CKAsset { plik = a.fileURL?.path ?? NSNull(); continue }
      if let s = v as? String { pola[nazwa] = s }
      else if let n = v as? NSNumber { pola[nazwa] = n }
    }
    return ["encja": encja, "klucz": klucz, "pola": pola, "plik": plik]
  }
}
