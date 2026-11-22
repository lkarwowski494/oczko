# 0002. Jedna kolejka zapisów na jednym połączeniu z `foreign_keys = ON`
Data: 2026-10-22 · Status: **przyjęta** (P-071) · Rola: 05 (E1) · Zależy od: ADR-0001

## Kontekst i problem
`expo-sqlite` 57 daje dwa rodzaje transakcji. `withTransactionAsync`: „not exclusive and can be interrupted by other async queries”, a każde zapytanie wykonane w tym czasie wchodzi do transakcji (rejestr Expo 2a). `withExclusiveTransactionAsync` otwiera nowe połączenie (`useNewConnection: true`, `src/SQLiteDatabase.ts:789` w `expo-sqlite@57.0.4`, sprawdzone 2026-10-22), na którym klucze obce są wyłączone (rejestr SQLite 1a), więc kaskady nie działają (G-07).

## Czynniki decyzji
Kaskady i klucze obce zawsze włączone · brak przeplatania zapisów (+1, cofnięcie, scalenie dziennika, import) · zapis krótki przed zawieszeniem (`0xdead10cc`).

## Rozważane opcje
A. Jedno połączenie zapisu otwarte przy starcie, `PRAGMA foreign_keys = ON` przed pierwszą transakcją, wszystkie zapisy przez kolejkę FIFO w porcie bazy (`zapisz(fn)`), każda pozycja to `BEGIN IMMEDIATE … COMMIT` z `withTransactionAsync` na tym połączeniu, bez równoległych zapytań.
B. `withTransactionAsync` wywoływane bezpośrednio z ekranów, bez kolejki.
C. `withExclusiveTransactionAsync` dla zapisów wielowierszowych.

## Decyzja
Opcja A. Odczyty idą przez to samo połączenie poza kolejką tylko wtedy, gdy kolejka jest pusta; ekrany czytają po zakończeniu zapisu (port zwraca wynik zapisu). Długie operacje (import, eksport, scalanie dużego pliku) dzielone na krótkie transakcje w kolejce.

### Konsekwencje
- Dobre: kaskady działają; brak przypadkowego wciągnięcia obcego zapytania do transakcji; jedno miejsce do pomiaru i obsługi błędu zapisu (stan „Couldn’t save that row…”, design-spec).
- Złe: zapisy nie są równoległe (przy E1-1 zapis +1 trwa ułamek ms, więc bez znaczenia); port bazy musi pilnować, żeby nikt nie użył natywnego obiektu z pominięciem kolejki (`granice.mjs`).

### Potwierdzenie
- Test (07): `PRAGMA foreign_keys` odczytane wewnątrz transakcji zapisu przez port bazy = 1.
- Test: dwa równoległe wywołania `zapisz` wykonują się po kolei (atrapa portu z opóźnieniem); błąd w pierwszym nie blokuje drugiego.
- `granice.mjs`: import `expo-sqlite` tylko w `src/dane/baza/`; zakaz `withExclusiveTransactionAsync` (grep w CI).

## Uzupełnienie 2026-10-26 (fix-3 05: P-123 pkt 5; decyzja A bez zmian)
- **(5) Sposób otwarcia transakcji.** Tekst opcji A („`BEGIN IMMEDIATE … COMMIT` z `withTransactionAsync`”) był niewykonalny: `withTransactionAsync` wysyła własne `BEGIN` (`node_modules/expo-sqlite/src/SQLiteDatabase.ts:142`, `expo-sqlite` 57.0.4, odczyt 2026-10-26). Obowiązuje: każda pozycja kolejki = `execAsync('BEGIN IMMEDIATE')` → funkcja na tym samym połączeniu → `execAsync('COMMIT')`, przy błędzie `execAsync('ROLLBACK')` (tak robi `src/dane/baza/adapter-expo.ts`). `withTransactionAsync` i `withExclusiveTransactionAsync` nie są używane.
- **(7) Import jedną transakcją — wyjątek nazwany od „długie operacje dzielone na krótkie transakcje” (P-123 pkt 7).** Import „scal” i „zastąp” (oraz przywrócenie z kopii, ADR-0020 (5)) to jedna pozycja kolejki i jedna transakcja: podział „zastąp” na partie zostawiłby bazę w połowie starej i nowej (utrata danych przy przerwaniu), a atomowość ma pierwszeństwo przed krótkością. Tańsza kontrola zamiast podziału (zasada 7): (a) operacja tylko na pierwszym planie, w całości pod `CzasWTle.chron` (`beginBackgroundTask`, rejestr Apple 2b, 2c, 17); (b) obsługa wygaśnięcia czasu wywołuje `ROLLBACK` i zwalnia blokadę przed zawieszeniem (`0xdead10cc`, rejestr Apple 2b), dane zostają w stanie sprzed importu, ekran pokazuje błąd z ponowieniem (tekst: 04); port `CzasWTle` (`src/domena/porty.ts:27`) nie przekazuje dziś wygaśnięcia — 08 w partii 3 dodaje sygnał (`chron<T>(nazwa, fn: (s: { wygaslo(): boolean }) => Promise<T>)`, sprawdzany przez przypadek użycia między instrukcjami transakcji; po wygaśnięciu wyjątek → `ROLLBACK` w adapterze, potem `endBackgroundTask`; natywna obsługa wygaśnięcia nie wykonuje SQL na połączeniu zapisu) razem z adapterem i pomocnikiem testów; (c) przed transakcją nic nie czeka na sieć ani dialog (dziennik i pliki odczytane wcześniej, ADR-0008). Ryzyko nazwane: czas transakcji dla bazy z szacunku 3-letniego na najstarszym wspieranym urządzeniu nieznany — **pomiar w partii 3** (08, z percentylem; budżet [DO USTALENIA po pomiarze]); przy przekroczeniu wraca decyzja (np. import do nowego pliku obok i przełączenie przy starcie — dziś odrzucone przez ADR-0020 „nigdy podmiana pliku”). Scalanie dziennika i synchronizacja zostają w partiach `PARTIA_SYNCHRONIZACJI` (zdarzenia są idempotentne po UUID, więc przerwanie w połowie nie psuje danych).

## Opcje: zalety i wady
### A — zalety: poprawne kaskady, przewidywalna kolejność · wady: własny mały kod kolejki.
### B — zalety: zero kodu · wady: dokumentacja Expo sama ostrzega przed przeplataniem; ryzyko częściowego zapisu przy dwóch równoległych akcjach (np. +1 i scalanie dziennika).
### C — zalety: izolacja · wady: klucze obce wyłączone na nowym połączeniu, a inne zapisy kończą się `database is locked` (rejestr Expo 2b).
