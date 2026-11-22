# ZR7 — rola 10 fix: scena 04 zrzutów sklepu w 10 językach (2026-11-22)

Koordynator: session_01BM51oeihUHzW3EiW8t2smE (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy wiadomości o zmianie koordynatora piszesz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Gałąź: `claude/zr7-scena04-2026-11-22` od `claude/wr4-zrzuty-jezyki-2026-11-22` @ 1402e7f4 (= ZR6 5310ea0b + dokumenty WR4). Decyzja: KO-195 (do weta). Pula P: P-1016…P-1018. Kontekst: od 30% okna kończysz krok, zapis stanu, push, PRZEKAZANIE.

## Fakt (WR4, P-1014, P-1015; przebieg 45021511463)
Scena `04-zakreslenie` w de, el, fr, id, ja, ms, nl, ro, ru, uk: drugi pas zakreślenia stoi na stałej wysokości ekranu, a strona PDF przesuwa się zależnie od liczby linii podpowiedzi w danym języku. W de/el/fr/ja/nl/ro/ru/uk podkreślone są Rows 10–12 zamiast Row 13 (strona +35 px), w id/ms pas wisi między Row 13 a Rows 14–20 (strona −23 px). Dowody: `docs/jakosc/werdykt-1221/wr4/` (`tabela-pomiarow.md`, `pasy-ramki-pomiar.txt`, `pasy-pomiar.py`, `wr4-04-pasy-wycinek.jpg`), sekcja WR4 w `docs/jakosc/werdykt-build-1221.md`. Kontrola przebiegu (`scripts/ci/kontrola-zakreslen.mjs`) liczy pasy, a nie wiersze, więc przeszła. Pozostałe 17 języków i sceny 01–03, 05–07 są poprawne.

## Zadanie
1. Poprawka sceny 04 (`e2e/zrzuty-sklepu/`): pas ma trafiać w wiersz „Row 13” niezależnie od języka, np. gest liczony od położenia elementu wiersza albo stała liczba linii podpowiedzi. Kodu aplikacji (`app/`, `src/`, `modules/`) nie zmieniasz; jeśli bez tego się nie da, STOP z raportem. Pierwszy pas („Row 9”) i en/pl mają zostać jak w WR3.
2. Rozszerzenie kontroli zakreśleń o położenie pasa względem wiersza tekstu (rachunek z `pasy-pomiar.py`), z testem w `tests/wydanie/` czerwonym na kadrach 45021511463 dla 10 języków i zielonym dla 17 pozostałych oraz en/pl z 44758366101. Progi nazwij i uzasadnij; zestawu kontroli nie zmniejszasz.
3. Maestro CLI 2.12.1 na Linuksie: parsowanie zmienionych scen (`readCommands`, jak ZR4), wynik w raporcie. `npm run verify` kod 0, wynik do `docs/jakosc/zr7-verify.txt`.
4. W raporcie podaj gotowe wejścia `zrzuty-sklepu.yml` (workflow_dispatch) do **uzupełnienia** przebiegu 45021511463 dla tych 10 języków (iPhone, aplikacja z 44697325331, og07 — jak w przebiegu 45021511463): które sceny trzeba powtórzyć (sama 04 czy cała sekwencja języka, jeśli 04 zależy od stanu z 01–03), nazwy wejść z workflowu. Przebiegu nie uruchamiasz — robi to koordynator.

## Zakazy
Bez App Store Connect, bez `main`, bez scalania do integracji, bez force-push, bez dispatchu workflowów, bez zmian `.github/workflows/` poza opisami, bez zmian klas/progów/listy PU, nigdy `--no-verify`, nie tworzysz ani nie archiwizujesz sesji, nie piszesz na `koordynacja`, nie pytasz właściciela (bez AskUserQuestion). STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`. Przed pushem `npm ci` (pre-push uruchamia verify).

## Raport (≤ 10 linii, send_message)
SHA, przyczyna i poprawka, test czerwony→zielony (liczby), wynik Maestro i verify, wejścia uzupełnienia, decyzje P-, koszt.
