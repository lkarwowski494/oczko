# M3-LIC-01…03 — wady licznika z przebiegu 2 iOS (rola 08, fix) · 2026-11-09

Gałąź `claude/kopia-08-fix-licznik-2026-11-09` od f0328b48 (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-fix-licznik.md` @ e89d3cb (P-607). Klasa wszystkich trzech: **D** (defekt wyglądu/układu; dane, zachowanie i testID bez zmian).

## M3-LIC-01 — etykieta „−1” (nie odtworzono z kodu)
`LicznikStyl.minusTekst` = `k.grafit` = alias `tekst` (`motyw.ts` `zgodnosc`). Test `m3-fix-licznik.test.tsx` (4: jasny/ciemny × zwykły/AX5): kolor etykiety = `tokeny.kolory.<motyw>.tekst` — **zielony już na kodzie f0328b48**, więc brak czerwieni „z właściwego powodu”; zostaje jako strażnik. Zrzut `p2/start.png` pokazuje ciemny tekst, ale ten sam token (`grafit`) czyta tytuł obok i jest jasny na tym samym zrzucie; kod ma też `systemCzarny`/alias bez dwóch wartości. Przyczyny w kodzie nie znaleziono → **[DO USTALENIA: z którego commitu/buildu pochodzi zrzut; czy „−1” jest ciemne także w buildzie z tego HEAD]**. Kontrast tokenów (rachunek z poprzedniej partii, WCAG 2.x): ciemny `tekst`/`tlo` 13,67:1.

## M3-LIC-02 — rząd akcji (przyczyna odtworzona skryptem Yoga)
Skrypt w scratchpadzie (`yoga-layout` 3.1.0, nie w repo): drzewo rzędu jak w kodzie sprzed poprawki (padding 20, 5 komórek `flex: 1` + `minWidth 64`, korzeń `Stoper` = `flex: 1` bez minWidth, komórka w środku minWidth 64) daje przy 390 pt szerokości 76/77/76/**13**/76 (korzeń Stopera 13 pt, jego komórka 64 pt wystaje i jest przykryta przez „Historię” — „Ti” jak na zrzucie), przy 320 pt **0** i przy 440 pt 86/87/86/**23**/86. Przyczyna: korzeń `Stoper` bez podstawy.
Poprawka: `KOMORKA_AKCJI` = `flexGrow 1` + `flexBasis 64` (`LicznikAkcje.tsx`), użyte przez komórkę i korzeń `Stoper`; rząd `flexWrap: wrap`, odstęp 8; boczny margines 16 pt jak w makiecie `.akcje` (strefa `akcjeStrefa`). Wynik Yoga po poprawce: 390 pt — 5 × 65 pt w jednym wierszu; 440 pt — 5 × 75; 320 pt — 4 × 66 i piąta w drugim wierszu (jak makieta `auto-fit`, ale piąta komórka rozciągnięta na całą szerokość, nie na jedną kolumnę). Biegnący stoper: rama 2 pt jest wewnątrz komórki (odstęp wewnętrzny maleje o 2 pt), więc szerokość kolumny się nie zmienia; test porównuje podstawę, przyrost i „odstęp + rama” z komórką bez sesji.

## M3-LIC-03 — rząd pod stałą strefą
Przyczyna: rząd akcji był ostatnim elementem przewijanej treści, nad stałą strefą „−1 / +1” (168 + 32 pt); przy tytule w 2 wierszach na 6,9″ rząd wychodzi poza dolną krawędź listy i widać tylko jego górę (zrzut `p2/licznik.png`).
Poprawka (opcja A): rząd stoi poza przewijaną treścią tuż nad strefą (kolejność jak w makiecie: akcje, potem `.dol`); od AX1 lista akcji zostaje w przewijanej treści (makieta `.duzy`). Menu stopera (`position: absolute`) wychodzi nad strefę przez `zIndex` kontenera. Odrzucone: (B) strefa „−1 / +1” w przewijanej treści jak całość makiety — „+1” znika przy dłuższej treści, wbrew „≥ 168 pt w zasięgu kciuka” (design-spec); (C) bez zmian + wskaźnik przewijania — wada zostaje. Koszt A: na bardzo niskim ekranie (SE, 568 pt) przewijany obszar nad rzędem i strefą ma ~200 pt [nie sprawdzone na urządzeniu].

## Testy
`tests/ekrany/m3-fix-licznik.test.tsx` (13): na kodzie sprzed poprawki 7 × czerwone (LIC-02: wrap, podstawa/przyrost przy 320/390/440, stoper w obu stanach; LIC-03: rząd w przewijanej treści), 6 zielonych (LIC-01 × 4, AX5 lista w przewijanej treści, rachunek kolumn); po poprawce 13/13. Jest nie układa elementów — testy sprawdzają style gwarantujące układ; układ potwierdza skrypt Yoga, docelowo zrzut z przebiegu 3.
Zastąpione testy: brak (`m3-p4b-stoper.test.tsx` zielony bez zmian — pierwsza wersja z przezroczystą ramą była czerwona, więc odpuszczona na rzecz odstępu wewnętrznego). `docs/jakosc/e4/tabela-08.md` odświeżona poleceniem z `--check`.

## Nie sprawdzono
Urządzenie i symulator (brak macOS), zrzut „po”, E2E (`e2e/` nie ruszane), wygląd 320 pt poza rachunkiem Yoga, zmiana 4 pt marginesu (rząd 16 pt, reszta treści 20 pt, `srodek` bez zmian — odstęp od makiety nazwany).
