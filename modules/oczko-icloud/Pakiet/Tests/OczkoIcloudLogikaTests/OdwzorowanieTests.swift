// Odwzorowanie RekordIcloud ↔ CKRecord na wektorach z wektory.json (08 partia 7). Wyrocznie po stronie TS (Jest): rekordZWiersza, nazwaRekordu,
// cloudkit/schemat.ckdb. Liczność: każdy test wypisuje „wykonano N z N” i pada przy N = 0 (tests/wspolne/xctest-specyfikacja.md, R-032).
import CloudKit
import Foundation
import XCTest
@testable import OczkoIcloudLogika

final class OdwzorowanieTests: XCTestCase {
  private func wektory() throws -> [String: Any] {
    let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("../../wektory.json").standardizedFileURL
    return try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
  }

  /// Typ pola w CKRecord jak w schemat.ckdb: STRING, INT64, DOUBLE, ASSET.
  private func typPola(_ wartosc: CKRecordValue?) -> String {
    guard let v = wartosc else { return "BRAK" }
    switch v {
    case is CKAsset: return "ASSET"
    case let n as NSNumber: return CFNumberIsFloatType(n) ? "DOUBLE" : "INT64"
    case is String: return "STRING"
    default: return "BRAK"
    }
  }

  func testRekordyZJsDoCkRecordIZPowrotem() throws {
    let rekordy = try XCTUnwrap(try wektory()["rekordy"] as? [[String: Any]])
    XCTAssertGreaterThan(rekordy.count, 0)
    var wykonano = 0
    for v in rekordy {
      let co = try XCTUnwrap(v["co"] as? String)
      let ck = try XCTUnwrap(v["ck"] as? [String: Any], co)
      let j = try XCTUnwrap(Odwzorowanie.zJson(try XCTUnwrap(v["rekord"], co)), co)
      if let p = j.plik { XCTAssertTrue(FileManager.default.createFile(atPath: p, contents: Data("%PDF-1.7".utf8)), co) }
      let r = CKRecord(recordType: try XCTUnwrap(Pola.typ[j.encja], co), recordID: Odwzorowanie.idRekordu(encja: j.encja, klucz: j.klucz))
      Odwzorowanie.wypelnij(r, z: j)
      XCTAssertEqual(r.recordType, ck["typ"] as? String, co)
      XCTAssertEqual(r.recordID.recordName, ck["nazwa"] as? String, co)
      XCTAssertEqual(r.recordID.zoneID.zoneName, "Oczko", co)
      let pola = try XCTUnwrap(ck["pola"] as? [String: String], co)
      XCTAssertEqual(Set(r.allKeys()), Set(pola.keys), "\(co): pole null nie istnieje w CKRecord")
      for (nazwa, typ) in pola { XCTAssertEqual(typPola(r[nazwa]), typ, "\(co): \(nazwa)") }
      let powrot = try XCTUnwrap(Odwzorowanie.doJs(r), co)
      XCTAssertEqual(powrot as NSDictionary, try XCTUnwrap(v["powrot"] as? NSDictionary, co), co)
      wykonano += 1
    }
    print("odwzorowanie iCloud: wykonano \(wykonano) z \(rekordy.count)")
    XCTAssertEqual(wykonano, rekordy.count)
  }

  func testRekordySpozaKontraktuPomijane() throws {
    let obce = try XCTUnwrap(try wektory()["obce"] as? [[String: String]])
    XCTAssertGreaterThan(obce.count, 0)
    var wykonano = 0
    for o in obce {
      let id = CKRecord.ID(recordName: try XCTUnwrap(o["nazwa"]), zoneID: Odwzorowanie.strefa)
      XCTAssertNil(Odwzorowanie.doJs(CKRecord(recordType: try XCTUnwrap(o["typ"]), recordID: id)), o["co"] ?? "")
      wykonano += 1
    }
    print("rekordy obce: wykonano \(wykonano) z \(obce.count)")
    XCTAssertEqual(wykonano, obce.count)
  }

  func testZlyJsonZJsOdrzucony() {
    XCTAssertNil(Odwzorowanie.zJson(["encja": 7, "klucz": "a", "pola": [String: Any]()] as [String: Any]))
    XCTAssertNil(Odwzorowanie.zJson(["encja": "projekt", "klucz": "a", "pola": "x"] as [String: Any]))
    XCTAssertNil(Odwzorowanie.zJson("nie obiekt"))
  }

  func testRozbiorNazwyPoPierwszymDwukropku() {
    let n = Odwzorowanie.rozbierz(Odwzorowanie.idRekordu(encja: "rysunek", klucz: "[\"wzor:01\",3]"))
    XCTAssertEqual(n?.encja, "rysunek")
    XCTAssertEqual(n?.klucz, "[\"wzor:01\",3]")
  }
}
