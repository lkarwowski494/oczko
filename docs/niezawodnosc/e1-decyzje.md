# E1 Decyzje (rola 12-niezawodnosc, build, wejście wczesne) · 2026-10-22 · STOP E1
Wejście: E0 (`e0-rozpoznanie.md`, P-079), odpowiedź właściciela „1b 2a 3b 4c 5a 6a” (P-080). Dalej po roli 08: E2 (testy i kod), E3 (ćwiczenia automatem, runbook, przekazanie do 07 i 10).

## ADR (kontrola roli 05: `node docs/architektura/eksperymenty/e1/kontrola-adr.mjs docs/adr` → 21/21 OK, kod 0)
| ADR | Decyzja |
|---|---|
| [0018](../adr/0018-sygnal-awarii-bez-sdk-metrickit-lokalnie.md) | sygnał bez SDK: TestFlight w przeglądarce + F-57 + raporty MetricKit na urządzeniu, wysyłane tylko przez użytkownika |
| [0019](../adr/0019-straznik-startu-i-tryb-awaryjny.md) | strażnik startu (kamień milowy, próg 2, tylko start na pierwszym planie) i ekran trybu awaryjnego bez migracji |
| [0020](../adr/0020-kopia-ratunkowa-zip-przywracanie.md) | surowa kopia trzech plików przed otwarciem bazy, ZIP do przekazania, przywrócenie przez `backupDatabaseAsync` po `sprawdzKopie`, kopie 30 dni |
| [0021](../adr/0021-bez-ota-poprawki-nowym-buildem.md) | bez OTA; poprawka nowym buildem i przyspieszona recenzja |

## Progi i reakcje (każdy z ID decyzji)
| Próg | Wartość | Źródło |
|---|---|---|
| Nieudane starty z rzędu do trybu awaryjnego | 2 | P-080 (interpretacja do weta), ADR-0019 |
| Czas trzymania kopii ratunkowych | 30 dni, nie krócej niż do kamienia milowego | P-080 (interpretacja do weta), ADR-0020 |
| Wydanie stopniowe App Store | zawsze | P-080 (5a) |
| Wstrzymanie wydania | każde potwierdzone P0 (utrata, zepsucie, odcięcie od danych) | P-080 (5a); Apple nie podaje progu odsetka awarii (moduł, 18.10.2026) |
| Kiedy właściciel patrzy na sygnały | dzień wydania + 3 dni | P-080 (6a) |

## Dowód założenia ADR-0020 (2026-10-22)
`node --no-warnings docs/niezawodnosc/eksperymenty/wal-kopia.mjs <katalog>` (SQLite 3.50.4, Node v22.22.0) → kopia samego `app.db` przy 412 032 B w `-wal`: 0 ze 100 wierszy, `integrity_check` = ok; `VACUUM INTO`: 100 ze 100. Wynik: `eksperymenty/wal-kopia.out`, kod 0.

## Zgłoszenia do innych ról
| Do | Co | Skąd |
|---|---|---|
| 04 | ekran trybu awaryjnego (trzy działania; nagłówki: pętla awarii, dane wymagają naprawy, zaktualizuj aplikację), podgląd „Zgłoś problem” z raportami, komunikat braku miejsca przy kopii | ADR-0019, ADR-0018, ADR-0020; w `docs/design/` brak |
| 05 | nowy wiersz ADR-0016: moduł Swift `Diagnostyka` (MetricKit); `konfiguracja.ts`: `PROG_NIEUDANYCH_STARTOW` = 2, `KOPIE_RATUNKOWE_DNI` = 30, `DIAGNOSTYKA_MAKS_RAPORTOW`, `DIAGNOSTYKA_MAKS_KB` [OCENA w E2]; doprecyzowanie `e3-…md` §2 (integralność po błędzie, nie przy każdym starcie, do weta) | ADR-0018–0020 |
| 07 | ryzyka i kontrole niżej; strategia testów obejmuje E2 roli 12 | P-005 |
| 08 | kolejność: port bazy i kolejka (05) przed strażnikiem; globalna obsługa błędów JS bez treści komunikatu; ZIP wspólny z archiwum `.oczko` | ADR-0018, ADR-0020 |
| 09 | teksty ekranu awaryjnego i podglądu zgłoszenia w 35 językach (E2–E4 roli 09) | ADR-0019 |
| 10 | wydanie stopniowe zawsze; OP-25 obejmuje raporty MetricKit w F-57; symbole: dSYM i mapy źródeł Hermesa z każdego buildu w CI; lista „Nie sprawdzono” | P-080, ADR-0018 |

## Dla roli 07 (strategia przed 08)
- Kontrole w CI: brak `createInMemoryDatabase`/`:memory:` w `src/` poza testami; brak kopiowania samego `.db`; brak `VACUUM`/`REINDEX` na bazie głównej w kodzie ratunkowym; brak `expo-updates` i sekcji `updates`; brak SDK raportowania awarii; przełącznik wymuszonej awarii tylko w konfiguracji testowej, nieobecny w buildzie wydania.
- Na symulatorze (P-079 (Q2a), zamiast ćwiczeń na telefonie): dwa wymuszone nieudane starty → ekran awaryjny → archiwum z licznościami, oryginał z tym samym SHA-256; przywrócenie z kopii na czystej instalacji; start w tle (intencja +1) nie zwiększa licznika nieudanych startów; pomiar `integrity_check` na bazie 3-letniej.
- Przypięcie obrazu runnera macOS i wersji Xcode (poprzednia wersja: „React Native requires XCode >= 16.1. Found 15.4.”), żeby poprawka dała się zbudować w dniu incydentu.
- **Nie sprawdzono (ryzyko szczątkowe, P-079):** raport z prawdziwej awarii w TestFlight (czy jest, po jakim czasie, czy ma symbole); raport MetricKit z prawdziwego urządzenia; zachowanie przy restarcie telefonu bez odblokowania.
