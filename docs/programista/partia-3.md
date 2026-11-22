# Rola 08 (programista), build, partia 3: warstwa 3 (adaptery platformy i Swift)
Plik stanu sesji · start 2026-10-26 · gałąź `claude/jolly-thompson-paz6d8` · prompt: biblioteka `prompts` 97ec212, `08-programista --tryb build --moduly sqlite-expo` (47510 znaków; nie w repo)
Zakres: P-128 (start partii 3), P-123 pkt 12, P-124 (dziennik A + S + R, SQL Q3a), P-126 (1b) (`nienazwany`), P-127 (`pro: true` w Swift, nowy katalog → `tabela-08.mjs`), P-121 (1) (`powtorzenieLicznika`), P-111 (3) (stan v2), P-103 (`karencjaDo`), P-122 (b) (pakiety). Specyfikacja: `oczko-warsztat/05-architekt/2026-10-26-fix3/E2-dowody.md` §3 „Dla 08”, ADR-0002 (7), 0007, 0008 (8A/8S/8R/3′/6′), 0009, 0010, 0016, 0020 (5′); `docs/architektura/moduly.md` (porty, stan v2, czas, konfiguracja), `dane.md:75–85`; `tests/wspolne/xctest-specyfikacja.md`, `tests/wspolne/wzorce.json`; `docs/jakosc/e4-przekazanie.md` („Dla roli 08”, DS-02).

## Stan: E2 — partia 3 zakończona → STOP E2 (P-128–P-131)
3A (44b73e5…11b21b8) i 3B (e9d8e0a, 36a3da4) przyjęte (P-130, P-131). 3C (70699b2…1108964): decyzja intencji ±1 w pakiecie Swift, moduł `oczko-dziennik-plus` z Live Activity, intencją, SHA-256 natywnie (P-130) i łączem zegarka, cel widget i watch, moduł `oczko-czas-w-tle`, adaptery TS; minimum iOS 18.0. 3D: Sklep na expo-iap (bbd8827), magazyn plików i skrót wstrzykiwany do archiwum, Zegar, Haptyka, EkranAktywny (80e4658), odświeżenie LA i zegarka po COMMIT (b4f18d0). 3E: pomiar w Node, reszta „do urządzenia”. `npm run verify` kod 0, **1553/1553**; CI na 43a02b7: Linux, swift-test, build iOS z kontrolą celów natywnych zielone. Dowody: `oczko-warsztat/08-programista/2026-10-26-partia3/E2-dowody.md`, `pomiary-3E.md`. Następny krok (po akceptacji): partia 4 — ekrany.

## E0.1 Środowisko
| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux 6.18 x86_64, Node v22.22.0 (`node:sqlite`), chmura (`CLAUDE_CODE_REMOTE`); tożsamość git jak w poleceniu |
| GitHub | push na gałąź roboczą; `oczko-warsztat` z zapisem (P-010); `prompts` 97ec212 do złożenia promptu; `trening` tylko odczyt (analogie P-087) |
| Xcode / symulator / Swift | **brak** — `swift test`, `expo prebuild`, `xcodebuild` i symulator tylko w CI „Jakość · iOS” (`macos-26`); w tej partii tylko ta sesja pushuje |
| Sieć | npm działa (`npm ci` kod 0, `npm view` 2026-10-26) |
| Repo | publiczne: bez sekretów, danych osobowych i nazw innych firm/aplikacji (P-121 (5)) |

## E0.2 Stan wyjściowy (HEAD 71138d7, po `npm ci`, `env -u NODE_PATH`)
| Komenda | Wynik |
|---|---|
| `npm run verify` (typecheck, typecheck:testy, lint, jakosc:kontrole, jest) | kod 0, 62 zestawy, **1449/1449** |
| `npm run test:akceptacja` | 98 testów: znacznik 89 (ekrany, warstwa 4), zielony-ok 4, **asercja 5** (`dziennik-sklejenie`: S-01, S-03, K-01–K-03 — czerwień z właściwego powodu od 05 fix-3), kod 0 |
| `npx expo install --check` | rozbieżności względem najnowszego `expo` 57.0.31 (z 2026-10-21): `expo-router` 57.0.27 → ~57.0.29, `expo` → ~57.0.31, `typescript` → ~6.0.3; zainstalowany `expo` 57.0.29 ma w `bundledNativeModules.json` `expo-router ~57.0.27` (zgodne) |
Warstwa 3 nie ma testów Jest od 07 (poza `dziennik-sklejenie`); testy natywne to specyfikacja `xctest-specyfikacja.md` (X-DZ, X-ST, X-RG), kodu Swift i celów nie ma (`modules/`, `targets/` puste), a `jakosc-ios.yml` nie ma jeszcze zadania `swift test`/`xctest`.

Wiek wersji (P-036, ≥ 14 dni = wydane najpóźniej 2026-10-12), `npm view … time` 2026-10-26: `expo-crypto` 57.0.4 (2026-10-12) **tak**; `expo-router` 57.0.29 (2026-10-21) **nie**, 57.0.27 (2026-10-14) nie, 57.0.26 (2026-10-12) tak; `expo` 57.0.31 (2026-10-21) nie; `expo-iap` 5.8.1 (2026-09-26) tak; `@bacons/apple-targets` 5.0.0 (2026-07-17) tak; `expo-keep-awake` 57.0.2 (2026-09-11) tak; `expo-sharing` 57.0.24 (2026-10-21) nie, 57.0.23 (2026-10-12) tak.

## E0.3 Plan (każdy krok kończy się zielonym `npx jest`, typecheck, lint, `jakosc:kontrole`; krok natywny dodatkowo zielonym „Jakość · iOS” przed kolejnym krokiem natywnym)
Procedura DS-02 jak w partiach 1–2: zaślepka → najprostszy wynik → czerwień na asercji (fragment do dowodów) → kod → przeniesienie testu z `tests/akceptacja/` do `tests/` w commicie, który go zazielenia. Strona Swift: test `swift test`/XCTest najpierw czerwony w CI (przebieg z ID), potem kod.

**3A — Linux, dane (najpierw: utrata danych P0)**
| Krok | Zachowanie → test | Pliki |
|---|---|---|
| A1 | (8R) zdarzenie ze sklejonej linii; (8S) `skroc` usuwa ucięty ogon, `doId` w linii sklejonej → `dziennik-sklejenie.test.ts` (5 czerwonych dziś) → `tests/dane/` | `src/dane/dziennik.ts` |
| A2 | (3′) `blad` z całą linią `{linia, tekst ≤ 4096}`, jeden wpis na ten sam ogon (`INSERT … WHERE NOT EXISTS`) → nowy test 08 „dwa scalenia pliku z samym ogonem → 1 wiersz” (kontrakt 05) | `src/dane/dziennik.ts`, `repozytoria/bledy.ts` |
| A3 | SQL fix-3: `ukonczono_dzien` + CHECK, `nienazwany` + CHECK, `PRAGMA application_id = 1331919467` w `schemat.sql` i `0001.sql` (`generuj-migracje.mjs`); stała `APPLICATION_ID` + test równości; `sprawdzKopie` → `obca` przed kontrolą tabel; `ukoncz`/`wznow`/`zmienDateUkonczenia` oba pola; `podsumowanieTygodnia` po `ukonczono_dzien` (wyrocznia UTC+3 / UTC−5 z `moduly.md`); projekt roboczy `nienazwany = 1`, nadanie nazwy jedną instrukcją, „Zrób taką samą” → roboczy → testy 08 z wyroczni 05; `bateria-schematu` | `docs/architektura/schemat.sql`, `src/dane/migracje/*`, `kopia-ratunkowa.ts`, `repozytoria/{projekty-zapis,kalendarz,projekty}.ts`, `przypadki-uzycia/projekt.ts` |
| A4 | ZIP: > 65 535 wpisów → odmowa, bit 0 (szyfrowanie) → odrzucenie, 4 GiB jako `Wynik` z usunięciem niepełnego pliku → testy 08 (pułapki na spreparowanym katalogu centralnym) | `src/dane/archiwum/zip.ts`, `archiwum.ts` |
| A5 | `CzasWTle.chron(nazwa, fn: (s: { wygaslo(): boolean }) => …)`: sprawdzenie między instrukcjami importu, wygaśnięcie → wyjątek → `ROLLBACK`; import jedną transakcją (ADR-0002 (7)) → test „wygaśnięcie w połowie → baza = przed” | `porty.ts` + blok `moduly.md` (sprawdz-porty), `przypadki-uzycia/archiwum.ts`, `tests/dane/pomocnicze/srodowisko.ts:87` |
| A6 | ATTACH → transakcja → DETACH w jednej pozycji `wKolejce` (dziś trzy: `przeniesienie.ts:25–34`) → test „zapis z kolejki w trakcie przywrócenia nie wchodzi między ATTACH a transakcję”; `blad` i klucze urządzenia po „zastąp” jak przed | `src/dane/baza/przeniesienie.ts` |
| A7 | `powtorzenieLicznika` (P-121 (1)); `tryb-licznika.test.ts` woła ją (zmiana wywołania 07, asercje bez zmian) | `src/domena/licznik.ts` |
| A8 | pakiety: `expo-crypto` 57.0.4 (UUID w adapterze `Identyfikatory`; SHA-256 plików zostaje w TS — `digest` bierze cały bufor), reszta według Q4/Q5 | `package.json`, ADR-0016 (wiersze) |

**3B — pakiet Swift reguł i dziennika (`swift test` w CI, bez symulatora)**
| Krok | Zachowanie → test | Pliki |
|---|---|---|
| B1 | zadanie `swift-test` w `jakosc-ios.yml` (najpierw informacyjne) + pakiet z pustym testem „wykonano 0 z N” → czerwony | `.github/workflows/jakosc-ios.yml`, `Package.swift` |
| B2 | X-RG-01–06: `mozeZaczacDzien`, `wolaStraznika`, `startDnia`, `proZegarka`, `dzien` RD-16 na `wektory-limitu.json`, `wektory-dostepu.json`, `brd.json` RD-16; stałe Swift z JSON generowanego z `konfiguracja.ts` (test: ręczna zmiana = czerwone); mutanty `<`→`<=` i `wygasa = teraz` raz przy dodaniu | pakiet `OczkoReguly`, `scripts/` generator stałych |
| B3 | X-ST-01–06: dekoder `StanEkranuBlokadyV2` (bez wartości domyślnych, `wersja` > znana → odrzucenie), rozmiar < 4096 B — po przełączeniu v1 → v2 (krok D1) | pakiet |
| B4 | `DziennikPlus` (rdzeń pliku): (8A) `\n` przy ogonie, jeden `write` `O_APPEND`, `fsync`, `ftruncate` przy krótkim zapisie/błędzie (atrapa uchwytu), odczyt (8R), `skroc` (8S); koder z kolejnością pól i `pro: true` jak linia 3 złotego pliku → X-DZ-01–06, 09, 11–13 na `wzorce.json` i złotych plikach | pakiet (`OczkoDziennik`) |
Kontrola „wykonano N z N” w każdym zestawie; N = 0 albo brak pliku w manifeście = czerwone (R-032).

**3C — moduły Expo i cele natywne (prebuild + `xcodebuild` w CI)**
| Krok | Zachowanie | Pliki |
|---|---|---|
| C1 | `@bacons/apple-targets` 5.0.0 (przypięte dokładnie), cel `widget`: Live Activity (stan v2, stoper od `sesjaStartMs`, komunikat limitu, „Unlock to count”) + `LiveActivityIntent` (+1/−1: reguły z pakietu, rodzic = `glowa`, stan po `fsync`, X-DZ-08, X-DZ-10 migawka nazw) | `targets/widget/`, `app.json` |
| C2 | moduł `oczko-dziennik-plus` (odczytaj, skroc; jedyny pisarz w procesie) + adapter TS `src/platforma/dziennik-plus.ts` | `modules/oczko-dziennik-plus/` |
| C3 | moduł `oczko-czas-w-tle` (`beginBackgroundTask` z sygnałem wygaśnięcia → `wygaslo()`), adapter TS | `modules/oczko-czas-w-tle/`, `src/platforma/czas-w-tle.ts` |
| C4 | moduł Live Activity (start/aktualizuj/zakończ, `ActivityKit`) + adapter TS `LiveActivity` | `modules/oczko-live-activity/` [nazwa do Q3], `src/platforma/live-activity.ts` |
| C5 | zegarek: cel `watch` (stan z kontekstu, kolejka wysłanych, `proZegarka`, `mozeZaczacDzien` z pakietu) + moduł `oczko-zegarek` (`WCSessionDelegate`: `updateApplicationContext`, `didReceiveUserInfo` → linia `zrodlo: 'zegarek'` przez `DziennikPlus` — trwała skrzynka) + adapter `Zegarek` | `targets/watch/`, `modules/oczko-zegarek/`, `src/platforma/zegarek.ts` |
Każdy krok: prebuild + build w CI zielony przed następnym; kontrola `SWIFT` (bez `import SQLite3`) i `IOS` (bez `ios/`).

**3D — adaptery TS platformy (logika mapowania w Node, cienkie wywołanie API)**
| Krok | Zachowanie → test | Pliki |
|---|---|---|
| D1 | przełączenie stanu v1 → v2 (P-111 (3)): `porty.ts` + blok `moduly.md`, `tests/wspolne/stan-*.json` + `*-v1.json`, `wzorce.json` `wersja_kontraktu: 2`, `zlote-pliki.test.ts`, wejście `stanZegarka` w testach 07, generator złotych plików z kodu TS + test zgodności; funkcja `stanEkranuBlokady(...)` (nazwa zapasowa/etykieta `nienazwany`, ucięcie do `STAN_NAZWA_MAKS_ZNAKOW`, przypomnienia ≤ 3/40) | `src/domena/`, `tests/wspolne/`, `tests/jakosc/zlote-pliki.test.ts` |
| D2 | `Sklep` na `expo-iap` 5.8.1: mapowanie zakupów → `Transakcja` z `karencjaDo` = `renewalInfoIOS.gracePeriodExpirationDate` gdy liczba, inaczej `null` (P-103, ADR-0010) — test mapowania na danych z `unknown`; sztuczny sklep (`EXPO_PUBLIC_STORE_FAKE`, kontrola `SZTUCZNY-SKLEP`) | `src/platforma/sklep/` |
| D3 | `Zegar` (system + `tryb-e2e.ts` `oczkoE2eTeraz`), `Identyfikatory` (`expo-crypto` `randomUUID`), `Haptyka` (`expo-haptics`), `EkranAktywny` (`expo-keep-awake`: `activateKeepAwakeAsync`/`deactivateKeepAwake` z tym samym tagiem), `MagazynPlikow` na `pliki/system.ts`, `bazaExpo` z URI `file://` | `src/platforma/*` |
| D4 | podłączenie: `naPierwszyPlan`/start → po `COMMIT` `LiveActivity.aktualizuj` i `Zegarek.wyslijStan` (ADR-0008 (7)); `tabela-08.mjs` zna nowe katalogi testów (P-127) | `src/przypadki-uzycia/`, `docs/jakosc/narzedzia/tabela-08.mjs` (wpis) |

**3E — pomiary (ryzyka nazwane; Q6)**: CRC-32 + SHA-256 pliku 400 MB, `Intl.DateTimeFormat` ze strefą (RD-16) na Hermes, długa transakcja importu (0xdead10cc) — według decyzji Q6; wynik w dowodach z ID przebiegu albo nazwany stan „do urządzenia” z planem dla właściciela.

Poza partią 3 (lista do przekazania): ekrany (partia 4), `przelicz`/`rozmiarUS` jako `Wynik` (partia ekranu narzędzi), iCloud/CloudKit, PencilKit, rozszerzenie udostępniania i `SkrzynkaImportu` (Q8).

## E0.4 Luki i decyzje (dla koordynatora, P-087)
- **Q1 Organizacja partii (ok. 25–30 h agenta, 15–25 przebiegów iOS).** (a) Jedna sesja, kolejność 3A → 3B → 3D1 → 3C → 3D2–D4 → 3E; STOP E1 tylko przy odstępstwie; 3A (utrata danych) wypchnięte i zielone, zanim zacznie się kod natywny. (b) Partia 3 = 3A + 3B (+ D1), STOP E2; 3C–3E w osobnej sesji (partia 3′) — krótszy kontekst, dodatkowa sesja i przekazanie. **Rekomendacja: (a)** z punktem kontrolnym (plik stanu wypchnięty po 3A i po 3B), bo 3C zależy od rdzenia 3B, a zasada „jedna sesja na rolę” i tylko jeden pisarz na gałęzi.
- **Q2 Gdzie testy `DziennikPlus` i reguł Swift.** Specyfikacja: reguły w pakiecie `swift test`, `DziennikPlus` jako XCTest celu po prebuild. (a) **Jak Trening** (`targets/Package.swift` → `swift test` na rdzeniu `watch-app/Core`; kopia `RestTimerAttributes.swift` w module i widżecie pilnowana przez `scripts/verify-native.mjs`): jeden pakiet Swift (`OczkoReguly` + `OczkoDziennik`, Foundation + POSIX, bez UIKit/ActivityKit/WatchConnectivity) testowany `swift test` bez symulatora — także rdzeń pliku dziennika (X-DZ-01–06, 09, 11–13 na prawdziwych plikach i atrapie uchwytu); cele i moduł Expo dostają kopie plików źródłowych z kontrolą identyczności w `jakosc:kontrole` (Linux); X-DZ-07, X-DZ-10 przez rdzeń + migawkę nazw w teście pakietu, przebieg intencji na symulatorze → E2E partii 4 i lista TT. (b) Jak specyfikacja: XCTest celu aplikacji po prebuild (skrypt dodający cel testów do projektu Xcode, jak Trening `add-watch-ui-tests.mjs`) na symulatorze — bliżej procesu aplikacji, ale każdy przebieg 30+ min i więcej kodu skryptów. **Rekomendacja: (a)**; zmiana miejsca testów X-DZ z XCTest celu na `swift test` pakietu do zatwierdzenia przez 05 (specyfikacja 07 dopuszcza pakiet dla reguł).
- **Q3 Moduł Live Activity.** `moduly.md` wymienia moduły `oczko-dziennik-plus`, `oczko-icloud`, `oczko-pencilkit`, `oczko-zegarek`, `oczko-czas-w-tle`, a port `LiveActivity` (start/aktualizuj/zakończ przez ActivityKit) nie ma modułu. (a) Live Activity w module `oczko-dziennik-plus` (jedno miejsce stanu i pisarza; intencja i stan obok siebie). (b) Osobny moduł `oczko-live-activity` (jak Trening `rest-activity`). **Rekomendacja: (a)**: stan po `fsync` (8A) zmienia ta sama klasa, więc jeden moduł unika drugiej ścieżki stanu; nazwa w drzewie `moduly.md` bez zmian (zgłoszenie do 05).
- **Q4 `expo-router` ~57.0.29 a reguła wieku (P-036).** 57.0.29 i `expo` 57.0.31 mają dziś 5 dni; `expo install --check` porównuje z najnowszym `expo`. (a) Zostaje `expo` 57.0.29 (lock) i `expo-router` 57.0.27 = `bundledNativeModules.json` zainstalowanego `expo` (zgodność potwierdzona tym plikiem); podniesienie `expo` 57.0.31 + `expo-router` ~57.0.29 razem od 2026-11-04 (wiek ≥ 14 dni) — wpis w ADR-0016 jako „następna aktualizacja”. (b) `expo-router` 57.0.29 teraz jako wyjątek nazwany od P-036. **Rekomendacja: (a)** (reguła wieku ma pierwszeństwo, jak P-122 (b)).
- **Q5 Pakiety partii 3.** (a) Tylko pakiety portów tej partii: `expo-crypto` 57.0.4, `expo-keep-awake` 57.0.2, `expo-iap` 5.8.1 (dokładnie), `@bacons/apple-targets` 5.0.0 (dokładnie; Trening ma `^5.0.0`, ADR-0007/0016 wymagają dokładnego); `expo-image-picker`, `expo-sharing` (~57.0.23), `expo-store-review` z ekranami (partia 4), jak P-120 Q6a. (b) Wszystkie z ADR-0016 teraz. **Rekomendacja: (a).**
- **Q6 Pomiary na Hermes i urządzeniu.** W chmurze nie ma Hermesa ani urządzenia; ekranów nie ma, więc E2E nie ma czego otworzyć. (a) Pomiar referencyjny w Node (V8) teraz + uprząż pomiarowa tylko w buildzie E2E (`tryb-e2e.ts`, argument startu, wynik w `testID` czytany scenariuszem Maestro na symulatorze w CI) dla CRC-32/SHA-256 400 MB i `Intl` ze strefą (RD-16); symulator to górna granica szybkości (CPU Maca), więc budżet „najstarsze urządzenie” zostaje nazwanym stanem „do urządzenia” z planem dla właściciela/testerek (TestFlight, lista TT); transakcja importu i 0xdead10cc tylko na urządzeniu (zawieszanie w tle nie jest odtwarzalne na symulatorze). (b) Tylko Node + plan „do urządzenia” dla wszystkich trzech; uprząż w partii 4 razem z ekranami. **Rekomendacja: (b)** — uprząż przed ekranami to kod bez ekranu do pokazania wyniku (zasada „bez kodu na zapas”), a odpowiedź o budżecie i tak daje dopiero urządzenie; `Intl` na Hermes sprawdzi pierwszy scenariusz E2E z datą w partii 4.
- **Q7 Przełączenie v1 → v2 (P-111 (3): „jeden commit 07 + 08”).** Sesje 07 są zamknięte. (a) 08 robi przełączenie w jednym commicie razem z mechanicznym dopasowaniem testów 07 (listy pól w `zlote-pliki.test.ts`, wejście `stanZegarka`, pliki `*-v1.json`), asercje bez zmian, lista do przeglądu 07 (precedens P-120 Q4a). (b) Najpierw sesja 07. **Rekomendacja: (a).**
- **Q8 CloudKit (ADR-0005), PencilKit (ADR-0012), rozszerzenie udostępniania i `SkrzynkaImportu` (ADR-0011)** — adaptery z tej samej warstwy, ale poza listą P-128. (a) Poza partią 3: każdy z funkcją, która go używa (F-27, F-28, F-24), według kolejności kontraktu zakresu, jak P-121 (3). (b) W partii 3. **Rekomendacja: (a).**
- **Bez decyzji (wykonuję):** zadania `swift-test` (i później `xctest`) w `jakosc-ios.yml` dopisuje 08 (specyfikacja: „strona Swift to zadanie roli 08”), najpierw informacyjne, bramka po pierwszym zielonym przebiegu; stałe Swift generowane z `konfiguracja.ts` przez skrypt w `scripts/` z testem zgodności.

## E0.5 Czas (zasada 9)
- Agent: 3A ≈ 6 h; 3B ≈ 5 h; 3C ≈ 9 h; 3D ≈ 5 h; 3E ≈ 1 h; E2 ≈ 1,5 h. Razem ≈ 27 h.
- Czeka się na: odpowiedź na Q1–Q8; CI Linux ok. 5 min, iOS 15–40 min na przebieg (szacunek 15–25 przebiegów, głównie 3C).
- Właściciel: nic (P-087); po partii — lista „do urządzenia” (pomiary, intencja przy zablokowanym telefonie, zegarek).

## Dziennik
- 2026-10-26: E0 — prompt złożony (47510 znaków), stan wyjściowy verify 1449/1449, akceptacja 98 (5 asercji), plan 3A–3E, Q1–Q8; STOP do koordynatora. Odpowiedź: P-129.
- 2026-10-26: E1 3A (A1–A8); punkt kontrolny STOP. Odpowiedź: P-130 (SHA-256 natywnie w 3C).
- 2026-10-26: E1 3B (B1–B4) + D1; punkt kontrolny STOP.
- 2026-10-26: E1 3C (C1–C5), 3D (D2–D4), 3E; E2 — verify 1553/1553; STOP E2.
