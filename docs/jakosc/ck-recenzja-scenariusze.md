# CK · recenzja scenariuszy i testów BX10, BX11, FX5 (08 audit, 2026-11-16)

Polecenie: `origin/koordynacja:docs/koordynacja/polecenia/CK.md` @ e261d72e. Stan: `claude/bx11-2026-11-16` @ 6a055e8b, tylko odczyt. Zakres: BX10 = `git log --no-merges d7642f33..6a055e8b --not 7f75ba61` (14 commitów); BX11 = d3b1fa6, ed2ff04, 4ea9d33 (105) i testy `ch01-…`, `pu-191-…`; FX5 = 6360646, 3bfec91, c0804df.
Kolejność pracy: najpierw własna ocena. Raporty autorów (`bx-stan.md` BX10, BX11, FX5 i `bx11-dowod-czerwony.txt`) czytałem dopiero potem, do porównania.

## Werdykt: **Z UWAGAMI**, do scalenia z integracją

Nie ma P1. Wszystkie trzy P2 dotyczą scenariuszy z tagiem `oczekujacy`, czyli spoza bramki. Mają być poprawione, zanim ten tag zostanie zdjęty, a nie przed scaleniem. Katalog PU, bramka, `config.yaml`, `czesci.json` i decyzje są czyste.

## Dowody (uruchomione)

- Testy celowane (maestro-scenariusze, e2e-czesci, e2e-noc, bx8, bx10, ch01, pu-191, migawka-291, przelacz-290, pu-292): **122/122, kod 0**. Bramka katalogu PU: kod 0.
- Mutacje testu PU-191 robiłem na kopii (worktree w scratchpadzie), bez commita. Wynik: 6 z 9 **pada**, czyli test je łapie: zależność `expo-insights`, zależność `@microsoft/react-native-clarity`, plugin `expo-tracking-transparency` w `app.json`, `NSPrivacyTracking: true`, `NSUserTrackingUsageDescription` w `targets/share/Info.plist`, to samo w `app.json` `infoPlist`. 3 mutacje **przeżywają**: (a) zależność dopisana razem z wpisem „P-913 dopisane” na liście dozwolonych (ID nie jest sprawdzany w `docs/decyzje.md`); (b) `@sentry/react-native` w `devDependencies`; (c) lokalny plugin `./plugins/moj-analytics` w `app.json`.
- Zależności przechodnie: w `package-lock.json` jest 633 pakietów produkcyjnych (bez `dev`). Żadna nazwa nie pasuje do wzorca SDK reklam, analityki, awarii, śledzenia, insights ani clarity. Dziś czysto, ale test tego nie pilnuje.
- Mutacje testu PU-011 (`tests/ekrany/pu-wzor-przelacz-290.test.tsx:108`):
  - gubienie drugiego zdarzenia `onRysunek`: test **pada**;
  - usunięcie kolejki klucza `wKolejceKlucza` (`src/przypadki-uzycia/wzor.ts:222`): ten test **przeżywa**, ale łapie ją `tests/dane/wzor-rysunki-odzysk.test.ts` (M1-105, **pada**). Kolejka jest więc chroniona;
  - wymuszony wolniejszy pierwszy zapis bez kolejki: **pada**.
- Migawka PU-291 (`tests/ekrany/pu-wzor-nazwa-migawka-291.test.ts:33-37`): test działa na prawdziwej bazie, prawdziwym `zmienNazweWzoru` i prawdziwym pliku migawki. Klucze migawki są wyliczone dokładnie (:33), więc nowe pole z nazwami wzorów przewróci test. Atrap brak.

## Znaleziska

| ID | Poziom | Realność | Miejsce | Znalezisko | Poprawka (P1/P2) |
|---|---|---|---|---|---|
| CK-01 | P2 | brzegowy | `e2e/scenariusze/105-pu-071-ekrany-poza-wzorem-zostaja-w-pionie.yaml:19` (i :30, :38, :49, :58, :67), nagłówek :5 | Asercja `window: portrait` nie ma kontroli pozytywnej. Jeśli `setOrientation` nie obróci symulatora, wszystkie 6 asercji przejdzie. Nagłówek :5 twierdzi, że obrót sprawdza scen. 103, ale 103 używa „Rotate page” (`wzor-obroc`, :44), czyli obrotu strony, a nie `setOrientation`. Panelu `e2e-okno` nie czyta żaden inny scenariusz. Scen. 23, 44, 45 i 46 obracają ekran, ale też nie sprawdzają, że okno jest poziome. | W 105 otworzyć wzór (trasa `wzor` ma orientację `all`, `src/domena/uklad.ts:37`), wykonać `setOrientation: LANDSCAPE_LEFT`, asertować `e2e-okno` „.*window: landscape.*” i wrócić do `PORTRAIT`. |
| CK-02 | P2 | brzegowy | `e2e/scenariusze/91-pu-290-dwa-wzory-przelaczanie-i-restart.yaml:85-88` | Sprawdzenie po restarcie nie rozróżnia „ostatnio wybrany” od „pierwszy po nazwie”. Bez zapisanego wyboru `wzorDoOtwarcia` bierze `lista[0]` posortowaną po nazwie NOCASE (`src/przypadki-uzycia/wzor.ts:148-153`, `:172`). „Sleeve chart” (PDF) jest przed „Test pattern” (zdjęcie), więc regresja `zapamietajWzor` dałaby ten sam wynik i scenariusz by przeszedł. | Przed restartem wybrać wzór, który nie jest pierwszy po nazwie (np. wrócić do zdjęcia „Test pattern” i po restarcie asertować `wzor-zrodlo` „Photo.*”), albo nazwać PDF tak, by stał drugi (np. „Yoke chart”). |
| CK-03 | P2 | brzegowy | `tests/jakosc/pu-191-bez-sdk-reklam-i-sledzenia.test.ts:11`, `:23` | Po CH-03 zostały trzy luki. (a) Wpis na liście wymaga tylko wzorca ID, nie istniejącej decyzji, więc „P-913 dopisane” przechodzi. (b) `devDependencies` są pomijane, a Metro zbundluje pakiet z `devDependencies`, jeśli kod go zaimportuje. (c) Zależności przechodnie nie są sprawdzane. Dziś wszystko czyste, co sprawdziłem ręcznie (patrz Dowody). | Sprawdzać, że ID z wpisu występuje w `docs/decyzje.md`, a drugą barierę (`ZAKAZANE`) przepuszczać też przez `devDependencies` i nazwy produkcyjnych pakietów z `package-lock.json`. |
| CK-04 | P3 | brzegowy | `docs/jakosc/przypadki-uzycia.md:129` (PU-067) | Pokrycie PU-067 podaje 104:37, :41 i :50 bez dopisku „częściowo”. Tymczasem „znacznik na stukniętym rzędzie” (położenie) nie jest sprawdzony, co nagłówek 104:5 sam przyznaje. Pokrycie PU-066 (:128) nazywa to poprawnie. | — |
| CK-05 | P3 | brzegowy | `docs/jakosc/przypadki-uzycia.md:34` (PU-011) | Pokrycie „z testem: …:125” bez dopisku „częściowo”. „4 highlights” w teście pochodzi z atrapy (`onZakreslenia { liczba: 4 }`, :120-122). „Oba pasy od razu” i „liczba rośnie o 2” liczy widok natywny, poza Jest. Test chroni zapis obu pociągnięć i stan po restarcie. Komentarz :106 mówi „3 → 4”, a PU mówi „rośnie o 2”. | — |
| CK-06 | P3 | brzegowy | `e2e/scenariusze/96-pu-170-stoper-po-powrocie-z-tla.yaml:34` | `!=` sprawdza „inny”, a nie „rośnie”. Stoper wyzerowany przy powrocie z tła też da inny tekst. CE-02 jest zamknięte co do rdzenia (zamrożony czas pada). | — |
| CK-07 | P3 | teoretyczny | `e2e/scenariusze/102-…yaml:36`, `104-…yaml:33`; `91-…yaml:35`, `109-…yaml:49` | Reguła 6 (`e2e/README.md:16`): w 102 i 104 `inputText` stoi poza `retry`. W 91, 102, 104 i 109 tekst idzie całym napisem, nie po jednym znaku. `maestro-scenariusze.test.ts` tego nie pilnuje. | — |
| CK-08 | P3 | teoretyczny | `docs/jakosc/przypadki-uzycia.md:87` (PU-044) | Cel „Chcę widzieć cel dnia na «Dziś»” przeczy nowemu Wynikowi („karta «Dziś» celu dnia nie pokazuje”). Cel nie był objęty słowami właściciela (22f5941), więc zmiana wymaga jego słów (zasada 22). | — |
| CK-09 | P3 | teoretyczny | `tests/jakosc/e2e-noc-2026-11-02.test.ts:191` | Komentarz „numery 90–91 wolne (P-887)” jest nieaktualny, bo lista ma już 90 i 91 (P-905). | — |

## Stan poprawek CE i CH

| Poprawka | Werdykt | Dowód |
|---|---|---|
| CE-01 (99 nie może paść) | **zamknięte** | `permissions: { all: unset }` w każdym `launchApp` scenariusza z asercją braku prośby. Reguła obejmuje cały katalog z podprzepływami (`tests/jakosc/bx10-uprawnienia-przy-starcie.test.ts:40-57`, zielony). Widoczność systemowego alertu dla Maestro iOS: patrz „Do sprawdzenia”. |
| CE-02 (rosnący czas, 96) | **zamknięte** | 96:23-25 i :33-34 (`copyTextFrom` → `evalScript` → `assertTrue`). Uwaga CK-06. |
| CE-03 (notatki rzędów, 102) | **zamknięte** | Notatka przed usunięciem i po przywróceniu. Część danych: `tests/dane/pu-292-notatki-rzedow-po-usunieciu-wzoru.test.ts:24`, `:28`. |
| CE-04 (który pas, 101) | **zamknięte** | Drugie pociągnięcie gumką po 35% zostawia „1 highlight”, a po restarcie gumka po 55% daje „0 highlights”. |
| CE-05 (Pokrycie PU-180) | **zamknięte** | Pokrycie nazywa część „poza Maestro” (`przypadki-uzycia.md`, PU-180). |
| CE-06 (test globu tylko negatywny) | **zamknięte** | `tests/jakosc/bx8-numeracja-trzycyfrowa.test.ts:45-57`: prawdziwy bash rozwija globy z workflow na plikach 05-, 100-, 109- i config.yaml. |
| CE-07 (P-889 nieaktualne) | **zamknięte** | P-905 dopisana, P-889 nietknięta. Lista `bx7` zawiera dokładne nazwy przez `plik(n)` (prefiks z myślnikiem, `e2e-noc…:9`) i `toEqual` na pełnej liście. |
| CE-08 (odnośniki) | **zamknięte** | `e2e/README.md:434` „scen. 94 (PU-322)”, nagłówki 85 i 94 poprawione. |
| CE-09 (liczba kroków i grup, 85) | **częściowo** | 6 kroków dokładnie (`assertNotVisible przewodnik-krok-7-pokaz`, 85:37). 9 grup tylko jako obecność, co zostało jawnie nazwane w 85:37. |
| CH-02 (rząd ≠ położenie, 103/104) | **częściowo** | 103: zamknięte. `assertNotVisible wzor-kierunek` po `wzor-zaznacz` pada, gdy znacznik zginie (`WzorPrzegladarka.tsx:99`: bez kierunku → karta), a Pokrycie PU-066 nazywa część. 104: nagłówek nazywa ograniczenie, Pokrycie nie (CK-04). |
| CH-03 (test PU-191 to lista nazw) | **zamknięte** w zakresie rekomendacji CH | Lista dozwolonych z ID, `NSPrivacyTracking`, `NSPrivacyTrackingDomains` i ATT w `app.json` oraz `targets/*/Info.plist`. Mutacje: 6 z 9 pada. Pozostałe luki: CK-03. |

## Zadania polecenia

1. **Scenariusze.** Sprawdzają wartości, nie sam render:
   - 108: linia terminu `Done by Nov 4, today 0 of 13 rows`, wiersz listy `Today: 0 of 13 rows`, „Dziś” bez celu, „Harbor” nad „Vest” mimo pracy w „Vest” dziś. Ten test rozróżnia sortowanie po terminie od sortowania po ostatniej pracy.
   - 109: tytuł, wiersz `projekt-wzor`, pusta nazwa (arkusz zostaje).
   - 90: panel `lang de`.
   - 91: przemianowanie, dwa wiersze, ✓, zakreślenie PDF.

   Wyjątki to CK-01 i CK-02. Tagi `oczekujacy` i `PU-NNN` są w każdym z 12 plików. Reguła 3 (bez dwóch akcji z rzędu bez asercji) jest zielona w `maestro-scenariusze.test.ts`. Reguła 6: CK-07. Asercji bramkowych nikt nie osłabił. Scen. 105: kontroli pozytywnej brak (CK-01).
2. **Opisy PU.** W d7642f33..6a055e8b zmieniły się tylko opisy PU-044 (Droga, Wynik, Ekran) i PU-291 (Wynik), zgodnie z `fx5-stan.md:15-16` (22f5941). W innych PU zmieniła się tylko kolumna Pokrycie (011, 044, 052, 066, 067, 071, 104, 170, 180, 191, 290, 291, 292, 296, 334). Klasy się nie zmieniły, PU jest nadal 339. **Brak P1.**
3. **`config.yaml` i `czesci.json`.** Same dopisania: 90, 91, 108, 109 w kolejności leksykalnej oraz wagi 85, 96, 99, 101–103, 105 w górę. Żaden scenariusz nie wypadł z części ani z bramki, kolejność bramkowych bez zmian. `oczekujacy` jest poza bramką (`tests/jakosc/e2e-czesci.test.ts:175-195`, `bramka-przypadki-uzycia.test.ts:68`, KO-073).
4. **Testy.**
   - PU-191: CK-03.
   - PU-011: padłby bez zapisu drugiego zdarzenia. Kolejkę chroni test M1-105. Pokrycie: CK-05.
   - Migawka PU-291: padłaby (klucze dokładne, prawdziwy kod).
   - Atrapy BX-022: tylko zmiana nazw 90/91 → 9990/9991. Asercje bez zmian (`e2e-czesci.test.ts:82-87`), test sprawdza prawdziwy `plan()`.
   - `e2e-noc`: dopisuje dokładne nazwy (CK-09 to tylko komentarz).
   - Glob: test pozytywny.
5. **Decyzje.** P-902…P-905 i P-908…P-916 (w tym P-912, P-913) są w diffie wyłącznie dopisane, starsze wiersze nietknięte. Treść zgadza się z kodem: P-902 = atrapy 9990/9991, P-903 = 99 i test reguły, P-905 = lista 25 pozycji, P-912 (b) = nagłówki 103/104, P-913 = test listy. P-912 (a) twierdzi, że 105 „sprawdza wartość”, i to prawda, ale bez kontroli pozytywnej (CK-01).

## Do sprawdzenia (pewność < 80%)

- Czy Maestro 2.12.1 na iOS widzi systemowe alerty uprawnień w hierarchii, czyli czy `assertNotVisible ".*Would Like to.*"` w 99 mógłby paść, gdyby prośba się pojawiła. Kontrola: jeden przebieg z celowo wywołaną prośbą (np. wybór zdjęcia z biblioteki przy `permissions: { all: unset }`) i `assertVisible` alertu. Do zrobienia przed zdjęciem tagu `oczekujacy` z 99.
- Czy `setOrientation` w przebiegu iOS w ogóle obraca symulator. Rozstrzygnie to kontrola z CK-01.
- 91:76-77 `selected` (hipoteza BX-040 autora): nie da się tego ocenić bez przebiegu iOS.

## Porównanie z raportami autorów (po własnej ocenie)

- CK-01: autor sam nazwał brak kontroli pozytywnej jako „ryzyko do iOS” (`bx-stan.md:185`), ale uzasadnił go błędnym odesłaniem do 103.
- CK-02: autor tego nie zauważył.
- CK-03 (c): autor ma zależności przechodnie jako P3 (`bx-stan.md:187`). Punktów (a) i (b) nie ma.
- CH-02: zgodnie z `bx-stan.md:186`. Pokrycie PU-067 bez „częściowo” autor przeoczył (CK-04).
