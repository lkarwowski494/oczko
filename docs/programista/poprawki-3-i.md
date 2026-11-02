# Poprawki 3, sesja I (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-i-2026-11-02` (baza `claude/kopia-integracja-4-2026-11-02` b5b9ce5). Polecenie: `oczko-warsztat` 3ffdbd0 `koordynacja/role-2026-11-01/08-poprawki-3i.md`, sekcja I, przeczytane w całości. Na roboczą nie pushowano. P-315: `docs/fakty-wlasciciela.md` (hak startowy); repo `trening` nie było potrzebne (żadne pytanie do właściciela). Pliki `e2e/` nietknięte (07 analizuje #136).

## E0 (środowisko i stan wyjściowy)
- Linux (kontener), Node 22, brak Xcode, symulatora i Maestro: zrzutów przed/po nie ma; dowód wizualny to asercje stylu na prawdziwych tokenach i `t()`. Widoczność przy AX5 potwierdzi dopiero przebieg macOS.
- Stan wyjściowy: `npm ci` kod 0; baza koordynatora b5b9ce5 = verify kod 0, 334 zestawy, 3252 testy (nie powtarzałem na gołej bazie, bo każdy commit niżej kończy się czerwonym → zielonym na tym samym zestawie).
- Klasyfikacja: wszystkie pozycje **D** (defekt wobec design-spec/wzorca).

## Stan (3 z 3 ID sekcji I)
| ID | Rodzaj | Test (czerwony → zielony) | Commit | Wynik |
|---|---|---|---|---|
| F-a (F-09) brak linii „Now working row n” w trybie „rząd w trakcie” | D | `tests/ekrany/licznik.test.tsx` „F-09 / BR-LIC-012…”: czerwony (`licznik-teraz-rzad` w drzewie, `toBeNull` nie przechodzi) → zielony; ten sam test trzyma tryb „skończone” przy linii | 2af78b5 | zrobione |
| H-1 kapsuła stopera: limit skali ×1,8 → ×1,6 | D | `tests/ekrany/stoper-kapsula-rozmiar.test.tsx`: 2 z 2 nowych czerwone (`maxFontSizeMultiplier` 1,8 wobec 1,6; „trwa” i „wstrzymana”) → zielone | d9210c3 | zrobione |
| H-2 nagłówki sekcji poza ekranem projektu 15 → 13 pt | D | `tests/ekrany/naglowki-sekcji-13-reszta.test.tsx`: 8 z 8 czerwonych (15 wobec 13, oba motywy × 4 ekrany) → zielone; 2 strażniki zielone od początku (wartości tokenów; „Add to” zostaje 15) | 00ef3d1 | zrobione |

`env -u NODE_PATH npm run verify` na 00ef3d1 kod 0: **335 zestawów, 3265 testów** (baza 334 / 3252; +1 zestaw, +13 testów: 1 + 2 + 10). `docs/jakosc/e4/tabela-08.md` regenerowana narzędziem w każdym commicie (końcowo 265 plików testów, 171 zależnych, 0 błędów).

## Co zmieniono
- **F-a:** `Licznik.tsx:145` — warunek `!start && !oczka && s.znaczenie !== 'w_trakcie'`. Design-spec:905 (F-09): w tym trybie „bez linii „Now working row n” (liczba nią jest)”. Wyszukanie: `grep "licznik.teraz" src` → `Licznik.tsx:145` (poprawione) i `WzorPrzegladarka.tsx:209` (pasek licznika pod wzorem, inny ekran, spec go nie obejmuje; `wzor-przegladarka.test.tsx:37` oczekuje tej linii) — bez zmian. Linia celu w tym trybie nadal `[DO USTALENIA 01]`.
- **H-1:** nowa stała `MAX_SKALA_KAPSULY = 1.6` w `motyw.ts` (wyjątek P-277, obok `MAX_SKALA_MINUSA`), użyta w `Stoper.tsx:57` dla tekstu kapsuły (design-spec:528 „skala tekstu najwyżej ×1,6”). Ikona startu (⏱ bez sesji) zostaje przy 1,8 — spec ogranicza kapsułę.
- **H-2 (sprawdzenie wzorca przed zmianą):**

| Ekran | Wzorzec | Wynik |
|---|---|---|
| ListaProjektow „In progress”, „Finished” | `docs/design/ekrany.html`, `.naglowek-grupy` 13 px | → 13 pt |
| Sesje, nagłówki dni | `fix6-2026-10-26/sesje-historia.html:75` `.naglowek-grupy` 13 px (ekran `sesje`) | → 13 pt |
| Narzedzia „Stash”, „Calculations” | `fix6-2026-10-26/narzedzia-zdjecia.html`, `.naglowek-grupy` 13 px | → 13 pt (osobny klucz `naglowekGrupy`) |
| Ustawienia „Counting” | `fix10-2026-11-01/partia8.html:373` `.naglowek-grupy` Counting | → 13 pt |
| Narzedzia, etykiety wyników próbki (`probka.wynik_oczka`, `probka.grubosc`) | `narzedzia-zdjecia.html`, `small.etyk` 15 px | **zostają 15** |
| WzorSkrzynka „Add to” | `fix7-2026-10-26/udostepnij-icloud.html`, `p.etyk` 15 px | **zostaje 15** (strażnik w teście) |

Wspólnego stylu nagłówka sekcji nie ma (każdy ekran ma własny klucz `naglowek`, H-1c użyło `typografia.drobny` w trzech miejscach), więc bez nowej abstrakcji: `typografia.drobny` w każdym ekranie. Wybór: wspólny helper w `motyw.ts` byłby czystszy, ale to refaktor 9 ekranów poza zakresem I; rekomendacja — osobne ID strukturalne, gdy 04 potwierdzi jeden styl.

## Nowe znaleziska (nienaprawione; do decyzji koordynatora / 04)
1. **Narzedzia: nagłówki grup mają pogrubienie 700, wzorzec `.naglowek-grupy` go nie ma** (`Narzedzia.tsx`, `naglowekGrupy`). Zostawiłem pogrubienie (polecenie dotyczyło rozmiaru). P2, 04 rozstrzyga: zdjąć 700 albo uznać za wariant.
2. **HistoriaDni: nagłówki bloków** (`HistoriaDni.tsx:92` `naglowekBloku`) to `typografia.tresc` 17 pt, 700, `grafit`; makieta `sesje-historia.html` (ekran `historia`: „Wednesday, Oct 21”, „Week of Oct 19”, „October”) używa `.naglowek-grupy` 13 pt `olowek`. Odchylenie większe niż 15 → 13 i poza listą polecenia. P2, realny; do 04.
3. **Stoper: nagłówek menu** (`Stoper.tsx:92` `naglowek` = `typografia.podpis` 15 pt `olowek`) — czy menu stopera („Started at …”) ma ten sam wzorzec, nie sprawdzałem (inny element niż nagłówek sekcji). Brzegowy, P2.
4. **`WzorPrzegladarka.tsx`** nadal pokazuje „Now working row n” (`:209`) w pasku licznika pod wzorem także w trybie „rząd w trakcie”; design-spec:905 mówi o ekranie licznika, więc rozstrzygnięcie dla paska pod wzorem u 04.

## Uwagi
- Tożsamość git `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (ustawiona lokalnie); w commitach bez `Co-Authored-By` i bez identyfikatorów modelu, zgodnie z poleceniem.
- Swift i urządzenie: bez zmian (tylko TypeScript).
- Test czerwony przed poprawką uruchomiony dla każdego ID na kodzie sprzed poprawki; zrzuty przed/po: niewykonane (Linux).

## Czas
Praca agenta ok. 40 min (odczyt polecenia i wzorców ok. 20, testy i poprawki ok. 15, `verify` 1 raz ok. 4). Czekanie: `npm ci`, pełny zestaw. Czas właściciela: 0.

## Następny krok
Koordynator: scalenie gałęzi sesji do roboczej i jeden push `[e2e-pelny] [e2e-ciemny]`; w przebiegu sprawdzić na zrzutach: brak linii „Now working row n” w trybie „rząd w trakcie” (jeśli scenariusz go używa), kapsuła stopera przy AX5 (×1,6), nagłówki Projects / Sessions / Tools / Settings (13 pt).
