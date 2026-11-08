# M3 p2 „Dziś” + zakładki — stan partii (rola 08, build) · 2026-11-08

Gałąź `claude/kopia-08-p2-2026-11-08` od 96fb5c2c (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p2.md` @ a502c03.

## Stan wyjściowy
`npm run test:akceptacja`: 8 testów, 8 × asercja (czerwone z właściwego powodu, jak w `docs/jakosc/e2e-dzis/stan-2026-11-08.md`).

## Zrobione (commity `[M3 p2] …`)
cf4057a trasy zakładek do `app/(zakladki)/` (struktura) · 37a1ab1 „Dziś”, zakładki, licznik na `/licznik` (zachowanie; 8 testów 07 zielone i przeniesione) · 8d90ef7 wyjątek nazwany i18n do fali 09 (do akceptacji koordynatora) · 23b7bd6 `miejsce-pracy.ts` (limit 20 KB), tabela-08.
Wykaz zastąpionych i przeniesionych testów: `m3-p2-zastapione-testy.md`.

## Architektura (do wpisu decyzji)
- Korzeń: Stack; `app/(zakladki)/_layout.tsx` = expo-router `Tabs` (JS, bez nowej zależności; `backBehavior="history"`); „Dziś” = `app/(zakladki)/index.tsx` (start danych, awaria, import 206, kamień, cykl życia w `Aplikacja`); licznik = `app/licznik.tsx` (`EkranLicznika`, bez zakładek).
- „+1” karty: ten sam `naPlus` → `uslugi.dodajRzad`, ten sam `skutekPlus` i `ArkuszLimitu` (test `tests/ekrany/dzis-rownowaznosc-plus.test.tsx`).
- Kompozycja: `przygotuj()` → `{ cel: 'dzis', miejsce }`, `miejsce()`, `poScaleniu()` (licznik nad „Dziś” odświeża się po scaleniu dziennika; scala tylko korzeń).
- Blokada wygaszania: tylko z `/licznik` albo `/wzor` na wierzchu; na samym „Dziś” ekran gaśnie [DO USTALENIA 01/04].

## Dowody
`npm run verify` kod 0: 511 zestawów, 5327 testów; `jakosc:kontrole` w verify kod 0; typecheck, typecheck:testy, lint kod 0.

## Nie sprawdzono
Urządzenie i symulator (brak macOS): wygląd, zakładki natywnie, haptyka, VoiceOver, AX5; zrzuty (brak Expo web — `react-native-web` niezainstalowany); E2E iOS `[e2e-pelny] [e2e-ciemny]` — uruchamia koordynator po scaleniu.

## Otwarte
1. SymbolSf (zamrożony) bez symboli zakładek/kafli z design-spec:48 — zastępcze: Dziś `calendar`, Projekty `bookmark`, Historia `clock.arrow.circlepath`, kafle `plus`/`doc.text`/`pencil.tip`/`ruler` (zgłoszenie do koordynatora, opcja (a): dopisać nazwy do unii typu).
2. Odstępstwa od makiety do 04: przecinek zamiast „ · ” w podpisie karty (test 034); skrót dnia z Intl („czw.”); dzień dziergany jako kwadrat w kolorze `akcent` bez faktury oczek; „co dalej” bez pogrubienia nazwy (tekst przez jeden klucz); kolumna dzianiny 1,5 × `cele.plus` (brak tokenu); „Back” zostaje na zakładkach Narzędzia i Historia (e2e 16, M1-016).
3. Kafel „Dodaj wzór” prowadzi do miejsca pracy (jak „Kontynuuj ›”) [DO USTALENIA 04/p3b]; „Włóczka i druty” → zakładka Narzędzia.
4. Nowe teksty (en, pl) do akceptacji 04/09: klucze `dzis.*`, `zakladki.*` (`src/i18n/slowniki/en.kontekst.json`).
