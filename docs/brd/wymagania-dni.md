# Wymagania: dni i postęp (DNI)
Stan: rola 01, tryb fix (2026-10-22) · Moduł z ER-11 i ER-12 (P-043, P-044, P-046, P-047); prefiks `KAL` należy do obliczeń. Przepływy w `wymagania.md`, reguły w `reguly.md`.

Miejsce tych funkcji na ekranach ustala rola 04: na ekranie licznika nic z tego modułu, dopóki użytkownik sam czegoś nie ustawi (P-046); kalendarz, dzień i podsumowanie okresu to jeden widok w zakładce Historia (P-549, ZM-18; wcześniej „w historii albo projekcie, nie osobna zakładka”, P-046), a „Dziś” pokazuje z tego modułu najwyżej zachęty z danych aplikacji, np. pasek tygodnia (P-549; ER-71).

**Dzień z robótką** (P-195 Q3b, ER-55): dzień (RD-16), w którym była praca w rzędach według RD-15 (zmiany +1 i −1 bez cofniętych i bez wpisań) **albo** sesja stopera trwająca co najmniej 1 minutę po korekcie (BR-PRJ-013), liczona w dniu startu sesji (BR-DNI-002, ER-44). Próg 1 minuty wynika z pokazywania czasu w pełnych minutach, nie z wiedzy dziedzinowej. Pojęcie obowiązuje kalendarz (BR-DNI-001), średni czas dnia w RD-18 i „ostatnią pracę” (BR-PRJ-016); dzień limitu (BR-ZAK-005, P-059) się nie zmienia — sesja stopera nie zużywa dnia limitu (P-191 P2a).

### BR-DNI-001: Kalendarz dni z robótką
- Przepływ: PR-16 · Reguła: RD-20
- Dowód potrzeby: J-11; dowód słaby (pochwały istniejącej funkcji, 0 próśb w recenzjach angielskich, P-043): „アクティビティが自動で記録されるのが、後から見返す時に進捗がわかりやすくてありがたいです” (編み物カウンター２, id12699699581); „毎日の編み物の励みになっています。” (編み物カウンター２, id9461069621) · ER-11 (K-1)
- Kryteria akceptacji:
  - Scenariusz: Dzień z robótką
    - Zakładając, że użytkownik 21 października dodał 12 rzędów w projekcie „Skarpeta”, a 20 października nie dziergał
    - Gdy otwiera kalendarz października
    - Wtedy 21 października ma znacznik dnia z robótką, a 20 października go nie ma
  - Scenariusz: Cofnięte i wpisane zmiany
    - Zakładając, że 19 października użytkownik tylko wpisał wartość licznika przy przeniesieniu robótki i cofnął przypadkowe dodania z historii
    - Gdy otwiera kalendarz
    - Wtedy 19 października nie ma znacznika dnia z robótką (RD-15: wpisania i cofnięte zmiany nie są pracą)
  - Scenariusz: Dzień z samym stoperem (ER-55)
    - Zakładając, że 22 października użytkownik dziergał „Szalik” bez liczenia rzędów, a stoper sesji liczył 40 minut
    - Gdy otwiera kalendarz października i wybiera 22 października
    - Wtedy 22 października ma znacznik dnia z robótką, a widok dnia pokazuje „Szalik: 40 min” bez rzędów
    - Oraz w limicie 22 października nie jest dniem limitu (P-059, P-191 P2a)
  - Scenariusz: Stoper włączony przez pomyłkę (ER-55)
    - Zakładając, że 24 października użytkownik włączył stoper i zatrzymał go po 20 sekundach, bez zmian rzędów
    - Gdy otwiera kalendarz października
    - Wtedy 24 października nie ma znacznika dnia z robótką
  - Scenariusz: Dzień z robótką a dzień limitu (ER-27, P-059)
    - Zakładając, że użytkownik bez Pro dziergał 21 października od 23:40 do 00:10 22 października bez przerwy, a 23 października tylko dodał rząd i go cofnął
    - Gdy otwiera kalendarz października
    - Wtedy 21 i 22 października mają znacznik dnia z robótką, a 23 października go nie ma (RD-15, RD-16)
    - Oraz w limicie 21 października to jeden dzień limitu, a 23 października to drugi dzień limitu (BR-ZAK-005, L-04, L-06)
  - Scenariusz: Kolumny kalendarza od poniedziałku (NZ-05-03)
    - Zakładając, że telefon ma region en-US, który w ustawieniach systemu zaczyna tydzień w niedzielę
    - Gdy użytkownik otwiera kalendarz października 2026
    - Wtedy pierwsza kolumna to poniedziałek, a 1 października (czwartek) stoi w czwartej kolumnie (P-110 Q7, RD-20)
  - Scenariusz: Bez serii i ponagleń
    - Zakładając, że użytkownik nie dziergał od 10 dni
    - Gdy otwiera aplikację albo kalendarz
    - Wtedy aplikacja nie pokazuje licznika serii dni ani nie wysyła przypomnienia o niedzierganiu (P-043)

### BR-DNI-002: Dzień: projekty, rzędy i czas
- Przepływ: PR-16
- Dowód potrzeby: J-11; „It would be good to be able to go back to week or day or project. Total time spent per day would be cool” (Easy Knitty CA, id10575864934) · ER-11 (K-2)
- Kryteria akceptacji:
  - Scenariusz: Szczegóły dnia
    - Zakładając, że 21 października użytkownik dodał 12 rzędów w „Skarpecie” i 5 w „Swetrze”, a stoper sesji „Skarpety” liczył 50 minut
    - Gdy wybiera 21 października w kalendarzu
    - Wtedy widzi „Skarpeta: 12 rzędów, 50 min” i „Sweter: 5 rzędów” i może przejść do każdego projektu
  - Scenariusz: Dzień w strefie urządzenia (ER-24)
    - Zakładając, że użytkownik w Nowym Jorku dodał rząd w sobotę 3 czerwca 2023 o 21:30 czasu lokalnego, czyli 4 czerwca o 01:30 UTC (RD-16-W1)
    - Gdy otwiera ten dzień
    - Wtedy rząd jest w sobocie 3 czerwca, nie w niedzieli 4 czerwca
  - Scenariusz: Godzina zmiany w strefie zapisu (ER-44)
    - Zakładając, że użytkownik dodał rząd w Warszawie o 21:30 czasu lokalnego, a potem poleciał do Nowego Jorku
    - Gdy w Nowym Jorku otwiera historię tego dnia
    - Wtedy zmiana jest w dniu z Warszawy z godziną 21:30, czyli w strefie zapisu zmiany (RD-16), a nie przeliczona na czas Nowego Jorku
  - Scenariusz: Sesja stopera przez północ (ER-44)
    - Zakładając, że stoper sesji „Skarpety” działał od 23:30 21 października do 00:20 22 października, a o 00:10 użytkownik dodał rząd
    - Gdy otwiera 21 i 22 października
    - Wtedy całe 50 minut sesji jest w 21 października, dniu startu sesji, a rząd z 00:10 jest w 22 października (P-097 (4a), jak Trening `docs/29-zdrowie-odczyt-spec.md:152`; RD-16)

### BR-DNI-003: Podsumowanie tygodnia i miesiąca
- Przepływ: PR-16 · Reguła: RD-20
- Dowód potrzeby: J-11; „As a data nerd I love all of the counts it gives you.” (My Row Counter, id13787781171); „you also get daily, weekly, monthly, and yearly stats” (My Row Counter, id12140475342); id10575864934 jw. · ER-11 (K-3)
- Kryteria akceptacji:
  - Scenariusz: Tydzień z porównaniem
    - Zakładając, że w tym tygodniu użytkownik zrobił 80 rzędów i 4 godziny ze stopera, a w poprzednim 60 rzędów
    - Gdy otwiera podsumowanie tygodnia
    - Wtedy widzi 80 rzędów, 4 godziny, liczbę ukończonych projektów oraz 60 rzędów w poprzednim tygodniu
    - Oraz tydzień trwa od poniedziałku do niedzieli niezależnie od języka i regionu telefonu, a podsumowanie ma podpis „Tygodnie od poniedziałku” (P-110 Q7, RD-20; NZ-05-03)
  - Scenariusz: Niedziela w regionie z tygodniem od niedzieli (NZ-05-03)
    - Zakładając, że telefon ma region en-US, który w ustawieniach systemu zaczyna tydzień w niedzielę, a użytkownik zrobił 10 rzędów w niedzielę 25 października 2026 i 5 rzędów w poniedziałek 26 października
    - Gdy 26 października otwiera podsumowanie tygodnia
    - Wtedy bieżący tydzień zaczyna się 26 października i pokazuje 5 rzędów, a 10 rzędów z 25 października należy do poprzedniego tygodnia, od 19 października (RD-20-W4, RD-20-W5)
  - Scenariusz: Czas bez stopera
    - Zakładając, że w miesiącu nie było żadnej sesji stopera
    - Gdy użytkownik otwiera podsumowanie miesiąca
    - Wtedy widzi rzędy i ukończone projekty, a w miejscu czasu informację, że czas pochodzi ze stopera sesji, bez wartości 0 godzin

### BR-DNI-004: Postęp projektu w procentach
- Przepływ: PR-16, PR-14 · Reguła: RD-14
- Dowód potrzeby: J-11; „進捗が全体の何%なのか表示されたり” (編み物カウンター２, id13632559947); „進捗率が分かるのでモチベーションも上がり” (編み物カウンター２, id12304022403); prośba o postęp całego projektu, nie licznika (編み物カウンター２, id12060415068) · ER-11 (K-4)
- Kryteria akceptacji:
  - Scenariusz: Postęp z części
    - Zakładając, że części mają cele 100, 100, 60 i 60 rzędów, a zrobiono 100, 40, 0 i 0
    - Gdy użytkownik otwiera projekt
    - Wtedy widzi postęp 43%, oznaczony jako przybliżenie z rzędów (RD-14-W1)
  - Scenariusz: Część ponad cel
    - Zakładając, że pierwsza część ma 120 rzędów przy celu 100, a pozostałe 0
    - Gdy użytkownik otwiera projekt
    - Wtedy widzi 31%, nie więcej (RD-14-W4)
  - Scenariusz: Brak celów
    - Zakładając, że żadna część nie ma celu
    - Gdy użytkownik otwiera projekt
    - Wtedy nie widzi procentu, tylko informację, że postęp wymaga celu rzędów części (RD-14-W6)

### BR-DNI-005: Termin projektu i cel dzienny
- Przepływ: PR-16 · Reguła: RD-15 · zależy od: ZAL-027
- Dowód potrzeby: J-11; termin: „Add a due date reminder for your project.” (opis YarnBuddy, S-17); „track pieces I need to complete, set due dates, and stay organized” (Loopsy, id13818450106); cel dzienny bez bezpośredniego dowodu, wyjątek właściciela P-043 · ER-11 (K-5)
- Kryteria akceptacji:
  - Scenariusz: Cel dnia
    - Zakładając, że cel projektu to 320 rzędów, do wczoraj zrobiono 140, dziś jest 22 października, a termin 4 listopada
    - Gdy użytkownik otwiera projekt
    - Wtedy widzi cel na dziś 13 rzędów (RD-15-W1)
  - Scenariusz: Cel stały w ciągu dnia
    - Zakładając ten sam projekt i 5 rzędów zrobionych dziś
    - Gdy użytkownik otwiera projekt ponownie
    - Wtedy cel na dziś nadal wynosi 13 rzędów, a wykonanie pokazuje 5 z 13
  - Scenariusz: Prucie dziś
    - Zakładając 5 rzędów zrobionych dziś
    - Gdy użytkownik odejmuje 2 rzędy
    - Wtedy wykonanie pokazuje 3 z 13
  - Scenariusz: Aplikacja otwarta przez północ (ER-44)
    - Zakładając ten sam projekt, ekran otwarty 22 października o 23:50 i 13 rzędów zrobionych tego dnia (wykonanie 13 z 13)
    - Gdy mija północ, a użytkownik o 00:05 23 października dodaje rząd albo wraca do aplikacji z tła
    - Wtedy cel na dziś to cel 23 października, 13 rzędów (⌈(320 − 153) / 13⌉), a wykonanie pokazuje 1 z 13 albo 0 z 13 (RD-15, RD-16)
  - Scenariusz: Wczorajsze rzędy scalone po północy (ER-44)
    - Zakładając, że 22 października o 23:40 użytkownik dodał 3 rzędy na zegarku, a telefon scalił je 23 października o 08:00, gdy cel na 23 października był już pokazany
    - Gdy użytkownik otwiera projekt
    - Wtedy 3 rzędy są w 22 października (wykonanie i kalendarz tego dnia), a cel na 23 października się nie zmienia (cel stały w ciągu dnia, P-047)
  - Scenariusz: Po terminie
    - Zakładając, że termin minął, a zostało 20 rzędów
    - Gdy użytkownik otwiera projekt
    - Wtedy nie widzi celu dziennego, tylko „termin minął, zostało 20 rzędów” (RD-15-W4)
  - Scenariusz: Po terminie, nic nie zostało (NZ-RD15)
    - Zakładając, że termin minął 3 dni temu, a wszystkie 320 rzędów celu są zrobione
    - Gdy użytkownik otwiera projekt
    - Wtedy widzi „cel osiągnięty”, a nie „termin minął” (RD-15-W12; P-134 Q1a)
  - Scenariusz: Dokończenie po terminie (NZ-RD15)
    - Zakładając, że termin minął wczoraj, a na początek dnia zostało 20 rzędów
    - Gdy użytkownik dodaje dziś 10 rzędów
    - Wtedy widzi „termin minął, zostało 10 rzędów” (RD-15-W13)
    - Gdy dodaje kolejne 10 rzędów
    - Wtedy od razu widzi „cel osiągnięty” (RD-15-W14)
  - Scenariusz: Prucie po terminie (NZ-RD15)
    - Zakładając, że termin minął, a zostało 20 rzędów
    - Gdy użytkownik odejmuje 5 rzędów
    - Wtedy widzi „termin minął, zostało 25 rzędów” (RD-15-W15)
  - Scenariusz: Bez terminu nic na ekranie licznika
    - Zakładając, że projekt nie ma terminu
    - Gdy użytkownik liczy rzędy
    - Wtedy ekran licznika nie pokazuje celu dziennego ani elementów kalendarza (P-046)

### BR-DNI-006: Który projekt dziś: kolejność według terminu
- Przepływ: PR-16 · Reguła: RD-15
- Dowód potrzeby: J-11, J-02; „進捗を参照して隙間時間をどう使うか配分したい” (編み物カウンター２, id12060415068); kilka projektów naraz (P-2) · ER-12 (I-3, P-044); jako kolejność listy projektów, nie osobny ekran (P-046) · ER-36: kolejność według P-048 (4): najpierw projekty po terminie, potem z terminem według celu na dziś malejąco, na końcu bez terminu według ostatniej pracy (BR-PRJ-012)
- Kryteria akceptacji:
  - Scenariusz: Projekty z terminem na górze
    - Zakładając, że „Czapka” ma cel na dziś 20 rzędów, „Szal” 8 rzędów, a „Sweter” nie ma terminu
    - Gdy użytkownik otwiera listę projektów w toku
    - Wtedy kolejność to „Czapka”, „Szal”, „Sweter” (z terminem według celu na dziś malejąco, P-048 (4)), a przy projektach z terminem widać cel na dziś
  - Scenariusz: Termin minął
    - Zakładając, że termin „Szala” minął, a zostało 10 rzędów
    - Gdy użytkownik otwiera listę
    - Wtedy „Szal” stoi na górze z informacją „termin minął, zostało 10 rzędów” (RD-15-W4)
  - Scenariusz: Po terminie, ale wszystko zrobione (NZ-RD15)
    - Zakładając, że termin „Szala” minął, a wszystkie rzędy celu są zrobione, „Czapka” ma cel na dziś 20 rzędów, a „Sweter” nie ma terminu
    - Gdy użytkownik otwiera listę
    - Wtedy „Szal” nie stoi w grupie po terminie: ma „cel osiągnięty” (cel na dziś 0, RD-15-W12) i stoi za „Czapką”, przed „Swetrem” (P-048 (4), P-134 Q1a)
  - Scenariusz: Bez terminów
    - Zakładając, że żaden projekt nie ma terminu
    - Gdy użytkownik otwiera listę
    - Wtedy kolejność jest według ostatniej pracy (BR-PRJ-012)

### BR-DNI-007: Zdążę? przed startem projektu
- Status w zakresie: PÓŹNIEJ (P-046; powrót w wersji 1.1, gdy użytkownicy mają ukończone projekty z historią tempa); wymaganie zostaje na liście, cięcie należy do roli 03
- Przepływ: PR-16 · Reguła: RD-18
- Dowód potrzeby: J-11; termin projektu (BR-DNI-005); szacunek tylko w trakcie u CozyKnit (opis, S-17) · ER-12 (I-4, P-044)
- Kryteria akceptacji:
  - Scenariusz: Szacunek z historii
    - Zakładając ukończone projekty: 600 rzędów w 20 godzin, średnio 1 godzina dziennie, a nowy projekt ma 320 rzędów
    - Gdy użytkownik pyta „zdążę?” przy ustawianiu terminu
    - Wtedy widzi około 10,7 godziny i 11 dni, oznaczone jako szacunek z własnego tempa (RD-18-W1)
  - Scenariusz: Pierwszy projekt
    - Zakładając, że użytkownik nie ma ukończonych projektów ze stoperem
    - Gdy pyta „zdążę?”
    - Wtedy aplikacja pokazuje, że szacunek będzie po pierwszym ukończonym projekcie ze stoperem, bez liczby (RD-18-W3)
