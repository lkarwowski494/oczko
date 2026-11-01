# 0028. Kopia sprzed „Replace” to pełne archiwum `.oczko` w `Documents/Backup` (widoczne w Plikach); przywracanie zwykłym importem
Data: 2026-11-01 · Status: **przyjęta warunkowo** (rekomendacja 05; potwierdza koordynator wg P-087, zapis P-nr w `docs/decyzje.md`) · Rola: 05 (fix, partia 8, 07-jakosc-003) · Zależy od: ADR-0001, ADR-0004, ADR-0005, ADR-0019, ADR-0020, BR-DAN-006 S3, F-32

## Kontekst i problem
Po „Replace” aplikacja mówi „Merged”, a kopia sprzed importu leży jako surowy `przed-importem-<ms>.db` w `Application Support/kopie` (`src/dane/archiwum.ts:152-157`): niewidoczna w Plikach, bez przywracania z interfejsu (raport zgodności 07-jakosc-003). Gorzej: plik `.db` nie zawiera PDF-ów, zdjęć ani rysunków. „Replace” kasuje wiersze, a pliki bez odwołań sprząta `sprzatnijKosz` (`src/przypadki-uzycia/kosz.ts:59-70`), więc samo `.db` po kilku dniach wskazywałoby na pliki, których nie ma. Kopia, której nie da się odtworzyć, nie jest kopią (zasada wspólna 10).

## Czynniki decyzji
- Kopia ma być osiągalna dla użytkowniczki bez narzędzi (Pliki) i odtwarzalna istniejącą ścieżką importu (jeden kod, jedna migracja, jedna walidacja — ADR-0004).
- Kompletność: baza + pliki + manifest z SHA-256, jak eksport (ADR-0004), `integrity_check` przed spakowaniem (N12-12).
- Nieudana kopia przerywa „Replace” bez zmiany danych (już tak jest: `importuj` zwraca błąd `kopiaPrzed`, `src/przypadki-uzycia/archiwum.ts:49-51`).
- Rozmiar: do ok. 415 MB na kopię po 3 latach (ADR-0004, E0 §3), więc pula musi być ograniczona liczbą.
- `UIFileSharingEnabled` i `LSSupportsOpeningDocumentsInPlace` są już `true` (`app.json:59-60`), więc `Documents/` jest widoczny w Plikach bez zmiany konfiguracji.
- Analogia z Treningu (P-315): `safetyBackup('import')` zapisuje kopię w Plikach (`Documents/Backup`), w tym samym formacie co kopia po treningu (da się ją zaimportować), zawsze przed zastąpieniem, a nieudany zapis przerywa import (`lib/backup.ts:63-104`, repo `trening`, odczyt 2026-11-01).

## Rozważane opcje
- A. Archiwum `.oczko` (to samo co eksport) w `Documents/Backup`, nazwa `oczko-przed-importem-<RRRR-MM-DD>[-n].oczko`; przywrócenie = otwarcie pliku (Pliki → Oczko) i zwykły import.
- B. Zostawić `.db` w `Application Support/kopie` i dodać ekran „Przywróć kopię sprzed importu” z osobnym kodem przywracania z `.db` (+ ochrona plików przed sprzątaniem na 30 dni).
- C. Po „Replace” wymusić arkusz udostępniania (użytkowniczka sama zapisuje kopię), bez kopii w aplikacji.

## Decyzja
Wybrano „A”, ponieważ jedyna opcja spełnia naraz: kompletność (pliki), widoczność w Plikach bez nowego ekranu i odtwarzanie istniejącym importem; B wymaga drugiej ścieżki przywracania i wstrzymania sprzątania plików, C zostawia wynik w rękach użytkowniczki (pominięcie arkusza = brak kopii).

Kontrakt (wdraża 08, szczegóły i kryteria: `docs/architektura/partia-8-kontrakty.md` §1):
1. `PortArchiwum.kopiaPrzed()` woła tę samą ścieżkę co `zapisz` (VACUUM INTO + `kopiaZdrowa` + pliki + manifest + sprawdzenie miejsca), z katalogiem `Documents/Backup` (`Katalogi.kopiePrzed`) i przedrostkiem `oczko-przed-importem-`. Nigdy nie nadpisuje (przyrostek `-2`, `-3`, …, jak `zapisz`).
2. Kolejność w `importuj` bez zmian: sprawdzenie → wybór → (tylko „Replace”) kopia przed → wczytanie. Błąd kopii (`brak_miejsca`, `zapis`, `uszkodzony`) kończy import przed pierwszym zapisem do bazy; ekran pokazuje komunikat błędu, nie „Merged”.
3. Wynik „Replace” pokazuje stan `zastapiono` (`src/ekrany/Dane.tsx:40`, dziś nieużywany przez trasę `app/ustawienia.tsx:79`): nazwa pliku i miejsce w Plikach (klucz `dane.zastapiono`; teksty: rola 04).
4. Pula: `KOPIA_PRZED_IMPORTEM_MAKS = 2` najnowszych [OCENA 05: przy ok. 415 MB to najwyżej ok. 830 MB] i wiek ≤ `KOPIA_PRZED_IMPORTEM_DNI` (30, ADR-0004); starsze lub ponad limit są usuwane przy kamieniu milowym strażnika startu (ADR-0019), obok `sprzatnijKopie`. Funkcja wyboru jest czysta (jak `kopieDoUsuniecia`, `src/niezawodnosc/kopie.ts:21`), tyka tylko plików z regułą nazwy `^oczko-przed-importem-\d{4}-\d{2}-\d{2}(-\d+)?\.oczko$` i nie ruszy innych plików w `Documents/Backup`; data w przyszłości (cofnięty zegar) = zostaje.
5. Stare `przed-importem-*.db` nie powstają; wzorzec w `kopie.ts:15` zostaje (sprzątanie plików z buildów deweloperskich).

### Konsekwencje
- Dobre: kopia kompletna i widoczna; jeden kod importu; zero nowych ekranów poza tekstem wyniku; zgodne z Treningiem.
- Złe: do ok. 830 MB w `Documents` (wlicza się do kopii urządzenia iCloud; wykluczenie z kopii wymagałoby modułu natywnego, `isExcludedFromBackup` — poza zakresem, [DO USTALENIA] jeśli pomiar pokaże problem z limitem iCloud); „Replace” trwa dłużej (pakowanie ZIP przed zastąpieniem).
- Od czego zależy (decyzja warunkowa): potwierdzenie koordynatora; przy odrzuceniu — opcja B (wtedy 08 dodaje ekran przywracania i wstrzymuje sprzątanie plików).
- Przywrócenie przy włączonym iCloud: „Replace” jest odrzucany (ADR-0005), więc najpierw „Wyłącz iCloud” (`icloud.zastap_wylacz`); kopia powstaje dopiero wtedy.

### Potwierdzenie
- Testy 08/07: patrz `partia-8-kontrakty.md` §1 (K-03a–K-03g), w tym eksport → „Replace” z kopią → import kopii „Replace” = identyczne liczności i SHA-256 plików; kopia nie powstaje przy „Merge”; błąd zapisu kopii → baza bez zmian (`PRAGMA data_version`, liczności).
- Kontrola repo: brak `przed-importem-` z rozszerzeniem `.db` w kodzie tworzącym kopie (grep) — `kontrole-repo`.

## Opcje: zalety i wady
### A — zalety: kompletność, widoczność w Plikach, jeden kod importu, analogia z Treningu · wady: rozmiar w `Documents`, dłuższy „Replace”.
### B — zalety: bez pakowania ZIP, kopia szybka · wady: druga ścieżka przywracania, kopia bez plików (albo wstrzymanie sprzątania plików na 30 dni), ukryta w kontenerze.
### C — zalety: zero kodu poza arkuszem · wady: pominięcie = brak kopii, nie spełnia BR-DAN-006 S3 („kopia przed importem”).
