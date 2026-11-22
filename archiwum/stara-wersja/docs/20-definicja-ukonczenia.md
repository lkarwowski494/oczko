# 20. Definicja Ukończenia Funkcjonalności (DoD) — Oczko 🧶⏱️

> **Zasada właściciela (ZAS-QA-01, 15.10.2026):**  
> *„Każda nowa funkcja, zmiana logiki lub modyfikacja interfejsu w projekcie Oczko bezwzględnie musi otrzymać lub zaktualizować zestaw testów automatycznych w standardzie i zakresie repozytorium organizer.”*

Funkcjonalność (nowa albo zmodyfikowana) w projekcie **Oczko** uznawana jest za zakończoną (`Done`) wyłącznie wtedy, gdy posiada pełny zakres testów automatycznych ze wszystkich warstw jakościowych, które jej dotyczą. Pominięcie którejkolwiek warstwy wymaga jawnego, udokumentowanego uzasadnienia w rejestrze decyzji (`docs/decyzje_biezace.md`).

---

## 🧪 Matryca Warstw Jakościowych (Testing Rigor Matrix)

| # | Warstwa | Zakres weryfikacji | Standard & Narzędzia | Lokalizacja w projekcie |
|---|---|---|---|---|
| **1** | **Czysta Logika Domenowa** | Deterministyczne funkcje TypeScript: standardowe scenariusze, wartości brzegowe, błędne wejścia, brak danych, matematyka dziewiarska (próbka ściegu, kształtowanie, metraż Grist, miarka drutów). | **100% pokrycia linii**, 0 zależności od React Native | `src/core/**/__tests__/*.test.ts` |
| **2** | **Interfejs & Modale (UI)** | Każdy ekran, modal, formularz, przycisk i widżet renderuje się poprawnie; interakcje dotykowe wywołują prawidłowe mutacje stanu i transakcje SQLite. | React Test Renderer / RNTL, symulacje dotknięć | `src/components/**/__tests__/*.test.tsx`, `src/screens/**/__tests__/*.test.tsx` |
| **3** | **Event Sourcing & SQLite** | Dziennik zdarzeń `counter_events`: rejestracja kroków `+1`, `-1`, precyzyjne i spójne wycofywanie (`UNDO`) nadrzędne i podrzędne (liczniki modulo warkocza/ażuru), trwałość po restarcie. | Lokalne SQLite in-memory i disk, weryfikacja schematu | `src/core/__tests__/database-persistence.test.ts`, `linked-counters.test.ts` |
| **4** | **Niezmienniki (Property-Based / PBT)** | Weryfikacja niezmienników matematycznych na tysiącach generowanych danych: odwracalność zdarzeń ($V + \Delta - \Delta = V$), monotoniczność debouncera, symetria konwersji jednostek, roundtrip kopert BLE. | `fast-check` ($\ge 100$ prób losowych per test) | `src/core/__tests__/property-based.test.ts` |
| **5** | **Testy Różnicowe (Cross-Validation)** | Porównanie wyników algorytmów z niezależnym modelem referencyjnym napisanym w Pythonie 3.14 (próbki ściegu, przeliczniki wagowo-metrażowe, kontrast WCAG 2.2 AAA). | Generator `scripts/gen-gauge-corpus.py` ↔ `gauge-corpus.json` | `src/core/__tests__/gauge-corpus.test.ts` |
| **6** | **Dostępność i Apple HIG** | Minimalny obszar dotykowy kontrolek $\ge 44 \times 44\,\text{pt}$, semantyka VoiceOver (`accessibilityRole`, `accessibilityLabel`), czytnik PDF o wysokim kontraście, odporność modali (`onRequestClose`). | Apple Human Interface Guidelines, WCAG 2.2 AAA | `src/components/__tests__/a11y-contracts.test.tsx` |
| **7** | **Strażnicy Architektury & Bezpieczeństwa** | Statyczna weryfikacja ochrony przed SQL Injection (100% sparametryzowanych zapytań `?`), czystość warstwy domenowej (brak importów `react-native` w `src/core/`), spójność modali. | Analiza AST i inspekcja kodu źródłowego | `src/core/__tests__/interaction-guards.test.ts` |
| **8** | **Budżety Wydajnościowe CPU** | Ograniczenia czasu procesora z mikrosekundową precyzją: replay 5 000 zdarzeń $< 60\,\text{ms}$, filtry 2 500 włóczek $< 40\,\text{ms}$, 10 000 kalkulacji próbki/kształtowania $< 100\,\text{ms}$. | Performance Timer (`performance.now()`), gwarancja $O(N)$ | `src/core/__tests__/perf-budget.test.ts` |
| **9** | **Odporność & Wstrzykiwanie Błędów** | Transakcyjny rollback SQLite (Zero Partial Writes), odrzucanie sfałszowanych/uszkodzonych backupów JSON, odporność na Clock Skew, uszkodzone ramki BLE. | Fault Injection, fuzzing danych wejściowych | `src/core/__tests__/resilience.test.ts` |
| **10** | **Współbieżność & Urządzenia Ubieralne** | Rozstrzyganie remisów submilisekundowych, buforowanie i opróżnianie kolejek offline (`WatchOfflineQueue`, `GarminOfflineQueue`), 25 równoległych zapisów SQLite. | Symulacja asynchronicznych wyścigów | `src/core/__tests__/concurrency.test.ts` |

---

## 🚦 Automatyczne Bramki Jakościowe (Quality Gates)

Każda zmiana w kodzie przed scaleniem do gałęzi `main` musi pomyślnie przejść następujące bramki:

1. **Statyczna kontrola typów TypeScript:**  
   `npm run typecheck` (`tsc --noEmit`) — **0 błędów, 0 ostrzeżeń**.
2. **Higiena tłumaczeń i18n:**  
   `npm run check:i18n` — 0 brakujących kluczy, 0 martwych kluczy.
3. **Audyt licencji Open Source:**  
   `npm run check:licenses` — dozwolone wyłącznie licencje permisywne, blokada GPL/LGPL/AGPL.
4. **Macierz Pokrycia AST:**  
   `node scripts/test-matrix.mjs --check` — **100% pokrycia** we wszystkich 5 kategoriach (`EKRAN`, `UI`, `TEKST`, `LOGIKA`, `WYMIAR`).
5. **Niezmienniki projektu natywnego iOS:**  
   `node scripts/verify-native.mjs` — spełnione wszystkie 20 niezmienników iOS na Linuksie/Windowsie.
6. **Pełne pokrycie kodu i testy wieloperspektywiczne:**  
   `npm run test:coverage` — **100.00% pokrycia logiki domenowej**, testy `fast-check` (PBT), wyrocznia Pythona (`gauge-corpus`), strażnicy interakcji `S1–S16`, testy dostępności VoiceOver i dotyku $\ge 44\,\text{pt}$, testy stref czasowych i Maestro.
7. **Nadrzędna bramka jakościowa:**  
   `npm run verify` — jednolity przebieg sprawdzający wszystkie powyższe kroki w 100% na zielono.
8. **Ciągła Integracja GitHub Actions (CI):**  
   Zielony status zadań `CI` i `TestFlight` na maszynach GitHub Actions.

---

## 🛡️ Inwarianty Bezwzględne Produktu

- **Inwariant ZP-05 (Zero Generative AI):** Wszelkie algorytmy rozpoznawania ściegów, kalkulacji rzędów, kształtowania, proporcji i jednostek muszą być w 100% deterministyczne. Absolutny zakaz wywołań modeli generatywnych w produkcie.
- **Inwariant Offline-First (ZAS-ARCH-01):** Aplikacja musi zachowywać pełną funkcjonalność liczenia, przeglądania i edycji bez aktywnego połączenia z Internetem.
- **Inwariant Ochrony Licznika (BR-LICZ-007):** Manualne stuknięcia są bezwzględnie filtrowane przez $300\,\text{ms}$ debounce.
- **Inwariant Bezpieczeństwa Repozytorium:** Repozytorium referencyjne `trening` pozostaje ściśle **READ-ONLY**.
