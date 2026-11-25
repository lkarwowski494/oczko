# ZR8 — rola 10 fix: znacznik rzędu i zakreślenie Row 13 w kadrach 03/04 zrzutów sklepu (2026-11-25)

Koordynator: session_01T66VBzwa5cozWNDhofQSHH (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy wiadomości o zmianie koordynatora piszesz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 4 USD (STOP 5,2). Gałąź: `claude/zr8-kadry-03-04-2026-11-25` od integracji `claude/youthful-pasteur-kx83sn` @ 8b8a2c3c. Decyzja: KO-201 (słowa właściciela 25.11: „Poprawić teraz”). Pula P: P-1035…P-1037. Kontekst: od 30% okna kończysz krok, zapis stanu, push, PRZEKAZANIE.

## Fakt
Oczko 1.0 (1221) zaaprobowane i opublikowane w App Store (właściciel 25.11 ok. 05:40 UTC: „Jest w sklepie”). Właściciel pokazał kadry pl ze sklepu i zgłosił ich wygląd. Koordynator na tych kadrach widzi:
1. `03-wzor` („Wzór zawsze obok licznika”) i `04-zakreslenie`: linia znacznika „Rząd 21 ↓” leży na tekście wiersza „Rząd 21: przerabiaj po 2 oczka razem…” i wygląda jak przekreślenie.
2. `04-zakreslenie`: drugie zakreślenie (Row 13) to cienka żółta kreska przez środek liter, a nie pas jak przy Row 9 (WR3/WR5: „wygląd utrzymany” — teraz uchylone przez właściciela).
Kadry pochodzą z przebiegów 45002887129 (en/pl iPhone+iPad), 45049417804 / 45021511463 (27 języków iPhone). Przeglądy: `docs/jakosc/werdykt-build-1221.md`, `docs/jakosc/werdykt-1221/`.

## Zadanie
1. Źródło (zasada wspólna 4, przeczytane z datą): czy zrzuty wersji opublikowanej („Ready for Distribution”) da się zmienić w App Store Connect bez nowej wersji, czy dopiero z nową wersją (1.0.1) i nowym buildem do App Review. Cytat + adres developer.apple.com / help App Store Connect. To decyduje o tym, jak koordynator zaplanuje wgranie.
2. Poprawka scen `e2e/zrzuty-sklepu/03-wzor.yaml`, `04-zakreslenie.yaml` (i `00-przygotuj.yaml`, jeśli tam jest położenie znacznika): znacznik rzędu w przerwie między wierszem 20 a 21 (nie na tekście), w każdym języku; zakreślenie Row 13 pełnym pasem jak Row 9 (ten sam gest/grubość), w każdym języku. Kodu aplikacji (`app/`, `src/`, `modules/`, `targets/`) nie zmieniasz; jeśli bez tego się nie da (np. znacznik zawsze rysuje się na tekście), STOP z raportem i dowodem.
3. Kontrola: rozszerz `scripts/ci/kontrola-zakreslen.mjs` (albo nowa kontrola obok) o (a) grubość pasu (oba pasy w 04 w tym samym przedziale wysokości), (b) linia znacznika nie przecina pikseli tekstu wiersza. Test w `tests/wydanie/` czerwony na obecnych kadrach (artefakty przebiegów wyżej, jeśli jeszcze są; inaczej na wycinkach w repo — podaj, na czym) i zielony na poprawnych. Progi nazwane i uzasadnione; zestawu kontroli nie zmniejszasz.
4. Maestro CLI 2.12.1 na Linuksie: parsowanie zmienionych scen (`readCommands`, jak ZR4). `npm run verify` kod 0, wynik do `docs/jakosc/zr8-verify.txt`.
5. W raporcie gotowe wejścia `zrzuty-sklepu.yml` (workflow_dispatch) do pełnego przebiegu: iPhone 29 języków i iPad en/pl (które sceny, czy da się użyć aplikacji z wcześniejszego przebiegu). Przebiegu nie uruchamiasz — robi to koordynator.

## Zakazy
Bez App Store Connect (tylko odczyt dokumentacji Apple), bez `main`, bez scalania do integracji, bez force-push, bez dispatchu workflowów, bez zmian `.github/workflows/` poza opisami, bez zmian klas/progów/listy PU, nigdy `--no-verify`, nie tworzysz ani nie archiwizujesz sesji, nie piszesz na `koordynacja`, nie pytasz właściciela (bez AskUserQuestion). STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`. Przed pushem `npm ci` (pre-push uruchamia verify).

## Raport (≤ 10 linii, send_message)
SHA, odpowiedź Apple z cytatem i adresem (zad. 1), przyczyna i poprawka, test czerwony→zielony (liczby), Maestro i verify, wejścia przebiegu, decyzje P-, koszt.
