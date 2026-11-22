# Poprawki E2 #138 — sesja U (08, tryb fix): E2-138-A1

Gałąź `claude/kopia-poprawki-e2-138-2026-11-02` (baza fe58a19 = kopia 07: integracja 6 + poprawki scenariuszy po #138). Polecenie: `oczko-warsztat` 791afdd `koordynacja/role-2026-11-01/08-poprawki-e2-138.md`. Stan na 2026-11-02.

## Wynik w skrócie
| ID | Klasa | Realność | Test | Przed → po |
|---|---|---|---|---|
| E2-138-A1 | D (układ nagłówka arkusza formularza przy AX5) | realny, S2 (bariera dostępności) | `tests/ekrany/arkusz-formularza-ax5-trasa.test.tsx` (22: 6 arkuszy z trasy `app/formularz/[rodzaj]` × 3 + „Enter the row number” + próg + limit skali + kontrola statyczna) | 7 czerwonych na kodzie sprzed poprawki (brak osobnego wiersza akcji; asercje o strukturze, nie import) → 22/22 zielone |

## Spec czy wariant koordynatora
- **Spec mówi o zachowaniu, nie o układzie.** `docs/design/design-spec.md:387`: „przy dużym tekście nagłówek łamie tytuł, treść się przewija”; `:46` (nagłówek Cancel / tytuł / Save, `naglowek-arkusza`). Makieta `fix10-2026-11-01/partia8.html:131-132` (też `fix7-2026-10-26/wzor.html:130-131`): `.naglowek-arkusza { flex-wrap: wrap }`, tytuł `flex: 1 1 auto; min-width: 0` — w przeglądarce tytuł, który nie mieści się obok przycisków, trafia do osobnego wiersza. Kod próbował tego samego (`flexWrap`, `flexBasis: 'auto'`), ale Yoga mierzy tekst na pozostałej szerokości i nie przenosi go do nowego wiersza (zrzut `30-krok28-arkusz-ax5.png`, nagłówek 404 pt).
- **Wdrożone = wariant koordynatora, zgodny z makietą:** od AX1 (`PROG_KATEGORII_DOSTEPNOSCI` = 1,786, ten sam próg co licznik) Cancel i Save w jednym wierszu (`arkusz-akcje`), tytuł pod nimi na pełną szerokość (`alignSelf: 'stretch'`, `typografia.tresc` 700, limit skali ×1,8 bez zmian); poniżej AX1 nagłówek bez zmian (ta sama struktura i style). Bez nowych tokenów i stylów (zasada 15).
- **Zapis „bez spec — do potwierdzenia przez 04 w M1”:** spec nie rozstrzyga *układu* nagłówka przy AX1–AX5 (tytuł pod przyciskami, centrowany; kolejność czytania VoiceOver Cancel → Save → tytuł zamiast Cancel → tytuł → Save). Do potwierdzenia przez 04 razem ze zrzutem `30-ax5-arkusz-wpisz-wartosc` z #139.

## Zakres: arkusze z `formularz` (19 użyć `formularz={{`, wszystkie na `<Arkusz`; kontrola statyczna w teście)
Jeden komponent `ArkuszFormularza` (`src/ekrany/Arkusz.tsx`) obsługuje wszystkie, więc poprawka obejmuje każdy z nich:
- `src/ekrany/Formularze.tsx`: wpisanie wartości (`formularz.wpisz_tytul`, scen. 30), powtórzenie, przypomnienie (dodaj/edytuj), lista przypomnień (Close / Add), korekta sesji, nazwa, cel.
- `src/ekrany/FormularzeProjektu.tsx`: nowy projekt, część, licznik, notatka, znaczenie, narzędzie, termin, włóczki projektu.
- `src/ekrany/Zapas.tsx`: włóczka (dodaj/edytuj), druty/szydełko (dodaj/edytuj).
- `src/ekrany/WzorGrupa.tsx` (link do strony, zmiana nazwy), `src/ekrany/WzorFilm.tsx` (link do filmu).
- Test trasy `app/formularz/[rodzaj].tsx` (prawdziwa baza, P-377): `wpisz`, `nazwa`, `cel`, `powtorzenie`, `znaczenie`, `przypomnienie` × {AX5, XXXL}. Pozostałe arkusze (Zapas, Wzór, część/licznik/notatka/narzędzie/termin/włóczki) dzielą ten sam komponent; ich osobne trasy nie mają jeszcze testu AX5 — [DO USTALENIA] zrzut na symulatorze (tylko scen. 30 sprawdza AX5 w E2).

## Nie sprawdzono
1. Układu na symulatorze (Yoga): RNTL nie liczy układu (JAK-13). Kryterium „pole widoczne na pierwszym ekranie” potwierdzi dopiero zrzut `30-ax5-arkusz-wpisz-wartosc` w przebiegu #139 (macOS).
2. Arkuszy z `formularz` poza sześcioma z tabeli testu przy AX5 na urządzeniu (jw.).
