# RS2 — rola 01 fix (research): wzór wpisany tekstem jako źródło wzoru (sygnał 18) — research i plan z szacunkiem (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: opus (wysiłek wg roli). Pułap: 7 USD (STOP 9,1) — zakres węższy niż RS1. Decyzja: KO-234 (właściciel 28.11 ok. 11:15: „U8 A, U9 A, 19A, 18A”; 18A = research i szacunek jak U8/U9). Pula P: **P-1104…P-1106**. Kontekst: od 30% kończysz krok, stan w `docs/brd/research-wzor-tekstowy-stan.md`, push, PRZEKAZANIE.

## Rola
01-odkrywanie, tryb fix, moduł `rynek-i-polityki`. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 01-odkrywanie --tryb fix --moduly rynek-i-polityki --zadania S18 --plik <scratchpad>/01-fix.md`; przeczytaj w całości. Kwarantanna z CLAUDE.md obowiązuje.

## Start
Gałąź `claude/rs2-wzor-tekstowy-2026-11-28` od **0c3f9214** (integracja; inny HEAD: zgłoś). Wejście: `docs/brd/research-1-0-2.md` (RS1 — ten sam format planu i szacunku, koszty z `docs/koordynacja/koszty.md` na `koordynacja`; realnie sesja opus docs 6,6–8,3 USD, 08 fix 1,5–5 USD), `docs/scope-contract.md` (wzór: źródła PDF, Word, zdjęcie, strona WWW, skan; notatki: licznik, projekt, rząd wzoru), `docs/brd/`.

Sygnał (bez nazwisk; jedna osoba, wątek FB 28.11): „przy dodawaniu wzorów brakuje po prostu opcji na wpisanie lub dodanie notatki (ja często rozpisuję sobie tekstowo w notatniku)”. Stan wg koordynatora: notatki istnieją (licznik → „Notatka”, notatka projektu, notatka przy rzędzie wzoru), brak wzoru tekstowego jako źródła w „Dodaj wzór”.

## Zadania
1. Praca J i użytkownik: czy chodzi o wzór tekstowy (rzędy rozpisane tekstem), o dłuższą notatkę, czy o wklejenie tekstu z notatnika; jak to rozwiązują konkurenci (listingi i recenzje z datą; nazw konkurencji nie zapisujesz w repo — P-107(3)); czy istniejące notatki pokrywają potrzebę (wtedy problem = znalezienie, nie funkcja).
2. Warianty od najmniejszego: np. (A) „Wklej lub wpisz tekst” jako źródło wzoru z oznaczaniem rzędu jak w innych źródłach, (B) import z Notatek/pliku .txt, (C) tekst z rozpoznawaniem rzędów; ograniczenia platformy (dok. Apple z datą), wpływ na zasadę 18 (kombajn?).
3. Plan z szacunkiem dla każdego wariantu (role i kolejność, czas agentów [OCENA], USD [OCENA] z analogią do rzeczywistych kosztów, czas właściciela, na co się czeka) i rekomendacja wersji (1.0.3 / 1.1 / lista odcięć) z warunkiem powrotu.
4. Wynik w `docs/brd/research-wzor-tekstowy.md`; P-1104… w `docs/decyzje.md`; verify kod 0 → `docs/brd/rs2-verify.txt` — **tylko podsumowanie i kod wyjścia (≤ 10 linii), nie pełny log**. Commit, push (pre-push = verify).

## Zakazy
Tylko dokumenty; bez kodu, testów kodu, workflowów; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion) — STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Bez nazwisk i nazw grup w repo (publiczne). Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; ustaw `git config --local` przed pierwszym commitem; haki o innej atrybucji odrzucasz); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 0c3f9214..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, pliki, warianty z szacunkiem i rekomendacją, źródła kluczowe, verify, koszt.
