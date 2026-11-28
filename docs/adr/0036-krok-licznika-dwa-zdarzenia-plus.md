# 0036. Krok „+2”: jedno stuknięcie zapisuje dwa zdarzenia `plus` (łańcuch rodziców, ten sam czas); aplikacja grupuje je w „stuknięcie”; ustawienie `licznik.krok` w migracji 0002, lokalne w 1.0.2
Data: 2026-11-28 · Status: **proponowana** (do weta koordynatora wg P-087; P-1097) · Rola: 05 (fix AR1, ZM-24; KO-229, KO-232) · Uzupełnia: ADR-0008 (4), (8A), ADR-0009 (pkt 1–2), ADR-0005 · Zależy od: ADR-0027, ADR-0035, RD-13, RD-17, BR-LIC-011, P-067, P-1090 (4)

## Kontekst i problem
U6: ustawienie „Krok” w formularzu licznika (F-04, projekt 04). Przy kroku 2 przycisk dodaje 2 rzędy w aplikacji, na ekranie blokady i na zegarku. −1 zostaje −1. Zapis musi dawać tę samą liczbę na urządzeniu z 1.0.1, które dostaje zdarzenia przez iCloud (ADR-0008 (4): czytelnik pomija nieznane pola). Wymagania z paczki 05:
- strażnik tempa (RD-17) nie uznaje jednego „+2” za serię;
- cofnięcie z historii cofa całe stuknięcie;
- przypomnienia według reguły skoku RD-13;
- cel części (F-08, BR-LIC-011) działa przy przeskoczeniu celu.

## Czynniki decyzji
- **Zgodność wstecz z 1.0.1, sprawdzona w kodzie:**
  - odbiór iCloud pomija kolumny nieznane odbiorcy (`src/dane/repozytoria/icloud.ts:133`);
  - `scal` odrzuca `plus` z wartością (`zla_wartosc`, `src/domena/scal.ts:34-38`) i nieznany rodzaj (`nieznany_rodzaj`);
  - `zdarzenie.rodzaj` ma zamkniętą listę w CHECK (`docs/architektura/schemat.sql:73`).
- Bez nowego pola CloudKit. Wdrożenie schematu do Production to krok właściciela w konsoli (ADR-0005), a paczka 05 wyklucza zmiany iCloud poza zgodnością zdarzenia.
- Reguły limitu bez zmian: dzień zaczyna pierwsze zdarzenie dodające (P-067). Jedno stuknięcie to jedna decyzja limitu.
- Bezpiecznik 2 (P-1090 (4)): U6 przechodzi na 1.0.3 tylko wtedy, gdy zapis jest błędnie czytany przez starszą wersję i nie ma bezpiecznego wariantu w 1 sesji 08.

## Rozważane opcje zapisu
- **(a)** Jedno zdarzenie `plus` z nowym polem `krok`. Urządzenie 1.0.1 pomija pole i liczy +1, czyli **cicho zła liczba**. Wymaga też pola CloudKit.
- **(a′)** Jedno `plus` z `wartosc = 2`. W 1.0.1 CHECK (`wartosc IS NOT NULL` tylko dla ustawień, `docs/architektura/schemat.sql:84`) odrzuca wiersz (`icloud_zapis_rekordu`), a każde późniejsze zdarzenie licznika czeka na rodzica. Licznik na 1.0.1 staje.
- **(b)** Dwa zdarzenia `plus`: drugie ma za rodzica pierwsze, oba mają ten sam `czas_ms`, źródło i urządzenie.
- **(c)** Jedno `wpisanie` z wartością przed + 2. Zgodne z 1.0.1, ale:
  - jest nieprzemienne, więc nieaktualny stan Live Activity kończy się arkuszem konfliktu (ADR-0035 reguła 5);
  - strażnik nie widzi serii „+2”;
  - historia pokazuje „wpisano 12” zamiast „+2”.
- **(d)** Nowy rodzaj zdarzenia. W 1.0.1 CHECK odrzuca wiersz i licznik staje, jak w (a′).

## Decyzja
**Wybrano (b).** Tylko (b) i (c) dają tę samą liczbę na 1.0.1. (b) jest przemienne, więc sumuje się po rozwidleniu (ADR-0035, SC-05), i nie zmienia formatu linii dziennika, rekordu iCloud ani kontraktu zegarka. **Bezpiecznik 2 nie zachodzi:** starsza wersja czyta zapis poprawnie (dwa +1). Ryzyko terminu omawia sekcja „Podział pracy 08”.

**Stuknięcie** (czysta funkcja `stukniecia`, wektory ST-01…ST-08). Zdarzenie `plus` dołącza do stuknięcia swojego jedynego rodzica, gdy spełnione są wszystkie warunki:
- rodzic jest `plus`;
- ma ten sam `czas_ms`, `zrodlo` i `urzadzenie`;
- stuknięcie rodzica ma mniej niż `KROK_MAKS` (= 2) zdarzeń i kończy się na tym rodzicu.

Pozostałe zdarzenia tworzą stuknięcie jednoelementowe. Dwa ręczne stuknięcia w tej samej milisekundzie z jednego źródła i urządzenia są niemożliwe w praktyce: zapisy idą przez kolejkę zapisów (ADR-0002) albo kolejkę szeregową `DziennikPlus`. Nawet wtedy skutkiem jest tylko wspólny wpis w historii, liczba się nie zmienia.

**Kontrakt dla 08 (TS, `src/domena` + przypadki użycia):**
1. **Zapis w aplikacji:** `dodajRzad` przy `licznik.krok = k` dopisuje k zdarzeń `plus` w jednej transakcji kolejki: rodzic i-tego = (i−1)-te, ten sam `czas_ms` (jedno `zegar.teraz()`), `wartosc_po` kolejno +1. Limit: jedna decyzja `startDnia` dla stuknięcia. Wiersz `dzien_limitu` wskazuje pierwsze zdarzenie (`zdarzenie_id`).
2. **Historia:** wpis na stuknięcie („+2”, czas stuknięcia). Teksty: 04/09.
3. **„Cofnij”** (`cofnijOstatnie`): cel = ostatnie stuknięcie z niecofniętym zdarzeniem (`celCofnieciaStukniecia`, CO-01…CO-04). `cofniecie.cofa` = jego niecofnięte zdarzenia, `wartosc` = wartość po rodzicu pierwszego z nich (jak `wartoscPrzed`). 1.0.1 czyta `cofa` z wieloma id, bo tak zapisuje już `cofnijSerie`.
4. **Strażnik tempa (RD-17):** `serieDoSprawdzenia` dostaje stuknięcia, nie zdarzenia (SE-01…SE-04). Seria = `STRAZNIK_SERIA_ZDARZEN` stuknięć w `STRAZNIK_OKNO_S`. Baner podaje liczbę rzędów (suma kroków), a cofnięcie serii obejmuje wszystkie zdarzenia (`cofnijSerie` bez zmian: seria zdarzeń od końca).
5. **Sygnały po zmianie** (`src/kompozycja/licznik-zdarzenia.ts`): `zdarzeniaPlus` dostaje `przed`. Cel części = `przed < cel ≤ po`, koniec powtórzenia = `⌊po/d⌋ > ⌊przed/d⌋` (SK-01…SK-09; dziś `wartosc === cel` i `wartosc % d === 0` gubią skok, `src/kompozycja/licznik-zdarzenia.ts:18-20`). Przypomnienie: `sygnalZmiany(przed, po)` już obsługuje skok (`przypomnienia.ts`, RD-13 W20–W25). Wołający podaje wartość sprzed stuknięcia, nie `po − 1`.
6. **−1** zostaje −1 przy każdym kroku (IN-04). Wpisanie i zerowanie bez zmian.

**Kontrakt dla 08 (Swift: `OczkoReguly`, `OczkoDziennik`, widżet, zegarek):**
1. **Stan v3** dostaje pole `krok` (liczba 1–2). **Wyjątek nazwany od X-ST-01** (jak `uwaga`, ADR-0008 fix-4): brak klucza = 1. Live Activity uruchomiona przez 1.0.1 żyje do 8 h bez pola (rejestr Apple 1a), a zegarek z dekoderem v3 pomija nieznany klucz i liczy +1. `WERSJA_STANU` zostaje 3: podniesienie do 4 odcięłoby zegarek z dekoderem v3 od stanu do czasu aktualizacji. Złote pliki `tests/wspolne/stan-*.json` dostają wariant z `krok: 2` i bez pola.
2. **`stuknij(_:krok:stan:...)`** dla `plus` składa k decyzji na stanie pośrednim, wszystko albo nic (IN-01…IN-03, IN-10, IN-11):
   - limit sprawdza się raz, przed pierwszym zdarzeniem;
   - linie mają łańcuch rodziców i ten sam `czasMs`;
   - stan po: `wartosc + k`, `glowa` = ostatnia linia, `ostatniPlusMs` = czas.

   Dla `minus` krok jest pomijany.
3. **`DziennikPlus.dopisz(_ linie: [ZdarzenieWejsciowe])`:** wszystkie linie jednym `write` z `O_APPEND`, każda zakończona `\n`, potem `fsync` (ADR-0008 (8A) rozszerzone z jednej linii na kilka). Krótki zapis albo błąd: `ftruncate` do rozmiaru sprzed zapisu, czyli żadna linia stuknięcia nie zostaje. Stan Live Activity zmienia się dopiero po `fsync`. Ta sama funkcja zapisuje do skrzynki zegarka (ADR-0009 pkt 1–2). Wektory bajtów: `tests/wspolne/wzorce.json` → `dopisanie` (nowy D-04: dwie linie jednym zapisem) i XCTest X-DZ (07).
4. **Zegarek:** każda linia to osobny `transferUserInfo` (bez zmian kontraktu). Telefon może scalić najpierw jedną, potem drugą i chwilowo pokazać +1. Liczba się wyrównuje, bo kolejka jest uporządkowana i potwierdzenie idzie po `id`.
5. **Haptyka zegarka:** wzorzec przypomnienia, gdy `przypomnienieSkoku(przed, po) != nil` (PS-01…PS-07, ta sama reguła co `przypomnienieWpisania(przed + 1, po + 1)` w TS — kontrola krzyżowa w `sprawdz.mjs`). Dziś decyduje pas po stuknięciu (`modules/oczko-reguly/Sources/OczkoDziennik/Haptyka.swift:31`), co gubi rząd przeskoczony przez „+2”.
6. **Przycisk** „+1”/„+2” w Live Activity i na zegarku według `krok` ze stanu. Wygląd i teksty dostępności projektuje 04, tłumaczenia 09.

### Ustawienie `krok` — miejsce zapisu (opcje)
- **K1 (rekomendacja):** kolumna w `licznik`, migracja 0002, **lokalna w 1.0.2** (`icloud-tabele.json`: `licznik.pomin` += `"krok"`):
  ```sql
  -- src/dane/migracje/0002.sql (zwykła migracja w transakcji; ADD COLUMN nie wymaga 12 kroków)
  ALTER TABLE licznik ADD COLUMN krok INTEGER NOT NULL DEFAULT 1 CHECK (krok IN (1, 2));
  ```
  `WERSJA_SCHEMATU = 2`; `schemat.sql` i `dane.md` dostają kolumnę; `zrobPonownie` (`src/przypadki-uzycia/projekt.ts:132-137`) kopiuje `krok` jak `znaczenie`. Wyzwalacz `licznik_icloud_u` ma jawną listę kolumn bez `krok`, więc zmiana kroku nie trafia do skrzynki iCloud.

  Próba na kopii `tests/bazy/v1.db` (scratchpad AR1, `node:sqlite` 3.54.1):
  - liczności wszystkich tabel bez zmian;
  - `integrity_check = ok`, `foreign_key_check` pusty;
  - `user_version` 1 → 2;
  - 9/9 liczników ma `krok = 1`;
  - `krok = 3` odrzucony przez CHECK;
  - wyzwalacz iCloud nie reaguje na `krok`.

  Spełnia ADR-0027 C (`NOT NULL DEFAULT`). Rekord z kolumną z `pomin` nie jest odrzucany (ADR-0027 (3)), więc późniejsza synchronizacja kroku nie zepsuje 1.0.2.

  Koszt:
  - pierwsza migracja po wydaniu (runner i test na kopii są gotowe: `migracje-wydanych.test.ts`, ARCH-09);
  - archiwum i kopia ratunkowa z 1.0.2 są w 1.0.1 odrzucane czytelnym `wersja_nowsza` (`src/dane/archiwum.ts:147`), jak każda baza nowsza;
  - krok nie przechodzi na iPada przez iCloud do czasu decyzji o synchronizacji (osobne pole CloudKit + krok właściciela).
- **K2:** mapa `licznik → krok` w `ustawienie` (JSON), bez migracji. Wady: stan licznika poza licznikiem, wpisy osierocone po usunięciu licznika, a stan urządzenia jest pomijany przy imporcie (dane.md), więc kopia nie przywraca kroku.
- **K3:** K1 z synchronizacją. Wymaga pola `krok` w `cloudkit/schemat.ckdb` i wdrożenia Development → Production przez właściciela przed wysyłką buildu. Jeśli wdrożenie nie nastąpi, zapis rekordu `Licznik` z nieznanym polem w Production się nie uda (ryzyko dla całej synchronizacji liczników). Poza zakresem paczki 05.

**Wybór K1** (do weta koordynatora, P-087): dane licznika w licznikach (CHECK, kaskada, kopia), zero zmian iCloud, gotowa infrastruktura migracji.

### Podział pracy 08 i ryzyko terminu
Szacunek paczki (1–1,5 dnia agenta, ryzyko wysokie) zostaje [OCENA]. Rekomendacja: dwie sesje 08.
- **08-A (TS):** migracja 0002 z testem na v1, `stukniecia`, cofanie, strażnik, sygnały, ścieżka aplikacji, formularz po makiecie 04.
- **08-B (Swift):** stan `krok`, `stuknij` z krokiem, `dopisz` wielu linii, zegarek, haptyka.

Zapis jest zgodny wstecz w obu fazach. Gdyby 08-B nie zmieściła się w 1.0.2, opcja dla koordynatora (decyzja produktowa): 1.0.2 z krokiem tylko w aplikacji, a ekran blokady i zegarek uczciwie pokazują „+1”. Bezpiecznik 2 nie jest do tego potrzebny.

### Konsekwencje
- Dobre:
  - poprawna liczba na każdym urządzeniu i w każdej wersji;
  - format linii dziennika, rekordy iCloud i kontrakt zegarka bez zmian;
  - „+2” z nieaktualnego ekranu blokady sumuje się (ADR-0035).
- Złe:
  - grupowanie zależy od reguły (czas, źródło, urządzenie, rodzic), a nie od jawnego pola;
  - 1.0.1 pokazuje w historii dwa wpisy +1 i cofa po jednym;
  - pierwsza migracja schematu po wydaniu.
- Od czego zależy: projekt 04 (ustawienie, przycisk, historia), wybór K1/K2 przez koordynatora.

### Potwierdzenie
- Wektory ST, SE, CO, SK, PS, IN w `docs/architektura/wektory-1-0-2.json`; `node docs/architektura/eksperymenty/1-0-2/sprawdz.mjs` → kod 0, 14 mutantów zabitych (`sprawdz.out`). PS ma drugą wyrocznię w kodzie aplikacji (`przypomnienieWpisania`).
- Test migracji 0002 na kopii `tests/bazy/v1.db` (ARCH-09: liczności, `integrity_check`, `foreign_key_check`, `user_version`, drugie uruchomienie bez zmian, `krok = 1` dla istniejących).
- Test zgodności wstecz (07): baza w wersji 1 (schemat 1.0.1) dostaje przez odbiór iCloud dwa zdarzenia `plus` „+2” z bazy w wersji 2 → `scal` zgodny, wartość +2. Rekord `Licznik` z polem `krok` stosowany bez błędu (pole pominięte).
- PU (07): nowy B „krok 2 → +2 → wartość +2; jedno »Cofnij« cofa +2; strażnik nie pyta po jednym +2; cel części przy przeskoczeniu”. Nowy F „+2 na ekranie blokady i zegarku” (lista testu F 1.0.2).
- Pozycje listy kontrolnej: ARCH-08, ARCH-09 (migracja), ARCH-02 (jedna lista kroków: CHECK i stała `KROK_MAKS` z jednej definicji, `STANY` jak dla statusów).

## Opcje: zalety i wady
### (a) — zalety: jedno zdarzenie · wady: cicho zła liczba na 1.0.1; pole CloudKit.
### (a′) / (d) — zalety: jawne · wady: licznik staje na 1.0.1 (CHECK, czekanie na rodzica).
### (b) — zalety: zgodne wstecz; przemienne; bez zmian formatu · wady: grupowanie regułą; dwa wpisy w historii 1.0.1.
### (c) — zalety: jedno zdarzenie, zgodne wstecz · wady: nieprzemienne (arkusz po rozwidleniu); strażnik nie widzi serii; historia „wpisano”.
