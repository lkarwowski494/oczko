# Scenariusze E2E wersji 1 (Maestro) — kontrakt dla roli 08

Stan: rola 07, E3 (testy akceptacyjne przed kodem), 2026-10-25. Scenariusze **nie biegły** na symulatorze (brak aplikacji, Maestro i macOS w kontenerze). Czerwień i pierwsze poprawki pokaże pierwszy przebieg `jakosc-ios.yml` na macOS (pierwszy przebieg informacyjny, strategia §5). Stary katalog `.maestro/` należy do wersji 0.1.0 i nie jest częścią tego zestawu.

- Scenariusze: `e2e/scenariusze/NN-<id-kryterium>-<opis>.yaml`, podprzepływy `e2e/scenariusze/subflows/`, lista dla przebiegu lokalnego `e2e/scenariusze/config.yaml`.
- Podział na części (LPT, wagi): `scripts/ci/e2e-czesci.mjs` + `e2e/czesci.json`; test `tests/jakosc/e2e-czesci.test.ts`.
- Interpreter i kontrola statyczna: `tests/jakosc/maestro-runner.ts`, test `tests/jakosc/maestro-scenariusze.test.ts` (główny zestaw).
- appId: `com.apps4brew.knitting` (`app.json` → `ios.bundleIdentifier`). Język symulatora: angielski (en-US) — teksty z `docs/design/design-spec.md`.

## Zasady pisania (pilnuje `tests/jakosc/maestro-scenariusze.test.ts`)
1. `name:` zaczyna się od ID kryterium (`docs/jakosc/e0/kryteria.json` albo decyzji), tag z tym ID (ukośnik → myślnik: `BR-LIC-001/S1` → `BR-LIC-001-S1`), numer i ID w nazwie pliku.
2. Selektory po stałym `id:` (testID z tabeli niżej) albo po etykiecie VoiceOver z `design-spec.md`. Każde `id` ma wiersz w tabeli. `id` to wyrażenie regularne Maestro — tylko `[a-z0-9-]`, alternatywa `a|b` dozwolona.
3. Po każdej akcji zmieniającej stan (`launchApp`, `stopApp`, `tapOn`, `inputText`, `eraseText`, `pressKey`, `swipe`, `setOrientation`…) asercja (`assertVisible`, `assertNotVisible`, `extendedWaitUntil`, `assertTrue`). Wyjątki — łańcuchy: fokus pola → `eraseText` → `inputText` (znak po znaku) → asercja wartości pola; `stopApp` → `launchApp`; `pressKey: Home` → `launchApp: { stopApp: false }`.
4. Po stuknięciu zmieniającym licznik (`licznik-plus`, `licznik-minus`, `baner-serii-cofnij`, „+1 row…”, „−1 row”, „Undo N rows”) pierwsza asercja to `assertVisible: { id: "licznik-wartosc", text: "<wartość>" }`. Takie stuknięcie nigdy w bloku `retry`.
5. Scenariusz z asercją wartości licznika (także przez podprzepływ) ma tag **`stan-licznika`** — nie jest ponawiany (P-091 9a); status „w ponowieniu” liczy się osobno tylko dla pozostałych.
6. Klawiatura symulatora (Trening `.maestro/04-plank-stoper.yaml:13-29`, `32:79-96`, docs/38:112, L-013): wpis w `retry` (`tapOn` pola → `waitForAnimationToEnd` → `eraseText` → `inputText` po jednym znaku → `assertVisible` wartości pola); pole tekstowe chowa klawiaturę `pressKey: Enter`; **`hideKeyboard` zakazany** na polach z kolumną „liczbowa” — zapis przyciskiem arkusza (`formularz-zapisz`), pole tekstowe ostatnie w formularzu.
7. Zwykłe kolejne +1 rozdziela `runFlow: subflows/odstep.yaml` (> 2 s): okno strażnika serii RD-17 to 3 dodania w 2 s; seria celowo: `tapOn: { id: "licznik-plus", repeat: 3, delay: 150 }`.
8. `takeScreenshot` w punktach kontrolnych (nazwa `NN-opis`); zrzuty idą do artefaktu części i do logu (Trening: base64 przy porażce).
9. **Pomiar (P-374, po P-372):** po kroku krytycznym, który w #137 nie dał wyniku (07 lista po ofertach, 08 `import-gotowy`, 17 miniatura, 34 ekran projektu), scenariusz robi zrzut `pomiar-*` i **opcjonalny** odczyt panelu (`assertVisible … optional: true` z regexem na liczbę, np. `.*import [0-9]+ ms.*`). W ścieżce `opoznienie-*` czyta też opcjonalnie stany `*-ladowanie` / `*-blad`. Panel pomiaru nie jest nigdy twardą asercją ani celem `tapOn` (pilnuje `tests/jakosc/e2e-pomiar-374.test.ts`). Klasyfikacja po przebiegu: liczba na zrzucie i status WARNED/COMPLETED w logu Maestro, nie hipoteza.
10. **Wynik poza ekranem:** wynik operacji, który leży poniżej widocznej części (Ustawienia po ADR-0029: `eksport-wynik`, `eksport-licznosci`, `import-gotowy`, `import-wynik`; `eksport-wynik` spadł za ekran w #139, gdy doszedł panel `e2e-ocena-stan`), poprzedza `scrollUntilVisible`, nie samo `extendedWaitUntil`.

## Tagi
| Tag | Znaczenie |
|---|---|
| `podstawowy` | pakiet bramki TestFlight (P-091 9a): pierwsze +1 świeżej instalacji offline (01–03), +1/−1/cofnij (04), limit zawczasu (05), zakup i przywrócenie na sztucznym sklepie (06), okno „Uczciwe zasady” (07), eksport/import (08), start awaryjny ADR-0019 (09), projekt z częściami (33, P-198 Q3a), trwałość każdej zmiany licznika (10), baza bez sieci (11) i kosz 30 dni (36) — DEC-08 (a), M1-audytor-generalny-047; razem 13. Kontrakt: `tests/jakosc/e2e-pakiet-bramki.test.ts` (scenariusz z ID blokera wydania z `docs/brd/README.md` ma tag albo wyjątek nazwany) |
| `podstawowy` w pakiecie pełnym | porażka scenariusza z tagiem `podstawowy` czerwieni zadanie także przy `[e2e-pelny]`; porażka pozostałych to „czerwony-informacyjnie” w podsumowaniu (wyjście `bramka` planu części; F07-15, P-198 Q1a) |
| `stan-licznika` | asercja wartości licznika — bez ponowień (P-091 9a) |
| `ipad` | scenariusz iPada: tylko pakiet `ipad` (pozycja macierzy `e2e` na symulatorze iPada, przy `[e2e-pelny]` albo `[e2e-ipad]` w commicie); poza pakietem podstawowym i pełnym; bez bramki do pierwszego zielonego (P-225 Q1a) |
| `osobny-krok` | workflow uruchamia scenariusz w osobnym kroku swojej części (30: rozmiar tekstu AX5 przez `simctl ui … content_size`) |
| `wzor`, `zegarek`, `pomiar` | grupy informacyjne (filtr `--include-tags`); `pomiar` = wynik informacyjny bez progu (OP-17) |
| ID kryterium | np. `NFR-PIE-001`, `BR-LIC-001-S1`, `P-089-3a`, `ADR-0019` |

## Build E2E (dla 08 i workflowu `jakosc-ios.yml`)
Build Release na symulator bez podpisu (`CODE_SIGNING_ALLOWED=NO`, DS-07). Przełączniki ustawiane **tylko** w kroku buildu E2E (kontrola repo: poza tym krokiem nie występują; `sprawdz-workflowy.mjs`: workflow wydania ich nie ustawia). Ślady trybu testowego w `.ipa` wydania (napisy paneli E2E, testID `e2e-`, klucze `oczkoE2e*`, nazwy przełączników `EXPO_PUBLIC_*`) sprawdza `scripts/wydanie/slady-testowe.mjs`, który `scripts/wydanie/kontrola-ipa.sh` roli 10 woła na `main.jsbundle` (JAK-15, P-237):
| Zmienna buildu | Co włącza |
|---|---|
| `EXPO_PUBLIC_E2E=1` | odczyt argumentów startu `oczkoE2e*` (niżej), panele `e2e-*` (bez `t()`, jak „Test store” Treningu `app/paywall.tsx:108-113`), plik `e2e-sha-bazy` w Ustawieniach i na ekranie awaryjnym |
| `EXPO_PUBLIC_STORE_FAKE=1` | sztuczny sklep (wzór Treningu `lib/store-fake.ts`): ceny testowe, zakup bez okna Apple, `e2e-sklep-wygas`; transakcje zapisane w pliku buildu E2E, żeby przeżyły restart [DO USTALENIA 08: Trening trzyma je w pamięci] |
| `EXPO_PUBLIC_WATCH_FAKE=1` | udawany zegarek: `Zegarek.wyslijStan` zapisuje stan do panelu `e2e-zegarek-stan` (transferUserInfo nie działa w symulatorze, ADR-0009) |
| `EXPO_PUBLIC_ICLOUD_FAKE=1` | atrapa silnika iCloud w procesie (port `Synchronizacja`, bez sieci; zapis wysłanych rekordów i usunięcia strefy w pliku buildu E2E); czytają tylko `src/platforma/icloud.ts`, `icloud-atrapa.ts`, `tryb-e2e.ts` (kontrola `ATRAPA-ICLOUD`; P-230, moduly.md „Atrapa silnika w E2E”) |
Przełączniki czyta wyłącznie `src/platforma/tryb-e2e.ts` (E2E, zegarek) i adapter sklepu `src/platforma/sklep*.ts` (sztuczny sklep); kontrole `TRYB-E2E` i `SZTUCZNY-SKLEP` w `scripts/jakosc/kontrole-repo.mjs`, a workflow wydania nie może ich ustawiać (`sprawdz-workflowy.mjs`).

Argumenty startu (`launchApp: arguments:`; na iOS Maestro przekazuje je jako argumenty procesu — w RN czytelne przez `Settings.get(klucz)` z domeny argumentów `NSUserDefaults` [DO USTALENIA: potwierdzić w pierwszym przebiegu]); bez `EXPO_PUBLIC_E2E=1` ignorowane:
| Argument | Wartość | Kontrakt |
|---|---|---|
| `oczkoE2eTeraz` | czas lokalny ISO bez strefy, np. `2026-11-07T20:00:00` | port `Zegar` (Z07-18): `teraz()` = podana chwila + czas, który upłynął od startu procesu (zegar **biegnie**: RD-17 liczy odstępy); `strefa` = strefa symulatora; `dzien` z podanej daty |
| `oczkoE2eOknoStraznika` | liczba sekund, 0 < s ≤ 600, np. `6` | okno strażnika serii (RD-17) zamiast `STRAZNIK_OKNO_S` (2 s); scenariusze 04 i 12 (czas 3 stuknięć Maestro zależy od maszyny: #131 2,45 s, #135 4,18 s; E2E-A4, P-358). Zła wartość albo build bez E2E: 2 s. Domena z oknem 2 s ma testy jednostkowe — E2E sprawdza podłączenie |
| `oczkoE2eSiec` | `brak` | adapter sieci zwraca „brak połączenia”, każde wywołanie sieci = błąd w logu (NFR-OFF-001) |
| `oczkoE2eAwariaStartu` | `przed-kamieniem` | wymuszona awaria procesu przed kamieniem milowym ADR-0019 (start liczony jako nieudany); po zapisie stanu startu pusty ekran z `testID` `e2e-awaria-startu` |
| `oczkoE2eIcloud` | `wlaczony` \| `wylaczony` \| `brak-konta` \| `brak-miejsca` \| `konflikt` | atrapa iCloud (tylko z `EXPO_PUBLIC_ICLOUD_FAKE=1`): stan konta; `konflikt` = przy starcie druga wersja pierwszego licznika: wartość +5, urządzenie „iPad (test)”, teraz − 1 min (P-230) |
| `oczkoE2eSkrzynka` | `pdf` | przed pierwszym ekranem testowy PDF (jak `e2e-wzor-pdf`) jako zlecenie bez projektu w skrzynce App Group (P-230 Q2a) |
| `oczkoE2eSzerokoscOkna` | liczba pt, np. `375` | aplikacja rysuje się w kontenerze tej szerokości (układ compact na iPadzie; P-225 Q2a — nazwany wyjątek: bez klasy rozmiaru systemu; prawdziwe okno na urządzeniu, P-226) — **kontrakt 07 do dopisania w moduly.md / tryb-e2e.ts (08)** |

## testID (propozycja 07 dla 08; zmiana nazwy = zmiana scenariuszy)
Wiersze `projekt-*`, `kosz-*`, `co-dalej-*`, `projekty-kosz`, `projekty-ostatnia-praca`, `licznik-nastepna-czesc`, `menu-znaczenie` i `formularz-*` arkuszy projektu dopisała rola 08 w partii 5 według propozycji 04 fix-5 („Dla 08”, P-183) — do przeglądu 07. Potwierdzenia usuwania to alerty systemowe (bez testID; scenariusz stuka w tekst przycisku). Wiersze grup B i D (`licznik-stoper`, `stoper-*`, `sesje-*`, `historia-*`, `narzedzia-*`, `probka-*`, `projekt-sesje`, `projekt-zdjecia`, `projekt-probka`, `zapas-filtr`, `zdjecie-usun`, `karta-udostepnij`) dopisała rola 07 z „Dla 08” 04 fix-6 (P-191, P-205); usunięte `menu-sesja`, `sesja-trwa`, `sesja-zakoncz`, `menu-zdjecia`, `zdjecia-licznik`, `nav-zapas` (zastąpione przez 04 fix-6; F07-17). Id `nav-narzedzia`, `zapas-dlugosc`, `zapas-jednostka-yd`, `zapas-przeliczone` (spoza listy 04) koordynator przyjął jako kontrakt 07 (2026-10-26, po zamknięciu 04 fix-6); wdraża 08. Wiersze `licznik-wzor`, `wzor-dodaj-film`, `wzor-przelacz`, `wzor-menu`, `wzor-obroc`, `wzor-usun`, `wzor-gumka`, `wzor-pioro`, `wzor-cofnij-rysunek`, `wzor-link-pole`, `wzor-film-wiersz`, `wzor-czeka-siec` — z „Dla 07” 04 fix-7 (grupa W, `docs/design/fix7-2026-10-26.md`), dopisane przed listą w design-spec (nazwany wyjątek 04). Tak samo grupy R i I (`udostepnij-*`, `skrzynka*`, `icloud-*`, `licznik-konflikt`, `usun-z-icloud`; „Dla 07 (grupy R i I)”, P-229).

Wiersze `dzis-*`, `nav-dzis` i rozszerzone znaczenie `nav-projekty`, `nav-narzedzia`, `nav-historia`, `limit-zawczasu`, `limit-oferta-link` dopisała rola 07 przed p2 (07-e2e, 2026-11-08; ZM-18, P-563 (4a), P-565): `docs/design/testid.md` nie miał propozycji testID „Dziś”, nazwy do potwierdzenia przez 04 (zmiana nazwy = zmiana scenariuszy). Start scenariuszy: `subflows/start-czysty.yaml` i `restart.yaml` przechodzą przez „Dziś” do licznika (jedno miejsce zmiany), `start-czysty-dzis.yaml` i `restart-dzis.yaml` zatrzymują się na „Dziś”.

Licznik TO BE (07 cz. 2, 2026-11-08; ZM-04, ZM-05, P-580, P-581, P-583; kontrakt `docs/design/testid.md` M3-TESTID-02): akcje pod liczbą `licznik-akcja-notatka`, `licznik-wzor` (zastępuje `menu-wzor`), `licznik-cel` (menu systemowe z `menu-cel`, `menu-przypomnienie`, `menu-powtorzenie`), `licznik-stoper`, `licznik-historia` — przed stuknięciem w akcję `scrollUntilVisible` (AX5 i mały ekran, testid.md:158); „Projekt ›” = `licznik-projekt-wejscie`, `licznik-projekt` zostaje na nazwie; menu ••• (6 pozycji) bez `menu-grupa-*`; od P-586 (a) arkusz z „Cancel” `arkusz-zamknij`, zamyka go `subflows/zamknij-menu.yaml`; z licznika do listy `nav-wstecz` + zakładka `nav-projekty`. Pilnuje `tests/jakosc/e2e-licznik-to-be.test.ts`. Do p3a scenariusze z tymi id są czerwone na iOS z właściwego powodu (lista: `docs/jakosc/e2e-dzis/stan-2026-11-08.md`, „Do zazielenienia w p3a”). [DO USTALENIA 05/08] czy pozycje UIMenu niosą testID — jeśli nie, scenariusze wybiorą pozycję po etykiecie z tej tabeli (reguła 2).

Wiersze M3 p4b i p7 (07-e2e-m3, 2026-11-08; P-596, P-599; stan partii `docs/programista/m3-p4b-stan.md`, `m3-p7-stan.md`): `zdjecie-zamknij`, `zdjecie-udostepnij` (istniał bez wiersza), `znacznik-radio`, `komunikat-znak`, `projekt-menu-lista`, `projekt-czesc`, `projekt-licznik`, `projekt-licznik-wiersz`, `projekt-miniatura`, `kafelek-ikony`, `symbol-druty`, `symbol-dzien`, `ustawienia-grupa`, `ustawienia-stan-danych`, `ustawienia-polityka`, `ustawienia-subskrypcja`, `ustawienia-wibracje(-wiersz)`, `ustawienia-ekran-nie-gasnie(-wiersz)`, `oferty-karta`, `oferty-miesiac(-dzien)`, `oferty-kafel-*`, `oferty-ikona-dzien` — nazwy z kodu 08 (zmiana nazwy = zmiana scenariuszy). Elementy ukryte przed VoiceOver (znaczniki, kafelki, miniatury) nie są celem `tapOn`; wybór sprawdza `selected: true` na wierszu, błąd — tekst komunikatu. Od p7 plany „Oczko Pro” leżą pod kartą i kafelkami: przed asercją planu `scrollUntilVisible` (reguła 10; 06, 07).

Kolumna „tekst / etykieta”: tekst albo etykieta VoiceOver z `design-spec.md`; „—” = tekst ustala 04 (Z07-05), scenariusz używa tylko id. Kolumna ostatnia: klawiatura pola (`liczbowa`, `tekstowa`) albo puste.

| id | ekran | element | tekst / etykieta | klawiatura |
|---|---|---|---|---|
| `dzis-karta` | „Dziś” (ZM-18, p2) | karta K-B: „Pierwszy licznik” (świeża instalacja), „Kontynuuj” (ostatni licznik) albo karta bez ostatniego miejsca (`dzis-bez-miejsca-*`) | — (04, Z07-05) | |
| `dzis-projekt` | „Dziś” | nazwa projektu na karcie „Kontynuuj” (jak `licznik-projekt`; brak na „Pierwszy licznik”) | „Harbor” | |
| `dzis-wartosc` | „Dziś” | liczba rzędów skończonych na karcie (ta sama wartość co `licznik-wartosc`); po `dzis-plus` pierwsza asercja (reguła 4) | „0”, „47” | |
| `dzis-plus` | „Dziś” | „+1” karty — to samo zdarzenie co `licznik-plus` (zapis, wibracja, strażnik limitu i serii; NFR-PIE-001, ER-68); brak przy limicie zawczasu | — (04) | |
| `dzis-kontynuuj` | „Dziś” | „Kontynuuj ›” (karta „Kontynuuj”) i „Otwórz licznik ›” (karta „Pierwszy licznik”) — jedno stuknięcie do pełnego licznika albo strony wzoru w tym samym powiększeniu (P-563 (4a)) | — (04) | |
| `dzis-wybierz-projekt` | „Dziś” | „Wybierz projekt ›” na karcie bez ostatniego miejsca (projekty są) → zakładka Projekty (P-564, P-565) | — (04) | |
| `dzis-dni-darmowe` | „Dziś” | linia wolnych dni (tylko bez Pro), bez odnośnika „Oczko Pro” (P-563 (10a), ER-70) | „0 of 5 free crafting days left in November” (klucz jak `projekty-dni-darmowe` — [DO USTALENIA] 04) | |
| `nav-dzis` | pasek zakładek (p2) | zakładka „Dziś” | — (04) | |
| `licznik-plus` | licznik | przycisk +1 (strefa ≥ 168 pt) | „+1 row…”, z instrukcją: „+1 row, when row 12 is done. Row 12: decrease at both ends” | |
| `licznik-minus` | licznik | przycisk −1 (72 × 72 pt) | „−1 row” | |
| `licznik-wartosc` | licznik | duża liczba rzędów skończonych (sam numer, z separatorem tysięcy regionu) | „47” | |
| `licznik-teraz-rzad` | licznik | numer bieżącego rzędu; TO BE (M3-TESTID-02, testid.md:159): łączy się z podpisem liczby („rzędy gotowe · teraz rząd 43”), tekst en od 04 — asercje `.*row N` (numer, nie brzmienie) | „Now working row 48” (AS IS) | |
| `licznik-powtorzenie` | licznik | linia powtórzenia („{nazwa}: repeat N, row R of D”, klucz `licznik.powtorzenie`; M1-034) | „repeat 3, row 1 of 8” (z nazwą powtórzenia z przodu, jeśli jest) | |
| `licznik-calosc` | licznik | podpis całości części (BR-LIC-018/S1; 033-T1) | „Przód in total: 20 rows” (część nazwana; projekt roboczy: „Whole piece: 20 rows”) | |
| `licznik-notatka` | licznik | blok notatki projektu nad akcjami (ikona + tekst; TO BE bez nagłówka „Note”, M3-TESTID-02) | treść notatki | |
| `licznik-projekt` | licznik | nazwa projektu (tytuł; P-580 (a): tylko nazwa — wejściem do projektu jest `licznik-projekt-wejscie`) | nazwa użytkownika | |
| `licznik-projekt-wejscie` | licznik | „Projekt ›” nad tytułem → ekran projektu (P-580 (a), M3-TESTID-02; p3a) | „Project: {nazwa}” | |
| `licznik-menu` | licznik | menu ••• — menu systemowe (ZM-05, P-581 (a): 6 pozycji w 2 grupach; korekta: `menu-nazwa`, `menu-wpisz-wartosc`, `menu-znaczenie`, `menu-zeruj`; stan: `menu-zablokuj`/`menu-odblokuj`, `menu-ukoncz`); od P-586 (a) własny arkusz; zamyka go „Cancel” `arkusz-zamknij` w `subflows/zamknij-menu.yaml` (przebieg 3: stuknięcie obok nie ma celu) | „Counter options: name, row number, lock, finish” (`licznik.menu_wiecej_a11y`; scenariusz 29 po etykiecie) | |
| `licznik-historia` | licznik | 5. akcja pod liczbą „Historia” (arkusz zmian licznika; ZM-04) — przed stuknięciem `scrollUntilVisible` (AX5, testid.md:158) | „History” | |
| `licznik-akcja-notatka` | licznik | 1. akcja pod liczbą „Notatka” → arkusz notatki (ZM-04, M3-TESTID-02; p3a) | „Note” | |
| `licznik-cel` | licznik | 3. akcja pod liczbą „Cel” → menu systemowe: `menu-cel`, `menu-przypomnienie`, `menu-powtorzenie` (P-581 (a); p3a) | „Goal, reminder, repeat” | |
| `kreski-podpis` | licznik | podpis nad kreskami sesji | „Marks this session: 14 rows since 19:52” (godzina w formacie regionu; P-176) | |
| `baner-serii` | licznik; „Dziś” pod kartą (`dzis-cofnac-*`) | baner strażnika RD-17 | „Added 3 rows in 1 s. Undo?” | |
| `baner-serii-cofnij` | licznik; „Dziś” | przycisk w banerze | „Undo 3 rows” | |
| `pasek-blokady-odblokuj` | licznik | „Unlock” w pasku „Counter locked · Unlock” | „Unlock” | |
| `blad-zapisu` | licznik | komunikat błędu zapisu | „Couldn’t save that row. It’s still on screen; try again.” | |
| `blad-sieci` | dowolny | jakikolwiek komunikat o braku sieci (nie powinien istnieć) | — | |
| `limit-zawczasu` | licznik; karta „Dziś” (zamiast `dzis-plus`, ER-70, `dzis-limit-*`) | komunikat zamiast +1/−1 | „No free crafting days left in {month}. Counting is paused until {date}. Your {n} rows and everything else are kept.” | |
| `limit-oferta-link` | licznik; komunikat limitu na karcie „Dziś” (jedyny odnośnik Pro na „Dziś”, P-565) | odnośnik pod liczbą | „Oczko Pro removes the limit” | |
| `arkusz-zamknij` | arkusze (historia, formularze) | przycisk zamknięcia arkusza; menu systemowe ••• i „Cel” go nie mają (ZM-05) | „Close” | |
| `historia-lista` | historia | lista zmian z godziną | — | |
| `historia-cofnij-ostatnia` | historia | „Undo” przy ostatniej zmianie (P-091 3a) | „Undo” | |
| `menu-nazwa` | menu ••• | 1. pozycja grupy korekty (P-581 (a): zostaje w •••) | „Name project and part” | |
| `menu-cel` | menu „Cel” (`licznik-cel`) | pozycja (P-581 (a); nieużywana jeszcze w scenariuszach) | „Set a goal for this part” | |
| `menu-wpisz-wartosc` | menu ••• | pozycja wpisania wartości (F-45) | „Enter the row number” | |
| `menu-zeruj` | menu ••• | „Reset to 0…” — destrukcyjna, z potwierdzeniem, ostatnia w grupie korekty (DEC-05 (a), M3-TESTID-02) | „Reset to 0…” | |
| `menu-zablokuj` | menu ••• | „Lock counter” (licznik odblokowany; jedna pozycja z `menu-odblokuj`, dwa id jak `stoper-wstrzymaj`/`stoper-wznow`, F07-33) | „Lock counter” | |
| `menu-odblokuj` | menu ••• | „Unlock counter” (licznik zablokowany) | „Unlock counter” | |
| `menu-przypomnienie` | menu „Cel” (`licznik-cel`) | pozycja (P-581 (a): przeniesiona z •••) | „Add a reminder (“every N rows”)” | |
| `menu-powtorzenie` | menu „Cel” (`licznik-cel`; P-581 (a): przeniesiona z •••) | pozycja „Set a repeat length” (F-05; tylko licznik rzędów; istnieje w `src/ekrany/MenuProjektu.tsx:36`, dopisane przez 07-jakosc-033 A) | „Set a repeat length” | |
| `powtorzenie-dlugosc-pole` | arkusz „Set a repeat length” | pole długości powtórzenia (`Formularze.tsx`; 033-T1, wniosek 07-jakosc-033 A) | „Rows in one repeat” | liczbowa |
| `menu-ukoncz` | menu ••• | ukończenie | „Mark project as finished” | |
| `formularz-nazwa-projektu` | formularz nazwy | pole nazwy | etykieta „Project” | tekstowa |
| `formularz-zapisz` | formularze w arkuszach | przycisk zapisu (zawsze widoczny) | „Save” | |
| `wpisz-wartosc-pole` | wpisanie wartości | pole numeru rzędu | „Rows already finished” | liczbowa |
| `przypomnienie-od-rzedu` | przypomnienie | pole | „Starting on row” | liczbowa |
| `przypomnienie-co-ile` | przypomnienie | pole | „Every … rows” | liczbowa |
| `przypomnienie-ile-razy` | przypomnienie | pole | „How many times” | liczbowa |
| `przypomnienie-co-robic` | przypomnienie | pole (ostatnie w formularzu) | „What to do” | tekstowa |
| `przypomnienie-podglad` | przypomnienie | podgląd planu rzędów | „You’ll be reminded on rows: …” | |
| `przypomnienie-zapisz` | przypomnienie | przycisk | „Save reminder” | |
| `ukonczenie-karta` | ukończenie | karta z pytaniem o włóczkę (U-9) | — | |
| `ukonczenie-gotowe` | ukończenie | „Done” | „Done” | |
| `licznik-stoper` | licznik | stoper sesji — TO BE 4. akcja pod liczbą (ZM-04; przed stuknięciem `scrollUntilVisible`), dawniej w pasku: ikona (bez sesji), po starcie kapsuła z czasem — ten sam id, stan w etykiecie (04 fix-6 B, P-191 P1a) | „Start session timer” / „Session timer, {czas}, running. Pause or stop” / „…, paused. Resume or stop” | |
| `stoper-wstrzymaj` | menu kapsuły | Pause timer (stoper biegnie) | „Pause timer” | |
| `stoper-wznow` | menu kapsuły | Resume timer (stoper wstrzymany; ta sama pozycja menu co Pause, osobny testID — F07-33) | „Resume timer” | |
| `stoper-zatrzymaj` | menu kapsuły | Stop timer (bez potwierdzenia) | „Stop timer” | |
| `stoper-inny-potwierdz` | alert sesji w innym projekcie (P-191 P3a) | Stop and start here | „Stop and start here” | |
| `stoper-sprawdz` | licznik | linia „zapomniany stoper” z odnośnikiem do korekty (P-191 P5a) | „Check the end time” | |
| `projekt-sesje` | ekran projektu, grupa „Time” | wiersz „Sessions” (P-191 P4a) | „Sessions” | |
| `sesje-lista` | Sessions | lista sesji; wiersz z etykietą `sesje.wiersz_a11y` | „{data}, {start} to {koniec}, {czas}. Edit” | |
| `sesje-do-sprawdzenia` | Sessions | druga linia sesji do sprawdzenia (powtarzalna) | „Stopped after {n} hours. Check the end time.” | |
| `formularz-sesja-start` | arkusz korekty sesji | wiersz początku (systemowy wybór daty i godziny) | — | |
| `formularz-sesja-koniec` | arkusz korekty sesji | wiersz końca | — | |
| `historia-kalendarz` | History | kalendarz miesiąca (P-191 P6a) | — | |
| `historia-dzien` | History | grupa wybranego dnia | — | |
| `historia-tydzien` | History | blok tygodnia | — | |
| `historia-miesiac` | History | blok miesiąca | — | |
| `narzedzia-wloczki` | Tools | wiersz „Yarn” (04 fix-6 D, P-191 P7a) | „Yarn” | |
| `narzedzia-druty` | Tools | wiersz „Needles and hooks” | — | |
| `narzedzia-probka` | Tools | kalkulator „Swatch calculator” | „Swatch calculator” | |
| `probka-oczka` | Swatch | oczka w próbce (na 10 cm domyślnie przy układzie metrycznym) | „Stitches in your swatch” | liczbowa |
| `probka-szerokosc` | Swatch | szerokość docelowa | „Width you want, cm” | liczbowa |
| `probka-wynik-oczka` | Swatch | wynik „liczba oczek” (na żywo, bez przycisku) | „{n} stitches” | |
| `probka-wynik-grubosc` | Swatch | blok kategorii grubości | — | |
| `projekt-probka` | ekran projektu, „Details” | wiersz próbki projektu (U-10) | — | |
| `zapas-filtr` | zapas | chipy kategorii (rola radio) | „All”, „Weight {n}” | |
| `zapas-dlugosc` | formularz włóczki | długość motka — kontrakt 07 (koordynator 2026-10-26) | „Length per skein” | liczbowa |
| `zapas-jednostka-yd` | formularz włóczki | przełącznik jednostki długości na jardy — kontrakt 07 (koordynator 2026-10-26) | „yd” | |
| `zapas-przeliczone` | formularz włóczki | przeliczenie pod polem (RD-03) — kontrakt 07 (koordynator 2026-10-26) | „≈ {n} m” | |
| `projekt-zdjecia` | ekran projektu | grupa „Photos” (P-191 P9a) | „Photos” | |
| `zdjecie-usun` | podgląd zdjęcia | Delete photo (alert z potwierdzeniem, bez kosza) | „Delete photo” | |
| `karta-udostepnij` | karta ukończenia | Share: obraz 1080 × 1350 bez EXIF/GPS (P-191 P10a) | „Share” | |
| `nav-projekty` | pasek zakładek (p2) | zakładka „Projekty” (ZM-18); na liczniku od p3a nie ma wejścia do listy — scenariusz wraca `nav-wstecz`, potem zakładka (P-583) | „Projects” | |
| `nav-ustawienia` | „Dziś” (zębatka `gearshape`; P-571, P-554, to-be WD-1) | jedyne wejście do Ustawień — bez drugiego miejsca w zakładce Projekty; scenariusze wchodzą przez `subflows/otworz-ustawienia.yaml` (pilnuje `tests/jakosc/e2e-otworz-ustawienia.test.ts`) | „Settings” | |
| `nav-narzedzia` | lista projektów; pasek zakładek (p2) | wejście do „Tools” (zapas, druty, kalkulator; P-191 P7a) — kontrakt 07, przyjęty przez koordynatora 2026-10-26; po p2 zakładka „Narzędzia” (to samo znaczenie, ZM-18) | „Tools” | |
| `nav-wstecz` | ekrany wtórne; licznik (P-583: „‹ Dziś” / „‹ Projekty” — wstecz do ekranu źródłowego) | systemowy „Back” | „Back” | |
| `projekty-lista` | lista projektów | lista | „Projects” | |
| `projekty-wiersz` | lista projektów | wiersz projektu (powtarzalny, `index`) | nazwa · część · rząd | |
| `projekty-nowy` | lista projektów | nowy projekt | „New project” | |
| `projekty-dni-darmowe` | lista projektów | licznik dni (tylko bez Pro) | „3 of 5 free crafting days left in November” | |
| `projekty-ostatnia-praca` | lista projektów | etykieta ostatniej pracy w wierszu projektu w toku (powtarzalna; bez progu, P-182, P-183 (1a) — zastępuje `projekty-uspione`) | „last worked 41 days ago” | |
| `projekty-kosz` | lista projektów | wejście do „Recently deleted” (tylko gdy kosz niepusty, P-183 (2a)) | „Recently deleted” | |
| `projekty-ukonczone` | lista projektów | sekcja ukończonych | „Finished” | |
| `projekt-dodaj` | ekran projektu | „+”: Add part / Add counter | — | |
| `projekt-dodaj-czesc` | ekran projektu (menu „+”) | Add part | „Add part” | |
| `projekt-dodaj-licznik` | ekran projektu (menu „+”) | Add counter | „Add counter” | |
| `projekt-menu` | ekran projektu | menu ••• | — | |
| `projekt-edytuj` | ekran projektu (menu •••) | tryb Edit części i liczników | „Edit parts and counters” | |
| `projekt-gotowe` | ekran projektu (tryb Edit) | koniec trybu Edit | „Done” | |
| `projekt-usun-czesc` | ekran projektu (tryb Edit) | ⊖ przy części (powtarzalny) | — | |
| `projekt-usun-licznik` | ekran projektu (tryb Edit) | ⊖ przy liczniku (powtarzalny) | — | |
| `projekt-zrob-taka-sama` | ekran projektu (menu •••) | Make another like this | „Make another like this” | |
| `projekt-usun` | ekran projektu (menu •••) | Delete project… | „Delete project…” | |
| `projekt-wznow` | ekran projektu (menu •••, ukończony) | Resume project | „Resume project” | |
| `projekt-linia-terminu` | ekran projektu | linia terminu (tylko z terminem; klucz `projekt.termin_dzis`, M1-034) | „Done by Oct 31, today 3 of 10 rows” | |
| `projekt-postep` | ekran projektu | tekst postępu w procentach (tylko część z celem; 033-T1) | „51% done” | |
| `projekt-notatka` | ekran projektu | notatka (otwiera arkusz) | tekst notatki albo „Add a note” | |
| `projekt-narzedzie` | ekran projektu | druty albo szydełko (otwiera arkusz) | „4 mm (US 6)” | |
| `projekt-termin` | ekran projektu | termin „Done by” (otwiera arkusz) | krótka data albo „None” | |
| `licznik-nastepna-czesc` | licznik | „Next part” przy osiągniętym celu (BR-LIC-011/S1) | „Next part” | |
| `co-dalej-druga` | arkusz „What’s next?” | druga część pary | „A second {część}” | |
| `co-dalej-nowa` | arkusz „What’s next?” | nowa część | „New part” | |
| `kosz-lista` | Recently deleted | lista pozycji kosza | — | |
| `kosz-przywroc` | Recently deleted | „Restore” (powtarzalny) | „Restore” | |
| `formularz-nazwa-czesci` | arkusz części / nowego projektu | nazwa części (08 partia 5) | „Part” | tekstowa |
| `formularz-cel-czesci` | arkusz części | cel części (08 partia 5) | „Rows in this part (optional)” | liczbowa |
| `formularz-dodaj-czesc` | arkusz nowego projektu | dodanie pola części | „Add part” | |
| `formularz-nazwa-licznika` | arkusz licznika | nazwa licznika (08 partia 5) | „Name” | tekstowa |
| `formularz-notatka` | arkusz notatki | pole notatki, wielowierszowe (08 partia 5) | „Note for {projekt}” | tekstowa |
| `formularz-rozmiar-mm` | arkusz narzędzia | rozmiar w mm, dziesiętna (08 partia 5) | „Size in mm” | liczbowa |
| `formularz-wyczysc` | arkusz narzędzia | Clear | „Clear” | |
| `formularz-termin-data` | arkusz terminu | systemowy wybór daty (inline) | — | |
| `formularz-termin-brak` | arkusz terminu | No date | „No date” | |
| `menu-znaczenie` | menu ••• licznika | What the number shows (F-09) | „What the number shows” | |
| `wybor-znaczenie-skonczone` | arkusz „What the number shows” | opcja radia `Wybor` (NOC-4: wdrożone w `src/ekrany/Arkusz.tsx` i `FormularzeProjektu.tsx` (wyjątek P-404); test `tests/ekrany/wybor-testid.test.tsx`) | „Rows finished” | |
| `wybor-znaczenie-w-trakcie` | arkusz „What the number shows” | opcja radia `Wybor` (NOC-4, jak wyżej; id bez `_` z wartości `w_trakcie`, zasada 2) | „The row I’m on” | |
| `wybor-rodzaj-rzedy` | arkusz „Add counter” | opcja radia `Wybor` rodzaju licznika (NOC-4, jak wyżej) | „Rows” | |
| `wybor-rodzaj-oczka` | arkusz „Add counter” | opcja radia `Wybor` rodzaju licznika (NOC-4, jak wyżej) | „Stitches” | |
| `wybor-narzedzie-druty` | arkusz narzędzia | opcja radia `Wybor` (NOC-4, jak wyżej) | „Needles” | |
| `wybor-narzedzie-szydelko` | arkusz narzędzia | opcja radia `Wybor` (NOC-4, jak wyżej) | „Hook” | |
| `ustawienia-jezyk` | Ustawienia | wiersz „Language” (F-36, P-190) | „Language” | |
| `jezyk-auto` | Language | „Same as phone” (radio; etykieta z „, selected” przy wyborze) | „Same as phone” / „Same as phone, selected” | |
| `jezyk-pl` | Language | wiersz języka (wzorzec `jezyk-<kod>`, nazwa własna języka; tu polski) | „Polski” / „Polski, selected” | |
| `ustawienia` | Ustawienia | kontener ekranu (ScrollView) | — | |
| `ustawienia-dni-darmowe` | Ustawienia | licznik dni (tylko bez Pro) | „4 of 5 free crafting days left in November” | |
| `ustawienia-oczko-pro` | Ustawienia | wejście do ofert (KP-13) | „Oczko Pro” | |
| `ustawienia-eksport` | Ustawienia | eksport wszystkich danych | — | |
| `ustawienia-pomoc` | Ustawienia | wiersz „Help” (link do strony wsparcia z FAQ; DEC-22 a, M1-audytor-generalny-061) | „Help” | |
| `ustawienia-zglos` | Ustawienia | wiersz „Report a problem” (033-T1, wniosek 07-jakosc-033 B) | „Report a problem” | |
| `ustawienia-ocen` | Ustawienia | wiersz „Rate Oczko” (033-T1, wniosek 07-jakosc-033 B) | „Rate Oczko” | |
| `ustawienia-import` | Ustawienia | import archiwum | — | |
| `ustawienia-usun-wszystko` | Ustawienia | usunięcie wszystkich danych (BR-DAN-009) | — | |
| `potwierdz-usun-wszystko` | arkusz „Delete all data” (trasa `/usun-wszystko`, P-268) | potwierdzenie usunięcia — w pasku przycisków arkusza, zawsze widoczny | — | |
| `usun-wszystko-anuluj` | arkusz „Delete all data” (P-268) | Cancel — zamyka arkusz bez zmian | „Cancel” | |
| `oferty-ekran` | oferty | kontener ekranu ofert | nagłówek „Oczko Pro” | |
| `oferty-plan-miesieczny` | oferty | plan (rola radio) | „Monthly · $0.99 / month. Renews every month until you cancel in your Apple ID settings.” (cena ze sklepu; podpis w etykiecie, M1-092) | |
| `oferty-plan-roczny` | oferty | plan (rola radio) | „Yearly · $6.99 / year. Renews every year until you cancel in your Apple ID settings.” | |
| `oferty-plan-dozywotni` | oferty | plan (rola radio) | „Lifetime · $14.99 once. Pay once. Nothing renews.” | |
| `oferty-kup` | oferty | zakup wybranego planu | — | |
| `oferty-przywroc` | oferty | przywrócenie zakupów | „Restore purchases” | |
| `oferty-nie-teraz` | oferty | neutralna odmowa | „Not now” | |
| `oferty-zamknij` | oferty | zamknięcie po zakupie | „Close” | |
| `oferty-stan-pro` | oferty | stan „masz Pro” (KP-03) | — | |
| `okno-uczciwe-zasady` | okno „Uczciwe zasady” (P-089 3a) | kontener okna | — (04, Z07-05) | |
| `uczciwe-zasady-zamknij` | okno „Uczciwe zasady” | główny przycisk (zamyka) | — | |
| `uczciwe-zasady-plany-pro` | okno „Uczciwe zasady” | link do planów Pro | — | |
| `eksport-wynik` | eksport | wynik eksportu | — | |
| `eksport-licznosci` | eksport | liczności archiwum | „1 project, 1 counter, 2 changes…” (propozycja) | |
| `import-gotowy` | import | stan „gotowy” maszyny importu | — | |
| `import-zastap` | import | przycisk „Replace what’s here” w oknie wyboru scal / zastąp (033-T1) | „Replace what’s here” | |
| `import-licznosci` | import | liczności pliku przed decyzją | jak `eksport-licznosci` | |
| `import-scal` | import | wybór „scal” (P-091 6a) | — | |
| `import-wynik` | import | wynik (`… 0 new …` przy powtórnym imporcie) | — | |
| `karta-pro-po-imporcie` | import | karta z planami Pro — w 1.0 nie występuje; scenariusz 08 sprawdza jej brak po imporcie własnej kopii (P-113 Q2a, P-117 Q1a) | — | |
| `tryb-awaryjny` | ekran awaryjny (ADR-0019) | kontener | — (04, 09) | |
| `awaryjny-zapisz-kopie` | ekran awaryjny | „Zapisz kopię danych” | — | |
| `awaryjny-sprobuj-normalnie` | ekran awaryjny | „Spróbuj normalnie” | — | |
| `awaryjny-zglos-problem` | ekran awaryjny | „Zgłoś problem” (F-57) | — | |
| `awaryjny-licznosci` | ekran awaryjny | liczności zapisanej kopii | jak `eksport-licznosci` | |
| `zapas-lista` | zapas („Tools” → „Yarn”) | lista włóczek | — | |
| `zapas-dodaj` | zapas | „+” dodanie włóczki (04 fix-6 D) | „Add yarn” | |
| `zapas-nazwa` | formularz włóczki | pole nazwy | — | tekstowa |
| `zapas-szukaj` | zapas | wyszukiwarka | — | tekstowa |
| `zapas-wynik` | zapas | wiersz wyniku | nazwa włóczki | |
| `zapas-brak-wynikow` | zapas | pusty wynik | — | |
| `zdjecia-dodaj` | ekran projektu, grupa „Photos”; formularz włóczki | kafel dodania zdjęcia → arkusz systemowy Take photo / Choose from library (04 fix-6 D, P-191 P9a) | „Add photo” | |
| `zdjecia-miniatura` | ekran projektu, grupa „Photos” | miniatura (powtarzalna, `index`) | „Photo 1 of 1” (`zdjecia.a11y`) | |
| `wzor-dodaj` | wzór | dodanie wzoru | — | |
| `wzor-widok` | wzór | widok dokumentu (jeden naraz, OG-07) | — | |
| `wzor-pasek-licznika` | wzór | pasek licznika pod wzorem (telefon pionowo; poziomo i na iPadzie to `wzor-kolumna-licznika`) | — | |
| `licznik-podpis` | wzór, pasek licznika | podpis liczby w trybie „rząd w trakcie” (P2-5b, zamiast `licznik-teraz-rzad`) | „current row” | |
| `wzor-zrodlo` | wzór | rodzaj źródła | „PDF”, „Photo”, „Web page”, „Word document” | |
| `wzor-strona` | wzór | numer strony | „Page 1 of 3” (etykieta VoiceOver „Pattern page 1 of 3” — asercje `.*[Pp]age 1 of .*`, przebieg 40446976426) | |
| `wzor-zakreslacz` | wzór | przełącznik zakreślacza (`accessibilityState.selected`) | — | |
| `wzor-zakreslenia` | wzór | liczba zakreśleń | „1 highlight”, „0 highlights” | |
| `licznik-wzor` | licznik | 2. akcja pod liczbą „Wzór” — zawsze (ZM-04, P-580; zastępuje `menu-wzor`); bez wzoru do p3b → ekran z `wzor-dodaj`, w p3b od razu menu źródeł (ZM-06) | „Pattern” | |
| `wzor-dodaj-film` | ekran projektu, grupa wzorów | dodanie odnośnika do filmu (P-218 (4): film poza wzorem) | „Add video link” | |
| `wzor-przelacz` | wzór | tytuł z menu wzorów (≥ 2 wzory; jeden wzór naraz, P-218 (3)) | „Pattern: {nazwa}. Switch pattern” | |
| `wzor-menu` | wzór | menu ••• | „Pattern options” | |
| `wzor-zmien-nazwe` | wzór, menu ••• | Rename — otwiera arkusz „Rename” (design-spec W1a; partia 6 e779602) | „Rename” | |
| `wzor-nazwa-pole` | arkusz „Rename” (wzór) | nazwa wzoru, wypełniona obecną; pusta nie zapisuje (partia 6 e779602) | „Pattern name” | tekstowa |
| `wzor-obroc` | wzór, menu ••• | Rotate page (zmiana formatu dozwolona, P-218 (2)) | „Rotate page” | |
| `wzor-usun` | wzór, menu ••• | Delete pattern… | „Delete pattern…” | |
| `wzor-gumka` | pasek rysowania | gumka | „Eraser” | |
| `wzor-pioro` | pasek rysowania (iPad) | pióro | „Pen” | |
| `wzor-cofnij-rysunek` | pasek rysowania | cofnięcie ostatniej kreski | „Undo last stroke” | |
| `wzor-link-pole` | arkusz „Web page” | pole adresu strony wzoru | „Link to the pattern page” | tekstowa |
| `wzor-miniatura` | ekran projektu, wiersz wzoru (`projekt-wzor`) | miniatura pierwszej strony; ukryta dla VoiceOver (partia 6 e779602) | — | |
| `wzor-film-wiersz` | ekran projektu | wiersz „Video” | „Video, {nazwa}” | |
| `wzor-film-menu` | ekran projektu | widoczny przycisk „•••” w wierszu „Video”: menu „Change link” / „Remove link” (porządek 04-studio-projektowe-006; „Remove link” pyta o potwierdzenie) | „Video link options” | |
| `wzor-film-pole` | arkusz „Video link” | pole adresu filmu (przy zmianie wypełnione; zły adres → `wzor.link_blad`; partia 6 92df7ea, P-283) | „Link” | tekstowa |
| `wzor-czeka-siec` | ekran projektu | wiersz strony czekającej na sieć | „Waiting for the internet to save the web page.” | |
| `udostepnij-projekt` | arkusz rozszerzenia „Udostępnij do Oczka” | wiersz projektu (powtarzalny, `index`, rola radio; 04 fix-7, grupa R) | „{nazwa}, last worked {…}” | |
| `udostepnij-nowy-projekt` | arkusz rozszerzenia | New project | „New project” | |
| `udostepnij-jako` | arkusz rozszerzenia (link) | przełącznik Pattern / Video link | „Add as” | |
| `skrzynka` | lista projektów | arkusz „N patterns to add” | — | |
| `skrzynka-projekt` | arkusz skrzynki | wiersz projektu (`index`) | nazwa projektu | |
| `icloud-przelacznik` | Data and sync | przełącznik iCloud (`accessibilityState.checked`; 04 fix-7, grupa I) | „Sync with iCloud” | |
| `icloud-stan` | Data and sync | grupa stanu (`role=status`) | tekst stanu | |
| `icloud-problem` | Data and sync | linia problemu (brak konta, miejsca, niepełna historia) | nagłówek linii | |
| `icloud-konflikty` | Data and sync | wiersz „N counters have two versions” | — | |
| `licznik-konflikt` | licznik | linia konfliktu z „Choose” (NFR-DAN-003) | „Two versions of this counter…” | |
| `licznik-konflikt-wybierz` | licznik | „Choose” w linii konfliktu (08 partia 7) | „Choose” | |
| `icloud-konflikt` | arkusz „Two versions of {licznik}” | kontener arkusza | — | |
| `icloud-konflikt-wybor-0` | arkusz konfliktu | pierwszy wybór wersji (kolejność nie jest kontraktem — scenariusz łączy id `…-0` i `…-1` alternatywą z etykietą; P-250) | etykieta VoiceOver `dane.konflikt_a11y`: „Keep {n} rows from {urządzenie}, {godzina}” | |
| `icloud-konflikt-wybor-1` | arkusz konfliktu | drugi wybór wersji (jak wyżej) | jak wyżej | |
| `usun-z-icloud` | arkusz „Delete all data” | przełącznik „Also delete from iCloud” | „Also delete from iCloud” | |
| `nav-historia` | lista projektów; pasek zakładek (p2) | wejście do „History” (kalendarz dni; F-59); po p2 zakładka „Historia” (to samo znaczenie, ZM-18, ER-71) | „History” | |
| `historia` | History | kontener ekranu (ScrollView) | — | |
| `historia-dzien-2026-11-03` | History | komórka dnia 3 XI 2026 (wzorzec `historia-dzien-RRRR-MM-DD`; rola przycisku, `selected`; etykieta „Nov 3 · 3 rows” tylko dla dnia wybranego z pracą, inne dni: „Nov 4”; scen. 64) | „Nov 3 · 3 rows” | |
| `historia-dzien-2026-11-04` | History | komórka dnia 4 XI 2026 (dzień bez pracy; scen. 64) | „Nov 4” | |
| `ukonczenie-gotowe` | karta ukończenia | „Done” — zamknięcie karty = chwila systemowej prośby o ocenę (BR-DAN-012/S1; scen. 65) | „Done” | |
| `dane-zastapiono` | import po „Replace” (Ustawienia) | kontener wyniku „Data replaced” (BR-DAN-006/S3; scen. 66) | „Data replaced” | |
| `wzor-kierunek` | wzór | karta „Which way do rows go on this page?” przy pierwszym „Mark row” (P-126 3a; scen. 62) | „Which way do rows go on this page?” | |
| `wzor-zaznacz` | wzór | ikona „Mark row” w pasku wzoru (033-T1; pierwszy raz pyta o kierunek: `wzor-kierunek`) | „Mark row” | |
| `wzor-znacznik-pasek` | wzór | pasek ustawiania znacznika rzędu (kierunek, krokowiec, „Done”; BR-WZR-003, F-26; scen. 62) | — | |
| `wzor-znacznik-rzad` | wzór, pasek znacznika | numer rzędu schematu, na którym stoi znacznik (RD-21; scen. 62) | „12” | |
| `wzor-znacznik-gotowe` | wzór, pasek znacznika | „Done” — zamknięcie paska | „Done” | |
| `wprowadzenie` | — | ekran wprowadzenia (NIE może istnieć przed pierwszym +1) | — | |
| `zdjecie-zamknij` | podgląd zdjęcia (p4b) | „Close” w prawym górnym rogu (makieta `zdjecie`); scenariusze nie zamykają podglądu (42 kończy usunięciem) | „Close” | |
| `zdjecie-udostepnij` | podgląd zdjęcia | Share z symbolem `square.and.arrow.up` (arkusz systemowy — scenariusze go nie otwierają) | „Share” | |
| `znacznik-radio` | arkusze z `Wybor`; plany „Oczko Pro” (p4b) | znacznik wyboru 28 pt (AX1+ 40), powtarzalny, ukryty przed VoiceOver — wybór sprawdza `selected: true` na wierszu (`oferty-plan-*`, „Needles”, „Stitches”) | — | |
| `komunikat-znak` | komunikat błędu (próbka, formularze włóczki i narzędzia, oferty, Usuń wszystko; p4b) | kółko „!” przy zdaniu błędu, ukryte przed VoiceOver; zdanie = etykieta widoku z rolą alert (bez „!”) | — | |
| `projekt-menu-lista` | ekran projektu (p4b) | pływająca lista menu „+” i ••• pod paskiem (pozycje `projekt-dodaj-*`, `projekt-edytuj`, `projekt-zrob-taka-sama`, `projekt-usun`, `projekt-wznow` bez zmian) | — | |
| `projekt-czesc` | ekran projektu (p4b) | wiersz części (powtarzalny); etykieta z tekstów wiersza — 33, 59 i `dodaj-czesc-cel` wybierają część po etykiecie („Back, …”) | „{część}, {opis}” (np. „Back, …”) | |
| `projekt-licznik` | ekran projektu (p4b) | wiersz licznika części (powtarzalny; gdy część ma > 1 licznik albo w trybie Edit) | nazwa licznika · opis | |
| `projekt-licznik-wiersz` | ekran projektu (p4b) | obwiednia wiersza licznika z wcięciem (⊖ w trybie Edit + `projekt-licznik`) | — | |
| `projekt-miniatura` | ekran projektu (p4b) | miniatura dzianiny w wierszu części — ukryta przed VoiceOver i od AX1 | — | |
| `kafelek-ikony` | Ustawienia, Narzędzia (p4b) | kafelek ikony wiersza 32 pt (AX1+ 44), powtarzalny, dekoracyjny (ukryty przed VoiceOver) | — | |
| `symbol-druty` | Narzędzia (p4b) | rysunek drutów w wierszu Druty | — | |
| `symbol-dzien` | Ustawienia (p4b) | ikona dnia w wierszu Oczko Pro | — | |
| `ustawienia-grupa` | Ustawienia (p7, ZM-07) | grupa listy grupowanej (powtarzalna) | — | |
| `ustawienia-stan-danych` | Ustawienia (p7) | wiersz „Data and sync” (`subflows/otworz-stan-danych.yaml` stuka po etykiecie) | „Data and sync” | |
| `ustawienia-polityka` | Ustawienia (p7) | wiersz Privacy Policy (rola link; 68 po etykiecie) | „Privacy Policy” | |
| `ustawienia-subskrypcja` | Ustawienia (p7) | „Manage subscription” (tylko przy trwającej subskrypcji) | „Manage subscription” | |
| `ustawienia-wibracje` | Ustawienia | przełącznik wibracji (rola switch) | „Vibration” | |
| `ustawienia-wibracje-wiersz` | Ustawienia (p7) | wiersz z przełącznikiem wibracji (ikona + tekst + `ustawienia-wibracje`) | — | |
| `ustawienia-ekran-nie-gasnie` | Ustawienia | przełącznik „ekran nie gaśnie” (rola switch; P-585) | „Keep screen on while counting” | |
| `ustawienia-ekran-nie-gasnie-wiersz` | Ustawienia (p7) | wiersz z przełącznikiem „ekran nie gaśnie” | — | |
| `oferty-karta` | oferty (p7) | karta z opisem Pro i ilustracją miesiąca | „Count rows on as many days as you like. Everything else stays the same.” | |
| `oferty-miesiac` | oferty (p7) | ilustracja miesiąca, ukryta przed VoiceOver | — | |
| `oferty-miesiac-dzien` | oferty (p7) | komórka dnia ilustracji (powtarzalna, 30) | — | |
| `oferty-kafel-dzien` | oferty (p7, P-563 (11)) | kafel „Every crafting day” | „Every crafting day. Count whenever you craft, with no monthly limit.” | |
| `oferty-kafel-urzadzenia` | oferty (p7) | kafel urządzeń | „No limit on any device. iPhone, iPad, and Apple Watch.” | |
| `oferty-kafel-rodzina` | oferty (p7; tylko z Family Sharing) | kafel „For your family” | „For your family. You can share it with your family through Family Sharing.” | |
| `oferty-kafel-dane` | oferty (p7) | kafel danych | „Your data stays yours. Projects, patterns, and history stay, with Pro or without.” | |
| `oferty-ikona-dzien` | oferty (p7) | ikona kafla „Every crafting day” (SVG `IkonaDnia`) | — | |
| `e2e-nigdy` | — | element, którego nie ma (podprzepływ `odstep.yaml`) | — | |
| `e2e-sklep-wygas` | oferty (build E2E) | „Test store: expire access” | bez `t()` | |
| `e2e-sha-bazy` | Ustawienia i ekran awaryjny (build E2E) | SHA-256 pary pliku bazy i `-wal` (64 znaki hex), liczone **bez checkpointu**; ukryty w trakcie liczenia (F07-19, P-203 Q6a) | bez `t()` | |
| `e2e-wal-bajty` | Ustawienia i ekran awaryjny (build E2E) | rozmiar pliku `-wal` w bajtach („0”, gdy brak) — dowód, że SHA liczono przy niepustym WAL (F07-19) | bez `t()` | |
| `e2e-awaria-startu` | pusty ekran wymuszonej awarii startu (build E2E, `oczkoE2eAwariaStartu`) | tło papieru po zapisie „start w toku” (ADR-0019) | bez tekstu | |
| `e2e-icloud-wyslane` | Data and sync (build E2E, atrapa iCloud) | liczba rekordów wysłanych przez atrapę od instalacji (P-230) | bez `t()` | |
| `e2e-icloud-usuniete` | Data and sync (build E2E, atrapa iCloud) | „tak” / „nie” — usunięcie strefy po „Also delete from iCloud” | bez `t()` | |
| `e2e-pliki-zachowaj-eksport` | Ustawienia (build E2E) | zachowanie ostatniego eksportu w katalogu testowym | bez `t()` | |
| `e2e-pliki-stan` | Ustawienia (build E2E) | „Saved: N file” | bez `t()` | |
| `e2e-ocena-stan` | Ustawienia (build E2E; 033-T1, hak F-64) | „rating requests: N · last address: <adres albo none>” — N = wywołania `portOceny.popros` (`app/ukonczenie.tsx`), adres = ostatni z `systemAplikacji.otworzAdres` (np. wiersz „Rate Oczko”); stan w pamięci procesu (restart zeruje); `src/kompozycja/e2e/ocena-stan.tsx` | bez `t()` | |
| `e2e-pliki-importuj-ostatni` | Ustawienia (build E2E) | import ostatniego eksportu bez okna Pliki | bez `t()` | |
| `e2e-zegarek-stan` | licznik (build E2E, `EXPO_PUBLIC_WATCH_FAKE`) | ostatni `StanZegarka` jako tekst | bez `t()` | |
| `e2e-pomiar-plus` | licznik (build E2E) | „p95 … ms, n = 20; first … ms” (NFR-WYD-001; pierwsze stuknięcie osobno, P-456) | bez `t()` | |
| `e2e-pomiar-operacji` | Ustawienia (pod `e2e-pliki-importuj-ostatni`) i menu „Add photo” (build E2E; 08 R, E2-137-A3/A4) | ms ostatnich operacji: „import N ms”; „recode N ms · photo N ms · project N ms”; „… running”, gdy trwa; „… (error)” po błędzie. Scen. 08 i 17 robią zrzut `pomiar-*` i odczyt **opcjonalny** (P-374, bez nowego źródła czerwieni, P-367) | bez `t()` | |
| `e2e-pomiar-ladowania` | ekran projektu (build E2E; 08 P, E2-137-A1) | „first data N ms” — od zamontowania ekranu do pierwszych danych; podprzepływ `dodaj-czesc-cel` (34, 35): zrzut `pomiar-ekran-projektu` + odczyt opcjonalny | bez `t()` | |
| `e2e-ramki-kolumny` | kolumna licznika wzoru na iPadzie poziomo (build E2E; diagnoza 024, P-629) | „kolumna x,y,w,h; blok …; przyciski …; minus …; plus …; okno WxH fs S” — `onLayout` względem rodzica, „-” bez pomiaru; scen. 44: zrzut `44-ipad-poziomo-ramki`, `copyTextFrom` + `console.log` przed „+1”; `src/kompozycja/e2e/ramki.tsx`; do usunięcia po poprawce 024 | bez `t()` | |
| `projekty-ladowanie` | lista projektów (08 P, E2-137-A1) | stan do końca pierwszego odczytu („Loading…”); scen. 07 czyta go opcjonalnie w ścieżce `opoznienie-lista-po-ofertach` | „Loading…” | |
| `projekty-blad` | lista projektów | stan błędu odczytu | „Couldn’t load this.” | |
| `projekty-ponow` | lista projektów (stan błędu) | „Try again” | „Try again” | |
| `projekt-ladowanie` | ekran projektu (08 P, E2-137-A1) | stan do końca pierwszego odczytu; podprzepływ `dodaj-czesc-cel` czyta go opcjonalnie w ścieżce `opoznienie-ekran-projektu` | „Loading…” | |
| `projekt-blad` | ekran projektu | stan błędu odczytu | „Couldn’t load this.” | |
| `projekt-ponow` | ekran projektu (stan błędu) | „Try again” | „Try again” | |
| `e2e-wzor-pdf` | dodanie wzoru (build E2E) | plik PDF testowy pisany w kodzie (2 strony tekstu Helvetica) | bez `t()` | |
| `e2e-wzor-pdf-skan` | dodanie wzoru (build E2E) | prawdziwy wycinek skanu z OCR `tests/dane/wzory/corbould-1879-s16-17.pdf` (domena publiczna, strategia §4; P-439; scen. 21) | bez `t()` | |
| `e2e-wzor-zdjecie` | dodanie wzoru (build E2E) | zdjęcie strony testowe | bez `t()` | |
| `e2e-wzor-www` | dodanie wzoru (build E2E) | zapisana strona testowa | bez `t()` | |
| `e2e-wzor-word` | dodanie wzoru (build E2E) | plik .docx testowy | bez `t()` | |
| `e2e-wzor-word-tabela` | dodanie wzoru (build E2E) | plik .docx z tabelą (korpus W1, P-282; scen. 53) | bez `t()` | |
| `e2e-wzor-word-obraz` | dodanie wzoru (build E2E) | plik .docx z obrazem (korpus W1, P-282; scen. 53) | bez `t()` | |
| `e2e-zdjecie-testowe` | dodanie zdjęcia (build E2E) | zdjęcie testowe (EXIF GPS celowo) | bez `t()` | |

## Kryterium → scenariusz
| Kryterium (poziom E2E-symulator, `kryteria.json`) | Scenariusz |
|---|---|
| NFR-PIE-001 | `01-nfr-pie-001-pierwsze-liczenie.yaml` |
| BR-LIC-001/S1 | `02-br-lic-001-s1-pierwsze-uruchomienie.yaml` |
| BR-LIC-001/S2 | `03-br-lic-001-s2-pierwszy-rzad-jednym-stuknieciem.yaml` |
| NFR-DAN-002 | `10-nfr-dan-002-kazda-zmiana-trwala.yaml` |
| BR-DAN-001/S1 | `11-br-dan-001-s1-baza-bez-sieci.yaml` |
| BR-ZAK-006/S4 | `12-br-zak-006-s4-bez-oferty-w-pracy.yaml` |
| KP-10 | `13-kp-10-zakup-tylko-po-dzialaniu.yaml` |
| BR-LIC-004/S4 | `14-br-lic-004-s4-gest-od-krawedzi.yaml` |
| BR-LIC-015/S2 | `15-br-lic-015-s2-przypomnienie-zegarek.yaml` |
| BR-ZAP-004/S2 | `16-br-zap-004-s2-zapas-bez-zasiegu.yaml` |
| BR-PRJ-003/S1 | `17-br-prj-003-s1-zdjecie-etykiety.yaml` |
| BR-PRJ-011/S1 | `18-br-prj-011-s1-start-po-zamknieciu.yaml` |
| BR-PRJ-011/S2 | `19-br-prj-011-s2-powrot-z-innej-aplikacji.yaml` |
| BR-PRJ-016/S2 | `20-br-prj-016-s2-powrot-po-przerwie.yaml` |
| BR-WZR-001/S1 | `21-br-wzr-001-s1-pdf-z-plikow.yaml` |
| BR-WZR-002/S1 | `22-br-wzr-002-s1-zdjecie-strony.yaml` |
| BR-WZR-005/S1 | `23-br-wzr-005-s1-poziomo-na-stojaku.yaml` |
| BR-WZR-007/S1 | `24-br-wzr-007-s1-strona-www-bez-sieci.yaml` |
| BR-WZR-007/S2 | `25-br-wzr-007-s2-plik-word.yaml` |
| BR-WZR-008/S1 | `26-br-wzr-008-s1-zakreslenie.yaml` |
| BR-WZR-008/S3 | `27-br-wzr-008-s3-przewijanie-bez-zakreslacza.yaml` |
| NFR-OFF-001 | `28-nfr-off-001-bez-sieci.yaml` |
| NFR-DOS-001 | `29-nfr-dos-001-voiceover.yaml` |
| NFR-DOS-002 | `30-nfr-dos-002-duzy-tekst.yaml` |
| NFR-WYD-001 | `31-nfr-wyd-001-reakcja-licznika.yaml` |
| NFR-SYS-001 | `32-nfr-sys-001-nowy-ios.yaml` |
| BR-PRJ-001/S1 | `33-br-prj-001-s1-nowy-projekt-z-czesciami.yaml` (pełny; do podstawowego po 1. zielonym, P-198 Q3a) |
| BR-LIC-011/S1, BR-PRJ-014/S1 | `34-br-lic-011-s1-nastepna-czesc-blizniak.yaml` |
| BR-DNI-005/S1 | `35-br-dni-005-s1-termin-cel-dnia.yaml` |
| BR-DAN-008/S1 | `36-br-dan-008-s1-usun-przywroc-z-kosza.yaml` (podstawowy od DEC-08 (a), P-198 Q3a) |
| P-191 (P1a) stoper | `37-p-191-stoper-start-pauza-stop.yaml` |
| BR-PRJ-013/S1 (częściowo) | `38-br-prj-013-s1-korekta-sesji.yaml` |
| P-190 język | `39-p-190-jezyk-trwaly.yaml` |
| BR-ZAP-001/S1 | `40-br-zap-001-s1-wloczka-w-jardach.yaml` |
| BR-KAL-003/S1, BR-KAL-001/S1 | `41-br-kal-003-s1-probka-w-calach.yaml` |
| P-191 (P9a) zdjęcie | `42-p-191-zdjecie-usun.yaml` |
| BR-PRJ-015/S2 (połączenie; EXIF/GPS w Node) | `43-br-prj-015-s2-udostepnienie-karty.yaml` |
| BR-WZR-005/S2 (iPad) | `44-br-wzr-005-s2-ipad-poziomo-pionowo.yaml` (pakiet `ipad`) |
| BR-WZR-005/S3 (częściowo: strona i licznik; znacznik — ADR-0011 w Node) | `45-br-wzr-005-s3-obrot-strona-licznik.yaml` |
| BR-WZR-005/S4, NFR-UKL-001 (zrzuty, P-225 Q3c) | `46-br-wzr-005-s4-waskie-okno.yaml` (pakiet `ipad`) |
| BR-WZR-008/S4 (część palcem; rysik — test `pencilOnly`, P-226) | `47-br-wzr-008-s4-ipad-bez-rysika.yaml` (pakiet `ipad`) |
| BR-DAN-002/S3 | `48-br-dan-002-s3-icloud-wylaczony.yaml` |
| NFR-DAN-003, BR-DAN-002/S2 (atrapa) | `49-nfr-dan-003-konflikt-icloud.yaml` |
| P-230 problemy konta iCloud | `50-p-230-icloud-problemy-konta.yaml` |
| BR-DAN-009 z iCloud | `51-br-dan-009-usun-takze-z-icloud.yaml` |
| P-230 skrzynka rozszerzenia | `52-p-230-skrzynka-rozszerzenia.yaml` |
| P-282 Word: tekst, tabela, obraz (informacyjnie) | `53-p-282-word-tabela-obraz.yaml` |
| BR-PRJ-007/S1 (F-20; częściowo: bez przypomnień i narzędzia — S1 „Oraz”, S2 w Node) | `61-br-prj-007-s1-zrob-taka-sama.yaml` (informacyjnie) |
| BR-WZR-003/S1, S2, S6 (F-26; S3–S5 i koniec strony w Node/na urządzeniu) | `62-br-wzr-003-s1-znacznik-idzie-z-licznikiem.yaml` (informacyjnie) |
| BR-DAN-010/S1, S3 (F-57; S2 częściowo: arkusz udostępniania opcjonalnie) | `63-br-dan-010-s1-zglos-problem-podglad.yaml` (informacyjnie) |
| BR-DNI-001/S1–S2, BR-DNI-002/S1, BR-DNI-003/S1, S3 (F-59; znacznik dnia tylko na zrzucie) | `64-br-dni-001-s1-kalendarz-dzien-podsumowanie.yaml` (informacyjnie) |
| BR-DAN-012/S1, S3 (F-64; wywołanie systemowe i adres recenzji nie do odczytu w E2E) | `65-br-dan-012-s1-prosba-o-ocene.yaml` (informacyjnie) |
| BR-DAN-006/S3 „Replace” (F-32) | `66-br-dan-006-s3-zastap-kopia-przed.yaml` (informacyjnie) |
| BR-LIC-012/S1 w pasku pod wzorem (F-09, P2-5b) | `67-br-lic-012-s1-podpis-w-pasku-wzoru.yaml` (informacyjnie) |
| BR-ZAK-004/S1 (F-36, zadanie 002: wiersz „Privacy Policy” w Ustawieniach, tylko widoczność i zrzut) | `68-br-zak-004-s1-polityka-prywatnosci-w-ustawieniach.yaml` (informacyjnie) |
| (przepływy pakietu podstawowego spoza poziomu E2E) BR-LIC-002/S1–S3, BR-LIC-019/S1, BR-LIC-003/S2 · BR-ZAK-006/S1, KP-13 · BR-ZAK-001/S1, PR-09 · P-089 (3a) · BR-DAN-005/S1, BR-DAN-006/S1, P-113 Q2a (bez karty) · ADR-0019 | `04`, `05`, `06`, `07`, `08`, `09` |

Kryteria „tylko-urządzenie” (18, `kryteria.json`) nie mają scenariusza — lista telefonu (strategia §8, TT-01–TT-09) albo „Nie sprawdzono”.

## Przebiegi nocne
- 2026-10-26/27: pełny pakiet (`[e2e-pelny]`, iPhone + iPad) — partia 5 (STOP E2) i scenariusze 44–52 (07 fix-3); uruchomienie koordynatora (P-241, P-251).
- 2026-11-02 (07-jakosc-033 B, P-378): scenariusze 61–66 (F-20, F-26, F-57, F-59, F-64, „Replace”) — informacyjnie do pierwszego zielonego przebiegu (P-091); nie biegły (brak macOS w sesji pisania), ocena po przebiegu nocnym.
- 2026-11-02 (przebieg nocny 2/3.11, 07-jakosc NOC-3, P-400): scenariusz 67 (BR-LIC-012/S1 w pasku pod wzorem, P2-5b — podpis „current row”) — informacyjnie do pierwszego zielonego przebiegu (P-091); nie biegł (brak macOS w sesji pisania).
- 2026-11-02 (przebieg nocny, 07-jakosc NOC-4): kontrakt testID opcji radia `Wybor` (6 wierszy `wybor-*`) i test przed kodem w `tests/akceptacja/ekrany/`; scenariusze 54, 56, 60, 67 stukają jeszcze po tekście — przejście na `id` po wdrożeniu przez 08 (lista „Dla 08” w raporcie). **Zastąpione** wierszem niżej (cb6f1ec, P-404): scenariusze stukają już po `id`.
- 2026-11-02 (07-jakosc NOC-4, wyjątek P-404): testID `wybor-*` wdrożone w kodzie przez 07 (tylko propsy, bez zmiany zachowania); scenariusze 54, 56, 60, 67 stukają opcje po `id`.
