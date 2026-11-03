# Testy na urządzeniu przy TestFlight — plan dla właściciela
Wersja 2026-11-01 (rola 07, P-289; zegarek wraca do testu — P-316). Scala: lista „tylko urządzenie” partii 6 U1–U12 (`docs/programista/partia-6-natywne.md`, kopia partii 6 a107a49), listę „tylko telefon” TT-01–TT-11 (`docs/jakosc/strategia.md` §8) i listę iCloud partii 7 (`docs/jakosc/plan-partia-7-icloud.md`, „Lista »tylko urządzenie«”).
Lista jest zawężona do tego, czego CI nie sprawdzi (jak w Treningu: „telefon zaraz po buildzie” — pierwsza część ok. 5 min, reszta w kolejności bloków). Czego nie sprawdzi CI: symulator nie ma kamery, zegarka sparowanego z telefonem (`transferUserInfo` nie działa w symulatorze, ADR-0009), wibracji, prawdziwych okien iPadOS, ekranu blokady z Live Activity, zakupów w piaskownicy, drugiego urządzenia z tym samym kontem ani instalacji nad poprzednią wersją.

## Jak to robić
- **Czas:** część obowiązkowa ok. 87 min, z częściami warunkowymi i dodatkowymi do ok. 117 min (szacunek agenta, nie pomiar; blok A z zegarkiem ok. 6 min, blok H ok. 12 min). Można przerwać po dowolnym bloku i wrócić; kolejność bloków A i G jest ważna (niżej).
- **Jedno zadanie naraz.** Przy każdym punkcie: wynik **tak / nie**, a przy „nie” zrzut ekranu (albo nagranie ekranu) i jedno zdanie, co się stało.
- **Gdzie zgłosić:** wypełnij kolumnę „Wynik” w tabeli na końcu (wystarczy zdjęcie albo wklejenie listy „U5: tak, U10: nie — …”) i wyślij koordynatorowi. Zrzuty tylko do prywatnego `oczko-warsztat` (mogą pokazywać Twoje dane), nie do tego repo.
- Teksty w aplikacji są po angielsku — w krokach podaję je dosłownie w cudzysłowie.

## Przygotowanie (5 min)
1. **iPhone z obecną wersją 0.1.0** (TestFlight, build 1004) — **nie usuwaj jej przed blokiem A**. **Apple Watch sparowany z tym iPhonem** (do bloków A i H; masz go — Trening `docs/fakty-wlasciciela.md`, build 1030/1033). iPad bez Apple Pencil.
2. Numer nowego buildu TestFlight: [DO USTALENIA — poda rola 10 / koordynator]. Zapisz go w tabeli wyników.
3. Pliki na iPhonie w aplikacji Pliki:
   - dowolny PDF wzoru (kilka stron);
   - trzy pliki Word z repo: `modules/oczko-wzor/TestyOknaMaszyn/Testy/korpus/tekst.docx`, `tabela.docx`, `obraz.docx` (z GitHuba → „Pobierz” → zapisz w Plikach);
   - (dodatkowo, do U4) duży PDF 100–200 MB, ok. 300 stron — jeśli taki masz; inaczej U4 pomijamy.
4. Na iPhonie: Ustawienia → Ekran i jasność → Automatyczna blokada = **1 minuta** (do U11; po testach przywróć swoje).
5. Te same konta Apple ID i iCloud na iPhonie i iPadzie (do bloków E i F).

## A. Instalacja nad 0.1.0 — iPhone i zegarek, ok. 6 min (koniecznie pierwsze)
| ID | Kroki | Oczekiwany wynik | Zgłoś |
|---|---|---|---|
| TT-07 | W TestFlight zainstaluj nowy build **na istniejącą 0.1.0** (bez usuwania). Otwórz aplikację. | Aplikacja startuje bez awarii; jest pusta (licznik 0 albo „No projects yet…”) — to zamierzone, dane 0.1.0 nie są przenoszone (P-070). Stary plik zostaje nietknięty. | awaria, ekran trybu awaryjnego albo jakiekolwiek dane z 0.1.0 |
| TT-12 | Zaraz po instalacji buildu, bez czekania na resztę listy: na zegarku wciśnij koronę (siatka aplikacji); na iPhonie otwórz aplikację Watch i znajdź „Oczko” na liście aplikacji. Jeśli aplikacji na zegarku nie ma, włącz jej instalację w aplikacji Watch (przełącznik przy „Oczko”) i poczekaj kilka minut. | Ikona Oczka na siatce zegarka jest prawdziwą ikoną (nie pustym krążkiem); nazwa „Oczko” widoczna w aplikacji Watch. Aplikacja zegarka się otwiera. | pusty krążek zamiast ikony (taki błąd miał Trening, R-013), brak aplikacji na zegarku, awaria przy otwarciu |
TT-06 (aktualizacja z danymi z poprzedniego buildu nowej wersji) dotyczy dopiero kolejnych buildów — teraz „nie dotyczy”.
Blok A to pierwsza część „zaraz po buildzie” (ok. 6 min); reszta w kolejności bloków. Dlaczego zegarek tu: ikony i instalacji zegarka symulator w CI nie sprawdza, a błąd widać od razu.

## B. Licznik i ekran — iPhone, ok. 14 min
| ID | Kroki | Oczekiwany wynik | Zgłoś |
|---|---|---|---|
| U7 | Na liczniku obróć telefon poziomo. Potem otwórz wzór (blok C albo dowolny PDF) i obróć. | Licznik i pozostałe ekrany zostają w pionie; obraca się tylko wzór. | ekran inny niż wzór obrócony |
| TT-09 | Stuknij „+1 row” raz (włącza się Live Activity). Zablokuj telefon. Na ekranie blokady stuknij +1 trzy razy. Odblokuj. | Wartość większa o 3, bez komunikatu o konflikcie. | inna liczba, brak Live Activity na ekranie blokady |
| U11 | Otwórz wzór i nie dotykaj telefonu przez ok. 2 min (dłużej niż automatyczna blokada). Potem wyjdź ze wzoru i z licznika (np. do listy projektów) i odczekaj 2 min. Potem w Ustawieniach wyłącz „Keep screen on while counting”, wróć na licznik bez zamykania aplikacji i odczekaj 2 min; potem włącz opcję z powrotem (M1-059). Na koniec, z licznikiem na ekranie, przejdź do innej aplikacji (np. Wiadomości), wróć do Oczka i odczekaj 2 min (M1-139). | Na wzorze ekran nie gaśnie; poza wzorem i licznikiem gaśnie normalnie; z wyłączoną opcją gaśnie także na liczniku; po powrocie z innej aplikacji na licznik ekran znów nie gaśnie. | ekran zgasł na wzorze albo nie gaśnie poza nimi albo na liczniku z wyłączoną opcją albo zgasł na liczniku po powrocie z innej aplikacji |

## C. Wzory — iPhone, ok. 20 min
| ID | Kroki | Oczekiwany wynik | Zgłoś |
|---|---|---|---|
| U10 | Projekt → „Add pattern” → „Choose file (PDF or Word)”: kolejno `tekst.docx`, `tabela.docx`, `obraz.docx` (każdy w osobnym projekcie albo po usunięciu poprzedniego wzoru). | Każdy wzór się otwiera; tekst, tabela i obraz są widoczne; na końcu nie ma pustej strony. | brak tabeli/obrazu, pusta strona, błąd |
| U6 | „Add pattern” → „Scan pages”, zeskanuj 2–3 kartki. | Powstaje wzór PDF, strony w kolejności skanowania. | zła kolejność, brak stron |
| U3 | Na wzorze PDF przewijaj palcem; przytrzymaj palec na wierszu. Obróć stronę (menu wzoru ••• → „Rotate page”) i powtórz przytrzymanie. | Palec przewija; przytrzymanie stawia znacznik rzędu na wysokości palca, także na obróconej stronie. | znacznik w złym miejscu |
| U5 (część obowiązkowa) | (1) Safari: otwórz dowolną stronę z wzorem → Udostępnij → Oczko → wybierz projekt. (2) Pliki: PDF → Udostępnij → Oczko → „New project”. (3) Zdjęcia: 1 zdjęcie → Udostępnij → Oczko. Potem otwórz Oczko. | Wzór jest w wybranym (albo nowym) projekcie; arkusz udostępniania po angielsku, jak aplikacja. | Oczka brak na liście udostępniania, wzór nie dotarł |
| U5 (dodatkowo, +8 min) | Pliki: `.docx` → Udostępnij → Oczko. Zdjęcia: 20 zdjęć naraz. Poczta: załącznik PDF. Tryb samolotowy → udostępnij stronę z Safari → wyłącz tryb → otwórz Oczko. | Wszystko dociera; bez sieci zlecenie czeka w skrzynce i trafia do projektu po powrocie sieci. | jak wyżej |

## D. iPad (bez Apple Pencil), ok. 18 min
| ID | Kroki | Oczekiwany wynik | Zgłoś |
|---|---|---|---|
| U1 | Otwórz wzór. Obróć pion/poziom. Potem Split View z inną aplikacją na ⅓ i ½ szerokości oraz Slide Over. Przejrzyj też licznik i Ustawienia w tych układach. | Wąskie okno wygląda jak telefon; w szerszych treść w kolumnie (nie rozciągnięta na całą szerokość); nic nie jest ucięte ani nie nachodzi na siebie. | zrzut każdego uciętego/nachodzącego elementu |
| U2 | Na wzorze włącz „Highlighter”; rysuj jednym palcem, przewijaj dwoma; „Undo last stroke”. Zamknij wzór i otwórz ponownie. | Jeden palec rysuje, dwa przewijają; „Undo last stroke” cofa kreskę; kreski zostają po ponownym otwarciu. | kreski znikają, dwa palce rysują |
| U8 | W trakcie rysowania wyjdź do ekranu głównego; wróć. Potem w trakcie rysowania zamknij aplikację z przełącznika aplikacji i otwórz ponownie. | Kreski odzyskane. | utracone kreski |
| U3 (iPad) | Jak U3 na iPhonie. | Jak wyżej. | jak wyżej |
| U7 (iPad) | Obróć iPada na liczniku i w Ustawieniach. | Na iPadzie obraca się wszystko. | ekran, który się nie obraca |
| U4 (dodatkowo, +5 min) | Jeśli masz duży PDF: „Add pattern” → „Choose file (PDF or Word)” → ten plik; przewiń do końca. | Otwiera się, przewija bez zacięć widocznych gołym okiem, aplikacja się nie zamyka. | czas otwarcia (w sekundach), zacięcia, zamknięcie |

## E. Zakupy (warunkowe), ok. 12 min
**Warunek:** produkty Oczko Pro i umowa Paid Apps w App Store Connect są gotowe ([DO USTALENIA] w `CLAUDE.md`). Bez tego cały blok: „nie sprawdzono”. Czy zakup w TestFlight jest bezpłatny (piaskownica) — [DO USTALENIA: potwierdzi rola 10 przed testem].
| ID | Kroki | Oczekiwany wynik | Zgłoś |
|---|---|---|---|
| TT-01 | Ustawienia → „Oczko Pro” → „Monthly” → kup. | Od razu „You have Oczko Pro.”; licznik bez limitu miesięcznego. | błąd zakupu, limit nadal |
| TT-03 | Włącz tryb samolotowy, zamknij aplikację z przełącznika, otwórz. | Pro działa. | Pro zniknął |
| TT-10 | Na iPadzie (to samo konto App Store): „Oczko Pro” → „Restore purchases”. | Pro działa na iPadzie. | brak Pro |
| TT-11 | Na iPhonie: Ustawienia → „Delete all data” → potwierdź. Potem „Oczko Pro” → „Restore purchases”. | Dane puste, Pro wraca. | dane zostały albo Pro nie wraca |
TT-04 (Family Sharing — potrzebny członek rodziny) i TT-05 (zwrot w piaskownicy, sposób [DO USTALENIA] OP-21) — „nie sprawdzono”, chyba że koordynator postanowi inaczej.

## F. iCloud, ok. 8 min
**Build TestFlight ma przełącznik „Sync with iCloud”** w Ustawieniach → „Data and sync” (`ICLOUD_W_1_0 = true` w buildzie TestFlight, P-290). Wynik TT-08 decyduje, czy przełącznik zostaje w 1.0 (ZM-06).
| ID | Kroki | Oczekiwany wynik | Zgłoś |
|---|---|---|---|
| TT-08 / BR-DAN-002/S1 (bramka ZM-06) | Włącz „Sync with iCloud” na obu urządzeniach. Na iPhonie +1 w projekcie. Otwórz Oczko na iPadzie (poczekaj do minuty). | Na iPadzie ten sam projekt i ta sama wartość. **Nie → iCloud zostaje ukryty w 1.0.** | wartość na iPadzie po 1 min |
| BR-DAN-002/S2 (dodatkowo, +5 min) | Tryb samolotowy na obu; +1 na iPhonie i +1 na iPadzie w tym samym projekcie; wyłącz tryb na obu. | Komunikat o dwóch wersjach („Two versions…”) z wyborem; nic nie znika po cichu. | jedna wersja zniknęła bez pytania |
BR-DAN-004/S1 (nowy telefon z kopii urządzenia) i stany „brak miejsca / wylogowane konto” — „nie sprawdzono” (wymagają innego telefonu albo zmiany konta).

## H. Zegarek (Apple Watch sparowany z iPhonem), ok. 12 min
Wykonaj po bloku B (wymaga zainstalowanego buildu i projektu na iPhonie); przed blokiem G (G usuwa dane). Zegarek liczy rzędy bez iPhone'a: kolejka zmian jest po stronie zegarka (ADR-0009). **Zasada kroku „telefon poza zasięgiem”:** włącz na iPhonie tryb samolotowy i wyłącz Bluetooth albo zostaw iPhone'a w innym pokoju (ponad ok. 10 m); sam tryb samolotowy zegarka z siecią Wi‑Fi może nadal łączyć go z telefonem. **Między stuknięciami +1 zostaw ok. 3 s** (3 dodania w 2 s to seria, którą strażnik RD‑17 liczy inaczej).
| ID | Kroki | Oczekiwany wynik | Zgłoś |
|---|---|---|---|
| TT-13 / BR-LIC-015/S1 + BR-DAN-011/S2 | Na iPhonie projekt z licznikiem **10** (menu licznika → „Enter the row number”, pole „Rows already finished”). Telefon poza zasięgiem (zasada wyżej). Na zegarku otwórz Oczko i stuknij „+1 row” **3 razy** (przerwa ok. 3 s). Przyjrzyj się linii pod liczbą. Potem przywróć telefon (wyłącz tryb samolotowy, włącz Bluetooth), odblokuj iPhone'a i poczekaj do minuty. Otwórz projekt na iPhonie. | Zegarek: 13, a pod liczbą cicha linia „iPhone not nearby. 3 changes are saved on this watch.” (bez koloru ostrzegawczego). Po powrocie telefonu linia znika, a **iPhone pokazuje 13** (NFR-ZEG-001). | inna liczba na zegarku lub iPhonie, brak linii, linia nie znika po minucie, **czas do zniknięcia linii w sekundach** |
| TT-14 / BR-LIC-015/S2 | Na iPhonie w tym samym projekcie (licznik 10) dodaj przypomnienie: menu licznika → „Add a reminder (“every N rows”)”: od rzędu **12**, co **6**, **8** razy, tekst „decrease at both ends” (jak scenariusz E2E 15). Telefon w zasięgu. Odczekaj chwilę na zegarku (stan z telefonu dochodzi jako kontekst), stuknij na zegarku „+1 row” (10 → 11). | Zegarek **wibruje** przy wejściu w rząd z przypomnieniem; w miejscu podpisu „Now row 12” pas „Row 12: decrease at both ends · 1 of 8”. Wibracja jest odczuwalna na nadgarstku. | brak wibracji, brak pasa, inny numer rzędu lub „k z N”, zegarek nie widzi przypomnienia po minucie |
| TT-15 / BR-ZAK-001/S4 (**warunkowe, rozłożone w czasie**) | Warunek: Pro kupione w piaskownicy (blok E) **i** darmowe dni miesiąca wyczerpane przed zakupem (liczenie w 5 różnych dniach bez Pro). Telefon poza zasięgiem; w nowym dniu pierwszy „+1 row” na zegarku. | Rząd dodany, bez komunikatu o skończonych darmowych dniach (zegarek odczytuje Pro bez telefonu; sposób: OP-22). | komunikat o limicie przy aktywnym Pro |
TT-15 bez spełnionego warunku (pięć dni) — „nie sprawdzono”; ryzyko szczątkowe: wektory Pro na zegarku i złote pliki stanu (`tests/wspolne`, Z07-12), sposób odczytu Pro na zegarku [DO USTALENIA] w OP-22 (rola 02). Nie ma sposobu na skrócenie warunku na jednym urządzeniu: dni limitu liczą dni kalendarzowe, a zegar urządzenia testowego nie jest cofany.

## G. Instalacja od zera — iPhone, ok. 12 min (koniecznie na końcu: usuwa dane testów)
| ID | Kroki | Oczekiwany wynik | Zgłoś |
|---|---|---|---|
| U12 | Usuń Oczko z telefonu. Zainstaluj z TestFlight. Otwórz i **natychmiast, gdy widać licznik**, stuknij „+1 row” raz. Powtórz całość 3×. | Za każdym razem liczba 1 — stuknięcie nie ginie (CI raz pokazało 0 po zimnym starcie, przebieg 126). | **ważne:** która próba dała 0, zrzut |
| U9 | Usuń, zainstaluj, otwórz i od razu wyjdź do ekranu głównego; otwórz ponownie. Powtórz 3× (między próbami możesz zamknąć aplikację z przełącznika). | Za każdym razem licznik albo lista projektów, nigdy ekran trybu awaryjnego. | zrzut ekranu trybu awaryjnego |
| TT-02 (warunkowe, jak blok E) | Po ostatniej instalacji otwórz aplikację **bez** „Restore purchases”. | Pro działa (uprawnienia bieżące). | brak Pro |

## Nie sprawdzamy na tym etapie (z powodem)
- Zegarek: **nie sprawdzamy** nieudanego zapisu stuknięcia na zegarku (komunikat „Row N wasn’t added”, P-142 (1b); wymaga pełnej pamięci zegarka), pracy zegarka przez wiele godzin bez iPhone'a ani baterii. TT-15 — tylko po spełnieniu warunku. Poprzednie „brak zegarka” (P-290) zostało skorygowane przez P-316: masz Apple Watch.
- TT-06 — od kolejnego buildu nowej wersji.
- TT-04, TT-05, BR-DAN-004/S1, stany iCloud bez miejsca/konta — wyżej.

## Wyniki (do wypełnienia)
Build: ____ · data: ____ · iPhone (model, iOS): ____ · iPad (model, iPadOS): ____ · Apple Watch (model, watchOS): ____
| ID | Wynik (tak / nie / nie sprawdzono) | Uwagi / zrzut |
|---|---|---|
| TT-07 | | |
| TT-12 (ikona i instalacja na zegarku) | | |
| U7 | | |
| TT-09 | | |
| U11 | | |
| U10 | | |
| U6 | | |
| U3 (iPhone / iPad) | | |
| U5 (obowiązkowe / dodatkowe) | | |
| U1 | | |
| U2 | | |
| U8 | | |
| U7 (iPad) | | |
| U4 | | |
| TT-01 | | |
| TT-03 | | |
| TT-10 | | |
| TT-11 | | |
| TT-08 / BR-DAN-002/S1 | | |
| BR-DAN-002/S2 | | |
| TT-13 (zegarek bez telefonu; czas zniknięcia linii: ___ s) | | |
| TT-14 (przypomnienie i wibracja) | | |
| TT-15 (Pro na zegarku, warunkowe) | | |
| U12 | | |
| U9 | | |
| TT-02 | | |
