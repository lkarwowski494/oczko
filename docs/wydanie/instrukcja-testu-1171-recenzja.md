# Recenzja instrukcji testu 1171 (rola 07-jakosc, recenzja niezależna)

- Data: 2026-11-15
- Commit bazowy kodu: `104f8764` (= tag `v1.0.0-b1171`, tag lekki); porównanie z `v1.0.0-b1161` (= `2ed5215a`).
- Recenzowany plik: `docs/wydanie/instrukcja-testu-1171.html`. W trakcie recenzji koordynator zacommitował go w `87a4e385` (z wpisami P-827–P-829). Bajty są te same, które recenzowałem: md5 `d02fc285605b80d24c7a7413b1cbadc6` w drzewie roboczym i w `git show HEAD:…`.
- Wzorzec: `docs/wydanie/instrukcja-testu-1161.html`, `docs/wydanie/instrukcja-testu-1161-recenzja.md`. Listę źródłową `docs/wydanie/test-urzadzenia-build5.md` sprawdziłem tylko w T-04 i w punkcie o Autoblokadzie.

**Sprawdzone pliki i komendy**
- `diff` obu plików HTML po rozbiciu na znaczniki oraz skrypt node, który wyciąga `var DANE` i porównuje kroki pole po polu (`id`, `sekcja`, `zrob`, `powinno`, `szczegoly`, `uwaga`, `nowe`…). Liczba kroków: ogółem, według `PODEJSCIA`, według `KROTKI`.
- `git diff v1.0.0-b1161 v1.0.0-b1171 -- src app targets modules`; `git diff --stat v1.0.0-b1161 v1.0.0-b1171` (wszystko poza `docs/` i `tests/`).
- `git grep MIN_WATCHOS v1.0.0-b1171`, `git grep deploymentTarget v1.0.0-b1171 -- targets app.json`.
- `targets/watch/expo-target.config.js:13`, `src/konfiguracja.ts:36`, `scripts/wydanie/kontrola-ipa.sh:12,31`, `docs/decyzje.md` (P-819, P-822, P-827–P-829), `docs/adr/0006-minimalne-wersje-ios-18-watchos-11.md` (sekcja „Zmiana 2026-11-15”), `docs/fakty-wlasciciela.md:17,19`, diagnoza `c07e19bc:docs/jakosc/zegarek-diagnoza-1161.md`.
- Log przebiegu TestFlight 43720546910 (`gh run view --log`, headSha 104f8764): krok „Kontrola .ipa”.
- `curl` surowego HTML: support.apple.com/pl-pl/guide/iphone/iph7117338a8/ios, support.apple.com/pl-pl/109023, developer.apple.com/testflight/testers/ (pomoc TestFlight dla testerów, po angielsku).
- Playwright (chromium) na kopii w scratchpadzie z dołożonym `<meta charset="utf-8">`. Czcionki Google zablokowane, więc podgląd idzie na czcionce zastępczej. Sprawdzone szerokości 390 i 1024 px, motyw jasny i ciemny.

## 1. Różnice 1161 → 1171

Zestaw kroków, ich kolejność i przypisanie do sekcji są identyczne: porównanie `id+sekcja` dało `true`. Kroków jest 121, z tego 3 dodatkowe. Podejścia: 77 / 28 / 16. Tryb krótki: 13. Sekcje (`DANE.sekcje`) różnią się tylko numerem buildu we wstępie 1a. Skrypt różni się tylko kluczem, domyślnym buildem i rysowaniem znacznika „nowe w 1171”.

| # | Miejsce | 1161 | 1171 | Ocena |
|---|---|---|---|---|
| 1 | `<title>`, `<h1>` | „Test Oczka 1161” | „Test Oczka 1171” | poprawne |
| 2 | Podtytuł | „Instrukcja pierwszego testu Oczka 1.0.0 (1161)…” | „Instrukcja testu Oczka 1.0.0 (1171) na urządzeniach: iPhone, Apple Watch i iPad, cały zakres.…” | poprawne. „Pierwszego” usunięte, bo 1161 był pierwszym testem (`docs/fakty-wlasciciela.md:17`) |
| 3 | Pole buildu (`:139`), `stan.build` (`:375`) | `1161` | `1171` | poprawne |
| 4 | `KLUCZ` (`:350`) | `oczko-test-1161-v1` | `oczko-test-1171-v1` | poprawne. Zaznaczenia z 1161 nie przechodzą do 1171 (sprawdzone w Playwright: zapis i odczyt po przeładowaniu działa pod nowym kluczem) |
| 5 | Nowy blok „Co nowego w 1171 do sprawdzenia” (`:141–150`) i CSS `.nowosc`, `.chip.nowe` (`:69–74`) | — | watchOS 10, wygląd na zegarku, T-04, znacznik, „pozostałe kroki bez zmian” | wymóg zlecenia spełniony. Uwagi: znalezisko P2-2 („pozostałe kroki takie same”), P3-1 (kontrast), P3-4, P3-5 |
| 6 | Zanim zaczniesz → Instalacja, pkt 3 (`:161`) | „numer pod nazwą »Oczko«… »Install«/»Update«/»Previous Builds«” | pole „Wersja” = 1.0.0 (1171), „Poprzednie kompilacje”, przyciski po angielsku z „[sprawdź na ekranie]” | polskie napisy zgodne z faktami ze zrzutu. **Sposób sprawdzenia jest zawodny:** P1-1 |
| 7 | Instalacja, nowy pkt 4 (`:162`) | — | „Sprawdź, że zainstalowana jest 1171… przeczytaj »Wersja«” | wymóg zlecenia jest, ale sprawdzenie nie odróżnia kompilacji zainstalowanej od dostępnej: P1-1 |
| 8 | Instalacja, nowy pkt 5 (`:163`) | — | „Uaktualnienia automatyczne” zostaw; przed podejściem zajrzyj do „Wersja” | zgodne z P-828. Ta sama wada co w pkt 4 (P1-1); wpływ na T-02: P1-2 |
| 9 | Instalacja, iPad (`:164`) | „1161 → »Install«” | „1171 → przycisk instalacji (po angielsku »Install«)…; »Wersja« ma pokazać 1.0.0 (1171)” | poprawne co do numeru. „Wersja” jak w P1-1 |
| 10 | Oczko na zegarku, akapit (`:174`) | „Zegarek potrzebuje watchOS 9 lub nowszego.” | „…watchOS 10.0 lub nowszego; Twój ma 10.6.2.” + znacznik | poprawne. W 1161 „9” było błędem: na 1161 `deploymentTarget: '11.0'` (`git show v1.0.0-b1161:targets/watch/expo-target.config.js:13`). „9” to zapewne ogólne minimum TestFlight („watchOS apps: Apple Watch running watchOS 9 or later”, developer.apple.com/testflight/testers/) |
| 11 | Co przygotować (`:203`) | „Automatyczna blokada” | „Autoblokada” | poprawne, zamyka P2 z recenzji 1161 (cytat źródła w §3) |
| 12 | Kroki, które mogą nie dać się zrobić (`:284`) | „T-02: nie dotyczy przy pierwszej instalacji” | „T-02: nie dotyczy, jeśli w Oczku… nie masz żadnych danych (np. instalujesz pierwszy raz)” | spójne z nową uwagą T-02 (P-829) |
| 13 | Wstęp sekcji 1a | „…po instalacji 1161 na iPadzie” | „…1171…” | poprawne |
| 14 | T-01 `uwaga` | „To pierwszy test… (np. 1061); 1161 zainstalujesz…” | „…(np. 1161 albo 1061); 1171 zainstalujesz…” | poprawne. Odczyt numeru w TestFlight: P1-1 |
| 15 | T-02 `zrob` | „»Install«/»Update« build 1161” | „zainstaluj albo uaktualnij do kompilacji 1171 (po angielsku …)”, „build 1171” | poprawne co do numeru. Mieszane „build”/„kompilacja”: P3-2 |
| 16 | T-02 `uwaga` | „Nie dotyczy przy pierwszej instalacji…” | „Nie dotyczy, jeśli nie masz w Oczku swoich danych… Jeśli na telefonie jest 1161 z projektami…, zrób ten krok” | **zmiana sensu**, uzasadniona decyzją P-829 (`docs/decyzje.md:749`). `zrob` i „Powinno być” bez zmian. Kolizja z kolejnością „Zanim zaczniesz”: P1-2. Brak znacznika zmiany: P2-2 |
| 17 | T-04 `zrob` | „…przewiń do »Oczko«… włącz instalację przełącznikiem” | „Mój zegarek” → „Aplikacje” → „Dostępne aplikacje” → „Instaluj”; awaryjnie TestFlight (sposób 2) | poprawne, zgodne ze źródłem Apple (§3) i z P-822 oraz z listą źródłową (`test-urzadzenia-build5.md:110–113`). Kroków w `zrob` jest 4 zamiast 3; „Powinno być” bez zmian |
| 18 | T-04 `uwaga`, `nowe` | `""` | „Od 1171 aplikacja zegarka wymaga watchOS 10.0…; jeśli nie da się zainstalować żadnym sposobem, zaznacz »nie«…” | poprawne, spójne z blokiem zegarka |
| 19 | T-16 `zrob` (ostatnia pozycja) | „Przywróć swoją automatyczną blokadę.” | „Przywróć swoje ustawienie »Autoblokada«.” | poprawne |
| 20 | T-95 `zrob` | „build 1161” | „build 1171” | poprawne |
| 21 | T-105, T-106, T-107 | — | `nowe: true` (tylko znacznik, treść bez zmian) | poprawne |

Pozostałe wystąpienia „1161” w 1171 (`:144`, `:161`, T-01, T-02) są zamierzone: opisują poprzedni build. Żaden krok nie zginął i nie przybył. Poza wierszami 16 i 17 żaden krok nie zmienił sensu.

## 2. Zgodność z kodem na 104f8764

- `git diff v1.0.0-b1161 v1.0.0-b1171 -- src app targets modules` zmienia 3 linie:
  - `targets/watch/expo-target.config.js:13`: `deploymentTarget` z `'11.0'` na `'10.0'`;
  - `src/konfiguracja.ts:36`: `MIN_WATCHOS` z `'11.0'` na `'10.0'`;
  - komentarz w `modules/oczko-reguly/Package.swift`.
- Poza `docs/` i `tests/` zmieniły się jeszcze `README.md`, `package.json` (tylko skrypt `jakosc:kontrole`), skrypty `scripts/asc/*`, `scripts/i18n/*`, `.github/workflows/asc-iap-localizations.yml` i `przeklad-tlumaczen.yml` (metadane sklepu i przekłady) oraz `scripts/wydanie/kontrola-ipa.sh:12` (`MIN_WATCH=10.0`). Nie zmieniły się `app.json`, `locales/`, `plugins/`, `assets/` ani kod Swift w `targets/watch`.
- `MIN_WATCHOS` występuje w drzewie 1171 tylko w `src/konfiguracja.ts` i w teście `tests/wydanie/zegarek-minimum-watchos.test.ts` (`git grep`). Aplikacja w czasie działania go nie czyta. **Zdanie „Poza zegarkiem kod aplikacji się nie zmienił” jest prawdziwe na poziomie źródeł.**
- Minimum zegarka: 11.0 w 1161 i 10.0 w 1171 potwierdzają konfiguracje z obu tagów. Potwierdza to też wynik zbudowanego `.ipa` 1171. Log przebiegu TestFlight 43720546910 pokazuje „### Kontrola .ipa: com.apps4brew.knitting 1.0.0 (1171)” i „Wynik: błędów 0, uwag 2”. `kontrola-ipa.sh:31` zgłasza błąd, gdy `MinimumOSVersion` w `Watch/*.app/Info.plist` ≠ `MIN_WATCH` (10.0). Zero błędów oznacza więc, że w wysłanym pakiecie zegarek ma `MinimumOSVersion = 10.0`.
- „Automatyczne testy widziały aplikację zegarka tylko na nowszym watchOS”: zgodne z ADR-0006 („symulatora watchOS 10 runner nie ma: `macos-26` ma tylko watchOS 26.x”) i z logiem 43720546910 (dostępne symulatory watchOS 26.2, 26.4, 26.5).
- Na 1171 nie da się sprawdzić, czy kod zegarka faktycznie działa na watchOS 10.6.2. ADR-0006 też nazywa to dowodem z urządzenia (T-04, T-105–T-107). Instrukcja tego nie obiecuje („powinno dać się zainstalować”), więc brzmienie jest uczciwe.

## 3. Źródła Apple (surowy HTML, odczyt 2026-11-15)

- support.apple.com/pl-pl/guide/iphone/iph7117338a8/ios („Przedłużanie czasu, przez który ekran iPhone’a pozostaje włączony”): „Przejdź do Ustawień na iPhonie. Stuknij w Ekran i jasność, a następnie stuknij w Autoblokada. Wybierz czas trwania.” Nazwa i ścieżka w `:203` i w T-16 są zgodne. Wartości „1 minuta” strona nie wymienia (bez zmian od 1161; nie sprawdzone).
- support.apple.com/pl-pl/109023 („Pobieranie aplikacji na zegarku Apple Watch”, data publikacji 21 września 2026): „Na iPhonie otwórz aplikację Watch. Stuknij kartę Mój zegarek. Stuknij opcję Aplikacje, a następnie przewiń do aplikacji, którą chcesz dodać. Aplikacje do zainstalowania znajdują się w sekcji Dostępne aplikacje. Aby dodać aplikację do zegarka, stuknij opcję Instaluj.” Zgodne są „Mój zegarek”, „Aplikacje”, „Dostępne aplikacje” i „Instaluj” w T-04 i w bloku „Oczko na zegarku”, sposób 1.
- developer.apple.com/testflight/testers/ (po angielsku; polskiej wersji nie czytałem):
  - Sposób 2 (zegarek z TestFlight): „If the app is an iOS app that includes an Apple Watch app, install the iOS app first, then go to the App Details page in the Information section. If the Apple Watch app is available and compatible with your watch, there will be a button to install, update, or open it.” Treść sposobu 2 jest z tym zgodna.
  - **Ważne dla P1-1:** „When viewing an app in TestFlight, you'll see the latest available build by default.”, „If you're a returning tester, tap Update or Open.”, „with TestFlight 3 or later, you can turn on automatic updates to have the latest beta builds install automatically”.

## 4. Działanie strony (Playwright)

- Błędów JS (`pageerror`) nie było. Jedyne błędy konsoli to dwa `net::ERR_FAILED`, czyli czcionki Google, które sam zablokowałem w teście.
- Liczby na stronie: tryb pełny „121 kroków · 3 podejścia · ok. 5 h 27 min”; podejścia 77 / 28 / 16; tryb krótki 13 kroków: T-01 T-02 T-04 Z-01…Z-06 T-105 T-106 T-107 T-136. Te same co w 1161.
- Znacznik „nowe w 1171”: podejście 1 → T-04; podejście 2 → T-105, T-106, T-107. W trybie krótkim wszystkie cztery.
- Przełączanie trybu i podejść działa. W trybie krótkim 8 z 8 bloków `data-tylko="pelny"` jest ukrytych, a podejścia schowane.
- „Pokaż tekst” daje „Test Oczka na urządzeniach · build 1171 · tryb krótki · 2026-11-15 / T-04 tak — test uwagi / Bez odpowiedzi (12): …”.
- Przy 390 px: `scrollWidth = clientWidth = 390` we wszystkich podejściach, w trybie krótkim i przy rozwiniętych wszystkich `<details>`. Brak elementów wychodzących poza ekran.
- Kontrast: blok „Co nowego” 12,5:1 w jasnym i 8,6:1 w ciemnym. Znacznik „nowe w 1171” w jasnym motywie ma 2,83:1 (P3-1), w ciemnym 6,41:1.
- Plik nie ma `<meta charset>`, tak samo jak 1161 (fragment pod opakowanie artefaktu). Nie sprawdzałem, jak wygląda opublikowana strona na prawdziwym iPhonie w Safari.

## 5. Znaleziska

### P1-1. Sprawdzenie „zainstalowana jest 1171” czyta pole, które pokazuje najnowszą dostępną kompilację, a nie zainstalowaną

- **Miejsce:** Zanim zaczniesz → Instalacja, pkt 3, 4 i 5 (`:161–163`), iPad (`:164`); pośrednio T-01 (odczyt numeru).
- **Cytat:** „Sprawdź pole »Wersja«: musi być 1.0.0 (1171)… Jeśli widzisz inną liczbę (np. 1161)…, zainstaluj 1171” oraz „po instalacji otwórz TestFlight → »Oczko« jeszcze raz i przeczytaj »Wersja« — ma być 1.0.0 (1171)”.
- **Dowód:** pomoc TestFlight: „When viewing an app in TestFlight, you'll see the latest available build by default.” Strona aplikacji pokazuje kompilację 1171, gdy tylko jest dostępna. O zainstalowanej mówi przycisk: „If you're a returning tester, tap Update or Open.”
- **Skutek:** testujący z zainstalowaną 1161 widzi „Wersja 1.0.0 (1171)” i uznaje, że ma 1171. Pkt 3 każe instalować tylko „jeśli widzisz inną liczbę”. Testuje więc 1161: T-04 da fałszywe „nie”, bo zegarek wymaga watchOS 11, a nagłówek wyniku poda build 1171. Pkt 4, czyli sprawdzenie wymagane w zleceniu, daje fałszywe „tak”. Pkt 5 w drugą stronę: gdy pojawi się nowsza kompilacja, a uaktualnienia automatyczne są wyłączone, „Wersja” pokaże nowszy numer, choć zainstalowana jest nadal 1171.
- **Zastrzeżenie:** polskiego ekranu TestFlight nie widziałem. Nie wiem, czy „Wersja” ze zrzutu właściciela dotyczy kompilacji zainstalowanej. Dokumentacja Apple mówi o domyślnym widoku najnowszej.
- **Proponowane brzmienie pkt 3–4:**
  > Na stronie „Oczko” w TestFlight sprawdź dwie rzeczy: pole **„Wersja”** = **1.0.0 (1171)** i główny przycisk przy nazwie. Jeśli przycisk to „Otwórz” (po angielsku „Open”) [sprawdź na ekranie], 1171 jest zainstalowana. Jeśli to przycisk uaktualnienia albo instalacji („Update”/„Install”), stuknij go (najpierw przeczytaj T-02). Jeśli „Wersja” pokazuje inną liczbę niż 1171, stuknij „Poprzednie kompilacje” → 1171 i tam sprawdź przycisk tak samo.
  >
  > **Sprawdź, że zainstalowana jest 1171:** po instalacji wróć do TestFlight → „Oczko”: przy „Wersja 1.0.0 (1171)” przycisk ma brzmieć „Otwórz” („Open”).

  W pkt 5: „Przed każdym podejściem zajrzyj do TestFlight: jeśli przy 1171 nie ma »Otwórz« albo pojawiła się nowsza kompilacja z »Otwórz«, wpisz numer w uwadze…”. W T-01 `uwaga` dopisz: „numer zainstalowanej poznasz po przycisku »Otwórz« (»Open«) przy danej kompilacji”.

### P1-2. „Zanim zaczniesz” każe zainstalować 1171 przed zrzutem, którego T-02 wymaga „przed instalacją”

- **Miejsce:** Zanim zaczniesz → Instalacja, pkt 3 (`:161`) i pkt 5 (`:163`, uaktualnienia automatyczne) wobec T-02 `zrob`/`uwaga`.
- **Cytat:** pkt 3: „Jeśli widzisz inną liczbę (np. 1161)…, zainstaluj 1171…”. T-02: „Jeśli jest 1.0.0 z Twoimi danymi: przed instalacją zrób zrzut listy »Projekty« i jednego licznika. Potem w TestFlight zainstaluj albo uaktualnij do kompilacji 1171”; uwaga T-02: „Jeśli na telefonie jest 1161 z projektami z wcześniejszych prób, zrób ten krok”.
- **Dowód:**
  - Blok „Zanim zaczniesz” stoi nad listą kroków, a pkt 3 każe instalować od razu po T-01. T-02 czyta się dopiero po wybraniu zakresu.
  - P-829 (`docs/decyzje.md:749`) celowo włącza T-02 dla aktualizacji 1161 → 1171 z danymi („jedyna okazja sprawdzenia aktualizacji z danymi”).
  - Właściciel zaczął test 1161 i doszedł co najmniej do T-04 („Oczka brak w watch”, diagnoza `c07e19bc`). Na telefonie mogą więc być dane z T-03 i dalszych kroków.
  - Jeśli „Uaktualnienia automatyczne” są włączone, 1171 mogła się już zainstalować sama („latest beta builds install automatically”, pomoc TestFlight). Wtedy zrzut „przed instalacją” jest niemożliwy w ogóle.
- **Skutek:** T-02 nie da się wykonać zgodnie z treścią. Testujący zaznaczy „pomiń” albo „tak” bez zrzutu do porównania, czyli fałszywe „tak” dla zasady zero utraty danych.
- **Proponowane brzmienie:** w pkt 3, przed „zainstaluj 1171”:
  > Jeśli w Oczku na telefonie są Twoje projekty (np. z prób 1161), najpierw zrób zrzut listy „Projekty” i jednego licznika (to część kroku T-02), dopiero potem instaluj.

  W uwadze T-02 dopisz:
  > Jeśli 1171 zainstalowała się już sama (uaktualnienia automatyczne), zaznacz „Pomiń” z uwagą „zaktualizowało się przed zrzutem” i napisz, czy projekty wyglądają na kompletne.

### P2-1. Stan telefonu po próbach 1161 może dać fałszywe „nie” w krokach, które zakładają świeżą instalację

- **Miejsce:** T-70 „Powinno być”; T-70/T-71 (wymagają braku Pro); T-01/T-02.
- **Cytat:** T-70: „po świeżej instalacji »Zostało 4 z 5« (dziś liczyłeś, jeden dzień zużyty)”; wstęp sekcji 9: „najpierw limit (wymaga braku Pro)”.
- **Dowód:** instrukcja 1171 każe instalować 1171 na istniejącą aplikację bez usuwania (T-01 `uwaga`, T-02, P-829). Jeśli w 1161 liczono w innym dniu tego miesiąca (T-03 to już „+1”), T-70 pokaże mniej niż „4 z 5”. Jeśli w 1161 doszło do T-72, subskrypcja testowa trwa do 6 dni („Zakup Pro w TestFlight”), a T-70/T-71 wymagają braku Pro. Jak daleko doszedł test 1161, nie ustaliłem: w repo nie ma wyniku testu 1161.
- **Proponowane brzmienie:** w T-01 `uwaga` dopisz:
  > Zapisz też, do którego kroku doszedłeś w teście 1161 i czy robiłeś T-72 (zakup).

  W T-70 `uwaga`:
  > Jeśli Oczko zaktualizowałeś z 1161, na którym liczyłeś w innym dniu tego miesiąca, liczba może być mniejsza o te dni. Zapisz ją; to nie jest powód do „nie”. Jeśli w 1161 kupiłeś Pro mniej niż 7 dni temu, T-70 i T-71 zaznacz „Pomiń” z uwagą „Pro z 1161”.

  Alternatywa to decyzja koordynatora o usunięciu aplikacji przed testem, ale ta wyklucza T-02 z P-829.

### P2-2. „Pozostałe kroki są takie same jak w instrukcji 1161”, a T-02 zmienił sens bez znacznika

- **Miejsce:** blok „Co nowego”, `:148`; T-02.
- **Cytat:** „Pozostałe kroki są takie same jak w instrukcji 1161.”
- **Dowód:** uwaga T-02 zmieniła się z bezwarunkowego „nie dotyczy przy pierwszej instalacji” na „zrób ten krok, jeśli jest 1161 z projektami” (różnica 16 w §1, P-829). T-01 i T-16 zmieniły brzmienie. Osoba po teście 1161, która przegląda tylko kroki ze znacznikiem, przeoczy, że T-02 teraz się wykonuje.
- **Proponowane brzmienie:**
  > Pozostałe kroki są takie same jak w 1161, poza T-02 (teraz robisz go też przy aktualizacji z 1161 z danymi) i nazwą „Autoblokada” (przygotowanie, T-16). Poza zegarkiem kod aplikacji się nie zmienił.

  Do tego przy T-02 znacznik `nowe: true` albo osobny „zmienione w 1171”.

### P3-1. Kontrast znacznika „nowe w 1171” w jasnym motywie 2,83:1

- **Miejsce:** `.chip.nowe` (`:72`).
- **Dowód:** Playwright, motyw jasny: tekst `rgb(243,241,236)` na `rgb(192,132,37)`, czyli 2,83:1, poniżej 4,5:1 dla małego tekstu. W ciemnym 6,41:1.
- **Propozycja:** w jasnym motywie ciemny tekst (`#221D1A`, jak w ciemnym) albo ciemniejsze tło znacznika.

### P3-2. Mieszane „build” i „kompilacja”

- **Miejsce:** pole „Numer buildu, który testujesz (z TestFlight)” (`:137`); T-02: „do kompilacji 1171” i dwie linie niżej „build 1171”; pkt 3: „Liczba w nawiasie to numer kompilacji”.
- **Propozycja:** jedno słowo w nowych tekstach, albo raz w pkt 3: „numer kompilacji (w tej instrukcji: build)”.

### P3-3. „Przyciskiem instalacji albo uaktualnienia” jest dla osoby nietechnicznej mgliste

- **Miejsce:** `:161`, `:164`, T-02.
- **Dowód:** polskich przycisków TestFlight nie potwierdzono (fakty: tylko „Wersja”, „Poprzednie kompilacje”, „Uaktualnienia automatyczne”), więc „[sprawdź na ekranie]” jest uzasadnione.
- **Propozycja:** „główny przycisk obok nazwy Oczka (po angielsku »Install« albo »Update«) [sprawdź na ekranie]”. Opis miejsca pomaga bardziej niż opis funkcji.

### P3-4. „Wygląd na zegarku → zaznacz »nie«” miesza wadę wyglądu z wadą działania

- **Miejsce:** blok „Co nowego”, `:145`.
- **Cytat:** „zaznacz »nie« przy kroku, w którym to widzisz, i dołącz zrzut”.
- **Propozycja:** „…zaznacz »nie« i zacznij uwagę od »wygląd:«…”. Wtedy koordynator odróżni ucięty tekst od braku synchronizacji w T-105–T-107.

### P3-5. W trybie krótkim odesłanie do podejść nie ma odpowiednika

- **Miejsce:** `:147`.
- **Cytat:** „T-04 jest w podejściu 1, sekcja 14 w podejściu 2.”
- **Propozycja:** dopisać „(w trybie krótkim oba są na jednej liście)”.

### P3-6. Brak wskazówki dla T-105–T-107, gdy T-04 = „nie”

- **Miejsce:** „Kroki, które mogą nie dać się zrobić” (`:282–289`) / sekcja 14.
- **Dowód:** blok „Co nowego” zakłada możliwy brak instalacji („powinno dać się”), a T-04 każe wtedy zaznaczyć „nie”. Sekcja 14 nie mówi, co dalej.
- **Propozycja:** do listy dopisać:
  > T-105–T-107: jeśli w T-04 Oczka nie dało się zainstalować, zaznacz „Pomiń” z uwagą „brak Oczka na zegarku (T-04)”.

### P3-7. Lista źródłowa nadal mówi „Automatyczna blokada”

- **Miejsce:** `docs/wydanie/test-urzadzenia-build5.md:46` (poza recenzowanym plikiem).
- **Propozycja:** ujednolicić przy najbliższej zmianie listy, żeby kolejna instrukcja z niej nie cofnęła poprawki.

## 6. Czego nie sprawdziłem

- Polskich ekranów TestFlight: co dokładnie pokazuje „Wersja” i jak brzmią polskie przyciski (P1-1, P3-3). Opieram się na angielskiej pomocy Apple.
- Wyglądu i działania aplikacji Watch w iOS właściciela przy zegarku z watchOS 10.6.2. Strona 109023 opisuje bieżącą wersję.
- Działania aplikacji zegarka na watchOS 10.6.2 (tylko urządzenie).
- Strony po publikacji jako artefakt w Safari na iPhonie: Playwright to chromium z czcionką zastępczą.
- Jak daleko doszedł test 1161 u właściciela (P2-1).
- Wartości „1 minuta” w Autoblokadzie (strona Apple jej nie wymienia; bez zmian od 1161).

## 7. Werdykt

**P1: 2, P2: 2, P3: 7.** Z dwoma P1 strona nie jest gotowa do publikacji. Obie poprawki dotyczą tylko bloku „Instalacja 1171 z TestFlight” i uwag T-01/T-02, bez zmiany liczby kroków. Pozostałe różnice 1161 → 1171 są uzasadnione kodem na 104f8764 (watchOS 10.0, potwierdzone też kontrolą `.ipa` 1171), źródłami Apple (Autoblokada, „Instaluj”) albo wpisami P-819, P-822, P-827–P-829. Liczba kroków (121; 77/28/16; krótki 13), klucz localStorage i domyślny build są poprawne. Strona działa bez błędów JS i bez poziomego przewijania przy 390 px.

## 8. Poprawki po recenzji (sesja BV, 2026-11-15)

Teza P1-1 sprawdzona u źródła przed poprawką: developer.apple.com/testflight/testers/ (surowy HTML, 2026-11-15): „When viewing an app in TestFlight, you'll see the latest available build by default.”; „If you’re a returning tester, tap Update or Open.”

| Znalezisko | Stan | Co zmieniono |
|---|---|---|
| P1-1 | poprawione | Instalacja pkt 4–6 i iPad: zainstalowaną kompilację rozpoznaje się po przycisku „Otwórz” („Open”) [sprawdź na ekranie]; „Wersja” opisana jako najnowsza dostępna; T-01 uwaga; P-828 uzupełniony. |
| P1-2 | poprawione | Instalacja pkt 3: zrzut „Projekty” i licznika przed instalacją, gdy są dane; T-02 uwaga: przypadek samoczynnej aktualizacji. |
| P2-1 | poprawione | T-01 uwaga (do którego kroku 1161 i czy był T-72); T-70 uwaga (dni z 1161, Pro z 1161 → „Pomiń”). |
| P2-2 | poprawione | Blok „Co nowego”: punkt o T-02 i lista zmienionych kroków; znacznik „zmienione w 1171” przy T-01, T-02, T-16, T-70. |
| P3-1 | poprawione | Tekst znacznika #221D1A na #C08425 (≈ 5,3:1, zmierzone w Playwright: rgb(34,29,26) na rgb(192,132,37)). |
| P3-2 | poprawione częściowo | „numer kompilacji, w tej instrukcji: build” w pkt 4; pozostałe „build” bez zmian (pole i treść kroków z 1161). |
| P3-3 | poprawione | „główny przycisk obok nazwy Oczka”. |
| P3-4 | poprawione | „zacznij uwagę od »wygląd:«”. |
| P3-5 | poprawione | „(w trybie krótkim oba są na jednej liście)”. |
| P3-6 | poprawione | Lista „Kroki, które mogą nie dać się zrobić” i wstęp sekcji 14: T-105–T-107 „Pomiń”, gdy T-04 = brak Oczka. |
| P3-7 | poprawione | `docs/wydanie/test-urzadzenia-build5.md:46` → „Autoblokada”. |

Po poprawkach (Playwright, 390 px): 121 kroków (77 / 28 / 16, tryb krótki 13), 0 błędów JS, `scrollWidth` 390.
