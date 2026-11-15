# Przegląd tłumacza: podpisy zrzutów sklepu, 27 języków (BO, 2026-11-15)

Źródło wyniku: artefakt `raport-podpisy` z runu 43699678893 (`9696e2d`, opus/high, przekład + krytyk, 27 języków), przyjęty skryptem `przyjmij` do `docs/wydanie/metadane/podpisy-zrzutow.json`. Koszt API wg cennika Batch (z podsumowania artefaktu): **1,345 USD** (wejście 140 855, wyjście 106 356 tokenów); razem z przebiegami dowodowymi (0,077 + 0,134 USD) ≈ 1,56 USD.

## Wynik kontroli
- 27/27 języków przyjętych, 0 odrzuconych podpisów, 0 odrzuconych poprawek krytyka; 7/7 podpisów ≤ 40 znaków w każdym języku (liczone w znakach).
- Krytyk zaproponował 3 poprawki w 2 językach i wszystkie przyjęto: de 04 (przypadek „in die Anleitung”, rejestr „Markiere und schreibe”), hr 04 („izravno na uputama”) i hr 06 („Vrijeme svake promjene, poništi dodirom”). Pozostałe 25 języków bez poprawek.
- „tap” zgodne z aplikacją (KO-063): cs „klepnutí”, sk „ťuknutie”, de „tippen/Tipp”, ja/ko „タップ/탭”, fi „napautus”, pl. Skład ramek: `tests/wydanie/uklad-podpisow.test.ts` zielony na nowych tekstach.
- Ręcznych poprawek tłumacza: brak (P-824 nie wykorzystane).

## Uwagi tłumacza (do przeglądu człowieka według progu; status języków: `[DO PRZEGLĄDU]`)
- Terminy „dzień robótkowy” (cs, da, el, es, es-419, fi, hu, id, ja, ko, ms, ro, tr, zh-Hant i inne) pochodzą ze słownika aplikacji, który oznacza je jako nieprzejrzane przez rodzimego użytkownika.
- Podpis 06 w kilku językach (de, fi, fr, hr, it, ro, tr, es) zgubił „każdą” albo „jednym” zmianę/stuknięcie przez limit 40 znaków (np. fr „Tout est horodaté, annulez d’un toucher”, ro „pas” zamiast „zmiana”, tr „adım”). Sens zachowany, ale to najsłabszy podpis serii; priorytet dla recenzenta rodzimego: fr, ro, tr, it, fi.
- de 06: „Tipp” jako rzeczownik „stuknięcie” (słownik aplikacji używa „Tipps”); standard to „Fingertipp”, tu nie mieści się w 40 znakach.

## Rozbieżności w słowniku samej aplikacji (znalezisko dla ról 04/06/09 po stronie aplikacji, nie podpisów; nie poprawiane tutaj)
- Formy zwracania się: hu (dwa razy „koppints”, raz „Koppintson”), ro (tu „atinge” i dvs. „Atingeți”).
- „tap” niejednolicie: sk („stlačte”, „ťuknutím”, „klepnutia”), ru („нажмите” i „Коснитесь”), uk („торкніться” i „натискань”), ko („탭” i „누르세요”), fr („touchers” i „touches”).
- it: słownik terminów „ferro” (druty) vs. aplikacja „riga”; nb: „rad” vs. „pinne”; nl/pt/pt-BR/vi/id/ms/el/nb: „licznik” w aplikacji krótszy („Teller”, „Contador”…) niż termin ze słownika terminów („toerenteller”, „contador de carreiras”…).
- zh-Hant: aplikacja „織圖”, słownik terminów „織法” (wybór oznaczony DO SPRAWDZENIA).
