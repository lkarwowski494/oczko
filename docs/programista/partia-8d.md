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
| 07-jakosc-023 | (ten commit — sprawdź `git log`) | `znacznik-ustawianie.test.ts` (3+1 czerwone na zaślepkach), `wzor-trasa-znacznik.test.tsx` (6, potem +5 czerwone na braku UI i propsów natywnych) → zielone | verify: 285 zestawów / 2885 testów, kod 0. Nowe teksty robocze 08 do akceptacji 04: `wzor.przed_schematem`, `wzor.znacznik_napis`, `wzor.notatka_edytuj`. |
| 07-jakosc-007 | cc36468 | `tests/domena/wzor/notatki-chipy.test.ts` (3 asercje czerwone na zaślepce), `tests/dane/wzor-notatki-widok.test.ts` (4), `tests/ekrany/wzor-trasa-notatki.test.tsx` (5; trasa `/wzor` z atrapą widoku natywnego tylko na granicy platformy) → zielone | Chip rysuje widok natywny Swift (`WidokWzoru.swift`, `ChipPrzycisk`), arkusz notatki w RN (`src/ekrany/WzorNotatki.tsx`). Test statyczny kontraktu Prop/Events Swift = TS: `tests/adaptery/widok-wzoru-kontrakt.test.ts` (czerwony na starym Swift). verify: 282 zestawy / 2870 testów, kod 0. Nie sprawdzone: wygląd i dotyk chipu na urządzeniu. |

## W toku / do zrobienia
- 006, 026, 017: nie rozpoczęte (nowa sesja, kolejność 006 → 026 → 017; 006 zależy od F-26, który jest zrobiony).
- Wskazówki dla następnej sesji: trasa `/wzor` ma gotowy sposób testowania (atrapa widoku natywnego tylko na granicy platformy): `tests/ekrany/wzor-trasa-znacznik.test.tsx` (harness `start()`); 006 = zapis strony i powiększenia (BR-PRJ-011 S1) — widok natywny zgłasza `onStrona`, powiększenia nie zgłasza (nowy prop/zdarzenie Swift + `ostatnie_miejsce` w ustawieniach, zob. `zapamietajWzor`); 026 = `src/domena/rysik.ts` (`politykaPlotna`, `poDotyku`) + `WzorPrzegladarka.tsx` (narzędzie odznaczalne na iPadzie, wiersz `onPress` w `narzedzie()`); 017 wg `docs/architektura/partia-8-kontrakty.md` §4 i ADR-0031.
- Limity plików: `src/ekrany/WzorPrzegladarka.tsx` ma 20180 B (limit 20480, `granice.mjs`) — nowy kod ekranu wzoru idzie do osobnych plików (`WzorNotatki.tsx`, `WzorZnacznik.tsx`, `WzorMenu.tsx`).

## Stan 023 (F-26) — zrobione S1–S4 i reszta, bez weryfikacji na urządzeniu
| Element | Gdzie | Test |
|---|---|---|
| Znacznik przytrzymaniem w rząd (także pierwszy, z pytaniem o kierunek 3a; pas wyśrodkowany na palcu; S2 rząd w robocie) | `app/wzor.tsx` (`onStukniecie`), `gornaKrawedzRzedu` | `wzor-trasa-znacznik.test.tsx` S2; `znacznik-ustawianie.test.ts` |
| Przeniesienie pasa zachowuje rząd (S3), „Mark row” też | `rzadPoPrzeniesieniu` | S3 przeniesienie |
| Krokowiec rzędu schematu (S3), kierunek + „Change”, „Done”; kroki w kolejce (szybkie stuknięcia się nie gubią) | `WzorZnacznik.tsx` (`PasekZnacznika`), `kolejkaKrokow` w trasie | S3 „Mark row” z krokowcem (licznik 3 → rząd 1 → +2 → rząd 3) |
| Przed schematem (S4): znacznik na rzędzie 1 + „Before the pattern” | `wzor.przed_schematem` (tekst roboczy 08) | S4 |
| Koniec strony: komunikat dół/góra, „Place on page n”, ostatnia strona „past the end” + „Move marker” | `PasekZnacznika`, `gornaKrawedzNaNastepnejStronie` | 2 testy końca strony |
| Wysokość rzędu i przeciąganie pasa (uchwyt), napis zakładki „Row n ↑”, przerywana krawędź końca strony | Swift `WidokWzoru.swift` (`PasZnacznika`, `przesunPas`, `zmienWysokosc`), zdarzenie `onZnacznik` | trasa: `onZnacznik` zapisuje y i wysokość; Swift niesprawdzony (brak kompilatora) |
| Akcje VoiceOver: zwiększ/zmniejsz o rząd, „Move to next page” | Swift `accessibilityIncrement/Decrement`, `UIAccessibilityCustomAction`; JS `krokZnacznika` | `znacznik-ustawianie.test.ts`, trasa `onZnacznikKrok`, `onNastepnaStrona` |
| Kontrakt Prop/Events Swift = TS | `tests/adaptery/widok-wzoru-kontrakt.test.ts` | statyczny |
Do sprawdzenia w przebiegu macOS (kompilacja Swift) i na urządzeniu właściciela (P-226): przeciąganie pasa i uchwytu, dotyk tylko na zakładce i uchwycie (reszta pasa przepuszcza dotyk), VoiceOver (adjustable, custom action), wygląd chipu notatki i krawędzi przerywanej. Zrzutów „przed/po” brak (brak symulatora).

## Otwarte / do koordynatora
- `wzor.notatka_edytuj` = „Edit”: brak w `klucze.json` 04 (spec mówi „Close / tytuł / Edit”); tekst roboczy 08 do akceptacji 04 (precedens 7a12f40).
- Klucz `licznik.jednostka_w_trakcie` z `klucze.json` nie jest w `en.json` — poza moimi ID (zgłoszenie, nie naprawiam).
- Nowe teksty robocze 08 (brak w `klucze.json` 04, konteksty w `en.kontekst.json`): `wzor.notatka_edytuj` „Edit”, `wzor.przed_schematem` „Before the pattern”, `wzor.znacznik_napis` „Row {{n}}” — do akceptacji 04.
- Przegląd subagenta ścieżek wrażliwych: dotychczasowe zmiany nie dotykają migracji, kopii, importu, zakupów ani workflowów.
