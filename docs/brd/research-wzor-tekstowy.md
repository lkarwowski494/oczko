# Research: wzór wpisany tekstem jako źródło wzoru (rola 01, tryb fix, RS2, sygnał 18)
Stan: 2026-11-28 · decyzja zlecająca KO-234 (słowa właściciela: „U8 A, U9 A, 19A, 18A”; 18A = research i szacunek jak U8/U9) · decyzje P-1104–P-1106 w `docs/decyzje.md` · kwarantanna P-003/P-015: czytane tylko `CLAUDE.md`, `docs/` i źródła zewnętrzne; kodu nie czytano, więc stan aplikacji podaję według kontraktu zakresu, BRD, ADR, schematu w `docs/architektura/` i katalogu PU, nie według kodu.

## Streszczenie
| Pytanie | Wynik | Dowód |
|---|---|---|
| O co prosi osoba | najpewniej o **własną rozpiskę rzędów tekstem jako wzór** (źródło w „Dodaj wzór”), a nie o nową notatkę; „notatnik” może być papierowy albo aplikacją Notatki — [DO WYJAŚNIENIA] (OP-40) | sygnał 28.11: „przy dodawaniu wzorów brakuje po prostu opcji na wpisanie lub dodanie notatki (ja często rozpisuję sobie tekstowo w notatniku)” |
| Czy obecne notatki pokrywają potrzebę | **częściowo**: tekst da się zapisać i czytać przy liczniku, ale nie z „Dodaj wzór” (problem znalezienia) i bez znacznika rzędu na tekście | BR-PRJ-002 (scenariusz wklejenia ok. 5000 znaków), PU-039; „Dodaj wzór” = PDF, Word, zdjęcie, skan, WWW, film (`docs/lokalizacja/przeklad-api/pl.json:695-707`) |
| Konkurencja | tekst jako źródło wzoru deklaruje 7 z 57 aplikacji, wszystkie małe (0–313 ocen); 4 z 7 z rozpoznawaniem rzędów; sześć największych (4 033–35 714 ocen) — żadna | opisy App Store US, `search`/`lookup`, 2026-11-28 |
| Popyt w recenzjach | 1 prośba o import linii „z notatek/Worda” jako przypomnień na rząd + 1 obejście zrzutem ekranu; notatki chwalone często | 230 recenzji (RSS US/GB, 4 aplikacje), 2026-11-28 |
| Rekomendacja | **W0** (podpowiedź w „Dodaj wzór” → notatka) w 1.0.3; **W1** („Wpisz lub wklej tekst” → wzór PDF ze znacznikiem) na liście 1.1 z warunkiem powrotu; **W2** (import .txt i udostępnianie tekstu) tylko razem z W1; **W3** (rozpoznawanie rzędów) — NIE | P-1104 |

## E0: klasyfikacja i środowisko
- Sygnał 18: **P** (czy i w jakiej formie: decyzja ról 03/04 i koordynatora, P-087). Ograniczenia platformy: **M** (dokumentacja Apple, szczebel 1). Brak reguły dziedzinowej w W0–W2 (aplikacja nie liczy ani nie uczy); W3 wprowadzałby reguły (składnia wzoru) — **M** z przeglądem 06.
- Środowisko (2026-11-28): Linux w chmurze, Node 22, git; sieć: `itunes.apple.com` (`search` 5 zapytań, RSS recenzji 15 aplikacji × 2 sklepy × 2 strony — wpisy tylko dla 4 aplikacji), `developer.apple.com` (dane JSON dokumentacji) — 200. Kodu i testów nie uruchamiałem (rola 01, tylko dokumenty). Kopie robocze opisów i recenzji w scratchpadzie sesji, poza repo (cudze teksty, P-107 (3)).
- Ograniczenie: próbka recenzji mała i angielska (230); brak trafienia to słaby dowód braku popytu. Sygnał FB to 1 osoba.

## 1. Praca J i użytkownik
### Trzy odczytania sygnału
| Odczytanie | Co by znaczyło | Czy Oczko to ma (wg dokumentów) | Ocena |
|---|---|---|---|
| (a) wzór tekstowy | własna rozpiska rzędów („R1: 6 sc w kółko…”) ma być wzorem: obok licznika, ze znacznikiem rzędu, zakreśleniem | nie — „Dodaj wzór” nie ma źródła tekstowego; znacznik działa tylko na PDF (ADR-0011) | najbardziej zgodne ze słowami „przy dodawaniu wzorów” [OCENA] |
| (b) dłuższa notatka | miejsce na dłuższy tekst przy projekcie | tak — notatka przy liczniku (F-15, PU-039: licznik → „Notatka” ⟦Note⟧), scenariusz wklejenia ok. 5000 znaków bez limitu (BR-PRJ-002, ER-24, P-047) | pokryte, ale osoba szukała w „Dodaj wzór”, więc nie znalazła [OCENA] |
| (c) wklejenie z notatnika | przeniesienie gotowego tekstu z aplikacji Notatki | wklejenie do notatki: tak (pole tekstowe z systemowym „Wklej” nie pyta o zgodę, S-63, S-62); udostępnienie z Notatek do Oczka: rozszerzenie przyjmuje pliki i adresy (ADR-0011), tekstu — wg dokumentów nie | zależy, czy „notatnik” = aplikacja Notatki (OP-40) |

- Praca: **J-04** („Czytać wzór i nie gubić w nim miejsca” — wzór obok licznika ze znacznikiem i własnymi notatkami, `docs/brd/odkrywanie.md`, J-04) i **J-05** (powrót po przerwie z notatkami). Rozpiska tekstem to dziś obejście papierowe — ta sama siła co „it’s easier just to print offa pattern and use Post-It notes” (J-04).
- **Obejście dziś, bez zmian w aplikacji [OCENA, do potwierdzenia w buildzie przez 07]:** zrzut ekranu notatki → „Dodaj wzór” → „Wybierz zdjęcia” daje wzór ze znacznikiem (BR-WZR-002, seria zdjęć = jeden wzór, OG-07 ograniczenie 1). To samo obejście opisuje recenzja innej aplikacji: „to have the pattern on the app, I screenshot it and save to a file. Works great.” (lider liczników, id14614568294, 2026-10-01, 5★).
- **Wniosek:** potrzeba (b) jest pokryta funkcją, ale nie do znalezienia z miejsca, w którym osoba szukała (problem znalezienia → W0). Potrzeba (a) nie jest pokryta; obejście zrzutem działa, ale wymaga wiedzy i nie da się poprawić tekstu (→ W1).

### Konkurencja (opisy App Store US, `search` + `lookup`, odczyt 2026-11-28; nazwy poza repo, P-107 (3))
57 aplikacji z 5 zapytań („knitting row counter”, „crochet counter”, „knit counter”, „crochet pattern tracker”, „knitting pattern”). Tekst jako źródło wzoru albo instrukcji rzędów deklaruje 7:

| Typ | Ile | Cytat (opis) | Wielkość |
|---|---|---|---|
| wpisanie/wklejenie ręczne, bez rozpoznawania | 3 | „Type or paste instructions manually whenever you want”; „Add custom row-by-row instructions so you can knit without constantly checking your pattern”; „PROJECT NOTES: Keep track of pattern details, hook sizes, yarn notes, and row instructions right beside your counter” | 10, 65 i 313 ocen |
| wklejenie z rozpoznawaniem rzędów/powtórzeń | 4 | „Paste a written pattern and [app] structures it into rounds: the instruction, the expected stitch count, and repeat groups”; „Paste it in, or open the PDF. [app] finds the rows, the repeats and the nested repeats”; „Select an English increase or decrease instruction in a PDF with selectable text, or paste it into the app”; „Import written patterns with numbered rows and rounds, in US or UK terms” | 0, 0, 0 i 2 oceny; wydania 2025–2026 |

- Sześć największych w próbce (4 033–35 714 ocen) nie deklaruje źródła tekstowego; mają notatki na PDF albo notatki projektu (np. „Add NOTES to your pattern”); notatki „na rzędzie N” mają mniejsze (np. „Add row-specific notes that appear when you reach a particular row”, 807 ocen).
- Wniosek [OCENA]: luka u dużych, ale rozpoznawanie rzędów pojawia się tylko u nowych aplikacji bez ocen — brak dowodu, że działa i że ktoś za to płaci.

### Recenzje (RSS US/GB, 230 unikalnych, odczyt 2026-11-28)
- Prośba wprost (1): „for a long pattern, it takes forever to input it manually. It would help if you could open it on desktop, or import the lines from notes/word/document that would show up as separate reminders that show up for specified row.” (lider liczników, id14333589332, 2026-07-22, 4★) — to potrzeba bliższa W3 (linie → przypomnienia na rząd) niż W1.
- Obejście zrzutem (1): id14614568294 (wyżej).
- Notatki jako zaleta: co najmniej 10 recenzji lidera (np. „The option to write notes is very helpful”, id14614568294; „I can practically write my own patterns with it”, id14736427830, 2026-10-31).
- Razem z sygnałem FB: **2 niezależne prośby** o tekst jako wzór/instrukcje (FB 28.11, id14333589332). Próg powrotu z RS1 to ≥3 (P-1093, P-1094).

## 2. Warianty (od najmniejszego)
| Wariant | Co robi | Platforma (szczebel 1, odczyt 2026-11-28) | Dane i OG-07 | Zasada 18 |
|---|---|---|---|---|
| **W0** podpowiedź | w arkuszu „Dodaj wzór” jeden wiersz albo zdanie: „Rozpiska tekstem? Zapisz ją w notatce” → otwiera istniejący edytor notatki (PU-039); forma: 04 (wzór jak ZM-26) | bez nowego API; wklejenie przez systemowe menu bez pytania o zgodę [FAKT S-63] | bez zmian danych; poza OG-07 (notatka to treść użytkownika) | brak nowego pojęcia |
| **W1** „Wpisz lub wklej tekst” | nowe źródło w „Dodaj wzór”: tytuł + tekst → zapis jako wzór; tekst renderowany do PDF tym samym torem co WWW i Word (ADR-0011, renderer stron druku), więc znacznik, zakreślacz, rysik i notatka na rzędzie działają bez nowego widoku; oryginał `.txt` zachowany | `UISimpleTextPrintFormatter` układa zwykły tekst na wielu stronach [FAKT S-61]; renderer stron druku już wybrany (ADR-0011, P-221 Q2a); przycisk wklejania bez zgody [FAKT S-62] | **bez nowej wartości `wzor.zrodlo`** (P-1105): `CHECK (zrodlo IN ('pdf', 'obraz', 'www', 'word'))` (`docs/architektura/schemat.sql:134`) — nowa wartość wymaga przebudowy tabeli i grozi odrzuceniem rekordu przez starszą wersję na drugim urządzeniu (iCloud, ADR-0027); wariant: `zrodlo = 'pdf'`, oryginał w `plik.rozszerzenie = 'txt'` [OCENA, potwierdza 05]. OG-07: jeden tekst = jeden wzór, bez dołączania do innych wzorów; wiersz w tabeli elementów przed projektem (ograniczenie 6) [OCENA: E1, E2, E5 nieobecne] | niski: jeden wiersz w istniejącym arkuszu, ten sam widok wzoru |
| **W2** import `.txt` i udostępnianie tekstu | W1 + plik `.txt` z Plików i tekst udostępniony z innej aplikacji (np. Notatki) → ten sam tor | reguła aktywacji rozszerzenia ma klucz „whether the app extension supports text” [FAKT S-64]; typ `public.plain-text` [FAKT S-65]; co przekazują Notatki w arkuszu — [DO USTALENIA] (OP-42) | jak W1; skrzynka App Group bez zmian (ADR-0011) | niski (niewidoczne do chwili użycia), ale oszczędza tylko „kopiuj → wklej” |
| **W3** tekst z rozpoznawaniem rzędów | W1 + rozpoznanie „R1/Rząd 1/Row 12”, widok rząd po rzędzie albo linie → przypomnienia „w rzędzie N” (F-06), ew. oczekiwana liczba oczek | parser składni w wielu konwencjach i 35 językach | bliżej OG-07 (E2 „selecting … instructional parts”, E7); liczby oczek = U8-C, odrzucone (P-1093, D-027, RYZ-03); brak źródła terminologii (OP-12) | wysoki |

Ograniczenia wspólne: App Review 4.2 i 5.1 bez nowych wymagań (brak sieci, uprawnień i danych wychodzących) [OCENA]; VoiceOver: PDF z tekstu ma warstwę tekstu, więc czytnik ma co czytać [OCENA, do sprawdzenia przez 07].

## 3. Plan z szacunkiem
Analogie kosztów (rzeczywiste, `docs/koordynacja/koszty.md` na gałęzi `koordynacja`, odczyt 2026-11-28): sesja opus docs 6,61 (ZK1, 03 fix) i 8,33 USD (RS1, 01 fix) — szacunek RS1 dla 03/06 (2–4 USD) był za niski; 08 fix 1,48–4,06 (KA1, PE1, EB1); 07 fix 2,46 (PF1), 07 audit 2,31–3,53 (DG2, DG3, WR1); 04 fix/audit 6,13–6,15; 09 build 3,91 (6 kluczy × 34 języki). Mniejszą zmianę 03/04 można dołączyć do partii z innymi pozycjami 1.0.3 (wtedy udział 2–4 USD zamiast pełnej sesji). Wszystkie liczby to [OCENA] z przedziałem ×0,7–1,5.

| Wariant | Role i kolejność | Agenci: czas / USD | Czeka na | Właściciel |
|---|---|---|---|---|
| W0 | 03 (ZM, w partii) → 04 (zdanie i miejsce; wzór ZM-26) → 07 (PU zmieniony + test; sprawdzenie OP-41) → 08 fix (wiersz otwiera edytor notatki) → 09 (1–2 klucze × 34) → recenzja 07/08 | 1,5–2,5 h / 10–20 (w partii 1.0.3: 7–12) | CI macOS e2e (1–2,5 h; okno poza ok. 14–23 UTC), build TestFlight | decyzja 2 min; test F 1 PU ok. 2 min |
| W1 | 03 → 04 (wiersz, ekran tekstu, stany: pusty, długi, wyjście bez zapisu jak PU-268; OP-43) → 05 (uzupełnienie ADR-0011: render tekstu, bez nowej wartości `zrodlo`, OG-07 wiersz tabeli) → 07 (PU + testy importu jak w ADR-0011 „Potwierdzenie”) → 08 (1–2 sesje: ekran, render, zapis, test) → 09 (6–9 kluczy × 34) → recenzja 07/08 | 5–7 h / 26–46 | jw.; bez migracji schematu, jeśli 05 potwierdzi P-1105 (z migracją +8–15 USD i test na kopii bazy, zasada 10) | decyzja 5 min; test F 1–2 PU ok. 10 min (wpisanie, wklejenie z Notatek, znacznik) |
| W2 (do W1) | + 05 (reguła aktywacji, tekst do skrzynki) + prototyp OP-42 na urządzeniu + 08 (rozszerzenie) + 07 (test importu `.txt`) | +1,5–2,5 h / +6–12 | + kontrola reguły aktywacji w CI (ADR-0011) | +5 min F (udostępnienie z Notatek) |
| W3 | 01 (reguły i wektory składni) → 06 (słownik skrótów, 35 języków, OP-12) → 05 (parser, OG-07 E2/E7, możliwa ocena prawna) → 04 (widok rząd po rzędzie) → 07 → 08 (3–5 sesji) → 09 | ≥ 15 h / 70–140+ | źródło terminologii OP-12; ewentualna opinia prawna (koszt właściciela) | wiele decyzji; test F ok. 30 min |

Ryzyko szacunku: sesje przekraczały pułap o 10–40% (koszty.md, WG-33); szacunek sesji opus docs podniesiony po ZK1 i RS1.

## Rekomendacja wersji (P-1104)
- **1.0.2:** bez zmian (U1–U7, U10 w toku; zakres zamknięty, `docs/zakres-1-0-2.md`). Wyjątek do decyzji koordynatora: W0 może dołączyć do partii tekstowej U10 (ZM-26), jeśli 04/08 jeszcze jej nie zamknęli — ten sam rodzaj zmiany (jedno zdanie, ×35).
- **1.0.3:** **W0** — tani, odpowiada na problem znalezienia; dowód: osoba szukała w „Dodaj wzór”, a funkcja jest gdzie indziej.
- **Lista 1.1 (warunek powrotu):** **W1** — wchodzi, gdy (i) ≥3 niezależne prośby o tekst jako wzór (dziś 2: FB 28.11, id14333589332) albo (ii) odpowiedź na OP-40, że osoba chce znacznika na swojej rozpisce; warunek techniczny: 05 potwierdza P-1105 (bez migracji). **W2** tylko razem z W1 i po prototypie OP-42.
- **NIE:** **W3** — kombajn (zasada wspólna 18), OG-07 bliżej E2, liczby oczek odrzucone w P-1093; powrót tylko po nowej ocenie OG-07 i źródle terminologii (OP-12).
- Opcja odrzucona: W1 od razu w 1.0.3 — kompromis: odpowiada na odczytanie (a) bez czekania, ale za 26–46 USD na 2 sygnały, gdy obejście zrzutem już działa; zasada 13 każe ważyć wartość, a dowód wartości jest słaby.

## Źródła nowe (S-61–S-65)
Szczebel według P-017. Dokumentację Apple czytano z danych JSON strony (`developer.apple.com/tutorials/data/documentation/…json`), cytaty sprawdzone na surowym tekście (`grep -F`).

| ID | Adres | Miejsce | Cytat | Odczyt | Szczebel | Przegląd |
|---|---|---|---|---|---|---|
| S-61 | https://developer.apple.com/documentation/uikit/uisimpletextprintformatter | opis | „An object that lays out plain text for printing, possibly over multiple pages.” | 2026-11-28 | 1 | 2027-05-28 |
| S-62 | https://developer.apple.com/documentation/uikit/uipastecontrol | Overview | „In iOS 16 and later, programmatic pasting raises a user alert that prompts the user for approval before the app gains access to pasteboard contents”; „Use this class to paste without a user prompt.” | 2026-11-28 | 1 | 2027-05-28 |
| S-63 | https://developer.apple.com/documentation/uikit/uipasteboard | Overview | „Starting in iOS 14, the system notifies the user when an app gets general pasteboard content that originates in a different app without user intent. The system determines user intent based on user interactions, such as tapping a system-provided control or pressing Command-V.” (w danych JSON zdanie przerwane formatowaniem) | 2026-11-28 | 1 | 2027-05-28 |
| S-64 | https://developer.apple.com/documentation/bundleresources/information-property-list/nsextension/nsextensionattributes/nsextensionactivationrule/nsextensionactivationsupportstext | opis | „A Boolean value indicating whether the app extension supports text.” | 2026-11-28 | 1 | 2027-05-28 |
| S-65 | https://developer.apple.com/documentation/uniformtypeidentifiers/uttype-swift.struct/plaintext | opis | „A type that represents text with no markup and an unspecified encoding.” (identyfikator `public.plain-text`) | 2026-11-28 | 1 | 2027-05-28 |

Opisy aplikacji i recenzje to deklaracje i opinie (jak S-17), nie dowód działania; nazwy i pełne teksty poza repo (P-107 (3)).

## Otwarte (OP-40–OP-43, też w `docs/brd/README.md`)
- [DO WYJAŚNIENIA] (OP-40) „notatnik” = papier czy aplikacja Notatki; czy osoba chce znacznika rzędu na rozpisce (W1), czy wystarczy notatka (W0) — pytanie zwrotne w wątku (koordynator/właściciel, kanał 11).
- [DO USTALENIA] (OP-41) czy notatka w obecnym buildzie przyjmuje ok. 5000 znaków bez obcięcia (BR-PRJ-002, scenariusz „Długa notatka”): w katalogu PU brak przypadku z długą notatką (`grep "5000" docs/jakosc/przypadki-uzycia.md` → 0 trafień) — 07, przed W0.
- [DO USTALENIA] (OP-42) co aplikacja Notatki przekazuje w arkuszu udostępniania (tekst, plik, PDF) — prototyp 05/08 na urządzeniu; decyduje o W2.
- [DO USTALENIA] (OP-43) edycja tekstu wzoru po zapisie, gdy są znacznik i zakreślenia (ponowny render przesuwa wiersze na stronach PDF; znacznik ma współrzędne strony, ADR-0011 uzupełnienie 2026-10-25) — 04/05, przed W1.
- Nowe znalezisko dla 07 (poza zakresem fix 01): BR-PRJ-002 scenariusz „Długa notatka” bez przypadku PU (JAK-03, cudzy obszar) — patrz OP-41.
