# M3 p4b: stan partii (sekcje kawałków)

Wzorzec stanu: `m3-p7-stan.md`. Wykaz zastąpionych testów: `m3-p4b-zastapione-testy.md`.

## Kawałek A: ekran Projekt (rola 08, build, 2026-11-08)

Źródła: `docs/design/dzianina/fix-makiety-2026-11-08/dowody.md` (zadanie 1), makiety `ekrany.html` (`projekt`, `projekt-menu`, `projekt-edycja`, `projekt-ukonczony`), tokeny `projekt.*`, `miniatura.dzianina`.

**Zrobione** (commity w sekcji „Commity”):
1. Nagłówki grup (Części, Czas, Notatka, Szczegóły; też Zdjęcia i Wzór w ich komponentach): 17 pt / 700 / `tekst` (`typografia.instrukcja`, `projekt.naglowekGrupy`).
2. Miniatura dzianiny w wierszu części: ten sam komponent `Dzianina` co lista Projekty, rozmiar i promień z `miniatura.dzianina`, `gotowe` = rzędy części, `cel` = cel części (bez celu: `null`, jak na liście — okno 96 rzędów bez linii celu); ukryta przed VoiceOver (`accessibilityElementsHidden`, `no-hide-descendants`) i od AX1 w ogóle.
3. Strzałka (`StrzalkaWiersza`) w wierszach części i liczników (wiersze z liczbą sesji i Szczegółów miały lub dostały ją w tym samym kroku).
4. Szczegóły, Czas, daty ukończonego: jeden wiersz „etykieta po lewej, wartość `tekst2` po prawej, strzałka”; od AX1 kolumna (wartość pod etykietą, strzałka przy etykiecie).
5. „+” i ••• w `akcentTekst` (kolor przez istniejącą właściwość `kolor` `PrzyciskSymbolu`; `Pasek.tsx` bez zmian); „Gotowe” `akcentTekst`, 700.
6. Menu „+” i •••: pływająca lista pod paskiem (`position: absolute`, `powierzchnia`, promień `lista`, pozycje ≥ `cele.minimum`), „Usuń projekt…” w `niszczacy`; zachowanie i testID bez zmian.
7. Aliasy `papier`/`grafit`/`olowek`/`papierGrupa`/`blad`/`promien.grupa` w `Projekt.tsx` zastąpione tokenami Dzianiny; znak usunięcia `minus.circle.fill` w `niszczacy`.
8. Zdanie pomocy w edycji (`projekt.edycja_info`) już było i jest pokazywane; bez zmian.
Poza zakresem A, dla spójności testu 6 nagłówków: nagłówek w `WzorGrupa.tsx` i `Zdjecia.tsx` (po jednej linii stylu; **uwaga koordynatora: linia `Zdjecia.tsx` `naglowek` należy też do kawałka Zdjęcie — jeśli tamten ją zmienia, powinna być identyczna: `{ ...typografia.instrukcja, color: k.tekst }`**).

**Testy przed → po** (`tests/ekrany/m3-p4b-projekt.test.tsx`, 23 testy; wyniki z tego uruchomienia):
- Przed kodem: 23 czerwone, z właściwego powodu: asercje wyglądu (`Expected "#8A5A12" Received "#221D1A"` dla „+”/•••; nagłówki: 13 pt/`undefined`/`tekst2`), brakujące elementy (`Unable to find an element with testID: projekt-menu-lista`, `projekt-miniatura`, `projekt-czesc`, `projekt-licznik`), układ (`flexDirection: Expected "row", Received undefined`).
- Po kodzie: `Tests: 23 passed, 23 total`. Zestaw 35 plików dotykających Projekt: 228 zielonych; `npx jest tests/ekrany tests/i18n`: 231 zestawów, 2094 testy zielone.
- Test „znak usunięcia w `niszczacy`” był zielony od początku (alias `blad` = `niszczacy`); zostaje jako zabezpieczenie po usunięciu aliasu.
- `npm run typecheck`, `typecheck:testy`, `lint`: kod 0.
- Zastąpione testy: `m3-p4b-zastapione-testy.md` (2 pliki, wartości nagłówka).

**Nowe testID (dla roli 07):** `projekt-menu-lista` (pływająca lista menu „+” i •••), `projekt-czesc` (wiersz części), `projekt-licznik` (wiersz licznika części), `projekt-licznik-wiersz` (obwiednia wiersza licznika z wcięciem), `projekt-miniatura` (miniatura dzianiny części, ukryta przed VoiceOver). Istniejące testID bez zmian.

**Odstępstwa od makiety i zgłoszenia**
- Do 04: brak tokenów menu „+” i •••: cienia (makieta `0 8 28 #0005`), szerokości (250), wysokości pozycji 48 pt (jest `cele.minimum` 44 pt) i odsunięcia od krawędzi. Zrobiono bez cienia i bez stałej szerokości (lista przy prawej krawędzi, szerokość z treści), zgodnie z regułą „bez tokenu nie wpisuję wartości”.
- Do 04 / koordynatora: „‹ Projekty” w makiecie jest `akcentTekst`; w kodzie `Wstecz` ma domyślnie `tekst` i test `pasek-symbole-033-036` wymaga jednego wyglądu „wstecz” na licznik, projekt i kosz. Nie zmieniano (zmiana domyślnej w `Pasek.tsx` dotyka wszystkich ekranów — osobna decyzja; `Wstecz` ma już właściwość `kolor`).
- Do 09 / decyzji: „Ukończony {data}” pod tytułem ukończonego projektu (makieta `projekt-ukonczony`) nie ma klucza (jest `projekt.data_ukonczenia` „Finished” i grupa dat niżej); nie dodawano klucza. Zdanie pomocy w edycji w makiecie („Usuń część albo licznik znakiem minus. Usunięte trafiają do kosza na 30 dni.”) różni się od istniejącego `projekt.edycja_info` („Deleted parts and counters stay in Recently deleted for 30 days.”) — zostawiono istniejący.
- Kropka włóczki (P-567) nie wdrożona (decyzja P-598 (a)).
- Wiersze Czas/Szczegóły dostały `paddingHorizontal` `odstep.l` (było `odstep.m` ze wszystkich stron), zgodnie z makietą; wartości sumy czasu i liczby sesji z `tekst` na `tekst2` (makieta `.war`).
- Miniatura części bez celu: `cel = null` (okno 96 rzędów, bez linii celu) jak na liście Projekty, nie „puste wypełnienie”; jeśli ma być puste, to zmiana `Dzianina`/kompozycji do uzgodnienia z 04.

**Nie sprawdzono:** urządzenie i zrzuty (brak macOS/Expo web), 320 i 430 pt, AX5 na ekranie (test AX1 przez `fontScale` 1,786), VoiceOver, rzeczywiste położenie menu (`top: '100%'` pod paskiem, `zIndex`) na iOS, kontrast tekstów `akcentTekst` na zrzutach.

### Commity
- `65284d5` [M3 p4b] Projekt: wygląd Dzianiny (kod, testy, zastąpione asercje nagłówka)

## Kawałek B: arkusz formularza, podgląd zdjęcia, przycisk z symbolem (rola 08, build, 2026-11-08)

Źródła: `dowody.md` (zadania 2, 3, 8), makiety `ekrany.html` (`formularz-czesc`, `formularz-narzedzie`, `zdjecie`, `oferty-czeka`), tokeny `arkusz.*`, `znaczniki.*`, `podgladZdjecia.*`, `systemCzarny.*`. Tokeny czytane bezpośrednio z `docs/design/tokeny.json` (jak `Licznik.tsx`), bez dopisywania do `motyw.ts`.

**Zrobione**
1. Arkusz formularza (`Arkusz.tsx`): Anuluj `akcentTekst` 400, Zapisz/Dodaj `akcentTekst` 700, nieaktywny `przyciskNieaktywnyTekst` 600 (osobny styl `zapiszNieaktywny`, żeby nie zmienić wagi tekstu nieaktywnego `Przycisk`); pole: obrys 2 pt `tekst2`, fokus `akcentTekst` (stan w `Pole`), min. 48 pt; tytuł nagłówka już skalował się jak tytuły (`MAX_SKALA_TYTULOWA`), test dodany jako zabezpieczenie.
2. `Komunikat` ze `znak`: widok z rolą alert i etykietą = samo zdanie (bez „!”), kółko 22 pt (AX1+: 32) z „!” (obrys `tekst`, ukryte przed VoiceOver), zdanie w `tekst`. `Komunikat` bez `znak` bez zmian (Text z rolą alert).
3. `Wybor` → lista ze znacznikiem: wspólny `ZnacznikRadio` (28 pt, AX1+ 40, obwódka `tekst2`; wybrany `przycisk` + `checkmark` w `przyciskTekst`), tło listy `tlo`, promień `lista`, podziałki `linia`; role radiogroup/radio, `selected` i testID bez zmian; tekst opcji zwykły (było 700 z ramką `opcjaWybrana`, makieta: zwykły). Ten sam `ZnacznikRadio` zastąpił składany z odstępów znacznik planów w `Oferty.tsx` (dawny wyjątek „do zgłoszenia 04” zamknięty; przy AX1+ plan ma teraz 40 pt jak w makiecie).
4. `Przycisk`: nowa właściwość `symbolPrzed` (symbol przed tekstem w kolorze tekstu przycisku; w stanie nieaktywnym `przyciskNieaktywnyTekst`); `symbol` bez zmian (zastępuje tekst). Użycie: `Oferty.tsx` przycisk „czeka” z `hourglass`.
5. Podgląd zdjęcia: „Zamknij” w prawym górnym rogu (`testID="zdjecie-zamknij"`), Udostępnij/Usuń z `square.and.arrow.up`/`trash` i podpisem 600 w `systemCzarny.akcentTekst`, licznik `systemCzarny.tekst2`; od AX1 dolny pasek w kolumnie z licznikiem nad akcjami (makieta AX5). „Zamknij” też w `akcentTekst` (makieta `.zd a`).
6. Grupa zdjęć: kafel „Dodaj zdjęcie” `powierzchnia` bez obrysu, plus w `ikona`, podpis 600 `tekst`; lista wyboru źródła: `powierzchnia`, promień `lista`; aliasy `grafit`/`papierGrupa`/`drugiPrzyciskObrys`/`promien.grupa` w `Zdjecia.tsx` zastąpione tokenami. Nagłówek grupy (linia kawałka A) nietknięty.
Nazwy symboli: `hourglass`, `trash`, `square.and.arrow.up`, `checkmark` już były w `NazwaSymbolu` (nic nie dopisywano).

**Testy przed → po** (`tests/ekrany/m3-p4b-arkusz-zdjecie.test.tsx`, 21 testów × 2 motywy tam, gdzie zależą od palety = 42 przypadki)
- Przed kodem: 27 czerwonych z właściwego powodu (asercje wyglądu i brakujące elementy), m.in.: Anuluj `Expected "#8A5A12" Received "#221D1A"`, waga `"400"`/`undefined`; pole `minHeight Expected 48 Received 44`; błąd ze znakiem `Unable to find an element with testID: komunikat-znak`; Wybor `Unable to find ... testID: znacznik-radio`; Zamknij `Unable to find ... testID: zdjecie-zamknij`; Udostępnij `Unable to find ... testID: symbol-square.and.arrow.up`; licznik `Expected "#C7BCB2" Received "#F1EDE9"`; AX1 pasek `Expected "column" Received "row"`; kafel `borderWidth`/tło; `Unable to find ... testID: symbol-hourglass` (Przycisk, Oferty).
- Zielone od początku (zabezpieczenia): nieaktywny zapis 600, skala tytułu, fokus wywołuje `naFokus`, błąd bez znaku, role/`selected` Wybor, lista źródła zdjęcia (aliasy dawały te same wartości), `symbol` zastępuje tekst, brak symbolu bez `symbolPrzed`, przycisk kupna bez klepsydry.
- Po kodzie: `Tests: 42 passed, 42 total`. `npx jest tests/ekrany tests/i18n`: 232 zestawy, 2136 testów zielone (po zmianie 3 asercji niżej). `npm run typecheck`, `typecheck:testy`, `lint`: kod 0.
- Zastąpione 3 asercje wyglądu „! tekst” (wykaz `m3-p4b-zastapione-testy.md`).

**Nowe testID (dla roli 07):** `zdjecie-zamknij` (Zamknij podglądu), `znacznik-radio` (znacznik wyboru w `Wybor` i planach Oferty, ukryty przed VoiceOver), `komunikat-znak` (kółko „!”, ukryte przed VoiceOver). Dotychczasowe testID bez zmian.

**Odstępstwa od makiety i zgłoszenia**
- Do 04: lista źródła zdjęcia i wiersze `Wybor` mają min. 44 pt (`cele.minimum`), makieta 52/48 pt; brak tokenu wysokości wiersza listy (jest tylko `arkusz.pole.minWysokosc` 48 dla pola). Grubość obrysu kółka „!” (2 pt) i podziałki wierszy listy nie mają tokenu (użyto 2 jak obrys pola i `hairlineWidth`).
- Do 04: odstęp symbol–podpis w akcjach podglądu i w przycisku z symbolem = `odstep.s` (8; makieta 6 poza siatką 4).
- Do 04/08: `Jednostki` w `Zapas.tsx` (m/yd, g/oz) mają własny znacznik radio w starym wyglądzie; poza zakresem B (nie `Wybor`), do osobnej decyzji, czy też przechodzą na `ZnacznikRadio`.
- Do 09: brak (żadnych nowych kluczy; użyto istniejących).
- Układ arkusza formularza w tytule nagłówka: bez zmian poza kolorami i wagami (wiersz Anuluj/Zapisz + tytuł pod spodem od AX1, jak dotąd).
- Nie sprawdzono: urządzenie i zrzuty (brak macOS), 320/430 pt, AX5 na ekranie (test AX1 przez `fontScale` 1,786), VoiceOver, kolor symbolu `hourglass`/`checkmark` na iOS 18 [DO USTALENIA na urządzeniu], przewijanie dolnego paska podglądu przy AX5.

### Commity (kawałek B)
- `f280a82` [M3 p4b] Formularz i zdjęcie (kod, testy, 3 zastąpione asercje „! tekst”)

## Kawałek C: stoper, kolumny dzianiny, Narzędzia, Ustawienia, pas blokady, aliasy (rola 08, build, 2026-11-08)

Źródła: `dowody.md` (zadania 4, 5, 6, 7, 9), makiety `ekrany.html` (`licznik-stoper`, `narzedzia`), tokeny `stoper.biegnie`, `dzianina.kolumnaKarty/kolumnaLicznika`, `znaczniki.*`, `kolory.systemCzarny.pasPrzypomnienia`. Tokeny czytane z `tokeny.json` (jak w kawałku B), bez dopisywania do `motyw.ts`.

**Zrobione**
1. **Stoper biegnący** (`LicznikAkcje.tsx`, `AkcjaLicznika` z `podkreslona`): tło `powierzchnia`, rama 2 pt `akcentTekst`, czas 700 `tekst` z `tabular-nums`, symbol `akcentTekst`; role kolorów i liczby z `stoper.biegnie`. Stan wstrzymany i brak sesji bez zmian.
2. **Kolumny dzianiny**: karta „Dziś” 112 × min. 216 (AX1+ min. 120), promień 12 (`Dzis.tsx`, stała `KOLUMNA_KARTY` z tokenu; zniknął `cel.plus * 1.5` i `minHeight/height cel.plus * 2`); licznik 64 × 260 (AX1+ pas o wysokości 96), promień 12 (`Licznik.tsx`, `LicznikStyl.ts`; zniknęło 72 × 252). Próg AX1 (jak reszta repo), nie sam AX5.
3. **Wspólny kafelek ikony wiersza** `KafelekIkony.tsx` (32 pt, AX1+ 44, promień 8, tło `ikonaTlo`, symbol `ikona` 20 pt / AX1+ 30 pt; symbol SF albo rysunek SVG), użyty w Ustawieniach i Narzędziach; nowy `IkonaDruty.tsx` (SVG `druty` z `ikony.js`, wzór `IkonaDnia`).
4. **Narzędzia**: Włóczki `scribble.variable`, Druty `IkonaDruty`, Próbka `square.grid.3x3` (`WierszGrupy` dostał opcjonalne `ikona`; `Zapas.tsx` bez zmian). **Miary i Język**: symbol `checkmark` w `akcentTekst` (`znaczniki.wyboruListy`, skala ×1,6 jak znak wyboru) zamiast „✓”.
5. **Ustawienia**: Oczko Pro = `IkonaDnia` (zamiast `sparkles`), „Ekran nie gaśnie” = `iphone`; kafelek z `znaczniki.*` (zniknęło `IKONA_WIERSZA = odstep.xxl + odstep.s` i promień `pole`). Radio z `znaczniki.radio` w Ustawieniach nie występuje (znacznik radio to wspólny `ZnacznikRadio` z kawałka B).
6. **Ekran blokady** (`targets/widget/expo-target.config.js`, `targets/watch/expo-target.config.js`): tło pasa przypomnienia (`wyspaPowierzchnia`, zegarek `powierzchnia`) z `systemCzarny.pasPrzypomnienia` zamiast `ciemny.powierzchnia`. Źródłem jest config czytający `tokeny.json`, nie Swift: nazwy barw w katalogu zasobów i pliki Swift bez zmian; wartość ta sama (#312B27). Niesprawdzone na urządzeniu (brak macOS/actool).
7. **Aliasy (punkt 3)**: usunięte, bo nic ich nie używa (grep `src`, `tests`, `app`, `targets`): w `Kolory` `kreska`, `przyciskNieaktywnyTlo`, `przyciskNiszczacyTlo`, `przyciskNiszczacyTekst`; w `systemCzarny` `grafit`, `olowek`, `przyciskTlo`, `przyciskObrys`, `zakreslacz`, `tekstNaZakreslaczu`, `zakreslaczKrawedz` (obiekt = teraz wprost `tokeny.kolory.systemCzarny`). Pozostałe aliasy zostają (używane przez ekrany innych partii) — lista niżej.

**Testy przed → po** (nowe pliki `m3-p4b-*`; czerwone z właściwego powodu, potem zielone)
- `tests/ekrany/m3-p4b-stoper.test.tsx` (11 przypadków, 2 motywy): przed kodem 4 czerwone (`backgroundColor`/`borderWidth` komórki, `fontWeight` czasu, `tintColor` symbolu — oczekiwano `#F6F4F1`/2/`#8A5A12`, było `#C08425`/brak/`#221D1A`); po: `Tests: 11 passed`. Zielone od początku: wstrzymana i brak sesji (zabezpieczenia).
- `tests/ekrany/m3-p4b-kolumny.test.tsx` (7): przed kodem 4 czerwone (`width`/`minHeight`/`borderRadius` karty: oczekiwano 112/216/12, było `1,5 × 72`/144/10; licznik `Expected 96 Received 108`, promień `Expected 12 Received 10`/`undefined`); po: `7 passed`. Zielone od początku: tokeny, wymiar dzianiny mierzony z kolumny.
- `tests/ekrany/m3-p4b-narzedzia-ustawienia.test.tsx` (15 przypadków, 2 motywy): przed kodem 14 czerwonych (`Unable to find an element with testID: kafelek-ikony`, `symbol-checkmark`, `symbol-iphone`, glif „✓” znaleziony); po: `15 passed`. Zielony od początku tylko test tokenu.
- `tests/wydanie/m3-p4b-pas-blokady.test.ts` (3): przed kodem 2 czerwone (`Expected pattern: /czarny\('pasPrzypomnienia'\)/`; wartości równe, więc test czyta źródło configu); po: `3 passed`.
- `tests/ekrany/m3-p4b-aliasy.test.ts` (13): przed kodem 11 czerwonych (klucz `kreska`, `grafit` … nadal w eksporcie); po: `13 passed`.
- Zastąpione testy (wykaz `m3-p4b-zastapione-testy.md`, 4 wiersze): `stoper-kapsula-rozmiar` (czas 700), `jezyk-zrodla` („✓” → `symbol-checkmark`), `przycisk-glowny-wypelniony` (stoper: rama zamiast wypełnienia `akcent`), `pasek-symbole-033-036` (wzorzec `/^symbol-/` → `symbol-chevron.forward`, bo wiersz ma też kafelek). `barwy-celow-tokeny.test.ts`: tabela wymagań tła pasa z `systemCzarny.pasPrzypomnienia` (wartość ta sama) — nie osłabione.
- Celowane: `npx jest tests/ekrany tests/i18n tests/jakosc tests/wydanie tests/dzianina`: 322 zestawy, wszystkie zielone **oprócz jednego, spoza kawałka C**: `tests/jakosc/bez-literalow-wymiarow.test.ts` — `src/ekrany/Arkusz.tsx:278 marginTop: 1` (`bladZnak`, kółko „!” z kawałka B, commit f280a82); do poprawy w kawałku B (token albo wyjątek nazwany 04). `npm run typecheck`, `typecheck:testy`, `lint`: kod 0.

**Nowe testID (dla roli 07):** `kafelek-ikony` (kafelek ikony wiersza; dekoracyjny, ukryty przed VoiceOver), `symbol-druty` (rysunek drutów w wierszu Druty), `symbol-dzien` (ikona dnia w wierszu Oczko Pro w Ustawieniach; nazwa z prefiksem `symbol-`, żeby test p7 „jedna ikona na wiersz” ją widział). Istniejące testID bez zmian.

**Odstępstwa od makiety i zgłoszenia**
- Do 04: token `znaczniki` nie ma pól liczbowych rozmiaru symbolu w kafelku (20 pt, AX 30 pt są tylko w opisie `_kafelek`); w `KafelekIkony.tsx` stałe `SYMBOL = 20`, `SYMBOL_AX = 30` z komentarzem. Prośba: pola `znaczniki.symbolKafelka`, `symbolKafelkaAx5`.
- Do 04: token `dzianina.kolumna*.promien` = 12 nie ma odpowiednika w `promienie` (są 10 i 16); użyto wprost tokenu kolumny.
- Do 04 / urządzenie: `iphone` obok `iphone.radiowaves.left.and.right` (wibracje) w tej samej grupie wyglądają podobnie; `iphone`, `scribble.variable`, `checkmark` na iOS 18 [DO USTALENIA na urządzeniu]; rama stopera dodaje 2 pt do wymiaru komórki (makieta nie mówi, czy rama jest wewnątrz) — sprawdzić na zrzucie.
- Dodano nazwę `iphone` do typu `NazwaSymbolu` (wyjątek P-577).
- Wartość pasa blokady w wersji jasnej systemu: `wyspaPowierzchnia` i `powierzchnia` zegarka nadal dwa razy ta sama barwa (jasna = ciemna), bo tło wyspy i zegarka jest zawsze czarne.
- AX stoper/Dzis: karta „Dziś” od AX1 używa `minHeight` 120 (token `ax5MinWysokosc`), nie stałej `height`.

**Pozostałe aliasy w `src/ekrany/motyw.ts`** (liczba plików / użyć, pliki; przybliżenie wzorcem `k.`, `kolorJasny.`, `promien.`, `cel.`, `odstep.`, `typografia.` — migracja to inne partie):
- `Kolory`: `papier` 11 plików (Aplikacja, LicznikStyl, ListaProjektow, ObrazKarty, WzorGrupa, WzorNotatki, WzorPrzegladarka, WzorZnacznik, app/_layout, app/wzor, kompozycja/Bezpieczny); `papierGrupa` 7 (LicznikStyl, ListaProjektow, Stoper, WzorGrupa, WzorPrzegladarka, WzorSkrzynka, WzorZnacznik); `arkusz` 6 (LicznikStyl, WzorFilm, WzorGrupa, WzorNotatki, WzorPrzegladarka, WzorSkrzynka); `grafit` 13 (FormularzeProjektu, LicznikStyl, ListaProjektow, ObrazKarty, Stoper, WzorFilm, WzorGrupa, WzorMenu, WzorNotatki, WzorPrzegladarka, WzorSkrzynka, WzorZnacznik + test bez-literalow-wymiarow); `olowek` 11 (LicznikStyl, ListaProjektow, ObrazKarty, Stoper, WzorFilm, WzorGrupa, WzorMenu, WzorPrzegladarka, WzorSkrzynka, WzorZnacznik + test pasek-symbole-033-036); `przyciskTlo` 1 (test pole-wyboru-wloczki); `przyciskObrys` 1 (WzorPrzegladarka); `drugiPrzyciskObrys` 3 (LicznikStyl, WzorZnacznik, test pole-wyboru-wloczki); `blad` 3 (WzorNotatki, WzorPrzegladarka, test pasek-symbole-033-036); `tekstNaZakreslaczu` 1 (Licznik); `zakreslaczKrawedz` 1 (LicznikStyl).
- `promien`: `grupa` 9 (LicznikStyl, ListaProjektow, Stoper, WzorGrupa, WzorNotatki, WzorPrzegladarka, WzorSkrzynka, WzorZnacznik + test m3-p4b-projekt); `przyciskGlowny` 3 (LicznikStyl, WzorLicznik + test); `przyciskPelny` 2 (Arkusz + test); `przyciskDrugi` 8 (Arkusz, IcloudKonflikt, LicznikStyl, Ukonczenie, WzorLicznik, WzorPrzegladarka, WzorZnacznik + test); `poleWyboru` 2 (Arkusz + test); `zakreslacz` 1 (LicznikStyl).
- `odstep.sekcja` 4 (Dzis, LicznikStyl, MenuProjektu + test p6-narzedzia-tokeny).
- `cel`: `przyciskMinus` 3 (LicznikStyl, Ukonczenie + test); `poleWyboru` 2 (Arkusz + test); `przyciskMinusPaska`, `przyciskPlusPaskaWysokosc` 1 (WzorLicznik); `przyciskPlusPaskaSzerokosc` 2 (WzorLicznik + test); `przyciskPlusWysokosc` 1 (LicznikStyl).
- `typografia`: `liczba` 4, `liczbaPaska` 2, `liczbaKolumny` 1 (test), `tytul` 14, `instrukcja` 6, `przycisk` 6, `znakWyboru` 2 (Arkusz + test), `przyciskPelny` 2, `podpis` 24, `drobny` 3 (ListaProjektow, Sesje, Ustawienia).
- Największe skupiska do migracji: `LicznikStyl.ts`, ekrany `Wzor*`, `ListaProjektow.tsx`, `Stoper.tsx`.

**Nie sprawdzono:** urządzenie i zrzuty (brak macOS/Expo web), 320/430 pt, AX5 na ekranie (testy AX przez `fontScale` 1,786 i 3,571 w kolumnach), VoiceOver, kolor tła pasa blokady w katalogu zasobów (actool), widok ramy biegnącego stopera, `npm run jakosc:kontrole` i pełny `npm test` (robi koordynator).

### Commity (kawałek C)
- `29700c3` stoper biegnący (kod, test, 2 zastąpione asercje)
- `9e8030b` kolumny dzianiny z tokenów
- `aa3f05a` kafelek ikony, ikony Narzędzi i Ustawień, checkmark w Miarach i Języku (2 zastąpione asercje)
- `e595ef9` pas przypomnienia z `systemCzarny.pasPrzypomnienia` (config celów widget i watch)
- `ab9959c` usunięcie nieużywanych aliasów z `motyw.ts`
