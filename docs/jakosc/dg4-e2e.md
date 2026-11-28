# DG4 — diagnoza czerwonego Jakość · iOS na integracji a19146b8 (run 46132804091, e2e cz. 4 iPhone)

Sesja DG4 (rola 07-jakosc, tryb audit, zakres: tylko ta diagnoza), 2026-11-28, KO-240. Gałąź robocza `claude/dg4-e2e-cz4-2026-11-28` od `9404a59a` (kod aplikacji = `a19146b8`); `git status --porcelain` pusty na starcie i na końcu (poza dokumentami tej sesji). Bez zmian kodu, scenariuszy i workflowów; bez dispatchu i ponowień. Format: raport diagnozy jak DG2/DG3 (polecenie DG4), nie pełny szablon audytu; `sprawdz-raport.mjs` nie uruchamiany.

Dowody (artefakty ≈ 300–400 MB, repo publiczne — nie commitowane; leżą w scratchpadzie sesji): artefakt `e2e-czesc-4-iphone` 15262192594 (DG4), 15215514596 (run 46017014366, 9aa5ee44, przed EB1), 15240354965 (run 46078408606, b5fd442a, po EB1) — `wyniki.txt`, junit, `commands.json`, `screen-hierarchy/*.json`, zrzuty, `device-simulator.log`; dziennik joba 140948237483 (`get_job_logs` → `curl`).

## Wynik w jednym akapicie

**Czerwony job cz. 4 powodują dwa scenariusze z bramki, których polecenie nie wymieniało: `05-br-zak-006-s1-limit-zawczasu` i `08-br-dan-006-s1-eksport-import`.** PU-168 i PU-008 są `czerwony-informacyjnie` (poza `BRAMKA`) i nie zmieniają wyniku joba. Żadna z czterech porażek nie jest dowiedzioną regresją EB1 i żadna nie jest „zgubionym stuknięciem” w sensie DG2 (brak `skipping event`, stuknięcie w 05 doszło do aplikacji).
- **PU-168: wada scenariusza, deterministyczna, identyczna przed EB1 (9aa5ee44), po EB1 (b5fd442a) i teraz.** Centrum powiadomień otwiera się od pierwszego gestu i **nigdy się nie zamyka** (zrzuty „po centrum powiadomień” i „po centrum sterowania” są bajt w bajt tym samym obrazem); ostatnie „+1” trafia w nakładkę systemu. Teza PU („gest z górnej krawędzi nie dodał rzędu”) jest przy tym potwierdzona stanem aplikacji (`plus 1`, `state value: 1`).
- **PU-008: deterministyczna rozbieżność, nie niestabilność, nie regresja EB1.** 6 z 6 podejść w trzech przebiegach pada tak samo: po „cofnij → nowe przeciągnięcie” etykieta mówi „3 highlights”, a na zrzucie są 2 pasy. Kod wzoru nie zmienił się od 9aa5ee44. Kandydat na **realną usterkę aplikacji** (etykieta liczby zakreśleń), pewność średnia (≈ 65%).
- **05 i 08: niestabilne, klasa „zator symulatora/runnera”, regresji EB1 nie dowiedziono (pewność ≈ 75%, poniżej progu 80% dla klasy „maszyna”).** Oba były zielone przed i po EB1 na tych samych plikach scenariuszy; w 05 pierwsze „+1” renderowało się **17 700 ms** (panel pomiarowy; mediana pozostałych scenariuszy ≈ 100 ms), w 08 **2 783 ms**. Stuknięcie doszło, zapis się powiódł, ekran zmienił się za późno dla asercji.
- **Klasyfikator KA1 zadziałał poprawnie**: wszystkie 4 porażki to asercje z junit i `commands.json`, brak wzorców awarii maszyny, brak ponowienia poza PU-008 (jedno ponowienie P-091 9a, nadal czerwone).

## Pytanie 3 — klasyfikator KA1 (P-1085) i bramka

Dowód z dziennika joba 140948237483 (krok „Scenariusze” 10:30:48–11:57:03):
- Plan części: 05, 08, 95 i 03 mają znacznik „własna asercja licznika / pomiar: bez ponowienia” (log, wiersze 284–307); `PONAWIALNE` zawiera 100 (PU-008).
- `node scripts/ci/e2e-awaria-maszyny.mjs <junit> <katalog>` uruchomiony **na artefakcie** dla 05, 08, 95, 100 → **kod 1 we wszystkich czterech** (= „porażka scenariusza”, nie awaria maszyny); każdy ma junit i `commands.json`. W dzienniku brak `::warning::Awaria maszyny`, brak `DeviceUnreachable` i `iOS driver not ready` (jedyny trafiony wiersz to tekst skryptu workflowu, nie wynik).
- Wynik `wyniki.txt`: `czerwony` 05 i 08 (bramka, `porazki=2` → `exit 1`), `czerwony-informacyjnie` 95 i 100; PU-008 ponowione 1× (P-091 9a), czerwone drugi raz. **Zgodnie z P-091 9a i P-1085: porażki asercji nie ponawiamy; mechanizm zadziałał tak, jak zaprojektowano.** Konsekwencja projektowa (nie błąd KA1): lista „bez ponowienia” obejmuje 19 z 27 scenariuszy części; jednorazowy zator na pierwszym „+1” zawsze czerwieni bramkę.

## Pytanie 1 — PU-168 (gest od górnej krawędzi, potem „+1”; asercja „2” nie przeszła)

Scenariusz: `e2e/scenariusze/95-pu-168-centrum-powiadomien-i-sterowania-bez-rzedu.yaml:16-31`. Krok 37/37 (`commands.json`): `FAILED assertCondition "2", id: licznik-wartosc`, po 17,9 s oczekiwania.

| Przebieg | SHA | Wynik PU-168 | Komunikat | Hash zrzutów „po centrum…” | `counter input` w kroku 37 |
|---|---|---|---|---|---|
| 46017014366 | 9aa5ee44 (przed EB1) | czerwony-informacyjnie | `"2", id: licznik-wartosc` | 9fe4c599 = 9fe4c599 | `plus 1 … state value: 1` |
| 46078408606 | b5fd442a (po EB1) | czerwony-informacyjnie | j.w. | b225d2e8 = b225d2e8 | j.w. |
| 46132804091 | a19146b8 | czerwony-informacyjnie | j.w. | bbde4107 = bbde4107 (+ krok 35 też) | j.w. |

Co pokazują dowody:
1. **Wynik identyczny w trzech przebiegach, także przed EB1** (i w DG1, edf07c5c, af327fd7 wg `docs/jakosc/dg2-e2e.md:24`). Zmiana EB1 nie ma tu wpływu.
2. **Mechanizm:** pierwszy gest `50%,1% → 50%,60%` (krok 23) otwiera Centrum powiadomień, które na iOS 26 wygląda jak ekran blokady (zrzut kroku 37: godzina, Live Activity „Counter from Nov 12…” z pytaniem „Allow Live Activities from Oczko?”, powiadomienie systemowe). Gesty „zamykające” (kroki 25, 30) startują wewnątrz otwartego panelu i niczego nie zamykają: zrzuty kroków 27 i 32 (`95-po-centrum-powiadomien`, `95-po-centrum-sterowania`) oraz krok 35 mają **ten sam hash**. Aplikacja zostaje w hierarchii XCUI pod nakładką (stąd „1” przechodzi w krokach 24, 26, 31, mimo że ekranu aplikacji nie widać). Ostatnie `tapOn licznik-plus` (krok 36, start `813265`, trwał 4 372 ms) trafia w nakładkę; aplikacja dostaje `plus 1` tylko z pierwszego stuknięcia → „2” nigdy się nie pojawia.
3. **Czas między powrotem a stuknięciem** (`commands.json`, znaczniki startu): koniec ostatniego „zamknięcia” 809 582 → stuknięcie 813 265 = **3,7 s** (w tym 2,2 s opcjonalnej asercji `e2e-nigdy` z podprzepływu `odstep.yaml`). To nie jest za krótki odstęp: aplikacja nigdy nie wróciła na pierwszy plan.
4. **EB1 jest tu nieosiągalne kodem:** gałąź `inactive` scalenia (`src/ekrany/Aplikacja.tsx:179-182`) działa tylko przy `wTle.current === true`, a `wTle` ustawia wyłącznie `background` (`:176`). Centrum powiadomień i sterowania dają `inactive`, nie `background`. Ślad „refresh: started 1, applied 1” w kroku 35 pochodzi z gałęzi `active` (kod sprzed EB1).
5. **Teza PU potwierdzona stanem aplikacji:** po wszystkich gestach `e2e-licznik-wejscia` mówi `plus 1, minus 0; state value: 1` — żadne „+1” z gestu górnej krawędzi nie doszło.

**Werdykt: wada scenariusza (deterministyczna), nie maszyna i nie regresja EB1. Realność dla użytkownika: teoretyczny. Pewność: wysoka (≈ 90%).** (BX-057 w `docs/jakosc/bx-stan.md:317` uznał ją za „naprawioną” po zmianie asercji na `assertNotVisible`; końcowy `tapOn licznik-plus` + „2” nadal zakłada, że Centrum się zamknęło.)

## Pytanie 2 — PU-008 (zakreślenie: po przeciągnięciu brak „2 highlights”)

Scenariusz: `e2e/scenariusze/100-pu-008-zakreslenie-widac-od-razu-cofnij-ostatnia-kreske.yaml`. Krok 59/59 pada w **ostatniej asercji po cofnięciu**: po `tapOn wzor-cofnij-rysunek` etykieta mówi „1 highlight” (krok 57, COMPLETED), po **kolejnym** `swipe 20%,50% → 80%,50%` asercja „2 highlights” pada, bo hierarchia (`wzor-zakreslenia`) mówi **„3 highlights”**. Zrzut kroku 59 (ponowienie, 10:47): w tle dokumentu **dwa** żółte pasy (ok. 35% i 50% wysokości), etykieta u góry „3 highlights”.

| Przebieg | 1. podejście | Ponowienie P-091 9a |
|---|---|---|
| 9aa5ee44 | `3 highlights` (junit: `"2 highlights"` nie widoczne) | `3 highlights` |
| b5fd442a | `3 highlights` | `3 highlights` |
| a19146b8 | `3 highlights` | `3 highlights` |

- **To nie niestabilność gestu:** 6 z 6 podejść w 3 przebiegach, ten sam skutek (nie „0 pasów”, nie brak gestu — gest zadziałał i dodał pas; wynik liczbowy jest za wysoki).
- **To nie regresja EB1:** `git diff --stat 9aa5ee44 a19146b8 -- src/ app/ modules/` = 5 plików (`src/dane/repozytoria/liczniki.ts`, `src/ekrany/Aplikacja.tsx`, `src/konfiguracja.ts`, `src/przypadki-uzycia/dziennik.ts`, `src/przypadki-uzycia/zgloszenie.ts`); **żaden nie dotyka wzoru, zakreślacza ani `modules/oczko-wzor`**, a wynik jest ten sam przed EB1.
- **Kandydat na usterkę aplikacji, nie scenariusza:** sekwencja „zakreśl A → zakreśl B → cofnij → zakreśl B ponownie” daje na ekranie 2 pasy, a etykieta liczy 3 (jakby cofnięta kreska nadal była w liczniku natywnej warstwy). Hipoteza (nie sprawdzona kodem natywnym, pewność ≈ 65%): licznik z natywnego widoku PDF (`app/wzor.tsx:61`, `ustawZakreslenia`) i lista rysunków rozjeżdżają się po cofnięciu.
- **Luka testowa (JAK-01/JAK-03, P2):** `tests/ekrany/pu-008-zakreslacz-iphone.test.tsx:27` sprawdza „1 → 2 → cofnięcie → 1”, `tests/dane/pu-008-zakreslenie-zapis-cofniecie.test.ts:15` „pas 1 → pas 2 → cofnięcie → restart”; **żaden nie sprawdza „cofnięcie → nowy pas”**, czyli dokładnie kroku, który pada.
- Ostatnie kroki scenariusza (restart i „2 highlights” po restarcie) **nigdy nie były osiągnięte** w żadnym z 3 przebiegów: stan po restarcie (czy cofnięty pas wraca do zapisu) `[DO USTALENIA]`; to tylko ten krok może dotyczyć danych użytkownika.

**Werdykt: stały, niewyjaśniony defekt aplikacja/scenariusz; rekomendowana klasa „realny defekt etykiety (S3, P2)” do rozstrzygnięcia testem; bez związku z EB1. Realność: brzegowy (wymaga cofnięcia i ponownego zakreślenia). Pewność klasy: średnia.**

## Pytanie 1+2 — co faktycznie czerwieni job: scenariusze 05 i 08 (bramka)

`wyniki.txt` (artefakt 15262192594): 03 zielony, **05 czerwony**, **08 czerwony**, 95 i 100 informacyjnie, 100 ponowiony 1×, pozostałe 21 zielonych. Przed EB1 i po EB1 (artefakty 15215514596, 15240354965) 05 i 08 były **zielone** na tych samych plikach scenariuszy.

| | 05 · BR-ZAK-006/S1 | 08 · BR-DAN-006/S1 |
|---|---|---|
| Krok i asercja | 19/19: po `tapOn licznik-plus` „1” w `licznik-wartosc` (czekała 18,3 s, 10:39:15→10:39:33) | 119/119: po `tapOn nav-projekty` i `projekty-lista` widoczna — tekst „Harbor” |
| Stan w hierarchii po porażce | `licznik-wartosc` = „1”; `counter input: plus 1; saves ok: plus 1; state value: 1`; **`e2e-pomiar-plus: first 17700 ms`** | lista z „Harbor” **jest na zrzucie**; `e2e-pomiar-plus` z wcześniejszego kroku 22: **first 2783 ms** |
| Znaczenie | stuknięcie doszło (UIKit: zdarzenie 10:39:14.56–.70, `Tapping took 0.33 s`), zapis OK, **ekran odświeżył się po ≈ 17,7 s**; asercja wygasła ≈ 1 s po renderze | ten sam przebieg wolnych renderów; lista pojawiła się po terminie asercji |
| Zrzut kroku | `step-019…png`: licznik „1”, panel jak wyżej | `step-119…png`: „Harbor” widoczne |

Pomiar „first N ms” (czas od stuknięcia do zmiany licznika, `e2e-pomiar-plus`) dla pierwszego „+1” w tym samym artefakcie — 3 przebiegi, 20 wspólnych scenariuszy: mediana ≈ 100 ms, zakres 48–349 ms; **jedyne odstępstwa to 05 (17 700), 08 (2 783) w DG4 oraz PU-052 (`99-…`, 5 012 ms) w 9aa5ee44, czyli przed EB1** (ten scenariusz był wtedy zielony). Zator tego rodzaju występował więc przed EB1 i nie dał wtedy czerwieni tylko dlatego, że mieścił się w oknie asercji.

Dlaczego klasa „maszyna/zator” a nie „regresja EB1” (pewność ≈ 75%):
1. 05 i 08 zielone przed i po EB1; zmiana kodu od 9aa5ee44 to 5 plików, a ścieżka zimnego startu (`wTle` = false) **nie wykonuje** gałęzi `inactive` EB1 przed pierwszym „+1”. Jedyny koszt EB1 na tej ścieżce to jedno dodatkowe `SELECT` z poczekalni przy każdym scaleniu (`src/przypadki-uzycia/dziennik.ts:103`, poza transakcją) — milisekundy, nie 17 s.
2. Zator jest nietypowy dla aplikacji, ale typowy dla tego runnera: ten sam przebieg ma 100 k wierszy `apsd` na 18 s (50–65% logu we **wszystkich** scenariuszach, więc nie wyróżnia 05), a zatory symulatora są udokumentowane od 12.11 (`docs/jakosc/bb-2026-11-12/07-jakosc-2026-11-12.md:139`, `docs/jakosc/dg2-e2e.md`).
3. Przeciw (dlatego tylko ≈ 75%): nie mam dowodu, że wątek główny symulatora był zajęty z przyczyn maszyny, a nie aplikacji; 17,7 s na pierwszym „+1” byłoby dla użytkownika S1 (liczy się główny przepływ). Najtańsza kontrola: ponowienie joba cz. 4 i odczyt `first N ms` w 05 (jeśli zielony i ≈ 100 ms → zator maszyny; jeśli powtórzy się > 1 000 ms → diagnoza aplikacji).

**Werdykt: 05 i 08 = niestabilne (zator), bez dowodu regresji; realność: brzegowy (symulator CI; na telefonie nie zmierzono); pewność ≈ 75%.**

## Zadanie 4 — rekomendacja z opcjami i kosztem

Zasady: poprawka = rola 08 `fix`, test najpierw czerwony (zasada wspólna 11, P-835); bez zmiany progów i limitów czasu bez słów właściciela; reguła P-091 9a („porażek asercji wartości licznika nie ponawiamy”) zmienia się tylko decyzją koordynatora.

### Czerwony job cz. 4 (bramka: 05 i 08)

| Opcja | Co | Koszt | Kompromis |
|---|---|---|---|
| **A. Ponowienie ręczne samego joba cz. 4 na a19146b8** (decyzja koordynatora; nie przeze mnie) | „Re-run failed jobs” | ≈ 100–110 min macOS (cz. 4 trwała 99 min), 0 zł (repo publiczne), 0 agentów; wymaga okna maszyn macOS (zwykle brak 14:00–23:00 UTC wg `docs/fakty-wlasciciela.md`) | rozstrzyga klasę 05/08: zielony → zator; czerwony w 05 z `first N ms` > 1 000 → diagnoza aplikacji. Poza literą P-091 9a/10a (to asercja, nie awaria sterownika) — wymaga słów koordynatora, jak DG2 cz. 4 A |
| **B. Rozszerzenie klasyfikatora o „zator odczytu” (08 fix)** | junit + `e2e-pomiar-plus: first N ms` ≥ próg (np. 5 000 ms) w hierarchii porażki → klasa maszyna → jedno powtórzenie scenariusza; test najpierw czerwony na artefakcie z tego przebiegu (05: 17 700 ms) | ≈ 1 sesja 08 (≈ 1–2 USD) + 1 przebieg iOS jako dowód (≈ 100 min macOS) | zmienia P-091 9a (decyzja koordynatora); ryzyko maskowania realnego zatoru aplikacji ograniczone progiem i zapisem w podsumowaniu; próg to decyzja produktowa → właściciel/koordynator |
| **C. Nic nie zmieniać, poczekać na kolejny przebieg** | 0 | 0 | integracja zostaje czerwona (zasada wspólna 21 zabrania dłuższego zostawiania); brak danych do klasy |

**Rekomendacja: A teraz. B tylko jeśli 05/08 padną ponownie na zatorze > 5 s w następnych 2 przebiegach (próg: ten sam wzorzec w 3 kolejnych przebiegach, jak w DG2).**

### PU-168 (informacyjny)

| Opcja | Co | Koszt | Kompromis |
|---|---|---|---|
| **A. Poprawa scenariusza (08 fix)** | po otwarciu Centrum zamykać je gestem od **dolnej** krawędzi (`swipe 50%,99% → 50%,40%`) albo `launchApp` bez czyszczenia stanu; dopiero potem „+1” i „2”; dowód czerwony: artefakty 3 przebiegów (identyczny hash zrzutów) | ≈ 1 sesja 08 (< 1 USD) + 1 przebieg iOS | zamyka stały czerwony; scenariusz zostaje klasą B „oczekujący” |
| **B. Zostawić informacyjny** | 0 | 0 | stały czerwony szum w cz. 4 od 23.11; teza PU potwierdzona stanem aplikacji, nie ekranem |

**Rekomendacja: B teraz (nie blokuje, teza PU potwierdzona), A przy najbliższej okazji w partii 08.**

### PU-008 (informacyjny, kandydat na defekt)

| Opcja | Co | Koszt | Kompromis |
|---|---|---|---|
| **A. Diagnoza + test (08 fix, test najpierw czerwony)** | test „zakreśl A, B → cofnij → zakreśl B ponownie → licznik = 2” na warstwie Jest/`modules/oczko-wzor` (czerwony teraz, jeśli hipoteza prawdziwa); potem poprawka liczenia; sprawdzić, czy po restarcie cofnięty pas nie wraca (to jedyna ścieżka do danych) | ≈ 1 sesja 08 (≈ 1–2 USD), bez przebiegu iOS do diagnozy | rozstrzyga „aplikacja czy scenariusz”; **pewność 65%** — jeśli test zielony, wina scenariusza (zmiana współrzędnych swipe'a) |
| **B. Katalog: opisać znane odstępstwo** | zapis w `docs/jakosc/przypadki-uzycia.md` PU-008 | 0 | zostaje stały czerwony, nikt nie wie, czy to defekt |
| **C. Test fizyczny F** (właściciel) | cofnij → zakreśl ponownie na buildzie z TestFlight | czas właściciela | jedyny dowód, że etykieta myli się też na telefonie; PU-008 jest klasy B, nie F; zmiana klasy tylko słowami właściciela |

**Rekomendacja: A.** Realność przy użytkowniku: brzegowa (wymaga cofnięcia i ponownego zakreślenia), skutek S3, ale niewyjaśniony, więc nie wolno uznać za „scenariusz”.

## Komendy i stan

| Komenda | Kod | Wynik |
|---|---|---|
| `git fetch origin koordynacja` + `git show origin/koordynacja:docs/koordynacja/polecenia/DG4.md` | 0 | polecenie @ 3811f17d |
| `git diff --stat 9aa5ee44 a19146b8 -- src/ app/ modules/` | 0 | 5 plików (wyżej), nic we wzorze |
| MCP `actions_get get_workflow_run 46132804091`, `actions_list list_workflow_jobs`, `list_workflow_run_artifacts` (46017014366, 46078408606) | — | job 140948237483 failure, krok „Scenariusze” 10:30:48–11:57:03 |
| MCP `download_workflow_run_artifact` 15262192594, 15215514596, 15240354965 + `curl` + `unzip` | 0 (HTTP 200) | 365 / 297 / 397 MB, po 59 wpisów `e2e-out` |
| `node scripts/ci/e2e-awaria-maszyny.mjs <junit> <katalog>` dla 05, 08, 95, 100 (artefakt DG4) | 1 ×4 | „porażka scenariusza”, nie awaria maszyny |
| `md5sum` zrzutów PU-168 (3 przebiegi) | 0 | pary identyczne w każdym przebiegu |
| `npm ci` | 0 | zależności z `package-lock.json` |
| `npm run verify` | 0 | 751 zestawów, 8 452 testów zielone (`docs/jakosc/dg4-verify.txt`) |
| Brak ponowień i dispatchów z tej sesji | | |

## Nie sprawdzono

| Co | Dlaczego | Krok i kto |
|---|---|---|
| Czy 17,7 s w 05 to zator maszyny czy zator aplikacji | brak profilu wątku głównego; hierarchia wykonana po zatorze; 05 nie miał zielonego odpowiednika z hierarchią (zielone przebiegi nie zapisują hierarchii) | ponowienie joba cz. 4 (opcja A) i odczyt `first N ms` w 05; koordynator |
| Stan PU-008 po restarcie (liczba zakreśleń w zapisie) | scenariusz nigdy nie dochodzi do tych kroków | 08 (opcja A) |
| Natywny kod liczenia zakreśleń | poza zakresem (tylko dokumenty), niecytowany w diagnozie | 08 |
| Zator na telefonie (build 1241) | tylko symulator CI | właściciel, tylko jeśli A da powtórzenie > 1 000 ms |
| Wynik e2e cz. 1–3 i iPad w tym przebiegu | zielone (jobs success), nie analizowane poza statusem | brak kroku |

## Rejestr (nie z tej sesji)

`eksperymenty-wzoru` (job 140941483223, krok W1–W3) znów `failure`, informacyjny (`continue-on-error`), jak w 9aa5ee44 i DG3.
