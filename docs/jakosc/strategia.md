# Strategia testów Oczka (rola 07-jakosc, build)
Stan: E4 (przekazanie) · 2026-10-25 · STOP E4; E0–E3 przyjęte (P-090, P-091, P-092, P-096). Jedyne źródło definicji ukończenia funkcji w projekcie; rola 08 ją wykonuje. Wejścia: E0 ([`e0-rozpoznanie.md`](e0-rozpoznanie.md), P-090), E1 ([`e1-raport.md`](e1-raport.md), rejestr [`e1-ryzyka.md`](e1-ryzyka.md), P-091), wzorzec Treningu @928d0ff ([`e0/trening-wzorzec.md`](e0/trening-wzorzec.md)). Decyzje tej strategii mają ID `DS-nn`; na STOP E2 trafiają do `docs/decyzje.md`.

## 1. Macierz możliwości środowiska
Pełna, z dowodami: [`e0-rozpoznanie.md`](e0-rozpoznanie.md) §1. Skrót: Linux (kontener i `ubuntu-latest`) uruchamia Jest, `node:sqlite` (sprawdzone w Jest 29.7 na Node 22: `PRAGMA foreign_keys` = 1, 2026-10-25), fast-check, Stryker, Playwright. **Tylko macOS (`macos-26`):** `xcodebuild`, symulator iOS i watchOS, XCTest, Maestro iOS, `performAccessibilityAudit`, `plutil`/`codesign` na `.ipa`. **Tylko telefon:** lista P-090/P-091 (§8). Niczego z kolumny „tylko macOS” nie opisuje się jako sprawdzone, dopóki nie ma przebiegu CI z SHA.

## 2. Rejestr ryzyk
[`e1-ryzyka.md`](e1-ryzyka.md): 185 ryzyk, priorytet wysokie 129 / średnie 45 / niskie 11; każde z wyrocznią, poziomem i miejscem. Zmiany rejestru: rola 07 (dopisanie ryzyka przy nowej funkcji należy do DoD, §6).

## 3. Poziomy testów, narzędzia i progi
### Poziomy (najtańszy, który łapie awarię; ryzyko wysokie zależne od platformy dostaje też poziom wyżej)
| Poziom | Co łapie w Oczku | Narzędzie | Gdzie | Ryzyka (R, przykłady) |
|---|---|---|---|---|
| Kontrola repo (skrypt z plikiem-pułapką) | zakazane wzorce: `INSERT OR REPLACE`, `withExclusiveTransactionAsync`, `:memory:` poza testami i `adapter-node.ts`, kopiowanie ścieżki bazy, `expo-updates`, SDK awarii, `EXPO_PUBLIC_STORE_FAKE` poza buildem E2E, ceny w kodzie (P-089), sekrety `ASC_*` poza `environment: testflight`, wydana migracja zmieniona (SHA-256) | `scripts/jakosc/*.mjs` + `tests/jakosc/*.test.ts` (każda reguła: przypadek dobry i pułapka) | Linux, każdy push | strażnicy i build |
| Domena (czysty TS) | `limit`, `dostep`, `scal`, licznik, RD-11–RD-17, obliczenia F-38, maszyny stanów, mapowanie rodzajów zdarzeń | Jest (projekt `domena`, środowisko `node`), wektory JSON, fast-check | Linux, każdy push | R-018, R-036, R-092, R-098, R-133 |
| Dane | port bazy, kolejka, transakcje, UPSERT, kaskady, migracje na kopii, kosz 30 dni, archiwum `.oczko`, kopia ratunkowa | Jest (projekt `dane`, `node`) + adapter `node:sqlite` | Linux, każdy push | ścieżki utraty danych (`dane.md`) |
| Ekran | rola i etykieta VoiceOver, stan z macierzy, skutek w danych przez atrapę portów | `@testing-library/react-native` (projekt `ekrany`, `jest-expo/ios`) | Linux, każdy push | P-090 Q2a |
| Scenariusz w interpreterze | każdy krok YAML Maestro na drzewie dostępności przed symulatorem (wzór Treningu `tests/maestro-runner.ts`) | Jest | Linux, każdy push | E2E: selektory i kolejność |
| E2E | przepływ w prawdziwej aplikacji: +1, limit zawczasu, zakup na sztucznym sklepie, okno „Uczciwe zasady”, eksport/import, start awaryjny | Maestro na symulatorze iOS (build Release bez podpisu) | macOS CI | §5 |
| Natywny | pakiet reguł i rdzeń dziennika +1, logika wzoru, odwzorowanie iCloud na tych samych plikach JSON co Jest (wspólne wektory TS↔Swift); W1–W3 modułu wzoru na symulatorze (informacyjnie, P-261); XCTest po `expo prebuild` (intencja +1 w aplikacji, zegarek) i `performAccessibilityAudit`: **plan, nie wykonano** ([DO USTALENIA], §10 #11, 07-jakosc-006) | `swift test` w zadaniu `swift-test` i `xcodebuild test` w zadaniu `eksperymenty-wzoru` (`jakosc-ios.yml`) | macOS CI | Z07-11, Z07-12 |
| Artefakt | podpisany `.app` z `.ipa`: uprawnienia, Info.plist, manifest prywatności, osadzony zegarek, minimum systemu, tryby tła, brak śladów trybu testowego (błąd); katalogi `.lproj` i typ `.oczko` (uwaga) | `scripts/wydanie/kontrola-ipa.sh` (rola 10, ADR-0014; `PlistBuddy`, `plutil`, `codesign -d --entitlements`) | macOS CI, tylko build TestFlight; kontrola `.app` buildu E2E i osobny `scripts/jakosc/sprawdz-ipa.mjs`: **plan, nie wykonano** ([DO USTALENIA], Z07-19, 07-jakosc-006) | Z07-19 |
| Telefon | §8 | właściciel, TestFlight | telefon | P-090, P-091 |
| Mutacje | testy domeny, które nie mogą paść | ręczne mutanty `docs/jakosc/narzedzia/mutanty-e1.mjs` (w `jakosc:kontrole`); Stryker na `src/domena`: **plan, nie wykonano** (P-305: ręczne mutanty do 1.0) | Linux, każdy push / ręcznie | §3 DS-05 |

### Decyzje o narzędziach i progach (opcje, rekomendacja)
| ID | Pytanie | (a) | (b) | Rekomendacja i powód |
|---|---|---|---|---|
| DS-01 | Runner testów | **Jest 29 (jest-expo ~57) z `projects`: `domena` i `dane` w środowisku `node`, `ekrany` w `jest-expo/ios`** | `node --test` dla domeny i danych, Jest tylko dla ekranów | **(a)**: jeden runner jak Trening (`jest-expo/ios`), `node:sqlite` działa w Jest (sprawdzone); projekty `node` są szybkie i bez transformacji RN; (b) dwa raporty i dwie konfiguracje |
| DS-02 | Testy oczekujące (przed kodem) | **katalog `tests/akceptacja/` z własną konfiguracją `jest.akceptacja.config.js` i skryptem `npm run test:akceptacja`, poza `npm test`; 08 przenosi test do głównego zestawu w commicie, który go zazielenia** | test w głównym zestawie z `test.skip` z ID i datą | **(a)** (rekomendacja wzorców): główny zestaw zielony, czerwień widoczna w osobnym raporcie; skrypt sprawdza, że każdy test oczekujący pada z `NIEZAIMPLEMENTOWANE:` albo na asercji, nie na imporcie |
| DS-03 | Testy własności | **fast-check 4.10.2 (już w repo), 100 przypadków; ziarno stałe na push (`PROP_SEED` z SHA), losowe w przebiegu nocnym; kontrprzykład → test przykładowy** | tylko wektory | **(a)**, jak Trening (`PROP_SEED`); wektor przed własnością (moduł domeny) |
| DS-04 | Liczba przypadków nocą | **1 000 (`fc.configureGlobal({ numRuns })` w pliku przygotowania tylko przy `PROP_NOC=1`)** | 100 jak na push | **(a)**: rzadkie kontrprzykłady wychodzą w nocy bez spowalniania pushu; koszt 0 zł (repo publiczne). Stan: obsługa w `jest.fast-check.js` jest, ale ustawienie zmiennej nocnej w workflowie: **plan, nie wykonano** (DS-11: przebieg nocny po scaleniu do `main`, 07-jakosc-006) |
| DS-05 | Mutacje | **Stryker 9.6.1 (`command` runner na `npm run test:domena`) tylko `src/domena/**`, nocą, `break: null` do pomiaru bazowego; potem próg = wynik bazowy (decyzja przy E4 roli 12 albo audycie 07)** | ręczna próba mutacji (`docs/jakosc/narzedzia/mutanty-e1.mjs`) przy każdej zmianie domeny | **(a)** + narzędzie ręczne jako test E3 dla wektorów 02/05 (7/18 przeżywa dziś); Trening ma Strykera nocą. Stan: Stryker w Oczku: **plan, nie wykonano** (P-305: ręczne mutanty do 1.0) |
| DS-06 | Pokrycie kodu | **raport bez progu (`--coverage` w nocnym przebiegu); celem jest pokrycie ryzyk (§9), nie procent** | próg globalny (jak `jest.config.js` 0.1.0: 94–99%) | **(a)**: progi 0.1.0 dotyczą starego kodu i nagradzały testy atrap; nowy kod ma DoD (§6). Stan: skrypt `test:coverage` jest, raport w nocnym przebiegu: **plan, nie wykonano** (DS-11: po scaleniu do `main`, 07-jakosc-006) |
| DS-07 | E2E | **Maestro (wersja przypięta jedną zmienną `MAESTRO_VERSION` w `jakosc-ios.yml`, pusta = błąd, zainstalowana ≠ przypięta = błąd — zasada wspólna 21, 07-jakosc-005; Trening: zmienna repo, pusta = najnowsza; Java 17), build Release bez podpisu na `macos-26` raz → artefakt, części LPT z wagami** | Detox | **(a)**: wzorzec Treningu działa na SDK 56/57 (`e2e-ios.yml`), interpreter w Jest; Detox wymaga konfiguracji buildu testowego |
| DS-08 | Testy ekranów | **`@testing-library/react-native` w wersji z gałęzi 13.x zgodnej z React 19.2 (wersja ≥ 14 dni, ADR-0016), zapytania po roli i nazwie** | `react-test-renderer` (już w repo) | **(a)** (P-090 Q2a, Trening ^13.3.3); `react-test-renderer` nie daje zapytań po roli; dokładną wersję potwierdza E3 (`npm view`) |
| DS-09 | Lista stref testowych | **jedna lista w `tests/narzedzia/strefy.ts`: Europe/Warsaw, UTC, America/Los_Angeles, Pacific/Kiritimati (+14), Pacific/Pago_Pago (−11), Asia/Kolkata (+5:30), Australia/Lord_Howe (30 min DST), plus Asia/Tokyo (rynek nr 2, bez DST); przejścia z `przejsciaCzasu` dla roku bieżącego i następnego** | 7 stref Treningu bez Tokio | **(a)**: zbiór Treningu + rynek Japonii (kalendarz i cyfry, SD-36); jedna pętla w jednym zadaniu CI. Stan: pętla w `jakosc-linux.yml` uruchamia tylko `tests/narzedzia` (pomocniki stref i kluczy dni); domena przyjmuje strefę jako argument, a jej testy iterują po tej liście w zwykłym `npm test` (07-jakosc-006) |
| DS-10 | Format zrzutów wzorcowych | **zrzuty 04 (`docs/design/wzorce-zrzuty/`) porównywane tylko na symulatorze; aktualizacja wyłącznie commitem roli 04 z datą akceptacji, nigdy automatem** | automatyczne nadpisywanie przy różnicy | **(a)** (wzorzec zatwierdzony; sceptyk: zrzuty aktualizowane automatem nie mogą paść) |

### Zasady pisania testów (z soczewki sceptyka, obowiązują 07 i 08)
1. Wyrocznia z innego źródła niż kod: wektor z rejestru (06, 02, 05, BRD), własność, rachunek innym narzędziem albo decyzja z ID; nigdy wynik przepisany z uruchomienia.
2. Każdy strażnik (skrypt, grep) ma plik-pułapkę, na którym pada, i test „pusty katalog = błąd”.
3. Zbiory porównywane jako zbiory (tablica posortowana z typem), nie liczby ani teksty; pusta lista wyników to błąd testu, nie zaliczenie.
4. Oczekiwany błąd z klasą albo kodem (`powod: 'limit'`), nie „cokolwiek rzuca”.
5. Granice w trójkach: poniżej, na, powyżej (60 min, `wygasa = teraz`, 5 z 5 dni).
6. Czas tylko ze wstrzykniętego `Zegar`; zero `Date.now()` i asercji na czas zegarowy w testach jednostkowych (zasada roli 5).
7. Losowość tylko z ziarnem, które test wypisuje przy porażce.
8. Scenariusz E2E po każdej akcji zmieniającej stan ma `assertVisible` wartości; scenariusz bez asercji po akcji to błąd przeglądu.
9. Wszystko, co jest dowodem, biegnie w `npm run verify` albo w nazwanym zadaniu CI; skrypt spoza CI nie jest dowodem.

## 4. Dane testowe
| Dane | Skąd (wycinek prawdziwego pliku) | Kto i kiedy | Czyszczenie z danych osobowych |
|---|---|---|---|
| PDF wzorów do importu (F-24, BR-WZR-001) | wzory z domeny publicznej (np. książki o dzierganiu z Project Gutenberg) w kilku wariantach: tekstowy, skan, wielostronicowy; plus pliki z popularnych generatorów PDF (eksport z LibreOffice i z przeglądarki) z tekstem testowym | 07 w E3 (pobranie, licencja i adres w pliku opisu) | bez metadanych autora (`exiftool -all=` przed commitem; test sprawdza brak pól `Author`, `Creator` z nazwiskiem) |
| Dokument Word (BR-WZR-007, P-071 5a) | plik `.docx` z domeny publicznej albo zapisany przez LibreOffice z tekstu z domeny publicznej | 07 w E3 | jw. (`docProps/core.xml` bez osoby) |
| Archiwum `.oczko` (ADR-0004) | **od wersji 1.0:** archiwum wyeksportowane z buildu wydania na symulatorze w CI, zapisane w `tests/dane/archiwa/v<wersja>.oczko` przy każdym wydaniu | 07 audit przy wydaniu | dane syntetyczne wpisane przez scenariusz E2E, bez zdjęć osób (zdjęcia: wygenerowany obraz z EXIF GPS ustawionym celowo, żeby test usuwania metadanych miał co usunąć) |
| Baza poprzedniej wersji (`tests/bazy/vN.db`) | baza z buildu wydania (symulator, scenariusz „życie”) po każdym wydaniu; 0.1.0 poza testem (P-070) | 07 audit przy wydaniu | jw. |
| Dziennik +1 i stany Live Activity/zegarka | **złote pliki** `tests/wspolne/dziennik-*.jsonl`, `stan-*.json` czytane przez Jest i XCTest (Z07-11, Z07-12) | 07 w E3 (szkic), 05 zatwierdza w sesji fix | syntetyczne |
| Raporty MetricKit (ADR-0018) | przykładowy ładunek z dokumentacji Apple (adres w opisie) | 12 w E2–E3 | bez identyfikatorów urządzenia |
| Ślady GPS | nie dotyczy (moduł `geo-slady` nie dotyczy, E0 §6) | — | — |
Każdy plik danych ma obok opis (`*.opis.md`: skąd, data, licencja, co zawiera, oczekiwany wynik ze źródłem) i co najmniej jeden test, który go czyta (`tests/jakosc/dane-testowe.test.ts`). Stan: wycinek skanu z OCR `tests/dane/wzory/corbould-1879-s16-17.pdf` (2 strony) — Jest `tests/adaptery/e2e-pliki-wzoru.test.ts` i scenariusz 21 (panel `e2e-wzor-pdf-skan`, P-439, 07-jakosc-002); pozostałe warianty z tabeli (tekstowy, eksport LibreOffice i przeglądarki, `.docx` z LibreOffice): **plan, nie wykonano**.

## 5. CI: zadania, koszt, limity czasu, bramki
Wyzwalacze: **`workflow_dispatch` i `schedule` działają tylko z gałęzi domyślnej** (stare workflowy na `main`), więc na gałęzi roboczej zadania uruchamia `push` (decyzja DS-11).

| Workflow (nowy, `jakosc-*.yml`) | Wyzwalacz | Runner | Zadania | Bramka czy informacja | `timeout-minutes` |
|---|---|---|---|---|---|
| `jakosc-linux.yml` | push na `claude/jolly-thompson-paz6d8` i `main`; `pull_request` | `ubuntu-latest` | `npm ci`; `npm run verify` (typecheck, `test`, kontrole repo, `i18n:kod`, granice `src` i `app` (rozmiar 20 KB i warstwy; `app` od M1-106), `sprawdz-schemat`, wektory 02/05/06, strażnik nazw źródeł); `test:akceptacja` (zadanie `akceptacja`); pętla `TZ=…` po strefach DS-09 w **jednym** kroku uruchamia tylko `tests/narzedzia` (pomocniki, nie kod kalendarza aplikacji; 07-jakosc-006) | bramka: `verify` (w tym granice `src` i `app`), `akceptacja` (P-290) | 20 (pomiar E3 + zapas; rośnie z liczbą stref i testów) |
| `jakosc-ios.yml` | push na gałąź roboczą i `main` z `paths` (kod aplikacji, `modules/`, `targets/`, `.maestro/`, `package*.json`, `app.json`) | `macos-26` | `swift-test` (pakiety SwiftPM: reguły i dziennik +1, wzór, iCloud; wspólne wektory); `eksperymenty-wzoru` (W1–W3 na symulatorze, informacyjnie, P-261); `build` (prebuild, Release, symulator, `CODE_SIGNING_ALLOWED=NO`, sztuczny sklep) → artefakt; `e2e` macierz części iPhone i iPad (pakiet podstawowy albo pełny przy `[e2e-pelny]`, DS-11); zadania `xctest` (XCTest po prebuild), `artefakt` (kontrola `.app` buildu E2E) i `wyniki` (podsumowanie na `ubuntu-latest`): **plan, nie wykonano** ([DO USTALENIA], 07-jakosc-006) | bramka: `swift-test` (od przebiegu 40257126189), `build`, pakiet podstawowy iPhone (od 40313538454, P-180); informacja: `eksperymenty-wzoru`, iPad (P-225) | `swift-test` 20, `eksperymenty-wzoru` 30, `build` 90, `e2e` 150 na zadanie, krok scenariuszy 30 + 4 × liczba scenariuszy w części (wyliczane w kroku podziału) |
| nocny workflow pełny (nazwa robocza jakosc-pelny) | **plan, nie wykonano** (DS-11: po scaleniu do `main`, `schedule` nocny i `workflow_dispatch`, 07-jakosc-006) | **plan, nie wykonano** (DS-11) | pełny katalog E2E, fast-check 1 000, Stryker, pokrycie, tygodniowy build kontrolny na najnowszym Xcode: **plan, nie wykonano** (DS-11, P-091 5a, P-305); do tego czasu pełny katalog E2E biegnie w `jakosc-ios.yml` przy `[e2e-pelny]` w treści commitu albo z `workflow_dispatch` (P-299) | informacja (przegląd raz dziennie, jak Trening) | **plan, nie wykonano** (DS-11) |
| `testflight.yml` (rola 10) | tag `v*` / ręcznie z `main`, środowisko `testflight` | `macos-26` | zadanie `bramka`: zielony „Jakość · iOS” (pakiet podstawowy E2E) na tym SHA (`scripts/wydanie/testflight.mjs`); zadanie `build`: pełne `npm run verify` i `swift test` przed buildem, `scripts/wydanie/kontrola-ipa.sh` na `.app` z podpisanego `.ipa`; instalacja schematu CloudKit przez cktool: **plan, nie wykonano** (P-091 1b, decyzja D-A6 po audycie kandydata, P-320) | bramka | rola 10 |

**Koszt** (odczyt 2026-10-25): repo publiczne, runnery standardowe: **0 USD** („free … for public repositories that use standard GitHub-hosted runners”, docs.github.com/en/billing/concepts/product-billing/github-actions); Free: najwyżej 5 zadań macOS naraz, zadanie do 6 h (docs.github.com/en/actions/reference/limits). Szacunek minut na czas pracy roli 08 (2–3 tygodnie, [OCENA]): Linux ok. 150 pushy × 5 min = 750 min; macOS ok. 60 pushy z kodem × (40 build + 2 × 25 E2E + 10 XCTest) ≈ 6 000 min + nocne 21 × 120 ≈ 2 500 min. **Ryzyko nazwane:** przy zmianie repo na prywatne te same minuty kosztowałyby ok. 8 500 × 0,062 USD ≈ 530 USD/mies. (stawka macOS z odczytu biblioteki 18.10.2026, sprawdzić ponownie) — repo musi zostać publiczne albo plan CI wraca do roli 07.
**Lokalnie jak w CI (zasada roli 8):** `env -u NODE_PATH npm run verify` — kontener agenta ma globalne pakiety w `NODE_PATH` (np. `typescript`), których runner nie ma; pierwszy przebieg 2026-10-25 (run 40223002065) wykazał przez to 2 testy zielone tylko lokalnie (`tests/i18n/sprawdz-i18n.test.ts`, poprawka w `scripts/sprawdz-i18n.mjs`, Z07-23).
**Pierwsze uruchomienie każdej nowej kontroli jest informacyjne**; staje się bramką po jednym zielonym przebiegu w CI (zasada roli 8). Ponowienia: tylko przy błędzie startu sterownika XCTest i dla scenariuszy bez asercji wartości licznika (P-091 9a); „maszyna nieprzydzielona” ponawiana ręcznie (P-091 10a, reguła do `CLAUDE.md`).

## 6. Definicja ukończenia funkcji (według rodzaju zmiany)
| Rodzaj zmiany | Wymagane, zanim zmiana trafi na gałąź |
|---|---|
| Każda | test akceptacyjny kryterium przeniesiony z `tests/akceptacja/` do głównego zestawu i zielony; `npm run verify` kod 0 lokalnie i w CI; wiersz rejestru ryzyk dla nowej ścieżki awarii; brak nowych tekstów poza `t()` (`i18n:kod`) |
| Logika domeny | wektory ze źródła (ID w nazwie testu) + własność, jeśli reguła ma relację; granice w trójkach; mutant ręczny albo Stryker bez przeżyłego mutanta w funkcji ryzyka wysokiego |
| Zapis danych, schemat, migracja | test na `node:sqlite` przez port: transakcja, `foreign_keys = 1`, UPSERT, kaskada, przerwany zapis (ROLLBACK); migracja: test na kopii każdej wydanej wersji z licznościami, SHA-256 wydanych migracji niezmienione; ścieżka w tabeli `dane.md` |
| Ekran | test RNTL: rola i etykieta z `design-spec.md`, każdy stan z macierzy 04, skutek w danych przez atrapę portu; wygląd tylko z tokenów (kontrola tokenów); stany bez makiety → zgłoszenie do 04 (Z07-05) |
| Przepływ | scenariusz Maestro (stałe `testID`, asercja po każdej akcji), przejście w interpreterze w Jest, waga w `e2e-czesci.json`; zielony na symulatorze przed oznaczeniem „zrobione” |
| Funkcja widoczna dla użytkownika (P-377) | test, który **montuje trasę z `app/`** (RNTL, prawdziwy kontener i baza `node:sqlite`) i sprawdza skutek, który widzi użytkownik; test samego komponentu z ręcznie podanymi propsami albo wstrzyknięte zdarzenie nie zamyka zadania. *Dlaczego:* 07-jakosc-032 — testy komponentów były zielone przy 8 funkcjach, do których trasa nie prowadziła albo pokazywała co innego (np. 020, 009, 014); komponent nie wie, czy trasa go wywołuje i z jakimi danymi |
| Kod Swift / cel natywny | XCTest na wspólnych wektorach i złotych plikach; test liczności wektorów (wykonano N z N); kontrola artefaktu po zmianie uprawnień lub Info.plist |
| Treść / tekst krytyczny | wektory 06 zielone, strażnik nazw źródeł; zmiana zdania krytycznego → weryfikacja 06 (`docs/tresci/README.md`) |
| Zakupy | wektory W/L/Z/S zielone; E2E na sztucznym sklepie; punkt listy §8 przy wydaniu |
| Workflow CI | przebieg dowodowy na tym SHA (lekcja L-001 Treningu), strażnik sekretów zielony, opis w PR |

## 7. Niestabilne testy i kwarantanna
Według wzorców roli (wykrycie z komendą, ziarnem i maszyną; najpierw powtórka jednym procesem; przyczyna przed obejściem; bez automatycznych ponowień w bramce poza nazwanymi w §5). Kwarantanna tylko jawna: `docs/jakosc/kwarantanna.md` (ID testu, właściciel, termin najwyżej do następnego wydania, kontrola zastępcza); test w kwarantannie biegnie informacyjnie; ryzyko wysokie nigdy bez kontroli. E2E: każda porażka klasyfikowana jako błąd aplikacji / nieaktualny scenariusz / maszyna; diagnoza od zrzutu kroku, który padł (zrzuty w logu jak Trening, bo artefakty bywają nieosiągalne). Fast-check: kontrprzykład z CI to znaleziony błąd, nie niestabilność.

## 8. Lista „tylko telefon” (P-090 Q1a, P-091 2a) — kroki właściciela przy TestFlight wewnętrznym
Jedno zadanie naraz; przy każdej pozycji build, data, wynik. Pozycja bez wyniku na kandydacie = „nie sprawdzono” w audycie. Sposób zapisu i kolejność jak Trening `docs/39`.
| ID | Ryzyko | Kroki | Oczekiwane | Wektor |
|---|---|---|---|---|
| TT-01 | zakup | kup Pro miesięczne w piaskownicy TestFlight | Pro od razu, licznik bez limitu | W-01, W-15 |
| TT-02 | przywrócenie | usuń aplikację, zainstaluj, otwórz bez „Przywróć” | Pro działa (bieżące uprawnienia) | W-02 |
| TT-03 | tryb samolotowy | po zakupie tryb samolotowy, zabij i otwórz aplikację | Pro działa z pamięci | W-03 |
| TT-04 | Family Sharing | członek rodziny po włączeniu (P-089) otwiera aplikację | Pro działa; po odebraniu Pro znika, **dane, historia, eksport dostępne** (KP-02 V4) | W-10, W-14 |
| TT-05 | zwrot | zwrot w piaskownicy (sposób: [DO USTALENIA] OP-21, rola 10) | jak TT-04 po odebraniu | W-05, W-06 |
| TT-06 | aktualizacja (Trening AK-05) | poprzedni build TestFlight z danymi → „Zaktualizuj” → otwórz | projekty, liczniki, historia, ustawienia na miejscu; Live Activity działa | test migracji (Node) jako pokrycie zastępcze |
| TT-07 | start nad 0.1.0 (P-070) | na telefonie z 0.1.0 zainstaluj nowy build | pusta aplikacja bez awarii; stary plik nietknięty (diagnostyka pokazuje SHA bez zmian) | ADR-0015 |
| TT-08 | iCloud (P-091 1) | +1 na telefonie, otwórz iPada z tym samym kontem (build z włączoną flagą) | rekord widoczny; to warunek włączenia `ICLOUD_W_1_0` (ZM-06); w 1.0 flaga wyłączona (P-458, M1-audytor-generalny-209), niezaliczone → flaga zostaje wyłączona | R-051 |
| TT-09 | ekran blokady (ZAL-030) | zablokuj telefon w trakcie Live Activity, stuknij +1 trzy razy, odblokuj | wartość +3 bez konfliktu | R-018 |
| TT-10 | przywrócenie na drugim urządzeniu | na iPadzie z tym samym kontem App Store (przy TT-08) „Przywróć” | Pro działa | W-09 |
| TT-11 | usunięcie danych a zakup (KP-05) | Ustawienia → „Usuń wszystkie dane”, potem „Przywróć” | dane puste, Pro wraca | W-02 |
| TT-12 | zegarek: instalacja (P-316; Trening R-013) | po instalacji buildu: siatka aplikacji zegarka i aplikacja Watch na iPhonie | prawdziwa ikona Oczka (nie pusty krążek), nazwa w aplikacji Watch; aplikacja zegarka się otwiera | — (symulator watchOS w CI nie sprawdza ikony) |
| TT-13 | zegarek bez telefonu (BR-LIC-015/S1, BR-DAN-011/S2; dawne TT-9 część liczenia) | licznik 10, iPhone poza zasięgiem, 3 × „+1 row” na zegarku (przerwa ok. 3 s), potem powrót telefonu | zegarek 13 z linią „iPhone not nearby. 3 changes are saved on this watch.”, po powrocie linia znika, iPhone 13; zapis czasu do zniknięcia linii | złote pliki stanu (Z07-12), `ZegarekSkrzynkaTests` (`swift test`) |
| TT-14 | przypomnienie na zegarku z wibracją (BR-LIC-015/S2) | przypomnienie „od 12, co 6, 8 razy”, licznik 10 → +1 na zegarku | wibracja przy wejściu w rząd 12, pas „Row 12: decrease at both ends · 1 of 8” | scenariusz E2E 15 (stan wysłany do zegarka, bez wibracji) |
| TT-15 | Pro na zegarku bez telefonu (BR-ZAK-001/S4; dawne TT-9) — **warunkowe, rozłożone w czasie** | Pro kupione po wyczerpaniu darmowych dni (5 dni liczenia bez Pro); iPhone poza zasięgiem, nowy dzień, pierwszy „+1 row” na zegarku | rząd dodany bez komunikatu o limicie (sposób odczytu Pro: OP-22) | wektory Pro (rola 02), złote pliki stanu; bez spełnionego warunku „Nie sprawdzono” |
| TT-16 | cel dotyku ≥ 44 pt, przycięty tekst, Dynamic Type (JAK-13, P-439; §10 #11a) — **przed 1.0** | iPhone, Ustawienia → Dostępność → największy rozmiar tekstu (z „Większe rozmiary tekstu”); przejdź ekrany: licznik (+1, menu licznika), historia (strzałka rozwijania wpisu), lista projektów i projekt w trybie Edit (⊖), wzór (narzędzia, przełącznik wzorów w tytule `wzor-przelacz`, chip notatki, film), dni (strzałki miesiąca, komórki), Ustawienia (przełączniki); każdy przycisk stuknij raz kciukiem | każdy przycisk trafiony za pierwszym razem, nic nie przycięte ani nie zasłonięte przez rodzica; zapis: build, data, ekrany z wynikiem | testy komponentów (Jest: deklaracja stylu `minWidth`/`minHeight` 44) |
Poza listą, jako „Nie sprawdzono” z ryzykiem szczątkowym: nieudany zapis stuknięcia na zegarku (pełna pamięć zegarka), praca zegarka wiele godzin bez iPhone'a, restart bez odblokowania, bateria, raport awarii TestFlight (ADR-0018, P-079). **Zegarek wraca do listy (P-316, 2026-11-01):** właściciel ma Apple Watch i testuje na nim (Trening `docs/fakty-wlasciciela.md`, build 1030 i 1033); koryguje to zapis P-290 „właściciel nie ma Apple Watch”. Kroki dla właściciela: [`testflight-na-urzadzeniu.md`](testflight-na-urzadzeniu.md) blok A (TT-12) i blok H (TT-13–TT-15).

## 9. Testy akceptacyjne: kryterium → test → stan
Stan E3 (2026-10-25, `env -u NODE_PATH npm run test:akceptacja`): **980 testów akceptacyjnych, 974 czerwone na znaczniku `NIEZAIMPLEMENTOWANE:`, 6 jawnie zielonych `[ZIELONY-OK: …]` (parametry konfiguracji i kontrole narzędzi testu), 0 czerwonych z złego powodu**; pełna lista test → stan → fragment wyniku: [`e3/akceptacja-wynik.md`](e3/akceptacja-wynik.md). Scenariusze E2E: 32 w `e2e/scenariusze/` (czerwień sprawdza CI macOS, nie kontener). Kontrole repo i workflowów: `tests/jakosc/` (zielone, każda z pułapką).
Pokrycie 220 kryteriów z inwentarza ([`e0/kryteria.json`](e0/kryteria.json)), liczone skryptem po ID w nazwach testów: **201 z testem**, 19 bez testu z powodem:
| Kryterium | Powód braku testu | Kontrola zastępcza / kiedy test |
|---|---|---|
| TT-1–TT-3, TT-7, TT-8 (tabela modelu B, `docs/monetyzacja.md:581–593`) | zastąpione listą §8 (P-090, P-091): TT-01, TT-02, TT-03, TT-04, TT-05 | lista §8 przy TestFlight; wektory W |
| TT-4, TT-6 | jak wyżej: TT-10, TT-11 | lista §8 |
| TT-5 (inne konto piaskownicy) | wymaga drugiego konta piaskownicy; czas właściciela bez nowej informacji wobec wektora | W-07 (domena) + E2E na sztucznym sklepie (06); na urządzeniu „Nie sprawdzono” |
| TT-9, BR-ZAK-001/S4 (zegarek bez telefonu) | `transferUserInfo` nie działa w symulatorze (ADR-0009); skutek limitu dni na zegarku wymaga 5 dni liczenia bez Pro | wektory Pro na zegarku i złote pliki stanu (`tests/wspolne`, Z07-12); lista §8: **TT-15** (warunkowe, P-316: właściciel ma Apple Watch); bez spełnionego warunku „Nie sprawdzono” |
| BR-DAN-011/S2 (ER-52, P-193, P-202: linia „iPhone not nearby. N changes are saved on this watch.” na zegarku) | warunek w widoku SwiftUI (`targets/watch/Aplikacja.swift`: brak telefonu i niepusta skrzynka), symulatora watchOS nie ma w CI | liczba = skrzynka zegarka (`ZegarekSkrzynkaTests`, `swift test`), teksty `aktywnosc.bez_telefonu_*` w `Teksty.swift` (test P-143); lista §8: **TT-13** (P-316, właściciel ma Apple Watch; 2026-11-01, wcześniej „Nie sprawdzono”, 07 fix-3, 2026-10-26) |
| BR-WZR-004/S1–S2, BR-WZR-008 „iPad bez rysika” (część z rysikiem) (P-218, P-224) | symulator dotyka tylko palcem; właściciel ma iPada, ale nie ma Apple Pencil (P-226) | test jednostkowy logiki `pencilOnly` (przełączenie po pierwszym dotyku rysikiem; partia 6); **ryzyko szczątkowe nazwane (P-226): brak testu z prawdziwym rysikiem i odrzucania dłoni** |
| BR-WZR-005 (iPad poziomo/pionowo, wąskie okno), BR-WZR-008 „iPad bez rysika” (palec), NFR-UKL-001 (P-224, P-225) | prawdziwe okno iPadOS i klasy rozmiaru tylko na urządzeniu | E2E iPada nocą (`e2e-ipad`, argument `oczkoE2eSzerokoscOkna`, zrzuty + przegląd 04 — P-225 Q2, Q3c) **i** lista „tylko urządzenie” (§8): układy iPada pion/poziom/wąskie okno, zakreślanie palcem — właściciel na swoim iPadzie (P-226) |
| BR-LIC-005/S1 (haptyka nie przerywa dźwięku innej aplikacji) | zachowanie sesji audio systemu | kontrola repo `DZWIEK` (aplikacja bez dźwięku); „Nie sprawdzono” na urządzeniu |
| BR-PRJ-008/S2 (zapomniany stoper przy zablokowanym ekranie) | blokada ekranu i Live Activity 8 h tylko na urządzeniu | maszyna sesji `SESJA_MAKS_H` (domena, testy w `maszyny/`); „Nie sprawdzono” |
| BR-WZR-004/S1 (dłoń na ekranie przy Pencil) | tylko iPad z Apple Pencil (P-042) | XCTest po prebuild: `drawingPolicy = pencilOnly` (po celu natywnym roli 08); „Nie sprawdzono” |
| BR-DAN-002/S1, S3, BR-PRJ-011/S3 (iCloud) | brak portu i sygnatur adaptera synchronizacji (Z07-14) | test po sesji fix 05; maszyna synchronizacji testowana w `maszyny/`; TT-08 |
| BR-WZR-007/S3 (strona WWW bez treści) | brak portu pobierania strony; kryterium niemierzalne (ER-36) | po ER-36 i porcie (05) |
| BR-PRJ-015/S2 (udostępnienie bez lokalizacji) | brak portu udostępniania i usuwania EXIF (P-073 10a) | po porcie (05); dane testowe ze zdjęciem z EXIF GPS (§4) |
| NFR-JEZ-001 (35 lokalizacji) | mechanizm roli 09: testy `tests/i18n/` (186, zielone) bez ID kryterium w nazwie | przy E2–E4 roli 09: test `supportedLocales` = `CFBundleLocalizations` = słowniki z ID (strategia §10) |
Poza 1.0 (testy usunięte z zestawu razem z zakresem, wracają z funkcją):
| Kryterium / ryzyko | Decyzja | Warunek powrotu i test |
|---|---|---|
| BR-DAN-007 „Karta planów Pro po imporcie z innej aplikacji”, R-121 | P-113 Q2a, P-117 Q1a (F-29 PÓŹNIEJ); w 1.0 import własnej kopii bez karty — E2E 08 (`assertNotVisible karta-pro-po-imporcie`) | F-29 w zakresie: test domeny z pełnym warunkiem BR-DAN-007 (źródło „inna aplikacja”, ≥ 1 nowa pozycja, stan Pro pewny) i test ekranu karty (ceny tylko ze sklepu, zamknięcie) — wcześniejsza wersja w historii git, `tests/domena/zakup/informacje-pro.test.ts` przed F07-02 |

Testy zależne od poprawek 01/02/05 (P-090 Q3a, P-091 11a): [`zgloszenia.md`](zgloszenia.md) i [`e1/zgloszenia-e1.md`](e1/zgloszenia-e1.md), kolumna „Testy zależne”; zestawienie dla roli 08 w przekazaniu E4.

## 10. Kontrole od innych ról → miejsce w planie
### Rola 05 (`e3-…md` §4)
| # | Kontrola | Test / skrypt | Poziom | Gdzie | Bramka |
|---|---|---|---|---|---|
| 1 | `granice.mjs src` i `granice.mjs app --domena ../src/domena` (trasy: ROZMIAR 20 KB z ADR-0003, CYKL, SQLITE) | istniejące narzędzie + pułapki obejść (Z07-16); zakres trasy: `tests/jakosc/granice-app.test.ts` (polecenie z `jakosc:kontrole` pada na sztucznym pliku 21 KB w kopii `app/`) | kontrola repo | Linux | bramka (`jakosc:kontrole`): `src` od partii 1 (P-114 Q4a), `app` od DEC-30 (a) (M1-audytor-generalny-106) |
| 2 | `sprawdz-schemat.mjs` | istniejące + uruchomienie na bazie po migracjach aplikacji (Z07-15) | dane | Linux | bramka |
| 3 | migracja z kopii każdej wydanej wersji | `tests/dane/migracje-wydanych.test.ts` na `tests/bazy/vN.db` | dane | Linux | bramka od 1.0 (dziś pusty zbiór = test „brak wydanych wersji”, nie zaliczenie po cichu) |
| 4 | `PRAGMA foreign_keys` = 1 w transakcji przez port | Jest `node:sqlite` + XCTest/E2E z adapterem expo-sqlite | dane + natywny | Linux, macOS | bramka |
| 5 | wektory L/S/Z, W, M + RD-11–RD-17; te same w XCTest | Jest (domena) + XCTest z testem liczności | domena + natywny | Linux, macOS | bramka |
| 6 | własność `scal` (permutacja, powtórzenie) | fast-check | domena | Linux | bramka |
| 7 | 22 ścieżki utraty danych | test na ścieżkę (`dane.md`), w nazwie ID ścieżki | dane / natywny / E2E | Linux, macOS | bramka |
| 8 | kontrole repo (OR REPLACE, exclusive, kopia ścieżki, `import SQLite3`, `Library/SQLite`, puste `catch` w `src/dane`, przypięcia, ADR-0016, PrivacyInfo) | `scripts/jakosc/kontrole-repo.mjs` z pułapkami; puste `catch` przez ESLint `no-empty` tylko w `src/dane` (DS-12) | kontrola repo | Linux | bramka |
| 9 | sekrety `ASC_*` tylko w `environment: testflight`, brak `pull_request`/`workflow_run` | `scripts/jakosc/sprawdz-workflowy.mjs` (parsuje YAML; brak workflowu = błąd) | kontrola repo | Linux | bramka |
| 10 | po `prebuild`: target 18.0, `UIBackgroundModes`, `NSSupportsLiveActivities`, uprawnienia | `scripts/wydanie/kontrola-ipa.sh` na `.app` z podpisanego `.ipa` w `testflight.yml` (minimum systemu, tryby tła, uprawnienia celów); ten sam zestaw na `.app` buildu E2E: **plan, nie wykonano** ([DO USTALENIA], Z07-19, 07-jakosc-006) | artefakt | macOS | bramka (TestFlight) |
| 11 | audyt dostępności XCTest UI PR-01–PR-05: **plan, nie wykonano** ([DO USTALENIA], 07-jakosc-006) | XCTest UI po prebuild: **plan, nie wykonano** ([DO USTALENIA]) | natywny | macOS | informacja do pierwszego zielonego, potem bramka |
| 11a | cel dotyku ≥ 44 pt, przycięty tekst, Dynamic Type (PR-01–PR-05; JAK-13): Jest sprawdza tylko deklarację stylu `minWidth`/`minHeight` 44 (nazwy testów: „deklaracja stylu”), bo render testowy nie liczy układu | decyzja P-439 (07-jakosc-007, wariant (b) jak Trening): cel dotyku 44 pt na telefonie — testy komponentów (styl `minWidth`/`minHeight` 44 w Jest, nazwy „deklaracja stylu”) + przejście ręczne właściciela z listą ekranów przed 1.0, na urządzeniu przy największym rozmiarze tekstu, z datą i buildem (§8 TT-16); Trening: XCTest UI tylko dla zegarka (`targets/watch-ui-tests`), telefon — testy komponentów i przegląd (Trening `docs/09-plan-testow` S14); warunek powrotu do (a) XCTest UI z audytem `hitRegion`/`textClipped`/`dynamicType` po prebuild: regresja 44 pt po wydaniu albo cel UI tests dodany z innego powodu | Jest (komponenty) + telefon | Linux + telefon | bramka: Jest; przejście ręczne: pozycja kandydata 1.0 (bez wyniku = „nie sprawdzono”) |
| 12 | NFR-PIE-001 po ZM-18/ER-68 (1 stuknięcie w „+1” karty „Dziś”, 0 ekranów przed „Dziś” i nad „+1”, z licznikiem: n+1 z karty bez zmiany ekranu; offline, 1. i ostatni dzień miesiąca) | E2E (świeża instalacja; `start-czysty-dzis.yaml`, `restart-dzis.yaml`) + test przypadku użycia z wstrzykniętym zegarem dla dat (Z07-18) | E2E + domena | macOS, Linux | bramka |
| 13 | budżety wydajności | pomiar bazowy w CI jako artefakt | E2E | macOS | **informacja** do progu (OP-17, Z07-06) |
### Rola 12 (`docs/niezawodnosc/e1-decyzje.md`, „Dla roli 07”)
| Kontrola | Miejsce | Bramka |
|---|---|---|
| brak `:memory:` w `src/` poza testami i `src/dane/baza/adapter-node.ts` (wyjątek nazwany, Z07-21) | kontrole repo | bramka |
| brak kopiowania samego `.db`, `VACUUM`/`REINDEX` w kodzie ratunkowym, `expo-updates`, SDK awarii; przełącznik wymuszonej awarii tylko w konfiguracji testowej | kontrole repo + krok przełączników w `testflight.yml` i ślady trybu testowego w `scripts/wydanie/kontrola-ipa.sh` (brak przełącznika w buildzie wydania) | bramka |
| dwa wymuszone nieudane starty → ekran awaryjny → archiwum z licznościami, oryginał z tym samym SHA-256 | E2E (build z przełącznikiem testowym) | bramka po pierwszym zielonym |
| przywrócenie z kopii na czystej instalacji; start w tle (intencja +1) nie zwiększa licznika nieudanych startów | E2E + XCTest | jw. |
| pomiar `integrity_check` na bazie 3-letniej | pomiar w CI (artefakt) | informacja |
| Xcode | najnowszy 26.x + tygodniowy build (P-091 5a) | — |
### Rola 09 (`docs/lokalizacja/e1-mechanizm.md`)
| Kontrola | Miejsce | Bramka |
|---|---|---|
| `npm run i18n:kod` | `verify` (dziś kod 2 „nie sprawdzono” bez katalogów nowego kodu — skrypt musi kończyć się 0 albo 1, Z07-16) | bramka po pierwszym ekranie |
| strażnik liczby mnogiej na Node z pełnym ICU | Jest (istniejący `tests/i18n/liczba-mnoga.test.ts`) | bramka |
| `supportedLocales` = `CFBundleLocalizations` = `locales` = słowniki | kontrola repo + `scripts/wydanie/kontrola-ipa.sh` (katalogi `.lproj`: dziś uwaga, nie błąd) | bramka (kontrola repo); `.lproj` informacja |
| pseudolokalizacja | zestaw ekranów RNTL z `EXPO_PUBLIC_PSEUDO=1` (długość, brak tekstu poza `t()`) | informacja |
| `Intl.NumberFormat`/`DateTimeFormat` na Hermes | E2E: ekran z liczbą i datą w 3 językach (en, de, ja) | bramka po pierwszym zielonym |

## 11. Plan wydania (moduł `wydanie`, build)
Jeden SHA dla wszystkich przebiegów kandydata (tag → SHA → przebieg TestFlight → build N); na tym SHA: zielony `jakosc-ios` z pakietem podstawowym E2E iPhone (zadanie `bramka` w `testflight.yml`, `scripts/wydanie/testflight.mjs`), w buildzie TestFlight pełne `npm run verify` i `swift test` reguł (jak §5; bez zadania `akceptacja` i pętli stref z `jakosc-linux`, M1-audytor-generalny-162), pełny katalog raz (P-091 9a), XCTest UI: plan (§10 #11), `scripts/wydanie/kontrola-ipa.sh` na podpisanym `.ipa`, stan `VALID` w App Store Connect (rola 10), schemat CloudKit Production zgodny (P-091 1), lista §8 z wynikami, lista „Nie sprawdzono”. Test aktualizacji z poprzedniej wersji z danymi: od 1.0 (`tests/bazy/vN.db` + TT-06). Werdykt: tryb audit roli 07.

## Pytania na STOP E2
**DS-11. Przebiegi, które GitHub uruchamia tylko z `main` (nocny pełny katalog, ręczne `workflow_dispatch`).**
- (a) **Do scalenia z `main`: pełny katalog na gałęzi roboczej przez push z `[e2e-pelny]` w treści commitu; po scaleniu nocny `schedule` jak Trening.** Kompromis: bez działania właściciela teraz; pełny katalog tylko na żądanie roli. **Rekomendacja.**
- (b) Właściciel scala teraz do `main` sam plik workflowu (mały PR) — działa noc i ręczne uruchomienie od razu. Kompromis: scalenie do `main` to wyjątek P-087 (decyzja właściciela) i miesza nowy workflow ze starym kodem na `main`.

**DS-12. Puste `catch` w `src/dane` (kontrola 05-8): projekt nie ma ESLint.**
- (a) **ESLint tylko z regułą `no-empty` (i `no-restricted-syntax` dla zakazanych wywołań) na `src/dane`, w `verify`.** Kompromis: nowa zależność deweloperska (reguła wieku ≥ 14 dni). **Rekomendacja**: grep nie rozumie składni (pułapki obejść z E1).
- (b) Skrypt na AST TypeScriptu (`typescript` już w repo) wyszukujący puste bloki `catch`. Kompromis: bez nowej zależności, ale własny kod do utrzymania.

**DS-13. Stary kod 0.1.0 i jego testy (956) w `npm test` do czasu kroku porównania i roli 08.**
- (a) **Zostają w `npm test` jako stan wyjściowy; nowe testy w osobnych projektach Jest; usuwa je 08 razem ze starym kodem według wyniku kroku porównania (P-078).** Kompromis: dłuższy `npm test` (36 s), ale bez decyzji o kodzie przed porównaniem. **Rekomendacja.**
- (b) Wyłączenie starych testów teraz. Kompromis: szybciej, ale tracimy sygnał regresji kodu, który może zostać użyty ponownie (P-001, P-004).

Pozostałe decyzje DS-01–DS-10 (tabela §3) bez weta przechodzą według rekomendacji.

## Czas
E3: agent 5–8 h (zaślepki z sygnaturami `moduly.md`, testy akceptacyjne domena → dane → ekrany → scenariusze, narzędzia `czas`, `strefy`, części E2E, kontrole repo z pułapkami, workflowy); oczekiwanie: pierwszy przebieg macOS (build ok. 40 min + E2E; `macos-26` bywa niedostępny wieczorami); właściciel 0.
