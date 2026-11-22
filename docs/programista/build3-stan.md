# Build 3 (poprawki fix11) — stan roli 08, tryb fix (2026-11-10)

Gałąź `claude/build3-2026-11-10` od 738b0d6; polecenie koordynatora `koordynacja:docs/koordynacja/polecenia/G.md` @ f28b195, prompt roli `oczko-warsztat` `koordynacja/polecenia/G-08-programista-fix-2026-11-10.md` @ f2c5da4. Specyfikacja: `docs/design/fix11-2026-11-10.md`. Decyzje: `docs/decyzje.md` P-666…P-669; sesja G2 (I-001, I-002 i scalenie gałęzi zrzutów): P-670, P-671. Polecenie G2: `koordynacja:docs/koordynacja/polecenia/G2.md` @ dbcc691.

Stan wyjściowy (738b0d6, `npx jest --ci`): 569 zestawów, 6941 testów zielone.

| ID | Rodzaj | Commit | Test (przed → po) |
|---|---|---|---|
| B3-02 | D | 4eac4af | `tests/ekrany/b3-02-wzor-tytul.test.tsx`: 2 ✕ + 1 ✓ → 3 ✓ (limit ×1,8 na tekście tytułu z ▾; ▾ z wrapperem `flexShrink: 0`) |
| B3-01 | D | 3927cd5 | `tests/ekrany/b3-01-wzor-karty.test.tsx`: 2 ✕ → 2 ✓ (karta Word i pasek notatki z `MAX_SKALA_TYTULOWA`, bez `numberOfLines`) |
| B3-03 | D | 4d77afc | `tests/ekrany/b3-03-nastepna-czesc-strefa.test.tsx`: 6 ✕ + 1 ✓ → 7 ✓ (`licznik-strefa`, „Next part” pierwszy w strefie przy fontScale 1 / 2,643 / 3,571, ogłoszenie „Goal reached” raz); e2e 34 bez przeciągnięć |
| M1-245 | D | c10eb78 (struktura), 5f18372 (generator + kontrola), 6f53020 (klucze i18n), 587ffb6 (ekran + wiersz), 47c32cb (kontrola .ipa) | `tests/jakosc/licencje-generuj.test.ts` (zawijanie, kontrola `--check` + 4 mutanty), `tests/domena/licencje-dane.test.ts`, `tests/ekrany/m1-245-licencje.test.tsx` (8 ✕ + 1 ✓ → 9 ✓ na zaślepce ekranu), `tests/wydanie/licencja-ofl-w-pakiecie.test.ts` |
| I-001 | D (P2) | 1aaa238 | `tests/ekrany/i-001-ogloszenie-celu-kolejka.test.tsx`: 2 ✕ + 2 ✓ → 4 ✓ („Goal reached” z `queue: true` po ogłoszeniu rzędu; `oglos` systemu → `announceForAccessibilityWithOptions`; Android bez wyjątku) |
| I-002 | D (P2) | e4b6f36 | `tests/domena/licencje-natywne-expo.test.ts`: 5 ✕ → 5 ✓ (openiap 3.6.0, SDWebImage 5.21.1, SDWebImageWebPCoder 0.14.6, libwebp 1.1.0; wersje zgodne z `expo-iap/openiap-versions.json` i `expo-image-manipulator/spm.config.json`) |

## Otwarte
- Bramka i18n wydania (KO-020, P-668): lista `oczekujace.json` ma 6 kluczy do fali 09; `--wydanie` w `kontrola-ipa.sh` pada do jej opróżnienia; wyjątek tylko w testach (`tests/i18n/wyjatek-build3.ts`).
- Układ i wygląd (strefa licznika, wiersze licencji, AX5) potwierdza E2E na macOS i recenzja; Jest sprawdza strukturę i atrybuty.
- Kontrola OFL na prawdziwym `.ipa` (grep w `kontrola-ipa.sh`) — tylko macOS w CI; na Linuksie sprawdzono bajtkod z `hermesc`.
- Noty i adresy plików licencji bibliotek natywnych przepisane z Treningu (wersje sprawdzane z podspec) `[DO USTALENIA 06]`.

## Sesja G2 (2026-11-10): stan po poprawkach i scaleniu
- Gałąź: `claude/build3-2026-11-10` od 5db0155; I-001 (1aaa238), I-002 (e4b6f36), scalenie `claude/e-zrzuty-sklepu-2026-11-10` @ 6cb9b8e (`--no-ff`, jedyny konflikt `docs/decyzje.md`: wiersze obu stron zachowane, P-653 z gałęzi E oraz P-661…P-671 i P-673, w kolejności numerów).
- Stan po I-001 i I-002 (e4b6f36): `npx jest --ci` 578 zestawów, 6985 testów, kod 0; `npm run typecheck`, `npm run lint`, `npm run jakosc:kontrole`: kod 0.
- Noty bibliotek z modułów Expo: wersje z `node_modules/expo-iap/openiap-versions.json`, `node_modules/expo-image-manipulator/spm.config.json` i logu CI (testflight run 42746522234, „Installing openiap (3.6.0)”, „SDWebImage.xcframework (5.21.1)”, „SDWebImageWebPCoder.xcframework (0.14.6)”); libwebp 1.1.0 z `WebPGetDecoderVersion()` w binarium (0x010100). Noty i treść z tagów repozytoriów (adresy w `licencje-natywne.json`).

## Zostaje do 1.0.1
- I-003, I-004, I-005 (znaleziska recenzji `08-recenzja-2026-11-10`, poza zakresem G2).
- `licencje-generuj.mjs --check`: porównanie wersji z podspec modułów Expo i z xcframeworkami (dziś wpisy z `zrodloWersji` są pomijane, zgodność pilnuje `tests/domena/licencje-natywne-expo.test.ts`).
- Tekst licencji BSD-3-Clause jest jeden wg SPDX (z pakietu `makeerror`, w punkcie 3 „Naitik Shah”) i pokazuje się przy libwebp, glog, double-conversion i SocketRocket; nota o prawach autorskich przy wierszu jest właściwa. Poprawka: tekst licencji na pod (zmiana modelu danych i ekranu).
- Otwarte punkty recenzji: bez zmian względem sekcji „Otwarte” wyżej.
