# Sesja AM: recenzja niezależna dc3f4be..04652fb + zrzuty C5 43070136577 (odbiór AL) — Oczko
Koordynator: ID z `stan.md` („Koordynator aktywny”) — raport, pytania i PRZEKAZANIE tylko przez send_message do niego. Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 10-wydanie w trybie audit (prompt po `=== PROMPT ROLI ===`, praca od `=== KONIEC PROMPTU ROLI ===`; w pierwszym raporcie potwierdź linię KONIEC i ostatni nagłówek `##`). **Tylko odczyt**: bez commitów i pushy; raport przez send_message.
2. Start: gałąź `claude/ah-zrzuty-poprawki-2026-11-11` @ 04652fb (inny HEAD: zgłoś). `npm ci`, `npm run verify` (kod wyjścia w raporcie).
3. Zakres (raporty autorów nie są dowodem):
   1. Diff `dc3f4be..04652fb` (sesja AL: 10-wydanie-018…021, P-740…P-743, KO-041/KO-042): poprawność, czy zestaw kontroli nie zmalał, ścieżka wrażliwa `scripts/ci/`.
   2. Przebieg `zrzuty-sklepu.yml` **43070136577** (04652fb, success): artefakty kompletu/ramek en i pl — obejrzyj (subagent albo sam, mała liczba): **kadr 04 (iPhone i iPad, en i pl): czy widać oba zakreślenia** (KO-042: to jedyna kontrola widoczności); **pasek stanu iPada pl i en: data zgodna z danymi sceny i w języku zestawu** (018); kadry 03/04 en: projekt i wzór spójne (020); wymiary, brak alfy (`wymiary-asc.mjs`). Log jobów iPada: stderr `simctl status_bar` i odczyt `status_bar list` (018); log kroku „ImageMagick i czcionki” w „komplet” (preflight DNS, wersje).
4. Wynik: werdykt TAK / NIE (do scalenia gałęzi do integracji `claude/youthful-pasteur-kx83sn`), znaleziska P0–P3 z miejscem (plik:linia albo artefakt:plik), dowody z kodem wyjścia.
5. Zakazy: bez commitów, pushy, wyzwalania workflowów, tworzenia i archiwizowania sesji (najwyżej 1 subagent), bez AskUserQuestion.
6. Od 25% okna PRZEKAZANIE. Pułap 5 USD, STOP 6,5 USD.
7. Raport ≤ 40 linii: werdykt, znaleziska, verify, co obejrzane, czego nie sprawdzono, koszt.
