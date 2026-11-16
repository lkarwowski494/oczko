# Recenzja niezależna CH: BX9 (1b888e99..d7642f33) przed scaleniem

Rola 08-programista w trybie audit: kod autora tylko czytałem, nic w nim nie zmieniałem. Sesja CH, 2026-11-16. Start: `claude/bx9-porcja2b-2026-11-16` @ d7642f33, HEAD zgodny z poleceniem. Raportu autora (`docs/jakosc/bx9-dowod-czerwony.txt`) nie czytałem. Z sekcji BX9 w `docs/jakosc/bx-stan.md` widziałem tylko 3 linie (158–160): wyszły w `grep` numerów BX-034…039, już po sformułowaniu znalezisk niżej.
Środowisko: Linux, Node 22.23.4, `npm ci` kod 0, `tsc --noEmit` kod 0. Nie ma tu macOS ani symulatora, więc żadnego scenariusza Maestro nie uruchomiłem. Scenariusze oceniam z lektury YAML, katalogu PU i kodu aplikacji oraz ze źródła Maestro `cli-2.12.1` (wersję przypina `.github/workflows/jakosc-ios.yml:339`). Źródło pobrałem z raw.githubusercontent.com 2026-11-16: `YamlFluentCommand.kt`, `YamlElementSelector.kt`, `Filters.kt`, `Orchestra.kt`.

## Werdykt: Z UWAGAMI

Gałąź można scalić. Zmiana interpretera tylko poszerza obsługę: z 105 scenariuszy wynik zmienił się wyłącznie dla nowych 103 i 104. Pięć nowych scenariuszy ma tag `oczekujacy`: nie wchodzą do bramki, a zbiór plików bramkowych się nie zmienił. Katalog zmienia tylko kolumnę Pokrycie. Trzy z pięciu scenariuszy trzeba jednak poprawić, zanim zdejmie się z nich tag `oczekujacy`. Bez tego zielony przebieg przeniesie PU do klasy A na pustym albo częściowym dowodzie. Najpoważniejsze jest CH-01: scenariusz 105 nie może paść na tym, czego dotyczy PU-071.

| ID | Poziom | Realność | Plik | Skrót |
|---|---|---|---|---|
| CH-01 | P1 | realny | `e2e/scenariusze/105-pu-071-ekrany-poza-wzorem-zostaja-w-pionie.yaml:18` | Asercje `below` są prawdziwe w pionie i w poziomie, więc „zostaje w pionie” jest niesprawdzone. Hipotezę z nagłówka (:3-4) obala kod. |
| CH-02 | P2 | realny | `e2e/scenariusze/103-pu-066-znacznik-stukniecie-przytrzymanie-obrot-restart.yaml:55` | Rząd „1” nie zależy od miejsca stuknięcia. `wzor-zaznacz` przestawia znacznik na środek strony i zapisuje go, więc „po restarcie na miejscu” nadpisuje stan, który miało sprawdzić. To samo w 104:26. |
| CH-03 | P2 | brzegowy | `tests/jakosc/pu-191-bez-sdk-reklam-i-sledzenia.test.ts:9` | Lista zakazanych nazw w bezpośrednich `dependencies` i w `app.json`. Mutacje: 5 z 5 innych SDK lub deklaracji śledzenia przechodzi bez alarmu, a nieszkodliwa zależność daje fałszywy alarm. Zależności przechodnich test nie sprawdza. |
| CH-04 | P3 | teoretyczny | `tests/jakosc/maestro-runner.ts:33` | `point` trafił do globalnego słownika selektora: kontrola przepuszcza `assertVisible: { point }`, a interpreter zalicza tę asercję na każdym niepustym ekranie |
| CH-05 | P3 | brzegowy | `e2e/scenariusze/106-pu-191-bez-kont-i-ekranu-awarii-na-glownych-ekranach.yaml:16` | Wyrażenie konta działa w Maestro na cały tekst, więc „Sign in with Apple” i „Continue with Google” przechodzą |
| CH-06 | P3 | brzegowy | `e2e/scenariusze/107-pu-288-udostepnij-zdjecie-arkusz-systemowy-i-powrot.yaml:37` | Część „arkusz z obrazem” jest niesprawdzona: wystarcza dowolna pozycja arkusza („Copy”, „Messages”) |

## 1. Interpreter `tests/jakosc/maestro-runner.ts` (klucz `point`)

| Punkt | Werdykt | Dowód |
|---|---|---|
| (a) tylko poszerzenie dla istniejących scenariuszy | **tak** | Sonda na kopii: interpreter sprzed zmiany (1b888e99) i po niej (d7642f33), przetranspilowany do CJS w scratchpadzie. Oba przeszły 105 scenariuszy z d7642f33. Dla każdego zapisałem `problemySkladni` + `problemyAsercji` + `problemyLicznika` oraz pierwszy błąd przebiegu `Runner.uruchomPlik` na pustej atrapie. Różnica dotyczy tylko 103 (8 komunikatów „nieznany klucz/opcja point” przed zmianą, 0 po niej) i 104 (2 → 0). Wyniki przebiegu na atrapie są identyczne dla wszystkich 105, a po zmianie żaden scenariusz nie ma problemu statycznego. Obie wersje kończą z kodem 0. |
| (b) nic nie jest przyjmowane po cichu w `tapOn`/`longPressOn` | **tak** | `tests/jakosc/maestro-runner.ts:256`: krok z `point` daje jawny błąd. W Maestro 2.12.1 sam `point` to `TapOnPointV2Command` w procentach ekranu, a `point` razem z selektorem to stuknięcie względem elementu (`YamlFluentCommand.kt` w funkcji `tapCommand`: „Check if we have both element selector and point - this means element-relative tap”). Interpreter odrzuca oba warianty, więc nie modeluje żadnego źle. |
| (b′) efekt uboczny poza `tap*` | **znalezisko CH-04** | `point` jest w globalnym `KLUCZE_SELEKTORA` (`:33`). Sonda: `problemySkladni` dla `assertVisible: { point }` i `scrollUntilVisible: { element: { point } }` przed zmianą zgłaszał 3 błędy, po zmianie 0. `Runner.krok({ assertVisible: { point: '50%, 50%' } })` na ekranie z jednym elementem: przed zmianą błąd „nieobsługiwany klucz selektora „point””, po zmianie przechodzi, bo `znajdz` nie ma filtra tekstu ani id (`:219-231`). |
| (c) `bx9-punkt-w-scenariuszu.test.ts` pada bez poprawki | **tak** | Mutacje na kopii d7642f33 (worktree w scratchpadzie, bez commita), `npx jest --ci`. Bez mutacji: 2/2 zielone. Bez `'point'` w słowniku: pada test 1. Bez linii jawnego błędu: pada test 2. Stan sprzed BX9: padają oba. |
| procenty a piksele | **procenty, ale patrz CH-02** | `TapOnPointV2Command` liczy procenty względem ekranu, więc wynik nie zależy od pikseli. To, czy „50%, 45%” trafi w wiersz schematu, zależy od proporcji ekranu i układu PDF. Asercje 103/104 nie zależą od miejsca trafienia (CH-02), więc rozmiar symulatora nie zmieni wyniku. To jest jednak objaw tej samej słabości. |

## 2. Scenariusze 103–107 wobec „Oczekiwanego wyniku”

Wspólne: `git diff --name-status 1b888e99 d7642f33 -- e2e/` pokazuje tylko `A` dla 103–107 i `M` dla `config.yaml`, `czesci.json` i `README.md`. Żaden istniejący scenariusz ani podprzepływ się nie zmienił. `README.md`: 5 nowych wierszy tabeli testID i jeden zmieniony opis (`zdjecie-udostepnij`, „scen. 107 go otwiera”). Każdy z pięciu plików ma tagi `przypadki-uzycia`, `oczekujacy` i `PU-NNN`. Reguła „po akcji asercja” jest spełniona: sonda (a) daje 0 problemów, a `tests/jakosc/maestro-scenariusze.test.ts` jest zielony. W 104:31-32 `tapOn` pola i `inputText` to dozwolony łańcuch wpisu.

| Scen. | PU | Werdykt | Uwagi |
|---|---|---|---|
| 103 | 066 | **częściowo** | CH-02. Może paść na: wskazówce (:22; BX-035, patrz „Do sprawdzenia”), karcie kierunku przy pierwszym znaczniku (:26) i utracie znacznika po restarcie. Bez znacznika `kierunek` = null, więc `wzor-zaznacz` pokaże kartę zamiast paska (`app/wzor.tsx:196`, `src/ekrany/WzorPrzegladarka.tsx:98`). Nie może paść na: „w stukniętym rzędzie”, „na wysokości palca”, „na obróconej stronie”, „na miejscu”. |
| 104 | 067 | tak, poza znacznikiem | Notatka „Row 1: k2tog here” sprawdzona tekstem: po zapisie (:36), w arkuszu (:40) i po ponownym otwarciu (:49). „Znacznik na stukniętym rzędzie” (:26) jest niesprawdzony (CH-02). Chip natywny wyszukiwany po tekście to hipoteza autora. |
| 105 | 071 | **nie (pusty wobec wyniku)** | CH-01 |
| 106 | 191 | częściowo, z wyjątkiem nazwanym | Zakres węższy niż „Cały zestaw scenariuszy”: P-892 to nazywa i zostawia do uwagi właściciela. Prośby o śledzenie scenariusz nie sprawdzi, bo `launchApp` bez `permissions` nadaje wszystkie uprawnienia (`subflows/start-czysty-dzis.yaml:7-11`, jak CE-01). Brak ATT pilnuje więc tylko test zależności (CH-03). Wyrażenie konta: CH-05. |
| 107 | 288 | tak, poza „z obrazem” | Arkusz otwarty (:37), zamknięty (:41), podgląd wraca (:42-43), w projekcie dalej dokładnie jedno zdjęcie („Photo 1 of 1” :48, brak indeksu 1 :49). „Z obrazem”: CH-06. Zamknięcie przeciągnięciem od 30% wysokości: patrz „Do sprawdzenia”. |

## 3. `e2e/scenariusze/config.yaml` i `e2e/czesci.json`

- `config.yaml`: tylko 5 dopisanych nazw, w kolejności leksykalnej (po 102, przed 11), bez usunięć. CI tej listy nie czyta (`e2e/scenariusze/config.yaml:3`: „Workflow uruchamia scenariusze części z katalogu przygotowanego przez scripts/ci/e2e-czesci.mjs (bez tego pliku)”). Nic tu nie wyłącza scenariuszy ani nie zmienia kolejności bramkowej.
- `czesci.json`: 5 nowych wag (108–173 s), stare wagi bez zmian. Porównałem plan sprzed zmiany i po niej (`node scripts/ci/e2e-czesci.mjs plan`, oba z kodem 0). Przed zmianą plan ma 96 plików, po niej 101. Nic nie ubyło, doszły dokładnie 103–107, wszystkie na liście `oczekujace`. Zbiór plików bramkowych jest ten sam (13 = 13). Przydział do części się przetasował, co przy podziale wagowym jest oczekiwane. Najdłuższa część rośnie ze 130 do 134 min. `plan-podstawowy` jest bajtowo identyczny (`cmp` 0).

## 4. Test PU-191 (`tests/jakosc/pu-191-bez-sdk-reklam-i-sledzenia.test.ts`)

Mutacje na kopii d7642f33, `npx jest --ci` na tym jednym pliku. Bez mutacji: 2/2 zielone.

| Mutacja | Wynik testu | Ocena |
|---|---|---|
| `react-native-google-mobile-ads` w `dependencies` | czerwony | wykrywa |
| `react-native-fbads` (Meta Audience Network) | **zielony** | przepuszcza |
| `expo-insights` (analityka użycia EAS) | **zielony** | przepuszcza |
| `@microsoft/react-native-clarity` (nagrywanie sesji) | **zielony** | przepuszcza |
| `app.json` `ios.privacyManifests.NSPrivacyTracking: true` | **zielony** | przepuszcza |
| `NSUserTrackingUsageDescription` w `targets/share/Info.plist` | **zielony** | przepuszcza |
| `@react-native-segmented-control/segmented-control` (kontrolka interfejsu) | **czerwony** | fałszywy alarm (`segment`) |

Zależności przechodnie: test czyta tylko `package.json` (`:13`, `Object.keys({ ...pkg.dependencies })`). W `package-lock.json` to samo wyrażenie trafia dziś jeden pakiet PROD, `text-segmentation`, który nie jest SDK. Skanowanie locka tym wyrażeniem dałoby więc od razu fałszywy alarm. Werdykt: test wykrywa tylko nazwy ze swojej listy. Szczegóły i opcje w CH-03.

## 5. Bramka i katalog

- **Zmienione wiersze katalogu:** 5 (PU-066, 067, 071, 191, 288). Porównałem komórki starego i nowego wiersza: w każdym zmieniła się tylko kolumna 8 (Pokrycie). Opis, kroki, „Oczekiwany wynik”, instrukcja, ekrany i klasa (B) są bez zmian. Poza tym doszła jedna linia podsumowania „B według pokrycia”. PU-057 i PU-162 nie zmieniły się w diffie i nadal są „do zaprogramowania”, zgodnie z P-893.
- **KO-073 zachowane:** `kontrolaKatalogu(root, { wymagajTestowB: true })` daje 44 błędy: 21 „oczekujący nie liczy się jako test”, w tym po jednym dla każdego z 5 nowych PU, i 23 „bez testu”. Innych błędów nie ma.
- **Liczby zgodne ze skryptem bramki:** `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` kończy z kodem 0 („Kontrola 2: zielona”). `czytajKatalog` liczy A=109, B=178, F=52, razem 339 (`docs/jakosc/przypadki-uzycia.md:12`). B według pokrycia: z testem 134, oczekujący 21, do zaprogramowania 23 (`:13`).
- **`tests/jakosc/e2e-noc-2026-11-02.test.ts:191`:** dopisano tylko numery `'103'`…`'107'`. `plik(n)` (`:9`) zamienia numer na nazwę pliku po prefiksie `n-`, więc w katalogu odpowiada im dokładnie po jednym pliku. Komentarz linii („BX7 porcja 1 i BX8”) nie wymienia BX9, ale to tylko opis.
- **Testy celowane** (`npx jest --ci`, 9 plików: maestro-scenariusze, bx9-punkt, pu-191, e2e-noc, przypadki-uzycia, bramka-przypadki-uzycia, e2e-czesci, e2e-otworz-ustawienia, bx8-numeracja): kod 0, 9/9 plików, 182/182 testy.

## 6. Dokumenty (P-891…P-893)

- Starszych decyzji nikt nie edytował: `git diff 1b888e99 d7642f33 -- docs/decyzje.md` ma 0 usuniętych linii, a 3 dopisane to P-891, P-892 i P-893 (`docs/decyzje.md:797-799`).
- P-891 jest zgodna z kodem co do `tap*`, wersji Maestro (`jakosc-ios.yml:339`) i testu. Zdanie „Zmienione tylko poszerzenie słownika i jeden jawny błąd; progi, listy i reguły asercji bez zmian” pomija jednak, że słownik jest globalny, więc `point` przechodzi też w asercjach (CH-04).
- P-892 jest zgodna z testem (pułapka: 6 naruszeń, `:32`). Zdanie „brak SDK reklam … i ATT” jest mocniejsze niż to, co test wykrywa (CH-03).
- P-893: katalog jest zgodny (PU-057 i PU-162 nadal „do zaprogramowania”).

## 7. Znaleziska

### CH-01 · Scenariusz 105 nie może paść na „zostaje w pionie” (P1, realny)
- Dowód: każda asercja ma postać `X below Y` (`105-…yaml:18`, `:21`, `:28`, `:31`, `:35`, `:38`, `:45`, `:48`, `:53`, `:56`, `:61`, `:64`). Licznik nie ma układu poziomego: `src/ekrany/Licznik.tsx:89-91` czyta z okna tylko `fontScale`, a `width` wyłącznie do szerokości dzianiny przy dużym tekście (`:109`). Gdyby ekran się obrócił, „+1” dalej leżałby pod wierszem liczby. Pasek zakładek (`nav-dzis`) jest na dole w obu orientacjach, więc „nav-dzis below karta/lista” jest prawdziwe zawsze. Hipoteza z nagłówka (:3-4: „układ „poziomy” poznaje po tym, że `below` przestaje być prawdą”) jest obalona. Scenariusz może paść tylko przypadkiem, gdy w niskim oknie element wyjdzie poza ekran, a to nie mierzy orientacji.
- Skutek: po zdjęciu tagu zielony przebieg zaliczy PU-071 do klasy A, a jedyny dowód orientacji to zrzuty, których nikt automatycznie nie porównuje.
- Opcje: (a) build E2E wystawia znacznik proporcji okna, np. tekst `portrait`/`landscape` z `useWindowDimensions` w panelach E2E (`paneleE2e`), a scenariusz sprawdza jego wartość po `setOrientation`. Kompromis: mała zmiana kodu E2E, którą musi zatwierdzić rola 05 (wzorzec: `e2e-sha-bazy`). (b) PU-071 wraca do „do zaprogramowania” albo część „w pionie” idzie do F (zrzut ogląda właściciel). Kompromis: bez kodu, ale też bez automatu. **Rekomendacja: (a).** Do czasu (a) scenariusz 105 nie może zdjąć tagu `oczekujacy`.
- Test akceptacyjny: mutacja, która włącza orientację `'all'` dla ekranu innego niż wzór (`app/_layout.tsx:122`), czerwieni scenariusz 105 na symulatorze.

### CH-02 · Scenariusze 103/104 nie sprawdzają miejsca znacznika, a 103 nadpisuje je przed asercją „po restarcie” (P2, realny)
- Dowód: rząd na pasku to `rzadPoPrzeniesieniu(zn, domyslnyRzadBazowy(lw.wartosc))` (`app/wzor.tsx:207`). Przeniesienie zachowuje rząd (`src/domena/znacznik-wzoru.ts:71-72`), a pierwszy znacznik bierze licznik + 1, czyli 1 (`:30`). Asercje „rząd 1” (103:28, :32, :35, :48, :56; 104:26) przechodzą więc niezależnie od tego, gdzie trafiło stuknięcie albo przytrzymanie. 103:47 i :55 stukają `wzor-zaznacz`, który przy znanym kierunku woła `postaw` z `y: gornaKrawedzRzedu(0.5, …)` (`app/wzor.tsx:207`, `src/ekrany/WzorPrzegladarka.tsx:98`). To przestawia znacznik na środek bieżącej strony i zapisuje go w bazie. Krok „restart → na miejscu” (:53-56) najpierw nadpisuje położenie, które ma sprawdzić. Przytrzymanie na obróconej stronie (:45) sprawdza tylko asercja negatywna (:46), która przechodzi także wtedy, gdy przytrzymanie nic nie zrobiło. Nagłówek (:5-6) nazywa ograniczenie „położenie: zrzuty”, ale wiersz katalogu PU-066 podaje :56 jako dowód „po restarcie na miejscu”.
- Opcje: (a) natywny widok albo pasek wystawia położenie znacznika jako `accessibilityValue` (strona i wiersz schematu), a scenariusz sprawdza zmianę po stuknięciu w inne miejsce. Kompromis: zmiana kodu i decyzja roli 05/04 o etykiecie. (b) Bez kodu: po restarcie sprawdzić znacznik bez `wzor-zaznacz` (element, który już istnieje), a części „na wysokości palca” i „na obróconej stronie” nazwać w katalogu F (zrzut). Kompromis: mniej automatu. **Rekomendacja: (b) przed zdjęciem tagu, (a) do decyzji 05.**
- Test akceptacyjny: mutacja, w której `naZaznaczRzad` albo obsługa stuknięcia ignoruje `y`, czerwieni scenariusz.

### CH-03 · Test PU-191 to lista nazw: przepuszcza inne SDK śledzenia i deklaracje ATT poza `app.json` (P2, brzegowy)
- Dowód: tabela mutacji w sekcji 4. `ZAKAZANE` (`tests/jakosc/pu-191-bez-sdk-reklam-i-sledzenia.test.ts:9`) działa tylko na bezpośrednich `dependencies` (`:13`) i pluginach `app.json` (`:14`). Nie widzi `ios.privacyManifests` (`NSPrivacyTracking`), `targets/*/Info.plist` (w repo jest `targets/share/Info.plist`) ani `package-lock.json`. Gdy scenariusz 106 nie widzi alertu ATT (sekcja 2), ten test jest jedyną ochroną przed prośbą o śledzenie. Pokrycie PU-191 w katalogu wskazuje tylko 106:16-17, bez tego testu.
- Realność: brzegowa. Dziś zależności są czyste, a pułapka dowodzi, że kontrola działa na nazwach z listy. Ryzyko pojawi się dopiero z nową zależnością.
- Opcje: (a) lista dozwolonych bezpośrednich zależności: każda nowa wymaga dopisu z ID decyzji. Kompromis: jedna linia przy każdej zależności, ale wykrywa wszystko nowe. (b) poszerzyć listę zakazanych i dodać granice słów (np. `@segment/` zamiast `segment`). Kompromis: dalej tylko znane nazwy. **Rekomendacja: (a) razem z kontrolą `privacyManifests.NSPrivacyTracking*` i `NSUserTrackingUsageDescription` we wszystkich `targets/*/Info.plist`.** Zależności przechodnie: lista pakietów PROD z locka z wyrażeniem o granicach słów jako P3.
- Test akceptacyjny: każda z 5 przepuszczonych mutacji czerwieni test, a `segmented-control` nie.

### CH-04 · `point` w globalnym słowniku selektora (P3, teoretyczny)
- Dowód: `tests/jakosc/maestro-runner.ts:33`. Sonda z sekcji 1 (b′). Dziś żaden scenariusz nie używa `point` poza `tap*`.
- Opcje: (a) `point` dopuszczony tylko dla `tapOn`, `doubleTapOn` i `longPressOn` w `problemySkladni`, a `znajdz` dalej go odrzuca. (b) zostawić i dopisać ograniczenie w P-891. **Rekomendacja: (a).** To kilka linii z pułapką w teście bx9.

### CH-05 · Wyrażenie „konto” w 106 nie łapie typowych przycisków logowania (P3, brzegowy)
- Dowód: Maestro dopasowuje wyrażenie do całego tekstu (`Filters.kt`, `textMatches`: `regex.matches(value)`) z `IGNORE_CASE` (`Orchestra.kt`, `REGEX_OPTIONS`). `(Sign|Log) ?(in|up)|Create (an )?account` nie pasuje więc do „Sign in with Apple”, „Continue with Google” ani „Log in to continue”.
- Propozycja: `.*(Sign|Log) ?(in|up).*|.*Create (an )?account.*|.*Continue with.*`. Kompromis: większe ryzyko trafienia zwykłego tekstu (do sprawdzenia na zrzutach 106-*).

### CH-06 · 107 nie sprawdza „arkusz z obrazem” (P3, brzegowy)
- Dowód: `107-…yaml:37`. Wystarcza dowolna z czterech pozycji, a „Copy” i „Messages” są także w arkuszu dla samego tekstu albo adresu. Arkusz z obrazem wyróżnia „Save Image”.
- Propozycja: osobna asercja `Save Image` (hipoteza BX-039 jak w nagłówku), reszta jak jest.

## Do sprawdzenia (pewność ≤ 80%)
- **103:22, wskazówka z `accessibilityElementsHidden`** (`src/ekrany/WzorPrzegladarka.tsx:162`): Maestro iOS czyta drzewo XCUITest, więc wskazówka zapewne jest niewidoczna, a scenariusz padnie na pierwszej asercji. Autor nazwał to jako BX-035, scenariusz może paść, więc nie jest pusty. Rozstrzygnie przebieg iOS.
- **107:40, zamknięcie arkusza przeciągnięciem od 30% wysokości:** początek leży nad arkuszem (warstwa przyciemnienia). Nie wiem, czy XCUITest odczyta to jako zamknięcie. Gdy nie, scenariusz padnie na :41 (głośno).
- **103:53-54:** `subflows/restart.yaml` kończy na `licznik-plus|limit-zawczasu|projekty-lista`, a 103 czeka potem na `wzor-widok`. Działa to tylko wtedy, gdy „Kontynuuj” wraca do ostatniego wzoru (`src/domena/miejsce.ts:1`). Ten sam wzorzec ma scen. 100:44-45, którego recenzja CE nie zakwestionowała.

## Co działa dobrze i należy zachować
- Interpreter nie udaje punktów ekranu: daje jawny błąd zamiast cichego pominięcia, a obie połowy poprawki mają osobny test, który pada po mutacji.
- Katalog zmienia tylko kolumnę Pokrycie, a liczby w nagłówku zgadzają się co do sztuki ze skryptem bramki.
- PU-057 i PU-162 nie dostały scenariuszy, które zgadywałyby liczby (P-893). To właściwa decyzja.
- Test PU-191 ma pułapkę i strażnika pustej listy (`:24`), więc nie przejdzie na pustym `package.json`.

## Proponowane decyzje (pula P-912…P-913, do weta; zapis należy do koordynatora)
- **P-912 (CH-01, CH-02):** scenariusze 103 i 105 nie zdejmują tagu `oczekujacy`, dopóki nie sprawdzą wartości z „Oczekiwanego wyniku”: 105 przez znacznik proporcji okna w buildzie E2E (opcja a, zatwierdza rola 05), 103 przez sprawdzenie znacznika po restarcie bez `wzor-zaznacz` (opcja b). Do tego czasu wiersze PU-066 i PU-071 w katalogu dostają dopisek „częściowo / pusty wobec wyniku”. Analogia z Treningiem: tag oczekujący zdejmuje się po zielonym przebiegu, nie po samym scenariuszu.
- **P-913 (CH-03):** test PU-191 przechodzi z listy zakazanych na listę dozwolonych bezpośrednich zależności z ID decyzji i dodaje kontrolę `NSPrivacyTracking` oraz Info.plist rozszerzeń.

## Dowody
Pliki w scratchpadzie sesji (poza repo): sonda interpretera `sonda/przed.json` i `sonda/po.json`, plany `plan-przed.json`, `plan-po.json`, `pp-*.json`, bramka `bramka-katalog.txt` i `bramka-liczby.txt`, testy `jest-celowane.txt`, źródło Maestro `m/*.kt`. Najważniejsze liczby i kody wyjścia przepisałem do sekcji 1–5. `git status --porcelain` przed commitem tej recenzji był pusty: plików autora nie dotykałem.
