# BW — inwentarz powrotów z ekranów i arkuszy (WL-1171-01)

Stan na a117ded0 (integracja `claude/youthful-pasteur-kx83sn`), 2026-11-15 · rola 08 (fix) · zgłoszenie właściciela, test 1.0.0 (1171): „po klinieciu dodaj wzor nie ma przycisku wstecz do menu glownego. Sprawdz tez inne ekrany.”

## Reguła projektu (źródło wzorca)
- Stos expo-router ma `headerShown: false` (`app/_layout.tsx:122`); pasek rysuje ekran. Ekran w stosie (push) ma `Wstecz` — `chevron.backward` + nazwa poprzedniego ekranu, korzenie zakładek bez „wstecz” (`docs/design/dzianina/design-spec.md:136`, komponent `src/ekrany/Pasek.tsx:25`). Gest od lewej krawędzi zostaje jako dodatek (`app/_layout.tsx:125`, P-617 A; komentarz Pasek.tsx:8 „przycisk obok gestu od krawędzi”).
- Arkusz (modal): „Anuluj”/„Zapisz” w nagłówku (formularz, `design-spec.md:72`), „Zamknij”/✕ (decyzje, `Arkusz.tsx` `zamknij`), „Nie teraz”; gest w dół jest dodatkiem.
- Analogia Trening (`docs/22-przeplywy-i-nawigacja.md:454-455`, odczyt 15.11.2026): „każdy ekran wysuwany z dołu / okno modalne ma widoczny, spójny przycisk zamknięcia w nagłówku … gest w dół działa dalej jako dodatek”. Gest sam nie wystarcza — tak samo przyjmuje Oczko.
- Odpowiedź na pytanie z polecenia: gest od krawędzi działa na trasie `wzor` (push, `gestureEnabled` domyślne; ustawiane tylko w gałęzi z widokiem, `app/wzor.tsx:192`), ale **nie wystarcza wg projektu** — każdy ekran push ma widoczne „Wstecz”; użytkownik w teście nie znalazł gestu.

## Tabela
Legenda: „tak” = powrót widoczny i zgodny z regułą wyżej.

| # | Ekran | Droga wejścia | Sposób powrotu | Zgodny | Dowód |
|---|---|---|---|---|---|
| 1 | Dziś | korzeń zakładek | brak (korzeń, spec :136) | tak | `app/(zakladki)/_layout.tsx:27` |
| 2 | Projekty | zakładka | brak (korzeń) | tak | `app/(zakladki)/projekty.tsx` |
| 3 | Narzędzia | zakładka | brak (korzeń) | tak | `app/(zakladki)/narzedzia.tsx:26` |
| 4 | Historia (dni) | zakładka | brak (korzeń) | tak | `app/(zakladki)/dni.tsx` |
| 5 | Licznik | Dziś „Kontynuuj”, Projekty, ekran projektu | `Wstecz` + gest od krawędzi | tak | `src/ekrany/Licznik.tsx:136`, `app/_layout.tsx:127` |
| 6 | **Wzór bez wzoru — menu źródeł („Dodaj wzór”)** | Dziś kafel „Dodaj wzór” (`app/(zakladki)/index.tsx:74`), Licznik „Wzór” (`app/licznik.tsx:64`), ekran projektu | **brak widocznego przycisku**; tylko gest od krawędzi | **NIE** | `app/wzor.tsx:165-175` (gałąź `!widok`: sam `ScrollView` z `GrupaWzorow`, bez `Wstecz`) |
| 7 | Wzór z wzorem (przeglądarka) | j.w. po wybraniu wzoru | `Wstecz` (sama strzałka) + pytanie przy niezapisanych kreskach | tak | `src/ekrany/WzorPrzegladarka.tsx:131`, `app/wzor.tsx:198` |
| 8 | Wzór — ładowanie / błąd odczytu | trasa wzoru | ładowanie: stan przejściowy; błąd: `Wstecz` | tak | `app/wzor.tsx:160`, `src/ekrany/StanWczytywania.tsx:34` |
| 9 | Wzór — arkusz adresu strony, arkusz nazwy | menu źródeł → „Web page link…”, ••• → „Rename” | „Anuluj” w nagłówku arkusza | tak | `app/wzor.tsx:159,162`, `src/ekrany/WzorGrupa.tsx:90-103` |
| 10 | Projekt | Projekty, Historia, Licznik | `Wstecz` | tak | `src/ekrany/Projekt.tsx:109` |
| 11 | Ustawienia | Dziś | `Wstecz` | tak | `src/ekrany/Ustawienia.tsx:94` |
| 12 | Przewodnik | Dziś, Ustawienia | `Wstecz` | tak | `src/ekrany/Przewodnik.tsx:75` |
| 13 | Język | Ustawienia | `Wstecz` | tak | `src/ekrany/Jezyk.tsx:25` |
| 14 | Miary | Ustawienia | `Wstecz` | tak | `src/ekrany/Miary.tsx:24` |
| 15 | Licencje | Ustawienia | `Wstecz` | tak | `src/ekrany/Licencje.tsx:80` |
| 16 | Źródła wiedzy | Ustawienia | `Wstecz` | tak | `src/ekrany/ZrodlaWiedzy.tsx:13` |
| 17 | Kosz | Projekty | `Wstecz` | tak | `src/ekrany/Kosz.tsx:18` |
| 18 | Sesje | Projekt | `Wstecz` | tak | `src/ekrany/Sesje.tsx:30` |
| 19 | Zapas włóczek | Narzędzia | `Wstecz` | tak | `src/ekrany/Zapas.tsx:44` |
| 20 | Druty | Narzędzia | `Wstecz` | tak | `src/ekrany/Zapas.tsx:206` |
| 21 | Próbka | Dziś, Narzędzia, Projekt | `Wstecz` | tak | `src/ekrany/Narzedzia.tsx:94` |
| 22 | Historia licznika (modal) | Licznik | „Zamknij” | tak | `src/ekrany/Historia.tsx:27` |
| 23 | Menu ••• / Cel (modal) | Licznik | „Anuluj” | tak | `src/ekrany/MenuProjektu.tsx:27,66` |
| 24 | Formularze (nazwa, cel, wpisz, powtórzenie, znaczenie, przypomnienie, notatka, narzędzie, termin, część, licznik, nowy projekt, włóczki) | liczne | „Anuluj” w nagłówku arkusza | tak | `src/ekrany/Arkusz.tsx:62-65`, `app/formularz/[rodzaj].tsx:51` |
| 25 | Formularz „Co dalej” | Licznik (ostatnia część) | „Nie teraz” | tak | `src/ekrany/FormularzeProjektu.tsx:167` |
| 26 | Lista przypomnień | Menu Cel | „Zamknij” | tak | `src/ekrany/Formularze.tsx:130` |
| 27 | Karta ukończenia | Menu ••• → „Zakończ” | „Gotowe” (gest wyłączony celowo, `gestureEnabled: false`) | tak | `src/ekrany/Ukonczenie.tsx:50`, `app/_layout.tsx:133` |
| 28 | Oferty | Dziś, Ustawienia, Licznik | ✕ „Zamknij” + „Nie teraz” | tak | `src/ekrany/Oferty.tsx:105,114` |
| 29 | Uczciwe zasady | Projekty (limit) | przycisk główny zamyka | tak | `src/ekrany/InformacjePro.tsx:20` |
| 30 | Zgłoś problem | Ustawienia | „Anuluj” | tak | `src/ekrany/ZglosProblem.tsx:22` |
| 31 | Stan danych | Ustawienia | „Zamknij” | tak | `src/ekrany/StanDanych.tsx:59,72` |
| 32 | Usuń wszystko | Ustawienia | „Anuluj” | tak | `src/ekrany/UsunWszystko.tsx:19` |
| 33 | Konflikt iCloud | Licznik, Stan danych | „Nie teraz” | tak | `src/ekrany/IcloudKonflikt.tsx:42` |
| 34 | Korekta sesji | Licznik, Sesje | „Anuluj” | tak | `src/ekrany/Formularze.tsx:177` |
| 35 | Włóczka | Zapas, Formularz włóczek, Ukończenie | „Anuluj” | tak | `src/ekrany/Zapas.tsx:164` |
| 36 | Drut | Druty | „Anuluj” | tak | `src/ekrany/Zapas.tsx:244` |
| 37 | Podgląd zdjęcia (pełnoekranowy) | Projekt | „Zamknij” | tak | `src/ekrany/Zdjecia.tsx:67` |
| 38 | Stany ładowania/błędu modali | j.w. | błąd: „Zamknij” pod „Try again”; ładowanie przejściowe | tak | `src/ekrany/StanWczytywania.tsx:38` |

Wynik: 38 pozycji (30 ekranów i arkuszy osiągalnych z menu + stany) → **1 bez widocznego powrotu (poz. 6)**; reszta zgodna. Weryfikacja statyczna (czytanie kodu); zachowanie na urządzeniu nie sprawdzane (Linux, bez symulatora).

## Uwagi poza zakresem (nie naprawiane tu)
- Wszystkie „Wstecz” wołają `router.back()`; przy ekranie otwartym bez historii (zimny start na trasie podrzędnej) nic się nie stanie. Dziś trasy podrzędne zawsze mają pod sobą stos (`naKontynuuj`, `naDodajWzor` najpierw `push('/licznik')`), więc nie jest to defekt odtwarzalny — brzegowy/teoretyczny.
- Etykieta „Wstecz” na poz. 6 po wejściu z kafla „Dodaj wzór” = tytuł Licznika (licznik pod spodem, P-588), nie „menu główne”; zgodne z P-588 i `useTytulPoprzedniego`.
