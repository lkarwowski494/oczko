# Research 1.0.2: U7, U8, U9 (rola 01, tryb fix, RS1)
Stan: 2026-11-28 · decyzja zlecająca KO-229 (słowa właściciela: „U8 i U9 - trzeba zrobic research i zaplanowac. Bez estymacji nie ejstem w stanie podjac decyzji.”) · decyzje P-1092–P-1095 w `docs/decyzje.md` · kwarantanna P-003/P-015: czytane tylko `CLAUDE.md`, `docs/` i źródła zewnętrzne; kodu nie czytano, więc stan aplikacji podaję według kontraktu zakresu i BRD, nie według kodu.

## Streszczenie
| # | Wynik | Rekomendacja |
|---|---|---|
| U7 przypominacz „stuknij po rzędzie” | żadna z 20 aplikacji nie ma przypomnienia po czasie bez stuknięcia; popyt słaby; zegarek nie wibruje z tła własnej aplikacji | forma A+B (ekran licznika + ekran blokady), bez nowego uprawnienia, włącznik domyślnie wyłączony; C (powiadomienie) na liście odcięć |
| U8 „check” liczby oczek | wzory zwykle podają liczbę oczek po rzędzie [FAKT S-46]; dane są więc u użytkownika, nie trzeba ich wyliczać | wariant U8-A (cel na liczniku oczek, wpis z wzoru) w 1.0.3/1.1; do 1.0.2 tylko, jeśli 05 potwierdzi brak migracji schematu |
| U9 zamiana włóczki | liczy się łączny metraż, nie liczba motków ani waga [FAKT S-49]; ta sama kategoria nie znaczy zamienności, próbka obowiązkowa [FAKT S-20, S-47] | wariant U9-A (motki z metrażu + zawsze zdanie o próbce) w 1.1; podpowiedzi drutów z metrów na gram nie robić (brak źródła) |

## E0: klasyfikacja i środowisko
- U7: **P** (forma: decyzja produktowa ról 03/04 i koordynatora, P-087); ograniczenia platformy: **M** (dokumentacja Apple, szczebel 1).
- U8: **P** (czy i w jakim wariancie) + **M** (skąd „ile powinno być”: źródła szczebla 1).
- U9: **P** + **M** (metoda zamiany: źródła szczebla 1 i 3; wynik to rachunek).
- Środowisko (2026-11-28): Linux w chmurze, Node 22, git; sieć: `itunes.apple.com` (wyszukiwanie i `lookup` działają; kanał RSS recenzji zwrócił wpisy tylko dla 8 z 56 zapytań o pierwszą stronę (14 aplikacji × 4 sklepy), dalsze strony puste, więc recenzje uzupełniłem ze stron aplikacji `apps.apple.com`), `developer.apple.com` (dane JSON dokumentacji), `support.apple.com`, `craftyarncouncil.com`, `lionbrand.com` — 200. Kodu i testów nie uruchamiałem (rola 01, tylko dokumenty).
- Materiał recenzji: 428 unikalnych recenzji z 20 aplikacji licznikowych (RSS + strony App Store, sklep US i częściowo GB/CA/AU), opisy 20 aplikacji z `lookup` (US). Kopie robocze w scratchpadzie sesji, poza repo (cudze teksty). Ograniczenie: próbka mniejsza niż w E1 (4682), sama angielska; brak trafienia to słaby dowód braku popytu.

## U7: przypominacz kliknięcia po skończonym rzędzie
### Problem i dowód potrzeby
- Sygnał: 1 osoba + „domowe rozpraszacze” (1) + właściciel (wspólne wejście 1.0.2). W BRD: kontekst J-01 to uwaga podzielona („podcast, TV, dzieci”, `docs/brd/odkrywanie.md`, „Kontekst użycia”), a historia stuknięć z godziną pomaga, „gdy zapomnę, czy stuknąłem” (J-01, id13252701149).
- Konkurencja (opisy 20 aplikacji, `lookup` US, odczyt 2026-11-28; nazwy i pełne cytaty poza publicznym repo, P-107 (3)): przypomnienia są wyłącznie „w rzędzie N” (np. „Row reminders, like "Start decreases" at 24”, „reminders to appear on a specific row”) albo o terminie projektu („Set due date reminders for your projects”). Przypomnienia „nie stuknięto od X minut” nie ma żadna. Licznik na ekranie blokady deklarują 4 z 20.
- Recenzje: 0 z 428 z prośbą o przypomnienie stuknięcia (wzorce „forgot to tap/click/count”, „did I tap”). Luka rynku, ale bez dowodu popytu: forma ma być tania i opcjonalna (zasada wspólna 18, P-046).
- Liczniki mechaniczne nie mają zasilania ani zegara, więc nie przypominają [OCENA]; liczników elektronicznych nie sprawdzałem [DO USTALENIA] (OP-37).

### Ograniczenia platformy (szczebel 1, odczyt 2026-11-28)
| Fakt | Źródło |
|---|---|
| Powiadomienie lokalne po zadanym czasie planuje system; aplikacja nie musi działać | [FAKT S-50] |
| Poziom „passive” dodaje powiadomienie do listy bez zapalania ekranu i dźwięku | [FAKT S-51] |
| Zegarek nie odtworzy wibracji z tła własnej aplikacji (wyjątek: sesja treningowa) | [FAKT S-52] |
| Sesje rozszerzone na zegarku tylko dla 4 typów (self care, mindfulness, physical therapy, smart alarm); dzierganie do żadnego nie pasuje [OCENA] | [FAKT S-53] |
| Powiadomienia iPhone'a trafiają na zegarek, gdy iPhone jest zablokowany | [FAKT S-54] |
| Live Activity działa do 8 h, na ekranie blokady najwyżej 12 h; dane zmienia aplikacja albo push (Oczko nie ma serwera, P-021) | [FAKT S-55] |
| `staleDate`: o tej chwili system oznacza Live Activity jako nieaktualną (`isStale`) bez udziału aplikacji | [FAKT S-56] |
| Tekst z odliczaniem czasu (`Text(timerInterval:)`) liczy sam, także w widżecie | [FAKT S-57] |
| HIG: nie wysyłać kilku powiadomień o tym samym i nie kazać w powiadomieniu wykonać zadania w aplikacji, chyba że jest akcja powiadomienia | [FAKT S-58] |
| App Review 4.5.4: powiadomienia nie mogą być warunkiem działania aplikacji | [FAKT S-59] |

Czy widok Live Activity przerysuje się w chwili `staleDate`, gdy aplikacja jest uśpiona, dokumentacja nie mówi wprost: [DO USTALENIA] (OP-35) — prototyp roli 05/08 na urządzeniu.

### Formy
| Forma | Jak działa | Uprawnienia, platforma | Natrętność | Koszt |
|---|---|---|---|---|
| A. Ekran licznika | gdy ekran licznika jest otwarty (ekran nie gaśnie, F-10) i od ostatniego +1 minął próg, przycisk +1 jednorazowo się wyróżnia, opcjonalnie wzorzec wibracji (jak F-48); znika po +1 | brak; działa tylko przy otwartej aplikacji | niska: raz na rząd, bez dźwięku | niski |
| B. Ekran blokady | w sesji Live Activity (F-11) „ostatni rząd X min temu” liczone samo (S-57); po progu (`staleDate`, S-56) wygląd „Skończony rząd? +1” | brak nowego; ta sama sesja co F-11/F-21; limit 8/12 h | niska: cicho, bez wibracji | niski–średni (przerysowanie: [DO USTALENIA] (OP-35)) |
| C. Powiadomienie | po każdym +1 planowane powiadomienie na próg (S-50), z akcją „+1” (S-58); na zablokowanym telefonie trafia na zegarek z wibracją (S-54) | **nowe uprawnienie powiadomień** (ODK-15: P1 bez dowodu potrzeby), teksty w 35 językach; tryb skupienia wycisza | najwyższa; ryzyko wyłączenia wszystkich powiadomień (S-58) | średni |

**Rekomendacja dla 03/04 (P-1092):** A+B jako jedna funkcja, włącznik w ustawieniach licznika domyślnie wyłączony (P-046: nic nowego na ekranie licznika bez ustawienia użytkownika), próg stały do wyboru z krótkiej listy (wartości [DO WYJAŚNIENIA] (OP-36), parametr produktowy; próg z własnego tempa odrzucony na start: na początku projektu nie ma tempa, a zachowanie byłoby nieprzewidywalne [OCENA]), najwyżej jedno przypomnienie na rząd. C na liście odcięć z warunkiem powrotu: ≥3 prośby o wibrację/powiadomienie w recenzjach albo wynik testu F, że A+B nie wystarcza. Zegarek: bez osobnej pracy (bez sesji treningowej nie wolno wibrować z tła, S-52).

**Stan po ZK1 (2026-11-28):** rola 03 przyjęła formę A+B do 1.0.2 jako ZM-25 (P-1091); bezpiecznik: gdy prototyp 05/08 nie potwierdzi B (OP-35), B przechodzi na 1.0.3, a 1.0.2 = samo A; C na liście odcięć (`docs/zakres-1-0-2.md`).

## U8: „check” — ile oczek powinno być w rzędzie
### Praca i dowody
- Praca: J-02 (oczka w rzędzie), J-04 (wzór), J-09. Sygnał 1.0.2: 1 osoba.
- Źródło danych istnieje we wzorze: „Hint: Count the stitches at the end of every row. Most patterns tell you how many stitches you should have” [FAKT S-46]; zapis „: 14 sc. (14 sc). —14 sc.” to liczba oczek, nie polecenie [FAKT S-46].
- Recenzje (strony App Store US, odczyt 2026-11-28; aplikacje opisowo, P-107 (3)): prośba o „stitch count requirement for the individual sections” (lider liczników z zegarkiem); zagubienie, gdy wzór podaje liczbę po rzędzie: „(inc, 2dc)x15 which makes 60 stitches plus a ch 3 and a sl st and then say there should be 64 stitches without any futher explanation” (licznik szydełkowy, id12120194506, 2★); licznik pomocniczy przy przyrostach: „helpful for increases and decreases, so you’re not having to do the math” (nowa aplikacja „towarzysz robótki” z 2026).
- Konkurencja: 2 z 20 opisów obiecują śledzenie liczby oczek przy przyrostach („Track stitch counts, repeat cycles”; „smart rules for automatic increases/decreases”, `lookup`, 2026-11-28). Liczby oczekiwanej z instrukcji rzędu nie liczy żadna z przeczytanych.
- Stan Oczka (kontrakt zakresu): licznik typu „Oczka” jest (F-04), cel rzędów części jest (F-08), plan „od rzędu, co N, M razy” jest (F-06, RD-13); przeliczenia równomiernego dodawania F-40 = PÓŹNIEJ (OP-04).

### Reguły dziedzinowe (gdyby liczyć z instrukcji)
- Skróty CYC podają zmianę liczby oczek: „k2tog … single right-leaning decrease”, „M1 … single knit increase”, „S2KP2 … centered double decrease” [FAKT S-48]. Krotność „x15” i nawiasy to składnia wzoru [FAKT S-46]. Różnice US/UK w szydełku: RYZ-03, S-21.
- Wniosek [OCENA]: liczenie z instrukcji wymaga parsera składni wzoru w wielu konwencjach i 35 językach; błąd daje fałszywe „źle” albo „dobrze” (treść krytyczna według D-027, bo prowadzi do prucia albo do błędu w robótce) i zbliża Oczko do elementów E1–E3 zastrzeżeń patentowych (OG-07: edycja części instrukcji, śledzenie postępu względem rzędu instrukcji).

### Warianty (od najmniejszego)
| Wariant | Co robi | Skąd „ile powinno być” | Ryzyko merytoryczne | Kombajn |
|---|---|---|---|---|
| U8-A | licznik oczek ma opcjonalne pole „ile oczek powinno być” (wpis z wzoru); pokazuje „48 / 64”, przy równości znak zgodności, powyżej różnicę | wpis użytkownika (S-46) | brak reguły; aplikacja tylko porównuje dwie liczby użytkownika | niski: jedno pole, jak F-08 |
| U8-B | U8-A + w planie F-06 „±k oczek w rzędzie zmiany” i liczba startowa: oczekiwana liczba po każdym rzędzie planu; kontrola z liczbą końcową wzoru | rachunek na danych użytkownika (N0 + k × liczba rzędów zmian do r) | niskie–średnie: błędne k (np. „each end” = 2) daje złą podpowiedź; rachunek, nie fakt | średni: formularz F-06 rośnie |
| U8-C | liczba z instrukcji rzędu (skróty, krotności) | parser + słownik skrótów (S-48) | wysokie: D-027, RYZ-03, 35 języków | wysoki |
| U8-D | liczby oczek wyciągnięte z PDF/zdjęcia (AI) | model na urządzeniu | wysokie: OG-07, OG-11, H-09 (brak dowodu potrzeby AI), niechęć do AI w recenzjach (`odkrywanie.md`, „Rynek”) | wysoki |

**Rekomendacja (P-1093):** U8-A. U8-B na liście odcięć (powrót: ≥3 prośby o oczekiwaną liczbę oczek przy przyrostach albo dane o użyciu U8-A); U8-C i U8-D: NIE (powrót tylko po nowej ocenie OG-07 i źródle terminologii OP-12).

## U9: zamiana włóczki i drutów z podpowiedzią
### Metoda (hierarchia P-017)
- Rachunek: łączny metraż wzoru `L = n × l_w` (n motków po l_w m) albo metraż podany wprost; motki nowej włóczki `n' = ⌈L / l_u⌉`; jednostki m/yd jak RD-03 (S-27).
- Organizacja (producent włóczek, szczebel 3, jedno źródło): „the only number you really need to know is the total yardage required for the project” [FAKT S-49]; najlepiej włóczka „with the same or similar gauge”, a w sklepie ta sama kategoria i próbka po zakupie [FAKT S-60].
- Norma (CYC, szczebel 1): system grubości to nie tabela zamienności; nawet w jednej kategorii „you must knit or crochet a gauge swatch to be sure”, a liczą się też miękkość i układanie [FAKT S-20, S-47]. Tabela CYC podaje próbki i zakresy drutów dla kategorii, z dopiskiem „GUIDELINES ONLY” [FAKT S-19]; **metrażu na kategorię nie podaje** (strona przeczytana 2026-11-28).
- Przykład właściciela [RACHUNEK]: wzór 50 g/210 m, 5 motków → 1050 m; włóczka 50 g/150 m → 1050 / 150 = 7 motków (350 g zamiast 250 g). 210/50 = 4,2 m/g wobec 150/50 = 3,0 m/g: nowa włóczka jest ok. 1,4 raza cięższa na metr, więc prawdopodobnie grubsza [OCENA; zależy od włókna], a wtedy próbka i liczba oczek się zmienią. Sam wynik „7 motków” wprowadzałby w błąd bez zdania o próbce.
- Podpowiedź rozmiaru drutów z metrów na gram: brak źródła szczebla 1–3 (CYC nie wiąże metrażu z kategorią) — [DO USTALENIA] (OP-39); rekomendacja: nie robić. Podpowiedź z **własnej próbki** jest możliwa: kategoria z próbki to RD-10 (już w aplikacji, F-38/BR-KAL-008), zakres drutów kategorii z S-19.

### Stan aplikacji (kontrakt zakresu)
- Jest: obliczenia podstawowe — oczka z próbki, jednostki, grubość z próbki ze zdaniem o braku zamienności (F-38: BR-KAL-001, -003, -008), zapas z metrażem i jednostkami (F-37, BR-ZAP-001).
- PÓŹNIEJ: przeliczenie wzoru na własną próbkę F-39 (RD-02; powrót: 1.1 albo ≥3 prośby), zużycie z wagi próbki F-42 (RD-07, OP-05).
- Konkurencja: narzędzie zamiany włóczki deklarują 2 z 20 opisów („yarn substitution tools”, „tools for yarn substitution”) i jedna recenzja innej aplikacji (`lookup` i strona App Store, 2026-11-28).

### Warianty (od najmniejszego)
| Wariant | Co robi | Podstawa | Ryzyko merytoryczne (06) |
|---|---|---|---|
| U9-A | Narzędzia → Obliczenia: „Zamiana włóczki”: metraż wzoru (albo motki × metraż) i metraż motka nowej włóczki → potrzebne motki (w górę) i metry; zawsze zdanie: kategoria i metraż nie gwarantują zamienności, zrób próbkę | rachunek, S-49, S-20/S-47, RD-03 | reguła krytyczna jak RD-07 (zakup włóczki = mienie): przegląd 06; bez domyślnego zapasu (OP-05 otwarte) |
| U9-B | U9-A + porównanie m/g obu włóczek („inna grubość — próbka konieczna”) i zakres drutów z własnej próbki (RD-10 → S-19) | S-19, RD-10 | próg „inna grubość” bez źródła → bez progu, tylko pokazanie obu wartości; zakres drutów z dopiskiem „GUIDELINES ONLY” |
| U9-C | U9-B + przeliczenie wzoru na własną próbkę (F-39, RD-02) i „czy starczy z zapasu” (metraż z F-37) | RD-02, BR-ZAP-001 | RD-02 krytyczna; OP-02 (zaokrąglanie do krotności motywu) otwarte |

**Rekomendacja (P-1094):** U9-A w 1.1, razem z powrotem F-39 i F-42 (jeden przegląd 06 dla trzech reguł zakupowych taniej niż trzy osobne) [OCENA]. U9-B: tylko część „drut z własnej próbki”, jeśli 03 uzna, że pasuje do ekranu grubości (F-38); podpowiedź z m/g: NIE. U9-C: 1.1+ według warunków F-39.

## Plan z szacunkiem (U8 i U9)
Analogie kosztów (rzeczywiste, `docs/koordynacja/koszty.md` na gałęzi `koordynacja`, odczyt 2026-11-28): 08 fix 1,48–4,06 USD (KA1, PE1, EB1), 08 build sonnet 0,68–3,29 (BX19–BX28), 07 fix 2,46 (PF1), 07 audit 2,31–3,53 (DG2, DG3, WR1), 04 fix/audit 6,13–6,15 (F, AV), 09 build 3,91 (6 kluczy × 34 języki, H), przegląd kadrów w językach 2,40–2,67 (WR4, WR5). 03 i 06: brak wierszy w tabeli — przyjmuję 2–4 USD [OCENA]. Czas sesji: 10–40 min każda. Wszystkie liczby niżej to [OCENA] z przedziałem ×0,7–1,5.

| Wariant | Role i kolejność | Agenci: czas / USD | Czeka na | Właściciel | Zasada 18 |
|---|---|---|---|---|---|
| U8-A | 03 (zmiana zakresu) → 04 (pole i stan licznika) → 05 (czy pole jest; jeśli nie: migracja w transakcji, zasada 10) → 07 (PU + test) → 08 (kod, migracja, test na kopii bazy) → 09 (2–4 klucze × 34) → 07/08 recenzja | 3–4 h / 18–28 | CI macOS e2e (1–2,5 h, okno poza ok. 14–23 UTC), build TestFlight | decyzja 5 min; test F 1 PU ok. 5 min | niski |
| U8-B | jak U8-A + 01 (reguła i wektory `brd.json`) + 06 (przegląd rachunku i tekstów) przed 04; 04 formularza F-06 | 6–9 h / 32–50 | jw. + ewentualne przejście poznawcze 04 | 2 decyzje; test F 2–3 PU ok. 15 min | średni (formularz F-06) |
| U8-C / U8-D | 01 + 06 (słownik skrótów, 35 języków) + 05 (parser/AI, OG-07) + 04 + 07 + 08 + 09 + prawna ocena OG-07 | ≥ 20 h / 90–160+ | źródło terminologii OP-12 | wiele decyzji, możliwy koszt prawny | wysoki |
| U9-A | 03 → 01 (reguła + wektory) → 06 (przegląd reguły krytycznej, D-027) → 04 (karta w Obliczeniach) → 07 → 08 (funkcja czysta + ekran; bez migracji, jeśli wynik nie jest zapisywany) → 09 (6–10 kluczy × 34) → 07/08 recenzja | 5–7 h / 26–40 | CI macOS, build | decyzja 5 min; test F 1–2 PU ok. 10 min | niski–średni (nowa karta w warstwie Narzędzia, poza pętlą) |
| U9-B (tylko drut z próbki) | + 01/06 dla zakresu drutów S-19, + 04 | +2–3 h / +10–15 | jw. | +5 min | niski |
| U9-C | + F-39 i F-42 (RD-02, RD-07; OP-02, OP-05 do rozstrzygnięcia u źródeł) | 10–14 h / 60–90 | rozstrzygnięcie OP-02, OP-05 | 2–3 decyzje, test F ok. 20 min | średni |

Wspólne: tłumaczenia 35 języków dokłada rola 09 w tej samej partii (koszt w tabeli); przegląd zrzutów w językach +2,5 USD, jeśli zmienia się ekran sklepu (tu nie). Ryzyko szacunku: sesje sonnet przekraczały pułap o 10–40% (koszty.md, WG-33).

**Rekomendacja wersji:** 1.0.2 bez U8 i U9 (nie opóźniać U1–U7). U8-A w 1.0.3 albo 1.1 — warunek wejścia do 1.0.2: rola 05 potwierdza, że licznik ma już pole celu i nie trzeba migracji. U9-A w 1.1 razem z F-39/F-42. Lista odcięć: U8-B, U8-C, U8-D, U9-B (część m/g), U9-C — z warunkami powrotu jak wyżej.

## Źródła nowe (S-46–S-60)
Szczebel według P-017. Przegląd dla faktów zmiennych.

| ID | Adres | Miejsce | Cytat | Odczyt | Szczebel | Przegląd |
|---|---|---|---|---|---|---|
| S-46 | https://www.craftyarncouncil.com/standards/how-to-read-crochet-pattern | sekcja o Row 1 | „Hint: Count the stitches at the end of every row. Most patterns tell you how many stitches you should have, and there are several ways of doing this. : 14 sc. (14 sc). —14 sc. These are all ways to show the number of stitches you should have.” | 2026-11-28 | 1 | — |
| S-47 | https://www.craftyarncouncil.com/standards/faqs | pytanie o zamienność kategorii 4 | „While it is a possible that two different yarns in one weight category can be interchanged, you must knit or crochet a gauge swatch to be sure.” | 2026-11-28 | 1 | 2027-11-28 |
| S-48 | https://www.craftyarncouncil.com/standards/knitting-abbreviations | tabela skrótów | „k2tog knit 2 stitches together; single right-leaning decrease”; „M1 or M1K make one stitch knitwise; single knit increase”; „S2KP2 … centered double decrease” | 2026-11-28 | 1 | — |
| S-49 | https://www.lionbrand.com/community/blog/?p=5245 („Did You Know...? All About Yardage”) | akapit 1 | „the only number you really need to know is the total yardage required for the project” | 2026-11-28 | 3 | — |
| S-50 | https://developer.apple.com/documentation/usernotifications/untimeintervalnotificationtrigger | Overview | „schedule the delivery of a local notification after the number of seconds you specify elapses” | 2026-11-28 | 1 | 2027-05-28 |
| S-51 | https://developer.apple.com/documentation/usernotifications/unnotificationinterruptionlevel/passive | opis | „The system adds the notification to the notification list without lighting up the screen or playing a sound.” | 2026-11-28 | 1 | 2027-05-28 |
| S-52 | https://developer.apple.com/documentation/watchkit/wkinterfacedevice/play(_:) | Discussion | „By default, you cannot play haptic feedback in the background. The only exception are apps with an active workout session.” | 2026-11-28 | 1 | 2027-05-28 |
| S-53 | https://developer.apple.com/documentation/watchkit/wkextendedruntimesession | Overview | „Each app can support a single type of extended runtime session: self care, mindfulness, physical therapy, or smart alarm.” | 2026-11-28 | 1 | 2027-05-28 |
| S-54 | https://support.apple.com/en-us/108369 | lista zasad | „If your iPhone is locked or asleep, you get notifications on your Apple Watch, unless your Apple Watch is locked.” | 2026-11-28 | 1 | 2027-05-28 |
| S-55 | https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities | ograniczenia | „A Live Activity can be active for up to eight hours unless its app or a person ends it before this limit.”; „a Live Activity remains on the Lock Screen for a maximum of 12 hours” | 2026-11-28 | 1 | 2027-05-28 |
| S-56 | https://developer.apple.com/documentation/activitykit/activitycontent/staledate | Discussion | „When time reaches the configured stale date, the system considers the Live Activity out of date” | 2026-11-28 | 1 | 2027-05-28 |
| S-57 | https://developer.apple.com/documentation/swiftui/text/init(timerinterval:pausetime:countsdown:showshours:) | opis | „Creates an instance that displays a timer counting within the provided interval.” | 2026-11-28 | 1 | 2027-05-28 |
| S-58 | https://developer.apple.com/design/human-interface-guidelines/notifications | Best practices | „Avoid sending multiple notifications for the same thing, even if someone hasn’t responded.”; „Avoid sending a notification that tells people to perform specific tasks within your app.” | 2026-11-28 | 1 | 2027-05-28 |
| S-59 | https://developer.apple.com/app-store/review/guidelines/ | 4.5.4; „Last Updated: October 16, 2026” | „Push Notifications must not be required for the app to function” | 2026-11-28 | 1 | 2027-05-28 |
| S-60 | https://www.lionbrand.com/community/blog/?p=11988 („3 Tips for Yarn Substitution”) | wskazówka 1 | „You’ll get the best results when you substitute a yarn with the same or similar gauge.” | 2026-11-28 | 3 | — |

Dokumentację Apple czytano z danych JSON strony (`developer.apple.com/tutorials/data/documentation/…json`), cytaty sprawdzone na surowym tekście; strony CYC, Lion Brand i support Apple — surowy HTML (`curl`) i `grep`.

## Otwarte (dla 03, 05, 06)
- [DO USTALENIA] (OP-35) przerysowanie Live Activity po `staleDate` bez działającej aplikacji (05/08, prototyp na urządzeniu).
- [DO WYJAŚNIENIA] (OP-36) wartości progu U7 (lista do wyboru) i domyślny stan włącznika (rekomendacja: wyłączony).
- [DO USTALENIA] (OP-38) czy licznik oczek ma już pole celu (05; decyduje o migracji i o wersji U8-A).
- [DO USTALENIA] (OP-39) związek metrów na gram z kategorią grubości: brak źródła szczebla 1–3; bez niego U9 nie podpowiada rozmiaru z etykiety.
- Propozycje do BRD (dla 03, bez wpisu w BRD do decyzji): hipoteza U8-A (cel oczek w liczniku oczek, J-02/J-04, S-46), hipoteza U9-A (zamiana po metrażu, J-08/J-09, S-49, S-47), ryzyko „fałszywe ‚dobrze/źle’ liczby oczek” (realny przy U8-C/U8-D, teoretyczny przy U8-A).
