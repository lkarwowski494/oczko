# Stan sesji BX/BX2 (07-jakosc build, moduł e2e-mobilne) — katalog przypadków użycia, bramka KO-065, scenariusze klasy B

Aktualizacja: 2026-11-15 (BX2). Gałąź: `claude/bx-katalog-e2e-2026-11-15`. Polecenia: `origin/koordynacja:docs/koordynacja/polecenia/BX.md` (zakres, słowa właściciela), `…/BX2.md` @ df7b1ccc (zadania 1–4, P-837 wariant (a)). Historia BX: `git log -- docs/jakosc/bx-stan.md`.

## Liczby (katalog `docs/jakosc/przypadki-uzycia.md`)
- **338 PU: A=93, B=194, F=51.** B „z testem” w `tests/` (KO-071: test komponentowy/jednostkowy, klasa zostaje B): 33 (sekcja „Stany puste…” 30 + PU-016, 080, 315; P-849); B z testem Maestro `oczekujacy`: 16 (71–84); B „do zaprogramowania”: 145 — tyle czerwieni bramkę KO-065 (kontrola 2, P-837 (a)).
- Sekcja „## Funkcje”: 216 funkcji z kodu → PU (P-848); 69 funkcji bez PU dostało PU-271…PU-338 (57 B, 11 F). Sekcja „## Ekrany bez własnej trasy”: `Wzor` (martwy kod, znalezisko BX-001).
- Lista fizyczna `docs/wydanie/test-fizyczny.html`: 51 pozycji, ok. 154 min (szacunek z `MIN_KAT`, nie pomiar). Artifact z BX (41 pozycji) nieaktualny — do ponownej publikacji.
- `[DO USTALENIA]` w katalogu: 0 (8 rozstrzygniętych w kodzie, recenzja BX2 R-A-39…47).

## Zrobione w BX2
1. Recenzja niezależna (2 subagenty) → `docs/jakosc/bx-recenzja.md`: A 4×P1 / 19×P2 / 26×P3, B 69 funkcji bez PU. P1 poprawione (PU-180 F→B, PU-143/144 A→B, PU-202 opis); reguły „linia A to asercja”, „A nie tylko iPad”, sekcja „Funkcje” w `kontrolaKatalogu` i teście katalogu.
2. KO-065: zadanie `bramka-przypadki` w `testflight.yml` (bez `continue-on-error`, `if:`, flagi; `build.needs: [bramka, bramka-przypadki]`), skrypt `scripts/jakosc/bramka-przypadki-uzycia.mjs` (`bramka`, `recenzja <build>`, `katalog`), testy `tests/jakosc/bramka-przypadki-uzycia.test.ts` (czerwień przed kodem `docs/jakosc/bx2-dowod-czerwony.txt`), protokół `docs/jakosc/test-fizyczny/<N>.md`, wyjątek 1171 `wyjatki.json` (P-838), lista fizyczna: „Pomiń” z obowiązkowym uzasadnieniem, „Kopiuj wynik” w formacie protokołu (`protokolWyniku`), `lista-1-0.md` F1a (przed App Review).
3. Scenariusze B „Nawigacja”: 71–84 (PU-198, 200, 202, 205, 209, 211, 217, 219, 224, 225, 226, 228, 229, 234, 235, 236), tagi `przypadki-uzycia` + `oczekujacy` + `PU-NNN`, wagi szacowane w `e2e/czesci.json`, testID w `e2e/README.md`. Nie biegły na symulatorze (Linux).
Decyzje: P-837 (wariant (a): bramka czerwona, dopóki każdy B nie ma testu — **nie (b)**, rekomendacja BX odrzucona, KO-068), P-838, P-847, P-848 — `docs/decyzje.md`, do weta.

## Ryzyka scenariuszy 71–84 (do pierwszego przebiegu)
- 83 (PU-234): `text` na `ustawienia-miary` czyta wartość dostępności wiersza — niepotwierdzone na iOS (wzór 39:18).
- 76 (PU-211): dwa arkusze z `formularz-zapisz` w stosie — stuknięcie z tekstem.
- PU-205: kod pokazuje „Add reminder…” albo „Reminders” zależnie od planów (`src/ekrany/MenuProjektu.tsx:69-73`); scenariusz sprawdza stan bez planów.

## Jak zdjąć tag `oczekujacy`
1. Koordynator wyzwala „Jakość · iOS” na gałęzi (push ze zmianą w `e2e/**` albo `workflow_dispatch`).
2. Scenariusz „zielony”: usuń tag `oczekujacy`, w katalogu B → A, „oczekujący: plik:linia” → „plik:linia” (linia asercji), popraw „Podsumowanie”, wagę z logu do `e2e/czesci.json`.
3. „czerwony-informacyjnie”: zrzut kroku, klasyfikacja (aplikacja / scenariusz / maszyna); błąd aplikacji = znalezisko `BX-NNN` dla 08, scenariusz zostaje czerwony.

## STOP koordynatora (15.11 ok. 19:30 UTC)
Koszt 31,04 USD > próg 26 USD (pomiar koordynatora), kontekst 30%. Stan na 8f0c1424 (wypchnięty; verify w haku 7506/7506). „Jakość · iOS” na tej gałęzi wyzwolony przez koordynatora 19:24 (`workflow_dispatch`) — wynik nieodebrany. **Merge integracji `claude/youthful-pasteur-kx83sn` @ 06077b85 NIE zrobiony** (pierwszy krok następnej sesji: zwykły merge, bez rebase).

## Następny krok (07 build, start od tego pliku)
0. `git merge origin/claude/youthful-pasteur-kx83sn` (06077b85 albo nowszy); `npm ci`; push z `NODE_OPTIONS=--max-old-space-size=3072` (pierwszy push bez niego: hak czerwony, przyczyna niepotwierdzona).
1. Wynik przebiegu „Jakość · iOS” (19:24) dla scenariuszy 71–84 → zdjęcie tagów albo znaleziska.
2. Scenariusze B: sekcja „Stany puste, błędy i przerwania”, potem reszta (178 „do zaprogramowania”; testy jednostkowe/komponentowe tam, gdzie Pokrycie tak mówi — test w `tests/` wymienia ID PU i wiersz przechodzi w A).
3. P2 recenzji A: 10 pozycji F częściowo automatyzowalnych (PU-009, 010, 020, 049, 055, 062, 069, 095, 130, 140); kontrola K1 napisów przycisków (recenzja B) najpierw informacyjnie.
4. Ponowna publikacja listy fizycznej (Artifact, 51 pozycji).

## BX3 (08 build, 15.11) — stan
- Merge integracji 06077b85 (9faaf74a; konflikt tylko `docs/decyzje.md`). Recenzja kodu bramki: `bx-recenzja.md` „Kod bramki”; P1-1…3,5 poprawione (czerwień `bx3-dowod-czerwony.txt`); P1-4 poprawione (KO-071, P-850: krok „Scenariusze” = success).
- „Stany puste, błędy i przerwania”: 30 B „do zaprogramowania” → B „z testem” (P-849 po KO-071); nowe testy PU-250, 252, 254, 255, 257, 259, 266, 267, reszta to znaczniki PU przy istniejących testach. Sekcja nie ma już B „do zaprogramowania”.
- Następny krok: wynik „Jakość · iOS” 43752186631 → zdjęcie tagów `oczekujacy` (71–84); potem sekcje katalogu według „Pokrycia” (najtańszy poziom; testy w `tests/` z PU-ID w nazwie i komentarzu); P2 recenzji bramki.

## BX4 (08 build, 15.11) — stan
- Recenzja niezależna c4de9604 (runda 2): `bx-recenzja.md` „Kod bramki — runda 2”; P1 K2-1 („z testem:” pozorem), K3-1 (A tylko z E2E) i K2-2 (linia „oczekującego” = asercja) poprawione testem czerwonym najpierw (`bx4-dowod-czerwony.txt`), do tego K1-1 (SHA zadań), K1-2 (stronicowanie), P2-12 (PU ≥ 1000). Otwarte: K3-2 (A bez tagu PU w scenariuszu), P2-6/7/10/11/13, K1-3, K4-1/2. Decyzja do koordynatora (P-854): czy B „oczekujący” (16 PU) liczy się jako test dla P-837.
- Klasa B: **z testem 48** (33 + 15 w BX4: PU-027, 068, 076, 097, 127, 131, 158, 177, 179, 311, 314, 317, 324, 325, 335), „oczekujący” 16, „do zaprogramowania” 130. Nowe testy: `pu-wibracje-027`, `pu-seria-zrodlo-127-335`, `stan-danych-konto-314`, `adresy-179`; reszta to znaczniki PU przy istniejących testach i jedna asercja dopisana w `icloud-stan-danych` (PU-097).
- Nie do poziomu poniżej symulatora (do decyzji, propozycja F/częściowo): PU-149 („dwa palce przewijają” to natywny PencilKit; testowalna jest tylko polityka płótna, `tests/domena/wzor/uklad-rysik.test.ts`).
- Wynik „Jakość · iOS” 43752186631 dla scenariuszy 71–84: nieodebrany (koordynator poda wynik) — tagi `oczekujacy` bez zmian.
- KO-073/P-855: B „oczekujący” nie zalicza PU (kontrola 2 czerwona dla 16 PU 71–84 do zdjęcia tagów po zielonym przebiegu). KO-074/P-856: PU-149 podzielony, nowy PU-339 (F). Katalog: 339 PU (A=93, B=194, F=52); B: z testem 49 (z PU-149), „oczekujący” 16, „do zaprogramowania” 129; lista fizyczna 52 pozycje (ponowna publikacja Artifact — niewykonana).

## BX5 (08 build, 15.11) — stan
- Start 672a22f9; baza testów 620 zestawów / 7572 testów, 0 padających. Porcja 1 (zadanie 2): **85 PU B „do zaprogramowania” → „z testem”** (P-859): 134 B z testem, 16 „oczekujący”, 44 „do zaprogramowania” (katalog 339 PU: A=93, B=194, F=52). Nowe testy: 51 plików `tests/ekrany/*.test.tsx` + `tests/dane/pu-migracja-003.test.ts` i dopiski w istniejących; każdy sprawdzony mutacją asercji (pada) w raportach podagentów. Test zalicza PU tylko, gdy pokrywa cały „Oczekiwany wynik”.
- Zostają „do zaprogramowania” z powodem: Maestro/F bez odpowiednika w jest — gesty, obrót, restart procesu, zrzuty, okna systemowe, natywne widoki (PU-008, 011, 012, 052, 057, 066, 071, 104, 107–109, 112, 134, 135, 137–139, 143, 144, 146–148, 150, 153, 162, 165, 168, 170, 175, 180, 191, 288, 292, 296, 336, 333 Swift). Częściowo: PU-110, 113 (powrót modelowany mockiem), PU-290, 291, 322.
- Poprawki opisu katalogu (P-860): PU-017, 273, 295, 302.
- **Znaleziska** (kod albo opis wbrew kodowi; wiersze zostają „do zaprogramowania”):
  - BX-002 (PU-067, aplikacja): po „Add note” → „Save” chip notatki nie pojawia się na wzorze do ponownego otwarcia (baza ma notatkę); `naNotatka` w `src/ekrany/WzorAkcje.ts:27` nie woła `wczytaj(widok.wzorId)` (jak `naZmienNotatke`/`naUsunNotatke`, linie 25–26). Realny, widoczny dla użytkownika; poprawka `src/` poza zakresem BX5.
  - BX-003 (PU-334): opis oczekuje `"jezyk":"de"` w stanie zegarka; `StanZegarka = StanEkranuBlokady` (`src/domena/porty.ts:46–47`) nie ma pola `jezyk` (jest tylko w Live Activity, `modules/oczko-reguly/Sources/OczkoReguly/StanAktywnosci.swift:2,10`). Poprawić PU albo dopisać pole.
  - BX-004 (PU-322, atrapa E2E): `e2e-sklep-wygas` (`src/platforma/sklep-sztuczny.ts:53–55`) wygasza także zakup dożywotni; opis PU („nie wyłącza Pro”) byłby fałszywy.
  - BX-005 (PU-290): nagłówek listy wzorów „Patterns in …” (`wzor.przelacz_naglowek`) nie jest renderowany (`src/ekrany/WzorMenu.tsx:30`). Ekran albo opis do poprawy.
  - BX-006 (PU-291): „nazwa w kroku Udostępnij” — migawka niesie tylko liczbę wzorów (`src/przypadki-uzycia/migawka.ts:17-20`). Opis do poprawy.
  - BX-007 (PU-044): linia „Done by …, today 0 of N rows” jest na ekranie projektu, nie na karcie „Dziś”. Opis do poprawy.
  - Drobne (bez BX): PU-026/033 nazywają arkusz „What the number shows”, aplikacja ma tytuł „The big number shows”.
- Niezrobione w tej porcji: zadanie 1 (wynik „Jakość · iOS” run 43752186631 — koordynator nie podał wyniku, tagi `oczekujacy` bez zmian); zadanie 3 (P2 recenzji: K3-2 dopisuje tagi do `e2e/**` i wyzwoli „Jakość · iOS” — czeka na zgodę koordynatora; reszta po porcji). Zadanie 4 (lista fizyczna): `node scripts/wydanie/test-fizyczny.mjs --check` → zgodna z katalogiem (52 pozycje, ok. 157 min), bez zmiany pliku; publikacja Artifact po stronie koordynatora. Zadanie 3 (P2 recenzji): nie ruszone — K3-2 wymaga e2e/**, reszta (P2-6/7/10/11/13, K1-3, K4-1/2) dotyka `scripts/jakosc/` i `testflight.yml` (ścieżka wrażliwa: wymaga przeglądu nowego subagenta) — następna sesja.
- Maestro (44 PU „do zaprogramowania” + 16 „oczekujących”) — dopiero po zielonym przebiegu A; wypis powyżej.

## BX6 (08 build, 15.11) — stan
- Start 7d034b0c (lokalny HEAD był a1874ae8: fast-forward). Push 1: ee0b5bdc; verify w haku pre-push 672 zestawy / 7662 testów, 0 padających (baza BX5: 620 / 7572).
- Zadanie 1 (wynik „Jakość · iOS” 43752186631, 8f0c1424): zielone → tag `oczekujacy` zdjęty z scenariuszy 71–80, 82, 84, 14 PU B→A (PU-198, 200, 202, 205, 209, 211, 217, 219, 224, 225, 226, 229, 235, 236); katalog **339 PU: A=107, B=180, F=52**; B: z testem 134, „oczekujący” 2 (PU-228, PU-234), „do zaprogramowania” 44. Wagi w `e2e/czesci.json` z pomiaru. P-861.
- Znaleziska z iOS (zrzuty i hierarchie z artefaktów; P-862, do sesji fix wg KO-076):
  - BX-008 (PU-234, aplikacja, realny): po wyborze „Imperial” wiersz „Units” w Ustawieniach pokazuje stare „Automatic” — `app/ustawienia.tsx:43` migawka w `useState`, `useFocusEffect` `:52-61` jej nie odświeża po powrocie z `/miary` (`app/miary.tsx:19-22`); zapis w bazie się udaje. Poprawka: w `useFocusEffect` `ustawPref({ ...preferencje.stan() })`; test czerwony najpierw.
  - BX-009 (PU-228, aplikacja, realny): „Close” podglądu zdjęcia pod paskiem stanu (zrzut kroku 48 nakłada się na baterię), `app/zdjecie.tsx:36` bez `Bezpieczny`, `src/ekrany/Zdjecia.tsx:66`; poprzednik tego samego błędu: komentarz `src/kompozycja/Bezpieczny.tsx:1-3` (E2E 40290477970). Opcje naprawy: (a) `Bezpieczny` z czarnym tłem (nowy wariant — rola 04), (b) `useSafeAreaInsets()` w `PodgladZdjec` z czarnym tłem zachowanym. Rekomendacja (b), bez zmiany systemu wyglądu.
  - BX-010 (P-190, bramkowy 39, scenariusz — hipoteza): po restarcie stuknięcie `ustawienia-jezyk` nie otwiera ekranu Język (zrzut kroku 61 = Ustawienia przewinięte do końca; 2×); w `src/` brak przyczyny. Poprawiony scenariusz 39 (`waitForAnimationToEnd`, `retryTapIfNoChange: true`, oczekiwanie na `jezyk`); **niepotwierdzone do przebiegu iOS** — jeśli nadal czerwony: zrzut kroku po stuknięciu, hierarchia, ewentualnie asercja `ustawienia` przed stuknięciem.
- Zadanie 3 (K3-2): 93 tagi `PU-NNN` w 70 scenariuszach (107 PU klasy A, 14 miało tag); `kontrolaKatalogu` wymaga tagu PU (dokładne dopasowanie) w scenariuszu z Pokrycia, testy „BX6 K3-2” (czerwień `bx6-dowod-czerwony.txt`). Odnośniki plik:linia katalogu przeliczone skryptem różnic po wstawieniu tagów (raporty historyczne bez zmian). P-863.
- Zadanie 4: PU-110, 113, 290, 291, 322 zostają do Maestro (P-864).
- Do zrobienia po przebiegu iOS (wyzwala koordynator): 39 (potwierdzenie BX-010), nowe tagi `PU-NNN` nie zmieniają zachowania scenariuszy.
- Zadanie 2 (recenzja BX5, 1 subagent): P1 0, P2 3, P3 17 — `bx-recenzja.md` „BX5 — recenzja”. PU-324 (P2) poprawione testem; otwarte P2: PU-171 (napis Ofert taki sam w pl i en), PU-310 (kafel „czas”); P3: 17 PU, bez zmiany klasy. Katalog bez zmian po recenzji (0 P1).

## FX (08 fix, 15.11) — stan
- Start 4edb7448 (lokalny HEAD był a1874ae8: fast-forward). Baza `npm test` 672 zestawy / 7662 testów, 0 padających na kodzie bez poprawek. Znaleziska zatwierdzone przez koordynatora (P-087, KO-076): BX-002, BX-008, BX-009 — wszystkie rodzaj **D**; osobny commit i test czerwony najpierw każde (`docs/jakosc/fx-dowod-czerwony.txt`).
- **BX-008** (PU-234): `app/ustawienia.tsx` — `useFocusEffect` czyta `preferencje.stan()` i podmienia migawkę tylko przy zmianie wartości (wersja bezwarunkowa psuła czas efektów: `tests/ekrany/preferencje-trasa.test.tsx` 004 dostał ostrzeżenie `act`). Test `tests/ekrany/ustawienia-powrot-miary-bx008.test.tsx:46`.
- **BX-002** (PU-067): `src/ekrany/WzorAkcje.ts` — `naNotatka` po udanym zapisie woła `wczytaj(widok.wzorId)`. Test `tests/ekrany/wzor-notatka-dodaj-bx002.test.tsx:49` (trasa `/wzor` na prawdziwej bazie, znacznik ustawiony domyślnie).
- **BX-009** (PU-228): `app/zdjecie.tsx` — stan wczytany i błąd odczytu w `SafeAreaView` na `systemCzarny.tlo` (bez nowego wyglądu; analogii w Treningu nie znaleziono). Test `tests/ekrany/zdjecie-bezpieczny-obszar-bx009.test.tsx:57, :66` (atrapa `SafeAreaView` dokłada wcięcia urządzenia; Jest nie liczy natywnych wcięć). Pozostałe trasy bez `Bezpieczny` to arkusze `modal` (iOS sam je odsuwa), jedyna `fullScreenModal` to `zdjecie`.
- Scenariusze 81 (PU-228) i 83 (PU-234): tag `oczekujacy` **zostaje** do zielonego iOS; po zielonym przebiegu: zdjąć tag, PU-228 i PU-234 B → A (katalog 339 PU: A=109, B=178).
- Recenzja K3-2: `bx-recenzja.md` „K3-2 — recenzja FX” (P1 0).
- **Nowe znaleziska** (BX-011 i BX-012 zatwierdzone przez koordynatora jako KO-077 i KO-078 i naprawione w tej samej sesji, patrz niżej; treść poniżej to opis z chwili zgłoszenia):
  - **BX-011** (PU-067, aplikacja, realny, rodzaj D): `naNotatka` zapisuje `widok.znacznik.rzad` (rząd **schematu**), a `notatka_rzedu.rzad` ma być rzędem **licznika** (`rzadNotatki` = licznik+1, `src/domena/znacznik-wzoru.ts:13`, `:32`). Zgodne tylko przy znaczniku ustawionym domyślnie (`domyslnyRzadBazowy`); po przeniesieniu znacznika na inny rząd schematu notatka ląduje w bazie, ale `chipyNotatek` (`src/domena/znacznik-wzoru.ts:42-45`) jej nie pokazuje (obserwacja z BX-002: rząd 6 w bazie, 0 chipów po odświeżeniu, schemat 6 przy liczniku 45). Test `tests/ekrany/wzor-akcje-167.test.ts` utrwala obecne zachowanie („ze znacznikiem: rząd znacznika”) — do zmiany razem z poprawką. Opcje: (a) `naNotatka` zapisuje `rzadNotatki` z widoku (znacznik niesie licznik+1) — poprawka lokalna, zmiana testu 167; (b) `dodajNotatkeWzoru` przelicza rząd schematu na rząd licznika — dotyka przypadku użycia i danych. Rekomendacja (a). Notatki już zapisane z rzędem schematu: migracji nie da się wywnioskować bez znacznika z chwili zapisu (P0-P1 dla danych: tylko właściciel, P-070).
  - **BX-012** (bramka, P2, brzegowy): parser `tagiScenariusza` (`scripts/jakosc/bramka-przypadki-uzycia.mjs:80`) zwraca `[]` przy komentarzu w bloku `tags:`, CRLF, `tags: [..]`, liście bez wcięcia; kontrola `oczekujacy` (`:176`) i `ipad` (`:187`) wtedy nie zadziała (dziś 0 trafień w `e2e/scenariusze`). Ścieżka wrażliwa (workflow/bramka): poprawka z testem i przeglądem subagenta w osobnej sesji.
- **KO-077 / BX-011 naprawione** (opcja a): `src/przypadki-uzycia/wzor-widok.ts` niesie w `znacznik` pole `rzadNotatki` (z `polozenieZnacznika`), `src/ekrany/WzorAkcje.ts` zapisuje je jako rząd notatki (przed schematem: licznik + 1). Testy: `tests/ekrany/wzor-notatka-dodaj-bx002.test.tsx:67` (znacznik przeniesiony: rząd 46 w bazie, chip „Row 6: …”), `tests/ekrany/wzor-akcje-167.test.ts:48, :54`. Zmienione istniejące testy z powodem: 167 (utrwalał rząd schematu) i `tests/dane/wzor-widok.test.ts:19` (nowe pole). Notatek już zapisanych z rzędem schematu nie migrujemy (dane tylko właściciela, P-070).
- **KO-078 / BX-012 naprawione:** `tagiScenariusza` (`scripts/jakosc/bramka-przypadki-uzycia.mjs:80`) liczy tagi mimo komentarza i pustej linii w bloku, CRLF, `tags: [..]` i listy bez wcięcia; testy `tests/jakosc/bramka-przypadki-uzycia.test.ts` „BX-012” (4 czerwone przed poprawką; „tylko zaostrzenie” na wszystkich scenariuszach z repo). **Przegląd subagentem ścieżki wrażliwej nieodbyty** (zakaz koordynatora): `docs/jakosc/fx-przeglad-bx012.md`, P-873.

## FX3 (08 fix, 16.11) — stan
- Start f562da5b (lokalny HEAD był a1874ae8: fast-forward). Przebieg „Jakość · iOS” 43774048947. Znaleziska zatwierdzone przez koordynatora (P-087, KO-081/KO-082): BX-018, BX-010, BX-009 + zadanie 4. Dowody czerwieni: `docs/jakosc/fx3-dowod-czerwony.txt`. Decyzje P-877…P-880.
- **BX-018** (scenariusz 61): regresja zamierzona BY-002 — wiersz kopii „Now working row 1”; asercja 61:61 zmieniona (zgoda KO-082), aplikacja bez zmian.
- **BX-010** (scenariusz 39): `scroll` przed stuknięciem „Język” (środek wiersza poza ScrollView; wcześniejszy opis „przewinięte do końca” był błędny — pasek 81%).
- **BX-009** (podgląd zdjęcia): `useSafeAreaInsets` zamiast natywnego `SafeAreaView` (fullScreenModal poza drzewem dostawcy). Scenariusz 81 z tagiem `oczekujacy` do zielonego przebiegu.
- Zadanie 4: 83 zielony → tag zdjęty, PU-234 → A (A=108, B=179, F=52); B „oczekujący”: tylko PU-228.
- Do potwierdzenia: nowy przebieg „Jakość · iOS” (wyzwala koordynator) — 61, 39 (część 1), 81.

## FX4 (08 fix, 16.11) — stan
- Start f3b3a8cb (lokalny HEAD był a1874ae8: fast-forward). Wejście: przebieg „Jakość · iOS” 43788927541 (czerwone: 22 część 4, 45 część 2; 39, 61, 81, 83 zielone). Decyzje KO-083/KO-084, P-881…P-883.
- **BX-020** (scenariusz 45, część 2, krok 38/38) = (c) niestabilność symulatora: `swipeV2` 17 s (03:33:53,7 → 03:34:11,0) dla gestu 0,6 s; mediana stuknięcia 4,98 s wobec 1,56 s w zielonym 43774048947; start aplikacji 39 s wobec 16 s; jedyny taki postój w logach części 2 i 4 poza scenariuszem 28 (10,1 s). Kod trasy `/wzor` bez zmian w zakresie f562da5b..f3b3a8cb. Bez zmian w kodzie i asercjach.
- **BX-019** (scenariusz 22, część 4, krok 32/32) — przyczyna nieustalona z artefaktów. Fakty: maszyna zdrowa (start 24,6 s, mediana stuknięcia 1,98 s); stuknięcie w środek `licznik-wzor` (125,608; 0,34 s) doszło do UIKit; `/wzor` nie powstał przez 17,7 s; zrzut po stuknięciu bajt w bajt jak przed; zielony 43774048947: ta sama asercja po 2,7 s. Hipotezy bez dowodu: (1) przemontowanie `EkranLicznika` (`key={wersja}`) w chwili stuknięcia; (2) nachodzenie panelu E2E `e2e-zegarek-stan` [20,583][382,616] na `licznik-wzor` [91,576][159,640] po załadowaniu projektu (2 linie tekstu).
- Diagnostyka B (KO-084): panel `e2e-nawigacje` tylko w buildzie E2E; „pattern presses: 0” po porażce = stuknięcie nie dotarło do `onPress` (hipotezy 1–2; „mounts” > 1 rozstrzyga 1), „presses: 1” = push wywołany i ekran nie powstał. Scenariusz 22 bez zmian (asercje nietknięte, bez dopisanego kroku odczytu): hierarchia kroku porażki zapisuje się w artefakcie i zawiera panel `e2e-nawigacje` (jak `e2e-zegarek-stan` w kroku 32 przebiegu 43788927541).
- Zadanie 2: 81 zielony → tag zdjęty, PU-228 B → A (A=109, B=178, F=52). `e2e/czesci.json` bez zmian (przydział części zostaje jak w 43788927541 dla porównania diagnostyki 22).
- Do potwierdzenia: nowy przebieg „Jakość · iOS” (wyzwala koordynator) na nowym SHA — odczyt `e2e-nawigacje` z hierarchii kroku porażki 22 (jeśli znów padnie); 81 w bramce.

## BX7 (08-programista build, 2026-11-16; polecenie `origin/koordynacja:docs/koordynacja/polecenia/BX7.md` @ a1af41d9)
Lista: 44 PU klasy B „do zaprogramowania” (skrypt `kontrolaKatalogu(root, { wymagajTestowB: true })` daje 44 komunikatów „klasa B bez testu”; `grep "^| PU-.*do zaprogramowania"` — 44; zgodne). Podział na 3 porcje według ekranu i wspólnego przygotowania stanu (scenariusze od numeru 85, tagi `oczekujacy`, `przypadki-uzycia`, `PU-NNN`):

| Porcja | Zakres | PU (liczba) |
|---|---|---|
| 1 | przewodnik (`przewodnik-*`, wzór scen. 69, 70), „Dziś”/lista projektów, Ustawienia i oferty, licznik (gesty, stoper), klawiatura, zegarek-atrapa | 044, 052, 104, 107, 108, 109, 110, 112, 113, 165, 168, 170, 180, 322, 334 (15) |
| 2 | wzór na iPhonie (zakreślenia, znaczniki, nazwy, przełączanie, kosz), zdjęcie, orientacja, start, brak reklam i śledzenia; PU-333 to test Swift (`jednostkowy`, nie Maestro) | 008, 011, 057, 066, 067, 071, 162, 191, 288, 290, 291, 292, 296, 333 (14) |
| 3 | iPad (pakiet `ipad`: wzór, pióro, okno 375, przewodnik, kolumna) i wygląd (AX5, tryb ciemny, języki de/ja, zrzuty do porównania) | 012, 134, 135, 137, 138, 139, 143, 144, 146, 147, 148, 150, 153, 175, 336 (15) |

Pułapki z lektury katalogu (przed pierwszą linią scenariusza): PU-134/135/137/139/175 wymagają porównania zrzutów ze wzorcami (`docs/design/wzorce-zrzuty/`) — do sprawdzenia, czy interpreter i Maestro mają taką asercję (porcja 3); PU-162 i PU-153 to pomiary czasu (grupa `pomiar`, bez progu); PU-333 jest Swiftem, nie scenariuszem.
