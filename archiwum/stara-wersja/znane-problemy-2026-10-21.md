# Znane problemy poprzedniej wersji (rozliczenie stanu, 2026-10-21)

Kwarantanna (P-003): czytają tylko role 05, 08, 12 i krok porównania. Pełne raporty (audyt modułów, rejestr 217 twierdzeń dziewiarskich) w prywatnym `oczko-warsztat`, katalog `rozliczenie-2026-10-21/`.

## Utrata danych (realne; priorytet roli 12)
1. Ciche przejście na bazę w pamięci: `src/core/project-context.tsx:100-104` łapie każdy błąd otwarcia SQLite i przełącza na emulator w pamięci bez komunikatu (sprawdzone w kodzie).
2. Kopie zapasowe prawdopodobnie nie zapisują się na urządzeniu: `expo-file-system` nie jest bezpośrednią zależnością (po `npm ci` tylko w `node_modules/expo/node_modules/`), `require` w `src/core/backup-service.ts:413-416` nie znajdzie modułu, a `:423` rzuca błąd. To samo `expo-keep-awake` (`src/screens/MainCounterScreen.tsx:50`). [DO USTALENIA: potwierdzić na symulatorze]
3. Baner odzyskiwania martwy: `setRecovery` (`src/core/backup-service.ts:179`) nie jest wywoływany poza testami.

## CI (odłożone, P-008)
| Workflow | Wynik | Przyczyna |
|---|---|---|
| TestFlight | build 1004 wysłany 17.10.2026 ([przebieg 39014291650](https://github.com/lkarwowski494/Oczko/actions/runs/39014291650), „Upload succeeded”), commit f7f11eb na `macos-26` | w ad8d6b0 runner zmieniony na `macos-14`; przy następnym uruchomieniu prawdopodobny błąd jak w E2E |
| E2E iOS | jedyny przebieg porażka ([39046256084](https://github.com/lkarwowski494/Oczko/actions/runs/39046256084)) | `pod install`: „React Native requires XCode >= 16.1. Found 15.4.” (runner `macos-14`) |
| tests-tz | 3 porażki 18–20.10, potem workflow wyłączony ręcznie | test `tests/matrix-coverage.test.tsx:52` zakłada datę UTC; w `TZ=Pacific/Kiritimati` 1 test czerwony (odtworzone lokalnie 21.10.2026); błąd testu, nie funkcji |
| Pages | porażka | GitHub Pages nie włączone w repo |
| CI (Jest) | zielone od 15.10.2026 (ostatnie: ad8d6b0) | sprawdza też atrapy; „Maestro w Jest” to interpreter YAML bez UI |

## Atrapy opisane jako gotowe
Czytnik PDF (puste paski, `totalPages: 5`), zakup bez StoreKit (zapis „active” w SQLite), Apple Watch i Garmin (tylko symulatory w aplikacji, brak kodu natywnego), dane demo w magazynie i projekcie odtwarzane po usunięciu. Szczegóły z `plik:linia` w raporcie audytu modułów.
