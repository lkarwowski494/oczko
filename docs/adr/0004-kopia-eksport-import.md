# 0004. Eksport jako archiwum `.oczko` (baza z `VACUUM INTO` + pliki + manifest), import „scal / zastąp” z odrzuceniem nowszej wersji
Data: 2026-10-22 · Status: **przyjęta** (P-071) · Rola: 05 (E1) · Zależy od: ADR-0001, ADR-0002, F-32 (BR-DAN-004–006), F-33, F-34

## Kontekst i problem
Użytkownik przenosi dane na nowy telefon z kopii urządzenia albo z pliku eksportu i importuje kopię także na niepustą bazę („scal / zastąp”, BR-DAN-006). Kopia samego pliku `.db` w trybie WAL zgubiła w eksperymencie 100 ze 100 świeżych wierszy, a `integrity_check` zwrócił `ok`; `VACUUM INTO` zachował wszystkie (G-08, eksperyment D). Pliki wzorów i zdjęć po 3 latach to do ok. 415 MB (E0 §3).

## Czynniki decyzji
Kompletność (dane + pliki) · plik nowszej wersji odrzucony, nie częściowo wczytany · scalenie bez duplikatów · czas operacji a zawieszenie (`0xdead10cc`) · rozmiar.

## Rozważane opcje
A. Archiwum ZIP `.oczko`: `manifest.json` (format, `wersja_schematu`, wersja aplikacji, data, liczności tabel, lista plików z SHA-256 i bajtami), `oczko.db` z `VACUUM INTO`, katalog `pliki/`. Import: weryfikacja manifestu i SHA-256 w katalogu tymczasowym, potem migracja kopii do bieżącego schematu, potem scalenie albo zastąpienie w kolejce zapisów.
B. JSON z danymi + osobno pliki (albo JSON z plikami w base64).
C. Tylko kopia systemowa urządzenia (bez eksportu).

## Decyzja
Opcja A. Scalenie po stałych identyfikatorach (UUID wierszy i zdarzeń) z funkcją domeny `scal` (ADR-0005), więc import tego samego pliku dwa razy niczego nie dubluje. „Zastąp” robi najpierw `VACUUM INTO` bieżącej bazy do „kopii przed importem” (do 30 dni, jak F-33) i dopiero potem podmienia. Plik z `wersja_schematu` wyższą niż aplikacja: odrzucony z komunikatem „zaktualizuj aplikację” bez żadnego zapisu. Eksport i import tylko na pierwszym planie z ochroną czasu w tle (`beginBackgroundTask` w module natywnym, ADR-0007; rejestr Apple 2b, 2c); przed zapisem sprawdzenie wolnego miejsca (required reason E174.1).
- Pliki zawsze w archiwum, bez wariantu „tylko dane” (właściciel: „4a”, P-071).

### Konsekwencje
- Dobre: jedna kopia zawiera wszystko; ta sama ścieżka migracji co aktualizacja aplikacji; brak duplikatów przy powtórnym imporcie.
- Złe: archiwum może mieć setki MB (udostępnienie mailem niemożliwe; Pliki/iCloud Drive tak); własny kod ZIP lub zależność (do wyboru w E2 z manifestem prywatności).

### Potwierdzenie
- Testy (07): eksport → import na pustą bazę daje identyczne liczności i SHA-256 plików; import tego samego pliku dwa razy = brak zmian; plik z `wersja_schematu` + 1 odrzucony, baza bez zmian (liczność i `PRAGMA data_version`); uszkodzony SHA-256 jednego pliku → import odrzucony przed zapisem.
- Test na kopii: archiwum z każdej wydanej wersji importowane do bieżącej (jak migracja).
- Kontrola: kopia samego `.db` nigdzie w kodzie (grep `copyAsync` na ścieżce bazy w CI).

## Uzupełnienie 2026-10-25 (fix 05: Z07-17; decyzja A bez zmian)
- **Typ pliku `.oczko`:** konfiguracja iOS deklaruje typ eksportowany (`UTExportedTypeDeclarations`): identyfikator `com.apps4brew.knitting.archiwum` (prefiks z `bundleIdentifier` w `app.json`), rozszerzenie `oczko`, zgodność (`UTTypeConformsTo`) z `public.zip-archive` i `public.data`, opis „Oczko backup” (tekst: 04, tłumaczenia: 09); oraz `CFBundleDocumentTypes` z tym typem i `LSHandlerRank = Owner`, żeby plik otwierał się w Oczku z Plików i z poczty. Kontrola w podpisanym `.ipa` (ADR-0014, uzupełnienie).

## Uzupełnienie 2026-11-01 (partia 8, 05: 07-jakosc-003; decyzja A bez zmian)
- „Kopia przed importem” przy „Replace” to pełne archiwum `.oczko` w `Documents/Backup` (widoczne w Plikach), nie surowy `.db` w `Application Support/kopie`; pula: 2 najnowsze, najwyżej 30 dni. Szczegóły: ADR-0028.

## Opcje: zalety i wady
### A — zalety: kompletność, spójna migawka, weryfikacja przed zapisem · wady: rozmiar, kod archiwum.
### B — zalety: czytelny format · wady: druga ścieżka mapowania schematu na JSON i z powrotem (podwójne migracje), base64 powiększa pliki o ok. 1/3.
### C — zalety: zero kodu · wady: nie spełnia BR-DAN-005 (eksport jednym przyciskiem) ani importu na niepustą bazę; kopia systemowa nie pomaga przy zmianie konta Apple.
