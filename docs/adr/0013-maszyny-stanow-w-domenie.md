# 0013. Procesy wieloetapowe jako maszyny stanów w domenie z tabelą przejść; ta sama lista stanów w `CHECK` bazy
Data: 2026-10-22 · Status: **przyjęta** (P-071) · Rola: 05 (E1) · Zależy od: ADR-0003

## Kontekst i problem
Stany zmieniające się w czasie: projekt (w toku → ukończony → zarchiwizowany; usunięty 30 dni → przywrócony albo trwale usunięty, F-19, F-33), sesja stopera (brak → trwa → wstrzymana → zakończona; korekta F-51; zabicie procesu w trakcie), dzień limitu (`startDnia`), synchronizacja (wyłączona → aktywna → błąd/brak konta → aktywna; F-58), import (sprawdzanie → scalanie → gotowe/odrzucony).

## Czynniki decyzji
Brak stanów niemożliwych (np. sesja „trwa” w dwóch projektach) · wektory testowe · zgodność kodu i bazy.

## Rozważane opcje
A. Maszyna w domenie: `przejdz(stan, zdarzenie) → stan | błąd`, tabela przejść w dokumencie i w kodzie; kolumna `stan TEXT NOT NULL CHECK (stan IN (…))` z tej samej listy. B. Flagi logiczne (`ukonczony`, `usuniety`, `trwa`) ustawiane z ekranów.

## Decyzja
Opcja A. Czas sesji liczony ze znaczników `start_ms`/`koniec_ms` w bazie, nigdy z odliczania (moduł tła, zasada 4); po zabiciu procesu sesja „trwa” odtwarza się ze znacznika. Tabele przejść w E2 (`docs/architektura/README.md` / `dane.md`).

### Konsekwencje
- Dobre: przejścia testowalne wektorami; baza odrzuca stan spoza listy.
- Złe: dwie listy do zgodności (kod i `CHECK`) — rozwiązane testem.

### Potwierdzenie
- Test „stany maszyny ⊆ CHECK” (07): zbiór stanów z kodu = zbiór z `CHECK` w `schemat.sql` (parsowanie schematu).
- Wektory przejść: każde niedozwolone przejście zwraca błąd; co najwyżej jedna sesja „trwa” (indeks częściowy `UNIQUE … WHERE stan = 'trwa'`).

## Opcje: zalety i wady
### A — zalety: jawne przejścia, ochrona w bazie · wady: więcej kodu.
### B — zalety: szybkie · wady: kombinacje flag dają stany niemożliwe (ukończony i usunięty i trwa).
