# M3 fix E5 — stan roli 08 (2026-11-09, P-614, P-615, P-617)

Gałąź `claude/kopia-08-e5-2026-11-09` od 92611245; część 2 (08b) `claude/kopia-08b-e5-2026-11-09` od f953aef9, polecenie warsztat `koordynacja/role-2026-11-09/08b-fix-e5.md` @ b43c03f. Polecenie: warsztat `koordynacja/role-2026-11-09/08-fix-e5.md` @ 43c5745. Testy zastąpione: `m3-fix-e5-zastapione-testy.md`.

## Pozycje `zadania-08.md`
| # | ID | Stan | Commit | Test (przed → po) |
|---|---|---|---|---|
| 5a, 14 | 016 + LIC-04 | zrobione | b55c3ed | `m3-fix-e5-licznik.test.tsx` 6 ✕ → 7 ✓ (strefa absolute + onLayout → paddingBottom = h + l; od AX3 liczba pierwsza, tytuł 2 wiersze, bez dzianiny) |
| 15 | 07-p3 a11y | zrobione | 4e6acb7 | `licznik-notatka` etykieta = treść: ✕ → ✓ |
| 16 | 07-p3 AX5 | zrobione | 498198e, dd90142 | `m3-fix-e5-wzor-ax5.test.tsx` ✕ → ✓ (ScrollView wokół `GrupaWzorow`) |
| 17 | P-617 A | zrobione (gest); powrót „0 zamiast 1” nieodtworzony w Jest | 55d7742, 1b75109 | `narzedzia-wstecz-trasa.test.tsx` „P-617 A” ✕ → ✓; `m3-fix-e5-dzis-powrot.test.tsx` zielony przed i po (warstwa JS odświeża) |
| 3 | 003 | zrobione | 9a3d67b | `m3-fix-e5-skala.test.tsx` 003: 2 ✕ → ✓ |
| 4 | 005 | zrobione | 9ad31c7, c2a709e | 005: 6 ✕ → ✓ |
| 8 | 012, 013 | zrobione | fe2179b, c314191 | `m3-fix-e5-cele.test.tsx` ✕ → ✓ |
| 8 | 011 | zrobione: radio jednostek + `checkmark` (26a5bbb); pole wyboru `PoleWyboru` 28 + `promienie.pole` zastępczo (P-619 B) | 26a5bbb, de45630 | `m3-fix-e5-wybor.test.tsx` 2 ✕ → ✓; pole: 4 ✕ → 6 ✓ |
| 11 | 014 | zrobione | ddd3eb7, ef9a0bc | `m3-fix-e5-014.test.tsx` 5 ✕ + 1 ✓ (miniatura: ta sama liczba) → 6 ✓ |
| 13 | P-590 | zrobione | ea96dfb | ✕ → ✓ |
| 10 | 010 | zrobione (Projekty; Projekt już 17/700) | a165ff5 | ✕ → ✓ |
| 5 | 004 | zrobione | c4fbd60 | `m3-fix-e5-dzis-ax3.test.tsx` 3 ✕ + 1 ✓ (AX1 bez zmian) → 4 ✓ |
| 7 | 007 + 008 | zrobione (jeden commit: wspólne słowniki) | 2cbd134 | `m3-fix-e5-etykiety.test.tsx` 3 ✕ + 1 ✓ (nazwany projekt bez zmian) → 4 ✓; trasa 007 w `m3-fix-e5-wzor-ax5.test.tsx` ✕ („Back to Counter from Nov 10”) → ✓ |
| 1 | 001 | zrobione (token `dzianina.tloKolumnyKarty` w obu plikach, P-619; nabranie 8, igła z główką, marginesy 6 na karcie) | dac17ae (struktura: `DzisStyl.ts`), 56dcf4c | `m3-fix-e5-001.test.tsx` 4 ✕ + 1 ✓ → 5 ✓ |
| 12 | 015 | zrobione (iPad regular: obok tylko ≥ 1000 pt i szersze niż wyższe, kolumna 280, liczba `liczbaKarty` + „of {cel}”, −1 72 obok „+1” 168–240; pasek „+1” ≤ 480, zestaw wyśrodkowany); przypomnienie w kolumnie — nie zrobione | 161f6a8 | `m3-fix-e5-015.test.tsx` 5 ✕ + 3 ✓ → 8 ✓ |
| 9, 6 | 009, 006 | do zrobienia (termin 70 min sesji 08b minął) | — | — |

## STOP-y rozstrzygnięte przez koordynatora (P-619, 9.11 06:17) — do wykonania w nowej sesji
- 001: 08 dopisuje token `dzianina.tloKolumnyKarty` = #00000026 (źródło `docs/design/dzianina/ekrany.html:38` `.dz`, oba motywy) w `dzianina/tokeny.json` i `docs/design/tokeny.json` z adnotacją „wartość z makiety, P-619” (wyjątek nazwany); kontrast.mjs kod 0; 001 w całości.
- 011 pole wyboru: wariant B — `znaczniki.radio` (28) + `promienie.pole` jako zastępcze, adnotacja w kodzie i tu; 04 oceni przy reaudycie.
- Dla 04: rozbieżność nazwy — `cele._plusAx5` pisze „AX3 (accessibilityMedium)”; accessibilityMedium to AX1 (RN 1,786), AX3 = accessibilityExtraLarge 2,643 (`RCTAccessibilityManager.mm:269`). Kod: `PROG_AX3 = 2.643` (przyjęte, P-619).

## Nowe klucze (en, pl; 33 języki falą 09 — `docs/lokalizacja/oczekujace.json`, `przetlumaczone_czesciowo: pl`)
`wzor.wstecz_licznik` („Back to counter” / „Wróć do licznika”), `licznik.dzianina_a11y_przyp`, `licznik.dzianina_a11y_cel_przyp`, `dzis.dzianina_a11y_przyp`, `dzis.dzianina_a11y_cel_przyp` (en: „…, next {{przypomnienie}} at row {{n}}”; pl: „…, następne: {{przypomnienie}} w rzędzie {{n}}”). Teksty pl i en napisane przez 08 według wzoru istniejących kluczy — do akceptacji 04/09.

## Odstępstwa i uwagi
- Limit rozmiaru pliku 20 KB (`granice.mjs`): `WzorPrzegladarka.tsx` 20 450 B, `Dzis.tsx` 20 192 B, `app/wzor.tsx` 20 459 B — następna zmiana w tych plikach wymaga wydzielenia (np. menu/arkusze do osobnego pliku).
- P-590: przy dniu dzierganym, który jest też „dziś”, obwódka `tekst` (dziś) zastępuje `akcentTekst` — makieta ma obrys na zewnątrz (`outline-offset`), RN tego nie ma.
- 012: rama przerywana także przy AX (padding jak rama biegnącego stopera).
- Czego nie sprawdzono: układ na urządzeniu (strefa licznika, AX3+ karta i licznik, gest wstecz, iPad) — potwierdzi przebieg 4 iOS (E2E 03, 30, 34, 49, 57, 44).

## Część 2 (08b, 9.11) — odstępstwa i uwagi
- 015 zakres: reguła ≥ 1000 pt tylko dla klasy regular (iPad); telefon poziomo (compact) zostaje „obok” (W3) — odczyt 08 „015 = iPad”, do potwierdzenia przez koordynatora (opcja B: reguła globalna, telefon poziomo → pasek).
- 015: przypomnienie w kolumnie iPada (makieta `.nota`) nie zrobione — brak danych przypomnienia w propsach paska; wymaga przekazania z `app/wzor.tsx`.
- `app/wzor.tsx` 20 478 B (limit 20 480): dopisane 19 B (`cel: lw.czesc.cel`) bez wcześniejszego wydzielenia — odstępstwo od polecenia (termin); następna zmiana wymaga wydzielenia.
- 001: tło nakładki #00000026 nie ma pary w `kontrast-pary.json` (element graficzny, nie tekst); kontrast.mjs kod 0, 256/256. Licznik bez marginesu 6 (makieta też rysuje x=6 na liczniku) — poza zakresem 001, do oceny 04.
- 001: miniatura listy bez główki igły (`glowka={false}`), jak makieta `.lista .pr`.
- Czego nie sprawdzono: wygląd na urządzeniu i zrzuty przed/po (brak symulatora; przebieg 4 iOS: E2E `dzis-pierwszy`, 44 poziomo).

## Następny krok (nowa sesja)
009 (menu = lista grupowana `menu.*`, pozycje 44, bez obrysów), potem 006 („wstecz” chevron + tytuł poprzedniego ekranu, `akcentTekst`, bez „wstecz” na korzeniach zakładek; test 033 jawnie, P-614 (1)); `WzorPrzegladarka.tsx` (20 429 B) i `app/wzor.tsx` (20 478 B) — najpierw wydzielić.
