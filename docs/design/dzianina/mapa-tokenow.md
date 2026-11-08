# Mapa tokenów: stary `docs/design/tokeny.json` → Dzianina (`tokeny.json` w tym katalogu)

M3-S3-01 · 2026-11-08 · rola 04 (fix) · wygenerowane: `node docs/design/narzedzia/mapa-tokenow.mjs docs/design` (kod 1, gdy pozycji brakuje albo wskazany token nie istnieje). Pozycje: 183 (liście starego pliku, z kluczami „_”), w tym 159 z nowym tokenem i 24 usuniętych z powodem.

**Dla roli 08 (p1):** kod czyta wyłącznie nowe tokeny; stary klucz bez odpowiednika = funkcja wyglądu kierunku A, której Dzianina nie ma (kreski, pole wyboru z ✓, obrys przycisku głównego). Wartość zmieniona (np. 96 → 104 pt) jest zatwierdzona makietami P-554; zrzuty wzorcowe: `wzorce-zrzuty/`.

**Otwarte pytania**
- **O-1 (do 03/właściciela przez koordynatora, przed p4):** kolor włóczki projektu (`kolor._wloczka`, P-063: kropka przy nazwie projektu) — makiety `projekty-*` go nie pokazują. Opcje: (a) kropka koloru włóczki zostaje w wierszu projektu, przy miniaturze dzianiny (obwódka `linia`, gdy kontrast < 3:1) — zachowuje funkcję, jeden element więcej w wierszu; (b) kolor włóczki tylko w ekranie projektu (sekcja włóczki) — prostszy wiersz, informacja o krok dalej. Rekomendacja: (b), bo miniatura dzianiny już niesie postęp, a druga barwa w wierszu konkuruje z akcentem; decyzja zakresu należy do 03.

| Stary klucz | Stara wartość | Token Dzianiny | Nowa wartość | Uwagi |
|---|---|---|---|---|
| `_opis` | Tokeny Oczka, kierunek A „Kreski na wz… | `_opis` | Oczko — system „Dzianina” (redesign M3… | opis pliku Dzianiny (P-552, P-553) |
| `kolor.jasny.papier` | #FCFCFA | `kolory.jasny.tlo` | #E6E1DA | tło ekranu; runo musket zamiast bieli papieru (P-547: żaden ekran płaski biały ani czarny) |
| `kolor.jasny.papierGrupa` | #F2F3F0 | `kolory.jasny.powierzchnia` | #F6F4F1 | tło grup, wierszy, kafli |
| `kolor.jasny.grafit` | #26282C | `kolory.jasny.tekst` | #221D1A | tusz Dzianiny |
| `kolor.jasny.olowek` | #5E626A | `kolory.jasny.tekst2` | #5A5048 |  |
| `kolor.jasny.linia` | #D9DBDF | `kolory.jasny.linia` | #CFC8BF |  |
| `kolor.jasny.zakreslacz` | #F6E04A | `kolory.jasny.zakreslacz` | #F6E04A | tylko strona wzoru (stały #F6E04A w obu motywach, bo strona jest w oryginale: ZM-10, P-563 (8a)); w interfejsie zakreślenie instrukcji zastępuje znacznik `akcent` wiersza „co dalej” |
| `kolor.jasny.tekstNaZakreslaczu` | #1B1C1F | `kolory.jasny.tekst` | #221D1A | tekst wiersza „co dalej” na `powierzchnia` (zakreślenie interfejsu zastąpione znacznikiem `akcent`); na stronie wzoru tekst to treść pliku |
| `kolor.jasny.zakreslaczKrawedz` | #8C7A00 | `kolory.jasny.akcent` | #C08425 | znacznik wiersza „co dalej” (`.zn`) i „Za n rzędów:” w `akcentTekst` na liczniku |
| `kolor.jasny.przyciskTlo` | #26282C | `kolory.jasny.przycisk` | #3A332E | wypełniony w obu motywach (P-547) |
| `kolor.jasny.przyciskTekst` | #FCFCFA | `kolory.jasny.przyciskTekst` | #F3F1EC |  |
| `kolor.jasny.przyciskObrys` | #26282C | **usunięte** |  | bo przycisk główny jest wypełniony w obu motywach, bez obrysu (P-547) |
| `kolor.jasny.drugiPrzyciskObrys` | #26282C | `kolory.jasny.tekst2` | #5A5048 | obrys −1 licznika i paska wzoru (`.minus`, `.pasek-wz .m`: 2 pt `tekst2`) |
| `kolor.jasny.blad` | #B3261E | `kolory.jasny.tekst` | #221D1A | tekst błędu w kolorze `tekst` z ikoną „!” i `role=alert`; czerwień (`niszczacy`) tylko dla działań nieodwracalnych (jeden kolor = jedno znaczenie, design-spec „Kolory”) |
| `kolor.jasny.kreska` | #26282C | **usunięte** |  | bo kreski (element firmowy kierunku A) zastąpione dzianiną (P-552): `akcent`, `akcentJasny`, `igla` |
| `kolor.jasny.arkusz` | #FCFCFA | `kolory.jasny.powierzchnia` | #F6F4F1 | arkusz formularza jest systemowy (tło arkusza z motywu systemu); treść grup na `powierzchnia` |
| `kolor.jasny.przyciskNieaktywnyTlo` | #D9DBDF | `kolory.jasny.przyciskNieaktywny` | #F6F4F1 | z przerywaną ramą `przyciskNieaktywnyRama` i ikoną stanu (jak `oferty-czeka-*`) |
| `kolor.jasny.przyciskNieaktywnyTekst` | #5E626A | `kolory.jasny.przyciskNieaktywnyTekst` | #5A5048 |  |
| `kolor.jasny.przyciskNiszczacyTlo` | #B3261E | `kolory.jasny.niszczacy` | #A3261C |  |
| `kolor.jasny.przyciskNiszczacyTekst` | #FCFCFA | `kolory.jasny.niszczacyTekst` | #FFFFFF |  |
| `kolor.ciemny.papier` | #1B1C1F | `kolory.ciemny.tlo` | #26211E | tło ekranu; runo musket zamiast bieli papieru (P-547: żaden ekran płaski biały ani czarny) |
| `kolor.ciemny.papierGrupa` | #24262A | `kolory.ciemny.powierzchnia` | #312B27 | tło grup, wierszy, kafli |
| `kolor.ciemny.grafit` | #ECECE8 | `kolory.ciemny.tekst` | #F1EDE9 | tusz Dzianiny |
| `kolor.ciemny.olowek` | #A9ACB2 | `kolory.ciemny.tekst2` | #C7BCB2 |  |
| `kolor.ciemny.linia` | #34363B | `kolory.ciemny.linia` | #3D3530 |  |
| `kolor.ciemny.zakreslacz` | #38351F | `kolory.ciemny.zakreslacz` | #F6E04A | tylko strona wzoru (stały #F6E04A w obu motywach, bo strona jest w oryginale: ZM-10, P-563 (8a)); w interfejsie zakreślenie instrukcji zastępuje znacznik `akcent` wiersza „co dalej” |
| `kolor.ciemny.tekstNaZakreslaczu` | #F4ECB4 | `kolory.ciemny.tekst` | #F1EDE9 | tekst wiersza „co dalej” na `powierzchnia` (zakreślenie interfejsu zastąpione znacznikiem `akcent`); na stronie wzoru tekst to treść pliku |
| `kolor.ciemny.zakreslaczKrawedz` | #E2CB3A | `kolory.ciemny.akcent` | #CF9636 | znacznik wiersza „co dalej” (`.zn`) i „Za n rzędów:” w `akcentTekst` na liczniku |
| `kolor.ciemny.przyciskTlo` | #2E3136 | `kolory.ciemny.przycisk` | #F0CF8A | wypełniony w obu motywach (P-547) |
| `kolor.ciemny.przyciskTekst` | #ECECE8 | `kolory.ciemny.przyciskTekst` | #221D1A |  |
| `kolor.ciemny.przyciskObrys` | #8C9098 | **usunięte** |  | bo przycisk główny jest wypełniony w obu motywach, bez obrysu (P-547) |
| `kolor.ciemny.drugiPrzyciskObrys` | #8C9098 | `kolory.ciemny.tekst2` | #C7BCB2 | obrys −1 licznika i paska wzoru (`.minus`, `.pasek-wz .m`: 2 pt `tekst2`) |
| `kolor.ciemny.blad` | #F2B8B5 | `kolory.ciemny.tekst` | #F1EDE9 | tekst błędu w kolorze `tekst` z ikoną „!” i `role=alert`; czerwień (`niszczacy`) tylko dla działań nieodwracalnych (jeden kolor = jedno znaczenie, design-spec „Kolory”) |
| `kolor.ciemny.kreska` | #ECECE8 | **usunięte** |  | bo kreski (element firmowy kierunku A) zastąpione dzianiną (P-552): `akcent`, `akcentJasny`, `igla` |
| `kolor.ciemny.arkusz` | #2A2C31 | `kolory.ciemny.powierzchnia` | #312B27 | arkusz formularza jest systemowy (tło arkusza z motywu systemu); treść grup na `powierzchnia` |
| `kolor.ciemny.przyciskNieaktywnyTlo` | #34363B | `kolory.ciemny.przyciskNieaktywny` | #312B27 | z przerywaną ramą `przyciskNieaktywnyRama` i ikoną stanu (jak `oferty-czeka-*`) |
| `kolor.ciemny.przyciskNieaktywnyTekst` | #A9ACB2 | `kolory.ciemny.przyciskNieaktywnyTekst` | #C7BCB2 |  |
| `kolor.ciemny.przyciskNiszczacyTlo` | #F2B8B5 | `kolory.ciemny.niszczacy` | #F2B8B5 |  |
| `kolor.ciemny.przyciskNiszczacyTekst` | #1B1C1F | `kolory.ciemny.niszczacyTekst` | #4A0E0A |  |
| `kolor.jasnyKontrast.olowek` | #44474D | `kolory.jasnyZwiekszony.tekst2` | #3F3731 |  |
| `kolor.jasnyKontrast.linia` | #8F939A | `kolory.jasnyZwiekszony.linia` | #9C9288 |  |
| `kolor.jasnyKontrast.zakreslaczKrawedz` | #26282C | **usunięte** |  | bo znacznik „co dalej” ma kształt i tekst obok; `akcent` bez wariantu zwiększonego (para akcent/karta ≥ 3:1 w obu motywach) |
| `kolor.jasnyKontrast.drugiPrzyciskObrys` | #26282C | `kolory.jasnyZwiekszony.tekst2` | #3F3731 | obrys −1 = `tekst2` wariantu zwiększonego |
| `kolor.jasnyKontrast.przyciskNieaktywnyTlo` | #8F939A | **usunięte** |  | bo tło przycisku nieaktywnego = `powierzchnia`; „Zwiększ kontrast” podnosi tekst i ramę (`przyciskNieaktywnyTekst`, `przyciskNieaktywnyRama`) |
| `kolor.jasnyKontrast.przyciskNieaktywnyTekst` | #44474D | `kolory.jasnyZwiekszony.przyciskNieaktywnyTekst` | #3F3731 |  |
| `kolor.ciemnyKontrast.olowek` | #CDD0D4 | `kolory.ciemnyZwiekszony.tekst2` | #E3DAD2 |  |
| `kolor.ciemnyKontrast.linia` | #7A7E85 | `kolory.ciemnyZwiekszony.linia` | #6A5F57 |  |
| `kolor.ciemnyKontrast.przyciskObrys` | #CDD0D4 | **usunięte** |  | bo przycisk główny bez obrysu (P-547) |
| `kolor.ciemnyKontrast.drugiPrzyciskObrys` | #CDD0D4 | `kolory.ciemnyZwiekszony.tekst2` | #E3DAD2 | obrys −1 = `tekst2` wariantu zwiększonego |
| `kolor.ciemnyKontrast.zakreslaczKrawedz` | #F4ECB4 | **usunięte** |  | bo znacznik „co dalej” ma kształt i tekst obok; `akcent` bez wariantu zwiększonego (para akcent/karta ≥ 3:1 w obu motywach) |
| `kolor.ciemnyKontrast.przyciskNieaktywnyTlo` | #7A7E85 | **usunięte** |  | bo tło przycisku nieaktywnego = `powierzchnia`; „Zwiększ kontrast” podnosi tekst i ramę (`przyciskNieaktywnyTekst`, `przyciskNieaktywnyRama`) |
| `kolor.ciemnyKontrast.przyciskNieaktywnyTekst` | #CDD0D4 | `kolory.ciemnyZwiekszony.przyciskNieaktywnyTekst` | #E3DAD2 |  |
| `kolor._wloczka` | Kolor włóczki projektu (P-063, wariant… | **usunięte** |  | bo kolor włóczki projektu (kropka przy nazwie, opcjonalnie kolor kresek) nie występuje w makietach Dzianiny (`projekty-*`); kresek już nie ma — czy kropka zostaje w p4: otwarte pytanie O-1 w tym pliku |
| `kolor.wzor._opis` | Znacznik rzędu na stronie wzoru (NZ-08… | `wzor._opis` | Strona wzoru w oryginalnych kolorach p… | strona w oryginale w obu motywach |
| `kolor.wzor.strona` | #FFFFFF | `wzor.strona` | #FFFFFF |  |
| `kolor.wzor.znacznik` | #26282C | `wzor.znacznik` | #221D1A | tusz Dzianiny zamiast grafitu |
| `kolor.wzor.znacznikTlo` | #26282C14 | `wzor.znacznikTlo` | #221D1A14 |  |
| `kolor.wzor.etykietaTlo` | #26282C | `wzor.etykietaTlo` | #221D1A |  |
| `kolor.wzor.etykietaTekst` | #FCFCFA | `wzor.etykietaTekst` | #F3F1EC |  |
| `kolor.systemCzarny._opis` | Zegarek, Dynamic Island i Smart Stack … | `kolory.systemCzarny._opis` | Dynamic Island, Smart Stack i zegarek … |  |
| `kolor.systemCzarny.tlo` | #000000 | `kolory.systemCzarny.tlo` | #000000 |  |
| `kolor.systemCzarny.kartaStack` | #1E2024 | `kolory.systemCzarny.kartaStack` | #1E2024 | przybliżenie, pomiar na urządzeniu |
| `kolor.systemCzarny.grafit` | #ECECE8 | `kolory.systemCzarny.tekst` | #F1EDE9 |  |
| `kolor.systemCzarny.olowek` | #A9ACB2 | `kolory.systemCzarny.tekst2` | #C7BCB2 |  |
| `kolor.systemCzarny.przyciskTlo` | #2E3136 | `kolory.systemCzarny.przycisk` | #F0CF8A | wypełniony (miód) jak przycisk motywu ciemnego |
| `kolor.systemCzarny.przyciskTekst` | #ECECE8 | `kolory.systemCzarny.przyciskTekst` | #221D1A |  |
| `kolor.systemCzarny.przyciskObrys` | #8C9098 | **usunięte** |  | bo przycisk wypełniony, bez obrysu (P-547) |
| `kolor.systemCzarny.zakreslacz` | #38351F | `kolory.systemCzarny.akcent` | #CF9636 | znacznik rzędu z przypomnieniem (jak `.zn` „co dalej”) |
| `kolor.systemCzarny.tekstNaZakreslaczu` | #F4ECB4 | `kolory.systemCzarny.tekst` | #F1EDE9 | tekst instrukcji obok znacznika |
| `kolor.systemCzarny.zakreslaczKrawedz` | #E2CB3A | `kolory.systemCzarny.akcentTekst` | #F0CF8A | „Za n rzędów:” w akcencie |
| `typografia._zasada` | Libre Franklin: liczba, tytuły, przyci… | `kroje` | grupa | Bree Serif zamiast Libre Franklin (P-553); treść systemowa bez zmian; skale w `typografia.*.maxSkala` |
| `typografia.liczba.krój` | Libre Franklin | `typografia.liczbaLicznika.kroj` | tytul | „tytul” = Bree Serif |
| `typografia.liczba.grubość` | 700 | **usunięte** |  | bo Bree Serif ma jedną odmianę (400) |
| `typografia.liczba.rozmiar` | 96 | `typografia.liczbaLicznika.pt` | 104 | 104 pt (było 96); na karcie „Dziś” `liczbaKarty` 56 pt |
| `typografia.liczba.interlinia` | 1 | `typografia.liczbaLicznika.interlinia` | 1 |  |
| `typografia.liczba.maxSkala` | 1.3 | `typografia.liczbaLicznika.maxSkala` | 1.3 |  |
| `typografia.liczba.minSkala` | 0.5 | `typografia.liczbaLicznika.minSkala` | 0.5 |  |
| `typografia.liczba.cyfry` | tabelaryczne | `typografia.liczbaLicznika.cyfry` | komorka | „komorka” zamiast cyfr tabelarycznych (Bree bez `tnum`; `typografia.cyfry`, P-563 (2a)) |
| `typografia.liczbaPaska._opis` | Liczba w pasku licznika pod wzorem (de… | `typografia.liczbaPaskaWzoru` | grupa | pasek wzoru −1 / rząd / +1 (`wzor-*`) |
| `typografia.liczbaPaska.rozmiar` | 40 | `typografia.liczbaPaskaWzoru.pt` | 28 | 28 pt (było 40) |
| `typografia.liczbaPaska.interlinia` | 1.2 | `typografia.liczbaPaskaWzoru.interlinia` | 1 |  |
| `typografia.liczbaKolumny._opis` | Liczba w kolumnie licznika obok wzoru … | `typografia.liczbaPaskaWzoru` | grupa | kolumny licznika obok wzoru (W3) nie ma w makietach TO BE; liczba przy wzorze = pasek wzoru; układ iPada obok wzoru — audyt 04 po p3b (P-546) |
| `typografia.liczbaKolumny.rozmiar` | 64 | `typografia.liczbaPaskaWzoru.pt` | 28 | jak wyżej |
| `typografia.liczbaKolumny.interlinia` | 1 | `typografia.liczbaPaskaWzoru.interlinia` | 1 | jak wyżej |
| `typografia.tytul.krój` | Libre Franklin | `typografia.duzyTytul.kroj` | tytul |  |
| `typografia.tytul.grubość` | 700 | **usunięte** |  | bo Bree Serif ma jedną odmianę |
| `typografia.tytul.rozmiar` | 30 | `typografia.duzyTytul.pt` | 34 | 34 pt (było 30) |
| `typografia.tytul.interlinia` | 1.15 | `typografia.duzyTytul.interlinia` | 1.12 |  |
| `typografia.tytul.styl iOS` | largeTitle (skalowany) | `typografia.duzyTytul.styl` | largeTitle | largeTitle |
| `typografia.instrukcja.krój` | Libre Franklin | `typografia.tresc.kroj` | tresc | instrukcja rzędu = wiersz „co dalej”: krój systemowy, słowo czynności pogrubione (`dzis-*`, `licznik-*`) |
| `typografia.instrukcja.grubość` | 700 | `typografia.tresc` | grupa | pogrubione tylko słowo czynności |
| `typografia.instrukcja.rozmiar` | 20 | `typografia.tresc.pt` | 17 | 17 pt (było 20) |
| `typografia.instrukcja.interlinia` | 1.2 | `typografia.tresc.interlinia` | 1.3 |  |
| `typografia.przycisk.krój` | Libre Franklin | `typografia.przyciskPlus.kroj` | tresc | „+1”: krój systemowy 800; pozostałe przyciski: `tresc` 700 |
| `typografia.przycisk.grubość` | 700 | `typografia.przyciskPlus.waga` | 800 |  |
| `typografia.przycisk.rozmiar` | 28 | `typografia.przyciskPlus.pt` | 26 | 26 pt (było 28) |
| `typografia.przycisk.interlinia` | 1.2 | `typografia.tresc.interlinia` | 1.3 |  |
| `typografia.znakWyboru._opis` | Znak ✓ w polu wyboru (`.pole-wyboru`, … | **usunięte** |  | bo pole wyboru z ✓ w kroju tytułowym zastępuje znacznik okrągły z ikoną `ptaszek` (SF `checkmark`), jak plany w `oferty-*`; promień `promienie.plus` |
| `typografia.znakWyboru.krój` | Libre Franklin | **usunięte** |  | bo jak wyżej (ikona, nie znak kroju) |
| `typografia.znakWyboru.grubość` | 700 | **usunięte** |  | bo jak wyżej |
| `typografia.znakWyboru.rozmiar` | 18 | **usunięte** |  | bo jak wyżej; ikona 18 pt w znaczniku 26 pt, przy AX5 28 pt w 40 pt (`oferty-*-ax5`) |
| `typografia.znakWyboru.interlinia` | 1.2 | **usunięte** |  | bo jak wyżej |
| `typografia.znakWyboru.maxSkala` | 1.6 | **usunięte** |  | bo jak wyżej |
| `typografia.tresc.krój` | system | `typografia.tresc.kroj` | tresc |  |
| `typografia.tresc.rozmiar` | 17 | `typografia.tresc.pt` | 17 |  |
| `typografia.tresc.interlinia` | 1.3 | `typografia.tresc.interlinia` | 1.3 |  |
| `typografia.tresc.styl iOS` | body | `typografia.tresc.styl` | body |  |
| `typografia.podpis.krój` | system | `typografia.tresc2.kroj` | tresc |  |
| `typografia.podpis.rozmiar` | 15 | `typografia.tresc2.pt` | 15 |  |
| `typografia.podpis.interlinia` | 1.3 | `typografia.tresc2.interlinia` | 1.3 |  |
| `typografia.podpis.styl iOS` | subheadline | `typografia.tresc2.styl` | subheadline |  |
| `typografia.drobny.krój` | system | `typografia.mala.kroj` | tresc |  |
| `typografia.drobny.rozmiar` | 13 | `typografia.mala.pt` | 13 |  |
| `typografia.drobny.interlinia` | 1.3 | `typografia.mala.interlinia` | 1.3 |  |
| `typografia.drobny.styl iOS` | footnote | `typografia.mala.styl` | footnote |  |
| `odstep._jednostka` | 4 | `odstepy.jednostka` | 4 |  |
| `odstep.xs` | 4 | `odstepy.xs` | 4 |  |
| `odstep.s` | 8 | `odstepy.s` | 8 |  |
| `odstep.m` | 12 | `odstepy.m` | 12 |  |
| `odstep.l` | 16 | `odstepy.l` | 16 |  |
| `odstep.xl` | 20 | `odstepy.xl` | 20 |  |
| `odstep.xxl` | 28 | `odstepy.xxl` | 24 | 24 pt (było 28) |
| `odstep.sekcja` | 32 | `odstepy.xxl` | 24 | odstęp między grupami 24 pt; menu ••• jest systemowe (ZM-05) i dzieli grupy samo |
| `promien._zasada` | Hierarchia: im większy i ważniejszy el… | `promienie._hierarchia` | karta > kafel > przycisk > próbka dnia… |  |
| `promien.przyciskGlowny` | 20 | `promienie.plusLicznik` | 26 | wielki „+1” licznika 26 pt (było 20) |
| `promien.przyciskPelny` | 14 | `promienie.przycisk` | 14 |  |
| `promien.przyciskDrugi` | 14 | `promienie.przycisk` | 14 |  |
| `promien.grupa` | 12 | `promienie.lista` | 16 | lista grupowana 16 pt (było 12) |
| `promien.pole` | 10 | `promienie.pole` | 10 |  |
| `promien.poleWyboru` | 8 | `promienie.plus` | 50% | znacznik wyboru okrągły (połowa boku) |
| `promien.zakreslacz` | 2 | `wzor.zakreslaczPromien` | 2 |  |
| `cel.minimum` | 44 | `cele.minimum` | 44 |  |
| `cel.przyciskMinus` | 72 | `cele.minus` | 72 |  |
| `cel.przyciskPlusWysokosc` | 168 | `cele.plusLicznik` | 168 |  |
| `cel.odstepMinusPlus` | 28 | `cele.odstepMinusPlus` | 12 | 12 pt (było 28); przy AX5 −1 pod +1 na pełną szerokość |
| `cel.przyciskMinusPaska` | 56 | `cele.paskaWzoru.minSzerokosc` | 64 | −1 paska wzoru 64 × 52 pt (było 56) |
| `cel.przyciskPlusPaskaWysokosc` | 72 | `cele.paskaWzoru.wysokosc` | 52 | 52 pt (było 72) |
| `cel.przyciskPlusPaskaSzerokosc` | 132 | `cele.paskaWzoru` | grupa | +1 paska wzoru zajmuje resztę szerokości (było 132 pt) |
| `cel.poleWyboru` | 28 | `cele.minimum` | 44 | celem jest cały wiersz wyboru ≥ 44 pt |
| `miniatura._zasada` | Miniatura pierwszej strony wzoru w wie… | `miniatura.stronaWzoru._gdzie` | pierwsza strona wzoru w wierszu (przen… |  |
| `miniatura.szerokosc` | 44 | `miniatura.stronaWzoru.szerokosc` | 44 |  |
| `miniatura.proporcja` | 1.3 | `miniatura.stronaWzoru.proporcja` | 1.3 |  |
| `miniatura.promien` | 0 | `miniatura.stronaWzoru.promien` | 0 |  |
| `ruch._zasada` | Ruch tylko w odpowiedzi na działanie; … | `ruch.ograniczRuch` | bez przesunięć; zmiana stanu natychmia… |  |
| `ruch.kreska.czas` | 120 | `ruch.rzadOczek` | 180 | nowy rząd oczek 180 ms (kreska 120 ms) |
| `ruch.kreska.krzywa` | easeOut | `ruch.krzywa` | easeOut |  |
| `ruch.piataKreska.czas` | 160 | **usunięte** |  | bo bez kresek nie ma piątej kreski (P-552) |
| `ruch.piataKreska.krzywa` | easeOut | **usunięte** |  | bo jak wyżej |
| `ruch.zakreslenie.czas` | 200 | **usunięte** |  | bo zakreślenie instrukcji w interfejsie zastąpione znacznikiem „co dalej” bez animacji (ruch tylko przy +1 i zmianie ekranu) |
| `ruch.zakreslenie.krzywa` | easeOut | **usunięte** |  | bo jak wyżej |
| `ruch.cofniecie.czas` | 120 | `ruch.rzadOczek` | 180 | cofnięcie = ten sam ruch w drugą stronę |
| `ruch.cofniecie.krzywa` | easeIn | `ruch.krzywa` | easeOut |  |
| `haptyka._zasada` | F-48: tylko dwa wzorce do rozpoznania … | `haptyka` | grupa | F-48: rząd i przypomnienie rozróżnialne |
| `haptyka.plus` | UIImpactFeedbackGenerator .light | `haptyka.rzad` | impactLight |  |
| `haptyka.piataKreska` | UIImpactFeedbackGenerator .medium | **usunięte** |  | bo bez kresek nie ma piątej kreski (P-552) |
| `haptyka.rzadZInstrukcja` | dwa uderzenia .medium co 90 ms (Core H… | `haptyka.przypomnienie` | notificationWarning | notificationWarning zamiast dwóch .medium (zatwierdzone P-554) |
| `haptyka.minus` | UIImpactFeedbackGenerator .soft | `haptyka.cofniecie` | impactSoft |  |
| `haptyka.blokadaStukniecie` | UIImpactFeedbackGenerator .rigid | `haptyka.blokada` | selection | selection zamiast .rigid (P-554) |
| `haptyka.bladZapisu` | UINotificationFeedbackGenerator .error | `haptyka.bladZapisu` | notificationError |  |
| `haptyka.stoperStart` | UIImpactFeedbackGenerator .light | `haptyka.stoperStart` | impactLight |  |
| `haptykaZegarek._zasada` | Zegarek (NZ-05-F4-04, P-142): watchOS … | `haptykaZegarek._opis` | watchOS nie ma generatorów UIKit; wzor… |  |
| `haptykaZegarek.bladZapisu` | WKHapticType.retry — „Tells the person… | `haptykaZegarek.bladZapisu` | retry | WKHapticType.retry |
| `haptykaZegarek.blokadaStukniecie` | WKHapticType.failure — „Tells the pers… | `haptykaZegarek.blokada` | failure | WKHapticType.failure |
| `haptykaZegarek.przypomnienie` | WKHapticType.notification — „Tells the… | `haptykaZegarek.przypomnienie` | notification | WKHapticType.notification |
| `znakKresek._opis` | Znak kresek (NZ-08-P4-04, P-158 2a): c… | `znakKresek._opis` | Znak kresek z ikony (NZ-08-P4-04, P-15… |  |
| `znakKresek.plik` | ikona/znak-kresek.svg | `znakKresek.plik` | ikona/znak-kresek.svg |  |
| `znakKresek.viewBox` | 204 224 618 570 | `znakKresek.viewBox` | 204 224 618 570 |  |
| `znakKresek.proporcja` | 1.084 | `znakKresek.proporcja` | 1.084 |  |
| `znakKresek.gruboscKreskiWJednostkach` | 64 | `znakKresek.gruboscKreskiWJednostkach` | 64 |  |
| `znakKresek.wyspa._gdzie` | Dynamic Island compact (z lewej) i roz… | `znakKresek.wyspa._gdzie` | Dynamic Island compact i rozwinięta |  |
| `znakKresek.wyspa.wysokosc` | 18 | `znakKresek.wyspa.wysokosc` | 18 |  |
| `znakKresek.wyspa.szerokosc` | 19.5 | `znakKresek.wyspa.szerokosc` | 19.5 |  |
| `znakKresek.wyspa.kreska` | 2 | `znakKresek.wyspa.kreska` | 2 |  |
| `znakKresek.wyspa.maxSkala` | 1.2 | `znakKresek.wyspa.maxSkala` | 1.2 |  |
| `znakKresek.smartStack._gdzie` | Smart Stack zegarka i CarPlay (przy na… | `znakKresek.smartStack._gdzie` | Smart Stack zegarka i CarPlay |  |
| `znakKresek.smartStack.wysokosc` | 13 | `znakKresek.smartStack.wysokosc` | 13 |  |
| `znakKresek.smartStack.szerokosc` | 14 | `znakKresek.smartStack.szerokosc` | 14 |  |
| `znakKresek.smartStack.kreska` | 1.5 | `znakKresek.smartStack.kreska` | 1.5 |  |
| `znakKresek.smartStack.maxSkala` | 1.15 | `znakKresek.smartStack.maxSkala` | 1.15 |  |
| `znakKresek.kolorSystemCzarny` | #ECECE8 | `znakKresek.kolorSystemCzarny` | systemCzarny.tekst | = `kolory.systemCzarny.tekst` |
| `znakKresek.kolorJasny` | #26282C | `znakKresek.kolorJasny` | jasny.tekst | = `kolory.jasny.tekst` |
| `znakKresek.kolorCiemny` | #ECECE8 | `znakKresek.kolorCiemny` | ciemny.tekst | = `kolory.ciemny.tekst` |
| `znakKresek._kolor` | kolorSystemCzarny = kolor.systemCzarny… | `znakKresek.kolorSystemCzarny` | systemCzarny.tekst | kolory jako odwołania do tokenów Dzianiny |
