# M3 p1 „Dzianina” — stan partii (rola 08, build) · 2026-11-08

Gałąź `claude/kopia-08-p1-2026-11-08` od `claude/youthful-pasteur-kx83sn` @ a5400ff2 (HEAD zgodny). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p1.md` @ c01b4e5.

## Stan wyjściowy (przed zmianami)
`npm test`: 498 zestawów, **5216 testów**, kod 0 (log w scratchpadzie sesji). `npm run verify` pełny na końcu.

## Czerwone przed kodem (zasada 11)
Nowe/zmienione testy napisane przed kodem, uruchomione na bazie partii (tokeny i `motyw.ts` starego systemu):
- 8 zestawów, 56 testów: **45 czerwonych**, 11 zielonych (zielone: m.in. ikony SHA starego systemu, zachowanie testID); czerwień z asercji o tokenach Dzianiny (`expected "#E6E1DA", received undefined`), brak „Dzianina” w pierwszej linii `design-spec.md`, brak archiwum; 3 zestawy nowych modułów (`liczba`, `dzianina-geometria`, `Dzianina`) początkowo „Cannot find module” → dodane zaślepki → 4 zestawy `tests/dzianina`: **68 czerwonych / 3 zielone z 71** (asercje, w tym `krojTytulowy is not a function`).
- Po implementacji `tests/dzianina`: 4 zestawy, 72 testy zielone.

## Zrobione (commity `[M3 p1] …`)
abcd11d zależność react-native-svg 15.15.4 · 4d58677 podmiana systemu + atlas · 15344b3 motyw, komponenty wspólne, krój, ikona, Dzianina, Liczba · cbca02a przeniesienie nowych testów do katalogów tabeli 07→08 · 0a7616e, d1279e6, b9f8a27 testy starego systemu → Dzianina (wykaz: `m3-p1-zastapione-testy.md`) · ostatni: tabela-08 + stan.

## Dowody (koniec partii)
`npm run verify` kod 0: 502 zestawy, **5289 testów** (baza 5216); `jakosc:kontrole` w ramach verify kod 0 (i18n:kod bez błędów); atlas `generuj.mjs --check` i `waliduj.mjs` 0 błędów. Nie sprawdzono: urządzenie (VoiceOver, haptyka, cyfry w komórkach, SF Symbols), E2E iOS (koordynator), zrzuty (brak Expo web).

## Do zrobienia przez następne partie / 04
Wpięcie `Liczba`/`Dzianina`/`typografiaDzianiny`/`krojTytulowy(język)` w ekrany (p2–p7); haptyka (adapter bez zmian do p3a); ikona wyboru zamiast ✓ (p4); usunięcie aliasów starych nazw ról.

## Decyzje własne partii / odstępstwa (do raportu)
- Aliasy starych nazw ról w `motyw.ts` (papier, grafit…) wg `mapa-tokenow.md`: ekrany p2–p8 niezmienione w p1; `blad` → `niszczacy` (pozostałe użycia to działania usuwające), `tekstNaZakreslaczu` → `naAkcencie` (odstępstwo od mapy: żółć zakreślacza w obu motywach).
- Kontrast: linia (`linia`) w „Zwiększ kontrast” 2,35:1 — para „dekoracyjna (informacyjnie)” w kontrast-tabela.txt; test sprawdza zakładkę/pasek zamiast linii.
- `docs/design/{design-spec.md,tokeny.json,ikona/}` to **kopie** z `docs/design/dzianina/` (źródło prac 04), ścieżki w design-spec poprawione.
