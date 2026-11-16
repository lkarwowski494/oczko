# CJ — niezależna recenzja kodu produktu i bramki PU przed scaleniem (2026-11-16)

Sesja CJ, rola 08-programista (tryb audit), polecenie `origin/koordynacja:docs/koordynacja/polecenia/CJ.md` @ e261d72e (koordynator session_01T66VBzb4nxMxEGdBmHBUbV).
Przedmiot: `claude/bx11-2026-11-16` @ **6a055e8b** (FX5, FX6/FX6b, BX11 CH-01) i `origin/claude/ci-bramka-pu-2026-11-16` @ **bdd64f6c** (CI-01 katalog, CI-02 bramka). Obie tylko do odczytu; jedyna zmiana tej gałęzi to ten plik.
Kolejność: najpierw własna ocena (sondy, mutacje), dopiero potem do porównania raporty autorów (`fx6-stan.md`, `ci-stan.md`, `bx11-dowod-czerwony.txt`, sekcje FX5/BX10/BX11 w `bx-stan.md`). Mutacje i sondy robiłem tylko na kopiach (`git worktree` w scratchpadzie), bez commitów.

## Werdykt: **Z UWAGAMI** — można scalić z integracją

Nie ma P1. Jest jedno P2 (CJ-01, brzegowe): bramka PU dla testów Swift sprawdza tylko kształt testu, a nie to, czy test coś asertuje. Nie blokuje scalenia, bo dziś jedyny odnośnik Swift (PU-333) wskazuje prawdziwy test z asercjami. Do poprawy przed następnym odnośnikiem `*.swift`. P3 to uwagi.

## Zadania

| # | Zakres | Wynik | Dowód |
|---|---|---|---|
| 1 | Bramka PU przyjmuje test Swift (P-906, CI-02) — ścieżka wrażliwa | **Poprawna, z luką P2** (CJ-01) | niżej „Zad. 1” |
| 2 | Katalog CI-01 w granicach słów właściciela; liczby A/B/F zgodne ze skryptem | **Zgodny** (CJ-05 tylko jako notka) | niżej „Zad. 2” |
| 3 | Kod FX6b-01 (`useStanLicznika`) | **Poprawny**; nadmiarowa linia (CJ-03) | niżej „Zad. 3” |
| 4 | Haki E2E w buildzie wydania | **Czysto**: bundel wydania bez paneli, bundel E2E z panelami | niżej „Zad. 4” |
| 5 | Kod FX5 | **Poprawny** | niżej „Zad. 5” |
| 6 | Dokumenty: P-906, P-908…P-911, P-916; `tabela-08` z generatora | **Zgodne z kodem**; jedno nieścisłe zdanie (CJ-04) | niżej „Zad. 6” |

### Zad. 1 · bramka Swift (`scripts/jakosc/bramka-przypadki-uzycia.mjs` @ bdd64f6c)
- Co sprawdza `bladTestuSwift` (`:187-206`):
  - ścieżka po `path.posix.normalize`, w `modules/oczko-reguly/Tests/` (`:192`); po `realpath` nadal wewnątrz pakietu, więc dowiązanie nie wyprowadzi poza niego (`:194`);
  - w pliku nie ma `XCTSkip` (`:196`) ani `#if false`/`#if 0` (`:197`), jest klasa `: XCTestCase` (`:198`);
  - w promieniu 40 linii jest PU-NNN jako cały wyraz i `func test…()` bez argumentów, nie `private`/`static` (`FUNC_TEST`, `:190`, `:204`).
- „z testem:” wymaga odnośnika w `tests/` albo w pakiecie Swift (`:265`). Każdy inny `*.swift:N` daje błąd, nie jest po cichu pomijany (`:126`, `:245`, `:269`).
- Czy test Swift naprawdę biegnie przed wydaniem:
  - `.github/workflows/testflight.yml:131-132`: `swift test` w zadaniu `build` (`needs: [bramka, bramka-przypadki]`), przed archiwizacją, bez `if` i bez `continue-on-error`;
  - `jakosc-ios.yml` uruchamia swift-test z `set -o pipefail`.
- Zmiana tylko poszerza bramkę. Stara bramka (2c446d00) i nowa na tym samym katalogu:
  - `kontrolaKatalogu` z `wymagajTestowB=false`: 1 → 0 błędów;
  - z `wymagajTestowB=true`: 41 → 40;
  - jedyna zmiana z czerwonego na zielony to PU-333; nowych błędów nie ma.
- Mutacje bramki (testy `tests/jakosc/bramka-przypadki-uzycia.test.ts:395-490`; baza 20 passed). Każda mutacja zabita:

  | Mutacja | Wynik |
  |---|---|
  | M1 bez kontroli XCTSkip | 2 failed |
  | M2 bez `FUNC_TEST` | 3 failed |
  | M3 bez realpath | 1 failed |
  | M4 „z testem:” bez wymogu pakietu | 1 failed |
  | M5 bez `swift test` w `testflight.yml` | 1 failed |

  Autorka/autor CI podaje M1–M9 zabite; moje M1–M5 robiłem niezależnie i wynik jest zgodny.
- Sondy obejść, czyli pliki-fikstury podane do `bladTestuSwift`:
  - **przyjęte** (CJ-01): pusty `func test…() {}` z komentarzem PU; test bez żadnej asercji; `XCTExpectFailure`; `func test` wewnątrz komentarza blokowego `/* */`; test pod `#if os(watchOS)` albo `#if !true` (na macOS się nie kompiluje); `return` na początku testu; `func test` w `struct` niebędącym XCTestCase, w pliku, który ma też inną klasę XCTestCase;
  - **odrzucone**: `// func test…`, `#if false`, `throw XCTSkip`, `PU-3330`.
- Test wskazany przez PU-333 (`ZegarekSkrzynkaTests.swift:104-129` @ 6a055e8b) jest prawdziwy:
  - asertuje, że stan, kolejka `["z1"]` i plik skrzynki się nie zmieniły;
  - asertuje `wzorzecHaptykiZegarka(.plus/.minus, .zapisNieudany) == .bladZapisu`;
  - po naprawie zapisu stuknięcie zapisuje się, kolejka `["z1","z3"]`.
  - Zastrzeżenia ma CJ-02.

### Zad. 2 · katalog CI-01 (`docs/jakosc/przypadki-uzycia.md` @ bdd64f6c, diff 2c446d00)
- Słowa właściciela: `origin/koordynacja:docs/koordynacja/stan.md:613-614`, „Zgodnie z rekomendacja”. Pytanie 1 → wariant B (PU-134, 135, 137, 139, 153, 175), Pytanie 2 → wariant A (PU-333 i nowe F).
- Diff w tych granicach:
  - PU-137 i PU-153 przechodzą do F, opisy bez zmian. Z pokrycia PU-153 znika uwaga o limicie 200 MB, ale tę ścieżkę dalej pokrywają PU-301 i PU-257;
  - PU-134, 135, 175 zostają B („widoczne”, bez porównania zrzutów); część „nic nie ucięte” przechodzi do nowych F PU-340, 341, 342;
  - PU-139 zostaje B komponentowy; „brak białych pól” przechodzi do PU-343 (F);
  - PU-333 zawężony; widok komunikatu i wibracja przechodzą do PU-344 (F).
  - Napisy „今日” i „ガイド” istnieją w `src/i18n/slowniki/ja.json`.
- Liczby: `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` → „Kontrola 2: zielona”, **exit 0**.
  - Niezależne liczenie wierszy (awk): A 109, B 176, F 59 (razem 344); B: z testem 136, oczekujący 25, do zaprogramowania 15.
  - To samo podaje nagłówek katalogu i `ci-stan.md`.

### Zad. 3 · FX6b-01 (`src/ekrany/Aplikacja.tsx` @ 6a055e8b)
- Mechanizm (`:67-73`):
  - `wydanie = useRef(0)`, każde `odswiez()` bierze swój numer;
  - wynik odczytu, który nie jest już najnowszy, jest pomijany (`'pominiete'`);
  - wpisy z „+1”/„−1” podnoszą numer (`:85`, `:97`).
- Test `tests/ekrany/licznik-odswiezenie-kolejnosc.test.tsx`: baza 1 passed. Mutacje:
  - **Ma** (usunięte pomijanie) → failed, „Expected substring "0" Received "1"”, czyli test łapie defekt z właściwego powodu;
  - **Mb** (usunięte `wydanie.current += 1` przy zapisach) → passed. To mutant równoważny: zaraz po zapisie `odswiez()` synchronicznie podnosi numer, więc te dwie linie nic nie zmieniają (CJ-03).
- Ryzyko regresji:
  - numer steruje tylko stanem ekranu; żaden zapis do bazy nie zależy od kolejności odczytów;
  - po odmontowaniu ekranu zachowanie jak przed zmianą (brak strażnika, `ustawStan` po odmontowaniu nic nie robi);
  - ścieżka „Dziś” (`:144`) bez diagnostyki i bez zmian.
- Raport autora (`fx6-stan.md`, „FX6b-01”) mówi to samo i uczciwie zaznacza, że defekt **nie** tłumaczy czerwieni 69. Zgadzam się.

### Zad. 4 · haki E2E w buildzie wydania
- Wszystkie haki idą przez `paneleE2e` (`src/platforma/tryb-e2e.ts`: `process.env.EXPO_PUBLIC_E2E === '1' ? require(...) : null`, P-238). Wywołania sprawdzone w kodzie:
  - `app/licznik.tsx:61,78`;
  - `app/formularz/[rodzaj].tsx:123`;
  - `app/_layout.tsx:145-146`;
  - `src/ekrany/Formularze.tsx` (`diagnostyka?.wpis`, `{diagnostyka?.panel}`).
- W wydaniu `diagnostyka` jest `undefined`, więc zachowanie się nie zmienia. Jedyny ślad to nowa funkcja strzałkowa w `naZmiane` przy każdym renderze, bez znaczenia.
- `npm run jakosc:slady-wydania` (worktree @ 6a055e8b, `npm ci` exit 0) → **exit 0**:
  - „OK: build wydania bez śladów” (12 wzorców, m.in. `e2e-`);
  - „OK: build E2E ma panele” (np. `e2e-nazwa-wejscia`).
- Testy komponentów wariantu wydania: `tests/ekrany/e2e-wejscia-stan-wydanie.test.tsx`, `tests/ekrany/e2e-okno-stan-wydanie.test.tsx`; panele nieobecne.
- Panele w `src/kompozycja/e2e/wejscia-stan.tsx` i `okno-stan.tsx` nie wołają `t()` i trzymają stan tylko w pamięci procesu.
- `PanelOkna`: `pointerEvents="none"`, `position: absolute`, `zIndex: 1000`. `Text` w RN 0.86.3 przyjmuje `pointerEvents` (`node_modules/react-native/Libraries/Text/Text.d.ts:211-213`).

### Zad. 5 · FX5
- d83df1b, `src/ekrany/WzorMenu.tsx`: nagłówek `accessibilityRole="header"` z `t('wzor.przelacz_naglowek', { projekt })`.
  - Klucz jest we wszystkich 37 słownikach.
  - `app/wzor.tsx` podaje `licznik.nazwaProjektu(lw)`, a projekt bez nazwy dostaje `etykietaRobocza` (`src/kompozycja/licznik.ts:243`), więc nie ma pustego „{{projekt}}”.
  - Bez `numberOfLines`: długa nazwa się zawija, nie jest ucinana.
- 0b5bd81, `src/kompozycja/e2e/panele.tsx`: `zegarekSztucznyZJezykiem`, `opisStanuZegarka(..., jezyk)` → „· lang kod”.
  - Sztuczny zegarek dostaje tę samą funkcję języka (`src/kompozycja/kontener.ts:73`) co prawdziwy adapter (`src/platforma/zegarek.ts:15`), więc scenariusz 90 sprawdza ścieżkę produkcyjną.
- 0c87a32: test Swift PU-333, opisany w zad. 1 i w CJ-02.

### Zad. 6 · dokumenty
- `docs/decyzje.md` od d7642f33 do 6a055e8b: same dopiski (P-902…905, 908…913, 916), starsze wpisy bez zmian. Na bdd64f6c dopisane tylko P-906.
- P-906 zgadza się z `bladTestuSwift` i `testflight.yml:131-132`.
- P-908…P-911 zgadzają się z `fx6-stan.md` i z kodem: P-910 to numer wydania w `useStanLicznika`, P-911 to tylko propozycja, niewdrożona.
- P-916 (`docs/decyzje.md:810`) zgadza się z kodem: „jedna linia po `</Stack>`”, `pointerEvents="none"`. Zdanie „nad całym stosem” w `okno-stan.tsx:12` jest nieścisłe (CJ-04).
- `node scripts/jakosc/tabela-08.mjs --check` (@ 6a055e8b) → 495 plików testów, 0 błędów, **exit 0**. Tabela odpowiada generatorowi.

## Znaleziska

### CJ-01 · P2 · brzegowy — bramka Swift sprawdza kształt testu, nie jego treść
- Miejsce: `scripts/jakosc/bramka-przypadki-uzycia.mjs:190-206` @ bdd64f6c.
- Bramka przyjmuje jako „z testem:” test, który nic nie sprawdza albo nie biegnie na macOS. Przyjmuje:
  - pusty `func testPU…() {}` albo test bez asercji;
  - `XCTExpectFailure`;
  - deklarację w `/* … */`;
  - test pod `#if os(watchOS)` albo `#if !true`;
  - `return` na początku testu;
  - `func test` w `struct` obok jakiejś klasy XCTestCase.
- Dlaczego brzegowy, nie realny: dziś jedyny odnośnik (PU-333) wskazuje prawdziwy test. Luka zadziała dopiero przy kolejnym odnośniku `*.swift`, napisanym niedbale albo na skróty.
- Kontekst: bramka Jest (`bladTestuPU`) też nie wymaga asercji, więc to nie jest regresja. Ale P-906 otwiera drogę, której nie pilnuje żaden zestaw w tym repo (Swift biegnie tylko na macOS).
- **Poprawka:** w ciele najbliższej `func test` wymagać `XCTAssert*`/`XCTFail`/`XCTUnwrap`, odrzucać `XCTExpectFailure`, deklarację w komentarzu blokowym i każdy `#if` obejmujący funkcję, a w `testflight.yml` sprawdzać w wyniku `swift test --xunit-output`, że wskazany test się wykonał i przeszedł.

### CJ-02 · P3 · brzegowy — test PU-333 nie sprawdza powiązania błędu zapisu z haptyką w aplikacji zegarka ani stuknięcia „−1”
- Miejsce: `modules/oczko-reguly/Tests/OczkoRegulyTests/ZegarekSkrzynkaTests.swift:117-118` @ 6a055e8b.
- Wartość `.zapisNieudany` ustawia sam test w `catch`. Prawdziwe powiązanie (`targets/watch/Aplikacja.swift:71-75`: `catch` → `zagraj(rodzaj, .zapisNieudany)`) leży w celu zegarka, którego nie testuje nic.
- „−1” przy błędzie zapisu sprawdzone jest tylko przez czystą funkcję `wzorzecHaptykiZegarka`, bez stuknięcia, choć PU-333 mówi „+1 i −1”.
- F PU-344 tego nie domknie: według `ci-stan.md` („Otwarte”) na prawdziwym zegarku nie da się wywołać błędu zapisu.
- Bez ryzyka utraty danych: stan i kolejka bez zmian są asertowane.

### CJ-03 · P3 · teoretyczny — nadmiarowe podbicie numeru wydania
- Miejsce: `src/ekrany/Aplikacja.tsx:85` i `:97` @ 6a055e8b.
- `wydanie.current += 1` po udanym zapisie nic nie zmienia, bo zaraz potem `odswiez()` synchronicznie podbija numer (mutant Mb przeżywa).
- Kod nie jest błędny. Można go usunąć albo zostawić z komentarzem „na wypadek wpisu bez odczytu”.

### CJ-04 · P3 · teoretyczny — panel `e2e-okno` nie jest „nad całym stosem”
- Miejsce: `src/kompozycja/e2e/okno-stan.tsx:12`, `docs/decyzje.md:810` (P-916).
- Ekrany natywnie modalne (`presentation: 'modal'`/`fullScreenModal` w `app/_layout.tsx`, np. oferty) zasłaniają widok JS z korzenia.
- Scenariusz 105 sprawdza tylko ekrany niemodalne (licznik, „Dziś”, ustawienia, projekty, historia, narzędzia), więc dziś bez skutku. To uwaga na przyszłe użycie panelu.

### CJ-05 · P3 · teoretyczny — notki do katalogu
- Dopisek PU-343 „(sama strona wzoru zostaje biała, instrukcja 1171, Z-03)” wykracza poza dosłowne słowa właściciela, ale powtarza istniejące PU-010/Z-03, więc żadne wymaganie nie ginie ani się nie zmienia.
- PU-344 stoi w tabeli przed PU-333; to tylko kolejność.

## Porównanie z raportami autorów (po własnej ocenie)
- `fx6-stan.md`: opis FX6b-01, test i zastrzeżenie „nie dowodzi przyczyny 69” zgadzają się z moją oceną. Autor nie zauważył nadmiarowości (CJ-03).
- `ci-stan.md`:
  - liczby katalogu i mutacje bramki zgadzają się z moimi;
  - autor sam zgłasza brak recenzji niezależnej (ta recenzja to uzupełnia) i otwarte pytanie o PU-344, które wzmacnia CJ-02;
  - luki CJ-01 raport nie wymienia.
- `bx11-dowod-czerwony.txt`: CH-01 był czerwony przed kodem (7 failed, wariant wydania passed), zgodnie z moim odczytem kodu i testów.
- Sekcje BX10/BX11 w `bx-stan.md`: opis scalenia FX5/FX6 i P-916 zgodny z kodem.

## Komendy i kody wyjścia (dowody w scratchpadzie sesji, poza repo)
- `npm ci` w worktree @ 6a055e8b i @ bdd64f6c → 0.
- `npx jest tests/jakosc/bramka-przypadki-uzycia.test.ts` (@ bdd64f6c): baza 20 passed; M1–M5 na kopii, każda failed (zabita).
- Porównanie bramki stara/nowa (`kontrolaKatalogu`, oba tryby) → opis w zad. 1.
- `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` (@ bdd64f6c) → 0.
- `npx jest tests/ekrany/licznik-odswiezenie-kolejnosc.test.tsx` (@ 6a055e8b): baza 1 passed; Ma → failed; Mb → passed (równoważny).
- `npm run jakosc:slady-wydania` (@ 6a055e8b) → 0.
- `node scripts/jakosc/tabela-08.mjs --check` (@ 6a055e8b) → 0.
- Pełnego `verify` poza hakiem nie uruchamiałem (zakaz z polecenia); verify biegnie w haku pre-push tego commita.

## Czego nie sprawdzono
- `swift test` na macOS. W tej sesji nie ma Xcode, więc test PU-333 oceniłem z kodu, nie z przebiegu.
- Przebiegu iOS scenariuszy 64, 69, 90, 91 i 105.

## Decyzje
Bez nowych decyzji. Pula P-920…P-921 niewykorzystana; poprawki CJ-01…CJ-04 rozdziela koordynator.

## Sesja
- Sesja skompaktowała się raz w trakcie, przed napisaniem tego pliku. Pracę kontynuowałem od zapisanego stanu.
- Subagentów nie użyłem.
