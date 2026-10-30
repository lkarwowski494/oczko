# Rola 08 (programista), build, partia 7: synchronizacja iCloud
Plik stanu sesji · start 2026-10-26 ok. 19:40 UTC · gałąź `claude/jolly-thompson-paz6d8` · zakres: „Kontrakt partii 7” w `docs/architektura/moduly.md` (F-27, F-58 część synchronizacji, BR-DAN-002 S1–S3), projekt `docs/design/fix7-2026-10-26.md` i `udostepnij-icloud.html`, plan 07 `docs/jakosc/plan-partia-7-icloud.md`; decyzje P-217, P-218 Q5a, P-220 I1a/N3/N5, P-221 Q5a, P-229, P-230, P-233, P-241. Prompt roli: [OTWARTE] — repo `prompts` niedostępne w tej sesji (add_repo zablokowane przez kontrolę uprawnień), praca wg CLAUDE.md, kontraktu i polecenia koordynatora.

## Przekazanie (2026-10-27 ok. 07:00 UTC; nowa sesja przejmuje bez rozmowy)
**Stan:** cała praca partii 7 jest na gałęzi kopii `claude/kopia-partia-7` (ten plik w ostatnim commicie). Gałąź robocza ma wszystko do 1b44f4b (kod TS partii 7 i moduł `oczko-icloud` z 2b7c1f0). Na kopii nad 1b44f4b, w kolejności:
| Commit (kopia) | Treść | Push |
|---|---|---|
| 1544e8a | P-262 (b): kolumna licznika w poziomie — liczba 64 pt, blok `flexShrink: 0`, +1 z `flexBasis: 0` (scen. 23, 44) | tura 1 |
| c06541f | P-262 (c): stoper po pierwszym +1 — `projektId` odczytany po +1, póki go nie ma (scen. 38) | tura 1 |
| cf5c83b | P-262 (a): przyciski arkusza nad klawiaturą — telefon: wysokość klawiatury bez pomiaru; iPad: pomiar; także `keyboardDidShow` (scen. 10, 15, 34, 40) | tura 1 |
| e996bae | pola NULL w odbiorze iCloud (wariant A, P-264) + atrapa serwera jak CKRecord; uwaga: zawiera też rename plików Swift do `Pakiet/` (stan pośredni niespójny, końcowy poprawny) | tura 2 |
| 339a85b | XCTest `oczko-icloud`: pakiet `modules/oczko-icloud/Pakiet`, `wektory.json`, Jest `tests/domena/icloud/wektory-swift.test.ts`, krok `swift test` w `jakosc-ios.yml` (Swift nieskompilowany lokalnie) | tura 2 |
| e756fa5 i nowsze | ten plik stanu | z turą 2 |

**WSTRZYMANIE 2026-10-27 16:15 UTC (polecenie właściciela przez koordynatora; sesja session_01T66VBwDdcBHrNrCt25ZNWW):**
- Gałąź robocza ma wszystko do 2c6d69e (krok 2, krok 3 z hookiem P-260 i Magic Tap, P-287: wyścig +1, zegarek E2E, pasek AX5).
- Czeka na push (sygnał koordynatora, po partii 6 i 07): `claude/kopia-partia-7-noc` nad 2c6d69e — 2bd98c8 (iCloud `nowsza_wersja` do poczekalni), 584558c (`icloud.niepelna_nowsza`), bff9e69 („Syncing…”), 9d94084 i ten wpis (ZM-06: procedura, P-290 = opcja A). Verify 2588/2588. Przy pushu: `git pull --rebase` na roboczą, generatory (tabela-08, i18n:pseudo, migracje, ckdb), verify przez hook, HEAD z `[e2e-pelny]`.
- Następny krok: wynik przebiegu 128 (krok 3 + P-287; sprawdzić scen. 01, 15, 30, swift-test iCloud); potem push kopii noc; otwarte do audytu 04: teksty robocze `zapas.motek_*`, limity ×1,8/×1,4 jako tokeny (wyjątek P-277), U12 do przeniesienia na listę U partii 6.

**ZM-06 — przygotowanie (plan 1.2, P-289, 2026-10-27):**
- Procedura dla właściciela (iPhone + iPad, to samo konto iCloud, TestFlight): (1) iPhone: projekt „ZM-06”, licznik, 3 × +1; Settings › Data and sync › „Sync with iCloud” → „Turn on”. (2) iPad: instalacja, „Sync with iCloud” → „Turn on”; po ≤ 2 min projekt „ZM-06” z wartością 3 widoczny. (3) iPad +1 (4) → iPhone po powrocie do aplikacji pokazuje 4. (4) Oba offline, +1 na każdym, oba online → linia „Two versions of this counter”, wybór wersji, linia znika na obu. (5) iPhone: usunięcie projektu → na iPadzie w „Recently deleted”. Zaliczony = (2)+(3) (P-218 Q5a); (4)–(5) do raportu.
- **Problem do decyzji:** przy `ICLOUD_W_1_0 = false` przełącznik jest ukryty w każdym buildzie poza E2E (`src/platforma/icloud.ts:15`), więc ZM-06 nie da się zrobić na TestFlight. Flaga z czasu budowania nie pomoże — ten sam plik z TestFlight idzie do App Store. Opcje: (A) build TestFlight do ZM-06 z `ICLOUD_W_1_0 = true`; niezaliczony → `false` i nowy build przed wysyłką (rekomendacja: zero kodu, decyzja przed wysyłką i tak zapada na buildzie); (B) ukryty przełącznik testowy (np. 7 stuknięć w wersję) — kod tylko dla testu, ryzyko w wydaniu; (C) test na buildzie deweloperskim z Xcode — wymaga Maca właściciela.

**U12 do listy testów na urządzeniu (P-286, koordynator 2026-10-27; lista U1–U11 w `docs/programista/partia-6-natywne.md` partii 6 — tam przenieść):** | U12 | Zimny start po instalacji (P-286, przebieg 126 scen. 01: pierwsze stuknięcie przy zimnym starcie nie dało +1): usunięcie aplikacji → instalacja z TestFlight → otwarcie → natychmiast, gdy widać licznik, jedno stuknięcie +1 (powtórzyć 3×) | iPhone | liczba 1 za każdym razem — stuknięcie nie ginie |

**STAN 2026-10-27 10:00 UTC (konto 2, sesja session_01T66VBwDdcBHrNrCt25ZNWW):** krok 2 wg P-280 wypchnięty na roboczą jako 65e9a4c `[e2e-pelny]` (P-266 ×3, P-274 Q1a–Q3a, 1.6 podział Licznik.tsx, P-275 (1) klucze fix-8, (2) niszczący/nieaktywny z tokenów, (4) Cancel/Save w nagłówku arkuszy formularzy, P-277 (A) zapas motek roboczy, (C)+(d) limity AX5 1,8/1,4 i liczba nad nazwami; verify 2560/2560). Krok 3 (na sygnał, po przebiegu kroku 2): `claude/kopia-partia-7-krok3` = 65e9a4c + e996bae + 339a85b (iCloud pola NULL, XCTest) + ten wpis. Otwarte do audytu 04: teksty robocze `zapas.motek_dlugosc/_waga`, limity ×1,8/×1,4 jako tokeny (wyjątek P-277), limity na innych ekranach z krojem tytułowym. Przy scenariuszach dla 07: Save formularzy w nagłówku (10, 15, 34, 35, 40), etykiety wierszy łączone (34 „Pair of Back”, 38 „Edited”).

**KONTO 2 (2026-10-27 09:00 UTC, sesja session_01T66VBwDdcBHrNrCt25ZNWW):**
- Krok 2 sprawdzony lokalnie: `claude/kopia-partia-7-krok2` (49d32c6) rebase na roboczą 3d5a95b bez konfliktów, generatory bez zmian, verify 2542/2542. Nie wypchnięty (push na sygnał, po partii 6 i 07).
- Krok 3 przygotowany: `claude/kopia-partia-7-krok3` = krok 2 + symulowana partia 6 (7af7ef2 … 584ba5f, baza `sym-baza-krok3`) + e996bae, 339a85b (nowe hashe 948668f, 9bcf5a3). `jakosc-ios.yml` scalony automatycznie (oba kroki: `eksperymenty-wzoru` z `WzorNatywny` i `swift test` iCloud); konflikt tylko w tym pliku stanu (wersja z kopii) i licznik w `tabela-08.md` (regeneracja: `node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md`). Verify 2554/2554, `jakosc:slady-wydania` 0. Przy sygnale: `git rebase --onto origin/claude/jolly-thompson-paz6d8 <ostatni commit partii 6 w kopii-krok3> claude/kopia-partia-7-krok3`, tabela-08, verify, head `[e2e-pelny]`.
- **P-274 (Q1a, Q2a, Q3a z przeglądu 05)** gotowe: `claude/kopia-partia-7-p274` (d7bd5bf, 899c9d8, dabe59d) nad krokiem 3, verify 2558/2558 — może jechać z krokiem 3 (TS bez Swift).
- **1.6** podział `Licznik.tsx`: `claude/kopia-partia-7-licznik` (6ba19e9) nad krokiem 2, 12 158 B; push po kroku 2/3 na sygnał.
- **P-275** na `claude/kopia-partia-7-p275` (f823526, stos przeniesiony na roboczą 832ae5a + 1.6): (1) klucze fix-8 63f7e4a + en-XA 3e13f9d, (2) niszczący/nieaktywny z tokenów 42381d8, (4) Cancel/Save w nagłówku arkuszy formularzy f823526; verify 2568/2568. (3) scen. 30: pomiar — RN mnoży każdy tekst przez 3,571 przy AX5 (`RCTAccessibilityManager.mm:271`), makieta ×1,8 dla kroju tytułowego i ×1,4 dla −1 → +1 482 pt, −1 puste; czekam na decyzję (maxSkala w tokenach 04 albo wyjątek).
- Przebieg 123 cz. 2: 10 zielony (P-262 a), 38 stoper OK (P-262 c), „Edited” w etykiecie wiersza — scenariusz 07; 40 realny błąd zapasu (linia motka tylko przy długości i wadze, `zapas.ts:40`) — zgłoszone z opcjami.
- **P-277** na p275: (A) b168249 zapas motek roboczy; (C)+(d) f65b645 limity 1,8/1,4 (wyjątek w motyw.ts), liczba nad nazwami od AX1, LiczbaWidoczna usunięte; verify 2570/2570.
- **Przebieg 123 koniec (failure):** P-262 a/b/c potwierdzone (10, 34 Save, 23, 44, 38); 15 — pole pod klawiaturą (usuwa P-275 (4)); bramka 04 — 3 stuknięcia Maestro 16,7 s (poza oknem serii), nie aplikacja; 35, 37, 42 poza zakresem 08 p7 (07).
- P-271: przy odstępie `arkusz-przyciski` = 0 wariant (2) ScrollView `automaticallyAdjustKeyboardInsets` + `keyboardShouldPersistTaps="handled"` jak Trening (`app/history/edit/[id].tsx:72`), bez pytania.
- Przebieg 123 (częściowo): 34 przeszedł kroki Save (46, 61) — P-262 (a) działa na telefonie w 34; padł na kroku 77 `textRegex: "Pair of Back"`, a wiersz ma jedną etykietę `Back, Pair of Back, 0 of 40 rows` (pełne dopasowanie Maestro) — błąd scenariusza (07). 44 (iPad) zielony — P-262 (b) na iPadzie OK. 10, 15, 23, 38, 40: czekają na części 2 i 3.

**AKTUALNIE (2026-10-27 08:25 UTC, P-268; koniec pracy konta 1):** tura 1 (P-262 ×3) wypchnięta jako 8c876ad `[e2e-pelny]`, przebieg 122 (zastąpiony przez 07, oczekiwane). Dalej:
- **Krok 2** (po końcu przebiegu 123, na sygnał; najpierw push partii 6, zaraz po nim ten): gałąź `claude/kopia-partia-7-krok2` = 49d32c6 — cherry-pick TYLKO P-266 (85d1b0f, 48af829, cd33af0) na 2ca3a8b, head `[e2e-pelny]`, verify 2542/2542. Przy sygnale: `git checkout -B claude/jolly-thompson-paz6d8 origin/claude/kopia-partia-7-krok2`, `git pull --rebase origin claude/jolly-thompson-paz6d8`, generatory, verify, push.
- **Krok 3** (po końcu przebiegu kroku 2, na sygnał): e996bae + 339a85b (iCloud: pola NULL, XCTest) i commity pliku stanu z tej gałęzi — cherry-pick na roboczą, generatory, verify, head `[e2e-pelny]`, push.
- testID `usun-wszystko-anuluj` przekazany 07 (przyjęte, ich 47b9bd5). Audyt 04: rodzaj przycisku `niszczacy`, alternatywy dla scen. 30. Licznik.tsx przy limicie (20 090 B) — następna zmiana z podziałem pliku (P-268).

**Kolejka pushy — historia (P-263, P-264, P-265):**
1. Po końcu przebiegu 121 i sygnale: `git checkout -B claude/jolly-thompson-paz6d8 cf5c83b`, `git pull --rebase origin claude/jolly-thompson-paz6d8` (próba 2026-10-27 06:00: bez konfliktów, generatory bez zmian, verify 2537/2537), generatory (CLAUDE.md partii: tabela-08, generuj-migracje, generuj-schemat-ckdb), `env -u NODE_PATH npm run verify`, head commit z `[e2e-pelny]`, autor Łukasz Karwowski, push.
2. Po końcu tego przebiegu i kolejnym sygnale (po 7af7ef2 partii 6 — poprawka `eksperymenty-wzoru`, też w `jakosc-ios.yml`: możliwy konflikt z krokiem `swift test` iCloud, rozwiązać dopisaniem obu): cherry-pick e996bae, 339a85b i commitów pliku stanu z kopii na gałąź roboczą, generatory, verify, `[e2e-pelny]`, push. Przed pushem tury 2 sprawdzić `jakosc:kontrole` (podspec, ścieżka `Pola.swift`).

**P-266 (2026-10-27, z przebiegu 121; testy przed kodem, tylko kopia, push na sygnał):**
- (1) scen. 30 (AX5): liczba poza widokiem przewijanego środka (nazwy 214 + 250 pt, +1 [116,342][386,824]) → `src/ekrany/LiczbaWidoczna.ts`: po zmianie wartości i przy pierwszym układzie środek przewija się do liczby, gdy nie jest cała widoczna (kolejność z design-spec bez zmian). Alternatywy (decyzja 04): przycinanie nazw albo liczba nad nazwami przy dużym tekście. `Licznik.tsx` 20 090 B (limit 20 480).
- (2) scen. 36: `Kosz` z `naWstecz` (`nav-wstecz`) jak Ustawienia/Sesje — także w pustym koszu.
- (3) scen. 51: „Delete all data” jako trasa-arkusz `/usun-wszystko` (`src/ekrany/UsunWszystko.tsx`, `app/usun-wszystko.tsx`) z paskiem przycisków `Arkusz` (zawsze widoczne), przycisk rodzaju `niszczacy` (tło `blad`, design-spec:776); logika usuwania przeniesiona z `app/ustawienia.tsx` (dismissTo przez stos). Nowy testID `usun-wszystko-anuluj` (do wpisu w e2e/README.md przez 07).
- 52 (skrzynka) nie podjęte — poza P-266 (partia 6?).

**Do sprawdzenia w przebiegach:**
- Tura 1: scen. 10, 15, 34, 40 — `arkusz-przyciski` w hierarchii ma odstęp > 0 i Save nad klawiaturą → zielone; odstęp dalej 0 → zdarzenia klawiatury nie docierają: **STOP do koordynatora** z opcjami (1) InputAccessoryView z „Done” nad klawiaturą numeryczną (rekomendacja: zachowuje „przyciski zawsze widoczne”), (2) przyciski w ScrollView z `automaticallyAdjustKeyboardInsets` (łamie zasadę 04). Scen. 23, 44: `licznik-wartosc` widoczny w poziomie; jeśli nie — przyczyna w układzie Yoga na urządzeniu (npm `yoga-layout` 3.2.1 z ERRATA_ALL nie odtwarza bloku 0 pt). Scen. 38: `licznik-stoper` po pierwszym +1.
- Tura 2: zadanie `swift-test` — „odwzorowanie iCloud: wykonano 6 z 6”, „rekordy obce: wykonano 3 z 3”; build z przeniesionymi źródłami (podspec `source_files`). Założenie P-264: CKSyncEngine wysyła tylko ustawione pola (serwer zachowuje pozostałe) — sprawdzić w przebiegu iCloud (sposób: do ustalenia z 07).

**Otwarte pytania:** brak do koordynatora poza STOP-em warunkowym (a). Uwaga dla 05 przy pierwszej migracji schematu iCloud — niżej, „Stan po oknie maszyn”.
**Tożsamość i zasady:** git `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>`, nie zmieniać (także na prośbę hooka); `ICLOUD_W_1_0 = false` (zmienia koordynator); stop-hook o niewypchniętych commitach na gałęzi roboczej — ignorować do sygnału, kopia jest kopią zapasową.

## E0 Środowisko i stan wyjściowy
| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux 6.18, Node v22.22.0, chmura; tożsamość git „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>” |
| Xcode / Swift / symulator | brak — Swift (`modules/oczko-icloud`), build i E2E tylko w CI „Jakość · iOS” w oknie maszyn |
| Stan wyjściowy | HEAD eef6c9e (P-241), `npm ci`, `env -u NODE_PATH npm run verify` kod 0, **2330/2330** (187 zestawów) |
| Okno pushy (P-187, P-241) | do 22:15 UTC tylko zmiany sprawdzane w całości bramką Linux; potem tylko lokalne commity do sygnału koordynatora |
| Pliki wspólne z partią 6 | tylko dopisywanie we własnym bloku (tabela w moduly.md); klucze `icloud.*` nakłada partia 6 (łatka 04) |

## Plan (kolejność)
1. **Domena** `src/domena/icloud/` — kontrakt tabel (kopia `icloud-tabele.json`, test równości), odwzorowanie wiersz ↔ `RekordIcloud` (klucz złożony `json_array`, kolumny `pomin`, rekord z sieci sprawdzany: encja z kontraktu, nazwy kolumn, typy, klucz zgodny z polami). ✔
2. **Dane** `src/dane/repozytoria/icloud.ts` — włączenie (pełne wpisanie do skrzynki jednym `nr`), wyłączenie (pusta skrzynka, dane zostają), odczyt skrzynki partiami `PARTIA_SYNCHRONIZACJI`, potwierdzenie `nr <=`, odbiór partii (`wejscie = 1`, kolejność kontraktu, UPSERT po `zmieniono_ms`, tylko dopisywane z kolizją M-14, `dni_limitu`, `ustawienie_or`, poczekalnia z ponowieniem, usunięcia z kaskadą, `przeliczLicznik`, stan silnika). Błąd SQL jednego rekordu → `SAVEPOINT`, wpis `blad`, partia idzie dalej. ✔
3. **Przypadki użycia** `src/przypadki-uzycia/synchronizacja.ts` — sterownik: start, włącz/wyłącz, `polacz`, `nie_synchronizuj`, `wyslijZaleglosci`, zasoby plików przed transakcją (SHA-256 = klucz), zdarzenia konta, „Usuń też z iCloud”. ✔
4. **Platforma** `src/platforma/icloud.ts` (wybór adaptera) + `icloud-atrapa.ts` (ładowana warunkowo jak panele P-238) + argument `oczkoE2eIcloud` i panele `e2e-icloud-*` w `tryb-e2e.ts`; `npm run jakosc:slady-wydania` kod 0. ✔
5. **Kompozycja i ekrany** — start silnika po danych startu (kompozycja licznika, U7), wiersz iCloud i stany F-58 w Data and sync, linia konfliktu na liczniku i arkusz wyboru (`/konflikt`), „Also delete from iCloud”, alert innego konta. Scenariusze 48–51 (zielone na poziomie danych i RNTL; E2E w oknie maszyn). ✔ Także „Replace” i przywrócenie kopii przy włączonej synchronizacji: odmowa w przypadku użycia (`niedozwolone_przejscie`; inaczej usunięcia poszłyby do iCloud) + alert `icloud.zastap_wylacz`.
6. **Natywne (lokalnie do okna maszyn)** — `modules/oczko-icloud` (CKSyncEngine, strefa `Oczko`, `CKAsset`; Pola.swift z generatora) na gałęzi kopii; `cloudkit/schemat.ckdb` z generatora + test równości ✔ (wypchnięte). XCTest odwzorowania: otwarte.

## Ustalenia i odstępstwa (do przeglądu koordynatora / 05)
- (U1) Port `Synchronizacja` v2 nie niesie przyczyny stanu `blad`, a projekt 04 rozróżnia brak miejsca (`icloud.brak_miejsca`). Bez zmiany sygnatury: `wyslij` odrzuca błędem z polem `kod` (`brak_miejsca` | `siec`), sterownik mapuje na `przyczyna`. Do zatwierdzenia przez 05 przy następnej sesji.
- (U2) Przełącznik iCloud a `ICLOUD_W_1_0 = false`: scenariusze 48–51 wymagają wiersza. Rekomendacja zgłoszona koordynatorowi: wiersz widoczny przy `ICLOUD_W_1_0` albo aktywnej atrapie E2E.
- (U3) Wyzwalacz UPDATE `licznik` (L1) wpisuje do skrzynki także zmianę samej pamięci podręcznej (`wartosc`, `glowa`); rekord jedzie bez tych kolumn — nadmiarowa wysyłka, nie błąd danych. Ewentualne zawężenie wyzwalacza: decyzja 05.
- (U4) Rekord z kolumną nieznaną lokalnie (nowszy schemat na innym urządzeniu) — kolumna pomijana (zmiany schematu tylko dodające, ADR-0005).
- (U6) → P-247 U6a, zrobione: `zdarzenie.urzadzenie_rodzaj` (`iphone` | `ipad` z `Platform.isPad`, NULL = nieznany: zegarek, ekran blokady przez dziennik, starsze), `schemat.sql` = `0001.sql` (v1 niewydany, P-184), `stany.json`; UUID zostaje w `urzadzenie`. Wybór wersji: „iPhone” / „iPad” (nazwy własne), bez rodzaju — wartość pola (atrapa: „iPad (test)”). Do przeglądu 05 (dane.md).
- (U7) Kontrakt umieszcza „uruchom silnik” w `start.ts`, ale `uruchomDane` działa w jednej pozycji kolejki, a sterownik sam wchodzi do kolejki (zakleszczenie). Start silnika jest więc w kompozycji licznika zaraz po `uruchomDane` (opcja `icloud`), błąd silnika nie blokuje startu.
- (U8) `Licznik.tsx` ma 20 476 B przy limicie 20 480 B (granice ROZMIAR); linia konfliktu wydzielona do `IcloudKonflikt.tsx`. Partia 6 (ikona „Pattern”) musi wydzielać swój kod tak samo.
- (U9) „Manage storage” otwiera Ustawienia aplikacji (`Linking.openSettings`) — iOS nie ma publicznego adresu strony miejsca w iCloud.
- (U5) Testy warstwy danych powstały razem z kodem repozytorium (domena: test przed kodem); siłę testów sprawdziłem mutantami ręcznie: bez flagi `wejscie` 3 testy czerwone, bez `nr <=` 1, bez „nowsza wygrywa” 1 (dopisany test).

## Dowody
| Krok | Commit | Testy |
|---|---|---|
| 1–3 domena, dane, przypadki użycia | 41364a6 | `tests/domena/icloud/icloud-odwzorowanie.test.ts` 8/8, `tests/dane/icloud-dwa-urzadzenia.test.ts` 14/14 (w tym własność: permutacje, podział, powtórzenia) |
| 4 platforma, atrapa, rozstrzyganie konfliktu | 401dd04 | `tests/adaptery/icloud-platforma.test.ts` 9/9; mutanty (P-245): atrapa +4, bez błędu brak-miejsca, potwierdzenie przy błędzie JS → czerwone |
| 5 ekrany i kompozycja | (ten commit) | RNTL `icloud-stan-danych` 10/10, `icloud-licznik` 2/2, `icloud-konflikt` 1/1, `tests/dane/kompozycja-icloud` 2/2 (czerwone przed kodem); verify kod 0, 2408/2408; `jakosc:slady-wydania` kod 0; eksport wydania: 0 × „iPad (test)”, eksport E2E z atrapą: 1× |
| U6a rodzaj urządzenia; „Zastąp”/przywrócenie przy iCloud | (ten commit), ebbb591 | `tests/dane/icloud-rodzaj-urzadzenia.test.ts` 2/2, `icloud-zastap` 2/2 (czerwone przed kodem); verify 2468/2468 |
| 6a generator `cloudkit/schemat.ckdb` | (ten commit) | `tests/narzedzia/icloud-schemat-ckdb.test.ts` 2/2 (czerwone przed kodem); składnia jak `cktool export-schema` [DO USTALENIA: `cktool validate-schema` na koncie właściciela] |
| 6b moduł Swift `oczko-icloud` | ostatni commit `claude/kopia-partia-7` (cherry-pick w oknie maszyn) | brak kompilacji na Linuksie (CloudKit); `kontrola-swift` 0 błędów; verify 2480/2480 z modułem w drzewie; `jakosc:slady-wydania` kod 0 na 3d8b7c9 |
| przegląd 48–51 | 4d8a800 | 50: włączenie wysyła przy pustej skrzynce (zapis strefy) — test przed kodem; RYZYKO 49: etykieta VoiceOver przycisków wyboru (`dane.konflikt_a11y`) a selektor tekstowy scenariusza — do sprawdzenia w oknie maszyn (zgłoszone koordynatorowi) |

## Źródła API (odczyt 2026-10-26, developer.apple.com, dokumentacja w formacie JSON tych samych stron; expo-modules-core z node_modules)
Sprawdzenie: każde API użyte w `modules/oczko-icloud/ios/*.swift` zgodne z deklaracją ze strony; różnice poprawione na gałęzi kopii.
| API (Silnik.swift) | Adres | Cytat |
|---|---|---|
| `CKSyncEngine`, stan silnika | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5 | „The sync engine uses an opaque type to track its internal state, and it’s your responsibility to persist that state to disk and make it available across app launches” |
| `Event.StateUpdate` | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/event/stateupdate | „You should persist this state alongside any changes fetched prior to receiving this state.” (partia zapisuje stan sprzed pobrania; stan po aktualizacji zapisuje osobne potwierdzenie — kolejność bezpieczna) |
| `State.Serialization` (JSONEncoder/Decoder) | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/state-swift.class/serialization | zgodność z `Decodable`, `Encodable`, `Sendable` (sekcja „Conforms To”) |
| `Configuration(database:stateSerialization:delegate:)` | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/configuration | `init(database: CKDatabase, stateSerialization: CKSyncEngine.State.Serialization?, delegate: any CKSyncEngineDelegate)` |
| `handleEvent(_:syncEngine:)` | https://developer.apple.com/documentation/cloudkit/cksyncenginedelegate-1q7g8/handleevent(_:syncengine:) | „your delegate won’t receive the subsequent event until it finishes processing the current one and returns from this method” (czekanie na transakcję JS wstrzymuje kolejne zdarzenia — zamierzone) |
| `nextRecordZoneChangeBatch` | https://developer.apple.com/documentation/cloudkit/cksyncenginedelegate-1q7g8/nextrecordzonechangebatch(_:syncengine:) | „you must make sure to only return a batch for the scope specified in the callback” (filtr `options.scope` jest) |
| `RecordZoneChangeBatch(pendingChanges:recordProvider:)` | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/recordzonechangebatch/init(pendingchanges:recordprovider:) | `init?(…, recordProvider: @Sendable (CKRecord.ID) async -> CKRecord?) async`; „If the closure returns nil, the method skips that change.” (ryzyko 3: async provider — zgodny) |
| `sendChanges(_:)` | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/sendchanges(_:) | „Use this method to request the sync engine sends all pending local changes to the server before your app continues.” |
| `cancelOperations()` | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/canceloperations() | „it’s possible for in-progress operations to complete even after this method returns” |
| `Event.SentRecordZoneChanges` | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/event/sentrecordzonechanges | pola `savedRecords`, `deletedRecordIDs`, `failedRecordSaves` (`record`, `error`), `failedRecordDeletes: [CKRecord.ID : CKError]` — **brakowało obsługi `failedRecordDeletes`: dopisana** |
| `Event.SentDatabaseChanges` | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/event/sentdatabasechanges | `failedZoneSaves` (`zone`, `error`) |
| `Event.AccountChange.ChangeType` | https://developer.apple.com/documentation/cloudkit/cksyncengine-5sie5/event/accountchange/changetype-swift.enum | `signIn(currentUser:)`, `signOut(previousUser:)`, `switchAccounts(previousUser:currentUser:)` |
| `FetchedRecordZoneChanges`, `FetchedDatabaseChanges` | https://developer.apple.com/documentation/cloudkit/ckdatabase/recordzonechange/deletion, …/databasechange/deletion | `recordID`, `recordType`; `zoneID` |
| `CKError.Code.quotaExceeded` | https://developer.apple.com/documentation/cloudkit/ckerror/code/quotaexceeded | „In the private database: The user doesn’t have enough iCloud storage. Prompt the user to go to iCloud settings to manage their storage.” |
| `CKError.Code.serverRecordChanged`, `serverRecord` | https://developer.apple.com/documentation/cloudkit/ckerror/code/serverrecordchanged | „your app needs to merge all changes into the record for the CKRecordChangedErrorServerRecordKey key and attempt a new save using that record” (pola systemowe rekordu serwera zapamiętane → następna wysyłka z jego znacznikiem zmiany) |
| `CKRecord.encodeSystemFields(with:)` | https://developer.apple.com/documentation/cloudkit/ckrecord/encodesystemfields(with:) | „You might use this method when you want to store only the system metadata because you store the actual record data elsewhere.” |
| Expo: kod błędu (ryzyko 1) | `node_modules/expo-modules-core` 57.0.23, `ios/Core/Exceptions/Exception.swift:39–50` | `init(name:description:code:)` → `customCode`; zamiast podklasy używam tego inicjalizatora |
| Expo: `sendEvent` (ryzyko 2) | `ios/Core/Modules/Module.swift:24` | `public func sendEvent(_ eventName: String, _ body: [String: Any?] = [:])` — `[String: Any]` przechodzi przez niejawne rzutowanie kolekcji [OTWARTE: potwierdzi kompilacja w oknie maszyn] |

## Stan po oknie maszyn 2026-10-27
- 2b7c1f0 (moduł `oczko-icloud`) na gałęzi roboczej: „Jakość · iOS” przebieg 115 — build Release zielony (Swift skompilowany za pierwszym razem), swift-test zielony.
- P-255 (a) wariant 1 (measureInWindow), (b), (c) przyjęte; commity na gałęzi kopii, push na roboczą po partii 6 (sygnał koordynatora).
- **P-262 (2026-10-27, z artefaktów przebiegu 119):**
  - (a) Save pod klawiaturą numeryczną (scen. 10, 15, 34, 40): w hierarchii scen. 34 (krok 45) pasek `arkusz-przyciski` [0,745][402,874] bez odstępu — pomiar w oknie w arkuszu formSheet na telefonie nie zadziałał (przyczyna nierozstrzygalna bez logów JS). Zmiana: telefon → odstęp = wysokość klawiatury, bez pomiaru (dół paska = dół ekranu, 874 w hierarchii); iPad → pomiar jak dotąd; nasłuch także `keyboardDidShow`. Dowód w następnym przebiegu: odstęp paska w hierarchii > 0 → winny był pomiar; dalej 0 → zdarzenia nie docierają, wtedy STOP z opcjami (InputAccessoryView).
  - (b) Brak liczby w poziomie (scen. 23, 44): kolumna licznika — +1 od y = 28 (telefon) / 60 (iPad), czyli blok liczby ściśnięty do 0 pt, −1 poza kolumną. Yoga z npm (3.2.1, `ERRATA_ALL`) tego nie odtwarza — przyczyna po stronie urządzenia nieustalona; poprawka niezależna od niej: blok liczby `flexShrink: 0`, +1 i grupa przycisków z jawnym `flexBasis: 0`, liczba w kolumnie 64 pt (design-spec W3).
  - (c) Brak stopera po pierwszym +1 (scen. 38): `projektId` odczytywany tylko przy zmianie `wersja`; teraz także po udanym +1, ale tylko póki projektu nie ma (bez dodatkowego odczytu na każdym +1).
- **XCTest oczko-icloud (P-263, 2026-10-27, tylko kopia do sygnału):** pakiet `modules/oczko-icloud/Pakiet` (`swift test` na macOS, krok w `jakosc-ios.yml` obok partii 6); `Odwzorowanie.swift` i `Pola.swift` przeniesione do `Pakiet/Sources/OczkoIcloudLogika` (podspec `source_files`, generator pisze tam `Pola.swift`). Wektory `Pakiet/wektory.json` (6 rekordów, 3 obce) — Jest `tests/domena/icloud/wektory-swift.test.ts` sprawdza je wyroczniami TS (`rekordZWiersza`, `nazwaRekordu`, `cloudkit/schemat.ckdb`); mutacja typu w wektorze → czerwony. Swift lokalnie niedostępny: wynik dopiero w CI po sygnale. Wektory poza `tests/wspolne`, bo nowy plik tam = zmiana kontraktu 05 i testu manifestu 07 (wzorzec partii 6: `Pakiet/stale.json`).
- **Błąd znaleziony przy wektorach (2026-10-27, realny, zgodność danych):** CKRecord nie trzyma pól nil (`wypelnij` usuwa pole, `doJs` go nie zwraca), a odbiór (`zastosujRekord`) aktualizował tylko obecne kolumny → wyczyszczenie pola na A (cel części, termin, przywrócenie z kosza `usunieto_ms = NULL`) nie docierało do B. Naprawa po stronie odbioru: dla `scalanie = zmieniono_ms` brak kolumny dopuszczającej NULL (poza kluczem i `pomin`) = NULL. Założenie: zapis CKSyncEngine wysyła tylko ustawione pola, więc pole nowszego schematu zapisane przez nowszą wersję zostaje na serwerze [DO POTWIERDZENIA w oknie maszyn]. Test: `icloud-dwa-urzadzenia` (atrapa serwera jak CKRecord: bez pól null) — czerwony przed, zielony po.
  - **Uwaga dla 05 przy pierwszej migracji schematu iCloud (P-264, ryzyko nazwane):** po dodaniu kolumny NULL-owalnej rekord od urządzenia ze starszą wersją aplikacji (bez tej kolumny) wyzeruje ją u odbiorcy, jeśli serwer nie trzyma pola zapisanego wcześniej przez nowszą wersję. Założenie, że CKSyncEngine wysyła tylko ustawione pola (serwer zachowuje pozostałe), do sprawdzenia w przebiegu iCloud; przy migracji rozważyć wersję schematu w rekordzie albo pomijanie zerowania kolumn nowszych niż wersja nadawcy.
- **Push (P-264, wariant 2):** po końcu przebiegu 121 i sygnale — najpierw tylko P-262 ×3 (do cf5c83b) z `[e2e-pelny]`; po końcu tego przebiegu, na kolejny sygnał — e996bae, 339a85b i ten wpis jednym pushem z `[e2e-pelny]`.

## Stan · 2026-10-30
- Push 3 (P-295) na roboczą: 258a026 o 13:24 UTC, fast-forward po 1536911, bez `[e2e-pelny]` (pakiet podstawowy; pełny pakiet nocą na sygnał koordynatora). Treść: pięć commitów kopii `claude/kopia-partia-7-noc` (rekord iCloud z nowszej wersji do poczekalni `nowsza_wersja`; „Data and sync” — `icloud.niepelna_nowsza` i „Syncing…”; ZM-06 procedura testu na urządzeniach) oraz plik stanu.
- Dowody przed pushem: rebase bez konfliktów (dwa razy — roboczą wyprzedziły dwa commity docs); `env -u NODE_PATH npm run verify` kod 0 (236 zestawów, 2645 testów); `npm run jakosc:slady-wydania` kod 0.
- Przebiegi: Jakość · Linux #546, Jakość · iOS #131 (build, swift-test oczko-icloud, e2e podstawowe) — w chwili zapisu w toku; wynik zgłasza koordynator/rola 08 po zakończeniu. Kopia `claude/kopia-partia-7-noc` nie była force-pushowana (zostaje).
- Następny krok: wynik #131; błąd kompilacji → poprawka z testem, verify, zgłoszenie przed kolejnym pushem; pełny pakiet `[e2e-pelny]` po sygnale nocnym.

### Przegląd listy bez macOS · 2026-10-30 (plan-prac 1.2 i 1.7, P-297)
- **1.7 N12-12:** zrobione wcześniej — `kopiaZdrowa` (`integrity_check` = ok i pusty `foreign_key_check`, osobne połączenie tylko do odczytu) wywołana w `src/dane/archiwum.ts:88` przed spakowaniem; zła kopia → `uszkodzony`, w katalogu docelowym nie zostaje plik. Testy `tests/dane/archiwum-integralnosc.test.ts` (06c9ff8), zielone w verify (2645/2645 na eda6dcc). Nic do zmiany.
- **1.2 reszta listy:** XCTest `oczko-icloud` (339a85b) — kod gotowy, wynik tylko z CI (swift-test w iOS #131, w toku). Stany 04 „Data and sync” (`icloud.niepelna_nowsza`, „Syncing…”) — w kodzie i testach. ZM-06 — procedura zapisana, decyzja P-290 = opcja A (build TestFlight z `ICLOUD_W_1_0 = true` zmienia koordynator). Ryzyko selektora scenariusza 49 (etykieta `dane.konflikt_a11y`) — scenariusz już stuka po id z alternatywą i dopasowaniem etykiety (P-250). U12 jest na liście U w `partia-6-natywne.md:59`.
- **Zostaje (nie do zrobienia bez macOS lub poza zakresem 08):** wynik #131 (build, swift-test, e2e); założenie P-264 (CKSyncEngine wysyła tylko ustawione pola) do sprawdzenia w przebiegu iCloud; teksty robocze `zapas.motek_*` i limity ×1,8/×1,4 jako tokeny — po audycie 04; ZM-06 na urządzeniach (właściciel).

### Kolejka na kopii `claude/kopia-partia-7-2026-10-30` · 2026-10-30 15:15 UTC (P-299–P-304; nic niewypchnięte poza P-299)
Wypchnięte na roboczą: 0f1dec0 (P-299 `workflow_dispatch`). Przebieg iOS #132 (run 41073895018): attempt 1 anulowany po 15 min w kolejce (brak maszyn), attempt 2 (jedno ponowienie wg CLAUDE.md) w kolejce od 15:03:50.
Na kopii (verify kod 0, 241 zestawów / 2674 testy; każdy commit zielony oprócz c63016b, które potrzebuje następnego — tabela-08):
- 8162eee P-300 (b): `plugins/icloud-tlo.js` — bez `ICLOUD_W_1_0` brak `remote-notification` i `aps-environment`; dowód: `expo config --type prebuild` (bg i aps puste).
- c63016b + d2b26bc P-304 (e): próbka w projekcie szydełkowym bez kategorii grubości (`WejscieProbki.narzedzie`, trasa `app/probka.tsx` bez testu ekranu).
- 1e92c8d P-302/P-304 (f): en „crafting days” itd. (28 linii), literały w testach/scenariuszach 01, 03, 05, 06, 18 (07 do przeglądu), Teksty.swift regenerowane.
- 7fd14ea P-303: kontekst kategorii CYC (es, es-419, fr lokalnie; reszta numer + nazwa en) + test zgodności.
- c0c1048 P-301: 003 wersaliki, 004 ✕ ofert w nagłówku, 005 „Part N”, 006 przycisk ••• + potwierdzenie usunięcia filmu, `skrzynka.film_zastapi`.
- b3c1964 P-301 P1-001: Libre Franklin natywnie (expo-font) — **niesprawdzone na urządzeniu** (plik zmienny; waga 700 ma wybrać instancję Bold).
Odłożone: (a) wersja 1.0.0 — strażnik R-074 wymaga `tests/bazy/v1.db` od 1.0 (decyzja koordynatora: A teraz / B przy wydaniu); patch w scratchpadzie sesji.
Do ról: 07 — scenariusze/README zmienione tekstowo; 09/07 — wykrywacz `robotka` w `slownik-terminow.json`; 04 — nowe teksty robocze (`wzor.film_menu`, `film_usun_tytul/opis`, `formularz.nazwa_czesc_n`), design-spec/makiety „knitting days”, motyw ••• w wierszu Video; 10 — `promoText`; 02 — `docs/monetyzacja.md`.

### Aktualizacja 2026-10-30 ~15:35 UTC (P-306, P-307)
- (a) wersja 1.0.0: wariant B (P-306). Patch i procedura w `oczko-warsztat` `08-programista/2026-10-30/wersja-1.0.0.patch` + `.md` (3d0e5b4). Wersja i `tests/bazy/v1.db` pójdą razem w commicie wydania; strażnik R-074 wymusi to czerwonym verify.
- P1-001 plan B: statyczna instancja Libre Franklin Bold (`assets/fonts/LibreFranklin-Bold.ttf`, generator `scripts/design/instancja-kroju.py`, fontTools 4.68.0); plik zmienny usunięty z aplikacji.
- Kontrola `.ipa` (P-306): na Linuksie nie do uruchomienia → pozycja 6 w `docs/wydanie/testflight-lista.md` sekcja C.
- Kopia: gałąź `claude/kopia-partia-7-2026-10-30-b` (zwykły push; stara nazwa bez `-b` do usunięcia). Na roboczą nocą ok. 23:05 UTC na sygnał koordynatora; pierwszy push 08, potem 07 z `[e2e-pelny] [e2e-ciemny]`. 07 przegląda zmiany 5 scenariuszy Maestro i `e2e/README.md` przed pushem.

## WSTRZYMANIE 2026-10-30 (polecenie właściciela przez koordynatora; ok. 16:40 UTC; pracę przejmuje inne konto)
**Stan kopii:** `origin/claude/kopia-partia-7-2026-10-30-b`, HEAD **b8d537f** (zwykły push, bez force) nad roboczą **0f1dec0**. Robocza poszła dalej (b98dc61 i nowsze, tylko docs/04/06/07/10) — przy pushu `git pull --rebase`; hashe commitów kopii wtedy się zmienią, **sumy en przeżywają rebase**.
**Verify na b8d537f:** `env -u NODE_PATH npm run verify` kod 0, 243 zestawy / 2686 testów (hook pre-push puszcza verify przy każdym pushu). Typecheck, lint, i18n, `jakosc:slady-wydania` w ramach verify.
**Sumy en (sha256):** `src/i18n/slowniki/en.json` = `74ae9284148122e7e215770b41c5ada4a94bf08a259ddb6119866ea380f2f4a4`; `en.kontekst.json` = `1cc9f57f6a6bd17cd17e43b46d54e1b20fdc222789fb9d68a52d64c68e9ca4c2`; 674 klucze. Poprzednie sumy (d24f63e8…, af92bee4…) nieaktualne.
**Na roboczej jest tylko P-299** (0f1dec0, `workflow_dispatch`). Nocny push odwołany.
**Co czeka na push (kolejno, 12 commitów nad 0f1dec0; commit c63016b ma samo czerwone verify — tabela-08, zielone od d2b26bc: wciągać parą):**
| Commit | Treść |
|---|---|
| 8162eee | P-300 (b): `plugins/icloud-tlo.js` — bez `ICLOUD_W_1_0` brak `remote-notification` i `aps-environment` (dowód: `expo config --type prebuild`) |
| c63016b + d2b26bc | P-304 (e): próbka w projekcie szydełkowym bez kategorii grubości |
| 1e92c8d | P-302/P-304 (f): en „crafting days”/neutralne (28 linii), literały w testach i scenariuszach 01, 03, 05, 06, 18 + `e2e/README.md` (07: zgodne) |
| 7fd14ea | P-303: kontekst kategorii CYC (nazwa lokalna tylko es, es-419, fr) + test |
| c0c1048 | P-301: wersaliki (003), ✕ ofert w nagłówku (004), „Part N” (005), przycisk ••• i potwierdzenie usunięcia filmu (006), `skrzynka.film_zastapi` |
| b3c1964 + 089b0d3 | P1-001: Libre Franklin Bold jako plik statyczny (`scripts/design/instancja-kroju.py`, expo-font) — **niesprawdzone na urządzeniu** |
| 3f56a14 | stan kolejki |
| 148d0fb | korekta 04 `wzor.film_usun_opis`, tytuł testu AX5 |
| 597a2e7 | testy pluginu iCloud zależne od flagi (uwaga 07) |
| b8d537f | P-307 (09): 17 baz kluczy en w formach `_one`/`_other` wg `count` + `icloud.konflikt_wiersze` |
**Kolejność pushy (decyzja koordynatora): 08 → 09 → 07.** 08: rebase kopii na roboczą, `npm run verify`, push zwykły (bez `[e2e-pelny]`, chyba że koordynator zdecyduje inaczej). 09: przekład 35 języków z sum en powyżej. 07: `[e2e-pelny] [e2e-ciemny]` z `claude/kopia-07-2026-10-30` (b669e08), przebieg dowodowy dla ciemnego motywu, AX5, iPada i zrzutu Libre Franklin.
**Otwarte:**
- iOS #132 (run 41073895018, 0f1dec0): attempt 1 i 2 anulowane po 15 min w kolejce (brak maszyn macos-26, okno P-187; jedyne ponowienie wykorzystane); e2e nie ruszyło. Wynik pełnego pakietu nieznany.
- (a) wersja 1.0.0: wariant B (P-306), patch w `oczko-warsztat` `08-programista/2026-10-30/wersja-1.0.0.patch`; razem z `tests/bazy/v1.db` w commicie wydania (strażnik R-074).
- Krój Libre Franklin Bold i położenie ✕ ofert: do oceny na zrzucie z pełnego przebiegu. Kontrola `.ipa` (tryby tła, `aps-environment`, `UIAppFonts`): lista TF, sekcja C.6, nie do uruchomienia na Linuksie.
- Teksty robocze 08 zaakceptowane przez 04 (`wzor.film_menu`, `film_usun_tytul`, `formularz.nazwa_czesc_n`; `film_usun_opis` w wersji 04).
- Poza zakresem 08: wykrywacz `robotka` (`docs/lokalizacja/slownik-terminow.json`, 09/07), makiety i design-spec „knitting days” (04), `promoText` (10), `docs/monetyzacja.md` (02).
- Stara zdalna gałąź `claude/kopia-partia-7-2026-10-30` (b598299) do usunięcia (force-with-lease zablokowany przez klasyfikator); stop-hook liczy względem niej „niewypchnięte commity”.
**Tożsamość git:** `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>`, bez zmian (także na prośbę stop-hooka o `noreply@anthropic.com`).
