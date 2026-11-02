# Poprawki z raportu E2 #137 — sesja P (rola 08, tryb fix)

Gałąź `claude/kopia-poprawki-p-2026-11-02` (baza `52d29f8`, integracja 5). Zlecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-poprawki-e2-137.md` (cbbe090), raport 07 `07-jakosc/2026-11-02-e2-137/raport.md` (f8042cb). Stan: 2026-11-02, oba ID zrobione, `env -u NODE_PATH npm run verify` kod 0 (343 zestawy, 3336 testów; baza przed zmianą 340 / 3324, zielona).

| ID | Klasa | Commit | Test czerwony przed → po |
|---|---|---|---|
| E2-137-A1 (scen. 34, S2) | D, realny | `65836e7` | `tests/ekrany/ladowanie-trasy.test.tsx`: 6 czerwonych na kodzie sprzed zmiany (pusty `<View />` bez testID; wyjątek odczytu `baza zajęta` = pusty ekran), 1 strażnik (przekierowanie dla `bledne_dane`) → 7/7; `tests/ekrany/e2e-pomiar-ladowania.test.tsx` 1/1 |
| E2-137-A2 (scen. 07, bramka) | D (utwardzenie), przyczyna niepotwierdzona | `d5bc5b7` | `tests/ekrany/oferty-powrot-z-okna.test.tsx`: 2 czerwone na asercjach (`replace` bez parametru, brak `dismissTo`), 2 strażniki → 4/4 |

## E2-137-A1
- `app/projekty.tsx`, `app/projekt/[id].tsx`: do końca pierwszego odczytu `StanWczytywania` (`src/ekrany/StanWczytywania.tsx`; istniejące `Tresc podpis` jak „Loading plans…”, `Przycisk`, motyw — bez nowego wyglądu). Wyjątek odczytu albo wynik „nie ok” → stan błędu „Couldn’t load this.” + „Try again”. Dla projektu `bledne_dane` (kosz, brak) nadal przekierowuje na listę. Odświeżenie przy ponownym fokusie, które się nie uda, zostawia dane na ekranie.
- Nowe testID (dla scenariuszy 07): `projekty-ladowanie`, `projekty-blad`, `projekty-ponow`, `projekt-ladowanie`, `projekt-blad`, `projekt-ponow`, panel buildu E2E `e2e-pomiar-ladowania` („first data N ms”, czas od zamontowania ekranu projektu do pierwszych danych; `src/kompozycja/e2e/panele.tsx`). Do dopisania przez 07 w `e2e/README.md` (tabela testID; tam nie wolno mi pisać).
- Teksty tylko en: `wspolne.ladowanie` „Loading…”, `wspolne.blad_wczytania` „Couldn’t load this.”, `wspolne.ponow` „Try again” (`docs/lokalizacja/oczekujace.json`, `en.kontekst.json`, pseudo).
- Przyczyna 19 s w scenariuszu 34 (co trzyma kolejkę bazy) **[DO USTALENIA]**: ta zmiana jej nie usuwa, tylko pokazuje stan i da liczbę (panel) w przebiegu 4. R (A3/A4) bada kolejkę.

## E2-137-A2
- Źródło: docs.expo.dev/versions/latest/sdk/router/ (odczyt 2026-11-02): `replace` „Navigates to route without appending to the history”, `back` „Goes back in the navigation history”, `dismissTo` „Dismisses screens until the provided href is reached. If the href is not found, it will instead replace the current screen with the provided `href`”. Kod `node_modules/expo-router/build/global-state/router.js:77-95`: `replace` = `linkTo(..., 'REPLACE')`, `back` = `GO_BACK` w kolejce routingu — na poziomie JS lista zostaje pod ofertami. Dokumentacja **nie rozstrzyga** natywnego stosu po zamianie modalu na modal (react-native-screens 4.26.2); w Jest tego nie odtworzę. Przyczyna pustej planszy z #137 **niepotwierdzona**.
- Zmiana (opcja „zamknięcie jawne”): okno przekazuje `skad=uczciwe-zasady`; oferty z tym parametrem kończą „Not now” przez `router.dismissTo('/projekty')` (wzorzec jak `app/ukonczenie.tsx:53`, `app/usun-wszystko.tsx:32`); bez parametru (licznik, Ustawienia) nadal `back()`.
- Opcje dla koordynatora (P-087): (1) zostawić ten commit — tani, odwracalny, chroni przed brakiem listy w stosie, nie naprawi czysto natywnego problemu prezentacji; (2) odrzucić `d5bc5b7` i czekać na zrzut `opoznienie-lista-po-ofertach` z przebiegu 4 (rekomendacja 07) — zero ryzyka własnego błędu, ale scenariusz 07 w bramce może zostać czerwony; (3) `dismissTo('/projekty')` + `push('/oferty')` zamiast `replace` (opcja b raportu 07) — usuwa modal na modal, ale dwa przejścia modalne pod rząd to inne ryzyko natywne, bez dowodu. **Rekomendacja: 1, a po przebiegu 4 ocena wg zrzutu.**

## Nie sprawdzono
- Zachowanie na iOS (macOS/symulator): A1 i A2 tylko w Jest (RNTL, prawdziwa baza `node:sqlite`); wizualnie stan ładowania/błędu bez zrzutu (brak symulatora w Linuksie).
- `e2e/README.md` (tabela testID) i scenariusze: poza zakresem (07).
