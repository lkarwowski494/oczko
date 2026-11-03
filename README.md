# Oczko

Aplikacja dla osób, które dziergają na drutach i szydełkują. Licznik rzędów, który pamięta, gdzie skończyłaś lub skończyłeś, z własnym wzorem obok licznika, projektami i narzędziami do obliczeń. Bez konta, bez reklam, bez śledzenia; dane zapisują się na urządzeniu.

**Stan:** aplikacja jest w budowie (przebudowa od 21.10.2026) i nie jest jeszcze w App Store. Stan prac i następny krok: [`docs/sztafeta.md`](docs/sztafeta.md), decyzje: [`docs/decyzje.md`](docs/decyzje.md).

## Co robi

- Liczy rzędy jednym stuknięciem, z wibracją, cofnięciem i historią zmian; ekran nie gaśnie podczas liczenia.
- Trzyma wzór (plik, zdjęcie, strona WWW) obok licznika, ze znacznikiem bieżącego rzędu.
- Prowadzi projekty z częściami, celami, przypomnieniami „co N rzędów, M razy”, notatkami i zdjęciami; po przerwie otwiera się tam, gdzie skończyłaś lub skończyłeś.
- Zapisuje dane na urządzeniu i pozwala je wyeksportować oraz przenieść na nowy telefon.
- Jest darmowa w ramach miesięcznego limitu dni z robótką; Oczko Pro znosi limit (szczegóły: [`docs/monetyzacja.md`](docs/monetyzacja.md)).

## Platformy

Aplikacja dla iPhone, iPad i Apple Watch (iOS 18.0 i nowszy, watchOS 11.0 i nowszy).

## Zakres wersji 1.0: 51 funkcji

Lista pochodzi z kontraktu zakresu ([`docs/scope-contract.md`](docs/scope-contract.md)), funkcje z decyzją MVP. Kontrakt jest źródłem; test `tests/jakosc/readme.test.ts` pilnuje zgodności listy. Zakres to plan wydania, nie opis stanu builda: na przykład przełącznik synchronizacji iCloud (F-27) jest ukryty w kompilacji dla App Store do czasu testu telefon–iPad.

- F-01 · Licznik od pierwszego uruchomienia, +1/−1, wibracja
- F-02 · Historia zmian z godziną i cofnięciem
- F-03 · Blokada przed przypadkowym stuknięciem (opcja)
- F-04 · Kilka liczników, zmiana ustawień w trakcie
- F-05 · Licznik powtórzeń powiązany z rzędami
- F-06 · Przypomnienie „co N rzędów, M razy” z podglądem planu rzędów
- F-08 · Cel rzędów części i jego osiągnięcie
- F-09 · Znaczenie liczby: rząd skończony / w trakcie
- F-10 · Ekran nie gaśnie podczas liczenia
- F-11 · Sesja na ekranie blokady: rząd (+1) i czas razem
- F-12 · Liczenie na zegarku
- F-14 · Projekt z częściami (powstaje z pierwszego licznika)
- F-15 · Notatka widoczna przy liczniku
- F-16 · Zdjęcia projektu i etykiet
- F-17 · Dane techniczne projektu (drut mm i US)
- F-18 · Powrót do projektu po przerwie
- F-19 · Stan projektu i archiwum ukończonych
- F-20 · Zrób taką samą: cały projekt
- F-21 · Stoper sesji przy zablokowanym ekranie
- F-24 · Import wzoru z pliku i ze zdjęcia
- F-25 · Wzór i licznik na jednym ekranie
- F-26 · Znacznik bieżącego rzędu we wzorze
- F-27 · Synchronizacja przez iCloud (opcjonalna)
- F-28 · Pisanie po wzorze Apple Pencil
- F-31 · Baza na urządzeniu, trwały zapis, dane po aktualizacji
- F-32 · Nowy telefon, eksport i import własnej kopii (także na niepustej bazie)
- F-33 · Ostatnio usunięte (projekt, licznik, część) 30 dni
- F-34 · Usunięcie wszystkich danych
- F-35 · Zakup Pro, przywracanie, opłacone nie znika
- F-36 · Bez reklam i śledzenia, polityka prywatności
- F-37 · Zapas włóczki i narzędzi (warstwa Narzędzia)
- F-38 · Obliczenia podstawowe: oczka z próbki, jednostki, grubość (warstwa Narzędzia)
- F-45 · Wpisanie wartości licznika i wyzerowanie
- F-46 · Licznik całości nad sekcjami kawałka
- F-47 · Strażnik stuknięć z tempa
- F-48 · Wibracja przypomnienia inna niż wibracja rzędu
- F-49 · Powrót do tego samego miejsca
- F-50 · Lista projektów po roku
- F-51 · Korekta czasu sesji i dat projektu
- F-52 · Druga część pary (bliźniak)
- F-53 · Karta ukończenia projektu
- F-54 · Projekty dawno nieruszane
- F-55 · Wzór ze strony WWW i z Worda, link do filmu
- F-56 · Zakreślanie i notatki na wzorze palcem
- F-57 · Zgłoś problem z diagnostyką lokalną
- F-58 · Widoczny stan synchronizacji i zegarka
- F-59 · Kalendarz dni, dzień i podsumowanie okresu (jeden widok)
- F-60 · Postęp projektu w procentach
- F-61 · Termin projektu, cel dzienny i kolejność „który projekt dziś”
- F-63 · Limit darmowych dni i strażnik startu dnia (komunikat zawczasu, licznik dni, utrata Pro)
- F-64 · Prośba o ocenę po ukończeniu projektu i odnośnik „Oceń”

## Prywatność i wsparcie

- [Polityka prywatności](https://apps4brew.com/oczko/privacy.html)
- [Wsparcie](https://apps4brew.com/oczko/support.html)

## Dla deweloperów

Expo SDK 57, React Native, TypeScript, expo-sqlite. Decyzje architektury: [`docs/adr/`](docs/adr/0001-przechowywanie-sqlite-pliki-poza-baza.md). Zasady pracy nad repozytorium: [`CLAUDE.md`](CLAUDE.md).

- instalacja: `npm ci`
- testy: `npm test`
- pełna bramka (typy, lint, kontrole repozytorium, testy): `npm run verify`
- typy: `npm run typecheck`
- lint (tylko `src/dane`): `npm run lint`
- kontrole repozytorium: `npm run jakosc:kontrole`

Dokumenty: wymagania [`docs/brd/README.md`](docs/brd/README.md), projekt wyglądu [`docs/design/00-rozpoznanie.md`](docs/design/00-rozpoznanie.md), strategia testów [`docs/jakosc/strategia.md`](docs/jakosc/strategia.md), wydanie [`docs/wydanie/stan.md`](docs/wydanie/stan.md), atlas technik [`docs/atlas/README.md`](docs/atlas/README.md).

---

iPhone, iPad, Apple Watch, Apple Pencil, iCloud i App Store są znakami towarowymi Apple Inc. Oczko nie jest powiązane z Apple ani przez nią polecane.
