# 22. Macierz testów (generowana z AST)

Dokument wygenerowany przez `node scripts/test-matrix.mjs --write` (BR-TEST-028..031).
Każdy element interfejsu, trasa, funkcja domenowa oraz wartości wymiarów muszą posiadać dowód w kodzie testu.
Dowód liczy się tylko z kodu testu: bez komentarzy, tytułów `test`/`describe` i importów; Maestro bez komentarzy YAML.

| Kategoria | Pozycji | Z testem | Wyjątki | Pokrycie |
|---|---|---|---|---|
| EKRAN | 5 | 5 | 0 | **100%** |
| UI | 43 | 43 | 0 | **100%** |
| TEKST | 235 | 235 | 0 | **100%** |
| LOGIKA | 189 | 189 | 0 | **100%** |
| WYMIAR | 52 | 52 | 0 | **100%** |

## EKRAN

| Pozycja | Źródło | Dowód (pierwsze 3 testy) |
|---|---|---|
| / | app/(tabs)/index.tsx | tests/brands.contract.test.ts, tests/interaction-guards.test.ts, tests/maestro-runner.ts +5 |
| /learn | app/(tabs)/learn.tsx | tests/maestro-runner.ts |
| /projects | app/(tabs)/projects.tsx | tests/maestro-runner.ts |
| /settings | app/(tabs)/settings.tsx | tests/maestro-runner.ts |
| /stash | app/(tabs)/stash.tsx | tests/maestro-runner.ts |

## UI

| Pozycja | Źródło | Dowód (pierwsze 3 testy) |
|---|---|---|
| 🔍 Szukaj marki, koloru, lotu (np. 1240)... | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Anuluj | app/(tabs)/projects.tsx | tests/audit-fixes.test.tsx, tests/close-button-guard.test.tsx, tests/i18n-no-polish-in-en.test.tsx +5 |
| Cofnij do poprzedniego pytania | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Cofnij ostatni (Undo) | src/components/KnitProofOverlay.tsx | tests/matrix-coverage.test.tsx |
| Doktor błędów i ratowanie dzianiny | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Klucz rozpoznawania ściegów: Co widzisz? | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| np. 01 Biały | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| np. 100% Wełna Merino | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| np. 1240 | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| np. 4 | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| np. Air / Sunday / Merino | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| np. Drops / Sandnes Garn | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| np. KnitPro Zing na żyłce | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| np. Korpus / Tył | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| np. Mój Kardigan Oversize | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| np. Rękaw lewy | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| np. Warkocz na rękawie | src/components/LinkedCounterModal.tsx | tests/matrix-coverage.test.tsx |
| np. Zmiana splotu / nitki | src/components/IntervalConfigModal.tsx | tests/matrix-coverage.test.tsx |
| Odblokuj pełny dostęp | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Opisz problem (np. drabinka, dziura, pętla, spuszczone)... | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Otwórz kalkulator blokowania próbki | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Otwórz kalkulator konstrukcji raglanu i rzędów skróconych | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Otwórz kalkulator korony czapki i ściągacza | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Otwórz kalkulator kształtowania i dodawania oczek | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Otwórz kalkulator luzu odzieżowego i doboru rozmiaru | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Otwórz kalkulator zamienników włóczek i WPI | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Otwórz kalkulator zużycia włóczki | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Otwórz miarkę drutów i przelicznik jednostek | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Przejdź do ćwiczenia w trenażerze | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Słownik i symbole | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Stuknij, aby dodać rząd | src/components/KnitProofOverlay.tsx | src/core/__tests__/i18n.test.ts |
| Szukaj skrótu lub techniki (np. k2tog, narz, c6f)... | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Trenażer powtórzeń | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Wczytaj plik PDF | src/components/PatternPdfViewer.tsx | tests/matrix-coverage.test.tsx |
| Wróć | src/components/Missing.tsx | tests/audit-fixes.test.tsx, tests/i18n-no-polish-in-en.test.tsx, tests/interaction-guards.test.ts +2 |
| Wróć do listy problemów | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Wyczyść wyszukiwanie | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Wyjdź z trybu Knit-Proof | src/components/KnitProofOverlay.tsx | tests/matrix-coverage.test.tsx |
| Zamknij | app/(tabs)/settings.tsx | tests/maestro-runner.ts, .maestro/03-kalkulator-probki.yaml |
| Zidentyfikuj inny ścieg | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Zobacz definicję w słowniku | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Zresetuj identyfikację | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Zrozumiałam, usterka naprawiona | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |

## TEKST

| Pozycja | Źródło | Dowód (pierwsze 3 testy) |
|---|---|---|
| + Część | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| + Nowy projekt | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| ⚖️ Zużycie | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| ✂️ Oczka | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| ✓ Tylko na stanie | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| 👕 Luz | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| 📊 Karta | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| 📏 Miarka drutów | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| 📐 Próbka | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| 🔄 Zamiennik | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| 🔴 Krytyczny | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| 🔴 Poziom: Krytyczny | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| 🥋 Raglan | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| 🧢 Czapka | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| 🧶 Druty (Knitting) | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| 🧼 Blokowanie | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| 🪡 Szydełko (Crochet) | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| 🟠 Poziom: Umiarkowany | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| 🟠 Umiarkowany | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| 🟡 Niski | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| 🟡 Poziom: Niski | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| 1. Próbka na surowo (na drutach) | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| 100% Offline-First. Twoje projekty i magazyn są przechowywane wyłącznie na tym urządzeniu (SQLite). Wybór możesz zmienić w każdej chwili w Ustawieniach. | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| 2. Ta sama próbka po praniu i wysuszeniu | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| 3. Wymiary docelowe gotowego wyrobu (opcjonalne) | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Abonament Roczny | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Aktywny | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| AKTYWNY | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Aktywny okres próbny | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Angielski | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| APPS4BREW STUDIO PASS & SUBSKRYPCJA | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Apps4Craft Studio • Rzemiosło Dziewiarskie | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| Baza danych nie jest jeszcze zainicjalizowana. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Baza danych niedostępna | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Bieżący | src/components/KnitProofOverlay.tsx | tests/matrix-coverage.test.tsx |
| Błąd | app/(tabs)/settings.tsx | tests/interaction-guards.test.ts, src/core/__tests__/backup-service.test.ts, src/core/__tests__/resilience.test.ts |
| Brak aktywnych projektów | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Brak pasujących włóczek | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Brak wczytanego wzoru | src/components/PatternPdfViewer.tsx | tests/matrix-coverage.test.tsx |
| Cel / Postęp | src/components/KnitProofOverlay.tsx | tests/matrix-coverage.test.tsx |
| co | src/components/IntervalConfigModal.tsx | tests/audit-fixes.test.tsx, tests/brands.contract.test.ts, tests/close-button-guard.test.tsx +42 |
| Co widzisz? | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Cofnij | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Części | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Długość cyklu / powtórzenia (np. 6 rzędów) | src/components/LinkedCounterModal.tsx | tests/matrix-coverage.test.tsx |
| Długość gotowa | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Długość motka | app/(tabs)/stash.tsx | src/core/__tests__/csv-exporter.test.ts |
| Długość żyłki (opcjonalnie) | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Długość żyłki: | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| dni | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx, src/core/__tests__/app-access.test.ts, src/core/__tests__/raglan-calculator.test.ts |
| Docelowa liczba rzędów (opcjonalnie) | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Dodaj część | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Dodaj druty | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Dodaj druty / szydełko | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Dodaj licznik | src/components/LinkedCounterModal.tsx | tests/matrix-coverage.test.tsx |
| Dodaj nową część robótki | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Dodaj powiązany licznik wzoru | src/components/LinkedCounterModal.tsx | tests/matrix-coverage.test.tsx |
| Dodaj włóczkę | app/(tabs)/stash.tsx | tests/maestro-runner.ts, tests/matrix-coverage.test.tsx, .maestro/02-magazyn-wloczek.yaml |
| Dodaj włóczkę do schowka | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Doktor Błędów | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Dostęp Dożywotni (Lifetime) | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Dostęp Pełny Aktywny | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Dostosowuje interfejs, narzędzia i kalkulatory do Twojej techniki. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Dotknij w dowolnym miejscu | src/components/KnitProofOverlay.tsx | tests/matrix-coverage.test.tsx |
| Druty | app/(tabs)/learn.tsx | tests/craft-ui.test.tsx, tests/matrix-coverage.test.tsx, src/core/__tests__/backup-service.test.ts +2 |
| DRUTY | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Druty i szydełka | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Druty i Szydełko (Pełny warsztat) | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| Dziergaj do wymiarów | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Dzika fermentacja mlekowa, solanki wagowe, kimchi, kombucha i octy żywe. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Etykieta powiadomienia: | src/components/IntervalConfigModal.tsx | tests/matrix-coverage.test.tsx |
| Grubość przędzy (CYC) | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Historia (Tylko do odczytu) | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Historia: Tylko do odczytu • Odblokuj pełny dostęp ($4.99/rok) | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Imperialny (cale, yd, oz) | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Jak liczyć rzędy w tym ściegu? | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Jak zapobiegać w przyszłości: | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Język | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| JĘZYK & SYSTEM JEDNOSTEK | app/(tabs)/settings.tsx | tests/maestro-runner.ts, .maestro/05-kopia-i-ustawienia.yaml |
| Kalkulator Blokowania | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Kawa specialty, precyzyjne ekstrakcje pour-over, profilowanie wody mineralnej i sensoryka. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Kolekcja rzemieślniczych aplikacji skupionych na bezkompromisowej precyzji, 100% offline i szacunku dla prywatności twórcy. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Kolor / Lot: | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Kolorystyka (Colorway) | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Kompensacja na drutach | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Kompensacja wymiarów dzianiny po praniu | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Kompletny zestaw narzędzi, przeliczników miar i kalkulatorów bez ograniczeń. | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| Krok | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| kroków sekwencji wykonane pomyślnie. | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Lewa strona | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Liczba oczek | src/components/BlockingCalculatorModal.tsx | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/raglan-calculator.test.ts |
| Liczba rzędów | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx, src/core/__tests__/domain-rules.test.ts |
| Liczba rzędów (własna wartość): | src/components/IntervalConfigModal.tsx | tests/matrix-coverage.test.tsx |
| Liczba zakupionych motków | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Licznik | src/core/__tests__/i18n.test.ts | tests/i18n-no-polish-in-en.test.tsx, tests/maestro-runner.ts, tests/matrix-coverage.test.tsx +16 |
| Licznik 🧶 | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Licznik będzie automatycznie naliczał się wraz z rzędami części: | src/components/LinkedCounterModal.tsx | tests/matrix-coverage.test.tsx |
| Lifetime (Na zawsze) | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Lot: | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Magazyn | src/core/__tests__/i18n.test.ts | tests/maestro-runner.ts, src/core/__tests__/i18n.test.ts, .maestro/02-magazyn-wloczek.yaml +1 |
| Marka | app/(tabs)/stash.tsx | src/core/__tests__/csv-exporter.test.ts |
| Materiał: | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Metryczny (cm, m, g) | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| motków | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx, src/core/__tests__/domain-100-percent.test.ts |
| Mój Sweter | src/core/__tests__/i18n.test.ts | src/core/__tests__/i18n.test.ts |
| Nazwa części (np. Rękaw lewy, Kołnierz) | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Nazwa narzędzia | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Nazwa pierwszej części | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Nazwa projektu | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Nazwa włóczki | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Nazwa wzoru (np. Warkocz C6F, Ażur) | src/components/LinkedCounterModal.tsx | tests/matrix-coverage.test.tsx |
| Nie udało się przywrócić zakupów. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Nie znaleziono | src/components/Missing.tsx | tests/audit-fixes.test.tsx, tests/matrix-coverage.test.tsx |
| Nie znaleziono pasującej procedury awaryjnej. | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Nieznany tekst bez tłumaczenia | src/core/__tests__/i18n.test.ts | src/core/__tests__/i18n.test.ts |
| Nowa Robótka | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Numer partii / lotu (Dye Lot) | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| oczek | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx, src/core/__tests__/blocking-calculator.test.ts, src/core/__tests__/domain-rules.test.ts +4 |
| Oczek w rzędzie: | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| oczka | app/(tabs)/learn.tsx | tests/interaction-guards.test.ts, tests/maestro-runner.ts, src/core/__tests__/pattern-parser.test.ts +1 |
| Oczka do nabrania | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Oczka prawe/lewe, druty z żyłką, warkocze, raglan bezszwowy i kalkulator próbki. | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| oczko | app/(tabs)/learn.tsx | tests/audit-fixes.test.tsx, tests/matrix-coverage.test.tsx, src/core/__tests__/backup-service.test.ts +5 |
| Odblokuj pełny dostęp ($0.99 / $4.99 / $14.99) | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Okres próbny dobiegł końca. Wszystkie Twoje dotychczasowe robótki są bezpieczne. Aby tworzyć nowe, odblokuj Pass. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Otrzymasz wibrację i powiadomienie na ekranie co wybraną liczbę rzędów. | src/components/IntervalConfigModal.tsx | tests/matrix-coverage.test.tsx |
| Pełny warsztat | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Pewne dopasowanie | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Plan Miesięczny | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Plan: {plan} | app/(tabs)/settings.tsx | src/core/__tests__/i18n.test.ts |
| Po praniu i wysuszeniu dzianina osiągnie zamierzone | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Poćwicz ten ścieg w trenażerze | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Pogotowie Dziewiarskie | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Pokaż definicję w słowniku | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Polski | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Porada technologiczna | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Porada: | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Potrzebne narzędzia: | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Powtórz ćwiczenie | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Powtórzenie | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| poz. | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Pozostało | src/components/KnitProofOverlay.tsx | tests/matrix-coverage.test.tsx |
| Pozostało dni: {days} \| Dostępne nowe projekty: {projects} | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Pozostało motków: | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Prawa strona | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Procedura ratunkowa krok po kroku: | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Procedura: | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Profil rzemiosła | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Przeliczanie centymetrów, jardów, uncji i standardu US wg Craft Yarn Council | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Przypomnienie cykliczne (Interwał) | src/components/IntervalConfigModal.tsx | tests/matrix-coverage.test.tsx |
| Przywrócono poprzednie zakupy. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Przywróć zakupy | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Resetuj wszystkie filtry | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| RODZINA APPS4CRAFT STUDIO | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Rozciągnięcie | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Rozmiar | app/(tabs)/stash.tsx | src/core/__tests__/property-based.test.ts |
| Rozpocznij tworzenie | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| rz. | app/(tabs)/projects.tsx | src/core/__tests__/project-summary.test.ts |
| Rząd | app/(tabs)/learn.tsx | tests/craft-ui.test.tsx, tests/maestro-runner.ts, tests/matrix-coverage.test.tsx +6 |
| Rząd z przypomnieniem o operacji | src/components/LinkedCounterModal.tsx | tests/matrix-coverage.test.tsx |
| Rzemieślniczy chleb na zakwasie, Baker’s Math, hydratacja ciasta i harmonogramy fermentacji. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Rzemiosło dziewiarskie i szydełkowe, liczniki rzędów, warkocze i gospodarka motkami. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| rzędów | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx, src/core/__tests__/counter-engine.test.ts, src/core/__tests__/database-persistence.test.ts +5 |
| Rzędy do wykonania | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Skład surowcowy (np. 100% Wełna) | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Skurcz | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Słownik & Symbole | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Słupki, półsłupki, chusty, amigurumi i precyzyjne śledzenie okrążeń spiralnych. | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| Spokojna, 100% offline przestrzeń do liczenia rzędów, wzorów i zarządzania włóczkami. | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| Spokojnie! W rękodziele niemal każdy błąd można bezpiecznie naprawić bez prucia całej robótki. | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Spróbuj wyszukać inne słowo kluczowe (np. "oczko", "pętla", "drabinka"). | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Stabilna | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Sukces | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| System jednostek | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Szerokość | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Szerokość gotowa | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Szerokość po blokowaniu | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Szukaj | src/components/SearchField.tsx | tests/i18n-no-polish-in-en.test.tsx, tests/matrix-coverage.test.tsx |
| Szukaj... | src/components/SearchField.tsx | tests/matrix-coverage.test.tsx |
| Szukany rekord nie istnieje lub został usunięty. | src/components/Missing.tsx | tests/matrix-coverage.test.tsx |
| Szybki wybór interwału: | src/components/IntervalConfigModal.tsx | tests/matrix-coverage.test.tsx |
| Szydełko | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| SZYDEŁKO | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Twoje Narzędzia | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Twoje Robótki | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Twoje Zapasy Włóczek | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Tylko druty | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Tylko Druty | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Tylko Druty (Knitting) | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| Tylko szydełko | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Tylko Szydełko | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Tylko Szydełko (Crochet) | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| Typ techniki | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Typ: | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Udostępnij raport blokowania | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Usuń | app/(tabs)/stash.tsx | tests/i18n-no-polish-in-en.test.tsx, tests/matrix-coverage.test.tsx, tests/swipe-delete.test.tsx +1 |
| Usuń z magazynu | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Utwórz projekt | app/(tabs)/projects.tsx | tests/maestro-runner.ts, .maestro/01-nowy-projekt-licznik.yaml, .maestro/06-aktualizacja-przygotuj.yaml +1 |
| Waga motka | app/(tabs)/stash.tsx | src/core/__tests__/yarn-usage-estimator.test.ts |
| Wędzenie tradycyjne, solenie na sucho i mokro, charcuterie i kontrola wilgotności. | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Witaj {name}! | src/core/__tests__/i18n.test.ts | tests/matrix-coverage.test.tsx, src/core/__tests__/i18n.test.ts |
| Witaj w Oczku | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| Włóczki | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| wolne projekty | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Wskazówka techniczna & brzegi | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Wszystkie | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Wszystkie (w tym 0) | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Wszystkie grubości | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Wszystkie surowce | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Wszystkie techniki | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Wybierz język interfejsu aplikacji | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Wybierz swoją główną dziedzinę rzemiosła: | src/components/OnboardingModal.tsx | tests/matrix-coverage.test.tsx |
| WYBIERZ WZORZEC DO ĆWICZENIA | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Wyłącz | src/components/IntervalConfigModal.tsx | tests/matrix-coverage.test.tsx |
| Wyniki blokowania & Kompensacja | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Wysokość | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Wysokość po blokowaniu | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Wzorzec ukończony! | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Wzór / Krok | src/components/KnitProofOverlay.tsx | tests/matrix-coverage.test.tsx |
| z | app/(tabs)/learn.tsx | (tylko parametry) |
| Zacznij od początku | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Zaimportuj swój własny plik PDF lub grafikę wzoru ze schematem. Aplikacja nałoży interaktywną, przesuwaną linijkę podświetlającą bieżący wiersz i zsynchronizuje postęp z głównym licznikiem. | src/components/PatternPdfViewer.tsx | tests/matrix-coverage.test.tsx |
| Zainstalowano | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Zalicz krok (+) | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Zapisz | src/components/IntervalConfigModal.tsx | tests/i18n-no-polish-in-en.test.tsx, tests/maestro-runner.ts, .maestro/02-magazyn-wloczek.yaml |
| Zapisz w magazynie | app/(tabs)/stash.tsx | tests/maestro-runner.ts, .maestro/02-magazyn-wloczek.yaml |
| Zarządzaj subskrypcją | app/(tabs)/settings.tsx | tests/matrix-coverage.test.tsx |
| Zmiana szerokości | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Zmiana wysokości | src/components/BlockingCalculatorModal.tsx | tests/matrix-coverage.test.tsx |
| Znaleziono: | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |
| Zostało | app/(tabs)/projects.tsx | tests/matrix-coverage.test.tsx |
| Zresetuj ćwiczenie | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Zrozumiałam, usterka naprawiona! | app/(tabs)/learn.tsx | tests/matrix-coverage.test.tsx |
| Zużyj 1 motek (-1) | app/(tabs)/stash.tsx | tests/maestro-runner.ts, .maestro/02-magazyn-wloczek.yaml |
| Żadna włóczka w Twoim magazynie nie spełnia wybranych kryteriów wyszukiwania lub filtrów. | app/(tabs)/stash.tsx | tests/matrix-coverage.test.tsx |

## LOGIKA

| Pozycja | Źródło | Dowód (pierwsze 3 testy) |
|---|---|---|
| app-access-service.evaluateAccess | src/core/app-access-service.ts | src/core/__tests__/app-access.test.ts |
| app-access-service.initOrGetEntitlements | src/core/app-access-service.ts | src/core/__tests__/app-access.test.ts |
| app-access-service.activatePlan | src/core/app-access-service.ts | src/core/__tests__/app-access.test.ts |
| app-access-service.restorePurchases | src/core/app-access-service.ts | src/core/__tests__/app-access.test.ts |
| app-access-service.resetTrialForTesting | src/core/app-access-service.ts | src/core/__tests__/app-access.test.ts |
| apple-watch-service.createWatchCounterSnapshot | src/core/apple-watch-service.ts | src/core/__tests__/apple-watch-service.test.ts |
| apple-watch-service.handleWatchInteraction | src/core/apple-watch-service.ts | src/core/__tests__/apple-watch-service.test.ts, src/core/__tests__/concurrency.test.ts |
| apple-watch-service.processDigitalCrownDelta | src/core/apple-watch-service.ts | src/core/__tests__/apple-watch-service.test.ts, src/core/__tests__/perf-budget.test.ts |
| apple-watch-service.generateLiveActivityAttributes | src/core/apple-watch-service.ts | src/core/__tests__/apple-watch-service.test.ts |
| backup-service.getRecovery | src/core/backup-service.ts | tests/audit-fixes.test.tsx, src/core/__tests__/backup-service.test.ts |
| backup-service.setRecovery | src/core/backup-service.ts | tests/audit-fixes.test.tsx, src/core/__tests__/backup-service.test.ts, src/core/__tests__/domain-100-percent.test.ts |
| backup-service.clearRecovery | src/core/backup-service.ts | tests/audit-fixes.test.tsx, src/core/__tests__/backup-service.test.ts, src/core/__tests__/domain-100-percent.test.ts |
| backup-service.readRecovery | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/domain-100-percent.test.ts |
| backup-service.rotateBackups | src/core/backup-service.ts | tests/audit-fixes.test.tsx, src/core/__tests__/backup-service.test.ts |
| backup-service.buildBackupEnvelope | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts |
| backup-service.localISODate | src/core/backup-service.ts | tests/matrix-coverage.test.tsx |
| backup-service.stampOf | src/core/backup-service.ts | tests/matrix-coverage.test.tsx |
| backup-service.getDatabaseStats | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts |
| backup-service.exportDatabaseBackup | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts |
| backup-service.exportBackupToJson | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts |
| backup-service.validateBackupData | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/resilience.test.ts |
| backup-service.writeBackupFile | src/core/backup-service.ts | tests/matrix-coverage.test.tsx |
| backup-service.autoBackup | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts |
| backup-service.safetyBackup | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts |
| backup-service.importDatabaseBackup | src/core/backup-service.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/resilience.test.ts |
| blocking-calculator.convertLength | src/core/blocking-calculator.ts | src/core/__tests__/blocking-calculator.test.ts, src/core/__tests__/gauge-calculator.test.ts, src/core/__tests__/property-based.test.ts +1 |
| blocking-calculator.classifyBehavior | src/core/blocking-calculator.ts | src/core/__tests__/blocking-calculator.test.ts |
| blocking-calculator.generateFiberAdvice | src/core/blocking-calculator.ts | src/core/__tests__/blocking-calculator.test.ts |
| blocking-calculator.calculateBlockingAnalysis | src/core/blocking-calculator.ts | src/core/__tests__/blocking-calculator.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| counter-engine.computeCounterState | src/core/counter-engine.ts | tests/maestro-runner.ts, src/core/__tests__/concurrency.test.ts, src/core/__tests__/counter-engine.test.ts +4 |
| counter-engine.shouldDebounceClick | src/core/counter-engine.ts | src/core/__tests__/domain-100-percent.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts |
| counter-engine.checkPossibleInterDeviceDuplicate | src/core/counter-engine.ts | src/core/__tests__/concurrency.test.ts, src/core/__tests__/counter-engine.test.ts, src/core/__tests__/domain-100-percent.test.ts |
| counter-engine.recordCounterStep | src/core/counter-engine.ts | tests/maestro-runner.ts, src/core/__tests__/counter-engine.test.ts, src/core/__tests__/domain-100-percent.test.ts +1 |
| counter-engine.createUndoEvent | src/core/counter-engine.ts | src/core/__tests__/counter-engine.test.ts, src/core/__tests__/domain-100-percent.test.ts, src/core/__tests__/property-stateful.test.ts |
| counter-engine.mergeEventLogs | src/core/counter-engine.ts | src/core/__tests__/counter-engine.test.ts, src/core/__tests__/domain-100-percent.test.ts |
| craft-suite-theme.getCraftTheme | src/core/craft-suite-theme.ts | src/core/__tests__/craft-suite-theme.test.ts |
| csv-exporter.escapeCsvCell | src/core/csv-exporter.ts | tests/audit-fixes.test.tsx, src/core/__tests__/csv-exporter.test.ts |
| csv-exporter.buildProjectsCsv | src/core/csv-exporter.ts | src/core/__tests__/csv-exporter.test.ts |
| csv-exporter.buildStashYarnsCsv | src/core/csv-exporter.ts | src/core/__tests__/csv-exporter.test.ts |
| database.initializeDatabase | src/core/database.ts | src/core/__tests__/database.test.ts |
| database.openOczkoDatabase | src/core/database.ts | src/core/__tests__/database.test.ts |
| database.createInMemoryDatabase | src/core/database.ts | tests/matrix-coverage.test.tsx, src/core/__tests__/app-access.test.ts, src/core/__tests__/backup-service.test.ts +10 |
| database.getAppSetting | src/core/database.ts | tests/matrix-coverage.test.tsx |
| database.setAppSetting | src/core/database.ts | tests/matrix-coverage.test.tsx |
| database.loadPersistedSettings | src/core/database.ts | tests/matrix-coverage.test.tsx |
| database.getCraftProfile | src/core/database.ts | tests/matrix-coverage.test.tsx |
| database.setCraftProfile | src/core/database.ts | tests/matrix-coverage.test.tsx |
| database.isOnboardingCompleted | src/core/database.ts | tests/matrix-coverage.test.tsx |
| database.setOnboardingCompleted | src/core/database.ts | tests/matrix-coverage.test.tsx |
| db-path.dbDirectory | src/core/db-path.ts | src/core/__tests__/db-path.test.ts |
| device-sync.createSyncPayload | src/core/device-sync.ts | src/core/__tests__/concurrency.test.ts, src/core/__tests__/device-sync.test.ts |
| device-sync.processIncomingSync | src/core/device-sync.ts | src/core/__tests__/concurrency.test.ts, src/core/__tests__/device-sync.test.ts |
| domain-rules.inchesToCm | src/core/domain-rules.ts | tests/audit-fixes.test.tsx, src/core/__tests__/domain-rules.test.ts, src/core/__tests__/property-based.test.ts +2 |
| domain-rules.cmToInches | src/core/domain-rules.ts | tests/audit-fixes.test.tsx, src/core/__tests__/domain-rules.test.ts, src/core/__tests__/property-based.test.ts +2 |
| domain-rules.yardsToMeters | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/unit-converter.test.ts |
| domain-rules.metersToYards | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/unit-converter.test.ts |
| domain-rules.ouncesToGrams | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/unit-converter.test.ts |
| domain-rules.yardsPer100gToMetersPer100g | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.calculateFromGauge | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.adaptPatternStitches | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.distributeShapingInRow | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.distributeShapingOverRows | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.generateRowSchedule | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.calculateYarnFromSwatch | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.calculateYarnSubstitution | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.getYarnWeightCategoriesByKnitGauge4in | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.getYarnWeightCategoriesByWpi | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.usNeedleToMm | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| domain-rules.evaluateGarmentEase | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| ease-calculator-service.getEasePresets | src/core/ease-calculator-service.ts | src/core/__tests__/ease-calculator-service.test.ts |
| ease-calculator-service.getStandardGarmentSizes | src/core/ease-calculator-service.ts | src/core/__tests__/ease-calculator-service.test.ts |
| ease-calculator-service.findStandardSizeByBust | src/core/ease-calculator-service.ts | src/core/__tests__/ease-calculator-service.test.ts |
| ease-calculator-service.calculateDetailedEase | src/core/ease-calculator-service.ts | src/core/__tests__/ease-calculator-service.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| ease-calculator-service.recommendPatternSize | src/core/ease-calculator-service.ts | src/core/__tests__/ease-calculator-service.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| ease-calculator-service.adaptStitchesWithRecommendation | src/core/ease-calculator-service.ts | src/core/__tests__/ease-calculator-service.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| feedback-service.checkIntervalReminder | src/core/feedback-service.ts | src/core/__tests__/feedback-service.test.ts |
| feedback-service.triggerHaptic | src/core/feedback-service.ts | src/core/__tests__/feedback-service.test.ts |
| garmin-service.createGarminSyncPayload | src/core/garmin-service.ts | src/core/__tests__/garmin-service.test.ts, src/core/__tests__/perf-budget.test.ts |
| garmin-service.serializeGarminEnvelope | src/core/garmin-service.ts | src/core/__tests__/garmin-service.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts |
| garmin-service.deserializeGarminEnvelope | src/core/garmin-service.ts | src/core/__tests__/garmin-service.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| garmin-service.handleGarminWatchEvent | src/core/garmin-service.ts | src/core/__tests__/garmin-service.test.ts, src/core/__tests__/resilience.test.ts |
| gauge-calculator.convertLength | src/core/gauge-calculator.ts | src/core/__tests__/blocking-calculator.test.ts, src/core/__tests__/gauge-calculator.test.ts, src/core/__tests__/property-based.test.ts +1 |
| gauge-calculator.calculateTargetStitchesAndRows | src/core/gauge-calculator.ts | src/core/__tests__/gauge-calculator.test.ts, src/core/__tests__/gauge-corpus.test.ts, src/core/__tests__/perf-budget.test.ts +2 |
| gauge-calculator.calculateCastOnAdjustment | src/core/gauge-calculator.ts | src/core/__tests__/domain-100-percent.test.ts, src/core/__tests__/resilience.test.ts |
| gauge-calculator.compareGauges | src/core/gauge-calculator.ts | src/core/__tests__/gauge-calculator.test.ts, src/core/__tests__/property-based.test.ts |
| glossary-data.getGlossaryByCategory | src/core/glossary-data.ts | src/core/__tests__/glossary-data.test.ts |
| glossary-data.searchGlossary | src/core/glossary-data.ts | src/core/__tests__/glossary-data.test.ts |
| hat-calculator.calculateHatCrown | src/core/hat-calculator.ts | src/core/__tests__/domain-100-percent.test.ts, src/core/__tests__/hat-calculator.test.ts, src/core/__tests__/perf-budget.test.ts +2 |
| knitting-doctor.diagnoseEmergency | src/core/knitting-doctor.ts | src/core/__tests__/knitting-doctor.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| knitting-doctor.getProcedureById | src/core/knitting-doctor.ts | src/core/__tests__/knitting-doctor.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts |
| knitting-doctor.listAllProcedures | src/core/knitting-doctor.ts | src/core/__tests__/knitting-doctor.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts |
| needle-gauge-converter.findClosestMetricNeedle | src/core/needle-gauge-converter.ts | src/core/__tests__/needle-gauge-converter.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/resilience.test.ts |
| needle-gauge-converter.convertNeedleSize | src/core/needle-gauge-converter.ts | src/core/__tests__/domain-100-percent.test.ts, src/core/__tests__/needle-gauge-converter.test.ts, src/core/__tests__/resilience.test.ts |
| needle-gauge-converter.convertCraftLength | src/core/needle-gauge-converter.ts | src/core/__tests__/needle-gauge-converter.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| needle-gauge-converter.convertCraftWeight | src/core/needle-gauge-converter.ts | src/core/__tests__/needle-gauge-converter.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| needle-gauge-converter.convertGaugeTension | src/core/needle-gauge-converter.ts | src/core/__tests__/needle-gauge-converter.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +1 |
| pattern-document-service.validateAndFormatPatternFile | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-document-service.calculateNextRulerPosition | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-document-service.stepPatternDocumentWithCounter | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-document-service.insertPatternDocument | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-document-service.getPatternDocument | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-document-service.getPatternDocumentForProject | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-document-service.listPatternDocuments | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-document-service.updatePatternRuler | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-document-service.deletePatternDocument | src/core/pattern-document-service.ts | src/core/__tests__/pattern-document-service.test.ts |
| pattern-parser.translateStitchToken | src/core/pattern-parser.ts | src/core/__tests__/pattern-parser.test.ts |
| pattern-parser.parseRowInstruction | src/core/pattern-parser.ts | src/core/__tests__/pattern-parser.test.ts, src/core/__tests__/perf-budget.test.ts |
| project-repository.insertProject | src/core/project-repository.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/concurrency.test.ts, src/core/__tests__/database-persistence.test.ts |
| project-repository.getProject | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts |
| project-repository.updateProjectStatus | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts |
| project-repository.listProjects | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts |
| project-repository.insertProjectPart | src/core/project-repository.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/concurrency.test.ts, src/core/__tests__/database-persistence.test.ts |
| project-repository.getProjectParts | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts |
| project-repository.insertCounter | src/core/project-repository.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/concurrency.test.ts, src/core/__tests__/database-persistence.test.ts |
| project-repository.getCountersByPart | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts |
| project-repository.appendCounterEvent | src/core/project-repository.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/concurrency.test.ts |
| project-repository.getCounterEvents | src/core/project-repository.ts | src/core/__tests__/concurrency.test.ts, src/core/__tests__/project-flow-integration.test.ts |
| project-repository.loadProjectFacade | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts, src/core/__tests__/linked-counters.test.ts, src/core/__tests__/project-flow-integration.test.ts |
| project-repository.persistProjectStep | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts, src/core/__tests__/linked-counters.test.ts, src/core/__tests__/project-flow-integration.test.ts |
| project-repository.persistProjectUndo | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts, src/core/__tests__/linked-counters.test.ts, src/core/__tests__/project-flow-integration.test.ts |
| project-repository.saveTimeSession | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts |
| project-repository.listTimeSessions | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts |
| project-repository.getTotalProjectDurationSeconds | src/core/project-repository.ts | src/core/__tests__/database-persistence.test.ts |
| project-service.createFullProject | src/core/project-service.ts | src/core/__tests__/linked-counters.test.ts, src/core/__tests__/project-flow-integration.test.ts, src/core/__tests__/project-service.test.ts |
| project-service.loadAllProjectsWithProgress | src/core/project-service.ts | src/core/__tests__/linked-counters.test.ts, src/core/__tests__/project-flow-integration.test.ts, src/core/__tests__/project-service.test.ts |
| project-service.seedDefaultProjectIfEmpty | src/core/project-service.ts | src/core/__tests__/project-service.test.ts |
| project-service.addPartToProject | src/core/project-service.ts | src/core/__tests__/linked-counters.test.ts |
| project-service.addLinkedCounterToPart | src/core/project-service.ts | src/core/__tests__/linked-counters.test.ts |
| project-share-protocol.utf8ToBase64 | src/core/project-share-protocol.ts | src/core/__tests__/project-share-protocol.test.ts |
| project-share-protocol.base64ToUtf8 | src/core/project-share-protocol.ts | src/core/__tests__/project-share-protocol.test.ts |
| project-share-protocol.encodeProjectToDeepLink | src/core/project-share-protocol.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/project-share-protocol.test.ts, src/core/__tests__/property-based.test.ts |
| project-share-protocol.decodeProjectFromDeepLink | src/core/project-share-protocol.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/project-share-protocol.test.ts, src/core/__tests__/property-based.test.ts +1 |
| project-structure.buildProjectHierarchy | src/core/project-structure.ts | tests/matrix-coverage.test.tsx |
| project-summary.buildProjectSummary | src/core/project-summary.ts | src/core/__tests__/project-summary.test.ts |
| project-summary.generateShareableText | src/core/project-summary.ts | src/core/__tests__/project-summary.test.ts |
| repeats-schedule.generateRepeatSchedule | src/core/repeats-schedule.ts | tests/matrix-coverage.test.tsx |
| shaping-calculator.calculateEvenIncreases | src/core/shaping-calculator.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts +1 |
| shaping-calculator.calculateEvenDecreases | src/core/shaping-calculator.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts +1 |
| shaping-calculator.calculateMultiRowShaping | src/core/shaping-calculator.ts | src/core/__tests__/domain-100-percent.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +2 |
| stash-filter-service.detectFiberTags | src/core/stash-filter-service.ts | src/core/__tests__/stash-filter-service.test.ts |
| stash-filter-service.filterStashYarns | src/core/stash-filter-service.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/stash-filter-service.test.ts |
| stash-filter-service.calculateStashMetrics | src/core/stash-filter-service.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/stash-filter-service.test.ts |
| stash-repository.insertStashYarn | src/core/stash-repository.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/stash-repository.test.ts |
| stash-repository.listStashYarns | src/core/stash-repository.ts | src/core/__tests__/stash-repository.test.ts |
| stash-repository.getStashYarn | src/core/stash-repository.ts | src/core/__tests__/stash-repository.test.ts |
| stash-repository.updateStashYarnRemaining | src/core/stash-repository.ts | src/core/__tests__/stash-repository.test.ts |
| stash-repository.deleteStashYarn | src/core/stash-repository.ts | src/core/__tests__/stash-repository.test.ts |
| stash-repository.insertStashTool | src/core/stash-repository.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/stash-repository.test.ts |
| stash-repository.listStashTools | src/core/stash-repository.ts | src/core/__tests__/stash-repository.test.ts |
| stash-repository.getStashTool | src/core/stash-repository.ts | src/core/__tests__/stash-repository.test.ts |
| stash-repository.deleteStashTool | src/core/stash-repository.ts | src/core/__tests__/stash-repository.test.ts |
| stash-repository.seedDefaultStashIfEmpty | src/core/stash-repository.ts | src/core/__tests__/stash-repository.test.ts |
| stitch-identifier.getQuestionByStep | src/core/stitch-identifier.ts | src/core/__tests__/stitch-identifier.test.ts |
| stitch-identifier.identifyStitch | src/core/stitch-identifier.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts +1 |
| technique-library.getAllTechniqueCards | src/core/technique-library.ts | src/core/__tests__/technique-library.test.ts |
| technique-library.getTechniqueCardById | src/core/technique-library.ts | src/core/__tests__/technique-library.test.ts |
| technique-library.filterTechniqueCards | src/core/technique-library.ts | src/core/__tests__/technique-library.test.ts |
| technique-library.getTechniqueSteps | src/core/technique-library.ts | src/core/__tests__/technique-library.test.ts |
| technique-library.countTechniquesByDiscipline | src/core/technique-library.ts | src/core/__tests__/technique-library.test.ts |
| theme.getLuminance | src/core/theme.ts | tests/matrix-coverage.test.tsx |
| theme.getContrastRatio | src/core/theme.ts | tests/audit-fixes.test.tsx, src/core/__tests__/craft-suite-theme.test.ts |
| time-tracking-service.formatDuration | src/core/time-tracking-service.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts +1 |
| time-tracking-service.shouldAutoPauseSession | src/core/time-tracking-service.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts +1 |
| time-tracking-service.calculateSessionDuration | src/core/time-tracking-service.ts | src/core/__tests__/time-tracking-service.test.ts |
| time-tracking-service.calculateKnittingSpeed | src/core/time-tracking-service.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts +1 |
| time-tracking-service.remainingTimerSec | src/core/time-tracking-service.ts | tests/audit-fixes.test.tsx, src/core/__tests__/property-stateful.test.ts, src/core/__tests__/time-tracking-service.test.ts |
| time-tracking-service.pauseTimer | src/core/time-tracking-service.ts | src/core/__tests__/time-tracking-service.test.ts |
| time-tracking-service.resumeTimer | src/core/time-tracking-service.ts | src/core/__tests__/time-tracking-service.test.ts |
| unit-converter.setUnitSystem | src/core/unit-converter.ts | src/core/__tests__/unit-converter.test.ts |
| unit-converter.getUnitSystem | src/core/unit-converter.ts | src/core/__tests__/unit-converter.test.ts |
| unit-converter.subscribeUnitSystem | src/core/unit-converter.ts | src/core/__tests__/unit-converter.test.ts |
| unit-converter.metersToYards | src/core/unit-converter.ts | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/unit-converter.test.ts |
| unit-converter.yardsToMeters | src/core/unit-converter.ts | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/unit-converter.test.ts |
| unit-converter.gramsToOunces | src/core/unit-converter.ts | src/core/__tests__/unit-converter.test.ts |
| unit-converter.ouncesToGrams | src/core/unit-converter.ts | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/unit-converter.test.ts |
| unit-converter.cmToInches | src/core/unit-converter.ts | tests/audit-fixes.test.tsx, src/core/__tests__/domain-rules.test.ts, src/core/__tests__/property-based.test.ts +2 |
| unit-converter.inchesToCm | src/core/unit-converter.ts | tests/audit-fixes.test.tsx, src/core/__tests__/domain-rules.test.ts, src/core/__tests__/property-based.test.ts +2 |
| unit-converter.swatch10cmTo4inch | src/core/unit-converter.ts | src/core/__tests__/resilience.test.ts, src/core/__tests__/unit-converter.test.ts |
| unit-converter.swatch4inchTo10cm | src/core/unit-converter.ts | src/core/__tests__/resilience.test.ts, src/core/__tests__/unit-converter.test.ts |
| unit-converter.formatLength | src/core/unit-converter.ts | src/core/__tests__/unit-converter.test.ts |
| unit-converter.formatWeight | src/core/unit-converter.ts | src/core/__tests__/unit-converter.test.ts |
| unit-converter.formatGauge | src/core/unit-converter.ts | src/core/__tests__/unit-converter.test.ts |
| unit-converter.formatNeedleSize | src/core/unit-converter.ts | src/core/__tests__/unit-converter.test.ts |
| unit-converter.wInKeep | src/core/unit-converter.ts | tests/audit-fixes.test.tsx, src/core/__tests__/unit-converter.test.ts |
| use-unit-system.useUnitSystem | src/core/use-unit-system.ts | tests/matrix-coverage.test.tsx |
| yarn-usage-estimator.calculateYarnGrist | src/core/yarn-usage-estimator.ts | src/core/__tests__/gauge-corpus.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts +2 |
| yarn-usage-estimator.estimateYarnFromProgress | src/core/yarn-usage-estimator.ts | src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts +1 |
| yarn-usage-estimator.estimateYarnFromSwatch | src/core/yarn-usage-estimator.ts | src/core/__tests__/domain-100-percent.test.ts, src/core/__tests__/property-based.test.ts, src/core/__tests__/resilience.test.ts +1 |
| yarn-usage-estimator.estimateFromProjectPart | src/core/yarn-usage-estimator.ts | src/core/__tests__/yarn-usage-estimator.test.ts |

## WYMIAR

| Pozycja | Źródło | Dowód (pierwsze 3 testy) |
|---|---|---|
| PlanType: trial \| monthly \| annual \| lifetime | src/core/app-access-service.ts | src/core/__tests__/app-access.test.ts |
| EntitlementStatus: active \| expired | src/core/app-access-service.ts | tests/matrix-coverage.test.tsx, src/core/__tests__/app-access.test.ts |
| Unit: cm \| inch | src/core/blocking-calculator.ts | src/core/__tests__/blocking-calculator.test.ts |
| DimensionBehavior: growth \| shrinkage \| stable | src/core/blocking-calculator.ts | src/core/__tests__/blocking-calculator.test.ts |
| DeviceSource: iphone \| apple_watch \| garmin \| voice \| gesture | src/core/counter-engine.ts | tests/maestro-runner.ts, tests/matrix-coverage.test.tsx |
| CounterEventType: INCREMENT \| DECREMENT \| RESET \| UNDO \| SET | src/core/counter-engine.ts | src/core/__tests__/apple-watch-service.test.ts, src/core/__tests__/counter-engine.test.ts, src/core/__tests__/domain-100-percent.test.ts |
| CraftAppId: oczko \| napar \| piekarz \| sloik \| masaz \| ferment | src/core/craft-suite-theme.ts | src/core/__tests__/craft-suite-theme.test.ts |
| SQLITE_SCHEMA_STATEMENTS (15) | src/core/database-schema.ts | tests/matrix-coverage.test.tsx |
| CraftProfile: knitting \| crochet \| both | src/core/database.ts | tests/matrix-coverage.test.tsx, src/core/__tests__/backup-service.test.ts, src/core/__tests__/knitting-doctor.test.ts |
| ConfidenceLevel: math \| standard \| heurystyka \| praktyka | src/core/domain-rules.ts | tests/matrix-coverage.test.tsx |
| ShapingMethod: k2tog \| m1_yo \| kfb | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| WorkMode: round \| flat | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| EaseCategory: bardzo dopasowany \| pomiędzy (dopasowany–bardzo dopasowany) \| dopasowany \| między zerowym a klasycznym \| klasyczny \| klasyczny / luźny \| luźny \| luźny / oversize \| oversize \| poniżej skali (mniej niż -10 cm) | src/core/domain-rules.ts | src/core/__tests__/domain-rules.test.ts |
| EasePresetId: negative_socks \| negative_fitted \| zero_ease \| close_fit \| classic_fit \| relaxed_fit \| oversize_fit \| boxy_fit | src/core/ease-calculator-service.ts | tests/matrix-coverage.test.tsx |
| EASE_PRESETS (8) | src/core/ease-calculator-service.ts | tests/matrix-coverage.test.tsx |
| STANDARD_ADULT_SIZES (9) | src/core/ease-calculator-service.ts | tests/matrix-coverage.test.tsx |
| FeedbackType: step \| undo \| cycle \| goal \| reminder | src/core/feedback-service.ts | src/core/__tests__/feedback-service.test.ts |
| GarminWatchModel: forerunner_965 \| fenix_7 \| venu_3 \| epix_pro \| generic_ciq | src/core/garmin-service.ts | tests/matrix-coverage.test.tsx |
| GarminButtonKey: KEY_START_STOP \| KEY_LAP \| KEY_UP \| KEY_DOWN \| TOUCH_TAP | src/core/garmin-service.ts | src/core/__tests__/garmin-service.test.ts |
| MeasurementUnit: cm \| inch | src/core/gauge-calculator.ts | src/core/__tests__/blocking-calculator.test.ts |
| BUILT_IN_PROJECT_TEMPLATES (5) | src/core/gauge-calculator.ts | src/core/__tests__/gauge-calculator.test.ts |
| GlossaryCategory: basic \| decrease \| increase \| cable \| short_rows \| crochet | src/core/glossary-data.ts | tests/matrix-coverage.test.tsx, src/core/__tests__/glossary-data.test.ts |
| KNITTING_GLOSSARY (41) | src/core/glossary-data.ts | src/core/__tests__/glossary-data.test.ts |
| HAT_STANDARD_SIZES (6) | src/core/hat-calculator.ts | src/core/__tests__/hat-calculator.test.ts |
| HatBrimStyle: single \| folded | src/core/hat-calculator.ts | src/core/__tests__/domain-100-percent.test.ts |
| HatFitStyle: beanie \| slouchy | src/core/hat-calculator.ts | src/core/__tests__/domain-100-percent.test.ts |
| DoctorEmergencyId: dropped_stitch \| twisted_stitch \| accidental_yarnover \| tink_unknitting \| lifeline_insertion \| crochet_escaped_loop | src/core/knitting-doctor.ts | src/core/__tests__/knitting-doctor.test.ts |
| CraftDiscipline: knitting \| crochet \| both | src/core/knitting-doctor.ts | tests/matrix-coverage.test.tsx, src/core/__tests__/backup-service.test.ts, src/core/__tests__/knitting-doctor.test.ts |
| DangerLevel: critical \| moderate \| low | src/core/knitting-doctor.ts | src/core/__tests__/knitting-doctor.test.ts |
| DOCTOR_PROCEDURES (6) | src/core/knitting-doctor.ts | src/core/__tests__/knitting-doctor.test.ts, src/core/__tests__/property-based.test.ts |
| LICENSES (584) | src/core/licenses.generated.ts | tests/matrix-coverage.test.tsx |
| NeedleSystem: metric \| us \| uk \| jp | src/core/needle-gauge-converter.ts | tests/maestro-runner.ts, src/core/__tests__/domain-100-percent.test.ts |
| NEEDLE_SIZE_TABLE (22) | src/core/needle-gauge-converter.ts | src/core/__tests__/needle-gauge-converter.test.ts |
| BUILT_IN_PATTERNS (2) | src/core/pattern-guide-data.ts | tests/matrix-coverage.test.tsx |
| TRAINER_EXERCISES (4) | src/core/pattern-trainer.ts | src/core/__tests__/pattern-trainer.test.ts |
| CraftType: knitting \| crochet | src/core/project-repository.ts | tests/matrix-coverage.test.tsx, src/core/__tests__/backup-service.test.ts |
| ProjectStatus: active \| hibernated \| finished \| frogged | src/core/project-repository.ts | tests/matrix-coverage.test.tsx |
| IncreaseMethod: M1L \| M1R \| kfb \| yo | src/core/shaping-calculator.ts | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/pattern-parser.test.ts, src/core/__tests__/perf-budget.test.ts +1 |
| DecreaseMethod: k2tog \| ssk \| p2tog | src/core/shaping-calculator.ts | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/shaping-calculator.test.ts |
| YARN_WEIGHT_STANDARDS (8) | src/core/stash-filter-service.ts | src/core/__tests__/stash-filter-service.test.ts |
| FIBER_FILTER_TAGS (7) | src/core/stash-filter-service.ts | tests/matrix-coverage.test.tsx |
| YarnWeightCategory: Lace \| Fingering \| Sport \| DK \| Worsted \| Aran \| Bulky \| Super Bulky | src/core/stash-repository.ts | src/core/__tests__/backup-service.test.ts, src/core/__tests__/perf-budget.test.ts, src/core/__tests__/property-based.test.ts |
| ToolType: circular \| straight \| dpn \| crochet_hook \| interchangeable_cable \| interchangeable_tip \| accessory \| notion \| custom | src/core/stash-repository.ts | tests/matrix-coverage.test.tsx |
| ToolMaterial: bamboo \| wood \| metal \| plastic \| carbon \| other | src/core/stash-repository.ts | tests/matrix-coverage.test.tsx |
| STITCH_IDENTIFIER_QUESTIONS (3) | src/core/stitch-identifier.ts | src/core/__tests__/stitch-identifier.test.ts |
| TechniqueDiscipline: knitting \| crochet | src/core/technique-library.ts | tests/matrix-coverage.test.tsx, src/core/__tests__/backup-service.test.ts |
| TechniqueLevel: beginner \| intermediate \| advanced | src/core/technique-library.ts | tests/matrix-coverage.test.tsx |
| Handedness: right \| left | src/core/technique-library.ts | src/core/__tests__/technique-library.test.ts |
| TECHNIQUE_CARDS (21) | src/core/technique-library.ts | src/core/__tests__/technique-library.test.ts |
| UnitSystem: metric \| imperial | src/core/unit-converter.ts | tests/maestro-runner.ts, src/core/__tests__/backup-service.test.ts |
| COMMON_MULTI_STRAND_COMBINATIONS (6) | src/core/yarn-substitution-service.ts | src/core/__tests__/yarn-substitution-service.test.ts |
| YarnChickenRisk: safe \| warning \| danger | src/core/yarn-usage-estimator.ts | src/core/__tests__/domain-100-percent.test.ts, src/core/__tests__/feedback-service.test.ts, src/core/__tests__/yarn-usage-estimator.test.ts |
