# Wzorzec CI i E2E z repo `lkarwowski494/trening` (dla roli 07, Oczko)

Źródło: płytki klon `https://github.com/lkarwowski494/trening`, gałąź `main`, commit **928d0ffeb8650efa8b758add627d07d71f47a430**
(2026-10-25 17:39 +0100, „Merge pull request #62 from lkarwowski494/przeklad-workflow”). Lokalnie:
klon w scratchpadzie roli 07 (poza repo). W żadnym repo nic nie zmieniłem.
Ścieżki niżej są względne wobec katalogu głównego klonu; `plik:linia` dotyczy tego commitu.

**Czego nie udało się ustalić:** czasów z GitHub API. Narzędzia MCP `actions_list` i `api.github.com` odmówiły dostępu
(„repository lkarwowski494/trening is not configured for this session”). Repo nie dodawałem przez `add_repo`, bo nikt o to nie prosił.
Czasy w pkt 1 pochodzą więc z komentarzy w workflowach i z dokumentów (z numerami przebiegów, które się tam cytuje).

---

## 1. Workflowy (`.github/workflows/`, 15 plików)

| Plik | Wyzwalacze | Runner | Joby, timeout | Cache / artefakty / macierz |
|---|---|---|---|---|
| `tests.yml` | `push` (każda gałąź), `workflow_dispatch` (:5-7); concurrency `tests-${ref}` z anulowaniem (:10-12) | `ubuntu-latest` (:15) | `verify`, 60 min (:16); `npm ci` + `npm run verify` (:23-25) | `setup-node@v5` node 22 `cache: npm` (:19-22) |
| `tests-tz.yml` | `workflow_dispatch`, cron `17 3 * * *` (:8-11) | `ubuntu-latest` (:23) | `jest`, 60 min (:24); `TZ=<strefa> npx jest --maxWorkers=2` (:48) | macierz 7 stref (:28-35) × `ref` z `vars.NIGHTLY_REFS` (:36), `fail-fast: false` |
| `e2e-ios.yml` | `push` na `main` i `integration/**` z `paths-ignore: docs/**, **/*.md, tests/**, .claude/**` (:17-19); `workflow_dispatch` z wejściami (:20-50); `workflow_call` (:51-59); concurrency anuluje tylko przy push (:64-66) | `macos-26` (:70, :121, :318), `ubuntu-latest` (:399) | `build` 90 min (:71), `e2e` 300 min (:126), `eksperymenty` 60 min, `continue-on-error` (:319-320), `wyniki` 10 min (:400) | artefakty: `trening-sim-app` 1 dzień (:105-109), `xcodebuild-log-sim` przy porażce (:110-115), `e2e-ios-${shard}` (:304-312), `e2e-ios-eksperymenty`, `e2e-wyniki` (:417-422); macierz `shard: [1,2,3]`, `fail-fast: false` (:122-125); cache npm tylko w `build` (:80) |
| `ios-unsigned.yml` | tylko `workflow_dispatch` (:9-10) | `macos-26` (:17) | `build`, 60 min (:18): typecheck, i18n, jest `--maxWorkers=2`, `swift test`, prebuild, pods, xcodebuild bez podpisu na urządzenie | log przy porażce (:72-77) |
| `testflight.yml` | tylko `workflow_dispatch` (:18-32); concurrency `testflight` bez anulowania (:35-37) | `ubuntu-latest` (bramka), `macos-26` (build, :72), `ubuntu-latest` (tag) | `bramka` 125 min (:42), `build` 90 min, `environment: release` (:68, :73), `tag` | `mapy-zrodel-b<N>` 90 dni (:141-145) |
| `nightly.yml` | cron `41 2 * * *`, `workflow_dispatch` (:17-37) | `ubuntu-latest` (+ wywołanie `e2e-ios.yml`) | `losowe` 120 min (:52), `mutacje` 300 min (:74), `e2e-maly-ekran-ciemny` = `uses: ./.github/workflows/e2e-ios.yml` z `pakiet: pelny`, `urzadzenie: 'iPhone SE\|iPhone 16e\|iPhone 17e'`, `wyglad: dark` (:97-106), `zgloszenie` 10 min, `issues: write` (:107-134) | `mutacje-${job-index}` (:91-96) |
| `watch-sim.yml` | `workflow_dispatch` + `push` na `f020-*`, `integration/**` ze ścieżkami (:7-27) | `macos-26` (:35) | 90 min (:36) | npm cache, artefakty 3 dni |
| `store-screenshots.yml` | `workflow_dispatch` | `ubuntu-latest` 20 min, `macos-26` 90 min, `macos-26` 180 min z macierzą `rozmiar` (:37-101) | — | artefakty 3 dni |
| `pages.yml`, `asc-*.yml`, `przeglad-/przeklad-tlumaczen.yml`, `sprzatanie-galezi.yml` | `push`/`workflow_dispatch` | `ubuntu-latest` | 15–180 min | nie dotyczą E2E |

**Czasy (z dokumentów, nie z API):**
- Build Release na symulator: ok. 40 min. Komentarz `e2e-ios.yml:71`: „build ~40 min (run 38411267312: pods 2 min + xcodebuild 36 min)”.
- Pełny przebieg na 3 częściach: build ≈ 42 min + część ≈ 43 min + narzut części 8–9 min ≈ **94 min**. Z ponownie użytą aplikacją: **≈ 52 min** (`docs/38-przeplywy-i-luki-e2e.md:144`).
- Pakiet podstawowy: „~20–25 min” na 2 maszynach (`e2e-ios.yml:8`, `:43`).
- Pomiar: 25 scenariuszy = 4929 s, aktualizacja 33→34 ≈ 5,6 min. Model: czas ≈ 50 s + 1,86 s × liczba kroków (`docs/38:120`).
- Pełny katalog: ponad 40 scenariuszy, „trwa 1,5 h” (`docs/38:172`).
- Symulator na świeżej maszynie startuje ok. 8 min (`e2e-ios.yml:126`, `:198`).

## 2. Podział E2E na części

- **Skrypt:** `scripts/ci/e2e-shards.mjs`. Algorytm LPT, „największe obciążenie najpierw na najmniej obciążoną część; remisy wg nazwy pliku” (:10-11, implementacja :36-51).
  - Waga scenariusza: `cfg.wagi_s[f] ?? cfg.domyslna_waga_s` (:39).
  - Scenariusze z tagiem `aktualizacja` (33–34) tworzą jedną niepodzielną grupę z narzutem `narzut_aktualizacji_s` (:40-42).
  - Pliki z tagiem `eksperyment` są wyłączone z podziału (:21, :25).
  - Plan liczy się zawsze dla pełnego zestawu. Dopiero potem filtruje go `ONLY` (wejście `tylko_scenariusze`), więc numer części scenariusza się nie zmienia (:5-6, :71, :81).
  - Polecenie `czesc N --out .maestro-czesc` kopiuje do katalogu scenariusze części i `subflows/` (:82-87). Zapisuje też `main=/update=/any=` do `$GITHUB_OUTPUT` (:91-93).
  - Pakiet `podstawowy` liczy własny plan na `czesci_podstawowy` maszynach. Nadmiarowe maszyny macierzy kończą od razu z `any=false` (:71, :80).
- **Konfiguracja:** `scripts/ci/e2e-shards.json`: `czesci: 3`, `czesci_podstawowy: 2`, `domyslna_waga_s: 180`, `narzut_aktualizacji_s: 120`, wagi w sekundach z przebiegu 38411267312 (`_opis`).
  Pakiet: `scripts/ci/e2e-podstawowy.json` (14 numerów i uzasadnienie każdego).
- **Wywołanie w workflowie:** `e2e-ios.yml:134-141`, czyli `node scripts/ci/e2e-shards.mjs czesc "$SHARD" --out .maestro-czesc`. Dalsze kroki są warunkowe: `steps.plan.outputs.any|main|update`.
- **Testy:** `tests/e2e-shards.test.ts`
  - :23-28 każdy scenariusz w dokładnie jednej części, bez dubli; liczba części = `cfg.czesci`;
  - :30-35 para 33/34 w jednej części;
  - :37-42 determinizm i równowaga (różnica części ≤ najdłuższy scenariusz, maksimum ≤ 115% średniej);
  - :44-47 brak przestarzałych wag;
  - :49-57 nowy scenariusz bez wagi i tak trafia do jednej części;
  - :66-69 `config.yaml` zawiera wszystkie scenariusze;
  - :88-98 `ONLY="31 35"` i całe numery („3” nie wybiera 31);
  - :109-135 struktura workflowu: build raz, macierz = konfiguracja, artefakty z numerem części.

  Pakiet pilnuje `tests/e2e-pakiet.test.ts`.

## 3. Obejścia (plik:linia)

- **Klawiatura symulatora / zgubiony pierwszy znak:** wpis znak po znaku w `retry`, potem `assertVisible` wartości pola.
  - `.maestro/04-plank-stoper.yaml:13-29`: `retry: maxRetries: 1` → `tapOn` pola → `waitForAnimationToEnd` → `eraseText: 20` → `inputText` po jednej literze → `assertVisible: "Plank"` → `pressKey: Enter`.
  - Liczby: `.maestro/32-regularny-uzytkownik.yaml:79-96`, gdzie komentarz mówi „na wolnym symulatorze zginął pierwszy znak „10””; `assertVisible: { id: "w-0-0", text: "40" }`.
  - Kursor na początku pola: `.maestro/35-ustawienia-dostepnosc.yaml:50-58`, czyli `doubleTapOn` zaznacza liczbę, potem `eraseText` + znaki osobno + asercja, `maxRetries: 2`.
  - Chowanie klawiatury: `pressKey: Enter` po każdym wpisie w wyszukiwarce (L-013, mały ekran 390 pt). Strażnik: `tests/maestro-selectors.test.ts:283-317`. `hideKeyboard` jest zakazany na klawiaturach numerycznych (`docs/38:112`).
  - W `.maestro` jest 47 bloków `maxRetries`.
- **Ponowienia:**
  - Sterownik XCTest: jedno powtórzenie całości tylko przy `iOS driver not ready in time|deviceInfo failed` (`e2e-ios.yml:205-219`), plus `MAESTRO_DRIVER_STARTUP_TIMEOUT: '480000'` (:198).
  - Pojedynczy nieudany scenariusz: raz, osobnym uruchomieniem. Nazwy daje `node scripts/ci/e2e-wyniki.mjs nieudane report.xml DIR`, pętla w :220-231. Tryb ścisły (`tryb_scisly`) wyłącza ponowienia (:222).
  - Strażnik czasu `guard()` w Perlu: osobna grupa procesów, TERM/KILL po `MAESTRO_ALARM` = 6000 s (:208-212).
  - Para aktualizacji jest ponawiana razem od czystej instalacji (:272-289).
- **Niedostępny `macos-26`:** w workflowach nie ma automatycznego ponowienia. Reguła z `CLAUDE.md:60-63`: „awaria przed pierwszym scenariuszem to maszyna; jedno powtórzenie… Przebieg anulowany bez przydzielonej maszyny („not acquired by Runner”…) — ponawiaj od razu, aż dostanie maszynę”.
  - Wybór symulatora bez twardej nazwy: wersja iOS zgodna z SDK wybranego Xcode, kolejność wzorców `"iPhone 17 \("`, `"iPhone 16 \("`, `"iPhone"`, najwęższy ekran przez `scripts/ci/sim-wybor.mjs` (`e2e-ios.yml:160-184`).
  - Obraz `macos-26` nie ma iPhone SE (`docs/40-lekcje.md:23`, R-011).
- **Podpis bez tworzenia certyfikatu:**
  - Symulator: `CODE_SIGNING_ALLOWED=NO`, `-destination 'generic/platform=iOS Simulator'`, bez `-sdk` (`e2e-ios.yml:95-102`).
  - Urządzenie bez podpisu: `ios-unsigned.yml:54-59`.
  - TestFlight: archiwum z `CODE_SIGNING_ALLOWED=NO`, bo „świeży runner… tworzył nowy certyfikat przy każdym przebiegu (limit)” (`testflight.yml:125-136`). Uprawnienia osadza `codesign --force -s -` z plikami entitlements (:159-171). Eksport `app-store-connect` + `signingStyle automatic` + `-allowProvisioningUpdates` z kluczem ASC API (:176-199).
  - Strażnik uprawnień w `.ipa` przed wysyłką: :200-209.
  - Straż: build TestFlight nie może mieć `EXPO_PUBLIC_STORE_FAKE` (:100-103).
- **Przypięcie Xcode:**
  - `scripts/ci/select-xcode.sh 26` bierze najnowszy `Xcode_26*.app` (bez dowiązań i bet), nie przypina numeru, „który z obrazu może zniknąć” (:3-8, :19-37). Ma `DRY_RUN`/`APPS_DIR` do testu w Jest.
  - `scripts/ci/ensure-ios-platform.sh` pobiera platformę iOS/watchOS tylko, gdy jej brak.
  - Uzasadnienie `macos-26`: „SDK 56+: Xcode 26.4+ (macos-15 ma najwyżej 26.3)” (`e2e-ios.yml:70`).

## 4. Uruchamianie Maestro

- **Instalacja:** `curl -fsSL https://get.maestro.mobile.dev | bash`. Wersję przypina zmienna repo `vars.MAESTRO_VERSION` (pusta = najnowsza), a `maestro --version` trafia do logu (`e2e-ios.yml:185-194`).
- **Środowisko:** Java Temurin 17 (:142-146), `MAESTRO_CLI_NO_ANALYTICS=1`.
- **Polecenie:** `maestro --device "$SIM" test "$DIR" --exclude-tags=aktualizacja --format junit --output e2e-out/report.xml --test-output-dir e2e-out` (:212).
- **Kolejność i lista:** `.maestro/config.yaml` (`flows:`). Test wymaga, żeby każdy plik był na liście. Podprzepływy leżą w `.maestro/subflows/`.
- **Zrzuty:** `takeScreenshot` w scenariuszach. Artefakt `e2e-ios-N` zbiera `e2e-out`, `*.png` i `.maestro/*.png`, przechowywany 1 dzień (:304-312).
- **Przy porażce:** `scripts/ci/maestro-failures.py` wypisuje nieudane polecenia i teksty z ekranu do logu. Zrzut idzie do logu jako base64 JPEG 480 px, bo „artefakty bywają nieosiągalne” (:294-303).
- **Podsumowanie:** `e2e-wyniki.mjs wyniki|zbierz` → `$GITHUB_STEP_SUMMARY` i JSON `e2e-wyniki`. Statusy: przeszedł / w ponowieniu / padł dwa razy (:291-293, :395-422).
- **Ponowne użycie aplikacji:** wejście `aplikacja_z_przebiegu` pomija `build`, a `download-artifact` bierze `run-id` (:147-159).
- **Bramka TestFlight:** rozpoznaje zielony E2E na tym samym SHA po `run-name` „E2E iOS · podstawowy|pelny|ścisły” (`scripts/ci/bramka-e2e.sh:6`, `e2e-ios.yml:14`).
- **Interpreter Maestro w Jest:** `tests/maestro-runner.ts`, `tests/maestro-flows.test.tsx:1-23`. Wykonuje każdy krok YAML na drzewie dostępności, zanim scenariusz trafi na symulator. Odstęp stuknięć wynosi 1100 ms (`docs/38:107`), stały zegar `maestroNow`/`MAESTRO_NOW` (`maestro-runner.ts:49-51`).

## 5. Adapter sklepu i sztuczny sklep (expo-iap 5.8.1)

- **Interfejs:** `lib/store-adapter.ts:30-46` (`getProducts`, `purchase`, `restore`, `currentEntitlements`, `onTransaction`, `redeemCode`, `manageSubscriptions`). Wybór: `isFakeStoreBuild() ? createFakeStore(E2E_START_ENTITLEMENTS) : createNativeStore()` (:54-58).
  - Build E2E startuje z `lifetime`/`code`, żeby pozostałe scenariusze nie trafiały na limit (:48-49).
- **Przełącznik:** `lib/products.ts:52`, czyli `process.env.EXPO_PUBLIC_STORE_FAKE === '1'`. Zmienna jest ustawiona tylko w kroku buildu `e2e-ios.yml:89-94`, razem z `EXPO_PUBLIC_WATCH_FAKE`.
- **Sztuczny sklep:** `lib/store-fake.ts`. Stan w pamięci, ceny testowe, sterowanie `offline`, `nextPurchase`, `setEntitlements`, `restorable` i licznik `calls` (:76-121).
- **Panel w aplikacji, tylko w buildzie fake:** `app/paywall.tsx:108-113` („Test store: expire access / go offline / go online”, bez `t()`). Używa go `.maestro/21-subskrypcja.yaml`.
- **Straże:** `tests/store-adapter.test.ts:59-84`
  - zmienna ustawiana tylko w `e2e-ios.yml`;
  - `testflight.yml` ma krok blokujący;
  - `app.json`, `eas.json` i `package.json` jej nie znają;
  - w źródłach występuje tylko w `lib/products.ts`;
  - adapter nie robi `fetch`/`WebSocket`.

  Makieta expo-iap w Jest: `tests/setup.js:47-54` (`global.__iap`).

## 6. Strefy czasowe

- **`tests/global-setup.js:9`:** domyślnie `TZ=Europe/Warsaw`, ustawiane przed startem procesów roboczych. „Zmiana process.env.TZ w trakcie testu nie działa na macOS” (:3-4).
- **`tests-tz.yml:28-35`:** cały zestaw Jest w strefach Europe/Warsaw, UTC, America/Los_Angeles, Pacific/Kiritimati (+14), Pacific/Pago_Pago (−11), Asia/Kolkata (+5:30) i Australia/Lord_Howe (DST 30 min).
- **`tests/matrix-time.test.ts:1-11`:** niezależna wyrocznia (`Intl.DateTimeFormat` ze strefą procesu, arytmetyka na UTC). Przejścia DST wyrocznia znajduje sama. Listę stref pilnuje ten test (`CI_ZONES`).
- **Ziarno fast-check:** `tests/prop-seed.js`. Brak `PROP_SEED` = stałe 20261006, `random` nocą (`nightly.yml:65-66`), ziarno trafia do logu (`global-setup.js:10-12`).
- **Mutacje:** Stryker, `stryker.config.json` (lista modułów `lib/`, progi 80/60/40, `concurrency 2`) i `jest.mutation.config.js`, który wyklucza wolne testy i testy uruchamiające procesy potomne. Biegną nocą (`nightly.yml:67-96`).
- **Jest:** preset `jest-expo/ios`, `setupFiles: tests/setup.js`, `globalSetup`, `workerIdleMemoryLimit: 1500MB` (`package.json` → `"jest"`). Na macOS potrzebny jest `NODE_OPTIONS=--max-old-space-size=3072` (`testflight.yml:91-97`).

## 7. Lekcje (cytaty)

- `docs/38:172`: przebiegi na `macos-26` „pokazały niestabilność czasową symulatora: … czerwone były za każdym razem inne scenariusze (… stuknięcie zakładki tuż po starcie albo po „Back” zignorowane, klawiatura numeryczna zostająca na ekranie, bezwładność listy po przewinięciu, zgubiony pierwszy znak wpisu). Poprawianie ich pojedynczo się nie zbiegało. Zasada: bramka wydania to krótki pakiet kluczowych przepływów, reszta mierzy niestabilność”.
- `docs/40-lekcje.md:295` (L-006): „scenariusze sprawdzane tylko w interpreterze Jest…; pierwszy kontakt z prawdziwym symulatorem dopiero w pełnym przebiegu (1,5 h…); selektory oparte na widocznym tekście”. Akcje :298-300: szybki przebieg `tylko_scenariusze`, stałe identyfikatory, jedno ponowienie.
- `docs/40-lekcje.md:197-199` (L-013): na iPhone 17e (390 pt) 21 scenariuszy padało na wierszu wyniku tuż nad klawiaturą. Do tego: „`e2e-maly-ekran-ciemny` w praktyce testuje jasny motyw (ustawienie aplikacji `theme: 'light'`… przesłania wygląd systemu)”.
- `docs/40-lekcje.md:67` (L-024/25, przełom doby): „Zegar symulatora to zegar maszyny macOS (zwykle UTC)… scenariusz… z etykietą „today”… może paść, gdy start wypadnie ok. 23:20–00:00 UTC”.
- `docs/40-lekcje.md:262`: interpreter „nie modeluje klawiatury ani przycinania hierarchii, więc Jest tego nie złapał”. Karta zgody na powiadomienia na czystej instalacji wydłuża ekran.
- `docs/40-lekcje.md:344-347` (L-001): archiwum bez podpisu „usunęło z aplikacji i zegarka `com.apple.developer.healthkit`… nie było automatycznego sprawdzenia uprawnień w zbudowanym pakiecie”. Stąd reguła przebiegu dowodowego CI (`CLAUDE.md:41-47`).
- `docs/40-lekcje.md:42` (L-027): krok zależny od przewinięcia trzeba ująć w całości w `retry` (przewinięcie + stuknięcie + asercja).
- `docs/13-research-e2-i-sdk.md:620`: przebieg 37183882533 — „sterownik iOS niegotowy w 240 s (symulator ponad 5 min w „Data Migration” przy pierwszym uruchomieniu)”.
- `docs/38:75`: symulator nie umie okien systemowych (zgoda, HealthKit, wybór pliku), ekranu blokady, haptyki, Live Activity ani zmiany zegara. Takie przepływy idą do Jest albo na listę „telefon”.
- `docs/20-definicja-ukonczenia.md:9-20`: 10 rodzajów testów, w tym E2E i katalog przepływów (`tests/przeplywy.json` + bramka `tests/przeplywy.test.ts`, która każe każdemu ekranowi `app/` mieć przepływ).
