// Skaner stron (port SkanerStron; P-220 W7a; P-218 (1): jeden skan = jeden wzór, (2): prostowanie robi skaner). VNDocumentCameraViewController
// (iOS 13+); strony jako JPEG w katalogu tymczasowym → JS woła `naPdf({ rodzaj: 'obrazy' })`. Uprawnienie aparatu: istniejący tekst
// `cameraPermission` z app.json. Anulowanie → `anulowano`; brak dostępu do aparatu → `odmowa` (alert `wzor.brak_aparatu_opis`).
import AVFoundation
import ExpoModulesCore
import UIKit
import VisionKit

enum Skaner {
  @MainActor static func skanuj() async -> String {
    guard VNDocumentCameraViewController.isSupported else { return wynikBlad(.bledneDane) }
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .denied, .restricted: return wynikBlad(.odmowa)
    case .notDetermined: if !(await AVCaptureDevice.requestAccess(for: .video)) { return wynikBlad(.odmowa) }
    default: break
    }
    return await Prezenter().pokaz()
  }
}

@MainActor final class Prezenter: NSObject, VNDocumentCameraViewControllerDelegate {
  private var ciag: CheckedContinuation<String, Never>?
  private var trzymaj: Prezenter? // delegat żyje do zamknięcia skanera

  func pokaz() async -> String {
    await withCheckedContinuation { c in
      guard let gora = Prezenter.najwyzszy() else { c.resume(returning: wynikBlad(.zapis)); return }
      ciag = c
      trzymaj = self
      let s = VNDocumentCameraViewController()
      s.delegate = self
      gora.present(s, animated: true)
    }
  }
  private func koniec(_ k: VNDocumentCameraViewController, _ w: String) {
    k.dismiss(animated: true)
    ciag?.resume(returning: w)
    ciag = nil
    trzymaj = nil
  }
  func documentCameraViewController(_ k: VNDocumentCameraViewController, didFinishWith skan: VNDocumentCameraScan) {
    var sciezki: [String] = []
    for i in 0..<skan.pageCount {
      let u = FileManager.default.temporaryDirectory.appendingPathComponent("skan-\(UUID().uuidString)-\(i).jpg")
      guard let d = skan.imageOfPage(at: i).jpegData(compressionQuality: 0.85), (try? d.write(to: u)) != nil else {
        for p in sciezki { try? FileManager.default.removeItem(atPath: p) }
        koniec(k, wynikBlad(.zapis)); return
      }
      sciezki.append(u.path)
    }
    koniec(k, sciezki.isEmpty ? wynikBlad(.anulowano) : wynikOk(["sciezki": sciezki]))
  }
  func documentCameraViewControllerDidCancel(_ k: VNDocumentCameraViewController) { koniec(k, wynikBlad(.anulowano)) }
  func documentCameraViewController(_ k: VNDocumentCameraViewController, didFailWithError e: Error) { koniec(k, wynikBlad(.odmowa)) }

  static func najwyzszy() -> UIViewController? {
    let okno = UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first
    var v = okno?.rootViewController
    while let p = v?.presentedViewController { v = p }
    return v
  }
}
