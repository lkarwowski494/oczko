# Wymagania: licznik (LIC)
Stan: STOP E3 · Aktualizacja: 2026-10-21 · Przepływy w `wymagania.md`; dowody i cytaty w `odkrywanie.md`.

### BR-LIC-001: Licznik od pierwszego uruchomienia
- Przepływ: PR-01
- Dowód potrzeby: J-01; początkujący odinstalowują, gdy nie umieją założyć pierwszego projektu (soczewka początkująca, My Row Counter id11891747617); OG-01 wymaga głębi, ale nie na starcie (H-07)
- Kryteria akceptacji:
  - Scenariusz: Pierwsze uruchomienie
    - Zakładając, że aplikacja jest uruchomiona pierwszy raz
    - Gdy otwiera się pierwszy ekran
    - Wtedy jest nim „Dziś” z kartą „Pierwszy licznik” z wartością 0 i przyciskiem „+1”, bez powitania, quizu, prośby o uprawnienie, konto, nazwę projektu, wzór, zakup, wybór języka ani okna „Uczciwe zasady”, a nic nie zasłania „+1” karty (NFR-PIE-001, ER-14, ZM-18, ER-68)
  - Scenariusz: Pierwszy rząd jednym stuknięciem
    - Zakładając, że aplikacja jest uruchomiona pierwszy raz, bez sieci
    - Gdy użytkownik stuka raz w „+1” karty „Pierwszy licznik” na „Dziś”
    - Wtedy karta pokazuje 1 bez zmiany ekranu, a rząd jest zapisany jak +1 na ekranie licznika: trwale (NFR-DAN-002), z wibracją i przez strażnika limitu (BR-ZAK-005; ZM-18, ER-68)
  - Scenariusz: Nazwanie później
    - Zakładając, że użytkownik policzył 12 rzędów w liczniku bez nazwy
    - Gdy nadaje mu nazwę projektu
    - Wtedy projekt ma licznik z wartością 12

### BR-LIC-002: Dodawanie i odejmowanie rzędu
- Przepływ: PR-02
- Dowód potrzeby: J-01; skargi na usunięty przycisk odejmowania (編み物カウンター２, id10157582822) i brak cofania (Knit Row Counter)
- Kryteria akceptacji:
  - Scenariusz: Dodanie rzędu
    - Zakładając, że licznik ma wartość 41
    - Gdy użytkownik dodaje rząd
    - Wtedy licznik pokazuje 42
  - Scenariusz: Odjęcie przy pruciu
    - Zakładając, że licznik ma wartość 42
    - Gdy użytkownik odejmuje rząd
    - Wtedy licznik pokazuje 41
  - Scenariusz: Granica zera
    - Zakładając, że licznik ma wartość 0
    - Gdy użytkownik odejmuje rząd
    - Wtedy licznik nadal pokazuje 0, a aplikacja nie zapisuje zmiany w historii

### BR-LIC-003: Historia zmian z godziną i cofnięciem
- Przepływ: PR-02
- Dowód potrzeby: J-01; „いつカウンターを押したのか履歴を確認できるので” (編み物カウンター２, id13252701149); historii nie da się poprawić (Easy Knitty GB, id8099185238) · ER-41: „Cofnij” dotyczy tylko ostatniej zmiany albo serii zmian na końcu historii; starszą pomyłkę poprawia się wpisaniem wartości (BR-LIC-017), które zostaje w historii, bez kasowania późniejszych rzędów (P-091 (3a); jak Trening `docs/32-wzorce-interakcji.md:58`: „„Cofnij” = odwrócenie ostatniej zmiany”)
- Kryteria akceptacji:
  - Scenariusz: Sprawdzenie, czy dodałem rząd
    - Zakładając, że użytkownik dodał rząd o 20:14 i o 20:31
    - Gdy otwiera historię licznika
    - Wtedy widzi obie zmiany z godziną i wartością po zmianie
  - Scenariusz: Cofnięcie serii przypadkowych zmian
    - Zakładając, że licznik miał 30, a przez przypadek dodano 100 rzędów
    - Gdy użytkownik cofa te zmiany z historii
    - Wtedy licznik pokazuje 30, a statystyki czasu i tempa nie liczą cofniętych rzędów
  - Scenariusz: Cofnięcie ostatniej zmiany (ER-41)
    - Zakładając, że ostatnia zmiana w historii to dodanie rzędu o 20:31 z 41 na 42
    - Gdy użytkownik cofa ją z historii
    - Wtedy licznik pokazuje 41, a historia pokazuje tę zmianę jako cofniętą
  - Scenariusz: Pomyłka ze środka historii (ER-41)
    - Zakładając, że licznik miał 30, o 20:14 przez pomyłkę dodano rząd (31), a potem użytkownik zrobił 10 rzędów do 41
    - Gdy otwiera historię przy zmianie z 20:14
    - Wtedy ta zmiana nie ma „Cofnij”, a aplikacja proponuje wpisanie właściwej wartości (BR-LIC-017)
    - Oraz po wpisaniu 40 licznik pokazuje 40, a historia zachowuje wszystkie wcześniejsze zmiany i dopisuje wpisanie z 41 na 40

### BR-LIC-004: Blokada przed przypadkowym stuknięciem
- Przepływ: PR-02
- Dowód potrzeby: J-01; 24 z 47 recenzji o przypadkowym stuknięciu ma ≤3★; „Just moving my phone to get back to the pattern caused row jumps” (Knit Row Counter, id1532433389); „The motion of swiping up increases the count every single time” (Knit Row Counter CA, id4570617893)
- Kryteria akceptacji:
  - Scenariusz: Licznik zablokowany
    - Zakładając, że licznik ma wartość 15 i jest zablokowany
    - Gdy przycisk dodawania dostaje stuknięcie, np. od kolana albo stołu (ER-36)
    - Wtedy licznik nadal pokazuje 15, a historia nie ma nowej zmiany
  - Scenariusz: Odblokowanie
    - Zakładając, że licznik jest zablokowany
    - Gdy użytkownik wybiera odblokowanie na pasku blokady licznika (ER-36; miejsce i tekst: rola 04)
    - Wtedy dodanie rzędu znów zmienia wartość
  - Scenariusz: Stuknięcie w zablokowany licznik (ER-24)
    - Zakładając, że licznik ma wartość 15 i jest zablokowany
    - Gdy użytkownik świadomie stuka w przycisk dodawania
    - Wtedy licznik nadal pokazuje 15, a aplikacja pokazuje, że licznik jest zablokowany i jak go odblokować
  - Scenariusz: Gest systemowy (ER-24)
    - Zakładając, że licznik ma wartość 15 i nie jest zablokowany
    - Gdy użytkownik przesuwa palcem od dolnej krawędzi, żeby przejść do innej aplikacji
    - Wtedy licznik nadal pokazuje 15, a historia nie ma nowej zmiany

### BR-LIC-005: Potwierdzenie zmiany bez przerywania dźwięku
- Przepływ: PR-02
- Dowód potrzeby: J-01; użytkownik nie patrzy na ekran (kontekst); „NO sound (that means: listen to your podcast …)” (opis Easy Knitty, S-17)
- Kryteria akceptacji:
  - Scenariusz: Potwierdzenie dotykiem
    - Zakładając, że w tle gra podcast z innej aplikacji
    - Gdy użytkownik dodaje rząd
    - Wtedy telefon potwierdza zmianę wibracją, a podcast gra dalej bez przerwy
  - Scenariusz: Bez dźwięku (ER-36)
    - Zakładając, że licznik ma instrukcję przypomnienia (BR-LIC-009)
    - Gdy użytkownik dodaje rząd, odejmuje rząd albo dostaje przypomnienie
    - Wtedy aplikacja nie odtwarza żadnego dźwięku; sygnałem jest tylko wibracja (P-097 (2a), F-48, S-17)

### BR-LIC-006: Kilka liczników w projekcie
- Przepływ: PR-03
- Dowód potrzeby: J-02; 13 z 14 konkurentów; „Set up several counters to keep track of your increases” (opis My Row Counter, S-17)
- Kryteria akceptacji:
  - Scenariusz: Drugi licznik
    - Zakładając, że projekt ma licznik rzędów z wartością 20
    - Gdy użytkownik dodaje licznik oczek i dodaje w nim 5
    - Wtedy projekt pokazuje licznik rzędów 20 i licznik oczek 5

### BR-LIC-007: Licznik powtórzeń powiązany z rzędami
- Przepływ: PR-03 · Reguła: RD-12
- Dowód potrzeby: J-02; „I wish it had a repeat counter for those pattern where you repeat rows 1-8 several times” (My Row Counter, id14113087501)
- Kryteria akceptacji:
  - Scenariusz: Środek trzeciego powtórzenia
    - Zakładając, że powtórzenie ma 8 rzędów
    - Gdy licznik rzędów osiąga 17
    - Wtedy aplikacja pokazuje powtórzenie 3 i rząd 1 powtórzenia (RD-12-W1)
  - Scenariusz: Koniec powtórzenia
    - Zakładając, że powtórzenie ma 8 rzędów
    - Gdy licznik rzędów osiąga 8
    - Wtedy aplikacja pokazuje powtórzenie 1 i rząd 8 powtórzenia (RD-12-W2)
  - Scenariusz: Błędna długość powtórzenia
    - Zakładając, że użytkownik ustawia powtórzenie
    - Gdy podaje długość 0 rzędów
    - Wtedy aplikacja nie zapisuje ustawienia i prosi o długość co najmniej 1 (RD-12-W5)
  - Scenariusz: Przed pierwszym rzędem (ER-40)
    - Zakładając, że powtórzenie ma 8 rzędów, a licznik rzędów ma 0
    - Gdy użytkownik patrzy na licznik
    - Wtedy aplikacja pokazuje powtórzenie 1 i 0 z 8 rzędów powtórzenia (RD-12-W4)

### BR-LIC-008: Zmiana ustawień licznika w trakcie
- Przepływ: PR-03
- Dowód potrzeby: J-02; „once I start I can’t edit the counter” (knitCompanion, id10629944697)
- Kryteria akceptacji:
  - Scenariusz: Zmiana długości powtórzenia
    - Zakładając, że licznik rzędów ma 17, a powtórzenie 8 rzędów
    - Gdy użytkownik zmienia długość powtórzenia na 10
    - Wtedy licznik rzędów nadal ma 17, a aplikacja pokazuje powtórzenie 2 i rząd 7 powtórzenia

### BR-LIC-009: Przypomnienie „co N rzędów, M razy”
- Przepływ: PR-04 · Reguła: RD-13
- Dowód potrzeby: J-03; przypomnienie przeoczone, bo za mało widoczne (編み物カウンター２, id13310860035); „the reminder needs an audio queue” (My Row Counter, id11943122526)
- Chwila: przypomnienie dotyczy rzędu w robocie (skończone + 1) i jest widoczne, zanim użytkownik zacznie ten rząd, w obu trybach licznika (RD-13; P-161, ER-51)
- Kryteria akceptacji:
  - Scenariusz: Przypomnienie w trakcie serii
    - Zakładając, że instrukcja to: od rzędu 6, co 6 rzędów, 5 razy, a licznik jest w trybie „skończone rzędy”
    - Gdy użytkownik kończy rząd 11 i licznik pokazuje 11
    - Wtedy aplikacja pokazuje przypomnienie dla rzędu 12 z numerem 2 z 5 jako pas zakreślacza pod liczbą, z instrukcją w podpisie przycisku +1 (reszta ekranu licznika bez zmian), i potwierdza je wibracją (RD-13-W1; ZM-09, ER-59)
  - Scenariusz: Ostatnie przypomnienie
    - Zakładając tę samą instrukcję
    - Gdy użytkownik kończy rząd 29
    - Wtedy aplikacja pokazuje przypomnienie dla rzędu 30, 5 z 5 (RD-13-W2, RD-13-W17)
  - Scenariusz: Po zakończeniu serii
    - Zakładając tę samą instrukcję
    - Gdy użytkownik kończy rząd 35
    - Wtedy aplikacja nie pokazuje przypomnienia (RD-13-W3, RD-13-W18)
  - Scenariusz: Wpisanie wartości przez kilka przypomnień (ER-40)
    - Zakładając tę samą instrukcję i licznik 10
    - Gdy użytkownik wpisuje wartość 20
    - Wtedy aplikacja pokazuje jedno przypomnienie, dla rzędu 18, a nie dla 12 (RD-13-W23)
  - Scenariusz: Wpisanie mniejszej wartości (ER-40)
    - Zakładając tę samą instrukcję i licznik 20
    - Gdy użytkownik wpisuje wartość 10
    - Wtedy aplikacja nie pokazuje przypomnienia (RD-13-W8)
  - Scenariusz: Tryb „rząd w trakcie” (ER-51)
    - Zakładając instrukcję: od rzędu 6, co 6 rzędów, 10 razy, tryb „rząd w trakcie” i 47 skończonych rzędów
    - Gdy użytkownik patrzy na licznik
    - Wtedy licznik pokazuje „rząd 48”, a przypomnienie dla rzędu 48 z numerem 8 z 10 jest widoczne — to samo co przy liczniku 47 w trybie „skończone rzędy” (RD-13-W11, RD-13-W12)
  - Scenariusz: Rząd z przypomnieniem skończony (ER-51)
    - Zakładając tę samą instrukcję, tryb „skończone rzędy” i licznik 47 z przypomnieniem dla rzędu 48
    - Gdy użytkownik dodaje rząd i licznik pokazuje 48
    - Wtedy przypomnienie znika i nie ma wibracji (RD-13-W13, RD-13-W20)
  - Scenariusz: Cofnięcie na rząd z przypomnieniem (ER-51)
    - Zakładając tę samą instrukcję i licznik 48 w trybie „skończone rzędy”
    - Gdy użytkownik cofa ostatni rząd i licznik pokazuje 47
    - Wtedy przypomnienie dla rzędu 48 znów jest widoczne, bez wibracji (RD-13-W22; P-161 Q2a)
  - Scenariusz: Przypomnienie dla pierwszego rzędu (ER-51)
    - Zakładając instrukcję: od rzędu 1, co 4 rzędy, 3 razy, i licznik 0
    - Gdy użytkownik zapisuje instrukcję
    - Wtedy przypomnienie dla rzędu 1 z numerem 1 z 3 jest widoczne od razu, bez wibracji (RD-13-W14; P-161 Q3)

### BR-LIC-010: Plan rzędów z instrukcji wzoru
- Przepływ: PR-04 · Reguła: RD-13
- Dowód potrzeby: J-03; luka rynku: nikt nie zamienia instrukcji na plan rzędów (macierz, `odkrywanie.md`); H-06 · zależy od: ZAL-021
- Kryteria akceptacji:
  - Scenariusz: Plan z instrukcji
    - Zakładając, że użytkownik wpisuje: od rzędu 6, co 6 rzędów, 5 razy
    - Gdy zapisuje instrukcję
    - Wtedy widzi listę rzędów 6, 12, 18, 24, 30
  - Scenariusz: Brak rzędu początkowego
    - Zakładając, że użytkownik wpisuje „co 6 rzędów, 5 razy” bez rzędu początkowego
    - Gdy próbuje zapisać
    - Wtedy aplikacja prosi o rząd początkowy i nie zgaduje go (OP-06)

### BR-LIC-011: Cel rzędów i jego osiągnięcie
- Przepływ: PR-02
- Dowód potrzeby: J-11; „if you hit your last row on a counter … can the counter color change” (YarnBuddy, id13666644359); radość z konfetti (編み物カウンター２, id13632559947)
- Kryteria akceptacji:
  - Scenariusz: Osiągnięcie celu
    - Zakładając, że cel części to 40 rzędów, a licznik ma 39
    - Gdy użytkownik dodaje rząd
    - Wtedy aplikacja pokazuje osiągnięcie celu i proponuje przejście do następnej części
  - Scenariusz: Przekroczenie celu
    - Zakładając, że licznik ma 40 przy celu 40
    - Gdy użytkownik dodaje rząd
    - Wtedy licznik pokazuje 41 i oznaczenie „ponad cel”

### BR-LIC-012: Znaczenie liczby na liczniku
- Przepływ: PR-02
- Dowód potrzeby: J-01; prośba o wybór „skończony rząd” albo „rząd w trakcie” (編み物カウンター２, id12699699581)
- Kryteria akceptacji:
  - Scenariusz: Tryb „rząd w trakcie”
    - Zakładając, że użytkownik wybrał tryb „rząd w trakcie” i skończył 12 rzędów
    - Gdy patrzy na licznik
    - Wtedy licznik pokazuje „rząd 13”
  - Scenariusz: Powtórzenie w trybie „rząd w trakcie” (ER-40)
    - Zakładając tryb „rząd w trakcie”, powtórzenie 8 rzędów i 12 skończonych rzędów
    - Gdy użytkownik patrzy na licznik
    - Wtedy licznik pokazuje „rząd 13” oraz powtórzenie 2 i rząd 5 powtórzenia (RD-12-W7)

### BR-LIC-013: Ekran nie gaśnie podczas liczenia
- Przepływ: PR-05
- Dowód potrzeby: J-06; „it stays on so you don’t have to wake up the screen & put your passcode in” (Crochet and Knit Counter, id1843073711)
- Kryteria akceptacji:
  - Scenariusz: Długa sesja
    - Zakładając, że ekran licznika jest otwarty, a opcja jest włączona
    - Gdy mija czas automatycznej blokady telefonu
    - Wtedy ekran nadal pokazuje licznik
  - Scenariusz: Opcja wyłączona
    - Zakładając, że użytkownik wyłączył opcję
    - Gdy mija czas automatycznej blokady
    - Wtedy telefon blokuje ekran jak zwykle

### BR-LIC-014: Liczenie z ekranu blokady
- Przepływ: PR-05
- Dowód potrzeby: J-06; „hate that I have to unlock my phone to use it” (YarnBuddy, id11419908994); licznik na ekranie blokady mają 2 z 14
- Kryteria akceptacji:
  - Scenariusz: Dodanie rzędu bez odblokowania
    - Zakładając, że telefon jest zablokowany, a licznik projektu ma 22
    - Gdy użytkownik dodaje rząd z ekranu blokady
    - Wtedy ekran blokady pokazuje 23, a w aplikacji licznik też ma 23

### BR-LIC-015: Zegarek bez telefonu w ręku
- Przepływ: PR-05
- Dowód potrzeby: J-06; „it keeps telling me to go back to my phone” (My Row Counter, id12428329746); zegarek gubi liczbę (YarnBuddy 17 z 301)
- Kryteria akceptacji:
  - Scenariusz: Liczenie na zegarku
    - Zakładając, że licznik projektu ma 10, a telefon leży w innym pokoju
    - Gdy użytkownik dodaje 3 rzędy na zegarku
    - Wtedy zegarek pokazuje 13, a po powrocie w zasięg telefon też pokazuje 13 (NFR-ZEG-001)
  - Scenariusz: Przypomnienie na zegarku
    - Zakładając instrukcję z BR-LIC-009
    - Gdy na zegarku licznik osiąga 12
    - Wtedy zegarek pokazuje przypomnienie 2 z 5 i wibruje

### BR-LIC-016: Dodanie rzędu głosem
- Przepływ: PR-05
- Dowód potrzeby: J-06; „just speak to it to increment the counter” (opis My Row Counter, S-17); głos ma 3 z 14
- Kryteria akceptacji:
  - Scenariusz: Polecenie głosowe
    - Zakładając, że licznik bieżącego projektu ma 7
    - Gdy użytkownik wypowiada polecenie dodania rzędu przez Siri
    - Wtedy licznik ma 8, a Siri odpowiada nową wartością

### BR-LIC-017: Wpisanie wartości licznika i wyzerowanie
- Przepływ: PR-01, PR-02, PR-13
- Dowód potrzeby: J-01, J-07; „You should be able to enter the number.” (StitchTally, id14375427685); „I wish the edit screen for a project let me directly edit the number of rows completed” (Easy Knitty, id11473397244); przeniesienie trwających robótek z papieru albo innej aplikacji i poprawka bez dziesiątek stuknięć (rola 03, `docs/scope-contract.md` E1: ER-13) · ER-13 · ER-27: „praca” w statystykach (RD-15, P-048 (3)) i „start dnia” w limicie (D4 w P-057, KP-12) to dwa osobne pojęcia (P-059); zerowanie nie woła strażnika limitu i działa także na limicie (P-067 (1a), S-07) · ER-43: liczby wpisuje się w zapisie języka i regionu telefonu: separator tysięcy i dziesiętny oraz cyfry regionu [FAKT S-40], także cyfry ASCII; zapis niezgodny z regionem jest odrzucany z przykładem, bez zgadywania (P-097 (5a), jak Trening `docs/32-wzorce-interakcji.md:68`)
- Kryteria akceptacji:
  - Scenariusz: Przeniesienie trwającej robótki
    - Zakładając, że użytkownik zakłada licznik dla robótki, w której skończył 57 rzędów
    - Gdy wpisuje wartość 57
    - Wtedy licznik pokazuje 57, a następne dodanie rzędu daje 58
  - Scenariusz: Wpisanie w historii z cofnięciem
    - Zakładając, że licznik ma 30
    - Gdy użytkownik wpisuje 35, a potem cofa tę zmianę z historii
    - Wtedy historia pokazuje wpisanie z godziną i wartością przed i po, a licznik po cofnięciu pokazuje 30
  - Scenariusz: Wpisanie nie jest pracą w statystykach
    - Zakładając, że użytkownik wpisał 57 przy przeniesieniu robótki
    - Gdy otwiera dzień i postęp w module DNI
    - Wtedy wpisane 57 rzędów nie są rzędami zrobionymi tego dnia ani nie zmieniają tempa (RD-15)
  - Scenariusz: Wpisanie w nowym dniu zaczyna dzień limitu (ER-27)
    - Zakładając, że użytkownik bez Pro zużył 2 z 5 darmowych dni w miesiącu, a dziś nie dodał ani nie wpisał żadnego rzędu
    - Gdy wpisuje wartość 57 przy przeniesieniu robótki
    - Wtedy licznik pokazuje 57, dziś staje się dniem limitu i zostały 2 z 5 darmowych dni (D4 w P-057, KP-12)
    - Oraz w kalendarzu dziś nie ma znacznika dnia z robótką (BR-DNI-001, RD-15)
  - Scenariusz: Wpisanie w nowym dniu ponad limit (ER-27)
    - Zakładając, że użytkownik bez Pro zużył 5 z 5 darmowych dni, a dziś nie dodał ani nie wpisał żadnego rzędu
    - Gdy wpisuje wartość licznika
    - Wtedy wartość nie zostaje zapisana, a aplikacja pokazuje komunikat na limicie (BR-ZAK-005, L-08)
  - Scenariusz: Zerowanie z potwierdzeniem
    - Zakładając, że licznik ma 42
    - Gdy użytkownik wybiera wyzerowanie
    - Wtedy aplikacja prosi o potwierdzenie, a dopiero po nim licznik pokazuje 0 i historia ma zmianę z 42 na 0, którą można cofnąć
  - Scenariusz: Błędna wartość
    - Zakładając, że licznik ma 42
    - Gdy użytkownik wpisuje wartość ujemną albo tekst
    - Wtedy aplikacja nie zmienia licznika i pokazuje, że wartość musi być liczbą całkowitą od 0
  - Szablon scenariusza: Wpisanie w zapisie regionu (ER-43)
    - Zakładając, że telefon ma język i region <region>
    - Gdy użytkownik wpisuje „<zapis>” jako wartość licznika
    - Wtedy licznik pokazuje <wynik>
    - Przykłady:

      | region | zapis | wynik |
      |---|---|---|
      | pl-PL | 1 000 (spacja albo spacja nierozdzielająca) | 1000 |
      | de-DE | 1.000 | 1000 |
      | en-US | 1,000 | 1000 |
      | ar-EG | ٥٧ (cyfry arabsko-indyjskie) | 57 |
      | ar-EG | 57 (cyfry ASCII) | 57 |
  - Scenariusz: Zapis niezgodny z regionem (ER-43)
    - Zakładając, że telefon ma język i region pl-PL, a licznik ma 42
    - Gdy użytkownik wpisuje „1,000” (w pl-PL przecinek jest separatorem dziesiętnym)
    - Wtedy aplikacja nie zmienia licznika i pokazuje, że wartość musi być liczbą całkowitą od 0, z przykładem zapisu w regionie, bez zgadywania „1000” ani „1”

### BR-LIC-018: Licznik całości zasilany przez sekcje jednego kawałka
- Przepływ: PR-03
- Dowód potrzeby: J-01, J-02; „The individual sections, when you update the row count, should automatically update the global counter.” (My Row Counter, id13712427204); „a row counter feature that allows you to break it down to multiple parts of the pattern, all rolling up to a global counter so you never lose your place” (My Row Counter, id9711911250, strona App Store US, odczyt roli 03 2026-10-22) · ER-16
- Kryteria akceptacji:
  - Scenariusz: Sekcja zasila całość
    - Zakładając, że kawałek „korpus” ma sekcje „ściągacz” z 20 rzędami i „gładki” z 5 rzędami, a licznik całości pokazuje 25
    - Gdy użytkownik dodaje rząd w sekcji „gładki”
    - Wtedy sekcja „gładki” pokazuje 6, a licznik całości 26
  - Scenariusz: Prucie w sekcji
    - Zakładając ten sam stan
    - Gdy użytkownik odejmuje rząd w sekcji „gładki”
    - Wtedy sekcja pokazuje 4, a licznik całości 24
  - Scenariusz: Części osobnych kawałków
    - Zakładając, że projekt „Sweter” ma osobne kawałki przód i rękaw lewy (BR-PRJ-001)
    - Gdy użytkownik dodaje rząd w rękawie
    - Wtedy licznik całości przodu się nie zmienia
  - Scenariusz: Sekcja w koszu (ER-40)
    - Zakładając, że kawałek „korpus” ma sekcje „ściągacz” z 20 rzędami i „gładki” z 5 rzędami
    - Gdy użytkownik usuwa sekcję „gładki” (trafia do „Ostatnio usunięte”, BR-DAN-008)
    - Wtedy licznik całości pokazuje 20, a po przywróceniu sekcji znów 25
  - Scenariusz: Sekcja w konflikcie synchronizacji (ER-40)
    - Zakładając, że sekcja „gładki” ma dwie wersje do wyboru po synchronizacji (BR-DAN-002)
    - Gdy użytkownik otwiera kawałek
    - Wtedy licznik całości pokazuje „—” z odsyłaczem do wyboru wersji, a po wyborze pokazuje sumę sekcji (P-097 (3.3a))

### BR-LIC-019: Strażnik stuknięć z tempa
- Przepływ: PR-02 · Reguła: RD-17
- Dowód potrzeby: J-01; „Sat on phone and added 100 plus rows and now all my stats are stuffed.” (Easy Knitty GB, id8099185238); „if you knocked the screen it added or deleted rows!” (My Row Counter GB, id6489533147); blokada (BR-LIC-004) chroni tylko, gdy użytkownik ją włączy · ER-12 (I-1, P-044)
- Kryteria akceptacji:
  - Scenariusz: Seria przypadkowych dodań
    - Zakładając, że licznik rzędów ma 30
    - Gdy w ciągu 1,6 s dochodzi 5 dodań (RD-17-W1)
    - Wtedy licznik pokazuje 35, a aplikacja pyta „Dodano 5 rzędów w 1,6 s. Cofnąć?”; po wybraniu „Cofnij” licznik pokazuje 30, a historia ma cofniętą serię
  - Scenariusz: Nadrobienie zapomnianego rzędu
    - Zakładając, że licznik rzędów ma 30
    - Gdy użytkownik świadomie dodaje 2 rzędy w 0,5 s (RD-17-W4)
    - Wtedy licznik pokazuje 32 bez pytania
  - Scenariusz: Licznik oczek (ER-24)
    - Zakładając, że projekt ma licznik oczek
    - Gdy użytkownik dodaje 5 oczek w 1,6 s
    - Wtedy aplikacja nie pyta o cofnięcie, bo strażnik działa tylko na licznikach rzędów
  - Scenariusz: Brak nowego elementu na ekranie
    - Zakładając, że nie było serii dodań
    - Gdy użytkownik liczy rzędy
    - Wtedy ekran licznika nie pokazuje nic związanego ze strażnikiem (P-046)
  - Scenariusz: Seria z ekranu blokady po scaleniu (ER-40)
    - Zakładając, że o 21:14 z ekranu blokady doszło 5 rzędów w 4 s, a aplikacja scala je po otwarciu o 22:00
    - Gdy użytkownik otwiera licznik
    - Wtedy aplikacja pyta o tę serię, podając źródło i godzinę („ekran blokady, 21:14”), a nie czas scalenia (RD-17-W8; P-091 (4b))
  - Scenariusz: Wieczór z ekranu blokady bez pytania (ER-40)
    - Zakładając, że z ekranu blokady doszły 3 rzędy co 5 minut, scalone naraz po otwarciu aplikacji
    - Gdy aplikacja je scala
    - Wtedy aplikacja nie pyta o cofnięcie (RD-17-W9)
  - Scenariusz: Cofnięcie serii zwraca dzień limitu (ER-40)
    - Zakładając, że użytkownik bez Pro dziś nie dziergał, a jedyne dodania dnia to seria przypadkowych stuknięć, która zaczęła dzień limitu
    - Gdy wybiera „Cofnij” w pytaniu strażnika
    - Wtedy dodania serii znikają, a ponieważ dziś nie zostało żadne dodanie, dzień limitu wraca (P-091 (7b); wektor L-19 w kontrakcie roli 02, Z07-09)
    - Ale cofnięcie tych samych dodań z historii nie zwraca dnia limitu (L-06)

### BR-LIC-020: Wibracje rozróżniane bez patrzenia
- Przepływ: PR-02, PR-04
- Dowód potrzeby: J-03, J-06; „もっと派手に” przy przeoczonym przypomnieniu (編み物カウンター２, id12476127028); prośba o inny sygnał dla przypomnienia niż dla zwykłego rzędu: „リマインドがある時にも（別の）音が鳴るようにできると、見逃しがより少なくなると思います” (編み物カウンター２, id13310860035); oczy na robótce (kontekst użycia) · ER-12 (I-7, P-044)
- Kryteria akceptacji:
  - Scenariusz: Przypomnienie inne niż rząd
    - Zakładając instrukcję z BR-LIC-009 i licznik 11
    - Gdy użytkownik dodaje rząd do 12, a potem do 13
    - Wtedy przy 12 telefon wibruje wzorem przypomnienia, a przy 13 wzorem zwykłego rzędu, i te wzory się różnią
  - Scenariusz: Koniec powtórzenia i cel dnia
    - Zakładając powtórzenie 8 rzędów i cel dnia 13 rzędów (BR-DNI-005)
    - Gdy licznik kończy powtórzenie albo osiąga cel dnia
    - Wtedy telefon wibruje wzorem przypomnienia, innym niż wzór rzędu; aplikacja ma tylko te dwa wzorce (F-48, ER-36)
  - Scenariusz: Wibracje wyłączone
    - Zakładając, że użytkownik wyłączył wibracje w aplikacji
    - Gdy następuje dowolne z tych zdarzeń
    - Wtedy telefon nie wibruje
