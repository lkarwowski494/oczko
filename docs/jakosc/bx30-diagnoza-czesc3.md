# BX30 — diagnoza czerwieni e2e „część 3 iPhone” (run 44114826259, attempt 2)

Sesja BX30 (rola 08, tryb budowy), 2026-11-18. Job `e2e (część 3, iphone)` 134438396425, commit `7f08a6f5` (gałąź `claude/bx25-2026-11-17`, kandydat build 9). Porównanie: run 44041179308 na `4d2a4554` (job 133907133265).
Zakres: tylko diagnoza. Żadnych zmian w `src/`, `app/`, `modules/`, `.maestro/`, `e2e/`, workflow, skryptach CI ani katalogu PU. Naprawy poniżej to opcje do decyzji, nie zapis.

## Wynik w jednym akapicie

Job czerwony z **jednego** powodu: `BR-PRJ-007/S1` (jedyny z czterech scenariuszy objęty bramką). Trzy pozostałe (`PU-066`, `PU-071`, `PU-291`) mają tag `oczekujacy` — ich porażka jest informacyjna (`czerwony-informacyjnie`), nie liczy się do `porazki` i **padały tak samo w starym przebiegu** na `4d2a4554`. Wspólnej przyczyny czterech porażek nie ma: trzy to wady scenariuszy (jedna z kodu, dwie z nieaktualnych asercji), jedna to nieustalona przyczyna prawdopodobnie środowiskowa (maszyna / zgubione stuknięcie).

## Tabela

| Scenariusz | Bramka | Klasa przyczyny | Pewność | Stary run 44041179308 |
|---|---|---|---|---|
| PU-066 | nie (`oczekujacy`) | **wada scenariusza względem kodu** (baner ukryty przed hierarchią dostępności) | wysoka | ta sama porażka |
| PU-071 | nie (`oczekujacy`) | **wada scenariusza** (asercja względna `below`) | średnia (patrz „Do ustalenia”) | ta sama porażka |
| PU-291 | nie (`oczekujacy`) | **wada scenariusza** (Enter już zapisuje i zamyka formularz) | wysoka | ta sama porażka |
| BR-PRJ-007/S1 | **tak** | **maszyna / zgubione stuknięcie — nieudowodnione**; regresja kodu mało prawdopodobna | niska–średnia | zielony |

## Dowody per scenariusz

### PU-066 — wada scenariusza
- Błąd: `Assertion is false: "Tap a row to place your marker.", id: wzor-wskazowka-znacznika is visible` — w obu podejściach (log jobu, linie 722 i 728).
- Scenariusz: `e2e/scenariusze/103-pu-066-…yaml:24` — `assertVisible: { id: "wzor-wskazowka-znacznika", text: "Tap a row to place your marker." }`.
- Kod: `src/ekrany/WzorPrzegladarka.tsx:163` — ten `Text` ma `accessibilityElementsHidden` i `importantForAccessibility="no-hide-descendants"`. Hierarchia XCTest/Maestro pomija takie elementy, więc Maestro **nigdy** go nie zobaczy, choć na zrzucie (`103_step-037.png`, `103_step-037_pon.png`) napis jest widoczny na ekranie wzoru.
- Plik `WzorPrzegladarka.tsx:163` nie jest w diffie `4d2a4554..7f08a6f5` (ostatnio ruszany starym commitem `0149ee6`) → to nie regresja tego zakresu.

### PU-071 — wada scenariusza (asercja względna)
- Błąd w 1. podejściu: `id: licznik-plus, Below id: licznik-wartosc-wiersz is visible` po `setOrientation: LANDSCAPE_LEFT` (`e2e/scenariusze/105-pu-071-…yaml:35` i `:38`).
- Zrzut `105_step-060.png`: widok po obrocie; asercja względna `below` zależy od współrzędnych obu elementów po obrocie symulatora — plik sam przyznaje (nagłówek, linia 4), że `below` „same orientacji nie dowodzi”, a kontrola właściwa to napis „portrait”.
- 2. podejście (ponowienie) kończy się innym błędem: `No visible element found` — zrzuty `105_step-029_pon.png`, `105_step-034_pon.png` pokazują inny stan ekranu niż w 1. podejściu (nie ten sam punkt scenariusza; zob. „Do ustalenia”).
- Stary run: ta sama porażka (informacyjna).

### PU-291 — wada scenariusza
- Błąd: `id: formularz-zapisz is visible` po `pressKey: Enter` (`e2e/scenariusze/109-pu-291-…yaml:51–52`; analogiczny wiersz 37–38 przeszedł).
- Zrzuty `109_step-060.png` i `109_step-060_pon.png`: formularz już zamknięty, widoczny wzór z nową nazwą — Enter w polu nazwy zapisał i zamknął arkusz, więc nie ma już przycisku `formularz-zapisz`. Scenariusz zakłada, że Enter tylko chowa klawiaturę.
- Obie próby ten sam błąd; stary run: to samo.

### BR-PRJ-007/S1 — bramkowany, przyczyna nieustalona
- Błąd: `Assertion is false: id: projekt-dodaj-czesc is visible` (log jobu, linia 878; krok 59/59 w `commands.json`; wskazany też jako porażka `runFlow` w kroku 49 — to ten sam podprzepływ).
- Miejsce: `e2e/scenariusze/subflows/dodaj-czesc-cel.yaml:20–21` (`tapOn projekt-dodaj` → `assertVisible projekt-dodaj-czesc`); wywołanie ze scenariusza `61-br-prj-007-s1-zrob-taka-sama.yaml:20–21`.
- Czasy z `commands.json`: `tapOn projekt-dodaj` — COMPLETED po 2407 ms; następna `assertVisible projekt-dodaj-czesc` — FAILED po 17 837 ms oczekiwania. Menu nie pojawiło się w 17,8 s.
- Zrzut `61_step-059.png` i hierarchia kroku 59: ekran projektu bez menu „Dodaj”; `projekt-dodaj` jest na ekranie.
- Kod: `src/ekrany/Projekt.tsx:120` — przycisk przełącza menu (`menu === 'dodaj' ? null : 'dodaj'`), pozycja `projekt-dodaj-czesc` w `Projekt.tsx:95`. Diff `4d2a4554..7f08a6f5` w `src/` obejmuje tylko `Aplikacja.tsx` (CP-02, straż kolejności w `useStanLicznika`) i `Dzis.tsx` (CP-04, `onPress` `dzis-plus`) — nie dotyka ekranu projektu ani menu „Dodaj”. W starym runie ten scenariusz był zielony.
- Scenariusz jest w klasie „bez ponowienia” (własna asercja licznika), więc nie miał 2. podejścia — jedna próba, jedna porażka. Ponowienie by rozstrzygnęło, czy to zgubione stuknięcie.
- Wniosek: najbardziej prawdopodobne **stuknięcie bez skutku** (znany wzorzec, `docs/jakosc/bx-stan.md:356`, `e2e/README.md` wiersz `e2e-dotyk`) albo przełączenie menu dwa razy; **nie da się tego odróżnić** — panel `e2e-dotyk` instrumentuje tylko `dzis-plus`, `dzis-kontynuuj`, `dzis-wybierz-projekt`, `nav-wstecz`, `e2e-zdjecie-testowe`, `e2e-wzor-pdf`, nie `projekt-dodaj`. Klasa „regresja kodu” nie jest wykluczona dowodem, tylko diffem.

## Wspólna przyczyna?

**Nie.** PU-066 (baner poza hierarchią), PU-071 (asercja `below` po obrocie) i PU-291 (Enter zapisuje) to trzy niezależne wady starych, oczekujących scenariuszy; padają identycznie w starym runie, więc nie wiążą się z kodem build 9. BR-PRJ-007 to odrębna, jednorazowa porażka na ścieżce niezmienionej w diffie. Jedyny element wspólny to **koszt czasu**: po zmianie CO (KO-145–147, P-962/P-975) scenariusze `oczekujacy` bez własnej asercji licznika są ponawiane, a PU-066/071/291 ponawiały się po ok. 2 min każdy (zbędne ok. 6–7 min jobu).

## Opcje napraw (do decyzji koordynatora)

### PU-066
- **A.** Zdjąć `accessibilityElementsHidden` z banera. Plus: scenariusz przechodzi. Minus: zmienia VoiceOver (baner jest ukryty celowo; to decyzja roli 04/05, nie 08).
- **B.** Asertować w scenariuszu coś widocznego w hierarchii zamiast banera (albo usunąć asercję tekstu do czasu decyzji o a11y). Plus: bez zmiany produktu. Minus: tracimy sprawdzenie banera w e2e (zostaje test jednostkowy).
- **Rekomendacja: B**, scenariusz zostaje `oczekujacy`.

### PU-291
- **A.** Zmienić scenariusz: po Enter oczekiwać zapisu (tytuł paska „Sleeve chart”). Plus: zgodne z faktycznym zachowaniem aplikacji. Minus: zmiana przepływu w PU wymaga testu (P-835) i zgody ról 03/07.
- **B.** Zmienić aplikację, by Enter tylko chował klawiaturę. Plus: scenariusz bez zmian. Minus: zmienia zachowanie produktu dla pustej nazwy i walidacji.
- **Rekomendacja: A.**

### PU-071
- **A.** Zastąpić asercje `below` porównaniem z napisem „portrait” (`window: portrait`) w kolejnych krokach, bez zależności od geometrii. Plus: deterministyczne. Minus: wymaga przeglądu całego pliku.
- **B.** Zostawić informacyjnie do czasu zamknięcia tagu `oczekujacy`.
- **Rekomendacja: B teraz, A przy najbliższej pracy nad PU-071.**

### BR-PRJ-007/S1
- **A.** W `dodaj-czesc-cel.yaml:20–21` owinąć `tapOn` + `assertVisible` w `retry` (jak w innych scenariuszach z klawiaturą). Plus: tanie, celuje w zgubione stuknięcie. Minus: może maskować prawdziwą usterkę menu; zmiana w `e2e/` (poza zakresem tej sesji).
- **B.** Dodać `projekt-dodaj` do panelu `e2e-dotyk`, by następna czerwień rozstrzygnęła przyczynę. Plus: dowód zamiast domysłu. Minus: kod E2E w `src/`, kolejny przebieg.
- **C.** Nic nie zmieniać; ponowić część 3 raz (zasada maszynowa CLAUDE.md) i zapisać wynik. Plus: zero zmian, szybka odpowiedź, czy porażka się powtarza. Minus: nic nie dowodzi przyczyny.
- **Rekomendacja: C teraz** (jedno ponowienie części); jeśli czerwień się powtórzy w tym samym kroku — **B, potem A**.

### Ponawianie scenariuszy `oczekujacy` (koszt czasu)
- **A.** Zostawić (zasada „każdy scenariusz ma 2. podejście”). Plus: bez zmian w skryptach. Minus: ok. 6–7 min zbędnych, bo wynik i tak informacyjny.
- **B.** Wykluczyć tag `oczekujacy` z `PONAWIALNE` w `scripts/ci/e2e-czesci.mjs`. Plus: krótszy job, bramka nie zmienia się. Minus: zmiana skryptu CI.
- **Rekomendacja: B** (osobny krok koordynatora, nie tej sesji).

## Do ustalenia (nie rozstrzygnięte dowodem)
- Czy w hierarchii PU-071 w kroku 60 jest `licznik-wartosc-wiersz` (nie odczytano pliku hierarchii dla tego kroku).
- Czy `BR-PRJ-007` przeszedł, czy padł w attempt 1 run 44114826259 (logi attempt 1 nie były czytane).
- Czy stuknięcie `projekt-dodaj` było zgubione, czy menu otworzyło się i zamknęło (brak instrumentacji `e2e-dotyk` dla tego przycisku).

## Koszt i zakres
Tylko odczyt logów i artefaktu e2e oraz ten dokument. Zrzuty binarne nie są dodawane do repo.
