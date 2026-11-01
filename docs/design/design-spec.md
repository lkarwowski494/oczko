# Oczko: system projektowy (kierunek A „Kreski na wzorze”)
Stan: E4 (przekazanie) · 2026-10-22 · Rola 04, build; fix NZ-P217-04 2026-10-26 (P-220: wzór, rysik, iPad; rozszerzenie „Udostępnij”, iCloud); fix NZ-08-P5-BD 2026-10-26 (P-191: stoper, sesje, Historia; narzędzia, zapas, zdjęcia, karta); fix NZ-08-P5-Q1 2026-10-26 (P-183: projekt, części, kosz, „last worked” bez progu); fix NZ-05-F4-04 2026-10-26 (P-142: zegarek „nie zapisano”, blokada licznika na ekranie blokady i zegarku, `uwaga` → makiety); fix NZ-08-P3-04 2026-10-26 (P-133: ekran blokady i zegarek, notatka bez znacznika, import przerwany, data ukończenia, etykieta robocza); fix NZ-08-P2-04 2026-10-26 (P-126: projekt roboczy, zużycie, znacznik wzoru, „Uczciwe zasady”, „Źródła wiedzy”, kreski przez północ, język) ; fix-8 2026-10-27 (P-243 S2a, P-268: kosz wzoru, przycisk niszczący; opcje dla licznika przy AX5 i arkusza przy klawiaturze w `fix8-2026-10-27.md`) · Decyzje: P-061 (E0), P-062 (metafory), P-063 (kierunek A), P-064 (Libre Franklin), P-065 (E3: limit zawczasu, licznik dni, oferty, ikona, cofanie serii). Programista (08) używa wyłącznie tokenów i komponentów stąd; zmiany wyglądu tylko przez rolę 04.

## Pliki
| Co | Plik |
|---|---|
| Tokeny (moduł motywu, propozycja) | `tokeny.json` |
| Tabela kontrastu (70 par, kod 0) | `kontrast-tabela.txt` (z `narzedzia/tokeny-kontrast.mjs` + `narzedzia/kontrast.mjs`) |
| Kluczowe ekrany (7 stanów; fix NZ-08-P2-04: +10 nowych, 2 zmienione) | `ekrany.html`; zrzuty wzorcowe 320/390/430 pt × jasny/ciemny × domyślny/AX5: `wzorce-zrzuty/` (204 pliki, linia bazowa SP-13); kontrola pokrycia fixu: `narzedzia/kontrola-nz08p204.mjs` |
| Ekran blokady, Dynamic Island, zegarek, Smart Stack (fix NZ-08-P3-04) | `aktywnosc.html`; zrzuty wzorcowe: `wzorce-zrzuty/aktywnosc-*` (blokada i wyspa 320/393/430 × jasny/ciemny × tekst domyślny/duży; zegarek 41/46 mm × domyślny/duży), `narzedzia/zrzuty-aktywnosc.mjs`; kontrola fixu: `narzedzia/kontrola-nz08p304.mjs`; fix NZ-05-F4-04: `narzedzia/kontrola-nz05f404.mjs` |
| Projekt, części, kosz (fix NZ-08-P5-Q1) | `fix5-2026-10-26/projekt-kosz.html` (22 stany), wzorce `wzorce-zrzuty/projekt-kosz-*` (264), klucze `fix5-2026-10-26/klucze.json` + `narzedzia/nakladaj-klucze-fix5.mjs`; kontrola `narzedzia/kontrola-nz08p5q1.mjs` |
| Stoper, sesje, Historia (fix NZ-08-P5-BD, grupa B) | `fix6-2026-10-26/sesje-historia.html` (17 stanów), wzorce `wzorce-zrzuty/sesje-historia-*` (204), klucze `fix6-2026-10-26/klucze.json` + `narzedzia/nakladaj-klucze-fix6.mjs`; kontrola `narzedzia/kontrola-nz08p5bd.mjs` |
| Narzędzia, zapas, zdjęcia, obraz karty (fix NZ-08-P5-BD, grupa D) | `fix6-2026-10-26/narzedzia-zdjecia.html` (17 stanów), wzorce `wzorce-zrzuty/narzedzia-zdjecia-*` (204) |
| Wzór, rysik, iPad (fix NZ-P217-04, grupa W) | `fix7-2026-10-26/wzor.html` (27 stanów), wzorce `wzorce-zrzuty/wzor-*` (268, `narzedzia/zrzuty-fix7.mjs`), klucze `fix7-2026-10-26/klucze.json` + `narzedzia/nakladaj-klucze-fix7.mjs`; kontrola `narzedzia/kontrola-nzp21704.mjs` |
| „Udostępnij do Oczka”, skrzynka, iCloud (fix NZ-P217-04, grupy R i I) | `fix7-2026-10-26/udostepnij-icloud.html` (19 stanów), wzorce `wzorce-zrzuty/udostepnij-icloud-*` (228) |
| Kosz wzoru, przycisk niszczący; opcje: licznik przy AX5, arkusz przy klawiaturze (fix-8) | `fix8-2026-10-27/fix8.html` (13 stanów na ekranie o wysokości urządzenia), wzorce `wzorce-zrzuty/fix8-*` (156, `narzedzia/zrzuty-fix8.mjs`), pomiar `fix8-2026-10-27/pomiar.json`, klucze `fix8-2026-10-27/klucze.json` |
| Klikalny prototyp i przejście poznawcze | `prototyp.html`, scenorys `przejscie/` (`narzedzia/scenorys.mjs`) |
| Ikona | `ikona/` (warstwy SVG, `icon.png`, `ios-dark.png`, `watch.png`, `android-foreground.png`, `android-monochrome.png`, `splash-icon.png`, `arkusz.png`) |
| Kroje (OFL) | `fonty/LibreFranklin.ttf` + licencja; treść: krój systemowy |
| Historia kierunków | `01-swiat.md`, `kierunki/`, `porownanie.html`, `kroje.html` |

## Limit dni na ekranach (P-065, warunkowo do potwierdzenia przez 02)
- **Nowy dzień ponad limit (`limit-zawczasu`):** zamiast przycisków +1 i −1 komunikat „No free crafting days left in {month}. Counting is paused until {date}. Your {n} rows and everything else are kept.”; pod liczbą odnośnik „Oczko Pro removes the limit” (poza strefą +1). Historia, menu, wzór, eksport działają.
- **Przypadek brzegowy (`limit`):** nowy dzień zaczął się przy otwartej aplikacji (po przerwie ≥ 60 min, D3): stuknięcie zatrzymane, arkusz „Row {n} wasn’t added” z definicją dnia; potem ekran przechodzi w stan zawczasu.
- **Licznik darmowych dni:** lista projektów („3 of 5 free crafting days left in November”) i Ustawienia; na ekranie licznika tylko w ostatnim darmowym dniu cicha linia „1 free crafting day left in November” pod liczbą (wyjątek nazwany od P-046).
- Ekran ofert tylko z odnośnika na limicie i z Ustawień (KP-13); przy Pro żadnej z tych linii.

## Element firmowy
- **Kreski sesji:** rzędy dodane w projekcie w bieżącym posiedzeniu (definicja niżej, „Kreski sesji przez północ”), w piątkach (piąta przekreśla cztery), grafitem na papierze; najwyżej 25 widocznych, liczba zawsze w podpisie nad kreskami („Marks this session: 14 rows since 19:52”, klucz `licznik.znaczniki_sesji_other`). Grafika `aria-hidden`; dane niesie podpis (soczewka VoiceOver, E2).
- **Zakreślenie instrukcji:** rząd z przypomnieniem (F-06) jako pas zakreślacza z krawędzią; treść instrukcji powtórzona w podpisie przycisku +1 i ogłaszana raz przy wejściu w ten rząd (nie przy każdym +1).
- **Linijka celu (z C):** „Goal 96 rows · 49 to go” pod liczbą, tylko gdy część ma cel (U-8).
- **Kolor włóczki (z B, wariant):** kropka przy nazwie projektu; nigdy jedyny nośnik informacji.

## Komponenty
| Komponent | Systemowy czy własny | Uwagi |
|---|---|---|
| Pasek nawigacji, wstecz, duży tytuł | systemowy | nad tytułem części nazwa projektu; pod tytułem „Now working row 48” (20 pt): duża liczba to rzędy skończone; stuknięcie w tytuł otwiera menu projektu |
| Przycisk +1: podpis | własny | „tap when row 48 is done” (soczewki: niejasne, czy +1 zaczyna, czy kończy rząd). **Przy kategoriach dostępności tekstu** (`isAccessibilityCategory`, AX1–AX5; fix-8, P-275 (3)): podpis tylko w etykiecie VoiceOver, strefa +1 wraca do 168 pt |
| Licznik przy dużym tekście (fix-8, P-275 (3)) | układ | przy kategoriach dostępności liczba („47 of 96” i linijka celu) stoi **nad** nazwą projektu, nazwą części i „Now working row n”; reszta środka bez zmian i przewija się; kolejność VoiceOver idzie za wyglądem (liczba → nazwy); bez automatycznego przewijania do liczby. Pomiar: liczba widoczna bez przewijania przy 320×568, 390×844 i 430×932 (`fix8-2026-10-27/pomiar.json`, `licznik-d`); makieta `fix8-2026-10-27/fix8.html`, wzorce `wzorce-zrzuty/fix8-licznik-d-*` |
| Przycisk +1 (strefa na dole, ≥ 168 pt wysokości) i −1 (72 × 72 pt, 28 pt odstępu) | własny kształt, zachowanie przycisku systemowego | etykieta zawiera widoczny tekst („+1 row …”, WCAG 2.5.3) |
| Kreski sesji, zakreślenie instrukcji | własne (SVG → `react-native-svg`) | opis tekstowy w podpisie |
| Blokada licznika | pozycja w menu ••• („Lock counter (ignore taps)”); w stanie zablokowanym pasek „Counter locked · Unlock” pod paskiem nawigacji | przeniesiona z paska: kłódka czytała się jak znak płatnej funkcji (przejście poznawcze, nowa osoba); stuknięcie w zablokowany licznik: „Counter is locked. Unlock it at the top.” (BR-LIC-004) |
| Baner strażnika „Added 3 rows in 1 s. Undo?” | własny, w układzie pod tytułem (z dala od +1, rośnie z tekstem) | F-47, RD-17; nie znika po czasie (WCAG 2.2.1), znika przy kolejnym zwykłym +1; po Undo potwierdzenie „Removed 3 rows. Back to 30.” |
| Arkusze (historia, menu •••, formularze, limit, oferty, ukończenie) | systemowe arkusze | przy dużym tekście sięgają pod pasek stanu, treść się przewija, przyciski zawsze widoczne. Dwa rodzaje (jak w makietach od E3): **arkusz formularza** (pola, klawiatura) ma Cancel / tytuł / Save w nagłówku u góry (słownik studia; `naglowek-arkusza`), więc klawiatura go nie zasłania; **arkusz decyzji** bez pól (limit, ukończenie, skrzynka, „Delete all data”) ma przyciski na dole (`przyciski`) |
| Przycisk niszczący (`niszczacy`, fix-8, P-268) | własny, zachowanie przycisku systemowego | tło `przyciskNiszczacyTlo` (= `blad`), tekst `przyciskNiszczacyTekst` (= `papier`), wymiary jak przycisk pełny (≥ 52 pt, promień 14); tylko w arkuszu decyzji, której jedynym celem jest nieodwracalne usunięcie (dziś: „Delete all data”), jeden na ekran, nad Cancel; etykieta to nazwa akcji („Delete all data”), więc znaczenie nie zależy od koloru (SP-05). Potwierdzenia usunięcia z koszem i bez zostają alertem systemowym ze stylem `destructive`. Nieaktywny: tokeny `przyciskNieaktywny*`. Kontrast: tekst 6,36:1 jasny / 9,98:1 ciemny, tło do arkusza 6,36:1 / 8,18:1 (`kontrast-tabela.txt`, także „Zwiększ kontrast”) |
| Listy (projekty, ustawienia) | systemowe listy grupowane | nagłówki sekcji zwykłą wielką literą na początku (nie wersalikami) |
| Symbole | SF Symbols, waga jak sąsiedni tekst | skalują się z tekstem |

## Słownik interakcji (domyślny studia, z decyzjami projektu)
| Termin | Kiedy |
|---|---|
| **+1 row / −1** | główne działanie; −1 to korekta, nie cofnięcie |
| **Undo** | baner strażnika i ostatnia zmiana w historii (BR-LIC-003) |
| **Save / Cancel** | formularze w arkuszach |
| **Mark as finished** | ukończenie (U-9), potem karta i pytanie o włóczkę |
| **Delete {object}** | z potwierdzeniem; trafia do „Recently deleted” na 30 dni (P-026, BR-DAN-008) |
| **Not now** | neutralna odmowa na komunikacie limitu |
Rutynowe usuwanie: potwierdzenie i „Recently deleted” 30 dni (P-026); cofnięcie serii stuknięć bez pytania (baner, P-065 (5a)).

## Macierz stanów kluczowych ekranów
| Ekran | Stany (wzorcowe zrzuty albo prototyp) |
|---|---|
| Licznik | pierwsze uruchomienie (`licznik-start`); typowy z instrukcją (`licznik-w-toku`); zablokowany (prototyp); seria stuknięć z banerem (prototyp, z2); na limicie (`limit`); błąd zapisu: „Couldn’t save that row. It’s still on screen; try again.” (do E4); offline: bez zmian (wszystko lokalne, NFR-OFF-001) |
| Ekran blokady (Live Activity) | typowy ze stoperem (`blokada-typowy`); przypomnienie (`blokada-przypomnienie`; kilka w rzędzie: `blokada-przypomnienie-wiecej`); limit (`blokada-limit`); restart bez odblokowania (`blokada-odblokuj`); błąd zapisu (`blokada-blad-zapisu`); licznik zablokowany (`blokada-zablokowany`); projekt roboczy (`blokada-robocza`); Dynamic Island: `wyspa-compact`, `wyspa-minimal`, `wyspa-rozwinieta`, `wyspa-przypomnienie`, `wyspa-zablokowany` (`aktywnosc.html`) |
| Zegarek | typowy (`zegarek-typowy`); przypomnienie z wibracją (`zegarek-przypomnienie`, kilka w rzędzie: `zegarek-przypomnienie-wiecej`); limit (`zegarek-limit`); telefon poza zasięgiem (`zegarek-bez-telefonu`); nieudany zapis stuknięcia (`zegarek-nie-zapisano`, `zegarek-nie-zapisano-minus`); licznik zablokowany (`zegarek-zablokowany`, `zegarek-smart-stack-zablokowany`); brak stanu (`zegarek-bez-stanu`); Smart Stack i CarPlay: typowy (`zegarek-smart-stack`), przypomnienie, limit, bez sesji, projekt roboczy (`zegarek-smart-stack-przypomnienie`, `-limit`, `-bez-sesji`, `-robocza`); 40/46/49 mm i CarPlay 170 × 78, 240 × 100 |
| Licznik przez północ | posiedzenie trwa po północy, podpis z godziną startu (`licznik-przez-polnoc`) |
| Projekty | typowy z „last worked …” w każdym wierszu, bez progu (`projekty`, P-183 1a), wejście do kosza tylko przy niepustym (`projekt-kosz-lista`); pusty: „No projects yet. Your first row starts one.” (prototyp); brak wyników: „No project called “…”.” |
| Oferty | typowy (`oferty`); aktywna subskrypcja: stan Pro + „Manage subscription” (KP-03, KP-14; do E4); brak sieci: ceny niedostępne, „Restore purchases” działa po powrocie sieci |
| Import | przerwany przez czas w tle, dane sprzed importu, „Try again” (`import-przerwany`) |
| Ukończenie | karta z pytaniem o zużycie włóczki w motkach (`ukonczenie`, prototyp z5); zużycie ponad zapas: linia informacji, zapas 0 (`ukonczenie-ponad-zapas`); zmiana daty ukończenia (`ukonczenie-data`); bez włóczki w projekcie: pytanie pominięte |
| Wzór: znacznik | pierwsze ustawienie z wyborem kierunku (`wzor-kierunek`); ustawiony (`wzor-znacznik`); koniec strony (`wzor-koniec-strony`); notatka bez znacznika (`wzor-notatka-bez-znacznika`); Word w podglądzie zastępczym: bez znacznika |
| Wzór: przeglądarka, import, iPad | pionowo z paskiem licznika (`wzor-pionowo`), poziomo (`wzor-poziomo`), przełączanie, menu, usunięcie, zakreślacz, Word (`wzor-*`); projekt bez wzoru i z wzorami (`projekt-wzor-pusty`, `projekt-wzory`); dodanie, link, film (`wzor-dodaj`, `wzor-link`, `wzor-film`); w toku, czeka na sieć, błędy pliku, typu, rozmiaru, strony, aparatu, film bez sieci; iPad pion, poziom, rysik, wąskie okno, licznik, lista (`ipad-*`) |
| Projekt roboczy | lista z etykietą z daty (`projekty-robocze`); licznik nienazwany z arkuszem nazwy (`projekt-nazwij`); pusta nazwa przy Save: zostaje nienazwany |
| Źródła wiedzy | typowy (`zrodla-wiedzy`); offline bez zmian (treść w aplikacji) |
| Język | lista z „Same as phone” (`jezyk`); język telefonu spoza 35: angielski bez podpowiedzi (P-115); uszkodzony zapis: „Same as phone” |
| Projekt i części | typowy (`projekt`), bez celów i terminu (`projekt-bez-celow`), ukończony z „Resume” (`projekt-ukonczony`), menu „+” i ••• (`projekt-dodaj`, `projekt-menu`), tryb Edit (`projekt-edycja`), arkusze (`nowy-projekt`, `dodaj-czesc`, `dodaj-licznik`, `notatka`, `znaczenie`, `narzedzie`, `termin`), cel części i „What’s next?” (`licznik-cel`, `co-dalej`), całość (`licznik-calosc`); błąd pola rozmiaru: `formularz.narzedzie_blad` |
| Stoper i sesje | bez sesji, trwa, menu, wstrzymana, inny projekt, limit, blokada, po automatycznym zamknięciu (`licznik-stoper*`); czas projektu (`projekt-czas`), lista (`sesje`), korekta i błąd (`sesja-korekta`, `sesja-korekta-blad`) |
| Historia | typowy (`historia`), dzień pusty, dzień z samym stoperem, okres bez stopera, pierwsze użycie (`historia-*`); offline bez zmian |
| Narzędzia i zapas | kalkulator: typowy, na 4 in, błąd (`probka*`); zapas: typowy, filtr, pusty, formularz (`zapas*`, `wloczka`); druty (`druty-lista`, `drut`); offline bez zmian |
| Zdjęcia i karta | grupa w projekcie, źródło, podgląd, usunięcie, brak dostępu do aparatu (`projekt-zdjecia`, `zdjecie-*`); obraz karty z czasem i bez stopera (`karta-obraz*`) |
| Usuwanie i kosz | potwierdzenia z datą (`usun-projekt`, `usun-czesc`, `usun-licznik`, `fix8-usun-wzor`); kosz (`kosz`, z wzorem, włóczką i drutem: `fix8-kosz-z-wzorem`), pusty (`kosz-pusty`, `fix8-kosz-pusty`); offline bez zmian |
| Udostępnij, skrzynka, iCloud | arkusz z listą projektów, link (wzór albo film), bez migawki, za duży, nieobsługiwany (`udostepnij*`); skrzynka i błąd (`skrzynka*`); iCloud: wyłączony, włączanie, aktywny, czeka, brak konta, brak miejsca, inne konto, konflikt na liczniku i wybór, niepełna historia, „Replace” przy włączonej, usuń wszystko (`icloud-*`) |
| Okno „Uczciwe zasady” | raz nad dozwolonym ekranem (`uczciwe-zasady`); zamknięte dowolnie = widziane; przy Pro, stanie niepewnym albo na niedozwolonym ekranie: brak |

## VoiceOver: komunikaty i zachowanie (dla 08; z przejścia poznawczego E3)
| Chwila | Ogłoszenie (`announceForAccessibility`) | Zachowanie |
|---|---|---|
| +1 | „47 done. Now row 48.” | fokus zostaje na +1; Magic Tap (`onMagicTap`) = +1 |
| wejście w rząd z instrukcją | „Row 48: decrease at both ends, 7 of 8.” (raz, po +1, które w niego wprowadza) | etykieta +1 zawiera instrukcję |
| seria stuknięć (F-47) | „Added 3 rows in 1 second. Undo is available.” | przycisk „Undo 3 rows”; baner bez limitu czasu |
| limit (BR-ZAK-006) | „Row 48 wasn’t added. Free crafting days for November are used. Nothing is lost.” | arkusz jako modal (`accessibilityViewIsModal`), fokus na nagłówku |
| ukończenie | „Harbor Sweater moved to Finished.” | — |
| arkusze i formularze | — | fokus na nagłówku; każde pole z `accessibilityLabel` (nie sam tekst obok); podgląd planu rzędów dołączony do etykiety „Save reminder” |
| oferty | — | plany: `accessibilityRole="radio"` + `accessibilityState.selected`; Privacy Policy i Terms of Use: rola link |
| grafika | — | kreski i zakreślenie `accessibilityElementsHidden`; dane w podpisach |

## Głos
- Słowa dziergających: row, part, decrease, skein; nie „item”, „entry”, „session data”.
- Zdania zwykłe, strona czynna, bez wykrzykników i sprzedawania. Błąd: co się stało i co zrobić. Pusty ekran: jedno zaproszenie do działania.
- Zakazane: „Oops”, „Upgrade now”, „Unlock”, „free trial”, procenty i porównania cen (P-054), straszenie utratą danych.
- **Wyjątek nazwany (P-133 (1.2a), rozszerzony P-142 (t1)):** „Unlock” wolno w dwóch znaczeniach: odblokowanie telefonu, zawsze z dopełnieniem „iPhone” („Unlock iPhone to count.”), i zdjęcie blokady licznika („Unlock” na pasku blokady w aplikacji, „Unlock it in Oczko.” na ekranie blokady i zegarku); nigdy o funkcjach ani zakupie. *Dlaczego:* to słowa iOS i samej aplikacji dla czynności, które użytkowniczka zna, a zakaz chroni przed językiem sprzedaży, nie przed nazwą akcji (ta sama akcja ma tę samą nazwę w całym przepływie). Oba znaczenia nigdy nie stoją na ekranie blokady razem: przy blokadzie licznika nie ma przycisku, więc nie ma stuknięcia ani komunikatu „Unlock iPhone”.
- Teksty dziedzinowe (instrukcje, nazwy ściegów) pisze użytkownik; aplikacja ich nie uczy.

## Teksty ofert (P-065 (3a): wariant 1)
- Wariant 1 (w makiecie): nazwy planów „Monthly · $0.99 / month”, „Yearly · $6.99 / year”, „Lifetime · $14.99 once”; nagłówek „Oczko Pro”, „Count rows on as many days as you like. Everything else stays the same.”; pod planami: „Without Pro: 5 crafting days every month, and all your projects and data, always.”
- Odrzucony wariant 2: podpisy właściciela przy planach (P-065).
- Ujawnienia (1)–(7) z `docs/monetyzacja.md` „Sesja 3, E3”: nazwa, okres, cena ze sklepu (KP-09); odnawianie i anulowanie w ustawieniach Apple ID; „Restore purchases”; Privacy Policy, Terms of Use; co daje Pro i co zostaje; zamknięcie i „Not now”; Family Sharing tylko, gdy włączone.

## Okno „Uczciwe zasady” (KP-16, P-103 (5a), P-109, P-126 (4); wzór Treningu)
- **Kiedy:** `oknoUczciweZasady()` = prawda (dzień bez Pro z ≥ 1 +1 minął, pewny stan darmowy, flaga „widziane” = fałsz). Pokazuje się raz, jako arkusz systemowy, nad pierwszym **dozwolonym** ekranem po otwarciu aplikacji: lista projektów, kalendarz i historia, Ustawienia, zapas, narzędzia. **Nigdy** nad licznikiem, nie nad wzorem (liczenie z oczami na wzorze, SP-17), ofertami, kartą ukończenia ani innym otwartym arkuszem; wtedy czeka do następnego dozwolonego ekranu.
- **Układ:** uchwyt, w nagłówku „Zamknij” (✕, prawy górny róg, słownik studia), nagłówek, trzy zdania, przycisk główny zamyka, przycisk tekstowy zamyka i otwiera ofertę (KP-13: wejście z Ustawień). Każde zamknięcie (✕, przycisk, gest w dół, tło) ustawia flagę „widziane” — jak Trening `markFairRulesSeen`. Bez cen, procentów i wykrzykników (P-054, Głos).
- **VoiceOver:** `accessibilityViewIsModal`, fokus na nagłówku; ✕ z etykietą „Close”.
- **Karta planów po imporcie: poza 1.0** (P-113 Q2a, P-117 Q1a) — w 1.0 nie ma tego ekranu ani miejsca na niego; wraca z F-29.

| Klucz | en (źródło, ADR-0017) |
|---|---|
| `uczciwe.tytul` | Your first crafting day is done |
| `uczciwe.wszystko` | Everything in Oczko works from the first day, with no account and no ads. |
| `uczciwe.darmowe_one` / `_other` | Count rows for free on {{count}} day every month, for as long as you like. Your projects and data always stay yours. / Count rows for free on {{count}} days every month, … |
| `uczciwe.pro` | Want more days? Oczko Pro removes the limit, as a subscription or a one-time purchase. |
| `uczciwe.dalej` | Keep counting |
| `uczciwe.plany` | See Oczko Pro |
| `wspolne.zamknij` | Close |
`{{count}}` = `LIMIT_DNI_W_MIESIACU` z konfiguracji (dziś 5), nie wpisane na stałe.

## Ekran „Źródła wiedzy” (ZM-04, BR-KAL-008, P-108, P-112, P-126 (5))
- **Wejście:** wiersz w Ustawieniach (lista grupowana, sekcja z polityką prywatności i językiem) → ekran z dużym tytułem i przyciskiem wstecz; działa bez sieci.
- **Treść:** jedno ogólne zdanie (P-108 (4)) i linia źródła wymagana warunkami użycia organizacji standardów (P-112 (2)), w stylu podpisu (ołówek, 15 pt). Nic więcej: bez listy książek, autorów, producentów, adresów i cytatów (P-108 (1), (2)). Linia nie jest odnośnikiem.
- **Przy tabelach** opartych na tych standardach (kategorie grubości włóczki, rozmiary drutów i szydełek): ta sama linia pod tabelą, tym samym stylem; w tekstach obok tabeli żadnych innych nazw źródeł (BR-KAL-008 S3).
- Jedna opcja: BR-KAL-008 nakazuje osobny ekran i jego treść.

| Klucz | en |
|---|---|
| `ustawienia.zrodla_wiedzy` | About our information |
| `zrodla.zdanie` | The tables and tips in Oczko are written in our own words, based on industry standards and guidance from craft organizations. |
| `zrodla.linia_standardow` | dosłownie linia z BR-KAL-008, scenariusz „Ekran «Źródła wiedzy»” (S-24); w `docs/design/` tylko odsyłacz, bo każde nowe wystąpienie nazwy organizacji zatrzymuje `verify` (P-121 (5)). W przekładzie (09) zmienia się tylko słowo „Source:”, nazwa i adres zostają. |

## Projekt roboczy: etykieta zamiast nazwy (BR-LIC-001, P-126 (1b), jak Trening)
- **Dane:** pierwszy +1 bez projektu tworzy projekt **nienazwany** (flaga „nienazwany” w wierszu projektu: SQL dopisuje 05 fix-3 w `dane.md`, P-124/P-126; wdraża 08 w partii 3). Data `RRRR-MM-DD` w kolumnie nazwy nie jest pokazywana nigdzie w interfejsie; jeśli 05 nie przyjmie flagi, obowiązuje (1a): przy pierwszym +1 zapis tekstu `projekty.nazwa_robocza` w bieżącym języku.
- **Wyświetlanie:** etykieta liczona przy każdym renderze z chwili startu projektu, w bieżącym języku i formacie regionu (ADR-0017): na liście „Counter from Oct 26, 18:40”, w wyszukiwaniu ta sama etykieta. Godzina odróżnia dwa liczniki z jednego dnia. Rok tylko, gdy inny niż bieżący.
- **Ekran licznika projektu nienazwanego:** duży tytuł „Counter”, pod nim „Started Oct 26, 18:40 · Name it”; „Name it” otwiera arkusz nazwy. W menu ••• pierwsza pozycja „Name project”. Przed pierwszym +1 (brak projektu) ekran jak `licznik-start` — nic nie pyta o nazwę (NFR-PIE-001).
- **Arkusz nazwy:** Cancel / „Name project” / Save (słownik); pole z klawiaturą od razu; Save przy pustym polu zostawia projekt nienazwany (nic nie znika); po zapisie flaga gaśnie, licznik i historia bez zmian (BR-LIC-001 S3). VoiceOver: pole z etykietą „Project name”, obrys `drugiPrzyciskObrys` (≥ 3:1 do arkusza w obu motywach).

| Klucz | en |
|---|---|
| `projekty.nazwa_robocza` | Counter from {{data}} (`{{data}}` = data i godzina startu, krótki format regionu) |
| `projekt.nazwij` | Name it |
| `licznik.tytul_roboczy` | Counter |
| `licznik.start_roboczy` | Started {{data}} |
| `projekt.menu_nazwij` | Name project |
| `projekt.nazwa_tytul` | Name project |
| `projekt.nazwa_pole` | Project name |
| `projekt.nazwa_zostaje` | The {{count}} rows and their history stay with this project. (`_one` / `_other`) |
| `aktywnosc.nazwa_robocza` | Counter from {{data}} — wariant krótki: `{{data}}` bez godziny (ekran blokady, Dynamic Island, zegarek, Smart Stack) |

**Format `{{data}}` (fix NZ-08-P3-04, P-126 (1b), jak Trening „Trening z {d}”):**
- Liczony przy każdym wyświetleniu z `utworzono_ms` projektu w **bieżącym języku** aplikacji i formacie regionu (ADR-0017): `Intl.DateTimeFormat(jezykAplikacji, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })`; **rok tylko**, gdy inny niż bieżący (`year: 'numeric'`); 12/24 h z regionu, nie z języka. Wariant krótki: te same opcje bez `hour` i `minute`.
- Przykłady (en-US / pl / de): „Counter from Oct 26, 6:40 PM” / „Licznik z 26 paź, 18:40” / „Zähler vom 26. Okt., 18:40” — tłumaczenia robi 09; szyk i przyimek należą do tłumaczenia całego zdania, nie do sklejania (wpis kontekstu w `en.kontekst.json`: „{{data}} = date and time the counter was started; a label, not a name”).
- Etykieta nie jest nazwą: nie trafia do kolumny `nazwa` jako tekst (tam data `RRRR-MM-DD` i `nienazwany = 1`, `dane.md`), wyszukiwanie szuka w etykiecie w bieżącym języku, eksport CSV/archiwum niesie dane, nie etykietę.
- **Ekran blokady i zegarek:** aplikacja wylicza wariant krótki i wpisuje go do pola `nazwa` stanu (cele natywne nie liczą dat po swojemu); po zmianie języka aplikacji stan trzeba odświeżyć — zmiana języka nie jest dziś na liście wyzwalaczy ADR-0008 (7) → zgłoszenie dla 05 (N3 w `fix2-2026-10-26.md`).

## Zużycie włóczki przy ukończeniu (BR-ZAP-002, U-9, P-126 (2a))
- **Pytanie:** po „Mark as finished” karta ukończenia ma grupę „Yarn used”: każda włóczka przypisana do projektu jako wiersz z nazwą, podpisem „{n} skeins in your stash” i krokowcem − [pole] + (obrysy `drugiPrzyciskObrys`, ≥ 3:1; krok 0,5 motka; pole przyjmuje wpis liczby wg P-097 (5a)). Zapis do `projekt_wloczka.zuzyto_motki` (schemat), nie „ile zostało”. Brak włóczki w projekcie: grupy nie ma.
- **Zużycie ponad zapas (2a):** wartość większa niż zapas jest przyjmowana; pod grupą jedna linia informacji (ikona „i” + tekst, nie kolor błędu, bo nic nie jest źle): „That’s more than the 2 skeins in your stash. Your stash will show 0.” z odnośnikiem „Edit stash” (otwiera tę włóczkę w zapasie; karta zostaje). „Done” działa zawsze; zapas po zapisie = max(0, zapas − zużycie) — domena (zapas nie schodzi poniżej 0). Zapas już 0: linia „Your stash already shows 0 for this yarn.”
- **VoiceOver:** pole jako `adjustable` z etykietą „Skeins of {yarn} used” (akcje zwiększ/zmniejsz = krokowiec); linia informacji ogłaszana raz, gdy się pojawi (`role=status`).

| Klucz | en |
|---|---|
| `ukonczenie.wloczka_naglowek` | Yarn used |
| `ukonczenie.w_zapasie_one` / `_other` | {{count}} skein in your stash / {{count}} skeins in your stash |
| `ukonczenie.zuzycie_etykieta` | Skeins of {{nazwa}} used |
| `ukonczenie.zuzycie_mniej` / `ukonczenie.zuzycie_wiecej` | One skein less / One skein more (etykiety krokowca; krok 0,5: „Half a skein less/more” `[DO USTALENIA]` z 09) |
| `ukonczenie.zuzycie_ponad_zapas_one` / `ukonczenie.zuzycie_ponad_zapas_other` | That’s more than the {{count}} skein in your stash. Your stash will show 0. / That’s more than the {{count}} skeins in your stash. Your stash will show 0. |
| `ukonczenie.zapas_juz_zero` | Your stash already shows 0 for this yarn. |
| `ukonczenie.edytuj_zapas` | Edit stash |

## Znacznik rzędu na wzorze (BR-WZR-003, ADR-0011 uzupełnienie, P-118 Q2a, P-126 (3a))
Znacznik to „linijka” na jednym dokumencie wzoru (reguła OG-07 bez zmian): pas o wysokości rzędu z dwiema grafitowymi krawędziami (`kolor.wzor.znacznik`, 14,76:1 do strony) i etykietą „Row 48 ↑” (biały tekst na grafitowej zakładce, 14,37:1). Stałe kolory w obu motywach, bo strona to dokument użytkownika. Nie zakreślacz: żółty zostaje dla rzędu z instrukcją na liczniku (jeden kolor, jedno znaczenie).
- **Ustawienie (gest i przycisk):** przytrzymanie na stronie stawia pas w tym miejscu; przycisk „Mark row” w pasku nawigacji stawia go na środku widocznej strony (alternatywa gestu, SP-15). Pas przeciąga się w pionie; uchwyt dolnej krawędzi ustala wysokość rzędu (`wysokosc_rzedu`). Rząd znacznika: krokowiec w pasku, domyślnie rząd z „Now working row n” (= licznik + 1; potwierdzenie w BR-WZR-003: N3 → 01).
- **Kierunek (3a): bez wartości domyślnej.** Przy pierwszym ustawieniu w danym wzorze pasek pyta „Which way do rows go on this page?” dwoma przyciskami „↑ Up, like a chart” (`kierunek = −1`) i „↓ Down, like written steps” (`1`); „Done” pojawia się po wyborze. Wybór zapisany w znaczniku i proponowany przy każdym następnym ustawieniu w tym wzorze; zmiana: „Change” w pasku. Strzałka w etykiecie pokazuje kierunek.
- **Przy liczeniu:** pasek ustawień chowa się po „Done”; +1 przesuwa pas o rząd w wybranym kierunku (`polozenieZnacznika`), ruch tylko gdy nie ma „Ogranicz ruch” (inaczej skok).
- **Koniec strony (`pozaStrona: true`):** pas stoi na krawędzi, krawędź od strony wyjścia przerywana, etykieta „Row 61 · page end”; pasek: „Row 61 is past the top of page 2” (albo „bottom”), „Move the marker to row 61 on the next page.”, przycisk „Place on page 3” przewija do następnej strony i stawia pas przy krawędzi, od której zaczyna się kierunek (dół dla ↑, góra dla ↓), w trybie przeciągania; użytkownik dosuwa go do rzędu. Ostatnia strona: „Row 61 is past the end of the pattern.” i przycisk „Move marker”. Żadnego automatycznego przejścia (P-118 Q2c).
- **VoiceOver:** pas jako element `adjustable` z etykietą „Row marker, row 48, rows go up”; akcje zwiększ/zmniejsz przesuwają o rząd, akcja „Move to next page” przy końcu strony; zmiana stanu końca strony ogłaszana raz.
- Word w podglądzie zastępczym (`QLPreviewController`, P-071): bez znacznika — przycisk „Mark row” ukryty.

| Klucz | en |
|---|---|
| `wzor.zaznacz_rzad` | Mark row |
| `wzor.kierunek_pytanie` | Which way do rows go on this page? |
| `wzor.kierunek_gora` / `wzor.kierunek_gora_opis` | Up / like a chart |
| `wzor.kierunek_dol` / `wzor.kierunek_dol_opis` | Down / like written steps |
| `wzor.kierunek_stan_gora` / `wzor.kierunek_stan_dol` | Rows go up, like a chart / Rows go down, like written steps |
| `wzor.kierunek_zmien` | Change |
| `wzor.rzad_znacznika` | Marker row |
| `wzor.etykieta` | Row {{n}} (strzałka ↑/↓ dokładana jako symbol, nie tekst) |
| `wzor.etykieta_koniec` | Row {{n}} · page end |
| `wzor.gotowe` | Done |
| `wzor.koniec_strony_gora` / `wzor.koniec_strony_dol` | Row {{n}} is past the top of page {{strona}} / Row {{n}} is past the bottom of page {{strona}} |
| `wzor.koniec_strony_opis` | Move the marker to row {{n}} on the next page. |
| `wzor.poloz_na_stronie` | Place on page {{strona}} |
| `wzor.koniec_wzoru` / `wzor.przestaw` | Row {{n}} is past the end of the pattern. / Move marker |
| `wzor.znacznik_a11y_gora` / `wzor.znacznik_a11y_dol` | Row marker, row {{n}}, rows go up / Row marker, row {{n}}, rows go down |
| `wzor.nastepna_strona_a11y` | Move to next page |

## Notatka wzoru bez znacznika (BR-WZR-008, ADR-0011 uzupełnienie 2026-10-26, P-124 Q6a)
- Notatka tekstowa na wzorze należy do rzędu (wiersz `notatka_rzedu`), a miejsce na stronie wynika ze znacznika. Bez znacznika `dodajNotatkeWzoru` zwraca `niedozwolone_przejscie` — ekran **nie pokazuje błędu**, tylko prowadzi do ustawienia znacznika.
- **Przepływ:** „Add note” (✎) w pasku nawigacji jest zawsze widoczne. Bez znacznika stuknięcie otwiera na dole pasek (ten sam komponent co pasek znacznika): „A note sits next to a row.” / „Mark the row on the pattern first, then write the note.” / [Mark row] / [Cancel]. „Mark row” zaczyna ustawianie znacznika (przy pierwszym razie w tym wzorze z pytaniem o kierunek, `wzor-kierunek`); po „Done” arkusz notatki otwiera się sam dla rzędu znacznika. „Cancel” zamyka pasek, nic się nie zmienia.
- Odrzucone: ukrycie „Add note” bez znacznika — funkcja byłaby nieodkrywalna. Zakreślanie i odręczne notatki (PencilKit, ADR-0012) działają bez znacznika — bez zmian.
- **VoiceOver:** pasek jako `status`, ogłaszany raz; fokus na „Mark row”.

| Klucz | en |
|---|---|
| `wzor.dodaj_notatke` | Add note |
| `wzor.notatka_bez_znacznika` | A note sits next to a row. |
| `wzor.notatka_zaznacz` | Mark the row on the pattern first, then write the note. |
| `wzor.zaznacz_rzad` | Mark row (istniejący klucz) |
| `wspolne.anuluj` | Cancel |

## Import przerwany przez wygaśnięcie czasu w tle (ADR-0002 (7), ADR-0020 (5))
- Import „scal”/„zastąp” i przywrócenie z kopii to jedna transakcja; gdy system odbiera czas w tle, adapter robi `ROLLBACK` i dane zostają **sprzed importu**. Ekran mówi to wprost, bez kodów i przeprosin.
- **Zapobieganie:** w trakcie importu pasek postępu z linią „Importing… Keep Oczko open until it finishes.” (`import.w_toku`).
- **Po wygaśnięciu (`import-przerwany`):** arkusz (`alertdialog`, fokus na nagłówku): „Import didn’t finish” / „Oczko was in the background too long, so nothing was changed. Your data is as it was before the import.” / „Keep Oczko open until the import finishes.” / [Try again] / [Cancel]. „Try again” zaczyna od już sprawdzonego pliku (bez ponownego wyboru; jeśli katalog tymczasowy zniknął — wybór pliku od nowa). „Cancel” wraca do ekranu importu; nic do sprzątania po stronie użytkownika.
- Ten sam arkusz przy przywróceniu kopii ratunkowej z innym nagłówkiem: „Restore didn’t finish” (`import.przywracanie_przerwane_tytul`), reszta tekstu wspólna.

| Klucz | en |
|---|---|
| `import.w_toku` | Importing… Keep Oczko open until it finishes. |
| `import.przerwany_tytul` | Import didn’t finish |
| `import.przywracanie_przerwane_tytul` | Restore didn’t finish |
| `import.przerwany_opis` | Oczko was in the background too long, so nothing was changed. Your data is as it was before the import. |
| `import.przerwany_rada` | Keep Oczko open until the import finishes. |
| `import.ponow` | Try again |
| `wspolne.anuluj` | Cancel |

## Data ukończenia (BR-PRJ-013 „Data ukończenia”, `ukonczono_dzien`, moduly.md „Ukończone w tygodniu…”)
- **Gdzie:** szczegóły ukończonego projektu, grupa dat: „Started” i „Finished” z datą (format regionu, rok zawsze — daty historii). Stuknięcie w „Finished” rozwija pod wierszem systemowy wybór daty (`UIDatePicker`, styl kalendarza, **sama data, bez godziny**), tydzień od poniedziałku (P-110).
- **Zakres:** od dnia startu projektu do dziś; dni poza zakresem są nieaktywne w kalendarzu (nie ma komunikatu po fakcie). Wybór zapisuje się od razu (jak systemowe pola daty), bez „Save”.
- **Zapis:** ekran podaje dzień lokalny `RRRR-MM-DD` (`ukonczonoDzien`) — tak liczy kalendarz i podsumowanie tygodnia. `ukonczonoMs` przy zmianie dnia: propozycja 04 — ta sama pora dnia co pierwotne ukończenie, w strefie urządzenia `[DO USTALENIA: 05]`.
- Pod grupą podpis „The calendar and the weekly summary count the project as finished on this day.” Wybrany dzień: tło przycisku + obrys + pogrubienie (nie sam kolor); dziś: pogrubienie z podkreśleniem.
- **VoiceOver:** wiersz „Finished, Nov 18, 2026, button”, rozwinięty — systemowy wybór daty (dostępny z natury).

| Klucz | en |
|---|---|
| `projekt.data_startu` | Started |
| `projekt.data_ukonczenia` | Finished |
| `projekt.data_ukonczenia_opis` | The calendar and the weekly summary count the project as finished on this day. |

## Kreski sesji przez północ (NZ-06, P-097 (4a), P-126 (6a), N2)
- **Posiedzenie** (dla kresek i podpisu): zaczyna je pierwsze +1 w projekcie po przerwie ≥ `PRZERWA_NOWEGO_DNIA_MS` (60 min) bez +1 w tym projekcie albo start stopera sesji (wtedy posiedzenie = sesja stopera); kończy je taka przerwa albo zatrzymanie stopera. **Północ go nie przerywa:** o 00:20 kreski i podpis „since 22:10” zostają — jak sesja stopera liczona do dnia startu (P-097 (4a)).
- Kalendarz, cel dzienny i limit liczą bez zmian po swojemu: rząd po północy należy do nowego dnia (BR-DNI-002, BR-DNI-005); kreski to widok posiedzenia, nie statystyka dnia, więc na ekranie licznika nie pokazujemy daty przy kreskach.
- **N2:** podpis neutralny wobec pory dnia (zamiast „wieczornych” znaczników): „Marks this session: {{count}} rows since {{godzina}}”. −1 zdejmuje ostatnią kreskę; po przerwie ≥ 60 min nowe posiedzenie zaczyna się od pustych kresek przy następnym +1 (do tego czasu widać kreski poprzedniego).
- Odczyt w danych: rzędy posiedzenia = zdarzenia +1/−1 projektu od początku posiedzenia; nic nowego nie trzeba zapisywać (liczone z `zdarzenie` i sesji stopera).

| Klucz | en |
|---|---|
| `licznik.znaczniki_sesji_one` / `licznik.znaczniki_sesji_other` | Marks this session: {{count}} row since {{godzina}} / Marks this session: {{count}} rows since {{godzina}} |

## Ustawienia › Język (BR-ZAK-004, P-075 (3b), ADR-0017, P-115, P-126 (7a); wzór Treningu)
- **Wiersz w Ustawieniach:** „Language” z wartością „Same as phone” albo nazwą wybranego języka → ekran listy (35 języków to za dużo na przełącznik, jak w Treningu).
- **Lista:** pierwsza pozycja „Same as phone” (stan po instalacji), potem 35 lokalizacji z `src/i18n/jezyki.ts`, każda nazwą we własnym języku i piśmie (np. „Deutsch”, „日本語”, „繁體中文”), znacznik ✓ przy wybranej; wybór działa od razu, bez ponownego uruchomienia, i wraca do Ustawień. Nazwy krojem systemowym (Libre Franklin nie ma greki i CJK, P-064). VoiceOver: wiersze jako `radio`, etykieta wybranej „{name}, selected”; każda nazwa czytana głosem swojego języka (`accessibilityLanguage` = tag, jak Trening A11-09).
- **Język zastępczy (P-115):** gdy języka telefonu nie ma wśród 35, „Same as phone” daje angielski; **ekran tego nie podpowiada** (7a, jak Trening). Zaznaczone zostaje „Same as phone”.
- **Wiersz „Change in iOS Settings”** pod listą (jak Trening): nazwa pod ikoną i opis zgody na aparat (`NSCameraUsageDescription`) idą za językiem aplikacji ustawionym w iOS; wiersz otwiera Ustawienia iOS (`Linking.openSettings`).
- Uszkodzony zapis ustawienia: lista pokazuje „Same as phone” jako wybrane (ADR-0017, BR-ZAK-004 S5).

| Klucz | en |
|---|---|
| `ustawienia.jezyk` | Language |
| `ustawienia.jezyk_automatyczny` | Same as phone |
| `jezyk.wybrany_a11y` | {{nazwa}}, selected |
| `jezyk.ustawienia_ios` | Change in iOS Settings |
| `jezyk.ustawienia_ios_opis` | The app name under the icon and the camera permission text follow the language set for Oczko in iOS Settings. |
Nazwy języków nie są kluczami `t()`: stała mapa tag → nazwa własna w `jezyki.ts` (09).

## Dla 08 (fix NZ-08-P2-04, partia ekranów)
- Wszystkie nowe teksty przez `t()` z kluczami z tabel wyżej (źródło en, wpis kontekstu w `en.kontekst.json`, liczba mnoga `_one`/`_other`).
- Stany do zbudowania (wzorce w `wzorce-zrzuty/ekrany-<stan>-*`): `projekty-robocze`, `projekt-nazwij`, `ukonczenie` (zmieniony), `ukonczenie-ponad-zapas`, `wzor-kierunek`, `wzor-znacznik`, `wzor-koniec-strony`, `uczciwe-zasady`, `zrodla-wiedzy`, `licznik-w-toku` (nowy podpis), `licznik-przez-polnoc`, `jezyk`.
- Zależności: flaga „nienazwany” (05 fix-3, `dane.md`); `ustawZnacznik` z wymaganym `kierunek` (ekran zawsze go podaje, bez domyślnego); rząd znacznika domyślnie licznik + 1 do potwierdzenia przez 01 (N3); `oknoUczciweZasady` z listą dozwolonych ekranów z sekcji okna; zapas `max(0, zapas − zużycie)` w domenie (partia 2).
- Kolory znacznika z `tokeny.json` `kolor.wzor`; obrysy krokowca i pól `drugiPrzyciskObrys`.

## Ekran blokady i zegarek (F-11, F-12, F-21; BR-LIC-014, BR-LIC-015, BR-PRJ-008; ADR-0007–0009; P-133)
Makiety: `aktywnosc.html`. Wymiary z Apple HIG „Live Activities”, Specifications (odczyt 2026-10-26): ekran blokady 371×84–160 pt (393 pt) i 408×84–160 (430 pt), margines 14 pt; Dynamic Island compact 52,33/62,33×36,67, minimal 36,67–45×36,67 (w wąskim kontekście 28 pt); Smart Stack zegarka 152×69,5 (40 mm) … 198×81,5 (49 mm). Ekran aplikacji zegarka 176×215 (41 mm) i 208×248 (46 mm): z pamięci, `[DO USTALENIA]` na symulatorze.
- **Jeden element sterujący na Live Activity: +1 (P-133 (1.1a)).** Ekran blokady i rozwinięta Dynamic Island mają tylko przycisk „+1 row”; −1 jest w aplikacji i na zegarku. *Dlaczego:* HIG: „prefer limiting it to a single element to help people avoid accidentally tapping the wrong control”; F-11 to „rząd (+1)”. Dotknięcie karty poza przyciskiem otwiera licznik w aplikacji (tam −1, historia, limit z odnośnikiem do Pro).
- **Ekran blokady (karta):** własne tło `papier` i tekst `grafit`/`olowek` w motywie jasnym i ciemnym (tylko tu HIG pozwala na własne tło). Góra: kropka koloru włóczki + `nazwa` ze stanu, po prawej stoper sesji (symbol stopera + czas rysowany przez system od `sesjaStartMs`; brak sesji = brak stopera, F-21). Środek: liczba rzędów skończonych (Libre Franklin 48 pt, najwyżej ×1,2), obok „Now row {{n}}” i podpis „tap when row {{n}} is done” (jak w aplikacji), z prawej „+1 row” (≥ 96 × 60 pt). Gdy opis nie mieści ≥ 130 pt × skala tekstu (320 pt, duży tekst), przycisk przechodzi pod spód na całą szerokość (większy cel, nic nie jest ucięte). Wysokość rośnie od 84 pt do 160 pt tylko o to, co jest w stanie (HIG: „reduce the height … when there’s less information”).
- **Rząd z przypomnieniem (NZ-08-P4-04, P-158):** pas zakreślacza pod liczbą, tekst `aktywnosc.przypomnienie` „Row {{n}}: {{tekst}} · {{k}} of {{razy}}” (`blokada-przypomnienie`). Parametry z `przypomnienia` w stanie (`PrzypomnienieStanu`): `{{n}}` = rząd, dla którego reguła przypomnień (RD-13, ta sama funkcja co pas w aplikacji, w Swift z pakietu reguł) zgłasza przypomnienie — chwila przypomnienia względem licznika do rozstrzygnięcia przez 01 fix-4 (P-158 N1), projekt bierze `{{n}}` z reguły bez własnego rachunku; `{{k}}` = (n − `od`) / `co` + 1; `{{razy}}`, `{{tekst}}` bez zmian (tekst ≤ `STAN_PRZYPOMNIENIE_TEKST_MAKS` = 40 znaków). Pas łamie się najwyżej na 2 wiersze, dalej wielokropek. Etykieta VoiceOver przycisku: „Add row. ” + `aktywnosc.przypomnienie_a11y` („Row {{n}}: {{tekst}}, {{k}} of {{razy}}”); ogłoszenie tylko raz przy wejściu w rząd (jak w aplikacji). To element firmowy na ekranie blokady (zakreślacz = rząd z instrukcją, jedno znaczenie). Rozwinięta Dynamic Island: ten sam pas pod liczbą, kolory `systemCzarny.zakreslacz*` (`wyspa-przypomnienie`); compact i minimal bez pasa.
  - **Kilka przypomnień w tym samym rzędzie (P-158 (1.1a)):** pas pokazuje pierwsze w kolejności stanu, a cicha linia `aktywnosc.przypomnienie_wiecej_one`/`_other` „+{{count}} more reminder in Oczko” / „+{{count}} more reminders in Oczko” zastępuje podpis „tap when row {{n}} is done” w opisie obok liczby (`olowek`; `blokada-przypomnienie-wiecej`; rozwinięta Dynamic Island: pod „Now row {{n}}”). Na zegarku linia stoi pod pasem w przewijanym środku (`zegarek-przypomnienie-wiecej`; przy dużym tekście pas i linia przewijają się koroną, przyciski zostają przypięte). VoiceOver przycisku dopisuje „{{count}} more reminder(s) in Oczko”. *Dlaczego:* karta ma tę samą wysokość co przy jednym przypomnieniu (pomiar makiety 393/430 pt, tekst domyślny: 159 pt, granica HIG 160 pt; osobna linia pod pasem dawała 183 pt); pełna lista jest w aplikacji. Smart Stack: tylko pierwsze, bez linii.
- **Kreski sesji nie są pokazywane** na ekranie blokady ani zegarku: stan (`moduly.md:67`) nie niesie liczby rzędów posiedzenia, a kreski bez danych byłyby ozdobą (zasada studia 2). W Dynamic Island znak kresek z ikony (cztery kreski z przekreśleniem) rozpoznaje aplikację obok liczby.
- **Znak kresek — zasób (NZ-08-P4-04, P-158 (2a)):** `ikona/znak-kresek.svg` = kreski z ikony (cztery ręczne kreski i przekreślenie, ta sama geometria co `ikona/pierwszy-plan.svg`), **bez zakreślacza i bez tła** (HIG „Live Activities”: „If you include a logo mark, display it without a container … Don’t use the entire app icon.”, odczyt 2026-10-26). W katalogu zasobów celu widżetu jako obraz szablonowy (Preserve Vector Data, Render As: Template Image); kolor nadaje kod (`foregroundStyle`), więc system może go przyciemnić w Always-On. Rozmiary (`tokeny.json` → `znakKresek`): Dynamic Island compact i rozwinięta 19,5 × 18 pt (kreska ≈ 2 pt — waga pogrubionej liczby 17 pt obok, HIG: waga symbolu jak sąsiedni tekst), skala z tekstem najwyżej ×1,2; Smart Stack i CarPlay 14 × 13 pt (kreska ≈ 1,5 pt, jak nazwa 13 pt), najwyżej ×1,15. Kolor `znakKresek.kolorSystemCzarny` (= `systemCzarny.grafit`; kontrast 17,7:1 do czarnego tła i 13,8:1 do karty Smart Stack, próg grafiki 3:1). Na karcie ekranu blokady znaku nie ma (tam kropka koloru włóczki). VoiceOver: `accessibilityHidden(true)` — znak niczego nie liczy, dane niesie liczba obok. Minimal: bez znaku (sama liczba, HIG: zamiast logo dane).
- **Dynamic Island:** compact = znak kresek (z lewej) + liczba (z prawej), oba otwierają licznik; minimal = sama liczba (mieści się w 28 pt; HIG: zamiast logo dane); expanded = układ karty bez podpisu „tap when …” (mniej miejsca), z „+1 row”. Tło systemowe czarne, kolory `kolor.systemCzarny`.
- **Limit wyczerpany (BR-ZAK-006, KP-13):** bez przycisku; „Counting paused” / „Your rows are kept.” i linia informacji (ikona „i” + tekst, nie kolor błędu) „**No free crafting days left in {{miesiac}}.** Counting resumes {{data}}.” (`{{data}}` = `wznowienieLimitu`). Bez odnośnika do Pro poza aplikacją (oferty tylko z limitu w aplikacji i z Ustawień, KP-13). Na zegarku to samo, bez przycisków.
- **Telefon po restarcie, przed pierwszym odblokowaniem (ADR-0008, plik niedostępny):** po stuknięciu „Row {{n}} wasn’t added” / „Unlock iPhone to count.”; liczba bez zmian; przycisk zostaje (po odblokowaniu telefonu +1 z ekranu blokady działa). Wyjątek w „Głosie” (P-133 (1.2a)).
- **Błąd zapisu linii (ADR-0008 (8A)):** „Row {{n}} wasn’t added” / „Try again.”; liczba bez zmian (stuknięcie nie jest pokazane jako zapisane).
- **Pole `uwaga` stanu Live Activity → makieta (ADR-0008 „Stan Live Activity…”, P-135 Q5a; P-142 (4a)):** `uwaga: 'odblokuj'` → `blokada-odblokuj` (`aktywnosc.nie_dodano` + `aktywnosc.odblokuj`); `uwaga: 'blad_zapisu'` → `blokada-blad-zapisu` (`aktywnosc.nie_dodano` + `aktywnosc.blad_zapisu`); `null` albo brak klucza → stan według pierwszeństwa (typowy, przypomnienie). `{{n}}` = ten sam numer co „Now row {{n}}” w stanie typowym (`wartosc + 1` przy `znaczenie: 'skonczone'`, `wartosc` przy `'w_trakcie'`; rząd, który miał zostać dodany; `wartosc` bez zmian, 8A). Komunikat zastępuje opis („Now row” i podpis), **przycisk „+1 row” zostaje**: „Try again.” i ponowienie po odblokowaniu telefonu mają sens tylko z przyciskiem, a udane stuknięcie czyści `uwaga` (ADR-0008). Zdanie ADR-0008 „zamiast przycisku komunikat” przeczy temu → do poprawy przez 05 (P-142, N2). W rozwiniętej Dynamic Island ten sam opis z przyciskiem; compact i minimal bez zmian.
- **Licznik zablokowany (F-03, BR-LIC-004; stan v3 `zablokowany`, ADR-0008 „Blokada licznika poza aplikacją”; P-142 (2a), (t1)):** stan widoczny od razu, **bez przycisku** (jak limit): liczba, w miejscu „Now row” nagłówek „Counter locked” i pod nim „Unlock it in Oczko.” (`blokada-zablokowany`); stoper sesji zostaje (blokada nie zatrzymuje sesji); karta niższa, bo niesie mniej (HIG). Rozwinięta Dynamic Island: ten sam opis, bez przycisku (`wyspa-zablokowany`); compact i minimal bez zmian (nie mają przycisku, dotknięcie otwiera licznik z paskiem „Counter locked · Unlock”). Bez ikony kłódki (w aplikacji odrzucona: czytała się jak płatna funkcja). Reguła `WynikIntencji.zablokowany` w intencji zostaje strażą wyścigu (nieświeży stan): wtedy widok jak wyżej, bez komunikatu „wasn’t added”. *Dlaczego bez przycisku:* przycisk, który nic nie robi, to fałszywa obietnica, a stan blokady jest znany z góry.
- **Pierwszeństwo stanów (ekran blokady i Dynamic Island):** `zablokowany` → limit (`dzienDozwolony: false`) → `uwaga` → przypomnienie → typowy (blokada przed limitem, jak reguła `stuknij`). Zegarek: brak stanu → `zablokowany` → limit → nieudany zapis → przypomnienie → typowy; linia „iPhone not nearby…” dochodzi do stanu typowego i przypomnienia, a nieudany zapis ją zastępuje.
- **Projekt roboczy:** w miejscu nazwy etykieta krótka `aktywnosc.nazwa_robocza` („Counter from Oct 26”), wyliczona przez aplikację w bieżącym języku i wpisana do `nazwa` stanu (sekcja „Projekt roboczy”).
- **Zegarek (zawsze ciemny, tło czarne):** nazwa (ucięta wielokropkiem) i godzina systemowa; liczba (52 pt) z „Now row {{n}}”; na dole −1 (koło 52 pt, obrys) i „+1 row” (pigułka ≥ 64 pt wysokości, tło `przyciskTlo`), 8 pt odstępu — ten sam układ co w aplikacji (−1 mniejsze, z lewej). Przy dużym tekście środek ekranu przewija się koroną, a przyciski zostają przypięte na dole; „+1 row” nie łamie się.
  - Przypomnienie (BR-LIC-015 S2): liczba 40 pt, pod nią pas zakreślacza „Row 13: decrease at both ends · 2 of 5” zamiast podpisu „Now row”; wibracja przy wejściu w rząd (wzorzec haptyki „przypomnienie” z tokenów).
  - Limit: liczba z podpisem „rows done” i linia informacji jak na ekranie blokady; bez przycisków i bez oferty.
  - Telefon poza zasięgiem (ADR-0009): liczenie działa; pod liczbą cicha linia „iPhone not nearby. 3 changes are saved on this watch.” (liczba niepotwierdzonych zdarzeń z listy zegarka); znika po potwierdzeniu `glowa` z kontekstu telefonu. Bez ostrzegawczego koloru (nic nie jest źle).
  - **Nieudany zapis stuknięcia (ADR-0009 uzupełnienie pkt 2; P-142 (1b)):** zapis do skrzynki zegarka (`fsync`) się nie udał → liczba bez zmian, zamiast podpisu „Now row” komunikat: nagłówek **„Row {{n}} wasn’t added”** (po −1: **„Row {{n}} wasn’t removed”**, `{{n}}` = rząd, który miał zostać usunięty, czyli bieżąca liczba skończonych) i pod nim „Try again or count on iPhone.” (`wzorce-zrzuty/aktywnosc-zegarek-nie-zapisano*`). Liczba 40 pt (jak przy przypomnieniu), przyciski zostają: ponowienie to jedno stuknięcie, a telefon jest drogą, która działa zawsze (przy pełnej pamięci zegarka ponowienie nie pomoże). **Haptyka:** zamiast `plus` wzorzec `haptykaZegarek.bladZapisu` = `WKHapticType.retry` (HIG „Playing haptics”: „Tells the person that an action failed but they can retry it”, odczyt 2026-10-26) — przy oczach zajętych to jedyny sygnał, że stuknięcie nie weszło; haptyka potwierdzenia nigdy przed udanym zapisem. Bez koloru błędu (jak `blokada-blad-zapisu`): znaczenie niesie tekst i haptyka. Komunikat zastępuje też linię „iPhone not nearby…”; znika po udanym stuknięciu albo po nadejściu kontekstu z telefonu. VoiceOver: ogłoszenie całego komunikatu.
  - **Licznik zablokowany (P-142 (2a), (t1)):** liczba z podpisem „rows done”, nagłówek „Counter locked” i „Unlock it in Oczko on your iPhone.” (aplikacja zegarka nie ma menu blokady), **bez +1 i −1** (`zegarek-zablokowany`). Stuknięcie w ekran: haptyka `haptykaZegarek.blokadaStukniecie` = `WKHapticType.failure` (HIG: „Tells the person that an action failed”) i ogłoszenie VoiceOver tekstu blokady — przy oczach zajętych czuć, że stuknięcie nie liczy. Smart Stack: „Counter locked” zamiast „Now row {{n}}” (`zegarek-smart-stack-zablokowany`). Zegarek z dekoderem v2 (sprzed aktualizacji) blokady nie widzi — ryzyko nazwane w ADR-0008, kontrola po stronie telefonu: 05/08 (P-142, N3).
  - Brak stanu od telefonu (pierwsze uruchomienie zegarka): „Open Oczko on your iPhone to start counting.”, bez przycisków.
- **Smart Stack (Live Activity na zegarku) i CarPlay (NZ-08-P4-04, P-158):** własny widok w rozmiarze małym: cel widżetu deklaruje `.supplementalActivityFamilies([.small])` i rozróżnia widok przez `@Environment(\.activityFamily)` (`.small` → ten widok, `.medium` → ekran blokady). Bez deklaracji system składa widok z compact (HIG: „combines the leading and trailing elements from the Live Activity’s compact presentation”) i stany niżej nie istnieją. Ten sam widok pokazuje CarPlay (HIG: „The custom watchOS layout also applies to your Live Activity in CarPlay where the system deactivates interactive elements”), więc **bez przycisków** — dotknięcie na zegarku otwiera aplikację zegarka z +1 i −1 (jedna droga liczenia na zegarku). Wymiary (HIG, odczyt 2026-10-26): 40 mm 152 × 69,5, 41 mm 165 × 72,5, 42 mm 176 × 72,5, 44 mm 173 × 76,5, 45 mm 184 × 80,5, 46 mm 194 × 80,5, 49 mm 198 × 81,5 (Ultra 3, 4) i 191 × 81,5 (Ultra 1, 2); CarPlay 240 × 78, 240 × 100, 170 × 78. Wzorce: 40 mm (najmniejszy), 46 mm, 49 mm, CarPlay 170 × 78 i 240 × 100, tekst domyślny i duży.
  - **Układ:** wiersz 1 — znak kresek 14 × 13 pt, liczba (Libre Franklin 700, 30 pt, najwyżej ×1,15), nazwa (`olowek`, 13 pt, ucinana wielokropkiem), czas sesji (od `sesjaStartMs`, rysowany przez system); wiersz 2 — linia stanu na całą szerokość (15 pt, 600). *Dlaczego:* przy 40 mm linia stanu obok liczby ucinała „Counting p…”, „Counter lo…”; stan jest najważniejszą informacją, nazwa — najmniej (jedna aktywność naraz).
  - **Stany (pierwszeństwo jak na ekranie blokady, bez `uwaga`):** zablokowany „Counter locked” (`zegarek-smart-stack-zablokowany`) → limit „Counting paused” (`aktywnosc.wstrzymane`, bez daty i oferty; `-limit`) → przypomnienie: pas zakreślacza w wierszu 2 z `aktywnosc.przypomnienie_krotkie` „Row {{n}}: {{tekst}}”, jeden wiersz, wielokropek, tylko pierwsze przypomnienie (`-przypomnienie`) → typowy „Now row {{n}}” (`zegarek-smart-stack`). Bez sesji stopera: bez czasu, nazwa dostaje jego miejsce (`-bez-sesji`). Projekt roboczy: `aktywnosc.nazwa_robocza` w miejscu nazwy (`-robocza`).
  - **Smart Stack i CarPlay: `uwaga` pomijana (P-158 (3.1a)):** komunikat „Row {{n}} wasn’t added” dotyczy stuknięcia na ekranie blokady telefonu; Smart Stack nie ma przycisku, a 40 mm ucina tekst — widok pokazuje stan według pierwszeństwa bez `uwaga`.
  - **Duży tekst (kolejność ustępowania):** najpierw znika czas sesji, potem nazwa ucina się aż do samego wielokropka, liczba rośnie najwyżej ×1,15, a linia stanu zostaje i ucina się ostatnia (przy 40 mm i ×1,35: „Counting pa…” — pełny tekst po dotknięciu w aplikacji zegarka). Wysokość karty stała (rozmiar z tabeli), nic nie wychodzi poza nią.
  - **Kolory:** karta systemowa (`systemCzarny.kartaStack` #1E2024 to przybliżenie; tło CarPlay — pomiar przy TestFlight, P-158 N2), tekst `systemCzarny.grafit`/`olowek`, pas `systemCzarny.zakreslacz*`, znak `znakKresek.kolorSystemCzarny`. VoiceOver: jeden element jak karta ekranu blokady (`aktywnosc.karta_a11y`; przy przypomnieniu z `aktywnosc.przypomnienie_a11y`; przy blokadzie `aktywnosc.zablokowany_a11y`).
- **VoiceOver:** karta jako jeden element „{{nazwa}}, {{count}} rows done, now row {{n}}[, session {{czas}}]” (przy blokadzie `aktywnosc.zablokowany_a11y`: „{{nazwa}}, {{count}} rows done, counter locked”); przycisk „Add row. Now row {{n}}” (z instrukcją przy przypomnieniu); −1 na zegarku „Remove row”. Komunikaty stanu (limit, „wasn’t added”) czytane jako część karty.
- **Kontrast:** karta ekranu blokady = pary motywu (tabela, bez zmian); czarne tło systemowe i karta Smart Stack: 8 par `system czarny` / `Smart Stack` (fix-2) i 3 pary NZ-08-P4-04 (znak kresek na czarnym tle i karcie Smart Stack, krawędź zakreślenia na karcie Smart Stack) w `kontrast-tabela.txt` (73/73). Always-On i StandBy (skala 2×): sprawdzenie na urządzeniu przy TestFlight `[DO USTALENIA]`.

| Klucz | en | Gdzie |
|---|---|---|
| `aktywnosc.plus` | +1 row | przycisk ekranu blokady, Dynamic Island, zegarka (tekst 08 przyjęty) |
| `aktywnosc.plus_a11y` | Add row. Now row {{n}} | etykieta VoiceOver przycisku |
| `aktywnosc.minus` | −1 row | etykieta −1 na zegarku (widoczne „−1”; tekst 08 przyjęty, tylko zegarek, P-133) |
| `aktywnosc.minus_a11y` | Remove row | VoiceOver −1 na zegarku |
| `aktywnosc.teraz` | Now row {{n}} | karta, Dynamic Island, zegarek |
| `aktywnosc.podpis_plus` | tap when row {{n}} is done | karta ekranu blokady (jak `licznik` w aplikacji) |
| `aktywnosc.przypomnienie` | Row {{n}}: {{tekst}} · {{k}} of {{razy}} | pas przypomnienia: ekran blokady, rozwinięta Dynamic Island, zegarek; Smart Stack w wersji skróconej (NZ-08-P4-04) |
| `aktywnosc.przypomnienie_a11y` | Row {{n}}: {{tekst}}, {{k}} of {{razy}} | VoiceOver przycisku +1 („Add row. ” + ten tekst) i ogłoszenie przy wejściu w rząd |
| `aktywnosc.plus_a11y_przypomnienie` | Add row. Row {{n}}: {{tekst}}, {{k}} of {{razy}} | pełna etykieta VoiceOver przycisku +1 przy przypomnieniu (fix NZ-08-P5-BD R2, P-191: zamiast sklejania „Add row. ” + `aktywnosc.przypomnienie_a11y`) |
| `aktywnosc.przypomnienie_wiecej_one` / `aktywnosc.przypomnienie_wiecej_other` | +{{count}} more reminder in Oczko / +{{count}} more reminders in Oczko | cicha linia pod pasem przy kilku przypomnieniach w rzędzie (P-158 (1.1a)) |
| `aktywnosc.przypomnienie_krotkie` | Row {{n}}: {{tekst}} | Smart Stack i CarPlay (1 wiersz, wielokropek) |
| `aktywnosc.zrobione_one` / `_other` | {{count}} row done / {{count}} rows done | VoiceOver karty; podpis na zegarku przy limicie („rows done”) |
| `aktywnosc.wstrzymane` | Counting paused | karta przy limicie |
| `aktywnosc.zachowane` | Your rows are kept. | karta przy limicie |
| `aktywnosc.limit` | No free crafting days left in {{miesiac}}. | zamiast tekstu 08 z „this month” (bez nazwy miesiąca i daty wznowienia, inaczej niż limit w aplikacji); `{{miesiac}}` = nazwa miesiąca w bieżącym języku |
| `aktywnosc.limit_wznowienie` | Counting resumes {{data}}. | `{{data}}` = `wznowienieLimitu`, krótki format regionu |
| `aktywnosc.nie_dodano` | Row {{n}} wasn’t added | nagłówek stanu odblokowania i błędu zapisu |
| `aktywnosc.odblokuj` | Unlock iPhone to count. | zamiast „Unlock to count” (P-133 (1.2a)) |
| `aktywnosc.blad_zapisu` | Try again. | błąd zapisu linii (8A) |
| `aktywnosc.nie_usunieto` | Row {{n}} wasn’t removed | zegarek, nagłówek przy nieudanym zapisie −1 (P-142 (1b)); po +1 nagłówek `aktywnosc.nie_dodano` (ten sam co na ekranie blokady) |
| `aktywnosc.blad_zapisu_zegarek` | Try again or count on iPhone. | zegarek, nieudany zapis do skrzynki (ADR-0009 pkt 2; P-142 (1b)) |
| `aktywnosc.bez_telefonu_one` / `aktywnosc.bez_telefonu_other` | iPhone not nearby. {{count}} change is saved on this watch. / iPhone not nearby. {{count}} changes are saved on this watch. | zegarek poza zasięgiem |
| `aktywnosc.otworz_iphone` | Open Oczko on your iPhone to start counting. | zegarek bez stanu (zamiast „Open Oczko on your iPhone”, 08) |
| `aktywnosc.zablokowany` | Counter locked | ekran blokady, rozwinięta Dynamic Island, zegarek, Smart Stack — nagłówek stanu blokady (P-142 (2a)) |
| `aktywnosc.zablokowany_jak` | Unlock it in Oczko. | ekran blokady i Dynamic Island (P-142 (t1); wyjątek w „Głosie”) |
| `aktywnosc.zablokowany_jak_zegarek` | Unlock it in Oczko on your iPhone. | zegarek (P-142 (t1)) |
| `aktywnosc.zablokowany_a11y` | {{nazwa}}, {{zrobione}}, counter locked | VoiceOver karty i Smart Stack przy blokadzie |
| `aktywnosc.nazwa_robocza` | Counter from {{data}} | projekt roboczy; `{{data}}` bez godziny (sekcja „Projekt roboczy”) |
| `aktywnosc.karta_a11y` | {{nazwa}}, {{zrobione}}, now row {{n}} | VoiceOver karty; przy sesji dopisek `aktywnosc.sesja_a11y` „session {{czas}}” |
Teksty Live Activity i zegarka idą do celów natywnych z generatora tekstów Swift (ADR-0017), te same klucze co w JS.

## Dla 08 (fix NZ-08-P3-04, partia 4: ekrany, cele natywne)
- **Teksty `aktywnosc` (zastępują propozycje z partii 3):** `aktywnosc.plus` „+1 row” i `aktywnosc.minus` „−1 row” bez zmian (−1 tylko na zegarku); `aktywnosc.limit` + `aktywnosc.limit_wznowienie` zamiast tekstu limitu z partii 3 (bez nazwy miesiąca i daty wznowienia); `aktywnosc.otworz_iphone` „Open Oczko on your iPhone to start counting.”; nowe: `aktywnosc.odblokuj`, `aktywnosc.nie_dodano`, `aktywnosc.blad_zapisu`, `aktywnosc.bez_telefonu_one`/`_other`, `aktywnosc.teraz`, `aktywnosc.podpis_plus`, `aktywnosc.wstrzymane`, `aktywnosc.zachowane`, `aktywnosc.zrobione_one`/`_other`, `aktywnosc.nazwa_robocza`, etykiety VoiceOver (tabela „Ekran blokady i zegarek”). Do Swift przez generator tekstów (ADR-0017).
- **Live Activity: usuń −1** z widoku ekranu blokady i Dynamic Island (P-133 (1.1a)); intencja −1 może zostać w kodzie dla zegarka. Wzorce: `wzorce-zrzuty/aktywnosc-blokada-*`, `aktywnosc-wyspa-*`; zegarek: `aktywnosc-zegarek-*` (41/46 mm, wymiary do sprawdzenia na symulatorze).
- **Ekrany w aplikacji (wzorce `wzorce-zrzuty/ekrany-<stan>-*`):** `wzor-notatka-bez-znacznika` (reakcja na `niedozwolone_przejscie` z `dodajNotatkeWzoru`), `import-przerwany` (wyjątek wygaśnięcia z `CzasWTle` → arkusz), `ukonczenie-data` (`zmienDateUkonczenia` z `ukonczonoDzien`).
- **Zależności od 05 fix-4:** pole stanu rozróżniające „telefon nieodblokowany” i „błąd zapisu” (N2, X-DZ-07); blokada licznika w stanie (N1: rozstrzygnięte w 05 fix-4, teksty i makiety w fix NZ-05-F4-04, P-142); zmiana języka jako wyzwalacz odświeżenia stanu (N3); pora dnia w `ukonczonoMs` przy zmianie daty.
- Kolory zegarka, Dynamic Island i Smart Stack: `tokeny.json` → `kolor.systemCzarny`; karta ekranu blokady: motyw jasny/ciemny (`papier`, `grafit`, `olowek`, `przycisk*`, `zakreslacz*`).

## Dla 08 (fix NZ-05-F4-04, partia 4: cele natywne; P-142)
- **Zegarek, nieudany zapis do skrzynki (ADR-0009 uzupełnienie pkt 2):** gdy `stuknijNaZegarku` rzuci błąd zapisu — liczba bez zmian, haptyka `haptykaZegarek.bladZapisu` (`WKHapticType.retry`) zamiast `plus`, komunikat `aktywnosc.nie_dodano` (po +1) albo `aktywnosc.nie_usunieto` (po −1) + `aktywnosc.blad_zapisu_zegarek`, przyciski zostają; komunikat znika po udanym stuknięciu albo nowym kontekście; ogłoszenie VoiceOver. Wzorce: `wzorce-zrzuty/aktywnosc-zegarek-nie-zapisano-*`, `aktywnosc-zegarek-nie-zapisano-minus-*`.
- **Blokada licznika (`zablokowany`, stan v3):** ekran blokady i rozwinięta Dynamic Island bez przycisku, `aktywnosc.zablokowany` + `aktywnosc.zablokowany_jak`; zegarek bez +1 i −1, `aktywnosc.zablokowany` + `aktywnosc.zablokowany_jak_zegarek`, stuknięcie w ekran → `haptykaZegarek.blokadaStukniecie` (`WKHapticType.failure`) + ogłoszenie; Smart Stack: `aktywnosc.zablokowany` w miejscu „Now row”; VoiceOver `aktywnosc.zablokowany_a11y`. Compact i minimal bez zmian. `WynikIntencji.zablokowany` (wyścig) → ten sam widok, bez „wasn’t added”. Wzorce: `aktywnosc-blokada-zablokowany-*`, `aktywnosc-wyspa-zablokowany-*`, `aktywnosc-zegarek-zablokowany-*`, `aktywnosc-zegarek-smart-stack-zablokowany-*`.
- **Pierwszeństwo stanów** i **`uwaga` → makieta**: sekcja „Ekran blokady i zegarek” (przycisk zostaje przy `uwaga`, P-142 (4a); widok `uwaga != null` nie ukrywa przycisku mimo zdania w ADR-0008 — korekta ADR u 05, N2).
- **Teksty:** 6 nowych kluczy w tabeli „Ekran blokady i zegarek” (`aktywnosc.nie_usunieto`, `aktywnosc.blad_zapisu_zegarek`, `aktywnosc.zablokowany`, `aktywnosc.zablokowany_jak`, `aktywnosc.zablokowany_jak_zegarek`, `aktywnosc.zablokowany_a11y`); do Swift przez generator tekstów (ADR-0017). „Unlock” w tekstach blokady licznika dozwolone (wyjątek w „Głosie”, P-142 (t1)).
- **Tokeny:** nowy obiekt `haptykaZegarek` w `tokeny.json` (obok `haptyka`, której klucze się nie zmieniły — test `WzorzecHaptyki` z kluczy `haptyka` bez zmian). Kolory: bez nowych (kontrast 70/70, tabela bez zmian).

## Dla 08 (fix NZ-08-P4-04, partia 4: cele natywne; P-158)
- **Pas przypomnienia (ekran blokady, rozwinięta Dynamic Island, zegarek):** tekst `aktywnosc.przypomnienie` z `PrzypomnienieStanu` (`{{n}}` z reguły przypomnień — ta sama funkcja co w aplikacji, w Swift z pakietu reguł; `{{k}}` = (n − `od`) / `co` + 1); etykieta +1 „Add row. ” + `aktywnosc.przypomnienie_a11y`. Kilka przypomnień w rzędzie: pas z pierwszym, a `aktywnosc.przypomnienie_wiecej_one`/`_other` w miejscu podpisu „tap when…” (zegarek: pod pasem). Chwila przypomnienia (przed rzędem czy po nim) — **01 fix-4 przed ekranami przypomnień** (P-158 N1); projekt bierze `{{n}}` z reguły. Wzorce: `aktywnosc-blokada-przypomnienie*`, `aktywnosc-wyspa-przypomnienie-*`, `aktywnosc-zegarek-przypomnienie*`.
- **Znak kresek:** `docs/design/ikona/znak-kresek.svg` do katalogu zasobów celu widżetu (i zegarka, jeśli Smart Stack rysuje cel zegarka) jako obraz szablonowy (Preserve Vector Data, Render As: Template Image); `Image("znak-kresek").resizable().scaledToFit()` w ramce z `tokeny.json` → `znakKresek.wyspa` (19,5 × 18 pt) albo `.smartStack` (14 × 13 pt), `.foregroundStyle` = `znakKresek.kolorSystemCzarny`, `.accessibilityHidden(true)`; skala z tekstem najwyżej ×1,2 / ×1,15. Zastępuje proste kreski z makiety fix-2.
- **Smart Stack i CarPlay:** `ActivityConfiguration(…).supplementalActivityFamilies([.small])`; w widoku ekranu blokady `@Environment(\.activityFamily)` — `.small` → widok Smart Stack (układ i stany w sekcji „Ekran blokady i zegarek”), `.medium` → karta ekranu blokady. Bez przycisków; `uwaga` pomijana; pierwszeństwo: zablokowany → limit → przypomnienie → typowy. Klucz `aktywnosc.przypomnienie_krotkie`. Wzorce: `aktywnosc-zegarek-smart-stack*-{40mm,46mm,49mm,carplay-170,carplay-240}[-duzy].png`. Wygląd w Always-On, kolor karty i tło CarPlay: lista TestFlight (P-158 N2).
- **Teksty:** 5 nowych kluczy w tabeli „Ekran blokady i zegarek” (`aktywnosc.przypomnienie`, `aktywnosc.przypomnienie_a11y`, `aktywnosc.przypomnienie_wiecej_one`, `aktywnosc.przypomnienie_wiecej_other`, `aktywnosc.przypomnienie_krotkie`); do Swift przez generator tekstów (ADR-0017).
- **Tokeny:** nowy obiekt `znakKresek`; kolory bez nowych wartości (3 nowe pary kontrastu, 73/73).

## Projekt, części i kosz (F-04, F-08, F-09, F-14, F-15, F-17–F-20, F-33, F-46, F-52, F-54, F-60, F-61; P-182, P-183)
Makiety: `fix5-2026-10-26/projekt-kosz.html` (22 stany), wzorce `wzorce-zrzuty/projekt-kosz-<stan>-*` (264), kontrola `narzedzia/kontrola-nz08p5q1.mjs`. Zasada: ekran pokazuje tylko to, co wynika z BR; rzadkie akcje w menu (zasada wspólna 18, P-183 3a).

**Lista projektów (BR-PRJ-012, BR-PRJ-016, BR-DNI-006; P-183 1a, 2a).**
- Grupy „In progress” (`projekty.w_toku`; bez dopisku o kolejności, bo kolejność liczy BR-DNI-006: po terminie → z terminem wg celu na dziś malejąco → bez terminu wg ostatniej pracy) i „Finished”.
- Wiersz w toku: nazwa (kropka włóczki); linia 1 „{część} · row {n}[ of {cel}]”; linia 2 tylko przy terminie: `projekty.dzis_*` albo `projekty.po_terminie_*` albo `licznik.cel_osiagniety`; linia 3 **zawsze** „last worked …”: `projekty.ostatnia_praca_dzis` (0 dni), `_wczoraj` (1), `_dni_*` (≥ 2) — dni kalendarzowe RD-16 od `ostatnia_praca_ms`, **bez progu** (P-047, P-182): ta sama etykieta przy 2 i przy 400 dniach, bez osobnej sekcji. testID `projekty-ostatnia-praca` na tej etykiecie (powtarzalny); `projekty-uspione` znika.
- **Wejście do kosza:** ostatni wiersz listy, osobna grupa pod „Finished”, `projekty.kosz` z liczbą elementów po prawej; **tylko, gdy kosz nie jest pusty** (pusty kosz = brak wiersza). VoiceOver `projekty.kosz_a11y_*`. Proponowany testID `projekty-kosz` (dla 07).
- Stuknięcie w wiersz: licznik w miejscu pracy (BR-PRJ-011, bez zmian). Usuwanie: ••• ekranu projektu → „Delete project…”. Przesunięcie wiersza w lewo — w 1.0 bez gestu (P-191 R6a, sekcja „Przegląd 04 z P-188”).

**Ekran projektu** (`app/projekt/[id]`; wejście: nazwa projektu nad tytułem części na liczniku `licznik-projekt` — stuknięcie otwiera ekran projektu; dotychczasowe menu ••• licznika bez zmian).
- Duży tytuł = nazwa (projekt roboczy: etykieta z sekcji „Projekt roboczy”); pod nim postęp `projekt.postep` + `projekt.postep_opis` (RD-14) albo `projekt.postep_bez_celow` (RD-14-W6, bez procentu).
- Linia terminu tylko przy terminie (BR-DNI-005 „Bez terminu nic”): `projekt.termin_dzis_*` / `_po_*` / `_osiagniety` / `_bez_celow` (gałęzie RD-15 w tej kolejności, P-134 Q1a).
- Grupa „Parts” (`projekt.czesci`): część z jednym licznikiem = jeden wiersz („{n} of {cel} rows”, `projekt.czesc_cel`, albo `projekt.czesc_rzedy_*`; przy celu osiągniętym dopisek `licznik.cel_osiagniety`); część z ≥ 2 licznikami rzędów = wiersz nagłówkowy z `projekt.calosc_*` (licznik całości, BR-LIC-018, suma sekcji nieusuniętych) i wcięte wiersze sekcji (32 pt); licznik oczek = wcięty wiersz z „{n} stitches” [klucz z partii licznika oczek; w makiecie nie występuje]; para: druga linia `projekt.para` nad liczbami, bez celu — `projekt.cel_z_pary`. Stuknięcie w licznik = ekran licznika.
- Grupa „Note” (`licznik.notatka`): tekst notatki do 3 wierszy (dalej wielokropek) albo `projekt.notatka_pusta`; stuknięcie = arkusz notatki.
- Grupa „Details” (`projekt.szczegoly`): narzędzie (`projekt.druty` / `projekt.szydelko` z wartością `projekt.rozmiar_us` albo `projekt.rozmiar_mm`; nieustawione: `projekt.narzedzie_wiersz` + `projekt.dodaj_wartosc`), termin (`projekt.termin`, wartość krótka data albo `projekt.termin_brak`), miejsce we wzorze (`projekt.miejsce_wzoru`, gdy jest). Pod grupą `projekt.ostatnia_zmiana` (BR-PRJ-005).
- Pasek: „+” (`projekt.dodaj_a11y`) → menu systemowe `projekt.dodaj_czesc`, `projekt.dodaj_licznik`; ••• (`projekt.menu_a11y`) → `projekt.edytuj`, `projekt.zrob_taka_sama`, `projekt.usun` (destrukcyjna, czerwona). Projekt ukończony: ••• → `projekt.wznow` (pierwsza), `projekt.zrob_taka_sama`, `projekt.usun`; bez „+”.
- **Tryb Edit** (`projekt.edytuj`, „Done” = `wspolne.gotowe`): przy każdej części i liczniku czerwony przycisk ⊖ (44 × 44 pt, etykieta `usun.a11y`) → potwierdzenie; podpis `projekt.edycja_info`. W zwykłym trybie to samo daje przesunięcie wiersza.
- „Zrób taką samą” (U-2, BR-PRJ-007): potwierdzenie `projekt.kopia_tytul` / `projekt.kopia_opis` / `projekt.kopia_potwierdz` + `wspolne.anuluj`; po nim nowy projekt otwiera się na ekranie projektu. Nazwa kopii — `[DO USTALENIA 08]` (04-fix5-N1, przekazane P-183).

**Arkusze** (słownik: Cancel lewy, Save/Add prawy; fokus na nagłówku; przy dużym tekście nagłówek łamie tytuł, treść się przewija):
| Arkusz | Treść | Zapis |
|---|---|---|
| Nowy projekt (`formularz.nowy_tytul`) | pole `formularz.nazwa_projekt` z klawiaturą od razu; `formularz.nowy_czesci` z polami części i odnośnikiem `projekt.dodaj_czesc`; `formularz.nowy_czesci_opis` | `wspolne.dodaj`; pusta nazwa = projekt roboczy (P-126 (1b)), nic nie blokuje; bez części = jedna część domyślna |
| Część (`formularz.czesc_tytul`) | `formularz.nazwa_czesc`, `formularz.cel_opcjonalny` (liczbowa), `formularz.nazwa_opis` | `wspolne.dodaj`; pusta nazwa — przycisk nieaktywny |
| Licznik (`formularz.licznik_tytul`) | `formularz.licznik_nazwa`, `formularz.licznik_czesc` (wybór systemowy, domyślnie część ostatniej pracy), `formularz.licznik_rodzaj`: przełącznik `formularz.rodzaj_rzedy` / `formularz.rodzaj_oczka`, podpis `formularz.licznik_sekcje` | `wspolne.dodaj`; pusta nazwa = nazwa rodzaju |
| Notatka (`licznik.notatka`) | pole wielowierszowe bez limitu i bez licznika znaków (BR-PRJ-002/S2), etykieta `formularz.notatka_pole`, `formularz.notatka_opis` | `wspolne.zapisz`; Cancel na zmienionym polu → „Odrzucić zmiany?” (słownik studia) |
| Znaczenie liczby (`formularz.znaczenie_tytul`; wejście `menu.znaczenie` w ••• licznika) | dwa wybory `formularz.znaczenie_skonczone` (domyślny) i `formularz.znaczenie_w_trakcie` z przykładami `_opis` na bieżącej wartości; `formularz.znaczenie_info` | `wspolne.zapisz`; zmienia tylko kolumnę `znaczenie` (F-09: bez pytania na starcie) |
| Narzędzie (`formularz.narzedzie_tytul`) | przełącznik `projekt.druty` / `projekt.szydelko` (domyślnie druty, P-182 Q2a), `formularz.narzedzie_mm` (klawiatura dziesiętna), podgląd `formularz.narzedzie_podglad` na żywo (RD-11 / RD-19, bez US gdy brak), błąd `formularz.narzedzie_blad`, `formularz.wyczysc` | `wspolne.zapisz` |
| Termin (`formularz.termin_tytul`) | systemowy wybór daty (inline, jak `ukonczenie-data`), podgląd `formularz.termin_podglad_*` albo `formularz.termin_bez_celow`, `formularz.termin_brak` | `wspolne.zapisz` |

**„Next part” (BR-LIC-011/S1, P-182 Q4a).** Na liczniku części z celem osiągniętym: `licznik.cel_osiagniety` i przycisk z obrysem `licznik.nastepna_czesc` pod liczbą (poza strefą +1). Jest następna nieusunięta część → otwiera jej pierwszy licznik bez arkusza. Brak → arkusz `czesc.co_dalej_tytul` / `czesc.co_dalej_opis`, dwa wybory: `czesc.druga_taka_sama` z `czesc.druga_opis_*` (cel = rzędy pierwszej) albo `czesc.druga_bez_celu`, oraz `czesc.nowa` z `czesc.nowa_opis` (→ arkusz części); `wspolne.nie_teraz`. Druga z pary otwiera się od razu na swoim liczniku.

**Licznik całości na ekranie licznika (BR-LIC-018/S1):** licznik sekcji pokazuje pod liczbą cichą linię `licznik.calosc_*`; aktualizuje się z każdym +1/−1 sekcji (ta sama transakcja, odczyt przez `widokProjektu`).

**Usuwanie (BR-DAN-008, P-026, słownik „Delete {object}”).** Alert systemowy: `usun.tytul`; treść `usun.projekt_opis` / `usun.czesc_opis_*` / `usun.licznik_opis` z `{{data}}` = dzień usunięcia + `KOSZ_DNI` (krótka data regionu) — termin podany przy usuwaniu (S2); przyciski `usun.projekt` / `usun.czesc` / `usun.licznik` (destrukcyjny) i `wspolne.anuluj`. Po usunięciu: ogłoszenie `usun.ogloszenie`; usunięty bieżący licznik przełącza ekran na pierwszy dostępny (C2). Bez „Cofnij” (jedna reguła: kosz, P-047 (7)).

**Ekran „Recently deleted” (F-33).** Duży tytuł `kosz.tytul`, zdanie `kosz.opis_*` (`{{count}}` = `KOSZ_DNI`), jedna grupa wierszy od najkrótszego terminu: nazwa + podpis `kosz.projekt` / `kosz.czesc` / `kosz.licznik` (gdzie wróci, „until {date}”); po prawej przycisk tekstowy `kosz.przywroc` (etykieta `kosz.przywroc_a11y`), przy dużym tekście pod podpisem. Część i licznik tylko, gdy rodzic nie jest w koszu (C1). Po przywróceniu wiersz znika, ogłoszenie `kosz.przywrocono`; pusty kosz: `kosz.pusto_*` (wejście z listy znika dopiero po wyjściu z ekranu). Bez trwałego usuwania w 1.0 (moduly.md „Projekt”).

**VoiceOver.** Wiersz listy czyta nazwę, linie w kolejności wizualnej, „last worked …” na końcu; wiersz kosza jako przycisk z liczbą; ⊖ i przesunięcie z `usun.a11y`; arkusze jako modal z fokusem na nagłówku; wybory znaczenia i narzędzia jako `radio` z `selected`; wiersz notatki `projekt.notatka_a11y`.

| Klucz | en |
|---|---|
| `projekty.ostatnia_praca_dzis` | last worked today |
| `projekty.ostatnia_praca_wczoraj` | last worked yesterday |
| `projekty.ostatnia_praca_dni_one` / `projekty.ostatnia_praca_dni_other` | last worked {{count}} day ago / last worked {{count}} days ago |
| `projekty.dzis_one` / `projekty.dzis_other` | Today: {{zrobione}} of {{count}} row / Today: {{zrobione}} of {{count}} rows |
| `projekty.po_terminie_one` / `projekty.po_terminie_other` | Past the due date · {{count}} row to go / Past the due date · {{count}} rows to go |
| `projekty.kosz` | Recently deleted |
| `projekty.kosz_a11y_one` / `projekty.kosz_a11y_other` | Recently deleted, {{count}} item / Recently deleted, {{count}} items |
| `projekt.postep_opis` | Approximate, counted from rows of parts with a goal. |
| `projekt.termin_dzis_one` / `projekt.termin_dzis_other` | Done by {{data}} · today {{zrobione}} of {{count}} row / Done by {{data}} · today {{zrobione}} of {{count}} rows |
| `projekt.termin_po_one` / `projekt.termin_po_other` | The due date {{data}} has passed · {{count}} row to go / The due date {{data}} has passed · {{count}} rows to go |
| `projekt.termin_osiagniety` | Done by {{data}} · goal reached |
| `projekt.termin_bez_celow` | Done by {{data}} · set a goal for a part to get a daily goal |
| `projekt.czesci` | Parts |
| `projekt.calosc_one` / `projekt.calosc_other` | Whole piece: {{count}} row / Whole piece: {{count}} rows |
| `projekt.para` | Pair of {{nazwa}} |
| `projekt.liczniki_one` / `projekt.liczniki_other` | {{count}} counter / {{count}} counters |
| `projekt.notatka_pusta` | Add a note |
| `projekt.notatka_a11y` | Note: {{tresc}}. Edit |
| `projekt.szczegoly` | Details |
| `projekt.narzedzie_wiersz` | Needles or hook |
| `projekt.druty` | Needles |
| `projekt.szydelko` | Hook |
| `projekt.rozmiar_us` | {{mm}} mm (US {{us}}) |
| `projekt.rozmiar_mm` | {{mm}} mm |
| `projekt.dodaj_wartosc` | Add |
| `projekt.termin` | Done by |
| `projekt.termin_brak` | None |
| `projekt.dodaj_a11y` | Add part or counter |
| `projekt.menu_a11y` | Project options |
| `projekt.dodaj_czesc` | Add part |
| `projekt.dodaj_licznik` | Add counter |
| `projekt.edytuj` | Edit parts and counters |
| `projekt.zrob_taka_sama` | Make another like this |
| `projekt.usun` | Delete project… |
| `projekt.wznow` | Resume project |
| `projekt.wznowiono` | {{nazwa}} moved to In progress. |
| `projekt.kopia_tytul` | Make another {{nazwa}}? |
| `projekt.kopia_opis` | Same parts, goals, reminders, and needles or hook with their size. All counters start at 0, and this project stays as it is. (P-195 Q4a; łatka fix-6 `zastapEn`) |
| `projekt.kopia_potwierdz` | Make another |
| `projekt.edycja_info` | Deleted parts and counters stay in Recently deleted for 30 days. |
| `wspolne.dodaj` | Add |
| `wspolne.gotowe` | Done |
| `formularz.nowy_tytul` | New project |
| `formularz.nowy_czesci` | Parts (optional) |
| `formularz.nowy_czesci_opis` | Add parts now or later. Without parts, the project has one counter. |
| `formularz.czesc_tytul` | Add part |
| `formularz.cel_opcjonalny` | Rows in this part (optional) |
| `formularz.licznik_tytul` | Add counter |
| `formularz.licznik_nazwa` | Name |
| `formularz.licznik_czesc` | In part |
| `formularz.licznik_rodzaj` | Counts |
| `formularz.rodzaj_rzedy` | Rows |
| `formularz.rodzaj_oczka` | Stitches |
| `formularz.licznik_sekcje` | Row counters in one part add up to a whole-piece total. |
| `formularz.notatka_pole` | Note for {{projekt}} |
| `formularz.notatka_opis` | Shows next to the counter. |
| `menu.znaczenie` | What the number shows |
| `formularz.znaczenie_tytul` | The big number shows |
| `formularz.znaczenie_skonczone` | Rows finished |
| `formularz.znaczenie_skonczone_opis` | {{n}} means {{n}} rows are done. |
| `formularz.znaczenie_w_trakcie` | The row I’m on |
| `formularz.znaczenie_w_trakcie_opis` | {{nastepny}} means you’re working on row {{nastepny}}. |
| `formularz.znaczenie_info` | Only the number on screen changes. Your rows and history stay the same. |
| `formularz.narzedzie_tytul` | Needles or hook |
| `formularz.narzedzie_mm` | Size in mm |
| `formularz.narzedzie_podglad` | Shows as: {{rozmiar}} |
| `formularz.narzedzie_blad` | Enter a size above 0, for example 4 or 3.25. |
| `formularz.wyczysc` | Clear |
| `formularz.termin_tytul` | Done by |
| `formularz.termin_podglad_one` / `formularz.termin_podglad_other` | Today’s goal: {{count}} row. It stays the same all day. / Today’s goal: {{count}} rows. It stays the same all day. |
| `formularz.termin_bez_celow` | Set a goal for a part to get a daily goal. |
| `formularz.termin_brak` | No date |
| `czesc.co_dalej_tytul` | What’s next? |
| `czesc.co_dalej_opis` | {{czesc}} is done. It’s the last part in {{projekt}}. |
| `czesc.druga_taka_sama` | A second {{czesc}} |
| `czesc.druga_opis_one` / `czesc.druga_opis_other` | Same goal, {{count}} row. Shows what you noted on each row of the first one. / Same goal, {{count}} rows. Shows what you noted on each row of the first one. |
| `czesc.druga_bez_celu` | The goal comes once the first one has rows. |
| `czesc.nowa` | New part |
| `czesc.nowa_opis` | Name it and start at 0. |
| `usun.tytul` | Delete “{{nazwa}}”? |
| `usun.projekt_opis` | You can restore it from Recently deleted on the Projects list until {{data}}. |
| `usun.projekt` | Delete project |
| `usun.czesc_opis_one` / `usun.czesc_opis_other` | Its {{count}} counter goes with it. You can restore it from Recently deleted on the Projects list until {{data}}. / Its {{count}} counters go with it. You can restore it from Recently deleted on the Projects list until {{data}}. |
| `usun.czesc` | Delete part |
| `usun.licznik_opis` | You can restore it with its history from Recently deleted on the Projects list until {{data}}. |
| `usun.licznik` | Delete counter |
| `usun.a11y` | Delete {{nazwa}} |
| `usun.ogloszenie` | {{nazwa}} moved to Recently deleted. |
| `kosz.tytul` | Recently deleted |
| `kosz.opis_one` / `kosz.opis_other` | Deleted projects, parts, counters, patterns, yarn and needles stay here for {{count}} day. Then they’re deleted for good. / Deleted projects, parts, counters, patterns, yarn and needles stay here for {{count}} days. Then they’re deleted for good. (fix-8: P-209, P-243) |
| `kosz.projekt` | Project · until {{data}} |
| `kosz.czesc` | Part of {{projekt}} · until {{data}} |
| `kosz.licznik` | Counter in {{projekt}}, {{czesc}} · until {{data}} |
| `kosz.wzor` | Pattern in {{projekt}} · until {{data}} (fix-8, P-243 S2a) |
| `kosz.wloczka` | Yarn · until {{data}} (fix-8, P-209) |
| `kosz.narzedzie` | Needles or hook · until {{data}} (fix-8, P-209) |
| `kosz.przywroc` | Restore |
| `kosz.przywroc_a11y` | Restore {{nazwa}} |
| `kosz.przywrocono` | {{nazwa}} is back. |
| `kosz.pusto_one` / `kosz.pusto_other` | Nothing here. Deleted projects, parts, counters, patterns, yarn and needles stay here for {{count}} day. / Nothing here. Deleted projects, parts, counters, patterns, yarn and needles stay here for {{count}} days. (fix-8) |
| `licznik.calosc_one` / `licznik.calosc_other` | {{czesc}} in total: {{count}} row / {{czesc}} in total: {{count}} rows |
Istniejące klucze użyte bez zmian: `projekt.postep`, `projekt.postep_bez_celow`, `projekt.czesc_cel`, `projekt.cel_z_pary`, `projekt.czesc_rzedy_*`, `projekt.ostatnia_zmiana`, `projekt.miejsce_wzoru`, `projekty.w_toku`, `projekty.ukonczone`, `projekty.nowy`, `licznik.notatka`, `licznik.cel_osiagniety`, `licznik.nastepna_czesc`, `formularz.nazwa_projekt`, `formularz.nazwa_czesc`, `formularz.nazwa_opis`, `wspolne.anuluj`, `wspolne.zapisz`, `wspolne.nie_teraz`. Źródło en i kontekst dla tłumaczy: `fix5-2026-10-26/klucze.json` (112 kluczy en, 98 wpisów kontekstu).

**Zmiana kontraktu testID i scenariusza 20 dla 07 (nazwany wyjątek P-183 (1a), jak P-176).** `e2e/README.md`: wiersz `projekty-uspione` → `projekty-ostatnia-praca` | lista projektów | etykieta ostatniej pracy w wierszu projektu w toku (powtarzalna) | „last worked 41 days ago”; nowy wiersz `projekty-kosz` | lista projektów | wejście do „Recently deleted” (tylko gdy niepusty) | „Recently deleted”. Scenariusz 20 (`e2e/scenariusze/20-br-prj-016-s2-powrot-po-przerwie.yaml`): `assertVisible: { id: "projekty-uspione" }` → `assertVisible: { id: "projekty-ostatnia-praca", text: "last worked 41 days ago" }`; komentarz i `name:` bez „sekcji uśpionych” („Po 41 dniach: ‘last worked 41 days ago’, jedno stuknięcie wraca do rzędu”); wyrocznia BR-PRJ-016/S1–S2 i BR-PRJ-011 bez zmian. Zmianę wykonuje 07 albo 08 za zgodą 07 (P-183); 04 nie edytuje kontraktu.

## Dla 08 (fix NZ-08-P5-Q1, partia 5: ekrany A5–A6, C2–C3; P-183)
- **Klucze:** `node docs/design/narzedzia/nakladaj-klucze-fix5.mjs` w pierwszym commicie ekranów (P-183 4a): nakłada `fix5-2026-10-26/klucze.json` na `en.json` i `en.kontekst.json` (odmawia przy kluczu istniejącym z inną treścią) i regeneruje pseudolokalizację (`npm run i18n:pseudo`). Sprawdzone przez 04 na 22643f9: łatka nałożona → `env -u NODE_PATH npm run verify` kod 0, 1808/1808; słowniki cofnięte (nie wypchnięte, bo `src/**` uruchamia CI iOS).
- **Stany do zbudowania** (wzorce `wzorce-zrzuty/projekt-kosz-<stan>-*`): `lista`, `projekt`, `projekt-dodaj`, `projekt-menu`, `projekt-edycja`, `projekt-ukonczony`, `projekt-bez-celow`, `nowy-projekt`, `dodaj-czesc`, `dodaj-licznik`, `notatka`, `znaczenie`, `narzedzie`, `termin`, `co-dalej`, `licznik-calosc`, `licznik-cel`, `usun-projekt`, `usun-czesc`, `usun-licznik`, `kosz`, `kosz-pusty`; zmienione w `ekrany.html`: `projekty`, `projekty-robocze`, `uczciwe-zasady` (tło) — „last worked …” w każdym wierszu, nagłówek „In progress”.
- **Dane do modeli odczytu:** dni od ostatniej pracy na datach kalendarzowych (RD-16), nie z różnicy chwil; `{{data}}` w potwierdzeniu = `usunieto_ms + KOSZ_DNI` jako dzień lokalny; liczba w wierszu kosza na liście = projekty + części + liczniki widoczne w koszu (C1).
- **testID** (propozycja dla tabeli 07): `projekty-ostatnia-praca`, `projekty-kosz`, `projekt-dodaj`, `projekt-menu`, `projekt-edytuj`, `projekt-usun`, `projekt-zrob-taka-sama`, `projekt-wznow`, `projekt-notatka`, `projekt-narzedzie`, `projekt-termin`, `licznik-nastepna-czesc`, `co-dalej-druga`, `co-dalej-nowa`, `potwierdz-usun`, `kosz-lista`, `kosz-przywroc`, `formularz-nazwa-czesci`, `formularz-cel-czesci`, `formularz-nazwa-licznika`, `formularz-notatka`, `formularz-rozmiar-mm`. Scenariusz 20 — sekcja wyżej (wyjątek P-183 (1a)).
- **Otwarte:** nazwa kopii „Make another” (N1 → 08), flaga `licznik.sekcja` dla „Whole piece” (N2 → 05: propozycja 04 — każdy licznik rzędów części jest sekcją, całość widać przy ≥ 2).
- Kolory i obrysy tylko z istniejących tokenów (`blad` na arkuszu: para w `kontrast-tabela.txt`); bez nowych kolorów i komponentów poza wierszem z przyciskiem tekstowym i ⊖ (systemowe wzorce list iOS).

## Stoper, sesje i Historia (F-21, F-51, F-59; BR-PRJ-008, BR-PRJ-013, BR-DNI-001–003; P-191)
Makiety: `fix6-2026-10-26/sesje-historia.html` (17 stanów), wzorce `wzorce-zrzuty/sesje-historia-<stan>-*` (204), klucze `fix6-2026-10-26/klucze.json` + `narzedzia/nakladaj-klucze-fix6.mjs`, kontrola `narzedzia/kontrola-nz08p5bd.mjs`. Plan i decyzje: `fix6-2026-10-26.md` (P-191: P1a–P6a).

**Stoper na liczniku (P1a, U-4: „start jednym stuknięciem”).**
- Bez sesji: ikona stopera w pasku nawigacji, pierwsza z prawej grupy (przed Historią i •••), etykieta `stoper.start_a11y`, testID `licznik-stoper` (`licznik-stoper`). Stuknięcie = start (`sesja.start`), haptyka lekka, ogłoszenie `stoper.uruchomiono`. Na kartce nic nowego; kreski i podpis „since …” liczą od startu stopera (sekcja „Kreski sesji przez północ”).
- Trwa: ikona zamienia się w **kapsułę** (tło `przyciskTlo`, tekst `przyciskTekst`, Libre Franklin 700 17 pt, cyfry tabelaryczne, skala tekstu najwyżej ×1,6) z symbolem stopera i czasem `m:ss` / `h:mm:ss`, rysowanym przez system od znacznika (bez `setInterval`, moduly.md „Jedno źródło czasu”) (`licznik-stoper-trwa`). Etykieta `stoper.trwa_a11y`.
- Stuknięcie w kapsułę: menu systemowe z nagłówkiem `stoper.menu_naglowek` i pozycjami `stoper.wstrzymaj` / `stoper.wznow` oraz `stoper.zatrzymaj` (`licznik-stoper-menu`). Stop bez potwierdzenia (sesja zapisana, korekta w „Sessions”), ogłoszenie `stoper.zapisano`.
- Wstrzymana: kapsuła z obrysem `drugiPrzyciskObrys` na tle papieru, symbol pauzy zamiast stopera, czas stoi (`licznik-stoper-pauza`); `stoper.wstrzymana_a11y`. Stan rozróżnia kształt i symbol, nie sam kolor.
- Przy dużym tekście pasek łamie się: przyciski przechodzą do drugiego wiersza pod „‹ Projects”, kapsuła się nie ucina.
- **Limit (P2a):** stoper działa (`licznik-stoper-limit`) — limit wstrzymuje liczenie rzędów (BR-ZAK), nie czas. **Blokada licznika:** stoper działa (`licznik-stoper-zablokowany`), jak na ekranie blokady (P-142: „stoper sesji zostaje”).
- **Sesja w innym projekcie (P3a):** start przy otwartej sesji innego projektu (`sesja_jedna_otwarta`) → alert `stoper.inny_tytul` / `stoper.inny_opis` / `stoper.inny_potwierdz` + `wspolne.anuluj` (`licznik-stoper-inny`); potwierdzenie kończy tamtą sesję i zaczyna tu w jednej transakcji.
- **Zapomniany stoper (P5a, P-072 7a):** po automatycznym zamknięciu na `SESJA_MAKS_H` licznik tego projektu pokazuje raz linię informacji (znak „i” + tekst, nie kolor błędu) `stoper.sprawdz_*` + odnośnik `stoper.sprawdz_link` → arkusz korekty (`licznik-stoper-sprawdz`). Linia znika po otwarciu korekty albo po następnym +1; znacznik zostaje w liście sesji.

**Czas projektu i sesje (P4a).** Ekran projektu: grupa `projekt.czas` między „Parts” a „Note”: `projekt.czas_wiersz` z sumą (ukonczenie.czas_*) albo — bez sesji — sam wiersz z `projekt.czas_brak` (bez „0 h”, bez wiersza „Sessions”); `projekt.sesje` z liczbą sesji i drugą linią `projekt.sesje_sprawdz_*` przy sesjach do sprawdzenia (`projekt-czas`; testID `projekt-sesje`).
- Ekran „Sessions” (`sesje`): duży tytuł `sesje.tytul`, pod nim `sesje.podsumowanie_*`; grupy według dnia startu (nagłówek: data z Intl, rok tylko inny niż bieżący), od najnowszej. Wiersz: `sesje.wiersz` albo `sesje.wiersz_nastepny_dzien`, wartość = czas trwania, druga linia jedna z: `sesje.do_sprawdzenia_*` (znak „i”, testID `sesje-do-sprawdzenia`), `sesje.trwa`, `sesje.wstrzymana`, `sesje.pauzy`, `sesje.skorygowana`. VoiceOver `sesje.wiersz_a11y` + druga linia. Sesja trwająca nie otwiera korekty.
- Arkusz korekty (`sesja-korekta`): `wspolne.anuluj` / `formularz.sesja_tytul` / `wspolne.zapisz`; wiersze `formularz.sesja_start` i `formularz.sesja_koniec` z wartością, stuknięcie rozwija systemowy wybór daty i godziny (styl koła; zakres: koniec ≥ start, nie później niż teraz); pod spodem podgląd na żywo `formularz.sesja_trwanie` + `formularz.sesja_projekt` (BR-PRJ-013 S1). Dla sesji do sprawdzenia na górze `formularz.sesja_sprawdz_*`; przy przerwach `formularz.sesja_przerwy` — korekta zeruje przerwy, arkusz mówi to przed zapisem (BR-PRJ-013, ER-54, P-195 Q2a). **Save zawsze zdejmuje `do_korekty`** (także bez zmian — to potwierdzenie) i ustawia `skorygowano`.
- Koniec przed początkiem (`sesja-korekta-blad`, BR-PRJ-013 S3): pod polami `formularz.sesja_blad` ze znakiem „!” w kolorze `blad` (tekst + znak), Save nieaktywny (token nieaktywny: grupa D, R1); nic się nie zapisuje.

**Historia (P6a, U-7: jeden widok w zakładce „History”, nic na liczniku).**
- Duży tytuł `dni.tytul`; kalendarz miesiąca: nagłówek miesiąca (Intl) ze strzałkami `dni.poprzedni_miesiac_a11y` / `dni.nastepny_miesiac_a11y` (44 × 44 pt; także przesunięcie w poziomie — gest ma przycisk, SP-15), kolumny od poniedziałku dla każdego regionu (RD-20), skróty dni z Intl; pod siatką `dni.od_poniedzialku`.
- **Dzień z robótką: kreska ołówkiem pod liczbą** (`kreska`, 14 × 3 pt, lekko pochylona) — element firmowy niesie dane (dzień z robótką wg `docs/brd/wymagania-dni.md`: rzędy wg RD-15 albo sesja stopera ≥ 1 min, ER-55), nie kolor. Wybrany dzień: koło `przyciskTlo` z liczbą `przyciskTekst` (kreska w kolorze tekstu); dziś: pogrubienie z podkreśleniem. Komórki 44 pt wysokości. VoiceOver: `dni.dzien_*` (z robótką) albo `dni.dzien_bez_a11y`; wybrany z cechą „selected”.
- Pod kalendarzem nagłówek wybranego dnia (Intl, dzień tygodnia + data; domyślnie dziś) i grupa projektów dnia: kropka włóczki, nazwa, `dni.rzedy_*`, `dni.rzedy_czas` albo — dzień z samym stoperem — sam czas (ER-55); stuknięcie = ekran projektu (BR-DNI-002); ukończenia tego dnia — `dni.ukonczone`. Dzień bez robótki: `dni.pusto_dzien` (`historia-dzien-pusty`). Dzień z samym stoperem ≥ 1 min (ER-55, P-202): kreska jak przy rzędach, wiersz projektu z samym czasem (`historia-sam-stoper`); sesja krótsza niż 1 min nie daje kreski.
- **Dwa bloki podsumowania bez przełącznika (P6a):** `dni.tydzien` (albo `dni.tydzien_biezacy`) — tydzień wybranego dnia, pon.–niedz.: `dni.suma_czas` (rzędy · `dni.czas`), `dni.ukonczono_*` (przy 0 pominięte), `dni.tydzien_poprzedni_*` (BR-DNI-003 S1–S2); blok miesiąca z kalendarza (nagłówek: nazwa miesiąca z Intl): rzędy · czas, `dni.ukonczono_*` · `dni.dni_robotki_*`. Bez sesji w okresie: same rzędy i `dni.bez_stopera` (BR-DNI-003 S3, `historia-bez-stopera`). Zmiana miesiąca strzałką przenosi wybór na 1. dzień tego miesiąca (albo dziś w bieżącym).
- Pierwsze użycie (`historia-pierwsze`): kalendarz bez kresek i `dni.pierwsze`; żadnych serii ani ponagleń (BR-DNI-001 S5).
- Dzień i tydzień liczą `podsumowanieTygodnia` (repozytorium, od poniedziałku); miesiąc — ta sama metoda w granicach miesiąca kalendarza (dzień RD-16). Rozjazd „komponent pokazuje miesiąc” znika: komponent pokazuje oba bloki.

**Teksty robocze 08 (Z07-05) zatwierdzone bez zmiany en:** `dni.dzien_*`, `dni.rzedy_*`, `dni.ukonczone`, `dni.czas`, `dni.bez_stopera` — w łatce tylko nowy kontekst (lista „zastap”).

| Klucz | en |
|---|---|
| `stoper.start_a11y` | Start session timer |
| `stoper.trwa_a11y` | Session timer, {{czas}}, running. Pause or stop |
| `stoper.wstrzymana_a11y` | Session timer, {{czas}}, paused. Resume or stop |
| `stoper.menu_naglowek` | Session started {{godzina}} |
| `stoper.wstrzymaj` / `stoper.wznow` / `stoper.zatrzymaj` | Pause timer / Resume timer / Stop timer |
| `stoper.uruchomiono` / `stoper.wstrzymano` / `stoper.wznowiono` / `stoper.zapisano` | Session timer started. / Session timer paused at {{czas}}. / Session timer running again. / Session saved: {{czas}}. |
| `stoper.inny_tytul` | The timer is running for {{projekt}} |
| `stoper.inny_opis` | One session runs at a time. Stop it there and start one for {{biezacy}}? |
| `stoper.inny_potwierdz` | Stop and start here |
| `stoper.sprawdz_one` / `_other` | The timer ran for {{count}} hour(s), so Oczko stopped it. |
| `stoper.sprawdz_link` | Check the end time |
| `projekt.czas` / `projekt.czas_wiersz` / `projekt.czas_brak` | Time / Crafting time / Time shows here when you use the stopwatch. |
| `projekt.sesje` / `projekt.sesje_sprawdz_one` / `_other` | Sessions / {{count}} session(s) to check |
| `sesje.tytul` / `sesje.podsumowanie_one` / `_other` | Sessions / {{czas}} in {{count}} session(s) |
| `sesje.wiersz` / `sesje.wiersz_nastepny_dzien` | {{start}}–{{koniec}} / {{start}}–{{koniec}} the next day |
| `sesje.trwa` / `sesje.wstrzymana` / `sesje.pauzy` / `sesje.skorygowana` | Running now / Paused now / {{czas}} paused / Edited |
| `sesje.do_sprawdzenia_one` / `_other` | Stopped after {{count}} hour(s). Check the end time. |
| `sesje.wiersz_a11y` | {{data}}, {{start}} to {{koniec}}, {{czas}}. Edit |
| `formularz.sesja_trwanie` / `formularz.sesja_projekt` | Lasts {{czas}}. / Project time after saving: {{czas}}. |
| `formularz.sesja_sprawdz_one` / `_other` | Oczko stopped this timer after {{count}} hour(s). Set when you really stopped. |
| `formularz.sesja_przerwy` | This session had {{czas}} of pauses. After you change the times, it counts from start to end. |
| `dni.tytul` / `dni.od_poniedzialku` | History / Weeks start on Monday. |
| `dni.poprzedni_miesiac_a11y` / `dni.nastepny_miesiac_a11y` | Previous month / Next month |
| `dni.tydzien` / `dni.tydzien_biezacy` | Week of {{data}} / This week |
| `dni.tydzien_poprzedni_one` / `_other` | Previous week: {{count}} row(s) |
| `dni.ukonczono_one` / `_other` | {{count}} project(s) finished |
| `dni.dni_robotki_one` / `_other` | {{count}} crafting day(s) |
| `dni.rzedy_czas` / `dni.suma_czas` | {{rzedy}} · {{czas}} |
| `dni.pusto_dzien` | Nothing counted on this day. |
| `dni.pierwsze` | Each day you count a row gets a pencil mark here. Count a row to start. |
| `dni.dzien_bez_a11y` | {{etykieta}} |
Pełne formy liczby mnogiej i kontekst dla tłumaczy: `fix6-2026-10-26/klucze.json`.

## Dla 08 (fix NZ-08-P5-BD, grupa B: sesje i Historia; P-191)
- **Klucze:** `node docs/design/narzedzia/nakladaj-klucze-fix6.mjs` w pierwszym commicie ekranów B (jak P-183 4a): nakłada `fix6-2026-10-26/klucze.json` (grupa B + pozycje przeglądu P-188: `aktywnosc.plus_a11y_przypomnienie`, `projekty.wiersz`, `projekty.wiersz_cel`, `projekt.oczka_*`, `formularz.termin_osiagniety`), zastępuje 5 wpisów kontekstu tekstów roboczych `dni.*` (en bez zmian) regeneruje pseudolokalizację, tabele `targets/*/Teksty.swift` (nowy klucz `aktywnosc.*`, ADR-0017) i wstawia wiersz `aktywnosc.plus_a11y_przypomnienie` do tabeli „Ekran blokady i zegarek” tego dokumentu (test P-143 wiąże tabelę ze słownikiem, więc wiersz wchodzi razem z kluczem). Zmiana `targets/` → push z nocnym przebiegiem iOS (P-187). Przy grupie D łatka dostanie dalsze klucze; skrypt jest idempotentny (ten sam tekst = bez konfliktu).
- **Stany do zbudowania** (wzorce `wzorce-zrzuty/sesje-historia-<stan>-*`): `licznik-stoper`, `licznik-stoper-trwa`, `licznik-stoper-menu`, `licznik-stoper-pauza`, `licznik-stoper-inny`, `licznik-stoper-limit`, `licznik-stoper-zablokowany`, `licznik-stoper-sprawdz`, `projekt-czas`, `sesje`, `sesja-korekta`, `sesja-korekta-blad`, `historia`, `historia-dzien-pusty`, `historia-sam-stoper`, `historia-bez-stopera`, `historia-pierwsze`.
- **Czas w kapsule:** wartość od `start_ms` i `przerwy_ms` (trwa) albo stała (wstrzymana), odświeżana przez komponent czasu, nie `setInterval` w stanie ekranu; ogłoszenia tylko przy zmianie stanu.
- **testID** (propozycja dla tabeli 07): `licznik-stoper`, `stoper-wstrzymaj`, `stoper-zatrzymaj`, `stoper-inny-potwierdz`, `stoper-sprawdz`, `projekt-sesje`, `sesje-lista`, `sesje-do-sprawdzenia`, `formularz-sesja-start`, `formularz-sesja-koniec`, `historia-kalendarz`, `historia-dzien`, `historia-tydzien`, `historia-miesiac`.
- **Bez nowych kolorów:** kapsuła = tokeny przycisku głównego (pary w `kontrast-tabela.txt`), kreska dnia = `kreska` na `papier` (grafika 3:1: ta sama para co kreski sesji), wybrany dzień = przycisk główny.
- **Otwarte (P-191, przegląd 05):** N1 Live Activity bez pola pauzy (czas wstrzymanej sesji na ekranie blokady). N2 i N3 rozstrzygnęła rola 01 (P-195: ER-54 korekta zeruje przerwy, ER-55 dzień z samym stoperem ≥ 1 min ma kreskę; „last worked” także z końca sesji) — makiety i teksty dostosowane.

## Narzędzia, zapas, zdjęcia i obraz karty (F-16, F-37, F-38, F-53; BR-KAL-001/003/008, BR-ZAP-001–004, BR-PRJ-003, BR-PRJ-015; P-191)
Makiety: `fix6-2026-10-26/narzedzia-zdjecia.html` (17 stanów), wzorce `wzorce-zrzuty/narzedzia-zdjecia-<stan>-*` (204); teksty en z kontekstem dla tłumaczy: `fix6-2026-10-26/klucze.json`. Teksty obliczeń i rozmiarów to kanon 06 (`oczko-warsztat` 06-tresci, `tresci/en`; warunki wyświetlania: `docs/tresci/README.md`) — 04 ustala tylko miejsce; liczby z `docs/tresci/parametry.json`.

**Zakładka „Tools” (P7a, P-046: warstwa poza pętlą licznika).** Duży tytuł `narzedzia.tytul`; grupa `narzedzia.zapas`: `narzedzia.wloczki` (liczba), `narzedzia.druty` (liczba); grupa `narzedzia.obliczenia`: `narzedzia.probka` z `narzedzia.probka_opis` (`narzedzia`). Jeden kalkulator zamiast trzech.

**Kalkulator „Swatch” (BR-KAL-001, -003, -008).** Duży tytuł `probka.tytul`; pola: `probka.oczka` (klawiatura dziesiętna, zapis liczby regionu) z przełącznikiem `probka.na_10cm` / `probka.na_4in` (domyślny wg jednostek z Ustawień, `ustawienia.uklad_miar`), `probka.szerokosc_cm` albo `probka.szerokosc_in` (jednostka z Ustawień, R-131). Wynik liczy się na żywo (bez przycisku; `narzedzia.oblicz` i `narzedzia.kalk_*` 08 przestają być używane).
- Próbka na 4 in: pod polem `probka.przeliczona` (RD-04, 3 miejsca jak BR-KAL-003 S1) + `probka.uwaga_4in` (`probka-cale`).
- Blok „liczba oczek” (`probka.wynik_oczka`): duża liczba `probka.oczka_wynik_*` (RD-01; ułamek bez zaokrąglania, BR-KAL-001 S4), dane wejściowe `probka.z_danych_cm` / `_in`, `probka.uwaga_oczka`. Bez szerokości — blok niewidoczny, kategoria i tak się liczy.
- Blok „grubość” (`probka.grubosc`): jedna kategoria — `probka.kategoria` (albo `_otwarta`); dwie — `probka.kategoria_obie` + dwa wiersze `probka.kategoria`; połówka bez części wspólnej — `probka.kategoria_miedzy`; ponad tabelą — `probka.kategoria_powyzej` + `probka.uwaga_koronka` (także przy kategorii 0). Wartość dokładna `probka.na_4in_dokladnie` przy próbce z 10 cm; `probka.uwaga_zaokraglenie` tylko gdy próbka na 4 in nie jest całością ani połówką; zawsze `probka.uwaga_kategoria`. Nazwy: `kategoria.nazwa_0`…`_7`. Bez linii źródła (to nie tabela; linia tylko w „Źródła wiedzy”, README 06).
- Błędy (ze znakiem „!”, `blad`): `probka.blad_brak` (RD-01-W5, `probka-blad`), `probka.blad_wartosc`, `probka.blad_zapis` (separator innego regionu, ER-43); przy błędzie bez wyniku.
- **Z projektu (U-10):** ekran projektu, „Details”: wiersz `projekt.probka` z wartością `projekt.probka_wartosc` / `_in` albo `projekt.dodaj_wartosc` (`projekt-zdjecia`); otwiera kalkulator z próbką projektu i linią `probka.z_projektu`; zmiany próbki zapisują się w `projekt.probka` (JSON `{oczka, na_cm}`), szerokość nie.

**Zapas (P8a, BR-ZAP-001–004).** Lista `narzedzia.wloczki` z „+” (`zapas.dodaj`), szukaniem i chipami filtra (`zapas.filtr_a11y`, rola radio): `zapas.wszystkie` + `zapas.kategoria` tylko dla kategorii obecnych w zapasie + `zapas.kategoria_brak`, gdy jest włóczka bez kategorii (`zapas`, `zapas-filtr`). Wiersz: miniatura zdjęcia etykiety (gdy jest), nazwa, `zapas.kategoria` · `zapas.motki_*`, `zapas.motek` z `zapas.dlugosc_obie` (BR-ZAP-001 S1). Pusty: `zapas.pusto` + przycisk (`zapas-pusty`); brak wyników filtra: `zapas.filtr_pusto` + `zapas.pokaz_wszystkie`. Offline bez zmian (BR-ZAP-004 S2).
- Arkusz włóczki (`wloczka`): `zapas.pole_nazwa` (wymagane), `zapas.pole_producent`, `zapas.pole_sklad`, `zapas.pole_kolor`, `zapas.pole_kategoria` (wybór „Not set” / „{n} · {nazwa}”), `zapas.pole_motki` (krokowiec 0,5), `zapas.pole_dlugosc` (m/yd) i `zapas.pole_waga` (g/oz) z `zapas.przeliczone` pod polem (RD-03), `narzedzia.pielegnacja` (tekst, BR-ZAP-001 S2), `zapas.pole_notatka`, `zapas.zdjecie_etykiety` (kafel `zdjecia.dodaj`). Zapis w jednostkach bazowych (m, g; ADR-0017), wpisana jednostka do wyświetlenia.
- Druty i szydełka (`druty-lista`, `drut`): grupy `druty.igly` / `druty.szydelka` / `druty.inne`, wiersz `projekt.rozmiar_us` albo `projekt.rozmiar_mm` + opis; pod listą `druty.uwaga_mm`; arkusz: przełącznik (`druty.igly`, `projekt.szydelko`, `druty.inne`), `formularz.narzedzie_mm`, podgląd `formularz.narzedzie_podglad` + `druty.bez_us`, gdy tabela nie ma US (RD-11, RD-19), `druty.pole_opis` z `druty.pole_opis_przyklad`; pusty: `druty.pusto`.
- Usuwanie włóczki i drutu: poza tym fixem — N4 (05).

**Zdjęcia (P9a, BR-PRJ-003).** Ekran projektu: grupa `zdjecia.naglowek` po „Note” — przewijany rząd miniatur 88 pt (VoiceOver `zdjecia.a11y`) i kafel `zdjecia.dodaj` (rośnie z tekstem) (`projekt-zdjecia`). Kafel → arkusz akcji systemowy `zdjecia.zrob` / `zdjecia.wybierz` / `wspolne.anuluj` (`zdjecie-zrodlo`); wybór z biblioteki systemowym selektorem bez uprawnienia do biblioteki. Zdjęcia etykiet robi się tu albo w formularzu włóczki — jedna grupa, bez rozróżnienia (P9a).
- Podgląd (`zdjecie-podglad`): pełny ekran na czarnym tle, `wspolne.zamknij`, pasek: `ukonczenie.udostepnij` (arkusz systemowy, plik bez EXIF/GPS jak karta), `zdjecia.a11y`, `zdjecia.usun`; przesunięcie w bok między zdjęciami (gest z alternatywą: miniatury na ekranie projektu).
- Usunięcie (`zdjecie-usun`): alert `zdjecia.usun_tytul` / `zdjecia.usun_opis`, przycisk destrukcyjny `zdjecia.usun` + `wspolne.anuluj`; bez kosza.
- Brak dostępu do aparatu (`zdjecie-brak-dostepu`): alert `zdjecia.brak_aparatu_tytul` / `_opis`, `zdjecia.otworz_ustawienia` + `wspolne.anuluj` (macierz stanów 7). Opis zgody `NSCameraUsageDescription` bez zmian.

**Obraz karty ukończenia (P10a, BR-PRJ-015, ER-24).** „Share” na karcie ukończenia (`ukonczenie.udostepnij`) tworzy obraz PNG 1080 × 1350 (4:5) z widoku, zawsze w kolorach motywu jasnego (`papier`, `grafit`, `olowek`; obraz trafia poza aplikację), i otwiera arkusz udostępniania (zapis do Zdjęć przez arkusz) — aplikacja nic nie wysyła sama (ZP-03). Układ (`karta-obraz`): zdjęcie projektu (górne 46%, przycięte do wypełnienia; zdjęcie przekodowane, **bez metadanych** — EXIF/GPS nie przechodzą, S2), `ukonczenie.okres`, nazwa (Libre Franklin 700) z kropką włóczki, trzy liczby z podpisami (`ukonczenie.jednostka`, `ukonczenie.dni_*`, czas `ukonczenie.czas_*` z `karta.czas`), włóczka i `ukonczenie.czesci_*`, stopka: znak kresek (`ikona/znak-kresek.svg`, `grafit`) + `karta.stopka`. Bez stopera: kolumny czasu nie ma (S3, `karta-obraz-bez-stopera`); bez zdjęcia: treść wyśrodkowana na papierze. Wielkości liczone od szerokości obrazu, nie od Dynamic Type (to plik, nie ekran); w podglądzie VoiceOver `karta.obraz_a11y`.

## Przegląd 04 z P-188 (P-191: R1a, R3a, R6a; R2, R4, R5, R7, R8)
- **R1 stan nieaktywny przycisku:** tokeny `przyciskNieaktywnyTlo` (= `linia`) i `przyciskNieaktywnyTekst` (= `olowek`) we wszystkich wariantach `tokeny.json`, bez obrysu, z `accessibilityState.disabled`; dla przycisku tekstowego w pasku arkusza sam kolor `olowek`. Kontrast nie jest wymagany (WCAG 1.4.3: „part of an inactive user interface component”); pary w `kontrast-tabela.txt` bez zmian. Przyjmuje rozwiązanie 08.
- **R2:** `aktywnosc.plus_a11y_przypomnienie` — pełna etykieta, bez sklejania (tabela „Ekran blokady i zegarek”; wiersz wstawia skrypt łatki razem z kluczem).
- **R3 Smart Stack:** zostaje jak w P-158 (`supplementalActivityFamilies([.small])`, własny widok) — budowa w nocnym pushu natywnym (P-187); bez niego zegarek nie pokazuje „Counter locked” ani „Counting paused”.
- **R4:** wiersz listy projektów, linia 1: `projekty.wiersz_cel` / `projekty.wiersz`.
- **R5:** licznik oczek na ekranie projektu: `projekt.oczka_*`.
- **R6 przesunięcie do usuwania:** w 1.0 **bez gestu**; usuwanie przez ••• („Delete project…”) i tryb Edit z ⊖ (SP-15 spełnione). Gest wraca z decyzją 05 o bibliotece gestów. Zdania „Przesunięcie wiersza w lewo …” w sekcji „Projekt, części i kosz” opisują stan po tej decyzji.
- **R7:** podgląd terminu przy celach osiągniętych: `formularz.termin_osiagniety`.
- **R8:** menu „+” i ••• projektu jako lista w ekranie zamiast systemowego menu — odstępstwo przyjęte do audytu 04 (zachowanie i testID bez zmian).

## Dla 08 (fix NZ-08-P5-BD, grupa D i przegląd P-188; P-191)
- **Klucze:** ta sama łatka i skrypt co grupa B (`nakladaj-klucze-fix6.mjs`, idempotentny): 157 kluczy en (B + D + R), jedna zmiana istniejącego tekstu en z listy `zastapEn` — `projekt.kopia_opis` „Same parts, goals, reminders, and needles or hook with their size. …” (P-195 Q4a: kopia przenosi narzędzie i rozmiar; skrypt podmienia tylko przy oczekiwanej starej treści), 7 wpisów kontekstu tekstów roboczych zatwierdzonych bez zmiany en (`dni.*`, `narzedzia.pielegnacja`, `narzedzia.zdjecie_etykiety`). `narzedzia.kalk_oczka`, `narzedzia.kalk_dlugosc_cm`, `narzedzia.kalk_dlugosc_in`, `narzedzia.kalk_cel`, `narzedzia.oblicz` zastępuje kalkulator „Swatch” — 08 przestaje ich używać, usunięcie kluczy razem z 09 (poza łatką). `narzedzia.film_bez_sieci` poza tym fixem (wzór, BR-WZR-007).
- **Stany** (wzorce `wzorce-zrzuty/narzedzia-zdjecia-<stan>-*`): `narzedzia`, `probka`, `probka-cale`, `probka-blad`, `zapas`, `zapas-filtr`, `zapas-pusty`, `wloczka`, `druty-lista`, `drut`, `projekt-zdjecia`, `zdjecie-zrodlo`, `zdjecie-podglad`, `zdjecie-usun`, `zdjecie-brak-dostepu`, `karta-obraz`, `karta-obraz-bez-stopera`.
- **Tokeny:** `przyciskNieaktywnyTlo`, `przyciskNieaktywnyTekst` (R1). Obraz karty: stałe wartości motywu jasnego; bez nowych kolorów.
- **testID** (propozycja dla 07): `narzedzia-wloczki`, `narzedzia-druty`, `narzedzia-probka`, `probka-oczka`, `probka-szerokosc`, `probka-wynik-oczka`, `probka-wynik-grubosc`, `zapas-filtr`, `zapas-dodaj`, `projekt-zdjecia`, `zdjecia-dodaj`, `zdjecie-usun`, `projekt-probka`, `karta-udostepnij`.
- **Otwarte:** N4 (05) usuwanie włóczki i drutu (`usunieto_ms` bez kosza w interfejsie); N5 (06/09) pisownia en: kanon 06 „millimetres”, interfejs „Color” — jedna odmiana dla źródła en.

## Ekrany wzoru a patenty (OG-07, P-024)
Reguła projektowa: w projekcie wyświetla się jeden dokument wzoru naraz (PDF, zdjęcie, strona, Word), w całości i bez zmian; aplikacja nie wycina ani nie łączy fragmentów kilku wzorów w jeden widok instrukcji. Znacznik rzędu, zakreślenia i notatki (F-26, F-28, F-56) to adnotacje na tym jednym dokumencie. Wtedy funkcje wzoru nie zawierają elementów „treść z kilku instrukcji” i „edycja i złożenie w jeden zestaw” z niezależnych zastrzeżeń 1, 9, 13 (tabela w `docs/brd/odkrywanie.md` OG-07, źródła S-10, S-32, odczyt 2026-10-21). Ocena projektu, nie opinia prawna; makieta wzoru poziomo (F-25) w E4 przechodzi tę tabelę ponownie.

**Uzupełnienie po P-218 (01 fix-6, 2026-10-26; wiąże 04, 05, 08):** (1) jeden wzór = jedno źródło, bez łączenia wzorów i składania fragmentów; (2) bez edycji treści — wolno zmienić format, wyprostować i obrócić stronę, adnotacje tylko jako osobna warstwa; (3) jeden wzór naraz z jednym znacznikiem, przełączanie wzorów projektu dozwolone, na iPadzie obok wzoru licznik, nie drugi wzór; (4) film tylko jako odnośnik poza wzorem; (5) treść zależna od postępu tylko od użytkownika i licznika; (6) każda nowa funkcja wzoru wraca do tej tabeli, 07 sprawdza ekrany przed wydaniem.

| Ekran fix-7 (P-220) | Kilka instrukcji naraz | Edycja i złożenie w zestaw | Uwaga |
|---|---|---|---|
| Dodanie wzoru (plik, skan, zdjęcia, strona) | nie — każde dodanie = nowy wzór, bez dokładania stron (Q6a) | nie — zamiana na PDF, prostowanie, obrót (2) | — |
| Grupa „Patterns”, przełączanie (W9b) | nie — jeden wzór widoczny naraz (3) | nie | lista to wybór, nie zestaw |
| Pasek licznika i kolumna licznika (W1a, W3, W4b) | nie | nie | obok wzoru licznik, nie drugi wzór (3) |
| Zakreślacz, pióro, gumka (W5a) | nie | nie — osobna warstwa (2) | — |
| Link do filmu | nie — odnośnik poza wzorem (4) | nie | — |

## Wzór, rysik i iPad (F-24–F-28, F-55, F-56; BR-WZR-001–005, 007, 008; ADR-0011, ADR-0012; P-218, P-220)
Makiety: `fix7-2026-10-26/wzor.html` (27 stanów: 20 telefonu w pionie, telefon poziomo, 6 iPada), wzorce `wzorce-zrzuty/wzor-<stan>-*` (telefon: 320/390/430 × jasny/ciemny × domyślny/AX5; poziomo i iPad: wymiar natywny `844x390`, `820x1180`, `1180x820`, `375x1180` × jasny/ciemny × domyślny/AX5; `narzedzia/zrzuty-fix7.mjs`), kontrola `narzedzia/kontrola-nzp21704.mjs`. Znacznik rzędu i notatka bez znacznika — sekcje wyżej, bez zmian. Ograniczenia patentowe P-218 (1)–(6) obowiązują każdy ekran tej sekcji (tabela w „Ekrany wzoru a patenty”).

**Gdzie jest wzór.**
- **Ekran projektu (W8):** grupa „Pattern” (`projekt.wzor`; przy ≥ 2 wzorach „Patterns”, `projekt.wzory`) nad „Details”. Wiersz wzoru: miniatura pierwszej strony, nazwa, `wzor.wiersz_opis` („PDF · 6 pages”); stuknięcie = przeglądarka tego wzoru. Wiersz „Video” (`wzor.film_wiersz`, pod nim nazwa albo adres), przycisk ↗ otwiera link w przeglądarce systemowej (P-218 (4): film poza wzorem). Na końcu zawsze „Add pattern” (`wzor.dodaj`); bez wzoru dodatkowo podpis `wzor.dodaj_opis`; wiersz „Add video link” zawsze, gdy projekt nie ma filmu (audyt 04 2.1: inaczej projekt z wzorem nie miałby wejścia do filmu poza rozszerzeniem). Menu kontekstowe wiersza „Video”: `wzor.film_zmien` (arkusz `wzor.film_tytul` wypełniony obecnym linkiem i nazwą; Save zastępuje) i `wzor.film_usun` (fix-8, P-276; jeden film na projekt, P-218 (4); makieta `fix8-2026-10-27/film.html`). `projekt.miejsce_wzoru` (tekst roboczy 08) wychodzi z „Details”.
- **Licznik (W2a):** ikona dokumentu (SF Symbol `doc.text`) w pasku nawigacji przed Historią, **tylko gdy projekt ma ≥ 1 wzór** (wzór dodał użytkownik — P-046 spełnione); otwiera ostatnio oglądany wzór projektu. W menu ••• licznika wiersz `menu.wzor`, a bez wzoru `menu.dodaj_wzor` (menu źródeł). Przy AX5 pasek łamie się w dwa wiersze (ikony pod „‹ Projects”), jak w stoperze.

**Dodanie wzoru (W7a).** „Add pattern” → menu systemowe: `wzor.z_pliku` (Pliki: PDF, `.docx`), `wzor.skanuj` (systemowy skaner dokumentów: kilka stron jednego wzoru w jednym przebiegu, prostowanie i obrót — P-218 (2); zależność 05: moduł natywny), `wzor.ze_zdjec` (kilka zdjęć z biblioteki = jeden wzór), `wzor.link_strony` (arkusz: pole `wzor.link_pole`, przycisk `wzor.wklej`, „Save page” `wzor.zapisz_strone`, podpis `wzor.link_opis`; zły adres: `wzor.link_blad` pod polem). „Add video link” → arkusz `wzor.film_tytul` z polami `wzor.film_pole`, `wzor.film_nazwa` i podpisem `wzor.film_opis`. Każde dodanie tworzy **nowy wzór**; stron do istniejącego się nie dokłada (P-218 Q6a). Nazwa domyślna: nazwa pliku bez rozszerzenia, tytuł strony, `wzor.nazwa_skan` albo `wzor.nazwa_zdjecia`.

**Stany importu (W11).**
| Stan | Wygląd |
|---|---|
| W toku (zamiana na PDF na urządzeniu) | wiersz z `wzor.import_w_toku` i paskiem postępu (`role=status`); licznik działa |
| Strona bez sieci | wiersz z `wzor.czeka_siec` i ✕ (`wzor.usun_oczekujacy_a11y`); zapis sam po powrocie sieci, bez błędu |
| Plik uszkodzony (BR-WZR-001 S2) | alert `wzor.blad_plik` + `wzor.blad_plik_opis`, przycisk `wspolne.ok`; nic nie zostaje dodane |
| Typ nieobsługiwany | alert `wzor.blad_typ` + `wzor.blad_typ_opis` |
| Za duży (`WZOR_MAKS_MB`, ADR-0011) | alert `wzor.blad_rozmiar` + `wzor.blad_rozmiar_opis` (`{{mb}}` z parametru, nie z tekstu) |
| Strona z logowaniem albo pusta (BR-WZR-007 S3) | alert `wzor.blad_strona` + `wzor.blad_strona_opis` |
| Brak dostępu do aparatu (skaner) | alert `zdjecia.brak_aparatu_tytul` + `wzor.brak_aparatu_opis`, przyciski `zdjecia.otworz_ustawienia`, `wspolne.anuluj` |
| Word w podglądzie zastępczym | linia informacji `wzor.word_podglad` nad dokumentem; bez „Mark row”, zakreślacza i rysowania |
| Film bez sieci (BR-WZR-007 S4) | alert `wzor.film_bez_sieci_tytul` + `narzedzia.film_bez_sieci` |

**Przeglądarka wzoru, telefon w pionie (W1a).** Pasek nawigacji: ‹ (`wzor.wstecz_a11y`), tytuł = nazwa wzoru (przy ≥ 2 wzorach z ▾ i menu `wzor.przelacz_naglowek` z listą wzorów projektu i ✓ przy bieżącym — `wzor.przelacz_a11y`; W9b), „Mark row” (▭), zakreślacz, ••• (`wzor.menu_a11y`: `wzor.dodaj_notatke`, `wzor.obroc`, `wzor.zmien_nazwe`, `wzor.usun` czerwone). Strona na tle `grupa`, strony jedna pod drugą, plakietka `wzor.strona_z` na dole widoku. **Pasek licznika** na dole: liczba (Libre Franklin 40 pt), „Now working row n” (`licznik.teraz`), −1 (56 × 56 pt), +1 (≥ 72 pt wysokości, ≥ 132 pt szerokości; przy 320 pt i AX5 przechodzi pod liczbę na całą szerokość). +1 przesuwa znacznik (ruch tylko bez „Ogranicz ruch”). Ekran nie gaśnie, jak licznik. Kolejność VoiceOver: tytuł → narzędzia → strona → liczba → −1 → +1; Magic Tap = +1.
- **Usunięcie wzoru:** alert `wzor.usun_tytul` / `wzor.usun_opis` / `wzor.usun_potwierdz` (destrukcyjny) / `wspolne.anuluj`; wzór idzie do „Recently deleted” na 30 dni z zakreśleniami i rysunkami (P-229, P-243 S2a; wiersz `kosz.wzor`, makieta `fix8-2026-10-27/fix8.html` `usun-wzor`, `kosz-z-wzorem`). Notatki rzędów należą do licznika i zostają.
- **Obrót strony:** obraca widok strony o 90° i zapamiętuje to dla strony; znacznik i rysunki liczą się w układzie strony przed obrotem (ADR-0011), więc zostają na miejscu.

**Telefon poziomo (W3).** Bez ustawienia: po lewej wzór (pasek nawigacji jak w pionie), po stronie końcowej kolumna licznika (34 % szerokości, 220–360 pt): liczba 64 pt, „Now working row n”, +1 na całą resztę wysokości, −1 pod nim (56 pt). RTL: kolumna po lewej.

**Rysowanie (W5a, W6a; BR-WZR-004, BR-WZR-008; ADR-0012).**
- **iPhone i iPad bez rysika:** zakreślacz (`wzor.zakreslacz`, testID `wzor-zakreslacz`, wartość VoiceOver `wzor.zakreslenia_*`) włącza tryb rysowania; pasek nawigacji zamienia się w pasek narzędzi: Highlighter (wybrany), `wzor.gumka`, ↶ (`wzor.cofnij_rysunek`), `wspolne.gotowe`. W trybie jeden palec zakreśla, dwa przewijają (podpowiedź `wzor.zakreslacz_podpowiedz` raz). Poza trybem palec tylko przewija (BR-WZR-008 S3).
- **iPad (szerokość regular):** pasek narzędzi stały pod paskiem nawigacji: Highlighter, Pen (`wzor.pioro`), Eraser, ↶. Po pierwszym dotknięciu rysikiem polityka `pencilOnly`: rysik rysuje wybranym narzędziem od razu, palec zawsze przewija (P-218 Q2a); podpowiedź `wzor.rysik_podpowiedz` raz. Przed tym iPad działa jak iPhone.
- **Kolory:** zakreślacz = `kolor.zakreslacz` (`#F6E04A`) z mnożeniem na białej stronie, w obu motywach (strona to dokument); pióro = `kolor.wzor.znacznik` (`#26282C`), stała grubość. Bez wyboru kolorów i bez systemowej palety narzędzi (P-220 W5a, zasada 18). Rysunki to osobna warstwa, plik wzoru bez zmian (P-218 (2)).

**iPad (W4b, G1; NFR-UKL-001 z P-218 Q3a).**
- **Wzór:** w pionie wzór na pełną szerokość (strona maks. 640 pt na środku) i pasek licznika na dole (marginesy 32 pt, +1 maks. 360 pt); w poziomie zawsze obok siebie: wzór + kolumna licznika 340 pt (liczba, „Now working row n”, cel, +1, −1). Obok wzoru stoi licznik, nigdy drugi wzór (P-218 (3)).
- **Pozostałe ekrany bez osobnych makiet:** szerokość regular → treść w kolumnie maks. 640 pt na środku (listy grupowane, formularze, licznik; makiety kontrolne `ipad-licznik`, `ipad-projekty`), strefa +1 na szerokość kolumny i ≥ 168 pt; arkusze jako arkusze formularza (form sheet); marginesy systemowe (readable content guide).
- **Wąskie okno** (Split View, Slide Over, Stage Manager; szerokość compact): układ telefonu w pionie (`ipad-waskie`). Przejście między układami przy zmianie szerokości bez utraty stanu (strona, znacznik, tryb rysowania). Zero obciętych i nakładających się elementów na PR-01–PR-06 w obu orientacjach (NFR-UKL-001; sprawdza 07).

| Klucz | en |
|---|---|
| `licznik.wzor_a11y` | Pattern |
| `menu.wzor` | Pattern |
| `menu.dodaj_wzor` | Add pattern… |
| `projekt.wzor` | Pattern |
| `projekt.wzory` | Patterns |
| `wzor.tytul` | Pattern |
| `wzor.dodaj` | Add pattern |
| `wzor.dodaj_opis` | PDF, Word, a photo of a page or a web page |
| `wzor.z_pliku` | Choose file (PDF or Word) |
| `wzor.skanuj` | Scan pages |
| `wzor.ze_zdjec` | Choose photos |
| `wzor.link_strony` | Web page link… |
| `wzor.link_tytul` | Web page |
| `wzor.link_pole` | Link to the pattern page |
| `wzor.wklej` | Paste |
| `wzor.zapisz_strone` | Save page |
| `wzor.link_opis` | Oczko saves the page as it looks now, so it opens without the internet. |
| `wzor.link_blad` | That doesn’t look like a web link. Check it and try again. |
| `wzor.dodaj_film` | Add video link |
| `wzor.film_tytul` | Video link |
| `wzor.film_pole` | Link |
| `wzor.film_nazwa` | Name (optional) |
| `wzor.film_opis` | Oczko keeps only the link. The video opens in your browser and needs the internet. |
| `wzor.film_wiersz` | Video |
| `wzor.film_otworz_a11y` | Open video link in browser |
| `wzor.film_usun` | Remove link |
| `wzor.film_zmien` | Change link (fix-8, P-276) |
| `wzor.film_bez_sieci_tytul` | No internet connection |
| `wzor.rodzaj_pdf` | PDF |
| `wzor.rodzaj_zdjecie` | Photo |
| `wzor.rodzaj_strona` | Web page |
| `wzor.rodzaj_word` | Word document |
| `wzor.strony_one` / `wzor.strony_other` | {{count}} page / {{count}} pages |
| `wzor.wiersz_opis` | {{rodzaj}} · {{strony}} |
| `wzor.nazwa_skan` | Scan {{data}} |
| `wzor.nazwa_zdjecia` | Photos {{data}} |
| `wzor.strona_z` | Page {{n}} of {{razem}} |
| `wzor.strona_a11y` | Pattern page {{n}} of {{razem}} |
| `wzor.wstecz_a11y` | Back to {{czesc}} |
| `wzor.przelacz_a11y` | Pattern: {{nazwa}}. Switch pattern |
| `wzor.przelacz_naglowek` | Patterns in {{projekt}} |
| `wzor.menu_a11y` | Pattern options |
| `wzor.obroc` | Rotate page |
| `wzor.zmien_nazwe` | Rename |
| `wzor.nazwa_tytul` | Pattern name |
| `wzor.usun` | Delete pattern… |
| `wzor.usun_tytul` | Delete “{{nazwa}}”? |
| `wzor.usun_opis` | You can restore it with its highlights and drawings from Recently deleted on the Projects list until {{data}}. Row notes and counters stay. (fix-8, P-243 S2a) |
| `wzor.usun_potwierdz` | Delete pattern |
| `wzor.zakreslacz` | Highlighter |
| `wzor.zakreslenia_one` / `wzor.zakreslenia_other` | {{count}} highlight / {{count}} highlights |
| `wzor.gumka` | Eraser |
| `wzor.pioro` | Pen |
| `wzor.cofnij_rysunek` | Undo last stroke |
| `wzor.zakreslacz_podpowiedz` | Drag a finger to highlight. Two fingers scroll. |
| `wzor.rysik_podpowiedz` | The pencil writes. Your finger scrolls. |
| `wzor.import_w_toku` | Adding the pattern… |
| `wzor.czeka_siec` | Waiting for the internet to save the web page. |
| `wzor.usun_oczekujacy_a11y` | Remove {{nazwa}} from the list |
| `wzor.blad_plik` | Oczko can’t open this file |
| `wzor.blad_plik_opis` | “{{plik}}” may be damaged. Nothing was added. Download or save it again, then add it. |
| `wzor.blad_typ` | Oczko can’t add this type of file |
| `wzor.blad_typ_opis` | Patterns can be PDFs, Word documents, photos or web pages. Nothing was added. |
| `wzor.blad_rozmiar` | This file is too large |
| `wzor.blad_rozmiar_opis` | A pattern can be up to {{mb}} MB. Nothing was added. |
| `wzor.blad_strona` | Oczko can’t save this page |
| `wzor.blad_strona_opis` | The page asks you to sign in, or it has no text or pictures. Nothing was added. Open it in your browser, save it as a PDF and add the PDF. |
| `wzor.brak_aparatu_opis` | To scan pattern pages, allow camera access in Settings. You can still choose photos or a file. |
| `wzor.word_podglad` | Word documents open as they are. To mark rows and highlight, save it as a PDF and add the PDF. |
| `wspolne.ok` | OK |

Istniejące klucze użyte bez zmian: `licznik.teraz`, `licznik.plus`, `licznik.plus_a11y`, `licznik.minus`, `licznik.minus_a11y`, `wspolne.gotowe`, `wspolne.anuluj`, `zdjecia.brak_aparatu_tytul`, `zdjecia.otworz_ustawienia`, `narzedzia.film_bez_sieci`. Źródło en i kontekst dla tłumaczy: `fix7-2026-10-26/klucze.json`.

## Dla 08 (fix NZ-P217-04, grupa W: wzór, rysik, iPad; P-220)
- **Klucze:** łatka `fix7-2026-10-26/klucze.json` + `node docs/design/narzedzia/nakladaj-klucze-fix7.mjs` (idempotentna, kod 1 przy konflikcie; regeneruje pseudolokalizację). Grupa W: 96 kluczy en (w tym 25 kluczy znacznika i notatki z sekcji wyżej, które nie trafiły do słownika — N1), 94 wpisy kontekstu; `targets/` bez zmian. Sprawdzone: nałożona → `env -u NODE_PATH npm run verify` kod 0 → cofnięta.
- **Stany** (wzorce `wzorce-zrzuty/wzor-<stan>-*`): `licznik-z-wzorem`, `projekt-wzor-pusty`, `projekt-wzory`, `wzor-dodaj`, `wzor-link`, `wzor-film`, `wzor-import-w-toku`, `wzor-czeka-siec`, `wzor-blad-plik`, `wzor-blad-typ`, `wzor-blad-rozmiar`, `wzor-blad-strona`, `wzor-brak-dostepu`, `wzor-pionowo`, `wzor-przelacz`, `wzor-menu`, `wzor-usun`, `wzor-zakreslacz`, `wzor-word`, `wzor-film-bez-sieci`, `wzor-poziomo`, `ipad-wzor-pion`, `ipad-wzor-poziom`, `ipad-rysik`, `ipad-waskie`, `ipad-licznik`, `ipad-projekty`.
- **Tokeny:** bez nowych kolorów (zakreślacz `kolor.zakreslacz`, pióro i znacznik `kolor.wzor.*`, strona `kolor.wzor.strona`); kontrast bez nowych par. Wymiary: pasek licznika −1 56 pt, +1 ≥ 72 × 132 pt; kolumna poziomo 34 % (220–360 pt), iPad 340 pt; kolumna treści iPada maks. 640 pt.
- **testID:** istniejące `wzor-dodaj`, `wzor-widok`, `wzor-zrodlo`, `wzor-strona`, `wzor-zakreslacz`, `wzor-zakreslenia` bez zmian; w pasku licznika pod wzorem te same id co na liczniku (jeden komponent). Nowe id grupy W (wiersze w `e2e/README.md` dopisała 07, 12aa394): `licznik-wzor`, `wzor-dodaj-film`, `wzor-przelacz`, `wzor-menu`, `wzor-obroc`, `wzor-usun`, `wzor-gumka`, `wzor-pioro`, `wzor-cofnij-rysunek`, `wzor-link-pole`, `wzor-film-wiersz`, `wzor-czeka-siec`.
- **Zależności 05:** skaner dokumentów (moduł natywny), wiele wierszy wzoru na projekt i usunięcie do kosza (N4 → P-229, P-243 S2a), obrót strony jako dana wzoru (strona → kąt), „ostatnio oglądany wzór” projektu.
- **Kolejność VoiceOver i Magic Tap** jak na liczniku; pasek licznika pod wzorem to ten sam komponent co strefa +1 w mniejszym rozmiarze.

## „Udostępnij do Oczka” i iCloud (F-24, F-55, F-27, F-58; BR-WZR-001, BR-WZR-007, BR-DAN-002, BR-DAN-011; ADR-0005, ADR-0011; P-220)
Makiety: `fix7-2026-10-26/udostepnij-icloud.html` (19 stanów), wzorce `wzorce-zrzuty/udostepnij-icloud-<stan>-*` (228; 320/390/430 × jasny/ciemny × domyślny/AX5).

**Arkusz rozszerzenia (R1a).** Arkusz systemowy z nagłówkiem `wspolne.anuluj` / `udostepnij.tytul` / `wspolne.zapisz`; podgląd pliku (miniatura, nazwa, `wzor.wiersz_opis`); lista „Add as a pattern to” (`udostepnij.do_projektu`) z migawki projektów w toku (kolejność jak lista projektów, druga linia `udostepnij.wiersz`: ostatnia praca i `udostepnij.wzory_*`), domyślnie zaznaczony projekt ostatnio otwarty; ostatni wiersz `udostepnij.nowy_projekt`. Pod listą `udostepnij.gotowe` / `udostepnij.gotowe_nowy`, a przy projekcie z wzorem `udostepnij.kolejny` (nowy wzór obok istniejącego, W9b). Link ze strony: przełącznik segmentowy `udostepnij.jako` — `udostepnij.jako_wzor` (zapis strony jako PDF) albo `udostepnij.jako_film` (sam link, P-218 (4)). Przy `udostepnij.jako_film` nagłówek listy `udostepnij.do_projektu_film`, a gdy zaznaczony projekt ma już film — linia `udostepnij.film_zastapi` zamiast `udostepnij.gotowe` (fix-8, P-276; to samo w arkuszu skrzynki; flaga `film` w migawce — 05). „Save” zapisuje do skrzynki App Group i zamyka arkusz; rozszerzenie niczego nie zamienia (ADR-0011).
- **Bez migawki** (aplikacja jeszcze nie otwarta albo migawka niedostępna): bez listy, podpis `udostepnij.bez_migawki`; plik czeka w skrzynce (R1b jako stan zastępczy).
- **Za duży** (`WZOR_MAKS_MB`) i **nieobsługiwany**: zamiast listy linia ostrzeżenia (`wzor.blad_rozmiar` + `udostepnij.za_duzy`, `wzor.blad_typ` + `udostepnij.nieobslugiwany`), w nagłówku tylko `wspolne.zamknij`; nic nie trafia do skrzynki.
- **VoiceOver:** lista jako `radiogroup`, wiersze `radio` z `checked`; fokus po otwarciu na nagłówku.

**Skrzynka importu (R2).** Przy otwarciu aplikacji pozycje z wybranym projektem dodają się same (wiersz w grupie wzorów: `wzor.import_w_toku`, strona bez sieci `wzor.czeka_siec`). Pozycje bez projektu: arkusz nad listą projektów `skrzynka.tytul_*` z podglądem pliku i listą `skrzynka.dodaj_do` (projekty w toku + `udostepnij.nowy_projekt`); `wspolne.nie_teraz` zostawia pozycje w skrzynce do następnego otwarcia. Nie pokazuje się nad licznikiem (licznik zostaje wolny, P-046) — dopiero na liście projektów albo ekranie projektu. Błąd pozycji: alert `skrzynka.nie_dodano` z przyczyną (`skrzynka.uszkodzony`, `wzor.blad_typ_opis`, `wzor.blad_strona_opis`), `wspolne.ok`; pozycja znika ze skrzynki.

**iCloud (I1a–I3).** Ustawienia › „Data and sync” (`ustawienia.stan_danych`, istniejący ekran `stan_danych.*`).
- **Przełącznik** `icloud.przelacznik`, **domyślnie wyłączony** (BR-DAN-002 S3, P-021), podpis `icloud.opis`. Przy ZM-06 (test „rekord z telefonu na iPadzie” niezaliczony) cały wiersz i podpis ukryte. Włączenie: alert `icloud.wlacz_tytul` / `icloud.wlacz_opis` / `icloud.wlacz_potwierdz` / `wspolne.anuluj`. Wyłączenie: `icloud.wylacz_*` (dane lokalne zostają, ADR-0005).
- **Stan** (grupa pod przełącznikiem, `role=status`): włączona — `stan_danych.aktywna` + `stan_danych.ostatnia` albo `icloud.synchronizuje`; bez sieci — `stan_danych.czeka` + `stan_danych.ostatnia` (BR-DAN-011 S1); zawsze `stan_danych.zapisane` i `stan_danych.zegarek_kontakt`; wyłączona — `stan_danych.zapisane`. Liczniki w konflikcie: wiersz `icloud.konflikty_*` → lista.
- **Problemy** (linia informacji z ikoną „!”, nigdy sam kolor): brak konta albo iCloud wyłączony dla Oczka — `icloud.brak_konta` + `icloud.brak_konta_opis`, przycisk `icloud.ustawienia`; brak miejsca — `icloud.brak_miejsca` + `icloud.brak_miejsca_opis`, przycisk `icloud.zarzadzaj`; poczekalnia ponad 7 dni — `icloud.niepelna` + `icloud.niepelna_nowsza` albo `icloud.niepelna_opis` (ikona „i”, to nie błąd). Inne konto: alert `icloud.konto_zmienione_tytul` / `icloud.konto_zmienione_opis` / `icloud.polacz` / `icloud.nie_synchronizuj`.
- **Konflikt na liczniku (I1a; nazwany wyjątek od P-046, P-220):** pod liczbą linia `icloud.konflikt_licznik` + `icloud.konflikt_opis` + przycisk `icloud.konflikt_wybierz` → arkusz `dane.konflikt_tytul`, zdanie `icloud.konflikt_wybor_opis`, dwa wybory `dane.konflikt_wybor` (`dane.konflikt_a11y`), `wspolne.nie_teraz`. Liczba pokazuje wersję tego urządzenia; zachowanie +1 w konflikcie: N5 → 05. Linia znika po wyborze; ogłoszenie VoiceOver raz przy pojawieniu się.
- **„Replace what’s here” i przywrócenie kopii przy włączonej synchronizacji:** alert `icloud.zastap_wylacz` / `icloud.zastap_wylacz_opis` / `icloud.do_ustawien` / `wspolne.anuluj`.
- **„Delete all data”** (`ustawienia.usun_wszystko`): arkusz z `ustawienia.usun_pytanie`, przełącznikiem `icloud.usun_z_icloud` (domyślnie wyłączony, podpis `icloud.usun_z_icloud_opis`) i zdaniem `icloud.usun_zostaje`, gdy wyłączony; przycisk `ustawienia.usun_potwierdz` rodzaju `niszczacy` (komponenty; tło `blad`, tekst `papier`: 6,36:1 jasny, 9,98:1 ciemny). Przełącznik widoczny tylko przy synchronizacji włączonej.

| Klucz | en |
|---|---|
| `udostepnij.tytul` | Add to Oczko |
| `udostepnij.do_projektu` | Add as a pattern to |
| `udostepnij.do_projektu_film` | Add the video link to (fix-8, P-276) |
| `udostepnij.film_zastapi` | {{projekt}} already has a video link. Saving replaces it with this one. (fix-8, P-276) |
| `udostepnij.nowy_projekt` | New project |
| `udostepnij.wzory_one` / `udostepnij.wzory_other` | {{count}} pattern / {{count}} patterns |
| `udostepnij.wiersz` | {{ostatnia}} · {{wzory}} |
| `udostepnij.jako` | Add as |
| `udostepnij.jako_wzor` | Pattern |
| `udostepnij.jako_film` | Video link |
| `udostepnij.gotowe` | It’ll be in {{projekt}} next time you open Oczko. |
| `udostepnij.gotowe_nowy` | It’ll be in a new project next time you open Oczko. |
| `udostepnij.kolejny` | {{projekt}} already has a pattern. This one is added next to it, and you can switch between them. |
| `udostepnij.bez_migawki` | Oczko will ask which project it’s for when you open it. |
| `udostepnij.za_duzy` | A pattern can be up to {{mb}} MB, so Oczko can’t add this file. |
| `udostepnij.nieobslugiwany` | Patterns can be PDFs, Word documents, photos or web pages. |
| `skrzynka.tytul_one` / `skrzynka.tytul_other` | {{count}} pattern to add / {{count}} patterns to add |
| `skrzynka.dodaj_do` | Add to |
| `skrzynka.nie_dodano` | “{{plik}}” wasn’t added |
| `skrzynka.uszkodzony` | It may be damaged. Download or save it again, then add it. |
| `icloud.przelacznik` | Sync with iCloud |
| `icloud.opis` | Keeps projects, patterns and history the same on your devices. Your data goes only to your own iCloud; Oczko has no server. |
| `icloud.wlacz_tytul` | Turn on iCloud sync? |
| `icloud.wlacz_opis` | Projects on this iPhone and those already in your iCloud are combined. Nothing is deleted. If a counter has different values, Oczko shows both and you choose. |
| `icloud.wlacz_potwierdz` | Turn on |
| `icloud.wylacz_tytul` | Turn off iCloud sync? |
| `icloud.wylacz_opis` | Everything stays on this iPhone. Changes here stop going to iCloud, and your other devices keep what they have. |
| `icloud.wylacz_potwierdz` | Turn off |
| `icloud.synchronizuje` | Syncing… |
| `icloud.brak_konta` | iCloud isn’t available to Oczko |
| `icloud.brak_konta_opis` | Check that you’re signed in to iCloud and that iCloud is on for Oczko in Settings. Everything stays saved on this iPhone. |
| `icloud.ustawienia` | Open Settings |
| `icloud.brak_miejsca` | Your iCloud storage is full |
| `icloud.brak_miejsca_opis` | Changes aren’t syncing. They’re saved on this iPhone and will sync when there’s space. |
| `icloud.zarzadzaj` | Manage storage |
| `icloud.konto_zmienione_tytul` | A different iCloud account |
| `icloud.konto_zmienione_opis` | This iPhone is now signed in to another iCloud account. Sync is paused and your data here is unchanged. Sync with this account? Your projects here and in that account are combined. |
| `icloud.polacz` | Sync with this account |
| `icloud.nie_synchronizuj` | Don’t sync |
| `icloud.konflikt_licznik` | Two versions of this counter |
| `icloud.konflikt_opis` | {{lokalna}} rows here, {{zdalna}} from {{urzadzenie}}. Choose the one that matches your work. |
| `icloud.konflikt_wybierz` | Choose |
| `icloud.konflikt_wybor_opis` | Pick the one that matches your work. The other stays in the history. |
| `icloud.konflikty_one` / `icloud.konflikty_other` | {{count}} counter has two versions / {{count}} counters have two versions |
| `icloud.niepelna` | Some changes from your other devices aren’t shown yet |
| `icloud.niepelna_nowsza` | They come from a newer version of Oczko. Update Oczko on this iPhone to see them. Your counters here are unchanged. |
| `icloud.niepelna_opis` | Oczko keeps trying. Your counters here are unchanged. |
| `icloud.zastap_wylacz` | Turn off iCloud sync first |
| `icloud.zastap_wylacz_opis` | To replace what’s here, iCloud sync needs to be off. Otherwise iCloud would bring the old data back. You can turn it on again afterwards. |
| `icloud.do_ustawien` | Go to Data and sync |
| `icloud.usun_z_icloud` | Also delete from iCloud |
| `icloud.usun_z_icloud_opis` | Your other devices lose these projects the next time they sync. |
| `icloud.usun_zostaje` | Data in iCloud and on your other devices stays. |

Istniejące klucze użyte bez zmian: `stan_danych.*` (7), `dane.konflikt_tytul`, `dane.konflikt_wybor`, `dane.konflikt_a11y`, `ustawienia.stan_danych`, `ustawienia.usun_wszystko`, `ustawienia.usun_pytanie`, `ustawienia.usun_potwierdz`, `wspolne.zamknij`, `wspolne.nie_teraz`, `wspolne.zapisz`, `wspolne.anuluj`, `projekty.ostatnia_praca_*`.

## Dla 08 (fix NZ-P217-04, grupa R i I: rozszerzenie, skrzynka, iCloud; P-220)
- **Klucze:** ta sama łatka i skrypt co grupa W (`nakladaj-klucze-fix7.mjs`): razem 150 kluczy en, 145 wpisów kontekstu; sprawdzona nałożona (verify kod 0) i cofnięta. Teksty rozszerzenia czyta cel rozszerzenia z tego samego słownika (ADR-0017; generator tekstów celów natywnych — decyzja 05/08, jak `Teksty.swift` dla `aktywnosc.*`).
- **Stany** (wzorce `wzorce-zrzuty/udostepnij-icloud-<stan>-*`): `udostepnij`, `udostepnij-ma-wzor`, `udostepnij-bez-migawki`, `udostepnij-za-duzy`, `udostepnij-nieobslugiwany`, `skrzynka`, `skrzynka-blad`, `icloud-wylaczony`, `icloud-wlacz`, `icloud-aktywny`, `icloud-czeka`, `icloud-brak-konta`, `icloud-brak-miejsca`, `icloud-konto-zmienione`, `icloud-konflikt-licznik`, `icloud-konflikt-wybor`, `icloud-niepelna`, `icloud-zastap-wylacz`, `icloud-usun-wszystko`.
- **Tokeny:** bez nowych; przełączniki systemowe (`Switch`), arkusz rozszerzenia w kolorach motywu (`arkusz`, `grupa`, `linia`).
- **testID:** propozycja dla 07 w `fix7-2026-10-26.md` („Dla 07”, grupa R i I) — do spec po dopisaniu wierszy w `e2e/README.md`.
- **Zależności 05:** migawka projektów w App Group (N2: id, nazwa, ostatnia praca, liczba wzorów; zapis przy zmianie listy), stan konta (N3 — jeden tekst na brak konta i iCloud wyłączony dla aplikacji), +1 w konflikcie (N5).

## Ikona: wpisy konfiguracji (dla 08)
```json
{ "icon": "./assets/icon.png",
  "ios": { "icon": { "light": "./assets/icon.png", "dark": "./assets/ios-dark.png" } },
  "android": { "adaptiveIcon": { "foregroundImage": "./assets/android-foreground.png", "monochromeImage": "./assets/android-monochrome.png", "backgroundColor": "#FCFCFA" } },
  "plugins": [["expo-splash-screen", { "image": "./assets/splash-icon.png", "backgroundColor": "#FCFCFA", "dark": { "backgroundColor": "#1B1C1F" } }]] }
```
Zegarek: `ikona/watch.png` (1088 × 1088). Ikona warstwowa `.icon` (Liquid Glass) wymaga Icon Composer na macOS: warstwy `ikona/tlo.svg` i `ikona/pierwszy-plan*.svg` to paczka dla kroku właściciela; PNG działają bez `.icon`.

## Audyt 04 2.1 (2026-10-30): rozstrzygnięcia „Do audytu 04” partii 6, D1a, kosz wzoru
Raport: `oczko-warsztat` `04-studio/2026-10-30-audyt/`. Rozstrzygnięcia poniżej to rekomendacje 04 przyjęte do spec, dopóki koordynator (P-087) nie postanowi inaczej; zmiany kluczy i tokenów dla 08 są w raporcie.
- **Skrzynka, film (pkt 1):** `skrzynka.film_zastapi` = „Already has a video link. This one replaces it.” (rozstrzygnięcie 04 zamiast tekstu roboczego; ma podmiot w zdaniu).
- **Add video link (pkt 2):** wiersz zawsze, gdy projekt nie ma filmu (zmiana w „Ekran projektu (W8)”).
- **Add note (pkt 3):** zostaje w menu •••; ikona w pasku nie jest częścią projektu (pasek ma już Mark row i zakreślacz; przy AX5 pasek łamie się w dwa wiersze).
- **Podgląd w skrzynce (pkt 4):** rodzaj pliku i nazwa bez miniatury; miniatura w arkuszu skrzynki wraca tylko z pomiarem kosztu natywnego.
- **Miniatura w wierszu wzoru (pkt 5):** nowy token `miniatura` w `tokeny.json` (szerokość 44, proporcja 1,3, bez promienia, obrys `linia`).
- **Podpowiedź rysika (pkt 6):** plakietka u góry strony, raz na otwarcie, 4 s (`RYSIK_PODPOWIEDZ_MS` potwierdzone), `role=status`.
- **Wiersz „Video” (pkt 7):** „Remove link” ze zwykłym potwierdzeniem (jak każde usunięcie, słownik studia), menu „Change link” / „Remove link” także z widocznego przycisku •••; przytrzymanie zostaje skrótem.
- **Magic Tap (pkt 8):** zrobiony w kodzie; sprawdzenie na urządzeniu w liście testów 07.
- **Kosz wzoru (P-243 S2a):** teksty z `fix8-2026-10-27/klucze.json` potwierdzone, są w `en.json`.
- **Termin jednostki limitu (P-302, P-304):** „crafting day(s)” zamiast „knitting day(s)” w 15 kluczach o dniach; teksty bez faktu neutralne („Now working row”, „Keep counting”, „Resume project”, „Crafting time”, „your work”); `zrodla.zdanie` bez „handbooks” (P-304 (2)). Makiety i design-spec zaktualizowane 2026-10-30; zrzuty wzorcowe (`wzorce-zrzuty/`) pokazują stare brzmienie w części ekranów i nie są odświeżane: SP-13 porównuje system, nie napisy. Łatka kluczy dla 08: `fix9-2026-10-30/klucze.json`.
- **D1a (P-281), brzmienie dla 35 języków:** w nazwach i opisach para „druty i szydełko”; w etykietach do 12 znaków słowo szersze (rękodzieło), a nie samo słowo drutowe; języki bez takiego słowa w słowniku: `[DO USTALENIA]` (rola 09).

## Poza tym etapem (dla audytu roli 04 po roli 08 albo osobnej sesji)
Makiety nienarysowane w build (zegarek i ekran blokady: fix NZ-08-P3-04, `aktywnosc.html`; wzór pionowo i poziomo, rysowanie, iPad: fix NZ-P217-04, `fix7-2026-10-26/wzor.html`): reszta Ustawień (eksport, kopia, polityka, „Oceń”, „Zgłoś problem”; język i „Źródła wiedzy” są w fixie NZ-08-P2-04), test długości tekstu po polsku i niemiecku (P-061 (2a)). System (tokeny, komponenty, głos) je obejmuje; rola 08 buduje je z tokenów, a rola 04 sprawdza je w audycie wobec tego dokumentu.

## Propozycja wpisu do pamięci portfolio (repo `prompts`, dopisuje właściciel)
| Aplikacja | Metafora / element firmowy | Paleta (rdzeń) | Kroje | Uwagi właściciela |
|---|---|---|---|---|
| Oczko („Kreski na wzorze”) | Wydruk wzoru z ołówkiem: kreski rzędów sesji w piątkach, zakreślacz na rzędzie z instrukcją, linijka celu; ikona: cztery kreski z przekreśleniem na pasie zakreślacza | papier `#FCFCFA`, grafit `#26282C`, ołówek HB `#5E626A`, zakreślacz `#F6E04A` (nocą `#38351F` z krawędzią `#E2CB3A`); kolor włóczki projektu tylko jako kropka | Libre Franklin (tytuły, liczba, przyciski), treść systemowa | 2026-10-22: „Zgodnie z rekomendacja” (kierunek A z linijką celu z C i kolorem włóczki z B); Libre Franklin wybrany zamiast rekomendowanego Archivo wąskiego; ikona zatwierdzona. Kreski + zakreślacz należą do Oczka. |
