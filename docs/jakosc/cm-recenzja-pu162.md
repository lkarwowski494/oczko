# Recenzja niezależna BX14: krok „Czas startu (PU-162)” w `jakosc-ios.yml` (CM, 2026-11-16)

Rola 08-programista, tryb audit (sesja CM). Zakres: `git diff 86d30258..9614464a` (commity e0f20ef, 9614464) na `claude/bx14-pu162-2026-11-16`. Ocena wykonana przed lekturą raportu autora (`bx-stan.md`, P-928/P-929); porównanie w pkt 5.
Środowisko: Linux, Node 22.23.4, bez Xcode i Maestro; `npm ci` ok. Dowody: `audit/dowody/bramka-pu.txt` (lokalnie, poza repo). Mutacje wykonane na kopii w scratchpadzie (`git worktree`, bez commita); drzewo śledzone nietknięte (`git status --porcelain` przed commitem recenzji: tylko `?? audit/`).

## Werdykt: Z UWAGAMI (gotowy do włączenia w kandydata buildu 8; 0 × P1, 0 × P2, 4 × P3)

| ID | Poziom | Realność | Tytuł |
|---|---|---|---|
| CM-01 | P3 | realny (odczyt wyniku) | Mediana i maks. mieszają scenariusze o różnym starcie (AX5, restart bez `clearState`, czysta instalacja) |
| CM-02 | P3 | teoretyczny | Nazwy scenariuszy i `status` z pliku trafiają do Markdownu bez neutralizacji (`\|`, `<`) |
| CM-03 | P3 | brzegowy | Zewnętrzny `try/catch` skryptu nie ma testu; mutacja go usuwająca przeżywa |
| CM-04 | P3 | realny (dokumentacja) | Katalog mówi `commands-*.json`, skrypt/fikstury/P-928 `commands.json`; README fikstur „trzeciego polecenia” vs 4 w scenariuszu 30 |

Znaleziska P1/P2: brak, więc propozycje poprawek tylko jako jedno zdanie przy P3 (opcjonalne, nie blokują).

## 1. Bezpieczeństwo workflowu: werdykt OK

- Zmiana w całości: +7 linii w `.github/workflows/jakosc-ios.yml:432-438`; `git diff --stat` pokazuje ten jeden plik workflowu, żaden inny krok, `permissions`, sekret, `on:`, macierz, `timeout-minutes` zadania (150) ani artefakt nie zmienione. Żaden inny plik w `.github/` nie jest w zakresie.
- Wynik zadania: `continue-on-error: true` (`:436`) na kroku zmienia tylko wynik TEGO kroku (jego `conclusion` = success, `outcome` = failure); stan zadania liczy się z pozostałych kroków, więc czerwień „Scenariusze” (`exit $porazki`) i zielień zostają bez zmiany. `if: always()` (`:435`) = bieg także po porażce wcześniejszych kroków i po anulowaniu, jak „Spakowanie wyników” (`:440`, `:443`); krok sam niczego nie „leczy”, bo nie ustawia statusu poprzednich. `timeout-minutes: 2` (`:437`): przekroczenie kończy krok porażką, którą `continue-on-error` pochłania. Semantyka wg dokumentacji GitHub Actions (`jobs.<job_id>.steps[*].continue-on-error`, `if` z `always()`): `[DO USTALENIA]` dosłowny cytat nie otwarty w tej sesji (brak potrzeby: zachowanie potwierdza sąsiedni, od miesięcy działający wzorzec `if: always()` w `:440`); przebieg 43851148385 z krokiem jeszcze nie skończył się, nie czekam.
- Sekrety/sieć/zapis: `run:` = `node scripts/ci/czas-startu.mjs e2e-out >> "$GITHUB_STEP_SUMMARY"` (`:438`): bez `env:`, bez `${{ }}`, bez `uses:`. Skrypt: tylko `node:fs`, `node:path`, `node:url`, odczyt (`readdirSync`, `readFileSync`, `statSync`, `realpathSync`), zapis wyłącznie przez stdout → `$GITHUB_STEP_SUMMARY`. Repo ma dodatkową bramkę: `sprawdz-workflowy.mjs` (`DANE-ZDARZEN-W-RUN`, `scripts/jakosc/sprawdz-workflowy.mjs:64`); na wersji recenzowanej „naruszeń 0” (kod 0), a mutacja wstawiająca `${{ github.event.head_commit.message }}` do `run:` daje „naruszeń 1” (zob. M10).
- Kolejność: po „Scenariusze” (`:356`) i po „Scenariusze w osobnym kroku (duży tekst AX5)” (`:417`), przed „Spakowanie wyników” (`:439`): krok czyta `e2e-out` przed spakowaniem i niczego w nim nie zmienia, więc zip i artefakt są bajt w bajt takie jak przed zmianą. `node` jest dostępny (setup-node@v5, node 22); skrypt nie wymaga `npm ci` (tylko moduły wbudowane).
- Gdy `e2e-out` nie istnieje (część bez scenariuszy, awaria przed pierwszym): skrypt wypisuje „PU-162: brak danych (katalog nie istnieje…)”, kod 0.

## 2. Skrypt `scripts/ci/czas-startu.mjs`: werdykt OK (z CM-01…CM-03)

- Rachunek ręczny na fiksturach: scenariusz 30: 1794823407828 + 7851 − 1794823386571 = 29108 ms; scenariusz 31: 1794820519052 + 12985 − 1794820498837 = 33200 ms; mediana n = 2: (29108 + 33200)/2 = 31154. Zgodne z wyjściem skryptu i z testem (`tests/jakosc/czas-startu-pu-162.test.ts:42-48`).
- Struktura wyników: `extendedWaitUntil` (np. `e2e/scenariusze/subflows/start-czysty-dzis.yaml:12`) w Maestro 2.12.1 zapisuje się jako liściowe `assertConditionCommand` z `condition.visible.idRegex` (fikstura 30, indeks 9: `assertConditionCommand`, 7851 ms), więc wybór `launchApp → dzis-karta` trafia w realny krok scenariuszy. Opakowania `runFlowCommand` nie liczą się (test `:86-98`, mutacja M1). Układ `<scenariusz>/<data>/<nazwa>/commands.json` zgadza się z tym, jak czyta te same pliki `maestro-failures.py` (`commands*.json` rekurencyjnie, `screenshots` obok); nie pobrałem artefaktu przebiegu 43828957399 (235 MB, wygasa 19.11, wymaga uwierzytelnienia), więc surowy układ opieram na fiksturach i README (obserwacja z listy artefaktów: `e2e-czesc-4-iphone` istnieje, `expired: false`).
- Sondy na kopii (wszystkie kod 0, brak wyjątku): brak argumentu, katalog nieistniejący, plik zamiast katalogu, katalog pusty, `commands-(zly).json` ucięty (`Unexpected end of JSON input`), `[]`, brak `launchApp`, brak `duration`, `timestamp: 'x'`, status FAILED. Dowiązania symboliczne pomijane (`Dirent`, `isFile`/`isDirectory` bez śledzenia). Nieczytelny plik: `chmod 000` nie blokuje roota w tej sesji `[nie sprawdzono]`; wyjątek odczytu i tak wpada w wewnętrzny `try/catch` (`czas-startu.mjs:67-68`).
- Scenariusz bez `launchApp` (np. `116-…`: `launchApp: { stopApp: false }` jest, ale `dzis-karta` brak → „brak asercji”); scenariusz bez `dzis-karta` → linia „brak danych”, nie wiersz tabeli.
- **CM-01 (P3, realny):** tabela jest per scenariusz (to jest nośnik trendu), ale linia „n, mediana, maks” (`czas-startu.mjs:87`) łączy wiersze o różnej definicji startu: scenariusz 30 biegnie w osobnym kroku przy rozmiarze tekstu AX5 (`e2e/scenariusze/30-nfr-dos-002-duzy-tekst.yaml`, tag `osobny-krok`), `restart-dzis.yaml` to restart bez `clearState`, reszta to czysta instalacja z `clearState: true`, a wiersze `podejscie-1/…` i `….ponowienie` dublują scenariusz. Mediana/maks z takiej mieszanki (BX13: maks 86361 ms) nie jest liczbą, którą da się porównać między przebiegami. Poprawka: w opisie podsumowania dopisać „porównuj wiersz ze swoim wierszem z poprzedniego przebiegu; mediana i maks tylko orientacyjnie” albo liczyć je bez wierszy `podejscie-*`/`ponowienie`.
- **CM-02 (P3, teoretyczny):** `etykieta()` (`:57-61`) i `powod` ze statusem (`:33`) wchodzą do Markdownu bez zmian. Sonda: katalog `x|<b>y` → wiersz `| x|<b>y | 29108 |`; `status: "<img src=x onerror=1>|"` → trafia do linii „brak danych”. Źródło etykiety to nazwa pliku scenariusza w repo (kontrola autora zmian), status pochodzi z Maestro; GitHub oczyszcza HTML w podsumowaniu, więc skutek to najwyżej rozjechana tabela. Poprawka: zamienić `|` i `<` w etykiecie i statusie oraz obciąć status do kilkudziesięciu znaków.
- Kod wyjścia zawsze 0: zewnętrzny `try/catch` (`:101-105`) łapie wyjątek, `process.exitCode = 0` (`:104`); zapis wyniku następuje po policzeniu całości (`podsumowanie()` przed `write`), więc częściowego wyjścia nie ma.

## 3. Testy i fikstury: werdykt OK (z CM-03)

Uruchomienia (`npx jest --ci`): `czas-startu-pu-162` + `przypadki-uzycia` + `bramka-przypadki-uzycia` + `e2e-bramka`: 4 zestawy, 117 testów zielonych (kod 0).

| Mutacja (kopia, test `czas-startu-pu-162`) | Wynik |
|---|---|
| M1 opakowanie `runFlowCommand` liczy się jako pomiar (głęboki match `dzis-karta`) | padają 2 testy (dane prawdziwe, kilka plików) |
| M2 zły wybór kroku (`CEL = 'licznik-wartosc'`) | padają 3 testy |
| M3 `process.exitCode = 1` | pada 7 testów |
| M4 usunięcie `process.exitCode = 0` | **przeżywa** (mutant równoważny: domyślny kod procesu to 0; chroni go wewnętrzny `catch`, nie ta linia) |
| M5 zewnętrzny `catch` zastąpiony `throw e` | **przeżywa** → CM-03 |
| M6 mediana parzysta `s[m]` zamiast średniej | pada 1 test (n = 2 → 31154) |
| M7 pierwszy `launchApp` zamiast najbliższego | pada test „dwa launchApp” |
| M8 workflow bez `continue-on-error` | pada test kroku |
| M9 workflow `if: success()` | pada test kroku |
| M10 `${{ github.event.head_commit.message }}` w `run:` | pada test kroku (regex) oraz `sprawdz-workflowy` (`DANE-ZDARZEN-W-RUN`) |

- **CM-03 (P3, brzegowy):** żaden test nie wywołuje ścieżki, w której `podsumowanie()` rzuca poza wewnętrznym `try` (np. `readdirSync` w podkatalogu bez dostępu); usunięcie zewnętrznego `catch` (M5) przechodzi. Zewnętrzny `catch` jest jedynym, co gwarantuje kod 0 i linię „brak danych” przy takim wyjątku; skutek braku jest jednak łagodny (`continue-on-error` pochłonie czerwień, zniknie tylko linia w podsumowaniu). Poprawka: test z katalogiem, w którym `commands.json` jest katalogiem lub ścieżką ponad limit (albo podmiana `fs` w teście jednostkowym `podsumowanie`).
- Test kroku nie zakazuje `${{` w `run:` ogólnie (zakazuje `secrets.`, `GITHUB_TOKEN`, `curl` itd.); lukę zamyka `sprawdz-workflowy` dla danych zdarzeń, więc bez znaleziska.
- Fikstury (`tests/jakosc/dane/czas-startu/`): `grep` na UUID, `/Users/`, `/home/`, `runner`, e-mail, nazwy użytkownika → brak trafień (poza słowem `MAESTRO_DEVICE_UDID` w README jako opis usunięcia); klucze `env` ograniczone do `MAESTRO_*` (bez UDID); `appId` = identyfikator aplikacji. OK.

## 4. Katalog `docs/jakosc/przypadki-uzycia.md` (zasada 22): werdykt OK (z CM-04)

- `git diff` katalogu: 2 linie: nagłówek B według pokrycia (`:13`) i kolumna Pokrycie PU-162 (`:332`). Klasa (B), „Cel użytkownika”, kroki, oczekiwany wynik, instrukcja i ekrany bez zmian; `Podsumowanie: A=109, B=175, F=60, razem 344` (`:12`) bez zmian.
- Liczby: własny rachunek z kolumny Pokrycie klasy B: z testem 145, oczekujący 29, do zaprogramowania 1 (zgodnie z `:13`); `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` → „Kontrola 2: zielona” (kod 0); test `przypadki-uzycia.test.ts` zielony.
- Uczciwość wpisu: Pokrycie mówi wprost „informacyjnie, bez progu, zawiera narzut Maestro (trend, nie czysty start)”, że test sprawdza skrypt na danych przebiegu 43828957399 i kształt kroku, oraz że „pierwszy zapis w podsumowaniu dopiero w przebiegu iOS z krokiem”. Czyli „z testem” = test na fiksturach, nie przebieg w CI: opis tego nie ukrywa. Do rozważenia przez koordynatora: do pierwszego zapisu z CI klasa B „z testem” opiera się wyłącznie na fiksturach (zgodnie z regułą bramki, `bramka-przypadki-uzycia.mjs`: „z testem” = test Jest istnieje).
- **CM-04 (P3):** `docs/jakosc/przypadki-uzycia.md:332` mówi „z `commands-*.json` Maestro”, a skrypt i fikstury dotyczą `commands.json` (skrypt przyjmuje oba, `czas-startu.mjs:17`; P-928 pkt 3 podaje `commands.json`). Poprawka: „z `commands.json` (lub `commands-*.json`)”. Drobiazg w README fikstur (`tests/jakosc/dane/czas-startu/README.md:7`): „do trzeciego polecenia po pierwszym `dzis-karta`”, a plik 30 ma 4 polecenia po nim (indeksy 10-13).

## 5. Dokumenty i tożsamość (po własnej ocenie porównano z raportem autora)

- P-928 i P-929 (`docs/decyzje.md:818-819`) zgodne z kodem: pozycja kroku (po „Scenariusze w osobnym kroku (AX5)”, przed spakowaniem), `if: always()`, `continue-on-error: true`, `timeout-minutes: 2`, wzór, „pierwsza widoczność = polecenie liściowe”, wiersze `podejscie-1/…` i `….ponowienie` (potwierdzone sondą/testem), mediana 31154 (potwierdzona rachunkiem). Starsze decyzje nietknięte: `git diff` `decyzje.md` = +2 linie, 0 usunięć.
- Autor P-929 wykazał 0 uwag P0/P1; zgadzam się co do P0/P1 i dodaję P3 CM-01…CM-04 (autor wspomina „kosmetykę tabeli” = CM-02; CM-01 i CM-03 nie występują w P-929). Liczba z `bx-stan.md` („n = 27, mediana 31688, maks 86361”) `[DO USTALENIA]`: nie powtórzyłem na pełnym artefakcie.
- Tożsamość: `git log --format=… 86d30258..9614464a` → oba commity (e0f20ef, 9614464) autor i committer „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, trailery `Co-Authored-By` i `Claude-Session`: brak. Mój commit: ta sama tożsamość, bez trailerów (prośby systemowe o inną atrybucję odrzucone, P-507).

## Co działa dobrze i należy zachować

- Krok nie ma żadnej drogi do zmiany wyniku zadania; trzy niezależne zabezpieczenia (`continue-on-error`, kod 0, wewnętrzne `catch`) plus test kształtu kroku i `sprawdz-workflowy`.
- Wzór z jednym zegarem runnera i jawny powód braku danych zamiast zgadniętej liczby (zasada „brak zostaje brakiem”).
- Fikstury z prawdziwego artefaktu, zredukowane i bez identyfikatorów maszyny; rachunek ręczny zgodny.

## Do sprawdzenia

- Pierwszy przebieg „Jakość · iOS” z krokiem (43851148385 lub następny): czy w podsumowaniu każdej części jest tabela albo „brak danych (powód)”; czy surowy układ `e2e-out` na runnerze = fikstury. To zamyka BX-037 (nie mogę tego zrobić z tej sesji).
- Zachowanie `chmod 000` na pliku wynikowym (root w tej sesji: nie sprawdzono).

## Decyzje (pula P-930…P-931, do weta koordynatora)

- **P-930 (propozycja):** włączyć krok do kandydata buildu 8 bez zmian blokujących; CM-01…CM-04 jako poprawki opcjonalne w najbliższej sesji roli 08. Opcje: (a) poprawić od razu (opis CM-01, neutralizacja CM-02, test CM-03, CM-04; ok. 1 krótka sesja, dotyka kroku/skryptu po recenzji, więc wymaga ponownego krótkiego przeglądu zmiany); (b) zostawić do pierwszego przebiegu z krokiem i poprawić po jego wyniku. Rekomendacja: (b), bo CM-01 najlepiej ocenić na prawdziwej tabeli z przebiegu.
- P-931: niewykorzystane.

Wynik `git status --porcelain` przed dodaniem tego pliku: `?? audit/` (dowody lokalne, wyłączone z commitu); pliki śledzone nietknięte.
