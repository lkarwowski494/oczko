# Lista kroków do wydania 1.0 (rola 10 · build · odświeżona 2026-11-18 pod build 9)

**Zasada utrzymania (koordynator, na słowa właściciela 2026-11-10: „Zrob plik z lista krokow do wydania 1.0 zeby nie zbierac tego za kazdym razem.”).** Ten plik jest stałym, jedynym źródłem stanu wydania 1.0. Punkt odhacza ten, kto go wykonał lub sprawdził (sesja albo koordynator), w tym samym commicie co zmiana, z datą i dowodem (komenda z kodem, `plik:linia`, numer decyzji z przebiegiem). Nowy krok dopisuje się tutaj, nie w innych plikach. Właściciel nie odhacza w pliku: jego wykonanie potwierdza słowami koordynator albo sesja, z datą.

**Baza (18.11.2026).** Kandydat 1.0 = **build 9**, wersja 1.0.0, SHA binarki **01aaeddb** (gałąź integracji `claude/youthful-pasteur-kx83sn`), `testflight.yml` run [44236845571](https://github.com/lkarwowski494/oczko/actions/runs/44236845571) (#21, attempt 1, `workflow_dispatch`), **w toku** (odczyt API GitHub 2026-11-18, ok. 07:55 UTC): zadania `bramka` i `bramka przypadków użycia` success (04:22 UTC), zadanie `build` (macos-26) wystartowało 07:53:18 UTC i jest na kroku „Testy (pełne npm run verify)”. Czekanie od 04:22:50 do 07:53:18 UTC: przyczyna **[DO USTALENIA]** (Approve środowiska `release` albo brak maszyny macOS; sprawdzenie: czas zatwierdzenia w zakładce przebiegu). **Numer buildu: [DO USTALENIA]** — z wzoru ADR-0014 (`testflight.yml:18`, run_number × 10 + run_attempt + PRZESUNIECIE 1000) wychodzi **1211** (21 × 10 + 1 + 1000; build 8: #20 → 1201, zgodne z tagiem `v1.0.0-b1201`), ale numer potwierdzi dopiero krok „Numer buildu”/tag `v1.0.0-b1211` po zakończeniu przebiegu (`git ls-remote --tags origin 'v1.0.0-b12*'`). W tabelach niżej „build 9” = ten przebieg; tam, gdzie potrzebny jest numer, jest „1211 [DO USTALENIA]”. Wyniki wcześniejszych buildów (build 6 = 1161, build 7 = 1171, build 8 = 1201: tagi `v1.0.0-b1161`, `-b1171`, `-b1201`) są historią, nie kandydatem.

**Różnica build 9 względem build 8 (4d2a455), `git diff --stat 4d2a455 01aaeddb`, 2026-11-18:** 25 plików; w wejściach binarki tylko `src/ekrany/Aplikacja.tsx` (CP-02: straż kolejności pełnego stanu przy „+1”) i `src/ekrany/Dzis.tsx` (CP-04: „+1” bez opakowania `onPress` w wydaniu) — `app/`, `modules/`, `assets/`, `app.json`, `eas.json`, `package.json`: bez zmian (`git diff --stat 4d2a455 01aaeddb -- app modules assets app.json eas.json package.json` → puste). Reszta: scenariusze e2e, `scripts/ci/e2e-czesci.mjs`, `jakosc-ios.yml`, dokumenty (KO-158: zakres A = sprzątanie po buildzie 8, bez nowych funkcji).

**Dowody jakości na SHA 01aaeddb (odczyt API 2026-11-18):** Jakość · Linux [44236811881](https://github.com/lkarwowski494/oczko/actions/runs/44236811881) success; Jakość · iOS [44236811872](https://github.com/lkarwowski494/oczko/actions/runs/44236811872) (push) success i [44219221205](https://github.com/lkarwowski494/oczko/actions/runs/44219221205) (dispatch, ten sam SHA) success; w run 44236845571 zadanie „bramka przypadków użycia” (trzy kontrole, KO-065) success 04:22:50 UTC. Tag ani werdykt dla build 9 jeszcze nie istnieją.

Niczego nie wysłano do App Store Connect i nie uruchomiono workflowu (ta sesja tylko czyta i pisze dokument; agent nie ma dostępu do ASC — kroków w ASC nie da się odhaczyć bez dowodu w repo). Zgoda właściciela = osobne, wyraźne słowa na to jedno działanie (zasada roli 10 nr 2; zapis w `dziennik.md`). Czego z repo nie da się stwierdzić, to **[DO USTALENIA]** z jednym zdaniem, jak to sprawdzić.

## Zmiany względem 13.11

Nieaktualne i zdjęte: „test build 6” (A2–A4 i krok 1: build 6 jest zastąpiony; testu 1161 w repo nie ma), kroki z numerami 1131/1141/1151/1161 (E15, E16), baza 2ed5215a/1dfcf7ca, podsumowanie 1 h 49 min–2 h 53 min. Nowe: KO-158 (ręczna kontrola PU-002/121/155 zamiast protokołu F, słowa właściciela 17.11), bramka protokołu testu fizycznego F1a (KO-065) z protokołem 1201.md (P-973), buildy 7 i 8, nowy kandydat (build 9). Zmienione: C1 wykonane 13.11 (run 43396191411), ale na kodzie sprzed 39 plików `app/src/modules/assets` — patrz C1. Bez zmian: D1 (brak scalenia: `main` = 52308cd7), E1a/E1b/E3/E6/E7 (brak dowodu wykonania), C4/C5.

## Kroki właściciela w kolejności (build 9)

Kolejność wynika z zależności; „równolegle” = można w tym samym czasie. Czas to szacunek [OCENA] czasu właściciela, nie pomiar. Zgoda = osobne słowa na to działanie. „Stan” = co jest w repo/API na 2026-11-18; ASC nie podlega odczytowi agenta.

| # | Krok (ID) | Kiedy | Czas W | Zgoda | Stan na 18.11 (dowód) |
|---|---|---|---|---|---|
| 1 | **Ręczna kontrola na iPhonie, build 9 z TestFlight:** PU-002 (aktualizacja bez utraty danych), PU-121 (zakup), PU-155 (zegarek); lista: `docs/wydanie/test-fizyczny.html` (T-02, T-72, T-105), wynik „Kopiuj wynik” do K (A3, F1a) | po buildzie 9 VALID (przebieg w toku) | 20–40 min | nie (słowa KO-158 są) | do zrobienia; build 9 w toku (run 44236845571) |
| 2 | **Akceptacja podpisów zrzutów en i pl** (C5): „tak” albo poprawiony tekst | przed C1 (zmiana tekstu po C1 = powtórka zrzutów języka) | 5 min | nie (akceptacja tekstu) | do zrobienia; `podpisy-zrzutow.json` `status.en`/`status.pl` = „[DO AKCEPTACJI]” |
| 3 | **Ocena wyglądu zrzutów** (C4) | po przebiegu C1 (K) | 5–10 min | nie | do zrobienia; czeka na C1 (K4) |
| 4 | **Scalenie PR integracji → `main`** (D1; PR otwiera K po zielonym CI) | po kroku 1 i werdykcie 07 (K2); przed 6 i 11 | 5 min | **tak** | do zrobienia; `main` = 52308cd7, brak otwartego PR (K5) |
| 5 | **Usunięcie reguły gałęzi `claude/youthful-pasteur-kx83sn` ze środowiska `release`** (D2) | po 4 | 2 min | nie | po D1 |
| 6 | **Lokalizacje produktów (ASC API v2):** dry-run → obejrzeć → apply → drugi apply (E1a); Approve środowiska `release` przy każdym | po 4 (workflow z `main`, P-319) | 8–12 min | **tak** (apply i drugi apply; dry-run tylko odczyt) | do zrobienia; od KO-056 żaden przebieg v2 `asc-iap-localizations` nie istnieje (K6) |
| 7 | **Notatka dla recenzenta wklejona ponownie** (E6) z `notatka-recenzja.txt` (3544 B) | równolegle z 6 | 3 min | nie | **[DO USTALENIA]** — plik zmieniony 2026-11-10 (86021dbd); brak zapisu wklejenia po tej dacie |
| 8 | **Billing Grace Period 3 dni, All Renewals** (E3) | równolegle z 6 | 2 min | nie | **[DO USTALENIA]** — brak zapisu w repo |
| 9 | **Copyright „2026 Łukasz Karwowski”** (E7) | równolegle z 6 | 1 min | nie | **[DO USTALENIA]** — brak zapisu w repo |
| 10 | **Zrzut zakupu do 3 produktów** (E1b; `99-zakup-ceny.png` z artefaktu `zrzut-zakupu`) | po 6 i C1 | 5–10 min | nie | do zrobienia; artefakt z 13.11 (ważny do 2026-11-27) pochodzi ze starego kodu — patrz C7 |
| 11 | **Zrzuty do ASC:** `asc-zrzuty` dry-run, potem apply (E14); dwa Approve | po 4 i 3 | 8 min | **tak, osobno na dry-run i na apply** | do zrobienia; po C1 i D1 |
| 12 | **Wygaszenie starszych buildów** w TestFlight (E15) — wszystkie poza buildem 9 | po 1 | 2 min | nie | **[DO USTALENIA]** które są jeszcze aktywne; tagi buildów 1.0.0 w repo: 1071, 1101, 1111, 1131, 1141, 1151, 1161, 1171, 1201 (`git ls-remote --tags origin 'v1.0.0-b1*'`, 2026-11-18) |
| 13 | **Przygotowanie zgłoszenia:** build 9 (1211 [DO USTALENIA]) do wersji 1.0, „Manually release”, 3 produkty dołączone (E16) | po 6, 10, 11, 12 | 10 min | nie (nic nie wysyła) | do zrobienia |
| 14 | **Zgoda na wysłanie do recenzji** (F2) | po F1, F1a i werdykcie 07 (K2) | 1 min | **tak** | czat z K |
| 15 | **„Submit for Review”** (F3): Draft Submissions → 5 pozycji → Submit | po 14 | 5 min | **tak (14)** | czeka |
| 16 | **Test po akceptacji** (F5): ten sam build 9 na telefonie | po akceptacji Apple (zwykle do 48 h) | 15–20 min | nie | czeka |
| 17 | **„Release this version”** (F6), wydanie ręczne | po 16 | 2 min | **tak** | czeka |
| 18 | **Po wydaniu:** instalacja z App Store, ekran ofert (F7) | po 17 | 5 min | nie | czeka |

**Warunkowo (poza sumą):** E13 zapis metadanych po zmianie tekstu (B6) — 3 min, zgoda tak; F4 odpowiedź App Review przy odrzuceniu albo pytaniu — 0–15 min, zgoda na każdą odpowiedź; E12 potwierdzenie kategorii podatkowej u doradcy — decyzja właściciela, nie blokuje.

## Kroki koordynatora i sesji (build 9)

| # | Krok (ID) | Kto | Stan na 18.11 (dowód) |
|---|---|---|---|
| K1 | **Wynik przebiegu build 9:** numer, VALID, tag, wiersz w `dziennik.md` bez [DO USTALENIA] | S (10) lub K | w toku (run 44236845571, krok „Testy”); wiersz z [DO USTALENIA] jest w `dziennik.md` |
| K2 | **Werdykt 07 dla SHA 01aaeddb (build 9)** (A2; zasada roli 10 nr 7: bez werdyktu build nie idzie do recenzji) | K zleca 07 | **brak**: w `docs/jakosc/` jest tylko `werdykt-build-1161.md` (+ `werdykt-1161/`) dla 2ed5215a; dla 1171, 1201 i build 9 pliku nie ma (`ls docs/jakosc \| grep -i werdykt`, 2026-11-18); dla 1201 wpis w `dziennik.md` ma [DO USTALENIA] |
| K3 | **Protokół testu fizycznego buildu 9 (F1a):** `docs/jakosc/test-fizyczny/<numer>.md` i `node scripts/jakosc/bramka-przypadki-uzycia.mjs recenzja <numer>` kod 0 | K | **brak** (jest tylko `1201.md`; wyjątek P-838 tylko dla 1171, `wyjatki.json`). Wejście: wynik kroku 1 dla PU-002/121/155 „zrobione”; pozostałe PU klasy F „pominięte: …” **[DO USTALENIA: decyzja K]** czy słowa właściciela z 17.11 (P-973) obejmują też build 9, czy potrzebne nowe słowa |
| K4 | **C1 na kandydacie** (zrzuty z ramkami, en/pl, iPhone/iPad) | K wyzwala, S (10) odbiera | wykonane 13.11 ([43396191411](https://github.com/lkarwowski494/oczko/actions/runs/43396191411), SHA 1dfcf7ca, success; artefakty `sklep-zrzuty-ramki`, `zrzut-zakupu` nieprzeterminowane, ważne do 2026-11-27 — API 2026-11-18), ale na kodzie sprzed 39 plików `app/src/modules/assets` (`git diff --name-only 2ed5215a 01aaeddb -- app src modules assets \| wc -l` → 39; łącznie 42 z `e2e/zrzuty-sklepu`, `scripts/ci`, `metadane`) — **decyzja K, patrz C1** |
| K5 | **PR integracji → `main` po zielonym CI** (przed krokiem 4) | K | brak otwartego PR (do sprawdzenia przed otwarciem: `list_pull_requests state=open`); CI na 01aaeddb zielone (Linux 44236811881, iOS 44236811872) |
| K6 | **Wyzwolenie `asc-iap-localizations` (v2) i `asc-zrzuty` po D1** oraz `asc-kontrola` tuż przed wysyłką (E17) | K | żadnego przebiegu v2 po KO-056 nie było (`list_workflow_runs`, 2026-11-13; po tej dacie w repo brak śladu) **[DO USTALENIA: sprawdzić listę przebiegów przed wyzwoleniem]** |
| K7 | **Decyzje otwarte:** C2 (sprawdzenie wzrokiem zrzutów), C3 (OG-07), B6 (zdanie o integracjach), B7 (3.1.2(a)) | K wg P-087 | otwarte, szczegóły w sekcjach B i C |
| K8 | **F1 — lista przed wysyłką (`sklep.md` §5, §5a) na SHA 01aaeddb** | S (10) | po K2, K4, E17 |
| K9 | **D3 — CI na `main` po scaleniu** | S/K | po kroku 4 |
| K10 | **Dziennik: wiersze buildów 1131, 1141, 1151, 1171** | K | brak (`dziennik.md` ma wiersze 2 (1111), 6 (1161), 8 (1201)); **[DO USTALENIA: decyzja K]** czy dopisać bez słów zgody z tamtych dni |

## Podsumowanie dla właściciela

1. **Czy to już wersja, która trafi do Apple store?** To **kandydat** (build 9, SHA 01aaeddb, w budowie), ale **jeszcze nie jest gotowy do wysłania** do recenzji.
2. **Kroków po Twojej stronie: 18** (po stronie koordynatora i sesji: 10; wykonanych dziś: żaden z 18 — w repo nie ma dowodu).
3. **Czas Twój: ok. 1 h 44 min – 2 h 23 min** [OCENA] (suma kolumny „Czas W”: 104–143 min); w tym do „Submit for Review” 1 h 22 min – 1 h 56 min, po akceptacji Apple ok. 22–27 min. Poza tym czekanie: build 9 (kilkadziesiąt minut), zrzuty C1 (≈ 18–40 min build + ≈ 30 min na język i urządzenie, nie 14:00–23:00 UTC), recenzja Apple (zwykle do 48 h).
4. **Osobna zgoda (osobne słowa):** scalenie do `main` (4), zapis lokalizacji produktów (6), zrzuty do ASC — dry-run i apply osobno (11), zgoda na wysłanie (14), „Submit for Review” (15), „Release this version” (17). Test ręczny (1) ma słowa z KO-158.
5. **Co blokuje „Submit for Review”:** (a) brak werdyktu 07 dla build 9 (K2) i brak protokołu testu fizycznego buildu 9 (K3; bramka `recenzja` wymaga go dla dokładnie tego buildu); (b) Twoja ręczna kontrola PU-002/121/155 (krok 1); (c) scalenie do `main` (4), bez którego nie ruszą workflowy ASC v2; (d) zrzuty z ramkami na kandydacie i Twoja akceptacja (2, 3, 11); (e) braki w ASC bez dowodu w repo: lokalizacje i zrzuty zakupu produktów (6, 10), notatka, Grace, Copyright (7–9), wygaszenie starszych buildów (12) i przygotowanie zgłoszenia (13).
6. **Najbliższy krok:** poczekać na koniec buildu 9 i zrobić krok 2 (akceptacja podpisów en/pl, 5 min) — możesz od razu, niezależnie od buildu.

Skróty: **W** właściciel · **K** koordynator · **S** sesja roli (10, 07, 08, 04, 09).

---

## A. Build kandydata i test właściciela

- [x] **A1 · Historia buildów 1.0.0 w TestFlight.** Tagi: `v1.0.0-b1071`, `-b1101`, `-b1111` (build 1, 2 i pośrednie), `-b1131`, `-b1141`, `-b1151`, `-b1161`, `-b1171`, `-b1201` (`git ls-remote --tags origin 'v1.0.0-b1*'`, 2026-11-18). Build 6 = 1161 (2ed5215a, run 43383728558), build 7 = 1171 (104f8764), build 8 = 1201 (4d2a455, run 44064462667) — zastąpione buildem 9.
- [ ] **A1d · Build 9 w TestFlight z SHA kandydata (01aaeddb).** Kto: K uruchomił `testflight.yml` (dispatch), Approve środowiska `release` · stan: **w toku** — run [44236845571](https://github.com/lkarwowski494/oczko/actions/runs/44236845571), `bramka` i `bramka przypadków użycia` success, `build` w toku od 07:53:18 UTC (krok „Testy”) · numer [DO USTALENIA] (wzór daje 1211) · słowa zgody na ten build: [DO USTALENIA] (zgoda na „Build 9 - A” z 17.11 12:40 UTC dotyczy zakresu, KO-158; Approve `release`: sprawdzić w zakładce przebiegu). Wpis w `dziennik.md`.
- [ ] **A2 · Werdykt 07 dla SHA 01aaeddb (build 9).** Patrz K2: brak. Rola 10 werdyktu nie pisze.
- [ ] **A3 · Ręczna kontrola PU-002/121/155 na buildzie 9** (zastępuje test całej listy: KO-157, KO-158). Kto: W · patrz krok 1. Wada kodu = poprawka 08 → nowy SHA → werdykt 07 → wraca do A1d (zasada roli 10 nr 7).
- [ ] **A4 · Wynik testu do K** (numer PU przy wadzie). Kto: W → K · 3 min.
- [x] **A5 · Wpis w `dziennik.md` dla build 9** (wiersz z [DO USTALENIA] dla numeru, run, werdyktu; 2026-11-18). Wpisy 1131, 1141, 1151, 1171: patrz K10.

## B. Zmiany w repo przed wysyłką (stan na 01aaeddb, sprawdzone 2026-11-18)

- [x] **B1 · `version` 1.0.0.** `app.json:5` = `"1.0.0"` (`grep -n '"version"' app.json`; plik bez zmian względem 4d2a455). Numer wysyłki nadaje workflow (ADR-0014), nie `app.json:28`.
- [x] **B2 · Zaślepka `[FILL BEFORE SUBMIT]`.** `docs/wydanie/metadane/notatka-recenzja.txt` (3544 B) bez `FILL`/`TODO`; ostatnia zmiana 86021dbd (2026-11-10). Notatka wklejona w ASC 2026-11-04 (P-536) jest starsza → krok 7 (E6).
- [x] **B3 · `id0000000000` w `adresy.ts`.** `src/kompozycja/adresy.ts:8` ma `id6823678721` (P-533). Ostatni przebieg `node scripts/wydanie/sprawdz-adresy.mjs` z 2026-11-10 (polityka, wsparcie, EULA 200; adres recenzji 404 do publikacji w App Store, oczekiwane) → kontrola z `--wydanie` w F7.
- [ ] **B4 · Znalezisko „Add pattern…” (M2-001).** `site/support.html:34`, `:37` (pl), `:62`, `:65` (en) kierują do menu ••• (stan z 2026-11-13; w tej sesji nie sprawdzano ponownie) · P3 · **do 1.0.1** (DEC-03 (b), P-644) · nowy build: nie (strona to repo `apps4brew-www`). Backlog: `oczko-warsztat/audit/M1-2026-11-10-finalny/backlog-1-0-1.json`.
- [x] **B5 · Manifest migracji.** `docs/jakosc/migracje-wydane.json:9-13`: `0001.sql`, sha256 `b8206b17…8b19`; `sha256sum src/dane/migracje/0001.sql` = `b8206b173178b26a…` (2026-11-18); `git diff --stat 4d2a455 01aaeddb -- src/dane/migracje` → puste. Wpisu nie trzeba zmieniać.
- [ ] **B6 · Zdanie o integracjach w opisie sklepu (2.5.1).** `sklep.md` §5a wiersz 2.5.1 „do sprawdzenia przy buildzie kandydata” · **[DO USTALENIA]**: decyzja K po teście zegarka (PU-155, krok 1). Jeśli tak: E13, nowy build niepotrzebny.
- [ ] **B7 · 3.1.2(a) „ongoing value”.** Notatka ma zdanie (`notatka-recenzja.txt:19`) · **[DO USTALENIA]**: decyzja K (P-087).

## C. Zrzuty sklepu i OG-07

- [ ] **C1 · Zrzuty na kandydacie (z ramkami, podpisami, zestawem na lokalizację i zrzutem zakupu; KO-032).** Kto: K wyzwala, S (10) odbiera · zgoda: nie (workflow bez sekretów i ASC) · czas W: 0.
  **Stan:** wykonane 13.11, run [43396191411](https://github.com/lkarwowski494/oczko/actions/runs/43396191411) (`zrzuty-sklepu.yml`, dispatch na `claude/youthful-pasteur-kx83sn`, SHA 1dfcf7ca, success); artefakty `sklep-zrzuty-ramki`, `sklep-zrzuty-surowe`, `zrzut-zakupu` nieprzeterminowane (`expires_at` 2026-11-27 11:31 UTC; surowe per urządzenie do 2026-11-20 — API 2026-11-18). Kod aplikacji tamtego przebiegu = 2ed5215a; od niego do build 9 zmieniło się **39 plików** `app/src/modules/assets` (42 z `e2e/zrzuty-sklepu`, `scripts/ci`, `metadane`).
  **Opcje (decyzja K, rekomendacja pierwsza):** **(a) powtórzyć C1 na SHA 01aaeddb** (`workflow_dispatch`, `jezyki=en,pl`, `urzadzenia=iphone,ipad`, `zadan=2`, `og07=false`, `aplikacja_z_przebiegu` puste; ok. 18–40 min build + ok. 30 min na język i urządzenie; ograniczenia: dzień nie poniedziałek i nie 1–7 miesiąca, iPad kończy przed 00:00 UTC, maszyn macOS zwykle brak 14:00–23:00 UTC; 18.11 to środa) — zrzuty to ekrany pokazywane w sklepie i mają odpowiadać binarce; koszt: czas maszyn, zero czasu W; **(b) użyć zrzutów z 13.11** — bez kosztu, ale ryzyko, że różnią się od aplikacji w recenzji (39 plików); sklep nie wymaga zgodności piksel w piksel, wymaga braku wprowadzania w błąd. Pozostałe 27 języków: osobna decyzja K (`jezyki=all` ≈ 10 h zegarowych albo `uzupelnij_z_przebiegu=<run>`); do tego czasu język bez własnych zrzutów nie idzie do `asc-zrzuty` (P-720).
- [ ] **C2 · Znaleziska 04 do zrzutów** (7 pozycji w `zrzuty-plan.md`) · **[DO USTALENIA]** — sprawdzenie wzrokiem na zrzutach z ramkami z aktualnego kodu: S (10) po C1.
- [ ] **C3 · Decyzja OG-07** (`[og07-ok]` tak/nie) · K wg P-087 · **[DO USTALENIA]** — brak zapisu spełnienia warunku patentowego (P-218). Bez `[og07-ok]` komplet = 5 zrzutów na klasę (wystarcza, zakres 1–10).
- [ ] **C4 · Ocena wyglądu zrzutów.** Kto: W · krok 3 · po C1; weto = zmiana tokenów w `podpisy-zrzutow.json` (pole `ramka`).
- [ ] **C5 · Akceptacja podpisów zrzutów en i pl.** Kto: W · krok 2 · `status.en`, `status.pl` = „[DO AKCEPTACJI]” (stan na 2026-11-18, `docs/wydanie/metadane/podpisy-zrzutow.json`). Odpowiedź: „tak” albo poprawiony tekst (P-720).
- [x] **C6 · Przekład podpisów na 27 języków ze sklepową lokalizacją.** Zrobione 12.11 (P-771, P-772): 29 języków po 7 podpisów, 6 pustych (bg, sl, sr, lt, lv, et — bez lokalizacji sklepu). Status 27 przekładów: „przekład maszynowy … [DO PRZEGLĄDU]”.
- [ ] **C7 · Zrzut zakupu dla App Review z artefaktu `zrzut-zakupu`** (`99-zakup-ceny.png`). Artefakt z 13.11 (ważny do 2026-11-27) pochodzi z kodu 2ed5215a. Wśród 39 zmienionych plików nie ma pliku ekranu ofert ani zakupu (`git diff --name-only 2ed5215a 01aaeddb -- app src modules assets \| grep -i -E 'oferty\|zakup'` → puste, 2026-11-18), więc kadr zakupu prawdopodobnie jest aktualny; pewność da tylko obejrzenie kadru **[DO USTALENIA]** (przed wgraniem sprawdzić, czy nie ma panelu „Test store” atrapy). Przy powtórzeniu C1 (opcja a) powstaje nowy artefakt.

## D. Scalenie do `main`

- [ ] **D1 · PR integracji → `main` i scalenie.** K otwiera PR po zielonym CI, **W scala** · zgoda W: **tak** (CLAUDE.md) · 5 min · stan: do zrobienia — `main` = 52308cd7 (`git ls-remote origin refs/heads/main`, 2026-11-18); `list_pull_requests state=open` w poprzedniej sesji (13.11) → `[]`; w tej sesji sprawdzono tylko `main`. Na `main` są `asc-*.yml`, `testflight.yml`, `ci.yml`, `e2e-ios.yml`, `pages.yml`, `przeklad-tlumaczen.yml`, `tests-tz.yml`; `jakosc-ios.yml`, `jakosc-linux.yml` i `zrzuty-sklepu.yml` tylko na integracji (stan z 13.11, nie powtarzano). `asc-iap-localizations.yml` na `main` jest jeszcze w wersji v1 (wycofane przez Apple); v2 trafi tam ze scaleniem.
- [ ] **D2 · Po scaleniu: usunąć regułę gałęzi `claude/youthful-pasteur-kx83sn` ze środowiska `release`.** Kto: W · 2 min · po D1 (reguł środowiska agent nie odczyta — API 403).
- [ ] **D3 · CI na `main` zielone po scaleniu.** S/K · po D1 (zasada wspólna 21).

## E. App Store Connect: kroki 0–12 z `sklep.md` §3 oraz wgranie metadanych i zrzutów

Wszystko w [App Store Connect → Oczko (Apple ID 6823678721)](https://appstoreconnect.apple.com/apps/6823678721). Agent nie ma dostępu do ASC: pozycje bez dowodu w repo zostają nieodhaczone.

- [x] **E0 (krok 0) · Rekord aplikacji.** Apple ID 6823678721 (P-533).
- [ ] **E1 (krok 1) · Produkty V4:** grupa „Oczko Pro”, `oczko.pro.monthly` 0,99 USD, `.yearly` 6,99 USD, `.lifetime` 14,99 USD · utworzone i z cenami: **zrobione** (`asc-kontrola` run 41861442962, 2026-11-04, P-536). Brakuje: **(a) lokalizacje produktów** — en-US zapisane (P-516), pl zaakceptowane przez W (P-516), zapis pl i reszty **[DO USTALENIA]**; od KO-056 (P-789–P-791, P-794) zapis idzie przez model wersji v2: po D1 workflow `asc-iap-localizations` → `tryb: dry-run` (Approve) → obejrzeć wiersze `(wersja N, STAN; istniejących lokalizacji: K)` → `tryb: apply` (Approve) → drugi `apply` (oczekiwane `utwórz 0, zaktualizuj 0, nowe wersje 0`); szczegóły: `docs/wydanie/asc-v2/przebieg-wlasciciela.md`. Pierwszy przebieg na prawdziwym ASC (atrapa serwera w testach to odczytana dokumentacja). **(b)** zrzut recenzji każdego z 3 produktów (API go nie wgrywa) — brak zapisu wykonania; plik z C7. Kto: (a) K uruchamia, W zatwierdza · zgoda tak dla `apply` · czas W: (a) 8–12 min, (b) 5–10 min.
- [x] **E2 (krok 2) · Family Sharing** — `asc-kontrola` run 41861442962 „Family Sharing OK” (P-536); `src/kompozycja/adresy.ts:13` `FAMILY_SHARING = true`.
- [ ] **E3 (krok 3) · Billing Grace Period:** 3 dni, All Renewals (KP-06). Kto: W · 2 min · **[DO USTALENIA]** — brak zapisu wykonania w `decyzje.md`. Sprawdzenie: aplikacja → Subscriptions → Billing Grace Period.
- [x] **E4 (krok 4) · App Privacy:** „Data Not Collected” + Privacy Policy URL (ręcznie 2026-11-03, P-536); adres polityki 200 (B3).
- [x] **E5 (krok 5) · Ocena wieku** 16+ (P-464, 2026-11-03).
- [ ] **E6 (krok 6) · Kontakt dla recenzenta i notatka.** Kontakt wpisany (P-492), „Sign-in required” wyłączone. Notatkę wklej ponownie z `notatka-recenzja.txt` (3544 B, ostatnia zmiana 86021dbd z 2026-11-10: `git log -1 --format='%h %ad' --date=short -- docs/wydanie/metadane/notatka-recenzja.txt`, 2026-11-18; wersja listy z 13.11 podawała 7ad1fd42/11.11, to było błędne). Kto: W · 3 min · **[DO USTALENIA]** czy wklejono; potem `asc-kontrola` nie może pokazać RÓŻNICY „notatki ≠ plik”.
- [ ] **E7 (krok 7) · Support URL i Copyright.** Support URL ustawia `asc-metadane` (32 lokalizacje zgodne, P-514, P-533). Copyright „2026 Łukasz Karwowski” (D7a) — **[DO USTALENIA]**: brak zapisu wpisania. Kto: W · 1 min.
- [x] **E8 (krok 8) · Name w 33 lokalizacjach** (P-514, P-533 (2): run 41843551731, zapisano 32, błędy 0).
- [x] **E9 (krok 9) · Szyfrowanie:** `ITSAppUsesNonExemptEncryption: false` w `app.json:55`; jeśli „Missing Compliance”: NO jak w Treningu (`48-zgloszenie-1-0.md` Z-26).
- [x] **E10 (krok 10) · Status tradera (DSA)** — konto wspólne z Treningiem: zweryfikowany 20.10.2026, sprawdzony 26.10.2026 (Trening `docs/48-zgloszenie-1-0.md:117`, Z-23; P-315). Umowa Paid Apps i Small Business Program na koncie (`docs/48-zgloszenie-1-0.md:105-106`).
- [x] **E11 (krok 11) · Content Rights: Yes** (właściciel 2026-11-04 15:10 UTC, P-536).
- [ ] **E12 (krok 12) · Kategoria podatkowa: bez zmian** („App Store software”) — **[DO USTALENIA]**: potwierdzenie doradcy podatkowego (jak Trening); nie blokuje. Kategoria główna Lifestyle, dostępność i cena „darmowa” — zrobione (P-516, `asc-kontrola` OK 17, RÓŻNICA 0).
- [ ] **E13 · Zapis metadanych po zmianach tekstu (tylko jeśli B6 lub zmiana opisu).** K uruchamia, W zatwierdza `zapis` · zgoda: tak · [asc-metadane](https://github.com/lkarwowski494/oczko/actions/workflows/asc-metadane.yml) · 3 min · warunkowy; metadane 32 lokalizacji są już w ASC (P-514, P-533).
- [ ] **E14 · Zrzuty do ASC: `asc-zrzuty` dry-run, potem apply.** K uruchamia, W zatwierdza dwa razy · zgoda: **tak, osobno** · 8 min · zależy od C1, C4, D1 (`sklep.md` §3e kroki 5–7). **[DO USTALENIA]:** czy lokalizacje bez własnych zrzutów dziedziczą `en` i czy poziome zrzuty iPada trafiają do grupy 13″ (pokaże dry-run).
- [ ] **E15 · Wygaszenie starszych buildów w TestFlight** — wszystkie poza buildem 9 (wzorzec Trening Z-25a: bez tego w E16 można wybrać zły build). Kto: W · 2 min · po A3. Lista buildów 1.0.0 w repo (tagi): patrz krok 12; które są aktywne w TestFlight: **[DO USTALENIA]** (odczyt tylko w ASC).
- [ ] **E16 · Przygotowanie zgłoszenia: build 9 (1211 [DO USTALENIA]) do wersji 1.0, „Manually release”, produkty dołączone.** Kto: W · zgoda: nie · 10 min · po E1, E14, E15. Wersja 1.0 → Build → „+” → build 9 (jeśli „Missing Compliance”: NO); Version Release → „Manually release this version” (`sklep.md` §5 poz. 7; **[DO USTALENIA]** czy już ustawione); grupa subskrypcji, 2 subskrypcje i zakup jednorazowy w jednym szkicu z wersją (Apple „Submit an In-App Purchase”, Trening Z-28/Z-29). Warunki: Content Rights (E11 ✓), zrzut recenzji produktu (E1b), dostępność produktu.
- [ ] **E17 · `asc-kontrola` tuż przed wysyłką** (ceny, brak ofert wprowadzających, Family Sharing, kategoria, adresy, notatka = plik; Trening Z-10). K/S (tylko odczyt, bez Approve) · [asc-kontrola](https://github.com/lkarwowski494/oczko/actions/workflows/asc-kontrola.yml) · po E6, E14.

## F. Wysyłka, recenzja, wydanie

- [ ] **F1 · Lista przed wysyłką (`sklep.md` §5) i wytyczne §5a odhaczone z dowodem na SHA 01aaeddb** (§5a: 2.1, 2.3.3, 2.3.7, 2.5.1 „do sprawdzenia przy buildzie kandydata”; skrypt `sprawdz-wydanie.mjs` jest narzędziem roli z `prompts`, nie leży w repo — kontrole zastępują testy `tests/wydanie/*`). S (10) · czas W: 0 (agent ≈ 30–40 min) · po K2, K4, E17. Wysyłka bez tego punktu i bez werdyktu 07 dla SHA nie startuje (zasada roli 10 nr 7).
- [ ] **F1a · Protokół testu fizycznego buildu idącego do recenzji (KO-065, P-837; słowa W 15.11 ok. 18:12 UTC: „ten fizyczny test musi byc wykonany po buildzie”; KO-157, KO-158 i P-973 dla 1201).** Przed F2: `node scripts/jakosc/bramka-przypadki-uzycia.mjs recenzja <build>` (dla build 9: numer z tagu) kod 0 — w `docs/jakosc/test-fizyczny/<numer>.md` każdy PU klasy F katalogu (stan 1201: F = 61) ma „zrobione: …” albo „pominięte: <uzasadnienie>”; wyjątek P-838 (1171) tu nie działa; **dla build 9 pliku nie ma** (jest tylko `1201.md`). Patrz K3.
- [ ] **F2 · Zgoda W na wysłanie do recenzji** (słowa i data do `dziennika.md`) · **tak** · 1 min · po F1 i F1a.
- [ ] **F3 · „Submit for Review”.** W (Draft Submissions → 5 pozycji: wersja, grupa, 2 subskrypcje, zakup → Submit) · **tak (F2)** · 5 min.
- [ ] **F4 · Odpowiedzi App Review / Resolution Center** (jeśli odrzucenie lub pytanie). S przygotowuje (cytat wytycznej + fakty, bez obietnic), W wysyła · **tak, na każdą odpowiedź** · 0–15 min · czas Apple: „typically reviewing at least 50% of submissions in less than 24 hours and 90% in less than 48 hours” (Trening `docs/48-zgloszenie-1-0.md:142`, źródło developer.apple.com/distribute/app-review, odczyt 29.10.2026 — sprawdzić ponownie przed cytowaniem).
- [ ] **F5 · Po akceptacji („Pending Developer Release”): ten sam build 9 na telefonie, krótki test** (Trening Z-31). W · 15–20 min.
- [ ] **F6 · „Release this version”** (wydanie ręczne, bez wydania stopniowego na start, D5a). W · **tak** · 2 min · po F5.
- [ ] **F7 · Po wydaniu:** instalacja z App Store, ekran ofert pokazuje ceny z arkusza Apple (PL 4,99 / 19,99 / 59,99 zł, `nadpisaniaCen` P-472; Trening Z-36); `node scripts/wydanie/sprawdz-adresy.mjs --wydanie` kod 0 (P-716); wiersz „Wydanie” w `dziennik.md`; linia „Etap” w `CLAUDE.md` z datą; przekazanie do 11 (strona produktu, języki, data) i 12 (wersja, build, SHA). W (telefon, 5 min), S (reszta).

---

## Czego ta lista nie obejmuje

- Pełny test na urządzeniu wszystkich PU klasy F: właściciel zdecydował 17.11 o ręcznej kontroli tylko PU-002/121/155 (KO-158); PU-057 poza listą (KO-161, ryzyko przyjęte).
- Raport zgodności dla urządzeń: rola 07 (werdykt, K2).
- 1.0.1 (B4, backlog, CN-02/05, 105, 93 — build 10) — po wydaniu.
- Wysyłka produktów do recenzji przez API (`reviewSubmissions` + `reviewSubmissionItems`): poza zakresem migracji KO-056, produkty idą z wersją aplikacji ręcznie (`asc-v2/przebieg-wlasciciela.md` pkt 5).
- Wydanie stopniowe, reset oceny: nie w 1.0 (domyślnie bez resetu, `sklep.md` §5 poz. 7).

## Źródła tej listy

`docs/wydanie/sklep.md` §3–§6, `stan.md`, `asc-v2/`, `dziennik.md`, `docs/decyzje.md` (P-464, P-477, P-479, P-492, P-514–P-516, P-533, P-536, P-644, P-653, P-720, P-763, P-771, P-773, P-780, P-789–P-791, P-794, P-838, P-973, P-986), `docs/jakosc/test-fizyczny/` (`1201.md`, `wyjatki.json`), `scripts/jakosc/bramka-przypadki-uzycia.mjs`, `.github/workflows/testflight.yml`, `docs/fakty-wlasciciela.md`, `docs/monetyzacja.md`; polecenie koordynatora KO-172 (`docs/koordynacja/polecenia/CR.md` na gałęzi `koordynacja` @ 2e896b5f) i decyzje KO-158, KO-161, KO-171; Trening `docs/48-zgloszenie-1-0.md` (odczyt 2026-11-13, wiersze Z-10…Z-36); dowody z API GitHub (runy 44236845571, 44236811881, 44236811872, 44219221205, 44064462667, 43396191411 i jego artefakty) i `git` z 2026-11-18 podane przy pozycjach.
