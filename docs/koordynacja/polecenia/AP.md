# Sesja AP: recenzja niezależna AN+AO (018/019) i artefaktów C7 — Oczko
Koordynator: ID z `stan.md` („Koordynator aktywny”, teraz session_01T66VBwsVfpEaSobJZ4b8VQ) — raport, pytania i PRZEKAZANIE tylko przez send_message do niego. Gałąź stanu: `koordynacja` (tylko do odczytu).

1. Rola: 10-wydanie w trybie audit (prompt po `=== PROMPT ROLI ===`, praca od `=== KONIEC PROMPTU ROLI ===`; w pierwszym raporcie potwierdź linię KONIEC i ostatni nagłówek `##`). Biblioteki prompts nie dołączasz. Recenzja niezależna: raportów autorów (AN, AO) nie traktujesz jako dowodu.
2. Start: gałąź `claude/an-zrzuty-018-019-2026-11-11` @ 281852f (inny HEAD: zgłoś). `npm ci`. Bez commitów kodu; jeśli zapisujesz raport — `docs/wydanie/` na tej gałęzi, tożsamość według CLAUDE.md. **Push:** hak `pre-push` uruchamia pełne `npm run verify` (~10 min) — push w tle bez limitu czasu, nigdy --no-verify (WG-14).
3. Zadania:
   1. **Recenzja kodu 04652fb..281852f** (AN: 018 data paska, P3 asercje, kontrola pikseli P-745; AO: `modules/oczko-wzor/ios/WidokWzoru.swift` odświeżenie płótna z `rysunki[s]`, sceny `e2e/zrzuty-sklepu/04-zakreslenie.yaml` i 47, testy). Szczególnie: czy poprawka Swift nie gubi ani nie dubluje pociągnięć (szybkie pióro, cofnij/ponów, zmiana strony, zamknięcie nakładki), wątki/pętla, zapis danych użytkownika (zasada wspólna 10). Wynik: lista znalezisk P0–P3 z `plik:linia`.
   2. **Artefakty C7 `zrzuty-sklepu.yml` 43121089904** (success; uzupełnienie z 43090241469): pobierz `sklep-zrzuty-surowe` (i ramki), obejrzyj kadry 03 i 04 dla `{6.9,ipad-13}/{en,pl}` — kadr 04 ma dwa widoczne pasy zakreślenia; `04-po-swipe` (jeśli w artefaktach/dzienniku) — co pokazuje; wymiary/alfa; pasek stanu iPada (data/godzina). Sprawdź, że uzupełnienie nie wymieszało buildów w parze 03/04.
   3. **„Jakość · iOS” 43121094246** na 281852f: wynik (jeśli jeszcze trwa — sprawdź na końcu pracy; czerwony → diagnoza z końcówki logu, nie poprawka).
   4. **018 decyzja:** simctl odrzucił `+00:00` i `Z` (joby 130695677975, 130796899562, 130811471544). Oceń rekomendację AO (opcja b: sama godzina 09:41 jak `trening:scripts/ci/store-screenshots.sh:26`) wobec wytycznych Apple dla zrzutów (źródło przeczytane, data odczytu) i P-750.
   5. Werdykt: TAK/NIE dla scalenia gałęzi do integracji `claude/youthful-pasteur-kx83sn` oraz osobno: „019 naprawione” TAK/NIE, „018” — rekomendacja.
4. Zakazy: nie zmieniasz kodu ani workflowów, nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, bez AskUserQuestion, nigdy --no-verify ani force-push.
5. Decyzje: tryb analogia (najpierw `lkarwowski494/trening`, `repo:plik:linia`, wpis do weta). Pula: P-752…P-754 (tylko jeśli zapisujesz decyzję).
6. Od 30% okna PRZEKAZANIE. Pułap 6 USD, STOP 7,8 USD.
7. Raport ≤ 12 linii przez send_message: KONIEC potwierdzony, werdykty (zad. 5), znaleziska P0–P2 z `plik:linia`, wynik iOS, rekomendacja 018 ze źródłem, koszt.
