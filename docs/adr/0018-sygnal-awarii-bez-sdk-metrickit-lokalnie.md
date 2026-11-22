# 0018. Sygnał o awariach bez SDK: TestFlight w przeglądarce, „Zgłoś problem” (F-57) i raporty MetricKit trzymane na urządzeniu
Data: 2026-10-22 · Status: **przyjęta** (P-080 (1b)) · Rola: 12 (E1) · Zależy od: P-079 (brak Maca), P-041, NFR-PRY-001, F-57, BR-DAN-010, ADR-0007, ADR-0014, ADR-0016

## Kontekst i problem
Właściciel nie ma Maca (P-079), więc Xcode Organizer odpada. Bez Organizera awarie z App Store widać tylko wtedy, gdy ktoś je przyśle. Dla testerów zostaje TestFlight w przeglądarce: „Crash reports are available for download for 120 days” (developer.apple.com/help/app-store-connect/test-a-beta-version/view-tester-feedback, odczyt 2026-10-22). iOS przekazuje aplikacji raport po awarii przez MetricKit: „Diagnostic reports arrive immediately in iOS 15 and later” (developer.apple.com/documentation/metrickit), a `MXCrashDiagnostic` to „An object representing a diagnostic report for an app crash” (tamże, 2026-10-22). Aplikacja deklaruje „Data Not Collected” (NFR-PRY-001), a w App Privacy „Crash Data” to „Such as crash logs” (developer.apple.com/app-store/app-privacy-details, 2026-10-22).

## Czynniki decyzji
Właściciel dowiaduje się o awarii przed recenzjami · bez Maca · etykieta „Data Not Collected” · koszt 0 zł · raport czytelny dla agenta (stos, wersja, build).

## Rozważane opcje
A. Bez dodatków: TestFlight w przeglądarce + „Zgłoś problem” z tabelą `blad`.
B. A + moduł Swift, który subskrybuje `MXMetricManager` i zapisuje `MXCrashDiagnostic` (oraz zawieszenia) jako JSON w pliku na urządzeniu; „Zgłoś problem” dołącza je do podglądu przed udostępnieniem.
C. A + skrypt pobierający dane z App Store Connect API (`betaFeedbackCrashSubmissions`, `diagnosticSignatures`).
D. SDK zewnętrzne (np. Sentry), dobrowolne.

## Decyzja
Opcja B (właściciel: „1b”, P-080).
- Moduł Swift `Diagnostyka` (ADR-0007; nowy wiersz w tabeli ADR-0016 jako moduł własny, bez pakietu npm) zapisuje raporty do `Application Support/diagnostyka/` z limitem: najwyżej `DIAGNOSTYKA_MAKS_RAPORTOW` plików, każdy przycięty do `DIAGNOSTYKA_MAKS_KB` (wartości: [OCENA] w E2 po rozmiarze przykładowego raportu). Nic nie wysyła sam.
- Błąd JS, który kończy aplikację: globalna obsługa błędów zapisuje do `blad` nazwę błędu, kod i ramki stosu (plik pakietu JS, linia, kolumna) **bez treści komunikatu**, bo komunikat może zawierać dane użytkownika; potem przekazuje błąd dalej (awaria jak dotąd). Mapy źródeł Hermesa dla każdego buildu przechowuje potok CI (07/10), żeby ramki dało się odczytać.
- „Zgłoś problem” (F-57): podgląd pokazuje, co wyjdzie (wpisy `blad`, raporty MetricKit: wersja, build, model urządzenia, wersja iOS, stos); użytkownik wybiera kanał w arkuszu udostępniania. Czy to „optional disclosure”, rozstrzyga rola 10 (OP-25).
- Właściciel bez Maca patrzy na: TestFlight w przeglądarce, recenzje, zgłoszenia (harmonogram: P-080 (6a), runbook).

### Konsekwencje
- Dobre: awaria u zwykłego użytkownika z App Store ma szansę dotrzeć z pełnym stosem, jeśli osoba wyśle zgłoszenie; bez serwera i konta.
- Złe: sygnał zależy od woli użytkownika (nikt nie wyśle = nie wiemy); ok. 2–3 h agenta na moduł Swift i ekran podglądu; symbolizacja raportu natywnego wymaga dSYM z buildu (potok CI).
- Prywatność: nic nie opuszcza urządzenia bez działania użytkownika; raport nie ma treści projektów. Etykieta bez zmian, z zastrzeżeniem OP-25.
- Koszt: 0 zł (brak usługi). Odrzucona D: Sentry Developer „Free $0 Limited to one user”, „Error Monitoring 5k errors” (sentry.io/pricing, 2026-10-22).

### Potwierdzenie
- XCTest (07): dekodowanie przykładowego JSON `MXCrashDiagnostic` (fikstura w repo) → plik w `diagnostyka/`; limit plików i rozmiaru przestrzegany; uszkodzony JSON pominięty bez awarii.
- Test JS: globalna obsługa błędów zapisuje wpis `blad` bez pola komunikatu i przekazuje błąd dalej.
- Test podglądu F-57: zawartość udostępnionego pliku = zawartość pokazana w podglądzie; brak nazw projektów i notatek (dane testowe z charakterystycznymi napisami, grep).
- Kontrola w CI: brak pakietów SDK raportowania awarii w `package.json` (lista zakazana ADR-0016).
- Nie sprawdzono (P-079 (Q2a)): czy prawdziwa awaria na urządzeniu daje raport MetricKit i czy raport z TestFlight jest czytelny — ryzyko szczątkowe dla roli 10.

## Uzupełnienie 2026-10-26 (rola 12 E2, P-194 Q4a; decyzja B bez zmian, termin rozłożony)
- Przed TestFlight: globalna obsługa błędów JS (wpis `blad` bez treści komunikatu) i „Zgłoś problem” podpięte w trybie awaryjnym (dziś `naZglosProblem={() => undefined}`, `src/kompozycja/EkranAwaryjny.tsx`) — zgłoszenie dla 08.
- Moduł Swift `Diagnostyka` (MetricKit): w 1.1, przed wydaniem w App Store. Przed premierą raporty awarii testerów daje TestFlight w przeglądarce (runbook §1).

## Uzupełnienie 2026-10-26 (fix-6 05: NZ-P5-PRZEGLAD, P-194 Q4a, P-199; decyzja B bez zmian)
Termin z uzupełnienia roli 12 potwierdzony przez koordynatora (P-194): **MetricKit (moduł `Diagnostyka`) w 1.1**, przed wydaniem w App Store; **przed TestFlight** globalna obsługa błędów JS i „Zgłoś problem” w trybie awaryjnym. Kontrakt 05 dla 08 (granice ADR-0002 i ADR-0019):
- **Globalna obsługa błędów JS:** jeden punkt w kompozycji (warstwa 4, nie domena) — `ErrorUtils.setGlobalHandler` z zachowaniem poprzedniego handlera (`getGlobalHandler()` wołany na końcu, więc awaria zostaje awarią). Wpis `blad` przez port bazy w kolejce: `{ kod: 'js_<nazwa błędu>', szczegoly: { ramki } }` bez `message` (może nieść dane użytkowniczki) i bez nazw projektów; najwyżej jeden wpis na przyczynę (`isFatal` albo pierwszy błąd po starcie), bo przy awarii zapis może nie zdążyć — ryzyko nazwane, nie powód do zapisu synchronicznego poza kolejką (ADR-0002). **W trybie awaryjnym handler niczego nie zapisuje do bazy** (ADR-0019: tryb awaryjny nie zapisuje do bazy) — tylko przekazuje błąd dalej.
- **„Zgłoś problem” w trybie awaryjnym:** działa bez otwarcia bazy do zapisu. Treść: wersja i build, model urządzenia, wersja iOS, liczba nieudanych startów ze stanu strażnika (ADR-0019) i powód wejścia w tryb awaryjny; wpisy `blad` tylko, gdy baza otwiera się w trybie tylko do odczytu (`otworzPortExpo(…, { tylkoOdczyt: true })`, jak `licznosciPliku`), inaczej zdanie „baza się nie otworzyła”. Podgląd przed udostępnieniem i arkusz systemowy jak w F-57; teksty 04/09.
- **Potwierdzenie:** test JS handlera (wpis bez `message`, poprzedni handler wywołany, w trybie awaryjnym brak zapisu — atrapa portu bazy liczy wywołania `run`); test ekranu awaryjnego: „Zgłoś problem” wywołuje udostępnienie z treścią z podglądu, także gdy otwarcie bazy rzuca wyjątek. Odstępstwo od Potwierdzenia wyżej (XCTest `MXCrashDiagnostic`): przesunięte do 1.1 razem z modułem, wyjątek nazwany P-194.

## Opcje: zalety i wady
### A — zalety: zero kodu · wady: awarie z App Store niewidoczne bez Maca; dowiadujesz się z recenzji.
### B — zalety: stos awarii od użytkownika bez SDK i bez zmiany etykiety · wady: zależy od zgłoszeń; moduł Swift do utrzymania.
### C — zalety: dane bez udziału użytkownika · wady: lista wartości `diagnosticType` w dokumentacji to `DISK_WRITES`, `HANGS`, `LAUNCHES` (awarie [DO USTALENIA]); klucz API poza środowiskiem `testflight` albo zatwierdzanie każdego uruchomienia (ADR-0014).
### D — zalety: pełny obraz, alerty · wady: dane wychodzą z urządzenia (zmiana etykiety App Privacy, zgoda w interfejsie), konto i limit planu, SDK w manifeście prywatności.
