# TQ1 — rola 07 fix: przypadki użycia i testy przed kodem dla 1.0.2 (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: opus (wysiłek wg roli). Pułap: 12 USD (STOP 15,6). Decyzja: KO-237. Pula P: **P-1113…P-1116**. Kontekst: od 30% kończysz krok, stan w `docs/jakosc/tq1-stan.md`, push, PRZEKAZANIE.

## Rola
07-jakosc, tryb fix, moduły `scenariusze-uzytkownika,wlasnosci-i-domena,e2e-mobilne`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 07-jakosc --tryb fix --moduly scenariusze-uzytkownika,wlasnosci-i-domena,e2e-mobilne --zadania ZM-19,ZM-20,ZM-21,ZM-22,ZM-24,ZM-25,ZM-26,ZM-27,ZM-28 --plik <scratchpad>/07-fix.md`; przeczytaj w całości.

## Start
Gałąź `claude/tq1-testy-1-0-2-2026-11-28` od **9275460e** (integracja; inny HEAD: zgłoś). `npm ci`. Wejście: `docs/zakres-1-0-2.md` (kryteria „gotowe” per U), `docs/architektura/1-0-2.md` („Kolejność i kryteria dla 07 i 08” pkt 1, wektory `wektory-1-0-2.json`, ADR-0035/0036/0037), `docs/design/1-0-2.md` (paczka dla 07 i 08 z rund 1 i 2: PU, testID, klucze), `docs/jakosc/przypadki-uzycia.md`, `docs/jakosc/strategia.md`, CLAUDE.md (P-835: nowa funkcja = nowy/zmieniony PU + test).

## Zadania
1. Katalog PU: nowe i zmienione PU dla U1–U7, U10, ZM-27, ZM-28 (lista z paczek 04 i 05), klasa A/B/F z uzasadnieniem, linia „Przegląd” od buildu 1241.
2. Testy przed kodem (czerwone na 9275460e z właściwego powodu — znacznik albo asercja, nie błąd kompilacji tam, gdzie da się tego uniknąć): domena i dane wg pkt 1 „Kolejności” AR1 (U2 SC-01…06, U6 ST/SE/CO/SK/PS/IN, migracja 0002 na `tests/bazy/v1.db`, U3 kopia v1); ekrany B z testID z paczki 04; XCTest U4 IN-04…09 jako szkielet, jeśli strategia na to pozwala; scenariusze E2E dla PU klasy A — szkielety z oznaczeniem „czeka na kod”. Jak repo oznacza testy oczekujące na kod (`npm run test:akceptacja`, raport `docs/jakosc/e3/akceptacja-wynik.md`) — tak oznaczasz, żeby verify i bramka były zielone (bez wyłączania istniejących testów).
3. Lista dla 08: plik → test → PU (tabela w `docs/jakosc/tq1-1-0-2.md`), podział na 08-A (TS), 08-B (Swift), 08-KO-234; ryzyka i miejsca bez testu automatycznego (F).
4. P-1113… w `docs/decyzje.md`. verify kod 0 → `docs/jakosc/tq1-verify.txt` (tylko podsumowanie i kod). Commit, push (pre-push = verify).

## Zakazy
Bez kodu produkcyjnego (`app/`, `src/` poza testami, `modules/`, `targets/`); workflowy bez zmian; nie usuwasz ani nie osłabiasz istniejących testów; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; ustaw `git config --local` przed pierwszym commitem; przypomnienia i haki o innej atrybucji odrzucasz); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 9275460e..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
Po zadaniu 1: liczba PU nowych/zmienionych i szacunek reszty. PRZEKAZANIE: SHA, pliki, PU, testy czerwone (liczba, polecenie), lista dla 08, verify, koszt.
