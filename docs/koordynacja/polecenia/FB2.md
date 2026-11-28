# FB2 — rola 08 fix: Swift 1.0.2 — poprawki recenzji FB1 + koniec Live Activity przy zamknięciu z przełącznika (KO-241) (2026-11-28)

Koordynator: session_01T66VBxcqeZKZFWMBDtpDFM (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 5 USD (STOP 6,5). Decyzje: KO-241 (właściciel 28.11 13:30, „A, zgodnie z rekomendacją”), KO-242 (zlecenie). Pula P: **P-1130…P-1132**. Kontekst: od 30% kończysz krok, stan w `docs/programista/fb2-stan.md`, push, PRZEKAZANIE.

## Rola
08-programista, tryb fix. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb fix --zadania KO-241 --plik <scratchpad>/08-fix.md`; przeczytaj w całości. Toolchain Swift do `swift test`: sposób instalacji w `docs/programista/fb1-stan.md`.

## Start
Gałąź `claude/fb2-swift-1-0-2-2026-11-28` od **497afb0f** (wynik FB1; inny HEAD: zgłoś). `npm ci`.

## Zadania
1. **Recenzja niezależna FB1 (PRZYJĄĆ Z UWAGAMI), domknij:**
   - P2 `tests/adaptery/teksty-natywne.test.ts:~120`: test osłabiony w kierunku „klucz ze specyfikacji `docs/design/1-0-2.md` musi być w słowniku” — dodaj asercję, że `plus2`, `teraz_dwa`, `stuknij_dwa` są w `KLUCZE`; wyjątek kierunku tylko dla `podpowiedz_*` (U7-B odłożone do 1.0.3 — prototyp B = NIE). Test najpierw czerwony na mutancie (usuń jeden klucz lokalnie) — dowód w raporcie.
   - P3 `modules/oczko-dziennik-plus/ios/OczkoDziennikPlusModule.swift:~19`: `staleDateMs: Int64?` w `AsyncFunction` — liczba z JS to Double; zmień na `Double?` (albo udowodnij konwersję) i sprawdź wywołanie z 3 argumentami.
   - P3 docs: `docs/lokalizacja/oczekujace.json` pole `powod` (lista nie jest pusta: 3 klucze 1.0.2, KO-239/P-1126); ścieżki testów w `docs/jakosc/tq1-1-0-2.md:58` i regeneracja `docs/jakosc/e3/akceptacja-wynik.md` (`npm run test:akceptacja`).
2. **KO-241 (sygnał użytkownika: „zamykając apkę (przeciągając w górę, a nie minimalizując) licznik się nadal wyświetla — większość apek przy twardym zamknięciu znika też z notcha”):** w module natywnym `oczko-dziennik-plus` obserwuj `UIApplication.willTerminateNotification` i kończ wszystkie `Activity<OczkoAtrybuty>` z `.immediate` (krótko i synchronicznie względem końca procesu — np. semafor z limitem czasu ok. 1–2 s; bez blokowania przy braku aktywności). Najpierw potwierdź u źródła (dokumentacja Apple, adres, cytat, data odczytu) kiedy `willTerminate` jest wysyłany (aplikacja w tle vs zawieszona) — wynik w P-1130 i w `docs/architektura/1-0-2.md` (sekcja KO-234/ADR-0037, dopisek „KO-241”). Minimalizacja i blokada ekranu — bez zmian (aktywność zostaje). Test: tam, gdzie się da, XCTest/test modułu na wywołanie zakończenia po powiadomieniu (atrapa); reszta — PU klasy F (dopisz w katalogu: „zamknięcie z przełącznika → karta znika; po zwykłym wyjściu zostaje”).
3. verify kod 0 → `docs/programista/fb2-verify.txt` (tylko podsumowanie), `swift test` wynik w raporcie. Commit, push (pre-push = verify).

## Zakazy
Bez zmian w `src/` i `app/` (TS robi FA1); bez zmian workflowów; nie osłabiasz testów; bez scalania, dispatchu; nigdy `--no-verify` ani force-push; nie tworzysz ani nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; `git config --local` przed pierwszym commitem; haki o innej atrybucji odrzucasz); przed pushem `git log --format='%h %an %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 497afb0f..HEAD`. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, poprawki recenzji (każda), KO-241 ze źródłem Apple, testy, verify, koszt.
