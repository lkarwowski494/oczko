# Audyt: Programista — Oczko — 2026-11-17 (CP: recenzja przyrostu BX18–BX22 przed buildem 8)
Commit: 2373e8838f83c58a4d7e5941a9efde18889b052f (baza przyrostu 7a738d8) · Tryb: audit (tylko odczyt, bez zmian kodu, testów, scenariuszy i katalogu) · Środowisko: Linux, Node, Jest (preset iOS); uruchomione: bateria 15 plików testowych (50 testów), mutacje na kopii (worktree detached), dwa buildy `expo export --platform ios --no-bytecode --clear` (wydanie i E2E). Nie dało się uruchomić: Maestro i symulator iOS (brak macOS), więc przebieg iOS 44012392916 nie był sprawdzany, a zachowanie scenariuszy oceniam z kodu YAML i testów reguł.

Skala poziomów: rola 08 używa P0/P1/P2; zlecenie CP używa P1/P2/P3. Mapowanie: P0 roli = P1 zlecenia (blokuje build 8), P1 roli = P2 zlecenia (poprawić albo świadomie przyjąć), P2 roli = P3 zlecenia (szlif).

## Podsumowanie
**Werdykt: Z UWAGAMI — build 8 może iść** (brak P0 roli = brak P1 zlecenia). Kod ścieżki „+1” jest poprawny: stan z wyniku jest identyczny z odczytem `odswiez`, sonda 6 równoległych „+1” dała spójną kolejność, a w bundlu wydania nie ma modułu paneli E2E ani ich testID. Główne ryzyko to testy, które nie pilnują tego, co BX20/BX21 zmieniły: 7 z 10 mutacji pól stanu przeżyło, a test wydania nie wykrywa onPressIn/onPressOut ani opakowania onPress. Scenariusze: żadna asercja bramkowa nie została osłabiona; tożsamość commitów P-507 i katalog przypadków użycia bez zastrzeżeń. Decyzji dla właściciela nie ma.

| ID | Poziom (rola / zlecenie) | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P1 / P2 | D | CP-01: test równoważności stanu z „+1” i odczytu nie wykrywa utraty 7 z 10 pól stanu | otwarte |
| 08-programista-002 | P2 / P3 | D | CP-02: pełny stan z „+1” zatwierdzany bez straży kolejności odczytów | otwarte |
| 08-programista-003 | P2 / P3 | D | CP-03: test wydania nie wykrywa onPressIn/onPressOut ani opakowania onPress | otwarte |
| 08-programista-004 | P2 / P3 | D | CP-04: „+1” na Dziś zawsze opakowane w wydaniu (w przeciwieństwie do reszty celów) | otwarte |

## Linia bazowa i założenia
- Zakres: `git diff 7a738d8..2373e88` (6 commitów: 4fe940f, e525143, 8a09b3b, afb3a98, 9c0f5c3, 2373e88): kod 10 plików (+146/−21 w src i app), testy 9 plików (+719/−4), scenariusze 6 plików (+18/−7), katalog PU 9 linii.
- Soczewki: poprawność ścieżki „+1” (kompletność stanu, wyścig); izolacja diagnostyki E2E od wydania; osłabienie bramek scenariuszy; tożsamość commitów; zasada 22 (katalog PU = źródło prawdy).
- Przed oceną nie czytałem wpisów BX19–BX22 w `docs/jakosc/bx-stan.md` ani P-950…P-961 w `docs/decyzje.md` (niezależność); po ocenie użyłem ich tylko do porównania uzasadnień komentarzy w kodzie.
- Założenie: pułap kosztu 4 USD, bez subagentów.

## Pokrycie (co sprawdzono, czego nie)
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| Zadanie 1: `src/kompozycja/licznik.ts`, `src/ekrany/Aplikacja.tsx`, `src/ekrany/LicznikTypy.ts` | tak | czytanie kodu; sonda 6 równoległych „+1” na prawdziwej bazie (spójna kolejność i stany); 10 mutacji pola `stan` (tabela w znalezisku 001) |
| Zadanie 2: `app/_layout.tsx`, `src/ekrany/Pasek.tsx`, `src/ekrany/Dzis.tsx`, `app/licznik.tsx`, `src/platforma/tryb-e2e.ts` | tak | czytanie kodu; dwa buildy bundla iOS (wydanie i E2E) z grepem; 5 mutacji w testach wydania (znalezisko 003) |
| Zadanie 3: scenariusze 100, 93, 95, 122, 107, README; 31, config i workflow | tak (YAML, nie przebieg) | `git diff --stat` i diff; testy reguł BX18 (`tests/jakosc/e2e-bx18-scenariusze.test.ts`) |
| Zadanie 4: tożsamość commitów, katalog PU | tak | `git log --format` z autorem, committerem i trailerami; porównanie wierszy PU przed i po |
| Przebieg Maestro na symulatorze iOS (w tym 44012392916) | nie | brak macOS; poza zakresem sesji |
| Pełna bramka `npm run verify`, typecheck, lint | nie | poza zakresem (recenzja przyrostu); uruchomiona tylko bateria 15 plików: baseline 50 z 50 zielone na 2373e88 |
| Treść BX19–BX22 w `docs/jakosc/bx-stan.md`, P-950…P-961 | po ocenie, wyrywkowo | tylko porównanie uzasadnień |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/jakosc/cp-recenzja-przyrostu.md . --rola 08-programista` → wynik wklejony w sekcji końcowej raportu (patrz „Wynik sprawdz-raport.mjs” na dole).

Dowody mechaniczne:
- Bundle wydania `expo export --clear --platform ios --no-bytecode` (5 640 554 B): `grep -c -F` dla `e2e-nacisniecia`, `e2e-dotyk`, `e2e-licznik-wejscia`, `e2e-pomiar-plus` → po 0 trafień; `kompozycja/e2e` → 0; `EXPO_PUBLIC_E2E` → 0 (wartość wstawiona w czasie budowy). Jedyne ślady to nazwy własności w martwych gałęziach `f.paneleE2e?…:null` (`zliczNacisniecie`, `PanelDotyku`, `ZnacznikAwarii` po 1 trafieniu).
- Kontrola pozytywna, bundle E2E (`EXPO_PUBLIC_E2E=1`, `--clear`, 5 778 275 B): te same cztery napisy → po 1 trafieniu. Bez `--clear` build E2E dał identyczny hash co wydanie (cache Metro nie widzi zmiany zmiennej środowiska), więc kontrola bez `--clear` byłaby pozorna.
- Format hbc (bez `--no-bytecode`) nie nadaje się do tej kontroli: napisy są tam skompresowane, kontrola pozytywna dała 0 trafień.
- Skan sekretów w diffie 7a738d8..2373e88: brak (wzorce z kontroli roli, DEV-14).
- Tożsamość: `git log --format='%h %an <%ae> | %cn <%ce>' 7a738d8..2373e88` → 6 commitów, autor i committer Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>; `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 7a738d8..2373e88 | grep -c -E 'Co-Auth|Claude-S'` → 0.
- `git status --porcelain` na gałęzi `claude/cp-recenzja-przyrostu-2026-11-17` przed zapisem raportu: puste (drzewo czyste).

## Stosowalność listy kontrolnej
| Pozycja | Status | Wynik |
|---|---|---|
| DEV-01 | dotyczy (stan z „+1” to logika kompozycji) | znalezisko 08-programista-001 (testy nie pilnują pól) |
| DEV-02 | dotyczy | 4/4 commity zmieniające src lub app mają test w tym samym commicie (8a09b3b, afb3a98, 9c0f5c3, 2373e88); 4fe940f test i scenariusze; e525143 tylko dokumentacja. Ok |
| DEV-03 | dotyczy | 0 trafień `.skip(`, `.only(`, `xit(`, `xdescribe(`, `it.todo`, `expect(true)` w dodanych liniach testów; 2 usunięte asercje to zmiana oczekiwań pomiaru po BX22 (0 → 1 i 4 → 0 z komentarzem), nie osłabienie. Ok; luka: znaleziska 001 i 003 |
| DEV-04 | dotyczy | nie sprawdzono pełnej bramki (poza zakresem); bateria 15 plików 50 z 50 zielone |
| DEV-05 | nie dotyczy zmian przyrostu (brak zmian w zapisie danych; „+1” nadal przez kolejkę FIFO zapisów) | ok |
| DEV-06 | nie dotyczy (brak zmian migracji ani kopii) | ok |
| DEV-07 | dotyczy | ok: `pelny ?? {...}` w `src/ekrany/Aplikacja.tsx:88` to zgodność wsteczna dla atrap, nie zgadywanie danych użytkownika |
| DEV-08 | nie dotyczy (brak zmian dat) | ok |
| DEV-09 | dotyczy (nowe pole `stan` w typie) | ok: typowane przez `StanEkranuLicznika` w `src/ekrany/LicznikTypy.ts:50`, brak `as any` w dodanych liniach |
| DEV-10 | dotyczy | ok: brak pustych `catch` w dodanych liniach; `app/licznik.tsx` zwalnia wstrzymanie powiadomień też w `.catch` (zwolnij i rzucenie dalej) |
| DEV-11 | nie dotyczy zmian (brak zmian wyglądu) | ok |
| DEV-12 | nie dotyczy (diagnostyka i panele E2E, bez napisów dla użytkownika) | ok |
| DEV-13 | dotyczy | ok: bezpiecznik 1500 ms wstrzymania powiadomień opisany komentarzem BX22; scenariusz 107 timeout 60000 z uzasadnieniem w komentarzu (patrz Do sprawdzenia) |
| DEV-14 | dotyczy | ok: brak sekretów w diffie |
| DEV-15 | dotyczy (timer bezpiecznika, wstrzymanie powiadomień) | ok: zwolnienie w `zwolnij` i `.catch` w `app/licznik.tsx` |
| DEV-16 | dotyczy | ok: czasy z jednostką w nazwie lub komentarzu (ms) |

## Znaleziska (szczegóły)

### 08-programista-001 · CP-01: po regresji użytkownik mógłby po „+1” stracić cel, baner serii, limit albo blokadę, a żaden test by tego nie zauważył
- Pozycja listy kontrolnej: DEV-01 (test z wektorem do reguły), DEV-03 (osłabienie ochrony testem)
- Poziom: P1 (roli) = P2 (zlecenia)
  Realność: teoretyczny dziś (kod jest poprawny), realny przy kolejnej zmianie `stan()`  · Pewność: wysoka
- Rodzaj: D
- Dowód: `src/kompozycja/licznik.ts:160` przekazuje `stan: s` w wyniku „+1”; `src/ekrany/Aplikacja.tsx:88` zatwierdza go bez dalszego odczytu. Jedyny test równoważności to `tests/ekrany/licznik-plus-sciezka-bx20.test.tsx:77` (oraz :87) na cienkiej fikturze (jeden projekt, jedna część).
- Mechanizm: mutacja kopii (worktree 2373e88) zamieniająca `stan: s` na `stan: { ...s, <pole> }`, uruchomiona na baterii 15 plików (`jest --ci`, 50 testów): ubite (wykryte) 3 z 10: `przypomnienie: null` (wykrył `tests/ekrany/pu-przypomnienia-trasy.test.tsx`), `sesja: null` i `projekt: null` (oba `licznik-plus-sciezka-bx20.test.tsx`); przeżyło 7 z 10: `baner: null`, `limit: { rodzaj: 'brak' }`, `zablokowany: false`, `celDnia: null`, `cel: null`, `powtorzenie: null`, `konflikt: null` (po 15 z 15 zestawów i 50 z 50 testów zielone). Powrót do czystej kopii: `git checkout -q src`, drzewo czyste.
- Powraca: nie → po poprawce dodać mutację do trwałej kontroli w teście akceptacyjnym
- Wzorzec lub źródło: zasada wspólna 2 i 11 (test dowodzi tego, co obiecuje); DEV-01
- Kroki w aplikacji: użytkownik z celem 96 rzędów i serią 3 rzędów stuka „+1”: po regresji cel albo baner serii znikają do czasu następnego odczytu; przy blokadzie pasek blokady znika
- Opcje: (A) rozszerzyć fikturę testu równoważności o projekt z celem, powtórzeniem, serią, limitem ostatniego dnia, blokadą i konfliktem, porównanie `toEqual` całego `stan` z `odswiez` — koszt: kilkanaście linii fiktury; (B) test własności: dla każdego klucza `StanEkranuLicznika` zmiana w bazie musi pojawić się w obu ścieżkach — pewniejsze, ale droższe w utrzymaniu. Rekomendacja: A, bo przy A mutacja jest wykrywalna od razu.
- Test akceptacyjny: wszystkie 10 mutacji z tabeli wyżej ubite (zero przeżytych) na baterii 15 plików.
- Status: otwarte

### 08-programista-002 · CP-02: pełny stan z „+1” trafia do ekranu bez straży najnowszego odczytu
- Pozycja listy kontrolnej: DEV-01
- Poziom: P2 (roli) = P3 (zlecenia)
  Realność: teoretyczny (sonda 6 równoległych „+1” dała spójną kolejność)  · Pewność: średnia
- Rodzaj: D
- Dowód: `src/ekrany/Aplikacja.tsx:85-89` — przy `pelny` ekran robi `ustawStan` bez porównania numeru z `wydanie.current`, w odróżnieniu od `odswiez` (`src/ekrany/Aplikacja.tsx:73`). Odczyty poza kolejką zapisów (`src/dane/baza/kolejka.ts`) mogą skończyć się w innej kolejności, niż zaczęły.
- Mechanizm: dwa „+1” w locie; stan z pierwszego dociera po stanie z drugiego i nadpisuje nowszy starszym do następnego odczytu. W sondzie kolejność była zachowana (`plusWToku` w `src/kompozycja/licznik.ts:258` szereguje wywołania), więc to ryzyko architektoniczne, nie zaobserwowany błąd.
- Powraca: nie
- Wzorzec lub źródło: komentarz przy `wydanie` w `src/ekrany/Aplikacja.tsx:65` (FX6b) — ta sama reguła dla odczytów
- Kroki w aplikacji: bardzo szybkie stukanie „+1” na wolnym telefonie, krótki błysk starszej wartości
- Opcje: (A) dopisać straż: `const moje = ++wydanie.current` przy wejściu do `naPlus` i porównanie przed `ustawStan` — kilka linii, ryzyko: pominięcie legalnego stanu przy szybkiej serii, trzeba test; (B) zostawić i opisać w komentarzu, że kolejkowanie w `plusWToku` gwarantuje kolejność. Rekomendacja: B teraz (sonda nie pokazała błędu), A jeśli test szybkiej serii wykaże rozjazd.
- Test akceptacyjny: test dwóch nakładających się „+1” z odwróconą kolejnością zakończenia odczytów: ekran kończy z wartością drugiego.
- Status: otwarte

### 08-programista-003 · CP-03: test wydania nie wykryłby dodania onPressIn/onPressOut ani opakowania onPress w buildzie wydania
- Pozycja listy kontrolnej: DEV-03
- Poziom: P2 (roli) = P3 (zlecenia)
  Realność: teoretyczny (obecnie wydanie jest czyste, patrz bundle)  · Pewność: wysoka
- Rodzaj: D
- Dowód: `tests/ekrany/e2e-nacisniecia-bx20-wydanie.test.tsx:73` i `:88` sprawdzają pięć handlerów (`onTouchStart`, `onTouchEnd`, `onTouchCancel`, `onPressIn`, `onPressOut`) na elemencie hosta, a `Pressable` z React Native nie przekazuje `onPressIn` ani `onPressOut` na host (pochłania je w responderze), więc dla dwóch z pięciu asercja jest zawsze prawdziwa.
- Mechanizm: mutacje w kopii z testami `e2e-nacisniecia-bx20-wydanie`, `e2e-licznik-plus-wydanie-bx22`, `e2e-licznik-bez-diagnostyki-bx16-wydanie`: M-A (Wstecz zawsze z onTouchStart) → wykryta (1 test czerwony); M-B (dzis-plus zawsze z onPressIn) → przeżyła (7 z 7 zielone); M-C (przyciskKarty zawsze opakowany) → przeżyła; M-D (Wstecz onPress zawsze opakowany) → przeżyła; M-E (`paneleE2e` zawsze ładowany) → wykryta (4 testy czerwone). Wynik: 2 z 5 mutacji wykryte, 3 przeżyły.
- Powraca: nie
- Wzorzec lub źródło: zlecenie CP, zadanie 2 (wydanie bez opakowań i handlerów)
- Kroki w aplikacji: brak bezpośrednich; skutek dopiero przy regresji (dodatkowe handlery w wydaniu zmieniają cykl dotyku, to czego BX21 miał nie robić)
- Opcje: (A) sprawdzać rekwizyty samego `Pressable` (`UNSAFE_getByType(Pressable)` albo atrapa kontekstów), nie hosta — dokładne, ale używa API oznaczonego jako niestabilne; (B) test źródłowy: `KontekstNacisniec` i `KontekstDotyku` w wydaniu mają wartość `null`, a `onPress` komponentu jest dokładnie przekazaną funkcją (`toBe`) — prostsze, pokrywa M-C i M-D, nie pokrywa M-B. Rekomendacja: B plus (A) tylko dla `onPressIn`/`onPressOut`.
- Test akceptacyjny: M-B, M-C, M-D ubite.
- Status: otwarte

### 08-programista-004 · CP-04: przycisk „+1” na Dziś w wydaniu zawsze ma dodatkową funkcję opakowującą
- Pozycja listy kontrolnej: DEV-03 (wymaganie „wydanie bez opakowań” bez egzekucji)
- Poziom: P2 (roli) = P3 (zlecenia)
  Realność: realny, bez skutku widocznego dla użytkownika  · Pewność: wysoka
- Rodzaj: D
- Dowód: `src/ekrany/Dzis.tsx:124` — `onPress={() => { zglosNacisniecie?.('dzis-plus'); void plus(); }}` wykonuje się zawsze; pozostałe cele są opakowane warunkowo (`src/ekrany/Dzis.tsx:99`, `src/ekrany/Pasek.tsx:42`).
- Mechanizm: w wydaniu `zglosNacisniecie` jest `null`, więc opakowanie tylko wywołuje `plus()`; funkcjonalnie to samo, ale dodatkowa funkcja i brak symetrii z resztą celów. Nie ma wpływu na cykl dotyku (haki dotyku są warunkowe: `hakiDotyku?.('dzis-plus')`).
- Powraca: nie
- Wzorzec lub źródło: komentarz `src/ekrany/Dzis.tsx:68` (poza buildem E2E null)
- Kroki w aplikacji: brak widocznych
- Opcje: (A) ujednolicić: `onPress={zglosNacisniecie ? () => {...} : () => void plus()}` — jedna linia, spójność; (B) zostawić — zerowy koszt, wyjątek do opisania w komentarzu. Rekomendacja: A przy okazji poprawki 003 (ten sam test pilnowałby jednolitości).
- Test akceptacyjny: test z 003, wariant M-C obejmuje także `dzis-plus`.
- Status: otwarte

## Do sprawdzenia (pewność ≤ 80%)
- Scenariusz 107: timeout czekania na arkusz systemowy z 20 do 60 s (`e2e/scenariusze/107-pu-288-udostepnij-zdjecie-arkusz-systemowy-i-powrot.yaml:36`). Uzasadnienie w komentarzu (arkusz otworzył się po ok. 22 s w przebiegu iOS 43994041193) wygląda spójnie, ale przebiegu nie otwierałem. Asercja i teksty bez zmian, tylko czas; ryzyko: dłuższe czekanie maskuje prawdziwy regres wolnego arkusza (nie sprawdzam, czy jest budżet czasu w NFR).
- Scenariusz 95: `assertNotVisible` na tekst 2 (`e2e/scenariusze/95-pu-168-centrum-powiadomien-i-sterowania-bez-rzedu.yaml:28`, linia po otwarciu Centrum sterowania) jest prawdziwa także wtedy, gdy aplikacji nie ma w hierarchii (Centrum otwarte). Ochrona „żadne +1 nie doszło” zostaje po zamknięciu Centrum (`extendedWaitUntil` na tekst 1 i dalej `assertVisible` na 2 po kolejnym stuknięciu w linii :32). Oceniam jako nieosłabioną; zmiana opisana w komentarzu scenariusza. Zachowania Centrum na symulatorze nie sprawdzałem.
- Przebieg iOS 44012392916 (po BX22) i jego wynik: nie sprawdzony (brak dostępu do symulatora; log przebiegu nie czytany).
- Rozbieżność względem zlecenia: scenariusz 31, `e2e/config.yaml`, `czesci.json` i pliki workflow w przyroście nie zmieniono (`git diff --stat` zmienia 6 plików: README, 100, 107, 122, 93, 95). Skoro p95 ≤ 100 ms i asercje 31 mają być bez zmian, to jest zgodne (regex p95 w linii :43 scenariusza 31 bez zmian). Oznaczam jako zgodne z intencją zlecenia, nie jako brak.
- Osobny test reguł scenariuszy (`tests/jakosc/e2e-bx18-scenariusze.test.ts`) sprawdza kolejność kroków, nie wynik na urządzeniu; to wystarczające dla reguł 8 i 11, ale nie dowodzi, że scenariusze 93 i 100 przechodzą.

## Co działa dobrze i należy zachować
- Ścieżka „+1”: jedno zatwierdzenie zamiast dwóch, `stan` zbudowany tym samym `stan()` co `odswiez` (równoważność) i opcjonalny w typie (`src/ekrany/LicznikTypy.ts:50`) — stare atrapy działają; sonda 6 równoległych „+1” spójna.
- Izolacja diagnostyki: `paneleE2e` ładowany warunkowo przez `require` (`src/platforma/tryb-e2e.ts:17`), konteksty `null` w wydaniu (`app/_layout.tsx:123`, `:125`), panele warunkowe (`app/_layout.tsx:150-152`); bundle wydania bez modułu i testID, kontrola pozytywna na buildzie E2E (z `--clear`).
- Test wydania łapie dwa najgroźniejsze błędy (ładowanie modułu paneli i onTouchStart na Wstecz).
- Testy reguł scenariuszy BX18 (tylko odczyt YAML, bez urządzenia) pilnują reguły 8 i zgodności liczby stuknięć z asercjami 31 i 122.
- Zmiana oczekiwań pomiaru BX22 (0 → 1 i 4 → 0) opisana komentarzem, zero pominiętych testów.
- Katalog PU: 344 PU przed i po, bez dodanych i usuniętych; zmieniono wyłącznie 9 odnośników `plik:linia` w kolumnie Pokrycie (PU-008, PU-113, PU-161, PU-168), klasy, kroki i oczekiwane wyniki bez zmian; nowe linie wskazują na asercje (100:46 i :49, 93:25 i :36, 122:54, 95:28 i :32).
- Tożsamość commitów P-507: 6 z 6 zgodne, 0 trailerów.

## Decyzje dla właściciela
Brak. Decyzje techniczne (poprawki 001–004) należą do koordynatora (P-087); w tej sesji nie zapisywano decyzji w `docs/decyzje.md` (pula P-966…P-967 niewykorzystana).

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-001,08-programista-003`
Zasięg: tylko testy (rozszerzenie fiktury równoważności i test rekwizytów `Pressable` w wydaniu); 002 i 004 opcjonalnie, bez wpływu na build 8.

## Wynik sprawdz-raport.mjs
`node sprawdz-raport.mjs docs/jakosc/cp-recenzja-przyrostu.md . --rola 08-programista` → kod wyjścia 0: OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista (pierwsze uruchomienie: 4 błędy, odwołania bez ścieżki; poprawione w raporcie).
