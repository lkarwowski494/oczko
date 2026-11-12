# Sesja BC: lista testu właściciela dla buildu 5 (1151) — Oczko
Koordynator: session_01T66VBvz4Y1nNUQf6tdtfdo (raport, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 07-jakosc w trybie build (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w raporcie potwierdź linię KONIEC). Biblioteki prompts nie dołączasz.
2. Start: gałąź `claude/bc-test-build5-2026-11-12` @ 562dfc4 (= integracja; inny HEAD: zgłoś). `npm ci`. Tylko dokumenty; tożsamość commitów według CLAUDE.md (sprawdź przed pierwszym commitem), bez Co-Authored-By.
3. Zadania:
   1. `docs/wydanie/test-urzadzenia-build5.md` dla buildu **1151** (TestFlight, tag v1.0.0-b1151, SHA 562dfc4): pełny test właściciela na telefonie i zegarku na wzór `docs/wydanie/test-urzadzenia-build4.md` (ta sama struktura i wszystkie punkty, które nadal obowiązują), plus sekcja „Zmiany od buildu 4 (1141)” z punktami do sprawdzenia dla każdej zmiany w `e270a07..562dfc4` wpływającej na aplikację (m.in. defekt 019 — nowe zakreślenie widoczne od razu przy istniejących zakreśleniach; 04-001 kontrast tekstu pod zakreślaczem, P-773/P-774; 07-jakosc-001 obsługa błędu „Kontynuuj”/„Dodaj wzór”; krok **U2** z 04-002: czy oba pasy zakreślenia są równe). Każdy punkt: co zrobić, czego oczekiwać, miejsce na wynik. Gotowe: plik z odnośnikami `plik:linia`/decyzja do każdej zmiany; język prosty, dla właściciela bez narzędzi.
   2. Odhacz w `docs/wydanie/lista-1-0.md` pozycję buildu 5 (numer 1151, run 43217124167, Approve 12:24 UTC) — jeśli taka pozycja istnieje; inaczej dopisz jedną linię.
   3. `npm run check:i18n` i testy dokumentów wydania, jeśli istnieją (`tests/wydanie/`), kod 0 — wynik w raporcie.
4. Zakazy: nie zmieniasz kodu aplikacji, testów ani workflowów, nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, bez AskUserQuestion, nigdy --no-verify ani force-push. Push: hak `pre-push` uruchamia `npm run verify` (~10 min) — w tle z dużym limitem czasu.
5. Decyzje: tryb „analogia” (najpierw lkarwowski494/trening do odczytu, `repo:plik:linia`, wpis do weta). Pula: P-779…P-780.
6. Od 30% okna PRZEKAZANIE. Pułap 3 USD, STOP 3,9 USD.
7. Raport końcowy ≤ 10 linii przez send_message: KONIEC potwierdzony, SHA, liczba punktów testu (w tym nowych), wyniki komend z kodami wyjścia, koszt.
