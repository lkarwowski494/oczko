# Strategia Testów — Oczko 🧶⏱️

> **Decyzja właściciela (ZAS-QA-01, 15.10.2026):**  
> Każda funkcjonalność musi być automatycznie testowana w najszerszym możliwym zakresie, pod wieloma perspektywami jakościowymi, w ścisłej zgodności ze standardem repozytorium `organizer`.

---

## 🎯 Zasada Główna
Funkcjonalność jest uznawana za ukończoną dopiero wtedy, gdy posiada dedykowane testy we **wszystkich warstwach i perspektywach, które jej dotyczą**, progi pokrycia linii ($100.00\%$) są spełnione, a pipeline CI na GitHub Actions przechodzi na zielono.

Błąd znaleziony manualnie lub zgłoszony podczas testów najpierw otrzymuje test automatyczny, który wiernie go odtwarza (czerwony test przed poprawką), a dopiero po potwierdzeniu awarii wdrażana jest właściwa korekta kodu.

---

## ⏱️ Cykl Wykonywania Testów

| Moment | Zakres weryfikacji | Środowisko | Typowy Czas |
|---|---|---|---|
| **Każdy commit / PR** | Statyczna kontrola typów TypeScript (`tsc --noEmit`), pełny zestaw 48 pakietów testowych Jest, raport pokrycia kodu z progiem $100\%$ linii, testy PBT, kontrakty dostępności HIG $\ge 44\,\text{pt}$, strażnicy czystości domeny i SQL Injection, budżety CPU, testy odporności, współbieżności i korpus referencyjny Pythona. | GitHub Actions (`ci.yml`, Ubuntu) | $\sim 50\,\text{s}$ |
| **Szybka pętla programisty** | `npm test` lub uruchomienie dedykowanego pakietu (np. `npm run test:pbt`, `npm run test:perf`). | Środowisko lokalne | $\sim 3\text{--}15\,\text{s}$ |
| **Przed scaleniem do `main`** | `npm run verify` (`npm run typecheck && npm run test:coverage`). | Środowisko lokalne | $\sim 30\,\text{s}$ |
| **Aktualizacja algorytmów dziewiarskich** | Regeneracja korpusu matematycznego w Pythonie 3.14 (`npm run check:corpus`) i test różnicowy (`npm run test:corpus`). | Python 3.14 / Jest | $\sim 5\,\text{s}$ |

---

## 📊 Wymagane Progi Jakościowe

| Obszar | Wymagany Próg | Narzędzie weryfikacji |
|---|---|---|
| **Pokrycie Linii (Lines Coverage)** | **100.00%** (bezwzględny zakaz spadku) | Jest `coverageThreshold` (`npm run test:coverage`) |
| **Czystość Typów TypeScript** | **0 błędów, 0 ostrzeżeń** | `tsc --noEmit` (`npm run typecheck`) |
| **Testy Jednostkowe & Integracyjne** | **100% PASS** (48/48 pakietów, 367/367 testów) | Jest (`npm test`) |
| **Dostępność Apple HIG** | $\ge 44 \times 44\,\text{pt}$ dla wszystkich kontrolek | `src/components/__tests__/a11y-contracts.test.tsx` |
| **Bezpieczeństwo SQL** | 100% zapytań modyfikujących sparametryzowanych (`?`) | `src/core/__tests__/interaction-guards.test.ts` |
| **Czystość Architektury Domenowej** | 0 importów `react-native` w plikach `src/core/` | `src/core/__tests__/interaction-guards.test.ts` |
| **Budżety Wydajnościowe CPU** | Złożoność $O(N)$, limity czasu procesora dotrzymane | `src/core/__tests__/perf-budget.test.ts` |

---

## 🔍 Szczegółowe Warstwy Matrycy Jakości

### 1. Logika Domenowa i Event Sourcing
- Czyste funkcje TypeScript odizolowane od UI (`src/core/`).
- Testowanie przypadków brzegowych, wartości ujemnych, dzielenia przez zero, pustych kolekcji.
- Weryfikacja niezmiennego dziennika zdarzeń (append-only) w SQLite i poprawnego wyliczania stanu z historii.

### 2. Property-Based Testing (PBT / `fast-check`)
- Niezmiennik odwracalności zdarzeń: $V + \Delta - \Delta = V$.
- Monotoniczność debouncera kliknięć.
- Symetria konwersji jednostek: $cm \leftrightarrow in$, $m \leftrightarrow yd$, $g \leftrightarrow oz$.
- Liniowa proporcjonalność kalkulatora próbki ściegu.
- Niezmiennik pojemności buforów offline (`WatchOfflineQueue`, `GarminOfflineQueue`).
- Roundtrip kopert komunikacyjnych Bluetooth (`GarminMessageEnvelope`).

### 3. Differential Testing (Testy Różnicowe z Korpusem Pythona)
- Niezależna implementacja reguł matematycznych w języku Python 3.14 (`scripts/gen-gauge-corpus.py`).
- Generowanie korpusu wzorcowego `src/core/__tests__/fixtures/gauge-corpus.json`.
- Test krzyżowy `src/core/__tests__/gauge-corpus.test.ts` sprawdzający tożsamość wyników między Pythonem a TypeScriptem z mikroskopijną tolerancją numeryczną ($10^{-5}$).

### 4. Dostępność Cyfrowa i Kontrakty Apple HIG
- Weryfikacja minimalnego rozmiaru obszaru dotykowego $\ge 44 \times 44\,\text{pt}$ (przycisk licznika, przyciski zegarka, linijka PDF, modale).
- Etykiety semantyczne i role VoiceOver (`accessibilityRole`, `accessibilityLabel`).
- Tryb wysokiego kontrastu czytnika PDF (WCAG 2.2 AAA $\ge 7.0:1$).
- Obsługa zamykania modali klawiszem/gestem (`onRequestClose`).

### 5. Strażnicy Architektury i Bezpieczeństwa
- Ochrona przed SQL Injection: statyczna inspekcja zapytań w `src/core/project-repository.ts` i `src/core/stash-repository.ts`.
- Czystość domeny: weryfikacja, że pliki domenowe w `src/core/` nie importują bibliotek widokowych React Native.

### 6. Budżety Wydajnościowe CPU (Performance Budgets)
- Replay 5 000 zdarzeń event-sourcingu: próg $< 60\,\text{ms}$ (zmierzony: $4\,\text{ms}$).
- Filtrowanie i agregacja metryk 2 500 pozycji magazynu: próg $< 40\,\text{ms}$ (zmierzony: $2\,\text{ms}$).
- 10 000 kalkulacji próbki i wskaźnika Yarn Grist: próg $< 100\,\text{ms}$ (zmierzony: $9\,\text{ms}$).
- 10 000 rozpoznań ściegu w drzewie decyzyjnym DEC-16: próg $< 20\,\text{ms}$ (zmierzony: $2\,\text{ms}$).
- 10 000 kalkulacji kształtowania oczek: próg $< 200\,\text{ms}$ (zmierzony: $5\,\text{ms}$).
- 10 000 serializacji kopert Garmin BLE: próg $< 150\,\text{ms}$ (zmierzony: $9\,\text{ms}$).
- 10 000 konwersji rozmiarów drutów i jednostek: próg $< 150\,\text{ms}$ (zmierzony: $4\,\text{ms}$).

### 7. Odporność i Wstrzykiwanie Błędów (Resilience & Fault Injection)
- Transakcyjny rollback operacji bazodanowych przy błędach zapisu (Zero Partial Writes).
- Odrzucanie uszkodzonych, niekompletnych lub zmodyfikowanych plików kopii zapasowej JSON.
- Odporność na anomalie zegara systemowego (Clock Skew — zdarzenia z przyszłości lub przeszłości).
- Odporność parsera BLE na uszkodzone, puste i niepełne ramki JSON.

### 8. Symulacja Współbieżności i Wyścigów (Concurrency & Race Conditions)
- Submilisekundowe rozstrzyganie remisów czasowych przy jednoczesnych kliknięciach na zegarku i telefonie.
- Buforowanie i bezpieczne opróżnianie kolejek offline urządzeń ubieralnych po powrocie do zasięgu.
- Wykrywanie duplikatów międzyurządzeniowych ($T \le 2\,\text{s}$).
- Bezkonfliktowe równoległe zapisy asynchroniczne (25 równoległych operacji zapisu SQLite).

---

## 🛠️ Zestaw Dedykowanych Poleceń

```bash
# Pełna weryfikacja projektu (typecheck + testy z raportem pokrycia)
npm run verify

# Uruchomienie wszystkich testów
npm test

# Testy z raportem pokrycia kodu (wymóg 100.00% linii)
npm run test:coverage

# Uruchomienie poszczególnych warstw matrycy:
npm run test:pbt           # Property-Based Testing (fast-check)
npm run test:perf          # Budżety wydajnościowe CPU
npm run test:a11y          # Kontrakty dostępności Apple HIG (>= 44x44 pt)
npm run test:resilience    # Odporność i wstrzykiwanie błędów
npm run test:concurrency   # Współbieżność, wyścigi i kolejki offline
npm run test:corpus        # Testy różnicowe z korpusem Pythona
npm run check:corpus       # Regeneracja korpusu w Pythonie 3.14

# Kontrola typów TypeScript
npm run typecheck
```
