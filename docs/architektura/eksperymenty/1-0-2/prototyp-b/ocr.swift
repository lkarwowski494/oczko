// OCR zrzutów symulatora (Vision, bez zależności): dla każdego pliku PNG wypisuje JSON {plik, teksty[], czerwone} na stdout (jedna linia na plik).
// `czerwone` = liczba mocno czerwonych pikseli w górnym pasie 22% wysokości zrzutu (obszar Dynamic Island): zapasowy odczyt znacznika STALE bez OCR (krok 5 PB1).
// Użycie: ocr <plik.png> ...
import Foundation
import Vision
import AppKit

func czerwone(_ img: CGImage) -> Int {
  let w = img.width, h = Int(Double(img.height) * 0.22)
  guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(),
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
        let gora = img.cropping(to: CGRect(x: 0, y: 0, width: w, height: h)) else { return -1 }
  ctx.draw(gora, in: CGRect(x: 0, y: 0, width: w, height: h))
  guard let d = ctx.data else { return -1 }
  let p = d.bindMemory(to: UInt8.self, capacity: w * h * 4)
  var n = 0
  for i in 0..<(w * h) { let r = Int(p[i * 4]), g = Int(p[i * 4 + 1]), b = Int(p[i * 4 + 2]); if r > 180 && g < 90 && b < 90 { n += 1 } }
  return n
}

for sciezka in CommandLine.arguments.dropFirst() {
  var teksty: [String] = []
  var cz = -1
  if let obraz = NSImage(contentsOfFile: sciezka), let cg = obraz.cgImage(forProposedRect: nil, context: nil, hints: nil) {
    cz = czerwone(cg)
    let zadanie = VNRecognizeTextRequest()
    zadanie.recognitionLevel = .accurate
    zadanie.usesLanguageCorrection = false
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([zadanie])
    teksty = (zadanie.results ?? []).compactMap { $0.topCandidates(1).first?.string }
  }
  let json = try! JSONSerialization.data(withJSONObject: ["plik": (sciezka as NSString).lastPathComponent, "teksty": teksty, "czerwone": cz], options: [.sortedKeys])
  print(String(data: json, encoding: .utf8)!)
}
