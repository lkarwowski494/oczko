# Audyt: Programista — Oczko — 2026-11-16
Commit: 964095266e9c1611cdfef3f9fa4c2c5ab62b9301 (gałąź `claude/bx15-2026-11-16`, zakres `b686b612..96409526 --not 9b19690`, 8 commitów bez scaleń + scalenie bf76027a; rozszerzenie KO-126: commit bf133ae2 (BX16, scenariusz 122), dziecko 96409526) · Tryb: audit (recenzja niezależna CN, tylko odczyt) · Środowisko: Linux, Node + Jest lokalnie (`npx jest --ci`, `npm run typecheck`); symulatora iOS i Maestro nie ma — wyniki scenariuszy tylko z dzienników przebiegu 43851148385 (gałąź `claude/bx13-2026-11-16` @ 5e4b8a205391d199d3251ba35fe4c0edb84257fe). Pełnego `verify` nie uruchamiałem (poza hakiem push, zgodnie z poleceniem). Koszt i zużycie kontekstu sesji: nieodczytane (`get_session` zwraca `used_tokens` 0, pola kosztu brak).

## Podsumowanie
**Werdykt dla kandydata buildu 8: Z UWAGAMI.** Zero P1. Kod produktu (`app/ustawienia.tsx`, `app/wzor.tsx`, panel E2E) jest poprawny, a oba nowe testy padają na starym kodzie z właściwego powodu (powtórzone mutacje A, B i C poniżej). Wszystkie 15 odtagowanych scenariuszy ma zielony wynik całego scenariusza w dzienniku przebiegu 43851148385 (tabela w „Pokrycie”). Jedna uwaga P2: trzy wiersze katalogu (PU-175, 180, 191) są klasy A z dopiskiem „częściowo”, co łamie legendę klas — BX16 już to poprawia, nie blokuje buildu po tej poprawce. Rozszerzenie KO-126 (bf133ae, scenariusz 122): zero P1 i zero P2; test wydania pada przy trzech mutacjach wycieku do wydania, a prawdziwy bundel wydania nie zawiera nowego klucza; trzy uwagi P3 (CN-03…CN-05) o tym, co scenariusz 122 obiecuje w nagłówku i w katalogu. Dwie rzeczy do rozstrzygnięcia przy następnym przebiegu iOS: scenariusze 95, 102, 104, 120, 121 (poprawki niezweryfikowane, tag `oczekujacy` zostaje) i zachowanie zdjętych 15 scenariuszy po zmianie w Ustawieniach.

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P2 | D | CN-01 · PU-175, 180, 191: klasa A z „częściowo” w Pokryciu (legenda: „częściowo” = B); bramka tego nie wykrywa | otwarte (BX16 poprawia) |
| 08-programista-002 | P3 | D | CN-02 · `app/wzor.tsx` ma 25 B zapasu do limitu 20 KB; następna zmiana w pliku wymusi podział | otwarte |
| 08-programista-003 | P3 | D | CN-03 · bf133ae · scenariusz 122 jest «informacyjny» tylko co do odczytu p95; jego asercje wartości są w bramce TestFlight | otwarte |
| 08-programista-004 | P3 | D | CN-04 · bf133ae · Pokrycie PU-161 wskazuje linię 122 z odczytem `optional` bez progu jako pokrycie wyniku „p95 ≤ 100 ms” | otwarte |
| 08-programista-005 | P3 | D | CN-05 · bf133ae · scenariusz 122 kopiuje kroki startu z podprzepływów; żaden test nie pilnuje zgodności | otwarte |

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

### Wynik rozszerzenia KO-126: commit bf133ae2 (BX16, scenariusz 122)
Commit `bf133ae2` (dziecko 96409526, 17 plików) przeczytany wg zasady: najpierw własna ocena kodu i testów, potem P-941 i `docs/jakosc/bx16-dowod-czerwony.txt`.
- **Kod produktu.** `app/licznik.tsx:17` importuje `bezDiagnostykiLicznika`, `app/licznik.tsx:62` (`diagnostyka={diagnostykaWejsc?.diagnostykaLicznika …}`) i `app/licznik.tsx:82` (render `PanelLicznika`) używają jednej stałej `diagnostykaWejsc = paneleE2e && !bezDiagnostykiLicznika() ? paneleE2e : null`. Bez argumentu jest to dokładnie `paneleE2e` (zero zmiany zachowania), w wydaniu `paneleE2e` jest `null`, więc `null` niezależnie od argumentu. `src/platforma/tryb-e2e.ts` dodaje jedną funkcję przez `argument()`, które zwraca `null` poza `EXPO_PUBLIC_E2E=1`. Rozmiary: `app/licznik.tsx` 6661 B, `src/platforma/tryb-e2e.ts` 5742 B; `granice.mjs` → «OK: 35 plików, bez naruszeń».
- **Mutacje testu wydania** (kopia robocza `git worktree` w scratchpadzie na bf133ae, `npx jest --ci tests/ekrany/e2e-licznik-bez-diagnostyki-bx16-wydanie.test.tsx`; baza: 13 z 13 zielone w 3 zestawach BX16):
  - M1: `argument()` bez warunku `!E2E` → pierwszy test czerwony (`Expected: false`, `Received: true`);
  - M2: `paneleE2e` ładowane bezwarunkowo → czerwony (otrzymano obiekt paneli zamiast `null`);
  - M3: `app/licznik.tsx` ładuje panel mimo `paneleE2e === null` → czerwony (znaleziono węzeł `e2e-licznik-wejscia`);
  - drugi test w pliku karmi `slady-testowe.mjs` zmyślonymi buforami (sprawdza skaner, nie prawdziwą paczkę), więc przy M1–M3 zostaje zielony; to właściwy podział: wyciek chwyta pierwszy test, a skaner paczki drugi.
- **Prawdziwy bundel wydania:** `node scripts/jakosc/slady-wydania.mjs` na bf133ae (eksport Metro) → „bez śladów trybu testowego (12 wzorców)”, kod 0 (w tym brak `oczkoE2eBezDiagnostykiLicznika`). Wariantu `--e2e` nie uruchamiałem.
- **Scenariusz 122** (`e2e/scenariusze/122-nfr-wyd-001-reakcja-licznika-bez-panelu-wejscia.yaml`): kroki 21 stuknięć jak w 31; odczyt `e2e-pomiar-plus` w linii 56 ma `optional: true` i regex bez progu. Scenariusz nie ma tagu `oczekujacy`, więc wchodzi do bramki (zob. CN-03). Tag `pomiar` nie ma w `.github/workflows/jakosc-ios.yml` żadnej obsługi (grep → 0 trafień).
- **Scenariusz 31 i próg 100 ms:** `git diff 96409526 bf133ae` dla `31-nfr-wyd-001-reakcja-licznika.yaml` i `e2e/scenariusze/subflows` pusty; w katalogu zmienia się tylko Pokrycie PU-161 (dopisane dwie linie 122).
- **Wagi i testy:** `e2e/czesci.json` +1 wpis (165 s, szacunek, jak 31); `tests/jakosc/e2e-noc-2026-11-02.test.ts` dopisuje «122» do listy bez pomiaru. Brak pomiaru wagi 122 odnotowany niżej w „Do sprawdzenia”.
- **Tożsamość:** autor i committer zgodni z P-507, brak linii `Co-Authored-By` i `Claude-Session` (`git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 96409526..bf133ae` → pusta wartość).

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/jakosc/cn-recenzja-bx15.md /home/user/oczko --rola 08-programista` → kod 0: „OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista”.

Po rozszerzeniu KO-126 (bf133ae): ten sam sprawdzacz w kopii roboczej na bf133ae2 (scenariusz 122 i `app/licznik.tsx` w wersji z commitu) → kod 0; w drzewie tej gałęzi (96409526 + raport) kończy się kodem 1 wyłącznie dla czterech odwołań do pliku scenariusza 122, którego tu nie ma (jest tylko w bf133ae). To oczekiwane, a nie błąd raportu.

`git status --porcelain` na końcu pracy: przed commitem jedyna pozycja `?? docs/jakosc/cn-recenzja-bx15.md` (ten raport); pliki śledzone nietknięte, kopia robocza z mutacjami usunięta (`git worktree list` → tylko katalog główny).

Komendy i kody wyjścia (lokalnie, gałąź `claude/cn-recenzja-bx15-2026-11-16`, bez zmian śledzonych plików poza tym raportem):
- `npx jest --ci tests/jakosc/przypadki-uzycia.test.ts tests/jakosc/bramka-przypadki-uzycia.test.ts tests/jakosc/e2e-czesci.test.ts tests/jakosc/maestro-scenariusze.test.ts tests/jakosc/e2e-ax5-wiersz-czesci-bx15.test.ts` → kod 0, 5 zestawów, 145 testów.
- `npx jest --ci tests/ekrany/ustawienia-powrot-oferty-bx049.test.tsx tests/ekrany/wzor-panel-notatek-e2e-bx15.test.tsx tests/ekrany/e2e-pomiar-plus-panel-wejscia-bx15.test.tsx tests/ekrany/preferencje-trasa.test.tsx tests/wydanie/slady-testowe.test.ts` → kod 0, 5 zestawów, 21 testów.
- `npm run typecheck` → kod 0.
- `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` → „Kontrola 2: zielona”.
- `node docs/architektura/narzedzia/granice.mjs app --domena ../src/domena` → „OK: 35 plików, bez naruszeń”.
- KO-126 (bf133ae): `npx jest --ci tests/adaptery/tryb-e2e-bez-diagnostyki-bx16.test.ts tests/ekrany/e2e-licznik-bez-diagnostyki-bx16.test.tsx tests/ekrany/e2e-licznik-bez-diagnostyki-bx16-wydanie.test.tsx` → kod 0, 3 zestawy, 13 testów; mutacje M1–M3 → czerwone; `node scripts/jakosc/slady-wydania.mjs` → kod 0.
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
| DEV-02 (bf133ae) | dotyczy | ok: nowy kod ma 3 nowe zestawy testów i dowód czerwony → zielony w `docs/jakosc/bx16-dowod-czerwony.txt` |
| DEV-03 (bf133ae) | dotyczy | uwaga: CN-03, CN-04 (opis i pokrycie wskazują odczyt bez progu), CN-05 (kopia kroków bez testu zgodności) |

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

### 08-programista-003 · CN-03 · bf133ae · Scenariusz 122 jest «informacyjny» tylko co do odczytu p95; jego asercje wartości licznika wchodzą do bramki TestFlight
- Pozycja listy kontrolnej: DEV-03 (opis obiecuje więcej niż dowód)
- Poziom: P3
- Realność: brzegowy · Pewność: wysoka
- Rodzaj: D
- Dowód: nagłówek i tytuł `e2e/scenariusze/122-nfr-wyd-001-reakcja-licznika-bez-panelu-wejscia.yaml:4` («Informacyjny … Funkcjonalne asercje wartości licznika zostają») i nazwa scenariusza mówią «wynik informacyjny»; tagi: NFR-WYD-001, pomiar, stan-licznika, PU-161, bez `oczekujacy`; `.github/workflows/jakosc-ios.yml:5` (bramką jest każdy scenariusz telefonu poza tagiem `oczekujacy`); `grep pomiar .github/workflows/jakosc-ios.yml` → 0 trafień, czyli tag `pomiar` nic nie zwalnia z bramki
- Mechanizm: 122 powtarza 20 stuknięć i 22 asercje wartości z 31 (np. `e2e/scenariusze/122-nfr-wyd-001-reakcja-licznika-bez-panelu-wejscia.yaml:53`), więc każde odchylenie sterownika (przestój XCTest, jak w KO-109) czerwieni część i blokuje TestFlight; ten sam przebieg dwukrotnie ćwiczy tę samą ścieżkę co 31. Bez pomiaru wagi 165 s (szacunek) 122 może też przesunąć czas części
- Powraca: nie
- Wzorzec lub źródło: P-941 opcja (b) przyjęta świadomie i opisana uczciwie w decyzji («mogą wywrócić scenariusz»); niezgodny jest tylko krótszy opis w samym pliku
- Kroki w aplikacji: nie dotyczy użytkownika
- Opcje: (a) w nagłówku i nazwie napisać «odczyt p95 informacyjny, asercje wartości w bramce» — zero ryzyka, tylko opis; (b) dodać tag `oczekujacy` — niemożliwe wg P-941 (PU-161 klasy A wymaga scenariusza bez tego tagu), chyba że Pokrycie PU-161 zostaje przy 31 (wtedy 122 nie jest w Pokryciu i tag jest możliwy; to rozwiązuje też CN-04); (c) osobna grupa poza bramką wymaga zmiany workflowu, którą polecenie BX16 zabroniło. Rekomendacja: (a) teraz, (b) razem z CN-04 po pierwszym przebiegu 122
- Test akceptacyjny: tytuł i nagłówek 122 nie obiecują «informacyjności» całego scenariusza
- Status: otwarte

Jedno zdanie naprawy: zmienić nazwę i nagłówek scenariusza 122 na «odczyt p95 informacyjny, asercje wartości licznika w bramce» (albo przy CN-04 nadać mu tag `oczekujacy`).

### 08-programista-004 · CN-04 · bf133ae · Pokrycie PU-161 wskazuje odczyt `optional` bez progu jako pokrycie wyniku „p95 ≤ 100 ms”
- Pozycja listy kontrolnej: DEV-03 (dowód, który przechodzi bez pokrywania wyniku)
- Poziom: P3
- Realność: brzegowy · Pewność: wysoka
- Rodzaj: D
- Dowód: `docs/jakosc/przypadki-uzycia.md` PU-161 (klasa A) ma w Pokryciu dopisane `e2e/scenariusze/122-nfr-wyd-001-reakcja-licznika-bez-panelu-wejscia.yaml:53` i `e2e/scenariusze/122-nfr-wyd-001-reakcja-licznika-bez-panelu-wejscia.yaml:56`; linia 56 to `assertVisible … optional: true` z regexem `[0-9]+`, bez progu 100 ms; próg pilnuje wyłącznie `e2e/scenariusze/31-nfr-wyd-001-reakcja-licznika.yaml:43`
- Mechanizm: bramka katalogu liczy wskazanie linii scenariusza, nie rodzaj asercji (`optional` w `scripts/jakosc/bramka-przypadki-uzycia.mjs` nie występuje), więc odczyt bez progu wygląda jak pokrycie wyniku „p95 ≤ 100 ms”; klasa A pozostaje prawdziwa dzięki 31:43, ale lista wprowadza w błąd
- Powraca: nie
- Wzorzec lub źródło: legenda klas katalogu `docs/jakosc/przypadki-uzycia.md:6`; P-941 mówi, że 122 «musi być w Pokryciu PU-161»
- Kroki w aplikacji: nie dotyczy użytkownika
- Opcje: (a) zostawić tylko linię :53 (wartość 21) i dopisać słowami «odczyt p95 informacyjny» — zgodne z P-941; (b) usunąć 122 z Pokrycia razem z nadaniem mu tagu `oczekujacy` (zob. CN-03 (b)) — czystsze, ale cofa przyjętą decyzję P-941. Rekomendacja: (a)
- Test akceptacyjny: w Pokryciu PU-161 żaden wskaźnik nie wskazuje asercji `optional`
- Status: otwarte

Jedno zdanie naprawy: usunąć z Pokrycia PU-161 wskazanie linii 56 scenariusza 122 (zostawić 53) i opisać je jako odczyt informacyjny.

### 08-programista-005 · CN-05 · bf133ae · Scenariusz 122 kopiuje kroki startu z `start-czysty-dzis.yaml` i `start-czysty.yaml` bez testu zgodności
- Pozycja listy kontrolnej: poza listą (spójność scenariuszy)
- Poziom: P3
- Realność: teoretyczny · Pewność: średnia
- Rodzaj: D
- Dowód: `e2e/scenariusze/122-nfr-wyd-001-reakcja-licznika-bez-panelu-wejscia.yaml:12` (własny `launchApp` z argumentami) i kolejne linie powtarzają kroki podprzepływów `subflows/start-czysty-dzis.yaml` i `subflows/start-czysty.yaml` (w tym `scrollUntilVisible … timeout: 90000` z poprawki KO-109); plik 122 sam zapowiada tę kopię w komentarzu; w zmienionych testach brak sprawdzenia, że kroki kopii równają się krokom podprzepływów
- Mechanizm: gdy BX poprawi start w podprzepływach (jak przy AX5, P-608 G3 albo KO-109), 122 po cichu zostanie ze starym startem i zacznie padać (część czerwona) albo mierzyć inny start niż 31
- Powraca: nie (pierwsza kopia startu w scenariuszu)
- Wzorzec lub źródło: komentarz w `subflows/start-czysty-dzis.yaml` («Jedyne miejsce zmiany startu»)
- Kroki w aplikacji: nie dotyczy użytkownika
- Opcje: (a) test Jest porównujący kroki 122 z krokami obu podprzepływów (poza `launchApp`) — tani, w stylu istniejących testów `e2e-kruchosc-*`; (b) parametr `env` w podprzepływie z argumentem `oczkoE2eBezDiagnostykiLicznika` (pusta wartość = brak argumentu dzięki `argument()`, `v.length > 0`) i usunięcie kopii — mniej kodu, ale wymaga przebiegu iOS (czy pusta wartość trafia do NSUserDefaults jako brak). Rekomendacja: (a)
- Test akceptacyjny: test pada, gdy kroki startu w 122 i w podprzepływach się rozjadą
- Status: otwarte

Jedno zdanie naprawy: dodać test Jest, który porównuje kroki startu scenariusza 122 z `subflows/start-czysty-dzis.yaml` i `subflows/start-czysty.yaml`.

## Do sprawdzenia (pewność ≤ 80%)
- **Odtagowane scenariusze po zmianie w Ustawieniach (pewność ok. 75%, że bez skutku).** Zielone wyniki pochodzą z 5e4b8a2, sprzed `511f161b` (efekt ostrości w `app/ustawienia.tsx`). Scenariusze 98 (PU-180), 99 (PU-052), 106 (PU-191), 118 (PU-175) przechodzą przez Ustawienia. Zmiana ustawia ten sam obiekt, więc skutku nie oczekuję, ale odtagowanie wprowadziło je do bramki (poza iPadem), więc jeden czerwony wynik zatrzyma TestFlight. Do potwierdzenia pierwszym przebiegiem iOS na `claude/bx15-2026-11-16` albo następcy.
- **Jedna zielona próba na scenariusz (pewność ok. 70%, że stabilne).** Najdłuższe: 118 (5 m 17 s), 98 (4 m 23 s). Wagi `e2e/czesci.json` zrównoważone z jednego pomiaru; bez drugiego przebiegu nie ma danych o rozrzucie.
- **77, 89, 93, 95, 102, 104, 111, 119, 120, 121: poprawki niezweryfikowane (tag `oczekujacy` zostaje, poza bramką).** 77, 89, 93, 111, 119: poprawki BX13 bez wyniku po zmianie. 95: czy start gestu od 1% wysokości otwiera Centrum powiadomień — nie sprawdzono; 102/104/121: panel `e2e-wzor-notatki` prezentuje dane przekazane nakładce, nie narysowany chip; dostępność chipa dla VoiceOver [DO USTALENIA] na urządzeniu (BX-051); 120: `scrollUntilVisible` w podprzepływie bez wyniku iOS.
- **Wiersz PU-162 w katalogu** zmienił się z „do zaprogramowania” na „z testem” (nagłówek 144→145). To nie jest zmiana B↔A z BX15: pochodzi z commitu `e0f20ef8` (BX14, scalony w bf76027a), zrecenzowanego osobno (CM, P-929…P-931). Odnotowuję, że nie mieści się w regule „tylko B↔A” polecenia BX15.
- **Scenariusz 122: wynik iOS i waga (pewność ok. 60%, że p95 bez panelu mieści się w 100 ms).** P-941 sam zapisuje «niezweryfikowane: przebieg iOS». Waga 165 s to szacunek jak dla 31; test NOC-6 zakłada 44/46 z pomiaru #140, a 122 liczy jako bez pomiaru. Do potwierdzenia pierwszym przebiegiem iOS po bf133ae: czy 122 przechodzi funkcjonalnie, ile trwa i czy panel pomiaru pokazuje liczbę.
- **Scenariusz 31 (NFR-WYD-001, p95).** Czerwony w 43851148385; BX15 nie zmienia scenariusza ani progu (P-936 to analiza i opcje bez zmiany kodu). Poza zakresem tej recenzji; wynik wpływa na bramkę, więc właściciel wskazany w „Decyzje dla właściciela”.

## Co działa dobrze i należy zachować
- Test z mutacją własną: `tests/ekrany/ustawienia-powrot-oferty-bx049.test.tsx` używa prawdziwego `app/ustawienia.tsx` i prawdziwego `dostepPro`, a symuluje blur/focus przez wywołanie sprzątania i ponowne wywołanie efektu; zwyczaj z `docs/jakosc/bx15-dowod-czerwony.txt` (dowód czerwony przed poprawką) zostaje.
- Wykluczenie panelu E2E z wydania ma dwie niezależne warstwy: wstawienie stałej przez Metro (`src/platforma/tryb-e2e.ts:17`) i kontrola bajtów paczki w `scripts/wydanie/kontrola-ipa.sh:70` z testem «lista nadąża za kodem» (`tests/wydanie/slady-testowe.test.ts`).
- BX16: test wydania z mutacją (M1–M3 czerwone) i dwoma warstwami (stała Metro + skaner paczki); prawdziwy bundel wydania bez nowego klucza; jedna stała `diagnostykaWejsc` w `app/licznik.tsx` zamiast trzech warunków; 31, próg 100 ms i podprzepływy bez zmian.
- Reguła składni swipe z pułapką i mutacją (`tests/jakosc/maestro-runner.ts:103`): czerwieni się przy poluzowaniu.
- Poprawki AX5 jako jeden `scrollUntilVisible` w podprzepływie zamiast kopii scenariusza.
- Uczciwość opisów: P-938 i P-939 nazywają luki (chip PDFKit, „częściowo”, 143/144/150 zostają B) i podają cofnięcie jednym zdaniem; tożsamość commitów zgodna z P-507 we wszystkich commitach zakresu.

## Decyzje dla właściciela
Brak decyzji do podjęcia po stronie właściciela (koszty, konta, scalenie, wysyłka do Apple) w zakresie tej recenzji. Do decyzji koordynatora (P-087): przy CN-01 wybór (a) albo (b); przy 31 (NFR-WYD-001) opcje A lub B z P-936; przy CN-03/CN-04 opis 122 i Pokrycie PU-161 (opcja (a), tanio) albo tag `oczekujacy` (opcja (b), cofa część P-941). Moje zapisy w `docs/decyzje.md` nie powstały (tryb audit, tylko raport).

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 08-programista-001,08-programista-003,08-programista-004,08-programista-005`

(CN-01 realizuje i tak BX16; CN-02 przy następnej zmianie `app/wzor.tsx`; CN-03 i CN-04 to zmiany opisu i katalogu w tym samym commicie, CN-05 to jeden test Jest.)
