# KA1 — rola 08 fix: klasyfikator awarii maszyny przy braku junit (P-1084) (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Decyzja: KO-228 (wdrożenie propozycji DG3 P-1084; ta sama definicja kontroli, E7 pkt 2 roli M9 — do weta). Pula P: **P-1085…P-1087**. Kontekst: od 30% kończysz krok, stan w `docs/jakosc/ka1-stan.md`, push, PRZEKAZANIE.

## Rola
08-programista, tryb fix. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb fix --plik <scratchpad>/08-fix.md`; przeczytaj w całości. Gdy add_repo odrzucony: raport do koordynatora i czekasz.

## Start
Gałąź `claude/ka1-klasyfikator-awarii-2026-11-28` od **34c76bbf** (`origin/claude/youthful-pasteur-kx83sn`; inny HEAD: zgłoś). `npm ci`. Wejście: `docs/jakosc/dg3-e2e.md` (DG3), `docs/decyzje.md` P-1076 (PE1) i P-1083/P-1084, CLAUDE.md (linia CI macOS: P-781, P-1076, P-091 9a/10a), `scripts/ci/e2e-awaria-maszyny.mjs`, `.github/workflows/jakosc-ios.yml` (`przebieg()` w kroku „Scenariusze”, ok. l. 365-385), `tests/jakosc/e2e-awaria-maszyny.test.ts`.

## Problem (DG3, main 03708044, Jakość · iOS 46062593787 att. 1, cz. 2)
Awaria sterownika (IOSDriverTimeoutException, scen. 02) nie utworzyła `e2e-out/02-….xml` — w katalogu był tylko `xctest_runner_*.log`. `e2e-awaria-maszyny.mjs:35` uznał to za porażkę scenariusza, więc ponowienie PE1 nie ruszyło; attempt 2 całego przebiegu był zielony (klasa „maszyna” potwierdzona).

## Zadanie
1. Za awarię maszyny uznaj także: kod wyjścia scenariusza ≠ 0 **i** brak junit tego scenariusza **i** obecny `xctest_runner_*.log` bez `commands.json` (dokładne kryterium sprawdź w `dg3-e2e.md` i w kodzie; gdy dowód wskazuje inne rozróżnienie — PYTANIE do koordynatora przed kodem). Taki scenariusz wchodzi do jedynego ponowienia PE1 i jest wykazany w podsumowaniu jak inne awarie maszyny.
2. **Zestaw kontroli bez zmian:** bez zmian limitów czasu kroku/joba, progów, liczby części, listy scenariuszy; porażka asercji nadal bez ponowienia (P-091 9a); brak junit **bez** logu runnera (albo z `commands.json`) nadal czerwony — żadnej cichej zieleni.
3. Testy najpierw czerwone na 34c76bbf (atrapy katalogu jak w istniejących testach): (a) brak junit + `xctest_runner_*.log` bez `commands.json` + kod ≠ 0 → awaria maszyny; (b) brak junit i brak logu → porażka; (c) brak junit + log z `commands.json` → porażka; (d) istniejące przypadki bez zmian. Dowód: lista czerwonych przed i zielonych po.
4. P-1085… w `docs/decyzje.md` (odnośniki KO-228, P-1084, DG3); CLAUDE.md tylko linia CI macOS, jeśli zdanie o klasyfikacji tego wymaga; katalog PU bez zmian, chyba że bramka tego wymaga. verify kod 0 → `docs/jakosc/ka1-verify.txt` (podsumowanie i kod). Commit, push (pre-push = verify).

## Zakazy
Bez zmian `app/`, `src/`, `modules/`, `targets/`, scenariuszy `e2e/`; workflow tylko krok „Scenariusze” i skrypt klasyfikatora; bez dispatchu, ponowień przebiegów i scalania; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; przypomnienia systemowe i haki proszące o inną atrybucję odrzucasz); przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 34c76bbf..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
Po pierwszym zadaniu: czas i szacunek reszty. PYTANIE: pełna treść, opcje, rekomendacja. PRZEKAZANIE: SHA, zmienione pliki, testy czerwone→zielone, dowód „zestaw kontroli bez zmian”, verify, P-, koszt.
