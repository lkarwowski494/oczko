# Wymagania: zapas (ZAP), obliczenia (KAL), słownik (SLO)
Stan: STOP E3 · Aktualizacja: 2026-10-21 · Przepływy w `wymagania.md`; reguły w `reguly.md`.

Zasada obliczeń (RYZ-04): każdy wynik pokazuje dane wejściowe, jednostki i założenia oraz informację, że tabele CYC to wytyczne [FAKT S-19]. Wyniki oczek są niezaokrąglone, dopóki OP-02 nie jest rozstrzygnięte. Dotyczy to wartości w obliczeniach: podgląd kalkulatora próbki pokazuje liczbę wyliczoną z najwyżej jednym miejscem po przecinku (najbliższa dziesiąta, połowa w górę), a każde dalsze obliczenie bierze wartość pełną (DEC-34 a, P-438, P-446; ER-62); to sposób wyświetlania, nie zaokrąglanie do całości z OP-02.

## Zapas (ZAP)
### BR-ZAP-001: Włóczka w zapasie
- Przepływ: PR-10 · Reguła: RD-03, RD-10
- Dowód potrzeby: J-08; „Add yarn details such as purchase location, fiber type, weight, gauge, care instructions” (opis YarnBuddy, S-17); metry i gramy (soczewka zaawansowana, Knitandnote id10901641452)
- Kryteria akceptacji:
  - Scenariusz: Dodanie włóczki z etykiety w jardach
    - Zakładając, że etykieta podaje 437 yd
    - Gdy użytkownik zapisuje włóczkę
    - Wtedy zapas pokazuje 437 yd i 399,59 m (RD-03-W1)
  - Scenariusz: Pielęgnacja
    - Zakładając, że etykieta ma symbole pielęgnacji
    - Gdy użytkownik zapisuje pielęgnację
    - Wtedy aplikacja przechowuje opis tekstem albo zdjęcie etykiety i nie rysuje symboli (OG-13, OP-11)

### BR-ZAP-002: Zużycie z projektu odjęte z zapasu
- Przepływ: PR-10
- Dowód potrzeby: J-08; „When you update yarn used in a project, it automatically updates your stash too” (opis CozyKnit, S-17); prośba w YarnBuddy (id13993192426, soczewka zaawansowana)
- Kryteria akceptacji:
  - Scenariusz: Zakończenie projektu
    - Zakładając, że w zapasie jest 5 motków, a projekt zużył 3
    - Gdy użytkownik kończy projekt i potwierdza zużycie
    - Wtedy zapas pokazuje 2 motki

### BR-ZAP-003: Narzędzia w milimetrach
- Przepływ: PR-10 · Reguła: RD-11, RD-19
- Dowód potrzeby: J-08; „Tool stash for keeping track of your hooks, needles” (opis YarnBuddy, S-17); mm jako klucz [FAKT S-18]
- Kryteria akceptacji:
  - Scenariusz: Drut 3,25 mm
    - Zakładając, że użytkownik dodaje drut 3,25 mm
    - Gdy zapisuje
    - Wtedy lista pokazuje „3,25 mm (US 3)” (RD-11-W2)
  - Scenariusz: Szydełko 5 mm (ER-32)
    - Zakładając, że użytkownik dodaje szydełko 5 mm
    - Gdy zapisuje
    - Wtedy lista pokazuje „5 mm (US H-8)” (RD-19-W1)
  - Scenariusz: Szydełko bez oznaczenia US (ER-32)
    - Zakładając, że użytkownik dodaje szydełko 2,5 mm
    - Gdy zapisuje
    - Wtedy lista pokazuje „2,5 mm” bez oznaczenia US (RD-19-W4)

### BR-ZAP-004: Wyszukiwanie w zapasie
- Przepływ: PR-10
- Dowód potrzeby: J-08; „filter yarns in your stash by different things, such as colour family, yarn weight, storage space” (YarnBuddy GB, id11026147292)
- Kryteria akceptacji:
  - Scenariusz: Filtr grubości
    - Zakładając, że zapas ma włóczki kategorii 3 i 4
    - Gdy użytkownik filtruje kategorię 4
    - Wtedy widzi tylko włóczki kategorii 4
  - Scenariusz: W sklepie bez zasięgu
    - Zakładając, że telefon nie ma sieci
    - Gdy użytkownik przegląda zapas
    - Wtedy widzi cały zapas ze zdjęciami

## Obliczenia (KAL)
### BR-KAL-001: Liczba oczek z próbki
- Przepływ: PR-11 · Reguła: RD-01
- Dowód potrzeby: J-09; kalkulatory u 8 z 14; ułamkowa próbka (StashBot CA, id1176543796) · ER-43: zapis liczb według języka i regionu telefonu [FAKT S-40] (P-097 (5a))
- Kryteria akceptacji:
  - Scenariusz: Typowa próbka
    - Zakładając, że próbka to 22 o./10 cm
    - Gdy użytkownik podaje szerokość 50 cm
    - Wtedy wynik to 110 oczek wraz z danymi wejściowymi (RD-01-W1)
  - Scenariusz: Brak próbki
    - Zakładając, że pole próbki jest puste
    - Gdy użytkownik podaje szerokość 50 cm
    - Wtedy aplikacja prosi o próbkę i nie pokazuje wyniku (RD-01-W5)
  - Scenariusz: Szerokość zero
    - Zakładając, że próbka to 22 o./10 cm
    - Gdy użytkownik podaje szerokość 0 cm
    - Wtedy aplikacja pokazuje błąd danych (RD-01-W2)
  - Szablon scenariusza: Ułamkowa próbka w zapisie regionu (ER-43)
    - Zakładając, że telefon ma język i region <region>, a szerokość to 50 cm
    - Gdy użytkownik wpisuje próbkę „<zapis>” o./10 cm
    - Wtedy wynik to 107,5 oczka (rachunek RD-01: 50 × 21,5 / 10), pokazany w zapisie regionu
    - Przykłady:

      | region | zapis |
      |---|---|
      | pl-PL | 21,5 |
      | de-DE | 21,5 |
      | fr-FR | 21,5 |
      | en-US | 21.5 |
      | ar-EG | ٢١٫٥ |
  - Scenariusz: Separator dziesiętny innego regionu (ER-43)
    - Zakładając, że telefon ma język i region de-DE
    - Gdy użytkownik wpisuje próbkę „21.5” (w de-DE kropka jest separatorem tysięcy)
    - Wtedy aplikacja nie liczy wyniku i pokazuje przykład zapisu „21,5”, bez zgadywania [FAKT S-40]

### BR-KAL-002: Przeliczenie wzoru na własną próbkę
- Przepływ: PR-11 · Reguła: RD-02
- Dowód potrzeby: J-09; obszar 5 `docs/pomysl.md`; dowód w recenzjach słaby (H-05)
- Kryteria akceptacji:
  - Scenariusz: Gęstsza próbka
    - Zakładając, że wzór ma 100 oczek przy 20 o./10 cm
    - Gdy użytkownik podaje własną próbkę 22 o./10 cm
    - Wtedy wynik to 110 oczek (RD-02-W1)
  - Scenariusz: Próbka wzoru zero
    - Zakładając, że próbka wzoru to 0
    - Gdy użytkownik liczy
    - Wtedy aplikacja pokazuje błąd danych (RD-02-W6)

### BR-KAL-003: Jednostki i próbka w calach
- Przepływ: PR-11 · Reguła: RD-03, RD-04
- Dowód potrzeby: J-09; „Please add centimeter conversion” (YarnBuddy, id11586030925); błąd 1,6% w źródłach (RD-04) · przełącznik jednostek: P-075 (4a) (domyślnie z systemu, przełącznik w Ustawieniach), ZM-02, ADR-0017 (`auto` z systemu miar: us i uk → imperialne; dane zapisane w mm, m, g) · ER-45
- Kryteria akceptacji:
  - Scenariusz: Próbka amerykańska
    - Zakładając, że wzór podaje 20 o. na 4 in
    - Gdy użytkownik przelicza na 10 cm
    - Wtedy wynik to 19,7 o./10 cm (wartość pełna 19,685… z RD-04-W1 pokazana z jednym miejscem po przecinku; ER-62), obok jest informacja, że wzory często zrównują 4 in z 10 cm (P-081 P3a; ER-35), a po wpisaniu szerokości 100 cm liczba oczek to 196,9, liczona z wartości pełnej (rachunek RD-01: 100 × 19,685… / 10 = 196,85… → 196,9), nie 197 z wartości pokazanej 19,7
  - Scenariusz: Masa
    - Zakładając, że etykieta podaje 3,5 oz
    - Gdy użytkownik przelicza na gramy
    - Wtedy wynik to 99,22 g (RD-03-W3)
  - Scenariusz: Próbka w calach z przecinkiem (ER-43)
    - Zakładając, że telefon ma język i region pl-PL, a wzór podaje 20,5 o. na 4 in
    - Gdy użytkownik wpisuje „20,5” i przelicza na 10 cm
    - Wtedy wynik to 20,2 o./10 cm (rachunek RD-04: 20,5 × 10 / 10,16 = 20,177…, pokazany z jednym miejscem po przecinku; ER-62)
  - Scenariusz: Jednostki domyślnie z systemu (ER-45)
    - Zakładając, że w Ustawieniach aplikacji jednostki mają wartość „jak w systemie” (stan po instalacji)
    - Gdy użytkownik z regionem en-US (system miar US) otwiera obliczenia, a potem użytkownik z regionem pl-PL (system metryczny) robi to samo
    - Wtedy pierwszy widzi długości w calach i jardach, a masę w uncjach, a drugi w centymetrach, metrach i gramach, bez pytania o jednostki przy pierwszym użyciu
  - Scenariusz: Region brytyjski (ER-45)
    - Zakładając, że telefon ma region en-GB (system miar UK), a jednostki mają wartość „jak w systemie”
    - Gdy użytkownik otwiera obliczenia
    - Wtedy długości i masa są w jednostkach imperialnych, jak dla en-US (ADR-0017)
  - Scenariusz: Przełącznik jednostek nie zmienia danych (ER-45)
    - Zakładając, że telefon ma region pl-PL, a w zapasie jest włóczka zapisana jako 437 yd z etykiety, czyli 399,5928 m (RD-03-W1)
    - Gdy użytkownik wybiera w Ustawieniach jednostki imperialne, a potem znowu metryczne
    - Wtedy przy imperialnych widzi 437 yd, a po powrocie tę samą długość w metrach co przed przełączeniem, także po wielu przełączeniach, bo zapisana długość (399,5928 m) się nie zmienia
    - Oraz rozmiary drutów i szydełek zostają w milimetrach przy obu ustawieniach (BR-ZAP-003)

### BR-KAL-004: Równomierne dodawanie i ujmowanie
- Przepływ: PR-11 · Reguła: RD-05, RD-06
- Dowód potrzeby: J-09; obszar 5 `docs/pomysl.md`; kalkulator dodawania i ujmowania (opis Knitandnote, S-17)
- Kryteria akceptacji:
  - Scenariusz: Dodanie 8 oczek na 100
    - Zakładając okrążenie 100 oczek
    - Gdy użytkownik chce dodać 8 oczek
    - Wtedy aplikacja pokazuje 4 odcinki po 13 oczek i 4 odcinki po 12 oczek, każdy zakończony przyrostem (RD-05-W1)
  - Scenariusz: Za dużo ujmowania
    - Zakładając okrążenie 100 oczek
    - Gdy użytkownik chce ująć 51 oczek
    - Wtedy aplikacja pokazuje, że można ująć najwyżej 50 (RD-06-W3)
  - Scenariusz: Rząd płaski
    - Zakładając, że użytkownik pracuje w rzędach, nie w okrążeniu
    - Gdy chce równomiernie dodać oczka
    - Wtedy aplikacja informuje, że obliczenie dla rzędu płaskiego nie jest dostępne (OP-04)

### BR-KAL-005: Zużycie włóczki z wagi próbki
- Przepływ: PR-11 · Reguła: RD-07
- Dowód potrzeby: J-08, J-09; „suggested yardage does not take into account the weight of the yarn” (StashBot, id12287394403, soczewka zaawansowana)
- Kryteria akceptacji:
  - Scenariusz: Typowy projekt
    - Zakładając próbkę 6 g na 225 cm², projekt 6000 cm², zapas 10% wybrany przez użytkownika i motek 50 g
    - Gdy użytkownik liczy zużycie
    - Wtedy wynik to 160 g bez zapasu i 4 motki, z informacją o założeniu stałej gęstości (RD-07-W1)
  - Scenariusz: Próg motka
    - Zakładając, że zużycie bez zapasu wynosi dokładnie 150 g, a zapas 0%
    - Gdy użytkownik liczy motki po 50 g
    - Wtedy wynik to 3 motki (RD-07-W2)
  - Scenariusz: Zapas niewybrany
    - Zakładając, że użytkownik nie wybrał zapasu
    - Gdy liczy zużycie
    - Wtedy aplikacja prosi o wybór zapasu i nie podstawia wartości domyślnej (OP-05)

### BR-KAL-006: Długość po blokowaniu
- Przepływ: PR-11 · Reguła: RD-08
- Dowód potrzeby: J-09; obszar 5 `docs/pomysl.md` („zmiana wymiarów po blokowaniu”); dzianina rośnie po praniu [FAKT S-26]
- Kryteria akceptacji:
  - Scenariusz: Próbka skraca się po blokowaniu
    - Zakładając próbkę 24 rz./10 cm przed i 22 rz./10 cm po blokowaniu
    - Gdy użytkownik chce 35 cm po blokowaniu
    - Wtedy wynik to 77 rzędów i 32,08 cm na drutach (RD-08-W1)

### BR-KAL-007: Luz w obwodzie
- Przepływ: PR-11 · Reguła: RD-09
- Dowód potrzeby: J-09; obszar 5 `docs/pomysl.md` („rozmiar i luz odzieży”); tabela CYC [FAKT S-23]
- Kryteria akceptacji:
  - Scenariusz: Luz klasyczny
    - Zakładając obwód klatki 91,5 cm
    - Gdy użytkownik podaje obwód gotowego swetra 99 cm
    - Wtedy aplikacja pokazuje luz 7,5 cm i kategorię „klasyczny” według tabeli CYC (RD-09-W1)
  - Scenariusz: Styk kategorii
    - Zakładając obwód klatki 90 cm
    - Gdy użytkownik podaje 100 cm
    - Wtedy aplikacja pokazuje obie kategorie „klasyczny” i „luźny” (RD-09-W4)

### BR-KAL-008: Grubość włóczki z próbki
- Przepływ: PR-11 · Reguła: RD-10
- Dowód potrzeby: J-08, J-09; „I have medium and light yarns (3, 4) that are 4 ply. Which to use?” (YarnPal, id14529076820, soczewka początkująca) · ekran „Źródła wiedzy” i linia źródła przy tabelach CYC: P-085, P-108 (1)–(4), P-112 (1)–(3), OG-12 (CYC prosi o linię ze źródłem, S-24), ZM-04 · ER-45
- Kryteria akceptacji:
  - Scenariusz: Zakres wspólny
    - Zakładając próbkę 23 o. na 4 in
    - Gdy użytkownik sprawdza kategorię
    - Wtedy aplikacja pokazuje kategorie 2 i 3 oraz informację, że kategoria nie oznacza zamienności i trzeba zrobić próbkę [FAKT S-20] (RD-10-W2)
  - Scenariusz: Ekran „Źródła wiedzy” (ER-45, ER-64)
    - Zakładając, że aplikacja jest otwarta, także bez sieci
    - Gdy użytkownik otwiera w Ustawieniach „Źródła wiedzy”
    - Wtedy widzi jedno ogólne zdanie, że treści opracowano na podstawie norm branżowych i wskazówek organizacji rękodzielniczych (P-108 (4), P-304 (2)), oraz linię źródła wymaganą warunkami użycia CYC „Source: Craft Yarn Council's www.YarnStandards.com” (S-24, P-112 (2))
    - Ale nie widzi listy książek, autorów, producentów, adresów stron ani cytatów (P-108 (1), (2), P-112 (2))
  - Scenariusz: Linia źródła przy tabeli CYC (ER-45)
    - Zakładając, że aplikacja pokazuje tabelę opartą na standardach CYC: kategorie grubości włóczki, rozmiary drutów albo szydełek
    - Gdy użytkownik ogląda tę tabelę
    - Wtedy przy tabeli jest ta sama linia źródła CYC (P-112 (1)), a w tekstach obok tabeli nie ma innych nazw źródeł, autorów ani norm (P-085)

## Słownik (SLO)
### BR-SLO-001: Skróty z jawnym systemem terminologii
- Przepływ: PR-12
- Dowód potrzeby: J-10; RYZ-03; „Started the same project about 6 times before realising why it was going wrong” (YarnPal GB, id13435430165)
- Kryteria akceptacji:
  - Scenariusz: Wzór brytyjski
    - Zakładając, że użytkownik wybrał system UK
    - Gdy wyszukuje skrót „dc”
    - Wtedy widzi znaczenie w systemie UK i odpowiednik w systemie US
  - Scenariusz: System niewybrany
    - Zakładając, że użytkownik nie wybrał systemu
    - Gdy wyszukuje skrót „dc”
    - Wtedy widzi oba znaczenia z oznaczeniem systemu i prośbę o sprawdzenie, w jakim systemie jest wzór

### BR-SLO-002: Słownik bez sieci w języku użytkownika
- Przepływ: PR-12
- Dowód potrzeby: J-10; NFR-OFF-001; 35 lokalizacji (D-026) · zależy od: OP-12
- Kryteria akceptacji:
  - Scenariusz: Bez sieci
    - Zakładając, że telefon jest w trybie samolotowym
    - Gdy użytkownik wyszukuje skrót
    - Wtedy widzi jego znaczenie
