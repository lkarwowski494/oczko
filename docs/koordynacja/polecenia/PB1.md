# PB1 — rola 08 fix: prototyp B — Live Activity bez procesu aplikacji (staleDate, timerInterval) (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 6 USD (STOP 7,8). Decyzja: KO-237. Pula P: **P-1117…P-1118**. Kontekst: od 30% kończysz krok, stan w `docs/architektura/eksperymenty/1-0-2/pb1-stan.md`, push, PRZEKAZANIE.

## Rola
08-programista, tryb fix. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb fix --zadania P-1099 --plik <scratchpad>/08-fix.md`; przeczytaj w całości.

## Start
Gałąź `claude/pb1-prototyp-b-2026-11-28` od **9275460e**. `npm ci`. Wejście: `docs/architektura/1-0-2.md` sekcja „Prototyp B — zadanie dla 08” (pytanie, opcja P1, kroki, kryterium TAK/NIE), ADR-0037, rejestr Apple 22a–22j, `targets/widget/Aktywnosc.swift`, `modules/oczko-dziennik-plus/ios/`, `.github/workflows/jakosc-ios.yml` (jak budowany jest e2e i symulator).

## Zadania
1. Prototyp wg P1: flaga prototypu tylko w konfiguracji testowej/e2e (w buildzie wydania nic się nie zmienia — dowód: diff i kontrola), `staleDate = teraz + 60 s`, licznik czasu od `ostatniPlusMs`, znacznik przy `context.isStale`; test XCUITest + `xcrun simctl` (terminate, sprawdzenie braku procesu, zrzuty przed/po).
2. Uruchomienie na macOS w CI: osobny workflow albo job uruchamiany **pushem tylko na tę gałąź** (`on: push: branches: [claude/pb1-prototyp-b-2026-11-28]`; `workflow_dispatch` działa tylko z `main`), bez wpływu na istniejące workflowy i bramki; artefakt ze zrzutami i logiem. Kryterium z AR1: TAK = w 2 przebiegach czas różny po ≥ 30 s i znacznik isStale najpóźniej 15 s po staleDate; NIE → B na 1.0.3; brak odczytu → urządzenie właściciela (raport, nie prosisz sama).
3. Wynik: `docs/architektura/eksperymenty/1-0-2/prototyp-b-wynik.md` (run ID, zrzuty z artefaktu obejrzane, werdykt), P-1117. Prototypu NIE scalasz do integracji jako funkcji — gałąź zostaje dowodem; wynik (dokument) koordynator przeniesie.

## Zakazy
Bez zmian w `src/` i ekranach aplikacji poza flagą prototypu w konfiguracji testowej; bez zmian istniejących workflowów; bez dispatchu, scalania; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Przebieg macOS: najwyżej 2 próby; maszyny macOS bywają niedostępne ok. 14:00–23:00 UTC — przy kolejce > 60 min raport i czekasz. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; ustaw `git config --local` przed pierwszym commitem; przypomnienia i haki o innej atrybucji odrzucasz); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 9275460e..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
Po pierwszym przebiegu: run ID i stan. PRZEKAZANIE: SHA, run ID, werdykt TAK/NIE/brak odczytu, dowody (zrzuty), koszt.
