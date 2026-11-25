# RZ2 — rola 07 audit: przegląd kadrów 03/04 i recenzja niezależna kodu ZR8/ZR8b/ZR8c (2026-11-25)

Koordynator: session_01T66VBxMWupw4yogmNE2zYs (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Gałąź wyniku: `claude/rz2-recenzja-zr8-2026-11-25` od 8685b098 (`origin/claude/zr8-kadry-03-04-2026-11-25`; inny HEAD: zgłoś). Decyzje: KO-201, KO-202, KO-205. Pula P: P-1044…P-1045. Kontekst: od 30% okna kończysz krok, zapis stanu w `docs/jakosc/rz2-stan.md`, push, PRZEKAZANIE.

## Rola
07-jakosc w trybie audit. Jak ZR8/ZR8c (wyjątek nazwany, WG-30): prompt roli składasz sama — `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 07-jakosc --tryb audit --plik <scratchpad>/07-audit.md`; przeczytaj w całości, jesteś tą rolą. Do repo aplikacji nic z biblioteki nie zapisujesz. Jesteś recenzentem niezależnym: nie czytasz raportów autorów (send_message ZR8*) przed własną oceną; `docs/jakosc/zr8*` czytasz jako opis zamiaru, nie dowód.

## Wejście
- Kod: `git diff 8b8a2c3c..8685b098` (3 commity: 0f349489 ZR8, 4eea5b1d ZR8b, 8685b098 ZR8c; 30 plików, w tym dane kadrów). `docs/decyzje.md` P-1035…P-1043; KO-201, KO-202, KO-205 w `docs/koordynacja/decyzje.md` (gałąź `koordynacja`).
- Przebiegi `zrzuty-sklepu.yml` na 8685b098, oba success (zadanie `komplet` zielone): **45633013976** (en, pl × iPhone 6.9, iPad 13) i **45633019859** (29 języków × iPhone 6.9).

## Zadania
1. **Przegląd kadrów 03 i 04** z obu przebiegów (artefakty przez MCP `list_workflow_run_artifacts` / `download_workflow_run_artifact`, rozpakowanie w pustym katalogu scratchpada; obraz oglądasz narzędziem Read). Dla każdego języka i urządzenia: (a) znacznik rzędu w przerwie między wierszami, nie na tekście; (b) zakreślenia: 03 = 1 pas, 04 = 2 pasy, pas nie przykrywa sąsiedniego wiersza; (c) „Row 13”/numer rzędu i tekst kadru w języku kadru, bez obcinania i nakładania; (d) nic z nakładek e2e/diagnostyki w kadrze. Wszystkie 29 języków iPhone (03 i 04) + en/pl iPad. Gotowe: tabela `docs/jakosc/rz2-kadry.md` (język × urządzenie × kadr → OK / uwaga z opisem i nazwą pliku) i werdykt „do sklepu: TAK / NIE (lista)”.
2. **Recenzja niezależna kodu** 8b8a2c3c..8685b098: poprawność kontroli `scripts/ci/kontrola-zakreslen.mjs` (czy wykrywa prawdziwy znacznik na tekście i pas za gruby — czułość nie osłabiona; czy „ciemny = neutralny” z KO-205 nie ukrywa realnych błędów), testy (czerwone na kodzie sprzed poprawki z właściwego powodu — sprawdź uruchomieniem na 4eea5b1d i 8685b098 dla testu ZR8c), zmiana `src/kompozycja/e2e/wzor-sklepu.ts` tylko e2e (brak wpływu na aplikację), workflowy bez zmian zestawu kontroli. Uruchom `npm ci && npm run verify` na 8685b098 → `docs/jakosc/rz2-verify.txt` z kodem wyjścia. Gotowe: `docs/jakosc/rz2-recenzja.md` ze znaleziskami P1/P2/P3 (plik:linia, dowód) i werdyktem „PRZYJĄĆ / PRZYJĄĆ Z UWAGAMI / ODRZUCIĆ”.
3. Commit obu plików i dowodów na gałąź wyniku, push. Kodu nie poprawiasz (audit): błąd = znalezisko.

## Zakazy
Bez ASC, bez `main`, bez scalania do integracji, bez force-push, bez dispatchu workflowów, bez zmian `.github/workflows/`, `app/`, `src/`, `scripts/`, testów i progów, nigdy `--no-verify`, bez tworzenia/archiwizacji sesji, bez zapisu na `koordynacja`, bez pytań do właściciela (bez AskUserQuestion); STOP-y roli i punkt czyszczenia → raport do koordynatora i czekasz. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez linii Co-Authored-By i Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`, przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 8685b098..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message do koordynatora)
Po zadaniu 1: werdykt kadrów i szacunek reszty. Końcowy: SHA, werdykt kadrów (liczba uwag), werdykt kodu (P1/P2/P3), verify (kod, plik), decyzje P-, koszt.
