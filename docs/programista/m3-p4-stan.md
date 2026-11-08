# M3 p4 Projekty, projekt, formularze, zdjęcia — stan partii (rola 08, build) · 2026-11-08

Gałąź `claude/kopia-08-p4-2026-11-08` od fb019006 (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p4.md` @ 4d90856.

## Stan wyjściowy
`npm test`: 520 zestawów, 5410 testów, kod 0 (zgodnie z p3b).

## Zrobione (commity `[M3 p4] …`)
- **Lista Projekty** — miniatura dzianiny w wierszu (`miniatura.dzianina` 40×56, wcięcie 4, `Dzianina` z danych licznika ostatniej pracy: gotowe = wartość, cel = cel części; ukończony: pełna do linii celu; ukryta przed VoiceOver, ukryta od progu AX1 `PROG_KATEGORII_DOSTEPNOSCI`), lupa w polu szukania, ••• wiersza (`projekty-wiersz-menu`, „More: {nazwa}”) → arkusz systemowy `ActionSheetIOS` (tytuł „Delete “X”?”, data końca kosza, „Delete project” destrukcyjne, „Cancel”) → `usunProjekt` (kosz 30 dni, WD-3) + `licznik.poUsunieciu` + ogłoszenie; stopka „Recently deleted: N items, until {data}. Show” (`projekty-kosz`, etykieta VoiceOver bez zmian).
- **Odczyt** — `WidokProjektow.koszDo` (najwcześniejszy `doDnia` kosza, tylko odczyt, bez zmiany zapisu i schematu).
- **Teksty (en, pl)** — `projekty.menu_a11y`, `projekty.kosz_do` (liczba mnoga), `projekty.kosz_pokaz`; `oczekujace.json`, `en.kontekst.json`, prefiksy w `tests/i18n/m3-prefiksy.ts`. Symbol `magnifyingglass` dopisany do typu `SymbolSf` (wyjątek jak P-577).
- **Testy przed kodem** — `tests/ekrany/projekty-dzianina-p4.test.tsx` (9): 8 czerwonych z właściwego powodu (brak testID miniatury / przycisku ••• / stopki, brak pól `dzianina` i `koszDo`, brak wywołania arkusza), 1 (ukrycie przy AX) zielony od razu — kontrola brzegowa.

## Projekt, formularze, zdjęcie
Bez zmian w kodzie: ekrany czytają tokeny Dzianiny z p1 (`papier`, `papierGrupa`, `typografia.tytul` itd.), a `ekrany.html` nie ma makiet ekranu Projekt, arkuszy formularzy ani zdjęcia (design-spec:58–59: „wygląd”, kroki bez zmian, WD-2). Nowych elementów bez źródła nie dodawano (zasada 15).

## Otwarte / odstępstwa
1. Brak makiet Projekt/formularze/zdjęcie → do 04 (audyt zgodności) albo makieta.
2. Opis wiersza zostaje „{część} · row {n} of {cel}” (testy), nie „· 44% · dziś” z makiety.
3. Stopka liczy elementy kosza (części, liczniki, włóczki…), nie tylko projekty jak w makiecie („1 projekt”).
4. O-1 mapy tokenów (kropka koloru włóczki przy miniaturze) — bez decyzji, nie dodano.
5. ••• wiersza to `ActionSheetIOS`, nie UIMenu (jedna pozycja destrukcyjna z potwierdzeniem w tym samym arkuszu).
6. Miniatura: skala okna bez celu 96 rzędów (z `dzianina-geometria`), `dzis`=0 i brak ząbka przypomnienia na liście (brak danych w widoku).
