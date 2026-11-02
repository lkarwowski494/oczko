# Poprawki, sesja J (rola 08, tryb fix; 2026-11-02, P-366)

Gałąź: `claude/kopia-poprawki-j-2026-11-02` (kopia integracji 4, 6ef42ca). Polecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-poprawki-3i.md` (prompt roli przeczytany w całości; zadanie sesji J z wiadomości startowej zastępuje sekcję I). Raport 07: `oczko-warsztat` `07-jakosc/2026-11-02-e2-136/raport.md`, sekcja 04, E2-136-A1. Na roboczą nie pushowano. P-315: pytań do właściciela nie było.

## E0
- Linux (kontener), brak Xcode, symulatora i Maestro: przebiegu scenariusza 04 nie uruchomiłem; sprawdzone tylko testy Jest. `npm ci` kod 0.
- Klasyfikacja: E2-136-A1 niewyjaśniona (raport 07), więc najpierw rozstrzygnięcie testem; poprawka kodu tylko, gdyby test był czerwony.

## Wynik 1: test ekranu licznika na prawdziwej bazie (commit 9913936)
`tests/ekrany/licznik-minus-plus-bez-projektu.test.tsx` — `Aplikacja` + `Licznik` (RNTL) + `kompozycjaLicznika` na `node:sqlite`; atrapy tylko na granicy platformy (Live Activity, zegarek, haptyka, sklep). Ścieżki: `src/kompozycja/licznik.ts:285` (`naMinus` bez projektu), `:166-185` (`plusZEkranu`).

| Wariant | Wynik na kodzie bez zmian |
|---|---|
| −1 bez projektu (od 0), potem +1 → 1; po −1 w bazie 0 projektów, po +1 jeden | zielony |
| okno strażnika 6 s (`straznikOknoS`), zegar +7 s między −1 i +1 → 1 | zielony |
| okno 6 s, −1, +1, +1, −1 → 1, bez `baner-serii` | zielony |
| −1 i +1 w jednym tyknięciu → 1 | zielony |
| ekran od nowa po +1 (jak `key={wersja}` w `app/index.tsx`) → 1 | zielony |

Wniosek: **w tej ścieżce nie ma błędu aplikacji**; kodu aplikacji nie zmieniałem. Kontrola, że test coś sprawdza: po usunięciu przypisania `licznikId = n.wartosc.licznikId` w `plusZEkranu` wszystkie 5 czerwone (po 10 s `waitFor`), mutacja cofnięta (`git checkout`).

Czego test nie sprawdza: dostarczenia stuknięcia przez sterownik Maestro/XCUITest i warstwy natywnej (`Pressable` na urządzeniu), ani `app/index.tsx` w całości (router, kontekst); ekran złożony z `Aplikacja` i kompozycji jak w `app/index.tsx`, bez opakowania `uslugi` (licznik próbek i `ustawPlusy`). Hipoteza „maszyna” zostaje najbardziej prawdopodobna (stuknięcie 14,7 s w `maestro.log` wobec 2,9 s w #135), ale potwierdzi ją dopiero przebieg 3 ze zrzutem z wyniku 2.

## Wynik 2: krok kontrolny w scenariuszu 04 (commit 2eb361d)
`e2e/scenariusze/04-br-lic-002-s1-plus-minus-cofnij.yaml`, po pierwszym `licznik-plus` następującym po `licznik-minus`:
1. `takeScreenshot: 04-po-plus-po-minus` — zrzut zaraz po stuknięciu, przed asercją (porażka asercji zostawia inaczej tylko zrzut awarii po 17 s);
2. `assertVisible licznik-wartosc „1”` — bez zmiany; musi być pierwszą asercją po stuknięciu (P-091 9a, `problemyLicznika`; zrzut jest dla reguły przezroczysty — pierwsza wersja z asercją panelu przed wartością była czerwona w `maestro-scenariusze.test.ts`, poprawiona);
3. `assertVisible e2e-pomiar-plus „p95 .* ms, n = 1”` — panel pomiaru buildu E2E pojawia się dopiero, gdy aplikacja przetworzyła +1 (`app/index.tsx`: `dodajRzad` → `ustawPomiar`); stan z aplikacji niezależny od wartości licznika.

Odczyt przebiegu 3 (zapisany też w komentarzu scenariusza): panel jest, licznik bez „1” → błąd aplikacji (odświeżenie ekranu); brak panelu i stuknięcie w `maestro.log` trwające dziesiątki sekund → maszyna; brak panelu przy szybkim stuknięciu → błąd aplikacji (+1 nieprzetworzone).

Test kontraktu `tests/jakosc/e2e-scenariusz-04-kontrola-a1.test.ts` (wzór `e2e-kruchosc-136.test.ts`): 3 z 5 czerwone na scenariuszu sprzed zmiany (nazwa następnego kroku: oczekiwano `takeScreenshot`, jest `assertVisible`), 5 z 5 zielone po.

**Ryzyko nazwane:** asercja panelu (krok 3) to nowe źródło porażki scenariusza 04, jeśli panel nie jest widoczny przy układzie po pierwszym +1 (scenariusz 31 widzi go po 20 stuknięciach na tym samym buildzie, ale nie po jednym). Nie sprawdzone na macOS. Jeśli koordynator woli ostrożniej: usunąć jedną linię i jeden test; zrzut i wartość „1” wystarczą do odczytu (panel widać też w zrzucie i hierarchii porażki).

## Weryfikacja
`env -u NODE_PATH npm run verify` kod 0 (typecheck, typecheck:testy, lint, kontrole, testy): **338 zestawów, 3289 testów** (bez moich dwóch zestawów 336 / 3279). `docs/jakosc/e4/tabela-08.md` regenerowana (266 plików testów, 172 zależne, 0 błędów).
