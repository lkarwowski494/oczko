# Build 3: czerwone e2e 01 i 03 (E2E-B3-01) — stan roli 08, tryb fix (2026-11-10)

Sesja M. Polecenie: `koordynacja:docs/koordynacja/polecenia/M.md` @ 259796c; prompt roli: `oczko-warsztat` `koordynacja/polecenia/M-08-programista-fix-2026-11-10.md`. Start: `claude/youthful-pasteur-kx83sn` @ 87ade5a (kandydat buildu 3). Gałąź: `claude/m-e2e-build3-2026-11-10`. Wyjątek nazwany: gałąź z polecenia koordynatora zamiast `naprawy/08-programista-2026-11-10` z promptu roli.

**Wynik:** niestabilność symulatora (procesy systemowe), nie defekt aplikacji ani scenariusza. Bez zmian w kodzie. Decyzja koordynatora KO-025 (do weta): opcja A, ponowienie joba wyzwolił koordynator (`rerun_failed_jobs` 42797027264, 13:02 UTC). Nowej decyzji P-677 nie było potrzeba.

## Krok i błąd

„Jakość · iOS” #173, run 42797027264, job „e2e (część 2, iphone)”, artefakt `e2e-czesc-2-iphone` (ID 13763243673, wygasa 13.11.2026), tryb ciemny.

| Scenariusz | Krok (maestro.log) | Błąd (junit `e2e-out/<n>.xml`) |
|---|---|---|
| 01-nfr-pie-001 (1. w części) | 10:56:58.660 `Assert that id: oferty-ekran is not visible`; poprzedni krok `Assert that "0", id: dzis-wartosc is visible` COMPLETED 10:56:58.659 | `maestro.DeviceUnreachableException: Device became unreachable during deviceInfo` ← `java.net.ConnectException: Failed to connect to /127.0.0.1:51571` |
| 03-br-lic-001-s2 (2. w części) | 11:00:35.635 `Tap on id: dzis-plus`, 11:00:36.183 zrzut po stuknięciu | ten sam `DeviceUnreachableException … during deviceInfo` |

Asercja żadnego scenariusza nie padła; dlatego `maestro-failures.py` wypisał „brak nieudanych kroków”.

## Przyczyna (logi z artefaktu)

- **01**, `logs/device-xctest.log`: runner Maestro pobiera hierarchię paska stanu (10:56:59.26), potem `error: … testHttpServer : Failed to resolve query: Timed out while evaluating UI query.`, `Fetch status bar hierarchy - duration 48.07` (10:57:47.33), `Test Case … failed (138.851 seconds)`, `Restarting after unexpected exit, crash, or test timeout`.
  `logs/device-simulator.log`: zapytanie `Descendants matching type StatusBar` trafia do **SpringBoard[3071]**; 10:56:59.285411 `XCTPerformOnMainRunLoop[not MT]: waiting with 30.00s responsiveness timeout`, a `[MT]: inside CFRunLoopPerform` dopiero 10:57:16.852415: główna pętla SpringBoard nie odpowiadała 17,5 s.
- **03**, `logs/device-xctest.log`: `GET /screenshot` 11:00:36.186, potem `Failed to get screenshot: Timed out while requesting screenshot.`, `failed (95.293 seconds)`, restart runnera.
  `logs/device-simulator.log`: **testmanagerd[6652]** `Converting image for request` 11:00:36.199 → `Requesting screenshot.` 11:00:42.202 → `Preparing screenshot` 11:01:15.975 (przerwy 6 s i 34 s).
- **Aplikacja odpowiadała:** Oczko[9829] w 01 odpowiedziało na każde zapytanie XCTest w 0,02–0,05 s (`Captured accessibility snapshot data in 0.0Xs`, ostatnie 10:56:59.195); zapytanie o pasek stanu do aplikacji w ogóle nie trafiło.
- **Szum systemu taki sam jak w zielonym przebiegu:** liczba linii `apsd` w `device-simulator.log`: #172 01 = 207 549, 03 = 109 028; #173 01 = 243 806, 03 = 448 026. Czyszczenie stanu aplikacji w 1. scenariuszu: 58 s (#173), 40 s (#172), w dalszych scenariuszach ok. 20 s.
- **Hipoteza I-001 (commit 1aaa238) odrzucona:** 01 padł przed pierwszym stuknięciem; ogłoszenie z `queue: true` jest tylko na ekranie Licznika (`src/ekrany/Licznik.tsx:75`), scenariusze 01 i 03 pracują na karcie „Dziś”.
- **[DO USTALENIA]** przyczyna zawieszenia SpringBoard i testmanagerd (w logach brak wskazania).

## Historia 01 i 03 (#160–#172)

Logi jobów e2e z 9 przebiegów (41 logów; odczyt subagenta, sprawdzone: #172 `[Passed] NFR-PIE-001 … (2m 29s)`, `[Passed] BR-LIC-001/S2 … (1m 18s)`; grep `unreachable|Timed out while` = 0 trafień we wszystkich).

| Przebieg | 01 | 03 |
|---|---|---|
| #172, #171, #167, #165, #164 (próba 2), #163, #161, #160 | zielony, 1. w części 2 | zielony, 2. w części 2 |
| #169 (jasny, `[e2e-ipad]`, gałąź kopii) | zielony | czerwony na asercji `"1", id: dzis-wartosc` (inny przypadek) |
| #164 próba 1 | nie uruchomiono (504 przy pobieraniu Maestro) | nie uruchomiono |

`DeviceUnreachableException` w tych scenariuszach pojawił się pierwszy raz w #173.

## Opcje

- **A (wybrana, KO-025):** bez zmian w kodzie; jedno ponowienie joba części 2 na 87ade5a. Analogia: trening `.github/workflows/e2e-ios.yml:223-228` (przy „deviceInfo failed” cały zestaw jest powtarzany raz jako awaria maszyny). Koszt ok. 90 min macOS.
- **B (znalezisko dla roli 07 po wydaniu):** w pętli „Scenariusze” (`.github/workflows/jakosc-ios.yml`) `DeviceUnreachableException` w junit traktować jako awarię maszyny: jedno ponowienie także dla scenariuszy `stan-licznika`, wykazane osobno. Wymaga zmiany workflowu i doprecyzowania P-091 9a.

## Otwarte

- Wynik ponowienia joba (koordynator).
- Opcja B → rola 07.
