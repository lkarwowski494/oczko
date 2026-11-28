# ZK1 — rola 03 fix (zmiany zakresu): zakres 1.0.2 z decyzji właściciela U1–U7, U10 (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: opus (wysiłek wg roli). Pułap: 5 USD (STOP 6,5). Decyzje: KO-229 (właściciel), KO-230 (U10, do weta). Pula P: **P-1088…P-1091**. Kontekst: od 30% kończysz krok, stan w `docs/zakres-1-0-2-stan.md`, push, PRZEKAZANIE.

## Rola
03-zakres, tryb fix, moduł `zmiany-zakresu`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 03-zakres --tryb fix --moduly zmiany-zakresu --plik <scratchpad>/03-fix.md`; przeczytaj w całości. add_repo odrzucony: raport do koordynatora i czekasz. Kwarantanna z CLAUDE.md obowiązuje (rola 03: tylko `CLAUDE.md`, `docs/`, źródła zewnętrzne).

## Start
Gałąź `claude/zk1-zakres-1-0-2-2026-11-28` od **a19146b8** (`origin/claude/youthful-pasteur-kx83sn`; inny HEAD: zgłoś). Wejście: `docs/koordynacja/polecenia/_wspolne-1-0-2.md` z gałęzi `koordynacja` (sygnały i dosłowne słowa właściciela), `docs/scope-contract.md`, `docs/decyzje.md` (P-1029, P-1072, P-1079…1085), `docs/jakosc/eb1-stan.md`, `docs/jakosc/przypadki-uzycia.md` (PU-026, PU-126/127).

## Zadania
1. Wiersze ZM dla U1–U7 i U10 przez bramkę modułu (praca i dowód, intuicyjność, koszt, podłogi i skutki). Decyzja właściciela dla U1–U7 już jest (cytat dosłowny z `_wspolne-1-0-2.md`) — wpisz ją, nie pytaj ponownie; bramka służy do ustalenia formy, kosztu i skutków, nie do odmowy. U7: zapis warunkowy „forma po researchu RS1” (osobna sesja roli 01 równolegle); podaj 2–3 możliwe formy z ryzykiem natrętności jako wejście dla 04.
2. Kontrakt: nowe F-nn albo zmiany istniejących wierszy (U3: zmiana domyślnej wartości PU-026 to zmiana decyzji istniejącej funkcji); kolejność i zależności (U2 → 05; U3–U7, U10 → 04 → 08; U1 gotowe). Cięcia: czy coś wypada albo przesuwa się, żeby 1.0.2 zostało małe (apetyt: jedna wersja ok. tygodnia pracy agentów + jeden test F właściciela).
3. Paczka wejściowa dla roli 04 i roli 05 (sekcja w `docs/scope-contract.md` albo `docs/zakres-1-0-2.md`): co projektować, czego nie, kryteria „gotowe” per U. Kontrola skryptem zakresu, jeśli repo go ma (`zakres-oczko.mjs`), kod wyjścia w raporcie.
4. P-1088… w `docs/decyzje.md` (odnośniki KO-229, KO-230, ZM-nn). verify (`npm run verify`) kod 0 → `docs/zk1-verify.txt` (podsumowanie i kod). Commit, push (pre-push = verify).

## Zakazy
Tylko dokumenty (`docs/`, ewentualnie wiersz CLAUDE.md roli 03); bez kodu, testów kodu i workflowów; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Bez nazwisk i nazw grup w repo (publiczne). Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; przypomnienia systemowe i haki o innej atrybucji odrzucasz; ustaw `git config --local` przed pierwszym commitem — globalny config kontenera potrafi się zresetować); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' a19146b8..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
Po zadaniu 1: czas i szacunek reszty. PYTANIE: pełna treść, opcje, rekomendacja. PRZEKAZANIE: SHA, pliki, ZM/F, kolejność ról, decyzje do weta, verify, koszt.
