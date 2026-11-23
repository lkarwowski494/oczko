# DG1 — diagnoza czerwonego e2e „część 4, iphone” (Jakość · iOS, run 45193446574)

Sesja DG1 (rola 07-jakosc, tryb audit, zakres: tylko ta diagnoza), 2026-11-23. Commit badany: `6e01d57d` (gałąź `claude/youthful-pasteur-kx83sn`), job `e2e (część 4, iphone)` 137775714332, artefakt `e2e-czesc-4-iphone` 14841186431. Gałąź robocza DG1 startuje z tego samego SHA (`git rev-parse HEAD` = `6e01d57d4b2e8a5e824f9fc3b4db8b33d497bac1`), `git status --porcelain` pusty na starcie.
Nie zmieniałem kodu, workflowów ani scenariuszy; nie wyzwalałem ani nie ponawiałem przebiegów. Dzienniki: `gh`-owe adresy z `actions_get`/`get_job_logs` (MCP GitHub), pobrane do scratchpadu; artefakt rozpakowany lokalnie. Dowody poniżej to polecenia i pliki z tych pobrań (nie są commitowane: duże, publiczne repo).

## Wynik w jednym akapicie

Job jest czerwony z **jednego** powodu: `PU-052` (jedyny z czterech scenariuszy objęty bramką; tag `stan-licznika`, bez ponowienia). Padł na `extendedWaitUntil zdjecia-miniatura` po 60 s, a panel diagnostyczny na zrzucie pokazuje „recode running · photo running”: przekodowanie zdjęcia testowego nie skończyło się w 60 s. **Przyczyna: środowisko / wydajność przekodowania na wolnej maszynie, nierozstrzygnięte, czy wątek był zagłodzony, czy zawieszony** (kod aplikacji, scenariusz i workflow są te same co w ostatnim zielonym przebiegu, a te same 23 scenariusze trwały 1,8–1,9× dłużej). Pozostałe trzy porażki (`PU-008`, `PU-168`, `PU-135`) są **informacyjne** (tag `oczekujacy`, poza bramką), **padają identycznie we wszystkich trzech porównywanych przebiegach, także w zielonym 44722734421**, więc nie są ani „nowe”, ani „nawrotem z 20.11”, ani przyczyną czerwieni jobu.

## Korekta faktów ze zlecenia (§3)

| Twierdzenie ze zlecenia | Ustalenie | Dowód |
|---|---|---|
| PU-008 jest nową porażką (zielony na 15c0bf77) | **Obalone.** PU-008 padał tak samo (ta sama asercja `"2 highlights"`, 2× z ponowieniem) w 44722734421 (`7e3de129`, zielony), 44758359585 (`15c0bf77`) i 45193446574 (`6e01d57d`). Jest `czerwony-informacyjnie`. | `green4.log`/`red15c.log`/`job4.log`: wiersze `[Failed] PU-008 … Assertion is false: "2 highlights"`; `wyniki.txt` artefaktu: `czerwony-informacyjnie 100-pu-008-…` |
| PU-168, PU-135 to nawrót z 20.11 | **Nie nawrót:** padały też w zielonym 44722734421 (`[Failed] PU-168 … (1m 20s)`, `[Failed] PU-135 … (2m 23s)`), informacyjnie. | te same pliki dzienników |
| PU-052 padał tylko w 15c0bf77 i teraz | **Potwierdzone, z doprecyzowaniem:** w 44722734421 PU-052 był **zielony w 1 min**; czerwony w 15c0bf77 (2m 28s) i 6e01d57d (2m 17s). Jedyny scenariusz, który zmienił wynik. | `[Passed] PU-052 … (1m)` vs `[Failed] PU-052 … (2m 17s)` |
| Kod aplikacji identyczny z poprzednimi przebiegami | **Potwierdzone** dla `7e3de129..6e01d57d`: `git diff --stat 7e3de129 6e01d57d -- app src modules targets plugins package.json package-lock.json app.json` pusty. Diff `e2e/` obejmuje tylko `e2e/zrzuty-sklepu/*`; `.github/workflows/jakosc-ios.yml`, `scripts/ci/e2e-czesci.mjs`, `e2e-awaria-maszyny.mjs`, `e2e/czesci.json` bez zmian. | `git diff --stat` (komendy w sesji) |

## Środowisko: to samo oprogramowanie, inna prędkość maszyny

| | 44722734421 (zielony) | 44758359585 | 45193446574 |
|---|---|---|---|
| SHA | `7e3de129` | `15c0bf77` | `6e01d57d` |
| Obraz runnera | macos-26-arm64 20261117.0516.1 | to samo | to samo |
| Xcode / iOS / symulator / Maestro | 26.6 / 26.5 / iPhone 17 / 2.12.1 | to samo | to samo |
| Krok „Scenariusze” części 4 | 60 min (11:49:45→12:49:51) | — | 107 min (14:58:11→16:45:27) |
| Suma czasów 23 wspólnych `[Passed]` | 2083 s | 4013 s (×1,93) | 3711 s (×1,78) |
| PU-052 | `[Passed]` 1 m | `[Failed]` 2m 28s | `[Failed]` 2m 17s |

Dowód ilościowy: ten sam zestaw 23 scenariuszy (te same pliki, ta sama aplikacja) trwał prawie dwa razy dłużej na dwóch ostatnich przebiegach. Pojedyncze przykłady: BR-ZAK-006/S1 3m15s → 4m56s → 6m58s; PU-191 49s → 1m51s → 1m19s. Części 2 i 3 w 6e01d57d miały prędkość jak 20.11 (90 vs 89 min; 103 vs 104 min), więc to kłopot **tej maszyny/pory**, nie całej puli (zgodnie z `docs/fakty-wlasciciela.md`: maszyny macOS bywają obciążone po południu UTC).

## Klasyfikacja każdej porażki

Skala: realny / brzegowy / teoretyczny (zasada wspólna 5) — dla wpływu na użytkownika aplikacji; przyczyna: aplikacja / scenariusz / środowisko.

| Scenariusz | Bramka | Przyczyna | Realność | Pewność |
|---|---|---|---|---|
| **PU-052** (część 4, 16:42–16:45) | **tak** (jedyny powód czerwieni) | **środowisko / wydajność przekodowania zdjęcia na symulatorze** (nierozstrzygnięte: zagłodzony wątek vs zawieszenie) | brzegowy dla użytkownika (tylko symulator z renderowaniem programowym, brak dowodu na urządzeniu) | średnia |
| PU-008 | nie (`oczekujacy`) | **niewyjaśniona rozbieżność aplikacja / scenariusz**: po „Cofnij ostatnią kreskę” + nowym pociągnięciu licznik pokazuje „3 highlights” zamiast 2; deterministyczna w 3/3 przebiegów | brzegowy (możliwy realny błąd cofania w natywnej nakładce; testy jednostkowe go nie sprawdzają) | niska–średnia |
| PU-168 | nie (`oczekujacy`) | **wada scenariusza**: zamknięcie Centrum powiadomień ruchem od 60% do 1% wysokości (`95-…yaml:22`) najwyraźniej go nie zamyka, kolejne `tapOn licznik-plus` trafia w Centrum | teoretyczny | średnia–wysoka |
| PU-135 (AX5) | nie (`oczekujacy`, krok „osobny”) | **wada scenariusza**: po `nav-wstecz` z licznika (wejście z projektu przez podprzepływ `dodaj-czesc-cel.yaml:51`, `120-…yaml:20`) następuje powrót na ekran projektu, a nie na „Dziś” (`120-…yaml:35` oczekuje `dzis-karta`) | teoretyczny | wysoka |

### PU-052 — środowisko (bramka)
- Błąd: `Assertion is false: id: zdjecia-miniatura is visible` po timeoucie 60 s (log jobu: `[Failed] PU-052 … (2m 17s)`; `commands.json` kroku 28/28: `assertCondition … zdjecia-miniatura … FAILED 60861 ms`). Scenariusz: `e2e/scenariusze/99-pu-052-…yaml` (`extendedWaitUntil … zdjecia-miniatura, timeout 60000`).
- Zrzut kroku 28 (`step-028-assertCondition-zdjecia-miniatura.png`): ekran projektu z arkuszem „Take photo / Choose from library” wciąż otwartym, panel `e2e-pomiar-operacji` pokazuje **„recode running · photo running”**, „taps accepted: dzis-kontynuuj 1, e2e-zdjecie-testowe 1” — stuknięcie w zdjęcie testowe doszło (kod: `src/kompozycja/e2e/panele.tsx:78`), przekodowanie natywne (`expo-image-manipulator`, `src/kompozycja/obrazy-aplikacji.ts:1`) wystartowało i nie zakończyło się.
- `device-simulator.log`: między 16:44:08 (po zdarzeniu dotyku) a 16:45:12 proces Oczko nie zapisał ani jednej linii (około 64 s ciszy); w tym oknie brak błędów aplikacji. Nie rozstrzyga, czy wątek był zagłodzony przez maszynę, czy aplikacja się zawiesiła: **[DO USTALENIA]**.
- Nie samo „spowolnienie ×1,9” tłumaczy porażkę: w zielonym przebiegu cały PU-052 trwał 1 min, więc krok zdjęcia zajmował najwyżej kilkanaście sekund, a ×1,9 daje poniżej 30 s, nie ponad 60 s. Pasuje do **przerywanego przestoju przekodowania na przeciążonej maszynie**, znanego od dawna: `docs/jakosc/e2e-dzis/stan-2026-11-09-reaudit.md:41` (scenariusz 17: „recode running · photo running” po ok. 100 s, „niestabilny / wydajność przekodowania … nierozstrzygnięte”) i `docs/jakosc/stan.md:5` („przekodowanie zdjęcia 41 s, #142; 17–30 s w #137”).
- Dlaczego nie regresja aplikacji: kod aplikacji, scenariusz i workflow identyczne z zielonym 44722734421; ten sam przepływ (`e2e-zdjecie-testowe`) w częściach 1–3 tego samego przebiegu 45193446574 jest zielony.
- Czego nie sprawdziłem: zrzutu i dzienników PU-052 z 44758359585 (artefakt 420 MB, poza budżetem); w 15c0bf77 mam tylko wiersz `FAILED … zdjecia-miniatura timeout 60000` z logu jobu, więc **identyczność panelu „recode running” w 15c0bf77 jest niesprawdzona**.

### PU-008 — porażka deterministyczna, nieświeża
- Krok 59/59 (`assertCondition-2_highlights`): po `wzor-cofnij-rysunek` asercja „1 highlight” **przeszła**, po następnym `swipe` (20%,50%→80%,50%) asercja „2 highlights” pada. Zrzuty `…/PU-008…/screenshots/step-059-assertCondition-2_highlights.png` (1. podejście 15:22, ponowienie 15:26): licznik **„3 highlights”**, na stronie dwa pasy, **dolny wyraźnie ciemniejszy** (nakładanie się dwóch kresek w tym samym miejscu). Hierarchia kroku (`screen-hierarchy/step-059-…json`) potwierdza ten sam stan.
- Trzy przebiegi, ten sam krok i ta sama wartość: nie maszyna. Albo cofnięcie przywraca licznik, a nie kreskę w natywnej nakładce (`modules/oczko-wzor/ios/WidokWzoru.swift:379-385`, `cofnijDo`; liczenie przez `canvasViewDrawingDidChange`, `:432-439`), albo Maestro dostarcza pociągnięcie dwa razy po cofnięciu. **Niewyjaśnione dowodem**; testy jednostkowe `tests/ekrany/pu-008-zakreslacz-iphone.test.tsx:27` i `tests/dane/pu-008-zakreslenie-zapis-cofniecie.test.ts:15` nie dotykają natywnej nakładki, więc go nie wykluczają.
- To jedyna porażka z listy, która może być **realnym błędem produktu** (cofnięcie ostatniej kreski w zakreślaczu). Realność brzegowa, bo wymaga cofnięcia i nowego pociągnięcia w tym samym miejscu; pewność nie przekracza 80%, więc idzie do „Do sprawdzenia”.

### PU-168 — wada scenariusza
- Krok 37/37: `tapOn licznik-plus` COMPLETED, `assertVisible licznik-wartosc "2"` FAILED. Zrzut `step-037-assertCondition-2.png`: **ekran blokady / Centrum powiadomień** (4:41, „Mon Nov 23”) z Live Activity „1 · Now row 2” i systemowym pytaniem „Allow Live Activities from Oczko?”; aplikacji pod spodem nie widać.
- Scenariusz zamyka Centrum powiadomień ruchem od środka ekranu w górę (`95-pu-168-…yaml:22`, „start 50%, 60% → 50%, 1%”; Centrum sterowania: `:27`), a systemowe Centrum zamyka się zwykle ruchem od dolnej krawędzi; stuknięcie `licznik-plus` (`:31`) trafia wtedy w warstwę Centrum (wniosek ze zrzutu; zamknięcia nie sprawdzałem osobnym eksperymentem). Nagłówek scenariusza (BX18, `95-…yaml:4`) sam opisuje, że Centrum zabiera aplikację z hierarchii. Wynik taki sam w 3/3 przebiegów (komunikat identyczny).
- Uwaga poboczna (nie obejmuje PU-052, nieweryfikowana): pytanie „Allow Live Activities” jest systemową prośbą, której PU-052 nie wymienia na liście zakazanych (`assertNotVisible` obejmuje powiadomienia, ATT i bibliotekę).

### PU-135 (AX5) — wada scenariusza
- Krok 79: `extendedWaitUntil dzis-karta` (20 s) FAILED po `nav-wstecz` z licznika (`commands.json`: `tapOnElement nav-wstecz` COMPLETED 3322 ms, potem FAILED 21020 ms). Zrzut `step-079-assertCondition-dzis-karta.png`: lista części **ekranu projektu** („Part 1 0 rows”, „Back 2 of 2 rows Goal reached”), nie „Dziś”. Licznik otwarto przez podprzepływ `dodaj-czesc-cel.yaml` (stuknięcie wiersza części na ekranie projektu), więc „‹” wraca do projektu. Wcześniejsze wpisy o PU-135 (`docs/jakosc/bx-stan.md:240,276`) dotyczą innego kroku (przewinięcie do wiersza „Back, .*”), więc to osobna wada tego samego scenariusza.
- Zrzut pokazuje też nałożone napisy diagnostyczne E2E (normalne w buildzie E2E, nie w wydaniu).

## Wpływ na build 1221 w App Review (zadanie 4.2)

**Żadna z czterech porażek nie dotyczy buildu 1221**: PU-052 to przestój przekodowania na symulatorze z diagnostyką E2E (kod aplikacji i ścieżka zdjęć bez różnic od zielonego przebiegu), PU-168 i PU-135 to wady scenariuszy, a PU-008 jest informacyjny; `git diff a830eb21 6e01d57d` (tag `v1.0.0-b1221`, `docs/jakosc/test-fizyczny/1221.md:5`) dotyka tylko ścieżki zrzutów sklepu (`EXPO_PUBLIC_ZRZUTY`, `src/platforma/tryb-e2e.ts`, `src/kompozycja/e2e/panele.tsx`, plakietka strony w `WzorPrzegladarka.tsx`, ZR2), więc produkcyjny kod zdjęć i zakreślacza 1221 jest ten sam. Ryzyko szczątkowe, nazwane: PU-008 (cofnięcie kreski) i ścieżka zdjęć nie miały testu fizycznego w 1221 (protokół: 3 PU zrobione przez właściciela, reszta pominięta jego słowami), więc ewentualny realny błąd cofania zakreślenia nie jest wykluczony na urządzeniu.

## Rekomendacje (tylko opis, bez kodu)

1. **PU-052 (bramka).** Rekomendacja: jedno ręczne ponowienie samej części 4 na innej porze (zasada CLAUDE.md dla awarii maszyny; scenariusz z tagiem `stan-licznika` nie ma ponowienia automatycznego, więc nie rozstrzygnie sam) i zapis wyniku; nie podnosić limitu 60 s ani nie zdejmować asercji (maskowałoby przestój). Opcje: (A) ponowienie części 4, kosztuje ok. 2 h pracy runnera macOS (repo publiczne: bez opłaty); (B) zostawić czerwień do kolejnego przebiegu na `main`/integracji i porównać panel „recode running”; (C) dopisać zrzut panelu `e2e-pomiar-operacji` w kroku przed asercją (dowód zamiast domysłu przy następnej czerwieni; zmiana scenariusza, test czerwony najpierw — poza zakresem tej sesji). **Rekomendacja: A, potem C, jeśli czerwień się powtórzy w tym samym kroku.**
2. **PU-008.** Dopóki nie ma dowodu, że to nie błąd produktu: otworzyć jako osobne zadanie dla roli 08 z testem czerwonym najpierw na poziomie, który widzi natywną nakładkę (test fizyczny F albo scenariusz z zapisanym stanem kresek po cofnięciu); nie zielenić zmianą oczekiwanej wartości.
3. **PU-168 i PU-135.** Wady scenariuszy; naprawa przy najbliższej pracy nad nimi (PU-168: zamknięcie Centrum ruchem od dolnej krawędzi i sprawdzenie powrotu licznika; PU-135: oczekiwać ekranu projektu po „‹” albo wejść do licznika z „Dziś”), każda z testem czerwonym najpierw (zasada 11, P-835). Nie wpływają na bramkę.
4. **Koszt czasu (JAK-09, P2).** Krok „Scenariusze” części 4 zajął 107 min przy limicie 142 min (`timeout_min` = 30 + 4 × scenariusze, `scripts/ci/e2e-czesci.mjs:111`; job 150 min, `jakosc-ios.yml:278`); przy kolejnym spowolnieniu o ok. 30% limit zadziała i ukryje wynik. Do rozważenia przez koordynatora: rozbicie części 4 albo wyjęcie scenariuszy `oczekujacy` z ponowień (wcześniejsza opcja B z `bx30-diagnoza-czesc3.md`).

## Decyzje (pula P-1028…P-1029; tryb „analogia”, do weta)

- **P-1028 (propozycja):** czerwień jobu `e2e (część 4, iphone)` w 45193446574 klasyfikuję jako maszynę/wydajność przekodowania (PU-052), nie regresję kodu; PU-008/168/135 pozostają informacyjne i nie są przyczyną czerwieni. Odrzucone: „regresja kodu” (diff pusty), „podnieść timeout PU-052” (maskowanie). Zależy od: wyniku ponowienia części 4 (warunkowa).
- **P-1029 (propozycja):** PU-008 zostaje otwarty jako możliwy realny błąd produktu (pewność < 80%), osobne zadanie dla roli 08 z testem na poziomie natywnym; nie blokuje wydania 1221, ryzyko szczątkowe nazwane wyżej.
- Analogia z `lkarwowski494/trening` (P-315, P-087): **nie sprawdzałem** repo Treningu w tej sesji (zakres: diagnoza z logów); rekomendacje są oparte na CLAUDE.md oraz `docs/jakosc/bx30-diagnoza-czesc3.md` i podlegają wetu koordynatora.

## Do sprawdzenia (pewność ≤ 80%)

- PU-052: czy panel „recode running · photo running” był też w 15c0bf77 i czy zawsze wygląda tak samo; czy cisza w `device-simulator.log` to zagłodzenie czy zawieszenie (potrzebny zrzut panelu w kroku przed asercją i/lub czas `przekodowanie` ze zielonych przebiegów, które go pokazują w `maestro.log`).
- PU-008: dlaczego po cofnięciu i nowym pociągnięciu licznik wynosi 3 (cofnięcie nie usuwa kreski z nakładki, albo podwójne pociągnięcie).
- Czy pytanie „Allow Live Activities from Oczko?” na ekranie blokady jest zgodne z deklaracją PU-052 (nie zbadane; poza zakresem diagnozy).

## Dowody (lokalne, nie w repo)

Pobrania w scratchpadzie sesji: `job4.log` (job 137775714332), `green4.log` (job 136253992043, run 44722734421), `red15c.log` (job 136377343488, run 44758359585), rozpakowany artefakt 14841186431 (`wyniki.txt`, `commands.json`, `screenshots/`, `screen-hierarchy/`, `logs/maestro.log`, `device-simulator.log` dla PU-008, PU-168, PU-052, PU-135). Wyniki komend: `git diff --stat 7e3de129 6e01d57d -- app src modules targets plugins package.json package-lock.json app.json` (pusty, kod 0), `git diff --stat a830eb21 6e01d57d -- …` (9 plików, tylko ścieżka zrzutów).
