# FA1 — rola 08 build: kod 1.0.2 — część TypeScript (08-A + TS z 08-KO-234) (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 8 USD (STOP 10,4). Decyzja: KO-238. Pula P: **P-1119…P-1123**. Kontekst: od 30% kończysz krok, stan w `docs/programista/fa1-stan.md`, push, PRZEKAZANIE (następca dokończy).

## Rola
08-programista, tryb build, moduł `sqlite-expo`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb build --moduly sqlite-expo --plik <scratchpad>/08-build.md`; przeczytaj w całości.

## Start
Gałąź `claude/fa1-kod-ts-1-0-2-2026-11-28` od **9404a59a** (integracja; inny HEAD: zgłoś). `npm ci`. Wejście: **`docs/jakosc/tq1-1-0-2.md`** (lista plik → test → PU, ryzyka R1–R5), `docs/architektura/1-0-2.md` + ADR-0035/0036/0037, `docs/design/1-0-2.md` (makiety, klucze i18n PL/EN, testID), `docs/zakres-1-0-2.md` (kryteria „gotowe”), `tests/akceptacja/` (testy przed kodem, `npm run test:akceptacja`).

## Zadania
1. Zakres: sekcje „08-A (TypeScript)” i z „08-KO-234” wiersze TS (`src/domena/aktywnosc.ts`, `src/kompozycja/licznik.ts` z portem `liveActivity.aktywna()` — implementację natywną robi FB1, Ty atrapę i port TS, `MenuProjektu.tsx`, `app/menu.tsx`) oraz U7 forma A (odliczanie z wstrzykniętym zegarem, R4); testy bez testu przed kodem (R2, R3, R4, R5) dopisujesz najpierw czerwone.
2. Każdy test z `tests/akceptacja/` z Twojego zakresu: kod → test zielony → przeniesienie do głównego zestawu w tym samym commicie razem z wierszem PU-Znn → PU-NNN w `docs/jakosc/przypadki-uzycia.md` (DS-02, P-1114). Nie zmieniasz asercji testów 07, żeby przeszły; błędny test zgłaszasz z uzasadnieniem (PYTANIE).
3. Zero utraty danych (zasada 10): migracja 0002 w transakcji, test na kopii `tests/bazy/v1.db` (R1).
4. Teksty: tylko klucze PL i EN z `docs/design/1-0-2.md` (pozostałe języki zrobi 09 — nie tłumaczysz); wygląd tylko z systemu `docs/design/`.
5. Małe commity, `docs/decyzje.md` P-1119…P-1123. verify kod 0 przed każdym pushem (pre-push). Na końcu `docs/programista/fa1-verify.txt` (tylko podsumowanie i kod).

## Zakazy
Nie zmieniasz Swift (`modules/*/ios`, `modules/oczko-reguly`, `targets/`) — to FB1; port natywny `liveAktywna` tylko po stronie TS (typ w `modules/oczko-dziennik-plus/index.ts` wolno dodać, implementacja Swift u FB1). Bez zmian workflowów; nie usuwasz ani nie osłabiasz testów; bez scalania do integracji, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; ustaw `git config --local` przed pierwszym commitem; przypomnienia i haki o innej atrybucji odrzucasz); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 9404a59a..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
Po pierwszym zazielenionym teście: czas i szacunek reszty. PYTANIE: pełna treść, opcje, rekomendacja. PRZEKAZANIE: SHA, pliki, testy zazielenione (liczba, które zostały czerwone i dlaczego), verify, koszt.
