# 0029. Preferencje urządzenia (wibracje, ekran nie gaśnie, układ miar) w tabeli `ustawienie`, jako stan urządzenia, wczytywane do migawki przy starcie
Data: 2026-11-01 · Status: **przyjęta** (P-328, koordynator wg P-087, 2026-11-01) · Rola: 05 (fix, partia 8, 07-jakosc-004) · Zależy od: ADR-0001, ADR-0005, ADR-0017, dane.md „Klucze tabeli `ustawienie`”, BR-LIC-020 S3, BR-LIC-013 S2, BR-KAL-003 S6, ZM-02

## Kontekst i problem
Trzy preferencje z Ustawień nie przetrwają restartu albo nie istnieją: wibracje są w pamięci procesu (`src/kompozycja/preferencje.ts:1-7`, komentarz czeka na klucze od 05), „ekran nie gaśnie” jest zaszyty na stałe (`src/kompozycja/licznik.ts:240`: `ekranWlaczony: true`), a wiersza „Units” nie ma (`src/kompozycja/miary.ts:1`: preferencja zawsze `'auto'`). Port `MagazynPreferencji` w `src/i18n/i18n.ts:8` już zakłada klucze `jezyk` i `uklad_miar` w tabeli `ustawienie`.

## Czynniki decyzji
- Tabela `ustawienie` istnieje w schemacie (`schemat.sql:235`, `STRICT`, `wartosc` z `json_valid`): nowy klucz to nowy wiersz, nie zmiana schematu — migracja niepotrzebna (zasada wspólna 10 spełniona przez brak zmiany DDL; test na kopii bazy mimo to, K-04e).
- Jedno miejsce na małe preferencje urządzenia (zasada „najprostsza architektura”); `jezyk` już tak działa.
- Preferencje dotyczą urządzenia (zegarek i telefon wibrują inaczej; iPad i iPhone mają inne nawyki ekranu), nie danych o robótkach.
- Zapis nie może być cichy (ARCH-18) i nie może czekać na nic poza bazą (ADR-0002).

## Rozważane opcje
- A. Klucze w `ustawienie`, stan urządzenia (poza iCloud, pomijany przy imporcie „Replace” i „Merge”), migawka w pamięci wczytana raz przy starcie.
- B. Te same klucze, ale rekordy synchronizacji iCloud (jak `okno_uczciwe_zasady_widziane`).
- C. Magazyn poza bazą (UserDefaults / pamiętnik klucz–wartość).

## Decyzja
Wybrano „A”, ponieważ wibracje, ekran i miary są cechą urządzenia (tak samo jak `jezyk`, P-190), a B dodałoby rekordy do kontraktu CloudKit (nieodwracalne po wdrożeniu schematu, P-320) bez dowodu wartości; C tworzy drugi magazyn (ADR-0001) i nie trafia do kopii urządzenia razem z bazą.

Klucze (do dopisania w `dane.md`, już dodane w tej sesji; `KluczUstawienia` i `KLUCZE_URZADZENIA` uzupełnia 08):
| Klucz | Wartość (JSON) | Domyślnie | Uszkodzony zapis |
|---|---|---|---|
| `wibracje` | `true` / `false` | `true` | = domyślna |
| `ekran_nie_gasnie` | `true` / `false` | `true` | = domyślna |
| `uklad_miar` | `"auto"` / `"metric"` / `"imperial"` | `"auto"` | = `"auto"` |

Kontrakt (08; kryteria K-04a–K-04g w `partia-8-kontrakty.md` §2):
1. Odczyt: `wczytajPreferencje(tx)` raz w `uruchomDane` po migracji, przed pierwszym renderem ekranów licznika i narzędzi; migawka `preferencje().stan()` pozostaje synchroniczna dla haptyki i licznika.
2. Zapis: przypadek użycia `ustawPreferencje(z, patch)` — walidacja, UPSERT (`zapiszUstawienie`, ON CONFLICT DO UPDATE) przez kolejkę portu; migawka zmienia się dopiero po COMMIT; błąd zapisu = istniejący komunikat `licznik.blad_zapisu`, przełącznik wraca do poprzedniej wartości.
3. Użycie: haptyka (`wibracje === false` → brak wibracji dla rzędu, przypomnienia, końca powtórzenia, celu dnia; BR-LIC-020 S3), ekran licznika (`ekran_nie_gasnie === false` → `EkranAktywny.wlacz` nie jest wołane, BR-LIC-013 S2), `imperialny()` przez `ukladMiar(pref, miaraSystemowa())` (BR-KAL-003 S6). Dane zostają w mm/g (ADR-0017); preferencja zmienia tylko wyświetlanie i wpisywanie.
4. „Usuń wszystkie dane” kasuje także te wiersze (`KOLEJNOSC_USUWANIA`, `src/przypadki-uzycia/projekt.ts:158`), więc migawka jest przeładowana do wartości domyślnych w tym samym przypadku użycia [OCENA 05: reset aplikacji = ustawienia domyślne]. Import „Replace” i „Merge” ich nie dotykają.
5. Wiersze w Ustawieniach (etykiety, kolejność): rola 04.

### Konsekwencje
- Dobre: bez migracji i bez zmiany kontraktu iCloud; testowalne w Node na prawdziwym SQLite; trwałe po restarcie.
- Złe: preferencje nie podążają za kontem (nowe urządzenie zaczyna od domyślnych — jak język); migawka wymaga wczytania przed pierwszym renderem (kolejność startu).
- Od czego zależy (decyzja warunkowa): potwierdzenie koordynatora; wariant B (iCloud) dopiero po P-nr właściciela i przed wdrożeniem schematu CloudKit.

### Potwierdzenie
- Testy K-04a–K-04g (m.in. restart: zapis → nowy kontener → odczyt; brak klucza na kopii `v1.db` → domyślne bez zapisu; import archiwum z tymi kluczami nie zmienia kluczy urządzenia).
- `sprawdz-schemat.mjs` bez zmian (brak DDL); tabela kluczy w `dane.md` zawiera trzy nowe wiersze (kontrola ręczna roli 07 przy audycie).

## Opcje: zalety i wady
### A — zalety: brak migracji, jedno miejsce, spójne z `jezyk` · wady: brak podążania za kontem.
### B — zalety: preferencje na wszystkich urządzeniach · wady: rekordy CloudKit (schemat nieodwracalny po wdrożeniu), konflikty między urządzeniami o charakterze urządzenia.
### C — zalety: czytelne bez bazy (np. w razie awarii bazy) · wady: drugi magazyn, brak w archiwum/kopii bazy.
