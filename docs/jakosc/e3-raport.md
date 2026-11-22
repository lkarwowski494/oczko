# E3 Testy akceptacyjne i infrastruktura (rola 07-jakosc, build) · 2026-10-25 · STOP E3
Wejście: E2 przyjęte (P-092). Testy pisane wobec portów i sygnatur; zaślepki rzucają `NIEZAIMPLEMENTOWANE: <ID>` (`src/domena/zaslepka.ts`). Pięć części pisali równolegle pomocnicy z rozłącznymi plikami, szósta domknęła luki; każdą część rola 07 uruchomiła sama przed commitem.

## Wynik (uruchomione, `env -u NODE_PATH` jak w CI)
| Co | Komenda | Wynik |
|---|---|---|
| Testy akceptacyjne | `npm run test:akceptacja` | **980: 974 na znaczniku, 6 `[ZIELONY-OK]`, 0 z złego powodu**, kod 0 ([`e3/akceptacja-wynik.md`](e3/akceptacja-wynik.md)) |
| Pokrycie kryteriów | skrypt po ID w nazwach testów | **201 / 220** z testem; 19 z powodem i kontrolą zastępczą (strategia §9) |
| Główny zestaw | `npm run verify` | kod 0: typecheck, typecheck testów, lint `src/dane`, kontrole repo i workflowów, wektory 02/05, schemat, ADR, i18n, `npm test` 1071/1071 (956 kodu 0.1.0 + 115 narzędzi i kontroli) |
| CI Linux | „Jakość · Linux”, run 40223883481 (d0d96f4) | **zielony** (pierwszy zielony → `verify` jest bramką, zasada 8); runy 1–2 czerwone: różnica środowiska (niżej) |
| CI iOS | „Jakość · iOS”, run 40223597670 (be6c43e) | `build` **zielony** na `macos-26` (prebuild, pody, platforma, `xcodebuild` Release bez podpisu 12,5 min; razem 14,5 min); części E2E 1 i 2 (pakiet podstawowy, 9 scenariuszy) **czerwone z właściwego powodu**: każdy scenariusz pada na `Assertion is false: id: licznik-plus is visible` (aplikacja to jeszcze kod 0.1.0 bez testID z `e2e/README.md`); część 3 bez scenariuszy (plan). Rozruch symulatora 2–3 min; część 1 (5 scenariuszy) 17 min wobec szacunku ok. 10 min z wag — wagi `e2e/czesci.json` zaniżone, odświeżyć po pierwszym zielonym przebiegu. Usterka workflowu: wysyłka artefaktu odrzucona (dwukropek w nazwach katalogów Maestro) → poprawka: wyniki pakowane do `e2e-out.zip` |
| Scenariusze E2E | 32 w `e2e/scenariusze/` (26 kryteriów E2E, pakiet podstawowy 9) | kontrola składni, selektorów i asercji po akcjach w Jest: zielona; na symulatorze: CI macOS |

| Część | Pliki | Testy | Próba „test potrafi przejść / paść” (kopie poza repo) |
|---|---|---|---|
| Zakup i limit | `tests/akceptacja/domena/zakup/` | 133 | na wzorcach 02 (`limit.mjs`, `dostep.mjs`): 106 przechodzi, 27 na znaczniku (funkcji brak we wzorcu); 9 z 10 mutantów przeżywających dziś wektory ginie |
| Licznik, dni, obliczenia, maszyny | `tests/akceptacja/domena/{licznik,dni,obliczenia,maszyny}/` | 622 | na prototypie `scal.mjs`: 20 przechodzi, 6 pada dokładnie na błędach Z07-13 (stos przy 150 000, M-09, złe dane); zamiana przypisania głowa↔wartość wykrywana |
| Dane i przypadki użycia | `tests/akceptacja/dane/` | 92 | z prawdziwym adapterem `node:sqlite`: testy portu i migracji przechodzą (wyrocznie osiągalne) |
| Ekrany (RNTL 13.3.3) | `tests/akceptacja/ekrany/` | 90 | atrapa licznika z etykietą z `design-spec.md` przechodzi; zła etykieta pada na `toHaveAccessibleName` |
| Luki pokrycia | `tests/akceptacja/{domena,dane}/luki/` | 43 | — (nowe sygnatury) |
| Kontrole repo i workflowów | `tests/jakosc/kontrole-repo.test.ts` | 38 (zielone) | mutant w kopii strażnika workflowów zabity przez 2 właściwe testy; pułapka cen wykryła błąd samej kontroli (`\b` po „zł”) |

## Narzędzia i infrastruktura
- `jest.akceptacja.config.js` (DS-02), `scripts/jakosc/akceptacja-raport.mjs` (właściwy powód czerwieni; test 11/11), `jest.fast-check.js` (DS-03/04), `tsconfig.testy.json`.
- `tests/narzedzia/czas.ts` (`przejsciaCzasu`), `strefy.ts` (DS-09, 8 stref), test 8/8; RD-16: 204 przypadki wokół przejść i północy.
- `scripts/jakosc/kontrole-repo.mjs` (OR REPLACE, exclusive, `:memory:`, kopia `.db`, VACUUM w ratunku, `Library/SQLite`, `import SQLite3`, przełączniki testowe, ceny w kodzie, SDK awarii/analityki/reklam, dźwięk, `NSPrivacyTracking`, `expo-updates`, przypięcia, wydane migracje SHA-256), `sprawdz-workflowy.mjs` (sekrety tylko w `environment: testflight`, wyzwalacze, przełączniki testowe w wydaniu), `wyjatki.json` (2 wyjątki nazwane z właścicielem i terminem), `eslint.config.mjs` (DS-12).
- `scripts/ci/e2e-czesci.mjs` + `e2e/czesci.json` (LPT, pakiet podstawowy, `[e2e-pelny]`, bez ponowień `stan-licznika`), interpreter i kontrola scenariuszy `tests/jakosc/maestro-*`, złote pliki TS↔Swift `tests/wspolne/` + `xctest-specyfikacja.md`, kontrakt testID dla 08: `e2e/README.md`.
- Workflowy: `.github/workflows/jakosc-linux.yml`, `jakosc-ios.yml`; skrypty Treningu w `.github/scripts/jakosc/`.

## Znaleziska po drodze
- **CI ≠ lokalnie (zasada 8):** kontener ma globalny `typescript` w `NODE_PATH`; `tests/i18n/sprawdz-i18n.test.ts` przechodził lokalnie, w CI padał (run 40223002065). Poprawka w `scripts/sprawdz-i18n.mjs` (Z07-23); `verify` lokalnie zawsze `env -u NODE_PATH`.
- **Stary `testflight.yml` (0.1.0) narusza ADR-0014** (sekrety bez `environment`); wyjątek nazwany z właścicielem 10 i terminem „przed pierwszym buildem TestFlight nowej wersji”.
- **Stary łańcuch `verify` nie przechodził** (`check:licenses` po nowych zależnościach, `test-matrix` na zarchiwizowanym dokumencie) → zachowany jako `verify:stary`; nowy `verify` z kontroli strategii.
- **Moja pomyłka procesowa:** `git stash -u` przy sprawdzaniu stanu commitów zabrał na chwilę pliki pracującemu pomocnikowi (odtworzone, sprawdzone ponownie); od tej pory stan commitów sprawdzany na `git worktree`.

## Zależne od poprawek innych ról (przed rolą 08, P-090 Q3a, P-091 11a)
Pełna lista: [`zgloszenia.md`](zgloszenia.md), [`e1/zgloszenia-e1.md`](e1/zgloszenia-e1.md). Najważniejsze dla 08:
- **05 (Z07-11–Z07-19, Z07-22):** sygnatury przypadków użycia, danych, ekranów i nowych funkcji domeny to propozycja 07 (nagłówki „Z07-22”); typy portów w `src/przypadki-uzycia/porty-propozycja.ts` do przeniesienia do `src/domena/porty.ts`; brak portów iCloud, udostępniania (EXIF), pobierania strony; `rozmiarUS`/`przelicz` bez „błędu danych”; maszyna synchronizacji bez „niedozwolone”; kontrakt intencji ekranu blokady (Z07-11: test R-018 docelowy); `scal` iteracyjne i M-09.
- **02 (Z07-07–Z07-09):** strona granicy `wygasa = teraz`, `zostalo` u Pro, definicja „ukończonego dnia” (okno P-089), wektor L-19 (P-091 7b), zakup oczekujący, karencja.
- **01 (ER-34–ER-44):** RD-10 i RD-10-W2 (testy już według P-084), BR-DAN-006/S4 według P-091 6a, RD-15 po terminie przy R = 0, RD-17-W6 i RD-12-W4 (ER-40).
- **04 (Z07-05, Z07-10):** stany bez makiety — testy ekranów zapytują tam po roli bez etykiety wzorcowej; teksty przez `t()` zazielenią się, gdy 08 doda klucze (dziś 4 z potrzebnych).

## Pytania na STOP E3
Brak decyzji produktowych w tym etapie. Do potwierdzenia przez koordynatora (P-087): E3 przyjęte i przejście do E4 (przekazanie do 08 z tabelą test → kryterium → plik → kolejność).
