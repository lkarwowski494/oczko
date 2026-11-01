# Uwagi do przekładu pl

| klucz | problem | propozycja | pewność |
|---|---|---|---|
| czesc.co_dalej_opis | „{{czesc}} jest gotowa”: orzeczenie w rodzaju żeńskim, a nazwa części jest dowolna (Rękaw, Tył, Skarpeta) — wyjdzie „Rękaw jest gotowa”. | „Skończone: {{czesc}}. To ostatnia część w projekcie {{projekt}}.” | wysoka |
| dane.konflikt_wybor | „{{wartosc}} rzędów” bez odmiany: przy 1, 2, 22 itd. wyjdzie niepoprawnie („1 rzędów”). | Forma niezależna od liczby: „Rzędy: {{wartosc}} · {{urzadzenie}} · {{godzina}}” (albo klucz z liczbą mnogą). | wysoka |
| dane.konflikt_a11y | Jak wyżej: „Zachowaj {{wartosc}} rzędów” — błędna odmiana dla większości wartości. | „Zachowaj wersję z liczbą rzędów: {{wartosc}}, z urządzenia {{urzadzenie}}, {{godzina}}” | wysoka |
| icloud.konflikt_opis | „{{lokalna}} rzędów tutaj, {{zdalna}} z urządzenia…” — ta sama odmiana liczebnika; „Wybierz tę, która…” nie ma punktu odniesienia (brak rzeczownika w rodzaju żeńskim). | „Rzędy: {{lokalna}} tutaj, {{zdalna}} z urządzenia {{urzadzenie}}. Wybierz wersję zgodną z twoją pracą.” | wysoka |
| limit.zawczasu | Dłuższe od ok. 110 znaków (ok. 120 w pl) i niezgrabne: „Zachowane rzędy: {{count}} i reszta danych”. | „Darmowe dni robótkowe na {{miesiac}} wykorzystane. Liczenie wstrzymane do {{data}}. Zostaje {{count}} rząd (few: rzędy, many: rzędów, other: rzędu) i reszta danych.” — każda forma z poprawną odmianą rzędu i czasownika „zostaje/zostają” | średnia |
| projekt.czesc_cel | „{{rzedy}} z {{cel}} rzędów” — przy celu 1 (lub kończącym się na 2–4) odmiana jest błędna („z 1 rzędów”). | „Rzędy: {{rzedy}} z {{cel}}” | średnia |
| projekt.cel_z_pary | „Cel pojawi się z części X” — nienaturalne wobec „The goal comes from X”. | „Cel pochodzi z części {{nazwa}}, gdy ta będzie miała rzędy.” | średnia |
| projekt.kopia_tytul | „Zrobić kolejny taki sam: {{nazwa}}?” — urwane, brak rzeczownika; niespójne z „Make another {{nazwa}}?”. | „Zrobić kolejny projekt „{{nazwa}}”?” | średnia |
| historia.opis_zerowanie | Niespójne formy opisów w nawiasie: „zerowanie” (rzeczownik) obok „wpisano”, „cofnięto” (czasowniki). | „wyzerowano” | średnia |
| wzor.koniec_strony_gora | „jest poza górą strony” — nienaturalne i dwuznaczne („poza” + narzędnik = „oprócz”). | „Rząd {{n}} wychodzi poza górną krawędź strony {{strona}}” | średnia |
| wzor.koniec_strony_dol | Jak wyżej: „poza dołem strony”. | „Rząd {{n}} wychodzi poza dolną krawędź strony {{strona}}” | średnia |
| wzor.notatka_bez_znacznika | „Notatka stoi obok rzędu” — kalka z angielskiego „sits next to”. | „Notatka jest przypisana do rzędu.” | średnia |
| wzor.czeka_siec | „Czekam na internet” — pierwsza osoba, niespójna z resztą interfejsu (aplikacja mówi o sobie „Oczko…” lub bezosobowo). | „Oczekiwanie na internet, aby zapisać stronę.” | średnia |
| icloud.brak_miejsca | „Twój iCloud jest pełny” — nieprecyzyjne; Apple po polsku mówi o pamięci iCloud. | „Pamięć iCloud jest pełna” | średnia |
| stoper.sprawdz | W obiekcie liczby mnogiej pl jest dodatkowa forma „link” („Sprawdź godzinę zakończenia”), której nie ma w źródle; duplikuje stoper.sprawdz_link i może zaburzyć wybór form. | Usunąć pole „link”; tekst zostaje tylko w stoper.sprawdz_link. | średnia |
| probka.uwaga_kategoria | „two yarns can feel and drape differently” — pominięte „feel”: „leżeć i się układać” to dwa razy to samo. | „…dwie włóczki mogą inaczej układać się i inaczej się w dotyku zachowywać.” lub krócej: „…mogą inaczej wyglądać po zrobieniu i w dotyku.” | średnia |
