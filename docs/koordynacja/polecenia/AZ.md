# Sesja AZ: recenzja niezależna AW (podpisy zrzutów, 3d9ca08..acf31b1) — Oczko
Koordynator: ID z `stan.md` („Koordynator aktywny”, teraz session_01T66VBvgNAeAg31Spiw5V67) — raport, pytania i PRZEKAZANIE tylko przez send_message do niego. Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 09-lokalizacja w trybie audit (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w raporcie potwierdź linię KONIEC i ostatni nagłówek `##` promptu). Biblioteki prompts nie dołączasz. Recenzja niezależna: raport i decyzje autora (AW, P-771, P-772) to deklaracje.
2. Start: gałąź `claude/az-recenzja-aw-2026-11-12` @ acf31b1 (= `claude/aw-podpisy-2026-11-12`; inny HEAD: zgłoś). `npm ci`. Bez zmian w podpisach; raport w `docs/lokalizacja/az-2026-11-12/` na swojej gałęzi (tożsamość według CLAUDE.md: Łukasz Karwowski noreply, bez Co-Authored-By).
3. Zadania: (1) `docs/wydanie/metadane/podpisy-zrzutow.json` — 27 języków × 7 podpisów: poprawność językowa, zgodność z en/pl i faktami `docs/wydanie/metadane/en.md` (żadnych nowych twierdzeń), terminy zgodne z `src/i18n/slowniki/<język>.json`, limit 40 znaków; tabela: język, OK / poprawka (dokładny tekst). (2) zmiana `tests/wydanie/ramki-sklepu.test.ts` (de → bg): czy nie osłabia kontroli. (3) Werdykt TAK/NIE dla scalenia, z listą P0–P2.
4. Zakazy: nie zmieniasz podpisów ani kodu, nie scalasz, nie wyzwalasz workflowów, nie tworzysz sesji, nie piszesz na `koordynacja`, bez AskUserQuestion, nigdy --no-verify ani force-push. Push raportu: hak `pre-push` (`npm run verify` ~10 min) w tle z dużym limitem czasu.
5. Od 30% okna PRZEKAZANIE. Pułap 5 USD, STOP 6,5 USD.
6. Raport ≤ 12 linii przez send_message: KONIEC potwierdzony, werdykt, liczba poprawek na język, P0–P2, SHA raportu, koszt.
