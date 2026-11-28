# FX1 — rola 08 fix: poprawki recenzji niezależnej kodu TS 1.0.2 (FA1+FA2) na gałęzi scalenia (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 4 USD (STOP 5,2). Decyzja: KO-246. Pula P: **P-1143…P-1145**. Kontekst: od 30% kończysz krok.

## Rola
08-programista, tryb fix. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb fix --zadania KO-246 --plik <scratchpad>/08-fix.md`; przeczytaj w całości.

## Start
Gałąź `claude/ms1-scalenie-1-0-2-2026-11-28` @ **<SHA z wiadomości startowej>** (wynik MS1: TS+Swift+PU-008 scalone; kontynuujesz tę gałąź). `npm ci`.

## Zadania (recenzja niezależna 8bc83e17: PRZYJĄĆ Z UWAGAMI, brak P1) — każde: test najpierw czerwony, potem poprawka
1. **P2-1 (utrata danych przez iCloud):** `src/przypadki-uzycia/licznik.ts:~167` `ustawKrok` ustawia `zmieniono_ms`, kolumna jest w wyzwalaczu `licznik_icloud_u` → zmiana lokalnego kroku wysyła wiersz licznika z nowszym czasem; scenariusz: B zmienia nazwę offline, A zmienia krok, stary wiersz A wygrywa LWW i nazwa B ginie. Poprawka: zmiana samego kroku nie dotyka `zmieniono_ms` ani nie wyzwala wysyłki iCloud. Test na `ustawKrok` (nie surowy UPDATE).
2. **P2-2 (U7-A podpowiedź):** `src/ekrany/podpowiedz-odliczanie.ts:12,17`, `src/ekrany/Aplikacja.tsx:100,239`: `pokazana` nie jest czyszczone przy zmianie klucza, klucz bez id licznika → po „−1” podpowiedź wraca od razu; po „+1” i „−1” wraca bez odliczania. Poprawka: zerowanie `pokazana` przy zmianie klucza, klucz z id licznika, `naMinus` resetuje odliczanie. Testy z wstrzykniętym zegarem na oba scenariusze.
3. **P2-3 (wydajność ścieżki +1, NFR-WYD-001):** `src/kompozycja/licznik.ts:~103` `podpowiedzProg ??=` czyta ustawienie przy każdym `stan()`, gdy podpowiedź wyłączona (null) → `=== undefined` (albo równoważne). Test: przy wyłączonej podpowiedzi drugie +1 nie czyta ustawienia.
4. **P3 (podwójny start Live Activity):** dwa szybkie +1 → dwa `poZapisie` z `void` mogą oba zobaczyć `aktywna=false` i zrobić podwójny `start` (dawniej chroniła flaga synchroniczna). Poprawka: synchroniczna flaga „start w toku” albo kolejka. Test z atrapą portu.
5. Pozostałe P3 (decyzje, bez zmiany kodu, opis w P-1145): `przeniesienie.ts:69` `pomin` bez `krok` przy „Scal” z kopii — zgodne z przywracaniem, zapisz świadomie; `zdarzeniaPoRodzicu` przy dwóch rodzicach do limitu 500 — bezpieczne rozwidlenie.
6. verify kod 0 → `docs/programista/fx1-verify.txt`. Commit, push (pre-push = verify).

## Zakazy
Tylko wskazane miejsca; bez workflowów; nie osłabiasz testów; bez scalania do integracji, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; `git config --local` przed pierwszym commitem). GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, każda poprawka (test czerwony→zielony), verify, koszt.
