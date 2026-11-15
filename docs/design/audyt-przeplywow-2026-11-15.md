# Audyt: Studio Projektowe (UX, marka, przepływy) — Oczko — 2026-11-15

Commit: a117ded0 (integracja `claude/youthful-pasteur-kx83sn`) · Tryb: audit, zakres zawężony poleceniem BY do przepływów użytkownika · Sesja BY
Środowisko: Linux 6.18.44, Node v22.23.4, Playwright 1.63.0 z Chromium. Expo web nie działa (w `package.json` nie ma `react-native-web` ani `react-dom`), symulatora iOS i Xcode brak. Obraz aplikacji pochodzi z artefaktów CI „Jakość · iOS”, przebieg 188 (zielony, SHA 104f8764; różnica do a117ded0 to same dokumenty, `git diff --stat`): `e2e-czesc-1-iphone` (121 zrzutów, 22 scenariusze) i `e2e-czesc-1-ipad` (16 zrzutów, 3 scenariusze). Zrzuty w tym raporcie to arkusze zbiorcze w `docs/design/audyt-przeplywow-2026-11-15/`; ścieżki `zrzuty/…` liczą się od tego katalogu.

## Podsumowanie

Aplikacja ma spójny mechanizm wyjścia z ekranów (17 tras ze stanem wczytywania i błędu z przyciskiem wyjścia, formularze z pytaniem przed odrzuceniem zmian), a mimo to jeden stan — menu źródeł wzoru — nie ma żadnej kontrolki wyjścia i wchodzi się na niego z czterech miejsc. To ten sam błąd, który właściciel zgłosił w buildzie 1171 (naprawia sesja BW); recenzja wskazała dwa wejścia, których zgłoszenie nie obejmowało. Drugie realne ryzyko to data w formacie ISO pokazywana jako nazwa części po nazwaniu projektu. Pozostałe znaleziska to szlif. Na prawdziwej aplikacji nie sprawdzono jasnego motywu, największego tekstu, VoiceOver ani zegarka (tylko kod i makiety) — to obniża pewność werdyktu dla tych obszarów.

Poziomy według polecenia BY: P1 = użytkownik utknie albo straci dane, P2 = wyraźnie gorsza jakość, P3 = szlif. Po niezależnej recenzji: P1: 1, P2: 2, P3: 4.

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 04-studio-projektowe-001 | P1 | D | Menu źródeł wzoru nie ma przycisku wyjścia (cztery wejścia) | otwarte (naprawia BW; dwa wejścia do dopisania) |
| 04-studio-projektowe-002 | P2 | D | Data ISO jako nazwa części wychodzi na ekran po nazwaniu projektu | otwarte |
| 04-studio-projektowe-003 | P2 | P | "Dodaj wzór" przed pierwszym rzędem prowadzi na pustą listę projektów bez wyjaśnienia | otwarte |
| 04-studio-projektowe-004 | P3 | P | Karta ukończenia nie pozwala cofnąć pomyłki ani nie mówi, jak ją cofnąć | otwarte |
| 04-studio-projektowe-005 | P3 | D | Systemowe kalendarze: inny początek tygodnia i inny język niż reszta aplikacji | otwarte |
| 04-studio-projektowe-006 | P3 | D | Systemowy niebieski akcent w kalendarzach i kursorze pól zamiast akcentu z tokenów | otwarte |
| 04-studio-projektowe-007 | P3 | D | Arkusz nazwy: "Część" nad "Projektem", odwrotnie niż w makiecie i w menu | otwarte |

## Linia bazowa i założenia

**Kontekst użycia głównego przepływu (liczenie rzędów):** ręce zajęte robótką, spojrzenie krótkie, jedna ręka albo kciuk, sesja długa, często wieczorem. Wynika z tego: wyjście z każdego ekranu musi być widocznym przyciskiem (gest od krawędzi wymaga wolnej ręki i wiedzy, że istnieje), a nazwy na liczniku muszą być zrozumiałe na jedno spojrzenie.

**Wymiary pokrycia:**

| Wymiar | Wynik |
|---|---|
| Konteksty użycia głównych przepływów | Sprawdzone w kodzie i na zrzutach: licznik ma "+1" w zasięgu kciuka, ekran nie gaśnie (ustawienie widoczne na `zrzuty/arkusz-C.png`). Znalezisko 001 (wyjście tylko gestem). |
| Stany kluczowych ekranów | Pierwsze uruchomienie, pusty, błąd wczytania, brak konta iCloud, brak miejsca iCloud, konflikt: sprawdzone (arkusze A, C, D, E). Znaleziska 001, 003. Dużo danych, offline: nie sprawdzono. |
| Element firmowy (dzianina) | Widoczny na "Dziś", liczniku i projekcie, niesie liczbę rzędów; opis VoiceOver istnieje w słowniku (`dzis.dzianina_a11y_*`). Sprawdzone, brak znalezisk. |
| Podłogi dostępności | Poza poleceniem BY poza alternatywą gestu (001). Kontrast, cele dotykowe, AX5: nie sprawdzono w tej sesji. |
| Ruch, haptyka, dźwięk | Nie sprawdzono (poza poleceniem BY). |
| Obecność poza ekranami | Zegarek: przeczytany `targets/watch/Aplikacja.swift` — jeden ekran, bez nawigacji, stany: licznik, blokada, limit, błąd zapisu, "otwórz iPhone'a"; ślepych zaułków w kodzie brak. Na urządzeniu nie sprawdzono. Widżet, ekran blokady: nie sprawdzono. |
| Głos i teksty | Sprawdzone teksty stanów pustych i błędów w `src/i18n/slowniki/pl.json` (sekcje dzis, projekty, wspolne, menu, ukonczenie). Znaleziska 002, 003, 004. |
| Motyw ciemny i zwiększony kontrast | Zrzuty CI są w motywie ciemnym; jasnego i zwiększonego kontrastu na aplikacji nie sprawdzono. |
| Lokalizacja | Znaleziska 002 (data ISO niezależna od języka) i 005 (kalendarze). Najdłuższy język: nie sprawdzono. |

**Soczewki:** (1) osoba z zajętymi rękami — 001; (2) VoiceOver i największy tekst — tylko kod, bez znalezisk powyżej progu pewności; (3) krytyk szablonu — poza poleceniem BY; (4) nowa osoba w pierwszych minutach — 002, 003, 007. Subagentów do linii bazowej nie użyto (pułap kosztu); jedno niezależne spojrzenie to recenzja znalezisk (niżej).

**Wzorzec najlepszych:** HIG wymaga, żeby każdy gest miał alternatywę w postaci przycisku, a standardowe elementy zachowywały położenie platformy (prompt roli, "Podłogi dostępności" i zasada 3). Aplikacja wyłącza systemowy pasek nawigacji dla całego stosu i rysuje własne przyciski, więc gwarancję platformy zastępuje dyscypliną — stąd 001. Stron HIG w tej sesji nie otwierano; odwołania do HIG pochodzą z promptu roli.

**Rejestr założeń:** nie proponuję zmian statusu w `docs/zalozenia.md` (nie czytany w tej sesji).

## Pokrycie (co sprawdzono, czego nie)

| Obszar / pliki / ekrany | Sprawdzone? | Jak |
|---|---|---|
| Nawigacja: 31 tras w `app/`, opcje stosu | tak | odczyt `app/_layout.tsx`, grep wyjść we wszystkich trasach; recenzent przeszedł trasy i stany drugi raz |
| "Dziś", licznik, wzór (iPhone) | tak | kod + `zrzuty/arkusz-A.png` |
| Projekt, termin, narzędzia, próbka, historia | tak | kod + `zrzuty/arkusz-B.png` |
| Zakup (uczciwe zasady, oferty), ukończenie, ustawienia, import, konflikt iCloud | tak, bez samego zakupu | kod + `zrzuty/arkusz-C.png` |
| Dane i synchronizacja, przewodnik, zdjęcia, szczegóły projektu | tak | `zrzuty/arkusz-D.png` |
| Formularze, odrzucenie zmian, lista projektów | tak | kod + `zrzuty/arkusz-E.png` |
| iPad: wzór poziomo i pionowo, "Dziś", licznik | częściowo (4 zrzuty) | `zrzuty/arkusz-F.png` |
| Zegarek | tylko kod | `targets/watch/Aplikacja.swift` |
| Jasny motyw, AX5, VoiceOver na aplikacji | nie | scenariusze 29 i 30 są w częściach 2–3 artefaktów (po ok. 250 MB), nie pobrane |
| Zapas włóczek i drutów, kosz, sesje i korekta, eksport, usunięcie wszystkiego, zgłoszenie problemu, język, miary | tylko obecność wyjścia w kodzie | grep; treści ekranów nie oceniano |
| Rozszerzenie udostępniania, widżet, aktywność na żywo | nie | — |
| Stan CI na `main` (zasada 21) | nie | poza poleceniem BY; na gałęzi integracji "Jakość · iOS" 188 i "Zrzuty sklepu" 27 są zielone |

## Kontrola dowodów i sekretów

`node sprawdz-raport.mjs docs/design/audyt-przeplywow-2026-11-15.md . docs/design/audyt-przeplywow-2026-11-15 --rola 04-studio-projektowe` → kod 0: "OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 04-studio-projektowe" (kopia skryptu w scratchpadzie sesji, poza repo).

`git status --porcelain` przed zapisem dokumentów audytu: pusty wynik — pliki śledzone nietknięte. Sesja zmienia wyłącznie: ten raport, katalog arkuszy obok niego i trzy wiersze w `docs/decyzje.md` (P-839…P-841).

## Stosowalność listy kontrolnej

Polecenie BY zawęża audyt do przepływów; pozycje spoza tego zakresu mają status "nie sprawdzono" i nie są oceną "w porządku".

| Pozycja | Status | Wynik |
|---|---|---|
| SP-01 | dotyczy | ok dla sprawdzonych tras (tabela przepływów w "Przypadkach użycia"); osieroconych ekranów nie znaleziono |
| SP-02 | dotyczy | ok na zrzutach (dzianina niesie liczbę rzędów); pełnej kontroli nie robiono |
| SP-03 | dotyczy | 04-studio-projektowe-006 (tylko ten przypadek; pełnego grepa stylów nie robiono) |
| SP-04, SP-05, SP-06, SP-07, SP-08 | dotyczy | nie sprawdzono — poza poleceniem BY |
| SP-09 | dotyczy | ok w sprawdzonych arkuszach (Anuluj / Zapisz / Dodaj, "Odrzucić zmiany?"); do sprawdzenia: położenie "Zamknij" |
| SP-10 | dotyczy | 04-studio-projektowe-001, 04-studio-projektowe-003 |
| SP-11 | dotyczy | 04-studio-projektowe-002, 04-studio-projektowe-004 |
| SP-12 | dotyczy | nie sprawdzono — poza poleceniem BY |
| SP-13 | dotyczy (linia bazowa: 96 zrzutów w `docs/design/dzianina/wzorce-zrzuty/`) | 04-studio-projektowe-007; porównania par zrzutów ekran po ekranie nie robiono |
| SP-14, SP-16, SP-21 | dotyczy | nie sprawdzono — poza poleceniem BY |
| SP-15 | dotyczy | 04-studio-projektowe-001, 04-studio-projektowe-005 |
| SP-17 | dotyczy (ręce zajęte) | 04-studio-projektowe-001; sam licznik ok na zrzutach |
| SP-18 | dotyczy | nie sprawdzono na urządzeniu; w kodzie przyciski wyjścia mają role i etykiety |
| SP-19, SP-20, SP-22 | poza promptem (moduł `przeplywy-i-gesty` niewłączony) | — |

## Znaleziska (szczegóły)

### 04-studio-projektowe-001 · Menu źródeł wzoru nie ma przycisku wyjścia; wchodzi się na nie z czterech miejsc
- Pozycja listy kontrolnej: SP-15
- Poziom: P1
- Realność: realny (właściciel utknął w buildzie 1171) · Pewność: wysoka
- Rodzaj: D
- Dowód: gałąź bez otwartego wzoru rysuje sam `ScrollView` z listą źródeł, bez paska i bez przycisku — `app/wzor.tsx:165-175`. Pasek systemowy jest wyłączony dla całego stosu — `app/_layout.tsx:122`. Zrzut: `zrzuty/arkusz-A.png`, czwarty ekran (nagłówek "Pattern", brak "wstecz"). Gest od krawędzi działa, bo blokada wyjścia obejmuje tylko otwarty wzór — `app/wzor.tsx:137`.
- Mechanizm: stos ma `headerShown: false`, więc każda gałąź renderowania musi sama narysować wyjście; tu jedna gałąź tego nie robi. Wejścia: (1) kafel "Dodaj wzór" na "Dziś" — `app/(zakladki)/index.tsx:73-74`; (2) przycisk "Wzór" na liczniku w projekcie bez wzoru — `app/licznik.tsx:64`; (3) "Pokaż" w przewodniku — `app/przewodnik.tsx:42`; (4) ekran projektu, "Dodaj wzór", źródło, anulowany wybór pliku albo zdjęć: import kończy się bez powrotu i zostaje menu — `src/kompozycja/wzor-import-trasy.ts:45-61` (powrót jest tylko po udanym imporcie, `src/kompozycja/wzor-import-trasy.ts:78`). Przegląd pozostałych tras (mój i recenzenta): innej gałęzi bez wyjścia nie znaleziono.
- Powraca: tak — zgłoszenie właściciela z testu 1171 (naprawia sesja BW) → trwała kontrola w teście akceptacyjnym niżej.
- Wzorzec lub źródło: prompt roli, "Podłogi dostępności": każdy gest ma alternatywę w postaci przycisku; komentarz w kodzie sam zakłada powrót ("wstecz wraca na licznik") — `app/(zakladki)/index.tsx:69`.
- Kroki w aplikacji: "Dziś" → "Dodaj wzór" (albo licznik → "Wzór" w projekcie bez wzoru) → ekran "Wzór" bez przycisku powrotu.
- Opcje: (a) ten sam przycisk "Wstecz" co w przeglądarce wzoru, w każdej gałęzi trasy — spójne, najmniejsza zmiana; (b) menu źródeł jako arkusz z "Anuluj" — zgodne ze słownikiem interakcji, ale zmienia model ekranu z decyzji ZM-06. Rekomendacja: (a), a wejście (4) dodatkowo wraca na ekran projektu po anulowaniu wyboru.
- Test akceptacyjny: (1) test komponentu trasy `wzor`: w stanie bez wzoru istnieje element o roli przycisku z etykietą "Wstecz" i woła powrót; (2) scenariusz E2E: wejście każdą z czterech dróg i powrót przyciskiem; (3) kontrola trwała: test, który dla każdej trasy `app/` i każdej jej gałęzi renderowania wymaga kontrolki wyjścia (Wstecz / Zamknij / Anuluj / Gotowe), żeby następny ekran bez wyjścia nie przeszedł `verify`.
- Status: otwarte (część w naprawie przez BW)

### 04-studio-projektowe-002 · Data w formacie ISO jako nazwa części wychodzi na ekran, gdy użytkowniczka nazwie tylko projekt
- Pozycja listy kontrolnej: SP-11
- Poziom: P2
- Realność: realny (każda osoba, która nazwie projekt i zostawi pole części puste) · Pewność: wysoka
- Rodzaj: D
- Dowód: część projektu roboczego dostaje jako nazwę dzień w formacie RRRR-MM-DD — `src/przypadki-uzycia/licznik.ts:180`. Licznik ukrywa ją tylko, dopóki projekt jest nienazwany — `src/kompozycja/licznik.ts:55`. Arkusz nazwy pokazuje oba pola puste i przy pustym polu części nazwy nie zmienia — `app/formularz/[rodzaj].tsx:121-125`; nazwanie projektu zdejmuje flagę — `src/przypadki-uzycia/projekt.ts:52`. Zrzuty: `zrzuty/arkusz-E.png`, czwarty ekran (licznik "Harbor", pod nim "2026-11-10"); `zrzuty/arkusz-A.png`, drugi ekran ("Dziś": "2026-11-10, row 3"); `zrzuty/arkusz-B.png`, pierwszy ekran (ekran projektu jeszcze nienazwanego: część "2026-10-21").
- Mechanizm: jedna flaga `nienazwany` na projekcie steruje pokazywaniem nazwy części. Skutki: (1) po nazwaniu projektu data ISO jest widoczna na liczniku, na "Dziś" i na ekranie projektu; (2) ekran projektu pokazuje ją zawsze — `src/ekrany/Projekt.tsx:161`; (3) odwrotnie: wpisana sama nazwa części (bez projektu) zapisuje się, ale licznik i "Dziś" dalej jej nie pokazują — zapis bez widocznego skutku. Format nie zależy od języka (35 lokalizacji).
- Powraca: nie
- Wzorzec lub źródło: prompt roli, "Głos interfejsu": słowa użytkownika, nie systemu; `docs/design/design-spec.md` opisuje, że nazwa części roboczej (data) nie jest pokazywana (komentarz w `src/kompozycja/licznik.ts:55`).
- Kroki w aplikacji: pierwsze "+1" → licznik → "•••" → "Nazwij projekt i część" → wpisz tylko projekt → Zapisz.
- Opcje: (a) część z nazwą domyślną traktować jak nienazwaną wszędzie (własna flaga części albo porównanie z dniem utworzenia) i nie pokazywać jej, dopóki projekt ma jedną część — bez nowych tekstów; (b) nazwa domyślna z istniejącego klucza `formularz.nazwa_czesc_n` ("Część 1") — czytelna, ale zmienia dane nowych projektów i wymaga decyzji o już zapisanych; (c) w arkuszu nazwy wypełnić pole części propozycją "Część 1". Rekomendacja: (a) dla wyświetlania plus (c) w arkuszu; w obu wypadkach sama część wpisana bez projektu ma być widoczna.
- Test akceptacyjny: po nazwaniu samego projektu na liczniku, "Dziś" i ekranie projektu nie ma tekstu pasującego do wzorca RRRR-MM-DD jako nazwy części; po wpisaniu samej części jest ona widoczna na liczniku.
- Status: otwarte

### 04-studio-projektowe-003 · "Dodaj wzór" przed pierwszym rzędem przenosi na pustą listę projektów bez słowa wyjaśnienia
- Pozycja listy kontrolnej: SP-10
- Poziom: P2
- Realność: realny (pierwsze minuty z aplikacją; kafel jest widoczny od pierwszego uruchomienia) · Pewność: wysoka z kodu, bez zrzutu tego kroku
- Rodzaj: P
- Dowód: bez bieżącego licznika kafel przełącza na zakładkę "Projekty" — `app/(zakladki)/index.tsx:72`. Licznik powstaje dopiero przy pierwszym "+1" — `src/kompozycja/licznik.ts:176`. Pusta lista pokazuje tekst "Brak projektów. Pierwszy rząd go założy." — `src/i18n/slowniki/pl.json:246`, `src/ekrany/ListaProjektow.tsx:86`. Kafel na pierwszym uruchomieniu: `zrzuty/arkusz-A.png`, pierwszy ekran.
- Mechanizm: decyzje P-588 (c) i P-593 ustalają, że kafel otwiera menu źródeł bieżącego projektu, a bez niego prowadzi do "Projektów"; stanu "nie ma jeszcze żadnego projektu" nie rozstrzygają. Ten sam skok bez wyjaśnienia dotyczy osoby, która skończyła pracę na liście projektów (warunek `lista` w tej samej linii).
- Powraca: nie
- Wzorzec lub źródło: prompt roli, macierz stanów pkt 2 (pierwsze użycie: zaproszenie do pierwszej akcji) i "Głos interfejsu" (pusty ekran zaprasza do działania).
- Kroki w aplikacji: pierwsze uruchomienie → "Dziś" → kafel "Dodaj wzór" → zakładka "Projekty" z pustą listą.
- Opcje: (a) kafel zakłada projekt roboczy tak jak pierwsze "+1" i otwiera menu źródeł — zgodne z obietnicą karty ("Projekt nazwiesz później"), ale tworzy projekt bez rzędu; (b) zostaje skok do "Projektów", a pusta lista i lista z projektami dostają jedno zdanie celu ("Wybierz projekt, do którego dodać wzór" / "Najpierw załóż projekt") — tańsze, o krok dłuższe; (c) kafel ukryty do pierwszego projektu — najprostsze, ale chowa funkcję. Rekomendacja: (a); decyzja należy do roli 03 i koordynatora, bo zmienia P-588 (c).
- Test akceptacyjny: po stuknięciu kafla na świeżej instalacji użytkowniczka widzi źródła wzoru albo zdanie, które mówi, co zrobić, żeby dodać wzór; scenariusz E2E dla świeżej instalacji.
- Status: otwarte

### 04-studio-projektowe-004 · Karta ukończenia nie pozwala cofnąć pomyłki ani nie mówi, jak ją cofnąć
- Pozycja listy kontrolnej: SP-11
- Poziom: P3
- Realność: brzegowy (omyłkowe stuknięcie w menu licznika; dane nie giną) · Pewność: wysoka
- Rodzaj: P
- Dowód: "Oznacz projekt jako ukończony" zapisuje od razu — `app/menu.tsx:54-58`; brak pytania to decyzja P-255 (2). Karta ma jeden przycisk "Gotowe" — `src/ekrany/Ukonczenie.tsx:50`, a gest zamknięcia jest wyłączony — `app/_layout.tsx:133`. Cofnięcie istnieje jako "Wznów projekt" w menu ekranu projektu — `src/ekrany/Projekt.tsx:98`; karta o tym nie mówi, mówi dopiero przewodnik — `src/i18n/slowniki/pl.json:1285`. Zrzut: `zrzuty/arkusz-C.png`, trzeci ekran.
- Mechanizm: akcja bez potwierdzenia i bez "Cofnij" w miejscu, gdzie się ją wykonuje; zerowanie licznika w tym samym menu pyta o potwierdzenie.
- Powraca: nie
- Wzorzec lub źródło: prompt roli, słownik interakcji: rutynowa akcja ma "Cofnij" bez pytania albo potwierdzenie.
- Kroki w aplikacji: licznik → "•••" → "Oznacz projekt jako ukończony" → karta z samym "Gotowe".
- Opcje: (a) na karcie drugi, tekstowy przycisk "Wznów projekt" — jeden istniejący klucz, bez zmiany P-255; (b) zdanie pod kartą, gdzie jest "Wznów projekt" — bez nowej akcji, ale wymaga czytania; (c) bez zmian — decyzja P-255 zostaje w całości. Rekomendacja: (a).
- Test akceptacyjny: z karty ukończenia da się jednym stuknięciem przywrócić projekt do "W toku"; test komponentu karty.
- Status: otwarte

### 04-studio-projektowe-005 · Systemowe kalendarze mają inny początek tygodnia i inny język niż reszta aplikacji
- Pozycja listy kontrolnej: SP-15
- Poziom: P3
- Realność: realny dla języków i regionów z tygodniem od niedzieli (rynek globalny), brzegowy dla telefonu po polsku · Pewność: wysoka dla zrzutu en, średnia dla pozostałych języków (nie sprawdzono na urządzeniu)
- Rodzaj: D
- Dowód: kalendarz terminu zaczyna tydzień od niedzieli — `zrzuty/arkusz-B.png`, drugi ekran; kalendarz "Historii" zawsze od poniedziałku, z podpisem — ten sam arkusz, piąty ekran, `src/ekrany/HistoriaDni.tsx:71`, `src/i18n/slowniki/pl.json:566`. Termin dostaje język aplikacji — `src/ekrany/FormularzeProjektu.tsx:198`; kalendarz daty ukończenia i wybór czasu w korekcie sesji nie dostają go wcale — `src/ekrany/Projekt.tsx:237`, `src/ekrany/Formularze.tsx:171`.
- Mechanizm: trzy systemowe wybory daty skonfigurowane na trzy sposoby; dwa z nich przy języku aplikacji innym niż systemowy pokażą miesiące i dni w języku systemu. Systemowy wybór daty to decyzja P-186; zgodności z regułą "tydzień od poniedziałku" nikt nie rozstrzygnął.
- Powraca: nie
- Wzorzec lub źródło: prompt roli, "Wymiary pokrycia": lokalizacja — formaty dat.
- Kroki w aplikacji: projekt → "Termin" (albo data ukończenia, albo korekta sesji) przy języku angielskim.
- Opcje: (a) wszystkie trzy dostają język aplikacji, a kalendarze pierwszy dzień tygodnia zgodny z "Historią" (o ile biblioteka w wersji 9.1.0 to umożliwia — do sprawdzenia w jej dokumentacji); (b) "Historia" przechodzi na początek tygodnia z regionu — zmienia regułę RD-20. Rekomendacja: (a).
- Test akceptacyjny: test komponentów: każdy `DateTimePicker` w `src/ekrany/` dostaje `locale`; zrzut terminu w en-US z tygodniem zgodnym z "Historią".
- Status: otwarte

### 04-studio-projektowe-006 · Systemowy niebieski akcent w kalendarzach i kursorze pól zamiast akcentu z tokenów
- Pozycja listy kontrolnej: SP-03
- Poziom: P3
- Realność: realny · Pewność: wysoka (zrzuty)
- Rodzaj: D
- Dowód: niebieskie "dziś", strzałki i miesiąc w kalendarzu terminu — `zrzuty/arkusz-B.png`, drugi ekran; niebieski kursor w polu liczby — `zrzuty/arkusz-E.png`, drugi ekran. Kalendarze bez koloru akcentu — `src/ekrany/FormularzeProjektu.tsx:198`, `src/ekrany/Projekt.tsx:237`.
- Mechanizm: kontrolki natywne biorą systemowy kolor akcentu, bo aplikacja nie ustawia własnego; recenzent nie znalazł w `src/` ani `app/` ustawienia `selectionColor` ani globalnego tintu.
- Powraca: nie
- Wzorzec lub źródło: zasada studia 6 (jeden akcent interfejsu); `docs/design/dzianina/design-spec.md` (tokeny).
- Kroki w aplikacji: projekt → "Termin"; dowolne pole tekstowe.
- Opcje: (a) akcent z tokenów przekazany do kalendarzy i pól (jedno miejsce w komponencie `Pole` i dwa kalendarze) — po pomiarze kontrastu akcentu na tle arkusza; (b) globalny kolor akcentu w konfiguracji iOS — obejmuje też przyszłe kontrolki. Rekomendacja: (b), jeśli kontrast akcentu spełnia 3:1 na tłach arkuszy; inaczej (a) z wariantem.
- Test akceptacyjny: zrzut terminu i pola w edycji bez systemowego niebieskiego; wynik `kontrast.mjs` dla pary akcent / tło arkusza.
- Status: otwarte

### 04-studio-projektowe-007 · W arkuszu nazwy pole "Część" stoi nad "Projektem", odwrotnie niż w makiecie i w nazwie pozycji menu
- Pozycja listy kontrolnej: SP-13
- Poziom: P3
- Realność: realny · Pewność: wysoka
- Rodzaj: D
- Dowód: kolejność pól w kodzie — `src/ekrany/Formularze.tsx:209-210`; makieta ma "Project" nad "Part" — `docs/design/prototyp.html:130`; pozycja menu nazywa się "Nazwij projekt i część" — `src/i18n/slowniki/pl.json:320`. Arkusz "Nowy projekt" zaczyna od projektu (`zrzuty/arkusz-E.png`, pierwszy ekran).
- Mechanizm: kolejność pól odwrócona względem hierarchii projekt → część; razem z 002 sprzyja temu, że użytkowniczka wypełni jedno pole i dostanie nieoczekiwany wynik. Decyzji o kolejności recenzent nie znalazł.
- Powraca: nie
- Wzorzec lub źródło: prompt roli, "Warsztat grafika": najważniejsze u góry; makieta źródłowa.
- Kroki w aplikacji: licznik → "•••" → "Nazwij projekt i część".
- Opcje: (a) "Projekt" nad "Częścią" jak w makiecie; (b) zostaje, z zapisaną decyzją i powodem. Rekomendacja: (a).
- Test akceptacyjny: test komponentu `FormularzNazwy`: pierwsze pole to "Projekt".
- Status: otwarte

## Recenzja niezależna (zadanie 3 polecenia BY)

Subagent dostał siedem tez bez uzasadnienia i polecenie ich obalenia (kod, `docs/decyzje.md`, oba pliki `design-spec`). Wynik: żadna teza nie została obalona w całości; trzy skorygowano.

| Teza | Werdykt recenzenta | Co zmieniło w raporcie |
|---|---|---|
| 001 menu źródeł bez wyjścia | potwierdzona | dopisane dwa wejścia: przewodnik "Pokaż" i anulowany wybór pliku z ekranu projektu |
| 002 data ISO jako nazwa części | potwierdzona | dopisany skutek odwrotny (sama część bez projektu niewidoczna) |
| 003 "Dodaj wzór" → pusta lista | potwierdzona; samo przekierowanie to decyzja P-588 (c) / P-593 | rodzaj P, opcja (a) wymaga zmiany decyzji |
| 004 ukończenie bez cofnięcia | potwierdzona; brak potwierdzenia to decyzja P-255 (2) | poziom P3, opcje nie ruszają P-255 |
| 005 początek tygodnia | częściowo: termin bierze język aplikacji, nie region systemu | mechanizm poprawiony; dopisane dwa wybory daty bez `locale` |
| 006 niebieski akcent | częściowo: nie jedyne miejsce | dopisany drugi kalendarz i kursor pól |
| 007 kolejność pól | potwierdzona; makieta ma odwrotnie | dowód z `docs/design/prototyp.html` |

Odwołania recenzenta do plików sprawdziłem wyrywkowo (21 linii) przed wpisaniem; jedno (numer linii decyzji o koszu) się nie zgadzało i nie zostało użyte.

## Do sprawdzenia (pewność ≤ 80%)

1. Kafel "Dodaj wzór" w projekcie, który ma już wzory: menu dostaje pustą listę wzorów (`app/wzor.tsx:170`), a stuknięcie w wiersz "Dodaj wzór" zwija menu (`src/ekrany/WzorGrupa.tsx:61`) — zostaje jeden wiersz. Wskazał recenzent; brak zrzutu.
2. Stan "wczytywanie" pokazuje przycisk wyjścia dopiero po błędzie (`src/ekrany/StanWczytywania.tsx:33`); przy zawieszonym odczycie zostaje gest. Teoretyczne, dopóki odczyty kończą się wynikiem.
3. iPad: ekrany poza wzorem zajmują kolumnę ok. jednej trzeciej szerokości, a piąty przycisk akcji licznika zawija się do drugiego rzędu (`zrzuty/arkusz-F.png`, trzeci i czwarty ekran). Nie ustaliłem, czy to okno zwężone przez scenariusz 46, czy pełny ekran; decyzji o szerokości kolumny nie szukałem w całym rejestrze.
4. Położenie "Zamknij": "Oczko Pro" ma znak zamknięcia w prawym górnym rogu, "Dane i synchronizacja" tekst "Zamknij" na dole (`zrzuty/arkusz-C.png` drugi ekran, `zrzuty/arkusz-D.png` pierwszy). Słownik interakcji studia mówi o prawym górnym rogu; nie sprawdziłem, czy projekt zapisał wyjątek.
5. Jasny motyw, AX5 i VoiceOver na prawdziwej aplikacji: scenariusze 29 i 30 z części 2–3 artefaktów CI, niepobrane.
6. Zegarek na urządzeniu (watchOS 10.6.2 właściciela): tylko kod.

## Przypadki użycia do katalogu `docs/jakosc/przypadki-uzycia.md` (lista dla sesji BX; pliku nie edytowałem)

| Nr | Przypadek | Wejście → wyjście | Uwagi z audytu |
|---|---|---|---|
| 1 | Pierwszy rząd bez zakładania projektu | "Dziś" → "+1" na karcie | — |
| 2 | Otwarcie licznika i liczenie | "Dziś" → "Otwórz licznik" / "Kontynuuj" → "+1", "−1" → "Dziś" | — |
| 3 | Powrót po zamknięciu aplikacji na wzorze | "Kontynuuj" → wzór, "Wstecz" → licznik | — |
| 4 | Nazwanie projektu i części | licznik → "•••" → arkusz nazwy → Zapisz / Anuluj | 002, 007: warianty "tylko projekt", "tylko część", oba |
| 5 | Dodanie wzoru z "Dziś" przed pierwszym rzędem | kafel "Dodaj wzór" na świeżej instalacji | 003 |
| 6 | Dodanie wzoru z "Dziś" przy bieżącym projekcie | kafel → menu źródeł → wybór → wzór; powrót przyciskiem | 001 |
| 7 | Dodanie wzoru z licznika w projekcie bez wzoru | licznik → "Wzór" → menu źródeł → powrót przyciskiem | 001 |
| 8 | Dodanie wzoru z ekranu projektu i anulowanie wyboru pliku | projekt → "Dodaj wzór" → źródło → Anuluj w systemowym wyborze → powrót na projekt | 001 |
| 9 | "Pokaż" z przewodnika dla kroku o wzorze | przewodnik → "Pokaż" → wzór → powrót do przewodnika | 001 |
| 10 | Dodanie wzoru w projekcie, który ma już wzory | kafel "Dodaj wzór" → menu | do sprawdzenia 1 |
| 11 | Wzór: znacznik rzędu, zakreślenie, notatka, zmiana nazwy, wyjście z niezapisanym rysunkiem | przeglądarka wzoru → "Wstecz" (pytanie przy niezapisanych) | — |
| 12 | Cel części, przypomnienie, długość powtórzenia | licznik → "Cel" → arkusz → Zapisz / Anuluj z pytaniem o odrzucenie | — |
| 13 | Znaczenie liczby (skończone / w trakcie) | menu → arkusz → Zapisz | — |
| 14 | Wyzerowanie licznika z potwierdzeniem; blokada i odblokowanie | menu licznika | — |
| 15 | Ukończenie projektu i pomyłkowe ukończenie | menu → karta → "Gotowe"; potem "Wznów projekt" | 004 |
| 16 | Ukończenie z zużyciem włóczki i udostępnieniem karty | karta ukończenia | — |
| 17 | Nowy projekt z częściami | "Projekty" → "+" albo kafel → arkusz → Dodaj / Anuluj | — |
| 18 | Ekran projektu: notatka, zdjęcie, film, szczegóły (druty, włóczka, próbka) | projekt → arkusze → powrót | — |
| 19 | Termin projektu i cel dnia | projekt → "Termin" → kalendarz → Zapisz / "Bez daty" | 005, 006: język en-US i język aplikacji inny niż systemowy |
| 20 | Korekta daty ukończenia i korekta sesji | projekt / sesje → wybór daty | 005 |
| 21 | Stoper: start, pauza, stop; lista sesji | licznik → "Stoper"; projekt → sesje | — |
| 22 | Historia licznika i wpisanie numeru rzędu | licznik → "Historia" → Zamknij | — |
| 23 | Kalendarz dni: dzień, tydzień, miesiąc | zakładka "Historia" | — |
| 24 | Zapas: włóczka, druty, zdjęcie etykiety | "Narzędzia" → listy → arkusze | — |
| 25 | Kalkulator próbki w cm i calach | "Narzędzia" albo kafel → próbka → "Wstecz" | — |
| 26 | Limit darmowych dni: okno zasad, oferty, zakup, przywrócenie, "Nie teraz" | lista / licznik → okna → powrót na listę | — |
| 27 | Eksport, import (scal / zastąp / anuluj), usunięcie wszystkich danych | ustawienia | — |
| 28 | iCloud: włączenie, brak konta, brak miejsca, konflikt dwóch wersji | ustawienia → "Dane i synchronizacja"; licznik → "Wybierz" | do sprawdzenia 4 |
| 29 | Kosz: usunięcie i przywrócenie projektu, części, włóczki | "Projekty" → "Ostatnio usunięte" | — |
| 30 | Zmiana języka i jednostek; przewodnik z "Dziś" i z ustawień | ustawienia, przewodnik | — |
| 31 | Błąd wczytania dowolnego ekranu | stan błędu → "Spróbuj ponownie" / wyjście | do sprawdzenia 2 |
| 32 | Przerwanie w połowie: gest zamknięcia arkusza ze zmianami, przejście do innej aplikacji, zamknięcie aplikacji | pytanie "Odrzucić zmiany?"; powrót na to samo miejsce | — |
| 33 | iPad: wzór poziomo z kolumną licznika, pionowo z paskiem, wąskie okno | scenariusze 44, 46, 47 | do sprawdzenia 3 |
| 34 | Zegarek: "+1", "−1", blokada, limit, brak telefonu, błąd zapisu | jeden ekran | do sprawdzenia 6 |
| 35 | Każdy z powyższych w jasnym motywie, przy AX5 i z VoiceOver | — | do sprawdzenia 5 |

## Co działa dobrze i należy zachować

- Wspólny stan wczytywania i błędu z wyjściem na 17 trasach (`src/ekrany/StanWczytywania.tsx`) — błąd odczytu nie zostawia pustego ekranu.
- Pytanie "Odrzucić zmiany?" z dwiema nazwanymi odpowiedziami, także przy geście zamknięcia arkusza (`src/kompozycja/odrzuc-zmiany.ts:27`, `zrzuty/arkusz-E.png` drugi ekran).
- Wyjście z otwartego wzoru: przycisk i gest idą jedną ścieżką, z zapisem rysunku przed decyzją (`app/wzor.tsx:137`).
- Pierwsze uruchomienie: licznik działa od razu, bez konta i bez zakładania projektu (`zrzuty/arkusz-A.png` pierwszy ekran).
- Okno zasad i oferty: jasne wyjście ("Liczę dalej", "Nie teraz", znak zamknięcia) i ceny z okresem przy każdym planie (`zrzuty/arkusz-C.png`).
- Stany iCloud mówią, co się stało i co zrobić, z przyciskiem do ustawień (`zrzuty/arkusz-D.png`, `zrzuty/arkusz-E.png` szósty ekran).

## Decyzje dla właściciela

Zgodnie z P-087 decyduje koordynator; u właściciela nic z tej listy nie wymaga kosztu ani konta.

1. 003: (a) kafel zakłada projekt roboczy i otwiera źródła / (b) zdanie celu na liście projektów / (c) kafel ukryty do pierwszego projektu. Rekomendacja (a); zmienia P-588 (c).
2. 002: (a) nie pokazywać nazwy domyślnej części / (b) nazwa domyślna "Część 1" / (c) propozycja w arkuszu. Rekomendacja (a) + (c).
3. 004: (a) "Wznów projekt" na karcie / (b) zdanie informacji / (c) bez zmian. Rekomendacja (a).
4. Trwała kontrola z 001 (test wyjścia dla każdej gałęzi każdej trasy): (a) test w `verify` / (b) punkt listy przeglądu roli 04. Rekomendacja (a) — kontrolę, którą można pominąć, wymusza test (zasada 21).
5. Uzupełnienie dowodów: (a) pobrać części 2–3 artefaktów CI i dokończyć jasny motyw, AX5, VoiceOver (ok. 500 MB, osobna krótka sesja) / (b) zostawić do testu właściciela na urządzeniu. Rekomendacja (a).

Decyzje metody audytu zapisane w `docs/decyzje.md`: P-839 (źródło obrazu: artefakty CI), P-840 (poziomy P1–P3, raport i arkusze w repo), P-841 (zakres listy kontrolnej zawężony do przepływów). Analogii w repo `trening` nie sprawdzałem — jest poza zakresem dostępu tej sesji; decyzje według własnej rekomendacji, do weta.

## Proponowane polecenie naprawy

`node tools/assemble.mjs 04-studio-projektowe --tryb fix --zadania 04-studio-projektowe-001,04-studio-projektowe-002,04-studio-projektowe-003,04-studio-projektowe-007`

001 w części objętej zgłoszeniem właściciela naprawia już sesja BW; do jej zakresu warto dopisać wejścia (3) i (4) oraz test trwały. 004–006 po decyzjach koordynatora.
