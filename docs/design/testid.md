# Kontrakt testID — wyciąg z `design-spec.md` kierunku A (M3-S3-05)

2026-11-08 · rola 04 (fix) · źródło: `docs/design/design-spec.md` @ 3332920e, wszystkie 19 wierszy z „testID”, **treść bez zmian** (dosłownie, z numerem linii i sekcją).

**Gdzie leży kontrakt po podmianie `design-spec.md` w p1 (P-553):**
- **Wiążący kontrakt testID** to tabela w `e2e/README.md` (rola 07; ekran bez tych `id` = czerwone E2E, `docs/jakosc/e4-przekazanie.md:22`). Ten plik go nie zastępuje.
- Ten plik przechowuje **propozycje i zmiany kontraktu od roli 04**, które dotąd stały w `design-spec.md` (np. P-183, P-191, P-220, P-237). Po podmianie `design-spec.md` na system Dzianiny (`dzianina/design-spec.md`) zostają tutaj; nowe propozycje testID roli 04 (np. ekran „Dziś”, stany p2) dopisuje się tu, a 07 przenosi je do `e2e/README.md`.
- Ekrany TO BE nie zmieniają testID istniejących elementów, chyba że wiersz poniżej albo decyzja mówi inaczej (zasada: wygląd p1–p8 bez zmiany kontraktu E2E; zmianę kontraktu robi 07).

### design-spec.md:374 (sekcja „Projekt, części i kosz (F-04, F-08, F-09, F-14, F-15, F-17–F-20, F-33, F-46, F-52, F-54, F-60, F-61; P-182, P-183)”)

- Wiersz w toku: nazwa; linia 1 „{część} · row {n}[ of {cel}]”; linia 2 tylko przy terminie: `projekty.dzis_*` albo `projekty.po_terminie_*` albo `licznik.cel_osiagniety`; linia 3 **zawsze** „last worked …”: `projekty.ostatnia_praca_dzis` (0 dni), `_wczoraj` (1), `_dni_*` (≥ 2) — dni kalendarzowe RD-16 od `ostatnia_praca_ms`, **bez progu** (P-047, P-182): ta sama etykieta przy 2 i przy 400 dniach, bez osobnej sekcji. testID `projekty-ostatnia-praca` na tej etykiecie (powtarzalny); `projekty-uspione` znika.

### design-spec.md:375 (sekcja „Projekt, części i kosz (F-04, F-08, F-09, F-14, F-15, F-17–F-20, F-33, F-46, F-52, F-54, F-60, F-61; P-182, P-183)”)

- **Wejście do kosza:** ostatni wiersz listy, osobna grupa pod „Finished”, `projekty.kosz` z liczbą elementów po prawej; **tylko, gdy kosz nie jest pusty** (pusty kosz = brak wiersza). VoiceOver `projekty.kosz_a11y_*`. Proponowany testID `projekty-kosz` (dla 07).

### design-spec.md:514 (sekcja „Projekt, części i kosz (F-04, F-08, F-09, F-14, F-15, F-17–F-20, F-33, F-46, F-52, F-54, F-60, F-61; P-182, P-183)”)

**Zmiana kontraktu testID i scenariusza 20 dla 07 (nazwany wyjątek P-183 (1a), jak P-176).** `e2e/README.md`: wiersz `projekty-uspione` → `projekty-ostatnia-praca` | lista projektów | etykieta ostatniej pracy w wierszu projektu w toku (powtarzalna) | „last worked 41 days ago”; nowy wiersz `projekty-kosz` | lista projektów | wejście do „Recently deleted” (tylko gdy niepusty) | „Recently deleted”. Scenariusz 20 (`e2e/scenariusze/20-br-prj-016-s2-powrot-po-przerwie.yaml`): `assertVisible: { id: "projekty-uspione" }` → `assertVisible: { id: "projekty-ostatnia-praca", text: "last worked 41 days ago" }`; komentarz i `name:` bez „sekcji uśpionych” („Po 41 dniach: ‘last worked 41 days ago’, jedno stuknięcie wraca do rzędu”); wyrocznia BR-PRJ-016/S1–S2 i BR-PRJ-011 bez zmian. Zmianę wykonuje 07 albo 08 za zgodą 07 (P-183); 04 nie edytuje kontraktu.

### design-spec.md:520 (sekcja „Dla 08 (fix NZ-08-P5-Q1, partia 5: ekrany A5–A6, C2–C3; P-183)”)

- **testID** (propozycja dla tabeli 07): `projekty-ostatnia-praca`, `projekty-kosz`, `projekt-dodaj`, `projekt-menu`, `projekt-edytuj`, `projekt-usun`, `projekt-zrob-taka-sama`, `projekt-wznow`, `projekt-notatka`, `projekt-narzedzie`, `projekt-termin`, `licznik-nastepna-czesc`, `co-dalej-druga`, `co-dalej-nowa`, `potwierdz-usun`, `kosz-lista`, `kosz-przywroc`, `formularz-nazwa-czesci`, `formularz-cel-czesci`, `formularz-nazwa-licznika`, `formularz-notatka`, `formularz-rozmiar-mm`. Scenariusz 20 — sekcja wyżej (wyjątek P-183 (1a)).

### design-spec.md:528 (sekcja „Stoper, sesje i Historia (F-21, F-51, F-59; BR-PRJ-008, BR-PRJ-013, BR-DNI-001–003; P-191)”)

- Bez sesji: ikona stopera w pasku nawigacji, pierwsza z prawej grupy (przed Historią i •••), etykieta `stoper.start_a11y`, testID `licznik-stoper` (`licznik-stoper`). Stuknięcie = start (`sesja.start`), haptyka lekka (token `haptyka.stoperStart`, po udanym zapisie, przy włączonych wibracjach; M1-audytor-generalny-107), ogłoszenie `stoper.uruchomiono`. Na kartce nic nowego; kreski i podpis „since …” liczą od startu stopera (sekcja „Kreski sesji przez północ”).

### design-spec.md:537 (sekcja „Stoper, sesje i Historia (F-21, F-51, F-59; BR-PRJ-008, BR-PRJ-013, BR-DNI-001–003; P-191)”)

**Czas projektu i sesje (P4a).** Ekran projektu: grupa `projekt.czas` między „Parts” a „Note”: `projekt.czas_wiersz` z sumą (ukonczenie.czas_*) albo — bez sesji — sam wiersz z `projekt.czas_brak` (bez „0 h”, bez wiersza „Sessions”); `projekt.sesje` z liczbą sesji i drugą linią `projekt.sesje_sprawdz_*` przy sesjach do sprawdzenia (`projekt-czas`; testID `projekt-sesje`).

### design-spec.md:538 (sekcja „Stoper, sesje i Historia (F-21, F-51, F-59; BR-PRJ-008, BR-PRJ-013, BR-DNI-001–003; P-191)”)

- Ekran „Sessions” (`sesje`): duży tytuł `sesje.tytul`, pod nim `sesje.podsumowanie_*`; grupy według dnia startu (nagłówek: data z Intl, rok tylko inny niż bieżący), od najnowszej. Wiersz: `sesje.wiersz` albo `sesje.wiersz_nastepny_dzien`, wartość = czas trwania, druga linia jedna z: `sesje.do_sprawdzenia_*` (znak „i”, testID `sesje-do-sprawdzenia`), `sesje.trwa`, `sesje.wstrzymana`, `sesje.pauzy`, `sesje.skorygowana`. VoiceOver `sesje.wiersz_a11y` + druga linia. Sesja trwająca nie otwiera korekty.

### design-spec.md:591 (sekcja „Dla 08 (fix NZ-08-P5-BD, grupa B: sesje i Historia; P-191)”)

- **testID** (propozycja dla tabeli 07): `licznik-stoper`, `stoper-wstrzymaj`, `stoper-zatrzymaj`, `stoper-inny-potwierdz`, `stoper-sprawdz`, `projekt-sesje`, `sesje-lista`, `sesje-do-sprawdzenia`, `formularz-sesja-start`, `formularz-sesja-koniec`, `historia-kalendarz`, `historia-dzien`, `historia-tydzien`, `historia-miesiac`.

### design-spec.md:627 (sekcja „Przegląd 04 z P-188 (P-191: R1a, R3a, R6a; R2, R4, R5, R7, R8)”)

- **R8:** menu „+” i ••• projektu jako lista w ekranie zamiast systemowego menu — odstępstwo przyjęte do audytu 04 (zachowanie i testID bez zmian).

### design-spec.md:633 (sekcja „Dla 08 (fix NZ-08-P5-BD, grupa D i przegląd P-188; P-191)”)

- **testID** (propozycja dla 07): `narzedzia-wloczki`, `narzedzia-druty`, `narzedzia-probka`, `probka-oczka`, `probka-szerokosc`, `probka-wynik-oczka`, `probka-wynik-grubosc`, `zapas-filtr`, `zapas-dodaj`, `projekt-zdjecia`, `zdjecia-dodaj`, `zdjecie-usun`, `projekt-probka`, `karta-udostepnij`.

### design-spec.md:678 (sekcja „Wzór, rysik i iPad (F-24–F-28, F-55, F-56; BR-WZR-001–005, 007, 008; ADR-0011, ADR-0012; P-218, P-220)”)

- **iPhone i iPad bez rysika:** zakreślacz (`wzor.zakreslacz`, testID `wzor-zakreslacz`, wartość VoiceOver `wzor.zakreslenia_*`) włącza tryb rysowania; pasek nawigacji zamienia się w pasek narzędzi: Highlighter (wybrany), `wzor.gumka`, ↶ (`wzor.cofnij_rysunek`), `wspolne.gotowe`. W trybie jeden palec zakreśla, dwa przewijają (podpowiedź `wzor.zakreslacz_podpowiedz` raz). Poza trybem palec tylko przewija (BR-WZR-008 S3).

### design-spec.md:766 (sekcja „Dla 08 (fix NZ-P217-04, grupa W: wzór, rysik, iPad; P-220)”)

- **testID:** istniejące `wzor-dodaj`, `wzor-widok`, `wzor-zrodlo`, `wzor-strona`, `wzor-zakreslacz`, `wzor-zakreslenia` bez zmian; w pasku licznika pod wzorem te same id co na liczniku (jeden komponent). Nowe id grupy W (wiersze w `e2e/README.md` dopisała 07, 12aa394): `licznik-wzor`, `wzor-dodaj-film`, `wzor-przelacz`, `wzor-menu`, `wzor-obroc`, `wzor-usun`, `wzor-gumka`, `wzor-pioro`, `wzor-cofnij-rysunek`, `wzor-link-pole`, `wzor-film-wiersz`, `wzor-czeka-siec`.

### design-spec.md:850 (sekcja „Dla 08 (fix NZ-P217-04, grupa R i I: rozszerzenie, skrzynka, iCloud; P-220)”)

- **testID:** propozycja dla 07 w `fix7-2026-10-26.md` („Dla 07”, grupa R i I) — do spec po dopisaniu wierszy w `e2e/README.md`.

### design-spec.md:921 (sekcja „Partia 8: luki zgodności z zakresem 1.0 (07-jakosc-001, 002, 003, 007, 011, 012, 014 S5, 021, 025, 027, 031; P-326)”)

**Dla 08 (partia 8, grupy 8a–8c).** (1) Nałóż `fix10-2026-11-01/klucze.json` (`en` i `kontekst` do słowników; `zastapEn` — zamiana tekstu z zachowaniem kontekstu; na wzór `narzedzia/nakladaj-klucze-fix6.mjs`); (2) klucz `dane.zastapiono` ma kształt z ADR-0028 (jeden klucz opisu z `{{kopia}}`); (3) testID (propozycja dla 07): `projekt-wloczka`, `wloczka-wybor`, `ukonczenie-wybierz-wloczke`, `oferty-komunikat`, `dane-zastapiono`, `wzor-notatka-chip`, `przyp-lista`, `przyp-usun`, `historia-cofnij`, `historia-starszy`, `projekty-ukonczono`; (4) test każdej poprawki przez trasę, nie komponent z propsami (07-jakosc-032).

### design-spec.md:1073 (sekcja „Paski i „wstecz” (M1-audytor-generalny-033, 04-studio-projektowe-006; 036, 04-studio-projektowe-009, DEC-05 a)”)

**Menu ••• licznika w dwóch grupach (DEC-05 a, to-be 04, U12).** Grupa 1 (ustawienia liczenia): Name project and part, Set a goal, Pattern, reminder(s), Set a repeat length, Enter the row number. Odstęp sekcji (`odstep.sekcja` 32 pt) zamiast podziałki. Grupa 2 (cały projekt): Mark project as finished, What the number shows, Lock/Unlock counter, Reset to 0… — reset na końcu, z dala od ukończenia; pytanie o reset pod nim. Bez nagłówków grup (bez nowych tekstów; odstęp wystarcza, NN/g grupowanie). testID grup: `menu-grupa-liczenie`, `menu-grupa-projekt`; nowe testID pozycji: `menu-zablokuj`, `menu-odblokuj`, `menu-zeruj`.

### design-spec.md:1115 (sekcja „Znacznik: stuknięcie w rząd, glif uchwytu, wskazówka pierwszego użycia (M1-audytor-generalny-131, 04-studio-projektowe-521; DEC-33 b, P-432)”)

   - obszar dotyku 44 × 44 pt (`ikona`), etykieta VoiceOver `wzor.zaznacz_rzad` „Mark row” i testID `wzor-zaznacz` bez zmian.

### design-spec.md:1117 (sekcja „Znacznik: stuknięcie w rząd, glif uchwytu, wskazówka pierwszego użycia (M1-audytor-generalny-131, 04-studio-projektowe-521; DEC-33 b, P-432)”)

3. **Wskazówka pierwszego użycia.** Linia informacji `wzor.wskazowka_znacznika` „Tap a row to place your marker.” pod paskiem nawigacji, nad licznikiem zakreśleń i stroną — w tym samym stylu i miejscu co `wzor.word_podglad` (`informacja` + `tresc`: 17 pt, `grafit` na `papierGrupa`, promień `grupa`), testID `wzor-wskazowka-znacznika`. Nie jako plakietka na stronie (jak `wzor.rysik_podpowiedz`): na makiecie plakietka zakrywała pierwsze rzędy wzoru, czyli miejsce pierwszego stuknięcia (`zrzuty/131-*` w katalogu wyjścia sesji).

### design-spec.md:1215 (sekcja „Wybór narzędzia w kalkulatorze bez projektu (M1-audytor-generalny-066, 06-tresci-003; DEC-06 a)”)

- **N1 (P2, P, SP-10, pewność średnia — stan kodu z wyniku 06, zrzut 07):** „Hook” bez szerokości nie pokazuje żadnego wyniku (kategoria nie istnieje, blok oczek wymaga szerokości), więc ekran wygląda jak niedziałający. Opcje: (a) pod polem szerokości linia zaproszenia „Enter a width to get the number of stitches.” (nowy klucz en, oczekujący P-422); (b) bez zmian — pole szerokości jest widoczne tuż pod próbką. Rekomendacja: (a), decyzja koordynatora. **Rozstrzygnięte (2026-11-03, koordynator P-461 = (a), M2-036):** klucz `probka.zaproszenie_szerokosc` (en jak wyżej; 34 języki oczekujące, pl w pakiecie przeglądu P-422), styl `opis` pod polem szerokości (testID `probka-zaproszenie-szerokosc`), tylko przy „Hook”, wpisanych oczkach i pustej szerokości.

### design-spec.md:1223 (sekcja „Wiersz „Help” w Ustawieniach (M1-audytor-generalny-061; DEC-22 a)”)

| Wiersz „Help” w Ustawieniach | wzorzec wiersza jak „Privacy Policy” (rola link, otwiera stronę w przeglądarce, bez nowego ekranu i komponentu), bezpośrednio nad „Report a problem”; otwiera `baza` + `wsparcie` z `docs/wydanie/adres-strony.json`; testID `ustawienia-pomoc` | `ustawienia.pomoc` — Help |

---

## M3-TESTID-01 · Potwierdzenie testID „Dziś” i zakładek (2026-11-08, rola 04 fix; P-569, P-571, P-573, P-577)

Źródło nazw: tabela `e2e/README.md` w kopii 07 `claude/kopia-07-zebatka-2026-11-08` @ 96fb5c2 (wiersze `dzis-*`, `nav-*`). Makieta: `dzianina/ekrany.html` (ekrany `dzis`, `dzis-pierwszy`, stany `dzis-limit`, `dzis-cofnac`, `dzis-bez-miejsca`), zrzuty `dzianina/wzorce-zrzuty/dzis-*`. **Wynik: 12 z 12 nazw pasuje do makiety; zmian nazw brak.** Teksty en to propozycje do kluczy (klucze nadaje 09, P-578); „pl” = tekst makiety.

| testID | element na makiecie (`ekrany.html`) | VoiceOver (en / pl makiety) | uwagi 04 |
|---|---|---|---|
| `dzis-karta` | `section.karta` — karta „Kontynuuj”; ta sama klasa na `dzis-pierwszy` („Pierwszy licznik”) i `dzis-bez-miejsca` (`karta-bm`) | kontener, bez własnej etykiety; dzianina w środku ma rolę obrazu i opis danych | potwierdzone; jeden testID dla trzech wariantów karty (stan rozróżniają elementy w środku) |
| `dzis-projekt` | `h2.t-tytul` z nazwą projektu („Sweter Mgła”) | nazwa użytkownika | potwierdzone; **brak** na „Pierwszy licznik” (tytuł to nie nazwa projektu) i na `dzis-bez-miejsca` („Twoje projekty są tutaj”) |
| `dzis-wartosc` | `p.liczba` — liczba rzędów skończonych („42”) | „42” | potwierdzone; **testID tylko na samej liczbie** — podpis „rzędy gotowe” (`small` w makiecie) to osobny `Text`, inaczej `text: "47"` z reguły 4 nie trafi (jak `licznik-wartosc`, „sam numer”); cyfry w komórkach (P-563 2a) nie mogą rozbijać tekstu dostępności na znaki |
| `dzis-plus` | `a.plus` — okrągłe „+1” karty (72 pt) | jak `licznik-plus`: „+1 row…” / „Dodaj rząd” | potwierdzone; ta sama akcja co `licznik-plus` = ta sama etykieta (SP-09); brak na `dzis-limit` (tam `limit-zawczasu`) |
| `dzis-kontynuuj` | `a.kont` — „Kontynuuj ›” (karta „Kontynuuj”) i „Otwórz licznik ›” (`dzis-pierwszy`) | „Continue” / „Open counter” | potwierdzone; jedno znaczenie (do pełnego licznika) przy dwóch podpisach |
| `dzis-wybierz-projekt` | `a.kont` na `dzis-bez-miejsca` — „Wybierz projekt ›” | „Choose a project” | potwierdzone; osobny id słusznie — inne znaczenie (zakładka Projekty), ten sam element wizualny |
| `dzis-dni-darmowe` | ostatni `p.wolne` — „Zostały 3 z 5 darmowych dni robótkowych w listopadzie.”; na `dzis-limit` „Zostało 0 z 5…”; na `dzis-pierwszy` „5 darmowych dni robótkowych w każdym miesiącu.” | „{n} of 5 free crafting days left in {month}” | potwierdzone; **[DO USTALENIA] 07 rozstrzygnięte:** ten sam klucz co `ustawienia-dni-darmowe` (ta sama informacja = ten sam tekst, SP-09); na `dzis-pierwszy` osobny tekst (nowy klucz 09). Pierwszy `p.wolne` na `dzis-pierwszy` („Tu zobaczysz dni…”) to podpis tygodnia — bez tego testID |
| `nav-dzis` | `nav.zakladki`, 1. zakładka „Dziś” | „Today” (podpis zakładki) | potwierdzone; symbol `calendar.day.timeline.left` (pierwszy z `dzianina/design-spec.md:48`, P-577) — ocena okiem na urządzeniu otwarta [DO USTALENIA 08/04 przy kontroli p2, brak zrzutu z urządzenia] |
| `nav-projekty` | zakładka „Projekty” | „Projects” | potwierdzone jako zakładka; **na liczniku TO BE nie ma już wejścia do listy** — wstecz prowadzi do ekranu, z którego przyszło („‹ Dziś” na makiecie) = `nav-wstecz` (mapowanie w M3-TESTID-02) |
| `nav-narzedzia` | zakładka „Narzędzia” | „Tools” | potwierdzone |
| `nav-historia` | zakładka „Historia” (kalendarz dni) | „History” | potwierdzone; inne znaczenie niż `licznik-historia` (zmiany licznika) — dwa ekrany się nie spotykają (na liczniku zakładki ukryte, WD-1) |
| `nav-ustawienia` | `span.pik` z `zebatka` w nagłówku „Dziś” (P-571: jedyne miejsce) | „Settings” / „Ustawienia” | potwierdzone; symbol `gearshape`; cel 44 pt |

Bez testID na makiecie „Dziś” (07 ich nie używa): wiersz „co dalej”, tydzień, 4 kafle. Znalezisko nowe, nie naprawiane: kafle („Nowy projekt”, „Dodaj wzór”, „Włóczka i druty”, „Próbka”) to wejścia do przepływów z kontraktu; gdy 07 doda scenariusze przez kafle — propozycja `dzis-kafel-nowy-projekt`, `dzis-kafel-wzor`, `dzis-kafel-druty`, `dzis-kafel-probka`.

## M3-TESTID-02 · Licznik TO BE: akcje pod liczbą, „Projekt ›”, menu ••• (ZM-04, ZM-05; P-563) — dla 07 cz. 2 i p3a

Makieta: ekran `licznik` w `dzianina/ekrany.html`, zrzuty `dzianina/wzorce-zrzuty/licznik-*` (AX5: akcje jako lista pod notatką, „+1” nad „−1” na pełną szerokość). Menu •••: **makiety brak** — ZM-05 to menu systemowe (UIMenu), wygląd daje system; treść z `to-be.md` (ZM-05) i `oczko-warsztat` `redesign/M3-2026-11-05/role/04-as-is/to-be.md` (TB-2, TB-5). Zasada: testID zmienia się tylko, gdy zmienia się znaczenie elementu; ten sam testID w układzie zwykłym i AX5 (jeden komponent, zmienia się tylko układ).

### Akcje i nagłówek

| testID | element (makieta) | VoiceOver (en / pl) | stary → nowy, uwagi |
|---|---|---|---|
| `licznik-akcja-notatka` | 1. akcja „Notatka” (`note.text`) | „Note” / „Notatka” | **nowy**; otwiera arkusz notatki (dziś: `licznik-projekt` → `projekt-notatka`, scenariusz 57: 4 → 2 stuknięcia) |
| `licznik-notatka` | blok notatki nad akcjami (ikona + tekst) | treść notatki | bez zmiany id (notatka projektu na liczniku); nagłówek „Note” znika (ikona zamiast słowa) — etykieta = treść; 0 użyć w scenariuszach |
| `licznik-wzor` | 2. akcja „Wzór” (`doc.text`) | „Pattern” / „Wzór” | **bez zmiany id, szersze użycie:** akcja jest zawsze (dziś tylko przy wzorze); bez wzoru otwiera od razu menu źródeł (ZM-06, p3b). `licznik-menu` → `menu-wzor` (25 użyć, 10 plików) → `licznik-wzor`; krok `wzor-dodaj` znika w ścieżce bez wzoru (szczegóły w p3b) |
| `licznik-cel` | 3. akcja „Cel” (`flag`) | „Goal” / „Cel” | **nowy**; zastępuje `licznik-menu` → `menu-cel` (0 użyć). Co otwiera — STOP-1 niżej |
| `licznik-stoper` | 4. akcja „Stoper” (`stopwatch`) | stany jak dziś: „Start session timer” / „Session timer, {czas}, running…” / „…, paused…” | bez zmiany id i etykiet (17 użyć); przenosi się z paska nawigacji do rzędu akcji. Znalezisko nowe: wygląd akcji przy biegnącym stoperze (dziś kapsuła z czasem) nie jest narysowany — do projektu 04 przed p3a, menu kapsuły `stoper-*` bez zmian |
| `licznik-historia` | 5. akcja „Historia” (`clock.arrow.circlepath`) | „History” / „Historia” | bez zmiany id (6 użyć); znaczenie to samo (arkusz zmian licznika) |
| `licznik-projekt-wejscie` | „Projekt ›” nad tytułem | „Project: {nazwa}” / „Projekt ›” | **nowy** — STOP-2 (koordynator) niżej |
| `licznik-projekt` | tytuł `h1` z nazwą projektu | nazwa użytkownika | zostaje na nazwie (znaczenie w tabeli 07: „nazwa projektu”); 11 asercji tekstu bez zmian |
| `nav-wstecz` | „‹ Dziś” (wstecz do ekranu źródłowego: Dziś albo Projekty) | „Back” | `nav-projekty` na liczniku → `nav-wstecz` + (jeśli scenariusz chce listę) zakładka `nav-projekty` |
| `licznik-menu` | ••• w pasku (`ellipsis`) | „Counter options: row number, lock, finish” / „Więcej” | bez zmiany id (33 użycia); nowa etykieta (stara wymieniała name, goal, reminder) |

### Menu ••• (ZM-05: 5 pozycji, 2 grupy, reset na końcu)

| grupa | pozycja (en / pl) | symbol | testID | stary → nowy |
|---|---|---|---|---|
| korekta | „Enter the row number” / „Wpisz numer rzędu” | `number` | `menu-wpisz-wartosc` | bez zmian (15 użyć) |
| korekta | „What the number shows” / „Co pokazuje liczba” | `info.circle` | `menu-znaczenie` | bez zmian (5) |
| korekta | „Reset to 0…” / „Wyzeruj…” (destrukcyjna, z potwierdzeniem, ostatnia w grupie) | `arrow.counterclockwise` | `menu-zeruj` | nowy wiersz w tabeli 07 (id z DEC-05 a, dotąd poza tabelą) |
| stan | „Lock counter” / „Unlock counter” (jedna pozycja, dwa id jak `stoper-wstrzymaj`/`stoper-wznow`, F07-33) | `lock` / `lock.open` | `menu-zablokuj`, `menu-odblokuj` | nowe wiersze (DEC-05 a) |
| stan | „Mark project as finished” / „Oznacz projekt jako ukończony” | `checkmark.circle` | `menu-ukoncz` | bez zmian (6) |

- Grupy: menu systemowe dzieli je samo — **bez** `menu-grupa-*` (propozycje `menu-grupa-liczenie`/`-projekt` z DEC-05 a wycofane; 0 użyć).
- [DO USTALENIA 05/08] Czy pozycje UIMenu w RN niosą testID (`accessibilityIdentifier`). Jeśli nie: scenariusz wybiera pozycję po etykiecie z tej tabeli (reguła 2 `e2e/README.md`), a id zostają w tabeli jako nazwy pozycji; odstępstwo R8 (lista w ekranie zamiast menu systemowego, żeby zachować testID) wymagałoby decyzji — ZM-05 (a) wybrało menu systemowe.
- `arkusz-zamknij` w menu: menu systemowe nie ma „Close” (zamyka stuknięcie obok). 07 sprawdza swoje 13 użyć: te przy menu ••• → zamknięcie poza menu; przy arkuszu historii bez zmian.
- Usunięte z ••• (5 z 10): `menu-wzor` → `licznik-wzor`; `menu-cel` → `licznik-cel`; `menu-przypomnienie` (2), `menu-powtorzenie` (7), `menu-nazwa` (6) — **miejsce nieustalone w ZM-04/ZM-05**, STOP-1.

### STOP-1 (właściciel przez koordynatora; przepływ): gdzie trafiają nazwa, przypomnienie i długość powtórzenia

TO BE zabiera z ••• 5 pozycji, a podpisane akcje przejmują tylko wzór i cel. Ekran projektu (Projekt ›) nie ma dziś wierszy przypomnienia, powtórzenia ani zmiany nazwy. Bez decyzji 08 nie ma czego zbudować, a 07 — czego testować (15 użyć w 7 plikach: 15, 55, 12, 32, `nazwij-projekt*`, `ustaw-powtorzenie*`).

- **(a, rekomendacja) „Cel” otwiera menu systemowe** z 3 pozycjami ustawień liczenia części: „Set a goal for this part” (`menu-cel`), „Add a reminder” (`menu-przypomnienie`), „Set a repeat length” (`menu-powtorzenie`); id pozycji bez zmian (znaczenie to samo, zmienia się tylko kontener `licznik-menu` → `licznik-cel`). **„Name project and part” zostaje w ••• jako 6. pozycja**, pierwsza w grupie korekty (`menu-nazwa` bez zmian). Koszt: każda z 4 czynności 2 stuknięcia jak dziś; ••• 6 zamiast 5 (mieści się w teście akceptacyjnym 04-studio-projektowe-007: „≤ 6 pozycji w ≤ 2 grupach”), etykieta VoiceOver „Cel” → „Goal, reminder, repeat”. Zmiana scenariuszy: 9 stuknięć `licznik-menu` → `licznik-cel` przed przypomnieniem i powtórzeniem.
- **(b) ••• dokładnie 5 (ZM-05 literalnie):** „Cel” jak w (a); nazwa przez „Projekt ›” → ••• projektu → nowa pozycja „Rename” (`projekt-zmien-nazwe`, nowy wariant arkusza bez pola części). Koszt: nazwa 2 → 3 stuknięcia i zmiana ekranu (a nazwanie „Pierwszego licznika” to czynność każdego nowego użytkownika), nowa pozycja menu projektu do 08, 6 scenariuszy z `menu-nazwa` przepisanych.
- **(c) trzecia grupa w •••** (nazwa, przypomnienie, powtórzenie; 8 pozycji), „Cel” otwiera od razu arkusz celu — najmniej zmian w scenariuszach, ale cofa ZM-05 (10 → 8 zamiast 5).

### STOP-2 (koordynator, P-087; kontrakt, nie wygląd): „Projekt ›” i nazwa to w TO BE dwa elementy

Dziś `licznik-projekt` jest jednocześnie nazwą (11 asercji tekstu) i wejściem do ekranu projektu (21 stuknięć). Na makiecie wejściem jest „Projekt ›”, a nazwa to tytuł.
- **(a, rekomendacja)** `licznik-projekt` zostaje na nazwie, nowy `licznik-projekt-wejscie` na „Projekt ›” — zgodnie z zasadą „id za znaczeniem”; 07 zmienia 21 `tapOn` (mechanicznie, w tych samych plikach co cz. 2).
- **(b)** `licznik-projekt` przechodzi na „Projekt ›”, nazwa dostaje `licznik-nazwa-projektu` — 11 zmian zamiast 21, ale stary id zmienia znaczenie (asercja tekstu na „Projekt ›” przestaje sprawdzać nazwę), a etykieta „Project: {nazwa}” musiałaby nieść nazwę dla starych asercji.

### Dla 07 i 08 (p3a)
- AX5: te same id; lista akcji leży pod notatką i może być poza ekranem — przed stuknięciem w akcję `scrollUntilVisible` (jak reguła 10); scenariusz 30 (duży tekst) przechodzi z `menu-wzor` na `licznik-wzor`.
- Pozostałe id licznika (`licznik-plus`, `licznik-minus`, `licznik-wartosc`, `licznik-powtorzenie`, `kreski-podpis`, banery) poza zakresem tego zadania — bez zmian. `licznik-teraz-rzad` („Now working row 48”) na makiecie łączy się z podpisem liczby („rzędy gotowe · teraz rząd 43”) — 8 użyć; nowe znalezisko do kontroli 07 w cz. 2 (id zostaje, tekst asercji się zmieni).
