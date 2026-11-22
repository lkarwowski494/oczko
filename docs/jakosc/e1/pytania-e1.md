# Pytania E1 roli 07 do koordynatora (P-087) · 2026-10-25
Tylko sprawy, których nie rozstrzyga źródło ani istniejąca decyzja. Według wagi (skutek × prawdopodobieństwo wierszy R). Kolejność decyzji wg P-087: najpierw jak w Treningu, bez analogii — rekomendacja. Ścieżki Treningu względem repo `lkarwowski494/trening` @928d0ff. „R-xxx” = `docs/jakosc/e1-ryzyka.md`, ER/Z07 = `zgloszenia-e1.md`.

## 1. Środowiska CloudKit bez Maca: kto tworzy schemat Development i wdraża go do Production (R-051, R-052; WY-36, WY-37)
**Kontekst.** Apple: „Apps in the App Store can access only the production environment. Before you publish your app, you must deploy the development schema to the production environment” i „you can't delete record types or fields that are already in production” (A1, odczyt 2026-10-25, potwierdzone przez 07). Właściciel nie ma Maca, symulator CI nie ma konta iCloud, a TestFlight widzi tylko Production. Bez tego synchronizacja po cichu nic nie zapisuje (S1, realny). Żaden dokument 05/10/12 tego nie opisuje.
- **(a)** Schemat jako plik w repo, generowany z adaptera. Właściciel tworzy typy rekordów w CloudKit Console (przeglądarka) i klika „Deploy Schema Changes”. CI tylko porównuje eksport Production z plikiem. Kompromis: bez nowego sekretu, ale ręczne tworzenie typów i pól jest podatne na literówki, a schematu Production nie da się potem poprawić.
- **(b)** Jak (a), ale schemat do Development wgrywa CI (`xcrun cktool import-schema` na `macos-26` z tokenem zarządzania CloudKit jako sekretem środowiska `testflight`). Właściciel tylko wdraża Development → Production w konsoli. CI porównuje Production (`cktool export-schema`) z plikiem przy każdym buildzie TestFlight. Do listy P-090 dochodzi punkt „rekord z telefonu widoczny na iPadzie”. Kompromis: jeden nowy sekret i jednorazowe wygenerowanie tokenu przez właściciela (konto Apple, wyjątek P-087), a schemat zawsze zgodny z kodem. Polecenia `cktool` do potwierdzenia u źródła Apple przy wdrożeniu (rola 05).
- **(c)** Synchronizacja iCloud wyłączona w 1.0 (przełącznik ukryty), włączona dopiero po sprawdzeniu ścieżki (a) albo (b). Kompromis: zero ryzyka cichej porażki w 1.0, ale funkcja z zakresu wypada (decyzja 03).
- **Rekomendacja: (b)**, punkt P-090 jak w pytaniu 2. Analogii w Treningu nie ma: Trening nie używa CloudKit, synchronizację iCloud pominięto jako teoretyczną (`docs/38-przeplywy-i-luki-e2e.md:19`).

## 2. Lista P-090: czy dopisać „aktualizację z poprzedniej wersji” i dwa punkty specyficzne dla Oczka (R-081, R-080, R-051; WY-31, WY-28, WY-36)
**Kontekst.** P-090 (Q1a) przyjął listę z telefonu dla zakupów, przywrócenia, trybu samolotowego, zwrotu i Family Sharing. Pominął aktualizację, choć pytanie Q1a z E0 ją wymieniało (`docs/jakosc/e0-rozpoznanie.md:91`). Test aktualizacji jest dziś tylko w Node (`tests/bazy/vN.db`), a instalacji nad prawdziwą binarką nikt nie robi. Od 1.1 to S1, realne.
- **(a)** Dopisać trzy punkty: (1) aktualizacja z poprzedniego buildu TestFlight („Previous Builds” → nowy build, dane na miejscu); (2) pierwszy start nowej wersji nad 0.1.0 (pusta aplikacja bez awarii, stary plik nietknięty, P-070); (3) jeśli pytanie 1 = (a) albo (b): rekord z telefonu widoczny na iPadzie. Kompromis: ok. 10–15 min właściciela przy wydaniu.
- **(b)** Tylko punkt (1), jak Trening. Kompromis: krócej, ale P-070 i CloudKit zostają bez sprawdzenia na urządzeniu.
- **(c)** Bez zmian. Aktualizację pokrywa E2E na symulatorze (vN → kandydat, `simctl install`), reszta to „Nie sprawdzono”. Kompromis: zero czasu właściciela, ale podpis, App Group i Live Activity w prawdziwej instalacji pozostają niesprawdzone.
- **Rekomendacja: (a).** Punkt (1) jest wprost z Treningu: `docs/39-lista-kontrolna-wydania.md:45–50` (AK-05 „Aktualizacja z TestFlight na prawdziwym telefonie”, z uzasadnieniem „nie istnieje na symulatorze CI”). Punkty (2) i (3) to rekomendacja, bo Trening nie ma odpowiednika. Do tego E2E aktualizacji na symulatorze i `.app` poprzedniego wydania jako zasób Release (Z07-21).

## 3. Cofnięcie zmiany ze środka historii (R-006; SD-04)
**Kontekst.** BR-LIC-003 pozwala cofać zmiany z historii. Kryteria i wektor M-08 opisują jednak tylko serię na końcu. Cofnięcie np. +1 z 20:14, gdy po nim są kolejne +1, nie ma semantyki. Naiwna implementacja (wartość sprzed tej zmiany) po cichu kasuje późniejsze rzędy (S1, realny).
- **(a)** „Cofnij” działa tylko na ostatnią zmianę albo serię na końcu historii. Starszą pomyłkę poprawia się przez wpisanie wartości (`wpisanie` z wpisem w historii). Kompromis: najprostsze i bez ryzyka utraty, ale pojedyncze błędne stuknięcie sprzed godziny wymaga wpisania liczby.
- **(b)** Cofnięcie dowolnej zmiany jako zdarzenie kompensujące (−1 za +1), późniejsze rzędy zostają. Kompromis: intuicyjne dla pojedynczego stuknięcia, ale bez semantyki dla `wpisanie` i `zerowanie` ze środka. Wymaga nowych wektorów `scal` i decyzji 05.
- **(c)** „Cofnij do tego miejsca”: usuwa wszystkie późniejsze zmiany po potwierdzeniu z liczbą („Usunie 14 rzędów”). Kompromis: jasne, ale łatwo stracić pracę (S1 przy pomyłce).
- **Rekomendacja: (a)**, jak w Treningu: `docs/32-wzorce-interakcji.md:57` („„Cofnij” = odwrócenie ostatniej zmiany”). Dowód potrzeby z BR-LIC-003 („historii nie da się poprawić”) spełnia wpisanie wartości z historią. Po decyzji: ER-41.

## 4. Strażnik tempa (RD-17) a stuknięcia scalone z ekranu blokady i zegarka (R-009; SD-08, SD-09)
**Kontekst.** ADR-0008 scala cały dziennik ekranu blokady przy wejściu na pierwszy plan. Jeśli RD-17 liczy po czasie dostarczenia, 20 prawdziwych rzędów z wieczoru daje baner „Added 20 rows in 0 s. Undo?”, a „Undo” kasuje pracę (S1, realny). RD-17 tego nie rozstrzyga.
- **(a)** RD-17 tylko dla stuknięć w aplikacji. Scalone z ekranu blokady i zegarka nigdy nie wywołują banera. Kompromis: prosto i bez fałszywego banera, ale seria z kieszeni przez ekran blokady przechodzi niezauważona (S2).
- **(b)** RD-17 dla każdego źródła osobno, po czasie zdarzenia (`czas_ms`), nigdy po czasie dostarczenia. Po scaleniu baner wskazuje źródło i godzinę („From Lock Screen, 21:14: 20 rows in 4 s. Undo?”). Kompromis: wykrywa prawdziwe serie z kieszeni bez fałszywych alarmów. Potrzebne wektory z niemonotonicznymi znacznikami.
- **(c)** Jak (b), ale dla scalonych tylko informacja z odnośnikiem do historii, bez „Undo” na banerze. Kompromis: bezpieczniej wobec omyłkowego stuknięcia, ale cofnięcie serii wymaga wejścia w historię.
- **Rekomendacja: (b).** Analogii w Treningu nie ma (Trening nie ma liczenia z ekranu blokady). Po decyzji: ER-40 (RD-17) i wektory w Z07-11.

## 5. Xcode: przypięty numer (rola 12) czy najnowszy 26.x (Trening) (R-155; WY-06, WY-42)
**Kontekst.** `docs/niezawodnosc/e1-decyzje.md:37` każe przypiąć Xcode. Trening celowo bierze najnowszy 26.x z obrazu, bo przypięty numer „z obrazu może zniknąć”. Poprawka P0 w dniu incydentu nie może czekać na naprawę CI (S1, realny raz w roku przy nowym iOS).
- **(a)** Jak Trening: `select-xcode.sh 26` (najnowszy 26.x bez bet i dowiązań), wersja Xcode i obrazu w podsumowaniu przebiegu, do tego cotygodniowy build Release bez podpisu na `main` i ostatnim tagu oraz na najnowszym symulatorze. Kompromis: build może się zmienić bez commita, ale tygodniowy przebieg wykrywa to przed incydentem.
- **(b)** Przypięty numer (np. 26.4.1) z tygodniowym przebiegiem i ręczną podmianą, gdy numer zniknie z obrazu. Kompromis: powtarzalność, ale ryzyko „brak Xcode” w dniu incydentu i ręczna praca przy każdej aktualizacji obrazu.
- **Rekomendacja: (a)**, jak w Treningu: `scripts/ci/select-xcode.sh:1–8`. Rola 12 poprawia `e1-decyzje.md:37` (Z07-21).

## 6. Import „scal”: dwie wersje projektu (BRD) czy scalenie po UUID (ADR-0004) (R-066; SD-53)
**Kontekst.** BR-DAN-006/S4 chce mieć po imporcie „obie wersje Skarpety” (40 i importowaną 25, oznaczoną). ADR-0004 i `dane.md` scalają po UUID w jeden projekt („import tego samego pliku dwa razy = brak zmian”). Test E3 nie spełni obu wyroczni. Dotyczy każdego importu na niepustą bazę (S2, realny).
- **(a)** Po UUID, idempotentnie (ADR-0004). Rozbieżne gałęzie tego samego licznika dają konflikt do wyboru, tak jak przy iCloud. BR-DAN-006/S4 do przepisania. Kompromis: brak duplikatów, ale użytkownik musi rozstrzygnąć konflikt.
- **(b)** Jak BRD: każdy projekt z importu jako kopia oznaczona „import”. Kompromis: nic się nie miesza, ale każdy ponowny import tworzy duplikaty, a sprzątanie zostaje użytkownikowi.
- **(c)** Wybór przy imporcie dla każdego projektu z tym samym UUID: „scal” albo „zachowaj obie”. Kompromis: elastyczne, ale dodatkowy ekran i więcej testów.
- **Rekomendacja: (a)**, zgodne z Treningiem: `docs/39-lista-kontrolna-wydania.md:40–41` (DA-06: import „dopisanie bez usuwania danych”, „powtórny import nie dubluje”). Po decyzji: ER-42.

## 7. Przypadkowa seria stuknięć a zużyty dzień limitu (R-106; SD-86)
**Kontekst.** L-06 mówi, że cofnięcie nie zwraca dnia. RD-17 rozpoznaje serię z kieszeni i proponuje „Undo”. Darmowy użytkownik może więc stracić jeden z 5 dni bez dziergania (S2, realny).
- **(a)** Bez zmian (L-06): dzień zostaje zużyty. Kompromis: prosta reguła, ale jeden przypadkowy dzień w miesiącu ląduje na koncie użytkownika.
- **(b)** „Undo” z banera RD-17, które usuwa wszystkie +1 danego dnia, zwraca ten dzień. Ręczne cofnięcie w historii i usunięcie licznika dnia nie zwracają (L-06 bez zmian). Kompromis: nie da się tego nadużyć, bo rzędy znikają, ale potrzebny nowy wektor L-19 i zmiana kontraktu 02.
- **Rekomendacja: (b)**, analogicznie do Treningu: `docs/monetyzacja.md:18` („anulowany … nie zużywa dnia”) przy jednoczesnym `:19` („usunięcie treningu nie zwraca dnia”). Po decyzji: Z07-09.

## 8. iPad w CI (R-160; WY-11)
**Kontekst.** Oczko deklaruje iPadOS 18 (PencilKit, ADR-0006), recenzent Apple często testuje na iPadzie, a Apple uznaje rezygnację z wielozadaniowości za przestarzałą (A3). Trening iPada nie wspiera (`app.json:13` `"supportsTablet": false`; `.github/workflows/store-screenshots.yml:4`), więc analogii nie ma.
- **(a)** iPad w pakiecie podstawowym bramki TestFlight. Kompromis: pewność przed każdym wydaniem, ale ok. +25–40 min macOS na wydanie (osobny build pod symulator iPada niepotrzebny, druga maszyna tak).
- **(b)** W bramce tylko `plutil` na `.ipa` (`UIDeviceFamily`, 4 orientacje iPada) i zrzuty iPad 13″ przy wydaniu. Pakiet podstawowy na symulatorze iPada nocą (niewiążąco, jak pełny katalog Treningu). Kompromis: tańsze, regresja układu wykryta do 24 h później.
- **(c)** Bez iPada w CI, tylko punkt na liście P-090 na iPadzie właściciela. Kompromis: zero minut CI, ale układ w oknie wielozadaniowym nie jest sprawdzany automatem.
- **Rekomendacja: (b).**

## 9. Zakres E2E: bramka = krótki pakiet, pełny katalog nocą (jak Trening) (R-152, R-011, R-085, R-150)
**Kontekst.** Trening po serii niestabilnych przebiegów na `macos-26` przyjął: bramkę TestFlight blokuje pakiet podstawowy z jednym ponowieniem pojedynczego scenariusza, pełny katalog biegnie nocą niewiążąco, a wydanie do App Store blokuje jeden pełny katalog. Sceptyk wskazał, że ponowienie maskuje błąd stanu (np. podwójne +1).
- **(a)** Jak Trening, z jedną zmianą: ponowienie nie dotyczy scenariuszy z asercją wartości licznika po akcji zmieniającej stan, a status „w ponowieniu” liczy się osobno, nie jako zaliczenie. Kompromis: krótka bramka (~20–25 min), mniej fałszywych porażek, a błędy stanu nie są maskowane.
- **(b)** Pełny katalog jako bramka TestFlight. Kompromis: najpełniejsze, ale ok. 1,5 h i niestabilność blokująca poprawki P0.
- **(c)** Tylko pakiet podstawowy, bez nocnego pełnego katalogu. Kompromis: najtaniej, ale reszta przepływów nie jest nigdy sprawdzana na symulatorze.
- **Rekomendacja: (a)**, jak w Treningu: `CLAUDE.md:64–68` (podział właściciela 19.10/21.10), `.github/workflows/nightly.yml:97–106`, zastrzeżenie sceptyka (`S/soczewka-sceptyk.md`, „Uwagi do wzorca Treningu”, pkt 1).

## 10. Automatyczne ponowienie, gdy `macos-26` jest niedostępny (koszt czasu, nie ryzyko produktu)
**Kontekst.** Trening nie ponawia automatycznie. Reguła jest ręczna: „awaria przed pierwszym scenariuszem to maszyna; jedno powtórzenie… Przebieg anulowany bez przydzielonej maszyny… ponawiaj od razu, aż dostanie maszynę”. Plan E0 roli 07 proponował automat.
- **(a)** Jak Trening: reguła ręczna w `CLAUDE.md` Oczka, a w podsumowaniu przebiegu osobny status „maszyna nieprzydzielona / awaria przed pierwszym scenariuszem”. Kompromis: zero nowego kodu CI, ale ponawia człowiek albo agent.
- **(b)** Osobny workflow ponowień: wyzwalany po zakończeniu E2E, bez sekretów, z uprawnieniem tylko `actions: write`. Ponawia (`gh run rerun --failed`) najwyżej 3 razy, wyłącznie dla „not acquired by Runner” i awarii przed pierwszym scenariuszem. Kompromis: mniej ręcznej pracy, ale nowy workflow do testów i strażników. Nie wolno go wpiąć w workflow TestFlight (`workflow_run` z sekretami jest zakazany, R-173).
- **Rekomendacja: (a)**, jak w Treningu: `CLAUDE.md:60–63`. (b) można zgłosić jako ulepszenie wspólne dla portfela, gdy Trening je przyjmie.

## 11. Poprawki roli 05 przed rolą 08 (dopisane przez rolę 07 po scaleniu; R-018, R-036, R-041 i kontrakty Z07-11–Z07-13)
**Kontekst.** P-090 (Q3a) przewiduje przed rolą 08 jedną sesję fix ról 01 i 02. E1 pokazał błędy projektu po stronie 05 o skutku S1, zweryfikowane uruchomieniem na prototypie: intencja ekranu blokady nie łańcuchuje własnych stuknięć (3 stuknięcia → konflikt 23/23/23 zamiast 25), `scal` przepełnia stos od 10 000 zdarzeń, stany Live Activity i zegarka nie niosą danych do reguły limitu, brak złotego pliku dziennika TS↔Swift. Testy E3 roli 07 będą na nie czerwone, ale 08 nie powinna implementować kontraktu, który ma zmienić 05.
- **(a)** Sesja fix roli 05 (Z07-11–Z07-19, ADR-0008, ADR-0009, `scal`, `moduly.md`) w tym samym oknie co fix 01 i 02, przed rolą 08. Kompromis: jedna sesja więcej (ok. pół dnia agenta), 08 dostaje spójny kontrakt.
- **(b)** Poprawki 05 robi rola 08 w pierwszej partii (domena), z ADR zmienianym przez nią. Kompromis: szybciej, ale programista zmienia architekturę (poza swoją rolą, ryzyko rozjazdu z dokumentem).
- **Rekomendacja: (a).** Analogia w Treningu: zmiany kontraktów domeny przez architekta przed programistą (kolejność ról P-002); bez osobnego precedensu w Treningu.
