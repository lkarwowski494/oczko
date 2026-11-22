# E2 Moduły, dane, konfiguracja (rola 05-architekt, build) · 2026-10-22 · STOP E2 przyjęty (P-072: 7a, 8a)
Wejście: E1 przyjęte (P-071). Wyniki:
- [`moduly.md`](moduly.md): drzewo katalogów, kierunek zależności, porty domeny (sygnatury), ścieżka zapisu +1 w jednej transakcji, mapowanie rodzajów zdarzeń na `wolaStraznika` (P-067), maszyny stanów (projekt, sesja, synchronizacja, import) z tabelami przejść, lista konfiguracji (16 pozycji, 2 × [DO USTALENIA], 2 × [OCENA]).
- [`dane.md`](dane.md): ERD (Mermaid), krytyczność i cykl życia danych, polityka migracji (12 kroków, test na kopii każdej wydanej wersji), kopie i archiwum `.oczko`, **tabela 22 ścieżek utraty danych** (ścieżka → zabezpieczenie → test).
- [`schemat.sql`](schemat.sql) v1: 18 tabel STRICT, czas ms UTC + strefa IANA + dzień lokalny (RD-16), JSON jako `TEXT CHECK (json_valid)`, listy stanów z [`stany.json`](stany.json).

## Dowód uruchomienia schematu
`node --no-warnings docs/architektura/narzedzia/sprawdz-schemat.mjs` → **32/32 OK, kod wyjścia 0** (`narzedzia/sprawdz-schemat.out`; SQLite 3.50.4, Node v22.22.0; połączenie otwierane z `enableForeignKeyConstraints: false` i `PRAGMA foreign_keys = ON`, jak w aplikacji):
- migracja 1 na pustej bazie (`user_version = 1`), drugie uruchomienie bez zmian; `integrity_check = ok`; `foreign_key_check` pusty (pusta baza, z danymi, po kaskadzie); `foreign_keys = 1` wewnątrz transakcji zapisu;
- **UPSERT** projektu: części 2 i zdarzenia 2 zachowane; kontrola: `INSERT OR REPLACE` kasuje zdarzenia kaskadą (2 → 0);
- **kaskada** usunięcia projektu przez 10 tabel; pliki, włóczka i dzień limitu zostają; `RESTRICT` chroni plik używany przez wzór;
- CHECK: nieznany rodzaj zdarzenia, wpisanie bez wartości, długość powtórzenia 0 (RD-12-W5), ukończony bez daty; UNIQUE: druga otwarta sesja;
- **stany ⊆ CHECK** dla 9 list; baza nowsza niż aplikacja odrzucona bez zmian; migracja łamiąca CHECK wycofana w całości;
- plany zapytań 5 głównych ekranów na 150 000 zdarzeń: wszystkie `SEARCH … USING INDEX`, p95 ≤ 1,6 ms (Linux, nie iPhone — proporcja, budżety w E3).
Kontrola negatywna sprawdzacza (stan „anulowana” spoza CHECK, zdarzenia bez kaskady) → 3 błędy, kod wyjścia 1 (`narzedzia/kontrola-negatywna/`).
Scalanie: dodany rodzaj `cofniecie` (F-47), wektor M-08; `eksperymenty/e1/scal-test.mjs` → 8/8, kod wyjścia 0.

## Pytania produktowe
**Q7. Zapomniany stoper (`SESJA_MAKS_H`, F-21, F-51)** — sesja otwarta bez końca zawyża czas projektu i dnia.
- (a) **Po 8 h aplikacja kończy sesję na 8 h i oznacza ją „do sprawdzenia” (korekta jednym stuknięciem).** Zgodne z limitem Live Activity (8 h, rejestr Apple 1a). **Rekomendacja.**
- (b) 12 h (Live Activity znika wcześniej, stoper widoczny tylko w aplikacji).
- (c) Bez limitu; użytkownik koryguje sam (F-51).

**Q8. Dni limitu po usunięciu licznika albo projektu** (interpretacja roli 05, `dane.md`):
- (a) **Dzień raz zaczęty zostaje w limicie** (usunięcie nie zwalnia dnia; spójne z L-16 „scalenie nigdy nie odbiera rozpoczętego dnia”). **Rekomendacja.**
- (b) Usunięcie wszystkich zdarzeń dnia zwalnia dzień — wymaga ER do roli 02 (zmiana kontraktu płatności).

## Otwarte (bez decyzji właściciela)
- Wersja SQLite w `expo-sqlite@57.0.4` na urządzeniu — test 07 na symulatorze.
- Czy kopia urządzenia wykonuje checkpoint WAL — zabezpieczenie: checkpoint przy przejściu w tło.

## Dalej
E3: praca w tle (ekran blokady, zegarek, zawieszenie), polityka błędów, `prywatnosc.md` (inwentarz + required reason API), budżety wydajności z metodą, `granice.mjs`, lista kontroli dla roli 07. Agent ok. 1,5 h; właściciel ok. 10 min.
