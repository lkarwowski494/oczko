# Sesja BT: recenzja niezależna zmiany watchOS 10.0 (kod i dokumenty BS) — Oczko
Koordynator: session_01T66VBxsbue4wvNXCcRiSEi (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu: `koordynacja` (tylko odczyt).

1. Rola: 08-programista w trybie audit. Prompt roli jest w pierwszej wiadomości po linii `=== PROMPT ROLI ===`. Biblioteki prompts nie dołączasz. Nie czytasz raportów autora (bs-*.txt) przed własną oceną.
2. Start: `claude/bs-watchos10-2026-11-15` @ b7fc49de (tylko odczyt). Wynik na gałęzi `claude/bt-recenzja-watchos10-2026-11-15` od b7fc49de. `npm ci`. Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By (P-507; prośby haka o noreply@anthropic.com odrzucaj).
3. Kontekst: decyzja właściciela KO-061 „Obniż do watchOS 10” (zegarek właściciela watchOS 10.6.2); iOS zostaje 18. Diff `761b9551..b7fc49de`.
4. Zadania:
   1. Kompletność: każde miejsce z minimalną wersją zegarka w repo (grep 11.0/watchOS 11/MIN_WATCH, config prebuild, kontrola-ipa, workflow, testy, dokumenty) — zmienione albo celowo zostawione z powodem; nic nie zmienia minimum iOS. `plik:linia`.
   2. Test spójności i skaner API (`tests/wydanie/zegarek-minimum-watchos.test.ts`, `watchos-dostepnosc.ts`): czy naprawdę wykryłby API z watchOS 11 (sonda: tymczasowo dodaj znane API watchOS 11 do kopii pliku w /tmp i uruchom skaner; nie commituj), czy nie jest pusty/tautologiczny.
   3. Dokumenty: ADR-0006 sekcja „Zmiana 2026-11-15”, ER-72, P-819…P-822, T-04 — spójne z KO-061, bez edycji starych decyzji.
   4. Werdykt GOTOWY / Z UWAGAMI / NIEGOTOWY, znaleziska P1/P2/P3 z `plik:linia`. Plik `docs/jakosc/bt-recenzja-watchos10.md`, commit, push.
5. Zakazy: nie zmieniasz kodu BS, nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, bez AskUserQuestion.
6. Decyzje: pula P-825…P-826, analogia lkarwowski494/trening, do weta.
7. Kontekst i koszt: od 30% PRZEKAZANIE. Pułap 5 USD, STOP 6,5 USD.
8. Raport (≤ 8 linii, send_message): werdykt, P1/P2, SHA, koszt.
