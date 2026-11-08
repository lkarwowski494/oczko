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
