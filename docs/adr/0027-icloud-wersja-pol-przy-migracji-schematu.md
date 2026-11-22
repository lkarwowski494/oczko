# 0027. iCloud: brak pola w rekordzie zeruje kolumnę tylko wtedy, gdy nadawca ją znał (wersja schematu w rekordzie, `od_wersji` w kontrakcie); nowe kolumny synchronizowane domyślnie `NOT NULL DEFAULT`
Data: 2026-10-27 · Status: **przyjęta** (P-274 Q5 A+C; koordynator wg P-087) · Rola: 05 (fix, przeglądy 2026-10-27) · Zależy od: ADR-0005, P-245 U4, P-264, P-274 Q3a

## Kontekst i problem
CloudKit nie trzyma pól o wartości nil (`CKRecord.allKeys()`: „The array contains only those keys with values that aren’t nil”), więc odbiór partii 7 traktuje brak kolumny dopuszczającej NULL jako jej wyczyszczenie u nadawcy (P-264 A, `src/dane/repozytoria/icloud.ts`, `zastosujRekord`). Reguła jest poprawna, dopóki wszystkie urządzenia mają ten sam schemat. Gdy wersja 1.x doda kolumnę synchronizowaną, rekord zapisany przez urządzenie ze starszą wersją nie ma tej kolumny, bo nadawca o niej nie wie, a nie dlatego, że ją wyczyścił. Nowsze urządzenie wyzerowałoby wtedy wartość wpisaną przez użytkownika. Kolumny nieznane odbiorcy są pomijane (P-245 U4), więc problem dotyczy tylko kierunku „starszy nadawca → nowszy odbiorca”.

## Czynniki decyzji
- Zero utraty danych użytkownika (zasada wspólna 10); zmiany schematu CloudKit tylko dodające (ADR-0005, P-091).
- Apple, `CKModifyRecordsOperation.savePolicy` (odczyt 2026-10-27): „The default value is ifServerRecordUnchanged”; `RecordSavePolicy.allKeys`: „It’s possible for a server record to contain keys that aren’t present locally. Another client might add keys to the record after you fetch it.” To wspiera założenie, że serwer zachowuje pola, których starszy nadawca nie ustawił. Strony `CKSyncEngine` i `RecordZoneChangeBatch` nie opisują jednak polityki zapisu silnika, więc założenie jest [DO POTWIERDZENIA] (okno maszyn albo dwa urządzenia).
- Trening (P-087): protokół zegarka z wersją i wersją minimalną (`trening/lib/watch/protocol.ts:14-17`) oraz zachowywanie nieznanych pól przy migracji (`trening/lib/state/migrate.ts:24-25`); iCloud Trening nie ma.
- Koszt w 1.0: 1.0 jest pierwszą wersją z iCloud, więc reguła nie może wymagać zmian w 1.0, których nie da się dopisać później.

## Rozważane opcje
- A. Wersja schematu w rekordzie i `od_wersji` kolumny w kontrakcie.
- B. Poleganie na serwerze: brak reguły; CloudKit zachowuje pola, których nadawca nie ustawił.
- C. Zakaz nowych kolumn synchronizowanych dopuszczających NULL: każda nowa kolumna `NOT NULL DEFAULT …`, więc jej brak w rekordzie nigdy nie zeruje (UPSERT aktualizuje tylko obecne kolumny NOT NULL).

## Decyzja
Wybrano A z C jako regułą domyślną (P-274 Q5). Reguła działa niezależnie od tego, czy serwer zachowuje pola (B wymaga potwierdzenia, którego dziś nie ma), a C usuwa problem bez kodu wszędzie tam, gdzie NULL nie jest potrzebny.

Reguła przy pierwszej migracji schematu, która dodaje kolumnę do tabeli synchronizowanej (`icloud-tabele.json`):
1. **Domyślnie C:** nowa kolumna `NOT NULL DEFAULT <wartość>`. Brak pola w rekordzie od starszego nadawcy zostawia wartość lokalną (UPSERT bez tej kolumny); nowy wiersz od starszego nadawcy dostaje wartość domyślną.
2. **Gdy NULL jest potrzebny (A):**
   - `icloud-tabele.json` dostaje przy tabeli mapę `od_wersji: { "<kolumna>": N }` dla kolumn dodanych w wersji schematu N; kolumny bez wpisu mają wersję 1;
   - każdy rekord niesie pole `wersja_schematu` = `PRAGMA user_version` nadawcy; **brak pola = 1** (tak wysyła 1.0, więc 1.0 nie wymaga zmian);
   - odbiorca stosuje regułę P-264 A (brak kolumny NULL-owalnej = NULL) tylko do kolumn z `od_wersji ≤ wersja_schematu` nadawcy; kolumny nowsze niż nadawca zostają bez zmian;
   - pole `wersja_schematu` dochodzi do `cloudkit/schemat.ckdb` w tej samej migracji (zmiana dodająca).
3. **Warunek zgodności w przód w 1.0 (P-274 Q3a):** rekord z sieci z kolumną, którą odbiorca liczy lokalnie (`pomin`), nie jest odrzucany; kolumna jest pomijana jak nieznana. Bez tego urządzenie 1.0 odrzucałoby cały rekord, gdyby nowsza wersja zaczęła synchronizować taką kolumnę. Pole `wersja_schematu` w rekordzie od nowszego nadawcy 1.0 pomija jako kolumnę nieznaną (U4).
4. Kolumn ani pól nie usuwamy i nie zmieniamy ich znaczenia (ADR-0005); zmiana znaczenia to nowa kolumna.

### Konsekwencje
- Dobre: wartość wpisana na nowszym urządzeniu nie znika przez rekord ze starszego; 1.0 bez zmian w rekordach i schemacie CloudKit; reguła sprawdzalna testem w Node (dwie bazy w różnych wersjach schematu).
- Złe: przy pierwszej migracji z kolumną NULL-owalną dochodzi pole w każdym typie rekordu i wiersz kontraktu; urządzenia w różnych wersjach mogą chwilowo różnić się w kolumnie nowszej niż nadawca (bez utraty: wartość zostaje tam, gdzie była).
- Od czego zależy: założenie z P-264 („CKSyncEngine wysyła tylko ustawione pola”) — gdyby serwer zastępował rekord w całości, pole nowszej kolumny znikałoby z serwera. Reguła A chroni wtedy urządzenia, które już mają wartość, ale nowe urządzenie pobierające z serwera jej nie dostanie. Sprawdzenie: krok w oknie maszyn albo na dwóch urządzeniach (rekord zapisany z polem dodatkowym, potem zapis bez niego, odczyt z serwera).

### Potwierdzenie
- Przed 1.0 (08 p7, P-274 Q3a): test odwzorowania — rekord z kolumną z `pomin` daje wiersz bez tej kolumny, nie `bledne_dane`; test odbioru — rekord z polem nieznanym (`wersja_schematu`) stosowany bez błędu.
- Przy pierwszej migracji dodającej kolumnę do tabeli synchronizowanej (08, test przed kodem): dwie bazy (A w wersji 1, B w wersji N) w `tests/dane/icloud-dwa-urzadzenia.test.ts`; B ma wartość w nowej kolumnie, A zmienia inną kolumnę tego wiersza i wysyła; po odbiorze B wartość nowej kolumny bez zmian, a wyczyszczenie kolumny znanej A daje NULL na B. Kontrola repo: kolumna dodana do tabeli synchronizowanej po wersji 1 jest `NOT NULL` z `DEFAULT` albo ma wpis `od_wersji` (07, `jakosc:kontrole`).
- Pozycja listy kontrolnej: ARCH-08 (migracje), ARCH-22 (format danych poza SQLite: rekord iCloud).

## Opcje: zalety i wady
### A — zalety: niezależna od zachowania serwera; 1.0 bez zmian (brak pola = 1); jawna w kontrakcie · wady: pole w każdym typie rekordu i mapa w kontrakcie przy pierwszej takiej migracji; więcej kodu w odbiorze.
### B — zalety: zero kodu · wady: opiera się na zachowaniu, którego dokumentacja CKSyncEngine nie opisuje; gdy okaże się błędne, utrata wartości na nowszych urządzeniach bez sygnału.
### C — zalety: zero kodu i pól; prosta kontrola repo · wady: nie pozwala na kolumnę z „brakiem wartości” (np. data, termin); wartość domyślna musi mieć sens dla wierszy ze starszych urządzeń.
