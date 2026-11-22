# Standardy, Moduły i Role Projektu Oczko (Purlo)

**Stan:** 17.10.2026  
**Właściciel:** Łukasz  
**Repozytorium:** `oczko` (`com.apps4brew.knitting`)  
**Pochodzenie:** Zgodne z „Biblioteka zasad i ról (wspólna dla projektów)” (Google Dysk, stan 11–12.10.2026) oraz 10 Zasadami Uniwersalnymi.

---

## 1. Obowiązujące Moduły Dziedzinowe

### 1.1. Moduł: Aplikacje (Oprogramowanie) — [WŁĄCZONY W 100%]
* **Prywatność i Bezpieczeństwo:** 100% Offline-First. Wszystkie dane użytkownika przechowywane w lokalnej bazie SQLite (`app.db`). Zero telemetrii, zero wywołań sieciowych (`fetch`/`axios`), zero analityki zewnętrznej.
* **Audyt Git i Sekrety:** Zakaz commitowania kluczy, certyfikatów (`.p8`, `.p12`, `.pem`), plików `.env*`, `credentials.json`. Czysta historia git.
* **Koszty i Limity:** 0 zł poza Apple Developer Program. Przed użyciem jakiejkolwiek usługi chmurowej/CI sprawdzić darmowe limity i uprzedzić przed zużyciem dużej części limitu.
* **Rygor Testów (TDD):** Testy przed kodem; każdy naprawiany błąd dostaje test odtwarzający (czerwony na kodzie sprzed poprawki). Dwa poziomy testów: jednostkowe w trakcie pracy, pełny zestaw (`npm run verify`) przed jakimkolwiek commitem i pushem.
* **Czystość Architektury:** Małe moduły z jasnymi granicami (orientacyjnie $\le 20$ KB), 0 cykli zależności (`madge`), czysta domena bez importów React Native w silnikach obliczeniowych.
* **Polityki Apple App Store:**
  - Wytyczna 2.3.7: Zakaz nazw konkurentów w metadanych (`app.json`, opisy, słowa kluczowe).
  - Wytyczna 5.1.3: Dane zdrowotne nie w iCloud (brak integracji zdrowotnych).
  - Apple HIG: Przyciski zamykania, wstecz i akcji z min. strefą dotyku $44 \times 44$ pt i `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}`.

### 1.2. Moduł: Research i Treści Merytoryczne — [WŁĄCZONY]
* Weryfikacja reguł dziewiarskich i szydełkowych u sprawdzonych źródeł (standardy Craft Yarn Council, normy metryczne i imperialne ISO).
* Fakty o cenach subskrypcji i planach sprawdzane na bieżąco i zapisywane z datą odczytu w rejestrze decyzji.
* Rachunek z danych użytkownika (np. gęstość próbki, przeliczenie oczek) to kalkulacja domenowa, nie twierdzenie merytoryczne.

### 1.3. Trzy Zasady Ogólne (z modułu gier, l. 38) — [WŁĄCZONE]
1. **Jedno źródło prawdy z generatorami** zamiast ręcznego kopiowania liczb.
2. **„Udokumentowane” $\neq$ „zaimplementowane”**; „ma dzisiejszą datę” $\neq$ „zweryfikowane” — przy wątpliwości uruchomić i sprawdzić na żywo.
3. **Warianty i archiwalne wersje** modelu jako jawnie oznaczone kopie obok kanonu.

### 1.4. Moduły Wyłączone
* *Moduł: Projektowanie gier (mechaniki, ekonomia w grach)* — wyłączony.
* *Moduł: Produkcja medialna z AI (podcast, wideo)* — wyłączony.

---

## 2. Katalog Ról dla Projektu Oczko

| Rola | Kiedy stosować | Model | Granice i Odpowiedzialność |
| :--- | :--- | :--- | :--- |
| **Analityk produktu** | Nowe funkcje, przepływy i interakcje UI | mocny | Specyfikacja z co najmniej 2 opcjami do wyboru, kompromisami i rekomendacją; `[DO WYJAŚNIENIA]` zamiast zgadywania. |
| **Badacz merytoryczny** | Reguły rzemiosła, normy włóczek, wytyczne Apple | mocny | Przeczytane źródła z miejscem i datą odczytu; weryfikacja u źródła. |
| **Programista** | Implementacja zatwierdzonej specyfikacji | tańszy | TDD: test najpierw, minimalny zakres, zakaz osłabiania testów i podnoszenia progów budżetów. |
| **Tłumacz** | Słowniki i teksty wielojęzyczne (PL/EN) | tańszy | 100% symetria kluczy i18n (`check:i18n`), spójne słownictwo rzemieślnicze. |
| **Tester E2E / QA** | Analiza regresji i symulacja interakcji | tańszy | Dowód z logu/testu $\rightarrow$ klasyfikacja (aplikacja/środowisko/test) $\rightarrow$ ocena realności problemu (realny/brzegowy/teoretyczny). |
| **Audytor** | Niezależny audyt architektury i bezpieczeństwa | mocny | Świeży kontekst, tylko znaleziska z twardym dowodem i pewnością $> 80\%$. |
| **Wydawca** | Przygotowanie wydań, EAS Build, TestFlight | tańszy | Wersjonowanie semantyczne, numery buildów, pliki `app.json`, `eas.json`. |
| **Sekretarz dokumentacji** | Rejestr decyzji (`decyzje_biezace.md`) | tańszy | Zapis decyzji z datą (DEC-XX), opcjami, kompromisami, powodem i zależnościami. |
| **Koordynator** | Sesja główna, weryfikacja bramek CI | mocny | Kontrola bramki `npm run verify` przed jakimkolwiek commitem i pushem do gałęzi `main`. |

---

## 3. Rejestr Jawnych Wyjątków od Zasad (Zasada 7)

Zgodnie z **Zasadą 7** (*„Wyjątki od zasad dozwolone, ale nazwane i zapisane; ryzykowną część zastąp tańszą kontrolą, nie żadną”*):

* **EXC-01 (Statyczne słowniki encyklopedyczne):**
  - **Plik:** `src/core/technique-library.ts` (42.9 KB).
  - **Dotyczy zasady:** Orientacyjny limit rozmiaru modułu $\le 20$ KB.
  - **Uzasadnienie:** Plik jest monolitycznym, niemutowalnym słownikiem definicji technik dziewiarskich i szydełkowych (czyste stałe tekstowe z typami). Sztuczny podział na mniejsze pliki rozbiłby integralność słownika bez żadnego zysku wydajnościowego ani architektonicznego.
  - **Tańsza kontrola zastępcza:** Zautomatyzowany test `src/core/__tests__/technique-library.test.ts` (100% pokrycia testowego) oraz weryfikacja `madge --circular` (0 cykli zależności).
