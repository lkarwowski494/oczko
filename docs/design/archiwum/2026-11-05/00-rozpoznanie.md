# Studio projektowe Oczka: E0 rozpoznanie
Stan: STOP E0 · 2026-10-22 · Rola 04-studio-projektowe, tryb build (prompt `prompts` @97ec212, 75 719 znaków; kopia: `oczko-warsztat/04-studio/2026-10-22-build/04-build-prompt-2026-10-22.md`). Kwarantanna P-003, P-015: czytano tylko `CLAUDE.md`, `docs/`, `oczko-warsztat` (03, 01) i repo `prompts`.

**Wyjątek nazwany (zasada wspólna 19):** rola 04 startuje w tej samej sesji co fix roli 01, bo właściciel napisał „Kontynuuj tutaj” (2026-10-22). Tańsza kontrola zamiast świeżego kontekstu: stan tylko z plików (`docs/sztafeta.md`, rejestr, BRD, kontrakt zakresu), punkty czyszczenia na każdym STOP, soczewki jako niezależne subagenty bez dostępu do tej rozmowy.

## Środowisko (2026-10-22)
| Sprawdzenie | Wynik | Skutek |
|---|---|---|
| Playwright | 1.56.1, Chromium z `/opt/pw-browsers`; test strony z „ąę”: OK | makiety HTML i zrzuty działają; pakiet w scratchpadzie, nie w projekcie |
| Kroje | Google Fonts API i `raw.githubusercontent.com` (pliki OFL): 200; `sans-serif` w kontenerze to Inter | kroje z plików w `docs/design/fonty/`; treść w makiecie krojem zastępczym, podpisanym |
| Skan konkurencji | `itunes.apple.com/search`: 403 (dzień pracy), `lookup`: 200 | skan E1 z listingów roli 01 (18 US + 2 JP, `oczko-warsztat/01-odkrywanie/recenzje/listingi-*-2026-10-21.json`) odświeżonych przez `lookup` po ID; obrazy tylko w scratchpadzie |
| Xcode, symulator, Expo web | brak; kodu nowej wersji nie ma (przebudowa) | prototypy i przejście poznawcze na makietach HTML (decyzja 3); zegarek i ekran blokady jako makiety |
| Gałęzie zdalne | `main`, `claude/jolly-thompson-paz6d8`, `claude/bold-meitner-5psv0z`, `claude/compassionate-shannon-ug7tqb` | interfejs poprzedniej wersji jest w kodzie na `main`; **nie czytam** (P-003 ma pierwszeństwo przed E0 pkt 1 promptu). Znane z biblioteki `prompts` (`docs/audyt-2026-10-18/research-trening-organizer.md:164`): stara wersja miała kroje Tektur + Plex jak Trening; nowa ich nie powtarza |
| Dokumenty | `docs/` w repo (publiczne), materiały prywatne w `oczko-warsztat` | wynik roli w `docs/design/`; cudze zrzuty tylko w scratchpadzie |

## Przepływy w zakresie (kontrakt zakresu, „Kolejność i przekazanie”, 04)
| Przepływ | Kto | Cel | Częstość | Funkcje (F) | Kontekst |
|---|---|---|---|---|---|
| PR-01 Pierwsze liczenie | każdy nowy | pierwszy rząd bez konta, projektu i wzoru | raz | F-01, F-10, F-14 (U-5) | robótka w rękach, uwaga podzielona |
| PR-02 Liczenie w sesji | P-1, P-2, P-3 | +1 po rzędzie, cofnięcie, historia | każdy rząd | F-01–F-03, F-09, F-10, F-15, F-45, F-47, F-48, F-49 | ręce zajęte, telefon na stojaku albo kolanach, TV |
| PR-03 Powtórzenia i części | P-2, P-3 | rząd w powtórzeniu, części, cel części | projekty z motywem | F-04, F-05, F-08, F-14, F-46, F-52 (U-2, U-11) | jak PR-02 |
| PR-04 „Co N rzędów” | P-2, P-3 | plan rzędów i wyraźne przypomnienie | kształtowanie | F-06, F-48 (U-3) | przypomnienie zauważa ktoś, kto patrzy na robótkę |
| PR-05 Bez telefonu | P-1, P-2 | +1 z zegarka i ekranu blokady, stoper | każda sesja | F-11, F-12, F-21 (U-4) | telefon zablokowany albo dalej |
| PR-06 Wzór | P-2, P-3 | wzór obok licznika, znacznik rzędu, notatki | projekty ze wzorem | F-24–F-26, F-28, F-55, F-56 | iPhone i iPad, często poziomo, wieczorem |
| PR-07 Projekt do archiwum | P-2, P-4 | części, zdjęcia, powrót, ukończenie | każdy projekt | F-14–F-20, F-49, F-50, F-53, F-54 (U-9, U-12) | dom, powrót po tygodniach |
| PR-08 Dane | P-2, P-3 | iCloud, eksport, import, usuwanie | rzadko | F-27, F-31–F-34, F-58 | wolne ręce |
| PR-09 Zakup i limit | bez Pro na limicie, płacący | komunikat na limicie, oferta, przywracanie | najwyżej start dnia | F-35, F-36; BR-ZAK-005–007 | wolne ręce, sieć |
| PR-10 Zapas | P-4 | włóczka i zużycie przy ukończeniu | zakupy, start, koniec | F-37 (U-9) | dom, sklep bez zasięgu |
| PR-11 Obliczenie | P-2, P-3 | oczka z próbki, jednostki, grubość | start projektu | F-17, F-38 (U-10) | dom |
| PR-13 Przeniesienie robótki | P-2 | wpisanie trwającej liczby | raz na robótkę | F-45 | dom |
| PR-14 Czas i postęp | P-2 | stoper, czas projektu, % | sesja | F-21, F-60 | jak PR-02 |
| PR-15 Problem, ocena, stan | każdy | „Zgłoś problem”, prośba o ocenę, „Oceń” | rzadko | F-57, F-58; BR-DAN-012 | wolne ręce |
| PR-16 Dni, postęp, termin | P-2, P-1 | kalendarz, dzień, termin, „który dziś” | co kilka dni | F-59–F-61 (U-6, U-7, U-8) | poza ekranem licznika (P-046) |

Poza zakresem: PR-12 (słownik, F-44 PÓŹNIEJ), import od konkurencji (F-29), F-13, F-22, F-39, F-40, F-42, F-62; „NIE robimy”: F-23, F-30, F-41, F-43. Bez pustych miejsc w nawigacji na zapas (kontrakt, 04).

## Kontekst użycia (z BRD „Kontekst użycia”; nowe ustalenia jako [OCENA])
| Przepływ | Światło | Ręce | Oczy | Spojrzenie / sesja | Hałas |
|---|---|---|---|---|---|
| PR-01–PR-05, PR-14 | lampa w domu, wieczór; podróż | obie zajęte robótką; jedno stuknięcie palcem albo kłykciem między ściegami [OCENA] | na robótce; zerknięcie na liczbę z odległości stojaka albo kolan [OCENA: ok. 40–70 cm, bez źródła] | zerknięcie ok. 1 s [OCENA]; sesja od minut do godzin, ekran nie gaśnie (F-10) | TV, podcast, rozmowa: dźwięk nie jest kanałem głównym, haptyka i obraz tak |
| PR-06 | wieczór, drobny tekst schematu | jw. | skupione na schemacie | długa | jw. |
| PR-07–PR-11, PR-13, PR-15, PR-16 | dom, sklep | wolne | wolne | krótka, pełna uwaga | — |
Dostępność: niewidoma osoba dziergająca z VoiceOver (BRD) i duży tekst; ciemny motyw wieczorem jako pełny wariant. **Moduł `kontekst-oczy-zajete`:** stosuję tylko część „Ręce zajęte” (pkt 6: jedna duża akcja, ekran nie gaśnie, sąsiednie stany mniejsze); część o jeździe nie dotyczy (kontekst ryzykowny: brak, BRD).

## Ograniczenia interfejsu z projektu
- **P-046 / Z5:** na ekranie licznika nic z kalendarza, terminu i nowych funkcji, dopóki użytkownik sam czegoś nie ustawi; 0 znaków Pro na ekranie licznika. Wyjątki bez nowego elementu: F-47 (baner „Cofnąć?”), F-48 (wibracja).
- **NFR-PIE-001:** 0 ekranów przed licznikiem, pierwsze +1 jednym stuknięciem, także offline.
- **KP-10, KP-13, BR-ZAK-006:** ekran zakupu tylko przy starcie dnia ponad limit i w Ustawieniach. Napięcie do rozstrzygnięcia w E3: KP-13 chce licznika dni „na ekranie licznika”, a P-046 nie pozwala na nowe elementy tam bez ustawienia użytkownika; miejsce licznika dni wybiera ta rola (KP-13).
- **P-059 (2a):** licznik dni limitu nie może udawać kalendarza dni z robótką (różnią się w dniach brzegowych).
- **Ujawnienia (1)–(7) i P-054:** nazwa, okres i cena ze sklepu jako najwyraźniejsze; bez procentów i porównań; „Zarządzaj subskrypcją”, „Przywróć zakupy”, polityka i warunki, neutralna odmowa.
- **BR-DAN-012:** prośba o ocenę tylko systemowa, po karcie ukończenia; „Oceń” w Ustawieniach.
- **OG-07, P-024:** ekrany wzoru (F-24–F-26, F-28, F-56) porównuję z niezależnymi zastrzeżeniami patentów US8506303 i US8529263 (1, 9, 13) przed E3; wynik to ocena projektu, nie opinia prawna.
- **U-1–U-12** (mapa roli 03) i **F-06:** przypomnienie zmienia cały ekran; **F-25:** telefon poziomo = wzór i licznik razem.
- **35 lokalizacji (D-026):** w E3 test długości tekstu; najdłuższy język z listy `[DO USTALENIA]` z rolą 09.
- **Podważone wejście:** tekst ofert wybrany przez właściciela (`oczko-warsztat/03-zakres/2026-10-22-build/oferty-tekst-wlasciciela.md`, wariant 1) nie pasuje już do modelu: hasło „No subscriptions…” odpada (P-058), plan 3-miesięczny nie istnieje (P-057), procenty odpadają (P-054). Nowy tekst ofert zaproponuję w E3 do wyboru właściciela.

## Pamięć portfolio: czego nie powtarzać
- Trening: talerze i sztanga, IBM Plex, papier `#F4F3EF` z niebieskim `#1F5FD1`, kolory IWF.
- Organizer: **wstążki i linie** (blisko nitek włóczki: metafora nitki jako linii grupy jest zajęta), Bricolage Grotesque + Atkinson Hyperlegible, piasek z terakotą.
- NaviStories: brąz z bielą, sylwetka na tablicy, Jost.
- Stara wersja Oczka: Tektur + Plex (biblioteka `prompts`, wyżej).
- Kalibracja domyślnych wyborów (krem z terakotą, „duża liczba + mała etykieta + statystyki”, wersaliki z rozstrzeleniem, mono na etykietach). Ekran licznika to z natury „duża liczba”; element firmowy musi nieść więcej danych niż sama liczba, żeby nie był domyślnym „bohaterem”.

## Ekran kluczowy (decyzja 1)
Ekran licznika, bo to pętla główna (J-01) i najczęstszy ekran. Proponuję dwa stany obok siebie: **„pierwsze liczenie”** (świeża instalacja, jeden licznik, nic więcej, P-046) i **„sweter w toku”** (część „Rękaw lewy” z celem, licznik powtórzeń, przypomnienie „co 6 rzędów” w tym rzędzie, notatka). Pierwszy sprawdza spokój i NFR-PIE-001, drugi element firmowy z danymi i moment firmowy (przypomnienie zmienia ekran).

## Plan i czas (zasada 9)
| Etap | Co | Agent | Oczekiwanie | Właściciel |
|---|---|---|---|---|
| E1 | inwentarz świata dziedziny ze źródłami (CYC, symbole, przedmioty: znaczniki, licznik bębenkowy, miarka drutów), skan 20 konkurentów, ≥ 8 metafor → `01-swiat.md` | 1,5–2 h | sieć | STOP: wybór 3 metafor, ok. 10 min |
| E2 | 3 kierunki na ekranie kluczowym, karty kontrolne i test generyczności, ikony, `porownanie.html` + `.png`, krytyka soczewek; potem ok. 5 krojów tytułowych | 3–4 h | render | STOP: wybór okiem, ok. 15 min; krój, ok. 5 min |
| E3 | tokeny z `kontrast.mjs`, komponenty, słownik, macierz stanów, głos, teksty ofert, ikona do plików, 3–5 ekranów × 12 wariantów, przejście poznawcze (4 soczewki), porównanie wzoru z patentami | 4–6 h | render | STOP: system, ikona, teksty ofert, ok. 20–30 min |
| E4 | `design-spec.md`, `wzorce-zrzuty/`, przekazanie, wpis portfolio | ok. 1 h | — | STOP: akceptacja, ok. 5 min |
Razem: ok. 10–13 h agenta w kilku turach, ok. 1 h właściciela.

## Decyzje dla właściciela (STOP E0)
1. **Ekran kluczowy.** (a) licznik w dwóch stanach: „pierwsze liczenie” i „sweter w toku” z przypomnieniem; (b) jeden stan „sweter w toku” plus wzór poziomo (F-25); (c) licznik plus zegarek. Kompromis: (b) i (c) pokazują więcej powierzchni, ale porównanie trzech kierunków na dwóch urządzeniach rozmywa ocenę okiem; wzór i zegarek i tak dochodzą w E3. **Rekomendacja: (a).**
2. **Język makiet.** (a) angielski (główny storefront US, źródłowe teksty interfejsu, tekst ofert właściciela był po angielsku), polski i niemiecki jako test długości w E3; (b) polski, angielski w E3. **Rekomendacja: (a).**
3. **Przejście poznawcze bez Expo web** (P-052 (2) zakładało zrzuty z Expo web, którego jeszcze nie ma). (a) klikalny prototyp HTML kluczowych przepływów w E3, cztery niezależne subagenty-soczewki przechodzą go (4 pytania NN/g), wynik `[OCENA]` wraca do kolumny „Intuicyjność”; powtórka na Expo web w audycie roli 04 po roli 08; (b) wynik dopiero na Expo web po roli 08 (kolumna „czeka na 04” do tego czasu). **Rekomendacja: (a)**: błędy przepływu wychodzą przed kodem.
4. **Wyjątek zasady 19** (ta sama sesja dla roli 04, tańsza kontrola wyżej): potwierdź albo każ zacząć nową sesję.
