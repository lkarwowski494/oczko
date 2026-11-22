# Złote pliki kontraktu TS ↔ Swift (`tests/wspolne/`)

Stan: rola 07, E3, 2026-10-25; **zatwierdzone przez rolę 05** w sesji fix 2026-10-25 (Z07-11, Z07-12; ADR-0008 „Uzupełnienie”): format dziennika i reguły odczytu bez zmian; zgodność wersji przez nazwę pliku `dziennik-plus-v2.jsonl` zamiast pola wersji w linii (ADR-0008 (4)). Źródło typów: `docs/architektura/moduly.md` (`ZdarzenieWejsciowe`, `StanEkranuBlokady`, `StanZegarka`), format dziennika: ADR-0008, stan zegarka: ADR-0009, cele natywne: ADR-0007.

## Wersja 2 stanu (08 partia 3, 2026-10-26; P-111 (3), P-129 Q7a)
`wersja_kontraktu: 3` (08 partia 4, N1): typy `StanEkranuBlokady` i `StanZegarka` (jeden ładunek) mają pola wersji 2 (`wersja`, `znaczenie`, `ostatniPlusMs`, `pro`, `proWaznoscDo`, `dniWMiesiacu`, `przypomnienia`) i na końcu `zablokowany` (wersja 3; pliki wersji 2: `stan-*-v2.json`); pliki `stan-*.json` tworzy generator `generator-stanow.ts` z kodu TS (`stanEkranuBlokady`; aktualizacja: `UPDATE_STANY=1 npx jest tests/domena/stan-ekranu.test.ts`), a test pilnuje zgodności. Pliki wersji 1: `stan-*-v1.json`. Strona Swift: `modules/oczko-reguly` (`swift test`).

## Kontrakt
- **Te same pliki czyta Jest i XCTest.** Jest: `tests/jakosc/zlote-pliki.test.ts` (główny zestaw, `npm test`). XCTest: cele Swift po `expo prebuild` (`modules/oczko-dziennik-plus`, `targets/widget`, `targets/watch`) według `xctest-specyfikacja.md`. Kodu Swift jeszcze nie ma (brak celów natywnych) — strona Swift to zadanie roli 08 w zadaniu `xctest` workflowu `jakosc-ios.yml` (strategia §5).
- **Zmiana pliku = zmiana kontraktu roli 05.** Pliku nie poprawia się, żeby test przeszedł. Nowe pole w typie: najpierw `moduly.md` (05), potem pliki i `wzorce.json`, potem kod TS i Swift w jednym commicie. Test Jest czyta typy wprost z `moduly.md`, więc zmiana typu bez zmiany plików czerwieni główny zestaw.
- **Liczność:** `wzorce.json` wymienia każdy plik dokładnie raz. Obie strony raportują „wykonano N z N” i padają, gdy N = 0 albo gdy plik katalogu nie ma wpisu (R-032: `try?` nie może pominąć pliku po cichu).
- **Wersja kontraktu:** `wzorce.json` → `wersja_kontraktu` (dziś 1). Zmiana niezgodna wstecz (usunięcie albo zmiana typu pola) podnosi wersję i zostawia pliki wersji poprzedniej jako `*-v<N>.*` (zgodność vN ↔ vN+1 przy żywej Live Activity i zegarku w innej wersji, R-024, R-034).
- Dane są syntetyczne (strategia §4): UUID v4 wymyślone, urządzenie `urzadzenie-e2e-telefon-01`, bez danych osobowych.

## Pliki
| Plik | Typ | Co sprawdza | Oczekiwanie (wzorce.json) |
|---|---|---|---|
| `dziennik-plus-poprawny.jsonl` | `ZdarzenieWejsciowe` na linię | 3 × `plus` i `minus` z ekranu blokady, łańcuch rodziców (każde kolejne wskazuje poprzednie własne id — propozycja Z07-11 (1), M-10), przejście przez północ Europe/Warsaw (`dzien` = data zdarzenia), obie wartości `pro` (linia 3: `true` — stuknięcie z Pro, P-111 (2); F07-12, P-125) | 4 przyjęte, 0 odrzuconych, skrócenie do ostatniego id |
| `dziennik-plus-ucieta-linia.jsonl` | jw. | przerwany zapis: ostatnia linia ucięta, bez `\n` (ADR-0008 „Potwierdzenie”, R-023) | 2 przyjęte, linia 3 odrzucona i zgłoszona, skrócenie do ostatniej przyjętej |
| `dziennik-plus-nieznane-pole.jsonl` | jw. | linia z wersji N+1 z polami `wersja`, `znaczenie` (Z07-11 (4), R-024) | przyjęta, nieznane pola pominięte (zatwierdzone przez 05: ADR-0008 (4)) |
| `stan-ekranu-blokady-typowy.json` | `StanEkranuBlokady` | liczenie w toku, stoper sesji | zgodny ściśle z typem, < 4096 B |
| `stan-ekranu-blokady-limit.json` | `StanEkranuBlokady` | `dzienDozwolony: false` (intencja nie dopisuje +1), `glowa: null`, `sesjaStartMs: null` | jw. |
| `stan-ekranu-blokady-najwiekszy.json` | `StanEkranuBlokady` | nazwa 320 znaków CJK (3 B w UTF-8), wartość 150 000 (R-028) | < 4096 B |
| `stan-zegarka-typowy.json` | `StanZegarka` | wersja darmowa, 3 dni w miesiącu | zgodny ściśle z typem, < 4096 B |
| `stan-zegarka-pro-dozywotni.json` | `StanZegarka` | `pro: true`, `proWaznoscDo: null` = bez końca, NIE „wygasło” (R-031) | jw. |
| `stan-zegarka-pro-subskrypcja.json` | `StanZegarka` | `proWaznoscDo` = 2026-12-31T23:59:59Z | jw. |
| `stan-zegarka-najwiekszy.json` | `StanZegarka` | nazwa 320 znaków CJK, 30 dni w miesiącu | < 4096 B |

## Reguły odczytu dziennika (wzorzec w teście Jest, `czytajDziennik`)
1. Linia = jeden obiekt JSON zakończony `\n` (UTF-8, bez BOM). Pusty plik = 0 linii, nic do scalenia.
2. Linia, której nie da się odczytać albo która nie spełnia typu (brak pola, zły typ, `rodzaj`/`zrodlo` spoza literałów), jest pomijana i zgłaszana w diagnostyce (`blad`); pozostałe linie są przyjmowane (propozycja Z07-11 (3): zatruta linia nie cofa całej partii).
3. Ucięta może być tylko ostatnia linia (przerwany zapis); wtedy nie ma po niej `\n`. Pisarz zaczyna kolejną linię od `\n`, gdy plik niepusty nie kończy się `\n` (ADR-0008 (8A)); linia sklejona z uciętą daje zdarzenie z reszty od najmniejszego `{` na pozycji k > 0 (8R). Wektory: `wzorce.json` → `dopisanie`, `sklejenie`, `skrocenie` (P-124).
4. Pola spoza typu są pomijane (zgodność wersji N+1 → N).
5. `skroc(doId)` po `COMMIT` scalenia, do ostatniego **przyjętego** id (R-022), razem z uciętym ogonem bez `\n` za nim (ADR-0008 (8S)); niepusty plik z 0 przyjętych linii = błąd bez skracania (R-024) — kolejny zapis i tak nie skleja się z ogonem (8A).

## [DO USTALENIA] (do sesji fix roli 05)
- Z07-12: typy stanów nie mają pól `dni`, `ostatniPlus`, `znaczenie`, planu przypomnień ani `wersja` ładunku — po dopisaniu w `moduly.md` pliki stanów trzeba uzupełnić (test Jest zaczerwieni się sam, bo czyta typy z `moduly.md`).
- Maksymalna długość nazwy projektu (najgorszy przypadek rozmiaru stanu); dziś 320 znaków CJK to założenie 07.
- Czy zegarek dostaje `ZdarzenieWejsciowe` z `zrodlo: 'zegarek'` tym samym formatem (ADR-0009 `transferUserInfo`) — wtedy dochodzi `dziennik-zegarek-*.json`.
- Generator złotego `stan-*.json` z kodu TS (Z07-12, jak generator tekstów Swift ADR-0017) — dziś pliki są ręczne, a test pilnuje ich zgodności z typem.
