# Inwentarz kryteriów akceptacji: wersja 1 (MVP)
Rola 07-jakość, E0 (pomocnik) · 2026-10-25 · Źródła: `docs/scope-contract.md`, `docs/brd/`, `tests/wektory/brd.json`, `docs/design/`, `docs/monetyzacja.md` z wektorami, `docs/tresci/`. Kwarantanna: nie czytano `archiwum/`, `app/`, `src/`, `lib/`, `tests/` (poza `tests/wektory/brd.json`), `scripts/`, `site/`, `.maestro/`. Ocena „sprawdzalne” i „poziom” to [OCENA] roli 07.

## Podsumowanie liczb
- **Uzupełnienie 2026-10-30 (07-jakosc-003):** BRD ma 269 scenariuszy (183 w tym inwentarzu + 86 dopisanych po 2026-10-25). Brakujące 86 są w `kryteria-uzupelnienie.json` z polem `pokrycie`: ID w teście (7), poziom reguły BR bez ID scenariusza w nazwie testu (57, do dopisania w 1.0.1) albo poza zakresem 1.0 (22). Kompletność pilnuje `docs/jakosc/narzedzia/kompletnosc-kryteriow.mjs`, uruchamiany testem `tests/jakosc/kompletnosc-kryteriow.test.ts`. Liczby poniżej dotyczą inwentarza E0 (220).
- Funkcje MVP w kontrakcie zakresu: **49** (docs/scope-contract.md:204 „MVP 49”).
- BR w zakresie: **71** = 67 z kolumny „Wymagania” funkcji MVP + 4 spoza tabeli (BR-ZAK-005, BR-ZAK-006, BR-ZAK-007 — blokery wydania, docs/brd/README.md:43; BR-DAN-012 — pętla opinii, docs/scope-contract.md:11).
- Kryteria razem: **220** = 183 scenariuszy BR + 13 NFR + 15 KP + 9 scenariuszy „tylko telefon”.
- Sprawdzalne (wszystkie kryteria): tak **159**, częściowo **56**, nie **5**. Same scenariusze BR: tak 143, częściowo 39, nie 1.
- Poziom sugerowany: domena-Node **70**, dane-node:sqlite **53**, ekran-RNTL **52**, E2E-symulator **26**, tylko-urządzenie **18**, — **1**. Wymaga symulatora albo urządzenia: **44** (E2E-symulator 26, tylko-urządzenie 18).
- BR w zakresie bez kryteriów (scenariuszy): **brak** (każde BR w zakresie ma co najmniej 1 scenariusz).
- Wektory: RD w `tests/wektory/brd.json` 102 w 18 regułach (README BRD podaje 71 w 13 RD na E4, docs/brd/README.md:28; po ER-11/ER-12 doszły RD-14–RD-18); limit L 17, S 10, Z 8; dostęp W 18, P 6; treści 175.

## Luki i sprzeczności (do decyzji koordynatora albo ER)
### Kryteria niesprawdzalne albo niejednoznaczne → propozycja brzmienia
- **BR-DNI-006/S1** (docs/brd/wymagania-dni.md:100): kolejność dla dwóch projektów z terminem: według celu na dziś malejąco? Reguła sortowania nie jest zapisana w RD-15 ani BR. Brzmienie: „projekty z terminem według celu na dziś malejąco, potem bez terminu według ostatniej pracy”
- **BR-LIC-004/S1** (docs/brd/wymagania-licznik.md:55): fizyczny dotyk kolana nie do odtworzenia; test: zdarzenie press na +1 w stanie zablokowanym nie zmienia wartości. Brzmienie: „Gdy licznik dostaje zdarzenie stuknięcia w przycisk +1”
- **BR-LIC-004/S2** (docs/brd/wymagania-licznik.md:59): „świadomy gest” nieokreślony; design: pasek „Counter locked · Unlock” (docs/design/design-spec.md:34). Brzmienie: „Gdy stuka Unlock na pasku blokady”
- **BR-LIC-005/S2** (docs/brd/wymagania-licznik.md:80): zakłada istnienie dźwięków i ustawienia ich wyłączenia; w design brak dźwięków i przełącznika (nie znaleziono w docs/design/design-spec.md). Brzmienie: „aplikacja nigdy nie odtwarza dźwięku przy +1” albo usunąć
- **BR-LIC-020/S2** (docs/brd/wymagania-licznik.md:296): niejednoznaczne: „wzór przypisany do zdarzenia” a F-48 „tylko dwa wzorce” (docs/scope-contract.md:58). Brzmienie: „wibruje wzorem przypomnienia (nie rzędu)”
- **BR-WZR-004/S1** (docs/brd/wymagania-projekt.md:247): odrzucenie dłoni tylko na iPadzie z Pencil; automat: konfiguracja PencilKit drawingPolicy = pencilOnly (P-042). Ryzyko szczątkowe (docs/scope-contract.md:219)
- **BR-WZR-007/S3** (docs/brd/wymagania-projekt.md:282): „nie ma treści wzoru” niemierzalne. Brzmienie: „strona zwraca 401/403 albo po zapisie nie ma tekstu ani obrazu”
- **NFR-DOS-002** (docs/brd/wymagania.md:101): bez progu brak wyroczni; propozycja: „0 obciętych i nakładających się tekstów przy AX5 na ekranach PR-01–06” wobec zrzutów wzorcowych (docs/design/design-spec.md:9)
- **NFR-WYD-001** (docs/brd/wymagania.md:105): budżet „po pomiarze bazowym” (docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md:30); propozycja: p95 z 20 powtórzeń ≤ pomiar bazowy × 1,2 jako regresja
- **NFR-KOS-001** (docs/brd/wymagania.md:121): przegląd usług w ADR, nie test automatyczny; propozycja: kontrola listy zależności sieciowych/usług w CI
- **TT-9** (docs/monetyzacja.md:593): krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia); OP-22 → ADR-0009

### Zakres i dokumenty niespójne
- BR-ZAK-005–007 i BR-DAN-012 są w wersji 1 (blokery, pętla opinii), ale nie ma ich w kolumnie „Wymagania” tabeli zakresu ani w przekazaniu dla 07 (docs/scope-contract.md:47, :219 wymienia tylko BR-ZAK-001–004). Propozycja: przypisać do F-35 / F-57 przez bramkę `zmiany-zakresu`.
- Tabela „tylko telefon” (docs/monetyzacja.md:581–593) pochodzi z sesji 2 (model B): oczekiwanie „Pro znika, dane do odczytu” (:591, :592) przeczy KP-02 V4 (docs/monetyzacja.md:51: dane, historia, eksport zawsze dostępne). Brak scenariuszy TestFlight dla subskrypcji (W-15–W-18). ER do 02.
- P-041 (testy tylko automatyczne, docs/scope-contract.md:219) a scenariusze „tylko telefon” jako krok właściciela (docs/monetyzacja.md:581): sprzeczność metody do rozstrzygnięcia przez koordynatora.
- Przekazanie 02 → 07 mówi „L-01–L-15” i „14 z 14 wektorów” (docs/monetyzacja.md:88, :31), a `wektory-limitu.json` ma 17 wektorów startDnia (L-01…L-18 bez L-07, L-13; z L-04b) + S-01–S-10 + Z-01–Z-08. L-07 i L-13 nie mają wektora (opis pliku: docs/monetyzacja/wektory-limitu.json:2), choć BR je cytują (wymagania-dane.md:62, :194, :273).
- RD-10: tekst reguły „luka (np. 25,5) daje poza tabelą” (docs/brd/reguly.md:157) przeczy P-084 i wektorowi treści KL4-25_5 → kategoria 2 (docs/tresci/wektory.json; docs/decyzje.md:90). ER do 01; wyrocznią dla testów klasyfikacji są wektory treści.
- OP-03 w BRD otwarte (docs/brd/README.md:103, wymagania-narzedzia.md:90), a rozstrzygnięte w P-081 P3a (docs/decyzje.md:87). BR-KAL-003/S1 do aktualizacji przez 01.
- BR-LIC-012 (tryb „rząd w trakcie”, F-09) a design: ekran licznika zawsze pokazuje „Now knitting row N” obok liczby skończonych (docs/design/design-spec.md:30). Czy ustawienie F-09 zostaje? 04/03.
- BR-LIC-005/S2 zakłada dźwięki aplikacji i ich wyłączenie; w design brak dźwięków i przełącznika (nie znaleziono). 01/04.
- BR-LIC-020/S2 („wzór przypisany do zdarzenia”) a F-48 „tylko dwa wzorce” (docs/scope-contract.md:58).
- NFR-DOS-002 i NFR-WYD-001 bez progu (OP-16, OP-17; docs/brd/README.md:116–117); budżety wydajności „po pomiarze bazowym” (docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md:25–36).
- OP-33 (chwila prośby o ocenę, docs/brd/README.md:123) otwarte; przejście poznawcze sugeruje kolejne uruchomienie (docs/design/przejscie/wynik.md:30).
- OP-21 (zwrot w piaskownicy bez Xcode, docs/monetyzacja.md:971) i OP-22 (Pro na zegarku, docs/brd/README.md:120; ADR-0009 go wymienia — nie czytano treści) otwarte.
- U-1–U-12 (uproszczenia przepływów) zdefiniowane tylko w prywatnym `oczko-warsztat` (docs/scope-contract.md:8): w `docs/` nie znaleziono ich treści, więc kryteria intuicyjności odwołujące się do U-n nie mają wyroczni w tym repo.

### Stany ekranów brakujące w design
Macierz stanów (docs/design/design-spec.md:51–57) i zrzuty wzorcowe: 7 stanów × 12 wariantów = 84 pliki (`docs/design/wzorce-zrzuty/`: licznik-start, licznik-w-toku, limit, limit-zawczasu, oferty, projekty, ukonczenie; 320/390/430 pt × jasny/ciemny × domyślny/AX5).
- Stany w macierzy bez zrzutu wzorcowego (tylko prototyp albo tekst): licznik zablokowany, seria stuknięć z banerem, błąd zapisu („do E4”), offline; projekty pusty i brak wyników; oferty z aktywną subskrypcją („do E4”) i bez sieci; ukończenie bez włóczki w zapasie (docs/design/design-spec.md:54–57).
- Ekrany nienarysowane (docs/design/design-spec.md:95): wzór i licznik poziomo (F-25, F-26, F-56), zegarek (F-12), ekran blokady (F-11, F-21), kalendarz i podsumowanie (F-59), Ustawienia (eksport, kopia, polityka, „Oceń”, „Zgłoś problem”).
- Stany wymagane przez BR, których nie znaleziono w macierzy: cel osiągnięty i „ponad cel” (BR-LIC-011), przypomnienie 5 z 5 / koniec serii (BR-LIC-009), ostatni darmowy dzień — tylko tekst (BR-ZAK-006/S6, design-spec.md:18), zegarek na limicie (BR-ZAK-005/S13), konflikt synchronizacji (BR-DAN-002/S2), nieudana migracja (BR-DAN-003/S2), import „scal / zastąp” i plik nierozpoznany (BR-DAN-006), „Recently deleted” (BR-DAN-008), stan danych sync/zegarek (BR-DAN-011), podgląd „Zgłoś problem” (BR-DAN-010), błąd wpisania wartości (BR-LIC-017/S7), bliźniak i cel z pierwszej części (BR-PRJ-014), korekta sesji z błędem (BR-PRJ-013/S3), błąd importu wzoru i strony (BR-WZR-001/S2, BR-WZR-007/S3), błędy obliczeń (BR-KAL-001/S2–S3), postęp bez celów (BR-DNI-004/S3), termin minął (BR-DNI-005/S4, BR-DNI-006/S2), karta bez stopera (BR-PRJ-015/S3).
- Przejście poznawcze: 5 zadań z1–z5 (docs/design/przejscie/wynik.md:4–12); intuicyjność „czeka na 04” dla F-25/F-26, F-12, F-11/F-21, F-59 (wynik.md:25).

## Blokery wydania (docs/brd/README.md:35–48) w zakresie
NFR-DAN-001/BR-DAN-003; NFR-DAN-002/BR-DAN-001; NFR-DAN-003/BR-DAN-002; BR-DAN-004–006; BR-LIC-001–003; BR-ZAK-001; BR-ZAK-005–007; BR-ZAK-002, NFR-PRY-001, BR-ZAK-004; NFR-ZEG-001 (F-12 w MVP); BR-KAL-001, -003, -008 (przegląd 06 wykonany: docs/tresci/README.md:2; BR-KAL-002, -004–007 i BR-SLO-001 poza zakresem); BR-WZR-001–005, -007, -008 (porównanie z patentami OG-07: reguła w docs/design/design-spec.md:83, makieta F-25 do ponownego przejścia); OG-05 (opis sklepu tylko z funkcjami wydania — przegląd, nie test).

## Reguły RD i wektory
| RD | Nazwa | Krytyczna | Wektory | ID | BR | W zakresie | Plik |
|---|---|---|---|---|---|---|---|
| RD-01 | Liczba oczek na szerokość z próbki | tak | 5 | RD-01-W1…RD-01-W5 | BR-KAL-001 | tak | docs/brd/reguly.md:9 |
| RD-02 | Przeliczenie liczby oczek wzoru na własną próbkę | tak | 6 | RD-02-W1…RD-02-W6 | BR-KAL-002 | nie | docs/brd/reguly.md:25 |
| RD-03 | Przeliczenia jednostek długości i masy | tak | 7 | RD-03-W1…RD-03-W7 | BR-KAL-003, BR-ZAP-001 | tak | docs/brd/reguly.md:42 |
| RD-04 | Próbka podana na 4 cale przeliczona na 10 cm | tak | 6 | RD-04-W1…RD-04-W6 | BR-KAL-003 | tak | docs/brd/reguly.md:59 |
| RD-05 | Równomierne dodawanie k oczek na N oczkach (okrążenie) | nie | 6 | RD-05-W1…RD-05-W6 | BR-KAL-004 | nie | docs/brd/reguly.md:76 |
| RD-06 | Równomierne ujmowanie k oczek na N oczkach (okrążenie) | nie | 5 | RD-06-W1…RD-06-W5 | BR-KAL-004 | nie | docs/brd/reguly.md:92 |
| RD-07 | Zużycie włóczki z wagi próbki | tak | 5 | RD-07-W1…RD-07-W5 | BR-KAL-005 | nie | docs/brd/reguly.md:107 |
| RD-08 | Długość na drutach przy zmianie po blokowaniu | tak | 5 | RD-08-W1…RD-08-W5 | BR-KAL-006 | nie | docs/brd/reguly.md:123 |
| RD-09 | Kategoria dopasowania z luzu w obwodzie klatki | nie | 6 | RD-09-W1…RD-09-W6 | BR-KAL-007 | nie | docs/brd/reguly.md:138 |
| RD-10 | Kategoria grubości włóczki z próbki dżersejowej | tak | 6 | RD-10-W1…RD-10-W6 | BR-KAL-008, BR-ZAP-001 | tak | docs/brd/reguly.md:154 |
| RD-11 | Rozmiar drutu w mm na numer US | nie | 4 | RD-11-W1…RD-11-W4 | BR-PRJ-004, BR-ZAP-003 | tak | docs/brd/reguly.md:170 |
| RD-12 | Numer powtórzenia i rząd w powtórzeniu | nie | 5 | RD-12-W1…RD-12-W5 | BR-LIC-007 | tak | docs/brd/reguly.md:184 |
| RD-13 | Przypomnienie „co N rzędów, M razy, od rzędu s” | nie | 5 | RD-13-W1…RD-13-W5 | BR-LIC-009, BR-LIC-010 | tak | docs/brd/reguly.md:199 |
| RD-14 | Postęp projektu w procentach | nie | 6 | RD-14-W1…RD-14-W6 | BR-DNI-004 | tak | docs/brd/reguly.md:216 |
| RD-15 | Cel dzienny do terminu i wykonanie dnia | nie | 7 | RD-15-W1…RD-15-W7 | BR-DNI-001, BR-DNI-005, BR-DNI-006, BR-LIC-017 | tak | docs/brd/reguly.md:233 |
| RD-16 | Dzień zmiany w strefie czasowej urządzenia | nie | 6 | RD-16-W1…RD-16-W6 | BR-DNI-001, BR-DNI-002 | tak | docs/brd/reguly.md:251 |
| RD-17 | Strażnik stuknięć: seria dodań do sprawdzenia | nie | 6 | RD-17-W1…RD-17-W6 | BR-LIC-019 | tak | docs/brd/reguly.md:267 |
| RD-18 | Szacunek „zdążę?” z własnego tempa | nie | 6 | RD-18-W1…RD-18-W6 | BR-DNI-007 | nie | docs/brd/reguly.md:283 |

## Wektory kontraktu płatności i treści
| Plik | Grupa | Liczba | ID | Dotyczy |
|---|---|---|---|---|
| docs/monetyzacja/wektory-limitu.json:7 | startDnia | 17 | L-01, L-02, L-03, L-04, L-04b, L-05, L-06, L-08, L-09, L-10, L-11, L-12, L-14, L-15, L-16, L-17, L-18 | BR-ZAK-005, -007, BR-LIC-017, BR-DNI-001; KP-12, KP-15 |
| docs/monetyzacja/wektory-limitu.json:622 | wolaStraznika | 10 | S-01…S-10 | KP-12, BR-ZAK-005 (P-067) |
| docs/monetyzacja/wektory-limitu.json:724 | mozeZaczacDzien | 8 | Z-01…Z-08 | KP-13, BR-ZAK-006, NFR-PIE-001 |
| docs/monetyzacja/wektory-dostepu.json:11 | decyzja | 18 | W-01…W-18 | BR-ZAK-001, -003, -007; KP-02, -03, -06 |
| docs/monetyzacja/wektory-dostepu.json:423 | odczytajPamiec | 6 | P-01…P-06 | KP-06 |
| docs/tresci/wektory.json:4 | klasyfikacja_4in | 88 | KL4-5_4…KL4--1 | RD-10, P-084; BR-KAL-008, BR-ZAP-004 |
| docs/tresci/wektory.json:1526 | klasyfikacja_10cm | 18 | KL10-6…KL10-40 | RD-04 + RD-10, P-084 (P3a); BR-KAL-003, -008 |
| docs/tresci/wektory.json:1851 | jednostki | 8 | JW-in-4…JW-in-minus1 | RD-03; BR-ZAP-001, BR-KAL-003 |
| docs/tresci/wektory.json:1930 | druty | 31 | DRT-M01500…druty-poza-0 | RD-11; BR-PRJ-004, BR-ZAP-003 |
| docs/tresci/wektory.json:2178 | szydelka | 30 | SZD-M02250…szydelka-poza-0 | RD-11 (szydełka zwykłe); BR-PRJ-004, BR-ZAP-003 |

## Kryteria (pełna lista; JSON: `kryteria.json`)
| ID | BR | F | Moduł | Tytuł | Sprawdzalne | Wyrocznia | Poziom | Uwagi | Plik:linia |
|---|---|---|---|---|---|---|---|---|---|
| BR-DAN-001/S1 | BR-DAN-001 | F-31 | dane | Baza na urządzeniu jest źródłem prawdy: Brak sieci | tak | NFR-DAN-002 | E2E-symulator | zabicie procesu po każdej zmianie; logika zapisu też w dane-node (ADR-0002) | docs/brd/wymagania-dane.md:9 |
| BR-DAN-002/S1 | BR-DAN-002 | F-27 | dane | Opcjonalna synchronizacja przez iCloud: Drugie urządzenie | czesciowo | NFR-DAN-003 | dane-node:sqlite | symulowany transport; prawdziwy iCloud: ryzyko szczątkowe (docs/brd/wymagania.md:84) | docs/brd/wymagania-dane.md:18 |
| BR-DAN-002/S2 | BR-DAN-002 | F-27 | dane | Opcjonalna synchronizacja przez iCloud: Konflikt | tak | NFR-DAN-003 | dane-node:sqlite |  | docs/brd/wymagania-dane.md:22 |
| BR-DAN-002/S3 | BR-DAN-002 | F-27 | dane | Opcjonalna synchronizacja przez iCloud: Synchronizacja wyłączona | tak | NFR-PRY-001 | dane-node:sqlite | szpieg adaptera sieci: 0 wywołań | docs/brd/wymagania-dane.md:26 |
| BR-DAN-003/S1 | BR-DAN-003 | F-31 | dane | Dane przetrwają aktualizację: Nowa wersja | tak | NFR-DAN-001 | dane-node:sqlite | test migracji w transakcji na kopii bazy; wyjątek P-070 (0.1.0 bez migracji) | docs/brd/wymagania-dane.md:35 |
| BR-DAN-003/S2 | BR-DAN-003 | F-31 | dane | Dane przetrwają aktualizację: Nieudana migracja | tak | NFR-DAN-001 | dane-node:sqlite | wstrzyknięty błąd migracji; komunikat zamiast pustej listy (RNTL) | docs/brd/wymagania-dane.md:39 |
| BR-DAN-004/S1 | BR-DAN-004 | F-32 | dane | Dane na nowym telefonie: Odtworzenie z kopii urządzenia | czesciowo | OG-10 | tylko-urządzenie | odtworzenie z kopii iCloud tylko urządzenie; automat: plik bazy w katalogu objętym kopią (bez isExcludedFromBackup) | docs/brd/wymagania-dane.md:48 |
| BR-DAN-005/S1 | BR-DAN-005 | F-32 | dane | Eksport wszystkich danych: Pełny eksport | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-dane.md:57 |
| BR-DAN-005/S2 | BR-DAN-005 | F-32 | dane | Eksport wszystkich danych: Bez Pro, na limicie | tak | L-07 (S-09), KP-02 | domena-Node |  | docs/brd/wymagania-dane.md:61 |
| BR-DAN-006/S1 | BR-DAN-006 | F-32 | dane | Import własnego eksportu: Pełny obieg | tak | brak | dane-node:sqlite | obieg eksport → import, porównanie rekordów | docs/brd/wymagania-dane.md:70 |
| BR-DAN-006/S2 | BR-DAN-006 | F-32 | dane | Import własnego eksportu: Plik z innej aplikacji | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-dane.md:74 |
| BR-DAN-006/S3 | BR-DAN-006 | F-32 | dane | Import własnego eksportu: Zastąpienie danych na niepustej bazie (ER-22) | tak | P-047 | dane-node:sqlite |  | docs/brd/wymagania-dane.md:78 |
| BR-DAN-006/S4 | BR-DAN-006 | F-32 | dane | Import własnego eksportu: Scalenie bez nadpisania (ER-22) | tak | P-047 | dane-node:sqlite |  | docs/brd/wymagania-dane.md:82 |
| BR-DAN-006/S5 | BR-DAN-006 | F-32 | dane | Import własnego eksportu: Rezygnacja z importu (ER-22) | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-dane.md:86 |
| BR-DAN-008/S1 | BR-DAN-008 | F-33 | dane | Usunięcie z możliwością przywrócenia: Przywrócenie | tak | P-026 | dane-node:sqlite | zegar wstrzykiwany | docs/brd/wymagania-dane.md:121 |
| BR-DAN-008/S2 | BR-DAN-008 | F-33 | dane | Usunięcie z możliwością przywrócenia: Okres przechowywania | tak | P-026 | dane-node:sqlite | informacja o terminie przy usuwaniu → RNTL | docs/brd/wymagania-dane.md:125 |
| BR-DAN-008/S3 | BR-DAN-008 | F-33 | dane | Usunięcie z możliwością przywrócenia: Usunięty licznik (ER-22) | tak | P-047 | dane-node:sqlite |  | docs/brd/wymagania-dane.md:129 |
| BR-DAN-008/S4 | BR-DAN-008 | F-33 | dane | Usunięcie z możliwością przywrócenia: Usunięta część (ER-22) | tak | P-047 | dane-node:sqlite |  | docs/brd/wymagania-dane.md:133 |
| BR-DAN-009/S1 | BR-DAN-009 | F-34 | dane | Usunięcie wszystkich danych: Usunięcie na żądanie | czesciowo | KP-05 | dane-node:sqlite | usunięcie w iCloud: mock CloudKit; prawdziwe konto: ryzyko szczątkowe | docs/brd/wymagania-dane.md:142 |
| BR-DAN-010/S1 | BR-DAN-010 | F-57 | dane | Zgłoś problem z diagnostyką lokalną: Podgląd przed wysłaniem | tak | NFR-PRY-001 | ekran-RNTL | lista pól diagnostyki i brak treści projektów | docs/brd/wymagania-dane.md:151 |
| BR-DAN-010/S2 | BR-DAN-010 | F-57 | dane | Zgłoś problem z diagnostyką lokalną: Wysyłka wybranym kanałem | czesciowo | brak | ekran-RNTL | arkusz udostępniania systemowy: mock; „nie wysyła niczego sama” → szpieg sieci | docs/brd/wymagania-dane.md:155 |
| BR-DAN-010/S3 | BR-DAN-010 | F-57 | dane | Zgłoś problem z diagnostyką lokalną: Rezygnacja | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-dane.md:159 |
| BR-DAN-011/S1 | BR-DAN-011 | F-58 | dane | Widoczny stan synchronizacji i zegarka: Synchronizacja wstrzymana | tak | brak | ekran-RNTL | stan wstrzyknięty | docs/brd/wymagania-dane.md:182 |
| BR-DAN-011/S2 | BR-DAN-011 | F-58 | dane | Widoczny stan synchronizacji i zegarka: Zegarek nie odpowiada | tak | brak | ekran-RNTL |  | docs/brd/wymagania-dane.md:186 |
| BR-DAN-012/S1 | BR-DAN-012 | — | dane | Prośba o ocenę i odnośnik „Oceń”: Prośba po ukończeniu projektu | czesciowo | S-39; OG-15 | ekran-RNTL | mock requestReview: 1 wywołanie po zamknięciu karty; czy system pokaże: poza kontrolą. Chwila prośby: OP-33 otwarte (docs/brd/README.md:123) | docs/brd/wymagania-dane.md:201 |
| BR-DAN-012/S2 | BR-DAN-012 | — | dane | Prośba o ocenę i odnośnik „Oceń”: Nigdy w trakcie pracy ani przy płatnościach | tak | brak | ekran-RNTL | 0 wywołań w wymienionych czynnościach | docs/brd/wymagania-dane.md:205 |
| BR-DAN-012/S3 | BR-DAN-012 | — | dane | Prośba o ocenę i odnośnik „Oceń”: „Oceń” w Ustawieniach | tak | S-39 | ekran-RNTL | mock Linking: URL z action=write-review | docs/brd/wymagania-dane.md:209 |
| BR-ZAK-001/S1 | BR-ZAK-001 | F-35 | zakup i limit | Przywrócenie zakupu: Reinstalacja | czesciowo | W-02 | domena-Node | logika dostępu w Node; realna reinstalacja: TestFlight (docs/monetyzacja.md:586) | docs/brd/wymagania-dane.md:223 |
| BR-ZAK-001/S2 | BR-ZAK-001 | F-35 | zakup i limit | Przywrócenie zakupu: Brak sieci | tak | W-03, W-18; L-10 (L-13 opisowy, docs/monetyzacja.md:156) | domena-Node | L-13 nie ma wektora w wektory-limitu.json (opis pliku: poza funkcją) | docs/brd/wymagania-dane.md:227 |
| BR-ZAK-001/S3 | BR-ZAK-001 | F-35 | zakup i limit | Przywrócenie zakupu: iPad z tym samym kontem Apple | czesciowo | W-09; KP-08 | domena-Node | TestFlight (docs/monetyzacja.md:588) | docs/brd/wymagania-dane.md:231 |
| BR-ZAK-001/S4 | BR-ZAK-001 | F-35 | zakup i limit | Przywrócenie zakupu: Zegarek bez telefonu w pobliżu (jeśli zegarek jest w wydaniu) | czesciowo | L-10, L-18; OP-22 | tylko-urządzenie | odczyt Pro na zegarku: ADR-0009; brak wektora W dla zegarka | docs/brd/wymagania-dane.md:235 |
| BR-ZAK-001/S5 | BR-ZAK-001 | F-35 | zakup i limit | Przywrócenie zakupu: Członek rodziny w Family Sharing | czesciowo | W-10 | tylko-urządzenie | Family Sharing tylko TestFlight (docs/monetyzacja.md:591) | docs/brd/wymagania-dane.md:239 |
| BR-ZAK-001/S6 | BR-ZAK-001 | F-35 | zakup i limit | Przywrócenie zakupu: Odebranie z Family Sharing | czesciowo | W-14; KP-02 | domena-Node | realne odebranie: TestFlight | docs/brd/wymagania-dane.md:243 |
| BR-ZAK-002/S1 | BR-ZAK-002 | F-36 | zakup i limit | Bez reklam i śledzenia: Bez Pro | czesciowo | NFR-PRY-001; KP-11 | dane-node:sqlite | przegląd zależności (lista SDK) + szpieg sieci w testach; etykieta App Privacy: rola 10 | docs/brd/wymagania-dane.md:252 |
| BR-ZAK-003/S1 | BR-ZAK-003 | F-35 | zakup i limit | Aktualizacja nie zabiera Pro ani darmowego limitu: Aktualizacja w okresie Pro | tak | W-15/W-17; KP-01 | domena-Node |  | docs/brd/wymagania-dane.md:261 |
| BR-ZAK-003/S2 | BR-ZAK-003 | F-35 | zakup i limit | Aktualizacja nie zabiera Pro ani darmowego limitu: Aktualizacja bez Pro | tak | KP-01 (LIMIT_DNI ≥ poprzednie wydanie) | domena-Node | kontrola przed wydaniem: porównanie LIMIT_DNI i listy „zawsze działa” z poprzednim tagiem | docs/brd/wymagania-dane.md:265 |
| BR-ZAK-004/S1 | BR-ZAK-004 | F-36 | zakup i limit | Polityka prywatności w aplikacji: Dostęp do polityki | tak | KP-04 | ekran-RNTL |  | docs/brd/wymagania-dane.md:274 |
| BR-ZAK-005/S1 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Pierwszy dzień miesiąca (L-01) | tak | L-01 | domena-Node |  | docs/brd/wymagania-dane.md:301 |
| BR-ZAK-005/S2 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Rozpoczęty dzień do końca (L-02) | tak | L-02 | domena-Node |  | docs/brd/wymagania-dane.md:305 |
| BR-ZAK-005/S3 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Praca po północy (L-04, L-04b) | tak | L-04, L-04b | domena-Node |  | docs/brd/wymagania-dane.md:309 |
| BR-ZAK-005/S4 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Nowy dzień ponad limit (L-03) | tak | L-03; Z-02 | domena-Node |  | docs/brd/wymagania-dane.md:314 |
| BR-ZAK-005/S5 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Ręczne wpisanie w nowym dniu ponad limit (L-08) | tak | L-08; S-06 | domena-Node |  | docs/brd/wymagania-dane.md:318 |
| BR-ZAK-005/S6 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Cofnięcie nie zwraca dnia (L-06) | tak | L-06 | domena-Node |  | docs/brd/wymagania-dane.md:322 |
| BR-ZAK-005/S7 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Dane bez limitu (L-07) | tak | S-09 (L-07 opisowy) | domena-Node | L-07 nie ma wektora startDnia; pokrywa S-09 + test „kalkulator nie woła strażnika” | docs/brd/wymagania-dane.md:326 |
| BR-ZAK-005/S8 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Nowy miesiąc (L-05) | tak | L-05 | domena-Node |  | docs/brd/wymagania-dane.md:330 |
| BR-ZAK-005/S9 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Pro (L-10) | tak | L-10 | domena-Node |  | docs/brd/wymagania-dane.md:334 |
| BR-ZAK-005/S10 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Ten sam dzień na dwóch urządzeniach (L-11) | tak | L-11 | domena-Node |  | docs/brd/wymagania-dane.md:338 |
| BR-ZAK-005/S11 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Licznik oczek zaczyna dzień (S-02) | tak | S-02 | domena-Node |  | docs/brd/wymagania-dane.md:342 |
| BR-ZAK-005/S12 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Korekty na limicie (S-07, S-08) | tak | S-07, S-08 | domena-Node |  | docs/brd/wymagania-dane.md:346 |
| BR-ZAK-005/S13 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Zegarek bez telefonu na limicie (L-18) | czesciowo | L-18 | domena-Node | reguła w Node; UI zegarka E2E para symulatorów albo urządzenie | docs/brd/wymagania-dane.md:350 |
| BR-ZAK-005/S14 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Dzień zaczęty przed synchronizacją nowego urządzenia (L-16, L-17) | tak | L-16, L-17; KP-15 | domena-Node |  | docs/brd/wymagania-dane.md:354 |
| BR-ZAK-005/S15 | BR-ZAK-005 | — | zakup i limit | Limit dni i strażnik startu dnia: Zegar z przyszłości (L-15) | tak | L-15 | domena-Node |  | docs/brd/wymagania-dane.md:358 |
| BR-ZAK-006/S1 | BR-ZAK-006 | — | zakup i limit | Komunikat na limicie i miejsca ekranu zakupu: Limit widoczny przed pierwszym rzędem dnia | tak | Z-02; KP-13; tekst docs/design/design-spec.md:16 | ekran-RNTL | zrzut wzorcowy `limit-zawczasu` | docs/brd/wymagania-dane.md:369 |
| BR-ZAK-006/S2 | BR-ZAK-006 | — | zakup i limit | Komunikat na limicie i miejsca ekranu zakupu: Praca po północy bez przerwy (L-04) | tak | Z-03; L-04 | ekran-RNTL |  | docs/brd/wymagania-dane.md:374 |
| BR-ZAK-006/S3 | BR-ZAK-006 | — | zakup i limit | Komunikat na limicie i miejsca ekranu zakupu: Nowy dzień zaczął się przy otwartej aplikacji (przypadek brzegowy) | tak | L-03; tekst docs/design/design-spec.md:17 | ekran-RNTL | zrzut wzorcowy `limit` | docs/brd/wymagania-dane.md:378 |
| BR-ZAK-006/S4 | BR-ZAK-006 | — | zakup i limit | Komunikat na limicie i miejsca ekranu zakupu: Bez oferty w trakcie pracy | tak | KP-10, KP-13 | E2E-symulator | przejście przepływów bez ekranu zakupu | docs/brd/wymagania-dane.md:383 |
| BR-ZAK-006/S5 | BR-ZAK-006 | — | zakup i limit | Komunikat na limicie i miejsca ekranu zakupu: Licznik dni | tak | Z-07; KP-13 | ekran-RNTL |  | docs/brd/wymagania-dane.md:387 |
| BR-ZAK-006/S6 | BR-ZAK-006 | — | zakup i limit | Komunikat na limicie i miejsca ekranu zakupu: Ostatni darmowy dzień | tak | Z-06 | ekran-RNTL | brak zrzutu wzorcowego (tekst w docs/design/design-spec.md:18) | docs/brd/wymagania-dane.md:391 |
| BR-ZAK-006/S7 | BR-ZAK-006 | — | zakup i limit | Komunikat na limicie i miejsca ekranu zakupu: Aktywna subskrypcja | czesciowo | W-15; KP-03, KP-14 | ekran-RNTL | showManageSubscriptions: mock; stan „do E4” w macierzy (docs/design/design-spec.md:56) | docs/brd/wymagania-dane.md:395 |
| BR-ZAK-007/S1 | BR-ZAK-007 | — | zakup i limit | Utrata Pro: Wygaśnięcie w trakcie miesiąca (L-09) | tak | L-09 | domena-Node |  | docs/brd/wymagania-dane.md:428 |
| BR-ZAK-007/S2 | BR-ZAK-007 | — | zakup i limit | Utrata Pro: Dane po utracie Pro | tak | W-05, W-06, W-16; KP-02 | domena-Node | tabela „tylko telefon” (docs/monetyzacja.md:591–592) ma oczekiwanie „dane do odczytu” z modelu B — sprzeczne z KP-02 V4 | docs/brd/wymagania-dane.md:432 |
| BR-DNI-001/S1 | BR-DNI-001 | F-59 | dni i postęp | Kalendarz dni z robótką: Dzień z robótką | tak | RD-16 | dane-node:sqlite |  | docs/brd/wymagania-dni.md:12 |
| BR-DNI-001/S2 | BR-DNI-001 | F-59 | dni i postęp | Kalendarz dni z robótką: Cofnięte i wpisane zmiany | tak | RD-15 | dane-node:sqlite |  | docs/brd/wymagania-dni.md:16 |
| BR-DNI-001/S3 | BR-DNI-001 | F-59 | dni i postęp | Kalendarz dni z robótką: Dzień z robótką a dzień limitu (ER-27, P-059) | tak | RD-15, RD-16; L-04, L-06 | dane-node:sqlite |  | docs/brd/wymagania-dni.md:20 |
| BR-DNI-001/S4 | BR-DNI-001 | F-59 | dni i postęp | Kalendarz dni z robótką: Bez serii i ponagleń | tak | P-043 | ekran-RNTL | asercja negatywna + brak zaplanowanych powiadomień | docs/brd/wymagania-dni.md:25 |
| BR-DNI-002/S1 | BR-DNI-002 | F-59 | dni i postęp | Dzień: projekty, rzędy i czas: Szczegóły dnia | tak | brak (wartości w scenariuszu) | dane-node:sqlite |  | docs/brd/wymagania-dni.md:47 |
| BR-DNI-002/S2 | BR-DNI-002 | F-59 | dni i postęp | Dzień: projekty, rzędy i czas: Dzień w strefie urządzenia (ER-24) | tak | RD-16-W1 | domena-Node | strefa czasowa wstrzykiwana | docs/brd/wymagania-dni.md:51 |
| BR-DNI-003/S1 | BR-DNI-003 | F-59 | dni i postęp | Podsumowanie tygodnia i miesiąca: Tydzień z porównaniem | tak | brak (wartości w scenariuszu) | dane-node:sqlite | początek tygodnia z regionu (Intl/CLDR, ADR-0017) | docs/brd/wymagania-dni.md:68 |
| BR-DNI-003/S2 | BR-DNI-003 | F-59 | dni i postęp | Podsumowanie tygodnia i miesiąca: Czas bez stopera | tak | brak | ekran-RNTL |  | docs/brd/wymagania-dni.md:73 |
| BR-DNI-004/S1 | BR-DNI-004 | F-60 | dni i postęp | Postęp projektu w procentach: Postęp z części | tak | RD-14-W1 | domena-Node |  | docs/brd/wymagania-dni.md:86 |
| BR-DNI-004/S2 | BR-DNI-004 | F-60 | dni i postęp | Postęp projektu w procentach: Część ponad cel | tak | RD-14-W4 | domena-Node |  | docs/brd/wymagania-dni.md:90 |
| BR-DNI-004/S3 | BR-DNI-004 | F-60 | dni i postęp | Postęp projektu w procentach: Brak celów | tak | RD-14-W6 | ekran-RNTL |  | docs/brd/wymagania-dni.md:94 |
| BR-DNI-005/S1 | BR-DNI-005 | F-61 | dni i postęp | Termin projektu i cel dzienny: Cel dnia | tak | RD-15-W1 | domena-Node |  | docs/brd/wymagania-dni.md:103 |
| BR-DNI-005/S2 | BR-DNI-005 | F-61 | dni i postęp | Termin projektu i cel dzienny: Cel stały w ciągu dnia | tak | RD-15 | domena-Node |  | docs/brd/wymagania-dni.md:107 |
| BR-DNI-005/S3 | BR-DNI-005 | F-61 | dni i postęp | Termin projektu i cel dzienny: Prucie dziś | tak | RD-15 | domena-Node |  | docs/brd/wymagania-dni.md:111 |
| BR-DNI-005/S4 | BR-DNI-005 | F-61 | dni i postęp | Termin projektu i cel dzienny: Po terminie | tak | RD-15-W4 | domena-Node |  | docs/brd/wymagania-dni.md:115 |
| BR-DNI-005/S5 | BR-DNI-005 | F-61 | dni i postęp | Termin projektu i cel dzienny: Bez terminu nic na ekranie licznika | tak | P-046 | ekran-RNTL |  | docs/brd/wymagania-dni.md:119 |
| BR-DNI-006/S1 | BR-DNI-006 | F-61 | dni i postęp | Który projekt dziś: kolejność według terminu: Projekty z terminem na górze | czesciowo | RD-15 | dane-node:sqlite | kolejność dla dwóch projektów z terminem: według celu na dziś malejąco? Reguła sortowania nie jest zapisana w RD-15 ani BR. Brzmienie: „projekty z terminem według celu na dziś malejąco, potem bez terminu według ostatniej pracy” | docs/brd/wymagania-dni.md:150 |
| BR-DNI-006/S2 | BR-DNI-006 | F-61 | dni i postęp | Który projekt dziś: kolejność według terminu: Termin minął | tak | RD-15-W4 | dane-node:sqlite |  | docs/brd/wymagania-dni.md:154 |
| BR-DNI-006/S3 | BR-DNI-006 | F-61 | dni i postęp | Który projekt dziś: kolejność według terminu: Bez terminów | tak | BR-PRJ-012 | dane-node:sqlite |  | docs/brd/wymagania-dni.md:158 |
| BR-LIC-001/S1 | BR-LIC-001 | F-01 | licznik | Licznik od pierwszego uruchomienia: Pierwsze uruchomienie | tak | NFR-PIE-001; Z-01 | E2E-symulator | świeża instalacja; także offline i z datą 1. i ostatniego dnia miesiąca (NFR-PIE-001 metoda) | docs/brd/wymagania-licznik.md:8 |
| BR-LIC-001/S2 | BR-LIC-001 | F-01 | licznik | Licznik od pierwszego uruchomienia: Pierwszy rząd jednym stuknięciem | tak | NFR-PIE-001; L-01, Z-01 | E2E-symulator | liczba stuknięć = 1, adapter sieci „brak połączenia” | docs/brd/wymagania-licznik.md:12 |
| BR-LIC-001/S3 | BR-LIC-001 | F-01 | licznik | Licznik od pierwszego uruchomienia: Nazwanie później | tak | brak (wartości w scenariuszu) | dane-node:sqlite |  | docs/brd/wymagania-licznik.md:16 |
| BR-LIC-002/S1 | BR-LIC-002 | F-01 | licznik | Dodawanie i odejmowanie rzędu: Dodanie rzędu | tak | brak (wartości w scenariuszu) | domena-Node |  | docs/brd/wymagania-licznik.md:25 |
| BR-LIC-002/S2 | BR-LIC-002 | F-01 | licznik | Dodawanie i odejmowanie rzędu: Odjęcie przy pruciu | tak | brak (wartości w scenariuszu) | domena-Node |  | docs/brd/wymagania-licznik.md:29 |
| BR-LIC-002/S3 | BR-LIC-002 | F-01 | licznik | Dodawanie i odejmowanie rzędu: Granica zera | tak | brak (wartości w scenariuszu) | domena-Node | granica 0; brak wpisu w historii | docs/brd/wymagania-licznik.md:33 |
| BR-LIC-003/S1 | BR-LIC-003 | F-02 | licznik | Historia zmian z godziną i cofnięciem: Sprawdzenie, czy dodałem rząd | tak | brak (wartości w scenariuszu) | ekran-RNTL | zegar wstrzykiwany | docs/brd/wymagania-licznik.md:42 |
| BR-LIC-003/S2 | BR-LIC-003 | F-02 | licznik | Historia zmian z godziną i cofnięciem: Cofnięcie serii przypadkowych zmian | tak | RD-15 (wykonanie dnia bez cofniętych) | dane-node:sqlite |  | docs/brd/wymagania-licznik.md:46 |
| BR-LIC-004/S1 | BR-LIC-004 | F-03 | licznik | Blokada przed przypadkowym stuknięciem: Licznik zablokowany | czesciowo | brak | ekran-RNTL | fizyczny dotyk kolana nie do odtworzenia; test: zdarzenie press na +1 w stanie zablokowanym nie zmienia wartości. Brzmienie: „Gdy licznik dostaje zdarzenie stuknięcia w przycisk +1” | docs/brd/wymagania-licznik.md:64 |
| BR-LIC-004/S2 | BR-LIC-004 | F-03 | licznik | Blokada przed przypadkowym stuknięciem: Odblokowanie | czesciowo | brak | ekran-RNTL | „świadomy gest” nieokreślony; design: pasek „Counter locked · Unlock” (docs/design/design-spec.md:34). Brzmienie: „Gdy stuka Unlock na pasku blokady” | docs/brd/wymagania-licznik.md:68 |
| BR-LIC-004/S3 | BR-LIC-004 | F-03 | licznik | Blokada przed przypadkowym stuknięciem: Stuknięcie w zablokowany licznik (ER-24) | tak | tekst z docs/design/design-spec.md:34 | ekran-RNTL |  | docs/brd/wymagania-licznik.md:72 |
| BR-LIC-004/S4 | BR-LIC-004 | F-03 | licznik | Blokada przed przypadkowym stuknięciem: Gest systemowy (ER-24) | czesciowo | brak | E2E-symulator | gestu systemowego od krawędzi nie da się wiernie odtworzyć w XCUITest; test zastępczy: przeciągnięcie z dolnej krawędzi strefy +1 nie dodaje rzędu (RNTL/E2E); reszta ryzyko szczątkowe | docs/brd/wymagania-licznik.md:76 |
| BR-LIC-005/S1 | BR-LIC-005 | F-01 | licznik | Potwierdzenie zmiany bez przerywania dźwięku: Potwierdzenie dotykiem | czesciowo | brak | tylko-urządzenie | haptyka i ciągłość podcastu tylko na urządzeniu; automat: wywołanie haptyki przy +1 (mock) i brak zmiany kategorii sesji audio (RNTL). Ryzyko szczątkowe P-041 | docs/brd/wymagania-licznik.md:85 |
| BR-LIC-005/S2 | BR-LIC-005 | F-01 | licznik | Potwierdzenie zmiany bez przerywania dźwięku: Dźwięk wyłączony | czesciowo | brak | ekran-RNTL | zakłada istnienie dźwięków i ustawienia ich wyłączenia; w design brak dźwięków i przełącznika (nie znaleziono w docs/design/design-spec.md). Brzmienie: „aplikacja nigdy nie odtwarza dźwięku przy +1” albo usunąć | docs/brd/wymagania-licznik.md:89 |
| BR-LIC-006/S1 | BR-LIC-006 | F-04 | licznik | Kilka liczników w projekcie: Drugi licznik | tak | brak (wartości w scenariuszu) | dane-node:sqlite |  | docs/brd/wymagania-licznik.md:98 |
| BR-LIC-007/S1 | BR-LIC-007 | F-05 | licznik | Licznik powtórzeń powiązany z rzędami: Środek trzeciego powtórzenia | tak | RD-12-W1 | domena-Node |  | docs/brd/wymagania-licznik.md:107 |
| BR-LIC-007/S2 | BR-LIC-007 | F-05 | licznik | Licznik powtórzeń powiązany z rzędami: Koniec powtórzenia | tak | RD-12-W2 | domena-Node |  | docs/brd/wymagania-licznik.md:111 |
| BR-LIC-007/S3 | BR-LIC-007 | F-05 | licznik | Licznik powtórzeń powiązany z rzędami: Błędna długość powtórzenia | tak | RD-12-W5 | ekran-RNTL | walidacja w domenie (RD-12-W5) + komunikat na ekranie | docs/brd/wymagania-licznik.md:115 |
| BR-LIC-008/S1 | BR-LIC-008 | F-04 | licznik | Zmiana ustawień licznika w trakcie: Zmiana długości powtórzenia | tak | RD-12 (rachunek: r=17, n=10 → 2/7) | domena-Node | wektora dokładnie dla tego przypadku nie ma w brd.json; wynik z wzoru RD-12 | docs/brd/wymagania-licznik.md:128 |
| BR-LIC-009/S1 | BR-LIC-009 | F-06 | licznik | Przypomnienie „co N rzędów, M razy”: Przypomnienie w trakcie serii | czesciowo | RD-13-W1 | domena-Node | reguła tak; „zmienia wygląd całego ekranu” → RNTL (stan zakreślenia, docs/design/design-spec.md:23); wibracja jak BR-LIC-020 | docs/brd/wymagania-licznik.md:138 |
| BR-LIC-009/S2 | BR-LIC-009 | F-06 | licznik | Przypomnienie „co N rzędów, M razy”: Ostatnie przypomnienie | tak | RD-13-W2 | domena-Node |  | docs/brd/wymagania-licznik.md:142 |
| BR-LIC-009/S3 | BR-LIC-009 | F-06 | licznik | Przypomnienie „co N rzędów, M razy”: Po zakończeniu serii | tak | RD-13-W3 | domena-Node |  | docs/brd/wymagania-licznik.md:146 |
| BR-LIC-010/S1 | BR-LIC-010 | F-06 | licznik | Plan rzędów z instrukcji wzoru: Plan z instrukcji | tak | RD-13 (lista s + kN) | ekran-RNTL | podgląd planu w formularzu (U-3) | docs/brd/wymagania-licznik.md:179 |
| BR-LIC-010/S2 | BR-LIC-010 | F-06 | licznik | Plan rzędów z instrukcji wzoru: Brak rzędu początkowego | tak | RD-13; OP-06 (docs/brd/README.md:107) | ekran-RNTL |  | docs/brd/wymagania-licznik.md:183 |
| BR-LIC-011/S1 | BR-LIC-011 | F-08 | licznik | Cel rzędów i jego osiągnięcie: Osiągnięcie celu | tak | brak (wartości w scenariuszu); U-11 | ekran-RNTL | treść „osiągnięcia” nieokreślona; test: stan celu + akcje „Następna część / Druga taka sama” (docs/scope-contract.md:22) | docs/brd/wymagania-licznik.md:192 |
| BR-LIC-011/S2 | BR-LIC-011 | F-08 | licznik | Cel rzędów i jego osiągnięcie: Przekroczenie celu | tak | brak (wartości w scenariuszu) | ekran-RNTL | oznaczenie „ponad cel”: brak tekstu w design | docs/brd/wymagania-licznik.md:196 |
| BR-LIC-012/S1 | BR-LIC-012 | F-09 | licznik | Znaczenie liczby na liczniku: Tryb „rząd w trakcie” | czesciowo | brak | ekran-RNTL | design pokazuje zawsze obie wartości („Now knitting row 48” + liczba skończonych, docs/design/design-spec.md:30) — czy ustawienie F-09 zostaje? Do wyjaśnienia z 04/03 | docs/brd/wymagania-licznik.md:205 |
| BR-LIC-013/S1 | BR-LIC-013 | F-10 | licznik | Ekran nie gaśnie podczas liczenia: Długa sesja | czesciowo | brak | tylko-urządzenie | automat: wywołanie keep-awake przy wejściu na ekran licznika (mock); realne niegaśnięcie tylko na urządzeniu | docs/brd/wymagania-licznik.md:218 |
| BR-LIC-013/S2 | BR-LIC-013 | F-10 | licznik | Ekran nie gaśnie podczas liczenia: Opcja wyłączona | czesciowo | brak | tylko-urządzenie | automat: brak keep-awake przy wyłączonej opcji | docs/brd/wymagania-licznik.md:222 |
| BR-LIC-014/S1 | BR-LIC-014 | F-11 | licznik | Liczenie z ekranu blokady: Dodanie rzędu bez odblokowania | czesciowo | S-05 (strażnik przy +1 z ekranu blokady) | tylko-urządzenie | logika dziennika +1 (ADR-0008) testowalna w dane-node; Live Activity tylko urządzenie/E2E częściowo | docs/brd/wymagania-licznik.md:231 |
| BR-LIC-015/S1 | BR-LIC-015 | F-12 | licznik | Zegarek bez telefonu w ręku: Liczenie na zegarku | czesciowo | NFR-ZEG-001; S-04, L-11 | domena-Node | logika synchronizacji z symulowanym transportem (domena); UI zegarka para symulatorów „jeśli CI pozwala”; prawdziwy zegarek: ryzyko szczątkowe | docs/brd/wymagania-licznik.md:240 |
| BR-LIC-015/S2 | BR-LIC-015 | F-12 | licznik | Zegarek bez telefonu w ręku: Przypomnienie na zegarku | czesciowo | RD-13-W1 | E2E-symulator | wibracja zegarka tylko urządzenie | docs/brd/wymagania-licznik.md:244 |
| BR-LIC-017/S1 | BR-LIC-017 | F-45 | licznik | Wpisanie wartości licznika i wyzerowanie: Przeniesienie trwającej robótki | tak | brak (wartości w scenariuszu) | domena-Node |  | docs/brd/wymagania-licznik.md:262 |
| BR-LIC-017/S2 | BR-LIC-017 | F-45 | licznik | Wpisanie wartości licznika i wyzerowanie: Wpisanie w historii z cofnięciem | tak | brak (wartości w scenariuszu) | dane-node:sqlite |  | docs/brd/wymagania-licznik.md:266 |
| BR-LIC-017/S3 | BR-LIC-017 | F-45 | licznik | Wpisanie wartości licznika i wyzerowanie: Wpisanie nie jest pracą w statystykach | tak | RD-15 (wykonanie bez wpisań) | dane-node:sqlite |  | docs/brd/wymagania-licznik.md:270 |
| BR-LIC-017/S4 | BR-LIC-017 | F-45 | licznik | Wpisanie wartości licznika i wyzerowanie: Wpisanie w nowym dniu zaczyna dzień limitu (ER-27) | tak | S-06, L-08 (pośrednio), D4 w P-057 | domena-Node | brak wektora L dla wpisania w dniu w limicie (2 z 5 → 3 z 5); test złożony z S-06 + L-01-podobnego | docs/brd/wymagania-licznik.md:274 |
| BR-LIC-017/S5 | BR-LIC-017 | F-45 | licznik | Wpisanie wartości licznika i wyzerowanie: Wpisanie w nowym dniu ponad limit (ER-27) | tak | L-08, S-06 | domena-Node |  | docs/brd/wymagania-licznik.md:279 |
| BR-LIC-017/S6 | BR-LIC-017 | F-45 | licznik | Wpisanie wartości licznika i wyzerowanie: Zerowanie z potwierdzeniem | tak | S-07 | ekran-RNTL | potwierdzenie + cofnięcie z historii | docs/brd/wymagania-licznik.md:283 |
| BR-LIC-017/S7 | BR-LIC-017 | F-45 | licznik | Wpisanie wartości licznika i wyzerowanie: Błędna wartość | tak | brak (reguła w scenariuszu) | ekran-RNTL |  | docs/brd/wymagania-licznik.md:287 |
| BR-LIC-018/S1 | BR-LIC-018 | F-46 | licznik | Licznik całości zasilany przez sekcje jednego kawałka: Sekcja zasila całość | tak | brak (wartości w scenariuszu) | domena-Node |  | docs/brd/wymagania-licznik.md:313 |
| BR-LIC-018/S2 | BR-LIC-018 | F-46 | licznik | Licznik całości zasilany przez sekcje jednego kawałka: Prucie w sekcji | tak | brak (wartości w scenariuszu) | domena-Node |  | docs/brd/wymagania-licznik.md:317 |
| BR-LIC-018/S3 | BR-LIC-018 | F-46 | licznik | Licznik całości zasilany przez sekcje jednego kawałka: Części osobnych kawałków | tak | brak (wartości w scenariuszu) | domena-Node |  | docs/brd/wymagania-licznik.md:321 |
| BR-LIC-019/S1 | BR-LIC-019 | F-47 | licznik | Strażnik stuknięć z tempa: Seria przypadkowych dodań | tak | RD-17-W1 | domena-Node | reguła w domenie; baner i „Undo” w RNTL (docs/design/design-spec.md:35) | docs/brd/wymagania-licznik.md:338 |
| BR-LIC-019/S2 | BR-LIC-019 | F-47 | licznik | Strażnik stuknięć z tempa: Nadrobienie zapomnianego rzędu | tak | RD-17-W4 | domena-Node |  | docs/brd/wymagania-licznik.md:342 |
| BR-LIC-019/S3 | BR-LIC-019 | F-47 | licznik | Strażnik stuknięć z tempa: Licznik oczek (ER-24) | tak | RD-17 (tylko liczniki rzędów) | domena-Node | wektora dla licznika oczek nie ma w brd.json | docs/brd/wymagania-licznik.md:346 |
| BR-LIC-019/S4 | BR-LIC-019 | F-47 | licznik | Strażnik stuknięć z tempa: Brak nowego elementu na ekranie | tak | P-046 | ekran-RNTL | asercja negatywna | docs/brd/wymagania-licznik.md:350 |
| BR-LIC-020/S1 | BR-LIC-020 | F-48 | licznik | Wibracje rozróżniane bez patrzenia: Przypomnienie inne niż rząd | czesciowo | F-48: dwa wzorce | ekran-RNTL | automat: różne ID wzorca haptyki (mock); odczucie różnicy: ryzyko szczątkowe (docs/scope-contract.md:219) | docs/brd/wymagania-licznik.md:372 |
| BR-LIC-020/S2 | BR-LIC-020 | F-48 | licznik | Wibracje rozróżniane bez patrzenia: Koniec powtórzenia i cel dnia | czesciowo | brak | ekran-RNTL | niejednoznaczne: „wzór przypisany do zdarzenia” a F-48 „tylko dwa wzorce” (docs/scope-contract.md:58). Brzmienie: „wibruje wzorem przypomnienia (nie rzędu)” | docs/brd/wymagania-licznik.md:376 |
| BR-LIC-020/S3 | BR-LIC-020 | F-48 | licznik | Wibracje rozróżniane bez patrzenia: Wibracje wyłączone | tak | brak | ekran-RNTL | mock haptyki: 0 wywołań | docs/brd/wymagania-licznik.md:380 |
| BR-ZAP-001/S1 | BR-ZAP-001 | F-37 | zapas | Włóczka w zapasie: Dodanie włóczki z etykiety w jardach | tak | RD-03-W1; JW-yd-437 | domena-Node | format wyświetlania (2 miejsca) nieokreślony w RD | docs/brd/wymagania-narzedzia.md:11 |
| BR-ZAP-001/S2 | BR-ZAP-001 | F-37 | zapas | Włóczka w zapasie: Pielęgnacja | tak | OG-13, OP-11 | ekran-RNTL | asercja: brak grafik symboli | docs/brd/wymagania-narzedzia.md:15 |
| BR-ZAP-002/S1 | BR-ZAP-002 | F-37 | zapas | Zużycie z projektu odjęte z zapasu: Zakończenie projektu | tak | brak (wartości w scenariuszu) | dane-node:sqlite | U-9 | docs/brd/wymagania-narzedzia.md:24 |
| BR-ZAP-003/S1 | BR-ZAP-003 | F-37 | zapas | Narzędzia w milimetrach: Drut 3,25 mm | tak | RD-11-W2; DRT-M03250 | domena-Node |  | docs/brd/wymagania-narzedzia.md:33 |
| BR-ZAP-004/S1 | BR-ZAP-004 | F-37 | zapas | Wyszukiwanie w zapasie: Filtr grubości | tak | RD-10 (kategorie) | dane-node:sqlite |  | docs/brd/wymagania-narzedzia.md:50 |
| BR-ZAP-004/S2 | BR-ZAP-004 | F-37 | zapas | Wyszukiwanie w zapasie: W sklepie bez zasięgu | tak | NFR-OFF-001 | E2E-symulator |  | docs/brd/wymagania-narzedzia.md:54 |
| BR-KAL-001/S1 | BR-KAL-001 | F-38 | obliczenia | Liczba oczek z próbki: Typowa próbka | tak | RD-01-W1 | domena-Node | przegląd 06 wykonany (docs/tresci/README.md:2) | docs/brd/wymagania-narzedzia.md:64 |
| BR-KAL-001/S2 | BR-KAL-001 | F-38 | obliczenia | Liczba oczek z próbki: Brak próbki | tak | RD-01-W5 | domena-Node |  | docs/brd/wymagania-narzedzia.md:68 |
| BR-KAL-001/S3 | BR-KAL-001 | F-38 | obliczenia | Liczba oczek z próbki: Szerokość zero | tak | RD-01-W2 | domena-Node |  | docs/brd/wymagania-narzedzia.md:72 |
| BR-KAL-003/S1 | BR-KAL-003 | F-38 | obliczenia | Jednostki i próbka w calach: Próbka amerykańska | czesciowo | RD-04-W1; KL10-* (docs/tresci/wektory.json:1526) | domena-Node | liczba tak; „sposób pokazania zależy od OP-03” — w BRD otwarte (docs/brd/README.md:103), rozstrzygnięte P-081 P3a (docs/decyzje.md:87); BRD do aktualizacji | docs/brd/wymagania-narzedzia.md:111 |
| BR-KAL-003/S2 | BR-KAL-003 | F-38 | obliczenia | Jednostki i próbka w calach: Masa | tak | RD-03-W3; JW-oz-3_5 | domena-Node |  | docs/brd/wymagania-narzedzia.md:115 |
| BR-KAL-008/S1 | BR-KAL-008 | F-38 | obliczenia | Grubość włóczki z próbki: Zakres wspólny | tak | RD-10-W2; KL4-23 | domena-Node | P-084 zaokrągla próbkę przed klasyfikacją; reguly.md:157 („luka 25,5 → poza tabelą”) sprzeczne z KL4-25_5 → [2] | docs/brd/wymagania-narzedzia.md:197 |
| BR-PRJ-001/S1 | BR-PRJ-001 | F-14 | projekt | Projekt z częściami: Części swetra | tak | brak (wartości w scenariuszu) | dane-node:sqlite |  | docs/brd/wymagania-projekt.md:9 |
| BR-PRJ-002/S1 | BR-PRJ-002 | F-15 | projekt | Notatka widoczna przy liczniku: Notatka przy przerwie | tak | brak | ekran-RNTL |  | docs/brd/wymagania-projekt.md:18 |
| BR-PRJ-002/S2 | BR-PRJ-002 | F-15 | projekt | Notatka widoczna przy liczniku: Długa notatka (ER-24) | tak | P-047 (5000 znaków to przykład) | dane-node:sqlite |  | docs/brd/wymagania-projekt.md:22 |
| BR-PRJ-003/S1 | BR-PRJ-003 | F-16 | projekt | Zdjęcia projektu i etykiety: Zdjęcie etykiety | czesciowo | brak | E2E-symulator | aparat w symulatorze niedostępny: wybór z biblioteki/mock; plik w katalogu aplikacji (ADR-0001) i odczyt offline testowalne | docs/brd/wymagania-projekt.md:31 |
| BR-PRJ-004/S1 | BR-PRJ-004 | F-17 | projekt | Dane techniczne projektu: Drut w milimetrach | tak | RD-11-W1; DRT-M04000 | domena-Node |  | docs/brd/wymagania-projekt.md:40 |
| BR-PRJ-004/S2 | BR-PRJ-004 | F-17 | projekt | Dane techniczne projektu: Rozmiar bez odpowiednika | tak | RD-11-W3; DRT-M03000 | domena-Node |  | docs/brd/wymagania-projekt.md:44 |
| BR-PRJ-005/S1 | BR-PRJ-005 | F-18 | projekt | Powrót do projektu po przerwie: Powrót po miesiącach | tak | brak | ekran-RNTL |  | docs/brd/wymagania-projekt.md:57 |
| BR-PRJ-006/S1 | BR-PRJ-006 | F-19 | projekt | Stan projektu: Ukończenie | tak | brak | dane-node:sqlite | U-9 | docs/brd/wymagania-projekt.md:66 |
| BR-PRJ-007/S1 | BR-PRJ-007 | F-20 | projekt | Zrób ponownie: Druga skarpeta | tak | brak | dane-node:sqlite | U-2 | docs/brd/wymagania-projekt.md:75 |
| BR-PRJ-008/S1 | BR-PRJ-008 | F-21 | projekt | Stoper sesji działa przy zablokowanym ekranie: Blokada telefonu | tak | brak (wartości w scenariuszu) | domena-Node | czas z znaczników, nie z timera w pamięci | docs/brd/wymagania-projekt.md:89 |
| BR-PRJ-008/S2 | BR-PRJ-008 | F-21 | projekt | Stoper sesji działa przy zablokowanym ekranie: Zapomniany stoper | czesciowo | brak | tylko-urządzenie | stoper na ekranie blokady (Live Activity) tylko urządzenie; zatrzymanie przez intencję testowalne w dane-node | docs/brd/wymagania-projekt.md:93 |
| BR-PRJ-011/S1 | BR-PRJ-011 | F-49 | projekt | Powrót do tego samego miejsca po starcie i z innej aplikacji: Start po zamknięciu aplikacji | tak | brak | E2E-symulator | terminate + relaunch | docs/brd/wymagania-projekt.md:120 |
| BR-PRJ-011/S2 | BR-PRJ-011 | F-49 | projekt | Powrót do tego samego miejsca po starcie i z innej aplikacji: Powrót z innej aplikacji | tak | brak | E2E-symulator | tło/pierwszy plan | docs/brd/wymagania-projekt.md:124 |
| BR-PRJ-011/S3 | BR-PRJ-011 | F-49 | projekt | Powrót do tego samego miejsca po starcie i z innej aplikacji: Dwa urządzenia | czesciowo | NFR-DAN-003 | dane-node:sqlite | dwa magazyny z symulowanym transportem; prawdziwe dwa urządzenia: ryzyko szczątkowe | docs/brd/wymagania-projekt.md:128 |
| BR-PRJ-012/S1 | BR-PRJ-012 | F-50 | projekt | Lista projektów po roku: W toku według ostatniej pracy | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-projekt.md:137 |
| BR-PRJ-012/S2 | BR-PRJ-012 | F-50 | projekt | Lista projektów po roku: Wyszukiwanie po nazwie | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-projekt.md:141 |
| BR-PRJ-012/S3 | BR-PRJ-012 | F-50 | projekt | Lista projektów po roku: Brak wyników | tak | tekst „No project called …” (docs/design/design-spec.md:55) | ekran-RNTL |  | docs/brd/wymagania-projekt.md:145 |
| BR-PRJ-013/S1 | BR-PRJ-013 | F-51 | projekt | Korekta czasu sesji i dat projektu: Zapomniany stoper | tak | brak (wartości w scenariuszu) | domena-Node |  | docs/brd/wymagania-projekt.md:155 |
| BR-PRJ-013/S2 | BR-PRJ-013 | F-51 | projekt | Korekta czasu sesji i dat projektu: Data ukończenia | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-projekt.md:159 |
| BR-PRJ-013/S3 | BR-PRJ-013 | F-51 | projekt | Korekta czasu sesji i dat projektu: Koniec przed początkiem | tak | brak | ekran-RNTL |  | docs/brd/wymagania-projekt.md:163 |
| BR-PRJ-014/S1 | BR-PRJ-014 | F-52 | projekt | Druga część pary (bliźniak): Cel z pierwszej części | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-projekt.md:177 |
| BR-PRJ-014/S2 | BR-PRJ-014 | F-52 | projekt | Druga część pary (bliźniak): To samo miejsce co w pierwszej | tak | brak | ekran-RNTL |  | docs/brd/wymagania-projekt.md:181 |
| BR-PRJ-014/S3 | BR-PRJ-014 | F-52 | projekt | Druga część pary (bliźniak): Pierwsza bez rzędów | tak | brak | ekran-RNTL |  | docs/brd/wymagania-projekt.md:185 |
| BR-PRJ-015/S1 | BR-PRJ-015 | F-53 | projekt | Karta ukończenia projektu: Karta przy ukończeniu | tak | brak (wartości w scenariuszu) | ekran-RNTL |  | docs/brd/wymagania-projekt.md:194 |
| BR-PRJ-015/S2 | BR-PRJ-015 | F-53 | projekt | Karta ukończenia projektu: Udostępnienie bez lokalizacji (ER-24) | tak | NFR-PRY-001; ZP-03 | dane-node:sqlite | test pliku karty: brak EXIF GPS; arkusz udostępniania mock | docs/brd/wymagania-projekt.md:198 |
| BR-PRJ-015/S3 | BR-PRJ-015 | F-53 | projekt | Karta ukończenia projektu: Bez stopera | tak | brak | ekran-RNTL |  | docs/brd/wymagania-projekt.md:202 |
| BR-PRJ-016/S1 | BR-PRJ-016 | F-54 | projekt | Projekty dawno nieruszane: Ostatnia praca na liście | tak | brak (wartości w scenariuszu) | dane-node:sqlite |  | docs/brd/wymagania-projekt.md:212 |
| BR-PRJ-016/S2 | BR-PRJ-016 | F-54 | projekt | Projekty dawno nieruszane: Powrót jednym stuknięciem | tak | BR-PRJ-011 | E2E-symulator |  | docs/brd/wymagania-projekt.md:216 |
| BR-WZR-001/S1 | BR-WZR-001 | F-24 | wzór | Import wzoru z pliku: PDF z aplikacji Pliki | czesciowo | brak | E2E-symulator | rozszerzenie udostępniania (ADR-0011) w XCUITest trudne; zapis i odczyt offline w dane-node | docs/brd/wymagania-projekt.md:232 |
| BR-WZR-001/S2 | BR-WZR-001 | F-24 | wzór | Import wzoru z pliku: Plik uszkodzony | tak | brak | dane-node:sqlite | plik uszkodzony jako wejście testu | docs/brd/wymagania-projekt.md:236 |
| BR-WZR-002/S1 | BR-WZR-002 | F-24 | wzór | Wzór ze zdjęcia książki: Zdjęcie strony | czesciowo | brak | E2E-symulator | aparat: mock; „można powiększać” → RNTL (gest pinch) częściowo | docs/brd/wymagania-projekt.md:245 |
| BR-WZR-003/S1 | BR-WZR-003 | F-26 | wzór | Znacznik bieżącego rzędu we wzorze: Znacznik idzie z licznikiem | tak | brak | domena-Node |  | docs/brd/wymagania-projekt.md:254 |
| BR-WZR-003/S2 | BR-WZR-003 | F-26 | wzór | Znacznik bieżącego rzędu we wzorze: Powrót do wzoru | tak | brak | dane-node:sqlite |  | docs/brd/wymagania-projekt.md:258 |
| BR-WZR-004/S1 | BR-WZR-004 | F-28 | wzór | Pisanie po wzorze: Dłoń na ekranie | nie | brak | tylko-urządzenie | odrzucenie dłoni tylko na iPadzie z Pencil; automat: konfiguracja PencilKit drawingPolicy = pencilOnly (P-042). Ryzyko szczątkowe (docs/scope-contract.md:219) | docs/brd/wymagania-projekt.md:285 |
| BR-WZR-005/S1 | BR-WZR-005 | F-25 | wzór | Wzór i licznik razem: Telefon poziomo na stojaku | tak | brak | E2E-symulator | orientacja pozioma w symulatorze; makiety brak (docs/design/design-spec.md:95) | docs/brd/wymagania-projekt.md:300 |
| BR-WZR-007/S1 | BR-WZR-007 | F-55 | wzór | Wzór ze strony WWW i z pliku Word, link do filmu: Strona WWW zapisana bez sieci | czesciowo | brak | E2E-symulator | udostępnienie z Safari tylko E2E/urządzenie; zapis offline strony w dane-node | docs/brd/wymagania-projekt.md:330 |
| BR-WZR-007/S2 | BR-WZR-007 | F-55 | wzór | Wzór ze strony WWW i z pliku Word, link do filmu: Plik Word | czesciowo | brak | E2E-symulator | jak WZR-001/S1 | docs/brd/wymagania-projekt.md:334 |
| BR-WZR-007/S3 | BR-WZR-007 | F-55 | wzór | Wzór ze strony WWW i z pliku Word, link do filmu: Strona, której nie da się zapisać | czesciowo | brak | dane-node:sqlite | „nie ma treści wzoru” niemierzalne. Brzmienie: „strona zwraca 401/403 albo po zapisie nie ma tekstu ani obrazu” | docs/brd/wymagania-projekt.md:338 |
| BR-WZR-007/S4 | BR-WZR-007 | F-55 | wzór | Wzór ze strony WWW i z pliku Word, link do filmu: Link do filmu | tak | brak | ekran-RNTL | adapter sieci „brak połączenia” | docs/brd/wymagania-projekt.md:342 |
| BR-WZR-008/S1 | BR-WZR-008 | F-56 | wzór | Zakreślanie i notatki na wzorze palcem: Zakreślenie mojego rozmiaru na iPhonie | czesciowo | brak | E2E-symulator | gest palcem po PDF w E2E; trwałość adnotacji w dane-node | docs/brd/wymagania-projekt.md:351 |
| BR-WZR-008/S2 | BR-WZR-008 | F-56 | wzór | Zakreślanie i notatki na wzorze palcem: Notatka w miejscu wzoru | tak | brak | dane-node:sqlite | plik wzoru niezmieniony: skrót pliku przed i po | docs/brd/wymagania-projekt.md:355 |
| BR-WZR-008/S3 | BR-WZR-008 | F-56 | wzór | Zakreślanie i notatki na wzorze palcem: Przewijanie bez zakreślacza | czesciowo | BR-WZR-004 | E2E-symulator |  | docs/brd/wymagania-projekt.md:359 |
| NFR-DAN-001 | NFR-DAN-001 | F-31 | przekrojowe (NFR) | Zero utraty danych przy aktualizacji | tak | próg 0; P-070 | dane-node:sqlite | migracja w transakcji na kopii bazy | docs/brd/wymagania.md:73 |
| NFR-DAN-002 | NFR-DAN-002 | F-31 | przekrojowe (NFR) | Każda zmiana licznika zapisana trwale | tak | próg 0 | E2E-symulator | zabicie procesu po każdej zmianie; także dane-node | docs/brd/wymagania.md:77 |
| NFR-DAN-003 | NFR-DAN-003 | F-27 | przekrojowe (NFR) | Synchronizacja nie zmienia liczby bez wiedzy | czesciowo | próg 0; RYZ-02 | dane-node:sqlite | dwie instancje magazynu i zegarek z symulowanym transportem; iCloud między urządzeniami: ryzyko szczątkowe | docs/brd/wymagania.md:81 |
| NFR-OFF-001 | NFR-OFF-001 | — | przekrojowe (NFR) | Działanie bez sieci | tak | próg 100% PR-01–07, 10–12, 14 | E2E-symulator | adapter sieci „brak połączenia”; PR-12 poza zakresem | docs/brd/wymagania.md:85 |
| NFR-PIE-001 | NFR-PIE-001 | F-01 | przekrojowe (NFR) | Pierwsze liczenie bez przeszkód | tak | 1 stuknięcie, 0 ekranów; L-01, Z-01 | E2E-symulator | z datą 1. i ostatniego dnia miesiąca | docs/brd/wymagania.md:89 |
| NFR-PRY-001 | NFR-PRY-001 | F-36 | przekrojowe (NFR) | Brak zbierania danych | czesciowo | „Data Not Collected”, 0 SDK | dane-node:sqlite | automat: lista zależności wobec listy dozwolonych; etykieta: rola 10 (przegląd, nie test) | docs/brd/wymagania.md:93 |
| NFR-DOS-001 | NFR-DOS-001 | — | przekrojowe (NFR) | VoiceOver w głównych przepływach | czesciowo | 100% elementów PR-01–05 | E2E-symulator | performAccessibilityAudit + RNTL etykiety; odbiór przez osobę: ryzyko szczątkowe | docs/brd/wymagania.md:97 |
| NFR-DOS-002 | NFR-DOS-002 | — | przekrojowe (NFR) | Duży tekst | nie | próg [DO USTALENIA] OP-16 | E2E-symulator | bez progu brak wyroczni; propozycja: „0 obciętych i nakładających się tekstów przy AX5 na ekranach PR-01–06” wobec zrzutów wzorcowych (docs/design/design-spec.md:9) | docs/brd/wymagania.md:101 |
| NFR-WYD-001 | NFR-WYD-001 | F-01 | przekrojowe (NFR) | Reakcja licznika | nie | próg [DO USTALENIA] OP-17 | E2E-symulator | budżet „po pomiarze bazowym” (docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md:30); propozycja: p95 z 20 powtórzeń ≤ pomiar bazowy × 1,2 jako regresja | docs/brd/wymagania.md:105 |
| NFR-ZEG-001 | NFR-ZEG-001 | F-12 | przekrojowe (NFR) | Zgodność zegarka i telefonu | czesciowo | różnica 0 po synchronizacji | domena-Node | symulowany transport; para symulatorów „jeśli CI pozwala”; prawdziwy zegarek: ryzyko szczątkowe | docs/brd/wymagania.md:109 |
| NFR-SYS-001 | NFR-SYS-001 | — | przekrojowe (NFR) | Działanie po premierze nowego iOS/watchOS | czesciowo | 0 przepływów; czas [DO USTALENIA] OP-26 | E2E-symulator | minimalne wersje w ADR-0006; czas poprawki otwarty (docs/decyzje.md:76) | docs/brd/wymagania.md:113 |
| NFR-JEZ-001 | NFR-JEZ-001 | — | przekrojowe (NFR) | 35 lokalizacji | tak | 100% kluczy | domena-Node | kontrola katalogu tłumaczeń (rola 09); tłumaczenia późno (CLAUDE.md) | docs/brd/wymagania.md:121 |
| NFR-KOS-001 | NFR-KOS-001 | — | przekrojowe (NFR) | Koszt stały 0 zł | nie | 0 zł | — | przegląd usług w ADR, nie test automatyczny; propozycja: kontrola listy zależności sieciowych/usług w CI | docs/brd/wymagania.md:125 |
| KP-01 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Limit darmowy tylko się luzuje; nic darmowego za zaporę | tak | LIMIT_DNI wobec poprzedniego wydania | domena-Node | kontrola przed wydaniem (07) | docs/monetyzacja.md:86 |
| KP-02 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Utrata Pro: wraca limit; dane, historia, eksport zawsze | tak | W-05, W-06, W-14, W-16; L-09 | domena-Node | wersja V4; wersja sesji 2 (docs/monetyzacja.md:539) nieaktualna | docs/monetyzacja.md:87 |
| KP-03 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Aktywna subskrypcja: ekran nie oferuje tej samej; dożywotni z informacją | tak | W-15, W-17 | ekran-RNTL |  | docs/monetyzacja.md:88 |
| KP-04 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Polityka prywatności i Terms of Use w aplikacji i metadanych | czesciowo | BR-ZAK-004 | ekran-RNTL | metadane: rola 11, przegląd | docs/monetyzacja.md:89 |
| KP-05 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | „Usuń wszystkie dane” nie usuwa zakupu | czesciowo | W-02 | domena-Node | potwierdzenie z tekstem (RNTL); TestFlight (docs/monetyzacja.md:590) | docs/monetyzacja.md:98 |
| KP-06 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Dostęp z transakcji sklepu; pamięć podręczna tylko ostatni odczyt | tak | W-03, W-04, W-11, P-01–P-06 | domena-Node |  | docs/monetyzacja.md:95 |
| KP-07 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Nasłuch transakcji od startu | czesciowo | brak | ekran-RNTL | mock adaptera: listener zarejestrowany przy starcie | docs/monetyzacja.md:96 |
| KP-08 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Przywracanie tylko po stuknięciu | tak | W-02, W-07 | ekran-RNTL | mock: restore wołane tylko z akcji | docs/monetyzacja.md:585 |
| KP-09 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Cena ze sklepu, nie z kodu | tak | brak | ekran-RNTL | kontrola statyczna: brak literałów cen w kodzie i tłumaczeniach | docs/monetyzacja.md:586 |
| KP-10 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Ekran zakupu tylko po działaniu; nigdy w PR-02, PR-05, przy pierwszym uruchomieniu | tak | zawężone KP-13 | E2E-symulator |  | docs/monetyzacja.md:587 |
| KP-11 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Bez SDK analityki w ścieżce zakupu | tak | NFR-PRY-001 | dane-node:sqlite | lista zależności; zakaz verifyPurchaseWithProvider itd. (docs/monetyzacja.md:571) | docs/monetyzacja.md:588 |
| KP-12 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Strażnik tylko w startDnia(), wolaStraznika() | tak | S-01–S-10, L-01–L-18 | domena-Node |  | docs/monetyzacja.md:90 |
| KP-13 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Ekran zakupu tylko z komunikatu limitu i Ustawień; limit zawczasu | tak | Z-01–Z-08 | ekran-RNTL |  | docs/monetyzacja.md:91 |
| KP-14 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | „Zarządzaj subskrypcją” w aplikacji | czesciowo | brak | ekran-RNTL | mock showManageSubscriptions | docs/monetyzacja.md:92 |
| KP-15 | BR-ZAK (kontrakt płatności) | F-35 | zakup i limit (KP) | Dni z robótką w danych synchronizowanych; scalenie nie odbiera dnia | tak | L-11, L-14, L-16, L-17, L-18 | dane-node:sqlite |  | docs/monetyzacja.md:93 |
| TT-1 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | zakup Pro w TestFlight | czesciowo | W-01 | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia) | docs/monetyzacja.md:622 |
| TT-2 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | reinstalacja, start bez „Przywróć” | czesciowo | W-02 | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia) | docs/monetyzacja.md:622 |
| TT-3 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | tryb samolotowy po zakupie, zabicie i start | czesciowo | W-03 | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia) | docs/monetyzacja.md:622 |
| TT-4 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | iPad z tym samym kontem, „Przywróć” | czesciowo | W-09 | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia) | docs/monetyzacja.md:622 |
| TT-5 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | inne konto piaskownicy, „Przywróć” | czesciowo | W-07 | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia) | docs/monetyzacja.md:622 |
| TT-6 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | „Usuń wszystkie dane”, potem „Przywróć” | czesciowo | W-02 | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia) | docs/monetyzacja.md:622 |
| TT-7 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | członek rodziny, potem odebranie | czesciowo | W-10, W-14 | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia); oczekiwanie „dane do odczytu” z modelu B, w V4 pełne dane (KP-02) | docs/monetyzacja.md:622 |
| TT-8 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | zwrot | czesciowo | W-05, W-06; OP-21 | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia); OP-21 otwarte; oczekiwanie „dane do odczytu” z modelu B, w V4 pełne dane (KP-02) | docs/monetyzacja.md:622 |
| TT-9 | BR-ZAK-001/007 | F-35 | zakup (tylko telefon) | zegarek bez telefonu | nie | brak (OP-22) | tylko-urządzenie | krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia); OP-22 → ADR-0009 | docs/monetyzacja.md:622 |

## Funkcje MVP → BR
| F | Funkcja | BR | Plik:linia |
|---|---|---|---|
| F-01 | Licznik od pierwszego uruchomienia, +1/−1, wibracja | BR-LIC-001, BR-LIC-002, BR-LIC-005 | docs/scope-contract.md:16 |
| F-02 | Historia zmian z godziną i cofnięciem | BR-LIC-003 | docs/scope-contract.md:17 |
| F-03 | Blokada przed przypadkowym stuknięciem (opcja) | BR-LIC-004 | docs/scope-contract.md:18 |
| F-04 | Kilka liczników, zmiana ustawień w trakcie | BR-LIC-006, BR-LIC-008 | docs/scope-contract.md:19 |
| F-05 | Licznik powtórzeń powiązany z rzędami | BR-LIC-007 | docs/scope-contract.md:20 |
| F-06 | Przypomnienie „co N rzędów, M razy” z podglądem planu rzędów | BR-LIC-009, BR-LIC-010 | docs/scope-contract.md:21 |
| F-08 | Cel rzędów części i jego osiągnięcie | BR-LIC-011 | docs/scope-contract.md:22 |
| F-09 | Znaczenie liczby: rząd skończony / w trakcie | BR-LIC-012 | docs/scope-contract.md:23 |
| F-10 | Ekran nie gaśnie podczas liczenia | BR-LIC-013 | docs/scope-contract.md:24 |
| F-11 | Sesja na ekranie blokady: rząd (+1) i czas razem | BR-LIC-014 | docs/scope-contract.md:25 |
| F-12 | Liczenie na zegarku | BR-LIC-015 | docs/scope-contract.md:26 |
| F-14 | Projekt z częściami (powstaje z pierwszego licznika) | BR-PRJ-001 | docs/scope-contract.md:28 |
| F-15 | Notatka widoczna przy liczniku | BR-PRJ-002 | docs/scope-contract.md:29 |
| F-16 | Zdjęcia projektu i etykiet | BR-PRJ-003 | docs/scope-contract.md:30 |
| F-17 | Dane techniczne projektu (drut mm i US) | BR-PRJ-004 | docs/scope-contract.md:31 |
| F-18 | Powrót do projektu po przerwie | BR-PRJ-005 | docs/scope-contract.md:32 |
| F-19 | Stan projektu i archiwum ukończonych | BR-PRJ-006 | docs/scope-contract.md:33 |
| F-20 | Zrób taką samą: cały projekt | BR-PRJ-007 | docs/scope-contract.md:34 |
| F-21 | Stoper sesji przy zablokowanym ekranie | BR-PRJ-008 | docs/scope-contract.md:35 |
| F-24 | Import wzoru z pliku i ze zdjęcia | BR-WZR-001, BR-WZR-002 | docs/scope-contract.md:37 |
| F-25 | Wzór i licznik na jednym ekranie | BR-WZR-005 | docs/scope-contract.md:38 |
| F-26 | Znacznik bieżącego rzędu we wzorze | BR-WZR-003 | docs/scope-contract.md:39 |
| F-27 | Synchronizacja przez iCloud (opcjonalna) | BR-DAN-002 | docs/scope-contract.md:40 |
| F-28 | Pisanie po wzorze Apple Pencil | BR-WZR-004 | docs/scope-contract.md:41 |
| F-31 | Baza na urządzeniu, trwały zapis, dane po aktualizacji | BR-DAN-001, BR-DAN-003 | docs/scope-contract.md:43 |
| F-32 | Nowy telefon, eksport i import własnej kopii (także na niepustej bazie) | BR-DAN-004, BR-DAN-005, BR-DAN-006 | docs/scope-contract.md:44 |
| F-33 | Ostatnio usunięte (projekt, licznik, część) 30 dni | BR-DAN-008 | docs/scope-contract.md:45 |
| F-34 | Usunięcie wszystkich danych | BR-DAN-009 | docs/scope-contract.md:46 |
| F-35 | Zakup Pro, przywracanie, opłacone nie znika | BR-ZAK-001, BR-ZAK-003 | docs/scope-contract.md:47 |
| F-36 | Bez reklam i śledzenia, polityka prywatności | BR-ZAK-002, BR-ZAK-004 | docs/scope-contract.md:48 |
| F-37 | Zapas włóczki i narzędzi (warstwa Narzędzia) | BR-ZAP-001, BR-ZAP-002, BR-ZAP-003, BR-ZAP-004 | docs/scope-contract.md:49 |
| F-38 | Obliczenia podstawowe: oczka z próbki, jednostki, grubość (warstwa Narzędzia) | BR-KAL-001, BR-KAL-003, BR-KAL-008 | docs/scope-contract.md:50 |
| F-45 | Wpisanie wartości licznika i wyzerowanie | BR-LIC-017 | docs/scope-contract.md:55 |
| F-46 | Licznik całości nad sekcjami kawałka | BR-LIC-018 | docs/scope-contract.md:56 |
| F-47 | Strażnik stuknięć z tempa | BR-LIC-019 | docs/scope-contract.md:57 |
| F-48 | Wibracja przypomnienia inna niż wibracja rzędu | BR-LIC-020 | docs/scope-contract.md:58 |
| F-49 | Powrót do tego samego miejsca | BR-PRJ-011 | docs/scope-contract.md:59 |
| F-50 | Lista projektów po roku | BR-PRJ-012 | docs/scope-contract.md:60 |
| F-51 | Korekta czasu sesji i dat projektu | BR-PRJ-013 | docs/scope-contract.md:61 |
| F-52 | Druga część pary (bliźniak) | BR-PRJ-014 | docs/scope-contract.md:62 |
| F-53 | Karta ukończenia projektu | BR-PRJ-015 | docs/scope-contract.md:63 |
| F-54 | Projekty dawno nieruszane | BR-PRJ-016 | docs/scope-contract.md:64 |
| F-55 | Wzór ze strony WWW i z Worda, link do filmu | BR-WZR-007 | docs/scope-contract.md:65 |
| F-56 | Zakreślanie i notatki na wzorze palcem | BR-WZR-008 | docs/scope-contract.md:66 |
| F-57 | Zgłoś problem z diagnostyką lokalną | BR-DAN-010 | docs/scope-contract.md:67 |
| F-58 | Widoczny stan synchronizacji i zegarka | BR-DAN-011 | docs/scope-contract.md:68 |
| F-59 | Kalendarz dni, dzień i podsumowanie okresu (jeden widok) | BR-DNI-001, BR-DNI-002, BR-DNI-003 | docs/scope-contract.md:69 |
| F-60 | Postęp projektu w procentach | BR-DNI-004 | docs/scope-contract.md:70 |
| F-61 | Termin projektu, cel dzienny i kolejność „który projekt dziś” | BR-DNI-005, BR-DNI-006 | docs/scope-contract.md:71 |
