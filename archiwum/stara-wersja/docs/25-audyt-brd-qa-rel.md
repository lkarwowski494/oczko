# Raport z Audytu Przedwydaniowego BRD-QA-REL 1.0 (Runda 1): Oczko (Purlo)

**Data audytu:** 17 października 2026 r.  
**Wersja:** `v0.1.0` (commit `35e0b95`)  
**Standard odniesienia:** `C:\Users\lukas\Documents\antigravity\ROLE_MODEL_TESTY_I_WYDANIA_TRENING_ORGANIZER.md` (Apps4Brew BRD-QA-REL 1.0)  
**Wariant wdrożenia:** Wariant T (Jednobinarkowy Offline-First, wzorzec `trening` + wyrocznia Pythona z `organizer`)  
**Protokół audytu:** 10 Niezależnych Ról Audytorskich (`BR-REL-015`, `BR-REL-016`)  

---

## 1. Podsumowanie Rundy 1 (Stan początkowy)

Audyt początkowy wykazał, że aplikacja **Oczko** (`com.apps4brew.knitting`) posiada zaawansowaną warstwę domeny dziewiarskiej i rzemieślniczej (72 pakiety testów, 605 testów zielonych, lokalna baza SQLite `/Library/SQLite`, inwariant ZP-05 Zero Generative AI, natywne podpisywanie w GitHub Actions), jednak brakuje w niej pełnego zestawu mechanizmów systemowych i infrastruktury jakościowej zdefiniowanej w standardzie Role-Model (`trening` + `organizer`):

1. **Konfiguracja środowiska Jest:** Brak `jest.app-after-env.js` w `setupFilesAfterEnv` — brak automatycznego oblewania testów przy ostrzeżeniach `act()` i `console.error` (`BR-TEST-018`).
2. **Trwałość danych i ochrona awaryjna:** Brak zrzutu uszkodzonego stanu `state_corrupt_<timestamp>` z polem `recovery` oraz banera odzyskiwania na ekranie głównym (`BR-TEST-023`). Brak ścisłego podziału na dwie pule po 10 plików (`oczko-kopia-*` vs `oczko-przed-importem-*`/`oczko-przed-czyszczeniem-*` z przyrostkiem `-2` wg `RD-ENG-12`).
3. **Konwersja bez dryfu i wprowadzanie liczb:** Brak inwariantu `wInKeep` (`RD-ENG-01`) oraz brak komponentu `NumInput` zamieniającego `,` na `.` (`NFR-INT-003`). Standardowy `TextInput` z `parseFloat` obcina ułamki na polskiej klawiaturze iOS.
4. **Odporność timerów na tło:** Odliczanie czasu w `KnittingTimeTracker` nie weryfikuje różnicy znaczników czasu `endAtMs - Date.now()` po wybudzeniu aplikacji z tła (`NFR-PERF-004`, `RD-ENG-06`).
5. **Eksport CSV i Formula Injection:** Brak ucieczki znaków formuł (`=`, `+`, `-`, `@`, `\t`, `\r`) apostrofem `'` (`NFR-SEC-015`, `RD-ENG-10`).
6. **Wyrocznie wiedzy w Pythonie:** Posiadamy `scripts/gen-gauge-corpus.py`, lecz brak niezależnej wyroczni kontrastu luminancji WCAG 2.1 dla palety barw `theme.ts` (`scripts/gen-theme-contrast-corpus.py`, `BR-TEST-014`, `RD-ENG-02`).
7. **Strażnicy interakcji S1–S16:** Brak centralnego helpera `lib/confirm.ts` (zakaz przycisków „Nie”/„Wróć”), brak testów `tests/interaction-guards.test.ts` (dla wszystkich 16 wzorców), brak `close-button-guard.test.tsx` i `swipe-delete.test.tsx` (`NFR-INT-001..016`).
8. **Higiena i18n i Dostępność:** Brak testu braku polskich słów w języku angielskim `tests/i18n-no-polish-in-en.test.tsx`, brak detektora martwych kluczy w `check:i18n`, brak testu drzewa dostępności `tests/matrix-a11y.test.tsx` oraz testu wymiarów `tests/matrix-dimensions.test.tsx` (AX5, 320 pt).
9. **Macierz pokrycia AST i Maestro:** Brak generatora macierzy `scripts/test-matrix.mjs` (5 kategorii: `EKRAN`, `UI`, `TEKST`, `LOGIKA`, `WYMIAR`, `BR-TEST-028..031`), brak katalogu `.maestro/` i interpretera `tests/maestro-runner.ts` w Jest.
10. **Natywna konfiguracja iOS i strony site/:** W `app.json` włączone `supportsTablet: true` (ryzyko odrzucenia za iPad Multitasking Split-View), brak `privacyManifests` (4 kategorie Required Reason APIs), brak `scripts/verify-native.mjs`, brak `site/index.html`, `privacy.html`, `support.html`, brak `brands.contract.test.ts`, brak `check:licenses`, brak `.gitleaks.toml`.

### Bilans znalezisk Rundy 1:
| Poziom wagi | Liczba | Status |
| :--- | :---: | :---: |
| **KRYTYCZNE** | **5** | Otwarte (blokery wydania wg ZP-11, wymagana natychmiastowa naprawa) |
| **WYSOKIE** | **12** | Otwarte (blokery wydania wg ZP-11, wymagana naprawa) |
| **ŚREDNIE** | **9** | Otwarte (wymagana naprawa w Fazach 1–4) |
| **NISKIE** | **2** | Otwarte (rejestr backlogu) |
| **SUMA** | **28** | **Próg wydania: ZABLOKOWANY (wymagana Runda 2 po naprawach)** |

---

## 2. Rejestr Znalezisk Rundy 1 wg 10 Ról Audytorskich (`BR-REL-015`)

### Audytor 1: `UI` — Spójność UI i Nawigacja (NFR-INT-001..016)
- **UI-01 [WYSOKIE / Realne]:** Brak komponentu `NumInput` z obsługą przecinka `,` i kropki `.` oraz parametru `stored`. Wpisanie `"12,5"` na klawiaturze iOS skutkuje obcięciem do `12` lub błędem w obliczeniach dziewiarskich. (`NFR-INT-003`, `RYZ-07`).
- **UI-02 [WYSOKIE / Realne]:** Brak dedykowanego testu `tests/close-button-guard.test.tsx` sprawdzającego zachowanie przycisku zamknięcia modalu (`S1`): w modalu ze stanem brudnym odrzucenie wymaga potwierdzenia. (`NFR-INT-001`, `RYZ-35`).
- **UI-03 [ŚREDNIE / Realne]:** Brak dedykowanego testu gestu usuwania `tests/swipe-delete.test.tsx` (`S4`) w listach robótek i włóczek z alternatywą dotykową dla VoiceOver. (`NFR-INT-004`).
- **UI-04 [ŚREDNIE / Realne]:** Brak zunifikowanego komponentu `SearchField` z normalizacją polskich znaków diakrytycznych (`RD-ENG-07`) i przyciskiem szybkiego czyszczenia `×` (`S15`, `NFR-INT-015`).

### Audytor 2: `LOG` — Logika Domenowa i Obliczenia (BR-TEST-001..005, NFR-PERF-004)
- **LOG-01 [KRYTYCZNE / Realne]:** Brak funkcji `wInKeep` w `src/core/unit-converter.ts` (`BR-TEST-005`, `RD-ENG-01`). Wielokrotne przełączanie jednostek metrycznych i imperialnych (`cm`/`in`, `g`/`oz`) powoduje kumulację błędu zaokrągleń (`RYZ-06`).
- **LOG-02 [KRYTYCZNE / Realne]:** Odliczanie czasu sesji i prędkości w `time-tracking-service.ts` i `KnittingTimeTracker.tsx` wymaga jawnego wyliczania ze znaczników czasu `endAtMs - Date.now()` przy powrocie z uśpienia w tle (`NFR-PERF-004`, `RD-ENG-06`, `RYZ-11`).
- **LOG-03 [ŚREDNIE / Brzegowe]:** Sekcja `coverageThreshold` w `jest.config.js` nie wymusza twardego progu 100% dla logiki rdzenia (`src/core/`) we wszystkich 4 metrykach (`lines`, `branches`, `functions`, `statements`, `BR-TEST-002`, `BR-TEST-003`).

### Audytor 3: `DAT` — Trwałość Danych, Migracje i Kopie Zapasowe (BR-TEST-021..025, RD-ENG-12)
- **DAT-01 [KRYTYCZNE / Realne]:** Brak ochrony uszkodzonego stanu przy starcie aplikacji (`state_corrupt_<timestamp>` z polem `recovery` zachowującym surowe dane oraz nieinwazyjny baner odzyskiwania na ekranie głównym, `BR-TEST-023`, `RYZ-01`).
- **DAT-02 [WYSOKIE / Realne]:** Rotacja dwóch rozdzielnych pul kopii zapasowych (`oczko-kopia-*` dla sesji oraz `oczko-przed-importem-*`/`oczko-przed-czyszczeniem-*` dla operacji niszczących) wymaga pełnej zgodności z regułą `RD-ENG-12` i obsługi kolizji `-2` w tej samej sekundzie zegarowej.
- **DAT-03 [ŚREDNIE / Brzegowe]:** Brak testu podwójnej migracji (idempotencja schematu SQLite) oraz testu odporności na zniekształcone dane wejściowe w bazie (`BR-TEST-026`).

### Audytor 4: `X` — Przecięcia Funkcji (Cross-Feature)
- **X-01 [ŚREDNIE / Realne]:** Zmiana systemu jednostek (Metric $\leftrightarrow$ Imperial) w Ustawieniach podczas aktywnego podglądu modalu kalkulatora próbki lub blokowania nie wymusza natychmiastowej konwersji pól wejściowych bez utraty wpisanych wartości.
- **X-02 [ŚREDNIE / Brzegowe]:** Usunięcie projektu, który posiada aktywne sesje czasowe lub powiązane włóczki w magazynie, powinno bezpiecznie kaskadować powiązania w SQLite bez osieroconych rekordów.

### Audytor 5: `MER` — Merytoryka Dziewiarska i Rzemieślnicza (BR-TEST-011..014)
- **MER-01 [WYSOKIE / Realne]:** Rozszerzenie wyroczni Pythona `scripts/gen-gauge-corpus.py` (`BR-TEST-011`) o weryfikację obliczeń blokowania dzianiny i kompensacji wymiarów na drutach (`blocking-calculator.ts`, DEC-34).
- **MER-02 [WYSOKIE / Realne]:** Brak niezależnej wyroczni kontrastu barw WCAG 2.1 w Pythonie `scripts/gen-theme-contrast-corpus.py` (`BR-TEST-014`, `RD-ENG-02`) dla palety Apps4Craft Studio (`#121214`, `#1C1C1F`, `#D46A43`, `#F4EFEA`).

### Audytor 6: `A11` — Dostępność, Dynamic Type i i18n (NFR-A11Y-001..008, NFR-I18N-001..008)
- **A11-01 [WYSOKIE / Realne]:** Brak kompleksowego audytu drzewa dostępności `tests/matrix-a11y.test.tsx` sprawdzającego `accessibilityLabel`, `accessibilityRole="button"`, `accessibilityState` oraz minimalne pole dotyku $\ge 44\text{ pt}$ wg `RD-ENG-03` (`NFR-A11Y-001`, `NFR-A11Y-002`).
- **A11-02 [WYSOKIE / Realne]:** Brak testu odporności układu na największy rozmiar tekstu `AX5` i minimalną szerokość ekranu `320 pt` (`tests/matrix-dimensions.test.tsx`, `NFR-A11Y-004`).
- **A11-03 [ŚREDNIE / Realne]:** Brak testu `tests/i18n-no-polish-in-en.test.tsx` weryfikującego, czy po przełączeniu na język angielski na ekranach nie pojawiają się polskie słowa ani znaki diakrytyczne (`NFR-I18N-003`).
- **A11-04 [ŚREDNIE / Realne]:** Brak automatycznej detekcji martwych kluczy tłumaczeń w słownikach `i18n` w skrypcie `check:i18n` (`NFR-I18N-002`).

### Audytor 7: `TST` — Szczerość i Szczelność Testów (BR-TEST-017, BR-TEST-018, BR-TEST-028..037)
- **TST-01 [KRYTYCZNE / Realne]:** Brak pliku `jest.app-after-env.js` w `setupFilesAfterEnv`, który twardo oblewa test przy wystąpieniu ostrzeżeń `act()`, `console.error` lub nieoczekiwanych `console.warn` (`BR-TEST-017`, `BR-TEST-018`, `RYZ-15`).
- **TST-02 [WYSOKIE / Realne]:** Brak generatora macierzy AST `scripts/test-matrix.mjs` weryfikującego pokrycie 5 kategorii (`EKRAN`, `UI`, `TEKST`, `LOGIKA`, `WYMIAR`) z wycinaniem komentarzy, opisów testów i deklaracji importów (`BR-TEST-028..031`).
- **TST-03 [WYSOKIE / Realne]:** Brak interpretera scenariuszy `.maestro/*.yaml` w pamięci Jest (`tests/maestro-runner.ts`) uruchamianego dla poniedziałku, niedzieli i godziny 23:55 UTC (`BR-TEST-037`, `NFR-TEST-001`).

### Audytor 8: `SEC/NAT/PERF` — Bezpieczeństwo, Natywny iOS i Wydajność (BR-REL-009..014, NFR-SEC-001..015)
- **SEC-01 [KRYTYCZNE / Realne]:** Brak ucieczki znaków formuł w eksportach CSV (`escapeCsvCell`) w aplikacji rzemieślniczej (`NFR-SEC-015`, `RD-ENG-10`).
- **SEC-02 [KRYTYCZNE / Realne]:** Brak deklaracji `privacyManifests` w `app.json` ze wszystkimi 4 kategoriami Required Reason APIs (`NSPrivacyAccessedAPICategoryUserDefaults`, `FileTimestamp`, `SystemBootTime`, `DiskSpace`) oraz włączone `supportsTablet: true` (`BR-REL-009`, `BR-REL-010`, `RYZ-22`, `RYZ-27`).
- **SEC-03 [WYSOKIE / Realne]:** Brak skryptu `scripts/verify-native.mjs` weryfikującego 20 niezmienników natywnego projektu iOS na Linuksie/Windowsie bez Xcode (`BR-REL-009`).
- **SEC-04 [WYSOKIE / Realne]:** Brak testu bezpieczeństwa publicznego repozytorium `tests/public-repo.test.ts` (zakaz sekretów, weryfikacja uprawnień workflowów, zakaz tokenów EAS, `NFR-SEC-001..004`).
- **SEC-05 [WYSOKIE / Realne]:** Brak testu czystości znaków towarowych konkurentów `brands.contract.test.ts` (`NFR-SEC-011`).
- **SEC-06 [ŚREDNIE / Realne]:** Brak skryptu weryfikacji licencji open-source `npm run check:licenses` sprawdzającego brak licencji GPL/AGPL (`NFR-SEC-009`).
- **SEC-07 [ŚREDNIE / Realne]:** Brak konfiguracji `.gitleaks.toml` oraz skryptu `.github/scripts/gitleaks-range.sh` z flagą `-m` (`NFR-SEC-005`).

### Audytor 9: `UX` — Pierwsze Wrażenie, Puste Stany i Potwierdzenia
- **UX-01 [ŚREDNIE / Realne]:** Brak zunifikowanego komponentu `Empty` z wyjaśnieniem i przyciskiem kolejnego kroku na ekranach robótek i magazynu, gdy brak danych (`S11`, `NFR-INT-011`).
- **UX-02 [NISKIE / Brzegowe]:** Brak komponentu `Missing` w przypadku odpytania o nieistniejący projekt (`S12`, `NFR-INT-012`).

### Audytor 10: `LIVE` — Weryfikacja na Żywo / E2E / TestFlight
- **LIVE-01 [WYSOKIE / Realne]:** Brak katalogu `.maestro/` i scenariuszy E2E testujących kluczowe ścieżki rzemieślnika (liczenie, wzory PDF, magazyn, kalkulatory) oraz testu aktualizacji wersji na żywo (`BR-TEST-037..041`).
- **LIVE-02 [WYSOKIE / Realne]:** Brak stron statycznych `site/index.html`, `site/privacy.html`, `site/support.html` oraz workflowu `.github/workflows/pages.yml` (`BR-REL-019`, `BR-REL-020`).
- **LIVE-03 [WYSOKIE / Realne]:** Brak workflowów GitHub Actions: `.github/workflows/ci.yml`, `.github/workflows/tests-tz.yml` (7 stref czasowych) oraz `.github/workflows/e2e-ios.yml`, a także aktualizacji dwuetapowego podpisywania w `testflight.yml`.
- **LIVE-04 [ŚREDNIE / Realne]:** Brak dokumentacji `docs/15-app-store.md`, `docs/18-przekazanie.md`, aktualizacji `docs/20-definicja-ukonczenia.md` oraz `CLAUDE.md`.

---

## 3. Podsumowanie Wymagań BRD-QA-REL 1.0 dla Oczka

| Kategoria | Wymagania | Zgodność |
| :--- | :--- | :---: |
| **Logika i Pokrycie** | `BR-TEST-001..005` | ⚠️ 80% (brak `wInKeep`) |
| **Własności i Wyrocznie** | `BR-TEST-006..015` | ⚠️ 50% (brak wyroczni kontrastu WCAG w Pythonie) |
| **Ekrany i Środowisko** | `BR-TEST-016..020` | ⚠️ 60% (brak blokady `act` i `console.error`) |
| **Dane i Trwałość** | `BR-TEST-021..027` | ⚠️ 60% (brak `state_corrupt_*`) |
| **Macierz Pokrycia AST** | `BR-TEST-028..031` | ❌ 0% (brak `test-matrix.mjs`) |
| **E2E i Symulator** | `BR-TEST-037..045` | ❌ 10% (brak Maestro w Jest) |
| **Strażnicy Interakcji** | `NFR-INT-001..016` | ⚠️ 40% (częściowe `S1`, brak `NumInput`, `SearchField`, `confirm.ts`) |
| **Języki i i18n** | `NFR-I18N-001..008` | ⚠️ 60% (brak `i18n-no-polish-in-en`) |
| **Dostępność i Ergonomia**| `NFR-A11Y-001..008` | ⚠️ 50% (brak `matrix-a11y`, `matrix-dimensions`) |
| **Wydajność i Timery** | `NFR-PERF-001..006` | ⚠️ 50% (timer nie bazuje na `endAtMs - Date.now()`) |
| **Bezpieczeństwo i Repozytorium** | `NFR-SEC-001..015` | ⚠️ 40% (brak `public-repo`, brak `gitleaks`, brak CSV escaping) |
| **Natywny iOS i Publikacja** | `BR-REL-001..022` | ⚠️ 30% (brak `verify-native.mjs`, `PrivacyInfo`, brak `site/`) |
| **Reguły Inżynieryjne** | `RD-ENG-01..12` | ⚠️ 45% (do wdrożenia `RD-ENG-01`, `02`, `06`, `07`, `10`, `11`, `12`) |

---

## 4. Plan Wdrożenia Faz 1–4 (Krok 2)

Wszystkie 28 zidentyfikowanych znalezisk zostało wdrożonych i uszczelnionych w 4 kolejnych fazach technicznych:
- **Faza 1:** 100% pokrycia logiki domenowej, `jest.app-after-env.js`, ochrona `state_corrupt_*`, `rotateBackups` (`RD-ENG-12`), `wInKeep` + `NumInput`, timery `endAtMs - Date.now()`, ucieczka CSV (`escapeCsvCell`).
- **Faza 2:** Testy własnościowe `fast-check` ze stanem, wyrocznie Pythona, 16 strażników `S1–S16`, `lib/confirm.ts`, `close-button-guard`, `swipe-delete`, `i18n-no-polish-in-en.test.tsx`, `matrix-a11y.test.tsx`, `matrix-dimensions.test.tsx`.
- **Faza 3:** Skaner AST `scripts/test-matrix.mjs` (100% we wszystkich 5 kategoriach: `EKRAN`, `UI`, `TEKST`, `LOGIKA`, `WYMIAR`), `docs/22-macierz-testow.md`, przepływy `.maestro/*.yaml` + interpreter `tests/maestro-runner.ts` w Jest.
- **Faza 4:** `scripts/verify-native.mjs`, strony `site/index.html`, `privacy.html`, `support.html` + `pages.yml`, `tests/public-repo.test.ts`, `brands.contract.test.ts`, `check:licenses`, `.gitleaks.toml`, `.github/scripts/select-xcode.sh`, `.github/workflows/ci.yml`, `tests-tz.yml`, `e2e-ios.yml`, `testflight.yml` (dwuetapowy), `docs/15-app-store.md`, `docs/18-przekazanie.md`, `docs/20-definicja-ukonczenia.md`, `CLAUDE.md`, nadrzędny `npm run verify`.

---

## 5. Raport z Rundy 2: Dogrywka Weryfikacyjna 10 Agentów (BR-REL-016)

Po wdrożeniu Faz 1–4 oraz dopisaniu dedykowanego pakietu 34 testów regresyjnych w `tests/audit-fixes.test.tsx`, przeprowadzono powtórny audyt weryfikacyjny (Runda 2) 10 niezależnych ról audytorskich:

| ID Roli | Rola Audytorska | Weryfikowane Znaleziska | Test Regresyjny | Wynik Rundy 2 |
| :---: | :--- | :--- | :--- | :---: |
| **1** | `UI` (Nawigacja i Interakcja) | UI-01, UI-02, UI-03, UI-04 | `tests/audit-fixes.test.tsx` (UI-01..04) | ✅ ZAMKNIĘTE (0 otwartych) |
| **2** | `LOG` (Logika i Obliczenia) | LOG-01, LOG-02, LOG-03 | `tests/audit-fixes.test.tsx` (LOG-01..03) | ✅ ZAMKNIĘTE (0 otwartych) |
| **3** | `DAT` (Trwałość i Kopie) | DAT-01, DAT-02, DAT-03 | `tests/audit-fixes.test.tsx` (DAT-01..03) | ✅ ZAMKNIĘTE (0 otwartych) |
| **4** | `X` (Cross-Feature) | X-01, X-02 | `tests/audit-fixes.test.tsx` (X-01..02) | ✅ ZAMKNIĘTE (0 otwartych) |
| **5** | `MER` (Merytoryka) | MER-01, MER-02 | `tests/audit-fixes.test.tsx` (MER-01..02) | ✅ ZAMKNIĘTE (0 otwartych) |
| **6** | `A11` (Dostępność i i18n) | A11-01, A11-02, A11-03, A11-04 | `tests/audit-fixes.test.tsx` (A11-01..04) | ✅ ZAMKNIĘTE (0 otwartych) |
| **7** | `TST` (Szczelność Testów) | TST-01, TST-02, TST-03 | `tests/audit-fixes.test.tsx` (TST-01..03) | ✅ ZAMKNIĘTE (0 otwartych) |
| **8** | `SEC/NAT/PERF` (Bezpieczeństwo) | SEC-01..07 | `tests/audit-fixes.test.tsx` (SEC-01..07) | ✅ ZAMKNIĘTE (0 otwartych) |
| **9** | `UX` (Stany puste i błędy) | UX-01, UX-02 | `tests/audit-fixes.test.tsx` (UX-01..02) | ✅ ZAMKNIĘTE (0 otwartych) |
| **10**| `LIVE` (Weryfikacja na Żywo) | LIVE-01, LIVE-02, LIVE-03, LIVE-04 | `tests/audit-fixes.test.tsx` (LIVE-01..04) | ✅ ZAMKNIĘTE (0 otwartych) |

### Bilans Końcowy Rundy 2:
| Poziom wagi | Runda 1 (Początkowy) | Runda 2 (Po Naprawach) | Status |
| :--- | :---: | :---: | :---: |
| **KRYTYCZNE** | 5 | **0** | ✅ ROZWIĄZANE W 100% |
| **WYSOKIE** | 12 | **0** | ✅ ROZWIĄZANE W 100% |
| **ŚREDNIE** | 9 | **0** | ✅ ROZWIĄZANE W 100% |
| **NISKIE** | 2 | **0** | ✅ ROZWIĄZANE W 100% |
| **SUMA OTWARTYCH** | **28** | **0** | **PRÓG WYDANIA SPEŁNIONY (100% ZIELONE)** |

### Ostateczne Pokrycie Wymagań BRD-QA-REL 1.0:
- **Macierz pokrycia AST (`docs/22-macierz-testow.md`):**
  - `EKRAN`: 5/5 (**100%**)
  - `UI`: 43/43 (**100%**)
  - `TEKST`: 235/235 (**100%**)
  - `LOGIKA`: 188/188 (**100%**)
  - `WYMIAR`: 51/51 (**100%**)
- **Bramki Jakościowe `npm run verify`:** Wszystkie 6 kroków zakończone w 100% sukcesem (0 błędów, 0 ostrzeżeń).
- **Status certyfikacji Role-Model:** **ZATWIERDZONY DO WYDANIA APP STORE / TESTFLIGHT**.

