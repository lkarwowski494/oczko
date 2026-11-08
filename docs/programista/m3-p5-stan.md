# M3 p5 Historia (dni, sesje) — stan partii (rola 08, build) · 2026-11-08

Gałąź `claude/kopia-08-p5-2026-11-08` od 936a1227 (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p5.md` — czytane z HEAD warsztatu 63f0d21 (commit 32feb91 z polecenia niedostępny w płytkim klonie; plik ma jedną zmianę w historii, więc możliwa różnica nieweryfikowalna).

## Stan wyjściowy
6 plików testów historii i sesji (`historia-dni`, `sesje`, `kompozycja-sesji`, `p202-stan-danych-korekta`, `naglowki-p2-4`, `naglowki-sekcji-13-reszta`): 27/27 zielone.

## Zrobione (commity `[M3 p5] …`)
- 7194ed0 Historia (wygląd): siatka kalendarza na pełną szerokość ekranu (komórka = szerokość / 7, ≥ 44 pt przy 320 pt; przy AX5 siatka zostaje, jak w makiecie `historia-390-jasny-ax5`), dzień z robótką = kwadrat `akcent` z obwódką `akcentTekst`, wybrany = obwódka `tekst`, projekty dnia, tydzień i miesiąc w kartach `powierzchnia`, nagłówki bloków 17 pt 700. Test przed kodem: `historia-dni-komorka-320` (3 × czerwone na asercji, po kodzie 6/6).
- 3248b8d Sesje (struktura): nazwy tokenów Dzianiny zamiast zgodnościowych, wartości te same.
Wykaz zmienionych testów: `m3-p5-zastapione-testy.md`. Teksty: bez nowych kluczy (`historia.*` nie dodano), więc słowniki, `oczekujace.json` i `en.kontekst.json` bez zmian.

## Dane i testID
Dane bez zmian (kompozycja `stanHistorii`, `widokHistorii` nietknięte). testID bez zmian: `historia`, `historia-kalendarz`, `historia-dzien-<data>`, `historia-pusta-komorka`, `historia-dzien`, `historia-tydzien`, `historia-miesiac`, `historia-ukonczono`, `sesje`, `sesje-lista`, `sesje-do-sprawdzenia` (E2E 37, 38, 64 odwołują się do `historia-dzien-<data>`, `historia-kalendarz`, `sesje-lista`).

## Nie sprawdzono
Urządzenie i symulator (brak macOS), zrzuty (brak Expo web), E2E iOS (uruchamia koordynator). Pomiar szerokości po `onLayout` (iPad, Split View) tylko z kodu: do pierwszego pomiaru szerokość okna.

## Odstępstwa od makiety (do 04)
1. Dzień dziergany bez faktury oczek „V” (jak „Ten tydzień” na „Dziś”, p2): 30 wzorów SVG w kalendarzu; wariant: miniatura dzianiny w komórce [DO USTALENIA 04].
2. (cz. 2, zrobione) kafelki miesiąca, nazwy sąsiednich miesięcy, dni przyszłe wyszarzone — patrz niżej. Nadal brak: wyłączonej strzałki „następny” po bieżącym miesiącu z makiety (opacity .35; zmiana zachowania, nie zlecona) i kafelka czasu bez sesji (celowo: brak zostaje brakiem, nota `dni.bez_stopera`).
5. Ekrany Sesje i korekta sesji: makiety Dzianiny brak; wygląd z tokenów (grupa `powierzchnia`, wiersz ≥ 44 pt); nagłówki grup 13 pt `tekst2` zostają (test `naglowki-sekcji-13-reszta`), co różni się od nagłówków 17 pt/700 w Historii — spójność do 04.
6. Arkusz korekty (`KorektaSesji` w `Formularze.tsx`) bez zmian kodu: używa `Arkusz` z p1.

## Dowody
`npm run verify` kod 0: 518 zestawów, 5391 testów (typecheck, typecheck:testy, lint, `jakosc:kontrole` w tym `tabela-08` odświeżona i i18n). Pierwszy przebieg padł na `tabela-08` (nowy plik testu) i na regule JAK-13 (`dokumenty-jakosci` 046: nazwa testu z „44 pt”); poprawione: regeneracja tabeli, nazwy testów jako deklaracja stylu.
Test nowy: `historia-dni-komorka-320` (6). Zmienione: `przycisk-glowny-wypelniony` (1 test × 2 motywy), `naglowki-p2-4` (b), `bez-literalow-wymiarow` (lista wyjątków) — `m3-p5-zastapione-testy.md`.

## Część 2 (P-590 (a), tej samej sesji)
Kafelki podsumowania miesiąca (`historia-kafel-dni|rzedy|czas`, liczba Bree nad etykietą; z istniejącego odczytu `miesiac`, bez nowego zapytania), strzałki z nazwami sąsiednich miesięcy z Intl (etykiety VoiceOver i wywołania bez zmian), dni po dzisiejszym bez tła z tekstem `tekst2` (wybór dnia przyszłego nadal działa). Klucze `historia.kafel_dni|rzedy|czas` (en, pl; plural), `en.kontekst.json`, `oczekujace.json`, prefiks `historia.kafel_` w `m3-prefiksy.ts` (węższy niż `historia.` — ten prefiks ma też arkusz zmian licznika). Kafelek czasu tylko przy sesjach. Linie miesiąca „rzędy · czas” i „dni robótkowe” zastąpione kafelkami; klucz `dni.dni_robotki` nieużywany w kodzie (do usunięcia w fali 09).
`npm run verify` kod 0: 519 zestawów, 5401 testów. Test przed kodem: `historia-dni-czesc-2` (8 czerwonych, po kodzie 10/10); zmieniona asercja `historia-dni` (wykaz).
Nie sprawdzono: układ wiersza miesiąca przy 320 pt (tytuł + dwie nazwy mogą się zawinąć — `flexWrap`), AX5 kafelki w jednej kolumnie, zrzuty.
