# PR2 — rola 04 fix: scalenie projektu 1.0.2 z integracją + sygnał 19 (koniec Live Activity, ZM-27) (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: opus (wysiłek wg roli). Pułap: 6 USD (STOP 7,8). Decyzja: KO-234 (właściciel 28.11 ok. 11:15, dosłownie „U8 A, U9 A, 19A, 18A”), KO-235 (zlecenie). Pula P: **P-1107…P-1109**. Kontekst: od 30% kończysz krok, stan w `docs/design/1-0-2-stan.md`, push, PRZEKAZANIE.

## Rola
04-studio-projektowe, tryb fix, moduły `przeplywy-i-gesty,render-i-krytyka`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 04-studio-projektowe --tryb fix --moduly przeplywy-i-gesty,render-i-krytyka --zadania ZM-27 --plik <scratchpad>/04-fix.md`; przeczytaj w całości. Kwarantanna z CLAUDE.md obowiązuje.

## Start
Gałąź `claude/pr2-projekt-1-0-2-2026-11-28` od **38bf0d4b** (wynik PR1: `docs/design/1-0-2.md`, makiety `docs/design/1-0-2/`, P-1100…P-1103; inny HEAD: zgłoś). Wejście: `docs/design/1-0-2.md`, `docs/design/1-0-2-stan.md`, `docs/zakres-1-0-2.md`, `docs/scope-contract.md`.

## Zadania
1. **Scal** `origin/claude/youthful-pasteur-kx83sn` (integracja, 0c3f9214 albo nowsza: RS1 docs/brd, P-1092…1095) do swojej gałęzi: `git merge` bez rebase i force-push; konflikt w `docs/decyzje.md` — P rosnąco (…P-1095, P-1100…P-1103; P-1096…1099 należą do równoległej sesji 05 AR1 — jeśli już są na integracji, zostaw je). verify kod 0.
2. **Sygnał 19 (ZM-27, do 1.0.2 decyzją właściciela):** użytkownik: „widget z notcha powinien znikać po zamknięciu apki, teraz żeby go zamknąć to trzeba specjalnie zablokować”. Decyzja: Live Activity kończy się (a) sama po czasie bez liczenia — mechanizm i czas ustala sesja 05 (AR1), (b) z menu licznika ••• pozycją do natychmiastowego zakończenia (nazwa Twoja, np. „Zakończ na ekranie blokady”); NIE przy każdym zamknięciu aplikacji (liczenie z ekranu blokady zostaje). Zaprojektuj (b): miejsce w menu względem „Ustawienia licznika” (P-1102), stan menu gdy aktywności nie ma (ukryte vs wyszarzone), potwierdzenie albo jego brak, teksty PL/EN w kluczach i18n; dla (a): czy użytkownik widzi cokolwiek (np. wygaszony wygląd przed końcem) — zgodnie z U7-B2 (P-1103), bez drugiego zegara. Render (390 jasny/ciemny/AX5) i przejście poznawcze NN/g.
3. Wiersz **ZM-27** w `docs/scope-contract.md` z cytatem właściciela i odnośnikiem KO-234 (wyjątek nazwany: zapis zakresu przez 04, decyzja już zapadła; bramka skrócona do skutków dla 04/05/07/08/09); uzupełnij „Paczkę dla 07 i 08” w `docs/design/1-0-2.md` (kryteria, PU, testID). P-1107… w `docs/decyzje.md`. verify kod 0 → `docs/design/pr2-verify.txt` (tylko podsumowanie i kod). Commit, push (pre-push = verify).

## Zakazy
Tylko `docs/`; bez kodu, testów kodu, workflowów; mechanizm wygaszania należy do 05 (AR1); bez scalania do integracji, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora (decyzje wyglądu podejmujesz według rekomendacji, opcje odrzucone renderujesz do weta). Bez nazwisk w repo. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; ustaw `git config --local` przed pierwszym commitem; haki o innej atrybucji odrzucasz); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 38bf0d4b..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, pliki, decyzje do weta, kryteria dla 07/08, verify, koszt.
