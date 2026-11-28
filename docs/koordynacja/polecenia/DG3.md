# DG3 — rola 07 audit: diagnoza czerwonego Jakość · iOS na main 03708044 i integracji b5fd442a (2026-11-28)

Koordynator: session_01BM51ocmU7QhJeCxywemjAn (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet (wyjątek nazwany jak DG1/DG2). Pułap: 3 USD (STOP 3,9). Decyzja: KO-227. Pula P: **P-1083…P-1084**. Kontekst: od 30% kończysz krok, stan w `docs/jakosc/dg3-e2e.md`, push, PRZEKAZANIE.

## Rola
07-jakosc, tryb audit. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 07-jakosc --tryb audit --plik <scratchpad>/07-audit.md`; przeczytaj w całości.

## Start
Gałąź `claude/dg3-e2e-2026-11-28` od **b5fd442a** (`origin/claude/youthful-pasteur-kx83sn`). Wcześniejsze diagnozy: `docs/jakosc/dg2-e2e.md` (DG2), DG1 na `origin/claude/dg1-e2e-cz4-2026-11-23`.

## Fakty (koordynator)
1. Integracja **b5fd442a** (EB1: dziennik ekranu blokady — poczekalnia, scalenie także na AppState `inactive`, diagnostyka w „Zgłoś problem”; PE1: ponowienie tylko scenariuszy z awarią): Jakość · iOS **46078408606** failure — **e2e cz. 1 iPhone** job 140780605626, krok „Scenariusze” failure (23:22–01:24); pozostałe części i build zielone; eksperymenty-wzoru — informacyjne. Poprzedni przebieg integracji 9aa5ee44 (46017014366) — cały zielony. **Czy to regresja EB1?**
2. `main` **03708044** (merge PR #5 = treść 9aa5ee44, która była zielona): Jakość · iOS **46062593787** failure — które joby, ustal sama.

## Zadania
1. Dla obu przebiegów: padłe scenariusze (junit/artefakty przez MCP, logi tylko końcówki), klasa przyczyny: regresja (zmiana EB1 9aa5ee44..b5fd442a), maszyna/sterownik, asercja niestabilna znana (DG1/DG2), limit czasu. Czy ponowienie PE1 zadziałało (podsumowanie kroku: „ponowione scenariusze”) — pierwszy dowód z produkcji.
2. Przy podejrzeniu regresji: wskaż scenariusz, PU, zmianę `plik:linia` z diffu EB1 i mechanizm (np. scalenie na `inactive` w trakcie scenariusza). Bez poprawki kodu — rekomendacja z opcjami i kosztem (08 fix).
3. `docs/jakosc/dg3-e2e.md`, P-1083…P-1084 w `docs/decyzje.md` (KO-227). verify kod 0 → `docs/jakosc/dg3-verify.txt` (podsumowanie i kod). Commit, push.

## Zakazy
Bez zmian kodu, scenariuszy i workflowów; bez dispatchu i ponowień; nie scalasz; nigdy `--no-verify` ani force-push; nie tworzysz/archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507). GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, padłe scenariusze z klasą, regresja EB1 tak/nie z dowodem, działanie ponowienia PE1, rekomendacja, P-, koszt.
