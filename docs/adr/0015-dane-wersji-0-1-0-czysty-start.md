# 0015. Dane wersji 0.1.0: czysty start; nowa wersja nie czyta, nie nadpisuje i nie usuwa starej bazy
Data: 2026-10-22 · Status: **przyjęta** (P-070 (2c)) · Rola: 05 (E1) · Wyjątek nazwany od „Zero utraty danych” (`CLAUDE.md`), tylko dla 0.1.0

## Kontekst i problem
Wersja 0.1.0 (TestFlight 1004, bundle `com.apps4brew.knitting`) trzyma bazę w `Library/SQLite/oczko.db` (`src/core/db-path.ts`), bez `user_version` i bez `PRAGMA foreign_keys` (E0 §1). Właściciel potwierdził, że nikt poza nim jej nie ma („nikt nie ma”, P-070).

## Czynniki decyzji
Brak danych innych osób · koszt migracji schematu bez numeru wersji · ochrona przed przypadkowym skasowaniem.

## Rozważane opcje
A. Migracja starej bazy przy pierwszym uruchomieniu. B. Import z pliku eksportu starej wersji. C. Czysty start, stary plik nietknięty. D. Czysty start ze skasowaniem starego pliku.

## Decyzja
Opcja C (właściciel: „2c nikt nie ma”). Nowa baza w innej ścieżce (`Application Support/oczko.db`, ADR-0001), więc stary plik zostaje na urządzeniu właściciela do ewentualnego ręcznego odzysku. Od pierwszego wydania nowej wersji zasada „Zero utraty danych” obowiązuje bez wyjątku: każda wydana wersja ma kopię bazy w testach migracji.

### Konsekwencje
- Dobre: brak kodu migracji 0.1.0; stary plik nie znika po cichu (tańsza kontrola zamiast żadnej, zasada 7 właściciela).
- Złe: stary plik zajmuje miejsce na urządzeniu właściciela (pomijalne).

### Potwierdzenie
- Test (07): przy istniejącym `Library/SQLite/oczko.db` nowa wersja startuje z pustą bazą w `Application Support`, a stary plik ma ten sam rozmiar i SHA-256 po starcie.
- Grep w CI: brak odwołań do ścieżki `Library/SQLite` w `src/`.

## Opcje: zalety i wady
### A — zalety: zero utraty · wady: kod migracji dla danych jednej osoby; schemat bez numeru wersji.
### B — zalety: mniej kodu w starcie · wady: wymaga eksportu przed aktualizacją.
### C — zalety: najtańsze, nic nie ginie po cichu · wady: dane 0.1.0 niewidoczne w nowej wersji.
### D — zalety: porządek · wady: nieodwracalne usunięcie bez potrzeby.
