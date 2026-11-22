# 04 fix M3-S3-01…08 — dowody E2 (2026-11-08)

Gałąź `claude/kopia-04-mapa-tokenow-2026-11-08` od 3332920e; zmiany tylko w `docs/design/`. Status każdego ID: naprawione-do-weryfikacji (weryfikuje `reaudit`).

| ID | Rodzaj | Commit | Dowód (komenda → wynik) |
|---|---|---|---|
| M3-S3-01 | D | afa7288 | `node docs/design/narzedzia/mapa-tokenow.mjs docs/design` → kod 0, „183 pozycji (159 z tokenem, 24 usuniętych z powodem)”; `docs/design/dzianina/mapa-tokenow.md` |
| M3-S3-02 | D | 0a39dd1, afa7288 | `node docs/design/narzedzia/kontrast.mjs docs/design/dzianina/kontrast-pary.json` → kod 0, 206 par (było 128) |
| M3-S3-03 | D (P-563 2a) | 0a39dd1, 1aafc29 | fontTools: najszersza cyfra 536/1000 → `typografia.cyfry.komorkaEm` 0.536; makieta: komórki `.cyf` |
| M3-S3-04 | M | 0a39dd1 | `python3 -I docs/design/narzedzia/pokrycie-kroju.py …` (CLDR 46) → `docs/design/dzianina/pokrycie-bree.txt`: 26 języków Bree, 9 systemowy; greka niepokryta (Δ Ω μ π) |
| M3-S3-05 | D | df568ff | `docs/design/testid.md`: 19 wierszy z „testID” z `design-spec.md` @ 3332920e, dosłownie |
| M3-S3-06 | D | 1aafc29 | zrzuty `dzis-limit-*`, `dzis-cofnac-*`, `projekty-uczciwe-*` (4 × 3); warsztat 390 → kod 0 |
| M3-S3-07 | D (P-563 10) | 1aafc29 | przed/po `przed/dzis-390-jasny.png` → `po/dzis-390-jasny.png`; `przed-po.png` |
| M3-S3-08 | D (P-563 12) | 1aafc29 | przed/po `przed/oferty-390-jasny.png` → `po/oferty-390-jasny.png` |
