# M3-IPAD-01 — pasek wzoru na iPadzie (rola 08, fix) · 2026-11-09

Gałąź `claude/kopia-08-fix-ipad-2026-11-09` od 193870e6 (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-fix-ipad.md` @ 0222d38. Klasa znaleziska: **D** (defekt wyglądu/układu; zachowanie i testID bez zmian).

## Przyczyna (odtworzona poza urządzeniem)
Zrzut `ipad-wzor-pasek.png`: −1 przy lewej krawędzi, liczba bez szerokości, „+1” 64 pt. Układ Yoga odtworzony skryptem w scratchpadzie (`yoga-layout` 3.1.0, nie w repo; pasek row/wrap, gap 8, padding 16 → grupa `przyciski` (row, `alignSelf: stretch`, bez szerokości) → −1 minWidth 64, blok liczby i „+1” grow 1 / basis 0):
- grupa `przyciski` zwija się do zawartości: −1 64 pt, **blok liczby 0 pt**, **„+1” 64 pt** (grupa 104 pt) — jak na zrzucie; przy 1024, 390 i 320 pt, także gdy pasek ma pełną szerokość i niezależnie od `alignItems` rodzica;
- z `width: 100%` albo `flexGrow: 1` + `flexBasis: 100%` na grupie: blok 424 / 107 / 72 pt, „+1” 488 / 171 / 136 pt (1024 / 390 / 320).
Wskazówka koordynatora (hipoteza z kodu od 07) potwierdzona; pierwsza wersja poprawki (9cf2b2b, `alignSelf`/`width` na samym pasku) opierała się na błędnym modelu (bez zagnieżdżonej grupy) i nie usuwała przyczyny — cofnięta w kolejnym commicie.

## Poprawka
`src/ekrany/WzorLicznik.tsx`: `przyciski` + `width: '100%'` (`pasekLicznika` bez zmian). Makieta (`.pasek-wz`: flex, wrap, −1 min 64, liczba i „+1” flex:1), testID, zachowanie i układ od AX1 bez zmian.

## Testy
`tests/ekrany/wzor-pasek-ipad.test.tsx` (nowy, 10 testów): na kodzie sprzed poprawki 6 × czerwone (brak `width: 100%` grupy `wzor-pasek-przyciski` przy 1366, 1024, 390, 320, AX1 przy 1366 i 320), 4 zielone (kontrakt grow/basis/min, kolumna obok); po poprawce 10/10. Pliki testów partii (`wzor-pasek-dzianina`, `wzor-przegladarka`, `tytuly-limit-skali`) zielone bez zmian. Zastąpione testy: brak.
Jest nie układa elementów — test sprawdza styl gwarantujący układ; sam układ potwierdza skrypt Yoga (poza repo), a docelowo zrzut z iPada w przebiegu 3.

## Kontrast „−1” w ciemnym motywie (tylko raport)
`tokeny.json` (ciemny): `tekst`/`pasek` 14,84:1, `tekst`/`tlo` 13,67:1, obrys `tekst2`/`pasek` 9,27:1; jasny: 14,03 / 12,83 / 6,60. Rachunek WCAG 2.x. Etykieta „−1” na liczniku (`LicznikStyl.minusTekst` = `grafit` = `tekst`) i na pasku (`minusTekst` = `tekst`) czyta token. Zrzut p1 pochodzi sprzed p2–p7 (układ AS IS) — w nim ciemna etykieta; w obecnym kodzie wartość z tokenów ≥ 4,5:1, brak znaleziska. Poza zakresem, widoczne na zrzucie p1: wiersze „first 49 ms” i „Watch state” ciemne na ciemnym (diagnostyka E2E, nie sprawdzano w kodzie).

## „Dziś”: „+1 row” poza kołem (P-606, wariant a — naprawione)
`Dzis.tsx` `dzis-plus` = koło 72 × 72 pt (`cel.plus`), tekst „+1 row” / „+1 rząd” / „+1 stitch” w kroju `przyciskPlus` 26 pt, waga 800 był szerszy niż koło (makieta `.plus` 72 px). Decyzja koordynatora P-606 (a): widoczna etykieta tylko „+1”, etykieta VoiceOver bez zmian (ta sama co `licznik-plus`), bez nowego klucza i18n (`oczekujace.json` bez zmian; „+1” to znak w kodzie, `i18n:kod` w `jakosc:kontrole` kod 0; brak istniejącego klucza z samym „+1”). Test przed kodem `tests/ekrany/dzis-plus-etykieta.test.tsx` (4): przed 3 × czerwone („+1 row”, „+1 stitch”, „+1 row” zamiast „+1”), po 4/4; koło nadal 72 × 72. Klucze `licznik.plus` i `licznik.plus_oczka` zostają (używa ich licznik, pasek wzoru i etykieta pierwszego licznika).
E2E (`e2e/`, nie ruszane): scenariusze z asercją tekstu `dzis-plus` — nie znaleziono grepem po `dzis-plus` z `text`.

## Nie sprawdzono
Urządzenie i symulator iPada (brak macOS); zrzut „po”; scenariusz 46 (wąskie okno 375) — według koordynatora pada z innej przyczyny (scenariusz), nie wiązany z tą poprawką; log przebiegu nie czytany; E2E iOS uruchamia koordynator.
