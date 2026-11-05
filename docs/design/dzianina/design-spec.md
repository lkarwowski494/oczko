# Oczko — system „Dzianina” (redesign M3)

Stan: E3 roli 04, 2026-11-05 · Decyzje: P-549 (przepływy `../to-be.md`), P-552 (kierunek „Dzianina”, ikona — kreski), P-553 (tło T2 Musket, Bree Serif, miejsce plików). Obowiązuje dla wdrożenia M3 (rola 08, partie p1–p8). Do wdrożenia p1 kod i testy czytają poprzedni system (`../design-spec.md`, `../tokeny.json`, `../ikona/`), który p1 zastępuje tym katalogiem razem z testami (P-553, wyjątek nazwany).

## Pliki
| Co | Plik |
|---|---|
| Tokeny (moduł motywu, propozycja) | `tokeny.json` → `tokeny.css` (makiety) skryptem `../narzedzia/dzianina-tokeny.mjs` |
| Tabela kontrastu (100 par: jasny, ciemny, oba „Zwiększ kontrast”; kod 0) | `kontrast-tabela.txt` (z `kontrast-pary.json`, `../narzedzia/kontrast.mjs`) |
| Makieta 6 ekranów TO BE | `ekrany.html` (ikony zastępcze `ikony.js`) |
| Zrzuty wzorcowe (linia bazowa SP-13): 6 ekranów × jasny/ciemny × domyślny/AX5 × 390 pt = 24, plus arkusz DE (4) | `wzorce-zrzuty/` (`../narzedzia/dzianina-zrzuty.mjs`) |
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
- „Zwiększ kontrast”: warianty `jasnyZwiekszony`/`ciemnyZwiekszony` (tekst drugi, akcent tekstu, linie, zakładki).

## Typografia
- Tytuły, nazwy projektów i liczby: **Bree Serif** (OFL, `../fonty/BreeSerif.ttf` + `breeserif-OFL.txt`), cyfry tabelaryczne (`fontVariant: ['tabular-nums']` — sprawdzić na urządzeniu, czy krój je ma [DO USTALENIA 08]). Pismo bez pokrycia (cyrylica, greka, CJK): krój systemowy. Bree ma jedną odmianę — przy „Pogrubionym tekście” bez zmiany. Nie przycinać pliku (Reserved Font Name „Bree”).
- Treść: krój systemowy (SF Pro), Dynamic Type do AX5. Skala i granice: `typografia` w tokenach (liczba licznika ×0,5–×1,3; „+1” ×1,4; zakładki ×1,6).
- AX5: układy przechodzą w pionowy stos (karta: dzianina nad opisem; licznik: akcje jako lista; tydzień 4+3; kafle 1 kolumna; −1 pod +1 na pełną szerokość). Zrzuty `*-ax5.png`.

## Odstępy, promienie, cele, ruch, haptyka
Jednostka 4 pt (`odstepy`). Promienie wg hierarchii: karta 22 > kafel 18 > przycisk 14 > pole/dzień 10; „+1” okrągłe. Cele ≥ 44 pt; „+1” karty 72 pt (AX5 100); „+1” licznika ≥ 168 pt wysokości w zasięgu kciuka; dni kalendarza ≥ 44 pt także przy 320 pt (siatka na pełną szerokość, 320 / 7 = 45,7 pt). Ruch tylko przy „+1” i zmianie ekranu (`ruch`). Haptyka (`haptyka`): rząd — lekkie stuknięcie; przypomnienie — ostrzeżenie (inne niż rząd, F-48); cel części — sukces; cofnięcie — miękkie. Dźwięk: brak domyślnie.

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
| `oferty`, `uczciwe-zasady`, `ukonczenie` | bez zmian kroków | wygląd, przycisk główny wypełniony | p7 |
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
