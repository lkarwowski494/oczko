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
| ID | Commit | Test (czerwony przed poprawką) |
|---|---|---|
| 020 | 6848241 | `tests/dane/powtorzenie-wektory-widok.test.ts` (5 z 8 padało: RD-12-W1–W4, W9); poprawiony `tests/dane/czesc-menu.test.ts` (utrwalał wynik kodu, 07-jakosc-032); `tests/dane/kompozycja-licznik-8b.test.ts` (koniec powtórzenia w obu trybach — straż zachowania, była zielona) |

## Nie zrobione / otwarte
- 021, 022, 009, 025, 024, 011, 014, 030 — zobacz tabelę kolejności.
