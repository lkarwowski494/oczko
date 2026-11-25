# WR4 — tabela pomiarów i obserwacji: iPhone 6.9″, 27 języków × 7 scen (przebieg 45021511463, SHA 5310ea0b)

Data 2026-11-22, rola 07 (audit). Wszystkie 189 ramek obejrzane (zestawienia 4+3 sceny na język w 360–400 px szerokości); surowe: te same piksele co kadr w ramce, plus próbka 4 surowych obejrzana osobno (de 04, id 04, hu 02, vi 06 — bez nakładek). Pomiary pasów: `pasy-pomiar.py` → `pasy-ramki-pomiar.txt`; obwiednie podpisów: `podpisy-bbox.txt`.

Legenda: ✓ = brak uwag; ✗ = wada z werdyktu DO POWTÓRZENIA; ⚠ = uwaga P3 (opis w ostatniej kolumnie). Kolumny „1 komplet” i „5 nakładki” dotyczą całego języka (7 plików 1320×2868 w surowych i w ramkach; brak nakładek E2E, pigułki „Strona n z m”, panelu „Test store”, klawiatury, alertów).

| Język | 1 komplet | 2 język i znaki | 3 tekst (podpis/etykiety) | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 5 nakładki | Werdykt | Uwagi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cs | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| da | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| de | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: Rows 10-12 podkreślone zamiast Row 13 (strona PDF od y=1069 vs 1034 w en) |
| el | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ⚠ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: Rows 10-12 podkreślone zamiast Row 13 (strona PDF od y=1069 vs 1034 w en); 06: nagłówek „Νοέμβριος” pod paskiem kart ucięty do resztki |
| es | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| es-419 | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| fi | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| fr | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ⚠ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: Rows 10-12 podkreślone zamiast Row 13 (strona PDF od y=1069 vs 1034 w en); 06: nagłówek „novembre” pod paskiem kart ucięty do resztki |
| hr | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| hu | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| id | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ⚠ | ✗ | ✓ | ✓ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: pas między Row 13 a Rows 14-20 (strona PDF od y=1011 vs 1034 w en); 03/04: pasek licznika w 3 liniach |
| it | ✓ 7/7, 1320×2868 | ✓ | ⚠ | ⚠ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | 01 „ferro 21 / ferri finiti” a 02 „riga 21” (nazewnictwo aplikacji) |
| ja | ✓ 7/7, 1320×2868 | ✓ (CJK bez „tofu”) | ⚠ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: Rows 10-12 podkreślone zamiast Row 13 (strona PDF od y=1069 vs 1034 w en); 04: podpowiedź zawija się z osieroconym „す。” w drugiej linii |
| ko | ✓ 7/7, 1320×2868 | ✓ (CJK bez „tofu”) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| ms | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ⚠ | ✗ | ✓ | ⚠ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: pas między Row 13 a Rows 14-20 (strona PDF od y=1011 vs 1034 w en); 06: nagłówek „November” pod paskiem kart ucięty do resztki; 03/04: pasek licznika w 3 liniach |
| nb | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| nl | ✓ 7/7, 1320×2868 | ✓ | ⚠ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: Rows 10-12 podkreślone zamiast Row 13 (strona PDF od y=1069 vs 1034 w en); podpisy ramek: Noto Sans Bold (kroj.systemowy w `ramki-sklepu.sh:12`), inni łacińscy: Bree |
| pt | ✓ 7/7, 1320×2868 | ✓ | ⚠ | ✓ | ⚠ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | 02: podpis przycisku zawija się do 2 linii, wyrównany do lewej tuż przy krawędzi przycisku |
| pt-BR | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| ro | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: Rows 10-12 podkreślone zamiast Row 13 (strona PDF od y=1069 vs 1034 w en) |
| ru | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ⚠ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: Rows 10-12 podkreślone zamiast Row 13 (strona PDF od y=1069 vs 1034 w en); 06: nagłówek „ноябрь” pod paskiem kart ucięty do resztki |
| sk | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| sv | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| tr | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| uk | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | DO POWTÓRZENIA (04) | 04: Rows 10-12 podkreślone zamiast Row 13 (strona PDF od y=1069 vs 1034 w en) |
| vi | ✓ 7/7, 1320×2868 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |
| zh-Hant | ✓ 7/7, 1320×2868 | ✓ (CJK bez „tofu”) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | DO SKLEPU Z UWAGAMI | — |

## Dotyczy wszystkich 27 języków (P3, nie zmieniają werdyktu)
- Zawartość użytkownika w aplikacji jest po angielsku we wszystkich językach: PDF „Cable Hat” (03/04), notatka „next: 3 knit, then cable” (02), nazwy projektów (en: ta sama zawartość we wzorcu WR3). To dane z wzoru sklepu, nie interfejs; do decyzji produktowej, czy w polskim/innych kadrach ma być lokalizowana (nie sprawdzałem pl z WR3 pod tym kątem).
- Podpis 04 obiecuje pisanie/notatki („pište”, „schrijf”, „write”…), kadr notatki nie pokazuje — U4 z WR2 (P3) bez zmian.
- Scena 06: godziny w 12 godzinach („8:00 PM” itd.) także w językach z zegarem 24 h (de, fr, ru, pl…) — region symulatora; P3.

## Kontrola pasów zakreślenia w 04 (rachunek na pikselach ramek; `pasy-pomiar.py`)
Wzorzec en (WR3, run 44758366101): pierwszy pas na wierszu 4 listy (Row 9), drugi — cienki, na wierszu 6 (Row 13). Wynik: **17 języków zgodne z en** (cs, da, es, es-419, fi, hr, hu, it, ko, nb, pt, pt-BR, sk, sv, tr, vi, zh-Hant: drugi pas na wierszu Row 13); **10 języków z drugim pasem poza wierszem Row 13** — de, el, fr, ja, nl, ro, ru, uk (strona PDF przesunięta w dół o 35 px, bo podpowiedź nad PDF zawija się do 2 linii; drugi pas stoi 35 px za wysoko względem tekstu i podkreśla Rows 10-12) oraz id, ms (strona 23 px wyżej, pas stoi między Row 13 a Rows 14-20). Pierwszy pas (Row 9) i sceny 03 (jeden pas na Row 9) są poprawne w 27/27.
Wniosek: drugi pas leży na stałej wysokości ekranu (y≈1559–1582 w ramce), a strona PDF zmienia położenie z wysokością podpowiedzi/tytułu, więc pas trafia w Row 13 tylko gdy podpowiedź ma 1 linię i tytuł 1 linię (pagetop 1034–1046). Powtórka bez zmiany sceny da ten sam wynik.
Krok „Kontrola zakreśleń: OK (27 par)” w przebiegu liczy pasy (03=1, 04=2), nie sprawdza, na jakim wierszu leżą — przeszedł mimo tej wady.
