# Partia 8d — rola 08, tryb fix: wzór i Swift (2026-11-01)

Polecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8d.md` (ebe874d, przeczytane w całości). Gałąź: `claude/kopia-partia-8d-2026-11-01` (baza 82d4ed6); na roboczą nie pushuję. Sesja: `session_01T66VByxBFyKxLubA5wx5eH`. Zatwierdzone ID: 07-jakosc-006, 007, 017, 023, 026.

## E0
- Środowisko: Linux, Node v22.23.4, bez Xcode i symulatora; Swift nie kompiluje się (kod + test statyczny/jednostkowy TS; sprawdzenie w przebiegu macOS po integracji; rysik i VoiceOver: urządzenie właściciela, P-226). Zrzutów „przed/po” brak (jak w partii 8).
- Stan wyjściowy: `npx jest --ci` → 277 zestawów / 2851 testów, kod 0 (przed zmianami).
- Kwarantanna: role 01–04 nie dotyczą 08; czytałem `app/`, `src/`, `modules/` jako materiał roli 08.
- P-315: tematy tej partii nie mają analogii w Treningu (brak PDF-owego wzoru i rysika); repo `trening` nie klonowane.
- Klasyfikacja: 007 D (wybór 2A rozstrzygnięty P-330); 023 D; 006 D; 026 P rozstrzygnięte P-327 (a); 017 D (ADR-0031). Żadne nie wymaga wyboru właściciela.
- Kolejność: 007 → 023 → 006 → 026 → 017 (zależność 006 od F-26).

## Zrobione
| ID | Commit | Test czerwony → zielony | Uwagi |
|---|---|---|---|
| 07-jakosc-007 | cc36468 | `tests/domena/wzor/notatki-chipy.test.ts` (3 asercje czerwone na zaślepce), `tests/dane/wzor-notatki-widok.test.ts` (4), `tests/ekrany/wzor-trasa-notatki.test.tsx` (5; trasa `/wzor` z atrapą widoku natywnego tylko na granicy platformy) → zielone | Chip rysuje widok natywny Swift (`WidokWzoru.swift`, `ChipPrzycisk`), arkusz notatki w RN (`src/ekrany/WzorNotatki.tsx`). Test statyczny kontraktu Prop/Events Swift = TS: `tests/adaptery/widok-wzoru-kontrakt.test.ts` (czerwony na starym Swift). verify: 282 zestawy / 2870 testów, kod 0. Nie sprawdzone: wygląd i dotyk chipu na urządzeniu. |

## W toku / do zrobienia
- 023 (F-26): patrz „Stan 023” niżej.
- 006, 026, 017: nie rozpoczęte.

## Stan 023
(uzupełniany w trakcie)

## Otwarte / do koordynatora
- `wzor.notatka_edytuj` = „Edit”: brak w `klucze.json` 04 (spec mówi „Close / tytuł / Edit”); tekst roboczy 08 do akceptacji 04 (precedens 7a12f40).
- Klucz `licznik.jednostka_w_trakcie` z `klucze.json` nie jest w `en.json` — poza moimi ID (zgłoszenie, nie naprawiam).
- Przegląd subagenta ścieżek wrażliwych: dotychczasowe zmiany nie dotykają migracji, kopii, importu, zakupów ani workflowów.
