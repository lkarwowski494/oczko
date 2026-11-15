# Ocena: zegarek Oczka na watchOS 10.0 (statyczna, bez zmian kodu)

Rola 07-jakosc, tryb audit · 2026-11-15 · sesja BR (zmiana zakresu przez koordynatora po diagnozie `docs/jakosc/zegarek-diagnoza-1161.md`).
Kod: 761b9551 (= 2ed5215a w `targets/watch`, bez różnic). Porównanie: `lkarwowski494/trening` @ 2d975814.
Decyzja właściciela (15.11 ok. 09:58 UTC, przez koordynatora): „Obniż do watchOS 10” — tylko zegarek, iOS zostaje 18. Zegarek właściciela: watchOS 10.6.2, nowszego nie dostanie.

## Wynik

**W kodzie zegarka nie ma żadnego API z watchOS 11.** Najwyższe wymaganie to dokładnie **watchOS 10.0** (dwa miejsca, niżej). Obniżenie minimum do 10.0 nie wymaga zmian w kodzie Swift, tylko w konfiguracji, kontroli `.ipa`, README i dokumentach.

Ostateczny dowód da kompilacja celu z minimum 10.0 w „Jakość · iOS”: „The compiler uses availability information in the SDK to verify that all of the APIs used in your code are available on the deployment target specified by your project. Swift reports an error at compile time if you try to use an API that isn't available.” (The Swift Programming Language, Control Flow, „Checking API Availability”; `swiftlang/swift-book` `TSPL.docc/LanguageGuide/ControlFlow.md:2213-2217`, odczyt 2026-11-15).

## Zakres przeczytanego kodu

Wszystkie pliki celu, 1237 linii: `targets/watch/Aplikacja.swift` (264), `targets/watch/Teksty.swift` (141, tablice tekstów i 4 funkcje na `Foundation`), `targets/watch/Wspolne/*.swift` (11 plików, 832 linie). Importy: `SwiftUI`, `WatchKit`, `WatchConnectivity`, `StoreKit` (tylko `Aplikacja.swift:5-8`); w `Wspolne/` wyłącznie `Foundation`, `Darwin` (`Wspolne/Dziennik.swift:4-8`) i warunkowe `#if canImport(OczkoReguly)` (`Wspolne/Haptyka.swift:7-9`, `Wspolne/Intencja.swift:5-7`, `Wspolne/Zegarek.swift:5-7`). Innego kodu cel nie kompiluje: frameworki z `targets/watch/expo-target.config.js:15`, bez podów i pakietów.

`Wspolne/` to Foundation i POSIX (`open`, `fstat`, `pread`, `write`, `fsync`, `ftruncate`, `rename`, `JSONDecoder`, `Calendar`, `TimeZone`, `DispatchQueue`) — wszystko od pierwszych wersji watchOS. Skan nowszych elementów biblioteki (`Mutex`, `Atomic`, `Synchronization`, `InlineArray`, `Span`, `Duration`, `Clock`, `Regex`, `formatted`, `FormatStyle`, `@Observable`, `@Entry`, `URL(filePath:)`, `count(where:)`, `~Copyable`) → 0 trafień.

## API z wymaganiem systemu (dokumentacja Apple, JSON `developer.apple.com/tutorials/data/documentation/…`, odczyt 2026-11-15)

| API | Miejsce | watchOS od | Uwagi |
|---|---|---|---|
| `onChange(of:initial:_:)` (domknięcie z dwoma parametrami) | `targets/watch/Aplikacja.swift:16` | **10.0** | najwyższe wymaganie; wariant `onChange(of:perform:)` jest od 7.0 |
| `AccessibilityNotification.Announcement(…).post()` (framework Accessibility) | `targets/watch/Aplikacja.swift:119` | **10.0** | najwyższe wymaganie |
| `tint(_:)` (ShapeStyle) | `targets/watch/Aplikacja.swift:254` | 9.0 | |
| `TimelineView`, `.periodic(from:by:)` | `targets/watch/Aplikacja.swift:245` | 8.0 | |
| `Transaction.currentEntitlements`, `revocationDate` | `targets/watch/Aplikacja.swift:134-136` | 8.0 | |
| `foregroundStyle(_:)`, `overlay(alignment:content:)` | `targets/watch/Aplikacja.swift:190`, `:193` | 8.0 | |
| `StateObject`, `scenePhase`, `accessibilityLabel(_:)` | `targets/watch/Aplikacja.swift:12-13`, `:194` | 7.0 | |
| `monospacedDigit()`, `contentShape`, `truncationMode` | `targets/watch/Aplikacja.swift:223`, `:258`, `:189` | 6.0 | |
| `WKInterfaceDevice.play(_:)`, `WKHapticType` (`.retry` itd.) | `targets/watch/Aplikacja.swift:96-103` | 2.0 | |
| `WCSession.transferUserInfo(_:)` | `targets/watch/Aplikacja.swift:128` | 2.0 | |

**API tylko od watchOS 11 do zastąpienia: brak.** Trening utrzymuje tę samą klasę ryzyka listą API z watchOS 11 (`handGestureShortcut`, `Previewable`, `ControlWidget` i in.), które muszą stać w `#available(watchOS 11, *)` (trening `tests/watch-availability.test.ts:9-11`); w Oczku żadne z nich nie występuje (grep po `targets/watch` → 0).

## Miejsca z 11.0 do zmiany

| # | Miejsce | Zmiana | Kto | Co pilnuje |
|---|---|---|---|---|
| 1 | `targets/watch/expo-target.config.js:13` | `deploymentTarget: '10.0'` (komentarz: nowa decyzja, ADR-0006) | 08 | prebuild → `WATCHOS_DEPLOYMENT_TARGET`; Xcode 26.6 poleca minimum 8.0 (`RECOMMENDED_WATCHOS_DEPLOYMENT_TARGET = 8.0`, jakosc-ios run 41987399061, krok „Diagnostyka”) |
| 2 | `scripts/wydanie/kontrola-ipa.sh:12` | `MIN_WATCH=10.0` | 08 | bez zmiany kontrola `.ipa` buildu 7 padnie na `:31` (dobry strażnik zapomnienia) |
| 3 | `src/konfiguracja.ts:36` | `MIN_WATCHOS = '10.0'` | 08 | stała nieużywana w kodzie (grep `MIN_WATCHOS` w `src`, `scripts`, `tests` → tylko definicja); spójność ręczna — patrz pkt 9 |
| 4 | `README.md:17` | „watchOS 10.0 i nowszy” | 08 | `tests/jakosc/readme.test.ts:68-72` porównuje README z pkt 1 — padnie, jeśli zapomnieć |
| 5 | `tests/wydanie/dane/project.pbxproj:732`, `:855` | `WATCHOS_DEPLOYMENT_TARGET = 10.0` | 08 | wzorzec dla testów ikony, manifestu i uprawnień; wartość nie jest asercją (spójność) |
| 6 | `modules/oczko-reguly/Package.swift:10` | komentarz „watchOS 10” | 08 | — |
| 7 | ADR-0006 (`docs/adr/0006-minimalne-wersje-ios-18-watchos-11.md:1`, `:11`, `:14`) | uzupełnienie z datą: zegarek 10.0, iOS 18 bez zmian; **bez zmiany nazwy pliku** (odwołania w dowodach `verify*.txt` i `docs/architektura/README.md:85`) | 05 | `kontrola-adr.mjs` |
| 8 | dokumenty: `docs/adr/0014-build-i-ci.md:38`, `docs/architektura/moduly.md:490`, `docs/architektura/README.md:72`, `docs/architektura/e1-decyzje.md:12`, `docs/brd/wymagania.md:115` i `docs/brd/README.md:122` (errata 01), `docs/jakosc/e1-ryzyka.md:307` i `docs/jakosc/e1/soczewki/soczewka-wydanie.md:28` (07), `docs/decyzje.md:76` (P-070: nowy wpis, nie edycja) | 11.0 → 10.0 dla zegarka | 05, 01, 07, K | — |
| 9 | **nowy test** (analogia trening `scripts/verify-native.mjs:67` i `tests/watch-availability.test.ts`) | (a) jedna wartość w pkt 1, 2, 3, 4; (b) skan `targets/watch` na listę API z watchOS 11 poza `#available(watchOS 11, *)` | 08 (test przed kodem: czerwony na 11.0 vs 10.0 przed zmianą) | `npm test` |

Workflow CI: wartości 11.0 brak (grep `.github` → 0). **Symulatora watchOS 10 runner nie ma:** obraz `macos-26` (wersja 20261102.0473.1) ma symulatory tylko watchOS 26.0–26.5 (`actions/runner-images`, `images/macos/macos-26-arm64-Readme.md`, wiersze 200–204, odczyt 2026-11-15). Trening też testuje zegarek tylko na watchOS 26 („simulatory watchOS 26.x (Series 11, SE 3, Ultra 3) są w obrazie”, trening `.github/workflows/watch-sim.yml:35`). Dowód zgodności API = kompilacja z minimum 10.0; dowód działania na watchOS 10 = zegarek właściciela (T-04, T-105–T-107 w `docs/wydanie/test-urzadzenia-build5.md`). Pobieranie starego środowiska symulatora — [DO USTALENIA], nie rekomenduję (Trening tego nie robi, koszt minut macOS i ryzyko niestabilności).

## Porównanie z Treningiem

| Ustawienie | Oczko | Trening |
|---|---|---|
| Minimum zegarka | 11.0 — `targets/watch/expo-target.config.js:13` | 10.0 — `trening:targets/watch-app/expo-target.config.js:7` |
| Kontrola minimum | `MinimumOSVersion` w `.ipa` — `scripts/wydanie/kontrola-ipa.sh:31` | `WATCHOS_DEPLOYMENT_TARGET = 10.0` w projekcie po prebuild — `trening:scripts/verify-native.mjs:67` |
| API z nowszego systemu | brak (ta ocena) | lista z osłoną `#available` — `trening:tests/watch-availability.test.ts:9-11` |
| Symulator w CI | watchOS 26 (`macos-26`) | watchOS 26 — `trening:.github/workflows/watch-sim.yml:35` |
| Test na urządzeniu | zegarek właściciela niedostępny przy 11.0 (diagnoza 1161) | zegarek właściciela, watchOS 10.6.2 — `trening:docs/18-przekazanie.md:280` |

## Ryzyka zmiany

| Ryzyko | Realność | Kontrola |
|---|---|---|
| API z 10.0 przeoczone przy przyszłym obniżeniu poniżej 10 | teoretyczny | pkt 9 (b); minimum 10.0 jest dolną granicą kodu |
| Wygląd na watchOS 10 inny niż na symulatorze 26 (metryki czcionek, odstępy) | brzegowy | T-04 i zrzut z zegarka właściciela |
| Rozjazd wartości 11.0/10.0 między plikami | realny bez pkt 9 | pkt 2 i 4 łapią część; pkt 9 (a) całość |
| Dane użytkownika | brak: bez zmiany schematu i formatu kolejki zegarka; aplikacja zegarka nie była dotąd zainstalowana u nikogo z watchOS 10 | — |

Koszt: 08 ok. 45 min (zmiany 1–6 i test 9), 05 ok. 20 min (ADR, dokumenty), CI „Jakość · iOS” ok. 30 min (repo publiczne: minuty bez opłat). **Wymaga buildu 7** (zgoda właściciela na Approve).

## Nie sprawdzono

- Kompilacja z minimum 10.0 (macOS, CI) — po zmianie 08.
- Działanie na watchOS 10.6.2 — zegarek właściciela po buildzie 7.
- Lista modeli zgodnych z watchOS 11 — nieistotna po decyzji właściciela.
