# Fix 04 M3-MAK (2026-11-08): makiety Projekt, formularze, zdjęcie + otwarte pozycje p2–p7

Polecenie: `oczko-warsztat` `koordynacja/role-2026-11-08/04-makiety.md` @ dc9f249; gałąź `claude/kopia-04-makiety-2026-11-08` od 4d1e969b. Zmiany tylko w `docs/design/`.
Klasyfikacja: M3-MAK-01, 02, 04 — D (brak makiety/tokenu, w ramach systemu); M3-MAK-03 — decyzje wyglądu podjęte przez 04 w ramach systemu (noc, P-582: koordynator do weta); jedna pozycja P poza zakresem (kropka włóczki — dane, niżej).
Wyjątek nazwany (CLAUDE.md, kwarantanna ról 01–04): przeczytane `src/ekrany/{Projekt,FormularzeProjektu,Arkusz,Zdjecia,Ustawienia,Narzedzia,Miary,Oferty}.tsx`, `app/projekt/[id].tsx`, `app/formularz/[rodzaj].tsx`, `app/zdjecie.tsx`, `src/dane/migracje/0001.sql:158–170`, 3 scenariusze e2e — polecenie każe potwierdzić stan z kodu; to kod przebudowy (M3), nie poprzedniej wersji.

## Wynik
| ID | Co | Dowód |
|---|---|---|
| M3-MAK-01 | Projekt: 4 stany (`projekt`, `projekt-menu`, `projekt-edycja`, `projekt-ukonczony`) | `../ekrany.html` (sekcja 8 + skrypt stanów), `../wzorce-zrzuty/projekt*-390-*.png` (16) |
| M3-MAK-02 | Arkusz formularza wzorcowy + wybór, podgląd zdjęcia; zasady pozostałych rodzajów | `formularz-czesc-*`, `formularz-narzedzie-*`, `zdjecie-*` (12); `../design-spec.md`, sekcja „Projekt, formularze, zdjęcie…” |
| M3-MAK-03 | 12 pozycji: decyzja + uzasadnienie | tabela „Decyzje M3-MAK-03” w `../design-spec.md`; makiety `licznik-stoper-*`, `narzedzia-*` (8) |
| M3-MAK-04 | tokeny: `systemCzarny.pasPrzypomnienia`, `dzianina.kolumna*`, `znaczniki.*`, `projekt.*`, `arkusz.*`, `podgladZdjecia`, `stoper.biegnie` | `../tokeny.json` = `../../tokeny.json` (cmp bez różnic); kontrast 256 par, kod 0 (`../kontrast-tabela.txt`) |

Przed/po (ta sama szerokość 390, motyw jasny): `przed-po.png` — (1) oferty: znacznik planu 26 → 28 pt (`przed/oferty-390-jasny.png`, `po/oferty-390-jasny.png`); (2) licznik: komórka „Stoper” → biegnący stoper z ramą `akcentTekst` (`przed/licznik-390-jasny.png`, `po/licznik-stoper-390-jasny.png`). Ekrany Projekt, formularze, zdjęcie, Narzędzia nie miały makiety Dzianiny („przed” = brak). Przegląd 9 ekranów × jasny/ciemny/AX5: `przeglad.png`.

Kontrola linii bazowej: pozostałe 52 wzorce nie zostały nadpisane. Render HEAD i render po zmianach różnią się na nich wyłącznie wygładzaniem (0 pikseli z różnicą jasności > 64 na `historia`, `projekty`, `wzor`, `projekty-uczciwe`); render HEAD różni się tak samo od zapisanych wzorców (34 pliki) — szum renderera, nie zmiana. Oferty: 0,09% pikseli > 64 (zmiana znacznika).

Krytyka zrzutów (przed poprawkami, wszystkie poprawione): (1) AX5 formularza — tytuł nachodził na „Anuluj”/„Dodaj” → przyciski w wierszu, tytuł pod nimi; (2) AX5 — znacznik radio i znak „!” nie rosły → 40 i 32 pt; (3) wiersz „Przód” bez strzałki, choć prowadzi do części → strzałka; (4) opisy części w dwóch formatach („Rząd 42 z 96” / „0 z 96 rzędów”) → jeden klucz `projekt.czesc_cel`; (5) odstępy 7, 10 px poza jednostką 4 → 8. Warsztat 390: kod 0, 0 błędów (`../warsztat-390.txt`; 12 kolorów tekstu = cała strona z 21 ekranami, w tym `systemCzarny` i `niszczacy`). Element firmowy: dzianina każdej części na ekranie projektu niesie postęp części (ta sama miniatura co na liście).

## Zadania dla 08 „p4b” (testy przed kodem, czerwone na obecnym kodzie)
1. **Projekt** (`src/ekrany/Projekt.tsx`): nagłówki grup 17/700/`tekst` (test zastępuje `tests/ekrany/projekt-naglowki-sekcji-13.test.tsx` — wykaz zastąpionych); miniatura dzianiny w wierszu części (`miniatura.dzianina`, ukryta przed VoiceOver i od AX1; test: `accessibilityElementsHidden`, rozmiar z tokenu); strzałka w wierszach części i liczników; Szczegóły: wartość po prawej, od AX1 pod etykietą; „+” i ••• w `akcentTekst`; menu jako pływająca lista (`powierzchnia`, promień 16, pozycje 48 pt), „Usuń projekt…” w `niszczacy` zamiast `blad`; aliasy `papier`/`grafit`/`olowek`/`papierGrupa` → tokeny Dzianiny. Kropki włóczki **nie** wdrażać (STOP niżej).
2. **Arkusz formularza**: Anuluj `akcentTekst` 400, Zapisz/Dodaj `akcentTekst` 700, nieaktywny `przyciskNieaktywnyTekst` 600; pole: obrys z fokusem `akcentTekst`, min. 48 pt; `Komunikat` ze znakiem ! w kółku; tytuł nagłówka ze skalą jak tytuły. `Wybor` (styl `opcjaWybrana`) → lista ze znacznikiem 28 pt (`znaczniki.radio`, AX5 40) jak plany ofert. testID bez zmian. Miejsca: `src/ekrany/Arkusz.tsx:201-202`, `src/ekrany/Arkusz.tsx:147`, `src/ekrany/Arkusz.tsx:216`.
3. **Podgląd zdjęcia**: Zamknij w prawym górnym rogu z `testID="zdjecie-zamknij"` (07 dopisuje do tabeli e2e); Udostępnij/Usuń z symbolami `square.and.arrow.up`/`trash` i podpisem w `systemCzarny.akcentTekst`; licznik `systemCzarny.tekst2`. Nagłówek grupy zdjęć 17/700 jak w projekcie; kafel Dodaj zdjęcie `powierzchnia` bez obrysu. Miejsca: `src/ekrany/Zdjecia.tsx:69`, `src/ekrany/Zdjecia.tsx:97`.
4. **Stoper** (`LicznikAkcje`/`Licznik`): komórka biegnąca — tło `powierzchnia`, rama 2 pt `akcentTekst`, czas 700 `tekst` tabular, symbol `akcentTekst` (zamiast wypełnienia `akcent`).
5. **Kolumny dzianiny**: karta „Dziś” i licznik z `dzianina.kolumnaKarty` / `kolumnaLicznika` zamiast iloczynów `cele.*`.
6. **Narzędzia** (`src/ekrany/Narzedzia.tsx:55–60`): kafelek ikony 32 pt w wierszach (Włóczki `scribble.variable`, Druty — SVG `druty` z `ikony.js` wzorem `IkonaDnia`, Próbka `square.grid.3x3`). **Miary/Język**: `checkmark` `akcentTekst` zamiast „✓” (`src/ekrany/Miary.tsx:32`).
7. **Ustawienia**: Oczko Pro → `IkonaDnia`; Ekran nie gaśnie → `iphone`. Kafelek i radio z `znaczniki.*`. Miejsca: `src/ekrany/Ustawienia.tsx:96`, `src/ekrany/Ustawienia.tsx:106`.
8. **Oczko Pro, stan czeka**: `Przycisk` — opcjonalny symbol przed tekstem (wyjątek nazwany od zamrożenia p1 jak P-577); przycisk w `src/ekrany/Oferty.tsx:112` z `hourglass`. Rama przerywana już działa (`src/ekrany/Arkusz.tsx:212`), więc zgłoszenie p7 o nieużywanej ramie było nieścisłe.
9. Ekran blokady: `systemCzarny.pasPrzypomnienia` zamiast wartości z `ciemny.powierzchnia` (P-579).

## Otwarte (do koordynatora)
- **STOP — kropka koloru włóczki (P-567):** dane mają tylko kolumnę tekstową z nazwą koloru wpisaną przez osobę, bez barwy (schemat: migracja 0001, tabela `wloczka`, kolumna `kolor`). Opcje: (a) kropka czeka; makieta pokazuje stan docelowy, p4b bez kropki — koszt: P-567 niewdrożone do decyzji 03/05; (b) pole barwy w arkuszu włóczki (systemowy wybór koloru) i kropka w p4b — nowa funkcja, zmiana schematu (migracja), poza „p4b bez danych”; (c) odwołać kropkę — P-063/P-567 do weta właściciela. **Rekomendacja: (a)**, decyzja o polu barwy przy kontrakcie 03 (zasada 18: wartość dla użytkownika do wykazania). Źródło: `src/dane/migracje/0001.sql:163`
- Nagłówki 13 pt na ekranach Sesje i korekta sesji (p5) — znalezisko do najbliższej partii ekranów historii.
- „Back” na zakładkach Narzędzia i Historia (e2e 16) — bez zmian w tej sesji; makiety zakładek go nie mają.
- Nazwy SF Symbols (`scribble.variable`, `iphone`, `checkmark`, `hourglass`) na iOS 18 — [DO USTALENIA na urządzeniu].
- Nie sprawdzono: 320 i 430 pt nowych ekranów, urządzenie, VoiceOver.
