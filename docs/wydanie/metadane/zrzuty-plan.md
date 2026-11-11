> **Zmiana 2026-11-10 (KO-032, P-717–P-720):** zrzuty dostają ramkę i podpis jak w Treningu, powstaje osobny zestaw na każdą lokalizację i zrzut zakupu dla App Review; opis: `docs/wydanie/zrzuty-ramki.md`. Zapis niżej „kadry i podpisy projektuje 04” zastąpiony decyzją właściciela; wygląd ramki z tokenów systemu 04 do weta.

# Plan zrzutów — App Store (rola 10, E2, 2026-10-30; zrzuty wykonane 2026-11-10 w workflowie `zrzuty-sklepu.yml`, stan i uwagi na końcu pliku)
Czeka na koniec audytu 04 (plan-prac 2.1) i zamrożenie en (2.2). Kadry i podpisy projektuje 04; fakty w podpisach tylko z `en.md`. Reguły: App Store Connect Help „Screenshot specifications” (odczyt 18.10.2026, **przeczytać ponownie w dniu wykonania**): do 10 na klasę, PNG/JPEG, bez kanału alfa; strona jest niespójna co do wymaganej klasy iPhone’a, więc robimy bezpieczny nadzbiór. Treść: aplikacja w użyciu (2.3.3), dane fikcyjne (2.3.9), płatne funkcje oznaczone (2.3.2).

## Klasy
| Klasa | Rozmiar (px) | Dlaczego | Wymagana |
|---|---|---|---|
| iPhone z Dynamic Island, duży | 1320×2868 | nadzbiór; Apple skaluje na mniejsze | tak |
| iPad 13″ | 2064×2752 | `ios.supportsTablet = true` w `app.json` (P-217: Apple Pencil) | tak |
| Apple Watch | [DO USTALENIA] | cel zegarka jest w 1.0, ale „nie sprawdzono” na urządzeniu (P-290); bez zrzutów zegarka do czasu testu; potwierdzić wymóg przy pierwszej wysyłce | warunkowo |
Język zrzutów: en (napisy w obrazie osobno dla języka albo świadomie z en — decyzja po 2.3). Tryb jasny; ciemny jako drugi komplet tylko, jeśli 04 uzna za wartość.

## Lista ekranów (7 na klasę; kolejność = ważność; zrzut 1 to ekran widoczny po starcie, zrzut 2 główna praca)
| # | Ekran × stan | iPhone | iPad | Twierdzenie w podpisie (dowód w `en.md`) | Dane fikcyjne |
|---|---|---|---|---|---|
| 1 | „Dziś” z kartą projektu: duży numer rzędu, „+1”, „Kontynuuj ›”, linia wolnych dni (ekran po każdym starcie, P-563) | tak | tak | one tap adds a row; your crafting days | projekt „Harbor Sweater”, rząd w środku |
| 2 | Licznik w trakcie po „Kontynuuj”: duży numer rzędu, +1/−1, notatka obok | tak | tak | one tap adds a row; your note next to the counter | j.w. |
| 3 | Wzór PDF obok licznika, znacznik bieżącego rzędu | tak (pion) | tak (poziom) | your pattern next to the counter | **warunek OG-07** (weryfikacja patentowa w kodzie, etap 4): bez niej zrzut 3 i 4 odpadają |
| 4 | Zakreślanie i notatki na wzorze (iPad: Apple Pencil) | tak | tak | highlight and write on the pattern | j.w. |
| 5 | Lista projektów (w toku, „last worked”, dni limitu) | tak | tak | all your projects, free 5 crafting days a month | 4–5 projektów, nie nazwy marek |
| 6 | Historia zmian z cofnięciem | tak | tak | every change with its time | z projektu z poz. 1 |
| 7 | Kalendarz dni / karta ukończenia projektu | tak | tak | your crafting days | dni w jednym miesiącu |
Nie robię zrzutu ekranu ofert Oczko Pro jako głównego (reklama zakupu bez zastrzeżeń ryzykuje 2.3.2); jeśli 04 zechce, z oznaczeniem „in-app purchase”. Bez ekranów: iCloud (do ZM-06), ekran blokady, zegarek (do 07 i testu).

## Skąd zrzuty — opcje
| Opcja | Zaleta | Koszt / ryzyko | Rekomendacja |
|---|---|---|---|
| A. Scenariusz E2E na CI z danymi fikcyjnymi (symulator iPhone duży + iPad 13″; zrzuty jako artefakt) | powtarzalne, bez czasu właściciela, bez prywatnych danych | praca 08 (osobny scenariusz „zrzuty-sklepu” z fixturą) i okno macOS; rozmiary zależą od modelu symulatora — sprawdzić `file` | **A** |
| B. Właściciel na urządzeniach | prawdziwy wygląd | czas właściciela, jego dane (2.3.9), rozmiar zależny od modelu telefonu | tylko iPad Pencil (zrzut 3), jeśli A go nie odtworzy |
| C. Makiety z kadrami 04 | pełna kontrola podpisów | to nie zrzuty aplikacji (2.3.3) | tylko ramki i podpisy wokół A |
Kontrola po wykonaniu: `file *.png` (wymiar, brak „RGBA”/„gray+alpha”), `sprawdz-wydanie.mjs` bez zmian dla zrzutów; wynik do `sklep.md` §5.

## Stan wykonania (2026-11-10, rola 10 sesja E2; PNG obejrzane narzędziem Read, wymiary i alfa: `file` na artefakcie)
- **Run 42784539154** (`992aec2`, zielony; artefakt `sklep-zrzuty-ramki` 13751726063, ważny do 24.11.2026): 14 plików RGB bez alfy — `6.9/en/` i `ipad-13/en/` po 5 (01, 02, 05, 06, 07), `warunek-og07/{6.9,ipad-13}/en/` po 2 (03, 04). Wymiary: iPhone 1320×2868; iPad 2064×2752 (pion), wzór 2752×2064 (poziom; zrzut `simctl` ma bufor pionowy, workflow obraca go o 90°, `sips -r 270`). Aplikacja z przebiegu 42773804774 (`beb7441`/`462c0ca`), nie z buildu 1 TestFlight ani z przyszłego buildu 3 — **ostateczne zrzuty do sklepu z aplikacji buildu 3** (sklep.md §3e).
- **Zgodność z listą ekranów:** 1 Dziś — iPad TAK, iPhone CZĘŚCIOWO (karta „Harbor Sweater”, „47 rows done”, „+1”, „Continue ›”; **brak linii wolnych dni w kadrze, dolny rząd kafli ucięty paskiem kart**). 2 Licznik — TAK (47, „Now working row 48”, notatka, −1/+1 row). 3 Wzór obok licznika — iPad poziomo TAK, iPhone pion CZĘŚCIOWO; 4 Zakreślenie — CZĘŚCIOWO (widać zakreślacz i podpowiedź, ale treść jak w 3). 5 Lista projektów — TAK (4 projekty, „2 of 5 free crafting days left in November”). 6 Historia z cofnięciem — TAK co do treści, ale arkusz modalny z dużą pustą powierzchnią. 7 Kalendarz — TAK.
- **Znaleziska dla roli 04 (wygląd i dane fikcyjne; nie poprawiam, zasada 15):** (1) iPhone 01: ucięte kafle, brak linii wolnych dni w kadrze; pasek „This week” w stanie pustym (siedem pustych kafli z tekstem o dniach pracy), choć 07 pokazuje dni pracy; (2) 03/04: placeholder „Test pattern” zamiast realistycznego wzoru, zakreślenie w pustym miejscu / zlane ze znacznikiem rzędu, 04 niewiele różni się od 03, nie widać notatek ani Pencil; (3) 06: modal „History” z pustą większą częścią, na iPadzie spod arkusza wystają przyciski licznika; (4) iPad: duże puste obszary (01, 02, 05, 07), pasek kart szerszy niż kolumna treści, ciemny łuk w prawym dolnym rogu (róg symulatora); (5) 07: siatka kalendarza szersza od marginesów; (6) spójność fixtury: „Harbor Sweater / Harbor Sweater, row 48” (nazwa dwa razy), 47 vs „row 48”, „last worked yesterday” a dni pracy 3 i 5.11, „2 of 5 free days left” a „2 crafting days”, kolejność czasów w historii (7:30 / 7:34 PM); fikcyjne dane mają być wiarygodne (2.3.9). Fixtura = `e2e/zrzuty-sklepu/00-przygotuj.yaml` (rola 08 wg ustaleń 04).
- **OG-07 (zrzuty 3 i 4):** decyzja własna roli 10 do weta: sceny 03 i 04 są wykonywane zawsze, ale trafiają do `warunek-og07/`, które `asc-zrzuty.yml` ignoruje (czyta tylko `<rozmiar>/<język>/`); do kompletu wchodzą dopiero z `[og07-ok]` / wejściem `og07 = true`. Bez tego komplet = 5 zrzutów na klasę (01, 02, 05, 06, 07), w wymaganym zakresie 1–10. Czy warunek OG-07 jest spełniony, rozstrzyga rola 08/koordynator (weryfikacja patentowa w kodzie, etap 4), nie ta sesja.
- **Niesprawdzone `[DO USTALENIA]`:** czy dane referencyjne Apple w `asc-zrzuty.yml` mapują wymiary poziome iPada (2752×2064) na grupę iPad 13″ — pokaże dry-run po scaleniu do `main` (`groupsFor`, `scripts/asc/zrzuty.mjs:72`); co App Store Connect robi z lokalizacjami bez własnych zrzutów (artefakt ma tylko `en`) — sprawdzić w ASC przy pierwszym wgraniu.


## Poprawki po odbiorze C1 (sesja AH, 2026-11-11; KO-036; znaleziska 10-wydanie-012…017; commity w `docs/decyzje.md` P-729…P-732)
- **012 (ramka iPada):** promień zaokrąglenia 1,5% (iPhone 7%) w `scripts/ci/ramki-sklepu.sh`; test `tests/wydanie/zrzuty-poprawki-ah.test.ts` (ImageMagick: biały znacznik w miejscu paska stanu zostaje w kadrze, pion i poziom).
- **013/014 (dane i kadry 03/04):** dane per język, wzór z treścią i scena 04 z drugim zakreśleniem — `docs/wydanie/zrzuty-ramki.md` (sekcja „Dane w kadrze w języku zestawu”). Znalezisko (2) wyżej („Test pattern”, 04 ≈ 03) zamknięte w kodzie, **sprawdzenie wzrokiem po pierwszym przebiegu C1**. **Otwarte:** notatka przy wzorze w kadrze 04 (podpis „Zakreślaj i notuj”): UI notatek rzędu wzoru (menu `wzor-menu`, arkusz `wzor-notatka-*`) nie ma scenariusza Maestro ani id akcji dodania; wymaga rozpoznania na symulatorze (PYTANIE do koordynatora).
- **016 (data i godzina):** jedna stała `ZRZUTY_TERAZ` w `scripts/ci/zrzuty-sklepu.sh` (zegar scen przez `-e` i pasek stanu `simctl --time` w ISO); fikstura: godziny sesji rosną z datą (3 XI 18:00, 5 XI 19:30, 9 XI 20:00), 9 XI ma stuknięcia (dzień pracy), więc „This week” nie jest pusty.
- **017 (zakup bez alfy):** `scripts/ci/splaszcz-png.mjs` + kontrola `wymiary-asc.mjs --plik` w skrypcie zrzutów (odstępstwo od brzmienia zadania: krok w skrypcie, nie w workflow; macOS nie ma ImageMagicka).
- **015 (puste kadry iPada) — znane, bez zmiany na 1.0 (KO-036):** na iPadzie aplikacja pokazuje układ telefonu w wąskiej kolumnie (02 ok. 50%, 05 ok. 60%, 06 ok. 75% pustego wg AG). Układ aplikacji bez zmian; więcej danych w fiksturze (013/014) zmniejsza pustkę tylko tam, gdzie lista rośnie. **Warunek powrotu:** decyzja 04/03 o kadrach i układzie iPada po 1.0 (albo wcześniej, gdy właściciel uzna kadry iPada za blokadę wydania); do tego czasu do sklepu idą kadry iPada w obecnym układzie albo bez nich (decyzja właściciela przy C4).
