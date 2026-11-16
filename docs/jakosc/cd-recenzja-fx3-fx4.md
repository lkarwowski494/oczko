# Audyt: Programista — Oczko — recenzja niezależna FX3 + FX4 (sesja CD) — 2026-11-16
Commit: 7fbb5b94 (zakres f562da5b..7fbb5b94, 9 commitów, 28 plików) · Tryb: audit (rola 08, polecenie koordynatora `docs/koordynacja/polecenia/CD.md` @ ae04610c) · Środowisko: Linux, Node 22.23.4, `npm ci` kod 0; Jest, typecheck i eksport iOS (`expo export`) działają; symulatora iOS, Maestro i Xcode brak — scenariusze oceniane z kodu, interpretera `tests/jakosc/maestro-runner.ts` i metadanych przebiegów (bez pobierania logów).

Pliki dowodów: `docs/jakosc/cd-recenzja-fx3-fx4/dowody/` (wynik komendy z kodem wyjścia), mutacje sond: `docs/jakosc/cd-recenzja-fx3-fx4/mutacje/` (skrypty Node jako `.txt`; stosowane na kopii `git worktree` w scratchpadzie, nigdy w repo). Raportów autora (`docs/jakosc/fx3-dowod-czerwony.txt`, sekcje FX3/FX4 w `docs/jakosc/bx-stan.md`) nie czytałem przed własną oceną; do `bx-stan.md` zajrzałem dopiero przy znalezisku 001.

## Podsumowanie
**Werdykt: Z UWAGAMI — można scalić z integracją.** Zmiany robią to, co deklarują, i niczego nie osłabiają. Panel `e2e-nawigacje` nie istnieje poza buildem E2E: sprawdziłem to eksportem wydania i trzema mutacjami, a zachowanie „Wzór” → `/wzor` się nie zmieniło. Poprawka BX-009 (hook zamiast natywnego `SafeAreaView`) jest właściwa dla `fullScreenModal`. Mechanizm sprawdziłem w kodzie biblioteki, a scenariusz 81 przeszedł na SHA z poprawką. Atrapa wcięć w 5 testach tras daje to samo, co daje korzeń ExpoRoot, i nie zmienia asercji. Test P-855 na kopii katalogu ma tę samą siłę: mutacja reguły daje czerwień z właściwego powodu. Na prawdziwym katalogu bramka nadal ma kontrolę 2 (z wymogiem testów B) i osobną regułę „A ze scenariuszem `oczekujacy`”. Liczby katalogu A 109 / B 178 / F 52 zgadzają się ze skryptem. Jedyna uwaga merytoryczna (P2) dotyczy odczytu diagnostyki BX-019: reguła „mounts > 1 rozstrzyga hipotezę 1” nie ma linii bazowej.

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P2 | D | Reguła odczytu panelu BX-019 „mounts > 1 rozstrzyga hipotezę 1” bez linii bazowej montaży przed stuknięciem | otwarte |
| 08-programista-002 | P3 | D | Komentarze nie nadążają: `_opis` w `e2e/czesci.json` (waga 83 to już pomiar) i „do końca listy” w scenariuszu 39 | otwarte |
| 08-programista-003 | P3 | D | Test wydania BX-019 nie wykrywa bezwarunkowego importu `zliczNawigacje` (wykrywa go dopiero eksport wydania, poza verify) | otwarte |

Skala poziomów w tej recenzji według polecenia koordynatora: P1/P2/P3 (P3 = szlif). P0/P1: brak.

## Linia bazowa i założenia
Obszar to diff nocnych poprawek, a nie cała aplikacja, więc linię bazową zawęziłem do pytań z polecenia CD i do wymiarów roli, których ten diff dotyka.

| Wymiar pokrycia | Wynik |
|---|---|
| Ścieżki zapisu | sprawdzone, brak: diff nie zmienia zapisu danych (`app/zdjecie.tsx` zmienia tylko kontener widoku, `app/licznik.tsx` tylko zdarzenie „Wzór”) |
| Obsługa błędów | sprawdzone: ścieżka błędu odczytu `/zdjecie` nadal ma test wcięć (`tests/ekrany/zdjecie-bezpieczny-obszar-bx009.test.tsx:65-70`) i test M1-007 (`tests/ekrany/blad-odczytu-trasy.test.tsx`) |
| Typy na granicach | sprawdzone, brak: nowe dane z zewnątrz nie dochodzą; typecheck kod 0 (`dowody/testy-scenariusze-typy.txt`) |
| System projektowy | sprawdzone: `app/zdjecie.tsx:25` tło z tokenu `systemCzarny.tlo`, bez nowego koloru; panel E2E bez `t()` jak pozostałe panele (P-238) |
| Teksty przez i18n | nie dotyczy: panel E2E jest poza wydaniem (dowód eksportu niżej) |
| Wydajność | sprawdzone, brak: `useSyncExternalStore` z niezmiennym snapshotem modułu, panel tylko w buildzie E2E |
| Testy na właściwym poziomie | sprawdzone: 10 sond mutacyjnych (tabela „Pokrycie”) |
| Dostępność | sprawdzone, brak zmian: `zdjecie-zamknij` i `zdjecie-udostepnij` bez zmian etykiet |
| Liczby konfiguracyjne | sprawdzone: waga 83 w `e2e/czesci.json:90` to pomiar (86 s); wagi tylko równoważą części (`scripts/ci/e2e-czesci.mjs:42` bierze scenariusze z katalogu, nie z wag) |

Soczewki (po kolei, bez subagentów): recenzent szukający ścieżki bez testu (sondy mutacyjne), programista czytający moduł pierwszy raz (czy komentarze mówią prawdę: znalezisko 002), osoba diagnozująca BX-019 (czy panel rozstrzyga hipotezy: znalezisko 001).

Wzorzec najlepszych w klasie dla poprawki diagnostycznej: zero zmian w wydaniu, a reguła odczytu ustalona z góry, z linią bazową. Pierwszy warunek jest spełniony, drugi częściowo (001). Zmian w rejestrze założeń nie proponuję.

## Pokrycie (co sprawdzono, czego nie)
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| Panel BX-019 w wydaniu: render | tak | mutacje m1a (panel bez warunku), m1b (`paneleE2e` zawsze) → test wydania czerwony na `toBeNull` (`dowody/sonda-m1a.txt`, `dowody/sonda-m1b.txt`) |
| Panel BX-019: zachowanie „Wzór” | tak | mutacja m1c (bez `router.push`) → czerwony na `toHaveBeenCalledWith('/wzor')` (`dowody/sonda-m1c.txt`) |
| Panel BX-019 w wydaniu: efekt uboczny / bundel | tak | eksport wydania na 7fbb5b94 kod 0 (`dowody/slady-wydania-baza.txt`); mutacja m1d (bezwarunkowy import `zliczNawigacje`): Jest zielony (`dowody/sonda-m1d.txt`), eksport wydania kod 1, „ślad … e2e-” (`dowody/slady-wydania-m1d.txt`) |
| `app/zdjecie.tsx` BX-009 | tak | m2a (powrót do `SafeAreaView`) i m2c (bez `paddingTop`) → BX-009 czerwony, „Expected: >= 59, Received: 0” (`dowody/sonda-m2a.txt`, `dowody/sonda-m2c.txt`); źródło biblioteki `RNCSafeAreaViewComponentView.mm` `findNearestProvider` (bez dostawcy zwraca `self`) i `ExpoRoot.js` (`SafeAreaProvider` w korzeniu) |
| BX-014 bez regresu | tak | m2b (dodane wcięcia boczne) → BX-014 czerwony (`dowody/sonda-m2b.txt`) |
| Atrapa `safe-area-zero` w 5 testach tras | tak | m2d (usunięta atrapa w `blad-odczytu-trasy`) → 2 testy `/zdjecie` czerwone, bo hook nie ma dostawcy (`dowody/sonda-m2d.txt`); diff: w każdym z 5 plików +1 linia `jest.mock`, asercje bez zmian |
| Scenariusze 39, 61, 81, 83, `maestro-runner.ts`, `e2e/czesci.json` | tak (statycznie) | diff; testy scenariuszy i interpretera: 28 plików, 438 testów, kod 0 (`dowody/testy-scenariusze-typy.txt`); SHA przebiegów z API Actions (bez logów) |
| Bramka P-855 (ścieżka wrażliwa) | tak | m4a (reguła P-855 wyłączona) → test na kopii czerwony, „Expected [PU-228], Received []” (`dowody/sonda-m4a.txt`); m4c (tag `oczekujacy` w prawdziwym 81 przy klasie A) → test „na bieżącym repo” czerwony (`dowody/sonda-m4c.txt`) |
| Katalog i decyzje | tak | `bramka-przypadki-uzycia.mjs katalog` kod 0, liczenie wierszy, kontrola 2 z wymogiem testów B: 44 błędy, wszystkie „B bez testu”, 0 „oczekujący” (`dowody/bramka-katalog.txt`); `git diff --numstat docs/decyzje.md`: 7 dodanych, 0 usuniętych linii |
| Zmienione testy razem | tak | 14 plików, 212 testów, kod 0 (`dowody/testy-zmienione.txt`) |
| Zachowanie na urządzeniu / symulatorze | **nie** | brak macOS; wyniki 39, 61, 81, 83 w 43788927541 znam tylko z opisów commitów i `bx-stan.md`, logów nie pobierałem (zakaz polecenia) |
| Pełny `npm run verify` | **nie** (zakaz polecenia) | przejdzie przez hak przed pushem tej recenzji |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/jakosc/cd-recenzja-fx3-fx4.md . docs/jakosc/cd-recenzja-fx3-fx4 --rola 08-programista` (kopia skryptu w scratchpadzie) → „OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista”, kod 0. W plikach dowodów ścieżki scratchpadu zastąpione znacznikami `<scratchpad>` i `<kopia@7fbb5b94>`.

## Stosowalność listy kontrolnej
| Pozycja | Status | Wynik |
|---|---|---|
| DEV-01 | dotyczy (BX-019 to czysty licznik stanu) | ok: 4 testy w `tests/ekrany/e2e-nawigacje-stan-bx019.test.tsx` |
| DEV-02 | dotyczy | ok: 9/9 commitów zmieniających zachowanie albo scenariusz ma test w tym samym commicie albo wcześniejszym (6cd64293 + b318c94d: `e2e-39-jezyk-dolny-brzeg-bx010`; 886e9bea + ade49db7: BX-009; f6c655f5: `czesc-nazwa-zapasowa-by002` z 476abe53; 7fbb5b94: oba testy BX-019; aecd6c3e i 7fbb5b94: P-855 na kopii). Dowód czerwieni BX-009 przed hookiem: moja mutacja m2a |
| DEV-03 | dotyczy | ok: asercje nieosłabione (sekcja „Co działa dobrze”); brak `.skip`/`.only` w diffie |
| DEV-04 | dotyczy | ok: typecheck i typecheck:testy kod 0, testy celowane kod 0; pełny verify — w haku pushu |
| DEV-05, DEV-06 | nie dotyczy | diff bez zapisu danych i migracji |
| DEV-07, DEV-08, DEV-09 | nie dotyczy | brak danych z zewnątrz, dat i parsowania w diffie |
| DEV-10 | nie dotyczy | brak nowej obsługi błędów |
| DEV-11 | dotyczy (`app/zdjecie.tsx`) | ok: kolor z tokenu, wcięcia z hooka zamiast liczb |
| DEV-12 | nie dotyczy | panel E2E poza wydaniem (P-238); `zdjecie.tsx` bez nowych tekstów |
| DEV-13 | dotyczy (`e2e/czesci.json`) | uwaga: 08-programista-002 (komentarz, nie liczba) |
| DEV-14 | dotyczy | ok: diff bez sekretów; `git diff --cached` przejrzany przed commitem |
| DEV-15 | dotyczy (subskrypcja panelu) | ok: `subskrybuj` zwraca funkcję wypisania (`src/kompozycja/e2e/nawigacje-stan.tsx:14`) |
| DEV-16 | nie dotyczy | brak wartości z jednostką poza wagą w sekundach (`wagi_s`) |

## Znaleziska (szczegóły)

### 08-programista-001 · Reguła odczytu panelu BX-019 „mounts > 1 rozstrzyga hipotezę 1” bez linii bazowej montaży przed stuknięciem
- Pozycja listy kontrolnej: DEV-01
- Poziom: P2 · Realność: realny (dotyczy diagnozy BX-019, nie użytkownika) · Pewność: średnia
- Rodzaj: D
- Dowód: licznik `montaze` żyje w module przez cały proces i nie zeruje się przy wejściu na ekran (`src/kompozycja/e2e/nawigacje-stan.tsx`, linie 11 i 23). Rośnie przy każdym montażu panelu: przy pierwszym wejściu na licznik, przy każdym `key={wersja}` (`app/licznik.tsx`, linia 55) i przy każdym ponownym wejściu na trasę. Ekran podnosi `wersja` w sześciu miejscach (`app/licznik.tsx` linie 37, 39, 41, 42, 49, 70). Test `tests/ekrany/e2e-nawigacje-stan-bx019.test.tsx:51-55` („po otwarciu: 0 naciśnięć „Wzór”, 1 montaż ekranu licznika”) biegnie z atrapą `useFocusEffect: () => undefined` (`:18`), więc nie mówi, ile montaży będzie na symulatorze po podprzepływie `projekt-roboczy` (+1, −1) w scenariuszu 22. Tymczasem zapis stanu przyjmuje (`docs/jakosc/bx-stan.md:101`): „„mounts” > 1 rozstrzyga 1”.
- Mechanizm: wartość bezwzględna licznika skumulowanego jest odczytywana jak przyrost w chwili stuknięcia. `grep -n "ustawWersje" app/licznik.tsx` → 7 trafień (6 podnosi `wersja`, 1 to deklaracja stanu).
- Powraca: nie
- Wzorzec lub źródło: zasada wspólna 2 (dowód zamiast deklaracji); reguła odczytu diagnostyki ustalona przed przebiegiem.
- Kroki w aplikacji: build E2E, scenariusz 22 czerwony na kroku 32. Hierarchia pokaże np. „mounts: 2”. Bez linii bazowej nie wiadomo, czy drugi montaż nastąpił w chwili stuknięcia (hipoteza 1), czy wcześniej (np. focus po starcie).
- Opcje: (a) linia bazowa z istniejącego zrzutu `22-licznik-przed-wzorem` (`e2e/scenariusze/22-br-wzr-002-s1-zdjecie-strony.yaml:20`), jeśli panel jest na nim widoczny, oraz reguła «przyrost montaży między zrzutem a hierarchią porażki». Koszt: zero zmian w kodzie i scenariuszu; ryzyko: panel może leżeć pod strefą akcji i nie być widoczny na zrzucie. (b) Panel zapisuje też liczbę montaży w chwili ostatniego naciśnięcia («mounts at last press: M0»). Wtedy hierarchia porażki sama daje przyrost. Koszt: mała zmiana kodu E2E i testu, nowy build E2E. (c) Bez zmian w kodzie: poprawić tylko regułę w `bx-stan.md` na «mounts > N, gdzie N z zielonego przebiegu». Wada: zielony przebieg nie zapisuje hierarchii, więc N trzeba ustalić osobno.
- Rekomendacja: (a) na najbliższy przebieg, bo nie wymaga zmian. Jeśli panelu nie widać na zrzucie, to (b) w następnym FX.
- Test akceptacyjny: reguła odczytu w `bx-stan.md` mówi o przyroście względem stanu sprzed stuknięcia i wskazuje źródło linii bazowej. Dla (b) dodatkowo test RNTL: naciśnięcie zapisuje bieżące `montaze`.
- Status: otwarte

### 08-programista-002 · Komentarze nie nadążają: `_opis` w `e2e/czesci.json` (waga 83 to już pomiar) i „do końca listy” w scenariuszu 39
- Pozycja listy kontrolnej: DEV-13
- Poziom: P3 · Realność: teoretyczny (nic nie liczy inaczej; myli czytającego) · Pewność: wysoka
- Rodzaj: D
- Dowód: `e2e/czesci.json:1` kończy się zdaniem „wagi 81 i 83 (oba [Failed]) oraz 39 zostają szacunkiem”. Tymczasem `e2e/czesci.json` w linii 90 ma dla 83 wartość 86 z pomiaru 43774048947 (P-880). `e2e/scenariusze/39-p-190-jezyk-trwaly.yaml:24` mówi „jeszcze jedno przewinięcie do końca listy”, a interpreter wykonuje jedno przewinięcie (`tests/jakosc/maestro-runner.ts:273`, „jedno przewinięcie w dół”). Sam autor w `bx-stan.md` nazywa opis «przewinięte do końca» błędnym (pasek 81%).
- Mechanizm: komentarze nie były aktualizowane razem ze zmianą wartości. `grep -n "zostają szacunkiem" e2e/czesci.json` → 1 trafienie; `grep -n "do końca listy" e2e/scenariusze/39-*.yaml` → 1 trafienie.
- Powraca: nie
- Wzorzec lub źródło: zasada wspólna 17 (zdanie o dwóch odczytaniach przepisać).
- Kroki w aplikacji: brak (dokumentacja testów).
- Opcje: (a) dopisek w `_opis` „2026-11-16 (FX3, P-880): waga 83 = pomiar 43774048947” i w 39 „jedno dodatkowe przewinięcie”. Koszt: 2 linie przy najbliższym FX. (b) Zostawić; decyzje P-880 i P-878 mówią prawdę. Wada: `_opis` jest jedynym opisem pochodzenia wag.
- Rekomendacja: (a) przy następnej zmianie tych plików, bez osobnego commita.
- Test akceptacyjny: `grep` obu zdań → 0 trafień albo zdania zgodne z P-880 i P-878.
- Status: otwarte

### 08-programista-003 · Test wydania BX-019 nie wykrywa bezwarunkowego importu `zliczNawigacje` (wykrywa go dopiero eksport wydania, poza verify)
- Pozycja listy kontrolnej: DEV-03
- Poziom: P3 · Realność: teoretyczny (dziś kod jest poprawny: `app/licznik.tsx:64` woła `paneleE2e?.zliczNawigacje`) · Pewność: wysoka
- Rodzaj: D
- Dowód: mutacja m1d (import `zliczNawigacje` wprost z `src/kompozycja/e2e/nawigacje-stan` i wywołanie bez warunku) → `tests/ekrany/e2e-nawigacje-stan-bx019-wydanie.test.tsx` zielony (`dowody/sonda-m1d.txt`), bo test widzi tylko drzewo i `push`. Ten sam mutant łapie `node scripts/jakosc/slady-wydania.mjs` (kod 1, ślad `e2e-nawigacje` w bundlu, `dowody/slady-wydania-m1d.txt`) i `kontrola-ipa.sh` przed wysyłką (`.github/workflows/testflight.yml:249`). Ten skrypt nie jest częścią `verify`, uruchamia się ręcznie i przed TestFlight.
- Mechanizm: pytanie „czy kod E2E trafia do bundla” rozstrzyga eksport, nie Jest. Tak samo jest dla pozostałych paneli E2E (P-238, P-240), więc to nie jest nowa luka.
- Powraca: nie
- Wzorzec lub źródło: P-238, P-240 (`docs/decyzje.md`).
- Kroki w aplikacji: brak w dzisiejszym kodzie. Przyszły błąd dawałby czerwień przy `kontrola-ipa.sh`, nie przy pushu.
- Opcje: (a) bez zmian; ostatnią linią obrony jest kontrola .ipa przed wysyłką. Koszt: zero; błąd wyjdzie późno, ale przed użytkownikiem. (b) Reguła w `kontrole-repo.mjs`: zakaz importu `src/kompozycja/e2e/*` spoza `src/platforma/tryb-e2e.ts`. Koszt: kilka linii, błąd wychodzi przy pushu.
- Rekomendacja: (a). Realność jest teoretyczna, a ochrona istnieje. (b) wróci, jeśli taki import pojawi się drugi raz.
- Test akceptacyjny: dla (b): mutant m1d czerwony w `npm run jakosc:kontrole`.
- Status: otwarte

## Do sprawdzenia (pewność ≤ 80%)
- Czy panel `e2e-nawigacje` jest widoczny na zrzucie `22-licznik-przed-wzorem`, czy leży pod strefą akcji. Strefa nakłada się na treść (`src/ekrany/Licznik.tsx:151-153`, `:222`). Brakuje zrzutu z buildu z panelem (przebieg 43806685504). Od tego zależy opcja (a) w 001.
- Wyniki 39, 61 i 81 w 43788927541 („zielone” według `bx-stan.md`) znam tylko z zapisu autora. Sprawdziłem jedynie, że przebieg biegł na f3b3a8cb (API Actions: `head_sha` f3b3a8cb…), a ten SHA zawiera 886e9bea (BX-009) i b318c94d (`scroll` w 39).

## Co działa dobrze i należy zachować
- **Zadanie 1.** Panel jest ładowany wyłącznie przez `paneleE2e` (`src/platforma/tryb-e2e.ts:16`), a eksport wydania na 7fbb5b94 jest czysty, kod 0 (`dowody/slady-wydania-baza.txt`). W wydaniu „Wzór” robi `paneleE2e?.zliczNawigacje` (no-op przy `null`) i `router.push('/wzor')` (`app/licznik.tsx:64`). Test wydania pada na obu mutantach renderu i na mutancie bez `push` (`tests/ekrany/e2e-nawigacje-stan-bx019-wydanie.test.tsx:43-44`). Panel stoi na końcu slotu, za `e2e-zegarek-stan` (`app/licznik.tsx:77-79`), więc nie przesuwa elementów z hipotezy 2 z P-882. `process.env` w Jest jest kopią na plik (`jest-util` `createProcessObject`), więc ustawienie E2E w jednym pliku nie przecieka do innych.
- **Zadanie 2.** `app/zdjecie.tsx:24-25`: hook czyta kontekst `SafeAreaProvider` z ExpoRoot, który obejmuje też ekrany `fullScreenModal` (kontekst React przechodzi przez natywne ekrany). Przyczyna zera jest potwierdzona w kodzie biblioteki: `findNearestProvider` bez dostawcy zwraca `self`. BX-014 zostaje (tylko `top`/`bottom`, mutant m2b czerwony). Atrapa `tests/narzedzia/safe-area-zero.ts:4-5` podmienia tylko hook, reszta biblioteki jest prawdziwa, a zera odpowiadają temu, co te testy dostawały wcześniej (Jest nie liczy wcięć natywnie). Atrapa BX-009 modeluje `SafeAreaView` jako zero, zgodnie z hierarchią z iOS, więc test jest czerwony na starym kodzie (m2a).
- **Zadanie 3.** 39: dodano tylko dwa kroki `scroll` (`e2e/scenariusze/39-p-190-jezyk-trwaly.yaml`, linie 24 i 34), żadna asercja nie zniknęła, a test `e2e-39-jezyk-dolny-brzeg-bx010` pilnuje kolejności. 61: linia 61 scenariusza `e2e/scenariusze/61-br-prj-007-s1-zrob-taka-sama.yaml` nadal sprawdza wartość licznika, bo klucz `licznik.teraz` (`src/i18n/slowniki/en.json:14`) to „Now working row {{n}}”, n = wartość + 1 (476abe53, `src/kompozycja/projekty.ts`). Licznik 0 daje „row 1”, a skopiowana wartość 2 dałaby „row 3”, czyli czerwień. Przecinek po „row 1” wyklucza „row 10”. 81 i 83: zdjęto tylko tag `oczekujacy`. Pokrycie: 81 zielony w 43788927541 (część 4) na `head_sha` f3b3a8cb, który zawiera 886e9bea; po f3b3a8cb zmieniły się tylko `app/licznik.tsx` i panel E2E. 83 zielony w 43774048947 (część 4) na `head_sha` f562da5b, który zawiera 89b9fe7f (BX-008); FX3 i FX4 nie dotykają `app/ustawienia.tsx` ani `app/miary.tsx`. `maestro-runner.ts`: `scroll` dopisany do znanych i przezroczystych (`tests/jakosc/maestro-runner.ts:27`, `:38`), tak jak `scrollUntilVisible`, więc reguła asercji się nie zmieniła. `e2e/czesci.json`: zmieniona tylko waga 83 (123 → 86). Wagi niczego nie wyłączają: `scripts/ci/e2e-czesci.mjs:42` bierze listę scenariuszy z katalogu, a scenariusz bez wagi dostaje szacunek.
- **Zadanie 4.** Test P-855 na kopii (`tests/jakosc/bramka-przypadki-uzycia.test.ts:77`, `:88`, `:90`) ma tę samą siłę co wcześniej, a nawet większą. Asercja jest ta sama (lista ID z błędem «nie liczy się»), doszła kontrola, że bez wymogu testów B kopia jest czysta, a `toContain(klasaA)` pada głośno, gdy katalog się zmieni. Mutant m4a daje «Expected [PU-228], Received []». Na prawdziwym katalogu: tryb `bramka` w `.github/workflows/testflight.yml:100` woła `kontrolaKatalogu(root, { wymagajTestowB: true })` (`scripts/jakosc/bramka-przypadki-uzycia.mjs:403`), reguła P-855 jest w `:255`, a niezależnie od niej `:217` czerwieni wiersz A ze scenariuszem z tagiem `oczekujacy` także bez wymogu testów B (mutant m4c → czerwony test «na bieżącym repo»).
- **Zadanie 5.** `docs/jakosc/przypadki-uzycia.md:12` „A=109, B=178, F=52, razem 339” zgadza się z liczeniem wierszy (109/178/52) i z `bramka-przypadki-uzycia.mjs katalog` (kod 0). Kontrola 2 z wymogiem testów B daje 44 błędy, wszystkie „B bez testu” (lista `doZaprogramowania`), i 0 „oczekujących”. P-877…P-883 (`docs/decyzje.md:786-792`) to 7 dodanych wierszy bez usunięć. Są spójne z kodem: P-883 zastępuje chronologicznie P-879 (tam: tag 81 zostaje do zielonego przebiegu) i uzasadnia pozostawienie wagi 81 = 130.

## Decyzje dla właściciela
Brak decyzji produktowych. Werdykt i odczyt diagnostyki rozstrzyga koordynator (P-087). Proponowany zapis z puli P-885…P-886 (zapisze go koordynator albo następna sesja z prawem do `docs/decyzje.md`; ta sesja zmienia tylko plik recenzji i jej dowody):
- **P-885** (do weta): recenzja CD FX3+FX4 na 7fbb5b94 — Z UWAGAMI, scalenie z integracją dozwolone. Panel BX-019 odczytujemy przez przyrost montaży względem zrzutu `22-licznik-przed-wzorem`, nie przez „mounts > 1” (08-programista-001, opcja a). Odrzucone: NIEGOTOWY do czasu zmiany panelu (opcja b), bo przebieg 43806685504 już trwa, a zmiana panelu nie wpływa na wydanie.

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-001,08-programista-002` (002 przy najbliższym FX dotykającym tych plików; 003 bez naprawy, chyba że koordynator wybierze opcję b).

## Stan plików śledzonych
`git status --porcelain` przed commitem recenzji: tylko `?? docs/jakosc/cd-recenzja-fx3-fx4.md` i `?? docs/jakosc/cd-recenzja-fx3-fx4/` (kopia sond w scratchpadzie po każdej mutacji przywrócona `git checkout -- .`).
