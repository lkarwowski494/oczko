# Sesja AY: recenzja niezależna AU (3d9ca08..19cba67) — Oczko
Koordynator: ID z `stan.md` („Koordynator aktywny”, teraz session_01T66VBvgNAeAg31Spiw5V67) — raport, pytania i PRZEKAZANIE tylko przez send_message do niego. Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 10-wydanie w trybie audit (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w raporcie potwierdź linię KONIEC i ostatni nagłówek `##` promptu). Biblioteki prompts nie dołączasz. Recenzja niezależna: raport i decyzje autora (sesja AU) to deklaracje, nie dowód.
2. Start: gałąź `claude/ay-recenzja-au-2026-11-12` @ 19cba67 (= `claude/au-zrzuty-2026-11-12`; inny HEAD: zgłoś). `npm ci`. Kodu nie zmieniasz; raport w `docs/wydanie/ay-2026-11-12/` na swojej gałęzi (tożsamość według CLAUDE.md, bez Co-Authored-By).
3. Zadania (znaleziska źródłowe: `docs/wydanie/as-2026-11-12/10-wydanie-2026-11-12.md`, 10-wydanie-022…026; decyzje AU P-763…P-765 w `docs/decyzje.md`):
   1. Diff `git diff 3d9ca08 19cba67`: `.github/workflows/zrzuty-sklepu.yml`, `scripts/ci/zrzuty-*`, `e2e/zrzuty-sklepu/00-przygotuj.yaml`, `07-kalendarz.yaml` (fikstura daty względna — czy pasek iPada i treść pokazują ten sam dzień; czy nic nie miesza dat), scen. 47 (tylko komentarz?). Czy każda poprawka zamyka znalezisko według testu akceptacyjnego z raportu AS.
   2. Testy `tests/wydanie/zrzuty-*.test.ts`: uruchom nowe/zmienione na 3d9ca08 i na 19cba67 (kody wyjścia) — czerwone przed poprawką z właściwego powodu, zielone po.
   3. P-763: odrzucanie przez plan poniedziałku i dni 1–7 miesiąca UTC — czy to konieczne (alternatywy), jakie koszty dla przebiegu zrzutów kandydata 13–14.11 i dla przyszłych wydań; rekomendacja.
   4. Werdykt TAK/NIE dla scalenia AU do integracji `claude/youthful-pasteur-kx83sn` (scalenie razem z AT: sprawdź `git merge-tree` z `origin/claude/at-jakosc-2026-11-12` — konflikty tylko w `docs/decyzje.md`?), z listą P0–P2 (`plik:linia`). Wszystko poza testami Node zaznacz jako „niesprawdzone na runnerze”.
4. Zakazy: nie zmieniasz kodu, nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, bez AskUserQuestion, nigdy --no-verify ani force-push. Push raportu: hak `pre-push` uruchamia `npm run verify` (~10 min) — w tle z dużym limitem czasu.
5. Decyzje: brak własnych (recenzja).
6. Od 30% okna PRZEKAZANIE. Pułap 6 USD, STOP 7,8 USD.
7. Raport ≤ 12 linii przez send_message: KONIEC potwierdzony, werdykt, znaleziska P0–P2, wyniki testów na obu SHA, rekomendacja P-763, wynik merge-tree, SHA raportu, koszt.
