# M3 p6 Narzędzia + włóczka — stan partii (rola 08, build) · 2026-11-08

Gałąź `claude/kopia-08-p6-2026-11-08` od 936a1227 (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p6.md` @ 05e3eb2.

## Stan wyjściowy
`npm test` na 936a1227: 517 zestawów, **5385 testów**, kod 0 (log w scratchpadzie sesji).

## Zrobione (commity `[M3 p6] …`)
- 98fcb3a (struktura): `Narzedzia.tsx`, `Zapas.tsx`, `Miary.tsx` czytają tokeny Dzianiny (`tlo`, `powierzchnia`, `tekst`, `tekst2`, `promien.lista/przycisk`, `cel.minus`, `typografiaDzianiny.*`) zamiast aliasów starych nazw ról; wartości te same. Strażnik `tests/dzianina/p6-narzedzia-tokeny.test.ts` (10 plików partii; przed: 3 czerwone).
- 6cf5fb4 (zachowanie, M3-S3-04): tytuły Narzędzi, zapasu, drutów, próbki i miar w kroju systemowym dla bg, el, ja, ko, ru, sr, uk, vi, zh-Hant (opcjonalny `jezyk` jak w „Dziś”; trasy przekazują `kontener.j.jezyk()`). Test `tests/ekrany/narzedzia-kroj-m3.test.tsx` (przed: 5 czerwonych).
- ostatni: stan, wykaz zastąpionych (`m3-p6-zastapione-testy.md`: żaden test nie zmieniony), `tabela-08`.

## Aliasy w `motyw.ts`
Pliki partii p6 nie używają już starych nazw. Alias można usunąć, gdy zrobią to też p3b, p4, p5, p7 (nie sprawdzono, to ich pliki).

## Odstępstwa od makiety / do 04 (makiety zakładki Narzędzia nie ma: `ekrany.html` ma tylko kafle „Dziś”; design-spec:61 mówi „wygląd”)
1. Zakładka Narzędzia zostaje listą grupowaną jak dotąd (wiersze z `chevron.forward`); **bez ikon wiersza** — nie dodawałem elementu spoza makiety (zasada 15). Gotowa propozycja: `scribble.variable` (włóczki i druty, jak kafel „Dziś”), `square.grid.3x3` (próbka); oba w typie `NazwaSymbolu`. [DO USTALENIA 04]
2. Miary: wybór nadal glifem „✓” (ikona wyboru zamiast ✓ jest w p4, ma ją wspólny komponent; nie duplikuję).
3. Zapas, druty: przyciski i chipy nadal obrysowane (`tekst2`, 2 pt); makieta nie pokazuje tych ekranów, więc nie zmieniałem na wypełniony przycisk główny. [DO USTALENIA 04]
4. „Back” zostaje na ekranach zakładki (e2e 16, M1-016), jak w p2.
5. Arkusze (`Arkusz.tsx`), `Wloczka` (pielęgnacja), `FormularzeProjektu`, `Zdjecia` poza zakresem p6 (p1/p4).

## Teksty (en, pl)
Żadnych nowych kluczy; `oczekujace.json`, `en.kontekst.json`, `tests/i18n/m3-prefiksy.ts` bez zmian.

## Dane
Bez zmian (żadnego zapisu, schematu ani migracji).
