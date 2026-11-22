# 0021. Bez aktualizacji OTA w wersji 1: każda poprawka to nowy build przez CI i recenzję Apple (z prośbą o przyspieszenie przy błędzie krytycznym)
Data: 2026-10-22 · Status: **przyjęta** (P-080 (4c)) · Rola: 12 (E1) · Zależy od: ADR-0014, ADR-0016, ADR-0019, NFR-KOS-001

## Kontekst i problem
Czy błąd w JS poprawiać bez nowej wersji w sklepie. Fakty (odczyt 2026-10-22): EAS Update w planie Free: „1,000 MAUs”, „The Free plan has no update overage pricing; it is limited to its included monthly active users” (expo.dev/pricing.md); wytyczna 2.5.2: aplikacja nie może „download, install, or execute code which introduces or changes features or functionality of the app” (developer.apple.com/app-store/review/guidelines); wycofanie złej aktualizacji „may not always be safe; your broken update may, for example, have modified persistent state” (docs.expo.dev/eas-update/error-recovery); recenzja Apple: „typically reviewing at least 50% of submissions in less than 24 hours and 90% in less than 48 hours”, przy przyspieszonej recenzji krytycznego błędu „include the steps to reproduce the bug on the current version of your app” (developer.apple.com/distribute/app-review). Buildy idą przez GitHub Actions bez konta Expo (ADR-0014); `expo-updates` nie ma w ADR-0016.

## Czynniki decyzji
Koszt 0 zł bez usług · czas poprawki · ryzyko danych przy wycofaniu · wytyczne · utrzymanie przez jedną osobę.

## Rozważane opcje
A. `expo-updates` + EAS Update Free.
B. `expo-updates` + własny serwer protokołu Expo Updates.
C. Bez OTA; poprawka = nowy build w CI i recenzja Apple.

## Decyzja
Opcja C (właściciel: „4c”, P-080). Tor poprawki (szczegóły w runbooku, E3): test odtwarzający → poprawka → build w CI (`workflow_dispatch`/tag, środowisko `testflight` z zatwierdzeniem właściciela, ADR-0014) → wstrzymanie wydania stopniowego wadliwej wersji (P-080 (5a)) → wysyłka z prośbą o przyspieszoną recenzję (kroki odtworzenia na obecnej wersji). Każdy krok zewnętrzny za osobną zgodą właściciela. W czasie oczekiwania dostęp do danych chroni strażnik startu (ADR-0019). Powrót do OTA wymaga nowego ADR (warunek: zmierzony czas od zgłoszenia do poprawki w sklepie, który właściciel uzna za zbyt długi).

### Konsekwencje
- Dobre: brak konta i usługi Expo; brak ryzyka 2.5.2; brak klasy błędów „zła aktualizacja OTA” i „wycofanie OTA psuje dane”; jedna droga kodu do użytkownika (binarka po recenzji).
- Złe: poprawka dociera po recenzji (zwykle do 48 h) i tylko do osób, które zaktualizują aplikację; brak wbudowanego odzyskiwania `expo-updates` po błędzie JS w pierwszych sekundach (zastępuje je strażnik, który łapie też awarie natywne i migracje).
- Prywatność: aplikacja nie odpytuje żadnego serwera aktualizacji. Koszt: 0 zł (runnery GitHub w repo publicznym, ADR-0014).

### Potwierdzenie
- Kontrola w CI: `expo-updates` nieobecny w `package.json` i w pliku blokady jako zależność bezpośrednia; `app.json` bez sekcji `updates`.
- Runbook (E3): drzewo „OTA czy build” z modułu `incydent-i-poprawka` zawężone do gałęzi „nowy build”; szablon wniosku o przyspieszoną recenzję.

## Opcje: zalety i wady
### A — zalety: poprawka JS w minuty, odzyskiwanie `expo-updates` · wady: konto Expo, limit 1,000 MAU w planie Free, ryzyko 2.5.2 przy zmianie zachowania, wycofanie niebezpieczne po zmianie danych, druga droga wydań do pilnowania.
### B — zalety: bez limitu MAU · wady: serwer do utrzymania (łamie koszt 0 zł albo wymaga darmowego hostingu, niesprawdzone), te same ryzyka 2.5.2 i danych.
### C — zalety: najprostsze, zero usług, jedna droga wydań · wady: czas recenzji, brak poprawki dla osób bez aktualizacji.
