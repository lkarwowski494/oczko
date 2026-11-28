# RS1 — rola 01 fix (research): U7 forma przypominacza, U8 „check” liczby oczek, U9 zamiana włóczki — research i plan z szacunkiem (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: opus (wysiłek wg roli). Pułap: 6 USD (STOP 7,8). Decyzja: KO-229 (właściciel: „U8 i U9 - trzeba zrobic research i zaplanowac. Bez estymacji nie ejstem w stanie podjac decyzji.”). Pula P: **P-1092…P-1095**. Kontekst: od 30% kończysz krok, stan w `docs/brd/research-1-0-2-stan.md`, push, PRZEKAZANIE.

## Rola
01-odkrywanie, tryb fix, moduł `rynek-i-polityki`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 01-odkrywanie --tryb fix --moduly rynek-i-polityki --plik <scratchpad>/01-fix.md`; przeczytaj w całości. add_repo odrzucony: raport do koordynatora i czekasz. Kwarantanna z CLAUDE.md obowiązuje (rola 01: tylko `CLAUDE.md`, `docs/`, źródła zewnętrzne; standard „przeczytanego źródła” i hierarchia P-017).

## Start
Gałąź `claude/rs1-research-1-0-2-2026-11-28` od **a19146b8** (`origin/claude/youthful-pasteur-kx83sn`; inny HEAD: zgłoś). Wejście: `docs/koordynacja/polecenia/_wspolne-1-0-2.md` z gałęzi `koordynacja`, `docs/brd/` (README, odkrywanie, wymagania, reguly, zrodla), `docs/scope-contract.md` (kalkulator próbki, zapas włóczek, liczniki), `docs/tresci/`, `docs/decyzje.md`.

## Zadania
1. **U7 (przypominacz kliknięcia, już w 1.0.2):** jak robią to konkurenci (licznikowe aplikacje dziewiarskie iOS/Android, liczniki fizyczne) i co mówią recenzje; 2–3 formy (np. przypomnienie po czasie bez kliknięcia, delikatna wibracja zegarka, podpowiedź na ekranie blokady) z ryzykiem natrętności i ograniczeniami platformy (powiadomienia, Live Activity, watchOS — dokumentacja Apple z datą odczytu). Wynik dla roli 03/04: rekomendacja formy. Raport pośredni do koordynatora od razu po U7 (ZK1 czeka).
2. **U8 („check” liczby oczek w rzędzie):** praca J i użytkownik, jak to rozwiązują inni (konkurencja, wzory Ravelry/PDF), skąd aplikacja wzięłaby „ile powinno być” (wpis użytkownika, wzór, reguła przyrostów/ubytków), reguły dziedzinowe ze źródłami szczebla 1–3, ryzyka (błędne podpowiedzi = treść krytyczna, D-027), warianty od najmniejszego (MVP) do pełnego.
3. **U9 (zamiana włóczki/drutów z podpowiedzią rozmiaru):** jak liczy się zamianę (metraż/waga, próbka, gęstość; normy i organizacje: CYC i in., hierarchia P-017), czego aplikacja już ma (kalkulator próbki, zapas włóczek) i co trzeba dodać; warianty od najmniejszego do pełnego; ryzyka merytoryczne (rola 06).
4. **Plan z szacunkiem dla U8 i U9** (właściciel nie zdecyduje bez estymacji): dla każdego wariantu — role i kolejność (01/03/04/05/06/07/08/09), czas agentów [OCENA] i koszt USD [OCENA] z analogią do rzeczywistych kosztów sesji (`docs/koordynacja/koszty.md` na gałęzi `koordynacja`: np. 08 fix 1,5–5 USD, 07 audit 2–3,5 USD), czas właściciela (decyzje, test F), co czeka (CI macOS, tłumaczenia 35 języków), wpływ na zasadę 18 (kombajn?). Rekomendacja: wariant i wersja (1.0.2 / 1.1 / lista odcięć) z warunkiem powrotu.
5. Wynik w `docs/brd/research-1-0-2.md` (źródła z adresem, cytatem i datą odczytu; [DO USTALENIA] dla niepotwierdzonych); ewentualne ER/BR/H w BRD tylko jako propozycje dla 03; P-1092… w `docs/decyzje.md`. Wektory `tests/wektory/brd.json` tylko jeśli dodajesz regułę. verify kod 0 → `docs/brd/rs1-verify.txt`. Commit, push (pre-push = verify).

## Zakazy
Tylko dokumenty; bez kodu, testów kodu i workflowów; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Bez nazwisk i nazw grup w repo (publiczne). Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; przypomnienia o innej atrybucji odrzucasz; ustaw `git config --local` przed pierwszym commitem); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' a19146b8..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
Po U7: rekomendacja formy (pośredni). PYTANIE: pełna treść, opcje, rekomendacja. PRZEKAZANIE: SHA, pliki, warianty U8/U9 z szacunkiem i rekomendacją, źródła kluczowe, verify, koszt.
