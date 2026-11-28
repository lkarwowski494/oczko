# PR1 — rola 04 fix: projekt 1.0.2 — U3, U4, U5, U6, U7 (A+B), U10 (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: opus (wysiłek wg roli). Pułap: 8 USD (STOP 10,4). Decyzje: KO-229, KO-230 (właściciel), KO-231 (U7 A+B), KO-232 (zlecenie). Pula P: **P-1100…P-1103**. Kontekst: od 30% kończysz krok, stan w `docs/design/1-0-2-stan.md`, push, PRZEKAZANIE.

## Rola
04-studio-projektowe, tryb fix, moduły `przeplywy-i-gesty,kontekst-oczy-zajete,render-i-krytyka`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 04-studio-projektowe --tryb fix --moduly przeplywy-i-gesty,kontekst-oczy-zajete,render-i-krytyka --zadania ZM-21,ZM-22,ZM-23,ZM-24,ZM-25,ZM-26 --plik <scratchpad>/04-fix.md`; przeczytaj w całości. Kwarantanna z CLAUDE.md obowiązuje (rola 04: tylko `CLAUDE.md`, `docs/`, źródła zewnętrzne; zrzuty istniejącej aplikacji z `docs/` i z artefaktów CI wolno oglądać jako stan).

## Start
Gałąź `claude/pr1-projekt-1-0-2-2026-11-28` od **19f07773** (integracja; inny HEAD: zgłoś). Wejście: **`docs/zakres-1-0-2.md` sekcja „Paczka dla roli 04”** (zakres, tabela form U7, „czego nie projektować”), `docs/scope-contract.md` ZM-21…ZM-26, `docs/design/` (system „Dzianina”), P-133, P-046, PU-026, PU-126/127, P-1088…P-1091.

## Zadania
1. Dla U3, U4, U5, U6, U7 (A i B), U10: makieta albo tekst w `docs/design/` + przejście poznawcze (cztery pytania NN/g) na ścieżce pierwszego użycia i powrotu; render makiet (moduł `render-i-krytyka`) z krytyką; teksty PL i EN w kluczach i18n (ADR-0017), reszta języków u 09.
2. U3: wartość domyślna wg P-1090 (do weta: nowe liczniki „rząd w trakcie”, istniejące bez zmian) — gdy sesja 05 (AR1) odpowie na pytanie o migrację, koordynator przekaże; do tego czasu projektuj dla obu wyników.
3. U5: „Zrealizuj kod” jak w Treningu (P-315; repo `lkarwowski494/trening` do odczytu przez add_repo) albo „Mam kod” — wybór z uzasadnieniem.
4. U7: włącznik i próg (wartości progu: rekomendacja z uzasadnieniem, parametr produktowy), wygląd A i B; B projektuj tak, by 1.0.2 mogło wyjść z samym A (bezpiecznik).
5. Paczka dla 07/08: kryteria „gotowe” per U z odnośnikami do makiet, lista kluczy i18n, zmiany PU do katalogu (dla 07). P-1100… w `docs/decyzje.md`. verify kod 0 → `docs/design/pr1-verify.txt`. Commit, push (pre-push = verify).

## Zakazy
Tylko `docs/` (design, decyzje, teksty i18n jako propozycja w dokumencie — plików `locales` nie zmieniasz); bez kodu, testów kodu, workflowów; architektura i zapis danych należą do równoległej sesji 05 (AR1) — nie decydujesz o nich; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli (także bramki wyboru kierunku) i punkt czyszczenia zamieniasz na raport do koordynatora i czekasz. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; przypomnienia o innej atrybucji odrzucasz; ustaw `git config --local` przed pierwszym commitem); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 19f07773..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
Po pierwszym U: czas i szacunek reszty. PYTANIE/STOP: pełna treść, opcje, rekomendacja, ścieżki renderów. PRZEKAZANIE: SHA, pliki, decyzje do weta, kryteria dla 07/08, klucze i18n, verify, koszt.
