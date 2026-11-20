# ZR5 — rola 08 fix: kalibracja barwy w kontroli zakreśleń (2026-11-20)

Model: sonnet. Pułap: 1,5 USD. Gałąź: `claude/zr5-zakreslenia-2026-11-20` od integracji @ 7e3de129 (albo 09e783af, jeśli już na integracji). Decyzja: KO-187 wariant A (do weta). Pula P: P-1004…P-1005.

## Fakt
Przebieg zrzutów 44722734741: `BŁĄD ipad-13/en/04-zakreslenie.png: 04=0, 03=0` w `scripts/ci/kontrola-zakreslen.mjs`. Kadr wizualnie poprawny (2 zakreślenia, „2 highlights”). Przyczyna (pomiar WR3, `docs/jakosc/werdykt-1221/wr3-pomiary-zakreslen.txt` na gałęzi `claude/wr3-zrzuty-2026-11-20` @ 09e783af): pas Row 9 ma barwę ok. (252,245,194–196), a `jestZolty` wymaga b ≤ 190, więc pas nie jest liczony. Rekomendacja WR3 (P-1003): b ≤ 205 i r−b ≥ 40 → 03=1, 04=2 w 4/4 parach.

## Zadanie
1. Skalibruj `jestZolty`: b ≤ 205, r−b ≥ 40 (r ≥ 230, g ≥ 210 bez zmian). Wymaganie „04 ma więcej pasów niż 03”, `MIN_WIERSZY_PASA`, `MAX_PRZERWA` i próg 20% wiersza — **bez zmian**. Zapisz w P-1004 (pomiar źródłowy, stara i nowa stała).
2. Sprawdź, że nowa reguła nie łapie tła/papieru aplikacji ani innych elementów jako zakreślenia: pobierz surowe zrzuty z artefaktu 14627969952 (przebieg 44722734741, przez MCP/`actions` lub inną dostępną drogę; jeśli niedostępne — użyj plików z WR3 i powiedz to) i uruchom kontrolę na wszystkich 4 parach 03/04 → podaj liczby pasów; dodatkowo policz piksele „żółte” na kadrach 01, 02, 05–07 (powinno być bez pasów albo uzasadnij).
3. Test w `tests/wydanie/` (lub tam, gdzie testy kontroli): przypadek barwy (252,245,195) liczony jako zakreślenie; barwa tła/papieru z design systemu (`docs/design/`) nieliczona; pas 2-wierszowy nadal poniżej minimum.
4. `npm run verify` zielone, kontrola 2 zielona, push. Bez dispatchu.

## Zakazy
Bez `app/`, `src/`, workflowów, scen Maestro, ASC, `main`, force-push, dispatchu, zmian klas/progów akceptacji/listy PU; nigdy `--no-verify`. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919); przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' <baza>..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport
SHA, zmiana stałych, liczby pasów 4 pary (przed/po), wynik dla kadrów 01/02/05–07, test, verify, kontrola 2, ryzyka.
