# Wymagania: dane (DAN) i zakup (ZAK)
Stan: STOP E3 · Aktualizacja: 2026-10-21 · Przepływy w `wymagania.md`. Zasady: P-021 (baza na urządzeniu, opcjonalnie iCloud), ZP-03, ZP-09.

## Dane (DAN)
### BR-DAN-001: Baza na urządzeniu jest źródłem prawdy
- Przepływ: PR-02, PR-08
- Dowód potrzeby: J-07; CloudKit wymaga sieci (OG-09); „Went camping with my project just to find out that it doesn’t work without WiFi, so I didn’t know what row I was on” (Crochet row & stitch counter, id12528635347, soczewka konkurencji)
- Kryteria akceptacji:
  - Scenariusz: Brak sieci
    - Zakładając, że telefon jest w trybie samolotowym
    - Gdy użytkownik otwiera projekt i dodaje 5 rzędów
    - Wtedy licznik pokazuje nowe wartości, a po wymuszonym zamknięciu aplikacji wartości są te same (NFR-DAN-002)

### BR-DAN-002: Opcjonalna synchronizacja przez iCloud
- Przepływ: PR-08
- Dowód potrzeby: J-07; „would love for all my devices to sync” (My Row Counter CA, id3172873446); P-021
- Kryteria akceptacji:
  - Scenariusz: Drugie urządzenie
    - Zakładając, że synchronizacja jest włączona na iPhonie i iPadzie
    - Gdy użytkownik dodaje rząd na iPhonie przy dostępnej sieci
    - Wtedy iPad pokazuje tę samą wartość licznika
  - Scenariusz: Konflikt
    - Zakładając, że bez sieci iPhone ustawił licznik na 20, a iPad na 18
    - Gdy oba urządzenia się zsynchronizują
    - Wtedy aplikacja pokazuje obie wartości z urządzeniem i godziną zmiany i nie wybiera żadnej po cichu (NFR-DAN-003)
  - Scenariusz: Synchronizacja wyłączona
    - Zakładając, że użytkownik nie włączył synchronizacji
    - Gdy korzysta z aplikacji
    - Wtedy aplikacja nie wysyła danych poza urządzenie

### BR-DAN-003: Dane przetrwają aktualizację
- Przepływ: PR-08
- Dowód potrzeby: J-07; „ALL of the started projects I had, close to 20 are just GONE” (knitCompanion, id9354492354); utrata po aktualizacji (Strikketeller, id14009367992)
- Kryteria akceptacji:
  - Scenariusz: Nowa wersja
    - Zakładając, że użytkownik ma 12 projektów, historię liczników i zapas włóczki
    - Gdy instaluje nową wersję aplikacji ze zmianą schematu bazy
    - Wtedy ma te same 12 projektów, historię i zapas (NFR-DAN-001)
  - Scenariusz: Nieudana migracja
    - Zakładając, że migracja bazy nie powiodła się
    - Gdy aplikacja się uruchamia
    - Wtedy dane sprzed migracji są nienaruszone, a aplikacja pokazuje komunikat o błędzie zamiast pustej listy

### BR-DAN-004: Dane na nowym telefonie
- Przepływ: PR-08
- Dowód potrzeby: J-07; „I got a new iPhone … This app wants $10 just to see my patterns on my new phone” (My Row Counter, id10843107781); kopia iCloud obejmuje dane aplikacji (OG-10)
- Kryteria akceptacji:
  - Scenariusz: Odtworzenie z kopii urządzenia
    - Zakładając, że stary telefon miał kopię iCloud z danymi Oczka
    - Gdy użytkownik odtwarza nowy telefon z tej kopii i otwiera Oczko
    - Wtedy widzi wszystkie projekty z wartościami liczników bez dodatkowej opłaty

### BR-DAN-005: Eksport wszystkich danych
- Przepływ: PR-08
- Dowód potrzeby: J-07; „unable to export anything, which was a huge part of why I subscribed” (YarnBuddy, id10700489878); eksport ma 3 z 14 · zależy od: ZAL-018
- Kryteria akceptacji:
  - Scenariusz: Pełny eksport
    - Zakładając, że użytkownik ma projekty, wzory, zdjęcia i zapas
    - Gdy wybiera eksport
    - Wtedy dostaje plik w aplikacji Pliki, który zawiera wszystkie projekty, liczniki z historią, notatki, zapas, wzory i zdjęcia
  - Scenariusz: Bez Pro, na limicie
    - Zakładając, że użytkownik nie ma Pro i zużył 5 z 5 darmowych dni limitu (L-07, KP-02; ER-26)
    - Gdy wybiera eksport
    - Wtedy eksport działa tak samo

### BR-DAN-006: Import własnego eksportu
- Przepływ: PR-08
- Dowód potrzeby: J-07; przeniesienie bez synchronizacji (P-020 jako wariant, P-021)
- Kryteria akceptacji:
  - Scenariusz: Pełny obieg
    - Zakładając, że użytkownik ma plik eksportu z BR-DAN-005
    - Gdy importuje go na czystej instalacji
    - Wtedy ma te same projekty, wartości liczników, historię, notatki, zapas, wzory i zdjęcia
  - Scenariusz: Plik z innej aplikacji
    - Zakładając, że plik nie jest eksportem Oczka
    - Gdy użytkownik próbuje go zaimportować
    - Wtedy aplikacja pokazuje, że nie rozpoznaje pliku, i nie zmienia istniejących danych
  - Scenariusz: Zastąpienie danych na niepustej bazie (ER-22)
    - Zakładając, że w aplikacji są projekty, a użytkownik importuje plik eksportu
    - Gdy wybiera „zastąp”
    - Wtedy aplikacja najpierw zapisuje plik kopii obecnych danych i pokazuje, gdzie on jest, a dopiero potem zastępuje dane zawartością pliku (P-047)
  - Scenariusz: Scalenie bez nadpisania (ER-22, ER-42)
    - Zakładając, że w aplikacji jest projekt „Skarpeta” z licznikiem 40, a plik to wcześniejszy eksport z tego samego urządzenia: ten sam projekt (ten sam identyfikator) z licznikiem 25 oraz projekt „Czapka”
    - Gdy użytkownik wybiera „scal”
    - Wtedy aplikacja ma „Czapkę” i jedną „Skarpetę” z licznikiem 40: zmiany z pliku, które już są w aplikacji, nie dublują się, a nic nie zostaje nadpisane (P-091 (6a), ADR-0004)
  - Scenariusz: Rozbieżne zmiany tego samego projektu (ER-42)
    - Zakładając, że ten sam projekt „Skarpeta” był liczony dalej na dwóch urządzeniach: w aplikacji do 40, w pliku do 37 po innej ścieżce zmian
    - Gdy użytkownik wybiera „scal”
    - Wtedy aplikacja pokazuje konflikt licznika „Skarpety” z obiema wartościami do wyboru, tak jak przy synchronizacji (BR-DAN-002, „Konflikt”), i do wyboru nie zmienia żadnej z nich
  - Scenariusz: Ten sam plik drugi raz (ER-42)
    - Zakładając, że użytkownik zaimportował już plik przez „scal”
    - Gdy importuje ten sam plik ponownie i wybiera „scal”
    - Wtedy dane w aplikacji się nie zmieniają (P-091 (6a))
  - Scenariusz: Rezygnacja z importu (ER-22)
    - Zakładając, że w aplikacji są projekty
    - Gdy użytkownik otwiera plik eksportu i rezygnuje przy wyborze „zastąp” albo „scal”
    - Wtedy dane w aplikacji się nie zmieniają
  - Scenariusz: Bez oferty po przywróceniu własnej kopii (ER-46)
    - Zakładając, że użytkownik bez Pro importuje własny plik eksportu Oczka i import się udaje
    - Gdy aplikacja kończy import
    - Wtedy pokazuje wynik importu bez karty planów Pro ani innej oferty, bo to odzyskanie własnych danych, nie przenosiny z innej aplikacji (P-113 (Q2a), jak Trening)

### BR-DAN-007: Import od konkurencji
- Przepływ: PR-13
- Dowód potrzeby: H-08; arkusz zapasu z Ravelry (OG-08); odchodzenie płacących z YarnBuddy (id13993192426) · zależy od: ZAL-023 · karta planów Pro po imporcie: P-089 (3b), P-113 (Q2a) (jak Trening: karta po przenosinach z innej aplikacji) · ER-46
- Kryteria akceptacji:
  - Scenariusz: Zapas z Ravelry
    - Zakładając, że użytkownik pobrał arkusz zapasu z Ravelry
    - Gdy importuje go do Oczka
    - Wtedy każda włóczka z arkusza jest w zapasie, a aplikacja pokazuje, ile pozycji zaimportowała i których kolumn nie rozpoznała
  - Scenariusz: Karta planów Pro po imporcie z innej aplikacji (ER-46)
    - Zakładając, że użytkownik bez Pro (sklep potwierdził brak Pro) importuje plik z innej aplikacji, a import dodał co najmniej jedną nową pozycję
    - Gdy aplikacja pokazuje wynik importu
    - Wtedy pod wynikiem widzi kartę z jednym zdaniem (zaimportowane dane są zawsze dostępne, także bez sieci; wersja darmowa ma darmowe dni z robótką; Pro zdejmuje limit, także zakupem jednorazowym) i odnośnikiem „Zobacz plany Pro ›” do ekranu zakupu, bez kwot (P-089 (3b), P-113 (Q2a))
    - Ale karty nie ma, gdy import nie dodał żadnej nowej pozycji, gdy użytkownik ma Pro albo gdy stan Pro jest niepewny, a karta znika po wyborze kolejnego pliku

### BR-DAN-008: Usunięcie z możliwością przywrócenia
- Przepływ: PR-07
- Dowód potrzeby: J-07; „if you archive a project you cannot get it back” (Easy Knitty GB, id8099185238); przypadkowe usunięcie (Easy Knitty CA, id11235965435); usunięcie licznika jednym stuknięciem: „「削除」を間違えて押すと一瞬で消えるのが大変困ります” (編み物カウンター２, id10497670066, ER-22)
- Kryteria akceptacji:
  - Scenariusz: Przywrócenie
    - Zakładając, że użytkownik usunął projekt
    - Gdy po 29 dniach wybiera przywrócenie (P-026)
    - Wtedy projekt wraca ze wszystkimi danymi
  - Scenariusz: Okres przechowywania
    - Zakładając, że minęło 30 dni od usunięcia (P-026)
    - Gdy użytkownik szuka usuniętego projektu
    - Wtedy projektu nie ma, a aplikacja informowała o terminie przy usuwaniu
  - Scenariusz: Usunięty licznik (ER-22)
    - Zakładając, że użytkownik przez pomyłkę usunął licznik oczek z wartością 18 w projekcie „Sweter”
    - Gdy w ciągu 30 dni wybiera przywrócenie (P-047, jak P-026)
    - Wtedy licznik wraca do projektu z wartością 18 i historią
  - Scenariusz: Usunięta część (ER-22)
    - Zakładając, że użytkownik usunął część „rękaw lewy” z licznikami
    - Gdy w ciągu 30 dni wybiera przywrócenie
    - Wtedy część wraca z licznikami, wartościami i historią

### BR-DAN-009: Usunięcie wszystkich danych
- Przepływ: PR-08
- Dowód potrzeby: ZP-03; prywatność (OG-04)
- Kryteria akceptacji:
  - Scenariusz: Usunięcie na żądanie
    - Zakładając, że użytkownik ma dane na urządzeniu i w iCloud
    - Gdy potwierdza usunięcie wszystkich danych
    - Wtedy aplikacja nie ma żadnych projektów, a dane Oczka w iCloud użytkownika są usunięte

### BR-DAN-010: Zgłoś problem z diagnostyką lokalną
- Przepływ: PR-15
- Dowód potrzeby: J-07; „I don’t know where else to report bugs.” (YarnBuddy, id8151431159); „No email link posted just a direct link to a mail app I don’t have.” (Loopsy, id13620980670) · ER-19; prywatność OG-14, NFR-PRY-001, ZP-03 · wiersz „Translation quality”: P-075 (2a), ZM-02, ER-45
- Kryteria akceptacji:
  - Scenariusz: Podgląd przed wysłaniem
    - Zakładając, że użytkownik wybiera „Zgłoś problem”
    - Gdy aplikacja przygotowuje zgłoszenie
    - Wtedy użytkownik widzi pełną treść diagnostyki (wersja aplikacji i systemu, model urządzenia, stan synchronizacji i zegarka, ostatnie błędy) bez nazw projektów, notatek, zdjęć i wzorów, zanim cokolwiek opuści telefon
  - Scenariusz: Wysyłka wybranym kanałem
    - Zakładając, że na telefonie nie ma skonfigurowanej aplikacji Mail
    - Gdy użytkownik zatwierdza zgłoszenie
    - Wtedy może je wysłać albo zapisać dowolnym kanałem z arkusza udostępniania, a aplikacja nie wysyła niczego sama
  - Scenariusz: Rezygnacja
    - Zakładając, że użytkownik obejrzał treść zgłoszenia
    - Gdy rezygnuje
    - Wtedy nic nie opuszcza telefonu, a aplikacja nie zapisuje, że zgłoszenie było przygotowane
  - Scenariusz: Wiersz „Translation quality” przy przekładzie maszynowym (ER-45)
    - Zakładając, że język aplikacji jest inny niż angielski, czyli teksty pochodzą z przekładu maszynowego (D-026, P-075 (1a), (2a))
    - Gdy użytkownik otwiera Ustawienia
    - Wtedy widzi wiersz „Translation quality” z informacją, że tłumaczenie jest maszynowe, i odnośnikiem „Report a translation problem”
    - Ale na innych ekranach nie ma banera ani komunikatu o jakości tłumaczenia (P-075 (2a))
  - Scenariusz: Zgłoszenie problemu z tłumaczeniem (ER-45)
    - Zakładając, że język aplikacji to niemiecki
    - Gdy użytkownik stuka „Report a translation problem”
    - Wtedy otwiera się ten sam podgląd zgłoszenia co „Zgłoś problem”, z językiem aplikacji w diagnostyce, i nic nie opuszcza telefonu przed wyborem kanału w arkuszu udostępniania (jak „Podgląd przed wysłaniem” i „Wysyłka wybranym kanałem”)
  - Scenariusz: Angielski bez wiersza o przekładzie (ER-45)
    - Zakładając, że język aplikacji to angielski, czyli język źródłowy tekstów (P-075 (1a))
    - Gdy użytkownik otwiera Ustawienia
    - Wtedy nie widzi wiersza „Translation quality”, a „Zgłoś problem” jest dostępne jak zawsze

### BR-DAN-011: Widoczny stan synchronizacji i zegarka
- Przepływ: PR-15, PR-08
- Dowód potrzeby: J-07; „On my ipad I have an error telling me that sync hasn’t updated to the cloud, but no help as to why or how to fix it.” (YarnBuddy, id8662495109); zegarek bez synchronizacji z telefonem (YarnBuddy, id8151431159) · ER-19
- Wyjątek nazwany (P-193, P-195 Q1; ER-52, 2026-10-26): stan kolejki zegarka pokazuje zegarek, nie telefon — liczbę niewysłanych zmian zna pewnie tylko zegarek, bo kolejka jest po jego stronie (ADR-0009); telefon pokazywałby liczbę nieaktualną dokładnie wtedy, gdy zegarek nie odpowiada. Telefon pokazuje ostatni kontakt z zegarkiem.
- Kryteria akceptacji:
  - Scenariusz: Synchronizacja wstrzymana
    - Zakładając, że synchronizacja iCloud jest włączona, a telefon nie ma sieci od 2 godzin
    - Gdy użytkownik otwiera stan danych
    - Wtedy widzi, kiedy była ostatnia udana synchronizacja, że czeka na sieć i że dane na telefonie są zapisane
  - Scenariusz: Zegarek bez telefonu (ER-52)
    - Zakładając, że zegarek ma 3 zmiany niewysłane do telefonu i nie ma z nim połączenia
    - Gdy użytkownik patrzy na licznik na zegarku
    - Wtedy pod liczbą widzi linię, że telefonu nie ma w pobliżu, a 3 zmiany są zapisane na zegarku
    - Oraz linia znika, gdy telefon potwierdzi odbiór zmian (ADR-0009)
  - Scenariusz: Ostatni kontakt z zegarkiem na telefonie (ER-52)
    - Zakładając, że telefon ostatnio odebrał partię zmian z zegarka 2 godziny temu
    - Gdy użytkownik otwiera stan danych na telefonie
    - Wtedy widzi czas ostatniego kontaktu z zegarkiem, bez liczby zmian czekających na zegarku

### BR-DAN-012: Prośba o ocenę i odnośnik „Oceń”
- Przepływ: PR-15, PR-07
- Dowód potrzeby: pętla opinii wersji 1 w kontrakcie zakresu przyjętym przez właściciela (P-052; `docs/scope-contract.md`, „Główna praca i pętla”), obok „Zgłoś problem” (BR-DAN-010); P-059 (3a); OG-15. Przeciw natręctwu: „it keeps asking me to rate the app after I already rated and it’s like every other click!” (kntd, id14475942102); „As soon as I opened the app it asks me to rate it” (YarnPal AU, id13575008695, 1★) · ER-25
- Dokładna chwila po ukończeniu i ewentualny własny limit poza systemowym: [DO WYJAŚNIENIA] (OP-33); teksty i miejsce „Oceń”: rola 04
- Kryteria akceptacji:
  - Scenariusz: Prośba po ukończeniu projektu
    - Zakładając, że użytkownik oznacza projekt jako ukończony (BR-PRJ-006)
    - Gdy zamyka kartę ukończenia (BR-PRJ-015)
    - Wtedy aplikacja woła systemową prośbę o ocenę, którą system może pokazać albo pominąć (S-39), i nie pokazuje żadnego własnego okna z prośbą o ocenę (OG-15)
  - Scenariusz: Nigdy w trakcie pracy ani przy płatnościach
    - Zakładając, że użytkownik otwiera aplikację, liczy rzędy, cofa zmianę, widzi komunikat na limicie (BR-ZAK-006) albo ekran zakupu
    - Gdy kończy tę czynność
    - Wtedy aplikacja nie woła prośby o ocenę
  - Scenariusz: „Oceń” w Ustawieniach
    - Zakładając, że użytkownik jest w Ustawieniach
    - Gdy stuka „Oceń”
    - Wtedy aplikacja otwiera stronę Oczka w App Store z formularzem recenzji (`action=write-review`), a nie systemową prośbę (S-39)

## Zakup (ZAK)
Model i ceny: P-057 (2026-10-22, model V4; ER-26): cała aplikacja darmowa od pierwszego uruchomienia w limicie dni limitu w miesiącu kalendarzowym; Pro (subskrypcja odnawiana miesięczna albo roczna, bez oferty wprowadzającej, albo zakup dożywotni) znosi limit. Produkty, ceny i wymagania KP-01–KP-15: kontrakt płatności `docs/monetyzacja.md`, „Sesja 3, E3”; obowiązują razem z BR-ZAK. Reguła liczenia dni limitu: `docs/monetyzacja/limit.mjs` i wektory L w `docs/monetyzacja/wektory-limitu.json` (rola 02); BRD odsyła do nich i ich nie kopiuje (P-059).

**Dzień limitu** (pojęcie z kontraktu, P-059): dzień, w którym strażnik limitu zapisał start pracy pierwszym +1 albo ręcznym wpisaniem numeru rzędu (D4 w P-057), z wyjątkiem pracy w toku (D3: +1 bez przerwy ≥ 60 min). To inne pojęcie niż **dzień z robótką** w kalendarzu i statystykach (BR-DNI-001, RD-15, RD-16): cofnięcie nie zwraca dnia limitu (L-06), wpisanie zużywa dzień limitu (D4), a praca od 23:40 do 00:10 to jeden dzień limitu i dwa dni z robótką (L-04, RD-16); w dniach brzegowych liczby mogą się różnić.

### BR-ZAK-001: Przywrócenie zakupu
- Przepływ: PR-09
- Dowód potrzeby: OG-02, OG-03 (subskrypcja na wszystkich urządzeniach, ER-26); „it’s prompting me to pay again after I updated” (Easy Knitty, id12782448883); 14 z 156 w próbce Easy Knitty. Inne urządzenie i rodzina (ER-06, 2026-10-22): „don’t want to pay twice to be able to work on a brioche pattern” (iPhone → iPad, Knitting Chart, id6190888819); „It’s a bit frustrating to find each family member must make the in app purchase individually.” (Knitting Chart, id4968890433). Na nowym urządzeniu transakcje są dostępne od pierwszego uruchomienia [FAKT S-33]; zwrot i odebranie z Family Sharing mają datę w transakcji [FAKT S-34]; Family Sharing działa dla zakupów nieodnawialnych i jest nieodwracalne [FAKT S-35]
- Kryteria akceptacji:
  - Scenariusz: Reinstalacja
    - Zakładając, że użytkownik kupił Pro (subskrypcję albo dożywotni) i przeinstalował aplikację
    - Gdy wybiera przywrócenie zakupów
    - Wtedy ma Pro bez limitu dni i bez ponownej opłaty, a jego dane z kopii albo synchronizacji są na miejscu
  - Scenariusz: Brak sieci
    - Zakładając, że użytkownik ma Pro, a telefon jest bez sieci
    - Gdy zaczyna nowy dzień pierwszym dodanym rzędem
    - Wtedy rząd zostaje dodany bez blokady limitu (KP-06, L-13)
  - Scenariusz: iPad z tym samym kontem Apple
    - Zakładając, że użytkownik kupił Pro na iPhonie (subskrypcję albo dożywotni)
    - Gdy instaluje Oczko na iPadzie z tym samym kontem Apple i otwiera aplikację
    - Wtedy iPad pokazuje Pro bez ponownej opłaty (subskrypcja: OG-03), także zanim użytkownik wybierze przywrócenie zakupów
  - Scenariusz: Zegarek bez telefonu w pobliżu (jeśli zegarek jest w wydaniu)
    - Zakładając, że telefon potwierdził Pro, darmowe dni w miesiącu się skończyły, a na zegarku jest Oczko
    - Gdy użytkownik zaczyna nowy dzień pierwszym dodanym rzędem na zegarku, a telefonu nie ma w zasięgu
    - Wtedy rząd zostaje dodany bez blokady limitu (P-039; sposób odczytu na zegarku: OP-22)
  - Scenariusz: Członek rodziny w Family Sharing
    - Zakładając, że dla produktów Pro włączono Family Sharing (P-038, P-057 D6), a członek rodziny nic nie kupował
    - Gdy członek rodziny otwiera Oczko na swoim urządzeniu
    - Wtedy ma Pro bez limitu dni i bez opłaty
  - Scenariusz: Odebranie z Family Sharing
    - Zakładając, że członek rodziny miał Pro z Family Sharing i ma projekty z historią
    - Gdy zakup przestaje być mu udostępniany i sklep podaje datę odebrania
    - Wtedy członek rodziny wraca do limitu dni (BR-ZAK-007), a jego projekty, historia i eksport zostają dostępne (KP-02 w `docs/monetyzacja.md`)

### BR-ZAK-002: Bez reklam i śledzenia
- Przepływ: PR-09
- Dowód potrzeby: ZP-03; „There are ADs even if you pay for the full version” (Easy Knitty, id10578656875); NFR-PRY-001
- Kryteria akceptacji:
  - Scenariusz: Bez Pro
    - Zakładając, że użytkownik nie ma Pro
    - Gdy korzysta z aplikacji
    - Wtedy nie widzi żadnej reklamy, a aplikacja nie łączy się z siecią reklamową ani analityczną

### BR-ZAK-003: Aktualizacja nie zabiera Pro ani darmowego limitu
- Przepływ: PR-09
- Dowód potrzeby: H-02; usunięcie opłaconej funkcji „Smart Pattern” (Loopsy, id14598505817); funkcje przeniesione za paywall (My Row Counter 18 z 917) · zależy od: ZAL-018, ZAL-025 · rozszerza: KP-01 (darmowy limit raz wydany tylko się luzuje; nic darmowego nie przechodzi za zaporę) · ER-26
- Kryteria akceptacji:
  - Scenariusz: Aktualizacja w okresie Pro
    - Zakładając, że użytkownik ma Pro
    - Gdy instaluje nową wersję aplikacji
    - Wtedy ma Pro bez limitu dni, a każda funkcja działa na jego danych
  - Scenariusz: Aktualizacja bez Pro
    - Zakładając, że poprzednia wersja dawała 5 darmowych dni limitu w miesiącu (P-057 D2) i całą aplikację w tych dniach
    - Gdy użytkownik bez Pro instaluje nową wersję
    - Wtedy limit wynosi co najmniej 5 dni w miesiącu, a każda funkcja dostępna wcześniej bez Pro jest dostępna bez Pro (KP-01)

### BR-ZAK-004: Polityka prywatności i język aplikacji w Ustawieniach
- Przepływ: PR-09
- Dowód potrzeby: OG-04 · język: P-075 (3b) (język z ustawień systemu i przełącznik w aplikacji), ZM-02, ADR-0017 („jawny wybór wygrywa z systemem”, uszkodzony odczyt ustawień = język systemu); D-026, NFR-JEZ-001 · ER-45
- Kryteria akceptacji:
  - Scenariusz: Dostęp do polityki
    - Zakładając, że aplikacja jest otwarta
    - Gdy użytkownik otwiera ustawienia
    - Wtedy widzi odnośnik do polityki prywatności, który ją otwiera
  - Scenariusz: Język domyślnie z systemu (ER-45)
    - Zakładając, że telefon ma język polski, a w Ustawieniach aplikacji język ma wartość „jak w systemie” (stan po instalacji)
    - Gdy użytkownik otwiera aplikację
    - Wtedy teksty aplikacji są po polsku, a przed pierwszym +1 nie ma pytania o język (NFR-PIE-001)
  - Scenariusz: Wybór języka w aplikacji wygrywa z systemem (ER-45)
    - Zakładając, że telefon ma język polski, a w projekcie „Skarpeta” licznik pokazuje 42
    - Gdy użytkownik wybiera w Ustawieniach aplikacji język niemiecki
    - Wtedy teksty aplikacji są po niemiecku bez ponownego uruchamiania aplikacji, a licznik, projekty i historia są bez zmian (42 w „Skarpecie”)
    - Oraz po zamknięciu i ponownym otwarciu aplikacji teksty nadal są po niemiecku
  - Scenariusz: Powrót do języka systemu (ER-45)
    - Zakładając, że w aplikacji wybrano niemiecki, a telefon ma język polski
    - Gdy użytkownik wybiera w Ustawieniach aplikacji „jak w systemie”
    - Wtedy teksty aplikacji są po polsku, a gdy później zmieni język telefonu na francuski i wróci do aplikacji, teksty są po francusku
  - Scenariusz: Uszkodzony zapis ustawienia języka (ER-45)
    - Zakładając, że zapisane ustawienie języka nie daje się odczytać, a telefon ma język polski
    - Gdy użytkownik otwiera aplikację
    - Wtedy teksty są po polsku (jak „jak w systemie”, ADR-0017), aplikacja uruchamia się normalnie, a dane projektów są bez zmian

### BR-ZAK-005: Limit dni i strażnik startu dnia
- Przepływ: PR-02, PR-09
- Dowód potrzeby: decyzja właściciela P-057 (D2–D5: limit 5 dni limitu w miesiącu kalendarzowym, przerwa 60 min, wpisanie jak +1, liczą się tylko dni bez Pro) i P-053 („rozpoczęta jednostka pracy zawsze do końca”); kontrakt płatności KP-12, KP-15; reguła i wektory L-01–L-15: `docs/monetyzacja/limit.mjs`, `docs/monetyzacja/wektory-limitu.json` (rola 02, P-059) · ER-26
- Strażnik wołany przy zdarzeniach, dla których `wolaStraznika()` daje true (KP-12, P-067; wektory S-01–S-10 w `docs/monetyzacja/wektory-limitu.json`): każde +1 na dowolnym liczniku (rzędy, oczka, powtórzenia) i z każdego urządzenia (telefon, zegarek, ekran blokady) oraz ręczne wpisanie wartości (D4); zerowanie, −1 i edycja historii to korekty, które dnia nie zaczynają i nie są blokowane · ER-30
- Kryteria akceptacji:
  - Scenariusz: Pierwszy dzień miesiąca (L-01)
    - Zakładając, że jest 1 listopada, a w listopadzie nie ma dni limitu i użytkownik nie ma Pro
    - Gdy dodaje pierwszy rząd
    - Wtedy rząd zostaje dodany, a w listopadzie zostały 4 z 5 darmowych dni
  - Scenariusz: Rozpoczęty dzień do końca (L-02)
    - Zakładając, że użytkownik zużył 5 z 5 dni, a dzisiejszy dzień jest jednym z nich
    - Gdy dodaje rząd w innym projekcie
    - Wtedy rząd zostaje dodany, a liczba dni limitu się nie zmienia
  - Scenariusz: Praca po północy (L-04, L-04b)
    - Zakładając, że użytkownik zużył 5 z 5 dni i dodał rząd o 23:50
    - Gdy dodaje kolejny rząd o 00:00 po 10 minutach
    - Wtedy rząd zostaje dodany jako praca w toku, bez nowego dnia limitu
    - Ale gdy przerwa przed rzędem po północy trwa 61 minut, rząd nie zostaje dodany, a aplikacja pokazuje komunikat na limicie (BR-ZAK-006)
  - Scenariusz: Nowy dzień ponad limit (L-03)
    - Zakładając, że użytkownik bez Pro zużył 5 z 5 dni w listopadzie, a dziś jest 8 listopada
    - Gdy dodaje pierwszy rząd
    - Wtedy rząd nie zostaje dodany, licznik pokazuje poprzednią wartość, a aplikacja pokazuje komunikat na limicie (BR-ZAK-006); zwykle użytkownik widzi ten stan zawczasu, zanim zacznie dziergać (BR-ZAK-006, P-065)
  - Scenariusz: Ręczne wpisanie w nowym dniu ponad limit (L-08)
    - Zakładając, że użytkownik bez Pro zużył 5 z 5 dni, a dziś nie dodał jeszcze rzędu
    - Gdy wpisuje numer rzędu ręcznie (BR-LIC-017)
    - Wtedy wartość nie zostaje zapisana, a aplikacja pokazuje komunikat na limicie
  - Scenariusz: Cofnięcie nie zwraca dnia (L-06)
    - Zakładając, że użytkownik dziś dodał rząd i zużył nim dzień limitu
    - Gdy cofa ten rząd z historii
    - Wtedy liczba dni limitu się nie zmienia
  - Scenariusz: Dane bez limitu (L-07)
    - Zakładając, że użytkownik bez Pro zużył 5 z 5 dni
    - Gdy dopisuje dzień wstecz, poprawia historię albo notatkę, eksportuje dane albo otwiera kalkulator
    - Wtedy zmiana zostaje zapisana, a liczba dni limitu się nie zmienia
  - Scenariusz: Nowy miesiąc (L-05)
    - Zakładając, że w październiku użytkownik zużył 5 z 5 dni
    - Gdy 1 listopada dodaje pierwszy rząd
    - Wtedy rząd zostaje dodany, a w listopadzie zostały 4 z 5 darmowych dni
  - Scenariusz: Pro (L-10)
    - Zakładając, że użytkownik ma Pro, a darmowe dni w miesiącu się skończyły
    - Gdy zaczyna nowy dzień pierwszym rzędem
    - Wtedy rząd zostaje dodany, a dzień trafia do kalendarza (BR-DNI-001) bez blokady
  - Scenariusz: Ten sam dzień na dwóch urządzeniach (L-11)
    - Zakładając, że użytkownik dodał dziś rząd na zegarku, a dane zsynchronizowały się z iPhonem
    - Gdy dodaje rząd na iPhonie
    - Wtedy to wciąż jeden dzień limitu
  - Scenariusz: Licznik oczek zaczyna dzień (S-02)
    - Zakładając, że użytkownik bez Pro zużył 5 z 5 dni, a dziś nie dodał nic na żadnym liczniku
    - Gdy dodaje 1 na liczniku oczek
    - Wtedy oczko nie zostaje dodane, tak jak rząd (P-067 (3a): typ licznika wybiera użytkownik, więc nie jest drogą obejścia)
  - Scenariusz: Korekty na limicie (S-07, S-08)
    - Zakładając, że użytkownik bez Pro zużył 5 z 5 dni, a dziś nie dodał rzędu, a licznik ma 61
    - Gdy odejmuje 1 albo zeruje licznik z potwierdzeniem
    - Wtedy licznik pokazuje 60 albo 0, liczba dni limitu się nie zmienia, a zmiana jest w historii (P-067 (1a), (2a))
  - Scenariusz: Zegarek bez telefonu na limicie (L-18)
    - Zakładając, że ostatnia synchronizacja przyniosła na zegarek 5 z 5 dni w listopadzie, a telefonu nie ma w zasięgu
    - Gdy użytkownik nowego dnia chce dodać rząd na zegarku
    - Wtedy zegarek nie pokazuje +1, tylko informację, że darmowe dni się skończyły (P-067 (4a)); z Pro dodaje rząd (BR-ZAK-001)
  - Scenariusz: Dzień zaczęty przed synchronizacją nowego urządzenia (L-16, L-17)
    - Zakładając, że użytkownik zaczął dziś dzień na nowym iPadzie, zanim iCloud przyniósł 5 dni z listopada z iPhone’a
    - Gdy dane się scalą, a w listopadzie jest 6 dni limitu
    - Wtedy dzisiejszy dzień zostaje do końca, a następny nowy dzień jest blokowany (P-067 (5a), KP-15)
  - Scenariusz: Zegar z przyszłości (L-15)
    - Zakładając, że ostatni zapisany rząd ma czas późniejszy niż bieżący czas telefonu, a użytkownik bez Pro zużył 5 z 5 dni
    - Gdy dodaje pierwszy rząd nowego dnia
    - Wtedy aplikacja nie traktuje tego jako pracy w toku i pokazuje komunikat na limicie

### BR-ZAK-006: Komunikat na limicie i miejsca ekranu zakupu
- Przepływ: PR-09, PR-02
- Dowód potrzeby: P-055 i P-057 (ekran zakupu tylko przy starcie ponad limit i w Ustawieniach, bez arkusza zakupu na starcie); KP-03, KP-13, KP-14 i ujawnienia (5), (6) w `docs/monetyzacja.md`, „Sesja 3, E3”; NFR-PIE-001 · ER-26. Komunikat zawczasu i miejsce licznika dni: P-065 (1a), (2a), bo w przejściu poznawczym roli 04 stuknięcie zatrzymane po zrobionym rzędzie przepadało po cichu, a dziergająca dalej robiła robótkę (`docs/design/przejscie/wynik.md`) · ER-29. Okno „Uczciwe zasady”: P-089 (3a) (zbieżność z Treningiem: raz, główny przycisk zamyka, odnośnik do planów, bez kwot), P-103 (5a) („ukończony dzień” = data dnia bez Pro z robótką minęła), KP-16, wektory O-01–O-11 w `docs/monetyzacja/wektory-limitu.json` (rola 02), ZM-05 · ER-46. Karta planów Pro po imporcie tylko po imporcie z innej aplikacji (P-113 (Q2a), jak Trening): BR-DAN-007, nie BR-DAN-006
- zależy od: potwierdzenia roli 02, że komunikat przed pierwszym rzędem dnia (bez ekranu zakupu) jest zgodny z KP-12 i KP-13 (P-065 (1a), warunkowa)
- Teksty i wygląd: `docs/design/design-spec.md`, „Limit dni na ekranach” (rola 04)
- Kryteria akceptacji:
  - Scenariusz: Limit widoczny przed pierwszym rzędem dnia
    - Zakładając, że użytkownik bez Pro zużył 5 z 5 darmowych dni w listopadzie, dziś jest 8 listopada, dziś nie dodał rzędu, a ostatni rząd dodał ponad 60 minut temu
    - Gdy otwiera aplikację („Dziś”) albo licznik projektu
    - Wtedy zamiast przycisków +1 i −1 (na karcie „Dziś” zamiast jej „+1”, ZM-18, ER-70) widzi komunikat, że darmowe dni w listopadzie się skończyły i liczenie wraca 1 grudnia, a jego rzędy i wszystkie dane zostają; odnośnik do Pro leży poza miejscem przycisku +1, a ekranu zakupu nie ma
    - Oraz historia, menu projektu, wzór i eksport działają, a −1, zerowanie i cofnięcie zmiany z historii są dostępne z historii albo menu projektu, bo to korekty, nie start dnia (P-067 (1a), (2a), ER-30)
  - Scenariusz: Praca po północy bez przerwy (L-04)
    - Zakładając, że użytkownik zużył 5 z 5 dni i dodał rząd o 23:50
    - Gdy o 00:10 patrzy na licznik
    - Wtedy widzi przyciski +1 i −1, a nie komunikat o limicie, bo to praca w toku tego samego dnia limitu
  - Scenariusz: Nowy dzień zaczął się przy otwartej aplikacji (przypadek brzegowy)
    - Zakładając, że licznik był otwarty z przyciskiem +1, a od ostatniego rzędu minęło ponad 60 minut i zaczął się nowy dzień ponad limit (BR-ZAK-005)
    - Gdy użytkownik stuka +1
    - Wtedy rząd nie zostaje dodany, a aplikacja mówi wprost, że rząd 62 nie został dodany („Row 62 wasn’t added”), że darmowe dni się skończyły i co znaczy dzień z robótką w limicie, oraz że dane zostają
    - Oraz po zamknięciu komunikatu licznik pokazuje niezmienioną wartość i komunikat z pierwszego scenariusza zamiast przycisków
  - Scenariusz: Bez oferty w trakcie pracy
    - Zakładając, że użytkownik ma darmowe dni albo pracuje w rozpoczętym dniu
    - Gdy liczy rzędy (także „+1” karty na „Dziś”), otwiera „Dziś”, projekty, wzór i kalendarz
    - Wtedy nie widzi ekranu zakupu ani oferty Pro (na „Dziś” także odnośnika „Oczko Pro”, P-563 (10a)) poza jednorazowym oknem „Uczciwe zasady” (scenariusze niżej), które nigdy nie pojawia się na ekranie licznika ani nad „+1” karty na „Dziś” (ER-70); ekran zakupu otwiera tylko z Ustawień albo odnośnikiem z tego okna (ER-46)
  - Scenariusz: Licznik dni
    - Zakładając, że użytkownik bez Pro zużył 2 z 5 dni w listopadzie
    - Gdy otwiera „Dziś”, listę projektów albo Ustawienia
    - Wtedy widzi (na „Dziś” w linii wolnych dni, P-563 (10a), ER-70), że zostały 3 z 5 darmowych dni w listopadzie, a ekran licznika nie pokazuje liczby dni (P-046)
  - Scenariusz: Ostatni darmowy dzień
    - Zakładając, że użytkownik bez Pro zużył 4 z 5 dni w listopadzie
    - Gdy otwiera licznik
    - Wtedy pod liczbą widzi jedną linię, że został 1 darmowy dzień w listopadzie (wyjątek od P-046, P-065 (2a))
  - Scenariusz: Aktywna subskrypcja
    - Zakładając, że użytkownik ma aktywną subskrypcję Pro
    - Gdy otwiera Ustawienia
    - Wtedy widzi stan Pro i „Zarządzaj subskrypcją”, które otwiera systemowe zarządzanie subskrypcją (KP-14), a ekran zakupu nie oferuje tej samej subskrypcji (KP-03)
  - Scenariusz: Okno „Uczciwe zasady” po pierwszym ukończonym dniu (ER-46)
    - Zakładając, że użytkownik bez Pro (sklep potwierdził brak Pro) dodał rzędy 3 listopada i nie widział jeszcze okna „Uczciwe zasady”
    - Gdy 4 listopada pierwszy raz otwiera listę projektów (zakładka Projekty; miejsce okna po zmianie startu ustala 04, nigdy nad „+1”, ZM-18, ER-70)
    - Wtedy raz widzi okno „Uczciwe zasady” z trzema krótkimi zdaniami: wszystkie funkcje działają od pierwszego dnia, w wersji darmowej jest 5 dni z robótką w miesiącu, Pro zdejmuje limit (subskrypcja albo zakup jednorazowy), bez kwot i bez listy planów (O-01)
    - Oraz przycisk główny zamyka okno, a odnośnik „Zobacz plany Pro ›” zamyka okno i otwiera ekran zakupu z cenami ze sklepu (P-089 (1), (3a))
  - Scenariusz: Okno nie na ekranie licznika (ER-46)
    - Zakładając warunki z poprzedniego scenariusza, ale aplikacja otwiera się 4 listopada na „Dziś” (zimny start, P-563 (4a)), a użytkownik wraca jednym stuknięciem „Kontynuuj ›” do licznika projektu (BR-PRJ-011)
    - Gdy użytkownik liczy rzędy „+1” karty na „Dziś” i na liczniku, a potem przechodzi na listę projektów
    - Wtedy ani na „Dziś”, ani na liczniku nie ma okna (O-05; nic nie zasłania „+1” karty, NFR-PIE-001), a okno pojawia się dopiero na liście projektów (ZM-18, ER-70)
  - Scenariusz: Okno tylko raz (ER-46)
    - Zakładając, że użytkownik zamknął okno „Uczciwe zasady” przyciskiem głównym, odnośnikiem albo gestem zamknięcia
    - Gdy w kolejnych dniach otwiera aplikację, także po przywróceniu własnej kopii zapasowej na nowym telefonie
    - Wtedy okna już nie widzi, bo informacja „widziane” jest w danych i w kopii (O-02, KP-16)
  - Szablon scenariusza: Bez okna (ER-46)
    - Zakładając, że <stan>
    - Gdy użytkownik otwiera listę projektów
    - Wtedy okna „Uczciwe zasady” nie ma, a limit i dni limitu są takie same jak bez okna (KP-16)
    - Przykłady:
      | stan | wektor |
      | dziś jest pierwszy dzień z robótką i data jeszcze nie minęła | O-06 |
      | użytkownik ma aktywne Pro | O-03 |
      | sklep nie odpowiedział, a aplikacja nie pamięta wcześniejszego wyniku | O-04 |
      | wcześniejsze dni z robótką były tylko z Pro, a pierwszy dzień bez Pro trwa | O-07 |
      | świeża instalacja bez dni z robótką | O-10 |

### BR-ZAK-007: Utrata Pro
- Przepływ: PR-09
- Dowód potrzeby: KP-02 (utrata Pro: wraca limit dni; dane, historia, eksport i kopia zawsze dostępne); P-057 D5 (liczą się tylko dni bez Pro); ZAL-018 · ER-26
- Kryteria akceptacji:
  - Scenariusz: Wygaśnięcie w trakcie miesiąca (L-09)
    - Zakładając, że Pro wygasło 20 listopada, a w listopadzie użytkownik miał 10 dni limitu z Pro i 2 bez Pro
    - Gdy 21 listopada dodaje pierwszy rząd
    - Wtedy rząd zostaje dodany, a w listopadzie zostały 2 z 5 darmowych dni
  - Scenariusz: Dane po utracie Pro
    - Zakładając, że subskrypcja wygasła albo sklep zwrócił zakup, a użytkownik ma projekty z historią
    - Gdy otwiera projekty, historię i eksport
    - Wtedy wszystkie są dostępne i pełne, a synchronizacja iCloud działa dalej (P-054)
