# Test na urządzeniach — build 4 (kandydat 1.0), pełna lista dla właściciela

Wersja 2026-11-10, rola 07 (tryb build, sesja X koordynatora).
**115 kroków:** 112 obowiązkowych + 3 dodatkowe (T-49, T-101, T-137).
Z tego **17 nowych od buildu 3** (przewodnik: G-01…G-09, G-11, G-20…G-23, G-25, G-26, G-30).
Numery stałe, z przerwami.

Kandydat: `claude/t-przewodnik-2026-11-10` @ 75242ba = integracja 7defd5f + przewodnik; wersja 1.0.0 (`app.json:5`).
Zastępuje listę buildu 3 (`docs/wydanie/test-urzadzenia-build3.md`); testu buildu 3 osobno nie ma (właściciel 10.11: „Zrobię wszystko na kandydacie”).

**Wyjątek nazwany (jak w buildzie 3):** lista jest pełna, nie zawężona do zmian od ostatniego testu (`docs/fakty-wlasciciela.md`), bo to pierwszy i ostatni poważny test przed 1.0.

**Jak sprawdzono fakty w kodzie 75242ba**
- Punkty T-xx: treść listy buildu 3 (sprawdzona w kodzie 7defd5f; kod 87ade5a = 7defd5f).
- Od 7defd5f do 75242ba kod zmienił się tylko w: `app/przewodnik.tsx`, `app/ustawienia.tsx`, `app/(zakladki)/index.tsx`, `src/ekrany/{Dzis,DzisStyl,Przewodnik,Ustawienia,Aplikacja,SymbolSf}.tsx|ts`, `src/domena/przewodnik.ts`, `src/przypadki-uzycia/przewodnik.ts`, `src/kompozycja/wstecz.ts`, dwa wiersze w `src/dane/`, słowniki (61 kluczy dopisanych na końcu każdego pliku).
- Każde odwołanie `plik:linia` do kodu z listy buildu 3 porównane wiersz w wiersz (7defd5f ↔ 75242ba): 15 bez zmian, 2 w `Dzis.tsx` zmienione przez przewodnik (sprawdzone ponownie: „+1” `:122`, zębatka `:179`).
- Punkty G-xx: każdy fakt z kodu 75242ba (`plik:linia` przy punkcie).

Ścieżki w „Źródło” liczone od `docs/` (np. `brd/wymagania-licznik.md:21`), chyba że zaczynają się od `src/`, `app/`, `tests/`.
Skróty: `zakres:17` = `docs/scope-contract.md:17`; `tf:24` = `docs/jakosc/testflight-na-urzadzeniu.md:24`; `en.json` = `src/i18n/slowniki/en.json`.

## Zanim zaczniesz

### Instalacja buildu 4 z TestFlight
- [ ] iPhone: otwórz **TestFlight** → „Oczko”.
- [ ] Sprawdź numer: pod nazwą wersja **1.0.0 (1141)**.
- [ ] Jeśli to nie ten numer: „Previous Builds” (Poprzednie buildy) → wybierz właściwy.
- [ ] **Najpierw T-01 i T-02** (zapis stanu, zrzut) — dopiero potem „Install”/„Update”. Nie usuwaj aplikacji przed T-02.
- [ ] iPad (przed sekcją 13): TestFlight na iPadzie, to samo Apple ID → „Oczko” → ten sam numer → „Install”.
- [ ] Apple Watch: instaluje się z iPhone'a (krok T-04).
- [ ] W raporcie wpisz numer buildu, który faktycznie testowałeś.

### Czego potrzeba
- iPhone z TestFlight; Apple Watch sparowany z tym iPhonem; iPad z tym samym Apple ID (bez Apple Pencil — wystarczy). Fakty: `docs/fakty-wlasciciela.md`.
- Pliki w aplikacji Pliki na iPhonie (przygotuj przed testem, ok. 5 min):
  - dowolny PDF wzoru, 3–10 stron;
  - `tekst.docx`, `tabela.docx`, `obraz.docx` z repo: `modules/oczko-wzor/TestyOknaMaszyn/Testy/korpus/` (GitHub → plik → „Download raw file” → Zapisz w Plikach);
  - nieobowiązkowo duży PDF 100–200 MB (do T-101; jeśli nie masz — T-101 pomiń);
  - nieobowiązkowo: wyślij sobie e-mail z załącznikiem PDF (do T-49).
- Na iPhonie: Ustawienia → Ekran i jasność → Automatyczna blokada = **1 minuta** (do T-16; zaraz po T-16 przywróć swoje).
- Druga osoba albo drugi telefon, który może do Ciebie zadzwonić (T-115). Bez tego T-115 = „nie sprawdzono”.

### Zakup Pro w TestFlight (bez konta Sandbox)
- **Konto Sandbox nie jest potrzebne.** Aplikacja z TestFlight sama działa w środowisku testowym.
- Zakup jest bezpłatny; okno Apple ma dopisek, że to test.
- Subskrypcja odnawia się codziennie, najwyżej 6 razy, potem wygasa.
- Nie szukaj „Konta Sandbox” w Ustawieniach iOS (Trening, lekcja L-028).
- Kupuj tylko **„Monthly”** (T-72). Nie „Yearly” ani „Lifetime” — powód w „Czego NIE testować”.
- Źródło: `wydanie/kroki-wlasciciela-testflight.md:95-98` (strona Apple „Testing subscriptions and In-App Purchases in TestFlight”, odczyt 2026-11-01); tak samo Trening (Z-09).

### Kolejność: 3 podejścia [OCENA agenta, nie pomiar]
1. **Podejście 1 — blokery wydania 1.0: część I** (sekcje 1–9 z 8a, przewodnik). Ok. **2 h 50 min** (168 min kroków) + 5 min przygotowania. Wszystko **w jednym dniu kalendarzowym** (limit liczy dni).
2. **Podejście 2 — część II** (ekran blokady, VoiceOver, duży tekst, ciemny, iPad, zegarek, przerwania). Ok. **1 h 35 min** (93 min kroków) + 10 min czekania (T-113).
3. **Podejście 3 — części III i IV** (języki, strony, kopia, usunięcie, instalacja od zera). Ok. **45 min** (41 min kroków). Część IV **na samym końcu** (usuwa dane testu).

- Razem obowiązkowo ok. **5 h 15 min** (302 min kroków + 10 min czekania + 5 min przygotowania); kroki dodatkowe +15 min.
- Realnie, z czytaniem i zrzutami: **7–8 h** (recenzja buildu 3 oceniła 6–7 h; przewodnik dokłada ok. 45 min).
- Przerwa między sekcjami nic nie psuje. Ważne:
  - T-70–T-71 (limit) **przed** zakupem T-72;
  - podejścia 2 i 3 w ciągu **6 dni od T-72** (potem subskrypcja testowa wygasa i kroki „Pro On” dałyby fałszywe „nie”);
  - T-137 (dodatkowy) po co najmniej 8 dniach od T-72.

### Jak zgłaszać błąd
- Każdy krok: **tak / nie**.
- Przy „nie”, krótko: **numer · co · zrzut**. Przykład: „G-05 nie — Back wrócił na Today, nie do Guide · zrzut”.
- Nie da się wykonać: „T-xx nie sprawdzono — powód”.
- Wyślij koordynatorowi jedną wiadomość po każdym podejściu: „T-01 tak, T-02 nie dotyczy, …”.
- Zrzuty tylko w wiadomości albo w prywatnym `oczko-warsztat`, nie w tym repo (mogą pokazywać Twoje dane).

### Napisy, język, „Settings”
- Kroki podają napisy aplikacji po angielsku, dosłownie w cudzysłowie.
- Jeśli telefon jest po polsku, Oczko startuje po polsku — w T-05 przełączysz na angielski. Ustawienia iOS i okna systemowe zostają w Twoim języku (nazwy w krokach iOS po polsku).
- **„Settings” w Oczku** = zębatka w prawym górnym rogu „Today” — tylko tam (`src/ekrany/Dzis.tsx:179`, testID `nav-ustawienia`; P-571).
- **Nowe w buildzie 4:** tuż przed zębatką jest „?” z podpisem **„Guide”** (przewodnik) — też tylko na „Today” (`src/ekrany/Dzis.tsx:178`, P-685).
- Jeśli po T-02 masz dane z wcześniejszego buildu: liczby w krokach czytaj jako zmianę (np. „1 → 4 → 3” = +3, potem −1), a T-70 jako „o jeden dzień mniej niż przed T-70”.
- „automat: e2e NN” = ten sam przepływ sprawdza scenariusz `e2e/scenariusze/NN-…yaml` na symulatorze; „tylko urządzenie” = żaden automat; „atrapa”/„zastępczy” = automat sprawdza wersję udawaną (sztuczny sklep, sztuczny zegarek, plik wstrzyknięty).

### Punkty, których nie sprawdzisz bez danych albo warunków
- T-02: tylko jeśli masz zainstalowany build 1, 2 lub 3 z danymi (inaczej „nie dotyczy”).
- T-70, T-71: tylko bez aktywnego Pro z wcześniejszego buildu.
- T-115: potrzebny ktoś, kto zadzwoni.
- T-101, T-49 (dodatkowe): potrzebny duży PDF / e-mail z PDF.
- T-137 (dodatkowy): po 8 dniach od zakupu.
- Pełna lista z powodami: „Czego NIE testować” na końcu.

---

## Część I — blokuje zgłoszenie do App Review

### 1. Instalacja i pierwszy start (iPhone, zegarek) — ok. 12 min

- [ ] **T-01** · iPhone · 1 min
  - Zrób: Otwórz TestFlight → „Oczko”. Zapisz, co jest teraz zainstalowane: brak aplikacji, wersja 0.1.0 albo wersja 1.0.0 (build 1, 2 lub 3).
  - Wynik: — (tylko zapis stanu; od niego zależy T-02).
  - Źródło: `fakty-wlasciciela.md`; `decyzje.md:635-638` (buildy 1 i 2) · automat: tylko urządzenie
- [ ] **T-02** · iPhone · 3 min
  - Zrób: **Jeśli jest 1.0.0 z Twoimi danymi:** przed instalacją zrób zrzut listy „Projects” i jednego licznika. Potem w TestFlight „Install”/„Update” build 4, bez usuwania. Otwórz. **Jeśli jest 0.1.0:** zainstaluj build 4 na nią, bez usuwania. **Jeśli nic:** zainstaluj.
  - Wynik: 1.0.0 → te same projekty, ta sama wartość licznika i historia co na zrzucie (zero utraty danych). 0.1.0 → start bez awarii, aplikacja pusta — zamierzone, dane 0.1.0 nie są przenoszone. Nigdy ekran trybu awaryjnego.
  - Źródło: `brd/wymagania.md:73` (NFR-DAN-001); `brd/wymagania-dane.md:31` (BR-DAN-003); `jakosc/strategia.md:102` (TT-06); `tf:24` (TT-07); `decyzje.md:76` (P-070) · automat: tylko urządzenie (aktualizacja: test bazy `tests/bazy/v1.db` w Node)
- [ ] **T-03** · iPhone · 2 min
  - Zrób: Jeśli aplikacja jest pusta: na ekranie „Today” stuknij okrągły przycisk **„+1”** na pierwszej karcie. Jeśli po T-02 masz dane, ten krok zrobisz w T-133.
  - Wynik: Przed „Today” nie ma żadnego okna (powitania, zakupu, języka, zgody). Karta „First counter” z opisem „Tap +1 after each finished row. You can name the project later.” (na polskim telefonie — po polsku). Po stuknięciu licznik pokazuje **1**, telefon krótko wibruje.
  - Źródło: `brd/wymagania.md:89` (NFR-PIE-001); `brd/wymagania-licznik.md:4` (BR-LIC-001); `zakres:17` (F-01); `src/ekrany/Dzis.tsx:122` · automat: e2e 01, 02
- [ ] **T-04** · iPhone + Watch · 5 min
  - Zrób: Od razu po instalacji: na zegarku wciśnij koronę (siatka aplikacji). Na iPhonie otwórz aplikację Watch → przewiń do „Oczko”. Jeśli Oczka nie ma na zegarku, włącz instalację przełącznikiem przy „Oczko” i poczekaj do 5 min. Otwórz Oczko na zegarku.
  - Wynik: Na siatce zegarka prawdziwa ikona Oczka (nie pusty krążek); aplikacja zegarka się otwiera i pokazuje licznik.
  - Źródło: `tf:25` (TT-12); `jakosc/strategia.md:108` · automat: tylko urządzenie (CI tylko buduje zegarek)
- [ ] **T-05** · iPhone · 1 min
  - Zrób: Jeśli Oczko jest po polsku: zębatka → „Język” → „English”. Jeśli już po angielsku — pomiń („nie dotyczy”).
  - Wynik: Wszystkie teksty Oczka po angielsku; wybór zostaje po zamknięciu aplikacji.
  - Źródło: `zakres:49` (ZM-02, wybór języka); `src/i18n/slowniki/pl.json` („Język”) · automat: e2e 39

### 2. Licznik — główna pętla (iPhone) — ok. 10 min (T-16 jest w sekcji 5, bo wymaga wzoru)
Między pojedynczymi stuknięciami „+1 row” zostaw ok. 3 s, chyba że krok mówi inaczej (szybka seria to osobny przypadek, T-11).

- [ ] **T-10** · iPhone · 2 min
  - Zrób: Wejdź w licznik: na „Today” stuknij „Continue” na karcie projektu. Stuknij „+1 row” 3 razy, potem „−1” raz.
  - Wynik: Wartość 1 → 4 → 3. Każde +1 i −1 to krótka wibracja. Pod liczbą „Now working row …”.
  - Źródło: `brd/wymagania-licznik.md:21` (BR-LIC-002), `:81` (BR-LIC-005); `zakres:17` · automat: e2e 04
- [ ] **T-11** · iPhone · 1 min
  - Zrób: Stuknij „+1 row” 4 razy jak najszybciej (w ok. 2 s). Na banerze stuknij „Undo 4 rows”.
  - Wynik: Pojawia się baner „Added 4 rows in … s. Undo?” z przyciskiem „Undo 4 rows”. Po stuknięciu wartość wraca do 3.
  - Źródło: `brd/wymagania-licznik.md:334` (BR-LIC-019); `zakres:58` (F-47) · automat: e2e 04
- [ ] **T-12** · iPhone · 2 min
  - Zrób: Stuknij „+1 row” raz (3 → 4). Na liczniku stuknij „History”. Przy najnowszym wpisie (to +1) stuknij „Undo”.
  - Wynik: Lista zmian z godziną i wartością, najnowsze u góry; po „Undo” licznik znów pokazuje 3, a wpis jest oznaczony „undone”.
  - Źródło: `brd/wymagania-licznik.md:38` (BR-LIC-003); `zakres:18` (F-02) · automat: e2e 04
- [ ] **T-13** · iPhone · 2 min
  - Zrób: Menu ••• licznika → „Enter the row number” → wpisz **10** → zapisz. Potem ••• → „Reset to 0…” → „Reset to 0”. Potem cofnij zerowanie: „History” → przy wpisie zerowania „Undo” (banera po zerowaniu nie ma).
  - Wynik: Licznik pokazuje 10. Zerowanie pyta o potwierdzenie, daje 0, cofnięcie przywraca 10.
  - Źródło: `brd/wymagania-licznik.md:258` (BR-LIC-017); `zakres:56` (F-45) · automat: tylko urządzenie (brak scenariusza e2e dla F-45; testy Jest)
- [ ] **T-14** · iPhone · 1 min
  - Zrób: ••• → „Lock counter (ignore taps)”. Stuknij „+1 row” 2 razy. Potem odblokuj („Unlock”). **Nie** stukaj już +1 (T-15 zakłada 10).
  - Wynik: Wartość 10 bez zmian; widać „Counter locked” i podpowiedź „Counter is locked. Unlock it at the top.” Po odblokowaniu napis „Counter locked” znika.
  - Źródło: `brd/wymagania-licznik.md:60` (BR-LIC-004); `zakres:19` (F-03) · automat: e2e 14 (zastępczy)
- [ ] **T-15** · iPhone · 1 min
  - Zrób: ••• → „What the number shows” → „The row I’m on”. Potem z powrotem „Rows finished”. Jeśli tej pozycji nie ma w menu — zrzut menu.
  - Wynik: Przy 10 skończonych rzędach duża liczba zmienia się na 11 (opis: „11 means you’re working on row 11”); historia bez zmian. Po powrocie znów 10.
  - Źródło: `brd/wymagania-licznik.md:201` (BR-LIC-012); `zakres:24` (F-09) · automat: e2e 56, 67
- [ ] **T-17** · iPhone · 1 min
  - Zrób: „Settings” → wyłącz „Vibration” → na liczniku „+1 row”. Włącz z powrotem → „+1 row”.
  - Wynik: Bez wibracji przy wyłączonej opcji; z wibracją po włączeniu.
  - Źródło: `brd/wymagania-licznik.md:81` (BR-LIC-005) · automat: tylko urządzenie

### 3. Projekt, części i liczniki (iPhone) — ok. 30 min
„Licznik Back” = główny licznik rzędów części Back: „Projects” → Sweater test → stuknij część Back (nie „Ribbing” ani „Stitches” dodane w T-22–T-23).

- [ ] **T-20** · iPhone · 1 min
  - Zrób: Na liczniku z T-10: ••• → „Name project and part” → projekt **Scarf test**, zapisz.
  - Wynik: Nazwa widoczna na liczniku, na „Today” i w „Projects”. Projekt powstał sam z pierwszego licznika.
  - Źródło: `brd/wymagania-projekt.md:5` (BR-PRJ-001); `zakres:29` (F-14) · automat: e2e 33
- [ ] **T-21** · iPhone · 3 min
  - Zrób: „Projects” → „New project” → nazwa **Sweater test** → „Add part” **Back**, „Add part” **Front** → zapisz. Otwórz licznik części Back i stuknij „+1 row” 5 razy.
  - Wynik: Projekt z dwiema częściami; Back = 5, Front = 0.
  - Źródło: `brd/wymagania-projekt.md:5`; `zakres:29` · automat: e2e 33
- [ ] **T-22** · iPhone · 2 min
  - Zrób: W Sweater test: ikona **„+”** na ekranie projektu (VoiceOver czyta ją „Add part or counter”) → „Add counter” → „Name” **Stitches**, „In part” Back, „Counts” „Stitches” → zapisz.
  - Wynik: Drugi licznik „Stitches” obok rzędów w części Back; liczy niezależnie.
  - Źródło: `brd/wymagania-licznik.md:94` (BR-LIC-006), `:124` (BR-LIC-008); `zakres:20` (F-04) · automat: e2e 54
- [ ] **T-23** · iPhone · 2 min
  - Zrób: Ikona „+” → „Add counter” → „Name” **Ribbing**, „Counts” „Rows” → zapisz. Stuknij „+1 row” na Ribbing 2 razy.
  - Wynik: Nad licznikami części widać licznik całości kawałka = 5 + 2 = **7**.
  - Źródło: `brd/wymagania-licznik.md:309` (BR-LIC-018); `zakres:57` (F-46) · automat: e2e 58
- [ ] **T-24** · iPhone · 2 min
  - Zrób: Na liczniku rzędów Back (wartość 5): „Goal” → „Set a repeat length” → „Rows in one repeat” **0** → zapisz; potem **8** → zapisz.
  - Wynik: Przy 0: „A repeat needs at least 1 row.” Przy 8: na liczniku linia w formacie „…: repeat 1, row … of 8” (`en.json:42`; zapisz liczby, które widzisz).
  - Źródło: `brd/wymagania-licznik.md:103` (BR-LIC-007); `zakres:21` (F-05) · automat: e2e 55
- [ ] **T-25** · iPhone · 3 min
  - Zrób: Back: „Goal” → „Add a reminder (“every N rows”)” → „What to do” **decrease at both ends**, „Starting on row” **8**, „Every … rows” **6**, „How many times” **3**. Przeczytaj podgląd, „Save reminder”. Stuknij „+1 row” 2 razy (5 → 7). Zamknij oczy przy drugim stuknięciu.
  - Wynik: Przed zapisem: „You’ll be reminded on rows: 8, 14, 20”.
    - Przy 7 (pracujesz nad rzędem 8): pas pod liczbą w dwóch liniach „Row 8: decrease at both ends” i „1 of 3, next on row 14”; pod „+1 row” podpis „tap when row 8 is done” (`en.json:18`, `:38-39`).
    - **Wibracja wyraźnie inna** niż zwykła wibracja rzędu (rozpoznasz bez patrzenia).
  - Źródło: `brd/wymagania-licznik.md:133` (BR-LIC-009), `:175` (BR-LIC-010), `:368` (BR-LIC-020); `zakres:22` (F-06), `:59` (F-48); `scope-contract.md:230` (checklista P-419) · automat: tylko urządzenie (wibracja); pas: Jest
- [ ] **T-19** · iPhone · 2 min
  - Zrób: Licznik Back: „Goal” → „Reminders” → przypomnienie z T-25 → „How many times” **4** → zapisz.
  - Wynik: Podgląd „You’ll be reminded on rows: 8, 14, 20, 26”; zmiana zapisana.
  - Źródło: `brd/wymagania-licznik.md:133`; `zakres:22` (F-06); `en.json:988` · automat: tylko urządzenie
- [ ] **T-26** · iPhone · 2 min
  - Zrób: Back: „Goal” → „Set a goal for this part” → **10** → zapisz. Stuknij „+1 row” do 10. Stuknij „Next part”.
  - Wynik: Przy 10: „Goal reached”, „Next part” pierwszy w strefie licznika; po stuknięciu otwiera się Front.
  - Źródło: `brd/wymagania-licznik.md:188` (BR-LIC-011); `zakres:23` (F-08); `decyzje.md:644` (P-664, zmiana buildu 3) · automat: e2e 34
- [ ] **T-27** · iPhone · 2 min
  - Zrób: Front: „Goal” → „Set a goal for this part” **3**, stuknij „+1 row” do 3, stuknij „Next part”. W arkuszu „What’s next?” wybierz „A second Front”.
  - Wynik: „What’s next?” z opisem, że to ostatnia część; nowa część z celem 3 i wartością 0.
  - Źródło: `brd/wymagania-projekt.md:175` (BR-PRJ-014); `zakres:63` (F-52) · automat: e2e 34
- [ ] **T-28** · iPhone · 1 min
  - Zrób: Otwórz projekt Sweater test (link „Project ›” na liczniku).
  - Wynik: Procent postępu pokazuje się sam (części mają cele); zapisz liczbę. Część bez celu, jeśli jest, oznaczona.
  - Źródło: `brd/wymagania-dni.md:82` (BR-DNI-004); `zakres:71` (F-60) · automat: e2e 59
- [ ] **T-29** · iPhone · 1 min
  - Zrób: Na liczniku Back: „Note” → wpisz **cast on 3 mm** → zapisz.
  - Wynik: Notatka widoczna przy liczniku bez otwierania innego ekranu.
  - Źródło: `brd/wymagania-projekt.md:14` (BR-PRJ-002); `zakres:30` (F-15) · automat: e2e 57
- [ ] **T-30** · iPhone · 1 min
  - Zrób: Projekt Sweater test → „Needles or hook” → „Size in mm” **4** → zapisz.
  - Wynik: „Shows as: 4 mm (US 6)”; w projekcie „4 mm (US 6)”.
  - Źródło: `brd/wymagania-projekt.md:36` (BR-PRJ-004); `zakres:32` (F-17) · automat: e2e 60
- [ ] **T-31** · iPhone · 1 min
  - Zrób: Projekt Sweater test → menu → „Make another like this”.
  - Wynik: Nowy projekt z tymi samymi częściami i licznikami od 0; oryginał bez zmian.
  - Źródło: `brd/wymagania-projekt.md:71` (BR-PRJ-007); `zakres:35` (F-20) · automat: e2e 61
- [ ] **T-32** · iPhone · 2 min
  - Zrób: Projekt Sweater test → „Done by” → data **7 dni od dziś** → zapisz. Wróć na „Today”, potem „Projects”.
  - Wynik: W formularzu „Today’s goal: N rows. It stays the same all day.” Na „Today” i w projekcie „Done by …, today 0 of N rows” (zapisz N). Na liście „In progress” Sweater test (z terminem) stoi **nad** projektami bez terminu.
  - Źródło: `brd/wymagania-dni.md:99` (BR-DNI-005), `:146-153` (BR-DNI-006); `zakres:72` (F-61) · automat: e2e 35
- [ ] **T-33** · iPhone · 4 min
  - Zrób: Na liczniku Back stuknij „Timer” (stoper rusza od razu, osobnego „Start” nie ma). Stuknij „+1 row” 2 razy. „Pause timer”, „Resume timer”, „Stop timer”. Projekt → „Sessions” → otwórz sesję → zmień godzinę końca o 10 min wcześniej → zapisz.
  - Wynik: Sesja na liście z czasem; po korekcie oznaczenie „Edited” i nowy czas projektu.
  - Źródło: `brd/wymagania-projekt.md:85` (BR-PRJ-008), `:152` (BR-PRJ-013); `zakres:36` (F-21), `:62` (F-51) · automat: e2e 37, 38 (część)
- [ ] **T-34** · iPhone · 1 min
  - Zrób: W „Projects” sprawdź sekcje i wpisz w „Search” **Sweater**.
  - Wynik: Sekcja „In progress” według ostatniej pracy; wyszukiwanie znajduje oba projekty Sweater.
  - Źródło: `brd/wymagania-projekt.md:135` (BR-PRJ-012); `zakres:61` (F-50) · automat: tylko urządzenie (część w e2e 20)

### 4. Uprawnienia systemowe i zdjęcia (iPhone) — ok. 4 min

- [ ] **T-35** · iPhone · 4 min
  - Zrób: Projekt Sweater test → „Add photo” → „Take photo”. W oknie iOS wybierz **„Nie pozwalaj”**. Stuknij „Open Settings”, włącz Aparat, wróć do Oczka. „Take photo” → zrób zdjęcie. Potem „Add photo” → „Choose from library” → wybierz zdjęcie.
  - Wynik: Okno iOS pojawia się dopiero teraz (nie na starcie), z tekstem „Oczko uses the camera only when you take a photo of a pattern, a project or a yarn label. Photos stay on your device.”
    - Po odmowie: „Oczko can’t use the camera” + „Open Settings”. Po zgodzie zdjęcie w projekcie. Biblioteka **bez** pytania o dostęp. W całym teście żadnej prośby o powiadomienia ani o śledzenie.
  - Źródło: `brd/wymagania-projekt.md:27` (BR-PRJ-003); `zakres:31` (F-16); `app.json` (expo-image-picker, `photosPermission: false`) · automat: e2e 17, 42 (atrapa aparatu)

### 5. Wzory (iPhone) — ok. 38 min (+8 min dodatkowo)

- [ ] **T-40** · iPhone · 2 min
  - Zrób: Sweater test → „Add pattern” → „Choose file (PDF or Word)” → Twój PDF.
  - Wynik: Wzór się otwiera, strony się przewijają.
  - Źródło: `brd/wymagania-projekt.md:230` (BR-WZR-001); `zakres:38` (F-24) · automat: e2e 21 (zastępczy)
- [ ] **T-41** · iPhone · 4 min
  - Zrób: (U10) Scarf test → „Add pattern” → „Choose file (PDF or Word)” → `tekst.docx`. Obejrzyj. Usuń wzór (••• wzoru → „Delete pattern…”) i powtórz dla `tabela.docx` i `obraz.docx`.
  - Wynik: Tekst, tabela i obraz widoczne; na końcu nie ma pustej strony.
  - Źródło: `brd/wymagania-projekt.md:330` (BR-WZR-007); `zakres:66` (F-55); `tf:39` · automat: e2e 25, 53
- [ ] **T-42** · iPhone · 3 min
  - Zrób: (U6) „Projects” → „New project” → **Scan test** → „Add pattern” → „Scan pages” → 2 kartki. Obejrzyj, usuń wzór (••• → „Delete pattern…”), potem „Add pattern” → „Choose photos” → 1 zdjęcie strony.
  - Wynik: Wzór PDF ze stronami w kolejności skanowania; ze zdjęcia — wzór ze zdjęcia.
  - Źródło: `brd/wymagania-projekt.md:243` (BR-WZR-002); `tf:40` · automat: e2e 22 (atrapa)
- [ ] **T-43** · iPhone · 3 min
  - Zrób: Scan test: usuń wzór (••• → „Delete pattern…”) → „Add pattern” → „Web page link…” → wpisz **https://apps4brew.com/oczko/support.html** → „Save page”. Włącz tryb samolotowy, otwórz ten wzór, wyłącz tryb.
  - Wynik: Strona zapisana; w trybie samolotowym otwiera się taka sama.
  - Źródło: `brd/wymagania-projekt.md:330`; `zakres:66` · automat: e2e 24 (zastępczy)
- [ ] **T-44** · iPhone · 2 min
  - Zrób: Sweater test → „Add video link” → link **https://apps4brew.com/oczko/support.html** → zapisz → stuknij „Video”. Potem w trybie samolotowym stuknij „Video”.
  - Wynik: Link otwiera się w przeglądarce. Bez sieci: „This video needs an internet connection. Oczko keeps only the link.”
  - Źródło: `brd/wymagania-projekt.md:330`; `zakres:66` · automat: tylko urządzenie
- [ ] **T-45** · iPhone · 4 min
  - Zrób: Otwórz PDF z T-40 pierwszy raz. Stuknij w rząd. Wróć na licznik, „+1 row”, wróć na wzór. Potem (U3) przytrzymaj palec na innym wierszu; menu wzoru ••• → „Rotate page” i znów przytrzymaj. Zamknij aplikację z przełącznika i otwórz wzór.
  - Wynik: Wskazówka jednym zdaniem „Tap a row to place your marker.” Znacznik w stukniętym rzędzie, po +1 przesuwa się o rząd. Przytrzymanie stawia znacznik na wysokości palca, także na obróconej stronie. Po ponownym starcie znacznik na miejscu.
  - Źródło: `brd/wymagania-projekt.md:252` (BR-WZR-003); `zakres:40` (F-26); `tf:41` · automat: e2e 62 (bez przytrzymania)
- [ ] **T-38** · iPhone · 3 min
  - Zrób: Na wzorze Sweater test: w pasku pod wzorem „Mark row” → stuknij inny rząd. Potem „Add note” → wpisz **k2tog here** → zapisz. Zamknij i otwórz wzór.
  - Wynik: Znacznik przenosi się na stuknięty rząd; notatka widoczna przy oznaczonym rzędzie i zostaje po ponownym otwarciu.
  - Źródło: `brd/wymagania-projekt.md:252`, `:351` (BR-WZR-003, -008); `zakres:40`, `:67`; `en.json:796`, `:818` · automat: tylko urządzenie (e2e 62 bez „Mark row”)
- [ ] **T-16** · iPhone · 8 min
  - Zrób: (U11) Otwórz wzór z T-40 i nie dotykaj telefonu 2 min. Wyjdź na listę „Projects”, czekaj 2 min. W „Settings” wyłącz „Keep screen on while counting”, wróć na licznik, czekaj 2 min; włącz opcję z powrotem.
    - Z licznikiem na ekranie przejdź do Wiadomości, wróć do Oczka, czekaj 2 min. Potem przywróć swoją automatyczną blokadę.
  - Wynik: Na wzorze i liczniku ekran nie gaśnie; na liście gaśnie po 1 min; z wyłączoną opcją gaśnie też na liczniku; po powrocie z innej aplikacji na licznik znów nie gaśnie.
  - Źródło: `brd/wymagania-licznik.md:214` (BR-LIC-013); `zakres:25` (F-10); `tf:34` · automat: tylko urządzenie
- [ ] **T-46** · iPhone · 2 min
  - Zrób: (U7) Na liczniku obróć telefon poziomo; potem na „Today” i „Settings”. Potem na wzorze obróć poziomo i stuknij „+1 row”.
  - Wynik: Licznik, „Today” i „Settings” zostają w pionie. Na wzorze poziomo: wzór i licznik razem, +1 działa; po obrocie ta sama strona i wartość.
  - Źródło: `brd/wymagania-projekt.md:300` (BR-WZR-005); `zakres:39` (F-25); `tf:32` · automat: e2e 23, 45
- [ ] **T-47** · iPhone · 2 min
  - Zrób: Na wzorze włącz „Highlighter”, zakreśl jedną linię palcem; wyłącz i przewiń stronę palcem. Zamknij i otwórz wzór.
  - Wynik: Zakreślenie zostaje po ponownym otwarciu; przewijanie bez zakreślacza nie zostawia śladu.
  - Źródło: `brd/wymagania-projekt.md:351` (BR-WZR-008); `zakres:67` (F-56) · automat: e2e 26, 27
- [ ] **T-48** · iPhone · 5 min
  - Zrób: (U5) (1) Safari: otwórz **https://apps4brew.com/oczko/support.html** → Udostępnij → Oczko → wybierz Scarf test. (2) Pliki: PDF → Udostępnij → Oczko → „New project”. (3) Zdjęcia: 1 zdjęcie → Udostępnij → Oczko. Otwórz Oczko.
  - Wynik: Oczko jest na liście udostępniania; każdy wzór trafia do wybranego albo nowego projektu.
  - Źródło: `brd/wymagania-projekt.md:230`, `:330`; `tf:42` · automat: e2e 52 (zastępczy: plik wstrzyknięty)
- [ ] **T-49** · dodatkowy · iPhone · 8 min
  - Zrób: (U5) `.docx` z Plików → Oczko; 20 zdjęć naraz; załącznik PDF z e-maila przygotowanego wcześniej; w trybie samolotowym strona z Safari → wyłącz tryb → otwórz Oczko.
  - Wynik: Wszystko dociera; zlecenie bez sieci czeka i trafia do projektu po powrocie sieci.
  - Źródło: `tf:43` · automat: tylko urządzenie

### 6. Narzędzia: zapas i obliczenia (iPhone) — ok. 8 min

- [ ] **T-50** · iPhone · 2 min
  - Zrób: „Tools” → „Yarn” → „Add yarn”: „Name” **Test merino**, „Skeins” **3**, „Length per skein” **437** z jednostką „yd” → zapisz.
  - Wynik: W zapasie „3 skeins”, długość z przeliczeniem ok. **399.59 m**.
  - Źródło: `brd/wymagania-narzedzia.md:7` (BR-ZAP-001); `zakres:50` (F-37) · automat: e2e 40
- [ ] **T-51** · iPhone · 1 min
  - Zrób: Tryb samolotowy → „Tools” → „Yarn” → szukaj **merino**. Wyłącz tryb.
  - Wynik: Test merino znaleziona bez sieci.
  - Źródło: `brd/wymagania-narzedzia.md:46` (BR-ZAP-004) · automat: e2e 16
- [ ] **T-52** · iPhone · 1 min
  - Zrób: „Tools” → „Needles and hooks” → dodaj **4** mm → zapisz.
  - Wynik: Pozycja „4 mm (US 6)”.
  - Źródło: `brd/wymagania-narzedzia.md:29` (BR-ZAP-003) · automat: tylko urządzenie
- [ ] **T-53** · iPhone · 3 min
  - Zrób: „Tools” → „Swatch calculator”: „Swatch stitches” **22**, „Swatch width, cm” **10**, „Width you want (same unit)” **50** → „Calculate”. Potem „Settings” → „Units” → „Imperial” → wróć do kalkulatora → „Units” z powrotem „Automatic”.
  - Wynik: Wynik **110 stitches** (22 ÷ 10 × 50), linia „From 22 stitches per 10 cm and 50 cm.” i kategoria grubości z zakresem (zapisz, jaka). Przy „Imperial” pola w calach.
  - Źródło: `brd/wymagania-narzedzia.md:60` (BR-KAL-001), `:107` (BR-KAL-003), `:193` (BR-KAL-008); `zakres:51` (F-38) · automat: e2e 41
- [ ] **T-54** · iPhone · 1 min
  - Zrób: Scarf test → wiersz „Yarn” → w formularzu „Yarn for this project” wybierz Test merino.
  - Wynik: Włóczka przypisana do projektu.
  - Źródło: `brd/wymagania-narzedzia.md:20` (BR-ZAP-002) · automat: tylko urządzenie

### 7. Ukończenie projektu, historia, kosz (iPhone) — ok. 11 min

- [ ] **T-55** · iPhone · 4 min
  - Zrób: Scarf test: ••• → „Mark project as finished”. W „Yarn used” ustaw „Skeins of Test merino used” = **1**. Na karcie stuknij „Share”, zamknij arkusz bez wysyłania, zamknij kartę. Otwórz „Tools” → „Yarn”.
  - Wynik: Karta ukończenia pojawia się sama (stopka „Counted in Oczko”, czas, dni); „Share” otwiera systemowy arkusz. W zapasie 2 skeins. Scarf test w sekcji „Finished”. (Okno oceny Apple w TestFlight się nie pokazuje — `src/domena/ocena.ts:26`; to nie błąd.)
  - Źródło: `brd/wymagania-projekt.md:62` (BR-PRJ-006), `:192` (BR-PRJ-015); `brd/wymagania-dane.md:196` (BR-DAN-012); `zakres:34`, `:64`, `:75` · automat: e2e 43, 65
- [ ] **T-56** · iPhone · 2 min
  - Zrób: Zakładka „History”. Stuknij dzisiejszy dzień. Przewiń pod kalendarz.
  - Wynik: Dziś ma znak; po stuknięciu projekty i rzędy z dnia; pod spodem podsumowanie tygodnia i miesiąca. Na ekranie licznika nic z kalendarza.
  - Źródło: `brd/wymagania-dni.md:8`, `:43`, `:64` (BR-DNI-001–003); `zakres:70` (F-59) · automat: e2e 64
- [ ] **T-57** · iPhone · 4 min
  - Zrób: Kopia projektu z T-31: menu → „Delete project…” → „Delete project”. Potem Sweater test → menu → „Edit parts and counters” → usuń licznik **Stitches** („Delete counter”). „Projects” → „Recently deleted” → „Show” → „Restore” przy obu.
  - Wynik: W oknie usuwania data, do kiedy rzecz zostaje w koszu („… · until …”); po „Restore” projekt wraca z licznikami, a licznik Stitches wraca do części Back.
  - Źródło: `brd/wymagania-dane.md:117` (BR-DAN-008); `zakres:46` (F-33); `en.json:408`, `:607-629` · automat: e2e 36
- [ ] **T-58** · iPhone · 1 min
  - Zrób: „Projects” → sekcja „Finished” → Scarf test → menu projektu → „Resume project”.
  - Wynik: Projekt wraca do „In progress”.
  - Źródło: `brd/wymagania-projekt.md:62` · automat: tylko urządzenie

### 8. Dane po zamknięciu, ustawienia, eksport (iPhone) — ok. 13 min

- [ ] **T-60** · iPhone · 1 min
  - Zrób: Na liczniku Back stuknij „+1 row” i **od razu** zamknij aplikację z przełącznika aplikacji. Otwórz.
  - Wynik: Ostatnie +1 zapisane.
  - Źródło: `brd/wymagania.md:77` (NFR-DAN-002) · automat: e2e 10
- [ ] **T-61** · iPhone · 4 min
  - Zrób: Otwórz wzór Sweater test na stronie 2, powiększ dwoma palcami. Zamknij aplikację z przełącznika. Otwórz. Na „Today” stuknij „+1” na karcie, potem „Continue”. Potem „Projects” → Sweater test.
  - Wynik: Start na „Today” z kartą tego licznika (Sweater test, Back). „+1” z karty zmienia ten sam licznik. „Continue” otwiera licznik; wzór na stronie 2 z tym samym powiększeniem. Ekran projektu pokazuje liczniki, notatkę „cast on 3 mm”, wzór i datę ostatniej pracy.
  - Źródło: `brd/wymagania-projekt.md:118` (BR-PRJ-011), `:53` (BR-PRJ-005); `zakres:60` (F-49), `:33` (F-18) · automat: e2e 03, 18
- [ ] **T-62** · iPhone · 2 min
  - Zrób: „Settings” → „Export all data” → zapisz w Plikach („Na moim iPhonie”).
  - Wynik: Plik kopii w Plikach; aplikacja mówi, gdzie jest. Zostaw go do T-131.
  - Źródło: `brd/wymagania-dane.md:53` (BR-DAN-005); `zakres:45` (F-32) · automat: e2e 08
- [ ] **T-63** · iPhone · 2 min
  - Zrób: „Settings” → „Report a problem”. Przeczytaj podgląd. Nie wysyłaj — zamknij.
  - Wynik: Podgląd diagnostyki przed wysłaniem; w treści nie ma nazw „Scarf test” ani „Sweater test”, notatek ani zdjęć. Przycisk „Share”.
  - Źródło: `brd/wymagania-dane.md:147` (BR-DAN-010); `zakres:68` (F-57) · automat: e2e 63
- [ ] **T-64** · iPhone · 1 min
  - Zrób: „Settings” → „Data and sync”.
  - Wynik: „iCloud sync is off.” / „Everything is saved on this device.”; **brak** przełącznika „Sync with iCloud” — zamierzone w 1.0. Stan zegarka jednym zdaniem, jeśli jest pokazany.
  - Źródło: `brd/wymagania-dane.md:14` (BR-DAN-002), `:177` (BR-DAN-011); `zakres:41`, `:69`; `src/konfiguracja.ts:34` · automat: e2e 48 (atrapa)
- [ ] **T-65** · iPhone · 2 min
  - Zrób: „Settings” → „Open source licenses” (nowe w buildzie 3, bez zmian w 4). Otwórz grupę „Fonts” i jedną pozycję z „npm packages”.
  - Wynik: Grupa „Fonts” na górze, Bree Serif z licencją OFL; teksty licencji się otwierają.
  - Źródło: `decyzje.md:641` (P-661); `programista/build3-stan.md:13` · automat: Jest (`tests/ekrany/m1-245-licencje.test.tsx`)
- [ ] **T-66** · iPhone · 1 min
  - Zrób: „Settings” → „About our information”.
  - Wynik: Ekran źródeł wiedzy obliczeń. (Dokumenty nazywają go „About our content” — rozjazd nazwy zgłoszony niżej.)
  - Źródło: `zakres:51` (ZM-04); `decyzje.md:641` · automat: tylko urządzenie

### 8a. Przewodnik — nowe w buildzie 4 (iPhone) — ok. 21 min
Kontekst: ostatnio używany licznik = Back w Sweater test (T-61), Sweater test ma wzór PDF (T-40). Język: angielski.
„Show” = przycisk tekstowy „Show ›” pod zdaniem albo pod rozwiniętym opisem.

- [ ] **G-01** · iPhone · 3 min · wejście z „Today”
  - Zrób: „Today” → spójrz na prawy górny róg. Stuknij „?” z podpisem „Guide”.
  - Wynik: Przed zębatką „?” z widocznym podpisem „Guide”; zębatka zostaje skrajna z prawej.
  - Wynik: Ekran „Guide” bez paska zakładek; u góry „‹ Today”; zdanie „First steps and every feature. “Show” opens the screen.”
  - Wynik: Sekcja „First steps”: 6 numerowanych zdań, każde z „Show ›”. Potem „Feature library” i „Read: 0 of 42” (przy pierwszym otwarciu).
  - Wynik: 9 grup w kolejności: „Today”, „Counter”, „Projects”, „Pattern”, „Tools”, „History”, „Settings”, „Oczko Pro”, „Apple Watch and Lock Screen”. Brak wyszukiwania i obrazków.
  - Źródło: `src/ekrany/Dzis.tsx:176-179`; `src/ekrany/Przewodnik.tsx:74-103`; `src/domena/przewodnik.ts:23-84`; `en.json:1046-1050`; `decyzje.md` P-685, P-686 · automat: e2e 69
- [ ] **G-02** · iPhone · 2 min · rozwijanie i „przeczytane”
  - Zrób: W grupie „Counter” stuknij wiersz „Set a goal for this part”. Potem w grupie „Settings” stuknij „Vibration”. Potem stuknij „Vibration” jeszcze raz.
  - Wynik: Po 1. stuknięciu: opis „Rows in this part. At the goal: “Next part”, or “What’s next?” for a second matching part.” i „Show ›”; „Read: 1 of 42”; przy wierszu ptaszek ✓.
  - Wynik: Po 2.: „Set a goal…” się zwija (otwarty najwyżej jeden wiersz), „Vibration” rozwinięty, „Read: 2 of 42”.
  - Wynik: Po 3.: „Vibration” się zwija, licznik zostaje 2 (ponowne otwarcie nie liczy się drugi raz).
  - Źródło: `app/przewodnik.tsx:26-30`; `src/ekrany/Przewodnik.tsx:105-121`; `src/domena/przewodnik.ts:99`; `en.json:1072`, `:1095`; P-688 · automat: e2e 70 (jedna funkcja)
- [ ] **G-03** · iPhone · 4 min · „Show” w „First steps”
  - Zrób: (a) Krok 2 „Show ›”. Na liczniku stuknij „‹ Guide” (lewy górny róg). (b) Krok 4 „Show ›”, wróć strzałką „‹”. (c) Krok 6 „Show ›”. (d) Otwórz „Guide” znowu, krok 1 „Show ›”.
  - Wynik: (a) Licznik Back w Sweater test (bez otwartego menu); u góry „‹ Guide”; powrót do przewodnika.
  - Wynik: (b) Wzór Sweater test (PDF z T-40); strzałka wraca do przewodnika.
  - Wynik: (c) Zakładka „Projects”, przewodnik zamknięty, pasek zakładek widoczny, jeden zestaw zakładek. (d) Zakładka „Today”, przewodnik zamknięty.
  - Źródło: `app/przewodnik.tsx:32-43`; `src/domena/przewodnik.ts:13-20`, `:117-123`; `src/kompozycja/wstecz.ts:12`; P-687, P-691 · automat: e2e 69 (tylko funkcja „cel”)
- [ ] **G-04** · iPhone · 3 min · „Show” w bibliotece
  - Zrób: „Guide” → „Projects” → „Recently deleted” → „Show ›”; wróć „‹ Guide”. „Tools” → „Yarn” → „Show ›”; wróć. „Settings” → „Data and sync” → przeczytaj opis → „Show ›”; zamknij arkusz. „Today” → „Continue” → „Show ›”.
  - Wynik: „Recently deleted” i „Yarn” otwierają się nad przewodnikiem, u góry „‹ Guide”, powrót do przewodnika. „Data and sync” to arkusz (jak z „Settings”); po zamknięciu — przewodnik. „Show” nie otwiera menu •••.
  - Wynik: „Data and sync”: „iCloud sync is off.” i brak przełącznika (jak T-64). Opis w przewodniku: „iCloud sync on or off, and whether everything is saved.” — zapisz, czy brzmi jak obietnica przełącznika (znalezisko niżej).
  - Wynik: „Continue” → zakładka „Today”, przewodnik zamknięty.
  - Źródło: `app/przewodnik.tsx:37-42`; `src/domena/przewodnik.ts:50`, `:59`, `:70`, `:25`; `en.json:1098`; `src/konfiguracja.ts:34`; `app/_layout.tsx:137` (arkusz) · automat: tylko urządzenie
- [ ] **G-05** · iPhone · 3 min · funkcje Ustawień z wejścia „Today” (P-708)
  - Zrób: Wejdź do „Guide” z „Today”. Grupa „Settings” → „Vibration” → „Show ›”. Stuknij „‹ Guide”. Potem grupa „Oczko Pro” → „Oczko Pro” → „Show ›”; wróć. Potem „Settings” → „Units” → „Show ›”; wróć.
  - Wynik: „Vibration” otwiera ekran „Settings” nad przewodnikiem; u góry „‹ Guide”; powrót do przewodnika (nie na „Today”).
  - Wynik: „Oczko Pro” otwiera „Settings”, **nie** ekran zakupu. „Units” otwiera ekran „Units”; powrót do przewodnika.
  - Wynik: Żadne „Show” nie eksportuje, nie usuwa i nie kupuje.
  - Źródło: `app/przewodnik.tsx:41-42`; `src/domena/przewodnik.ts:67`, `:69`, `:78`; P-687 („Oczko Pro → /ustawienia”), P-708; `tests/ekrany/przewodnik-stos.test.tsx` · automat: Jest (stos na urządzeniu niesprawdzony, P-708)
- [ ] **G-06** · iPhone · 2 min · wejście z „Settings”
  - Zrób: Zamknij przewodnik. „Today” → zębatka → spójrz na grupę z „Help”. Stuknij „Guide”. Rozwiń jedną nową funkcję (np. „Projects” → „Search”). Stuknij „‹ Settings”.
  - Wynik: Wiersz „Guide” z ikoną „?” **bezpośrednio nad** „Help”; „Help” ma teraz ikonę koła ratunkowego.
  - Wynik: Wartość wiersza = liczba z „Read: … of 42” w przewodniku (po G-02–G-05: „8 of 42”); po powrocie o 1 więcej („9 of 42”).
  - Wynik: W przewodniku u góry „‹ Settings”.
  - Źródło: `src/ekrany/Ustawienia.tsx:125-127`; `app/ustawienia.tsx:54`, `:148`; `en.json:1051`; P-685, P-705, P-707 · automat: e2e 70
- [ ] **G-07** · iPhone · 2 min · funkcje Ustawień z wejścia „Settings” (P-708, KO-031)
  - Zrób: „Settings” → „Guide” → grupa „Settings” → „Keep screen on while counting” → „Show ›”. Spójrz na lewy górny róg, stuknij go.
  - Wynik: Wraca **ten sam** ekran „Settings” (bez drugiej kopii); u góry „‹ Today”; stuknięcie prowadzi na „Today” (jeden krok, nie dwa).
  - Zrób też: „Settings” → „Guide” → „Units” → „Show ›” → „‹ Guide”.
  - Wynik: „Units” nad przewodnikiem, powrót do przewodnika.
  - Źródło: `app/przewodnik.tsx:41`; `app/ustawienia.tsx:148` (parametr `z=ustawienia`); `src/domena/przewodnik.ts:103`; P-708 · automat: Jest `tests/ekrany/przewodnik-stos.test.tsx` (na urządzeniu niesprawdzone)
- [ ] **G-08** · iPhone · 1 min · Apple Watch i ekran blokady
  - Zrób: „Guide” → grupa „Apple Watch and Lock Screen” → „Apple Watch”. Potem „Lock Screen” → „Show ›”.
  - Wynik: „Apple Watch”: opis „Count rows on your watch: “+1 row” and the current row. Open Oczko on Apple Watch.” i **bez** „Show”.
  - Wynik: „Lock Screen”: „Show” otwiera licznik Back; „‹ Guide” wraca.
  - Źródło: `src/ekrany/Przewodnik.tsx:120`; `src/domena/przewodnik.ts:81-82`; `en.json:1105-1106`; P-687 · automat: tylko urządzenie
- [ ] **G-09** · iPhone · 1 min · przeczytane po zamknięciu aplikacji
  - Zrób: Zapisz liczbę „Read: … of 42”. Zamknij Oczko z przełącznika aplikacji, otwórz, wejdź do „Guide”.
  - Wynik: Ta sama liczba i te same ptaszki ✓.
  - Źródło: `src/przypadki-uzycia/przewodnik.ts:13-25`; `app/przewodnik.tsx:22-24`; P-688, P-690 · automat: e2e 70 (restart)

### 9. Limit darmowych dni i zakup w piaskownicy (iPhone) — ok. 21 min
Kolejność ważna: najpierw limit (wymaga braku Pro), potem zakup.

- [ ] **T-70** · iPhone · 1 min
  - Zrób: „Settings” → linia pod „Oczko Pro”. Jeśli „Oczko Pro” już jest „On” (zakup z wcześniejszego buildu), T-70 i T-71 oznacz „nie sprawdzono — Pro aktywne”.
  - Wynik: „{x} of 5 free crafting days left in {bieżący miesiąc}”; po świeżej instalacji „4 of 5” (dziś liczyłeś, jeden dzień zużyty). Ta sama liczba dni na liście „Projects”.
  - Źródło: `brd/wymagania-dane.md:296` (BR-ZAK-005); `zakres:74` (F-63) · automat: e2e 05
- [ ] **T-71** · iPhone · 15 min
  - Zrób: **Zmiana daty (odwracalna).** Ustawienia iOS → Ogólne → Data i czas → wyłącz „Ustaw automatycznie” → ustaw **1. dzień następnego miesiąca** (test w listopadzie: 1 grudnia). Otwórz Oczko → zakładka „Projects”.
    - Potem „Today” → „+1 row” na karcie. Powtórz zmianę daty i „+1 row” dla dni **2, 3, 4 i 5** tego miesiąca. Ustaw dzień **6**, otwórz „Today”, potem licznik. Sprawdź „History” i „Export all data” (nie zapisuj).
    - Na koniec włącz „Ustaw automatycznie”.
  - Wynik: Dzień 1, „Projects”: raz okno „Your first crafting day is done” z „Keep counting” i „See Oczko Pro” (nigdy na liczniku). Dzień 5: cicha linia ostatniego darmowego dnia. Dzień 6: w miejscu „+1 row” (karta i licznik)
    - „No free crafting days left in {miesiąc}. Counting is paused until …”, link „Oczko Pro removes the limit” poza strefą +1, żaden ekran zakupu sam się nie otwiera; historia i eksport działają. Na liście „Projects”
    - Scarf test z „last worked … days ago”. Po powrocie daty dziś znów można liczyć. Wpisy z przyszłymi datami zostają w historii aż do części IV — to skutek tego kroku, nie błąd.
  - Źródło: `brd/wymagania-dane.md:296`, `:363` (BR-ZAK-006); `brd/wymagania-projekt.md:209` (BR-PRJ-016); `zakres:74` (F-63, ZM-05), `:65` (F-54) · automat: e2e 05, 07, 12, 20 (zegar wstrzyknięty)
- [ ] **T-72** · iPhone · 3 min
  - Zrób: „Settings” → „Oczko Pro” → **„Monthly”** → „Continue with Monthly” → potwierdź w oknie Apple. **Nie kupuj „Yearly” ani „Lifetime”** (powód w „Czego nie testować”).
  - Wynik: Okno Apple oznaczone jako testowe, bez opłaty. Od razu „You have Oczko Pro.”; w „Settings” „Oczko Pro” z „On” i pozycja „Manage subscription”. Na ekranie zakupu „Restore purchases”, „Privacy Policy”, „Terms of Use”.
  - Źródło: `brd/wymagania-dane.md:219` (BR-ZAK-001); `zakres:48` (F-35); `tf:59` (TT-01); `wydanie/sklep.md:292` · automat: e2e 06 (sztuczny sklep)
- [ ] **T-73** · iPhone · 1 min
  - Zrób: (TT-03) Tryb samolotowy, zamknij aplikację z przełącznika, otwórz. Wyłącz tryb.
  - Wynik: Pro nadal włączone.
  - Źródło: `brd/wymagania-dane.md:257` (BR-ZAK-003); `tf:60` · automat: tylko urządzenie
- [ ] **T-74** · iPhone · 1 min
  - Zrób: „Oczko Pro” → „Restore purchases”.
  - Wynik: Bez błędu; Pro bez zmian (przy aktywnym Pro udane przywrócenie nie pokazuje komunikatu — `app/oferty.tsx:44-49`).
  - Źródło: `brd/wymagania-dane.md:219` · automat: e2e 06 (sztuczny sklep)

---

## Część II — czego automat nie sprawdzi

### 10. Ekran blokady (iPhone) — ok. 6 min

- [ ] **T-80** · iPhone · 3 min
  - Zrób: (TT-09) Na liczniku Back „+1 row” raz. Zablokuj telefon. Na ekranie blokady stuknij +1 trzy razy (co ok. 3 s). Odblokuj.
  - Wynik: Na ekranie blokady sesja Oczka z rzędem; wartość w aplikacji większa o 3, bez konfliktu; ewentualny baner „Added 3 rows from the lock screen at …. Undo?”.
  - Źródło: `brd/wymagania-licznik.md:227` (BR-LIC-014); `zakres:26` (F-11); `tf:33` · automat: tylko urządzenie
- [ ] **T-81** · iPhone · 3 min
  - Zrób: Stuknij „Timer” (stoper rusza) → zablokuj telefon, odczekaj 1 min. Odblokuj → „Stop timer”.
  - Wynik: Na ekranie blokady czas płynie razem z rzędem; jest tylko +1, bez przycisku zatrzymania (tylko do odczytu). Zatrzymanie w aplikacji.
  - Źródło: `brd/wymagania-projekt.md:85` (BR-PRJ-008); `zakres:36` (F-21, ZM-10) · automat: tylko urządzenie

### 11. VoiceOver (iPhone) — ok. 16 min (z G-20)
Włączanie: Ustawienia → Dostępność → VoiceOver → włącz (przesuwanie jednym palcem w prawo = następny element, stuknięcie dwukrotne = aktywuj). Wyłączenie tak samo; jeśli się zgubisz, poproś Siri „Wyłącz VoiceOver”.

- [ ] **T-85** · iPhone · 3 min
  - Zrób: „Today”: przejdź po wszystkich elementach. Na karcie projektu aktywuj „+1” (VoiceOver czyta „+1 row”).
  - Wynik: Każdy element ma zrozumiałą nazwę (nie „button”, nie nazwę pliku); po +1 VoiceOver mówi nową wartość.
  - Źródło: `brd/wymagania.md:97` (NFR-DOS-001) · automat: e2e 29 (tylko etykiety)
- [ ] **T-86** · iPhone · 4 min
  - Zrób: Bez VoiceOver ustaw w części „A second Front” (cel 3, z T-27) wartość **2** przez „Enter the row number”. Włącz VoiceOver, przejdź po elementach licznika i aktywuj „+1 row”.
  - Wynik: Słychać całe ogłoszenie rzędu, a po nim „Goal reached” (oba, jedno nie ucina drugiego). „Next part” jest pierwszy w strefie licznika. Wskazówka znacznika na wzorze się nie pokazuje.
  - Źródło: `decyzje.md:649` (P-670, I-001), `:644` (P-664); `zakres:40` · automat: Jest (`tests/ekrany/i-001-ogloszenie-celu-kolejka.test.tsx`)
- [ ] **T-87** · iPhone · 5 min
  - Zrób: „Settings”, „Oczko Pro”, „Projects”, „History”: przejdź po elementach.
  - Wynik: Wszystkie wiersze i przyciski czytelne; na „Oczko Pro” ceny i okresy czytane w całości.
  - Źródło: `brd/wymagania.md:97`; `decyzje.md:501` (P-496, VoiceOver 014) · automat: e2e 29 (tylko etykiety)
- [ ] **G-20** · iPhone · 4 min · przewodnik z VoiceOver (nowe w buildzie 4)
  - Zrób: „Today”: dojdź do „Guide” i aktywuj. W przewodniku przejdź po: tytule, zdaniu, „First steps”, kroku 1 i jego „Show”. Dalej do grupy „Counter”, aktywuj „Set a goal for this part”, przejdź do jego „Show”. Na koniec przycisk w lewym górnym rogu.
  - Wynik: Przycisk na „Today” czytany „Guide”. „Guide”, „First steps”, „Feature library” i nazwy grup czytane jako nagłówki.
  - Wynik: Krok: „Step 1 of 6. On “Today”, tap…” (sama cyfra nie jest czytana osobno); jego przycisk: „Show: Step 1 of 6”.
  - Wynik: Wiersz: „Set a goal for this part, Counter, not read” (albo „read”) ze stanem zwinięty/rozwinięty; po aktywacji rozwinięty. „Show” funkcji: „Show: Set a goal for this part”. Lewy górny róg: „Back”.
  - Źródło: `src/ekrany/Przewodnik.tsx:59`, `:70`, `:77`, `:82`, `:86-89`, `:103`, `:110-111`; `src/ekrany/Pasek.tsx:25-27`; `en.json:1053-1056`; spec `design/przewodnik-2026-11-10.md` §5 · automat: tylko urządzenie

### 12. Duży tekst, tryb ciemny, obrót — ok. 20 min (z G-21, G-22)

- [ ] **T-90** · iPhone · 6 min
  - Zrób: (TT-16) Ustawienia → Dostępność → Ekran i wielkość tekstu → Większy tekst → włącz „Większe rozmiary” → suwak **maksymalnie** (AX5).
    - Przejrzyj: „Today”, licznik (z celem — „Next part”), wzór z notatką z T-38, projekt, „History”, „Settings”, „Oczko Pro”, „Open source licenses”. Stuknij kciukiem każdy główny przycisk.
  - Wynik: Nic nie jest ucięte ani nie nachodzi; tytuł wzoru z ▾ i karta Worda czytelne; każdy przycisk trafiony za pierwszym razem.
  - Źródło: `brd/wymagania.md:101` (NFR-DOS-002); `jakosc/strategia.md:112` (TT-16); `decyzje.md:642-643` (B3-01, B3-02) · automat: e2e 30 (AX5 przed startem)
- [ ] **T-91** · iPhone · 3 min
  - Zrób: Przy **otwartej** aplikacji zmień suwak na **połowę** zakresu „Większe rozmiary”, wróć do Oczka bez zamykania (licznik, „Settings”). Potem przywróć swój rozmiar.
  - Wynik: Układ dostosowuje się bez zamykania; nic nie ucięte. (Trening L-051: ucięcia wyszły dopiero przy zmianie w trakcie i w połowie skali.)
  - Źródło: `brd/wymagania.md:101`; Trening `docs/40-lekcje.md:185-191` · automat: tylko urządzenie
- [ ] **G-21** · iPhone · 3 min · przewodnik przy dużym tekście (nowe w buildzie 4)
  - Zrób: Przy **maksymalnym** rozmiarze (z T-90, przed przywróceniem w T-91 ustaw go jeszcze raz): „Today” (góra ekranu), „Guide” (przewiń całość, rozwiń jeden wiersz), „Settings” → wiersz „Guide”. Stuknij kciukiem „Guide”, „Show ›” i zębatkę.
  - Wynik: Od AX3 wzwyż „Guide” (z podpisem) i zębatka stoją w osobnym wierszu **nad** tytułem „Today”, oba w całości na ekranie.
  - Wynik: W przewodniku nic nieucięte; „Show ›” zawsze pod zdaniem; ptaszek i strzałka zostają w wierszu przy długiej nazwie. Wiersz „Guide” w „Settings” z wartością „… of 42” nieuciętą. Każdy przycisk trafiony za pierwszym razem.
  - Źródło: `src/ekrany/Dzis.tsx:176-192`; `src/ekrany/DzisStyl.ts:15-17`; `src/ekrany/motyw.ts:128` (próg AX3); `src/ekrany/Przewodnik.tsx:36`, `:114-115`; P-707; spec §5 · automat: Jest `tests/ekrany/przewodnik-okablowanie.test.tsx` (pasek AX3), reszta tylko urządzenie
- [ ] **T-92** · iPhone · 4 min
  - Zrób: Centrum sterowania → tryb ciemny. Zamknij Oczko z przełącznika i otwórz. Przejrzyj „Today”, licznik, wzór, „Settings”, „Oczko Pro”. Wróć do jasnego.
  - Wynik: Ekran startowy i tło ładowania ciemne, bez białego błysku. Wszystkie teksty czytelne.
  - Źródło: `scope-contract.md:230` (088, 089; P-431, `decyzje.md:436`) · automat: e2e w trybie ciemnym tylko na żądanie `[e2e-ciemny]`
- [ ] **G-22** · iPhone · 2 min · przewodnik w trybie ciemnym (nowe w buildzie 4)
  - Zrób: W trybie ciemnym: „Today” (pasek z „Guide”), „Guide” z jednym rozwiniętym wierszem i ptaszkiem, „Settings” → wiersz „Guide”.
  - Wynik: Wszystkie teksty czytelne; „Show ›”, ptaszek i strzałki widoczne; brak białych pól i białego błysku przy wejściu.
  - Źródło: `src/ekrany/Przewodnik.tsx:16-39` (tylko tokeny); spec §5 (kontrast); P-696 · automat: e2e 69, 70 w przebiegu `[e2e-ciemny]`
- [ ] **T-93** · iPhone · 2 min
  - Zrób: Na iPhonie obróć telefon na „Projects”, „History”, „Tools” (licznik i wzór były w T-46).
  - Wynik: Wszystko poza wzorem zostaje w pionie.
  - Źródło: `tf:32` (U7) · automat: e2e 45 (część)

### 13. iPad (bez Apple Pencil) — ok. 26 min z G-23 (+5 min dodatkowo)

- [ ] **T-95** · iPad · 3 min
  - Zrób: Zainstaluj build 4 z TestFlight na iPadzie (to samo Apple ID). Otwórz. Na „Today” „+1 row”.
  - Wynik: Start bez awarii; „Today” z kartą „First counter”, +1 działa. Zakupu nie trzeba ponawiać (T-99).
  - Źródło: `brd/wymagania.md:117` (NFR-UKL-001) · automat: e2e 44 (iPad)
- [ ] **T-96** · iPad · 7 min
  - Zrób: (U1) Utwórz projekt, dodaj PDF (Pliki iPada albo Udostępnij → Oczko). Obróć pion/poziom. Potem Split View z Safari na ⅓ i ½ szerokości oraz Slide Over. Przejrzyj licznik, wzór, „Settings”.
  - Wynik: Wzór i licznik razem w obu orientacjach; w wąskim oknie układ jak na telefonie; w szerszych treść w kolumnie; nic nie ucięte. Na iPadzie obraca się wszystko.
  - Źródło: `brd/wymagania-projekt.md:300` (BR-WZR-005); `brd/wymagania.md:117`; `tf:48`, `:52` · automat: e2e 44, 46 (zastępczy)
- [ ] **G-23** · iPad · 4 min · przewodnik na iPadzie (nowe w buildzie 4)
  - Zrób: iPad, pełny ekran: „Today” → „Guide”, pion i poziom. Potem Split View z Safari na ⅓. Na pełnym ekranie: „Counter” → „+1 row” → „Show ›” → „‹ Guide”. „Settings” → wiersz „Guide”.
  - Wynik: Na pełnym ekranie treść w wyśrodkowanej kolumnie (jak „Settings”), nie rozciągnięta od krawędzi do krawędzi; w ⅓ układ jak na telefonie.
  - Wynik: „Show” otwiera licznik, „‹ Guide” wraca. Na iPadzie „Read: … of 42” liczy się osobno (przy pierwszym wejściu 0, choć na iPhonie więcej) — stan jest na urządzeniu, bez iCloud.
  - Źródło: `src/kompozycja/Bezpieczny.tsx:3`, `:17-20`; `src/domena/uklad.ts:7`, `:31` (640 pt); P-694; P-690 · automat: e2e 44 tylko inne ekrany iPada; przewodnik tylko urządzenie
- [ ] **T-97** · iPad · 6 min
  - Zrób: (U2, U8) Na wzorze włącz „Highlighter”; rysuj jednym palcem, przewijaj dwoma; „Undo last stroke”. W trakcie rysowania wyjdź do ekranu głównego i wróć; potem zamknij aplikację z przełącznika i otwórz.
  - Wynik: Jeden palec rysuje, dwa przewijają; cofnięcie działa; kreski zostają po powrocie i po ponownym starcie.
  - Źródło: `brd/wymagania-projekt.md:351` (BR-WZR-008); `tf:49-50` · automat: e2e 47
- [ ] **T-98** · iPad · 2 min
  - Zrób: (U3) Przytrzymaj palec na wierszu wzoru; „Rotate page” i powtórz.
  - Wynik: Znacznik na wysokości palca.
  - Źródło: `tf:41`, `:51` · automat: tylko urządzenie
- [ ] **T-99** · iPad · 2 min
  - Zrób: (TT-10) „Settings” → „Oczko Pro” → „Restore purchases”.
  - Wynik: Pro włączone na iPadzie.
  - Źródło: `brd/wymagania-dane.md:219`; `tf:61` · automat: tylko urządzenie
- [ ] **T-100** · iPad · 2 min
  - Zrób: Zapisz wartość licznika Back na iPhonie. Na iPadzie stuknij „+1” 5 razy w projekcie z T-95. Otwórz Oczko na iPhonie.
  - Wynik: Na iPhonie Back ma tę samą wartość co zapisana, projektu z iPada nie ma (iCloud wyłączony w 1.0); na iPadzie jego licznik = 6.
  - Źródło: `src/konfiguracja.ts:34`; `zakres:41` · automat: tylko urządzenie
- [ ] **T-101** · dodatkowy · iPad · 5 min
  - Zrób: (U4) Jeśli masz duży PDF 100–200 MB → „Choose file (PDF or Word)”, przewiń do końca.
  - Wynik: Otwiera się, przewija bez widocznych zacięć, aplikacja się nie zamyka; zapisz czas otwarcia w sekundach.
  - Źródło: `tf:53` · automat: tylko urządzenie

### 14. Apple Watch — ok. 15 min
„Telefon poza zasięgiem” = na iPhonie tryb samolotowy **i** wyłączony Bluetooth, albo iPhone w innym pokoju (ponad ok. 10 m). Między +1 na zegarku ok. 3 s.

- [ ] **T-105** · Watch + iPhone · 3 min
  - Zrób: Na iPhonie „Projects” → „New project” → **Watch test** → stuknij „+1 row” raz (to ostatni używany licznik). Telefon w zasięgu. Na zegarku otwórz Oczko, stuknij „+1 row” 2 razy. Spójrz na iPhone'a.
  - Wynik: Zegarek pokazuje ten sam licznik co telefon; po chwili iPhone pokazuje wartość większą o 2. Zegarek wibruje przy +1.
  - Źródło: `brd/wymagania-licznik.md:236` (BR-LIC-015); `brd/wymagania.md:109` (NFR-ZEG-001); `zakres:27` (F-12) · automat: e2e 15 (atrapa zegarka)
- [ ] **T-106** · Watch + iPhone · 6 min
  - Zrób: (TT-13) Na iPhonie w Watch test ustaw licznik na **10** („Enter the row number”). Telefon poza zasięgiem. Na zegarku 3 × „+1 row”. Przywróć telefon, odblokuj, czekaj do minuty, otwórz projekt.
  - Wynik: Zegarek: 13 i cicha linia „iPhone not nearby. 3 changes are saved on this watch.” Po powrocie linia znika, iPhone pokazuje 13. Zapisz, po ilu sekundach zniknęła linia.
  - Źródło: `tf:77`; `brd/wymagania-dane.md:177` (BR-DAN-011) · automat: tylko urządzenie
- [ ] **T-107** · Watch + iPhone · 6 min
  - Zrób: (TT-14) Na iPhonie w Watch test ustaw licznik na **10** i dodaj przypomnienie („Goal” → „Add a reminder (“every N rows”)”): od rzędu **12**, co **6**, **8** razy, „decrease at both ends”. Telefon w zasięgu; poczekaj ok. 30 s; na zegarku „+1 row” (10 → 11).
  - Wynik: Zegarek wibruje inaczej niż przy zwykłym rzędzie; pas „Row 12: decrease at both ends · 1 of 8”.
  - Źródło: `tf:78`; `brd/wymagania-licznik.md:368` (BR-LIC-020) · automat: e2e 15 (atrapa)

### 15. Wydajność odczuwalna, klawiatura, przerwania (iPhone) — ok. 11 min (+10 min czekania)

- [ ] **T-110** · iPhone · 3 min
  - Zrób: Zamknij Oczko z przełącznika. Otwórz i licz w myślach do pokazania „Today”. Na liczniku stuknij „+1 row” 20 razy w równym tempie (co ok. 1 s).
  - Wynik: Zapisz czas startu w sekundach (progu w repo brak — `[DO USTALENIA]`). Każde +1 widać od razu, bez opóźnienia i bez zgubionego stuknięcia: wartość +20.
  - Źródło: `brd/wymagania.md:105` (NFR-WYD-001); `jakosc/stan.md:6` · automat: e2e 31 (pomiar na symulatorze)
- [ ] **T-111** · iPhone · 3 min
  - Zrób: „Enter the row number”: sprawdź klawiaturę, usuń wartość i zapisz puste pole, potem wpisz **12** i zapisz. „Needles or hook” → „Size in mm” wpisz **3,25** (przecinek z klawiatury).
  - Wynik: Przy liczniku klawiatura numeryczna; pola i „Save” nie są zasłonięte klawiaturą; puste pole → komunikat o błędzie (np. „Enter a whole number, 0 or more.”), wartość bez zmian; Rozmiar 3,25 przyjęty i pokazany jako 3.25 mm (z numerem US, jeśli jest). Klawiatura chowa się po zapisie.
  - Źródło: `brd/wymagania-licznik.md:258`; `brd/wymagania-projekt.md:36` · automat: tylko urządzenie
- [ ] **T-113** · iPhone · 1 (+10 czekania) min
  - Zrób: Na liczniku przejdź do innych aplikacji na **10 min**, wróć do Oczka.
  - Wynik: Ten sam licznik, ta sama wartość, bez ponownego startu od „Today”.
  - Źródło: `brd/wymagania-projekt.md:118` (BR-PRJ-011/S2) · automat: e2e 19
- [ ] **T-114** · iPhone · 1 min
  - Zrób: Na liczniku ściągnij Centrum powiadomień i Centrum sterowania, zamknij je.
  - Wynik: Żadne +1 nie zostało dodane przypadkiem.
  - Źródło: `brd/wymagania-licznik.md:60` (BR-LIC-004) · automat: e2e 14 (zastępczy)
- [ ] **T-115** · iPhone · 3 min
  - Zrób: Na liczniku stuknij „Timer” (stoper rusza); niech ktoś do Ciebie zadzwoni; odbierz, rozłącz się po 30 s, wróć do Oczka.
  - Wynik: Licznik i stoper działają dalej; wartość bez zmian; aplikacja nie startuje od nowa.
  - Źródło: `brd/wymagania-projekt.md:85`, `:118` · automat: tylko urządzenie

---

## Część III — języki i strony

### 16. Języki — próbka (iPhone) — ok. 14 min (z G-25, G-26)
W buildzie 35 lokalizacji (`app.json:56`); automat sprawdza ekrany tylko po angielsku (e2e uruchamia en-US).

- [ ] **T-120** · iPhone · 3 min
  - Zrób: „Settings” → „Language” → „Polski”. Przejrzyj „Today”, licznik, „Settings”, „Oczko Pro”, „Open source licenses”.
  - Wynik: Teksty po polsku; w „Settings” wiersz jakości tłumaczenia z „Report a translation problem” (otwiera arkusz zgłoszenia). Ekran licencji może zostać po angielsku — zamierzone dla pl (P-673).
  - Źródło: `zakres:49` (ZM-02); `decyzje.md:651` (P-673) · automat: e2e 39 (trwałość wyboru)
- [ ] **G-25** · iPhone · 3 min · przewodnik po polsku (nowe w buildzie 4)
  - Zrób: Nadal po polsku (z T-120): „Dziś” → „Przewodnik”. Przeczytaj kroki 1–3. Otwórz licznik → ••• i porównaj z krokiem 2. Potem „Ustawienia” → wiersz „Przewodnik”.
  - Wynik: Podpis „Przewodnik” przy „?”; na ekranie „Przewodnik”, „Pierwsze kroki”, „Biblioteka funkcji”, „Przeczytane: … z 42”, „Pokaż ›”.
  - Wynik: Krok 3: „Na liczniku: „Cel” → „Ustaw cel dla tej części”. Robótka obok liczby rośnie do celu.” Nazwa z kroku 2 („Nazwij projekt i część”) jest w menu •••. Wiersz „Przewodnik” z „… z 42” nad „Pomoc”. Zapisz każde zdanie, które brzmi nienaturalnie.
  - Źródło: `src/i18n/slowniki/pl.json:1245-1264`; P-706; P-689 (nazwy w cudzysłowie = napisy interfejsu, `tests/wydanie/notatka-nazwy.test.ts`) · automat: tylko urządzenie (e2e po angielsku)
- [ ] **T-121** · iPhone · 3 min
  - Zrób: „Language” → „Deutsch”, potem „日本語”. Na każdym: „Today”, licznik z przypomnieniem, „Oczko Pro”.
  - Wynik: Teksty nieucięte (długie słowa niemieckie, znaki japońskie); ceny na „Oczko Pro” w walucie Twojego konta App Store.
  - Źródło: `brd/wymagania.md:121` (NFR-JEZ-001) · automat: tylko urządzenie
- [ ] **G-26** · iPhone · 3 min · przewodnik po niemiecku i japońsku (nowe w buildzie 4)
  - Zrób: W „Deutsch”: „Heute” → „Leitfaden”; przewiń; rozwiń „Oczko Pro”; otwórz licznik → •••. Potem to samo w „日本語”.
  - Wynik: de: „Leitfaden”, „Erste Schritte”, „Funktionsbibliothek”, „Gelesen: … von 42”, „Anzeigen ›”; krok 2 cytuje „Projekt und Teil benennen” — ta sama pozycja jest w menu •••; opis Pro podaje liczbę 5.
  - Wynik: ja: „ガイド”, „最初のステップ”, „機能一覧”, „既読: 42件中…件”, „表示 ›”; krok 2 cytuje 「プロジェクトとパーツに名前を付ける」 = pozycja menu •••. Nic nieucięte.
  - Wynik: Tłumaczenia są maszynowe (P-700) — dziwne zdanie zgłoś przez „Report a translation problem”, to nie bloker.
  - Źródło: `src/i18n/slowniki/de.json:1045-1106`; `src/i18n/slowniki/ja.json:945-1006`; `src/konfiguracja.ts:3` (limit 5); P-700 · automat: tylko urządzenie
- [ ] **T-122** · iPhone · 2 min
  - Zrób: „Language” → „Same as phone”. Zamknij i otwórz aplikację.
  - Wynik: Aplikacja wraca do języka telefonu i to zostaje po ponownym starcie.
  - Źródło: `zakres:49`; e2e 39 · automat: e2e 39

### 17. Strony z linków w aplikacji — ok. 4 min

- [ ] **T-125** · iPhone · 3 min
  - Zrób: „Settings” → „Privacy Policy”; „Help”. „Oczko Pro” → „Privacy Policy”; „Terms of Use”.
  - Wynik: Polityka: **https://apps4brew.com/oczko/privacy.html**; pomoc: **https://apps4brew.com/oczko/support.html**; warunki: standardowa umowa Apple (EULA). Każda strona się otwiera, po angielsku, bez błędu.
    - Nigdy adres github.io. Wiersz „Help” ma w buildzie 4 ikonę koła ratunkowego, a nad nim stoi „Guide” (G-06).
  - Źródło: `wydanie/adres-strony.json`; `wydanie/sklep.md:37`, `:282`; `brd/wymagania-dane.md:270` (BR-ZAK-004); `zakres:49` (F-36); `src/ekrany/Ustawienia.tsx:125-127` · automat: e2e 68 (tylko widoczność wiersza)
- [ ] **T-126** · iPhone · 1 min
  - Zrób: „Settings” → „Rate Oczko”.
  - Wynik: Otwiera App Store; strona może pokazać błąd/„nie znaleziono” — **oczekiwane przed publikacją** (sprawdzenie adresów 10.11: 404). Aplikacja się nie zawiesza.
  - Źródło: `wydanie/dziennik.md:9`; `brd/wymagania-dane.md:196` · automat: e2e 65

---

## Część IV — na samym końcu (usuwa dane testu)

### 18. Kopia, usunięcie, import, instalacja od zera (iPhone) — ok. 23 min (z G-11, G-30)

- [ ] **T-130** · iPhone · 3 min
  - Zrób: „Settings” → „Delete all data”. Przeczytaj okno, potwierdź „Delete all data”. Otwórz Pliki → Oczko → Backup.
  - Wynik: W oknie zdania o kopii („Oczko first saves a copy in the Files app, in Oczko › Backup…”) i o Pro („Oczko Pro isn’t deleted…”). Aplikacja pusta; kopia jest w Plikach; Pro nadal „On” (jeśli nie — „Restore purchases” je przywraca, TT-11).
  - Źródło: `brd/wymagania-dane.md:138` (BR-DAN-009); `zakres:47` (F-34); `tf:62` · automat: e2e 51 (część iCloud: atrapa)
- [ ] **T-131** · iPhone · 3 min
  - Zrób: „Settings” → „Import a backup” → plik z T-62 → „Replace what’s here”.
  - Wynik: Najpierw kopia obecnych danych i komunikat, gdzie jest; potem projekty z chwili T-62 wracają (Sweater test, liczniki, notatka, wzory).
  - Źródło: `brd/wymagania-dane.md:66` (BR-DAN-006); `zakres:45` (F-32) · automat: e2e 66
- [ ] **T-132** · iPhone · 2 min
  - Zrób: „Import a backup” → ten sam plik → „Merge with what’s here”.
  - Wynik: „Merged. …” — bez podwójnych projektów.
  - Źródło: `brd/wymagania-dane.md:66` · automat: e2e 08
- [ ] **G-11** · iPhone · 1 min · przewodnik po usunięciu i imporcie (nowe w buildzie 4)
  - Zrób: Po T-130 (przed T-131) i po T-132: „Settings” → spójrz na wartość wiersza „Guide”.
  - Wynik: Po T-130 „0 of 42” (było więcej). Po T-131 i T-132 nadal „0 of 42”: stan przewodnika nie jest w kopii — zamierzone.
  - Źródło: `tests/dane/przewodnik-przeczytane.test.ts:36-52`; `src/dane/baza/przeniesienie.ts:13`; P-690 · automat: Jest
- [ ] **T-133** · iPhone · 8 min
  - Zrób: (U12 + U9) Usuń Oczko z telefonu. Zainstaluj z TestFlight. Otwórz i **natychmiast**, gdy widać „+1”, stuknij raz. Wyjdź do ekranu głównego i otwórz ponownie. Powtórz całość 3 razy. Przy pierwszej próbie sprawdź też T-03.
  - Wynik: Za każdym razem 1 — stuknięcie nie ginie; brak okien przed „Today”; nigdy ekran trybu awaryjnego.
  - Źródło: `tf:85-86`; `brd/wymagania.md:89`; `niezawodnosc/runbook.md` §4 · automat: e2e 01, 09
- [ ] **G-30** · iPhone · 4 min · przewodnik bez licznika (nowe w buildzie 4)
  - Zrób: Usuń Oczko jeszcze raz, zainstaluj z TestFlight, otwórz. **Nie** stukaj „+1”. „Guide” → krok 2 „Show ›”. Znowu „Guide” → krok 4 „Show ›”. Znowu „Guide” → „Counter” → „Add counter” → „Show ›”.
  - Wynik: W przewodniku „Read: 0 of 42”. Krok 2 i krok 4 → zakładka „Today” z kartą „First counter” (nie ma jeszcze licznika ani wzoru). „Add counter” → zakładka „Projects”. Bez pustego ekranu i bez awarii.
  - Źródło: `src/domena/przewodnik.ts:15`, `:17`, `:39`, `:117-123`; `app/przewodnik.tsx:34-36`; P-691, P-696 · automat: Jest (`celPokaz`); na urządzeniu tylko tu
- [ ] **T-135** · iPhone · 1 min
  - Zrób: (TT-02) Po ostatniej instalacji otwórz „Settings” **bez** „Restore purchases”.
  - Wynik: „Oczko Pro” = „On”.
  - Źródło: `tf:87` · automat: tylko urządzenie
- [ ] **T-136** · iPhone · 1 min
  - Zrób: Podsumowanie całego testu.
  - Wynik: Ani razu reklama, prośba o śledzenie, prośba o konto ani awaria. Jeśli była awaria: godzina i numer kroku.
  - Źródło: `brd/wymagania-dane.md:248` (BR-ZAK-002); `brd/wymagania.md:93` (NFR-PRY-001) · automat: tylko urządzenie
- [ ] **T-137** · dodatkowy, po ok. 8 dniach · iPhone · 2 min
  - Zrób: Co najmniej 8 dni po T-72 (subskrypcja testowa wygasła) otwórz Oczko na iPhonie i stuknij „+1”.
  - Wynik: „Oczko Pro” nie jest już „On”; dane, historia i eksport są; limit dni wraca, dni z Pro się nie liczą (np. „4 of 5 …”).
  - Źródło: `brd/wymagania-dane.md:424` (BR-ZAK-007); `wydanie/kroki-wlasciciela-testflight.md:95-98` · automat: tylko urządzenie (reguła: wektory `docs/monetyzacja/limit.mjs`)

---

## Czego NIE testować na tym buildzie (z powodem)

- **Synchronizacja iCloud (F-27), przełącznik „Sync with iCloud”, TT-08** — W 1.0 przełącznik ukryty (`ICLOUD_W_1_0 = false`, `src/konfiguracja.ts:34`, ZM-06, P-492). T-64 i T-100 sprawdzają tylko, że go nie ma i że nic nie znika.
- **Apple Pencil (F-28: rysik pisze wybranym narzędziem)** — Właściciel nie ma rysika (`fakty-wlasciciela.md`, P-226). Ryzyko szczątkowe: ścieżka rysika tylko w teście jednostkowym; ścieżka palcem na iPadzie jest w T-97. Kontrakt zakresu zostawia to koordynatorowi (`scope-contract.md:230`).
- **Zakup „Yearly” i „Lifetime”** — Zakup dożywotni na Twoim Apple ID zostaje na stałe także w piaskownicy; potem nie da się już sprawdzić stanu bez Pro na tym koncie (jak w Treningu: `trening:docs/fakty-wlasciciela.md:17`). Logikę produktów sprawdza e2e 06 na sztucznym sklepie.
- **Opis „Highlighter” w przewodniku wspomina Apple Pencil** (`en.json:1089`) — bez rysika nie sprawdzisz tej części opisu; ścieżka palcem: T-97.
- **Synchronizacja stanu przewodnika między urządzeniami** — nie istnieje z założenia (P-690: stan urządzenia, bez iCloud); G-23 sprawdza tylko, że iPad liczy osobno.
- **Udostępnianie rodzinne (TT-04), zwrot w piaskownicy (TT-05)** — Potrzebny członek rodziny; sposób zwrotu `[DO USTALENIA]` OP-21 (`tf:63`).
- **TT-15: Pro na zegarku bez telefonu po wyczerpaniu limitu** — Wymaga 5 dni liczenia bez Pro i zegarka offline w nowym dniu; sposób odczytu Pro na zegarku `[DO USTALENIA]` OP-22 (`tf:80`).
- **Okno systemowe oceny (F-64)** — W TestFlight się nie pokazuje (`src/domena/ocena.ts:26`); T-55 sprawdza, że nie ma własnego okna, T-126 — odnośnik.
- **Aktualizacja 1.0 → 1.0.1 z danymi (TT-06 w pełnej postaci)** — Nie istnieje jeszcze wersja następna; jeśli masz zainstalowany build 1, 2 lub 3, robi to T-02. Inaczej: test bazy `tests/bazy/v1.db` w Node.
- **Przeniesienie danych z 0.1.0** — Świadomie brak migracji (P-070, `decyzje.md:76`).
- **Pełna pamięć zegarka, wiele godzin zegarka bez telefonu, restart telefonu bez odblokowania, raporty awarii z TestFlight** — Wymagają warunków, których nie da się przygotować w jednym podejściu (`tf:89-93`, `niezawodnosc/runbook.md` §6).
- **Nowy telefon z kopii urządzenia (BR-DAN-004/S1)** — Wymaga drugiego iPhone'a; ścieżka eksport → import jest w T-62 i T-131.
- **Wszystkie 35 języków (także przewodnika: 33 języki maszynowo, P-700)** — Próbka 3 języków (T-120–T-122, G-25, G-26); pełny przegląd tłumaczeń to fala 09 i zgłoszenia z „Report a translation problem”.
- **Funkcje poza 1.0: F-13 (Siri), F-22, F-29, F-39, F-40, F-42, F-44, F-62 (PÓŹNIEJ); F-23, F-30, F-41, F-43 (NIE)** — Nie ma ich w aplikacji (`scope-contract.md:28-73`, `:77-83`).

## Pokrycie funkcji z kontraktu zakresu (51 funkcji MVP)

- **F-01 Licznik od pierwszego uruchomienia, +1/−1, wibracja** — T-03, T-10, T-17, T-133
- **F-02 Historia zmian z godziną i cofnięciem** — T-12, T-13
- **F-03 Blokada przed przypadkowym stuknięciem** — T-14, T-114
- **F-04 Kilka liczników** — T-22
- **F-05 Licznik powtórzeń** — T-24
- **F-06 Przypomnienie „co N rzędów” z podglądem** — T-25, T-19, T-107
- **F-08 Cel rzędów części** — T-26, T-86
- **F-09 Znaczenie liczby** — T-15
- **F-10 Ekran nie gaśnie** — T-16
- **F-11 Sesja na ekranie blokady** — T-80
- **F-12 Liczenie na zegarku** — T-04, T-105, T-106, T-107
- **F-14 Projekt z częściami** — T-20, T-21
- **F-15 Notatka przy liczniku** — T-29
- **F-16 Zdjęcia projektu i etykiet** — T-35
- **F-17 Dane techniczne (drut mm i US)** — T-30, T-111
- **F-18 Powrót do projektu po przerwie** — T-61
- **F-19 Stan projektu i archiwum ukończonych** — T-55, T-58
- **F-20 Zrób taką samą** — T-31
- **F-21 Stoper sesji przy zablokowanym ekranie** — T-33, T-81, T-115
- **F-24 Import wzoru z pliku i zdjęcia** — T-40, T-42, T-48
- **F-25 Wzór i licznik na jednym ekranie** — T-46, T-96
- **F-26 Znacznik bieżącego rzędu** — T-45, T-38, T-98
- **F-27 Synchronizacja iCloud** — wypadło z 1.0 (ZM-06, `src/konfiguracja.ts:34`): T-64 i T-100 sprawdzają tylko brak przełącznika i brak utraty danych
- **F-28 Pisanie Apple Pencil** — sprawdzone, brak kroku — właściciel bez rysika (P-226); ścieżka palcem: T-97
- **F-31 Baza na urządzeniu, trwały zapis** — T-02, T-60, T-136
- **F-32 Eksport i import kopii** — T-62, T-131, T-132
- **F-33 Ostatnio usunięte 30 dni** — T-57
- **F-34 Usunięcie wszystkich danych** — T-130
- **F-35 Zakup Pro, przywracanie** — T-72, T-73, T-74, T-99, T-130, T-135
- **F-36 Bez reklam i śledzenia, polityka, język** — T-05, T-120, T-125, T-136
- **F-37 Zapas włóczki i narzędzi** — T-50, T-51, T-52, T-54, T-55
- **F-38 Obliczenia podstawowe** — T-53, T-66
- **F-45 Wpisanie wartości i zerowanie** — T-13
- **F-46 Licznik całości** — T-23
- **F-47 Strażnik stuknięć z tempa** — T-11
- **F-48 Wibracja przypomnienia inna niż rzędu** — T-25, T-107
- **F-49 Powrót do tego samego miejsca** — T-61, T-113
- **F-50 Lista projektów po roku** — T-34
- **F-51 Korekta czasu sesji** — T-33
- **F-52 Druga część pary** — T-27
- **F-53 Karta ukończenia** — T-55
- **F-54 Projekty dawno nieruszane** — T-71
- **F-55 Wzór ze strony WWW, Word, film** — T-41, T-43, T-44, T-48
- **F-56 Zakreślanie i notatki na wzorze palcem** — T-47, T-38, T-97
- **F-57 Zgłoś problem** — T-63, T-120
- **F-58 Widoczny stan synchronizacji i zegarka** — T-64, T-106 (stan zegarka: linia na zegarku w T-106; w „Data and sync” tylko jeśli jest — pokrycie słabe)
- **F-59 Kalendarz dni i podsumowanie** — T-56, T-71
- **F-60 Postęp w procentach** — T-28
- **F-61 Termin, cel dzienny i kolejność „który projekt dziś”** — T-32
- **F-63 Limit darmowych dni, strażnik, utrata Pro** — T-70, T-71, T-137 (utrata Pro: krok dodatkowy po ok. 8 dniach)
- **F-64 Prośba o ocenę i „Oceń”** — T-55, T-126

- **Przewodnik (nowe w buildzie 4; P-685–P-691, P-704–P-708; nie jest funkcją F kontraktu)** — wejścia G-01, G-06; rozwijanie i „przeczytane” G-02, G-09, G-11; „Show” G-03–G-05, G-07, G-08, G-30; VoiceOver G-20; duży tekst G-21; ciemny G-22; iPad G-23; języki G-25, G-26

Wymagania pozafunkcyjne: NFR-PIE-001 T-03, T-133 · NFR-DAN-001 T-02 · NFR-DAN-002 T-60 · NFR-OFF-001 T-43, T-51, T-73 · NFR-DOS-001 T-85–T-87 · NFR-DOS-002 T-90, T-91 · NFR-WYD-001 T-110 · NFR-ZEG-001 T-105, T-106 · NFR-UKL-001 T-95, T-96 · NFR-JEZ-001 T-120–T-122 · NFR-PRY-001 T-63, T-136.

## Otwarte `[DO USTALENIA]` i znaleziska przy pisaniu listy
- Numer buildu 4 w TestFlight — pole `1141` na górze.
- Próg czasu startu aplikacji na telefonie — w repo brak; T-110 tylko zapisuje pomiar.
- Zachowanie aplikacji po ręcznej zmianie daty systemowej (T-71): w `src/domena/limit.ts` nie ma ochrony przed zmianą zegara; wynik T-71 to też obserwacja, nie tylko test limitu.
- Rozjazd nazwy: dokumenty mówią „About our content” (`decyzje.md:641`, `design/fix11-2026-11-10.md`), interfejs pokazuje „About our information” (`src/i18n/slowniki/en.json:113`) — do roli 04.
- `wydanie/testflight-lista.md:27` mówi `ICLOUD_W_1_0 = true` dla TestFlight, kod i P-492 — `false`; obowiązuje kod.
- F-28 (rysik): decyzja koordynatora z `scope-contract.md:230` (ryzyko szczątkowe albo inna osoba z rysikiem).
- T-71 zmienia datę systemową; skutki uboczne poza Oczkiem (np. inne aplikacje) nie są znane — po kroku włącz „Ustaw automatycznie”.

### Znaleziska przy liście buildu 4 (przewodnik)
- Opis „Data and sync” w przewodniku: „iCloud sync on or off, and whether everything is saved.” (`en.json:1098`; pl „Synchronizacja iCloud i stan zapisu danych.”). W 1.0 przełącznika nie ma (`src/konfiguracja.ts:34`); ekran pokazuje tylko „iCloud sync is off.”. Może brzmieć jak obietnica przełącznika — do roli 04 (tekst), nie bloker. G-04 prosi o ocenę właściciela.
- „Show” przy „Data and sync” i „Report a problem” otwiera arkusz, bo te trasy są arkuszami (`app/_layout.tsx:136-137`); spec 04 §3 mówi „Pokaż otwiera ekran, nie menu ani arkusz” w sensie: nie otwiera arkusza za Ciebie. Zachowanie spójne z wejściem z „Settings”; do roli 04 tylko jako doprecyzowanie spec.
- Stos „Wstecz” po „Show” funkcji Ustawień (P-708) sprawdza tylko Jest na reduktorze stosu; na urządzeniu jedynie G-05 i G-07 (P-708: „Nie sprawdzono: stos na urządzeniu”).
- Prompt roli (`oczko-warsztat`) i repo Treningu nie były dostępne w tej sesji (dodanie repo odrzucone); praca z samego polecenia (KO-022). Format punktów (checkboksy) z polecenia X; kroki T-xx i ich analogie z Treningiem — z listy buildu 3.

## Recenzja niezależna listy buildu 3 (2026-11-10)
Dotyczy punktów T-xx (przeniesionych bez zmian treści). Punkty G-xx bez osobnej recenzji niezależnej w sesji X — fakty sprawdzone w kodzie 75242ba przez autora.
Subagent bez uzasadnień autora przeszedł listę jako właściciel z telefonem i porównał napisy z `src/i18n/slowniki/en.json` i ekranami. Naniesione po sprawdzeniu u źródła: język telefonu (T-05), „+1” na karcie „Today” (`src/ekrany/Dzis.tsx:122`), „Undo 4 rows”, stoper bez „Start” (`src/ekrany/Stoper.tsx:53`), „Continue with Monthly” (`en.json:485`), dwie linie pasa przypomnienia (`en.json:38-39`), „Next part” przed „What’s next?” (`app/licznik.tsx:43-50`), kolejność T-16 i F-18, nowe kroki T-19, T-38, T-137, kosz z licznikiem (T-57), kolejność „który projekt dziś” (T-32), połączenie U12 i U9 (T-133), usunięte T-112 i T-134, okno 6 dni po zakupie, realny czas 6–7 h.
