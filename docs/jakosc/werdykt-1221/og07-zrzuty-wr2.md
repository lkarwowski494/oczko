# Zrzuty sklepu — ponowny przegląd (WR2, P-992): notatki dowodowe

Data 2026-11-20, rola 07 (audit). Gałąź `claude/wr2-zrzuty-2026-11-20` od 4e46688c.

## Materiał
- Przebieg „Zrzuty sklepu” #39, run 44677685872, attempt 1, `workflow_dispatch`, SHA 4e46688c5d27336d0beb8303e2a00ddd14ce2f9b, wynik success (odczyt `get_workflow_run`). Build z `EXPO_PUBLIC_E2E=1` i `EXPO_PUBLIC_ZRZUTY=1` (`.github/workflows/zrzuty-sklepu.yml:245`).
- Artefakty pobrane przez MCP i `curl`, sumy zipów zgodne z `digest` z listy artefaktów: `sklep-zrzuty-ramki` (14607936246) i `sklep-zrzuty-surowe` (14607606944). Sumy 56 plików PNG: `wr2-manifest-sha256.txt`.
- Komplet: 2 urządzenia (iPhone 6.9″ 1320×2868; iPad 13″: 01, 02, 05, 06, 07 pionowo 2064×2752, 03 i 04 poziomo 2752×2064) × 2 języki (en, pl) × 7 scen = **28 surowych + 28 w ramkach**. Surowe mają też `zrzuty-daty.json` (`teraz` 2026-11-20T09:41:00).
- Sposób przeglądu: wszystkie 56 plików obejrzane wzrokiem (sceny 03 i 04 każdy plik osobno, w ramkach i surowe na iPadzie; pozostałe w zestawieniach 5 kadrów na rząd, czytelność napisów kontrolowana na kadrach 03/04 i na rogach pasków). OCR niedostępny w kontenerze, więc to kontrola wzrokowa, nie maszynowa; drugą nogą są testy z 4e46688c (`tests/ekrany/zrzuty-bez-diagnostyki.test.tsx`, `zrzuty-plakietka-strony.test.tsx`), których nie uruchamiałem.
- Zestawienia w repo: `wr2-ramki-03-04-ipad.jpg`, `wr2-ramki-03-04-iphone.jpg`, `wr2-ramki-iphone-01-02-05-07.jpg` (JPEG, zmniejszone).

## 1. Nakładki diagnostyczne E2E i pigułka „Strona n z m”
| Zakres | Wynik |
|---|---|
| 28 surowych: `window:`/`dow:`, `touch:`, `taps accepted:`, `notes:`, `pattern presses:`, `counter input:`, panele zegarka | **brak** w żadnym pliku (rogi, pasek pod paskiem stanu, dolna część nad paskiem kart i podpis pod kadrem oglądane na każdym) |
| 28 w ramkach | **brak** (to samo; podpisy sklepowe nad ramką, bez dopisków) |
| Pigułka „Strona 1 z 1” / „Page 1 of 1” na 03 i 04 (iPhone i iPad, en i pl, surowe i ramki) | **brak** we wszystkich 16 plikach; w nagłówku zostaje zwykły podtytuł „PDF · 1 page” / „PDF · 1 strona” (to element aplikacji, nie pigułka) |
| iPad 03/04: dolny wiersz tekstu PDF | czytelny; zasłania go jedynie linia znacznika rzędu (patrz sekcja 4) |

Wynik: dawne U2 dla zrzutów **zamknięte**. Mechanizm to P-993 (`diagnostykaE2e = null`, `KontekstZrzutow` chowa pigułkę); w aplikacji poza trybem zrzutów pigułka zostaje (patrz niżej, „pigułka w aplikacji”).

## 2. OG-07 dla scen 03 i 04 (P-218 ograniczenia 1–6, P-224) — ponowny przegląd na nowych kadrach
| Ogr. | Co widać na nowych kadrach (iPhone i iPad, en i pl, surowe i ramki) | Wynik |
|---|---|---|
| (1) jeden wzór = jedno źródło | jeden PDF „Cable Hat” / „Czapka z warkoczem”, „PDF · 1 page”; brak drugiego źródła, brak składania | zgodne |
| (2) treść wzoru nietknięta, adnotacje osobną warstwą | tekst PDF bez zmian; zakreślenia żółte i linia znacznika leżą nad nim; brak edycji, brak OCR | zgodne |
| (3) jeden znacznik, na iPadzie obok wzoru licznik | jedna linia „Row 48 ↓”/„Rząd 48 ↓”; iPad poziomo: wzór po lewej, licznik „47” + „+1 row”/„−1” po prawej; iPhone: licznik pod wzorem; brak drugiego wzoru | zgodne |
| (4) film tylko jako odnośnik poza wzorem | brak filmu | zgodne |
| (5) treść zależna od postępu tylko od użytkownika i licznika | etykieta znacznika z licznika (47 → 48), zakreślenia z ręki użytkownika | zgodne |
| (6) przegląd ekranów wzoru przed wydaniem | ten przegląd, na kadrach z symulatora, nie na urządzeniu | wykonane na kadrach |

Licznik zakreśleń 03 → 04 (nagłówek kadru): iPhone en 1 → 2, iPhone pl 1 → 2, iPad en 1 → 2, iPad pl 1 → 2; w 04 widać włączony zakreślacz (podświetlona ikona) i pasek narzędzi. Brak E3 (edycja części) i E5 (złożenie w jeden zestaw). To ocena projektu, nie opinia prawna.

**Odpowiedź OG-07: sceny 03 i 04 mieszczą się w granicach — TAK.** Wynik WR1 nie zwalniał z ponownego przeglądu; ten przegląd potwierdza go na nowych plikach.

## 3. Zgodność kadru z aplikacją 1221 i podpisów z kadrami
- Różnice kodu 1221 (a830eb21) → 4e46688c w wejściach binarki: 9 plików, 44 dodane / 25 usuniętych linii (`git diff --stat a830eb21 4e46688c -- src app modules ios assets package.json`), wszystkie z P-993: `diagnostykaE2e` zamiast `paneleE2e` w ekranach, `KontekstZrzutow` w `app/_layout.tsx`, `Pasek.tsx` i `WzorPrzegladarka.tsx` (ukrycie pigułki), `tryb-e2e.ts`. Poza tym ekrany i teksty z kadrów to ten sam kod co 1221; dodatkowe różnice kadru wynikają z trybu zrzutów z wcześniejszych decyzji (sztuczny sklep, sztuczny iCloud, zegar 09:41 z `zrzuty-daty.json`, dane fikcyjne), nie z P-993.
- Podpisy a kadry (en/pl): 01 „Pick up right where you left off” — karta „Continue”, 02 „One tap adds a row” — przycisk +1, 03 „Your pattern right next to the counter” — wzór i licznik razem (na iPhonie licznik pod wzorem, na iPadzie obok), 05, 06 („Every change with its time, one-tap undo” — lista z godzinami i „Undo”), 07 („Your crafting days at a glance” — kalendarz): zgodne.
- **U4 utrzymane (P3):** podpis 04 „Highlight and write on the pattern” / „Zakreślaj i notuj na wzorze” obiecuje pisanie/notatkę; kadr pokazuje tylko zakreślenia i pasek narzędzi, bez żadnej notatki ani pisma.

## 4. Obserwacje koordynatora
1. **Zakreślenia na iPadzie zaczynają się od połowy wiersza** („stitches and join…”, „knit 2, purl 2…”; pl: „oczek i połącz…”, „2 oczka prawe…”). Potwierdzone na surowych i ramkach. Przyczyna: scena rysuje palcem od 20% szerokości (`04-zakreslenie.yaml`: `swipe 20%,48% → 80%,48%`; `00-przygotuj.yaml`: `20%,40% → 80%,40%`), a tekst wzoru zaczyna się w ok. 10% szerokości. Pas nie jest przyciągnięty do wiersza: na iPadzie leży głównie nad tekstem i dochodzi do prawej krawędzi strony; na iPhonie pas leży pod tekstem, w pl 03/04 kończy się w środku słowa („po|wtarzaj”), a drugie zakreślenie 04 stoi między wierszami „Rząd 13” i „Rzędy 14–20” (w en przy „Rows 14–20”), więc nie wiadomo, który wiersz oznacza.
   Ocena: **P3**. Nie myli co do działania funkcji (zakreślenie jest od ręki użytkownika, nie od wiersza; zgodne z ograniczeniem 5 i z opisem „Highlight/Zakreślaj”), ale wygląda niechlujnie na pierwszym planie sklepu. Naprawa: początek ruchu przy tekście (ok. 8–10% na iPadzie) i wysokość dobrana do wiersza; zmiana tylko w scenach, wymaga powtórki zrzutów.
2. **„Row 48 ↓” przy linii PDF „Row 21” (iPad i iPhone, en i pl) przy liczniku 47 i „Now working row 48”.**
   - Zgodność z działaniem aplikacji: tak. Wg BR-WZR-003 i RD-21 znacznik pokazuje rząd w robocie (licznik + 1 = 48) i domyślnie tak się ustawia; fikstura (`00-przygotuj.yaml`: `wzor-znacznik-rzad` = „48” → „Gotowe”) potwierdza domyślny rząd 48 i zostawia znacznik w miejscu, gdzie go postawiono (na wierszu „Row 21”); sama etykieta jest więc zgodna z regułą, a niezgodny jest tylko jej związek z numeracją PDF.
   - Zgodność z odbiorem: **nie**. Wzór ma 23 rzędy i kończy się „Cut the yarn…”, a znacznik „48” stoi na wierszu „Row 21: … 48 stitches left”. Odbiorca, który czyta wzór, zobaczy znacznik opisany rzędem, którego we wzorze nie ma, na wierszu o innym numerze; to może wyglądać na błąd aplikacji, w kadrze, który ma pokazać główną przewagę (znacznik rzędu, OG-07). Nie przeczy literalnie opisowi sklepowemu („znacznik rzędu na wzorze”, `en.md:17`) ani podpisowi 03, ale osłabia wiarygodność funkcji; plan zrzutów (`zrzuty-plan.md:37`, pkt 6) wymaga, by dane fikcyjne były wiarygodne (2.3.9) i już wskazywał „47 vs row 48”.
   - Ocena: **P2** (spójność danych kadru; bez wpływu na binarkę; nie blokuje wysyłki, jeśli koordynator przyjmie uwagę). Naprawa tylko w danych sceny: wzór sklepu z numeracją obejmującą rząd 48 albo znacznik ustawiony na wierszu o numerze zgodnym z etykietą.

## 5. Pozostałe obserwacje (P3, nowe lub znane)
- Linia znacznika przechodzi przez górę liter wiersza „Row 21/Rząd 21” (podwójna kreska); tekst czytelny, wygląda jak przekreślenie. P3.
- Godziny w Historii różnią się między przebiegami zadań (iPhone en „6:05 PM”, iPad en „6:04 PM”; pl iPhone 18:07, iPad 18:04); każdy plik wewnętrznie spójny. P3.
- iPad 01, 02, 05, 06, 07: duże puste obszary; na 06 spod arkusza wystają przyciski licznika; znane z `zrzuty-plan.md:37` pkt 4 i 3, bez zmiany. P3.
- Ucięte kafle na dole iPhone 01 (naturalny przewinięty kadr) — znane. P3.

## Pigułka w aplikacji (poza zrzutami)
P-993 nie zmienia zwykłej aplikacji: pigułka „Strona n z m” zostaje, a decyzja nazywa możliwe zasłonięcie dolnego wiersza na iPadzie poziomo jako P2 brzegowy (NFR-UKL-001, „nienaprawiany”). Tego ja nie widziałem w działaniu (brak symulatora); opieram się na zapisie P-993 i na WR1. Zapis w werdykcie: utrzymane jako osobna uwaga P2 brzegowy dla aplikacji, nie dla zrzutów.

## Nie sprawdzono
Aplikacji na urządzeniu i na symulatorze (kadry z CI); maszynowej detekcji tekstu (OCR); piksel-w-piksel zgodności ramek z surowymi (kadry w ramkach obejrzane osobno, treść zgodna); uruchomienia testów z 4e46688c; zachowania pigułki w zwykłej aplikacji na iPadzie; podpisów w pozostałych 33 językach (tylko en i pl).
