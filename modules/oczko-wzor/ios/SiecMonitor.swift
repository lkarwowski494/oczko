// Monitor ścieżki sieciowej (ADR-0031 pkt 1, 07-jakosc-017): jeden `NWPathMonitor` na proces, startowany przy pierwszym użyciu (`siecStan` albo subskrypcja
// zdarzenia `siecZmiana`) i nigdy nie anulowany (po `cancel()` monitora nie da się uruchomić ponownie). Nic nie wysyła i nie zapisuje (prywatność: tylko lokalnie).
// Zdarzenie idzie tylko przy zmianie napisu stanu. Mapowanie statusu na napis: `stanSieci` (Pakiet/Sources/OczkoWzorLogika/Siec.swift, `swift test`).
import Foundation
import Network

final class SiecMonitor: @unchecked Sendable {
  static let shared = SiecMonitor()

  private let monitor = NWPathMonitor()
  private let kolejka = DispatchQueue(label: "oczko.siec")
  private let blokada = NSLock()
  private var wystartowany = false
  private var ostatni: StatusSciezki?
  private var odbiorca: ((String) -> Void)?
  private var ostatnioWyslany: String?

  /// Bieżący napis stanu: „nieznany”, dopóki monitor nie odpowie (pierwsza odpowiedź przychodzi zaraz po starcie).
  var stan: String {
    start()
    blokada.lock(); defer { blokada.unlock() }
    return stanSieci(ostatni)
  }

  func ustawOdbiorce(_ f: ((String) -> Void)?) {
    start()
    blokada.lock(); defer { blokada.unlock() }
    odbiorca = f
    ostatnioWyslany = nil
  }

  private func start() {
    blokada.lock(); defer { blokada.unlock() }
    guard !wystartowany else { return }
    wystartowany = true
    monitor.pathUpdateHandler = { [weak self] sciezka in self?.zmiana(Self.status(sciezka.status)) }
    monitor.start(queue: kolejka)
  }

  private func zmiana(_ status: StatusSciezki?) {
    blokada.lock()
    ostatni = status
    let napis = stanSieci(status)
    let wyslij = napis != ostatnioWyslany ? odbiorca : nil
    if wyslij != nil { ostatnioWyslany = napis }
    blokada.unlock()
    wyslij?(napis)
  }

  private static func status(_ s: NWPath.Status) -> StatusSciezki? {
    switch s {
    case .satisfied: return .satisfied
    case .unsatisfied: return .unsatisfied
    case .requiresConnection: return .requiresConnection
    @unknown default: return nil
    }
  }
}
