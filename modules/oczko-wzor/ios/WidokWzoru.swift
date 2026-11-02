// Widok wzoru (moduly.md „Kontrakt partii 6”, ADR-0011, ADR-0012; P-218 (1)–(3), Q2a; P-220 W5a, W6a): PDFView z płótnem PencilKit nad każdą
// stroną (`PDFPageOverlayViewProvider`, iOS 16+). Rysunki to osobna warstwa (PKDrawing na stronę w pliku z magazynu) — widok nigdy nie zapisuje
// do pliku PDF, bez OCR, bez wycinania i łączenia stron. Stan (strona, znacznik, rysunki, narzędzie, polityka) przychodzi z JS; widok rysuje
// i zgłasza zdarzenia. Kolory: zakreślacz = token `kolor.zakreslacz` (#F6E04A), pióro i znacznik = `kolor.wzor.znacznik` (#26282C) — design-spec.
import ExpoModulesCore
import PDFKit
import PencilKit
import UIKit
import UIKit.UIGestureRecognizerSubclass

struct Znacznik: Equatable {
  let strona: Int
  let y: Double        // ułamek wysokości strony od góry (0–1), układ strony bez /Rotate
  let wysokosc: Double // wysokość rzędu jako ułamek
  let pozaStrona: Bool
  let kierunek: Int    // 1 w dół, -1 w górę
  let etykieta: String // etykieta VoiceOver z `wzor.znacznik_a11y_*` (P-237 (2))
  let napis: String    // widoczny napis zakładki z JS: „Row 48 ↑” albo „Row 61 · page end” (design-spec, F-26)
  let przedSchematem: Bool
  let akcjaNastepnaStrona: String // nazwa akcji VoiceOver „Move to next page”; pusty = brak (nie ma następnej strony albo pas jest na stronie)
}

struct ChipNotatkiNatywny: Equatable {
  let id: String
  let strona: Int
  let y: Double        // góra rzędu, ułamek wysokości strony (jak znacznik)
  let wysokosc: Double
  let etykieta: String // „Row 6: ujmowanie…” albo „2 notes” (teksty z JS)
  let a11y: String
}

/// Chip o wyglądzie 28 pt z obszarem dotyku ≥ 44 pt (obszar dotyku rozszerzony o 8 pt z każdej strony).
final class ChipPrzycisk: UIButton {
  override func point(inside punkt: CGPoint, with zdarzenie: UIEvent?) -> Bool {
    bounds.insetBy(dx: -8, dy: -8).contains(punkt)
  }
}

private func kolor(_ hex: UInt32) -> UIColor {
  UIColor(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
}
private let KOLOR_ZAKRESLACZA = kolor(0xF6E04A) // tokeny.json kolor.zakreslacz
private let KOLOR_GRAFIT = kolor(0x26282C)      // tokeny.json kolor.wzor.znacznik

/// Wykrywa pierwsze dotknięcie rysikiem w dowolnym miejscu widoku (P-218 Q2a); nigdy nie rozpoznaje gestu, nie blokuje dotyków.
final class DetektorRysika: UIGestureRecognizer {
  var naRysik: (() -> Void)?
  override init(target: Any?, action: Selector?) {
    super.init(target: target, action: action)
    cancelsTouchesInView = false
    delaysTouchesBegan = false
    delaysTouchesEnded = false
  }
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    if touches.contains(where: { $0.type == .pencil }) { naRysik?() }
    state = .failed
  }
}

/// Pas znacznika: dotyk tylko na zakładce i uchwycie wysokości (reszta pasa przepuszcza dotyk do strony, więc przewijanie i rysowanie działają); element „adjustable” dla VoiceOver.
final class PasZnacznika: UIView {
  var obszaryDotyku: [CGRect] = []
  var naKrok: ((Int) -> Void)?
  override func point(inside punkt: CGPoint, with zdarzenie: UIEvent?) -> Bool {
    obszaryDotyku.contains { $0.insetBy(dx: -8, dy: -8).contains(punkt) }
  }
  override func accessibilityIncrement() { naKrok?(1) }
  override func accessibilityDecrement() { naKrok?(-1) }
}

/// Nakładka strony: płótno PencilKit, znacznik rzędu (pas z dwiema grafitowymi krawędziami i zakładką z etykietą) i chipy notatek.
final class NakladkaStrony: UIView {
  let plotno = PKCanvasView()
  var strona = 0
  var naNotatke: ((String) -> Void)?
  var naZnacznik: ((Int, Double, Double) -> Void)?   // strona, góra, wysokość po przeciągnięciu pasa albo uchwytu
  var naKrokZnacznika: ((Int) -> Void)?              // VoiceOver: zwiększ/zmniejsz = o rząd
  var naNastepnaStrona: (() -> Void)?                // VoiceOver: „Move to next page”
  private var chipy: [(dane: ChipNotatkiNatywny, widok: ChipPrzycisk)] = []
  var notatki: [ChipNotatkiNatywny] = [] { didSet { przebudujChipy() } }
  let pas = PasZnacznika()
  private let gora = UIView(), dol = UIView(), zakladka = UILabel(), uchwyt = UIView()
  private let krawedzPrzerywana = CAShapeLayer()
  private var przeciaganie: (y: Double, wysokosc: Double)?    // wartości na żywo w trakcie gestu (ułamki strony)
  private var poczatekGestu: (y: Double, wysokosc: Double) = (0, 0)
  var znacznik: Znacznik? { didSet { setNeedsLayout() } }

  override init(frame: CGRect) {
    super.init(frame: frame)
    plotno.backgroundColor = .clear
    plotno.isOpaque = false
    plotno.isScrollEnabled = false
    addSubview(plotno)
    for k in [gora, dol] { k.backgroundColor = KOLOR_GRAFIT; pas.addSubview(k) }
    zakladka.backgroundColor = KOLOR_GRAFIT
    zakladka.textColor = .white
    zakladka.font = .systemFont(ofSize: 13, weight: .semibold)
    pas.addSubview(zakladka)
    zakladka.isUserInteractionEnabled = true
    zakladka.addGestureRecognizer(UIPanGestureRecognizer(target: self, action: #selector(przesunPas(_:))))
    uchwyt.backgroundColor = .white
    uchwyt.layer.borderColor = KOLOR_GRAFIT.cgColor
    uchwyt.layer.borderWidth = 2
    uchwyt.layer.cornerRadius = 10
    uchwyt.isUserInteractionEnabled = true
    uchwyt.addGestureRecognizer(UIPanGestureRecognizer(target: self, action: #selector(zmienWysokosc(_:))))
    pas.addSubview(uchwyt)
    krawedzPrzerywana.strokeColor = KOLOR_GRAFIT.cgColor
    krawedzPrzerywana.lineWidth = 2
    krawedzPrzerywana.lineDashPattern = [6, 4]
    krawedzPrzerywana.fillColor = nil
    pas.layer.addSublayer(krawedzPrzerywana)
    pas.isUserInteractionEnabled = true
    pas.isAccessibilityElement = true
    pas.accessibilityIdentifier = "wzor-znacznik"
    pas.accessibilityTraits = .adjustable
    pas.naKrok = { [weak self] k in self?.naKrokZnacznika?(k) }
    addSubview(pas)
  }

  /// Przeciągnięcie zakładki przesuwa pas w pionie (w obrębie strony); po puszczeniu JS zapisuje miejsce, rząd zostaje.
  @objc private func przesunPas(_ g: UIPanGestureRecognizer) {
    guard let z = znacznik, bounds.height > 0 else { return }
    if g.state == .began { poczatekGestu = (z.y, z.wysokosc) }
    let y = min(max(poczatekGestu.y + Double(g.translation(in: self).y / bounds.height), 0), 1 - z.wysokosc)
    przeciaganie = (y, z.wysokosc)
    setNeedsLayout()
    if g.state == .ended { przeciaganie = nil; naZnacznik?(strona, y, z.wysokosc) }
    if g.state == .cancelled || g.state == .failed { przeciaganie = nil; setNeedsLayout() }
  }
  /// Przeciągnięcie uchwytu na dolnej krawędzi ustala wysokość rzędu (`wysokosc_rzedu`).
  @objc private func zmienWysokosc(_ g: UIPanGestureRecognizer) {
    guard let z = znacznik, bounds.height > 0 else { return }
    if g.state == .began { poczatekGestu = (z.y, z.wysokosc) }
    let w = min(max(poczatekGestu.wysokosc + Double(g.translation(in: self).y / bounds.height), 0.005), min(0.2, 1 - z.y))
    przeciaganie = (z.y, w)
    setNeedsLayout()
    if g.state == .ended { przeciaganie = nil; naZnacznik?(strona, z.y, w) }
    if g.state == .cancelled || g.state == .failed { przeciaganie = nil; setNeedsLayout() }
  }
  required init?(coder: NSCoder) { fatalError("init(coder:)") }

  /// Chip notatki (P-330 2A): obrys i tekst grafit `#26282C` na białym środku (stałe kolory strony, 14,76:1), wizualnie 28 pt, obszar dotyku ≥ 44 pt.
  private func przebudujChipy() {
    for c in chipy { c.widok.removeFromSuperview() }
    chipy = notatki.map { n in
      let b = ChipPrzycisk(type: .custom)
      b.setTitle("✎ \(n.etykieta)", for: .normal)
      b.setTitleColor(KOLOR_GRAFIT, for: .normal)
      b.titleLabel?.font = .systemFont(ofSize: 13, weight: .semibold)
      b.titleLabel?.lineBreakMode = .byTruncatingTail
      b.backgroundColor = .white
      b.layer.borderColor = KOLOR_GRAFIT.cgColor
      b.layer.borderWidth = 1.5
      b.layer.cornerRadius = 14
      b.contentEdgeInsets = UIEdgeInsets(top: 0, left: 8, bottom: 0, right: 8)
      b.accessibilityLabel = n.a11y
      b.accessibilityTraits = .button
      b.accessibilityIdentifier = "wzor-notatka-chip"
      b.addAction(UIAction { [weak self] _ in self?.naNotatke?(n.id) }, for: .touchUpInside)
      addSubview(b)
      return (n, b)
    }
    setNeedsLayout()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    plotno.frame = bounds
    for c in chipy {
      let w = min(max(c.widok.intrinsicContentSize.width, 28), bounds.width * 0.5)
      let srodek = (CGFloat(c.dane.y) + CGFloat(c.dane.wysokosc) / 2) * bounds.height
      c.widok.frame = CGRect(x: 4, y: srodek - 14, width: w, height: 28)
    }
    guard let z = znacznik else { pas.isHidden = true; return }
    pas.isHidden = false
    let h = bounds.height
    let gorny = CGFloat(min(max(przeciaganie?.y ?? z.y, 0), 1)) * h
    let wys = max(CGFloat(przeciaganie?.wysokosc ?? z.wysokosc) * h, 4)
    pas.frame = CGRect(x: 0, y: gorny, width: bounds.width, height: wys)
    gora.frame = CGRect(x: 0, y: 0, width: bounds.width, height: 2)
    dol.frame = CGRect(x: 0, y: wys - 2, width: bounds.width, height: 2)
    zakladka.text = " \(z.napis) "
    zakladka.sizeToFit()
    zakladka.frame.origin = CGPoint(x: 0, y: z.kierunek < 0 ? -zakladka.frame.height : wys)
    uchwyt.frame = CGRect(x: bounds.width - 36, y: wys - 10, width: 20, height: 20)
    pas.obszaryDotyku = [zakladka.frame, uchwyt.frame]
    // Koniec strony: krawędź od strony wyjścia (↑ góra, ↓ dół) przerywana (design-spec, `pozaStrona`).
    let y0: CGFloat = z.kierunek < 0 ? 1 : wys - 1
    let sciezka = UIBezierPath()
    sciezka.move(to: CGPoint(x: 0, y: y0))
    sciezka.addLine(to: CGPoint(x: bounds.width, y: y0))
    krawedzPrzerywana.path = sciezka.cgPath
    krawedzPrzerywana.isHidden = !z.pozaStrona
    gora.isHidden = z.pozaStrona && z.kierunek < 0
    dol.isHidden = z.pozaStrona && z.kierunek >= 0
    pas.accessibilityLabel = z.etykieta
    pas.accessibilityValue = z.napis
    pas.accessibilityCustomActions = z.akcjaNastepnaStrona.isEmpty ? [] : [UIAccessibilityCustomAction(name: z.akcjaNastepnaStrona) { [weak self] _ in self?.naNastepnaStrona?(); return true }]
  }
}

final class WidokWzoru: ExpoView, PDFPageOverlayViewProvider, PKCanvasViewDelegate, UIGestureRecognizerDelegate {
  let onRysunek = EventDispatcher()
  let onStukniecie = EventDispatcher()
  let onStrona = EventDispatcher()
  let onPowiekszenie = EventDispatcher()
  let onPierwszyRysik = EventDispatcher()
  let onZakreslenia = EventDispatcher()
  let onNotatka = EventDispatcher()
  let onZnacznik = EventDispatcher()
  let onZnacznikKrok = EventDispatcher()
  let onNastepnaStrona = EventDispatcher()

  private let pdf = PDFView()
  private var plik = ""
  private var wzorId = ""
  private var katalogRysunkow: URL?                    // pliki rysunków czekające na zapis w JS (odzyskiwane przy następnym otwarciu)
  private var nakladki: [Int: NakladkaStrony] = [:]   // strony wyświetlane
  private var rysunki: [Int: PKDrawing] = [:]         // bieżący rysunek każdej strony (wczytany albo narysowany)
  private var historia: [Int: [PKDrawing]] = [:]      // cofanie ostatniej kreski na stronie
  private var doZapisu = Set<Int>()
  private var zegar: Timer?
  private var narzedzie: NarzedzieWzoru = .brak
  private var narzedzieRysika: NarzedzieWzoru = .pioro // wybierane przy pierwszym rysiku bez narzędzia: Pen, w oknie compact Highlighter (P-360)
  private var polityka: PolitykaPlotna = .wylaczone
  private var znacznik: Znacznik?
  private var notatki: [ChipNotatkiNatywny] = []
  private var cofnij: Int?
  private var rysikZgloszony = false
  private var zKodu = false
  private var stronaDocelowa = 0
  private var oczekujacePowiekszenie: CGFloat?        // zapisane powiększenie czeka na układ widoku (dopasowanie do szerokości znane dopiero po layoucie)
  private var zegarPowiekszenia: Timer?
  private var ostatniePowiekszenie: Double = 1
  private let przytrzymanie = UILongPressGestureRecognizer()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    pdf.autoScales = true
    pdf.displayMode = .singlePageContinuous
    pdf.displayDirection = .vertical
    pdf.pageOverlayViewProvider = self
    pdf.isInMarkupMode = true // nakładki dostają dotyk (PDFKit iOS 16)
    addSubview(pdf)
    przytrzymanie.addTarget(self, action: #selector(przytrzymano(_:)))
    przytrzymanie.delegate = self
    pdf.addGestureRecognizer(przytrzymanie)
    let rysik = DetektorRysika(target: nil, action: nil)
    rysik.delegate = self
    rysik.naRysik = { [weak self] in self?.pierwszyRysik() }
    addGestureRecognizer(rysik)
    NotificationCenter.default.addObserver(self, selector: #selector(zmianaStrony), name: .PDFViewPageChanged, object: pdf)
    NotificationCenter.default.addObserver(self, selector: #selector(zmianaPowiekszenia), name: .PDFViewScaleChanged, object: pdf)
    NotificationCenter.default.addObserver(self, selector: #selector(zapiszTeraz), name: UIApplication.willResignActiveNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(zapiszTeraz), name: UIApplication.didEnterBackgroundNotification, object: nil)
  }
  deinit { NotificationCenter.default.removeObserver(self) }

  override func layoutSubviews() {
    super.layoutSubviews()
    pdf.frame = bounds
    zastosujPowiekszenie()
  }
  override func willMove(toWindow w: UIWindow?) {
    super.willMove(toWindow: w)
    if w == nil { zapiszTeraz() } // zamknięcie ekranu wzoru
  }
  func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith o: UIGestureRecognizer) -> Bool { true }

  // MARK: właściwości z JS

  /// Jeden prop zamiast plikPdf + rysunki (przegląd 2026-10-26): kolejność propsów w Expo nie jest określona, a zmiana wzoru musi
  /// najpierw zapisać kreski starego wzoru pod JEGO identyfikatorem, potem wczytać nowy plik, rysunki i obroty.
  func ustawDokument(wzorId nowy: String, plikPdf: String, rysunki r: [(Int, String)], obroty: [Int: Int], startStrona: Int, startPowiekszenie: Double) {
    if nowy != wzorId || plikPdf != plik {
      zapiszTeraz() // zdarzenia z dotychczasowym wzorId
      wzorId = nowy
      plik = plikPdf
      nakladki = [:]; rysunki = [:]; historia = [:]; doZapisu = []
      rysikZgloszony = false
      pdf.document = PDFDocument(url: URL(fileURLWithPath: plikPdf))
      for (s, sciezka) in r {
        guard let d = try? Data(contentsOf: URL(fileURLWithPath: sciezka)), let rys = try? PKDrawing(data: d) else { continue }
        rysunki[s] = rys
      }
      stronaDocelowa = startStrona // zapisana pozycja (07-jakosc-006): strona przed pierwszym zdarzeniem onStrona, powiększenie po układzie
      oczekujacePowiekszenie = startPowiekszenie > 0 ? CGFloat(startPowiekszenie) : nil
      ostatniePowiekszenie = startPowiekszenie > 0 ? startPowiekszenie : 1
      pdf.autoScales = true
      przejdzDoStrony(stronaDocelowa)
      zastosujPowiekszenie()
      zmianaStrony()
      zglosZakreslenia()
    }
    // Obrót widoku strony (P-246 S3a): tylko w pamięci dokumentu, plik bez zmian (P-218 (2)).
    if let d = pdf.document {
      for i in 0..<d.pageCount { d.page(at: i)?.rotation = obroty[i] ?? 0 }
    }
  }
  func ustawKatalogRysunkow(_ k: String) {
    katalogRysunkow = k.isEmpty ? nil : URL(fileURLWithPath: k, isDirectory: true)
  }
  func przejdzDoStrony(_ s: Int) {
    stronaDocelowa = s
    guard let d = pdf.document, s >= 0, s < d.pageCount, let p = d.page(at: s), pdf.currentPage != p else { return }
    pdf.go(to: p)
  }
  func ustawZnacznik(_ z: Znacznik?) {
    znacznik = z
    for (s, n) in nakladki { n.znacznik = z?.strona == s ? z : nil }
  }
  func ustawNotatki(_ n: [ChipNotatkiNatywny]) {
    notatki = n
    for (s, nak) in nakladki { nak.notatki = n.filter { $0.strona == s } }
  }
  func ustawNarzedzie(_ n: NarzedzieWzoru) {
    narzedzie = n
    for k in nakladki.values { zastosujNarzedzie(k.plotno) }
  }
  func ustawNarzedzieRysika(_ n: NarzedzieWzoru) { narzedzieRysika = n }
  func ustawPolityke(_ p: PolitykaPlotna) {
    polityka = p
    for k in nakladki.values { zastosujPolityke(k.plotno) }
    // Tryb zakreślacza palcem: jeden palec rysuje, dwa przewijają (design-spec W5a); poza nim przewija jeden palec.
    przewijanie()?.panGestureRecognizer.minimumNumberOfTouches = p == .dowolne ? 2 : 1
    przytrzymanie.isEnabled = p != .dowolne
  }
  func cofnijDo(_ n: Int) {
    defer { cofnij = n }
    guard let poprzedni = cofnij, n != poprzedni, let s = biezacaStrona(), var h = historia[s], let rys = h.popLast() else { return }
    historia[s] = h
    rysunki[s] = rys
    if let k = nakladki[s] { zKodu = true; k.plotno.drawing = rys; zKodu = false }
    zaplanujZapis(s)
  }

  // MARK: nakładki stron

  func pdfView(_ v: PDFView, overlayViewFor page: PDFPage) -> UIView? {
    guard let s = v.document?.index(for: page) else { return nil }
    if let n = nakladki[s] { return n }
    let n = NakladkaStrony()
    n.plotno.tag = s
    n.plotno.delegate = self
    zKodu = true
    n.plotno.drawing = rysunki[s] ?? PKDrawing()
    zKodu = false
    zastosujNarzedzie(n.plotno)
    zastosujPolityke(n.plotno)
    n.znacznik = znacznik?.strona == s ? znacznik : nil
    n.strona = s
    n.naNotatke = { [weak self] id in self?.onNotatka(["id": id]) }
    n.naZnacznik = { [weak self] strona, y, wysokosc in self?.onZnacznik(["wzorId": self?.wzorId ?? "", "strona": strona, "y": y, "wysokosc": wysokosc]) }
    n.naKrokZnacznika = { [weak self] delta in self?.onZnacznikKrok(["wzorId": self?.wzorId ?? "", "delta": delta]) }
    n.naNastepnaStrona = { [weak self] in self?.onNastepnaStrona([:]) }
    n.notatki = notatki.filter { $0.strona == s }
    nakladki[s] = n
    return n
  }
  func pdfView(_ v: PDFView, willEndDisplayingOverlayView o: UIView, for page: PDFPage) {
    guard let s = v.document?.index(for: page), let n = o as? NakladkaStrony else { return }
    rysunki[s] = n.plotno.drawing
    nakladki[s] = nil
  }

  private func zastosujNarzedzie(_ c: PKCanvasView) {
    switch narzedzie {
    case .zakreslacz, .brak: c.tool = PKInkingTool(.marker, color: KOLOR_ZAKRESLACZA, width: 18)
    case .pioro: c.tool = PKInkingTool(.pen, color: KOLOR_GRAFIT, width: 2)
    case .gumka: c.tool = PKEraserTool(.vector)
    }
  }
  private func zastosujPolityke(_ c: PKCanvasView) {
    let u = ustawieniePlotna(polityka)
    c.isUserInteractionEnabled = u.interakcja
    c.drawingPolicy = u.tylkoRysik ? .pencilOnly : .anyInput
  }

  // MARK: rysunki

  func canvasViewDrawingDidChange(_ c: PKCanvasView) {
    guard !zKodu else { return }
    let s = c.tag
    historia[s, default: []].append(rysunki[s] ?? PKDrawing())
    rysunki[s] = c.drawing
    zaplanujZapis(s)
  }
  private func zaplanujZapis(_ s: Int) {
    doZapisu.insert(s)
    zglosZakreslenia()
    zegar?.invalidate()
    zegar = Timer.scheduledTimer(withTimeInterval: Double(StaleWzoru.rysunekZapisMs) / 1000, repeats: false) { [weak self] _ in self?.zapiszTeraz() }
  }
  /// Rysunki zmienionych stron do plików w katalogu oczekujących → `onRysunek` (JS: zapiszRysunek, ADR-0012). Nazwa pliku niesie wzorId
  /// i stronę, więc plik zapisany przy zamykaniu ekranu (zdarzenie bez odbiorcy) JS odzyska przy następnym otwarciu (przegląd 2026-10-26).
  @objc func zapiszTeraz() {
    if zegarPowiekszenia != nil { zegarPowiekszenia?.invalidate(); zglosPowiekszenie() } // tło albo zamknięcie: nie gub powiększenia czekającego na opóźnienie
    zegar?.invalidate()
    zegar = nil
    guard !wzorId.isEmpty else { return }
    let k = katalogRysunkow ?? FileManager.default.temporaryDirectory
    try? FileManager.default.createDirectory(at: k, withIntermediateDirectories: true)
    for s in doZapisu.sorted() {
      let u = k.appendingPathComponent("\(wzorId)__\(s)__\(UUID().uuidString).pkdrawing")
      guard (try? (rysunki[s] ?? PKDrawing()).dataRepresentation().write(to: u, options: .atomic)) != nil else { continue } // zostaje w doZapisu: następna próba
      doZapisu.remove(s)
      onRysunek(["wzorId": wzorId, "strona": s, "plikTymczasowy": u.path])
    }
  }
  private func zglosZakreslenia() {
    let n = rysunki.values.reduce(0) { $0 + $1.strokes.filter { $0.ink.inkType == .marker }.count }
    onZakreslenia(["liczba": n])
  }

  // MARK: gesty i strony

  private func pierwszyRysik() {
    guard !rysikZgloszony else { return }
    rysikZgloszony = true
    // P-327 (a), 07-jakosc-026: bez wybranego narzędzia pierwsze dotknięcie rysikiem wybiera Pen (w oknie compact Highlighter, P-360; narzędzie ustawia JS propem narzedzieRysika),
    // a płótno przechodzi na pencilOnly od razu (nie czeka na JS), więc pierwsze pociągnięcie pisze.
    if narzedzie == .brak { ustawNarzedzie(narzedzieRysika) }
    ustawPolityke(.tylkoRysik)
    onPierwszyRysik([:])
  }
  @objc private func przytrzymano(_ g: UILongPressGestureRecognizer) {
    guard g.state == .began, let d = pdf.document else { return }
    let p = g.location(in: pdf)
    guard let strona = pdf.page(for: p, nearest: true) else { return }
    let wStronie = pdf.convert(p, to: strona)
    let ramka = strona.bounds(for: pdf.displayBox) // ramka wyświetlana (cropBox), jak nakładka i znacznik (przegląd 2026-10-26)
    guard ramka.height > 0 else { return }
    let y = min(max((ramka.maxY - wStronie.y) / ramka.height, 0), 1) // PDF: początek układu na dole strony
    onStukniecie(["wzorId": wzorId, "strona": d.index(for: strona), "y": y])
  }
  /// Zapisane powiększenie (krotność dopasowania do szerokości): ≈1 zostaje autoScales, większe ustawia scaleFactor w granicach PDFKit. Czeka na układ widoku (dopasowanie = 0 przed layoutem).
  private func zastosujPowiekszenie() {
    guard let p = oczekujacePowiekszenie, pdf.document != nil else { return }
    let dopasowanie = pdf.scaleFactorForSizeToFit
    guard bounds.width > 0, dopasowanie > 0 else { return }
    oczekujacePowiekszenie = nil
    if p > 1.01 {
      pdf.autoScales = false
      pdf.scaleFactor = min(max(dopasowanie * p, pdf.minScaleFactor), pdf.maxScaleFactor)
      przejdzDoStrony(stronaDocelowa) // zmiana skali przesuwa widok: wróć na zapisaną stronę
    }
  }
  /// Zmiana powiększenia (szczypanie albo układ) zgłaszana do JS z opóźnieniem; krotność dopasowania, więc obrót i inny rozmiar okna nie psują zapisu.
  @objc private func zmianaPowiekszenia() {
    guard pdf.document != nil, oczekujacePowiekszenie == nil else { return }
    zegarPowiekszenia?.invalidate()
    zegarPowiekszenia = Timer.scheduledTimer(withTimeInterval: 0.4, repeats: false) { [weak self] _ in self?.zglosPowiekszenie() }
  }
  private func zglosPowiekszenie() {
    zegarPowiekszenia = nil
    let dopasowanie = pdf.scaleFactorForSizeToFit
    guard !wzorId.isEmpty, dopasowanie > 0 else { return }
    let krotnosc = pdf.autoScales ? 1.0 : Double(pdf.scaleFactor / dopasowanie)
    guard krotnosc > 0, abs(krotnosc - ostatniePowiekszenie) > 0.005 else { return }
    ostatniePowiekszenie = krotnosc
    onPowiekszenie(["wzorId": wzorId, "powiekszenie": krotnosc])
  }
  @objc private func zmianaStrony() {
    guard let d = pdf.document, let s = biezacaStrona() else { return }
    if !doZapisu.isEmpty { zapiszTeraz() } // zmiana strony = zapis (kontrakt)
    onStrona(["strona": s, "stron": d.pageCount])
  }
  private func biezacaStrona() -> Int? {
    guard let d = pdf.document, let p = pdf.currentPage else { return nil }
    return d.index(for: p)
  }
  private func przewijanie() -> UIScrollView? {
    var kolejka: [UIView] = [pdf]
    while !kolejka.isEmpty {
      let v = kolejka.removeFirst()
      if let s = v as? UIScrollView { return s }
      kolejka.append(contentsOf: v.subviews)
    }
    return nil
  }
}
