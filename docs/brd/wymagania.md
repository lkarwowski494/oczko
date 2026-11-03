# Przepływy i wymagania niefunkcjonalne
Stan: STOP E3 · Aktualizacja: 2026-10-21; fix ER-09–ER-24: 2026-10-22 · Wymagania funkcjonalne według modułów: `wymagania-licznik.md` (LIC), `wymagania-projekt.md` (PRJ, WZR), `wymagania-dane.md` (DAN, ZAK), `wymagania-narzedzia.md` (ZAP, KAL, SLO).

Lista jest szeroka (zasada roli 7): obejmuje wszystko, na co wskazują dowody. Kolejność i cięcie należą do roli 03 (H-04, H-05). Ekrany projektuje rola 04; „ekran licznika” i podobne nazwy oznaczają miejsce w przepływie, nie układ.

## Przepływy (PR)
### PR-01: Pierwsze liczenie
- Kto: P-1 (także każdy nowy użytkownik). Praca: J-01. Częstość: raz, przy pierwszym uruchomieniu.
- Kroki: instaluje aplikację; otwiera ją; zaczyna liczyć rzędy bez konta, projektu i wzoru; później może nadać licznikowi nazwę projektu.
- Kontekst: robótka już w rękach albo obok; uwaga podzielona.
### PR-02: Liczenie rzędów w sesji
- Kto: P-1, P-2, P-3. Praca: J-01. Częstość: każda sesja, każdy rząd.
- Kroki: otwiera projekt; po każdym rzędzie dodaje 1; przy pruciu cofa; gdy nie pamięta, czy dodał, sprawdza historię; kończy sesję.
- Kontekst: obie ręce zajęte, telefon na stojaku albo na kolanach, podcast lub TV.
### PR-03: Powtórzenia i części
- Kto: P-2, P-3. Praca: J-02. Częstość: projekty z motywem albo kilkoma częściami.
- Kroki: dodaje licznik powtórzenia o długości n rzędów albo licznik części; dodaje rząd; widzi rząd w powtórzeniu i numer powtórzenia; zmienia ustawienie w trakcie.
- Kontekst: jak PR-02.
### PR-04: Instrukcje „co N rzędów” i „w tym samym czasie”
- Kto: P-2, P-3. Praca: J-03. Częstość: kształtowanie (rękawy, dekolt, raglan).
- Kroki: wpisuje instrukcję ze wzoru (od rzędu s, co N rzędów, M razy); aplikacja pokazuje plan rzędów; podczas liczenia dostaje wyraźne przypomnienie w odpowiednim rzędzie.
- Kontekst: jak PR-02; przypomnienie musi zauważyć ktoś, kto patrzy na robótkę.
### PR-05: Liczenie bez sięgania po telefon
- Kto: P-1, P-2. Praca: J-06. Częstość: każda sesja.
- Kroki: dodaje rząd z zegarka, z ekranu blokady albo głosem; ekran telefonu nie gaśnie, gdy liczy na telefonie.
- Kontekst: ręce zajęte, telefon zablokowany albo w innym miejscu pokoju.
### PR-06: Praca ze wzorem
- Kto: P-2, P-3. Praca: J-04. Częstość: projekty ze wzorem.
- Kroki: importuje PDF albo zdjęcie wzoru (Pliki, udostępnianie, aparat); ustawia znacznik bieżącego rzędu; dzierga, a znacznik przesuwa się z licznikiem; dopisuje notatki i zakreślenia.
- Kontekst: iPhone albo iPad, często poziomo; drobny tekst wieczorem.
### PR-07: Projekt od założenia do archiwum
- Kto: P-2, P-4. Prace: J-05, J-11. Częstość: każdy projekt.
- Kroki: zakłada projekt z częściami; zapisuje włóczkę, druty, próbkę, zdjęcia i notatki; przerywa na tygodnie; wraca i zastaje stan; kończy projekt; archiwizuje albo robi kopię do powtórzenia.
- Kontekst: dom; powrót po długiej przerwie.
### PR-08: Dane na nowym telefonie i iPadzie
- Kto: P-2, P-3. Praca: J-07. Częstość: zmiana telefonu, drugie urządzenie, aktualizacja aplikacji.
- Kroki: włącza synchronizację iCloud (opcjonalnie); na drugim urządzeniu widzi te same projekty; przy zmianie telefonu odtwarza dane z kopii urządzenia albo z pliku eksportu; po aktualizacji aplikacji zastaje wszystkie dane.
- Kontekst: wolne ręce; synchronizacja wymaga sieci (OG-09).
### PR-09: Zakup i przywrócenie zakupu
- Kto: każdy użytkownik bez Pro na limicie i każdy płacący. Praca: J-07. Częstość: komunikat na limicie najwyżej przy starcie dnia; zakup raz albo co okres subskrypcji; przywrócenie przy nowym urządzeniu (P-057, ER-26).
- Kroki: liczy w darmowych dniach limitu; przy starcie dnia ponad limit widzi komunikat z liczbą dni i Pro; kupuje subskrypcję (miesięczną, roczną) albo dożywotni, albo czeka do nowego miesiąca; na nowym urządzeniu albo po reinstalacji przywraca zakup; na iPadzie i zegarku z tym samym kontem oraz jako członek rodziny (Family Sharing, P-038) ma Pro bez ponownej opłaty; zarządza subskrypcją w Ustawieniach; po utracie Pro wraca do limitu z pełnymi danymi; korzysta bez reklam.
- Kontekst: wolne ręce, sieć.
### PR-10: Zapas włóczki
- Kto: P-4. Praca: J-08. Częstość: zakupy, start i koniec projektu.
- Kroki: dodaje włóczkę ze zdjęciem etykiety; przypisuje ją do projektu; po zakończeniu odejmuje zużycie; przed zakupem sprawdza, co ma.
- Kontekst: dom albo sklep bez zasięgu.
### PR-11: Obliczenie
- Kto: P-2, P-3. Praca: J-09. Częstość: start projektu, zmiana włóczki.
- Kroki: wybiera obliczenie; podaje dane (próbka, wymiar, jednostki); widzi wynik z danymi wejściowymi i założeniami; zapisuje wynik w projekcie.
- Kontekst: dom, wolne ręce.
### PR-12: Sprawdzenie skrótu
- Kto: P-1. Praca: J-10. Częstość: przy nieznanym skrócie.
- Kroki: wybiera system terminologii wzoru (US albo UK); wyszukuje skrót; czyta znaczenie.
- Kontekst: w trakcie robótki, krótka przerwa.
### PR-13: Przejście od innej aplikacji
- Kto: P-2, P-4. Praca: J-07. Częstość: raz.
- Kroki: eksportuje dane z poprzedniej aplikacji albo z Ravelry; importuje plik do Oczka; sprawdza projekty i zapas.
- Kontekst: dom.
### PR-14: Czas i postęp
- Kto: P-2. Praca: J-11. Częstość: każda sesja.
- Kroki: uruchamia stoper sesji; kontynuuje przy zablokowanym ekranie; widzi czas projektu, postęp do celu i szacowany czas do końca.
- Kontekst: jak PR-02.
### PR-15: Zgłoszenie problemu, ocena i stan danych
- Kto: każdy użytkownik, częściej płacący z kilkoma urządzeniami. Prace: J-07, J-01. Częstość: rzadko, przy błędzie albo wątpliwości co do synchronizacji (ER-19); prośba o ocenę najwyżej po ukończeniu projektu (ER-25).
- Kroki: widzi stan synchronizacji i zegarka; gdy coś nie działa, wybiera „Zgłoś problem”; ogląda, co zostanie wysłane; wysyła wybranym kanałem albo rezygnuje. Po ukończeniu projektu może zobaczyć systemową prośbę o ocenę; kiedy chce, ocenia przez „Oceń” w Ustawieniach (pętla opinii wersji 1, P-052).
- Kontekst: wolne ręce; bez sieci zgłoszenie czeka w wybranym kanale.
### PR-16: Dni z robótką, postęp i termin
- Kto: P-2 (kilka projektów naraz), P-1. Prace: J-11, J-05. Częstość: co kilka dni; termin przy prezentach i zamówieniach (P-043, ER-11).
- Kroki: patrzy, kiedy dziergał i ile; otwiera dzień albo podsumowanie okresu; widzi postęp projektu w %; ustawia termin i sprawdza cel na dziś; wybiera, który projekt zrobić dziś.
- Kontekst: wolne ręce, przerwa w robótce; poza ekranem licznika (P-046).

## Wymagania niefunkcjonalne (NFR)
### NFR-DAN-001: Zero utraty danych przy aktualizacji
- Miara: liczba rekordów (projekty, liczniki, historia, zapas, notatki) różnych przed i po migracji schematu.
- Próg: 0 (zasada projektu „Zero utraty danych”, `CLAUDE.md`).
- Metoda: test migracji w transakcji na kopii bazy poprzedniej wersji (rola 07, 12).
### NFR-DAN-002: Każda zmiana licznika zapisana trwale
- Miara: liczba zmian licznika utraconych po wymuszonym zamknięciu aplikacji albo wyłączeniu telefonu zaraz po dotknięciu.
- Próg: 0.
- Metoda: test automatyczny z zabiciem procesu po każdej zmianie (rola 07).
### NFR-DAN-003: Synchronizacja nie zmienia liczby bez wiedzy użytkownika
- Miara: liczba przypadków, w których po synchronizacji licznik ma wartość inną niż ostatnia ustawiona na którymkolwiek urządzeniu, bez pokazania konfliktu.
- Próg: 0 (RYZ-02).
- Metoda: test automatyczny konfliktów: dwie instancje magazynu i zegarek z symulowanym transportem (opóźnienie, przerwana sieć, odwrócona kolejność), rola 12 i 07. Ryzyko szczątkowe (P-041, ER-10): zachowanie iCloud między prawdziwymi urządzeniami.
### NFR-OFF-001: Działanie bez sieci
- Miara: odsetek przepływów PR-01–PR-07, PR-10–PR-12, PR-14 wykonanych w trybie samolotowym.
- Próg: 100% (`docs/pomysl.md`; P-021).
- Metoda: testy automatyczne (jednostkowe i UI w symulatorze) każdego przepływu z adapterem sieci w stanie „brak połączenia” (rola 07). Ryzyko szczątkowe (P-041, ER-10): zachowanie systemu w prawdziwym trybie samolotowym.
### NFR-PIE-001: Pierwsze liczenie bez przeszkód
- Miara: liczba stuknięć od otwarcia świeżo zainstalowanej aplikacji do pierwszego dodanego rzędu; liczba ekranów przed licznikiem (powitanie, quiz, prośba o uprawnienie, zakup, konto); działanie bez sieci.
- Próg: 1 stuknięcie (P-047); 0 ekranów przed licznikiem; to samo w trybie bez sieci. Strażnik limitu dni nie blokuje pierwszego +1 świeżej instalacji: miesiąc zaczyna się od 5 z 5 wolnych dni, więc pierwsze +1 zawsze jest dozwolone i nie pokazuje komunikatu ani ekranu zakupu (KP-12, L-01; ER-28). Świeża instalacja to pierwsze uruchomienie bez danych; reinstalacja z danymi iCloud liczy dni limitu z danych (KP-15) i nie podlega temu progowi. Dowód: „deleted in 5 mins because I cannot figure out how to count the rows without creating a project” (My Row Counter GB, id12450531949); „I don’t want to take a quiz about how the app can help me improve. I want a stitch counter” (Loopsy, id14441026601) · ER-14
- Metoda: test UI automatyczny w symulatorze na świeżej instalacji, z siecią i z adapterem sieci w stanie „brak połączenia”, także z datą 1. i ostatniego dnia miesiąca (rola 07); wektor L-01 w `docs/monetyzacja/wektory-limitu.json`.
### NFR-PRY-001: Brak zbierania danych
- Miara: kategorie danych w etykiecie App Privacy i lista SDK.
- Próg: „Data Not Collected”, zero SDK reklamowych i analitycznych (ZP-03).
- Metoda: przegląd zależności i etykiety przed wydaniem (rola 10).
### NFR-DOS-001: VoiceOver w głównych przepływach
- Miara: odsetek elementów sterujących PR-01–PR-05 z etykietą i akcją VoiceOver.
- Próg: 100% (ZP-04; popyt: VoiceOver w Crochet and Knit Counter).
- Metoda: automatyczny audyt dostępności w testach UI na ekranach PR-01–PR-05 na symulatorze iPhone'a i iPada (P-217) (`performAccessibilityAudit`, iOS 17.0+, typy m.in. `sufficientElementDescription` i `action` [FAKT S-36]) oraz test, że każdy element sterujący ma etykietę i akcję (rola 07); rola 04 ustala pozostałe podłogi dostępności. Ryzyko szczątkowe (P-041, ER-10): odbiór przez osobę używającą VoiceOver.
### NFR-DOS-002: Duży tekst
- Miara: obcięty albo nakładający się tekst na ekranach PR-01–PR-06 przy największym rozmiarze tekstu.
- Próg: [DO USTALENIA] (OP-16), podłogę ustala rola 04.
- Metoda: zrzuty przy każdym rozmiarze Dynamic Type na iPhonie i iPadzie (P-217).
### NFR-WYD-001: Reakcja licznika
- Miara: czas od dotknięcia do pokazania nowej wartości.
- Próg: p95 ≤ 100 ms z 20 stuknięć +1 w stanie ustalonym; pierwsze stuknięcie po otwarciu licznika (zimna ścieżka) tylko informacyjnie (P-456, 2026-11-03; OP-17 zamknięte; ER-67); ten sam budżet w `docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md` (05) i w asercji scenariusza 31 (07).
- Metoda: pomiar automatyczny w teście UI w CI (czas od zdarzenia dotknięcia do nowej wartości na ekranie), symulator najstarszego obsługiwanego iPhone’a (rola 05 i 07). Ryzyko szczątkowe (P-041, ER-10): symulator nie odwzorowuje szybkości urządzenia, więc budżet ma zapas ustalony przez 05.
### NFR-ZEG-001: Zgodność zegarka i telefonu
- Miara: różnica wartości licznika między zegarkiem a telefonem po serii zmian na obu urządzeniach.
- Próg: 0 po zakończeniu synchronizacji (skargi: YarnBuddy 17 z 301).
- Metoda: test automatyczny logiki synchronizacji z symulowanym transportem (telefon poza zasięgiem, powrót, zmiany na obu stronach) i test UI na parze symulatorów telefon–zegarek, jeśli CI na to pozwala (rola 05 i 07). Ryzyko szczątkowe (P-041, ER-10): prawdziwy zegarek poza zasięgiem telefonu.
### NFR-SYS-001: Działanie po premierze nowego iOS i watchOS
- Miara: liczba przepływów PR-01–PR-05 i PR-08, które nie działają na nowej głównej wersji iOS albo watchOS; czas od publicznej premiery systemu do wydania poprawki.
- Próg: 0 przepływów; minimalne obsługiwane wersje systemu: iOS 18, watchOS 11 (P-070), ER-63; czas od premiery systemu do poprawki [DO USTALENIA] (OP-26), P-047. Dowód: „Since the most recent iOS update, the watch app has been glitchy (crashing or not opening at all).” (YarnBuddy, id12259939345); „since the latest updates, the complications on my watch face won’t show the current row count” (YarnBuddy, id10717526170) · ER-21
- Metoda: testy automatyczne w CI na symulatorach najnowszej dostępnej wersji iOS, iPadOS i watchOS, także beta przed premierą, jeśli runner ją ma (rola 05 i 07). Ryzyko szczątkowe (P-041): różnice prawdziwego urządzenia.
### NFR-UKL-001: Układ na iPadzie w każdym rozmiarze okna
- Miara: liczba elementów obciętych, nakładających się albo niedostępnych na ekranach PR-01–PR-06 na iPadzie w orientacji pionowej i poziomej oraz w oknie o szerokości kompaktowej (OG-16).
- Próg: 0 (P-218 Q3a).
- Metoda: test UI i zrzuty na symulatorze iPada: pełny ekran pionowo i poziomo oraz okno o szerokości kompaktowej (rola 07; układy: rola 04). Ryzyko szczątkowe (P-041): okna o rozmiarach pośrednich na prawdziwym urządzeniu.
### NFR-JEZ-001: 35 lokalizacji
- Miara: odsetek tekstów interfejsu przetłumaczonych w każdej z 35 lokalizacji.
- Próg: 100% przed wydaniem w danym sklepie (D-026; P-009).
- Metoda: kontrola katalogu tłumaczeń (rola 09).
### NFR-KOS-001: Koszt stały
- Miara: miesięczny koszt usług poza opłatą Apple Developer.
- Próg: 0 zł (ZAL-003; OG-09).
- Metoda: przegląd usług w ADR (rola 05).
