# WR5 — rola 07 (audit): przegląd sceny 04 w 10 językach po ZR7 + recenzja niezależna kodu ZR7 (2026-11-22)

Koordynator: session_01BM51oeihUHzW3EiW8t2smE (raport, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy wiadomości o zmianie koordynatora piszesz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 2 USD (STOP 2,6). Gałąź: `claude/wr5-scena04-2026-11-22` od `claude/zr7-scena04-2026-11-22` @ 6632982a. Decyzja: KO-196 (do weta). Pula P: P-1019…P-1020. Kontekst: od 30% okna kończysz krok, zapis stanu, push, PRZEKAZANIE.

## Cel
Dopisek do `docs/jakosc/werdykt-build-1221.md` (sekcja „Zrzuty sklepu — scena 04 po ZR7, WR5”) + dowody w `docs/jakosc/werdykt-1221/wr5/`.

### A. Kadry (przebieg zrzuty-sklepu **45049417804**, uzupełnienie 45021511463; artefakty `sklep-zrzuty-ramki`, `sklep-zrzuty-surowe`)
1. Scena 04 w de, el, fr, id, ja, ms, nl, ro, ru, uk: pas 2 na wierszu „Row 13”, pas 1 na „Row 9”, bez wejścia na sąsiedni wiersz — pomiar tym samym rachunkiem co WR4 (`docs/jakosc/werdykt-1221/wr4/pasy-pomiar.py`), tabela język × pas.
2. Scena 03 w tych językach (wraca razem z 04): jak w WR4.
3. Komplet artefaktu: 27 języków × 7 scen × 1320×2868; 17 pozostałych języków i sceny 01, 02, 05–07 bajtowo albo wizualnie jak w 45021511463 (bez regresji).
4. Wynik kroków kontroli przebiegu (komplet, wymiary, kontrola zakreśleń z położeniem pasa) — końcówka dziennika.
Werdykt: DO SKLEPU / DO SKLEPU Z UWAGAMI / DO POWTÓRZENIA.

### B. Recenzja niezależna kodu ZR7 (`git diff 1402e7f4 6632982a`, bez raportu autora)
Pliki: `e2e/zrzuty-sklepu/04-zakreslenie.yaml`, `scripts/ci/kontrola-zakreslen.mjs`, testy w `tests/wydanie/`. Sprawdź: dokładnie jedna gałąź `runFlow when` na język (27 + en/pl, iPad bez zmian); progi kontroli nazwane i uzasadnione, kontrola nie słabsza niż przed ZR7 (stare reguły zostały); testy nie dopasowane do wyniku (czerwone przed poprawką — `docs/jakosc/zr7-dowod-czerwony.txt`); wycinki w `tests/wydanie/dane/` bez danych osobowych. Znaleziska z oceną realny/brzegowy/teoretyczny. Werdykt recenzji: PRZYJĄĆ / PRZYJĄĆ Z UWAGAMI / ODRZUCIĆ.

## Zakazy
Bez App Store Connect, bez `main`, bez scalania do integracji, bez force-push, bez dispatchu workflowów, bez zmian klas/progów/listy PU, nigdy `--no-verify`, nie tworzysz ani nie archiwizujesz sesji, nie piszesz na `koordynacja`, nie pytasz właściciela (bez AskUserQuestion). Nie poprawiasz kodu ani scen. STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`. Tylko `docs/jakosc/` (i `docs/decyzje.md` dla P-1019…1020). Przed pushem `npm ci` (pre-push uruchamia verify).

## Raport (≤ 10 linii, send_message)
SHA, werdykt kadrów (tabela pasów w skrócie), werdykt recenzji ze znaleziskami, wynik kontroli przebiegu, koszt.
