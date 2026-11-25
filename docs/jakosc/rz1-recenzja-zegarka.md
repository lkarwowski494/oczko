# RZ1 — recenzja niezależna kodu zrzutów Apple Watch (ZW1/ZW2)

Rola 07-jakosc, tryb audit zawężony do recenzji kodu (polecenie RZ1). Data: 2026-11-23. Zakres: diff `b7557335..5a4c6968` (workflow `zrzuty-zegarka.yml`, `scripts/ci/zegarek-*`, `scripts/ci/splaszcz-png.mjs`, `tests/wydanie/zegarek-*`). Kodu nie poprawiałem.

## Werdykt: PRZYJĄĆ Z UWAGAMI

Brak P1. 3 uwagi P2, 6 uwag P3. Żadna nie blokuje wgrania zrzutów, bo kod działa: przebieg macOS na tym samym SHA (run 45073304236) jest zielony i wykazał kompletny zestaw. P2 dotyczą luk w kontroli i w testach, nie błędu w wyniku.

## Podstawa oceny

- **Niezależność.** Nie czytałem `docs/wydanie/stan.md`, raportów ani uzasadnień autorów. Wyjątek do wiadomości koordynatora: omyłkowo przeczytałem 5 pierwszych linii `docs/jakosc/zw1-verify.txt` (wynik verify autorów: kod 0, 737 zestawów, 8183 testy); nie wpłynęło to na ocenę, bo własny verify wykonałem osobno (poniżej). Kodu aplikacji i `targets/watch/` użyłem tylko jako wyroczni dla stanu zegarka.
- **Środowisko.** Linux, Node 22.23.5, bez Xcode i symulatora. Czynności macOS (`simctl`, `defaults`, watchOS) oceniam z kodu i z logów CI; nie uruchomiłem ich.
- **Commit** `5a4c6968`, gałąź `claude/rz1-recenzja-zegarka-2026-11-23`, `git status --porcelain` pusty przed i po.

## Co sprawdziłem i wynik

| Kryterium | Dowód | Wynik |
|---|---|---|
| `npm run verify` | `docs/jakosc/rz1-verify.txt`: kod 0, 737 zestawów, 8184 testy | zielony |
| Stan zegarka = dekoder Swift | `zegarek-kadry.mjs:56-66` vs `targets/watch/Wspolne/Stan.swift:39-41` (15 kluczy, `znaczenie` ∈ {skonczone, w_trakcie}, `null` tylko przy `glowa/ostatniPlusMs/sesjaStartMs/proWaznoscDo`) | zgodne; test `zegarek-zrzuty-kadry.test.ts` czyta ten sam `Stan.swift`, więc rozjazd wykryje |
| Klucze UserDefaults | `zegarek-kadry.mjs:43-44` vs `targets/watch/Aplikacja.swift:31-33,56,61` | zgodne |
| Pas przypomnienia w rzędzie 21 | `PRZYPOMNIENIE {od 9, co 4, razy 6}`, `LICZNIK 20` vs `Przypomnienia.swift:25-27` (`w = skonczone+1`, `k = (21−9)/4+1 = 4`) | pas się wyzwala; nie ma go w kadrze 01 |
| Wymiary, alfa, układ | `zegarek-kadry.mjs:101-126`, `wymiary-asc.mjs pngInfo`; układ `<język>/NN-<kadr>.png` vs `scripts/asc/zrzuty.mjs:86-100` (`readShots`) i `asc-zrzuty.yml:67-72` | zgodne |
| Przebieg macOS na tym SHA | MCP GitHub: run 45073304236, push, `conclusion: success`, joby `plan` i `zegarek` zielone; log: „Zrzuty zegarka: 58 plików, języków: 29, metoda przekazania stanu: argumenty”, „OK: komplet 29 języków × 2 kadry, jeden rozmiar z listy Apple, bez alfy”; artefakt `zegarek-zrzuty` ID 14775102154, 58 plików, 956 432 B | potwierdza zgodność końca do końca (format, nie wygląd) |
| Wstrzyknięcia z wejść i komunikatu | wykonałem blok `run:` kroku „plan” (workflow:63-77) w bashu na 11 wejściach: nowa linia w `jezyki` i `urzadzenie` → kod 2; `x$(id)` → kod 2; znacznik w 2. linii komunikatu ignorowany; `all` → 29 języków | poprawne |
| Uprawnienia i sekrety | `permissions: contents: read`; `persist-credentials: false`; brak `secrets.*` (poza domyślnym), brak `environment:`; dane zdarzeń tylko przez `env:`; akcje wyłącznie `actions/*` | poprawne (JAK-10) |
| Wpływ na inne workflowy i `main` | `on.push.branches` dwie gałęzie robocze, `main` poza listą; `splaszcz-png.mjs` zmieniony addytywnie (+10 linii, funkcja `piksele`; `splaszcz` bez zmian) | bez ryzyka dla `main` |
| Mutacje (JAK-04) | niżej | 4 z 7 zabite, 3 przeżyły (uwagi P2-1, P2-2, P3-3) |

### Mutacje (kopia `git worktree` w scratchpadzie, usunięta; testy `--ci`)

| Mutant | Plik | Wynik |
|---|---|---|
| M1 `POMIJANY_GORNY_PAS` 0,14 → 0 | `zegarek-kadry.mjs` | zabity (2 testy padły) |
| M2 wyłączona kontrola alfy | `zegarek-kadry.mjs` | zabity (1) |
| M3 `PRZYPOMNIENIE.co` 4 → 5 | `zegarek-kadry.mjs` | zabity (1) |
| M4 próg `rozne` 0,005 → 0,5 | `zegarek-kadry.mjs` | zabity (2) |
| M5 `exit 5` → `true` przy kadrze równym ekranowi bez stanu | `zegarek-zrzuty.sh:79` | **przeżył** (19/19 zielone): osłania go drugi strażnik `:82` |
| M6 odwrócona kolejność argumentów `simctl pair` | `zegarek-para.sh:27` | **przeżył** (testy tylko `DRY_RUN`) |
| M7b walidacja `urzadzenie` → `true` zamiast `exit 2` | `zrzuty-zegarka.yml:74` | **przeżył** (16/16 zielone); zmutowany blok wpuszcza `uruchom=true` do `GITHUB_OUTPUT` |

## Uwagi

### P2

**P2-1 · `scripts/ci/zegarek-para.sh:36-37` — stan pary jest tylko wypisany, nie sprawdzony; ścieżka produkcyjna skryptu bez testu.**
Cel skryptu (nagłówek, `:3-4`) to brak czerwonej ikony „brak połączenia z iPhone'em” na zrzutach. Po `pair`, `boot` i `sleep 10` skrypt pobiera `STATE`, wypisuje go i kończy kodem 0 niezależnie od wartości. Gdy para nie będzie aktywna, powstanie 58 poprawnych formalnie PNG z ikoną, a żadna kontrola (`komplet`, porównania kadrów) tego nie wykryje. Dodatkowo `pair_activate`, `boot` i `bootstatus` mają `|| true` (`:30-34`). Testy dotykają tylko `DRY_RUN` (`zegarek-zrzuty-skrypty.test.ts:72-89`), więc M6 przeżył. W przebiegu 45073304236 krok trwał ok. 7 min 12 s; treści jego logu nie czytałem, więc nie wiem, jaki stan pary wypisał.
Zalecenie: po rozruchu sprawdzać `STATE` (z krótką pętlą oczekiwania) i przy braku „connected” kończyć błędem albo ostrzeżeniem w `::warning::`; dodać test na atrapie `xcrun` jak dla `zegarek-zrzuty.sh`. Przed wgraniem: obejrzeć kilka kadrów pod kątem ikony.

**P2-2 · `tests/wydanie/zegarek-zrzuty-workflow.test.ts:73-79` — walidacja wejść (wstrzyknięcie do `GITHUB_OUTPUT`) sprawdzana tylko wyrażeniem regularnym na tekście.**
Test nosi nazwę „kody znaków sprawdzone przed zapisem do GITHUB_OUTPUT”, ale sprawdza obecność linii `case "$urz" in *[!`, nie zachowanie. M7b: zamiana `exit 2` na `true` w tej gałęzi zostawia 16/16 testów zielonych, a blok zapisuje wtedy `urzadzenie=Apple` i `uruchom=true` jako osobne wiersze. Obecny kod jest poprawny (sprawdziłem wykonaniem, 11 wejść); luka dotyczy regresji w jedynym fragmencie workflowu o znaczeniu bezpieczeństwa.
Zalecenie: wyciągnąć blok `run:` kroku `wejscie` z YAML w teście, uruchomić w bashu z `GITHUB_OUTPUT` w pliku tymczasowym i sprawdzić: nowa linia w obu wejściach → kod 2 bez wyjścia, znacznik w 2. linii ignorowany, `all` → 29 języków. Ten sam test chroni przed tym, że ktoś „uprości” `case`.

**P2-3 · `.github/workflows/zrzuty-zegarka.yml:136-142` + `asc-zrzuty.yml:67-72` — artefakt z nieudanego przebiegu ma tę samą nazwę co dobry i nic w pobieraniu nie sprawdza wyniku przebiegu.**
Krok wgrywa `zegarek-zrzuty` z `if: always()`, a `asc-zrzuty.yml` pobiera artefakt po samym numerze przebiegu (`run-id: ${{ inputs.zegarek_z_przebiegu }}`), bez sprawdzenia, że przebieg się powiódł. Przy porażce po kilku językach (np. kod 4 lub 5 dla języka 12) w artefakcie zostaje niepełny zestaw; wgranie z takiego przebiegu wgra tylko te lokalizacje, które w nim są (skrypt „nigdy nie usuwa”, więc ponowne wgranie zostanie pominięte jako „grupa ma już zrzuty”). Test (`zegarek-zrzuty-workflow.test.ts:148-155`) wymusza `always()` jako zamierzone. Ryzyko zależy od błędnego numeru przebiegu podanego przez człowieka, stąd P2, nie P1.
Zalecenie: częściowe wyniki wgrywać pod inną nazwą (np. `zegarek-zrzuty-niekompletne`, tylko `if: failure()`), a dobrą nazwę tylko `if: success()`; ewentualnie dodać do `asc-zrzuty.yml` kontrolę `conclusion == success` przebiegu źródłowego.

### P3

**P3-1 · `scripts/ci/zegarek-zrzuty.sh:24` — błąd porównania czytany jako „takie same”.** `takie_same() { ! node … rozne … }` traktuje kod 2 (nieczytelny PNG, `zegarek-kadry.mjs:143`) jak wynik „takie same” i kończy kodem 5 z komunikatem „stan nie dotarł do aplikacji”. Koniec jest głośny, diagnoza myląca. Zalecenie: rozróżnić kod 1 od 2.

**P3-2 · `scripts/ci/zegarek-zrzuty.sh:73-83` — kadr jest odrzucany tylko, gdy równa się ekranowi bez stanu albo wcześniejszemu kadrowi.** Kadr pusty, czarny, w trakcie ładowania albo z oknem systemowym przejdzie, jeśli różni się od tych dwóch. Przebieg 45073304236 przeszedł wszystkie kontrole, ale nikt (ja także) nie obejrzał obrazów. Brak też sprawdzenia, że `jezyk` zadziałał: 27 języków z danymi zastępczymi (`daneJezyka`, `zegarek-kadry.mjs:47-53`) może wyglądać jak `en` i przejść bez ostrzeżenia, jeśli aplikacja zignoruje argument językowy. Zalecenie: przed wgraniem obejrzeć arkusz kontaktowy 58 kadrów (krok właściciela albo koordynatora); opcjonalnie sprawdzać minimalną różnorodność pikseli.

**P3-3 · `zegarek-zrzuty-skrypty.test.ts` — strażnik „kadr = ekran bez stanu” nie ma niezależnego testu (M5).** Test „GŁOŚNA PORAŻKA” (`:168-173`) przechodzi też bez niego, bo drugi kadr równy pierwszemu zatrzymuje skrypt kodem 5. Zalecenie: scenariusz, w którym kadr 01 = `bez-stanu`, a kadr 02 jest poprawny, oczekuje kodu 5 i komunikatu o ekranie bez stanu.

**P3-4 · `.github/workflows/zrzuty-zegarka.yml:10,16` i historia gałęzi — znaczniki w komunikatach commitów 5908dcf8 i 5a4c6968 oraz nazwy gałęzi na stałe w `on.push.branches`.** Szybkie przesunięcie (ff) albo cherry-pick tych commitów na gałąź integracyjną `claude/youthful-pasteur-kx83sn` zmienia pliki z `paths` i ma znacznik `[zegarek-jezyki:all]` w pierwszej linii, więc uruchomi pełny przebieg macOS (29 języków, ok. 21 min). Repo publiczne, koszt 0, ale kolejka macOS i niespodzianka. Po wykorzystaniu workflow warto usunąć gałąź ZW z listy albo przenieść znacznik do osobnego commitu wyzwalającego (jak opisano w `zegarek-uruchomienie.txt`).

**P3-5 · `tests/wydanie/zegarek-zrzuty-kadry.test.ts:97` — dopasowanie komentarza w YAML (`licznik projektu głównego = 20`).** Test kruchy: zmiana brzmienia komentarza w `e2e/zrzuty-sklepu/00-przygotuj.yaml` zepsuje go bez zmiany zachowania. Wyrocznia licznika 20 pochodzi z fikstury, nie z kodu testowanego, więc zamiar jest dobry; zalecenie: czytać wartość z danych, nie z komentarza.

**P3-6 · czas testów (JAK-05).** Zestaw `zegarek-zrzuty-skrypty` trwał 8,9 s w pełnym `verify` (jeden test uruchamia ok. 16 procesów Node przez skrypt bash); `testTimeout` to 30 s (`jest.config.js:22`), więc zapas ok. 3-krotny. Nie jest to niestabilność, ale przy wolniejszym runnerze to pierwszy zestaw, który padnie z limitu czasu.

## Nie sprawdzono

| Co | Dlaczego | Krok i kto |
|---|---|---|
| Wygląd 58 kadrów (ikona braku telefonu, ucięcia, język) | brak dostępu do obrazów artefaktu z tego środowiska | przegląd arkusza kontaktowego z artefaktu 14775102154 przed `asc-zrzuty.yml` z `apply` (koordynator lub właściciel) |
| Stan pary zegarka z logu kroku „Para z symulatorem” | odczytałem tylko ostatnie 60 linii logu joba | odczyt logu kroku 10 przebiegu 45073304236 |
| Przyjęcie specyfikacji 416×496 przez dane referencyjne Apple | wymaga `asc-zrzuty.yml` w dry-run z kluczem; zakres poza RZ1 | dry-run `asc-zrzuty.yml` (jak zapisano w nagłówku `zegarek-zrzuty-asc.test.ts` jako `[DO USTALENIA]`) |
| Zachowanie `defaults write` i cfprefsd w symulatorze (ścieżka zapasowa „preferencje”) | macOS | niewykorzystana w przebiegu 45073304236 (metoda: argumenty); bez wpływu na ten przebieg |

## Co działa dobrze i należy zachować

- Walidacja wejść przed zapisem do `GITHUB_OUTPUT` i dane zdarzeń wyłącznie przez `env:`; znaczniki tylko z pierwszej linii komunikatu.
- Testy skryptów uruchamiają prawdziwy bash z atrapami `xcrun`/`plutil`/`defaults` i sprawdzają przepływ danych (stan w argumentach → wybór obrazu), a nie obecność napisów; 4 z 7 mutantów zabite.
- Test stanu zegarka czyta `Stan.swift` i `Aplikacja.swift`, więc rozjazd kluczy kodu aplikacji i skryptu wykryje CI.
- Skrypty kończą się głośno (kody 2, 4, 5), nie oddają pustych kadrów; `komplet` sprawdza jeden rozmiar z listy Apple i brak alfy na tym samym katalogu, który idzie do artefaktu; stany robocze leżą poza artefaktem.
