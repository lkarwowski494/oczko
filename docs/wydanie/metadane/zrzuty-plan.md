# Plan zrzutów — App Store (rola 10, E2, 2026-10-30; zrzutów nie robiono)
Czeka na koniec audytu 04 (plan-prac 2.1) i zamrożenie en (2.2). Kadry i podpisy projektuje 04; fakty w podpisach tylko z `en.md`. Reguły: App Store Connect Help „Screenshot specifications” (odczyt 18.10.2026, **przeczytać ponownie w dniu wykonania**): do 10 na klasę, PNG/JPEG, bez kanału alfa; strona jest niespójna co do wymaganej klasy iPhone’a, więc robimy bezpieczny nadzbiór. Treść: aplikacja w użyciu (2.3.3), dane fikcyjne (2.3.9), płatne funkcje oznaczone (2.3.2).

## Klasy
| Klasa | Rozmiar (px) | Dlaczego | Wymagana |
|---|---|---|---|
| iPhone z Dynamic Island, duży | 1320×2868 | nadzbiór; Apple skaluje na mniejsze | tak |
| iPad 13″ | 2064×2752 | `ios.supportsTablet = true` w `app.json` (P-217: Apple Pencil) | tak |
| Apple Watch | [DO USTALENIA] | cel zegarka jest w 1.0, ale „nie sprawdzono” na urządzeniu (P-290); bez zrzutów zegarka do czasu testu; potwierdzić wymóg przy pierwszej wysyłce | warunkowo |
Język zrzutów: en (napisy w obrazie osobno dla języka albo świadomie z en — decyzja po 2.3). Tryb jasny; ciemny jako drugi komplet tylko, jeśli 04 uzna za wartość.

## Lista ekranów (6 na klasę; kolejność = ważność, pierwsze dwa pokazują główną pracę)
| # | Ekran × stan | iPhone | iPad | Twierdzenie w podpisie (dowód w `en.md`) | Dane fikcyjne |
|---|---|---|---|---|---|
| 1 | Licznik w trakcie: duży numer rzędu, +1/−1, notatka obok | tak | tak | one tap adds a row; picks up where you stopped | projekt „Harbor Sweater”, rząd w środku |
| 2 | Wzór PDF obok licznika, znacznik bieżącego rzędu | tak (pion) | tak (poziom) | your pattern next to the counter | **warunek OG-07** (weryfikacja patentowa w kodzie, etap 4): bez niej zrzut 2 i 4 odpadają |
| 3 | Zakreślanie i notatki na wzorze (iPad: Apple Pencil) | tak | tak | highlight and write on the pattern | j.w. |
| 4 | Lista projektów (w toku, „last worked”, dni limitu) | tak | tak | all your projects, free 5 crafting days a month | 4–5 projektów, nie nazwy marek |
| 5 | Historia zmian z cofnięciem | tak | tak | every change with its time | z projektu z poz. 1 |
| 6 | Kalendarz dni / karta ukończenia projektu | tak | tak | your crafting days | dni w jednym miesiącu |
Nie robię zrzutu ekranu ofert Oczko Pro jako głównego (reklama zakupu bez zastrzeżeń ryzykuje 2.3.2); jeśli 04 zechce, z oznaczeniem „in-app purchase”. Bez ekranów: iCloud (do ZM-06), ekran blokady, zegarek (do 07 i testu).

## Skąd zrzuty — opcje
| Opcja | Zaleta | Koszt / ryzyko | Rekomendacja |
|---|---|---|---|
| A. Scenariusz E2E na CI z danymi fikcyjnymi (symulator iPhone duży + iPad 13″; zrzuty jako artefakt) | powtarzalne, bez czasu właściciela, bez prywatnych danych | praca 08 (osobny scenariusz „zrzuty-sklepu” z fixturą) i okno macOS; rozmiary zależą od modelu symulatora — sprawdzić `file` | **A** |
| B. Właściciel na urządzeniach | prawdziwy wygląd | czas właściciela, jego dane (2.3.9), rozmiar zależny od modelu telefonu | tylko iPad Pencil (zrzut 3), jeśli A go nie odtworzy |
| C. Makiety z kadrami 04 | pełna kontrola podpisów | to nie zrzuty aplikacji (2.3.3) | tylko ramki i podpisy wokół A |
Kontrola po wykonaniu: `file *.png` (wymiar, brak „RGBA”/„gray+alpha”), `sprawdz-wydanie.mjs` bez zmian dla zrzutów; wynik do `sklep.md` §5.
