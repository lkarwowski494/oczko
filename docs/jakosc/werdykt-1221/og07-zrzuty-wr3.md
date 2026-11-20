# Zrzuty sklepu — przegląd po ZR3/ZR4 (WR3, KO-186/KO-187): notatki dowodowe

Data 2026-11-20, rola 07 (audit). Gałąź `claude/wr3-zrzuty-2026-11-20` od 7e3de129 (integracja `claude/youthful-pasteur-kx83sn`).

## Materiał
- Przebieg „Zrzuty sklepu” run **44722734741**, SHA 7e3de1295ed7ed87fe2f9ca8726633609f32bd38 (ZR4), `workflow_dispatch`, og07=true; krok „Komplet zrzutów i wymiary” (job `komplet`, 136291636121) **czerwony**, pozostałe 6 zadań zielone (`get_job_logs failed_only`: 1 z 7 zadań nieudane); artefakty zostały mimo to wgrane.
- Aplikacja z przebiegu **44697325331** (run 42, SHA e3ef8867 = ZR3): odczyt `get_workflow_run`. Między e3ef8867/4e46688c a 7e3de129 wejścia binarki bez zmian (`git diff --stat 4e46688c 7e3de129 -- src app modules ios assets package.json` = pusty); ZR3/ZR4 dotykają tylko `e2e/zrzuty-sklepu/`, danych scen, podpisów i testów.
- Artefakty pobrane przez MCP + `curl` do katalogu w scratchpadzie; sumy zipów zgodne z `digest` z listy: `sklep-zrzuty-ramki` (14629795505) `e925a3bf…c8d`, `sklep-zrzuty-surowe` (14627969952) `cb675bbd…7aa`. Sumy 56 PNG: `wr3-manifest-sha256.txt`.
- Komplet: **28 surowych + 28 w ramkach** = tyle co w WR2 (iPhone 6.9″ 1320×2868; iPad 13″ 2064×2752 pionowo dla 01, 02, 05, 06, 07 i 2752×2064 poziomo dla 03, 04) × en, pl × 7 scen; do tego `zrzuty-daty.json` (`teraz` 2026-11-20T09:41:00).
- Sposób przeglądu: surowe 01, 02, 05, 06, 07 (4 zestawienia: iPhone en/pl, iPad en/pl) i ramki tych scen (2 zestawienia) obejrzane wzrokiem; surowe 03/04: iPad en wprost w pełnym kadrze (03 i 04), iPhone en 04 wprost, pozostałe 03/04 przez zestawienia ramek i wycinki 9–13–21 (en/pl, iPhone/iPad); wszystkie 8 kadrów 03/04 dodatkowo **zmierzone w pikselach** (`wr3-pomiary-zakreslen.txt`, skrypty `wr3-pomiar-skrypty.txt`). OCR niedostępny — kontrola nakładek jest wzrokowa; zestawienia ustawione tak, że panele E2E (zwykły tekst w układzie, jak w `src/kompozycja/e2e/panele.tsx`) byłyby widoczne.

## 1. Uwagi WR2

### P2 — znacznik rzędu (Z1): **ZAMKNIĘTE**
| Wariant | Licznik | Etykieta znacznika | Linia PDF pod znacznikiem |
|---|---|---|---|
| iPad en (03, 04) | „20”, „Now working row 21” | „Row 21 ↓” | „Row 21: knit 2 together around, 48 stitches left.” |
| iPad pl (03, 04) | „20”, „Teraz rząd 21” | „Rząd 21 ↓” | „Rząd 21: przerabiaj po 2 oczka razem, zostanie 48 oczek.” |
| iPhone en (03, 04) | „20”, „Now working row 21” | „Row 21 ↓” | „Row 21: …” |
| iPhone pl (03, 04) | „20”, „Teraz rząd 21” | „Rząd 21 ↓” | „Rząd 21: …” |

Współrzędne (surowe, px natywne): iPad — pas znacznika to dwie reguły y 1665–1671 i y 1714–1720 (kadry 03 i 04 identyczne, en i pl); tekst „Row 21” leży między nimi, etykieta „Row 21 ↓” (ciemny prostokąt) tuż pod dolną regułą przy lewej krawędzi strony (widoczna na `surowe/ipad-13/en/04-zakreslenie.png`, wycinek `wr3-zakreslenia-wiersze-9-13-21.jpg`). iPhone — reguły y 1425–1428 i 1454–1457 (en 03), 1455–1458 i 1484–1487 (en 04), 1440–1443 i 1469–1472 (pl 03), 1470–1473 i 1499–1502 (pl 04); różnica 30 px między 03 i 04 to przesunięcie strony po pasku zakreślacza (te same reguły, odstęp 29 px). Etykieta zgodna z numerem wiersza PDF we wszystkich 8 kadrach 03/04 i 8 ramkach; wzór sklepu ma 23 rzędy, więc znacznik nie wskazuje już nieistniejącego rzędu.

### P3 — zakreślenia Row 9 / Row 13 (Z2): **Row 9 ZAMKNIĘTE; Row 13 zakres ZAMKNIĘTY, wygląd pionowy UTRZYMANY (P3)**
Pomiar `wr3-pomiary-zakreslen.txt` (px natywne; pas = maska żółta, tekst = pasmo ciemnych pikseli wiersza):

| Kadr 04 | Wiersz | Pas x | Pas y (wys.) | Tekst x | Tekst y | początek | koniec | góra | dół | odchylenie środka | wejście w sąsiada |
|---|---|---|---|---|---|---|---|---|---|---|---|
| iPad en | Row 9 | 236–1478 | 1105–1163 (59) | 273–1433 | 1111–1158 | +37 | +45 | +6 | +5 | −0,5 | nie (odstęp ≥ 87) |
| iPad en | Row 13 | 217–1525 | 1413–1434 (22) | 273–1462 | 1394–1442 | +56 | +63 | −19 | −8 | +5,5 | nie (odstęp ≥ 101) |
| iPad pl | Row 9 | 236–1995 | 1105–1163 (59) | 273–1939 | 1111–1159 | +37 | +56 | +6 | +4 | −1,0 | nie |
| iPad pl | Row 13 | 217–2038 | 1413–1434 (22) | 273–1969 | 1394–1442 | +56 | +69 | −19 | −8 | +5,5 | nie |
| iPhone en | Row 9 | 126–894 | 1129–1163 (35) | 164–862 | 1122–1150 | +38 | +32 | −7 | +13 | +10 | nie (odstęp ≥ 44) |
| iPhone en | Row 13 | 114–913 | 1310–1322 (13) | 164–879 | 1292–1319 | +50 | +34 | −18 | +3 | +10,5 | nie |
| iPhone pl | Row 9 | 126–1191 | 1144–1178 (35) | 164–1167 | 1137–1165 | +38 | +24 | −7 | +13 | +10 | nie |
| iPhone pl | Row 13 | 114–1213 | 1310–1322 (13) | 164–1185 | 1307–1335 | +50 | +28 | −3 | −13 | −5 | nie |

(„góra/dół” + = pas wystaje poza pasmo tekstu, − = pasmo tekstu wystaje poza pas.) Wnioski:
- **Poziomo:** wszystkie 8 pasów zaczyna się 37–56 px **przed** początkiem tekstu i kończy 24–69 px **za** jego końcem — od początku do końca wiersza (WR2: od połowy wiersza — usunięte).
- **Sąsiedzi:** żaden pas nie wchodzi na pasmo tekstu sąsiedniego wiersza (odstępy 44–123 px).
- **Odchylenie pionowe (środek pasa − środek tekstu):** Row 9: iPad −1,0…−0,5 px (pas pokrywa pasmo tekstu z zapasem 4–6 px), iPhone +10 px (pas obejmuje ok. 76% wysokości tekstu, górne 7 px liter nie pokryte). Row 13: +5,5 px (iPad), +10,5 px (iPhone en), −5 px (iPhone pl).
- **Utrzymane (P3): Row 13 jest cienki** (22 px iPad, 13 px iPhone wobec 59 i 35 px Row 9 w tym samym kadrze) i leży w różnym miejscu liter: iPad — środek pasa na 0,75 wysokości korpusu liter (pokrywa 67% korpusu, dolna część liter), iPhone en — pod linią bazową (1,20; pokrywa 25% korpusu, czyta się jako podkreślenie), iPhone pl — przy górze korpusu (0,19; 59%). Ten sam swipe w obu językach iPhone'a (`y=46%`) daje inny wynik względem tekstu, bo wiersz „Rząd 13” leży niżej niż „Row 13” (stały współrzędny swipe). Tekst pozostaje czytelny.
- **Obserwacja do roli 08 (hipoteza, nie zweryfikowana):** oba pasy rysuje to samo narzędzie (marker 18 pt, `modules/oczko-wzor/ios/WidokWzoru.swift:420`), a grubości różnią się ok. 2,7× (Row 9 z fikstury odczytany z zapisu, Row 13 narysowany w sesji sceny). Przyczyny nie ustalałem; jeśli to różnica „zapisane” vs „bieżące pociągnięcie”, użytkownik zobaczy ją po ponownym otwarciu wzoru. Do sprawdzenia na urządzeniu — nie ma w zakresie WR3 (bez zmian kodu).

### U4 — podpis 04: **ZAMKNIĘTE**
Ramki: en „Highlight rows right on the pattern”, pl „Zakreślaj rzędy prosto na wzorze” (iPhone i iPad, 4 pliki); zgodne z `docs/wydanie/metadane/podpisy-zrzutow.json` (`/podpisy/{en,pl}/04-zakreslenie`) i z kadrem (widoczne zakreślenia wierszy na wzorze, zakreślacz włączony, „2 highlights”/„2 zakreślenia”). Nie ma już „notuj/write”. Podpisy 03 bez zmian i zgodne.

## 2. Nakładki E2E i pigułka „Strona n z m” (U2): **ZAMKNIĘTE dla zrzutów**
- Brak napisów `window:`/`dow:`, `touch:`, `taps accepted:`, `notes:`, `pattern presses:`, `counter input:`, „Test store…”, „Test files…” i paneli zegarka na 28 surowych i 28 ramkach (rogi, pasek pod paskiem stanu, strefa nad paskiem kart, podpis pod kadrem).
- Pigułki „Strona 1 z 1” / „Page 1 of 1” nie ma na żadnym z 16 plików 03/04 (8 surowych + 8 ramek, iPhone i iPad, en i pl); w nagłówku zostaje podtytuł „PDF · 1 page” / „PDF · 1 strona”.
- Zakres: aplikacja poza trybem zrzutów (pigułka, P2 brzegowy dla iPada poziomo) — bez zmian, nie obserwowana w działaniu.

## 3. OG-07, sceny 03 i 04 (P-218 ogr. 1–6, P-224): **TAK, w granicach**
| Ogr. | Obserwacja na nowych kadrach (iPhone i iPad, en i pl, surowe i ramki) | Wynik |
|---|---|---|
| (1) jeden wzór = jedno źródło | jeden PDF „Cable Hat”/„Czapka z warkoczem”, „PDF · 1 page/strona”; brak drugiego źródła i składania | zgodne |
| (2) treść wzoru nietknięta, adnotacje osobną warstwą | tekst PDF bez zmian; żółte pasy i znacznik leżą nad nim; brak edycji, OCR, brak nowych funkcji | zgodne |
| (3) jeden znacznik, licznik obok wzoru | jedna linia „Row 21 ↓”; iPad poziomo: wzór z lewej, licznik „20” + „+1 row”/„−1” z prawej; iPhone: licznik pod wzorem | zgodne |
| (4) film tylko jako odnośnik poza wzorem | brak filmu | zgodne |
| (5) treść zależna od postępu tylko od użytkownika i licznika | etykieta znacznika wynika z licznika (20 → rząd 21); zakreślenia to pociągnięcia ręki, nie reguły aplikacji | zgodne |
| (6) przegląd ekranów wzoru przed wydaniem | ten przegląd — na kadrach z symulatora, nie na urządzeniu | wykonane na kadrach |

Liczba zakreśleń 03 → 04 (napis w kadrze i piksele): iPhone en 1 → 2, iPhone pl 1 → 2, iPad en 1 → 2, iPad pl 1 → 2; w 04 zakreślacz włączony (podświetlona ikona), pasek narzędzi. W kadrach: 1 składowa żółta w 03 (Row 9), 2 w 04 (Row 9, Row 13). Brak E3 (edycja części) i E5 (złożenie w zestaw). To ocena projektu, nie opinia prawna.

## 4. Zgodność z aplikacją 1221 i komplet
- Wejścia binarki 1221 (a830eb21) → 7e3de129: 9 plików, 44 dodane / 25 usuniętych (`app/_layout.tsx`, `app/formularz/[rodzaj].tsx`, `app/licznik.tsx`, `app/projekt/[id].tsx`, `app/wzor.tsx`, `src/ekrany/Pasek.tsx`, `src/ekrany/WzorPrzegladarka.tsx`, `src/kompozycja/e2e/panele.tsx`, `src/platforma/tryb-e2e.ts`) — jak w WR2, **wyłącznie P-993**; od 4e46688c do 7e3de129 zero zmian wejść binarki. Różnice kadru względem 1221: tryb zrzutów (sztuczny sklep, zegar 09:41, dane fikcyjne) i dane scen ZR3 (licznik 20, zakreślenia, podpis 04).
- Komplet 28 + 28 = jak w WR2; wymiary jak w WR2 (sprawdzone `identify`/Pillow na 03/04, pozostałe w zestawieniach).
- Podpisy 01, 02, 05, 06, 07 zgodne z kadrami (jak w WR2); w 06 godziny Historii różnią się o 1–2 minuty między iPhone'em a iPadem (P3, jak WR2).

## 5. Czerwona kontrola zakreśleń (`scripts/ci/kontrola-zakreslen.mjs`, krok „Komplet zrzutów i wymiary”)
Odtworzone lokalnie na pobranych surowych (skrypt bez zmian): `6.9/en` 03=0 → 04=1 OK, `6.9/pl` 0 → 1 OK, `ipad-13/pl` 0 → 1 OK, **`ipad-13/en` 04=0, 03=0 → BŁĄD** (1 błąd) — jak w przebiegu.
Pomiar koordynatora potwierdzony: pas Row 9 ma barwę mediany (252,245,196) na iPadzie i (252,245,195) na iPhonie (b > 190, poza `jestZolty`), więc **w żadnym kadrze 03 nie jest liczony** (03 = 0 wszędzie); liczy się tylko Row 13 (251/252,242,176…178, b ≤ 190). Liczba „żółtych” wierszy analizy po zmniejszeniu do 500 px: iPad en 04 = **2** (min. 3 → 0 pasów), iPad pl 04 = **3** (dokładnie minimum), iPhone en 04 = 4, iPhone pl 04 = 5. Kontrola przechodzi więc na iPadzie pl o jeden wiersz i może zmienić wynik od kadru do kadru.
- **(a)** Kadr `ipad-13/en/04` **wizualnie pokazuje zakreślenie** — dwa pasy (Row 9 szeroki, Row 13 cienki), napis „2 highlights”, zakreślacz włączony. To **fałszywy alarm kontroli** (kalibracja barwy/grubości), nie wada kadru.
- **(b)** Cienki pas Row 13 czyta się jako **zakreślenie markerem, nie jako przekreślenie**: półprzezroczysty żółty, ten sam odcień co Row 9 w tym samym kadrze, wystaje zaokrąglonymi końcami przed i za tekst, tekst czytelny na wierzchu; na iPadzie leży w dolnej części liter (0,75 korpusu), na iPhone'ie en pod linią bazową (podkreślenie), na iPhone'ie pl przy górze korpusu. Przekreślenie dosłowne (środek korpusu, 0,5) nie występuje w żadnym z 4 wariantów. Ocena: **P3** (niespójna grubość i pozycja względem Row 9; nie P1/P2 — funkcja czytelna, nie myli o działaniu).
- **(c)** Rekomendacja i opcje: zob. dopisek w `werdykt-build-1221.md` (P-1003). Próba kalibracji na tych samych plikach (poza repo, kod nietknięty): reguła `b ≤ 205, r−b ≥ 40` daje 03 = 1 i 04 = 2 w **wszystkich 4** parach (żółte wiersze 03: 5–11, 04: 7–17), reguła `b ≤ 210, r−b ≥ 35` to samo; obecna reguła 0/2/3/4/5 wierszy.

## Nie sprawdzono
Aplikacji na symulatorze i urządzeniu (kadry z CI); maszynowej detekcji tekstu (OCR); logu kroku „Komplet zrzutów i wymiary” (odtworzyłem wynik kontrolą lokalną na tych samych plikach; tail logu zadania nie zawierał wyniku kontroli); testów z 7e3de129 (nie uruchamiałem); podpisów w pozostałych 33 językach (tylko en i pl); przyczyny różnicy grubości pasów (hipoteza wyżej); piksel-w-piksel zgodności ramek z surowymi (ramki obejrzane osobno, treść zgodna); surowych 03 iPhone en/pl i iPad pl oglądanych tylko przez ramki i pomiar, nie wprost.
