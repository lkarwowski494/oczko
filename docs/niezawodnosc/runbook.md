# Runbook niezawodności Oczka (rola 12) · stan 2026-10-26
Dla kogo: właściciel, który pracuje sam, bez Maca i bez telefonu testowego (P-079); agent prowadzący incydent w trybie `12-niezawodnosc --tryb fix`. Decyzje: P-079, P-080, P-194; ADR-0018–0021.
Zasada: agent przygotowuje polecenie, skutek i ryzyko. Każdy krok zewnętrzny (sklep, build, wiadomość do użytkowników) wykonuje albo zatwierdza właściciel osobno (zasada roli 3). Konfiguracja niczego nie wysyła ani nie publikuje sama. Nie ma OTA (ADR-0021, P-080 (4c)).

## 1. Gdzie patrzeć
| Źródło | Co pokazuje | Dostęp | Kiedy |
|---|---|---|---|
| App Store Connect → TestFlight → opinie i awarie testerów | awarie z raportem i komentarzem testera; „Crash reports are available for download for 120 days” (developer.apple.com/help/app-store-connect/test-a-beta-version/view-tester-feedback, odczyt 2026-10-26) | przeglądarka, także Windows | przed premierą po każdym buildzie TestFlight |
| App Store Connect → aplikacja → oceny i recenzje | skargi użytkowników App Store | przeglądarka | dzień wydania i 3 kolejne dni (P-080 (6a)) |
| „Zgłoś problem” (F-57) od użytkownika | wpisy `blad` (kody, bez treści), liczności, wersja i build; z trybu awaryjnego archiwum `.oczko` albo ZIP surowej kopii | e-mail od użytkownika | gdy przyjdzie |
| Raport z urządzenia użytkownika | każdy typ awarii; użytkownik wysyła go sam z Ustawień iOS (Prywatność → Analityka i ulepszenia → Dane analityczne) | e-mail od użytkownika | na prośbę przy incydencie |
| Xcode Organizer | awarie z App Store | **brak** (wymaga Maca, P-079) | — |
| MetricKit na urządzeniu | diagnostyka awarii | **od 1.1** (P-194 Q4a) | — |

## 2. Poziomy i progi
| Poziom | Definicja | Reakcja | Źródło |
|---|---|---|---|
| P0 | utrata albo zepsucie danych, odcięcie od danych (pętla awarii przy starcie), prywatność, bezpieczeństwo, główny przepływ (liczenie) nie działa | wstrzymanie wydania stopniowego, poprawka nowym buildem z przyspieszoną recenzją | P-080 (5a), ADR-0021 |
| P1 | awaria funkcji pobocznej albo z obejściem | poprawka w następnym buildzie | wzorzec roli 12 |
| P2 | rzadki przypadek bez skutku dla danych | lista zadań | wzorzec roli 12 |
- **Wstrzymanie wydania w App Store:** każde potwierdzone P0 (P-080 (5a)). Apple nie podaje progu odsetka awarii, a bez Maca nie widać liczb z Organizera, więc nie ma progu procentowego (P-079).
- **Wydanie stopniowe:** zawsze (P-080 (5a)).
- **Tryb awaryjny:** 2 nieudane starty z rzędu (`PROG_NIEUDANYCH_STARTOW`, P-080, ADR-0019).
- **Kopie ratunkowe:** 30 dni, usuwane tylko po udanym starcie (`KOPIE_RATUNKOWE_DNI`, P-080, ADR-0020 (6)).
- **Czas reakcji:** nie ma normy. Właściciel patrzy na źródła w dniu wydania i przez 3 kolejne dni (P-080 (6a)).

## 3. Pierwsze kroki agenta przy incydencie
1. Zebrać: objaw, wersja i build, model i iOS, od kiedy, ile zgłoszeń, czy dotyczy danych (P0?). Pliki od użytkownika trafiają do scratchpadu sesji, **nigdy do repo**, także prywatnego (ADR-0020 (7)). W notatkach identyfikatory są maskowane.
2. Utworzyć plik incydentu w `oczko-warsztat/12-niezawodnosc/incydenty/<data>-<krótki-opis>.md`: oś czasu, poziom, hipotezy. Repo aplikacji jest publiczne, więc tam nie.
3. Ustalić build → SHA commitu (tag/przebieg „Jakość · iOS” i TestFlight w CI, ADR-0014) i napisać test odtwarzający, czerwony z właściwego powodu (zasada roli 6). Bez odtworzenia: STOP z hipotezami.
4. Przygotować do zgody właściciela: wstrzymanie wydania (§5), odpowiedź dla zgłaszających (§4), plan poprawki.
5. Gdy właściciel jest niedostępny, agent przygotowuje, ale niczego nie wykonuje.

## 4. Ratowanie danych użytkownika
**Instrukcja dla zgłaszającego** (tekst roboczy do zatwierdzenia przez 04 i do przekładu przez 09):
1. Jeśli Oczko pokazuje ekran „coś poszło nie tak” (tryb awaryjny), stuknij „Zapisz kopię danych” i wyślij plik e-mailem. Twoje dane zostają w aplikacji, nic nie jest usuwane.
2. Gdy pojawi się nowa wersja z poprawką, zaktualizuj aplikację i stuknij „Spróbuj normalnie”.
3. Nie usuwaj aplikacji — usunięcie kasuje dane i kopie na telefonie.

**Co przychodzi:**
- `*.oczko` — zwykłe archiwum (ADR-0004), baza w swojej wersji schematu. Gdy baza nie dała się otworzyć: ZIP surowej kopii z `oczko.db`, `oczko.db-wal`, `oczko.db-shm`, `dziennik-plus.jsonl` (jeśli był: +1 z ekranu blokady i zegarka niescalone do bazy, ADR-0008; M1-075) i `manifest.json` z SHA-256 każdego pliku (ADR-0020 (3), `src/niezawodnosc/kopie.ts`).

**Procedura u dewelopera** (tylko na kopii, w scratchpadzie):
1. Sprawdzić SHA-256 plików z manifestu (`sha256sum`).
2. Uruchomić `docs/niezawodnosc/narzedzia/naprawa-kopii.sh <katalog> oczko.db`. Robi `integrity_check` kopii, `.recover` do `odzyskana.db` i liczności tabel. Oryginały są kopiowane, nie zmieniane. Brak `sqlite3` w kontenerze: sqlite-tools z sqlite.org/download.html do scratchpadu.
3. Jeśli manifest wymienia `dziennik-plus.jsonl`: to +1 niescalone do bazy (ADR-0008), których nie ma w `odzyskana.db`. Przed zwrotem scalić je do `odzyskana.db` tym samym kodem co aplikacja: `scalDziennik` (`src/przypadki-uzycia/dziennik.ts`) z adapterem pliku `utworzDziennikNode` (`src/dane/dziennik.ts`) na porcie `node:sqlite` otwartym na `odzyskana.db`, jak w `tests/dane/dziennik.test.ts`; adapter skraca plik po scaleniu, więc podać mu kopię dziennika, nie plik z ZIP-a. Scalanie jest idempotentne po UUID (`src/przypadki-uzycia/dziennik.ts`), więc gdy telefon ma dalej swój dziennik, scalenie po przywróceniu nie podwoi stuknięć; linia już obecna w bazie jest pomijana, linia bez licznika w bazie albo nieczytelna trafia do `blad` (ADR-0008 (3)), a linia bez rodzica do poczekalni. Gotowego skryptu w `docs/niezawodnosc/narzedzia/` nie ma; bez tego kroku linie przepadają, gdy telefon nie ma już dziennika (nowa instalacja).
4. Porównać liczności z tym, co pamięta użytkownik. O zwrocie danych decyduje właściciel z użytkownikiem. Zwrot to plik `.oczko` z odzyskanej bazy do importu „Zastąp” (przywrócenie robi kopię „przed”, ADR-0020 (5′)).
5. Po zamknięciu sprawy pliki są usuwane za zgodą właściciela.

## 5. Tor poprawki (bez OTA, ADR-0021)
Każda poprawka to nowy build (P-080 (4c)). Kolejność:
1. Test odtwarzający czerwony → poprawka → `env -u NODE_PATH npm run verify` kod 0 → „Jakość · iOS” zielone (okno maszyn macOS: po północy albo rano, P-187).
2. **Krok właściciela — wstrzymanie wydania stopniowego** (App Store Connect → wersja → Phased Release → Pause). Skutek: kto ma wersję, zostaje z nią, a pobranie ręczne dalej jest możliwe. Cytaty: „You can pause your release for a total of 30 days”, „can be manually downloaded from the App Store by anyone at any time” (developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases, odczyt 2026-10-26).
3. **Krok właściciela — wysyłka buildu i przyspieszona recenzja.** Wniosek zawiera: wersję z błędem, skutek jednym zdaniem, numerowane kroki odtworzenia na obecnej wersji, zmianę i test. Apple: „include the steps to reproduce the bug on the current version of your app”; czas: „at least 50% of submissions in less than 24 hours and 90% in less than 48 hours” (developer.apple.com/distribute/app-review, odczyt 2026-10-26).
4. Wersji w sklepie nie da się cofnąć: „If the status of the version is Ready for Distribution and the version has a legal or usability issue, you must submit an app update” (…/manage-your-apps-availability/make-a-version-unavailable-for-download, odczyt 2026-10-26). P0 z utratą danych bez szybkiej poprawki: usunięcie ze sprzedaży, krok właściciela; nowi nie pobiorą, posiadacze zostają z wersją.
5. **Błędna wersja zapisała dane w nowym formacie:** tylko naprawa do przodu. Starsza wersja odrzuca bazę nowszą (`wersja_nowsza` → tryb awaryjny), bez zmiany danych.
6. **Komunikat dla użytkowników:** odpowiedź zgłaszającym i notatka o wersji (teksty: 04). Bez obiecywania terminu zależnego od recenzji.

## 6. Ćwiczenia
| Data | Build / commit | Ćwiczenie | Wynik | Dowód |
|---|---|---|---|---|
| 2026-10-26 | gałąź, Linux (P-187) | pętla awarii: 2 starty bez kamienia → trzeci awaryjny; „Zapisz kopię” → archiwum z licznościami bazy; surowa kopia = bajty oryginału; „Spróbuj normalnie” + kamień → normalny | zaliczone | `tests/niezawodnosc/cwiczenia.test.ts` (ćw. 1), w każdym `verify` |
| 2026-10-26 | jw. | zepsuty plik bazy (strona 2): start danych → `zapis` → ekran awaryjny; archiwum = brak; ZIP surowej kopii z SHA-256 zgodnymi z oryginałem | zaliczone (z kodem `zipSurowejKopii`; przycisk po łatce 08 N12-03) | ćw. 2 |
| 2026-10-26 | jw. | brak miejsca: ENOSPC przy surowej kopii → `brak_miejsca`, oryginał bez zmian; `SQLITE_FULL` przy `VACUUM INTO` → `brak_miejsca`, bez niepełnego pliku; ENOSPC przy zapisie stanu startu → start normalny, pętla nieliczona | zaliczone; ryzyko szczątkowe N12-09 | ćw. 3 |
| 2026-10-26 | jw. | przerwane przywracanie: SIGKILL w środku transakcji przenoszenia → baza bez zmian, `integrity_check` = ok, ponowne przywrócenie udane | zaliczone | ćw. 4 |
| 2026-10-26 | jw. | pomiar `integrity_check` na bazie 19,5 MB (100 000 zdarzeń) | 343 ms (`quick_check` 274 ms), Node 22 / SQLite 3.50.4 na Linuksie | `eksperymenty/integrity-pomiar.out` |
| (nocny przebieg CI) | build E2E | scenariusz E2E 09: pętla awarii na symulatorze, kopia z licznościami, SHA bazy | ostatnio zielony 40313538454 (08, 49b9f40) | `e2e/scenariusze/09-*.yaml` |

**Nie sprawdzono** (warunki dla roli 10, P-079 (Q2a)):
- raport prawdziwej awarii z buildu TestFlight w App Store Connect (czy jest, po jakim czasie, czy ma symbole i stos JS);
- czas `integrity_check` na telefonie;
- przywrócenie z kopii na czystej instalacji na symulatorze (scenariusz 08 robi eksport/import, nie plik ratunkowy);
- start w tle (intencja +1, zegarek) nie zwiększa licznika — test na symulatorze;
- `Directory.delete` w expo-file-system usuwa katalog z zawartością (sprzątanie surowych kopii) — w testach zastępnik usuwa rekurencyjnie;
- restart telefonu bez odblokowania (ochrona danych pliku);
- `docs/niezawodnosc/narzedzia/naprawa-kopii.sh` w tej sesji: brak `sqlite3` w kontenerze, a uruchomienie pobranej binarki zablokowało środowisko; sprawdzona jest tylko składnia (`bash -n`) i komunikat o braku `sqlite3` (kod 2). Wzorzec skryptu sprawdzono 18.10.2026 (moduł `ratowanie-danych`). Krok: pierwsza sesja z `sqlite3` uruchamia go na ZIP z ćwiczenia 2.

Następne ćwiczenia: po nałożeniu łatek N12-01–N12-04 (scenariusz E2E dla ZIP surowej kopii i kamienia po renderze, rola 07); przed wydaniem 1.0 przegląd tej tabeli przez 10.
