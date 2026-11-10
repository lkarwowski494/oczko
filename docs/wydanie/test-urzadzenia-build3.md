# Test na urządzeniach — build 3 (kandydat 1.0), pełna lista dla właściciela

Wersja 2026-11-10, rola 07 (tryb build, sesja L koordynatora). Kandydat: `claude/youthful-pasteur-kx83sn` @ 87ade5a, wersja 1.0.0 (`app.json:5`).
**Wyjątek nazwany:** właściciel 10.11: „Zrobię wszystko na kandydacie” i „Chcę pełną listę do testu na telefonie. To będzie pierwszy i ostatni poważny test”. Dlatego lista jest pełna, a nie zawężona do zmian od ostatniego testu (`docs/fakty-wlasciciela.md`). Zastępuje na tym buildzie `docs/jakosc/testflight-na-urzadzeniu.md` (2026-11-04); stamtąd przejęte są kroki U1–U12 i TT-01–TT-14, z numerem źródłowym w kolumnie „Źródło”.
Ścieżki w kolumnie „Źródło” liczone od `docs/` (np. `brd/wymagania-licznik.md:21`); `zakres:17` = `docs/scope-contract.md:17` (wiersz funkcji), `tf:24` = `docs/jakosc/testflight-na-urzadzeniu.md:24`.

## Zanim zaczniesz

**Czego potrzeba**
- iPhone z TestFlight; Apple Watch sparowany z tym iPhonem; iPad z tym samym Apple ID (bez Apple Pencil — wystarczy). Fakty: `docs/fakty-wlasciciela.md`.
- **Konto Sandbox nie jest potrzebne.** Aplikacja z TestFlight sama działa w środowisku testowym, zakup jest bezpłatny, subskrypcja odnawia się codziennie (do 6 razy w tygodniu). Źródło: `wydanie/kroki-wlasciciela-testflight.md:95-98` (strona Apple „Testing subscriptions and In-App Purchases in TestFlight”, odczyt 2026-11-01); tak samo w Treningu (Z-09). Nie szukaj opcji „Konto Sandbox” w Ustawieniach (Trening, lekcja L-028).
- Build 3 w TestFlight: numer buildu **[DO USTALENIA — poda koordynator po bramce buildu 3]**; wpisz go w raporcie.
- Pliki w aplikacji Pliki na iPhonie (przygotuj przed testem, ok. 5 min):
  - dowolny PDF wzoru, 3–10 stron;
  - `tekst.docx`, `tabela.docx`, `obraz.docx` z repo: `modules/oczko-wzor/TestyOknaMaszyn/Testy/korpus/` (GitHub → plik → „Download raw file” → Zapisz w Plikach);
  - nieobowiązkowo duży PDF 100–200 MB (do T-101).
- Na iPhonie: Ustawienia → Ekran i jasność → Automatyczna blokada = **1 minuta** (do T-16; po teście przywróć swoje).
- Druga osoba albo drugi telefon, który może do Ciebie zadzwonić (T-115). Bez tego T-115 = „nie sprawdzono”.

**Ile czasu [OCENA agenta, nie pomiar]:** ok. **4 h 25 min** obowiązkowo z przygotowaniem (część I ok. 2 h 20 min, część II ok. 1 h 30 min, części III–IV ok. 35 min; w tym 10 min czekania w T-113) + ok. 13 min kroków dodatkowych (T-49, T-101). Zalecane trzy podejścia: (1) część I, (2) część II, (3) części III i IV. Przerwa między sekcjami nic nie psuje; kolejność ważna tylko w dwóch miejscach: T-70–T-71 (limit) **przed** zakupem T-72, a część IV **na samym końcu** (usuwa dane testu).

**Jak zgłaszać wynik**
- Każdy krok: **tak / nie**. Przy „nie”: numer kroku + zrzut ekranu (albo nagranie ekranu) + jedno zdanie, co się stało. Przykład: „T-24 nie — brak wibracji przy rzędzie 8, zrzut”.
- Krok, którego nie da się wykonać: „T-xx nie sprawdzono — powód”.
- Wyślij koordynatorowi jedną wiadomością listę „T-01 tak, T-02 nie dotyczy, …”. Zrzuty tylko do prywatnego repo `oczko-warsztat` albo w wiadomości, nie do tego repo (mogą pokazywać Twoje dane).
- Teksty aplikacji są po angielsku; w krokach są dosłownie, w cudzysłowie.
- Kolumna „Automat”: „e2e NN” = ten sam przepływ sprawdza też scenariusz `e2e/scenariusze/NN-…yaml` na symulatorze (na Twoim telefonie sprawdzasz prawdziwe urządzenie); „tylko urządzenie” = żaden automat tego nie sprawdza. „atrapa” / „zastępczy” = automat sprawdza wersję udawaną (sztuczny sklep, sztuczny zegarek, plik wstrzyknięty zamiast arkusza udostępniania).

---

## Część I — blokuje zgłoszenie do App Review

### 1. Instalacja i pierwszy start (iPhone, zegarek) — ok. 10 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-01 | Otwórz TestFlight → „Oczko”. Zapisz, co jest teraz zainstalowane: brak aplikacji, wersja 0.1.0 albo wersja 1.0.0 (build 1 lub 2). | — (tylko zapis stanu; od niego zależy T-02). | `fakty-wlasciciela.md`; `decyzje.md:635-638` (buildy 1 i 2) | 1 | tylko urządzenie |
| T-02 | **Jeśli jest 1.0.0 z Twoimi danymi:** przed instalacją zrób zrzut listy „Projects” i jednego licznika. Potem w TestFlight „Install”/„Update” build 3, bez usuwania. Otwórz. **Jeśli jest 0.1.0:** zainstaluj build 3 na nią, bez usuwania. **Jeśli nic:** zainstaluj. | 1.0.0 → te same projekty, ta sama wartość licznika i historia co na zrzucie (zero utraty danych). 0.1.0 → start bez awarii, aplikacja pusta — zamierzone, dane 0.1.0 nie są przenoszone. Nigdy ekran trybu awaryjnego. | `brd/wymagania.md:73` (NFR-DAN-001); `brd/wymagania-dane.md:31` (BR-DAN-003); `jakosc/strategia.md:102` (TT-06); `tf:24` (TT-07); `decyzje.md:76` (P-070) | 3 | tylko urządzenie (aktualizacja: test bazy `tests/bazy/v1.db` w Node) |
| T-03 | Jeśli aplikacja jest pusta: na ekranie „Today” stuknij **„+1 row”** na karcie „First counter” (jeśli karta ma tylko „Open counter” — stuknij je, potem „+1 row”). Jeśli po T-02 masz dane, ten krok zrobisz w T-133. | Przed „Today” nie ma żadnego okna (powitania, zakupu, języka, zgody). Karta „First counter” z opisem „Tap +1 after each finished row. You can name the project later.” Po stuknięciu licznik pokazuje **1**, telefon krótko wibruje. | `brd/wymagania.md:89` (NFR-PIE-001); `brd/wymagania-licznik.md:4` (BR-LIC-001); `zakres:17` (F-01) | 2 | e2e 01, 02 |
| T-04 | Od razu po instalacji: na zegarku wciśnij koronę (siatka aplikacji). Na iPhonie otwórz aplikację Watch → przewiń do „Oczko”. Jeśli Oczka nie ma na zegarku, włącz instalację przełącznikiem przy „Oczko” i poczekaj do 5 min. Otwórz Oczko na zegarku. | Na siatce zegarka prawdziwa ikona Oczka (nie pusty krążek); aplikacja zegarka się otwiera i pokazuje licznik. | `tf:25` (TT-12); `jakosc/strategia.md:108` | 4 | tylko urządzenie (CI tylko buduje zegarek) |

### 2. Licznik — główna pętla (iPhone) — ok. 18 min
Między pojedynczymi stuknięciami „+1 row” zostaw ok. 3 s, chyba że krok mówi inaczej (szybka seria to osobny przypadek, T-11).

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-10 | Wejdź w licznik (na „Today” „Continue ›” albo „Open counter”). Stuknij „+1 row” 3 razy, potem „−1” raz. | Wartość 1 → 4 → 3. Każde +1 i −1 to krótka wibracja. Pod liczbą „Now working row …”. | `brd/wymagania-licznik.md:21` (BR-LIC-002), `:81` (BR-LIC-005); `zakres:17` | 2 | e2e 04 |
| T-11 | Stuknij „+1 row” 4 razy jak najszybciej (w ok. 2 s). Na banerze stuknij „Undo”. | Pojawia się baner „Added 4 rows in … s. Undo?”. Po „Undo” wartość wraca do 3. | `brd/wymagania-licznik.md:334` (BR-LIC-019); `zakres:58` (F-47) | 1 | e2e 04 |
| T-12 | Na liczniku stuknij „History”. Przy ostatniej zmianie stuknij „Undo”. | Lista zmian z godziną i wartością (najnowsze u góry); po „Undo” wartość licznika zmienia się o tę zmianę, a wpis jest oznaczony „undone”. | `brd/wymagania-licznik.md:38` (BR-LIC-003); `zakres:18` (F-02) | 2 | e2e 04 |
| T-13 | Menu ••• licznika → „Enter the row number” → wpisz **10** → zapisz. Potem ••• → „Reset to 0…” → „Reset to 0”. Potem cofnij zerowanie (baner albo „History” → „Undo”). | Licznik pokazuje 10. Zerowanie pyta o potwierdzenie, daje 0, cofnięcie przywraca 10. | `brd/wymagania-licznik.md:258` (BR-LIC-017); `zakres:56` (F-45) | 2 | tylko urządzenie (brak scenariusza e2e dla F-45; testy Jest) |
| T-14 | ••• → „Lock counter (ignore taps)”. Stuknij „+1 row” 2 razy. Potem odblokuj („Unlock”). | Wartość bez zmian; widać „Counter locked” i podpowiedź „Counter is locked. Unlock it at the top.” Po odblokowaniu +1 znów działa. | `brd/wymagania-licznik.md:60` (BR-LIC-004); `zakres:19` (F-03) | 1 | e2e 14 (zastępczy) |
| T-15 | ••• → „What the number shows” → „The row I’m on”. Potem z powrotem „Rows finished”. Jeśli tej pozycji nie ma w menu — zrzut menu. | Przy 10 skończonych rzędach duża liczba zmienia się na 11 (opis: „11 means you’re working on row 11”); historia bez zmian. Po powrocie znów 10. | `brd/wymagania-licznik.md:201` (BR-LIC-012); `zakres:24` (F-09) | 1 | e2e 56, 67 |
| T-16 | (U11) Otwórz dowolny wzór (jeśli żadnego jeszcze nie masz, zrób ten krok zaraz po T-40) i nie dotykaj telefonu 2 min. Wyjdź na listę „Projects”, czekaj 2 min. W „Settings” wyłącz „Keep screen on while counting”, wróć na licznik, czekaj 2 min; włącz opcję z powrotem. Z licznikiem na ekranie przejdź do Wiadomości, wróć do Oczka, czekaj 2 min. | Na wzorze i liczniku ekran nie gaśnie; na liście gaśnie po 1 min; z wyłączoną opcją gaśnie też na liczniku; po powrocie z innej aplikacji na licznik znów nie gaśnie. | `brd/wymagania-licznik.md:214` (BR-LIC-013); `zakres:25` (F-10); `tf:34` | 8 | tylko urządzenie |
| T-17 | „Settings” → wyłącz „Vibration” → na liczniku „+1 row”. Włącz z powrotem → „+1 row”. | Bez wibracji przy wyłączonej opcji; z wibracją po włączeniu. | `brd/wymagania-licznik.md:81` (BR-LIC-005) | 1 | tylko urządzenie |

### 3. Projekt, części i liczniki (iPhone) — ok. 27 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-20 | Na liczniku z T-10: ••• → „Name project and part” → projekt **Scarf test**, zapisz. | Nazwa widoczna na liczniku, na „Today” i w „Projects”. Projekt powstał sam z pierwszego licznika. | `brd/wymagania-projekt.md:5` (BR-PRJ-001); `zakres:29` (F-14) | 1 | e2e 33 |
| T-21 | „Projects” → „New project” → nazwa **Sweater test** → „Add part” **Back**, „Add part” **Front** → zapisz. W części Back stuknij „+1 row” 5 razy. | Projekt z dwiema częściami; Back = 5, Front = 0. | `brd/wymagania-projekt.md:5`; `zakres:29` | 3 | e2e 33 |
| T-22 | W Sweater test: przycisk „Add part or counter” → „Add counter” → „Name” **Stitches**, „In part” Back, „Counts” „Stitches” → zapisz. | Drugi licznik „Stitches” obok rzędów w części Back; liczy niezależnie. | `brd/wymagania-licznik.md:94` (BR-LIC-006), `:124` (BR-LIC-008); `zakres:20` (F-04) | 2 | e2e 54 |
| T-23 | W Back: „Add counter” → „Name” **Ribbing**, „Counts” „Rows” → zapisz. Stuknij „+1 row” na Ribbing 2 razy. | Nad licznikami części widać licznik całości kawałka = 5 + 2 = **7**. | `brd/wymagania-licznik.md:309` (BR-LIC-018); `zakres:57` (F-46) | 2 | e2e 58 |
| T-24 | Na liczniku rzędów Back (wartość 5): „Goal” → „Set a repeat length” → „Rows in one repeat” **0** → zapisz; potem **8** → zapisz. | Przy 0: „A repeat needs at least 1 row.” Przy 8: licznik pokazuje numer powtórzenia i rzędu w powtórzeniu. | `brd/wymagania-licznik.md:103` (BR-LIC-007); `zakres:21` (F-05) | 2 | e2e 55 |
| T-25 | Back: „Goal” → „Add a reminder (“every N rows”)” → „What to do” **decrease at both ends**, „Starting on row” **8**, „Every … rows” **6**, „How many times” **3**. Przeczytaj podgląd, „Save reminder”. Stuknij „+1 row” 2 razy (5 → 7). Zamknij oczy przy drugim stuknięciu. | Przed zapisem: „You’ll be reminded on rows: 8, 14, 20”. Przy 7 (pracujesz nad rzędem 8): pas pod liczbą „Row 8: decrease at both ends · 1 of 3”, instrukcja w podpisie „+1 row”. **Wibracja wyraźnie inna** niż zwykła wibracja rzędu (rozpoznasz bez patrzenia). | `brd/wymagania-licznik.md:133` (BR-LIC-009), `:175` (BR-LIC-010), `:368` (BR-LIC-020); `zakres:22` (F-06), `:59` (F-48); `scope-contract.md:230` (checklista P-419) | 3 | tylko urządzenie (wibracja); pas: Jest |
| T-26 | Back: „Goal” → „Set a goal for this part” → **10** → zapisz. Stuknij „+1 row” do 10. Stuknij „Next part”. | Przy 10: „Goal reached”, „Next part” pierwszy w strefie licznika; po stuknięciu otwiera się Front. | `brd/wymagania-licznik.md:188` (BR-LIC-011); `zakres:23` (F-08); `decyzje.md:644` (P-664, zmiana buildu 3) | 2 | e2e 34 |
| T-27 | Front: cel **3**, stuknij „+1 row” do 3. W arkuszu „What’s next?” wybierz „A second Front”. | „What’s next?” z opisem, że to ostatnia część; nowa część z celem 3 i wartością 0. | `brd/wymagania-projekt.md:175` (BR-PRJ-014); `zakres:63` (F-52) | 2 | e2e 34 |
| T-28 | Otwórz projekt Sweater test (link „Project ›” na liczniku). | Procent postępu pokazuje się sam (części mają cele); zapisz liczbę. Część bez celu, jeśli jest, oznaczona. Widać liczniki, notatkę (po T-29), wzór (po T-40) i datę. | `brd/wymagania-dni.md:82` (BR-DNI-004); `brd/wymagania-projekt.md:53` (BR-PRJ-005); `zakres:71` (F-60), `:33` (F-18) | 1 | e2e 59 |
| T-29 | Na liczniku Back: „Note” → wpisz **cast on 3 mm** → zapisz. | Notatka widoczna przy liczniku bez otwierania innego ekranu. | `brd/wymagania-projekt.md:14` (BR-PRJ-002); `zakres:30` (F-15) | 1 | e2e 57 |
| T-30 | Projekt Sweater test → „Needles or hook” → „Size in mm” **4** → zapisz. | „Shows as: 4 mm (US 6)”; w projekcie „4 mm (US 6)”. | `brd/wymagania-projekt.md:36` (BR-PRJ-004); `zakres:32` (F-17) | 1 | e2e 60 |
| T-31 | Projekt Sweater test → menu → „Make another like this”. | Nowy projekt z tymi samymi częściami i licznikami od 0; oryginał bez zmian. | `brd/wymagania-projekt.md:71` (BR-PRJ-007); `zakres:35` (F-20) | 1 | e2e 61 |
| T-32 | Projekt Sweater test → „Done by” → data **7 dni od dziś** → zapisz. Wróć na „Today”. | W formularzu „Today’s goal: N rows. It stays the same all day.” Na „Today” i w projekcie „Done by …, today 0 of N rows” (zapisz N). | `brd/wymagania-dni.md:99` (BR-DNI-005), `:146` (BR-DNI-006); `zakres:72` (F-61) | 2 | e2e 35 |
| T-33 | Na liczniku Back: „Timer” → „Start”. Stuknij „+1 row” 2 razy. „Pause timer”, „Resume timer”, „Stop timer”. Projekt → „Sessions” → otwórz sesję → zmień godzinę końca o 10 min wcześniej → zapisz. | Sesja na liście z czasem; po korekcie oznaczenie „Edited” i nowy czas projektu. | `brd/wymagania-projekt.md:85` (BR-PRJ-008), `:152` (BR-PRJ-013); `zakres:36` (F-21), `:62` (F-51) | 4 | e2e 37, 38 (część) |
| T-34 | W „Projects” sprawdź sekcje i wpisz w „Search” **Sweater**. | Sekcja „In progress” według ostatniej pracy; wyszukiwanie znajduje oba projekty Sweater. | `brd/wymagania-projekt.md:135` (BR-PRJ-012); `zakres:61` (F-50) | 1 | tylko urządzenie (część w e2e 20) |

### 4. Uprawnienia systemowe i zdjęcia (iPhone) — ok. 4 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-35 | Projekt Sweater test → „Add photo” → „Take photo”. W oknie iOS wybierz **„Nie pozwalaj”**. Stuknij „Open Settings”, włącz Aparat, wróć do Oczka. „Take photo” → zrób zdjęcie. Potem „Add photo” → „Choose from library” → wybierz zdjęcie. | Okno iOS pojawia się dopiero teraz (nie na starcie), z tekstem „Oczko uses the camera only when you take a photo of a pattern, a project or a yarn label. Photos stay on your device.” Po odmowie: „Oczko can’t use the camera” + „Open Settings”. Po zgodzie zdjęcie w projekcie. Biblioteka **bez** pytania o dostęp. W całym teście żadnej prośby o powiadomienia ani o śledzenie. | `brd/wymagania-projekt.md:27` (BR-PRJ-003); `zakres:31` (F-16); `app.json` (expo-image-picker, `photosPermission: false`) | 4 | e2e 17, 42 (atrapa aparatu) |

### 5. Wzory (iPhone) — ok. 27 min (+8 min dodatkowo)

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-40 | Sweater test → „Add pattern…” → „Choose file (PDF or Word)” → Twój PDF. | Wzór się otwiera, strony się przewijają. | `brd/wymagania-projekt.md:230` (BR-WZR-001); `zakres:38` (F-24) | 2 | e2e 21 (zastępczy) |
| T-41 | (U10) W projekcie Scarf test „Add pattern…” → „Choose file (PDF or Word)” kolejno `tekst.docx`, `tabela.docx`, `obraz.docx` (po każdym usuń wzór albo użyj kopii projektu z T-31). | Tekst, tabela i obraz widoczne; na końcu nie ma pustej strony. | `brd/wymagania-projekt.md:330` (BR-WZR-007); `zakres:66` (F-55); `tf:39` | 4 | e2e 25, 53 |
| T-42 | (U6) Kopia projektu → „Add pattern…” → „Scan pages” → 2 kartki. Potem w innym projekcie „Choose photos” → 1 zdjęcie strony. | Wzór PDF ze stronami w kolejności skanowania; ze zdjęcia — wzór ze zdjęcia. | `brd/wymagania-projekt.md:243` (BR-WZR-002); `tf:40` | 3 | e2e 22 (atrapa) |
| T-43 | Kopia projektu → „Add pattern…” → „Web page link…” → wpisz **https://apps4brew.com/oczko/support.html** → „Save page”. Włącz tryb samolotowy, otwórz ten wzór, wyłącz tryb. | Strona zapisana; w trybie samolotowym otwiera się taka sama. | `brd/wymagania-projekt.md:330`; `zakres:66` | 3 | e2e 24 (zastępczy) |
| T-44 | Sweater test → „Add video link” → link **https://apps4brew.com/oczko/support.html** → zapisz → stuknij „Video”. Potem w trybie samolotowym stuknij „Video”. | Link otwiera się w przeglądarce. Bez sieci: „This video needs an internet connection. Oczko keeps only the link.” | `brd/wymagania-projekt.md:330`; `zakres:66` | 2 | tylko urządzenie |
| T-45 | Otwórz PDF z T-40 pierwszy raz. Stuknij w rząd. Wróć na licznik, „+1 row”, wróć na wzór. Potem (U3) przytrzymaj palec na innym wierszu; menu wzoru ••• → „Rotate page” i znów przytrzymaj. Zamknij aplikację z przełącznika i otwórz wzór. | Wskazówka jednym zdaniem „Tap a row to place your marker.” Znacznik w stukniętym rzędzie, po +1 przesuwa się o rząd. Przytrzymanie stawia znacznik na wysokości palca, także na obróconej stronie. Po ponownym starcie znacznik na miejscu. | `brd/wymagania-projekt.md:252` (BR-WZR-003); `zakres:40` (F-26); `tf:41` | 4 | e2e 62 (bez przytrzymania) |
| T-46 | (U7) Na liczniku obróć telefon poziomo; potem na „Today” i „Settings”. Potem na wzorze obróć poziomo i stuknij „+1 row”. | Licznik, „Today” i „Settings” zostają w pionie. Na wzorze poziomo: wzór i licznik razem, +1 działa; po obrocie ta sama strona i wartość. | `brd/wymagania-projekt.md:300` (BR-WZR-005); `zakres:39` (F-25); `tf:32` | 2 | e2e 23, 45 |
| T-47 | Na wzorze włącz „Highlighter”, zakreśl jedną linię palcem; wyłącz i przewiń stronę palcem. Zamknij i otwórz wzór. | Zakreślenie zostaje po ponownym otwarciu; przewijanie bez zakreślacza nie zostawia śladu. | `brd/wymagania-projekt.md:351` (BR-WZR-008); `zakres:67` (F-56) | 2 | e2e 26, 27 |
| T-48 | (U5) (1) Safari: otwórz **https://apps4brew.com/oczko/support.html** → Udostępnij → Oczko → wybierz Scarf test. (2) Pliki: PDF → Udostępnij → Oczko → „New project”. (3) Zdjęcia: 1 zdjęcie → Udostępnij → Oczko. Otwórz Oczko. | Oczko jest na liście udostępniania; każdy wzór trafia do wybranego albo nowego projektu. | `brd/wymagania-projekt.md:230`, `:330`; `tf:42` | 5 | e2e 52 (zastępczy: plik wstrzyknięty) |
| T-49 (dodatkowy) | (U5) `.docx` z Plików → Oczko; 20 zdjęć naraz; załącznik PDF z Poczty; w trybie samolotowym strona z Safari → wyłącz tryb → otwórz Oczko. | Wszystko dociera; zlecenie bez sieci czeka i trafia do projektu po powrocie sieci. | `tf:43` | 8 | tylko urządzenie |

### 6. Narzędzia: zapas i obliczenia (iPhone) — ok. 8 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-50 | „Tools” → „Yarn” → „Add yarn”: „Name” **Test merino**, „Skeins” **3**, „Length per skein” **437** z jednostką „yd” → zapisz. | W zapasie „3 skeins”, długość z przeliczeniem ok. **399.59 m**. | `brd/wymagania-narzedzia.md:7` (BR-ZAP-001); `zakres:50` (F-37) | 2 | e2e 40 |
| T-51 | Tryb samolotowy → „Tools” → „Yarn” → szukaj **merino**. Wyłącz tryb. | Test merino znaleziona bez sieci. | `brd/wymagania-narzedzia.md:46` (BR-ZAP-004) | 1 | e2e 16 |
| T-52 | „Tools” → „Needles and hooks” → dodaj **4** mm → zapisz. | Pozycja „4 mm (US 6)”. | `brd/wymagania-narzedzia.md:29` (BR-ZAP-003) | 1 | tylko urządzenie |
| T-53 | „Tools” → „Swatch calculator”: „Swatch stitches” **22**, „Swatch width, cm” **10**, „Width you want (same unit)” **50** → „Calculate”. Potem „Settings” → „Units” → „Imperial” → wróć do kalkulatora → „Units” z powrotem „Automatic”. | Wynik **110 stitches** (22 ÷ 10 × 50), linia „From 22 stitches per 10 cm and 50 cm.” i kategoria grubości z zakresem (zapisz, jaka). Przy „Imperial” pola w calach. | `brd/wymagania-narzedzia.md:60` (BR-KAL-001), `:107` (BR-KAL-003), `:193` (BR-KAL-008); `zakres:51` (F-38) | 3 | e2e 41 |
| T-54 | Scarf test → „Yarn for this project” → wybierz Test merino. | Włóczka przypisana do projektu. | `brd/wymagania-narzedzia.md:20` (BR-ZAP-002) | 1 | tylko urządzenie |

### 7. Ukończenie projektu, historia, kosz (iPhone) — ok. 9 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-55 | Scarf test: ••• → „Mark project as finished”. W „Yarn used” ustaw „Skeins of Test merino used” = **1**. Na karcie stuknij „Share”, zamknij arkusz bez wysyłania, zamknij kartę. Otwórz „Tools” → „Yarn”. | Karta ukończenia pojawia się sama (stopka „Counted in Oczko”, czas, dni); „Share” otwiera systemowy arkusz. W zapasie 2 skeins. Scarf test w sekcji „Finished”. Okno oceny Apple **nie** pojawi się — w TestFlight jest wyłączone (`src/domena/ocena.ts:26`). | `brd/wymagania-projekt.md:62` (BR-PRJ-006), `:192` (BR-PRJ-015); `brd/wymagania-dane.md:196` (BR-DAN-012); `zakres:34`, `:64`, `:75` | 4 | e2e 43, 65 |
| T-56 | Zakładka „History”. Stuknij dzisiejszy dzień. Przewiń pod kalendarz. | Dziś ma znak; po stuknięciu projekty i rzędy z dnia; pod spodem podsumowanie tygodnia i miesiąca. Na ekranie licznika nic z kalendarza. | `brd/wymagania-dni.md:8`, `:43`, `:64` (BR-DNI-001–003); `zakres:70` (F-59) | 2 | e2e 64 |
| T-57 | Kopia projektu z T-31: menu → „Delete project…” → „Delete project”. „Projects” → „Recently deleted” → „Show” → „Restore”. | Przy usuwaniu informacja o 30 dniach w koszu; po „Restore” projekt wraca z licznikami. | `brd/wymagania-dane.md:117` (BR-DAN-008); `zakres:46` (F-33) | 2 | e2e 36 |
| T-58 | „Projects” → sekcja „Finished” → Scarf test → menu projektu → „Resume project”. | Projekt wraca do „In progress”. | `brd/wymagania-projekt.md:62` | 1 | tylko urządzenie |

### 8. Dane po zamknięciu, ustawienia, eksport (iPhone) — ok. 12 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-60 | Na liczniku Back stuknij „+1 row” i **od razu** zamknij aplikację z przełącznika aplikacji. Otwórz. | Ostatnie +1 zapisane. | `brd/wymagania.md:77` (NFR-DAN-002) | 1 | e2e 10 |
| T-61 | Otwórz wzór Sweater test na stronie 2, powiększ dwoma palcami. Zamknij aplikację z przełącznika. Otwórz. Na „Today” stuknij „+1 row” na karcie „Continue”, potem „Continue ›”. | Start na „Today” z kartą „Continue” tego licznika (Sweater test, Back). +1 z karty zmienia ten sam licznik. „Continue ›” otwiera licznik; wzór na stronie 2 z tym samym powiększeniem. | `brd/wymagania-projekt.md:118` (BR-PRJ-011); `zakres:60` (F-49) | 3 | e2e 03, 18 |
| T-62 | „Settings” → „Export all data” → zapisz w Plikach („Na moim iPhonie”). | Plik kopii w Plikach; aplikacja mówi, gdzie jest. Zostaw go do T-131. | `brd/wymagania-dane.md:53` (BR-DAN-005); `zakres:45` (F-32) | 2 | e2e 08 |
| T-63 | „Settings” → „Report a problem”. Przeczytaj podgląd. Nie wysyłaj — zamknij. | Podgląd diagnostyki przed wysłaniem; w treści nie ma nazw „Scarf test” ani „Sweater test”, notatek ani zdjęć. Przycisk „Share”. | `brd/wymagania-dane.md:147` (BR-DAN-010); `zakres:68` (F-57) | 2 | e2e 63 |
| T-64 | „Settings” → „Data and sync”. | „iCloud sync is off.” / „Everything is saved on this device.”; **brak** przełącznika „Sync with iCloud” — zamierzone w 1.0. Stan zegarka jednym zdaniem, jeśli jest pokazany. | `brd/wymagania-dane.md:14` (BR-DAN-002), `:177` (BR-DAN-011); `zakres:41`, `:69`; `src/konfiguracja.ts:34` | 1 | e2e 48 (atrapa) |
| T-65 | „Settings” → „Open source licenses” (nowe w buildzie 3). Otwórz grupę „Fonts” i jedną pozycję z „npm packages”. | Grupa „Fonts” na górze, Bree Serif z licencją OFL; teksty licencji się otwierają. | `decyzje.md:641` (P-661); `programista/build3-stan.md:13` | 2 | Jest (`tests/ekrany/m1-245-licencje.test.tsx`) |
| T-66 | „Settings” → „About our information”. | Ekran źródeł wiedzy obliczeń. (Dokumenty nazywają go „About our content” — rozjazd nazwy zgłoszony niżej.) | `zakres:51` (ZM-04); `decyzje.md:641` | 1 | tylko urządzenie |

### 9. Limit darmowych dni i zakup w piaskownicy (iPhone) — ok. 21 min
Kolejność ważna: najpierw limit (wymaga braku Pro), potem zakup.

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-70 | „Settings” → linia pod „Oczko Pro”. Jeśli „Oczko Pro” już jest „On” (zakup z wcześniejszego buildu), T-70 i T-71 oznacz „nie sprawdzono — Pro aktywne”. | „{x} of 5 free crafting days left in {bieżący miesiąc}”; po świeżej instalacji „4 of 5” (dziś liczyłeś, jeden dzień zużyty). | `brd/wymagania-dane.md:296` (BR-ZAK-005); `zakres:74` (F-63) | 1 | e2e 05 |
| T-71 | **Zmiana daty (odwracalna).** Ustawienia iOS → Ogólne → Data i czas → wyłącz „Ustaw automatycznie” → ustaw **1. dzień następnego miesiąca** (test w listopadzie: 1 grudnia). Otwórz Oczko → zakładka „Projects”. Potem „Today” → „+1 row” na karcie. Powtórz zmianę daty i „+1 row” dla dni **2, 3, 4 i 5** tego miesiąca. Ustaw dzień **6**, otwórz „Today”, potem licznik. Sprawdź „History” i „Export all data” (nie zapisuj). Na koniec włącz „Ustaw automatycznie”. | Dzień 1, „Projects”: raz okno „Your first crafting day is done” z „Keep counting” i „See Oczko Pro” (nigdy na liczniku). Dzień 5: cicha linia ostatniego darmowego dnia. Dzień 6: w miejscu „+1 row” (karta i licznik) „No free crafting days left in {miesiąc}. Counting is paused until …”, link „Oczko Pro removes the limit” poza strefą +1, żaden ekran zakupu sam się nie otwiera; historia i eksport działają. Na liście „Projects” Scarf test z „last worked … days ago”. Po powrocie daty dziś znów można liczyć. | `brd/wymagania-dane.md:296`, `:363` (BR-ZAK-006); `brd/wymagania-projekt.md:209` (BR-PRJ-016); `zakres:74` (F-63, ZM-05), `:65` (F-54) | 15 | e2e 05, 07, 12, 20 (zegar wstrzyknięty) |
| T-72 | „Settings” → „Oczko Pro” → **„Monthly”** → potwierdź w oknie Apple. **Nie kupuj „Yearly” ani „Lifetime”** (powód w „Czego nie testować”). | Okno Apple oznaczone jako testowe, bez opłaty. Od razu „You have Oczko Pro.”; w „Settings” „Oczko Pro” z „On” i pozycja „Manage subscription”. Na ekranie zakupu „Restore purchases”, „Privacy Policy”, „Terms of Use”. | `brd/wymagania-dane.md:219` (BR-ZAK-001); `zakres:48` (F-35); `tf:59` (TT-01); `wydanie/sklep.md:292` | 3 | e2e 06 (sztuczny sklep) |
| T-73 | (TT-03) Tryb samolotowy, zamknij aplikację z przełącznika, otwórz. Wyłącz tryb. | Pro nadal włączone. | `brd/wymagania-dane.md:257` (BR-ZAK-003); `tf:60` | 1 | tylko urządzenie |
| T-74 | „Oczko Pro” → „Restore purchases”. | Komunikat o przywróceniu; Pro bez zmian, bez błędu. | `brd/wymagania-dane.md:219` | 1 | e2e 06 (sztuczny sklep) |

---

## Część II — czego automat nie sprawdzi

### 10. Ekran blokady (iPhone) — ok. 6 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-80 | (TT-09) Na liczniku Back „+1 row” raz. Zablokuj telefon. Na ekranie blokady stuknij +1 trzy razy (co ok. 3 s). Odblokuj. | Na ekranie blokady sesja Oczka z rzędem; wartość w aplikacji większa o 3, bez konfliktu; ewentualny baner „Added 3 rows from the lock screen at …. Undo?”. | `brd/wymagania-licznik.md:227` (BR-LIC-014); `zakres:26` (F-11); `tf:33` | 3 | tylko urządzenie |
| T-81 | „Timer” → „Start” → zablokuj telefon, odczekaj 1 min. Odblokuj → „Stop timer”. | Na ekranie blokady czas płynie razem z rzędem; jest tylko +1, bez przycisku zatrzymania (tylko do odczytu). Zatrzymanie w aplikacji. | `brd/wymagania-projekt.md:85` (BR-PRJ-008); `zakres:36` (F-21, ZM-10) | 3 | tylko urządzenie |

### 11. VoiceOver (iPhone) — ok. 12 min
Włączanie: Ustawienia → Dostępność → VoiceOver → włącz (przesuwanie jednym palcem w prawo = następny element, stuknięcie dwukrotne = aktywuj). Wyłączenie tak samo; jeśli się zgubisz, poproś Siri „Wyłącz VoiceOver”.

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-85 | „Today”: przejdź po wszystkich elementach. Na karcie „Continue” aktywuj „+1 row”. | Każdy element ma zrozumiałą nazwę (nie „button”, nie nazwę pliku); po +1 VoiceOver mówi nową wartość. | `brd/wymagania.md:97` (NFR-DOS-001) | 3 | e2e 29 (tylko etykiety) |
| T-86 | Bez VoiceOver ustaw w części „A second Front” (cel 3, z T-27) wartość **2** przez „Enter the row number”. Włącz VoiceOver, przejdź po elementach licznika i aktywuj „+1 row”. | Słychać całe ogłoszenie rzędu, a po nim „Goal reached” (oba, jedno nie ucina drugiego). „Next part” jest pierwszy w strefie licznika. Wskazówka znacznika na wzorze się nie pokazuje. | `decyzje.md:649` (P-670, I-001), `:644` (P-664); `zakres:40` | 4 | Jest (`tests/ekrany/i-001-ogloszenie-celu-kolejka.test.tsx`) |
| T-87 | „Settings”, „Oczko Pro”, „Projects”, „History”: przejdź po elementach. | Wszystkie wiersze i przyciski czytelne; na „Oczko Pro” ceny i okresy czytane w całości. | `brd/wymagania.md:97`; `decyzje.md:501` (P-496, VoiceOver 014) | 5 | e2e 29 (tylko etykiety) |

### 12. Duży tekst, tryb ciemny, obrót — ok. 15 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-90 | (TT-16) Ustawienia → Dostępność → Ekran i wielkość tekstu → Większy tekst → włącz „Większe rozmiary” → suwak **maksymalnie** (AX5). Przejrzyj: „Today”, licznik (z celem — „Next part”), wzór z paskiem notatki, projekt, „History”, „Settings”, „Oczko Pro”, „Open source licenses”. Stuknij kciukiem każdy główny przycisk. | Nic nie jest ucięte ani nie nachodzi; tytuł wzoru z ▾ i karta Worda czytelne; każdy przycisk trafiony za pierwszym razem. | `brd/wymagania.md:101` (NFR-DOS-002); `jakosc/strategia.md:112` (TT-16); `decyzje.md:642-643` (B3-01, B3-02) | 6 | e2e 30 (AX5 przed startem) |
| T-91 | Przy **otwartej** aplikacji zmień suwak na **połowę** zakresu „Większe rozmiary”, wróć do Oczka bez zamykania (licznik, „Settings”). Potem przywróć swój rozmiar. | Układ dostosowuje się bez zamykania; nic nie ucięte. (Trening L-051: ucięcia wyszły dopiero przy zmianie w trakcie i w połowie skali.) | `brd/wymagania.md:101`; Trening `docs/40-lekcje.md:185-191` | 3 | tylko urządzenie |
| T-92 | Centrum sterowania → tryb ciemny. Zamknij Oczko z przełącznika i otwórz. Przejrzyj „Today”, licznik, wzór, „Settings”, „Oczko Pro”. Wróć do jasnego. | Ekran startowy i tło ładowania ciemne, bez białego błysku. Wszystkie teksty czytelne. | `scope-contract.md:230` (088, 089; P-431, `decyzje.md:436`) | 4 | e2e w trybie ciemnym tylko na żądanie `[e2e-ciemny]` |
| T-93 | Na iPhonie obróć telefon na „Projects”, „History”, „Tools” (licznik i wzór były w T-46). | Wszystko poza wzorem zostaje w pionie. | `tf:32` (U7) | 2 | e2e 45 (część) |

### 13. iPad (bez Apple Pencil) — ok. 25 min (+5 min dodatkowo)

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-95 | Zainstaluj build 3 z TestFlight na iPadzie (to samo Apple ID). Otwórz. Na „Today” „+1 row”. | Start bez awarii; „Today” z kartą „First counter”, +1 działa. Zakupu nie trzeba ponawiać (T-99). | `brd/wymagania.md:117` (NFR-UKL-001) | 3 | e2e 44 (iPad) |
| T-96 | (U1) Utwórz projekt, dodaj PDF (Pliki iPada albo Udostępnij → Oczko). Obróć pion/poziom. Potem Split View z Safari na ⅓ i ½ szerokości oraz Slide Over. Przejrzyj licznik, wzór, „Settings”. | Wzór i licznik razem w obu orientacjach; w wąskim oknie układ jak na telefonie; w szerszych treść w kolumnie; nic nie ucięte. Na iPadzie obraca się wszystko. | `brd/wymagania-projekt.md:300` (BR-WZR-005); `brd/wymagania.md:117`; `tf:48`, `:52` | 7 | e2e 44, 46 (zastępczy) |
| T-97 | (U2, U8) Na wzorze włącz „Highlighter”; rysuj jednym palcem, przewijaj dwoma; „Undo last stroke”. W trakcie rysowania wyjdź do ekranu głównego i wróć; potem zamknij aplikację z przełącznika i otwórz. | Jeden palec rysuje, dwa przewijają; cofnięcie działa; kreski zostają po powrocie i po ponownym starcie. | `brd/wymagania-projekt.md:351` (BR-WZR-008); `tf:49-50` | 6 | e2e 47 |
| T-98 | (U3) Przytrzymaj palec na wierszu wzoru; „Rotate page” i powtórz. | Znacznik na wysokości palca. | `tf:41`, `:51` | 2 | tylko urządzenie |
| T-99 | (TT-10) „Settings” → „Oczko Pro” → „Restore purchases”. | Pro włączone na iPadzie. | `brd/wymagania-dane.md:219`; `tf:61` | 2 | tylko urządzenie |
| T-100 | Policz 5 rzędów na iPadzie i 5 na iPhonie w różnych projektach. | Dane się **nie** synchronizują (iCloud wyłączony w 1.0) i nic nie znika na żadnym urządzeniu. | `src/konfiguracja.ts:34`; `zakres:41` | 2 | tylko urządzenie |
| T-101 (dodatkowy) | (U4) Duży PDF 100–200 MB → „Choose file (PDF or Word)”, przewiń do końca. | Otwiera się, przewija bez widocznych zacięć, aplikacja się nie zamyka; zapisz czas otwarcia w sekundach. | `tf:53` | 5 | tylko urządzenie |

### 14. Apple Watch — ok. 15 min
„Telefon poza zasięgiem” = na iPhonie tryb samolotowy **i** wyłączony Bluetooth, albo iPhone w innym pokoju (ponad ok. 10 m). Między +1 na zegarku ok. 3 s.

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-105 | Na iPhonie „Projects” → „New project” → **Watch test** → stuknij „+1 row” raz (to ostatni używany licznik). Telefon w zasięgu. Na zegarku otwórz Oczko, stuknij „+1 row” 2 razy. Spójrz na iPhone'a. | Zegarek pokazuje ten sam licznik co telefon; po chwili iPhone pokazuje wartość większą o 2. Zegarek wibruje przy +1. | `brd/wymagania-licznik.md:236` (BR-LIC-015); `brd/wymagania.md:109` (NFR-ZEG-001); `zakres:27` (F-12) | 3 | e2e 15 (atrapa zegarka) |
| T-106 | (TT-13) Na iPhonie w Watch test ustaw licznik na **10** („Enter the row number”). Telefon poza zasięgiem. Na zegarku 3 × „+1 row”. Przywróć telefon, odblokuj, czekaj do minuty, otwórz projekt. | Zegarek: 13 i cicha linia „iPhone not nearby. 3 changes are saved on this watch.” Po powrocie linia znika, iPhone pokazuje 13. Zapisz, po ilu sekundach zniknęła linia. | `tf:77`; `brd/wymagania-dane.md:177` (BR-DAN-011) | 6 | tylko urządzenie |
| T-107 | (TT-14) Na iPhonie w Watch test ustaw licznik na **10** i dodaj przypomnienie („Goal” → „Add a reminder (“every N rows”)”): od rzędu **12**, co **6**, **8** razy, „decrease at both ends”. Telefon w zasięgu; poczekaj ok. 30 s; na zegarku „+1 row” (10 → 11). | Zegarek wibruje inaczej niż przy zwykłym rzędzie; pas „Row 12: decrease at both ends · 1 of 8”. | `tf:78`; `brd/wymagania-licznik.md:368` (BR-LIC-020) | 6 | e2e 15 (atrapa) |

### 15. Wydajność odczuwalna, klawiatura, przerwania (iPhone) — ok. 14 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-110 | Zamknij Oczko z przełącznika. Otwórz i licz w myślach do pokazania „Today”. Na liczniku stuknij „+1 row” 20 razy w równym tempie (co ok. 1 s). | Zapisz czas startu w sekundach (progu w repo brak — `[DO USTALENIA]`). Każde +1 widać od razu, bez opóźnienia i bez zgubionego stuknięcia: wartość +20. | `brd/wymagania.md:105` (NFR-WYD-001); `jakosc/stan.md:6` | 3 | e2e 31 (pomiar na symulatorze) |
| T-111 | „Enter the row number”: sprawdź klawiaturę, wpisz **12a**, potem **12**. „Needles or hook” → „Size in mm” wpisz **3,25** (przecinek z klawiatury). | Przy liczniku klawiatura numeryczna; pola i „Save” nie są zasłonięte klawiaturą; złe dane → „Enter a whole number, 0 or more.” Rozmiar 3,25 przyjęty i pokazany jako 3.25 mm (z numerem US, jeśli jest). Klawiatura chowa się po zapisie. | `brd/wymagania-licznik.md:258`; `brd/wymagania-projekt.md:36` | 3 | tylko urządzenie |
| T-112 | Na liczniku zablokuj telefon przyciskiem bocznym i odblokuj. | Ten sam ekran i wartość. | `brd/wymagania-projekt.md:118` | 1 | tylko urządzenie |
| T-113 | Na liczniku przejdź do innych aplikacji na **10 min**, wróć do Oczka. | Ten sam licznik, ta sama wartość, bez ponownego startu od „Today”. | `brd/wymagania-projekt.md:118` (BR-PRJ-011/S2) | 1 (+10 czekania) | e2e 19 |
| T-114 | Na liczniku ściągnij Centrum powiadomień i Centrum sterowania, zamknij je. | Żadne +1 nie zostało dodane przypadkiem. | `brd/wymagania-licznik.md:60` (BR-LIC-004) | 1 | e2e 14 (zastępczy) |
| T-115 | Na liczniku z działającym „Timer” niech ktoś do Ciebie zadzwoni; odbierz, rozłącz się po 30 s, wróć do Oczka. | Licznik i stoper działają dalej; wartość bez zmian; aplikacja nie startuje od nowa. | `brd/wymagania-projekt.md:85`, `:118` | 3 | tylko urządzenie |

---

## Część III — języki i strony

### 16. Języki — próbka (iPhone) — ok. 8 min
W buildzie 35 lokalizacji (`app.json:56`); automat sprawdza ekrany tylko po angielsku (e2e uruchamia en-US).

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-120 | „Settings” → „Language” → „Polski”. Przejrzyj „Today”, licznik, „Settings”, „Oczko Pro”, „Open source licenses”. | Teksty po polsku; w „Settings” wiersz jakości tłumaczenia z „Report a translation problem” (otwiera arkusz zgłoszenia). Ekran licencji może zostać po angielsku — zamierzone dla pl (P-673). | `zakres:49` (ZM-02); `decyzje.md:651` (P-673) | 3 | e2e 39 (trwałość wyboru) |
| T-121 | „Language” → „Deutsch”, potem „日本語”. Na każdym: „Today”, licznik z przypomnieniem, „Oczko Pro”. | Teksty nieucięte (długie słowa niemieckie, znaki japońskie); ceny na „Oczko Pro” w walucie Twojego konta App Store. | `brd/wymagania.md:121` (NFR-JEZ-001) | 3 | tylko urządzenie |
| T-122 | „Language” → „Same as phone”. Zamknij i otwórz aplikację. | Aplikacja wraca do języka telefonu i to zostaje po ponownym starcie. | `zakres:49`; e2e 39 | 2 | e2e 39 |

### 17. Strony z linków w aplikacji — ok. 4 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-125 | „Settings” → „Privacy Policy”; „Help”. „Oczko Pro” → „Privacy Policy”; „Terms of Use”. | Polityka: **https://apps4brew.com/oczko/privacy.html**; pomoc: **https://apps4brew.com/oczko/support.html**; warunki: standardowa umowa Apple (EULA). Każda strona się otwiera, po angielsku, bez błędu. Nigdy adres github.io. | `wydanie/adres-strony.json`; `wydanie/sklep.md:37`, `:282`; `brd/wymagania-dane.md:270` (BR-ZAK-004); `zakres:49` (F-36) | 3 | e2e 68 (tylko widoczność wiersza) |
| T-126 | „Settings” → „Rate Oczko”. | Otwiera App Store; strona może pokazać błąd/„nie znaleziono” — **oczekiwane przed publikacją** (sprawdzenie adresów 10.11: 404). Aplikacja się nie zawiesza. | `wydanie/dziennik.md:9`; `brd/wymagania-dane.md:196` | 1 | e2e 65 |

---

## Część IV — na samym końcu (usuwa dane testu)

### 18. Kopia, usunięcie, import, instalacja od zera (iPhone) — ok. 21 min

| ID | Co zrobić | Co powinno się stać | Źródło | Min | Automat |
|---|---|---|---|---|---|
| T-130 | „Settings” → „Delete all data”. Przeczytaj okno, potwierdź „Delete all data”. Otwórz Pliki → Oczko → Backup. | W oknie zdania o kopii („Oczko first saves a copy in the Files app, in Oczko › Backup…”) i o Pro („Oczko Pro isn’t deleted…”). Aplikacja pusta; kopia jest w Plikach; Pro nadal „On” (jeśli nie — „Restore purchases” je przywraca, TT-11). | `brd/wymagania-dane.md:138` (BR-DAN-009); `zakres:47` (F-34); `tf:62` | 3 | e2e 51 (część iCloud: atrapa) |
| T-131 | „Settings” → „Import a backup” → plik z T-62 → „Replace what’s here”. | Najpierw kopia obecnych danych i komunikat, gdzie jest; potem projekty z chwili T-62 wracają (Sweater test, liczniki, notatka, wzory). | `brd/wymagania-dane.md:66` (BR-DAN-006); `zakres:45` (F-32) | 3 | e2e 66 |
| T-132 | „Import a backup” → ten sam plik → „Merge with what’s here”. | „Merged. …” — bez podwójnych projektów. | `brd/wymagania-dane.md:66` | 2 | e2e 08 |
| T-133 | (U12) Usuń Oczko z telefonu. Zainstaluj z TestFlight. Otwórz i **natychmiast**, gdy widać „+1 row”, stuknij raz. Powtórz całość 3 razy. Przy pierwszej próbie sprawdź też T-03. | Za każdym razem 1 — stuknięcie nie ginie; brak okien przed „Today”. | `tf:85`; `brd/wymagania.md:89` | 6 | e2e 01 |
| T-134 | (U9) Usuń, zainstaluj, otwórz i od razu wyjdź do ekranu głównego; otwórz ponownie. Powtórz 3 razy. | Nigdy ekran trybu awaryjnego. | `tf:86`; `niezawodnosc/runbook.md` §4 | 4 | e2e 09 (start awaryjny celowy) |
| T-135 | (TT-02) Po ostatniej instalacji otwórz „Settings” **bez** „Restore purchases”. | „Oczko Pro” = „On”. | `tf:87` | 1 | tylko urządzenie |
| T-136 | Podsumowanie całego testu. | Ani razu reklama, prośba o śledzenie, prośba o konto ani awaria. Jeśli była awaria: godzina i numer kroku. | `brd/wymagania-dane.md:248` (BR-ZAK-002); `brd/wymagania.md:93` (NFR-PRY-001) | 1 | tylko urządzenie |

---

## Czego NIE testować na tym buildzie (z powodem)

| Co | Powód |
|---|---|
| Synchronizacja iCloud (F-27), przełącznik „Sync with iCloud”, TT-08 | W 1.0 przełącznik ukryty (`ICLOUD_W_1_0 = false`, `src/konfiguracja.ts:34`, ZM-06, P-492). T-64 i T-100 sprawdzają tylko, że go nie ma i że nic nie znika. |
| Apple Pencil (F-28: rysik pisze wybranym narzędziem) | Właściciel nie ma rysika (`fakty-wlasciciela.md`, P-226). Ryzyko szczątkowe: ścieżka rysika tylko w teście jednostkowym; ścieżka palcem na iPadzie jest w T-97. Kontrakt zakresu zostawia to koordynatorowi (`scope-contract.md:230`). |
| Zakup „Yearly” i „Lifetime” | Zakup dożywotni na Twoim Apple ID zostaje na stałe także w piaskownicy; potem nie da się już sprawdzić stanu bez Pro na tym koncie (jak w Treningu: `trening:docs/fakty-wlasciciela.md:17`). Logikę produktów sprawdza e2e 06 na sztucznym sklepie. |
| Udostępnianie rodzinne (TT-04), zwrot w piaskownicy (TT-05) | Potrzebny członek rodziny; sposób zwrotu `[DO USTALENIA]` OP-21 (`tf:63`). |
| TT-15: Pro na zegarku bez telefonu po wyczerpaniu limitu | Wymaga 5 dni liczenia bez Pro i zegarka offline w nowym dniu; sposób odczytu Pro na zegarku `[DO USTALENIA]` OP-22 (`tf:80`). |
| Okno systemowe oceny (F-64) | W TestFlight się nie pokazuje (`src/domena/ocena.ts:26`); T-55 sprawdza, że nie ma własnego okna, T-126 — odnośnik. |
| Aktualizacja 1.0 → 1.0.1 z danymi (TT-06 w pełnej postaci) | Nie istnieje jeszcze wersja następna; jeśli masz zainstalowany build 1 lub 2, robi to T-02. Inaczej: test bazy `tests/bazy/v1.db` w Node. |
| Przeniesienie danych z 0.1.0 | Świadomie brak migracji (P-070, `decyzje.md:76`). |
| Pełna pamięć zegarka, wiele godzin zegarka bez telefonu, restart telefonu bez odblokowania, raporty awarii z TestFlight | Wymagają warunków, których nie da się przygotować w jednym podejściu (`tf:89-93`, `niezawodnosc/runbook.md` §6). |
| Nowy telefon z kopii urządzenia (BR-DAN-004/S1) | Wymaga drugiego iPhone'a; ścieżka eksport → import jest w T-62 i T-131. |
| Wszystkie 35 języków | Próbka 3 języków (T-120–T-122); pełny przegląd tłumaczeń to fala 09 i zgłoszenia z „Report a translation problem”. |
| Funkcje poza 1.0: F-13 (Siri), F-22, F-29, F-39, F-40, F-42, F-44, F-62 (PÓŹNIEJ); F-23, F-30, F-41, F-43 (NIE) | Nie ma ich w aplikacji (`scope-contract.md:28-73`, `:77-83`). |

## Pokrycie funkcji z kontraktu zakresu (51 funkcji MVP)

| Funkcja | Kroki |
|---|---|
| F-01 Licznik od pierwszego uruchomienia, +1/−1, wibracja | T-03, T-10, T-17, T-133 |
| F-02 Historia zmian z godziną i cofnięciem | T-12, T-13 |
| F-03 Blokada przed przypadkowym stuknięciem | T-14, T-114 |
| F-04 Kilka liczników | T-22 |
| F-05 Licznik powtórzeń | T-24 |
| F-06 Przypomnienie „co N rzędów” z podglądem | T-25, T-107 |
| F-08 Cel rzędów części | T-26, T-86 |
| F-09 Znaczenie liczby | T-15 |
| F-10 Ekran nie gaśnie | T-16 |
| F-11 Sesja na ekranie blokady | T-80 |
| F-12 Liczenie na zegarku | T-04, T-105, T-106, T-107 |
| F-14 Projekt z częściami | T-20, T-21 |
| F-15 Notatka przy liczniku | T-29 |
| F-16 Zdjęcia projektu i etykiet | T-35 |
| F-17 Dane techniczne (drut mm i US) | T-30, T-111 |
| F-18 Powrót do projektu po przerwie | T-28, T-61 |
| F-19 Stan projektu i archiwum ukończonych | T-55, T-58 |
| F-20 Zrób taką samą | T-31 |
| F-21 Stoper sesji przy zablokowanym ekranie | T-33, T-81, T-115 |
| F-24 Import wzoru z pliku i zdjęcia | T-40, T-42, T-48 |
| F-25 Wzór i licznik na jednym ekranie | T-46, T-96 |
| F-26 Znacznik bieżącego rzędu | T-45, T-98 |
| F-27 Synchronizacja iCloud | T-64, T-100 (sprawdzone: przełącznika brak — ukryty w 1.0, ZM-06) |
| F-28 Pisanie Apple Pencil | sprawdzone, brak kroku — właściciel bez rysika (P-226); ścieżka palcem: T-97 |
| F-31 Baza na urządzeniu, trwały zapis | T-02, T-60, T-136 |
| F-32 Eksport i import kopii | T-62, T-131, T-132 |
| F-33 Ostatnio usunięte 30 dni | T-57 |
| F-34 Usunięcie wszystkich danych | T-130 |
| F-35 Zakup Pro, przywracanie | T-72, T-73, T-74, T-99, T-130, T-135 |
| F-36 Bez reklam i śledzenia, polityka, język | T-35, T-120, T-125, T-136 |
| F-37 Zapas włóczki i narzędzi | T-50, T-51, T-52, T-54, T-55 |
| F-38 Obliczenia podstawowe | T-53, T-66 |
| F-45 Wpisanie wartości i zerowanie | T-13 |
| F-46 Licznik całości | T-23 |
| F-47 Strażnik stuknięć z tempa | T-11 |
| F-48 Wibracja przypomnienia inna niż rzędu | T-25, T-107 |
| F-49 Powrót do tego samego miejsca | T-61, T-112, T-113 |
| F-50 Lista projektów po roku | T-34 |
| F-51 Korekta czasu sesji | T-33 |
| F-52 Druga część pary | T-27 |
| F-53 Karta ukończenia | T-55 |
| F-54 Projekty dawno nieruszane | T-71 |
| F-55 Wzór ze strony WWW, Word, film | T-41, T-43, T-44, T-48 |
| F-56 Zakreślanie palcem | T-47, T-97 |
| F-57 Zgłoś problem | T-63, T-120 |
| F-58 Widoczny stan synchronizacji i zegarka | T-64, T-106 |
| F-59 Kalendarz dni i podsumowanie | T-56, T-71 |
| F-60 Postęp w procentach | T-28 |
| F-61 Termin i cel dzienny | T-32 |
| F-63 Limit darmowych dni i strażnik | T-70, T-71 |
| F-64 Prośba o ocenę i „Oceń” | T-55, T-126 |

Wymagania pozafunkcyjne: NFR-PIE-001 T-03, T-133 · NFR-DAN-001 T-02 · NFR-DAN-002 T-60 · NFR-OFF-001 T-43, T-51, T-73 · NFR-DOS-001 T-85–T-87 · NFR-DOS-002 T-90, T-91 · NFR-WYD-001 T-110 · NFR-ZEG-001 T-105, T-106 · NFR-UKL-001 T-95, T-96 · NFR-JEZ-001 T-120–T-122 · NFR-PRY-001 T-63, T-136.

## Otwarte `[DO USTALENIA]` i znaleziska przy pisaniu listy
- Numer buildu 3 w TestFlight (koordynator po bramce buildu 3).
- Próg czasu startu aplikacji na telefonie — w repo brak; T-110 tylko zapisuje pomiar.
- Zachowanie aplikacji po ręcznej zmianie daty systemowej (T-71): w `src/domena/limit.ts` nie ma ochrony przed zmianą zegara; wynik T-71 to też obserwacja, nie tylko test limitu.
- Rozjazd nazwy: dokumenty mówią „About our content” (`decyzje.md:641`, `design/fix11-2026-11-10.md`), interfejs pokazuje „About our information” (`src/i18n/slowniki/en.json:113`) — do roli 04.
- `wydanie/testflight-lista.md:27` mówi `ICLOUD_W_1_0 = true` dla TestFlight, kod i P-492 — `false`; obowiązuje kod.
- F-28 (rysik): decyzja koordynatora z `scope-contract.md:230` (ryzyko szczątkowe albo inna osoba z rysikiem).
