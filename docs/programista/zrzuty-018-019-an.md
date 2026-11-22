# Zrzuty sklepu: poprawki 018 i 019 po recenzji AM (stan partii, sesja AN)

2026-11-11 · rola 08-programista, tryb fix · gałąź `claude/an-zrzuty-018-019-2026-11-11` (start @ 04652fb, zgodny z poleceniem) · KO-043 · decyzje P-744…P-747 (`docs/decyzje.md`).
Zakres: tylko `e2e/zrzuty-sklepu/`, `scripts/ci/`, `tests/wydanie/`, krok „komplet” w `.github/workflows/zrzuty-sklepu.yml`, dokumenty. Bez zmian w `src/ app/ modules/`.

## Commity (jedno znalezisko = test + poprawka)
| Zadanie | ID | Commit | Test przed → po |
|---|---|---|---|
| 3 | 10-wydanie-018 (P2) | dea6562 | 3 czerwone (forma `+HH:MM`) → 32/32 (zrzuty-pasek-stanu, zrzuty-obrot-ipada, zrzuty-poprawki-ah) |
| 4 | P3 (asercje ścisłe) | 129cc89 | 1 czerwony → `tests/wydanie` 554/554 |
| 2 | 10-wydanie-019 (P1) diagnoza i próba naprawy | 1b3efd9 | 1 czerwony → 555/555 |
| 1 | 10-wydanie-019 (P1) kontrola pikseli | 99f76c6 | 10 czerwonych na zaślepce → 10/10, `tests/wydanie` 565/565 |

## 019 — diagnoza (dowód, nie deklaracja)
**Obserwacja** (artefakt `sklep-zrzuty-surowe` przebiegu 43070136577, `warunek-og07/ipad-13/en/{03-wzor,04-zakreslenie}.png`, obejrzane): w kadrze 04 podpis „2 highlights” (licznik 2), a na stronie **jeden** żółty pas (ok. 40% wysokości strony — pociągnięcie z fikstury). Drugiego pociągnięcia (swipe sceny 04 na 48% wysokości, pod wierszem „Rows 1-8”) nie ma. Kadr 03 wygląda tak samo, z „1 highlight”. Pomiar pikseli (`scripts/ci/kontrola-zakreslen.mjs`) na wszystkich czterech parach (iPad i iPhone × en i pl): 03 = 1 pas, 04 = 1 pas.

**Co z kodu wiadomo** (odczyt jako materiał do decyzji, nie dowód działania): licznik `wzor-zakreslenia` pochodzi z `onZakreslenia`, a `WidokWzoru.swift:476-479` (`zglosZakreslenia`) liczy pociągnięcia `.marker` w `rysunki`; `rysunki[s]` ustawia `canvasViewDrawingDidChange` (`:429-434`) z `c.drawing`. Czyli drugie pociągnięcie **jest w danych** (licznik 2), a nie jest narysowane na zrzucie. To rozstrzyga, że to nie problem fikstury ani geometrii z P-741 (fikstura i scena rysują już w orientacji sceny: pierwszy pas jest na swoim miejscu).

**Hipoteza AM (nie potwierdzona):** pociągnięcie zrobione przy włączonym zakreślaczu nie jest widoczne w chwili zrzutu, a narzędzie wyłączone (fikstura, `00-przygotuj.yaml:169-170`) i odtworzenie nakładki z danych je pokazuje. Pasuje do dowodu, ale pasuje też do wyścigu czasowego (zrzut po `sleep` tuż po swipe, PencilKit renderuje pociągnięcie z opóźnieniem) — obie hipotezy przewidują ten sam obraz, rozróżni je dopiero przebieg C6.

**Zmiana (opcja 1 z P-746):** `04-zakreslenie.yaml` po swipe i asercji licznika 2: `tapOn wzor-zakreslacz`, `assertVisible selected: false`, ponowna asercja licznika 2. Koszt: kadr 04 traci podświetlony przycisk zakreślacza (różnicę względem 03 daje teraz drugi pas i „2 highlights”).

### Co potwierdzi przebieg C6 (wyzwala koordynator)
1. W logu jobu „komplet”: `OK ipad-13/en: 03=1, 04=2 pasów zakreślenia` (i pozostałe trzy pary); krok „Komplet zrzutów i wymiary” zielony.
2. Obejrzeć `ipad-13/en/04-zakreslenie.png` i `6.9/en/04-zakreslenie.png`: dwa żółte pasy (48% i 40%), przycisk zakreślacza bez ramki.
3. Gdy nadal `04=1`: job jest czerwony z nazwą pliku (kontrola), hipotezy „tryb narzędzia” nie potwierdzono. Następny krok: opcja (2) z P-746 (wyjście i powrót na stronę wzoru przed zrzutem, odtworzenie nakładki z danych) albo opóźnienie przed zrzutem 04 (hipoteza wyścigu); wybór należy do koordynatora.

## 019 — kontrola pikseli (zadanie 1)
- `scripts/ci/kontrola-zakreslen.mjs <katalog>`: pary `03-wzor.png` i `04-zakreslenie.png` w `[warunek-og07/]<klasa>/<język>/`; ImageMagick (`convert`) zmniejsza do 500 px szerokości i oddaje RGB; wiersz jest „żółty”, gdy ≥ 20% pikseli ma barwę zakreślacza (R ≥ 230, G ≥ 210, B ≤ 190, R−B ≥ 50; zmierzone: 248,232,123 i 250,237,152; tło interfejsu 238,235,230 i przycisk 192,132,37 nie pasują); pas = ≥ 3 wiersze, przerwy ≤ 2 wiersze scalane (tekst na pasie).
- Reguła: 04 ma **więcej** pasów niż 03. Porażka: `BŁĄD <plik 04>: 04=N pasów, 03=M …`, kod 1, `bledy=1` w kroku „Komplet zrzutów i wymiary”. Nieczytelny plik = BŁĄD z nazwą pliku. Brak jednej sceny pary = `POMINIĘTO` (brak sceny zgłasza `komplet-zrzutow.mjs`).
- Testy: `tests/wydanie/kontrola-zakreslen.test.ts` (logika na sztucznych buforach — zawsze; pliki PNG — z ImageMagickiem, w kroku testów ramek workflow z `OCZKO_WYMAGAJ_IMAGEMAGICK=1`, bez `convert` lokalnie pominięcie głośne).
- Kontrola dodatnia na prawdziwym kadrze: dorysowanie żółtego pasa na kopii `04-zakreslenie.png` (iPad en) → `03=1, 04=2`, kod 0.
- **Ograniczenia (nazwane):** progi barwy i szerokości z jednego zestawu zrzutów; zmiana koloru zakreślacza w tokenach wymaga zmiany progu; kontrola dowodzi widoczności pasa, nie jego położenia w kadrze.

## 018 — pasek stanu (zadanie 3)
`pasek_stanu()` w `scripts/ci/zrzuty-sklepu.sh`: `iso="${ZRZUTY_TERAZ}Z"` (job 130695677975: `+00:00` odrzucone, code=22). Zostają: ostrzeżenie ze stderr simctl, drugi override z samą godziną przy odrzuceniu, odczyt `status_bar list` w logu po sukcesie. Opcja (b) nie wdrożona. **Niesprawdzone na runnerze:** czy `simctl` przyjmuje „Z” oraz godzina na pasku przy strefie symulatora innej niż UTC (runner GitHub ma UTC).

## P3 (zadanie 4)
`04-zakreslenie.yaml`: `^\D*1\D*$` i `^\D*2\D*$`. Zaktualizowane dwa starsze testy (014 w `zrzuty-poprawki-ah.test.ts`, 004 w `zrzuty-sklepu.test.ts`), które sprawdzały dosłowny stary wzorzec — asercja zaostrzona, nie osłabiona.

## Wynik komend
Pełna bramka `npm run verify` i przegląd ścieżki wrażliwej (workflow): zob. raport PRZEKAZANIE do koordynatora.

## AO — 019: przyczyna w aplikacji (sesja AO, 2026-11-11, KO-044; decyzje P-748…P-751)
Start @ 2b97f07 (zgodny). Opcja 1 z P-746 obalona przez C6 (`zrzuty-sklepu.yml` 43090241469, job „komplet” 130828800785: `04=1, 03=1` w 4 parach).

**Przyczyna (a), defekt aplikacji P1; pewność średnia.** Porównanie artefaktów (obejrzane):
| Przebieg | Kadr | Licznik | Widoczne pasy | Warunki |
|---|---|---|---|---|
| 43035080611 (przed P-741) | `warunek-og07/ipad-13/en/04-zakreslenie.png` | 2 | 1 (fikstura, z pliku) | fikstura w pionie, scena poziomo |
| 43090241469 (C6) | iPad en 04 | 2 | 1 (fikstura, 40%) | obie poziomo |
| 43090241469 (C6) | `warunek-og07/6.9/en/04-zakreslenie.png` | 2 | 1 (fikstura) | iPhone, **bez obrotu** |
| Jakość · iOS 42899408194, scen. 47 | `47-ipad-zakreslenie.png` | 1 | 1 (świeży swipe) | puste płótno |

Wnioski: obrót wykluczony (iPhone). Syntetyczny swipe Maestro rysuje widoczną kreskę na pustym płótnie (47), więc „artefakt gestu” (b) słabnie. Pas z danych jest zawsze widoczny (rysunek przypisany kodem przy tworzeniu nakładki), świeże pociągnięcie na płótnie z wczytanym rysunkiem nie jest, choć jest w danych: `canvasViewDrawingDidChange` ustawia `rysunki[s] = c.drawing`, z tego liczy się licznik i idzie zapis. Dla użytkownika: na wzorze z zakreśleniami nowe zakreślenie nie pojawia się do ponownego otwarcia. Mechanizm wewnątrz PencilKit nieustalony: H4 = płótno z wczytanym rysunkiem, H5 = kreska znika po czasie (w scen. 47 zrzut jest zaraz po swipe).

**Poprawka (P-748):** `WidokWzoru.swift`: `zaplanujOdswiezenie`/`odswiezPlotna` po każdej zmianie użytkownika przypisują wyświetlanemu płótnu rysunek z danych, w następnym obiegu pętli i nie w trakcie pociągnięcia (`canvasViewDidBegin/EndUsingTool`). Przypisanie następuje tylko wtedy, gdy płótno ma te same kreski co dane, a echo bez zmiany kresek jest pomijane. Przegląd subagenta: P0 i P1 naprawione testem przed kodem (88ebdd4). Koszt: jedno przerysowanie strony po każdej kresce.
**Scena 04 (P-749):** bez obejścia: zakreślacz włączony do zrzutu (kadr z 014), `takeScreenshot: 04-po-swipe` w dziennikach (`zrzuty-dzienniki-*`).

| Commit | Co | Test przed → po |
|---|---|---|
| 5f9160d | poprawka Swift + test statyczny | 4/4 czerwone (potem 1/5 dla echa) → 5/5 |
| f7e7cfd | scena 04 bez obejścia, zrzut diagnostyczny | 1 czerwony → `tests/wydanie` 565/565 |
| 0f7e434 | przeniesienie testu do `tests/wydanie` (kontrola tabeli 08), strukturalne | — |
| 88ebdd4 | poprawki z przeglądu (P0, P1) | 3 czerwone → 7/7 |
| 7ad1fd4 | E2E scen. 47: drugie pociągnięcie na wzorze wczytanym po restarcie (KO-044), licznik 2 + zrzut `47-ipad-drugie-zakreslenie` po odczekaniu | 1 czerwony → 8/8 |

Pełna bramka: `docs/programista/zrzuty-018-019-ao-verify.txt`.

### Co potwierdzi C7 (P-751: nowy build, `uzupelnij_z_przebiegu=43090241469`, `powtorz=en/03-wzor,en/04-zakreslenie,pl/03-wzor,pl/04-zakreslenie`)
1. Build zielony: kompilacja Swift, niesprawdzona w Linuksie.
2. Job „komplet”: `03=1, 04=2 pasów` we wszystkich 4 parach (P-745, progi bez zmian).
3. Kadr 04: dwa pasy (40% i 48%) i podświetlony zakreślacz; `04-po-swipe.png` w dziennikach z dwoma pasami.
4. Gdy nadal `04=1`: `04-po-swipe.png` rozróżni „kreska nie pojawiła się” od „znikła po czasie”; wtedy STOP i decyzja koordynatora, bez trzeciej poprawki w ciemno.

**Build 4 (1141):** defekt obecny (P-748); objaw w teście właściciela to znany 019, nie nowy błąd.
**Na urządzeniu (krok właściciela, rozszerzenie U2 w `docs/jakosc/testflight-na-urzadzeniu.md`, do roli 07):** zakreśl, zamknij i otwórz wzór, zakreśl ponownie. Nowa kreska ma być widoczna od razu, bez przerwanych kresek przy szybkim pisaniu piórem.

## AO — 018 (sprawdzenie)
simctl odrzucił także `2026-11-10T09:41:00Z` („Invalid, non-ISO date/time string”, code=22; joby 130796899562, 130811471544), po czym ustawił samą godzinę 09:41 z datą maszyny. Bez zmiany kodu; rekomendacja: opcja (b) z P-744 (P-750).

## AQ — 018 (pasek i daty kompletu), P2 (wyścig odświeżenia płótna), P3 (sesja AQ, 2026-11-12, KO-046; decyzje P-752…P-755)
Rola 08-programista, tryb fix · gałąź `claude/aq-zrzuty-018-2026-11-12` (start @ 281852f, zgodny z poleceniem) · stan wyjściowy: `npx jest tests/wydanie` 527/527, kod 0 (przed zmianami). Zakres: `scripts/ci/`, `tests/wydanie/`, krok „plan/zrzuty/zbierz” w `.github/workflows/zrzuty-sklepu.yml` (tylko zadanie 2), `e2e/`, dokumenty. Bez zmian w `src/ app/ modules/`.

| Zadanie | ID | Commit | Test przed → po |
|---|---|---|---|
| 4 | P3 kontrola zakreśleń | c88b779 | 1 czerwony (`OK (0 par)`) → 11/11 |
| 1 | 10-wydanie-018 (b) pasek | 114ce16 | 6 czerwonych (ISO w override, dwa ostrzeżenia) → 75/75 w 4 plikach zrzutów |
| 2 | 10-wydanie-018 (d) daty kompletu | bb46956 | 17 z 18 nowych czerwonych → `tests/wydanie` 592/592 |
| 3 | P2 wyścig odświeżenia (wykrywacz E2E) | 39cf65d | 1 czerwony (brak kroków w scen. 47) → 10/10; `tests/jakosc` zielone |

### 018 — pasek stanu (zadanie 1; P-752)
`pasek_stanu()`: jeden `xcrun simctl status_bar … override --time "9:41"` (godzina z `ZRZUTY_TERAZ`, bez zera wiodącego), jak `trening:scripts/ci/store-screenshots.sh:26` (przeczytane w klonie Treningu 12.11.2026). Bez prób ISO (simctl odrzucił bez strefy, `+00:00` i `Z`: run 43017044972, joby 130695677975, 130796899562, 130811471544). Zostają: `::warning::` z stderr simctl przy błędzie i odczyt `status_bar list` po sukcesie. **Skutek znany z góry:** data na pasku iPada to data maszyny, nie data sceny.

### 018 — spójność dat w komplecie (zadanie 2; P-753)
Dwie osobne daty (dowód z AP: pasek iPada 01–07 „Śr. 11 lis”, 03/04 „Czw. 12 lis”, treść 01-dzis „wtorek, 10 listopada”):
- **Zegar aplikacji** `ZRZUTY_TERAZ` (treść kadrów) zostaje **stałą** 2026-11-10T09:41:00: fikstura `00-przygotuj.yaml` ma sesje 3, 5 i 9 XI jako daty bezwzględne względem „dziś” (Historia, kalendarz, „This week”), ruchomy zegar by ją zepsuł. Stała mieszka teraz w planie (`ZRZUTY_TERAZ` w `scripts/ci/zrzuty-uzupelnij.mjs`), plan niesie ją w macierzy (`matrix.teraz`) do każdego zadania zrzutów; skrypt nie ma własnej kopii i bez zmiennej staje głośno.
- **Dzień przebiegu** (`date -u +%F`, raz w zadaniu `plan`) = data maszyny, którą pasek iPada pokazuje; idzie w macierzy (`matrix.dzien`). Zrzut iPada zrobiony w innym dniu (przebieg przekroczył północ UTC) jest usuwany i liczony jako nieudany (`data_zrzutu_zgodna`, czerwony job, bez ponawiania).
- **Uzupełnienie:** `zrzuty-uzupelnij.mjs data` (w planie i ponownie w „zbierz”, bo źródło jest pobierane świeżo) usuwa z poprzednich CAŁY zestaw iPada, gdy `dzienIpada` ze znacznika `zrzuty-daty.json` jest inny albo nieznany (źródło sprzed AQ). Plan liczy go wtedy jako brakujący i robi od nowa. Język iPada ze źródła spoza listy przebiegu = czerwony plan (inaczej zniknąłby z kompletu); przebieg bez iPada zostawia iPada ze źródła. „zbierz” zapisuje `zrzuty-daty.json` (`teraz`, `dzienIpada`) w artefakcie `sklep-zrzuty-surowe` po ramkach.
- **Ograniczenia (nazwane):** treść kadrów (np. „wtorek, 10 listopada”) nadal różni się od daty na pasku iPada (11/12 XI…): sama data paska nie da się ustawić (simctl). iPhone daty na pasku nie pokazuje. Niesprawdzone na runnerze: strefa symulatora = UTC (`date -u` vs data na pasku), działanie `data` na prawdziwym artefakcie (testy na sztucznych katalogach). Pierwsze uzupełnienie ze źródła sprzed AQ (np. 43090241469) powtórzy cały zestaw iPada (brak znacznika): zamierzone, nie błąd. Przejście zadań macOS przez północ UTC jest teraz głośne, nie ciche.

### P2 — odświeżenie po `canvasViewDidEndUsingTool` (zadanie 3; P-754)
**Analiza (kod `WidokWzoru.swift`, stan z 281852f):** `canvasViewDrawingDidChange` wpisuje `rysunki[s]` i planuje odświeżenie (`doOdswiezenia`); `odswiezPlotna` w następnym obiegu pętli pomija strony `wUzyciu`; `canvasViewDidEndUsingTool` zdejmuje stronę z `wUzyciu` i ponownie planuje odświeżenie, gdy strona jest już w `doOdswiezenia`. Sekwencja ryzyka: P1 kończy się, P2 zaczyna się (strona w użyciu), dopiero potem przychodzi `DrawingDidChange` dla P1 → wpis w `doOdswiezenia` jest pominięty (w użyciu) i **przeżywa**; koniec P2 planuje odświeżenie z tego wpisu, a jeśli P2 nie jest jeszcze w `c.drawing`, płótno ma te same kreski co `rysunki[s]` (strażnik `takieSame` przechodzi) i dostaje przypisany rysunek bez P2; późniejsze `DrawingDidChange` P2 jest wtedy echem (`takieSame`) i odrzuca się → pociągnięcie zginęłoby także z danych. **Nie da się tego potwierdzić kodem:** dokumentacja Apple opisuje callbacki jednym zdaniem każdy i nie podaje kolejności ani opóźnienia `EndUsingTool` względem `DrawingDidChange` (developer.apple.com/tutorials/data/documentation/pencilkit/pkcanvasviewdelegate/…, odczyt 12.11.2026), a opóźnienie zatwierdzenia P1 dłuższe niż przerwa do P2 jest założeniem. Swift nie kompiluje się w Linuksie. **Ocena:** brzegowy (wymaga opóźnionego zatwierdzenia i bardzo szybkiego drugiego pociągnięcia), skutek: utrata jednego zakreślenia (dane użytkownika) → nie ignorujemy, ale nie zmieniamy logiki zapisu w ciemno.
**Zrobione:** scen. 47 po dotychczasowych krokach: dwa swipe'y jeden po drugim (między nimi jedna szybka asercja stanu narzędzia, wymagana regułą strategii §3.8; bez `waitForAnimationToEnd`), `4 highlights` (1 z pliku + 1 + 2 szybkie; spec polecenia mówił „3” przy jednym pociągnięciu na starcie, tu są dwa wcześniejsze), odczekanie i zrzut `47-ipad-szybkie-zakreslenia`. Kontroli pikseli nie dodano (wymagałaby zmiany workflowu „Jakość · iOS”, poza zakresem AQ). **Co potwierdzi C-run „Jakość · iOS”:** scen. 47 zielona z `4 highlights`; zrzut w artefakcie `e2e-czesc-*-ipad` z czterema pasami. Gdy licznik zostanie 3 albo na zrzucie zabraknie kreski: defekt potwierdzony, poprawka w `WidokWzoru.swift` (kandydat: licznik pociągnięć rozpoczętych bez zatwierdzenia i odświeżenie tylko przy zerze; do zaprojektowania z testem na urządzeniu) i decyzja koordynatora.

### P3 — kontrola zakreśleń (zadanie 4; P-755)
`kontrola-zakreslen.mjs`: zero par 03/04 (brak katalogu, pusty zestaw, tylko inne sceny) = `BŁĄD … brak par 03/04` i kod 1 zamiast notatki i kodu 0. Zawsze, nie tylko przy OG-07: sceny 03/04 powstają w każdym przebiegu (bez OG-07 w `warunek-og07/`, który kontrola też przeszukuje), więc zero par znaczy, że kontrola nic nie sprawdziła. Starszy test oczekujący kodu 0 zaostrzony.

### Przegląd ścieżki wrażliwej (workflow)
Subagent (sam diff `281852f..HEAD` dla `.github scripts`, zasady 10–14, bez mojego rozumowania) zwrócił 2 × P1, oba potwierdzone i naprawione testem przed kodem w 59c0586: (1) krok `plan` bez pipefail (domyślne `bash -e`) gubił kod 2 z `data|powtorz|znacznik` w `| tee` → po potokach `PIPESTATUS[0]`; (2) po północy UTC zadanie iPada robiło dalej odrzucane zrzuty → pierwsza niezgodna data kończy zadanie (`exit 1`, scena w nieudanych; ponowienie zadania dostaje ten sam dzień z planu, więc komunikat każe zrobić nowy przebieg). Drugiego przeglądu nie ma.
Pełna bramka: `docs/programista/zrzuty-018-aq-verify.txt`.
