# RZ2 — przegląd kadrów 03 i 04 (zadanie 1)

Rola 07-jakosc, tryb audytu, niezależny przegląd ZR8/ZR8b/ZR8c. Data: 2026-11-25. Gałąź: `claude/rz2-recenzja-zr8-2026-11-25`, HEAD kodu: 8685b098.

## Źródła (pobrane z artefaktów GitHub Actions, obraz oglądany narzędziem Read)

| Bieg | Artefakt | Zakres |
|---|---|---|
| 45633013976 | surowe (`sklep-zrzuty-surowe`) i ramki (`sklep-zrzuty-ramki`, id 15032840540) | en, pl × iPhone 6.9 (1320×2868), iPad 13 (2752×2064) |
| 45633019859 | surowe i ramki (id 15031413892) | 29 języków × iPhone 6.9 |

Pliki: `03-wzor.png` (1 zakreślenie, znacznik rzędu 21), `04-zakreslenie.png` (2 zakreślenia: rzędy 9 i 13).

## Kryteria

(a) znacznik rzędu w przerwie między rzędami, nie na tekście · (b) zakreślenia: 03 = 1 pas, 04 = 2 pasy, żaden pas nie zasłania sąsiedniego rzędu · (c) „Rząd/Row N” i tekst kadru w języku kadru, bez ucięć i nakładania · (d) brak nakładek e2e/diagnostycznych.

## Metoda i jej granice

- Oglądanie montaży (3 języki na obraz, ok. 0,45× skali) dla surowych; montaże 5 języków × 2 kadry (300 px na kadr) dla ramek; dla en/03 surowy kadr w pełnej rozdzielczości (wycinek okolicy znacznika, `1320×520`).
- To ocena wzrokowa, **nie pomiar pikselowy**. Drobna nakładka (kilka pikseli) w skali 0,3–0,45× mogłaby umknąć; kryterium (d) potwierdzone w pełnej skali tylko dla en/03 iPhone. Pomiar pikselowy robi `kontrola-zakreslen.mjs` (patrz `rz2-recenzja.md`).
- Nie czytałam raportów autorów ZR8* przed oceną.

## Wynik


Legenda: OK = spełnia (a)–(d). Kolumny: surowe iPhone 6.9 kadr 03 / 04 oraz ramka sklepowa 03 / 04.

| Język | iPhone 6.9 surowy 03 | iPhone 6.9 surowy 04 | Ramka 03 (podpis kadru) | Ramka 04 (podpis kadru) | Uwaga |
|---|---|---|---|---|---|
| cs | OK | OK | OK | OK |  |
| da | OK | OK | OK | OK |  |
| de | OK | OK | OK | OK |  |
| el | OK | OK | OK | OK |  |
| en | OK | OK | OK | OK |  |
| es | OK | OK | OK | OK |  |
| es-419 | OK | OK | OK | OK |  |
| fi | OK | OK | OK | OK |  |
| fr | OK | OK | OK | OK |  |
| hr | OK | OK | OK | OK |  |
| hu | OK | OK | OK | OK |  |
| id | OK | OK | OK | OK |  |
| it | OK | OK | OK | OK |  |
| ja | OK | OK | OK | OK |  |
| ko | OK | OK | OK | OK |  |
| ms | OK | OK | OK | OK |  |
| nb | OK | OK | OK | OK |  |
| nl | OK | OK | OK | OK |  |
| pl | OK | OK | OK | OK | zawartość PDF po polsku (próbka), zegar 09:41 zamiast 9:41 (format lokalny) |
| pt | OK | OK | OK | OK | „Concluído” |
| pt-BR | OK | OK | OK | OK | przycisk „OK” zamiast „Concluído” (jak pt) — kosmetyka, tłumaczenie, poza zakresem 03/04 |
| ro | OK | OK | OK | OK |  |
| ru | OK | OK | OK | OK |  |
| sk | OK | OK | OK | OK |  |
| sv | OK | OK | OK | OK |  |
| tr | OK | OK | OK | OK |  |
| uk | OK | OK | OK | OK |  |
| vi | OK | OK | OK | OK |  |
| zh-Hant | OK | OK | OK | OK |  |

| Urządzenie / język | Surowy 03 | Surowy 04 | Ramka 03 | Ramka 04 | Uwaga |
|---|---|---|---|---|---|
| iPad 13 / en | OK | OK | OK | OK | strona PDF ucięta u dołu po „Row/Rząd 22” — jak w każdym kadrze iPada (patrz uwagi) |
| iPad 13 / pl | OK | OK | OK | OK | strona PDF ucięta u dołu po „Row/Rząd 22” — jak w każdym kadrze iPada (patrz uwagi) |

## Uwagi (żadna nie blokuje)

Liczba uwag blokujących: **0**. Uwag kosmetycznych/informacyjnych: **4**.

1. **K-1 (informacja, P3):** pasek licznika w ramce iPhone 6.9, język en: „Now working row / 21” łamie się na dwie linie (`6.9/en/03-wzor.png`, `04-zakreslenie.png`, także ramki). Brak ucięcia i nakładania; to samo w innych językach z długim podpisem (np. cs, da, id, ms, hr, sk). Nie narusza (c).
2. **K-2 (informacja):** zawartość PDF-u próbki jest po angielsku we wszystkich językach poza pl — to przykładowy dokument, nie UI. [DO USTALENIA, czy sklep ma tak pokazywać próbkę; to decyzja produktowa, nie błąd kadru.]
3. **K-3 (P3):** na iPadzie 13 strona PDF jest ucięta po „Row/Rząd 22” (`ipad-13/{en,pl}/03-wzor.png`, `04-zakreslenie.png`). Powtarzalne we wszystkich czterech kadrach, w ramach okna wzoru obok licznika; znacznik i zakreślenia widoczne.
4. **K-4 (kosmetyka):** w kadrze 03 znacznik wygląda jak dwie poziome linie: pełna linia nad linią z uchwytem i etykietą „Row 21 ↓”. Etykieta leży w przerwie między „Rows 14-20” a „Row 21”, nie na tekście (wycinek: pełna rozdzielczość). Czy podwójna linia jest zamierzona, sprawdzam w kodzie w zadaniu 2 [DO USTALENIA].

## Wniosek (zadanie 1)

Dla wszystkich 29 języków (iPhone 6.9) oraz en, pl (iPad 13): (a) znacznik w przerwie między rzędami, (b) 03 = 1 pas (rząd 9), 04 = 2 pasy (rzędy 9 i 13), żaden nie zakrywa sąsiedniego rzędu, (c) „Row/Rząd/…  21” i podpisy kadrów w języku kadru, podpisy w ramkach mieszczą się w 2 liniach bez ucięć, (d) brak nakładek e2e/diagnostycznych.

**do sklepu: TAK** (0 uwag blokujących; 4 informacyjne/kosmetyczne). Zastrzeżenie: ocena wzrokowa w zmniejszonej skali, patrz „Metoda i jej granice”. Ten werdykt dotyczy tylko kadrów 03/04 z dwóch biegów; kadry 01, 02, 05–07 nie były w zakresie.
