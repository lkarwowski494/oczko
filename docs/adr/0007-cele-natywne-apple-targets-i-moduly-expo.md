# 0007. Cele natywne (Live Activity, zegarek, rozszerzenie udostępniania) jako własny Swift przez `@bacons/apple-targets`, mosty przez Expo Modules API
Data: 2026-10-22 · Status: **przyjęta** (P-071; uzupełniona 2026-10-25) · Rola: 05 (E1) · Zależy od: ADR-0006, ADR-0008, ADR-0009, ADR-0011, ADR-0012

## Kontekst i problem
Kontrakt (05) wymaga: sesji na ekranie blokady z +1 i stoperem (F-11, F-21), aplikacji na zegarku (F-12), rozszerzenia udostępniania (F-24, F-55), PencilKit (F-28), CloudKit (F-27), StoreKit na zegarku. Expo: oficjalny `expo-widgets` (SDK 57) renderuje Live Activity z JS w izolowanym środowisku, a przycisk zmienia tylko właściwości widżetu „with no running app process required” (rejestr Expo 6d) — nie ma intencji, więc +1 nie trafiłby do bazy. Rozszerzenia w CNG: „experimental” (6b). `@bacons/apple-targets` 5.0.0 obsługuje m.in. watch, widget, share (6c), z zastrzeżeniem autora „I haven't tested all of these”.

## Czynniki decyzji
+1 z ekranu blokady musi zapisać zdarzenie (ADR-0008) · `expo prebuild` powtarzalny w CI (bez ręcznie edytowanego `ios/`) · utrzymanie przy aktualizacji SDK.

## Rozważane opcje
A. `@bacons/apple-targets`: cele `widget` (Live Activity z `LiveActivityIntent` w Swift), `watch`, `share`; kod Swift w `targets/`; mosty JS ↔ Swift jako moduły Expo Modules API w `modules/` (dziennik +1, CloudKit, PencilKit, ochrona czasu w tle, WatchConnectivity).
B. `expo-widgets` dla wyglądu Live Activity + osobne cele dla reszty.
C. Własne config pluginy dodające cele do projektu Xcode.
D. Katalog `ios/` w repo (bez CNG), ręcznie w Xcode.

## Decyzja
Opcja A. Wersja `@bacons/apple-targets` przypięta dokładnie, z regułą wieku ≥ 14 dni (jak P-036). Każdy cel to cienki adapter: logika (limit, scalanie, wartość) liczona w JS przez aplikację albo powielona w Swift tylko tam, gdzie JS nie działa (zegarek bez telefonu, intencja przy uśpionym JS) — wtedy Swift ma te same wektory co domena TS (test wspólnych wektorów w CI).

### Konsekwencje
- Dobre: jedna technika dla trzech celów; prebuild w CI; Live Activity z prawdziwą intencją.
- Złe: paczka społeczności w krytycznej ścieżce buildu (ryzyko utrzymania); logika limitu w dwóch językach na zegarku (koszt testów wspólnych wektorów).
- Odrzucenie B nie wyklucza `expo-widgets` dla widżetu ekranu głównego w przyszłości (poza zakresem wersji 1).

### Potwierdzenie
- CI (07): `npx expo prebuild --clean` + `xcodebuild build` dla schematów aplikacji, widżetu, zegarka i rozszerzenia na runnerze macOS (ADR-0014).
- Test wspólnych wektorów: `wektory-limitu.json` i `scal-wektory.json` uruchamiane w Node i w testach Swift (XCTest) celu zegarka.
- `granice.mjs`: brak katalogu `ios/` w repo.

## Uzupełnienie 2026-10-25 (fix 05: Z07-12, P-109)
- **Jeden pakiet Swift reguł `OczkoReguly`** (Swift Package w `modules/oczko-reguly/`, bez zależności od UIKit, ActivityKit i WatchConnectivity), używany przez cele `widget` (intencja) i `watch`: `mozeZaczacDzien` i `wolaStraznika` (`docs/monetyzacja/limit.mjs`), `proZegarka` (KP-17, `docs/monetyzacja/dostep.mjs`), dzień lokalny RD-16 (`YYYY-MM-DD`, kalendarz gregoriański, cyfry ASCII, niezależnie od języka i kalendarza urządzenia, ER-37) i dekoder `StanEkranuBlokadyV2` (moduly.md).
- **Test bez symulatora:** `swift test` pakietu na runnerze macOS (bez `xcodebuild` i bez symulatora) na tych samych plikach JSON co Node: `wektory-limitu.json` (L-*, S-*, Z-*), `wektory-dostepu.json` (PZ-*), wektory RD-16 z `tests/wektory/brd.json`, złote pliki stanów `tests/wspolne/`. Każdy zestaw raportuje „wykonano N z N” (N = liczba wektorów w JSON, 0 = błąd), a wykonane id = id z JSON.
- **Stałe:** `LIMIT_DNI_W_MIESIACU`, `PRZERWA_NOWEGO_DNIA_MS`, `LASKA_OFFLINE_MS` w Swift generowane z jednego pliku JSON wytwarzanego z `src/konfiguracja.ts` (test: stałe Swift = JSON; ręczna zmiana w Swift = czerwone).
- **Siła testu:** mutant `<` → `<=` w porównaniu limitu i granica `wygasa = teraz` w `proZegarka` muszą czerwienić `swift test` (sprawdzenie raz przy dodaniu pakietu, potem w przeglądzie 07).
- Intencja wymagająca procesu aplikacji (`DziennikPlus`, plik niedostępny przed odblokowaniem) zostaje w XCTest celu po prebuild (`tests/wspolne/xctest-specyfikacja.md`).

## Opcje: zalety i wady
### A — zalety: wszystkie cele, CNG · wady: paczka społeczności, Swift.
### B — zalety: oficjalne, JSX · wady: przycisk bez intencji nie zapisze rzędu (6d); i tak potrzebne osobne cele dla zegarka i udostępniania.
### C — zalety: pełna kontrola · wady: dużo kodu modyfikującego projekt Xcode.
### D — zalety: prostota na start · wady: brak powtarzalnego prebuild, konflikty przy aktualizacji SDK.
