# Przewodnik — klucze i18n (wygenerowane z tresc.json: `node docs/design/narzedzia/przewodnik-kontrola.mjs --md`)

## Nowe klucze

| Klucz | en | pl | Gdzie / trasa „Pokaż” |
|---|---|---|---|
| `przewodnik.tytul` | Guide | Przewodnik | tytuł ekranu, etykieta ikony na „Dziś”, wiersz w Ustawieniach |
| `przewodnik.wstep` | First steps and every feature. “Show” opens the screen. | Pierwsze kroki i wszystkie funkcje. „Pokaż” otwiera opisany ekran. | pod tytułem, tresc2/tekst2 |
| `przewodnik.pierwsze_kroki` | First steps | Pierwsze kroki | nagłówek sekcji |
| `przewodnik.biblioteka` | Feature library | Biblioteka funkcji | nagłówek sekcji |
| `przewodnik.przeczytane` | Read: {{n}} of {{m}} | Przeczytane: {{n}} z {{m}} | pod nagłówkiem biblioteki |
| `przewodnik.postep_wiersza` | {{n}} of {{m}} | {{n}} z {{m}} | wartość wiersza w Ustawieniach |
| `przewodnik.pokaz` | Show | Pokaż | przycisk przy kroku i rozwiniętej funkcji |
| `przewodnik.pokaz_a11y` | Show: {{nazwa}} | Pokaż: {{nazwa}} | etykieta VoiceOver przycisku |
| `przewodnik.krok_a11y` | Step {{n}} of {{m}} | Krok {{n}} z {{m}} | początek etykiety VoiceOver kroku (numer jest ukryty) |
| `przewodnik.przeczytana` | read | przeczytane | stan wiersza funkcji dla VoiceOver |
| `przewodnik.nieprzeczytana` | not read | nieprzeczytane | stan wiersza funkcji dla VoiceOver |
| `przewodnik.grupa_poza` | Apple Watch and Lock Screen | Apple Watch i ekran blokady | nagłówek ostatniej grupy (powierzchnie systemu, bez nazwy w interfejsie) |
| `przewodnik.nazwa_ekran_blokady` | Lock Screen | Ekran blokady | nazwa funkcji (powierzchnia systemu; termin Apple) |
| `przewodnik.krok_1` | On “Today”, tap “+1” on the “First counter” card after each finished row. Nothing to set up first. | Na ekranie „Dziś” stuknij „+1” na karcie „Pierwszy licznik” po każdym skończonym rzędzie. Nic nie trzeba zakładać. | `/` |
| `przewodnik.krok_2` | On the counter: ••• → “Name project and part”. The counter becomes your project. | Na liczniku: ••• → „Nazwij projekt i część”. Licznik staje się projektem. | `/licznik` (bez miejsca: `/`) |
| `przewodnik.krok_3` | On the counter: “Goal” → “Set a goal for this part”. The knitting next to the number grows towards the goal. | Na liczniku: „Cel” → „Ustaw cel dla tej części”. Robótka obok liczby rośnie do celu. | `/licznik` (bez miejsca: `/`) |
| `przewodnik.krok_4` | “Pattern” → “Add pattern”: a PDF or Word file, photos or a web page. The counter stays on the same screen. | „Wzór” → „Dodaj wzór”: plik PDF lub Word, zdjęcia albo strona WWW. Licznik zostaje na tym samym ekranie. | `/wzor` (bez miejsca: `/`) |
| `przewodnik.krok_5` | Next time, tap “Continue” on “Today”. The counter opens where you stopped. | Następnym razem stuknij „Kontynuuj” na ekranie „Dziś”. Licznik otworzy się w miejscu ostatniej pracy. | `/` |
| `przewodnik.krok_6` | Another project: “Projects” → “New project”, with parts now or later. | Kolejny projekt: „Projekty” → „Nowy projekt”, z częściami od razu albo później. | `/projekty` |
| `przewodnik.f_kontynuuj` | “+1” on the card counts a row without opening the counter. “Continue” opens the counter where you stopped. | „+1” na karcie liczy rząd bez otwierania licznika. „Kontynuuj” otwiera licznik w miejscu ostatniej pracy. | `/` → `app/(zakladki)/index.tsx` |
| `przewodnik.f_tydzien` | The days you knitted this week, at a glance. | Dni dziergania w tym tygodniu, na jedno spojrzenie. | `/` → `app/(zakladki)/index.tsx` |
| `przewodnik.f_plus` | Tap “+1 row” after each row; “−1” takes one back. After many quick taps, Oczko offers to undo them. | „+1 rząd” po każdym rzędzie, „−1” cofa jeden. Po serii szybkich stuknięć Oczko zaproponuje ich cofnięcie. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_historia_licznika` | Every change with its time and value; undo a change from there. | Każda zmiana z godziną i wartością; stamtąd cofniesz zmianę. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_wpisz` | In the ••• menu: type the row number, or “Reset to 0…”. | W menu •••: wpisz numer rzędu albo „Wyzeruj do 0…”. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_blokada` | The counter ignores taps, e.g. in a bag. Unlock it at the top of the screen. | Licznik ignoruje stuknięcia, np. w torbie. Odblokujesz go u góry ekranu. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_znaczenie` | Choose whether the big number shows “Rows finished” or “The row I’m on”. | Wybierz, czy duża liczba to „Skończone rzędy”, czy „Rząd, nad którym pracuję”. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_cel` | Rows in this part. At the goal: “Next part”, or “What’s next?” for a second matching part. | Rzędy w tej części. Po celu: „Następna część” albo „Co dalej?” — na przykład druga taka sama część. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_przypomnienia` | A reminder every few rows, a set number of times; you see the list of rows before saving. Reminder rows vibrate differently. | Przypomnienie co kilka rzędów, określoną liczbę razy; listę rzędów widać przed zapisem. W rzędzie przypomnienia wibracja jest inna. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_powtorzenie` | Counts repeats of a pattern section together with the rows. | Liczy powtórzenia fragmentu wzoru razem z rzędami. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_notatka` | A note shown next to the counter. | Notatka widoczna przy liczniku. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_stoper` | Session time starts at once and adds up in the project, under “Sessions”. | Czas sesji rusza od razu i sumuje się w projekcie, w wierszu „Sesje”. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |
| `przewodnik.f_dodaj_licznik` | A second counter in a part, e.g. for stitches or ribbing; a total counter sits above them. | Drugi licznik w części, np. oczek albo ściągacza; nad nimi licznik całości. | `/projekt/[id]` → `app/projekt/[id].tsx` (bez miejsca: `/projekty`) |
| `przewodnik.f_nowy` | Name and parts now or later. Your first counter becomes a project by itself. | Nazwa i części od razu albo później. Pierwszy licznik sam staje się projektem. | `/projekty` → `app/(zakladki)/projekty.tsx` |
| `przewodnik.f_szukaj` | “In progress” by last work, “Finished” apart; search by name. | „W toku” według ostatniej pracy, „Ukończone” osobno; szukaj po nazwie. | `/projekty` → `app/(zakladki)/projekty.tsx` |
| `przewodnik.f_taki_sam` | A new project with the same parts and counters, starting from 0. | Nowy projekt z tymi samymi częściami i licznikami od zera. | `/projekt/[id]` → `app/projekt/[id].tsx` (bez miejsca: `/projekty`) |
| `przewodnik.f_termin` | A finish date gives a daily goal in rows; progress in percent comes from part goals. | Data zakończenia daje cel rzędów na dziś; postęp w procentach wynika z celów części. | `/projekt/[id]` → `app/projekt/[id].tsx` (bez miejsca: `/projekty`) |
| `przewodnik.f_zdjecia` | Photos of your work, kept in the project. | Zdjęcia robótki zapisane w projekcie. | `/projekt/[id]` → `app/projekt/[id].tsx` (bez miejsca: `/projekty`) |
| `przewodnik.f_szczegoly` | Needles or hook in mm and US sizes, yarn from your stash, swatch. | Druty lub szydełko w mm i rozmiarach US, włóczka z zapasu, próbka. | `/projekt/[id]` → `app/projekt/[id].tsx` (bez miejsca: `/projekty`) |
| `przewodnik.f_sesje` | Time from timer sessions; you can fix when a session ended. | Czas z sesji stopera; poprawisz godzinę końca sesji. | `/projekt/[id]` → `app/projekt/[id].tsx` (bez miejsca: `/projekty`) |
| `przewodnik.f_ukoncz` | The project moves to “Finished” with a card to share. “Resume project” brings it back. | Projekt trafia do „Ukończone” z kartą do udostępnienia. „Wznów projekt” go przywraca. | `/projekt/[id]` → `app/projekt/[id].tsx` (bez miejsca: `/projekty`) |
| `przewodnik.f_kosz` | A deleted project, part or counter can be restored for 30 days. | Usunięty projekt, część albo licznik przywrócisz przez 30 dni. | `/kosz` → `app/kosz.tsx` |
| `przewodnik.f_dodaj_wzor` | From a PDF or Word file, photos, scanned pages or a web page. From another app: Share → Oczko. | Z pliku PDF lub Word, zdjęć, skanu stron albo strony WWW. Z innej aplikacji: Udostępnij → Oczko. | `/wzor` → `app/wzor.tsx` (bez miejsca: `/`) |
| `przewodnik.f_znacznik` | Marks the row you’re on in the pattern; the counter is on the same screen. | Oznacza bieżący rząd we wzorze; licznik jest na tym samym ekranie. | `/wzor` → `app/wzor.tsx` (bez miejsca: `/`) |
| `przewodnik.f_zakreslacz` | Highlighter, pen and notes next to a row — with your finger, or Apple Pencil on iPad. | Zakreślacz, pióro i notatki przy rzędzie — palcem albo Apple Pencil na iPadzie. | `/wzor` → `app/wzor.tsx` (bez miejsca: `/`) |
| `przewodnik.f_film` | A link to a video tutorial, kept with the pattern. | Link do filmu instruktażowego przy wzorze. | `/wzor` → `app/wzor.tsx` (bez miejsca: `/`) |
| `przewodnik.f_wloczki` | Your yarn stash: skeins, length, weight and a label photo. | Zapas włóczek: motki, długość, waga i zdjęcie etykiety. | `/zapas` → `app/zapas.tsx` |
| `przewodnik.f_druty` | The needles and hooks you own, by size. | Twoje druty i szydełka według rozmiaru. | `/druty` → `app/druty.tsx` |
| `przewodnik.f_probka` | Stitches for the width you want, from your swatch. | Liczba oczek na wybraną szerokość z twojej próbki. | `/probka` → `app/probka.tsx` |
| `przewodnik.f_kalendarz` | A calendar of knitting days; a day or a period shows rows and time. | Kalendarz dni dziergania; dzień albo okres pokazuje rzędy i czas. | `/dni` → `app/(zakladki)/dni.tsx` |
| `przewodnik.f_wibracje` | Vibration on each row, on or off. | Wibracja przy każdym rzędzie — włączona albo wyłączona. | `/ustawienia` → `app/ustawienia.tsx` |
| `przewodnik.f_ekran` | The screen stays on while you count. | Ekran nie gaśnie, gdy liczysz. | `/ustawienia` → `app/ustawienia.tsx` |
| `przewodnik.f_jednostki` | Metric, imperial or automatic units for sizes and lengths. | Jednostki metryczne, imperialne albo automatyczne dla rozmiarów i długości. | `/miary` → `app/miary.tsx` |
| `przewodnik.f_dane` | iCloud sync on or off, and whether everything is saved. | Synchronizacja iCloud i stan zapisu danych. | `/stan-danych` → `app/stan-danych.tsx` |
| `przewodnik.f_eksport` | A file with all your data; “Import a backup” brings it back, e.g. on a new phone. | Plik ze wszystkimi danymi; „Importuj kopię zapasową” przywraca je, np. na nowym telefonie. | `/ustawienia` → `app/ustawienia.tsx` |
| `przewodnik.f_usun` | Deletes all projects and counters after you confirm. | Usuwa wszystkie projekty i liczniki po potwierdzeniu. | `/ustawienia` → `app/ustawienia.tsx` |
| `przewodnik.f_jezyk` | Oczko’s language, separate from the phone’s. | Język Oczka, niezależnie od języka telefonu. | `/jezyk` → `app/jezyk.tsx` |
| `przewodnik.f_zglos` | A report with app and device details, which you review before sending. | Raport z danymi aplikacji i urządzenia, który przejrzysz przed wysłaniem. | `/zglos` → `app/zglos.tsx` |
| `przewodnik.f_zrodla` | Where the knitting information in Oczko comes from. | Skąd pochodzą informacje o dzierganiu w Oczku. | `/zrodla` → `app/zrodla.tsx` |
| `przewodnik.f_pro` | Without Pro, free crafting days a month: {{limit}}; your rows are kept. Oczko Pro removes the limit. | Bez Pro limit darmowych dni robótkowych w miesiącu: {{limit}}; rzędy zostają. Oczko Pro znosi limit. | `/ustawienia` → `app/ustawienia.tsx` |
| `przewodnik.f_zegarek` | Count rows on your watch: “+1 row” and the current row. Open Oczko on Apple Watch. | Licz rzędy na zegarku: „+1 rząd” i bieżący rząd. Otwórz Oczko na Apple Watch. | bez „Pokaż”: aplikacja na zegarku, poza nawigacją iPhone’a |
| `przewodnik.f_ekran_blokady` | While you count, the Lock Screen shows the row, “+1 row” and the session time. | W czasie liczenia ekran blokady pokazuje rząd, „+1 rząd” i czas sesji. | `/licznik` → `app/licznik.tsx` (bez miejsca: `/`) |

## Biblioteka: nazwy z istniejących kluczy

| Grupa | Funkcja (id) | Klucz nazwy | en | pl | Kontrakt |
|---|---|---|---|---|---|
| Dziś | `kontynuuj` | `dzis.kontynuuj` | Continue | Kontynuuj | F-01, F-18, F-49 |
| Dziś | `tydzien` | `dzis.ten_tydzien` | This week | Ten tydzień | F-59 |
| Licznik | `plus` | `licznik.plus` | +1 row | +1 rząd | F-01, F-47 |
| Licznik | `historia-licznika` | `licznik.akcja_historia` | History | Historia | F-02 |
| Licznik | `wpisz` | `menu.wpisz` | Enter the row number | Wpisz numer rzędu | F-45 |
| Licznik | `blokada` | `menu.zablokuj` | Lock counter (ignore taps) | Zablokuj licznik (ignoruj stuknięcia) | F-03 |
| Licznik | `znaczenie` | `menu.znaczenie` | What the number shows | Co pokazuje liczba | F-09 |
| Licznik | `cel` | `menu.cel` | Set a goal for this part | Ustaw cel dla tej części | F-08, F-52 |
| Licznik | `przypomnienia` | `przyp.tytul` | Reminders | Przypomnienia | F-06, F-48 |
| Licznik | `powtorzenie` | `menu.powtorzenie` | Set a repeat length | Ustaw długość powtórzenia | F-05 |
| Licznik | `notatka` | `licznik.akcja_notatka` | Note | Notatka | F-15 |
| Licznik | `stoper` | `licznik.akcja_stoper` | Timer | Stoper | F-21 |
| Licznik | `dodaj-licznik` | `projekt.dodaj_licznik` | Add counter | Dodaj licznik | F-04, F-46 |
| Projekty | `nowy` | `projekty.nowy` | New project | Nowy projekt | F-14 |
| Projekty | `szukaj` | `projekty.szukaj` | Search | Szukaj | F-50, F-54 |
| Projekty | `taki-sam` | `projekt.zrob_taka_sama` | Make another like this | Zrób taki sam | F-20 |
| Projekty | `termin` | `projekt.termin` | Done by | Gotowe do | F-61, F-60 |
| Projekty | `zdjecia` | `zdjecia.naglowek` | Photos | Zdjęcia | F-16 |
| Projekty | `szczegoly` | `projekt.szczegoly` | Details | Szczegóły | F-17 |
| Projekty | `sesje` | `projekt.sesje` | Sessions | Sesje | F-51 |
| Projekty | `ukoncz` | `menu.ukoncz` | Mark project as finished | Oznacz projekt jako ukończony | F-19, F-53, F-64 |
| Projekty | `kosz` | `projekty.kosz` | Recently deleted | Ostatnio usunięte | F-33 |
| Wzór | `dodaj-wzor` | `wzor.dodaj` | Add pattern | Dodaj wzór | F-24, F-55 |
| Wzór | `znacznik` | `wzor.zaznacz_rzad` | Mark row | Oznacz rząd | F-25, F-26 |
| Wzór | `zakreslacz` | `wzor.zakreslacz` | Highlighter | Zakreślacz | F-56, F-28 |
| Wzór | `film` | `wzor.dodaj_film` | Add video link | Dodaj link do filmu | F-55 |
| Narzędzia | `wloczki` | `narzedzia.wloczki` | Yarn | Włóczka | F-37 |
| Narzędzia | `druty` | `narzedzia.druty` | Needles and hooks | Druty i szydełka | F-37 |
| Narzędzia | `probka` | `narzedzia.probka` | Swatch calculator | Kalkulator próbki | F-38 |
| Historia | `kalendarz` | `zakladki.historia` | History | Historia | F-59 |
| Ustawienia | `wibracje` | `ustawienia.wibracje` | Vibration | Wibracje | F-01 |
| Ustawienia | `ekran` | `ustawienia.ekran_nie_gasnie` | Keep screen on while counting | Nie gaś ekranu podczas liczenia | F-10 |
| Ustawienia | `jednostki` | `ustawienia.uklad_miar` | Units | Jednostki | F-38 |
| Ustawienia | `dane` | `ustawienia.stan_danych` | Data and sync | Dane i synchronizacja | F-27, F-58 |
| Ustawienia | `eksport` | `ustawienia.eksport` | Export all data | Eksportuj wszystkie dane | F-32 |
| Ustawienia | `usun` | `ustawienia.usun_wszystko` | Delete all data | Usuń wszystkie dane | F-34 |
| Ustawienia | `jezyk` | `ustawienia.jezyk` | Language | Język | — |
| Ustawienia | `zglos` | `zglos.tytul` | Report a problem | Zgłoś problem | F-57 |
| Ustawienia | `zrodla` | `ustawienia.zrodla_wiedzy` | About our information | O naszych treściach | — |
| Oczko Pro | `pro` | `oferty.tytul` | Oczko Pro | Oczko Pro | F-35, F-63 |
| Apple Watch i ekran blokady | `zegarek` | literał | Apple Watch | Apple Watch | F-12 |
| Apple Watch i ekran blokady | `ekran-blokady` | `przewodnik.nazwa_ekran_blokady` | Lock Screen | Ekran blokady | F-11 |
