# M3 p1 „Dzianina” — stan partii (rola 08, build) · 2026-11-08

Gałąź `claude/kopia-08-p1-2026-11-08` od `claude/youthful-pasteur-kx83sn` @ a5400ff2 (HEAD zgodny). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p1.md` @ c01b4e5.

## Stan wyjściowy (przed zmianami)
`npm test`: 498 zestawów, **5216 testów**, kod 0 (log w scratchpadzie sesji). `npm run verify` pełny na końcu.

## Czerwone przed kodem (zasada 11)
Nowe/zmienione testy napisane przed kodem, uruchomione na bazie partii (tokeny i `motyw.ts` starego systemu):
- 8 zestawów, 56 testów: **45 czerwonych**, 11 zielonych (zielone: m.in. ikony SHA starego systemu, zachowanie testID); czerwień z asercji o tokenach Dzianiny (`expected "#E6E1DA", received undefined`), brak „Dzianina” w pierwszej linii `design-spec.md`, brak archiwum; 3 zestawy nowych modułów (`liczba`, `dzianina-geometria`, `Dzianina`) początkowo „Cannot find module” → dodane zaślepki → 4 zestawy `tests/dzianina`: **68 czerwonych / 3 zielone z 71** (asercje, w tym `krojTytulowy is not a function`).
- Po implementacji `tests/dzianina`: 4 zestawy, 72 testy zielone.

## Zrobione (commity `[M3 p1] …`)
1. abcd11d zależność `react-native-svg` 15.15.4 (+ PRZYPIETE, wiersz ADR-0016).

## W toku / do zrobienia (kolejność)
- podmiana systemu: stary `design-spec.md`/`tokeny.json`/`ikona/` → `docs/design/archiwum/2026-11-08-kreski/`; Dzianina na miejsce (zrobione lokalnie, niezacommitowane)
- `motyw.ts` na tokeny Dzianiny z aliasami z mapy (zrobione lokalnie), komponenty wspólne `Arkusz`, `Formularze`, `Pasek`, `SymbolSf`, `StanWczytywania` (przycisk wypełniony, nieaktywny z ramą przerywaną, bez obrysu)
- krój Bree (zrobione lokalnie: assets/fonts, app.json), ikona i splash (assets + app.json tła), haptyka (adapter + testy), atlas (3 skrypty + 3 testy), `e2e-kontrakt-04`, pozostałe testy czytające stary system
- `npm run verify`, `jakosc:kontrole`, raport do koordynatora (≤ 15 linii) z listą zastąpionych testów

## Decyzje własne partii / odstępstwa (do raportu)
- Aliasy starych nazw ról w `motyw.ts` (papier, grafit…) wg `mapa-tokenow.md`: ekrany p2–p8 niezmienione w p1; `blad` → `niszczacy` (pozostałe użycia to działania usuwające), `tekstNaZakreslaczu` → `naAkcencie` (odstępstwo od mapy: żółć zakreślacza w obu motywach).
- Kontrast: linia (`linia`) w „Zwiększ kontrast” 2,35:1 — para „dekoracyjna (informacyjnie)” w kontrast-tabela.txt; test sprawdza zakładkę/pasek zamiast linii.
- `docs/design/{design-spec.md,tokeny.json,ikona/}` to **kopie** z `docs/design/dzianina/` (źródło prac 04), ścieżki w design-spec poprawione.
