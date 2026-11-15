# 0006. Minimalne wersje systemu: iOS 18, iPadOS 18, watchOS 11
Data: 2026-10-22 · Status: **przyjęta** (P-070 (1a)); uzupełniona 2026-11-15 (P-819: zegarek watchOS 10.0, iOS 18 bez zmian, sekcja na końcu) · Rola: 05 (E1) · Zamyka OP-26 w części wersji

## Kontekst i problem
Expo SDK 57 wymaga iOS 16.4+ (rejestr Expo 1a). Przycisk Live Activity (`LiveActivityIntent`) wymaga iOS 17.0 (rejestr Apple 1e), `CKSyncEngine` iOS 17 / watchOS 10 (8c). Udział systemów na iPhone'ach 7.06.2026: iOS 26 79%, iOS 18 14%, wcześniejsze 7% (rejestr Apple 14).

## Czynniki decyzji
Jedna ścieżka kodu dla F-11, F-21, F-27 · zasięg urządzeń · liczba symulatorów w CI (NFR-SYS-001).

## Rozważane opcje
A. iOS 18 / watchOS 11. B. iOS 17 / watchOS 10. C. iOS 16.4 (minimum Expo) z wariantami zastępczymi.

## Decyzja
Opcja A (właściciel: „1a”, 2026-10-22). watchOS 11 jako wersja odpowiadająca iOS 18 [DO USTALENIA: potwierdzenie par w dokumentacji watchOS przy ADR-0009 w E2; zależność niekrytyczna, bo `CKSyncEngine` i `WatchConnectivity` są w watchOS 10].

### Konsekwencje
- Dobre: brak wariantów kodu na stare systemy; CI na najnowszym symulatorze + iOS 18.
- Złe: tracimy do 7% iPhone'ów (dokładny udział iOS 17 nieznany).
- Czas od premiery nowego systemu do poprawki (druga część OP-26) zostaje otwarty: decyzja procesu roli 07/10.

### Potwierdzenie
- `app.json` / plugin: `ios.deploymentTarget` = `18.0` (sprawdzenie w CI po `expo prebuild`: `IPHONEOS_DEPLOYMENT_TARGET = 18.0` w projekcie Xcode).
- Kod nie zawiera `@available(iOS 17` ani `if #available(iOS 16` gałęzi zastępczych (grep).

## Opcje: zalety i wady
### A — zalety: wszystkie API, najmniej testów · wady: ≤ 7% urządzeń poza zasięgiem.
### B — zalety: część z 7% wraca · wady: jeden system więcej w testach; udział nieznany.
### C — zalety: największy zasięg · wady: dwie ścieżki dla ekranu blokady i iCloud.

## Zmiana 2026-11-15: watchOS 10.0 dla zegarka
Nazwa pliku i tytuł zostają (odwołania w dowodach `verify*.txt` i w `docs/architektura/README.md`). Opcja A dla **iOS 18 / iPadOS 18 bez zmian**; minimum **zegarka** spada z watchOS 11 do **watchOS 10.0**. Status: **przyjęta** (decyzja właściciela 2026-11-15 „Obniż do watchOS 10”, KO-061; zapis P-819, `docs/decyzje.md`).
- **Powód:** zegarek właściciela ma watchOS 10.6.2 i nie dostanie nowszego systemu; aplikacja zegarka z minimum 11.0 nie pojawiała się w „Dostępne aplikacje” (diagnoza buildu 1161, gałąź `claude/br-zegarek-diagnoza-2026-11-15`, `docs/jakosc/zegarek-diagnoza-1161.md`). Zapis „watchOS 11 jako wersja odpowiadająca iOS 18” w sekcji Decyzja był założeniem o parze systemów, nie wymaganiem API (znacznik [DO USTALENIA] z tej sekcji zamknięty: ocena BR z 2026-11-15 nie znalazła w 14 plikach celu żadnego API z watchOS 11).
- **Dowody:** ocena statyczna `docs/jakosc/zegarek-watchos10-ocena.md` (gałąź `claude/br-zegarek-diagnoza-2026-11-15`, 52be19aa): najwyższe wymaganie to watchOS 10.0 (`targets/watch/Aplikacja.swift:16` `onChange(of:initial:_:)`, `:119` `AccessibilityNotification.Announcement`); `CKSyncEngine` i `WatchConnectivity` są w watchOS 10 (CKSyncEngine: sekcja Kontekst; WatchConnectivity od watchOS 2.0: ocena BR). Analogia: Trening ma minimum zegarka 10.0 (`trening:targets/watch-app/expo-target.config.js:7`, @ 2d97581).
- **Potwierdzenie zmiany:** `targets/watch/expo-target.config.js` `deploymentTarget: '10.0'`; `scripts/wydanie/kontrola-ipa.sh` `MIN_WATCH=10.0`; `src/konfiguracja.ts` `MIN_WATCHOS = '10.0'`; README; test `tests/wydanie/zegarek-minimum-watchos.test.ts` (jedna wartość we wszystkich miejscach i skan 9 znanych API z watchOS 11 w `targets/watch` poza osłoną `#available(watchOS 11, *)`; skan to lista nazw, nie dowód zgodności). Dowód zgodności API: kompilacja celu z minimum 10.0 w „Jakość · iOS” (symulatora watchOS 10 runner nie ma: `macos-26` ma tylko watchOS 26.x); działanie na watchOS 10.6.2: zegarek właściciela (T-04, T-105–T-107).
- **Konsekwencje:** dobre: aplikacja zegarka instaluje się na zegarku właściciela; złe: nowsze API zegarka (np. od watchOS 11) tylko w `#available` i bez wymogu; wygląd na watchOS 10 może się różnić od symulatora 26 (ryzyko brzegowe, T-04). Dane użytkowników bez zmian (schemat i format kolejki zegarka nietknięte).
