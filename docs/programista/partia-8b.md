# Partia 8b (rola 08, tryb fix) — licznik

Stan: 2026-11-01 · gałąź `claude/kopia-partia-8b-2026-11-01` (z `claude/kopia-partia-8a-2026-11-01` @ 605e9f4) · polecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8b.md` (86744d1) · decyzje P-326–P-330.

## Stan wyjściowy
- Przed pracą (605e9f4): `env -u NODE_PATH npm test` — 252 zestawy, 2722 testy, kod 0 (2026-11-01).
- Środowisko: Linux, Node 22.23.4, bez Xcode/macOS: Swift (030) i E2E Maestro tylko jako kod + test statyczny; sprawdzenie na urządzeniu — krok właściciela.

## Klasyfikacja (E0) i kolejność
Wszystkie D (defekt); wybory P rozstrzygnięte w P-330 (011 A, 021 A, 014 S5 baner źródła, 025 reguła 04). Nie ma wyboru właściciela (koszty, konta, scalenie, wysyłka nietknięte). Ścieżki wrażliwe (zasada trybu fix: migracje, kopie, import, czyszczenie danych, zakupy): żadne z 9 ID. 024 dotyka zapisu wartości licznika, ale nie schematu — bez przeglądu subagenta.

| Kolejność | ID | Rodzaj | Plan (pliki) |
|---|---|---|---|
| 1 | 020 | D | `widok-licznika.ts` woła `powtorzenieLicznika`; `kompozycja/licznik.ts` zdarzenie końca powtórzenia ze skończonych |
| 2 | 021 | D | `cofnijOstatnie` (pomija cofnięcia i cofnięte), `historiaLicznika` (znacznik cofnięcia, `przed`), `Historia.tsx`, `app/historia.tsx` (rozwinięcie starszego wpisu → wpisanie wartości) |
| 3 | 022 | D | `app/index.tsx` / okno „Uczciwe zasady” nie na liczniku; E2E 07 przepisany |
| 4 | 009 | D | `zdarzeniaPlus` tworzy `cel-dnia` (haptyka przy osiągnięciu celu dnia) |
| 5 | 025 | D | rodzaj licznika w modelu (`WidokLicznika.rodzaj`), teksty „stitch” (klucze `licznik.*_oczka*`), bez linii „Now working row”, celu, przypomnień, strażnika, „Next part” |
| 6 | 024 | D | wpisanie wartości: limit zamiast `zapis`, separatory regionu, strażnik jak +1 (BR-ZAK-005) |
| 7 | 011 | D (wybór A) | „Reminders” w menu •••: lista, edycja, usunięcie; sygnał po wpisaniu wartości (S4) |
| 8 | 014 | D | strażnik: rodzaj licznika (oczka nie wołają), zwrot dnia limitu przy cofnięciu serii (L-06), baner z źródłem i godziną serii (S5) |
| 9 | 030 | D | `Aktywnosc.swift`: etykiety VoiceOver `karta_a11y`, `plus_a11y_przypomnienie` (test statyczny na Linuksie) |

### Decyzje E0 (do wiadomości koordynatora; bez STOP-u)
- **025, cel:** licznik oczek **nie ma celu**. Cel części jest w rzędach (`czesc.cel_rzedow`, BR-PRJ), a BR-LIC-006 mówi tylko o dwóch licznikach w projekcie. Linia celu na ekranie oczek się nie pojawia. Powrót: prośba o cel oczek w recenzjach → nowa funkcja przez rolę 03.
- **025, podsumowania:** już dziś liczą wyłącznie rzędy — zapytania filtrują `l.rodzaj = 'rzedy'` (`src/dane/repozytoria/kalendarz.ts:16`, `dni.ts:18`, `liczniki.ts:125`, `widok-ukonczenia.ts:22`, `widok-projektu.ts:57`). Dodaję tylko test regresji (oczka nie wchodzą do dnia, kalendarza ani karty ukończenia).

## Zrobione (test czerwony przed → poprawka → zielony; osobny commit)
Po każdym ID: `env -u NODE_PATH npm run verify` kod 0. Stan na koniec sesji 1: 259 zestawów, 2750 testów (przed pracą 252 / 2722).

| ID | Commit | Test (czerwony przed poprawką) |
|---|---|---|
| 020 | 6848241 | `tests/dane/powtorzenie-wektory-widok.test.ts` (5 z 8 padało: RD-12-W1–W4, W9); poprawiony `tests/dane/czesc-menu.test.ts` (utrwalał wynik kodu, 07-jakosc-032); `tests/dane/kompozycja-licznik-8b.test.ts` (koniec powtórzenia w obu trybach — straż zachowania, była zielona) |
| 021 | 22e36a1 | `tests/dane/cofniecie-podwojne.test.ts` (5 z 5 padało: drugie Undo dawało 3 zamiast 1); UI: `tests/ekrany/historia-trasa.test.tsx` (pisany razem ze zmianą propsów ekranu, więc bez osobnego przebiegu czerwonego), poprawiony `historia-menu.test.tsx`; wyrocznia kluczy `tests/narzedzia/klucze-fix10-8b.test.ts` |
| 022 | 3cc9dcb | `tests/ekrany/uczciwe-zasady-trasa.test.tsx` (okno na liczniku 1 zamiast 0; na liście 0 zamiast 1); scenariusz E2E 07 przepisany (nie uruchamiany: bez macOS) |
| 009 | 1b240e9 | `tests/dane/kompozycja-licznik-8b.test.ts` (dziesiąte +1 przy celu dnia 10 bez `cel-dnia`) |
| 025 | c034efc | `tests/ekrany/licznik-oczek.test.tsx` (3 z 4 padały; czwarty to straż podsumowań) |

### Uwagi do zrobionych
- **021:** reguła w `src/domena/cofniecie.ts` (`celCofnieciaIndeks`, `cofnieteId`) używana przez `cofnijOstatnie` i `historiaLicznika`. Seria na końcu historii to jeden wpis z „Undo n rows” (`cofnijSerie`); seria dłuższa niż 200 zdarzeń (`OKNO_SESJI`) nie zgrupuje się. Przycisk rozwijania starszego wpisu ma glify „+”/„–” z etykietą VoiceOver = tekst wpisu — **brak klucza `en` dla tej kontrolki w `klucze.json`** (prośba do 04).
- **025:** poza polecenia 04 ukryłem w menu ••• licznika oczek także „Goal”, „Repeat” i tryb rzędu (cel, powtórzenie i „rząd w trakcie” dotyczą rzędów) — do potwierdzenia przez 04. Dla oczek strażnik serii (RD-17) i limit dnia: patrz 014 niżej.
- **Klucze en:** `klucze.json` ma kontekst plików mnogich osobno dla `_one`/`_other`; konwencja projektu trzyma jeden kontekst na nazwie bazowej, więc zachowano kontekst z `_one`, a kontekst `_other` (inny sens, np. „po «30 → 130 ·»”) pominięto. Skrypt nakładania kluczy był w scratchpadzie (nie w repo): wartości `en` 1:1, kontekst na nazwie bazowej, potem `node scripts/sprawdz-i18n.mjs src/i18n/slowniki --zrodlo en --pseudo src/i18n/pseudo/en-XA.json`.
- Po każdej zmianie testów: `node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md`; kontrola repo wymaga, by każdy test importował plik z `src` bezpośrednio.

## Nie zrobione — zostało dla nowej sesji (kolejność: 024, 011, 014, 030)
- **024** (wpisanie wartości, F-45, ZM-08): `app/formularz/[rodzaj].tsx` funkcja `zapisz` zamienia każdy błąd na `zapis` (też `limit`) — mapować `powod` (`limit` → komunikat limitu BR-ZAK-005/S5, pozostałe jak dziś); wpisywanie z separatorami regionu (`parsujLiczbe(tekst, jezyk)` w `src/i18n/format.ts`, ER-43) w `FormularzWartosci` (`src/ekrany/Formularze.tsx`); strażnik jak +1 (`wpiszWartosc` woła `wolaStraznika` przez `zmien`). Test przez trasę `/formularz/wpisz`, nie sam komponent.
- **011** (wariant A): w menu ••• przy ≥ 1 przypomnieniu pozycja „Reminders” z liczbą → arkusz listy → edycja/usunięcie (klucze `przyp.*` z `klucze.json`, nałożyć `^przyp\.`); przypadki użycia w `src/przypadki-uzycia/czesc.ts` (dziś tylko `dodajPrzypomnienie`) — dodać zmianę i usunięcie; sygnał po wpisaniu wartości (S4, RD-13-W23): jedno przypomnienie (najnowsze) + wibracja + ogłoszenie, bez sygnału przy wartości mniejszej (RD-13-W8); punkt zaczepienia: `wejscie()` w `src/kompozycja/licznik.ts` i `zapisz` w `app/formularz/[rodzaj].tsx` (`sygnalZmiany` z `src/domena/przypomnienia.ts`). Dla oczek menu już bez „Reminders” (025).
- **014**: (a) widok woła strażnika z rodzajem licznika (`seria()` w `src/przypadki-uzycia/widok-licznika.ts` ma przechodzić przez `serieLicznika` z `src/domena/straznik-rodzaj.ts`; dla oczek brak serii); (b) zwrot dnia limitu przy cofnięciu serii (`cofniecieSerii`, `src/domena/limit.ts:96`, L-06/L-19: wraca tylko z pytania serii, gdy seria zaczęła dzień; z historii nie — design-spec 014 S5 mówi „nie zwraca”); (c) S5: baner z źródłem i godziną serii (`licznik.seria_blokada_*`, `licznik.seria_zegarek_*`, `zrodlo` zdarzeń `blokada`/`zegarek` w tabeli `zdarzenie`); nałożyć klucze `^licznik\.seria_(blokada|zegarek)`.
- **030**: `targets/widget/Aktywnosc.swift` — dodać etykiety VoiceOver z `Teksty.swift` (`karta_a11y`, `plus_a11y_przypomnienie`); w Linuksie tylko test statyczny (grep w teście jakości) + kod; sprawdzenie na urządzeniu/Maestro iOS u właściciela. 016 „stop z ekranu blokady” wypada (ZM-10).
- Przegląd subagenta nie dotyczy żadnego z 9 ID.

## Nowe obserwacje (poza zakresem; nie naprawiane)
- `app/formularz/[rodzaj].tsx`: wszystkie błędy zapisu to `zapis` (dotyczy też `nazwa`, `cel`, `powtorzenie`) — szczegóły w 024.
- `docs/jakosc/e4/tabela-08.md` jest generowana: w tej partii regenerowana po każdym ID.
