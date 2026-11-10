# Stan: E2E przewodnika i poprawka listy L (rola 07 build, sesja R, 2026-11-10)

Polecenie: `koordynacja:docs/koordynacja/polecenia/R.md` @ 387882e; prompt roli: `oczko-warsztat:koordynacja/polecenia/R-07-jakosc-build-2026-11-10.md` @ 5b8551a.

## Zrobione
| Zadanie | Wynik | Dowód |
|---|---|---|
| 1. Scenariusze przewodnika | `e2e/scenariusze/69-p-687-przewodnik-z-dzis-pokaz.yaml` (Dziś → „Guide” bez przewijania → krok 1 na górze → `przewodnik-f-cel` → `-pokaz` → licznik z `licznik-cel` → „Back” do przewodnika), `70-p-688-przewodnik-z-ustawien-przeczytane.yaml` („Guide” nad „Help” → rozwinięcie → „Read: 1 of 42” i „…, read” po powrocie, ponownym wejściu i restarcie); README (testID, kryterium), `config.yaml`, wagi w `czesci.json` (szacunek 134/158 s) | commity c1bc262, 41b50d4; testy `maestro-scenariusze`, `e2e-czesci`, `e2e-noc-2026-11-02`: 91/91 |
| Wyjątek KO-029 | 69, 70 dopisane do listy scenariuszy bez pomiaru #140 w `tests/jakosc/e2e-noc-2026-11-02.test.ts:190` | P-696 |
| 2. Kontrole Linux | `npm run jakosc:kontrole` kod 0 (0 błędów); `verify` w pre-push kod 0 (583 zestawy, 7084/7084) | `git push` 41b50d4 |
| 3. Lista L | `docs/wydanie/test-urzadzenia-build3.md:28`: zębatka tylko na „Today” (sprawdzone w 7defd5f: `src/ekrany/Dzis.tsx:183`, `app/(zakladki)/projekty.tsx` bez `naUstawienia`) | `claude/l-test-telefon-2026-11-10` @ ac05d82, verify 7020/7020 |

## Przebieg „Jakość · iOS” (wyzwala koordynator)
Znacznik: jasny `[e2e-pelny]`, ciemny `[e2e-pelny] [e2e-ciemny]` — pełny katalog, bo `jakosc-ios.yml` nie podaje `ONLY` do `scripts/ci/e2e-czesci.mjs` (P-697; znalezisko: wejście jak Trening `tylko_scenariusze`, `e2e-ios.yml:43-46`).

## Otwarte
- 70: wartość wiersza „N of 42” (accessibilityValue bez testID) sprawdzana `optional` + zrzut; 08 doda `wartoscTestID` przed buildem 4 i zmieni asercję na twardą (KO-029). [DO USTALENIA] czy Maestro iOS czyta accessibilityValue.
- Wagi 69–70: szacunek z kroków — odświeżyć z logu pierwszego przebiegu.
- Decyzje do weta: P-696, P-697.

## Następny krok
Po przebiegu iOS: klasyfikacja porażek 69–70 (błąd aplikacji / nieaktualny scenariusz / maszyna) od zrzutu kroku, który padł; poprawki scenariuszy w `e2e/**`.
