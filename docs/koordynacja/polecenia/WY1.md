# WY1 — rola 10 build: przygotowanie wersji 1.0.1 (tylko zrzuty), droga przyspieszona (2026-11-25)

Koordynator: session_01T66VBzwa5cozWNDhofQSHH (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Gałąź: `claude/wydanie-1-0-1` od a830eb21 (tag `v1.0.0-b1221`, wydana 1.0). Decyzja: KO-203. Pula P: P-1040…P-1041. Kontekst: od 30% okna kończysz krok, zapis stanu, push, PRZEKAZANIE.

## Fakt
1.0 (1221) jest w App Store. Zrzuty 1.0 w ASC zablokowane; właściciel wybrał 1.0.1 tylko dla nowych zrzutów (poprawia je ZR8b na `claude/zr8-kadry-03-04-2026-11-25`). Kod aplikacji ma być identyczny z 1221.

## Zadanie
1. Gałąź `claude/wydanie-1-0-1` od a830eb21: podbij wersję do 1.0.1 wszędzie, gdzie trzeba (`app.json` i co jeszcze czyta `testflight.yml` / prebuild / cel zegarka i widżetu — sprawdź, nie zgaduj), numer builda zgodnie z mechanizmem `testflight.yml`. Zero innych zmian w `app/`, `src/`, `modules/`, `targets/`, zależnościach.
2. Dowód automatyczny: `git diff --stat a830eb21..HEAD` + skrypt/test, że różnica dotyczy tylko pól wersji (lista plików i linii w `docs/wydanie/1-0-1-roznica.md`).
3. „What's New in This Version” dla 1.0.1 (wymagane przy aktualizacji, każda lokalizacja w ASC): sprawdź źródło Apple i mechanizm repo (`asc-metadane.yml`, `docs/wydanie/metadane/*.store.json`; jak w Treningu, jeśli tam jest). Tekst neutralny, krótki („Ulepszone zrzuty i drobne poprawki” — bez obietnic funkcji), 35 lokalizacji: jeśli repo ma przekład (`przeklad-tlumaczen.yml`), użyj go; nie wysyłaj nic do ASC.
4. Sprawdź, czy `testflight.yml` da się uruchomić z tej gałęzi (bramka „Jakość · iOS” na tym SHA — jak ją uzyskać bez pomijania; P-319 dispatch z `ref`). W raporcie gotowe wejścia: (a) przebieg dowodowy bez wysyłki, (b) właściwy. Niczego nie uruchamiasz — dispatch robi koordynator za zgodą właściciela.
5. Lista kroków właściciela w ASC dla 1.0.1 (utworzenie wersji „+ Version or Platform”, wybór builda, zrzuty przez `asc-zrzuty` po zgodzie, What's New, Submit; ręczne wydanie czy automatyczne — jak w 1.0) → `docs/wydanie/lista-1-0-1.md`, z odnośnikami do Treningu tam, gdzie analogia.
6. `npm ci && npm run verify` kod 0 na gałęzi → `docs/wydanie/1-0-1-verify.txt`.

## Zakazy
Bez zapisu do App Store Connect, bez dispatchu workflowów, bez tagów, bez `main`, bez scalania, bez force-push, bez `pomin_bramke_e2e`, bez zmian klas/progów/listy PU, nigdy `--no-verify`, bez tworzenia/archiwizacji sesji, bez zapisu na `koordynacja`, bez pytań do właściciela. STOP-y roli → raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
SHA, pliki wersji, dowód różnicy, What's New (źródło + mechanizm), wejścia testflight (a/b) i bramka, lista kroków właściciela, verify, P-, koszt.
