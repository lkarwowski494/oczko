# ZA1 — rola 08 fix: PU-008 — po cofnięciu i nowym pasie etykieta „3 highlights” przy 2 widocznych zakreśleniach (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 4 USD (STOP 5,2). Decyzja: KO-243. Pula P: **P-1138…P-1139**. Kontekst: od 30% kończysz krok.

## Rola
08-programista, tryb fix. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb fix --zadania PU-008 --plik <scratchpad>/08-fix.md`; przeczytaj w całości.

## Start
Gałąź `claude/za1-zakreslenia-2026-11-28` od **c2252515** (integracja). `npm ci`. Wejście: `docs/jakosc/dg4-e2e.md` (DG4: stały defekt 6/6 podejść — cofnięcie ostatniej kreski, potem nowy pas → etykieta liczby zakreśleń o 1 za duża; kod wzoru bez zmian od 9aa5ee44), scenariusz e2e PU-008, artefakt `e2e-czesc-4-iphone` run 46132804091 (zrzuty).

## Zadania
1. Odtwórz w teście (Jest/komponent albo domena wzoru) sekwencję: dwa zakreślenia → cofnij → nowy pas → oczekiwane „2 highlights” i 2 rekordy w bazie; test czerwony na c2252515 z właściwego powodu. Gdy błąd okaże się w scenariuszu, a nie w aplikacji — PYTANIE z dowodem, zanim cokolwiek zmienisz.
2. Poprawka w kodzie aplikacji (zero utraty danych: cofnięcie i zapis zakreśleń w transakcji), test zielony; licznik etykiety zgodny ze stanem bazy także po restarcie.
3. P-1138 w `docs/decyzje.md`; verify kod 0 → `docs/programista/za1-verify.txt`. Commit, push.

## Zakazy
Tylko kod i testy wzoru (`src/`/`app/` w obszarze wzoru/zakreśleń); bez zmian scenariuszy e2e bez PYTANIA; bez workflowów; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; `git config --local` przed pierwszym commitem; haki o innej atrybucji odrzucasz). GitHub tylko przez MCP. Przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' c2252515..HEAD`.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, przyczyna (plik:linia), test czerwony→zielony, verify, koszt.
