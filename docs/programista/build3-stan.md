# Build 3 (poprawki fix11) — stan roli 08, tryb fix (2026-11-10)

Gałąź `claude/build3-2026-11-10` od 738b0d6; polecenie koordynatora `koordynacja:docs/koordynacja/polecenia/G.md` @ f28b195, prompt roli `oczko-warsztat` `koordynacja/polecenia/G-08-programista-fix-2026-11-10.md` @ f2c5da4. Specyfikacja: `docs/design/fix11-2026-11-10.md`. Decyzje: `docs/decyzje.md` P-666…P-669.

Stan wyjściowy (738b0d6, `npx jest --ci`): 569 zestawów, 6941 testów zielone.

| ID | Rodzaj | Commit | Test (przed → po) |
|---|---|---|---|
| B3-02 | D | 4eac4af | `tests/ekrany/b3-02-wzor-tytul.test.tsx`: 2 ✕ + 1 ✓ → 3 ✓ (limit ×1,8 na tekście tytułu z ▾; ▾ z wrapperem `flexShrink: 0`) |
| B3-01 | D | 3927cd5 | `tests/ekrany/b3-01-wzor-karty.test.tsx`: 2 ✕ → 2 ✓ (karta Word i pasek notatki z `MAX_SKALA_TYTULOWA`, bez `numberOfLines`) |
| B3-03 | D | 4d77afc | `tests/ekrany/b3-03-nastepna-czesc-strefa.test.tsx`: 6 ✕ + 1 ✓ → 7 ✓ (`licznik-strefa`, „Next part” pierwszy w strefie przy fontScale 1 / 2,643 / 3,571, ogłoszenie „Goal reached” raz); e2e 34 bez przeciągnięć |
| M1-245 | D | c10eb78 (struktura), 5f18372 (generator + kontrola), 6f53020 (klucze i18n), 587ffb6 (ekran + wiersz), 47c32cb (kontrola .ipa) | `tests/jakosc/licencje-generuj.test.ts` (zawijanie, kontrola `--check` + 4 mutanty), `tests/domena/licencje-dane.test.ts`, `tests/ekrany/m1-245-licencje.test.tsx` (8 ✕ + 1 ✓ → 9 ✓ na zaślepce ekranu), `tests/wydanie/licencja-ofl-w-pakiecie.test.ts` |

## Otwarte
- Bramka i18n wydania (KO-020, P-668): lista `oczekujace.json` ma 6 kluczy do fali 09; `--wydanie` w `kontrola-ipa.sh` pada do jej opróżnienia; wyjątek tylko w testach (`tests/i18n/wyjatek-build3.ts`).
- Układ i wygląd (strefa licznika, wiersze licencji, AX5) potwierdza E2E na macOS i recenzja; Jest sprawdza strukturę i atrybuty.
- Kontrola OFL na prawdziwym `.ipa` (grep w `kontrola-ipa.sh`) — tylko macOS w CI; na Linuksie sprawdzono bajtkod z `hermesc`.
- Noty i adresy plików licencji bibliotek natywnych przepisane z Treningu (wersje sprawdzane z podspec) `[DO USTALENIA 06]`.
