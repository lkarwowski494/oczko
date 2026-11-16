# Audyt: Programista — Oczko — 2026-11-16
Commit: 964095266e9c1611cdfef3f9fa4c2c5ab62b9301 (gałąź `claude/bx15-2026-11-16`, zakres `b686b612..96409526 --not 9b19690`, 8 commitów bez scaleń + scalenie bf76027a) · Tryb: audit (recenzja niezależna CN, tylko odczyt) · Środowisko: Linux, Node + Jest lokalnie (`npx jest --ci`, `npm run typecheck`); symulatora iOS i Maestro nie ma — wyniki scenariuszy tylko z dzienników przebiegu 43851148385 (gałąź `claude/bx13-2026-11-16` @ 5e4b8a205391d199d3251ba35fe4c0edb84257fe). Pełnego `verify` nie uruchamiałem (poza hakiem push, zgodnie z poleceniem). Koszt i zużycie kontekstu sesji: nieodczytane (`get_session` zwraca `used_tokens` 0, pola kosztu brak).

## Podsumowanie
**Werdykt dla kandydata buildu 8: Z UWAGAMI.** Zero P1. Kod produktu (`app/ustawienia.tsx`, `app/wzor.tsx`, panel E2E) jest poprawny, a oba nowe testy padają na starym kodzie z właściwego powodu (powtórzone mutacje A, B i C poniżej). Wszystkie 15 odtagowanych scenariuszy ma zielony wynik całego scenariusza w dzienniku przebiegu 43851148385 (tabela w „Pokrycie”). Jedna uwaga P2: trzy wiersze katalogu (PU-175, 180, 191) są klasy A z dopiskiem „częściowo”, co łamie legendę klas — BX16 już to poprawia, nie blokuje buildu po tej poprawce. Dwie rzeczy do rozstrzygnięcia przy następnym przebiegu iOS: scenariusze 95, 102, 104, 120, 121 (poprawki niezweryfikowane, tag `oczekujacy` zostaje) i zachowanie zdjętych 15 scenariuszy po zmianie w Ustawieniach.

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P2 | D | CN-01 · PU-175, 180, 191: klasa A z „częściowo” w Pokryciu (legenda: „częściowo” = B); bramka tego nie wykrywa | otwarte (BX16 poprawia) |
| 08-programista-002 | P3 | D | CN-02 · `app/wzor.tsx` ma 25 B zapasu do limitu 20 KB; następna zmiana w pliku wymusi podział | otwarte |

## Linia bazowa i założenia
- Baza: `b686b612` (BX13; jego zmiany scenariuszy 77, 89, 93, 95, 111, 119 i reguły swipe zrecenzowane z `git show b686b612`, bo polecenie je wymienia) → `96409526`. Zakres sprawdzony do SHA, nie do czoła gałęzi (BX16 pisze równolegle).
- Zasady kolejności: najpierw własna ocena na kodzie, testach, dziennikach i katalogu; dopiero potem czytane P-932…P-940, sekcje BX13 i BX15 w `docs/jakosc/bx-stan.md` oraz `docs/jakosc/bx15-dowod-czerwony.txt` (porównanie niżej).
- Założenia: wyniki scenariuszy to dzienniki zadań `e2e (część N, iphone/ipad)` przebiegu 43851148385 (zadania 133260259797, 133260259671, 133260259612, 133260259654, 133260259805, pobrane do scratchpada). Ten przebieg poprzedza zmianę `511f161b` w Ustawieniach (patrz „Do sprawdzenia”).
- Wymiary pokrycia roli: ścieżki zapisu — brak zmian (zakres: efekt ostrości, panel E2E, scenariusze, dokumenty); migracje/kopie — brak; granice zaufania — brak nowych; sprzątanie nasłuchów — sprawdzone (`app/ustawienia.tsx:55`).
- Proponowane zmiany statusu w rejestrze założeń: brak.

## Pokrycie (co sprawdzono, czego nie)
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| Zad. 1 · `app/ustawienia.tsx:54` (odczyt `dostep.stan()` przy ostrości, PU-322) | tak, poprawne | Odczyt z kodu: `src/kompozycja/dostep.ts:51` zwraca ten sam obiekt między zmianami, więc `ustawDostep` z identyczną referencją nie renderuje drugi raz; subskrypcja `naZmiane` na linii 55 zwraca sprzątanie (`koniec`) wołane przy blur i odmontowaniu — brak pętli renderu i wycieku. 17 testów montujących Ustawienia zielone |
| Zad. 1 · mutacja A: usunięcie linii 54 w kopii | tak, czerwony | `tests/ekrany/ustawienia-powrot-oferty-bx049.test.tsx:34` pada na starym kodzie («Unable to find an element with testID: ustawienia-pro»), na nowym przechodzi; zgodne z `docs/jakosc/bx15-dowod-czerwony.txt` |
| Zad. 1 · mutacja B: stary mock `dostep.stan` (nowy obiekt przy każdym wywołaniu) przy nowym kodzie | tak | Test 004 w `tests/ekrany/preferencje-trasa.test.tsx` pada (render poza `act`); poprawka mocka (`tests/ekrany/preferencje-trasa.test.tsx:26`, `:34`) to zgodność z prawdziwym `dostepPro`, nie maskowanie błędu: test nie traci żadnej asercji, a stały obiekt odpowiada kontraktowi (`src/kompozycja/dostep.ts:51`) |
| Zad. 1 · `app/wzor.tsx:227`, `src/kompozycja/e2e/notatki-wzoru-stan.tsx`, `src/kompozycja/e2e/panele.tsx` | tak | Panel montowany tylko gdy `paneleE2e` niepuste. Mechanizm wykluczenia z wydania: `src/platforma/tryb-e2e.ts:17` — Metro wstawia `EXPO_PUBLIC_E2E` jako stałą, gałąź `require` znika z pakietu (P-238). Test wykrywający: `tests/wydanie/slady-testowe.test.ts` (lista wzorców «nadąża za kodem», każdy testID `e2e-…` ma wzorzec `e2e-`) + krok `scripts/wydanie/kontrola-ipa.sh:70` szuka bajtów `e2e-` w `main.jsbundle` przed wysyłką; `tests/ekrany/wzor-panel-notatek-e2e-bx15.test.tsx:59` sprawdza tylko ścieżkę `paneleE2e = null` (z atrapą `tryb-e2e`, więc nie dowodzi samego wycięcia). Wniosek: test istnieje, to nie znalezisko |
| Zad. 1 · limit rozmiaru `app/wzor.tsx` | tak | `node docs/architektura/narzedzia/granice.mjs app --domena ../src/domena` → „OK: 35 plików, bez naruszeń”; `wc -c app/wzor.tsx` = 20455 B przy limicie 20480 B → CN-02 |
| Zad. 2 · scenariusze 77, 89, 93, 111 (BX13) | tak | `git show b686b612`: 77 i 89 dodają `swipe` + `assertVisible nav-wstecz` przed stuknięciem (akcja z asercją, nic nie osłabione); 93 dodaje `scrollUntilVisible`; 111 podnosi tylko `timeout` przewijania. Skutek niezweryfikowany: 77 (PU-217), 89 (PU-110), 93 (PU-113) i 111 (PU-138) były czerwone w 43851148385, a poprawki BX13 nie mają jeszcze wyniku iOS (patrz „Do sprawdzenia”) |
| Zad. 2 · scenariusz 95 | tak | Zamiana „0.5%” na „1%” w 4 punktach swipe usuwa błąd składni; czy gest od 1% wysokości (ok. 9 pt) otwiera Centrum powiadomień, nie wiadomo — 95 nie ma wyniku w dziennikach → „Do sprawdzenia” |
| Zad. 2 · scenariusz 119 | tak | Regex `.*[Pp]age N of M` zamiast dokładnego tekstu: etykieta `wzor-strona` to `wzor.strona_a11y` (`src/ekrany/WzorPrzegladarka.tsx:212`; w `src/i18n/slowniki/en.json` «Pattern page 1 of 1»), więc poluzowanie jest uzasadnione kodem; asercja nadal wymaga numeru strony i liczby stron. Niezweryfikowane w iOS (PU-057 czerwony w 43851148385) |
| Zad. 2 · podprzepływy `dodaj-czesc-cel.yaml`, `otworz-wzor-pdf.yaml` | tak | Po jednym `scrollUntilVisible` przed stuknięciem (AX5: elementy poza ekranem nie są w hierarchii); przy zwykłym tekście krok kończy się od razu; żadna asercja nie usunięta. Test `tests/jakosc/e2e-ax5-wiersz-czesci-bx15.test.ts` (czerwony przed zmianą według `docs/jakosc/bx15-dowod-czerwony.txt`) |
| Zad. 2 · scenariusze 102, 104, 121 | tak | Asercja `e2e-wzor-notatki` z tekstem `notes: row 1: k2tog here` (`e2e/scenariusze/104-pu-067-notatka-przy-rzedzie.yaml:37`, `:45`; `e2e/scenariusze/102-pu-292-przywroc-usuniety-wzor-z-zakresleniami.yaml:40`, `:66`; `e2e/scenariusze/121-pu-135-ax5-wzor-z-notatka-tytul-karta-worda-projekt.yaml:41`). 104: oczekiwany wynik PU-067 («notatka przy rzędzie, także po ponownym otwarciu») nadal sprawdzany przed zamknięciem i po ponownym otwarciu wzoru; usunięte stuknięcie w chip i arkusz (niewidoczne dla XCUI) — luka nazwana w Pokryciu PU-067 i PU-292, kontrola chipa i arkusza zostaje w `tests/ekrany/wzor-trasa-notatki.test.tsx:53`. Asercja dowodzi danych przekazanych nakładce (`chipy`), nie narysowanego chipa — luka jawna, nie obejście |
| Zad. 2 · reguła składni swipe `tests/jakosc/maestro-runner.ts:96` (linie 103–105) | tak | Mutacja C: poluzowanie regexu do `\d{1,3}(\.\d+)?%` w kopii → pułapka «składnia swipe (BX-048)» w `tests/jakosc/maestro-scenariusze.test.ts:107` czerwona (1 padł, 22 przeszły); regex przywrócony. Interpreter `Runner` akceptuje tylko całkowite procenty |
| Zad. 3 · 15 odtagowanych scenariuszy | tak | Tabela niżej: każdy ma dokładnie jedno `[Passed]` całego scenariusza i brak `[Failed]` w dziennikach 5 zadań e2e |
| Zad. 3 · `e2e/czesci.json` | tak | Zmienione wagi 13 scenariuszy (85–88, 96–99, 101, 106, 107, 117, 118); 44 i 46 bez zmian (pomiar #140), żaden scenariusz nie wyłączony; `tests/jakosc/e2e-czesci.test.ts` zielony. Wagi zgodne z czasami z dziennika (np. 98 = 263 s = 4 min 23 s, 118 = 317 s = 5 min 17 s) |
| Zad. 4 · katalog `docs/jakosc/przypadki-uzycia.md` | tak | Skrypt porównujący wiersze (344 PU w obu wersjach, te same ID): kolumny 1–5 (opis, kroki, wynik) bez zmian w żadnym wierszu; klasa B→A w 12 PU (052, 104, 107, 108, 109, 165, 170, 175, 180, 191, 288, 296); reszta zmian to tylko kolumna Pokrycie (067, 292: luka chipa; 143, 144, 150: „informacyjny, zielony w przebiegu”; 227: numer linii; PU-162: z BX14, patrz „Do sprawdzenia”). Liczby A=121, B=163 (145 z testem, 17 oczekujących, 1 do zaprogramowania) zgodne z wierszami; `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` → „Kontrola 2: zielona”. PU-175, 180, 191: CN-01 |
| Zad. 5 · tożsamość commitów | tak | `git log --format='%h %an <%ae> | %cn <%ce>'` dla 8 commitów i scalenia bf76027a: wszystkie „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)'` bez trailerów (0 wierszy) |
| Zad. 5 · P-934…P-940 vs kod | tak | Każda decyzja zgodna z kodem (szczegóły w „Znaleziska” i „Co działa dobrze”); `git diff -U0 b686b612 96409526 -- docs/decyzje.md` zawiera same dodane wiersze (P-928…P-931 z BX14, P-934…P-940) — starsze decyzje nietknięte |
| Poza zakresem / niesprawdzone | nie | Działanie scenariuszy 77, 89, 93, 95, 102, 104, 111, 119, 120, 121 na symulatorze (brak symulatora; wyniki dopiero w następnym przebiegu); lint (`npm run lint` obejmuje tylko `src/dane`, bez zmian w zakresie); pełny `verify` (poza hakiem push) |

### Wynik zad. 3: odtagowane scenariusze w dzienniku przebiegu 43851148385
| Scen. | Nazwa (PU) | Wynik w dzienniku | Zadanie |
|---|---|---|---|
| 44 | BR-WZR-005/S2 (iPad) | `[Passed]` 1 m 16 s | ipad część 1 |
| 46 | BR-WZR-005/S4 (iPad) | `[Passed]` 1 m 7 s | ipad część 1 |
| 117 | PU-150 (iPad) | `[Passed]` 1 m 39 s | ipad część 1 |
| 85 | PU-104 | `[Passed]` 1 m 49 s | iphone część 4 |
| 86 | PU-107 | `[Passed]` 2 m 13 s | iphone część 3 |
| 87 | PU-108 | `[Passed]` 1 m 28 s | iphone część 1 |
| 88 | PU-109 | `[Passed]` 2 m 28 s | iphone część 4 |
| 96 | PU-170 | `[Passed]` 1 m 30 s | iphone część 1 |
| 97 | PU-165 | `[Passed]` 1 m 25 s | iphone część 4 |
| 98 | PU-180 | `[Passed]` 4 m 23 s | iphone część 2 |
| 99 | PU-052 | `[Passed]` 1 m 51 s | iphone część 4 |
| 101 | PU-296 | `[Passed]` 2 m 21 s | iphone część 4 |
| 106 | PU-191 | `[Passed]` 1 m 38 s | iphone część 1 |
| 107 | PU-288 | `[Passed]` 2 m 29 s | iphone część 1 |
| 118 | PU-175 | `[Passed]` 5 m 17 s | iphone część 1 |

Wynik: 15 z 15 potwierdzone, zero scenariuszy bez potwierdzenia (brak P1). Uwaga o zasięgu: 44, 46, 117 biegną w zadaniu iPada, które jest informacyjne (P-225), więc nie wchodzą do bramki; do bramki weszło 12 scenariuszy iPhone'a.

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/jakosc/cn-recenzja-bx15.md /home/user/oczko --rola 08-programista` → kod 0: „OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista”.

`git status --porcelain` na końcu pracy: przed commitem jedyna pozycja `?? docs/jakosc/cn-recenzja-bx15.md` (ten raport); pliki śledzone nietknięte, kopia robocza z mutacjami usunięta (`git worktree list` → tylko katalog główny).

Komendy i kody wyjścia (lokalnie, gałąź `claude/cn-recenzja-bx15-2026-11-16`, bez zmian śledzonych plików poza tym raportem):
- `npx jest --ci tests/jakosc/przypadki-uzycia.test.ts tests/jakosc/bramka-przypadki-uzycia.test.ts tests/jakosc/e2e-czesci.test.ts tests/jakosc/maestro-scenariusze.test.ts tests/jakosc/e2e-ax5-wiersz-czesci-bx15.test.ts` → kod 0, 5 zestawów, 145 testów.
- `npx jest --ci tests/ekrany/ustawienia-powrot-oferty-bx049.test.tsx tests/ekrany/wzor-panel-notatek-e2e-bx15.test.tsx tests/ekrany/e2e-pomiar-plus-panel-wejscia-bx15.test.tsx tests/ekrany/preferencje-trasa.test.tsx tests/wydanie/slady-testowe.test.ts` → kod 0, 5 zestawów, 21 testów.
- `npm run typecheck` → kod 0.
- `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` → „Kontrola 2: zielona”.
- `node docs/architektura/narzedzia/granice.mjs app --domena ../src/domena` → „OK: 35 plików, bez naruszeń”.
- Mutacje (A, B, C) wykonane tylko w kopii roboczej w scratchpadzie (`git worktree`), bez commitu, kopia usunięta.
- Skan zakresu: grep `.skip(`, `.only(`, `xit(`, `xdescribe(`, `@ts-ignore`, `expect(true)` w dodanych liniach → 0 trafień (jedyne trafienia to `eslint-disable` z komentarzem w nowych testach); wzorce sekretów w dodanych liniach → 0 trafień prawdziwych (3 trafienia to wyrażenia w testach, które sprawdzają brak sekretów); `git diff --check` → 0 błędów.

## Stosowalność listy kontrolnej
| Pozycja | Status (dotyczy / nie dotyczy + powód / decyzja D-xx) | Wynik (ok / znalezisko ID / nie sprawdzono + powód) |
|---|---|---|
| DEV-01 | dotyczy w części: jedyna logika nowa to `opisNotatekWzoru` (formatowanie tekstu panelu E2E) | ok: test w `tests/ekrany/wzor-panel-notatek-e2e-bx15.test.tsx:54` (bez notatek, kilka notatek) |
| DEV-02 | dotyczy | ok: 6 z 6 commitów zmieniających zachowanie lub scenariusz ma test w tym samym commicie (511f161b: test + dowód czerwony; 2eb39efe, 8bbadb84: `e2e-ax5-wiersz-czesci-bx15.test.ts`; 96409526: test panelu; 68bc28a7: sama poprawka testu; 099d4568, 598139e9: tag i wagi pilnuje istniejący `e2e-czesci.test.ts`) |
| DEV-03 | dotyczy | ok z uwagą: brak pominiętych testów; asercje scenariuszy: 104 traci stuknięcie w chip (nazwana luka, kontrola w Jest), 119 poluzowany regex uzasadniony etykietą w kodzie; CN-01 (katalog przepuszcza A z „częściowo”) |
| DEV-04 | dotyczy | ok: komendy i kody w „Kontrola dowodów”; lint nie sprawdzony (`npm run lint` tylko `src/dane`, brak zmian w zakresie); pełny `verify` poza zakresem tej sesji (hak push autora, P-937) |
| DEV-05 | nie dotyczy: zakres nie zmienia zapisu danych | — |
| DEV-06 | nie dotyczy: brak migracji i kopii w zakresie | — |
| DEV-07 | nie dotyczy: brak mapowania brakujących danych | — |
| DEV-08 | nie dotyczy: brak dat w nowym kodzie | — |
| DEV-09 | dotyczy marginalnie: `as PaneleE2e` na `require` w `src/platforma/tryb-e2e.ts:17` (istniejące, nie dane z zewnątrz) | ok |
| DEV-10 | dotyczy marginalnie: brak nowych `catch` w zakresie | ok |
| DEV-11 | dotyczy: panel E2E ma stałe style w `src/kompozycja/e2e/notatki-wzoru-stan.tsx` | ok: kod tylko dla builda E2E (jak inne panele, `slady-testowe.mjs`), poza systemem projektu z założenia; brak kolorów hex |
| DEV-12 | dotyczy: panel pokazuje napis `notes: …` bez `t()` | ok: panele E2E bez `t()` z założenia (komentarz w `scripts/wydanie/slady-testowe.mjs`), poza wydaniem |
| DEV-13 | nie dotyczy: brak nowych progów produktu | — |
| DEV-14 | dotyczy | ok: skan dodanych linii zakresu, 0 sekretów |
| DEV-15 | dotyczy: efekt ostrości w `app/ustawienia.tsx:54-55` | ok: `naZmiane` zwraca sprzątanie, test blur/focus wywołuje je; `useFocusEffect` zależy od `[kontener, z, preferencje]`, bez pętli |
| DEV-16 | nie dotyczy: brak wartości z jednostką w nowym kodzie produktu | — |

## Znaleziska (szczegóły)

### 08-programista-001 · CN-01 · Trzy wiersze katalogu (PU-175, 180, 191) są klasy A, choć Pokrycie mówi „częściowo”, więc zestaw A=121 liczy je jako w pełni zautomatyzowane
- Pozycja listy kontrolnej: DEV-03 (dowód, który przechodzi bez pokrywania wyniku; dokładniejszej pozycji brak)
- Poziom: P2
- Realność: realny · Pewność: wysoka
- Rodzaj: D
- Dowód: `docs/jakosc/przypadki-uzycia.md:350` (PU-175), `docs/jakosc/przypadki-uzycia.md:362` (PU-180), `docs/jakosc/przypadki-uzycia.md:378` (PU-191): kolumna Klasa = A i jednocześnie Pokrycie zaczyna wymieniać „częściowo” z lukami (ucięcia tekstu, strony z linków poza Maestro, brak widoczności prośby ATT dla scenariusza 106). Legenda klas: `docs/jakosc/przypadki-uzycia.md:6` (A) i `docs/jakosc/przypadki-uzycia.md:7` (B: „częściowo” należy do B). Kontrola: `npx jest --ci tests/jakosc/przypadki-uzycia.test.ts tests/jakosc/bramka-przypadki-uzycia.test.ts` → kod 0 mimo tego
- Mechanizm: skrypt porównujący wiersze starej i nowej wersji katalogu → 3 PU z klasą A i słowem „częściowo” w Pokryciu (stara wersja: 0); testy bramki nie zabraniają „częściowo” w klasie A
- Powraca: nie (nowe w BX15; P-938 wybrało opcję (a) świadomie i zapisało cofnięcie jednym zdaniem)
- Wzorzec lub źródło: legenda klas katalogu (wyżej), zasada 22 roli 07
- Kroki w aplikacji: nie dotyczy użytkownika; wpływa na to, co właściciel czyta jako „zautomatyzowane w całości” przy bramce przed TestFlight i App Review
- Opcje: (a) PU-175, 180 i 191 z powrotem do klasy B z częścią „scenariusz zielony”: zgodne z legendą (A=118, B=166), ale B wymaga „z testem:” w `tests/` albo wpisu „oczekujący”/„do zaprogramowania” — test w `tests/` ma dziś tylko PU-191 (`tests/jakosc/pu-191-bez-sdk-reklam-i-sledzenia.test.ts`), więc PU-175 i PU-180 wymagają testu Jest dla luki albo przeniesienia luki do pozycji F; (b) zostawić A i zmienić legendę tak, by A dopuszczało nazwaną lukę — tańsze, ale osłabia gwarancję klasy A. Rekomendacja: (a); polecenie wskazuje, że to zakres BX16 (tu tylko odnotowane), przy czym PU-175 i PU-180 wymagają od BX16 dodatkowej decyzji o pokryciu luki
- Test akceptacyjny: żaden wiersz klasy A nie zawiera „częściowo” w Pokryciu (test w `tests/jakosc/przypadki-uzycia.test.ts` pada na takim wierszu); liczby w nagłówku katalogu zgodne ze skryptem bramki
- Status: otwarte (poprawia BX16)

Jedno zdanie naprawy: przenieść PU-175, 180 i 191 z powrotem do klasy B (z testem w `tests/` dla luki albo pozycją F) albo zmienić legendę, i dodać do `tests/jakosc/przypadki-uzycia.test.ts` regułę, że wiersz klasy A nie zawiera słowa „częściowo”.

### 08-programista-002 · CN-02 · `app/wzor.tsx` ma 25 B zapasu do limitu 20 KB, więc następna zmiana w tym pliku zatrzyma bramkę rozmiaru
- Pozycja listy kontrolnej: poza listą (bramka rozmiaru `docs/architektura/narzedzia/granice.mjs`)
- Poziom: P3
- Realność: brzegowy · Pewność: wysoka
- Rodzaj: D
- Dowód: `wc -c app/wzor.tsx` → 20455 przy limicie 20480 B (`ROZMIAR`); linia panelu `app/wzor.tsx:227`; autor skrócił dwa komentarze, żeby zmieścić jedną linię (baza miała 20456 B)
- Mechanizm: `node docs/architektura/narzedzia/granice.mjs app --domena ../src/domena` → „OK: 35 plików, bez naruszeń” dziś; jakakolwiek kolejna linia w `app/wzor.tsx` przekroczy limit
- Powraca: nie
- Wzorzec lub źródło: limit rozmiaru plików ekranów w bramce architektury (ADR roli 05)
- Kroki w aplikacji: nie dotyczy użytkownika; dotyczy tempa następnych zmian we wzorze
- Opcje: (a) wydzielić z `app/wzor.tsx` fragment (np. blok paneli E2E i dane `chipy`) do `src/ekrany/` przy najbliższej zmianie w pliku — bez ryzyka teraz; (b) podnieść limit — osłabia bramkę. Rekomendacja: (a), przy następnej zmianie, nie w tym buildzie
- Test akceptacyjny: `granice.mjs` zielone z zapasem ≥ 1 KB w `app/wzor.tsx`
- Status: otwarte

## Do sprawdzenia (pewność ≤ 80%)
- **Odtagowane scenariusze po zmianie w Ustawieniach (pewność ok. 75%, że bez skutku).** Zielone wyniki pochodzą z 5e4b8a2, sprzed `511f161b` (efekt ostrości w `app/ustawienia.tsx`). Scenariusze 98 (PU-180), 99 (PU-052), 106 (PU-191), 118 (PU-175) przechodzą przez Ustawienia. Zmiana ustawia ten sam obiekt, więc skutku nie oczekuję, ale odtagowanie wprowadziło je do bramki (poza iPadem), więc jeden czerwony wynik zatrzyma TestFlight. Do potwierdzenia pierwszym przebiegiem iOS na `claude/bx15-2026-11-16` albo następcy.
- **Jedna zielona próba na scenariusz (pewność ok. 70%, że stabilne).** Najdłuższe: 118 (5 m 17 s), 98 (4 m 23 s). Wagi `e2e/czesci.json` zrównoważone z jednego pomiaru; bez drugiego przebiegu nie ma danych o rozrzucie.
- **77, 89, 93, 95, 102, 104, 111, 119, 120, 121: poprawki niezweryfikowane (tag `oczekujacy` zostaje, poza bramką).** 77, 89, 93, 111, 119: poprawki BX13 bez wyniku po zmianie. 95: czy start gestu od 1% wysokości otwiera Centrum powiadomień — nie sprawdzono; 102/104/121: panel `e2e-wzor-notatki` prezentuje dane przekazane nakładce, nie narysowany chip; dostępność chipa dla VoiceOver [DO USTALENIA] na urządzeniu (BX-051); 120: `scrollUntilVisible` w podprzepływie bez wyniku iOS.
- **Wiersz PU-162 w katalogu** zmienił się z „do zaprogramowania” na „z testem” (nagłówek 144→145). To nie jest zmiana B↔A z BX15: pochodzi z commitu `e0f20ef8` (BX14, scalony w bf76027a), zrecenzowanego osobno (CM, P-929…P-931). Odnotowuję, że nie mieści się w regule „tylko B↔A” polecenia BX15.
- **Scenariusz 31 (NFR-WYD-001, p95).** Czerwony w 43851148385; BX15 nie zmienia scenariusza ani progu (P-936 to analiza i opcje bez zmiany kodu). Poza zakresem tej recenzji; wynik wpływa na bramkę, więc właściciel wskazany w „Decyzje dla właściciela”.

## Co działa dobrze i należy zachować
- Test z mutacją własną: `tests/ekrany/ustawienia-powrot-oferty-bx049.test.tsx` używa prawdziwego `app/ustawienia.tsx` i prawdziwego `dostepPro`, a symuluje blur/focus przez wywołanie sprzątania i ponowne wywołanie efektu; zwyczaj z `docs/jakosc/bx15-dowod-czerwony.txt` (dowód czerwony przed poprawką) zostaje.
- Wykluczenie panelu E2E z wydania ma dwie niezależne warstwy: wstawienie stałej przez Metro (`src/platforma/tryb-e2e.ts:17`) i kontrola bajtów paczki w `scripts/wydanie/kontrola-ipa.sh:70` z testem «lista nadąża za kodem» (`tests/wydanie/slady-testowe.test.ts`).
- Reguła składni swipe z pułapką i mutacją (`tests/jakosc/maestro-runner.ts:103`): czerwieni się przy poluzowaniu.
- Poprawki AX5 jako jeden `scrollUntilVisible` w podprzepływie zamiast kopii scenariusza.
- Uczciwość opisów: P-938 i P-939 nazywają luki (chip PDFKit, „częściowo”, 143/144/150 zostają B) i podają cofnięcie jednym zdaniem; tożsamość commitów zgodna z P-507 we wszystkich commitach zakresu.

## Decyzje dla właściciela
Brak decyzji do podjęcia po stronie właściciela (koszty, konta, scalenie, wysyłka do Apple) w zakresie tej recenzji. Do decyzji koordynatora (P-087): przy CN-01 wybór (a) albo (b); przy 31 (NFR-WYD-001) opcje A lub B z P-936. Moje zapisy w `docs/decyzje.md` nie powstały (tryb audit, tylko raport).

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-001`

(CN-01 realizuje i tak BX16; CN-02 przy następnej zmianie `app/wzor.tsx`.)
