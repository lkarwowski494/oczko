# Oczko — system „Dzianina” (redesign M3)

Stan: zatwierdzony (P-554: system, 6 ekranów i ikona bez poprawek), przekazanie E4 roli 04, 2026-11-05 · Decyzje: P-549 (przepływy `../to-be.md`), P-552 (kierunek „Dzianina”, ikona — kreski), P-553 (tło T2 Musket, Bree Serif, miejsce plików), P-554 (zatwierdzenie). Obowiązuje dla wdrożenia M3 (rola 08, partie p1–p8). Do wdrożenia p1 kod i testy czytają poprzedni system (`../design-spec.md`, `../tokeny.json`, `../ikona/`), który p1 zastępuje tym katalogiem razem z testami (P-553, wyjątek nazwany).

## Pliki
| Co | Plik |
|---|---|
| Tokeny (moduł motywu, propozycja) | `tokeny.json` → `tokeny.css` (makiety) skryptem `../narzedzia/dzianina-tokeny.mjs` |
| Tabela kontrastu (203 pary: jasny, ciemny, oba „Zwiększ kontrast”, `systemCzarny`; w tym oferty P-557 i tokeny M3-S3-02/06; kod 0) | `kontrast-tabela.txt` (z `kontrast-pary.json`, `../narzedzia/kontrast.mjs`) |
| Mapa starego `../tokeny.json` (183 pozycje) na tokeny Dzianiny (M3-S3-01) | `mapa-tokenow.md` (kontrola `../narzedzia/mapa-tokenow.mjs`) |
| Pokrycie Bree Serif dla 35 języków (CLDR 46, M3-S3-04) | `pokrycie-bree.txt` (`../narzedzia/pokrycie-kroju.py`) |
| Kontrakt testID po podmianie `../design-spec.md` (M3-S3-05) | `../testid.md` |
| Makieta 6 ekranów TO BE + oferty (P-557, stany: typowy i „czeka na zatwierdzenie”) | `ekrany.html` (ikony zastępcze `ikony.js`) |
| Zrzuty wzorcowe (linia bazowa SP-13): 6 ekranów × jasny/ciemny × domyślny/AX5 × 390 pt = 24, plus arkusz DE (4), plus oferty 2 stany × 4 = 8 (P-557) | `wzorce-zrzuty/` (`../narzedzia/dzianina-zrzuty.mjs`, filtr `--ekrany=oferty,oferty-czeka`) |
| Pomiar warsztatu 390 pt (0 błędów) | `warsztat-390.txt` |
| Ikona (kreski w barwach Dzianiny) | `ikona/` (warstwy SVG, PNG, `arkusz.png`) |
| Kierunek, warianty tła, kroje (historia wyboru) | `../kierunki/dzianina.html`, `../porownanie.png`, `../tla.png`, `../kroje.png`, `../01-swiat.md` |

## Element firmowy: dzianina części
Kawałek dzianiny dżersejowej rośnie od nabrania (dół) do celu części (przerywana linia u góry). **Dane:** wysokość = rzędy gotowe / cel części; jaśniejszy pas u góry = rzędy dziś; igła = bieżący rząd; ząbek w brzegu = rząd najbliższego przypomnienia. Oczka „V” to faktura (nie liczba rzędów). **Gdzie:** karta „Kontynuuj” na „Dziś”, kolumna przy liczbie na liczniku, miniatura w wierszu projektu, dni tygodnia i kalendarza (dzień dziergany = kwadrat dzianiny z obwódką). **Stany:** część bez celu → wysokość według ostatnich 96 rzędów i bez linii celu [DO USTALENIA 08: skala okna]; 0 rzędów → sama igła z nabranymi oczkami; cel osiągnięty → dzianina pod linią celu, arkusz „Co dalej” (U-11) bez zmian. **VoiceOver** (jeden element, rola obrazu): „{część}: {gotowe} z {cel} rzędów, dziś {dziś}{, następne {przypomnienie} w rzędzie {n}}”. **Ruch:** przy +1 nowy rząd oczek wsuwa się pod igłę (180 ms); „Ogranicz ruch”: zmiana natychmiast. Rysunek w `react-native-svg` (wzór oczek jako `Pattern`), jak w `ekrany.html` (skrypt `data-dz`).

## Kolory (z `tokeny.json`; jeden kolor = jedno znaczenie)
- `tlo` — runo musket (ciepła szarobrązowa wełna): jasne `#E6E1DA`, ciemne `#26211E`. Żaden ekran nie jest płaskim białym ani czarnym tłem (P-547).
- `akcent` mioget (miodowy) — dzianina, „+1”, dzień dziergany. `akcentTekst` — ten sam miód jako tekst/łącze (ciemniejszy w jasnym, jaśniejszy w ciemnym).
- `karta` — ciepły grafit karty „Kontynuuj” i kolumny dzianiny.
- `przycisk` — przycisk główny poza kartą, **wypełniony w obu motywach** (jasny: grafit z jasnym tekstem; ciemny: miód z ciemnym tekstem).
- `niszczacy` — czerwień tylko dla działań nieodwracalnych (nie występuje w motywie poza nimi).
- `zakreslacz` `#F6E04A` — tylko na stronie wzoru (rzecz z dziedziny, nie barwa motywu).
- „Zwiększ kontrast”: warianty `jasnyZwiekszony`/`ciemnyZwiekszony` (tekst drugi, akcent tekstu, linie, zakładki), tekst i rama przycisku nieaktywnego, drut rysunku).
- `przyciskNieaktywny` / `…Tekst` / `…Rama` — przycisk wyłączony: tło powierzchni, tekst drugi, **przerywana rama** i ikona stanu (np. klepsydra), nigdy sam kolor (jak `oferty-czeka-*`).
- `rysunek*` — paleta rysunków atlasu technik (`Paleta` w silniku atlasu: tło, nitka, wyróżnienie, drut); wyróżnienie to zakreślacz pod nitką.
- `systemCzarny` — Dynamic Island, Smart Stack, zegarek: barwy motywu ciemnego na czarnym tle systemu; znak kresek (`znakKresek`) w kolorze `systemCzarny.tekst`.
- Błąd (np. „Nie zapisałam rzędu…”): tekst w kolorze `tekst` z ikoną „!” i `role=alert`, bez czerwieni — czerwień (`niszczacy`) tylko dla działań nieodwracalnych (mapa: stary `blad`).

## Typografia
- Tytuły, nazwy projektów i liczby: **Bree Serif** (OFL, `../fonty/BreeSerif.ttf` + `breeserif-OFL.txt`). Bree nie ma cyfr tabelarycznych (brak cechy `tnum`, szerokości cyfr 454–536 na 1000 jednostek), więc **każda cyfra liczby stoi w komórce szerokości najszerszej cyfry, wyśrodkowana** (`typografia.cyfry.komorkaEm` 0,536 × rozmiar; P-563 (2a), M3-S3-03): liczba nie przesuwa się przy +1; dotyczy `liczbaKarty`, `liczbaLicznika`, `liczbaPaskaWzoru`, `liczbaPodsumowania`; znaki inne niż cyfry bez komórki. Języki z krojem systemowym według pokrycia pliku (`kroje.tytul.jezykiSystemowe`, `pokrycie-bree.txt`, M3-S3-04): **bg, el, ja, ko, ru, sr, uk, vi, zh-Hant** (cyrylica, greka — plik ma z niej tylko Δ Ω μ π — CJK, wietnamski: brak m.in. „ạ”, „ơ”, „ư”); tam tytuły i liczby krojem systemowym z `tabular-nums`. Pozostałe 26 z 35 języków w Bree (nl: z głównego zbioru CLDR brak tylko akcentowanego „íj́” do zapisu akcentu wyrazowego, poza tekstami interfejsu — nazwany wyjątek). Bree ma jedną odmianę — przy „Pogrubionym tekście” bez zmiany. Nie przycinać pliku (Reserved Font Name „Bree”; P-563 (9)).
- Treść: krój systemowy (SF Pro), Dynamic Type do AX5. Skala i granice: `typografia` w tokenach (liczba licznika ×0,5–×1,3; „+1” ×1,4; zakładki ×1,6).
- AX5: układy przechodzą w pionowy stos (karta: dzianina nad opisem; licznik: akcje jako lista; tydzień 4+3; kafle 1 kolumna; −1 pod +1 na pełną szerokość). Zrzuty `*-ax5.png`.

## Odstępy, promienie, cele, ruch, haptyka
Jednostka 4 pt (`odstepy`). Promienie wg hierarchii: karta 22 > kafel 18 > przycisk 14 > pole/dzień 10; „+1” okrągłe. Cele ≥ 44 pt; „+1” karty 72 pt (AX5 100); „+1” licznika ≥ 168 pt wysokości w zasięgu kciuka; dni kalendarza ≥ 44 pt także przy 320 pt (siatka na pełną szerokość, 320 / 7 = 45,7 pt). Ruch tylko przy „+1” i zmianie ekranu (`ruch`). Haptyka (`haptyka`): rząd — lekkie stuknięcie; przypomnienie — ostrzeżenie (inne niż rząd, F-48); cel części — sukces; cofnięcie — miękkie. Błąd zapisu — błąd systemowy (`bladZapisu`); start stopera — lekkie stuknięcie. Zegarek: `haptykaZegarek` (WKHapticType: przypomnienie `notification`, błąd zapisu `retry`, blokada `failure`). Dźwięk: brak domyślnie.

## Komponenty
| Systemowe (bez zmian zachowania) | Własne |
|---|---|
| pasek zakładek (4: Dziś, Projekty, Narzędzia, Historia — ikona + podpis), nawigacja z dużym tytułem, listy grupowane (Ustawienia z ikonami, ZM-07), arkusze formularzy (Anuluj/Zapisz), menu ••• (UIMenu, dwie grupy, ZM-05), arkusz udostępniania, przełączniki, pole szukania | dzianina (element firmowy), karta „Kontynuuj” (K-B), okrągłe „+1”, wielki „+1” licznika, kafel funkcji, pasek tygodnia, wiersz „co dalej”, pasek wzoru −1 / rząd / +1 |

Ikony interfejsu na iOS z SF Symbols (w makiecie zastępcze): zębatka `gearshape`; Dziś `calendar.day.timeline.left`/`sun.max` [DO USTALENIA 08: wybór okiem na urządzeniu]; Projekty `square.stack`; Narzędzia `ruler`; Historia `calendar`; Nowy projekt `plus.square`; Dodaj wzór `doc.text`; Włóczka i druty `scribble.variable` [DO USTALENIA]; Próbka `square.grid.3x3`; Notatka `note.text`; Cel `flag`; Stoper `stopwatch`; Historia zmian `clock.arrow.circlepath`; ••• `ellipsis`; zakreślacz `highlighter`.

## Ekrany: AS IS → TO BE (do układania partii)
| AS IS (trasa w `app/`) | TO BE | Zmiana | Partia (wstępnie, plan M3) |
|---|---|---|---|
| `index` (start = licznik) | **Dziś** (`wzorce-zrzuty/dzis-*`, `dzis-pierwszy-*`) + zakładki | nowy ekran startowy, karta K-B z +1 (P-545, P-549), tydzień, „co dalej”, kafle, wolne dni | p2 |
| `index` (licznik) | **Licznik** (`licznik-*`), bez zakładek | podpisane akcje (ZM-04), „Projekt ›”, dzianina przy liczbie, notatka widoczna, wielki +1 | p3 |
| `menu` (••• licznika) | menu systemowe, 2 grupy (ZM-05) | 10 → 5 pozycji | p3 |
| `historia` (zmiany licznika) | arkusz „Historia” z przycisku licznika | wygląd | p3 |
| `wzor` | **Wzór** (`wzor-*`) | ZM-10 strona w oryginale, rama w barwie motywu; pasek −1/rząd/+1 z granicą przy AX1–AX5; bez stałej linii liczby zakreśleń; wejście ZM-06 | p3 |
| `projekty` | zakładka **Projekty** (`projekty-*`) | miniatura dzianiny, ••• wiersza (WD-3), „Ostatnio usunięte” | p4 |
| `projekt/[id]`, `formularz/[rodzaj]`, `zdjecie`, `wloczka` | Projekt (z „Projekt ›” i •••), arkusze bez zmian kroków (WD-2) | wygląd | p4 |
| `dni`, `sesje`, `sesja-korekta` | zakładka **Historia** (`historia-*`): kalendarz + podsumowanie | dni ≥ 44 pt przy 320 pt | p5 |
| `narzedzia`, `zapas`, `druty`, `drut`, `probka`, `miary` | zakładka **Narzędzia** | wejście z zakładki i kafli „Dziś” | p6 |
| `ustawienia`, `stan-danych`, `usun-wszystko`, `kosz`, `jezyk`, `zrodla`, `zglos`, `konflikt` | Ustawienia z zębatki „Dziś”, lista z ikonami (ZM-07) | wygląd | p7 |
| `oferty` | **Oczko Pro** (`wzorce-zrzuty/oferty-*`, stan oczekujący `oferty-czeka-*`; P-557) | bez zmian kroków i modelu (zamknięcie, plany radio z rocznym domyślnie, kup, „Zarządzaj subskrypcją” przy subskrypcji, „Przywróć zakupy”, „Nie teraz”, linki prawne); wygląd: karta „Oczko Pro” z miesiącem dni dzierganych (ilustracja, `aria-hidden`), 4 kafle z ikonami, cena ze sklepu największym elementem planu (Bree, także przy AX5), pasek przycisków na dole z wypełnionym przyciskiem; bez znaczka „najlepsza oferta”, procentów, porównań i licznika czasu (P-054, ujawnienia 1–7); kafel „Dla rodziny” tylko przy Family Sharing; teksty kafli to nowe klucze `oferty.kafel_*` [DO USTALENIA 09] | p7 |
| `uczciwe-zasady`, `ukonczenie` | bez zmian kroków | wygląd, przycisk główny wypełniony | p7 |
| ekran blokady, zegarek, widżet (`targets/`) | barwy z tokenów | tylko kolory i ikona | p8 |

## Słownik interakcji (bez zmian względem projektu; teksty przez rolę 09)
Anuluj / Zapisz / Dodaj w arkuszach; „Odrzucić zmiany?”; „Cofnij” dla serii rzędów (strażnik, F-47); usuwanie projektu, licznika, części → kosz 30 dni z datą (WD-3, potwierdzenie); „Usuń wszystko” z potwierdzeniem. Nowe słowa: „Kontynuuj” (karta), „Otwórz licznik” (pierwsze uruchomienie), „Projekt ›”, „Co dalej”, „Ten tydzień”.

## Macierz stanów (kluczowe ekrany)
| Ekran | Typowy | Pierwsze użycie | Częściowe | Ostrzeżenie | Inne |
|---|---|---|---|---|---|
| Dziś | `dzis-*` | `dzis-pierwszy-*` (licznik bez projektu, +1 działa) | część bez celu: bez linii celu i bez „za n rzędów” | limit dni: „Zostało 0 z 5…” + Oczko Pro (tekst i ikona, nie sam kolor) | iCloud/offline: wiersz stanu jednym zdaniem pod tygodniem (F-58), przy wdrożeniu |
| Licznik | `licznik-*` | 0 rzędów: dzianina = igła | bez celu: brak „Cel” w opisie, akcja „Cel” zostaje | przypomnienie w tym rzędzie: wiersz „co dalej” w akcencie + haptyka ostrzeżenia | blokada (F-03): kłódka przy +1, stuknięcie mówi, jak odblokować |
| Wzór | `wzor-*` | bez wzoru: menu źródeł (ZM-06) | — | — | ciemny motyw: strona w oryginale (ZM-10) |
| Historia | `historia-*` | pusty miesiąc: „Tu zobaczysz dni, w które dziergasz.” | — | — | — |
| Oferty | `oferty-*` | — | ładowanie: „Wczytywanie planów…” w miejscu planów; brak sieci: „Ceny są teraz niedostępne…”, „Przywróć zakupy” zostaje (przy wdrożeniu) | „Zapytaj o zakup”: `oferty-czeka-*` — linia ⓘ nad przyciskiem, przycisk wyłączony z klepsydrą i przerywaną ramką (nie sam kolor), plany i przywracanie dostępne; błąd zakupu/przywracania: linia „!” (`role=alert`) | aktywna subskrypcja: bez tej samej subskrypcji, „Zarządzaj subskrypcją”; dożywotni: „Masz Oczko Pro.”, bez planów (KP-03) |

## Głos
Strona czynna, druga osoba, bez wykrzykników i bez emoji. Pusty: zaprasza do działania („Stuknij +1 po każdym skończonym rzędzie.”). Błąd: co się stało i co zrobić („Nie zapisałam rzędu. Stuknij +1 jeszcze raz.”) [DO USTALENIA 09: forma rodzajowa w PL — obecne teksty]. Sukces: wynik słowami dziedziny („Rękaw lewy gotowy: 96 rzędów.”). Słowa zakazane: „zadanie”, „streak/seria”, „super!”, „brawo!”. Teksty uczące dziedziny — przez rolę 06.

## Ikona i ekran startowy (wpisy dla roli 08, p1)
Obecne kreski z zakreśleniem w barwach Dzianiny: tło `karta` `#3A332E`, kreski `#F3F1EC`, zakreślenie mioget `#C08425`; ciemna: tło `#1E1A17`, zakreślenie `#CF9636`; barwiona: bez zmian. `ikona.mjs` kod 0 dla wszystkich plików; arkusz `ikona/arkusz.png` (180/60/29 pt, jasna i ciemna tapeta).
- `icon` / `ios.icon.light`: `ikona/icon.png` · `ios.icon.dark`: `ikona/ios-dark.png` · `ios.icon.tinted`: `ikona/ios-tinted.png`
- `android.adaptiveIcon`: `foregroundImage` `ikona/android-foreground.png`, `monochromeImage` `ikona/android-monochrome.png`, `backgroundColor` `#3A332E`
- zegarek: `ikona/watch.png` (1088, tło nie czarne)
- ekran startowy (`expo-splash-screen`): `image` `ikona/splash-icon.png` na `#E6E1DA`; `dark.image` `ikona/splash-icon-dark.png` na `#26211E`. Bez intra (ruch tylko przy +1).
- Test `tests/jakosc/ikona-konfiguracja.test.ts` porównuje SHA-256 `assets/` z `docs/design/ikona/` — p1 kopiuje te pliki do obu miejsc razem.

## Czego nie sprawdzono
Urządzenie (Dynamic Type na żywo, VoiceOver, haptyka, SF Symbols, cyfry tabelaryczne Bree Serif), szerokości 320 i 430 pt i pozostałe stany (przy wdrożeniu, P-546), iPad, zegarek, ekran blokady, widżet; test z 3–5 osobami (przejście poznawcze) — krok właściciela po wdrożeniu.

## Przekazanie (E4, P-554)
- Rola 08 używa wyłącznie tokenów (`tokeny.json`) i komponentów z tabeli „Komponenty”; brakujący token albo stan → zgłoszenie do 04, nie wartość w kodzie. P1 podmienia `../design-spec.md`, `../tokeny.json`, `../ikona/` na ten katalog razem z testami (P-553).
- Po wdrożeniu każdej partii ekranów rola 04 wraca w trybie `audit`: zrzuty aplikacji porównane z `wzorce-zrzuty/` (linia bazowa SP-13); 320/430 pt i pozostałe stany dochodzą wtedy (P-546).
- Proponowany wpis do pamięci portfolio (repo `prompts`, moduł „pamięć portfolio”; dopisuje właściciel):

| Aplikacja | Metafora / element firmowy | Paleta (rdzeń) | Kroje | Uwagi właściciela |
|---|---|---|---|---|
| Oczko („Dzianina”, redesign M3) | Dzianina części rosnąca do celu: wysokość = rzędy gotowe / cel części, jaśniejszy pas = rzędy dziś, igła = bieżący rząd, ząbek w brzegu = rząd przypomnienia; ta sama dzianina na karcie „Kontynuuj”, liczniku, miniaturze projektu i w dniach kalendarza. Ikona: kreski z zakreśleniem (z poprzedniej wersji) w barwach Dzianiny | runo musket `#E6E1DA` / ciemne `#26211E`, tusz `#221D1A`, akcent mioget `#C08425` (ciemny `#CF9636`), grafit karty `#3A332E`; barwy z runa owiec szetlandzkich | Bree Serif (tytuły i liczby, OFL), treść systemowa | 05.11.2026: build 1071 „wygląda jak aplikacja wygenerowana w AI w 5 minut” → żaden ekran płaskim białym ani czarnym tłem, przycisk główny wypełniony w obu motywach (P-547); wybór „Dzianina”, ikona kreski (P-552), tło T2 i Bree (P-553), zatwierdzone bez poprawek (P-554). Monochromia „Kreski na wzorze” (poprzedni Oczko) uchylona P-544. |
