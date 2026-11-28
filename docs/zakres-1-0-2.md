# Zakres 1.0.2 — paczka dla ról 04 i 05

Rola 03-zakres, tryb fix, moduł `zmiany-zakresu` (ZK1, 2026-11-28; gałąź `claude/zk1-zakres-1-0-2-2026-11-28` od a19146b8). Wiersze bramki: ZM-19…ZM-26 w `docs/scope-contract.md` („Zmiany zakresu”); decyzje: P-1088 (KO-229), P-1089 (KO-230), P-1090 (formy, kolejność, bezpieczniki).

**Decyzja właściciela (2026-11-28 ok. 10:35 UTC, czat koordynatora, dosłownie):** „wybieram A. U1-U7 - zacznij prace nad 1.0.2. U8 i U9 - trzeba zrobic research i zaplanowac. Bez estymacji nie ejstem w stanie podjac decyzji. U10 - co rekomendujesz?” U10: rekomendacja koordynatora KO-230 (do weta) — tylko podpowiedź tekstowa przy wyborze typu licznika.

**Źródło sygnałów:** jeden wątek w polskiej grupie dziewiarskiej na Facebooku, 27–28.11.2026, ok. 20 komentujących; liczby osób przy U to sygnał, nie dowód (n małe). Pełne sygnały bez nazwisk: prywatne repo warsztatu (`11-wzrost/2026-11-24-fb/`). U8, U9: research i plan z szacunkiem (RS1, rola 01) — poza tą paczką. Android i Garmin poza 1.0.2 (P-011).

## Apetyt, koszt i warianty

Apetyt (polecenie ZK1): jedna wersja ≈ tydzień pracy agentów + jeden test F właściciela. Koszt roli 03 to godziny właściciela (zasada roli 5); czas agenta podany osobno, bo wyznacza termin.

| U | ZM | Role | Czas agenta [OCENA] | Właściciel w teście F [OCENA] | Ryzyko terminu |
|---|---|---|---|---|---|
| U1 | ZM-19 | — (zrobione, P-1082 (2)) | 0 | 5 min | niskie |
| U2 | ZM-20 | 05 → 07 → 08 | 0,5–1 dnia | 0 (testy B) | średnie (reguła 05) |
| U3 | ZM-21 | 04 (+ pytanie do 05) → 07 → 08 | 0,5 dnia | 3 min | niskie |
| U4 | ZM-22 | 05 i 04 → 07 → 08 (Swift) | 1 dzień | 5 min | średnie |
| U5 | ZM-23 | 04 → 07 → 08, 09 | 0,5 dnia | 5 min (zużywa 1 kod) | niskie |
| U6 | ZM-24 | 05 i 04 → 07 → 08, 09 | 1–1,5 dnia | 10 min | wysokie (dziennik, iCloud) |
| U7 | ZM-25 | RS1 (01) → 04 → 07 → 08, 09 | 0,5–1,5 dnia | 5–10 min | wysokie (forma nieznana) |
| U10 | ZM-26 | 04 → 09 → 08 | 0,25 dnia | 2 min | niskie |
| razem | | | ≈ 4,25–6,75 dnia agenta (część równolegle) | ≈ 35–45 min, jeden test F | |

Metoda: liczba sesji ról × typowy czas sesji fix/build z ostatnich partii (EB1, KA1: ≈ 0,5 dnia na sesję 08 z testami) — [OCENA ×0,5–2]. Czeka się na: build i bramkę iOS w CI (≈ 100 min macOS na przebieg, maszyny macOS zwykle niedostępne ok. 14:00–23:00 UTC — `docs/fakty-wlasciciela.md`), TestFlight, test F właściciela, App Review.

**Warianty (decyzja: koordynator wg P-087, właściciel może zawetować):**
- **A (rekomendacja):** wszystkie osiem (U1–U7, U10) w 1.0.2, z dwoma bezpiecznikami niżej. Zgodne dosłownie z decyzją właściciela; ryzyko: górna granica szacunku przekracza tydzień — wtedy działa bezpiecznik, wydanie nie czeka.
- **B:** U7 od razu na 1.0.3 (1.0.2 ≈ 3,75–5,25 dnia agenta, mniej niewiadomych). Kompromis: odchodzi od słów właściciela „U1-U7”, więc wymaga jego zgody; zysk niepewny, bo U7 i tak czeka na RS1, a reszta idzie równolegle.

**Bezpieczniki (przesunięcie na 1.0.3 bez blokowania wydania; zapis w P-1090):**
1. **U7** przechodzi na 1.0.3, jeśli w chwili startu sesji 04 dla 1.0.2 nie ma wybranej formy po RS1 albo wybrana forma wymaga uprawnienia do powiadomień.
2. **U6** przechodzi na 1.0.3, jeśli 05 wybierze zapis zdarzenia „+2”, który starsza wersja aplikacji przeczyta błędnie (zła liczba na drugim urządzeniu przez iCloud), a bezpiecznego wariantu nie da się zrobić w 1 sesji 08.
Żaden bezpiecznik nie dotyczy U1–U5 ani U10. Przesunięcie zapisuje koordynator w `docs/decyzje.md` z powodem; wiersz ZM dostaje „przesunięte na 1.0.3”.

**Cięcia:** nic z wersji 1.0 nie wypada; 1.0.2 nie dokłada zakładki, ekranu na drodze pętli ani nowego uprawnienia (U7 z powiadomieniem tylko opt-in i tylko przez bezpiecznik 1).

## Kolejność ról i zależności

```
U1 ─────────────────────────────────────────────── test F (PU-126)
U2 ── 05 ──────────────── 07 (PU, test) ── 08
U4 ── 05 (potwierdzenie) ┐
      04 (makiety) ──────┴ 07 ── 08 (Swift: Live Activity)
U6 ── 05 (zapis +2) ─────┐
      04 (ustawienie) ───┴ 07 ── 08 (aplikacja, ekran blokady, zegarek) ── 09
U3, U5, U10 ── 04 ─────── 07 ── 08 ── 09 (U5, U10: teksty)
U7 ── RS1 (01) ── 04 ──── 07 ── 08 ── 09
01 (ER, równolegle, nie blokuje 04 ani 08): U3, U4, U5, U6, U7 → kryteria BR przed zamknięciem 1.0.2 (ślad ZAK-09)
```

Jedna sesja 05 dla U2, U4, U6 (i pytania U3); jedna sesja 04 dla U3, U4, U5, U6, U10 (U7 dołącza, gdy RS1 da formę). 08 może zaczynać od U3, U5, U10 (bez 05), równolegle z 05.

## Paczka dla roli 05 (architektura)

Projektować (wynik: ADR albo uzupełnienie ADR-0008/ADR-0009, z wektorami domeny):
- **U2 (ZM-20) — reguła rozwidlenia ekran blokady ↔ aplikacja.** Dziś: konflikt `scal` → wartość bez zmian, flaga `konflikt`, baner PU-127 się nie pokazuje (`docs/jakosc/eb1-stan.md`, P-1081 (3)). Opcje do oceny: (a) gałąź z samych `plus` scalona sumą (każde stuknięcie to skończony rząd) + istniejący baner PU-127 „Dodano n rzędów z ekranu blokady o …. Cofnąć?”; (b) istniejąca linia „Dwie wersje tego licznika” i arkusz wyboru (PU-099, PU-313); (c) (a) dla gałęzi z samych `plus`, (b) gdy gałąź ma −1, wpisanie albo zerowanie. Rekomendacja 03: (c) — nie gubi stuknięć (zasada wspólna 10), nie każe wybierać, gdy odpowiedź jest jedna, i nie zgaduje przy zmianach niezsumowalnych (NFR-DAN-003). Do rozstrzygnięcia przy okazji: akceptacja odstępstwa P-1080 (poczekalnia 24 h) od ADR-0008 (3).
- **U4 (ZM-22) — „−1” z intencji Live Activity.** Potwierdzić, że linia `minus` z ekranu blokady idzie tą samą drogą co `minus` z zegarka (ADR-0008 (1) już mówi o `wartosc ± 1`; ADR-0009: zdarzenia +1/−1 z zegarka); reguła limitu: −1 nigdy nie zaczyna dnia i nie jest blokowane limitem (korekta własnych danych); −1 przy wartości 0 — bez zmiany (jak w aplikacji); blokada licznika (`zablokowany`, F-03) blokuje też −1.
- **U6 (ZM-24) — zapis zdarzenia „+2”.** Wybór między (a) jednym zdarzeniem z polem kroku (ryzyko: starsza wersja na drugim urządzeniu przez iCloud pomija nieznane pole i liczy +1 — ADR-0008 (4)) i (b) dwoma zdarzeniami `plus` z jednego stuknięcia (zgodne wstecz; ryzyko: strażnik tempa RD-17 i historia widzą dwa stuknięcia). Wymagania: liczba zgodna na wszystkich urządzeniach także przy mieszanych wersjach; strażnik tempa nie uznaje jednego stuknięcia „+2” za serię; cofnięcie z historii cofa całe stuknięcie; przypomnienia według istniejącej reguły skoku RD-13 („przy wpisaniu b > a + 1 — raz”); cel części F-08 przy przeskoczeniu celu. Gdy żadna opcja nie mieści się w 1 sesji 08 — bezpiecznik 2.
- **U3 (ZM-21) — jedno pytanie.** Czy liczniki z 1.0/1.0.1 mają w bazie jawnie zapisane znaczenie, czy „brak wartości = skończone rzędy”? W drugim przypadku zmiana wartości domyślnej zmieniłaby liczbę istniejących liczników — wtedy najpierw migracja w transakcji zapisująca „skończone rzędy” dla istniejących (zasada wspólna 10, test na kopii bazy 1.0.1).

Nie projektować: nowej synchronizacji, zmian iCloud poza zgodnością zdarzenia „+2”, nowego ekranu konfliktów (używamy PU-099/PU-127), zmian limitu dni.

## Paczka dla roli 04 (projekt)

Wspólne: wygląd tylko z systemu `docs/design/` („Dzianina”); ekran licznika spokojny (P-046); nic przed „Dziś” i nad „+1” (NFR-PIE-001 po ZM-18); teksty w kluczach i18n (ADR-0017), polski i angielski od 04, reszta języków u 09. Kryterium „gotowe” dla 04 przy każdym U: makieta albo tekst w `docs/design/` + przejście poznawcze (cztery pytania NN/g) na ścieżce pierwszego użycia podanej niżej, wynik do kolumny „Intuicyjność” przez bramkę `zmiany-zakresu`.

Projektować:
- **U3 (F-09):** zachowanie wartości domyślnej (niżej) i to, co pokazuje karta „Pierwszy licznik” na „Dziś” przy nowym znaczeniu (dziś 0; w trybie „rząd w trakcie” przy 0 skończonych licznik pokazuje 1 — RD-12-W8). Ścieżka: świeża instalacja → „Dziś” → „+1” → licznik → czy liczba i opis pod nią („Liczba 11 znaczy: pracujesz nad rzędem 11.”, PU-026) są zrozumiałe bez ustawiania.
- **U4 (F-11):** „−1” na ekranie blokady i w Dynamic Island (rozwinięta): mniejsze i odsunięte od „+1” (HIG Live Activities, cytat w ZM-22); stany z P-133 (typowy, przypomnienie, limit, odblokuj, błąd zapisu, zablokowany) z −1; teksty dostępności „−1 rząd” (istnieją, P-133 pozycje D).
- **U5 (F-35):** przycisk realizacji kodu na ekranie „Oczko Pro” obok „Przywróć zakupy”; tekst jak w Treningu „Zrealizuj kod” ⟦Redeem code⟧ (P-315; tłumaczenia 35 języków do przejęcia z Treningu przez 09) albo „Mam kod” — wybór 04 z uzasadnieniem; komunikat bez sieci (w Treningu: „An internet connection is needed.”). Bez nowego wiersza w Ustawieniach i bez wejścia na „Dziś”.
- **U6 (F-04):** ustawienie „Krok” w formularzu licznika (obok „Liczy” i długości powtórzenia); przy kroku 2 przycisk pokazuje „+2” na liczniku, karcie „Kontynuuj”, ekranie blokady i zegarku; −1 zostaje −1 (korekta pojedynczego rzędu) — do potwierdzenia przejściem; bez gestu i bez drugiego przycisku.
- **U7 (F-nn po formie):** po RS1 jedna z form niżej.
- **U10 (F-04):** jedno zdanie przy typie „Oczka” ⟦Stitches⟧ w „Dodaj licznik” (że służy też do łańcuszka); bez nowego typu.

Nie projektować: nowej zakładki, ekranu ani kroku przed pierwszym +1; drugiego przycisku „+2”; przełącznika znaczenia na ekranie licznika (U3 wariant B — tylko jeśli koordynator wybierze go zamiast rekomendacji); powiadomień przypominacza włączonych domyślnie; U8, U9 (RS1).

**U7 — możliwe formy (wejście dla 04 po RS1; ryzyko natrętności):**

| Forma | Co robi | Natrętność | Inne ryzyka |
|---|---|---|---|
| F1 „Czas od ostatniego +1” | Na ekranie blokady i w aplikacji cicha linia „ostatni rząd n min temu” (licznik czasu systemu, bez procesu aplikacji); użytkownik sam widzi, że mógł nie stuknąć | niska (bez dźwięku, wibracji i okna) | pomaga tylko, gdy ktoś spojrzy; na liczniku to nowy element — wyjątek od P-046 do nazwania albo tylko ekran blokady |
| F2 „Ciche pytanie na liczniku” | Po N min bez +1 przy otwartym liczniku (ekran nie gaśnie, F-10) linia „Skończony rząd? Stuknij +1” pod liczbą; znika po +1 | średnia (pojawia się sama) | rzędy mają bardzo różną długość — fałszywe przypomnienia przy przerwie; N z tempa użytkownika albo stałe (decyzja 04 po RS1) |
| F3 „Delikatna wibracja albo powiadomienie” | Po N min bez +1 w aktywnej sesji (zegarek albo telefon) | wysoka | nowe uprawnienie do powiadomień (ZAK-01, prywatność); tylko opt-in w ustawieniach licznika, domyślnie wyłączone; uruchamia bezpiecznik 1, jeśli wymaga powiadomień |

Rekomendacja 03 (przed RS1, [OCENA]): F1 na ekranie blokady jako pierwsza, F2 opcjonalnie, F3 tylko przy dowodzie z RS1 i jako opt-in.

## Kryteria „gotowe” per usprawnienie (dla 07 i 08)

Każde U: nowy albo zmieniony PU w `docs/jakosc/przypadki-uzycia.md` i test przed kodem (P-835, zasada wspólna 22); bramka iOS zielona; punkt w teście F właściciela, jeśli klasa F.

### U1 — właściwa liczba po odblokowaniu (ZM-19)
Gotowe: na buildzie 1.0.2 test F PU-126 bez półsekundowej starej liczby (słowa właściciela z datą w `docs/decyzje.md`); test w `tests/ekrany/aplikacja.test.tsx` (P-1082 (2)) zielony. Kod już na integracji.

### U2 — rozwidlenie nie zostaje ciche (ZM-20)
Gotowe: reguła 05 zapisana (ADR); nowy PU (klasa B, atrapa rozwidlenia): po rozwidleniu z samych `plus` wartość = głowa + oba odgałęzienia i baner PU-127 (jeśli 05 wybierze (a)/(c)), albo linia „Dwie wersje tego licznika” (PU-099); żadne stuknięcie nie znika; linia diagnostyczna `lockscreen: pending=N conflicts=M` (P-1082 (1)) bez zmian.

### U3 — domyślnie „Rząd, nad którym pracuję” (ZM-21)
Gotowe: zmieniony PU-026 i PU-005 (karta „Pierwszy licznik” według projektu 04); nowy licznik w nowej instalacji pokazuje „rząd w trakcie” (przy 0 skończonych: 1, RD-12-W8); nowy licznik w istniejącym projekcie bierze znaczenie z ostatnio używanego; test na kopii bazy 1.0.1: istniejące liczniki pokazują te same liczby co przed aktualizacją; RD-12, RD-13, RD-21 bez zmian (już liczą oba tryby).

### U4 — „−1” na ekranie blokady (ZM-22)
Gotowe: nowy PU (klasa F) „−1 z ekranu blokady” i zmieniony PU-126; test jednostkowy/XCTest intencji `minus` (wartość, głowa, rodzic jak w ADR-0008 (1)), −1 przy limicie dozwolone, przy zablokowanym liczniku nie; test F: +1 ×3, −1 ×1 na ekranie blokady → po odblokowaniu wartość +2, bez konfliktu.

### U5 — realizacja kodu w aplikacji (ZM-23)
Gotowe: nowy PU (klasa B: przycisk wywołuje arkusz w sztucznym sklepie; bez sieci komunikat; klasa F: prawdziwy kod daje Pro); test komponentu jak w Treningu (`tests/subscription-ui.test.tsx` w repo `trening`); po realizacji Pro widoczne bez restartu (nasłuch transakcji od startu, P-1072); opis w `docs/wydanie/kody-ofert.md` zmieniony: wpis może podać sam kod („Ustawienia → Oczko Pro → Zrealizuj kod”).

### U6 — krok +2 (ZM-24)
Gotowe: reguła zapisu 05; nowy PU (klasa B: krok 2 → „+2” → wartość +2, jedno cofnięcie z historii cofa +2, strażnik tempa nie reaguje na jedno stuknięcie; klasa F: „+2” na ekranie blokady i zegarku); test zgodności dziennika ze starszą wersją według decyzji 05; przypomnienia i cel części według RD-13 i BR-LIC-011 przy skoku.

### U7 — przypominacz (ZM-25)
Gotowe: forma wybrana po RS1 i zapisana w `docs/decyzje.md`; nowy PU dla formy; brak elementu przed „Dziś” i nad „+1”; forma z powiadomieniem tylko opt-in (domyślnie wyłączona) albo przesunięta na 1.0.3 (bezpiecznik 1); wiersz F-nn w kontrakcie po formie.

### U10 — podpowiedź łańcuszka (ZM-26)
Gotowe: zmieniony PU-030 (podpowiedź widoczna przy typie „Oczka” w „Dodaj licznik”); klucz tekstu w 35 językach (09), przekład oznaczony jak reszta (D-026); bez nowego typu licznika.

## Skutki dla innych ról

- **01 (ER, numery nada 01; równolegle):** BR-LIC-012 — domyślny tryb nowego licznika (U3); NFR-PIE-001 (2) „karta licznika z wartością 0” → wartość startowa według znaczenia (U3); BR-LIC-014 — „−1” na ekranie blokady (U4); BR-ZAK-001/BR-ZAK-003 — realizacja kodu oferty w aplikacji (U5); nowe BR: krok licznika (U6), przypominacz (U7, po RS1).
- **02:** nowa droga do Pro przez kod w aplikacji (U5) — KP-13 bez zmian (ekran zakupu z tych samych miejsc); −1 i „+2” wobec limitu dni (U4, U6): dzień zużywa praca przy robótce, −1 dnia nie zaczyna.
- **06:** brak treści merytorycznych; U10 to termin szydełkowy w 35 językach bez źródła terminologii (OP-12) — przekład oznaczony.
- **07:** PU i testy przed kodem dla każdego U (lista wyżej); przepisanie asercji „karta 0” (U3).
- **09:** teksty U5 (przejęcie z Treningu), U6, U7, U10 w 35 językach.
- **10:** jeden build 1.0.2 i jeden test F; notatka wydania (U1, U3, U4, U5, U6, U10; U7 jeśli wchodzi).
- **11:** po wydaniu wpisy z samym kodem dozwolone (U5; P-1072 do zmiany przez 11 po wydaniu).

## Test F właściciela na buildzie 1.0.2 (lista zawężona)

Tylko to, co zmienia 1.0.2 (`docs/fakty-wlasciciela.md`: testuje tylko zmiany od ostatniego testu): U1 (PU-126 bez starej liczby), U4 (−1 na ekranie blokady), U5 (realizacja prawdziwego kodu), U6 („+2” w aplikacji, na ekranie blokady i zegarku), U3 (nowy projekt pokazuje „rząd w trakcie”; stary projekt bez zmiany liczby), U7 (jeśli wchodzi), U10 (podpowiedź widoczna). U2 bez punktu F (stanu nie da się wywołać ręcznie). [OCENA] 35–45 min.

## Kontrola

- `zakres-oczko.mjs docs/scope-contract.md --brd docs/brd --apetyt 45` (skrypt Oczka w warsztacie `03-zakres/2026-10-22-build/`): przed ZK1 kod 0 (0 błędów, 3 uwagi); po ZK1 kod 0 (0 błędów, 4 uwagi — nowa: F-09 do ponownej oceny 04 po 1.0.2).
- Kontrola macierzy U → ZM → F → „Gotowe” i PU (skrypt roli w scratchpadzie sesji, wynik w `docs/zakres-1-0-2-stan.md`): przed kod 1 (8 błędów: brak wierszy ZM dla ośmiu U), po kod 0.
- Skrypt biblioteki `zakres.mjs` (moduł `ciecie`, prompts @af4c0a8) daje na tym kontrakcie kod 1 przed i po (16 błędów „poza pętlą bez D-nnn” i „F-61 z H”) — wyjątek nazwany P-049 (5): kontrakt Oczka zapisuje decyzje jako P-nnn, które przyjmuje tylko `zakres-oczko.mjs`; stan bez zmian od 2026-11-03.
