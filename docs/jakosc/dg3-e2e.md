# DG3 — diagnoza czerwonego Jakość · iOS na `main` 03708044 (run 46062593787) i na integracji b5fd442a (run 46078408606)

Sesja DG3 (rola 07-jakosc, tryb audit, zakres: tylko ta diagnoza), 2026-11-28, KO-227. Gałąź robocza `claude/dg3-e2e-2026-11-28` od `b5fd442a`; `git status --porcelain` pusty na starcie. Bez zmian kodu, scenariuszy i workflowów; bez dispatchu i ponowień. Dowody: dzienniki jobów (`get_job_logs`, adres bloba → `curl`, tylko wiersze wyników), artefakty `e2e-czesc-1-iphone` (15242267226) i `e2e-czesc-2-iphone` (15236085107) z `wyniki.txt`, junit i zrzutów.

## Wynik w jednym akapicie

Dwa czerwone przebiegi mają **dwie różne przyczyny; żadna nie jest dowiedzioną regresją EB1**.
- **`main` 03708044, run 46062593787:** czerwony jest **e2e cz. 2 iPhone**, jeden scenariusz z bramki: `02-br-lic-001-s1-pierwsze-uruchomienie` (pierwszy w części). Sterownik Maestro/XCTest nie wstał w 8 min (`IOSDriverTimeoutException: iOS driver not ready in time`), junit nie powstał. Klasa: **maszyna/sterownik**. Pozostałe 26 scenariuszy cz. 2 zielone (PU-288 po ponowieniu P-091 9a). Drzewo 03708044 jest **bajt w bajt tym samym drzewem co 9aa5ee44** (`git rev-parse` obu `^{tree}` = `abc5279b…`), który miał cały przebieg zielony (46017014366): ten sam kod, inny wynik.
- **Integracja b5fd442a, run 46078408606:** czerwony jest **e2e cz. 1 iPhone**, jeden scenariusz z bramki: `17-br-prj-003-s1-zdjecie-etykiety` (BR-PRJ-003/S1, PU-051). Padł w 1. podejściu i w ponowieniu P-091 9a: w obu po 80 s panel pomiarowy mówi „recode running · photo running”, a `zdjecia-miniatura` się nie pojawia. Klasa: **asercja niestabilna znana** (rodzina `zdjecia-miniatura` / opóźnienie zapisu zdjęcia w symulatorze, E2-137-S3, PU-052 w DG1 i edf07c5c) albo **wolna maszyna**. **Regresji EB1 nie ma dowodu, a mechanizm jest wykluczony kodem** (niżej).
- **Ponowienie PE1 nie zadziałało w żadnym z przebiegów.** W integracji nie było czego ponawiać (asercja, nie awaria maszyny). Na `main` **powinno** się uruchomić, a nie uruchomiło się: luka w klasyfikatorze (brak junit, niżej). To jest pierwszy dowód z produkcji i jest negatywny.

## Zadanie 1 — padłe scenariusze i klasa

Skala: aplikacja / scenariusz / maszyna; realność dla użytkownika: realny / brzegowy / teoretyczny.

### Run 46062593787 · `main` 03708044 (push, merge PR #5)

| Job | Wynik | Uwagi |
|---|---|---|
| build, swift-test, zegarek-ikona | success | |
| eksperymenty-wzoru | failure (`xcodebuild` kod 65, krok W1–W3) | informacyjny (`continue-on-error`), tak samo w 9aa5ee44 (140566615503) |
| e2e cz. 1 iPhone / cz. 3 / cz. 4 / cz. 1 iPad | success | |
| **e2e cz. 2 iPhone** (140730212799) | **failure**, krok „Scenariusze” 20:49:54–22:24:03 | niżej |

| Scenariusz | Bramka | Wynik | Klasa | Realność | Pewność |
|---|---|---|---|---|---|
| `02-br-lic-001-s1-pierwsze-uruchomienie` | tak | **czerwony** (`wyniki.txt`); 20:49:54–20:58:32 ≈ 8,6 min = `MAESTRO_DRIVER_STARTUP_TIMEOUT` 480000 ms; log: `IOSDriverTimeoutException: iOS driver not ready in time`; `maestro-failures: brak nieudanych kroków` (żaden krok nie ruszył) | **maszyna/sterownik** | teoretyczny (aplikacja nie została uruchomiona) | wysoka (≈ 95%) |
| `107-pu-288-…` | tak | `w-ponowieniu` (1. podejście: `zdjecie-udostepnij` niewidoczne, 2 m 27 s; ponowienie P-091 9a zielone, 1 m 41 s) | scenariusz/maszyna, mechanizm P-091 9a zadziałał | brzegowy | średnia |
| pozostałe 25 | | zielone | | | |

Dowód, że to nie junit: artefakt `e2e-czesc-2-iphone` zawiera dla 02 **tylko** `e2e-out/02-…/2026-11-27_204959/xctest_runner_2026-11-27_205028.log` (24 wiersze: `Testing started`, brak wykonania testu), **bez** pliku `e2e-out/02-…xml`. `scripts/ci/e2e-awaria-maszyny.mjs:35`: `if (!plik || !fs.existsSync(plik)) process.exit(1)` → „porażka scenariusza” → `jakosc-ios.yml:375` nie wchodzi w gałąź awarii → wiersz 02 trafia do `czerwony` i `porazki=1` → `exit 1`. Wzorzec `/iOS driver not ready in time/` (`e2e-awaria-maszyny.mjs:11`) jest poprawny, ale **czyta tylko junit**, a ten błąd Maestro zgłasza na konsoli, zanim junit powstanie.

### Run 46078408606 · integracja b5fd442a

| Job | Wynik | Uwagi |
|---|---|---|
| build, swift-test, zegarek-ikona | success | |
| eksperymenty-wzoru | failure | informacyjny, jak wyżej |
| e2e cz. 2, 3, 4 iPhone; cz. 1 iPad | success | |
| **e2e cz. 1 iPhone** (140780605626) | **failure**, krok „Scenariusze” 23:22:22–01:24:00 (122 min; w 9aa5ee44 107 min, na `main` 101 min) | niżej |

Wyniki cz. 1 z `wyniki.txt` (artefakt 15242267226), 26 scenariuszy: 20 zielonych, 5 `czerwony-informacyjnie`, 1 `czerwony` (bramka).

| Scenariusz | Bramka | Wynik | Klasa | Realność | Pewność |
|---|---|---|---|---|---|
| `17-br-prj-003-s1-zdjecie-etykiety` (BR-PRJ-003/S1, PU-051) | **tak** | **czerwony**, 2×: 3 m 39 s i ponowienie 3 m 18 s; `Assertion is false: id: zdjecia-miniatura is visible` po 20 s + 60 s (`e2e/scenariusze/17-…yaml:25,31`; kroki 57 i 60 w `commands.json`) | asercja niestabilna znana / wolna maszyna (nie regresja EB1) | brzegowy (zapis zdjęcia > 80 s zaobserwowany tylko w symulatorze CI; wynik z telefonu dla tej pozycji nie był sprawdzany w DG3) | średnia–wysoka (≈ 80%) |
| `102-pu-292`, `108-pu-044`, `119-pu-057`, `91-pu-290`, `92-pu-112` | nie | `czerwony-informacyjnie` | **nie nowe**: identyczny zestaw w 9aa5ee44 (job 140578826640) i na `main` (140730212832) | — | wysoka |
| `111-pu-138` (AX5) | nie | czerwony informacyjnie, także w obu poprzednich | j.w. | — | wysoka |

Zrzut kroku 60 (`e2e-out/17-…/2026-11-28_001345/…/step-060-assertCondition-zdjecia-miniatura.png`): ekran „Harbor”, grupa „Photos” z przyciskiem „Add photo”, menu „Take photo / Choose from library / Cancel” nadal otwarte, panel E2E: **„Test photo (EXIF GPS) · recode running · photo running”**, „taps accepted: dzis-kontynuuj 1, e2e-zdjecie-testowe 1”. Czyli stuknięcie w zdjęcie testowe **dotarło** (licznik przyjętych stuknięć = 1), a zapis zdjęcia (rekodowanie) po 80 s **jeszcze trwa**. Hierarchia ekranu ponowienia ma ten sam napis (`screen-hierarchy/step-060…json`). To nie jest zgubione stuknięcie ani zły ekran.

## Zadanie 2 — czy to regresja EB1 (9aa5ee44..b5fd442a)

Zakres zmian: `git diff --stat 9aa5ee44..b5fd442a` = 13 plików; kod aplikacji tylko `src/przypadki-uzycia/dziennik.ts`, `src/dane/repozytoria/liczniki.ts`, `src/konfiguracja.ts` (stała `POCZEKALNIA_EKRANU_MS`), `src/ekrany/Aplikacja.tsx` (+4 wiersze), `src/przypadki-uzycia/zgloszenie.ts` (linia diagnostyczna); reszta to testy i dokumenty. **Żadnego pliku `e2e/`, `.github/workflows/`, `scripts/ci/`** (`git diff --stat 9aa5ee44 b5fd442a -- e2e .github scripts/ci` pusty).

Hipoteza do obalenia: scalenie na AppState `inactive` w trakcie scenariusza (`src/ekrany/Aplikacja.tsx:180-182`, gałąź `else if (c === 'inactive')`). **Obalona kodem:**
1. Gałąź działa tylko przy `wTle.current === true` (`Aplikacja.tsx:182`). `wTle` startuje `false` (`:131`) i staje się `true` wyłącznie na `background` (`:176`). Scenariusz 17 do kroku 57 jest bez opuszczania aplikacji (`start-czysty` → projekt → „Add photo” → pozycja testowa; menu „Add photo” to arkusz własny, `e2e-zdjecie-testowe` to `Pressable` w panelu E2E, `src/kompozycja/e2e/panele.tsx:78`, bez systemowego pickera). Gałąź `inactive` nie ma więc jak się wykonać przed krokiem, który padł.
2. Pozostała zmiana na ścieżce scalenia: jedno dodatkowe `SELECT` z poczekalni przy każdym scaleniu (`dziennik.ts:103`, `poczekalniaEkranu(z.baza)`), poza transakcją. Scalenie zaczyna się przy `active`; to jeden odczyt lokalny, nie wyjaśnia rekodowania zdjęcia trwającego > 80 s (rekodowanie jest innym kodem, niezwiązanym z dziennikiem).
3. Identyczny zestaw 5 + 1 czerwieni informacyjnych w cz. 1 w trzech przebiegach (9aa5ee44 zielony, `main`, b5fd442a): EB1 niczego nie zmienia w tym zestawie.
4. Ta sama rodzina porażki (`zdjecia-miniatura`) wystąpiła **przed** EB1: PU-052 w edf07c5c (25.11) i DG1 (23.11), `docs/jakosc/dg2-e2e.md:74`; scenariusz 17 zawiera od E2-137-S3 krok „dowód opóźnienia” (`e2e/scenariusze/17-…yaml:25-31`) właśnie dlatego.
5. Cz. 1 b5fd442a trwała o ok. 15–20% dłużej niż na 9aa5ee44 i `main` (122 vs 107 vs 101 min) — wskazuje wolniejszą maszynę, ale to **wniosek pośredni**, nie dowód.

Czego **nie** wiem (nie przekracza progu 80% dla regresji): czy rekodowanie zdjęcia dałoby się spowolnić przez zajętość kolejki zapisu (`wKolejce`) przy starcie, czyli czy jakiekolwiek scalenie przy pierwszym `active` blokuje je dłużej niż przed EB1. Sprawdzenie wymaga czasu zapisu z logu aplikacji (`e2e-pomiar-operacji`, „recode N ms”) z przebiegu zielonego tego samego scenariusza vs. tego; nie mam go dla b5fd442a (zielone przebiegi nie zapisują liczby w `wyniki.txt`). Najtańsza kontrola: ręczne ponowienie samego joba cz. 1 (poniżej, opcja A). Jeśli 17 przejdzie na tym samym SHA, klasa = niestabilność/maszyna ostatecznie.

## Zadanie 3 — czy ponowienie PE1 zadziałało (pierwszy dowód z produkcji)

| Przebieg | Awaria maszyny wykryta? | PE1 uruchomione? | Wynik |
|---|---|---|---|
| 46078408606 (integracja), cz. 1 | nie (asercja) | nie, nie było czego | poprawnie nie ruszyło; P-091 9a ponowił 17 (nadal czerwony) |
| 46062593787 (`main`), cz. 2 | **tak powinna** (`IOSDriverTimeoutException`) | **nie** | luka: brak pliku junit → klasyfikator zwraca „porażka scenariusza” (`e2e-awaria-maszyny.mjs:35`) |

W wynikach brak `awaria-maszyny`, brak `::warning::Awaria maszyny` i brak linii „ponowione scenariusze (PE1)” w podsumowaniu kroku. Skutek: cz. 2 czerwona z powodu **jednego** scenariusza, którego ponowienie (jedno powtórzenie, 8,6 min wg limitu startu, a w razie sukcesu ≈ 2–5 min) zmieściłoby się w limicie kroku (142 min przy 94 min zużytych w 1. podejściu: 48 min zapasu).

Szkic mechanizmu (bez poprawki): `przebieg()` (`.github/workflows/jakosc-ios.yml:365-385`) uruchamia `maestro … --output e2e-out/$n.xml`; gdy sterownik nie wstanie, Maestro kończy się kodem ≠ 0 **bez zapisu pliku**, a w `e2e-out/$n/<data>/` zostaje tylko `xctest_runner_*.log`. Klasyfikator widzi brak pliku → exit 1 → dalej ścieżka `PONAWIALNE`/`BRAMKA` (02 nie jest w `PONAWIALNE`) → `czerwony`.

## Zadanie 4 — rekomendacja z opcjami i kosztem

Zasady: poprawka = rola 08 `fix`, test najpierw czerwony (zasada wspólna 11, P-835); bez zmiany progów i limitów czasu bez słów właściciela; ręczne ponowienie tylko przy awarii maszyny (P-091 10a, CLAUDE.md „jedno ponowienie ręczne”).

### `main` (cz. 2) — luka PE1

| Opcja | Co | Koszt | Kompromis |
|---|---|---|---|
| **A. Ponowienie ręczne joba cz. 2 na `main`** (decyzja koordynatora; nie przeze mnie) | „Re-run failed jobs”; kod identyczny z zielonym 9aa5ee44 | ≈ 100–140 min macOS, 0 zł (repo publiczne), 0 agentów | daje zielony `main` bez przyczyny; to klasa „maszyna” z dowodem z dziennika, więc mieści się w P-091 10a |
| **B. Poprawka klasyfikatora (08 fix)** | w `przebieg()` traktuj jako awarię maszyny także: brak `e2e-out/$n.xml` przy kodzie ≠ 0 **i** obecność `e2e-out/$n/**/xctest_runner_*.log` bez `commands.json` (albo wzorzec w stderr Maestro); test w `tests/jakosc/e2e-awaria-maszyny.test.ts` najpierw czerwony na obecnym kodzie (brak junit → dziś exit 1) | ≈ 1 sesja 08 (≈ 1–2 USD, mały diff) + 1 przebieg iOS jako dowód (≈ 100 min macOS) | domyka dokładnie przypadek z tego przebiegu; trzymać wąsko (nie „każdy brak junit” — brak junit bywa też po przerwaniu przez limit) |
| **C. Dodać `02-br-lic-001` do `PONAWIALNE`** | scenariusz startowy ponawiany przy dowolnej porażce | trywialny | maskuje prawdziwą porażkę pierwszego uruchomienia (BR-LIC-001 to główny przepływ); **odradzam** |

**Rekomendacja: A teraz, B jako zadanie 08 fix.** B nie zmienia limitu czasu ani P-091 9a.

### Integracja b5fd442a (cz. 1) — scenariusz 17

| Opcja | Co | Koszt | Kompromis |
|---|---|---|---|
| **A. Ponowienie ręczne samego joba cz. 1 na b5fd442a** | rozstrzyga klasę: zielony = niestabilność/maszyna; czerwony 3. raz = kolejny sygnał do diagnozy rekodowania | ≈ 105–125 min macOS, 0 zł, 0 agentów | nie wyjaśnia przyczyny; reguła P-091 9a nie obejmuje ręcznego ponowienia przy asercji — wymaga słów koordynatora (jak DG2 cz. 4 opcja A) |
| **B. Diagnoza rekodowania (08, bez zmiany scenariusza)** | wyciąg „recode N ms” z zielonych przebiegów 17 vs czerwonego; czy rekodowanie 48×36 JPEG może trwać > 80 s (software GL, zator) | ≈ 1 sesja 08 + brak nowego przebiegu (dane z artefaktów) | tylko gdy A da czerwony po raz trzeci |
| **C. Podnieść limit czekania w scenariuszu 17** | `timeout` 60000 → większy | trywialny | **odradzam** bez dowodu: maskuje możliwe spowolnienie aplikacji (decyzje progu tylko za słowami właściciela, DG2) |

**Rekomendacja: A (jedno ręczne ponowienie cz. 1), potem scalanie integracji do `main` wg zwykłej ścieżki dopiero po zielonym wyniku na tym SHA; B tylko przy kolejnej czerwieni 17 na tym samym SHA.**

### Rejestr (nie z tej sesji)

Informacyjne czerwone w cz. 1 (PU-292, PU-044, PU-057, PU-290, PU-112, PU-138) są **stałe** w trzech kolejnych przebiegach; nie blokują, ale nie mają jeszcze własnej diagnozy klasy (w DG1/DG2 opisane były PU-008/168/135 z cz. 4). Do osobnego audytu, nie do DG3.

## Komendy i stan

- `git rev-parse 9aa5ee44^{tree} 03708044^{tree}` → identyczne drzewo (`abc5279b…`).
- `git diff --stat 9aa5ee44..b5fd442a` → 13 plików, kod aplikacji w 5 plikach `src/` (wyżej).
- `npm run verify` — patrz `docs/jakosc/dg3-verify.txt` (podsumowanie i kod wyjścia).
- Brak ponowień i dispatchów z tej sesji; brak zmian poza `docs/jakosc/dg3-e2e.md`, `docs/jakosc/dg3-verify.txt`, `docs/decyzje.md`.

## Nie sprawdzono

| Co | Dlaczego | Krok i kto |
|---|---|---|
| Czas rekodowania zdjęcia w zielonych przebiegach scenariusza 17 | `wyniki.txt` nie zawiera liczby; pobranie dwóch kolejnych artefaktów (≈ 0,4 GB każdy) poza budżetem DG3 | 08 (opcja B), dopiero po 3. czerwieni |
| Wpływ kolejki zapisu (`wKolejce`) przy pierwszym `active` na rekodowanie | wymaga uruchomienia na symulatorze (macOS) | ręczne ponowienie cz. 1 (opcja A) |
| Dlaczego sterownik nie wstał na `main` cz. 2 | log `xctest_runner` kończy się na „Testing started”; przyczyna po stronie runnera | brak kroku (klasa „maszyna”), opcja B tylko domyka detekcję |
