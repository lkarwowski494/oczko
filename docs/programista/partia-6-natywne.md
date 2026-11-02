# Partia 6 — kod natywny (K7): moduł `oczko-wzor` i cel `targets/share`
Stan 2026-10-26 ok. 20:30 UTC · gałąź lokalna `partia6-natywne` (od d817ce1) · **nic nie wypchnięte** (P-241: kod natywny do okna maszyn). Zakres: moduly.md „Kontrakt partii 6” (moduł Swift `modules/oczko-wzor`, cel `targets/share`, eksperymenty W1–W3), P-218 (1)–(6), P-220 R1a, P-234, P-237 (2), P-243.

## Co jest
| Część | Pliki | Sprawdzone tutaj (Linux) |
|---|---|---|
| Logika czysta (polityka płótna, papier Letter US/CA i A4, źródło konwersji z JSON, wynik JSON z powodami `Powod`, kod HTTP → `odmowa`/`pusty`, migawka P-243, dni od pracy, rodzaj z UTI, zapis zlecenia z manifestem na końcu, limit WZOR_MAKS_MB) | `modules/oczko-wzor/Pakiet/` (SwiftPM `OczkoWzorLogika`), stałe z `src/konfiguracja.ts` przez `scripts/natywne/generuj-stale.mjs` (`StaleWzoru.swift`, `Pakiet/stale.json`) | `swift test` (Swift 6.2 Linux): czerwone przed kodem (brak symboli), potem **15/15** |
| Most JS | `modules/oczko-wzor/index.ts` (`requireOptionalNativeModule` — build bez modułu dostaje `null`; `WidokWzoruNatywny` przez `requireNativeViewManager`) | `tsc --strict` kod 0 |
| Moduł Expo | `ios/OczkoWzorModule.swift` (`naPdf`, `sprawdzPdf`, `skanerDostepny`, `skanuj`, widok `OczkoWzor`), `ios/WidokWzoru.swift` (PDFView + `PDFPageOverlayViewProvider` z PKCanvasView na stronę, znacznik `wzor-znacznik`, detektor pierwszego rysika, zapis po `RYSUNEK_ZAPIS_MS`, przy zmianie strony, zamknięciu i tle, `onZakreslenia`), `ios/KonwersjaNaPdf.swift` (WKWebView → `UIPrintPageRenderer`, obrazy → PDF), `ios/SprawdzeniePdf.swift`, `ios/Skaner.swift` (VisionKit), `OczkoWzor.podspec` (źródła `ios/**` + pakiet logiki wprost) | tylko `swiftc -parse` (UIKit/PDFKit/PencilKit nie istnieją na Linuksie) — **kompilacja nieweryfikowana** |
| Cel share | `targets/share/expo-target.config.js` (`entitlements` App Group — P-234), `Info.plist` (reguła aktywacji SUBQUERY, bez TRUEPREDICATE: PDF ≤ 1, Word ≤ 1, obrazy ≤ 20, adres ≤ 1, każdy załącznik w tych typach), `ShareViewController.swift`, `Arkusz.swift` (SwiftUI, stany R1a), `Teksty.swift` (generator), `Wspolne/` (kopie pakietu: `scripts/natywne/kopie.json`) | `swiftc -typecheck` Teksty + Wspolne; reszta `-parse` |
| Teksty celu share | generator w `tests/adaptery/teksty-natywne.test.ts` (tabela `udostepnij.*` + wybrane `wspolne`, `projekty`, `wzor`) i test „każdy klucz Teksty.t/tl w Swift celu share jest w tabeli” | jest: 7/7 |
| Eksperymenty W1–W3 | `modules/oczko-wzor/TestyOknaMaszyn/EksperymentyTests.swift`, korpus `TestyOknaMaszyn/korpus/{tekst,tabela,obraz}.docx` (`generuj-korpus.mjs`), test spec `Testy` w podspecu | korpus: ZIP poprawny (`zipfile.testzip`) |

`env -u NODE_PATH npm run verify` w worktree: kod 0, **2436/2436** (kontrola Swift 0 błędów: znaleziono i poprawiono kolizję nazw `Konwersja.swift` w module → `ios/KonwersjaNaPdf.swift`).

## Okno maszyn — kolejność (koordynator)
1. Wcześniej w repo (08, nie ten commit): `app.json` — plugin celów zna `targets/share` (już jest `@bacons/apple-targets`: cele z katalogu `targets/`), `expo-screen-orientation` 57.0.3 (K7 partii, wiersz ADR-0016), adapter `src/platforma/wzor.ts` na `modules/oczko-wzor`.
2. `npx expo prebuild --platform ios --clean`, potem `node scripts/wydanie/uprawnienia-celow.mjs ios/Oczko.xcodeproj/project.pbxproj` — oczekiwany wiersz `OczkoUdostepnij\t…generated.entitlements` z `group.com.apps4brew.knitting` (P-234).
3. Build symulatora (`xcodebuild -workspace ios/Oczko.xcworkspace -scheme Oczko -sdk iphonesimulator -configuration Debug build`) — pierwsza prawdziwa kompilacja Swift modułu i celu; błędy typów spodziewane do poprawki na miejscu.
4. **W1–W3 (P-261, 2026-10-27: właściciel bez Maca → CI):** pakiet SwiftPM `modules/oczko-wzor/TestyOknaMaszyn/` (źródła `Zrodla/` to dowiązania do `ios/KonwersjaNaPdf.swift`, `ios/SprawdzeniePdf.swift` i `Pakiet/Sources/OczkoWzorLogika` — bez kopii; testy `Testy/EksperymentyTests.swift`, korpus `Testy/korpus/`), uruchamiany w zadaniu `eksperymenty-wzoru` w `jakosc-ios.yml` (`xcodebuild test` na symulatorze iPhone; **informacyjnie**: `continue-on-error`, bez wpływu na e2e i bramkę; wiersze „W1/W2/W3” w podsumowaniu, log w artefakcie `eksperymenty-wzoru`). Test spec `Testy` w podspecu usunięty (wymagał prebuild i `pod install`). Lokalnie na macOS: `cd modules/oczko-wzor/TestyOknaMaszyn && xcodebuild test -scheme OczkoWzorEksperymenty -destination 'platform=iOS Simulator,name=iPhone 17'`.
   - W1 (`testW1WordNaPdf`, `testW1StronaBezSieciToBrakSieci`): 3 × `.docx` → PDF, ≥ 1 strona, tekst w `tekst`/`tabela`; adres bez sieci → `brak_sieci`. Porażka = Word w podglądzie zastępczym 5a (`pdf_sha256 = NULL`) — decyzja koordynatora.
   - W2 (`testW2DuzyPdf`): PDF 300 stron ≈ 100 MB w `PDFView` (sam PDFKit; `WidokWzoru` to ExpoView, poza pakietem): czas otwarcia, przejście na stronę 300, przyrost `phys_footprint`. Płynność przewijania i pamięć na iPadzie — lista „tylko urządzenie”.
   - W3 (`testW3PolitykaPoPierwszymRysiku`): polityka płótna (`.pencilOnly` po pierwszym rysiku, bez narzędzia płótno bez interakcji); „palec nie rysuje po rysiku” — lista „tylko urządzenie” (ryzyko szczątkowe P-226).
5. `swift test` pakietu logiki w CI: `jakosc-ios.yml` uruchamia dziś tylko `modules/oczko-reguly` — dopisanie kroku `cd modules/oczko-wzor/Pakiet && swift test` należy do 07/08 (poza zakresem tego commita).

## [DO USTALENIA] i ryzyka
- **Kompilacja nieweryfikowana:** cały kod UIKit/PDFKit/PencilKit/WebKit/VisionKit sprawdzony tylko parserem. Miejsca najbardziej ryzykowne: układ współrzędnych nakładki strony (`PDFPageOverlayViewProvider` — czy nakładka nie jest odwrócona; znacznik liczony od góry strony), przewijanie palcem przy `.pencilOnly` (gesty przodka PDFView), `minimumNumberOfTouches = 2` dla trybu zakreślacza (wewnętrzny UIScrollView PDFView), `viewPrintFormatter` WKWebView poza oknem (może wymagać dołączenia do okna), sygnatura `decidePolicyFor … decisionHandler` w SDK iOS 26.
- **Kilka zdjęć z arkusza = jedno zlecenie** (P-248 D1a): manifest ma `sciezki`, `WejscieZlecenia.pliki([URL])`, ta sama nazwa dwóch zdjęć dostaje numer; `swift test` 17/17.
- **„Video link” z arkusza** (P-246 S4a): zlecenie `rodzaj: 'film'` → film projektu w aplikacji, bez konwersji.
- **„New project” w arkuszu** = `projektId: null` (aplikacja zapyta o projekt w arkuszu skrzynki) — bez tworzenia projektu w rozszerzeniu.
- **Język arkusza** (P-248 D2a): `jezyk` z koperty migawki (`jezykMigawki`), bez niego pierwszy obsługiwany język systemu (`jezykArkusza`).
- Liczba stron w podglądzie arkusza (`wzor.wiersz_opis` „PDF · 6 pages”) pominięta: rozszerzenie nie dekoduje pliku (kontrakt) — pokazuje sam rodzaj.
- Reguła aktywacji (predykat SUBQUERY) do sprawdzenia na urządzeniu: Safari (strona), Pliki (PDF, .docx), Zdjęcia (1 i 20), poczta (załącznik PDF).
- Teksty celu share: przy nowych językach generator wpisze je sam (test porówna plik); klucze spoza tabeli wykrywa test.

## Po przeglądzie kodu (2026-10-26 ok. 21:30 UTC)
- Widok: jeden prop `dokument` (`wzorId`, `plikPdf`, `rysunki`, `obroty`) zamiast `plikPdf` + `rysunki` — kolejność propsów w Expo nieokreślona; zmiana wzoru najpierw zapisuje kreski starego pod jego `wzorId` (zdarzenia `onRysunek`/`onStukniecie` niosą `wzorId`). Rysunki wczytywane tylko przy zmianie wzoru (JS `useMemo`), więc +1 nie nadpisuje płótna starszym plikiem.
- Kreski zapisane przy zamykaniu ekranu: pliki `<wzorId>__<strona>__<uuid>.pkdrawing` w `katalogRysunkow`; JS odzyskuje je przy następnym otwarciu (`odzyskajRysunki`). M1-084: plik znika dopiero po udanym zapisie albo odrzuceniu trwałym (zła strona, wzór w koszu); przy błędzie zapisu zostaje, trasa pokazuje alert błędu zapisu (raz, do udanego zapisu), a odzysk bierze najnowszy plik strony. Widok dostaje najnowszy plik oczekujący strony zamiast rysunku z bazy (`widokWzoru` z `katalogOczekujacych`), żeby nowa kreska nie dała pliku bez kresek z nieudanego zapisu.
- Obrót strony: `PDFPage.rotation` w pamięci dokumentu (plik bez zmian). [DO SPRAWDZENIA w oknie]: współrzędne przytrzymania i znacznika na obróconej stronie.
- Przytrzymanie liczone w `pdf.displayBox` (jak nakładka); `skanerDostepny` na wątku głównym; `decisionHandler` z `@Sendable` (sygnatura SDK iOS 18).
- Rozszerzenie: błąd kolejnego zlecenia cofa wcześniejsze z tego samego udostępnienia.
- Otwarte z przeglądu: podwójna kopia pliku w rozszerzeniu (kopia tymczasowa + kopia do skrzynki) na wątku głównym — do pomiaru z plikiem 100–200 MB w oknie (W2), ewentualnie `moveItem` z kopii tymczasowej.

## Lista „tylko urządzenie” do TestFlight (P-261, P-226; 2026-10-27)
Czego nie sprawdzi CI (symulator dotyka tylko palcem, nie ma kamery ani prawdziwych okien iPadOS). Właściciel: iPad bez Apple Pencil i iPhone. Każdy punkt: wynik tak/nie i zrzut do `oczko-warsztat` (raport E2 partii 6).
| # | Co | Urządzenie | Kryterium |
|---|---|---|---|
| U1 | Wzór na iPadzie: pion, poziom, Split View ⅓ i ½, Slide Over — wąskie okno = układ telefonu, kolumna treści ≤ 640 pt na pozostałych ekranach | iPad | NFR-UKL-001: 0 obciętych i nakładających się elementów |
| U2 | Zakreślacz palcem (BR-WZR-008): rysuje jednym palcem, dwa palce przewijają; „Cofnij” | iPad | kreski zostają po zamknięciu i ponownym otwarciu |
| U3 | Bez narzędzia: palec przewija PDF, przytrzymanie stawia znacznik rzędu | iPad, iPhone | znacznik na właściwej wysokości, także na obróconej stronie |
| U4 | Duży PDF (100–200 MB, ~300 stron): otwarcie, przewijanie do końca (W2 na urządzeniu) | iPad | bez zacięć widocznych gołym okiem, bez zamknięcia aplikacji |
| U5 | Udostępnij do Oczka: Safari (strona), Pliki (PDF, .docx), Zdjęcia (1 i 20), Poczta (załącznik PDF); „New project”; bez sieci → skrzynka; język arkusza = język aplikacji | iPhone, iPad | zlecenie w skrzynce, wzór w wybranym projekcie |
| U6 | Skaner stron (VisionKit) | iPhone, iPad | PDF ze skanu, strony w kolejności |
| U7 | Orientacja (P-259): licznik i pozostałe ekrany w pionie na iPhonie, wzór obraca się; iPad obraca wszystko | iPhone, iPad | brak obrotu poza wzorem na iPhonie |
| U8 | Kreski przy wyjściu do tła i zamknięciu aplikacji w trakcie rysowania | iPad | kreski odzyskane przy następnym otwarciu |
| U9 | Start po instalacji (P-271, Trening L-029): usunięcie aplikacji → instalacja z TestFlight → otwarcie → natychmiastowe wyjście do ekranu głównego → ponowne otwarcie (powtórzyć 3×; między powtórzeniami można zamknąć aplikację z przełącznika) | iPhone | za każdym razem licznik albo lista projektów, nigdy ekran trybu awaryjnego |
| U10 | Word → PDF na telefonie (P-282, zabezpieczenie W1): „Add pattern” → plik .docx z tekstem, z tabelą i z obrazem (Pliki albo Udostępnij z Poczty) | iPhone | wzór się otwiera, tekst, tabela i obraz widoczne; brak pustej strony na końcu |
| U11 | Ekran nie gaśnie na wzorze (P-284 (2)): wzór otwarty dłużej niż czas automatycznej blokady telefonu, bez dotykania | iPhone, iPad | ekran nie gaśnie (jak na liczniku); po wyjściu ze wzoru i z licznika gaśnie normalnie |
| U12 | Zimny start po instalacji (P-286, przebieg 126 scen. 01: pierwsze stuknięcie przy zimnym starcie nie dało +1): usunięcie aplikacji → instalacja z TestFlight → otwarcie → natychmiast, gdy widać licznik, jedno stuknięcie +1 (powtórzyć 3×) | iPhone | liczba 1 za każdym razem — stuknięcie nie ginie |
**Ryzyko szczątkowe nazwane (P-226):** zachowanie z prawdziwym rysikiem — przełączenie na `.pencilOnly` po pierwszym dotyku rysikiem, palec nie rysuje po rysiku, odrzucanie dłoni (BR-WZR-004 S1–S2, BR-WZR-008 S4). Sprawdza je tylko test polityki (W3) i system (ADR-0012); test z rysikiem wymagałby zakupu (decyzja właściciela).
