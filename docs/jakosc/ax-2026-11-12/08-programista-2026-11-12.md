# Audyt: Programista — Oczko — 2026-11-12 (sesja AX: recenzja niezależna AT)
Commit: 2f224a8 (zakres 3d9ca08..2f224a8, 5 commitów) · Tryb: audit (recenzja; raport commitowany na `claude/ax-recenzja-at-2026-11-12` według polecenia AX) · Środowisko: Linux 6.18, Node v22.23.4, `npm ci` kod 0; bez macOS/Xcode (Maestro, XCTest i zrzut z artefaktu nie do uruchomienia); log zadania CI pobrany przez GitHub MCP.

Prompt roli przeczytany do linii `=== KONIEC PROMPTU ROLI ===`; ostatni nagłówek `##` promptu: „Kontrola dowodów i sekretów przed oddaniem raportu”. Start: HEAD gałęzi = 2f224a8 = `origin/claude/at-jakosc-2026-11-12`; integracja `origin/claude/youthful-pasteur-kx83sn` = 3d9ca08 (baza zakresu, scalenie byłoby przewinięciem).

## Podsumowanie
Poprawka 07-jakosc-001 jest poprawna i minimalna: odrzucenie `licznik.miejsce()` daje nawigację do `/licznik` zamiast ciszy, bez zmiany wyglądu. Test nowy jest czerwony na 3d9ca08 z właściwego powodu (asercja `Expected: false, Received: true`, kod 1) i zielony na 2f224a8 (kod 0). Scen. 70 dostał przewinięcie do Back w górę, zgodne z wzorcem scen. 08; `tabela-08.md` to czysta regeneracja (diff z generatorem pusty). Diagnoza 07-jakosc-003 ma potwierdzone w logu tezy 1 i 3, ale kluczowe wnioski (wadliwy harness W1, „wolniejszy” zamiast „zawieszony do limitu”, realność brzegowa) są wnioskowaniem, a decyzja P-761 podaje je jak ustalenia. Pełna bramka na 2f224a8 zielona (Jest 7296/7296). Brak P0 i P1; werdykt scalenia AT do integracji: **TAK**.

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P2 | D | Test 07-jakosc-001 nie sprawdza celu nawigacji: przejdzie też przy złej trasie albo `Alert` spoza projektu | otwarte |
| 08-programista-002 | P2 | D | P-761 i diagnoza 003 podają wnioskowanie jako ustalenie (harness W1, „wolniejszy”, realność brzegowa) | otwarte |
| 08-programista-003 | P2 | D | Mechanizm 07-jakosc-001 (await w obsłudze stuknięcia bez obsługi odrzucenia) zamknięty tylko w 2 miejscach z ≥ 3 | otwarte |
| 08-programista-004 | P2 | D | P-759 i commit 4206e800 deklarują „czerwony 3/3”, a plik ma 2 testy; czerwień nie istnieje w historii (test i kod w jednym commicie) | otwarte |

## Linia bazowa i założenia
Obszar recenzji = diff 3d9ca08..2f224a8 (6 plików, `dowody/diff-grep.txt`), nie cała aplikacja. Linia bazowa od zera dla tego diffu: najlepsza w klasie obsługa stuknięcia z asynchronicznym odczytem przed nawigacją (a) nie zostawia przycisku głuchym przy wyjątku ani przy błędzie wyniku, (b) ma test, który pada przy ciszy i przy złym celu, (c) ten sam wzorzec jest zamknięty we wszystkich obsługach zdarzeń (react.dev: granice błędów nie łapią obsługi zdarzeń, wzorzec „Granice błędów w React” promptu roli).

Wymiary pokrycia:
- Ścieżki zapisu: diff nie dodaje ani nie zmienia zapisu (sprawdzone, brak).
- Obsługa błędów: `app/(zakladki)/index.tsx:62` zamienia wyjątek na `{ ok: false, powod: 'zapis' }`; dalsze gałęzie traktują go jak istniejący błąd wyniku (domyślnie `/licznik`). Wzorzec poza diffem: 08-programista-003.
- Typy na granicach: diff nie czyta danych z zewnątrz; typ zwrotny `ReturnType<typeof licznik.miejsce>` zgodny (`npm run typecheck` kod 0).
- System projektowy: diff bez kolorów, krojów i komponentów (`dowody/diff-grep.txt`: brak trafień hex/rgb/fontSize/fontFamily) — sprawdzone, brak.
- i18n: brak nowych tekstów — sprawdzone, brak.
- Wydajność: brak zmian list i renderu — sprawdzone, brak.
- Testy na właściwym poziomie: test RNTL trasy z prawdziwym SQLite (`kompozycjaTestowa`) i podmienionym `miejsce`; słabość asercji: 08-programista-001.
- Dostępność: brak zmian komponentów — sprawdzone, brak.
- Liczby konfiguracyjne: brak nowych progów w kodzie aplikacji; próg 30 000 ms w scen. 70:44 jak w pozostałych scenariuszach — sprawdzone, brak.

Soczewki: recenzent szukający ścieżki bez testu (→ 001, 003); programista czytający moduł pierwszy raz (komentarz `app/(zakladki)/index.tsx:61` wyjaśnia powód — ok); użytkownik, któremu odczyt przerwano (fallback `/licznik` — ok; wiszący odczyt bez progu świadomie poza zakresem, P-759). Soczewka VoiceOver: brak zmian UI.

Rejestr założeń: bez propozycji zmian statusu (diff nie dotyka założeń produktu).

## Pokrycie (co sprawdzono, czego nie)
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| `app/(zakladki)/index.tsx` (diff + kontekst 1–110) | tak | odczyt; typecheck `dowody/npm_run_typecheck.txt` |
| `tests/ekrany/dzis-kontynuuj-blad-miejsca.test.tsx` na 3d9ca08 i 2f224a8 | tak | `dowody/test-3d9ca08.txt`, `dowody/test-2f224a8.txt` |
| scen. 70 (diff), scen. 69:47, `Przewodnik.tsx`, `Licznik.tsx` | tak (kod) / nie (Maestro, brak macOS) | odczyt |
| `docs/jakosc/e4/tabela-08.md` vs generator | tak | `dowody/tabela-08.txt` |
| diagnoza-003: log 130930898047 | tak (tezy 1, 3) | `dowody/job-130930898047-scen25.txt`; `docs/jakosc/ar-2026-11-12/dowody/a-w1-eksperymenty.txt`, `docs/jakosc/ar-2026-11-12/dowody/d-diff.txt` |
| diagnoza-003: zrzut `step-033` z artefaktu 13914233176 | nie (artefakt binarny, brak narzędzia do pobrania artefaktu) | — |
| `modules/oczko-wzor/ios/KonwersjaNaPdf.swift`, `EksperymentyTests.swift` | tak (odczyt; bez kompilacji Swift) | odczyt |
| Pełna bramka `verify` na 2f224a8 (typecheck, typecheck:testy, lint, kontrole, Jest) | tak | `dowody/npm_run_typecheck.txt`, `dowody/npm_run_typecheck_testy.txt`, `dowody/npm_run_lint.txt`, `dowody/npm_run_jakosc_kontrole.txt`, `dowody/npx_jest_--ci.txt` |
| Stan CI na `main` | nie (poza zakresem polecenia AX; workflowów nie wyzwalam) | — |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/jakosc/ax-2026-11-12/08-programista-2026-11-12.md . --rola 08-programista` (kopia skryptu w scratchpadzie):

```
OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista
kod wyjścia: 0
```
Sekrety: brak wzorców w diffie AT (`dowody/diff-grep.txt`) i w tym raporcie.

## Stosowalność listy kontrolnej
| Pozycja | Status (dotyczy / nie dotyczy + powód / decyzja D-xx) | Wynik (ok / znalezisko ID / nie sprawdzono + powód) |
|---|---|---|
| DEV-01 | dotyczy (decyzja nawigacji po wyniku `miejsce`) | ok: test RNTL obu gałęzi wyjątku; cel nawigacji nieasercjonowany → 08-programista-001 |
| DEV-02 | dotyczy | 1/1 commit zmieniający zachowanie aplikacji (4206e800) ma test w tym samym commicie; czerwień odtworzona przeze mnie, w historii jej brak → 08-programista-004 |
| DEV-03 | dotyczy | ok: brak `.skip`/`.only`/`expect(true)` w diffie (`dowody/diff-grep.txt`) |
| DEV-04 | dotyczy | typecheck 0, typecheck:testy 0, lint 0, kontrole 0, Jest `--ci` 601/601 zestawów, 7296/7296 testów, kod 0 (`dowody/`); uwaga: commit pośredni 4206e800 nie przechodził typecheck:testy (naprawione 2f224a8) |
| DEV-05 | nie dotyczy: diff bez zapisu danych | — |
| DEV-06 | nie dotyczy: diff bez migracji i kopii | — |
| DEV-07 | dotyczy (`catch` zwraca syntetyczny błąd) | ok: wartość to błąd wyniku, nie zgadnięta dana użytkownika |
| DEV-08 | nie dotyczy: brak dat w diffie | — |
| DEV-09 | nie dotyczy: brak danych z zewnątrz w diffie | — |
| DEV-10 | dotyczy | ok w diffie; ten sam wzorzec poza diffem → 08-programista-003 |
| DEV-11 | dotyczy | ok: brak wartości wyglądu w diffie |
| DEV-12 | dotyczy (projekt ma i18n) | ok: brak nowych tekstów |
| DEV-13 | dotyczy (progi czasu w scenariuszach) | ok: 30000 ms jak w pozostałych `scrollUntilVisible` |
| DEV-14 | dotyczy | ok: brak wzorców sekretów w diffie (`dowody/diff-grep.txt`) |
| DEV-15 | nie dotyczy: brak nasłuchów i timerów w diffie aplikacji | — |
| DEV-16 | nie dotyczy: brak wielkości z jednostką w kodzie aplikacji | — |

## Znaleziska (szczegóły)

### 08-programista-001 · Test 07-jakosc-001 nie sprawdza celu nawigacji
- Pozycja listy kontrolnej: DEV-01
- Poziom: P2
- Realność: realny (dla siły testu) · Pewność: wysoka
- Rodzaj: D
- Dowód: `tests/ekrany/dzis-kontynuuj-blad-miejsca.test.tsx:43` — `cisza()` jest fałszem przy dowolnym `push`, `navigate` albo `Alert.alert`; asercje `:54` i `:61` sprawdzają tylko `cisza()`. Komentarz `:2` zapowiada "oczekiwana nawigacja do `/licznik` albo widoczny komunikat". Poprawka z `router.navigate('/projekty')` albo `Alert.alert` z tekstem spoza `docs/design/` przeszłaby test.
- Mechanizm: jedna funkcja pomocnicza w jednym pliku; `grep -n "cisza()" tests/ekrany/dzis-kontynuuj-blad-miejsca.test.tsx` → 2 asercje.
- Powraca: nie
- Wzorzec lub źródło: prompt roli, „Dobry test” (wynik mówi: oczekiwano X, jest Y).
- Kroki w aplikacji: brak (siła testu).
- Opcje: (a) asercja `expect(mockRouter.push).toHaveBeenCalledWith('/licznik')` w obu testach (+ `{ pathname: '/wzor', params: { zrodla: '1' } }` w „Dodaj wzór”) — dokładne, wiąże test z obecnym zachowaniem; (b) zostawić "nie cisza" — luźne, zgodne z opcją A raportu 07. Rekomendacja: (a), rola 07 albo 08 fix.
- Test akceptacyjny: zmiana `app/(zakladki)/index.tsx:62` na fallback do `/projekty` czerwieni test.
- Status: otwarte

### 08-programista-002 · P-761 i diagnoza 003 podają wnioskowanie jako ustalenie
- Pozycja listy kontrolnej: DEV-04
- Poziom: P2
- Realność: realny (ryzyko złej decyzji o kwarantannie W1) · Pewność: wysoka
- Rodzaj: D
- Dowód: tezy diagnozy sprawdzone u źródła:
  - Teza 1 (`docs/jakosc/at-2026-11-12/diagnoza-003.md:9`) **potwierdzona**: log 130930898047 — tap `e2e-wzor-word`, potem `FAILED … wzor-widok … "timeout": "30000"` (`dowody/job-130930898047-scen25.txt`).
  - Teza 3 (`docs/jakosc/at-2026-11-12/diagnoza-003.md:11`) **potwierdzona**: 25 zielony/czerwony i 53 odwrotnie (`docs/jakosc/ar-2026-11-12/dowody/c-porownanie-i-scen47.txt`), diff bez `app/ src/ modules/` (`docs/jakosc/ar-2026-11-12/dowody/d-diff.txt`). Na tym samym przebiegu 53 zrobił trzy rendery Worda w 3m 20s, więc render poniżej 30 s jest typowy.
  - Teza 2 (`docs/jakosc/at-2026-11-12/diagnoza-003.md:10`, "Adding the pattern…", brak `wzor.blad_czas`) **niesprawdzona przeze mnie**: zrzutu z artefaktu nie otworzyłem; plik nie jest w repo.
  - Teza 4 (`docs/jakosc/at-2026-11-12/diagnoza-003.md:12`) **wnioskowanie**: 61,4 s pokazuje tylko, że wynik przyszedł z zegara (`modules/oczko-wzor/ios/KonwersjaNaPdf.swift:10`, mapowanie `powodPrzekroczeniaCzasu`). Że "delegat nie dostaje żadnego wywołania", nie zmierzono (brak logu delegata); założenie "`.invalid` daje błąd w ułamku sekundy" bez źródła i bez pomiaru na runnerze. Dodatkowo test nie leży w "pakiecie SwiftPM" `Pakiet/`, tylko w `modules/oczko-wzor/TestyOknaMaszyn/`.
  - Wniosek "bywa wolniejszy niż 30 s" (`docs/jakosc/at-2026-11-12/diagnoza-003.md:6`): obserwacja w 30. sekundzie nie odróżnia renderu wolnego od zawieszonego do limitu 60 s (ten sam objaw co W1). Realność "brzegowy" (`docs/jakosc/at-2026-11-12/diagnoza-003.md:17`) opiera się na hipotezie oznaczonej tam jako niezmierzona.
  - `docs/decyzje.md:712` (P-761) zapisuje "= wadliwy harness" bez znacznika hipotezy.
- Mechanizm: jedna decyzja i jeden dokument; `grep -n "wadliwy harness" docs/decyzje.md docs/jakosc/at-2026-11-12/diagnoza-003.md` → 2 trafienia.
- Powraca: nie
- Wzorzec lub źródło: zasada wspólna 3 (nie zgaduj; `[DO USTALENIA]`).
- Kroki w aplikacji: Word w aplikacji: jeśli render wisi do limitu, użytkowniczka czeka 60 s na komunikat `wzor.blad_czas` (bez utraty danych).
- Opcje: (a) dopisać do P-761 "hipoteza, niezmierzona" przy harnessie i realności; opcja A diagnozy (70 s) zostaje, bo i tak rozróżni "wolny" od "zawieszony" (po 60 s pojawi się komunikat błędu, nie widok); (b) przed decyzją o W1 dodać pomiar czasu renderu (opcja B diagnozy). Rekomendacja: (a) teraz, (b) przed zdjęciem W1 z kwarantanny.
- Test akceptacyjny: P-761 rozróżnia tezy potwierdzone (1, 3) od hipotez (2 niesprawdzona w repo, 4, realność).
- Status: otwarte

### 08-programista-003 · Mechanizm 07-jakosc-001 zamknięty tylko w 2 miejscach
- Pozycja listy kontrolnej: DEV-10
- Poziom: P2
- Realność: brzegowy (odrzucenie odczytu po starcie danych nie zostało zaobserwowane) · Pewność: wysoka co do kodu
- Rodzaj: D
- Dowód: `app/przewodnik.tsx:35` — `await licznik.widok()` w obsłudze "Pokaż" wołanej przez `void naPokaz(c)` (`app/przewodnik.tsx:48`), bez `catch`: odrzucenie = brak nawigacji i komunikatu, tak jak przed AT na Dziś. `app/licznik.tsx:47-48` — nieudany `nastepnaCzesc` kończy obsługę stuknięcia `return` bez komunikatu.
- Mechanizm: obsługa zdarzenia `void f()` z `await` przed nawigacją bez obsługi błędu; raport 07 ograniczył grep do `await licznik.miejsce` (2 trafienia); `grep -rn "=> void [a-zA-Z]*(\|void na[A-Z][a-zA-Z]*(" app/` → 20 obsług do przejrzenia, potwierdzone 2 nowe trafienia jak wyżej, reszty nie czytałem.
- Powraca: tak (ten sam wzorzec co 07-jakosc-001) → trwała kontrola: test RNTL albo reguła lint `no-floating-promises` w `app/`.
- Wzorzec lub źródło: react.dev/reference/react/Component (granice błędów nie łapią obsługi zdarzeń), cytat w prompcie roli.
- Kroki w aplikacji: Ustawienia → Przewodnik → "Pokaż" przy funkcji; przy odrzuceniu `widok()` nic się nie dzieje.
- Opcje: (a) wspólny pomocnik "odczyt albo błąd" dla obsług zdarzeń w `app/` + test na dwa nowe miejsca; (b) tylko lint `@typescript-eslint/no-floating-promises` dla `app/` (wykryje brak obsługi, nie poprawi); (c) zostawić, bo brzegowe. Rekomendacja: (a) w osobnym zadaniu po scaleniu AT, nie blokuje scalenia.
- Test akceptacyjny: odrzucenie `licznik.widok()` po "Pokaż" daje nawigację albo komunikat.
- Status: otwarte

### 08-programista-004 · „Czerwony 3/3” w P-759 nie zgadza się z plikiem testu
- Pozycja listy kontrolnej: DEV-02
- Poziom: P2
- Realność: realny (dokumentacja dowodu) · Pewność: wysoka
- Rodzaj: D
- Dowód: `docs/decyzje.md:710` i opis commitu 4206e800 mówią "czerwony 3/3", plik testu ma 2 testy (`grep -c "^test("` = 2 w 4206e800 i 2f224a8). Test i poprawka weszły w jednym commicie, więc czerwieni nie da się odtworzyć z historii samym `git checkout`; odtworzyłem ją w worktree 3d9ca08 z testem z 2f224a8: 2 failed, kod 1, powód asercja (`dowody/test-3d9ca08.txt`). Commit 4206e800 sam nie przechodził `typecheck:testy` (naprawa w 2f224a8).
- Mechanizm: jeden zapis; `grep -n "3/3" docs/decyzje.md` → 1 trafienie w P-759.
- Powraca: nie
- Wzorzec lub źródło: zasada wspólna 2 (dowód zamiast deklaracji).
- Kroki w aplikacji: brak.
- Opcje: (a) poprawić P-759 na "2/2" i odesłać do tego raportu jako dowodu czerwieni; (b) zostawić. Rekomendacja: (a).
- Test akceptacyjny: liczba w P-759 = liczba testów w pliku.
- Status: otwarte

## Do sprawdzenia (pewność ≤ 80%)
- Scen. 70 na iOS: `scrollUntilVisible nav-wstecz` w górę jest zgodny z budową ekranu (`src/ekrany/Przewodnik.tsx:74-75`: Back pierwszym dzieckiem ScrollView) i z wzorcem scen. 08:97; pełny wynik tylko z przebiegu macOS. Teza P-760 o scen. 69:47 potwierdzona w kodzie: Back licznika `src/ekrany/Licznik.tsx:136` leży przed ScrollView `src/ekrany/Licznik.tsx:153`.
- Pozostałe 18 obsług `void f()` w `app/` (08-programista-003): nie czytałem; brak pełnego przeglądu.
- Fallback `/licznik` przy odrzuceniu, gdy brak bieżącego licznika i są projekty (`miejsceAlboBlad` w "Kontynuuj ›"): ta sama gałąź co istniejący błąd wyniku `m.ok` fałsz sprzed AT; zachowanie trasy `/licznik` bez bieżącego licznika nie sprawdzone.
- Niestabilność 01 w CI: poprawka nie rozstrzyga H1/H2 (P-759 mówi to wprost); test wymusza odrzucenie podmianą `k.miejsce`, nie dowodzi, że odrzucenie zachodzi w aplikacji.

## Co działa dobrze i należy zachować
- Poprawka w jednym wspólnym miejscu (`app/(zakladki)/index.tsx:62`) dla obu wywołań, bez zmiany wyglądu i bez nowych tekstów; komentarz z ID znaleziska.
- Test na prawdziwej kompozycji z SQLite (`kompozycjaTestowa`), czerwony z właściwego powodu na bazie.
- `tabela-08.md` z generatora (`--check` kod 0, diff z regeneracją pusty).
- P-759 i P-760 jawnie nazywają, czego nie rozstrzygnięto (H1 otwarta, wynik iOS).

## Decyzje dla właściciela
Brak decyzji właściciela (recenzja; decyzje koordynatora, P-087):
1. Scalenie AT (2f224a8) do `claude/youthful-pasteur-kx83sn`: rekomendacja TAK (przewinięcie, 0×P0/P1); alternatywa: wstrzymać do poprawki 001 i 004 — koszt: drugi cykl fix bez wpływu na użytkownika.
2. P-761: dopisać znaczniki hipotez (08-programista-002) przed decyzją o W1.
3. 08-programista-003: osobne zadanie (opcja a albo b).

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-001,08-programista-003,08-programista-004` (002: korekta zapisu P-761 przez koordynatora albo sesję AT).
