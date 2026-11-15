# Audyt: Programista — Oczko — 2026-11-15 (recenzja niezależna BT zmiany watchOS 10.0)
Commit: b7fc49de (diff `761b9551..b7fc49de`, sesja BS) · Tryb: audit (rola 08), zakres zawężony poleceniem BT · Środowisko: Linux, Node v22.23.4, `npm ci` = 0; bez Xcode i kompilatora Swift (kompilacji celu zegarka nie da się tu uruchomić); sieć: dokumentacja Apple (JSON) i raw.githubusercontent.com dostępne.

## Podsumowanie
**Werdykt: Z UWAGAMI.** Zmiana jest kompletna: wszystkie miejsca, które ustalają albo sprawdzają minimum zegarka, mają 10.0; minimum iOS 18.0 nietknięte (test to pilnuje). Test spójności był czerwony z właściwego powodu na 9631b8e4 (5 × „Expected 10.0 / Received 11.0”) i jest zielony na b7fc49de; pełny `npm test -- --ci`: 608/608 zestawów, 7408/7408 testów, typecheck 0. Dokumenty są zgodne z KO-061, a stare decyzje nie były edytowane (w `docs/decyzje.md` i errata tylko dopisane linie). Główna uwaga: skaner API z watchOS 11 działa (sonda: API z listy wykryte), ale lista ma 7 nazw przeniesionych z Treningu i przepuszcza typowe API SwiftUI z watchOS 11 (sonda: `onScrollGeometryChange`, `MeshGradient` niewykryte), więc teksty „0 API z watchOS 11” twierdzą więcej, niż test sprawdza. Rzeczywistą bramą jest kompilacja celu w „Jakość · iOS” (run 43699331260 na b7fc49de był w toku w chwili odczytu).

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P2 | D | Skaner API z watchOS 11 ma wąską listę (3 z 7 pozycji nie są z watchOS 11), a nazwa testu i P-819 twierdzą „0 API z watchOS 11” | otwarte |
| 08-programista-002 | P3 | D | „Jakość · iOS” buduje zegarek, ale nie sprawdza jego `MinimumOSVersion`; rozjazd wyszedłby dopiero w `testflight.yml` | otwarte |
| 08-programista-003 | P3 | D | Godzina decyzji w P-819 („ok. 09:58 UTC”) jest późniejsza niż commity BS (09:15–09:22 UTC) | otwarte |
| 08-programista-004 | P3 | D | „13 plików” w P-819, ADR-0006 i teście, a cel zegarka ma 14 plików Swift | otwarte |
| 08-programista-005 | P3 | D | Nagłówek ADR-0006 i zdanie w `docs/architektura/README.md:5` nadal czytają się jak „watchOS 11” | otwarte |

## Linia bazowa i założenia
Najlepsza w klasie zmiana minimum systemu: (1) jedna wartość we wszystkich miejscach, które ją ustawiają (konfiguracja celu → projekt Xcode → `Info.plist`) i sprawdzają (kontrola artefaktu), z testem, który pada przy rozjeździe; (2) dowód zgodności API z kompilatora (Swift zgłasza błąd przy użyciu API nowszego niż deployment target bez `#available`), a skan tekstowy tylko jako tania kontrola dodatkowa, opisana tak, jak naprawdę działa; (3) iOS bez zmian; (4) dokumenty: nowy wpis zamiast edycji starej decyzji. Wzorzec: Trening (minimum zegarka 10.0, Trening @ 2d97581 plik `targets/watch-app/expo-target.config.js` wiersz 7, odczyt raw, `bt-recenzja-watchos10-dowody.txt` §10).

Wymiary pokrycia roli 08 (zakres zawężony): ścieżki zapisu — sprawdzone, brak (zmiana nie dotyka schematu ani kolejki zegarka; kod Swift bez zmian w diffie); obsługa błędów — nie dotyczy; typy na granicach — nie dotyczy; system projektowy — nie dotyczy; i18n — nie dotyczy (README i dokumenty, bez tekstów interfejsu); wydajność — nie dotyczy; testy na właściwym poziomie — sprawdzone (znalezisko 001, 002); dostępność — sprawdzone, brak zmian (`AccessibilityNotification.Announcement` watchOS 10.0 wg dokumentacji Apple, dowody §6); liczby konfiguracyjne — sprawdzone: `MIN_WATCHOS` w module konfiguracji `src/konfiguracja.ts:36`. Soczewki: recenzent szukający ścieżki bez testu (001, 002), programista czytający pierwszy raz (004, 005). Zmian w rejestrze założeń nie proponuję.

## Pokrycie
| Obszar / pliki | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| Diff `761b9551..b7fc49de` (20 plików) poza `bs-*.txt` | tak, w całości | `git diff`; raportów autora nie czytałem przed własną oceną |
| Wszystkie wystąpienia minimum zegarka w repo (bez `archiwum/`, `node_modules/`) | tak | `git grep` na „watchOS 11”, „MIN_WATCH”, „WATCHOS_DEPLOYMENT”, „11.0” przy watch/zegar/minimum |
| Generator projektu (`@bacons/apple-targets` 5.0.0) | tak | `bt-recenzja-watchos10-dowody.txt` §9 |
| Test spójności i skaner, sonda | tak | dowody §1, §2, §5 |
| Dostępność API użytych w `targets/watch` | wybrane (SwiftUI, StoreKit, Accessibility użyte w `Aplikacja.swift`) | dowody §6; pełnej listy symboli nie da się sprawdzić bez kompilatora |
| Kompilacja celu zegarka z minimum 10.0 | nie (brak Xcode) | run 43699331260 w toku; dowody §12 |
| Teksty sklepu w `oczko-warsztat` (np. „wymaga watchOS 11”) | nie (repo prywatne, poza zakresem BT) | [DO USTALENIA] przy roli 10/11 |
| Dokumenty ADR-0006, ER-72, P-819…P-822, T-04 | tak | odczyt + dowody §10, §11 |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/jakosc/bt-recenzja-watchos10.md . --rola 08-programista` (kopia skryptu w scratchpadzie): wynik na końcu sekcji poniżej po ostatnim przebiegu.

Wynik: OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista (kod 0).

## Stosowalność listy kontrolnej
| Pozycja | Status | Wynik |
|---|---|---|
| Zad. 1 Kompletność (DEV-13) | dotyczy | ok — tabela niżej; nic nie zmienia minimum iOS |
| Zad. 2 Test i skaner (DEV-01, DEV-03) | dotyczy | znalezisko 08-programista-001, 002; test nie jest pusty ani tautologiczny |
| Zad. 3 Dokumenty | dotyczy | ok co do treści decyzji; znaleziska 003, 004, 005 (P3) |
| DEV-02 testy przed kodem | dotyczy | ok: 9631b8e4 (test, czerwony) przed 5d57160d (zmiana), 1/1 commit zmieniający zachowanie z testem wcześniej |
| DEV-04 testy, typecheck | dotyczy | ok: `npm test -- --ci` 608/608, 7408/7408, kod 0; typecheck kod 0 (dowody §3, §4); lint nie dotyczy (tylko `src/dane`, nietknięte) |
| DEV-05–DEV-10, DEV-12, DEV-15, DEV-16 | nie dotyczy | diff nie zmienia zapisu danych, schematu, parserów, tekstów interfejsu ani zasobów |
| DEV-11 | nie dotyczy | bez zmian wyglądu |
| DEV-14 sekrety | dotyczy | ok: diff bez kluczy i `.env` (przejrzany w całości) |

**Kompletność (zad. 1), `plik:linia`:**

| Miejsce | Stan | Ocena |
|---|---|---|
| `targets/watch/expo-target.config.js:13` `deploymentTarget: '10.0'` | zmienione | ok; generator przenosi do `WATCHOS_DEPLOYMENT_TARGET` (dowody §9) |
| `scripts/wydanie/kontrola-ipa.sh:12` `MIN_WATCH=10.0`, użycie `:31` | zmienione | ok |
| `src/konfiguracja.ts:36` `MIN_WATCHOS = '10.0'` | zmienione | ok |
| `tests/wydanie/dane/project.pbxproj:732`, `:855` | zmienione | ok (wzorzec ręczny, patrz 002) |
| `README.md:17` | zmienione | ok |
| `modules/oczko-reguly/Package.swift:10` | komentarz | ok (pakiet deklaruje tylko macOS; bez wpływu na build) |
| `docs/adr/0014-build-i-ci.md:38`, `docs/architektura/moduly.md:490`, `docs/architektura/e1-decyzje.md:12`, `docs/architektura/README.md:72`, `:85`, `docs/brd/wymagania.md:115`, `docs/brd/README.md:122` | zmienione | ok |
| `docs/jakosc/e1-ryzyka.md:307`, `docs/jakosc/e1/soczewki/soczewka-wydanie.md:28` | zostawione celowo | ok, powód w P-821 (dokumenty historyczne 07) |
| `docs/architektura/e0-rozpoznanie.md:119` | zostawione | ok: rozpoznanie E0 sprzed decyzji (historia); P-821 go nie wymienia — drobny brak w liście, nie znalezisko |
| `tests/wydanie/ikona-zegarka-pakiet.test.ts:31` `MinimumOSVersion: '11.0'` | zostawione | ok: odpis `Info.plist` z runu 41987399061 (dowód historyczny, test ikony nie czyta tej wartości); P-821 go nie wymienia |
| `app.json:20`, `targets/widget/expo-target.config.js:14`, `targets/share/expo-target.config.js:15` (18.0) | bez zmian | ok; test `tests/wydanie/zegarek-minimum-watchos.test.ts:32` pilnuje iOS 18.0 |

## Znaleziska

### 08-programista-001 · Skaner API z watchOS 11 ma wąską listę (3 z 7 pozycji nie są z watchOS 11), a nazwa testu i P-819 twierdzą „0 API z watchOS 11”
- Pozycja listy kontrolnej: DEV-01
- Poziom: P2
- Realność: brzegowy · Pewność: wysoka
- Rodzaj: D
- Dowód:
  - `tests/wydanie/watchos-dostepnosc.ts:6`: lista `API_WATCHOS_11`, 7 nazw z Treningu (aplikacji treningowej: `workoutEffortScore` itd.).
  - `tests/wydanie/zegarek-minimum-watchos.test.ts:63` „źródła zegarka (targets/watch): 0 API z watchOS 11 poza osłoną”.
  - `docs/decyzje.md:735` „0 API z watchOS 11 w 13 plikach”.
  - Sonda (dowody §5): `.handGestureShortcut` wykryte (kod 1), `.onScrollGeometryChange(…)` i `MeshGradient` — oba watchOS 11.0 wg dokumentacji Apple (dowody §6) — niewykryte. Dokumentacja Apple (dowody §6): `Previewable` watchOS 10.0, `ControlWidget` i `RelevanceConfiguration` watchOS 26.0 — nie są z watchOS 11; `ControlWidget` pod `#available(watchOS 11, *)` skaner przyjmuje (przypadek C). Fałszywe alarmy po bezpiecznej stronie: `#available(iOS 18, watchOS 11, *)` i `guard #available(watchOS 11, *) else` są zgłaszane jako brak osłony (przypadki A, B).
- Mechanizm: lista nazw zamiast danych o dostępności; `grep -n "API_WATCHOS_11\|0 API z watchOS 11" -r tests docs/decyzje.md docs/adr` → `tests/wydanie/watchos-dostepnosc.ts:6`, `tests/wydanie/zegarek-minimum-watchos.test.ts:63`, `docs/decyzje.md:735`, `docs/adr/0006-minimalne-wersje-ios-18-watchos-11.md:34`
- Powraca: nie (odziedziczone po Treningu)
- Wzorzec lub źródło: zasada wspólna 2 (deklaracja ≠ dowód); dokumentacja Apple JSON, odczyt 2026-11-15
- Kroki w aplikacji: brak drogi przez interfejs dziś (kod zegarka nie używa API z watchOS 11; ochronę daje kompilacja w `.github/workflows/jakosc-ios.yml:157`). Ryzyko: ktoś zaufa zielonemu testowi zamiast kompilacji.
- Opcje: (a) poprawić tylko twierdzenia: nazwa testu i opis „znane API z listy”, w liście usunąć albo opisać 3 pozycje spoza watchOS 11 — 10 min, bez zmiany ochrony; (b) jak (a) i dopisać do listy API z watchOS 11 sprawdzone w dokumentacji Apple, typowe dla SwiftUI (`onScrollGeometryChange`, `onScrollVisibilityChange`, `ScrollPosition`, `MeshGradient`, `matchedTransitionSource`, `Tab` — dowody §6) — 20 min, większa szansa wykrycia przed CI, ryzyko fałszywych alarmów przy krótkich nazwach (`Tab`). Rekomendacja: (b) bez `Tab`; dowodem pozostaje kompilacja.
- Test akceptacyjny: sonda z `onScrollGeometryChange` w kopii `targets/watch` daje kod 1; nazwy testu i P-819 nie twierdzą więcej niż lista.
- Status: otwarte

### 08-programista-002 · „Jakość · iOS” buduje zegarek, ale nie sprawdza jego `MinimumOSVersion`; rozjazd wyszedłby dopiero w `testflight.yml`
- Pozycja listy kontrolnej: DEV-01
- Poziom: P3
- Realność: brzegowy · Pewność: wysoka
- Rodzaj: D
- Dowód: test spójności czyta ręcznie edytowany wzorzec (`tests/wydanie/dane/project.pbxproj:732`), nie projekt po `prebuild`; zadanie `zegarek-ikona` buduje cel (`.github/workflows/jakosc-ios.yml:157`) i sprawdza tylko ikonę (`.github/workflows/jakosc-ios.yml:163`); `MinimumOSVersion` zegarka sprawdza dopiero `scripts/wydanie/kontrola-ipa.sh:31` w `.github/workflows/testflight.yml:217` (po Approve).
- Mechanizm: kontrola wartości na artefakcie tylko w workflowie wydania
- Powraca: nie
- Wzorzec lub źródło: ADR-0014 (kontrola artefaktu, `docs/adr/0014-build-i-ci.md:38`)
- Kroki w aplikacji: brak; koszt rozjazdu = jeden zmarnowany przebieg TestFlight
- Opcje: (a) jedna linia w kroku `.github/workflows/jakosc-ios.yml:163`: `plutil -extract MinimumOSVersion` = `MIN_WATCH` z `kontrola-ipa.sh` — minuta CI, zero nowych zależności; (b) zostawić (kontrola w testflight wystarcza) — taniej, później. Rekomendacja: (a).
- Test akceptacyjny: krok pada, gdy `deploymentTarget` celu ≠ `MIN_WATCH`.
- Status: otwarte

### 08-programista-003 · Godzina decyzji w P-819 („ok. 09:58 UTC”) jest późniejsza niż commity BS (09:15–09:22 UTC)
- Pozycja listy kontrolnej: DEV-13
- Poziom: P3
- Realność: realny · Pewność: wysoka
- Rodzaj: D
- Dowód: `docs/decyzje.md:735` „decyzja właściciela 2026-11-15 ok. 09:58 UTC”; `git log` (dowody §8): 9631b8e4 09:15:09Z … b7fc49de 09:22:58Z. Dziennik koordynatora ma wpis „15.11 09:59” — prawdopodobnie czas polski (08:59 UTC) [DO USTALENIA].
- Mechanizm: pomylona strefa czasu w zapisie decyzji
- Powraca: nie
- Wzorzec lub źródło: `docs/fakty-wlasciciela.md` (godziny z `TZ=Europe/Warsaw date`, nie z pamięci)
- Kroki w aplikacji: brak (rejestr decyzji)
- Opcje: (a) nowy wpis-sprostowanie z godziną UTC ustaloną z dziennika koordynatora; (b) poprawka przy najbliższym wpisie koordynatora. Rekomendacja: (b).
- Test akceptacyjny: godzina decyzji w rejestrze wcześniejsza niż pierwszy commit wykonania.
- Status: otwarte

### 08-programista-004 · „13 plików” w P-819, ADR-0006 i teście, a cel zegarka ma 14 plików Swift
- Pozycja listy kontrolnej: DEV-13
- Poziom: P3
- Realność: realny · Pewność: wysoka
- Rodzaj: D
- Dowód: `git ls-files targets/watch | grep -c swift` = 14, 1237 linii (dowody §7); czerwony przebieg ma 26 testów = 6 + 5 + 1 + 14 (dowody §2); `tests/wydanie/zegarek-minimum-watchos.test.ts:66` „13 w ocenie BR”, `docs/decyzje.md:735`, `docs/adr/0006-minimalne-wersje-ios-18-watchos-11.md:32`.
- Mechanizm: liczba przepisana z oceny BR bez sprawdzenia; test (`toBeGreaterThanOrEqual(13)`) nie wychwyci
- Powraca: nie
- Wzorzec lub źródło: zasada wspólna 17 (sprawdź liczby)
- Kroki w aplikacji: brak
- Opcje: (a) poprawić liczbę przy najbliższej zmianie tych plików; (b) zostawić z adnotacją w sprostowaniu z 003. Rekomendacja: (a) razem z 001.
- Test akceptacyjny: liczba w tekstach = liczba plików.
- Status: otwarte

### 08-programista-005 · Nagłówek ADR-0006 i zdanie w `docs/architektura/README.md:5` nadal czytają się jak „watchOS 11”
- Pozycja listy kontrolnej: DEV-13
- Poziom: P3
- Realność: brzegowy · Pewność: średnia
- Rodzaj: D
- Dowód: `docs/adr/0006-minimalne-wersje-ios-18-watchos-11.md:2` „Status: **przyjęta** (P-070 (1a))” bez wzmianki o uzupełnieniu (sekcja jest dopiero w linii 30); `docs/architektura/README.md:5` „na iOS 18 / iPadOS 18 / watchOS 11, zegarek od 2026-11-15 watchOS 10.0” — dwa minima zegarka w jednym zdaniu. Indeks `docs/architektura/e1-decyzje.md:12` ma już „uzupełniona (P-819)”.
- Mechanizm: zmiana dopisana na końcu, nagłówki bez odsyłacza
- Powraca: nie
- Wzorzec lub źródło: zasada wspólna 17 (zdanie o dwóch odczytaniach przepisz)
- Kroki w aplikacji: brak
- Opcje: (a) w linii 2 ADR dopisać „· uzupełniona 2026-11-15 (P-819: zegarek watchOS 10.0)”, w opisie zakresu architektury: „iOS 18 / iPadOS 18 / watchOS 10.0 (P-070, P-819)” — rola 05 albo wyjątek jak KO-062; (b) zostawić (tytuł zachowany celowo). Rekomendacja: (a) przy najbliższej sesji 05.
- Test akceptacyjny: nagłówek ADR i opis zakresu w architekturze podają jedno minimum zegarka.
- Status: otwarte

## Do sprawdzenia
- Kompilacja celu zegarka z `WATCHOS_DEPLOYMENT_TARGET = 10.0` (run 43699331260 „Jakość · iOS” na b7fc49de, w toku w chwili odczytu): jedyny pełny dowód zgodności API; bez niego werdykt dotyczy repo, nie binarium.
- Działanie na watchOS 10.6.2 (T-04, T-105–T-107, zegarek właściciela): poza zasięgiem CI (`macos-26` ma tylko watchOS 26.x wg `.github/scripts/jakosc/ensure-ios-platform.sh:17`).
- Teksty sklepu i strony w `oczko-warsztat`, jeśli podają wymagania systemowe zegarka: nie sprawdzono.

## Co działa dobrze i należy zachować
- Test spójności obejmuje wszystkie miejsca ustawiające wartość i pilnuje, że iOS zostaje 18.0 (`tests/wydanie/zegarek-minimum-watchos.test.ts:32`); czerwień przed zmianą z właściwego powodu (dowody §2).
- Skaner pomija komentarze i napisy, osłona kończy się z blokiem, `else` nie jest osłoną — przypadki mają testy (`tests/wydanie/zegarek-minimum-watchos.test.ts:39`–`57`).
- Dokumenty: tylko dopisane linie; P-070 nietknięte, sprostowanie P-290 nowym wpisem (P-820), wyjątek KO-062 nazwany z kontrolą zastępczą (P-821), cytat Apple w T-04 zgodny z surowym HTML (dowody §11), odwołanie do Treningu zgodne (dowody §10).

## Decyzje dla właściciela
Brak — wszystkie znaleziska są techniczne (P-087: koordynator). Puli P-825…P-826 nie użyłem.

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-001,08-programista-002,08-programista-004` (003 i 005: wpis koordynatora albo sesja 05).

Stan plików śledzonych przed commitem recenzji (`git status --porcelain`): tylko dwa nowe pliki tej recenzji (`?? docs/jakosc/bt-recenzja-watchos10.md`, `?? docs/jakosc/bt-recenzja-watchos10-dowody.txt`); kod BS nietknięty.

## Dodatek 2026-11-15: job „eksperymenty-wzoru” w runie 43699331260
Zlecenie koordynatora po raporcie. Dowody: `bt-recenzja-watchos10-dowody.txt` §13 (końcówki logów, bez pełnych logów).
- **Przyczyna:** w `testW1WordNaPdf` konwersja Word → PDF przez WebKit dla pliku „tekst” skończyła się `przekroczono_czas` (proces WebContent przestał odpowiadać), więc padły dwie asercje: `modules/oczko-wzor/TestyOknaMaszyn/Testy/EksperymentyTests.swift:34` i `:35`. Pliki „tabela” i „obraz” przeszły; pozostałe 5 testów zielonych. To czas działania symulatora/WebKit na runnerze, nie kompilacja ani kod zegarka.
- **Historia:** ten sam krok i ten sam test padały wcześniej: run 43396328570 (1dfcf7ca) i 43245531497 (2ed5215a) — po 6 porażek asercji, wszystkie w `testW1WordNaPdf` (wszystkie trzy pliki bez PDF). Na b7fc49de wynik jest lepszy (2 porażki, 1 plik z 3). **Nie jest regresją BS:** diff `761b9551..b7fc49de` nie dotyka `modules/oczko-wzor` ani `.github`.
- **Czy bramka:** nie. Job ma `continue-on-error: true` z opisem „INFORMACYJNIE: continue-on-error, nie blokuje e2e ani bramki” (`.github/workflows/jakosc-ios.yml:81`–`85`), a żaden job nie ma `needs` na nim (e2e zależy od `build`, `.github/workflows/jakosc-ios.yml:259`). Dla kandydata liczą się build, `zegarek-ikona` (cel zegarka z minimum 10.0 zbudowany: success) i e2e iPhone (w toku w chwili odczytu).
- **Ocena:** znany problem niezależny od zmiany watchOS 10, poza zakresem tej recenzji; werdykt bez zmian (Z UWAGAMI). Do sprawdzenia przez 08/07 osobno: test W1 „tekst” pada stale od co najmniej 12.11 — czy limit czasu konwersji na runnerze jest za krótki, czy konwersja tekstu naprawdę nie działa (różnica realna dla użytkownika importującego plik Word).
