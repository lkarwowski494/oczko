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
