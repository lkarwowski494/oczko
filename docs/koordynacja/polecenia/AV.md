# Sesja AV: przegląd projektowy zrzutów przed kandydatem (C2, drugi pas zakreślenia, OG-07) — Oczko
Koordynator: ID z `stan.md` („Koordynator aktywny”, teraz session_01T66VBvgNAeAg31Spiw5V67) — raport, pytania i PRZEKAZANIE tylko przez send_message do niego; po wiadomości o zmianie koordynatora piszesz do nowego. Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 04-studio-projektowe w trybie audit (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w pierwszym raporcie potwierdź linię KONIEC i ostatni nagłówek `##` promptu). Biblioteki prompts nie dołączasz.
2. Start: gałąź `claude/av-projekt-zrzuty-2026-11-12` @ 3d9ca08 (inny HEAD: zgłoś). Kodu nie zmieniasz; zapisujesz tylko raport w `docs/design/av-2026-11-12/`. Tożsamość commitów według CLAUDE.md, bez Co-Authored-By.
3. Zadania (lista `docs/wydanie/lista-1-0.md` sekcja C; zrzuty z przebiegu `zrzuty-sklepu.yml` 43139114751 na 2929462 — artefakty pobierz przez `gh api`, obrazy obejrzyj):
   1. **C2:** każda z 7 pozycji „Stan wykonania” w `docs/wydanie/metadane/zrzuty-plan.md` — zamknięta / otwarta, z dowodem (plik zrzutu, kadr). Otwarte: co zmienić i gdzie (`plik:linia`), rola wykonawcza (08 fikstura / 10 skrypt / 04 tokeny), czy wymaga nowego buildu.
   2. **Drugi pas zakreślenia (P3, KO-046):** ocena wyglądu kadru 04 (dwa pasy) względem systemu `docs/design/`; werdykt: zostaje / zmiana (dokładna specyfikacja tokenami).
   3. **C3, OG-07:** czy warunek P-218 dla zrzutów wzoru 03 i 04 jest spełniony (`[og07-ok]`); to decyzja koordynatora — daj rekomendację z dowodem (decyzje, `docs/`), a jeśli rozstrzyga fakt prawny/merytoryczny, oznacz `[DO USTALENIA]` zamiast zgadywać.
   Gotowe: raport z tabelą pozycji i listą zmian dla sesji wykonawczych; commit i push raportu.
4. Zakazy: nie scalasz do integracji `claude/youthful-pasteur-kx83sn` ani `main`, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nie wyzwalasz `testflight.yml` ani workflowów App Store Connect, nigdy --no-verify ani force-push, bez AskUserQuestion i bez pytań do właściciela. STOP-y roli i punkt czyszczenia z zasady wspólnej 19 zamieniasz na raport do koordynatora i czekasz na odpowiedź. Nie zmieniasz `app/`, `src/`, `scripts/`, `e2e/`, `tests/`, `.github/` ani `docs/wydanie/metadane/`.
5. Decyzje: rekomendacje do koordynatora (KO), nie wpisy w `docs/decyzje.md`; pula P-767…P-770 tylko dla decyzji projektowych w Twojej roli (wygląd), do weta.
6. Kontekst: od 30% okna PRZEKAZANIE. Pułap 6 USD, STOP 7,8 USD.
7. Push: hak `pre-push` uruchamia `npm run verify` (~10 min) — push w tle z dużym limitem czasu; nigdy --no-verify.
8. Raport (≤ 12 linii, send_message): KONIEC potwierdzony; C2 — ile zamkniętych/otwartych i zmiany z rolą; werdykt pasa; rekomendacja OG-07; czy cokolwiek wymaga nowego buildu przed kandydatem; SHA raportu; koszt.
