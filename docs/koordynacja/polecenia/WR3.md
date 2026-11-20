# WR3 — rola 07 (audit): przegląd zrzutów sklepu po ZR3/ZR4 (2026-11-20)

Model: sonnet. Pułap: 1,5 USD. Gałąź: `claude/wr3-zrzuty-2026-11-20` od integracji `claude/youthful-pasteur-kx83sn` @ 7e3de129. Decyzja: KO-186, KO-187 (do weta). Pula P: P-1002…P-1003 (P-999 pomijać).

## Cel
Dopisek do `docs/jakosc/werdykt-build-1221.md` (sekcja „Zrzuty sklepu — przegląd po ZR3/ZR4, WR3”) + dowody w `docs/jakosc/werdykt-1221/`.
Materiał: przebieg zrzuty-sklepu **44722734741** (7e3de129, en,pl, iPhone 6.9 + iPad 13, og07=true, aplikacja z przebiegu 44697325331). Artefakty `sklep-zrzuty-ramki` i `sklep-zrzuty-surowe` (pobieranie: `mcp__github__actions_list` list_workflow_run_artifacts → `actions_get` download_workflow_run_artifact → curl).
Sprawdź na **każdym** surowym i w ramce:
1. uwagi WR2 — każdą zamknij albo utrzymaj z dowodem (plik, współrzędne):
   - **P2 znacznik:** licznik fikstury 20 → znacznik „21 ↓” ma stać na linii PDF „Row 21” (iPhone i iPad, en i pl);
   - **P3 zakreślenia:** pasy na wierszach „Row 9” i „Row 13” od początku do końca tekstu wiersza, bez wejścia na sąsiedni wiersz (iPad en/pl, iPhone en/pl); zmierz odchylenie w pikselach;
   - **U4 podpis 04:** en „Highlight rows right on the pattern”, pl „Zakreślaj rzędy prosto na wzorze” — zgodny z kadrem;
2. brak nakładek diagnostycznych E2E i pigułki „Strona n z m” (U2);
3. **OG-07** dla scen 03/04 (P-218 ogr. 1–6, P-224);
4. zgodność kadru z aplikacją 1221 (różnice wyłącznie z P-993) i komplet kadrów (liczba = jak w WR2);
5. **przebieg jest czerwony tylko na kontroli zakreśleń** (`scripts/ci/kontrola-zakreslen.mjs`, krok „Komplet zrzutów i wymiary”): `ipad-13/en/04` = 0 pasów, pozostałe po 1. Pomiar koordynatora (do sprawdzenia, nie do przepisania): pas „Row 9” ma barwę ok. (252,245,194) — poza regułą `jestZolty` (b ≤ 190), więc na żadnym kadrze nie jest liczony; liczy się tylko cienki pas „Row 13” (252,243,184), który na iPadzie en ma 2 wiersze analizy (minimum 3). Oceń: (a) czy kadr 04 iPad en wizualnie pokazuje zakreślenie (wtedy to fałszywy alarm kontroli), (b) czy pas „Row 13” — cienki, przez środek tekstu — czyta się jako zakreślenie, czy jako przekreślenie (P1/P2/P3), (c) rekomendację: kalibracja barwy w kontroli na kadrach z tego przebiegu czy zmiana sceny (grubszy/nasycony pas). Nie poprawiaj kodu — tylko werdykt i pomiary.
Werdykt dla zrzutów: DO SKLEPU / DO SKLEPU Z UWAGAMI / DO POWTÓRZENIA.

## Zakazy
Bez App Store Connect (także bez asc-zrzuty), bez `main`, bez force-push, bez dispatchu workflowów, bez zmian klas/progów/listy PU, nigdy `--no-verify`. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`. Tylko `docs/jakosc/`.

## Raport
SHA, werdykt zrzutów, stan P2/P3/U2/U4 z dowodem, wynik OG-07 03/04, koszt.
