# E0 Rozpoznanie (rola 12-niezawodnosc, build, wejście wczesne E0–E1 według P-005) · 2026-10-22 · STOP E0
Prompt: `prompts@97ec212`, `12-niezawodnosc --tryb build`, moduły incydent-i-poprawka, pakiety-tresci, ratowanie-danych, widocznosc-awarii (60 828 znaków; prompt poza repo). Kopie tekstowe źródeł z dnia pracy: `oczko-warsztat/12-niezawodnosc/2026-10-22-build/zrodla/`.

## 1. Środowisko
| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux x86_64 (kontener w chmurze, `CLAUDE_CODE_REMOTE=true`), Node v22.22.0, gałąź `claude/jolly-thompson-paz6d8` = `origin` (a474f2e) |
| GitHub | push na gałąź roboczą przez proxy; `oczko-warsztat` dołączone (push, `main`, P-010) |
| Xcode, symulator iOS | brak (Linux). Testy natywne tylko w CI na runnerze macOS (ADR-0014) |
| Sieć | działa: 17 stron źródłowych pobranych `curl` 2026-10-22 |
| Repo | publiczne (`CLAUDE.md`): dane od użytkowników i pliki baz nigdy do repo |
| Konfiguracja wydań | brak `eas.json`; `app.json` bez `updates` i `runtimeVersion`; brak `expo-updates` w `package.json` i w ADR-0016. Workflowy `.github/workflows/` należą do poprzedniej wersji (P-008, potok projektują 07 i 10) |
| Strategia 07 (`docs/jakosc/strategia.md`) | jeszcze nie istnieje (P-005: 12 przed 07); ryzyka i lista „tylko telefon” idą do 07 w przekazaniu |

Do ustalenia z właścicielem (pytanie Q1 niżej): Mac z Xcode. Ustalone z rejestru: konto App Store Connect z rekordem aplikacji i TestFlight (`CLAUDE.md`); telefonu testowego nie ma w procesie, właściciel ma iPada i nie testuje ręcznie (P-041); Android poza zakresem (aplikacja na iPhone'a i zegarek, `docs/brd/odkrywanie.md:9`); EAS nie jest używany (ADR-0014: buildy na GitHub Actions).

## 2. Wejście: założenia z artefaktów poprzednich ról
| Założenie (rola, miejsce) | Stan po sprawdzeniu |
|---|---|
| Pakietów treści brak (05, `e0-rozpoznanie.md:52`, `e4-przekazanie.md`) | potwierdzone: kontrakt bez pakietów; moduł `pakiety-tresci` nie dotyczy |
| Polityka błędów: `integrity_check` przy każdym starcie (05, `e3-…md` §2) | **hipoteza**: koszt na bazie 3-letniej (ok. 18 MB) niezmierzony; do decyzji w ADR strażnika (opcje: pełne sprawdzenie, `quick_check`, sprawdzenie dopiero po błędzie `SQLITE_CORRUPT`/`SQLITE_NOTADB`) i pomiaru w E2 |
| „Eksport kopii surowego pliku przez `VACUUM INTO`” przy uszkodzonej bazie (05, `e3-…md` §2) | doprecyzowanie, nie sprzeczność: przy uszkodzonej bazie `VACUUM INTO` może się nie udać; wtedy idzie surowa kopia trzech plików zrobiona przed otwarciem bazy (moduł `ratowanie-danych`, pkt 2). Rozstrzygnie ADR kopii ratunkowej |
| Kopia przed migracją z przebudową usuwana „po udanym starcie” (05, `dane.md`) | zgodne z wzorcem roli (NIE-14), jeśli „udany start” = kamień milowy strażnika; zapis w ADR strażnika |
| Intencja +1 działa w procesie aplikacji uruchomionej bez otwierania (05, ADR-0008) | potwierdzone jako fakt z rejestru 05; **nowe ryzyko** dla strażnika: start z tła (intencja, cicha notyfikacja CloudKit, WatchConnectivity) nie dochodzi do pierwszego ekranu, więc strażnik liczony przy każdym starcie procesu dałby fałszywy tryb awaryjny. Czy React Native montuje korzeń interfejsu przy starcie w tle: [DO USTALENIA, test na symulatorze w E2] |
| Kopia urządzenia zawiera `-wal`, checkpoint przy przejściu w tło (05, `dane.md`) | przyjęte; czy system robi checkpoint przed kopią, zostaje [DO USTALENIA] roli 05 |
| Raportowanie awarii decyduje 12 (05, ADR-0016, `e3-…md` §2) | przyjęte: ADR w E1 |
| Weryfikacja tylko automatem (P-041) | **sprzeczne z kontraktem roli 12**, który zakłada ćwiczenia na telefonie (E3). Pytanie Q2 |

## 3. Ścieżki utraty dostępu do danych
Poziomy jak w szablonie roli (P0 = utrata, zepsucie albo odcięcie od danych). „Zabezpieczenie obecne” = to, co już jest w ADR i `dane.md` roli 05; kod nowej wersji jeszcze nie istnieje.

| Ścieżka | Realność | Skutek dla użytkownika | Zabezpieczenie obecne | Brakuje (do E1/E2) |
|---|---|---|---|---|
| Awaria przy starcie po aktualizacji (błąd JS, natywny, migracja) | realna | P0: pętla awarii, brak dostępu do lat danych | migracja w transakcji, kopia `VACUUM INTO` przed przebudową (`dane.md`) | strażnik startu z kamieniem milowym, tryb awaryjny bez migracji z eksportem (ADR strażnika) |
| Awaria przy starcie bez aktualizacji (np. dane, których kod nie obsługuje) | realna | P0 jw. | brak | jw. |
| Migracja przerwana w połowie (zabicie, brak miejsca) | brzegowa | baza zostaje w starej wersji (ROLLBACK) | jedna transakcja, 12 kroków (`dane.md`) | test zabicia w trakcie (07); strażnik, jeśli migracja pada przy każdym starcie |
| Baza nowsza niż aplikacja (powrót z TestFlight, przywrócenie kopii z nowszego telefonu na starszą wersję) | brzegowa | P0: odcięcie od danych do aktualizacji | odmowa otwarcia, „Zaktualizuj aplikację” (`dane.md`) | w trybie odmowy dostępny eksport bez migracji (ADR strażnika) |
| Uszkodzona baza (nośnik, podmiana plików) | brzegowa | P0 | ekran „Dane wymagają naprawy” (`e3-…md` §2), import archiwum | surowa kopia trzech plików przed otwarciem, przekazanie kompletu deweloperowi, naprawa `.recover` tylko na kopii (ADR kopii ratunkowej); ekran: 04 |
| Pełny dysk | realna | zapis się nie udaje | błąd zapisu nigdy cicho, `wolneMiejsce` przed eksportem (`e3-…md` §2, ADR-0004) | kopia ratunkowa też potrzebuje miejsca: komunikat zamiast usuwania czegokolwiek |
| Zły pakiet treści | nie dotyczy | — | brak pakietów | — |
| Zła aktualizacja OTA | zależy od ADR OTA | P0, gdy OTA zmieni format danych | brak OTA w ADR-0016 | ADR OTA (rekomendacja: bez OTA w wersji 1) |
| Zła binarka w App Store | realna | P0 dla części użytkowników | brak | runbook: wstrzymanie wydania stopniowego, nowy build, przyspieszona recenzja (moduł `incydent-i-poprawka`) |
| Przywrócenie na nowym telefonie | realna | brak danych albo stara migawka | kopia urządzenia z `-wal` + checkpoint w tle; iCloud (ADR-0005); archiwum `.oczko` (ADR-0004) | test „przywrócenie z kopii na czystej instalacji” (E3, symulator) |
| Start z tła (intencja +1, cicha notyfikacja iCloud, zegarek) | realna | fałszywy tryb awaryjny po kilku startach w tle | brak | strażnik wywoływany tylko przy starcie interfejsu na pierwszym planie (ADR strażnika) |
| Ciche przejście na pustą bazę po błędzie otwarcia | realna (w starej wersji) | użytkownik widzi pustą aplikację, nowe dane giną po restarcie | nowa architektura nie ma emulatora, ale brak kontroli | kontrola w CI: brak bazy w pamięci i `:memory:` w `src/` poza testami (do 07) |
| Zależności zewnętrzne: wygasłe członkostwo Apple Developer | realna | aplikacja znika ze sklepu; wydanie stopniowe staje | brak | runbook: data odnowienia jako krok właściciela |
| Zależności zewnętrzne: zmiana obrazu runnera macOS | realna (poprzednia wersja: „React Native requires XCode >= 16.1. Found 15.4.”) | poprawka nie zbuduje się w dniu incydentu | ADR-0014 bez przypięcia obrazu | runbook + przypięta wersja runnera i Xcode (do 07/10) |
| Pliki od użytkowników (baza, raport awarii) | realna przy incydencie | dane osobowe | brak | runbook: tylko scratchpad, nigdy repo (także prywatne), usunięcie za zgodą właściciela |

Lekcje z poprzedniej wersji, sprawdzone w kodzie 2026-10-22 (materiał, nie dowód działania nowej): (1) `src/core/project-context.tsx:100-105` łapie każdy błąd `openOczkoDatabase()` i przechodzi na `createInMemoryDatabase()` bez komunikatu; (2) `setRecovery` (`src/core/backup-service.ts:179`) nie ma wywołań w kodzie produkcyjnym (grep: tylko definicja i lokalny `setRecoveryState`); (3) kopie przez `require('expo-file-system')` (`backup-service.ts:411-418`), a `package.json` nie ma `expo-file-system` jako zależności bezpośredniej. Wniosek dla nowej wersji: każda ścieżka ratunkowa potrzebuje testu, który ją wywołuje z kodu produkcyjnego, nie tylko z testu.

## 4. Źródła sygnału dostępne właścicielowi (odczyt 2026-10-22)
| Źródło | Co pokazuje | Czego wymaga | Koszt | Źródło i cytat |
|---|---|---|---|---|
| TestFlight w App Store Connect (przeglądarka) | awarie testerów z raportem i komentarzem | przeglądarka (też Windows), tester TestFlight | 0 zł | help/app-store-connect/…/view-tester-feedback: „Crash reports are available for download for 120 days.” |
| App Store Connect API: `betaFeedbackCrashSubmissions` | te same raporty TestFlight do pobrania skryptem | klucz API (sekret, ADR-0014) | 0 zł | dokumentacja API: „A crash report submitted by a TestFlight beta tester, linked to the build, bundle, and tester that produced it.” |
| App Store Connect API: `diagnosticSignatures` | wzorce problemów z App Store | klucz API | 0 zł | opis: „A unique pattern identifying a recurring crash, hang, or disk-write exception”; dopuszczalne `diagnosticType` w dokumentacji: `DISK_WRITES`, `HANGS`, `LAUNCHES` — czy są awarie: [DO USTALENIA, sprzeczność opisu z listą wartości] |
| Xcode Organizer | awarie z TestFlight i App Store, metryki | Mac z Xcode | 0 zł | acquiring-crash-reports…: „crash reports from customers who share diagnostic and usage information”; „TestFlight users of your app automatically share crash reports with you, regardless of the device settings” |
| Raport z urządzenia użytkownika | każdy typ awarii | użytkownik wysyła plik sam | 0 zł | tamże: „ask the customer to e-mail you the crash report from their device” |
| MetricKit (`MXCrashDiagnostic`) | diagnostyka na urządzeniu | moduł Swift (pierwszej strony w Expo brak); zostaje na urządzeniu, dopóki aplikacja jej nie wyśle | 0 zł; czas agenta | developer.apple.com/documentation/metrickit: „Diagnostic reports arrive immediately in iOS 15 and later” |
| „Zgłoś problem” (F-57) z tabelą `blad` | obsłużone błędy, po podglądzie i z inicjatywy użytkownika | już w kontrakcie (F-57, BR-DAN-010) | 0 zł | `prywatnosc.md` (OP-25 do roli 10) |
| SDK zewnętrzne (Sentry Developer) | awarie JS i natywne na serwerze | konto, deklaracja „Crash Data” w App Privacy | 0 zł do limitu | sentry.io/pricing: „Free $0 Limited to one user”, „Error Monitoring 5k errors”; Apple app-privacy-details: „Diagnostics Crash Data Such as crash logs” |
| Android vitals | — | — | — | nie dotyczy (brak Androida) |

Symbole: „Crash reports automatically contain identifiable symbol information if you include symbol information when submitting a build to the App Store” (acquiring-crash-reports…). Build idzie przez `xcodebuild archive` na GitHub Actions (ADR-0014), więc dSYM i mapy źródeł Hermesa trzeba zachować w potoku: [DO USTALENIA dla 07/10, zapis w runbooku: numer buildu → SHA → miejsce symboli].

## 5. Fakty platformy na dziś (różnice wobec tabel modułów z 18.10.2026)
- Wydanie stopniowe App Store: dziś „you may pause the release for up to 30 days, with no limit on the number of pauses” (moduł miał „for a total of 30 days”); 7 dni (1%, 2%, 5%, 10%, 20%, 50%, 100%); „can be manually downloaded from the App Store by anyone at any time”.
- Bez zmian: wersja z błędem „you must submit an app update”, a gdy się nie da, „you must remove the app from the App Store”; expo-updates nie łapie błędu „If more than 10 seconds have elapsed between your app's first render”; plan Free EAS Update „limited to its included monthly active users” (1,000 MAUs); WAL: „If a database file is separated from its WAL file, then transactions that were previously committed to the database might be lost”; `VACUUM INTO`: „a consistent snapshot of the original database”; Expo SQLite ma `backupDatabaseAsync({ destDatabase, destDatabaseName, sourceDatabase, sourceDatabaseName })`.

## 6. Stosowalność modułów
| Moduł | Stosuję? | Powód |
|---|---|---|
| `ratowanie-danych` | tak | dane użytkownika tylko na urządzeniu (ADR-0001), WAL, migracje |
| `widocznosc-awarii` | tak | zawsze; NFR-PRY-001 „Data Not Collected” zawęża opcje SDK |
| `incydent-i-poprawka` | tak (runbook w E3) | wydania w App Store, decyzja OTA |
| `pakiety-tresci` | nie | brak pakietów treści (05: `e4-przekazanie.md`, „moduł `pakiety-tresci` nie dotyczy”) |

## 7. ADR do podjęcia w E1 (numeracja wspólna z 05: od 0018)
| ADR | Obszar | Opcje do porównania |
|---|---|---|
| 0018 | Źródło sygnału o awariach | (a) bez SDK: TestFlight w przeglądarce + F-57; (b) (a) + MetricKit przez moduł Swift zapisujący diagnostykę lokalnie do „Zgłoś problem”; (c) (a) + odczyt App Store Connect API skryptem; (d) SDK zewnętrzne dobrowolne |
| 0019 | Strażnik startu i tryb awaryjny | (a) strażnik z kamieniem milowym + ekran awaryjny (eksport bez migracji, „spróbuj normalnie”, zgłoszenie); (b) strażnik, który pomija migrację i od razu proponuje eksport; zapis stanu: plik `expo-file-system` albo `kv-store`; próg; sprawdzanie integralności przy starcie |
| 0020 | Kopia ratunkowa i przywracanie | surowa kopia trzech plików przed otwarciem bazy; `VACUUM INTO`; przekazanie kompletu: trzy udostępnienia / ZIP / katalog w Plikach; czas trzymania kopii; przywrócenie przez `backupDatabaseAsync` |
| 0021 | Aktualizacje OTA | (a) expo-updates + EAS Update Free (1,000 MAU); (b) expo-updates + własny serwer; (c) bez OTA, poprawki nowym buildem |
| (decyzja z 10) | Wydanie stopniowe | (a) zawsze; (b) tylko przy zmianie danych lub zależności natywnych; (c) nigdy |
Progi do decyzji właściciela w E1: liczba nieudanych startów strażnika (propozycja 2), warunek wstrzymania wydania w App Store, kiedy właściciel patrzy na źródła sygnału.

## Pytania do właściciela (STOP E0)
**Q1. Czy masz Maca z Xcode?** Od tego zależy, czy po premierze widzisz awarie z App Store w Xcode Organizerze, czy tylko przez TestFlight, „Zgłoś problem” i ewentualnie skrypt z App Store Connect API. (Odpowiedź tak / nie; bez rekomendacji, to fakt.)

**Q2. Ćwiczenia z E3 wobec P-041 (bez testów ręcznych):**
- (a) **Tylko automat:** przywrócenie z kopii na czystej instalacji i wymuszona pętla awarii na symulatorze w CI. Ćwiczenie sygnału (czy awaria z buildu dociera do App Store Connect i ma symbole) zostaje ryzykiem szczątkowym: dowiesz się przy pierwszej prawdziwej awarii.
- (b) **Automat + jednorazowy krok ok. 10 min na Twoim iPadzie** przy pierwszym buildzie TestFlight: stuknięcie ukrytego przełącznika awarii w buildzie testowym, potem ja sprawdzam raport w App Store Connect. Wyjątek nazwany od P-041, jednorazowy. **Rekomendacja:** bez tego kroku pierwszy test, czy raporty są czytelne, wypada w trakcie prawdziwego incydentu.

**Q3. Plan E1 przyjmujesz w kształcie z sekcji 7 (4 ADR + decyzja o wydaniu stopniowym razem z rolą 10)?** (a) tak; (b) zmiany.

## Plan i szacunek czasu
| Etap | Agent | Oczekiwanie | Właściciel |
|---|---|---|---|
| E1 (ta sesja): ADR 0018–0021, progi | ok. 1,5 h | — | ok. 15 min (decyzje) |
| E2 (po 08): testy czerwone, strażnik, kopia, sprawdzenie, przywrócenie, ekran awaryjny | ok. 4–5 h | CI macOS (symulator), ekran od 04 | ok. 10 min |
| E3 (po 08): ćwiczenia, runbook, przekazanie | ok. 2 h | build TestFlight w CI | 0 min (Q2a) albo ok. 10 min (Q2b) |
Po STOP E1 ta sesja kończy pracę (P-005) i aktualizuje `docs/sztafeta.md`: następny krok 06-tresci build.

## Odpowiedzi właściciela (P-079, 2026-10-22)
Q1: brak Maca. Q2: (a) tylko automat. Q3: prośba o więcej informacji — niżej.

## Q3 rozpisane: co rozstrzyga E1
Każdy punkt: problem w jednym zdaniu, opcje, rekomendacja. Decyzje zapadną w E1 (STOP E1); teraz właściciel przyjmuje tylko listę tematów.

**1. ADR-0018 — skąd dowiesz się o awarii.** Bez Maca nie widzisz awarii z App Store w Xcode Organizerze.
- (a) Bez dodatków: TestFlight w przeglądarce (tylko testerzy) + „Zgłoś problem” z listą obsłużonych błędów. 0 h kodu. Awarie z App Store widzisz dopiero w recenzjach albo zgłoszeniach.
- (b) (a) + MetricKit: iOS sam przekazuje aplikacji raport po awarii, aplikacja trzyma go na telefonie i dołącza do „Zgłoś problem” po podglądzie. Nic nie wysyła sama, etykieta „Data Not Collected” bez zmian. Ok. 2–3 h agenta (moduł Swift). **Kierunek rekomendacji po Q1.**
- (c) (a) + skrypt czytający App Store Connect API. Wymaga klucza API poza chronionym środowiskiem albo Twojego zatwierdzenia przy każdym uruchomieniu; czy API w ogóle zwraca awarie z App Store, nie wiadomo (sprzeczność w dokumentacji Apple).
- (d) SDK zewnętrzne (np. Sentry, darmowe do 5k błędów): pełny obraz awarii, ale dane wychodzą z telefonu, więc etykieta App Privacy zmienia się z „Data Not Collected” (NFR-PRY-001) i potrzebna jest zgoda w aplikacji.

**2. ADR-0019 — strażnik startu i tryb awaryjny.** Przykład: aktualizacja ma błąd i aplikacja zamyka się przy każdym starcie; osoba ma w niej 3 lata projektów.
- (a) Po N nieudanych startach z rzędu aplikacja otwiera prosty ekran awaryjny: „Zapisz kopię danych”, „Spróbuj normalnie”, „Zgłoś problem”. Nie uruchamia migracji, niczego nie kasuje. **Rekomendacja.**
- (b) Bez ekranu: po N nieudanych startach aplikacja tylko pomija ryzykowny krok i od razu proponuje eksport. Mniej kodu, mniej wyjaśnienia dla użytkownika.
- Próg N do Twojej decyzji: propozycja **2** (jedno zamknięcie bywa przypadkiem, dwa z rzędu przed pierwszym ekranem rzadko).
- Technicznie w tym samym ADR: start w tle (ekran blokady, zegarek, iCloud) nie liczy się jako nieudany; czy sprawdzać integralność bazy przy każdym starcie (koszt czasu) czy dopiero po błędzie.
- Ekran awaryjny projektuje rola 04 (dziś go nie ma).

**3. ADR-0020 — kopia ratunkowa i przywracanie.** Przykład: baza na telefonie się uszkodziła.
- Zawsze (zasada, nie opcja): zanim cokolwiek dotknie bazy w trybie awaryjnym, aplikacja kopiuje ją w całości (3 pliki); naprawa tylko na kopii; oryginał nietknięty.
- Do wyboru: jak osoba przekaże Ci uszkodzoną bazę — (a) trzy pliki po kolei w arkuszu udostępniania; (b) jeden plik ZIP (ten sam kod co archiwum `.oczko`, ADR-0004 — **kierunek rekomendacji**); (c) folder widoczny w aplikacji Pliki.
- Do wyboru: jak długo trzymać kopie ratunkowe — do pierwszego udanego startu, 30 dni (jak „Ostatnio usunięte”) albo do potwierdzenia przez użytkownika. Kierunek: 30 dni.
- Naprawę robi agent na kopii, na komputerze, poza repo; o zwrocie danych decydujesz Ty z tą osobą.

**4. ADR-0021 — poprawki bez App Store (OTA).** Czy błąd w kodzie JS da się poprawić „w locie”, bez nowej wersji w sklepie.
- (a) expo-updates + EAS Update (darmowe do 1 000 aktywnych użytkowników miesięcznie, potem plan płatny albo brak aktualizacji dla nadmiaru): poprawka w minuty, ale konto Expo, ryzyko wytycznej 2.5.2 i ryzyko, że wycofanie złej poprawki zepsuje dane.
- (b) expo-updates + własny serwer: bez limitu, ale serwer do utrzymania (łamie „koszt stały 0 zł” albo wymaga darmowego hostingu, niesprawdzone).
- (c) **Bez OTA:** każda poprawka to nowy build (CI na GitHub, bez limitu) i recenzja Apple (dziś: 50% w 24 h, 90% w 48 h, przy krytycznym błędzie można prosić o przyspieszenie). **Kierunek rekomendacji:** najprostsze, zero usług, strażnik z punktu 2 chroni dostęp do danych w czasie oczekiwania.

**5. Wydanie stopniowe (decyzja razem z rolą 10).** Apple daje nową wersję przez 7 dni coraz większej części osób z automatycznymi aktualizacjami (1% → 100%); można je wstrzymać.
- (a) zawsze; (b) tylko gdy wersja zmienia dane albo części natywne; (c) nigdy.
- Kiedy wstrzymać: (i) każda potwierdzona awaria z utratą albo odcięciem od danych; (ii) „wyraźnie więcej awarii niż poprzednio” — bez Maca nie zobaczysz tych liczb, więc odpada.
- **Kierunek rekomendacji:** (a) zawsze + (i). Bez kosztu, a błąd trafia najpierw do 1–2% osób.

**6. Kiedy patrzysz na sygnały.** Nie norma, tylko Twój wybór, np. dzień wydania i trzy kolejne dni: TestFlight, recenzje, zgłoszenia „Zgłoś problem”. Agent przygotuje listę kontrolną w runbooku (E3).

Twój czas w E1: przeczytanie ADR i jedna odpowiedź w rodzaju „1b 2a próg 2 3b 30 dni 4c 5a”.
