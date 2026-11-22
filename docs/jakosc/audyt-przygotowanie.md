# Audyt 07 (plan-prac 2.4) — przygotowanie niezależne od kodu
Wersja 2026-10-27 (rola 07, P-289). Audyt właściwy: tryb `audit` roli 07, jeden werdykt dla jednego commitu po etapie 1 (kod 1.0 domknięty). Tu: zakres, źródła, komendy i wstępne odczyty, które nie zależą od dalszego kodu; wyniki wstępne podaję z commitem, na którym je odczytałem, i audyt powtarza je na swoim SHA.

## 1. Zakres i warunki startu
- **Commit:** HEAD gałęzi `claude/jolly-thompson-paz6d8` po etapie 1 (partie 6 i 7 domknięte, krok iCloud w oknie). Wszystkie przebiegi (Linux, „Jakość · iOS” z `[e2e-pelny]`, XCTest) na **tym samym SHA** (JAK-16; strategia §11).
- **Wejście:** `docs/jakosc/strategia.md` (rejestr ryzyk §2, poziomy §3, definicja ukończenia §6, lista §8, plan wydania §11), `docs/scope-contract.md`, kryteria BR z `docs/brd/` i `docs/jakosc/e0/kryteria.json`, `docs/design/` (macierz stanów), `docs/adr/`, raporty E2 przebiegów (`oczko-warsztat/07-jakosc/2026-10-26-fix3/`), wyniki listy TestFlight (`docs/jakosc/testflight-na-urzadzeniu.md`).
- **Raporty innych ról z tego samego SHA** (05 ARCH, 08 DEV, 04 SP, 12): jeśli istnieją, ich pozycje „patrz <rola>-NNN”; bez nich 07 zgłasza ARCH-09/21, DEV-01/03/04 samo (prompt roli, uwagi pod listą kontrolną).
- **Czas agenta:** ok. 3–4 h (szacunek); czekanie: przebieg pełny iOS ok. 2,5 h w oknie maszyn, lista TestFlight właściciela 45–90 min.

## 2. Lista kontrolna → co uruchomić (gotowe komendy)
| ID | Co sprawdzić | Jak (komenda / źródło) |
|---|---|---|
| JAK-01 | ryzyko wysokie → test → wynik | rejestr ryzyk strategii §2 (R-…) × `npx jest --listTests` + `tests/wektory/`; ścieżki utraty danych 05 |
| JAK-02 | pochodzenie wartości w asercjach domeny | `tests/wektory/brd.json` (generuje 01), komentarze źródeł; `git log -p` nowych testów domeny bez źródła |
| JAK-03 | kryterium → test z ID → wynik | `node docs/jakosc/narzedzia/linie-kryteriow.mjs --check`; `docs/jakosc/e0/kryteria.json` × grep ID w `tests/` i `e2e/scenariusze/` (tagi); tabela w `e2e/README.md` |
| JAK-04 | testy mogą paść | ręczne mutanty w worktree (scratchpad) w 3 funkcjach ryzyk wysokich: `src/domena/limit.ts`, przeliczenia zapasu, kolejka zapisu licznika; `docs/jakosc/narzedzia/mutanty-e1.mjs` |
| JAK-05 | powtarzalność | `env -u NODE_PATH npx jest` ×3, raz `--randomize`; grep `Date.now()`, `setTimeout` w `tests/`; E2E: klasyfikacja porażek z raportów 119–126 |
| JAK-06 | daty i strefy | `tests/narzedzia/czas.ts` (`przejsciaCzasu`), `tests/narzedzia/strefy.ts`, lista stref w konfiguracji testów; granica dnia ze stoperem (F07-21) |
| JAK-07 | własności | `fc.assert` w `tests/` (grep), ziarno `PROP_SEED` w `jakosc-linux.yml` |
| JAK-08 | prawdziwe wycinki danych z zewnątrz | korpus W1 (`modules/oczko-wzor/TestyOknaMaszyn/Testy/korpus/`), pliki importu, EXIF/GPS zdjęć (scen. 43, testy Node) — bez danych osobowych |
| JAK-09 | bramka CI = pełny zestaw lokalny | `package.json` `verify` × `jakosc-linux.yml`; `continue-on-error`, `|| true`, `--passWithNoTests` |
| JAK-10 | bezpieczeństwo workflowów | grep `pull_request_target`, `workflow_run`, `${{ github.event` w `run:`, `permissions`, akcje spoza `actions/*` bez SHA |
| JAK-11 | koszt CI | repo publiczne (standardowe runnery darmowe) — najwyżej P2 |
| JAK-12 | główny przepływ → E2E albo „tylko telefon” | `e2e/README.md` (kryterium → scenariusz), ostatni pełny przebieg, wyniki listy TestFlight |
| JAK-13 | deklaracje dostępności | NFR-DOS-001/002: scen. 29, 30 (AX5) i ich wynik; brak deklaracji rozmiaru celu w Jest |
| JAK-15 | deklaracje jakości prawdziwe | inwentarz §3; `wc -l CLAUDE.md`; generatory z `--check` (`jakosc:kontrole`) |
| JAK-16 | jeden SHA kandydata | SHA przebiegów vs SHA builda TestFlight (rola 10); aktualizacja z danymi: od 1.0 (TT-06) |
| JAK-17 | nazwy workflowów vs działanie | „Jakość · iOS” buduje i steruje symulatorem (tak w przebiegach 121–126); zadanie `eksperymenty-wzoru` informacyjne — czy nazwa/opis to mówi |
Kontrola raportu: `sprawdz-raport.mjs` z promptu roli (kopia w scratchpadzie), przed oddaniem.

## 3. Inwentarz deklaracji jakości (JAK-15) — do porównania z wynikiem komend na SHA audytu
| Deklaracja | Miejsce | Sprawdzenie |
|---|---|---|
| `CLAUDE.md` < 200 linii (D-019) | `CLAUDE.md` | `wc -l` — wstępnie 49 (2dd8882) |
| „pełna bramka: `npm run verify`” | `CLAUDE.md` (Komendy) | `env -u NODE_PATH npm run verify`, kod wyjścia |
| liczba testów w raportach ról („verify N/N”) | `docs/programista/*.md`, `docs/jakosc/stan.md` | wynik `npm test` na SHA |
| definicja ukończenia i lista §8 | `docs/jakosc/strategia.md` | stan pozycji na SHA (wyniki TestFlight) |
| „bramka: pakiet podstawowy zielony” | strategia §5, `e2e/README.md` | przebieg `[e2e-pelny]` na SHA: 01–09 + 33 |

## 4. Wstępne odczyty (2dd8882, 2026-10-27) — audyt powtarza na swoim SHA
- **JAK-10:** brak `pull_request_target` i `workflow_run`; `${{ github.event.head_commit.message }}` tylko przez `env:` (`jakosc-ios.yml`, `COMMIT_MSG`); wszystkie `uses:` to `actions/*`. Wstępnie bez znaleziska.
- **JAK-09:** `continue-on-error: true` przy zadaniu `akceptacja` w `jakosc-linux.yml` z komentarzem „informacja do pierwszego zielonego przebiegu (zasada 8)” — do sprawdzenia, czy pierwszy zielony przebieg już był (wtedy zadanie powinno stać się bramką albo mieć zapisany powód). `eksperymenty-wzoru` (`jakosc-ios.yml`) informacyjne z nazwy decyzji (P-265) — czerwone w 121, 123, 126 (W1, środowisko, P-282).
- **JAK-15:** `CLAUDE.md` 49 linii.
- **Otwarte z przebiegów (raporty E2 123, 126):** 01 — pierwsze +1 po zimnym starcie bez skutku (P-286, test U12 na urządzeniu); 15 — brak panelu `e2e-zegarek-stan`; 30 — menu ••• poza paskiem przy AX5. Każde z nich na SHA audytu: zielone albo pozycja z poziomem.

## 5. Kandydaci do „Nie sprawdzono” (z powodem)
Apple Watch (brak urządzenia), TT-04/TT-05 (Family Sharing, zwrot), TT-06 (od 1.0), BR-DAN-004/S1 (drugi telefon), zakupy i iCloud zależnie od warunków bloków E i F listy TestFlight.

## 6. Uwaga do planu prac
`docs/plan-prac.md` 3.3 wymienia test „na iPhonie, zegarku i iPadzie” — według strategii §8 (TT-9) właściciel nie ma Apple Watch; lista TestFlight obejmuje iPhone i iPad, zegarek „nie sprawdzono”.
