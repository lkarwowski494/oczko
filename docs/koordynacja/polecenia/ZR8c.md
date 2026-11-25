# ZR8c — rola 10 fix: znacznik rzędu na iPhonie 6.9 nadal na tekście — następca ZR8b (2026-11-25)

Koordynator: session_01T66VBxVAnGpL7ayrthZLSd (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; jeśli dostaniesz wiadomość o zmianie koordynatora, pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Gałąź: ta sama `claude/zr8-kadry-03-04-2026-11-25`, kontynuacja od 4eea5b1d (ZR8b). Decyzje: KO-201, KO-202. Pula P: P-1042…P-1043. Kontekst: od 30% okna kończysz krok, zapis stanu w `docs/jakosc/zr8c-stan.md`, push, PRZEKAZANIE.

## Rola
10-wydanie w trybie fix. Jak ZR8/ZR8b (wyjątek nazwany): prompt roli składasz sama — `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 10-wydanie --tryb fix --plik <scratchpad>/10-fix.md`; przeczytaj w całości, jesteś tą rolą. Do repo aplikacji nic z biblioteki nie zapisujesz.

## Wejście
`docs/koordynacja/polecenia/ZR8.md` i `ZR8b.md` (gałąź `koordynacja`), P-1035…P-1039 w `docs/decyzje.md`, `docs/jakosc/zr8*.{md,txt}`, commity 0f349489 i 4eea5b1d.
Fakt z przebiegów na 4eea5b1d (koordynator, 25.11 14:00): zadanie `komplet` CZERWONE w 45564086208 (all × iPhone) i 45564082350 (en,pl × iPhone, iPad). Kontrola zakreśleń 10-wydanie-019 OK (03 = 1 pas, 04 = 2 pasy). **Znacznik rzędu na iPhonie 6.9 nadal na tekście**: linia znacznika y≈1002 px w wierszu tekstu 963–1032 px — wszystkie języki iPhone; **iPad 13 OK**. Wniosek ZR8b (margines ≈16 pt na iPhonie) wyliczony z geometrii PDF nie potwierdził się w kadrze.

## Zadanie
1. **Przyczyna z pikseli, nie z geometrii PDF.** Pobierz kadry 03 i 04 iPhone (en, pl + 2 inne języki) i iPad (en) z artefaktów obu przebiegów (MCP `list_workflow_run_artifacts` / `download_workflow_run_artifact`, rozpakowanie w pustym katalogu scratchpada) oraz log/raport kontroli z `komplet`. Zmierz w px: górę strony PDF, skalę (px na pt), położenie linii znacznika i wierszy 20–22; przelicz na pt strony. Nazwij, dlaczego wyliczenie ZR8b rozjechało się z kadrem na iPhonie (np. znacznik nie na środku strony, inna skala, przewinięcie, pasek narzędzi).
2. **Poprawka** w `src/kompozycja/e2e/wzor-sklepu.ts` (fikstura e2e; wyjątek KO-202 tylko dla tego pliku) albo w scenach Maestro zrzutów (offset/przewinięcie tylko na iPhonie) — wybierz wariant z mniejszą zmianą, który daje linię znacznika ≥ 4 pt (w kadrze: odpowiednio px) od tekstu z obu stron **na iPhonie 6.9 i iPadzie 13** (iPad nie może się zepsuć). Druga opcja z kompromisem i rekomendacją w raporcie. Zmiana scen zakreśleń → dopasuj sceny 04 i testy geometrii jak w ZR8b; kontroli i progów nie osłabiasz.
3. **Test czerwony → zielony na danych z pikseli:** test (albo rozszerzenie istniejącego), który wczytuje zmierzone wartości kadru iPhone (stała/plik z pomiarem w repo, z odnośnikiem do przebiegu i kadru) i jest czerwony na fiksturze 4eea5b1d, zielony po zmianie. Test „margines z geometrii PDF” sam nie wystarcza.
4. Maestro 2.12.1 `readCommands` dla zmienionych scen; `npm ci && npm run verify` kod 0 → `docs/jakosc/zr8c-verify.txt`. Dowód „tylko e2e” jak w ZR8b, jeśli zmieniasz `wzor-sklepu.ts`.
5. W raporcie wejścia do dispatchu `zrzuty-sklepu.yml` (dispatch robi koordynator): wariant szybki iPhone en,pl do sprawdzenia, potem pełny.

## Zakazy
Jak w ZR8b: bez ASC, bez `main`, bez scalania do integracji, bez force-push, bez dispatchu, bez zmian `.github/workflows/` poza opisami, bez zmian klas/progów/listy PU, nigdy `--no-verify`, bez tworzenia/archiwizacji sesji, bez zapisu na `koordynacja`, bez pytań do właściciela (bez AskUserQuestion); STOP-y roli i punkt czyszczenia → raport do koordynatora i czekasz. Poza `src/kompozycja/e2e/wzor-sklepu.ts` żadnych zmian `app/`, `src/`, `modules/`, `targets/` — jeśli potrzebne, STOP z dowodem. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez linii Co-Authored-By i Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`, przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 4eea5b1d..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message do koordynatora)
Po zadaniu 1: przyczyna z pomiarem (px → pt) i szacunek reszty. Końcowy: SHA, wariant i druga opcja, margines na iPhonie 6.9 i iPadzie 13 (z pikseli), test czerwony→zielony, Maestro i verify, wejścia przebiegu, decyzje P-, koszt.
