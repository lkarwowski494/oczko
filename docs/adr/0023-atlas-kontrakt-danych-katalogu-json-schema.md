# 0023. Atlas technik (1.1): jedno źródło danych katalogu w JSON z ID twierdzeń roli 06, JSON Schema 2020-12 i własny walidator TS bez zależności
Data: 2026-10-26 · Status: **proponowana** (E1; E2: kontrakt w wersji 1 z odpowiedziami na pytania 06, `docs/atlas/kontrakt-krokow.md`) · Rola: 05 (build, atlas 1.1) · Zależy od: P-093 (2), P-095, P-192, P-200, ADR-0017, ADR-0022

## Kontekst i problem
Karty technik i słownik skrótów tworzy rola 06 (twierdzenia ze źródłami, P-017), rysunki liczy silnik (ADR-0022), a te same dane czyta ekran aplikacji i generator strony. Potrzebny jest jeden format z kontrolą przed użyciem, który rola 06 wypełnia bez znajomości silnika (krok = co rysunek pokazuje).

## Czynniki decyzji
- Jedno źródło dla aplikacji i strony (P-093 (2)); brak tekstu w danych poza kluczami `t()` (P-192, ADR-0017).
- Komunikat walidatora z miejscem błędu, żeby 06 (albo generator danych) poprawił dokładnie to pole — wzór Treningu: kontrakt figur, `poseSchema` + walidator, kody błędów ze ścieżką `$.klatki[1].u` (`trening/docs/50-figury-v2.md` §10, `scripts/figures/v2-validate.mjs`; odczyt 2026-10-26).
- Zmiana `package.json` uruchamia CI iOS (rejestr E0); koszt 0 zł.
- Repo publiczne: treść kart do czasu przeglądu w `oczko-warsztat`; w repo tylko schemat i przykłady `[PRZYKŁAD]` (moduł `pakiety-tresci`).

## Rozważane opcje
A. JSON + JSON Schema 2020-12 (plik w repo, generowany z typów TS i sprawdzany) + własny walidator TS: schemat strukturalny + reguły semantyczne (ID, odwołania, słownik faz) + sprawdzenie rysunku (ADR-0022), wynik `{ kod, sciezka, szczegol }`.
B. Walidacja biblioteką JSON Schema (nowa zależność deweloperska) + reguły semantyczne osobno.
C. Same typy TS bez schematu (kontrola tylko w czasie kompilacji).

## Decyzja
Opcja A.
1. **Format:** jeden plik na kartę (`<id>.json`) w katalogu katalogu; pola według `docs/atlas/kontrakt-krokow.md` (wersja 0 → 1 w E2): `id`, `rzemioslo`, `rodzaj`, `klucze {nazwa, podpis, opis_alt}`, `terminy {tag: {skrot, twierdzenie}}`, `twierdzenia [{id, wartosc}]`, `jezyki_gotowe`, `rysunek {rodzina, probka, tlo, operacja}`, `kroki [{faza, petle, wyroznij, kierunek, strzalka, klucz}]`, opcjonalnie `glif {id, origin: "own", rs, ws}`.
2. **Wersja formatu** w manifeście katalogu (`format`, `wersja`, lista plików z SHA-256 — moduł `pakiety-tresci`, ADR-0025); karta nowszego formatu niż obsługiwany jest odrzucona czytelnym błędem, a reszta katalogu działa.
3. **Walidator** (`scripts/atlas/waliduj.mjs`, zbudowany w E2; rysunek wstrzykiwany jako `sprawdzKrok`, żeby moduł kontraktu nie zależał od SVG): kod 0 = poprawne, 1 = błędy, 2 = użycie; kolejność: schemat → semantyka (unikalne ID, klucze `atlas.<id>.*`, `twierdzenie` wskazuje ID z `twierdzenia` albo z rejestru 06, `jezyki_gotowe` ⊆ języki z `terminy`, `origin: "own"`) → rysunek każdego kroku (`sprawdzRysunek`). Ten sam walidator w `verify` i u roli 06.
4. **Schemat** `docs/atlas/katalog.schema.json` generowany z typów (`--schema --write`) i sprawdzany w teście (`--schema --check`), jak `figury-v2-poza.schema.json` w Treningu.
5. **ID twierdzeń** nadaje wyłącznie rola 06 (postać rejestru: `ATL-K-001`, `TRM-EN-006`); karty próbne w repo używają ID z rejestru 06 (E2).

### Konsekwencje
- Dobre: bez zależności i bez zmiany `package.json`; komunikaty po polsku z miejscem błędu; schemat dla 06 i dla zewnętrznego generatora danych (jak pilotaż Treningu).
- Złe: własny walidator strukturalny to kod do utrzymania (mniejszy zakres niż pełny JSON Schema — tylko konstrukcje użyte w schemacie atlasu).
- Od czego zależy: wersja 1 pól po uwagach 06 (sekcja „Pytania 06”).

### Potwierdzenie
- E2: test walidatora — przykład karty przechodzi; dla każdego kodu błędu przypadek negatywny (wzór `tests/figures-v2-contract.test.ts` Treningu); schemat w repo = schemat z typów.
- `node scripts/atlas/waliduj.mjs <katalog>` kod 0 na kartach 06 przed publikacją.

## Opcje: zalety i wady
### A — zalety: zero zależności, komunikaty pod 06, jeden przebieg z testem rysunku · wady: własny kod walidacji struktury.
### B — zalety: pełna zgodność ze standardem schematu · wady: nowa zależność (P-036, `licencje.mjs`, CI iOS przy `package.json`), i tak potrzebne reguły semantyczne i rysunku.
### C — zalety: najmniej kodu · wady: dane 06 nie przechodzą przez kompilator (JSON), brak kontroli przed publikacją strony.
