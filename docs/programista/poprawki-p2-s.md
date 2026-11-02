# Poprawki P2, sesja S (rola 08, tryb fix; 2026-11-02)

Polecenie: `oczko-warsztat` 6d78e83 `koordynacja/role-2026-11-01/08-poprawki-p2-s.md`. Baza: integracja 5 (e72cd04). Decyzje: P-373 (P2-5b wariant B), P-374 (P2-3 wariant A, osobna gałąź).

## Stan
| ID | Gałąź | Stan |
|---|---|---|
| P2-5b | `claude/kopia-poprawki-s-2026-11-02` (7af6e4c) | zrobione: `WzorLicznik.tsx` — w trybie „rząd w trakcie” podpis `licznik.jednostka_w_trakcie` („current row”, testID `licznik-podpis`) w pasku pod wzorem i w kolumnie obok; „skończone” bez zmian. `wzor-przegladarka.test.tsx` „P2-5b”: 2 czerwone (brak `licznik-podpis`) → zielone. verify kod 0: 348 zestawów, 3374 testy. |
| P2-3 | `claude/kopia-poprawki-s2-2026-11-02` (od P2-5b) | zrobione w kodzie, **verify kod 1 tylko przez `ZALEZNOSC-BEZ-ADR`** (brak wiersza ADR-0016 dla `expo-symbols`; wpis robi 05 wg polecenia). Reszta: typecheck, typecheck:testy, lint, `jakosc:kontrole` bez `kontrole-repo.mjs` — kod 0; `npm test` kod 0: 349 zestawów, 3382 testy. |

## P2-3: co zmieniono
- `expo-symbols ~57.0.3` w `package.json` i lock (wersja z `bundledNativeModules` SDK 57; ten pakiet był już przechodnio w lock jako zależność `expo-router`, `package-lock.json` ok. :6017, więc jest w buildzie; teraz jawny).
- `src/ekrany/SymbolSf.tsx`: `SymbolSf` (kontur, `type="monochrome"`, dekoracyjny: `accessible={false}`, ukryty przed VoiceOver; etykiety przycisków bez zmian). Rozmiar rośnie z ustawieniem tekstu do limitu glifu, który zastępuje (ikona ×1,8, kapsuła ×1,6). `motyw.ts`: `ROZMIAR_SYMBOLU` (rozmiar instrukcji z tokenów), `ROZMIAR_SYMBOLU_KAPSULY` (17 pt, jak etykieta kapsuły) — bez nowych tokenów.
- Nazwy ze spec: `highlighter`, `pencil.tip` (Pen), `note.text.badge.plus` (Add note), `eraser`, `arrow.uturn.backward` (`WzorPrzegladarka.tsx`); `stopwatch` (ikona i kapsuła trwa), `pause.fill` (kapsuła wstrzymana, waga 700 = jak czas) (`Stoper.tsx`); `note.text` (chip notatki, `WidokWzoru.swift`, UIImage 14 pt).
- Min. iOS aplikacji 18.0 (`app.json:26`): `eraser` (iOS 16) bez zastępnika `delete.left`.
- Testy: `tests/ekrany/symbole-sf.test.tsx` (7: nazwy w każdym przycisku iPhone/iPad/stoper — czerwone, bo brak symboli; skala ×1,8/×1,6; grep-test „brak ⏱ ⏸ 🖍 ✎ ⌫ ↶ w src/, app/, modules/” czerwony na trafieniach w WzorPrzegladarka.tsx, Stoper.tsx i komentarzu OczkoWzorModule.swift); `widok-wzoru-kontrakt.test.ts` (chip, statyczny, czerwony → zielony). Zmienione istniejące testy (struktura kapsuły: symbol osobno, czas w własnym `Text`): `stoper-kapsula-rozmiar.test.tsx` (te same asercje 17 pt, 700, tabular-nums, ×1,6 — teraz na `'1:05'`/`'10:00'`), `stoper.test.tsx` P-287 (limit skali ikony przeniesiony do testu skali symbolu).
- Swift (`WidokWzoru.swift`) **nieskompilowany w Linuksie** — sprawdzi CI macOS; ryzyko: odstęp symbol–tekst chipu (`imageEdgeInsets`/`titleEdgeInsets`, prawy margines +4 pt) do obejrzenia na zrzucie.
- Zrzuty przed/po: niewykonane (Linux, bez symulatora). Wzorcowy zrzut symboli = przebieg po wdrożeniu (SP-13 przez 07, jak w raporcie 04).

## Propozycja wiersza ADR-0016 (do wpisania przez 05; 08 nie edytuje ADR)
`expo-symbols` ~57.0.3 (08 sesja S, 2026-11-02, P-374 wariant A: wersja z `bundledNativeModules` SDK 57, wydana 2026-09-11 — 52 dni, ≥ 14 dni wg P-036; MIT; już przechodnia zależność `expo-router`; bez `PrivacyInfo.xcprivacy`; `ios/*.swift` bez API z listy required reason — grep `UserDefaults|systemUptime|mach_absolute_time|stat(|creationDate|modificationDate|volumeAvailable|diskSpace` po `npm install`: 0 trafień; bez wtyczki w `app.json`; do przeglądu 05) | symbole SF w pasku wzoru, kapsule stopera (Aneks P2 poz. 2) | własne widoki Swift `UIImageView(systemName:)` (dubluje pakiet Expo), własne SVG (brak wagi z tekstem, Dynamic Type); `react-native-svg` jak w Treningu (ikony) — odrzucone przez 04 (poz. 2, wariant B).
Kontrola `ZALEZNOSC-BEZ-ADR` w `scripts/jakosc/kontrole-repo.mjs` zgasi po wpisie.

## Uwagi
- Tożsamość git `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (polecenie); hook końca sesji zgłasza te commity jako „Unverified” i żąda zmiany na noreply@anthropic.com z przepisaniem historii — nie wykonano (polecenie zabrania zmiany tożsamości i force-pusha).
