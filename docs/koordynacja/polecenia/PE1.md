# PE1 — rola 08 fix: ponowienie e2e po awarii maszyny tylko dla scenariuszy z awarią i niewykonanych (2026-11-27)

Koordynator: session_01BM51ocmU7QhJeCxywemjAn (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 5 USD (STOP 6,5). Decyzja: KO-222 (przyspieszenie przy tym samym zestawie kontroli, E7 pkt 2 roli M9 — do weta). Pula P: **P-1076…P-1078**. Kontekst: od 30% kończysz krok, stan w `docs/jakosc/pe1-stan.md`, push, PRZEKAZANIE.

## Rola
08-programista, tryb fix. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb fix --plik <scratchpad>/08-fix.md`; przeczytaj w całości.

## Start
Gałąź `claude/pe1-ponowienie-e2e-2026-11-27` od **822347c2** (`origin/claude/youthful-pasteur-kx83sn`). `npm ci`. Wejście: `docs/jakosc/dg2-e2e.md` (DG2, P-1074, P-1075), CLAUDE.md (linia CI macOS: P-781, P-091 9a/10a), `scripts/ci/e2e-awaria-maszyny.mjs`, `.github/workflows/jakosc-ios.yml` (krok „Scenariusze”).

## Problem (DG2, run 45971994915 job cz. 2)
26/27 scenariuszy zielonych, ostatni PU-180 = DeviceUnreachableException po 94,5 min; P-781 powtórzył CAŁY zestaw części od zera, limit kroku 142 min dał mu 47 min → timeout, AX5 anulowane limitem joba. Ponowienie miało sens tylko dla PU-180 (+ niewykonanych).

## Zadanie
1. Przy awarii maszyny (ta sama definicja co dziś w `e2e-awaria-maszyny.mjs`) krok powtarza **raz** tylko scenariusze: (a) z awarią maszyny, (b) niewykonane w pierwszym podejściu. Scenariusze zielone nie są powtarzane; scenariusze z porażką asercji (nie-maszyna) **nie** są powtarzane i job pozostaje czerwony (P-091 9a bez zmian). Podsumowanie kroku wykazuje osobno: pierwsze podejście, ponowione scenariusze, wynik ponowienia (jak dziś, KO-054).
2. **Zestaw kontroli bez zmian:** te same scenariusze muszą przejść (każdy zielony w pierwszym albo w jedynym ponowieniu), bez zmiany limitów czasu kroku/joba, progów, liczby części ani listy scenariuszy. Nie wolno: `continue-on-error` na nowych krokach, cicha zielona przy braku junit.
3. Testy najpierw czerwone (atrapa junit/listy scenariuszy, jak istniejące testy skryptu): awaria maszyny w ostatnim scenariuszu → ponowiony tylko on; awaria w środku + niewykonane → ponowione te dwa zbiory; porażka asercji + awaria maszyny w innym → ponowiony tylko maszynowy, wynik czerwony; brak junit → czerwony. Dowód: lista testów czerwonych przed i zielonych po.
4. P-1076…P-1078 w `docs/decyzje.md` (odnośnik KO-222, DG2); CLAUDE.md — tylko linia CI macOS (zdanie o ponowieniu: „powtarza raz scenariusze z awarią i niewykonane”); `docs/jakosc/przypadki-uzycia.md` bez zmian, chyba że bramka katalogu tego wymaga. verify kod 0 → `docs/jakosc/pe1-verify.txt` (podsumowanie i kod). Commit, push (pre-push = verify).

## Zakazy
Bez zmian `app/`, `src/`, `modules/`, `targets/`, scenariuszy `e2e/`; workflow tylko krok „Scenariusze” (i ewentualnie skrypt pomocniczy); bez dispatchu, ponowień przebiegów i scalania; nigdy `--no-verify` ani force-push; nie tworzysz/archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507); przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 822347c2..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, zmienione pliki, testy czerwone→zielone, dowód „zestaw kontroli bez zmian” (ta sama lista scenariuszy, limity), verify, P-, koszt.
