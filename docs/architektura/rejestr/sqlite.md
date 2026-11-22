# Rejestr ograniczeń SQLite (rola 05, E0)

Źródła pobrane 2026-10-22 przez `curl` z https://www.sqlite.org/ (kopie: `oczko-warsztat/05-architekt/2026-10-22-build/e0-zrodla/pobrane/`). Cytaty dosłowne (angielskie), skrócone tylko wielokropkiem. Eksperymenty: Node 22 `node:sqlite`, SQLite 3.50.4.

| # | Ograniczenie | Źródło (URL) | Cytat | Odczyt |
|---|---|---|---|---|
| 1a | Klucze obce wyłączone domyślnie, włączane na każdym połączeniu | https://www.sqlite.org/foreignkeys.html#fk_enable | "Foreign key constraints are disabled by default (for backwards compatibility), so must be enabled separately for each database connection." | `PRAGMA foreign_keys=ON` przy każdym otwarciu połączenia (aplikacja i rozszerzenie osobno). |
| 1b | `PRAGMA foreign_keys` w transakcji nic nie robi | https://www.sqlite.org/foreignkeys.html#fk_enable | "It is not possible to enable or disable foreign key constraints in the middle of a multi-statement transaction (when SQLite is not in autocommit mode). Attempting to do so does not return an error; it simply has no effect." | Cichy no-op; migracja musi przełączać FK przed `BEGIN`. Potwierdzone eksperymentem B. |
| 2a | 12-krokowa procedura dowolnej zmiany schematu | https://www.sqlite.org/lang_altertable.html#otheralter | "The steps to make arbitrary changes to the schema design of some table X are as follows: If foreign key constraints are enabled, disable them using PRAGMA foreign_keys=OFF. Start a transaction. … If foreign key constraints were originally enabled then run PRAGMA foreign_key_check … Commit the transaction started in step 2." oraz "The 12-step generalized ALTER TABLE procedure above will work even if the schema change causes the information stored in the table to change." | Migracje zmieniające typy/ograniczenia: nowa tabela → kopia → DROP → RENAME, z `foreign_key_check` przed COMMIT. |
| 2b | Najpierw zmiana nazwy starej tabeli = błąd | https://www.sqlite.org/lang_altertable.html#caution | "In the procedure on the right, the initial rename of the table to a temporary name might corrupt references to that table in triggers, views, and foreign key constraints. The safe procedure on the left constructs the revised table definition using a new temporary name, then renames the table into its final name" | Kolejność: „Create new table, Copy data, Drop old table, Rename new into old” (Correct); „Rename old table…” (Incorrect). |
| 3a | Składnia UPSERT, od 3.24.0 | https://www.sqlite.org/lang_upsert.html | "An UPSERT is an ordinary INSERT statement that is followed by one or more ON CONFLICT clauses" … "UPSERT syntax was added to SQLite with version 3.24.0 (2018-06-04)." | Do zapisu „wstaw albo zaktualizuj” używać `ON CONFLICT(id) DO UPDATE`, nie REPLACE. |
| 3b | REPLACE usuwa istniejące wiersze; wyzwalacze DELETE tylko przy recursive_triggers | https://www.sqlite.org/lang_conflict.html | "the REPLACE algorithm deletes pre-existing rows that are causing the constraint violation prior to inserting or updating the current row" … "When the REPLACE conflict resolution strategy deletes rows in order to satisfy a constraint, delete triggers fire if and only if recursive triggers are enabled." | Strona nie mówi wprost o kaskadach FK; eksperyment A pokazuje, że przy `foreign_keys=ON` REPLACE uruchamia `ON DELETE CASCADE` i kasuje dzieci. Zakaz `INSERT OR REPLACE` na tabelach-rodzicach. |
| 4a | Automatyczny checkpoint przy 1000 stronach | https://www.sqlite.org/wal.html#ckpt | "By default, SQLite does a checkpoint automatically when the WAL file reaches a threshold size of 1000 pages." | Ostatnie zapisy mogą przez długi czas istnieć tylko w `-wal`. |
| 4b | Plik `-wal` istnieje obok bazy | https://www.sqlite.org/wal.html#walfile | "The name of this file on disk is usually the name of the database file with an extra \"-wal\" suffix … The WAL file exists for as long as any database connection has the database open." | Kopiowanie samego `.db` przy otwartym połączeniu gubi dane (eksperyment D). |
| 4c | WAL tylko na jednym hoście; pliki towarzyszące | https://www.sqlite.org/wal.html#advantages | "All processes using a database must be on the same host computer; WAL does not work over a network filesystem." … "There is an additional quasi-persistent \"-wal\" file and \"-shm\" shared memory file associated with each database" | Kontener App Group to lokalny system plików, więc WAL możliwy; przy kopii/przenoszeniu trzeba uwzględnić `-wal` i `-shm`. |
| 4d | Kopia pliku tylko bez trwającej transakcji, razem z `-wal` | https://www.sqlite.org/howtocorrupt.html#_backup_or_restore_while_a_transaction_is_active | "It is also safe to make a copy of an SQLite database file as long as there are no transactions in progress while the copy is taking place. If the previous write transaction failed, then it is important that any rollback journal (the *-journal file) or write-ahead log (the *-wal file) be copied together with the database file itself." | Kopie zapasowe przez `VACUUM INTO` (albo backup API), nie przez kopiowanie plików. |
| 5 | VACUUM INTO daje spójną migawkę | https://www.sqlite.org/lang_vacuum.html#vacuuminto | "The VACUUM INTO command is transactional in the sense that the generated output database is a consistent snapshot of the original database. However, if the VACUUM INTO command is interrupted by an unplanned shutdown or power loss, then the generated output database might be incomplete and corrupt." oraz "The file named by the INTO clause must not previously exist, or else it must be an empty file" | Eksport/kopia: `VACUUM INTO` do pliku tymczasowego, potem `integrity_check` na kopii i atomowa zmiana nazwy. |
| 6a | Typ deklarowany `JSON` → afinicja NUMERIC | https://www.sqlite.org/datatype3.html#affname | "If the declared type for a column contains any of the strings \"REAL\", \"FLOA\", or \"DOUB\" then the column has REAL affinity. Otherwise, the affinity is NUMERIC." | „JSON” nie pasuje do reguł 1–4, więc NUMERIC (wniosek z reguł; strona nie wymienia JSON wprost). |
| 6b | NUMERIC zamienia tekst-liczbę na INTEGER/REAL | https://www.sqlite.org/datatype3.html#affinity | "When text data is inserted into a NUMERIC column, the storage class of the text is converted to INTEGER or REAL (in order of preference) if the text is a well-formed integer or real literal" … "the string '3.0e+5' is stored in a column with NUMERIC affinity as the integer 300000" | JSON w kolumnie `JSON` może zmienić typ (eksperyment C: '1.0' → integer 1). Kolumny JSON deklarować jako `TEXT`. |
| 6c | `json_valid` | https://www.sqlite.org/json1.html#jvalid | "The json_valid(X,Y) function returns 1 if the argument X is well-formed JSON, or returns 0 if X is not well-formed." … "If omitted, it defaults to 1, which means that the default behavior is to return true only if the input X is strictly conforming RFC-8259 JSON text" | `TEXT CHECK(json_valid(x))` odrzuca niepoprawny JSON (eksperyment C). Dodatkowo: "SQLite stores JSON as ordinary text." |
| 6d | Tabele STRICT od 3.37.0 | https://www.sqlite.org/stricttables.html | "SQLite supports a strict typing mode, as of version 3.37.0 (2021-11-27), that is enabled separately for each table." … "If the value cannot be losslessly converted in the specified datatype, then an SQLITE_CONSTRAINT_DATATYPE error is raised." | Wymaga SQLite ≥ 3.37.0 w każdym kliencie bazy (także w rozszerzeniu, jeśli używa systemowej biblioteki). Dozwolone typy: INT, INTEGER, REAL, TEXT, BLOB, ANY. |
| 7a | `integrity_check` | https://www.sqlite.org/pragma.html#pragma_integrity_check | "This pragma does a low-level formatting and consistency check of the database." … "If pragma integrity_check finds no errors, a single row with the value 'ok' is returned." … "PRAGMA integrity_check does not find FOREIGN KEY errors. Use the PRAGMA foreign_key_check command to find errors in" | Kontrola po migracji/odtworzeniu = `integrity_check` **i** `foreign_key_check`. |
| 7b | `foreign_key_check` | https://www.sqlite.org/pragma.html#pragma_foreign_key_check | "The foreign_key_check pragma checks the database, or the table called \"table-name\", for foreign key constraints that are violated. The foreign_key_check pragma returns one row output for each foreign key violation." | Pusta odpowiedź = brak naruszeń. |
| 7c | `user_version` | https://www.sqlite.org/pragma.html#pragma_user_version | "The user_version pragma will get or set the value of the user-version integer at offset 60 in the database header. The user-version is an integer that is available to applications to use however they want. SQLite makes no use of the user-version itself." | Numer wersji schematu dla migracji. |
| 8a | Maks. długość BLOB/tekstu | https://www.sqlite.org/limits.html#max_length | "The maximum number of bytes in a string or BLOB in SQLite is defined by the preprocessor macro SQLITE_MAX_LENGTH. The default value of this macro is 1 billion (1 thousand million or 1,000,000,000)." | Limit nie blokuje rysunków, ale nie jest argumentem za trzymaniem ich w bazie. |
| 8b | Duże BLOB-y szybciej w osobnych plikach | https://www.sqlite.org/intern-v-extern-blob.html | "For BLOBs smaller than 100KB, reads are faster when the BLOBs are stored directly in the database file. For BLOBs larger than 100KB, reads from a separate file are faster." | Pomiar z 2011 r. (Linux). Rysunki/zdjęcia > ~100 KB jako pliki z odwołaniem w bazie; wtedy kopia zapasowa musi objąć też pliki. |
| 9a | Blokady plików koordynują procesy | https://www.sqlite.org/howtocorrupt.html#_file_locking_problems | "SQLite uses file locks on the database file, and on the write-ahead log or WAL file, to coordinate access between concurrent processes." | Aplikacja i rozszerzenie iOS na jednej bazie w App Group = wiele procesów; poprawność zależy od blokad. |
| 9b | close() kasuje blokady POSIX | https://www.sqlite.org/howtocorrupt.html#_posix_advisory_locks_canceled_by_a_separate_thread_doing_close_ | "the close() system call will cancel all POSIX advisory locks on the same file for all threads and all file descriptors in the process." … "This problem only arises when a thread tries to bypass the SQLite library and read the database file directly." … "developers should be careful to never use close() on an SQLite database file while one or more database connections are open, even in other threads." | Żadnego czytania/kopiowania pliku bazy kodem spoza SQLite (np. FileSystem, kopia fs) przy otwartym połączeniu. Strona podaje też dodatkowe zabezpieczenia od 3.51.0 (2025-11-04) dla WAL i wielu procesów, "But they are not a cure-all." |
| 9c | Dwie kopie SQLite w jednej aplikacji | https://www.sqlite.org/howtocorrupt.html#multiple_copies_of_sqlite_linked_into_the_same_application | "Database connections opened using one copy of the SQLite library will be unaware of database connections opened using the other copy, and will be unable to work around the POSIX advisory locking quirks. A close() operation on one connection might unknowingly clear the locks on a different database connection, leading to database corruption." | Do sprawdzenia w ADR: czy expo-sqlite dołącza własną bibliotekę obok systemowej libsqlite3 (np. przez inną zależność) w tym samym procesie. |

## Eksperymenty

Katalog: `docs/architektura/eksperymenty/e0/` (skrypty `*.js`, wyniki `*.out`). Środowisko: Node 22, `node:sqlite`, SQLite 3.50.4.

### A. INSERT OR REPLACE kontra UPSERT przy ON DELETE CASCADE
Polecenie: `node --no-warnings a-replace-vs-upsert.js` · kod wyjścia: 0
```
sqlite 3.50.4 foreign_keys 1
przed REPLACE: dzieci = 2
po INSERT OR REPLACE: dzieci = 0 parent = [{"id":1,"name":"b"}]
przed UPSERT: dzieci = 2
po UPSERT: dzieci = 2 parent = [{"id":1,"name":"b"}]
```
Wniosek: REPLACE usuwa wiersz-rodzica i kaskadowo dzieci; UPSERT je zachowuje.

### B. PRAGMA foreign_keys=OFF wewnątrz transakcji
Polecenie: `node --no-warnings b-fk-w-transakcji.js` · kod wyjścia: 0
```
po ON poza transakcja: 1
po OFF wewnatrz BEGIN: 1
po COMMIT: 1
po OFF poza transakcja: 0
```
Wniosek: wewnątrz BEGIN…COMMIT przełączenie jest cichym no-opem (bez błędu).

### C. Kolumna `JSON` kontra `TEXT CHECK(json_valid(x))`
Polecenie: `node --no-warnings c-json-afinicja.js` · kod wyjścia: 0
```
JSON  : [{"x":123,"t":"integer"},{"x":1,"t":"integer"},{"x":"\"123\"","t":"text"},{"x":"{\"k\":1}","t":"text"}]
TEXT+CHECK: [{"x":"123","t":"text"},{"x":"1.0","t":"text"},{"x":"\"123\"","t":"text"},{"x":"{\"k\":1}","t":"text"}]
niepoprawny JSON w b odrzucony: CHECK constraint failed: json_valid(x)
niepoprawny JSON w a (JSON) przyjety: text
```
Wniosek: kolumna `JSON` (afinicja NUMERIC) zamienia '123' na integer 123, a '1.0' na integer 1 (zmiana treści), i przyjmuje niepoprawny JSON. `TEXT CHECK(json_valid(x))` zachowuje tekst i odrzuca niepoprawny JSON.

### D. VACUUM INTO kontra kopia samego pliku `.db` w trybie WAL
Polecenie: `node --no-warnings d-vacuum-into-wal.js <katalog roboczy>` · kod wyjścia: 0
(WAL, `wal_autocheckpoint=0`, schemat wypchnięty do pliku głównego checkpointem, potem 100 wierszy tylko w `-wal`; `fs.copyFileSync` samego `.db` przy otwartym połączeniu.)
```
journal_mode wal
wiersze w zrodle: 100 | rozmiar -wal: 4152 B
kopia-pliku.db -> wiersze: 0 | integrity_check: ok
vacuum-into.db -> wiersze: 100 | integrity_check: ok
```
Wniosek: kopia samego pliku głównego cicho gubi niezcheckpointowane zapisy, a `integrity_check` zwraca 'ok', więc go nie wykryje. `VACUUM INTO` zawiera wszystkie 100 wierszy.
