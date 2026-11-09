# M3 fix E5 — stan roli 08 (2026-11-09, P-614, P-615, P-617)

Gałąź `claude/kopia-08-e5-2026-11-09` od 92611245. Polecenie: warsztat `koordynacja/role-2026-11-09/08-fix-e5.md` @ 43c5745. Testy zastąpione: `m3-fix-e5-zastapione-testy.md`.

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
| 8 | 011 | częściowo: radio jednostek + `checkmark`; pole wyboru 28 czeka na token | 26a5bbb | `m3-fix-e5-wybor.test.tsx` 2 ✕ → ✓ |
| 11 | 014 | zrobione | ddd3eb7, ef9a0bc | `m3-fix-e5-014.test.tsx` 5 ✕ + 1 ✓ (miniatura: ta sama liczba) → 6 ✓ |
| 13 | P-590 | zrobione | ea96dfb | ✕ → ✓ |
| 10 | 010 | zrobione (Projekty; Projekt już 17/700) | a165ff5 | ✕ → ✓ |
| 5 | 004 | zrobione | c4fbd60 | `m3-fix-e5-dzis-ax3.test.tsx` 3 ✕ + 1 ✓ (AX1 bez zmian) → 4 ✓ |
| 7 | 007 + 008 | zrobione (jeden commit: wspólne słowniki) | 2cbd134 | `m3-fix-e5-etykiety.test.tsx` 3 ✕ + 1 ✓ (nazwany projekt bez zmian) → 4 ✓; trasa 007 w `m3-fix-e5-wzor-ax5.test.tsx` ✕ („Back to Counter from Nov 10”) → ✓ |
| 1 | 001 | rozstrzygnięte P-619 (token z makiety), do zrobienia | — | — |
| 6, 9, 12 | 006, 009, 015 | do zrobienia (nowa sesja, P-324) | — | — |

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

## Następny krok (nowa sesja)
001 i pole wyboru 011 wg P-619, potem 006 („Wstecz”: `akcentTekst`, tytuł poprzedniego ekranu, korzenie bez „wstecz”; test 033 jawnie, P-614 (1)), 009 (menu `menu.*`), 015 (kolumna wzoru na iPadzie).
