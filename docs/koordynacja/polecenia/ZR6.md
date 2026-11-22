# ZR6 — rola 10 fix: zrzuty sklepu w językach poza en/pl (2026-11-22)

Koordynator: session_01BM51oeh3mTopCKP51FjPPn (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 2 USD (STOP 2,6). Gałąź: `claude/zr6-jezyki-2026-11-22` od integracji `claude/youthful-pasteur-kx83sn` @ 6834c6d5. Decyzja: KO-191 (do weta). Pula P: P-1011…P-1012.

## Fakt (przebieg 45007913254, `zrzuty-sklepu.yml` dispatch: jezyki = 27 języków poza en/pl, urzadzenia=iphone, aplikacja_z_przebiegu=44697325331, og07=true)
Pierwszy przebieg zrzutów w językach bez własnego `e2e/zrzuty-sklepu/dane/<kod>.json` (dane `en` z ostrzeżeniem, `zrzuty-dane.mjs` kod 3). Zadania iphone 1–3 (cs,hr,nl,uk / da,hu,pt,vi / de,id,pt-BR,zh-Hant): **failure**. W zadaniu 2 (log job 137163601647) każdy język: 01, 05, 07 zrobione; dwukrotnie nieudane 02-licznik (`".*next: 3 knit, then cable.*", id: licznik-notatka is visible` false), 06-historia (brak `licznik-historia`), 03-wzor (brak `licznik-wzor`), 04-zakreslenie (`"^\D*1\D*$", id: wzor-zakreslenia` false). „Zrzuty: 16 plików; nieudane: 12”. Przebieg anulowany przez koordynatora (zadania 4–8 nie wystartowały). Dzienniki Maestro ze zrzutami ekranu: artefakty `zrzuty-dzienniki-iphone-{1,2,3}` przebiegu 45007913254 (3 dni; iphone-2 = ID 14751338136), surowe udane: `zrzuty-surowe-iphone-{1,2,3}` (7 dni). Dla en i pl te same sceny przechodzą (przebieg 44722734741).

## Zadanie
1. Diagnoza z dowodem (zrzut kroku, który padł, z dziennika; hierarchia UI): dlaczego 02/03/04/06 padają w językach bez własnych danych, a w en/pl nie. Hipotezy do sprawdzenia, nie do przyjęcia: notatka/projekt nie powstaje w `00-przygotuj` dla klucza `en` przy innym języku interfejsu; selektor tekstowy zależny od języka; wzór z panelu E2E (`e2e-wzor-sklep-<klucz>`) nie dociera; kolejność clearState przy zmianie języka.
2. Minimalna poprawka w scenach/skryptach zrzutów (`e2e/zrzuty-sklepu/`, `scripts/ci/`), tak żeby każdy z 27 języków dawał 7 scen. Kodu aplikacji (`app/`, `src/`) nie zmieniasz — jeśli przyczyna jest w aplikacji, STOP z raportem.
3. Test w `tests/wydanie/` odtwarzający przyczynę statycznie (czerwony przed poprawką), jeśli przyczyna da się sprawdzić bez symulatora; Maestro CLI na Linuksie: parsowanie scen (jak ZR4: `readCommands`), wynik w raporcie.
4. `npm run verify` z wynikiem do `docs/jakosc/zr6-verify.txt` (kod 0), push. Bez dispatchu — przebieg macOS uruchamia koordynator.

## Zakazy
Bez `app/`, `src/`, workflowów (chyba że przyczyna jest w workflowie — wtedy uzasadnij w P-1011), ASC, `main`, integracji, force-push, dispatchu, zmian klas/progów/listy PU; nigdy `--no-verify`; nie tworzysz ani nie archiwizujesz sesji; bez AskUserQuestion (STOP-y i pytania → raport do koordynatora). Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507); przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 6834c6d5..HEAD` pusty. GitHub tylko przez MCP. Kontekst: od 30% okna zapis stanu w `docs/wydanie/zr6-stan.md`, push, PRZEKAZANIE.

## Raport (≤ 10 linii, send_message)
Przyczyna z dowodem (plik dziennika, krok), SHA, pliki, test (czerwony/zielony), parsowanie Maestro, verify, ryzyka, koszt.
