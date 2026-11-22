# Reguły dziedzinowe i obliczeniowe (RD)
Stan: STOP E2 · Aktualizacja: 2026-10-21 · Hierarchia: P-017 · Wektory policzone skryptem (Python), nie przepisane z przewodników: przykład w S-25 ma błąd rachunkowy (soczewka ekspercka, `oczko-warsztat/01-odkrywanie/soczewki/ekspert.md`).

Zasady wspólne reguł:
- Wynik obliczenia pokazuje dane wejściowe i założenia; tabele CYC to „GUIDELINES ONLY” [FAKT S-19], więc aplikacja nie przedstawia ich jako normy.
- Zaokrąglanie liczby oczek do całości (w górę, w dół, do krotności motywu, do parzystości) nie jest rozstrzygnięte: [DO USTALENIA] (OP-02). Reguły RD-01, RD-02 i RD-07 zwracają wartość niezaokrągloną.
- Reguły krytyczne (błąd = zmarnowana włóczka albo pieniądze) idą do przeglądu roli 06; przegląd zastępczy (D-027).
- Arytmetyka (ER-38): wejścia to liczby dziesiętne, a wynik zaokrąglany (⌊ ⌋, ⌈ ⌉, do całości) jest taki, jak przy rachunku dokładnym: iloraz, który na papierze jest całością, daje tę całość (100 × 29 / 100 = 29; 50 × 1,1 / 55 = 1). Wektory z dopiskiem „pułapka zmiennoprzecinkowa” wykrywają rachunek na liczbach binarnych bez korekty.
- Tolerancja (ER-38): bezwzględna, w jednostce wyniku, dotyczy wyników niecałkowitych. Wynik całkowity (liczba po zaokrągleniu, q, r, motki, p, g, d, dni, powtórzenie, rząd) i wynik nieliczbowy porównuje się dokładnie, także gdy w wierszu stoi tolerancja innego wyniku; `—` oznacza porównanie dokładne.
- Zapis w tabelach wektorów (ER-39, P-097): `{a, b}` to zbiór (kolejność bez znaczenia), `a; b` to lista w kolejności, `tak`/`nie` to wartość logiczna, `—` to brak wartości; pozostałe słowa (`błąd danych`, `brak`, `poza tabelą`, `między kategoriami`) to wynik nazwany. Generator `docs/brd/narzedzia/kontrola-brd.mjs` zamienia je na typy JSON według `docs/brd/wektory.schema.json` i sprawdza, że zapis md → json → md nie traci informacji (`--zgodnosc=tests/wektory/brd.json`).

### RD-01: Liczba oczek na szerokość z próbki
- Wzór: `N = W × P / 10`
- Jednostki: N [o.], W [cm], P [o./10 cm]
- Granica: W > 0 i P > 0 (ostre); wartości ≤ 0 albo brak to błąd danych
- Podstawa: rachunek; próbka na 10 cm jako standard branżowy S-25; zakres typowych próbek S-19
- Krytyczna: tak
- Uproszczenie: próbka jednolita w całej dzianinie; próbka różni się przed i po blokowaniu (RD-08).

| ID | W [cm] | P [o./10 cm] | Oczekiwane: N [o.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|
| RD-01-W1 | 50 | 22 | 110 | 0,001 | typowy | rachunek: 50 × 22 / 10 |
| RD-01-W2 | 0 | 22 | błąd danych | — | granica | rachunek: W = 0 poza W > 0 |
| RD-01-W3 | -1 | 22 | błąd danych | — | poniżej | rachunek |
| RD-01-W4 | 0,1 | 22 | 0,22 | 0,001 | powyżej | rachunek: 0,1 × 22 / 10 |
| RD-01-W5 | 50 | brak | błąd danych | — | błąd | rachunek: brak próbki |

### RD-02: Przeliczenie liczby oczek wzoru na własną próbkę
- Wzór: `N' = N × P_u / P_w`
- Jednostki: N, N' [o.]; P_u, P_w [o./10 cm]
- Granica: P_u > 0 i P_w > 0 (ostre); N ≥ 0
- Podstawa: rachunek; S-25
- Krytyczna: tak
- Uproszczenie: tylko wymiary liniowe; krotność motywu nie jest zachowana (OP-02).

| ID | N [o.] | P_w [o./10 cm] | P_u [o./10 cm] | Oczekiwane: N' [o.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|
| RD-02-W1 | 100 | 20 | 22 | 110 | 0,001 | typowy | rachunek: 100 × 22 / 20 |
| RD-02-W2 | 100 | 20 | 18 | 90 | 0,001 | typowy | rachunek |
| RD-02-W3 | 100 | 20 | 0 | błąd danych | — | granica | rachunek: P_u = 0 poza P_u > 0 |
| RD-02-W4 | 100 | 20 | -2 | błąd danych | — | poniżej | rachunek |
| RD-02-W5 | 100 | 20 | 0,1 | 0,5 | 0,001 | powyżej | rachunek: 100 × 0,1 / 20 |
| RD-02-W6 | 100 | 0 | 22 | błąd danych | — | błąd | rachunek: dzielenie przez zero |

### RD-03: Przeliczenia jednostek długości i masy
- Wzór: `cm = in × 2,54`; `m = yd × 0,9144`; `g = oz × 28,349 523 125` (ER-33)
- Jednostki: wejście i wyjście jak we wzorze
- Granica: wartość ≥ 0 (włączna)
- Podstawa: S-27 (2,54 i 0,9144 dokładne); S-41 (uncja 28,349 523 125 g = funt 453,592 37 g / 16, dokładnie; S-27 podaje tę wartość zaokrągloną do 7 cyfr: 28,34952; ER-33, rejestr roli 06 JED-005)
- Krytyczna: tak

| ID | Przelicznik [-] | Wartość [jedn. wejścia] | Oczekiwane: wynik [jedn. wyjścia] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|
| RD-03-W1 | yd→m | 437 | 399,5928 | 0,0001 | typowy | S-27: 437 × 0,9144 |
| RD-03-W2 | in→cm | 4 | 10,16 | 0,0001 | typowy | S-27: 4 × 2,54 |
| RD-03-W3 | oz→g | 3,5 | 99,22333 | 0,0001 | typowy | S-41: 3,5 × 28,349 523 125 = 99,223 330 937 5 (ER-33) |
| RD-03-W4 | yd→m | 0 | 0 | 0 | granica | rachunek |
| RD-03-W5 | in→cm | -1 | błąd danych | — | poniżej | rachunek |
| RD-03-W6 | in→cm | 0,01 | 0,0254 | 0,0001 | powyżej | S-27 |
| RD-03-W7 | oz→g | brak | błąd danych | — | błąd | rachunek |

### RD-04: Próbka podana na 4 cale przeliczona na 10 cm
- Wzór: `P10 = P4 × 10 / 10,16`
- Jednostki: P10 [o./10 cm], P4 [o./4 in]
- Granica: P4 > 0 (ostre)
- Podstawa: rachunek z S-27 (4 in = 10,16 cm dokładnie); S-25 i S-19 zrównują „4"/10 cm”, czyli przybliżają z błędem 1,6%
- Krytyczna: tak
- Uproszczenie: brak; reguła usuwa uproszczenie źródeł. Aplikacja liczy dokładnie (10,16 cm) i dopisuje, że wzory często zrównują 4 in z 10 cm (P-081 P3a, OP-03 zamknięte; ER-35).

| ID | P4 [o./4 in] | Oczekiwane: P10 [o./10 cm] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|
| RD-04-W1 | 20 | 19,685 | 0,001 | typowy | rachunek: 20 × 10 / 10,16 |
| RD-04-W2 | 22 | 21,654 | 0,001 | typowy | rachunek |
| RD-04-W3 | 0 | błąd danych | — | granica | rachunek |
| RD-04-W4 | -5 | błąd danych | — | poniżej | rachunek |
| RD-04-W5 | 0,1 | 0,098 | 0,001 | powyżej | rachunek |
| RD-04-W6 | brak | błąd danych | — | błąd | rachunek |

### RD-05: Równomierne dodawanie k oczek na N oczkach (okrążenie)
- Wzór: `q = ⌊N / k⌋`, `r = N mod k`; r odcinków po q+1 oczek i k−r odcinków po q oczek, po każdym odcinku jeden przyrost
- Jednostki: N, k, q [o.]; r [-] (liczba dłuższych odcinków)
- Granica: 1 ≤ k ≤ N (włączne)
- Podstawa: rachunek (dzielenie z resztą). Rząd płaski (k+1 odcinków) nie jest objęty: konwencja bez źródła, [DO USTALENIA] (OP-04)
- Krytyczna: nie

| ID | N [o.] | k [o.] | Oczekiwane: q [o.] | Oczekiwane: r [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|
| RD-05-W1 | 100 | 8 | 12 | 4 | 0 | typowy | rachunek: 4×13 + 4×12 = 100 |
| RD-05-W2 | 96 | 12 | 8 | 0 | 0 | typowy | rachunek |
| RD-05-W3 | 100 | 100 | 1 | 0 | 0 | granica | rachunek: k = N |
| RD-05-W4 | 100 | 101 | błąd danych | błąd danych | — | powyżej | rachunek: k > N |
| RD-05-W5 | 100 | 0 | błąd danych | błąd danych | — | poniżej | rachunek: k < 1 |
| RD-05-W6 | brak | 8 | błąd danych | błąd danych | — | błąd | rachunek |

### RD-06: Równomierne ujmowanie k oczek na N oczkach (okrążenie)
- Wzór: jak RD-05; każdy odcinek kończy się przerobieniem 2 oczek razem
- Jednostki: N, k, q [o.]; r [-]
- Granica: 1 ≤ k ≤ N/2 (włączne), bo odcinek musi mieć co najmniej 2 oczka
- Podstawa: rachunek
- Krytyczna: nie

| ID | N [o.] | k [o.] | Oczekiwane: q [o.] | Oczekiwane: r [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|
| RD-06-W1 | 100 | 8 | 12 | 4 | 0 | typowy | rachunek: wynik 92 o. |
| RD-06-W2 | 100 | 50 | 2 | 0 | 0 | granica | rachunek: k = N/2, wynik 50 o. |
| RD-06-W3 | 100 | 51 | błąd danych | błąd danych | — | powyżej | rachunek |
| RD-06-W4 | 100 | 0 | błąd danych | błąd danych | — | poniżej | rachunek |
| RD-06-W5 | 0 | 1 | błąd danych | błąd danych | — | błąd | rachunek: brak oczek |

### RD-07: Zużycie włóczki z wagi próbki
- Wzór: `M = m_p × A / A_p`; `motki = ⌈M × (1 + z) / m_m⌉`
- Jednostki: M, m_p, m_m [g]; A, A_p [cm²]; z [-] (zapas wybrany przez użytkownika); motki [-]
- Granica: A_p > 0, m_p > 0, A > 0, m_m > 0 (ostre), z ≥ 0; zaokrąglenie motków w górę ma próg przy całkowitym ilorazie
- Podstawa: rachunek; pomiar próbki według S-25; zmiana wymiarów po praniu S-26
- Krytyczna: tak
- Uproszczenie: stała gęstość dzianiny w całym projekcie (ściągacze, warkocze i szwy łamią to założenie). Domyślnego zapasu z nie podaje żadne przeczytane źródło szczebla 1–3: [DO USTALENIA] (OP-05).

| ID | m_p [g] | A_p [cm²] | A [cm²] | z [-] | m_m [g] | Oczekiwane: M [g] | Oczekiwane: motki [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|---|---|
| RD-07-W1 | 6 | 225 | 6000 | 0,1 | 50 | 160 | 4 | 0,001 | typowy | rachunek: 176 / 50 = 3,52 |
| RD-07-W2 | 5,625 | 225 | 6000 | 0 | 50 | 150 | 3 | 0,001 | granica | rachunek: 150 / 50 = 3 |
| RD-07-W3 | 5,62875 | 225 | 6000 | 0 | 50 | 150,1 | 4 | 0,001 | powyżej | rachunek |
| RD-07-W4 | 5,62125 | 225 | 6000 | 0 | 50 | 149,9 | 3 | 0,001 | poniżej | rachunek |
| RD-07-W5 | 6 | 0 | 6000 | 0,1 | 50 | błąd danych | błąd danych | — | błąd | rachunek: A_p = 0 |
| RD-07-W6 | 5 | 100 | 1000 | 0,1 | 55 | 50 | 1 | 0,001 | granica | rachunek: 50 × 1,1 / 55 = 1 dokładnie; pułapka zmiennoprzecinkowa: 50 × 1,1 = 55,000…01 daje 2 motki (ER-38) |

### RD-08: Długość na drutach przy zmianie po blokowaniu
- Wzór: `rzędy = R_po × L / 10`; `L_druty = rzędy × 10 / R_przed`
- Jednostki: R_po, R_przed [rz./10 cm]; L, L_druty [cm]; rzędy [rz.]
- Granica: R_po > 0, R_przed > 0, L > 0 (ostre)
- Podstawa: rachunek na próbce użytkownika; S-25 (pomiar), S-26 (dzianina może urosnąć po praniu)
- Krytyczna: tak

| ID | R_przed [rz./10 cm] | R_po [rz./10 cm] | L [cm] | Oczekiwane: rzędy [rz.] | Oczekiwane: L_druty [cm] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|
| RD-08-W1 | 24 | 22 | 35 | 77 | 32,083 | 0,001 | typowy | rachunek: 22 × 35 / 10; 77 × 10 / 24 |
| RD-08-W2 | 22 | 22 | 35 | 77 | 35 | 0,001 | granica | rachunek: brak zmiany |
| RD-08-W3 | 24 | 0 | 35 | błąd danych | błąd danych | — | poniżej | rachunek |
| RD-08-W4 | 24 | 0,1 | 35 | 0,35 | 0,146 | 0,001 | powyżej | rachunek |
| RD-08-W5 | brak | 22 | 35 | błąd danych | błąd danych | — | błąd | rachunek |

### RD-09: Kategoria dopasowania z luzu w obwodzie klatki
- Wzór: `luz = obwód gotowy − obwód ciała`; kategorie S-23: bardzo dopasowany −10…−5 cm, dopasowany 0, klasyczny +5…+10, luźny +10…+15, oversize ≥ +15; wynik to rodzaj (`kategorie`, `między kategoriami`, `poza tabelą`) i zbiór kategorii: przy stykających się granicach zbiór ma dwie kategorie, a luz między przedziałami daje „między kategoriami” ze zbiorem dwóch sąsiednich kategorii (ER-39)
- Jednostki: luz [cm]
- Granica: −10 cm (włączna, dół tabeli); poniżej to „poza tabelą”
- Podstawa: S-23 („Approximately”, więc przybliżenie)
- Krytyczna: nie (opis, nie obliczenie oczek)

| ID | luz [cm] | Oczekiwane: wynik [-] | Oczekiwane: kategorie [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|
| RD-09-W1 | 7,5 | kategorie | {klasyczny} | — | typowy | S-23 |
| RD-09-W2 | -10 | kategorie | {bardzo dopasowany} | — | granica | S-23 |
| RD-09-W3 | -11 | poza tabelą | — | — | poniżej | S-23 |
| RD-09-W4 | 10 | kategorie | {klasyczny, luźny} | — | powyżej | S-23: styk przedziałów |
| RD-09-W5 | 2 | między kategoriami | {dopasowany, klasyczny} | — | typowy | S-23: luka 0…5 |
| RD-09-W6 | brak | błąd danych | — | — | błąd | rachunek |

### RD-10: Kategoria grubości włóczki z próbki dżersejowej
- Wzór: próbkę P na 4 in (wpisaną albo przeliczoną z 10 cm dokładnie: `P = P10 × 10,16 / 10`, RD-04, P-081 P3a) zaokrągla się do najbliższej całości n (P-084), a wynik to kategorie c ∈ {0…7}, których zakres S-19 (na 4 in, włączny) zawiera n: 0: 33–40, 1: 27–32, 2: 23–26, 3: 21–24, 4: 16–20, 5: 12–15, 6: 7–11, 7: ≤ 6 („6 sts and fewer”, także n = 0). Dokładna połówka (P = n + 0,5): część wspólna zbiorów dla n i n + 1; gdy jest pusta, wynik „między kategoriami” ze zbiorem obu sąsiednich kategorii, a gdy n + 1 > 40, „poza tabelą”. n > 40 daje „poza tabelą”. Obok wyniku aplikacja pokazuje wartość dokładną (P-084)
- Jednostki: P, P10 [o./4 in, o./10 cm]; n [o./4 in]; kategorie [-]
- Granica: zakresy włączne; P ≤ 0 to błąd danych. Liczby całkowite 0–40 nie mają luk w tabeli; luki 6–7, 11–12, 15–16, 20–21, 26–27 i 32–33 dotyczą tylko wartości niecałkowitych i rozstrzyga je zaokrąglenie (ER-31, ER-34)
- Podstawa: S-19 (zakresy); zaokrąglenie i połówki: decyzja P-084 (źródło szczebla 3 w rejestrze roli 06, PRB-004); wektory zgodne z `docs/tresci/wektory.json` (`KL4-*`, 88 z 88 tym samym rachunkiem, `oczko-warsztat/01-odkrywanie/fix-2026-10-25-er34-44/rd10.py`); zbiór nie oznacza zamienności włóczek S-20
- Krytyczna: tak (wybór włóczki do zakupu)

| ID | P [o./4 in] | Oczekiwane: wynik [-] | Oczekiwane: kategorie [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|
| RD-10-W1 | 18 | kategorie | {4} | — | typowy | S-19 |
| RD-10-W2 | 23 | kategorie | {2, 3} | — | granica | S-19: nakładanie 23–24 (KL4-23) |
| RD-10-W3 | 26 | kategorie | {2} | — | granica | S-19 (KL4-26) |
| RD-10-W4 | 41 | poza tabelą | — | — | powyżej | S-19 (KL4-41) |
| RD-10-W5 | 6 | kategorie | {7} | — | poniżej | S-19: „6 sts and fewer” (KL4-6) |
| RD-10-W6 | 0 | błąd danych | — | — | błąd | rachunek: P ≤ 0 (KL4-0) |
| RD-10-W7 | 25,5 | kategorie | {2} | — | typowy | S-19 i P-084: 25 → {2}, 26 → {2} (KL4-25_5; ER-31, ER-34) |
| RD-10-W8 | 20,5 | między kategoriami | {3, 4} | — | granica | S-19 i P-084: 20 → {4}, 21 → {3}, część wspólna pusta (KL4-20_5) |
| RD-10-W9 | 20,4 | kategorie | {4} | — | poniżej | S-19 i P-084: n = 20 (KL4-20_4) |
| RD-10-W10 | 20,6 | kategorie | {3} | — | powyżej | S-19 i P-084: n = 21 (KL4-20_6) |
| RD-10-W11 | 23,5 | kategorie | {2, 3} | — | granica | S-19 i P-084: 23 → {2, 3}, 24 → {2, 3} (KL4-23_5) |
| RD-10-W12 | 6,5 | między kategoriami | {6, 7} | — | granica | S-19 i P-084: 6 → {7}, 7 → {6} (KL4-6_5) |
| RD-10-W13 | 40,5 | poza tabelą | — | — | powyżej | S-19 i P-084: 41 poza tabelą (KL4-40_5) |
| RD-10-W14 | 0,3 | kategorie | {7} | — | typowy | S-19 i P-084: n = 0, „6 sts and fewer” (KL4-0_3) |

### RD-11: Rozmiar drutu w mm na numer US
- Wzór: wyszukanie w tabeli S-18; klucz główny to mm, porównany po zaokrągleniu rozmiaru do 0,001 mm (najmniejszy krok tabeli: 3,125 mm; zapis liczby binarnej w bazie nie zmienia wyniku, ER-38); brak odpowiednika daje „brak”, nie najbliższą wartość
- Jednostki: d [mm], numer US [-]
- Granica: brak
- Podstawa: S-18
- Krytyczna: nie

| ID | d [mm] | Oczekiwane: US [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|
| RD-11-W1 | 4 | 6 | — | typowy | S-18 |
| RD-11-W2 | 3,25 | 3 | — | typowy | S-18 |
| RD-11-W3 | 3 | brak | — | typowy | S-18: brak odpowiednika |
| RD-11-W4 | -1 | błąd danych | — | błąd | rachunek |
| RD-11-W5 | 3,2500000001 | 3 | — | typowy | S-18 i rachunek: 3,250 po zaokrągleniu do 0,001 mm (pułapka: zapis REAL, ER-38) |
| RD-11-W6 | 3,1254 | 3 | — | typowy | S-18 i rachunek: 3,125 po zaokrągleniu do 0,001 mm |
| RD-11-W7 | 3,126 | brak | — | typowy | S-18 i rachunek: 3,126 nie ma w tabeli, bez najbliższej wartości |

### RD-12: Numer powtórzenia i rząd w powtórzeniu
- Wzór: `powtórzenie = ⌊(r − 1) / n⌋ + 1`; `rząd_w = ((r − 1) mod n) + 1` dla r ≥ 1; dla r = 0 powtórzenie 1 i rząd_w 0 („0 z n”: jeszcze nic, P-097 (3.1a)). r to liczba pokazana na liczniku (BR-LIC-012): w trybie „skończone rzędy” r = skończone, w trybie „rząd w trakcie” r = skończone + 1 (ER-40). RD-13 (przypomnienie) liczy się z rzędu w robocie skończone + 1, nie z r (P-161)
- Jednostki: r, n, rząd_w, skończone [rz.]; powtórzenie [-]
- Granica: r ≥ 0, n ≥ 1 (włączne); r < 0 to błąd danych
- Podstawa: rachunek; potrzeba J-02
- Krytyczna: nie

| ID | r [rz.] | n [rz.] | Oczekiwane: powtórzenie [-] | Oczekiwane: rząd_w [rz.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|
| RD-12-W1 | 17 | 8 | 3 | 1 | 0 | typowy | rachunek |
| RD-12-W2 | 8 | 8 | 1 | 8 | 0 | granica | rachunek: koniec powtórzenia |
| RD-12-W3 | 9 | 8 | 2 | 1 | 0 | powyżej | rachunek |
| RD-12-W4 | 0 | 8 | 1 | 0 | 0 | granica | rachunek: r = 0, „0 z 8” przed pierwszym rzędem (P-097 (3.1a), ER-40) |
| RD-12-W6 | -1 | 8 | błąd danych | błąd danych | — | poniżej | rachunek: r < 0 |
| RD-12-W5 | 5 | 0 | błąd danych | błąd danych | — | błąd | rachunek: n < 1 |

Tryb licznika (BR-LIC-012, ER-40):

| ID | skończone [rz.] | tryb [-] | n [rz.] | Oczekiwane: powtórzenie [-] | Oczekiwane: rząd_w [rz.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|
| RD-12-W7 | 12 | rząd w trakcie | 8 | 2 | 5 | 0 | typowy | rachunek: r = 12 + 1 = 13 |
| RD-12-W8 | 0 | rząd w trakcie | 8 | 1 | 1 | 0 | granica | rachunek: r = 0 + 1 = 1 |
| RD-12-W9 | 12 | skończone rzędy | 8 | 2 | 4 | 0 | typowy | rachunek: r = 12 |

### RD-13: Przypomnienie „co N rzędów, M razy, od rzędu s”
- Wzór: rząd r wyzwala przypomnienie, gdy `r ≥ s`, `(r − s) mod N = 0` i `(r − s) / N < M`; numer przypomnienia `k = (r − s) / N + 1` z M. **r to rząd w robocie** `w = skończone + 1`, niezależnie od trybu licznika (BR-LIC-012) — instrukcję rzędu stosuje się w trakcie tego rzędu, więc musi być widoczna przed jego rozpoczęciem (S-22, S-43; P-161, ER-51); to nie jest r z RD-12. **Pas (stan):** przypomnienie dla rzędu w widać od skończenia rzędu w − 1 do skończenia rzędu w, w obu trybach (w trybie „skończone rzędy” przy liczniku w − 1, w trybie „rząd w trakcie” przy liczniku w); liczy się zawsze ze stanu, także po otwarciu aplikacji, po scaleniu zdarzeń z zegarka, po zapisaniu instrukcji na bieżący rząd i przy pierwszym rzędzie przed pierwszym +1 (P-161 Q3). **Sygnał (wibracja, ogłoszenie VoiceOver; BR-LIC-009)** tylko przy zmianie skończonych z a na b: przy b = a + 1 — gdy rząd w robocie b + 1 wyzwala; przy wpisaniu b > a + 1 (BR-LIC-017) — raz, dla największego rzędu wyzwalającego w (a + 1, b + 1]; przy spadku (b < a, także cofnięcie −1) — bez sygnału, a pas wraca, jeśli rząd w robocie b + 1 wyzwala (P-161 Q2a); zdarzenia scalone z zegarka nie wywołują na telefonie sygnału, który zegarek już dał (BR-LIC-015; P-097 (3.2a), ER-40)
- Jednostki: r, w, s, N, skończone, a, b, liczba na liczniku, rząd pasa, rząd sygnału [rz.]; M, k, tryb [-]
- Granica: ostatnie wyzwolenie w rzędzie `s + (M − 1) × N` (włączne); pierwszy rząd w = 1 przy skończone = 0; skończone < 0 to błąd danych
- Podstawa: rachunek; S-22 (szczebel 1: instrukcja „Row 1” opisuje pracę w trakcie rzędu 1) i S-43 (szczebel 2: wskazanie nad rzędem w robocie, przesuwane po skończeniu rzędu) — chwila przypomnienia (P-161); potrzeba J-03. Odczyt instrukcji wzoru („co 6 rzędów” liczone od rzędu 6 czy od 1) zależy od wzoru: aplikacja pyta o s, nie zgaduje (OP-06)
- Krytyczna: nie

Predykat na numerze rzędu (r = rząd w robocie; P-161 Q1a):

| ID | r [rz.] | s [rz.] | N [rz.] | M [-] | Oczekiwane: przypomnienie [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|
| RD-13-W1 | 12 | 6 | 6 | 5 | tak | — | typowy | rachunek |
| RD-13-W2 | 30 | 6 | 6 | 5 | tak | — | granica | rachunek: 6 + 4 × 6 |
| RD-13-W3 | 36 | 6 | 6 | 5 | nie | — | powyżej | rachunek: szóste wyzwolenie |
| RD-13-W4 | 5 | 6 | 6 | 5 | nie | — | poniżej | rachunek: przed s |
| RD-13-W5 | 12 | 6 | 0 | 5 | błąd danych | — | błąd | rachunek: N < 1 |

Zmiana z a na b, wartości jako rząd w robocie (a, b = skończone + 1; funkcja wewnętrzna; ER-40, P-161 Q1a):

| ID | a [rz.] | b [rz.] | s [rz.] | N [rz.] | M [-] | Oczekiwane: przypomnienie [-] | Oczekiwane: rząd przypomnienia [rz.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|---|---|
| RD-13-W6 | 10 | 20 | 6 | 6 | 5 | tak | 18 | 0 | typowy | rachunek: wpisanie, przeskok przez 12 i 18; jedno przypomnienie dla 18 (P-097 (3.2a)) |
| RD-13-W7 | 11 | 12 | 6 | 6 | 5 | tak | 12 | 0 | typowy | rachunek: zwykłe +1 |
| RD-13-W8 | 20 | 10 | 6 | 6 | 5 | nie | — | — | poniżej | rachunek: spadek przy wpisaniu, bez przypomnienia |
| RD-13-W9 | 25 | 30 | 6 | 6 | 5 | tak | 30 | 0 | granica | rachunek: wpisanie do ostatniego wyzwolenia 6 + 4 × 6 |
| RD-13-W10 | 31 | 40 | 6 | 6 | 5 | nie | — | — | powyżej | rachunek: przeskok po końcu serii (36 to szóste wyzwolenie) |

Chwila przypomnienia — wejście ze skończonych rzędów i trybu (funkcja wejścia liczy w = skończone + 1; P-161):

| ID | skończone [rz.] | tryb [-] | s [rz.] | N [rz.] | M [-] | Oczekiwane: liczba na liczniku [rz.] | Oczekiwane: rząd pasa [rz.] | Oczekiwane: k [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RD-13-W11 | 47 | skończone rzędy | 6 | 6 | 10 | 47 | 48 | 8 | 0 | typowy | S-22, S-43 i rachunek: w = 47 + 1 = 48, (48 − 6) / 6 = 7 < 10, k = 8 (makieta 04 fix-4) |
| RD-13-W12 | 47 | rząd w trakcie | 6 | 6 | 10 | 48 | 48 | 8 | 0 | typowy | rachunek: licznik 47 + 1 = 48, rząd w robocie ten sam co W11 |
| RD-13-W13 | 48 | skończone rzędy | 6 | 6 | 10 | 48 | — | — | — | powyżej | rachunek: rząd 48 skończony, w = 49 nie wyzwala — pas znika |
| RD-13-W14 | 0 | skończone rzędy | 1 | 4 | 3 | 0 | 1 | 1 | 0 | granica | rachunek: pierwszy rząd przed pierwszym +1, w = 1 = s (P-161 Q3) |
| RD-13-W15 | 5 | skończone rzędy | 6 | 6 | 5 | 5 | 6 | 1 | 0 | granica | rachunek: w = 6 = s |
| RD-13-W16 | 4 | skończone rzędy | 6 | 6 | 5 | 4 | — | — | — | poniżej | rachunek: w = 5 < s |
| RD-13-W17 | 29 | skończone rzędy | 6 | 6 | 5 | 29 | 30 | 5 | 0 | granica | rachunek: ostatnie powtórzenie w = 6 + 4 × 6 = 30 |
| RD-13-W18 | 35 | skończone rzędy | 6 | 6 | 5 | 35 | — | — | — | powyżej | rachunek: w = 36 byłoby szóstym wyzwoleniem |
| RD-13-W19 | -1 | skończone rzędy | 6 | 6 | 5 | błąd danych | błąd danych | błąd danych | — | błąd | rachunek: skończone < 0 |

Sygnał przy zmianie skończonych rzędów (P-097 (3.2a) przeniesione na rząd w robocie; P-161):

| ID | skończone przed [rz.] | skończone po [rz.] | s [rz.] | N [rz.] | M [-] | Oczekiwane: rząd sygnału [rz.] | Oczekiwane: rząd pasa po zmianie [rz.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|---|---|
| RD-13-W20 | 47 | 48 | 6 | 6 | 10 | — | — | — | powyżej | rachunek: +1 kończy rząd 48, w = 49 nie wyzwala |
| RD-13-W21 | 46 | 47 | 6 | 6 | 10 | 48 | 48 | 0 | typowy | rachunek: +1, wejście w rząd 48 |
| RD-13-W22 | 48 | 47 | 6 | 6 | 10 | — | 48 | 0 | poniżej | rachunek: cofnięcie −1, rząd 48 robi się od nowa — pas bez sygnału (P-161 Q2a) |
| RD-13-W23 | 10 | 20 | 6 | 6 | 5 | 18 | — | 0 | typowy | rachunek: wpisanie, (11, 21] przez 12 i 18 — jeden sygnał dla 18 (P-097 (3.2a)) |
| RD-13-W24 | 10 | 23 | 6 | 6 | 5 | 24 | 24 | 0 | granica | rachunek: wpisanie, (11, 24] — największy 24 to rząd w robocie |
| RD-13-W25 | 28 | 40 | 6 | 6 | 5 | 30 | — | 0 | granica | rachunek: (29, 41], ostatnie wyzwolenie 30; 36 to szóste |

**Bez reguły (OP):** karczek raglanowy i czapka. Rachunek jest prosty, ale głębokość karczka, ujemny luz czapki i średnie zużycie na rodzaj odzieży nie mają przeczytanego źródła szczebla 1–3, a recenzje nie dają dowodu potrzeby (soczewka zaawansowana: 2 trafienia). OP-07.

### RD-14: Postęp projektu w procentach
- Wzór: `p = ⌊100 × Σ min(r_i, c_i) / Σ c_i⌋` po częściach i z celem c_i > 0 (BR-LIC-011); części bez celu nie wchodzą do sumy
- Jednostki: r_i, c_i [rz.]; p [%]
- Granica: Σ c_i > 0 (ostre); p = 100 tylko, gdy każda część z celem osiągnęła cel
- Podstawa: rachunek; potrzeba J-11 (P-043, ER-11). Zaokrąglenie w dół, żeby 100% znaczyło „skończone”; część ponad cel nie podnosi postępu innych części
- Krytyczna: nie
- Uproszczenie: rzędy nie są równą pracą (rękaw a korpus, ujmowanie w karczku), więc p to przybliżenie postępu, nie czasu ani włóczki; cel podany długością („do 40 cm”) wymaga rzędów z próbki rzędów (RD-04) przed użyciem w tej regule.

| ID | r_i [rz.] | c_i [rz.] | Oczekiwane: p [%] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|
| RD-14-W1 | 100; 40; 0; 0 | 100; 100; 60; 60 | 43 | 0 | typowy | rachunek: ⌊100 × 140 / 320⌋ = ⌊43,75⌋ |
| RD-14-W2 | 100; 100; 60; 60 | 100; 100; 60; 60 | 100 | 0 | granica | rachunek: wszystkie cele osiągnięte |
| RD-14-W3 | 99 | 100 | 99 | 0 | poniżej | rachunek: ⌊99⌋, brak 100% przed końcem |
| RD-14-W4 | 120; 0; 0; 0 | 100; 100; 60; 60 | 31 | 0 | powyżej | rachunek: min(120, 100) = 100; ⌊31,25⌋ |
| RD-14-W5 | 40 | 100 | 40 | 0 | typowy | rachunek: zgodnie z BR-PRJ-009 |
| RD-14-W6 | 0; 0 | brak; brak | błąd danych | — | błąd | rachunek: Σ c_i = 0, postęp nieokreślony |
| RD-14-W7 | 29 | 100 | 29 | 0 | typowy | rachunek: ⌊100 × 29 / 100⌋ = 29; pułapka zmiennoprzecinkowa: 100 × 0,29 = 28,999… daje 28 (ER-38) |

### RD-15: Cel dzienny do terminu i wykonanie dnia
- Wzór: `d = (termin − dziś) + 1` [dni, daty lokalne RD-16]; `R = C − Z_przed`, `R_teraz = C − Z_teraz`. Gałęzie w tej kolejności (P-134 Q1a, NZ-RD15): (1) przy d ≥ 1 i R ≤ 0 albo przy d < 1 i R_teraz ≤ 0: `g = 0`, „cel osiągnięty” — brak rzędów do zrobienia ma pierwszeństwo przed terminem; (2) d < 1 i R_teraz > 0: brak celu i komunikat „termin minął, zostało R_teraz rzędów”, liczone na bieżąco (po terminie nie ma celu dnia, więc zasada stałego celu P-047 tu nie działa: dokończenie albo prucie po terminie od razu zmienia „zostało”, a dokończenie daje „cel osiągnięty”); (3) d ≥ 1 i R > 0: cel dnia `g = ⌈R / d⌉`. C = Σ c_i, Z_przed = Σ min(r_i, c_i) na koniec wczoraj (jak RD-14), Z_teraz = Σ min(r_i, c_i) teraz. d liczy się na datach kalendarzowych (dzień RD-16), nie z różnicy chwil: doba przy zmianie czasu ma 23 albo 25 h (ER-38). Cel dnia liczy się przy pierwszym pokazaniu w danym dniu; zmiany z wcześniejszych dni scalone później (zegarek, ekran blokady) liczą się do swojego dnia i nie zmieniają celu dnia bieżącego; przy aplikacji otwartej przez północ cel nowego dnia liczy się przy powrocie z tła i przy następnej zmianie licznika (P-047, P-097 (4a), jak Trening `docs/27-subskrypcja-spec.md:125`; ER-44) Wykonanie dnia = suma zmian +1 i −1 liczników rzędów z dniem zmiany = dziś (RD-16), bez zmian cofniętych z historii (BR-LIC-003) i bez wpisań wartości (BR-LIC-017); prucie zmniejsza wykonanie
- Jednostki: C, Z_przed, Z_teraz, R, R_teraz, g, zostało [rz.]; d [dni]; stan [-]
- Granica: d = 1 (termin dziś, włącznie); d < 1 po terminie; R = 0 i R_teraz = 0 (cel osiągnięty, włącznie, przy każdym d); C > 0 (ostre)
- Podstawa: decyzja P-047 (cel stały w ciągu dnia), P-134 Q1a (pierwszeństwo „cel osiągnięty”, „zostało” po terminie na bieżąco), rachunek; potrzeba J-11 (P-043, ZAL-027: cel dzienny to hipoteza)
- Krytyczna: nie
- Uproszczenie: równy podział rzędów na dni, bez dni wolnych i bez różnicy pracy między rzędami (RD-14).

| ID | C [rz.] | Z_przed [rz.] | d [dni] | Oczekiwane: g [rz.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|
| RD-15-W1 | 320 | 140 | 14 | 13 | 0 | typowy | rachunek: ⌈180 / 14⌉ = ⌈12,86⌉; d dla 2026-10-22 → 2026-11-04 |
| RD-15-W2 | 320 | 140 | 12 | 15 | 0 | typowy | rachunek: 180 / 12 = 15 bez zaokrąglenia |
| RD-15-W3 | 320 | 300 | 1 | 20 | 0 | granica | rachunek: termin dziś, całe R dziś |
| RD-15-W4 | 320 | 300 | 0 | brak celu, zostało 20 | — | poniżej | rachunek: d < 1; zasada po terminie z P-047 |
| RD-15-W5 | 320 | 300 | 2 | 10 | 0 | powyżej | rachunek: ⌈20 / 2⌉ |
| RD-15-W6 | 320 | 320 | 5 | 0 | 0 | granica | rachunek: R = 0, cel osiągnięty |
| RD-15-W7 | 0 | 0 | 5 | błąd danych | — | błąd | rachunek: brak celów części |

Po terminie i bez rzędów do zrobienia (P-134 Q1a, NZ-RD15; `—` = brak celu dnia):

| ID | C [rz.] | Z_przed [rz.] | Z_teraz [rz.] | d [dni] | Oczekiwane: stan [-] | Oczekiwane: g [rz.] | Oczekiwane: zostało [rz.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|---|---|
| RD-15-W11 | 320 | 320 | 320 | 0 | cel osiągnięty | 0 | 0 | 0 | granica | rachunek: d < 1 i R_teraz = 0 → gałąź (1) przed (2) |
| RD-15-W12 | 320 | 320 | 320 | -3 | cel osiągnięty | 0 | 0 | 0 | poniżej | rachunek: 3 dni po terminie, nic nie zostało |
| RD-15-W13 | 320 | 300 | 310 | 0 | termin minął | — | 10 | 0 | typowy | rachunek: 320 − 310, na bieżąco (nie 320 − 300 = 20) |
| RD-15-W14 | 320 | 300 | 320 | 0 | cel osiągnięty | 0 | 0 | 0 | granica | rachunek: 20 rzędów dokończonych dziś po terminie → od razu cel osiągnięty |
| RD-15-W15 | 320 | 300 | 295 | -1 | termin minął | — | 25 | 0 | typowy | rachunek: prucie 5 rzędów po terminie, 320 − 295 |
| RD-15-W16 | 320 | 320 | 320 | 1 | cel osiągnięty | 0 | 0 | 0 | powyżej | rachunek: termin dziś (d = 1), R = 0 → gałąź (1) |

Liczba dni d z dat (ER-38):

| ID | dziś [data] | termin [data] | strefa [IANA] | Oczekiwane: d [dni] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|
| RD-15-W8 | 2027-03-22 | 2027-04-04 | Europe/Warsaw | 14 | 0 | typowy | rachunek: daty kalendarzowe; 2027-03-28 ma 23 h, różnica chwil = 12,958 doby (pułapka) |
| RD-15-W9 | 2026-10-22 | 2026-11-04 | Europe/Warsaw | 14 | 0 | typowy | rachunek: daty kalendarzowe; 2026-10-25 ma 25 h, różnica chwil = 13,042 doby (pułapka) |
| RD-15-W10 | 2026-10-25 | 2026-10-25 | Europe/Warsaw | 1 | 0 | granica | rachunek: termin dziś w dniu zmiany czasu |

### RD-16: Dzień zmiany w strefie czasowej urządzenia
- Wzór: dzień zmiany = data lokalna w strefie czasowej urządzenia w chwili zmiany, zapisanej razem ze zmianą; późniejsza zmiana strefy nie przenosi dawnych zmian między dniami. Dzień zapisuje się jako `RRRR-MM-DD` w kalendarzu gregoriańskim, cyframi ASCII, niezależnie od języka, regionu i kalendarza urządzenia (ER-37)
- Jednostki: chwila [UTC, ISO 8601]; strefa [IANA]; dzień [data]
- Granica: 00:00:00 czasu lokalnego należy do nowego dnia (włącznie); gdy północy nie ma (zmiana czasu o 00:00), nowy dzień zaczyna pierwsza chwila nowej daty; dzień pominięty przy zmianie strefy (Pacific/Apia 2011-12-30) nie dostaje żadnej zmiany
- Podstawa: rachunek (baza stref IANA, tzdata 2026e; wektory W7–W26: `zoneinfo` Pythona, `oczko-warsztat/01-odkrywanie/fix-2026-10-25-er34-44/rd16.py`, sprawdzone `Intl` w Node 22); potrzeba: „I worked about 20 rows Sunday and the counter says they were all Saturday” (Easy Knitty, id10008576789), ER-24
- Krytyczna: nie

| ID | chwila [UTC] | strefa [IANA] | region [BCP 47] | Oczekiwane: dzień [data] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|
| RD-16-W1 | 2023-06-04T01:30:00Z | America/New_York | — | 2023-06-03 | 0 | typowy | rachunek: UTC−4 (czas letni), 21:30 lokalnie |
| RD-16-W2 | 2023-06-04T01:30:00Z | Europe/Warsaw | — | 2023-06-04 | 0 | typowy | rachunek: UTC+2, 03:30 lokalnie |
| RD-16-W3 | 2026-10-22T22:00:00Z | Europe/Warsaw | — | 2026-10-23 | 0 | granica | rachunek: 00:00:00 lokalnie |
| RD-16-W4 | 2026-10-22T21:59:59Z | Europe/Warsaw | — | 2026-10-22 | 0 | poniżej | rachunek: 23:59:59 lokalnie |
| RD-16-W5 | 2026-10-22T22:00:01Z | Europe/Warsaw | — | 2026-10-23 | 0 | powyżej | rachunek: 00:00:01 lokalnie |
| RD-16-W6 | brak | Europe/Warsaw | — | błąd danych | — | błąd | rachunek: zmiana bez chwili |
| RD-16-W7 | 2027-01-15T22:59:59Z | Europe/Warsaw | — | 2027-01-15 | 0 | poniżej | rachunek: UTC+1 (zima), 23:59:59 lokalnie (ER-37) |
| RD-16-W8 | 2027-01-15T23:00:00Z | Europe/Warsaw | — | 2027-01-16 | 0 | granica | rachunek: UTC+1, 00:00:00 lokalnie |
| RD-16-W9 | 2026-03-28T23:00:00Z | Europe/Warsaw | — | 2026-03-29 | 0 | granica | rachunek: 00:00 UTC+1 w dniu wiosennej zmiany czasu |
| RD-16-W10 | 2026-03-29T01:00:00Z | Europe/Warsaw | — | 2026-03-29 | 0 | typowy | rachunek: 02:00 UTC+1 → 03:00 UTC+2, ta sama data |
| RD-16-W11 | 2026-10-24T21:59:59Z | Europe/Warsaw | — | 2026-10-24 | 0 | poniżej | rachunek: 23:59:59 UTC+2 przed jesienną zmianą |
| RD-16-W12 | 2026-10-24T22:00:00Z | Europe/Warsaw | — | 2026-10-25 | 0 | granica | rachunek: 00:00 UTC+2 |
| RD-16-W13 | 2026-10-25T00:59:59Z | Europe/Warsaw | — | 2026-10-25 | 0 | typowy | rachunek: 02:59:59 UTC+2, przed cofnięciem zegara |
| RD-16-W14 | 2026-10-25T01:00:00Z | Europe/Warsaw | — | 2026-10-25 | 0 | typowy | rachunek: 02:00:00 UTC+1, po cofnięciu zegara |
| RD-16-W15 | 2026-10-22T18:29:59Z | Asia/Kolkata | — | 2026-10-22 | 0 | poniżej | rachunek: UTC+5:30, 23:59:59 lokalnie |
| RD-16-W16 | 2026-10-22T18:30:00Z | Asia/Kolkata | — | 2026-10-23 | 0 | granica | rachunek: UTC+5:30, 00:00 lokalnie |
| RD-16-W17 | 2026-10-22T09:59:59Z | Pacific/Kiritimati | — | 2026-10-22 | 0 | poniżej | rachunek: UTC+14, 23:59:59 lokalnie |
| RD-16-W18 | 2026-10-22T10:00:00Z | Pacific/Kiritimati | — | 2026-10-23 | 0 | granica | rachunek: UTC+14, 00:00 lokalnie |
| RD-16-W19 | 2026-10-22T13:00:00Z | Australia/Lord_Howe | — | 2026-10-23 | 0 | granica | rachunek: UTC+11 (czas letni, zmiana o 30 min), 00:00 lokalnie |
| RD-16-W20 | 2026-06-22T13:30:00Z | Australia/Lord_Howe | — | 2026-06-23 | 0 | granica | rachunek: UTC+10:30 (czas zimowy), 00:00 lokalnie |
| RD-16-W21 | 2011-12-30T09:59:59Z | Pacific/Apia | — | 2011-12-29 | 0 | poniżej | rachunek: UTC−10, 23:59:59 lokalnie |
| RD-16-W22 | 2011-12-30T10:00:00Z | Pacific/Apia | — | 2011-12-31 | 0 | powyżej | rachunek: przejście na UTC+14, 2011-12-30 pominięty |
| RD-16-W23 | 2026-09-06T03:59:59Z | America/Santiago | — | 2026-09-05 | 0 | poniżej | rachunek: UTC−4, 23:59:59 lokalnie |
| RD-16-W24 | 2026-09-06T04:00:00Z | America/Santiago | — | 2026-09-06 | 0 | granica | rachunek: zmiana czasu o 00:00, północy nie ma; 01:00 UTC−3 |
| RD-16-W25 | 2026-10-22T22:00:00Z | Europe/Warsaw | ja-JP-u-ca-japanese | 2026-10-23 | 0 | typowy | rachunek: zapis gregoriański mimo kalendarza japońskiego (Intl daje „R8/10/23”) |
| RD-16-W26 | 2026-10-22T22:00:00Z | Europe/Warsaw | ar-EG | 2026-10-23 | 0 | typowy | rachunek: cyfry ASCII mimo cyfr arabsko-indyjskich regionu (Intl daje „٢٣‏/١٠‏/٢٠٢٦”) |

### RD-17: Strażnik stuknięć: seria dodań do sprawdzenia
- Wzór: pytanie „Dodano n rzędów w t s. Cofnąć?” pojawia się, gdy w liczniku rzędów istnieją 3 kolejne dodania z `t_(i+2) − t_i ≤ T`; T = 2 s; seria obejmuje wszystkie dodania z odstępem ≤ T od poprzedniego. Reguła działa osobno dla każdego źródła zdarzeń (aplikacja, ekran blokady, zegarek, Siri) i po czasie zdarzenia zapisanym przy stuknięciu, nigdy po czasie dostarczenia do aplikacji; dodania sortuje się po czasie zdarzenia, a przy równym czasie po identyfikatorze zdarzenia; pytanie o serię scaloną z innego źródła podaje źródło i godzinę serii (P-091 (4b), ER-40)
- Jednostki: t [s]; T [s]; n [-]
- Granica: `t_(i+2) − t_i = 2 s` wyzwala (włącznie)
- Podstawa: rachunek; parametr T i próg 3 dodań z decyzji P-047 (parametr produktowy, ocena roli 01 do korekty po wydaniu); potrzeba J-01 (P-044, I-1); tylko liczniki rzędów, nie oczek (ER-24)
- Krytyczna: nie

| ID | chwile dodań [s] | Oczekiwane: pytanie [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|
| RD-17-W1 | 0; 0,4; 0,8; 1,2; 1,6 | tak | — | typowy | rachunek: 0,8 − 0 ≤ 2 |
| RD-17-W2 | 0; 1; 2 | tak | — | granica | rachunek: 2 − 0 = 2, włącznie |
| RD-17-W3 | 0; 1; 2,01 | nie | — | powyżej | rachunek: 2,01 > 2 |
| RD-17-W4 | 0; 0,5 | nie | — | poniżej | rachunek: tylko 2 dodania (nadrobienie zapomnianego rzędu) |
| RD-17-W5 | 0; 60; 120 | nie | — | typowy | rachunek: zwykłe dzierganie |
| RD-17-W6 | 0; 1; 0,5 | tak | — | typowy | rachunek: kolejność dowolna, po sortowaniu 0; 0,5; 1 (P-091 (4b); wcześniej „błąd danych”) |
| RD-17-W7 | 0; brak; 1 | błąd danych | — | błąd | rachunek: dodanie bez czasu zdarzenia |

Źródła i scalanie (P-091 (4b), ER-40):

| ID | chwile dodań [s] | źródła [-] | dostarczenie [s] | Oczekiwane: pytanie [-] | Oczekiwane: źródło pytania [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|
| RD-17-W8 | 0; 1; 2; 3; 4 | ekran blokady; ekran blokady; ekran blokady; ekran blokady; ekran blokady | 2760; 2760; 2760; 2760; 2760 | tak | ekran blokady | — | typowy | rachunek: seria w czasie zdarzenia (np. 21:14), scalona naraz po 46 min |
| RD-17-W9 | 0; 300; 600 | ekran blokady; ekran blokady; ekran blokady | 3600; 3600; 3600 | nie | — | — | typowy | rachunek: wieczór z ekranu blokady scalony naraz; czas dostarczenia się nie liczy |
| RD-17-W10 | 0; 0,5; 1 | aplikacja; ekran blokady; aplikacja | 0; 30; 1 | nie | — | — | poniżej | rachunek: osobno dla źródeł, w aplikacji 2 dodania |
| RD-17-W11 | 0; 0,7; 0,5; 1 | aplikacja; zegarek; aplikacja; aplikacja | 0; 40; 0,5; 1 | tak | aplikacja | — | typowy | rachunek: w aplikacji 0; 0,5; 1 |
| RD-17-W12 | 5; 5; 5 | zegarek; zegarek; zegarek | 60; 60; 60 | tak | zegarek | — | granica | rachunek: równy czas, kolejność po identyfikatorze; 5 − 5 ≤ 2 |

### RD-18: Szacunek „zdążę?” z własnego tempa
- Wzór: `h = C × H / R`; `dni = ⌈h / h_d⌉`; R i H z ukończonych projektów z sesjami stopera; h_d = średni czas stopera na dzień z robótką (definicja dnia z robótką: `wymagania-dni.md`, P-195 Q3b — także dzień z samym stoperem)
- Jednostki: C, R [rz.]; H, h, h_d [h]; dni [dni]
- Granica: R > 0 i H > 0 (ostre); bez historii brak szacunku
- Podstawa: rachunek; potrzeba J-11 (P-044, I-4; w zakresie PÓŹNIEJ, P-046)
- Krytyczna: nie
- Uproszczenie: tempo z poprzednich projektów nie uwzględnia innej techniki, włóczki ani grubości drutów; wynik oznaczony jako szacunek.

| ID | C [rz.] | R [rz.] | H [h] | h_d [h] | Oczekiwane: h [h] | Oczekiwane: dni [dni] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|---|
| RD-18-W1 | 320 | 600 | 20 | 1 | 10,67 | 11 | 0,01 | typowy | rachunek: 320 × 20 / 600; ⌈10,67 / 1⌉ |
| RD-18-W2 | 320 | 600 | 20 | 2 | 10,67 | 6 | 0,01 | typowy | rachunek: ⌈10,67 / 2⌉ |
| RD-18-W3 | 320 | 0 | 0 | 0 | brak szacunku | brak szacunku | — | granica | rachunek: R = 0, pierwszy projekt |
| RD-18-W4 | 320 | 600 | 0 | 0 | brak szacunku | brak szacunku | — | poniżej | rachunek: H = 0, brak sesji stopera |
| RD-18-W5 | 100 | 100 | 10 | 1 | 10 | 10 | 0,01 | powyżej | rachunek: tempo 10 rz./h |
| RD-18-W6 | -5 | 600 | 20 | 1 | błąd danych | błąd danych | — | błąd | rachunek: C < 0 |

### RD-19: Rozmiar szydełka w mm na oznaczenie US
- Wzór: wyszukanie w tabeli szydełek zwykłych S-18 („Crochet Hook Sizes”); klucz to rozmiar w mm po zaokrągleniu do 0,001 mm (jak RD-11); brak oznaczenia US w wierszu albo rozmiar spoza tabeli daje „brak”, nie najbliższą wartość. Szydełka stalowe (numeracja odwrotna) nie wchodzą do W1 (P-081 P4a; ER-32)
- Jednostki: d [mm], oznaczenie US [-] (tekst, np. „H-8”, „K-10 ½”)
- Granica: brak; d ≤ 0 to błąd danych
- Podstawa: S-18 (tabela odczytana surowo 2026-10-25, zgodna z `docs/tresci/wektory.json`, `szydelka`); decyzja P-081 (P4a)
- Krytyczna: nie

| ID | d [mm] | Oczekiwane: US [-] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|
| RD-19-W1 | 5 | H-8 | — | typowy | S-18 |
| RD-19-W2 | 3,125 | D | — | typowy | S-18 |
| RD-19-W3 | 6,5 | K-10 ½ | — | typowy | S-18 |
| RD-19-W4 | 2,5 | brak | — | typowy | S-18: wiersz bez oznaczenia US |
| RD-19-W5 | 4,75 | brak | — | typowy | S-18 i rachunek: rozmiar spoza tabeli, bez najbliższej wartości |
| RD-19-W6 | 3,1254 | D | — | typowy | S-18 i rachunek: 3,125 po zaokrągleniu do 0,001 mm |
| RD-19-W7 | 0 | błąd danych | — | błąd | rachunek: d ≤ 0 |

### RD-20: Początek tygodnia: poniedziałek
- Wzór: początek tygodnia dnia D = D − (numer dnia tygodnia D − 1) dni, gdzie poniedziałek = 1 … niedziela = 7 (kalendarz gregoriański); tydzień trwa od poniedziałku do niedzieli dla wszystkich języków i regionów, także tych, które w ustawieniach systemu zaczynają tydzień w niedzielę albo w sobotę; podsumowanie ma podpis „Tygodnie od poniedziałku” (P-110 Q7, jak Trening `thisMonday`; NZ-05-03). Dzień D to dzień zmiany z RD-16 (`RRRR-MM-DD`), więc zmiany czasu i strefy rozstrzyga RD-16, nie ta reguła
- Jednostki: dzień D [data]; region [BCP 47] (nie wpływa na wynik); początek tygodnia [data]
- Granica: poniedziałek należy do tygodnia, który się w nim zaczyna (włącznie); niedziela to ostatni dzień tygodnia; data spoza kalendarza (np. 2026-02-30) to błąd danych
- Podstawa: decyzja P-110 (Q7); rachunek (`datetime.date.weekday()` Pythona, sprawdzone `Intl.Locale.getWeekInfo()` w Node 22: en-US `firstDay: 7`, ar-EG `firstDay: 6`, pl-PL `firstDay: 1` — region pokazuje inny pierwszy dzień, a wynik się nie zmienia)
- Krytyczna: nie

| ID | dzień [data] | region [BCP 47] | Oczekiwane: początek tygodnia [data] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|
| RD-20-W1 | 2026-10-21 | pl-PL | 2026-10-19 | 0 | typowy | rachunek: środa, 2 dni po poniedziałku (P-110 Q7) |
| RD-20-W2 | 2026-10-19 | pl-PL | 2026-10-19 | 0 | granica | rachunek: poniedziałek zaczyna własny tydzień |
| RD-20-W3 | 2026-10-25 | pl-PL | 2026-10-19 | 0 | poniżej | rachunek: niedziela, ostatni dzień tygodnia od 19.10 |
| RD-20-W4 | 2026-10-26 | pl-PL | 2026-10-26 | 0 | powyżej | rachunek: następny poniedziałek, nowy tydzień |
| RD-20-W5 | 2026-10-25 | en-US | 2026-10-19 | 0 | typowy | rachunek i P-110 Q7: region zaczyna tydzień w niedzielę (`firstDay: 7`), wynik bez zmian |
| RD-20-W6 | 2026-10-24 | ar-EG | 2026-10-19 | 0 | typowy | rachunek i P-110 Q7: region zaczyna tydzień w sobotę (`firstDay: 6`), wynik bez zmian |
| RD-20-W7 | 2027-01-01 | pl-PL | 2026-12-28 | 0 | typowy | rachunek: piątek, tydzień zaczęty w poprzednim roku |
| RD-20-W8 | 2028-03-01 | pl-PL | 2028-02-28 | 0 | typowy | rachunek: środa, tydzień zaczęty w lutym roku przestępnego (29.02 w środku) |
| RD-20-W9 | 2026-02-30 | pl-PL | błąd danych | — | błąd | rachunek: data spoza kalendarza |

### RD-21: Rząd wskazany znacznikiem wzoru
- Wzór: `rząd_z = rząd_bazowy + (s − s_ust)`, gdzie s to skończone rzędy licznika, do którego wzór ma znacznik, a s_ust i rząd_bazowy zapisuje się przy ustawieniu znacznika. Znacznik wskazuje **rząd w robocie**, nie ostatni skończony (S-43; P-134 Q2a): domyślnie przy ustawieniu `rząd_bazowy = s_ust + 1`, niezależnie od trybu licznika (BR-LIC-012) — w trybie „rząd w trakcie” równa się liczbie na liczniku, w trybie „skończone rzędy” jest od niej o 1 większy. Użytkownik może ustawić inny rząd_bazowy (schemat numerowany od innego rzędu niż licznik, np. od pierwszego rzędu po ściągaczu); przesunięcie `rząd_bazowy − (s_ust + 1)` zostaje stałe przy +1, −1, wpisaniu wartości i cofnięciu z historii. Notatka dodana na znaczniku (P-124 Q6a) dotyczy rzędu licznika `s + 1` (`notatka_rzedu.rzad`, rząd w robocie w układzie licznika). Przy `rząd_z < 1` stan „przed schematem” (P-134 Q3a): znacznik stoi na pierwszym rzędzie schematu z oznaczeniem, że praca jest przed nim, i wraca sam, gdy `rząd_z ≥ 1`; notatki na znaczniku w tym stanie nie ma (brak miejsca na schemacie, jak wzór bez znacznika: ADR-0011)
- Jednostki: s, s_ust, rząd_bazowy, rząd_z, liczba na liczniku, rząd notatki [rz.]; tryb, stan [-]
- Granica: `rząd_z = 1` należy do schematu (włącznie); `rząd_z < 1` przed schematem; s ≥ 0 (s < 0 to błąd danych)
- Podstawa: S-43 (szczebel 2: pasek nad rzędem w robocie, przesuwany po skończeniu rzędu), rachunek, P-134 Q2a, Q3a; potrzeba J-04 (BR-WZR-003); NZ-WZR003, P-126 N3
- Krytyczna: nie

Ustawienie znacznika (wartości domyślne):

| ID | s_ust [rz.] | tryb [-] | Oczekiwane: liczba na liczniku [rz.] | Oczekiwane: rząd_bazowy [rz.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|
| RD-21-W1 | 11 | skończone rzędy | 11 | 12 | 0 | typowy | S-43: rząd w robocie = 11 + 1 |
| RD-21-W2 | 11 | rząd w trakcie | 12 | 12 | 0 | typowy | S-43 i BR-LIC-012: licznik 11 + 1, znacznik ten sam |
| RD-21-W3 | 0 | skończone rzędy | 0 | 1 | 0 | granica | rachunek: nic nie zrobiono, w robocie rząd 1 |

Znacznik po zmianach licznika:

| ID | rząd_bazowy [rz.] | s_ust [rz.] | s [rz.] | Oczekiwane: rząd_z [rz.] | Oczekiwane: stan [-] | Oczekiwane: rząd notatki [rz.] | Tolerancja | Rodzaj | Pochodzenie |
|---|---|---|---|---|---|---|---|---|---|
| RD-21-W4 | 12 | 11 | 12 | 13 | na schemacie | 13 | 0 | typowy | rachunek: +1 przesuwa o rząd (BR-WZR-003/S1) |
| RD-21-W5 | 1 | 40 | 45 | 6 | na schemacie | 46 | 0 | typowy | rachunek: schemat od rzędu po ściągaczu, 1 + 5; notatka 45 + 1 |
| RD-21-W6 | 1 | 40 | 38 | -1 | przed schematem | — | 0 | poniżej | rachunek: prucie poniżej początku schematu, 1 + (38 − 40) (P-134 Q3a) |
| RD-21-W7 | 12 | 11 | -1 | błąd danych | — | — | — | błąd | rachunek: s < 0 |
| RD-21-W8 | 1 | 40 | 40 | 1 | na schemacie | 41 | 0 | granica | rachunek: powrót po pruciu, 1 + (40 − 40); rząd 1 należy do schematu |
| RD-21-W9 | 1 | 40 | 41 | 2 | na schemacie | 42 | 0 | powyżej | rachunek: 1 + (41 − 40) |

