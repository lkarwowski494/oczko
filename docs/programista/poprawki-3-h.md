# Poprawki 3, sesja H (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-h-2026-11-02` (baza roboczej 2a83370). Polecenie: `oczko-warsztat` 255950b `koordynacja/role-2026-11-01/08-poprawki-3.md`, sekcja H, przeczytane w całości. Na roboczą nie pushowano. P-315: `docs/fakty-wlasciciela.md` (hak startowy); repo `trening` nie było potrzebne (żadne pytanie do właściciela).

## E0 (środowisko i stan wyjściowy)
- Linux (kontener), Node 22.23.4, brak Xcode, symulatora i Maestro: zrzutów przed/po nie ma; dowód wizualny to asercje stylu na prawdziwych tokenach. Widoczność przy AX5 potwierdzi dopiero przebieg macOS.
- `npm ci` kod 0. Stan wyjściowy 2a83370: `typecheck`, `typecheck:testy`, `lint`, `jakosc:kontrole` kod 0; `npm test` 327 zestawów / 3215 testów, **1 czerwony: `tests/ekrany/projekt-trasa-film-siec.test.tsx` (`waitFor` 1 s pod obciążeniem pełnego zestawu), w izolacji 3 razy 5/5 zielone**. Niestabilność czasowa testu, bez związku z sekcją H; po moich zmianach pełny `verify` przeszedł za pierwszym razem. Zgłoszone koordynatorowi niżej (dla 07).
- Klasyfikacja: wszystkie pozycje **D** (defekt wobec wzorca). Pozycja 1 sprawdzona w `docs/design/` przed zmianą (tabela niżej).

## Sprawdzenie wartości wzorca (warunek z polecenia)
| Zgłoszenie | Wzorzec | Wynik |
|---|---|---|
| „Delete all data” 28 → 17 | `docs/design/fix8-2026-10-27/fix8.html:186` `.przycisk-niszczacy`: „font: 700 calc(17px …)”; `docs/design/design-spec.md:47` „wymiary jak przycisk pełny” | zgodne ze zgłoszeniem |
| Kapsuła stopera 28 → 17 | `docs/design/design-spec.md:528` „Libre Franklin 700 17 pt, cyfry tabelaryczne” | zgodne |
| Nagłówki sekcji projektu 15 → 13 | `docs/design/fix10-2026-11-01/partia8.html:76` i `fix11-2026-11-02/aneks8.html:75` `.naglowek-grupy`: „font-size: calc(13px …)”; token `typografia.drobny` = 13 | zgodne |
| Promień przycisku głównego 20 → 14 | `partia8.html:70` `.przycisk-pelny`: „border-radius: 14px”; `fix8.html:186` `.przycisk-niszczacy` 14; `design-spec.md:47` „promień 14” | zgodne dla przycisków pełnej szerokości w arkuszu. **Uwaga:** `tokeny.json` `promien.przyciskGlowny` = 20 opisuje strefę +1 (`partia8.html:56` `.plus` 20 px), nie przycisk pełny; 20 zostaje strefie +1 i kapsule |

## Stan (pozycja 1: 4 z 4; pozycja 2: 1 z 1)
| ID | Rodzaj | Test (czerwony → zielony) | Commit | Wynik |
|---|---|---|---|---|
| H-1a etykieta „Delete all data” 28 → 17 pt | D | `tests/ekrany/przycisk-niszczacy-rozmiar.test.tsx`: 3 z 3 czerwone (fontSize 28 wobec 17) → zielone | 61f6650 | zrobione |
| H-1b etykieta kapsuły stopera 28 → 17 pt | D | `tests/ekrany/stoper-kapsula-rozmiar.test.tsx`: 3 z 3 czerwone (28 wobec 17; pierwsza wersja selektora czerwona z niewłaściwego powodu, poprawiona przed poprawką kodu) → zielone | 48aceed | zrobione |
| H-1c nagłówki sekcji projektu 15 → 13 pt | D | `tests/ekrany/projekt-naglowki-sekcji-13.test.tsx`: 2 z 2 czerwone (15 wobec 13), oba motywy → zielone | 450019e | zrobione |
| H-1d promień przycisku głównego i niszczącego w arkuszu 20 → 14 | D | `tests/ekrany/przycisk-pelny-promien.test.tsx`: 3 z 3 czerwone (20 wobec 14) → zielone | c67cae5 | zrobione |
| H-2 tytuły ekranów bez limitu skali przy AX5 | D | `tests/ekrany/tytuly-limit-skali.test.tsx`: 4 z 5 czerwone (`maxFontSizeMultiplier` undefined wobec 1,8; kontrola klasy: 15 trafień) → 5 zielonych | 702b8d8 | zrobione |

`env -u NODE_PATH npm run verify` na 702b8d8 kod 0: **332 zestawy, 3231 testów** (stan wyjściowy 327 / 3215; +5 zestawów, +16 testów). `docs/jakosc/e4/tabela-08.md` regenerowana w każdym commicie (po końcowym: 262 pliki testów, 169 zależnych, 0 błędów).

## Co zmieniono
- **H-1a/H-1b:** `niszczacyTekst` (`Arkusz.tsx`) i `kapsulaTekst` (`Stoper.tsx`) używają `typografia.przyciskPelny` (Libre Franklin 700, 17 pt z `tresc`), jak etykieta przycisku głównego arkusza (04-studio-projektowe-008). Wyszukanie po poprawce: `grep "typografia.przycisk\b" src` → 4 trafienia, wszystkie to „−1” i „+1” (`LicznikStyl.ts:31,33`, `WzorPrzegladarka.tsx:281,284`), gdzie wzorzec ma 28 px (`.minus`, `.plus`), bez zmian.
- **H-1c:** `typografia.drobny` (13 pt) w nagłówkach `Projekt.tsx` (Parts, Time, Note, Details), `Zdjecia.tsx` (Photos; ten sam komponent w arkuszu włóczki „Label photo”) i `WzorGrupa.tsx` (Pattern/Patterns). Kolor `olowek` i brak pogrubienia bez zmian (testy 012 nadal zielone).
- **H-1d:** `glowny` i `niszczacy` w `Arkusz.tsx` mają `promien.przyciskDrugi` (14), bo tylko ten token ma dziś wartość 14; komentarz w kodzie. Kapsuła stopera i strefa +1 zostają przy 20.
- **H-2:** `maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}` (1,8) na 15 tytułach ekranów: `Projekt.tsx:113`, `LicznikArkuszLimitu.tsx:13`, `ListaProjektow.tsx:68`, `Kosz.tsx:19` (wskazane w poleceniu) oraz te same tytuły w `Dane.tsx:26`, `HistoriaDni.tsx:31`, `Jezyk.tsx:22`, `Miary.tsx:22`, `Narzedzia.tsx:48,79`, `Sesje.tsx:31`, `Ustawienia.tsx:47`, `WzorPrzegladarka.tsx:118`, `Zapas.tsx:22`, `ZrodlaWiedzy.tsx:14`. **Powracające dostaje trwałą kontrolę:** ostatni test w `tytuly-limit-skali.test.tsx` skanuje `src/ekrany/*.tsx` i pada, gdy tytuł w kroju tytułowym nie ma limitu. Ograniczenie dowodu: RNTL nie liczy układu; że tytuł mieści się przy AX5, potwierdzi przebieg macOS (scenariusz 30 i ekrany z długą nazwą projektu).

## Nowe znaleziska (nienaprawione; do decyzji koordynatora / 04 / 07)
1. **Kapsuła stopera: limit skali 1,8, spec mówi 1,6.** `Stoper.tsx:57` `maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}`; `design-spec.md:528` „skala tekstu najwyżej ×1,6”. Brzegowe (AX, jeden element). Wymaga stałej 1,6 w `motyw.ts` (jest P-277), więc nie ruszano; rola 04 albo koordynator.
2. **Nagłówki sekcji poza ekranem projektu nadal 15 pt:** `ListaProjektow.tsx:98`, `Sesje.tsx:73`, `WzorSkrzynka.tsx:49`, `Narzedzia.tsx:114` (700), `Ustawienia.tsx:57` (inline `podpis`). Makieta `partia8.html:273,278` (Ustawienia) używa `.naglowek-grupy` 13 pt, więc przynajmniej Ustawienia mają to samo odchylenie; polecenie H mówiło „nagłówki sekcji projektu”, więc zakres zachowany. Realność: realny, P2. Propozycja: osobne ID dla 04 (które ekrany wzorzec obejmuje).
3. **Brak tokenu promienia przycisku pełnej szerokości.** `promien.przyciskGlowny` (20) znaczy strefę +1, a przycisk pełny (14) pożycza `przyciskDrugi`. Nazwa tokenu wprowadza w błąd; token `przyciskPelny` = 14 w `tokeny.json` to sprawa roli 04 (wymiana jednej linii w `Arkusz.tsx` po jego dodaniu).
4. **Test `projekt-trasa-film-siec.test.tsx` niestabilny pod obciążeniem** (zob. E0): `waitFor` bez własnego limitu; sprawa roli 07.

## Czas
Praca agenta ok. 50 min (odczyt wzorców i kodu ok. 20, testy i poprawki ok. 20, `verify` 2 razy po ok. 3 min). Czekanie: `npm ci` i pełny zestaw. Czas właściciela: 0.

## Następny krok
Koordynator: scalenie gałęzi sesji F/G/H do roboczej i jeden push `[e2e-pelny] [e2e-ciemny]`; w przebiegu sprawdzić na zrzutach: etykiety „Delete all data” i kapsuły (17 pt), nagłówki ekranu projektu (13 pt), promień przycisków w arkuszach (14), tytuły przy AX5 (scenariusz 30 i nazwa projektu).
