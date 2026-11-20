# ZR4 — rola 10 fix: składnia swipe w scenach zrzutów (2026-11-20)

Model: sonnet. Pułap: 1,5 USD. Gałąź: `claude/zr4-swipe-2026-11-20` od integracji @ e3ef8867. Decyzja: KO-185 (do weta). Pula P: P-1000…P-1001.

## Fakt (przebieg 44697325331, wszystkie 4 zadania)
`Parsing Failed at e2e/zrzuty-sklepu/00-przygotuj.yaml:171:3` — linia `swipe: { start: "${ORIENT_WZOR == 'PORTRAIT' ? ZAKR_1_OD_IPHONE : ZAKR_1_OD_IPAD}", … }` (ryzyko 2 z raportu ZR3). Maestro waliduje `start`/`end` swipe'a przy parsowaniu, przed wyliczeniem JS. To samo w `04-zakreslenie.yaml:32`. Build aplikacji z tego przebiegu jest dobry (artefakt do ponownego użycia).

## Zadanie
1. Zastąp wyrażenia w `swipe` wariantem, który parser przyjmie na pewno. Rekomendacja koordynatora (wariant A): gałęzie `runFlow` z `when: { true: ${…} }` (orientacja × język), w każdej `swipe` z **dosłownymi** współrzędnymi (te same wartości co dziś w `dane/{en,pl}.json`, ZAKR_*). Wariant B (wybór w workflow/skrypcie zmiennych per urządzenie i `${ZAKR_1_OD}` w scenie) tylko jeśli udowodnisz, że Maestro przyjmuje samą zmienną `${…}` w `start` swipe'a. Zapisz wybór w P-1000.
2. Jeśli da się zainstalować Maestro CLI na Linuksie (Java jest), uruchom `maestro check-syntax` (lub odpowiednik) na wszystkich plikach `e2e/zrzuty-sklepu/*.yaml` i podaj wynik; jeśli się nie da — powiedz to wprost.
3. Test w `tests/wydanie/` pilnujący, że pola `start`/`end` każdego `swipe` w scenach zrzutów to dosłowne „N%, M%” (bez `${`), a geometria (test ZR3) nadal czyta wartości (dostosuj test geometrii do nowego źródła współrzędnych, jeśli trzeba).
4. Przejrzyj inne zmiany ZR3 w scenach pod kątem tego samego ryzyka (wyrażenia JS w polach walidowanych przy parsowaniu).
5. `npm run verify` zielone, kontrola 2 zielona, push. Bez dispatchu.

## Zakazy
Bez `app/`, `src/`, workflowów (chyba że wariant B — wtedy uzasadnij), ASC, `main`, force-push, dispatchu, zmian klas/progów/listy PU; nigdy `--no-verify`. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919); przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' e3ef8867..HEAD` pusty. GitHub tylko przez MCP.

## Raport
SHA, wariant i dowód, wynik check-syntax (albo „niedostępne”), pliki, verify, kontrola 2, ryzyka.
