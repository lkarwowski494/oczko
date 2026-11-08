# E3 Praca w tle, błędy, prywatność, wydajność (rola 05-architekt, build) · 2026-10-22 · STOP E3 przyjęty (P-073: 9a, 10a; ADR-0016 bez weta)
Wejście: E2 przyjęte (P-072). Nowe pliki: [`prywatnosc.md`](prywatnosc.md), [`../adr/0016-zaleznosci-wersji-1.md`](../adr/0016-zaleznosci-wersji-1.md), [`narzedzia/granice.mjs`](narzedzia/granice.mjs) z testem, rejestr Apple 19a–19d, 20.

## 1. Praca w tle (moduł `tlo-i-sensory-ios`, w części)
| Powierzchnia | Strategia | Zawieszenie bez blokady pliku (`0xdead10cc`) | Gdy system odmówi |
|---|---|---|---|
| Live Activity: rząd, +1, stoper (F-11, F-21; ADR-0008) | start przy pierwszym +1 sesji albo starcie stopera, jeśli użytkownik ma włączone Live Activities (systemowy przełącznik, bez prośby); stan ≤ 4 KB; koniec po zakończeniu sesji, przy `SESJA_MAKS_H` = 8 h (P-072) albo przez system (8 h / 12 h, rejestr Apple 1a) | intencja dopisuje jedną linię z `fsync` pod `ProcessInfo.beginActivity`, bez SQLite; aplikacja scala przy pierwszym planie | Live Activities wyłączone → licznik w aplikacji bez zmian, komunikat w Ustawieniach (04); plik niedostępny po restarcie → „Odblokuj, aby liczyć” (ADR-0008) |
| Zegarek (F-12; ADR-0009) | `transferUserInfo` (kolejka) dla zdarzeń, kontekst dla stanu; zegarek działa bez telefonu | po stronie telefonu odbiór → kolejka zapisów (krótka transakcja); po stronie zegarka plik stanu, bez SQLite | brak sparowania / aplikacji na zegarku → stan F-58 jednym zdaniem |
| iCloud (F-27; ADR-0005) | `CKSyncEngine`, harmonogram systemowy, ciche powiadomienia (tryb `remote-notification`, rejestr Apple 19a, 19b) | zapis zmian z iCloud przez kolejkę w małych partiach (`PARTIA_SYNCHRONIZACJI` wierszy na transakcję) | brak konta / pełny iCloud → maszyna synchronizacji (`moduly.md`), dane lokalne bez zmian |
| Eksport, import, migracja z przebudową (ADR-0004) | tylko na pierwszym planie, pod `CzasWTle.chron` (`beginBackgroundTask`, rejestr Apple 17), dzielone na krótkie transakcje | `endBackgroundTask` w `finally`; przy wygaśnięciu: przerwanie po bieżącej partii, plik tymczasowy usuwany, baza spójna | komunikat „Eksport przerwany — spróbuj ponownie” (04) |
| Przejście aplikacji w tło | `AppState → background`: dokończenie kolejki, `PRAGMA wal_checkpoint(TRUNCATE)` (dane.md, kopia urządzenia), wyłączenie `EkranAktywny` | żadna transakcja nie czeka na sieć, timer ani okno (kontrola portu w trybie deweloperskim) | — |
Lokalizacja, dźwięk, `expo-background-task`: nie dotyczy (żaden przepływ kontraktu). Drabina uprawnień: jedyna prośba to aparat, w chwili pierwszego zdjęcia (nigdy przed „Dziś” ani przed pierwszym +1 z karty; NFR-PIE-001 po ZM-18, P-562).

## 2. Polityka błędów projektu
| Rodzaj | Przykład w Oczku | Zachowanie |
|---|---|---|
| Oczekiwany, z udziałem użytkownika | długość powtórzenia 0 (RD-12-W5), brak aparatu, brak miejsca na eksport, plik archiwum nowszej wersji, dzień ponad limit | stan z macierzy 04; wpisane dane zostają w formularzu; limit pokazany zawczasu (P-065 (1a)), nie jako błąd |
| Oczekiwany, systemowy | brak sieci przy imporcie strony WWW, iCloud bez konta, zegarek poza zasięgiem, Live Activities wyłączone | ponowienie systemowe (CloudKit, WatchConnectivity) albo przez użytkownika; stan jednym zdaniem (F-58) |
| Nieudany zapis danych użytkownika | `SQLITE_FULL`, błąd dysku, uszkodzona linia dziennika +1 | **nigdy cicho**: „Couldn’t save that row. It’s still on screen; try again.” (design-spec), wartość na ekranie do ponowienia, wpis w `blad`; pusty `catch` przy zapisie zakazany (kontrola w CI: lint `no-empty` + grep w `src/dane`) |
| Uszkodzona baza (`integrity_check ≠ ok` przy starcie) | awaria nośnika | aplikacja nie zapisuje; ekran „Dane wymagają naprawy” z eksportem kopii surowego pliku przez `VACUUM INTO` (jeśli możliwe) i importem ostatniego archiwum; wpis w `blad` [ekran: 04] |
| Baza nowsza niż aplikacja | powrót do starszej wersji z TestFlight | odmowa otwarcia do zapisu, komunikat „Zaktualizuj aplikację” (dane.md) |
| Nieoczekiwany | wyjątek w logice | granica błędu na poziomie ekranu (licznik zawsze odtwarzalny z bazy), wpis w `blad` bez treści projektów; raportowanie awarii: rola 12 |
Błędy domeny według **granicy walidacji** (fix-2 2026-10-25, P-118 Q1a, jak Trening: `MoveResult`/`ParseResult` jako wynik, wyjątek przy niezmienniku):
- **Wejście, które w normalnym działaniu może być złe** — wpis użytkowniczki, plik importu, rekord synchronizacji, linia dziennika +1, odpowiedź sklepu — daje **wartość**: `Wynik<T>` z `powod` albo nazwany wariant wyniku dziedzinowego (`blad` w `WynikScalenia`, `blad_danych` w `Klasyfikacja`). Taka funkcja nie rzuca.
- **Wejście, które z kontraktu nie może być złe** — wiersze bazy pod CHECK, stałe, dane już sprawdzone przez adapter albo przez funkcję z poprzedniego punktu — przy naruszeniu rzuca **`BladDanych`** (`src/domena/bledy.ts`, `kod = 'BLAD_DANYCH'`): to błąd programu, nie stan ekranu. Przypadek użycia łapie go po `kod`: w transakcji `ROLLBACK`, wpis w `blad`, ekran „Couldn’t save that row…”; poza zapisem granica błędu ekranu.
- `throw new Error` tylko dla stanu niemożliwego z konstrukcji (np. brak zdarzenia w mapie po sprawdzeniu w `scal`).
- Adaptery (`src/dane`, `src/platforma`) tłumaczą wyjątki bibliotek (SQLite, system plików, sklep) na `Wynik` z powodem (`zapis`, `brak_miejsca`, `uszkodzony`…); przypadek użycia nie przepuszcza wyjątku biblioteki do ekranu.
- Pytanie przy przeglądzie nowej funkcji: „skąd przychodzi wejście?”. Tabela funkcji partii 1: `moduly.md` „Funkcje domeny (sygnatury)”.

## 3. Budżety wydajności (pierwsza wartość = pomiar bazowy; cel ustala właściciel po pomiarze)
Urządzenie odniesienia: najstarszy wspierany iPhone — XR / XS (rejestr Apple 20). P-041: właściciel nie mierzy na telefonie, więc pomiar bazowy robi CI na symulatorze (proporcja, nie czas urządzenia), a czas urządzenia daje Xcode Organizer i MetricKit od testerów TestFlight i użytkowników po wydaniu (odczyt raportów: rola 10/12).
| Scenariusz | Budżet | Urządzenie | Dane | Miara | Metoda |
|---|---|---|---|---|---|
| Zimny start do pierwszej klatki licznika | <po pomiarze bazowym> | symulator iPhone XR / XS (CI); po wydaniu najstarsze urządzenia w Organizer | szacunek 3-letni intensywny (150 000 zdarzeń, 45 projektów, E0 §3) | p50 i p90 | XCTest `measure(metrics: [XCTApplicationLaunchMetric()])` w CI; Xcode Organizer, Launch Time (p50, p90) |
| Reakcja +1: stuknięcie → nowa wartość (NFR-WYD-001, OP-17 zamknięte) | p95 ≤ 100 ms z 20 stuknięć w stanie ustalonym, pierwsze stuknięcie informacyjnie (P-456, 2026-11-03; pomiar bazowy 07 E2 #142) | jw. | jw. | p95 z 20 powtórzeń | test UI w CI: znacznik czasu zdarzenia stuknięcia i pojawienia się nowej wartości (XCUITest + `os_signpost` w adapterze); zapas na symulator ustala 07 po pomiarze |
| Zapis +1 (transakcja: zdarzenie + licznik + dzień) | <po pomiarze bazowym> | jw. | jw. | p95 z 20 powtórzeń | pomiar w adapterze bazy w teście na symulatorze; odniesienie Linux: p95 0,37 ms (E1-1, nie budżet) |
| Zapytania głównych ekranów (lista, historia, kalendarz, dzień, dni limitu) | <po pomiarze bazowym> | jw. | jw. | p95 z 20 powtórzeń | `EXPLAIN QUERY PLAN` bez `SCAN` dużej tabeli (`sprawdz-schemat.mjs`, OK) + pomiar w aplikacji na symulatorze |
| Scalenie dziennika +1 przy starcie | <po pomiarze bazowym> | jw. | 500 linii dziennika [OCENA: sesja 8 h × ~1 rząd/min] | p95 | test na symulatorze |
| Eksport archiwum | <po pomiarze bazowym> | jw. | 415 MB plików (E0 §3) | czas całkowity, szczyt pamięci | test na symulatorze (Instruments Allocations w CI, jeśli runner pozwala; inaczej pamięć z `os_proc_available_memory`) |
| Sprawdzenie archiwum przy imporcie: SHA-256 (natywnie, P-130) i CRC-32 (TS) pliku 400 MB (fix-4 05, NZ-08-P3-05 (h)) | **do ustalenia po pomiarze na urządzeniu** (nazwany stan; liczby z laptopa ani symulatora nie są budżetem, zasada 9) | najstarszy iPhone z iOS 18 (TestFlight, właściciel/testerki) | archiwum z jednym PDF 400 MB | czas od „Importuj” do pytania o tryb, mediana i maksimum z 3 prób | plan `oczko-warsztat/08-programista/2026-10-26-partia3/pomiary-3E.md` pkt 1 (czas) i 2 (zgodność SHA-256 natywnego z TS: eksport → ponowny import przyjęty); odniesienie Node (V8, nie budżet): CRC-32 2,1–2,5 s, SHA-256 w TS 16–17 s. Po pomiarze: cel ustala właściciel; przekroczenie przez CRC-32 → CRC natywnie (P-130, nowy wiersz ADR-0016) |
| Bateria: sesja z Live Activity 1 h | <po pomiarze bazowym> | urządzenie użytkownika | sesja 1 h, ~60 rzędów | % na godzinę | MetricKit (`MXMetricPayload`, raporty dzienne) od testerów TestFlight; P-041: bez pomiaru ręcznego |
| Rozmiar pobrania | <po pierwszym buildzie> | — | — | MB | App Store Connect (rozmiar wariantu dla iPhone'a), ADR-0014 |

## 4. Lista kontroli automatycznych dla roli 07
1. `docs/architektura/narzedzia/granice.mjs src` w CI (domena bez frameworka, brak cykli, pliki ≤ 20 KB); test narzędzia: `granice-test/` (dobre → 0, złe → 4 naruszenia, kod 1).
2. `sprawdz-schemat.mjs` w CI przy każdej zmianie `schemat.sql`/migracji (32 kontrole, w tym stany ⊆ CHECK, UPSERT, kaskada, baza nowsza).
3. **Test migracji z kopii każdej wydanej wersji** (`tests/bazy/vN.db`, dane.md) z licznościami; 0.1.0 poza testem (P-070), test „stary plik nietknięty”.
4. `PRAGMA foreign_keys` odczytane w transakcji zapisu przez port bazy (adapter expo-sqlite na symulatorze i `node:sqlite` w Node) = 1.
5. Wektory domeny w Node: `wektory-limitu.json` (L-*, S-*, Z-*), `wektory-dostepu.json` (W-*), `scal-wektory.json` (M-01–M-08) + mutant „suma gałęzi”, RD-11–RD-17 z BRD; **te same wektory w XCTest** celów Swift (zegarek, intencja, ADR-0007).
6. Test właściwości `scal`: dowolna permutacja i powtórzenie dostarczeń → ten sam wynik.
7. Ścieżki utraty danych z `dane.md` (22 wiersze; każda ma test).
8. Kontrole repo: brak `INSERT OR REPLACE`, `withExclusiveTransactionAsync`, kopiowania ścieżki bazy, `import SQLite3` w Swift, odwołań do `Library/SQLite`, pustych `catch` w `src/dane`; `expo-iap` i `@bacons/apple-targets` przypięte dokładnie; tabela zależności ADR-0016 aktualna; manifesty `PrivacyInfo` porównane z `privacy-pliki-e3.txt`.
9. Workflow: sekrety `ASC_*` tylko w zadaniu z `environment: testflight`, brak wyzwalacza `pull_request` w tym workflow (ADR-0014).
10. Po `expo prebuild`: `IPHONEOS_DEPLOYMENT_TARGET = 18.0`; `UIBackgroundModes` = tylko `remote-notification`; `NSSupportsLiveActivities = true`; brak `NSPhotoLibraryUsageDescription`, jest `NSCameraUsageDescription`; reguła aktywacji rozszerzenia bez `TRUEPREDICATE`.
11. Audyt dostępności `performAccessibilityAudit` na ekranach PR-01–PR-05 (NFR-DOS-001, S-36).
12. NFR-PIE-001 (brzmienie po ZM-18, P-562): świeża instalacja, 1 stuknięcie w „+1” karty „Pierwszy licznik” na „Dziś” do pierwszego rzędu, 0 ekranów i arkuszy przed „Dziś”, +1 z karty bez zmiany ekranu, bez sieci, zakup tylko po stuknięciu (KP-10); także offline i 1. / ostatniego dnia miesiąca (L-01).
13. Budżety z sekcji 3: pomiar bazowy w CI zapisany jako artefakt; regresja ponad próg ustalony przez właściciela = błąd.
**Scenariusze tylko na urządzeniu (ryzyko szczątkowe, P-041 — bez kroku właściciela):** +1 z Live Activity przy zablokowanym telefonie (ZAL-030); restart bez odblokowania; zegarek poza zasięgiem z prawdziwym `transferUserInfo` (symulator nie obsługuje, rejestr Apple 4a); iCloud między prawdziwymi urządzeniami; bateria. Sprawdzenie po wydaniu: F-57, recenzje, MetricKit.

## Pytania produktowe
**Q9. Prośba o zgodę na aparat** (jedyna prośba o uprawnienie w aplikacji):
- (a) **W chwili pierwszego stuknięcia „Zrób zdjęcie”** (systemowe okno z tekstem 04); wybór z biblioteki działa bez zgody. **Rekomendacja.**
- (b) Bez aparatu w aplikacji, tylko wybór z biblioteki zdjęć: zero próśb, ale zdjęcie wzoru z książki wymaga wyjścia do aparatu systemowego (F-24 „aparatem”).

**Q10. Zdjęcia udostępniane z aplikacji (karta ukończenia, eksport pojedynczego zdjęcia)** — metadane lokalizacji:
- (a) **Zawsze bez lokalizacji** (karta renderowana od nowa; zdjęcie przed udostępnieniem bez EXIF GPS). **Rekomendacja** (NFR-PRY-001).
- (b) Oryginał bez zmian: wierność pliku, ryzyko ujawnienia miejsca zamieszkania.
Archiwum `.oczko` zawsze zawiera oryginały (to kopia użytkownika, P-071 (4a)).

## Dalej
E4: `docs/architektura/README.md` (szkielet z wzorców, indeks ADR), definicja ukończenia z dowodami punkt po punkcie, przekazanie do 09/06/07/08/10/12. Agent ok. 1 h; właściciel ok. 10 min.
