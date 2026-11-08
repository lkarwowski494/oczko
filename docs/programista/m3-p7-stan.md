# M3 p7: Ustawienia, dane, Oczko Pro (stan partii)

2026-11-08 · rola 08 (build) · gałąź `claude/kopia-08-p7-2026-11-08` (start @ 936a1227, HEAD zgodny) · koordynator session_01T66VBx6UXGtzFfAZDeBpip · polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p7.md` @ 05e3eb2. Decyzje: P-558, P-561, P-563 (11)(12), P-571, P-573 ([DO USTALENIA] BR-DAN-009), P-591. Raport 02: oczko-warsztat `02-monetyzacja/2026-11-08-kafle-pro/02-monetyzacja-2026-11-08.md` (001–004 wdrożone, niżej).

## Stan wyjściowy (ETAP 0)
Linux, Node 22.23.4, bez Xcode/macOS i bez Expo web. `npx jest` na SHA startowym: 517 zestawów, 5385 testów zielone (zgodnie z danymi koordynatora).

## Zrobione (commity `[M3 p7] …`)
1. **Oczko Pro** (zachowanie): `FAMILY_SHARING = true` (P-561); karta z opisem i ilustracją 30 dni; cztery kafle `oferty.kafel_*` (dzień, urządzenia, rodzina, dane) z tekstami P-563 (11)(12); kafel „Dla rodziny” zamiast zdania `oferty.rodzina` (klucz usunięty z en, pl, en.kontekst); ikona kafla 1 własna (`IkonaDnia.tsx`, SVG react-native-svg) ≠ zakładki; plany z ceną w Bree jako największym elementem, znacznik z ptaszkiem; pasek przycisków jak dotąd. Test przed kodem: `m3-p7-oferty.test.tsx` (9 czerwonych z właściwego powodu → zielone).
2. **Po „Usuń wszystkie dane”** (zachowanie): `dismissTo('/')` zamiast `'/projekty'` — „Dziś” w stanie pustym (P-573). Test przed kodem: 2 × czerwone (oczekiwano `/`, było `/projekty`) → zielone.
3. **Ustawienia** (zachowanie wyglądu, ZM-07): lista grupowana (5 grup), ikona SF w kafelku `ikonaTlo`, strzałka tylko przy przejściach, wartości po prawej. Test przed kodem: `m3-p7-ustawienia.test.tsx` (5 czerwonych → zielone). Zachowanie, etykiety VoiceOver i dotychczasowe testID bez zmian.
4. **Struktura:** aliasy ról kolorów (`grafit`, `olowek`, `papier`, `papierGrupa`, `promien.grupa`) → tokeny Dzianiny w 8 plikach ekranów p7 (wartości identyczne).
Pozostałe ekrany partii (stan danych, kosz, język, źródła, zgłoś, konflikt iCloud, uczciwe zasady, ukończenie) nie zmieniły układu: używają komponentów p1 (`Arkusz`, `Przycisk`, `Tresc`) już na tokenach Dzianiny; makiet tych ekranów w design-spec brak.

## Zastąpione testy
`m3-p7-zastapione-testy.md`: `oferty.test.tsx` (zdanie → kafel), `kropka-srodkowa-034.test.ts` (inwentarz „ · ”: Oferty 2 → 1), `usun-wszystko-trasa.test.tsx` (2 asercje `dismissTo`).

## Klucze (P-578)
`oferty.kafel_{dzien,urzadzenia,rodzina,dane}_{tytul,opis}` tylko en i pl; `docs/lokalizacja/oczekujace.json` (klucze + `przetlumaczone_czesciowo` pl), `en.kontekst.json`, prefiks `oferty.kafel_` w `tests/i18n/m3-prefiksy.ts`. Usunięty `oferty.rodzina` z en i pl (w 33 pozostałych słownikach zostaje nieużywany — do sprzątnięcia w fali 09).

## Wynik komend
- `npm run verify` (typecheck, typecheck:testy, lint, `jakosc:kontrole` w tym i18n, `npm test`): **kod 0, 519 zestawów, 5402 testy** (start: 517 / 5385; +2 zestawy, +17 testów nowych). `tabela-08` odświeżona (371 plików testów).
- Przegląd zmiany na ścieżce „czyszczenie danych” (`app/usun-wszystko.tsx`, nowy subagent, tylko diff): „brak uwag” (kolejność kasowania bez zmian; po błędzie kopii/usunięcia brak nawigacji; „Dziś” odświeża się przez `zresetuj()` → `wersja` → `useFocusEffect`).

## Nie sprawdzono
Urządzenie i symulator (brak macOS), zrzuty (brak Expo web), E2E iOS. Do zrzutów u właściciela: Ustawienia 390 jasny/ciemny/AX5; Oczko Pro 390 jasny/ciemny/AX5 (4 kafle, plan Rocznie, stan „czeka”, bez Family Sharing = 3 kafle); „Dziś” po usunięciu danych.

## Skutek dla E2E (e2e/ nie edytowane)
- Scenariusz 51:34 czeka na `licznik-plus|projekty-lista`; po zmianie ekran to „Dziś” → potrzebne `|dzis-karta` (jak w 08:43, które już dopuszcza `dzis-karta`). Bez tego 51 czerwony na iOS.
- Scenariusz 08 bez zmian (dopuszcza `dzis-karta`); potem `otworz-ustawienia` z „Dziś” (zębatka `nav-ustawienia`).
- 36, 66 nie czekają po `potwierdz-usun-wszystko` na ekran listy (grep). testID: żaden nie zmieniony; dodane: `ustawienia-stan-danych`, `-polityka`, `-subskrypcja`, `-grupa`, `*-wiersz`, `oferty-karta`, `oferty-miesiac(-dzien)`, `oferty-kafel-*`, `oferty-ikona-dzien`. Przełącznik `ustawienia-ekran-nie-gasnie` zachował testID.

## Odstępstwa od makiety i zgłoszenia do 04 / 09 / 02
1. Hero Pro: tytuł „Oczko Pro” zostaje w nagłówku `Arkusz` (p1, zamrożony), nie w karcie (jeden „Oczko Pro” dla VoiceOver); w karcie opis + miesiąc. Brak faktury oczek na kafelkach miesiąca (flat `akcent`). Przycisk „Zamknij” to ✕ z `Arkusz`, nie tekst z makiety.
2. Ikona kafla 1: SVG (`IkonaDnia.tsx`) zamiast własnego SF Symbolu w katalogu zasobów — decyzja 08 z opcji z design-spec; kształt z `ikony.js` → `dzien`.
3. Symbole SF wybrane przez 08 (design-spec ich nie nazywa): Pro `sparkles`, subskrypcja `creditcard`, wibracje `iphone.radiowaves.left.and.right`, ekran `sun.max`, jednostki `ruler`, eksport/import `square.and.arrow.up/down`, usuń `trash`, dane `icloud`, pomoc `questionmark.circle`, zgłoś `exclamationmark.bubble`, oceń `star`, polityka `hand.raised`, źródła `book`, język `globe`; kafle `applewatch`, `person.2`, `checkmark.shield`; `checkmark`. Dostępność nazw na iOS 18 nie sprawdzona w dokumentacji w dniu pracy [DO USTALENIA]. Dopisane do typu `NazwaSymbolu` (też `hourglass`, `info.circle` — na razie nieużywane).
4. Brak tokenów: kafelek ikony wiersza (32 pt) i znacznik radio planu (28 pt) — składane z `odstep`; ilustracja miesiąca 30 komórek (5,9% szerokości, AX 9%) bez tokenu.
5. Stany z makiety, których nie wdrożono wizualnie: klepsydra i przerywana rama przycisku „Czeka na zatwierdzenie” (`oferty-czeka`): przycisk wyłączony jak dotąd, bez klepsydry i ramy (`przyciskNieaktywnyRama` istnieje w motywie, komponent `Przycisk` p1 go nie używa — zamrożony) → do 04/p1.
6. Ustawienia: grupa „Dane” bez nagłówka, bez nowych kluczy `ustawienia.*` (opcja: nagłówki grup do 04/09).
7. Pozostałe ekrany partii bez zmiany układu (brak makiet).
8. Pozostałe języki: kafle Pro tylko en/pl; `oferty.rodzina` nieużywany w 33 słownikach; w każdym języku „Family Sharing” z lokalizacji Apple (raport 02, 003) — fala 09.

## Propozycja wpisu do docs/decyzje.md (robi koordynator)
„P-5xx · M3 p7 (rola 08): Oczko Pro = karta z miesiącem dni + 4 kafle P-563 (11)(12), `FAMILY_SHARING = true` (P-561), kafel „Dla rodziny” zamiast zdania `oferty.rodzina`; ikona kafla 1 jako SVG (`IkonaDnia`), nie SF Symbol własny; Ustawienia jako lista grupowana z ikonami (ZM-07, symbole wybrał 08, do akceptacji 04); po „Usuń wszystkie dane” start na „Dziś” (`dismissTo('/')`, BR-DAN-009 / P-573 rozstrzygnięte); scenariusz 51 wymaga `|dzis-karta` w oczekiwaniu po usunięciu. Odrzucone: własny SF Symbol w katalogu zasobów (zmiana natywna, niesprawdzalna bez macOS); powrót na listę projektów.”

