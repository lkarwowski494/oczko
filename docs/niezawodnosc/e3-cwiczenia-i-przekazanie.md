# E3 Ćwiczenia, runbook i przekazanie (rola 12, build) · 2026-10-26 · STOP E3
Wejście: STOP E2 przyjęty (koordynator wg P-087: P-194, Q1a–Q5a; verify 1974/1974 na 010b52a). Bez maszyn macOS (P-187): ćwiczenia automatem na Linuksie, scenariusz E2E 09 z ostatniego przebiegu 08.

## 1. Ćwiczenia (wynik i data: `runbook.md` §6)
`tests/niezawodnosc/cwiczenia.test.ts` (7 testów, w każdym `verify`): prawdziwy kod startu i trybu awaryjnego (`src/kompozycja/start-aplikacji.ts`), prawdziwy dysk i SQLite, awarie przez SIGKILL osobnego procesu.
| Ćwiczenie | Wynik | Nowe obserwacje |
|---|---|---|
| 1. Pętla awarii | 3. start awaryjny, kolejny też; archiwum z licznościami; surowa kopia = bajty oryginału; „Spróbuj normalnie” + kamień → normalny | **N12-11:** „Zapisz kopię danych” otwiera bazę do zapisu, a zamknięcie robi checkpoint: plik `.db` zmienia bajty, `-wal` znika. Dane są logicznie te same (liczności równe), surowa kopia jest zrobiona wcześniej. Scenariusz E2E 09 porównuje SHA samego `.db` i przechodzi. Przyczyna [DO USTALENIA] (możliwe, że WAL był już pusty po zamknięciu procesu na symulatorze). |
| 2. Zepsuty plik bazy | strona 2 uszkodzona → `uruchomDane` = `zapis` → ekran awaryjny; archiwum = `null`; ZIP surowej kopii, SHA-256 zgodne | **N12-13:** sonda na stronach 2, 3, 4, 6, 10. Przy 3, 6 i 10 start danych przechodzi (`ok`), a uszkodzenie wyjdzie dopiero przy odczycie tej tabeli. Decyzja ADR-0019 (sprawdzenie po błędzie) zostaje (pomiar niżej). |
| 3. Brak miejsca | ENOSPC przy surowej kopii → `brak_miejsca`, oryginał bez zmian; `SQLITE_FULL` przy `VACUUM INTO` → `brak_miejsca`, bez niepełnego pliku; ENOSPC przy zapisie stanu startu → start normalny bez awarii, pętla nieliczona (N12-09) | ryzyko szczątkowe w runbooku |
| 4. Przerwane przywracanie | SIGKILL w środku transakcji (ATTACH → BEGIN IMMEDIATE → DELETE wszystkich tabel → część INSERT) → po ponownym otwarciu baza bez zmian (pełna migawka), `integrity_check` = ok, ponowne `przywrocZKopii` udane | przebieg SQL w procesie dziecka odwzorowuje `zastapZKopii`, nie wywołuje kodu TS (nazwane) |
| Pomiar integralności | 19,5 MB, 100 000 zdarzeń: `integrity_check` 343 ms, `quick_check` 274 ms (Linux, Node 22, SQLite 3.50.4) | czas na telefonie [DO USTALENIA] |

## 2. Definicja ukończenia (build) — punkt po punkcie
| Punkt | Dowód | Stan |
|---|---|---|
| ADR: ≥ 2 opcje, prywatność, koszt, „Potwierdzenie”; SDK tylko z inwentarzem | `kontrola-adr.mjs docs/adr --min 21` → 21, błędy 0; ADR-0018–0021 z uzupełnieniami 2026-10-26; brak SDK raportowania | spełnione |
| Kopia przez `VACUUM INTO`, test zapisów z `-wal` | `tests/dane/start-kopie.test.ts` ŚU-09, `tests/dane/archiwum.test.ts` (100 wierszy z `-wal`); surowa kopia po SIGKILL 100/100 | spełnione |
| Plik kopii przechodzi `integrity_check` przed udostępnieniem | przywracanie: `sprawdzKopie` przed czymkolwiek (testy 12); **archiwum `.oczko` nie sprawdza kopii `VACUUM INTO` przed udostępnieniem** (`src/dane/archiwum.ts:71–86`) | **N12-12** dla 08: `integrity_check` i `foreign_key_check` kopii tymczasowej osobnym połączeniem przed `zapiszZip` (bez kontroli wersji, bo tryb awaryjny eksportuje bazę nowszą) |
| Naprawa nie zmienia oryginału | `naprawa-kopii.sh` kopiuje przed `.recover`; tryb awaryjny bez migracji; N12-11 (checkpoint przy zamknięciu, dane logicznie bez zmian) | spełnione z obserwacją N12-11 |
| Strażnik: logika czysta z testami (pierwszy start, nieudane, kamień, uszkodzony zapis, „spróbuj normalnie”), tylko start interfejsu, zapis przed bazą, próg z decyzji | `tests/niezawodnosc/straznik-wektory.test.ts` (20), `tests/domena/straznik-startu.test.ts`; `app/_layout.tsx:46–48`; P-080 | spełnione; kamień po renderze po łatce N12-01 |
| Tryb awaryjny bez migracji i sieci, nie kasuje danych, wygląd i teksty 04 | ćwiczenie 1 (liczności po kopii = przed), E2E 09; ekran `src/ekrany/TrybAwaryjny.tsx` z kluczami 04 | spełnione; ZIP przy uszkodzonej bazie po łatce N12-03 |
| Ćwiczenia z datą: przywrócenie na czystej instalacji, wymuszona pętla, awaria widoczna w źródle sygnału | runbook §6: pętla (Linux + E2E 09), przerwane przywracanie; **przywrócenie na czystej instalacji z pliku ratunkowego i sygnał z TestFlight — nie wykonano** (P-079 Q2a) | lista „Nie sprawdzono” z warunkiem dla 10 |
| Runbook: gdzie patrzeć, kto decyduje, progi z ID, mechanizmy sklepów ze źródłami; brak automatycznej wysyłki | `docs/niezawodnosc/runbook.md` (cytaty Apple odczytane 2026-10-26: wydanie stopniowe, App Review, wersja niedostępna, TestFlight 120 dni) | spełnione |
| Pełny zestaw, typecheck, lint zielone; `git diff --cached` bez sekretów | `env -u NODE_PATH npm run verify` kod 0 (liczba w pliku stanu); diff przejrzany | spełnione |

## 3. Przekazanie
**Dla 07 (audyt gotowości):**
- SHA końca pracy: w pliku stanu.
- Nowe testy: `tests/niezawodnosc/` (5 plików testów, `pomocnicze.ts`, wektory JSON), oczekujące `tests/akceptacja/dane/niezawodnosc-migracja-ponowna.test.ts`, `tests/akceptacja/ekrany/niezawodnosc-kamien.test.tsx`.
- Nazwany wyjątek: `tests/niezawodnosc` w `WYLACZONE` tabeli 08.
- Do audytu po łatkach 08: scenariusz E2E dla ZIP surowej kopii przy uszkodzonej bazie, kamień po renderze, sprzątanie kopii na symulatorze (`Directory.delete` z zawartością).
- N12-11: przyczyna, dla której E2E 09 ma ten sam SHA `.db` po archiwum.

**Dla 08 (zgłoszenia poza łatkami P-194):**
- N12-05: globalna obsługa błędów JS i „Zgłoś problem” w trybie awaryjnym przed TestFlight (P-194 Q4a).
- N12-06: `SQLITE_CORRUPT` → `uszkodzony` w `sprawdzKopie`.
- N12-07: wersja w manifeście archiwum awaryjnego z `user_version`.
- N12-08: `katalogKopii` dla migracji kopii roboczej.
- N12-12: `integrity_check` kopii przed udostępnieniem.

**Dla 09 i 04:** nowych tekstów ekranu awaryjnego nie ma (ZIP używa przycisku „Zapisz kopię danych”). Instrukcja dla zgłaszającego w runbooku §4 jest tekstem roboczym do zatwierdzenia przez 04 i przekładu przez 09, jeśli trafi na stronę wsparcia.

**Dla 10 (wydanie):**
- Inwentarz prywatności: bez nowych wpisów (nic nie wysyła się samo; ZIP i archiwum tylko przez arkusz udostępniania z decyzji użytkownika, OP-25 jak w ADR-0018).
- Wydanie stopniowe zawsze i wstrzymanie przy P0 (P-080 (5a)) — ustawienie przy każdej wersji to krok właściciela.
- Warunki z listy „Nie sprawdzono” (runbook §6): raport awarii z TestFlight z symbolami (dSYM i mapy źródeł Hermesa w CI, E1), czas `integrity_check` na telefonie, przywrócenie z pliku ratunkowego na czystej instalacji, start w tle bez zwiększania licznika, `naprawa-kopii.sh` z `sqlite3`.

## 4. Pytania na STOP E3
Brak decyzji produktowych. N12-11, N12-12 i N12-13 to zgłoszenia, nie opcje. Koordynator przyjmuje albo zgłasza uwagi do runbooka.
