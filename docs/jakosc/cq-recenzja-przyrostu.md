# Audyt: Programista — Oczko — 2026-11-17 (recenzja niezależna przyrostu 4d2a455..ba16744, build 9 wariant A)
Commit: ba16744c59bfdf668c74084e4720e2ecbae2090a · Tryb: audit (sesja CQ) · Środowisko: Linux w chmurze, Node + Jest, bez Xcode, bez symulatora, bez CI macOS; scenariuszy Maestro nie uruchamiałem (tylko analiza YAML i planu części); pełny `npm run verify` poza hakiem pushu nie uruchamiany (zakaz sesji)

## Podsumowanie
**Werdykt: Z UWAGAMI — build 9 można wysłać do CI i właściciela.** Nie znalazłem P0 ani P1. Straż „+1” (`numerPlusa`/`zatwierdzonyPlus`) nie gubi zatwierdzonego „+1” w szybkiej serii, przy odwrotnej kolejności zakończeń ani gdy nowszy zapis zawiedzie; testy CP-02/CP-03/CP-04 padają na zmutowanym kodzie. Zmiany CI zgadzają się z kodem (53 → 50 ponawialnych, 62 bez ponowień) i żadna asercja bramkowa nie została osłabiona. Bramka PU: kontrola 2 i 3 zielone na ba16744. Zostają dwie luki testowe w obszarze „+1” (08-programista-001, -002; brzegowe, w tym jedna odziedziczona) i dwie drobne nieścisłości dokumentacji i testów (003, 004). Odstępstwo od reguł sesji: przy `grep P-962` w `docs/decyzje.md` zobaczyłem ok. 300 znaków wpisu P-975 (raport autora) przed własną oceną — ocena nie opiera się na nim (zob. „Linia bazowa”).

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P2 | D | CQ-01 · żaden test nie sprawdza unieważnienia odświeżenia po „+1” (`wydanie.current += 1` w `naPlus`) | otwarte |
| 08-programista-002 | P2 | D | CQ-02 · „−1” nie ma straży kolejności jak „+1”; przeplot +1/−1 niepokryty testem (odziedziczone) | otwarte |
| 08-programista-003 | P3 | D | CQ-03 · odnośniki w kolumnie Pokrycie wskazują przesunięte linie testów PU-291 i PU-011; nowe testy BX28 bez odnośnika | otwarte |
| 08-programista-004 | P3 | D | CQ-04 · nowy test PU-066 (przeniesienie) jest redundantny względem istniejącego testu S3 | otwarte |

## Linia bazowa i założenia
- Zakres: `git log 4d2a455..ba16744` — 16 commitów, 20 plików, +430/−23 (`git diff --stat`). 4d2a455 = build 8 (tag v1.0.0-b1201). Gałąź startowa `claude/bx25-2026-11-17` @ ba16744 tylko do odczytu; wynik na `claude/cq-recenzja-2026-11-17`.
- Metoda: czytanie kodu + mutacje na kopii (git worktree w scratchpadzie, detached, bez commitów, po każdej mutacji plik przywrócony; `git status` czysty) + obliczenie planu części skryptem z trzech wersji repo.
- Soczewki: wyścigi (kolejność asynchronicznych zapisów), osłabienie testów i asercji, zgodność liczb CI z kodem, tożsamość commitów.
- Kolejność czytania: własna ocena przed lekturą BX25–BX28 w `docs/jakosc/bx-stan.md` i P-973…P-979 w `docs/decyzje.md`. **Odstępstwo:** `grep "P-962"` w `docs/decyzje.md` wyświetlił skrót (ok. 300 znaków) wpisu P-975 (opis KO-147 i polityki ponowień) przed zakończeniem zadania 2. Skutek: znałem deklarowaną politykę ponowień; liczby 62/50 i działanie `maWlasnaAsercjeWartosci` sprawdziłem jednak niezależnie, wykonując plan części na trzech wersjach skryptu (4d2a455, 4f3374f, ba16744) i testy mutacyjne. Wnioski porównania z raportami autorów po własnej ocenie: nie odnotowuję rozbieżności; nie czytałem pełnych sekcji BX25–BX28.
- Zmiany statusu w rejestrze założeń: brak propozycji.

## Pokrycie (co sprawdzono, czego nie)
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| Straż „+1” w `src/ekrany/Aplikacja.tsx:63-112` | tak | czytanie kodu; mutacje M1–M5 na kopii (poniżej) |
| `onPress` „+1” w `src/ekrany/Dzis.tsx:124` | tak | czytanie; M6/M7 (testy CP-03/CP-04) |
| Kolejka zapisów w `src/kompozycja/licznik.ts:84-86` i `src/kompozycja/licznik.ts:145-160` | tak (odczyt) | `plusWToku` szereguje zapisy; podwójne `zalozRoboczy` przy dwóch pierwszych „+1” bez `licznikId` — zob. sekcja Do sprawdzenia |
| Plan części i ponowień: `scripts/ci/e2e-czesci.mjs:58-103`, `tests/jakosc/maestro-runner.ts`, `tests/jakosc/e2e-czesci.test.ts` | tak | wykonanie planu na 3 wersjach skryptu + mutacje M8–M10 |
| `.github/workflows/jakosc-ios.yml` | tak | `git diff 4d2a455..ba16744`: zmiany tylko w komentarzach (linie 7, 366); listy `PONAWIALNE` i `BRAMKA` bez zmian |
| Scenariusz 90 i podprzepływ `projekt-roboczy.yaml` | tak (analiza YAML) | dodane `scrollUntilVisible nav-wstecz`, `swipe`, `assertVisible nav-wstecz`; usunięte asercje: brak; nie uruchamiałem Maestro |
| Bramka PU: `scripts/jakosc/bramka-przypadki-uzycia.mjs:334-354`, `docs/jakosc/test-fizyczny/1201.md`, `tests/jakosc/bramka-przypadki-uzycia.test.ts:184` | tak | uruchomienie kontroli 2 i 3 po `git fetch --tags origin` — obie zielone |
| Testy BX28: `tests/ekrany/pu-wzor-przelacz-290.test.tsx`, `tests/dane/pu-291-pusta-nazwa-wzoru.test.ts`, `tests/ekrany/wzor-trasa-znacznik.test.tsx` | tak | mutacje M11–M15c; podsumowanie w „Co działa dobrze” (szczegółowe wyniki z konsoli ze względu na kompakcję kontekstu: zob. „Do sprawdzenia”) |
| Tożsamość commitów | tak | `git log --format='%h %an <%ae> | %cn <%ce>' 4d2a455..ba16744`: 16/16 „Łukasz Karwowski <…noreply…>” (autor i committer), 0 trailerów `Co-Authored-By`/`Claude-Session` |
| Katalog `docs/jakosc/przypadki-uzycia.md` | tak | `git diff --stat 4d2a455..ba16744 -- docs/jakosc/przypadki-uzycia.md` → pusty: zero zmian (klasy, opisy, lista, Pokrycie) — zasada 22 spełniona |
| Stan CI na `main` i historia przebiegów workflow | nie | poza zakresem i zakazem wyzwalania workflowów |
| Cytat właściciela w protokole `docs/jakosc/test-fizyczny/1201.md` (słowa 61 PU „pominięte”) | nie | nie mam jak zweryfikować wypowiedzi właściciela; sprawdziłem tylko, że `kontrolaProtokolu` przepuszcza protokół i wymaga min. 8 liter/cyfr uzasadnienia |
| Scenariusze Maestro, zachowanie na urządzeniu | nie | brak Xcode i symulatora w środowisku |

## Kontrola dowodów i sekretów
Wynik `node sprawdz-raport.mjs docs/jakosc/cq-recenzja-przyrostu.md /home/user/oczko --rola 08-programista` — wklejony niżej po ostatnim przebiegu (kod wyjścia 0):

```
OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista
```

Dodatkowo, poza skryptem: `git diff 4d2a455..ba16744` przeszukany wzorcami sekretów (AKIA…, ghp_…, github_pat_, sk-…, AIza…, PRIVATE KEY) — 0 trafień; w dodanych liniach `tests/` i `src/` brak `.skip(`, `.only(`, `xit(`, `xdescribe(`, `it.todo(`, `expect(true)`.

## Stosowalność listy kontrolnej
| Pozycja | Status (dotyczy / nie dotyczy + powód / decyzja D-xx) | Wynik (ok / znalezisko ID / nie sprawdzono + powód) |
|---|---|---|
| DEV-01 | dotyczy (straż kolejności „+1” to logika zdarzeń, nie reguła domeny) | ok — test CP-02 pokrywa kolejność zakończeń; reguły BRD poza przyrostem |
| DEV-02 | dotyczy | ok — straż „+1” ma test w tym samym przyroście (`tests/ekrany/licznik-plus-kolejnosc-cp02.test.tsx`); luka 08-programista-001 dotyczy jednej gałęzi |
| DEV-03 | dotyczy | ok — w dodanych liniach brak `.skip/.only/todo/expect(true)`; asercje scen. 90 tylko dodane; testy BX28 zabijają mutacje |
| DEV-04 | dotyczy | częściowo — uruchamiałem tylko testy celowane (na zmutowanych kopiach; ich zielony stan na niezmienionym kodzie wynika z przywracania pliku po każdej mutacji); pełny `verify` zostawiony hakowi pushu; typecheck i lint osobno: nie sprawdzono |
| DEV-05 | nie dotyczy | przyrost nie dodaje ścieżek zapisu SQL poza `UPDATE wzor SET nazwa` w `src/przypadki-uzycia/wzor.ts:184-193` (UPDATE w transakcji, bez REPLACE) |
| DEV-06 | nie dotyczy | brak zmian schematu ani migracji w przyroście |
| DEV-07 | dotyczy | ok — pusta nazwa wzoru daje `bledne_dane`, nie domyślny napis (`src/przypadki-uzycia/wzor.ts:186`) |
| DEV-08 | nie dotyczy | przyrost nie dotyka dat |
| DEV-09 | nie sprawdzono | poza zakresem (zmiany nie parsują danych zewnętrznych) |
| DEV-10 | dotyczy | ok — nieudany nowszy „+1” nie wygląda na udany (test CP-02 „nowszy nieudany”) |
| DEV-11 | nie dotyczy | brak zmian wyglądu |
| DEV-12 | nie sprawdzono | przyrost nie dodaje tekstów dla użytkownika (poza zakresem) |
| DEV-13 | nie sprawdzono | poza zakresem |
| DEV-14 | dotyczy | ok — 0 trafień wzorców sekretów w różnicy zakresu |
| DEV-15 | nie sprawdzono | brak nowych nasłuchów w różnicy; nie weryfikowałem szczegółowo |
| DEV-16 | nie dotyczy | brak nowych wartości z jednostką w przyroście |

## Znaleziska (szczegóły)

### 08-programista-001 · CQ-01 · Nikt nie zauważy, gdyby „+1” przestał unieważniać odświeżenie w toku
- Pozycja listy kontrolnej: DEV-02 (testy zmiany zachowania)
- Poziom: P2
- Realność: brzegowy · Pewność: średnia
- Rodzaj: D (defekt testów, nie kodu)
- Dowód: `src/ekrany/Aplikacja.tsx:91` — `wydanie.current += 1;` w gałęzi zatwierdzonego „+1”; mutacja M5 (usunięcie tej linii na kopii) → testy CP-02, CP-03 i CP-04 pozostały zielone.
- Mechanizm: licznik `wydanie` (linie 74-77) odrzuca wynik odświeżenia, jeśli w międzyczasie zaszło działanie użytkownika. Dla „+1” zapewnia to linia 91; żaden test nie sprawdza, że odświeżenie rozpoczęte PRZED „+1” a kończące się PO nim nie nadpisze nowszego stanu starym. `grep -n "wydanie.current" src/ekrany/Aplikacja.tsx` → 74, 77, 91, 104.
- Powraca: nie
- Wzorzec lub źródło: zasada „test zabija mutację” z recenzji BX2 (`docs/jakosc/bx-recenzja.md`)
- Kroki w aplikacji: użytkownik stuka „+1” w chwili, gdy kończy się odświeżenie ekranu (powrót z innej karty); gdyby gałąź zniknęła, licznik mógłby na chwilę (do następnego odświeżenia) pokazać starą wartość.
- Opcje: (A) dopisać test: odświeżenie w toku → „+1” zatwierdzone → odświeżenie kończy się starym wynikiem → stan po „+1” zostaje — koszt: jeden test w pliku CP-02; (B) zostawić — kompromis: gałąź ma dziś pokrycie tylko przez czytanie kodu. Rekomendacja: A (jedno zdanie poprawki: dodaj do `tests/ekrany/licznik-plus-kolejnosc-cp02.test.tsx` test z opóźnionym `odswiez` kończącym się po zatwierdzonym „+1”).
- Test akceptacyjny: mutacja M5 (usunięcie `wydanie.current += 1` w `naPlus`) czerwona.
- Status: otwarte

### 08-programista-002 · CQ-02 · „−1” nie ma straży kolejności, a przeplot „+1”/„−1” nie ma testu
- Pozycja listy kontrolnej: DEV-02
- Poziom: P2
- Realność: brzegowy · Pewność: średnia
- Rodzaj: D (odziedziczone, nie z przyrostu; przyrost go nie pogarsza)
- Dowód: `src/ekrany/Aplikacja.tsx:99-104` — `naMinus` zwiększa `wydanie.current`, ale nie ma odpowiednika `numerPlusa`/`zatwierdzonyPlus`; `grep -n "naMinus" tests -r` — brak testu przeplotu z „+1” w testach CP-02.
- Mechanizm: zapisy są szeregowane w kolejce (`plusWToku`, `src/kompozycja/licznik.ts:84-86`), więc kolejność zapisu jest stała; ryzyko dotyczy kolejności zastosowania wyników w stanie ekranu, gdy „+1” i „−1” kończą się w odwrotnej kolejności niż zostały wydane. Nie odtworzyłem tego w teście — ocena z czytania kodu (pewność średnia).
- Powraca: nie
- Wzorzec lub źródło: ten sam mechanizm co w 001 (straż wyścigu CP-02)
- Kroki w aplikacji: bardzo szybkie „+1” i zaraz „−1” przy wolnym zapisie.
- Opcje: (A) test przeplotu +1/−1 w CP-02, a gdyby padł — straż także dla „−1” — koszt: test + ewentualna zmiana kodu; (B) zostawić do obserwacji z TestFlight — kompromis: ryzyko brzegowe, odziedziczone z poprzednich buildów bez zgłoszeń. Rekomendacja: A jako osobne zadanie po buildzie 9, nie blokuje buildu (jedno zdanie: napisać test przeplotu +1/−1 i dopiero wtedy zdecydować o straży dla „−1”).
- Test akceptacyjny: test przeplotu +1/−1 zielony na kodzie z poprawką i czerwony bez niej.
- Status: otwarte

### 08-programista-003 · CQ-03 · Odnośniki w katalogu wskazują przesunięte linie testów
- Pozycja listy kontrolnej: DEV-02 (powiązanie PU ↔ test)
- Poziom: P3
- Realność: realny (dokumentacja), skutek mały · Pewność: wysoka
- Rodzaj: D
- Dowód: `docs/jakosc/przypadki-uzycia.md:140` wskazuje `tests/ekrany/pu-wzor-przelacz-290.test.tsx:85` dla PU-291, a na linii 85 stoi teraz test PU-290 (stan); test PU-291 jest od linii 109 (`tests/ekrany/pu-wzor-przelacz-290.test.tsx:109`). `docs/jakosc/przypadki-uzycia.md:34` wskazuje linię 125 dla PU-011, a test PU-011 jest od linii 132 (`tests/ekrany/pu-wzor-przelacz-290.test.tsx:132`). Przed przyrostem (4d2a455) testy PU-291 i PU-011 stały odpowiednio na 85 i 108 — nowy test wstawiony na 85 przesunął resztę; katalog w zakresie bez zmian (zasada 22 zachowana).
- Mechanizm: kontrola 2 bramki dopuszcza odległość odnośnika od wzmianki o PU do 40 linii (`scripts/jakosc/bramka-przypadki-uzycia.mjs:172`), więc dryf nie czerwieni bramki. Kolumna Pokrycie nie wymienia też `tests/dane/pu-291-pusta-nazwa-wzoru.test.ts` (PU-291, pusta nazwa) ani nowych testów w `tests/ekrany/wzor-trasa-znacznik.test.tsx:191` (PU-066).
- Powraca: nie
- Wzorzec lub źródło: zasada 22 (tylko kolumna Pokrycie wolno zmieniać, bez zmiany klas i opisów)
- Kroki w aplikacji: nie dotyczy (dokumentacja)
- Opcje: (A) poprawić numery w kolumnie Pokrycie przy najbliższej zmianie katalogu (dopuszczalne wg zasady 22) — koszt: kilka numerów; (B) zostawić do następnego przebiegu roli 07. Rekomendacja: A, razem ze zmianą katalogu następnego buildu.
- Test akceptacyjny: odnośniki PU-011, PU-290, PU-291 wskazują linie z `test(` o właściwym PU.
- Status: otwarte

### 08-programista-004 · CQ-04 · Nowy test PU-066 (przeniesienie) powtarza istniejące pokrycie
- Pozycja listy kontrolnej: DEV-03 (jakość testów)
- Poziom: P3
- Realność: teoretyczny · Pewność: średnia
- Rodzaj: D
- Dowód: `tests/ekrany/wzor-trasa-znacznik.test.tsx:191` — nowy test przytrzymania przenoszącego pas; mutacja w `src/domena/znacznik-wzoru.ts:71-73` (`rzadPoPrzeniesieniu`) jest zabijana także przez wcześniejszy test S3 w tym samym pliku, więc nowy test nie dodaje wykrywalności.
- Mechanizm: nie szkodzi, tylko dubluje; koszt to dłuższe uruchomienie i dwa miejsca do aktualizacji.
- Powraca: nie
- Wzorzec lub źródło: —
- Kroki w aplikacji: nie dotyczy
- Opcje: (A) zostawić — dodatkowy opis intencji w nazwie testu; (B) scalić z S3. Rekomendacja: A (zero ryzyka, niski koszt).
- Test akceptacyjny: nie dotyczy
- Status: otwarte

## Do sprawdzenia (pewność ≤ 80%)
- `src/kompozycja/licznik.ts:145-160` (`plusZEkranu`) — dwa pierwsze „+1” bez `licznikId` mogą dwa razy wywołać `zalozRoboczy`; odziedziczone z przed-przyrostu, nie odtworzyłem testem; kolejka `plusWToku` (linie 84-86) powinna to szeregować, ale nie zweryfikowałem, czy drugie wywołanie widzi już założony licznik. Pewność ok. 60%.
- Szczegółowe wyniki mutacji M11–M15c (testy BX28) pochodzą z mojej sesji sprzed kompakcji kontekstu; w tym pliku opisuję je wynikiem (zabijają deklarowane mutacje, z wyjątkiem redundancji w 004), a surowe wyjścia konsoli mogą być odtworzone przez ponowienie mutacji na kopii. Pewność wyniku ok. 85%.
- Stan CI na `main` i skuteczność scenariuszy 90/86/93/97 na maszynie macOS: nie sprawdzono (zakaz wyzwalania workflowów, brak symulatora).
- Cytat właściciela w `docs/jakosc/test-fizyczny/1201.md`: nie weryfikowalny z poziomu repo.

## Co działa dobrze i należy zachować
- **Straż „+1” jest poprawna** w trzech scenariuszach z zadania 1: seria szybkich „+1”, odwrotna kolejność zakończeń, nieudany nowszy „+1”. Mutacje M1–M4 na straży `numerPlusa`/`zatwierdzonyPlus` (`src/ekrany/Aplikacja.tsx:86-91`) czerwone w `tests/ekrany/licznik-plus-kolejnosc-cp02.test.tsx` (2 testy: starszy po nowszym; nowszy nieudany); M6/M7 (usunięcie `zglosNacisniecie`/zmiana `onPress` w `src/ekrany/Dzis.tsx:124`) czerwone w `tests/ekrany/e2e-nacisniecia-bx20-wydanie.test.tsx` (CP-03/CP-04, porównanie `String(onPress)`); M8–M10 (zmiana `maWlasnaAsercjeWartosci`/`oczekiwanieNaWartosc`) czerwone w `tests/jakosc/e2e-czesci.test.ts`.
- **Liczby CI zgodne z kodem:** `scripts/ci/e2e-czesci.mjs:103` — `bezPonowien: maWlasnaAsercjeWartosci(polecenia) || tagi.includes('pomiar')`. Wykonanie planu części na 3 wersjach: 4d2a455 → 94 bez ponowień / 18 ponawialnych; 4f3374f → 59 / 53; ba16744 → 62 / 50. Nowe scenariusze bez ponowień po KO-147: 86, 93, 97 (każdy z własną asercją wartości licznika). Polityka P-091 9a zachowana (porażki asercji wartości licznika nie są ponawiane); scenariusze 50, 51, 52, 57, 80, 105 używają podprzepływu `e2e/scenariusze/subflows/projekt-roboczy.yaml` (asercje „1” i „0” nie są osłabione).
- **Scenariusz 90:** zmiana tylko dodaje kroki (`scrollUntilVisible nav-wstecz`, `swipe`, `assertVisible nav-wstecz`); nie usuwa asercji.
- **`.github/workflows/jakosc-ios.yml`:** wyłącznie komentarze; listy `PONAWIALNE` i `BRAMKA` nietknięte.
- **Bramka PU:** kontrole 2 i 3 zielone na ba16744 (kontrola 3 po `git fetch --tags origin`; w świeżym klonie bez tagów jest czerwona z komunikatem o braku tagów v*-b<N> — to zachowanie świeżego klonu, nie defekt przyrostu). Test fiksturowy `tests/jakosc/bramka-przypadki-uzycia.test.ts:184` używa repo z tagiem v1.0.0-b1171 i zależy od klasy „B z testem” PU-003.
- **Testy BX28:** `tests/ekrany/pu-wzor-przelacz-290.test.tsx` zabija mutację `selected: !` w `src/ekrany/WzorMenu.tsx:41` i `src/ekrany/WzorPrzegladarka.tsx:110`; `tests/dane/pu-291-pusta-nazwa-wzoru.test.ts` zabija usunięcie strażnika pustej nazwy w `src/przypadki-uzycia/wzor.ts:186`.
- **Tożsamość i katalog:** 16/16 commitów z autorem i committerem P-507, 0 trailerów; katalog PU bez zmian w zakresie (zasada 22).

## Decyzje dla właściciela
Brak decyzji wymagających właściciela. Do rozstrzygnięcia przez koordynatora (P-087): czy dopisać testy z 001 i 002 przed buildem 9 (rekomenduję 001 przed buildem — jeden test, niski koszt; 002 po buildzie jako osobne zadanie) oraz czy poprawić odnośniki z 003 razem z następną zmianą katalogu.

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-001,08-programista-002,08-programista-003`
