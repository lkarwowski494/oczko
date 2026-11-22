// CKSyncEngine na prywatnej bazie (ADR-0005, uzupełnienie fix-7; moduly.md „Kontrakt partii 7” → „Moduł Swift”). Stan silnika trzyma JS w bazie
// (`synchronizacja.stan_silnika`, base64 z JSONEncoder) i podaje go w `uruchom`. Rekordy do wysłania przychodzą z JS (`wyslij`, skrzynka
// `zmiana_icloud`) i są w pamięci tylko do potwierdzenia; partia z serwera i potwierdzenie wysyłki idą do JS zdarzeniem, a silnik czeka na wynik
// obsługi w JS (jedna transakcja) — dopiero potem zapisuje się kolejny stan. `serverRecordChanged` → rekord serwera do JS (scalenie w `scal`
// i po `zmieniono_ms`), zmiana lokalna zostaje w skrzynce do następnej wysyłki. Pola systemowe ostatnio znanych rekordów (znacznik zmiany)
// w pliku w Caches — bez nich każda aktualizacja kończyłaby się konfliktem; utrata pliku kosztuje jedną wymianę z serwerem, nie dane.
import CloudKit
import Foundation

final class Silnik: CKSyncEngineDelegate, @unchecked Sendable {
  typealias Emituj = (_ nazwa: String, _ tresc: [String: Any]) -> Void
  private let kontener = CKContainer(identifier: "iCloud.com.apps4brew.knitting")
  private let emituj: Emituj
  private let kolejka = DispatchQueue(label: "oczko.icloud")
  private var silnik: CKSyncEngine?
  private var ostatniStan: CKSyncEngine.State.Serialization?
  private var oczekujace: [CKRecord.ID: (rekord: RekordJs?, nr: Int)] = [:]
  private var czekaNaJs: [String: CheckedContinuation<Bool, Never>] = [:]
  private var stanZablokowany = false   // JS nie zapisał partii: nie utrwalamy nowszego stanu (następny start pobierze ją jeszcze raz)
  private var brakMiejsca = false
  private var pobranieOdrzucone = false // partia odrzucona przez JS w trakcie pobrania strefy: koniec pobrania nie jest „pełny” (ADR-0005 uzupełnienie 2026-11-03)
  private lazy var systemowe = PamiecPolSystemowych()

  init(emituj: @escaping Emituj) { self.emituj = emituj }

  func statusKonta() async throws -> String {
    switch try await kontener.accountStatus() {
    case .available: return "dostepne"
    case .noAccount: return "brak_konta"
    case .restricted: return "ograniczone"
    case .temporarilyUnavailable: return "tymczasowo_niedostepne"
    case .couldNotDetermine: return "nieznany"
    @unknown default: return "nieznany"
    }
  }

  func uruchom(stanBase64: String?) {
    var stan: CKSyncEngine.State.Serialization?
    if let b = stanBase64, let d = Data(base64Encoded: b) { stan = try? JSONDecoder().decode(CKSyncEngine.State.Serialization.self, from: d) }
    let konfiguracja = CKSyncEngine.Configuration(database: kontener.privateCloudDatabase, stateSerialization: stan, delegate: self)
    let s = CKSyncEngine(konfiguracja)
    silnik = s
    stanZablokowany = false
    s.state.add(pendingDatabaseChanges: [.saveZone(CKRecordZone(zoneID: Odwzorowanie.strefa))])
  }

  func wylacz() async {
    await silnik?.cancelOperations()
    silnik = nil
    kolejka.sync { oczekujace.removeAll() }
  }

  /// Zmiany ze skrzynki: zapis albo usunięcie rekordu; wysyłka od razu. Brak miejsca w iCloud → błąd z kodem `brak_miejsca`, brak sieci → `siec`.
  func wyslij(_ json: String) async throws {
    guard let s = silnik, let tablica = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]] else { return }
    var zmiany: [CKSyncEngine.PendingRecordZoneChange] = []
    kolejka.sync {
      for z in tablica {
        guard let encja = z["encja"] as? String, let klucz = z["klucz"] as? String, let nr = (z["nr"] as? NSNumber)?.intValue, Pola.typ[encja] != nil else { continue }
        let id = Odwzorowanie.idRekordu(encja: encja, klucz: klucz)
        let rekord = (z["rekord"]).flatMap { $0 is NSNull ? nil : Odwzorowanie.zJson($0 as Any) }
        oczekujace[id] = (rekord, nr)
        zmiany.append(rekord == nil ? .deleteRecord(id) : .saveRecord(id))
      }
      brakMiejsca = false
    }
    s.state.add(pendingRecordZoneChanges: zmiany)
    do { try await s.sendChanges() } catch let e as CKError where e.code == .networkUnavailable || e.code == .networkFailure {
      throw BladWysylki("siec")
    }
    if kolejka.sync(execute: { brakMiejsca }) { throw BladWysylki("brak_miejsca") }
  }

  /// „Usuń też z iCloud” (P-229): strefa `Oczko` usunięta z prywatnej bazy; działa także przy wyłączonej synchronizacji.
  func usunStrefe() async throws {
    _ = try await kontener.privateCloudDatabase.modifyRecordZones(saving: [], deleting: [Odwzorowanie.strefa])
    systemowe.wyczysc()
  }

  func zakonczono(id: String, ok: Bool) {
    let c = kolejka.sync { czekaNaJs.removeValue(forKey: id) }
    c?.resume(returning: ok)
  }

  // MARK: - zdarzenia do JS z czekaniem na wynik obsługi

  private func doJs(_ nazwa: String, _ tresc: [String: Any]) async -> Bool {
    let id = UUID().uuidString
    return await withCheckedContinuation { (c: CheckedContinuation<Bool, Never>) in
      kolejka.sync { czekaNaJs[id] = c }
      var t = tresc
      t["id"] = id
      emituj(nazwa, t)
    }
  }
  private func stanBase64() -> Any {
    guard let s = ostatniStan, let d = try? JSONEncoder().encode(s) else { return NSNull() }
    return d.base64EncodedString()
  }
  private func json(_ o: Any) -> String {
    (try? JSONSerialization.data(withJSONObject: o)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
  }
  private func partia(rekordy: [CKRecord], usuniete: [CKRecord.ID]) async {
    for r in rekordy { systemowe.zapamietaj(r) }
    let r = rekordy.compactMap(Odwzorowanie.doJs)
    let u: [[String: String]] = usuniete.compactMap { id in Odwzorowanie.rozbierz(id).map { ["encja": $0.encja, "klucz": $0.klucz] } }
    if r.isEmpty && u.isEmpty { return }
    let ok = await doJs("partia", ["rekordy": json(r), "usuniete": json(u), "stanSilnika": stanBase64()])
    if !ok { stanZablokowany = true; pobranieOdrzucone = true }
  }

  // MARK: - CKSyncEngineDelegate

  func handleEvent(_ zdarzenie: CKSyncEngine.Event, syncEngine: CKSyncEngine) async {
    switch zdarzenie {
    case .stateUpdate(let e):
      ostatniStan = e.stateSerialization
      if !stanZablokowany { _ = await doJs("wyslane", ["wyslane": "[]", "stanSilnika": stanBase64()]) } // utrwalenie stanu bez zmian w skrzynce
    case .accountChange(let e):
      switch e.changeType {
      case .signIn: emituj("konto", ["zdarzenie": "zalogowano"])
      case .signOut: emituj("konto", ["zdarzenie": "wylogowano"])
      case .switchAccounts: systemowe.wyczysc(); emituj("konto", ["zdarzenie": "zmiana_konta"])
      @unknown default: break
      }
    case .willFetchRecordZoneChanges(let e) where e.zoneID == Odwzorowanie.strefa:
      // Pełne pobranie (M1-117): początek obejmuje wpisy wysłane w skrzynce JS; usuwa je tylko udany koniec bez odrzuconej partii.
      pobranieOdrzucone = stanZablokowany
      if !(await doJs("pobranie", ["faza": "poczatek"])) { pobranieOdrzucone = true } // JS nie oznaczył wpisów: koniec tego pobrania niczego nie usuwa
    case .fetchedRecordZoneChanges(let e):
      await partia(rekordy: e.modifications.map(\.record), usuniete: e.deletions.map(\.recordID))
    case .didFetchRecordZoneChanges(let e) where e.zoneID == Odwzorowanie.strefa:
      if e.error == nil && !pobranieOdrzucone && !stanZablokowany { _ = await doJs("pobranie", ["faza": "koniec"]) }
    case .sentRecordZoneChanges(let e):
      await wyslano(e, syncEngine: syncEngine)
    case .sentDatabaseChanges(let e):
      // Zapis strefy po włączeniu to też zapis: pełne miejsce w iCloud widać od razu (sterownik wysyła przy pustej skrzynce).
      if e.failedZoneSaves.contains(where: { $0.error.code == .quotaExceeded }) { kolejka.sync { brakMiejsca = true } }
    case .fetchedDatabaseChanges(let e):
      if e.deletions.contains(where: { $0.zoneID == Odwzorowanie.strefa }) { systemowe.wyczysc() } // strefa usunięta na innym urządzeniu
    default:
      break
    }
  }

  private func wyslano(_ e: CKSyncEngine.Event.SentRecordZoneChanges, syncEngine: CKSyncEngine) async {
    var potwierdzone: [[String: Any]] = []
    var zSerwera: [CKRecord] = []
    var ponow: [CKSyncEngine.PendingRecordZoneChange] = []
    var usunietyNaSerwerze: [CKRecord.ID] = []
    kolejka.sync {
      func potwierdz(_ id: CKRecord.ID) {
        guard let n = Odwzorowanie.rozbierz(id), let o = oczekujace.removeValue(forKey: id) else { return }
        potwierdzone.append(["encja": n.encja, "klucz": n.klucz, "nr": o.nr])
      }
      for r in e.savedRecords { systemowe.zapamietaj(r); potwierdz(r.recordID) }
      for id in e.deletedRecordIDs { systemowe.zapomnij(id); potwierdz(id) }
      for (id, _) in e.failedRecordDeletes { oczekujace.removeValue(forKey: id) } // usunięcie zostaje w skrzynce JS do następnej wysyłki
      for f in e.failedRecordSaves {
        let id = f.record.recordID
        switch f.error.code {
        case .serverRecordChanged:
          if let s = f.error.serverRecord { zSerwera.append(s) } // scalenie w JS; zmiana lokalna zostaje w skrzynce
          oczekujace.removeValue(forKey: id)
        case .zoneNotFound, .userDeletedZone:
          ponow.append(.saveRecord(id))
        case .quotaExceeded:
          brakMiejsca = true
          oczekujace.removeValue(forKey: id) // zostaje w skrzynce JS; ponowienie przy następnym wyslijZaleglosci
        case .unknownItem:
          // Rekord usunięty na serwerze = nagrobek dla nadawcy (ADR-0005 uzupełnienie 2026-11-03 pkt 4, M1-117): bez zapisu od nowa tutaj;
          // do JS jako usunięcie, reguła nagrobków zatrzymuje go (wpis oczekujący), wkłada szczyt do kosza i zapisuje od nowa ze skrzynki.
          systemowe.zapomnij(id)
          oczekujace.removeValue(forKey: id)
          usunietyNaSerwerze.append(id)
        default:
          oczekujace.removeValue(forKey: id) // inne błędy: zmiana zostaje w skrzynce JS
        }
      }
    }
    if !ponow.isEmpty {
      syncEngine.state.add(pendingDatabaseChanges: [.saveZone(CKRecordZone(zoneID: Odwzorowanie.strefa))])
      syncEngine.state.add(pendingRecordZoneChanges: ponow)
    }
    if !zSerwera.isEmpty { await partia(rekordy: zSerwera, usuniete: []) }
    if !usunietyNaSerwerze.isEmpty { await partia(rekordy: [], usuniete: usunietyNaSerwerze) }
    // Potwierdzenie także bez potwierdzonych rekordów po `unknownItem`: obsługa w JS wysyła zaległości (zapis od nowa ze skrzynki).
    if !potwierdzone.isEmpty || !usunietyNaSerwerze.isEmpty { _ = await doJs("wyslane", ["wyslane": json(potwierdzone), "stanSilnika": stanBase64()]) }
  }

  func nextRecordZoneChangeBatch(_ kontekst: CKSyncEngine.SendChangesContext, syncEngine: CKSyncEngine) async -> CKSyncEngine.RecordZoneChangeBatch? {
    let zmiany = syncEngine.state.pendingRecordZoneChanges.filter { kontekst.options.scope.contains($0) }
    return await CKSyncEngine.RecordZoneChangeBatch(pendingChanges: zmiany) { id in
      // Rekord spoza bieżących zmian (np. ze stanu poprzedniego procesu) → nil: silnik go porzuca, a skrzynka JS wyśle go ponownie.
      guard let o = self.kolejka.sync(execute: { self.oczekujace[id] }), let j = o.rekord, let typ = Pola.typ[j.encja] else { return nil }
      let r = self.systemowe.rekord(id) ?? CKRecord(recordType: typ, recordID: id)
      Odwzorowanie.wypelnij(r, z: j)
      return r
    }
  }
}

/// Pola systemowe (znacznik zmiany) ostatnio znanych rekordów: pamięć + plik w Caches (encodeSystemFields); bez danych użytkownika.
final class PamiecPolSystemowych: @unchecked Sendable {
  private var mapa: [String: Data] = [:]
  private let blokada = NSLock()
  private let plik: URL = {
    let k = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    return k.appendingPathComponent("icloud-pola-systemowe.plist")
  }()
  init() {
    if let d = try? Data(contentsOf: plik), let m = try? PropertyListDecoder().decode([String: Data].self, from: d) { mapa = m }
  }
  func rekord(_ id: CKRecord.ID) -> CKRecord? {
    blokada.lock(); defer { blokada.unlock() }
    guard let d = mapa[id.recordName], let u = try? NSKeyedUnarchiver(forReadingFrom: d) else { return nil }
    u.requiresSecureCoding = true
    return CKRecord(coder: u)
  }
  func zapamietaj(_ r: CKRecord) {
    let a = NSKeyedArchiver(requiringSecureCoding: true)
    r.encodeSystemFields(with: a)
    a.finishEncoding()
    blokada.lock(); mapa[r.recordID.recordName] = a.encodedData; blokada.unlock()
    zapisz()
  }
  func zapomnij(_ id: CKRecord.ID) { blokada.lock(); mapa.removeValue(forKey: id.recordName); blokada.unlock(); zapisz() }
  func wyczysc() { blokada.lock(); mapa.removeAll(); blokada.unlock(); zapisz() }
  private func zapisz() {
    blokada.lock(); let m = mapa; blokada.unlock()
    if let d = try? PropertyListEncoder().encode(m) { try? d.write(to: plik, options: .atomic) }
  }
}
