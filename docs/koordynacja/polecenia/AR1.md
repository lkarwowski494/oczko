# AR1 — rola 05 fix: architektura 1.0.2 — U2 rozwidlenie, U4 −1 z ekranu blokady, U6 zapis +2, U7 prototyp B (plan), U3 pytanie o migrację (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: opus (wysiłek wg roli). Pułap: 8 USD (STOP 10,4). Decyzje: KO-229 (właściciel), KO-232 (zlecenie). Pula P: **P-1096…P-1099**. Kontekst: od 30% kończysz krok, stan w `docs/architektura/1-0-2-stan.md`, push, PRZEKAZANIE.

## Rola
05-architekt, tryb fix, moduły `dane-lokalne-sqlite,tlo-i-sensory-ios`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 05-architekt --tryb fix --moduly dane-lokalne-sqlite,tlo-i-sensory-ios --zadania ZM-20,ZM-21,ZM-22,ZM-24,ZM-25 --plik <scratchpad>/05-fix.md`; przeczytaj w całości. Rola 05 może czytać kod jako materiał (CLAUDE.md).

## Start
Gałąź `claude/ar1-architektura-1-0-2-2026-11-28` od **19f07773** (integracja; inny HEAD: zgłoś). `npm ci`. Wejście: **`docs/zakres-1-0-2.md` sekcja „Paczka dla roli 05”** (zakres i „czego nie projektować”), `docs/scope-contract.md` ZM-19…ZM-26, `docs/jakosc/eb1-stan.md`, P-1079…P-1091, ADR-0008, ADR-0009, ADR-0017.

## Zadania
1. **U2 (ZM-20):** reguła rozwidlenia ekran blokady ↔ aplikacja: ocena opcji z paczki, wybór z uzasadnieniem, ADR (nowy albo uzupełnienie ADR-0008/0009) z wektorami domeny; zero utraty danych i brak cichego konfliktu (baner PU-127 albo równoważny).
2. **U4 (ZM-22):** potwierdzenie drogi `minus` z intencji Live Activity (jak z zegarka), reguła limitu (−1 nie zaczyna dnia), −1 przy 0, rozwidlenie dla −1.
3. **U6 (ZM-24):** zapis „+2”: (a) jedno zdarzenie z krokiem vs (b) dwa zdarzenia `plus` — zgodność wstecz z 1.0.1 przez iCloud (ADR-0008 (4)), strażnik tempa RD-17, historia; wybór i wektory. Gdy zgodnego zapisu nie ma: zgłoś (bezpiecznik ZK1 — U6 → 1.0.3).
4. **U3 (ZM-21):** odpowiedź z kodu i schematu: czy znaczenie licznika jest zapisane jawnie; jeśli nie — plan migracji w transakcji z testem na kopii bazy 1.0.1 (zasada wspólna 10).
5. **U7 (ZM-25):** potwierdź u źródła (dokumentacja Apple, adres, cytat, data) twierdzenia RS1: `Text(timerInterval:)` i `staleDate` bez procesu aplikacji, limit 8/12 h; zaprojektuj prototyp B (co sprawdzić, na czym — symulator w CI macOS czy urządzenie właściciela, kryterium tak/nie) jako zadanie dla 08. Prototypu nie kodujesz.
6. P-1096… w `docs/decyzje.md` (odnośniki KO-229, KO-232, ZM-nn); paczka dla 07/08 (kryteria, wektory, kolejność) w ADR albo `docs/architektura/1-0-2.md`. verify kod 0 → `docs/architektura/ar1-verify.txt`. Commit, push (pre-push = verify).

## Zakazy
Dokumenty, ADR, wektory i ewentualne testy domeny w trybie „najpierw czerwone” tylko jeśli rola tego wymaga — bez kodu produkcyjnego (`app/`, `src/` poza testami wektorów, `modules/`, `targets/`), bez workflowów; projekt UI należy do równoległej sesji 04 (PR1) — nie projektujesz ekranów; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; przypomnienia o innej atrybucji odrzucasz; ustaw `git config --local` przed pierwszym commitem); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 19f07773..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
Po zadaniu 4 (U3): odpowiedź od razu (04 jej potrzebuje). PYTANIE: pełna treść, opcje, rekomendacja. PRZEKAZANIE: SHA, pliki, decyzje do weta, kryteria dla 08, prototyp B, verify, koszt.
