# Oczko — Rejestr bieżący decyzji i stanu projektu
**Data aktualizacji:** 15.10.2026  
**Właściciel:** Łukasz  
**Status projektu:** Start fazy budowy (Tydzień 0)

---

## 1. Przyjęte moduły i role (odkrycie ról, Zasada 10)
* **Obowiązujące moduły:**
  1. *Moduł: aplikacje (oprogramowanie)* (TDD, testy przed kodem, potwierdzanie czerwonego testu na kodzie przed poprawką, praca odporna na przerwy, narzędzia 0 zł).
  2. *Moduł: research i treści merytoryczne* (5 szczebli hierarchii źródeł, czytanie par zdań, brak faktów z pamięci).
  3. *3 zasady ogólne z modułu gier* (jedno źródło prawdy z generatorami, „udokumentowane” ≠ „zweryfikowane”, warianty/archiwa obok kanonu).
* **Odrzucone moduły:**
  * *Moduł: produkcja medialna z AI* (ZP-05: brak treści generowanych przez AI w produkcie).
* **Aktywne role:**
  * Analityk produktu, Badacz merytoryczny, Programista, Tester E2E, Audytor / Weryfikator treści, Sekretarz dokumentacji, Koordynator.

---

## 2. Rozstrzygnięte decyzje (Blok I — przed startem budowy)

* **DEC-01 Zakres pierwszej wersji: Opcja (b+) — Rekomendowana**
  * *Zakres:* 128 BR (122 MUST + 6 wyjątków higieny: ochrona przed podwójnym liczeniem BR-LICZ-007, cyfrowa koronka BR-ZEG-003, widżet Smart Stack z „+1” BR-ZEG-009, kontrolka/przycisk czynności BR-SYS-011, 14 dni próby BR-ZAK-003, Family Sharing BR-ZAK-011).
  * *Nakład:* ok. 26–44 dni pracy agenta (3–4 tyg. kalendarza).
* **DEC-02 Garmin w MVP czy zaraz po: Opcja B**
  * *Rozstrzygnięcie:* Wersja na zegarki Garmin w wersji 1.1 (zaraz po MVP); w MVP prototyp modułu w Expo/React Native eliminujący ryzyko architektoniczne.
* **DEC-03 Pełna aplikacja na Apple Watch w MVP: Opcja A**
  * *Rozstrzygnięcie:* Pełna niezależna aplikacja (gest, koronka, wibracje haptyczne).
* **DEC-04 Nauka jako wyróżnik: Opcja A**
  * *Rozstrzygnięcie:* Tak, nauka wchodzi do produktu od wersji 1.0 (trener z powtórkami, słownik, karty technik).
* **DEC-05 Bundle ID: Opcja A**
  * *Rozstrzygnięcie:* `com.apps4brew.knitting` (trwały, niezależny od ewentualnej zmiany nazwy handlowej).
* **DEC-06 Repozytorium robocze i organizacja: Decyzja właściciela (15.10.2026)**
  * *Rozstrzygnięcie:* Pracujemy bezpośrednio w repozytorium [`lkarwowski494/Oczko`](https://github.com/lkarwowski494/Oczko). Przeniesienie do organizacji `Apps4Brew` następuje dopiero na etapie wydania PROD w App Store.
  * **KRYTYCZNA ZASADA BEZPIECZEŃSTWA (INWARIANT):** Repozytorium [`lkarwowski494/trening`](https://github.com/lkarwowski494/trening) jest **ŚCIŚLE READ-ONLY**. Absolutny zakaz modyfikacji, usuwania, commita i pusha do projektu Trening. Służy wyłącznie do odczytu i powielania architektury.
* **DEC-07 Hierarchia źródeł: Opcja A**
  * *Rozstrzygnięcie:* 5 szczebli: 1. rachunek → 2. normy branżowe → 3. podręczniki → 4. organizacje/serwisy → 5. praktyka (społeczność).
* **DEC-08 Minimalna wersja iOS / watchOS: Opcja B**
  * *Rozstrzygnięcie:* iOS 18 / watchOS 11 (obsługa kontrolek, gestów, widżetów Smart Stack).
* **DEC-09 Przeglądarka PDF: Opcja A**
  * *Rozstrzygnięcie:* Własny moduł z linijką przypiętą do strony (spełnia NFR-DOST-009).
* **DEC-10 Kopia i synchronizacja: Opcja A**
  * *Rozstrzygnięcie:* W MVP kopia w pliku + iCloud Drive użytkownika; synchronizacja w chmurze (CloudKit) w wersji 2.x. Pliki wzorów domyślnie wyłączone z kopii do czasu opinii prawnej (DEC-33).

---

## 3. Rozstrzygnięte decyzje (Blok II — kluczowe zasady produktu)
* **DEC-11 Model wejścia:** W4 + G2 (darmowy rdzeń z limitem na 1 aktywny projekt + 14 dni pełnej wersji; zegarek i Garmin darmowe dla 1 projektu).
* **DEC-12 Family Sharing:** Opcja A (włączone dla subskrypcji i zakupu dożywotniego).
* **DEC-13 Ilustracje technik:** Opcja A (rysowane kodem, 0 zł).
* **DEC-16 Rozpoznawanie ściegu:** Opcja A (klucz „co widzisz?” bez AI w MVP, klasyfikator w 1.1).
* **DEC-17 Trener wzorów w MVP:** Opcja A (słownik + 4 ćwiczenia z powtórkami, bez parsera wzorów).
* **DEC-18 Języki terminologii w MVP:** Opcja A (EN-US/UK, DE, FR, polskie druty; polskie szydełko opisowo).
* **DEC-21 iPad i Mac:** Opcja A (iPhone w MVP, iPad w 1.2; Mac wyłączony w ASC do czasu testu).
* **DEC-24 Glify symboli:** Opcja A (własne glify wektorowe + przypis do standardu + równoległe zapytanie o licencję).

* **DEC-25 Architektura nawigacji aplikacji:** Opcja A (15.10.2026)
  * *Rozstrzygnięcie:* 5-zakładkowa architektura w Expo Router (`app/(tabs)/`: `index` Licznik, `projects` Projekty, `stash` Magazyn, `learn` Nauka, `settings` Ustawienia) z root layoutem Stack oraz `SafeAreaProvider`.

* **ZAS-TYMCZ Tymczasowa reguła wykonawcza właściciela (15.10.2026):**
  * *Rozstrzygnięcie:* Agent automatycznie przyjmuje rekomendowane opcje decyzyjne i nieprzerwanie kontynuuje implementację kolejnych modułów MVP, raportując twarde dowody (testy, CI) oraz aktualny stan po każdym kroku (obowiązuje do odwołania przez właściciela).

* **ZAS-QA-01 Bezwzględny standard jakości i wieloperspektywicznych testów (Reguła właściciela — 15.10.2026):**
  * *Rozstrzygnięcie:* **Każda nowa funkcja, zmiana logiki lub modyfikacja interfejsu w projekcie Oczko bezwzględnie musi otrzymać lub zaktualizować zestaw testów automatycznych w standardzie i zakresie repozytorium `organizer`**.
  * *Obowiązujące wymogi dla każdego zadania i commita:*
    1. **100% Pokrycia Linii (100% Line Coverage):** Żaden plik domenowy, serwisowy ani komponentowy nie może spaść poniżej 100% pokrycia linii (`npm run test:coverage`).
    2. **Property-Based Testing (PBT / `fast-check`):** Nowe algorytmy obliczeniowe i operacje na stanach muszą posiadać testy niezmienników matematycznych na tysiącach generowanych danych wejściowych (`npm run test:pbt`).
    3. **Kontrakty Dostępności i Apple HIG:** Każdy nowy widok/przycisk/modal musi spełniać kryteria obszaru dotyku $\ge 44 \times 44\,\text{pt}$, etykiety VoiceOver i odporność modali (`npm run test:a11y`).
    4. **Strażnicy Architektury (Architecture & Security Guards):** Sprawdzanie sparametryzowania SQL (`?`) oraz zachowania czystości domeny (brak zależności UI w `src/core/`).
    5. **Budżety Wydajnościowe (Performance Budget):** Obliczenia, filtry i replay event-sourcingu muszą mieścić się w rygorystycznych limitach czasu CPU (`npm run test:perf`).
    6. **Odporność i Wstrzykiwanie Błędów (Resilience & Fault Injection):** Obsługa wartości brzegowych, dzielenia przez zero, uszkodzonych plików JSON oraz transakcyjnego rollbacku bez częściowych zapisów (`npm run test:resilience`).
    7. **Współbieżność i Wyścigi (Concurrency & Race Conditions):** Weryfikacja determinizmu zdarzeń submilisekundowych, buforowania offline i bezkonfliktowej synchronizacji (`npm run test:concurrency`).
    8. **Zero Błędów Typowania i Zielone CI:** `npx tsc --noEmit` musi kończyć się z kodem 0, a każdy pipeline GitHub Actions musi przejść na zielono.

---

## 4. Postęp implementacji MVP (Tydzień 0/1)
* **Zrealizowane wymagania:**
  * **BR-LICZ-001 & 003**: Silnik licznika, obsługa cykli i powtórzeń, progi powiadomień (`src/core/counter-engine.ts`).
  * **BR-LICZ-004**: Obsługa niezawodnego cofania (UNDO) ze znakowaniem zdarzeń anulowanych.
  * **BR-LICZ-007**: Ochrona przed podwójnym liczeniem (debounce 300 ms dla manualnych stuknięć, detekcja potencjalnych duplikatów między urządzeniami <= 2s).
  * **BR-LICZ-008 & BR-DANE-001**: Trwałość w SQLite (`src/core/database.ts`, `src/core/project-repository.ts`), niezmienny dziennik zdarzeń (append-only), pełne odtwarzanie stanu po awarii i restarcie.
  * **BR-NAV-001 & Architektura UI**: Pełny layout nawigacyjny w Expo Router (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`) z 5 dedykowanymi ekranami: Licznik (`index.tsx`), Projekty (`projects.tsx`), Magazyn (`stash.tsx`), Nauka (`learn.tsx`), Ustawienia (`settings.tsx`).
  * **BR-PROJ-001...005 & Pionowy plasterek (Vertical Slice)**:
    - Serwis zarządzania cyklem życia projektów i wyliczania postępów (`src/core/project-service.ts`).
    - Reaktywny kontekst stanu `ProjectProvider` (`src/core/project-context.tsx`) łączący SQLite z UI.
    - Interaktywny ekran `Projekty` z modalem tworzenia robótek (nazwa, druty/szydełko, części, docelowe rzędy) i wyborem aktywnego projektu.
    - Pełna integracja z ekranem `Licznik`: stuknięcie w ekran trwale rejestruje krok w SQLite (`counter_events`), odświeża stan w czasie rzeczywistym i umożliwia cofanie (UNDO).
  * **DEC-04, DEC-17, DEC-18, DEC-24 & Moduł Nauka (Wyróżnik MVP)**:
    - Autorytatywna baza 42 terminów dziewiarskich i szydełkowych (`src/core/glossary-data.ts`) ze standardem CYC, terminologią PL ↔ EN / DE / FR, glifami i filtrowaniem po kategoriach.
    - Silnik trenażera powtórzeń sekwencji ściegów (`src/core/pattern-trainer.ts`) z 4 wzorcami (Ściągacz 2x2, Ścieg ryżowy, Warkocz C6F, Ażur z dziurkami).
    - Interaktywny ekran `app/(tabs)/learn.tsx` z przełącznikiem trybów (Słownik / Trenażer), podglądem bieżącego kroku, stroną RS/WS, licznikiem powtórzeń w rzędzie oraz ekranem gratulacyjnym.
  * **BR-MAG-001...005 & Trwały Magazyn Włóczek i Narzędzi w SQLite**:
    - Tabele `stash_yarns` i `stash_tools` ze schematem SQLite i indeksami (`src/core/database-schema.ts`, `src/core/database.ts`).
    - Repozytorium operacji CRUD i seedowania danych startowych (`src/core/stash-repository.ts`).
    - Interaktywny interfejs `app/(tabs)/stash.tsx` z przełącznikiem Włóczki / Druty i szydełka, modalem rejestracji nowych motków i akcesoriów oraz operacją zużycia motka.
  * **BR-PROJ-002, BR-LICZ-003, BR-LICZ-005 & Wieloczęściowość i Powiązane Liczniki Modulo (Warkocze / Ażury)**:
    - Rozszerzenie `ProjectService` o dodawanie części robótki oraz liczników powiązanych z konfigurowalnym modulo cyklu i etykietą przypomnienia (`addPartToProject`, `addLinkedCounterToPart`).
    - Synchroniczna inkrementacja licznika powiązanego w `ProjectFacade.stepCounter` przy kroku licznika głównego części.
    - Transakcyjne i spójne wycofywanie (UNDO) kroku nadrzędnego wraz z powiązanymi krokami podrzędnymi w pojedynczej transakcji SQLite (`createAndApplyUndoWithLinked`).
    - Interfejs `MainCounterScreen`: poziomy pasek wyboru części robótki (chipsy) z licznikami rzędów, karty powiązanych liczników z wyliczaniem rzędu w powtórzeniu (np. `Rząd 4/6 (Powt. 2)`), plakietki ostrzeżeń/przypomnień oraz modal szybkiego dodawania wzorów/warkoczy.
    - Ekran `app/(tabs)/projects.tsx`: podgląd wszystkich części i ich postępu dla każdego projektu oraz modal dodawania nowej części.
  * **DEC-10, ZP-06, BR-DANE-002 & Kopia Zapasowa Bazy SQLite (Export / Import JSON)**:
    - Serwis kopii bezpieczeństwa `src/core/backup-service.ts` realizujący pełny eksport wszystkich 6 tabel bazy SQLite wraz z metadanymi wersji, bundle ID i liczbą rekordów.
    - Ścisła walidacja strukturalna formatu pliku przed przywróceniem (`validateBackupData`).
    - Atomowe, transakcyjne przywracanie stanu z kopii zapasowej (`importDatabaseBackup`) z kaskadowym czyszczeniem i odtwarzaniem powiązań kluczy obcych.
    - Interfejs `app/(tabs)/settings.tsx`: kafel statystyk bazy w czasie rzeczywistym (liczba projektów, zdarzeń, włóczek, narzędzi), natywny eksport przez systemowy Share Sheet (zapis do plików, iCloud, AirDrop) oraz modal bezpiecznego przywracania z podglądem błędów walidacji.
  * **DEC-09, NFR-DOST-009 & Przeglądarka Schematów z Linijką Przypiętą do Wiersza (Pattern Guide Viewer)**:
    - Baza wbudowanych schematów dziewiarskich CYC (`src/core/pattern-guide-data.ts`) dla warkoczy (C6F) oraz ażurów z dziurkami (romby).
    - Komponent `src/components/PatternGuideViewer.tsx` wyposażony w interaktywną, półprzezroczystą linijkę o wysokim kontraście (high accessibility NFR-DOST-009) podświetlającą bieżący wiersz diagramu.
    - Opcja automatycznego kroku linijki (`Auto-krok`) zsynchronizowana z licznikiem głównym robótki oraz tryb ręcznego przesuwania linijki po diagramie.
    - Zintegrowany przełącznik widoku w `src/screens/MainCounterScreen.tsx` (`🔢 Licznik` vs `📜 Schemat & Linijka`), umożliwiający podgląd wzoru z jednoczesnym naliczaniem rzędów.
  * **DEC-01, BR-PROJ-004 & Kalkulator Próbki Ściegu (Gauge Swatch) i Szablony Projektów**:
    - Silnik obliczeniowy `src/core/gauge-calculator.ts` wyliczający wymaganą liczbę oczek do nabrania (cast-on) i docelowych rzędów na podstawie wymiarów próbki i gotowego wyrobu (w cm lub calach).
    - Analiza różnic naprężenia dzianiny (Tension check) między próbką ze wzoru a próbką wykonawcy z rekomendacjami doboru grubości drutów/szydełka oraz przelicznikiem oczek bez konieczności prucia próbki.
    - Baza gotowych szablonów projektowych (`BUILT_IN_PROJECT_TEMPLATES`) dla czapek beanie, szali, kocyków niemowlęcych, swetrów i skarpetek z rekomendowaną grubością przędzy i standardową próbką.
    - Interfejs `src/components/GaugeCalculatorModal.tsx` zintegrowany z ekranem `app/(tabs)/projects.tsx` (przycisk `📐 Próbka`) z możliwością natychmiastowego utworzenia robótki w SQLite z wyliczoną liczbą rzędów.
  * **DEC-01 & Karty Podsumowania i Udostępniania Robótki (Project Summary & Share Card)**:
    - Moduł agregacji metryk projektu `src/core/project-summary.ts` wyliczający sumaryczne przerobione rzędy, procent ukończenia, rozbicie na części i ramy czasowe z dziennika zdarzeń.
    - Generator sformatowanego opisu społecznościowego (`generateShareableText`) na Ravelry, Instagram czy grupy rękodzielnicze z automatycznym dopasowaniem włóczki, drutów i hashtagów.
    - Wizualna karta rzemieślnicza w ciepłej palecie craftowej `src/components/ProjectShareCardModal.tsx` z podglądem postępu, natywnym udostępnianiem przez Share Sheet oraz możliwością przełączania statusu projektu: w trakcie (`WIP`) vs ukończony (`FO - Finished Object`).
    - Integracja z listą projektów `app/(tabs)/projects.tsx` poprzez przycisk `📊 Karta` przy każdym projekcie.
  * **DEC-01, BR-MAG-004 & Kalkulator Zużycia Włóczki i Estymator Wagi Wyrobu (Yarn Usage Estimator)**:
    - Silnik obliczeniowy `src/core/yarn-usage-estimator.ts` oferujący dwa niezależne tryby kalkulacji:
      1. W trakcie robótki: wyliczanie tempa zużycia przędzy (g/rząd), całkowitej wagi wyrobu, pozostałych do przerobienia gramów/metrów oraz liczby motków na podstawie zważonej części robótki.
      2. Przed startem: estymacja wagi i motków na podstawie wymiarów i wagi próbki ściegu (swatch) oraz docelowej powierzchni elementów dzianiny.
    - Algorytm detekcji ryzyka „Yarn Chicken” (gra w cykora z włóczką) z trzystopniową kategoryzacją (`safe` / `warning` < 5% rezerwy / `danger` deficyt) oraz kontekstowymi radami ratunkowymi (dokupienie motka z tego samego lotu farbowania, modyfikacja ściągacza).
    - Obsługa konfigurowalnego marginesu bezpieczeństwa (0%, +5%, +10%, +15%, +20%) na końcówki, próbki i zmienność naprężenia nitki oraz wskaźnika grist (m/g, m/100g).
    - Interaktywny komponent `src/components/YarnUsageEstimatorModal.tsx` zintegrowany zarówno z Magazynem (`app/(tabs)/stash.tsx` - przycisk `⚖️ Zużycie`), jak i listą projektów (`app/(tabs)/projects.tsx` - w pasku akcji oraz na kartach robótek z automatycznym zaczytaniem liczby rzędów).
  * **DEC-01, BR-LICZ-003, BR-SYS-011 & Haptyka Dotykowa i Powiadomienia Interwałowe (Tactile Haptics & Interval Reminders)**:
    - Moduł `src/core/feedback-service.ts` obsługujący natywny silnik haptyczny (`expo-haptics`) ze zróżnicowanymi profilami wibracji: lekki impuls (`step`) przy manualnym naliczeniu rzędu, wyczuwalny impuls średni (`undo`) przy cofaniu, mocny impuls (`cycle`) przy pełnym obrocie cyklu modulo warkocza/ażuru oraz uroczyste powiadomienie sukcesu (`goal`) po ukończeniu robótki.
    - Elastyczny mechanizm powiadomień interwałowych (`checkIntervalReminder`) z wykrywaniem progów co $N$ rzędów (np. co 4, 6, 8, 10 rzędów) lub wyznaczonych rzędów specjalnych wraz z konfigurowalnymi etykietami czynności (np. „Zmiana koloru nitki”, „Splot warkocza C6F”).
    - Interfejs `MainCounterScreen`: dedykowany chip szybkiej konfiguracji interwału nad kartą licznika, dynamiczny baner powiadomienia na karcie licznika oraz modal wyboru predefiniowanych interwałów.
    - Interfejs `app/(tabs)/settings.tsx`: przełącznik wibracji haptycznych, interaktywny panel testowania każdego profilu wibracji w czasie rzeczywistym oraz wybór domyślnego interwału przypomnień.
  * **DEC-01, BR-WZOR-001, DEC-09, NFR-DOST-009 & Import Własnych Wzorów PDF z Pływającą Linijką Postępu (Pattern PDF Viewer)**:
    - Nowa tabela `pattern_documents` w schemacie bazy danych SQLite z indeksem projektu (`src/core/database-schema.ts`, `src/core/database.ts`) przechowująca metadane dokumentu (URI, nazwa, rozmiar, strona, pozycja linijki `ruler_y_percent`, wysokość i flaga auto-kroku).
    - Serwis domenowy `src/core/pattern-document-service.ts` realizujący walidację formatów (PDF, PNG, JPG), obliczanie przesunięcia linijki z detekcją przejścia na kolejną stronę (`calculateNextRulerPosition`), automatyczną synchronizację z licznikiem rzędów (`stepPatternDocumentWithCounter`) oraz operacje CRUD w bazie SQLite.
    - Dedykowany komponent czytnika `src/components/PatternPdfViewer.tsx` ze stanem pustym, integracją z selektorem plików `expo-document-picker`, nawigacją stronicową (`◀`, `▶`), manualnym pozycjonowaniem linijki (`▲ Wyżej`, `▼ Niżej`, `↺ Na górę`), przełącznikiem `Auto-krok` oraz trybem podwyższonego kontrastu o wysokiej dostępności (`NFR-DOST-009`).
  * **DEC-01, BR-MAG-002, BR-MAG-003 & Zaawansowane Filtry i Klasyfikacja w Magazynie Włóczek (Stash Filter & Classification)**:
    - Serwis domenowy `src/core/stash-filter-service.ts`:
      - Standaryzacja grubości przędzy wg Craft Yarn Council (`YARN_WEIGHT_STANDARDS`, CYC 0-6: Lace, Fingering, Sport, DK, Worsted, Aran, Bulky, Super Bulky) z rekomendowanymi rozmiarami drutów (mm) oraz orientacyjną próbką ściegu.
      - Baza tagów surowcowych (`FIBER_FILTER_TAGS`) i detektor składu (`detectFiberTags`) automatycznie klasyfikujący włóczki (Wełna/Merino, Alpaka, Bawełna, Jedwab, Mohair, Len, Syntetyki).
      - Silnik filtrowania `filterStashYarns` z natychmiastowym przeszukiwaniem po nazwie, producencie, odcieniu, notatkach oraz **numerze partii farbowania (Dye Lot)**.
      - Agregator statystyk magazynu `calculateStashMetrics` wyliczający sumaryczną liczbę pozycji, dostępnych motków, gramaturę i metraż dla dowolnej kombinacji aktywnych filtrów.
    - Interfejs `app/(tabs)/stash.tsx`:
      - Pasek wyszukiwania z lupą i przyciskiem natychmiastowego czyszczenia (✕).
      - Poziome paski wyboru filtrów grubości CYC, tagów surowcowych oraz przełącznik `Tylko na stanie`.
      - Dynamiczny pasek podsumowania zasobów (np. `Znaleziono: 2 poz. • 6 motków • 300 g • 1020 m`).
      - Rozszerzony modal dodawania włóczek o dedykowane pola partii farbowania (`Dye Lot`), wagi (g), długości (m) oraz chipsy wyboru standardu CYC.
  * **DEC-01, DEC-03, BR-SYS-003, BR-ZEG-003, BR-ZEG-009 & Apple Watch Companion, Cyfrowa Koronka i Smart Stack / Live Activities**:
    - Serwis domenowy `src/core/apple-watch-service.ts`:
      - `createWatchCounterSnapshot`: tworzenie kompaktowego zrzutu stanu licznika (`WatchCounterSnapshot`) dla watchOS 11 / WCSession.
      - `handleWatchInteraction`: rejestracja i obsługa zdarzeń ze smartwatcha (`INCREMENT`, `UNDO`) z oznaczeniem źródła `source: 'apple_watch'`.
      - `processDigitalCrownDelta`: obsługa fizycznej cyfrowej koronki (Digital Crown, BR-ZEG-003) z akumulatorem obrotu i progiem czułości.
      - `WatchOfflineQueue`: buforowanie operacji zegarka w trybie offline przy braku łączności BLE z iPhonem i ich automatyczny zrzut po powrocie do zasięgu.
      - `generateLiveActivityAttributes`: generowanie struktury dla ActivityKit (Live Activities na ekranie blokady oraz Dynamic Island na iOS 18 i Smart Stack na watchOS 11, BR-ZEG-009).
    - Komponent `src/components/AppleWatchCompanionModal.tsx`:
      - Pełny interaktywny symulator zegarka Apple Watch (OLED 45 mm) z dużym dotykowym przyciskiem `+1 Rząd` (idealny do szybkiego stuknięcia podczas dziergania bez odkładania drutów), przyciskiem cofania `-1`, kontrolkami cyfrowej koronki oraz podglądem widżetu Smart Stack.
    - Integracja z interfejsem użytkownika:
      - Ekran główny `src/screens/MainCounterScreen.tsx`: dedykowany chip `⌚ Apple Watch` obok powiadomień cyklicznych z dwukierunkową synchronizacją stanu w czasie rzeczywistym.
      - Ekran `app/(tabs)/settings.tsx`: status połączenia WCSession oraz przycisk testowania zegarka.
  * **DEC-01 & Uszczelnienie Jakości / Hardening Pokrycia Testowego (15.10.2026)**:
    - Opracowanie dedykowanego zestawu testów cyklu życia kontekstu stanu `src/core/__tests__/project-context.test.tsx` (inicjalizacja in-memory SQLite, tworzenie robótki, przełączanie części i liczników, inkrementacja, UNDO).
    - Rozbudowa testów interakcji dla wszystkich 5 ekranów nawigacyjnych (`ProjectsScreen.test.tsx`, `StashScreen.test.tsx`, `SettingsScreen.test.tsx`, `LearnScreen.test.tsx`, `MainCounterScreen.test.tsx`, `PatternPdfViewer.test.tsx`).
    - Pokrycie formularzy dodawania robótek, dodawania części robótki, zmiany statusu WIP/FO, kalkulatorów próbki i zużycia włóczki, filtrów CYC i Dye Lot, testowania haptyki, kopii zapasowej JSON i trenażera wzorców.
  * **DEC-01 & Kamień Milowy: Osiągnięcie 100% Pokrycia Linii Kodu w Całym Repozytorium (15.10.2026)**:
    - Realizacja dyspozycji właściciela: pełny pakiet automatycznych testów jednostkowych, integracyjnych i komponentowych dla każdego modułu, hooka, widoku, modala i przycisku w aplikacji.
    - **Wyniki pokrycia kodu (raport końcowy Jest/Coverage):**
      * **Pokrycie linii (Lines): 100.00%** we wszystkich plikach w projekcie (`All files: 100%`!).
      * **Pokrycie funkcji (Funcs): 99.23%** (w tym 100% we wszystkich komponentach UI i ekranach).
      * **Pokrycie instrukcji (Stmts): 98.40%**.
      * **Pokrycie rozgałęzień (Branch): 88.66%**.
      * **Warstwa domenowa i serwisowa (`src/core/`): 100% linii** w każdym z 22 modułów (`apple-watch-service.ts`, `backup-service.ts`, `counter-engine.ts`, `database.ts`, `database-schema.ts`, `device-sync.ts`, `domain-rules.ts`, `feedback-service.ts`, `gauge-calculator.ts`, `glossary-data.ts`, `pattern-document-service.ts`, `pattern-guide-data.ts`, `pattern-parser.ts`, `pattern-trainer.ts`, `project-context.tsx`, `project-facade.ts`, `project-repository.ts`, `project-service.ts`, `project-summary.ts`, `stash-filter-service.ts`, `stash-repository.ts`, `yarn-usage-estimator.ts`).
      * **Warstwa komponentów UI (`src/components/`): 100% linii** we wszystkich modalach i przeglądarkach (`AppleWatchCompanionModal.tsx`, `GaugeCalculatorModal.tsx`, `PatternGuideViewer.tsx`, `PatternPdfViewer.tsx`, `ProjectShareCardModal.tsx`, `YarnUsageEstimatorModal.tsx`).
      * **Warstwa zakładek nawigacji (`app/(tabs)/`): 100% linii** (`learn.tsx`, `projects.tsx`, `settings.tsx`, `stash.tsx`, `index.tsx`).
      * **Główny ekran licznika (`src/screens/MainCounterScreen.tsx`): 100% linii**.
    - **Stan testów bazowych:** 34 zestawy testowe, 224 testy jednostkowe, integracyjne i E2E zakończone sukcesem (100% pass, 0 fail).
    - **Czystość typowania:** 0 błędów w weryfikacji TypeScript (`npx tsc --noEmit`).
  * **DEC-01 & Wdrożenie Wieloperspektywicznej Matrycy Testów (Standard `organizer` — 15.10.2026)**:
    - Realizacja polecenia właściciela: zaimplementowanie w `Oczko` identycznego, wielowymiarowego podejścia do testowania jak w referencyjnym repozytorium [`lkarwowski494/organizer`](https://github.com/lkarwowski494/organizer).
    - **7 Warstw Rygoru Jakościowego (Multi-Perspective Testing Matrix):**
      1. **Property-Based Testing (PBT / `fast-check`):**
         - Plik: `src/core/__tests__/property-based.test.ts` (11 testów).
         - Testowanie niezmienników matematycznych na tysiącach losowych danych wejściowych:
           * Odwracalność dziennika zdarzeń (Event-Sourcing Invertibility: $V + \Delta - \Delta = V$).
           * Monotoniczność debouncera kliknięć w czasie rzeczywistym.
           * Symetria i bezstratność konwersji jednostek metrycznych i imperialnych ($cm \to cal \to cm$).
           * Liniowa proporcjonalność kalkulatora próbki ściegu i zachowanie współczynników naprężenia.
           * Liniowe skalowanie metrażu i wagi wskaźnika Yarn Grist.
           * Niezmienniki podzbiorów i filtry inkluzywne magazynu włóczek.
      2. **Differential Testing / Niezależny Korpus Referencyjny (Cross-Validation Python ↔ TypeScript):**
         - Skrypt generatora: `scripts/gen-gauge-corpus.py` (Python 3.14).
         - Korpus referencyjny: `src/core/__tests__/fixtures/gauge-corpus.json`.
         - Zestaw testowy: `src/core/__tests__/gauge-corpus.test.ts` (4 testy).
         - Walidacja krzyżowa algorytmów dziewiarskich Oczko z niezależną implementacją matematyczną w Pythonie (próbki ściegu, wskaźniki Yarn Grist, kalkulacja kontrastów WCAG 2.2 AAA dla palety craftowej).
      3. **Kontrakty Dostępności i Apple HIG (Accessibility & Touch Targets):**
         - Plik: `src/components/__tests__/a11y-contracts.test.tsx` (5 testów).
         - Weryfikacja kryteriów Apple Human Interface Guidelines:
           * Minimalny obszar dotykowy $\ge 44 \times 44\,\text{pt}$ dla wszystkich interaktywnych kontrolek (przycisk licznika głównego, kontrolki zegarka, linijka PDF).
           * Semantyczne etykiety i role VoiceOver (`accessibilityRole`, `accessibilityLabel`).
           * Odporność modali i bezpieczne zamykanie interfejsu (`onRequestClose`).
      4. **Strażnicy Architektury i Bezpieczeństwa (Interaction & Architecture Guards):**
         - Plik: `src/core/__tests__/interaction-guards.test.ts` (3 testy).
         - Automatyczna analiza statyczna kodu:
           * Ochrona przed SQL Injection — weryfikacja, że 100% zapytań modyfikujących (INSERT, UPDATE, DELETE) w repozytoriach stosuje sparametryzowane symbole zastępcze (`?`).
           * Czystość architektury heksagonalnej — rdzeń domenowy (`counter-engine`, `gauge-calculator`, `domain-rules`, `yarn-usage-estimator`) nie importuje zależności UI (`react-native`).
           * Bezpieczeństwo i spójność modali.
      5. **Budżety Wydajnościowe i Efektywność CPU (Performance Budget Testing):**
         - Plik: `src/core/__tests__/perf-budget.test.ts` (6 testów).
         - Ograniczenia czasu procesora z mikrosekundową precyzją:
           * Replay 5 000 zdarzeń licznika (Event Sourcing): $< 60\,\text{ms}$ (rzeczywisty czas: $4\,\text{ms}$).
           * Złożone filtrowanie i agregacja metryk 2 500 włóczek: $< 40\,\text{ms}$ (rzeczywisty czas: $2\,\text{ms}$).
           * 10 000 kalkulacji próbki i wskaźnika Yarn Grist: $< 100\,\text{ms}$ (rzeczywisty czas: $9\,\text{ms}$).
           * Analiza leksykalna i parsowanie 500 wierszy wzoru: $< 40\,\text{ms}$ (rzeczywisty czas: $1\,\text{ms}$).
           * 10 000 obrotów cyfrowej koronki (Digital Crown): $< 25\,\text{ms}$ (rzeczywisty czas: $2\,\text{ms}$).
      6. **Odporność i Wstrzykiwanie Błędów (Resilience & Fault Injection):**
         - Plik: `src/core/__tests__/resilience.test.ts` (10 testów).
         - Wycofywanie przerwanych transakcji (Rollback on Error) w bazie danych bez częściowych zapisów (Zero Partial Writes).
         - Odrzucanie uszkodzonych, zniekształconych i obcych plików kopii zapasowej JSON.
         - Obsługa wartości brzegowych, zerowych, ujemnych i skrajnych w kalkulatorach próbki i włóczki.
         - Idempotencja operacji UNDO i odporność na anomalie zegara systemowego (Clock Skew).
      7. **Symulacja Współbieżności i Wyścigów (Concurrency & Race Conditions):**
         - Plik: `src/core/__tests__/concurrency.test.ts` (5 testów).
         - Determinizm rozstrzygania remisów submilisekundowych (Sub-millisecond tie breaking) przy jednoczesnych zdarzeniach z Apple Watch i iPhone'a.
         - Buforowanie i uzgadnianie kolejki zdarzeń offline zegarka (`WatchOfflineQueue`).
         - Detekcja duplikatów międzyurządzeniowych (Inter-device duplicate detection).
         - Bezkonfliktowa synchronizacja dwukierunkowa paczek zdarzeń (`processIncomingSync`).
         - Równoległe asynchroniczne zapisy do bazy SQLite (Concurrent repository writes).
    - **Podsumowanie Wyników Pokrycia i Jakości:**
      * **Test Suites: 44/44 zdanych (100% pass)**.
      * **Tests: 318/318 zdanych (100% pass)**.
      * **Pokrycie linii (Lines Coverage): 100.00%** w całym projekcie!
      * **Czystość typowania:** 0 błędów w weryfikacji TypeScript (`npx tsc --noEmit`).
      * **Dedykowane skrypty NPM:** `npm run test:pbt`, `npm run test:perf`, `npm run test:a11y`, `npm run test:resilience`, `npm run test:concurrency`, `npm run test:corpus`, `npm run check:corpus`, `npm run test:coverage`.

* **DEC-16 Implementacja: Wizualny Klucz Identyfikacji Ściegu „Co widzisz?” (15.10.2026):**
  - **Architektura:** W pełni deterministyczny silnik domenowy (`src/core/stitch-identifier.ts`), bez użycia AI (inwariant ZP-05). Drzewo decyzyjne oparte na 3 cechach obserwowanych dzianiny:
    1. *Struktura powierzchni* (`surface_texture`): kolumienki V, fale/grzbiety, żeberka pionowe, ziarna ryżu, warkocze, ażur/dziurki, pętelki szydełkowe.
    2. *Rewers / Odwracalność* (`reversibility`): grzbiety lewe, identyczny rewers, negatyw żeberka, gładkie tło pod warkoczem, identyczna ziarnistość.
    3. *Krawędź i elastyczność* (`edge_and_stretch`): rolowanie krawędzi, stabilna płaska krawędź, sprężysta harmonijka, zwarta nieelastyczna, przewiewna firanka.
  - **Obsługiwane profile ściegów (8 profili):**
    - Ścieg dżersejowy / pończoszniczy (`stockinette`),
    - Ścieg dżersejowy lewy (`reverse_stockinette`),
    - Ścieg francuski (`garter`),
    - Ściągacz 1x1 / 2x2 (`ribbing`),
    - Ścieg ryżowy / perłowy (`seed_stitch`),
    - Warkocz klasyczny (`cable_c6f`),
    - Ażur z narzutami (`lace_eyelet`),
    - Splot szydełkowy bazowy (`crochet_basic`).
  - **Interfejs użytkownika:** Nowa zakładka w module Nauka (`app/(tabs)/learn.tsx`) — `🔍 Co widzisz?`.
    - Płynny kreator krok po kroku z nawigacją wstecz i resetem.
    - Karta wynikowa z poziomem dopasowania (`confidence`), cechami diagnostycznymi, poradą technologiczną oraz szybkimi akcjami (przejście do słownika i trenażera wzorców).
  - **Zgodność z ZAS-QA-01 (Wielowymiarowa Matryca Jakości):**
    - **100.00% Line Coverage** w całym repozytorium (w tym `stitch-identifier.ts` 100% stmts/branch/funcs/lines).
    - **Test Suites: 42/42 zdanych, 286/286 testów zdanych**.
    - Zaktualizowane testy PBT (`property-based.test.ts`), Dostępności & HIG (`a11y-contracts.test.tsx`), Strażników architektury (`interaction-guards.test.ts`), Budżetów wydajnościowych (`perf-budget.test.ts` — 10 000 rozpoznań w < 20 ms) oraz Odporności (`resilience.test.ts`).

* **Implementacja: Kalkulator Kształtowania i Równomiernego Dodawania/Odejmowania Oczek (15.10.2026):**
  - **Architektura:** Czysty deterministyczny moduł domenowy (`src/core/shaping-calculator.ts`) implementujący euklidesowy algorytm symetrycznego i równomiernego rozmieszczania modyfikacji oczek bez widocznych skupisk.
  - **Trzy tryby pracy:**
    1. *Równomierne dodawanie w rzędzie (Increase Evenly):* obsługa metod M1L, M1R, kfb, yo z wyliczaniem grup regularnych i powiększonych, uwzględnieniem specyfiki zużywania oczka przez kfb oraz ochroną brzegów (edgeStitches).
    2. *Równomierne odejmowanie w rzędzie (Decrease Evenly):* obsługa metod k2tog, ssk, p2tog z uwzględnieniem zużycia po 2 o. na akcję i generowaniem symetrycznej rozpiski.
    3. *Kształtowanie wielorzędowe (Multi-Row Shaping):* wyliczanie częstotliwości rzędów dla rękawów, raglanów i dekoltów (`both_edges` vs `single_edge`) z optymalizacją pod rzędy prawe (RS only).
  - **Interfejs użytkownika:** Interaktywny modal `src/components/ShapingCalculatorModal.tsx` zintegrowany z ekranem projektów (`app/(tabs)/projects.tsx` - przycisk ✂️ Oczka) z natywnym udostępnianiem przez Share Sheet.
  - **Zgodność z ZAS-QA-01:** 100.00% Line Coverage w całym repozytorium (44/44 suites, 318/318 passed, PBT z `fast-check`, A11y & Apple HIG >= 44pt, strażnicy czystości domeny, budżet < 100ms na 10 000 kalkulacji, resilience na ujemne/skrajne dane).


* **DEC-02 Implementacja: Protokół Garmin ConnectIQ Companion & Symulator Zegarka (15.10.2026):**
  - **Architektura Protokołu BLE (`src/core/garmin-service.ts`):**
    - Pełna obsługa ConnectIQ Mobile SDK JSON bridge z dedykowanym identyfikatorem `GARMIN_COMM_UUID` (`c48e89f2-7e04-4b53-9f89-8d76b1f20001`).
    - Deterministyczna serializacja i walidacja kopert wiadomości (`GarminMessageEnvelope`: `HANDSHAKE`, `SYNC_STATE`, `WATCH_EVENT`, `ACK`, `NACK`).
    - Mapowanie fizycznych przycisków i gestów zegarka Garmin (`KEY_START_STOP` / `TOUCH_TAP` -> +1, `KEY_LAP` -> UNDO, `KEY_DOWN` -> następna część, `KEY_UP` -> poprzednia część).
    - Mechanizm buforowania zdarzeń offline `GarminOfflineQueue` ze sztywnym limitem pojemności (capacity enforcement) i bezkonfliktowym opróżnianiem po wznowieniu połączenia BLE.
  - **Interfejs Użytkownika (`src/components/GarminCompanionModal.tsx`):**
    - Realistyczny symulator okrągłego zegarka Garmin (47 mm) z obsługą AMOLED / MIP, fizycznymi przyciskami na bezelu (`START-STOP`, `BACK-LAP`, `UP-MENU`, `DOWN`) oraz dotykowym ekranem centralnym.
    - Przełącznik trybu Offline (`🔌 Rozłącz BLE / Połącz`) umożliwiający manualne testowanie buforowania zdarzeń i ich synchronizacji wsadowej.
    - Zintegrowany z głównym licznikiem (`src/screens/MainCounterScreen.tsx` — chip `🛰️ Garmin`) oraz ekranem ustawień (`app/(tabs)/settings.tsx` — sekcja Garmin Connect IQ).

* **Implementacja: Miarka Rozmiarów Drutów i Przelicznik Jednostek Rzemieślniczych (15.10.2026):**
  - **Architektura Domenowa (`src/core/needle-gauge-converter.ts`):**
    - Tabela standardów 22 rozmiarów CYC/ISO (od 2.0 mm do 25.0 mm) z dokładnym mapowaniem pomiędzy systemem metrycznym (mm), US (druty i szydełka), UK oraz japońskim (JP).
    - Algorytm najbliższego dopasowania metrycznego `findClosestMetricNeedle` i dwukierunkowej konwersji `convertNeedleSize`.
    - Deterministyczne przeliczniki jednostek: długość (metry ↔ jardy), waga (gramy ↔ uncje) oraz gęstość próbki ściegu (oczka na 10 cm ↔ oczka na 4 cale).
  - **Interfejs Użytkownika (`src/components/NeedleGaugeModal.tsx`):**
    - Dwuzakładkowy modal:
      1. *Tabela i Suwmiarka:* Interaktywna miarka drutów z natychmiastowym podglądem odpowiedników we wszystkich standardach oraz pełna tabela referencyjna.
      2. *Przelicznik Jednostek:* Pola kalkulacji w czasie rzeczywistym dla metrażu motków, gramatury i próbki ściegu.
    - Zintegrowany z zakładką Narzędzia w Magazynie (`app/(tabs)/stash.tsx` — przycisk `📏 Miarka drutów`).

* **Stan Jakości i Pokrycia (ZAS-QA-01):**
  - **Test Suites: 48/48 zdanych (100% pass)**.
  - **Tests: 367/367 zdanych (100% pass)**.
  - **Line Coverage: 100.00% w całym projekcie** (`npm run test:coverage`).
  - **TypeScript:** 0 błędów (`npx tsc --noEmit`).
  - **Multi-Perspective Testing:** Rozbudowane PBT (`fast-check`), Apple HIG & A11y ($\ge 44\,\text{pt}$), Architecture Guards (czystość domeny bez RN), Budżety wydajnościowe CPU oraz Resilience (odporność na zniekształcony JSON i wartości brzegowe).
* **DEC-Parity Aktualizacja Dokumentacji do Standardu `organizer` (16.10.2026):**
  - Zaktualizowano `README.md` do najwyższego rygoru jakościowego wzorowanego na `organizer`:
    - Odznaki: 367 zdanych testów w 48 pakietach, 100.00% pokrycia linii (`npm run test:coverage`), `Garmin Connect IQ Ready`.
    - Kompletny wykaz 13 modułów i ekranów aplikacji wraz z najnowszymi kalkulatorami i protokołami ubieralnymi.
    - Architektura przepływu danych i zdarzeń (diagram Mermaid) z uwzględnieniem mostka BLE Garmin oraz Apple Watch.
    - Pełny opis 9 warstw rygoru jakościowego (DoD) wraz z konkretnymi metrykami czasu CPU i niezmienników.
    - Wyczerpujące drzewo plików (`Architektura Kodu`) obejmujące 100% plików źródłowych, testowych i pomocniczych.

* **DEC-17 Implementacja: Kalkulator Zamienników Włóczki, Łączenia Nitek i Identyfikator WPI (16.10.2026):**
  - **Architektura Domenowa (`src/core/yarn-substitution-service.ts`):**
    - Precyzyjna kalkulacja liczby motków zamiennika z marginesem bezpieczeństwa (0–20%), wyliczeniem łącznego metrażu, szacunkowej wagi dzianiny, różnicy wagi oraz detekcją ryzykownego marginesu (Tight Margin).
    - Matryca łączenia nitek (*multi-strand combination*): deterministyczne przeliczanie wypadkowej grubości CYC (np. Fingering + Mohair = DK/Worsted, 2x Lace = Fingering, 2x DK = Chunky) z zalecanym zakresem drutów (mm).
    - Identyfikator WPI (*Wraps Per Inch*): przyporządkowanie liczby owinięć na cal do standardu CYC 0–7 (Lace do Jumbo) z zakresem próbki ściegu i rekomendowanymi drutami.
  - **Interfejs Użytkownika (`src/components/YarnSubstitutionModal.tsx`):**
    - 3-zakładkowy modal rzemieślniczy: `Zamiennik`, `Łączenie nitek`, `WPI`.
    - Zgodność z Apple HIG ($\ge 44\,\text{pt}$ touch targets, VoiceOver a11y roles/labels), natywne udostępnianie raportu przez Share Sheet.
    - Zintegrowany z nagłówkiem magazynu (`app/(tabs)/stash.tsx` — przycisk `🔄 Zamiennik`).
  - **Zgodność z ZAS-QA-01 (Wielowymiarowa Matryca Jakości):**
    - **Test Suites: 50/50 zdanych (100% pass)**.
    - **Tests: 391/391 zdanych (100% pass)**.
    - **Line Coverage: 100.00% w całym repozytorium** (`npm run test:coverage`).
    - **TypeScript:** 0 błędów (`npx tsc --noEmit`).
    - Zaktualizowano testy PBT (`property-based.test.ts`), A11y contracts (`a11y-contracts.test.tsx`), Architecture guards (`interaction-guards.test.ts`), Budżety wydajnościowe CPU (`perf-budget.test.ts` — 10 000 kalkulacji w < 150 ms) oraz Resilience (`resilience.test.ts`).

* **DEC-18 Implementacja: Kalkulator Luzu Odzieżowego, Doboru Rozmiaru i Adaptacji Oczek (16.10.2026):**
  - **Architektura Domenowa (`src/core/ease-calculator-service.ts`):**
    - 8 presetów stylu i luzu odzieżowego (od głębokiego ujemnego -10 cm do oversize i boxy +28 cm).
    - Tabela standardowych sylwetek dorosłych CYC/ISO (od XS do 5XL) i automatyczne dopasowywanie rozmiaru na podstawie obwodu biustu/klatki piersiowej.
    - Algorytm doboru rozmiaru wzoru `recommendPatternSize` minimalizujący różnicę między rzeczywistym a pożądanym luzem gotowego wyrobu.
    - Deterministyczny adapter gęstości próbki `adaptStitchesWithRecommendation` z zachowaniem raportu wzoru, ochroną oczek brzegowych i wyborem najbliższego kandydata wymiarowego (lower vs upper candidate).
  - **Interfejs Użytkownika (`src/components/EaseCalculatorModal.tsx`):**
    - 2-zakładkowy modal: `Rozmiar & Luz` oraz `Przelicznik Oczek`.
    - Karty rekomendacji ze szczegółową klasyfikacją kroju, wskaźnikiem procentowym, stepperem +/- 1 cm i porównaniem wariantów.
    - Spełnia Apple HIG ($\ge 44 \times 44\,\text{pt}$, VoiceOver labels, Share Sheet export).
    - Zintegrowany z ekranem robótek (`app/(tabs)/projects.tsx` — przycisk `👕 Luz`).
  - **Zgodność z ZAS-QA-01 (Wielowymiarowa Matryca Jakości):**
    - **Test Suites: 52/52 zdanych (100% pass)**.
    - **Tests: 420/420 zdanych (100% pass)**.
    - **Line Coverage: 100.00% w całym repozytorium** (`npm run test:coverage`).
    - **TypeScript:** 0 błędów (`npx tsc --noEmit`).
    - Zaktualizowano testy PBT (`property-based.test.ts`), A11y contracts (`a11y-contracts.test.tsx`), Architecture guards (`interaction-guards.test.ts`), Budżety wydajnościowe CPU (`perf-budget.test.ts` — 10 000 kalkulacji w < 250 ms) oraz Resilience (`resilience.test.ts`).

* **DEC-19 Implementacja: Kalkulator Konstrukcji Karczku Raglanowego i Rzędów Skróconych Dekoltu (16.10.2026):**
  - **Architektura Domenowa (`src/core/raglan-calculator.ts`):**
    - Matematyka bezszwowego reglanu od góry (Top-Down Seamless Raglan) z podziałem oczek dekoltu na przód, tył, rękawy i 4 linie raglanowe.
    - Automatyczna kompensacja rzędów skróconych (*German Short Rows compensation*): tył pomniejszany o sumę punktów zwrotnych, przód powiększany o sumę punktów zwrotnych, gwarantując idealne wyrównanie liczby oczek po uformowaniu podkroju dekoltu.
    - Deterministyczny rozkład punktów nawrotu GSR na rękawach i dekolcie przodu z zachowaniem bezpiecznej szerokości oczek centralnych.
    - Kalkulator przyrostów karczku: podział oczek na korpus i rękawy, tempo raglanu (co 2 rzędy), wyliczenie wymaganej liczby rzędów do podziału na pachy oraz symetryczne oczka podkrojów pach (*underarm cast-on*).
  - **Interfejs Użytkownika (`src/components/RaglanCalculatorModal.tsx`):**
    - 2-zakładkowy modal: `Podział & GSR` oraz `Karczek & Pachy`.
    - Rzemieślniczy schemat podziału oczek z dynamiczną kontrolą zachowania sumy oczek i wskaźnikami punktów zwrotnych.
    - Krok po kroku rozpisana sekwencja rzędów skróconych (Rząd 1 RS, Rząd 2 WS...) z instrukcjami German Short Row (*DS*).
    - Spełnia Apple HIG ($\ge 44 \times 44\,\text{pt}$, VoiceOver accessibility), natywny eksport raportu przez Share Sheet.
    - Zintegrowany z ekranem robótek (`app/(tabs)/projects.tsx` — przycisk `🥋 Raglan`).
  - **Zgodność z ZAS-QA-01 (Wielowymiarowa Matryca Jakości):**
    - **Test Suites: 54/54 zdanych (100% pass)**.
    - **Tests: 442/442 zdanych (100% pass)**.
    - **Line Coverage: 100.00% w całym repozytorium** (`npm run test:coverage`).
    - **TypeScript:** 0 błędów (`npx tsc --noEmit`).
    - Zaktualizowano testy PBT (`property-based.test.ts`), A11y contracts (`a11y-contracts.test.tsx`), Architecture guards (`interaction-guards.test.ts`), Budżety wydajnościowe CPU (`perf-budget.test.ts` — 10 000 kalkulacji w < 250 ms) oraz Resilience (`resilience.test.ts`).

* **DEC-20 Implementacja: Kalkulator Zmniejszania Korony Czapki i Ściągacza (16.10.2026):**
  - **Architektura Domenowa (`src/core/hat-calculator.ts`):**
    - Wzorzec rozmiarów głowy dorosłych i dzieci CYC (`HAT_STANDARD_SIZES`, 35–60 cm).
    - Obliczenie luzu ujemnego (*negative ease*, domyślnie -5 cm, 10–12% elastyczności), zapobiegającego zsuwaniu się czapki.
    - Deterministyczny podział korony na 4, 6 lub 8 klinów (*Crown Decrease Wedges*) ze spójnym zaokrąglaniem liczby nabieranych oczek do wspólnej wielokrotności klinów i raportu ściągacza (np. LCM 12 dla ściągacza 2x2 i 6 klinów).
    - Krok po kroku wyliczanie sekwencji rzędów korony (zmniejszanie co 2. rząd, przejście na co 1. rząd w szczycie) z instrukcjami `*kX, k2tog*` i dokładną liczbą oczek pozostałych do ściągnięcia igłą (*final remaining stitches*).
  - **Interfejs Użytkownika (`src/components/HatCalculatorModal.tsx`):**
    - 2-zakładkowy modal rzemieślniczy: `Wymiary & Ściągacz` oraz `Korona & Rozpiska`.
    - Presety standardowych obwodów głowy, steppery z haptyczną informacją zwrotną, przełącznik ściągacza pojedynczego/wywijanego oraz stylu klasycznego/slouchy.
    - Podgląd geometrii pionowej (ściągacz, korpus, korona, łączna wysokość w cm i rzędach) oraz lista rzędów korony.
    - Spełnia Apple HIG ($\ge 44 \times 44\,\text{pt}$, VoiceOver accessibility), natywny eksport raportu przez Share Sheet.
    - Zintegrowany z nagłówkiem ekranu robótek (`app/(tabs)/projects.tsx` — przycisk `🧢 Czapka`).
  - **Zgodność z ZAS-QA-01 (Wielowymiarowa Matryca Jakości):**
    - **Test Suites: 56/56 zdanych (100% pass)**.
    - **Tests: 460/460 zdanych (100% pass)**.
    - **Line Coverage: 100.00% w całym repozytorium** (`npm run test:coverage`).
    - **TypeScript:** 0 błędów (`npx tsc --noEmit`).
    - Zaktualizowano testy PBT (`property-based.test.ts`), A11y contracts (`a11y-contracts.test.tsx`), Architecture guards (`interaction-guards.test.ts`), Budżety wydajnościowe CPU (`perf-budget.test.ts` — 10 000 kalkulacji w < 250 ms) oraz Resilience (`resilience.test.ts`).

* **DEC-22 Implementacja: Śledzenie Czasu Robótki i Prędkości Dziergania (16.10.2026, BR-CZAS-001..005):**
  - **Architektura Domenowa (`src/core/time-tracking-service.ts`):**
    - Czysta matematyka dziewiarska bez AI (inwariant ZP-05).
    - Metryki prędkości dziergania: pomiar tempa w rzędach na godzinę (`rowsPerHour`), średni czas trwania jednego rzędu w sekundach (`averageSecondsPerRow`).
    - Estymacja pozostałego czasu robótki (ETA) w oparciu o bieżące tempo i liczbę brakujących rzędów do celu (`targetRows`).
    - Wykrywanie bezczynności i ochrona przed zafałszowaniem statystyk (`shouldAutoPauseSession`, automatyczne wstrzymanie po 5 minutach bez kliknięcia w licznik).
    - Formatowanie czasu do czytelnych jednostek ("Xh Ym", "Ym Zs", "Zs").
  - **Persystencja SQLite i Model Danych (`src/core/database-schema.ts`, `src/core/project-repository.ts`):**
    - Nowa tabela `project_time_sessions` (id, project_id, started_at, ended_at, duration_seconds, active_rows_count, created_at) oraz indeks po `project_id`.
    - Metody repozytorium: `saveTimeSession`, `listTimeSessions`, `getTotalProjectDurationSeconds` z pełną parametryzacją SQL (`?`).
  - **Interfejs Użytkownika (`src/components/KnittingTimeTracker.tsx`, `src/screens/MainCounterScreen.tsx`, `src/components/ProjectShareCardModal.tsx`):**
    - Komponent `KnittingTimeTracker` zintegrowany w głównym ekranie licznika (`MainCounterScreen.tsx`).
    - Automatyczne uruchamianie sesji przy pierwszym kliknięciu w licznik robótki lub ręcznie przyciskiem Start / Pauza.
    - Pasek wskaźnika stanu na żywo (aktywna sesja / wstrzymanie z braku aktywności), licznik czasu bieżącej sesji, tempo robótki (`⚡ rz./h`), estymacja ETA (`⏳ Zostało`).
    - Rozwijana karta szczegółów z łącznym skumulowanym czasem projektu oraz średnim czasem na rząd.
    - Wizualizacja skumulowanego czasu robótki na karcie udostępniania projektu (`ProjectShareCardModal.tsx` — `⏱️ Czas robótki: Xh Ym`) oraz w tekście eksportu (`generateShareableText`).
  - **Zgodność z ZAS-QA-01 (Wielowymiarowa Matryca Jakości):**
    - **Test Suites: 58/58 zdanych (100% pass)**.
    - **Tests: 484/484 zdanych (100% pass)**.
    - **Line Coverage: 100.00% w całym repozytorium** (`npm run test:coverage`).
    - **TypeScript:** 0 błędów (`npx tsc --noEmit`).
    - Zaktualizowano testy PBT (`property-based.test.ts`), Architecture guards (`interaction-guards.test.ts`), Budżety wydajnościowe CPU (`perf-budget.test.ts` — 10 000 kalkulacji w < 100 ms) oraz Resilience (`resilience.test.ts`).


* **DEC-23 Implementacja: Doktor Błędów i Ratowanie Dzianiny (16.10.2026, BR-BIB-010..015):**
  - **Architektura Domenowa (`src/core/knitting-doctor.ts`):**
    - Czysto deterministyczny rejestr 6 procedur ratunkowych w kryzysach dziewiarskich i szydełkowych (ZP-05, zero generatywnego AI):
      1. `dropped_stitch` (spuszczone oczko — drabinka, podnoszenie oczka szydełkiem rząd po rzędzie na prawej i lewej stronie).
      2. `twisted_stitch` (przekręcone oczko — nóżka wschodnia vs zachodnia, odkręcanie pętli przed przerobieniem).
      3. `accidental_yarnover` (przypadkowy narzut / niechciana dziurka — bezpieczne spuszczenie nadmiaru w rzędzie powrotnym lub redukcja `k2tog`).
      4. `tink_unknitting` (prucie rzędu na drutach / Tink — cofanie oczko po oczku bez zsuwania dzianiny z drutów).
      5. `lifeline_insertion` (linia ratunkowa / Lifeline — zabezpieczenie ażuru lub warkocza kontrastową nitką bawełnianą przed spuszczaniem rzędów).
      6. `crochet_escaped_loop` (uciekająca pętla w szydełkowaniu — blokowanie pętli markerem i bezpieczny powrót do ostatniego poprawnego słupka).
    - Silnik wyszukiwania objawów `diagnoseEmergency(query, craftType)` z normalizacją tekstu, wyszukiwaniem po słowach kluczowych i filtrowaniem wg techniki (`knitting`, `crochet`, `both`).
    - Spójna struktura procedury: poziom krytyczności (`critical`, `moderate`, `low`), wymagane narzędzia (np. szydełko 2.5 mm, marker, kontrastowa nitka), sekwencja ponumerowanych kroków z poradami rzemieślniczymi oraz wskazówka profilaktyczna (`preventionTip`).
  - **Interfejs Użytkownika (`app/(tabs)/learn.tsx`):**
    - 4. dedykowana zakładka w module Nauki: `🩺 Doktor Błędów`.
    - Pasek wyszukiwania objawów („drabinka”, „dziurka”, „prucie”, „pętla”, „przekręcone”) z natychmiastowym filtrowaniem.
    - Przełącznik filtrów techniki: `Wszystkie`, `Druty`, `Szydełko`.
    - Widok szczegółowy procedury ratunkowej krok po kroku z instrukcjami, poradami rzemieślniczymi i sekcją „Jak zapobiegać w przyszłości”.
    - Spełnia Apple HIG ($\ge 44 \times 44\,\text{pt}$, VoiceOver accessibility, czytelna hierarchia typograficzna).
  - **Zgodność z ZAS-QA-01 (Wielowymiarowa Matryca Jakości):**
    - **Test Suites: 59/59 zdanych (100% pass)**.
    - **Tests: 496/496 zdanych (100% pass)**.
    - **Line Coverage: 100.00% w całym repozytorium** (`npm run test:coverage`).
    - **TypeScript:** 0 błędów (`npx tsc --noEmit`).
    - Zaktualizowano testy PBT (`property-based.test.ts`), Architecture guards (`interaction-guards.test.ts`), Budżety wydajnościowe CPU (`perf-budget.test.ts` — 10 000 diagnoz w < 100 ms) oraz Resilience (`resilience.test.ts`).


* **DEC-26 Standaryzacja Portfolio Apps4Brew: Złoty Standard Architektoniczny (16.10.2026):**
  - **Zadanie O1 [P0] Usunięcie wycieków asynchronicznych w testach:**
    - Wyeliminowano wyciek `setInterval` w `KnittingTimeTracker.tsx` (dodanie `intervalRef`, `isMounted` flagi, gwarantowany `clearInterval` w unmount cleanupie).
    - Zabezpieczono unmountowanie instancji `renderer.create` w `MainCounterScreen.test.tsx` po każdym teście (likwidacja `ReferenceError` w Jest teardown).
  - **Zadanie O2 [P1] Międzynarodowy System i18n (PL/EN):**
    - Wdrożono `src/core/i18n.ts` oraz `src/core/i18n.en.ts` z polskimi kluczami jako źródłem prawdy, hookiem `useLang()` i interpolacją parametrów `{klucz}`.
    - Dodano skrypt CI `scripts/check-i18n.mjs` weryfikujący kompletność i parametry tłumaczeń w całym kodzie, zintegrowany w `package.json` pod `npm run check:i18n` i `npm run verify`.
  - **Zadanie O3 [P1] Bezpieczna Baza SQLite i Rotacyjna Kopia Zapasowa:**
    - Wdrożono standard bezpieczeństwa SEC-09 (`src/core/db-path.ts`): przeniesienie lokalnej bazy z publicznego `Documents/SQLite/` do prywatnego sandboxu aplikacji `/Library/SQLite` (z automatyczną migracją wsteczną).
    - Rozszerzono `backup-service.ts` o formalną kopertę `OczkoBackupEnvelope` (`format: 'oczko-backup'`, v1), automatyczną rotację 10 plików (`autoBackup` w `Documents/Backup/oczko-*.json`) oraz kopię bezpieczeństwa `safetyBackup` przed importem i resetem.
  - **Zadanie O4 [P2] Podwójny System Jednostek (Metric & Imperial):**
    - Wdrożono moduł `src/core/unit-converter.ts`: metry ↔ jardy, gramy ↔ uncje (oz), cm ↔ cale, próbka 10 cm ↔ 4 cale wg wytycznych Craft Yarn Council (CYC) oraz formatowanie z jednostkami.
  - **Zadanie O5 [P2] Wymiana Projektów Offline (Kody QR SVG i Deep Linki):**
    - Opracowano protokół `oczko://project?v=1&d=<base64>` (`src/core/project-share-protocol.ts`) kodujący części robótki, cel rzędów i próbkę.
    - Wdrożono w 100% offline'owy, wektorowy generator kodów QR SVG (`src/components/QrCodeSvg.tsx`) zintegrowany w modalu karty robótki `ProjectShareCardModal.tsx`.
  - **Złoty Standard Architektoniczny #8: Kalkulator Ekonomii i Opłacalności Rzemiosła:**
    - Wdrożono moduł `src/core/cost-calculator.ts` wyliczający koszt zużytych motków, dodatków, robocizny, koszt na 100g dzianiny oraz oszczędność względem butikowej ceny wyrobu gotowego.
  - **Zgodność z ZAS-QA-01 (Wielowymiarowa Matryca Jakości):**
    - **Test Suites: 66/66 zdanych (100% pass)**.
    - **Tests: 542/542 zdanych (100% pass)**.
    - **Line Coverage: 100.00% w `src/core/` i całym repozytorium** (`npm run test:coverage`).
    - **CI Verification Gate: 100% GREEN** (`npm run verify` = typecheck + check:i18n + test:coverage).


* **DEC-27 Model Monetyzacji Impulsowej Cheaper than Espresso i Hook useAppAccess (16.10.2026):**
  - **Architektura Biznesowa i Cennik Impulsowy:**
    - Cennik Apps4Brew Studio Pass: **$0.99 USD / miesiąc** (~4,49 zł), **$4.99 USD / rok** (~22,99 zł, oferta główna -70%), **$14.99 USD Lifetime** (~69,99 zł zakup na zawsze).
    - **Zero podziału na funkcje Free i Pro:** W okresie próbnym (7 dni lub do 3 pełnych projektów) użytkownik ma dostęp do 100% możliwości aplikacji (wszystkie kalkulatory, wzory PDF z linijką, Apple Watch, Garmin, Doktor Błędów).
    - **Historia ZAWSZE Read-Only po trialu (ochrona ocen 4.9★):** Po wygaśnięciu trialu blokowane jest wyłącznie tworzenie nowych projektów/części. Cała dotychczasowa historia, projekty, rzędy, magazyn i notatki pozostają czytelne na zawsze bez wymuszeń i utraty danych.
  - **Silnik Domenowy i Persystencja SQLite (`src/core/app-access-service.ts`, `src/core/database-schema.ts`):**
    - Nowa tabela `app_entitlements` z polami `plan_type`, `status`, `trial_started_at`, `purchased_at`, `expires_at`, `updated_at`.
    - Deterministyczny ewaluator dostępu `evaluateAccess(entitlements, currentProjectsCount, now)`.
    - Metody `initOrGetEntitlements`, `activatePlan`, `restorePurchases`, `resetTrialForTesting`.
  - **Kontekst Stanu i Komponenty UI (`src/core/app-access-context.tsx`, `src/components/ImpulsePaywallModal.tsx`):**
    - Reaktywny hook `useAppAccess()` dostarczający stan uprawnień, cennik, metody `openPaywall()`, `purchasePlan(tier)` oraz `restore()`.
    - Modal paywalla zgodny z Apple HIG ($\ge 44 \times 44$ pt), prezentujący 3 kafelki planów, korzyści, przycisk zakupu oraz opcję przywracania poprzednich zakupów.
  - **Integracja w Ekranach:**
    - `app/(tabs)/projects.tsx`: sprawdzanie `evaluation.canCreateNewProject` przy tworzeniu projektów/części, baner statusu dostępu `accessStatusBar`, blokada formularza z otwarciem Paywalla przy próbie przekroczenia limitu po wygaśnięciu trialu.
    - `app/(tabs)/settings.tsx`: dedykowana sekcja `🌟 Apps4Brew Studio Pass & Subskrypcja` z bieżącym statusem, przyciskiem Paywalla i przywracania zakupów, a także sekcja `Język & System jednostek` (PL/EN, Metric/Imperial).
    - `src/screens/MainCounterScreen.tsx`: wdrożenie trybu **Knit-Proof UI** (pełnoekranowy obszar dotykowy licznika z ochroną Safe-Undo eliminującą przypadkowe kliknięcia podczas trzymania drutów) oraz pełna integracja z `t(...)` i `useLang()`.
  - **Weryfikacja Jakości:**
    - 100% testów zielonych we wszystkich 68 zestawach testowych (`app-access.test.ts`, `ImpulsePaywallModal.test.tsx`, `SettingsScreen.test.tsx`, `MainCounterScreen.test.tsx`, `ProjectsScreen.test.tsx`).
    - 100.00% Line Coverage w `src/core/` i całym repozytorium.

* **DEC-28 Standaryzacja Front-Endu i Audyt Rzemieślniczy Apps4Craft Studio (17.10.2026):**
  - **Faza 1 (The Craft Purge):** Usunięcie gadżetowego modułu kalkulatora oszczędności PLN (`cost-calculator.ts` i testów), rozszerzenie `ToolType` o `'accessory' | 'notion' | 'custom'` oraz redukcja dolnego paska nawigacji do 4 kluczowych zakładek (Licznik, Projekty, Magazyn, Warsztat; Ustawienia przeniesione do nagłówka).
  - **Faza 2 (Bezpieczeństwo UI, Safe Area i Klikalność):** Zabezpieczenie wszystkich modali przed kolizją z iOS Safe Area (`SafeAreaView` / `useSafeAreaInsets`), wymuszenie min. $44 \times 44$ pt oraz `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` dla wszystkich przycisków wyjścia/anulowania, wdrożenie HUD-u „Sacred Numbers” w trybie skupienia (Knit-Proof).
  - **Faza 3 (Onboarding Rytuału):** Jednoekranowy modal wyboru profilu rzemiosła (`OnboardingModal.tsx` – druty, szydełko, pełny warsztat) z persystencją w SQLite (`app_settings`) i możliwością zmiany w Ustawieniach.
  - **Faza 4 (System Designu Apps4Craft Studio):** Ceramiczna estetyka bazaltowa (`#121214`), akcent terakoty (`#D46A43`) i różowego złota (`#D97B66`), wektorowe ikony SVG (`CraftIcons.tsx`, zero emoji w nawigacji), sekcja „Rodzina Apps4Craft Studio” w Ustawieniach (Napar, Piekarz, Słoik, Dym).
  - **Faza 5 (Weryfikacja i Testy):** 70/70 zestawów testów zielonych (576 testów), 0 błędów TypeScript (`tsc --noEmit`), 100% symetria tłumaczeń i18n (248 w kodzie / 316 w słowniku EN).

* **DEC-29 Konfiguracja EAS Build i Dystrybucji TestFlight (17.10.2026):**
  - **Profile Budowania (`eas.json`):** Dodano konfigurację profili `development` (symulator), `preview` (dystrybucja wewnętrzna) oraz `production` (`autoIncrement: true` dla numeru buildu).
  - **Cel Dystrybucyjny (`submit`):** Zdefiniowano cel produkcyjny iOS powiązany z zespołem Apple Developer Team ID `8NQ9GHY8GF` pod automatyczny upload do TestFlight.

* **DEC-30 Integracja Biblioteki Zasad i Ról oraz Audyt Zgodności (17.10.2026):**
  - **Decyzja użytkownika:** Wybór Opcji C — wstrzymanie wdrożenia TestFlight na rzecz wklejenia modułu „Biblioteka zasad i ról” z Dysku, przypisania ról do projektu Oczko oraz wykonania pełnego, rygorystycznego audytu zgodności całej aplikacji z zasadami.

* **DEC-31 Wykonanie Audytu Zgodności, Formalizacja Ról i Modularyzacja UI (17.10.2026):**
  - **Dokumentacja ról (`docs/standardy_i_role.md`):** Utworzono formalny rejestr ról (9 ról: Analityk, Badacz, Programista, Tłumacz, Tester E2E, Audytor, Wydawca, Sekretarz, Koordynator) oraz modułów (Aplikacje 100%, Research, 3 reguły z gier).
  - **Jawny wyjątek EXC-01 (Zasada 7):** Słownik encyklopedyczny technik dziewiarskich (`src/core/technique-library.ts` 42.9 KB) uznany za dopuszczalny wyjątek od limitu $\le 20$ KB ze względu na integralność danych statycznych i 0 cykli zależności.
  - **Modularyzacja ekranu licznika (AUD-01):** Z `MainCounterScreen.tsx` wyodrębniono komponenty `LinkedCounterModal.tsx`, `IntervalConfigModal.tsx`, `KnitProofOverlay.tsx` oraz arkusz `MainCounterScreen.styles.ts`, redukując rozmiar pliku z 40.8 KB do 23.5 KB.
  - **Weryfikacja Jakości:**
    - 0 zależności cyklicznych w 142 plikach (`madge --circular`).
    - 70/70 zestawów testowych zielonych (579/579 zdanych testów).
    - 15/15 testów modali w `ModalSafetyAndHitSlop.test.tsx` (100% zgodności z Apple HIG i Safe Area).
    - 0 błędów TypeScript (`tsc --noEmit`), 0 brakujących kluczy i18n (`check:i18n`).

* **DEC-32 Odrzucenie Expo/EAS i Wybór Natywnego CI TestFlight (17.10.2026):**
  - **Decyzja użytkownika:** Całkowite odrzucenie Expo Cloud / EAS. Wdrożenie i dystrybucja do Apple TestFlight realizowane w 100% natywnym potokiem CI Apps4Brew Studio opartym o GitHub Actions (`.github/workflows/testflight.yml`) oraz bezpośrednie API Apple App Store Connect (`ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`).
  - **Zgodność z zasadą kosztu 0 zł:** Wykorzystanie darmowych runnerów macOS z preinstalowanym Xcode oraz bezpośredniego podpisywania kluczem API Apple bez pośredników. Plik `eas.json` został usunięty.

* **DEC-33 Sukces Wdrożenia do Apple TestFlight: Build 1004 (17.10.2026):**
  - **Pomyślne wdrożenie CI/CD:** Workflow `.github/workflows/testflight.yml` (Run ID: `39014291650`) zakończony 100% sukcesem w czasie 12m 47s na runnerze `macos-26`.
  - **Kompilacja i eksport:** `xcodebuild archive` i `xcodebuild -exportArchive` z natywnym kluczem App Store Connect API (`ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`).
  - **Rezultat:** Paczka aplikacji `.ipa` (wersja `0.1.0`, build `1004`) pomyślnie wyeksportowana i przesłana bezpośrednio do Apple App Store Connect / TestFlight (`** EXPORT SUCCEEDED **`).
  - **Tag wydania:** Utworzono i opublikowano automatyczny tag wydania `v0.1.0-b1004`.
  - **Zgodność ze standardami:** Koszt 0 zł (0 PLN), zerowa zależność od kont czy chmury Expo (zero EAS CLI/build), pełna czystość testów i weryfikacji.

* **DEC-34 Implementacja: Kalkulator Blokowania Próbki i Kompensacji Wymiarów (17.10.2026):**
  - **Wybór:** Realizacja Opcji 1 — dedykowany silnik i modal do analizy zmiany wymiarów dzianiny przed i po praniu/blokowaniu na mokro (*wet blocking compensation*).
  - **Architektura:**
    - Czysty moduł domenowy `src/core/blocking-calculator.ts` bez zależności od React Native (inwariant ZP-05, deterministyczna matematyka dziewiarska).
    - Obliczanie wskaźników procentowych $\Delta W\%, \Delta H\%$, gęstości surowej vs po blokowaniu, kompensacja wymiarów na drutach pod docelowy rozmiar wyrobu oraz porady technologiczne dla włókien (np. Superwash, alpaka, len).
    - Modal rzemieślniczy `src/components/BlockingCalculatorModal.tsx` zgodny z Apple HIG ($\ge 44 \times 44$ pt, ceramiczna paleta Apps4Craft, eksport do Share Sheet).
    - Integracja w zakładce Projekty (`app/(tabs)/projects.tsx` — przycisk `🧼 Blokowanie`).
  - **Standard Jakości (ZAS-QA-01):** 100% pokrycia linii, testy PBT (`fast-check`), budżet wydajnościowy CPU, testy HIG/A11y, symetria słowników i18n (PL/EN).









