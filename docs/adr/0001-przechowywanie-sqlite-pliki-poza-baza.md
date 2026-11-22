# 0001. Dane użytkownika w SQLite (`expo-sqlite`), pliki wzorów i zdjęć poza bazą
Data: 2026-10-22 · Status: **przyjęta** (P-071) · Rola: 05 (E1) · Zależy od: P-021, P-070, NFR-DAN-001, NFR-DAN-002

## Kontekst i problem
Aplikacja zapisuje każdą zmianę licznika z godziną (BR-LIC-003), projekty z częściami, sesje stopera, zapas, dni limitu (`docs/monetyzacja/limit.mjs`) i agregaty po dniach (F-59). Profil intensywny, 3 lata (E0 §3): 150 000 zdarzeń i ok. 415 MB plików; baza po `VACUUM INTO` ma 57,6 MB (pomiar 2026-11-03, M1-audytor-generalny-165: schemat `src/dane/migracje/0001.sql`, 45 projektów z jednym licznikiem, 150 000 zdarzeń `plus` z UUID w `id`, `licznik_id` i `urzadzenie`, `rodzice` z jednym UUID, SQLite 3.53.4 przez `node:sqlite`; 57 573 376 B, czyli ok. 384 B na zdarzenie (rozmiar bazy przez liczbę zdarzeń)), zgodnie z pomiarem R w ADR-0033 (58,4 MB). Dawny szacunek E0 z 2026-10 (ok. 18 MB, 120 B na wiersz) zaniżał bazę ok. 3×; pliki to nadal ok. 88% objętości, więc kierunek decyzji się nie zmienia. Każde +1 ma być trwałe po zabiciu procesu (NFR-DAN-002).

## Czynniki decyzji
Zero utraty danych · koszt zapisu jednego +1 przy 3 latach danych · zapytania kalendarza i historii · migracje schematu · eksport i kopia · prostota (zasada architekta 2).

## Rozważane opcje
A. SQLite przez `expo-sqlite` 57, pliki (PDF, zdjęcia, rysunki) w katalogu aplikacji, w bazie odwołanie, rozmiar i SHA-256.
B. Pliki JSON z wersją formatu (jeden plik albo plik na projekt), zapis atomowy.
C. Magazyn klucz-wartość (np. AsyncStorage/UserDefaults).
D. Pliki binarne w bazie (BLOB).

## Decyzja
Opcja A. Baza `oczko.db` w `Library/Application Support/` aplikacji, objętym kopią urządzenia (rejestr Apple 9a) (nie w `Documents/`, które widać w Plikach; nie w `Caches`, który system czyści — rejestr Expo 9), klasa ochrony domyślna „until first user authentication” (rejestr Apple 3a, 3b; P-070 (3a): zapis przy zablokowanym ekranie po pierwszym odblokowaniu). Tryb WAL. Pliki w `Library/Application Support/pliki/<sha256>.<rozszerzenie>`; usunięcie pliku dopiero po usunięciu ostatniego odwołania (licznik odwołań w bazie).

### Konsekwencje
- Dobre: +1 to jedna krótka transakcja (pomiar E1-1: p50 0,18 ms, p95 0,37 ms na 150 000 zdarzeń, Linux, nie iPhone); historia i kalendarz po indeksie (`SEARCH … USING INDEX`, p95 ≤ 0,34 ms); migracje i kopie według modułu `dane-lokalne-sqlite`.
- Złe: migracje schematu są kodem do utrzymania (12 kroków, test na kopii każdej wydanej wersji); dwa miejsca prawdy (baza + pliki) wymagają kontroli spójności (plik bez odwołania, odwołanie bez pliku) przy uruchomieniu i w eksporcie.
- Nowa wersja nie otwiera, nie nadpisuje i nie usuwa pliku `Library/SQLite/oczko.db` wersji 0.1.0 (P-070 (2c), ADR-0015).

### Potwierdzenie
- Test w CI (rola 07): otwarcie bazy w ścieżce `Application Support`, `PRAGMA journal_mode` = `wal`, `PRAGMA foreign_keys` = 1 na połączeniu zapisu.
- Test spójności plików: każde odwołanie ma plik o zgodnym SHA-256; plik bez odwołania jest wykrywany.
- `EXPLAIN QUERY PLAN` zapytań głównych ekranów na danych 150 000 zdarzeń bez `SCAN` dużej tabeli (eksperyment `docs/architektura/eksperymenty/e1/e1-1-skala.mjs` jako wzór).

## Opcje: zalety i wady
### A — zalety: transakcje, indeksy, mały koszt zapisu, dojrzałe migracje i `VACUUM INTO`; jeden plik do kopii · wady: kod migracji, uwaga na kalibrację (REPLACE, klucze obce, połączenia).
### B — zalety: brak schematu SQL, prosty eksport · wady: każde +1 przepisuje cały plik: E1-1 zmierzył p50 128 ms, p95 176 ms przy 13,2 MB (≈ 500× wolniej niż A), a przerwany zapis bez `rename` gubi wszystko; kalendarz liczony w JS z całości.
### C — zalety: najprostsze API · wady: brak transakcji wielu kluczy i zapytań; historia 150 000 zdarzeń nie mieści się sensownie w modelu klucz-wartość.
### D — zalety: jeden plik zawiera wszystko · wady: baza rośnie do setek MB, `VACUUM INTO` i kopie trwają długo (ryzyko `0xdead10cc`, rejestr Apple 2b); sqlite.org (rejestr SQLite 8b) wskazuje pliki zewnętrzne jako szybsze dla dużych obiektów.

## Uzupełnienie 2026-11-03 (05-architekt-513, P-436; decyzja A bez zmian)
- **Jeden mechanizm usuwania plików z magazynu.** Zapisy i kasowania (rysunek strony, usunięcie zdjęcia, sprzątanie kosza z wzorami, zdjęciami i włóczkami, odbiór zasobu iCloud ze złym SHA-256, nagrobek `plik` z iCloud) usuwają w swojej transakcji tylko wiersz `plik` bez odwołań; sam plik usuwa `sprzatnijSierotyMagazynu` przy starcie, w pozycji kolejki startu (nic nie jest wtedy w locie), z ochroną `PLIKI_OCHRONA_MIN` i regułą kopii M1-087 (ADR-0020 (6), (6″)). *Dlaczego:* plik trafia do magazynu przed kolejką bazy, a magazyn nie zapisuje pliku, który już istnieje; usunięcie pliku po COMMIT jednej operacji kasowało plik, do którego wiersz wstawiała druga operacja w locie z tym samym SHA-256 (wiersz bez pliku → każdy eksport, „Replace” i „Delete all data” z błędem). Licznik odwołań z decyzji to nadal wiersze w bazie; plik bez wiersza czeka do następnego startu.
- **Wyjątek nazwany:** „Usuń wszystkie dane” (F-34) usuwa pliki od razu po COMMIT — w tej transakcji znikają wszystkie wiersze, więc żaden zapis w locie nie wstawi odwołania (rodzic nie istnieje).
- *Rozważane:* (b) blokada na SHA-256 obejmująca zapis do magazynu, transakcję i usunięcie we wszystkich ścieżkach — szybsze zwalnianie miejsca, więcej kodu i miejsc do pilnowania; (c) sprawdzenie pliku przed COMMIT — nie zamyka okna. Kompromis (a): miejsce po usuniętych plikach wraca przy następnym starcie albo po wygaśnięciu kopii `.db` (M1-087).
- *Potwierdzenie:* `tests/dane/magazyn-wspolny-plik.test.ts` (dwa zapisy rysunku w locie z tym samym SHA-256 na różnych stronach; usunięcie i dodanie tego samego zdjęcia w locie: 0 wierszy `plik` bez pliku, eksport ok, po starcie plik zostaje; plik zwolniony przez zapis znika przy następnym starcie); testy M1-023, M1-087, M1-105, M1-128 bez zmian.
