# Poprawki 04, sesja D (rola 08, tryb fix; 2026-11-02, P-360)

Gałąź: `claude/kopia-poprawki-d-2026-11-02` (baza c649f78 + merge roboczej 23a21eb, same docs). Polecenie: `oczko-warsztat` 97e37c5 `koordynacja/role-2026-11-01/08-poprawki-04.md`, sekcja D. Na roboczą nie pushowano. Wygląd i teksty tylko z `docs/design/` (aneks partii 8, `fix11-2026-11-02/klucze.json`).

## Stan wyjściowy
`env -u NODE_PATH npm run verify` na c649f78 + merge docs, przed zmianami: kod 0, 311 zestawów, 3125 testów. (Pierwsze uruchomienie zaraz po `npm ci` dało błędy modułów w typecheck — przejściowe, powtórzone czysto.)

## ID i commity
| ID | Co | Test (przed → po) | Commit |
|---|---|---|---|
| D1 klucze | 7 nowych kluczy w `en.json`, `en.kontekst.json`, `oczekujace.json` (74 → 81); porównanie 7 potwierdzonych | `klucze-fix11-poprawki-d.test.ts`: 3 czerwone (brak kluczy) → zielone; 4 strażniki zielone od początku | f40cf9f |
| D1 poz. 3 | `projekt.miejsce_wzoru_strona`: „Pattern: Page 3” przy zapisanej stronie bez rzędu znacznika | `projekt-miejsce-wzoru.test.tsx`: czerwony („Unable to find … Pattern: Page 3”) → zielony | 885c317 |
| D1 poz. 5 | `licznik.wpisz_blad_format` z `{{przyklad}}` = `formatujLiczbe(1000, język)` | `formularze.test.tsx` (3 nowe) + `wpisanie-trasa.test.tsx` (oczekiwany napis): 4 czerwone → zielone | 4237b2f |
| D1 poz. 11 | `wzor.blad_zapis` + `_opis` zamiast `licznik.blad_zapisu` przy dodawaniu wzoru | `wzor-dodawanie.test.ts` czerwony → zielony; K-17d (`wzor-trasa-strona-bez-sieci.test.tsx`) oczekiwany alert zmieniony | 09e0641 |
| D1 poz. 9 | `wzor.notatka_edytuj_a11y` na przycisku „Edit” arkusza notatki | `wzor-notatka-arkusz.test.tsx` czerwony (Received „Edit”) → zielony | b627670 |
| D3 (04-013) | Okno „Delete all data”: patrz niżej | `usun-wszystko-tresc.test.tsx` (de, pl, fr, ja) + test listy: 5 czerwonych → zielone | 65d449d |
| D2 | ▸/▾ przy starszym wpisie historii, `expanded`, stała etykieta, podpowiedź, 44 pt | `historia-rozwin.test.tsx`: 4 czerwone → zielone | 26970ad |

## Porównanie 7 wartości roboczych z aneksem 04 (D1)
Wszystkie zgodne co do znaku z `klucze.json`, różnic treści nie ma: `oferty.pro_wlaczone` „Oczko Pro is on.”, `ustawienia.grupa_liczenie` „Counting”, `projekt.miejsce_wzoru_wartosc` „Page {{strona}}, row {{rzad}}”, `wzor.notatka_edytuj` „Edit”, `wzor.przed_schematem` „Before the pattern”, `wzor.znacznik_napis` „Row {{n}}”. „Undo is available.” to drugie zdanie `licznik.seria_one/_other` (nazwa po stronie 08; brak osobnego klucza). Korekta P-330: `ustawienia.pro_wlaczone` = „On”, zdanie to `oferty.pro_wlaczone` — zgodne.

## D3 · 04-studio-projektowe-013: wynik
- Treść w kodzie c649f78 jest zgodna z design-spec (sekcja 012): `ustawienia.usun_pytanie` „…from this device.”, akapity `usun_kopia` i `usun_pro` (`src/ekrany/UsunWszystko.tsx`). Zrzut z #135 pochodzi z 53693f3, a łatka 8a (21bce6b) **nie jest** przodkiem 53693f3 (`git merge-base --is-ancestor` → nie) — w en to było już naprawione integracją.
- Realny defekt, który został: w 34 językach `ustawienia.usun_pytanie` miało stare tłumaczenie („…na tym iPhonie? Tego nie można cofnąć.”), nieprawdziwe przy kopii przed usunięciem (P-328). Naprawa jak P-357 dla `dane.zastapiono`: tłumaczenia usunięte (do fali przekładu tekst z en), klucz na `oczekujace.json` (82 klucze).
- Poza zakresem (zgłoszone): 6 kluczy `icloud.*` z łatki (`zastapEn`) ma stare tłumaczenia z „iPhone” zamiast „device” — niegroźne, do fali 09.

## Zmiany oczekiwań w istniejących testach (nie osłabione; zakres asercji ten sam)
`wpisanie-trasa.test.tsx` (dwie linie: napis błędu z przykładem), `wzor-dodawanie.test.ts` (alert dla `zapis` — tytuł i opis z aneksu), `wzor-trasa-strona-bez-sieci.test.tsx` K-17d (alert zapisu zlecenia). Powód: aneks 04 zmienia te teksty (poz. 5, 11).

## Do decyzji koordynatora (P-087)
1. **Przykład `{{przyklad}}` w pl, es, pt**: `Intl.NumberFormat` pisze 1000 bez separatora (minimalne grupowanie CLDR: pl-PL „1000”, es-ES „1000”), a aneks zakłada „1 000”. Wdrożono `formatujLiczbe(1000, język)` (zero ryzyka). Alternatywa: `useGrouping: 'always'` (dałoby „1 000”, „1.000”) — niesprawdzona na Hermes iOS (`PlatformIntlApple`), więc nie wdrożona.
2. **`{{wpis}}` w etykiecie historii**: aneks podaje przykład „30 → 31 at 20:14”, ale nie dał klucza na „at”; użyto tekstu wiersza („20:14 · 30 → 31”, bez sklejania nowych napisów). Zmiana na „… at …” wymaga nowego klucza od 04.
3. **`formularz.wpisz_blad`** jest nieużywany (zastąpiony `licznik.wpisz_blad_format`); zostaje w 37 plikach do sprzątnięcia przy fali 09.
4. **`licznik.blad_zapisu`** nadal pokazują Ustawienia, Miary, formularze projektu (pytanie 04 [DO USTALENIA 08] z poz. 11): treść mówi o „wierszu”; wymaga osobnej decyzji (własny tekst w Ustawieniach?).

## Nie sprawdzono
VoiceOver, wygląd ▸/▾ na urządzeniu i zrzuty (P-226; brak symulatora). Swift nie dotknięty.

## Następny krok
Brak pozostałych ID sekcji D. Koordynator: merge D + A + B + C (+ E), jeden push z `[e2e-pelny] [e2e-ciemny]`.
