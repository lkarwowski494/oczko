# E4 Przekazanie (rola 05-architekt, build) · 2026-10-22 · STOP E4 przyjęty (P-074) przyjęty (P-074)
Wejście: E0–E3 przyjęte (P-070–P-073). README architektury: [`README.md`](README.md). Dowody uruchomione razem: [`narzedzia/e4-dowody.out`](narzedzia/e4-dowody.out) (2026-10-22T19:29Z).

## Definicja ukończenia (build), punkt po punkcie
| Punkt kontraktu roli | Stan | Dowód |
|---|---|---|
| Każdy moduł, tabela, uprawnienie i zależność natywna wynika z przepływu w kontrakcie zakresu | spełnione | tabele: 18/18 z odniesieniem F-/BR-/ADR- w `schemat.sql` (`e4-dowody.out`); uprawnienia i tryby: `prywatnosc.md` „Uprawnienia i tryby” (każde z przepływem, tylko `remote-notification` dla F-27); zależności: ADR-0016 (kolumna „Przepływ”); moduły: `moduly.md` (drzewo z F-/ADR-); funkcje PÓŹNIEJ bez tabel (`dane.md`) |
| Każdy ADR: data, status, ≥ 2 realne opcje, konsekwencje, „Potwierdzenie”; ADR o przechowywaniu z wariantem bez relacyjnej bazy | spełnione | `kontrola-adr.mjs docs/adr` → 16/16 OK, kod 0; kontrola negatywna kod 1 (`eksperymenty/e1/`); ADR-0001: JSON (zmierzony E1-1), klucz-wartość, BLOB |
| Rejestr ograniczeń: każdy limit z adresem, cytatem i datą odczytu z dnia pracy | spełnione z otwartymi | `rejestr/apple.md` (wiersze do 20), `expo.md`, `sqlite.md`, odczyt 2026-10-22; tezy decydujące sprawdzone przez rolę 05 w pobranych plikach i w kodzie paczki; wiersze bez źródła oznaczone [DO USTALENIA] z adresami sprawdzonymi (np. apple 1g sprzeczność, 4e, 9b, 15d) |
| SQLite: schemat uruchomiony (komenda + kod), integrity_check = ok, foreign_key_check pusty, test kaskady i UPSERT | spełnione | `node --no-warnings docs/architektura/narzedzia/sprawdz-schemat.mjs` → 32/32, kod 0; kontrola negatywna 3 błędy, kod 1 |
| Polityka migracji (12 kroków, test na kopii każdej wydanej wersji), kopii (`VACUUM INTO`) i eksportu (wersja, odrzucenie nowszej) | spełnione | `dane.md` „Polityka migracji”, „Kopie i eksport”; runner w `sprawdz-schemat.mjs`: baza nowsza odrzucona, migracja łamiąca CHECK wycofana; eksperymenty B i D (E0); wyjątek nazwany dla 0.1.0 (P-070, ADR-0015) |
| Tabela ścieżek utraty danych: każda ścieżka ma zabezpieczenie i test | spełnione | `dane.md` „Ścieżki utraty danych”: 22 wiersze, każdy z testem (część jako ryzyko szczątkowe z testem zastępczym, P-041) |
| Jedna lista parametrów konfiguracyjnych z jednostkami i źródłem lub [DO USTALENIA] | spełnione | `moduly.md` „Konfiguracja”: 17 pozycji (2 × [DO USTALENIA] z właścicielem: 06, P-038; 3 × [OCENA] do korekty po pomiarze) |
| Każdy budżet wydajności ma urządzenie, dane, percentyl i metodę; brak liczb bez pomiaru | spełnione | `e3-…md` §3: 8 scenariuszy, wartości „po pomiarze bazowym” (P-041: CI na symulatorze + Organizer/MetricKit); liczby z Linuksa oznaczone jako proporcja, nie budżet |
| Inwentarz prywatności i kategorie required reason API przekazane roli 10 | spełnione | `prywatnosc.md` (inwentarz, uprawnienia, 9 manifestów zależności, kody aplikacji) |
| Lista kontroli automatycznych dla roli 07 | spełnione | `e3-…md` §4: 13 kontroli + scenariusze tylko na urządzeniu; narzędzia gotowe: `granice.mjs` (test: 0 / 1), `sprawdz-schemat.mjs`, `kontrola-adr.mjs`, `scal-test.mjs` 8/8, `limit-test.mjs` 35/35 |
| Wymiary pokrycia (10) | przejrzane | krytyczność i cykl życia: `dane.md`; migracje, kopie, eksport: `dane.md`, ADR-0004; tło i sensory: `e3-…md` §1 (lokalizacja i dźwięk: sprawdzone, brak); offline i synchronizacja: ADR-0005, `scal`; prywatność: `prywatnosc.md`; budżety: `e3-…md` §3; bezpieczeństwo i sekrety: ADR-0014, `prywatnosc.md` „Sekrety”, klasa ochrony plików ADR-0001; konfiguracja: `moduly.md`; awarie: `e3-…md` §2; limity platformy: rejestr |

## Przekazanie do następnych ról
### Przekazanie do następnej roli
- Zakończono: 05-architekt, build, E0–E4 (P-070–P-073), gałąź `claude/jolly-thompson-paz6d8`; artefakty: `docs/architektura/` (README, e0–e4, rejestr/, eksperymenty/, moduly.md, dane.md, schemat.sql, stany.json, prywatnosc.md, narzedzia/), `docs/adr/0001–0016`; prompt i kopie źródeł: `oczko-warsztat/05-architekt/2026-10-22-build/`.
- Aplikacja ma 35 lokalizacji (D-026, P-009), więc następny krok ścieżki (P-002): **09-lokalizacja Lokalizacja**, tryb `build`, **tylko E0–E1** (decyzja o językach i mechanizm i18n przed ekranami); nowa sesja: sonnet, wysiłek medium.
- Polecenie:
  - `node tools/assemble.mjs 09-lokalizacja --tryb build --galaz claude/jolly-thompson-paz6d8`
  - `.\Get-Prompt.ps1 09-lokalizacja -Tryb build -CopyToClipboard`
- Potem (P-002, P-005): **12 E0–E1** (niezawodność: kopie, tryb awaryjny — przed 07 i 08) → **06-tresci** build (opus, high) → **07** build → porównanie z istniejącym kodem → 08.
- Paczka wejściowa: `docs/architektura/README.md` i pliki z niego; `docs/adr/`; `docs/scope-contract.md`; `docs/design/design-spec.md`; `docs/monetyzacja/limit.mjs`, `dostep.mjs` z wektorami.
- Co czyta każda rola:
  - **09:** `expo-localization` (ADR-0016) jako źródło języka urządzenia; mechanizm i18n do wyboru przez 09 (nowy wiersz ADR-0016); teksty w celach Swift (Live Activity, zegarek, rozszerzenie) też lokalizowane — katalog wspólny z aplikacją [do decyzji 09]; formaty dat i liczb (RD-16: dzień lokalny).
  - **12:** `dane.md` (ścieżki utraty danych, kopie, migracje), ADR-0004, ADR-0005, ADR-0008, polityka błędów (`e3-…md` §2, ekran „Dane wymagają naprawy”), tabela `blad` jako diagnostyka; raportowanie awarii do decyzji 12 (koszt 0 zł, prywatność).
  - **06:** format treści: liczby obliczeń F-38 i tabela drutów RD-11 jako parametry `[DO USTALENIA]` w `konfiguracja.ts` (`moduly.md`), kolumna `obliczenie.wersja_regul` wskazuje wersję rejestru; brak pakietów treści (moduł `pakiety-tresci` nie dotyczy).
  - **07:** lista kontroli (`e3-…md` §4), ścieżki utraty danych (`dane.md`), wektory (`limit`, `dostep`, `scal`), narzędzia w `docs/architektura/narzedzia/`; wspólne wektory TS i Swift (ADR-0007); scenariusze tylko na urządzeniu jako ryzyko szczątkowe.
  - **08:** kolejność wdrożenia: (1) domena (`limit`, `dostep`, `scal`, licznik, maszyny) z testami w Node, (2) dane: port bazy, kolejka, migracje, repozytoria, pliki, archiwum — testy na `node:sqlite`, (3) adaptery platformy i moduły Swift (dziennik +1, zegarek, iCloud, PencilKit, czas w tle), (4) ekrany według `docs/design/`; kolejność funkcji z kontraktu („Kolejność budowy MVP”). Kod poprzedniej wersji tylko jako materiał (P-004) po kroku porównania.
  - **10:** `prywatnosc.md` (manifest, App Privacy, OP-25, „collected” dla CloudKit), ADR-0014 (rola klucza ASC API, wariant podpisu, środowisko `testflight`), `NSCameraUsageDescription` z tekstem 04, P-038.
- Otwarte decyzje: lista [DO USTALENIA] w `README.md` §6; dla właściciela tylko P-038 (ID produktu Pro, Family Sharing) przy konfiguracji App Store Connect.
- Kwarantanna (P-003, P-015) obowiązuje role 01–04; 05 czytała kod 0.1.0 tylko jako materiał (P-004).
