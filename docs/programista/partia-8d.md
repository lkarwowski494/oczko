# Partia 8d — rola 08, tryb fix: wzór i Swift (2026-11-01)

**Część 2 (sesja `session_01T66VByw6mn9ymqSvmxfyiC`, polecenie `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8d2.md` @5943c5b): zrobione 006 (e1c533a) i 026 (90bccf6); zostaje 017 (nowa sesja, P-350). Stan wyjściowy części 2: `npx jest --ci` 284 zestawy / 2885 testów, kod 0 (po `npm ci`; kontener nie miał `node_modules`). Po 026: `npm run verify` kod 0, 288 zestawów / 2905 testów.**

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
| 07-jakosc-023 | ed1d48f | `znacznik-ustawianie.test.ts` (3+1 czerwone na zaślepkach), `wzor-trasa-znacznik.test.tsx` (6, potem +5 czerwone na braku UI i propsów natywnych) → zielone | verify: 285 zestawów / 2885 testów, kod 0. Nowe teksty robocze 08 do akceptacji 04: `wzor.przed_schematem`, `wzor.znacznik_napis`, `wzor.notatka_edytuj`. |
| 07-jakosc-006 | e1c533a | `tests/dane/wzor-miejsce.test.ts` (6 czerwonych na zaślepce `wzor-miejsce.ts`), `tests/ekrany/wzor-trasa-miejsce.test.tsx` (4 z 5 czerwone: pozycja w `dokument`, zapis strony/powiększenia, wyjście z trasy), `tests/ekrany/start-na-wzorze.test.tsx` (S1 czerwony po cofnięciu linii w `app/index.tsx`), kontrakt Swift/TS w `widok-wzoru-kontrakt.test.ts` → zielone | verify kod 0, 287 zestawów / 2899 testów. Dane: `ostatnie_miejsce` = `{ ekran: 'licznik'\|'wzor', id: licznikId, wzor?, strona? (od 0), powiekszenie? (krotność dopasowania do szerokości) }`, parser `src/domena/miejsce.ts`, `zapamietajPozycjeWzoru` / `startNaWzorze` w `wzor-miejsce.ts`, `widokWzoru.miejsce`, `przygotuj` → `cel: 'wzor'`. Swift: pozycja w `dokument` (`startStrona`, `startPowiekszenie`), zdarzenie `onPowiekszenie` (opóźnione 0,4 s, zapis przy tle). Nie sprawdzone: kompilacja Swift, zachowanie PDFKit przy przywracaniu skali, test na urządzeniu. |
| 07-jakosc-026 | 90bccf6 | `uklad-rysik.test.ts` (2 czerwone na zaślepce `poPierwszymRysiku`), `wzor-przegladarka.test.tsx` (iPad: stuknięcie wybranego narzędzia → `brak`, czerwony), `wzor-trasa-rysik.test.tsx` (strażnik trasy) → zielone | verify kod 0, 288 zestawów / 2905 testów. Czysta funkcja `poPierwszymRysiku` (src/domena/rysik.ts); Swift `pierwszyRysik()` wybiera Pen i `pencilOnly` synchronicznie. Brak testu z prawdziwym rysikiem (P-226). Nie sprawdzone: Swift, rysik na iPadzie. |
| 07-jakosc-007 | cc36468 | `tests/domena/wzor/notatki-chipy.test.ts` (3 asercje czerwone na zaślepce), `tests/dane/wzor-notatki-widok.test.ts` (4), `tests/ekrany/wzor-trasa-notatki.test.tsx` (5; trasa `/wzor` z atrapą widoku natywnego tylko na granicy platformy) → zielone | Chip rysuje widok natywny Swift (`WidokWzoru.swift`, `ChipPrzycisk`), arkusz notatki w RN (`src/ekrany/WzorNotatki.tsx`). Test statyczny kontraktu Prop/Events Swift = TS: `tests/adaptery/widok-wzoru-kontrakt.test.ts` (czerwony na starym Swift). verify: 282 zestawy / 2870 testów, kod 0. Nie sprawdzone: wygląd i dotyk chipu na urządzeniu. |

## W toku / do zrobienia
- 017: nie rozpoczęte (nowa sesja; wg `docs/architektura/partia-8-kontrakty.md` §4 i ADR-0031: stan sieci z portu `Siec`, „Web page” bez sieci z komunikatem, Word tylko `.docx`). 006 i 026 zrobione w części 2.
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

## Część 2 — odstępstwa, otwarte, do koordynatora
- **Odstępstwo od `moduly.md:319`** (jak w partii 6): `ostatnie_miejsce` zostaje `{ ekran, id: licznikId, wzor, … }`, nie `{ ekran: 'wzor', id: wzorId }`; `ekran: 'wzor'` ustawia zapis pozycji, `zapamietajLicznik` (wyjście z trasy `/wzor`, cleanup efektu w `app/wzor.tsx`) wraca na `'licznik'`. Zamknięcie aplikacji na wzorze zostawia `'wzor'` → start `router.push('/wzor')`. Do przeglądu 05.
- **Decyzja wykonawcza 08 (006):** powiększenie jako krotność dopasowania do szerokości (1 = dopasowany), nie bezwzględny `scaleFactor`; powód: obrót i inny rozmiar okna. Granica poprawności `POWIEKSZENIE_WZORU_MAKS = 16` (`konfiguracja.ts`, [OCENA 08]). Odrzucone: bezwzględny `scaleFactor`. BR mówi „200%” — zapis 2 = 200% dopasowania.
- **Znalezisko (brzegowe, nie naprawiam):** iPad w wąskim oknie (układ compact, np. Split View) z rysikiem: pierwszy rysik wybiera Pen, ale pasek compact pokazuje tylko zakreślacz i gumkę — wybór Pen niewidoczny. Do 04/koordynatora.
- **Znalezisko (do 04):** `tests/ekrany/wzor-trasa-miejsce.test.tsx` „zdarzenie powiększenia innego wzoru jest pomijane” jest strażnikiem, nie testem czerwonym (zielony od początku — zapis przez zaślepkę nic nie robił).
- Kontener sesji nie miał `node_modules`: `npm ci` (24 s) przed testami. `tabela-08.md` regenerowana po każdym ID (kontrola `verify` wymaga, by każdy plik testów importował plik `src`).
- Przegląd subagenta ścieżek wrażliwych: 006 i 026 nie dotykają migracji, kopii, importu, zakupów ani workflowów (zapis jednej wartości `ustawienie` przez kolejkę `operacjaZapisu`).
