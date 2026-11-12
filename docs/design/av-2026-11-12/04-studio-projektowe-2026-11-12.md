# Audyt: Studio Projektowe (UX, marka, przepływy) — Oczko, zrzuty sklepu przed kandydatem (sesja AV) — 2026-11-12
Commit: 3d9ca08 (gałąź `claude/av-projekt-zrzuty-2026-11-12`, zgodny z poleceniem) · Tryb: audit (zakres zawężony poleceniem AV: C2, drugi pas zakreślenia, C3/OG-07) · Materiał: przebieg `zrzuty-sklepu.yml` 43139114751 na 2929462 (success), artefakty `sklep-zrzuty-surowe` 13919316788, `sklep-zrzuty-ramki` 13919012612, `zrzut-zakupu` 13911602692; dla porównania „Jakość · iOS” 43139118664, artefakt `e2e-czesc-1-ipad` 13910608281 (scen. 47) · Środowisko: Linux, Node, git, `gh api` (pobranie artefaktów działa), ImageMagick i Pillow do pomiaru pikseli; bez macOS, Xcode i symulatora (nic nie uruchamiałem na iOS, oceniam zrzuty z CI) · Prompt roli: linia `=== KONIEC PROMPTU ROLI ===` obecna, ostatni nagłówek `##` promptu: „## Kontrola dowodów i sekretów przed oddaniem raportu”.

Kwarantanna (CLAUDE.md, P-001–P-003): rola 04 nie czyta `app/ src/ scripts/ tests/ assets/`. Nie otwierałem tych plików; ścieżki w nich podaję z `git ls-files` albo z cytatów w `docs/`. Czytałem `e2e/zrzuty-sklepu/` i jedną linię `modules/oczko-wzor/ios/WidokWzoru.swift` (poza listą kwarantanny).

## Podsumowanie
Z siedmiu pozycji C2 cztery są zamknięte zrzutami (puste „This week”, placeholder wzoru i 03≈04, siatka kalendarza, spójność fikstury poza datą paska), dwie proponuję zamknąć decyzją projektową do weta (ucięte kafle iPhone 01: P-767; pusty arkusz Historii: P-768), jedna zostaje otwarta jako drobna poprawka skryptu (uchwyt okna iPadOS w rogu kadrów iPada, rola 10, bez buildu). Drugi pas zakreślenia: **zmiana** (P-769). Pomiar kadru 04 pokazał dwa defekty aplikacji, które wykraczają poza zrzuty: zakreślenie leży **na** tekście wzoru i obniża jego kontrast z 21:1 do 3,38:1 (001, P1), a pierwsze pociągnięcie po ponownym otwarciu wzoru rysuje się cienkie i prawie kryjące, tekst pod nim ma 1,16:1 (002, P2; ten sam objaw w scen. 47 „Jakość · iOS”). Oba wymagają nowego buildu. OG-07: rekomenduję **bez `[og07-ok]`** dla kandydata (komplet 5 zrzutów na klasę): w repo nie ma zapisu przeglądu P-218 (6), a kadr 04 i tak wymaga poprawek 001, 002 i 004.

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 04-studio-projektowe-001 | P1 | D | Zakreślenie przykrywa tekst wzoru: kontrast tekstu pod pasem 3,38:1 | otwarte |
| 04-studio-projektowe-002 | P2 | D | Pierwsze zakreślenie po otwarciu wzoru z zapisanym rysunkiem jest 2,75× cieńsze i zasłania tekst (1,16:1) | otwarte |
| 04-studio-projektowe-003 | P2 | D | Kadr 03/04: znacznik „Row 48” stoi na wierszu „Row 21”, wzór ma 23 rzędy, a licznik 48 | otwarte |
| 04-studio-projektowe-004 | P2 | D | Pasy w kadrach zaczynają się w połowie wiersza i leżą między wierszami tekstu | otwarte |
| 04-studio-projektowe-005 | P2 | D | W prawym dolnym rogu każdego kadru iPada widać uchwyt zmiany rozmiaru okna iPadOS | otwarte |

## Linia bazowa i założenia
Zakres zawężony poleceniem do strony produktu w App Store (zrzuty) i do wyglądu kadru zakreślenia; pozostałe wymiary pokrycia roli nie były przedmiotem tej sesji.

- **Kontekst użycia (główny przepływ wzoru):** osoba dzierga, patrzy na wzór co kilka oczek, ręce zajęte drutami; zakreślenie ma oznaczyć wiersz, który **dalej trzeba czytać**. Z tego kryterium wynika, że tekst pod zakreśleniem musi zostać czytelny (podłoga 4,5:1) — tego pilnuje wzorzec projektu: `docs/design/dzianina/ekrany.html:98` „.wz .strona .zak { background: #F6E04A; margin: 0 -6px; padding: 2px 6px; }” (zakreślacz jako tło pod tekstem, cały wiersz, 6 px poza tekst) i wzorzec `docs/design/dzianina/wzorce-zrzuty/wzor-390-jasny.png` (czarny tekst na żółtym, 15,68:1 — dowody/c-kontrast.txt).
- **Kontekst strony produktu:** recenzent i klient oglądają kadr kilka sekund; kadr ma pokazywać aplikację w użyciu (2.3.3) z wiarygodnymi danymi fikcyjnymi (2.3.9; `docs/wydanie/metadane/zrzuty-plan.md:4`). Dla dziergającej osoby „Row 48” przy wierszu „Row 21” jest od razu widocznym błędem danych.
- **Wymiary pokrycia:** stany ekranów w kadrach — sprawdzone (7 kadrów × 2 urządzenia, en; pl tylko ramki 06 i 04 do porównania); element firmowy (dzianina na karcie i liczniku) — widoczny w 01, 02, 05 z danymi; podłogi dostępności — tylko kontrast tekstu pod zakreśleniem (dowody/c-kontrast.txt); ruch, haptyka, VoiceOver, AX5 — nie dotyczy (statyczne kadry), nie sprawdzano; obecność poza ekranami — ramki zrzutów obejrzane jako kontekst, ocena ramek to C4 właściciela; lokalizacja — pl porównana tylko w 04 i 06 (godziny 24 h na pasku i w Historii: „09:41”, „20:00”).
- **Soczewki:** dziergająca osoba czytająca zakreślony wiersz (001, 002, 004); nowa osoba oglądająca stronę produktu (003, 005, P-767, P-768).
- **Wzorzec najlepszych:** zakreślacz jako tło pod tekstem (fizyczny zakreślacz: atrament przezroczysty, tekst ciemniejszy od pasa) — tak rysuje go nasz wzorzec; aplikacji konkurencji w tej sesji nie czytałem (poza zakresem polecenia).
- **Rejestr założeń:** bez propozycji zmian.

## Pokrycie
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| Artefakty 43139114751: 28 surowych, 28 ramek, zakup; wymiary i alfa | tak (`file`, 57 PNG RGB bez alfy) | dowody/a-artefakty.txt |
| Kadry iPhone en 01, 02, 05, 06, 07 | tak, obejrzane | zrzuty/iphone-en-01-07.png |
| Kadry iPad en 01, 02, 05, 06, 07 | tak, obejrzane | zrzuty/ipad-en-01-07.png, zrzuty/ipad-rog-uchwyt.png |
| Kadry 03/04 iPhone i iPad, en i pl | tak, obejrzane i zmierzone | zrzuty/kadr04-ipad-iphone-en.png, zrzuty/kadr04-ipad-pasy-zblizenie.png, dowody/b-pasy.txt |
| Kontrast tekstu pod pasami (iPad en 04) i rachunek alfy | tak | dowody/c-kontrast.txt |
| Scen. 47 „Jakość · iOS” 43139118664 (trzy zrzuty iPada) | tak, obejrzane i zmierzone | zrzuty/s47-ipad-trzy-kadry.png, dowody/b-pasy.txt |
| Ramki (wygląd ramki i podpisów) | obejrzane 4 kadry, bez oceny | ocena to C4 właściciela |
| Kadry pl 01, 02, 05, 07 | nie | poza potrzebą zadań (treść jak en, sprawdzona przez AS) |
| Zrzut zakupu `99-zakup-ceny.png` | tylko `file` | ocena to C7 |
| Kod `src/`, `scripts/`, `tests/` | nie (kwarantanna) | — |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/design/av-2026-11-12/04-studio-projektowe-2026-11-12.md . docs/design/av-2026-11-12 --rola 04-studio-projektowe` → „OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 04-studio-projektowe”, kod 0 (dowody/d-sprawdz-raport.txt).

## Stosowalność listy kontrolnej
| Pozycja | Status | Wynik |
|---|---|---|
| SP-01 | nie dotyczy: zakres AV to zrzuty, nie przepływy | — |
| SP-02 | dotyczy (element firmowy w kadrach 01, 02, 05) | ok: dzianina z danymi (47 z celu, pas dziś) w zrzutach/iphone-en-01-07.png |
| SP-03 | nie dotyczy: kodu stylów nie czytam (kwarantanna) | — |
| SP-04 | dotyczy (tekst wzoru pod zakreśleniem) | 001, 002 |
| SP-05 | nie dotyczy: zakres AV | — |
| SP-06 | nie dotyczy: zakres AV | — |
| SP-07 | nie dotyczy: zrzuty w rozmiarze domyślnym | — |
| SP-08 | nie dotyczy: statyczne kadry | — |
| SP-09 | nie dotyczy: zakres AV | — |
| SP-10 | dotyczy (stany kadrów: pusty „This week”, arkusz Historii) | ok po decyzjach P-767, P-768 |
| SP-11 | nie dotyczy: teksty podpisów to C5 | — |
| SP-12 | nie dotyczy: zakres AV | — |
| SP-13 | dotyczy (kadry vs system `docs/design/dzianina/`) | 003, 004, 005; kalendarz zgodny z wzorcem |
| SP-14 | nie dotyczy: zakres AV | — |
| SP-15 | dotyczy (arkusz Historii, pasek kart iPada) | ok: elementy systemowe, P-768 |
| SP-16 | nie dotyczy: zakres AV | — |
| SP-17 | dotyczy (czytanie zakreślonego wiersza przy pracy) | ujęte w 001 |
| SP-18 | nie dotyczy: statyczne kadry | — |
| SP-21 | nie dotyczy: zakres AV | — |

### Zadanie 1 (C2): siedem pozycji „Stan wykonania” `docs/wydanie/metadane/zrzuty-plan.md:34`
Numeracja: znalezisko (1) z planu rozdzielone na dwie pozycje (kadry/linia dni i pusty „This week”), (2)–(6) jak w planie — razem 7, jak w `docs/wydanie/stan.md:34`.

| # | Pozycja | Stan | Dowód (plik, kadr) | Co zmienić, gdzie, kto | Nowy build |
|---|---|---|---|---|---|
| 1 | iPhone 01: ucięte dolne kafle, brak linii wolnych dni | **zamknięta decyzją P-767 (do weta)** | zrzuty/iphone-en-01-07.png, kadr 1: dolne kafle „Yarn and needles”, „Swatch” całe z etykietą, ucięty tylko dół pod paskiem kart; linia „2 of 5 free crafting days left” jest w kadrze 05 i na iPadzie 01 | nic; treść przewija się pod paskiem kart jak w każdej aplikacji iOS, podpis 01 nie twierdzi nic o dniach | nie |
| 2 | „This week” w stanie pustym | **zamknięta** | kadr 1: Mon (9 XI) wypełniony, Tue (dziś) z obwódką | — | nie |
| 3 | 03/04: „Test pattern”, 04 ≈ 03, zakreślenie przy znaczniku | **zamknięta w tej części**; nowe usterki 001–004 | zrzuty/kadr04-ipad-iphone-en.png: wzór „Cable Hat” z treścią, 04 ma „2 highlights”, włączony zakreślacz, na iPhonie podpowiedź; pasy daleko od znacznika | 001, 002 (08, aplikacja), 003 (08, `src/kompozycja/e2e/wzor-sklepu.ts`), 004 (08/10, `e2e/zrzuty-sklepu/`) | 001, 002: tak; 003: tak (zmiana w `src/`); 004: nie |
| 4 | Historia: arkusz z pustą częścią, na iPadzie spod arkusza wystają przyciski | **zamknięta decyzją P-768 (do weta)** | zrzuty/iphone-en-01-07.png kadr 4 (8 wpisów, dół pusty), zrzuty/ipad-en-01-07.png kadr 4 (przyciemniony licznik pod arkuszem) | nic; arkusz i przyciemnione tło to zachowanie platformy (SP-15) | nie |
| 5 | iPad: puste obszary, pasek kart szerszy, ciemny łuk w rogu | puste obszary **zamknięte KO-036** (`docs/wydanie/metadane/zrzuty-plan.md:47`); pasek kart to element systemowy; łuk **otwarty** (005) | zrzuty/ipad-rog-uchwyt.png: szary łuk = uchwyt zmiany rozmiaru okna, widoczny też w ramkach | 005: rola 10, `scripts/ci/zrzuty-sklepu.sh` (przygotowanie symulatora iPada) | nie |
| 6 | 07: siatka kalendarza szersza od marginesów | **zamknięta: zgodne z projektem** | kadr 5 iPhone vs `docs/design/dzianina/wzorce-zrzuty/historia-390-jasny.png`: we wzorcu siatka dni też biegnie prawie od krawędzi do krawędzi, karty pod nią mają margines | — | nie |
| 7 | Spójność fikstury | **zamknięta poza datą paska iPada** | 47 gotowych / „row 48” bieżący; „last worked yesterday” = 9 XI; „2 of 5 free days” = 5 − 3 dni listopada (iPad 07: „3 crafting days, 7 rows” = 3 + 2 + 2); Historia: godziny rosną z dniem. Otwarte: pasek iPada „Thu Nov 12” vs treść „Tuesday, November 10” = 10-wydanie-023, w toku w sesji AU (KO-050). Nazwa „Cable Hat” dwa razy na karcie to skutek decyzji 020 (nazwa projektu = nazwa wzoru), zostaje | 023: rola 10 (AU) | nie |

Wynik C2: **4 zamknięte, 2 do zamknięcia decyzją do weta (P-767, P-768), 1 otwarta (005)**; nowe usterki z kadru 04: 001–004.

### Zadanie 2: drugi pas zakreślenia — werdykt **zmiana** (P-769, do weta)
Pomiar (dowody/b-pasy.txt): w każdym kadrze 04 pas z fikstury ma 55 px (iPad) / 33 px (iPhone) wysokości i barwę ok. `#F7E775`, pas narysowany w scenie ma 20 / 12 px i barwę ok. `#F6E04D` (prawie kryjący). Stosunek 2,75 na obu urządzeniach i w obu językach. Ten sam objaw w scen. 47: pas pierwszy 32 px, pas „drugie zakreślenie” (pierwsze pociągnięcie po wczytaniu rysunku z pliku) 12 px, a dwa kolejne szybkie pociągnięcia znów 32 px. Drugi pas czyta się jak przekreślenie: tekst „knit 2, purl 2 to the end.” pod nim ma kontrast 1,16:1 (zrzuty/kadr04-ipad-pasy-zblizenie.png).

Specyfikacja docelowa (tokeny `docs/design/dzianina/tokeny.json`):
1. **Barwa:** `kolor.zakreslacz` `#F6E04A` (`docs/design/dzianina/tokeny.json:14`, ciemny motyw `:28`; strona wzoru ma stałe barwy, `:104`). Tekst wzoru pod pasem ≥ 4,5:1. Wariant (A), docelowy: pas pod tekstem jak `.zak` we wzorcu (tekst czarny na `#F6E04A`, 15,68:1). Wariant (B), zastępczy: nakładka z alfą ≤ 0,45 (tekst ok. `#6F6521` na `#FBF1AE`, 5,14:1); nowy token `wzor.zakreslaczAlfa: 0.45` (rachunek: dowody/c-kontrast.txt; dziś zmierzone 3,38:1 odpowiada alfie ok. 0,55).
2. **Grubość:** każde pociągnięcie tą samą szerokością narzędzia, dziś `modules/oczko-wzor/ios/WidokWzoru.swift:419` „case .zakreslacz, .brak: c.tool = PKInkingTool(.marker, color: KOLOR_ZAKRESLACZA, width: 18)”, niezależnie od tego, czy płótno ma rysunek wczytany z pliku. Kryterium: oba pasy w kadrze 04 i wszystkie cztery w scen. 47 równej wysokości ±10% i tej samej barwy ±5 w kanale.
3. **Położenie w kadrze (scenariusz):** środek pasa w środku wiersza tekstu ±15% wysokości wiersza; początek 6 pt przed pierwszym znakiem wiersza, koniec 6 pt za ostatnim (wzorzec `.zak`: `margin: 0 -6px`), nie od 20% ekranu do krawędzi strony. iPad poziomo (kadr 03): wiersz „Cast on 96…” ma środek na 41,1% wysokości kadru, „Rows 1-8…” na 48,1% (dowody/b-pasy.txt). iPhone: pozycje mierzyć w kadrze 04, bo strona jest tam o ok. 30 px niżej niż w 03 (wiersz podpowiedzi).

Kto: 1 i 2 — rola 08 (aplikacja, nowy build; dla A najpierw wykonalność z 05, bo pas pod tekstem nie może zmieniać pliku PDF — ograniczenie P-218 (2)); 3 — rola 08/10 (`e2e/zrzuty-sklepu/00-przygotuj.yaml:167`, `e2e/zrzuty-sklepu/04-zakreslenie.yaml:31`), bez buildu aplikacji.

### Zadanie 3 (C3, OG-07): rekomendacja **bez `[og07-ok]` dla kandydata**
- **Warunek P-218:** `docs/decyzje.md:223` — ocena projektu (nie opinia prawna), że żadna funkcja wzoru 1.0 nie ma E3 (edycja części) ani E5 (złożenie w zestaw), oraz ograniczenia 1–6, z których (6): „07 sprawdza ekrany wzoru przed wydaniem”. Plan tego przeglądu: `docs/jakosc/plan-partia-6-ipad.md:23-32` (sześć punktów, dowód każdego). Zrzuty 03/04 warunkuje weryfikacja patentowa w kodzie, etap 4 (`docs/wydanie/metadane/zrzuty-plan.md:19`; krok 9 `docs/plan-prac.md:61`).
- **Zapis wykonania:** w repo publicznym brak (`grep -rn "OG-07\|P-218" docs` — tylko plan i warunki; `docs/wydanie/lista-1-0.md:41` „brak zapisu, że warunek patentowy (P-218, OG-07) jest spełniony”). Raport M1 (warsztat `audit/M1-2026-11-10-finalny/`) jest poza zasięgiem tej sesji: czy zawiera przegląd P-218 (1)–(6) — **[DO USTALENIA]** (koordynator).
- **Co pokazują kadry 03/04 (sprawdzone okiem, dowód zrzuty/kadr04-ipad-iphone-en.png):** jeden wzór z jednego pliku („PDF · 1 page”), jeden znacznik, obok licznik (nie drugi wzór), zakreślenie jako warstwa nad niezmienioną treścią, bez filmu, bez treści zależnej od postępu poza znacznikiem z licznika — nic poza ograniczeniami 1–5. To nie rozstrzyga sprawy prawnej; czy funkcje spełniają warunek patentowy, to **[DO USTALENIA]** (P-024: ocena projektu, nie opinia prawna).
- **Rekomendacja:** (a) teraz bez `[og07-ok]`: komplet 5 zrzutów na klasę (zakres 1–10 spełniony), 03/04 zostają w `warunek-og07/`. (b) `[og07-ok]` po dwóch warunkach: zapisany przegląd 07 według `docs/jakosc/plan-partia-6-ipad.md:23-32` na SHA kandydata (albo potwierdzenie, że zrobił go M1) **i** poprawki 001, 002, 004 (inaczej kadr 04 pokazuje wadliwe zakreślenie). Rekomenduję (a), bo (b) wymaga nowego buildu i nowego przebiegu zrzutów. Uwaga spójności: ten sam warunek OG-07 dotyczy słów „pattern/pdf” w opisie i słowach kluczowych (`docs/wydanie/metadane/en.md:15`), a funkcja wzoru jest w aplikacji 1.0 niezależnie od zrzutów (P-217) — decyzję warto podjąć raz dla wszystkich materiałów sklepu.

## Znaleziska
### 04-studio-projektowe-001 · Zakreślenie przykrywa tekst wzoru, który trzeba dalej czytać
- Pozycja listy kontrolnej: SP-04
- Poziom: P1
- Realność: realny · Pewność: wysoka (symulator, oba urządzenia); na urządzeniu średnia — ta sama kompozycja warstw, nie sprawdzono
- Rodzaj: D
- Dowód: dowody/c-kontrast.txt — iPad en 04: tekst poza pasem `#000000` na `#FFFFFF` 21:1; tekst pod pasem 1 najciemniejszy `#887C29` na `#F8E876` 3,38:1; zrzuty/kadr04-ipad-pasy-zblizenie.png („stitches and join in the round” wyblakłe)
- Mechanizm: płótno PencilKit z zakreślaczem leży nad stroną PDF i miesza żółty z czarnym tekstem (alfa ok. 0,55 z rachunku), zamiast leżeć pod tekstem; dotyczy każdego zakreślenia na każdym wzorze (`modules/oczko-wzor/ios/WidokWzoru.swift:419`), nie tylko kadru 04
- Powraca: nie
- Wzorzec lub źródło: wzorzec `docs/design/dzianina/ekrany.html:98` (pas jako tło pod tekstem); podłoga 4,5:1 (WCAG 2.2, 1.4.3; wzorce roli, tabela Podłogi dostępności)
- Kroki w aplikacji: otwórz wzór, włącz zakreślacz, przeciągnij palcem po wierszu — wiersz robi się słabiej czytelny niż reszta strony
- Opcje: (A) pas pod tekstem (rysunek zakreślenia rysowany pod treścią strony, plik PDF bez zmian — zgodne z P-218 (2)) — 15,68:1, jak wzorzec, koszt: zmiana rysowania w module natywnym, wykonalność [DO USTALENIA] z 05; (B) alfa zakreślacza ≤ 0,45 — 5,14:1, jedna stała, pas nieco bledszy (1,15:1 do białej strony zamiast 1,18:1), koszt minimalny; (C) bez zmiany do 1.0.1. Rekomendacja: (B) przed kandydatem, (A) w 1.0.1 do decyzji
- Test akceptacyjny: kadr 04 i zrzut scen. 47: najciemniejszy piksel tekstu pod pasem ma ≥ 4,5:1 do tła pasa (skrypt jak w dowody/c-kontrast.txt)
- Status: otwarte

### 04-studio-projektowe-002 · Pierwsze zakreślenie po ponownym otwarciu wzoru jest cienkie i zasłania tekst
- Pozycja listy kontrolnej: SP-04
- Poziom: P2
- Realność: realny (symulator, powtarzalnie: 4 kadry 04 i scen. 47) · Pewność: wysoka dla symulatora; przyczyna i zachowanie na urządzeniu [DO USTALENIA]
- Rodzaj: D
- Dowód: dowody/b-pasy.txt — kadr 04 iPad: 55 px `#F7E775` vs 20 px `#F5E04C`; iPhone: 33 px vs 12 px; scen. 47: 32 px, potem 12 px (drugie zakreślenie, po wczytaniu rysunku z pliku), potem 32 px i 32 px; tekst pod cienkim pasem 1,16:1 (dowody/c-kontrast.txt); zrzuty/s47-ipad-trzy-kadry.png
- Mechanizm: dotyczy tylko pierwszego pociągnięcia na płótnie z rysunkiem wczytanym z pliku — tej ścieżki dotyczyła poprawka P-748 (`docs/decyzje.md:702`); stały stosunek 2,75 na dwóch urządzeniach wskazuje na skalę albo inne narzędzie przy pierwszym pociągnięciu [DO USTALENIA, rola 08]
- Powraca: tak, ta sama ścieżka co 10-wydanie-019 (P-748) → trwała kontrola: pomiar wysokości pasów w `kontrola-zakreslen.mjs` (kadr 04) i w scen. 47
- Wzorzec lub źródło: P-769 (specyfikacja wyżej, pkt 2)
- Kroki w aplikacji: zakreśl wiersz, zamknij wzór, otwórz ponownie, zakreśl inny wiersz — nowy pas jest wąską kreską przez środek liter
- Opcje: (a) diagnoza i poprawka w `WidokWzoru.swift` przed kandydatem (nowy build; koszt: 1–2 h agenta 08 + przebieg macOS); (b) 1.0.1, a przed kandydatem tylko krok właściciela na urządzeniu (`docs/programista/zrzuty-018-019-an.md:77` „zakreśl, zamknij i otwórz wzór, zakreśl ponownie”) z dopisanym „czy oba pasy mają tę samą grubość”. Rekomendacja: (b), a jeśli objaw jest na urządzeniu — (a) razem z 001
- Test akceptacyjny: scen. 47: cztery pasy o wysokości równej ±10%; kadr 04: dwa pasy równe ±10%
- Status: otwarte

### 04-studio-projektowe-003 · Znacznik „Row 48” na wierszu „Row 21” wzoru, który ma 23 rzędy
- Pozycja listy kontrolnej: SP-13
- Poziom: P2
- Realność: realny (tylko w kadrach 03/04, czyli przy `[og07-ok]`) · Pewność: wysoka
- Rodzaj: D
- Dowód: zrzuty/kadr04-ipad-iphone-en.png — „Row 48 ↓” przy „Row 21: knit 2 together around, 48 stitches left.”, ostatni wiersz wzoru „Row 23”, licznik „47 / Now working row 48”
- Mechanizm: treść wzoru sklepu (`src/kompozycja/e2e/wzor-sklepu.ts`, wskazany w `e2e/zrzuty-sklepu/04-zakreslenie.yaml:28`) nie ma wiersza 48, więc znacznik ląduje na wierszu o innym numerze, obok liczby „48 stitches”
- Powraca: nie
- Wzorzec lub źródło: wiarygodne dane fikcyjne (`docs/wydanie/metadane/zrzuty-plan.md:4`, 2.3.9)
- Kroki w aplikacji: strona produktu, kadr 03 albo 04
- Opcje: (a) treść wzoru z wierszem 48 (np. „Rows 21–47: knit all stitches.” i „Row 48: …”), w każdym języku danych — zmiana w `src/`, więc nowy build aplikacji zrzutów i nowy SHA; (b) licznik fikstury na rzędzie istniejącym we wzorze (np. 20) — zmiana fikstury i testów spójności, karta „Dziś” pokaże małą liczbę. Rekomendacja: (a), tylko gdy zapadnie `[og07-ok]`
- Test akceptacyjny: w kadrze 03 znacznik stoi na wierszu z numerem równym bieżącemu rzędowi licznika
- Status: otwarte

### 04-studio-projektowe-004 · Pasy zaczynają się w połowie wiersza i leżą między wierszami
- Pozycja listy kontrolnej: SP-13
- Poziom: P2
- Realność: realny (kadr 04) · Pewność: wysoka
- Rodzaj: D
- Dowód: dowody/b-pasy.txt — iPad: pas 1 y797–851, wiersz „Cast on 96…” y829–866 (pas zakrywa górną część wiersza i odstęp nad nim); oba pasy od x≈520–540 do krawędzi strony 2177, czyli od środka wiersza („Cast on 96 |stitches…”); iPhone 04: pas 2 y1368–1379 na dole wiersza „Rows 14-20” (wygląda jak podkreślenie)
- Mechanizm: swipe w procentach ekranu (`e2e/zrzuty-sklepu/00-przygotuj.yaml:167` „swipe: { start: "20%, 40%", end: "80%, 40%", duration: 800 }” i `e2e/zrzuty-sklepu/04-zakreslenie.yaml:31`), współrzędne odgadnięte (`docs/wydanie/metadane/zrzuty-plan.md:51`)
- Powraca: nie
- Wzorzec lub źródło: `.zak` cały wiersz, 6 px poza tekst (`docs/design/dzianina/ekrany.html:98`); P-769 pkt 3
- Kroki w aplikacji: strona produktu, kadr 04
- Opcje: (a) współrzędne z pomiaru wierszy (pkt 3 specyfikacji) + kontrola położenia w `kontrola-zakreslen.mjs`; (b) bez zmian — pas wygląda na przypadkową kreskę. Rekomendacja: (a), bez buildu aplikacji, tylko przy `[og07-ok]`
- Test akceptacyjny: środek każdego pasa w środku wiersza ±15% wysokości wiersza; początek pasa ≤ 6 pt przed pierwszym znakiem
- Status: otwarte

### 04-studio-projektowe-005 · Uchwyt okna iPadOS w rogu kadrów iPada
- Pozycja listy kontrolnej: SP-13
- Poziom: P2
- Realność: realny (wszystkie 10 kadrów iPada w komplecie, także w ramkach) · Pewność: wysoka co do obrazu; że to uchwyt zmiany rozmiaru okna z iPadOS 26 — średnia
- Rodzaj: D
- Dowód: zrzuty/ipad-rog-uchwyt.png (róg `ipad-13/en/01-dzis.png`); ten sam łuk w zrzutach scen. 47
- Mechanizm: symulator iPada uruchamia aplikację w trybie okien; sposób przełączenia na pełny ekran w `simctl` [DO USTALENIA, rola 10]
- Powraca: tak — znalezisko (4) z `zrzuty-plan.md` („ciemny łuk w prawym dolnym rogu”), błędnie przypisane rogowi symulatora → trwała kontrola: próbka pikseli rogu w `wymiary-asc.mjs` albo w kroku ramek
- Wzorzec lub źródło: kadr ma pokazywać aplikację, nie element okna systemu (`docs/wydanie/metadane/zrzuty-plan.md:4`, 2.3.3)
- Kroki w aplikacji: strona produktu, dowolny kadr iPada, prawy dolny róg
- Opcje: (a) tryb pełnoekranowy symulatora przed scenami (rola 10, skrypt, bez buildu); (b) zamalowanie rogu w `ramki-sklepu.sh` tłem — tanie, ale ramka przestaje być surowym zrzutem; (c) zostawić. Rekomendacja: (a), a gdy simctl nie pozwala — (c) z zapisem
- Test akceptacyjny: róg 160×160 px kadrów iPada bez pikseli łuku (różnica od tła ≤ 10)
- Status: otwarte

## Do sprawdzenia
- Czy 002 występuje na urządzeniu (krok właściciela U2, 1 min) — rozstrzyga, czy poprawka idzie przed kandydatem.
- iPad poziomo 03/04: pigułka „Page 1 of 1” zasłania fragment wiersza 23 („…around, [Page 1 of 1] hes left.”) — zachowanie przeglądarki PDF, w kadrze wygląda na usterkę; pewność, że warto to zmieniać, poniżej 80%.
- Czy raport M1 (warsztat) zawiera przegląd P-218 (1)–(6) — [DO USTALENIA] dla C3.

## Co działa dobrze i należy zachować
- Kadry 01, 02, 05 pokazują element firmowy (dzianinę) z danymi i jeden akcent `#C08425`; karta „Dziś” z „+1” i „Continue” czyta się w pierwszej sekundzie.
- Fikstura po 020 jest spójna liczbowo między ekranami (47/48, 3 dni, 7 rzędów, „2 of 5”).
- Kalendarz zgodny ze wzorcem projektu; pasek stanu 9:41 we wszystkich kadrach; 57 plików RGB bez alfy w wymiarach sklepu (dowody/a-artefakty.txt).
- Rozdzielenie 03/04 do `warunek-og07/` pozwala wydać komplet 5 zrzutów bez decyzji patentowej.

## Decyzje dla właściciela
Decyzje projektowe do weta (pula P-767…P-770; zapis w `docs/decyzje.md` robi koordynator):
- **P-767:** iPhone 01 bez zmiany kadru (ucięty dół kafli pod paskiem kart, linia wolnych dni tylko w 05 i na iPadzie). Odrzucone: przewinięcie sceny (karta „Dziś” wyjeżdża z kadru).
- **P-768:** arkusz Historii (06) bez zmian: pusta dolna część i przyciemnione tło iPada to zachowanie arkusza systemowego. Odrzucone: więcej wpisów w fiksturze (zmienia liczby 47, 7 rzędów i „This week”).
- **P-769:** werdykt drugiego pasa: zmiana według specyfikacji z „Zadanie 2” (barwa `kolor.zakreslacz`, tekst ≥ 4,5:1, równa grubość, pas na wierszu).
- P-770: niewykorzystany.
Dla koordynatora (KO): C3 — rekomendacja (a) bez `[og07-ok]`; 001 — wariant (B) przed kandydatem albo 1.0.1 (wymaga nowego buildu); 002 — krok U2 właściciela najpierw.

## Proponowane polecenie naprawy
`node tools/assemble.mjs 08-programista --tryb fix --zadania 04-studio-projektowe-001,04-studio-projektowe-002` (aplikacja, nowy build; 001 wariant B, 002 po kroku U2), a przy `[og07-ok]` dodatkowo `--zadania 04-studio-projektowe-003,04-studio-projektowe-004`; rola 10: `node tools/assemble.mjs 10-wydanie --tryb fix --zadania 04-studio-projektowe-005`.

Czas agenta: 001 (B) ok. 1 h + przebieg macOS; 002 diagnoza 1–2 h; 003/004 ok. 1 h + przebieg zrzutów; 005 ok. 1 h. Właściciel: 1 min (U2 na iPadzie) i weto P-767–P-769.

`git status --porcelain` przed commitem (pliki śledzone nietknięte, tylko nowy katalog): dowody/e-git-status.txt
