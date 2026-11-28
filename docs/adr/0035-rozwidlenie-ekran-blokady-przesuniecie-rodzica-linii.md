# 0035. Rozwidlenie ekran blokady/zegarek ↔ aplikacja: linia ±1 z dziennika dostaje przy scaleniu rodzica = bieżącą głowę, gdy zmiany po jej rodzicu są przemienne; inaczej konflikt jak dziś (PU-099). −1 z Live Activity tą samą drogą co z zegarka
Data: 2026-11-28 · Status: **proponowana** (do weta koordynatora wg P-087; P-1096) · Rola: 05 (fix AR1, ZM-20, ZM-22; KO-229, KO-232) · Uzupełnia: ADR-0008 (3), (8), ADR-0009 · Zależy od: ADR-0005, P-1079, P-1080, P-1081 (3), NFR-DAN-002, NFR-DAN-003

## Kontekst i problem
Linia z ekranu blokady albo z zegarka ma za rodzica `glowa` ze stanu Live Activity albo z kontekstu zegarka (ADR-0008 (1), ADR-0009). Gdy ten stan jest nieaktualny (aplikacja zapisała +1, a aktualizacja Live Activity nie doszła albo zegarek był poza zasięgiem), linia rozwidla historię: `scal` zwraca `konflikt`, wartość zostaje bez zmian, licznik ma flagę `konflikt` (`src/dane/repozytoria/przelicz.ts:13-15`), baner PU-127 się nie pokazuje (P-1081 (3), `docs/jakosc/eb1-stan.md`). Linia konfliktu PU-099 pokazuje się, bo `kandydaciKonfliktu` nie zależy od źródła (`src/kompozycja/licznik.ts:102-107`), ale każe wybrać jedną wersję. Każdy wybór gubi stuknięcia drugiej gałęzi. U4 dokłada −1 na ekranie blokady, więc gałąź może mieć też −1.

## Czynniki decyzji
- Zero utraty stuknięć (zasada wspólna 10, NFR-DAN-002); każde stuknięcie to skończony rząd (+1) albo korekta o jeden rząd (−1).
- Nic po cichu przy zmianach nieprzemiennych (NFR-DAN-003): wpisanie, zerowanie, cofnięcie i rozstrzygnięcie ustawiają wartość bezwzględnie, więc ich kolejność wobec stuknięcia zmienia wynik.
- Zgodność z 1.0.1 przez iCloud: zdarzenia tylko istniejących rodzajów, bez nowych pól i bez nowego pola CloudKit (paczka 05: „nie projektować zmian iCloud”).
- Linia dziennika jest lokalna: do chwili scalenia nie ma jej w `zdarzenie` ani w iCloud, więc jej rodzica można ustalić przy scaleniu. P-1080 już tak robi dla rodzica, który nie doszedł w 24 h.
- Koszt dla 08: zmiana w jednym miejscu (`scalLinie`, `src/przypadki-uzycia/dziennik.ts`), bez zmian w `scal`, w cofaniu i w banerach.

## Rozważane opcje
- **A.** Gałąź z samych `plus` zsumowana zdarzeniem łączącym (`rozstrzygniecie` z kilkoma rodzicami), baner PU-127 (paczka 03, opcja a).
- **B.** Zawsze linia „Dwie wersje” i arkusz wyboru (PU-099, PU-313; paczka, opcja b).
- **C.** A dla gałęzi z samych `plus`, B w pozostałych przypadkach (rekomendacja 03, opcja c).
- **D.** Wariant C bez zdarzenia łączącego. Przy scaleniu linia ±1 ze źródła `ekran_blokady` albo `zegarek` dostaje za rodzica bieżącą głowę („przesunięcie rodzica”), gdy wszystkie zdarzenia od jej rodzica do głowy są przemienne (±1) albo nastąpiły nie później niż stuknięcie. W przeciwnym razie zostaje rodzic z linii, a konflikt pokazuje się jak dziś (B).

## Decyzja
Wybrano **D**, czyli formę C z paczki z dwiema zmianami: obejmuje −1 (U4) i nie zapisuje zdarzenia łączącego.

Uzasadnienie:
- Wynik jest ten sam co w C dla gałęzi z samych +1, czyli suma i baner PU-127. Historia zostaje jednak liniowa, więc działają bez zmian: `cofnijOstatnie` i `cofnijSerie` (oba chodzą po `rodzice[0]`, `src/przypadki-uzycia/licznik.ts:87-118`), baner serii i strażnik tempa.
- A i C wymagałyby nowej obsługi cofania przez zdarzenie łączące. Groziłyby też fałszywym konfliktem dwóch zdarzeń łączących z dwóch urządzeń. B gubi stuknięcia przy każdym wyborze.
- −1 jest przemienne z +1 (suma kroków), więc gałąź z −1 z ekranu blokady też się sumuje. Bez tego U4 cofałoby użytkownika do arkusza za każdym razem, gdy stan Live Activity jest nieaktualny.

**Reguła (czysta funkcja domeny `przesuniecieRodzica`, wektory PR-01…PR-18 i scenariusze SC-01…SC-06 w `docs/architektura/wektory-1-0-2.json`):**
1. Dotyczy tylko linii dziennika (`scalLinie`) ze źródłem `ekran_blokady` albo `zegarek` i rodzajem `plus` albo `minus`. Zdarzenia z iCloud, importu i aplikacji są bez zmian.
2. Głowa = `ostatnie.get(licznik) ?? stan.glowa` (jak w P-1080). Gdy licznik ma `konflikt = 1`, czyli więcej niż jedną głowę, reguła nie przesuwa (PR-09).
3. `rodzic linii = głowa` → bez zmian (PR-01). `rodzic = null` (Live Activity uruchomiona na pustym liczniku) i licznik ma zdarzenia → reguła traktuje całą historię jako „po rodzicu” (PR-14).
4. Zbiór „po rodzicu” = przodkowie głowy (po wszystkich rodzicach) bez przodków rodzica linii, najwyżej `DZIENNIK_PRZESUNIECIE_MAKS` zdarzeń. Gdy rodzic nie jest przodkiem głowy albo limit się wyczerpał → rozwidlenie (PR-10, PR-11).
5. **Przesunięcie**, gdy każde zdarzenie „po rodzicu” jest `plus` albo `minus` albo ma `czas_ms ≤ czasMs linii` (PR-02…PR-05, PR-17, PR-18). W przeciwnym razie **rozwidlenie**: linia zostaje z własnym rodzicem, `scal` zwraca konflikt, a linia PU-099 pokazuje obie wersje (PR-06…PR-08, SC-02).
6. Po przesunięciu `wartosc_po = max(0, wartość głowy ± 1)`, jak dziś w `scalLinie` (SC-06: −1 przy 0 nie schodzi poniżej 0, M-06). Kolejne linie łańcucha mają za rodzica poprzednią linię, więc nie wymagają przesunięcia (SC-01, SC-05).
7. **Ponowna dostawa** linii przesuniętej albo zastąpionej (P-1080) nie jest kolizją id, gdy zgadzają się `licznik`, `rodzaj`, `czasMs`, `urzadzenie` i `zrodlo`; różnić się wolno tylko rodzicom. To zastępuje sprawdzenie śladu `dziennik_rodzic_zastapiony` w `blad` (`src/przypadki-uzycia/dziennik.ts:41`), który znika przy `przytnijBledy`. Dotyczy obu źródeł.
8. Przesunięcie nie zapisuje wpisu w `blad`, bo to zwykła ścieżka. Linia diagnostyczna `lockscreen: pending=N conflicts=M` (P-1082 (1)) zostaje bez zmian.

**Odstępstwo P-1080 od ADR-0008 (3): przyjęte.** Linia bez rodzica czeka w poczekalni najwyżej `POCZEKALNIA_EKRANU_MS` (24 h), potem dołącza do bieżącej głowy. To ta sama zasada co tutaj (stuknięcie = rząd), zastosowana wtedy, gdy przemienności nie da się sprawdzić, bo rodzica nie ma. Ryzyko, że rodzic dojdzie po 24 h, jest teoretyczne: linie łańcucha leżą w jednym pliku, a P-1079 ponawia poczekalnię przy każdym scaleniu.

**Parametr:** `DZIENNIK_PRZESUNIECIE_MAKS = 500` (zdarzeń; `src/konfiguracja.ts`, wpis w tabeli „Konfiguracja” w `moduly.md`) [OCENA: Live Activity żyje najwyżej 12 h (rejestr Apple 1a), 500 zmian w aplikacji w tym czasie to więcej niż realna praca; przy przekroczeniu skutkiem jest konflikt pokazany, nie utrata]. Przejście w jednej transakcji scalenia, odczytami po kluczu głównym.

### U4 — −1 z ekranu blokady (ZM-22)
- **Droga potwierdzona w kodzie:**
  - intencja ma już parametr `rodzaj` (`targets/widget/_shared/Stuknij.swift:16`, nazwy zamrożone, X-DZ-10);
  - `IntencjaEkranuBlokady.wykonaj` mapuje go na `ZdarzenieWejsciowe.Rodzaj` i woła wspólne `stuknij` (`modules/oczko-dziennik-plus/ios/Wykonanie.swift:13-19`);
  - zegarek woła tę samą funkcję (`stuknij(..., zrodlo: .zegarek)`, `modules/oczko-reguly/Sources/OczkoDziennik/Intencja.swift:22-24`).
  
  Brakuje tylko przycisku `OczkoStuknij(rodzaj: "minus")` w widoku (`targets/widget/Aktywnosc.swift:195`: dziś tylko „plus”). Wygląd projektuje 04 (P-1088: mniejsze i odsunięte od +1). Bez nowego typu intencji i bez nowego pola linii.
- **Reguły** (już w `stuknij`, potwierdzone wektorami IN-05…IN-07):
  - blokada licznika jest sprawdzana przed wszystkim innym i blokuje też −1 (F-03, `modules/oczko-reguly/Sources/OczkoDziennik/Intencja.swift:24`);
  - −1 przy wartości 0 daje `bezZmiany`, bez linii (`modules/oczko-reguly/Sources/OczkoDziennik/Intencja.swift:30-31`);
  - −1 nie woła strażnika limitu (`wolaStraznika("minus") == false`, `modules/oczko-reguly/Sources/OczkoReguly/Limit.swift:51`), więc nie zaczyna dnia i limit go nie blokuje;
  - scalenie na telefonie nie woła strażnika (ADR-0008 (6)).
- **Defekt do naprawy (08, Swift; realny po U4, dziś brzegowy na zegarku):** `StanEkranuBlokady.po` ustawia `dzienDozwolony: true` i `dzien` = dzień zdarzenia przy każdej zmianie, także przy −1 (`modules/oczko-reguly/Sources/OczkoReguly/Stan.swift:83-86`). W stanie limitu (`dzienDozwolony == false`) −1 przywraca w Live Activity przycisk +1 (`targets/widget/Aktywnosc.swift:194`). Następne +1 trafia na `startDnia` i znów pokazuje limit, a zegarek zachowuje się tak samo. **Kontrakt:** −1 nie zmienia `dzien` ani `dzienDozwolony` (IN-08, IN-09).
- **Rozwidlenie dla −1:** jak dla +1, według reguły wyżej (PR-16, SC-03).
- **Kolejność pierwszeństwa stanów widoku** (zablokowany → limit → uwaga → przypomnienie → typowy, P-142) zostaje. Czy −1 jest widoczne w stanie limitu, rozstrzyga projekt 04. Architektura na to pozwala, bo −1 nie zależy od limitu.

### Konsekwencje
- Dobre:
  - żadne stuknięcie z ekranu blokady ani z zegarka nie znika i nie wymaga wyboru, gdy odpowiedź jest jedna;
  - baner PU-127 działa także po nieaktualnym stanie Live Activity;
  - zero nowych rodzajów zdarzeń, pól i rekordów iCloud;
  - 1.0.1 na drugim urządzeniu dostaje zwykłe zdarzenia ±1 z jednym rodzicem.
- Złe:
  - kolejność w historii to kolejność scalenia, nie czasu stuknięcia (czas zostaje w `czas_ms` i w historii);
  - zegarek wysyła po rozwidleniu linię z innym rodzicem niż w swojej kolejce, ale potwierdzenie po `id` (ADR-0009 pkt 3–4) tego nie widzi.
- Ryzyko szczątkowe (brzegowe):
  - zmiana nieprzemienna z drugiego urządzenia, różnica zegarów urządzeń przy porównaniu `czas_ms`. Skutkiem jest konflikt pokazany (B) albo suma, nigdy utrata;
  - etykieta wersji w PU-099 dla gałęzi z ekranu blokady: `kandydaciKonfliktu` podaje nazwę urządzenia (to samo urządzenie dla obu gałęzi). Tekst „z ekranu blokady” to sprawa 04 (zgłoszenie w przekazaniu, bez projektowania tutaj).
- Od czego zależy: U6 (ADR-0036). Linie „+2” to dwie linie `plus` z łańcuchem rodziców, więc reguła obejmuje je bez zmian (SC-05).

### Potwierdzenie
- Wektory PR, SC i IN w `docs/architektura/wektory-1-0-2.json`. Prototyp i kontrola z mutantami: `node docs/architektura/eksperymenty/1-0-2/sprawdz.mjs`, wynik w `sprawdz.out`. Scenariusze liczą wartość niezależnym prototypem `scal` z E1.
- Test 07/08 (TS, `node:sqlite`): `scalDziennikWKolejce` na scenariuszach SC-01…SC-06 daje wartość, `konflikt` i rodziców z wektora. Ponowna dostawa przesuniętej linii nie daje `dziennik_kolizja_id` (reguła 7). Przesunięcie nie zmienia `pending/conflicts` w zgłoszeniu.
- Test Swift (`swift test` pakietu): wektory IN dla `stuknij` (z parametrem kroku, ADR-0036).
- PU (07): nowy B „rozwidlenie z ekranu blokady sumuje się” (atrapa nieaktualnej głowy → wartość głowa + k, baner PU-127, bez linii PU-099); zmieniony PU-126/PU-127 dla −1 (klasa F: +1 ×3, −1 ×1 → +2, kryterium „gotowe” U4).
- Pozycje listy kontrolnej: ARCH-12 (zapis w jednej transakcji scalenia), ARCH-18 (konflikt nigdy cichy).

## Opcje: zalety i wady
### A — zalety: suma; jawne zdarzenie łączące · wady: cofanie przez zdarzenie łączące wymaga nowej reguły; dwa urządzenia tworzą dwa różne zdarzenia łączące (fałszywy konflikt), chyba że id byłoby deterministyczne; −1 z U4 wraca do arkusza.
### B — zalety: zero kodu; nic po cichu · wady: każdy wybór gubi stuknięcia drugiej gałęzi (zasada 10); arkusz przy odpowiedzi oczywistej.
### C — zalety: suma, gdy oczywista; arkusz przy niejasnych · wady: jak A (zdarzenie łączące); −1 z U4 zawsze do arkusza.
### D — zalety: jak C bez zdarzenia łączącego; historia liniowa; jedno miejsce zmiany; obejmuje −1 i „+2” · wady: kolejność w historii według scalenia; reguła zależy od porównania czasu przy zmianach nieprzemiennych.
