# Sesja AW: przekład podpisów zrzutów sklepu na 27 języków (C6) — Oczko
Koordynator: ID z `stan.md` („Koordynator aktywny”, teraz session_01T66VBvgNAeAg31Spiw5V67) — raport, pytania i PRZEKAZANIE tylko przez send_message do niego; po wiadomości o zmianie koordynatora piszesz do nowego. Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 09-lokalizacja w trybie build (prompt po `=== PROMPT ROLI ===`, kończy się linią `=== KONIEC PROMPTU ROLI ===`; w pierwszym raporcie potwierdź linię KONIEC i ostatni nagłówek `##` promptu). Biblioteki prompts nie dołączasz.
2. Start: gałąź `claude/aw-podpisy-2026-11-12` @ 3d9ca08 (inny HEAD: zgłoś). `npm ci`. Tożsamość commitów według CLAUDE.md, bez Co-Authored-By.
3. Zadania (lista `docs/wydanie/lista-1-0.md` C5–C6; plik `docs/wydanie/metadane/podpisy-zrzutow.json`, fakty z `docs/wydanie/metadane/en.md`):
   1. **C5 (akceptacja en i pl):** decyzja koordynatora KO-051 (P-087, do weta właściciela) — podpisy en i pl zostają jak na 3d9ca08; jeśli widzisz błąd językowy albo twierdzenie bez pokrycia w `en.md`, zgłoś PYTANIE zamiast zmieniać.
   2. **C6:** 7 podpisów (≤ 40 znaków, jak test `uklad-podpisow.test.ts`) dla każdego z 27 języków ze sklepową lokalizacją (lista w pliku/`sklep.md`), przekład wykonujesz sam w sesji (bez workflowu `przeklad-tlumaczen.yml` i bez API — koszt 0). Terminologia zgodna z katalogami i18n aplikacji (`src/i18n` lub miejsce wskazane w CLAUDE.md) — nazwy ekranów i funkcji takie jak w aplikacji danego języka. Język ma komplet 7 albo żaden.
   Gotowe: testy podpisów zielone, `npm run verify` kod 0 przez hak; tabela w raporcie: język, liczba podpisów, najdłuższy (znaki).
4. Zakazy: nie scalasz do integracji ani `main`, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nie wyzwalasz workflowów, nigdy --no-verify ani force-push, bez AskUserQuestion. STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Pliki tylko: `docs/wydanie/metadane/podpisy-zrzutow.json`, `docs/lokalizacja/` (notatki), `docs/decyzje.md`.
5. Decyzje: tryb analogia (najpierw `lkarwowski494/trening` — przekład tekstów sklepu tam), wpis do weta. Pula: P-771…P-772.
6. Kontekst: od 30% okna PRZEKAZANIE (stan w `docs/lokalizacja/aw-stan.md`). Pułap 5 USD, STOP 6,5 USD.
7. Push: hak `pre-push` uruchamia pełne `npm run verify` (~10 min) — push w tle z dużym limitem czasu, nie przerywaj go. Push zbiorczo. Przed PRZEKAZANIEM: `git fetch origin claude/youthful-pasteur-kx83sn`; jeśli integracja poszła naprzód od 3d9ca08, scal ją do swojej gałęzi (`git merge`, bez rebase), konflikty rozwiąż sam (typowo `docs/decyzje.md` — oba wpisy zostają), verify, push.
8. Raporty (≤ 10 linii, send_message): po pierwszych 5 językach — czas i szacunek reszty; PRZEKAZANIE: SHA, verify, decyzje do weta, koszt.
