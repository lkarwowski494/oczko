# M3 p6: testy zmienione przy przebudowie zakładki Narzędzia (+ włóczka)

2026-11-08 · rola 08 · gałąź `claude/kopia-08-p6-2026-11-08` od 936a1227.

**Zastąpione, usunięte ani osłabione: żaden test.** Wszystkie 13 plików testów partii (`narzedzia-probka`, `narzedzia-wzor`, `narzedzia-wstecz-trasa`, `zapas`, `zapas-kompozycja`,
`drut-rozmiar-3125-trasa`, `probka-szydelko-066`, `m2-036-hak-bez-szerokosci`, `ukonczenie-zapas`, `naglowki-p2-4`, `naglowki-sekcji-13-reszta`, `pasek-symbole-033-036`,
`m1-196-tysiace`, `m1-052-glosariusz-jednostek`) przeszły bez zmian po przejściu na tokeny Dzianiny (wartości te same: aliasy `motyw.ts` wskazywały na te tokeny).
zbiór testID w 10 plikach partii bez zmian (porównanie `grep -o testID` na 936a122 i na HEAD: identyczne we wszystkich); E2E 16, 40, 41 nie wymagają zmian.

## Testy dodane (test przed kodem)
| Test | Przed | Po |
|---|---|---|
| `tests/dzianina/p6-narzedzia-tokeny.test.ts` (10 przypadków: 10 plików partii bez starych nazw ról) | 3 czerwone z właściwego powodu (`Narzedzia.tsx`, `Zapas.tsx`, `Miary.tsx`: `k.papier`, `k.grafit`, `promien.grupa`… → token Dzianiny) | 10 zielonych |
| `tests/ekrany/narzedzia-kroj-m3.test.tsx` (5 ekranów × 2 przypadki; M3-S3-04) | 5 czerwonych (ru, ja, vi, uk, zh-Hant: `Received: "Bree Serif"`, oczekiwany brak), 5 zielonych (łacina i brak `jezyk`) | 10 zielonych |
