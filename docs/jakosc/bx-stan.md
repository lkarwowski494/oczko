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
