# Sesja AX: recenzja niezależna AT (3d9ca08..2f224a8) — Oczko
Koordynator: ID z `stan.md` („Koordynator aktywny”, teraz session_01T66VBvgNAeAg31Spiw5V67) — raport, pytania i PRZEKAZANIE tylko przez send_message do niego. Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 08-programista w trybie audit (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w raporcie potwierdź linię KONIEC i ostatni nagłówek `##` promptu). Biblioteki prompts nie dołączasz. Recenzja niezależna: raport i decyzje autora (sesja AT) to deklaracje, nie dowód.
2. Start: gałąź `claude/ax-recenzja-at-2026-11-12` @ 2f224a8 (= `claude/at-jakosc-2026-11-12`; inny HEAD: zgłoś). `npm ci`. Kodu nie zmieniasz; raport zapisujesz w `docs/jakosc/ax-2026-11-12/` na swojej gałęzi (tożsamość według CLAUDE.md, bez Co-Authored-By).
3. Zadania (znaleziska źródłowe: `docs/jakosc/ar-2026-11-12/07-jakosc-2026-11-12.md`):
   1. Diff `git diff 3d9ca08 2f224a8`: `app/(zakladki)/index.tsx` (obsługa odrzucenia `licznik.miejsce()` w `naKontynuuj` i `naDodajWzor` — poprawność, brak połkniętych błędów, brak zmiany wyglądu poza `docs/design/`), test `tests/ekrany/dzis-kontynuuj-blad-miejsca.test.tsx` (czy czerwony na 3d9ca08 z właściwego powodu — uruchom go na 3d9ca08 i na 2f224a8, podaj kody wyjścia), scen. 70 (`scrollUntilVisible nav-wstecz`), `docs/jakosc/e4/tabela-08.md` (czy to tylko regeneracja generatorem — uruchom generator i porównaj).
   2. Diagnoza 07-jakosc-003 (`docs/jakosc/at-2026-11-12/diagnoza-003.md`) i decyzje P-759…P-761 w `docs/decyzje.md`: czy wnioski wynikają z dowodów; zaznacz tezy niesprawdzone.
   3. Werdykt TAK/NIE dla scalenia AT do integracji `claude/youthful-pasteur-kx83sn`, z listą P0–P2 (`plik:linia`).
4. Zakazy: nie zmieniasz kodu, nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, bez AskUserQuestion, nigdy --no-verify ani force-push. Push raportu: hak `pre-push` uruchamia `npm run verify` (~10 min) — w tle z dużym limitem czasu.
5. Decyzje: brak własnych (recenzja). Pula: brak.
6. Od 30% okna PRZEKAZANIE. Pułap 6 USD, STOP 7,8 USD.
7. Raport ≤ 12 linii przez send_message: KONIEC potwierdzony, werdykt, znaleziska P0–P2, wyniki testu na obu SHA, SHA raportu, koszt.
