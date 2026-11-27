# DG2 — diagnoza czerwonego e2e „część 2” i „część 4” (iPhone) na `main` af327fd7 (Jakość · iOS, run 45971994915)

Sesja DG2 (rola 07-jakosc, tryb audit, zakres: tylko ta diagnoza), 2026-11-27, KO-221. Gałąź robocza `claude/dg2-e2e-main-2026-11-27` od `3cc0fa87`; `git status --porcelain` pusty na starcie. Badany przebieg: run 45971994915 (workflow „Jakość · iOS”, push na `main`, SHA `af327fd7617100c25582f6b9109278e891962ab1`, 09:14–13:36 UTC, `actions_get`). Nie zmieniałem kodu, scenariuszy ani workflowów; nie wyzwalałem ani nie ponawiałem przebiegów (zakazy polecenia DG2). Wszystkie odczyty przez MCP GitHub (`actions_get`, `actions_list`, `get_job_logs` → adres logu, `download_workflow_run_artifact` → adres zip); pobrane pliki leżą tylko w scratchpadzie sesji (nie w repo: duże, publiczne repo).

## Wynik w jednym akapicie

Dwa czerwone joby mają **dwie różne przyczyny, obie klasy „maszyna/sterownik”, żadna nie jest regresją aplikacji**.
- **Część 4:** czerwony jest jeden scenariusz z bramki, `NFR-WYD-001` (plik `31-nfr-wyd-001-reakcja-licznika.yaml`), a nie `PU-052`, który padł w DG1 i w edf07c5c (tym razem zielony, 2 m 3 s). Padło **20. stuknięcie** w „+1” (`Assertion is false: "20", id: licznik-wartosc is visible`): stuknięcie nie dotarło do aplikacji. Dowód w logu symulatora: `backboardd` pominął zdarzenie dotyku (`didn't see a previous touch down or range-in event for pathIndex:2; skipping event`, 10 wierszy w 112 ms), a licznik na zrzucie stoi na 19 po 18 s. Skrypt P-781 tego nie rozpoznaje jako awarii maszyny (junit ma zwykłą asercję), a P-091 9a zabrania ponowień asercji licznika, więc job jest czerwony bez ponowienia.
- **Część 2:** 26 z 27 scenariuszy zielonych, ostatni (`PU-180`) padł na `maestro.DeviceUnreachableException: Device became unreachable during screenshot` (awaria maszyny, **P-781 zadziałało zgodnie z projektem**: jedno powtórzenie całego zestawu od zera). Powtórzenie **nie mogło się zmieścić w limicie**: pełny przebieg trwa ok. 95 min, limit kroku to 142 min, a awaria wypadła po 94,5 min, więc po limicie kroku (13:30:01) job został przerwany, a krok AX5 anulowany limitem joba (150 min). Czerwień cz. 2 to **wada projektu mechanizmu ponowienia (cały zestaw zamiast brakującego scenariusza)** połączona z jedną awarią maszyny.
- Poza tym: informacyjne `PU-008`, `PU-168`, `PU-135` czerwone jak w DG1 i w edf07c5c (nie są przyczyną czerwieni).

## Zadanie 1 — które scenariusze padły i klasyfikacja

Skala przyczyny: aplikacja / scenariusz / maszyna (polityka niestabilnych testów, E2E „według praktyki właściciela”). Realność dla użytkownika: realny / brzegowy / teoretyczny.

### Część 4 (job 140459967620; krok „Scenariusze” 10:55:13–12:36:49, 101 m 36 s, failure)

Plan części (log jobu, wiersz 282): „27 scenariuszy + 1 w osobnym kroku (waga ok. 67 min)”. Wyniki z `wyniki.txt` artefaktu `e2e-czesc-4-iphone` (15198615447) i z logu:

| Scenariusz | Bramka | Wynik | Klasa przyczyny | Realność | Pewność |
|---|---|---|---|---|---|
| **31 · NFR-WYD-001** (`31-nfr-wyd-001-reakcja-licznika.yaml`, 11:43:21, 3 m 12 s) | **tak** (`stan-licznika`, `pomiar`: bez ponowienia) | `czerwony`: `Assertion is false: "20", id: licznik-wartosc is visible` | **maszyna/sterownik (symulator, warstwa HID)**; nie wzorzec P-781 | teoretyczny dla użytkownika (stuknięcie zgubione przed aplikacją) | wysoka (dowód niżej) |
| PU-008 (`100-…`, 2 próby) | nie (`oczekujący`) | `czerwony-informacyjnie`, `"2 highlights"` | niewyjaśniona rozbieżność aplikacja/scenariusz, **znana z DG1** | brzegowy | niska–średnia |
| PU-168 (`95-…`) | nie | `czerwony-informacyjnie`, `"2", licznik-wartosc` | wada scenariusza, **znana z DG1** | teoretyczny | średnia–wysoka |
| PU-135 AX5 (`120-…`, osobny krok) | nie | `czerwony-informacyjnie`, `dzis-karta` | wada scenariusza, **znana z DG1** | teoretyczny | wysoka |
| PU-052 (`99-…`) | tak | **zielony** (2 m 3 s) | — | — | — |
| pozostałe 23 | — | zielone | — | — | — |

Dowody dla **31 · NFR-WYD-001** (wszystkie z artefaktu 15198615447, katalog `e2e-out/31-nfr-wyd-001-reakcja-licznika/2026-11-27_114213/`):
1. Scenariusz `e2e/scenariusze/31-nfr-wyd-001-reakcja-licznika.yaml:30` kończy podprzepływ `pomiar-pieciu.yaml` (OD = 16) asercją licznika `20`; `commands.json` (123 polecenia): poprzednia asercja (wartość 19) `COMPLETED` w 412 ms, następne `tapOnElement licznik-plus` `COMPLETED` (1754 ms), potem `assertConditionCommand` `FAILED` po 18 188 ms.
2. Zrzut `screenshots/step-123-assertCondition-${Number(OD)_+_4}.png`: licznik **19**, napis „Now working row 20”, przycisk „+1 row / tap when row 20 is done”; panel `e2e-pomiar-plus` (hierarchia kroku 123): „p95 98 ms, n = 18; first 205 ms” (czyli 19 przyjętych stuknięć = 1 + 18, bez 20.).
3. Dziennik symulatora (`logs/device-simulator.log`, 789 087 wierszy), okno stuknięcia: `11:46:02.816901 maestro-driver-iosUITests-Runner (Foundation) Tapping 243.0, 740.0` → `backboardd … [com.apple.BackBoard:TouchEvents] touch down without previous range event: 2` (wiersz 626268) → `didn't see a previous touch down or range-in event for pathIndex:2; skipping event` (wiersze 626272–626640 i dalej; 10 wierszy między 11:46:02.8339 a 11:46:02.9460). Sterownik zakończył stuknięcie `Tapping took 0.33…` (wiersz 627506), więc Maestro uznał je za wykonane (`Something have changed in the UI … Proceed`, `maestro.log`), a aplikacja go nie dostała.
4. **Tylko to jedno stuknięcie** ma `skipping event`: `grep -c "skipping event"` = 10 (wszystkie w oknie 112 ms), a poprzednie 20 stuknięć w licznik (21 wierszy `Service added … transport:Recap`, po jednym na stuknięcie) przeszło bez nich. Inne stuknięcia tego samego scenariusza (19 wcześniejszych) zostały przyjęte.
5. Znana rodzina: `docs/jakosc/bb-2026-11-12/dowody/04-symulator-zator.txt:5` (ten sam komunikat `touch down without previous range event: 2` w awarii maszyny z 12.11, raport `docs/jakosc/bb-2026-11-12/07-jakosc-2026-11-12.md:11`: „awaria maszyny (zator symulatora i restart sterownika XCTest)”); przyczyna zatoru nadal `[DO USTALENIA]` (tamże, wiersz 139).
6. Dlaczego nie regresja aplikacji: kod i scenariusz identyczne jak w poprzednim przebiegu z zielonym 31 (patrz zadanie 2); p95 98 ms przy limicie 100 ms to jednak **zapas 2 ms**, więc scenariusz 31 jest wrażliwy na wolną maszynę także w innych przebiegach (P-925, P-936, P-951, P-952 w `docs/decyzje.md`: wcześniejsze czerwienie 31 z p95 162–170 ms).

Dlaczego job jest czerwony mimo klasy „maszyna”: `scripts/ci/e2e-awaria-maszyny.mjs:28` pomija treść zaczynającą się od „Assertion is false” (porażka scenariusza), a junit 31 zawiera dokładnie taką treść (`31-nfr-wyd-001-reakcja-licznika.xml`: `<failure>Assertion is false: "20", id: licznik-wartosc is visible</failure>`); poza tym scenariusz ma `bezPonowien` (`scripts/ci/e2e-czesci.mjs:99`, „własna asercja licznika / pomiar: bez ponowienia”, log jobu wiersz 293). Oba zabezpieczenia działały zgodnie z projektem; **nie ma w nim klasy „zgubione stuknięcie”**.

### Część 2 (job 140459967781; krok „Scenariusze” 11:07:45–13:30:01, 142 m 16 s, failure)

Plan (log jobu, wiersz 271): „27 scenariuszy + 1 w osobnym kroku (waga ok. 67 min)”.

| Zdarzenie | Czas UTC (log jobu) | Co |
|---|---|---|
| Start kroku | 11:07:45 | przebieg 1 |
| 26 scenariuszy | 11:13–12:37 | `[Passed]` wiersze 585–748 (od BR-LIC-001/S1 do PU-224·PU-225); średnio 3,6 min |
| **PU-180** (27. i ostatni) | 12:42:15 | `[Failed]` po 3 m 36 s; krok 68/68 `takeScreenshot 98-oferty-po-powrocie` przerwany: `maestro.DeviceUnreachableException: Device became unreachable during screenshot` (wiersze 754–764) |
| Decyzja P-781 | 12:42:40 | `::warning::Awaria maszyny w 1. podejściu (…) — jedno powtórzenie całego zestawu części od zera` (wiersz 765) |
| Przebieg 2 (od zera) | 12:43:37–13:28 | 15 scenariuszy zielonych (BR-LIC-001/S1 … BR-LIC-006/S1; wiersze 768–859), szybciej niż w 1. podejściu (np. BR-LIC-001/S1 1 m 12 s wobec 2 m 13 s) |
| Limit kroku | 13:30:01 | `##[error]The action 'Scenariusze' has timed out after 142 minutes.` (wiersz 865) |
| AX5 (osobny krok) | 13:30:01–13:33:35 | `##[error]The operation was canceled.` (wiersz 885): limit joba 150 min (start 11:03:20 + 150 min = 13:33:20) |

Klasyfikacja:
- **PU-180: maszyna/sterownik** (`DeviceUnreachableException` w kroku zrzutu, wzorzec z `scripts/ci/e2e-awaria-maszyny.mjs:17`; to 3. wzorzec tej awarii w tej gałęzi po #142, #173, #182, patrz komentarz w skrypcie, wiersze 4–5). Realność dla użytkownika: teoretyczny. Pewność: wysoka co do klasy; przyczyna zatoru symulatora `[DO USTALENIA]` (artefaktu 15202269206 nie pobierałem: 492 MB, a klasa wynika wprost z junit i logu jobu).
- **Czy ponowienie zadziałało:** zadziałało mechanicznie (uruchomiło się, w 2. podejściu 15 z 27 zielonych), ale **nie zdążyło**. Wynik 1. podejścia był już kompletny (26 zielonych + 1 awaria na ostatnim scenariuszu) i został wyrzucony: `POMIN` zawiera tylko scenariusze `czerwony`/`w-ponowieniu`, więc 26 zielonych przebiegło drugi raz. Do ponowienia wymagane było tylko PU-180 (oraz AX5, który jeszcze nie biegł).
- **Dlaczego nie wystarczyło (limit czasu):** `timeout_min = 30 + 4 × (27 + 1) = 142` (`scripts/ci/e2e-czesci.mjs:111`). Pełny przebieg 1. podejścia zajął 94,5 min (≈ ×1,4 wagi planu 67 min), więc na powtórzenie zostało 142 − 94,5 = 47 min, czyli około połowy zestawu. Powtórzenie całego zestawu **mieści się w limicie tylko wtedy, gdy awaria wypadnie w pierwszych ok. 40 min** (≈ 142 − 95 = 47 min na przebieg 2 z zapasem; przy awarii później zawsze brak czasu). Awaria na ostatnim scenariuszu to najgorszy przypadek tego projektu.
- **AX5 anulowane** nie jest osobną usterką: to skutek limitu joba 150 min (`jakosc-ios.yml:278`), bo krok „Scenariusze” zjadł 142 z 150 min.
- Dlaczego cz. 2 trwała 2 h 22 min: 142 min kroku (limit) + 4 min AX5 + 1 min pakowania/uploadu (artefakt 492 MB) + 11:03:20 start joba → 13:36:24 koniec (log jobu, `actions_list`).

Czy zgodnie z P-091 9a/10a wolno ponowić ręcznie: cz. 2 — tak (awaria maszyny, P-091 10a, polecenie CLAUDE.md: „jedno ponowienie ręczne”); cz. 4 — klasa „maszyna” wynika z dziennika symulatora, ale junit mówi „asercja licznika”, więc ponowienie ręczne jest decyzją koordynatora (opcja A niżej), nie automatem.

### Pozostałe joby run 45971994915 (kontekst)

cz. 1 iPhone (140459967638, `Scenariusze` 11:15:35–12:59:37, 104 min; AX5 5 m 53 s) — success; cz. 3 iPhone (140459967734, 11:22:30–13:18:49, 116 min) — success; cz. 1 iPad (140459967646, 11:27:33–11:58:56) — success; build (140414398611, 29 min), swift-test, zegarek-ikona — success; `eksperymenty-wzoru` (140414398001) — failure (krok W1–W3, informacyjny, `continue-on-error`).

## Zadanie 2 — porównanie z 45558112022 (edf07c5c) i z DG1

Dane z `actions_list` (jobs) i z logów jobów cz. 4 (`139024290637`) obu przebiegów:

| | edf07c5c · run 45558112022 (25.11) | 6e01d57d · DG1 (23.11, run 45193446574) | **af327fd7 · run 45971994915 (27.11)** |
|---|---|---|---|
| cz. 2 iPhone | **success**, kroku 89 min | success | **failure** (maszyna + limit) |
| cz. 4 iPhone | failure, krok 102 min | failure, krok 107 min | failure, krok 101,6 min |
| Scenariusz z bramki czerwony w cz. 4 | **PU-052** (`zdjecia-miniatura`, 2 m 10 s; wiersz logu o 08:17:38) | **PU-052** (2 m 17 s) | **NFR-WYD-001 (31)**, PU-052 zielony |
| PU-008 / PU-168 / PU-135 (informacyjne) | czerwone (wiersze 07:00:33, 08:14:25, 08:22:41) | czerwone | czerwone |
| cz. 1, cz. 3, iPad cz. 1 | success | success | success |

Co nowe:
1. **Nowa klasa porażki w cz. 4:** zgubione stuknięcie w symulatorze (NFR-WYD-001), a **PU-052 zniknął z czerwieni** (zielony w tym przebiegu) — czyli „znana niestabilność cz. 4” z DG1 nie jest stałą: bramka cz. 4 jest czerwona z różnych powodów w kolejnych przebiegach (PU-052 w edf07c5c i DG1, NFR-WYD-001 teraz), co wspiera hipotezę o **przerywanych zatorach symulatora** (bb-2026-11-12), a nie o jednym wadliwym scenariuszu.
2. **Cz. 2 po raz pierwszy czerwona:** była zielona w edf07c5c (krok 89 min). Nowa jest nie sama awaria maszyny, tylko jej **konsekwencja** (ponowienie całego zestawu nie mieści się w limicie).
3. Kod aplikacji i scenariusze: `git diff --stat edf07c5c af327fd7 -- app src modules targets plugins package.json package-lock.json app.json e2e .github/workflows/jakosc-ios.yml scripts/ci` (kod 0; edf07c5c jest przodkiem af327fd7, 31 commitów) = 6 plików, 106 wstawień: wersja 1.0.0 → 1.0.1 (`app.json`, `package.json`, `package-lock.json`), `e2e/zrzuty-sklepu/00-przygotuj.yaml`, `scripts/ci/kontrola-zakreslen.mjs`, `src/kompozycja/e2e/wzor-sklepu.ts` (ścieżka zrzutów sklepu, tylko build E2E). **Żadnego pliku `e2e/scenariusze/`, `e2e/czesci.json`, `jakosc-ios.yml`, `e2e-czesci.mjs` ani `e2e-awaria-maszyny.mjs`** (osobny diff: pusty, kod 0). Czyli scenariusze, workflow i mechanizm ponowień są te same co w edf07c5c, a kod produkcyjny aplikacji poza numerem wersji niezmieniony: różnica wyników cz. 2 i cz. 4 między przebiegami nie ma przyczyny w kodzie.
4. Trzy informacyjne czerwienie (PU-008/168/135) **nie są nowe** (DG1 + edf07c5c + ten przebieg); ich klasyfikacja z DG1 pozostaje (PU-008 niewyjaśniony, PU-168/135 wada scenariusza).

## Zadanie 3 — rekomendacja z opcjami i kosztem

Zasady: bez zmiany progów i limitów czasu bez słów właściciela; poprawka = rola 08 `fix` z testem najpierw czerwonym (zasada wspólna 11, P-835); ponowienie ręczne tylko przy awarii maszyny (P-091 10a).

### Cz. 2 (maszyna + mechanizm ponowienia)

| Opcja | Co | Koszt | Kompromis |
|---|---|---|---|
| **A. Ponowienie ręczne samego joba cz. 2** | „Re-run failed jobs” (nie przeze mnie, zakaz DG2) | ≈ 100–140 min runnera macOS (repo publiczne: 0 zł), 0 pracy agentów | Wynik cz. 2 na SHA af327fd7 uzyskany; nie usuwa przyczyny: przy następnej awarii w drugiej połowie przebiegu ten sam efekt |
| **B. Ponowienie tylko scenariuszy bez wyniku** (poprawka workflowu `jakosc-ios.yml`: po awarii maszyny uruchom ponownie **wyłącznie** scenariusz z awarią i niewykonane, nie cały zestaw; wyniki 1. podejścia zachowane) | rola 08 `fix`, test najpierw czerwony (kontrakt bash/junit w `tests/`) | ≈ 1 sesja agenta + 1 przebieg iOS do potwierdzenia (≈ 100 min macOS) | Usuwa przyczynę czerwieni cz. 2 **bez zmiany limitu czasu**; zmienia P-781 („jedno powtórzenie całego zestawu”, jak Trening `e2e-ios.yml:223-228`) — decyzja koordynatora, bo odchodzi od analogii z Treningiem |
| **C. Zmiana podziału części** (4 → 5 części, ten sam zestaw kontroli — E7 pkt 2) | `e2e/czesci.json`, plan części | 1 sesja agenta + pełny przebieg (5 jobów macOS) | Skraca pełny przebieg części (≈ 95 → ≈ 76 min), poprawia szansę, że powtórzenie zmieści się w limicie, ale **nie usuwa** wady (nadal za późna awaria = to samo); +1 job macOS na przebieg |

### Cz. 4 (NFR-WYD-001: zgubione stuknięcie)

| Opcja | Co | Koszt | Kompromis |
|---|---|---|---|
| **A. Ponowienie ręczne części 4** | po decyzji koordynatora, że dowód z dziennika symulatora wystarcza jako „awaria maszyny” | ≈ 102 min macOS (0 zł), 0 pracy agentów | Zielony wynik nie wyjaśnia przyczyny; wynik 31 na SHA af327fd7 byłby uzyskany bez zmiany reguły P-091 9a (reguła nie obejmuje ręcznego ponowienia przy dowodzie maszyny) |
| **D. Rozpoznanie „zgubionego stuknięcia” w `e2e-awaria-maszyny.mjs`** (junit + dziennik symulatora: `skipping event` w oknie ostatniego stuknięcia → klasa maszyna → powtórzenie zestawu jak P-781) | rola 08 `fix` z testem czerwonym najpierw na artefaktach z tego przebiegu (junit + wycinek dziennika) | ≈ 1 sesja agenta + przebieg iOS | **Zmienia P-091 9a** („porażki asercji wartości licznika nie ponawiamy”): wymaga słów koordynatora; ryzyko maskowania realnego błędu licznika ograniczone tym, że klasa wymaga pozytywnego dowodu w dzienniku symulatora, ale ten dowód jest w artefakcie, którego `e2e-awaria-maszyny.mjs` dziś nie czyta |
| **E. Zostawić czerwień do następnego przebiegu** i porównać | 0 | 0 | Bramka cz. 4 zostaje czerwona na `main`; zasada wspólna 21 („czerwony workflow na `main` to znalezisko przed pracą”) nie pozwala na dłuższe zostawienie |

**Rekomendacja:** cz. 2 — **A teraz, potem B** (B usuwa wadę projektu bez ruszania limitu; C tylko jako wsparcie, gdy B zostanie odrzucone). Cz. 4 — **A teraz** (jeden przebieg cz. 4; dowód maszyny jest silny: `backboardd` pominął zdarzenie, licznik stoi na 19) i **D tylko jeśli klasa się powtórzy** (druga porażka tego rodzaju w 3 kolejnych przebiegach); do czasu D nie ruszać `NFR-WYD-001` ani asercji `"20"`. Dodatkowo (P2, nie blokuje): zapas p95 98/100 ms w scenariuszu 31 jest bliski granicy; decyzję o progu zostawiam właścicielowi (zakaz zmiany progów bez jego słów).

Pewność rekomendacji: cz. 2 wysoka; cz. 4 średnia (potwierdza jej jeden przebieg dziennika symulatora; porównanie z zielonymi przebiegami 31 w innych runach nie wykonane: patrz „Do sprawdzenia”).

## Do sprawdzenia (pewność ≤ 80%)

- Czy `skipping event` w dzienniku symulatora występuje także w innych czerwonych stuknięciach (cz. 4 edf07c5c, DG1) i **nie występuje** w zielonych przebiegach 31 — potrzebne artefakty tych przebiegów (wygasają 28.11–30.11).
- Czy `DeviceUnreachableException` w PU-180 ma ten sam początek co zator z 12.11 (artefakt 15202269206, 492 MB, niepobrany).
- Przyczyna zatoru symulatora (backboardd / testmanagerd): `[DO USTALENIA]` od 12.11 (`docs/jakosc/bb-2026-11-12/07-jakosc-2026-11-12.md:139`).

## Komendy (każda osobno)

| Komenda | Kod wyjścia | Wynik |
|---|---|---|
| `git fetch origin koordynacja` + `git show origin/koordynacja:docs/koordynacja/polecenia/DG2.md` | 0 | polecenie DG2 @ 2f63499a |
| `git checkout -B claude/dg2-e2e-main-2026-11-27 3cc0fa87` | 0 | gałąź od 3cc0fa87 |
| MCP `actions_get get_workflow_run 45971994915`, `actions_list list_workflow_jobs` (45971994915 i 45558112022), `list_workflow_run_artifacts 45971994915` | — | jak w tekście |
| MCP `download_workflow_run_artifact 15198615447` + `curl` (355 069 881 B, HTTP 200) + `unzip` w katalogu scratchpadu | 0 | `e2e-out.zip`, 427 plików; junit 27 scenariuszy |
| MCP `get_job_logs` 140459967620, 140459967781, 139024290637 → `curl` adresu logu | 0 (HTTP 200) | logi jobów w scratchpadzie |
| `grep -c "skipping event"` / `grep -c "Service added … Recap"` / `grep -c "(Foundation) Tapping "` na `device-simulator.log` scenariusza 31 | 0 | 10 / 21 / 42 |
| `npm run verify` (pełny wynik: `docs/jakosc/dg2-verify.txt`) | patrz plik | patrz plik |
| `git fetch origin main`, potem `git diff --stat edf07c5c af327fd7 -- app src modules targets plugins package.json package-lock.json app.json e2e .github/workflows/jakosc-ios.yml scripts/ci` | 0 | 6 plików, 106+/6−: wersja 1.0.1, zrzuty sklepu, `kontrola-zakreslen.mjs` (zadanie 2 pkt 3) |
| `git diff --stat edf07c5c af327fd7 -- e2e/scenariusze e2e/czesci.json .github/workflows/jakosc-ios.yml scripts/ci/e2e-czesci.mjs scripts/ci/e2e-awaria-maszyny.mjs` | 0 | pusty |

## Dowody zakresu

Pliki dowodów są lokalne w scratchpadzie sesji (artefakty ≈ 355–492 MB, publiczne repo: nie commitowane): `a4/x/e2e-out/` (artefakt cz. 4), `job4.log` (140459967620), `job2.log` (140459967781), `prev4.log` (139024290637). Powyżej każdy wniosek ma numer przebiegu, joba, scenariusza i wiersz/krok.

## Czego nie sprawdzono

| Co | Dlaczego | Krok i kto |
|---|---|---|
| Zrzut i dziennik PU-180 (cz. 2) | artefakt 492 MB poza budżetem; klasa wynika z junit i logu jobu | koordynator: jeśli potrzebny, osobny krok DG |
| Zielony przebieg 31 jako wzorzec dla `skipping event` | artefakt poprzedniego zielonego przebiegu 31 nie pobrany | wskazane w „Do sprawdzenia” |
| Hipoteza zagłodzenia wątku w symulatorze | brak profilowania | `[DO USTALENIA]` |
