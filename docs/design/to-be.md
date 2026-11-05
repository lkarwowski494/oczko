# Oczko — przepływy TO BE zatwierdzone na STOP 2 redesignu M3

Data: 2026-11-05 · Decyzja: P-549 (właściciel: „1. KB 2. A 3A 4A 5A 6A 7A”) · Podstawa: P-544 (redesign), P-545 (+1 jednym stuknięciem z ekranu startowego), P-547 (żaden ekran nie jest płaskim białym ani czarnym tłem; ikona zostaje, chyba że nie pasuje do kierunku).

Ten plik opisuje przepływy i strukturę, nie wygląd. Wygląd (barwy, kształty, kroje, element firmowy) projektuje rola 04 w trybie build w `docs/design/` i wybiera właściciel okiem. Logika i dane bez zmian: żadna zmiana poniżej nie zmienia zapisu, schematu, kopii ani usuwania danych. Koszty „po” to szacunek na opisie kroków; mierzone po wdrożeniu (E5 M3).

## Decyzje wspólne
- **WD-1 Nawigacja:** 4 zakładki z podpisem: Dziś, Projekty, Narzędzia, Historia. Ustawienia z ikony zębatki na „Dziś”. Na pełnym ekranie licznika i na wzorze pasek zakładek ukryty. Odrzucone: 3 zakładki z „Więcej”, brak zakładek, obecny stos.
- **WD-2 Długie przepływy:** formularze zostają jednym arkuszem (Cancel/Save, „Dodaj część” w tym samym arkuszu); zmienia się tylko wejście (kafel na „Dziś”, „+” w zakładce Projekty). Odrzucone: kreator krok po kroku.
- **WD-3 Usuwanie i cofanie:** model bez zmian — kosz 30 dni z potwierdzeniem i datą, cofnięcie serii rzędów. Nowe widoczne wejście: ••• przy wierszu projektu na liście i na ekranie projektu. Bez gestu przesunięcia wiersza (R6). Odrzucone: przesunięcie w lewo z „Cofnij”.

## Przepływy

| ZM | Przepływ | Kroki TO BE | Koszt przed → po (stuknięcia / zmiany ekranu) |
|---|---|---|---|
| ZM-01 | Ekran startowy „Dziś” | otwarcie → „Dziś”: tytuł z datą i ikoną Ustawień, pasek tygodnia (ZM-03), karta „Kontynuuj” (ZM-02), kafle funkcji z ikoną i podpisem (np. Nowy projekt, Dodaj wzór, Włóczka i druty, Próbka), zakładki (WD-1) | odkrywalność ze startu: 2 z 33 funkcji słowem → ok. 12 z 33 |
| ZM-02 | Karta „Kontynuuj” (wariant K-B) | karta ostatniego projektu: nazwa, część, „rząd n z m”, liczba; okrągłe „+1” obok (cel ≥ 44 pt) liczy rząd bez opuszczania „Dziś”; przycisk główny „Kontynuuj ›” → pełny ekran licznika. Pierwsze uruchomienie bez projektu: karta licznika bez projektu z tym samym „+1” | pierwszy rząd 1 → 1; powrót: 0 → 0 do „+1”, 1 do pełnego licznika |
| ZM-03 | Zachęty na „Dziś” | tylko z danych, które aplikacja już ma: pasek tygodnia z dniami dziergania, „co dalej” po osiągnięciu celu części, liczba wolnych dni. Bez serii dni i bez przypomnień powrotu | „co dalej” widoczne poza licznikiem |
| ZM-04 | Ekran licznika | pod liczbą rząd przycisków z ikoną i słowem: Notatka, Wzór, Cel, Stoper, Historia; nad tytułem „Projekt ›” do ekranu projektu; przy AX5 przyciski jako lista pod liczbą | notatka 4 + przewinięcie / 3 → 2 / 1; lista sesji 3 + przewinięcie → 2 |
| ZM-05 | Menu ••• licznika | menu systemowe z ikonami w dwóch grupach: korekta (wpisz liczbę, znaczenie liczby, reset na końcu z potwierdzeniem), stan (blokada, ukończ projekt) | 10 pozycji → 5 |
| ZM-06 | Dodanie wzoru | „Wzór” w projekcie bez wzoru → od razu menu źródeł (Pliki, Zdjęcia, Aparat, Strona) → plik → kierunek rzędów → Gotowe; z wzorem otwiera wzór; lista wielu wzorów w nagłówku wzoru | ok. 8 / 3 → ok. 6 / 2 |
| ZM-07 | Ustawienia | lista grupowana: ikona, podpis od lewej, strzałka przy przejściu, działania bez strzałki | — |
| ZM-08 | Wygląd | nowy kierunek z dziedziny, 2–3 warianty na ekranie „Dziś” w obu motywach do wyboru okiem; żaden ekran nie jest płaskim białym ani czarnym tłem; przycisk główny wypełniony w obu motywach; ikony w kolorze; WCAG AA w obu motywach | — |
| ZM-09 | Element firmowy | widoczny na „Dziś” i niosący dane (forma w kierunku z ZM-08) | — |
| ZM-10 | Strona wzoru w ciemnym motywie | strona w oryginalnych kolorach pliku; tło i pasek wokół w barwie motywu | — |

Inne przepływy (projekty, historia, narzędzia, formularze, kosz, oferty, ukończenie) zachowują dzisiejsze kroki; zmienia się tylko wejście przez zakładki (WD-1) i wygląd z ZM-08.

## Zakres
Zasada „0 ekranów przed licznikiem” (NFR-PIE-001, P-046) zastąpiona przez „+1 jednym stuknięciem z ekranu startowego” (P-545, P-549). Kontrakt zakresu poprawia rola 03 przed wdrożeniem w kodzie (E4 M3); lista funkcji bez zmian.
