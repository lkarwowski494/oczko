// wygenerowane przez narzedzia/przewodnik-kontrola.mjs --js z tresc.json — nie edytuj ręcznie
window.PRZEWODNIK = {
 "stale": {
  "przewodnik.tytul": {
   "en": "Guide",
   "pl": "Przewodnik",
   "_gdzie": "tytuł ekranu, etykieta ikony na „Dziś”, wiersz w Ustawieniach"
  },
  "przewodnik.wstep": {
   "en": "First steps and every feature. “Show” opens the screen.",
   "pl": "Pierwsze kroki i wszystkie funkcje. „Pokaż” otwiera opisany ekran.",
   "_gdzie": "pod tytułem, tresc2/tekst2"
  },
  "przewodnik.pierwsze_kroki": {
   "en": "First steps",
   "pl": "Pierwsze kroki",
   "_gdzie": "nagłówek sekcji"
  },
  "przewodnik.biblioteka": {
   "en": "Feature library",
   "pl": "Biblioteka funkcji",
   "_gdzie": "nagłówek sekcji"
  },
  "przewodnik.przeczytane": {
   "en": "Read: {{n}} of {{m}}",
   "pl": "Przeczytane: {{n}} z {{m}}",
   "_gdzie": "pod nagłówkiem biblioteki"
  },
  "przewodnik.postep_wiersza": {
   "en": "{{n}} of {{m}}",
   "pl": "{{n}} z {{m}}",
   "_gdzie": "wartość wiersza w Ustawieniach"
  },
  "przewodnik.pokaz": {
   "en": "Show",
   "pl": "Pokaż",
   "_gdzie": "przycisk przy kroku i rozwiniętej funkcji"
  },
  "przewodnik.pokaz_a11y": {
   "en": "Show: {{nazwa}}",
   "pl": "Pokaż: {{nazwa}}",
   "_gdzie": "etykieta VoiceOver przycisku"
  },
  "przewodnik.krok_a11y": {
   "en": "Step {{n}} of {{m}}",
   "pl": "Krok {{n}} z {{m}}",
   "_gdzie": "początek etykiety VoiceOver kroku (numer jest ukryty)"
  },
  "przewodnik.przeczytana": {
   "en": "read",
   "pl": "przeczytane",
   "_gdzie": "stan wiersza funkcji dla VoiceOver"
  },
  "przewodnik.nieprzeczytana": {
   "en": "not read",
   "pl": "nieprzeczytane",
   "_gdzie": "stan wiersza funkcji dla VoiceOver"
  },
  "przewodnik.grupa_poza": {
   "en": "Apple Watch and Lock Screen",
   "pl": "Apple Watch i ekran blokady",
   "_gdzie": "nagłówek ostatniej grupy (powierzchnie systemu, bez nazwy w interfejsie)"
  },
  "przewodnik.nazwa_ekran_blokady": {
   "en": "Lock Screen",
   "pl": "Ekran blokady",
   "_gdzie": "nazwa funkcji (powierzchnia systemu; termin Apple)"
  }
 },
 "kroki": [
  {
   "id": "1",
   "en": "On “Today”, tap “+1” on the “First counter” card after each finished row. Nothing to set up first.",
   "pl": "Na ekranie „Dziś” stuknij „+1” na karcie „Pierwszy licznik” po każdym skończonym rzędzie. Nic nie trzeba zakładać.",
   "trasa": "/"
  },
  {
   "id": "2",
   "en": "On the counter: ••• → “Name project and part”. The counter becomes your project.",
   "pl": "Na liczniku: ••• → „Nazwij projekt i część”. Licznik staje się projektem.",
   "trasa": "/licznik"
  },
  {
   "id": "3",
   "en": "On the counter: “Goal” → “Set a goal for this part”. The knitting next to the number grows towards the goal.",
   "pl": "Na liczniku: „Cel” → „Ustaw cel dla tej części”. Robótka obok liczby rośnie do celu.",
   "trasa": "/licznik"
  },
  {
   "id": "4",
   "en": "“Pattern” → “Add pattern”: a PDF or Word file, photos or a web page. The counter stays on the same screen.",
   "pl": "„Wzór” → „Dodaj wzór”: plik PDF lub Word, zdjęcia albo strona WWW. Licznik zostaje na tym samym ekranie.",
   "trasa": "/wzor"
  },
  {
   "id": "5",
   "en": "Next time, tap “Continue” on “Today”. The counter opens where you stopped.",
   "pl": "Następnym razem stuknij „Kontynuuj” na ekranie „Dziś”. Licznik otworzy się w miejscu ostatniej pracy.",
   "trasa": "/"
  },
  {
   "id": "6",
   "en": "Another project: “Projects” → “New project”, with parts now or later.",
   "pl": "Kolejny projekt: „Projekty” → „Nowy projekt”, z częściami od razu albo później.",
   "trasa": "/projekty"
  }
 ],
 "grupy": [
  {
   "id": "dzis",
   "en": "Today",
   "pl": "Dziś",
   "funkcje": [
    {
     "id": "kontynuuj",
     "en": "Continue",
     "pl": "Kontynuuj",
     "opisEn": "“+1” on the card counts a row without opening the counter. “Continue” opens the counter where you stopped.",
     "opisPl": "„+1” na karcie liczy rząd bez otwierania licznika. „Kontynuuj” otwiera licznik w miejscu ostatniej pracy.",
     "trasa": "/"
    },
    {
     "id": "tydzien",
     "en": "This week",
     "pl": "Ten tydzień",
     "opisEn": "The days you knitted this week, at a glance.",
     "opisPl": "Dni dziergania w tym tygodniu, na jedno spojrzenie.",
     "trasa": "/"
    }
   ]
  },
  {
   "id": "licznik",
   "en": "Counter",
   "pl": "Licznik",
   "funkcje": [
    {
     "id": "plus",
     "en": "+1 row",
     "pl": "+1 rząd",
     "opisEn": "Tap “+1 row” after each row; “−1” takes one back. After many quick taps, Oczko offers to undo them.",
     "opisPl": "„+1 rząd” po każdym rzędzie, „−1” cofa jeden. Po serii szybkich stuknięć Oczko zaproponuje ich cofnięcie.",
     "trasa": "/licznik"
    },
    {
     "id": "historia-licznika",
     "en": "History",
     "pl": "Historia",
     "opisEn": "Every change with its time and value; undo a change from there.",
     "opisPl": "Każda zmiana z godziną i wartością; stamtąd cofniesz zmianę.",
     "trasa": "/licznik"
    },
    {
     "id": "wpisz",
     "en": "Enter the row number",
     "pl": "Wpisz numer rzędu",
     "opisEn": "In the ••• menu: type the row number, or “Reset to 0…”.",
     "opisPl": "W menu •••: wpisz numer rzędu albo „Wyzeruj do 0…”.",
     "trasa": "/licznik"
    },
    {
     "id": "blokada",
     "en": "Lock counter (ignore taps)",
     "pl": "Zablokuj licznik (ignoruj stuknięcia)",
     "opisEn": "The counter ignores taps, e.g. in a bag. Unlock it at the top of the screen.",
     "opisPl": "Licznik ignoruje stuknięcia, np. w torbie. Odblokujesz go u góry ekranu.",
     "trasa": "/licznik"
    },
    {
     "id": "znaczenie",
     "en": "What the number shows",
     "pl": "Co pokazuje liczba",
     "opisEn": "Choose whether the big number shows “Rows finished” or “The row I’m on”.",
     "opisPl": "Wybierz, czy duża liczba to „Skończone rzędy”, czy „Rząd, nad którym pracuję”.",
     "trasa": "/licznik"
    },
    {
     "id": "cel",
     "en": "Set a goal for this part",
     "pl": "Ustaw cel dla tej części",
     "opisEn": "Rows in this part. At the goal: “Next part”, or “What’s next?” for a second matching part.",
     "opisPl": "Rzędy w tej części. Po celu: „Następna część” albo „Co dalej?” — na przykład druga taka sama część.",
     "trasa": "/licznik"
    },
    {
     "id": "przypomnienia",
     "en": "Reminders",
     "pl": "Przypomnienia",
     "opisEn": "A reminder every few rows, a set number of times; you see the list of rows before saving. Reminder rows vibrate differently.",
     "opisPl": "Przypomnienie co kilka rzędów, określoną liczbę razy; listę rzędów widać przed zapisem. W rzędzie przypomnienia wibracja jest inna.",
     "trasa": "/licznik"
    },
    {
     "id": "powtorzenie",
     "en": "Set a repeat length",
     "pl": "Ustaw długość powtórzenia",
     "opisEn": "Counts repeats of a pattern section together with the rows.",
     "opisPl": "Liczy powtórzenia fragmentu wzoru razem z rzędami.",
     "trasa": "/licznik"
    },
    {
     "id": "notatka",
     "en": "Note",
     "pl": "Notatka",
     "opisEn": "A note shown next to the counter.",
     "opisPl": "Notatka widoczna przy liczniku.",
     "trasa": "/licznik"
    },
    {
     "id": "stoper",
     "en": "Timer",
     "pl": "Stoper",
     "opisEn": "Session time starts at once and adds up in the project, under “Sessions”.",
     "opisPl": "Czas sesji rusza od razu i sumuje się w projekcie, w wierszu „Sesje”.",
     "trasa": "/licznik"
    },
    {
     "id": "dodaj-licznik",
     "en": "Add counter",
     "pl": "Dodaj licznik",
     "opisEn": "A second counter in a part, e.g. for stitches or ribbing; a total counter sits above them.",
     "opisPl": "Drugi licznik w części, np. oczek albo ściągacza; nad nimi licznik całości.",
     "trasa": "/projekt/[id]"
    }
   ]
  },
  {
   "id": "projekty",
   "en": "Projects",
   "pl": "Projekty",
   "funkcje": [
    {
     "id": "nowy",
     "en": "New project",
     "pl": "Nowy projekt",
     "opisEn": "Name and parts now or later. Your first counter becomes a project by itself.",
     "opisPl": "Nazwa i części od razu albo później. Pierwszy licznik sam staje się projektem.",
     "trasa": "/projekty"
    },
    {
     "id": "szukaj",
     "en": "Search",
     "pl": "Szukaj",
     "opisEn": "“In progress” by last work, “Finished” apart; search by name.",
     "opisPl": "„W toku” według ostatniej pracy, „Ukończone” osobno; szukaj po nazwie.",
     "trasa": "/projekty"
    },
    {
     "id": "taki-sam",
     "en": "Make another like this",
     "pl": "Zrób taki sam",
     "opisEn": "A new project with the same parts and counters, starting from 0.",
     "opisPl": "Nowy projekt z tymi samymi częściami i licznikami od zera.",
     "trasa": "/projekt/[id]"
    },
    {
     "id": "termin",
     "en": "Done by",
     "pl": "Gotowe do",
     "opisEn": "A finish date gives a daily goal in rows; progress in percent comes from part goals.",
     "opisPl": "Data zakończenia daje cel rzędów na dziś; postęp w procentach wynika z celów części.",
     "trasa": "/projekt/[id]"
    },
    {
     "id": "zdjecia",
     "en": "Photos",
     "pl": "Zdjęcia",
     "opisEn": "Photos of your work, kept in the project.",
     "opisPl": "Zdjęcia robótki zapisane w projekcie.",
     "trasa": "/projekt/[id]"
    },
    {
     "id": "szczegoly",
     "en": "Details",
     "pl": "Szczegóły",
     "opisEn": "Needles or hook in mm and US sizes, yarn from your stash, swatch.",
     "opisPl": "Druty lub szydełko w mm i rozmiarach US, włóczka z zapasu, próbka.",
     "trasa": "/projekt/[id]"
    },
    {
     "id": "sesje",
     "en": "Sessions",
     "pl": "Sesje",
     "opisEn": "Time from timer sessions; you can fix when a session ended.",
     "opisPl": "Czas z sesji stopera; poprawisz godzinę końca sesji.",
     "trasa": "/projekt/[id]"
    },
    {
     "id": "ukoncz",
     "en": "Mark project as finished",
     "pl": "Oznacz projekt jako ukończony",
     "opisEn": "The project moves to “Finished” with a card to share. “Resume project” brings it back.",
     "opisPl": "Projekt trafia do „Ukończone” z kartą do udostępnienia. „Wznów projekt” go przywraca.",
     "trasa": "/projekt/[id]"
    },
    {
     "id": "kosz",
     "en": "Recently deleted",
     "pl": "Ostatnio usunięte",
     "opisEn": "A deleted project, part or counter can be restored for 30 days.",
     "opisPl": "Usunięty projekt, część albo licznik przywrócisz przez 30 dni.",
     "trasa": "/kosz"
    }
   ]
  },
  {
   "id": "wzor",
   "en": "Pattern",
   "pl": "Wzór",
   "funkcje": [
    {
     "id": "dodaj-wzor",
     "en": "Add pattern",
     "pl": "Dodaj wzór",
     "opisEn": "From a PDF or Word file, photos, scanned pages or a web page. From another app: Share → Oczko.",
     "opisPl": "Z pliku PDF lub Word, zdjęć, skanu stron albo strony WWW. Z innej aplikacji: Udostępnij → Oczko.",
     "trasa": "/wzor"
    },
    {
     "id": "znacznik",
     "en": "Mark row",
     "pl": "Oznacz rząd",
     "opisEn": "Marks the row you’re on in the pattern; the counter is on the same screen.",
     "opisPl": "Oznacza bieżący rząd we wzorze; licznik jest na tym samym ekranie.",
     "trasa": "/wzor"
    },
    {
     "id": "zakreslacz",
     "en": "Highlighter",
     "pl": "Zakreślacz",
     "opisEn": "Highlighter, pen and notes next to a row — with your finger, or Apple Pencil on iPad.",
     "opisPl": "Zakreślacz, pióro i notatki przy rzędzie — palcem albo Apple Pencil na iPadzie.",
     "trasa": "/wzor"
    },
    {
     "id": "film",
     "en": "Add video link",
     "pl": "Dodaj link do filmu",
     "opisEn": "A link to a video tutorial, kept with the pattern.",
     "opisPl": "Link do filmu instruktażowego przy wzorze.",
     "trasa": "/wzor"
    }
   ]
  },
  {
   "id": "narzedzia",
   "en": "Tools",
   "pl": "Narzędzia",
   "funkcje": [
    {
     "id": "wloczki",
     "en": "Yarn",
     "pl": "Włóczka",
     "opisEn": "Your yarn stash: skeins, length, weight and a label photo.",
     "opisPl": "Zapas włóczek: motki, długość, waga i zdjęcie etykiety.",
     "trasa": "/zapas"
    },
    {
     "id": "druty",
     "en": "Needles and hooks",
     "pl": "Druty i szydełka",
     "opisEn": "The needles and hooks you own, by size.",
     "opisPl": "Twoje druty i szydełka według rozmiaru.",
     "trasa": "/druty"
    },
    {
     "id": "probka",
     "en": "Swatch calculator",
     "pl": "Kalkulator próbki",
     "opisEn": "Stitches for the width you want, from your swatch.",
     "opisPl": "Liczba oczek na wybraną szerokość z twojej próbki.",
     "trasa": "/probka"
    }
   ]
  },
  {
   "id": "historia",
   "en": "History",
   "pl": "Historia",
   "funkcje": [
    {
     "id": "kalendarz",
     "en": "History",
     "pl": "Historia",
     "opisEn": "A calendar of knitting days; a day or a period shows rows and time.",
     "opisPl": "Kalendarz dni dziergania; dzień albo okres pokazuje rzędy i czas.",
     "trasa": "/dni"
    }
   ]
  },
  {
   "id": "ustawienia",
   "en": "Settings",
   "pl": "Ustawienia",
   "funkcje": [
    {
     "id": "wibracje",
     "en": "Vibration",
     "pl": "Wibracje",
     "opisEn": "Vibration on each row, on or off.",
     "opisPl": "Wibracja przy każdym rzędzie — włączona albo wyłączona.",
     "trasa": "/ustawienia"
    },
    {
     "id": "ekran",
     "en": "Keep screen on while counting",
     "pl": "Nie gaś ekranu podczas liczenia",
     "opisEn": "The screen stays on while you count.",
     "opisPl": "Ekran nie gaśnie, gdy liczysz.",
     "trasa": "/ustawienia"
    },
    {
     "id": "jednostki",
     "en": "Units",
     "pl": "Jednostki",
     "opisEn": "Metric, imperial or automatic units for sizes and lengths.",
     "opisPl": "Jednostki metryczne, imperialne albo automatyczne dla rozmiarów i długości.",
     "trasa": "/miary"
    },
    {
     "id": "dane",
     "en": "Data and sync",
     "pl": "Dane i synchronizacja",
     "opisEn": "iCloud sync on or off, and whether everything is saved.",
     "opisPl": "Synchronizacja iCloud i stan zapisu danych.",
     "trasa": "/stan-danych"
    },
    {
     "id": "eksport",
     "en": "Export all data",
     "pl": "Eksportuj wszystkie dane",
     "opisEn": "A file with all your data; “Import a backup” brings it back, e.g. on a new phone.",
     "opisPl": "Plik ze wszystkimi danymi; „Importuj kopię zapasową” przywraca je, np. na nowym telefonie.",
     "trasa": "/ustawienia"
    },
    {
     "id": "usun",
     "en": "Delete all data",
     "pl": "Usuń wszystkie dane",
     "opisEn": "Deletes all projects and counters after you confirm.",
     "opisPl": "Usuwa wszystkie projekty i liczniki po potwierdzeniu.",
     "trasa": "/ustawienia"
    },
    {
     "id": "jezyk",
     "en": "Language",
     "pl": "Język",
     "opisEn": "Oczko’s language, separate from the phone’s.",
     "opisPl": "Język Oczka, niezależnie od języka telefonu.",
     "trasa": "/jezyk"
    },
    {
     "id": "zglos",
     "en": "Report a problem",
     "pl": "Zgłoś problem",
     "opisEn": "A report with app and device details, which you review before sending.",
     "opisPl": "Raport z danymi aplikacji i urządzenia, który przejrzysz przed wysłaniem.",
     "trasa": "/zglos"
    },
    {
     "id": "zrodla",
     "en": "About our information",
     "pl": "O naszych treściach",
     "opisEn": "Where the knitting information in Oczko comes from.",
     "opisPl": "Skąd pochodzą informacje o dzierganiu w Oczku.",
     "trasa": "/zrodla"
    }
   ]
  },
  {
   "id": "pro",
   "en": "Oczko Pro",
   "pl": "Oczko Pro",
   "funkcje": [
    {
     "id": "pro",
     "en": "Oczko Pro",
     "pl": "Oczko Pro",
     "opisEn": "Without Pro, free crafting days a month: 5; your rows are kept. Oczko Pro removes the limit.",
     "opisPl": "Bez Pro limit darmowych dni robótkowych w miesiącu: 5; rzędy zostają. Oczko Pro znosi limit.",
     "trasa": "/ustawienia"
    }
   ]
  },
  {
   "id": "poza",
   "en": "Apple Watch and Lock Screen",
   "pl": "Apple Watch i ekran blokady",
   "funkcje": [
    {
     "id": "zegarek",
     "en": "Apple Watch",
     "pl": "Apple Watch",
     "opisEn": "Count rows on your watch: “+1 row” and the current row. Open Oczko on Apple Watch.",
     "opisPl": "Licz rzędy na zegarku: „+1 rząd” i bieżący rząd. Otwórz Oczko na Apple Watch.",
     "trasa": null
    },
    {
     "id": "ekran-blokady",
     "en": "Lock Screen",
     "pl": "Ekran blokady",
     "opisEn": "While you count, the Lock Screen shows the row, “+1 row” and the session time.",
     "opisPl": "W czasie liczenia ekran blokady pokazuje rząd, „+1 rząd” i czas sesji.",
     "trasa": "/licznik"
    }
   ]
  }
 ]
};
