# 0019. Strażnik startu z kamieniem milowym i ekran trybu awaryjnego (eksport bez migracji, „spróbuj normalnie”, zgłoszenie)
Data: 2026-10-22 · Status: **przyjęta** (P-080 (2a)) · Rola: 12 (E1) · Zależy od: ADR-0001, ADR-0002, ADR-0004, ADR-0008, ADR-0020, ADR-0021, `dane.md` (polityka migracji), `e3-…md` §2

## Kontekst i problem
Gdy aktualizacja albo dane powodują awarię przy każdym starcie, użytkownik z latami projektów traci dostęp do nich. Bez OTA (ADR-0021) poprawka czeka na recenzję Apple („90% in less than 48 hours”, developer.apple.com/distribute/app-review, 2026-10-22). Aplikacja startuje też w tle bez ekranu: intencja +1 z ekranu blokady (ADR-0008), cicha notyfikacja CloudKit (ADR-0005), zegarek (ADR-0009). Poprzednia wersja przy błędzie otwarcia bazy przechodziła po cichu na bazę w pamięci (`src/core/project-context.tsx:100-105`, materiał P-004).

## Czynniki decyzji
Dostęp do danych mimo awarii · brak fałszywych alarmów (start w tle, zamknięcie przez użytkownika) · nic nie zmienia danych w trybie awaryjnym · logika testowalna w Node.

## Rozważane opcje
A. Strażnik z kamieniem milowym i ekranem trybu awaryjnego.
B. Strażnik bez ekranu: po progu pomija migrację i od razu otwiera arkusz eksportu.
C. Brak strażnika (aplikacja bez danych użytkownika) — nie dotyczy Oczka, wymieniona dla pełności.

## Decyzja
Opcja A (właściciel: „2a”, P-080).
- **Logika czysta** `src/niezawodnosc/start.ts` (wzorzec roli 12): `poczatekStartu`, `kamienMilowy`, `sprobujNormalnie`, `odczytajStan` z wektorami (pierwszy start, po udanym, jeden nieudany, drugi z rzędu, „spróbuj normalnie” z kamieniem i bez, start awaryjny nie zapisuje kamienia, uszkodzony zapis `'{"x":1}'`, `'nie-json'`, `null`).
- **Próg** `PROG_NIEUDANYCH_STARTOW` = **2** (P-080, interpretacja roli 12 do weta: właściciel wybrał 2a bez liczby, 2 to propozycja z rozpiski Q3).
- **Kamień milowy:** baza otwarta, migracje zakończone, pierwszy ekran (licznik albo lista) wyrenderowany. Ekran awaryjny nie jest kamieniem.
- **Kiedy liczyć:** tylko pierwsze przejście interfejsu na pierwszy plan w danym procesie (`AppState` = `active` przy zamontowanym korzeniu), nigdy przy starcie w tle (intencja, CloudKit, zegarek). Start w tle, który potem przechodzi na pierwszy plan, liczy się od tej chwili.
- **Zapis stanu:** mały plik JSON przez `expo-file-system` w katalogu danych aplikacji (nie `Caches`), zapisywany przed otwarciem bazy, niezależny od SQLite (działa przy uszkodzonej bazie). Odrzucone: `expo-sqlite/kv-store` (ten sam silnik co baza).
- **Tryb awaryjny:** nie uruchamia runnera migracji ani synchronizacji iCloud, nie zapisuje do bazy. Najpierw surowa kopia trzech plików (ADR-0020), potem ekran z trzema działaniami: „Zapisz kopię danych” (archiwum `.oczko` z bazy w jej obecnej wersji schematu przez `VACUUM INTO`, bez migracji; gdy baza się nie otwiera, ZIP surowej kopii, ADR-0020), „Spróbuj normalnie” (`sprobujNormalnie`), „Zgłoś problem” (F-57, ADR-0018). Wygląd i teksty: rola 04 (ekranu jeszcze nie ma — zgłoszenie), teksty w 35 językach: rola 09.
- **Ten sam ekran** obsługuje „baza nowsza niż aplikacja” i „dane wymagają naprawy” (`e3-…md` §2) z innym zdaniem nagłówka, żeby była jedna ścieżka ratunkowa do testowania.
- **Sprawdzenie integralności przy starcie** (doprecyzowanie `e3-…md` §2, do weta roli 05): domyślnie po błędzie `SQLITE_CORRUPT`/`SQLITE_NOTADB` przy otwarciu lub zapisie → tryb awaryjny z nagłówkiem „dane wymagają naprawy”; pełne `integrity_check` przy każdym starcie tylko, jeśli pomiar w E2 na bazie 3-letniej (symulator, CI) pokaże koszt, który właściciel przyjmie [DO USTALENIA E2].
- **Kopia przed migracją z przebudową** (`dane.md`) zostaje do kamienia milowego nowej wersji i dalej według ADR-0020.
- **Zakaz cichego zastępstwa:** żadnej bazy w pamięci ani pustej bazy po błędzie otwarcia.

### Konsekwencje
- Dobre: przy pętli awarii użytkownik po drugim starcie dostaje swoje dane w pliku; jedna ścieżka dla trzech sytuacji (pętla, uszkodzenie, baza nowsza).
- Złe: ok. 3 h agenta (logika, adapter, ekran, testy); ekran do zaprojektowania przez 04 i przetłumaczenia przez 09; start w tle wymaga testu na symulatorze, czy korzeń się montuje [DO USTALENIA E2].
- Prywatność: bez zmian (wszystko lokalnie). Koszt: 0 zł.

### Potwierdzenie
- Testy w Node (E2, czerwone przed kodem): wektory logiki z sekcji „Decyzja”.
- Test adaptera: zapis stanu przed otwarciem bazy (kolejność wywołań w atrapie); uszkodzony plik stanu = stan początkowy.
- Test na symulatorze (CI, P-079): wymuszona awaria przed kamieniem milowym dwa razy (przełącznik tylko w konfiguracji testowej, nieobecny w buildzie wydania — kontrola w CI) → trzeci start pokazuje ekran awaryjny; „Zapisz kopię danych” daje archiwum z licznościami jak w bazie; oryginał bazy ma ten sam SHA-256 przed i po.
- Test startu w tle (symulator): uruchomienie intencji +1 bez otwierania aplikacji nie zwiększa licznika nieudanych startów.
- Kontrola w CI: brak `createInMemoryDatabase`, `:memory:` i otwierania pustej bazy po błędzie w `src/` poza testami.

## Uzupełnienie 2026-10-26 (rola 12 E2–E3, P-194; decyzja A bez zmian)
- **Kamień milowy po narysowaniu** (P-194 Q1a, N12-01): zapis w efekcie po zatwierdzeniu renderu licznika, nie przed nim; test `tests/akceptacja/ekrany/niezawodnosc-kamien.test.tsx`, łatka dla 08 w `oczko-warsztat/12-niezawodnosc/2026-10-26-build-e2/latki/`.
- **Wyjście do tła przed kamieniem ≠ awaria; etap startu w zgłoszeniu** (P-271, P-273; jak Trening L-029; 08 partia 6, do przeglądu 12/05): AppState „background” w starcie normalnym przed kamieniem zeruje licznik (`wyjscieDoTla`; start awaryjny i wymuszona awaria E2E bez nasłuchu). Świeża instalacja bez osobnej reguły (P-273 B): jeden przerwany start i tak nie daje trybu awaryjnego (próg liczy poprzednie starty). Etap ostatniego startu normalnego (`poczatek`/`kontener`/`kamien`, ms) w pliku obok stanu startu, linia `boot_phase` w „Zgłoś problem”. Testy: `tests/niezawodnosc/l029-*.test.ts`; urządzenie: U9.
- **Okno przed startem JS** (P-177, P-194 Q5a, N12-10): bez znacznika natywnego. Awaria przed zapisem stanu zdarza się tak samo w trybie awaryjnym, więc licznik nie przywróci dostępu. Kontrola: `tests/niezawodnosc/okno-przed-startem.test.ts` (brak I/O przy imporcie modułów).
- **Integralność przy starcie** ([DO USTALENIA E2] wyżej): pomiar `docs/niezawodnosc/eksperymenty/integrity-pomiar.out`. Baza 19,5 MB (100 000 zdarzeń): `integrity_check` 343 ms, `quick_check` 274 ms na Linuksie (Node 22, SQLite 3.50.4); telefon [DO USTALENIA]. Domyślne zostaje: sprawdzenie dopiero po błędzie, bez kosztu każdego startu (NFR-PIE-001). Ćwiczenie 2 (`tests/niezawodnosc/cwiczenia.test.ts`) pokazało, że uszkodzenie części stron przechodzi przez start i wychodzi dopiero przy odczycie tabeli — ryzyko szczątkowe w runbooku.

## Uzupełnienie 2026-11-02 (rola 12 fix, M1-audytor-generalny-012 / 12-niezawodnosc-002, NIE-04; DEC-17 b, P-393; decyzja A bez zmian)
- **Wyjątek nazwany: zawieszenie przed kamieniem + tło nie daje trybu awaryjnego.** Start, którego obietnica nigdy się nie rozstrzyga (pusta plansza), a osoba wychodzi do tła, kończy się `wyjscieDoTla` (P-273) — licznik zerowany, więc pętla „zawieszenie → tło” nie dochodzi do progu. Strażnik celowo bez zmian (wybór b, nie a). Test charakteryzujący: `tests/niezawodnosc/m1-012-zawieszenie-startu.test.ts` „[WYJĄTEK NAZWANY ADR-0019 2026-11-02]”; zmiana semantyki tła wywróci ten test.
- **Tańsza kontrola zamiast strażnika — znane drogi do zawieszenia zamknięte:** (1) wyjątek w starcie (strażnik, kontener, `dostep.odswiez`, preferencje, `przygotuj` licznika, w tym zapytanie poza `Wynik` w `src/kompozycja/licznik.ts`) → ekran awaryjny, nie pusta plansza (M1-007, `tests/ekrany/blad-odczytu-trasy.test.tsx`); (2) StoreKit bez odpowiedzi czeka najwyżej `SKLEP_LIMIT_MS` = 1500 ms, potem pamięć offline (M1-022, P-396, `tests/ekrany/start-limit-sklepu.test.tsx`); (3) ekran awaryjny korzenia ma tekst także przy nieczytelnym języku systemu (`src/kompozycja/jezyk-awaryjny.ts`, ten sam test M1-012).
- **Ryzyko szczątkowe:** zawieszenie bez wyjątku w natywnym SQLite albo w module natywnym przed kamieniem (np. `p.wczytaj`, `przygotuj`) — bez limitu czasu; częstość na urządzeniu nieznana [DO USTALENIA: sygnał z TestFlight/Organizer, NIE-06]. Powrót do opcji (a) z 12-niezawodnosc-002 (tło zeruje licznik tylko przed upływem N s od początku startu; N do decyzji) przy przeglądzie P-273 albo po pierwszym zgłoszeniu pustej planszy przy starcie.

## Opcje: zalety i wady
### A — zalety: użytkownik rozumie, co się stało, i ma wybór; „spróbuj normalnie” po poprawce · wady: ekran, teksty, tłumaczenia.
### B — zalety: mniej kodu i tekstów · wady: arkusz eksportu bez wyjaśnienia przy każdym starcie; brak drogi „spróbuj normalnie” po aktualizacji z poprawką.
### C — zalety: zero kodu · wady: pętla awarii odcina od danych do czasu recenzji poprawki.
