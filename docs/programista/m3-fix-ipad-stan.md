# M3-IPAD-01 — pasek wzoru na iPadzie (rola 08, fix) · 2026-11-09

Gałąź `claude/kopia-08-fix-ipad-2026-11-09` od 193870e6 (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-fix-ipad.md` @ 0222d38. Klasa znaleziska: **D** (defekt wyglądu/układu; zachowanie i testID bez zmian).

## Przyczyna (odtworzona poza urządzeniem)
Zrzut `ipad-wzor-pasek.png`: −1 przy lewej krawędzi, liczba bez szerokości, „+1” 64 pt. Układ Yoga odtworzony skryptem w scratchpadzie (`yoga-layout` 3.1.0, nie w repo; `pasekLicznika` row/wrap/gap 8/padding 16, −1 minWidth 64, blok i „+1” grow 1 / basis 0):
- rodzic stretch: pasek = pełna szerokość, blok liczby 424 pt, „+1” 488 pt (1024); poprawnie;
- rodzic centrujący (alignItems center) — pasek bez jawnej szerokości zwija się do 176 pt: −1 16+64, **blok 0 pt**, **„+1” 64 pt** — dokładnie jak na zrzucie. Wynik taki sam dla wrap i nowrap, przy 1366/1024/640/390/320.
Która warstwa rodzica centruje na iPadzie — nieustalone (brak urządzenia); poprawka nie zależy od rodzica.

## Poprawka
`src/ekrany/WzorLicznik.tsx`: `pasekLicznika` + `alignSelf: 'stretch'`, `width: '100%'`. Yoga z poprawką: pasek 0+1024/640/390/320 przy obu wariantach rodzica, blok 424/232/107/72, „+1” 488/296/171/136; „−1” 64, „+1” w całości. Makieta (`.pasek-wz`: flex, wrap, −1 64 min, liczba i „+1” flex:1) bez zmian; od AX1 (kolumna) bez zmian.

## Testy
`tests/ekrany/wzor-pasek-ipad.test.tsx` (nowy, 10 testów): przed poprawką 6 × czerwone (brak `alignSelf`/`width` przy 1366, 1024, 390, 320, AX1 przy 1366 i 320), 4 zielone (kontrakt grow/basis/min, kolumna obok); po poprawce 10/10. Pliki testów partii (`wzor-pasek-dzianina`, `wzor-przegladarka`, `tytuly-limit-skali`) zielone bez zmian. Zastąpione testy: brak.
Jest nie układa elementów — test sprawdza styl gwarantujący układ; sam układ potwierdza skrypt Yoga (poza repo) i zrzut z przebiegu 3 na iPadzie.

## Kontrast „−1” w ciemnym motywie (tylko raport)
`tokeny.json` (ciemny): `tekst`/`pasek` 14,84:1, `tekst`/`tlo` 13,67:1, obrys `tekst2`/`pasek` 9,27:1; jasny: 14,03 / 12,83 / 6,60. Rachunek WCAG 2.x. Etykieta „−1” na liczniku (`LicznikStyl.minusTekst` = `grafit` = `tekst`) i na pasku (`minusTekst` = `tekst`) czyta token. Zrzut p1 pochodzi sprzed p2–p7 (układ AS IS) — w nim ciemna etykieta; w obecnym kodzie wartość z tokenów ≥ 4,5:1, brak znaleziska. Poza zakresem, widoczne na zrzucie p1: wiersze „first 49 ms” i „Watch state” ciemne na ciemnym (diagnostyka E2E, nie sprawdzano w kodzie).

## Nie sprawdzono
Urządzenie i symulator iPada (brak macOS); zrzut „po”; scenariusz 46 (wąskie okno 375) — czy czerwony z tej samej przyczyny, nieustalone (nie czytano logu przebiegu); E2E iOS uruchamia koordynator.
