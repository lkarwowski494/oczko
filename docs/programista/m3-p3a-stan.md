# M3 p3a licznik — stan partii (rola 08, build) · 2026-11-08

Gałąź `claude/kopia-08-p3a-2026-11-08` od 014847ea (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p3a.md` @ 62d5d0d (plik niezmieniony do HEAD warsztatu 935a68b).

## Stan wyjściowy
`npm run test:akceptacja`: 3 testy, 3 × asercja (czerwone z właściwego powodu: brak testID akcji, „Projekt ›”, `nav-wstecz`). Strażnik `tests/jakosc/e2e-licznik-to-be.test.ts` zielony. Pełny zestaw na SHA startowym (koordynator): 513 zestawów, 5356 testów, kod 0.

## Zrobione (commity `[M3 p3a] …`)
- 86e1bf3 P-585: „Dziś” z kartą „+1” trzyma ekran włączony, tag `oczko-dzis` (zachowanie; test przed kodem, 5 asercji czerwonych → zielone).
- c6852ba licznik TO BE (zachowanie): rząd akcji (Notatka, Wzór, Cel, Stoper, Historia), „Projekt ›”, nazwa i część, dzianina z p1 zamiast kresek, `Liczba`, układ AX5, `nav-wstecz`; menu ••• (6 pozycji, 2 grupy, bez `menu-grupa-*`), arkusz „Cel” (`/menu?arkusz=cel`); teksty en i pl, `oczekujace.json`, `en.kontekst.json`, prefiksy `tests/i18n/m3-prefiksy.ts`.
- 0e9936b usunięcie `Kreski.tsx` (struktura; jedyne użycie było w liczniku).
Wykaz zmienionych testów: `m3-p3a-zastapione-testy.md`.

## Architektura (do wpisu decyzji)
- `LicznikAkcje.tsx`: `AkcjaLicznika` (komórka symbol + podpis, wspólna ze stoperem) i `RzadAkcji`. `PropsLicznika`: usunięte `naProjekty`; dodane `naWstecz`, `naNotatka`, `naCel`, `jezyk`; `stoper` to węzeł z kompozycji w 4. komórce (bez niego komórka nieaktywna).
- Akcje z trasy `app/licznik.tsx`: Wzór → `/wzor` zawsze; Cel → `/menu?arkusz=cel`; Notatka → `/formularz/notatka?projekt=<id>`; wstecz → `router.back()`.
- `MenuProjektu` (korekta: nazwa, numer, znaczenie, zerowanie; stan: blokada, ukończenie) i `MenuCel` (cel, przypomnienie albo lista planów, powtórzenie) w `app/menu.tsx`.
- Blokada wygaszania: `kartaZPlusem(stan, dane)` + `TAG_DZIS`/`TAG_LICZNIK`, jeden tag naraz w `Aplikacja`.
- Dane i zapis licznika bez zmian.

## Dowody
`npm run verify` kod 0: 517 zestawów, 5385 testów (typecheck, typecheck:testy, lint, `jakosc:kontrole` w tym i18n, `tabela-08` odświeżona). Testy nowe: `ekran-nie-gasnie-dzis` (7), `licznik-akcje` (11), `menu-licznika-m3` (11), `licznik-to-be` (3, przeniesiony z akceptacji).

## Nie sprawdzono
Urządzenie i symulator (brak macOS): wygląd, VoiceOver, AX5 na urządzeniu, haptyka; zrzuty (brak Expo web — `react-native-web` niezainstalowany); E2E iOS (49 scenariuszy czeka, uruchamia koordynator po scaleniu). Zrzuty do zrobienia u właściciela: licznik 390 jasny, ciemny, AX5 (z zębem przypomnienia i bez), arkusz „Cel”, menu •••, stoper w biegu.

## Otwarte / odstępstwa od makiety (do 04, 05)
1. Pas „teraz” dzianiny liczy rzędy bieżącej sesji (`sesja.rzedy`): stan licznika nie niesie „rzędów dziś” (są w `DaneDzis` „Dziś”). Etykieta VoiceOver: „w tej sesji”. Wariant: dodać `rzedyDzis` do stanu licznika (zmiana odczytu, STOP danych — nie robiona).
2. Ząbek przypomnienia tylko gdy bieżący rząd ma instrukcję (stan nie niesie najbliższego przyszłego).
3. Kolumna dzianiny 72 pt (`cele.plus`) × 252 pt (1,5 × `cele.plusLicznik`) zamiast 64 × 260 z makiety — brak tokenu; kolumna karty „Dziś” 1,5 × `cele.plus` (z p2) — oba do 04.
4. Biegnący stoper: komórka w kolorze `akcent` z czasem (13 pt, 600, cyfry tabelaryczne) — nienarysowane w makiecie [DO USTALENIA 04]. Menu stopera (`licznik-stoper-menu`) to widok absolutny pod komórką w ScrollView — **ryzyko przycięcia na urządzeniu**; wariant: wstawić menu w przepływ pod rzędem.
5. Bez projektu komórka „Stoper” jest widoczna i nieaktywna (dotąd brak ikony).
6. Podpis „rzędy gotowe · teraz rząd N” z makiety nie scalony: jednostka i `licznik-teraz-rzad` osobno (testid.md zapowiada zmianę tekstu asercji; tekst do 04/09).
7. Symbol `flag` dodany do typu `NazwaSymbolu` (wyjątek od zamrożenia p1, tylko typ, jak P-577); dostępność SF `flag` na iOS 18 nie sprawdzona w dokumentacji w dniu pracy [DO USTALENIA].
8. Etykieta ••• „Counter options: name, row number, lock, finish” (testid.md:126 wymienia 3 pozycje; menu ma 6).
9. Arkusz „Historia” bez zmian kodu: `Arkusz`, `Przycisk`, `Tresc` z p1 już na tokenach Dzianiny; makiety arkusza brak (design-spec:56 „wygląd, p3”).
10. Liczba 4+ cyfr: schodki tokenów (104 → 56 → 28 pt), bo `Liczba` nie dopasowuje się do szerokości.
11. Nowe teksty (en, pl) do akceptacji 04/09: `licznik.akcja_*`, `licznik.projekt_wejscie*`, `licznik.menu_wiecej_a11y`, `licznik.dzianina_a11y*` (`en.kontekst.json`); stary klucz `licznik.menu_a11y` nieużywany (do usunięcia w fali 09).
