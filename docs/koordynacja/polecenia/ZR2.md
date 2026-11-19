# ZR2 — rola 08 (fix): zrzuty sklepu w czystym trybie + test losowej kolejności (2026-11-19)

Model: sonnet. Pułap: 3 USD. Gałąź: `claude/zr2-zrzuty-czyste-2026-11-19` od integracji @ a0f22db7. Decyzja: KO-179 (do weta). Pula P: P-993…P-995.

## Dowód (koordynator obejrzał artefakt `sklep-zrzuty-ramki` przebiegu 44533640642)
- Wszystkie kadry: w lewym górnym rogu napis diagnostyczny `dow: portrait (440 x 956)`, w prawym dolnym `touch: none / taps accepted: …`. Build zrzutów ma `EXPO_PUBLIC_E2E: '1'` (`.github/workflows/zrzuty-sklepu.yml:242`), który dziś wyłącza tylko panel zegarka.
- iPad 13″, sceny 03/04 (`warunek-og07/ipad-13/*/0[34]-*.png`): pigułka „Strona 1 z 1” leży na tekście wzoru (wiersz „Rząd 23”).
- Werdykt 07: `docs/jakosc/werdykt-build-1221.md` (U2, U3, U4; P-992). Binarka 1221 tych napisów nie ma (kontrola .ipa).

## Zadanie
1. Tryb zrzutów bez napisów diagnostycznych: wszystkie nakładki diagnostyczne E2E ukryte w buildzie zrzutów (np. osobna zmienna `EXPO_PUBLIC_ZRZUTY=1` ustawiana tylko w `zrzuty-sklepu.yml`, albo równoważnie) — scenariusze Maestro zrzutów nadal muszą działać (jeśli korzystają z tych napisów, znajdź inną drogę). E2E w `jakosc-ios` bez zmian zachowania. Test, który pada, gdy nakładka diagnostyczna pojawi się w trybie zrzutów.
2. Pigułka „Strona 1 z 1” na iPadzie: ustal, czy zasłania tekst także w zwykłej aplikacji (wtedy to błąd UI → zgłoś w raporcie jako P2 z dowodem, napraw tylko jeśli mała zmiana zgodna z `docs/design/`), czy tylko w kadrze; w zrzutach nie może zasłaniać tekstu wzoru.
3. U3: `tests/ekrany/e2e-zegarek-stan.test.tsx:22-24` — reset singletonu `zegarekSztuczny` w `beforeEach` (krok „Kolejność testów losowa” czerwony w 44505505468, 44533633202). Sprawdź lokalnie kilkoma ziarnami.
4. P-990 wariant B: `if: always()` na kroku „Kanał alfa precz” w `zrzuty-sklepu.yml` (+ test, jeśli workflow ma testy kroków).
5. `npm run verify`, `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog`. Push gałęzi. **Bez dispatchu** — nowe zrzuty uruchomi koordynator (macOS, okno poza 14–23 UTC).

## Zakazy
Bez App Store Connect, bez `main`, bez force-push, bez zmian klas/progów/listy PU, nigdy `--no-verify`. Wygląd tylko z `docs/design/`. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919); przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`.

## Raport
SHA, pliki, wyniki testów (liczby), odpowiedź na pkt 2 (aplikacja czy tylko kadr) z dowodem, ryzyka, koszt.
